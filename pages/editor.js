window.DISABLE_CACHE = true
var activeParams = {'id':'', 'color':'black', 'polyshape':71}
var puzzle
var dragging

function _readPuzzleList() {
  try {
    var puzzleList = JSON.parse(window.localStorage.getItem('puzzleList'))
    if (puzzleList == null || !Array.isArray(puzzleList)) return []
    return puzzleList
  } catch {
    return []
  }
}

function _writePuzzleList(puzzleList) {
  if (puzzleList == undefined) throw 'Attempted to write puzzle list but none was provided'
  window.localStorage.setItem('puzzleList', JSON.stringify(puzzleList))
}

// Read the first puzzle in the list, and try to load it.
// Recurses until success or the list is exhausted, in which case we make an empty puzzle.
function _readPuzzle() {
  console.log('Trying to read first puzzle')
  var puzzleList = _readPuzzleList()
  if (puzzleList.length === 0) {
    console.log('No puzzles left, clearing storage and creating new one')
    window.localStorage.clear()
    createEmptyPuzzle()
    return
  }
  try {
    console.log('Reading puzzle', puzzleList[0])
    var serialized = window.localStorage.getItem(puzzleList[0])
    puzzle = Puzzle.deserialize(serialized)

    _reloadPuzzle()
  } catch (e) {
    console.log(e)
    console.log('Could not parse puzzle, deleting')
    deletePuzzle() // Will call readPuzzle() again
  }
}

// Write a new puzzle to the puzzle list.
// We add a new empty puzzle to the list, modify the global puzzle,
// and then call the "current puzzle out of date" function.
function _writeNewPuzzle(newPuzzle) {
  var puzzleList = _readPuzzleList()
  puzzleList.unshift(undefined)
  _writePuzzleList(puzzleList)

  puzzle = newPuzzle
  _writePuzzle()
  _reloadPuzzle()
}

// The current puzzle (element 0 in the puzzle list) is out of date.
// Clean it up, and reserialize it.
function _writePuzzle() {
  console.log('Writing puzzle', puzzle)
  var puzzleToSave = puzzle.clone()
  puzzleToSave.clearLines()

  var puzzleList = _readPuzzleList()
  // @Robustness: Some intelligence about showing day / month / etc depending on date age
  puzzleList[0] = puzzleToSave.name + ' on ' + (new Date()).toLocaleString()
  window.localStorage.setItem(puzzleList[0], puzzleToSave.serialize())
  _writePuzzleList(puzzleList)
}

// Delete the active puzzle then read the next one.
function deletePuzzle() {
  var puzzleList = _readPuzzleList()
  if (puzzleList.length === 0) return
  var puzzleName = puzzleList.shift()
  console.log('Removing puzzle', puzzleName)
  window.localStorage.removeItem(puzzleName)
  _writePuzzleList(puzzleList)

  // Try to read the next puzzle from the list.
  _readPuzzle()
}

// Clear animations from the puzzle, redraw it, and add editor hooks.
// Note that this function DOES NOT reload the style, check for the automatic solver,
// reset the publish button, and other such 'meta' cleanup steps.
// You should only call this function if you're *sure* you're not in manual solve mode.
// If there's a chance that you are in manual solve mode, call _reloadPuzzle().
function _drawPuzzle() {
  window.draw(puzzle)
  window.clearAnimations()

  // @Robustness: Maybe I should be cleaning house more thoroughly? A class or something would let me just remove these...
  var puzzleElement = document.getElementById('puzzle')
  // Remove all 'onTraceStart' calls, they should be interacted through solveManually only.
  for (var child of puzzleElement.children) {
    child.onclick = null
  }

  var addOnClick = function(elem, x, y) {
    elem.onclick = function() {_onElementClicked(x, y)}
  }

  var xPos = 40
  var topLeft = {'x':40, 'y':40}
  for (var x=0; x<puzzle.width; x++) {
    var yPos = 40
    var width = (x%2 === 0 ? 24 : 58)
    for (var y=0; y<puzzle.height; y++) {
      var height = (y%2 === 0 ? 24 : 58)
      var rect = createElement('rect')
      puzzleElement.appendChild(rect)
      rect.setAttribute('x', xPos)
      rect.setAttribute('y', yPos)
      rect.setAttribute('width', width)
      rect.setAttribute('height', height)
      rect.setAttribute('fill', 'white')
      rect.setAttribute('opacity', 0)
      yPos += height
      addOnClick(rect, x, y)
      rect.onmouseover = function() {this.setAttribute('opacity', 0.1)}
      rect.onmouseout = function() {this.setAttribute('opacity', 0)}
    }
    xPos += width
  }
}

