const express = require('express')
const { getLessons, getLessonById } = require('../services/aiContent')

const router = express.Router()

router.get('/', async (req, res) => {
  const lessons = await getLessons()
  res.json({ lessons })
})

router.get('/:lessonId', async (req, res) => {
  const lesson = await getLessonById(req.params.lessonId)
  if (!lesson) return res.status(404).json({ message: 'Lesson not found' })
  res.json({ lesson })
})

module.exports = router
