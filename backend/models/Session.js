const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true, collection: 'sessions' })

module.exports = mongoose.models.Session || mongoose.model('Session', schema)
