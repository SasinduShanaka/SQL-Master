const fs = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const User = require('../models/User')
const Session = require('../models/Session')
const { isMongoConnected, isLocalAccountStoreEnabled } = require('../db')

const storePath = () => process.env.SQLMASTER_ACCOUNT_STORE || path.join(__dirname, '../data/accounts.local.json')

function useLocalStore() {
  return !isMongoConnected() && isLocalAccountStoreEnabled()
}

function nowIso() {
  return new Date().toISOString()
}

function asUserDocument(user) {
  if (!user) return null
  return {
    ...user,
    toObject() {
      return { ...user, quizResults: { ...(user.quizResults || {}) } }
    }
  }
}

async function readStore() {
  try {
    return JSON.parse(await fs.readFile(storePath(), 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    return { users: [], sessions: [] }
  }
}

async function writeStore(store) {
  await fs.mkdir(path.dirname(storePath()), { recursive: true })
  await fs.writeFile(storePath(), `${JSON.stringify(store, null, 2)}\n`)
}

function applyUpdate(user, update) {
  for (const [field, value] of Object.entries(update.$addToSet || {})) {
    const list = Array.isArray(user[field]) ? user[field] : []
    if (!list.includes(value)) list.push(value)
    user[field] = list
  }
  for (const [field, value] of Object.entries(update.$pull || {})) {
    user[field] = (Array.isArray(user[field]) ? user[field] : []).filter(item => item !== value)
  }
  for (const [field, value] of Object.entries(update.$set || {})) {
    if (field.startsWith('quizResults.')) {
      const key = field.slice('quizResults.'.length)
      user.quizResults = { ...(user.quizResults || {}), [key]: value }
    } else {
      user[field] = value
    }
  }
  for (const [field, value] of Object.entries(update.$push || {})) {
    const list = Array.isArray(user[field]) ? user[field] : []
    const items = value?.$each || [value]
    list.push(...items)
    if (value?.$sort) {
      const [[sortField, direction]] = Object.entries(value.$sort)
      list.sort((a, b) => direction * String(a[sortField] || '').localeCompare(String(b[sortField] || '')))
    }
    if (Number.isInteger(value?.$slice)) {
      user[field] = value.$slice < 0 ? list.slice(value.$slice) : list.slice(0, value.$slice)
    } else {
      user[field] = list
    }
  }
  user.updatedAt = nowIso()
}

async function createUser(values) {
  if (!useLocalStore()) return User.create(values)
  const store = await readStore()
  if (store.users.some(user => user.email === values.email)) throw Object.assign(new Error('Duplicate email'), { code: 11000 })
  const user = {
    _id: randomUUID(),
    name: values.name,
    email: values.email,
    passwordHash: values.passwordHash,
    startedLessons: [],
    completedLessons: [],
    passedQuizzes: [],
    quizResults: {},
    solvedQuestions: [],
    flaggedQuestions: [],
    attemptHistory: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  }
  store.users.push(user)
  await writeStore(store)
  return asUserDocument(user)
}

function findUserOne(filter) {
  if (!useLocalStore()) return User.findOne(filter)
  return {
    async select() {
      const store = await readStore()
      return asUserDocument(store.users.find(user => user.email === filter.email))
    }
  }
}

async function findUserById(id) {
  if (!useLocalStore()) return User.findById(id)
  const store = await readStore()
  return asUserDocument(store.users.find(user => user._id === String(id)))
}

async function updateUserById(id, update, options) {
  if (!useLocalStore()) return User.findByIdAndUpdate(id, update, options)
  const store = await readStore()
  const user = store.users.find(item => item._id === String(id))
  if (!user) return null
  applyUpdate(user, update)
  await writeStore(store)
  return asUserDocument(user)
}

async function createSession(values) {
  if (!useLocalStore()) return Session.create(values)
  const store = await readStore()
  store.sessions = store.sessions.filter(session => session.tokenHash !== values.tokenHash)
  const session = { ...values, userId: String(values.userId), expiresAt: values.expiresAt.toISOString(), createdAt: nowIso(), updatedAt: nowIso() }
  store.sessions.push(session)
  await writeStore(store)
  return session
}

async function findSessionOne(filter) {
  if (!useLocalStore()) return Session.findOne(filter)
  const store = await readStore()
  return store.sessions.find(session => {
    if (filter.tokenHash && session.tokenHash !== filter.tokenHash) return false
    if (filter.userId && session.userId !== String(filter.userId)) return false
    if (filter.expiresAt?.$gt && new Date(session.expiresAt) <= filter.expiresAt.$gt) return false
    return true
  }) || null
}

async function deleteSessionOne(filter) {
  if (!useLocalStore()) return Session.deleteOne(filter)
  const store = await readStore()
  const before = store.sessions.length
  store.sessions = store.sessions.filter(session => session.tokenHash !== filter.tokenHash)
  await writeStore(store)
  return { deletedCount: before - store.sessions.length }
}

async function initAccountStore() {
  if (!useLocalStore()) {
    await User.createCollection()
    await Session.createCollection()
    await User.init()
    await Session.init()
    return ['users', 'sessions']
  }
  const store = await readStore()
  await writeStore(store)
  return ['users', 'sessions']
}

module.exports = {
  users: { create: createUser, findOne: findUserOne, findById: findUserById, findByIdAndUpdate: updateUserById },
  sessions: { create: createSession, findOne: findSessionOne, deleteOne: deleteSessionOne },
  initAccountStore,
  useLocalStore
}
