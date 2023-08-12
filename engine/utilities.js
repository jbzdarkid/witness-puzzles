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
Object.defineProperty(Event.prototype, 'position', {
  'get': function() {
    return {
      'x': event.pageX || event.clientX || (event.touches && event.touches[0].pageX) || null,
      'y': event.pageY || event.clientY || (event.touches && event.touches[0].pageY) || null,
    }
  }
})
/*** End cross-compatibility ***/

var proxy = {
  'get': function(_, key) {
    try {
      return this._map[key]
    } catch (e) {
      return null
    }
  },
  'set': function(_, key, value) {
    if (value == null) {
      delete this._map[key]
    } else {
      this._map[key] = value.toString()
      window.localStorage.setItem('settings', JSON.stringify(this._map))
    }
  },
  'init': function() {
    this._map = {}
    try {
      var j = window.localStorage.getItem('settings')
      if (j != null) this._map = JSON.parse(j)
    } catch (e) {/* Do nothing */}

    function setIfNull(map, key, value) {
      if (map[key] == null) map[key] = value
    }

    // Set any values which are not defined
    setIfNull(this._map, 'theme', 'light')
    setIfNull(this._map, 'volume', '0.12')
    setIfNull(this._map, 'sensitivity', '0.7')
    setIfNull(this._map, 'expanded', 'false')
    setIfNull(this._map, 'customMechanics', 'false')
    return this
  },
}
window.settings = new Proxy({}, proxy.init())

var tracks = {
  'start':   new Audio(src = 'data/panel_start_tracing.aac'),
  'success': new Audio(src = 'data/panel_success.aac'),
  'fail':    new Audio(src = 'data/panel_failure.aac'),
  'abort':   new Audio(src = 'data/panel_abort_tracing.aac'),
}

var currentAudio = null
window.PLAY_SOUND = function(name) {
  if (currentAudio) currentAudio.pause()
  var audio = tracks[name]
  audio.load()
  audio.volume = parseFloat(window.settings.volume)
  audio.play().then(function() {
    currentAudio = audio
  }).catch(function() {
    // Do nothing.
  })
}

window.LINE_PRIMARY = '#8FF'
window.LINE_SECONDARY = '#FF2'

