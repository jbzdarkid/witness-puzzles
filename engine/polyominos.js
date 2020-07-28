namespace(function() {

function getPolySize(polyshape) {
  var size = 0
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (isSet(polyshape, x, y)) size++
    }
  }
  return size
}

function mask(x, y) {
  return 1 << (x*4 + y)
}

function isSet(polyshape, x, y) {
  if (x < 0 || y < 0) return false
  if (x >= 4 || y >= 4) return false
  return (polyshape & mask(x, y)) !== 0
}

ROTATION_BIT = mask(5, 0)

window.isRotated = function(polyshape) {
  return (polyshape & ROTATION_BIT) !== 0
}

function getRotations(polyshape) {
  if (!isRotated(polyshape)) return [polyshape]

  var rotations = [0, 0, 0, 0]
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (isSet(polyshape, x, y)) {
        rotations[0] ^= mask(x, y)
        rotations[1] ^= mask(y, 3-x)
        rotations[2] ^= mask(3-x, 3-y)
        rotations[3] ^= mask(3-y, x)
      }
    }
  }

  return rotations
}

function fitsGrid(cells, x, y, puzzle) {
  for (var cell of cells) {
    if (cell.x + x < 0 || cell.x + x >= puzzle.width) return false
    if (cell.y + y < 0 || cell.y + y >= puzzle.height) return false
  }
  return true
}

// IMPORTANT NOTE: When formulating these, the top row must contain (0, 0)
// That means there will never be any negative y values.
// (0, 0) must also be a cell in the shape, so that
// placing the shape at (x, y) will fill (x, y)
// Ylops will have -1s on all adjacent cells, to break "overlaps" for polyominos.
window.polyominoFromPolyshape = function(polyshape, ylop=false) {
  for (var y=0; y<4; y++) {
    for (var x=0; x<4; x++) {
      if (isSet(polyshape, x, y)) {
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
      if (!isSet(polyshape, x, y)) continue
      polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y)})

      // "Precise" polyominos adds cells in between the apparent squares in the polyomino.
      // This prevents the solution line from going through polyominos in the solution.
      if (window.PRECISE_POLYOMINOS) {
        if (ylop) {
          // Ylops fill up/left if no adjacent cell, and always fill bottom/right
          if (!isSet(polyshape, x - 1, y)) {
            polyomino.push({'x':2*(x - topLeft.x) - 1, 'y':2*(y - topLeft.y)})
          }
          if (!isSet(polyshape, x, y - 1)) {
            polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y) - 1})
          }
          polyomino.push({'x':2*(x - topLeft.x) + 1, 'y':2*(y - topLeft.y)})
          polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y) + 1})
        } else {
          // Normal polys only fill bottom/right if there is an adjacent cell.
          if (isSet(polyshape, x + 1, y)) {
            polyomino.push({'x':2*(x - topLeft.x) + 1, 'y':2*(y - topLeft.y)})
          }
          if (isSet(polyshape, x, y + 1)) {
            polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y) + 1})
          }
        }
      }
    }
  }
  return polyomino
}

// Attempt to fit polyominos in a region into the puzzle.
// This function checks for early exits, and cleans up the grid to a numerical representation:
// * 0 represents a square that does not need to be covered (outside the region)
// * -1 represents a square that needs to be covered once (inside the region)
// * 1 represents a square that has been double-covered (by two polyominos, e.g.)
window.polyFit = function(region, puzzle) {
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
    console.log('Combined size of polyominos and onimoylops', polyCount, 'does not match region size', regionSize)
    return false
  }
  if (polyCount === 0 && window.SHAPELESS_ZERO_POLY) {
    console.log('Combined size of polyominos and onimoylops is zero')
    return true
  }
  if (polyCount < 0) {
    console.log('Combined size of onimoylops is greater than polyominos by', -polyCount)
    return false
  }

  // For polyominos, we clear the grid to mark it up again:
  var savedGrid = puzzle.grid
  puzzle.newGrid()
  // First, we mark all cells as 0: Cells outside the target region should be unaffected.
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      puzzle.setCell(x, y, 0)
    }
  }
  // In the normal case, we mark every cell as -1: It needs to be covered by one poly
  if (polyCount > 0) {
    for (var pos of region.cells) puzzle.setCell(pos.x, pos.y, -1)
  }
  // In the exact match case, we leave every cell marked 0: Polys and ylops need to cancel.

  var ret = placeYlops(ylops.slice(), polys.slice(), puzzle)
  puzzle.grid = savedGrid
  return ret
}

// If false, poly doesn't fit and grid is unmodified
// If true, poly fits and grid is modified (with the placement)
function tryPlacePolyshape(cells, x, y, puzzle, sign) {
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
function placeYlops(ylops, polys, puzzle) {
  // Base case: No more ylops to place, start placing polys
  if (ylops.length === 0) return placePolys(polys, puzzle)

  var ylop = ylops.pop()
  var ylopRotations = getRotations(ylop.polyshape, ylop.rot)
  for (var x=1; x<puzzle.width; x+=2) {
    for (var y=1; y<puzzle.height; y+=2) {
      console.log('Placing ylop', ylop, 'at', x, y)
      for (var polyshape of ylopRotations) {
        var cells = polyominoFromPolyshape(polyshape, true)
        if (!tryPlacePolyshape(cells, x, y, puzzle, -1)) continue
        console.group('')
        if (placeYlops(ylops, polys, puzzle)) return true
        console.groupEnd('')
        if (!tryPlacePolyshape(cells, x, y, puzzle, +1)) continue
      }
    }
  }
  ylops.push(ylop)
}

// Returns whether or not a set of polyominos fit into a region.
// Solves via recursive backtracking: Some piece must fill the top left square,
// so try every piece to fill it, then recurse.
function placePolys(polys, puzzle) {
  // Check for overlapping polyominos, and handle exit cases for all polyominos placed.
  for (var y=0; y<puzzle.height; y++) {
    for (var x=0; x<puzzle.width; x++) {
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
  for (var y=1; y<puzzle.height; y+=2) {
    for (var x=1; x<puzzle.width; x+=2) {
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
    var attemptedPolyshapes = []
    for (var i=0; i<polys.length; i++) {
      console.spam('Selected poly', polys[i])
      if (attemptedPolyshapes.includes(polys[i].polyshape)) {
        console.spam('Polyshape', polys[i].polyshape, 'has already been attempted')
        continue
      }
      var poly = polys.splice(i, 1)[0]
      attemptedPolyshapes.push(poly.polyshape)
      for (var polyshape of getRotations(poly.polyshape, poly.rot)) {
        console.spam('Selected polyshape', polyshape)
        var cells = polyominoFromPolyshape(polyshape)
        if (!tryPlacePolyshape(cells, openCell.x, openCell.y, puzzle, +1)) {
          console.spam('Polyshape', polyshape, 'does not fit into', openCell.x, openCell.y)
          continue
        }
        console.group('')
        if (placePolys(polys, puzzle)) return true
        console.groupEnd('')
        // Should not fail, as it's an inversion of the above tryPlacePolyshape
        tryPlacePolyshape(cells, openCell.x, openCell.y, puzzle, -1)
      }
      polys.splice(i, 0, poly)
    }
  }
  console.log('Grid non-empty with >0 polys, but no valid recursion.')
  return false
}

})