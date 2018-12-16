// Returns a random integer in [0, n)
// Uses a set seed so puzzles can be regenerated
var seed = 42
function setSeed(newSeed) {
  seed = newSeed
}

function _randint(n) {
  seed = ((seed << 13) ^ seed) - (seed >> 21)
  return Math.abs(seed) % Math.floor(n)
}

// Generates a random puzzle for a given size.
function randomPuzzle(style) {
  var width = style.width
  var height = style.height
  var puzzle = new Puzzle(width, height)

  // FIXME: Both start and end must be on corners
  if (style.start) {
    puzzle.addStart(style.start.x, style.start.y)
  } else {
    // TODO: Allow start points mid-segment
    puzzle.addStart(2 * _randint(width), 2 * _randint(height))
  }
  if (style.end) {
    puzzle.addEnd(style.end.x, style.end.y)
  } else {
    switch (_randint(4)) {
      case 0:
        puzzle.addEnd(0, 2 * _randint(height), 'left')
        break
      case 1:
        puzzle.addEnd(2 * width - 1, 2 * _randint(height), 'right')
        break
      case 2:
        puzzle.addEnd(2 * _randint(width), 0, 'top')
        break
      case 3:
        puzzle.addEnd(2 * _randint(width), 2 * height - 1, 'bottom')
        break
    }
  }

  var edges = []
  var corners = []
  var cells = []
  for (var x = 0; x < 2 * width + 1; x++) {
    for (var y = 0; y < 2 * height + 1; y++) {
      if (x % 2 == 0 && y % 2 == 0) {
        corners.push({'x':x, 'y':y})
      } else if (x % 2 == 1 && y % 2 == 1) {
        cells.push({'x':x, 'y':y})
      } else {
        edges.push({'x':x, 'y':y})
      }
    }
  }

  // Place a number of elements according to the set distribution
  for (var type in style['distribution']) {
    for (var i=0; i<style['distribution'][type]; i++) {
      if (type == 'dots') {
        if (style['distribution'][type] == corners.length) {
          puzzle.dots = corners // Style requests all corners filled
          corners = []
          break
        } else {
          var index = _randint(edges.length + corners.length)
          if (index < edges.length) {
            puzzle.dots.push(edges.splice(index, 1)[0])
          } else {
            puzzle.dots.push(corners.splice(index - edges.length, 1)[0])
          }
        }
      } else if (type == 'gaps') {
        puzzle.gaps.push(edges.splice(_randint(edges.length), 1)[0])
      } else if (type == 'negations') {
        var color = [WHITE, RED, BLUE, BLACK][_randint(style['colors'])]
        var pos = cells.splice(_randint(cells.length), 1)[0]
        puzzle.grid[pos.x][pos.y] = {'type':'nega', 'color':color}
      } else if (type == 'squares') {
        var color = [BLACK, WHITE, RED, BLUE][_randint(style['colors'])]
        var pos = cells.splice(_randint(cells.length), 1)[0]
        puzzle.grid[pos.x][pos.y] = {'type':'square', 'color':color}
      } else if (type == 'stars') {
        var color = [ORANGE, WHITE, BLACK, RED, BLUE][_randint(style['colors'])]
        var pos = cells.splice(_randint(cells.length), 1)[0]
        puzzle.grid[pos.x][pos.y] = {'type':'star', 'color':color}
        // If the distribution has more stars, place another of the same color
        // This reduces the likelihood of unsolvable puzzles
        if (i < style['distribution'][type]-1) {
          i++
          var pos2 = cells.splice(_randint(cells.length), 1)[0]
          puzzle.grid[pos2.x][pos2.y] = {'type':'star', 'color':color}
        }
      } else if (type == 'triangles') {
        var pos = cells.splice(_randint(cells.length), 1)[0]
        var rng = _randint(100)
        var count = 1 // 51%
        if (rng > 50) count = 2 // 25%
        if (rng > 85) count = 3 // 14%
        puzzle.grid[pos.x][pos.y] = {'type':'triangle', 'color':ORANGE, 'count':count}
      } else { // Polyominos
        var obj = {}
        if (['polyominos', 'rpolyominos'].includes(type)) {
          var size = _randint(Math.min(width, height))+1
          obj.type = 'poly'
        } else if (['onimoylops', 'ronimoylops'].includes(type)) {
          var size = _randint(Math.min(width, height)-1)+1
          obj.type = 'ylop'
        }
        var polyshapes = POLYOMINOS[size]
        var polyshape = polyshapes[_randint(polyshapes.length)]
        var rotations = getRotations(polyshape, 'all')
        obj.polyshape = rotations[_randint(4)]

        if (type[0] == 'r') { // rpolyominos or ronimoylops
          obj.rot = 'all'
        }
        obj.color = [YELLOW, RED, BLUE, WHITE][_randint(style['colors'])]

        var pos = cells.splice(_randint(cells.length), 1)[0]
        puzzle.grid[pos.x][pos.y] = obj
      }
    }
  }
  return puzzle
}

