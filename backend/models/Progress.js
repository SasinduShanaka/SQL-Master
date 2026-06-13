const mongoose = require('mongoose')

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lessonId: { type: String, required: true },
  status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
  score: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
})

ProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true })

module.exports = mongoose.model('Progress', ProgressSchema)
