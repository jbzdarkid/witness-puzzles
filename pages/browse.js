namespace(function() {

window.onload = function() {
  loadPuzzles()

  if (window.loggedIn) {
    var logout = document.createElement('a')
    logout.href = '/logout?next=browse.html'
    logout.innerText = 'Logout'
    document.body.insertBefore(logout, document.getElementById('puzzleTable'))
  }
}

var offset = 0
var currentLoadRequest = null
var puzzleHashes = []
function loadPuzzles() {
  if (currentLoadRequest != null) return
  currentLoadRequest = new XMLHttpRequest()
  currentLoadRequest.onreadystatechange = function() {
    if (this.readyState != XMLHttpRequest.DONE) return
    if (this.status !== 200) {
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

      var link = document.createElement('label')
      cell.appendChild(link)
      link.href = puzzle.url
      link.innerText = puzzle.title
      link.style.cursor = 'pointer'
      link.style.color = window.TEXT_COLOR

      if (window.loggedIn) {
        // ;(function(a){}(a))
        // This syntax is used to forcibly copy all of the arguments
        ;(function(puzzle, cell, img) {
          var del = document.createElement('button')
          del.innerText = 'X'
          del.style = 'background: black; color: red'
          del.onclick = function(event) {
            event.preventDefault()
            var sure = prompt('Are you sure you want to delete puzzle ' + puzzle.title + '?')
            if (sure != 'yes' && sure != 'y') return
            var request = new XMLHttpRequest()
            request.onreadystatechange = function() {
              if (this.readyState != XMLHttpRequest.DONE) return
              if (this.status === 200) {
                cell.parentElement.removeChild(cell)
              } else {
                alert(this.responseText)
              }
            }
            request.timeout = 120000 // 120,000 milliseconds = 2 minutes
            request.open('POST', '/delete', true)
            request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            request.setRequestHeader('X-CSRFToken', window.csrfToken)
            request.send('puzzle=' + puzzle.display_hash)
          }
          cell.appendChild(del)

          var ref = document.createElement('span')
          ref.innerHTML = '&#128260;'
          ref.onclick = function(event) {
            event.preventDefault()
            var request = new XMLHttpRequest()
            request.onreadystatechange = function() {
              if (this.readyState != XMLHttpRequest.DONE) return
              if (this.status === 200) {
                img.src = this.responseText
                cell.removeChild(ref)
              } else {
                alert(this.responseText)
              }
            }
            request.timeout = 120000 // 120,000 milliseconds = 2 minutes
            request.open('POST', '/refresh', true)
            request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            request.setRequestHeader('X-CSRFToken', window.csrfToken)
            request.send('puzzle=' + puzzle.display_hash)
          }
          cell.appendChild(ref)
        }(puzzle, cell, img))
      }
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
  if (scrollToTop) scrollToTop.style.display = (document.body.scrollTop > 800 ? null : 'none')

  // Start loading content when we get close to the bottom
  var currentHeight = document.body.scrollTop + document.body.clientHeight
  if (currentHeight / document.body.scrollHeight > 0.8) {
    loadPuzzles()
  }
}

})
