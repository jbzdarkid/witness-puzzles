window.BBOX_DEBUG = false

class BoundingBox {
  constructor(x1, x2, y1, y2) {
    this.raw = {'x1':x1, 'x2':x2, 'y1':y1, 'y2':y2}
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
    var cell = data.puzzle.getCell(data.pos.x, data.pos.y)
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
  }
}

class PathSegment {
  constructor(dir) {
    this.poly1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    this.circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    this.poly2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    this.dir = dir
    data.svg.insertBefore(this.poly1, data.cursor)
    data.svg.insertBefore(this.circ, data.cursor)
    data.svg.insertBefore(this.poly2, data.cursor)
    this.circ.setAttribute('cx', data.bbox.middle.x)
    this.circ.setAttribute('cy', data.bbox.middle.y)
    if (this.dir === 'none') { // Start point
      this.circ.setAttribute('r', 24)
    } else {
      this.circ.setAttribute('r', 12)
    }

    if (data.puzzle.symmetry == undefined) {
      this.poly1.setAttribute('class', 'line-1 ' + data.svg.id)
      this.circ.setAttribute('class', 'line-1 ' + data.svg.id)
      this.poly2.setAttribute('class', 'line-1 ' + data.svg.id)
    } else {
      this.poly1.setAttribute('class', 'line-2 ' + data.svg.id)
      this.circ.setAttribute('class', 'line-2 ' + data.svg.id)
      this.poly2.setAttribute('class', 'line-2 ' + data.svg.id)

      this.sympoly1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      this.symcirc = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      this.sympoly2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      this.symcursor = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      data.svg.insertBefore(this.sympoly1, data.cursor)
      data.svg.insertBefore(this.symcirc, data.cursor)
      data.svg.insertBefore(this.sympoly2, data.cursor)
      data.svg.insertBefore(this.symcursor, data.cursor)
      this.sympoly1.setAttribute('class', 'line-3 ' + data.svg.id)
      this.symcirc.setAttribute('class', 'line-3 ' + data.svg.id)
      this.sympoly2.setAttribute('class', 'line-3 ' + data.svg.id)
      this.symcursor.setAttribute('class', 'line-3 ' + data.svg.id)

      var refl = this._reflect(data.bbox.middle.x, data.bbox.middle.y)
      this.symcirc.setAttribute('cx', refl.x)
      this.symcirc.setAttribute('cy', refl.y)
      this.symcirc.setAttribute('r', this.circ.getAttribute('r'))
      this.symcursor.setAttribute('cx', refl.x)
      this.symcursor.setAttribute('cy', refl.y)
      this.symcursor.setAttribute('r', 12)
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
      data.svg.removeChild(this.symcursor)
    }
  }

  redraw() { // Uses raw bbox because of endpoints
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

    // The second half of the line uses the raw so that it can enter the endpoint properly.
    var firstHalf = false
    var isEnd = (data.puzzle.grid[data.pos.x][data.pos.y].end != undefined)
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
    } else if (this.dir !== 'none') { // Start point always has circle visible
      firstHalf = true
    }

    this.poly2.setAttribute('points',
      points2.x1 + ' ' + points2.y1 + ',' +
      points2.x1 + ' ' + points2.y2 + ',' +
      points2.x2 + ' ' + points2.y2 + ',' +
      points2.x2 + ' ' + points2.y1
    )

