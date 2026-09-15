import React from 'react'

export default function LessonsPage({ lessons, exercises, tables, progress, clearProgress, saveLessonProgress, navigate, setSql }) {
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
      <div className="lesson-overview-grid">
        <div className="lesson-list">
          {lessons.map((lesson) => {
            const savedProgress = progress.find((item) => item.lessonId === lesson.id)

            return (
              <article key={lesson.id} className="lesson-item">
                <div className="lesson-copy">
                  <div className="lesson-meta">
                    <span className="pill">{lesson.level}</span>
                    <span className="muted">{lesson.topic}</span>
                  </div>
                  <h3>{lesson.title}</h3>
                  <p>{lesson.summary}</p>
                  <p className="lesson-explainer">{lesson.explanation}</p>
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
                  <p className="compact-copy">Columns: {table.columns.join(', ')}</p>
                  <div className="sample-rows">
                    {table.rows.map((row, index) => (
                      <pre key={`${table.name}-${index}`}>{JSON.stringify(row, null, 2)}</pre>
                    ))}
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
            <p className="compact-copy">These prompts tell the student what data to retrieve and which tables to use.</p>
          </div>
        </div>
        <div className="exercise-grid">
          {exercises.map((exercise) => (
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
                <button className="ghost" onClick={() => {
                  setSql(exercise.starterSql)
                  navigate('practice')
                }}>Try in practice</button>
                <button onClick={() => saveLessonProgress(exercise.lessonId, 'in-progress')}>Mark lesson started</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}