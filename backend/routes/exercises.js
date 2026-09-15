const express = require('express')
const { getExercises, getExerciseById } = require('../services/aiContent')

const router = express.Router()
const User = require('../models/User')
const { requireUser, wrap, protectMutation } = require('../services/auth')
const { summarizeUser } = require('../services/achievements')
const { executeSandbox } = require('../services/querySandbox')

router.post('/:exerciseId/submit', protectMutation, requireUser, wrap(async (req, res) => {
  const question = getExerciseById(req.params.exerciseId)
  if (!question) return res.status(404).json({ message: 'Question not found.' })
  const result = await executeSandbox({ action: 'grade', question, sql: req.body.sql })
  if (result.error) return res.status(422).json({ message: result.error })
  const user = result.correct
    ? await User.findByIdAndUpdate(req.user._id, { $addToSet: { solvedQuestions: question.id } }, { new: true })
    : req.user
  res.json({ ...result, account: summarizeUser(user) })
}))

router.get('/', async (req, res, next) => {
  try {
    const result = getExercises(req.query)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

router.get('/:exerciseId', async (req, res, next) => {
  try {
    const exercise = await getExerciseById(req.params.exerciseId)
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' })
    res.json({ exercise })
  } catch (error) {
    next(error)
  }
})

module.exports = router
