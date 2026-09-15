import React from 'react'

export default function ProgressPage({ progress, completedLessons, roadmap, clearProgress, navigate }) {
  return (
    <section className="card page-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Progress</p>
          <h2>Snapshot</h2>
          <p className="compact-copy">Everything is saved locally in this browser so students can continue where they left off.</p>
        </div>
        <div className="page-actions">
          <button className="ghost" onClick={() => navigate('home')}>Back home</button>
          <button className="ghost" onClick={clearProgress}>Clear saved progress</button>
        </div>
      </div>

      <div className="section-grid progress-grid">
        <div className="card mini-stat">
          <span className="muted">Saved entries</span>
          <strong>{progress.length}</strong>
          <p className="compact-copy">Lesson and quiz activity stored locally.</p>
        </div>
        <div className="card mini-stat">
          <span className="muted">Completed lessons</span>
          <strong>{completedLessons.length}</strong>
          <p className="compact-copy">The count of finished lessons.</p>
        </div>
        <div className="card mini-stat">
          <span className="muted">Roadmap steps</span>
          <strong>{roadmap.length}</strong>
          <p className="compact-copy">The full study path in the app.</p>
        </div>
      </div>

      <div className="progress-list expanded">
        {progress.length ? progress.map((item, index) => (
          <div key={`${item.lessonId || item.quizId}-${index}`} className="progress-item">
            <strong>{item.lessonId || item.quizId}</strong>
            <span>{item.status || (item.correct ? 'Correct' : 'Incorrect')}</span>
          </div>
        )) : <p className="muted">No saved progress yet.</p>}
      </div>
    </section>
  )
}