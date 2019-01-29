window.DISABLE_CACHE = true
var activeParams = {'id':'', 'color':'black', 'polyshape':71}
var puzzle
var dragging
// @Cleanup: Can this be non-global?
var solutions = []

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
  if (puzzleList == undefined) throw "Attempted to write puzzle list but none was provided"
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
    // @Cleanup: This logic is duplicated from createSerializedPuzzle
    puzzle = Puzzle.deserialize(serialized)
    _drawPuzzle()
  } catch (e) {
    console.log(e)
    console.log('Could not parse puzzle, deleting')
    deletePuzzle() // Will call readPuzzle() again
  }
}

// The global puzzle object has been modified, serialize it to localStorage.
// Finally, we redraw the puzzle (in case modifications were made) unless the caller asks us not to.
// We also any potential solution lines from the puzzle
function _writePuzzle(redraw=true) {
  console.log('Writing puzzle', puzzle)
  puzzle.clearLines()

  var puzzleList = _readPuzzleList()
  // @Robustness: Some intelligence about showing day / month / etc depending on date age
  puzzleList[0] = puzzle.name + ' on ' + (new Date()).toLocaleString()
  window.localStorage.setItem(puzzleList[0], puzzle.serialize())
  _writePuzzleList(puzzleList)

  if (redraw) {
    // @Hack: This doesn't feel like the right place...
    setSolveMode(false)
    // _drawPuzzle()
  }
}

// Create a new puzzle. If none is provided, a default, empty puzzle is created.
// Note that this is not idempotent; you can create as many new puzzles as you want.
function _createPuzzle(newPuzzle) {
  console.log('Creating puzzle', newPuzzle)
  // Make way for the new puzzle
  var puzzleList = _readPuzzleList()
  puzzleList.unshift(undefined)
  _writePuzzleList(puzzleList)

  puzzle = newPuzzle
  _writePuzzle()
}

