// Validation settings
window.NEGATIONS_CANCEL_NEGATIONS = true
window.SHAPELESS_ZERO_POLY = true
window.PRECISE_POLYOMINOS = true

// Determines if the current grid state is solvable. Modifies the puzzle element with:
// valid: Whether or not the puzzle is valid
// invalidElements: Symbols which are invalid (for the purpose of negating / flashing)
// negations: Negation symbols and their targets (for the purpose of darkening)
// @Performance: Consider implementing a "no-ui/silent" validation mode which exits after the first error.
function validate(puzzle, quick) {
  console.log('Validating', puzzle)
  puzzle.valid = true // Assume valid until we find an invalid element

  var puzzleHasStart = false
  var puzzleHasEnd = false
  puzzle.hasNegations = false
  puzzle.hasPolyominos = false
  // Validate gap failures as an early exit.
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined) continue
      if (cell.type == 'nega') puzzle.hasNegations = true
      if (cell.type == 'poly' || cell.type == 'ylop') puzzle.hasPolyominos = true
      if (cell.line > window.LINE_NONE) {
        if (cell.start === true) puzzleHasStart = true
        if (cell.end != undefined) puzzleHasEnd = true
        if (cell.dot > 1 && cell.line > window.LINE_BLACK && cell.dot !== cell.line) {
          console.log('Incorrectly covered dot: Dot is', cell.dot, 'but line is', cell.line)
          puzzle.valid = false
          if (quick) return
        }
      }
    }
  }
  if (!puzzleHasStart || !puzzleHasEnd) {
    console.log('There is no covered start or endpoint')
    puzzle.valid = false
    if (quick) return
  }

  puzzle.invalidElements = []
  puzzle.negations = []
  var regions = puzzle.getRegions()
  console.log('Found', regions.length, 'regions')
  console.debug(regions)

  for (var region of regions) {
    var key = region.grid.toString()
    var regionData = puzzle.regionCache[key]
    if (regionData == undefined) {
      console.log('Cache miss for region', region, 'key', key)
      regionData = regionCheckNegations(puzzle, region, quick)
      console.log('Region valid:', regionData.valid())

      if (!window.DISABLE_CACHE) {
        puzzle.regionCache[key] = regionData
      }
    }
    puzzle.negations = puzzle.negations.concat(regionData.negations)
    puzzle.invalidElements = puzzle.invalidElements.concat(regionData.invalidElements)
    puzzle.invalidElements = puzzle.invalidElements.concat(regionData.veryInvalidElements)
    puzzle.valid &= regionData.valid()
    if (quick && !puzzle.valid) return
  }
  console.log('Puzzle has', puzzle.invalidElements.length, 'invalid elements')
}

class RegionData {
  constructor() {
    this.invalidElements = []
    this.veryInvalidElements = []
    this.negations = []
  }

  addInvalid(elem) {
    this.invalidElements.push(elem)
  }

  addVeryInvalid(elem) {
    this.veryInvalidElements.push(elem)
  }

  valid() {
    return (this.invalidElements.length === 0 && this.veryInvalidElements.length === 0)
  }
}

function _regionCheckNegations2(puzzle, region, negationSymbols, invalidElements, index=0, index2=0) {
  if (index2 >= negationSymbols.length) {
    console.debug('0 negation symbols left, returning negation-less regionCheck')
    return _regionCheck(puzzle, region, false) // TODO: quick?
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
    // Cannot be quick, as we need the full list of invalid symbols.
    var regionData = _regionCheck(puzzle, region, false)

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
      regionData.addInvalid(negationSymbols[i])
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
    if (regionData.valid()) {
      regionData.negations.push({'source':source, 'target':target})
      break
    }
  }

  puzzle.setCell(source.x, source.y, source.cell)
  // For display purposes only. The first attempt will always pair off the most negation symbols,
  // so it's the best choice to display (if we're going to fail).
  return (regionData.valid() ? regionData : firstRegionData)
}

