namespace(function() {

// Adapted from https://stackoverflow.com/a/2117523
function uuidv4() {
  return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

// https://stackoverflow.com/q/12571650
window.addEventListener('error', function(event) {
  ERROR(event.error.stack)
  console.error('Error in file ' + event.filename + ' on line ' + event.line)
})

function sendRequest(type, data) {
  var request = new XMLHttpRequest()
  request.open('POST', '/telemetry', true) // Fire and forget
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
  request.send('version=%version%&type=' + type + '&data=' + data)
}

window.FEEDBACK     = function(message) { sendRequest('feedback', message) }
window.ERROR        = function(message) { sendRequest('error', message) }
var sessionId = uuidv4() // Session ID is generated every page load, so as to not identify the user.
window.START_PUZZLE = function() { sendRequest('puzzleStart', sessionId) }
window.SOLVE_PUZZLE = function() { sendRequest('puzzleSolve', sessionId) }

})
