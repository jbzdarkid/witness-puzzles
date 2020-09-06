var puzzle

window.onload = function() {
  loadPuzzleRegion('Tutorial')
}

function loadPuzzleRegion(region) {
  var areaPuzzles = document.getElementById('areaPuzzles')
  while (areaPuzzles.getElementsByTagName('option').length > 0) {
    areaPuzzles.getElementsByTagName('option')[0].remove()
  }
  // areaPuzzles.value = '' // Forces onchange to fire for any selection

  for (var puzzleInfo of window.ALL_PUZZLES) {
    if (puzzleInfo['area'] != region) continue
    var option = document.createElement('option')
    try {
      option.value = Puzzle.deserialize(puzzleInfo.data).serialize()
    } catch {
      option.value = puzzleInfo.data().serialize()
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

window.onSolvedPuzzle = function(paths) {
  for (var i=0; i<paths.length; i++) {
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
  }
  function sortKey(pathA, pathB) {
    return pathA.length - pathB.length
  }

  paths.sort(sortKey)
  return paths
}
