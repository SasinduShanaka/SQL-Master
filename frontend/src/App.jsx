import React, { useEffect, useMemo, useState } from 'react'
import HomePage from './pages/HomePage'
import LessonsPage from './pages/LessonsPage'
import PracticePage from './pages/PracticePage'
import ProgressPage from './pages/ProgressPage'
import QuizPage from './pages/QuizPage'

const starterSql = `SELECT name, score, cohort
FROM students
WHERE score >= 85
ORDER BY score DESC;`

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

const fallbackExercises = [
  {
    order: 1,
    id: 'exercise-high-scores',
    lessonId: 'intro-select',
    tableNames: ['students'],
    question: 'Show the names and scores of students who scored at least 85, sorted highest first.',
    goal: 'Practice SELECT, WHERE, and ORDER BY.',
    hints: ['Start with SELECT name, score', 'Filter with WHERE score >= 85', 'Sort with ORDER BY score DESC'],
    starterSql: 'SELECT name, score\nFROM students\nWHERE score >= 85\nORDER BY score DESC;',
    solutionSql: 'SELECT name, score FROM students WHERE score >= 85 ORDER BY score DESC;'
  },
  {
    order: 2,
    id: 'exercise-active-enrollments',
    lessonId: 'filtering',
    tableNames: ['enrollments'],
    question: 'Find every active enrollment in SQL Basics.',
    goal: 'Practice filtering with WHERE and text conditions.',
    hints: ['Look for course = SQL Basics', 'Filter status = active'],
    starterSql: "SELECT studentId, course, status\nFROM enrollments\nWHERE course = 'SQL Basics' AND status = 'active';",
    solutionSql: "SELECT studentId, course, status FROM enrollments WHERE course = 'SQL Basics' AND status = 'active';"
  },
  {
    order: 3,
    id: 'exercise-web-cohort',
    lessonId: 'intro-select',
    tableNames: ['students'],
    question: 'List the students from the web cohort only.',
    goal: 'Practice WHERE with a categorical field.',
    hints: ['Filter cohort = web', 'Return id and name'],
    starterSql: "SELECT id, name\nFROM students\nWHERE cohort = 'web';",
    solutionSql: "SELECT id, name FROM students WHERE cohort = 'web';"
  },
  {
    order: 4,
    id: 'exercise-course-count',
    lessonId: 'joins',
    tableNames: ['courses', 'enrollments'],
    question: 'Count how many enrollments each course has.',
    goal: 'Practice aggregation and GROUP BY.',
    hints: ['Use COUNT(*) and GROUP BY course'],
    starterSql: 'SELECT course, COUNT(*) AS enrollment_count\nFROM enrollments\nGROUP BY course;',
    solutionSql: 'SELECT course, COUNT(*) AS enrollment_count FROM enrollments GROUP BY course;'
  }
]

const fallbackTables = [
  {
    name: 'students',
    description: 'Demo student records for reading and filtering.',
    columns: ['id', 'name', 'score', 'cohort'],
    rows: [
      { id: 1, name: 'Ava', score: 91, cohort: 'web' },
      { id: 2, name: 'Noah', score: 84, cohort: 'data' },
      { id: 3, name: 'Mia', score: 87, cohort: 'web' }
    ]
  },
  {
    name: 'enrollments',
    description: 'Student course enrollment rows.',
    columns: ['studentId', 'course', 'status'],
    rows: [
      { studentId: 1, course: 'SQL Basics', status: 'active' },
      { studentId: 2, course: 'SQL Basics', status: 'inactive' },
      { studentId: 3, course: 'Data Modeling', status: 'active' }
    ]
  },
  {
    name: 'courses',
    description: 'Course catalog used in join and count exercises.',
    columns: ['id', 'title', 'category'],
    rows: [
      { id: 1, title: 'SQL Basics', category: 'core' },
      { id: 2, title: 'Data Modeling', category: 'core' },
      { id: 3, title: 'Analytics', category: 'advanced' }
    ]
  }
]

const progressStorageKey = 'sqlmaster_progress'