function randomLeftDoorPoly() {
  var size = _randint(3)
    if (size == 0) {
      var shape = ['I', 'L'][_randint(2)]
    } else if (size == 1) {
      /*
      RRR ####

            #
      RRU ###

           ##
      RUR ##

           #
           #
      RUU ##
      */
      var shape = ['I', 'L', 'S', 'J', 'L', 'Z', 'J', 'I'][_randint(8)]
    } else if (size == 2) {
      /*
      RRRR #####

              #
      RRRU ####

             ##
      RRUR ###

             #
             #
      RRUU ###

            ###
      RURR ##

             #
            ##
      RURU ##

            ##
            #
      RUUR ##

            #
            #
            #
      RUUU ##
      */

      var shape = ['L', 'M', 'V', 'M', 'W', 'S', 'J', 'L', 'Z', 'W', 'N', 'V', 'N', 'J'][_randint(14)]
    }
  return {'size':size+3, 'shape':shape, 'rot':_randint(4)}
}

function randomLeftDoor() {
  var height = 4
  var width = 4
  var puzzle = new Puzzle(width, height)
  while (true) {
    var star1 = {'x':2*_randint(4)+1, 'y':2*_randint(4)+1}
    var star2 = {'x':2*_randint(4)+1, 'y':2*_randint(4)+1}
    if (star1.x == star2.x && star1.y == star2.y) continue
    // Manhattan distance
    if (Math.abs(star1.x - star2.x) + Math.abs(star1.y - star2.y) < 6)
      continue

    var poly1 = {'x':2*_randint(4)+1, 'y':2*_randint(4)+1}
    var poly2 = {'x':2*_randint(4)+1, 'y':2*_randint(4)+1}
    if (poly1.x == star1.x && poly1.y == star1.y) continue
    if (poly1.x == star2.x && poly1.y == star2.y) continue
    if (poly2.x == star1.x && poly2.y == star1.y) continue
    if (poly2.x == star2.x && poly2.y == star2.y) continue
    if (poly2.x == poly1.x && poly2.y == poly1.y) continue

    Object.assign(poly1, randomLeftDoorPoly())
    Object.assign(poly2, randomLeftDoorPoly())

    for (var i=0; i<8; i++) {
      if (_randint(2) == 0) {
        puzzle.gaps.push({'x':_randint(4)*2+1, 'y':_randint(5)*2})
      } else {
        puzzle.gaps.push({'x':_randint(5)*2, 'y':_randint(4)*2+1})
      }
    }

    break
  }
  var colors = [BLACK, RED, BLUE, WHITE]
  var color1 = colors.splice(_randint(colors.length), 1)
  var color2 = colors.splice(_randint(colors.length), 1)

  star1.type = 'star'
  star2.type = 'star'
  poly1.type = 'poly'
  poly2.type = 'poly'
  star1.color = color1
  star2.color = color1
  poly1.color = color2
  poly2.color = color2

  puzzle.grid[star1.x][star1.y] = star1
  puzzle.grid[star2.x][star2.y] = star2
  puzzle.grid[poly1.x][poly1.y] = poly1
  puzzle.grid[poly2.x][poly2.y] = poly2

  puzzle.addStart(8, 0)
  puzzle.addEnd(0, 8, 'left')
  return puzzle
}

