var styles = {
  'monday':{
    'width':4, 'height':4, 'colors':2, 'difficulty':[50, 100],
    'distribution':{
      'squares':4,
      'stars':4,
    }
  },
  'tuesday':{
    'width':4, 'height':4, 'colors':2, 'difficulty':[1, 9999],
    'distribution':{
      'stars':5,
      'negations':1,
      'dots':25,
    }
  },
  'wednesday':{
    'width':4, 'height':4, 'colors':1, 'difficulty':[1, 9999],
    'distribution':{
      'polyominos':3,
      'triangles':2,
    }
  },
  'thursday':{
    'width':5, 'height':5, 'colors':1, 'difficulty':[1, 9999],
    'distribution':{
      'triangles':12,
      'negations':2,
    }
  },
  'friday':{
    'width':5, 'height':5, 'colors':2, 'difficulty':[1, 99999999],
//    'pillar':1,
    'distribution':{
      'onimoylops':1,
      'polyominos':2,
      'squares':6
    }
  },
  'saturday':{
    'width':5, 'height':5, 'colors':3, 'difficulty':[1, 9999],
    'symmetry':1,
    'distribution': {}
  },
  'sunday':{
//    'width':6, 'height':6, 'colors':1, 'difficulty':[1, 9999],
    'width':5, 'height':5, 'colors':1, 'difficulty':[1, 9999],
    'pillar':1, 'symmetry':1,
    'distribution':{
      'triangles':1,
      'polyominos':1,
      'stars':1,
      'squares':1,
      'negations':1,
      'dots':1,
      'gaps':1,
    }
  },
}


var puzzleData = {'solutions': []}
// Detect style + puzzle id, generate, validate, and display puzzle.
window.onload = function() {
  // Determine puzzle seed
  if (location.hash == "") {
    // If no seed is provided, choose a random one
    setSeed(Math.floor(Math.random() * (1 << 30)))
  } else { // A seed was provided
    setSeed(parseInt(location.hash.substring(1)))
  }

  // Parse URL params to either load a puzzle, or generate a random one
  if ('puzzle' in urlParams) {
    puzzleData.puzzle = Puzzle.deserialize(urlParams.puzzle)
    document.head.title = puzzleData.puzzle.name
    document.getElementById('title').innerText = puzzleData.puzzle.name

    // If the puzzle has symbols, only verify 5x5 (11x11 internally) and smaller
    var puzzleHasSymbols = false
    for (var x=1; x<puzzle.grid.length; x+=2) {
      for (var y=1; y<puzzle.grid[x].length; y+=2) {
        if (puzzle.getCell(x, y) !== false) puzzleHasSymbols = true
      }
    }
    if (!puzzleHasSymbols || puzzleData.puzzle.grid.length * puzzleData.puzzle.grid[0].length <= 121) {
      puzzleData.solutions = solve(puzzleData.puzzle)
    }
  } else {
    if ('style' in urlParams) {
      if (urlParams.style in styles) {
        var style = styles[urlParams.style]
      } else {
        var style = JSON.parse(urlParams.style)
      }
    } else {
      var day = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'][(new Date()).getDay()]
      var style = styles[day]
      location.search = 'style='+day
    }
    puzzleData = validPuzzle(style)
    location.hash = puzzleData.seed
  }

  draw(puzzleData.puzzle)
  puzzleData.solution = puzzleData.solutions[_randint(puzzleData.solutions.length)]
  if (puzzleData.solution != null) {
    document.getElementById('soln').disabled = false
    document.getElementById('hint').disabled = false
    puzzleData.solution.loadHints()
  }
}

function showHint() {
  var hint = puzzleData.solution.showHint()
  if (hint == null) {
    document.getElementById('hint').disabled = true
    return
  }
  puzzleData.puzzle.showHint(hint)
  puzzleData.puzzle.clearLines()
  draw(puzzleData.puzzle)
}

function showSolution() {
  draw(puzzleData.solution)
}
