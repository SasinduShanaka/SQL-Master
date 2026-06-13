const mongoose = require('mongoose')

const QuizSchema = new mongoose.Schema({
  order: { type: Number, required: true, unique: true },
  id: { type: String, required: true, unique: true, index: true },
  lessonId: { type: String, required: true, index: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answerIndex: { type: Number, required: true },
  explanation: { type: String, required: true }
})

module.exports = mongoose.model('Quiz', QuizSchema)
