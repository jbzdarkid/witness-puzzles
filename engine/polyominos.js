function getPolySize(polyshape) {
  var size = 0
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (_isSet(polyshape, x, y)) size++
    }
  }
  return size
}

function _mask(x, y) {
  return 1 << (x*4 + y)
}
function _isSet(polyshape, x, y) {
  if (x < 0 || y < 0) return false
  if (x > 4 || y > 4) return false
  return (polyshape & _mask(x, y)) != 0
}

function getRotations(polyshape, rot=null) {
  if (rot != 'all') return [polyshape]

  var rotations = [0, 0, 0, 0]
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (_isSet(polyshape, x, y)) {
        rotations[0] ^= _mask(x, y)
        rotations[1] ^= _mask(y, 3-x)
        rotations[2] ^= _mask(3-x, 3-y)
        rotations[3] ^= _mask(3-y, x)
      }
    }
  }

  return rotations
}

function fitsGrid(cells, x, y, puzzle) {
  for (var cell of cells) {
    if (cell.x + x < 0 || cell.x + x >= puzzle.grid.length) return false
    if (cell.y + y < 0 || cell.y + y >= puzzle.grid[0].length) return false
  }
  return true
}

// IMPORTANT NOTE: When formulating these, the top row must contain (0, 0)
// That means there will never be any negative y values.
// (0, 0) must also be a cell in the shape, so that
// placing the shape at (x, y) will fill (x, y)
// Ylops will have -1s on all adjacent cells, to break "overlaps" for polyominos.
function polyominoFromPolyshape(polyshape, ylop=false) {
  for (var y=0; y<4; y++) {
    for (var x=0; x<4; x++) {
      if (_isSet(polyshape, x, y)) {
        var topLeft = {'x':x, 'y':y}
        break
      }
    }
    if (topLeft != undefined) break
  }
  if (topLeft == undefined) return [] // Empty polyomino

  var polyomino = []
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (!_isSet(polyshape, x, y)) continue
      polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y)})

      if (ylop) {
        // Ylops fill up/left if no adjacent cell, and always fill bottom/right
        if (!_isSet(polyshape, x - 1, y)) {
          polyomino.push({'x':2*(x - topLeft.x) - 1, 'y':2*(y - topLeft.y)})
        }
        if (!_isSet(polyshape, x, y - 1)) {
          polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y) - 1})
        }
        polyomino.push({'x':2*(x - topLeft.x) + 1, 'y':2*(y - topLeft.y)})
        polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y) + 1})
      } else {
        // Normal polys only fill bottom/right if there is an adjacent cell.
        if (_isSet(polyshape, x + 1, y)) {
          polyomino.push({'x':2*(x - topLeft.x) + 1, 'y':2*(y - topLeft.y)})
        }
        if (_isSet(polyshape, x, y + 1)) {
          polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y) + 1})
        }
      }
    }
  }
  return polyomino
}

POLYOMINOS = {
  '1':[1],
  '2':[3, 17, 33, 18],
  '3':[7, 19, 22, 35, 37, 49, 50, 52, 67, 82, 97, 273, 274, 289, 290, 529, 530, 545],
  '4':[15, 23, 39, 51, 54, 71, 85, 99, 113, 114, 116, 195, 275, 305, 306, 547, 561, 562, 771, 785, 802, 4369, 4386],
  '5':[31, 47, 55, 62, 79, 87, 103, 115, 117, 118, 124, 143, 199, 227, 241, 242, 244, 248, 279, 307, 310, 369, 370, 372, 551, 563, 566, 611, 625, 626, 628, 787, 803, 806, 817, 818, 866, 868, 1095, 1123, 1137, 1138, 1140, 1571, 1585, 1586, 1809, 1826, 1860, 4371, 4401, 4402, 4881, 4898, 8739, 8753, 8754, 8977, 12561, 12834],
/* Custom polyominos */
  '6':[819],
  '9':[1911],
  '11':[32614],
}
