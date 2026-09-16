process.env.SQLMASTER_CONTENT_DB = ':memory:'
const test = require('node:test')
const assert = require('node:assert/strict')
const { runQuery, getDemoTables } = require('../services/sqlEngine')
const { getExercises, getLessons, getQuizzes } = require('../services/aiContent')

for (const exercise of getExercises({ limit: 100 }).exercises) {
  test(`challenge solution runs: ${exercise.id}`, () => {
    const result = runQuery(exercise.solutionSql)
    assert.equal(result.error, undefined)
    assert.ok(result.rows.length > 0)
    for (const name of exercise.tableNames) assert.ok(getDemoTables().some(table => table.name === name))
  })
}

test('advertised tables match query results', () => {
  for (const table of getDemoTables()) {
    const result = runQuery(`SELECT * FROM ${table.name}`)
    assert.equal(result.error, undefined)
    assert.deepEqual(result.rows, table.rows)
    assert.deepEqual(result.columns, table.columns)
  }
})

test('each query starts with fresh data', () => {
  runQuery('DELETE FROM students')
  assert.equal(runQuery('SELECT * FROM students').rows.length, 4)
})

test('difficulty filters and pagination return consistent metadata', () => {
  const result = getExercises({ level: 'advanced', limit: 2, page: 999 })
  assert.ok(result.total >= 240)
  assert.equal(result.page, Math.ceil(result.total / 2))
  assert.equal(result.exercises.length, 2)
  assert.ok(result.exercises.every(item => item.level === 'advanced'))
  assert.equal(getExercises({ topic: 'not-a-topic' }).total, 0)
  assert.equal(getExercises({ limit: 2.5 }).limit, 2)
})

test('all exercises and quizzes reference stable curriculum lessons', async () => {
  const ids = new Set((await getLessons()).map(lesson => lesson.id))
  for (const exercise of getExercises({ limit: 100 }).exercises) assert.ok(ids.has(exercise.lessonId))
  for (const quiz of await getQuizzes()) assert.ok(ids.has(quiz.lessonId))
})

test('invalid and empty SQL produce useful feedback', () => {
  assert.ok(runQuery('SELECT * FROM missing_table').error)
  assert.equal(runQuery('').message, 'Query is empty.')
})