if (window.settings.theme == 'night') {
  window.BACKGROUND       = '#221'
  window.OUTER_BACKGROUND = '#070704'
  window.FOREGROUND       = '#751'
  window.BORDER           = '#666'
  window.LINE_DEFAULT     = '#888'
  window.LINE_SUCCESS     = '#BBB'
  window.LINE_FAIL        = '#000'
  window.CURSOR           = '#FFF'
  window.TEXT_COLOR       = '#AAA'
  window.PAGE_BACKGROUND  = '#000'
  window.ALT_BACKGROUND   = '#333' // An off-black. Good for mild contrast.
  window.ACTIVE_COLOR     = '#555' // Color for 'while the element is being pressed'
} else if (window.settings.theme == 'light') {
  window.BACKGROUND       = '#0A8'
  window.OUTER_BACKGROUND = '#113833'
  window.FOREGROUND       = '#344'
  window.BORDER           = '#000'
  window.LINE_DEFAULT     = '#AAA'
  window.LINE_SUCCESS     = '#FFF'
  window.LINE_FAIL        = '#000'
  window.CURSOR           = '#FFF'
  window.TEXT_COLOR       = '#000'
  window.PAGE_BACKGROUND  = '#FFF'
  window.ALT_BACKGROUND   = '#EEE' // An off-white. Good for mild contrast.
  window.ACTIVE_COLOR     = '#DDD' // Color for 'while the element is being pressed'
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
window.GAP_NONE      = 0
window.GAP_BREAK     = 1
window.GAP_FULL      = 2

var animations = ''
var l = function(line) {animations += line + '\n'}
// pointer-events: none; allows for events to bubble up (so that editor hooks still work)
l('.line-1 {')
l('  fill: ' + window.LINE_DEFAULT + ';')
l('  pointer-events: none;')
l('}')
l('.line-2 {')
l('  fill: ' + window.LINE_PRIMARY + ';')
l('  pointer-events: none;')
l('}')
l('.line-3 {')
l('  fill: ' + window.LINE_SECONDARY + ';')
l('  pointer-events: none;')
l('}')
l('@keyframes line-success {to {fill: ' + window.LINE_SUCCESS + ';}}')
l('@keyframes line-fail {to {fill: ' + window.LINE_FAIL + ';}}')
l('@keyframes error {to {fill: red;}}')
l('@keyframes fade {to {opacity: 0.35;}}')
l('@keyframes start-grow {from {r:12;} to {r: 24;}}')
// Neutral button style
l('button {')
l('  background-color: ' + window.ALT_BACKGROUND + ';')
l('  border: 1px solid ' + window.BORDER + ';')
l('  border-radius: 2px;')
l('  color: ' + window.TEXT_COLOR + ';')
l('  display: inline-block;')
l('  margin: 0px;')
l('  outline: none;')
l('  opacity: 1.0;')
l('  padding: 1px 6px;')
l('  -moz-appearance: none;')
l('  -webkit-appearance: none;')
l('}')
// Active (while held down) button style
l('button:active {background-color: ' + window.ACTIVE_COLOR + ';}')
// Disabled button style
l('button:disabled {opacity: 0.5;}')
// Selected button style (see https://stackoverflow.com/a/63108630)
l('button:focus {outline: none;}')
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
  navbar.style = 'min-width: 700px; position: absolute; top: 0; width: 100%; z-index: 1'
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
    navbar.style.position = 'fixed' // When browsing, pin the navbar to the top so that it's visible during infinite scroll.

    link.innerText = 'Create a puzzle'
    link.onpointerdown = function() {window.location = 'editor.html'}

    var link2 = document.createElement('label')
    navbar.appendChild(link2)
    link2.style = 'float: left; margin-left: 20px; cursor: pointer; line-height: 60px; display: none'
    link2.className = 'navbar-content'
    link2.innerText = 'Jump to top'
    link2.id = 'scrollToTop'
    link2.onpointerdown = function() {window.scrollTo(0, 0)}

  } else if (window.location.href.includes('/play/')) {
    link.innerText = 'Back to all puzzles'
    link.onpointerdown = function() {window.location = 'browse.html'}
  } else /* All other pages */ {
    link.innerText = 'Browse all puzzles'
    link.onpointerdown = function() {window.location = 'browse.html'}
  }

  var feedbackButton = document.createElement('label')
  navbar.appendChild(feedbackButton)
  feedbackButton.id = 'feedbackButton'
  feedbackButton.style = 'float: right; margin-right: 8px; cursor: pointer; line-height: 60px'
  feedbackButton.innerText = 'Send feedback'
  feedbackButton.className = 'navbar-content'
  feedbackButton.onpointerdown = function() {
    var feedback = prompt('Provide feedback:')
    if (feedback) {
      sendFeedback(feedback)
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
  sourceLink.onpointerdown = function() {window.open('https://github.com/jbzdarkid/witness-puzzles', '_blank')}

  var collapsedSettings = drawSymbol({'type': 'plus', 'width':20, 'height':20})
  navbar.appendChild(collapsedSettings)
  collapsedSettings.style = 'width: 20px; height: 20px; position: absolute; left: 0; cursor: pointer'
  collapsedSettings.style.border = '2px solid ' + window.BORDER
  collapsedSettings.id = 'collapsedSettings'
  collapsedSettings.onpointerdown = function() {
    this.style.display = 'none'
    var expandedSettings = document.getElementById('expandedSettings')
    expandedSettings.style.display = null
    window.settings.expanded = 'true'
  }

  var expandedSettings = document.createElement('div')
  navbar.appendChild(expandedSettings)
  expandedSettings.style = 'width: 300px; position: absolute; left: 0; display: none; padding: 10px'
  expandedSettings.style.border = '2px solid ' + window.BORDER
  expandedSettings.style.background = window.PAGE_BACKGROUND
  expandedSettings.id = 'expandedSettings'

  var minus = drawSymbol({'type':'minus', 'width':20, 'height':20})
  minus.style = 'width: 20px; height: 20px; cursor: pointer; position: absolute; top: 0; left: 0'
  expandedSettings.appendChild(minus)
  minus.onpointerdown = function() {
    this.parentElement.style.display = 'none'
    var collapsedSettings = document.getElementById('collapsedSettings')
    collapsedSettings.style.display = null
    window.settings.expanded = 'false'
  }

  if (window.settings.expanded == 'true') {
    collapsedSettings.onpointerdown()
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
  if (window.settings.theme == 'night') {
    themeButton.innerText = 'Night theme'
    themeButton.onpointerdown = function() {
      window.settings.theme = 'light'
      location.reload()
    }
  } else if (window.settings.theme == 'light') {
    themeButton.innerText = 'Light theme'
    themeButton.onpointerdown = function() {
      window.settings.theme = 'night'
      location.reload()
    }
  }

  expandedSettings.appendChild(document.createElement('br'))

  // Sensitivity
  var sensLabel = document.createElement('label')
  expandedSettings.appendChild(sensLabel)
  sensLabel.htmlFor = 'sens'
  sensLabel.innerText = 'Mouse Speed 2D'

  var sens = document.createElement('input')
  expandedSettings.appendChild(sens)
  sens.type = 'range'
  sens.id = 'sens'
  sens.min = '0.1'
  sens.max = '1.3'
  sens.step = '0.1'
  sens.value = window.settings.sensitivity
  sens.onchange = function() {
    window.settings.sensitivity = this.value
  }
  sens.style.backgroundImage = 'linear-gradient(to right, ' + window.ALT_BACKGROUND + ', ' + window.ACTIVE_COLOR + ')'

  // Volume
  var volumeLabel = document.createElement('label')
  expandedSettings.appendChild(volumeLabel)
  volumeLabel.htmlFor = 'volume'
  volumeLabel.innerText = 'Volume'

  var volume = document.createElement('input')
  expandedSettings.appendChild(volume)
  volume.type = 'range'
  volume.id = 'volume'
  volume.min = '0'
  volume.max = '0.24'
  volume.step = '0.02'
  volume.value = parseFloat(window.settings.volume)
  volume.onchange = function() {
    window.settings.volume = this.value
  }
  volume.style.backgroundImage = 'linear-gradient(to right, ' + window.ALT_BACKGROUND + ', ' + window.ACTIVE_COLOR + ')'

  // Custom mechanics -- disabled for now
  window.settings.customMechanics = false
  /*
  var customMechanics = createCheckbox()
  expandedSettings.appendChild(customMechanics)
  customMechanics.id = 'customMechanics'
  if (window.settings.customMechanics == 'true') {
    customMechanics.style.background = window.BORDER
    customMechanics.checked = true
  }

  customMechanics.onpointerdown = function() {
    this.checked = !this.checked
    this.style.background = (this.checked ? window.BORDER : window.PAGE_BACKGROUND)
    window.settings.customMechanics = this.checked
    window.location.reload()
  }

  var mechLabel = document.createElement('label')
  expandedSettings.appendChild(mechLabel)
  mechLabel.style.marginLeft = '6px'
  mechLabel.htmlFor = 'customMechanics'
  mechLabel.innerText = 'Custom mechanics'
  */
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
    window.showSolution(window.puzzle, paths, 0)
  })
}

