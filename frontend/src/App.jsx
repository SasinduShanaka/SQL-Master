import React, { useEffect, useMemo, useRef, useState } from 'react'
import content from '../../shared/curriculum.json'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/LearningDashboard'
import ProjectsPage from './pages/ProjectsPage'
import Icon from './components/Icon'
import WorkspaceSearch from './components/WorkspaceSearch'
import LessonsPage from './pages/LessonsPage'
import PracticeLibrary from './pages/PracticeLibrary'
import ProgressPage from './pages/ProgressPage'
import QuizPage from './pages/QuizPage'

const starterSql = `SELECT name, score, cohort
FROM students
WHERE score >= 85
ORDER BY score DESC;`

const fallbackLessons = content.lessons
const fallbackExercises = content.exercises
const fallbackQuizzes = []
const fallbackTables = []

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, credentials: 'same-origin', headers: { ...options.headers, 'x-sqlmaster-request': '1' }, signal: AbortSignal.timeout(15000) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'Unable to complete the request. Please try again.')
    error.status = response.status
    throw error
  }
  return data
}

export default function App() {
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const exerciseRequest = useRef(0)
  const queryRequest = useRef(0)
  const [account, setAccount] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [accountBusy, setAccountBusy] = useState(false)
  const accountLock = useRef(false)
  const accountGeneration = useRef(0)
  const authReturnPage = useRef('progress')
  const [questionToOpen, setQuestionToOpen] = useState(null)
  const [lessonToOpen, setLessonToOpen] = useState(null)
  const [projectToOpen, setProjectToOpen] = useState(null)
  const [practiceFilters, setPracticeFilters] = useState({})
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [ping, setPing] = useState('loading')
  const [libraryStats, setLibraryStats] = useState({ practice: content.exercises.length, interview: 0 })
  const [roadmap, setRoadmap] = useState([])
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [exercises, setExercises] = useState([])
  const [exerciseMeta, setExerciseMeta] = useState({ total: 0, page: 1, limit: 24, levels: [], topics: [] })
  const [tables, setTables] = useState([])
  const progress = account?.entries || []
  const [sql, setSql] = useState(starterSql)
  const [sqlResult, setSqlResult] = useState(null)
  const [quizPick, setQuizPick] = useState({})
  const [hint, setHint] = useState('')
  const [page, setPage] = useState(() => window.location.hash.replace('#/', '') || 'home')

  function applyFallbackContent() {
    setPing('offline - using built-in content')
    setRoadmap(fallbackLessons.map((lesson) => `${lesson.level}: ${lesson.topic}`))
    setLessons(fallbackLessons)
    setQuizzes(fallbackQuizzes)
    setExercises(fallbackExercises)
    setExerciseMeta({ total: fallbackExercises.length, page: 1, limit: fallbackExercises.length, levels: ['beginner', 'intermediate', 'advanced'], topics: [...new Set(fallbackExercises.map(item => item.topic))] })
    setTables(fallbackTables)
  }

  async function loadExercises(filters = {}) {
    const request = ++exerciseRequest.current
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value))
      const data = await api(`/api/exercises?${params}`)
      if (request !== exerciseRequest.current) return
      setExercises(data.exercises || [])
      setExerciseMeta(data)
      setError('')
    } catch {
      if (request !== exerciseRequest.current) return
      const filtered = fallbackExercises.filter(item => (!filters.level || item.level === filters.level) && (!filters.topic || item.topic === filters.topic))
      setExercises(filtered)
      setExerciseMeta({ total: filtered.length, page: 1, limit: 24, topics: [...new Set(fallbackExercises.map(item => item.topic))] })
      setError('Connection unavailable. Showing built-in challenges; query execution requires the server.')
    }
  }

  useEffect(() => {
    let retryId
    let cancelled = false

    async function loadContent() {
      try {
        const [pingData, catalogData, lessonData, quizData, exerciseData, tableData] = await Promise.all([
          api('/api/ping'),
          api('/api/catalog'),
          api('/api/lessons'),
          api('/api/quizzes'),
          api('/api/exercises'),
          api('/api/tables')
        ])

        if (cancelled) return

        setPing(pingData.message)
        setRoadmap(catalogData.roadmap || [])
        if (catalogData.library) setLibraryStats(catalogData.library)
        setLessons(lessonData.lessons || [])
        setQuizzes(quizData.quizzes || [])
        setExercises(exerciseData.exercises || [])
        setExerciseMeta(exerciseData)
        setTables(tableData.tables || [])
      } catch {
        if (cancelled) return

        applyFallbackContent()
        retryId = window.setTimeout(loadContent, 5000)
      }
    }

    loadContent()

    return () => {
      cancelled = true
      if (retryId) {
        window.clearTimeout(retryId)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const generation = accountGeneration.current
    api('/api/auth/me').then(data => { if (!cancelled && generation === accountGeneration.current) setAccount(data) })
      .catch(error => { if (!cancelled && generation === accountGeneration.current && error.status !== 401) setError(error.message) })
      .finally(() => { if (!cancelled) setAuthLoading(false) })
    return () => { cancelled = true }
  }, [])

  function resetAccountView() {
    setQuizPick({})
    setSqlResult(null)
    setHint('')
    setQuestionToOpen(null)
    queryRequest.current++
  }

  async function authenticate(mode, values) {
    if (accountLock.current) throw new Error('Please wait for the current account request to finish.')
    accountLock.current = true
    setAccountBusy(true)
    accountGeneration.current++
    try {
      const data = await api(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
      resetAccountView()
      setAccount(data)
      setError('')
      navigate(authReturnPage.current)
    } finally {
      setAuthLoading(false)
      accountLock.current = false
      setAccountBusy(false)
    }
  }

  async function accountAction(url, options) {
    if (!account) { navigate('login'); return null }
    if (accountLock.current) return null
    const generation = accountGeneration.current
    accountLock.current = true
    setAccountBusy(true)
    setError('')
    try {
      const data = await api(url, options)
      if (generation === accountGeneration.current) setAccount(data.account || data)
      return generation === accountGeneration.current ? data : null
    } catch (error) {
      if (generation !== accountGeneration.current) return null
      setError(error.message)
      if (error.status === 401) { accountGeneration.current++; resetAccountView(); setAccount(null); navigate('login') }
      return null
    } finally { accountLock.current = false; setAccountBusy(false) }
  }

  async function logout() {
    if (accountLock.current) return
    accountLock.current = true
    setAccountBusy(true)
    try {
      await api('/api/auth/logout', { method: 'POST' })
      accountGeneration.current++
      resetAccountView()
      setAccount(null)
      setError('')
      navigate('home')
    } catch (error) { setError(error.message) }
    finally { accountLock.current = false; setAccountBusy(false) }
  }

  useEffect(() => {
    function handleHashChange() {
      const requested = window.location.hash.replace('#/', '')
      setPage(['home', 'lessons', 'practice', 'interviews', 'projects', 'quiz', 'progress', 'login', 'register'].includes(requested) ? requested : 'home')
      setMobileNavOpen(false)
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    function shortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(value => !value) }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [])

  useEffect(() => {
    document.title = `${({ home: 'Dashboard', lessons: 'Learning path', practice: 'SQL practice', interviews: 'Interview preparation', projects: 'Guided projects', quiz: 'Knowledge checks', progress: 'My progress', login: 'Log in', register: 'Create an account' })[page] || 'Learn SQL'} · SQL Master`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [page])

  const suggestedLesson = useMemo(() => lessons[0], [lessons])
  const completedLessons = lessons.filter((lesson) => progress.some((item) => item.lessonId === lesson.id && item.status === 'completed'))
  const completionCount = completedLessons.length
  const inProgressLesson = lessons.find((lesson) => progress.some((item) => item.lessonId === lesson.id && item.status === 'in-progress')) || lessons[0]
  const nextLesson = lessons.find((lesson) => !progress.some((item) => item.lessonId === lesson.id && item.status === 'completed')) || lessons[0]
  const recentProgress = progress.slice(0, 4)

  async function runSql() {
    if (running || !sql.trim()) return
    const request = ++queryRequest.current
    setRunning(true)
    setSqlResult(null)
    try {
      const result = await api('/api/sql/execute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sql })
      })
      if (request === queryRequest.current) setSqlResult(result)
      return request === queryRequest.current ? result : null
    } catch { if (request === queryRequest.current) setSqlResult({ error: 'Could not connect to the SQL server. Check your connection and try again.' }) }
    finally { setRunning(false) }
  }

  async function requestHint() {
    try {
      const data = await api('/api/ai/hint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: sql })
      })
      setHint(data.hint)
    } catch { setHint('Start with the requested columns, check the table schema, then add one clause at a time.') }
  }

  async function submitQuiz(quizId) {
    if (!Number.isInteger(quizPick[quizId])) return
    await accountAction(`/api/quizzes/${quizId}/submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answerIndex: quizPick[quizId] })
    })
  }

  async function saveLessonProgress(lessonId, status) {
    await accountAction(`/api/progress/lessons/${lessonId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    })
  }

  async function submitExercise(id) {
    return accountAction(`/api/exercises/${id}/submit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sql })
    })
  }

  async function toggleFlag(id, flagged) {
    return accountAction(`/api/progress/flags/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flagged })
    })
  }

  async function clearProgress() {
    if (!account) return
    if (!window.confirm('Reset your lesson progress, quiz results, points, badges, solved questions, and flags? This cannot be undone.')) return
    await accountAction('/api/progress', { method: 'DELETE' })
  }

  function openQuestion(question) {
    setQuestionToOpen({ ...question, track: question.track || 'practice' })
    setPracticeFilters({})
    navigate(question.track === 'interview' ? 'interviews' : 'practice')
  }

  function openLesson(target) { setLessonToOpen(target); navigate('lessons') }
  function openProject(id) { setProjectToOpen(id); navigate('projects') }
  function openPractice(filters = {}) { setQuestionToOpen(null); setPracticeFilters(filters); navigate('practice') }

  function navigate(nextPage) {
    if (['login', 'register'].includes(nextPage) && !['home', 'login', 'register'].includes(page)) {
      authReturnPage.current = page
    }
    window.location.hash = `/${nextPage}`
    setMobileNavOpen(false)
  }

  const pageProps = {
    account, accountBusy, authLoading, submitExercise, toggleFlag, openQuestion, questionToOpen,
    openLesson, lessonToOpen, consumeLesson: () => setLessonToOpen(null),
    openProject, projectToOpen, consumeProject: () => setProjectToOpen(null),
    openPractice, practiceFilters, consumeQuestion: () => setQuestionToOpen(null),
    running,
    ping,
    roadmap,
    lessons,
    quizzes,
    exercises,
    exerciseMeta,
    tables,
    progress,
    quizPick,
    sql,
    sqlResult,
    hint,
    completionCount,
    suggestedLesson,
    completedLessons,
    inProgressLesson,
    nextLesson,
    recentProgress,
    setSql: (value) => { queryRequest.current += 1; setSql(value); setSqlResult(null); setHint('') },
    setQuizPick,
    runSql,
    requestHint,
    loadExercises,
    submitQuiz,
    saveLessonProgress,
    clearProgress,
    navigate
  }

  return (
    <div className="shell app-layout">
      <a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content').focus() }}>Skip to content</a>
      <aside className={`app-sidebar ${mobileNavOpen ? 'nav-open' : ''}`}>
        <div className="sidebar-brand-row"><a className="brand" href="#/home"><span className="brand-mark"><Icon name="code" size={23} /></span><span>SQL Master<small>LEARN WITH PURPOSE</small></span></a><button className="mobile-nav-toggle icon-button" aria-label="Toggle navigation" aria-expanded={mobileNavOpen} aria-controls="workspace-navigation" onClick={() => setMobileNavOpen(value => !value)}><Icon name={mobileNavOpen ? 'close' : 'menu'} /></button></div>
        <div id="workspace-navigation" className="sidebar-navigation"><p className="nav-label">LEARN & BUILD</p><nav aria-label="Main navigation">
          {[['home', 'Dashboard', 'home'], ['lessons', 'Learning path', 'book'], ['practice', 'SQL practice', 'code'], ['projects', 'Guided projects', 'folder'], ['interviews', 'Interview prep', 'briefcase'], ['quiz', 'Knowledge checks', 'check']].map(([id, label, icon]) => <a key={id} href={`#/${id}`} onClick={() => setMobileNavOpen(false)} className={page === id ? 'nav-link active' : 'nav-link'} aria-current={page === id ? 'page' : undefined}><Icon name={icon} size={19} />{label}{id === 'projects' && <small className="nav-new">NEW</small>}</a>)}
        </nav><p className="nav-label personal-label">YOUR SPACE</p><nav aria-label="Personal navigation"><a href="#/progress" onClick={() => setMobileNavOpen(false)} className={`nav-link ${page === 'progress' ? 'active' : ''}`} aria-current={page === 'progress' ? 'page' : undefined}><Icon name="chart" size={19} />My progress</a></nav></div>
        <div className="sidebar-note"><span className="sidebar-spark"><Icon name="spark" size={22} /></span><h3>One query closer.</h3><p>A few focused minutes today can make a difference tomorrow.</p><a href="#/practice">Make time to practice <Icon name="arrow" size={14} /></a></div>
        <span className="connection"><i className={ping === 'pong' ? 'online' : ''} />{ping === 'pong' ? 'Practice server connected' : ping === 'loading' ? 'Connecting...' : 'Offline learning mode'}</span>
      </aside>
      <main id="main-content" className="main-content" tabIndex={-1}>
      <header className="workspace-header"><div className="header-breadcrumb">Workspace <span>/</span><strong>{({ home: 'Dashboard', lessons: 'Learning path', practice: 'SQL practice', interviews: 'Interview prep', projects: 'Guided projects', quiz: 'Knowledge checks', progress: 'My progress', login: 'Log in', register: 'Register' })[page]}</strong></div><div className="header-actions"><button className="workspace-search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search platform"><Icon name="search" size={17} /><span>Search anything</span><kbd>Ctrl K</kbd></button><div className="learner-profile">{authLoading ? <span>Loading account...</span> : account ? <><a href="#/progress" className="profile-link"><span className="avatar">{account.user.name.slice(0, 1).toUpperCase()}</span><span>{account.user.name} <small>{account.score} XP</small></span></a><button className="ghost" disabled={accountBusy} onClick={logout}>Log out</button></> : <><button className="ghost" onClick={() => navigate('login')}>Log in</button><button onClick={() => navigate('register')}>Get started</button></>}</div></div></header>
      <div className="page-view" key={page}>
      {error && <div role="alert" className="error-banner">{error}</div>}
      {ping.startsWith('offline') && <p className="error-banner" role="status">You can read lessons offline. Connect the backend to run queries and submit quizzes.</p>}
      {['login', 'register'].includes(page) && <AuthPage key={page} mode={page} authenticate={authenticate} navigate={navigate} accountBusy={accountBusy} />}
      {page === 'home' && <HomePage {...pageProps} questionCount={libraryStats.practice} />}
      {page === 'lessons' && <LessonsPage {...pageProps} />}
      {page === 'practice' && <PracticeLibrary key={`practice-${account?.user.id || 'guest'}`} {...pageProps} />}
      {page === 'interviews' && <PracticeLibrary key={`interviews-${account?.user.id || 'guest'}`} {...pageProps} track="interview" />}
      {page === 'projects' && <ProjectsPage {...pageProps} />}
      {page === 'quiz' && <QuizPage {...pageProps} />}
      {page === 'progress' && <ProgressPage {...pageProps} />}
      </div>
      </main>
      <WorkspaceSearch open={searchOpen} onClose={() => setSearchOpen(false)} lessons={lessons} navigate={navigate} openLesson={openLesson} openProject={openProject} openPractice={openPractice} />
    </div>
  )
}
