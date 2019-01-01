window.DISABLE_CACHE = true
var activeParams = {'id':'', 'color':'black', 'polyshape': 71}
var puzzle
var dragging = false
var solutions = []

window.onload = function() {
  var activePuzzle = window.localStorage.getItem('activePuzzle')
  var serialized = window.localStorage.getItem(activePuzzle)

  newPuzzle() // Load an empty puzzle so that we have a fall-back
  if (_tryUpdatePuzzle(serialized)) {
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
  puzzle.addEnd(8, 0, 'right')
  puzzle.name = 'Unnamed Puzzle'
  _redraw(puzzle)
  window.localStorage.setItem('activePuzzle', '')
}

function savePuzzle() {
  // Delete the old puzzle & add the current
  var activePuzzle = window.localStorage.getItem('activePuzzle')
  window.localStorage.removeItem(activePuzzle)
  _removePuzzleFromList(activePuzzle)

  // Save the new version
  puzzle.name = document.getElementById('puzzleName').innerText
  // console.log('Saving puzzle', puzzle.name)
  // TODO: Some intelligence about showing day / month / etc depending on date age
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
    if (!_tryUpdatePuzzle(serialized)) {
      deletePuzzleAndLoadNext()
    }

    document.body.removeChild(buttons.previousSibling)
    document.getElementById('metaButtons').style.display = 'inline'
  }
}

function deletePuzzleAndLoadNext() {
  var activePuzzle = window.localStorage.getItem('activePuzzle')
  // console.log('Deleting', activePuzzle)
  window.localStorage.removeItem(activePuzzle)
  _removePuzzleFromList(activePuzzle)

  var puzzleList = JSON.parse(window.localStorage.getItem('puzzleList'))
  while (puzzleList.length > 0) {
    var serialized = window.localStorage.getItem(puzzleList[0])
    if (_tryUpdatePuzzle(serialized)) break
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
  if (!_tryUpdatePuzzle(serialized)) {
    // Only alert if user tried to enter data
    if (serialized) alert('Not a valid puzzle!')
    return
  }
  var savedPuzzle = puzzle.name + ' on ' + (new Date()).toLocaleString()
  _addPuzzleToList(savedPuzzle)
  window.localStorage.setItem(savedPuzzle, serialized)
}

function exportPuzzle() {
  var elem = document.getElementById('export')
  elem.value = puzzle.serialize()
  elem.style.display = null
  elem.select()
  document.execCommand('copy')
  elem.style.display = 'none'
  alert('Puzzle copied to clipboard.')
}

function playPuzzle() {
  window.location.href = 'index.html?puzzle=' + puzzle.serialize()
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
  solutions = solve(puzzle)
  _showSolution(0, puzzle)
}

function setHSymmetry(value) {

}

function setVSymmetry(value) {

}

function setPillar(value) {
  if (value === false && puzzle.grid.length%2 === 0) { // Non-pillar
    puzzle.pillar = false
    resizePuzzle(1, 0, 'right')
  } else if (value === true && puzzle.grid.length%2 === 1) { // Pillar
    // If puzzle is not wide enough to shrink (1xN), then prevent pillar-izing, and uncheck the box.
    if (puzzle.grid.length <= 1) {
      document.getElementById('pillarBox').checked = false
      return
    }

    var newEnds = []
    for (var endPoint of puzzle.endPoints) {
      if (endPoint.x !== 0) {
        newEnds.push(endPoint)
      } else if (endPoint.y === 0) {
        endPoint.dir = 'top'
        newEnds.push(endPoint)
      } else if (endPoint.y === puzzle.grid[endPoint.x].length - 1) {
        endPoint.dir = 'bottom'
        newEnds.push(endPoint)
      }
    }
    puzzle.endPoints = newEnds

    puzzle.pillar = true
    resizePuzzle(-1, 0, 'right')
  }
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
    _redraw(solutions[num])
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
  // console.log('Removing puzzle', puzzleName)
  var puzzleList = JSON.parse(window.localStorage.getItem('puzzleList'))
  if (!puzzleList) puzzleList = []
  var index = puzzleList.indexOf(puzzleName)
  if (index === -1) return
  puzzleList.splice(index, 1)
  window.localStorage.setItem('puzzleList', JSON.stringify(puzzleList))
}

function _tryUpdatePuzzle(serialized) {
  if (!serialized) return false
  var savedPuzzle = puzzle
  try {
    puzzle = Puzzle.deserialize(serialized)
    _redraw(puzzle) // Will throw for most invalid puzzles
    document.getElementById('puzzleName').innerText = puzzle.name
    return true
  } catch (e) {
    console.log(e)
    puzzle = savedPuzzle
    _redraw(puzzle)
    return false
  }
}

function _redraw(puzzle) {
  document.getElementById('puzzleName').innerText = puzzle.name
  document.getElementById('pillarBox').checked = puzzle.pillar
  draw(puzzle)
  document.getElementById('publishData').setAttribute('value', puzzle.serialize())
  document.getElementById('solutionViewer').style.display = 'none'

  var puzzleElement = document.getElementById('puzzle')
  for (var child of puzzleElement.children) {
    child.onclick = null
  }

  var xPos = 40
  var topLeft = {'x':40, 'y':40}
  for (var x=0; x<puzzle.grid.length; x++) {
    var yPos = 40
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var width = (x%2 === 0 ? 24 : 58)
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
      rect.id = x + '_' + y
      rect.onclick = function() {_onElementClicked(this)}
      rect.onmouseover = function() {this.setAttribute('opacity', 0.1)}
      rect.onmouseout = function() {this.setAttribute('opacity', 0)}
    }
    xPos += width
  }
}

