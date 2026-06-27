const express = require('express')
const { runQuery } = require('../services/sqlEngine')

const router = express.Router()

router.post('/execute', (req, res) => {
  const result = runQuery(req.body.sql)
  res.json(result)
})

module.exports = router
