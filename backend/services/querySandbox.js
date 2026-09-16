const { fork } = require('node:child_process')
const path = require('node:path')
let active = 0

function executeSandbox(data) {
  if (active >= 4) return Promise.resolve({ error: 'The query service is busy. Please try again shortly.' })
  active++
  return new Promise(resolve => {
    let finished = false
    let child
    try {
      child = fork(path.join(__dirname, 'queryProcess.js'), [], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'], execArgv: ['--max-old-space-size=128'], windowsHide: true })
    } catch {
      active--
      resolve({ error: 'The query service could not start. Please try again.' })
      return
    }
    const timer = setTimeout(() => finish({ error: 'Query exceeded the 8-second time limit. Simplify your query and try again.' }), 8000)
    function finish(result) {
      if (finished) return
      finished = true
      clearTimeout(timer)
      child.kill()
      active--
      resolve(result)
    }
    child.once('message', finish)
    child.once('error', () => finish({ error: 'Query exceeded available resources or could not be evaluated.' }))
    child.once('exit', () => finish({ error: 'The query stopped before returning a result.' }))
    child.send(data, error => { if (error) finish({ error: 'The query service could not accept the query.' }) })
  })
}

module.exports = { executeSandbox }
