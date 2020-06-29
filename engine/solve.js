window.MAX_SOLUTIONS = 10000
// Generates a solution via DFS recursive backtracking
function solve(puzzle) {
  var solutions = []
  var start = (new Date()).getTime()
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[0].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell != undefined && cell.start === true) {
        _solveLoop(puzzle, x, y, solutions, magic = [false, null, null])
        // if (puzzle.pillar) {
        //   // TODO: Support pillars, somehow?
        //   _solveLoop(puzzle, x, y, solutions)
        // } else if (x == 0 || y == 0 || x == puzzle.grid.length - 1 || y == puzzle.grid[0].length - 1) {
        //   // TODO: Support center start points.
        //   // @Hack: To support pass-by-reference, I'm wrapping this inside an array.
        //   _solveLoop2(puzzle, x, y, solutions, [], [puzzle.createMaskedGrid()])
        // } else {
        //   _solveLoop(puzzle, x, y, solutions)
        // }
      }
    }
  }
  var end = (new Date()).getTime()
  console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
  return solutions
}

function _isEdge(puzzle, x, y) {
  return x <= 0 || y <= 0 || x >= puzzle.grid.length - 1 || y >= puzzle.grid[0].length - 1
}

// @Performance: This is the most central loop in this code.
// Any performance efforts should be focused here.
function _solveLoop(puzzle, x, y, solutions, magic) {
  // Stop trying to solve once we reach our goal
  if (solutions.length >= window.MAX_SOLUTIONS) return

  // Check for collisions (outside, gap, self, other)
  var cell = puzzle.getCell(x, y)
  if (cell == undefined) return
  if (cell.gap === 1 || cell.gap === 2) return
  if (cell.color !== 0) return

  if (puzzle.symmetry == undefined) {
    puzzle.updateCell(x, y, {'color':1})
  } else {
    var sym = puzzle.getSymmetricalPos(x, y)
    // @Hack, slightly. I can surface a `matchesSymmetricalPos` if I really want to keep this private.
    if (puzzle._mod(x) == sym.x && y == sym.y) return // Would collide with our reflection

    puzzle.updateCell(x, y, {'color':2})
    puzzle.updateCell(sym.x, sym.y, {'color':3})
  }

  // TODO: Inline isEdge?
  // TODO: puzzle.isEdge()?
  var isEdge = _isEdge(puzzle, x, y)
  var newMagic = [magic[0] || isEdge, magic[2], {'x':x, 'y':y, 'isEdge':isEdge}]
  if (newMagic[0] && magic[1] && !magic[1].isEdge && magic[2].isEdge && isEdge) {
    var floodX = magic[2].x - x + magic[1].x
    var floodY = magic[2].y - y + magic[1].y

    var maskedGrid = puzzle.createMaskedGrid()
    var region = puzzle.floodFill(maskedGrid, floodX, floodY)
    if (!window._regionCheckNegations(puzzle, region).valid) {

      // @Cutnpaste
      // Tail recursion: Back out of this cell
      puzzle.updateCell(x, y, {'color':0, 'dir':undefined})
      if (puzzle.symmetry != undefined) {
        var sym = puzzle.getSymmetricalPos(x, y)
        puzzle.updateCell(sym.x, sym.y, {'color':0})
      }
      return
    }
  }

  if (cell.end != undefined) {
    // Reached an endpoint, validate solution and keep going -- there may be other endpoints
    puzzle.updateCell(x, y, {'dir':'none'})
    window.validate(puzzle)
    if (puzzle.valid) {
      solutions.push(puzzle.clone())
    }
  }

  // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
  // Extend path left and right
  if (y%2 === 0) {
    puzzle.updateCell(x, y, {'dir':'left'})
    _solveLoop(puzzle, x - 1, y, solutions, newMagic)
    puzzle.updateCell(x, y, {'dir':'right'})
    _solveLoop(puzzle, x + 1, y, solutions, newMagic)
  }
  // Extend path up and down
  if (x%2 === 0) {
    puzzle.updateCell(x, y, {'dir':'top'})
    _solveLoop(puzzle, x, y - 1, solutions, newMagic)
    puzzle.updateCell(x, y, {'dir':'bottom'})
    _solveLoop(puzzle, x, y + 1, solutions, newMagic)
  }

  // Tail recursion: Back out of this cell
  puzzle.updateCell(x, y, {'color':0, 'dir':undefined})
  if (puzzle.symmetry != undefined) {
    var sym = puzzle.getSymmetricalPos(x, y)
    puzzle.updateCell(sym.x, sym.y, {'color':0})
  }
}

