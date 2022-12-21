namespace(function() {

var seed = 0
var difficulty = 0
var puzzle = null

window.onload = function() {
  var params = new URLSearchParams(window.location.search)
  seed = parseInt(params.get('seed')) || 0
  if (seed === 0) {
    seed = crypto.getRandomValues(new Uint32Array(1))[0]
    params.set('seed', seed)
    window.location.search = params.toString()
    return // Changing window.location triggers a refresh, so we're all done here.
  }
  if (params.get('difficulty') == 'hard') {
    difficulty = 1 // TODO: Hard mode? Maybe... always hard mode?
  }
  puzzle = params.get('puzzle') // null if not present
  if (styles[puzzle] == null) puzzle = null // Check for invalid puzzle name

  var challenge = document.getElementById('challenge')
  for (var styleName in styles) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = styleName
    // TODO: Do I need pointer-events? If yes, move into draw() [and scourge]. If no, just scourge.
    svg.style = 'pointer-events: auto; opacity: none'
    challenge.appendChild(svg)
    // TODO: This should be a loading icon, which gets overwritten by the actual puzzle.
  }
}

var styles = {
  'easy-maze': function() {
    var puzzle = new Puzzle(3, 3)
    puzzle.grid[0][6].start = true
    puzzle.grid[6][0].end = 'top'

    cutRandomEdges(puzzle, 9)
    return puzzle
  },
  'hard-maze': largeMaze,
  'stones': function() {
    var puzzle = new Puzzle(4, 4)
    puzzle.grid[0][8].start = true
    puzzle.grid[8][0].end = 'top'

    for (var cell of randomNonEmptyCells(puzzle, 7)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
    }
    for (var cell of randomNonEmptyCells(puzzle, 4)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'black'}
    }
    cutRandomEdges(puzzle, 5)
    return puzzle
  }, 'scramble-polyominos': function() {
    var puzzle = new Puzzle(4, 4)
    puzzle.grid[0][8].start = true
    puzzle.grid[8][0].end = 'top'

    // TODO: Not working!
    var colors = shuffle(['0x052812', '0xFFC17A', '0xA4C34F', '0xB52EBD', '0x99EC35'])
    while (true) {
      var cells = randomEmptyCells(puzzle, 2)
      var manhattanDistance = Math.abs(cells[0].x - cells[1].x) + Math.abs(cells[0].y - cells[1].y)
      if (manhattanDistance >= 6) break
    }
    puzzle.grid[cells[0].x][cells[0].y] = {'type': 'star', 'color': colors[0]}
    puzzle.grid[cells[1].x][cells[1].y] = {'type': 'star', 'color': colors[0]}

    for (var cell of randomEmptyCells(puzzle, 2)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'poly', 'color': colors[1], 'polyshape': randomPolyomino()}
    }
    cutRandomEdges(puzzle, 8)
    return puzzle
  }, 'scramble-stars': function() {
    var puzzle = new Puzzle(4, 4)
    puzzle.grid[0][8].start = true
    puzzle.grid[8][0].end = 'top'

    for (var cell of randomEmptyCells(puzzle, 4)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'star', 'color': 'green'}
    }
    cutRandomEdges(puzzle, 8)
    placeRandomCornerDots(puzzle, 4, window.DOT_BLACK)
    return puzzle
  }, 'scramble-symmetry': function() {
    var puzzle = new Puzzle(6, 6)
    puzzle.grid[0][0].start = true
    puzzle.grid[12][12].start = true
    puzzle.grid[12][0].end = 'right'
    puzzle.grid[0][12].end = 'left'
    puzzle.symmetry = {'x': true, 'y': true}

    cutRandomEdges(puzzle, 6)
    placeRandomCornerDots(puzzle, 2, window.DOT_BLUE)
    placeRandomCornerDots(puzzle, 2, window.DOT_YELLOW)
    placeRandomCornerDots(puzzle, 2, window.DOT_BLACK)
    return puzzle
  },
  'scramble-maze': largeMaze,
  'triple-twocolor-0': tripleTwoColor,
  'triple-twocolor-1': tripleTwoColor,
  'triple-twocolor-2': tripleTwoColor,
  'triple-threecolor-0': tripleThreeColor,
  'triple-threecolor-1': tripleThreeColor,
  'triple-threecolor-2': tripleThreeColor,
  'triangle-left': function() {return triangles(6)},
  'triangle-right': function() {return triangles(8)},
  'pillar-left': function() {
    var puzzle = new Puzzle(6, 6, true)
    // TODO: puzzle.settings.MONOCHROME_SYMMETRY?
    applyRandomPillarSymmetry(puzzle, leftPillarSymmetry)

    for (var i=0; i<8; i++) {
      var horiz = randInt(2)
      var cell = getCells(puzzle, getRandomElement, 1, function(x, y) {
        return (x%2 === horiz && y%2 === 1 - horiz && puzzle.grid[x][y].dot == null)
      })[0]
      puzzle.grid[cell.x][cell.y].dot = window.DOT_BLACK
    }
    return puzzle
  }, 'pillar-right': function() {
    var puzzle = new Puzzle(6, 6, true)
    // TODO: puzzle.settings.MONOCHROME_SYMMETRY?
    applyRandomPillarSymmetry(puzzle, rightPillarSymmetry)

    for (var cell of randomEmptyCells(puzzle, 3)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
    }
    for (var cell of randomEmptyCells(puzzle, 3)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'black'}
    }
    return puzzle
  }
}

