// Settings (todo: Expose to the user/puzzlemaker?)
window.NEGATIONS_CANCEL_NEGATIONS = true

// Determines if the current grid state is solvable. Modifies the puzzle element with:
// valid: Whether or not the puzzle is valid
// invalidElements: Symbols which are invalid (for the purpose of negating / flashing)
// negations: Negation symbols and their targets (for the purpose of darkening)
// @Performance: Consider implementing a "no-ui/silent" validation mode which exits after the first error.
function validate(puzzle) {
  console.log('Validating', puzzle)
  puzzle.valid = true // Assume valid until we find an invalid element
  puzzle.invalidElements = []
  puzzle.negations = []

  var puzzleHasSymbols = false
  var puzzleHasStart = false
  var puzzleHasEnd = false
  // Validate gap failures as an early exit.
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined) continue
      if (cell.type === 'line') {
        if (cell.gap > 0 && cell.color > 0) {
          console.log('Gap at', x, y, 'is covered')
          puzzle.valid = false
        }
        if (cell.dot > 0) {
          if (cell.color === 0) {
            console.log('Dot at', x, y, 'is not covered')
            puzzle.invalidElements.push({'x':x, 'y':y})
          } else if (cell.color === 2 && cell.dot === 3) {
            console.log('Yellow dot at', x, y, 'is covered by blue line')
            puzzle.valid = false
          } else if (cell.color === 3 && cell.dot === 2) {
            console.log('Blue dot at', x, y, 'is covered by yellow line')
            puzzle.valid = false
          }
        }
        if (cell.start === true && cell.color !== 0) puzzleHasStart = true
        if (cell.end != undefined && cell.color !== 0) puzzleHasEnd = true
      } else if (cell.type != undefined) {
        // Perf optimization: We can skip computing regions if the grid has no symbols.
        puzzleHasSymbols = true
      }
    }
  }
  if (!puzzleHasStart || !puzzleHasStart) {
    console.log('There is no covered start or endpoint')
    puzzle.valid = false
  }

  if (!puzzleHasSymbols) { // No additional symbols, and we already checked dots & gaps
    puzzle.valid = puzzle.valid && (puzzle.invalidElements.length === 0)
  } else { // Additional symbols, so we need to discard dots & divide them by region
    puzzle.invalidElements = []
    var regions = puzzle.getRegions()
    console.log('Found', regions.length, 'regions')
    console.debug(regions)

    for (var region of regions) {
      var key = region.grid.toString()
      var regionData = puzzle.regionCache[key]
      if (regionData == undefined) {
        console.log('Cache miss for region', region, 'key', key)
        regionData = _regionCheckNegations(puzzle, region)
        // Entirely for convenience
        regionData.valid = (regionData.invalidElements.length === 0)
        console.log('Region valid:', regionData.valid)

        if (!window.DISABLE_CACHE) {
          puzzle.regionCache[key] = regionData
        }
      }
      puzzle.negations = puzzle.negations.concat(regionData.negations)
      puzzle.invalidElements = puzzle.invalidElements.concat(regionData.invalidElements)
      puzzle.valid = puzzle.valid && regionData.valid
    }
  }
  console.log('Puzzle has', puzzle.invalidElements.length, 'invalid elements')
}