function _reloadPuzzle() {
  setSolveMode(false) // Disable the Solve (manually) button, clear lines, and redraw the puzzle

  document.getElementById('puzzleName').innerText = puzzle.name
  document.getElementById('solutionViewer').style.display = 'none'

  document.getElementById('solveAuto').disabled = false
  if (puzzle.symmetry != undefined) {
    // 6x6 is the max for symmetry puzzles
    if (puzzle.width > 13 || puzzle.height > 13) {
      document.getElementById('solveAuto').disabled = true
    }
  } else if (puzzle.pillar === true) {
    // 5x6 is the max for non-symmetry, pillar puzzles
    if (puzzle.width > 13 || puzzle.height > 11) {
      document.getElementById('solveAuto').disabled = true
    }
  } else {
    // 6x6 is the max for non-symmetry, non-pillar puzzles
    if (puzzle.width > 13 || puzzle.height > 13) {
      document.getElementById('solveAuto').disabled = true
    }
  }

  var publish = document.getElementById('publish')
  publish.disabled = true
  publish.innerText = 'Publish'
  publish.onclick = publishPuzzle
  currentPublishRequest = undefined

  var puzzleStyle = document.getElementById('puzzleStyle')
  if (puzzle.pillar === false) {
    if (puzzle.symmetry == undefined) {
      puzzleStyle.value = 'Default'
    } else if (puzzle.symmetry.x === true && puzzle.symmetry.y === false) {
      puzzleStyle.value = 'Horizontal Symmetry'
    } else if (puzzle.symmetry.x === false && puzzle.symmetry.y === true) {
      puzzleStyle.value = 'Vertical Symmetry'
    } else if (puzzle.symmetry.x === true && puzzle.symmetry.y === true) {
      puzzleStyle.value = 'Rotational Symmetry'
    }
  } else if (puzzle.pillar === true) {
    if (puzzle.symmetry == undefined) {
      puzzleStyle.value = 'Pillar'
    } else if (puzzle.symmetry.x === true && puzzle.symmetry.y === false) {
      puzzleStyle.value = 'Pillar (H Symmetry)'
    } else if (puzzle.symmetry.x === false && puzzle.symmetry.y === true) {
      puzzleStyle.value = 'Pillar (V Symmetry)'
    } else if (puzzle.symmetry.x === true && puzzle.symmetry.y === true) {
      puzzleStyle.value = 'Pillar (R Symmetry)'
    } else if (puzzle.symmetry.x === false && puzzle.symmetry.y === false) {
      puzzleStyle.value = 'Pillar (Two Lines)'
    }
  }
  console.log('Computed puzzle style', puzzleStyle.value)
}

//** Buttons which the user can click on
function createEmptyPuzzle() {
  var style = document.getElementById('puzzleStyle').value
  console.log('Creating new puzzle with style', style)

  switch (style) {
  default:
    console.error('Attempted to set unknown style', style, 'falling back to default')
    style = 'Default'
  case 'Default':
    var newPuzzle = new Puzzle(4, 4)
    newPuzzle.grid[0][8].start = true
    newPuzzle.grid[8][0].end = 'right'
    break;

  case 'Horizontal Symmetry':
    var newPuzzle = new Puzzle(4, 4)
    newPuzzle.symmetry = {'x':true, 'y':false}
    newPuzzle.grid[0][8].start = true
    newPuzzle.grid[8][8].start = true
    newPuzzle.grid[0][0].end = 'left'
    newPuzzle.grid[8][0].end = 'right'
    break;

  case 'Vertical Symmetry':
    var newPuzzle = new Puzzle(4, 4)
    newPuzzle.symmetry = {'x':false, 'y':true}
    newPuzzle.grid[0][0].start = true
    newPuzzle.grid[0][8].start = true
    newPuzzle.grid[8][0].end = 'right'
    newPuzzle.grid[8][8].end = 'right'
    break;

  case 'Rotational Symmetry':
    var newPuzzle = new Puzzle(4, 4)
    newPuzzle.symmetry = {'x':true, 'y':true}
    newPuzzle.grid[0][0].start = true
    newPuzzle.grid[8][8].start = true
    newPuzzle.grid[8][0].end = 'right'
    newPuzzle.grid[0][8].end = 'left'
    break;

  case 'Pillar':
    var newPuzzle = new Puzzle(6, 5, true)
    newPuzzle.grid[6][10].start = true
    newPuzzle.grid[6][0].end = 'top'
    break;

  case 'Pillar (H Symmetry)':
    var newPuzzle = new Puzzle(6, 6, true)
    newPuzzle.symmetry = {'x':true, 'y':false}
    newPuzzle.grid[2][12].start = true
    newPuzzle.grid[4][12].start = true
    newPuzzle.grid[2][0].end = 'top'
    newPuzzle.grid[4][0].end = 'top'
    break;

  case 'Pillar (V Symmetry)':
    var newPuzzle = new Puzzle(6, 6, true)
    newPuzzle.symmetry = {'x':false, 'y':true}
    newPuzzle.grid[2][12].start = true
    newPuzzle.grid[8][0].start = true
    newPuzzle.grid[2][0].end = 'top'
    newPuzzle.grid[8][12].end = 'bottom'
    break;

  case 'Pillar (R Symmetry)':
    var newPuzzle = new Puzzle(6, 6, true)
    newPuzzle.symmetry = {'x':true, 'y':true}
    newPuzzle.grid[2][0].start = true
    newPuzzle.grid[4][12].start = true
    newPuzzle.grid[4][0].end = 'top'
    newPuzzle.grid[2][12].end = 'bottom'
    break;

  case 'Pillar (Two Lines)':
    var newPuzzle = new Puzzle(6, 6, true)
    newPuzzle.symmetry = {'x':false, 'y':false}
    newPuzzle.grid[2][12].start = true
    newPuzzle.grid[8][12].start = true
    newPuzzle.grid[2][0].end = 'top'
    newPuzzle.grid[8][0].end = 'top'
    break;

  }

  if (style == 'Default') {
    newPuzzle.name = 'Unnamed Puzzle'
  } else {
    newPuzzle.name = 'Unnamed ' + style + ' Puzzle'
  }
  _writeNewPuzzle(newPuzzle)
}

