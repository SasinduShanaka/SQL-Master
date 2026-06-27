require('dotenv').config()
const express = require('express')
const cors = require('cors')
const lessonRoutes = require('./routes/lessons')
const quizRoutes = require('./routes/quizzes')
const sqlRoutes = require('./routes/sql')
const aiRoutes = require('./routes/ai')
const { getCatalogRoadmap } = require('./services/aiContent')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/lessons', lessonRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/sql', sqlRoutes)
app.use('/api/ai', aiRoutes)

app.get('/api/catalog', async (req, res, next) => {
  try {
    const roadmap = await getCatalogRoadmap()
    res.json({ roadmap })
  } catch (error) {
    next(error)
  }
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
