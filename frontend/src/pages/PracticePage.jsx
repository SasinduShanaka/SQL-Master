import React from 'react'

export default function PracticePage({ sql, setSql, runSql, requestHint, hint, sqlResult, navigate }) {
  return (
    <section className="card practice-panel page-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Practice lab</p>
          <h2>SQL Playground</h2>
          <p className="compact-copy">Use the editor like a workbook. Run queries and ask for a small hint if you get stuck.</p>
        </div>
        <button className="ghost" onClick={() => navigate('home')}>Back home</button>
      </div>
      <textarea value={sql} onChange={(event) => setSql(event.target.value)} rows={11} />
      <div className="actions">
        <button onClick={runSql}>Run query</button>
        <button className="ghost" onClick={requestHint}>Get AI hint</button>
        <span className="hint">{hint || 'Try the starter query or write your own.'}</span>
      </div>
      <div className="result-box">
        <strong>Result</strong>
        <pre>{sqlResult ? JSON.stringify(sqlResult, null, 2) : 'No query executed yet.'}</pre>
      </div>
    </section>
  )
}