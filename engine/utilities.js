/*** Start cross-compatibility ***/
// Used to detect if IDs include a direction, e.g. resize-top-left
if (!String.prototype.includes) {
  String.prototype.includes = function() {
    return String.prototype.indexOf.apply(this, arguments) !== -1
  }
}
Event.prototype.movementX = Event.prototype.movementX || Event.prototype.mozMovementX
Event.prototype.movementY = Event.prototype.movementY || Event.prototype.mozMovementY
/*** End cross-compatibility ***/

// https://stackoverflow.com/q/11409895
// Used to greatly simplify bbox translation by clamping cursor movement per-bbox
Number.prototype.clamp = function(min, max) {
  return this < min ? min : this > max ? max : this
}

// http://stackoverflow.com/q/901115
// @Cleanup: Unneeded? I need to implement daily puzzles somehow, though.
var urlParams
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) {return decodeURIComponent(s.replace(pl, ' '))},
        query  = window.location.search.substring(1)

    urlParams = {}
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2])
})()

var tracks = {
  'start': new Audio('/data/panel_start_tracing.ogg'),
  'success': new Audio('/data/panel_success.ogg'),
  'fail': new Audio('/data/panel_failure.ogg'),
  'abort': new Audio('/data/panel_abort_tracing.ogg')
}

function PLAY_SOUND(track) {
  console.log('Playing sound:', track)
  for (var audio of Object.values(tracks)) {
    audio.pause()
    audio.currentTime = 0
  }
  tracks[track].volume = 0.1
  tracks[track].play()
}

function TELEMETRY(type) {
  if (window.session_id == undefined) {
    return // No session -- possibly on the test page.
  }

  var request = new XMLHttpRequest()
  request.open('POST', '/telemetry', true)
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.send(
    'session_id=' + window.session_id +
    '&display_hash=' + window.display_hash +
    '&type=' + type
  )
}

WHITE = 'white'
BLACK = 'black'
RED = 'red'
BLUE = 'blue'
ORANGE = 'orange'
YELLOW = 'yellow'

if (localStorage.theme === 'true') { // Dark scheme
  BACKGROUND = '#221' // '#000'
  FOREGROUND = '#751' // '#873'
  BORDER = '#666'
  LINE_DEFAULT = '#888' // '#FD8'
  LINE_SUCCESS = '#BBB' // '#FA0'
  LINE_FAIL = '#000'
  CURSOR = '#FFF'
  TEXT_COLOR = '#CCC'
  PAGE_BACKGROUND = '#000'
} else { // Light scheme
  BACKGROUND = '#0A8'
  FOREGROUND = '#344'
  BORDER = '#000'
  LINE_DEFAULT = '#AAA'
  LINE_SUCCESS = '#FFF'
  LINE_FAIL = '#000'
  CURSOR = '#FFF'
  TEXT_COLOR = '#000'
  PAGE_BACKGROUND = '#FFF'
}

var animations = '.line { \
  fill: ' + LINE_DEFAULT + '; \
  pointer-events: none; \
} \
@keyframes line-success { \
  from {fill: ' + LINE_DEFAULT + ';} \
  to {fill: ' + LINE_SUCCESS + ';} \
} \
@keyframes line-fail { \
  from {fill: ' + LINE_DEFAULT + ';} \
  to {fill: ' + LINE_FAIL + ';} \
} \
@keyframes start-grow { \
  from {height: 12; width: 12; top: 6; left: 6;} \
  to {height: 48; width: 48; top: -12; left: -12;} \
} \
@keyframes error { \
  from {} \
  to {fill: red;} \
} \
@keyframes fade { \
  from {} \
  to {opacity: 0.35;} \
}'
var style = document.createElement('style')
style.type = 'text/css'
style.title = 'animations'
style.appendChild(document.createTextNode(animations))
document.head.appendChild(style)

// Custom logging to allow leveling
var console_error = console.error
var console_warn = console.warn
var console_info = console.log
var console_log = console.log
var console_debug = console.log
var console_spam = console.log
var console_group = console.group
var console_groupEnd = console.groupEnd

function setLogLevel(level) {
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
  console.error = console_error
  if (level === 'error') return

  // Less serious than error, but flagged nonetheless
  console.warn = console_warn
  if (level === 'warn') return

  // Default visible, important information
  console.info = console_info
  if (level === 'info') return

  // Useful for debugging (mainly validation)
  console.log = console_log
  if (level === 'log') return

  // Useful for serious debugging (mainly graphics/misc)
  console.debug = console_debug
  if (level === 'debug') return

  // Useful for insane debugging (mainly tracing/recursion)
  console.spam = console_spam
  console.group = console_group
  console.groupEnd = console_groupEnd
  if (level === 'spam') return
}
setLogLevel('info')

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
  toggle.parentElement.style.height = '150px'
  toggle.style.top = '-10px'
}

function loadSettings() {
  var parentDiv = document.createElement('div')
  document.body.appendChild(parentDiv)
  parentDiv.style.position = 'absolute'
  parentDiv.style.float = 'left'
  parentDiv.style.border = '2px solid ' + BORDER
  parentDiv.style.background = PAGE_BACKGROUND

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
  document.body.style.color = TEXT_COLOR
  document.body.style.background = PAGE_BACKGROUND

  var themeLabel = document.createElement('label')
  settings.appendChild(themeLabel)
  themeLabel.for = 'theme'
  themeLabel.innerText = ' Dark theme'

  settings.appendChild(document.createElement('br'))
  settings.appendChild(document.createElement('br'))

  // Sensitivity
  var sensLabel = document.createElement('label')
  settings.appendChild(sensLabel)
  sensLabel.for = 'sens'
  sensLabel.innerText = 'Mouse Speed 2D'

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
}
