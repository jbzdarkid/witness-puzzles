window.BBOX_DEBUG = false

class BoundingBox {
  constructor(x1, x2, y1, y2, sym=false) {
    this.raw = {'x1':x1, 'x2':x2, 'y1':y1, 'y2':y2}
    this.sym = sym
    if (window.BBOX_DEBUG === true) {
      this.debug = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      data.svg.appendChild(this.debug)
      this.debug.setAttribute('opacity', 0.5)
      this.debug.setAttribute('style', 'pointer-events: none;')
      if (data.puzzle.symmetry == undefined) {
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
    // Check for endpoint adjustment
    this.x1 = this.raw.x1
    this.x2 = this.raw.x2
    this.y1 = this.raw.y1
    this.y2 = this.raw.y2
    if (this.sym !== true) {
      var cell = data.puzzle.getCell(data.pos.x, data.pos.y)
    } else {
      var sym = data.puzzle.getSymmetricalPos(data.pos.x, data.pos.y)
      var cell = data.puzzle.getCell(sym.x, sym.y)
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

    if (this.debug != undefined) {
      this.debug.setAttribute('x', this.x1)
      this.debug.setAttribute('y', this.y1)
      this.debug.setAttribute('width', this.x2 - this.x1)
      this.debug.setAttribute('height', this.y2 - this.y1)
    }
  }
}

class PathSegment {
  constructor(dir) {
    this.poly1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    this.circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    this.poly2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    this.dir = dir
    data.svg.insertBefore(this.circ, data.cursor)
    data.svg.insertBefore(this.poly2, data.cursor)
    this.circ.setAttribute('cx', data.bbox.middle.x)
    this.circ.setAttribute('cy', data.bbox.middle.y)

    if (data.puzzle.symmetry == undefined) {
      this.poly1.setAttribute('class', 'line-1 ' + data.svg.id)
      this.circ.setAttribute('class', 'line-1 ' + data.svg.id)
      this.poly2.setAttribute('class', 'line-1 ' + data.svg.id)

      if (this.dir === 'none') { // Start point
        this.circ.setAttribute('r', 24)
        this.circ.setAttribute('class', this.circ.getAttribute('class') + ' start')
      } else {
        // Only insert poly1 in non-startpoints
        data.svg.insertBefore(this.poly1, data.cursor)
        this.circ.setAttribute('r', 12)
      }
    } else {
      this.poly1.setAttribute('class', 'line-2 ' + data.svg.id)
      this.circ.setAttribute('class', 'line-2 ' + data.svg.id)
      this.poly2.setAttribute('class', 'line-2 ' + data.svg.id)

      if (this.dir === 'none') { // Start point
        this.circ.setAttribute('r', 24)
        this.circ.setAttribute('class', this.circ.getAttribute('class') + ' start')
      } else {
        // Only insert poly1 in non-startpoints
        data.svg.insertBefore(this.poly1, data.cursor)
        this.circ.setAttribute('r', 12)
      }

      this.sympoly1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      this.symcirc = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      this.sympoly2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      data.svg.insertBefore(this.symcirc, data.cursor)
      data.svg.insertBefore(this.sympoly2, data.cursor)
      this.sympoly1.setAttribute('class', 'line-3 ' + data.svg.id)
      this.symcirc.setAttribute('class', 'line-3 ' + data.svg.id)
      this.sympoly2.setAttribute('class', 'line-3 ' + data.svg.id)

      this.symcirc.setAttribute('cx', data.symbbox.middle.x)
      this.symcirc.setAttribute('cy', data.symbbox.middle.y)
      this.symcirc.setAttribute('r', this.circ.getAttribute('r'))

      if (this.dir === 'none') { // Start point
        this.circ.setAttribute('r', 24)
        this.circ.setAttribute('class', this.circ.getAttribute('class') + ' start')
        this.symcirc.setAttribute('r', 24)
        this.symcirc.setAttribute('class', this.symcirc.getAttribute('class') + ' start')
      } else {
        // Only insert poly1 in non-startpoints
        data.svg.insertBefore(this.sympoly1, data.cursor)
        this.circ.setAttribute('r', 12)
        this.symcirc.setAttribute('r', 12)
      }
    }
  }

  destroy() {
    data.svg.removeChild(this.poly1)
    data.svg.removeChild(this.circ)
    data.svg.removeChild(this.poly2)
    if (data.puzzle.symmetry != undefined) {
      data.svg.removeChild(this.sympoly1)
      data.svg.removeChild(this.symcirc)
      data.svg.removeChild(this.sympoly2)
    }
  }

  redraw() { // Uses raw bbox because of endpoints
    // Move the cursor
    var x = data.x.clamp(data.bbox.x1, data.bbox.x2)
    var y = data.y.clamp(data.bbox.y1, data.bbox.y2)
    data.cursor.setAttribute('cx', x)
    data.cursor.setAttribute('cy', y)
    if (data.puzzle.symmetry != undefined) {
      data.symcursor.setAttribute('cx', this._reflX(x))
      data.symcursor.setAttribute('cy', this._reflY(y))
    }

    // Draw the first-half box
    var points1 = JSON.parse(JSON.stringify(data.bbox.raw))
    if (this.dir === 'left') {
      points1.x1 = data.x.clamp(data.bbox.middle.x, data.bbox.x2)
    } else if (this.dir === 'right') {
      points1.x2 = data.x.clamp(data.bbox.x1, data.bbox.middle.x)
    } else if (this.dir === 'top') {
      points1.y1 = data.y.clamp(data.bbox.middle.y, data.bbox.y2)
    } else if (this.dir === 'bottom') {
      points1.y2 = data.y.clamp(data.bbox.y1, data.bbox.middle.y)
    }
    this.poly1.setAttribute('points',
      points1.x1 + ' ' + points1.y1 + ',' +
      points1.x1 + ' ' + points1.y2 + ',' +
      points1.x2 + ' ' + points1.y2 + ',' +
      points1.x2 + ' ' + points1.y1
    )

    var firstHalf = false
    var isEnd = (data.puzzle.grid[data.pos.x][data.pos.y].end != undefined)
    // The second half of the line uses the raw so that it can enter the endpoint properly.
    var points2 = JSON.parse(JSON.stringify(data.bbox.raw))
    if (data.x < data.bbox.middle.x && this.dir !== 'right') {
      points2.x1 = data.x.clamp(data.bbox.x1, data.bbox.middle.x)
      points2.x2 = data.bbox.middle.x
      if (isEnd && data.pos.x%2 == 0 && data.pos.y%2 == 1) {
        points2.y1 += 17
        points2.y2 -= 17
      }
    } else if (data.x > data.bbox.middle.x && this.dir !== 'left') {
      points2.x1 = data.bbox.middle.x
      points2.x2 = data.x.clamp(data.bbox.middle.x, data.bbox.x2)
      if (isEnd && data.pos.x%2 == 0 && data.pos.y%2 == 1) {
        points2.y1 += 17
        points2.y2 -= 17
      }
    } else if (data.y < data.bbox.middle.y && this.dir !== 'bottom') {
      points2.y1 = data.y.clamp(data.bbox.y1, data.bbox.middle.y)
      points2.y2 = data.bbox.middle.y
      if (isEnd && data.pos.x%2 == 1 && data.pos.y%2 == 0) {
        points2.x1 += 17
        points2.x2 -= 17
      }
    } else if (data.y > data.bbox.middle.y && this.dir !== 'top') {
      points2.y1 = data.bbox.middle.y
      points2.y2 = data.y.clamp(data.bbox.middle.y, data.bbox.y2)
      if (isEnd && data.pos.x%2 == 1 && data.pos.y%2 == 0) {
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
    if (firstHalf && this.dir !== 'none') {
      this.circ.setAttribute('opacity', 0)
    } else {
      this.circ.setAttribute('opacity', 1)
    }

    // Draw the symmetrical path based on the original one
    if (data.puzzle.symmetry != undefined) {
      this.sympoly1.setAttribute('points',
        this._reflX(points1.x2) + ' ' + this._reflY(points1.y2) + ',' +
        this._reflX(points1.x2) + ' ' + this._reflY(points1.y1) + ',' +
        this._reflX(points1.x1) + ' ' + this._reflY(points1.y1) + ',' +
        this._reflX(points1.x1) + ' ' + this._reflY(points1.y2)
      )

      this.sympoly2.setAttribute('points',
        this._reflX(points2.x2) + ' ' + this._reflY(points2.y2) + ',' +
        this._reflX(points2.x2) + ' ' + this._reflY(points2.y1) + ',' +
        this._reflX(points2.x1) + ' ' + this._reflY(points2.y1) + ',' +
        this._reflX(points2.x1) + ' ' + this._reflY(points2.y2)
      )

      this.symcirc.setAttribute('opacity', this.circ.getAttribute('opacity'))
      this.sympoly2.setAttribute('opacity', this.poly2.getAttribute('opacity'))
    }
  }

  _reflX(x) {
    if (data.puzzle.symmetry == undefined) return x
    if (data.puzzle.symmetry.x === true) {
      // Mirror position inside the bounding box
      return (data.bbox.middle.x - x) + data.symbbox.middle.x
    }
    // Copy position inside the bounding box
    return (x - data.bbox.middle.x) + data.symbbox.middle.x
  }

  _reflY(y) {
    if (data.puzzle.symmetry == undefined) return y
    if (data.puzzle.symmetry.y === true) {
      // Mirror position inside the bounding box
      return (data.bbox.middle.y - y) + data.symbbox.middle.y
    }
    // Copy position inside the bounding box
    return (y - data.bbox.middle.y) + data.symbbox.middle.y
  }
}

var data = {}

function _clearGrid(svg, puzzle) {
  if (data.bbox != undefined && data.bbox.debug != undefined) {
    data.svg.removeChild(data.bbox.debug)
    data.bbox = undefined
  }
  if (data.symbbox != undefined && data.symbbox.debug != undefined) {
    data.svg.removeChild(data.symbbox.debug)
    data.symbbox = undefined
  }

  while (svg.getElementsByClassName('cursor').length > 0) {
    svg.getElementsByClassName('cursor')[0].remove()
  }

  while (svg.getElementsByClassName('line-1').length > 0) {
    svg.getElementsByClassName('line-1')[0].remove()
  }

  while (svg.getElementsByClassName('line-2').length > 0) {
    svg.getElementsByClassName('line-2')[0].remove()
  }

  while (svg.getElementsByClassName('line-3').length > 0) {
    svg.getElementsByClassName('line-3')[0].remove()
  }

  puzzle.clearLines()
}

function addTraceStart(puzzle, pos, start, symStart=undefined) {
  start.onclick = function(event) {
    trace(event, puzzle, pos, this, symStart)
  }
}

function trace(event, puzzle, pos, start, symStart=undefined) {
  var svg = start.parentElement
  if (document.pointerLockElement == null) { // Started tracing a solution
    data.tracing = true
    window.PLAY_SOUND('start')
    window.TELEMETRY('start_trace')
    // Cleans drawn lines & puzzle state
    _clearGrid(svg, puzzle)
    onTraceStart(puzzle, pos, svg, start, symStart)
    // 1/6 sec = 150ms
    data.animations.insertRule('.' + svg.id + '.start {animation: 0.15s 1 forwards start-grow}')
    start.requestPointerLock()
  } else {
    event.stopPropagation()
    // Signal the onMouseMove to stop accepting input (race condition)
    data.tracing = false

    // At endpoint and in main box
    var cell = puzzle.getCell(data.pos.x, data.pos.y)
    if (cell.end != undefined && data.bbox.inMain(data.x, data.y)) {
      data.cursor.onclick = null
      window.validate(puzzle)

      for (var negation of puzzle.negations) {
        console.debug('Rendering negation', negation)
        data.animations.insertRule('.' + svg.id + '_' + negation.source.x + '_' + negation.source.y + ' {animation: 0.75s 1 forwards fade}')
        data.animations.insertRule('.' + svg.id + '_' + negation.target.x + '_' + negation.target.y + ' {animation: 0.75s 1 forwards fade}')
      }

      if (puzzle.valid) {
        window.PLAY_SOUND('success')
        window.TELEMETRY('stop_trace_success')
        // !important to override the child animation
        data.animations.insertRule('.' + svg.id + ' {animation: 1s 1 forwards line-success !important}')
        if (window.TRACE_COMPLETION_FUNC) window.TRACE_COMPLETION_FUNC(puzzle)
      } else {
        window.PLAY_SOUND('fail')
        window.TELEMETRY('stop_trace_fail')
        data.animations.insertRule('.' + svg.id + ' {animation: 1s 1 forwards line-fail !important}')
        // Get list of invalid elements
        for (var invalidElement of puzzle.invalidElements) {
          data.animations.insertRule('.' + svg.id + '_' + invalidElement.x + '_' + invalidElement.y + ' {animation: 0.4s 20 alternate-reverse error}')
        }
      }

    } else if (event.which === 3) { // Right-clicked, not at the end: Clear puzzle
      window.PLAY_SOUND('abort')
      window.TELEMETRY('stop_trace_abort')
      _clearGrid(svg, puzzle)
    } else { // Exit lock but allow resuming from the cursor
      window.TELEMETRY('stop_trace_temporary')
      data.cursor.onclick = function(event) {
        if (svg !== data.svg) return // Another puzzle is live, so data is gone
        window.TELEMETRY('start_trace_temporary')
        data.tracing = true
        start.requestPointerLock()
      }
    }
    document.exitPointerLock()
  }
}

function onTraceStart(puzzle, pos, svg, start, symStart=undefined) {
  var x = parseFloat(start.getAttribute('cx'))
  var y = parseFloat(start.getAttribute('cy'))

  var cursor = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  svg.appendChild(cursor)
  cursor.setAttribute('r', 12)
  cursor.setAttribute('fill', window.CURSOR)
  cursor.setAttribute('stroke', 'black')
  cursor.setAttribute('stroke-width', '2px')
  cursor.setAttribute('stroke-opacity', '0.4')
  cursor.setAttribute('class', 'cursor')
  cursor.setAttribute('cx', x)
  cursor.setAttribute('cy', y)

  data.svg = svg
  data.cursor = cursor
  data.x = x
  data.y = y
  data.pos = pos
  data.puzzle = puzzle
  data.path = []

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
  for (var i = 0; i < data.animations.cssRules.length; i++) {
    var rule = data.animations.cssRules[i]
    if (rule.selectorText != undefined && rule.selectorText.startsWith('.' + svg.id)) {
      data.animations.deleteRule(i--)
    }
  }

  if (puzzle.symmetry == undefined) {
    data.puzzle.updateCell(pos.x, pos.y, {'type':'line', 'color':1})
  } else {
    data.puzzle.updateCell(pos.x, pos.y, {'type':'line', 'color':2})
    var sym = data.puzzle.getSymmetricalPos(pos.x, pos.y)
    data.puzzle.updateCell(sym.x, sym.y, {'type':'line', 'color':3})

    var dx = parseFloat(symStart.getAttribute('cx')) - data.x
    var dy = parseFloat(symStart.getAttribute('cy')) - data.y
    data.symbbox = new BoundingBox(
      data.bbox.raw.x1 + dx,
      data.bbox.raw.x2 + dx,
      data.bbox.raw.y1 + dy,
      data.bbox.raw.y2 + dy,
      sym=true)

    data.symcursor = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    svg.appendChild(data.symcursor)
    data.symcursor.setAttribute('class', 'line-3 ' + data.svg.id)
    data.symcursor.setAttribute('cx', symStart.getAttribute('cx'))
    data.symcursor.setAttribute('cy', symStart.getAttribute('cy'))
    data.symcursor.setAttribute('r', 12)
  }
  data.path.push(new PathSegment('none')) // Must be created after initializing data.symbbox
}

document.onpointerlockchange = function() {
  if (document.pointerLockElement == null) {
    document.onmousemove = null
    document.ontouchmove = null
    document.onclick = null
    document.ontouchend = null
  } else {
    var sens = parseFloat(document.getElementById('sens').value)
    document.onmousemove = function(event) {
      // Working around a race condition where movement events fire after the handler is removed.
      if (data.tracing !== true) return
      onMove(sens * event.movementX, sens * event.movementY)
    }
    document.ontouchmove = function(event) {
      // TODO: Save the identifier & x/y from the touchstart, then compute deltas
    }
    // document.ontouchend = function(event) {_stopTrace(event)}
  }
}

function onMove(dx, dy) {
  // Also handles some collision
  var colliedWith = _pushCursor(dx, dy)
  console.spam('Collided with', colliedWith)

  while (true) {
    _gapAndSymmetryCollision()

    // Potentially move the location to a new cell, and make absolute boundary checks
    var moveDir = _move()
    data.path[data.path.length - 1].redraw()
    if (moveDir === 'none') break
    console.debug('Moved', moveDir)

    // Potentially adjust data.x/data.y if our position went around a pillar
    if (data.puzzle.pillar) _pillarWrap(moveDir)

    var lastDir = data.path[data.path.length - 1].dir
    var backedUp = ((moveDir === 'left' && lastDir === 'right')
                 || (moveDir === 'right' && lastDir === 'left')
                 || (moveDir === 'top' && lastDir === 'bottom')
                 || (moveDir === 'bottom' && lastDir === 'top'))

    if (data.puzzle.symmetry != undefined) {
      var sym = data.puzzle.getSymmetricalPos(data.pos.x, data.pos.y)
      var symMoveDir = data.puzzle.getSymmetricalDir(moveDir)
    }

    // If we backed up, remove a path segment and mark the old cell as unvisited
    if (backedUp) {
      data.path.pop().destroy()
      data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':0})
      if (sym != undefined) data.puzzle.updateCell(sym.x, sym.y, {'color':0})
    }

    // Move to the next cell
    _changePos(data.bbox, data.pos, moveDir)
    if (sym != undefined) _changePos(data.symbbox, sym, symMoveDir)


    // If we didn't back up, add a path segment and mark the new cell as visited
    if (!backedUp) {
      data.path.push(new PathSegment(moveDir))
      if (sym == undefined) {
        data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':1})
      } else {
        data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':2})
        data.puzzle.updateCell(sym.x, sym.y, {'color':3})
      }
    }
  }
}

function _push(dx, dy, dir, targetDir) {
  // Fraction of movement to redirect in the other direction
  var movementRatio = undefined
  if (targetDir === 'left' || targetDir === 'top') {
    movementRatio = -3
  } else if (targetDir === 'right' || targetDir === 'bottom') {
    movementRatio = 3
  }

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

function _pushCursor(dx, dy) {
  // Outer wall collision
  var cell = data.puzzle.getCell(data.pos.x, data.pos.y)
  if (cell == undefined) return

  // Only consider non-endpoints or endpoints which are parallel
  if ([undefined, 'top', 'bottom'].includes(cell.end)) {
    var leftCell = data.puzzle.getCell(data.pos.x - 1, data.pos.y)
    if (leftCell == undefined || leftCell.gap === 2) {
      if (_push(dx, dy, 'left', 'top')) return 'left outer wall'
    }
    var rightCell = data.puzzle.getCell(data.pos.x + 1, data.pos.y)
    if (rightCell == undefined || rightCell.gap === 2) {
      if (_push(dx, dy, 'right', 'top')) return 'right outer wall'
    }
  }
  // Only consider non-endpoints or endpoints which are parallel
  if ([undefined, 'left', 'right'].includes(cell.end)) {
    var topCell = data.puzzle.getCell(data.pos.x, data.pos.y - 1)
    if (topCell == undefined || topCell.gap === 2) {
      if (_push(dx, dy, 'top', 'right')) return 'top outer wall'
    }
    var bottomCell = data.puzzle.getCell(data.pos.x, data.pos.y + 1)
    if (bottomCell == undefined || bottomCell.gap === 2) {
      if (_push(dx, dy, 'bottom', 'right')) return 'bottom outer wall'
    }
  }

  // Inner wall collision
  if (cell.end == undefined) {
    if (data.pos.x%2 === 1 && data.pos.y%2 === 0) { // Horizontal cell
      if (data.x < data.bbox.middle.x) {
        _push(dx, dy, 'topbottom', 'left')
        return 'topbottom inner wall, moved left'
      } else {
        _push(dx, dy, 'topbottom', 'right')
        return 'topbottom inner wall, moved right'
      }
    } else if (data.pos.x%2 === 0 && data.pos.y%2 === 1) { // Vertical cell
      if (data.y < data.bbox.middle.y) {
        _push(dx, dy, 'leftright', 'top')
        return 'leftright inner wall, moved up'
      } else {
        _push(dx, dy, 'leftright', 'bottom')
        return 'leftright inner wall, moved down'
      }
    }
  }

  // Intersection & endpoint collision
  // Ratio of movement to be considered turning at an intersection
  var turnMod = 2
  if ((data.pos.x%2 === 0 && data.pos.y%2 === 0) || cell.end != undefined) {
    if (data.x < data.bbox.middle.x) {
      _push(dx, dy, 'topbottom', 'right')
      // Overshot the intersection and appears to be trying to turn
      if (data.x > data.bbox.middle.x && Math.abs(dy) * turnMod > Math.abs(dx)) {
        data.y += Math.sign(dy) * (data.x - data.bbox.middle.x)
        data.x = data.bbox.middle.x
        return 'overshot moving right'
      }
      return 'intersection moving right'
    } else if (data.x > data.bbox.middle.x) {
      _push(dx, dy, 'topbottom', 'left')
      // Overshot the intersection and appears to be trying to turn
      if (data.x < data.bbox.middle.x && Math.abs(dy) * turnMod > Math.abs(dx)) {
        data.y += Math.sign(dy) * (data.bbox.middle.x - data.x)
        data.x = data.bbox.middle.x
        return 'overshot moving left'
      }
      return 'intersection moving left'
    }
    if (data.y < data.bbox.middle.y) {
      _push(dx, dy, 'leftright', 'bottom')
      // Overshot the intersection and appears to be trying to turn
      if (data.y > data.bbox.middle.y && Math.abs(dx) * turnMod > Math.abs(dy)) {
        data.x += Math.sign(dx) * (data.y - data.bbox.middle.y)
        data.y = data.bbox.middle.y
        return 'overshot moving down'
      }
      return 'intersection moving down'
    } else if (data.y > data.bbox.middle.y) {
      _push(dx, dy, 'leftright', 'top')
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

function _gapAndSymmetryCollision() {
  var lastDir = data.path[data.path.length - 1].dir
  var cell = data.puzzle.getCell(data.pos.x, data.pos.y)
  if (cell == undefined) return

  var gapSize = 0
  if (cell.gap === 1) {
    gapSize = 21
  } else if (data.puzzle.symmetry != undefined) {
    var sym = data.puzzle.getSymmetricalPos(data.pos.x, data.pos.y)
    if (sym.x === data.pos.x && sym.y === data.pos.y) {
      gapSize = 13
    }
  }
  if (gapSize === 0) return

  if (lastDir === 'left') {
    data.x = Math.max(data.bbox.middle.x + gapSize, data.x)
  } else if (lastDir === 'right') {
    data.x = Math.min(data.x, data.bbox.middle.x - gapSize)
  } else if (lastDir === 'top') {
    data.y = Math.max(data.bbox.middle.y + gapSize, data.y)
  } else if (lastDir === 'bottom') {
    data.y = Math.min(data.y, data.bbox.middle.y - gapSize)
  }
}

// Change actual puzzle cells, and limit motion to only puzzle cells.
// Returns the direction moved, or null otherwise.
// @Bug: Handle start-point collision here.
function _move() {
  var lastDir = data.path[data.path.length - 1].dir

  // @Bug: This might be doing outer-wall collision against inner walls...?
  if (data.x < data.bbox.x1 + 12) { // Moving left
    var cell = data.puzzle.getCell(data.pos.x - 1, data.pos.y)
    if (cell == undefined || cell.type !== 'line' || cell.gap === 2) {
      console.spam('Collided with outside / gap-2', cell)
      data.x = data.bbox.x1 + 12
    } else if (cell.color > 0 && lastDir !== 'right') {
      console.spam('Collided with other line', cell.color)
      data.x = data.bbox.x1 + 12
    } else if (data.x < data.bbox.x1) {
      return 'left'
    }
  } else if (data.x > data.bbox.x2 - 12) { // Moving right
    var cell = data.puzzle.getCell(data.pos.x + 1, data.pos.y)
    if (cell == undefined || cell.type !== 'line' || cell.gap === 2) {
      console.spam('Collided with outside / gap-2', cell)
      data.x = data.bbox.x2 - 12
    } else if (cell.color > 0 && lastDir !== 'left') {
      console.spam('Collided with other line', cell.color)
      data.x = data.bbox.x2 - 12
    } else if (data.x > data.bbox.x2) {
      return 'right'
    }
  } else if (data.y < data.bbox.y1 + 12) { // Moving up
    var cell = data.puzzle.getCell(data.pos.x, data.pos.y - 1)
    if (cell == undefined || cell.type !== 'line' || cell.gap === 2) {
      console.spam('Collided with outside / gap-2', cell)
      data.y = data.bbox.y1 + 12
    } else if (cell.color > 0 && lastDir !== 'bottom') {
      console.spam('Collided with other line', cell.color)
      data.y = data.bbox.y1 + 12
    } else if (data.y < data.bbox.y1) {
      return 'top'
    }
  } else if (data.y > data.bbox.y2 - 12) { // Moving down
    var cell = data.puzzle.getCell(data.pos.x, data.pos.y + 1)
    if (cell == undefined || cell.type !== 'line' || cell.gap === 2) {
      console.spam('Collided with outside / gap-2')
      data.y = data.bbox.y2 - 12
    } else if (cell.color > 0 && lastDir !== 'top') {
      console.spam('Collided with other line', cell.color)
      data.y = data.bbox.y2 - 12
    } else if (data.y > data.bbox.y2) {
      return 'bottom'
    }
  }
  return 'none'
}

// Adjust data.x by the width of the grid. This does preserve momentum around the edge.
function _pillarWrap(moveDir) {
  if (moveDir === 'left' && data.pos.x === 0) {
    data.x += data.puzzle.grid.length * 41
  }
  if (moveDir === 'right' && data.pos.x === data.puzzle.grid.length - 1) {
    data.x -= data.puzzle.grid.length * 41
  }
}

function _changePos(bbox, pos, moveDir) {
  if (moveDir === 'left') {
    pos.x--
    if (data.puzzle.pillar && pos.x < 0) { // Wrap around the left
      pos.x += data.puzzle.grid.length
      bbox.shift('right', data.puzzle.grid.length * 41 - 82)
      bbox.shift('right', 58)
    } else {
      bbox.shift('left', (pos.x%2 === 0 ? 24 : 58))
    }
  } else if (moveDir === 'right') {
    pos.x++
    if (data.puzzle.pillar && pos.x >= data.puzzle.grid.length) { // Wrap around to the right
      pos.x -= data.puzzle.grid.length
      bbox.shift('left', data.puzzle.grid.length * 41 - 82)
      bbox.shift('left', 24)
    } else {
      bbox.shift('right', (pos.x%2 === 0 ? 24 : 58))
    }
  } else if (moveDir === 'top') {
    pos.y--
    bbox.shift('top', (pos.y%2 === 0 ? 24 : 58))
  } else if (moveDir === 'bottom') {
    pos.y++
    bbox.shift('bottom', (pos.y%2 === 0 ? 24 : 58))
  }

  if (pos.x%2 === 1 && pos.y%2 === 1) {
    console.error('Cursor went out of bounds (into a cell)!')
  }
}
