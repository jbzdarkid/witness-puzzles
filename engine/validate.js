// Validation settings
window.NEGATIONS_CANCEL_NEGATIONS = true
window.SHAPELESS_ZERO_POLY = true
window.PRECISE_POLYOMINOS = true

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
      if (['square', 'star', 'nega', 'poly', 'ylop'].includes(cell.type)) {
        puzzleHasSymbols = true
        continue
      }
      if (cell.type === 'triangle') {
        var count = 0
        if (puzzle.getLine(x - 1, y) > 0) count++
        if (puzzle.getLine(x + 1, y) > 0) count++
        if (puzzle.getLine(x, y - 1) > 0) count++
        if (puzzle.getLine(x, y + 1) > 0) count++
        if (cell.count !== count) {
          console.log('Triangle at grid['+x+']['+y+'] has', count, 'borders')
          puzzle.invalidElements.push({'x':x, 'y':y})
        }
      }
      // TODO: Obvious cleanup: Write a helper function for each individual type?
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
      if (cell.color !== 0) {
        if (cell.start === true) puzzleHasStart = true
        if (cell.end != undefined) puzzleHasEnd = true
      }
    }
  }
  if (!puzzleHasStart || !puzzleHasEnd) {
    console.log('There is no covered start or endpoint')
    puzzle.valid = false
  }

  // Perf optimization: We can skip computing regions if the grid has no symbols.
  if (!puzzleHasSymbols) {
    // No complex symbols in the puzzle (i.e. symbols which require a region to determine)
    // We have checked for dots, triangles, and gaps, but they are not 'symbols' in that sense.
    puzzle.valid = puzzle.valid && (puzzle.invalidElements.length === 0)
  } else {
    // Additional symbols, so we need to discard computation & divide the puzzle by regions
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
  var regionData = _regionCheck(puzzle, region)
  var invalidElements = regionData.veryInvalidElements.concat(regionData.invalidElements)
  console.log('Negation-less regioncheck returned invalid elements:', JSON.stringify(invalidElements))
  // Set 'nonce' back to 'nega' for the negation symbols
  for (var nega of negationSymbols) {
    nega.cell.type = 'nega'
    puzzle.setCell(nega.x, nega.y, nega.cell)
  }

  // If there are not enough elements to pair, return
  if (negationSymbols.length === 0 ||
     (invalidElements.length === 0 && (negationSymbols.length < 2 || !window.NEGATIONS_CANCEL_NEGATIONS))) {
    console.debug('Not enough elements left to create a negation pair')
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
function _regionCheck(puzzle, region) {
  console.log('Validating region', region)
  var veryInvalidElements = []
  var invalidElements = []

  var coloredObjects = {}
  var squareColors = {}
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == undefined) continue

    // Check for uncovered dots
    if (cell.dot > 0) {
      console.log('Dot at', pos.x, pos.y, 'is not covered')
      veryInvalidElements.push(pos)
    }

    // Check for triangles
    if (cell.type === 'triangle') {
      var count = 0
      if (puzzle.getLine(pos.x - 1, pos.y) > 0) count++
      if (puzzle.getLine(pos.x + 1, pos.y) > 0) count++
      if (puzzle.getLine(pos.x, pos.y - 1) > 0) count++
      if (puzzle.getLine(pos.x, pos.y + 1) > 0) count++
      if (cell.count !== count) {
        console.log('Triangle at grid['+pos.x+']['+pos.y+'] has', count, 'borders')
        veryInvalidElements.push(pos)
      }
    }

    // Count color-based elements
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
      if (coloredObjects[cell.color] === 1) {
        console.log('Found a', cell.color, 'star in a region with 1', cell.color, 'object')
        veryInvalidElements.push(pos)
      } else if (coloredObjects[cell.color] > 2) {
        console.log('Found a', cell.color, 'star in a region with', coloredObjects[cell.color], cell.color, 'objects')
        invalidElements.push(pos)
      }
    }
  }

  if (!window.polyFit(region, puzzle)) {
    for (var pos of region.cells) {
      var cell = puzzle.getCell(pos.x, pos.y)
      if (cell == undefined) continue
      if (cell.type === 'poly' || cell.type === 'ylop') {
        invalidElements.push(pos)
      }
    }
  }
  console.log('Region has', veryInvalidElements.length, 'invalid elements:', JSON.stringify(veryInvalidElements))
  console.log('Region has', invalidElements.length, 'very invalid elements:', JSON.stringify(invalidElements))
  return {
    'veryInvalidElements': veryInvalidElements,
    'invalidElements': invalidElements,
    'valid': invalidElements.length === 0 && veryInvalidElements === 0
  }
}
