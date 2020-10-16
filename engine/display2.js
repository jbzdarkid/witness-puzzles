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

  // For pillar puzzles, add faders for the left and right sides
  if (puzzle.pillar === true) {
    // These are the third intervals (0%, 33%, 66%, 100%) from OUTER_BACKGROUND to FOREGROUND
    var zero = window.OUTER_BACKGROUND
    var three = window.FOREGROUND
    if (localStorage.theme === 'true') {
      var one = '#2C2108' // Left  + (Left - Right) / 3
      var two = '#523B0D' // Right - (Left - Right) / 3
    } else {
      var one = '#1C3C39'
      var two = '#28403E'
    }

    var defs = window.createElement('defs')
    defs.innerHTML = '' +
    '<linearGradient id="fadeInCenter">\n' +
    '  <stop offset="0%"   stop-color="' + window.OUTER_BACKGROUND + '"></stop>\n' +
    '  <stop offset="100%" stop-color="' + window.BACKGROUND + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeInWrapIndicator">\n' +
    '  <stop offset="0%"   stop-color="' + zero + '"></stop>\n' +
    '  <stop offset="100%" stop-color="' + two + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeInVerticalLine">\n' +
    '  <stop offset="0%"   stop-color="' + one + '"></stop>\n' +
    '  <stop offset="100%" stop-color="' + three + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeInVerticalGap" x1="0" x2="0" y1="1" y2="0">\n' +
    '  <stop offset="0%"   stop-color="' + one + '"></stop>\n' +
    '  <stop offset="100%" stop-color="' + three + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeInHorizontalLine">\n' +
    '  <stop offset="0%"    stop-color="' + two + '"></stop>\n' +
    '  <stop offset="14.6%" stop-color="' + three + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeInHorizontalGap">\n' +
    '  <stop offset="0%"  stop-color="' + two + '"></stop>\n' +
    '  <stop offset="33%" stop-color="' + three + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeInLeftEndSquare">\n' +
    '  <stop offset="0%"   stop-color="' + zero + '"></stop>\n' +
    '  <stop offset="100%" stop-color="' + two + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeInLeftEndCircle">\n' +
    '  <stop offset="50%"  stop-color="' + zero + '"></stop>\n' +
    '  <stop offset="100%" stop-color="' + one + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeInRightEnd">\n' +
    '  <stop offset="0%"  stop-color="' + two + '"></stop>\n' +
    '  <stop offset="50%" stop-color="' + three + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeInStart">\n' +
    '  <stop offset="0%"  stop-color="' + zero + '"></stop>\n' +
    '  <stop offset="75%" stop-color="' + three + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeOutCenter">\n' +
    '  <stop offset="75%"  stop-color="' + window.BACKGROUND + '"></stop>\n' +
    '  <stop offset="100%" stop-color="' + window.OUTER_BACKGROUND + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeOutHorizontal">\n' +
    '  <stop offset="75%"  stop-color="' + window.FOREGROUND + '"></stop>\n' +
    '  <stop offset="100%" stop-color="' + window.OUTER_BACKGROUND + '"></stop>\n' +
    '</linearGradient>\n' +
    '<linearGradient id="fadeOutLine">\n' +
    '  <stop offset="75%"  stop-color="' + window.LINE_DEFAULT + '"></stop>\n' +
    '  <stop offset="100%" stop-color="' + window.OUTER_BACKGROUND + '"></stop>\n' +
    '</linearGradient>\n'
    svg.appendChild(defs)
  }

  drawCenters(puzzle, svg)
  drawStartAndEnd(puzzle, svg)
  drawGrid(puzzle, svg)
  // Draw cell symbols after so they overlap the lines, if necessary
  drawSymbols(puzzle, svg, target)
}

function drawCenters(puzzle, svg) {
  // @Hack that I am not fixing.
  var savedGrid = puzzle._switchToMaskedGrid()
  if (puzzle.pillar === true) {
    for (var y=1; y<puzzle.height; y += 2) {
      if (puzzle.getCell(-1, y) == undefined) continue // Cell borders the outside

      var rect = createElement('rect')
      rect.setAttribute('x', 28)
      rect.setAttribute('y', 41 * y + 11)
      rect.setAttribute('width', 24)
      rect.setAttribute('height', 82)
      rect.setAttribute('fill', 'url(#fadeInCenter)')
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
      if (puzzle.pillar === true && x == puzzle.width - 1) {
        rect.setAttribute('fill', 'url(#fadeOutCenter)')
      } else {
        rect.setAttribute('fill', window.BACKGROUND)
      }
      rect.setAttribute('shape-rendering', 'crispedges') // Otherwise they don't meet behind gaps
      svg.appendChild(rect)
    }
  }
  puzzle.grid = savedGrid
}

