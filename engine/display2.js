function draw(puzzle, target='puzzle') {
  if (puzzle == undefined) return
  var svg = document.getElementById(target)
  console.info('Drawing', puzzle, 'into', svg)
  while (svg.firstChild) svg.removeChild(svg.firstChild)

  if (puzzle.pillar) {
    // 41*(width-1) + 30*2 (padding) + 10*2 (border)
    var pixelWidth = 41*puzzle.grid.length + 80
  } else {
    // 41*(width-1) + 24 (extra edge) + 30*2 (padding) + 10*2 (border)
    var pixelWidth = 41*puzzle.grid.length + 63
  }
  var pixelHeight = 41*puzzle.grid[0].length + 63
  svg.setAttribute('viewbox', '0 0 ' + pixelWidth + ' ' + pixelHeight)
  svg.style.width = pixelWidth
  svg.style.height = pixelHeight

  var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  svg.appendChild(rect)
  rect.setAttribute('stroke-width', 10)
  rect.setAttribute('stroke', BORDER)
  rect.setAttribute('fill', BACKGROUND)
  // Accounting for the border thickness
  rect.setAttribute('x', 5)
  rect.setAttribute('y', 5)
  rect.setAttribute('width', pixelWidth - 10) // Removing border
  rect.setAttribute('height', pixelHeight - 10) // Removing border

  _drawGrid(puzzle, svg)
  // Detects and returns the start element to begin tracing
  var startData = _drawStartAndEnd(puzzle, svg)
  // Draw cell symbols after so they overlap the lines, if necessary
  _drawSymbols(puzzle, svg, target)
  if (startData) {
    onTraceStart(svg, puzzle, startData.elem)
    _drawSolution(puzzle, startData.x, startData.y)
  }
}

function _drawGrid(puzzle, svg) {
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('stroke-width', 24)
      line.setAttribute('stroke-linecap', 'round')
      line.setAttribute('stroke', FOREGROUND)
      if (x%2 == 1 && y%2 == 0) { // Horizontal
        line.setAttribute('x1', (x-1)*41 + 52)
        if (puzzle.pillar && x == puzzle.grid.length - 1) {
          line.setAttribute('x2', (x+1)*41 + 28)
        } else {
          line.setAttribute('x2', (x+1)*41 + 52)
        }
        line.setAttribute('y1', y*41 + 52)
        line.setAttribute('y2', y*41 + 52)
        svg.appendChild(line)

        /* Try:
        if (puzzle.pillar && x == 1) {
          line.setAttribute('x1', (x-1)*41 + 40)
        } else {
          line.setAttribute('x1', (x-1)*41 + 52)
        }
        if (puzzle.pillar && x == puzzle.grid.length - 1) {
          line.setAttribute('x2', (x+1)*41 + 40)
        } else {
          line.setAttribute('x2', (x+1)*41 + 52)
        } */

        if (puzzle.pillar) {
          if (x == 1) {
            var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            rect.setAttribute('x', (x-1)*41 + 40)
            rect.setAttribute('y', y*41 + 40)
            rect.setAttribute('width', 24)
            rect.setAttribute('height', 24)
            rect.setAttribute('fill', FOREGROUND)
            svg.appendChild(rect)
          }
          if (x == puzzle.grid.length - 1) {
            var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            rect.setAttribute('x', (x+1)*41 + 16)
            rect.setAttribute('y', y*41 + 40)
            rect.setAttribute('width', 24)
            rect.setAttribute('height', 24)
            rect.setAttribute('fill', FOREGROUND)
            svg.appendChild(rect)
          }
        }
      } else if (x%2 == 0 && y%2 == 1) { // Vertical
        line.setAttribute('x1', x*41 + 52)
        line.setAttribute('x2', x*41 + 52)
        line.setAttribute('y1', (y-1)*41 + 52)
        line.setAttribute('y2', (y+1)*41 + 52)
        svg.appendChild(line)
      }
    }
  }
}

function _drawSymbols(puzzle, svg, target) {
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined) continue
      var params = {
        'width':58,
        'height':58,
        'x': x*41 + 23,
        'y': y*41 + 23,
        'class': target + '_' + x + '_' + y,
      }
      if (cell.dot > 0) {
        params.type = 'dot'
        if (cell.dot == 1) params.color = 'black'
        // @Future: When I implement 2-color dots
        // if (cell.dot == 2) params.color = 'blue'
        // if (cell.dot == 3) params.color = 'orange'
        drawSymbolWithSvg(svg, params)
      } else if (cell.gap) {
        params.type = 'gap'
        if (x%2 == 0 && y%2 == 1) params.rot = 1
        drawSymbolWithSvg(svg, params)
      } else if (x%2 == 1 && y%2 == 1) {
        Object.assign(params, cell)
        drawSymbolWithSvg(svg, params)
      }
    }
  }
}