function loadPuzzle() {
  var puzzleList = _readPuzzleList()
  if (puzzleList.length === 0) return

  var buttons = document.getElementById('metaButtons')
  var loadList = document.createElement('select')
  buttons.parentElement.insertBefore(loadList, buttons)
  loadList.style.width = buttons.offsetWidth
  buttons.style.display = 'none'

  for (var puzzleName of puzzleList) {
    var option = document.createElement('option')
    option.innerText = puzzleName
    loadList.appendChild(option)
  }

  loadList.value = '' // Forces onchange to fire for any selection
  loadList.onchange = function() {
    console.log('Loading puzzle', this.value)

    // Re-order to the front of the list
    var puzzleList = _readPuzzleList()
    var index = puzzleList.indexOf(this.value)
    puzzleList.unshift(puzzleList.splice(index, 1)[0])
    _writePuzzleList(puzzleList)

    // Then try reading the first puzzle
    _readPuzzle()

    buttons.parentElement.removeChild(buttons.previousSibling)
    document.getElementById('metaButtons').style.display = 'inline'
  }
}

function importPuzzle() {
  var serialized = prompt('Paste your puzzle here:')

  console.log('Creating puzzle from serialized', serialized)
  try {
    var newPuzzle = Puzzle.deserialize(serialized) // Will throw for most invalid puzzles
    _writeNewPuzzle(newPuzzle)
  } catch (e) {
    console.error('Failed to load serialized puzzle', e)

    // Only alert if user tried to enter data
    if (serialized) alert('Not a valid puzzle!')
  }
}

function setSolveMode(value) {
  document.getElementById('solveMode').checked = value
  if (value === true) {
    window.TRACE_COMPLETION_FUNC = function(solution) {
      puzzle = solution
      document.getElementById('publish').disabled = false
    }
    // Redraw the puzzle, without interaction points. This is a bit of a @Hack, but it works.
    window.draw(puzzle)
  } else {
    puzzle.clearLines()
    window.TRACE_COMPLETION_FUNC = undefined
    _drawPuzzle()
  }
}

// Automatically solve the puzzle
function solvePuzzle() {
  setSolveMode(false)
  document.getElementById('solutionViewer').style.display = 'none'
  document.getElementById('progressBox').style.display = null
  window.solve(puzzle, function(progress) {
    var percent = Math.floor(100 * progress)
    document.getElementById('progressPercent').innerText = percent + '%'
    document.getElementById('progress').style.width = percent + '%'
  }, function(paths) {
    document.getElementById('progressBox').style.display = 'none'
    document.getElementById('solutionViewer').style.display = null
    document.getElementById('progressPercent').innerText = '0%'
    document.getElementById('progress').style.width = '0%'

    puzzle.autoSolved = true
    var solutions = []
    for (var path of paths) solutions.push(window.pathToSolution(puzzle, path))
    _showSolution(solutions, 0)
  })
}
//** End of user interaction points

window.onload = function() {
  _readPuzzle() // Will fall back to a new puzzle if needed.

  _drawSymbolButtons()
  _drawColorButtons()

  var puzzleName = document.getElementById('puzzleName')
  // Both oninput and onkeypress fire for every text modification.

  // Use onkeypress when you need to prevent an action
  puzzleName.onkeypress = function(event) {
    // If the user tries to type past 50 characters
    if (this.innerText.length >= 50) {
      event.preventDefault()
    }

    // Allow using the enter key to confirm the puzzle name
    if (event.key === 'Enter') {
      event.preventDefault()
      this.blur()
    }
  }

  // Use oninput for backup processing
  // You should always use a conditional here, because every time you modify the text,
  // the cursor resets to the start of the string.
  puzzleName.oninput = function(event) {
    // Prevent newlines in titles
    if (this.innerText.includes('\n')) this.innerText = this.innerText.replace('\n', '')
    if (this.innerText.includes('\r')) this.innerText = this.innerText.replace('\r', '')
    // Prevent the input box from disappearing
    if (this.innerText.length === 0) this.innerText = '\u200B'
    // Prevent too-long titles
    if (this.innerText.length >= 50) this.innerText = this.innerText.substring(0, 50)
  }

  // Use onblur for final name confirmation.
  puzzleName.onblur = function(event) {
    // Remove leading/trailing whitespace
    this.innerText = this.innerText.trim()
    this.innerText = this.innerText.replace('\u200B', '')
    // Ensure that puzzle names are non-empty
    if (this.innerText.length === 0) this.innerText = 'Unnamed Puzzle'
    // Update the puzzle with the new name
    puzzle.name = this.innerText
    _writePuzzle()
  }

  for (var resize of document.getElementsByClassName('resize')) {
    resize.onmousedown = function(event) {_dragStart(event, this)}
    if (resize.id === 'resize-left' || resize.id === 'resize-right') {
      var svg = drawSymbol({'type': 'drag', 'rot':1, 'width':6, 'height':22})
      svg.style.width = '6px'
      svg.style.height = '22px'
      resize.appendChild(svg)

      resize.style.display = 'flex'
      svg.style.margin = 'auto'
    } else if (resize.id === 'resize-top' || resize.id === 'resize-bottom') {
      var svg = drawSymbol({'type': 'drag', 'rot':0, 'width':22, 'height':6})
      svg.style.width = '22px'
      svg.style.height = '6px'
      resize.appendChild(svg)

      resize.style.display = 'flex'
      svg.style.margin = 'auto'
    }
  }
}

