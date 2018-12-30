// Settings (todo: Expose to the user/puzzlemaker?)
window.NEGATIONS_CANCEL_NEGATIONS = true

// Puzzle = {grid, start, end, dots, gaps}
// Determines if the current grid state is solvable. Modifies the puzzle element with:
// valid: Whether or not the puzzle is valid
// negations: Negation symbols and their targets (for the purpose of darkening)
// invalidElements: Symbols which are invalid (for the purpose of flashing)
function validate(puzzle) {
  console.log('Validating', puzzle)
  puzzle.valid = true // Assume valid until we find an invalid element
  puzzle.invalidElements = []
  puzzle.negations = []

  // Perf optimization: We can skip iterating regions if the grid has no symbols.
  var puzzleHasSymbols = false
  for (var x=1; x<puzzle.grid.length; x+=2) {
    for (var y=1; y<puzzle.grid[x].length; y+=2) {
      var cell = puzzle.getCell(x, y)
      if (cell != undefined && cell.type != undefined) {
        puzzleHasSymbols = true
        break
      }
    }
  }

  if (!puzzleHasSymbols) {
    // Only things to validate are gaps and dots
    for (var gap of puzzle.gaps) {
      if (puzzle.getLine(gap.x, gap.y) > 0) {
        console.log('Gap at grid['+gap.x+']['+gap.y+'] is covered')
        puzzle.valid = false
        break
      }
    }
    for (var dot of puzzle.dots) {
      if (puzzle.getLine(dot.x, dot.y) >= 1) continue
      console.log('Dot at', dot.x, dot.y, 'is not covered')
      puzzle.invalidElements.push(dot)
      puzzle.valid = false
    }
  } else {
    // Check that individual regions are valid
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
        regionData.valid = (regionData.invalidElements.length == 0)
        console.log('Region valid:', regionData.valid)

        if (!window.DISABLE_CACHE) {
          puzzle.regionCache[key] = regionData
        }
      }
      puzzle.negations = puzzle.negations.concat(regionData.negations)
      puzzle.invalidElements = puzzle.invalidElements.concat(regionData.invalidElements)
      puzzle.valid &= regionData.valid
    }
  }
  console.log('Puzzle has', puzzle.invalidElements.length, 'invalid elements')
}

function _regionCheckNegations(puzzle, region) {
  // Get a list of negation symbols in the grid, and set them to 'nonce'
  var negationSymbols = []
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell != undefined && cell.type == 'nega') {
      cell.type = 'nonce'
      puzzle.setCell(pos.x, pos.y, cell)
      negationSymbols.push({'x':pos.x, 'y':pos.y, 'cell':cell})
    }
  }
  console.log('Found negation symbols:', negationSymbols)
  // Get a list of elements that are currently invalid (before any negations are applied)
  var invalidElements = _regionCheck(puzzle, region)
  console.log('Negation-less regioncheck returned invalid elements:', JSON.stringify(invalidElements))
  // Set 'nonce' back to 'nega' for the negation symbols
  for (var nega of negationSymbols) {
    nega.cell.type = 'nega'
    puzzle.setCell(nega.x, nega.y, nega.cell)
  }

  // If there are not enough elements to pair, return
  if (negationSymbols.length == 0 ||
     (invalidElements.length == 0 && (negationSymbols.length < 2 || !window.NEGATIONS_CANCEL_NEGATIONS))) {
    console.log('Not enough elements left to create a pair')
    invalidElements = invalidElements.concat(negationSymbols)
    return {'invalidElements':invalidElements, 'negations':[]}
  }
  // Else, there are invalid elements and negations, try to pair them up
  var source = negationSymbols[0]
  puzzle.setCell(source.x, source.y, null)
  console.log('Using negation symbol at', source.x, source.y)

  // Logic is duplicate of below
  if (window.NEGATIONS_CANCEL_NEGATIONS) {
    for (var i=1; i<negationSymbols.length; i++) {
      var target = negationSymbols[i]
      puzzle.setCell(target.x, target.y, null)
      console.log('Negating other negation symbol at', target.x, target.y)
      var regionData = _regionCheckNegations(puzzle, region)
      puzzle.setCell(target.x, target.y, target.cell)

      if (regionData.invalidElements.length == 0) {
        console.log('Negation pair valid')
        // Restore negation symbol, add to list of negation pairs
        puzzle.setCell(source.x, source.y, source.cell)
        regionData.negations.push({'source':source, 'target':target})
        return regionData
      }
    }
  }

  for (var invalidElement of invalidElements) {
    invalidElement.cell = puzzle.getCell(invalidElement.x, invalidElement.y)
    puzzle.setCell(invalidElement.x, invalidElement.y, null)
    console.log('Negating other symbol at', invalidElement.x, invalidElement.y)
    // Remove the negation and target, then recurse
    var regionData = _regionCheckNegations(puzzle, region)
    // Restore the target
    puzzle.setCell(invalidElement.x, invalidElement.y, invalidElement.cell)

    // No invalid elements after negation is applied, so the region validates
    if (regionData.invalidElements.length == 0) {
      console.log('Negation pair valid')
      // Restore negation symbol, add to list of negation pairs
      puzzle.setCell(source.x, source.y, source.cell)
      regionData.negations.push({'source':source, 'target':invalidElement})
      return regionData
    }
  }

  console.log('All pairings failed')
  // All negation pairings failed, select one possible pairing and return it
  // FIXME: Random? This is currently the last possible negation
  puzzle.setCell(source.x, source.y, source.cell)
  return regionData
}

