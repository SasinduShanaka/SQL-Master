const express = require('express')
const { getQuizById, getQuizzes } = require('../services/aiContent')

const router = express.Router()

router.get('/', async (req, res) => {
  const quizzes = await getQuizzes()
  res.json({ quizzes })
})

router.post('/:quizId/submit', async (req, res) => {
  const quiz = await getQuizById(req.params.quizId)
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' })

  const selectedIndex = Number(req.body.answerIndex)
  const correct = selectedIndex === quiz.answerIndex
  res.json({ correct, correctAnswerIndex: quiz.answerIndex, explanation: quiz.explanation })
})

module.exports = router