function _showSolution(solutions, num) {
  if (num < 0) num = solutions.length - 1
  if (num >= solutions.length) num = 0

  var previousSolution = document.getElementById('previousSolution')
  var solutionCount = document.getElementById('solutionCount')
  var nextSolution = document.getElementById('nextSolution')

  // Buttons & text
  if (solutions.length === 0) { // 0 solutions, arrows are useless
    solutionCount.innerText = '0 of 0'
    previousSolution.disabled = true
    nextSolution.disabled = true
  } else if (solutions.length === 1) { // 1 solution, arrows are useless
    solutionCount.innerText = '1 of 1'
    if (solutions.length >= window.MAX_SOLUTIONS) solutionCount.innerText += '+'
    previousSolution.disabled = true
    nextSolution.disabled = true
  } else {
    solutionCount.innerText = (num + 1) + ' of ' + solutions.length
    if (solutions.length >= window.MAX_SOLUTIONS) solutionCount.innerText += '+'
    previousSolution.disabled = false
    nextSolution.disabled = false
    previousSolution.onclick = function() {_showSolution(solutions, num - 1)}
    nextSolution.onclick = function() {_showSolution(solutions, num + 1)}
  }
  if (solutions[num] != undefined) {
    solutions[num].name = puzzle.name
    puzzle = solutions[num]
    // Redraws the puzzle *and* adds editor hooks (so that we can return to editing)
    // There's no need to reload all the additional meta elements, since the puzzle isn't
    // actually changing, we're just drawing on it.
    _drawPuzzle()
    // Only enable the publish button if there was a solution.
    document.getElementById('publish').disabled = false
  }
}

var currentPublishRequest
function publishPuzzle() {
  // Clone the puzzle to ensure it's not modified while the request is being constructed
  var puzzleCopy = puzzle.clone()
  var request = new XMLHttpRequest()
  request.onreadystatechange = function() {
    // Don't continue if the request was cancelled or another request was started in the meantime.
    if (this !== currentPublishRequest) return
    if (this.readyState != XMLHttpRequest.DONE) return

    var publish = document.getElementById('publish')
    if (this.status == 200) {
      publish.innerText = 'Published, click here to play your puzzle!'
      var url = '/play/' + this.responseText
      publish.onclick = function() {
        window.location = url
      }
    } else {
      publish.innerText = 'Could not validate puzzle!'
    }
  }
  request.timeout = 120000 // 120,000 milliseconds = 2 minutes
  request.open('POST', '/publish', true)
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

  var requestBody = 'title=' + puzzle.name
  delete puzzle.name // Puzzle name should be sourced only from the title
  requestBody += '&solution=' + puzzleCopy.serialize()
  puzzleCopy.clearLines()
  requestBody += '&puzzle=' + puzzleCopy.serialize()

  request.send(requestBody)
  currentPublishRequest = request

  var publish = document.getElementById('publish')
  publish.onclick = null
  publish.innerText = 'Validating puzzle...'
}

// Returns the next value in the list.
// If the value is not found, defaults to the first element.
// If the value is found, but is the last value, returns undefined.
function _getNextValue(list, value) {
  var index = list.indexOf(value)
  return list[index + 1]
}

