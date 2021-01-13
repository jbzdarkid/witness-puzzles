function ASSERT(cond, msg) {if (!cond) throw Error('Expected ' + msg)}
function ASSERT_EQ(a, b, a_, b_) {ASSERT(a === b, b_+' === '+a_)}
function ASSERT_GT(a, b, a_, b_) {ASSERT(a > b, a_+' > '+b_)}
function ASSERT_NONNULL(a, a_) {ASSERT(a != null, a_+' != null')}

function ASSERT_GRID() {
  ASSERT_NONNULL(window.puzzle, 'puzzle')
  var grid = window.puzzle.grid
  ASSERT_NONNULL(grid, 'grid')
  return grid
}

function ASSERT_CELL(x, y) {
  var grid = ASSERT_GRID()
  ASSERT_GT(grid.length, x, 'grid.length', x)
  ASSERT_GT(grid[0].length, y, 'grid[0].length', y)
  var cell = grid[x][y]
  ASSERT_NONNULL(cell, 'grid[x][y]')
  return cell
}

function ASSERT_SIZE(width, height) {
  var grid = ASSERT_GRID()
  ASSERT_EQ(width, grid.length, width, 'grid.length')
  ASSERT_EQ(height, grid[0].length, height, 'grid[0].length')
}

function ASSERT_ALL_START(/* x1, y1, x2, y2, ... */) {
  var grid = ASSERT_GRID()
  var startpoints = 0
  for (var x=0; x<grid.length; x++) {
    for (var y=0; y<grid[0].length; y++) {
      if (grid[x][y] != null && grid[x][y].start === true) startpoints++
    }
  }
  ASSERT_EQ(arguments.length/2, startpoints, arguments.length/2, '#startpoints ('+startpoints+')')

  for (var i=0; i<arguments.length; i+=2) {
    var x = arguments[i]
    var y = arguments[i+1]
    var cell = ASSERT_CELL(x, y)
    ASSERT_EQ(true, cell.start, 'true', 'grid['+x+']['+y+'].start')
  }
}

function ASSERT_ALL_END(/* x1, y1, dir1, x2, y2, dir2, ... */) {
  var grid = ASSERT_GRID()
  var endpoints = 0
  for (var x=0; x<grid.length; x++) {
    for (var y=0; y<grid[0].length; y++) {
      if (grid[x][y] != null && grid[x][y].end != null) endpoints++
    }
  }
  ASSERT_EQ(arguments.length/3, endpoints, arguments.length/3, '#endpoints ('+endpoints+')')

  for (var i=0; i<arguments.length; i+=3) {
    var x = arguments[i]
    var y = arguments[i+1]
    var cell = ASSERT_CELL(x, y)
    var dir = arguments[i+2]
    ASSERT_NONNULL(cell.end, 'grid['+x+']['+y+'].end')
    ASSERT_EQ(dir, cell.end, dir, 'grid['+x+']['+y+'].end')
  }
}

window.onload = function() {
  // Override a function that tries to draw UI
  window._writePuzzle = function() {}

  var numFailures = 0
  var testNames = Object.keys(tests)
  for (var i=0; i<testNames.length; i++) {
    var testName = testNames[i]

    try {
      setup()
      tests[testName]()
      console.info('Test', testName, 'succeeded')
    } catch (e) {
      var lines = e.stack.split('\n')
      var lineNo = lines[lines.length-2].match('(\\d+):\\d+\\)')[1]
      console.error('Test', testName, 'failed on line', lineNo + ':', lines[0])
      numFailures++
    }
  }
  return numFailures
}

function setup() {
  createEmptyPuzzle()
  ASSERT_ALL_START(0, 8)
  ASSERT_ALL_END(8, 0, 'right')
}

var tests = {
  'change-style-0-2': function() {
    window.puzzle = new Puzzle(0, 2)

    setStyle('Default')
    ASSERT_SIZE(1, 5)

    setStyle('Horizontal Symmetry')
    ASSERT_SIZE(1, 5)
    setStyle('Vertical Symmetry')
    ASSERT_SIZE(1, 5)
    setStyle('Rotational Symmetry')
    ASSERT_SIZE(1, 5)

    setStyle('Pillar')
    ASSERT_SIZE(2, 5)

    setStyle('Pillar (H Symmetry)')
    ASSERT_SIZE(4, 5)
    setStyle('Pillar (V Symmetry)')
    ASSERT_SIZE(4, 5)
    setStyle('Pillar (R Symmetry)')
    ASSERT_SIZE(4, 5)
    setStyle('Pillar (Two Lines)')
    ASSERT_SIZE(4, 5)
  },
  'change-style-1-3': function() {
    window.puzzle = new Puzzle(1, 3)
    setStyle('Default')
    ASSERT_SIZE(3, 7)

    setStyle('Horizontal Symmetry')
    ASSERT_SIZE(3, 7)
    setStyle('Vertical Symmetry')
    ASSERT_SIZE(3, 7)
    setStyle('Rotational Symmetry')
    ASSERT_SIZE(3, 7)

    setStyle('Pillar')
    ASSERT_SIZE(2, 7)

    setStyle('Pillar (H Symmetry)')
    ASSERT_SIZE(4, 7)
    setStyle('Pillar (V Symmetry)')
    ASSERT_SIZE(4, 7)
    setStyle('Pillar (R Symmetry)')
    ASSERT_SIZE(4, 7)
    setStyle('Pillar (Two Lines)')
    ASSERT_SIZE(4, 7)
  },
  'default': function() {
    setStyle('Default')
    ASSERT_SIZE(9, 9)
    ASSERT_ALL_START(0, 8)
    ASSERT_ALL_END(8, 0, 'right')
  },
  'horizontal': function() {
    setStyle('Horizontal Symmetry')
    ASSERT_SIZE(9, 9)
    ASSERT_ALL_START(0, 8, 8, 8)
    ASSERT_ALL_END(0, 0, 'left', 8, 0, 'right')
  },
  'vertical': function() {
    setStyle('Vertical Symmetry')
    ASSERT_SIZE(9, 9)
    ASSERT_ALL_START(0, 8, 0, 0)
    ASSERT_ALL_END(8, 0, 'right', 8, 8, 'right')
  },
  'rotational': function() {
    debugger;
    setStyle('Rotational Symmetry')
    ASSERT_SIZE(9, 9)
    ASSERT_ALL_START(0, 8, 0, 0)
    ASSERT_ALL_END(8, 0, 'right', 8, 8, 'right')
  }
  /*
    setStyle('Pillar')
    ASSERT_SIZE(8, 9)

    setStyle('Pillar (H Symmetry)')
    ASSERT_SIZE(8, 9)
    setStyle('Pillar (V Symmetry)')
    ASSERT_SIZE(8, 9)
    setStyle('Pillar (R Symmetry)')
    ASSERT_SIZE(8, 9)
    setStyle('Pillar (Two Lines)')
    ASSERT_SIZE(8, 9)
  }*/
}
