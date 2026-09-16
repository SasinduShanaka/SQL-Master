process.env.SQLMASTER_CONTENT_DB = ':memory:'
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server-core')
const { connectDatabase } = require('../db')
const User = require('../models/User')
const Session = require('../models/Session')
const { digest } = require('../services/auth')
const app = require('../server')
let mongo, server, base
const enabled = Boolean(process.env.RUN_MONGO_TESTS || process.env.MONGOMS_SYSTEM_BINARY)

before(async () => {
  if (!enabled) return
  mongo = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongo.getUri('sqlmaster_auth_test')
  assert.equal(await connectDatabase(), true)
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve) })
  base = `http://127.0.0.1:${server.address().port}/api`
})
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve))
  await mongoose.disconnect()
  if (mongo) await mongo.stop()
})

async function request(path, { method = 'GET', body, cookie, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method, headers: { 'Content-Type': 'application/json', 'x-sqlmaster-request': '1', ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie') }
}

test('account lifecycle, identity isolation and server-authoritative rewards', { skip: !enabled && 'Set RUN_MONGO_TESTS=1 or MONGOMS_SYSTEM_BINARY to run the isolated MongoDB integration suite.' }, async t => {
  let alice, bob
  const aliceCredentials = { name: 'Alice Learner', email: 'Alice@Example.test', password: 'a long test passphrase 42' }
  await t.test('registration creates a users document with a hash and a protected cookie', async () => {
    const result = await request('/auth/register', { method: 'POST', body: aliceCredentials })
    assert.equal(result.status, 201)
    assert.equal(result.data.user.email, 'alice@example.test')
    assert.equal(result.data.score, 0)
    assert.ok(!JSON.stringify(result.data).includes('password'))
    assert.match(result.cookie, /HttpOnly/i)
    assert.match(result.cookie, /SameSite=Strict/i)
    alice = result.cookie.split(';')[0]
    const user = await User.findOne({ email: 'alice@example.test' }).select('+passwordHash')
    assert.match(user.passwordHash, /^scrypt:/)
    assert.notEqual(user.passwordHash, aliceCredentials.password)
    const session = await Session.findOne({ userId: user._id })
    assert.equal(session.tokenHash, digest(alice.split('=')[1]))
  })
  await t.test('duplicate emails, weak passwords and wrong credentials are rejected', async () => {
    assert.equal((await request('/auth/register', { method: 'POST', body: { ...aliceCredentials, email: 'ALICE@example.test' } })).status, 409)
    assert.equal((await request('/auth/register', { method: 'POST', body: { ...aliceCredentials, email: 'weak@example.test', password: 'short' } })).status, 400)
    assert.equal((await request('/auth/login', { method: 'POST', body: { email: aliceCredentials.email, password: 'wrong password' } })).status, 401)
    assert.equal((await request('/auth/login', { method: 'POST', body: { email: { $ne: null }, password: 'wrong password' } })).status, 400)
  })
  await t.test('anonymous learner IDs cannot access progress and cross-site writes fail', async () => {
    assert.equal((await request('/progress', { headers: { 'x-learner-id': 'alice' } })).status, 401)
    assert.equal((await request('/progress/lessons/intro-select', { cookie: alice, method: 'POST', body: { status: 'completed' }, headers: { 'x-sqlmaster-request': '' } })).status, 403)
    assert.equal((await request('/progress/lessons/intro-select', { cookie: alice, method: 'POST', body: { status: 'completed' }, headers: { 'sec-fetch-site': 'cross-site' } })).status, 403)
  })
  await t.test('lesson completion grants points only once, including concurrent requests', async () => {
    const options = { cookie: alice, method: 'POST', body: { status: 'completed', score: 999999 } }
    await Promise.all([request('/progress/lessons/intro-select', options), request('/progress/lessons/intro-select', options)])
    const { data } = await request('/progress', { cookie: alice })
    assert.equal(data.score, 10)
    assert.equal(data.stats.lessons, 1)
    assert.equal(data.badges.find(badge => badge.id === 'first-lesson').earned, true)
    assert.equal((await request('/progress/lessons/unknown', options)).status, 404)
  })
  await t.test('quiz scores require correct answers and cannot be farmed', async () => {
    const wrong = await request('/quizzes/quiz-select/submit', { cookie: alice, method: 'POST', body: { answerIndex: 0 } })
    assert.equal(wrong.data.account.score, 10)
    const right = { cookie: alice, method: 'POST', body: { answerIndex: 1 } }
    await request('/quizzes/quiz-select/submit', right)
    assert.equal((await request('/quizzes/quiz-select/submit', right)).data.account.score, 30)
  })
  await t.test('accepted SQL earns points and rejected SQL earns nothing', async () => {
    const wrong = await request('/exercises/exercise-intro-select/submit', { cookie: alice, method: 'POST', body: { sql: 'SELECT name FROM students' } })
    assert.equal(wrong.data.correct, false)
    assert.equal(wrong.data.account.score, 30)
    const right = { cookie: alice, method: 'POST', body: { sql: 'SELECT * FROM students' } }
    const accepted = await request('/exercises/exercise-intro-select/submit', right)
    assert.equal(accepted.data.correct, true)
    assert.equal(accepted.data.account.score, 55)
    assert.equal(accepted.data.account.badges.find(badge => badge.id === 'first-query').earned, true)
    assert.equal((await request('/exercises/exercise-intro-select/submit', right)).data.account.score, 55)
  })
  await t.test('flags persist, and a second account cannot see or reset Alice data', async () => {
    await request('/progress/flags/interview-north-1', { cookie: alice, method: 'PUT', body: { flagged: true } })
    const registered = await request('/auth/register', { method: 'POST', body: { name: 'Bob Learner', email: 'bob@example.test', password: 'another long passphrase 99' } })
    bob = registered.cookie.split(';')[0]
    const other = await request('/progress', { cookie: bob, headers: { 'x-learner-id': registered.data.user.id } })
    assert.equal(other.data.score, 0)
    assert.deepEqual(other.data.flags, [])
    await request('/progress', { cookie: bob, method: 'DELETE' })
    const own = await request('/progress', { cookie: alice })
    assert.equal(own.data.score, 55)
    assert.equal(own.data.flags[0].id, 'interview-north-1')
    assert.equal((await request('/progress', { cookie: bob, method: 'PUT', body: { entries: [{ score: 9999 }] } })).status, 404)
  })
  await t.test('logout invalidates the session; login restores account progress', async () => {
    assert.equal((await request('/auth/logout', { cookie: alice, method: 'POST' })).status, 200)
    assert.equal((await request('/auth/me', { cookie: alice })).status, 401)
    const login = await request('/auth/login', { method: 'POST', body: aliceCredentials })
    assert.equal(login.status, 200)
    assert.equal(login.data.score, 55)
    alice = login.cookie.split(';')[0]
  })
  await t.test('expired sessions are rejected even before MongoDB TTL cleanup', async () => {
    await Session.updateOne({ tokenHash: digest(bob.split('=')[1]) }, { $set: { expiresAt: new Date(0) } })
    assert.equal((await request('/auth/me', { cookie: bob })).status, 401)
  })
  await t.test('reset clears earned progress and flags for the current user only', async () => {
    const reset = await request('/progress', { cookie: alice, method: 'DELETE' })
    assert.equal(reset.data.score, 0)
    assert.deepEqual(reset.data.flags, [])
    assert.ok(reset.data.badges.every(badge => !badge.earned))
  })
})