    if (firstHalf && this.dir !== 'none') { // Doesn't apply to the startpoint
      this.circ.setAttribute('opacity', 0)
      this.poly2.setAttribute('opacity', 0)
    } else {
      this.circ.setAttribute('opacity', 1)
      this.poly2.setAttribute('opacity', 1)
    }
    if (data.puzzle.symmetry != undefined) {
      var tmp = this._reflect(points1.x1, points1.y1)
      var tmp2 = this._reflect(points1.x2, points1.y2)
      points1.x1 = tmp2.x
      points1.x2 = tmp.x
      points1.y1 = tmp2.y
      points1.y2 = tmp.y

      this.sympoly1.setAttribute('points',
        points1.x1 + ' ' + points1.y1 + ',' +
        points1.x1 + ' ' + points1.y2 + ',' +
        points1.x2 + ' ' + points1.y2 + ',' +
        points1.x2 + ' ' + points1.y1
      )

      var tmp = this._reflect(points2.x1, points2.y1)
      var tmp2 = this._reflect(points2.x2, points2.y2)
      points2.x1 = tmp2.x
      points2.x2 = tmp.x
      points2.y1 = tmp2.y
      points2.y2 = tmp.y

      this.sympoly2.setAttribute('points',
        points2.x1 + ' ' + points2.y1 + ',' +
        points2.x1 + ' ' + points2.y2 + ',' +
        points2.x2 + ' ' + points2.y2 + ',' +
        points2.x2 + ' ' + points2.y1
      )

      if (this.dir !== 'none') {
        var x = data.x.clamp(data.bbox.x1, data.bbox.x2)
        var y = data.y.clamp(data.bbox.y1, data.bbox.y2)
        var refl = this._reflect(x, y)
        this.symcursor.setAttribute('cx', refl.x)
        this.symcursor.setAttribute('cy', refl.y)
      }

      this.symcirc.setAttribute('opacity', this.circ.getAttribute('opacity'))
      this.sympoly2.setAttribute('opacity', this.poly2.getAttribute('opacity'))
    }
  }

  _reflect(x, y) {
    if (data.puzzle.symmetry != undefined) {
      // @Future: Symmetry + pillars = :(
      // if (this.pillar) x = x + (this.grid.length - 1)/2
      if (data.puzzle.symmetry.x === true) {
        x = data.sumX - x
      }
      if (data.puzzle.symmetry.y === true) {
        y = data.sumY - y
      }
    }
    return {'x':x, 'y':y}
  }
}

var data = {}

function _clearGrid(svg, puzzle) {
  if (data.bboxDebug != undefined) {
    data.svg.removeChild(data.bboxDebug)
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
    window.PLAY_SOUND('start')
    window.TELEMETRY('start_trace')
    // Cleans drawn lines & puzzle state
    _clearGrid(svg, puzzle)
    onTraceStart(puzzle, pos, svg, start, symStart)
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
        data.animations.insertRule('.' + svg.id + ' {animation: 1s 1 forwards line-success}')
      } else {
        window.PLAY_SOUND('fail')
        window.TELEMETRY('stop_trace_fail')
        data.animations.insertRule('.' + svg.id + ' {animation: 1s 1 forwards line-fail}')
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
        if (this.parentElement !== data.svg) return // Another puzzle is live, so data is gone
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

  data = {
    'tracing':true,
    'svg':svg,
    // Cursor element and location
    'cursor': cursor,
    'x':x,
    'y':y,
    // Position within puzzle.grid
    'pos':pos,
    'puzzle':puzzle,
    'bbox':undefined,
    'path':[],
  }
  data.bboxDebug = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  svg.appendChild(data.bboxDebug)
  data.bboxDebug.setAttribute('fill', 'white')
  data.bboxDebug.setAttribute('opacity', 0.3)
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

    data.sumX = parseFloat(symStart.getAttribute('cx')) + x
    data.sumY = parseFloat(symStart.getAttribute('cy')) + y
  }
  data.path.push(new PathSegment('none')) // Must be after data.sumX/sumY
}

document.onpointerlockchange = function() {
  if (document.pointerLockElement == null ) {
    document.onmousemove = null
    document.ontouchmove = null
    document.onclick = null
    document.ontouchend = null
  } else {
    var sens = parseFloat(document.getElementById('sens').value)
    document.onmousemove = function(event) {
      onMove(sens * event.movementX, sens * event.movementY)
    }
    document.ontouchmove = function(event) {
      // TODO: Save the identifier & x/y from the touchstart, then compute deltas
    }
    // document.ontouchend = function(event) {_stopTrace(event)}
  }
}

