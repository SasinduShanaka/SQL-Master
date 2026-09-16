const { executeReadQuery, gradeQuery } = require('./grading')
process.once('message', data => {
  try {
    const result = data.action === 'grade'
      ? gradeQuery(data.question, data.sql)
      : executeReadQuery(data.sql)
    if (result.rows) result.message = `Returned ${result.rows.length} row(s).`
    process.send(result, () => process.exit(0))
  } catch {
    process.send({ error: 'The query could not be evaluated.' }, () => process.exit(0))
  }
})