window.showSolution = function(puzzle, paths, num, suffix) {
  if (suffix == null) {
    var previousSolution = document.getElementById('previousSolution')
    var solutionCount = document.getElementById('solutionCount')
    var nextSolution = document.getElementById('nextSolution')
  } else {
    var previousSolution = document.getElementById('previousSolution-' + suffix)
    var solutionCount = document.getElementById('solutionCount-' + suffix)
    var nextSolution = document.getElementById('nextSolution-' + suffix)
  }

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
        window.showSolution(puzzle, paths, num - 10, suffix)
      } else {
        window.showSolution(puzzle, paths, num - 1, suffix)
      }
    }
    nextSolution.onpointerdown = function(event) {
      if (event.shiftKey) {
        window.showSolution(puzzle, paths, num + 10, suffix)
      } else {
        window.showSolution(puzzle, paths, num + 1, suffix)
      }
    }
  }

  if (paths[num] != null) {
    // Save the current path on the puzzle object (so that we can pass it along with publishing)
    puzzle.path = paths[num]
    // Draws the given path, and also updates the puzzle to have path annotations on it.
    window.drawPath(puzzle, paths[num], suffix)
  }
}

window.createCheckbox = function() {
  var checkbox = document.createElement('div')
  checkbox.style.width = '22px'
  checkbox.style.height = '22px'
  checkbox.style.borderRadius = '6px'
  checkbox.style.display = 'inline-block'
  checkbox.style.verticalAlign = 'text-bottom'
  checkbox.style.marginRight = '6px'
  checkbox.style.borderWidth = '1.5px'
  checkbox.style.borderStyle = 'solid'
  checkbox.style.borderColor = window.BORDER
  checkbox.style.background = window.PAGE_BACKGROUND
  checkbox.style.color = window.TEXT_COLOR
  return checkbox
}

