process.env.SQLMASTER_CONTENT_DB = ':memory:'
const test = require('node:test')
const assert = require('node:assert/strict')
const { buildQuestions } = require('../data/library')
const { getDatabase, getExercises, getLibraryStats, getStoredDatasets } = require('../services/contentStore')
const { runQuery, getDemoTables } = require('../services/sqlEngine')

test('all 1,272 question solutions execute against real data with defined output values', () => {
  const bank = buildQuestions()
  assert.equal(bank.filter(q => q.track === 'practice').length, 1212)
  assert.equal(bank.filter(q => q.track === 'interview').length, 60)
  assert.equal(new Set(bank.map(q => q.id)).size, bank.length)
  assert.equal(new Set(bank.map(q => q.question)).size, bank.length)
  assert.equal(new Set(bank.map(q => q.solutionSql)).size, bank.length)
  const names = new Set(getDemoTables().map(table => table.name))
  for (const question of bank) {
    const result = runQuery(question.solutionSql)
    assert.equal(result.error, undefined, `${question.id}: ${result.error}`)
    assert.ok(result.rows.length > 0, question.id)
    for (const row of result.rows) for (const value of Object.values(row)) assert.notEqual(value, undefined, question.id)
    for (const name of question.tableNames) assert.ok(names.has(name), question.id)
  }
})

test('question database stores the full library and business datasets', () => {
  assert.equal(getDatabase().prepare('SELECT COUNT(*) AS n FROM questions').get().n, 1272)
  assert.deepEqual(getLibraryStats(), { practice: 1212, interview: 60, datasets: 5, rows: 2875 })
  assert.equal(getStoredDatasets().find(table => table.name === 'orders').rows.length, 2400)
})

test('pagination covers the complete practice bank without duplicates or interviews', () => {
  const ids = []
  for (let page = 1; page <= 13; page++) {
    const result = getExercises({ limit: 100, page })
    ids.push(...result.exercises.map(q => q.id))
    assert.ok(result.exercises.every(q => q.track === 'practice'))
  }
  assert.equal(ids.length, 1212)
  assert.equal(new Set(ids).size, 1212)
})

test('interview role, difficulty, topic and search filters compose', () => {
  const result = getExercises({ track: 'interview', role: 'Data engineer', level: 'advanced', topic: 'CASE', search: 'North' })
  assert.equal(result.total, 1)
  assert.equal(result.exercises[0].id, 'interview-north-6')
  assert.equal(getExercises({ search: "' OR 1=1 --" }).total, 0)
  assert.equal(getExercises({ track: 'unknown' }).total, 0)
})

test('interview solutions answer known salary, inactivity and duplicate-email cases', () => {
  const bank = buildQuestions()
  const solve = id => runQuery(bank.find(q => q.id === id).solutionSql).rows
  assert.deepEqual(solve('interview-north-1'), [{ second_highest_salary: 103000 }])
  assert.deepEqual(solve('interview-north-2').map(row => row.id), [21, 22, 23, 24])
  assert.equal(solve('interview-north-3').length, 12)
  assert.ok(solve('interview-north-3').every(row => row.duplicate_count === 2))
})
