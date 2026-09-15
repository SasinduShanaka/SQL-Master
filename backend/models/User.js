const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  startedLessons: { type: [String], default: [] },
  completedLessons: { type: [String], default: [] },
  passedQuizzes: { type: [String], default: [] },
  quizResults: { type: Map, of: new mongoose.Schema({ quizId: String, selectedIndex: Number, correct: Boolean, explanation: String }, { _id: false }), default: {} },
  solvedQuestions: { type: [String], default: [] },
  flaggedQuestions: { type: [String], default: [] }
}, { timestamps: true, collection: 'users' })

module.exports = mongoose.models.User || mongoose.model('User', userSchema)
