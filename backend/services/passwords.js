const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto')
const { promisify } = require('node:util')
const derive = promisify(scrypt)
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = await derive(password, salt, 64, options)
  return `scrypt:${salt}:${hash.toString('hex')}`
}

async function verifyPassword(password, encoded) {
  const [, salt, hash] = (encoded || '').split(':')
  if (!salt || !hash) return false
  const candidate = await derive(password, salt, 64, options)
  const stored = Buffer.from(hash, 'hex')
  return stored.length === candidate.length && timingSafeEqual(stored, candidate)
}

module.exports = { hashPassword, verifyPassword }