// Some style functions, separated out to avoid duplication
function largeMaze() {
  var puzzle = new Puzzle(7, 7)
  puzzle.grid[0][14].start = true
  puzzle.grid[14][0].end = 'top'
  
  cutRandomEdges(puzzle, 57)
  return puzzle
}

function tripleTwoColor() {
  var puzzle = new Puzzle(4, 4)
  puzzle.grid[0][8].start = true
  puzzle.grid[8][0].end = 'top'

  for (var cell of randomEmptyCells(puzzle, 6)) {
    puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
  }
  for (var cell of randomEmptyCells(puzzle, 6)) {
    puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'black'}
  }
  return puzzle
}

function tripleThreeColor() {
  var puzzle = new Puzzle(4, 4)
  puzzle.grid[0][8].start = true
  puzzle.grid[8][0].end = 'top'

  for (var cell of randomEmptyCells(puzzle, 5)) {
    puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
  }
  for (var cell of randomEmptyCells(puzzle, 2)) {
    puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'purple'}
  }
  for (var cell of randomEmptyCells(puzzle, 2)) {
    puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'green'}
  }
  return puzzle
}

function triangles(count) {
  var puzzle = new Puzzle(4, 4)
  puzzle.grid[0][8].start = true
  puzzle.grid[8][0].end = 'top'

  for (var cell of randomEmptyCells(puzzle, count)) {
    puzzle.grid[cell.x][cell.y] = {'type': 'triangle', 'color': 'orange', 'count': randomTriangle()}
  }
  return puzzle
}

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
var possibleTriples = []
var leftPillarSymmetry = 0
var rightPillarSymmetry = 0
window.generatePuzzles = function(style) {
  // TODO: Set URL seed according to actual value. TODO: location.hash time?
  completedPuzzles = []
  scrambleOrder = shuffle(['scramble-stars', 'scramble-maze', 'scramble-polyominos', 'scramble-symmetry'])
  possibleTriples = ['triple-twocolor-' + randInt(3), 'triple-threecolor-' + randInt(3)]
  leftPillarSymmetry = randInt(4)
  rightPillarSymmetry = randInt(4)

  document.getElementById('start').disabled = true
  document.getElementById('start').innerText = 'Generating...'

  setLogLevel('error') // window.solve and window.draw produce an unfortunate amount of spam. This is obviously my fault.

  /* TODO: Progress bar while generating
    var solveAuto = document.createElement('button')
  parent.appendChild(solveAuto)
  solveAuto.id = 'solveAuto'
  solveAuto.innerText = 'Solve (automatically)'
  solveAuto.onpointerdown = solvePuzzle
  solveAuto.style = 'margin-right: 8px'

  var div = document.createElement('div')
  parent.appendChild(div)
  div.style = 'display: inline-block; vertical-align:top'

  var progressBox = document.createElement('div')
  div.appendChild(progressBox)
  progressBox.id = 'progressBox'
  progressBox.style = 'display: none; width: 220px; border: 1px solid black; margin-top: 2px'

  var progressPercent = document.createElement('label')
  progressBox.appendChild(progressPercent)
  progressPercent.id = 'progressPercent'
  progressPercent.style = 'float: left; margin-left: 4px'
  progressPercent.innerText = '0%'

  var progress = document.createElement('div')
  progressBox.appendChild(progress)
  progress.id = 'progress'
  progress.style = 'z-index: -1; height: 38px; width: 0%; background-color: #390'
  */


  var styleKeys = []
  if (puzzle != null) {
    puzzle.split(',')
  } else {
    styleKeys = Object.keys(styles)
  }

  var generateNextPuzzle = function() {
    if (styleKeys.length === 0) {
      setLogLevel('info')
      console.info('All done!')
      // document.getElementById('start').disabled = false
      document.getElementById('start').innerText = 'Generated'
      return
    }
    
    var styleName = styleKeys.pop()
    hide(styleName)
    generatePuzzleAsync(styleName, 100, generateNextPuzzle)
  }
  generateNextPuzzle()
}