function _onElementClicked(elem) {
  var x = parseInt(elem.id.split('_')[0])
  var y = parseInt(elem.id.split('_')[1])

  if (activeParams.type === 'start') {
    if (x%2 === 1 && y%2 === 1) return
    // Toggle the start point -- add it if it isn't removed.
    if (puzzle.grid[x][y].start == undefined) {
      puzzle.grid[x][y].start = true
    } else {
      puzzle.grid[x][y].start = undefined
    }
  } else if (activeParams.type === 'end') {
    if (x%2 !== 0 || y%2 !== 0) return
    // Compute all valid endpoint directions for this location
    var validDirs = []
    if (x === 0 && !puzzle.pillar) validDirs.push('left')
    if (y === 0) validDirs.push('top')
    if (x === puzzle.grid.length - 1 && !puzzle.pillar) validDirs.push('right')
    if (y === puzzle.grid[x].length - 1) validDirs.push('bottom')
    if (validDirs.length === 0) return

    // If (x, y) is an endpoint, loop to the next direction
    var index = validDirs.indexOf(puzzle.getEndDir(x, y))
    if (index !== -1) {
      var dir = validDirs[index + 1]
    } else {
      // Not an endpoint, choose the first valid direction
      var dir = validDirs[0]
    }
    // If the direction loops past the end (or there are no valid directions), remove the endpoint.
    if (dir == undefined) {
      puzzle.removeEnd(x, y)
    } else {
      puzzle.addEnd(x, y, dir)
    }
  } else if (activeParams.type === 'dot') {
    if (x%2 === 1 && y%2 === 1) return
    // @Future: Some way to toggle colors, should be cognizant of symmetry mode.
    if (puzzle.grid[x][y].dot === 1) {
      puzzle.grid[x][y].dot = undefined
    } else {
      puzzle.grid[x][y].gap = undefined
      puzzle.grid[x][y].dot = 1
    }
  } else if (activeParams.type === 'gap') {
    if (x%2 === 1 && y%2 === 1) return
    if (x%2 === 0 && y%2 === 0) return
    if (puzzle.grid[x][y].gap === true) {
      puzzle.grid[x][y].gap = undefined
    } else {
      puzzle.grid[x][y].dot = undefined
      puzzle.grid[x][y].gap = true
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
  _redraw(puzzle)
}

var symbolData = {
  'start': {'type':'start'},
  'end': {'type':'end', 'y':18, 'dir':'top'},
  'gap': {'type':'gap'},
  'dot': {'type':'dot'},
  'square': {'type':'square'},
  'star': {'type':'star'},
  'nega': {'type':'nega'},
  'triangle': {'type':'triangle', 'count':1},
  'poly': {'type':'poly', 'rot':0, 'polyshape':71},
  'rpoly': {'type':'poly', 'rot':'all', 'polyshape':71},
  'ylop': {'type':'ylop', 'rot':0, 'polyshape':71},
  'rylop': {'type':'ylop', 'rot':'all', 'polyshape':71},
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
    button.appendChild(drawSymbol(params))
  }
}

function _drawColorButtons() {
  var colorTable = document.getElementById('colorButtons')
  colorTable.style.display = null
  for (var button of colorTable.getElementsByTagName('button')) {
    var params = {'width':146, 'height':45, 'border':2}
    params.text = button.id
    params.color = button.id
    if (activeParams.color === button.id) {
      button.parentElement.style.background = BORDER
    } else {
      button.parentElement.style.background = null
    }
    button.style.padding = 0
    button.style.border = params.border
    button.style.height = params.height + 2*params.border
    button.style.width = params.width + 2*params.border
    button.onclick = function() {
      activeParams.color = this.id
      _drawColorButtons()
    }
    while (button.firstChild) button.removeChild(button.firstChild)
    params.type = 'crayon'
    button.appendChild(drawSymbol(params))
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
  chooser.style.background = BACKGROUND
  chooser.style.border = BORDER
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
  if (cell == undefined) {
    var chooser = document.getElementById('chooser')
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
  var chooser = document.getElementById('chooser')
  activeParams.polyshape ^= cell.powerOfTwo
  if (cell.clicked) {
    cell.style.background = 'black'
  } else {
    cell.style.background = FOREGROUND
  }
  _drawSymbolButtons()
}

// All puzzle elements remain fixed, the edge you're dragging is where the new
// row/column is added. The endpoint will try to stay fixed, but will be pulled
// to remain against the edge.
function resizePuzzle(dx, dy, id) {
  var newWidth = puzzle.grid.length + dx
  var newHeight = puzzle.grid[0].length + dy

  if (newWidth <= 0 || newHeight <= 0) return false
  if (newWidth > 21 || newHeight > 21) return false

  if (id.includes('left')) {
    while (puzzle.grid.length > newWidth) puzzle.grid.shift()
    while (puzzle.grid.length < newWidth) {
      puzzle.grid.unshift((new Array(newHeight)).fill(undefined))
    }
  }
  if (id.includes('right')) {
    while (puzzle.grid.length > newWidth) puzzle.grid.pop()
    while (puzzle.grid.length < newWidth) {
      puzzle.grid.push((new Array(newHeight)).fill(undefined))
    }
  }
  if (id.includes('top')) {
    for (var row of puzzle.grid) {
      while (row.length > newHeight) row.shift()
      while (row.length < newHeight) row.unshift(undefined)
    }
  }
  if (id.includes('bottom')) {
    for (var row of puzzle.grid) {
      while (row.length > newHeight) row.pop()
      while (row.length < newHeight) row.push(undefined)
    }
  }

  var newDots = []
  for (var dot of puzzle.dots) {
    if (id.includes('left')) dot.x += dx
    if (id.includes('top')) dot.y += dy
    if (dot.x >= 0 && dot.x < newWidth
     && dot.y >= 0 && dot.y < newHeight) {
      newDots.push(dot)
    }
  }
  puzzle.dots = newDots

  var newGaps = []
  for (var gap of puzzle.gaps) {
    if (id.includes('left')) gap.x += dx
    if (id.includes('top')) gap.y += dy
    if (gap.x >= 0 && gap.x < newWidth
     && gap.y >= 0 && gap.y < newHeight) {
      newGaps.push(gap)
    }
  }
  puzzle.gaps = newGaps

  var newStarts = []
  for (var startPoint of puzzle.startPoints) {
    if (id.includes('left')) startPoint.x += dx
    if (id.includes('top')) startPoint.y += dy
    if (startPoint.x >= 0 && startPoint.x < newWidth
     && startPoint.y >= 0 && startPoint.y < newHeight) {
      newStarts.push(startPoint)
    }
  }
  puzzle.startPoints = newStarts

  var newEnds = []
  for (var endPoint of puzzle.endPoints) {
    if (endPoint.dir === 'right' && !puzzle.pillar) endPoint.x += dx
    if (endPoint.dir === 'top') endPoint.y += dy
    if (endPoint.x >= 0 && endPoint.x < newWidth
     && endPoint.y >= 0 && endPoint.y < newHeight) {
      newEnds.push(endPoint)
    }
  }
  puzzle.endPoints = newEnds

  savePuzzle()
  _redraw(puzzle)
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
    dragging = false
    var anchor = document.getElementById('anchor')
    anchor.parentElement.removeChild(anchor)
  }
}

function _dragMove(event, elem) {
  if (!dragging) return
  if (elem.id.includes('left')) {
    var dx = dragging.x - event.clientX
  } else if (elem.id.includes('right')) {
    var dx = event.clientX - dragging.x
  } else {
    var dx = 0
  }
  if (elem.id.includes('top')) {
    var dy = dragging.y - event.clientY
  } else if (elem.id.includes('bottom')) {
    var dy = event.clientY - dragging.y
  } else {
    var dy = 0
  }

  if (Math.abs(dx) >= 82 || Math.abs(dy) >= 82) {
    if (!resizePuzzle(2*Math.round(dx/82), 2*Math.round(dy/82), elem.id)) return
    // If resize succeeded, set a new reference point for future drag operations
    dragging.x = event.clientX
    dragging.y = event.clientY
  }
}
