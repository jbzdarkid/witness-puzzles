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
  rect.setAttribute('stroke', window.BORDER)
  rect.setAttribute('fill', window.BACKGROUND)
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
    window.onTraceStart(puzzle, {'x':startData.x, 'y':startData.y}, svg, startData.start, startData.symStart)
    _drawSolution(puzzle, startData.x, startData.y)
  }
}

function _drawGrid(puzzle, svg) {
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell != undefined && cell.gap === 2) continue
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('stroke-width', 24)
      line.setAttribute('stroke-linecap', 'round')
      line.setAttribute('stroke', window.FOREGROUND)
      if (x%2 === 1 && y%2 === 0) { // Horizontal
        line.setAttribute('x1', (x-1)*41 + 52)
        if (puzzle.pillar && x === puzzle.grid.length - 1) {
          line.setAttribute('x2', (x+1)*41 + 28)
        } else {
          line.setAttribute('x2', (x+1)*41 + 52)
        }
        line.setAttribute('y1', y*41 + 52)
        line.setAttribute('y2', y*41 + 52)
        svg.appendChild(line)

        /* Try:
        if (puzzle.pillar && x === 1) {
          line.setAttribute('x1', (x-1)*41 + 40)
        } else {
          line.setAttribute('x1', (x-1)*41 + 52)
        }
        if (puzzle.pillar && x === puzzle.grid.length - 1) {
          line.setAttribute('x2', (x+1)*41 + 40)
        } else {
          line.setAttribute('x2', (x+1)*41 + 52)
        } */

        if (puzzle.pillar) {
          if (x === 1) {
            var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            rect.setAttribute('x', (x-1)*41 + 40)
            rect.setAttribute('y', y*41 + 40)
            rect.setAttribute('width', 24)
            rect.setAttribute('height', 24)
            rect.setAttribute('fill', window.FOREGROUND)
            svg.appendChild(rect)
          }
          if (x === puzzle.grid.length - 1) {
            var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            rect.setAttribute('x', (x+1)*41 + 16)
            rect.setAttribute('y', y*41 + 40)
            rect.setAttribute('width', 24)
            rect.setAttribute('height', 24)
            rect.setAttribute('fill', window.FOREGROUND)
            svg.appendChild(rect)
          }
        }
      } else if (x%2 === 0 && y%2 === 1) { // Vertical
        line.setAttribute('x1', x*41 + 52)
        line.setAttribute('x2', x*41 + 52)
        line.setAttribute('y1', (y-1)*41 + 52)
        line.setAttribute('y2', (y+1)*41 + 52)
        svg.appendChild(line)
      } else if (x%2 === 0 && y%2 === 0) { // Intersection
        var cell = puzzle.getCell(x, y)
        // Only for non-endpoints
        if (cell != undefined && cell.end == undefined) {
          var surroundingLines = 0
          var leftCell = puzzle.getCell(x - 1, y)
          if (leftCell != undefined && leftCell.gap !== 2) surroundingLines++
          var rightCell = puzzle.getCell(x + 1, y)
          if (rightCell != undefined && rightCell.gap !== 2) surroundingLines++
          var topCell = puzzle.getCell(x, y - 1)
          if (topCell != undefined && topCell.gap !== 2) surroundingLines++
          var bottomCell = puzzle.getCell(x, y + 1)
          if (bottomCell != undefined && bottomCell.gap !== 2) surroundingLines++
          if (surroundingLines === 1) {
            var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            rect.setAttribute('x', x*41 + 40)
            rect.setAttribute('y', y*41 + 40)
            rect.setAttribute('width', 24)
            rect.setAttribute('height', 24)
            rect.setAttribute('fill', window.FOREGROUND)
            svg.appendChild(rect)
          }
        }
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
        if (cell.dot === 1) params.color = 'black'
        else if (cell.dot === 2) params.color = window.LINE_PRIMARY
        else if (cell.dot === 3) params.color = window.LINE_SECONDARY
        else if (cell.dot === 4) {
          params.color = window.FOREGROUND
          // This makes the invisible dots visible, but only while we're in the editor.
          if (window.activeParams != undefined) {
            params.stroke = 'black'
            params.strokeWidth = '2px'
          }
        }
        drawSymbolWithSvg(svg, params)
      } else if (cell.gap === 1) {
        params.type = 'gap'
        if (x%2 === 0 && y%2 === 1) params.rot = 1
        drawSymbolWithSvg(svg, params)
      } else if (x%2 === 1 && y%2 === 1) {
        Object.assign(params, cell)
        window.drawSymbolWithSvg(svg, params)
      }
    }
  }
}