function _drawStartAndEnd(puzzle, svg) {
  for (var endPoint of puzzle.endPoints) {
    if (endPoint.dir == undefined) {
      console.error('Endpoint at', endPoint.x, endPoint.y, 'has no defined direction!')
      continue
    }
    drawSymbolWithSvg(svg, {
      'type':'end',
      'width': 58,
      'height': 58,
      'dir': endPoint.dir,
      'x': endPoint.x*41 + 23,
      'y': endPoint.y*41 + 23,
    })
  }

  var startData = undefined
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined || cell.start != true) continue
      drawSymbolWithSvg(svg, {
        'type':'start',
        'width': 58,
        'height': 58,
        'x': x*41 + 23,
        'y': y*41 + 23,
      })
      var start = svg.lastChild
      // @Cleanup: I'm setting x and y on the startpoint here to pass them in to trace. Ideally, I'd like to set them
      // in the onclick function below, but passing parameters through scope is hard.
      start.id = x + '_' + y
      start.onclick = function(event) {
        trace(this, event, puzzle)
      }

      // The startpoint must have a primary line through it
      // @Future: if (cell.color != 1 || cell.color != 2) continue
      if (cell.color != 1) continue

      // And that line must not be coming from any adjacent cells
      var leftCell = puzzle.getCell(x - 1, y)
      if (leftCell != undefined && leftCell.dir == 'right') continue

      var rightCell = puzzle.getCell(x + 1, y)
      if (rightCell != undefined && rightCell.dir == 'left') continue

      var topCell = puzzle.getCell(x, y - 1)
      if (topCell != undefined && topCell.dir == 'bottom') continue

      var bottomCell = puzzle.getCell(x, y + 1)
      if (bottomCell != undefined && bottomCell.dir == 'top') continue

      startData = {'elem':start, 'x':x, 'y':y}
    }
  }
  return startData
}

function _drawSolution(puzzle, x, y) {
  console.info('Drawing solution')
  var rows = '   |'
  for (var i=0; i<puzzle.grid.length; i++) {
    if (i < 10) rows += ' '
    rows += '  ' + i + ' |'
  }
  console.info(rows)
  for (var j=0; j<puzzle.grid[0].length; j++) {
    var output = ''
    if (j < 10) output += ' '
    output += j + ' |'
    for (var i=0; i<puzzle.grid.length; i++) {
      var cell = puzzle.grid[i][j]
      if (cell == undefined || cell.dir == undefined) {
        output += '     |'
      } else if (cell.dir == 'left') {
        output += 'left |'
      } else if (cell.dir == 'right') {
        output += 'right|'
      } else if (cell.dir == 'top') {
        output += 'up   |'
      } else if (cell.dir == 'bottom') {
        output += 'down |'
      } else if (cell.dir == 'none') {
        output += 'none |'
      }
    }
    console.info(output)
  }

  // Limited because there is a chance of infinite looping with bad input data.
  for (var i=0; i<1000; i++) {
    console.log(puzzle.grid[8][8])
    var cell = puzzle.getCell(x, y)
    if (cell == undefined) {
      console.error('Solution trace went out of bounds at', x, y)
      return
    }
    var dir = cell.dir
    var dx = 0
    var dy = 0
    if (dir == 'none') { // Reached an endpoint, move into it
      var endDir = puzzle.getEndDir(x, y)
      console.log('Reached endpoint')
      if (endDir == 'left') {
        onMove(-24, 0)
      } else if (endDir == 'right') {
        onMove(24, 0)
      } else if (endDir == 'top') {
        onMove(0, -24)
      } else if (endDir == 'bottom') {
        onMove(0, 24)
      }
      return
    }
    else if (dir == 'left') dx = -1
    else if (dir == 'right') dx = 1
    else if (dir == 'top') dy = -1
    else if (dir == 'bottom') dy = 1

    console.log('Currently at', x, y, cell, 'moving', dx, dy)

    x += dx
    y += dy
    // Unflag the cell, move into it, and reflag it
    puzzle.updateCell(x, y, {'color':0})
    onMove(41 * dx, 41 * dy)
    puzzle.updateCell(x, y, {'color':1})
  }
}
