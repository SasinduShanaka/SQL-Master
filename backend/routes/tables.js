const express = require('express')
const { getDemoTables } = require('../services/sqlEngine')

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ tables: getDemoTables().map(table => ({ ...table, rowCount: table.rows.length, rows: table.rows.slice(0, 8) })) })
})

module.exports = router