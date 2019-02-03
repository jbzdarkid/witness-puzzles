function getPolySize(polyshape) {
  var size = 0
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (_isSet(polyshape, x, y)) size++
    }
  }
  return size
}

function _mask(x, y) {
  return 1 << (x*4 + y)
}

function _isSet(polyshape, x, y) {
  if (x < 0 || y < 0) return false
  if (x >= 4 || y >= 4) return false
  return (polyshape & _mask(x, y)) !== 0
}

ROTATION_BIT = _mask(5, 0)

function isRotated(polyshape) {
  return (polyshape & ROTATION_BIT) !== 0
}

function getRotations(polyshape) {
  if (!isRotated(polyshape)) return [polyshape]

  var rotations = [0, 0, 0, 0]
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (_isSet(polyshape, x, y)) {
        rotations[0] ^= _mask(x, y)
        rotations[1] ^= _mask(y, 3-x)
        rotations[2] ^= _mask(3-x, 3-y)
        rotations[3] ^= _mask(3-y, x)
      }
    }
  }

  return rotations
}

function fitsGrid(cells, x, y, puzzle) {
  for (var cell of cells) {
    if (cell.x + x < 0 || cell.x + x >= puzzle.grid.length) return false
    if (cell.y + y < 0 || cell.y + y >= puzzle.grid[0].length) return false
  }
  return true
}

// IMPORTANT NOTE: When formulating these, the top row must contain (0, 0)
// That means there will never be any negative y values.
// (0, 0) must also be a cell in the shape, so that
// placing the shape at (x, y) will fill (x, y)
// Ylops will have -1s on all adjacent cells, to break "overlaps" for polyominos.
function polyominoFromPolyshape(polyshape, ylop=false) {
  for (var y=0; y<4; y++) {
    for (var x=0; x<4; x++) {
      if (_isSet(polyshape, x, y)) {
        var topLeft = {'x':x, 'y':y}
        break
      }
    }
    if (topLeft != undefined) break
  }
  if (topLeft == undefined) return [] // Empty polyomino

  var polyomino = []
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (!_isSet(polyshape, x, y)) continue
      polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y)})

      if (ylop) {
        // Ylops fill up/left if no adjacent cell, and always fill bottom/right
        if (!_isSet(polyshape, x - 1, y)) {
          polyomino.push({'x':2*(x - topLeft.x) - 1, 'y':2*(y - topLeft.y)})
        }
        if (!_isSet(polyshape, x, y - 1)) {
          polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y) - 1})
        }
        polyomino.push({'x':2*(x - topLeft.x) + 1, 'y':2*(y - topLeft.y)})
        polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y) + 1})
      } else {
        // Normal polys only fill bottom/right if there is an adjacent cell.
        if (_isSet(polyshape, x + 1, y)) {
          polyomino.push({'x':2*(x - topLeft.x) + 1, 'y':2*(y - topLeft.y)})
        }
        if (_isSet(polyshape, x, y + 1)) {
          polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y) + 1})
        }
      }
    }
  }
  return polyomino
}

// @Cleanup: I don't *really* need these right now.
window.POLYOMINOS = {
  '1':[1],
  '2':[3, 17, 33, 18],
  '3':[7, 19, 22, 35, 37, 49, 50, 52, 67, 82, 97, 273, 274, 289, 290, 529, 530, 545],
  '4':[15, 23, 39, 51, 54, 71, 85, 99, 113, 114, 116, 195, 275, 305, 306, 547, 561, 562, 771, 785, 802, 4369, 4386],
  '5':[31, 47, 55, 62, 79, 87, 103, 115, 117, 118, 124, 143, 199, 227, 241, 242, 244, 248, 279, 307, 310, 369, 370, 372, 551, 563, 566, 611, 625, 626, 628, 787, 803, 806, 817, 818, 866, 868, 1095, 1123, 1137, 1138, 1140, 1571, 1585, 1586, 1809, 1826, 1860, 4371, 4401, 4402, 4881, 4898, 8739, 8753, 8754, 8977, 12561, 12834],
/* Custom polyominos */
  '6':[819],
  '9':[1911],
  '11':[32614],
}

