import React from 'react'

export default function HomePage({ lessons, quizzes, completionCount, inProgressLesson, nextLesson, roadmap, navigate }) {
  return (
    <>
      <section className="hero card">
        <div className="hero-copy">
          <p className="eyebrow">Learn by doing</p>
          <h1>Build SQL confidence with a clean study flow, guided practice, and visible progress.</h1>
          <p className="lead">
            The dashboard is split into separate study pages so students can move through the app without feeling overwhelmed.
          </p>
          <div className="hero-actions">
            <button onClick={() => navigate('lessons')}>Start learning</button>
            <button className="ghost" onClick={() => navigate('practice')}>Open SQL practice</button>
          </div>
          <div className="hero-metrics">
            <div><strong>{lessons.length || '4+'}</strong><span>Lessons</span></div>
            <div><strong>{quizzes.length || '2+'}</strong><span>Quizzes</span></div>
            <div><strong>{completionCount}</strong><span>Completed</span></div>
          </div>
        </div>

        <aside className="hero-panel">
          <div className="panel-stack">
            <div className="info-card accent">
              <span className="muted">Continue with</span>
              <strong>{inProgressLesson?.title || 'Getting Started with SELECT'}</strong>
              <p>{inProgressLesson?.summary || 'Read rows from a table and sort results.'}</p>
            </div>
            <div className="info-card">
              <span className="muted">Next goal</span>
              <strong>{nextLesson?.title || 'Start a lesson'}</strong>
              <p>{nextLesson?.topic || 'Choose a lesson to begin.'}</p>
            </div>
            <div className="study-tips">
              <span className="muted">Study path</span>
              <ul>
                <li>Read a lesson</li>
                <li>Run a query</li>
                <li>Check the quiz</li>
                <li>Save progress locally</li>
              </ul>
            </div>
          </div>
        </aside>
      </section>

      <section className="section-grid">
        <div className="card mini-stat">
          <span className="muted">Lessons on the path</span>
          <strong>{lessons.length}</strong>
          <p className="compact-copy">A compact overview of the learning track.</p>
        </div>
        <div className="card mini-stat">
          <span className="muted">Quiz checks</span>
          <strong>{quizzes.length}</strong>
          <p className="compact-copy">Quick checkpoints after each study chunk.</p>
        </div>
        <div className="card mini-stat">
          <span className="muted">Roadmap steps</span>
          <strong>{roadmap.length}</strong>
          <p className="compact-copy">A simple sequence from basics to advanced.</p>
        </div>
      </section>

      <section className="card notes-panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Focus</p>
            <h2>Suggested next lesson</h2>
          </div>
          <button className="ghost" onClick={() => navigate('lessons')}>Open lessons</button>
        </div>
        <div className="notes-layout">
          <div>
            <strong>{nextLesson ? nextLesson.title : 'Loading lessons...'}</strong>
            <p>{nextLesson ? nextLesson.explanation : 'Loading lessons...'}</p>
          </div>
          <div className="notes-bubble">
            <span className="muted">Why this matters</span>
            <p>Students usually understand a learning path better when each section has its own page.</p>
          </div>
        </div>
      </section>
    </>
  )
}