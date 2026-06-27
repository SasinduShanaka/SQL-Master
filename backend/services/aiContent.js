const fallbackLessons = [
  {
    order: 1,
    id: 'intro-select',
    level: 'beginner',
    title: 'Getting Started with SELECT',
    topic: 'SELECT, FROM, ORDER BY',
    summary: 'Read rows from a table and sort results.',
    explanation: 'SELECT chooses columns, FROM chooses a table, and ORDER BY sorts the output.'
  },
  {
    order: 2,
    id: 'filtering',
    level: 'beginner',
    title: 'Filtering Rows with WHERE',
    topic: 'WHERE, AND, OR, IN, BETWEEN',
    summary: 'Learn how to narrow down results.',
    explanation: 'WHERE applies boolean conditions to each row before results are returned.'
  },
  {
    order: 3,
    id: 'joins',
    level: 'intermediate',
    title: 'Joining Tables',
    topic: 'INNER JOIN, LEFT JOIN',
    summary: 'Combine data from multiple tables.',
    explanation: 'JOINs match related records across tables using key columns.'
  },
  {
    order: 4,
    id: 'window-functions',
    level: 'advanced',
    title: 'Window Functions',
    topic: 'ROW_NUMBER, RANK, OVER',
    summary: 'Compute analytics without collapsing rows.',
    explanation: 'Window functions calculate values across a set of rows while preserving each row.'
  }
]

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

const contentCache = {
  lessons: null,
  quizzes: null,
  roadmap: null,
  hintCache: new Map()
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

function normalizeLessons(lessons) {
  return lessons.slice(0, 4).map((lesson, index) => ({
    order: index + 1,
    id: slugify(lesson.id || lesson.title || `lesson-${index + 1}`),
    level: lesson.level || ['beginner', 'beginner', 'intermediate', 'advanced'][index] || 'beginner',
    title: lesson.title || `Lesson ${index + 1}`,
    topic: lesson.topic || 'SQL fundamentals',
    summary: lesson.summary || 'Learn the core idea for this SQL topic.',
    explanation: lesson.explanation || 'Use the lesson to practice this SQL concept in context.'
  }))
}

function normalizeQuizzes(quizzes, lessons) {
  return quizzes.slice(0, 4).map((quiz, index) => {
    const lesson = lessons[index] || lessons[0]
    const options = Array.isArray(quiz.options) && quiz.options.length >= 4
      ? quiz.options.slice(0, 4)
      : ['Option A', 'Option B', 'Option C', 'Option D']

    return {
      order: index + 1,
      id: slugify(quiz.id || quiz.question || `quiz-${index + 1}`),
      lessonId: lesson?.id || `lesson-${index + 1}`,
      question: quiz.question || `Which answer best describes ${lesson?.title || 'this topic'}?`,
      options,
      answerIndex: Number.isInteger(quiz.answerIndex) ? quiz.answerIndex : 1,
      explanation: quiz.explanation || 'This answer matches the lesson concept.'
    }
  })
}

async function callOpenAi(prompt) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
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
    throw new Error(`OpenAI request failed: ${response.status} ${message}`)
  }

  const payload = await response.json()
  return payload?.choices?.[0]?.message?.content || null
}

async function generateContent() {
  if (contentCache.lessons && contentCache.quizzes && contentCache.roadmap) {
    return {
      lessons: contentCache.lessons,
      quizzes: contentCache.quizzes,
      roadmap: contentCache.roadmap
    }
  }

  const prompt = `Generate a compact SQL learning curriculum as valid JSON with this exact shape:
  {
    "lessons": [{"id":"string","level":"beginner|intermediate|advanced","title":"string","topic":"string","summary":"string","explanation":"string"}],
    "quizzes": [{"id":"string","lessonId":"string","question":"string","options":["string","string","string","string"],"answerIndex":0,"explanation":"string"}]
  }

Rules:
 - Create 4 lessons and 4 quizzes.
 - Keep the lessons focused on SQL basics, filtering, joins, and window functions.
 - Make quiz answerIndex a number from 0 to 3.
 - Output JSON only.`

  const raw = await callOpenAi(prompt)
  if (raw) {
    const parsed = safeJsonParse(raw)
    if (parsed?.lessons && parsed?.quizzes) {
      const lessons = normalizeLessons(parsed.lessons)
      const quizzes = normalizeQuizzes(parsed.quizzes, lessons)
      const roadmap = lessons.map((lesson) => `${lesson.level}: ${lesson.topic}`)
      contentCache.lessons = lessons
      contentCache.quizzes = quizzes
      contentCache.roadmap = roadmap
      return { lessons, quizzes, roadmap }
    }
  }

  const lessons = normalizeLessons(fallbackLessons)
  const quizzes = normalizeQuizzes(fallbackQuizzes, lessons)
  const roadmap = lessons.map((lesson) => `${lesson.level}: ${lesson.topic}`)
  contentCache.lessons = lessons
  contentCache.quizzes = quizzes
  contentCache.roadmap = roadmap
  return { lessons, quizzes, roadmap }
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

  const apiHint = await callOpenAi(`Give a short, practical SQL hint for this query or problem. Return JSON only in the shape {"hint":"string"}. Prompt: ${normalizedPrompt}`)
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
  generateHint
}