// Required global variables/functions: <-- HINT: This means you're writing bad code.
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
    this.style.background = (this.checked ? window.BORDER : window.PAGE_BACKGROUND)
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

var SECONDS_PER_LOOP = 1
window.httpGetLoop = function(url, maxTimeout, action, onError, onSuccess) {
  if (maxTimeout <= 0) {
    onError()
    return
  }

  sendHttpRequest('GET', url, SECONDS_PER_LOOP, null, function(httpCode, response) {
    if (httpCode >= 200 && httpCode <= 299) {
      var output = action(JSON.parse(response))
      if (output) {
        onSuccess(output)
        return
      } // Retry if action returns null
    } // Retry on non-success HTTP codes
    
    window.setTimeout(function() {
      httpGetLoop(url, maxTimeout - SECONDS_PER_LOOP, action, onError, onSuccess)
    }, 1000)
  })
}

window.fireAndForget = function(verb, url, body) {
  sendHttpRequest(verb, url, 600, body, function() {})
}

// Only used for errors
var HTTP_STATUS = {
  401: '401 unauthorized', 403: '403 forbidden', 404: '404 not found', 409: '409 conflict', 413: '413 payload too large',
  500: '500 internal server error',
}

var etagCache = {}
function sendHttpRequest(verb, url, timeoutSeconds, data, onResponse) {
  currentHttpRequest = new XMLHttpRequest()
  currentHttpRequest.onreadystatechange = function() {
    if (this.readyState != XMLHttpRequest.DONE) return
    etagCache[url] = this.getResponseHeader('ETag')
    currentHttpRequest = null
    onResponse(this.status, this.responseText || HTTP_STATUS[this.status])
  }
  currentHttpRequest.ontimeout = function() {
    currentHttpRequest = null
    onResponse(0, 'Request timed out')
  }
  currentHttpRequest.timeout = timeoutSeconds * 1000
  currentHttpRequest.open(verb, url, true)
  currentHttpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  
  var etag = etagCache[url]
  if (etag != null) currentHttpRequest.setRequestHeader('If-None-Match', etag)

  currentHttpRequest.send(data)
}

// https://stackoverflow.com/q/12571650
window.addEventListener('error', function(event) {
  console.error('Please disregard the following CORS exception. It is expected and the request will succeed regardless.')
  var formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeXwtuKTbhXlQ5dUYtGjMQtkseFMBFka0jbBeOwd8tKiJb_ug/formResponse'
  window.fireAndForget('POST', formUrl, 'entry.909077667=' + encodeURIComponent(event.error.stack) + '&entry.2145672989=' + encodeURIComponent(event.filename) + '%20:' + event.lineno)
})

function sendFeedback(feedback) {
  console.error('Please disregard the following CORS exception. It is expected and the request will succeed regardless.')
  var formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSe6kWD2rC7qaBVExJBUmAhU5qnhLzaY98ZQ3xp6Gq5fkizNHQ/formResponse'
  window.fireAndForget('POST', formUrl, 'entry.188054716=' + encodeURIComponent(feedback) + '&entry.508151484=' + encodeURIComponent(window.location.href))
}

})