// Called whenever a grid cell is clicked. Uses the global activeParams to know
// what combination of shape & color are currently selected.
// This function also ensures that the resulting puzzle is still sane, and will modify
// the puzzle to add symmetrical elements, remove newly invalidated elements, etc.
function _onElementClicked(x, y) {
  if (activeParams.type === 'start') {
    if (x%2 === 1 && y%2 === 1) return
    if (puzzle.grid[x][y].gap != undefined) return

    if (puzzle.grid[x][y].start != true) {
      puzzle.grid[x][y].start = true
    } else {
      puzzle.grid[x][y].start = undefined
    }
    if (puzzle.symmetry != undefined) {
      var sym = puzzle.getSymmetricalPos(x, y)
      puzzle.updateCell2(sym.x, sym.y, 'start', puzzle.grid[x][y].start)
    }
  } else if (activeParams.type === 'end') {
    if (x%2 === 1 && y%2 === 1) return
    if (puzzle.grid[x][y].gap != undefined) return

    var validDirs = puzzle.getValidEndDirs(x, y)

    // If (x, y) is an endpoint, loop to the next direction
    // If the direction loops past the end (or there are no valid directions),
    // remove the endpoint by setting to undefined.
    var dir = _getNextValue(validDirs, puzzle.grid[x][y].end)
    puzzle.grid[x][y].end = dir
    if (puzzle.symmetry != undefined) {
      var sym = puzzle.getSymmetricalPos(x, y)
      var symmetricalDir = puzzle.getSymmetricalDir(dir)
      puzzle.updateCell2(sym.x, sym.y, 'end', symmetricalDir)
    }
  } else if (activeParams.type === 'dot') {
    if (x%2 === 1 && y%2 === 1) return
    var dotColors = [undefined, 1]
    if (puzzle.symmetry != undefined) {
      dotColors.push(2)
      dotColors.push(3)
    }
    dotColors.push(4)
    puzzle.grid[x][y].dot = _getNextValue(dotColors, puzzle.grid[x][y].dot)
    puzzle.grid[x][y].gap = undefined
  } else if (activeParams.type === 'gap') {
    if (x%2 === y%2) return
    puzzle.grid[x][y].gap = _getNextValue([undefined, 1, 2], puzzle.grid[x][y].gap)
    puzzle.grid[x][y].dot = undefined
    puzzle.grid[x][y].start = undefined
    puzzle.grid[x][y].end = undefined
    // Ensure that a symmetrical start or end is no longer impossible
    if (puzzle.symmetry != undefined) {
      var sym = puzzle.getSymmetricalPos(x, y)
      puzzle.grid[sym.x][sym.y].start = undefined
      puzzle.grid[sym.x][sym.y].end = undefined
    }

    // This potentially isolated a start/endpoint, so ensure that they are removed.
    for (var i=x-1; i<x+2; i++) {
      for (var j=y-1; j<y+2; j++) {
        if (i%2 !== 0 || j%2 !== 0) continue
        var leftCell = puzzle.getCell(i - 1, j)
        if (leftCell != undefined && leftCell.gap !== 2) continue
        var rightCell = puzzle.getCell(i + 1, j)
        if (rightCell != undefined && rightCell.gap !== 2) continue
        var topCell = puzzle.getCell(i, j - 1)
        if (topCell != undefined && topCell.gap !== 2) continue
        var bottomCell = puzzle.getCell(i, j + 1)
        if (bottomCell != undefined && bottomCell.gap !== 2) continue

        // At this point, the cell has no defined or non-gap2 neighbors (isolated)
        puzzle.updateCell2(i, j, 'start', false)
        puzzle.updateCell2(i, j, 'end', undefined)
        if (puzzle.symmetry != undefined) {
          var sym = puzzle.getSymmetricalPos(i, j)
          console.debug('Enforcing symmetrical startpoint at', sym.x, sym.y)
          puzzle.updateCell2(sym.x, sym.y, 'start', false, 'end', undefined)
          puzzle.updateCell2(sym.x, sym.y, 'end', undefined)
        }
      }
    }
  } else if (['square', 'star', 'nega'].includes(activeParams.type)) {
    if (x%2 !== 1 || y%2 !== 1) return
    // Only remove the element if it's an exact match
    if (puzzle.grid[x][y] != undefined
     && puzzle.grid[x][y].type === activeParams.type
     && puzzle.grid[x][y].color === activeParams.color) {
      puzzle.grid[x][y] = undefined
    } else {
      puzzle.grid[x][y] = {
        'type': activeParams.type,
        'color': activeParams.color,
      }
    }
  } else if (['poly', 'ylop'].includes(activeParams.type)) {
    if (x%2 !== 1 || y%2 !== 1) return
    // Only remove the element if it's an exact match
    if (puzzle.grid[x][y] != undefined
     && puzzle.grid[x][y].type === activeParams.type
     && puzzle.grid[x][y].color === activeParams.color
     && puzzle.grid[x][y].polyshape === activeParams.polyshape) {
      puzzle.grid[x][y] = undefined
    } else {
      puzzle.grid[x][y] = {
        'type': activeParams.type,
        'color': activeParams.color,
        'polyshape': activeParams.polyshape,
      }
    }
  } else if (activeParams.type === 'triangle') {
    if (x%2 !== 1 || y%2 !== 1) return
    // Only increment count if exact match
    if (puzzle.grid[x][y] != undefined
     && puzzle.grid[x][y].type === activeParams.type
     && puzzle.grid[x][y].color === activeParams.color) {
      puzzle.grid[x][y].count = puzzle.grid[x][y].count % 4 + 1
      // Remove when it matches activeParams -- this allows fluid cycling
      if (puzzle.grid[x][y].count === activeParams.count) {
        puzzle.grid[x][y] = undefined
      }
    } else {
      puzzle.grid[x][y] = {
        'type':activeParams.type,
        'color':activeParams.color,
        'count':activeParams.count
      }
    }
  } else {
    console.debug('OnElementClick called but no active parameter type recognized')
    return
  }

  // Ensure adjacent endpoints are still pointing in a valid direction.
  for (var i=x-1; i<x+2; i++) {
    for (var j=y-1; j<y+2; j++) {
      var cell = puzzle.getCell(i, j)
      if (cell == undefined || cell.end == undefined) continue
      var validDirs = puzzle.getValidEndDirs(i, j)
      if (!validDirs.includes(cell.end)) {
        puzzle.grid[i][j].end = validDirs[0]
        if (puzzle.symmetry != undefined) {
          var sym = puzzle.getSymmetricalPos(i, j)
          puzzle.grid[sym.x][sym.y] = validDirs[0]
        }
      }
    }
  }
  _writePuzzle()
  _reloadPuzzle()
}

