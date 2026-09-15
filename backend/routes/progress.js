const express = require('express')
const User = require('../models/User')
const { requireUser, protectMutation, wrap } = require('../services/auth')
const { summarizeUser } = require('../services/achievements')
const { getLessonById } = require('../services/aiContent')
const { getExerciseById } = require('../services/contentStore')
const router = express.Router()
router.use(protectMutation, requireUser)

router.get('/', (req, res) => res.json(summarizeUser(req.user)))
router.post('/lessons/:id', wrap(async (req, res) => {
  if (!await getLessonById(req.params.id)) return res.status(404).json({ message: 'Lesson not found.' })
  const status = req.body.status
  if (!['in-progress', 'completed'].includes(status)) return res.status(400).json({ message: 'Invalid lesson status.' })
  const field = status === 'completed' ? 'completedLessons' : 'startedLessons'
  const user = await User.findByIdAndUpdate(req.user._id, { $addToSet: { [field]: req.params.id } }, { new: true })
  res.json(summarizeUser(user))
}))
router.put('/flags/:id', wrap(async (req, res) => {
  if (!getExerciseById(req.params.id)) return res.status(404).json({ message: 'Question not found.' })
  if (typeof req.body.flagged !== 'boolean') return res.status(400).json({ message: 'Specify whether the question is flagged.' })
  const op = req.body.flagged ? '$addToSet' : '$pull'
  const user = await User.findByIdAndUpdate(req.user._id, { [op]: { flaggedQuestions: req.params.id } }, { new: true })
  res.json(summarizeUser(user))
}))
router.delete('/', wrap(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { $set: { startedLessons: [], completedLessons: [], passedQuizzes: [], quizResults: {}, solvedQuestions: [], flaggedQuestions: [] } }, { new: true })
  res.json(summarizeUser(user))
}))
module.exports = router