function drawGrid(puzzle, svg) {
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      var cell = puzzle.grid[x][y]
      if (cell != undefined && cell.gap === window.GAP_FULL) continue
      var rect = createElement('rect')
      rect.setAttribute('fill', window.FOREGROUND)
      rect.style.pointerEvents = 'none'
      if (x%2 === 1 && y%2 === 0) { // Horizontal
        if (cell.gap === window.GAP_BREAK) continue
        rect.setAttribute('x', (x-1)*41 + 52)
        rect.setAttribute('y', y*41 + 40)
        rect.setAttribute('width', 82)
        rect.setAttribute('height', 24)
        // Adjust the edge if it's a pillar
        if (puzzle.pillar === true) {
          if (x === puzzle.width - 1) {
            rect.setAttribute('fill', 'url(#fadeOutHorizontal)')
          } else if (x === 1) {
            rect.setAttribute('fill', 'url(#fadeInHorizontalLine)')
          }
        }
        svg.appendChild(rect)
      } else if (x%2 === 0 && y%2 === 1) { // Vertical
        if (cell.gap === window.GAP_BREAK) continue
        rect.setAttribute('x', x*41 + 40)
        rect.setAttribute('y', (y-1)*41 + 52)
        rect.setAttribute('width', 24)
        rect.setAttribute('height', 82)
        // Adjust the edge if it's a pillar
        if (puzzle.pillar === true && x === 0) {
          rect.setAttribute('fill', 'url(#fadeInVerticalLine)')
        }
        svg.appendChild(rect)
      }
    }
  }
  // Add intersection coverings after
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      if (x%2 === 0 && y%2 === 0) { // Intersection
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
          rect.style.pointerEvents = 'none'
          rect.setAttribute('x', x*41 + 40)
          rect.setAttribute('y', y*41 + 40)
          rect.setAttribute('width', 24)
          rect.setAttribute('height', 24)
          rect.setAttribute('fill', window.FOREGROUND)
          if (puzzle.pillar === true && x === 0) {
            rect.setAttribute('fill', 'url(#fadeInVerticalLine)')
          }
          svg.appendChild(rect)
        } else if (surroundingLines > 1) {
          // Add rounding for other intersections (handling gap-only corners)
          var circ = createElement('circle')
          circ.style.pointerEvents = 'none'
          circ.setAttribute('cx', x*41 + 52)
          circ.setAttribute('cy', y*41 + 52)
          circ.setAttribute('r', 12)
          circ.setAttribute('fill', window.FOREGROUND)
          if (puzzle.pillar === true && x === 0) {
            circ.setAttribute('fill', 'url(#fadeInVerticalLine)')
          }
          svg.appendChild(circ)
        }
      }
    }
  }
  // Determine if left-side needs a 'wrap indicator'
  if (puzzle.pillar === true) {
    for (var y=0; y<puzzle.height; y+=2) {
      var cell = puzzle.getCell(-1, y)
      if (cell == undefined || cell.gap === window.GAP_FULL) continue
      var rect = createElement('rect')
      rect.style.pointerEvents = 'none'
      rect.setAttribute('fill', 'url(#fadeInWrapIndicator)')
      rect.setAttribute('x', 28)
      rect.setAttribute('y', y*41 + 40)
      rect.setAttribute('width', 24)
      rect.setAttribute('height', 24)
      svg.appendChild(rect)
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
        params.type = 'gap'
        if (x%2 === 0 && y%2 === 1) params.rot = 1
        drawSymbolWithSvg(svg, params)
        if (puzzle.pillar === true) {
          if (x === puzzle.width - 1) {
            svg.lastChild.setAttribute('fill', 'url(#fadeOutHorizontal)')
          } else if (x === 0) {
            svg.lastChild.previousSibling.setAttribute('fill', 'url(#fadeInVerticalGap)')
            svg.lastChild.setAttribute('fill', 'url(#fadeInVerticalGap)')
          } else if (x === 1) {
            svg.lastChild.previousSibling.setAttribute('fill', 'url(#fadeInHorizontalGap)')
          }
        }

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

        if (puzzle.pillar === true && x === 0) {
          if (cell.end == 'top' || cell.end == 'bottom') {
            svg.lastChild.previousSibling.setAttribute('fill', 'url(#fadeInVerticalLine)')
            svg.lastChild.setAttribute('fill', 'url(#fadeInVerticalLine)')
          } else if (cell.end == 'left') {
            svg.lastChild.previousSibling.setAttribute('fill', 'url(#fadeInLeftEndSquare)')
            svg.lastChild.setAttribute('fill', 'url(#fadeInLeftEndCircle)')
          } else if (cell.end == 'right') {
            svg.lastChild.previousSibling.setAttribute('fill', 'url(#fadeInRightEnd)')
          }
        }
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

        if (puzzle.pillar === true && x === 0) {
          start.setAttribute('fill', 'url(#fadeInStart)')
        }

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
