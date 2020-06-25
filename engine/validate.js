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
        regionData = _regionCheckNegations2(puzzle, region)
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

function _negationCombinations(puzzle, negationSymbols, invalidElements, index=0) {
  if (negationSymbols.length === 0) return [[]]

  var combinations = []
  var source = negationSymbols.pop()

  for (var i=index; i<invalidElements.length; i++) {
    var target = invalidElements[index]
    var subCombinations = _negationCombinations(puzzle, negationSymbols, invalidElements, index + 1)
    for (var j=0; j<subCombinations.length; j++) {
      subCombinations[j].push({'source':source, 'target':target})
      combinations.push(subCombinations[j])
    }
  }

  if (window.NEGATIONS_CANCEL_NEGATIONS) {
    for (var i=index; i<negationSymbols.length + invalidElements.length; i++) {
      var target = negationSymbols[i - invalidElements.length]
      var subCombinations = _negationCombinations(puzzle, negationSymbols, invalidElements, index + 1)
      for (var j=0; j<subCombinations.length; j++) {
        subCombinations[j].push({'source':source, 'target':target})
        combinations.push(subCombinations[j])
      }
    }
  }

  negationSymbols.push(source)
  return combinations
}

function _regionCheckNegations3(puzzle, region, negationSymbols, invalidElements, index=0) {
  // Base case 0
  if (negationSymbols.length === 0) {
    return _regionCheck(puzzle, region)
  }

  window.NEGATIONS_CANCEL_NEGATIONS = false
  // Base case 1
  if (!window.NEGATIONS_CANCEL_NEGATIONS) {
    if (index >= invalidElements.length) {
      console.debug(negationSymbols.length, 'negation symbol(s) left over with nothing to negate')
      for (var pos of negationSymbols) {
        puzzle.updateCell(pos.x, pos.y, {'type':'nonce'})
      }
      var regionData = _regionCheck(puzzle, region)
      for (var pos of negationSymbols) {
        puzzle.updateCell(pos.x, pos.y, {'type':'nega'})
        regionData.invalidElements.push(pos)
      }
      regionData.valid = false
      return regionData
    }
  } else {
    if (index >= invalidElements.length + negationSymbols.length) {
      // TODO.
    }
  }

  var source = negationSymbols.pop()
  puzzle.setCell(source.x, source.y, null)
  for (var i=index; i<invalidElements.length; i++) {
    var target = invalidElements[i]
    console.spam('Attempting negation pair', source, target)

    console.group()
    puzzle.setCell(target.x, target.y, null)
    var regionData = _regionCheckNegations3(puzzle, region, negationSymbols, invalidElements, index + 1)
    puzzle.setCell(target.x, target.y, target.cell)
    console.groupEnd()

    if (regionData.valid) break
  }

  if (window.NEGATIONS_CANCEL_NEGATIONS) {
    // TODO.
  }

  puzzle.setCell(source.x, source.y, source.cell)
  assert(regionData)
  regionData.negations.push({'source':source, 'target':target})
  return regionData
  /*
  if (window.NEGATIONS_CANCEL_NEGATIONS) {
    for (var i=index; i<negationSymbols.length + invalidElements.length; i++) {
      var target = negationSymbols[i - invalidElements.length]

      puzzle.setCell(target.x, target.y, null)
      regionData = _regionCheckNegations3(puzzle, region, negationSymbols, invalidElements, index + 1)
      puzzle.setCell(target.x, target.y, target.cell)

      if (regionData.valid) break
    }
  }
  */
}

function _regionCheckNegations2(puzzle, region) {
  // Get a list of negation symbols in the grid, and set them to 'nonce'
  var negationSymbols = []
  for (var pos of region.cells) {
    var cell = pos.cell
    if (cell != undefined && cell.type === 'nega') {
      negationSymbols.push(pos)
      puzzle.updateCell(pos.x, pos.y, {'type': 'nonce'})
    }
  }
  console.debug('Found negation symbols:', JSON.stringify(negationSymbols))
  // Get a list of elements that are currently invalid (before any negations are applied)
  var regionData = _regionCheck(puzzle, region)
  console.debug('Negation-less regioncheck valid:', regionData.valid)
  // Set 'nonce' back to 'nega' for the negation symbols
  for (var pos of negationSymbols) {
    puzzle.updateCell(pos.x, pos.y, {'type': 'nega'})
  }

  var combinations = []
  if (negationSymbols.length === 0) return regionData

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
  console.debug('Base combination:', JSON.stringify(baseCombination))

  /*
  // If there are no more negation symbols, just return the basic combination.
  // Maybe it's good enough (or maybe there are still veryInvalidElements). In either case, we have nothing else to try.
  if (negationSymbols.length === 0) {
    combinations.push([]) // Push empty, will be concatenated later.
    console.debug('No remaining negation symbols left, just using baseCombination', baseCombination)
    console.debug('There are still', veryInvalidElements.length, 'very invalid elements')
  } else {
    // Note that, at this point we can assume that veryInvalidElements.length === 0. Otherwise, we wouldn't exit the loop!
    combinations = _negationCombinations(puzzle, negationSymbols, invalidElements)
    console.debug('There are', negationSymbols.length, 'remaining negation symbols, resulting in', combinations.length, 'combinations')
  }
  */

  var regionData = _regionCheckNegations3(puzzle, region, negationSymbols, invalidElements)

  // Restore required negations
  for (var combination of baseCombination) {
    puzzle.setCell(combination.source.x, combination.source.y, combination.source.cell)
    puzzle.setCell(combination.target.x, combination.target.y, combination.target.cell)
    regionData.negations.push(combination)
  }
  return regionData

  /*
  for (var i=0; i<combinations.length; i++) {
    var combination = combinations[i].concat(baseCombination)
    console.spam('Attempting combatination', i, JSON.stringify(combination))
    for (var j=0; j<combination.length; j++) {
      puzzle.setCell(combination[j].source.x, combination[j].source.y, null)
      puzzle.setCell(combination[j].target.x, combination[j].target.y, null)
    }
    regionData = _regionCheck(puzzle, region)
    for (var j=0; j<combination.length; j++) {
      puzzle.setCell(combination[j].source.x, combination[j].source.y, combination[j].source.cell)
      puzzle.setCell(combination[j].target.x, combination[j].target.y, combination[j].target.cell)
    }

    if (regionData.valid) {
      console.debug('Region is valid with negations applied, so the negation is valid!')
      regionData['negations'] = combination
      return regionData
    }
  }

  console.debug('No negation combinations worked, giving up and returning the final attempt')
  return regionData
  */
}

function _regionCheckNegations(puzzle, region) {
  // Get a list of negation symbols in the grid, and set them to 'nonce'
  var negationSymbols = []
  for (var pos of region.cells) {
    var cell = pos.cell
    if (cell != undefined && cell.type === 'nega') {
      cell.type = 'nonce'
      puzzle.setCell(pos.x, pos.y, cell)
      negationSymbols.push(pos)
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
  console.debug('Region has', veryInvalidElements.length, 'very invalid elements:', JSON.stringify(veryInvalidElements))
  console.debug('Region has', invalidElements.length, 'invalid elements:', JSON.stringify(invalidElements))
  return {
    'veryInvalidElements': veryInvalidElements,
    'invalidElements': invalidElements,
    'negations': [],
    'valid': (invalidElements.length === 0 && veryInvalidElements.length === 0)
  }
}
