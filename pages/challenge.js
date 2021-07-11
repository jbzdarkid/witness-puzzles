namespace(function() {

var seed = 0
var difficulty = 0
var completedPuzzles = []

window.onload = function() {
  var params = new URLSearchParams(window.location.search)
  seed = parseInt(params.get('seed')) || 0
  if (seed === 0) {
    seed = crypto.getRandomValues(new Uint32Array(1))[0]
    params.set('seed', seed)
    window.location.search = params.toString()
    return // Changing window.location triggers a refresh, and we don't want to generate puzzles after doing that!
  }
  if (params.get('difficulty') == 'hard') {
    difficulty = 1
  }
  // TODO: Show record player. This will cover the loading times + also verisimilitude. Yis.
  generatePuzzles() // TODO: Hard mode? Maybe... always hard mode?
  document.getElementById('polyominos').style.display = null
}

// TODO: TRACE_FAILURE_FUNC so I can do rerolls?
window.TRACE_COMPLETION_FUNC = function(puzzle) {
  // TODO: window.setTimeout here... instant disappear is bad!
  completedPuzzles.push(puzzle.name)

  if (completedPuzzles.includes('pillar-left') && completedPuzzles.includes('pillar-right')) {
    // Stop video
    // play fanfare?
  } else if (completedPuzzles.includes('triangles-left') && completedPuzzles.includes('triangles-right')) {
    document.getElementById('triangles-left').style.display = 'none'
    document.getElementById('triangles-right').style.display = 'none'
    document.getElementById('pillar-left').style.display = null
    document.getElementById('pillar-right').style.display = null
  } else if (puzzle.name == 'polyominos') {
    document.getElementById('polyominos').style.display = 'none'
    document.getElementById('triangles-left').style.display = null
    document.getElementById('triangles-right').style.display = null
  }
}

// TODO: Confirm styles via hacking. Make notes here based on old version offsets.
var styles = [
  {
    'id': 'test-triangle-perf', 'difficulty': 0,
    'createPuzzle': function() {
      var puzzle = new Puzzle(5, 5)
      puzzle.grid[0][10].start = true
      puzzle.grid[10][0].end = 'top'

      for (var cell of randomDistinctCells(puzzle, 10)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'triangle', 'color': 'orange', 'count': randomTriangle()}
      }
      return puzzle
    }
  }/*,{
    'id': 'polyominos', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      // TODO: Select a random color
      for (var cell of randomDistinctCells(puzzle, 2)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'poly', 'color': 'yellow', 'polyshape': randomPolyomino()}
      }
      for (var cell of randomDistinctCells(puzzle, 2)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'star', 'color': 'orange'}
      }
      for (var cell of randomEdges(puzzle, 8)) {
        puzzle.grid[cell.x][cell.y].gap = 1
      }
      return puzzle
    }
  }, {
    'id': 'symmetry', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(6, 6)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'
      puzzle.style.symmetry = {'x': true, 'y': true}

      var i = 0
      for (var cell of randomDistinctCorners(puzzle, 6)) {
        if (i < 2) puzzle.grid[cell.x][cell.y].dot = 1
        if (i < 4) puzzle.grid[cell.x][cell.y].dot = 2
        if (i < 6) puzzle.grid[cell.x][cell.y].dot = 3
        i++
      }
      for (var cell of randomEdges(puzzle, 6)) {
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
  }, { // TODO: puzzle.settings.MONOCHROME_SYMMETRY?
    'id': 'pillar-left', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(6, 6, true)
      applyRandomPillarSymmetry(puzzle)

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
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
      }
      for (var cell of randomDistinctCells(puzzle, 3)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'black'}
      }
      return puzzle
    }
  }
]

function generatePuzzles(style) {
  completedPuzzles = [] // Reset the solved puzzle list
  for (var style of styles) { // TODO: Make async because pillars are slow?
    for (var i=0; i<10000; i++) {
      var puzzle = style['createPuzzle']()
      var paths = window.solve(puzzle)
      if ((paths.length > 0 && paths.length <= style.difficulty) || i === 9999) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.id = style.id
        svg.style = 'pointer-events: auto' // TODO: Do I need this? If yes, move into draw(). If no, scourge.
        document.getElementById('challenge').appendChild(svg)

        window.draw(puzzle, style.id)
        puzzle.name = style.id
        document.getElementById(style.id).style.display = 'none'
        // TODO: Create solution viewer here. One per puzzle, I think?
        break
      }
    }
  }
}

// Helper functions for RNG, not mimicing the game
function randomElement(list) {
  return list[randInt(list.length)]
}

function randInt(n) {
  seed += 1
  var rng = squirrel3(seed)
  rng = squirrel3(rng + difficulty)
  return rng % Math.floor(n)
}

// Credit https://youtu.be/LWFzPP8ZbdU (Squirrel Eiserloh, GDC 2017)
function squirrel3(data) {
  data = (data * 0xB5297A4D) & 0xFFFFFFFF
  data = (data ^ data >> 8)
  data = (data * 0x68E31DA4) & 0xFFFFFFFF
  data = (data ^ data << 8)  & 0xFFFFFFFF
  data = (data * 0x1B56C4E9) & 0xFFFFFFFF
  data = (data ^ data >> 8)
  return data
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
  } else if (size === 5) {
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
