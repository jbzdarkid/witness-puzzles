namespace(function() {

var activeParams = {'id':'', 'color':'black', 'polyshape':71}
window.puzzle = null
var dragging = null

// write a singular puzzle for reload purposes
function writePuzzle() {
  console.log('Writing puzzle', puzzle)
  var puzzleToSave = puzzle.clone()
  puzzleToSave.clearLines()
  localStorage.puzzle = puzzleToSave.serialize();
}

// Delete the active puzzle then read the next one.
window.deletePuzzle = function() {
  // since publish is gone, this is a reset button
  var theme = puzzle.theme
  createEmptyPuzzle(Math.floor(puzzle.width / 2), Math.floor(puzzle.height / 2))
  puzzle.theme = theme
  window.setTheme(theme)
  document.getElementById('puzzleTheme').innerHTML = theme
}

// Clear animations from the puzzle, redraw it, and add editor hooks.
// Note that this function DOES NOT reload the style, check for the automatic solver,
// reset the publish button, and other such 'meta' cleanup steps.
// You should only call this function if you're *sure* you're not in manual solve mode.
// If there's a chance that you are in manual solve mode, call reloadPuzzle().
function drawPuzzle() {
  window.draw(puzzle)
  window.clearAnimations()

  // @Robustness: Maybe I should be cleaning house more thoroughly? A class or something would let me just remove these...
  var puzzleElement = document.getElementById('puzzle')
  // Remove all 'onTraceStart' calls, they should be interacted through solveManually only.
  for (var child of puzzleElement.children) {
    child.onpointerdown = null
  }

  var addOnClick = function(elem, x, y) {
    elem.onpointerdown = function(event) {onElementClicked(event, x, y)}
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
      rect.onpointerenter = function() {this.setAttribute('opacity', 0.25)}
      rect.onpointerleave = function() {this.setAttribute('opacity', 0)}
    }
    xPos += width
  }
}

function reloadPuzzle() {
  // Disable the Solve (manually) button, clear lines, and redraw the puzzle
  document.getElementById('solveMode').checked = true
  document.getElementById('solveMode').onpointerdown()
  if (puzzle.theme === undefined) puzzle.theme = "(Insert Theme Name Here)"
  document.getElementById('puzzleTheme').innerText = puzzle.theme
  document.getElementById('solutionViewer').style.display = 'none'

  document.getElementById('solveAuto').disabled = false
  if (puzzle.symmetry != null) {
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

  var save = document.getElementById('save')
  save.disabled = true
  save.innerText = 'Save'
  save.onpointerdown = savePuzzle

  var puzzleStyle = document.getElementById('puzzleStyle')
  if (puzzle.pillar === false) {
    if (puzzle.symmetry == null) {
      puzzleStyle.value = 'Default'
    } else if (puzzle.symmetry.x === true && puzzle.symmetry.y === false) {
      puzzleStyle.value = 'Horizontal Symmetry'
    } else if (puzzle.symmetry.x === false && puzzle.symmetry.y === true) {
      puzzleStyle.value = 'Vertical Symmetry'
    } else if (puzzle.symmetry.x === true && puzzle.symmetry.y === true) {
      puzzleStyle.value = 'Rotational Symmetry'
    }
  } else if (puzzle.pillar === true) {
    if (puzzle.symmetry == null) {
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
  console.log('Puzzle style:', puzzleStyle.value)
}

//** Buttons which the user can click on
window.createEmptyPuzzle = function(x = 4, y = x) {
  var style = document.getElementById('puzzleStyle').value
  console.log('Creating new puzzle with style', style)

  switch (style) {
  default:
    console.error('Attempted to set unknown style', style, 'falling back to default')
    style = 'Default'
    // Intentional fall-through
  case 'Default':
    var newPuzzle = new Puzzle(x, y)
    break;

  case 'Horizontal Symmetry':
    x = Math.max(1, x)
    var newPuzzle = new Puzzle(x, y)
    newPuzzle.symmetry = {'x':true, 'y':false}
    break;

  case 'Vertical Symmetry':
    y = Math.max(1, y)
    var newPuzzle = new Puzzle(x, y)
    newPuzzle.symmetry = {'x':false, 'y':true}
    break;

  case 'Rotational Symmetry':
    x = Math.max(1, x)
    y = Math.max(1, y)
    var newPuzzle = new Puzzle(x, y)
    newPuzzle.symmetry = {'x':true, 'y':true}
    break;

  case 'Pillar':
    x = Math.max(1, x)
    var newPuzzle = new Puzzle(x, y, true)
    break;

  case 'Pillar (H Symmetry)':
    x = Math.max(2, x)
    var newPuzzle = new Puzzle(x, y, true)
    newPuzzle.symmetry = {'x':true, 'y':false}
    break;

  case 'Pillar (V Symmetry)':
    x = Math.max(1, x)
    y = Math.max(1, y)
    var newPuzzle = new Puzzle(x, y, true)
    newPuzzle.symmetry = {'x':false, 'y':true}
    break;

  case 'Pillar (R Symmetry)':
    x = Math.max(2, x)
    y = Math.max(1, y)
    var newPuzzle = new Puzzle(x, y, true)
    newPuzzle.symmetry = {'x':true, 'y':true}
    break;

  case 'Pillar (Two Lines)':
    x = Math.max(2, x)
    y = Math.max(1, y)
    var newPuzzle = new Puzzle(x, y, true)
    newPuzzle.symmetry = {'x':false, 'y':false}
    break;
  }
  newPuzzle.name = 'e'

  if (document.getElementById('deleteButton').disabled === true) {
    // Previous puzzle was unmodified, overwrite it
    puzzle = newPuzzle
  } else {
    // Previous puzzle had modifications
    document.getElementById('deleteButton').disabled = true
    window.puzzle = newPuzzle
    writePuzzle()
  }
  reloadPuzzle()
}

let reader = new FileReader()
let fileInput = document.getElementById("loadButton");
fileInput.addEventListener("change", function() {
    let file = this.files[0]
    let fileData = reader.readAsText(file)
    reader.onload = function(res) {
      window.puzzle = Puzzle.deserialize(res.currentTarget.result) // Will throw for most invalid puzzles
      window.setTheme(puzzle.theme)
      document.getElementById('puzzleTheme').innerHTML = puzzle.theme
      puzzleModified()
      writePuzzle()
      reloadPuzzle()
    }
    reader.onerror = function() {
      console.error(reader.error);
    };
}, false);

window.importPuzzle = function(serialized) {
  if (!serialized) {
    serialized = prompt('Paste your puzzle here:')
  }

  console.log('Creating puzzle from serialized', serialized)
  try {
    var newPuzzle = Puzzle.deserialize(serialized) // Will throw for most invalid puzzles
    window.puzzle = newPuzzle
    writePuzzle()
    reloadPuzzle()
  } catch (e) {
    console.error('Failed to load serialized puzzle', e)

    // Only alert if user tried to enter data
    if (serialized) alert('Not a valid puzzle!')
  }
}

window.setSolveMode = function(value) {
  document.getElementById('solveMode').checked = value
  if (value === true) {
    window.TRACE_COMPLETION_FUNC = function(solution, path) {
      puzzle = solution
      puzzle.path = path
      document.getElementById('save').disabled = false
    }
    // Redraw the puzzle, without interaction points. This is a bit of a @Hack, but it works.
    window.draw(puzzle)
  } else {
    puzzle.clearLines()
    window.TRACE_COMPLETION_FUNC = null
    drawPuzzle()
  }
}
//** End of user interaction points

window.reloadSymbolTheme = function() {
  drawSymbolButtons()
  reloadPuzzle()
}

window.onload = function() {
  drawSymbolButtons()
  drawColorButtons()
  if (localStorage.puzzle !== undefined) window.puzzle = Puzzle.deserialize(localStorage.puzzle);
  else createEmptyPuzzle()
  reloadPuzzle()
  // Add theme-appropriate coloring to the style dropdown
  var puzzleStyle = document.getElementById('puzzleStyle')
  puzzleStyle.style.background = 'var(--background)'
  puzzleStyle.style.color = 'var(--text)'

  var puzzleTheme = document.getElementById('puzzleTheme')

  puzzleTheme.onfocus = function(event) {
    // On initial focus, select all text within the box
    window.getSelection().removeAllRanges()
    var range = document.createRange()
    range.selectNodeContents(this)
    window.getSelection().addRange(range)
  }

  // Both oninput and onkeypress fire for every text modification.

  // Use onkeypress when you need to prevent an action
  puzzleTheme.onkeypress = function(event) {
    // If the user tries to type past 50 characters
    if (this.innerText.length >= 50) event.preventDefault()

    // Allow using the enter key to confirm the puzzle name
    if (event.key == 'Enter') {
      event.preventDefault()
      this.blur()
    }
  }

  // Use oninput for backup processing
  // You should always use a conditional here, because every time you modify the text,
  // the cursor resets to the start of the string.
  puzzleTheme.oninput = function(event) {
    // Prevent newlines in titles
    if (this.innerText.includes('\n')) this.innerText = this.innerText.replace('\n', '')
    if (this.innerText.includes('\r')) this.innerText = this.innerText.replace('\r', '')
    // Prevent the input box from disappearing
    if (this.innerText.length === 0) this.innerText = '\u200B' // Zero-width space
    // Prevent too-long titles
    if (this.innerText.length >= 50) this.innerText = this.innerText.substring(0, 50)
  }

  // Use onblur for final name confirmation.
  puzzleTheme.onblur = function(event) {
    // Remove leading/trailing whitespace
    this.innerText = this.innerText.trim()
    this.innerText = this.innerText.replace('\u200B', '')
    // Cap the puzzle name length one last time
    if (this.innerText.length >= 50) this.innerText = this.innerText.substring(0, 50)
    // Ensure that puzzle names are non-empty
    if (this.innerText.length === 0) this.innerText = '(Insert Theme Name Here)'
    // Update the puzzle with the new name
    puzzle.theme = this.innerText
    window.setTheme(this.innerText)
    document.getElementById('puzzleTheme').innerHTML = this.innerText
    puzzle.name = "e"
    writePuzzle()
  }

  for (var resize of document.getElementsByClassName('resize')) {
    resize.onpointerdown = function(event) {
      if (event.touches > 1) return // Don't attempt to drag during screen resize
      dragStart(event, this)
    }
    if (resize.id == 'resize-left' || resize.id == 'resize-right') {
      var svg = drawSymbol({'type': 'drag', 'rot':1, 'width':6, 'height':22})
      svg.style.width = '6px'
      svg.style.height = '22px'
      resize.appendChild(svg)

      resize.style.display = 'flex'
      svg.style.margin = 'auto'
    } else if (resize.id == 'resize-top' || resize.id == 'resize-bottom') {
      var svg = drawSymbol({'type': 'drag', 'rot':0, 'width':22, 'height':6})
      svg.style.width = '22px'
      svg.style.height = '6px'
      resize.appendChild(svg)

      resize.style.display = 'flex'
      svg.style.margin = 'auto'
    }
  }
}

window.onSolvedPuzzle = function(paths) {
  // Only enable the save button if there was a valid path.
  if (paths.length > 0) {
    document.getElementById('save').disabled = false
  }
  return paths
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

window.savePuzzle = function() {
  // instead of publish, we save this puzzle
  puzzle.theme = document.getElementById('puzzleTheme').innerHTML
  puzzle.clearLines()
  download("puzzle.json", puzzle.serialize())
}

// Returns the next value in the list.
// If the value is not found, defaults to the first element.
// If the value is found, but is the last value, returns null.
function getNextValue(list, value) {
  var index = list.indexOf(value)
  return list[index + 1]
}

// Called whenever a grid cell is clicked. Uses the global activeParams to know
// what combination of shape & color are currently selected.
// This function also ensures that the resulting puzzle is still sane, and will modify
// the puzzle to add symmetrical elements, remove newly invalidated elements, etc.
function onElementClicked(event, x, y) {
  if (event.isRightClick()) {
    // Clear the associated cell
    if (x%2 === 1 && y%2 === 1) {
      puzzle.grid[x][y] = null
    } else {
      puzzle.grid[x][y].end = null
      puzzle.grid[x][y].start = null
      puzzle.grid[x][y].dot = null
      puzzle.grid[x][y].gap = null
      if (puzzle.symmetry != null) {
        var sym = puzzle.getSymmetricalPos(x, y)
        puzzle.updateCell2(sym.x, sym.y, 'start', null)
        puzzle.updateCell2(sym.x, sym.y, 'end', null)
      }
    }
  } else if (activeParams.type == 'start') {
    if (x%2 === 1 && y%2 === 1) return
    if (puzzle.grid[x][y].gap != null) return

    if (puzzle.grid[x][y].start !== true) {
      puzzle.grid[x][y].start = true
    } else {
      puzzle.grid[x][y].start = null
    }
    if (puzzle.symmetry != null) {
      var sym = puzzle.getSymmetricalPos(x, y)
      if (sym.x === x && sym.y === y) {
        // If the two startpoints would be in the same location, do nothing.
        puzzle.grid[x][y].start = null
      } else {
        puzzle.updateCell2(sym.x, sym.y, 'start', puzzle.grid[x][y].start)
      }
    }
  } else if (activeParams.type == 'end') {
    if (x%2 === 1 && y%2 === 1) return
    if (puzzle.grid[x][y].gap != null) return

    var validDirs = puzzle.getValidEndDirs(x, y)

    // If (x, y) is an endpoint, loop to the next direction
    // If the direction loops past the end (or there are no valid directions),
    // remove the endpoint by setting to null.
    var dir = getNextValue(validDirs, puzzle.grid[x][y].end)
    puzzle.grid[x][y].end = dir
    if (puzzle.symmetry != null) {
      var sym = puzzle.getSymmetricalPos(x, y)
      if (sym.x === x && sym.y === y) {
        // If the two endpoints would be in the same location, do nothing.
        puzzle.grid[x][y].end = null
      } else {
        var symmetricalDir = puzzle.getSymmetricalDir(dir)
        puzzle.updateCell2(sym.x, sym.y, 'end', symmetricalDir)
      }
    }
  } else if (activeParams.type == 'dot') {
    if (x%2 === 1 && y%2 === 1) return
    var dotColors = [undefined, 1]
    if (puzzle.symmetry != null) {
      dotColors.push(2)
      dotColors.push(3)
    }
    dotColors.push(4)
    puzzle.grid[x][y].dot = getNextValue(dotColors, puzzle.grid[x][y].dot)
    puzzle.grid[x][y].gap = null
  } else if (activeParams.type == 'cross' || activeParams.type == 'curve') {
    let offset = 0;
    if (activeParams.type == 'curve') offset = -6;
    if (x%2 !== 0 || y%2 !== 0) return
    var dotColors = [undefined, -1 + offset, -2 + offset]
    if (puzzle.symmetry != null) {
      dotColors.push(-3 + offset)
      dotColors.push(-4 + offset)
      dotColors.push(-5 + offset)
      dotColors.push(-6 + offset)
    }
    puzzle.grid[x][y].dot = getNextValue(dotColors, puzzle.grid[x][y].dot)
    puzzle.grid[x][y].gap = null
  } else if (activeParams.type == 'x') {
    if (x%2 !== 0 || y%2 !== 0) return
    let spokes = activeParams.spokes - 1;
    var savedGrid = puzzle.switchToMaskedGrid() 
    if (!(puzzle.grid[x - 1] && puzzle.grid[x - 1][y - 1])) spokes &= ~1
    if (!(puzzle.grid[x + 1] && puzzle.grid[x + 1][y - 1])) spokes &= ~2
    if (!(puzzle.grid[x - 1] && puzzle.grid[x - 1][y + 1])) spokes &= ~4
    if (!(puzzle.grid[x + 1] && puzzle.grid[x + 1][y + 1])) spokes &= ~8
    puzzle.grid = savedGrid
    if (puzzle.grid[x][y].dot == -13 - spokes) delete puzzle.grid[x][y].dot
    else puzzle.grid[x][y].dot = -13 - spokes;
    puzzle.grid[x][y].gap = null
  } else if (activeParams.type == 'gap') {
    if (x%2 === y%2) return
    puzzle.grid[x][y].gap = getNextValue([undefined, 1, 2], puzzle.grid[x][y].gap)
    puzzle.grid[x][y].dot = null
    puzzle.grid[x][y].start = null
    puzzle.grid[x][y].end = null
    // Ensure that a symmetrical start or end is no longer impossible
    if (puzzle.symmetry != null) {
      var sym = puzzle.getSymmetricalPos(x, y)
      puzzle.grid[sym.x][sym.y].start = null
      puzzle.grid[sym.x][sym.y].end = null
    }

    // This potentially isolated a start/endpoint, so ensure that they are removed.
    for (var i=x-1; i<x+2; i++) {
      for (var j=y-1; j<y+2; j++) {
        if (i%2 !== 0 || j%2 !== 0) continue;
        var leftCell = puzzle.getCell(i - 1, j)
        if (leftCell != null && leftCell.gap !== 2) continue;
        var rightCell = puzzle.getCell(i + 1, j)
        if (rightCell != null && rightCell.gap !== 2) continue;
        var topCell = puzzle.getCell(i, j - 1)
        if (topCell != null && topCell.gap !== 2) continue;
        var bottomCell = puzzle.getCell(i, j + 1)
        if (bottomCell != null && bottomCell.gap !== 2) continue;

        // At this point, the cell has no defined or non-gap2 neighbors (isolated)
        puzzle.updateCell2(i, j, 'start', false)
        puzzle.updateCell2(i, j, 'end', null)
        if (puzzle.symmetry != null) {
          var sym = puzzle.getSymmetricalPos(i, j)
          console.debug('Enforcing symmetrical startpoint at', sym.x, sym.y)
          puzzle.updateCell2(sym.x, sym.y, 'start', false, 'end', null)
          puzzle.updateCell2(sym.x, sym.y, 'end', null)
        }
      }
    }
  } else if (['square', 'star', 'nega', 'bridge', 'sizer', 'twobytwo', 'vtriangle', 'pentagon', 'copier', 'celledhex', 'portal', 'blackhole', 'whitehole', 'pokerchip'].includes(activeParams.type)) {
    if (x%2 !== 1 || y%2 !== 1) return
    // Only remove the element if it's an exact match
    if (puzzle.grid[x][y] != null
     && puzzle.grid[x][y].type === activeParams.type
     && puzzle.grid[x][y].color === activeParams.color) {
      puzzle.grid[x][y] = null
    } else {
      puzzle.grid[x][y] = {
        'type': activeParams.type,
        'color': activeParams.color,
      }
    }
  } else if (['scaler'].includes(activeParams.type)) {
    if (x%2 !== 1 || y%2 !== 1) return
    if (puzzle.grid[x][y] != null
      && puzzle.grid[x][y].type === activeParams.type
      && puzzle.grid[x][y].color === activeParams.color) {
        if (puzzle.grid[x][y].flip == activeParams.flip) puzzle.grid[x][y].flip = (1 - activeParams.flip);
        else puzzle.grid[x][y] = null
     } else {
       puzzle.grid[x][y] = {
         'type': activeParams.type,
         'color': activeParams.color,
         'flip': activeParams.flip,
       }
     }
  } else if (['poly', 'ylop', 'polynt'].includes(activeParams.type)) {
    if (x%2 !== 1 || y%2 !== 1) return
    // Only remove the element if it's an exact match
    console.log(puzzle.grid[x][y], activeParams)
    if (puzzle.grid[x][y] != null
      && puzzle.grid[x][y].type === activeParams.type
      && puzzle.grid[x][y].color === activeParams.color
      && puzzle.grid[x][y].polyshape === activeParams.polyshape)
      puzzle.grid[x][y].polyshape = activeParams.polyshape | window.ROTATION_BIT;
    else if (puzzle.grid[x][y] != null
      && puzzle.grid[x][y].type === activeParams.type
      && puzzle.grid[x][y].color === activeParams.color
      && puzzle.grid[x][y].polyshape === activeParams.polyshape | window.ROTATION_BIT)
        puzzle.grid[x][y] = null
    else
      puzzle.grid[x][y] = {
        'type': activeParams.type,
        'color': activeParams.color,
        'polyshape': activeParams.polyshape,
      }
  } else if (activeParams.type == 'triangle' || activeParams.type == 'atriangle' || activeParams.type == 'divdiamond') {
    let cycle;
    if (activeParams.id == 'divdiamond') cycle = 9;
    else cycle = 4;
    if (x%2 !== 1 || y%2 !== 1) return
    // Only increment count if exact match
    if (puzzle.grid[x][y] != null
     && puzzle.grid[x][y].type === activeParams.type
     && puzzle.grid[x][y].color === activeParams.color) {
      puzzle.grid[x][y].count = puzzle.grid[x][y].count % cycle + 1
      // Remove when it matches activeParams -- this allows fluid cycling
      if (puzzle.grid[x][y].count === activeParams.count) {
        puzzle.grid[x][y] = null
      }
    } else {
      puzzle.grid[x][y] = {
        'type': activeParams.type,
        'color': activeParams.color,
        'count': activeParams.count
      }
    }
  } else if (activeParams.type == 'arrow' || activeParams.type == 'dart') {
    if (x%2 !== 1 || y%2 !== 1) return
    if (puzzle.grid[x][y] != null
     && puzzle.grid[x][y].type === activeParams.type
     && puzzle.grid[x][y].color === activeParams.color
     && puzzle.grid[x][y].rot === activeParams.rot) {
      puzzle.grid[x][y].count++
      if (puzzle.grid[x][y].count >= 5) {
        puzzle.grid[x][y] = null
      }
    } else {
      puzzle.grid[x][y] = {
        'type':activeParams.type,
        'color':activeParams.color,
        'count':activeParams.count,
        'rot':activeParams.rot,
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
      if (cell == null || cell.end == null) continue;
      var validDirs = puzzle.getValidEndDirs(i, j)
      if (!validDirs.includes(cell.end)) {
        puzzle.grid[i][j].end = validDirs[0]
        if (puzzle.symmetry != null) {
          var sym = puzzle.getSymmetricalPos(i, j)
          puzzle.grid[sym.x][sym.y] = validDirs[0]
        }
      }
    }
  }
  puzzleModified()
  writePuzzle()
  reloadPuzzle()
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
  'ylop': {'type':'ylop', 'title':'Negation polyomino'},
  'bridge': {'type':'bridge', 'title':'Seren\'s Bridge'},
  'arrow': {'type':'arrow', 'count':1, 'rot':0, 'title':'Sigma\'s Arrow'},
  'sizer': {'type':'sizer', 'title':'Radiazia\'s Sizer'},
  'cross': {'type':'cross', 'title':'Cross'},
  'curve': {'type':'curve', 'title':'Diamond'},
  'crossFilled': {'type':'crossFilled', 'title':'Filled Cross'},
  'curveFilled': {'type':'curveFilled', 'title':'Filled Diamond'},
  'twobytwo': {'type':'twobytwo', 'title':'Two-By-Two'},
  'dart': {'type':'dart', 'count':1, 'rot':0, 'title':'Dart'},
  'polynt': {'type':'polynt', 'title':'unsuspiciousperson\'s Antipolyomino'}, // i just really liked the idea lol oops
  'divdiamond': {'type':'divdiamond', 'count':1, 'title':'ItzShaun\'s Divided Diamond'}, // i just really liked the idea lol oops
  'vtriangle': {'type':'vtriangle', 'title':'sus\' Tenuous Triangle'},
  'x-lu': {'type':'x', 'spokes':16, 'title':'ItzShaun\' Xs'},
  'x-ru': {'type':'x', 'spokes':16, 'title':'ItzShaun\' Xs'},
  'x-ld': {'type':'x', 'spokes':16, 'title':'ItzShaun\' Xs'},
  'x-rd': {'type':'x', 'spokes':16, 'title':'ItzShaun\' Xs'},
  'pentagon': {'type':'pentagon', 'title':'ItzShaun\'s Pentagons'},
  'copier': {'type':'copier', 'title':'Gentova\' Copiers'},
  'celledhex': {'type':'celledhex', 'title':'ItzShaun\'s Celled Hexes'},
  'scaler': {'type':'scaler', 'flip': 0, 'title':'Scalers (Revised Artless\' Carrots)'},
  'portal': {'type':'portal', 'rot': 0, 'title':'MarioMak\'s Portals'},
  'blackhole': {'type':'blackhole', 'rot': 0, 'title':'Pruz\'s Black Holes (Klyzx\'s Revision)'},
  'atriangle': {'type':'atriangle', 'count':1, 'title':'Klyzx\'s Antitriangles'},
  'whitehole': {'type':'whitehole', 'rot': 0, 'title':'White Holes'},
  'pokerchip': {'type':'pokerchip', 'title':'MarioMak\'s Chips'},
  'none': {'type': 'none', 'title': 'Symbol Coming Soon!'}
}

let xButtons = [];

function drawSymbolButtons() {

  var symbolTable = document.getElementById('symbolButtons')
  symbolTable.style.display = null
  for (var button of symbolTable.getElementsByTagName('button')) {
    var params = symbolData[button.id]
    params.id = button.id
    params.height = params.type == 'x' ? 30 : 58
    params.width = params.type == 'x' ? 30 : 58
    params.border = params.type == 'x' ? 0 : 2
    if (params.type == 'x') xButtons.push(button.id)
    if (activeParams.id === button.id) {
      if (['x-lu', 'x-ru', 'x-ld', 'x-rd'].includes(button.id)) {
        document.getElementById('x-fakebutton').style.backgroundColor = activeParams.color
        button.parentElement.style.backgroundColor = null
      } else {
        document.getElementById('x-fakebutton').style.backgroundColor = null
        button.parentElement.style.backgroundColor = activeParams.color
      }
    } else {
      button.parentElement.style.backgroundColor = null
    }
    button.style.padding = 0
    button.style.border = params.border
    button.style.height = params.height + 2*params.border
    button.style.width = params.width + 2*params.border
    button.title = params.title
    button.params = params
    if (['poly', 'ylop', 'polynt'].includes(button.id)) {
      button.params.polyshape = activeParams.polyshape
      button.onpointerdown = function() {
        reloadPuzzle() // Disable manual solve mode to allow puzzle editing
        if (activeParams.id === this.id) {
          activeParams = Object.assign(activeParams, this.params)
          shapeChooser()
        } else {
          activeParams = Object.assign(activeParams, this.params)
          drawSymbolButtons()
        }
      }
    } else if (button.id == 'triangle' || button.id == 'atriangle' || button.id == 'divdiamond') {
      let cycle;
      if (button.id == 'divdiamond') cycle = 9;
      else cycle = 4;
      button.onpointerdown = function(event) {
        reloadPuzzle() // Disable manual solve mode to allow puzzle editing
        if (activeParams.id === this.id) {
          var count = symbolData[activeParams.id].count
          count += (event.isRightClick() ? -1 : 1)
          if (count <= 0) count = cycle
          if (count > cycle) count = 1
          symbolData[activeParams.id].count = count
          activeParams.count = count
        }
        activeParams = Object.assign(activeParams, this.params)
        drawSymbolButtons()
      }
      button.oncontextmenu = function(event) {event.preventDefault()}
    } else if (params.type == 'x') {
      button.style.display = null
      button.onpointerdown = function(event) {
        reloadPuzzle() // Disable manual solve mode to allow puzzle editing
        const corners = { 'x-lu': 1, 'x-ru': 2, 'x-ld': 4, 'x-rd': 8 }
        for (xbutton of xButtons) {
          if (event.isRightClick())
            symbolData[xbutton].spokes = ((symbolData[xbutton].spokes - 1) & ~corners[this.id]) + 1;
          else
            symbolData[xbutton].spokes = ((symbolData[xbutton].spokes - 1) ^ corners[this.id]) + 1;
        }
        activeParams = Object.assign(activeParams, this.params)
        drawSymbolButtons()
      }
      button.oncontextmenu = function(event) {event.preventDefault()}
    } else if (button.id == 'arrow') {
      button.style.display = null
      button.onpointerdown = function(event) {
        reloadPuzzle() // Disable manual solve mode to allow puzzle editing
        if (activeParams.id === this.id) {
          var rot = symbolData.arrow.rot
          if (rot == null) rot = 0
          rot += (event.isRightClick() ? -1 : 1)
          if (rot < 0) rot = 7
          if (rot > 7) rot = 0
          symbolData.arrow.rot = rot
          activeParams.rot = rot
        }
        activeParams = Object.assign(activeParams, this.params)
        drawSymbolButtons()
      }
      button.oncontextmenu = function(event) {event.preventDefault()}
    } else if (button.id == 'dart') {
      button.style.display = null
      button.onpointerdown = function(event) {
        reloadPuzzle() // Disable manual solve mode to allow puzzle editing
        if (activeParams.id === this.id) {
          var rot = symbolData.dart.rot
          if (rot == null) rot = 0
          rot += (event.isRightClick() ? -1 : 1)
          if (rot < 0) rot = 7
          if (rot > 7) rot = 0
          symbolData.dart.rot = rot
          activeParams.rot = rot
        }
        activeParams = Object.assign(activeParams, this.params)
        drawSymbolButtons()
      }
      button.oncontextmenu = function(event) {event.preventDefault()}
    } else if (button.id == 'scaler') {
      button.style.display = null
      button.onpointerdown = function(event) {
        reloadPuzzle() // Disable manual solve mode to allow puzzle editing
        if (activeParams.id === this.id) {
          var flip = symbolData.scaler.flip
          flip = 1 - flip;
          symbolData.scaler.flip = flip
          activeParams.flip = flip
        }
        activeParams = Object.assign(activeParams, this.params)
        drawSymbolButtons()
      }
      button.oncontextmenu = function(event) {event.preventDefault()}
    } else {
      button.style.display = null
      button.onpointerdown = function() {
        reloadPuzzle() // Disable manual solve mode to allow puzzle editing
        activeParams = Object.assign(activeParams, this.params)
        drawSymbolButtons()
      }
    }
    while (button.firstChild) button.removeChild(button.firstChild)
    var svg = window.drawSymbol(params)
    if (button.id == 'x-lu') {
      var fakebutton = document.getElementById('x-fakesvg')
      while (fakebutton.firstChild) fakebutton.removeChild(fakebutton.firstChild)
      fakebutton.appendChild(svg)
      svg.setAttribute('viewBox', '-15 -15 60 60')
      svg.setAttribute('width', '60px')
    }
    else if (button.id == 'x-ru' || button.id == 'x-ld' || button.id == 'x-rd') svg.style.display = "none"
    else button.appendChild(svg)
    if (['poly', 'ylop', 'polynt'].includes(button.id)) {
      var is4Wide = (activeParams.polyshape & 15) && (activeParams.polyshape & 61440)
      var is4Tall = (activeParams.polyshape & 4369) && (activeParams.polyshape & 34952)
      if (is4Wide || is4Tall) {
        svg.setAttribute('viewBox', '-8 -8 80 80')
      }
    }
  }
}

function drawColorButtons() {
  var colorTable = document.getElementById('colorButtons')
  colorTable.style.display = null
  var changeActiveColor = function() {
    reloadPuzzle() // Disable manual solve mode to allow puzzle editing
    activeParams.color = this.id
    var symbolTable = document.getElementById('symbolButtons')
    for (var button of symbolTable.getElementsByTagName('button')) {
      if (activeParams.id === button.id) {
        if (['x-lu', 'x-ru', 'x-ld', 'x-rd'].includes(button.id)) {
          document.getElementById('x-fakebutton').style.backgroundColor = activeParams.color
          button.parentElement.style.backgroundColor = null
        } else {
          document.getElementById('x-fakebutton').style.backgroundColor = null
          button.parentElement.style.backgroundColor = activeParams.color
        }
      } else {
        button.parentElement.style.backgroundColor = null
      }
    }
    drawColorButtons()
  }
  for (var button of colorTable.getElementsByTagName('button')) {
    var params = {
      'width': 45,
      'height': 45,
      'border': 2,
      'type':'square',
      'text': button.id,
      'color': button.id,
    }
    if (activeParams.color === button.id) {
      button.parentElement.style.background = 'var(--border)'
    } else {
      button.parentElement.style.background = null
    }
    button.style.padding = 0
    button.style.border = params.border
    button.style.height = params.height + 2*params.border
    button.style.width = params.width + 2*params.border
    button.onpointerdown = changeActiveColor
    while (button.firstChild) button.removeChild(button.firstChild)
    var crayon = window.drawSymbol(params)
    button.appendChild(crayon)

    if (button.id == 'custom') {
      button.style.display = null
      var input = document.createElement('input')
      input.style = 'position: absolute; margin-left: 30px; margin-top: 3px; width: 110px'
      input.placeholder = 'hex'
      button.insertBefore(input, crayon)

      button.onpointerdown = function(event) {
        for (var button of colorTable.getElementsByTagName('button')) {
          button.parentElement.style.background = null
        }

        this.parentElement.style.background = 'var(--border)'

        input.focus()
        event.preventDefault()
      }
      input.onkeypress = function(event) {
        // If the user tries to type past 6 characters
        if (this.innerText.length >= 6) {
          event.preventDefault()
        }

        // Allow using the enter key to confirm the color
        if (event.key == 'Enter') {
          event.preventDefault()
          this.blur()
        }

        if ('0123456789ABCDEFabcdef'.includes(event.key)) {
          // Allowed characters
        } else {
          // Block all other chars
          event.preventDefault()
        }
      }
      input.onblur = function() {
        params.color = '#' + this.value
        activeParams.color = '#' + this.value
        this.parentElement.removeChild(crayon)
        crayon = window.drawSymbol(params)
        this.parentElement.appendChild(crayon)
      }
    }
  }
}

function shapeChooser() {
  var puzzle = document.getElementById('puzzle')
  puzzle.style.opacity = 0
  puzzle.style.minWidth = '432px'

  var anchor = document.createElement('div')
  document.body.appendChild(anchor)
  anchor.id = 'anchor'
  anchor.style.width = '99%'
  anchor.style.height = '100%'
  anchor.style.position = 'absolute'
  anchor.style.top = 0
  anchor.onpointerdown = function(event) {shapeChooserClick(event)}

  var chooser = document.createElement('div')
  puzzle.parentElement.insertBefore(chooser, puzzle)
  chooser.id = 'chooser'
  chooser.style.display = 'flex'
  chooser.style.position = 'absolute'
  chooser.style.width = '100%'
  chooser.style.height = '100%'
  chooser.style.minWidth = '400px'
  chooser.style.zIndex = 1 // Position in front of the puzzle
  chooser.onpointerdown = function(event) {shapeChooserClick(event)}

  var chooserTable = document.createElement('table')
  chooser.appendChild(chooserTable)
  chooserTable.id = 'chooserTable'
  chooserTable.setAttribute('cellspacing', '24px')
  chooserTable.setAttribute('cellpadding', '0px')
  chooserTable.style.padding = 25
  chooserTable.style.background = 'var(--inner)'
  chooserTable.style.border = 'var(--border)'
  chooserTable.onpointerdown = function(event) {shapeChooserClick(event, this)}
  for (var x=0; x<4; x++) {
    var row = chooserTable.insertRow(x)
    for (var y=0; y<4; y++) {
      var cell = row.insertCell(y)
      cell.powerOfTwo = 1 << (x + y*4)
      cell.onpointerdown = function(event) {shapeChooserClick(event, this)}
      cell.style.width = 58
      cell.style.height = 58
      if ((activeParams.polyshape & cell.powerOfTwo) !== 0) {
        cell.clicked = true
        cell.style.background = 'var(--line-default)'
      } else {
        cell.clicked = false
        cell.style.background = 'var(--line-undone)'
      }
    }
  }
}

function shapeChooserClick(event, cell) {
  function polySort(shape) {
    let xBar = 4369;
    let yBar =   15;
    if (shape == 0) return 0;
    while ((shape & xBar) == 0) shape >>= 1;
    while ((shape & yBar) == 0) shape >>= 4;
    return shape;
  }

  var chooser = document.getElementById('chooser')
  if (cell == null) { // Clicked outside the chooser, close the selection window
    var anchor = document.getElementById('anchor')
    var puzzle = document.getElementById('puzzle')

    activeParams.polyshape = polySort(activeParams.polyshape)
    if (activeParams.polyshape === 0 || activeParams.polyshape === 1048576) {
      activeParams.polyshape += 1 // Ensure that at least one square is filled
      drawSymbolButtons()
    }
    chooser.parentElement.removeChild(chooser)
    anchor.parentElement.removeChild(anchor)
    puzzle.style.opacity = null
    puzzle.style.minWidth = null
    event.stopPropagation()
    return
  }
  // Clicks inside the green box are non-closing
  if (cell.id == 'chooserTable') {
    event.stopPropagation()
    return
  }
  cell.clicked = !cell.clicked
  activeParams.polyshape ^= cell.powerOfTwo
  if (cell.clicked) {
    cell.style.background = 'black'
  } else {
    cell.style.background = 'var(--line-undone)'
  }
  drawSymbolButtons()
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
  if (puzzle.symmetry != null) {
    if (puzzle.symmetry.x && newWidth <= 2) return false
    if (puzzle.symmetry.y && newHeight <= 2) return false
    if (puzzle.pillar && puzzle.symmetry.x && newWidth%4 !== 0) return false
  }

  if (puzzle.pillar && puzzle.symmetry != null) {
    // Symmetry pillar puzzles always expand horizontally in both directions.
    var xOffset = dx / 2
  } else {
    var xOffset = (id.includes('left') ? dx : 0)
  }
  var yOffset = (id.includes('top') ? dy : 0)

  console.log('Shifting contents by', xOffset, yOffset)

  // Determine if the cell at x, y should be copied from the original.
  // For non-symmetrical puzzles, the answer is always 'no' -- all elements should be directly copied across.
  // For non-pillar symmetry puzzles, we should persist all elements on the half the puzzle which is furthest from the dragged edge. This will keep the puzzle contents stable as we add a row. The exception to this rule is when we expand: We are creating one new row or column which has no source location.
  // For example, a horizontal puzzle with width=3 gets expanded to newWidth=5 (from the right edge), the column at x=2 is new -- it is not being copied nor persisted. This is especially apparent in rotational symmetry puzzles.
  var PERSIST = 0
  var COPY = 1
  var CLEAR = 2
  // x, y are locations on the new grid and should thus be compared to newWidth and newHeight.
  function shouldCopyCell(x, y) {
    if (puzzle.symmetry == null) return PERSIST
    if (x%2 === 1 && y%2 === 1) return PERSIST // Always copy cells

    // Symmetry copies one half of the grid to the other, and selects the far side from
    // the dragged edge to be the master copy. This is so that drags feel 'smooth' wrt
    // internal elements, i.e. it feels like dragging away is just inserting a column/row.
    if (!puzzle.pillar) {
      if (puzzle.symmetry.x) { // Normal Horizontal Symmetry
        if (dx > 0 && x == (newWidth-1)/2) return CLEAR
        if (id.includes('right')  && x >= (newWidth+1)/2) return COPY
        if (id.includes('left')   && x <= (newWidth-1)/2) return COPY
      }
      if (puzzle.symmetry.y) { // Normal Vertical Symmetry
        if (dy > 0 && y == (newHeight-1)/2) return CLEAR
        if (id.includes('bottom') && y >= (newHeight+1)/2) return COPY
        if (id.includes('top')    && y <= (newHeight-1)/2) return COPY
      }
    } else { // Pillar symmetries
      if (puzzle.symmetry.x && !puzzle.symmetry.y) { // Pillar Horizontal Symmetry
        if (dx !== 0) {
          if (x <   newWidth*1/4) return COPY
          if (x === newWidth*1/4) return CLEAR
          if (x === newWidth*3/4) return CLEAR
          if (x >=  newWidth*3/4) return COPY
        }
        // Vertical resizes just persist
      }

      if (!puzzle.symmetry.x && puzzle.symmetry.y) { // Pillar Vertical Symmetry
        if (dx !== 0 && id.includes('right') && x >= newWidth/2) return COPY
        if (dx !== 0 && id.includes('left')  && x <  newWidth/2) return COPY
        if (dy !== 0 && id.includes('bottom')) {
          if (y > (newHeight-1)/2) return COPY
          if (y === (newHeight-1)/2 && x > newWidth/2) return COPY
        }
        if (dy !== 0 && id.includes('top')) {
          if (y < (newHeight-1)/2) return COPY
          if (y === (newHeight-1)/2 && x < newWidth/2) return COPY
        }
      }

      if (puzzle.symmetry.x && puzzle.symmetry.y) { // Pillar Rotational Symmetry
        if (dx !== 0) {
          if (x <   newWidth*1/4) return COPY
          if (x === newWidth*1/4 && y < (newHeight-1)/2) return COPY
          if (x === newWidth*3/4 && y > (newHeight-1)/2) return COPY
          if (x >   newWidth*3/4) return COPY
        }
        if (dy !== 0 && id.includes('bottom') && y > (newHeight-1)/2) return COPY
        if (dy !== 0 && id.includes('top')    && y < (newHeight-1)/2) return COPY
      }

      if (!puzzle.symmetry.x && !puzzle.symmetry.y) { // Pillar Two Lines
        if (dx !== 0 && id.includes('right')  && x >= newWidth/2)      return COPY
        if (dx !== 0 && id.includes('left')   && x <  newWidth/2)      return COPY
        if (dy !== 0 && id.includes('bottom') && y >= (newHeight-1)/2) return COPY
        if (dy !== 0 && id.includes('top')    && y <  (newHeight-1)/2) return COPY
      }
    }

    return PERSIST
  }

  // We don't call new Puzzle here so that we can persist extended puzzle attributes (pillar, symmetry, etc)
  var oldPuzzle = puzzle.clone()
  puzzle.newGrid(newWidth, newHeight)

  var debugGrid = []
  for (var y=0; y<puzzle.height; y++) debugGrid[y] = ''

  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = null
      // In case the source location was empty / off the grid, we start with a stand-in empty object.
      if (x%2 === 0 || y%2 === 0) cell = {'type': 'line'}

      switch (shouldCopyCell(x, y)) {
      case PERSIST:
        debugGrid[y] += 'P'
        if (oldPuzzle._safeCell(x - xOffset, y - yOffset)) {
          cell = oldPuzzle.grid[x - xOffset][y - yOffset]
        }
        console.spam('At', x - xOffset, y - yOffset, 'persisting', JSON.stringify(cell))
        break;
      case COPY: // We're copying from the *old* puzzle, not the new one. We don't care what order we copy in.
        debugGrid[y] += 'O'
        var sym = puzzle.getSymmetricalPos(x, y)
        var symCell = null
        if (oldPuzzle._safeCell(sym.x - xOffset, sym.y - yOffset)) {
          symCell = oldPuzzle.grid[sym.x - xOffset][sym.y - yOffset]
          cell.end = puzzle.getSymmetricalDir(symCell.end)
          cell.start = symCell.start
        }
        console.spam('At', x - xOffset, y - yOffset, 'copying', JSON.stringify(symCell), 'from', sym.x - xOffset, sym.y - yOffset)
        break;
      case CLEAR:
        debugGrid[y] += 'C'
        cell = {'type': 'line'}
        console.spam('At', x - xOffset, y - yOffset, 'clearing cell')
        break;
      }

      puzzle.grid[x][y] = cell
    }
  }

  console.log('Resize grid actions:')
  for (var row of debugGrid) console.log(row)

  // Check to make sure that all endpoints are still pointing in valid directions.
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == null) continue;
      if (cell.end == null) continue;

      if (puzzle.symmetry == null) {
        var validDirs = puzzle.getValidEndDirs(x, y)
        if (validDirs.includes(cell.end)) continue;

        if (validDirs.length === 0) {
          console.log('Endpoint at', x, y, 'no longer fits on the grid')
          puzzle.grid[x][y].end = null
        } else {
          console.log('Changing direction of endpoint', x, y, 'from', cell.end, 'to', validDirs[0])
          puzzle.grid[x][y].end = validDirs[0]
        }
      } else {
        var sym = puzzle.getSymmetricalPos(x, y)
        var symDir = puzzle.getSymmetricalDir(cell.end)
        var validDirs = puzzle.getValidEndDirs(x, y)
        var validSymDirs = puzzle.getValidEndDirs(sym.x, sym.y)
        if (validDirs.includes(cell.end) && validSymDirs.includes(symDir)) continue;

        while (validDirs.length > 0) {
          var dir = validDirs.pop()
          symDir = puzzle.getSymmetricalDir(dir)
          if (validDirs.includes(dir) && validSymDirs.includes(symDir)) {
            console.log('Changing direction of endpoint', x, y, 'from', cell.end, 'to', dir)
            puzzle.grid[x][y].end = dir
            puzzle.grid[sym.x][sym.y].end = symDir
            break;
          }
        }
        if (validDirs.length === 0 || validSymDirs.length === 0) {
          console.log('Endpoint at', x, y, 'no longer fits on the grid')
          puzzle.grid[x][y].end = null
          puzzle.grid[sym.x][sym.y].end = null
        }
      }
    }
  }
  return true
}

var passive = false
try {
  window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
    get: function() {
      passive = {passive: false}
    }
  }))
} catch {/* empty */}

