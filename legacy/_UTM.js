var tests = [
  /* Various
  function() {
    var grid = _newGrid(4, 4)
    grid[1][1] = {'type':'square', 'color':'white'}
    grid[1][3] = {'type':'square', 'color':'white'}
    grid[1][7] = {'type':'star', 'color':'orange'}
    grid[3][1] = {'type':'square', 'color':'white'}
    grid[3][3] = {'type':'square', 'color':'black'}
    grid[3][5] = {'type':'square', 'color':'black'}
    grid[5][3] = {'type':'square', 'color':'black'}
    grid[5][5] = {'type':'square', 'color':'black'}
    grid[5][7] = {'type':'square', 'color':'white'}
    grid[7][1] = {'type':'star', 'color':'orange'}
    grid[7][5] = {'type':'square', 'color':'white'}
    grid[7][7] = {'type':'square', 'color':'white'}
    return {'grid':grid, 'start':{'x':4, 'y':0}, 'end':{'x':4, 'y':8}}
  }, function() {
    var grid = _newGrid(3, 3)
    grid[1][1] = {'type':'square', 'color':'pink'}
    grid[1][3] = {'type':'square', 'color':'pink'}
    grid[1][5] = {'type':'star', 'color':'pink'}
    grid[3][1] = {'type':'square', 'color':'green'}
    grid[3][3] = {'type':'square', 'color':'green'}
    grid[3][5] = {'type':'square', 'color':'green'}
    grid[5][1] = {'type':'nega', 'color':'white'}
    grid[5][3] = {'type':'square', 'color':'pink'}
    grid[5][5] = {'type':'star', 'color':'pink'}
    return {'grid':grid}
  }, function() {
    var grid = _newGrid(4, 4)
    grid[1][3] = {'type':'star', 'color':'teal'}
    grid[1][5] = {'type':'star', 'color':'teal'}
    grid[3][1] = {'type':'star', 'color':'teal'}
    grid[3][7] = {'type':'star', 'color':'teal'}
    grid[5][1] = {'type':'star', 'color':'yellow'}
    grid[5][7] = {'type':'star', 'color':'yellow'}
    grid[7][3] = {'type':'star', 'color':'yellow'}
    grid[7][5] = {'type':'star', 'color':'yellow'}
    return {'grid':grid, 'gaps':[
      {'x':0, 'y':3},
      {'x':1, 'y':8},
      {'x':3, 'y':2},
      {'x':5, 'y':0},
      {'x':6, 'y':3},
      {'x':8, 'y':3},
      {'x':8, 'y':5}
    ]}
  }, function() {
    var grid = _newGrid(5, 5)
    grid[1][1] = {'type':'poly','color':'yellow','size':3,'shape':'L','rot':'all'}
    grid[1][3] = {'type':'poly','color':'yellow','size':3,'shape':'L','rot':'all'}
    grid[1][5] = {'type':'poly','color':'yellow','size':3,'shape':'L','rot':'all'}
    grid[1][7] = {'type':'poly','color':'yellow','size':3,'shape':'L','rot':'all'}
    grid[1][9] = {'type':'poly','color':'yellow','size':3,'shape':'L','rot':'all'}
    grid[5][5] = {'type':'star','color':'purple'}
    grid[9][1] = {'type':'star','color':'purple'}
    grid[9][3] = {'type':'star','color':'purple'}
    grid[9][5] = {'type':'star','color':'purple'}
    grid[9][7] = {'type':'star','color':'purple'}
    grid[9][9] = {'type':'star','color':'purple'}
    return {'grid':grid}
  }, function() {
    var grid = _newGrid(4, 4)
    grid[1][1] = {'type':'star', 'color':'white'}
    grid[1][3] = {'type':'star', 'color':'white'}
    grid[1][5] = {'type':'star', 'color':'white'}
    grid[1][7] = {'type':'star', 'color':'white'}
    grid[3][1] = {'type':'star', 'color':'white'}
    grid[3][3] = {'type':'star', 'color':'white'}
    grid[3][5] = {'type':'star', 'color':'black'}
    grid[3][7] = {'type':'star', 'color':'red'}
    grid[5][1] = {'type':'star', 'color':'black'}
    grid[5][3] = {'type':'star', 'color':'black'}
    grid[5][5] = {'type':'star', 'color':'black'}
    grid[5][7] = {'type':'star', 'color':'red'}
    grid[7][1] = {'type':'star', 'color':'red'}
    grid[7][3] = {'type':'star', 'color':'red'}
    grid[7][5] = {'type':'star', 'color':'red'}
    grid[7][7] = {'type':'star', 'color':'red'}
    return {'grid':grid}
  }, function() {
    var grid = _newGrid(4, 4)
    grid[1][1] = {'type':'star', 'color':'purple'}
    grid[3][1] = {'type':'poly','color':'orange','size':3,'shape':'I','rot':1}
    grid[3][7] = {'type':'star', 'color':'purple'}
    grid[5][7] = {'type':'poly','color':'orange','size':2,'shape':'I','rot':1}
    return {'grid':grid, 'start':{'x':8,'y':4}, 'end':{'x':0,'y':4}}
  }, function() {
    var grid = _newGrid(4, 4)
    grid[1][1] = {'type':'star', 'color':'purple'}
    grid[3][3] = {'type':'poly','color':'orange','size':4,'shape':'T','rot':1}
    grid[5][7] = {'type':'poly','color':'orange','size':3,'shape':'I','rot':0}
    grid[7][7] = {'type':'star', 'color':'purple'}
    return {'grid':grid, 'start':{'x':8,'y':2}, 'end':{'x':0,'y':4}, 'gaps':[{'x':6, 'y':5}]}
  }, function() {
    var grid = _newGrid(4, 4)
    grid[1][7] = {'type':'star', 'color':'purple'}
    grid[3][3] = {'type':'poly','color':'orange','size':4,'shape':'I','rot':1}
    grid[7][3] = {'type':'star', 'color':'purple'}
    grid[7][5] = {'type':'poly','color':'orange','size':4,'shape':'L','rot':'all'}
    return {'grid':grid, 'start':{'x':8,'y':0}, 'end':{'x':0,'y':4}}
  },/* function() {
    var grid = _newGrid(6, 6)
    grid[1][5] = {'type':'poly','color':'orange','size':3,'shape':'I','rot':1}
    grid[1][11] = {'type':'star', 'color':'purple'}
    grid[5][5] = {'type':'poly','color':'purple','size':3,'shape':'I','rot':0}
    grid[9][5] = {'type':'poly','color':'orange','size':4,'shape':'J','rot':3}
    grid[11][1] = {'type':'star', 'color':'purple'}
    grid[11][11] = {'type':'star', 'color':'purple'}
    return {'grid':grid, 'start':{'x':12,'y':6}, 'end':{'x':0,'y':6}}
  }, function() {
    var grid = _newGrid(4, 4)
    grid[1][3] = {'type':'poly','color':'orange','size':4,'shape':'J','rot':'all'}
    grid[1][5] = {'type':'poly','color':'orange','size':4,'shape':'J','rot':'all'}
    grid[3][3] = {'type':'star', 'color':'purple'}
    grid[3][7] = {'type':'ylop','color':'blue','size':3,'shape':'L','rot':0}
    grid[7][5] = {'type':'star', 'color':'purple'}
    return {'grid':grid, 'start':{'x':8,'y':4}, 'end':{'x':0,'y':4}}
  }, function() {
    var grid = _newGrid(5, 5)
    grid[1][3] = {'type':'star', 'color':'green'}
    grid[3][3] = {'type':'star', 'color':'purple'}
    grid[5][7] = {'type':'poly','color':'orange','size':4,'shape':'L','rot':'all'}
    grid[5][9] = {'type':'star', 'color':'green'}
    grid[7][3] = {'type':'poly','color':'orange','size':4,'shape':'J','rot':'all'}
    grid[9][7] = {'type':'poly','color':'orange','size':2,'shape':'I','rot':0}
    grid[9][9] = {'type':'star', 'color':'purple'}
    return {'grid':grid, 'start':{'x':10,'y':6}, 'end':{'x':0,'y':6}}
  } */
  /* Blue puzzles that aren't obviously unique
  function() {
    var grid = _newGrid(5, 5)
    grid[1][1] = {'type':'poly','color':'yellow','size':5,'shape':'V','rot':1}
    grid[1][9] = {'type':'poly','color':'yellow','size':3,'shape':'I','rot':0}
    grid[5][5] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[9][9] = {'type':'poly','color':'yellow','size':3,'shape':'L','rot':2}
    return {'grid':grid, 'gaps':[{'x':10, 'y':7}]}
  }, function() {
    var grid = _newGrid(5, 5)
    grid[1][1] = {'type':'poly','color':'yellow','size':5,'shape':'V','rot':1}
    grid[1][9] = {'type':'poly','color':'yellow','size':3,'shape':'I','rot':0}
    grid[5][5] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[9][9] = {'type':'poly','color':'yellow','size':3,'shape':'L','rot':2}
    return {'grid':grid, 'gaps':[{'x':5, 'y':10}]}
  }, function() {
    var grid = _newGrid(5, 5)
    grid[1][1] = {'type':'poly','color':'yellow','size':3,'shape':'I','rot':1}
    grid[1][5] = {'type':'poly','color':'yellow','size':2,'shape':'I','rot':0}
    grid[3][9] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[7][5] = {'type':'poly','color':'yellow','size':4,'shape':'J','rot':2}
    return {'grid':grid, 'gaps':[{'x':3, 'y':4}, {'x':4, 'y':3}, {'x':4, 'y':5}, {'x':5, 'y':4}]}
  }, function() {
    var grid = _newGrid(5, 5)
    grid[1][7] = {'type':'poly','color':'yellow','size':4,'shape':'J','rot':1}
    grid[9][5] = {'type':'poly','color':'yellow','size':2,'shape':'I','rot':1}
    grid[9][9] = {'type':'poly','color':'yellow','size':4,'shape':'O','rot':0}
    return {'grid':grid, 'gaps':[{'x':3, 'y':4}, {'x':4, 'y':3}, {'x':4, 'y':5}, {'x':5, 'y':4}]}
  }, function() {
    var grid = _newGrid(5, 5)
    grid[1][1] = {'type':'poly', 'shape':'2.0.0', 'color':'yellow'}
    grid[1][9] = {'type':'poly', 'shape':'3.0.1', 'color':'yellow'}
    grid[9][7] = {'type':'poly', 'shape':'4.5.0', 'color':'yellow'}
    return {'grid':grid, 'gaps':[{'x':3, 'y':4}, {'x':4, 'y':3}, {'x':4, 'y':5}, {'x':5, 'y':4}]}
  }, function() {
    var grid = _newGrid(4, 4)
    grid[1][1] = {'type':'square', 'color':'black'}
    grid[1][7] = {'type':'square', 'color':'black'}
    grid[3][1] = {'type':'square', 'color':'black'}
    grid[3][7] = {'type':'square', 'color':'black'}
    grid[5][1] = {'type':'square', 'color':'white'}
    grid[5][7] = {'type':'square', 'color':'white'}
    grid[7][1] = {'type':'square', 'color':'white'}
    grid[7][7] = {'type':'square', 'color':'white'}
    return {'grid':grid, 'start':{'x':8, 'y':8}, 'end':{'x':4, 'y':0}, 'gaps':[{'x':5, 'y':8}]}
  },*/ function() {
    var puzzle = new Puzzle(4, 7)
    puzzle.grid[1][7] = {'type':'poly','color':'yellow','size':4,'shape':'I','rot':1}
    puzzle.grid[7][5] = {'type':'poly','color':'yellow','size':4,'shape':'J','rot':1}
    return puzzle
  }/*, function() {
    var puzzle = new Puzzle(2, 6, true)
    for (var x=0; x<puzzle.grid.length; x+=2) {
      for (var y=0; y<puzzle.grid[x].length; y+=2) {
        puzzle.dots.push({'x':x, 'y':y})
      }
    }
    puzzle.gaps = [{'x':0, 'y':9}, {'x':0, 'y':11}]
    puzzle.start = {'x':4, 'y':4}
    puzzle.end = {'x':0, 'y':10}
    return puzzle
  }, function() {
    var puzzle = new Puzzle(3, 6, true)
    puzzle.grid[1][1] = {'type':'square', 'color':'white'}
    puzzle.grid[1][3] = {'type':'square', 'color':'black'}
    puzzle.grid[1][5] = {'type':'square', 'color':'black'}
    puzzle.grid[1][9] = {'type':'square', 'color':'white'}
    puzzle.grid[3][3] = {'type':'square', 'color':'white'}
    puzzle.grid[3][5] = {'type':'square', 'color':'white'}
    puzzle.grid[5][1] = {'type':'square', 'color':'black'}
    puzzle.grid[5][3] = {'type':'square', 'color':'black'}
    puzzle.grid[5][5] = {'type':'square', 'color':'black'}
    puzzle.grid[5][11] = {'type':'square', 'color':'black'}
    puzzle.start = {'x':6, 'y':6}
    puzzle.end = {'x':0, 'y':6}
    return puzzle
  }, function() {
    var puzzle = new Puzzle(5, 5, true)
    puzzle.grid[1][7] = {'type':'poly', 'color':'yellow', 'size':4, 'shape':'J', 'rot':2}
    puzzle.grid[9][5] = {'type':'poly', 'color':'yellow', 'size':4, 'shape':'L', 'rot':0}
    puzzle.start = {'x':10, 'y':6}
    puzzle.end = {'x':0, 'y':6}
    return puzzle
  }, function() {
    var puzzle = new Puzzle(3, 6, true)
    puzzle.grid[3][1] = {'type':'star', 'color':'orange'}
    puzzle.grid[3][3] = {'type':'star', 'color':'orange'}
    puzzle.grid[3][5] = {'type':'star', 'color':'orange'}
    puzzle.grid[3][7] = {'type':'star', 'color':'orange'}
    puzzle.grid[3][9] = {'type':'star', 'color':'orange'}
    puzzle.grid[3][11] = {'type':'star', 'color':'orange'}
    puzzle.start = {'x':6, 'y':6}
    puzzle.end = {'x':0, 'y':6}
    return puzzle
  }, function() {
    var puzzle = new Puzzle(3, 6, true)
    puzzle.grid[3][5] = {'type':'star', 'color':'orange'}
    puzzle.grid[3][7] = {'type':'star', 'color':'orange'}
    puzzle.dots = [{'x':3, 'y':4}, {'x':3, 'y':6}, {'x':3, 'y':8}]
    puzzle.gaps = [{'x':0, 'y':5}, {'x':0, 'y':7}]
    puzzle.start = {'x':6, 'y':6}
    puzzle.end = {'x':0, 'y':6}
    return puzzle
  }, function() {
    var puzzle = new Puzzle(4, 6, true)
    for (var x=0; x<puzzle.grid.length; x+=2) {
      for (var y=0; y<puzzle.grid[x].length; y+=2) {
        puzzle.dots.push({'x':x, 'y':y})
      }
    }
    puzzle.gaps = [
      {'x':1, 'y':10},
      {'x':2, 'y':9},
      {'x':3, 'y':8},
      {'x':4, 'y':7},
      {'x':5, 'y':6},
      {'x':6, 'y':5},
      {'x':7, 'y':4},
    ]
    puzzle.start = {'x':8, 'y':4}
    puzzle.end = {'x':0, 'y':10}
    return puzzle
  }, function() {
    var puzzle = new Puzzle(5, 5)
    puzzle.grid[1][1] = {'type':'triangle', 'color':'orange', 'count':3}
    puzzle.grid[1][9] = {'type':'triangle', 'color':'orange', 'count':3}
    puzzle.grid[5][5] = {'type':'triangle', 'color':'orange', 'count':3}
    puzzle.grid[9][1] = {'type':'triangle', 'color':'orange', 'count':3}
    puzzle.grid[9][9] = {'type':'triangle', 'color':'orange', 'count':3}
    return puzzle
  }*/
  
  /* Green puzzles (with visible dots)
  function() {
    var grid = _newGrid(4, 4)
    var dots = []
    for (var x=0; x<grid.length; x+=2) {
      for (var y=0; y<grid[x].length; y+=2) {
        dots.push({'x':x, 'y':y})
      }
    }
    return {'grid':grid, 'dots':dots}
  }, function() {
    var grid = _newGrid(4, 4)
    var dots = []
    for (var x=0; x<grid.length; x+=2) {
      for (var y=0; y<grid[x].length; y+=2) {
        dots.push({'x':x, 'y':y})
      }
    }
    dots.push({'x':1, 'y':6})
    dots.push({'x':2, 'y':7})
    return {'grid':grid, 'dots':dots}
  }, function() {
    var grid = _newGrid(4, 4)
    var dots = []
    for (var x=0; x<grid.length; x+=2) {
      for (var y=0; y<grid[x].length; y+=2) {
        dots.push({'x':x, 'y':y})
      }
    }
    dots.push({'x':2, 'y':3})
    dots.push({'x':7, 'y':6})
    return {'grid':grid, 'dots':dots}
  }, function() {
    var grid = _newGrid(4, 4)
    var dots = []
    for (var x=0; x<grid.length; x+=2) {
      for (var y=0; y<grid[x].length; y+=2) {
        dots.push({'x':x, 'y':y})
      }
    }
    dots.push({'x':0, 'y':7})
    dots.push({'x':2, 'y':3})
    dots.push({'x':5, 'y':6})
    return {'grid':grid, 'dots':dots}
  }, function() {
    var grid = _newGrid(4, 4)
    var dots = []
    for (var x=0; x<grid.length; x+=2) {
      for (var y=0; y<grid[x].length; y+=2) {
        dots.push({'x':x, 'y':y})
      }
    }
    dots.push({'x':1, 'y':4})
    return {'grid':grid, 'dots':dots, 'start':{'x':4, 'y':4}}
  }, function() {
    return {'grid':_newGrid(3, 3), dots:[
      {'x':1, 'y':2},
      {'x':2, 'y':0},
      {'x':2, 'y':3},
      {'x':4, 'y':0},
      {'x':4, 'y':5},
      {'x':6, 'y':4}
    ]}
  }, */
  /* Orange puzzles (invisible dots)
  function() {
    return {'grid':_newGrid(3, 3), 'dots':[
      {'x':2, 'y':2}
    ]}
  }, function() {
    return {'grid':_newGrid(2, 2), 'dots':[
      {'x':0, 'y':0},
      {'x':2, 'y':2},
      {'x':4, 'y':4}
    ]}
  }, function() {
    return {'grid':_newGrid(3, 3), 'dots':[
      {'x':0, 'y':0},
      {'x':2, 'y':2},
      {'x':4, 'y':4},
      {'x':6, 'y':6}
    ]}
  }, function() {
    return {'grid':_newGrid(3, 3), 'dots':[
      {'x':0, 'y':3},
      {'x':2, 'y':0},
      {'x':2, 'y':6},
      {'x':4, 'y':4}
    ]}
  }, function() {
    return {'grid':_newGrid(4, 4), 'dots':[
      {'x':1, 'y':8},
      {'x':2, 'y':3},
      {'x':3, 'y':6},
      {'x':5, 'y':6},
      {'x':6, 'y':3},
      {'x':7, 'y':8}
    ]}
  }, function() {
    return {'grid':_newGrid(5, 5), 'dots':[
      {'x':0, 'y':7},
      {'x':4, 'y':2},
      {'x':7, 'y':6},
      {'x':8, 'y':3},
    ]}
  }, function() {
    return {'grid':_newGrid(6, 3), 'dots':[
      {'x':0, 'y':3},
      {'x':2, 'y':5},
      {'x':4, 'y':1},
      {'x':6, 'y':1},
      {'x':8, 'y':3},
      {'x':10,'y':1},
      {'x':12,'y':5}
    ]}
  }, function() {
    return {'grid':_newGrid(6, 3), 'gaps':[{'x':2, 'y':3}, {'x':10, 'y':3}], 'dots':[
      {'x':0, 'y':3},
      {'x':2, 'y':5},
      {'x':4, 'y':1},
      {'x':6, 'y':1},
      {'x':8, 'y':3},
      {'x':10,'y':1},
      {'x':12,'y':5}
    ]}
  }, function() {
    return {'grid':_newGrid(3, 1), 'start':{'x':6, 'y':2}, 'dots':[
      {'x':2, 'y':2},
      {'x':3, 'y':0},
      {'x':4, 'y':2}
    ]}
  }, function() {
    return {'grid':_newGrid(5, 2), 'start':{'x':10, 'y':2}, 'dots':[
      {'x':2, 'y':4},
      {'x':4, 'y':0},
      {'x':5, 'y':2},
      {'x':8, 'y':0},
      {'x':8, 'y':4}
    ]}
  }, */
]