function randomRightDoor() {
  var height = 4
  var width = 4
  var puzzle = new Puzzle(width, height)

  var edges = []
  var corners = []
  var cells = []
  for (var x=0; x<2*width+1; x++) {
    for (var y=0; y<2*height+1; y++) {
      if (x%2 == 0 && y%2 == 0) {
        corners.push({'x':x, 'y':y})
      } else if (x%2 == 1 && y%2 == 1) {
        cells.push({'x':x, 'y':y})
      } else {
        edges.push({'x':x, 'y':y})
      }
    }
  }

  var square1 = cells.splice(_randint(cells.length), 1)[0]
  var square2 = cells.splice(_randint(cells.length), 1)[0]
  var square3 = cells.splice(_randint(cells.length), 1)[0]
  var square4 = cells.splice(_randint(cells.length), 1)[0]

  corners.splice(24, 1) // Start point is illegal
  corners.splice(0, 1) // End point is illegal
  puzzle.dots.push(corners.splice(_randint(corners.length), 1)[0])
  puzzle.dots.push(corners.splice(_randint(corners.length), 1)[0])

  for (var i=0; i<8; i++) {
    var edge = _randint(edges.length)
    console.log(edges.slice(edge, edge+1))
    puzzle.gaps.push(edges.slice(edge, edge+1)[0])
  }

  var colors = [PURPLE, RED, ORANGE, GREEN, BLUE]
  var color1 = colors.splice(_randint(colors.length), 1)
  var color2 = colors.splice(_randint(colors.length), 1)

  puzzle.grid[square1.x][square1.y] = {'type':'square', 'color':color1}
  puzzle.grid[square2.x][square2.y] = {'type':'square', 'color':color1}
  puzzle.grid[square3.x][square3.y] = {'type':'square', 'color':color2}
  puzzle.grid[square4.x][square4.y] = {'type':'square', 'color':color2}

  puzzle.addStart(8, 8)
  puzzle.addEnd(0, 0, 'right')
  return puzzle
}

function removeLs(puzzle, square1, square2) {
  if (square1.x == square2.x && Math.abs(square1.y - square2.y) == 2) {
    if (!puzzle.getCell(square1.x-2, square1.y)) {
      puzzle.setCell(square1.x-2, square1.y, {'type':'nonce'})
    }
    if (!puzzle.getCell(square1.x+2, square1.y)) {
      puzzle.setCell(square1.x+2, square1.y, {'type':'nonce'})
    }
    if (!puzzle.getCell(square2.x-2, square2.y)) {
      puzzle.setCell(square2.x-2, square2.y, {'type':'nonce'})
    }
    if (!puzzle.getCell(square2.x+2, square2.y)) {
      puzzle.setCell(square2.x+2, square2.y, {'type':'nonce'})
    }
  }
  if (Math.abs(square1.x - square2.x) == 2 && square1.y == square2.y) {
    if (!puzzle.getCell(square1.x, square1.y-2)) {
      puzzle.setCell(square1.x, square1.y-2, {'type':'nonce'})
    }
    if (!puzzle.getCell(square1.x, square1.y+2)) {
      puzzle.setCell(square1.x, square1.y+2, {'type':'nonce'})
    }
    if (!puzzle.getCell(square2.x, square2.y-2)) {
      puzzle.setCell(square2.x, square2.y-2, {'type':'nonce'})
    }
    if (!puzzle.getCell(square2.x, square2.y+2)) {
      puzzle.setCell(square2.x, square2.y+2, {'type':'nonce'})
    }
  }
}

