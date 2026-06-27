const express = require('express')
const auth = require('../middleware/auth')
const Progress = require('../models/Progress')

const router = express.Router()

router.get('/', auth, async (req, res) => {
  const progress = await Progress.find({ userId: req.userId }).sort({ updatedAt: -1 })
  res.json({ progress })
})

router.put('/:lessonId', auth, async (req, res) => {
  const { status, score } = req.body
  const lessonId = req.params.lessonId

  const updated = await Progress.findOneAndUpdate(
    { userId: req.userId, lessonId },
    { userId: req.userId, lessonId, status, score, updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  res.json({ progress: updated })
})

module.exports = router
