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

function ytMessage(func) {
  return // TODO: This feels gross. Is there a cleaner way of doing this that doesn't involve loading scripts into my namespace? Or maybe an explicit button, so users can consent to giving info to google.
  var msg = {event:'command', func:func}
  var win = document.getElementById('player-iframe').contentWindow
  win.postMessage(JSON.stringify(msg), 'https://www.youtube.com')
}

// TODO: Confirm styles via hacking. Make notes here based on old version offsets.
var styles = {
  'easy-maze': function() {
    var puzzle = new Puzzle(3, 3)
    puzzle.grid[0][6].start = true
    puzzle.grid[6][0].end = 'top'

    cutRandomEdges(puzzle, 10, window.GAP_BREAK) // Or something.
    return puzzle
  }, 'scramble-stars': function() {
    var puzzle = new Puzzle(4, 4)
    puzzle.grid[0][8].start = true
    puzzle.grid[8][0].end = 'top'

    // TODO: Select a random color
    for (var cell of randomEmptyCells(puzzle, 4)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'star', 'color': 'yellow'}
    }
    cutRandomEdges(puzzle, 8, window.GAP_BREAK)
    placeRandomCornerDots(puzzle, 4, window.DOT_BLACK)
    return puzzle
  }, 'scramble-maze': function() {
    var puzzle = new Puzzle(7, 7)
    puzzle.grid[0][14].start = true
    puzzle.grid[14][0].end = 'top'

    cutRandomEdges(puzzle, 20, window.GAP_BREAK)
    return puzzle
  }, 'scramble-polyominos': function() {
    var puzzle = new Puzzle(4, 4)
    puzzle.grid[0][8].start = true
    puzzle.grid[8][0].end = 'top'

    // TODO: Select a random color
    for (var cell of randomEmptyCells(puzzle, 2)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'poly', 'color': 'yellow', 'polyshape': randomPolyomino()}
    }
    for (var cell of randomEmptyCells(puzzle, 2)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'star', 'color': 'orange'}
    }
    cutRandomEdges(puzzle, 8, window.GAP_BREAK)
    return puzzle
  }, 'scramble-symmetry': function() {
    var puzzle = new Puzzle(6, 6)
    puzzle.grid[0][0].start = true
    puzzle.grid[12][12].start = true
    puzzle.grid[12][0].end = 'right'
    puzzle.grid[0][12].end = 'left'
    puzzle.symmetry = {'x': true, 'y': true}

    placeRandomCornerDots(puzzle, 2, window.DOT_BLACK)
    placeRandomCornerDots(puzzle, 2, window.DOT_BLUE)
    placeRandomCornerDots(puzzle, 2, window.DOT_YELLOW)
    cutRandomEdges(puzzle, 6, window.GAP_BREAK)
    return puzzle
  }, 'triple-twocolor-0': tripleTwoColor,
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
    applyRandomPillarSymmetry(puzzle)

    placeRandomEdgeDots(puzzle, 8, window.DOT_BLACK, true)
    return puzzle
  }, 'pillar-right': function() {
    var puzzle = new Puzzle(6, 6, true)
    // TODO: puzzle.settings.MONOCHROME_SYMMETRY?
    applyRandomPillarSymmetry(puzzle)

    for (var cell of randomEmptyCells(puzzle, 3)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'white'}
    }
    for (var cell of randomEmptyCells(puzzle, 3)) {
      puzzle.grid[cell.x][cell.y] = {'type': 'square', 'color': 'black'}
    }
    return puzzle
  }
}

// Some functions separated out to avoid duplication
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
window.generatePuzzles = function(style) {
  // TODO: Set URL seed according to actual value. TODO: location.hash time?
  completedPuzzles = []
  scrambleOrder = shuffle(['scramble-stars', 'scramble-maze', 'scramble-polyominos', 'scramble-symmetry'])
  possibleTriples = ['triple-twocolor-' + randInt(3), 'triple-threecolor-' + randInt(3)]

  document.getElementById('start').disabled = true
  document.getElementById('start').innerText = 'Generating...'

  setLogLevel('error') // window.solve and window.draw produce an unfortunate amount of spam.

  var styleKeys = Object.keys(styles)

  var onComplete = function() {
    if (styleKeys.length === 0) {
      setLogLevel('info')
      console.info('All done!')
      // TODO: How does this music timing feel?
      document.getElementById('start').disabled = false
      document.getElementById('start').innerText = 'Reroll'
      // ytMessage('seekTo')
      // ytMessage('playVideo')
      return
    }
    
    var styleName = styleKeys.pop()
    hide(styleName)
    generatePuzzleAsync(styleName, 100, onComplete)
  }
  onComplete()
}

function generatePuzzleAsync(styleName, i, onComplete) {
  if (i === 0) {
    // Hack! Bug! Create dummy puzzles when unsolvable
    puzzle = new Puzzle(1, 0)
    puzzle.grid[0][0].start = true
    puzzle.grid[2][0].end = 'right'
    window.draw(puzzle, styleName)
    console.error('Failed to generate a random puzzle for ' + styleName)
    onComplete()
  }

  var puzzle = styles[styleName]()

  // Not allowed for solvable *or* unsolvable triples.
  if (styleName.startsWith('triple') && puzzleHasInvalidTriple(puzzle)) {
    generatePuzzleAsync(styleName, i, onComplete) // No need to modify the iteration count, this check is very cheap.
    return
  }

  window.solve(puzzle, null, function(paths) {
    var isSolvable = (paths.length > 0) // TODO: Difficulty...?
    
    // Invert solvability for impossible triple panels
    if (styleName.startsWith('triple') && !possibleTriples.includes(styleName)) isSolvable = !isSolvable

    if (!isSolvable) {
      generatePuzzleAsync(styleName, i-1, onComplete)
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
    onComplete()
  })
}

// TODO: TRACE_FAILURE_FUNC so I can do rerolls?
// TODO: Ok so this is cute and all but the point is so people can *practice* these puzzles. So, like, stoppit.
window.TRACE_COMPLETION_FUNC = function(puzzle) {
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
      show('triangle-left'); show('triangle-right')
    } else if (puzzle.name.startsWith('triangle') && completedPuzzles.includes('triangle-left') && completedPuzzles.includes('triangle-right')) {
      hide('triangle-left'); hide('triangle-right')
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

function cutRandomEdges(puzzle, count, gapType) {
  var cells = getCells(puzzle, getRandomElement, count, function(x, y) {
    return (x%2 !== y%2 && puzzle.grid[x][y].gap == null)
  })
  for (var cell of cells) puzzle.grid[cell.x][cell.y].gap = gapType
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