function _regionCheckNegations(puzzle, region) {
  // Get a list of negation symbols in the grid, and set them to 'nonce'
  var negationSymbols = []
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell != undefined && cell.type === 'nega') {
      cell.type = 'nonce'
      puzzle.setCell(pos.x, pos.y, cell)
      negationSymbols.push({'x':pos.x, 'y':pos.y, 'cell':cell})
    }
  }
  console.debug('Found negation symbols:', JSON.stringify(negationSymbols))
  // Get a list of elements that are currently invalid (before any negations are applied)
  var invalidElements = _regionCheck(puzzle, region)
  console.log('Negation-less regioncheck returned invalid elements:', JSON.stringify(invalidElements))
  // Set 'nonce' back to 'nega' for the negation symbols
  for (var nega of negationSymbols) {
    nega.cell.type = 'nega'
    puzzle.setCell(nega.x, nega.y, nega.cell)
  }

  // If there are not enough elements to pair, return
  if (negationSymbols.length === 0 ||
     (invalidElements.length === 0 && (negationSymbols.length < 2 || !window.NEGATIONS_CANCEL_NEGATIONS))) {
    console.debug('Not enough elements left to create a pair')
    invalidElements = invalidElements.concat(negationSymbols)
    return {'invalidElements':invalidElements, 'negations':[]}
  }
  // Else, there are invalid elements and negations, try to pair them up
  var source = negationSymbols[0]
  puzzle.setCell(source.x, source.y, null)
  console.spam('Using negation symbol at', source.x, source.y)

  if (window.NEGATIONS_CANCEL_NEGATIONS) {
    for (var i=1; i<negationSymbols.length; i++) {
      invalidElements.unshift(negationSymbols[i])
    }
  }
  for (var invalidElement of invalidElements) {
    invalidElement.cell = puzzle.getCell(invalidElement.x, invalidElement.y)
    console.spam('Negating', invalidElement.cell, 'at', invalidElement.x, invalidElement.y)

    // Remove the negation and target, then recurse
    puzzle.setCell(invalidElement.x, invalidElement.y, null)
    console.group()
    var regionData = _regionCheckNegations(puzzle, region)
    console.groupEnd()
    // Restore the target
    puzzle.setCell(invalidElement.x, invalidElement.y, invalidElement.cell)

    // No invalid elements after negation is applied, so the region validates
    if (regionData.invalidElements.length === 0) {
      console.spam('Negation pair valid')
      // Restore negation symbol, add to list of negation pairs
      puzzle.setCell(source.x, source.y, source.cell)
      regionData.negations.push({'source':source, 'target':invalidElement})
      return regionData
    }
  }

  console.spam('All pairings failed, returning last attempted negation')
  regionData.negations.push({'source':source, 'target':invalidElement})
  puzzle.setCell(source.x, source.y, source.cell)
  return regionData
}

// Checks if a region (series of cells) is valid.
// Since the path must be complete at this point, returns only true or false
// @Performance: We're iterating region.cells a bunch of times, these loops could be merged
function _regionCheck(puzzle, region) {
  console.log('Validating region', region)
  var invalidElements = []

  // Check for uncovered dots
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == undefined || cell.type !== 'line') continue
    if (cell.dot > 0) {
      console.log('Dot at', pos.x, pos.y, 'is not covered')
      invalidElements.push(pos)
    }
  }

  // Check for triangles
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell != undefined && cell.type === 'triangle') {
      var count = 0
      if (puzzle.getLine(pos.x - 1, pos.y) > 0) count++
      if (puzzle.getLine(pos.x + 1, pos.y) > 0) count++
      if (puzzle.getLine(pos.x, pos.y - 1) > 0) count++
      if (puzzle.getLine(pos.x, pos.y + 1) > 0) count++
      if (cell.count !== count) {
        console.log('Triangle at grid['+pos.x+']['+pos.y+'] has', count, 'borders')
        invalidElements.push(pos)
      }
    }
  }

  // Check for color-based elements
  var coloredObjects = {}
  var squareColors = {}
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == undefined) continue
    if (coloredObjects[cell.color] == undefined) {
      coloredObjects[cell.color] = 0
    }
    coloredObjects[cell.color]++
    if (cell.type === 'square') {
      squareColors[cell.color] = true
    }
  }
  var squareColorCount = Object.keys(squareColors).length

  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == undefined) continue
    if (cell.type === 'square') {
      if (squareColorCount > 1) {
        console.log('Found a', cell.color, 'square in a region with', squareColorCount, 'square colors')
        invalidElements.push(pos)
      }
    } else if (cell.type === 'star') {
      if (coloredObjects[cell.color] !== 2) {
        console.log('Found a', cell.color, 'star in a region with', coloredObjects[cell.color], cell.color, 'objects')
        invalidElements.push(pos)
      }
    }
  }

  if (!_polyWrapper(region, puzzle)) {
    for (var pos of region.cells) {
      var cell = puzzle.getCell(pos.x, pos.y)
      if (cell == undefined) continue
      if (cell.type === 'poly' || cell.type === 'ylop') {
        invalidElements.push(pos)
      }
    }
  }
  console.log('Region has', invalidElements.length, 'invalid elements')
  return invalidElements
}

