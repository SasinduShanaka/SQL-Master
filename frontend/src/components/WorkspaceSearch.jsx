import React, { useEffect, useMemo, useRef, useState } from 'react'
import projects from '../../../shared/projects.json'
import Icon from './Icon'

export default function WorkspaceSearch({ open, onClose, lessons, navigate, openLesson, openProject, openPractice }) {
  const dialog = useRef(null)
  const input = useRef(null)
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (open) { setQuery(''); dialog.current.showModal(); input.current.focus() }
    else dialog.current?.close()
  }, [open])
  const matches = useMemo(() => {
    const items = [
      ...[['home', 'Dashboard'], ['lessons', 'Learning path'], ['practice', 'SQL practice'], ['interviews', 'Interview preparation'], ['projects', 'Guided projects'], ['quiz', 'Knowledge checks'], ['progress', 'My progress']].map(([id, title]) => ({ key: id, title, detail: 'Workspace', icon: 'home', action: () => navigate(id) })),
      ...lessons.map(lesson => ({ key: lesson.id, title: lesson.title, detail: `${lesson.level} lesson · ${lesson.topic}`, icon: 'book', action: () => openLesson({ id: lesson.id }) })),
      ...projects.map(project => ({ key: project.id, title: project.title, detail: `${project.level} project · ${project.skills.join(', ')}`, icon: 'folder', action: () => openProject(project.id) })),
    ]
    const terms = query.toLowerCase().trim().split(/\s+/)
    return items.filter(item => terms.every(term => `${item.title} ${item.detail}`.toLowerCase().includes(term))).slice(0, 9)
  }, [query, lessons, navigate, openLesson, openProject])
  function choose(action) { onClose(); action() }
  return <dialog className="workspace-search-dialog" ref={dialog} onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose() }} aria-labelledby="workspace-search-title"><div className="search-dialog-header"><Icon name="search" /><label className="sr-only" htmlFor="workspace-search-input" id="workspace-search-title">Search lessons, projects, and pages</label><input ref={input} id="workspace-search-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a lesson, topic, or project…" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (matches[0]) choose(matches[0].action) } }} /><button className="icon-button" aria-label="Close search" onClick={onClose}><Icon name="close" size={18} /></button></div><div className="search-results"><p className="eyebrow">{query ? 'SEARCH RESULTS' : 'QUICK NAVIGATION'}</p>{matches.map(item => <button key={item.key} onClick={() => choose(item.action)}><span className="search-item-icon"><Icon name={item.icon} size={19} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><Icon name="arrow" size={16} /></button>)}{!matches.length && <p className="empty-state">No lessons or projects match this search.</p>}{query.trim() && <button className="search-practice" onClick={() => choose(() => openPractice({ search: query.trim() }))}><Icon name="code" size={18} /><span>Search practice questions for “{query.trim()}”</span><Icon name="arrow" size={16} /></button>}</div><footer><span>Enter to open the first result · Tab to browse</span><kbd>Esc</kbd> to close</footer></dialog>
}