function readProgress() {
  try {
    const stored = localStorage.getItem(progressStorageKey)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export default function App() {
  const [ping, setPing] = useState('loading')
  const [roadmap, setRoadmap] = useState([])
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [exercises, setExercises] = useState([])
  const [tables, setTables] = useState([])
  const [progress, setProgress] = useState(() => readProgress())
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
    setTables(fallbackTables)
  }

  useEffect(() => {
    let retryId
    let cancelled = false

    async function loadContent() {
      try {
        const [pingData, catalogData, lessonData, quizData, exerciseData, tableData] = await Promise.all([
          fetch('/api/ping').then((response) => response.json()),
          fetch('/api/catalog').then((response) => response.json()),
          fetch('/api/lessons').then((response) => response.json()),
          fetch('/api/quizzes').then((response) => response.json()),
          fetch('/api/exercises').then((response) => response.json()),
          fetch('/api/tables').then((response) => response.json())
        ])

        if (cancelled) return

        setPing(pingData.message)
        setRoadmap(catalogData.roadmap || [])
        setLessons(lessonData.lessons || [])
        setQuizzes(quizData.quizzes || [])
        setExercises(exerciseData.exercises || [])
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
    localStorage.setItem(progressStorageKey, JSON.stringify(progress))
  }, [progress])

  useEffect(() => {
    function handleHashChange() {
      setPage(window.location.hash.replace('#/', '') || 'home')
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const suggestedLesson = useMemo(() => lessons[0], [lessons])
  const completionCount = progress.filter((item) => item.status === 'completed').length
  const completedLessons = lessons.filter((lesson) => progress.some((item) => item.lessonId === lesson.id && item.status === 'completed'))
  const inProgressLesson = lessons.find((lesson) => progress.some((item) => item.lessonId === lesson.id && item.status === 'in-progress')) || lessons[0]
  const nextLesson = lessons.find((lesson) => !progress.some((item) => item.lessonId === lesson.id && item.status === 'completed')) || lessons[0]
  const recentProgress = progress.slice(0, 4)

  async function runSql() {
    const response = await fetch('/api/sql/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql })
    })
    setSqlResult(await response.json())
  }

  async function requestHint() {
    const response = await fetch('/api/ai/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: sql })
    })
    const data = await response.json()
    setHint(data.hint)
  }

  async function submitQuiz(quizId) {
    const response = await fetch(`/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answerIndex: quizPick[quizId] })
    })
    const result = await response.json()
    setProgress((current) => [
      {
        kind: 'quiz',
        quizId,
        correct: result.correct,
        explanation: result.explanation,
        selectedIndex: quizPick[quizId],
        updatedAt: new Date().toISOString()
      },
      ...current.filter((item) => item.quizId !== quizId || item.kind !== 'quiz')
    ])
  }

  function saveLessonProgress(lessonId, status) {
    setProgress((current) => [
      {
        kind: 'lesson',
        lessonId,
        status,
        score: status === 'completed' ? 100 : 50,
        updatedAt: new Date().toISOString()
      },
      ...current.filter((item) => item.lessonId !== lessonId || item.kind !== 'lesson')
    ])
  }

  function clearProgress() {
    localStorage.removeItem(progressStorageKey)
    setProgress([])
  }

  function navigate(nextPage) {
    window.location.hash = `/${nextPage}`
  }

  const pageProps = {
    ping,
    roadmap,
    lessons,
    quizzes,
    exercises,
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
    setSql,
    setQuizPick,
    runSql,
    requestHint,
    submitQuiz,
    saveLessonProgress,
    clearProgress,
    navigate
  }

  return (
    <div className="shell app-layout">
      <header className="topbar card">
        <div>
          <p className="eyebrow">SQL Master</p>
          <h2>Student dashboard</h2>
        </div>
        <div className="topbar-actions">
          <span className="status-pill compact">API: {ping}</span>
          <button className="ghost" onClick={() => navigate('home')}>Home</button>
          <button className="ghost" onClick={() => navigate('lessons')}>Lessons</button>
          <button className="ghost" onClick={() => navigate('practice')}>Practice</button>
          <button className="ghost" onClick={() => navigate('quiz')}>Quiz</button>
          <button className="ghost" onClick={() => navigate('progress')}>Progress</button>
        </div>
      </header>

      {page === 'home' && <HomePage {...pageProps} />}
      {page === 'lessons' && <LessonsPage {...pageProps} />}
      {page === 'practice' && <PracticePage {...pageProps} />}
      {page === 'quiz' && <QuizPage {...pageProps} />}
      {page === 'progress' && <ProgressPage {...pageProps} />}
    </div>
  )
}