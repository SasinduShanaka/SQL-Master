const { randomBytes, createHash } = require('node:crypto')
const { sessions, users } = require('./accountStore')
const { isDatabaseConnected } = require('../db')

const cookieName = 'sqlmaster_session'
const duration = 7 * 24 * 60 * 60 * 1000
const digest = value => createHash('sha256').update(value).digest('hex')
const cookieOptions = () => ({ httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' })
const wrap = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

function getToken(req) {
  const part = (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))
  const value = part?.slice(cookieName.length + 1)
  return /^[a-f0-9]{64}$/.test(value || '') ? value : null
}

function requireDatabase(req, res, next) {
  res.set('Cache-Control', 'no-store')
  if (!isDatabaseConnected()) return res.status(503).json({ message: 'Accounts are temporarily unavailable. Please try again later.' })
  next()
}

const requireUser = [requireDatabase, wrap(async (req, res, next) => {
  const token = getToken(req)
  if (!token) return res.status(401).json({ message: 'Please log in to save your progress.' })
  const session = await sessions.findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } })
  const user = session && await users.findById(session.userId)
  if (!user) return res.status(401).json({ message: 'Your session has expired. Please log in again.' })
  req.user = user
  next()
})]

async function startSession(req, res, userId) {
  const previous = getToken(req)
  if (previous) await sessions.deleteOne({ tokenHash: digest(previous) })
  const token = randomBytes(32).toString('hex')
  await sessions.create({ userId, tokenHash: digest(token), expiresAt: new Date(Date.now() + duration) })
  res.cookie(cookieName, token, { ...cookieOptions(), maxAge: duration })
}

// Same-origin JSON requests with a custom header prevent cross-site form submissions.
function protectMutation(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  if (req.get('x-sqlmaster-request') !== '1') return res.status(403).json({ message: 'Invalid request. Refresh the page and try again.' })
  if (req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({ message: 'Cross-site requests are not allowed.' })
  next()
}

const attempts = new Map()
function authRateLimit(req, res, next) {
  const now = Date.now()
  for (const [key, entry] of attempts) if (entry.reset <= now) attempts.delete(key)
  const key = req.ip
  const entry = attempts.get(key) || { count: 0, reset: now + 15 * 60 * 1000 }
  entry.count++
  attempts.set(key, entry)
  if (entry.count > 30) {
    res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)))
    return res.status(429).json({ message: 'Too many attempts. Please try again in 15 minutes.' })
  }
  next()
}

module.exports = { requireUser, requireDatabase, startSession, getToken, digest, cookieName, cookieOptions, wrap, protectMutation, authRateLimit }
