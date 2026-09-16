require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const { connectDatabase } = require('../db')
const { initAccountStore, useLocalStore } = require('../services/accountStore')

async function main() {
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) throw new Error('Set MONGODB_URI in backend/.env before initializing account collections.')
  await connectDatabase()
  const collections = await initAccountStore()
  console.log(`${useLocalStore() ? 'Local account store' : 'Account collections'} ready:`, collections.join(', '))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 }).finally(() => mongoose.disconnect())