function randomTriple() {
  var height = 4
  var width = 4
  var puzzle = new Puzzle(width, height)

  var edges = []
  var corners = []
  var cells = []
  for (var x=0; x<2*width+1; x++) {
    for (var y=0; y<2*height+1; y++) {
      if (x%2 == 0 && y%2 == 0) {
        corners.push({'x':x, 'y':y})
      } else if (x%2 == 1 && y%2 == 1) {
        cells.push({'x':x, 'y':y})
      } else {
        edges.push({'x':x, 'y':y})
      }
    }
  }

  var square1 = cells.splice(_randint(cells.length), 1)[0]
  var square2 = cells.splice(_randint(cells.length), 1)[0]
  var square3 = cells.splice(_randint(cells.length), 1)[0]
  var square4 = cells.splice(_randint(cells.length), 1)[0]
  puzzle.grid[square1.x][square1.y] = {'type':'square', 'color':'green'}
  puzzle.grid[square2.x][square2.y] = {'type':'square', 'color':'green'}
  puzzle.grid[square3.x][square3.y] = {'type':'square', 'color':'purple'}
  puzzle.grid[square4.x][square4.y] = {'type':'square', 'color':'purple'}
  removeLs(puzzle, square1, square3)
  removeLs(puzzle, square1, square4)
  removeLs(puzzle, square2, square3)
  removeLs(puzzle, square2, square4)

  var placedWhites = 0
  while(placedWhites < 5 && cells.length > 0) {
    var square = cells.splice(_randint(cells.length), 1)[0]
    if (!puzzle.grid[square.x][square.y]) {
      puzzle.grid[square.x][square.y] = {'type':'square', 'color':'white'}
      placedWhites++
    }
  }
  puzzle.addStart(8, 0)
  puzzle.addEnd(0, 8, 'top')
  return puzzle
}

function validDoor(side) {
  while (true) {
    var puzzleSeed = seed
    if (side == 'left')
      var puzzle = randomLeftDoor()
    else
      var puzzle = randomRightDoor()
    var solutions = solve(puzzle)
    console.info('Puzzle', puzzle, 'has', solutions.length, 'solutions: ')
    if (solutions.length > 0) {
      break
    }
  }
  return {'puzzle':puzzle, 'solutions':solutions, 'seed':puzzleSeed}
}

function validTriple() {
  while (true) {
    solutions = []
    var puzzleSeed = seed
    var puzzle = randomTriple()
    var solutions = solve(puzzle)
    console.info('Puzzle', puzzle, 'has', solutions.length, 'solutions: ')
    if (solutions.length > 0) {
      break
    }
  }
  return {'puzzle':puzzle, 'solutions':solutions, 'seed':puzzleSeed}
}

function invalidTriple() {
  while (true) {
    solutions = []
    var puzzleSeed = seed
    var puzzle = randomTriple()
    var solutions = solve(puzzle)
    console.info('Puzzle', puzzle, 'has', solutions.length, 'solutions: ')
    if (solutions.length == 0) {
      break
    }
  }
  return {'puzzle':puzzle, 'solutions':solutions, 'seed':puzzleSeed}
}

function validPuzzle(style) {
  // Require a puzzle with not too many solutions
  while (true) {
    var puzzleSeed = seed
    var puzzle = randomPuzzle(style)
    var solutions = solve(puzzle)
    console.info('Puzzle', puzzle, 'has', solutions.length, 'solutions: ')
    if (solutions.length < style['difficulty'][0]) {
      console.info('Too Hard')
    } else if (solutions.length > style['difficulty'][1]) {
      console.info('Too Easy')
    } else {
      console.info('Just Right')
      break
    }
  }
  return {'puzzle':puzzle, 'solutions':solutions, 'seed':puzzleSeed}
}
