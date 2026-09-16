import React, { useState } from 'react'

export default function LessonsPage({ lessons, exercises, tables, progress, clearProgress, saveLessonProgress, navigate, setSql, accountBusy }) {
  const [level, setLevel] = useState('')
  const filteredLessons = lessons.filter(lesson => !level || lesson.level === level)
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const selectedLesson = lessons.find(lesson => lesson.id === selectedLessonId) || filteredLessons[0]
  const selectedExercise = exercises.find(exercise => exercise.lessonId === selectedLesson?.id)
  const completedCount = lessons.filter(lesson => progress.some(item => item.lessonId === lesson.id && item.status === 'completed')).length
  const completionPercent = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0

  function tryExercise(exercise) {
    setSql(exercise.starterSql)
    navigate('practice')
  }

  return (
    <section className="card lesson-board page-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Learning path</p>
          <h2>Lessons</h2>
          <p className="compact-copy">Move through one lesson at a time and mark completion as you go.</p>
        </div>
        <div className="page-actions">
          <button className="ghost" onClick={() => navigate('home')}>Back home</button>
          <button className="ghost" onClick={clearProgress}>Clear saved progress</button>
        </div>
      </div>
      <div className="level-tabs" aria-label="Lesson difficulty">{['', 'beginner', 'intermediate', 'advanced'].map(item => <button key={item} className={`tab ${level === item ? 'active' : ''}`} aria-pressed={level === item} onClick={() => setLevel(item)}>{item || 'All lessons'}</button>)}</div>
      <div className="lesson-progress-strip"><span>{completedCount} / {lessons.length} lessons completed</span><progress max="100" value={completionPercent} aria-label="Lesson path completion" /></div>
      <div className="lesson-overview-grid">
        <aside className="lesson-jump-list" aria-label="Lesson navigation">
          {filteredLessons.map((lesson) => {
            const savedProgress = progress.find((item) => item.lessonId === lesson.id)
            return <button key={lesson.id} className={selectedLesson?.id === lesson.id ? 'selected' : ''} onClick={() => setSelectedLessonId(lesson.id)}><span>{String(lesson.order).padStart(2, '0')}</span><strong>{lesson.title}</strong><small>{savedProgress?.status || lesson.topic}</small></button>
          })}
        </aside>

        <div className="lesson-list">
          {selectedLesson && (() => {
            const savedProgress = progress.find((item) => item.lessonId === selectedLesson.id)

            return (
              <article key={selectedLesson.id} className="lesson-item focused-lesson">
                <div className="lesson-copy">
                  <div className="lesson-meta">
                    <span className="pill">{selectedLesson.level}</span>
                    <span className="muted">{selectedLesson.topic}</span>
                  </div>
                  <h3><span className="muted">{String(selectedLesson.order).padStart(2, '0')} / </span>{selectedLesson.title}</h3>
                  <p>{selectedLesson.summary}</p>
                  <p className="lesson-explainer">{selectedLesson.explanation}</p>
                  {selectedLesson.exampleSql && <pre className="lesson-code">{selectedLesson.exampleSql}</pre>}
                </div>
                {selectedExercise && <div className="lesson-challenge-box"><p className="eyebrow">Try it now</p><h4>{selectedExercise.question}</h4><p>{selectedExercise.goal}</p><div className="hint-stack">{selectedExercise.hints.map((hint) => <span key={hint} className="hint-pill">{hint}</span>)}</div><button onClick={() => tryExercise(selectedExercise)}>Open interactive exercise</button></div>}
                <div className="lesson-actions">
                  <span className="progress-chip">{savedProgress?.status || 'not started'}</span>
                  <button className="ghost" disabled={accountBusy || savedProgress?.status === 'completed'} onClick={() => saveLessonProgress(selectedLesson.id, 'in-progress')}>Start</button>
                  <button disabled={accountBusy || savedProgress?.status === 'completed'} onClick={() => saveLessonProgress(selectedLesson.id, 'completed')}>Complete</button>
                </div>
              </article>
            )
          })()}
        </div>

        <aside className="lesson-sidebar">
          <section className="card mini-stat">
            <span className="muted">Read this first</span>
            <strong>Questions to answer</strong>
            <p className="compact-copy">Each exercise is a real SQL task students can solve by reading the table preview and writing a query.</p>
          </section>

          <section className="card table-panel">
            <div className="section-header compact">
              <div>
                <p className="eyebrow">Data tables</p>
                <h3>Preview the data</h3>
              </div>
            </div>
            <div className="table-list">
              {tables.map((table) => (
                <article key={table.name} className="table-card">
                  <div className="table-card-head">
                    <strong>{table.name}</strong>
                    <span className="muted">{table.description}</span>
                  </div>
                  <p className="compact-copy">Showing {table.rows.length} of {table.rowCount ?? table.rows.length} rows</p>
                  <div className="table-scroll" role="region" aria-label={`${table.name} data preview`} tabIndex={0}>
                    <table>
                      <caption className="sr-only">{table.name} sample data</caption>
                      <thead>
                        <tr>{table.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, index) => (
                          <tr key={`${table.name}-${index}`}>
                            {table.columns.map(column => (
                              <td key={column}>{row[column] == null ? <span className="muted">NULL</span> : String(row[column])}</td>
                            ))}
                          </tr>
                        ))}
                        {!table.rows.length && <tr><td colSpan={table.columns.length}>No rows available.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="exercise-panel card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Guided tasks</p>
            <h3>Write the query</h3>
            <p className="compact-copy">Put the concepts into practice with these guided challenges.</p>
          </div>
        </div>
        <div className="exercise-grid">
          {exercises.filter(exercise => !level || exercise.level === level).slice(0, 12).map((exercise) => (
            <article key={exercise.id} className="exercise-card">
              <div className="lesson-meta">
                <span className="pill">{exercise.lessonId}</span>
                <span className="muted">Tables: {exercise.tableNames.join(', ')}</span>
              </div>
              <h4>{exercise.question}</h4>
              <p>{exercise.goal}</p>
              <div className="hint-stack">
                {exercise.hints.map((hint) => <span key={hint} className="hint-pill">{hint}</span>)}
              </div>
              <div className="exercise-actions">
                <button className="ghost" onClick={() => tryExercise(exercise)}>Try in practice</button>
                <button onClick={() => saveLessonProgress(exercise.lessonId, 'in-progress')}>Mark lesson started</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