function _polyWrapper(region, puzzle) {
  var polys = []
  var ylops = []
  var polyCount = 0
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == undefined) continue
    if (cell.polyshape === 0) continue
    if (cell.type === 'poly') {
      polys.push(cell)
      polyCount += window.getPolySize(cell.polyshape)
    } else if (cell.type === 'ylop') {
      ylops.push(cell)
      polyCount -= window.getPolySize(cell.polyshape)
    }
  }
  var regionSize = 0
  for (var pos of region.cells) {
    if (pos.x%2 === 1 && pos.y%2 === 1) regionSize++
  }

  if (polys.length + ylops.length === 0) {
    console.log('No polyominos or onimylops inside the region, vacuously true')
    return true
  }
  if (polyCount > 0 && polyCount !== regionSize) {
    console.log('Combined size of polyominos', polyCount, 'does not match region size', regionSize)
    return false
  }

  // For polyominos, we clear the grid to mark it up again:
  if (polyCount < 0) {
    // This is an early exit, if there's bad counts.
    console.log('More onimoylops than polyominos by', -polyCount)
    return false
  }

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
    for (var cell of region.cells) puzzle.setCell(cell.x, cell.y, -1)
  }
  // In the exact match case, we leave every cell marked 0: Polys and ylops need to cancel.

  var ret = _ylopFit(ylops.slice(), polys.slice(), puzzle)
  puzzle.grid = savedGrid
  return ret
}

// Places the ylops such that they are inside of the grid, then checks if the polys
// zero the region.
function _ylopFit(ylops, polys, puzzle) {
  if (ylops.length === 0) return _polyFit(polys, puzzle)
  var ylop = ylops.pop()
  var ylopRotations = window.getRotations(ylop.polyshape, ylop.rot)
  for (var x=1; x<puzzle.grid.length; x+=2) {
    for (var y=1; y<puzzle.grid[x].length; y+=2) {
      console.log('Placing ylop', ylop, 'at', x, y)
      for (var polyshape of ylopRotations) {
        var cells = window.polyominoFromPolyshape(polyshape, true)
        if (!window.fitsGrid(cells, x, y, puzzle)) continue
        for (var cell of cells) puzzle.grid[cell.x + x][cell.y + y]--
        console.group()
        if (_ylopFit(ylops, polys, puzzle)) return true
        console.groupEnd()
        for (var cell of cells) puzzle.grid[cell.x + x][cell.y + y]++
      }
    }
  }
  ylops.push(ylop)
}

// Returns whether or not a set of polyominos fit into a region.
// Solves via recursive backtracking: Some piece must fill the top left square,
// so try every piece to fill it, then recurse.
function _polyFit(polys, puzzle) {
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

  // TODO: Might be a bit of perf to pass pos around, rather than rediscover?
  var pos = {'x':1, 'y':1}
  // Find the next open cell
  while (puzzle.getCell(pos.x, pos.y) >= 0) {
    pos.x += 2
    if (pos.x >= puzzle.grid.length) {
      pos.x = 1
      pos.y += 2
    }
    if (pos.y >= puzzle.grid[0].length) {
      console.log('Polys remaining but grid full')
      return false
    }
  }

  for (var i=0; i<polys.length; i++) {
    var poly = polys.splice(i, 1)[0]
    console.spam('Selected poly', poly)
    for (var polyshape of window.getRotations(poly.polyshape, poly.rot)) {
      var cells = window.polyominoFromPolyshape(polyshape)
      if (!window.fitsGrid(cells, pos.x, pos.y, puzzle)) continue
      console.spam('Placing at', pos.x, pos.y)
      for (var cell of cells) puzzle.grid[cell.x + pos.x][cell.y + pos.y]++
      console.group('')
      if (_polyFit(polys, puzzle)) return true
      console.groupEnd('')
      for (var cell of cells) puzzle.grid[cell.x + pos.x][cell.y + pos.y]--
    }
    polys.splice(i, 0, poly)
  }
  console.log('Grid non-empty with >0 polys, but no valid recursion.')
  return false
}
