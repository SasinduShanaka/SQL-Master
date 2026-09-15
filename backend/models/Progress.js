const mongoose = require('mongoose')

const progressEntrySchema = new mongoose.Schema({
  kind: { type: String, enum: ['lesson', 'quiz'], required: true },
  lessonId: String,
  quizId: String,
  status: String,
  score: Number,
  correct: Boolean,
  explanation: String,
  selectedIndex: Number,
  updatedAt: { type: Date, default: Date.now }
}, { _id: false })

const progressSchema = new mongoose.Schema({
  learnerId: { type: String, required: true, unique: true, index: true },
  entries: { type: [progressEntrySchema], default: [] }
}, { timestamps: true })

module.exports = mongoose.models.Progress || mongoose.model('Progress', progressSchema)