function onMove(dx, dy) {
  if (!data.tracing) return
  var width = (data.pos.x%2 === 0 ? 24 : 58)
  var height = (data.pos.y%2 === 0 ? 24 : 58)

  // Also handles some collision
  var colliedWith = _pushCursor(dx, dy, width, height)
  console.spam('Collided with', colliedWith)

  // Potentially move the location to a new cell, and make absolute boundary checks
  while (true) {
    _gapCollision()
    var moveDir = _move()
    data.path[data.path.length - 1].redraw()
    if (moveDir === 'none') break
    console.debug('Moved', moveDir)
    _changePos(moveDir)
  }

  // Move the cursor
  data.cursor.setAttribute('cx', data.x)
  data.cursor.setAttribute('cy', data.y)

  if (window.BBOX_DEBUG) {
    data.bboxDebug.setAttribute('x', data.bbox.x1)
    data.bboxDebug.setAttribute('y', data.bbox.y1)
    data.bboxDebug.setAttribute('width', data.bbox.x2 - data.bbox.x1)
    data.bboxDebug.setAttribute('height', data.bbox.y2 - data.bbox.y1)
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

function _pushCursor(dx, dy, width, height) {
  // Outer wall collision
  var cell = data.puzzle.getCell(data.pos.x, data.pos.y)
  if (cell == undefined) return

  if (!data.puzzle.pillar) { // Left/right walls are inner if we're a pillar
    if ([undefined, 'top', 'bottom'].includes(cell.end)) {
      // Only consider non-endpoints or endpoints which are parallel
      if (data.pos.x === 0) { // Against left wall
        if (_push(dx, dy, 'left', 'top')) return 'left outer wall'
      }
      if (data.pos.x === data.puzzle.grid.length - 1) { // Against right wall
        if (_push(dx, dy, 'right', 'top')) return 'right outer wall'
      }
    }
  }
  if ([undefined, 'left', 'right'].includes(cell.end)) {
    if (data.pos.y === 0) { // Against top wall
      if (_push(dx, dy, 'top', 'right')) return 'top outer wall'
    }
    if (data.pos.y === data.puzzle.grid[data.pos.x].length - 1) { // Against bottom wall
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

function _gapCollision() {
  var lastDir = data.path[data.path.length - 1].dir
  var cell = data.puzzle.getCell(data.pos.x, data.pos.y)
  if (cell != undefined && cell.gap !== true) return

  if (data.pos.x%2 === 1 && data.pos.y%2 === 0) { // Horizontal cell
    if (lastDir === 'left') {
      data.x = Math.max(data.bbox.middle.x + 21, data.x)
    } else if (lastDir === 'right') {
      data.x = Math.min(data.x, data.bbox.middle.x - 21)
    }
  } else if (data.pos.x%2 === 0 && data.pos.y%2 === 1) { // Vertical cell
    if (lastDir === 'top') {
      data.y = Math.max(data.bbox.middle.y + 21, data.y)
    } else if (lastDir === 'bottom') {
      data.y = Math.min(data.y, data.bbox.middle.y - 21)
    }
  }
}

// Change actual puzzle cells, and limit motion to only puzzle cells.
// Returns the direction moved, or null otherwise.
function _move() {
  var lastDir = data.path[data.path.length - 1].dir

  if (data.x < data.bbox.x1 + 12) { // Moving left
    var line = data.puzzle.getLine(data.pos.x - 1, data.pos.y)
    if (line == undefined) {
      data.x = data.bbox.x1 + 12
    } else if (line > 0 && lastDir !== 'right') {
      data.x = data.bbox.x1 + 12
    } else if (data.x < data.bbox.x1) {
      return 'left'
    }
  } else if (data.x > data.bbox.x2 - 12) { // Moving right
    var line = data.puzzle.getLine(data.pos.x + 1, data.pos.y)
    if (line == undefined) {
      data.x = data.bbox.x2 - 12
    } else if (line > 0 && lastDir !== 'left') {
      data.x = data.bbox.x2 - 12
    } else if (data.x > data.bbox.x2) {
      return 'right'
    }
  } else if (data.y < data.bbox.y1 + 12) { // Moving up
    var line = data.puzzle.getLine(data.pos.x, data.pos.y - 1)
    if (line == undefined) {
      data.y = data.bbox.y1 + 12
    } else if (line > 0 && lastDir !== 'bottom') {
      data.y = data.bbox.y1 + 12
    } else if (data.y < data.bbox.y1) {
      return 'top'
    }
  } else if (data.y > data.bbox.y2 - 12) { // Moving down
    var line = data.puzzle.getLine(data.pos.x, data.pos.y + 1)
    if (line == undefined) {
      data.y = data.bbox.y2 - 12
    } else if (line > 0 && lastDir !== 'top') {
      data.y = data.bbox.y2 - 12
    } else if (data.y > data.bbox.y2) {
      return 'bottom'
    }
  }
  return 'none'
}

function _changePos(moveDir) {
  var lastDir = data.path[data.path.length - 1].dir

  var backedUp = (
    (moveDir === 'left' && lastDir === 'right') ||
    (moveDir === 'right' && lastDir === 'left') ||
    (moveDir === 'top' && lastDir === 'bottom') ||
    (moveDir === 'bottom' && lastDir === 'top'))

  if (backedUp) { // Exited cell, mark as unvisited
    data.path.pop().destroy()
    if (data.puzzle.symmetry == undefined) {
      data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':0})
    } else {
      data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':0})
      var sym = data.puzzle.getSymmetricalPos(data.pos.x, data.pos.y)
      data.puzzle.updateCell(sym.x, sym.y, {'color':0})
    }
  }
  if (moveDir === 'left') {
    data.pos.x--
    if (data.puzzle.pillar && data.pos.x < 0) { // Wrap around the left
      data.x += data.puzzle.grid.length * 41
      data.pos.x += data.puzzle.grid.length
      data.bbox.shift('right', data.puzzle.grid.length * 41 - 82)
      data.bbox.shift('right', 58)
    } else {
      data.bbox.shift('left', (data.pos.x%2 === 0 ? 24 : 58))
    }
  } else if (moveDir === 'right') {
    data.pos.x++
    if (data.puzzle.pillar && data.pos.x >= data.puzzle.grid.length) { // Wrap around to the right
      data.x -= data.puzzle.grid.length * 41
      data.pos.x -= data.puzzle.grid.length
      data.bbox.shift('left', data.puzzle.grid.length * 41 - 82)
      data.bbox.shift('left', 24)
    } else {
      data.bbox.shift('right', (data.pos.x%2 === 0 ? 24 : 58))
    }
  } else if (moveDir === 'top') {
    data.pos.y--
    data.bbox.shift('top', (data.pos.y%2 === 0 ? 24 : 58))
  } else if (moveDir === 'bottom') {
    data.pos.y++
    data.bbox.shift('bottom', (data.pos.y%2 === 0 ? 24 : 58))
  }

  if (data.pos.x%2 === 1 && data.pos.y%2 === 1) {
    console.error('Cursor went out of bounds (into a cell)!')
  }

  if (!backedUp) { // Entered a new cell, mark as visited
    data.path.push(new PathSegment(moveDir))
    if (data.puzzle.symmetry == undefined) {
      data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':1})
    } else {
      data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':2})
      var sym = data.puzzle.getSymmetricalPos(data.pos.x, data.pos.y)
      data.puzzle.updateCell(sym.x, sym.y, {'color':3})
    }
  }
}
