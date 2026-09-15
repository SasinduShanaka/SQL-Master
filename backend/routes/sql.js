const express = require('express')
const { executeSandbox } = require('../services/querySandbox')
const { wrap } = require('../services/auth')

const router = express.Router()

router.post('/execute', wrap(async (req, res) => {
  const result = await executeSandbox({ action: 'execute', sql: req.body.sql })
  res.json(result)
}))

module.exports = router
