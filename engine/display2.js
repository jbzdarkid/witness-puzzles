namespace(function() {

window.draw = function(puzzle, target='puzzle') {
  if (puzzle == undefined) return
  var svg = document.getElementById(target)
  console.info('Drawing', puzzle, 'into', svg)
  while (svg.firstChild) svg.removeChild(svg.firstChild)

  // Prevent context menu popups within the puzzle
  svg.oncontextmenu = function(event) {
    event.preventDefault()
  }

  if (puzzle.pillar === true) {
    // 41*width + 30*2 (padding) + 10*2 (border)
    var pixelWidth = 41 * puzzle.width + 80
  } else {
    // 41*(width-1) + 24 (extra edge) + 30*2 (padding) + 10*2 (border)
    var pixelWidth = 41 * puzzle.width + 63
  }
  var pixelHeight = 41 * puzzle.height + 63
  svg.setAttribute('viewbox', '0 0 ' + pixelWidth + ' ' + pixelHeight)
  svg.style.width = pixelWidth
  svg.style.height = pixelHeight

  var rect = createElement('rect')
  svg.appendChild(rect)
  rect.setAttribute('stroke-width', 10)
  rect.setAttribute('stroke', window.BORDER)
  rect.setAttribute('fill', window.OUTER_BACKGROUND)
  // Accounting for the border thickness
  rect.setAttribute('x', 5)
  rect.setAttribute('y', 5)
  rect.setAttribute('width', pixelWidth - 10) // Removing border
  rect.setAttribute('height', pixelHeight - 10) // Removing border

  drawCenters(puzzle, svg)
  drawGrid(puzzle, svg, target)
  drawStartAndEnd(puzzle, svg)
  // Draw cell symbols after so they overlap the lines, if necessary
  drawSymbols(puzzle, svg, target)

  // For pillar puzzles, add faders for the left and right sides
  if (puzzle.pillar === true) {
    var defs = window.createElement('defs')
    defs.id = 'cursorPos'
    defs.innerHTML = '' +
    '<linearGradient id="fadeInLeft">\n' +
    '  <stop offset="0%"   stop-opacity="1.0" stop-color="' + window.OUTER_BACKGROUND + '"></stop>\n' +
    '  <stop offset="25%"  stop-opacity="1.0" stop-color="' + window.OUTER_BACKGROUND + '"></stop>\n' +
    '  <stop offset="100%" stop-opacity="0.0" stop-color="' + window.OUTER_BACKGROUND + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeOutRight">\n' +
    '  <stop offset="0%"   stop-opacity="0.0" stop-color="' + window.OUTER_BACKGROUND + '"></stop>\n' +
    '  <stop offset="100%" stop-opacity="1.0" stop-color="' + window.OUTER_BACKGROUND + '"></stop>\n' +
    '</linearGradient>\n'
    svg.appendChild(defs)

    var leftBox = window.createElement('rect')
    leftBox.setAttribute('x', 16)
    leftBox.setAttribute('y', 10)
    leftBox.setAttribute('width', 48)
    leftBox.setAttribute('height', 41 * puzzle.height + 43)
    leftBox.setAttribute('fill', 'url(#fadeInLeft)')
    leftBox.setAttribute('style', 'pointer-events: none')
    svg.appendChild(leftBox)

    var rightBox = window.createElement('rect')
    rightBox.setAttribute('x', 41 * puzzle.width + 22)
    rightBox.setAttribute('y', 10)
    rightBox.setAttribute('width', 30)
    rightBox.setAttribute('height', 41 * puzzle.height + 43)
    rightBox.setAttribute('fill', 'url(#fadeOutRight)')
    rightBox.setAttribute('style', 'pointer-events: none')
    svg.appendChild(rightBox)
  }
}

function drawCenters(puzzle, svg) {
  // @Hack that I am not fixing. This switches the puzzle's grid to a floodfilled grid
  // where undefined represents cells which are part of the outside
  var savedGrid = puzzle._switchToMaskedGrid()
  if (puzzle.pillar === true) {
    for (var y=1; y<puzzle.height; y += 2) {
      if (puzzle.getCell(-1, y) == undefined) continue // Cell borders the outside

      var rect = createElement('rect')
      rect.setAttribute('x', 28)
      rect.setAttribute('y', 41 * y + 11)
      rect.setAttribute('width', 24)
      rect.setAttribute('height', 82)
      rect.setAttribute('fill', window.BACKGROUND)
      svg.appendChild(rect)
    }
  }

  for (var x=1; x<puzzle.width; x += 2) {
    for (var y=1; y<puzzle.height; y += 2) {
      if (puzzle.grid[x][y] == undefined) continue // Cell borders the outside

      var rect = createElement('rect')
      rect.setAttribute('x', 41 * x + 11)
      rect.setAttribute('y', 41 * y + 11)
      rect.setAttribute('width', 82)
      rect.setAttribute('height', 82)
      rect.setAttribute('fill', window.BACKGROUND)
      rect.setAttribute('shape-rendering', 'crispedges') // Otherwise they don't meet behind gaps
      svg.appendChild(rect)
    }
  }
  puzzle.grid = savedGrid
}

function drawGrid(puzzle, svg, target) {
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell != undefined && cell.gap === window.GAP_FULL) continue
      if (cell != undefined && cell.gap === window.GAP_BREAK) {
        var params = {
          'width':58,
          'height':58,
          'x': x*41 + 23,
          'y': y*41 + 23,
          'class': target + '_' + x + '_' + y,
          'type': 'gap',
        }
        if (x%2 === 0 && y%2 === 1) params.rot = 1
        drawSymbolWithSvg(svg, params)
        continue
      }

      var line = createElement('line')
      line.setAttribute('stroke-width', 24)
      line.setAttribute('stroke-linecap', 'round')
      line.setAttribute('stroke', window.FOREGROUND)
      if (x%2 === 1 && y%2 === 0) { // Horizontal
        if (cell.gap === window.GAP_BREAK) continue
        line.setAttribute('x1', (x-1)*41 + 52)
        // Adjust the length if it's a pillar -- the grid is not as wide!
        if (puzzle.pillar === true && x === puzzle.width - 1) {
          line.setAttribute('x2', (x+1)*41 + 40)
        } else {
          line.setAttribute('x2', (x+1)*41 + 52)
        }
        line.setAttribute('y1', y*41 + 52)
        line.setAttribute('y2', y*41 + 52)
        svg.appendChild(line)
      } else if (x%2 === 0 && y%2 === 1) { // Vertical
        if (cell.gap === window.GAP_BREAK) continue
        line.setAttribute('x1', x*41 + 52)
        line.setAttribute('x2', x*41 + 52)
        line.setAttribute('y1', (y-1)*41 + 52)
        line.setAttribute('y2', (y+1)*41 + 52)
        svg.appendChild(line)
      } else if (x%2 === 0 && y%2 === 0) { // Intersection
        var surroundingLines = 0
        if (cell.end != undefined) surroundingLines++
        var leftCell = puzzle.getCell(x - 1, y)
        if (leftCell != undefined && leftCell.gap !== window.GAP_FULL) surroundingLines++
        var rightCell = puzzle.getCell(x + 1, y)
        if (rightCell != undefined && rightCell.gap !== window.GAP_FULL) surroundingLines++
        var topCell = puzzle.getCell(x, y - 1)
        if (topCell != undefined && topCell.gap !== window.GAP_FULL) surroundingLines++
        var bottomCell = puzzle.getCell(x, y + 1)
        if (bottomCell != undefined && bottomCell.gap !== window.GAP_FULL) surroundingLines++

        if (surroundingLines === 1) {
          // Add square caps for dead ends which are non-endpoints
          var rect = createElement('rect')
          rect.setAttribute('x', x*41 + 40)
          rect.setAttribute('y', y*41 + 40)
          rect.setAttribute('width', 24)
          rect.setAttribute('height', 24)
          rect.setAttribute('fill', window.FOREGROUND)
          svg.appendChild(rect)
        } else if (surroundingLines > 1) {
          // Add rounding for other intersections (handling gap-only corners)
          var circ = createElement('circle')
          circ.setAttribute('cx', x*41 + 52)
          circ.setAttribute('cy', y*41 + 52)
          circ.setAttribute('r', 12)
          circ.setAttribute('fill', window.FOREGROUND)
          svg.appendChild(circ)
        }
      }
    }
  }
  // Determine if left-side needs a 'wrap indicator'
  if (puzzle.pillar === true) {
    var x = 0;
    for (var y=0; y<puzzle.height; y+=2) {
      var cell = puzzle.getCell(x-1, y)
      if (cell == undefined || cell.gap === window.GAP_FULL) continue
      var line = createElement('line')
      line.setAttribute('stroke-width', 24)
      line.setAttribute('stroke-linecap', 'round')
      line.setAttribute('stroke', window.FOREGROUND)
      line.setAttribute('x1', x*41 + 40)
      line.setAttribute('x2', x*41 + 52)
      line.setAttribute('y1', y*41 + 52)
      line.setAttribute('y2', y*41 + 52)
      svg.appendChild(line)
    }
  }
}

