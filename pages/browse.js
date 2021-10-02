namespace(function() {

window.onload = function() {
  loadPuzzles()

  if (window.loggedIn) {
    var logout = document.createElement('a')
    logout.href = '/logout?next=browse.html'
    logout.innerText = 'Logout'
    document.body.insertBefore(logout, document.getElementById('puzzleTable'))

    var feedbackButton = document.getElementById('feedbackButton')
    feedbackButton.innerText = 'View feedback'
    feedbackButton.onpointerdown = function() {window.location = '/telemetry.html'}
  }
}

function addAdminButtons(puzzle, cell, img) {
  if (!window.loggedIn) return

  var del = document.createElement('button')
  del.innerText = 'X'
  del.style = 'background: black; color: red; cursor: pointer'
  del.onpointerdown = function(event) {
    event.preventDefault()
    var sure = prompt('Are you sure you want to delete puzzle ' + puzzle.title + '?')
    if (sure != 'yes' && sure != 'y') return

    window.sendHttpRequest('POST', '/delete', 120, 'puzzle=' + puzzle.display_hash,
      function(status, responseText) {
        if (status === 200) {
          cell.parentElement.removeChild(cell)
        } else {
          alert(responseText)
        }
      })
  }
  cell.appendChild(del)

  var ref = document.createElement('span')
  ref.style.cursor = 'pointer'
  ref.innerHTML = '&#128260;'
  ref.onpointerdown = function(event) {
    event.preventDefault()

    window.sendHttpRequest('POST', '/refresh', 120, 'puzzle=' + puzzle.display_hash,
      function(status, responseText) {
        if (this.status === 200) {
          img.src = this.responseText
          cell.removeChild(ref)
        } else {
          alert(this.responseText)
        }
      })
  }
  cell.appendChild(ref)
}

function addPuzzles(puzzles) {
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

    var link = document.createElement('label')
    cell.appendChild(link)
    link.href = puzzle.url
    link.innerText = puzzle.title
    link.style.cursor = 'pointer'
    link.style.color = window.TEXT_COLOR
    addAdminButtons(puzzle, cell, img)
  }
  console.log('Loaded puzzles')
}

var offset = 0
var puzzleHashes = []
function loadPuzzles() {
  sendHttpRequest('GET', '/browse?sort_type=date&order=desc&limit=100&offset=' + offset, 10,
    function(status, responseText) {
      if (status !== 200) {
        // Even when there are no more puzzles, we still get a 200, just with an empty body.
        // If we don't get a 200, we should try again later.
        window.setTimeout(loadPuzzles, 5000)
        return
      }
      addPuzzles(JSON.parse(responseText))
    })
}

window.onscroll = function() {
  // Show 'scroll to top' if we're scrolled down sufficiently
  var scrollToTop = document.getElementById('scrollToTop')
  if (scrollToTop) scrollToTop.style.display = (document.body.scrollTop > 800 ? null : 'none')

  // Start loading content when we get close to the bottom
  var currentHeight = document.body.scrollTop + document.body.clientHeight
  if (currentHeight / document.body.scrollHeight > 0.8) {
    loadPuzzles()
  }
}

})
