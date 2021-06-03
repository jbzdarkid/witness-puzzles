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
  switch (params.type) {
    case 'square':
      square(svg, params)
      break;
    case 'dot':
      dot(svg, params)
      break;
    case 'gap':
      gap(svg, params)
      break;
    case 'star':
      star(svg, params)
      break;
    case 'poly':
      poly(svg, params)
      break;
    case 'ylop':
      ylop(svg, params)
      break;
    case 'nega':
      if (localStorage.symbolTheme == "Canonical")
        nega(svg, params)
      else
        negaSimple(svg, params)
      break;
    case 'nonce':
      /* Do nothing */
      break;
    case 'triangle':
      if (localStorage.symbolTheme == "Canonical")
        triangle(svg, params)
      else
        triangleSimple(svg, params)
      break;
    case 'start':
      start(svg, params)
      break;
    case 'end':
      end(svg, params)
      break;
    case 'drag':
      drag(svg, params)
      break;
    case 'bridge':
      if (localStorage.symbolTheme == "Canonical")
        bridge(svg, params)
      else
        bridgeSimple(svg, params)
      break;
    case 'arrow':
      if (localStorage.symbolTheme == "Canonical")
        arrow(svg, params)
      else
        arrowSimple(svg, params)
      break;
    case 'sizer':
      if (localStorage.symbolTheme == "Canonical")
        sizer(svg, params)
      else
        sizerSimple(svg, params)
      break;
    case 'cross':
      cross(svg, params)
      break;
    case 'curve':
      curve(svg, params)
      break;
    case 'crossFilled':
      crossFilled(svg, params)
      break;
    case 'curveFilled':
      curveFilled(svg, params)
      break;
    case 'twobytwo':
      if (localStorage.symbolTheme == "Canonical")
        twobytwo(svg, params)
      else
        twobytwoSimple(svg, params);
      break;
    default:
      console.error('Cannot draw unknown SVG type: ' + params.type)
      break;
    case 'dart':
      dart(svg, params)
      break;
    case 'polynt':
      // if (localStorage.symbolTheme == "Canonical")
        polynt(svg, params)
      // else
        // polyntSimple(svg, params);
      break;
  }
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

function negaSimple(svg, params) {
  var path = createElement('path')
  svg.appendChild(path)
  path.setAttribute('d',
    'M -3 0 L -3 -9 L 3 -9 L 3 0 L 10 4 L 8 9 L 0 5 L -8 9 L -10 4' +
    'z'
  )
  path.setAttribute('fill', params.color)
  path.setAttribute('class', params.class)
  path.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
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

function triangleSimple(svg, params) {
  switch (params.count) {
    case 1:
      triangleSingle(svg, params, 0, 0);
      break;
    case 2:
      triangleSingle(svg, params, -10, 0);
      triangleSingle(svg, params,  10, 0);
      break;
    case 3:
      triangleSingle(svg, params,  0, -10);
      triangleSingle(svg, params, -10, 10);
      triangleSingle(svg, params,  10, 10);
      break;
    case 4:
      triangleSingle(svg, params, -10, -10);
      triangleSingle(svg, params,  10, -10);
      triangleSingle(svg, params, -10, 10);
      triangleSingle(svg, params,  10, 10);
      break;
  }
}

function triangleSingle(svg, params, xoffset, yoffset) {
  var hex = createElement('polygon')
  var path = createElement('path')
  svg.appendChild(path)
  path.setAttribute('d',
    'M -7 9 Q -9 9 -8 7 L -1 -7 Q 0 -9 1 -7 L 8 7 Q 9 9 7 9' +
    'z'
  )
  path.setAttribute('fill', params.color)
  path.setAttribute('class', params.class)
  path.setAttribute('transform', 'translate(' + (params.width/2 + params.x + xoffset) + ', ' + (params.height/2 + params.y + yoffset) + ')')
  path.setAttribute('stroke', params.stroke)
  path.setAttribute('stroke-width', params.strokeWidth)
  path.setAttribute('style', 'pointer-events:none;')
}



function start(svg, params) {
  var circ = createElement('circle')
  svg.appendChild(circ)
  circ.setAttribute('r', 24)
  circ.setAttribute('fill', 'var(--line-undone)')
  circ.setAttribute('cx', params.height/2 + params.x)
  circ.setAttribute('cy', params.width/2 + params.y)
}

function end(svg, params) {
  var rect = createElement('rect')
  svg.appendChild(rect)
  rect.setAttribute('width', 24)
  rect.setAttribute('height', 24)
  rect.setAttribute('fill', 'var(--line-undone)')
  rect.setAttribute('x', params.height/2 - 12 + params.x)
  rect.setAttribute('y', params.width/2 - 12 + params.y)

  var circ = createElement('circle')
  svg.appendChild(circ)
  circ.setAttribute('r', 12)
  circ.setAttribute('fill', 'var(--line-undone)')
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
  rect.setAttribute('fill', 'var(--line-undone)')
  rect.setAttribute('transform', rotate(90 * params.rot))
  rect.setAttribute('x', centerX - 40)
  rect.setAttribute('y', centerY - 12)
  rect.setAttribute('shape-rendering', 'crispedges')

  var rect = createElement('rect')
  svg.appendChild(rect)
  rect.setAttribute('width', 32)
  rect.setAttribute('height', 24)
  rect.setAttribute('fill', 'var(--line-undone)')
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
      rect.setAttribute('fill', 'var(--background)')
    }
  }
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

