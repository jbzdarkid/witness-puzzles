var puzzle

window.onload = function() {
  loadPuzzleRegion('Tutorial')
}

function loadPuzzleRegion(region) {
  var areaPuzzles = document.getElementById('areaPuzzles')
  while (areaPuzzles.getElementsByTagName('option').length > 0) {
    areaPuzzles.getElementsByTagName('option')[0].remove()
  }
  areaPuzzles.value = '' // Forces onchange to fire for any selection

  for (var puzzleInfo of window.getAllPuzzles()) {
    if (puzzleInfo['area'] != region) continue
    var option = document.createElement('option')
    try {
      option.value = Puzzle.deserialize(puzzleInfo.data).serialize()
    } catch {
      option.value = puzzleInfo.data.serialize()
    }

    option.innerText = puzzleInfo['name']
    areaPuzzles.appendChild(option)
  }
}

function loadSinglePuzzle(puzzleData) {
  document.getElementById('solutionViewer').style.display = 'none'
  puzzle = Puzzle.deserialize(puzzleData)
  window.draw(puzzle)
}

function isColored(grid, x, y) {
  var cell = grid[x][y]
  return (cell != null && cell.line >= window.LINE_BLACK)
}

// @HACK
var PATH_NONE   = 0
var PATH_LEFT   = 1
var PATH_RIGHT  = 2
var PATH_TOP    = 3
var PATH_BOTTOM = 4

function pathToSolution(puzzle, path) {
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
    if (path[i] == PATH_LEFT) x--
    else if (path[i] == PATH_RIGHT) x++
    else if (path[i] == PATH_TOP) y--
    else if (path[i] == PATH_BOTTOM) y++
  }
  return newPuzzle
}

// No deduplication at all.
function getPathKey0(puzzle, path) {
  return []
}

// A little bit too aggressive about deduplication. Specifically, this key would consider "going clockwise" and "going counter-clockwise" to be the same.
function getPathKey1(puzzle, path) {
  var pathKey = []
  var solution = pathToSolution(puzzle, path)
  var regions = solution.getRegions()
  for (var region of regions) {
    var hasPolys = false
    var hasSymbols = false
    var regionKey = new Region(puzzle.width)
    for (var pos of region.cells) {
      if (pos.x%2 != 1 || pos.y%2 != 1) continue // TODO: Dots?
      var cell = puzzle.getCell(pos.x, pos.y)
      if (cell == undefined) continue
      if (cell.type == 'poly') {
        hasPolys = true
        break
      } else {
        hasSymbols = true
        regionKey.setCell(pos.x, pos.y)
      }
    }
    if (hasPolys) {
      pathKey.push(region.grid.toString()) // Polyominos require an exact region match
    } else if (hasSymbols) {
      pathKey.push(regionKey.grid.toString()) // Cache the locations of symbols which are in the region.
    }
  }
  return pathKey.sort().join('-')
}

// NOTE: Doesn't handle polyominos!
// Very happy to merge things. It does matter how many stones are in each region.
function getPathKey2(puzzle, path) {
  var leftKey = new Region(puzzle.width)
  var rightKey = new Region(puzzle.width)

  var solution = pathToSolution(puzzle, path)
  var regions = solution.getRegions()
  for (var region of regions) {
    var isLeft = false
    for (var pos of region.cells) {
      if (pos.x === 0 || pos.y === 0) {
        isLeft = true
        break
      }
    }

    for (var pos of region.cells) {
      if (pos.x%2 != 1 || pos.y%2 != 1) continue // TODO: Dots?
      var cell = puzzle.getCell(pos.x, pos.y)
      if (cell == undefined) continue
      if (isLeft) leftKey.setCell(pos.x, pos.y)
      else       rightKey.setCell(pos.x, pos.y)
    }
  }
  return leftKey.grid.toString() + '-' + rightKey.grid.toString()
}

function getPathKey3(puzzle, path) {
  var pathKey = []
  var solution = pathToSolution(puzzle, path)
  var regions = solution.getRegions()
  for (var region of regions) {
    var hasPolys = false
    var hasSymbols = false
    var regionKey = new Region(puzzle.width)
    var isLeft = false
    for (var pos of region.cells) {
      if (pos.x === 0 || pos.y === 0) {
        isLeft = true
        break
      }
    }

    for (var pos of region.cells) {
      if (pos.x%2 != 1 || pos.y%2 != 1) continue // TODO: Dots?
      var cell = puzzle.getCell(pos.x, pos.y)
      if (cell == undefined) continue
      if (cell.type == 'poly') {
        hasPolys = true
        break
      } else {
        hasSymbols = true
        regionKey.setCell(pos.x, pos.y)
      }
    }
    var suffix = (isLeft ? 'L' : 'R')
    if (hasPolys) {
      pathKey.push(region.grid.toString() + suffix) // Polyominos require an exact region match
    } else if (hasSymbols) {
      pathKey.push(regionKey.grid.toString() + suffix) // Cache the locations of symbols which are in the region.
    }
  }
  return pathKey.sort().join('|')
}


window.onSolvedPuzzle = function(paths) {
  function sortKey(pathA, pathB) {
    return pathA.length - pathB.length
  }
  paths.sort(sortKey)

  var uniquePaths = []
  var uniquePathKeys = []
  for (var path of paths) {
    var pathKey = getPathKey3(puzzle, path)
    if (!uniquePathKeys.includes(pathKey)) {
      uniquePaths.push(path)
      uniquePathKeys.push(pathKey)
    }
  }
  paths = uniquePaths

    /*
    var solution = window.pathToSolution(puzzle, paths[i])
    var edges = 0
    var corners = 0
    for (var x=0; x<solution.grid.length; x++) {
      for (var y=0; y<solution.grid[x].length; y++) {
        if (x%2 == 1 && y%2 == 1) continue
        var cell = solution.grid[x][y]
        if (cell == null || cell.line === window.LINE_NONE) continue

        var topCell = solution.grid[x][y-1]
        var bottomCell = solution.grid[x][y+1]
        var leftCell = solution.grid[x-1] && solution.grid[x-1][y]
        var rightCell = solution.grid[x+1] && solution.grid[x+1][y]

        if (x%2 != y%2) edges++

        if (leftCell == null) {
          if (cell.dir == 'right') corners++
        } else if (rightCell == null) {
          if (cell.dir == 'left') corners++
        } else if (topCell == null) {
          if (cell.dir == 'bottom') corners++
        } else if (bottomCell == null) {
          if (cell.dir == 'top') corners++
        } else { // Not touching any walls
          if (cell.dir == 'left' && leftCell.dir == 'left') {}
          else if (cell.dir == 'right' && rightCell.dir == 'right') {}
          else if (cell.dir == 'top' && topCell.dir == 'top') {}
          else if (cell.dir == 'bottom' && bottomCell.dir == 'bottom') {}
          else corners++ // Direction change
        }
      }
    }
    */
  return paths
}
