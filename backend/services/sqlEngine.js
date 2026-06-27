const alasql = require('alasql')

function createDemoDatabase() {
  const db = new alasql.Database('sql-master-demo')
  db.exec(`
    CREATE TABLE students (id INT, name STRING, score INT, cohort STRING);
    INSERT INTO students VALUES (1, 'Ava', 94, 'web'), (2, 'Noah', 82, 'data'), (3, 'Mia', 76, 'web'), (4, 'Leo', 88, 'data');

    CREATE TABLE enrollments (studentId INT, course STRING, status STRING);
    INSERT INTO enrollments VALUES (1, 'SQL Basics', 'active'), (2, 'SQL Basics', 'active'), (3, 'Advanced SQL', 'paused'), (4, 'SQL Basics', 'active');
  `)
  return db
}

function runQuery(sql) {
  const trimmed = String(sql || '').trim()
  if (!trimmed) {
    return { rows: [], columns: [], message: 'Query is empty.' }
  }

  const normalized = trimmed.replace(/;\s*$/, '')
  const db = createDemoDatabase()

  try {
    const result = db.exec(normalized)

    if (!Array.isArray(result)) {
      return { rows: [], columns: [], message: 'Query executed successfully.' }
    }

    if (!result.length) {
      return { rows: [], columns: [], message: 'Query executed successfully.' }
    }

    const columns = Object.keys(result[0] || {})
    return {
      rows: result,
      columns,
      message: `Returned ${result.length} row(s).`
    }
  } catch (error) {
    return { rows: [], columns: [], error: error.message }
  }
}

module.exports = { runQuery }