function drawSymbols(puzzle, svg, target) {
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell == undefined) continue
      var params = {
        'width':58,
        'height':58,
        'x': x*41 + 23,
        'y': y*41 + 23,
        'class': target + '_' + x + '_' + y,
      }
      if (cell.dot > window.DOT_NONE) {
        params.type = 'dot'
        if (cell.dot === window.DOT_BLACK) params.color = 'black'
        else if (cell.dot === window.DOT_BLUE) params.color = window.LINE_PRIMARY
        else if (cell.dot === window.DOT_YELLOW) params.color = window.LINE_SECONDARY
        else if (cell.dot === window.DOT_INVISIBLE) {
          params.color = window.FOREGROUND
          // This makes the invisible dots visible, but only while we're in the editor.
          if (document.getElementById('metaButtons') != undefined) {
            params.stroke = 'black'
            params.strokeWidth = '2px'
          }
        }
        drawSymbolWithSvg(svg, params)
      } else if (cell.gap === window.GAP_BREAK) {
        // Gaps were handled above, while drawing the grid.
      } else if (x%2 === 1 && y%2 === 1) {
        Object.assign(params, cell)
        window.drawSymbolWithSvg(svg, params)
      }
    }
  }
}

function drawStartAndEnd(puzzle, svg) {
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
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
          'type': 'end',
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
            'type': 'start',
            'width': 58,
            'height': 58,
            'x': sym.x*41 + 23,
            'y': sym.y*41 + 23,
          })
          symStart = svg.lastChild
          symStart.style.display = 'none'
          symStart.id = 'symStart_' + svg.id + '_' + x + '_' + y
        }

        window.drawSymbolWithSvg(svg, {
          'type': 'start',
          'width': 58,
          'height': 58,
          'x': x*41 + 23,
          'y': y*41 + 23,
        })
        var start = svg.lastChild
        start.id = 'start_' + svg.id + '_' + x + '_' + y

        // ;(function(a){}(a))
        // This syntax is used to forcibly copy all of the arguments
        ;(function(puzzle, x, y, start, symStart) {
          start.onpointerdown = function(event) {
            window.trace(event, puzzle, {'x':x, 'y':y}, start, symStart)
          }
        }(puzzle, x, y, start, symStart))
      }
    }
  }
}

})
