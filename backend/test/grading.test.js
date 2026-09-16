process.env.SQLMASTER_CONTENT_DB = ':memory:'
const test = require('node:test')
const assert = require('node:assert/strict')
const { executeReadQuery, gradeQuery } = require('../services/grading')
const { buildQuestions } = require('../data/library')
const { getExerciseById } = require('../services/contentStore')

test('all 1,272 reference solutions work in the grading database', () => {
  for (const question of buildQuestions()) {
    const result = executeReadQuery(question.solutionSql)
    assert.equal(result.error, undefined, `${question.id}: ${result.error}`)
    assert.ok(result.rows.length > 0, question.id)
  }
})

test('grading accepts equivalent results and checks order, columns and duplicate rows', () => {
  assert.equal(gradeQuery(getExerciseById('exercise-intro-select'), 'SELECT id, name, score, cohort FROM students ORDER BY id DESC').correct, true)
  assert.equal(gradeQuery(getExerciseById('exercise-intro-select'), 'SELECT * FROM students UNION ALL SELECT * FROM students').correct, false)
  assert.equal(gradeQuery(getExerciseById('exercise-sorting'), 'SELECT * FROM students ORDER BY score ASC LIMIT 2').correct, false)
  assert.equal(gradeQuery(getExerciseById('exercise-intro-select'), 'SELECT name FROM students').correct, false)
})

test('grading rejects writes, external database access and JavaScript execution', () => {
  for (const sql of ['DELETE FROM students', "ATTACH DATABASE '/tmp/test.db' AS other", "SELECT load_extension('test')", "SELECT process.env FROM students", 'WITH x AS (SELECT 1) DELETE FROM students']) {
    assert.ok(executeReadQuery(sql).error, sql)
  }
})
