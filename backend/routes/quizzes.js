const express = require('express')
const { getQuizById, getQuizzes } = require('../services/aiContent')

const router = express.Router()
const { users } = require('../services/accountStore')
const { requireUser, protectMutation, wrap } = require('../services/auth')
const { summarizeUser } = require('../services/achievements')

router.get('/', async (req, res) => {
  const quizzes = await getQuizzes()
  res.json({ quizzes })
})

router.post('/:quizId/submit', protectMutation, requireUser, wrap(async (req, res) => {
  const quiz = await getQuizById(req.params.quizId)
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' })

  const selectedIndex = req.body.answerIndex
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= quiz.options.length) return res.status(400).json({ message: 'Choose a valid answer.' })
  const correct = selectedIndex === quiz.answerIndex
  const update = { $set: { [`quizResults.${quiz.id}`]: { quizId: quiz.id, selectedIndex, correct, explanation: quiz.explanation } } }
  if (correct) update.$addToSet = { passedQuizzes: quiz.id }
  const user = await users.findByIdAndUpdate(req.user._id, update, { new: true })
  res.json({ correct, correctAnswerIndex: quiz.answerIndex, explanation: quiz.explanation, account: summarizeUser(user) })
}))

module.exports = router
