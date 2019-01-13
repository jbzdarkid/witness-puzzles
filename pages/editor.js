window.DISABLE_CACHE = true
var activeParams = {'id':'', 'color':'black', 'polyshape': 71}
var puzzle
var dragging
var solutions = []

window.onload = function() {
  var activePuzzle = window.localStorage.getItem('activePuzzle')
  var serialized = window.localStorage.getItem(activePuzzle)

  newPuzzle() // Load an empty puzzle so that we have a fall-back
  if (_tryLoadSerializedPuzzle(serialized)) {
    window.localStorage.setItem('activePuzzle', activePuzzle)
  }

  _drawSymbolButtons()
  _drawColorButtons()
  var puzzleName = document.getElementById('puzzleName')
  puzzleName.oninput = function() {savePuzzle()}
  puzzleName.onkeypress = function(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.blur()
    }
    if (this.innerText.length >= 50) {
      event.preventDefault()
    }
  }

  for (var resize of document.getElementsByClassName('resize')) {
    resize.onmousedown = function(event) {_dragStart(event, this)}
  }
}

function newPuzzle() {
  puzzle = new Puzzle(4, 4)
  puzzle.grid[0][8].start = true
  puzzle.grid[8][0].end = 'right'
  puzzle.name = 'Unnamed Puzzle'
  _setActivePuzzle(puzzle)
  // This ensures that new puzzles are not added to the puzzleList until they are modified
  window.localStorage.setItem('activePuzzle', '')
}

function savePuzzle() {
  console.spam('Saving puzzle', puzzle.name)
  // Delete the old puzzle & add the current
  var activePuzzle = window.localStorage.getItem('activePuzzle')
  window.localStorage.removeItem(activePuzzle)
  _removePuzzleFromList(activePuzzle)

  // Save the new version
  puzzle.name = document.getElementById('puzzleName').innerText
  // @Robustness: Some intelligence about showing day / month / etc depending on date age
  var savedPuzzle = puzzle.name + ' on ' + (new Date()).toLocaleString()
  _addPuzzleToList(savedPuzzle)
  var serialized = puzzle.serialize()
  window.localStorage.setItem(savedPuzzle, serialized)
}

function loadPuzzle() {
  var puzzleList = JSON.parse(window.localStorage.getItem('puzzleList'))
  if (!puzzleList) return

  var buttons = document.getElementById('metaButtons')
  var loadList = document.createElement('select')
  document.body.insertBefore(loadList, buttons)
  loadList.style.width = buttons.offsetWidth
  buttons.style.display = 'none'

  for (var puzzleName of puzzleList) {
    var option = document.createElement('option')
    option.innerText = puzzleName
    loadList.appendChild(option)
  }

  loadList.value = '' // Forces onchange to fire for any selection
  loadList.onchange = function() {
    _removePuzzleFromList(this.value)
    _addPuzzleToList(this.value)

    var serialized = window.localStorage.getItem(this.value)
    if (!_tryLoadSerializedPuzzle(serialized)) {
      deletePuzzleAndLoadNext()
    }

    document.body.removeChild(buttons.previousSibling)
    document.getElementById('metaButtons').style.display = 'inline'
  }
}

function deletePuzzleAndLoadNext() {
  var activePuzzle = window.localStorage.getItem('activePuzzle')
  console.spam('Deleting', activePuzzle)
  window.localStorage.removeItem(activePuzzle)
  _removePuzzleFromList(activePuzzle)

  var puzzleList = JSON.parse(window.localStorage.getItem('puzzleList'))
  if (puzzleList == null) puzzleList = []
  while (puzzleList.length > 0) {
    var serialized = window.localStorage.getItem(puzzleList[0])
    if (_tryLoadSerializedPuzzle(serialized)) break
    puzzleList.shift()
  }

  if (puzzleList.length === 0) {
    window.localStorage.clear()
    newPuzzle()
    return
  }
  window.localStorage.setItem('activePuzzle', puzzleList[0])
}

function importPuzzle() {
  var serialized = prompt('Paste your puzzle here:')
  if (!_tryLoadSerializedPuzzle(serialized)) {
    // Only alert if user tried to enter data
    if (serialized) alert('Not a valid puzzle!')
    return
  }
  var savedPuzzle = puzzle.name + ' on ' + (new Date()).toLocaleString()
  _addPuzzleToList(savedPuzzle)
  window.localStorage.setItem(savedPuzzle, serialized)
}

