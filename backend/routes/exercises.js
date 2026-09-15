const express = require('express')
const { getExercises, getExerciseById } = require('../services/aiContent')

const router = express.Router()
const { users } = require('../services/accountStore')
const { requireUser, wrap, protectMutation } = require('../services/auth')
const { summarizeUser } = require('../services/achievements')
const { executeSandbox } = require('../services/querySandbox')

router.post('/:exerciseId/submit', protectMutation, requireUser, wrap(async (req, res) => {
  const question = getExerciseById(req.params.exerciseId)
  if (!question) return res.status(404).json({ message: 'Question not found.' })
  const result = await executeSandbox({ action: 'grade', question, sql: req.body.sql })
  if (result.error) return res.status(422).json({ message: result.error })
  const attempt = {
    exerciseId: question.id,
    title: question.question,
    topic: question.topic,
    level: question.level,
    track: question.track,
    sql: String(req.body.sql || '').slice(0, 5000),
    correct: result.correct,
    message: result.message,
    createdAt: new Date()
  }
  const update = {
    $push: { attemptHistory: { $each: [attempt], $sort: { createdAt: -1 }, $slice: 100 } }
  }
  if (result.correct) update.$addToSet = { solvedQuestions: question.id }
  const user = await users.findByIdAndUpdate(req.user._id, update, { new: true })
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
