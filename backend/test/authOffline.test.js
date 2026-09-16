// HTTP behavior uses in-memory model doubles here. auth.test.js separately
// checks real MongoDB indexes, persistence and atomic updates when enabled.
process.env.SQLMASTER_CONTENT_DB = ':memory:'
const { test, before, after, mock } = require('node:test')
const assert = require('node:assert/strict')
const db = require('../db')
mock.method(db, 'isDatabaseConnected', () => true)
const User = require('../models/User')
const Session = require('../models/Session')
const users = new Map()
const sessions = new Map()
mock.method(User, 'create', async values => {
  if ([...users.values()].some(user => user.email === values.email)) throw Object.assign(new Error('duplicate'), { code: 11000 })
  const user = new User(values)
  await user.validate()
  users.set(String(user._id), user)
  return user
})
mock.method(User, 'findOne', filter => ({ select: async () => [...users.values()].find(user => user.email === filter.email) || null }))
mock.method(User, 'findById', async id => users.get(String(id)) || null)
mock.method(User, 'findByIdAndUpdate', async (id, update) => {
  const user = users.get(String(id))
  for (const [field, value] of Object.entries(update.$addToSet || {})) user[field].addToSet(value)
  for (const [field, value] of Object.entries(update.$pull || {})) user[field].pull(value)
  for (const [field, value] of Object.entries(update.$set || {})) user.set(field, value)
  return user
})
mock.method(Session, 'create', async values => { const session = new Session(values); sessions.set(session.tokenHash, session); return session })
mock.method(Session, 'findOne', async filter => {
  const session = sessions.get(filter.tokenHash)
  return session && session.expiresAt > filter.expiresAt.$gt ? session : null
})
mock.method(Session, 'deleteOne', async filter => sessions.delete(filter.tokenHash))
const app = require('../server')
let server, base
before(async () => {
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve) })
  base = `http://127.0.0.1:${server.address().port}/api`
})
after(async () => { await new Promise(resolve => server.close(resolve)); mock.restoreAll() })

async function request(path, method = 'GET', body, cookie, extraHeaders = {}) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-sqlmaster-request': '1', ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders }, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0], rawCookie: response.headers.get('set-cookie'), cacheControl: response.headers.get('cache-control') }
}

test('registration, login, rewards, flags and isolation over HTTP with model doubles', async () => {
  const credentials = { name: 'Test Learner', email: 'LEARNER@example.test', password: 'a secure test passphrase' }
  const registration = await request('/auth/register', 'POST', credentials)
  assert.equal(registration.status, 201)
  const cookie = registration.cookie
  assert.match(registration.rawCookie, /HttpOnly/)
  assert.equal(registration.data.user.email, 'learner@example.test')
  assert.ok(!JSON.stringify(registration.data).includes('passwordHash'))
  assert.match([...users.values()][0].passwordHash, /^scrypt:/)
  assert.equal((await request('/auth/register', 'POST', credentials)).status, 409)
  assert.equal((await request('/auth/register', 'POST', { ...credentials, password: 'short' })).status, 400)
  assert.equal((await request('/auth/login', 'POST', { ...credentials, password: 'incorrect' })).status, 401)
  assert.equal((await request('/auth/login', 'POST', { email: { $ne: null }, password: 'incorrect' })).status, 400)
  assert.equal((await request('/progress', 'GET', undefined, undefined, { 'x-learner-id': registration.data.user.id })).status, 401)
  assert.equal((await request('/progress/lessons/intro-select', 'POST', { status: 'completed' }, cookie, { 'x-sqlmaster-request': '' })).status, 403)
  assert.equal((await request('/progress/lessons/intro-select', 'POST', { status: 'completed' }, cookie, { 'sec-fetch-site': 'cross-site' })).status, 403)
  await request('/progress/lessons/intro-select', 'POST', { status: 'completed', score: 999999 }, cookie)
  assert.equal((await request('/progress/lessons/intro-select', 'POST', { status: 'completed' }, cookie)).data.score, 10)
  assert.equal((await request('/quizzes/quiz-select/submit', 'POST', { answerIndex: 0 }, cookie)).data.account.score, 10)
  assert.equal((await request('/quizzes/quiz-select/submit', 'POST', { answerIndex: 1 }, cookie)).data.account.score, 30)
  assert.equal((await request('/quizzes/quiz-select/submit', 'POST', { answerIndex: 1 }, cookie)).data.account.score, 30)
  const accepted = await request('/exercises/exercise-intro-select/submit', 'POST', { sql: 'SELECT * FROM students' }, cookie)
  assert.equal(accepted.data.correct, true)
  assert.equal(accepted.data.account.score, 55)
  assert.equal((await request('/exercises/exercise-intro-select/submit', 'POST', { sql: 'SELECT * FROM students' }, cookie)).data.account.score, 55)
  assert.equal((await request('/exercises/exercise-intro-select/submit', 'POST', { sql: 'SELECT name FROM students' }, cookie)).data.correct, false)
  assert.equal((await request('/progress/flags/interview-north-1', 'PUT', { flagged: true }, cookie)).data.flags.length, 1)
  const bob = await request('/auth/register', 'POST', { ...credentials, email: 'bob@example.test' })
  assert.equal((await request('/progress', 'GET', undefined, bob.cookie)).data.score, 0)
  await request('/progress', 'DELETE', undefined, bob.cookie)
  assert.equal((await request('/progress', 'GET', undefined, cookie)).data.score, 55)
  assert.equal((await request('/progress', 'PUT', { entries: [{ score: 9999 }] }, cookie)).status, 404)
  await request('/auth/logout', 'POST', undefined, cookie)
  assert.equal((await request('/auth/me', 'GET', undefined, cookie)).status, 401)
  const login = await request('/auth/login', 'POST', credentials)
  assert.equal(login.status, 200)
  assert.equal(login.data.score, 55)
  const reset = await request('/progress', 'DELETE', undefined, login.cookie)
  assert.equal(reset.data.score, 0)
  assert.deepEqual(reset.data.flags, [])
  assert.ok(reset.data.badges.every(badge => !badge.earned))
})

