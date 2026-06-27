require('dotenv').config()

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Lesson = require('../models/Lesson')
const Progress = require('../models/Progress')

async function seedDemoData() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sqlmaster'

  await mongoose.connect(mongoUri)

  const demoEmail = 'demo@sqlmaster.dev'
  const existingUser = await User.findOne({ email: demoEmail })
  const passwordHash = await bcrypt.hash('DemoPass123!', 10)

  const user =
    existingUser ||
    (await User.create({
      name: 'Demo Student',
      email: demoEmail,
      passwordHash
    }))

  if (existingUser) {
    await User.updateOne({ _id: existingUser._id }, { $set: { passwordHash } })
  }

  const lessons = await Lesson.find().sort({ order: 1 })
  const progressItems = lessons.map((lesson, index) => ({
    userId: user._id,
    lessonId: lesson.id,
    status: index === 0 ? 'completed' : index === 1 ? 'in-progress' : 'not-started',
    score: index === 0 ? 100 : index === 1 ? 60 : 0,
    updatedAt: new Date()
  }))

  for (const item of progressItems) {
    await Progress.findOneAndUpdate(
      { userId: item.userId, lessonId: item.lessonId },
      item,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  }

  console.log(`Seeded demo user ${demoEmail} and ${progressItems.length} progress records.`)
  await mongoose.disconnect()
}

seedDemoData().catch(async (error) => {
  console.error('Failed to seed demo data:', error)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
