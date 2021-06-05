namespace(function() {

window.createElement = function(type) {
  return document.createElementNS('http://www.w3.org/2000/svg', type)
}

window.drawSymbol = function(params) {
  let svg = createElement('svg')
  svg.setAttribute('viewBox', '0 0 ' + params.width + ' ' + params.height)
  if (!params.x) params.x = 0
  if (!params.y) params.y = 0
  drawSymbolWithSvg(svg, params)
  return svg
}

function mx(params) { return params.width  / 2 + params.x; }
function my(params) { return params.height / 2 + params.y; }

function setAttr(thing, params) {
  thing.setAttribute('fill', params.color || 'black')
  if (params.class       !== undefined) thing.setAttribute('class', params.class)
  thing.setAttribute('transform', 'translate(' + mx(params) + ', ' + my(params) + ')')
  if (params.stroke      !== undefined) thing.setAttribute('stroke', params.stroke)
  if (params.strokeWidth !== undefined) thing.setAttribute('stroke-width', params.strokeWidth)
  thing.style.pointerEvents = 'none';
}

function simplePoly(svg, params, path) {
  let elem = createElement('polygon')
  svg.appendChild(elem)
  setAttr(elem, params)
  elem.setAttribute('points', path)
  return elem
}

function simplePath(svg, params, path) {
  let elem = createElement('path')
  svg.appendChild(elem)
  setAttr(elem, params)
  elem.setAttribute('d', path + 'z')
  return elem
}

function simpleLine(svg, params, length, thickness, r) {
  let l = createElement('rect')
  svg.appendChild(l)
  setAttr(l, params)
  l.setAttribute('x', mx(params) - (thickness / 2))
  l.setAttribute('y', my(params))
  l.setAttribute('width', thickness);
  l.setAttribute('height', length);
  l.setAttribute('transform', 'rotate(' + r + ', ' + mx(params) + ', ' + my(params) + ')')
  return l
}

function simpleDot(svg, params, x, y) {
  let circ = createElement('circle')
  svg.appendChild(circ)
  setAttr(circ, params)
  circ.setAttribute('r', 3);
  circ.setAttribute('cx', x);
  circ.setAttribute('cy', y);
  return circ;
}

//********************** REPEAT-FUNCTIONS **********************//

function drawPolyomino(svg, params, size, space, yoffset, path) {
  if (params.polyshape === 0) return
  let polyomino = window.polyominoFromPolyshape(params.polyshape)
  let bounds = {'xmin':0, 'xmax':0, 'ymin':0, 'ymax':0}
  for (var i=0; i<polyomino.length; i++) {
    let pos = polyomino[i]
    bounds.xmin = Math.min(bounds.xmin, pos.x)
    bounds.xmax = Math.max(bounds.xmax, pos.x)
    bounds.ymin = Math.min(bounds.ymin, pos.y)
    bounds.ymax = Math.max(bounds.ymax, pos.y)
  }
  let offset = (size+space)/2 // Offset between elements to create the gap
  let centerX = (params.width - size - offset * (bounds.xmax + bounds.xmin)) / 2 + params.x
  let centerY = (params.height - size - offset * (bounds.ymax + bounds.ymin)) / 2 + params.y

  for (var i=0; i<polyomino.length; i++) {
    let pos = polyomino[i]
    if (pos.x % 2 !== 0 || pos.y % 2 !== 0) continue;
    let poly = createElement('polygon')
    svg.appendChild(poly)
    poly.setAttribute('points', path)
    let transform = '';
    if (window.isRotated(params.polyshape)) // -30 degree rotation around the midpoint of the square
      transform = 'rotate(-30, ' + mx(params) + ', ' + my(params) + ') '
    transform += 'translate(' + (centerX + pos.x*offset) + ', ' + (centerY + pos.y*offset + yoffset) + ')'
    setAttr(poly, params)
    poly.setAttribute('transform', transform)
  }
}

const triangleDistributions = [
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

function triangleSingle(svg, params, xoffset, yoffset) {
  let path = createElement('path')
  svg.appendChild(path)
  path.setAttribute('d', 'M -7 7 Q -9 7 -8 5 L -1 -6 Q 0 -7 1 -6 L 8 5 Q 9 7 7 7 z')
  setAttr(path, params)
  path.setAttribute('transform', 'translate(' + (mx(params) + xoffset) + ', ' + (my(params) + yoffset) + ')')
}

function onebyone(svg, params, xoffset, yoffset) {
  let hex = createElement('polygon')
  svg.appendChild(hex)
  setAttr(hex, params)
  hex.setAttribute('points', '7.07 0, 0 7.07, -7.07 0, 0 -7.07')
  hex.setAttribute('transform', 'translate(' + (mx(params) + xoffset) + ', ' + (my(params) + yoffset) + ')')
}

function enobyeno(svg, params, xoffset, yoffset) {
  let hex = createElement('polygon')
  svg.appendChild(hex)
  setAttr(hex, params)
  hex.setAttribute('points', '8.49 0, 0 8.49, -8.49 0, 0 -8.49, 8.49 0, 4.24 0, 0 -4.24, -4.24 0, 0 4.24, 4.24 0')
  hex.setAttribute('transform', 'translate(' + (mx(params) + xoffset) + ', ' + (my(params) + yoffset) + ')')
}

function dartSingle(svg, params, rot, xoffset, yoffset) {
  const rotate = function(degrees) {return 'rotate(' + degrees + ', ' + mx(params) + ', ' + (my(params) - 1) + ')'}
  let path = createElement('path')
  svg.appendChild(path)
  setAttr(path, params)
  path.setAttribute('d', 'M -4 7 Q -6 9 -7 9 Q -9 9 -8 7 L -1 -7 Q 0 -9 1 -7 L 8 7 Q 9 9 7 9 Q 6 9 4 7 L 1 4 Q 0 3 -1 4' + 'z')
  let transform = rotate(45 * params.rot)
  transform += ' translate(' + (mx(params) + xoffset) + ', ' + (my(params) + yoffset) + ')'
  path.setAttribute('transform', transform)
}

//********************** MAIN **********************//

window.drawSymbolWithSvg = function(svg, params) {
  let circ, rect, hex, hex2, arrowhead, path, poly, transform;
  let midx = params.width  / 2 + params.x;
  let midy = params.height / 2 + params.y;
  if (!params.rot) params.rot = 0
  let rotate = function(degrees) {return 'rotate(' + degrees + ', ' + midx + ', ' + midy + ')'}
  switch (params.type) {
    case 'square': //------------------------------------SQUARE
      rect = createElement('rect')
      svg.appendChild(rect)
      rect.setAttribute('width', 28);    rect.setAttribute('height', 28);
      rect.setAttribute('x', midx - 14); rect.setAttribute('y', midy - 14);
      rect.setAttribute('rx', 7);        rect.setAttribute('ry', 7);
      setAttr(rect, params)
      rect.setAttribute('transform', '')
      break;
    case 'dot': //------------------------------------HEXAGON
      simplePoly(svg, params, '5.2 9, 10.4 0, 5.2 -9, -5.2 -9, -10.4 0, -5.2 9')
      break;
    case 'gap':
      for (xoffset of [-40, 9]) {
        rect = createElement('rect')
        svg.appendChild(rect)
        rect.setAttribute('width', 32)
        rect.setAttribute('height', 24)
        rect.setAttribute('fill', 'var(--line-undone)')
        rect.setAttribute('transform', rotate(90 * params.rot))
        rect.setAttribute('x', midx + xoffset)
        rect.setAttribute('y', midy - 12)
        rect.setAttribute('shape-rendering', 'crispedges')
      }
      break;
    case 'star': //------------------------------------STAR
      simplePoly(svg, params, '-10.5 -10.5, -9.5 -4, -15 0, -9.5 4, -10.5 10.5, -4 9.5, 0 15, 4 9.5, 10.5 10.5, 9.5 4, 15 0, 9.5 -4, 10.5 -10.5, 4, -9.5, 0 -15, -4 -9.5')
      break;
    case 'poly': //------------------------------------POLYOMINO
      drawPolyomino(svg, params, 10, 4, 0, '0 0, 10 0, 10 10, 0 10')
      break;
    case 'ylop': //------------------------------------BLUE MINOS / NEGATIVE MINOS
      drawPolyomino(svg, params, 12, 2, 0, '0 0, 12 0, 12 12, 0 12, 0 3, 3 3, 3 9, 9 9, 9 3, 0 3')
      break;
    case 'nega': //------------------------------------NEGATOR
      if (localStorage.symbolTheme == "Canonical")
        simplePoly(svg, params, '2.9 -2, 2.9 -10.4, -2.9 -10.4, -2.9 -2, -10.2 2.2, -7.3 7.2, 0 3, 7.3 7.2, 10.2 2.2')
      else
        simplePath(svg, params, 'M -3 0 L -3 -9 L 3 -9 L 3 0 L 10 4 L 8 9 L 0 5 L -8 9 L -10 4')
      break;
    case 'nonce': //------------------------------------?
      /* Do nothing */
      break;
    case 'triangle': //------------------------------------TRIANGLE
      if (localStorage.symbolTheme == "Canonical") {
          let distribution = triangleDistributions[params.count]
          let high = distribution.length
          for (var y = 0; y < high; y++) {
            let wide = distribution[y]
            for (var x = 0; x < wide; x++) {
              poly = createElement('polygon')
              svg.appendChild(poly)
              let Xcoord = midx + 11 * (2 * x - wide + 1)
              let Ycoord = midy + 10 * (2 * y - high + 1)
              poly.setAttribute('points', '0 -8, -8 6, 8 6')
              setAttr(poly, params)
              poly.setAttribute('transform', 'translate(' + Xcoord + ', ' + Ycoord + ')')
            }
          }
        }
      else
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
      break;
    case 'start': //------------------------------------START/CIRCLE LINE
      circ = createElement('circle')
      svg.appendChild(circ)
      circ.setAttribute('fill', 'var(--line-undone)')
      circ.setAttribute('r', 24)
      circ.setAttribute('cx', midx); circ.setAttribute('cy', midy);
      break;
    case 'end': //------------------------------------END/GOAL NUB
      rect = createElement('rect')
      circ = createElement('circle')
      svg.appendChild(rect)
      svg.appendChild(circ)
      rect.setAttribute('fill', 'var(--line-undone)')
      circ.setAttribute('fill', 'var(--line-undone)')
      rect.setAttribute('width', 24); rect.setAttribute('height', 24);
      circ.setAttribute('r', 12)
      rect.setAttribute('x' , midx - 12); rect.setAttribute('y' , midy - 12);
      circ.setAttribute('cx', midx);      circ.setAttribute('cy', midy);
    
      let axis = 'x'
      let sign = 1;
      if (params.dir === 'top'  || params.dir === 'bottom') axis = 'y';
      if (params.dir === 'left' || params.dir === 'top'   ) sign = -1;
      rect.setAttribute(      axis, parseInt(rect.getAttribute(      axis)) + (sign * 12))
      circ.setAttribute('c' + axis, parseInt(circ.getAttribute('c' + axis)) + (sign * 24))
      break;
    case 'drag': //------------------------------------DRAWN LINE
      if (!params.rot) params.rot = 0
      for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 2; j++) {
          rect = createElement('rect')
          svg.appendChild(rect)
          rect.setAttribute('fill', 'var(--background)')
          rect.setAttribute('width', 2); rect.setAttribute('height', 2);
          if (params.rot === 0) { rect.setAttribute('x', i * 4); rect.setAttribute('y', j * 4); } 
          else {                  rect.setAttribute('x', j * 4); rect.setAttribute('y', i * 4); }
        }
      }
      break;
    case 'bridge': //------------------------------------SEREN'S BRIDGE
      if (localStorage.symbolTheme == "Canonical")
        simplePoly(svg, params, '-10.58 14.56, -17.12 -5.56, 0 -18, 17.12 -5.56, 10.58 14.56, 5.29 7.28, 8.56 -2.78, 0 -9, -8.56 -2.78, -5.29 7.28')
      else
        simplePoly(svg, params, '-9.52 13.10, -15.41 -5.00, 0.00 -16.20, 15.41 -5.00, 9.52 13.10, 4.76 6.55, 7.70 -2.50, 0.00 -8.10, -7.70 -2.50, -4.76 6.55')
      break;
    case 'arrow': //------------------------------------SIGMA'S ARROW
      if (localStorage.symbolTheme == "Canonical") {
        rect = createElement('rect')
        svg.appendChild(rect)
        setAttr(rect, params)
        rect.setAttribute('width', 6)
        rect.setAttribute('height', 36)
        rect.setAttribute('transform', rotate(45 * params.rot))
        rect.setAttribute('x', midx - 3)
        rect.setAttribute('y', midy - 18)
      
        for (var i = 0; i < params.count; i++) {
          arrowhead = createElement('path')
          svg.appendChild(arrowhead)
          setAttr(arrowhead, params)
          transform = rotate(45 * params.rot)
          transform += ' translate(' + midx + ', ' + (midy - 14 + i * 12) + ')'
          arrowhead.setAttribute('d', 'M 2 -8 Q 0 -10 -2 -8 L -12 2 Q -14 4 -14 5 L -14 11 Q -14 12 -13 11 L -1 -1 Q 0 -2 1 -1 L 13 11 Q 14 12 14 11 L 14 5 Q 14 4 12 2 ' + 'z')
          arrowhead.setAttribute('transform', transform)
        }
      }
      else {
        for (var i = -(params.count / 2); i < (params.count / 2); i++) {
          arrowhead = createElement('path')
          svg.appendChild(arrowhead)
          setAttr(arrowhead, params)
          transform = rotate(45 * params.rot)
          transform += ' translate(' + midx + ', ' + (midy + i * 12 + 4.5 - (params.rot % 2 * 6)) + ')'
          arrowhead.setAttribute('d', 'M 2 -8 Q 0 -10 -2 -8 L -12 2 Q -14 4 -14 5 L -14 11 Q -14 12 -13 11 L -1 -1 Q 0 -2 1 -1 L 13 11 Q 14 12 14 11 L 14 5 Q 14 4 12 2 ' + 'z')
          arrowhead.setAttribute('transform', transform)
        }
      }
      break;
    case 'sizer': //------------------------------------RADIAZIA'S SIZER
      if (localStorage.symbolTheme == "Canonical")
        simplePath(svg, params, 'M -24 0 ' +
          'a 24 24 0 0 0  24 -24 ' +
          'a 24 24 0 0 0  24  24 ' +
          'a 24 24 0 0 0 -24  24 ' +
          'a 24 24 0 0 0 -24 -24 ')
      else
        simplePath(svg, params, 'M -13 7 Q -14 11 -10 11 L 10 11 Q 14 11 13 7 L 8 -7 Q 7 -9 5 -9 L -5 -9 Q -7 -9 -8 -7')
      break; 
    case 'cross': //------------------------------------LOOKSY - CROSS
      simplePoly(svg, params, '-10 -2.5,-10 2.5,-2.5 2.5,-2.5 10,2.5 10,2.5 2.5,10 2.5,10 -2.5,2.5 -2.5,2.5 -10,-2.5 -10,-2.5 -2.5')
      hex2 = createElement('rect')
      svg.appendChild(hex2)
      hex2.setAttribute('fill', 'var(--line-undone)')
      hex2.setAttribute('transform', 'translate(' + (midx - 2.5) + ', ' + (midy - 2.5) + ')')
      hex2.setAttribute('width', '5')
      hex2.setAttribute('height', '5')
      break;
    case 'crossFilled':
      simplePoly(svg, params, '-10 -2.5,-10 2.5,-2.5 2.5,-2.5 10,2.5 10,2.5 2.5,10 2.5,10 -2.5,2.5 -2.5,2.5 -10,-2.5 -10,-2.5 -2.5')
      break;
    case 'curve': //------------------------------------LOOKSY - CURVE
      simplePoly(svg, params, '10 0, 0 10, -10 0, 0 -10, 0 -5, -5 0, 0 5, 5 0, 0 -5, 0 -10')
      break;
    case 'curveFilled':
      simplePoly(svg, params, '10 0, 0 10, -10 0, 0 -10')
      break;
    case 'twobytwo': //------------------------------------LOOKSY2 - TWOBYTWO
      if (localStorage.symbolTheme == "Canonical") {
        onebyone(svg, params, 9.71, 0)
        onebyone(svg, params, -9.71, 0)
        onebyone(svg, params, 0, 9.71)
        enobyeno(svg, params, 0, -11)
      } else {
        onebyone(svg, params, 9.71, 0)
        onebyone(svg, params, -9.71, 0)
        onebyone(svg, params, 0, 9.71)
        onebyone(svg, params, 0, -9.71)
      }
      break;
    case 'dart': //------------------------------------LOOKSY2 - DART
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
      break;
    case 'polynt': //------------------------------------UNSUSPICIOUSPERSON'S ANTIPOLYOMINO
      // if (localStorage.symbolTheme == "Canonical")
        drawPolyomino(svg, params, 12, 2, 12, '0 0, 0 -12, 12 -12, 12 0, 0 0, 2 -2, 8 -2, 2 -8, 2 -2, 0 0, 0 -12, 12 -12, 10 -10, 4 -10, 10 -4, 10 -10, 12 -12, 0 -12')
      // else
        // drawPolyomino(svg, params, 12, 2, '3 0, 6 3, 9 0, 12 3, 9 6, 12 9, 9 12, 6 9, 3 12, 0 9, 3 6, 0 3')
      break;
    case 'divdiamond': //------------------------------------SHAUN'S DIVIDED DIAMOND
      simplePoly(svg, params, '-15 0, 0 15, 15 0, 0 -15, 0 -9, 9 0, 0 9, -9 0, 0 -9, 0 -15')
      switch (params.count) {
        case 2:
          simpleDot(svg, params, 0, 0);
          break;
        case 3:
          rect = createElement('rect')
          svg.appendChild(rect)
          setAttr(rect, params)
          rect.setAttribute('x', -2);
          rect.setAttribute('y', -9);
          rect.setAttribute('width', 4);
          rect.setAttribute('height', 18);
          break;
        case 4:
          simpleLine(svg, params, 9, 4, 180);
          simpleLine(svg, params, 7, 4, 60);
          simpleLine(svg, params, 7, 4, 300);
          break;
        case 5:
          if (localStorage.symbolTheme == "Canonical") {
            simpleLine(svg, params, 9, 4, 180);
            simpleLine(svg, params, 9, 4, 0);
            simpleLine(svg, params, 9, 4, 90);
            simpleLine(svg, params, 9, 4, 270);
          } else {
            simpleLine(svg, params, 7, 4, 45);
            simpleLine(svg, params, 7, 4, 135);
            simpleLine(svg, params, 7, 4, 225);
            simpleLine(svg, params, 7, 4, 315);
          }
          break;
        case 6:
          if (localStorage.symbolTheme == "Canonical") {
            simpleLine(svg, params, 9, 4, 180);
            simpleLine(svg, params, 8, 4, 108);
            simpleLine(svg, params, 7, 4, 36);
            simpleLine(svg, params, 8, 4, 252);
            simpleLine(svg, params, 7, 4, 324);
          } else {
            simpleLine(svg, params, 7, 4, 45);
            simpleLine(svg, params, 7, 4, 135);
            simpleLine(svg, params, 7, 4, 225);
            simpleLine(svg, params, 7, 4, 315);
            simpleDot(svg, params, 12, 12);
          }
          break;
        case 7:
          if (localStorage.symbolTheme == "Canonical") {
            simpleLine(svg, params, 9, 4, 180);
            simpleLine(svg, params, 9, 4, 0);
            simpleLine(svg, params, 9, 4, 120);
            simpleLine(svg, params, 9, 4, 60);
            simpleLine(svg, params, 9, 4, 300);
            simpleLine(svg, params, 9, 4, 240);
          } else {
            simpleLine(svg, params, 7, 4, 45);
            simpleLine(svg, params, 7, 4, 135);
            simpleLine(svg, params, 7, 4, 225);
            simpleLine(svg, params, 7, 4, 315);
            simpleDot(svg, params, 12, 12);
            simpleDot(svg, params, -12, -12);
          }
          break;
        case 8:
          if (localStorage.symbolTheme == "Canonical") {
            simpleLine(svg, params, 9, 4, 180);
            simpleLine(svg, params, 9, 4, 130);
            simpleLine(svg, params, 9, 4, 80);
            simpleLine(svg, params, 9, 4, 20);
            simpleLine(svg, params, 9, 4, 230);
            simpleLine(svg, params, 9, 4, 280);
            simpleLine(svg, params, 9, 4, 340);
          } else {
            simpleLine(svg, params, 7, 4, 45);
            simpleLine(svg, params, 7, 4, 135);
            simpleLine(svg, params, 7, 4, 225);
            simpleLine(svg, params, 7, 4, 315);
            simpleDot(svg, params, 12, 12);
            simpleDot(svg, params, -12, -12);
            simpleDot(svg, params, -12, 12);
          }
          break;
        case 9:
          if (localStorage.symbolTheme == "Canonical") {
            simpleLine(svg, params, 9, 4, 180);
            simpleLine(svg, params, 9, 4, 0);
            simpleLine(svg, params, 9, 4, 90);
            simpleLine(svg, params, 9, 4, 270);
            simpleLine(svg, params, 7, 4, 45);
            simpleLine(svg, params, 7, 4, 135);
            simpleLine(svg, params, 7, 4, 225);
            simpleLine(svg, params, 7, 4, 315);
          } else {
            simpleLine(svg, params, 7, 4, 45);
            simpleLine(svg, params, 7, 4, 135);
            simpleLine(svg, params, 7, 4, 225);
            simpleLine(svg, params, 7, 4, 315);
            simpleDot(svg, params, 12, 12);
            simpleDot(svg, params, -12, -12);
            simpleDot(svg, params, -12, 12);
            simpleDot(svg, params, 12, -12);
          }
          break;
      }
      break;
    case 'vtriangle': //------------------------------------SUS' TENUOUS TRIANGLE
      if (localStorage.symbolTheme == "Canonical") { 
        simplePath(svg, params, 'M -13.5 12 Q -16.5 12 -13.5 7.5 L -1.5 -12 Q 0 -15 1.5 -12 L 15 9 Q 16.5 12 13.5 12 L 7 9 L 10.5 9 L 1.5 -6 Q 0 -8.3 -1.5 -6 L -10.5 9 L -7 9 L -1 -2 Q 0 -3.8 1 -2 L 7 9 L 13.5 12')
      }
      else {
        triangleSingle(svg, params, 0, 3);
        simplePath(svg, params, 'M -10 8.2 Q -11 10 -12 10 L -14 10 Q -15.2 10 -14 8 L -1 -12 Q 0 -13.6 1 -12 L 14 8 Q 15.2 10 14 10 L 12 10 Q 11 10 10 8.2 L 1 -6 Q 0 -7.7 -1 -6')
      }
      break;
    case 'x':
      if ((params.spokes - 1) & 1) {
        simpleLine(svg, params, 35, 5, 135)
        simpleDot(svg, params, -25, -25).setAttribute('r', '2.5px')
      } else {
        simpleLine(svg, params, 14, 5, 135)
        simpleDot(svg, params, -10, -10).setAttribute('r', '2.5px')
      }
      if ((params.spokes - 1) & 2) {
        simpleLine(svg, params, 35, 5, 225)
        simpleDot(svg, params, 25, -25).setAttribute('r', '2.5px')
      } else {
        simpleLine(svg, params, 14, 5, 225)
        simpleDot(svg, params, 10, -10).setAttribute('r', '2.5px')
      }
      if ((params.spokes - 1) & 4) {
        simpleLine(svg, params, 35, 5, 45)
        simpleDot(svg, params, -25, 25).setAttribute('r', '2.5px')
      } else {
        simpleLine(svg, params, 14, 5, 45)
        simpleDot(svg, params, -10, 10).setAttribute('r', '2.5px')
      }
      if ((params.spokes - 1) & 8) {
        simpleLine(svg, params, 35, 5, 315)
        simpleDot(svg, params, 25, 25).setAttribute('r', '2.5px')
      } else {
        simpleLine(svg, params, 14, 5, 315)
        simpleDot(svg, params, 10, 10).setAttribute('r', '2.5px')
      }
      break;
    case 'pentagon': //------------------------------------SHAUN'S PENTAGONS
      simplePath(svg, params, 'M -6 13.4 Q -9 13.4 -10 11 L -13 0 Q -14 -2.5 -12 -4.5 L -2 -12.5 Q 0 -14 2 -12.5 L 12 -4.5 Q 14 -2.5 13 0 L 10 11 Q 9 13.4 6 13.5')
      break;
    case 'copier': //------------------------------------ARTLESS' COPIER
      simplePath(svg, params, 'M -4 0 L -9 -5 L -5 -9 L 0 -4 L 5 -9 L 9 -5 L 4 0 L 9 5 L 5 9 L 0 4 L -5 9 L -9 5')
      break;
    case 'celledhex': //------------------------------------SHAUN'S CELLED HEXES
      simplePath(svg, params, 'M -2 -13.5 Q 0 -15 2 -13.5 L 10 -8 Q 12 -7 12 -5 L 12 5 Q 12 7 10 8 L 2 12.6 Q 0 14 -2 12.5 L -10 8 Q -12 7 -12 5 L -12 -5 Q -12 -7 -10 -8')
      break;
    case 'scaler':
      simplePath(svg, params, 'M -13 14 Q -14 14 -13 12 L -2 -10 Q 0 -14 2 -10 L 13 12 Q 14 14 13 14 L 8 14 Q 7 14 6 11 L 1 0 Q 0 -2 -1 0 L -6 11 Q -7 14 -8 14')
      break;
    default: //------------------------------------ERROR HANDLING
      console.error('Cannot draw unknown SVG type: ' + params.type)
      break;
  }
}

})