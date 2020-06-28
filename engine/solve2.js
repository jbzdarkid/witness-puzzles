window.MAX_SOLUTIONS = 10000
// Generates a solution via DFS recursive backtracking
// Since most mechanics are NP, this is as good as anything else, up to optimizations.
// See: https://arxiv.org/pdf/1804.10193.pdf
function solve(puzzle) {
  var solutions = []
  var start = (new Date()).getTime()
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell != undefined && cell.start === true) {
        // @Hack: To support pass-by-reference, I'm wrapping this inside an array.
        _solveLoop(puzzle, x, y, solutions, [], [puzzle.createMaskedGrid()])
      }
    }
  }
  var end = (new Date()).getTime()
  console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
  return solutions
}

// @Performance: This is the most central loop in this code.
// Any performance efforts should be focused here.
function _solveLoop(puzzle, x, y, solutions, path, maskedGrid) {
  // Check for solution limit
  if (solutions.length >= window.MAX_SOLUTIONS) return

  // Check for collisions (outside, gap, self, other)
  var cell = puzzle.getCell(x, y)
  if (cell == undefined) return
  if (cell.gap === 1 || cell.gap === 2) return

  if (puzzle.symmetry == undefined) {
    for (var pos of path) {
      // Compare performance to just keeping the grid up-to-date.
      if (pos.x == x && pos.y == y) return // Collided with ourselves
    }
    path.push({'x':x, 'y':y}) // Otherwise, mark this cell as visited
  } else {
    var sym = puzzle.getSymmetricalPos(x, y)
    if (x == sym.x && y == sym.y) return // Would collide with our reflection
    for (var pos of path) {
      if (pos.x == x && pos.y == y) return // Collided with ourselves
      if (pos.x == sym.x && pos.y == sym.y) return // Collided with our reflection
    }
    path.push({'x':x, 'y':y}) // Otherwise, mark this cell as visited
  }

  if (cell.end != undefined) {
    // @Performance? This just looks... dumb.
    var maskedGridCopy = JSON.parse(JSON.stringify(maskedGrid[0]))

    // @Bug We're not doing anything with the regionData objects...!
    // Maybe this is OK for solve? Just not validate()?

    // This also looks dumb. But it's probably quite fast...
    var region1 = puzzle.floodFill(maskedGrid[0], path, x - 1, y - 1)
    if (window._regionCheckNegations(puzzle, region1).valid) {
      var region2 = puzzle.floodFill(maskedGrid[0], path, x - 1, y + 1)
      if (window._regionCheckNegations(puzzle, region2).valid) {
        var region3 = puzzle.floodFill(maskedGrid[0], path, x + 1, y - 1)
        if (window._regionCheckNegations(puzzle, region3).valid) {
          var region4 = puzzle.floodFill(maskedGrid[0], path, x + 1, y + 1)
          if (window._regionCheckNegations(puzzle, region4).valid) {
            // TODO: I don't really want this, ever. Only for debugging?
            var solution = puzzle.clone()
            for (var i=0; i<path.length; i++) {
              var pos = path[i]
              var dir = undefined
              if (i == path.length - 1) dir = 'none'
              else if (pos.x - 1 === path[i+1].x) dir = 'left'
              else if (pos.x + 1 === path[i+1].x) dir = 'right'
              else if (pos.y - 1 === path[i+1].y) dir = 'top'
              else if (pos.y + 1 === path[i+1].y) dir = 'bottom'

              if (solution.symmetry == undefined) {
                solution.updateCell(pos.x, pos.y, {'color':1, 'dir':dir})
              } else {
                solution.updateCell(pos.x, pos.y, {'color':2, 'dir':dir})
                var sym = solution.getSymmetricalPos(pos.x, pos.y)
                var symDir = solution.getSymmetricalDir(dir)
                solution.updateCell(sym.x, sym.y, {'color':3, 'dir':symDir})
              }
            }
            solutions.push(solution)
          }
        }
      }
    }
    // Restore the previous grid and continue -- there may be other endpoints (with different regions)
    maskedGrid[0] = maskedGridCopy
  }

  // TODO: This logic doesn't apply to pillars.
  assert(!puzzle.pillar)
  function isOuter(pos) {
    return pos.x <= 0 || pos.y <= 0 || pos.x >= puzzle.grid.length - 1 || pos.y >= puzzle.grid[0].length - 1
  }

  if (path.length >= 3 && !isOuter(path[path.length-3]) && isOuter(path[path.length-2])) {
    // Black magic. (put a comment with ascii art here)
    var floodX = path[path.length-3].x - path[path.length-1].x + path[path.length-2].x
    var floodY = path[path.length-3].y - path[path.length-1].y + path[path.length-2].y

    // @Performance? This just looks... dumb.
    var maskedGridCopy = JSON.parse(JSON.stringify(maskedGrid[0]))
    var region = puzzle.floodFill(maskedGrid[0], path, floodX, floodY)
    // Validate the region we just enclosed. If valid, continue.
    if (window._regionCheckNegations(puzzle, region).valid) {
      // @Cutnpaste from below.
      if (y%2 === 0) {
        _solveLoop(puzzle, x - 1, y, solutions, path, maskedGrid)
        _solveLoop(puzzle, x + 1, y, solutions, path, maskedGrid)
      }
      if (x%2 === 0) {
        _solveLoop(puzzle, x, y - 1, solutions, path, maskedGrid)
        _solveLoop(puzzle, x, y + 1, solutions, path, maskedGrid)
      }
    }
    maskedGrid[0] = maskedGridCopy
    path.pop()
    return
  }

  // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
  // Extend path left and right
  if (y%2 === 0) {
    _solveLoop(puzzle, x - 1, y, solutions, path, maskedGrid)
    _solveLoop(puzzle, x + 1, y, solutions, path, maskedGrid)
  }
  // Extend path up and down
  if (x%2 === 0) {
    _solveLoop(puzzle, x, y - 1, solutions, path, maskedGrid)
    _solveLoop(puzzle, x, y + 1, solutions, path, maskedGrid)
  }

  // Tail recursion: Back out of this cell
  path.pop()
}
