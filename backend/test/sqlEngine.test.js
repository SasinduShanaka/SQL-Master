const test = require('node:test')
const assert = require('node:assert/strict')
const { runQuery } = require('../services/sqlEngine')

test('runQuery returns rows for a simple select', () => {
  const result = runQuery('SELECT name, score FROM students WHERE score > 90 ORDER BY score DESC;')
  assert.equal(result.error, undefined)
  assert.equal(result.rows.length, 1)
  assert.equal(result.rows[0].name, 'Ava')
})
