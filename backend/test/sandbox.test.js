process.env.SQLMASTER_CONTENT_DB = ':memory:'
const test = require('node:test')
const assert = require('node:assert/strict')
const { executeSandbox } = require('../services/querySandbox')

test('a nonterminating query is stopped and subsequent queries still work', async () => {
  const result = await executeSandbox({ action: 'execute', sql: 'WITH RECURSIVE forever(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM forever) SELECT SUM(n) FROM forever' })
  assert.match(result.error, /time limit/)
  const next = await executeSandbox({ action: 'execute', sql: 'SELECT COUNT(*) AS student_count FROM students' })
  assert.deepEqual(next.rows, [{ student_count: 4 }])
})
