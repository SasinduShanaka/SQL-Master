const mongoose = require('mongoose')

let connected = false

async function connectDatabase() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.warn('MONGODB_URI is not set; progress will use browser storage only.')
    return false
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    connected = true
    console.log('Connected to MongoDB')
    return true
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`)
    return false
  }
}

function isDatabaseConnected() {
  return connected && mongoose.connection.readyState === 1
}

module.exports = { connectDatabase, isDatabaseConnected }