// Create a new puzzle from serialized. Note that this may fail!
function _createSerializedPuzzle(serialized) {
  console.log('Creating puzzle from serialized', serialized)
  try {
    var newPuzzle = Puzzle.deserialize(serialized) // Will throw for most invalid puzzles
  } catch (e) {
    console.error('Failed to load serialized puzzle', e)
    return false
  }
  _createPuzzle(newPuzzle)
  return true
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

// Redraws the puzzle.
// Also updates the dropdown for puzzle style and adds the editor hotspots.
function _drawPuzzle() {
  document.getElementById('puzzleName').innerText = puzzle.name
  window.draw(puzzle)
  document.getElementById('solutionViewer').style.display = 'none'

  document.getElementById('solveAuto').disabled = false
  if (puzzle.symmetry != undefined) {
    // 6x6 is the max for symmetry puzzles
    if (puzzle.grid.length > 13 || puzzle.grid[0].length > 13) {
      document.getElementById('solveAuto').disabled = true
    }
  } else if (puzzle.pillar != undefined) {
    // 4x4 is the max for non-symmetry pillar puzzles
    if (puzzle.grid.length > 9 || puzzle.grid[0].length > 9) {
      document.getElementById('solveAuto').disabled = true
    }
  } else {
    // 5x5 is the max for non-symmetry, non-pillar puzzles
    if (puzzle.grid.length > 11 || puzzle.grid[0].length > 11) {
      document.getElementById('solveAuto').disabled = true
    }
  }

  var publish = document.getElementById('publish')
  publish.disabled = true
  publish.innerText = 'Publish'
  publish.onclick = function() {publishPuzzle()}
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
  for (var x=0; x<puzzle.grid.length; x++) {
    var yPos = 40
    var width = (x%2 === 0 ? 24 : 58)
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var height = (y%2 === 0 ? 24 : 58)
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
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

//** Buttons which the user can click on
function createEmptyPuzzle() {
  console.log('Creating empty puzzle')
  newPuzzle = new Puzzle(4, 4)
  newPuzzle.grid[0][8].start = true
  newPuzzle.grid[8][0].end = 'right'
  newPuzzle.name = 'Unnamed Puzzle'
  _createPuzzle(newPuzzle)
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
  if (!_createSerializedPuzzle(serialized)) {
    // Only alert if user tried to enter data
    if (serialized) alert('Not a valid puzzle!')
    return
  }
}

// Set the symmetry and pillar style, and ensure the puzzle is updated to match
function setStyle(style) {
  console.log('Setting style to', style)
  if (style === 'Default' || style === 'Pillar') {
    puzzle.symmetry = undefined
  } else if (style === 'Horizontal Symmetry' || style === 'Pillar (H Symmetry)') {
    puzzle.symmetry = {'x':true, 'y':false}
  } else if (style === 'Vertical Symmetry' || style === 'Pillar (V Symmetry)') {
    puzzle.symmetry = {'x':false, 'y':true}
  } else if (style === 'Rotational Symmetry' || style === 'Pillar (R Symmetry)') {
    puzzle.symmetry = {'x':true, 'y':true}
  } else if (style === 'Pillar (Two Lines)') {
    puzzle.symmetry = {'x':false, 'y':false}
  } else {
    console.error('Attempted to set unknown style', style)
    return
  }

  // If the puzzle is in non-symmetry mode, replace all colored dots with black
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined || cell.type != 'line') continue
      if (puzzle.symmetry == undefined) {
        if (cell.dot === 2 || cell.dot === 3) {
          puzzle.grid[x][y].dot = 1
        }
      } else {
        if (cell.start === true) {
          var sym = puzzle.getSymmetricalPos(x, y)
          console.debug('Copying startpoint from', x, y, 'to', sym.x, sym.y)
          puzzle.updateCell(sym.x, sym.y, {'start':true})
        } else if (cell.end != undefined) {
          var sym = puzzle.getSymmetricalPos(x, y)
          console.debug('Copying endpoint from', x, y, 'to', sym.x, sym.y)
          puzzle.updateCell(sym.x, sym.y, {'end':puzzle.getSymmetricalDir(cell.end)})
        }
      }
    }
  }

  // Delayed until after symmetry enforcement to avoid oob
  puzzle.pillar = style.includes('Pillar')

  // @Robustness: I think this has a bug with 1xN
  var width = puzzle.grid.length
  // Non-pillar to pillar
  if (puzzle.pillar === true) {
    if (width === 1) {
      width = 2
    } else {
      width -= width % 2 // Width must be a multiple of 2
    }
    if (puzzle.symmetry != undefined) {
      width -= width % 4 // Width must be a multiple of 4
    }
  } else if (puzzle.pillar === false) {
    width += 1 - width % 2
  }

  resizePuzzle(width - puzzle.grid.length, 0, 'right')
  _writePuzzle()
}

function setSolveMode(value) {
  document.getElementById('solveMode').checked = value
  if (value === true) {
    window.TRACE_COMPLETION_FUNC = function(solution) {
      puzzle = solution
      document.getElementById('publish').disabled = false
    }
    // @Hack: I should write an function to clear editor interaction points, and then use that here.
    _drawPuzzle()
    window.draw(puzzle)
  } else {
    puzzle.clearLines()
    window.TRACE_COMPLETION_FUNC = undefined
    _drawPuzzle()
  }
}

function solvePuzzle() {
  setSolveMode(false)
  solutions = window.solve(puzzle)
  _showSolution(0)
}
//** End of user interaction points

window.onload = function() {
  _readPuzzle() // Will fall back to a new puzzle if needed.

  _drawSymbolButtons()
  _drawColorButtons()

  var puzzleName = document.getElementById('puzzleName')
  // Use oninput for default processing
  puzzleName.oninput = function(event) {
    // Prevent newlines in titles
    if (this.innerText.includes('\n')) {
      this.innerText = this.innerText.replace('\n', '')
    }
    // Ensure that puzzle names are non-empty (input box would disappear)
    if (this.innerText.length === 0) {
      this.innerText = 'Unnamed Puzzle'
    }
    // This only fires if onkeypress is bypassed somehow (e.g. paste)
    if (this.innerText.length >= 50) {
      this.innerText = this.innerText.substring(0, 50)
    }
    // Update the puzzle with the new name
    puzzle.name = this.innerText
    _writePuzzle(false)
  }
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

  for (var resize of document.getElementsByClassName('resize')) {
    resize.onmousedown = function(event) {_dragStart(event, this)}
  }
}