// Attempt to fit polyominos in a region into the puzzle.
// This function checks for early exits, and cleans up the grid to a numerical representation:
// * 0 represents a square that does not need to be covered (outside the region)
// * -1 represents a square that needs to be covered once (inside the region)
// * 1 represents a square that has been double-covered (by two polyominos, e.g.)
function polyFit(region, puzzle) {
  var polys = []
  var ylops = []
  var polyCount = 0
  var regionSize = 0
  for (var pos of region.cells) {
    if (pos.x%2 === 1 && pos.y%2 === 1) regionSize++
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == undefined) continue
    if (cell.polyshape === 0) continue
    if (cell.type === 'poly') {
      polys.push(cell)
      polyCount += getPolySize(cell.polyshape)
    } else if (cell.type === 'ylop') {
      ylops.push(cell)
      polyCount -= getPolySize(cell.polyshape)
    }
  }
  if (polys.length + ylops.length === 0) {
    console.log('No polyominos or onimylops inside the region, vacuously true')
    return true
  }
  if (polyCount > 0 && polyCount !== regionSize) {
    console.log('Combined size of polyominos', polyCount, 'does not match region size', regionSize)
    return false
  }
  if (polyCount < 0) {
    console.log('More onimoylops than polyominos by', -polyCount)
    return false
  }

  // For polyominos, we clear the grid to mark it up again:
  var savedGrid = puzzle.grid
  puzzle.newGrid()
  // First, we mark all cells as 0: Cells outside the target region should be unaffected.
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      puzzle.setCell(x, y, 0)
    }
  }
  // In the normal case, we mark every cell as -1: It needs to be covered by one poly
  if (polyCount > 0) {
    for (var pos of region.cells) puzzle.setCell(pos.x, pos.y, -1)
  }
  // In the exact match case, we leave every cell marked 0: Polys and ylops need to cancel.

  var ret = _placeYlops(ylops.slice(), polys.slice(), puzzle)
  puzzle.grid = savedGrid
  return ret
}
// If false, poly doesn't fit and grid is unmodified
// If true, poly fits and grid is modified (with the placement)
function _tryPlacePolyshape(cells, x, y, puzzle, sign) {
  console.spam('Placing at', x, y, 'with sign', sign)
  for (var i=0; i<cells.length; i++) {
    var cell = puzzle.getCell(cells[i].x + x, cells[i].y + y)
    if (cell == undefined) return false
    cells[i].value = cell
  }
  for (var i=0; i<cells.length; i++) {
    puzzle.setCell(cells[i].x + x, cells[i].y + y, cells[i].value + sign)
  }
  return true
}

// Places the ylops such that they are inside of the grid, then checks if the polys
// zero the region.
function _placeYlops(ylops, polys, puzzle) {
  // Base case: No more ylops to place, start placing polys
  if (ylops.length === 0) return _placePolys(polys, puzzle)

  var ylop = ylops.pop()
  var ylopRotations = getRotations(ylop.polyshape, ylop.rot)
  for (var x=1; x<puzzle.grid.length; x+=2) {
    for (var y=1; y<puzzle.grid[x].length; y+=2) {
      console.log('Placing ylop', ylop, 'at', x, y)
      for (var polyshape of ylopRotations) {
        var cells = polyominoFromPolyshape(polyshape, true)
        if (!_tryPlacePolyshape(cells, x, y, puzzle, -1)) continue
        console.group('')
        if (_placeYlops(ylops, polys, puzzle)) return true
        console.groupEnd('')
        if (!_tryPlacePolyshape(cells, x, y, puzzle, +1)) continue
      }
    }
  }
  ylops.push(ylop)
}

// Returns whether or not a set of polyominos fit into a region.
// Solves via recursive backtracking: Some piece must fill the top left square,
// so try every piece to fill it, then recurse.
function _placePolys(polys, puzzle) {
  // Check for overlapping polyominos, and handle exit cases for all polyominos placed.
  for (var y=0; y<puzzle.grid[0].length; y++) {
    for (var x=0; x<puzzle.grid.length; x++) {
      var cell = puzzle.getCell(x, y)
      if (cell > 0) {
        console.log('Cell', x, y, 'has been overfilled and no ylops left to place')
        return false
      }
      if (x%2 === 1 && y%2 === 1 && cell < 0 && polys.length === 0) {
        // Normal, center cell with a negative value & no polys remaining.
        console.log('All polys placed, but grid not full')
        return false
      }
    }
  }
  if (polys.length === 0) {
    console.log('All polys placed, and grid full')
    return true
  }

  // The top-left (first open cell) must be filled by a polyomino.
  // However in the case of pillars, there is no top-left, so we try all open cells in the
  // top-most open row
  var openCells = []
  for (var y=1; y<puzzle.grid[0].length; y+=2) {
    for (var x=1; x<puzzle.grid.length; x+=2) {
      if (puzzle.getCell(x, y) >= 0) continue
      openCells.push({'x':x, 'y':y})
      if (puzzle.pillar === false) break
    }
    if (openCells.length > 0) break
  }

  if (openCells.length === 0) {
    console.log('Polys remaining but grid full')
    return false
  }

  for (var openCell of openCells) {
    for (var i=0; i<polys.length; i++) {
      var poly = polys.splice(i, 1)[0]
      console.spam('Selected poly', poly)
      for (var polyshape of getRotations(poly.polyshape, poly.rot)) {
        var cells = polyominoFromPolyshape(polyshape)
        if (!_tryPlacePolyshape(cells, openCell.x, openCell.y, puzzle, +1)) continue
        console.group('')
        if (_placePolys(polys, puzzle)) return true
        console.groupEnd('')
        if (!_tryPlacePolyshape(cells, openCell.x, openCell.y, puzzle, -1)) continue
      }
      polys.splice(i, 0, poly)
    }
  }
  console.log('Grid non-empty with >0 polys, but no valid recursion.')
  return false
}

function _logPolyGrid(puzzle) {
  var output = ''
  for (var y=0; y<puzzle.grid[0].length; y++) {
    for (var x=0; x<puzzle.grid.length; x++) {
      var cell = puzzle.grid[x][y]
      if (cell === -1) output += '-'
      if (cell === 0) output += '0'
      if (cell === 1) output += '1'
    }
    output += '\n'
  }
  console.log(output)
}
