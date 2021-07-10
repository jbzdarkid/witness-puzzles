namespace(function() {

var seed = 0
window.onload = function() {
  var params = new URLSearchParams(window.location.search)
  seed = parseInt(params.get('seed')) || 0

  generatePuzzles() // TODO: Hard mode? Maybe... always hard mode?
}

var styles = [
  {
    'id': 'polyominos', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      // TODO: Select a random colors
      for (var cell of randomDistinctCells(puzzle, 2)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'poly', 'color': 'yellow', 'polyshape': randomPolyomino()}
      }
      for (var cell of randomDistinctCells(puzzle, 2)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'star', 'color': 'orange'}
      }
      for (var cell of randomEdges(puzzle, 4)) { // TODO: How many gaps?
        puzzle.grid[cell.x][cell.y].gap = 1
      }
      return puzzle
    }
  }, {
    'id': 'triangles-left', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      for (var cell of randomDistinctCells(puzzle, 6)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'triangle', 'color': 'orange', 'count': randomTriangle()}
      }
      return puzzle
    }
  }, {
    'id': 'triangles-right', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      for (var cell of randomDistinctCells(puzzle, 8)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'triangle', 'color': 'orange', 'count': randomTriangle()}
      }
      return puzzle
    }
  }, {
    'id': 'pillar-left', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(6, 6, true)
      applyRandomPillarSymmetry(puzzle)

      // TODO: Confirm syntax
      for (var cell of randomEdges(puzzle, 8)) {
        puzzle.grid[cell.x][cell.y].gap = 1
      }
      for (var cell of randomEdges(puzzle, 8)) {
        puzzle.grid[cell.x][cell.y].dot = 1
      }
      return puzzle
    }
  }, {
    'id': 'pillar-right', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(6, 6, true)
      applyRandomPillarSymmetry(puzzle)

      for (var cell of randomDistinctCells(puzzle, 3)) {
        puzzle.updateCell2(cell.x, cell.y, 'type', 'stone')
        puzzle.updateCell2(cell.x, cell.y, 'color', 'white')
      }
      for (var cell of randomDistinctCells(puzzle, 3)) {
        puzzle.updateCell2(cell.x, cell.y, 'type', 'stone')
        puzzle.updateCell2(cell.x, cell.y, 'color', 'black')
      }
      return puzzle
    }
  }
]

function generatePuzzles(style) {
  for (var style of styles) {
    while (true) {
      var puzzle = style['createPuzzle']()
      var paths = window.solve(puzzle)
      if (paths.length > 0 && paths.length <= style.difficulty) {
        window.draw(puzzle, style.id)
        // TODO: Create solution viewer here. One per puzzle, I think?
        break
      }
    }
  }
}

// Helper functions for RNG, not mimicing the game
// TODO: I can do better here, right? Steal the hashing function from youtube video. Then make a struct with {seed, hardmode, div ID}
function randInt(n) {
  seed = ((seed << 13) ^ seed) - (seed >> 21)
  return Math.abs(seed) % Math.floor(n)
}

function randomElement(list) {
  return list[randInt(list.length)]
}

function randomDistinctCells(puzzle, count) {
  var cells = []
  for (var x=0; x < puzzle.width; x++) {
    for (var y=0; y < puzzle.height; y++) {
      if (x%2 === 1 && y%2 === 1 && puzzle.grid[x][y] == null) cells.push({'x':x, 'y':y})
    }
  }
  
  var randomCells = []
  for (var i=0; i<count; i++) {
    randomCells.push(cells.splice(randInt(cells.length), 1)[0])
  }
  return randomCells
}

function randomEdges(puzzle, count) {
  var edges = []
  for (var x=0; x < puzzle.width; x++) {
    for (var y=0; y < puzzle.height; y++) {
      if (x%2 !== y%2) edges.push({'x':x, 'y':y})
    }
  }
  
  var randomCells = []
  for (var i=0; i<count; i++) {
    randomCells.push(randomElement(edges))
  }
  return randomCells
}

// Helper functions for RNG stolen from the game, for verisimilitude
function randomTriangle() { 
  var rng = randInt(100)
  if (rng >=  0 && rng <= 50) return 1 // 51%
  if (rng >= 51 && rng <= 85) return 2 // 35%
  if (rng >= 86 && rng <= 99) return 3 // 14%
}

function randomPolyomino() {
  var polyshape = null
  var size = randInt(3) + 3

  // The game generates polyshapes by randomly moving right or down until the shape is generated, then randomly rotating the result.
  // We can be a bit more efficient by precomputing the shapes.
  // Note that diagonal inverses (RR vs DD) do not effect the random results, and are thus not pictured nor included.

  if (size === 3) {
    /* RR ###  RD ##
                   # */
    polyshape = randomElement([273, 49])
  } else if (size === 4) {
    /* RRR ####  RRD ###  RDR ##   RDD ##
                       #       ##       #
                                        # */
    polyshape = randomElement([4369, 785, 561, 113])
  } else if (size === 4) {
    /* RRRR #####  RRRD ####  RRDR ###   RRDD ###  RDRR ##    RDRD ##    RDDR ##   RDDD ##   (RRRR does not fit, and is thus not included. TODO: Confirm behavior!)
                           #         ##         #        ###        ##         #         #
                                                #                    #         ##        #
                                                                                         # */
    polyshape = randomElement([12561, 8977, 1809, 1585, 1137, 241])
  }
  return window.rotatePolyshape(polyshape, randInt(4))
}

// TODO: Verify from game
function applyRandomPillarSymmetry(puzzle) {
  var rng = randInt(4)
  if (rng === 0) {
    puzzle.symmetry = {'x': false, 'y': false}
    puzzle.grid[2][12].start = true
    puzzle.grid[8][12].start = true
    puzzle.grid[2][0].end = 'top'
    puzzle.grid[8][0].end = 'top'
  } else if (rng === 1) {
    puzzle.symmetry = {'x': false, 'y': true}
    puzzle.grid[2][12].start = true
    puzzle.grid[8][0].start = true
    puzzle.grid[2][0].end = 'top'
    puzzle.grid[8][12].end = 'bottom'
  } else if (rng === 2) {
    puzzle.symmetry = {'x': true, 'y': false}
    puzzle.grid[2][12].start = true
    puzzle.grid[4][12].start = true
    puzzle.grid[2][0].end = 'top'
    puzzle.grid[4][0].end = 'top'
  } else if (rng === 3) {
    puzzle.symmetry = {'x': true, 'y': true}
    puzzle.grid[2][0].start = true
    puzzle.grid[4][12].start = true
    puzzle.grid[2][12].end = 'bottom'
    puzzle.grid[4][0].end = 'top'
  }
}

})
