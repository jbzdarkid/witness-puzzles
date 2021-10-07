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

var sessionId = uuidv4() // Session ID is unique per page load, so as not to identify the user.

function sendRequest(type, data) {
  body = 'session_id=' + sessionId
  body += '&event_type=' + type
  body += '&version=%version%'
  if (data != null) body += '&data=' + data

  window.fireAndForget('POST', '/telemetry', body)
}

window.FEEDBACK     = function(message) { sendRequest('feedback', message) }
window.ERROR        = function(message) { sendRequest('error', message) }
window.START_PUZZLE = function() { sendRequest('puzzle_start') }
window.SOLVE_PUZZLE = function() { sendRequest('puzzle_solve') }

})
