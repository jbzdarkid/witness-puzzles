function drawSymbol(params) {
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 ' + params.width + ' ' + params.height)
  if (!params.x) params.x = 0
  if (!params.y) params.y = 0
  drawSymbolWithSvg(svg, params)
  return svg
}

function drawSymbolWithSvg(svg, params) {
  if (params.type === 'square') _square(svg, params)
  else if (params.type === 'dot') _dot(svg, params)
  else if (params.type === 'gap') _gap(svg, params)
  else if (params.type === 'star') _star(svg, params)
  else if (params.type === 'poly') _poly(svg, params)
  else if (params.type === 'ylop') _ylop(svg, params)
  else if (params.type === 'nega') _nega(svg, params)
  else if (params.type === 'nonce') { /* Do nothing */ }
  else if (params.type === 'triangle') _triangle(svg, params)
  else if (params.type === 'crayon') _crayon(svg, params)
  else if (params.type === 'start') _start(svg, params)
  else if (params.type === 'end') _end(svg, params)
  else if (params.type === 'drag') _drag(svg, params)
  else console.error('Unknown symbol type in params: ' + JSON.stringify(params))
}

function _square(svg, params) {
  var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  svg.appendChild(rect)
  rect.setAttribute('width', 28)
  rect.setAttribute('height', 28)
  rect.setAttribute('x', params.width/2-14 + params.x)
  rect.setAttribute('y', params.height/2-14 + params.y)
  rect.setAttribute('rx', 7)
  rect.setAttribute('ry', 7)
  rect.setAttribute('fill', params.color)
  rect.setAttribute('class', params.class)
}

function _star(svg, params) {
  var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  svg.appendChild(poly)
  var points = [
    '-10.5 -10.5', // Top left
    '-9.5 -4',
    '-15 0',
    '-9.5 4',
    '-10.5 10.5', // Bottom left
    '-4 9.5',
    '0 15',
    '4 9.5',
    '10.5 10.5', // Bottom right
    '9.5 4',
    '15 0',
    '9.5 -4',
    '10.5 -10.5', // Top right
    '4, -9.5',
    '0 -15',
    '-4 -9.5',
  ]
  poly.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
  poly.setAttribute('points', points.join(', '))
  poly.setAttribute('fill', params.color)
  poly.setAttribute('class', params.class)
}

function _poly(svg, params) {
  if (params.polyshape === 0) return
  var size = 10 // Side length of individual squares in the polyomino
  var space = 4 // Gap between squares in the polyomino
  var polyomino = window.polyominoFromPolyshape(params.polyshape)

  var bounds = {'xmin':0, 'xmax':0, 'ymin':0, 'ymax':0}
  for (var pos of polyomino) {
    bounds.xmin = Math.min(bounds.xmin, pos.x)
    bounds.xmax = Math.max(bounds.xmax, pos.x)
    bounds.ymin = Math.min(bounds.ymin, pos.y)
    bounds.ymax = Math.max(bounds.ymax, pos.y)
  }
  var offset = (size+space)/2 // Offset between elements to create the gap
  var centerX = (params.width - size - offset * (bounds.xmax + bounds.xmin)) / 2 + params.x
  var centerY = (params.height - size - offset * (bounds.ymax + bounds.ymin)) / 2 + params.y

  for (var pos of polyomino) {
    if (pos.x%2 !== 0 || pos.y%2 !== 0) continue
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    svg.appendChild(rect)
    var transform = 'translate(' + (centerX + pos.x*offset) + ', ' + (centerY + pos.y*offset) + ')'
    if (isRotated(params.polyshape)) {
      // -30 degree rotation around the midpoint of the square
      transform = 'rotate(-30, ' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ') ' + transform
    }
    rect.setAttribute('transform', transform)
    rect.setAttribute('height', size)
    rect.setAttribute('width', size)
    rect.setAttribute('fill', params.color)
    rect.setAttribute('class', params.class)
  }
}

