namespace(function() {

window.MAX_SOLUTIONS = 10000
var solutionPaths = []

// Generates a solution via DFS recursive backtracking
window.solve = function(puzzle) {
  var start = (new Date()).getTime()

  var startPoints = []
  var numEndpoints = 0
  puzzle.hasNegations = false
  puzzle.hasPolyominos = false
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined) continue
      if (cell.start === true) {
        startPoints.push({'x': x, 'y': y})
      }
      if (cell.end != undefined) numEndpoints++
      if (cell.type == 'nega') puzzle.hasNegations = true
      if (cell.type == 'poly' || cell.type == 'ylop') puzzle.hasPolyominos = true
    }
  }

  solutionPaths = []
  // Some reasonable default data, which will avoid crashes during the solveLoop.
  var earlyExitData = [false, {'isEdge': false}, {'isEdge': false}]

  for (var pos of startPoints) {
    solveLoop(puzzle, pos.x, pos.y, numEndpoints, earlyExitData, [pos])
  }

  var end = (new Date()).getTime()
  console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
  return solutionPaths
}

var PATH_NONE   = 0
var PATH_LEFT   = 1
var PATH_RIGHT  = 2
var PATH_TOP    = 3
var PATH_BOTTOM = 4

function tailRecurse(puzzle, x, y) {
  // Tail recursion: Back out of this cell
  puzzle.updateCell2(x, y, 'line', window.LINE_NONE)
  if (puzzle.symmetry != undefined) {
    var sym = puzzle.getSymmetricalPos(x, y)
    puzzle.updateCell2(sym.x, sym.y, 'line', window.LINE_NONE)
  }
}

// @Performance: This is the most central loop in this code.
// Any performance efforts should be focused here.
// Note: Most mechanics are NP (or harder), so don't feel bad about solving them by brute force.
// https://arxiv.org/pdf/1804.10193.pdf
function solveLoop(puzzle, x, y, numEndpoints, earlyExitData, path) {
  // Stop trying to solve once we reach our goal
  if (solutionPaths.length >= window.MAX_SOLUTIONS) return

  // Check for collisions (outside, gap, self, other)
  var cell = puzzle.getCell(x, y)
  if (cell == undefined) return
  if (cell.gap === 1 || cell.gap === 2) return
  if (cell.line !== window.LINE_NONE) return

  if (puzzle.symmetry == undefined) {
    puzzle.updateCell2(x, y, 'line', window.LINE_BLACK)
  } else {
    var sym = puzzle.getSymmetricalPos(x, y)
    // @Hack, slightly. I can surface a `matchesSymmetricalPos` if I really want to keep this private.
    if (puzzle._mod(x) == sym.x && y == sym.y) return // Would collide with our reflection

    var symCell = puzzle.getCell(sym.x, sym.y)
    if (symCell.gap === 1 || symCell.gap === 2) return

    puzzle.updateCell2(x, y, 'line', window.LINE_BLUE)
    puzzle.updateCell2(sym.x, sym.y, 'line', window.LINE_YELLOW)
  }

  if (cell.end != undefined) {
    path.push(PATH_NONE)
    window.validate(puzzle, true)
    if (puzzle.valid) solutionPaths.push(path.slice())
    path.pop()

    // If there are no further endpoints, tail recurse.
    // Otherwise, keep going -- we might be able to reach another endpoint.
    numEndpoints--
    if (numEndpoints === 0) return tailRecurse(puzzle, x, y)
  }

  // Large optimization -- Attempt to early exit once we cut out a region.
  // Inspired by https://github.com/Overv/TheWitnessSolver
  // For non-pillar puzzles, every time we draw a line from one edge to another, we cut out two regions.
  // We can detect this by asking if we've ever left an edge, and determining if we've just touched an edge.
  // However, just touching the edge isn't sufficient, since we could still enter either region.
  // As such, we wait one additional step, to see which half we have moved in to, then we evaluate
  // whichever half you moved away from (since you can no longer re-enter it).
  //
  // Consider this pathway (tracing X-X-X-A-B-C).
  // ....X....
  // . . X . .
  // ....X....
  // . . A . .
  // ...CB....
  //
  // Note that, once we have reached B, the puzzle is divided in half. However, we could go either
  // left or right -- so we don't know which region is safe to validate.
  // Once we reach C, however, the region to the right is closed off.
  // As such, we can start a flood fill from the cell to the right of A, computed by A+(C-B).
  //
  // Unfortunately, this optimization doesn't work for pillars, since the two regions are still connected.
  if (puzzle.pillar === false) {
    var isEdge = x <= 0 || y <= 0 || x >= puzzle.width - 1 || y >= puzzle.height - 1
    var newEarlyExitData = [
      earlyExitData[0] || (!isEdge && earlyExitData[2].isEdge), // Have we ever left an edge?
      earlyExitData[2],                                         // The position before our current one
      {'x':x, 'y':y, 'isEdge':isEdge}                           // Our current position.
    ]
    if (earlyExitData[0] && !earlyExitData[1].isEdge && earlyExitData[2].isEdge && isEdge) {
      // See the above comment for an explanation of this math.
      var floodX = earlyExitData[2].x + (earlyExitData[1].x - x)
      var floodY = earlyExitData[2].y + (earlyExitData[1].y - y)
      var region = puzzle.getRegion(floodX, floodY)
      if (region != undefined) {
        var regionData = window.validateRegion(puzzle, region, true)
        if (!regionData.valid()) return tailRecurse(puzzle, x, y)

        // Additionally, we might have left an endpoint in the enclosed region.
        // If so, we should decrement the number of remaining endpoints (and possibly tail recurse).
        for (var pos of region.cells) {
          var endCell = puzzle.getCell(pos.x, pos.y)
          if (endCell != undefined && endCell.end != undefined) numEndpoints--
        }

        if (numEndpoints === 0) return tailRecurse(puzzle, x, y)
      }
    }
  } else {
    var newEarlyExitData = earlyExitData // Unused, just make a cheap copy.
  }

  // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
  if (y%2 === 0) {
    path.push(PATH_LEFT)
    solveLoop(puzzle, x - 1, y, numEndpoints, newEarlyExitData, path)
    path.pop()
    path.push(PATH_RIGHT)
    solveLoop(puzzle, x + 1, y, numEndpoints, newEarlyExitData, path)
    path.pop()
  }
  if (x%2 === 0) {
    path.push(PATH_TOP)
    solveLoop(puzzle, x, y - 1, numEndpoints, newEarlyExitData, path)
    path.pop()
    path.push(PATH_BOTTOM)
    solveLoop(puzzle, x, y + 1, numEndpoints, newEarlyExitData, path)
    path.pop()
  }
  return tailRecurse(puzzle, x, y)
}

})