function _drawStartAndEnd(puzzle, svg) {
  var startData = undefined
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined) continue
      if (cell.end != undefined) {
        if (puzzle.symmetry != undefined) {
          var sym = puzzle.getSymmetricalPos(x, y)
          var symCell = puzzle.getCell(sym.x, sym.y)
          if (symCell.end == undefined) {
            console.error('Found an endpoint at', x, y, 'but there was no symmetrical endpoint at', sym.x, sym.y)
          }
        }

        window.drawSymbolWithSvg(svg, {
          'type':'end',
          'width': 58,
          'height': 58,
          'dir': cell.end,
          'x': x*41 + 23,
          'y': y*41 + 23,
        })
      }

      if (cell.start === true) {
        var symStart = undefined
        if (puzzle.symmetry != undefined) {
          var sym = puzzle.getSymmetricalPos(x, y)
          var symCell = puzzle.getCell(sym.x, sym.y)
          if (symCell.start !== true) {
            console.error('Found a startpoint at', x, y, 'but there was no symmetrical startpoint at', sym.x, sym.y)
          }

          window.drawSymbolWithSvg(svg, {
            'type':'start',
            'width': 58,
            'height': 58,
            'x': sym.x*41 + 23,
            'y': sym.y*41 + 23,
          })
          symStart = svg.lastChild
          symStart.style.display = 'none'
        }

        window.drawSymbolWithSvg(svg, {
          'type':'start',
          'width': 58,
          'height': 58,
          'x': x*41 + 23,
          'y': y*41 + 23,
        })
        var start = svg.lastChild;

        (function(puzzle, x, y, start, symStart) {
          start.onclick = function(event) {
            trace(event, puzzle, {'x':x, 'y':y}, start, symStart)
          }
        })(puzzle, x, y, start, symStart)

        // The startpoint must have a primary line through it
        if (cell.color !== 1 && cell.color !== 2) continue

        // And that line must not be coming from any adjacent cells
        var leftCell = puzzle.getCell(x - 1, y)
        if (leftCell != undefined && leftCell.dir === 'right') continue

        var rightCell = puzzle.getCell(x + 1, y)
        if (rightCell != undefined && rightCell.dir === 'left') continue

        var topCell = puzzle.getCell(x, y - 1)
        if (topCell != undefined && topCell.dir === 'bottom') continue

        var bottomCell = puzzle.getCell(x, y + 1)
        if (bottomCell != undefined && bottomCell.dir === 'top') continue

        startData = {'x':x, 'y':y, 'start':start, 'symStart': symStart}
      }
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
      } else if (cell.dir === 'left') {
        output += 'left |'
      } else if (cell.dir === 'right') {
        output += 'right|'
      } else if (cell.dir === 'top') {
        output += 'up   |'
      } else if (cell.dir === 'bottom') {
        output += 'down |'
      } else if (cell.dir === 'none') {
        output += 'none |'
      }
    }
    console.info(output)
  }

  // Limited because there is a chance of infinite looping with bad input data.
  for (var i=0; i<1000; i++) {
    var cell = puzzle.getCell(x, y)
    if (cell == undefined) {
      console.error('Solution trace went out of bounds at', x, y)
      return
    }
    var dir = cell.dir
    var dx = 0
    var dy = 0
    if (dir === 'none') { // Reached an endpoint, move into it
      var cell = puzzle.getCell(x, y)
      console.log('Reached endpoint')
      if (cell.end === 'left') {
        window.onMove(-24, 0)
      } else if (cell.end === 'right') {
        window.onMove(24, 0)
      } else if (cell.end === 'top') {
        window.onMove(0, -24)
      } else if (cell.end === 'bottom') {
        window.onMove(0, 24)
      }
      return
    }
    else if (dir === 'left') dx = -1
    else if (dir === 'right') dx = 1
    else if (dir === 'top') dy = -1
    else if (dir === 'bottom') dy = 1

    console.log('Currently at', x, y, cell, 'moving', dx, dy)

    x += dx
    y += dy
    // Unflag the cell, move into it, and reflag it
    puzzle.updateCell(x, y, {'color':0})
    onMove(41 * dx, 41 * dy)
    puzzle.updateCell(x, y, {'color':1})
  }
}
