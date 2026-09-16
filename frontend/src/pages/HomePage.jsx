import React from 'react'

const tracks = [
  { level: 'beginner', number: '01', title: 'Start with the essentials', description: 'Get comfortable selecting, filtering, and sorting your first rows.', tags: 'SELECT / WHERE / ORDER BY' },
  { level: 'intermediate', number: '02', title: 'Connect the dots', description: 'Combine tables and turn individual records into useful summaries.', tags: 'JOIN / GROUP BY / HAVING' },
  { level: 'advanced', number: '03', title: 'Think like an analyst', description: 'Break down complex questions and build clear, multi-step reports.', tags: 'SUBQUERIES / CTEs / CASE' }
]

export default function HomePage({ lessons, questionCount, completionCount, nextLesson, progress, navigate }) {
  const percent = lessons.length ? Math.round(completionCount / lessons.length * 100) : 0

  return <>
    <div className="page-title">
      <p className="eyebrow">YOUR SQL JOURNEY</p>
      <h1>Practice SQL like it is already part of your day.</h1>
      <p className="muted">A focused workspace for lessons, runnable questions, interview drills, saved progress, and small daily wins.</p>
    </div>
    <section className="welcome-banner">
      <div className="welcome-copy">
        <span className="banner-label">LEARN BY DOING</span>
        <h2>Pick a question, write the query, see the result.</h2>
        <p>Move from syntax to confidence with guided lessons, realistic datasets, hints, and progress that follows your account.</p>
        <div className="hero-actions">
          <button onClick={() => navigate('practice')}>Start practicing <span>-&gt;</span></button>
          <button className="ghost" onClick={() => navigate('lessons')}>{completionCount ? 'Continue lessons' : 'Explore lessons'}</button>
        </div>
      </div>
      <div className="code-preview" aria-label="SQL query example">
        <div className="code-top"><span>SQL</span><span>daily_practice.sql</span></div>
        <pre><span>SELECT</span> skill, confidence<br /><span>FROM</span> learner_growth<br /><span>WHERE</span> practice = <em>'consistent'</em><br /><span>ORDER BY</span> progress DESC;</pre>
        <div className="code-bottom">Passed checks / saved progress / ready for the next one</div>
      </div>
    </section>
    <section className="live-strip" aria-label="Practice activity">
      <span>Typing query</span>
      <span>Running checks</span>
      <span>Saving XP</span>
      <span>Unlocking next step</span>
    </section>
    <section className="section-grid dashboard-stats" aria-label="Learning statistics">
      <div className="card mini-stat"><span className="muted">Learning path</span><strong>{lessons.length} <small>lessons</small></strong><p>Three levels. One clear direction.</p></div>
      <div className="card mini-stat"><span className="muted">Practice library</span><strong>{questionCount || 0} <small>challenges</small></strong><p>Real questions. Runnable datasets.</p></div>
      <div className="card mini-stat"><span className="muted">Your progress</span><strong>{percent}<small>% completed</small></strong><progress max="100" value={percent} aria-label="Lesson completion" /></div>
    </section>
    <section>
      <div className="section-header"><div><p className="eyebrow">STEP BY STEP</p><h2>A path for every stage</h2></div><a href="#/lessons">View all lessons -&gt;</a></div>
      <div className="section-grid track-grid">{tracks.map(track => {
        const list = lessons.filter(lesson => lesson.level === track.level)
        const done = list.filter(lesson => progress.some(item => item.lessonId === lesson.id && item.status === 'completed')).length
        return <article className="card track-card" key={track.level}><div className="section-header"><span className="track-number">{track.number}</span><span className={`difficulty ${track.level}`}>{track.level}</span></div><h3>{track.title}</h3><p>{track.description}</p><small className="track-tags">{track.tags}</small><div className="track-footer"><span>{done} / {list.length} lessons completed</span><a href="#/lessons" aria-label={`Explore ${track.level} lessons`}>Open</a></div></article>
      })}</div>
    </section>
    <section className="card continue-card"><span className="continue-icon" aria-hidden="true">SQL</span><div><p className="eyebrow">{percent === 100 ? 'KEEP YOUR SKILLS SHARP' : 'YOUR NEXT STEP'}</p><h3>{percent === 100 ? 'Put your knowledge into practice' : nextLesson?.title || 'Your learning path is loading'}</h3><p className="muted">{percent === 100 ? 'Revisit the challenges and try another approach.' : nextLesson?.summary}</p></div><button className="ghost" onClick={() => navigate(percent === 100 ? 'practice' : 'lessons')}>{percent === 100 ? 'Open practice' : 'Open lesson'} -&gt;</button></section>
    <footer className="page-footer">SQL Master <span>Built for curious minds. One query at a time.</span></footer>
  </>
}
