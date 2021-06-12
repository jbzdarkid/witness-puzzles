namespace(function() {

window.createElement = function(type) {
  return document.createElementNS('http://www.w3.org/2000/svg', type)
}

window.drawSymbol = function(params, customMechanics) {
  var svg = createElement('svg')
  svg.setAttribute('viewBox', '0 0 ' + params.width + ' ' + params.height)
  if (!params.x) params.x = 0
  if (!params.y) params.y = 0
  drawSymbolWithSvg(svg, params, customMechanics)
  return svg
}

window.drawSymbolWithSvg = function(svg, params, customMechanics) {
  if (params.type == 'square')        square(svg, params)
  else if (params.type == 'dot')      dot(svg, params)
  else if (params.type == 'gap')      gap(svg, params)
  else if (params.type == 'star')     star(svg, params)
  else if (params.type == 'poly')     poly(svg, params)
  else if (params.type == 'ylop')     ylop(svg, params)
  else if (params.type == 'nega')     nega(svg, params)
  else if (params.type == 'nonce')    { /* Do nothing */ }
  else if (params.type == 'triangle') triangle(svg, params)
  else if (params.type == 'crayon')   crayon(svg, params)
  else if (params.type == 'start')    start(svg, params)
  else if (params.type == 'end')      end(svg, params)
  else if (params.type == 'drag')     drag(svg, params)
  else if (params.type == 'plus')     plus(svg, params)
  else if (params.type == 'minus')    minus(svg, params)
  else if (params.type == 'bridge' && customMechanics) bridge(svg, params)
  else if (params.type == 'arrow'  && customMechanics) arrow(svg, params)
  else if (params.type == 'sizer'  && customMechanics) sizer(svg, params)
  else {console.error('Cannot draw unknown SVG type: ' + params.type)}
}

function square(svg, params) {
  var rect = createElement('rect')
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

function star(svg, params) {
  var poly = createElement('polygon')
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

function poly(svg, params) {
  if (params.polyshape === 0) return
  var size = 10 // Side length of individual squares in the polyomino
  var space = 4 // Gap between squares in the polyomino
  var polyomino = window.polyominoFromPolyshape(params.polyshape)

  var bounds = {'xmin':0, 'xmax':0, 'ymin':0, 'ymax':0}
  for (var i=0; i<polyomino.length; i++) {
    var pos = polyomino[i]
    bounds.xmin = Math.min(bounds.xmin, pos.x)
    bounds.xmax = Math.max(bounds.xmax, pos.x)
    bounds.ymin = Math.min(bounds.ymin, pos.y)
    bounds.ymax = Math.max(bounds.ymax, pos.y)
  }
  var offset = (size+space)/2 // Offset between elements to create the gap
  var centerX = (params.width - size - offset * (bounds.xmax + bounds.xmin)) / 2 + params.x
  var centerY = (params.height - size - offset * (bounds.ymax + bounds.ymin)) / 2 + params.y

  for (var i=0; i<polyomino.length; i++) {
    var pos = polyomino[i]
    if (pos.x%2 !== 0 || pos.y%2 !== 0) continue
    var rect = createElement('rect')
    rect.style.pointerEvents = 'none'
    var transform = 'translate(' + (centerX + pos.x*offset) + ', ' + (centerY + pos.y*offset) + ')'
    if (window.isRotated(params.polyshape)) {
      // -30 degree rotation around the midpoint of the square
      transform = 'rotate(-30, ' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ') ' + transform
    }
    rect.setAttribute('transform', transform)
    rect.setAttribute('height', size)
    rect.setAttribute('width', size)
    rect.setAttribute('fill', params.color)
    rect.setAttribute('class', params.class)
    svg.appendChild(rect)
  }
}

function ylop(svg, params) {
  if (params.polyshape === 0) return
  var size = 12 // Side length of individual squares in the polyomino
  var space = 2 // Gap between squares in the polyomino
  var polyomino = window.polyominoFromPolyshape(params.polyshape)

  var bounds = {'xmin':0, 'xmax':0, 'ymin':0, 'ymax':0}
  for (var i=0; i<polyomino.length; i++) {
    var pos = polyomino[i]
    bounds.xmin = Math.min(bounds.xmin, pos.x)
    bounds.xmax = Math.max(bounds.xmax, pos.x)
    bounds.ymin = Math.min(bounds.ymin, pos.y)
    bounds.ymax = Math.max(bounds.ymax, pos.y)
  }
  var offset = (size+space)/2 // Offset between elements to create the gap
  var centerX = (params.width - size - offset * (bounds.xmax + bounds.xmin)) / 2 + params.x
  var centerY = (params.height - size - offset * (bounds.ymax + bounds.ymin)) / 2 + params.y

  for (var i=0; i<polyomino.length; i++) {
    var pos = polyomino[i]
    if (pos.x%2 !== 0 || pos.y%2 !== 0) continue
    var poly = createElement('polygon')
    poly.style.pointerEvents = 'none'
    var points = [
      '0 0', '12 0', '12 12', '0 12', '0 3',
      '3 3', '3 9', '9 9', '9 3', '0 3',
    ]
    poly.setAttribute('points', points.join(', '))
    var transform = 'translate(' + (centerX + pos.x*offset) + ', ' + (centerY + pos.y*offset) + ')'
    if (window.isRotated(params.polyshape)) {
      // -30 degree rotation around the midpoint of the square
      transform = 'rotate(-30, ' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ') ' + transform
    }
    poly.setAttribute('transform', transform)
    poly.setAttribute('fill', params.color)
    poly.setAttribute('class', params.class)
    svg.appendChild(poly)
  }
}

function nega(svg, params) {
  var poly = createElement('polygon')
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

function triangle(svg, params) {
  var distribution = triangleDistributions[params.count]
  var high = distribution.length
  for (var y=0; y<high; y++) {
    var wide = distribution[y]
    for (var x=0; x<wide; x++) {
      var poly = createElement('polygon')
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

function crayon(svg, params) {
  var height = params.height

  var poly = createElement('polygon')
  svg.appendChild(poly)
  var points = [
    '0 ' + (height/2),
    (height/2) + ' 0',
    (height/2) + ' ' + height,
  ]
  poly.setAttribute('points', points.join(', '))
  poly.setAttribute('fill', params.color)
  var txt = createElement('text')
  svg.appendChild(txt)
  txt.setAttribute('fill', window.TEXT_COLOR)
  txt.setAttribute('transform', 'translate(' + (height/2 + 10) + ', ' + (height/2 + 6) + ')')
  txt.textContent = params.text
}

function start(svg, params) {
  var circ = createElement('circle')
  svg.appendChild(circ)
  circ.setAttribute('r', 24)
  circ.setAttribute('fill', window.FOREGROUND)
  circ.setAttribute('cx', params.height/2 + params.x)
  circ.setAttribute('cy', params.width/2 + params.y)
}

function end(svg, params) {
  var rect = createElement('rect')
  svg.appendChild(rect)
  rect.setAttribute('width', 24)
  rect.setAttribute('height', 24)
  rect.setAttribute('fill', window.FOREGROUND)
  rect.setAttribute('x', params.height/2 - 12 + params.x)
  rect.setAttribute('y', params.width/2 - 12 + params.y)

  var circ = createElement('circle')
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

function dot(svg, params) {
  var hex = createElement('polygon')
  svg.appendChild(hex)
  hex.setAttribute('points', '5.2 9, 10.4 0, 5.2 -9, -5.2 -9, -10.4 0, -5.2 9')
  hex.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
  hex.setAttribute('fill', params.color)
  hex.setAttribute('class', params.class)
  hex.setAttribute('stroke', params.stroke)
  hex.setAttribute('stroke-width', params.strokeWidth)
  hex.setAttribute('style', 'pointer-events:none;')
}

function gap(svg, params) {
  if (!params.rot) params.rot = 0
  var centerX = params.height/2 + params.x
  var centerY = params.width/2 + params.y
  var rotate = function(degrees) {return 'rotate(' + degrees + ', ' + centerX + ', ' + centerY + ')'}

  var rect = createElement('rect')
  svg.appendChild(rect)
  rect.setAttribute('width', 32)
  rect.setAttribute('height', 24)
  rect.setAttribute('fill', window.FOREGROUND)
  rect.setAttribute('transform', rotate(90 * params.rot))
  rect.setAttribute('x', centerX - 40)
  rect.setAttribute('y', centerY - 12)
  rect.setAttribute('shape-rendering', 'crispedges')

  var rect = createElement('rect')
  svg.appendChild(rect)
  rect.setAttribute('width', 32)
  rect.setAttribute('height', 24)
  rect.setAttribute('fill', window.FOREGROUND)
  rect.setAttribute('transform', rotate(90 * params.rot))
  rect.setAttribute('x', centerX + 9)
  rect.setAttribute('y', centerY - 12)
  rect.setAttribute('shape-rendering', 'crispedges')
}

function drag(svg, params) {
  if (!params.rot) params.rot = 0

  for (var i=0; i<6; i++) {
    for (var j=0; j<2; j++) {
      var rect = createElement('rect')
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
      rect.setAttribute('fill', window.PAGE_BACKGROUND)
    }
  }
}

function plus(svg, params) {
  var verti = createElement('rect')
  svg.appendChild(verti)
  verti.setAttribute('x', params.width/2 - 1)
  verti.setAttribute('y', 3)
  verti.setAttribute('width', 2)
  verti.setAttribute('height', params.height - 6)
  verti.setAttribute('fill', window.TEXT_COLOR)
  minus(svg, params)
}

function minus(svg, params) {
  var horiz = createElement('rect')
  svg.appendChild(horiz)
  horiz.setAttribute('x', 3)
  horiz.setAttribute('y', params.height/2 - 1)
  horiz.setAttribute('width', params.width - 6)
  horiz.setAttribute('height', 2)
  horiz.setAttribute('fill', window.TEXT_COLOR)
}

function bridge(svg, params) {
  var poly = createElement('polygon')
  svg.appendChild(poly)
  var points = [
    '-10.58 14.56',
    '-17.12 -5.56',
    '0 -18',
    '17.12 -5.56',
    '10.58 14.56',
    '5.29 7.28',
    '8.56 -2.78',
    '0 -9',
    '-8.56 -2.78',
    '-5.29 7.28',
  ]
  poly.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
  poly.setAttribute('points', points.join(', '))
  poly.setAttribute('fill', params.color)
  poly.setAttribute('class', params.class)
}

function arrow(svg, params) {
  if (!params.rot) params.rot = 0

  var centerX = params.height/2 + params.x
  var centerY = params.width/2 + params.y
  var rotate = function(degrees) {return 'rotate(' + degrees + ', ' + centerX + ', ' + centerY + ')'}

  var rect = createElement('rect')
  svg.appendChild(rect)
  rect.setAttribute('width', 8)
  rect.setAttribute('height', 46)
  rect.setAttribute('fill', params.color)
  rect.setAttribute('class', params.class)
  rect.setAttribute('transform', rotate(45 * params.rot))
  rect.setAttribute('x', centerX - 4)
  rect.setAttribute('y', centerY - 22)

  for (var i=0; i<params.count; i++) {
    var arrowhead = createElement('polygon')
    svg.appendChild(arrowhead)
    var points = [
      '-24 -15',
      '-21.4 -8.6',
      '0 -19',
      '21.4 -8.6',
      '24 -15',
      '0 -27',
    ]
    var transform = rotate(45 * params.rot)
    transform += ' translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y + i*12) + ')'
    arrowhead.setAttribute('transform', transform)
    arrowhead.setAttribute('points', points.join(', '))
    arrowhead.setAttribute('fill', params.color)
    arrowhead.setAttribute('class', params.class)
  }
}

function sizer(svg, params) {
  var path = createElement('path')
  svg.appendChild(path)
  path.setAttribute('d',
    'M -24 0 ' +
    'a 24 24 0 0 0  24 -24 ' +
    'a 24 24 0 0 0  24  24 ' +
    'a 24 24 0 0 0 -24  24 ' +
    'a 24 24 0 0 0 -24 -24 ' +
    'z'
  )
  path.setAttribute('fill', params.color)
  path.setAttribute('class', params.class)
  path.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
}

})