function _showSolution(num) {
  if (num < 0) num = solutions.length - 1
  if (num >= solutions.length) num = 0

  var previousSolution = document.getElementById('previousSolution')
  var solutionCount = document.getElementById('solutionCount')
  var nextSolution = document.getElementById('nextSolution')

  // Buttons & text
  if (solutions.length < 2) { // 0 or 1 solution(s), arrows are useless
    solutionCount.innerText = solutions.length + ' of ' + solutions.length
    previousSolution.disabled = true
    nextSolution.disabled = true
  } else {
    solutionCount.innerText = (num + 1) + ' of ' + solutions.length
    previousSolution.disabled = false
    nextSolution.disabled = false
    previousSolution.onclick = function() {_showSolution(num - 1)}
    nextSolution.onclick = function() {_showSolution(num + 1)}
  }
  if (solutions[num] != undefined) {
    solutions[num].name = puzzle.name
    puzzle = solutions[num]
    _drawPuzzle()
    document.getElementById('publish').disabled = false
  }
  document.getElementById('solutionViewer').style.display = null
}

var currentPublishRequest
function publishPuzzle() {
  if (document.getElementById('solveMode').checked === true) {
    var serialied = puzzle.serialize()
  } else {

  }

  var request = new XMLHttpRequest()
  request.onreadystatechange = function() {
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
      publish.innerText = 'Error: ' + this.responseText
    }
  }
  request.timeout = 120000 // 120,000 milliseconds = 2 minutes
  request.open('POST', '/publish', true)
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  var requestBody = 'solution=' + puzzle.serialize()
  puzzle.clearLines()
  requestBody += '&puzzle=' + puzzle.serialize()
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

    if (puzzle.grid[x][y].start == undefined) {
      puzzle.grid[x][y].start = true
    } else {
      puzzle.grid[x][y].start = undefined
    }
    if (puzzle.symmetry != undefined) {
      var sym = puzzle.getSymmetricalPos(x, y)
      puzzle.updateCell(sym.x, sym.y, {'start':puzzle.grid[x][y].start})
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
      puzzle.updateCell(sym.x, sym.y, {'end':symmetricalDir})
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
        puzzle.updateCell(i, j, {'start':false, 'end':undefined})
        if (puzzle.symmetry != undefined) {
          var sym = puzzle.getSymmetricalPos(i, j)
          console.debug('Enforcing symmetrical startpoint at', sym.x, sym.y)
          puzzle.updateCell(sym.x, sym.y, {'start':false, 'end':undefined})
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
        setSolveMode(false)
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
        setSolveMode(false)
        if (activeParams.id === this.id) {
          symbolData.triangle.count = symbolData.triangle.count % 4 + 1
          activeParams.count = symbolData.triangle.count
        }
        activeParams = Object.assign(activeParams, this.params)
        _drawSymbolButtons()
      }
    } else {
      button.onclick = function() {
        setSolveMode(false)
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
    setSolveMode(false)
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

  var chooser = document.createElement('table')
  puzzle.parentElement.insertBefore(chooser, puzzle)
  chooser.id = 'chooser'
  chooser.setAttribute('cellspacing', '24px')
  chooser.setAttribute('cellpadding', '0px')
  chooser.style.zIndex = 1 // Position in front of the puzzle
  chooser.style.position = 'absolute'
  chooser.style.padding = 25
  chooser.style.minWidth = '400px'
  chooser.style.background = window.BACKGROUND
  chooser.style.border = window.BORDER
  chooser.onmousedown = function(event) {_shapeChooserClick(event, this)}
  for (var x=0; x<4; x++) {
    var row = chooser.insertRow(x)
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
  // Clicks inside the chooser box are non-closing
  if (cell.id === 'chooser') {
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
  var width = puzzle.grid.length
  var height = puzzle.grid[0].length
  var newWidth = width + dx
  var newHeight = height + dy
  console.log('Resizing puzzle of size', width, height, 'to', newWidth, newHeight)

  if (newWidth <= 0 || newHeight <= 0) return false
  if (newWidth > 21 || newHeight > 21) return false

  var xOffset = (id.includes('left') ? dx : 0)
  var yOffset = (id.includes('top') ? dy : 0)

  console.log('Shifting contents by', xOffset, yOffset)

  var savedGrid = puzzle.grid
  puzzle.newGrid(newWidth, newHeight)

  for (var x=0; x<width; x++) {
    for (var y=0; y<height; y++) {
      var cell = savedGrid[x][y]
      if (cell == undefined) continue
      if (cell.end != undefined) {
        var validDirs = puzzle.getValidEndDirs(x + xOffset, y + yOffset)
        if (validDirs.length === 0) {
          console.log('Endpoint at', x, y, 'no longer fits on the grid')
          continue
        }
        // @Cleanup: This is duplicated in onElementClicked, maybe this function should be smarter?
        if (!validDirs.includes(cell.end)) {
          console.log('Changing direction of endpoint', x, y, 'from', cell.end, 'to', validDirs[0])
          cell.end = validDirs[0]
        }
      }
      puzzle.updateCell(x + xOffset, y + yOffset, cell)
    }
  }

  // Symmetry copies one half of the grid to the other, and selects the far side from the
  // dragging edge to be the master copy.
  // @Cleanup: This needs to implement ranges for pillars.
  if (puzzle.symmetry != undefined) {
    if (id.includes('right')) {
      var xIter = [0, (newWidth-1)/2, 1]
    } else if (id.includes('left')) {
      var xIter = [newWidth-1, (newWidth-1)/2, -1]
    } else {
      var xIter = [0, newWidth-1, 1]
    }
    if (id.includes('bottom')) {
      var yIter = [0, (newHeight-1)/2, 1]
    } else if (id.includes('top')) {
      var yIter = [newHeight-1, (newHeight-1)/2, -1]
    } else {
      var yIter = [0, newHeight, 1]
    }
    console.debug('Half-copying grid in range', xIter, yIter)

    for (var x = xIter[0]; x != xIter[1]; x += xIter[2]) {
      for (var y = yIter[0]; y != yIter[1]; y += yIter[2]) {
        if ((x%2 === 1 || x%2 === -1) && y%2 === 1) continue
        var cell = puzzle.getCell(x, y)
        var sym = puzzle.getSymmetricalPos(x, y)
        console.spam('Copying cell', JSON.stringify(cell), 'at', x, y)
        puzzle.updateCell(sym.x, sym.y, {
          'start':cell.start,
          'end':puzzle.getSymmetricalDir(cell.end),
        })
        console.spam('Updated cell', JSON.stringify(puzzle.getCell(sym.x, sym.y)), 'at', sym.x, sym.y)
      }
    }
  }
  return true
}

function _dragStart(event, elem) {
  dragging = {'x':event.clientX, 'y':event.clientY}

  var anchor = document.createElement('div')
  document.body.appendChild(anchor)

  anchor.id = 'anchor'
  anchor.style.position = 'absolute'
  anchor.style.top = 0
  anchor.style.width = '99%'
  anchor.style.height = '100%'
  anchor.style.cursor = elem.style.cursor
  anchor.onmousemove = function(event) {_dragMove(event, elem)}
  anchor.onmouseup = function() {
    dragging = undefined
    var anchor = document.getElementById('anchor')
    anchor.parentElement.removeChild(anchor)
  }
}

function _dragMove(event, elem) {
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

  var xLim = 41
  // Symmetry + Pillars requires an even number of cells (2xN, 4xN, etc)
  if (puzzle.symmetry != undefined && puzzle.pillar === true) {
    xLim = 82
  }

  if (Math.abs(dx) >= xLim || Math.abs(dy) >= 41) {
    if (!resizePuzzle(2*Math.round(dx/41), 2*Math.round(dy/41), elem.id)) return
    _writePuzzle()

    // If resize succeeded, set a new reference point for future drag operations
    dragging.x = event.clientX
    dragging.y = event.clientY
  }
}
