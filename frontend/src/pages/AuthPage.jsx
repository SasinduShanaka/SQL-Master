import React, { useState } from 'react'

export default function AuthPage({ mode, authenticate, navigate, accountBusy }) {
  const register = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (pending || accountBusy) return
    setError('')
    if (register && password !== confirmation) {
      setError('Your passwords do not match.')
      return
    }
    setPending(true)
    try { await authenticate(mode, { name, email, password }) }
    catch (error) { setError(error.message) }
    finally { setPending(false) }
  }

  return <section className="auth-layout">
    <div className="auth-story"><p className="eyebrow">YOUR NEXT CHAPTER</p><h1>{register ? 'Build your SQL story.' : 'Welcome back.'}</h1><p>Keep your learning journey in one place. Solve challenges, earn points, collect badges, and save questions for another day.</p><ul><li>Personal progress across devices</li><li>Points for learning and solving</li><li>A collection of earned achievements</li></ul></div>
    <form className="card auth-form" onSubmit={submit}>
      <h2>{register ? 'Create your account' : 'Log in to SQL Master'}</h2>
      <p className="muted">{register ? 'Start learning with an account of your own.' : 'Pick up where you left off.'}</p>
      {error && <p className="error-banner" role="alert">{error}</p>}
      {register && <label>Your name<input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={event => setName(event.target.value)} /></label>}
      <label>Email address<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Password<input required type={showPassword ? 'text' : 'password'} minLength={register ? 12 : 1} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} aria-describedby={register ? 'password-help' : undefined} /></label>
      {register && <label>Confirm password<input required type={showPassword ? 'text' : 'password'} maxLength={128} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>}
      <button type="button" className="text-button" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide password' : 'Show password'}</button>
      {register && <small id="password-help" className="muted">Use 12–128 characters. A memorable passphrase works well.</small>}
      <button disabled={pending || accountBusy} type="submit">{pending || accountBusy ? 'Please wait...' : register ? 'Create account' : 'Log in'}</button>
      <p className="muted">{register ? 'Already have an account?' : 'New to SQL Master?'} <button type="button" disabled={pending} className="text-button" onClick={() => navigate(register ? 'login' : 'register')}>{register ? 'Log in' : 'Create account'}</button></p>
    </form>
  </section>
}