var symbolData = {
  'start': {'type':'start', 'title':'Start point'},
  'end': {'type':'end', 'y':18, 'dir':'top', 'title':'End point'},
  'gap': {'type':'gap', 'title':'Line break'},
  'dot': {'type':'dot', 'title':'Dot'},
  'square': {'type':'square', 'title':'Square'},
  'star': {'type':'star', 'title':'Star'},
  'nega': {'type':'nega', 'title':'Negation'},
  'triangle': {'type':'triangle', 'count':1, 'title':'Triangle'},
  'poly': {'type':'poly', 'title':'Polyomino'},
  'rpoly': {'type':'poly', 'title':'Rotatable polyomino'},
  'ylop': {'type':'ylop', 'title':'Negation polyomino'},
  'rylop': {'type':'ylop', 'title':'Rotatable negation polyomino'},
}
function _drawSymbolButtons() {
  var symbolTable = document.getElementById('symbolButtons')
  symbolTable.style.display = null
  for (var button of symbolTable.getElementsByTagName('button')) {
    var params = symbolData[button.id]
    params.id = button.id
    params.height = 64
    params.width = 64
    params.border = 2
    if (activeParams.id === button.id) {
      button.parentElement.style.background = BORDER
    } else {
      button.parentElement.style.background = null
    }
    button.style.padding = 0
    button.style.border = params.border
    button.style.height = params.height + 2*params.border
    button.style.width = params.width + 2*params.border
    button.title = params.title
    button.params = params
    if (['poly', 'rpoly', 'ylop', 'rylop'].includes(button.id)) {
      button.params.polyshape = activeParams.polyshape
      if (button.id[0] == 'r') {
        button.params.polyshape |= window.ROTATION_BIT
      } else {
        button.params.polyshape &= ~window.ROTATION_BIT
      }
      button.onclick = function() {
        _reloadPuzzle() // Disable manual solve mode to allow puzzle editing
        if (activeParams.id === this.id) {
          activeParams = Object.assign(activeParams, this.params)
          _shapeChooser()
        } else {
          activeParams = Object.assign(activeParams, this.params)
          _drawSymbolButtons()
        }
      }
    } else if (button.id === 'triangle') {
      button.onclick = function() {
        _reloadPuzzle() // Disable manual solve mode to allow puzzle editing
        if (activeParams.id === this.id) {
          symbolData.triangle.count = symbolData.triangle.count % 4 + 1
          activeParams.count = symbolData.triangle.count
        }
        activeParams = Object.assign(activeParams, this.params)
        _drawSymbolButtons()
      }
    } else {
      button.onclick = function() {
        _reloadPuzzle() // Disable manual solve mode to allow puzzle editing
        activeParams = Object.assign(activeParams, this.params)
        _drawSymbolButtons()
      }
    }
    while (button.firstChild) button.removeChild(button.firstChild)
    button.appendChild(window.drawSymbol(params))
  }
}

function _drawColorButtons() {
  var colorTable = document.getElementById('colorButtons')
  colorTable.style.display = null
  var changeActiveColor = function() {
    _reloadPuzzle() // Disable manual solve mode to allow puzzle editing
    activeParams.color = this.id
    _drawColorButtons()
  }
  for (var button of colorTable.getElementsByTagName('button')) {
    var params = {'width':146, 'height':45, 'border':2}
    params.text = button.id
    params.color = button.id
    if (activeParams.color === button.id) {
      button.parentElement.style.background = window.BORDER
    } else {
      button.parentElement.style.background = null
    }
    button.style.padding = 0
    button.style.border = params.border
    button.style.height = params.height + 2*params.border
    button.style.width = params.width + 2*params.border
    button.onclick = changeActiveColor
    while (button.firstChild) button.removeChild(button.firstChild)
    params.type = 'crayon'
    button.appendChild(window.drawSymbol(params))
  }
}

