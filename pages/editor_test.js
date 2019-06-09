function ASSERT(val) {
  if (val) return
  throw Error('Assertion failed: ' + val + ' is false')
}

function ASSERT_EQ(expected, actual) {
  if (expected === actual) return
  throw Error('Expected ' + expected + ' === ' + actual)
}

function ASSERT_SIZE(width, height, grid) {
  ASSERT_EQ(width, grid.length)
  ASSERT_EQ(height, grid[0].length)
}

window.onload = function() {
  // Override some functions that deal with UI
  window._writePuzzle = function() {}

  var numFailures = 0
  var testNames = Object.keys(tests)
  for (var i=0; i<testNames.length; i++) {
    var testName = testNames[i]

    try {
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

var tests = {
  'change-style-0-2': function() {
    window.puzzle = new Puzzle(0, 2)
    setStyle('Default')
    ASSERT_SIZE(1, 5, puzzle.grid)

    setStyle('Horizontal Symmetry')
    ASSERT_SIZE(1, 5, puzzle.grid)
    setStyle('Vertical Symmetry')
    ASSERT_SIZE(1, 5, puzzle.grid)
    setStyle('Rotational Symmetry')
    ASSERT_SIZE(1, 5, puzzle.grid)

    setStyle('Pillar')
    ASSERT_SIZE(2, 5, puzzle.grid)

    setStyle('Pillar (H Symmetry)')
    ASSERT_SIZE(4, 5, puzzle.grid)
    setStyle('Pillar (V Symmetry)')
    ASSERT_SIZE(4, 5, puzzle.grid)
    setStyle('Pillar (R Symmetry)')
    ASSERT_SIZE(4, 5, puzzle.grid)
    setStyle('Pillar (Two Lines)')
    ASSERT_SIZE(4, 5, puzzle.grid)
  },
  'change-style-1-3': function() {
    window.puzzle = new Puzzle(1, 3)
    setStyle('Default')
    ASSERT_SIZE(3, 7, puzzle.grid)

    setStyle('Horizontal Symmetry')
    ASSERT_SIZE(3, 7, puzzle.grid)
    setStyle('Vertical Symmetry')
    ASSERT_SIZE(3, 7, puzzle.grid)
    setStyle('Rotational Symmetry')
    ASSERT_SIZE(3, 7, puzzle.grid)

    setStyle('Pillar')
    ASSERT_SIZE(2, 7, puzzle.grid)

    setStyle('Pillar (H Symmetry)')
    ASSERT_SIZE(4, 7, puzzle.grid)
    setStyle('Pillar (V Symmetry)')
    ASSERT_SIZE(4, 7, puzzle.grid)
    setStyle('Pillar (R Symmetry)')
    ASSERT_SIZE(4, 7, puzzle.grid)
    setStyle('Pillar (Two Lines)')
    ASSERT_SIZE(4, 7, puzzle.grid)
  },
  'change-style-4-4': function() {
    window.puzzle = new Puzzle(4, 4)
    setStyle('Default')
    ASSERT_SIZE(9, 9, puzzle.grid)

    setStyle('Horizontal Symmetry')
    ASSERT_SIZE(9, 9, puzzle.grid)
    setStyle('Vertical Symmetry')
    ASSERT_SIZE(9, 9, puzzle.grid)
    setStyle('Rotational Symmetry')
    ASSERT_SIZE(9, 9, puzzle.grid)

    setStyle('Pillar')
    ASSERT_SIZE(8, 9, puzzle.grid)

    setStyle('Pillar (H Symmetry)')
    ASSERT_SIZE(8, 9, puzzle.grid)
    setStyle('Pillar (V Symmetry)')
    ASSERT_SIZE(8, 9, puzzle.grid)
    setStyle('Pillar (R Symmetry)')
    ASSERT_SIZE(8, 9, puzzle.grid)
    setStyle('Pillar (Two Lines)')
    ASSERT_SIZE(8, 9, puzzle.grid)
  },
  'change-style-5-5': function() {
    window.puzzle = new Puzzle(5, 5)
    setStyle('Default')
    ASSERT_SIZE(11, 11, puzzle.grid)

    setStyle('Horizontal Symmetry')
    ASSERT_SIZE(11, 11, puzzle.grid)
    setStyle('Vertical Symmetry')
    ASSERT_SIZE(11, 11, puzzle.grid)
    setStyle('Rotational Symmetry')
    ASSERT_SIZE(11, 11, puzzle.grid)

    setStyle('Pillar')
    ASSERT_SIZE(10, 11, puzzle.grid)

    setStyle('Pillar (H Symmetry)')
    ASSERT_SIZE(12, 11, puzzle.grid)
    setStyle('Pillar (V Symmetry)')
    ASSERT_SIZE(12, 11, puzzle.grid)
    setStyle('Pillar (R Symmetry)')
    ASSERT_SIZE(12, 11, puzzle.grid)
    setStyle('Pillar (Two Lines)')
    ASSERT_SIZE(12, 11, puzzle.grid)
  }
}
