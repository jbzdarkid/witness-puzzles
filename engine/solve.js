window.MAX_SOLUTIONS = 10000
// Generates a solution via DFS recursive backtracking
function solve(puzzle) {
  var start = (new Date()).getTime()

  var startPoints = []
  var numEndpoints = 0
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[0].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined) continue
      if (cell.start === true) {
        startPoints.push({'x': x, 'y': y})
      }
      if (cell.end != undefined) numEndpoints++
    }
  }

  var solutions = []
  // Some reasonable default data, which will avoid crashes during the solveLoop.
  var earlyExitData = [false, {'isEdge': false}, {'isEdge': false}]
  for (var pos of startPoints) {
    _solveLoop(puzzle, pos.x, pos.y, solutions, numEndpoints, earlyExitData)
  }

  var end = (new Date()).getTime()
  console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
  return solutions
}

// @Performance: This is the most central loop in this code.
// Any performance efforts should be focused here.
function _solveLoop(puzzle, x, y, solutions, numEndpoints, earlyExitData) {
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

  // Large optimization -- Attempt to early exit once we cut out a region.
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
    var isEdge = x <= 0 || y <= 0 || x >= puzzle.grid.length - 1 || y >= puzzle.grid[0].length - 1
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
  } else {
    var newEarlyExitData = earlyExitData // Unused, just make a cheap copy.
  }

  if (cell.end != undefined) {
    puzzle.updateCell(x, y, {'dir':'none'})
    window.validate(puzzle)
    if (puzzle.valid) {
      solutions.push(puzzle.clone())
    }
    // If there are no further endpoints, tail recurse.
    // Otherwise, keep going -- we might be able to reach another endpoint.
    if (numEndpoints === 1) {
      // @Cutnpaste
      // Tail recursion: Back out of this cell
      puzzle.updateCell(x, y, {'color':0, 'dir':undefined})
      if (puzzle.symmetry != undefined) {
        var sym = puzzle.getSymmetricalPos(x, y)
        puzzle.updateCell(sym.x, sym.y, {'color':0})
      }
      return
    }
    numEndpoints--
  }

  // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
  // Extend path left and right
  if (y%2 === 0) {
    puzzle.updateCell(x, y, {'dir':'left'})
    _solveLoop(puzzle, x - 1, y, solutions, numEndpoints, newEarlyExitData)
    puzzle.updateCell(x, y, {'dir':'right'})
    _solveLoop(puzzle, x + 1, y, solutions, numEndpoints, newEarlyExitData)
  }
  // Extend path up and down
  if (x%2 === 0) {
    puzzle.updateCell(x, y, {'dir':'top'})
    _solveLoop(puzzle, x, y - 1, solutions, numEndpoints, newEarlyExitData)
    puzzle.updateCell(x, y, {'dir':'bottom'})
    _solveLoop(puzzle, x, y + 1, solutions, numEndpoints, newEarlyExitData)
  }

  // Tail recursion: Back out of this cell
  puzzle.updateCell(x, y, {'color':0, 'dir':undefined})
  if (puzzle.symmetry != undefined) {
    var sym = puzzle.getSymmetricalPos(x, y)
    puzzle.updateCell(sym.x, sym.y, {'color':0})
  }
}

// TODO: Probably want 'solutions' in here, if only to save a variable.
class SharedCallback {
  constructor(parentCallback=null) {
    this.pendingChildren = 0
    this.onComplete = null
    this.parentCallback = parentCallback
    if (parentCallback) {
      this.fraction = 0.0
      this.total = parentCallback.total
      this.totalCallback = parentCallback.totalCallback
      this.parentCallback.pendingChildren++
    } else {
      this.fraction = 1.0
      this.total = [0.0]
      this.totalCallback = null
    }
  }

  execute(code, onComplete) {
    if (onComplete == undefined) {
      // If there is no callback provided, just execute synchronously, don't bother doing anything fancy.
      code(this)
      this.parentCallback._onChildComplete(this.fraction)
      return
    }
    this.onComplete = onComplete

    var childCallback = new SharedCallback(this)
    var parentCallback = this

    setTimeout(function() {
      if (parentCallback.fraction > 0.01) {
        childCallback.fraction = parentCallback.fraction / (parentCallback.pendingChildren)
        parentCallback.fraction -= childCallback.fraction
      }

      code(childCallback)

      if (childCallback.pendingChildren === 0) {
        // No recursion occurred, so we are at a leaf node.
        // Consider our child dead, since nobody took a reference to it.
        // Thus, we call our completion routine (which it would've called, except it's dead)
        parentCallback._onChildComplete(childCallback.fraction)
      } else {
        // The child callback is alive, so it can handle itself. When it finishes, it should call our completion routine.
      }
    }, 0)
  }

  _onChildComplete(fraction) {
    if (fraction > 0) {
      this.total[0] += fraction
      if (this.totalCallback) this.totalCallback(this.total[0])
    }

    this.pendingChildren--
    if (this.pendingChildren <= 0) {
      if (this.onComplete) this.onComplete()
      if (this.parentCallback) this.parentCallback._onChildComplete(this.fraction)
    }
  }
}

