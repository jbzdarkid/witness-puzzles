window.BBOX_DEBUG = true

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

    if (data.puzzle.symmetry == undefined) {
      this.poly1.setAttribute('class', 'line-1 ' + data.svg.id)
      this.circ.setAttribute('class', 'line-1 ' + data.svg.id)
      this.poly2.setAttribute('class', 'line-1 ' + data.svg.id)

      if (this.dir === 'none') { // Start point
        this.circ.setAttribute('r', 24)
        this.circ.setAttribute('class', this.circ.getAttribute('class') + ' start')
      } else {
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
        this.circ.setAttribute('r', 12)
      }

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

      this.symcirc.setAttribute('cx', data.symbbox.middle.x)
      this.symcirc.setAttribute('cy', data.symbbox.middle.y)
      this.symcirc.setAttribute('r', this.circ.getAttribute('r'))
      this.symcursor.setAttribute('cx', data.symbbox.middle.x)
      this.symcursor.setAttribute('cy', data.symbbox.middle.y)
      this.symcursor.setAttribute('r', 12)

      if (this.dir === 'none') { // Start point
        this.circ.setAttribute('r', 24)
        this.circ.setAttribute('class', this.circ.getAttribute('class') + ' start')
        this.symcirc.setAttribute('r', 24)
        this.symcirc.setAttribute('class', this.symcirc.getAttribute('class') + ' start')
      } else {
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
    /* @Cleanup: This is a bit more complicated, and also a bit easier.
    if (data.puzzle.symmetry != undefined) {
      var refl1 = this._reflect(points1.x1, points1.y1)
      var refl2 = this._reflect(points1.x2, points1.y2)
      points1.x1 = refl2.x
      points1.x2 = refl1.x
      points1.y1 = refl2.y
      points1.y2 = refl1.y

      this.sympoly1.setAttribute('points',
        points1.x1 + ' ' + points1.y1 + ',' +
        points1.x1 + ' ' + points1.y2 + ',' +
        points1.x2 + ' ' + points1.y2 + ',' +
        points1.x2 + ' ' + points1.y1
      )

      var refl1 = this._reflect(points2.x1, points2.y1)
      var refl2 = this._reflect(points2.x2, points2.y2)
      points2.x1 = refl2.x
      points2.x2 = refl1.x
      points2.y1 = refl2.y
      points2.y2 = refl1.y

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
    */
  }

  _reflect(x, y) {
    if (data.puzzle.symmetry != undefined) {
      // @Future: Symmetry + pillars = :(
      // if (this.pillar) x = this.grid.length/2 - 1
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
    data.bboxDebug = undefined
  }
  if (data.symbboxDebug != undefined) {
    data.svg.removeChild(data.symbboxDebug)
    data.symbboxDebug = undefined
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
    'path':[],
  }
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

  data.bboxDebug = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  svg.appendChild(data.bboxDebug)
  data.bboxDebug.setAttribute('opacity', 0.3)
  if (puzzle.symmetry == undefined) {
    data.bboxDebug.setAttribute('fill', 'white')
    data.puzzle.updateCell(pos.x, pos.y, {'type':'line', 'color':1})
  } else {
    data.bboxDebug.setAttribute('fill', 'blue')

    data.symbboxDebug = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    svg.appendChild(data.symbboxDebug)
    data.symbboxDebug.setAttribute('opacity', 0.3)
    data.symbboxDebug.setAttribute('fill', 'orange')

    data.puzzle.updateCell(pos.x, pos.y, {'type':'line', 'color':2})
    var sym = data.puzzle.getSymmetricalPos(pos.x, pos.y)
    data.puzzle.updateCell(sym.x, sym.y, {'type':'line', 'color':3})

    var dx = parseFloat(symStart.getAttribute('cx')) - data.x
    var dy = parseFloat(symStart.getAttribute('cy')) - data.y
    data.symbbox = new BoundingBox(data.bbox.x1 + dx, data.bbox.x2 + dx, data.bbox.y1 + dy, data.bbox.y2 + dy)
    //data.sumX = parseFloat(symStart.getAttribute('cx')) + x
    //data.sumY = parseFloat(symStart.getAttribute('cy')) + y
  }
  data.path.push(new PathSegment('none')) // Must be created after initializing data.symbbox
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
    _gapAndSymmetryCollision()
    var moveDir = _move()
    data.path[data.path.length - 1].redraw()
    if (moveDir === 'none') break
    console.debug('Moved', moveDir)

    var lastDir = data.path[data.path.length - 1].dir
    var backedUp = (
      (moveDir === 'left' && lastDir === 'right') ||
      (moveDir === 'right' && lastDir === 'left') ||
      (moveDir === 'top' && lastDir === 'bottom') ||
      (moveDir === 'bottom' && lastDir === 'top'))

    if (data.puzzle.symmetry == undefined) {
      if (backedUp) { // Exited cell, mark as unvisited
        data.path.pop().destroy()
        data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':0})
      }
      _changePos(data.bbox, data.pos, moveDir)
      if (!backedUp) { // Entered a new cell, mark as visited
        data.path.push(new PathSegment(moveDir))
        data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':1})
      }
    } else { // data.puzzle.symmetry != undefined
      var sym = data.puzzle.getSymmetricalPos(data.pos.x, data.pos.y)
      var symMoveDir = data.puzzle.getSymmetricalDir(moveDir)
      if (backedUp) {
        data.path.pop().destroy()
        data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':0})
        data.puzzle.updateCell(sym.x, sym.y, {'color':0})
      }
      _changePos(data.bbox, data.pos, moveDir)
      _changePos(data.symbbox, sym, symMoveDir)
      if (!backedUp) {
        data.path.push(new PathSegment(moveDir))
        data.puzzle.updateCell(data.pos.x, data.pos.y, {'color':2})
        data.puzzle.updateCell(sym.x, sym.y, {'color':3})
      }
    }
  }

  // Move the cursor
  data.cursor.setAttribute('cx', data.x)
  data.cursor.setAttribute('cy', data.y)

  if (window.BBOX_DEBUG) {
    data.bboxDebug.setAttribute('x', data.bbox.x1)
    data.bboxDebug.setAttribute('y', data.bbox.y1)
    data.bboxDebug.setAttribute('width', data.bbox.x2 - data.bbox.x1)
    data.bboxDebug.setAttribute('height', data.bbox.y2 - data.bbox.y1)
    if (data.puzzle.symmetry != undefined)
    {
      data.symbboxDebug.setAttribute('x', data.symbbox.x1)
      data.symbboxDebug.setAttribute('y', data.symbbox.y1)
      data.symbboxDebug.setAttribute('width', data.symbbox.x2 - data.symbbox.x1)
      data.symbboxDebug.setAttribute('height', data.symbbox.y2 - data.symbbox.y1)
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

function _pushCursor(dx, dy, width, height) {
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
function _move() {
  var lastDir = data.path[data.path.length - 1].dir

  if (data.x < data.bbox.x1 + 12) { // Moving left
    var cell = data.puzzle.getCell(data.pos.x - 1, data.pos.y)
    if (cell == undefined || cell.type !== 'line' || cell.gap === 2) {
      data.x = data.bbox.x1 + 12
    } else if (cell.color > 0 && lastDir !== 'right') {
      data.x = data.bbox.x1 + 12
    } else if (data.x < data.bbox.x1) {
      return 'left'
    }
  } else if (data.x > data.bbox.x2 - 12) { // Moving right
    var cell = data.puzzle.getCell(data.pos.x + 1, data.pos.y)
    if (cell == undefined || cell.type !== 'line' || cell.gap === 2) {
      data.x = data.bbox.x2 - 12
    } else if (cell.color > 0 && lastDir !== 'left') {
      data.x = data.bbox.x2 - 12
    } else if (data.x > data.bbox.x2) {
      return 'right'
    }
  } else if (data.y < data.bbox.y1 + 12) { // Moving up
    var cell = data.puzzle.getCell(data.pos.x, data.pos.y - 1)
    if (cell == undefined || cell.type !== 'line' || cell.gap === 2) {
      data.y = data.bbox.y1 + 12
    } else if (cell.color > 0 && lastDir !== 'bottom') {
      data.y = data.bbox.y1 + 12
    } else if (data.y < data.bbox.y1) {
      return 'top'
    }
  } else if (data.y > data.bbox.y2 - 12) { // Moving down
    var cell = data.puzzle.getCell(data.pos.x, data.pos.y + 1)
    if (cell == undefined || cell.type !== 'line' || cell.gap === 2) {
      data.y = data.bbox.y2 - 12
    } else if (cell.color > 0 && lastDir !== 'top') {
      data.y = data.bbox.y2 - 12
    } else if (data.y > data.bbox.y2) {
      return 'bottom'
    }
  }
  return 'none'
}

function _changePos(bbox, pos, moveDir) {
  if (moveDir === 'left') {
    pos.x--
    if (data.puzzle.pillar && pos.x < 0) { // Wrap around the left
      data.x += data.puzzle.grid.length * 41
      pos.x += data.puzzle.grid.length
      bbox.shift('right', data.puzzle.grid.length * 41 - 82)
      bbox.shift('right', 58)
    } else {
      bbox.shift('left', (pos.x%2 === 0 ? 24 : 58))
    }
  } else if (moveDir === 'right') {
    pos.x++
    if (data.puzzle.pillar && pos.x >= data.puzzle.grid.length) { // Wrap around to the right
      data.x -= data.puzzle.grid.length * 41
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