function _ylop(svg, params) {
  if (params.polyshape === 0) return
  var size = 12 // Side length of individual squares in the polyomino
  var space = 2 // Gap between squares in the polyomino
  var polyomino = window.polyominoFromPolyshape(params.polyshape)

  var bounds = {'xmin':0, 'xmax':0, 'ymin':0, 'ymax':0}
  for (var pos of polyomino) {
    bounds.xmin = Math.min(bounds.xmin, pos.x)
    bounds.xmax = Math.max(bounds.xmax, pos.x)
    bounds.ymin = Math.min(bounds.ymin, pos.y)
    bounds.ymax = Math.max(bounds.ymax, pos.y)
  }
  var offset = (size+space)/2 // Offset between elements to create the gap
  var centerX = (params.width - size - offset * (bounds.xmax + bounds.xmin)) / 2 + params.x
  var centerY = (params.height - size - offset * (bounds.ymax + bounds.ymin)) / 2 + params.y

  for (var pos of polyomino) {
    if (pos.x%2 !== 0 || pos.y%2 !== 0) continue
    var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    svg.appendChild(poly)
    var points = [
      '0 0', '12 0', '12 12', '0 12', '0 3',
      '3 3', '3 9', '9 9', '9 3', '0 3',
    ]
    poly.setAttribute('points', points.join(', '))
    var transform = 'translate(' + (centerX + pos.x*offset) + ', ' + (centerY + pos.y*offset) + ')'
    if (isRotated(params.polyshape)) {
      // -30 degree rotation around the midpoint of the square
      transform = 'rotate(-30, ' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ') ' + transform
    }
    poly.setAttribute('transform', transform)
    poly.setAttribute('fill', params.color)
    poly.setAttribute('class', params.class)
  }
}

function _nega(svg, params) {
  var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  svg.appendChild(poly)
  var points = [
    '2.9 -2',
    '2.9 -10.4',
    '-2.9 -10.4',
    '-2.9 -2',
    '-10.2 2.2',
    '-7.3 7.2',
    '0 3',
    '7.3 7.2',
    '10.2 2.2',
  ]
  poly.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
  poly.setAttribute('points', points.join(', '))
  poly.setAttribute('fill', params.color)
  poly.setAttribute('class', params.class)
}

var triangleDistributions = [
  [],
  [1],
  [2],
  [3],
  [2, 2],
  [2, 3],
  [3, 3],
  [2, 3, 2],
  [3, 2, 3],
  [3, 3, 3]
]

function _triangle(svg, params) {
  var distribution = triangleDistributions[params.count]
  var high = distribution.length
  for (var y=0; y<high; y++) {
    var wide = distribution[y]
    for (var x=0; x<wide; x++) {
      var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      svg.appendChild(poly)
      var Xcoord = params.x + params.width/2 + 11*(2*x - wide + 1)
      var Ycoord = params.y + params.height/2 + 10*(2*y - high + 1)
      poly.setAttribute('transform', 'translate(' + Xcoord + ', ' + Ycoord + ')')
      poly.setAttribute('points', '0 -8, -8 6, 8 6')
      poly.setAttribute('fill', params.color)
      poly.setAttribute('class', params.class)
    }
  }
}

function _crayon(svg, params) {
  var height = params.height
  var width = params.width
  var border = 2

  var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  svg.appendChild(poly)
  var points = [
    '0 ' + (height/2),
    (height/2) + ' 0',
    width + ' 0',
    width + ' ' + (height-border),
    (width-border) + ' ' + (height-border),
    (width-border) + ' ' + border,
    (height/2+border) + ' ' + border,
    (height/2+border) + ' ' + (height-border),
    width + ' ' + (height-border),
    width + ' ' + height,
    (height/2) + ' ' + height,
  ]
  poly.setAttribute('points', points.join(', '))
  poly.setAttribute('fill', params.color)
  var txt = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  svg.appendChild(txt)
  txt.setAttribute('transform', 'translate(' + (height/2 + 10) + ', ' + (height/2 + 6) + ')')
  txt.innerHTML = params.text
}

