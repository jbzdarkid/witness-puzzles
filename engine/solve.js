namespace(function() {

window.MAX_SOLUTIONS = 10000
// Generates a solution via DFS recursive backtracking
window.solve = function(puzzle, partialCallback=null, finalCallback=null) {
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

  var isSynchronous = (partialCallback == null && finalCallback == null)

  var paths = []
  // Some reasonable default data, which will avoid crashes during the solveLoop.
  var earlyExitData = [false, {'isEdge': false}, {'isEdge': false}]

  if (isSynchronous) { // Run synchronously
    for (var pos of startPoints) {
      solveLoop(puzzle, pos.x, pos.y, paths, numEndpoints, earlyExitData, 0, [pos])
    }

    var end = (new Date()).getTime()
    console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
    return paths
  } else { // Run asynchronously

    // This awkward function exists to ensure that pos is copied for each task.
    function addTask(pos) {
      tasks.push({'code': function() {
        return solveLoop(puzzle, pos.x, pos.y, paths, numEndpoints, earlyExitData, 5, [pos])
      }, 'fraction': (1.0 / startPoints.length)})
    }

    for (var pos of startPoints) {
      addTask(pos)
    }

    runTaskLoop(partialCallback, function() {
      var end = (new Date()).getTime()
      console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
      finalCallback(paths)
    })
    return []
  }
}

window.cancelSolving = function() {
  window.MAX_SOLUTIONS = 0 // Causes all solveLoop steps to exit immediately.
  tasks = []
}

window.pathToSolution = function(puzzle, path) {
  var newPuzzle = puzzle.clone()
  var start = path[0]
  var x = start.x
  var y = start.y
  for (var i=1; i<path.length; i++) {
    newPuzzle.updateCell2(x, y, 'dir', path[i])
    if (puzzle.symmetry == undefined) {
      newPuzzle.updateCell2(x, y, 'line', window.LINE_BLACK)
    } else {
      newPuzzle.updateCell2(x, y, 'line', window.LINE_BLUE)
      var sym = puzzle.getSymmetricalPos(x, y)
      newPuzzle.updateCell2(sym.x, sym.y, 'line', window.LINE_YELLOW)
    }
    if (path[i] == "left") x--
    else if (path[i] == "right") x++
    else if (path[i] == "top") y--
    else if (path[i] == "bottom") y++
  }
  return newPuzzle
}

var tasks = []
function runTaskLoop(partialCallback, finalCallback)  {
  var completed = 0.0
  function doOneTask() {
    if (tasks.length === 0) {
      finalCallback()
      return
    }

    var task = tasks.pop()
    var newTasks = task.code()

    if (newTasks == undefined || newTasks.length === 0) {
      // No new tasks
      completed += task.fraction
      partialCallback(completed)
    } else {
      for (var i=0; i<newTasks.length; i++) {
        tasks.push({'code':newTasks[i], 'fraction': task.fraction / newTasks.length})
      }
    }

    setTimeout(doOneTask, 0)
  }
  setTimeout(doOneTask, 0)
}

function tailRecurse(puzzle, x, y) {
  // Tail recursion: Back out of this cell
  puzzle.updateCell2(x, y, 'line', window.LINE_NONE)
  // puzzle.updateCell2(x, y, 'dir', undefined)
  if (puzzle.symmetry != undefined) {
    var sym = puzzle.getSymmetricalPos(x, y)
    puzzle.updateCell2(sym.x, sym.y, 'line', window.LINE_NONE)
  }
}

// @Performance: This is the most central loop in this code.
// Any performance efforts should be focused here.
// Note: Most mechanics are NP (or harder), so don't feel bad about solving them by brute force.
// https://arxiv.org/pdf/1804.10193.pdf
function solveLoop(puzzle, x, y, paths, numEndpoints, earlyExitData, depth, path) {
  // Stop trying to solve once we reach our goal
  if (paths.length >= window.MAX_SOLUTIONS) return

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
  // Once we reach C, however, the region to the right is guaranteed to be un-enterable.
  // As such, we can start a flood fill from the cell to the right of A, computed by A+(C-B).
  //
  // Unfortunately, this optimization doesn't work for pillars, since the two regions are the same.
  if (puzzle.pillar === false) {
    var isEdge = x <= 0 || y <= 0 || x >= puzzle.width - 1 || y >= puzzle.height - 1
    var newEarlyExitData = [
      earlyExitData[0] || (!isEdge && earlyExitData[2].isEdge), // Have we ever left an edge?
      earlyExitData[2],                                         // The position before our current one
      {'x':x, 'y':y, 'isEdge':isEdge}                           // Our current position.
    ]
    if (earlyExitData[0] && !earlyExitData[1].isEdge && earlyExitData[2].isEdge && isEdge) {
      // Compute the X and Y of the region we just cut out.
      // This is determined by looking at the delta between the current and last points,
      // then replaying the *inverse* of that delta against the second-to-last point.
      var regionX = earlyExitData[2].x + (earlyExitData[1].x - x)
      var regionY = earlyExitData[2].y + (earlyExitData[1].y - y)

      var region = puzzle.getRegion(regionX, regionY)
      if (region != undefined) {
        var regionData = window.validateRegion(puzzle, region, true)
        if (!regionData.valid()) return tailRecurse(puzzle, x, y)

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

  if (cell.end != undefined) {
    path.push('none')
    window.validate(puzzle, true)
    if (puzzle.valid) paths.push(path.slice())
    path.pop()

    // If there are no further endpoints, tail recurse.
    // Otherwise, keep going -- we might be able to reach another endpoint.
    numEndpoints--
    if (numEndpoints === 0) return tailRecurse(puzzle, x, y)
  }

  // Far down the stack, execute synchronously
  if (depth === 0) {
    // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
    // Extend path left and right
    if (y%2 === 0) {
      path.push('left')
      solveLoop(puzzle, x - 1, y, paths, numEndpoints, newEarlyExitData, 0, path)
      path.pop()
      path.push('right')
      solveLoop(puzzle, x + 1, y, paths, numEndpoints, newEarlyExitData, 0, path)
      path.pop()
    }
    // Extend path up and down
    if (x%2 === 0) {
      path.push('top')
      solveLoop(puzzle, x, y - 1, paths, numEndpoints, newEarlyExitData, 0, path)
      path.pop()
      path.push('bottom')
      solveLoop(puzzle, x, y + 1, paths, numEndpoints, newEarlyExitData, 0, path)
      path.pop()
    }
    return tailRecurse(puzzle, x, y)
  } else {
    // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
    // Note: The order reversed because we push these into a queue, then pop them to execute them.

    var newTasks = []

    // Push an empty element on the end of the path, so that we can fill it correctly as we DFS.
    // This element is popped when we tail recurse (which always happens *after* all of our DFS!)
    path.push('')
    newTasks.push(function() {
      path.pop()
      tailRecurse(puzzle, x, y)
    })

    // Extend path up and down
    if (x%2 === 0) {
      newTasks.push(function() {
        path[path.length-1] = 'bottom'
        return solveLoop(puzzle, x, y + 1, paths, numEndpoints, newEarlyExitData, depth - 1, path)
      })
      newTasks.push(function() {
        path[path.length-1] = 'top'
        return solveLoop(puzzle, x, y - 1, paths, numEndpoints, newEarlyExitData, depth - 1, path)
      })
    }

    // Extend path left and right
    if (y%2 === 0) {
      newTasks.push(function() {
        path[path.length-1] = 'right'
        return solveLoop(puzzle, x + 1, y, paths, numEndpoints, newEarlyExitData, depth - 1, path)
      })
      newTasks.push(function() {
        path[path.length-1] = 'left'
        return solveLoop(puzzle, x - 1, y, paths, numEndpoints, newEarlyExitData, depth - 1, path)
      })
    }

    return newTasks
  }
}

})