function loadTests() {
  var start = (new Date()).getTime()
  for (var i=0; i<tests.length; i++) {
    try {
      var solutions = []
      var puzzle = tests[i]()
      if (puzzle['start'] == undefined) {
        puzzle['start'] = {'x':puzzle.grid.length-1, 'y':0}
      }
      if (puzzle['end'] == undefined) {
        puzzle['end'] = {'x':0, 'y':puzzle.grid[0].length-1}
      }
      if (puzzle['dots'] == undefined) {
        puzzle['dots'] = []
      }
      if (puzzle['gaps'] == undefined) {
        puzzle['gaps'] = []
      }
      solve(puzzle, puzzle.start.x, puzzle.start.y, solutions)
      console.log('Solved', puzzle)
      var minEdges = 999999
      var minCorners = 999999
      var minSolution = undefined
      for (var solution of solutions) {
        var edges = 0
        var corners = 0
        for (var x=0; x<solution.grid.length; x++) {
          for (var y=0; y<solution.grid[x].length; y++) {
            if (solution.grid[x][y] == true) {
              if (x%2 == 0 && y%2 == 0) {
                // At a corner
                if ((
                    solution.grid[x-1] == undefined ||
                    solution.grid[x-1][y] == undefined ||
                    solution.grid[x-1][y] == true
                  ) && (
                    solution.grid[x+1] == undefined ||
                    solution.grid[x+1][y] == undefined ||
                    solution.grid[x+1][y] == true
                  )) continue
                if ((
                    solution.grid[x] == undefined ||
                    solution.grid[x][y-1] == undefined ||
                    solution.grid[x][y-1] == true
                  ) && (
                    solution.grid[x] == undefined ||
                    solution.grid[x][y+1] == undefined ||
                    solution.grid[x][y+1] == true
                  )) continue
                corners++
              } else {
                // At an edge
                edges++
              }
            }
          }
        }
        if (edges < minEdges || (edges == minEdges && corners < minCorners)) {
          minEdges = edges
          minCorners = corners
          minSolution = solution
        }
      }
      console.log('Minimum solution out of', solutions.length, 'has', minEdges, 'edges and', minCorners, 'corners:', minSolution)
      if (minSolution != undefined) {
        minSolution.start = puzzle.start
        draw(minSolution, 'test'+i) // TODO: This prevents tracing on the puzzle
      } else {
        draw(puzzle, 'test'+i)
      }
    } catch (e) {
      document.getElementById('test'+i).innerHTML = e.stack
      continue
    }
  }
  var end = (new Date()).getTime()
  document.getElementById('load').innerHTML = (end - start)/1000 + ' seconds'
}