function bridgeSimple(svg, params) {
  var poly = createElement('polygon')
  svg.appendChild(poly)
  var points = [
    '-9.52 13.10', 
    '-15.41 -5.00', 
    '0.00 -16.20', 
    '15.41 -5.00', 
    '9.52 13.10', 
    '4.76 6.55', 
    '7.70 -2.50', 
    '0.00 -8.10', 
    '-7.70 -2.50', 
    '-4.76 6.55',
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

function arrowSimple(svg, params) {
  if (!params.rot) params.rot = 0

  var centerX = params.height/2 + params.x
  var centerY = params.width/2 + params.y
  var rotate = function(degrees) {return 'rotate(' + degrees + ', ' + centerX + ', ' + centerY + ')'}

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

function sizerSimple(svg, params) {
  var path = createElement('path')
  svg.appendChild(path)
  path.setAttribute('d',
    'M -13 6 Q -14 10 -10 10 L 10 10 Q 14 10 13 6 L 8 -8 Q 7 -10 5 -10 L -5 -10 Q -7 -10 -8 -8' +
    'z'
  )
  path.setAttribute('fill', params.color)
  path.setAttribute('class', params.class)
  path.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
}

function cross(svg, params) {
  var hex = createElement('polygon')
  svg.appendChild(hex)
  hex.setAttribute('points', '-10 -2.5,-10 2.5,-2.5 2.5,-2.5 10,2.5 10,2.5 2.5,10 2.5,10 -2.5,2.5 -2.5,2.5 -10,-2.5 -10,-2.5 -2.5')
  hex.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
  hex.setAttribute('fill', params.color)
  hex.setAttribute('class', params.class)
  hex.setAttribute('stroke', params.stroke)
  hex.setAttribute('stroke-width', params.strokeWidth)
  hex.setAttribute('style', 'pointer-events:none;')
  var hex2 = createElement('rect')
  svg.appendChild(hex2)
  hex2.setAttribute('fill', 'var(--line-undone)')
  hex2.setAttribute('transform', 'translate(' + (params.width/2 + params.x - 2.5) + ', ' + (params.height/2 + params.y - 2.5) + ')')
  hex2.setAttribute('width', '5')
  hex2.setAttribute('height', '5')
}

function crossFilled(svg, params) {
  var hex = createElement('polygon')
  svg.appendChild(hex)
  hex.setAttribute('points', '-10 -2.5,-10 2.5,-2.5 2.5,-2.5 10,2.5 10,2.5 2.5,10 2.5,10 -2.5,2.5 -2.5,2.5 -10,-2.5 -10,-2.5 -2.5')
  hex.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
  hex.setAttribute('fill', params.color)
  hex.setAttribute('class', params.class)
  hex.setAttribute('stroke', params.stroke)
  hex.setAttribute('stroke-width', params.strokeWidth)
  hex.setAttribute('style', 'pointer-events:none;')
}

function curve(svg, params) {
  var hex = createElement('polygon')
  svg.appendChild(hex)
  hex.setAttribute('points', '10 0, 0 10, -10 0, 0 -10, 0 -5, -5 0, 0 5, 5 0, 0 -5, 0 -10')
  hex.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
  hex.setAttribute('fill', params.color)
  hex.setAttribute('class', params.class)
  hex.setAttribute('stroke', params.stroke)
  hex.setAttribute('stroke-width', params.strokeWidth)
  hex.setAttribute('style', 'pointer-events:none;')
}

function curveFilled(svg, params) {
  var hex = createElement('polygon')
  svg.appendChild(hex)
  hex.setAttribute('points', '10 0, 0 10, -10 0, 0 -10')
  hex.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
  hex.setAttribute('fill', params.color)
  hex.setAttribute('class', params.class)
  hex.setAttribute('stroke', params.stroke)
  hex.setAttribute('stroke-width', params.strokeWidth)
  hex.setAttribute('style', 'pointer-events:none;')
}

function twobytwo(svg, params) {
  onebyone(svg, params, 9.71, 0)
  onebyone(svg, params, -9.71, 0)
  onebyone(svg, params, 0, 9.71)
  enobyeno(svg, params, 0, -11)
}

function onebyone(svg, params, xoffset, yoffset) {
  var hex = createElement('polygon')
  svg.appendChild(hex)
  hex.setAttribute('points', '7.07 0, 0 7.07, -7.07 0, 0 -7.07')
  hex.setAttribute('transform', 'translate(' + (params.width/2 + params.x + xoffset) + ', ' + (params.height/2 + params.y + yoffset) + ')')
  hex.setAttribute('fill', params.color)
  hex.setAttribute('class', params.class)
  hex.setAttribute('stroke', params.stroke)
  hex.setAttribute('stroke-width', params.strokeWidth)
  hex.setAttribute('style', 'pointer-events:none;')
}

function enobyeno(svg, params, xoffset, yoffset) {
  var hex = createElement('polygon')
  svg.appendChild(hex)
  hex.setAttribute('points', '8.49 0, 0 8.49, -8.49 0, 0 -8.49, 8.49 0, 4.24 0, 0 -4.24, -4.24 0, 0 4.24, 4.24 0')
  hex.setAttribute('transform', 'translate(' + (params.width/2 + params.x + xoffset) + ', ' + (params.height/2 + params.y + yoffset) + ')')
  hex.setAttribute('fill', params.color)
  hex.setAttribute('class', params.class)
  hex.setAttribute('stroke', params.stroke)
  hex.setAttribute('stroke-width', params.strokeWidth)
  hex.setAttribute('style', 'pointer-events:none;')
}

function twobytwoSimple(svg, params) {
  var path = createElement('path')
  svg.appendChild(path)
  path.setAttribute('d',
    'M -4 0 L -9 -5 L -5 -9 L 0 -4 L 5 -9 L 9 -5 L 4 0 L 9 5 L 5 9 L 0 4 L -5 9 L -9 5' +
    'z'
  )
  path.setAttribute('fill', params.color)
  path.setAttribute('class', params.class)
  path.setAttribute('transform', 'translate(' + (params.width/2 + params.x) + ', ' + (params.height/2 + params.y) + ')')
}

function dart(svg, params) {
  switch (params.count) {
    case 1:
      dartSingle(svg, params, params.rot, 0, 0);
      break;
    case 2:
      dartSingle(svg, params, params.rot, -10, 0);
      dartSingle(svg, params, params.rot,  10, 0);
      break;
    case 3:
      dartSingle(svg, params, params.rot,  0, -10);
      dartSingle(svg, params, params.rot, -10, 10);
      dartSingle(svg, params, params.rot,  10, 10);
      break;
    case 4:
      dartSingle(svg, params, params.rot, -10, -10);
      dartSingle(svg, params, params.rot,  10, -10);
      dartSingle(svg, params, params.rot, -10, 10);
      dartSingle(svg, params, params.rot,  10, 10);
      break;
  }
}

function dartSingle(svg, params, rot, xoffset, yoffset) {
  const centerX = params.height/2 + params.x
  const centerY = params.width/2 + params.y - 1
  const rotate = function(degrees) {return 'rotate(' + degrees + ', ' + centerX + ', ' + centerY + ')'}

  var path = createElement('path')
  svg.appendChild(path)
  path.setAttribute('d', 'M -4 7 Q -6 9 -7 9 Q -9 9 -8 7 L -1 -7 Q 0 -9 1 -7 L 8 7 Q 9 9 7 9 Q 6 9 4 7 L 1 4 Q 0 3 -1 4' + 'z')
  path.setAttribute('fill', params.color)
  path.setAttribute('class', params.class)
  path.setAttribute('transform', rotate(45 * params.rot) + 'translate(' + (centerX + xoffset) + ', ' + (centerY + yoffset) + ')')
}

function polynt(svg, params) {
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
      '0 0', '0 -12', '12 -12',
      '12 0', '0 0', '2 -2',
      '8 -2', '2 -8', '2 -2',
      '0 0', '0 -12', '12 -12',
      '10 -10', '4 -10', '10 -4',
      '10 -10', '12 -12', '0 -12'
    ]
    
    poly.setAttribute('points', points.join(', '))
    var transform = 'translate(' + (centerX + pos.x*offset) + ', ' + (centerY + pos.y*offset + 12) + ')'
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

function polyntSimple(svg, params) {
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
      ' 3  0', ' 6  3', ' 9  0', 
      '12  3', ' 9  6', '12  9', 
      ' 9 12', ' 6  9', ' 3 12', 
      ' 0  9', ' 3  6', ' 0  3'
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

})