namespace(function() {

// A lot of this is stolen from editor.js
// If you find bugs, fix them there too!
window.puzzle = null
window.onload = function() {
  clearPuzzle()
  document.getElementById('solveMode').style.display = 'none'
  document.getElementById('solveManual').style.display = 'none'
  document.getElementById('solveAuto').style.display = 'none'
}

window.clearPuzzle = function() {
  puzzle = new Puzzle(4, 4)
  puzzle.grid[0][8].start = true
  puzzle.grid[8][0].end = 'right'
  drawPuzzle()
  document.getElementById('solutionViewer').style.display = 'none'
}

function drawPuzzle() {
  window.draw(puzzle)
  window.clearAnimations()

  // @Robustness: Maybe I should be cleaning house more thoroughly? A class or something would let me just remove these...
  var puzzleElement = document.getElementById('puzzle')
  // Remove all 'onTraceStart' calls, they should be interacted through solveManually only.
  for (var child of puzzleElement.children) {
    child.onpointerdown = null
  }

  var addOnClick = function(elem, x, y) {
    elem.onpointerdown = function(event) {onElementClicked(event, x, y)}
  }

  var xPos = 40
  var topLeft = {'x':40, 'y':40}
  for (var x=0; x<puzzle.width; x++) {
    var yPos = 40
    var width = (x%2 === 0 ? 24 : 58)
    for (var y=0; y<puzzle.height; y++) {
      var height = (y%2 === 0 ? 24 : 58)
      var rect = createElement('rect')
      puzzleElement.appendChild(rect)
      rect.setAttribute('x', xPos)
      rect.setAttribute('y', yPos)
      rect.setAttribute('width', width)
      rect.setAttribute('height', height)
      rect.setAttribute('fill', 'white')
      rect.setAttribute('opacity', 0)
      yPos += height
      if (x%2 == 1 && y%2 == 1) {
        addOnClick(rect, x, y)
        rect.onpointerenter = function() {this.setAttribute('opacity', 0.25)}
        rect.onpointerleave = function() {this.setAttribute('opacity', 0)}
      }
    }
    xPos += width
  }
}

function puzzleHasElements() {
  for (var x=1; x<puzzle.width; x+=2) {
    for (var y=1; y<puzzle.height; y+=2) {
      if (puzzle.grid[x][y] != null) return true
    }
  }
  return false
}

function onElementClicked(event, x, y) {
  if (x%2 !== 1 || y%2 !== 1) return

  var count = 0
  if (puzzle.grid[x][y] != null && puzzle.grid[x][y].count != null) {
    count = puzzle.grid[x][y].count
  }
  count += (event.isRightClick() ? -1 : 1)
  if (count < 0) count = 3
  if (count > 3) count = 0
  if (count == 0) {
    puzzle.grid[x][y] = null
  } else {
    puzzle.grid[x][y] = {
      'type': 'triangle',
      'color': 'orange',
      'count': count
    }
  }
  drawPuzzle()
  puzzle.clearLines()

  if (puzzleHasElements()) {
    window.solve(puzzle)
    window.solvePuzzle()
  } else {
    document.getElementById('solutionViewer').style.display = 'none'
  }
}

window.onSolvedPuzzle = function(paths) {
  if (puzzleHasElements()) {
    return paths
  } else {
    // Race condition where the puzzle was cleared, but then the previous solve attempt finished. Cleanup.
    document.getElementById('solutionViewer').style.display = 'none'
    puzzle.clearLines()
    return []
  }
}

})