function generatePuzzleAsync(styleName, attempts, generateNextPuzzle) {
  if (attempts === 0) {
    // This is not great -- but we'd rather have a failure state than run forever.
    puzzle = new Puzzle(1, 0)
    puzzle.grid[0][0].start = true
    puzzle.grid[2][0].end = 'right'
    window.draw(puzzle, styleName)
    console.error('Failed to generate a random puzzle for ' + styleName)
    generateNextPuzzle()
  }

  var puzzle = styles[styleName]()

  // Not allowed for solvable *or* unsolvable triples.
  if (styleName.startsWith('triple') && puzzleHasInvalidTriple(puzzle)) {
    generatePuzzleAsync(styleName, attempts, generateNextPuzzle) // No need to modify the iteration count, this check is very cheap.
    return
  }

  window.solve(puzzle, null, function(paths) {
    var isSolvable = (paths.length > 0) // TODO: Difficulty...?
    
    // Invert solvability for impossible triple panels
    if (styleName.startsWith('triple') && !possibleTriples.includes(styleName)) isSolvable = !isSolvable

    if (!isSolvable) {
      generatePuzzleAsync(styleName, attempts-1, generateNextPuzzle)
      return
    }

    window.draw(puzzle, styleName)
    puzzle.name = styleName
    if (styleName == 'easy-maze') {
      show(styleName)
    } else if (styleName.startsWith('triple')) {
      // Add a cover to the triple panels, so that they can power on in sequence.
      // TODO: pointer-events none is only ok at the end, though?
      var svg = document.getElementById(styleName)
      var panelCover = window.createElement('rect')
      panelCover.setAttribute('width', svg.style.width)
      panelCover.setAttribute('height', svg.style.height)
      panelCover.setAttribute('opacity', 1)
      panelCover.setAttribute('style', 'pointer-events: none')
      panelCover.setAttribute('id', styleName + '-cover')
      svg.appendChild(panelCover)
    }
    
    // TODO: Create solution viewer here. One per puzzle.
    generateNextPuzzle()
  })
}

// TODO: TRACE_FAILURE_FUNC so I can do rerolls?
// TODO: Ok so this is cute and all but the point is so people can *practice* these puzzles. So, like, stoppit.
window.TRACE_COMPLETION_FUNC = function(puzzle) {
  completedPuzzles.push(puzzle.name)

  window.setTimeout(function() {
    if (puzzle.name == 'easy-maze') {
      hide('easy-maze')
      show('hard-maze')
    } else if (puzzle.name == 'hard-maze') {
      hide('hard-maze')
      show('stones')
    } else if (puzzle.name == 'stones') {
      hide('stones')
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
      show('triangle-left'); show('triangle-right')
    } else if (puzzle.name.startsWith('triangle') && completedPuzzles.includes('triangle-left') && completedPuzzles.includes('triangle-right')) {
      hide('triangle-left'); hide('triangle-right')
      show('pillar-left'); show('pillar-right')
    } else if (puzzle.name.startsWith('pillar') && completedPuzzles.includes('pillar-left') && completedPuzzles.includes('pillar-right')) {
      ytMessage('pauseVideo')
      // TODO: Fanfare?
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

function getCells(puzzle, getter, count, filter) {
  var cells = []
  for (var x=0; x<puzzle.width; x++) {
    for (var y=0; y<puzzle.height; y++) {
      if (filter(x, y)) cells.push({'x':x, 'y':y})
    }
  }
  var output = []
  for (var i=0; i<count; i++) output.push(getter(cells))
  return output
}

function randomEmptyCells(puzzle, count) {
  return getCells(puzzle, popRandomElement, count, function(x, y) {
    return (x%2 === 1 && y%2 === 1 && puzzle.grid[x][y] == null)
  })
}

function randomNonEmptyCells(puzzle, count) {
  return getCells(puzzle, getRandomElement, count, function(x, y) {
    return (x%2 === 1 && y%2 === 1)
  })
}

function cutRandomEdges(puzzle, count) {
  var cells = getCells(puzzle, getRandomElement, count, function(x, y) {
    return (x%2 !== y%2)
  })
  for (var cell of cells) puzzle.grid[cell.x][cell.y].gap = window.GAP_BREAK
}

function placeRandomCornerDots(puzzle, count, dotColor) {
  var cells = getCells(puzzle, popRandomElement, count, function(x, y) {
    return (x%2 === 0 && y%2 === 0 && puzzle.grid[x][y].dot == null)
  })
  for (var cell of cells) puzzle.grid[cell.x][cell.y].dot = dotColor
}

function placeRandomEdgeDots(puzzle, count, dotColor) {
  var cells = getCells(puzzle, popRandomElement, count, function(x, y) {
    return (x%2 !== y%2 && puzzle.grid[x][y].dot == null)
  })
  for (var cell of cells) puzzle.grid[cell.x][cell.y].dot = dotColor
}

// Helper functions for RNG stolen from the game, for verisimilitude
function randomTriangle() {
  var rng = randInt(100)
  if (rng >=  0 && rng <= 50) return 1 // 51%
  if (rng >= 51 && rng <= 85) return 2 // 35%
  if (rng >= 86 && rng <= 99) return 3 // 14%
}

function randomPolyomino() {
  // The game generates polyshapes by randomly moving right or down until the shape is generated, then randomly rotating the result.
  // We can be a bit more efficient by precomputing the shapes.
  // Note that diagonal inverses (RR vs DD) do not effect the random results, and are thus not pictured nor included.

  var polyshape = null
  var size = randInt(3) + 3
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

function applyRandomPillarSymmetry(puzzle, rng) {
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
  // Much faster: One single pass to convert cells -> colors (and splash them outwards, if I'm really bored).
  // Then do a second pass to check if any 2x2 has the right colors.
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
