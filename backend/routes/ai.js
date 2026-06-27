const express = require('express')
const { generateHint } = require('../services/aiContent')

const router = express.Router()

router.post('/hint', async (req, res, next) => {
  try {
    const hint = await generateHint(String(req.body.prompt || ''))
    res.json({ hint })
  } catch (error) {
    next(error)
  }
})

module.exports = router
