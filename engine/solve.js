window.MAX_SOLUTIONS = 10000
// Generates a solution via DFS recursive backtracking
function solve(puzzle) {
  var solutions = []
  var start = (new Date()).getTime()
  for (var startPoint of puzzle.startPoints) {
    _solveLoop(puzzle, startPoint.x, startPoint.y, solutions)
  }
  var end = (new Date()).getTime()
  console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
  return solutions
}

function _solveLoop(puzzle, x, y, solutions) {
  if (window.MAX_SOLUTIONS != -1 && solutions.length >= window.MAX_SOLUTIONS) return
  var endDir = puzzle.getEndDir(x, y)
  if (endDir != undefined) {
    // Reached the end point, validate solution and tail recurse
    puzzle.setCell(x, y, {'color':1, 'dir':'none'})
    validate(puzzle)
    if (puzzle.valid) {
      solutions.push(puzzle.clone())
    }
    puzzle.updateCell(x, y, {'color':0, 'dir':undefined})
  }
  // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
  // Extend path left
  if (y%2 == 0 && puzzle.getLine(x - 1, y) == 0) {
    puzzle.updateCell(x--, y, {'color':1, 'dir':'left'})
    _solveLoop(puzzle, x, y, solutions)
    puzzle.updateCell(++x, y, {'color':0, 'dir':undefined})
  }
  // Extend path right
  if (y%2 == 0 && puzzle.getLine(x + 1, y) == 0) {
    puzzle.updateCell(x++, y, {'color':1, 'dir':'right'})
    _solveLoop(puzzle, x, y, solutions)
    puzzle.updateCell(--x, y, {'color':0, 'dir':undefined})
  }
  // Extend path up
  if (x%2 == 0 && puzzle.getLine(x, y - 1) == 0) {
    puzzle.updateCell(x, y--, {'color':1, 'dir':'top'})
    _solveLoop(puzzle, x, y, solutions)
    puzzle.updateCell(x, ++y, {'color':0, 'dir':undefined})
  }
  // Extend path down
  if (x%2 == 0 && puzzle.getLine(x, y + 1) == 0) {
    puzzle.updateCell(x, y++, {'color':1, 'dir':'bottom'})
    _solveLoop(puzzle, x, y, solutions)
    puzzle.updateCell(x, --y, {'color':0, 'dir':undefined})
  }
}