function regionCheckNegations(puzzle, region, quick) {
  if (!puzzle.hasNegations) return _regionCheck(puzzle, region, quick)

  // Get a list of negation symbols in the grid, and set them to 'nonce'
  var negationSymbols = []
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell != undefined && cell.type === 'nega') {
      pos.cell = cell
      negationSymbols.push(pos)
      puzzle.updateCell2(pos.x, pos.y, 'type', 'nonce')
    }
  }
  console.debug('Found', negationSymbols.length, 'negation symbols')
  if (negationSymbols.length === 0) {
    // No negation symbols in this region. Note that there must be negation symbols elsewhere
    // in the puzzle, since puzzle.hasNegations was true.
    return _regionCheck(puzzle, region, quick)
  }

  // Get a list of elements that are currently invalid (before any negations are applied)
  // This cannot be quick, as we need a full list (for the purposes of negation).
  var regionData = _regionCheck(puzzle, region, false)
  console.debug('Negation-less regioncheck valid:', regionData.valid())

  // Set 'nonce' back to 'nega' for the negation symbols
  for (var pos of negationSymbols) {
    puzzle.updateCell2(pos.x, pos.y, 'type', 'nega')
  }

  var combinations = []

  var invalidElements = regionData.invalidElements
  var veryInvalidElements = regionData.veryInvalidElements

  for (var i=0; i<invalidElements.length; i++) {
    invalidElements[i].cell = puzzle.getCell(invalidElements[i].x, invalidElements[i].y)
  }
  for (var i=0; i<veryInvalidElements.length; i++) {
    veryInvalidElements[i].cell = puzzle.getCell(veryInvalidElements[i].x, veryInvalidElements[i].y)
  }

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
function _regionCheck(puzzle, region, quick) {
  console.log('Validating region', region)
  var regionData = new RegionData()

  var coloredObjects = {}
  var squareColors = {}
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == undefined) continue

    // Check for uncovered dots
    if (cell.dot > 0) {
      console.log('Dot at', pos.x, pos.y, 'is not covered')
      regionData.addVeryInvalid(pos)
      if (quick) return regionData
    }

    // Check for triangles
    if (cell.type === 'triangle') {
      var count = 0
      if (puzzle.getLine(pos.x - 1, pos.y) > window.LINE_NONE) count++
      if (puzzle.getLine(pos.x + 1, pos.y) > window.LINE_NONE) count++
      if (puzzle.getLine(pos.x, pos.y - 1) > window.LINE_NONE) count++
      if (puzzle.getLine(pos.x, pos.y + 1) > window.LINE_NONE) count++
      if (cell.count !== count) {
        console.log('Triangle at grid['+pos.x+']['+pos.y+'] has', count, 'borders')
        regionData.addVeryInvalid(pos)
        if (quick) return regionData
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
        regionData.addInvalid(pos)
        if (quick) return regionData
      }
    } else if (cell.type === 'star') {
      if (coloredObjects[cell.color] === 1) {
        console.log('Found a', cell.color, 'star in a region with 1', cell.color, 'object')
        regionData.addVeryInvalid(pos)
        if (quick) return regionData
      } else if (coloredObjects[cell.color] > 2) {
        console.log('Found a', cell.color, 'star in a region with', coloredObjects[cell.color], cell.color, 'objects')
        regionData.addInvalid(pos)
        if (quick) return regionData
      }
    }
  }

  if (puzzle.hasPolyominos) {
    if (!window.polyFit(region, puzzle)) {
      for (var pos of region.cells) {
        var cell = puzzle.getCell(pos.x, pos.y)
        if (cell == undefined) continue
        if (cell.type === 'poly' || cell.type === 'ylop') {
          regionData.addInvalid(pos)
          if (quick) return regionData
        }
      }
    }
  }

  console.debug('Region has', regionData.veryInvalidElements.length, 'very invalid elements')
  console.debug('Region has', regionData.invalidElements.length, 'invalid elements')
  return regionData
}