test('expired sessions are rejected before TTL cleanup', async () => {
  const login = await request('/auth/login', 'POST', { email: 'learner@example.test', password: 'a secure test passphrase' })
  for (const session of sessions.values()) session.expiresAt = new Date(0)
  assert.equal((await request('/auth/me', 'GET', undefined, login.cookie)).status, 401)
})

test('login rotates the current session and private responses cannot be cached', async () => {
  const credentials = { email: 'learner@example.test', password: 'a secure test passphrase' }
  const first = await request('/auth/login', 'POST', credentials)
  const second = await request('/auth/login', 'POST', credentials, first.cookie)
  assert.equal(second.status, 200)
  assert.notEqual(first.cookie, second.cookie)
  assert.equal(second.cacheControl, 'no-store')
  assert.equal((await request('/auth/me', 'GET', undefined, first.cookie)).status, 401)
  const current = await request('/auth/me', 'GET', undefined, second.cookie)
  assert.equal(current.status, 200)
  assert.equal(current.cacheControl, 'no-store')
  assert.equal((await request('/progress', 'GET', undefined, second.cookie)).cacheControl, 'no-store')
  const logout = await request('/auth/logout', 'POST', undefined, second.cookie)
  assert.match(logout.rawCookie, /Expires=Thu, 01 Jan 1970/)
  assert.equal((await request('/auth/me', 'GET', undefined, second.cookie)).status, 401)
})

test('missing credentials and cross-site authentication are rejected', async () => {
  for (const path of ['/auth/login', '/auth/register']) {
    assert.equal((await request(path, 'POST')).status, 400)
    assert.equal((await request(path, 'POST', {})).status, 400)
    assert.equal((await request(path, 'POST', {}, undefined, { 'x-sqlmaster-request': '' })).status, 403)
    assert.equal((await request(path, 'POST', {}, undefined, { 'sec-fetch-site': 'cross-site' })).status, 403)
  }
  assert.equal((await request('/auth/login', 'POST', { email: ' ', password: ' ' })).status, 400)
  assert.equal((await request('/auth/login', 'POST', { email: 'learner@example.test', password: '' })).status, 400)
})

test('production sessions require HTTPS', async () => {
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try {
    const login = await request('/auth/login', 'POST', { email: 'learner@example.test', password: 'a secure test passphrase' })
    assert.equal(login.status, 200)
    assert.match(login.rawCookie, /; Secure/)
    assert.match(login.rawCookie, /; HttpOnly/)
    assert.match(login.rawCookie, /; SameSite=Strict/)
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previous
  }
})

test('authentication throttling blocks repeated login attempts', async () => {
  let status
  for (let i = 0; i < 31; i++) status = (await request('/auth/login', 'POST', { email: {}, password: '' })).status
  assert.equal(status, 429)
})