function setStyle(style) {
  console.log(style)
  if (style === 'Default') {
    puzzle.pillar = false
    puzzle.symmetry = undefined
  } else if (style === 'Horizontal Symmetry') {
    puzzle.pillar = false
    puzzle.symmetry = {'x':true, 'y':false}
  } else if (style === 'Vertical Symmetry') {
    puzzle.pillar = false
    puzzle.symmetry = {'x':false, 'y':true}
  } else if (style === 'Rotational Symmetry') {
    puzzle.pillar = false
    puzzle.symmetry = {'x':true, 'y':true}
  } else if (style === 'Pillar') {
    puzzle.pillar = true
    puzzle.symmetry = undefined
  } else if (style === 'Pillar (H Symmetry)') {
    puzzle.pillar = true
    puzzle.symmetry = {'x':true, 'y':false}
  } else if (style === 'Pillar (V Symmetry)') {
    puzzle.pillar = true
    puzzle.symmetry = {'x':false, 'y':true}
  } else if (style === 'Pillar (R Symmetry)') {
    puzzle.pillar = true
    puzzle.symmetry = {'x':true, 'y':true}
  } else if (style === 'Pillar (Two Lines)') {
    puzzle.pillar = true
    puzzle.symmetry = {'x':false, 'y':false}
  } else {
    console.error('Attempted to set unknown style', style)
    return
  }
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
  _enforceSymmetry()
  _setActivePuzzle(puzzle)
  savePuzzle()
}

// @Future: This should be more intelligent, maybe something like
// 'dedupe symmetrical elements on the old grid, then re-dupe new elements'?
function _enforceSymmetry() {
  // Ensure dots are not colored
  // Ensure start/end are appropriately paired
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      if (x%2 === 1 && y%2 === 1) continue // Ignore cells
      if (puzzle.symmetry == undefined) {
        if (puzzle.grid[x][y].dot === 2 || puzzle.grid[x][y].dot === 3) {
          console.debug('Replacing dot at', x, y, 'colored', puzzle.grid[x][y].dot, 'with color 1')
          puzzle.grid[x][y].dot = 1
        }
      } else {
        var sym = puzzle.getSymmetricalPos(x, y)
        if (puzzle.grid[x][y].start === true) {
          puzzle.updateCell(sym.x, sym.y, {'start':true})
          console.debug('Addding symmetrical startpoint at', sym.x, sym.y)
        }
        if (puzzle.grid[x][y].end != undefined) {
          var symmetricalDir = puzzle.getSymmetricalDir(puzzle.grid[x][y].end)
          puzzle.updateCell(sym.x, sym.y, {'end':symmetricalDir})
          console.debug('Addding symmetrical endpoint at', sym.x, sym.y, 'direction', symmetricalDir)
        }
      }
    }
  }
}

function solvePuzzle() {
  // If the puzzle has symbols and is large, issue a warning
  var puzzleHasSymbols = false
  for (var x=1; x<puzzle.grid.length; x+=2) {
    for (var y=1; y<puzzle.grid[x].length; y+=2) {
      if (puzzle.getCell(x, y) != undefined && puzzle.type !== 'line') {
        puzzleHasSymbols = true
        break
      }
    }
  }
  if (puzzleHasSymbols && puzzle.grid.length * puzzle.grid[0].length > 121) {
    // Larger than 5x5 (internal 11x11)
    if (!confirm('Caution: You are solving a large puzzle (>25 cells). This will take more than 5 minutes to run.')) {
      return
    }
  }
  solutions = window.solve(puzzle)
  _showSolution(0, puzzle)
}

function _showSolution(num, puzzle) {
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
    previousSolution.disabled = null
    nextSolution.disabled = null
    previousSolution.onclick = function() {_showSolution(num - 1, puzzle)}
    nextSolution.onclick = function() {_showSolution(num + 1, puzzle)}
  }
  if (solutions[num] != undefined) {
    solutions[num].name = puzzle.name
    _setActivePuzzle(solutions[num])
  }
  document.getElementById('solutionViewer').style.display = null
}

function _addPuzzleToList(puzzleName) {
  var puzzleList = JSON.parse(window.localStorage.getItem('puzzleList'))
  if (!puzzleList) puzzleList = []
  puzzleList.unshift(puzzleName)
  window.localStorage.setItem('puzzleList', JSON.stringify(puzzleList))
  window.localStorage.setItem('activePuzzle', puzzleName)
}

