import React from 'react'

export default function QuizPage({ quizzes, quizPick, setQuizPick, submitQuiz, progress, navigate, accountBusy }) {
  return (
    <section className="card quiz-panel page-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Knowledge check</p>
          <h2>Quiz practice</h2>
          <p className="compact-copy">Use quizzes to reinforce the lesson you just read.</p>
        </div>
        <button className="ghost" onClick={() => navigate('home')}>Back home</button>
      </div>
      <div className="quiz-list">
        {!quizzes.length && <p className="empty-state">Knowledge checks will appear when the learning server is connected.</p>}
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="quiz-item">
            <p className="quiz-question">{quiz.question}</p>
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
            <div className="quiz-footer">
              <button disabled={accountBusy || !Number.isInteger(quizPick[quiz.id])} onClick={() => submitQuiz(quiz.id)}>Submit answer</button>
              <span className="hint">{quiz.lessonId}</span>
            </div>
            <div className="result-box compact-result">
              {progress.filter(item => item.quizId === quiz.id).map(item => <p key={item.quizId} role="status"><strong>{item.correct ? 'Correct - well done! ' : 'Not quite. '}</strong>{item.explanation}</p>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}