function namespace(code) {
  code()
}

namespace(function() {

/*** Start cross-compatibility ***/
// Used to detect if IDs include a direction, e.g. resize-top-left
if (!String.prototype.includes) {
  String.prototype.includes = function() {
    return String.prototype.indexOf.apply(this, arguments) !== -1
  }
}
Event.prototype.movementX = Event.prototype.movementX || Event.prototype.mozMovementX
Event.prototype.movementY = Event.prototype.movementY || Event.prototype.mozMovementY
Event.prototype.isRightClick = function() {
  return this.which === 3 || (this.touches && this.touches.length > 1)
}
/*** End cross-compatibility ***/

// https://stackoverflow.com/q/12571650
window_onerror = window.onerror
window.onerror = function(message, url, line) {
  console.error(message, url, line)
}

var tracks = {
  'start':   './data/panel_start_tracing.aac',
  'success': './data/panel_success.aac',
  'fail':    './data/panel_failure.aac',
  'abort':   './data/panel_abort_tracing.aac',
}
var audio = new Audio(src='./data/panel_start_tracing.aac')

window.PLAY_SOUND = function(name) {
  audio.pause()
  audio.src = tracks[name]
  audio.volume = localStorage.volume
  audio.play()
}

window.ERROR = function(message) {
  var request = new XMLHttpRequest()
  request.open('POST', '/error', true) // Fire and forget
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.send('data=' + message)
}

window.LINE_NONE     = 0
window.LINE_BLACK    = 1
window.LINE_BLUE     = 2
window.LINE_YELLOW   = 3
window.DOT_NONE      = 0
window.DOT_BLACK     = 1
window.DOT_BLUE      = 2
window.DOT_YELLOW    = 3
window.DOT_INVISIBLE = 4
window.CUSTOM_CROSS               = -1
window.CUSTOM_CROSS_FILLED        = -2
window.CUSTOM_CROSS_BLUE          = -3
window.CUSTOM_CROSS_BLUE_FILLED   = -4
window.CUSTOM_CROSS_YELLOW        = -5
window.CUSTOM_CROSS_YELLOW_FILLED = -6
window.CUSTOM_CURVE               = -7
window.CUSTOM_CURVE_FILLED        = -8
window.CUSTOM_CURVE_BLUE          = -9
window.CUSTOM_CURVE_BLUE_FILLED   = -10
window.CUSTOM_CURVE_YELLOW        = -11
window.CUSTOM_CURVE_YELLOW_FILLED = -12
window.CUSTOM_X = -13
window.GAP_NONE      = 0
window.GAP_BREAK     = 1
window.GAP_FULL      = 2

window.dotToSpokes = function(dot) {
  if (dot >= -12) return 0;
  else return (dot * -1) - 12
}

var animations = ''
var l = function(line) {animations += line + '\n'}
// pointer-events: none; allows for events to bubble up (so that editor hooks still work)
l('.line-1 {')
l('  fill: var(--line-default);')
l('  pointer-events: none;')
l('}')
l('.line-2 {')
l('  fill: var(--line-primary);')
l('  pointer-events: none;')
l('}')
l('.line-3 {')
l('  fill: var(--line-secondary);')
l('  pointer-events: none;')
l('}')
l('@keyframes line-success {to {fill: var(--line-success);}}')
l('@keyframes line-fail {to {fill: var(--line-failure);}}')
l('@keyframes error {to {fill: red;}}')
l('@keyframes fade {to {opacity: 0.35;}}')
l('@keyframes start-grow {from {r:12;} to {r: 24;}}')
// Neutral button style
l('#symboltheme, .loadButtonWrapper, button {')
l('  background-color: var(--alt-background);')
l('  border: 1px solid var(--border);')
l('  color: var(--text);')
l('  display: inline-block;')
l('  margin: 0px;')
l('  outline: none;')
l('  opacity: 1.0;')
l('  padding: 1px 6px;')
l('  -moz-appearance: none;')
l('  -webkit-appearance: none;')
l('}')
// Active (while held down) button style
l('#symboltheme:active, .loadButtonWrapper:active, button:active {background-color: var(--active);}')
// Disabled button style
l('#symboltheme:disabled, .loadButtonWrapper:disabled, button:disabled {opacity: 0.5;}')
// Selected button style (see https://stackoverflow.com/a/63108630)
l('#symboltheme:focus, .loadButtonWrapper:focus, button:focus {outline: none;}')
l = null

var style = document.createElement('style')
style.type = 'text/css'
style.title = 'animations'
style.appendChild(document.createTextNode(animations))
document.head.appendChild(style)

// Custom logging to allow leveling
var consoleError = console.error
var consoleWarn = console.warn
var consoleInfo = console.log
var consoleLog = console.log
var consoleDebug = console.log
var consoleSpam = console.log
var consoleGroup = console.group
var consoleGroupEnd = console.groupEnd

window.setLogLevel = function(level) {
  console.error = function() {}
  console.warn = function() {}
  console.info = function() {}
  console.log = function() {}
  console.debug = function() {}
  console.spam = function() {}
  console.group = function() {}
  console.groupEnd = function() {}

  if (level === 'none') return

  // Instead of throw, but still red flags and is easy to find
  console.error = consoleError
  if (level === 'error') return

  // Less serious than error, but flagged nonetheless
  console.warn = consoleWarn
  if (level === 'warn') return

  // Default visible, important information
  console.info = consoleInfo
  if (level === 'info') return

  // Useful for debugging (mainly validation)
  console.log = consoleLog
  if (level === 'log') return

  // Useful for serious debugging (mainly graphics/misc)
  console.debug = consoleDebug
  if (level === 'debug') return

  // Useful for insane debugging (mainly tracing/recursion)
  console.spam = consoleSpam
  console.group = consoleGroup
  console.groupEnd = consoleGroupEnd
  if (level === 'spam') return
}
setLogLevel('log')

window.setTheme = function(theme) {
  document.getElementById('theme').href = './theme/' + theme + '.css'
}

window.deleteElementsByClassName = function(rootElem, className) {
  var elems = []
  while (true) {
    elems = rootElem.getElementsByClassName(className)
    if (elems.length === 0) break;
    elems[0].remove()
  }
}

// Automatically solve the puzzle
window.solvePuzzle = function() {
  if (window.setSolveMode) window.setSolveMode(false)
  document.getElementById('solutionViewer').style.display = 'none'
  document.getElementById('progressBox').style.display = null
  document.getElementById('solveAuto').innerText = 'Cancel Solving'
  document.getElementById('solveAuto').onpointerdown = function() {
    this.innerText = 'Cancelling...'
    this.onpointerdown = null
    window.setTimeout(window.cancelSolving, 0)
  }

  window.solve(window.puzzle, function(percent) {
    document.getElementById('progressPercent').innerText = percent + '%'
    document.getElementById('progress').style.width = percent + '%'
  }, function(paths) {
    document.getElementById('progressBox').style.display = 'none'
    document.getElementById('solutionViewer').style.display = null
    document.getElementById('progressPercent').innerText = '0%'
    document.getElementById('progress').style.width = '0%'
    document.getElementById('solveAuto').innerText = 'Solve (automatically)'
    document.getElementById('solveAuto').onpointerdown = solvePuzzle

    window.puzzle.autoSolved = true
    paths = window.onSolvedPuzzle(paths)
    showSolution(window.puzzle, paths, 0)
  })
}

function showSolution(puzzle, paths, num) {
  var previousSolution = document.getElementById('previousSolution')
  var solutionCount = document.getElementById('solutionCount')
  var nextSolution = document.getElementById('nextSolution')

  if (paths.length === 0) { // 0 paths, arrows are useless
    solutionCount.innerText = '0 of 0'
    previousSolution.disabled = true
    nextSolution.disabled = true
    return
  }

  while (num < 0) num = paths.length + num
  while (num >= paths.length) num = num - paths.length

  if (paths.length === 1) { // 1 path, arrows are useless
    solutionCount.innerText = '1 of 1'
    if (paths.length >= window.MAX_SOLUTIONS) solutionCount.innerText += '+'
    previousSolution.disabled = true
    nextSolution.disabled = true
  } else {
    solutionCount.innerText = (num + 1) + ' of ' + paths.length
    if (paths.length >= window.MAX_SOLUTIONS) solutionCount.innerText += '+'
    previousSolution.disabled = false
    nextSolution.disabled = false
    previousSolution.onpointerdown = function(event) {
      if (event.shiftKey) {
        showSolution(puzzle, paths, num - 10)
      } else {
        showSolution(puzzle, paths, num - 1)
      }
    }
    nextSolution.onpointerdown = function(event) {
      if (event.shiftKey) {
        showSolution(puzzle, paths, num + 10)
      } else {
        showSolution(puzzle, paths, num + 1)
      }
    }
  }

  if (paths[num] != null) {
    // Save the current path on the puzzle object (so that we can pass it along with publishing)
    puzzle.path = paths[num]
    // Draws the given path, and also updates the puzzle to have path annotations on it.
    window.drawPath(puzzle, paths[num])
  }
}

function createCheckbox() {
  var checkbox = document.createElement('div')
  checkbox.style.width = '22px'
  checkbox.style.height = '22px'
  checkbox.style.display = 'inline-block'
  checkbox.style.verticalAlign = 'text-bottom'
  checkbox.style.marginRight = '6px'
  checkbox.style.borderWidth = '1.5px'
  checkbox.style.borderStyle = 'solid'
  checkbox.style.borderColor = 'var(--border)'
  checkbox.style.background = 'var(--background)'
  checkbox.style.color = 'var(--text)'
  return checkbox
}

// Required global variables/functions:
// window.puzzle
// window.onSolvedPuzzle()
// window.MAX_SOLUTIONS // defined by solve.js
window.addSolveButtons = function() {
  var parent = document.currentScript.parentElement

  var solveMode = createCheckbox()
  solveMode.id = 'solveMode'
  parent.appendChild(solveMode)

  solveMode.onpointerdown = function() {
    this.checked = !this.checked
    this.style.background = (this.checked ? 'var(--border)' : 'var(--background)')
    if (window.setSolveMode) window.setSolveMode(this.checked)
  }

  var solveManual = document.createElement('label')
  parent.appendChild(solveManual)
  solveManual.id = 'solveManual'
  solveManual.onpointerdown = function() {solveMode.onpointerdown()}
  solveManual.innerText = 'Solve (manually)'
  solveManual.style = 'margin-right: 8px'

  var solveAuto = document.createElement('button')
  parent.appendChild(solveAuto)
  solveAuto.id = 'solveAuto'
  solveAuto.innerText = 'Solve (automatically)'
  solveAuto.onpointerdown = solvePuzzle
  solveAuto.style = 'margin-right: 8px'

  var div = document.createElement('div')
  parent.appendChild(div)
  div.style = 'display: inline-block; vertical-align:top'

  var progressBox = document.createElement('div')
  div.appendChild(progressBox)
  progressBox.id = 'progressBox'
  progressBox.style = 'display: none; width: 220px; border: 1px solid black; margin-top: 2px'

  var progressPercent = document.createElement('label')
  progressBox.appendChild(progressPercent)
  progressPercent.id = 'progressPercent'
  progressPercent.style = 'float: left; margin-left: 4px'
  progressPercent.innerText = '0%'

  var progress = document.createElement('div')
  progressBox.appendChild(progress)
  progress.id = 'progress'
  progress.style = 'z-index: -1; height: 38px; width: 0%; background-color: #390'

  var solutionViewer = document.createElement('div')
  div.appendChild(solutionViewer)
  solutionViewer.id = 'solutionViewer'
  solutionViewer.style = 'display: none'

  var previousSolution = document.createElement('button')
  solutionViewer.appendChild(previousSolution)
  previousSolution.id = 'previousSolution'
  previousSolution.innerHTML = '&larr;'

  var solutionCount = document.createElement('label')
  solutionViewer.appendChild(solutionCount)
  solutionCount.id = 'solutionCount'
  solutionCount.style = 'padding: 6px'

  var nextSolution = document.createElement('button')
  solutionViewer.appendChild(nextSolution)
  nextSolution.id = 'nextSolution'
  nextSolution.innerHTML = '&rarr;'
}

})
