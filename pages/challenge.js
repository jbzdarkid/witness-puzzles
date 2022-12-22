namespace(function() {

var seed = 0
var unique = false

window.onload = function() {
  var params = new URLSearchParams(window.location.search)
  seed = parseInt(params.get('seed')) || 0
  if (seed === 0) {
    seed = crypto.getRandomValues(new Uint32Array(1))[0]
    params.set('seed', seed)
    window.location.search = params.toString()
    return // Changing window.location triggers a refresh, so we're all done here.
  }

  // Create svgs for all of the puzzles, regardless of style
  var puzzles = document.getElementById('puzzles')
  var solutions = document.getElementById('solutions')
  for (var styleName in styles) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = styleName
    // TODO: Do I need pointer-events? If yes, move into draw() [and scourge]. If no, just scourge.
    // This might only be needed on editor.js? Not sure...
    svg.style = 'pointer-events: auto; opacity: none'
    puzzles.appendChild(svg)

    var solutionViewer = document.createElement('div')
    solutionViewer.id = styleName + '-solutionViewer'
    solutionViewer.style = 'display: none'
    solutions.appendChild(solutionViewer)

    var previousSolution = document.createElement('button')
    previousSolution.id = styleName + '-previousSolution'
    previousSolution.innerHTML = '&larr;'
    solutionViewer.appendChild(previousSolution)

    var solutionCount = document.createElement('label')
    solutionCount.id = styleName + '-solutionCount'
    solutionCount.style = 'padding: 6px'
    solutionViewer.appendChild(solutionCount)

    var nextSolution = document.createElement('button')
    nextSolution.id = styleName + '-nextSolution'
    nextSolution.innerHTML = '&rarr;'
    solutionViewer.appendChild(nextSolution)
  }

  var scene = location.hash
  if (scene != '') {
    var challengeType = document.getElementById('challengeType')
    challengeType.value = scene
  }

  unique = (params.get('difficulty') == 'hard')
  generate()
}

function show(id, coverOpacity, coverAnimation) {
  var elem = document.getElementById(id)
  if (elem == null) throw Error('Could not find element with id ' + id)
  elem.style.display = null

  var cover = document.getElementById(id + '-cover')
  if (cover != null) cover.setAttribute('opacity', coverOpacity)
  if (cover != null && coverAnimation != null) cover.style.animation = coverAnimation
}

window.showScene = function(scene) {
  // Hide all puzzles
  for (var style in styles) document.getElementById(style).style.display = 'none'

  if (scene == 'full' || scene == 'intro') {
    show('easy-maze', 0)
    show('hard-maze', 1)
    show('stones', 1)
  } else if (scene == 'scramble-polyominos') {
    show('scramble-polyominos', 0)
  } else if (scene == 'scramble-stars') {
    show('scramble-stars', 0)
  } else if (scene == 'scramble-symmetry') {
    show('scramble-symmetry', 0)
  } else if (scene == 'scramble-maze') {
    show('scramble-maze', 0)
  } else if (scene == 'triple2') {
    show('triple-twocolor-1', 1, 'turnOn 1.5s linear 0s 1 forwards')
    show('triple-twocolor-0', 1, 'turnOn 1.5s linear 2s 1 forwards')
    show('triple-twocolor-2', 1, 'turnOn 1.5s linear 4s 1 forwards')
  } else if (scene == 'triple3') {
    show('triple-threecolor-1', 0, 'turnOn 1.5s linear 0s 1 forwards')
    show('triple-threecolor-2', 0, 'turnOn 1.5s linear 2s 1 forwards')
    show('triple-threecolor-0', 0, 'turnOn 1.5s linear 4s 1 forwards')
  } else if (scene == 'triangles') {
    show('triangle-left', 0)
    show('triangle-right', 0)
  } else if (scene == 'pillars') {
    show('pillar-left', 0)
    show('pillar-right', 0)
  } else if (scene == 'fanfare') {
    // TODO: Fanfare?
  }
}

window.TRACE_COMPLETION_FUNC = function(puzzle) {
  window.setTimeout(function() {
    if (puzzle.name == 'easy-maze') {
      show('hard-maze', 0, 'turnOn 1.5s linear 0s 1 forwards')
      return
    } else if (puzzle.name == 'hard-maze') {
      show('stones', 0, 'turnOn 1.5s linear 0s 1 forwards')
      return
    }

    var sceneMap = {}
    sceneMap['stones'] = scrambleOrder[0]
    sceneMap[scrambleOrder[0]] = scrambleOrder[1]
    sceneMap[scrambleOrder[1]] = scrambleOrder[2]
    sceneMap[scrambleOrder[2]] = scrambleOrder[3]
    sceneMap[scrambleOrder[3]] = 'triple2'
    sceneMap['triple-twocolor-0'] = 'triple3'
    sceneMap['triple-twocolor-1'] = 'triple3'
    sceneMap['triple-twocolor-2'] = 'triple3'
    sceneMap['triple-threecolor-0'] = 'triangles'
    sceneMap['triple-threecolor-1'] = 'triangles'
    sceneMap['triple-threecolor-2'] = 'triangles'

    var nextScene = sceneMap[puzzle.name]

    // Handle two scenes which have no ordering
    if (puzzle.name == 'triangle-left' || puzzle.name == 'triangle-right') {
      var left = document.getElementById('triangle-left')
      var right = document.getElementById('triangle-right')
      // if both are solved, nextScene = 'pillars'
    } else if (puzzle.name == 'pillar-left' || puzzle.name == 'pillar-right') {
      var left = document.getElementById('pillar-left')
      var right = document.getElementById('pillar-right')
      // if both are solved, nextScene = 'fanfare'
    }

    if (nextScene == null) return;

    var type = document.getElementById('challengeType').value
    if (type == 'full') {
      showScene(nextScene)
    } else {
      showSolutions() // TODO: right, this.
    }
  }, 1000)
}

window.generateNew = function() {
  // Reset the seed and reload the page to get a new one
  var params = new URLSearchParams(window.location.search)
  params.seed = 0
  window.location.search = params.toString()
}

var scrambleOrder = []
var possibleTriples = []
var leftPillarSymmetry = 0
var rightPillarSymmetry = 0
var generateAttempts = 0

function generate() {
  scrambleOrder = shuffle(['scramble-stars', 'scramble-maze', 'scramble-polyominos', 'scramble-symmetry'])
  possibleTriples = ['triple-twocolor-' + randInt(3), 'triple-threecolor-' + randInt(3)]
  leftPillarSymmetry = randInt(4)
  rightPillarSymmetry = randInt(4)
  generateAttempts = 100

  setLogLevel('error') // window.solve and window.draw produce an unfortunate amount of spam. This is, obviously, my fault.

  generatePuzzleAsync(Object.keys(styles), function() {
    setLogLevel('info')
    console.info('All done!')

    var generateNew = document.getElementById('generateNew')
    generateNew.disabled = false
    generateNew.innerText = 'Generate New'


    var scene = document.getElementById('challengeType').value
    showScene(scene)
  })
}

function generatePuzzleAsync(styleKeys, finalCallback) {
  percent = 100.0 * (styles.length - styleKeys.length) / styles.length
  // document.getElementById('progressPercent').innerText = percent + '%'
  document.getElementById('progress').style.width = percent + '%'

  if (styleKeys.length === 0) {
    document.getElementById('progressBox').style.display = 'none'
    finalCallback()
    return
  }
  var styleName = styleKeys[0]
  var puzzle = styles[styleName]() // Generate a random puzzle

  // Check for invalid triple L shape in both solvable and unsolvable puzzles.
  if (styleName.startsWith('triple')) {
    if (puzzleHasInvalidTriple(puzzle)) {
      // No need to modify the attempt count, this check is very cheap.
      generatePuzzleAsync(styleKeys, finalCallback)
      return
    }
  }

  generateAttempts--
  if (generateAttempts <= 0) {
    // This is not great -- but we'd rather have a failure state than run forever.
    var puzzle = new Puzzle(1, 0)
    puzzle.grid[0][0].start = true
    puzzle.grid[2][0].end = 'right'
    window.draw(puzzle, styleName)
    puzzle.name = styleName

    generateAttempts = 100
    styleKeys.shift()
    console.error('Failed to generate a random puzzle for ' + styleName)

    generatePuzzleAsync(styleKeys, finalCallback)
    return
  }

  window.solve(puzzle, /*partialCallback=*/null, /*finalCallback=*/function(paths) {
    styleName = styleKeys[0] // Javascript bug, local variables are not copied.
    var success = false

    if (styleName.startsWith('triple') && !possibleTriples.includes(styleName)) {
      success = (paths.length == 0)
    } else if (unique) {
      if (puzzle.symmetry == null && puzzleName != 'scramble-symmetry') { // Eh. There's probably a nicer way of doing this.
        success = (paths.length == 1)
      } else {
        success = (paths.length == 2)
      }
    } else {
      success = (paths.length >= 1)
    }

    if (success) {
      window.draw(puzzle, styleName)
      puzzle.name = styleName // So that we know what we solved in the trace completion callback

      // Add a cover to panels, so that they can "power on" in sequence.
      var svg = document.getElementById(styleName)
      var panelCover = window.createElement('rect')
      panelCover.setAttribute('width', svg.style.width)
      panelCover.setAttribute('height', svg.style.height)
      panelCover.setAttribute('opacity', 1)
      panelCover.setAttribute('style', 'pointer-events: none')
      panelCover.setAttribute('id', styleName + '-cover')
      svg.appendChild(panelCover)

      svg.style.display = 'none'

      // Save the paths for the solution viewer here, I guess?
      // TODO: Apparently my best solution here is cutnpaste, which sucks.

      generateAttempts = 100
      styleKeys.shift()
      // TODO: Error?! Make info less spammy, then.
      console.error('Successfully generated a random puzzle for ' + styleName)
    }

    generatePuzzleAsync(styleKeys, finalCallback)
  })
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

    var colors = shuffle(['#052812', '#FFC17A', '#A4C34F', '#B52EBD', '#99EC35'])
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
  return squirrel3(++seed) % Math.floor(n)
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
    /* RRRR #####  RRRD ####  RRDR ###   RRDD ###  RDRR ##    RDRD ##    RDDR ##   RDDD ##
                           #         ##         #        ###        ##         #         #
                                                #                    #         ##        #
                                                                                         # */
    /* DRRR #    DRRD #   DRDR #   DRDD #  DDRR #   DDRD #  DDDR #  DDDD #
            ####      ###      ##       ##      #        #       #       #
                        #       ##       #      ###      ##      #       #
                                         #                #      ##      #
                                                                         # */

    // NOTE: RRRR and its counterpart DDDD clearly do not fit in a 4x4 grid. The game *does not account for this*,
    // and instead wraps around, resulting in either a 5-J or 4-I, respectively.
    polyshape = getRandomElement([4731, 12561, 8977, 1809, 8753, 1585, 1137, 241,
                                  8739, 1571,  1123, 227,  1095, 199,  143,  15])
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
  var colorFlags = []
  for (var x=1; x<puzzle.width+1; x+=2) colorFlags[x] = []
  for (var x=1; x<puzzle.width-1; x+=2) {
    for (var y=1; y<puzzle.height-1; y+=2) {
      var cell = puzzle.grid[x][y]
      if (cell == null) continue
      var flag = 0
      if      (cell.color == 'white')  flag = 1
      else if (cell.color == 'purple') flag = 2
      else if (cell.color == 'green')  flag = 4
      else continue

      if ((colorFlags[x][y] | flag) === 7) return true
      colorFlags[x][y+2] |= flag
      colorFlags[x+2][y] |= flag
      colorFlags[x+2][y+2] |= flag
    }
  }
  return false
}

})
