const express = require('express')
const Progress = require('../models/Progress')
const { isDatabaseConnected } = require('../db')

const router = express.Router()

function learnerId(req) {
  return String(req.header('x-learner-id') || '').trim()
}

router.get('/', async (req, res, next) => {
  const id = learnerId(req)
  if (!id) return res.status(400).json({ message: 'x-learner-id is required' })
  if (!isDatabaseConnected()) return res.json({ entries: [], persisted: false })

  try {
    const progress = await Progress.findOne({ learnerId: id }).lean()
    res.json({ entries: progress?.entries || [], persisted: true })
  } catch (error) {
    next(error)
  }
})

router.put('/', async (req, res, next) => {
  const id = learnerId(req)
  const entries = Array.isArray(req.body.entries) ? req.body.entries.slice(0, 100) : null
  if (!id) return res.status(400).json({ message: 'x-learner-id is required' })
  if (!entries) return res.status(400).json({ message: 'entries must be an array' })
  if (!isDatabaseConnected()) return res.json({ entries, persisted: false })

  try {
    const progress = await Progress.findOneAndUpdate(
      { learnerId: id },
      { learnerId: id, entries },
      { new: true, upsert: true, runValidators: true }
    ).lean()
    res.json({ entries: progress.entries, persisted: true })
  } catch (error) {
    next(error)
  }
})

router.delete('/', async (req, res, next) => {
  const id = learnerId(req)
  if (!id) return res.status(400).json({ message: 'x-learner-id is required' })
  if (!isDatabaseConnected()) return res.json({ persisted: false })

  try {
    await Progress.deleteOne({ learnerId: id })
    res.json({ persisted: true })
  } catch (error) {
    next(error)
  }
})

module.exports = router