document.addEventListener('touchmove', function(event) {
  if (dragging) event.preventDefault()
}, passive)

function dragStart(event, elem) {
  dragging = {
    'x': event.pageX || event.clientX || event.touches[0].pageX,
    'y': event.pageY || event.clientY || event.touches[0].pageY,
  }

  var anchor = document.createElement('div')
  document.body.appendChild(anchor)

  anchor.id = 'anchor'
  anchor.style.position = 'absolute'
  anchor.style.top = 0
  anchor.style.width = '99%'
  anchor.style.height = '100%'
  anchor.style.cursor = elem.style.cursor
  document.onmousemove = function(event) {dragMove(event, elem)}
  document.ontouchmove = function(event) {dragMove(event, elem)}
  document.ontouchend = function(event) {dragEnd(event, elem)}
}

function dragEnd(event, elem) {
  console.log('Drag ended')
  dragging = null
  var anchor = document.getElementById('anchor')
  anchor.parentElement.removeChild(anchor)
  document.onmousemove = null
  document.ontouchmove = null
  document.ontouchend = null
}

function dragMove(event, elem) {
  var newDragging = {
    'x': event.pageX || event.clientX || event.touches[0].pageX,
    'y': event.pageY || event.clientY || event.touches[0].pageY,
  }
  console.spam(newDragging.x, newDragging.y)
  if (event.buttons === 0) return dragEnd(event, elem)
  if (dragging == null) return
  var dx = 0
  var dy = 0
  if (elem.id.includes('left')) {
    dx = dragging.x - newDragging.x
  } else if (elem.id.includes('right')) {
    dx = newDragging.x - dragging.x
  }
  if (elem.id.includes('top')) {
    dy = dragging.y - newDragging.y
  } else if (elem.id.includes('bottom')) {
    dy = newDragging.y - dragging.y
  }

  console.spam(dx, dy)

  var xLim = 40
  var xScale = 2
  // Symmetry + Pillars requires an even number of cells (2xN, 4xN, etc)
  if (puzzle.symmetry != null && puzzle.pillar === true) {
    xScale = 4
  }

  var yLim = 40
  // 4x4 and larger will only expand downwards, so we have to require more motion.
  if (puzzle.height >= 9) {
    var yLim = 60
  }
  var yScale = 2

  // Note: We only modify dragging when we reach a limit.
  // Note: We use Math.sign (rather than Math.round or Math.floor) since we only want to resize 1 unit at a time.

  while (Math.abs(dx) >= xLim) {
    if (!resizePuzzle(xScale * Math.sign(dx), 0, elem.id)) break;
    puzzleModified()
    writePuzzle()
    reloadPuzzle()
    dx -= Math.sign(dx) * xLim
    dragging.x = newDragging.x
  }

  while (Math.abs(dy) >= yLim) {
    if (!resizePuzzle(0, yScale * Math.sign(dy), elem.id)) break;
    puzzleModified()
    writePuzzle()
    reloadPuzzle()
    dy -= Math.sign(dy) * yLim
    dragging.y = newDragging.y
  }
}

function puzzleModified() {
  document.getElementById('deleteButton').disabled = false
}

});
