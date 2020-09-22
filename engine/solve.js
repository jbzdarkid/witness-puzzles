namespace(function() {

window.MAX_SOLUTIONS = 0
window.cancelSolving = function() {
  window.MAX_SOLUTIONS = 0 // Causes all new solveLoop calls to exit immediately.
  tasks = []
}

var solutionPaths = []
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

  solutionPaths = []
  // Some reasonable default data, which will avoid crashes during the solveLoop.
  var earlyExitData = [false, {'isEdge': false}, {'isEdge': false}]
  window.MAX_SOLUTIONS = 10000

  if (isSynchronous) { // Run synchronously
    for (var pos of startPoints) {
      solveLoop(puzzle, pos.x, pos.y, numEndpoints, earlyExitData, 0, [pos])
    }

    var end = (new Date()).getTime()
    console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
    return solutionPaths
  } else { // Run asynchronously
    completed = 0.0
    task = {
      'code': function() {
        var newTasks = []
        // TODO: Maybe bug with multiple startpoints
        for (var pos of startPoints) {
          newTasks.push(function() {
            return solveLoop(puzzle, pos.x, pos.y, numEndpoints, earlyExitData, 999, [pos])
          })
        }
        return newTasks
      },
      'fraction': 1.0,
    }
    doOneTask(partialCallback, function() {
      var end = (new Date()).getTime()
      console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
      finalCallback(solutionPaths)
    })
    return []
  }
}

var PATH_NONE   = 0
var PATH_LEFT   = 1
var PATH_RIGHT  = 2
var PATH_TOP    = 3
var PATH_BOTTOM = 4

// Uses trace2 to draw the path on the grid, logs a graphical representation of the solution,
// and also modifies the puzzle to contain the solution path.
window.drawPath = function(puzzle, path, target='puzzle') {
  // Clear out the grid before drawing another solution
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      puzzle.updateCell2(x, y, 'dir', undefined)
      puzzle.updateCell2(x, y, 'line', undefined)
    }
  }

  window.deleteElementsByClassName(document, 'line-1')
  window.deleteElementsByClassName(document, 'cursor')

  // Extract the start data from the first path element
  var x = path[0].x
  var y = path[0].y
  var start = document.getElementById('start_' + target + '_' + x + '_' + y)
  var symStart = document.getElementById('symStart_' + target + '_' + x + '_' + y)
  window.onTraceStart(puzzle, {'x':x, 'y':y}, document.getElementById(target), start, symStart)

  console.info('Drawing solution')
  for (var i=1; i<path.length; i++) {
    var cell = puzzle.getCell(x, y)

    var dx = 0
    var dy = 0
    if (path[i] == PATH_NONE) { // Reached an endpoint, move into it
      console.log('Reached endpoint')
      if (cell.end === 'left') {
        window.onMove(-24, 0)
      } else if (cell.end === 'right') {
        window.onMove(24, 0)
      } else if (cell.end === 'top') {
        window.onMove(0, -24)
      } else if (cell.end === 'bottom') {
        window.onMove(0, 24)
      }
      break
    } else if (path[i] === PATH_LEFT) {
      dx = -1
      cell.dir = 'left'
    } else if (path[i] === PATH_RIGHT) {
      dx = +1
      cell.dir = 'right'
    } else if (path[i] === PATH_TOP) {
      dy = -1
      cell.dir = 'top'
    } else if (path[i] === PATH_BOTTOM) {
      dy = +1
      cell.dir = 'down'
    }

    console.log('Currently at', x, y, cell, 'moving', dx, dy)

    x += dx
    y += dy
    // Unflag the cell, move into it, and reflag it
    cell.line = window.LINE_NONE
    window.onMove(41 * dx, 41 * dy)
    if (puzzle.symmetry == undefined) {
      cell.line = window.LINE_BLACK
    } else {
      cell.line = window.LINE_BLUE
      var sym = puzzle.getSymmetricalPos(x, y)
      puzzle.updateCell2(sym.x, sym.y, 'line', window.LINE_YELLOW)
    }
  }

  var rows = '   |'
  for (var x=0; x<puzzle.width; x++) {
    rows += ('' + x).padEnd(5, ' ') + '|'
  }
  console.info(rows)
  for (var y=0; y<puzzle.height; y++) {
    var output = ('' + y).padEnd(3, ' ') + '|'
    for (var x=0; x<puzzle.width; x++) {
      var cell = puzzle.grid[x][y]
      var dir = (cell != undefined && cell.dir != undefined ? cell.dir : '')
      output += dir.padEnd(5, ' ') + '|'
    }
    console.info(output)
  }
}

