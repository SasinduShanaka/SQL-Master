process.env.SQLMASTER_CONTENT_DB = ':memory:'
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const app = require('../server')
let server
let base
before(async () => {
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve) })
  base = `http://127.0.0.1:${server.address().port}/api`
})
after(async () => { await new Promise(resolve => server.close(resolve)) })

test('HTTP library endpoints distinguish practice from interview exams', async () => {
  const practice = await fetch(`${base}/exercises?page=2`).then(r => r.json())
  assert.equal(practice.total, 1212)
  assert.equal(practice.page, 2)
  assert.equal(practice.exercises.length, 24)
  const interview = await fetch(`${base}/exercises?track=interview&role=Data%20analyst`).then(r => r.json())
  assert.equal(interview.total, 20)
  assert.ok(interview.exercises.every(q => q.track === 'interview' && q.role === 'Data analyst'))
  assert.equal((await fetch(`${base}/exercises/missing-question`)).status, 404)
})

test('catalog counts and table previews describe the full executable database', async () => {
  const catalog = await fetch(`${base}/catalog`).then(r => r.json())
  assert.equal(catalog.library.practice, 1212)
  const { tables } = await fetch(`${base}/tables`).then(r => r.json())
  assert.equal(tables.length, 8)
  const orders = tables.find(table => table.name === 'orders')
  assert.equal(orders.rowCount, 2400)
  assert.equal(orders.rows.length, 8)
  const response = await fetch(`${base}/sql/execute`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: 'SELECT COUNT(*) AS order_count FROM orders' })
  }).then(r => r.json())
  assert.deepEqual(response.rows, [{ order_count: 2400 }])
})
