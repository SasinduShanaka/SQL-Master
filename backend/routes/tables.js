const express = require('express')
const { getDemoTables } = require('../services/sqlEngine')

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ tables: getDemoTables() })
})

module.exports = router