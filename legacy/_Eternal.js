var tests = [
  /* Various */
  function() {
    var grid = _newGrid(3, 3)
    grid[1][1] = {'type':'tri', 'color':'orange', 'count':2}
    grid[3][1] = {'type':'star', 'color':'orange'}
    grid[5][1] = {'type':'star', 'color':'orange'}
    grid[5][3] = {'type':'tri', 'color':'orange', 'count':2}
    return {
      'grid':grid,
      'start':{'x':0, 'y':0},
      'end':{'x':0, 'y':6},
      'dots':[{'x':1, 'y':2}, {'x':5, 'y':6}],
      'gaps':[{'x':1, 'y':6}]
    }
  }, function() {
    var grid = _newGrid(5, 4)
    grid[1][1] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[1][5] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[3][1] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[3][5] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[5][1] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[5][3] = {'type':'ylop','color':'blue','size':9,'shape':'O','rot':0}
    grid[5][5] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[7][1] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[7][5] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[9][1] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    grid[9][5] = {'type':'poly','color':'yellow','size':1,'shape':'O','rot':0}
    var dots = []
    for (var x=0; x<grid.length; x+=2) {
      for (var y=0; y<grid[x].length; y+=2) {
        if (x == 4 && y == 6) continue
        if (x == 0 && y == 8) continue
        dots.push({'x':x, 'y':y})
      }
    }
    return {
      'grid':grid,
      'start':{'x':4, 'y':6},
      'end':{'x':0, 'y':8},
      'dots':dots,
      'gaps':[{'x':1, 'y':6}, {'x':3, 'y':4}]
    }
  }, function() {
    var grid = _newGrid(5, 4)
    grid[1][1] = {'type':'square', 'color':'white'}
    grid[1][3] = {'type':'square', 'color':'black'}
    grid[1][5] = {'type':'square', 'color':'black'}
    grid[3][1] = {'type':'square', 'color':'white'}
    grid[3][7] = {'type':'square', 'color':'cyan'}
    grid[5][1] = {'type':'square', 'color':'black'}
    grid[7][1] = {'type':'square', 'color':'cyan'}
    grid[7][7] = {'type':'square', 'color':'white'}
    grid[9][1] = {'type':'square', 'color':'cyan'}
    grid[9][3] = {'type':'square', 'color':'black'}
    grid[9][5] = {'type':'square', 'color':'black'}
    return {
      'grid':grid,
      'start':{'x':10, 'y':0},
      'end':{'x':0, 'y':8},
      'gaps':[{'x':1, 'y':6}, {'x':9, 'y':6}]
    }
  }, function() {
    var grid = _newGrid(5, 4)
    grid[3][1] = {'type':'poly','color':'yellow','size':2,'shape':'/','rot':1}
    grid[3][7] = {'type':'poly','color':'yellow','size':2,'shape':'/','rot':0}
    grid[5][3] = {'type':'poly','color':'yellow','size':3,'shape':'V','rot':2}
    grid[5][5] = {'type':'poly','color':'yellow','size':3,'shape':'V','rot':0}
    grid[7][1] = {'type':'poly','color':'yellow','size':2,'shape':'/','rot':0}
    grid[7][7] = {'type':'poly','color':'yellow','size':2,'shape':'/','rot':1}
    return {
      'grid':grid,
      'start':{'x':10, 'y':0},
      'end':{'x':10, 'y':8},
      'gaps':[{'x':1, 'y':4}, {'x':9, 'y':4}]
    }
  }, function() {
    var grid = _newGrid(5, 6)
    grid[1][5] = {'type':'tri', 'color':'orange', 'count':1}
    grid[3][3] = {'type':'tri', 'color':'orange', 'count':1}
    grid[3][5] = {'type':'tri', 'color':'orange', 'count':3}
    grid[3][7] = {'type':'tri', 'color':'orange', 'count':1}
    grid[5][3] = {'type':'tri', 'color':'orange', 'count':1}
    grid[5][7] = {'type':'tri', 'color':'orange', 'count':1}
    grid[7][3] = {'type':'tri', 'color':'orange', 'count':1}
    grid[7][7] = {'type':'tri', 'color':'orange', 'count':1}
    grid[9][3] = {'type':'tri', 'color':'orange', 'count':1}
    grid[9][7] = {'type':'tri', 'color':'orange', 'count':1}
    return {
      'grid':grid,
      'start':{'x':10, 'y':4},
      'end':{'x':10, 'y':6},
      'dots':[{'x':0, 'y':9}],
      'gaps':[{'x':1, 'y':12}, {'x':3, 'y':12}, {'x':5, 'y':10}, {'x':10, 'y':11}]
    }
  }, function() {
    var grid = _newGrid(5, 6)
    grid[1][9] = {'type':'square', 'color':'black'}
    grid[3][3] = {'type':'tri', 'color':'orange', 'count':1}
    grid[3][7] = {'type':'tri', 'color':'orange', 'count':1}
    grid[3][9] = {'type':'square', 'color':'black'}
    grid[3][11] = {'type':'tri', 'color':'orange', 'count':1}
    grid[5][3] = {'type':'tri', 'color':'orange', 'count':1}
    grid[5][7] = {'type':'tri', 'color':'orange', 'count':1}
    grid[5][11] = {'type':'tri', 'color':'orange', 'count':1}
    grid[7][3] = {'type':'tri', 'color':'orange', 'count':1}
    grid[7][7] = {'type':'tri', 'color':'orange', 'count':1}
    grid[7][11] = {'type':'tri', 'color':'orange', 'count':1}
    grid[9][3] = {'type':'tri', 'color':'orange', 'count':1}
    grid[9][7] = {'type':'tri', 'color':'orange', 'count':1}
    grid[9][11] = {'type':'tri', 'color':'orange', 'count':1}
    return {
      'grid':grid,
      'start':{'x':10, 'y':4},
      'end':{'x':10, 'y':6},
      'dots':[{'x':0, 'y':9}],
      'gaps':[{'x':0, 'y':1}, {'x':2, 'y':11}]
    }
  }, function() {
    var grid = _newGrid(5, 4)
    grid[5][3] = {'type':'poly','color':'yellow','size':11,'shape':'?','rot':'all'}
    grid[5][5] = {'type':'ylop','color':'blue','size':2,'shape':'I','rot':1}
    return {
      'grid':grid,
      'start':{'x':10, 'y':0},
      'end':{'x':0, 'y':8},
      'dots':[],
      'gaps':[{'x':0, 'y':5}, {'x':0, 'y':7}, {'x':2, 'y':1}, {'x':3, 'y':8}, {'x':8, 'y':7}]
    }
  }, function() {
    var grid = _newGrid(5, 4)
    grid[1][1] = {'type':'star', 'color':'yellow'}
    grid[1][3] = {'type':'nega', 'color':'white'}
    grid[1][5] = {'type':'star', 'color':'yellow'}
    grid[3][1] = {'type':'star', 'color':'yellow'}
    grid[3][3] = {'type':'star', 'color':'yellow'}
    grid[3][5] = {'type':'square', 'color':'yellow'}
    grid[5][1] = {'type':'star', 'color':'yellow'}
    grid[7][1] = {'type':'star', 'color':'yellow'}
    grid[7][5] = {'type':'star', 'color':'yellow'}
    grid[9][1] = {'type':'star', 'color':'yellow'}
    grid[9][3] = {'type':'star', 'color':'yellow'}
    return {
      'grid':grid,
      'start':{'x':10, 'y':0},
      'end':{'x':0, 'y':0},
      'gaps':[{'x':0, 'y':7}, {'x':2, 'y':7}, {'x':6, 'y':7}, {'x':8, 'y':7}]
    }
  }, function() {
    var grid = _newGrid(5, 5)
    grid[5][5] = {'type':'star', 'color':'cyan'}
    grid[7][3] = {'type':'square', 'color':'cyan'}
    grid[7][7] = {'type':'square', 'color':'cyan'}
    grid[9][1] = {'type':'star', 'color':'cyan'}
    grid[9][9] = {'type':'star', 'color':'cyan'}
    return {
      'grid':grid,
      'start':{'x':10, 'y':0},
      'end':{'x':0, 'y':10},
      'dots':[{'x':2, 'y':1}, {'x':2, 'y':5}, {'x':2, 'y':9}, {'x':4, 'y':3}, {'x':4, 'y':7}, {'x':6, 'y':1}, {'x':6, 'y':9}],
      'gaps':[{'x':1, 'y':0}, {'x':1, 'y':10}, {'x':2, 'y':3}, {'x':2, 'y':7}, {'x':4, 'y':1}, {'x':4, 'y':9}]
    }
  }, function() {
    var grid = _newGrid(5, 5)
    grid[1][1] = {'type':'poly','color':'yellow','size':4,'shape':'O','rot':0}
    grid[1][9] = {'type':'poly','color':'yellow','size':4,'shape':'O','rot':0}
    grid[3][3] = {'type':'poly','color':'yellow','size':4,'shape':'O','rot':0}
    grid[3][7] = {'type':'poly','color':'yellow','size':4,'shape':'O','rot':0}
    grid[5][5] = {'type':'poly','color':'yellow','size':3,'shape':'L','rot':'all'}
    return {
      'grid':grid,
      'start':{'x':0, 'y':0},
      'end':{'x':10, 'y':0},
      'gaps':[{'x':6, 'y':5}, {'x':10, 'y':5}]
    }
  }, function() {
    var grid = _newGrid(3, 3)
    grid[1][1] = {'type':'poly','color':'yellow','size':2,'shape':'I','rot':0}
    grid[1][3] = {'type':'nega', 'color':'white'}
    grid[1][5] = {'type':'poly','color':'yellow','size':2,'shape':'I','rot':0}
    grid[3][3] = {'type':'poly','color':'yellow','size':2,'shape':'I','rot':1}
    grid[5][3] = {'type':'poly','color':'yellow','size':2,'shape':'I','rot':1}
    return {
      'grid':grid,
      'start':{'x':6, 'y':0},
      'end':{'x':0, 'y':0},
      'gaps':[{'x':0, 'y':3}, {'x':1, 'y':0}, {'x':4, 'y':1}]
    }
  }, function() {
    var grid = _newGrid(3, 3)
    grid[1][1] = {'type':'poly','color':'yellow','size':2,'shape':'I','rot':0}
    grid[1][3] = {'type':'nega', 'color':'white'}
    grid[1][5] = {'type':'poly','color':'yellow','size':2,'shape':'I','rot':0}
    grid[3][3] = {'type':'poly','color':'yellow','size':2,'shape':'I','rot':1}
    grid[5][3] = {'type':'poly','color':'yellow','size':2,'shape':'I','rot':1}
    return {
      'grid':grid,
      'start':{'x':6, 'y':0},
      'end':{'x':0, 'y':6},
      'gaps':[{'x':0, 'y':3}, {'x':1, 'y':0}, {'x':4, 'y':1}]
    }
  }
]

var index
window.onload = function() {
  index = parseInt(location.hash.substring(1))
  if (!index) index = 0
  loadTests()
}

function loadTests() {
  index++
  var start = (new Date()).getTime()
  for (var i=0; i<tests.length; i++) {
    try {
      var solutions = []
      var puzzle = tests[i]()
      if (puzzle['start'] == null) {
        puzzle['start'] = {'x':puzzle.grid.length-1, 'y':0}
      }
      if (puzzle['end'] == null) {
        puzzle['end'] = {'x':0, 'y':puzzle.grid[0].length-1}
      }
      if (puzzle['dots'] == null) {
        puzzle['dots'] = []
      }
      if (puzzle['gaps'] == null) {
        puzzle['gaps'] = []
      }
      solve(puzzle, puzzle.start.x, puzzle.start.y, solutions)
      console.log('Solved', puzzle, 'found', solutions.length, 'solutions')
      console.log('Drawing solution', index % solutions.length+1, 'of', solutions.length)
      draw(solutions[index % solutions.length], 'test'+i)
    } catch (e) {
      document.getElementById('test'+i).innerHTML = e.stack
      continue
    }
  }
  var end = (new Date()).getTime()
  document.getElementById('load').innerHTML = (end - start)/1000 + ' seconds'
}
