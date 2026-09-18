import React, { useEffect, useState } from 'react'
import projects from '../../../shared/projects.json'
import Icon from '../components/Icon'

export default function ProjectsPage({ account, openQuestion, projectToOpen, consumeProject, navigate }) {
  const [selectedId, setSelectedId] = useState(projectToOpen || projects[0].id)
  const [level, setLevel] = useState('')
  useEffect(() => {
    if (projectToOpen) { setSelectedId(projectToOpen); setLevel(''); consumeProject?.() }
  }, [projectToOpen])
  const selected = projects.find(project => project.id === selectedId) || projects[0]
  const solved = new Set(account?.solvedQuestions || [])
  const completed = selected.steps.filter(step => solved.has(step.id)).length
  const nextStep = selected.steps.find(step => !solved.has(step.id)) || selected.steps[0]

  return <div className="projects-page">
    <div className="page-title"><p className="eyebrow">FROM QUERIES TO ANSWERS</p><h1>Put your skills to work.</h1><p className="muted">Guided projects with a business brief, realistic sample data, and checked SQL tasks.</p></div>
    <div className="level-tabs" aria-label="Project difficulty">{['', 'beginner', 'intermediate', 'advanced'].map(item => <button key={item} className={`tab ${level === item ? 'active' : ''}`} aria-pressed={level === item} onClick={() => setLevel(item)}>{item || 'All projects'}</button>)}</div>
    <div className="project-grid">{projects.filter(project => !level || project.level === level).map(project => {
      const done = project.steps.filter(step => solved.has(step.id)).length
      return <button key={project.id} className={`project-card ${selectedId === project.id ? 'is-selected' : ''}`} aria-pressed={selectedId === project.id} onClick={() => setSelectedId(project.id)}>
        <span className={`project-art ${project.color}`}><Icon name={project.icon} size={34} /><span className="project-art-pattern" aria-hidden="true" /></span>
        <span className="project-card-body"><span className="project-meta"><span className={`difficulty ${project.level}`}>{project.level}</span><span>{project.minutes} min · estimate</span></span><strong>{project.title}</strong><span className="muted">{project.description}</span><span className="project-card-footer">{done === project.steps.length ? 'Project completed' : `${done} / ${project.steps.length} tasks solved`}<Icon name={done === project.steps.length ? 'check' : 'arrow'} size={17} /></span></span>
      </button>
    })}</div>
    <section className="project-brief card" aria-label="Selected project brief">
      <div className="project-brief-copy"><p className="eyebrow">YOUR PROJECT BRIEF</p><h2>{selected.title}</h2><p>{selected.brief}</p><div className="skill-tags">{selected.skills.map(skill => <span key={skill}>{skill}</span>)}</div><h3>What you will build</h3><p className="muted">{selected.outcome}</p><div className="project-dataset"><Icon name="database" /><span>Sample datasets: <strong>{selected.tables.join(', ')}</strong></span></div><button onClick={() => openQuestion(nextStep)}>{completed === selected.steps.length ? 'Revisit project' : completed ? 'Continue project' : 'Start project'}<Icon name="arrow" size={17} /></button>{!account && <p className="small-note">Explore freely. <button className="text-button" onClick={() => navigate('register')}>Create an account</button> to submit tasks and save project completion.</p>}</div>
      <div className="project-step-list"><div className="section-header"><h3>Project milestones</h3><span className="muted">{completed} / {selected.steps.length}</span></div><progress max={selected.steps.length} value={completed} aria-label={`${selected.title} completion`} /><ol>{selected.steps.map((step, index) => <li key={step.id} className={solved.has(step.id) ? 'is-complete' : ''}><span className="step-dot">{solved.has(step.id) ? <Icon name="check" size={16} /> : index + 1}</span><div><h4>{step.title}</h4><p>{step.description}</p><button className="text-button" onClick={() => openQuestion(step)}>{solved.has(step.id) ? 'Review task' : 'Open task'} <Icon name="arrow" size={14} /></button></div></li>)}</ol></div>
    </section>
  </div>
}