var asyncTimer = 0
var completed = 0.0
var task = undefined
function doOneTask(partialCallback, finalCallback) {
  if (task == undefined) {
    finalCallback()
    return
  }

  var newTasks = task.code()

  if (newTasks == undefined || newTasks.length === 0) {
    // No new tasks
    completed += task.fraction
    partialCallback(completed)
    task = task.nextTask
  } else {
    // Tasks are pushed in order. To do DFS, we need to enqueue them in reverse order.
    var fraction = task.fraction / newTasks.length
    task = task.nextTask // Pop this task before adding more tasks

    for (var i=newTasks.length - 1; i >= 0; i--) {
      task = {
        'code': newTasks[i],
        'fraction': fraction,
        'nextTask': task,
      }
    }
  }

  // Asynchronizing is expensive. As such, we don't want to do it too often.
  // However, we would like 'cancel solving' to be responsive. As such, we asynchronize every 100 calls.
  if (++asyncTimer % 100 === 0) {
    setTimeout(function() {
      doOneTask(partialCallback, finalCallback)
    }, 0)
  } else {
    doOneTask(partialCallback, finalCallback)
  }
}

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
function solveLoop(puzzle, x, y, numEndpoints, earlyExitData, depth, path) {
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

  // Far down the stack, execute synchronously
  if (depth <= 0) {
    // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
    if (y%2 === 0) {
      path.push(PATH_LEFT)
      solveLoop(puzzle, x - 1, y, numEndpoints, newEarlyExitData, depth - 1, path)
      path.pop()
      path.push(PATH_RIGHT)
      solveLoop(puzzle, x + 1, y, numEndpoints, newEarlyExitData, depth - 1, path)
      path.pop()
    }
    if (x%2 === 0) {
      path.push(PATH_TOP)
      solveLoop(puzzle, x, y - 1, numEndpoints, newEarlyExitData, depth - 1, path)
      path.pop()
      path.push(PATH_BOTTOM)
      solveLoop(puzzle, x, y + 1, numEndpoints, newEarlyExitData, depth - 1, path)
      path.pop()
    }
    return tailRecurse(puzzle, x, y)
  } else {
    // Push a dummy element on the end of the path, so that we can fill it correctly as we DFS.
    // This element is popped when we tail recurse (which always happens *after* all of our DFS!)
    path.push(PATH_NONE)

    // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
    var newTasks = []
    if (y%2 === 0) {
      newTasks.push(function() {
        path[path.length-1] = PATH_LEFT
        return solveLoop(puzzle, x - 1, y, numEndpoints, newEarlyExitData, depth - 1, path)
      })
      newTasks.push(function() {
        path[path.length-1] = PATH_RIGHT
        return solveLoop(puzzle, x + 1, y, numEndpoints, newEarlyExitData, depth - 1, path)
      })
    }

    if (x%2 === 0) {
      newTasks.push(function() {
        path[path.length-1] = PATH_TOP
        return solveLoop(puzzle, x, y - 1, numEndpoints, newEarlyExitData, depth - 1, path)
      })
      newTasks.push(function() {
        path[path.length-1] = PATH_BOTTOM
        return solveLoop(puzzle, x, y + 1, numEndpoints, newEarlyExitData, depth - 1, path)
      })
    }

    newTasks.push(function() {
      path.pop()
      tailRecurse(puzzle, x, y)
    })

    return newTasks
  }
}

})
