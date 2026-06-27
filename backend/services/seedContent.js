const Lesson = require('../models/Lesson')
const Quiz = require('../models/Quiz')
const { lessons, quizzes } = require('../data/curriculum')

async function seedContent() {
  const lessonCount = await Lesson.countDocuments()
  if (lessonCount === 0) {
    await Lesson.insertMany(lessons)
  }

  const quizCount = await Quiz.countDocuments()
  if (quizCount === 0) {
    await Quiz.insertMany(quizzes)
  }
}

module.exports = { seedContent }
