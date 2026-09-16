const { lessons } = require('../../shared/curriculum.json')
const { getExerciseById } = require('./contentStore')

const DAY_MS = 24 * 60 * 60 * 1000

function validDate(value) {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return null
  if (value === '') return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

function summarizeUser(user, now = new Date()) {
  const data = user.toObject ? user.toObject({ flattenMaps: true }) : user
  const completed = new Set(data.completedLessons || [])
  const solved = [...new Set(data.solvedQuestions || [])].map(getExerciseById).filter(Boolean)
  const quizResults = Object.values(data.quizResults || {})
  const attemptHistory = (Array.isArray(data.attemptHistory) ? data.attemptHistory : []).filter(attempt => attempt && typeof attempt === 'object').map(attempt => ({
    ...attempt,
    correct: attempt.correct === true,
    topic: typeof attempt.topic === 'string' && attempt.topic.trim() ? attempt.topic.trim() : 'General SQL',
    createdAt: validDate(attempt.createdAt)?.toISOString() || null
  })).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
  const correctAttempts = attemptHistory.filter(attempt => attempt.correct)
  const missedAttempts = attemptHistory.filter(attempt => !attempt.correct)
  const missedByTopic = missedAttempts.reduce((topics, attempt) => {
    const topic = attempt.topic || 'General SQL'
    topics[topic] = (topics[topic] || 0) + 1
    return topics
  }, {})
  const weakTopics = Object.entries(missedByTopic)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic, misses]) => ({ topic, misses }))
  const currentTime = (validDate(now) || new Date()).getTime()
  const today = new Date(currentTime).toISOString().slice(0, 10)
  const todayStart = Date.parse(`${today}T00:00:00.000Z`)
  const days = Array.from({ length: 28 }, (_, index) => ({ date: new Date(todayStart - (27 - index) * DAY_MS).toISOString().slice(0, 10), attempts: 0, correct: 0 }))
  const daysByDate = new Map(days.map(day => [day.date, day]))
  const attemptDates = new Set()
  for (const attempt of attemptHistory) {
    if (!attempt.createdAt || Date.parse(attempt.createdAt) > currentTime) continue
    const date = attempt.createdAt.slice(0, 10)
    attemptDates.add(date)
    const day = daysByDate.get(date)
    if (day) {
      day.attempts++
      if (attempt.correct) day.correct++
    }
  }
  let streak = 0
  // Yesterday's streak remains current until the learner has had today to practice.
  const streakStart = attemptDates.has(today) ? todayStart : todayStart - DAY_MS
  for (let time = streakStart; attemptDates.has(new Date(time).toISOString().slice(0, 10)); time -= DAY_MS) streak++
  const topics = new Map()
  function topicSummary(topic) {
    if (!topics.has(topic)) topics.set(topic, { topic, attempts: 0, correct: 0, solved: 0, accuracy: 0 })
    return topics.get(topic)
  }
  for (const attempt of attemptHistory) {
    const topic = topicSummary(attempt.topic)
    topic.attempts++
    if (attempt.correct) topic.correct++
  }
  for (const exercise of solved) topicSummary(exercise.topic || 'General SQL').solved++
  const topicProgress = [...topics.values()].map(topic => ({ ...topic, accuracy: topic.attempts ? Math.round(topic.correct / topic.attempts * 100) : 0 }))
    .sort((a, b) => (b.attempts - b.correct) - (a.attempts - a.correct) || b.attempts - a.attempts || a.topic.localeCompare(b.topic))
  const score = completed.size * 10 + (data.passedQuizzes || []).length * 20 + solved.reduce((sum, q) => sum + ({ beginner: 25, intermediate: 50, advanced: 100 }[q.level] || 0), 0)
  const beginnerLessons = lessons.filter(lesson => lesson.level === 'beginner')
  const badges = [
    ['first-lesson', 'First steps', 'Complete your first lesson.', completed.size >= 1],
    ['foundations', 'Solid foundations', 'Complete every beginner lesson.', beginnerLessons.every(lesson => completed.has(lesson.id))],
    ['first-query', 'Problem solver', 'Solve your first SQL challenge.', solved.length >= 1],
    ['ten-queries', 'Query explorer', 'Solve 10 different challenges.', solved.length >= 10],
    ['fifty-queries', 'SQL specialist', 'Solve 50 different challenges.', solved.length >= 50],
    ['hundred-queries', 'SQL master', 'Solve 100 different challenges.', solved.length >= 100],
    ['interview-ready', 'Interview ready', 'Solve an interview challenge.', solved.some(q => q.track === 'interview')],
    ['full-path', 'Learning path graduate', 'Complete every lesson.', lessons.every(lesson => completed.has(lesson.id))]
  ].map(([id, title, description, earned]) => ({ id, title, description, earned }))
  return {
    user: { id: String(data._id), name: data.name, email: data.email, createdAt: data.createdAt },
    entries: [
      ...[...new Set([...(data.startedLessons || []), ...completed])].map(lessonId => ({ kind: 'lesson', lessonId, status: completed.has(lessonId) ? 'completed' : 'in-progress' })),
      ...quizResults.map(result => ({ kind: 'quiz', ...result })),
      ...solved.map(q => ({ kind: 'exercise', exerciseId: q.id, title: q.question, status: 'completed' }))
    ],
    score, level: Math.floor(score / 250) + 1, nextLevelAt: (Math.floor(score / 250) + 1) * 250,
    badges, solvedQuestions: data.solvedQuestions || [], flaggedQuestions: data.flaggedQuestions || [],
    flags: (data.flaggedQuestions || []).map(getExerciseById).filter(Boolean).map(q => ({ id: q.id, title: q.question, track: q.track })),
    recentAttempts: attemptHistory.slice(0, 8).map(attempt => ({
      exerciseId: attempt.exerciseId,
      title: attempt.title,
      topic: attempt.topic,
      level: attempt.level,
      track: attempt.track,
      correct: attempt.correct,
      sql: typeof attempt.sql === 'string' ? attempt.sql.slice(0, 5000) : '',
      message: attempt.message,
      createdAt: attempt.createdAt
    })),
    weakTopics,
    activity: { days, todayAttempts: days[27].attempts, weekAttempts: days.slice(-7).reduce((sum, day) => sum + day.attempts, 0), timeZone: 'UTC' },
    topicProgress,
    stats: {
      lessons: completed.size,
      quizzes: (data.passedQuizzes || []).length,
      solved: solved.length,
      interviews: solved.filter(q => q.track === 'interview').length,
      attempts: attemptHistory.length,
      correctAttempts: correctAttempts.length,
      accuracy: attemptHistory.length ? Math.round((correctAttempts.length / attemptHistory.length) * 100) : 0,
      streak
    }
  }
}

module.exports = { summarizeUser }