function _start(svg, params) {
  var circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  svg.appendChild(circ)
  circ.setAttribute('r', 24)
  circ.setAttribute('fill', window.FOREGROUND)
  circ.setAttribute('cx', params.height/2 + params.x)
  circ.setAttribute('cy', params.width/2 + params.y)
}

function _end(svg, params) {
  var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  svg.appendChild(rect)
  rect.setAttribute('width', 24)
  rect.setAttribute('height', 24)
  rect.setAttribute('fill', window.FOREGROUND)
  rect.setAttribute('x', params.height/2 - 12 + params.x)
  rect.setAttribute('y', params.width/2 - 12 + params.y)

  var circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  svg.appendChild(circ)
  circ.setAttribute('r', 12)
  circ.setAttribute('fill', window.FOREGROUND)
  circ.setAttribute('cx', params.height/2 + params.x)
  circ.setAttribute('cy', params.width/2 + params.y)

  if (params.dir === 'left') {
    rect.setAttribute('x', parseInt(rect.getAttribute('x'), 10) - 12)
    circ.setAttribute('cx', parseInt(circ.getAttribute('cx'), 10) - 24)
  } else if (params.dir === 'right') {
    rect.setAttribute('x', parseInt(rect.getAttribute('x'), 10) + 12)
    circ.setAttribute('cx', parseInt(circ.getAttribute('cx'), 10) + 24)
  } else if (params.dir === 'top') {
    rect.setAttribute('y', parseInt(rect.getAttribute('y'), 10) - 12)
    circ.setAttribute('cy', parseInt(circ.getAttribute('cy'), 10) - 24)
  } else if (params.dir === 'bottom') {
    rect.setAttribute('y', parseInt(rect.getAttribute('y'), 10) + 12)
    circ.setAttribute('cy', parseInt(circ.getAttribute('cy'), 10) + 24)
  } else {
    console.error('Endpoint direction not defined!', JSON.stringify(params))
  }
}

function _dot(svg, params) {
  var hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
  svg.appendChild(hex)
  hex.setAttribute('points', '5.2 9, 10.4 0, 5.2 -9, -5.2 -9, -10.4 0, -5.2 9')
  hex.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
  hex.setAttribute('fill', params.color)
  hex.setAttribute('class', params.class)
  hex.setAttribute('stroke', params.stroke)
  hex.setAttribute('stroke-width', params.strokeWidth)
  hex.setAttribute('style', 'pointer-events:none;')
}

function _gap(svg, params) {
  if (!params.rot) params.rot = 0
  var centerX = params.height/2 + params.x
  var centerY = params.width/2 + params.y
  var rotate = function(degrees) {return 'rotate(' + degrees + ', ' + centerX + ', ' + centerY + ')'}

  var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  svg.appendChild(rect)
  rect.setAttribute('width', 58)
  rect.setAttribute('height', 24)
  rect.setAttribute('fill', window.FOREGROUND)
  rect.setAttribute('transform', rotate(90 * params.rot))
  rect.setAttribute('x', centerX - 29)
  rect.setAttribute('y', centerY - 12)

  var rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  svg.appendChild(rect2)
  rect2.setAttribute('width', 18)
  rect2.setAttribute('height', 24)
  rect2.setAttribute('fill', window.BACKGROUND)
  rect2.setAttribute('transform', rotate(90 * params.rot))
  rect2.setAttribute('x', centerX - 9)
  rect2.setAttribute('y', centerY - 12)
}

function _drag(svg, params) {
  if (!params.rot) params.rot = 0

  for (var i=0; i<6; i++) {
    for (var j=0; j<2; j++) {
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      svg.appendChild(rect)
      rect.setAttribute('width', 2)
      rect.setAttribute('height', 2)
      if (params.rot === 0) {
        rect.setAttribute('x', i*4)
        rect.setAttribute('y', j*4)
      } else {
        rect.setAttribute('y', i*4)
        rect.setAttribute('x', j*4)
      }
      rect.setAttribute('fill', 'white')
    }
  }
}