// @Performance: This is the most central loop in this code.
// Any performance efforts should be focused here.
function _solveLoop2(puzzle, x, y, solutions, path, maskedGrid) {
  // Check for solution limit
  if (solutions.length >= window.MAX_SOLUTIONS) return

  // Check for collisions (outside, gap, self, other)
  var cell = puzzle.getCell(x, y)
  if (cell == undefined) return
  if (cell.gap === 1 || cell.gap === 2) return
  if (cell.color !== 0) return // Collided with ourselves

  if (puzzle.symmetry == undefined) {
    puzzle.updateCell(x, y, {'color':1})
  } else {
    var sym = puzzle.getSymmetricalPos(x, y)
    if (x == sym.x && y == sym.y) return // Would collide with our reflection

    puzzle.updateCell(x, y, {'color':2})
    puzzle.updateCell(sym.x, sym.y, {'color':3})
  }

  path.push({'x':x, 'y':y})

  // @Bug, probably -- should check for end after magic.
  if (cell.end != undefined) {
    // @Performance? This just looks... dumb.
    var maskedGridCopy = JSON.parse(JSON.stringify(maskedGrid[0]))

    // @Bug We're not doing anything with the regionData objects...!
    // Maybe this is OK for solve? Just not validate()?

    // This also looks dumb. But it's probably quite fast...
    var valid = true
    for (var dx=-1; dx<2; dx++) {
      for (var dy=-1; dy<2; dy++) {
        var region = puzzle.floodFill(maskedGrid[0], path, x + dx, y + dy)
        if (!window._regionCheckNegations(puzzle, region).valid) {
          valid = false
          break
        }
      }
      if (!valid) break
    }

    if (valid) {
      // TODO: I don't really want this, ever. Find a way to enable only for debugging?
      // Oh, or just move this code to wherever I need it.
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
          solution.updateCell(pos.x, pos.y, {'dir':dir})
        } else {
          solution.updateCell(pos.x, pos.y, {'dir':dir})
          var sym = solution.getSymmetricalPos(pos.x, pos.y)
          var symDir = solution.getSymmetricalDir(dir)
          solution.updateCell(sym.x, sym.y, {'dir':symDir})
        }
      }
      solutions.push(solution)
    }
    // Restore the previous grid and continue -- there may be other endpoints (with different regions)
    maskedGrid[0] = maskedGridCopy
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
        _solveLoop2(puzzle, x - 1, y, solutions, path, maskedGrid)
        _solveLoop2(puzzle, x + 1, y, solutions, path, maskedGrid)
      }
      if (x%2 === 0) {
        _solveLoop2(puzzle, x, y - 1, solutions, path, maskedGrid)
        _solveLoop2(puzzle, x, y + 1, solutions, path, maskedGrid)
      }
    }
    maskedGrid[0] = maskedGridCopy
    puzzle.updateCell(x, y, {'color':0})
    if (puzzle.symmetry != undefined) {
      var sym = puzzle.getSymmetricalPos(x, y)
      puzzle.updateCell(sym.x, sym.y, {'color':0})
    }

    path.pop()
    return
  }

  // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
  // Extend path left and right
  if (y%2 === 0) {
    _solveLoop2(puzzle, x - 1, y, solutions, path, maskedGrid)
    _solveLoop2(puzzle, x + 1, y, solutions, path, maskedGrid)
  }
  // Extend path up and down
  if (x%2 === 0) {
    _solveLoop2(puzzle, x, y - 1, solutions, path, maskedGrid)
    _solveLoop2(puzzle, x, y + 1, solutions, path, maskedGrid)
  }

  puzzle.updateCell(x, y, {'color':0})
  if (puzzle.symmetry != undefined) {
    var sym = puzzle.getSymmetricalPos(x, y)
    puzzle.updateCell(sym.x, sym.y, {'color':0})
  }

  // Tail recursion: Back out of this cell
  path.pop()
}
