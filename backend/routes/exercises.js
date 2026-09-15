const express = require('express')
const { getExercises, getExerciseById } = require('../services/aiContent')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const exercises = await getExercises()
    res.json({ exercises })
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