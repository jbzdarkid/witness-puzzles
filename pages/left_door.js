var overflow = ''
function onRead(chunk) {
  var segments = chunk.split('\n')
  overflow += segments.shift()
  if (segments.length === 0) return // There were no newlines in the output, keep reading

  onReadLine(overflow)
  overflow = segments.pop()
  for (var segment of segments) onReadLine(segment)
}

function onReadLine(line) {
  var segments = line.split('\t')
  var p = Puzzle.deserialize(segments[3])
  var paths = window.solve(p)
  if (paths.length !== 0) {
    console.info(segments[0], paths.length)
  }
}

var offset = 0
var buffSize = 2048
var time = 0
function readFromFile(file, fileSize, onComplete) {
  var reader = new FileReader()
  reader.addEventListener('load', function(e) {
    onRead(e.target.result)
    offset += buffSize
    if (offset < fileSize) {
      setTimeout(function() {readFromFile(file, fileSize, onComplete)}, 10)
    } else {
      onComplete()
    }
  })

  var buff = file.slice(offset, offset+buffSize) // ... I guess this "prepares" javascript to read a chunk?
  reader.readAsBinaryString(buff)
}

window.onload = function() {
  var input = document.getElementById('file')
  input.addEventListener('change', function() {
    time -= (new Date()).getTime()
    if (this.files && this.files[0]) {
      var file = this.files[0]
      fileSize = file.size // ... how do we know the filesize without reading? File attributes, I hope.
      readFromFile(file, fileSize, function() {
        time += (new Date()).getTime()
        console.info('Done in ' + (time/1000) + ' seconds')
      })
    }
  })
}