window.onload = function() {
  var navbar = document.getElementById('navbar')
  navbar.style.borderBottom = '2px solid ' + window.BORDER
  navbar.style.background = window.PAGE_BACKGROUND

  var request = new XMLHttpRequest()
  request.open('GET', '/browse?sort_type=date&order=desc', false)
  request.send()
  var puzzles = JSON.parse(request.response)
  var table = document.getElementById('puzzleTable')

  for (var i=0; i<puzzles.length; i++) {
    var puzzle = puzzles[i]
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
}
