const express = require('express')
const User = require('../models/User')
const Session = require('../models/Session')
const { hashPassword, verifyPassword } = require('../services/passwords')
const { summarizeUser } = require('../services/achievements')
const { requireDatabase, requireUser, wrap, startSession, getToken, digest, cookieName, cookieOptions, authRateLimit, protectMutation } = require('../services/auth')
const router = express.Router()
const dummyHash = hashPassword('unused-password-for-timing-checks')

router.use(protectMutation, requireDatabase)
router.post('/register', authRateLimit, wrap(async (req, res) => {
  const { name, email, password } = req.body
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) return res.status(400).json({ message: 'Use a name between 2 and 80 characters.' })
  if (typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ message: 'Enter a valid email address.' })
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) return res.status(400).json({ message: 'Use a password between 12 and 128 characters.' })
  try {
    const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash: await hashPassword(password) })
    await startSession(req, res, user._id)
    res.status(201).json(summarizeUser(user))
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with that email already exists. Please log in.' })
    throw error
  }
}))

router.post('/login', authRateLimit, wrap(async (req, res) => {
  const { email, password } = req.body
  if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || password.length > 128) return res.status(400).json({ message: 'Enter your email and password.' })
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash')
  const valid = await verifyPassword(password, user?.passwordHash || await dummyHash)
  if (!user || !valid) return res.status(401).json({ message: 'Email or password is incorrect.' })
  await startSession(req, res, user._id)
  res.json(summarizeUser(user))
}))

router.get('/me', requireUser, wrap(async (req, res) => res.json(summarizeUser(req.user))))
router.post('/logout', wrap(async (req, res) => {
  const token = getToken(req)
  if (token) await Session.deleteOne({ tokenHash: digest(token) })
  res.clearCookie(cookieName, cookieOptions())
  res.json({ message: 'Logged out.' })
}))

module.exports = router
