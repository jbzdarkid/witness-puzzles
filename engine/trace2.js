namespace(function() {

var BBOX_DEBUG = false

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value
}

class BoundingBox {
  constructor(x1, x2, y1, y2, sym=false) {
    this.raw = {'x1':x1, 'x2':x2, 'y1':y1, 'y2':y2}
    this.sym = sym
    if (BBOX_DEBUG === true) {
      this.debug = createElement('rect')
      data.svg.appendChild(this.debug)
      this.debug.setAttribute('opacity', 0.5)
      this.debug.setAttribute('style', 'pointer-events: none;')
      if (data.puzzle.symmetry == null) {
        this.debug.setAttribute('fill', 'white')
      } else {
        if (this.sym !== true) {
          this.debug.setAttribute('fill', 'blue')
        } else {
          this.debug.setAttribute('fill', 'orange')
        }
      }
    }
    this._update()
  }

  shift(dir, pixels) {
    if (dir === 'left') {
      this.raw.x2 = this.raw.x1
      this.raw.x1 -= pixels
    } else if (dir === 'right') {
      this.raw.x1 = this.raw.x2
      this.raw.x2 += pixels
    } else if (dir === 'top') {
      this.raw.y2 = this.raw.y1
      this.raw.y1 -= pixels
    } else if (dir === 'bottom') {
      this.raw.y1 = this.raw.y2
      this.raw.y2 += pixels
    }
    this._update()
  }

  inMain(x, y) {
    var inMainBox =
      (this.x1 < x && x < this.x2) &&
      (this.y1 < y && y < this.y2)
    var inRawBox =
      (this.raw.x1 < x && x < this.raw.x2) &&
      (this.raw.y1 < y && y < this.raw.y2)

    return inMainBox && !inRawBox
  }

  _update() {
    this.x1 = this.raw.x1
    this.x2 = this.raw.x2
    this.y1 = this.raw.y1
    this.y2 = this.raw.y2

    // Check for endpoint adjustment
    if (this.sym !== true) {
      var cell = data.puzzle.getCell(data.pos.x, data.pos.y)
    } else {
      var cell = data.puzzle.getSymmetricalCell(data.sym.x, data.sym.y)
    }
    if (cell.end === 'left') {
      this.x1 -= 24
    } else if (cell.end === 'right') {
      this.x2 += 24
    } else if (cell.end === 'top') {
      this.y1 -= 24
    } else if (cell.end === 'bottom') {
      this.y2 += 24
    }

    this.middle = { // Note: Middle of the raw object
      'x':(this.raw.x1 + this.raw.x2)/2,
      'y':(this.raw.y1 + this.raw.y2)/2
    }

    if (this.debug != null) {
      this.debug.setAttribute('x', this.x1)
      this.debug.setAttribute('y', this.y1)
      this.debug.setAttribute('width', this.x2 - this.x1)
      this.debug.setAttribute('height', this.y2 - this.y1)
    }
  }
}

class PathSegment {
  constructor(dir) {
    this.poly1 = createElement('polygon')
    this.circ = createElement('circle')
    this.poly2 = createElement('polygon')
    this.pillarCirc = createElement('circle')
    this.dir = dir
    data.svg.insertBefore(this.circ, data.cursor)
    data.svg.insertBefore(this.poly2, data.cursor)
    data.svg.insertBefore(this.pillarCirc, data.cursor)
    this.circ.setAttribute('cx', data.bbox.middle.x)
    this.circ.setAttribute('cy', data.bbox.middle.y)

    if (data.puzzle.pillar === true) {
      // cx/cy are updated in redraw(), since pillarCirc tracks the cursor
      this.pillarCirc.setAttribute('cy', data.bbox.middle.y)
      this.pillarCirc.setAttribute('r', 12)
      if (data.pos.x === 0 && this.dir === MOVE_RIGHT) {
        this.pillarCirc.setAttribute('cx', data.bbox.x1)
        this.pillarCirc.setAttribute('static', true)
      } else if (data.pos.x === data.puzzle.width - 1 && this.dir === MOVE_LEFT) {
        this.pillarCirc.setAttribute('cx', data.bbox.x2)
        this.pillarCirc.setAttribute('static', true)
      } else {
        this.pillarCirc.setAttribute('cx', data.bbox.middle.x)
      }
    }

    if (data.puzzle.symmetry == null) {
      this.poly1.setAttribute('class', 'line-1 ' + data.svg.id)
      this.circ.setAttribute('class', 'line-1 ' + data.svg.id)
      this.poly2.setAttribute('class', 'line-1 ' + data.svg.id)
      this.pillarCirc.setAttribute('class', 'line-1 ' + data.svg.id)
    } else {
      this.poly1.setAttribute('class', 'line-2 ' + data.svg.id)
      this.circ.setAttribute('class', 'line-2 ' + data.svg.id)
      this.poly2.setAttribute('class', 'line-2 ' + data.svg.id)
      this.pillarCirc.setAttribute('class', 'line-2 ' + data.svg.id)

      this.symPoly1 = createElement('polygon')
      this.symCirc = createElement('circle')
      this.symPoly2 = createElement('polygon')
      this.symPillarCirc = createElement('circle')
      data.svg.insertBefore(this.symCirc, data.cursor)
      data.svg.insertBefore(this.symPoly2, data.cursor)
      data.svg.insertBefore(this.symPillarCirc, data.cursor)
      this.symPoly1.setAttribute('class', 'line-3 ' + data.svg.id)
      this.symCirc.setAttribute('class', 'line-3 ' + data.svg.id)
      this.symPoly2.setAttribute('class', 'line-3 ' + data.svg.id)
      this.symPillarCirc.setAttribute('class', 'line-3 ' + data.svg.id)

      this.symCirc.setAttribute('cx', data.symbbox.middle.x)
      this.symCirc.setAttribute('cy', data.symbbox.middle.y)

      if (data.puzzle.pillar === true) {
        // cx/cy are updated in redraw(), since symPillarCirc tracks the cursor
        this.symPillarCirc.setAttribute('cy', data.symbbox.middle.y)
        this.symPillarCirc.setAttribute('r', 12)
        var symmetricalDir = getSymmetricalDir(data.puzzle, this.dir)
        if (data.sym.x === 0 && symmetricalDir === MOVE_RIGHT) {
          this.symPillarCirc.setAttribute('cx', data.symbbox.x1)
          this.symPillarCirc.setAttribute('static', true)
        } else if (data.sym.x === data.puzzle.width - 1 && symmetricalDir === MOVE_LEFT) {
          this.symPillarCirc.setAttribute('cx', data.symbbox.x2)
          this.symPillarCirc.setAttribute('static', true)
        } else {
          this.symPillarCirc.setAttribute('cx', data.symbbox.middle.x)
        }
      }
    }

    if (this.dir === MOVE_NONE) { // Start point
      this.circ.setAttribute('r', 24)
      this.circ.setAttribute('class', this.circ.getAttribute('class') + ' start')
      if (data.puzzle.symmetry != null) {
        this.symCirc.setAttribute('r', 24)
        this.symCirc.setAttribute('class', this.symCirc.getAttribute('class') + ' start')
      }
    } else {
      // Only insert poly1 in non-startpoints
      data.svg.insertBefore(this.poly1, data.cursor)
      this.circ.setAttribute('r', 12)
      if (data.puzzle.symmetry != null) {
        data.svg.insertBefore(this.symPoly1, data.cursor)
        this.symCirc.setAttribute('r', 12)
      }
    }
  }

  destroy() {
    data.svg.removeChild(this.poly1)
    data.svg.removeChild(this.circ)
    data.svg.removeChild(this.poly2)
    data.svg.removeChild(this.pillarCirc)
    if (data.puzzle.symmetry != null) {
      data.svg.removeChild(this.symPoly1)
      data.svg.removeChild(this.symCirc)
      data.svg.removeChild(this.symPoly2)
      data.svg.removeChild(this.symPillarCirc)
    }
  }

  redraw() { // Uses raw bbox because of endpoints
    // Move the cursor and related objects
    var x = clamp(data.x, data.bbox.x1, data.bbox.x2)
    var y = clamp(data.y, data.bbox.y1, data.bbox.y2)
    data.cursor.setAttribute('cx', x)
    data.cursor.setAttribute('cy', y)
    if (data.puzzle.symmetry != null) {
      data.symcursor.setAttribute('cx', this._reflX(x))
      data.symcursor.setAttribute('cy', this._reflY(y))
    }
    if (data.puzzle.pillar === true) {
      if (this.pillarCirc.getAttribute('static') == null) {
        this.pillarCirc.setAttribute('cx', x)
        this.pillarCirc.setAttribute('cy', y)
      }
      if (data.puzzle.symmetry != null) {
        if (this.symPillarCirc.getAttribute('static') == null) {
          this.symPillarCirc.setAttribute('cx', this._reflX(x))
          this.symPillarCirc.setAttribute('cy', this._reflY(y))
        }
      }
    }

    // Draw the first-half box
    var points1 = JSON.parse(JSON.stringify(data.bbox.raw))
    if (this.dir === MOVE_LEFT) {
      points1.x1 = clamp(data.x, data.bbox.middle.x, data.bbox.x2)
    } else if (this.dir === MOVE_RIGHT) {
      points1.x2 = clamp(data.x, data.bbox.x1, data.bbox.middle.x)
    } else if (this.dir === MOVE_TOP) {
      points1.y1 = clamp(data.y, data.bbox.middle.y, data.bbox.y2)
    } else if (this.dir === MOVE_BOTTOM) {
      points1.y2 = clamp(data.y, data.bbox.y1, data.bbox.middle.y)
    }
    this.poly1.setAttribute('points',
      points1.x1 + ' ' + points1.y1 + ',' +
      points1.x1 + ' ' + points1.y2 + ',' +
      points1.x2 + ' ' + points1.y2 + ',' +
      points1.x2 + ' ' + points1.y1
    )

    var firstHalf = false
    var isEnd = (data.puzzle.grid[data.pos.x][data.pos.y].end != null)
    // The second half of the line uses the raw so that it can enter the endpoint properly.
    var points2 = JSON.parse(JSON.stringify(data.bbox.raw))
    if (data.x < data.bbox.middle.x && this.dir !== MOVE_RIGHT) {
      points2.x1 = clamp(data.x, data.bbox.x1, data.bbox.middle.x)
      points2.x2 = data.bbox.middle.x
      if (isEnd && data.pos.x%2 === 0 && data.pos.y%2 === 1) {
        points2.y1 += 17
        points2.y2 -= 17
      }
    } else if (data.x > data.bbox.middle.x && this.dir !== MOVE_LEFT) {
      points2.x1 = data.bbox.middle.x
      points2.x2 = clamp(data.x, data.bbox.middle.x, data.bbox.x2)
      if (isEnd && data.pos.x%2 === 0 && data.pos.y%2 === 1) {
        points2.y1 += 17
        points2.y2 -= 17
      }
    } else if (data.y < data.bbox.middle.y && this.dir !== MOVE_BOTTOM) {
      points2.y1 = clamp(data.y, data.bbox.y1, data.bbox.middle.y)
      points2.y2 = data.bbox.middle.y
      if (isEnd && data.pos.x%2 === 1 && data.pos.y%2 === 0) {
        points2.x1 += 17
        points2.x2 -= 17
      }
    } else if (data.y > data.bbox.middle.y && this.dir !== MOVE_TOP) {
      points2.y1 = data.bbox.middle.y
      points2.y2 = clamp(data.y, data.bbox.middle.y, data.bbox.y2)
      if (isEnd && data.pos.x%2 === 1 && data.pos.y%2 === 0) {
        points2.x1 += 17
        points2.x2 -= 17
      }
    } else {
      firstHalf = true
    }

    this.poly2.setAttribute('points',
      points2.x1 + ' ' + points2.y1 + ',' +
      points2.x1 + ' ' + points2.y2 + ',' +
      points2.x2 + ' ' + points2.y2 + ',' +
      points2.x2 + ' ' + points2.y1
    )

    // Show the second poly only in the second half of the cell
    this.poly2.setAttribute('opacity', (firstHalf ? 0 : 1))
    // Show the circle in the second half of the cell AND in the start
    if (firstHalf && this.dir !== MOVE_NONE) {
      this.circ.setAttribute('opacity', 0)
    } else {
      this.circ.setAttribute('opacity', 1)
    }

    // Draw the symmetrical path based on the original one
    if (data.puzzle.symmetry != null) {
      this.symPoly1.setAttribute('points',
        this._reflX(points1.x2) + ' ' + this._reflY(points1.y2) + ',' +
        this._reflX(points1.x2) + ' ' + this._reflY(points1.y1) + ',' +
        this._reflX(points1.x1) + ' ' + this._reflY(points1.y1) + ',' +
        this._reflX(points1.x1) + ' ' + this._reflY(points1.y2)
      )

      this.symPoly2.setAttribute('points',
        this._reflX(points2.x2) + ' ' + this._reflY(points2.y2) + ',' +
        this._reflX(points2.x2) + ' ' + this._reflY(points2.y1) + ',' +
        this._reflX(points2.x1) + ' ' + this._reflY(points2.y1) + ',' +
        this._reflX(points2.x1) + ' ' + this._reflY(points2.y2)
      )

      this.symCirc.setAttribute('opacity', this.circ.getAttribute('opacity'))
      this.symPoly2.setAttribute('opacity', this.poly2.getAttribute('opacity'))
    }
  }

  _reflX(x) {
    if (data.puzzle.symmetry == null) return x
    if (data.puzzle.symmetry.x === true) {
      // Mirror position inside the bounding box
      return (data.bbox.middle.x - x) + data.symbbox.middle.x
    }
    // Copy position inside the bounding box
    return (x - data.bbox.middle.x) + data.symbbox.middle.x
  }

  _reflY(y) {
    if (data.puzzle.symmetry == null) return y
    if (data.puzzle.symmetry.y === true) {
      // Mirror position inside the bounding box
      return (data.bbox.middle.y - y) + data.symbbox.middle.y
    }
    // Copy position inside the bounding box
    return (y - data.bbox.middle.y) + data.symbbox.middle.y
  }
}

var data = {}

function clearGrid(svg, puzzle) {
  if (data.bbox != null && data.bbox.debug != null) {
    data.svg.removeChild(data.bbox.debug)
    data.bbox = null
  }
  if (data.symbbox != null && data.symbbox.debug != null) {
    data.svg.removeChild(data.symbbox.debug)
    data.symbbox = null
  }

  window.deleteElementsByClassName(svg, 'cursor')
  window.deleteElementsByClassName(svg, 'line-1')
  window.deleteElementsByClassName(svg, 'line-2')
  window.deleteElementsByClassName(svg, 'line-3')
  puzzle.clearLines()
}

// This copy is an exact copy of puzzle.getSymmetricalDir, except that it uses MOVE_* values instead of strings
function getSymmetricalDir(puzzle, dir) {
  if (puzzle.symmetry != null) {
    if (puzzle.symmetry.x === true) {
      if (dir === MOVE_LEFT) return MOVE_RIGHT
      if (dir === MOVE_RIGHT) return MOVE_LEFT
    }
    if (puzzle.symmetry.y === true) {
      if (dir === MOVE_TOP) return MOVE_BOTTOM
      if (dir === MOVE_BOTTOM) return MOVE_TOP
    }
  }
  return dir
}

window.trace = function(event, puzzle, pos, start, symStart=null) {
  /*if (data.start == null) {*/
  if (data.tracing !== true) { // could be undefined or false
    var svg = start.parentElement
    data.tracing = true
    window.PLAY_SOUND('start')
    // Cleans drawn lines & puzzle state
    clearGrid(svg, puzzle)
    onTraceStart(puzzle, pos, svg, start, symStart)
    data.animations.insertRule('.' + svg.id + '.start {animation: 150ms 1 forwards start-grow}\n')

    hookMovementEvents(start)
  } else {
    event.stopPropagation()
    // Signal the onMouseMove to stop accepting input (race condition)
    data.tracing = false

    // At endpoint and in main box
    var cell = puzzle.getCell(data.pos.x, data.pos.y)
    if (cell.end != null && data.bbox.inMain(data.x, data.y)) {
      data.cursor.onpointerdown = null
      setTimeout(function() { // Run validation asynchronously so we can free the pointer immediately.
        puzzle.endPoint = data.pos
        var puzzleData = window.validate(puzzle, false) // We want all invalid elements so we can show the user.

        for (var negation of puzzleData.negations) {
          console.debug('Rendering negation', negation)
          data.animations.insertRule('.' + data.svg.id + '_' + negation.source.x + '_' + negation.source.y + ' {animation: 0.75s 1 forwards fade}\n')
          data.animations.insertRule('.' + data.svg.id + '_' + negation.target.x + '_' + negation.target.y + ' {animation: 0.75s 1 forwards fade}\n')
        }

        if (puzzleData.valid()) {
          window.PLAY_SOUND('success')
          // !important to override the child animation
          data.animations.insertRule('.' + data.svg.id + ' {animation: 1s 1 forwards line-success !important}\n')

          // Convert the traced path into something suitable for solve.drawPath (for publishing purposes)
          var rawPath = [puzzle.startPoint]
          for (var i=1; i<data.path.length; i++) rawPath.push(data.path[i].dir)
          rawPath.push(0)

          if (window.TRACE_COMPLETION_FUNC) window.TRACE_COMPLETION_FUNC(puzzle, rawPath)
        } else {
          window.PLAY_SOUND('fail')
          data.animations.insertRule('.' + data.svg.id + ' {animation: 1s 1 forwards line-fail !important}\n')
          // Get list of invalid elements
          if (puzzle.settings.FLASH_FOR_ERRORS) {
            for (var invalidElement of puzzleData.invalidElements) {
              data.animations.insertRule('.' + data.svg.id + '_' + invalidElement.x + '_' + invalidElement.y + ' {animation: 0.4s 20 alternate-reverse error}\n')
            }
          }
        }
      }, 1)

    // Right-clicked (or double-tapped) and not at the end: Clear puzzle
    } else if (event.isRightClick()) {
      window.PLAY_SOUND('abort')
      clearGrid(data.svg, puzzle)
    } else { // Exit lock but allow resuming from the cursor (Desktop only)
      data.cursor.onpointerdown = function(event) {
        if (start.parentElement !== data.svg) return // Another puzzle is live, so data is gone
        data.tracing = true
        hookMovementEvents(start)
      }
    }

    unhookMovementEvents()
  }
}

window.clearAnimations = function() {
  if (data.animations == null) return
  for (var i=0; i<data.animations.cssRules.length; i++) {
    var rule = data.animations.cssRules[i]
    if (rule.selectorText != null && rule.selectorText.startsWith('.' + data.svg.id)) {
      data.animations.deleteRule(i--)
    }
  }
}

window.onTraceStart = function(puzzle, pos, svg, start, symStart=null) {
  var x = parseFloat(start.getAttribute('cx'))
  var y = parseFloat(start.getAttribute('cy'))

  var cursor = createElement('circle')
  cursor.setAttribute('r', 12)
  cursor.setAttribute('fill', window.CURSOR)
  cursor.setAttribute('stroke', 'black')
  cursor.setAttribute('stroke-width', '2px')
  cursor.setAttribute('stroke-opacity', '0.4')
  cursor.setAttribute('class', 'cursor')
  cursor.setAttribute('cx', x)
  cursor.setAttribute('cy', y)
  svg.insertBefore(cursor, svg.getElementById('cursorPos'))

  data.svg = svg
  data.cursor = cursor
  data.x = x
  data.y = y
  data.pos = pos
  data.sym = puzzle.getSymmetricalPos(pos.x, pos.y)
  data.puzzle = puzzle
  data.path = []
  puzzle.startPoint = {'x': pos.x, 'y': pos.y}

  if (pos.x % 2 === 1) { // Start point is on a horizontal segment
    data.bbox = new BoundingBox(x - 29, x + 29, y - 12, y + 12)
  } else if (pos.y % 2 === 1) { // Start point is on a vertical segment
    data.bbox = new BoundingBox(x - 12, x + 12, y - 29, y + 29)
  } else { // Start point is at an intersection
    data.bbox = new BoundingBox(x - 12, x + 12, y - 12, y + 12)
  }

  for (var styleSheet of document.styleSheets) {
    if (styleSheet.title === 'animations') {
      data.animations = styleSheet
      break
    }
  }

  clearAnimations()

  // Add initial line segments + secondary symmetry cursor, if needed
  if (puzzle.symmetry == null) {
    data.puzzle.updateCell2(data.pos.x, data.pos.y, 'type', 'line')
    data.puzzle.updateCell2(data.pos.x, data.pos.y, 'line', window.LINE_BLACK)
  } else {
    data.puzzle.updateCell2(data.pos.x, data.pos.y, 'type', 'line')
    data.puzzle.updateCell2(data.pos.x, data.pos.y, 'line', window.LINE_BLUE)
    data.puzzle.updateCell2(data.sym.x, data.sym.y, 'type', 'line')
    data.puzzle.updateCell2(data.sym.x, data.sym.y, 'line', window.LINE_YELLOW)

    var dx = parseFloat(symStart.getAttribute('cx')) - data.x
    var dy = parseFloat(symStart.getAttribute('cy')) - data.y
    data.symbbox = new BoundingBox(
      data.bbox.raw.x1 + dx,
      data.bbox.raw.x2 + dx,
      data.bbox.raw.y1 + dy,
      data.bbox.raw.y2 + dy,
      sym = true)

    data.symcursor = createElement('circle')
    svg.insertBefore(data.symcursor, data.cursor)
    data.symcursor.setAttribute('class', 'line-3 ' + data.svg.id)
    data.symcursor.setAttribute('cx', symStart.getAttribute('cx'))
    data.symcursor.setAttribute('cy', symStart.getAttribute('cy'))
    data.symcursor.setAttribute('r', 12)
  }

  // Fixup: Mark out of bounds cells as null, setting inbounds cells as {}
  // This allows tracing to correctly identify inbounds cells (and thus interior walls) and correctly handle exterior walls for oddly shaped puzzles.
  {
    var savedGrid = data.puzzle.switchToMaskedGrid()
    var maskedGrid = data.puzzle.grid
    data.puzzle.grid = savedGrid

    for (var x=1; x<data.puzzle.width; x+=2) {
      for (var y=1; y<data.puzzle.height; y+=2) {
        if (maskedGrid[x][y] == null) { // null == MASKED_OOB
          data.puzzle.grid[x][y] = null
        } else if (data.puzzle.grid[x][y] == null) {
          data.puzzle.grid[x][y] = {}
        }
      }
    }
  }
  data.path.push(new PathSegment(MOVE_NONE)) // Must be created after initializing data.symbbox
}

// In case the user exit the pointer lock via another means (clicking outside the window, hitting esc, etc)
// we still need to disengage our tracing hooks.
document.onpointerlockchange = function() {
  if (document.pointerLockElement == null) unhookMovementEvents()
}

function unhookMovementEvents() {
  data.start = null
  document.onmousemove = null
  document.ontouchstart = null
  document.ontouchmove = null
  document.ontouchend = null
  if (document.exitPointerLock != null) document.exitPointerLock()
  if (document.mozExitPointerLock != null) document.mozExitPointerLock()
}

function hookMovementEvents(start) {
  data.start = start
  if (start.requestPointerLock != null) start.requestPointerLock()
  if (start.mozRequestPointerLock != null) start.mozRequestPointerLock()

  var sens = parseFloat(document.getElementById('sens').value)
  document.onmousemove = function(event) {
    // Working around a race condition where movement events fire after the handler is removed.
    if (data.tracing !== true) return
    // Prevent accidental fires on mobile platforms (ios and android). They will be handled via ontouchmove instead.
    if (event.movementX == null) return
    onMove(sens * event.movementX, sens * event.movementY)
  }
  document.ontouchstart = function(event) {
    if (event.touches.length > 1) {
      // Stop tracing for two+ finger touches (the equivalent of a right click on desktop)
      window.trace(event, data.puzzle, null, null, null)
      return
    }
    data.lastTouchPos = event.position
  }
  document.ontouchmove = function(event) {
    if (data.tracing !== true) return

    var eventIsWithinPuzzle = false
    for (var node = event.target; node != null; node = node.parentElement) {
      if (node == data.svg) {
        eventIsWithinPuzzle = true
        break
      }
    }
    if (!eventIsWithinPuzzle) return // Ignore drag events that aren't within the puzzle
    event.preventDefault() // Prevent accidental scrolling if the touch event is within the puzzle.

    var newPos = event.position
    onMove(newPos.x - data.lastTouchPos.x, newPos.y - data.lastTouchPos.y)
    data.lastTouchPos = newPos
  }
  document.ontouchend = function(event) {
    data.lastTouchPos = null
    // Only call window.trace (to stop tracing) if we're really in an endpoint.
    var cell = data.puzzle.getCell(data.pos.x, data.pos.y)
    if (cell.end != null && data.bbox.inMain(data.x, data.y)) {
      window.trace(event, data.puzzle, null, null, null)
    }
  }
}

// @Volatile -- must match order of PATH_* in solve
var MOVE_NONE   = 0
var MOVE_LEFT   = 1
var MOVE_RIGHT  = 2
var MOVE_TOP    = 3
var MOVE_BOTTOM = 4

window.onMove = function(dx, dy) {
  {
    // Also handles some collision
    var collidedWith = pushCursor(dx, dy)
    console.spam('Collided with', collidedWith)
  }

  while (true) {
    hardCollision()

    // Potentially move the location to a new cell, and make absolute boundary checks
    var moveDir = move()
    data.path[data.path.length - 1].redraw()
    if (moveDir === MOVE_NONE) break
    console.debug('Moved', ['none', 'left', 'right', 'top', 'bottom'][moveDir])

    // Potentially adjust data.x/data.y if our position went around a pillar
    if (data.puzzle.pillar === true) pillarWrap(moveDir)

    var lastDir = data.path[data.path.length - 1].dir
    var backedUp = ((moveDir === MOVE_LEFT && lastDir === MOVE_RIGHT)
                 || (moveDir === MOVE_RIGHT && lastDir === MOVE_LEFT)
                 || (moveDir === MOVE_TOP && lastDir === MOVE_BOTTOM)
                 || (moveDir === MOVE_BOTTOM && lastDir === MOVE_TOP))

    if (data.puzzle.symmetry != null) {
      var symMoveDir = getSymmetricalDir(data.puzzle, moveDir)
    }

    // If we backed up, remove a path segment and mark the old cell as unvisited
    if (backedUp) {
      data.path.pop().destroy()
      data.puzzle.updateCell2(data.pos.x, data.pos.y, 'line', window.LINE_NONE)
      if (data.puzzle.symmetry != null) {
        data.puzzle.updateCell2(data.sym.x, data.sym.y, 'line', window.LINE_NONE)
      }
    }

    // Move to the next cell
    changePos(data.bbox, data.pos, moveDir)
    if (data.puzzle.symmetry != null) {
      changePos(data.symbbox, data.sym, symMoveDir)
    }

    // If we didn't back up, add a path segment and mark the new cell as visited
    if (!backedUp) {
      data.path.push(new PathSegment(moveDir))
      if (data.puzzle.symmetry == null) {
        data.puzzle.updateCell2(data.pos.x, data.pos.y, 'line', window.LINE_BLACK)
      } else {
        data.puzzle.updateCell2(data.pos.x, data.pos.y, 'line', window.LINE_BLUE)
        data.puzzle.updateCell2(data.sym.x, data.sym.y, 'line', window.LINE_YELLOW)
      }
    }
  }
}

// Helper function for pushCursor. Used to determine the direction and magnitude of redirection.
function push(dx, dy, dir, targetDir) {
  // Fraction of movement to redirect in the other direction
  var movementRatio = null
  if (targetDir === 'left' || targetDir === 'top') {
    movementRatio = -3
  } else if (targetDir === 'right' || targetDir === 'bottom') {
    movementRatio = 3
  }
  if (window.settings.disablePushing === true) movementRatio *= 1000

  if (dir === 'left') {
    var overshoot = data.bbox.x1 - (data.x + dx) + 12
    if (overshoot > 0) {
      data.y += dy + overshoot / movementRatio
      data.x = data.bbox.x1 + 12
      return true
    }
  } else if (dir === 'right') {
    var overshoot = (data.x + dx) - data.bbox.x2 + 12
    if (overshoot > 0) {
      data.y += dy + overshoot / movementRatio
      data.x = data.bbox.x2 - 12
      return true
    }
  } else if (dir === 'leftright') {
    data.y += dy + Math.abs(dx) / movementRatio
    return true
  } else if (dir === 'top') {
    var overshoot = data.bbox.y1 - (data.y + dy) + 12
    if (overshoot > 0) {
      data.x += dx + overshoot / movementRatio
      data.y = data.bbox.y1 + 12
      return true
    }
  } else if (dir === 'bottom') {
    var overshoot = (data.y + dy) - data.bbox.y2 + 12
    if (overshoot > 0) {
      data.x += dx + overshoot / movementRatio
      data.y = data.bbox.y2 - 12
      return true
    }
  } else if (dir === 'topbottom') {
    data.x += dx + Math.abs(dy) / movementRatio
    return true
  }
  return false
}

// Redirect momentum from pushing against walls, so that all further moment steps
// will be strictly linear. Returns a string for logging purposes only.
function pushCursor(dx, dy) {
  // Outer wall collision
  var cell = data.puzzle.getCell(data.pos.x, data.pos.y)
  if (cell == null) return 'nothing'

  // Only consider non-endpoints or endpoints which are parallel
  if ([undefined, 'top', 'bottom'].includes(cell.end)) {
    var leftCell = data.puzzle.getCell(data.pos.x - 1, data.pos.y)
    if (leftCell == null || leftCell.gap === window.GAP_FULL) {
      if (push(dx, dy, 'left', 'top')) return 'left outer wall'
    }
    var rightCell = data.puzzle.getCell(data.pos.x + 1, data.pos.y)
    if (rightCell == null || rightCell.gap === window.GAP_FULL) {
      if (push(dx, dy, 'right', 'top')) return 'right outer wall'
    }
  }
  // Only consider non-endpoints or endpoints which are parallel
  if ([undefined, 'left', 'right'].includes(cell.end)) {
    var topCell = data.puzzle.getCell(data.pos.x, data.pos.y - 1)
    if (topCell == null || topCell.gap === window.GAP_FULL) {
      if (push(dx, dy, 'top', 'right')) return 'top outer wall'
    }
    var bottomCell = data.puzzle.getCell(data.pos.x, data.pos.y + 1)
    if (bottomCell == null || bottomCell.gap === window.GAP_FULL) {
      if (push(dx, dy, 'bottom', 'right')) return 'bottom outer wall'
    }
  }

  // Inner wall collision
  if (cell.end == null) {
    if (data.pos.x%2 === 1 && data.pos.y%2 === 0) { // Horizontal cell
      if (data.x < data.bbox.middle.x) {
        push(dx, dy, 'topbottom', 'left')
        return 'topbottom inner wall, moved left'
      } else {
        push(dx, dy, 'topbottom', 'right')
        return 'topbottom inner wall, moved right'
      }
    } else if (data.pos.x%2 === 0 && data.pos.y%2 === 1) { // Vertical cell
      if (data.y < data.bbox.middle.y) {
        push(dx, dy, 'leftright', 'top')
        return 'leftright inner wall, moved up'
      } else {
        push(dx, dy, 'leftright', 'bottom')
        return 'leftright inner wall, moved down'
      }
    }
  }

  // Intersection & endpoint collision
  // Ratio of movement to be considered turning at an intersection
  var turnMod = 2
  if ((data.pos.x%2 === 0 && data.pos.y%2 === 0) || cell.end != null) {
    if (data.x < data.bbox.middle.x) {
      push(dx, dy, 'topbottom', 'right')
      // Overshot the intersection and appears to be trying to turn
      if (data.x > data.bbox.middle.x && Math.abs(dy) * turnMod > Math.abs(dx)) {
        data.y += Math.sign(dy) * (data.x - data.bbox.middle.x)
        data.x = data.bbox.middle.x
        return 'overshot moving right'
      }
      return 'intersection moving right'
    } else if (data.x > data.bbox.middle.x) {
      push(dx, dy, 'topbottom', 'left')
      // Overshot the intersection and appears to be trying to turn
      if (data.x < data.bbox.middle.x && Math.abs(dy) * turnMod > Math.abs(dx)) {
        data.y += Math.sign(dy) * (data.bbox.middle.x - data.x)
        data.x = data.bbox.middle.x
        return 'overshot moving left'
      }
      return 'intersection moving left'
    }
    if (data.y < data.bbox.middle.y) {
      push(dx, dy, 'leftright', 'bottom')
      // Overshot the intersection and appears to be trying to turn
      if (data.y > data.bbox.middle.y && Math.abs(dx) * turnMod > Math.abs(dy)) {
        data.x += Math.sign(dx) * (data.y - data.bbox.middle.y)
        data.y = data.bbox.middle.y
        return 'overshot moving down'
      }
      return 'intersection moving down'
    } else if (data.y > data.bbox.middle.y) {
      push(dx, dy, 'leftright', 'top')
      // Overshot the intersection and appears to be trying to turn
      if (data.y < data.bbox.middle.y && Math.abs(dx) * turnMod > Math.abs(dy)) {
        data.x += Math.sign(dx) * (data.bbox.middle.y - data.y)
        data.y = data.bbox.middle.y
        return 'overshot moving up'
      }
      return 'intersection moving up'
    }
  }

  // No collision, limit movement to X or Y only to prevent out-of-bounds
  if (Math.abs(dx) > Math.abs(dy)) {
    data.x += dx
    return 'nothing, x'
  } else {
    data.y += dy
    return 'nothing, y'
  }
}

// Check to see if we collided with any gaps, or with a symmetrical line, or a startpoint.
// In any case, abruptly zero momentum.
function hardCollision() {
  var lastDir = data.path[data.path.length - 1].dir
  var cell = data.puzzle.getCell(data.pos.x, data.pos.y)
  if (cell == null) return

  var gapSize = 0
  if (cell.gap === window.GAP_BREAK) {
    console.spam('Collided with a gap')
    gapSize = 21
  } else {
    var nextCell = null
    if (lastDir === MOVE_LEFT)   nextCell = data.puzzle.getCell(data.pos.x - 1, data.pos.y)
    if (lastDir === MOVE_RIGHT)  nextCell = data.puzzle.getCell(data.pos.x + 1, data.pos.y)
    if (lastDir === MOVE_TOP)    nextCell = data.puzzle.getCell(data.pos.x, data.pos.y - 1)
    if (lastDir === MOVE_BOTTOM) nextCell = data.puzzle.getCell(data.pos.x, data.pos.y + 1)
    if (nextCell != null && nextCell.start === true && nextCell.line > window.LINE_NONE) {
      gapSize = -5
    }
  }

  if (data.puzzle.symmetry != null) {
    if (data.sym.x === data.pos.x && data.sym.y === data.pos.y) {
      console.spam('Collided with our symmetrical line')
      gapSize = 13
    } else if (data.puzzle.getCell(data.sym.x, data.sym.y).gap === window.GAP_BREAK) {
      console.spam('Symmetrical line hit a gap')
      gapSize = 21
    }
  }
  if (gapSize === 0) return // Didn't collide with anything

  if (lastDir === MOVE_LEFT) {
    data.x = Math.max(data.bbox.middle.x + gapSize, data.x)
  } else if (lastDir === MOVE_RIGHT) {
    data.x = Math.min(data.x, data.bbox.middle.x - gapSize)
  } else if (lastDir === MOVE_TOP) {
    data.y = Math.max(data.bbox.middle.y + gapSize, data.y)
  } else if (lastDir === MOVE_BOTTOM) {
    data.y = Math.min(data.y, data.bbox.middle.y - gapSize)
  }
}

// Check to see if we've gone beyond the edge of puzzle cell, and if the next cell is safe,
// i.e. not out of bounds. Reports the direction we are going to move (or none),
// but does not actually change data.pos
function move() {
  var lastDir = data.path[data.path.length - 1].dir

  if (data.x < data.bbox.x1 + 12) { // Moving left
    var cell = data.puzzle.getCell(data.pos.x - 1, data.pos.y)
    if (cell == null || cell.type !== 'line' || cell.gap === window.GAP_FULL) {
      console.spam('Collided with outside / gap-2', cell)
      data.x = data.bbox.x1 + 12
    } else if (cell.line > window.LINE_NONE && lastDir !== MOVE_RIGHT) {
      console.spam('Collided with other line', cell.line)
      data.x = data.bbox.x1 + 12
    } else if (data.puzzle.symmetry != null) {
      var symCell = data.puzzle.getSymmetricalCell(data.pos.x - 1, data.pos.y)
      if (symCell == null || symCell.type !== 'line' || symCell.gap === window.GAP_FULL) {
        console.spam('Collided with symmetrical outside / gap-2', cell)
        data.x = data.bbox.x1 + 12
      }
    }
    if (data.x < data.bbox.x1) {
      return MOVE_LEFT
    }
  } else if (data.x > data.bbox.x2 - 12) { // Moving right
    var cell = data.puzzle.getCell(data.pos.x + 1, data.pos.y)
    if (cell == null || cell.type !== 'line' || cell.gap === window.GAP_FULL) {
      console.spam('Collided with outside / gap-2', cell)
      data.x = data.bbox.x2 - 12
    } else if (cell.line > window.LINE_NONE && lastDir !== MOVE_LEFT) {
      console.spam('Collided with other line', cell.line)
      data.x = data.bbox.x2 - 12
    } else if (data.puzzle.symmetry != null) {
      var symCell = data.puzzle.getSymmetricalCell(data.pos.x + 1, data.pos.y)
      if (symCell == null || symCell.type !== 'line' || symCell.gap === window.GAP_FULL) {
        console.spam('Collided with symmetrical outside / gap-2', cell)
        data.x = data.bbox.x2 - 12
      }
    }
    if (data.x > data.bbox.x2) {
      return MOVE_RIGHT
    }
  } else if (data.y < data.bbox.y1 + 12) { // Moving up
    var cell = data.puzzle.getCell(data.pos.x, data.pos.y - 1)
    if (cell == null || cell.type !== 'line' || cell.gap === window.GAP_FULL) {
      console.spam('Collided with outside / gap-2', cell)
      data.y = data.bbox.y1 + 12
    } else if (cell.line > window.LINE_NONE && lastDir !== MOVE_BOTTOM) {
      console.spam('Collided with other line', cell.line)
      data.y = data.bbox.y1 + 12
    } else if (data.puzzle.symmetry != null) {
      var symCell = data.puzzle.getSymmetricalCell(data.pos.x, data.pos.y - 1)
      if (symCell == null || symCell.type !== 'line' || symCell.gap === window.GAP_FULL) {
        console.spam('Collided with symmetrical outside / gap-2', cell)
        data.y = data.bbox.y1 + 12
      }
    }
    if (data.y < data.bbox.y1) {
      return MOVE_TOP
    }
  } else if (data.y > data.bbox.y2 - 12) { // Moving down
    var cell = data.puzzle.getCell(data.pos.x, data.pos.y + 1)
    if (cell == null || cell.type !== 'line' || cell.gap === window.GAP_FULL) {
      console.spam('Collided with outside / gap-2')
      data.y = data.bbox.y2 - 12
    } else if (cell.line > window.LINE_NONE && lastDir !== MOVE_TOP) {
      console.spam('Collided with other line', cell.line)
      data.y = data.bbox.y2 - 12
    } else if (data.puzzle.symmetry != null) {
      var symCell = data.puzzle.getSymmetricalCell(data.pos.x, data.pos.y + 1)
      if (symCell == null || symCell.type !== 'line' || symCell.gap === window.GAP_FULL) {
        console.spam('Collided with symmetrical outside / gap-2', cell)
        data.y = data.bbox.y2 - 12
      }
    }
    if (data.y > data.bbox.y2) {
      return MOVE_BOTTOM
    }
  }
  return MOVE_NONE
}

// Check to see if you moved beyond the edge of a pillar.
// If so, wrap the cursor x to preserve momentum.
// Note that this still does not change the position.
function pillarWrap(moveDir) {
  if (moveDir === MOVE_LEFT && data.pos.x === 0) {
    data.x += data.puzzle.width * 41
  }
  if (moveDir === MOVE_RIGHT && data.pos.x === data.puzzle.width - 1) {
    data.x -= data.puzzle.width * 41
  }
}

// Actually change the data position. (Note that this takes in pos to allow easier symmetry).
// Note that this doesn't zero the momentum, so that we can adjust appropriately on further loops.
// This function also shifts the bounding box that we use to determine the bounds of the cell.
function changePos(bbox, pos, moveDir) {
  if (moveDir === MOVE_LEFT) {
    pos.x--
    // Wrap around the left
    if (data.puzzle.pillar === true && pos.x < 0) {
      pos.x += data.puzzle.width
      bbox.shift('right', data.puzzle.width * 41 - 82)
      bbox.shift('right', 58)
    } else {
      bbox.shift('left', (pos.x%2 === 0 ? 24 : 58))
    }
  } else if (moveDir === MOVE_RIGHT) {
    pos.x++
    // Wrap around to the right
    if (data.puzzle.pillar === true && pos.x >= data.puzzle.width) {
      pos.x -= data.puzzle.width
      bbox.shift('left', data.puzzle.width * 41 - 82)
      bbox.shift('left', 24)
    } else {
      bbox.shift('right', (pos.x%2 === 0 ? 24 : 58))
    }
  } else if (moveDir === MOVE_TOP) {
    pos.y--
    bbox.shift('top', (pos.y%2 === 0 ? 24 : 58))
  } else if (moveDir === MOVE_BOTTOM) {
    pos.y++
    bbox.shift('bottom', (pos.y%2 === 0 ? 24 : 58))
  }
}

})