function _shapeChooser() {
  var puzzle = document.getElementById('puzzle')
  puzzle.style.opacity = 0

  var anchor = document.createElement('div')
  anchor.id = 'anchor'
  anchor.style.width = '99%'
  anchor.style.height = '100%'
  anchor.style.position = 'absolute'
  anchor.style.top = 0
  anchor.onmousedown = function(event) {_shapeChooserClick(event)}
  document.body.appendChild(anchor)

  var chooser = document.createElement('div')
  puzzle.parentElement.insertBefore(chooser, puzzle)
  chooser.id = 'chooser'
  chooser.style.display = 'flex'
  chooser.style.position = 'absolute'
  chooser.style.width = '100%'
  chooser.style.height = '100%'
  chooser.style.minWidth = '400px'
  chooser.style.zIndex = 1 // Position in front of the puzzle

  var chooserTable = document.createElement('table')
  chooser.appendChild(chooserTable)
  chooserTable.id = 'chooserTable'
  chooserTable.setAttribute('cellspacing', '24px')
  chooserTable.setAttribute('cellpadding', '0px')
  chooserTable.style.padding = 25
  chooserTable.style.background = window.BACKGROUND
  chooserTable.style.border = window.BORDER
  chooserTable.onmousedown = function(event) {_shapeChooserClick(event, this)}
  for (var x=0; x<4; x++) {
    var row = chooserTable.insertRow(x)
    for (var y=0; y<4; y++) {
      var cell = row.insertCell(y)
      cell.powerOfTwo = 1 << (x + y*4)
      cell.onmousedown = function(event) {_shapeChooserClick(event, this)}
      cell.style.width = 58
      cell.style.height = 58
      if ((activeParams.polyshape & cell.powerOfTwo) !== 0) {
        cell.clicked = true
        cell.style.background = 'black'
      } else {
        cell.clicked = false
        cell.style.background = FOREGROUND
      }
    }
  }
}

function _shapeChooserClick(event, cell) {
  var chooser = document.getElementById('chooser')
  if (cell == undefined) {
    var anchor = document.getElementById('anchor')
    var puzzle = document.getElementById('puzzle')

    chooser.parentElement.removeChild(chooser)
    anchor.parentElement.removeChild(anchor)
    puzzle.style.opacity = null
    event.stopPropagation()
    return
  }
  // Clicks inside the green box are non-closing
  if (cell.id === 'chooserTable') {
    event.stopPropagation()
    return
  }
  cell.clicked = !cell.clicked
  activeParams.polyshape ^= cell.powerOfTwo
  if (cell.clicked) {
    cell.style.background = 'black'
  } else {
    cell.style.background = window.FOREGROUND
  }
  _drawSymbolButtons()
}

