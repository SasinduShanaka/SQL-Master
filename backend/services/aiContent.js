const { lessons: fallbackLessons } = require('../../shared/curriculum.json')

const fallbackQuizzes = [
  {
    order: 1,
    id: 'quiz-select',
    lessonId: 'intro-select',
    question: 'Which clause sorts result rows?',
    options: ['GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT'],
    answerIndex: 1,
    explanation: 'ORDER BY is used to sort query results.'
  },
  {
    order: 2,
    id: 'quiz-join',
    lessonId: 'joins',
    question: 'Which JOIN keeps all rows from the left table?',
    options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'CROSS JOIN'],
    answerIndex: 2,
    explanation: 'LEFT JOIN preserves every row from the left side.'
  }
]

const contentCache = { hintCache: new Map() }

const { getExercises, getExerciseById } = require('./contentStore')

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    const match = String(raw).match(/\{[\s\S]*\}/)
    if (!match) return null

    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

async function callOpenAi(prompt) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(10000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You generate concise SQL learning content as JSON only.' },
        { role: 'user', content: prompt }
      ]
    })
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Groq request failed: ${response.status} ${message}`)
  }

  const payload = await response.json()
  return payload?.choices?.[0]?.message?.content || null
}

async function generateContent() {
  return { lessons: fallbackLessons, quizzes: fallbackQuizzes, roadmap: fallbackLessons.map(lesson => `${lesson.level}: ${lesson.topic}`) }
}

async function getLessons() {
  const content = await generateContent()
  return content.lessons
}

async function getLessonById(lessonId) {
  const lessons = await getLessons()
  return lessons.find((lesson) => lesson.id === lessonId) || null
}

async function getQuizzes() {
  const content = await generateContent()
  return content.quizzes
}

async function getQuizById(quizId) {
  const quizzes = await getQuizzes()
  return quizzes.find((quiz) => quiz.id === quizId) || null
}

async function getCatalogRoadmap() {
  const content = await generateContent()
  return content.roadmap
}

async function generateHint(prompt) {
  const normalizedPrompt = String(prompt || '').trim()
  if (!normalizedPrompt) {
    return 'Start with a SELECT and verify one clause at a time.'
  }

  const cached = contentCache.hintCache.get(normalizedPrompt)
  if (cached) return cached

  const apiHint = await callOpenAi(`Give a short, practical SQL hint for this query or problem. Return JSON only in the shape {"hint":"string"}. Prompt: ${normalizedPrompt}`).catch(() => null)
  if (apiHint) {
    const parsed = safeJsonParse(apiHint)
    if (parsed?.hint) {
      contentCache.hintCache.set(normalizedPrompt, parsed.hint)
      return parsed.hint
    }
  }

  let hint = 'Break the problem into smaller parts and test each clause.'
  const lowerPrompt = normalizedPrompt.toLowerCase()
  if (lowerPrompt.includes('join')) hint = 'Check your join keys and confirm which table should preserve rows.'
  if (lowerPrompt.includes('group')) hint = 'Remember that GROUP BY pairs with aggregate functions.'
  if (lowerPrompt.includes('window')) hint = 'Use OVER(PARTITION BY ... ORDER BY ...) to calculate across a row set.'

  contentCache.hintCache.set(normalizedPrompt, hint)
  return hint
}

module.exports = {
  getLessons,
  getLessonById,
  getQuizzes,
  getQuizById,
  getCatalogRoadmap,
  getExercises,
  getExerciseById,
  generateHint
}