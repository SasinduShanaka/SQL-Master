process.env.SQLMASTER_CONTENT_DB = ':memory:'
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { summarizeUser } = require('../services/achievements')

const now = new Date('2026-09-15T12:00:00.000Z')
const learner = overrides => ({ _id: 'learner', name: 'Test Learner', email: 'learner@example.test', ...overrides })
const attempt = (createdAt, correct = false, topic = 'WHERE', extra = {}) => ({ exerciseId: 'exercise-filtering', createdAt, correct, topic, ...extra })

test('new learners receive an empty, complete 28-day UTC activity window', () => {
  const account = summarizeUser(learner(), now)
  assert.equal(account.activity.timeZone, 'UTC')
  assert.equal(account.activity.days.length, 28)
  assert.equal(account.activity.days[0].date, '2026-08-19')
  assert.equal(account.activity.days.at(-1).date, '2026-09-15')
  assert.ok(account.activity.days.every(day => day.attempts === 0 && day.correct === 0))
  assert.equal(account.activity.weekAttempts, 0)
  assert.equal(account.activity.todayAttempts, 0)
  assert.equal(account.stats.streak, 0)
  assert.equal(account.stats.accuracy, 0)
  assert.deepEqual(account.topicProgress, [])
})

test('activity uses UTC day boundaries and includes exactly seven days in the weekly total', () => {
  const account = summarizeUser(learner({ attemptHistory: [
    attempt('2026-09-15T01:00:00+05:30', true), // September 14 in UTC.
    attempt('2026-09-15T00:00:00.000Z', true),
    attempt('2026-09-09T00:00:00.000Z'),
    attempt('2026-09-08T23:59:59.999Z'),
    attempt('2026-08-19T00:00:00.000Z'),
    attempt('2026-08-18T23:59:59.999Z'),
    attempt('2026-09-15T13:00:00.000Z'), // Future timestamps do not create activity.
    attempt('2026-09-16T01:00:00.000Z')
  ] }), now)
  assert.equal(account.activity.todayAttempts, 1)
  assert.equal(account.activity.weekAttempts, 3)
  assert.deepEqual(account.activity.days.at(-2), { date: '2026-09-14', attempts: 1, correct: 1 })
  assert.equal(account.activity.days[0].attempts, 1)
  assert.equal(account.activity.days.reduce((sum, day) => sum + day.attempts, 0), 5)
  assert.equal(account.stats.streak, 2)
})

test('current streak tolerates an unfinished today, deduplicates daily attempts, and stops at a gap', () => {
  const history = [attempt('2026-09-14T01:00:00Z'), attempt('2026-09-14T02:00:00Z'), attempt('2026-09-13T01:00:00Z'), attempt('2026-09-11T01:00:00Z')]
  assert.equal(summarizeUser(learner({ attemptHistory: history }), now).stats.streak, 2)
  assert.equal(summarizeUser(learner({ attemptHistory: history }), new Date('2026-09-16T00:00:00Z')).stats.streak, 0)
  assert.equal(summarizeUser(learner({ attemptHistory: [attempt('2026-12-31T23:59:59Z')] }), new Date('2027-01-01T00:00:00Z')).stats.streak, 1)
})

test('malformed history dates remain inspectable without affecting activity or crashing serialization', () => {
  const account = summarizeUser(learner({ attemptHistory: [null, attempt('not-a-date'), attempt(new Date(NaN)), attempt(null), attempt(undefined), attempt('2026-09-15T09:00:00Z', true, '  WHERE  ', { sql: 'SELECT * FROM students;', message: 'Correct result.' })] }), now)
  assert.equal(account.stats.attempts, 5)
  assert.equal(account.stats.correctAttempts, 1)
  assert.equal(account.activity.todayAttempts, 1)
  assert.equal(account.stats.streak, 1)
  assert.equal(account.recentAttempts[0].sql, 'SELECT * FROM students;')
  assert.equal(account.recentAttempts[0].message, 'Correct result.')
  assert.equal(account.recentAttempts[0].topic, 'WHERE')
  assert.equal(account.recentAttempts.filter(item => item.createdAt === null).length, 4)
  assert.doesNotThrow(() => JSON.stringify(account))
})

test('topic totals distinguish retained attempt accuracy from unique solved challenges', () => {
  const account = summarizeUser(learner({
    solvedQuestions: ['exercise-intro-select', 'exercise-intro-select'],
    completedLessons: ['intro-select'],
    attemptHistory: [
      attempt('2026-09-15T11:00:00Z', true, 'WHERE'),
      attempt('2026-09-14T11:00:00Z', false, 'WHERE'),
      attempt('2026-09-13T11:00:00Z', false, 'WHERE'),
      attempt('2026-09-13T10:00:00Z', true, 'SELECT')
    ]
  }), now)
  assert.deepEqual(account.topicProgress.find(item => item.topic === 'WHERE'), { topic: 'WHERE', attempts: 3, correct: 1, solved: 0, accuracy: 33 })
  assert.deepEqual(account.topicProgress.find(item => item.topic === 'SELECT'), { topic: 'SELECT', attempts: 1, correct: 1, solved: 1, accuracy: 100 })
  assert.deepEqual(account.weakTopics, [{ topic: 'WHERE', misses: 2 }])
  assert.equal(account.stats.solved, 1)
  assert.equal(account.score, 35)
  assert.ok(account.badges.find(badge => badge.id === 'first-query').earned)
  assert.ok(account.entries.find(entry => entry.lessonId === 'intro-select'))
})

test('undated and non-boolean results do not invent correct submissions', () => {
  const account = summarizeUser(learner({ attemptHistory: [attempt('', 'true', ''), attempt({}, 1, null)] }), now)
  assert.equal(account.stats.correctAttempts, 0)
  assert.equal(account.stats.accuracy, 0)
  assert.equal(account.activity.weekAttempts, 0)
  assert.deepEqual(account.topicProgress, [{ topic: 'General SQL', attempts: 2, correct: 0, solved: 0, accuracy: 0 }])
})
