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

  // @Perf: This could potentially be pre-computed. Not that running through the grid is *that* expensive...
  var puzzleHasSymbols = false
  var puzzleHasStart = false
  var puzzleHasEnd = false
  var puzzleHasNegations = false
  // Validate gap failures as an early exit.
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined) continue
      if (['square', 'star', 'poly', 'ylop'].includes(cell.type)) {
        puzzleHasSymbols = true
        continue
      }
      if (cell.type === 'nega') {
        puzzleHasNegations = true
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
    puzzle.valid &= (puzzle.invalidElements.length === 0)
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
        if (puzzleHasNegations) {
          regionData = _regionCheckNegations(puzzle, region)
        } else {
          regionData = _regionCheck(puzzle, region)
        }
        console.log('Region valid:', regionData.valid)

        if (!window.DISABLE_CACHE) {
          puzzle.regionCache[key] = regionData
        }
      }
      puzzle.negations = puzzle.negations.concat(regionData.negations)
      puzzle.invalidElements = puzzle.invalidElements.concat(regionData.invalidElements)
      puzzle.invalidElements = puzzle.invalidElements.concat(regionData.veryInvalidElements)
      puzzle.valid &= regionData.valid
    }
  }
  console.log('Puzzle has', puzzle.invalidElements.length, 'invalid elements')
}

function _regionCheckNegations2(puzzle, region, negationSymbols, invalidElements, index=0, index2=0) {
  if (index2 >= negationSymbols.length) {
    console.debug('0 negation symbols left, returning negation-less regionCheck')
    return _regionCheck(puzzle, region)
  }

  if (index >= invalidElements.length) {
    var i = index2
    // pair off all negation symbols, 2 at a time
    if (window.NEGATIONS_CANCEL_NEGATIONS) {
      for (; i<negationSymbols.length-1; i+=2) {
        var source = negationSymbols[i]
        var target = negationSymbols[i+1]
        puzzle.setCell(source.x, source.y, null)
        puzzle.setCell(target.x, target.y, null)
      }
    }

    console.debug(negationSymbols.length - i, 'negation symbol(s) left over with nothing to negate')
    for (; i<negationSymbols.length; i++) {
      puzzle.updateCell2(negationSymbols[i].x, negationSymbols[i].y, 'type', 'nonce')
    }
    var regionData = _regionCheck(puzzle, region)

    i = index2
    if (window.NEGATIONS_CANCEL_NEGATIONS) {
      for (; i<negationSymbols.length-1; i+=2) {
        var source = negationSymbols[i]
        var target = negationSymbols[i+1]
        puzzle.setCell(source.x, source.y, source.cell)
        puzzle.setCell(target.x, target.y, target.cell)
        regionData.negations.push({'source':source, 'target':target})
      }
    }
    for (; i<negationSymbols.length; i++) {
      puzzle.updateCell2(negationSymbols[i].x, negationSymbols[i].y, 'type', 'nega')
      regionData.invalidElements.push(negationSymbols[i])
      regionData.valid = false
    }
    return regionData
  }

  var source = negationSymbols[index2++]
  puzzle.setCell(source.x, source.y, null)

  var firstRegionData = null
  for (var i=index; i<invalidElements.length; i++) {
    var target = invalidElements[i]
    console.spam('Attempting negation pair', source, target)

    console.group()
    puzzle.setCell(target.x, target.y, null)
    var regionData = _regionCheckNegations2(puzzle, region, negationSymbols, invalidElements, i + 1, index2)
    puzzle.setCell(target.x, target.y, target.cell)
    console.groupEnd()

    if (!firstRegionData) {
      firstRegionData = regionData
      firstRegionData.negations.push({'source':source, 'target':target})
    }
    if (regionData.valid) {
      regionData.negations.push({'source':source, 'target':target})
      break
    }
  }

  puzzle.setCell(source.x, source.y, source.cell)
  // For display purposes only. The first attempt will always pair off the most negation symbols,
  // so it's the best choice to display (if we're going to fail).
  return (regionData.valid ? regionData : firstRegionData)
}

function _regionCheckNegations(puzzle, region) {
  // Get a list of negation symbols in the grid, and set them to 'nonce'
  var negationSymbols = []
  for (var pos of region.cells) {
    if (pos.cell != undefined && pos.cell.type === 'nega') {
      negationSymbols.push(pos)
      puzzle.updateCell2(pos.x, pos.y, 'type', 'nonce')
    }
  }
  console.debug('Found', negationSymbols.length, 'negation symbols')
  // Get a list of elements that are currently invalid (before any negations are applied)
  var regionData = _regionCheck(puzzle, region)
  console.debug('Negation-less regioncheck valid:', regionData.valid)
  // Perf: There's no reason to re-validate if there are no negation symbols.
  if (negationSymbols.length === 0) return regionData

  // Set 'nonce' back to 'nega' for the negation symbols
  for (var pos of negationSymbols) {
    puzzle.updateCell2(pos.x, pos.y, 'type', 'nega')
  }

  var combinations = []

  var invalidElements = regionData.invalidElements
  var veryInvalidElements = regionData.veryInvalidElements

  console.debug('Forcibly negating', veryInvalidElements.length, 'symbols')
  var baseCombination = []
  while (negationSymbols.length > 0 && veryInvalidElements.length > 0) {
    var source = negationSymbols.pop()
    var target = veryInvalidElements.pop()
    puzzle.setCell(source.x, source.y, null)
    puzzle.setCell(target.x, target.y, null)
    baseCombination.push({'source':source, 'target':target})
  }

  var regionData = _regionCheckNegations2(puzzle, region, negationSymbols, invalidElements)

  // Restore required negations
  for (var combination of baseCombination) {
    puzzle.setCell(combination.source.x, combination.source.y, combination.source.cell)
    puzzle.setCell(combination.target.x, combination.target.y, combination.target.cell)
    regionData.negations.push(combination)
  }
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
      // @Bug! This does not work if the puzzle is not being live-updated. Because of course.
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
  console.debug('Region has', veryInvalidElements.length, 'very invalid elements')
  console.debug('Region has', invalidElements.length, 'invalid elements')
  return {
    'veryInvalidElements': veryInvalidElements,
    'invalidElements': invalidElements,
    'negations': [],
    'valid': (invalidElements.length === 0 && veryInvalidElements.length === 0)
  }
}
