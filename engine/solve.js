window.MAX_SOLUTIONS = 10000
// Generates a solution via DFS recursive backtracking
function solve(puzzle) {
  var solutions = []
  var start = (new Date()).getTime()
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell != undefined && cell.start === true) {
        _solveLoop(puzzle, x, y, solutions)
      }
    }
  }
  var end = (new Date()).getTime()
  console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
  return solutions
}

function _solveLoop(puzzle, x, y, solutions) {
  if (window.MAX_SOLUTIONS !== -1 && solutions.length >= window.MAX_SOLUTIONS) return
  var cell = puzzle.getCell(x, y)
  if (cell == undefined) return

  if (puzzle.symmetry == undefined) {
    if (cell.color !== 0) return // Collided with ourselves
    puzzle.updateCell(x, y, {'color':1}) // Otherwise, mark this cell as visited
  } else {
    // Get the symmetrical position, and try coloring it
    var sym = puzzle.getSymmetricalPos(x, y)
    var oldColor = puzzle.getLine(sym.x, sym.y)
    puzzle.updateCell(sym.x, sym.y, {'color':3})

    // Collided with ourselves or our reflection
    if (cell.color !== 0) {
      puzzle.updateCell(sym.x, sym.y, {'color':oldColor})
      return
    }
    puzzle.updateCell(x, y, {'color':2}) // Otherwise, mark this cell as visited
  }

  if (cell.end != undefined) {
    // Reached an endpoint, validate solution and keep going -- there may be other endpoints
    puzzle.updateCell(x, y, {'dir':'none'})
    window.validate(puzzle)
    if (puzzle.valid) {
      solutions.push(Puzzle.deserialize(puzzle.serialize()))
    }
  }
  // @Performance: @Sanity: Don't allow the line to go through gaps.
  // @Performance: Before trying the above, figure out why 5x5 with 2x gap over start point is 20s.

  // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
  // Extend path left and right
  if (y%2 === 0) {
    puzzle.updateCell(x, y, {'dir':'left'})
    _solveLoop(puzzle, x - 1, y, solutions)
    puzzle.updateCell(x, y, {'dir':'right'})
    _solveLoop(puzzle, x + 1, y, solutions)
  }
  // Extend path up and down
  if (x%2 === 0) {
    puzzle.updateCell(x, y, {'dir':'top'})
    _solveLoop(puzzle, x, y - 1, solutions)
    puzzle.updateCell(x, y, {'dir':'bottom'})
    _solveLoop(puzzle, x, y + 1, solutions)
  }

  // Tail recursion: Back out of this cell
  puzzle.updateCell(x, y, {'color':0, 'dir':undefined})
  if (puzzle.symmetry != undefined) {
    var sym = puzzle.getSymmetricalPos(x, y)
    puzzle.updateCell(sym.x, sym.y, {'color':0})
  }
}
