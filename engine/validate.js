namespace(function() {

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

function isBounded(puzzle, x, y) {
  return (0 <= x && x < puzzle.width && 0 <= y && y < puzzle.height);
}

// Determines if the current grid state is solvable. Modifies the puzzle element with:
// valid: Whether or not the puzzle is valid
// invalidElements: Symbols which are invalid (for the purpose of negating / flashing)
// negations: Negation pairs (for the purpose of darkening)
window.validate = function(puzzle, quick) {
  console.log('Validating', puzzle)
  puzzle.valid = true // Assume valid until we find an invalid element

  var needsRegions = false
  var monoRegion = new Region(puzzle.width)
  // These two are both used by validateRegion, so they are saved on the puzzle itself.
  puzzle.hasNegations = false
  puzzle.hasPolyominos = false
  puzzle.hasSizers = false
  
  puzzle.invalidElements = []
  initializeXs()

  // Validate gap failures as an early exit.
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == null) continue;
      if (!needsRegions && cell.type != 'line' && cell.type != 'triangle' && cell.type != 'vtriangle' && cell.type != 'arrow') needsRegions = true
      if (cell.type == 'nega') puzzle.hasNegations = true
      if (cell.type == 'poly' || cell.type == 'ylop' || cell.type == 'polynt') puzzle.hasPolyominos = true
      if (cell.type == 'sizer') puzzle.hasSizers = true
      if (cell.line > window.LINE_NONE) {
        if (window.CUSTOM_X < cell.dot && cell.dot < window.DOT_NONE) { // custom: check for line go over
          window.preValidateAltDots(puzzle, cell, {'x': x, 'y': y}, quick)
          if (quick && !puzzle.valid) return
        } else if (cell.dot <= window.CUSTOM_X)
          window.preValidateXs(puzzle, cell, {'x': x, 'y': y}, quick)
        if (cell.gap > window.GAP_NONE) {
          console.log('Solution line goes over a gap at', x, y)
          puzzle.invalidElements.push({"x": x, "y": y})
          puzzle.valid = false
          if (quick) return
        }
        if ((cell.dot === window.DOT_BLUE && cell.line === window.LINE_YELLOW) ||
            (cell.dot === window.DOT_YELLOW && cell.line === window.LINE_BLUE)) {
          console.log('Incorrectly covered dot: Dot is', cell.dot, 'but line is', cell.line)
          puzzle.invalidElements.push({"x": x, "y": y})
          puzzle.valid = false
          if (quick) return
        }
      } else {
        monoRegion.setCell(x, y)
      }
    }
  }

  window.preValidateTTriangles(puzzle)

  puzzle.negations = []
  if (needsRegions) {
    var regions = puzzle.getRegions()
  } else {
    var regions = [monoRegion]
  }
  console.log('Found', regions.length, 'region(s)')
  console.debug(regions)

  if (puzzle.hasSizers) puzzle.sizerCount = null
  for (var region of regions) {
    regionData = validateRegion(puzzle, region, quick)
    console.log('Region valid:', regionData.valid())
    puzzle.negations = puzzle.negations.concat(regionData.negations)
    puzzle.invalidElements = puzzle.invalidElements.concat(regionData.invalidElements)
    puzzle.invalidElements = puzzle.invalidElements.concat(regionData.veryInvalidElements)
    puzzle.valid = puzzle.valid && regionData.valid()
    if (quick && !puzzle.valid) return
  }
  console.log('Puzzle has', puzzle.invalidElements.length, 'invalid elements')
}

// Determines whether or not a particular region is valid or not, including negation symbols.
// If quick is true, exits after the first invalid element is found (small performance gain)
// This function applies negations to all "very invalid elements", i.e. elements which cannot become
// valid by another element being negated. Then, it passes off to regionCheckNegations2,
// which attempts to apply any remaining negations to any other invalid elements.
window.validateRegion = function(puzzle, region, quick) {
  if (!puzzle.hasNegations) return regionCheck(puzzle, region, quick)

  // Get a list of negation symbols in the grid, and set them to 'nonce'
  var negationSymbols = []
  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell != null && cell.type === 'nega') {
      pos.cell = cell
      negationSymbols.push(pos)
      puzzle.updateCell2(pos.x, pos.y, 'type', 'nonce')
    }
  }
  console.debug('Found', negationSymbols.length, 'negation symbols')
  if (negationSymbols.length === 0) {
    // No negation symbols in this region. Note that there must be negation symbols elsewhere
    // in the puzzle, since puzzle.hasNegations was true.
    return regionCheck(puzzle, region, quick)
  }

  // Get a list of elements that are currently invalid (before any negations are applied)
  // This cannot be quick, as we need a full list (for the purposes of negation).
  var regionData = regionCheck(puzzle, region, false)
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

  var regionData = regionCheckNegations2(puzzle, region, negationSymbols, invalidElements)

  // Restore required negations
  for (var combination of baseCombination) {
    puzzle.setCell(combination.source.x, combination.source.y, combination.source.cell)
    puzzle.setCell(combination.target.x, combination.target.y, combination.target.cell)
    regionData.negations.push(combination)
  }
  return regionData
}

