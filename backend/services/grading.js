const { DatabaseSync } = require('node:sqlite')
const { getDemoTables } = require('./sqlEngine')
const quote = name => `"${name.replaceAll('"', '""')}"`

// Graded queries run in SQLite, never a JavaScript expression evaluator.
function executeReadQuery(sql) {
  if (typeof sql !== 'string' || !sql.trim() || sql.length > 12000) return { error: 'Enter a SQL query of at most 12,000 characters.' }
  const db = new DatabaseSync(':memory:')
  try {
    for (const table of getDemoTables()) {
      const definitions = table.columns.map(column => {
        const value = table.rows.find(row => row[column] != null)?.[column]
        return `${quote(column)} ${typeof value === 'number' ? 'REAL' : 'TEXT'}`
      })
      db.exec(`CREATE TABLE ${quote(table.name)} (${definitions.join(', ')})`)
      const insert = db.prepare(`INSERT INTO ${quote(table.name)} VALUES (${table.columns.map(() => '?').join(', ')})`)
      db.exec('BEGIN')
      for (const row of table.rows) insert.run(...table.columns.map(column => row[column] ?? null))
      db.exec('COMMIT')
    }
    db.exec('PRAGMA query_only = ON')
    const stripped = sql.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, '').trim()
    if (!/^(SELECT|WITH)\b/i.test(stripped)) return { error: 'Use a SELECT or WITH query to solve this challenge.' }
    const statement = db.prepare(sql)
    const columns = statement.columns().map(column => column.name)
    if (!columns.length) return { error: 'Your query must return rows.' }
    const rows = []
    for (const row of statement.iterate()) {
      if (rows.length >= 5000) return { error: 'Return at most 5,000 rows for a challenge submission.' }
      rows.push({ ...row })
    }
    return { rows, columns }
  } catch (error) { return { error: error.message } }
  finally { db.close() }
}

function gradeQuery(question, sql) {
  const expected = executeReadQuery(question.solutionSql)
  const actual = executeReadQuery(sql)
  if (expected.error) throw new Error('The reference query could not be evaluated.')
  if (actual.error) return { correct: false, message: actual.error }
  if (JSON.stringify([...actual.columns].sort()) !== JSON.stringify([...expected.columns].sort())) return { correct: false, message: `Return these columns with the requested names: ${expected.columns.join(', ')}.` }
  const encode = row => JSON.stringify(expected.columns.map(column => typeof row[column] === 'number' ? Number(row[column].toPrecision(12)) : row[column]))
  const left = actual.rows.map(encode)
  const right = expected.rows.map(encode)
  if (!/\bORDER\s+BY\b/i.test(question.solutionSql)) { left.sort(); right.sort() }
  const correct = JSON.stringify(left) === JSON.stringify(right)
  return { correct, message: correct ? 'Accepted! Your results match the reference result.' : 'Not quite. Check the rows, values, duplicates, and any requested ordering.' }
}

module.exports = { executeReadQuery, gradeQuery }
