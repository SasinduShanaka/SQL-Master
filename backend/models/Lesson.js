const mongoose = require('mongoose')

const LessonSchema = new mongoose.Schema({
  order: { type: Number, required: true, unique: true },
  id: { type: String, required: true, unique: true, index: true },
  level: { type: String, required: true },
  title: { type: String, required: true },
  topic: { type: String, required: true },
  summary: { type: String, required: true },
  explanation: { type: String, required: true }
})

module.exports = mongoose.model('Lesson', LessonSchema)
