namespace(function() {

var seed = 0
var difficulty = 0

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
    difficulty = 1 // TODO: Hard mode? Maybe... always hard mode?
  }
}

function ytMessage(func) {
  return // TODO: This feels gross. Is there a cleaner way of doing this that doesn't involve loading scripts into my namespace? Or maybe an explicit button, so users can consent to giving info to google.
  var msg = {event:'command', func:func}
  var win = document.getElementById('player-iframe').contentWindow
  win.postMessage(JSON.stringify(msg), 'https://www.youtube.com')
}

// TODO: Confirm styles via hacking. Make notes here based on old version offsets.
var styles = [
  {
    'id': 'easy-maze', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(3, 3)
      puzzle.grid[0][6].start = true
      puzzle.grid[6][0].end = 'top'

      cutRandomEdges(puzzle, 10, window.GAP_BREAK) // Or something.
      return puzzle
    }
  }, {
    'id': 'scramble-stars', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      // TODO: Select a random color
      for (var cell of randomDistinctCells(puzzle, 4)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'star', 'color': 'yellow'}
      }
      cutRandomEdges(puzzle, 8, window.GAP_BREAK)
      placeRandomDots(puzzle, 4, window.DOT_BLACK)
      return puzzle
    }
  }, {
    'id': 'scramble-maze', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(7, 7)
      puzzle.grid[0][14].start = true
      puzzle.grid[14][0].end = 'top'

      cutRandomEdges(puzzle, 20, window.GAP_BREAK)
      return puzzle
    }
  }, {
    'id': 'scramble-polyominos', 'difficulty': 9999,
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
      cutRandomEdges(puzzle, 8, window.GAP_BREAK)
      return puzzle
    }
  }, {
    'id': 'scramble-symmetry', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(6, 6)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'
      puzzle.symmetry = {'x': true, 'y': true}

      placeRandomDots(puzzle, 2, window.DOT_BLACK)
      placeRandomDots(puzzle, 2, window.DOT_BLUE)
      placeRandomDots(puzzle, 2, window.DOT_YELLOW)
      cutRandomEdges(puzzle, 6, window.GAP_BREAK)
      return puzzle
    }
  }, {
    'id': 'triple-twocolor-0', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      for (var cell of randomDistinctCells(puzzle, 6)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
      }
      for (var cell of randomDistinctCells(puzzle, 6)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'black'}
      }
      return puzzle
    }
  }, {
    'id': 'triple-twocolor-1', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      for (var cell of randomDistinctCells(puzzle, 6)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
      }
      for (var cell of randomDistinctCells(puzzle, 6)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'black'}
      }
      return puzzle
    }
  }, {
    'id': 'triple-twocolor-2', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      for (var cell of randomDistinctCells(puzzle, 6)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
      }
      for (var cell of randomDistinctCells(puzzle, 6)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'black'}
      }
      return puzzle
    }
  }, {
    'id': 'triple-threecolor-0', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      for (var cell of randomDistinctCells(puzzle, 5)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
      }
      for (var cell of randomDistinctCells(puzzle, 2)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'purple'}
      }
      for (var cell of randomDistinctCells(puzzle, 2)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'green'}
      }
      return puzzle
    }
  }, {
    'id': 'triple-threecolor-1', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      for (var cell of randomDistinctCells(puzzle, 5)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
      }
      for (var cell of randomDistinctCells(puzzle, 2)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'purple'}
      }
      for (var cell of randomDistinctCells(puzzle, 2)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'green'}
      }
      return puzzle
    }
  }, {
    'id': 'triple-threecolor-2', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(4, 4)
      puzzle.grid[0][8].start = true
      puzzle.grid[8][0].end = 'top'

      for (var cell of randomDistinctCells(puzzle, 5)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
      }
      for (var cell of randomDistinctCells(puzzle, 2)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'purple'}
      }
      for (var cell of randomDistinctCells(puzzle, 2)) {
        puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'green'}
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
      // TODO: puzzle.settings.MONOCHROME_SYMMETRY?
      applyRandomPillarSymmetry(puzzle)

      placeRandomDots(puzzle, 8, window.DOT_BLACK, true)
      return puzzle
    }
  }, {
    'id': 'pillar-right', 'difficulty': 9999,
    'createPuzzle': function() {
      var puzzle = new Puzzle(6, 6, true)
      // TODO: puzzle.settings.MONOCHROME_SYMMETRY?
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

function hide(id) {
  var elem = document.getElementById(id)
  if (elem == null) throw Error('Could not find element with id ' + id)
  elem.style.display = 'none'
}
function show(id) {
  var elem = document.getElementById(id)
  if (elem == null) throw Error('Could not find element with id ' + id)
  elem.style.display = null
}

var completedPuzzles = []
var scrambleOrder = []
window.generatePuzzles = function(style) {
  for (var puzzle of completedPuzzles) hide(puzzle)
  completedPuzzles = []
  scrambleOrder = shuffle(['scramble-stars', 'scramble-maze', 'scramble-polyominos', 'scramble-symmetry'])
  var possibleTriples = ['triple-twocolor-' + randInt(3), 'triple-threecolor-' + randInt(3)]
  document.getElementById('start').disabled = true
  document.getElementById('start').innerText = 'New challenge'
  var challenge = document.getElementById('challenge')
  while (challenge.firstChild) challenge.removeChild(challenge.firstChild)
  
  for (var style of styles) { // TODO: Make async because pillars are slow?
    //window.setTimeout(function() {
      for (var i=0; i<100; i++) {
        var puzzle = style['createPuzzle']()
        var paths = window.solve(puzzle)
        
        var isSolvable = (paths.length > 0 && paths.length <= style.difficulty)
        // Invert solvability for impossible triple panels
        if (style.id.startsWith('triple') && !possibleTriples.includes(style.id)) isSolvable = !isSolvable
        if (style.id.startsWith('triple') && puzzleHasInvalidTriple(puzzle)) continue

        // Hack! Create dummy puzzles when unsolvable
        if (!isSolvable && i == 9) {
          puzzle = new Puzzle(1, 0)
          puzzle.grid[0][0].start = true
          puzzle.grid[2][0].end = 'right'
          paths = window.solve(puzzle)
          isSolvable = true
        }
        
        if (isSolvable) {
          var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          svg.id = style.id
          svg.style = 'pointer-events: auto' // TODO: Do I need this? If yes, move into draw(). If no, scourge.
          challenge.appendChild(svg)

          window.draw(puzzle, style.id)
          puzzle.name = style.id
          if (style.id == 'easy-maze') {
            // Once the first puzzle loads, start the challenge. See how this feels.
            show(style.id)
            document.getElementById('start').disabled = false
            // ytMessage('seekTo')
            ytMessage('playVideo')
          } else {
            if (style.id.startsWith('triple')) {
              var svg = document.getElementById(style.id)
              // A rectangle which covers the entire panel, used to animate panel "power on"
              var panelCover = window.createElement('rect')
              panelCover.setAttribute('width', svg.style.width)
              panelCover.setAttribute('height', svg.style.height)
              panelCover.setAttribute('opacity', 1)
              panelCover.setAttribute('style', 'pointer-events: none')
              panelCover.setAttribute('id', style.id + '-cover')
              svg.appendChild(panelCover)
            }
            hide(style.id)
          }
          // TODO: Create solution viewer here. One per puzzle, I think?
          break
        }
      }
    //}, 0)
  }
}

// TODO: TRACE_FAILURE_FUNC so I can do rerolls?
window.TRACE_COMPLETION_FUNC = function(puzzle) {
  // TODO: More elegance with power-on? At least for triples, we need placeholders otherwise it's gonna jump around
  completedPuzzles.push(puzzle.name)

  window.setTimeout(function() {
    if (puzzle.name == 'easy-maze') {
      hide('easy-maze')
      show(scrambleOrder.pop())
    } else if (puzzle.name.startsWith('scramble')) {
      hide(puzzle.name)
      if (scrambleOrder.length > 0) {
        show(scrambleOrder.pop())
      } else {
        show('triple-twocolor-0'); show('triple-twocolor-1'); show('triple-twocolor-2')
        // TODO: Verify order
        // TODO: Verify power-on delays
        // TODO: Verify power on duration.
        // TODO: Play power on sound?
        document.getElementById('triple-twocolor-1-cover').style.animation = 'turnOn 1.5s linear 0s 1 forwards'
        document.getElementById('triple-twocolor-0-cover').style.animation = 'turnOn 1.5s linear 2s 1 forwards'
        document.getElementById('triple-twocolor-2-cover').style.animation = 'turnOn 1.5s linear 4s 1 forwards'
      }
    } else if (puzzle.name.startsWith('triple-twocolor')) {
      hide('triple-twocolor-0'); hide('triple-twocolor-1'); hide('triple-twocolor-2')
      show('triple-threecolor-0'); show('triple-threecolor-1'); show('triple-threecolor-2')
      document.getElementById('triple-threecolor-1-cover').style.animation = 'turnOn 1.5s linear 0s 1 forwards'
      document.getElementById('triple-threecolor-2-cover').style.animation = 'turnOn 1.5s linear 2s 1 forwards'
      document.getElementById('triple-threecolor-0-cover').style.animation = 'turnOn 1.5s linear 4s 1 forwards'
    } else if (puzzle.name.startsWith('triple-threecolor')) {
      hide('triple-threecolor-0'); hide('triple-threecolor-1'); hide('triple-threecolor-2')
      show('triangles-left'); show('triangles-right')
    } else if (puzzle.name.startsWith('triangles') && completedPuzzles.includes('triangles-left') && completedPuzzles.includes('triangles-right')) {
      hide('triangles-left'); hide('triangles-right')
      show('pillar-left'); show('pillar-right')
    } else if (puzzle.name.startsWith('pillar') && completedPuzzles.includes('pillar-left') && completedPuzzles.includes('pillar-right')) {
      ytMessage('pauseVideo')
      // Play fanfare? Show time?
    }
  }, 2000)
}

// Helper functions for RNG, not mimicing the game
function getRandomElement(list) {
  return list[randInt(list.length)]
}

function popRandomElement(list) {
  return list.splice(randInt(list.length), 1)[0]
}

function shuffle(list) {
  for (var i=list.length-1; i>0; i--) { // Knuth randomization
    var j = randInt(i)
    var tmp = list[j]
    list[j] = list[i]
    list[i] = tmp
  }
  return list
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
    randomCells.push(popRandomElement(cells))
  }
  return randomCells
}

// Cut edges (allowing overlaps)
function cutRandomEdges(puzzle, count, gapType) {
  var cells = []
  for (var x=0; x < puzzle.width; x++) {
    for (var y=0; y < puzzle.height; y++) {
      if (x%2 !== y%2 && puzzle.grid[x][y].gap == null) cells.push({'x':x, 'y':y})
    }
  }
  
  for (var i=0; i<count; i++) {
    var cell = getRandomElement(cells)
    puzzle.grid[cell.x][cell.y].gap = gapType
  }
}

// Place dots (no overlaps)
function placeRandomDots(puzzle, count, dotColor, onEdge) {
  var cells = []
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      if ((onEdge === false && x%2 === y%2) || (onEdge !== false && x%2 === 0 && y%2 === 0)) {
        if (puzzle.grid[x][y].dot == null) cells.push({'x':x, 'y':y})
      }
    }
  }

  for (var i=0; i<count; i++) {
    var cell = popRandomElement(cells)
    puzzle.grid[cell.x][cell.y].dot = dotColor
  }
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
    polyshape = getRandomElement([273, 49])
  } else if (size === 4) {
    /* RRR ####  RRD ###  RDR ##   RDD ##
                       #       ##       #
                                        # */
    polyshape = getRandomElement([4369, 785, 561, 113])
  } else if (size === 5) {
    /* RRRR #####  RRRD ####  RRDR ###   RRDD ###  RDRR ##    RDRD ##    RDDR ##   RDDD ##   (RRRR does not fit, and is thus not included. TODO: Confirm behavior!)
                           #         ##         #        ###        ##         #         #
                                                #                    #         ##        #
                                                                                         # */
    polyshape = getRandomElement([12561, 8977, 1809, 1585, 1137, 241])
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

function puzzleHasInvalidTriple(puzzle) {
  function getColorFlag(puzzle, x, y) {
    var cell = puzzle.grid[x][y]
    if (cell == null) return 0
    if (cell.color == 'white')  return 1
    if (cell.color == 'purple') return 2
    if (cell.color == 'green')  return 4
  }

  for (var x=1; x<puzzle.width-3; x+=2) {
    for (var y=1; y<puzzle.height-3; y+=2) {
      var colors = 0
      colors |= getColorFlag(puzzle, x, y)
      colors |= getColorFlag(puzzle, x, y+2)
      colors |= getColorFlag(puzzle, x+2, y)
      colors |= getColorFlag(puzzle, x+2, y+2)
      if (colors === 7) return true
    }
  }
  return false
}

})
