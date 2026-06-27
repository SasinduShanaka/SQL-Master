import React, { useEffect, useMemo, useState } from 'react'

const starterSql = `SELECT name, score, cohort
FROM students
WHERE score >= 85
ORDER BY score DESC;`

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
  const [progress, setProgress] = useState(() => readProgress())
  const [sql, setSql] = useState(starterSql)
  const [sqlResult, setSqlResult] = useState(null)
  const [quizPick, setQuizPick] = useState({})
  const [hint, setHint] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/ping').then((response) => response.json()),
      fetch('/api/catalog').then((response) => response.json()),
      fetch('/api/lessons').then((response) => response.json()),
      fetch('/api/quizzes').then((response) => response.json())
    ])
      .then(([pingData, catalogData, lessonData, quizData]) => {
        setPing(pingData.message)
        setRoadmap(catalogData.roadmap || [])
        setLessons(lessonData.lessons || [])
        setQuizzes(quizData.quizzes || [])
      })
      .catch(() => setPing('offline'))
  }, [])

  useEffect(() => {
    localStorage.setItem(progressStorageKey, JSON.stringify(progress))
  }, [progress])

  const suggestedLesson = useMemo(() => lessons[0], [lessons])
  const completionCount = progress.filter((item) => item.status === 'completed').length

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

  return (
    <div className="shell">
      <section className="hero card">
        <div className="hero-copy">
          <p className="eyebrow">SQL Master</p>
          <h1>Learn SQL from beginner to advanced with practice that feels real.</h1>
          <p className="lead">
            Structured lessons, hands-on query execution, quizzes, and guided progress tracking in one learning platform.
          </p>
          <div className="hero-metrics">
            <div><strong>{lessons.length || '4+'}</strong><span>Lessons</span></div>
            <div><strong>{quizzes.length || '2+'}</strong><span>Quizzes</span></div>
            <div><strong>{completionCount}</strong><span>Completed</span></div>
          </div>
        </div>
        <div className="hero-panel">
          <div className="status-pill">API ping: {ping}</div>
          <div className="roadmap-card">
            <div className="section-header compact">
              <h2>Learning roadmap</h2>
              <span className="muted">Progress saved locally</span>
            </div>
            <ul>
              {roadmap.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid two-up">
        <div className="card">
          <div className="section-header">
            <h2>Browser storage</h2>
            <button className="ghost" onClick={clearProgress}>Clear saved progress</button>
          </div>
          <p className="lead compact">
            Lesson completion and quiz attempts are stored in your browser, so the app works without a user database.
          </p>
          <div className="progress-list compact">
            <div className="progress-item">
              <strong>{progress.length}</strong>
              <span>Saved entries</span>
            </div>
            <div className="progress-item">
              <strong>{completionCount}</strong>
              <span>Completed lessons</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <h2>Interactive SQL Playground</h2>
            <button className="ghost" onClick={requestHint}>Get AI hint</button>
          </div>
          <textarea value={sql} onChange={(event) => setSql(event.target.value)} rows={10} />
          <div className="actions">
            <button onClick={runSql}>Run query</button>
            <span className="hint">{hint || 'Try the starter query or write your own.'}</span>
          </div>
          <div className="result-box">
            <strong>Result</strong>
            <pre>{sqlResult ? JSON.stringify(sqlResult, null, 2) : 'No query executed yet.'}</pre>
          </div>
        </div>
      </section>

      <section className="grid two-up">
        <div className="card">
          <div className="section-header">
            <h2>Lesson preview</h2>
            <span className="muted">{suggestedLesson ? suggestedLesson.level : 'loading'}</span>
          </div>
          {lessons.map((lesson) => {
            const savedProgress = progress.find((item) => item.lessonId === lesson.id)

            return (
              <article key={lesson.id} className="lesson-item">
                <div className="lesson-copy">
                  <h3>{lesson.title}</h3>
                  <p>{lesson.summary}</p>
                  <small>{lesson.topic}</small>
                </div>
                <div className="lesson-actions">
                  <span className="progress-chip">{savedProgress?.status || 'not started'}</span>
                  <button className="ghost" onClick={() => saveLessonProgress(lesson.id, 'in-progress')}>Start</button>
                  <button onClick={() => saveLessonProgress(lesson.id, 'completed')}>Complete</button>
                </div>
              </article>
            )
          })}
        </div>

        <div className="card">
          <h2>Progress tracker</h2>
          <p className="lead compact">
            Track lesson completion and quiz activity. Everything here is preserved in localStorage.
          </p>
          <div className="progress-list">
            {progress.length ? progress.map((item, index) => (
              <div key={`${item.lessonId || item.quizId}-${index}`} className="progress-item">
                <strong>{item.lessonId || item.quizId}</strong>
                <span>{item.status || (item.correct ? 'Correct' : 'Incorrect')}</span>
              </div>
            )) : <p className="muted">No saved progress yet.</p>}
          </div>
        </div>
      </section>

      <section className="grid two-up">
        <div className="card">
          <h2>Quiz practice</h2>
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-item">
              <p>{quiz.question}</p>
              <div className="quiz-options">
                {quiz.options.map((option, index) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={quiz.id}
                      checked={quizPick[quiz.id] === index}
                      onChange={() => setQuizPick((current) => ({ ...current, [quiz.id]: index }))}
                    />
                    {option}
                  </label>
                ))}
              </div>
              <button onClick={() => submitQuiz(quiz.id)}>Submit answer</button>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Session notes</h2>
          <div className="result-box">
            <strong>Suggested next lesson</strong>
            <pre>{suggestedLesson ? `${suggestedLesson.title}\n${suggestedLesson.explanation}` : 'Loading lessons...'}</pre>
          </div>
        </div>
      </section>
    </div>
  )
}