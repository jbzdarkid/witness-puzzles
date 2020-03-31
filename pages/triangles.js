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

function _randInt(n) {
  seed = ((seed << 13) ^ seed) - (seed >> 21)
  return Math.abs(seed) % Math.floor(n)
}

function _randomTriangle(numTriangles, maxSolutions) {
  while (true) {
    var puzzleSeed = seed
    console.info('Generating seed ' + seed + '...')

    var puzzle = new Puzzle(4, 4)
    puzzle.grid[0][8].start = true
    puzzle.grid[8][0].end = 'right'

    var cells = []
    for (var x=0; x < puzzle.grid.length; x++) {
      for (var y=0; y < puzzle.grid[0].length; y++) {
        if (x%2 == 1 && y%2 == 1) cells.push({'x':x, 'y':y})
      }
    }

    for (var i=0; i<numTriangles; i++) {
      var count = 0
      var rng = _randInt(100)
      if (rng >=  0 && rng <= 50) count = 1 // 51%
      if (rng >= 51 && rng <= 85) count = 2 // 25%
      if (rng >= 86 && rng <= 99) count = 3 // 14%

      var pos = cells.splice(_randInt(cells.length), 1)[0]
      puzzle.grid[pos.x][pos.y] = {'type':'triangle', 'color':'orange', 'count':count}
    }

    var solutions = window.solve(puzzle)
    console.info('Puzzle', puzzle, 'has', solutions.length, 'solutions: ')
    if (solutions.length < 1) console.info('Too hard')
    else if (solutions.length > maxSolutions) console.info('Too easy')
    else break
  }

  return {'puzzle':puzzle, 'solutions':solutions, 'seed':puzzleSeed}
}

function _showSolution(solutions, num, side) {
  if (num < 0) num = solutions.length - 1
  if (num >= solutions.length) num = 0

  var previousSolution = document.getElementById('previousSolution-' + side)
  var solutionCount = document.getElementById('solutionCount-' + side)
  var nextSolution = document.getElementById('nextSolution-' + side)

  // Buttons & text
  if (solutions.length < 2) { // 0 or 1 solution(s), arrows are useless
    solutionCount.innerText = solutions.length + ' of ' + solutions.length
    previousSolution.disabled = true
    nextSolution.disabled = true
  } else {
    solutionCount.innerText = (num + 1) + ' of ' + solutions.length
    previousSolution.disabled = false
    nextSolution.disabled = false
    previousSolution.onclick = function() {_showSolution(solutions, num - 1, side)}
    nextSolution.onclick = function() {_showSolution(solutions, num + 1, side)}
  }
  if (solutions[num] != undefined) {
    window.draw(solutions[num].clone(), side)
  }
  document.getElementById('solutionViewer-' + side).style.display = null
}

function _getSolutionIndex(list, solution) {
  for (var i=0; i<list.length; i++) {
    var match = true
    for (var x=0; x<solution.grid.length; x++) {
      for (var y=0; y<solution.grid[0].length; y++) {
        if (solution.grid[x][y].color != list[i].grid[x][y].color) {
          match = false
          break
        }
      }
      if (match == false) break
    }
    if (match) return i
  }
}

function newTriangles(maxSolutions) {
  var triangle6 = _randomTriangle(6, maxSolutions)
  var triangle8 = _randomTriangle(8, maxSolutions)
  window.draw(triangle6['puzzle'], 'left')
  window.draw(triangle8['puzzle'], 'right')
  document.getElementById('solutionViewer-left').style.display = 'none'
  document.getElementById('solutionViewer-right').style.display = 'none'

  window.showSolution = function() {
    _showSolution(triangle6.solutions, 0, 'left')
    _showSolution(triangle8.solutions, 0, 'right')
  }
  window.TRACE_COMPLETION_FUNC = function(solution) {
    if (data.svg.id == 'left') {
      var index = _getSolutionIndex(triangle6.solutions, solution)
      _showSolution(triangle6.solutions, index, 'left')
    } else if (data.svg.id == 'right') {
      var index = _getSolutionIndex(triangle8.solutions, solution)
      _showSolution(triangle8.solutions, index, 'right')
    }
  }

  if (maxSolutions == 1) {
    location.hash = 'unique' + triangle6['seed']
  } else {
    location.hash = triangle6['seed']
  }
}
