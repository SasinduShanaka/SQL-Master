const jwt = require('jsonwebtoken')

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ message: 'No token provided' })

  const parts = authHeader.split(' ')
  if (parts.length !== 2) return res.status(401).json({ message: 'Invalid token format' })

  const scheme = parts[0]
  const token = parts[1]
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ message: 'Malformed token' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
    req.userId = decoded.userId
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