// All puzzle elements remain fixed, the edge you're dragging is where the new
// row/column is added. The endpoint will try to stay fixed, but may be re-oriented.
// In symmetry mode, we will preserve symmetry and try to guess how best to keep start
// and endpoints in sync with the original design.
function resizePuzzle(dx, dy, id) {
  var newWidth = puzzle.width + dx
  var newHeight = puzzle.height + dy
  console.log('Resizing puzzle of size', puzzle.width, puzzle.height, 'to', newWidth, newHeight)

  if (newWidth <= 0 || newHeight <= 0) return false
  if (newWidth > 21 || newHeight > 21) return false
  if (puzzle.symmetry != undefined && puzzle.symmetry.x && newWidth <= 2) return false
  if (puzzle.symmetry != undefined && puzzle.symmetry.y && newHeight <= 2) return false

  var xOffset = (id.includes('left') ? dx : 0)
  var yOffset = (id.includes('top') ? dy : 0)

  console.log('Shifting contents by', xOffset, yOffset)

  // Determine if the cell at x, y should be copied from the original.
  // For non-symmetrical puzzles, the answer is always 'no' -- all elements should be directly copied across.
  // For non-pillar symmetry puzzles, we should persist all elements on the half the puzzle which is furthest from the dragged edge. This will keep the puzzle contents stable as we add a row. The exception to this rule is when we expand. We are creating one new row or column which has no source location. For example, for width=3 newWidth=5, the column at x=2 is appearing from nowhere -- it should not have endpoints/startpoints. This is especially apparent in rotational symmetry puzzles.
  // x,y should be locations from the new grid
  var PERSIST = 0
  var COPY = 1
  var CLEAR = 2
  function shouldCopyCell(x, y) {
    if (puzzle.symmetry == undefined) return PERSIST

    // Symmetry copies one half of the grid to the other, and selects the far side from
    // the dragged edge to be the master copy. This is so that drags feel 'smooth' wrt
    // internal elements, i.e. it feels like dragging away is just inserting a column/row.
    if (puzzle.symmetry.x) {
      if (dx > 0 && x == (newWidth-1)/2) return CLEAR
      if (id.includes('right')  && x >= (newWidth+1)/2) return COPY
      if (id.includes('left')   && x <= (newWidth-1)/2) return COPY
    }
    if (puzzle.symmetry.y) {
      if (dy > 0 && y == (newHeight-1)/2) return CLEAR
      if (id.includes('bottom') && y >= (newHeight+1)/2) return COPY
      if (id.includes('top')    && y <= (newHeight-1)/2) return COPY
    }

    return PERSIST
  }

  var oldPuzzle = puzzle.clone()
  puzzle.newGrid(newWidth, newHeight)

  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = oldPuzzle.getCell(x - xOffset, y - yOffset)

      switch (shouldCopyCell(x, y)) {
      case PERSIST:
        if (cell == undefined) continue // No need to 'persist' an empty cell
        console.spam('At', x - xOffset, y - yOffset, 'persisting', JSON.stringify(cell))
        break
      case COPY:
        var sym = puzzle.getSymmetricalPos(x, y)
        var symCell = oldPuzzle.getCell(sym.x - xOffset, sym.y - yOffset)
        console.spam('At', x - xOffset, y - yOffset, 'copying', JSON.stringify(symCell), 'from', sym.x - xOffset, sym.y - yOffset)
        if (symCell != undefined) {
          if (cell == undefined) cell = {}
          cell.end = puzzle.getSymmetricalDir(symCell.end)
          cell.start = symCell.start
        }
        break
      case CLEAR:
        if (cell != undefined) {
          cell.start = undefined
          cell.end = undefined
        }
        break
      }

      puzzle.setCell(x, y, cell)
    }
  }

  // Check to make sure that all endpoints are still pointing in valid directions.
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined) continue
      if (cell.end == undefined) continue

      if (puzzle.symmetry == undefined) {
        var validDirs = puzzle.getValidEndDirs(x, y)
        if (validDirs.includes(cell.end)) continue

        if (validDirs.length === 0) {
          console.log('Endpoint at', x, y, 'no longer fits on the grid')
          puzzle.updateCell2(x, y, 'end', undefined)
        } else {
          console.log('Changing direction of endpoint', x, y, 'from', cell.end, 'to', validDirs[0])
          puzzle.updateCell2(x, y, 'end', validDirs[0])
        }
      } else {
        var sym = puzzle.getSymmetricalPos(x, y)
        var symDir = puzzle.getSymmetricalDir(cell.end)
        var validDirs = puzzle.getValidEndDirs(x, y)
        var validSymDirs = puzzle.getValidEndDirs(sym.x, sym.y)
        if (validDirs.includes(cell.end) && validSymDirs.includes(symDir)) continue

        while (validDirs.length > 0) {
          var dir = validDirs.pop()
          symDir = puzzle.getSymmetricalDir(dir)
          if (validDirs.includes(dir) && validSymDirs.includes(symDir)) {
            console.log('Changing direction of endpoint', x, y, 'from', cell.end, 'to', dir)
            puzzle.updateCell2(x, y, 'end', dir)
            puzzle.updateCell2(sym.x, sym.y, 'end', symDir)
            break
          }
        }
        if (validDirs.length === 0 || validSymDirs.length === 0) {
          console.log('Endpoint at', x, y, 'no longer fits on the grid')
          var cell = puzzle.getCell(x, y)
          puzzle.updateCell2(x, y, 'end', undefined)
          puzzle.updateCell2(sym.x, sym.y, 'end', undefined)
        }
      }
    }
  }
  return true
}

function _dragStart(event, elem) {
  dragging = {'x':event.clientX, 'y':event.clientY}
  console.log('Drag started at', dragging.x, dragging.y)

  var anchor = document.createElement('div')
  document.body.appendChild(anchor)

  anchor.id = 'anchor'
  anchor.style.position = 'absolute'
  anchor.style.top = 0
  anchor.style.width = '99%'
  anchor.style.height = '100%'
  anchor.style.cursor = elem.style.cursor
  document.onmousemove = function(event) {
    if (event.buttons === 0) {
      console.log('Drag ended')
      dragging = undefined
      var anchor = document.getElementById('anchor')
      anchor.parentElement.removeChild(anchor)
      document.onmousemove = undefined
      return
    }
    _dragMove(event, elem)
  }
}

function _dragMove(event, elem) {
  console.spam(event.clientX, event.clientY, dragging)
  if (dragging == undefined) return
  var dx = 0
  var dy = 0
  if (elem.id.includes('left')) {
    dx = dragging.x - event.clientX
  } else if (elem.id.includes('right')) {
    dx = event.clientX - dragging.x
  }
  if (elem.id.includes('top')) {
    dy = dragging.y - event.clientY
  } else if (elem.id.includes('bottom')) {
    dy = event.clientY - dragging.y
  }

  var xLim = 40
  // Symmetry + Pillars requires an even number of cells (2xN, 4xN, etc)
  if (puzzle.symmetry != undefined && puzzle.pillar === true) {
    xLim = 80
  }

  var yLim = 40
  // 4x4 and larger will only expand downwards, so we have to require more motion.
  if (puzzle.height >= 9) {
    var yLim = 60
  }

  while (Math.abs(dx) >= xLim) {
    if (!resizePuzzle(2 * Math.sign(dx), 0, elem.id)) break
    _writePuzzle()
    _reloadPuzzle()
    dx -= Math.sign(dx) * xLim
    dragging.x = event.clientX
  }

  while (Math.abs(dy) >= yLim) {
    if (!resizePuzzle(0, 2 * Math.sign(dy), elem.id)) break
    _writePuzzle()
    _reloadPuzzle()
    dy -= Math.sign(dy) * yLim
    dragging.y = event.clientY
  }
}
