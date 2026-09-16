require('dotenv').config({ path: require('node:path').join(__dirname, '.env') })
const express = require('express')
const lessonRoutes = require('./routes/lessons')
const quizRoutes = require('./routes/quizzes')
const exerciseRoutes = require('./routes/exercises')
const tableRoutes = require('./routes/tables')
const sqlRoutes = require('./routes/sql')
const aiRoutes = require('./routes/ai')
const progressRoutes = require('./routes/progress')
const { connectDatabase } = require('./db')
const { getCatalogRoadmap } = require('./services/aiContent')

const { getLibraryStats } = require('./services/contentStore')

const app = express()

app.use(express.json({ limit: '32kb' }))
app.use('/api/auth', require('./routes/auth'))

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/lessons', lessonRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/exercises', exerciseRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/sql', sqlRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/progress', progressRoutes)

app.get('/api/catalog', async (req, res, next) => {
  try {
    const roadmap = await getCatalogRoadmap()
    res.json({ roadmap, library: getLibraryStats() })
  } catch (error) {
    next(error)
  }
})

app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found.' }))

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  const status = error.status === 400 || error.type === 'entity.parse.failed' ? 400 : error.status === 413 ? 413 : 500
  res.status(status).json({ message: status === 400 ? 'Invalid request data.' : status === 413 ? 'Request is too large.' : 'The request could not be completed. Please try again.' })
})

const PORT = process.env.PORT || 5000

async function startServer() {
  await connectDatabase()
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

if (require.main === module) startServer()

module.exports = app
