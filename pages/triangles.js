namespace(function() {

var seed = 0
window.onload = function() {
  if (location.hash == '') {
    seed = Math.floor(Math.random() * (1 << 30))
    newTriangles(9999)
  } else if (location.hash.startsWith('#unique')) {
    seed = parseInt(location.hash.substring(7))
    newTriangles(1)
  } else {
    seed = parseInt(location.hash.substring(1))
    newTriangles(9999)
  }
}

function randInt(n) {
  seed = ((seed << 13) ^ seed) - (seed >> 21)
  return Math.abs(seed) % Math.floor(n)
}

function randomTriangle(numTriangles, maxSolutions) {
  while (true) {
    var puzzleSeed = seed
    console.info('Generating seed ' + seed + '...')

    var puzzle = new Puzzle(4, 4)
    puzzle.grid[0][8].start = true
    puzzle.grid[8][0].end = 'top'

    var cells = []
    for (var x=0; x < puzzle.width; x++) {
      for (var y=0; y < puzzle.height; y++) {
        if (x%2 === 1 && y%2 === 1) cells.push({'x':x, 'y':y})
      }
    }

    for (var i=0; i<numTriangles; i++) {
      var count = 0
      var rng = randInt(100)
      if (rng >=  0 && rng <= 50) count = 1 // 51%
      if (rng >= 51 && rng <= 85) count = 2 // 35%
      if (rng >= 86 && rng <= 99) count = 3 // 14%

      var pos = cells.splice(randInt(cells.length), 1)[0]
      puzzle.grid[pos.x][pos.y] = {'type':'triangle', 'color':'orange', 'count':count}
    }

    var paths = window.solve(puzzle)
    console.info('Puzzle', puzzle, 'has', paths.length, 'solutions: ')
    if (paths.length < 1) console.info('Too hard')
    else if (paths.length > maxSolutions) console.info('Too easy')
    else break
  }

  return {'puzzle':puzzle, 'paths':paths, 'seed':puzzleSeed}
}

// @Cutnpaste from utilities.js
function showSolution(puzzle, paths, num, side) {
  var previousSolution = document.getElementById('previousSolution-' + side)
  var solutionCount = document.getElementById('solutionCount-' + side)
  var nextSolution = document.getElementById('nextSolution-' + side)
  document.getElementById('solutionViewer-' + side).style.display = null

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
        showSolution(puzzle, paths, num - 10, side)
      } else {
        showSolution(puzzle, paths, num - 1, side)
      }
    }
    nextSolution.onpointerdown = function(event) {
      if (event.shiftKey) {
        showSolution(puzzle, paths, num + 10, side)
      } else {
        showSolution(puzzle, paths, num + 1, side)
      }
    }
  }
  if (paths[num] != null) {
    // Draws the given path, and also updates the puzzle to have path annotations on it.
    window.drawPath(puzzle, paths[num], side)
  }
}

window.newTriangles = function(maxSolutions) {
  var triangle6 = randomTriangle(6, maxSolutions)
  var triangle8 = randomTriangle(8, maxSolutions)
  window.draw(triangle6.puzzle, 'left')
  window.draw(triangle8.puzzle, 'right')
  document.getElementById('solutionViewer-left').style.display = 'none'
  document.getElementById('solutionViewer-right').style.display = 'none'

  window.showSolutions = function() {
    window.showSolution(triangle6.puzzle, triangle6.paths, 0, '-left')
    window.showSolution(triangle8.puzzle, triangle8.paths, 0, '-right')
  }
  window.TRACE_COMPLETION_FUNC = function(solution) {
    if (solution == triangle6.puzzle) {
      var index = window.getSolutionIndex(triangle6.paths, solution)
      window.showSolution(triangle6.puzzle, triangle6.paths, index, '-left')
    } else {
      var index = window.getSolutionIndex(triangle8.paths, solution)
      window.showSolution(triangle8.puzzle, triangle8.paths, index, '-right')
    }
  }

  if (maxSolutions === 1) {
    location.hash = 'unique' + triangle6['seed']
  } else {
    location.hash = triangle6['seed']
  }
}

})
