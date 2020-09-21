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
Element.prototype.requestPointerLock = Element.prototype.requestPointerLock || Element.prototype.mozRequestPointerLock || function() {
  document.pointerLockElement = this
  document.onpointerlockchange()
}
document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || function() {
  document.pointerLockElement = null
  document.onpointerlockchange()
}
/*** End cross-compatibility ***/

// https://stackoverflow.com/q/12571650
window_onerror = window.onerror
window.onerror = function(message, url, line) {
  FEEDBACK(message + ' on line ' + line)
  if (window_onerror == undefined) {
    console.error('Parse error in file ' + url + ' on line ' + line)
  } else {
    window_onerror(message, url, line)
  }
}

var trackNames = ['start', 'success', 'fail', 'abort']
var tracks = {
  'start':   new Audio(src='/data/panel_start_tracing.aac'),
  'success': new Audio(src='/data/panel_success.aac'),
  'fail':    new Audio(src='/data/panel_failure.aac'),
  'abort':   new Audio(src='/data/panel_abort_tracing.aac'),
}
for (var name of trackNames) tracks[name].muted = true

window.PLAY_SOUND = function(targetAudio) {
  console.log('Playing sound:', targetAudio)
  tracks[targetAudio].pause()
  tracks[targetAudio].play().then(function() {
    // If the audio plays, then we're all set -- mark it as good and continue.
    // This is the expected behavior on all non-iOS platforms.
    console.debug('Played successfully')
    tracks[targetAudio].currentTime = 0
    tracks[targetAudio].volume = localStorage.volume
    tracks[targetAudio].muted = false
  }).catch(function() {
    // If the audio does not play, swap it out for an audio element that works.
    // This will usually cause lag, since the target audio track needs to be fetched again.
    console.debug('Audio failed')

    var badAudio = targetAudio
    targetAudio = null
    for (var name of trackNames) {
      if (!tracks[name].muted) {
        targetAudio = name
        break
      }
    }
    console.debug('Selected alternative audio object: ' + targetAudio)
    if (!targetAudio) return // No good audio tracks available.

    var tmp = tracks[badAudio]
    tmp.src = tracks[badAudio].src
    tracks[badAudio] = tracks[targetAudio]
    tracks[badAudio].src = tracks[targetAudio].src
    tracks[targetAudio] = tmp
    tracks[targetAudio].src = tmp.src
    tracks[targetAudio].pause()
    tracks[targetAudio].play().then(function() {
      console.debug('Backup audio track worked')
      tracks[targetAudio].currentTime = 0
      tracks[targetAudio].volume = localStorage.volume
    }).catch(function(error) {
      // Welp, we tried.
      console.error('Backup audio track failed: ' + error)
    })
  })
}

window.FEEDBACK = function(message) {
  var request = new XMLHttpRequest()
  request.open('POST', '/feedback', true) // Fire and forget
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.send('data=' + message)
}

window.ERROR = function(message) {
  var request = new XMLHttpRequest()
  request.open('POST', '/error', true) // Fire and forget
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.send('data=' + message)
}

window.LINE_PRIMARY = '#8FF'
window.LINE_SECONDARY = '#FF2'

