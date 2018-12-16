var tests = [
/*
  function() {
    var puzzle = new Puzzle(5, 5)
    puzzle.grid[1][1] = {'type':'poly', 'size':4, 'shape':'I', 'rot':'all', 'color':'yellow'}
    puzzle.grid[1][7] = {'type':'poly', 'size':3, 'shape':'L', 'rot':'all', 'color':'yellow'}
    puzzle.grid[9][5] = {'type':'poly', 'size':4, 'shape':'J', 'rot':'all', 'color':'yellow'}
    puzzle.gaps = [
      {'x':1, 'y':2},{'x':1, 'y':8}, {'x':9, 'y':2}, {'x':9, 'y':8}
    ]
    return puzzle
  }
  function() {
    var puzzle = new Puzzle(5, 5)
    puzzle.grid[3][1] = {'type':'poly', 'size':4, 'shape':'T', 'rot':'all', 'color':'yellow'}
    puzzle.grid[5][7] = {'type':'poly', 'size':5, 'shape':'L', 'rot':'all', 'color':'yellow'}
    puzzle.grid[9][1] = {'type':'poly', 'size':2, 'shape':'/', 'rot':'all', 'color':'yellow'}
    return puzzle
  }
  function() {
    var puzzle = new Puzzle(5, 5)
    puzzle.grid[1][7] = {'type':'poly', 'size':4, 'shape':'L', 'rot':'all', 'color':'yellow'}
    puzzle.grid[5][1] = {'type':'poly', 'size':4, 'shape':'L', 'rot':'all', 'color':'yellow'}
    puzzle.grid[9][1] = {'type':'poly', 'size':6, 'shape':'?', 'rot':0, 'color':'yellow'}
    return puzzle
  }
  function() {
    var puzzle = new Puzzle(5, 5)
    puzzle.grid[1][5] = {'type':'poly', 'size':1, 'shape':'O', 'rot':0, 'color':'yellow'}
    puzzle.grid[5][1] = {'type':'poly', 'size':3, 'shape':'V', 'rot':'all', 'color':'yellow'}
    puzzle.grid[5][9] = {'type':'poly', 'size':3, 'shape':'V', 'rot':'all', 'color':'yellow'}
    puzzle.grid[9][5] = {'type':'poly', 'size':5, 'shape':'V', 'rot':'all', 'color':'yellow'}
    return puzzle
  }
  */
  function() {
    var puzzle = new Puzzle(3, 3)
    puzzle.grid[1][1] = {'type':'poly', 'size':2, 'shape':'I', 'rot':1, 'color':'yellow'}
    puzzle.grid[5][5] = {'type':'poly', 'size':4, 'shape':'O', 'rot':0, 'color':'yellow'}
    return puzzle
  }

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
        if (edges == 16) {console.log(solution)}
        if (edges < minEdges || (edges == minEdges && corners < minCorners)) {
          minEdges = edges
          minCorners = corners
          minSolution = solution
        }
      }
      console.log('Minimum solution out of', solutions.length, 'has', minEdges, 'edges and', minCorners, 'corners:', minSolution)
      if (minSolution != undefined) {
        minSolution.start = puzzle.start
        draw(minSolution, 'test'+i)
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