// Checks if a region (series of cells) is valid.
// Since the path must be complete at this point, returns only true or false
function _regionCheck(puzzle, region) {
  console.log('Validating region', region)
  var invalidElements = []

  // @Cleanup: This needs to be an early exit -- maybe this should throw? Or maybe I just shouldn't check it at all...
  // Check that all gaps are not covered
  // FIXME: Check for invalid gap placement?
  for (var gap of puzzle.gaps) {
    if (puzzle.getLine(gap.x, gap.y) > 0) {
      console.log('Gap at grid['+gap.x+']['+gap.y+'] is covered')
      puzzle.valid = false
    }
  }

  // Check that all dots are covered
  // FIXME: Check for invalid dot placement?
  // TODO: Don't iterate all dots once they're in the grid :)
  for (var cell of region.cells) {
    for (var dot of puzzle.dots) {
      if (dot.x == cell.x && dot.y == cell.y) {
        if (puzzle.getLine(dot.x, dot.y) >= 1) break
        console.log('Dot at', dot.x, dot.y, 'is not covered')
        invalidElements.push(dot)
      }
    }
  }

  // Check for triangles
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell != undefined && cell.type == 'triangle') {
      var count = 0
      if (puzzle.getLine(pos.x - 1, pos.y) > 0) count++
      if (puzzle.getLine(pos.x + 1, pos.y) > 0) count++
      if (puzzle.getLine(pos.x, pos.y - 1) > 0) count++
      if (puzzle.getLine(pos.x, pos.y + 1) > 0) count++
      if (cell.count != count) {
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
    if (cell.type == 'square') {
      squareColors[cell.color] = true
    }
  }
  var squareColorCount = Object.keys(squareColors).length

  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == undefined) continue
    if (cell.type == 'square') {
      if (squareColorCount > 1) {
        console.log('Found a', cell.color, 'square in a region with', squareColorCount, 'square colors')
        invalidElements.push(pos)
      }
    } else if (cell.type == 'star') {
      if (coloredObjects[cell.color] != 2) {
        console.log('Found a', cell.color, 'star in a region with', coloredObjects[cell.color], cell.color, 'objects')
        invalidElements.push(pos)
      }
    }
  }

  if (!_polyWrapper(region, puzzle)) {
    for (var pos of region.cells) {
      var cell = puzzle.getCell(pos.x, pos.y)
      if (cell == undefined) continue
      if (cell.type == 'poly' || cell.type == 'ylop') {
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
    if (cell.polyshape == 0) continue
    if (cell.type == 'poly') {
      polys.push(cell)
      polyCount += getPolySize(cell.polyshape)
    } else if (cell.type == 'ylop') {
      ylops.push(cell)
      polyCount -= getPolySize(cell.polyshape)
    }
  }
  var regionSize = 0
  for (var pos of region.cells) {
    if (pos.x%2 == 1 && pos.y%2 == 1) regionSize++
  }

  if (polys.length + ylops.length == 0) {
    console.log('No polyominos or onimylops inside the region, vacuously true')
    return true
  }
  if (polyCount > 0 && polyCount != regionSize) {
    console.log('Combined size of polyominos', polyCount, 'does not match region size', regionSize)
    return false
  }

  // For polyominos, we clear the grid to mark it up again:
  var copy = puzzle.clone()
  if (polyCount < 0) {
    // This is an early exit, if there's bad counts.
    console.log('More onimoylops than polyominos by', -polyCount)
    return false
  }
  // First, we mark all cells as 0: Cells outside the target region should be unaffected.
  for (var x=0; x<copy.grid.length; x++) {
    for (var y=0; y<copy.grid[x].length; y++) {
      copy.setCell(x, y, 0)
    }
  }
  // In the normal case, we mark every cell as -1: It needs to be covered by one poly
  if (polyCount > 0) {
    for (var cell of region.cells) copy.setCell(cell.x, cell.y, -1)
  }
  // In the exact match case, we leave every cell marked 0: Polys and ylops need to cancel.

  return _ylopFit(ylops.slice(), polys.slice(), copy)
}

// Places the ylops such that they are inside of the grid, then checks if the polys
// zero the region.
function _ylopFit(ylops, polys, puzzle) {
  if (ylops.length == 0) return _polyFit(polys, puzzle)
  var ylop = ylops.pop()
  var ylopRotations = getRotations(ylop.polyshape, ylop.rot)
  for (var x=1; x<puzzle.grid.length; x+=2) {
    for (var y=1; y<puzzle.grid[x].length; y+=2) {
      console.log('Placing ylop', ylop, 'at', x, y)
      for (var polyshape of ylopRotations) {
        var cells = polyominoFromPolyshape(polyshape, true)
        if (!fitsGrid(cells, x, y, puzzle)) continue
        for (var cell of cells) puzzle.grid[cell.x + x][cell.y + y]--
        if (_ylopFit(ylops, polys, puzzle)) return true
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
        console.log('Cell has been overfilled and no negations left to place')
        return false
      }
      if (x%2 == 1 && y%2 == 1 && cell < 0 && polys.length == 0) {
        // Normal, center cell with a negative value & no polys remaining.
        console.log('All polys placed, but grid not full')
        return false
      }
    }
  }
  if (polys.length == 0) {
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
    for (var polyshape of getRotations(poly.polyshape, poly.rot)) {
      var cells = polyominoFromPolyshape(polyshape)
      if (!fitsGrid(cells, pos.x, pos.y, puzzle)) continue
      console.spam('Placing at', pos.x, pos.y)
      for (var cell of cells) puzzle.grid[cell.x + pos.x][cell.y + pos.y]++
      if (_polyFit(polys, puzzle)) return true
      for (var cell of cells) puzzle.grid[cell.x + pos.x][cell.y + pos.y]--
    }
    polys.splice(i, 0, poly)
  }
  console.log('Grid non-empty with >0 polys, but no valid recursion.')
  return false
}