var total = 0
function testAsync() {
  k = 10000
  var sharedCallback = new SharedCallback()
  sharedCallback.totalCallback = function(percent) {
    console.info('Completion progress:', 100 * percent)
  }

  sharedCallback.execute(function(childCallback) {
    testLoop(childCallback, 0, k)
  }, function() {
    console.info('!!! Final callback !!!', total)
  })
}

function testLoop(sharedCallback, depth, k) {
  if (k <= 1) {
    total += k
    return
  }

  var i = Math.floor(k / 2)
  var j = k - i

  sharedCallback.execute(function(childCallback) {
    testLoop(childCallback, depth + 1, i)
    testLoop(childCallback, depth + 1, j)
  }, function() {
    // whatever
  })
}

testAsync()

/*
// Very duplicated. FEEEX

window.MAX_SOLUTIONS = 10000
// Generates a solution via DFS recursive backtracking
function solveAsync(puzzle, callback) {
  var start = (new Date()).getTime()

  var startPoints = []
  var numEndpoints = 0
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[0].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined) continue
      if (cell.start === true) {
        startPoints.push({'x': x, 'y': y})
      }
      if (cell.end != undefined) numEndpoints++
    }
  }

  var solutions = []
  // Inelegant. If I wire in solutions, maybe it's cleaner?
  var sharedCallback = new SharedCallback(function() {
    var end = (new Date()).getTime()
    console.info('Solved', puzzle, 'in', (end-start)/1000, 'seconds')
    callback(solutions)
  })

  // Some reasonable default data, which will avoid crashes during the solveLoop.
  var earlyExitData = [false, {'isEdge': false}, {'isEdge': false}]
  // N.B. It's important that we only call execute on the root object once,
  // otherwise it will count beyond 100%.
  sharedCallback.execute(function(sharedCallback) {
    for (var pos of startPoints) {
      _solveLoop2(puzzle, pos.x, pos.y, solutions, numEndpoints, earlyExitData, sharedCallback)
    }
  })
}

// @Performance: This is the most central loop in this code.
// Any performance efforts should be focused here.
function _solveLoop2(puzzle, x, y, solutions, numEndpoints, earlyExitData, sharedCallback) {
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

  // Large optimization -- Attempt to early exit once we cut out a region.
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
    var isEdge = x <= 0 || y <= 0 || x >= puzzle.grid.length - 1 || y >= puzzle.grid[0].length - 1
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
  } else {
    var newEarlyExitData = earlyExitData // Unused, just make a cheap copy.
  }

  if (cell.end != undefined) {
    puzzle.updateCell(x, y, {'dir':'none'})
    window.validate(puzzle)
    if (puzzle.valid) {
      solutions.push(puzzle.clone())
    }
    // If there are no further endpoints, tail recurse.
    // Otherwise, keep going -- we might be able to reach another endpoint.
    if (numEndpoints === 1) {
      // @Cutnpaste
      // Tail recursion: Back out of this cell
      puzzle.updateCell(x, y, {'color':0, 'dir':undefined})
      if (puzzle.symmetry != undefined) {
        var sym = puzzle.getSymmetricalPos(x, y)
        puzzle.updateCell(sym.x, sym.y, {'color':0})
      }
      return
    }
    numEndpoints--
  }

  sharedCallback.execute(function(childCallback) {
    // Within this scope, we have a new, child callback.
    // Every time its .execute() is called, the parent callback adds a reference.
    // Once all references are freed, we execute the completion block.

    // Recursion order (LRUD) is optimized for BL->TR and mid-start puzzles
    // Extend path left and right
    if (y%2 === 0) {
      puzzle.updateCell(x, y, {'dir':'left'})
      _solveLoop2(puzzle, x - 1, y, solutions, numEndpoints, newEarlyExitData, childCallback)
      puzzle.updateCell(x, y, {'dir':'right'})
      _solveLoop2(puzzle, x + 1, y, solutions, numEndpoints, newEarlyExitData, childCallback)
    }

    // Extend path up and down
    if (x%2 === 0) {
      puzzle.updateCell(x, y, {'dir':'top'})
      _solveLoop2(puzzle, x, y - 1, solutions, numEndpoints, newEarlyExitData, childCallback)
      puzzle.updateCell(x, y, {'dir':'bottom'})
      _solveLoop2(puzzle, x, y + 1, solutions, numEndpoints, newEarlyExitData, childCallback)
    }
  }, function() {
    // Once all the above childCallbacks have completed, this block will execute.

    // Tail recursion: Back out of this cell
    puzzle.updateCell(x, y, {'color':0, 'dir':undefined})
    if (puzzle.symmetry != undefined) {
      var sym = puzzle.getSymmetricalPos(x, y)
      puzzle.updateCell(sym.x, sym.y, {'color':0})
    }
  })
}
*/