if (localStorage.theme === 'true') { // Dark scheme
  window.BACKGROUND      = '#221'
  window.FOREGROUND      = '#751' // '#873'
  window.BORDER          = '#666'
  window.LINE_DEFAULT    = '#888' // '#FD8'
  window.LINE_SUCCESS    = '#BBB' // '#FA0'
  window.LINE_FAIL       = '#000'
  window.CURSOR          = '#FFF'
  window.TEXT_COLOR      = '#AAA'
  window.PAGE_BACKGROUND = '#000'
  window.ALT_BACKGROUND  = '#333' // An off-black. Good for mild contrast.
  window.ACTIVE_COLOR    = '#555' // Color for 'while the element is being pressed'
} else { // Light scheme
  window.BACKGROUND      = '#0A8'
  window.FOREGROUND      = '#344'
  window.BORDER          = '#000'
  window.LINE_DEFAULT    = '#AAA'
  window.LINE_SUCCESS    = '#FFF'
  window.LINE_FAIL       = '#000'
  window.CURSOR          = '#FFF'
  window.TEXT_COLOR      = '#000'
  window.PAGE_BACKGROUND = '#FFF'
  window.ALT_BACKGROUND  = '#EEE' // An off-white. Good for mild contrast.
  window.ACTIVE_COLOR    = '#DDD' // Color for 'while the element is being pressed'
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

var animations =
// pointer-events: none; allows for onclick events to bubble up (so that editor hooks still work)
'.line-1 {\n' + 
'  fill: ' + window.LINE_DEFAULT + ';\n' + 
'  pointer-events: none;\n' + 
'  shape-rendering: crispedges;\n' + 
'}\n' +
'.line-2 {\n' + 
'  fill: ' + window.LINE_PRIMARY + ';\n' + 
'  pointer-events: none;\n' + 
'  shape-rendering: crispedges;\n' + 
'}\n' +
'.line-3 {\n' + 
'  fill: ' + window.LINE_SECONDARY + ';\n' + 
'  pointer-events: none;\n' + 
'  shape-rendering: crispedges;\n' + 
'}\n' +
'@keyframes line-success {to {fill: ' + window.LINE_SUCCESS + ';}}\n' +
'@keyframes line-fail {to {fill: ' + window.LINE_FAIL + ';}}\n' +
'@keyframes error {to {fill: red;}}\n' +
'@keyframes fade {to {opacity: 0.35;}}\n' +
'@keyframes start-grow {from {r:12;} to {r: 24;}}\n' +
// Neutral button style
'button {\n' +
'  background-color: ' + window.ALT_BACKGROUND + ';\n' +
'  border: 0.5px solid ' + window.BORDER + ';\n' +
'  border-radius: 2px;\n' +
'  color: ' + window.TEXT_COLOR + ';\n' +
'  display: inline-block;\n' +
'  margin: 0;\n' +
'  outline: none;\n' +
'  opacity: 1.0;\n' +
'  padding: 1px 6px;\n' +
'  -moz-appearance: none;\n' +
'  -webkit-appearance: none;\n' +
'}\n' +
// Active (while held down) button style
'button:active {background-color: ' + window.ACTIVE_COLOR + ';}\n' +
// Disabled button style
'button:disabled {opacity: 0.5;}\n' +
// Selected button style (see https://stackoverflow.com/a/63108630)
'button:focus {outline: none;}\n'
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
setLogLevel('info')

window.deleteElementsByClassName = function(rootElem, className) {
  var elems = []
  while (true) {
    elems = rootElem.getElementsByClassName(className)
    if (elems.length === 0) break
    elems[0].remove()
  }
}

window.loadHeader = function(titleText) {
  document.body.style.marginLeft = '0px'

  var navbar = document.createElement('div')
  document.body.appendChild(navbar)
  navbar.className = 'navbar'
  navbar.style = 'min-width: 700px; position: fixed; top: 0; width: 100%; z-index: 1'
  navbar.style.borderBottom = '2px solid ' + window.BORDER
  navbar.style.background = window.PAGE_BACKGROUND

  var navbarPadding = document.createElement('div')
  document.body.appendChild(navbarPadding)
  navbarPadding.className = 'navbar-padding'

  var titleDiv = document.createElement('div')
  navbar.appendChild(titleDiv)
  titleDiv.style = 'position: absolute; width: 100%; pointer-events: none'

  var titleLabel = document.createElement('label')
  titleDiv.appendChild(titleLabel)
  titleLabel.style = 'font-size: 48; pointer-events: auto'
  titleLabel.id = 'title'
  titleLabel.innerText = titleText

  var link = document.createElement('label')
  navbar.appendChild(link)
  link.style = 'float: left; margin-left: 32px; cursor: pointer; line-height: 60px'
  link.className = 'navbar-content'

  if (window.location.href.endsWith('browse.html')) {
    link.innerText = 'Create a puzzle'
    link.onclick = function() {window.location = '/editor.html'}

    var link2 = document.createElement('label')
    navbar.appendChild(link2)
    link2.style = 'float: left; margin-left: 20px; cursor: pointer; line-height: 60px; display: none'
    link2.className = 'navbar-content'
    link2.innerText = 'Jump to top'
    link2.id = 'scrollToTop'
    link2.onclick = function() {window.scrollTo(0, 0)}

  } else if (window.location.href.includes('/play/')) {
    link.innerText = 'Back to all puzzles'
    link.onclick = function() {window.location = '/browse.html'}
  } else /* if (window.location.href.endsWith('editor.html')) */ {
    link.innerText = 'View all puzzles'
    link.onclick = function() {window.location = '/browse.html'}
  }

  var feedbackButton = document.createElement('label')
  navbar.appendChild(feedbackButton)
  feedbackButton.style = 'float: right; margin-right: 8px; cursor: pointer; line-height: 60px'
  feedbackButton.innerText = 'Send feedback'
  feedbackButton.className = 'navbar-content'
  feedbackButton.onclick = function () {
    var feedback = prompt('Provide feedback:')
    if (feedback) {
      window.FEEDBACK(feedback)
    }
  }

  var separator = document.createElement('label')
  navbar.appendChild(separator)
  separator.style = 'float: right; line-height: 60px; padding-left: 6px; padding-right: 6px'
  separator.className = 'navbar-content'
  separator.innerText = '|'

  var sourceLink = document.createElement('label')
  navbar.appendChild(sourceLink)
  sourceLink.style = 'float: right; line-height: 60px; cursor: pointer'
  sourceLink.innerText = 'Source code'
  sourceLink.className = 'navbar-content'
  sourceLink.onclick = function() {window.location = 'https://github.com/jbzdarkid/witness-puzzles'}

  var collapsedSettings = drawSymbol({'type': 'plus', 'width':20, 'height':20})
  navbar.appendChild(collapsedSettings)
  collapsedSettings.style = 'width: 20px; height: 20px; position: absolute; left: 0; cursor: pointer'
  collapsedSettings.style.border = '2px solid ' + window.BORDER
  collapsedSettings.id = 'collapsedSettings'
  collapsedSettings.onclick = function() {
    this.style.display = 'none'
    var expandedSettings = document.getElementById('expandedSettings')
    expandedSettings.style.display = null
  }

  var expandedSettings = document.createElement('div')
  navbar.appendChild(expandedSettings)
  expandedSettings.style = 'width: 250px; position: absolute; left: 0; display: none; padding: 10px'
  expandedSettings.style.border = '2px solid ' + window.BORDER
  expandedSettings.style.background = window.PAGE_BACKGROUND
  expandedSettings.id = 'expandedSettings'

  var minus = drawSymbol({'type':'minus', 'width':20, 'height':20})
  minus.style = 'width: 20px; height: 20px; cursor: pointer; position: absolute; top: 0; left: 0'
  expandedSettings.appendChild(minus)
  minus.onclick = function() {
    this.parentElement.style.display = 'none'
    var collapsedSettings = document.getElementById('collapsedSettings')
    collapsedSettings.style.display = null
  }

  // Now, for the contents of the settings
  var settingsLabel = document.createElement('label')
  expandedSettings.appendChild(settingsLabel)
  settingsLabel.innerText = 'settings'
  settingsLabel.style = 'line-height: 0px' // Attach to the top

  expandedSettings.appendChild(document.createElement('br'))
  expandedSettings.appendChild(document.createElement('br'))

  // Theme
  document.body.style.color = window.TEXT_COLOR
  document.body.style.background = window.PAGE_BACKGROUND
  var themeButton = document.createElement('button')
  expandedSettings.appendChild(themeButton)
  if (localStorage.theme === 'true') {
    themeButton.innerText = 'Dark theme'
    themeButton.onclick = function() {
      localStorage.theme = 'false'
      location.reload()
    }
  } else {
    themeButton.innerText = 'Light theme'
    themeButton.onclick = function() {
      localStorage.theme = 'true'
      location.reload()
    }
  }

  expandedSettings.appendChild(document.createElement('br'))

  // Sensitivity
  var sensLabel = document.createElement('label')
  expandedSettings.appendChild(sensLabel)
  sensLabel.htmlFor = 'sens'
  sensLabel.innerText = 'Mouse Speed 2D'

  if (localStorage.sensitivity == undefined) localStorage.sensitivity = 0.7
  var sens = document.createElement('input')
  expandedSettings.appendChild(sens)
  sens.type = 'range'
  sens.id = 'sens'
  sens.min = '0.1'
  sens.max = '1.3'
  sens.step = '0.1'
  sens.value = localStorage.sensitivity
  sens.onchange = function() {
    localStorage.sensitivity = this.value
  }
  sens.style.backgroundImage = 'linear-gradient(to right, ' + window.ALT_BACKGROUND + ', ' + window.ACTIVE_COLOR + ')'

  // Volume
  var volumeLabel = document.createElement('label')
  expandedSettings.appendChild(volumeLabel)
  volumeLabel.htmlFor = 'volume'
  volumeLabel.innerText = 'Volume'

  if (localStorage.volume == undefined || localStorage.volume < 0 || localStorage.volume > 0.24) {
    localStorage.volume = 0.12
  }
  var volume = document.createElement('input')
  expandedSettings.appendChild(volume)
  volume.type = 'range'
  volume.id = 'volume'
  volume.min = '0'
  volume.max = '0.24'
  volume.step = '0.02'
  volume.value = localStorage.volume
  volume.onchange = function() {
    localStorage.volume = this.value
  }
  volume.style.backgroundImage = 'linear-gradient(to right, ' + window.ALT_BACKGROUND + ', ' + window.ACTIVE_COLOR + ')'
}

// Automatically solve the puzzle
function solvePuzzle(puzzle, onSolvedPuzzle) {
  if (window.setSolveMode) window.setSolveMode(false)
  document.getElementById('solutionViewer').style.display = 'none'
  document.getElementById('progressBox').style.display = null
  window.solve(puzzle, function(progress) {
    var percent = Math.floor(100 * progress)
    document.getElementById('progressPercent').innerText = percent + '%'
    document.getElementById('progress').style.width = percent + '%'
  }, function(paths) {
    document.getElementById('progressBox').style.display = 'none'
    document.getElementById('solutionViewer').style.display = null
    document.getElementById('progressPercent').innerText = '0%'
    document.getElementById('progress').style.width = '0%'

    puzzle.autoSolved = true
    paths = window.onSolvedPuzzle(paths)
    showSolution(puzzle, paths, 0)
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
    previousSolution.onclick = function(event) {
      if (event.shiftKey) {
        showSolution(puzzle, paths, num - 10)
      } else {
        showSolution(puzzle, paths, num - 1)
      }
    }
    nextSolution.onclick = function(event) {
      if (event.shiftKey) {
        showSolution(puzzle, paths, num + 10)
      } else {
        showSolution(puzzle, paths, num + 1)
      }
    }
  }
  if (paths[num] != undefined) {
    // Draws the given path, and also updates the puzzle to have path annotations on it.
    window.drawPath(puzzle, paths[num])
  }
}

// Required global variables/functions:
// window.puzzle
// window.onSolvedPuzzle()
// window.MAX_SOLUTIONS // defined by solve.js
window.addSolveButtons = function() {
  var parent = document.currentScript.parentElement

  var solveMode = document.createElement('div')
  parent.appendChild(solveMode)
  solveMode.id = 'solveMode'
  solveMode.style.width = '22px'
  solveMode.style.height = '22px'
  solveMode.style.borderRadius = '6px'
  solveMode.style.display = 'inline-block'
  solveMode.style.verticalAlign = 'text-bottom'
  solveMode.style.marginRight = '6px'
  solveMode.style.borderWidth = '1.5px'
  solveMode.style.borderStyle = 'solid'
  solveMode.style.borderColor = window.BORDER
  solveMode.style.background = window.PAGE_BACKGROUND
  solveMode.style.color = window.TEXT_COLOR

  solveMode.onpointerdown = function() {
    this.checked = !this.checked
    this.style.background = (this.checked ? window.BORDER : window.PAGE_BACKGROUND)
    if (window.setSolveMode) window.setSolveMode(this.checked)
  }

  var label = document.createElement('label')
  parent.appendChild(label)
  label.style.marginRight = '8px'
  label.onpointerdown = function() {solveMode.onpointerdown()}
  label.innerText = 'Solve (manually)'

  var solveAuto = document.createElement('button')
  parent.appendChild(solveAuto)
  solveAuto.id = 'solveAuto'
  solveAuto.onclick = function() {
    solvePuzzle(window.puzzle, window.onSolvedPuzzle)
    this.innerText = 'Cancel Solving'
    this.onclick = function() {
      window.cancelSolving()
    }
  }
  solveAuto.innerText = 'Solve (automatically)'

  var div = document.createElement('div')
  parent.appendChild(div)
  div.style = 'display: inline-block; vertical-align:top'

  var progressBox = document.createElement('div')
  div.appendChild(progressBox)
  progressBox.id = 'progressBox'
  progressBox.style = 'position: absolute; display:none; width: 220px; padding: 2px'

  var progressPercent = document.createElement('label')
  progressBox.appendChild(progressPercent)
  progressPercent.id = 'progressPercent'
  progressPercent.style = 'float: left'
  progressPercent.innerText = '0%'

  var progress = document.createElement('div')
  progressBox.appendChild(progress)
  progress.id = 'progress'
  progress.style = 'position: absolute; z-index: -1; height: 100%; width: 0%; background-color: #339900'

  var solutionViewer = document.createElement('div')
  div.appendChild(solutionViewer)
  solutionViewer.id = 'solutionViewer'
  solutionViewer.style = 'position: absolute; display:none'

  var previousSolution = document.createElement('button')
  solutionViewer.appendChild(previousSolution)
  previousSolution.id = 'previousSolution'
  previousSolution.innerHTML = '&larr;'

  var solutionCount = document.createElement('label')
  solutionViewer.appendChild(solutionCount)
  solutionCount.id = 'solutionCount'

  var nextSolution = document.createElement('button')
  solutionViewer.appendChild(nextSolution)
  nextSolution.id = 'nextSolution'
  nextSolution.innerHTML = '&rarr;'
}




















/// ------------
/// Everything below this is legacy, and should not be used.
/// ============

function loadFeedback() {
  var feedbackButton = document.createElement('label')
  document.currentScript.parentElement.appendChild(feedbackButton)
  feedbackButton.innerText = 'Send feedback'
  feedbackButton.style.margin = 'auto'
  feedbackButton.style.cursor = 'pointer'
  feedbackButton.style.fontSize = '28'
  feedbackButton.onclick = function () {
    var feedback = prompt('Provide feedback:')
    if (feedback) {
      window.FEEDBACK(feedback)
    }
  }
}

function hideSettings() {
  localStorage.settings = 'hidden'
  var settings = document.getElementById('settings')
  settings.style.display = 'none'
  var toggle = document.getElementById('settingsToggle')
  toggle.innerHTML = '+'
  toggle.onclick = function(){ showSettings() }
  toggle.parentElement.style.width = '20px'
  toggle.parentElement.style.height = '20px'
  toggle.style.top = '-11px'
}

function showSettings() {
  localStorage.settings = 'visible'
  var settings = document.getElementById('settings')
  settings.style.display = null
  var toggle = document.getElementById('settingsToggle')
  toggle.innerHTML = '&ndash; &nbsp; &nbsp; &nbsp; &nbsp;settings&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; '
  toggle.onclick = function(){ hideSettings() }
  toggle.parentElement.style.width = '250px'
  toggle.parentElement.style.height = null
  toggle.style.top = '-10px'
}

// @Cleanup: Settings should live in one variable in localStorage, it makes it easier to save them / persist them across clears
function loadSettings(parent) {
  parent = parent || document.currentScript.parentElement
  var parentDiv = document.createElement('div')
  parent.appendChild(parentDiv)
  parentDiv.style.position = 'absolute'
  parentDiv.style.border = '2px solid ' + window.BORDER
  parentDiv.style.background = window.PAGE_BACKGROUND

  var toggle = document.createElement('label')
  parentDiv.appendChild(toggle)
  toggle.style.position = 'absolute'
  toggle.style.left = '2'
  toggle.style.cursor = 'pointer'
  toggle.id = 'settingsToggle'

  var settings = document.createElement('div')
  parentDiv.appendChild(settings)
  settings.id = 'settings'
  settings.style.margin = '10px'

  if (localStorage.settings === 'hidden') {
    hideSettings()
  } else {
    showSettings()
  }

  // Now, for the contents of the settings
  settings.appendChild(document.createElement('br'))

  // Theme
  var themeBox = document.createElement('input')
  settings.appendChild(themeBox)
  themeBox.className = 'checkbox'
  themeBox.type = 'checkbox'
  themeBox.id = 'theme'
  themeBox.onchange = function() {
    localStorage.theme = this.checked
    location.reload()
  }
  themeBox.checked = (localStorage.theme === 'true')
  // This needs to happen now, since the document body hasn't yet loaded.
  document.body.style.color = window.TEXT_COLOR
  document.body.style.background = window.PAGE_BACKGROUND

  var themeLabel = document.createElement('label')
  settings.appendChild(themeLabel)
  themeLabel.htmlFor = 'theme'
  themeLabel.innerText = ' Dark theme'

  settings.appendChild(document.createElement('br'))
  settings.appendChild(document.createElement('br'))

  // Sensitivity
  var sensLabel = document.createElement('label')
  settings.appendChild(sensLabel)
  sensLabel.htmlFor = 'sens'
  sensLabel.innerText = 'Mouse Speed 2D'

  if (localStorage.sensitivity == undefined) localStorage.sensitivity = 0.7
  var sens = document.createElement('input')
  settings.appendChild(sens)
  sens.style.width = '100%'
  sens.type = 'range'
  sens.id = 'sens'
  sens.min = '0.1'
  sens.max = '1.3'
  sens.step = '0.1'
  sens.value = localStorage.sensitivity
  sens.onchange = function() {
    localStorage.sensitivity = this.value
  }

  // Volume
  var volumeLabel = document.createElement('label')
  settings.appendChild(volumeLabel)
  volumeLabel.htmlFor = 'volume'
  volumeLabel.innerText = 'Volume'

  if (localStorage.volume == undefined || localStorage.volume < 0 || localStorage.volume > 0.24) {
    localStorage.volume = 0.12
  }
  var volume = document.createElement('input')
  settings.appendChild(volume)
  volume.style.width = '100%'
  volume.type = 'range'
  volume.id = 'volume'
  volume.min = '0'
  volume.max = '0.24'
  volume.step = '0.02'
  volume.value = localStorage.volume
  volume.onchange = function() {
    localStorage.volume = this.value
  }
}

})
