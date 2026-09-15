const mongoose = require('mongoose')

let connected = false
let localAccountStore = false

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.warn('MONGODB_URI is not set; account features are unavailable until MongoDB is configured.')
    return false
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    await require('./models/User').init()
    await require('./models/Session').init()
    connected = true
    localAccountStore = false
    console.log('Connected to MongoDB')
    return true
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`)
    if (process.env.NODE_ENV !== 'production') {
      localAccountStore = true
      console.warn('Using the local development account store because MongoDB is unavailable.')
    }
    return false
  }
}

function isMongoConnected() {
  return connected && mongoose.connection.readyState === 1
}

function isLocalAccountStoreEnabled() {
  return localAccountStore
}

function isDatabaseConnected() {
  return isMongoConnected() || isLocalAccountStoreEnabled()
}

module.exports = { connectDatabase, isDatabaseConnected, isMongoConnected, isLocalAccountStoreEnabled }