// Recursively matches negations and invalid elements from the grid. Note that this function
// doesn't actually modify the two lists, it just iterates through them with index/index2.
function regionCheckNegations2(puzzle, region, negationSymbols, invalidElements, index=0, index2=0) {
  window.preValidateTTriangles(puzzle)
  if (index2 >= negationSymbols.length) {
    console.debug('0 negation symbols left, returning negation-less regionCheck')
    return regionCheck(puzzle, region, false) // @Performance: We could pass quick here.
  }

  if (index >= invalidElements.length) {
    var i = index2
    // pair off all negation symbols, 2 at a time
    if (puzzle.settings.NEGATIONS_CANCEL_NEGATIONS) {
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
    var regionData = regionCheck(puzzle, region, false)

    i = index2
    if (puzzle.settings.NEGATIONS_CANCEL_NEGATIONS) {
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
    var regionData = regionCheckNegations2(puzzle, region, negationSymbols, invalidElements, i + 1, index2)
    puzzle.setCell(target.x, target.y, target.cell)
    console.groupEnd()

    if (!firstRegionData) {
      firstRegionData = regionData
      firstRegionData.negations.push({'source':source, 'target':target})
    }
    if (regionData.valid()) {
      regionData.negations.push({'source':source, 'target':target})
      break;
    }
  }

  puzzle.setCell(source.x, source.y, source.cell)
  // For display purposes only. The first attempt will always pair off the most negation symbols,
  // so it's the best choice to display (if we're going to fail).
  return (regionData.valid() ? regionData : firstRegionData)
}

// Checks if a region is valid. This does not handle negations -- we assume that there are none.
// Note that this function needs to always ask the puzzle for the current contents of the cell,
// since the region is only coordinate locations, and might be modified by regionCheckNegations2
// @Performance: This is a pretty core function to the solve loop.
function regionCheck(puzzle, region, quick) {
  console.log('Validating region of size', region.cells.length, region)
  var regionData = new RegionData()

  let squares = []
  let stars = []
  let coloredObjects = {}
  let squareColor = null

  for (var pos of region.cells) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == null) continue;
    
    // Check for uncovered dots
    if (cell.dot > window.DOT_NONE) {
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
    if (cell.color != null) {
      var count = coloredObjects[cell.color]
      if (count == null) {
        count = 0
      }
      coloredObjects[cell.color] = count + 1

      if (cell.type === 'square') {
        squares.push(pos)
        if (squareColor == null)
          squareColor = cell.color
        else if (squareColor != cell.color)
          squareColor = -1 // Signal value which indicates square color collision
      }

      if (cell.type === 'star') {
        pos.color = cell.color
        stars.push(pos)
      }
    }
  }

  for (var star of stars) {
    var count = coloredObjects[star.color]
    if (count === 1) {
      console.log('Found a', star.color, 'star in a region with 1', star.color, 'object')
      regionData.addVeryInvalid(star)
      if (quick) return regionData
    } else if (count > 2) {
      console.log('Found a', star.color, 'star in a region with', count, star.color, 'objects')
      regionData.addInvalid(star)
      if (quick) return regionData
    }
  }

  if (puzzle.hasPolyominos) {
    if (!window.polyFit(region, puzzle)) {
      for (var pos of region.cells) {
        var cell = puzzle.getCell(pos.x, pos.y)
        if (cell == null) continue;
        if (cell.type === 'poly' || cell.type === 'ylop') {
          regionData.addInvalid(pos)
          if (quick) return regionData
        }
      }
    }
  }

  // customs: why else would you use this website
  let regionMatrix = Array.from({ length: puzzle.height }, () => Array.from({ length: puzzle.width }, () => null));
  for (var pos of region.cells) {
    let cell = puzzle.getCell(pos.x, pos.y);
    if (cell && cell.line === 0 && cell.type === "line") cell = true 
    regionMatrix[pos.y][pos.x] = cell || true
  } // oh boy
  window.validateAltDots(puzzle, region, regionData, quick)
  window.validateXs(regionData, regionMatrix)
  squareColor = window.validatePentagons(puzzle, region, regionData, squareColor)
  window.validateArrows(puzzle, region, regionData)
  window.validateDarts(puzzle, region, regionData, regionMatrix)
  window.validateTTriangles(puzzle, region, regionData, regionMatrix)
  // window.validateCopiers(puzzle, region, regionData)
  window.validateSizers(puzzle, region, regionData)
  // window.validateScalers(puzzle, region, regionData)
  window.validateBridges(puzzle, region, regionData)
  window.validateDivDiamonds(puzzle, region, regionData)
  window.validateCHexes(puzzle, region, regionData)
  window.validateAntipolys(puzzle, region, regionData, regionMatrix)
  window.validateTwoByTwos(puzzle, region, regionData, regionMatrix, quick)

  if (squareColor === -1) {
    regionData.invalidElements = regionData.invalidElements.concat(squares)
    if (quick) return regionData
  }

  console.log('Region has', regionData.veryInvalidElements.length, 'very invalid elements')
  console.log('Region has', regionData.invalidElements.length, 'invalid elements')
  return regionData
}
})