function _removePuzzleFromList(puzzleName) {
  console.spam('Removing puzzle', puzzleName)
  var puzzleList = JSON.parse(window.localStorage.getItem('puzzleList'))
  if (!puzzleList) puzzleList = []
  var index = puzzleList.indexOf(puzzleName)
  if (index === -1) return
  puzzleList.splice(index, 1)
  window.localStorage.setItem('puzzleList', JSON.stringify(puzzleList))
}

function _tryLoadSerializedPuzzle(serialized) {
  if (!serialized) return false
  try {
    var newPuzzle = Puzzle.deserialize(serialized) // Will throw for most invalid puzzles
    _enforceSymmetry()
    _setActivePuzzle(newPuzzle)
    puzzle = newPuzzle
    return true
  } catch (e) {
    console.error('Failed to load serialized puzzle', e)
  }
  _setActivePuzzle(puzzle) // Reload the old puzzle in case we got halfway through drawing the new one
  return false
}

// Sets the active editor puzzle. Also updates the dropdown for puzzle style and adds the editor hotspots.
// @Cleanup: Confusingly, this does not modify the localStorage value for activePuzzle...
// ^ I should clarify my scenarios for the editor. It looks like there are too many functions, which leads to confusion and bugs.
function _setActivePuzzle(puzzle) {
  document.getElementById('puzzleName').innerText = puzzle.name
  window.draw(puzzle)
  document.getElementById('publishData').setAttribute('value', puzzle.serialize())
  document.getElementById('solutionViewer').style.display = 'none'

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

// Returns the next value in the list.
// If the value is not found, defaults to the first element.
// If the value is found, but is the last value, returns undefined.
function _getNextValue(list, value) {
  var index = list.indexOf(value)
  return list[index + 1]
}

// Note: I cannot call _enforceSymmetry here, because we don't know which modification (to an endpoint, e.g.) is definitive
function _onElementClicked(x, y) {
  if (activeParams.type === 'start') {
    if (x%2 === 1 && y%2 === 1) return
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
  } else if (activeParams.type === 'gap') {
    if (x%2 === y%2) return
    puzzle.grid[x][y].gap = _getNextValue([undefined, 1, 2], puzzle.grid[x][y].gap)
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
     && puzzle.grid[x][y].polyshape === activeParams.polyshape
     && puzzle.grid[x][y].rot === activeParams.rot) {
      puzzle.grid[x][y] = undefined
    } else {
      puzzle.grid[x][y] = {
        'type': activeParams.type,
        'color': activeParams.color,
        'polyshape': activeParams.polyshape,
        'rot': activeParams.rot,
      }
    }
  } else if (activeParams.type === 'triangle') {
    if (x%2 !== 1 || y%2 !== 1) return
    // Only increment count if exact match
    if (puzzle.grid[x][y] != undefined
     && puzzle.grid[x][y].type === activeParams.type
     && puzzle.grid[x][y].color === activeParams.color) {
      puzzle.grid[x][y].count = puzzle.grid[x][y].count % 3 + 1
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
  }

  savePuzzle()
  _setActivePuzzle(puzzle)
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
  'poly': {'type':'poly', 'rot':0, 'polyshape':71, 'title':'Polyomino'},
  'rpoly': {'type':'poly', 'rot':'all', 'polyshape':71, 'title':'Negation polyomino'},
  'ylop': {'type':'ylop', 'rot':0, 'polyshape':71, 'title':'Rotatable polyomino'},
  'rylop': {'type':'ylop', 'rot':'all', 'polyshape':71, 'title':'Rotatable negation polyomino'},
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
      button.onclick = function() {
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
        if (activeParams.id === this.id) {
          symbolData.triangle.count = symbolData.triangle.count % 3 + 1
          activeParams.count = symbolData.triangle.count
        }
        activeParams = Object.assign(activeParams, this.params)
        _drawSymbolButtons()
      }
    } else {
      button.onclick = function() {
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
// row/column is added. The endpoint will try to stay fixed, but will be pulled
// to remain against the edge.
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
        if (!validDirs.includes(cell.end)) {
          console.log('Changing direction of endpoint', x, y, 'from', cell.end, 'to', validDirs[0])
          cell.end = validDirs[0]
        }
      }
      puzzle.updateCell(x + xOffset, y + yOffset, cell)
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
    _enforceSymmetry()
    _setActivePuzzle(puzzle)
    savePuzzle()

    // If resize succeeded, set a new reference point for future drag operations
    dragging.x = event.clientX
    dragging.y = event.clientY
  }
}
