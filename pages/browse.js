namespace(function() {

window.onload = function() {
  loadPuzzles()
}

var offset = 0
var currentLoadRequest = null
var puzzleHashes = []
window.loadPuzzles = function() {
  if (currentLoadRequest != null) return
  currentLoadRequest = new XMLHttpRequest()
  currentLoadRequest.onreadystatechange = function() {
    if (this.readyState != XMLHttpRequest.DONE) return
    if (this.status != 200) {
      // Even when there are no more puzzles, we still get a 200, just with an empty body.
      // If we don't get a 200, we should try again later.
      window.setTimeout(function() {
        currentLoadRequest = null
      }, 5000)
      return
    }

    var puzzles = JSON.parse(this.responseText)
    var table = document.getElementById('puzzleTable')
    for (var i=0; i<puzzles.length; i++) {
      var puzzle = puzzles[i]
      if (puzzleHashes.includes(puzzle.display_hash)) continue
      puzzleHashes.push(puzzle.display_hash)
      offset++

      var cell = document.createElement('a')
      table.appendChild(cell)
      cell.href = '/play/' + puzzle.display_hash
      cell.style.margin = '30px'

      var img = document.createElement('img')
      cell.appendChild(img)
      img.style.maxHeight = '200px'
      img.src = puzzle.url

      cell.appendChild(document.createElement('br'))
      window.createLink(puzzle.url, puzzle.title, parent=cell)
    }
    console.log('Loaded puzzles')
    currentLoadRequest = null

  }
  currentLoadRequest.timeout = 10000 // 10,000 milliseconds = 10 seconds
  currentLoadRequest.open('GET', '/browse?sort_type=date&order=desc&limit=100&offset=' + offset)
  currentLoadRequest.send()
}

window.onscroll = function() {
  // Show 'scroll to top' if we're scrolled down sufficiently
  var scrollToTop = document.getElementById('scrollToTop')
  scrollToTop.style.display = (document.body.scrollTop > 800 ? null : 'none')

  // Start loading content when we get close to the bottom
  var currentHeight = document.body.scrollTop + document.body.clientHeight
  if (currentHeight > document.body.scrollHeight - 800) {
    loadPuzzles()
  }
}

})