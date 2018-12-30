class Region {
  constructor(length) {
    this.grid = []
    for (var i=0; i<length; i++) {
      this.grid.push(0)
    }
    this.cells = []
  }

  clone() {
    var clone = new Region(this.grid.length)
    this.grid = this.grid.slice()
    this.cells = this.cells.slice()
    return clone
  }

  _mod(val) {
    var mod = this.grid.length
    return ((val % mod) + mod) % mod
  }

  setCell(x, y) {
    x = this._mod(x)
    if ((this.grid[x] & (1 << y)) != 0) return
    this.grid[x] |= (1 << y)
    this.cells.push({'x':x, 'y':y})
  }

  merge(other) {
    this.cells = this.cells.concat(other.cells)
    for (var i=0; i<this.grid.length; i++) {
      this.grid[i] += other.grid[i]
    }
  }
}

// A 2x2 grid is internally a 5x5:
// corner, edge, corner, edge, corner
// edge,   cell, edge,   cell, edge
// corner, edge, corner, edge, corner
// edge,   cell, edge,   cell, edge
// corner, edge, corner, edge, corner
//
// Corners and edges will have a value of true if the line passes through them
// Cells will contain an object if there is an element in them
class Puzzle {
  constructor(width, height, pillar=false) {
    if (pillar) {
      this.grid = this.newGrid(2 * width, 2 * height + 1)
    } else {
      this.grid = this.newGrid(2 * width + 1, 2 * height + 1)
    }
    this.startPoints = []
    this.endPoints = []
    this.dots = []
    this.gaps = []
    this.regionCache = {}
    this.pillar = pillar
  }

  static deserialize(json) {
    var parsed = JSON.parse(json)
    var puzzle = new Puzzle()
    puzzle.name = parsed.name
    puzzle.grid = parsed.grid
    // Legacy -- grid squares used to use 'false' to indicate emptiness. Now, we use:
    // Cells default to undefined
    // Lines default to {'type':'line', 'color':0}
    for (var x=0; x<puzzle.grid.length; x++) {
      for (var y=0; y<puzzle.grid[x].length; y++) {
        if (puzzle.grid[x][y] == false) {
          if (x%2 == 1 && y%2 == 1) puzzle.grid[x][y] = undefined
          else puzzle.grid[x][y] = {'type':'line', 'color':0}
        }
      }
    }
    if (parsed.startPoints) {
      puzzle.startPoints = parsed.startPoints
    } else {
      puzzle.startPoints = [parsed.start]
    }
    if (parsed.endPoints) {
      puzzle.endPoints = parsed.endPoints
    } else {
      puzzle.endPoints = [parsed.end]
    }
    puzzle.dots = parsed.dots
    puzzle.gaps = parsed.gaps
    puzzle.regionCache = parsed.regionCache
    puzzle.pillar = parsed.pillar
    return puzzle
  }

  serialize() {
    return JSON.stringify(this)
  }

  // @Cleanup: Should this just be puzzle.clearGrid?
  newGrid(width, height) {
    var grid = []
    for (var x=0; x<width; x++) {
      grid[x] = []
      for (var y=0; y<height; y++) {
        if (x%2 == 1 && y%2 == 1) grid[x][y] = undefined
        else grid[x][y] = {'type':'line', 'color':0}
      }
    }
    return grid
  }

  copyGrid() {
    var new_grid = []
    for (var row of this.grid) {
      new_grid.push(row.slice())
    }
    return new_grid
  }

  // Wrap a value around at the width of the grid. No-op if not in pillar mode.
  _mod(val) {
    if (!this.pillar) return val
    var mod = this.grid.length
    return ((val % mod) + mod) % mod
  }

  // Determine if an x, y pair is a safe reference inside the grid. This should be invoked at the start of every
  // function, but then functions can access the grid directly.
  _safeCell(x, y) {
    if (x < 0 || x >= this.grid.length) return false
    if (y < 0 || y >= this.grid[x].length) return false
    return true
  }

  getCell(x, y) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return undefined
    return this.grid[x][y]
  }

  setCell(x, y, value) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return
    this.grid[x][y] = value
  }

  // A variant of getCell which specifically returns line values,
  // and treats objects as being out-of-bounds
  getLine(x, y) {
    var cell = this.getCell(x, y)
    if (cell == undefined) return undefined
    if (cell.type != 'line') return undefined
    return cell.color
  }

  // A variant of setCell which updates the contents, instead of overwriting.
  updateCell(x, y, properties) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return
    Object.assign(this.grid[x][y], properties)
  }

  removeStart(x, y) {
    for (var i=0; i<this.startPoints.length; i++) {
      if (this.startPoints[i].x == x && this.startPoints[i].y == y) {
        this.startPoints.splice(i, 1)
        return true
      }
    }
    return false
  }

  addStart(x, y) {
    this.removeStart(x, y)
    this.startPoints.push({'x':x, 'y':y})
  }

  removeEnd(x, y) {
    for (var i=0; i<this.endPoints.length; i++) {
      if (this.endPoints[i].x == x && this.endPoints[i].y == y) {
        this.endPoints.splice(i, 1)
        return true
      }
    }
    return false
  }

  addEnd(x, y, dir) {
    this.removeEnd(x, y)
    this.endPoints.push({'x':x, 'y':y, 'dir':dir})
  }

  getEndDir(x, y) {
    if (this.pillar) x = this._mod(x)
    for (var endPoint of this.endPoints) {
      if (x == endPoint.x && y == endPoint.y) return endPoint.dir
    }
    return undefined
  }

  clone() {
    var copy = new Puzzle(0, 0)
    copy.grid = this.copyGrid()
    copy.startPoints = this.startPoints.slice()
    copy.endPoints = this.endPoints.slice()
    copy.dots = this.dots.slice()
    copy.gaps = this.gaps.slice()
    copy.regionCache = this.regionCache
    copy.pillar = this.pillar
    copy.hints = this.hints
    return copy
  }

  // Called on a solution. Computes a list of gaps to show as hints which *do not*
  // break the path.
  loadHints() {
    this.hints = []
    for (var x=0; x<this.grid.length; x++) {
      for (var y=0; y<this.grid[x].length; y++) {
        if (x%2 + y%2 == 1 && this.getLine(x, y) > 0) {
          this.hints.push({'x':x, 'y':y})
        }
      }
    }
  }

  // Show a hint on the grid.
  // If no hint is provided, will select the best one it can find,
  // prioritizing breaking current lines on the grid.
  // Returns the shown hint.
  showHint(hint) {
    if (hint != undefined) {
      this.gaps.push(hint)
      return
    }

    var goodHints = []
    var badHints = []

    for (var hint of this.hints) {
      if (this.getLine(hint.x, hint.y) > 0) {
        // Solution will be broken by this hint
        goodHints.push(hint)
      } else {
        badHints.push(hint)
      }
    }
    if (goodHints.length > 0) {
      var hint = goodHints.splice(_randint(goodHints.length), 1)[0]
    } else if (badHints.length > 0) {
      var hint = badHints.splice(_randint(badHints.length), 1)[0]
    } else {
      return
    }
    this.gaps.push(hint)
    this.hints = badHints.concat(goodHints)
    return hint
  }

  clearLines() {
    for (var x=0; x<this.grid.length; x++) {
      for (var y=0; y<this.grid[x].length; y++) {
        if (x%2 == 1 && y%2 == 1) continue
        this.grid[x][y] = {'type':'line', 'color':0}
      }
    }
  }

  _floodFill(x, y, region) {
    region.setCell(x, y)
    this.setCell(x, y, {'type':'line', 'color':3})

    // @Performance: Why is this ordered TLBR?
    if (this.getLine(x, y + 1) == 0) {
      this._floodFill(x, y + 1, region)
    }
    if (this.getLine(x + 1, y) == 0) {
      this._floodFill(x + 1, y, region)
    }
    if (this.getLine(x, y - 1) == 0) {
      this._floodFill(x, y - 1, region)
    }
    if (this.getLine(x - 1, y) == 0) {
      this._floodFill(x - 1, y, region)
    }
  }

  getRegions() {
    // Make a copy of the grid -- we will be overwriting it
    var savedGrid = this.copyGrid()

    // Override all elements with empty lines -- this means that flood fill is just
    // looking for lines with color 0.
    for (var x=1; x<this.grid.length; x+=2) {
      for (var y=1; y<this.grid[x].length; y+=2) {
        this.grid[x][y] = {'type':'line', 'color':0}
      }
    }

    var regions = []
    for (var x=0; x<this.grid.length; x++) {
      for (var y=0; y<this.grid[x].length; y++) {
        // Find the next open cell (NB: getLine treats non-lines as undefined)
        if (this.getLine(x, y) > 0) continue

        // If this cell is empty (aka hasn't already been used by a region), then create a new one
        // This will also mark all lines inside the new region as used.
        var region = new Region(this.grid.length)
        this._floodFill(x, y, region)
        regions.push(region)
      }
    }
    this.grid = savedGrid
    return regions
  }

  logGrid() {
    var output = ''
    for (var y=0; y<this.grid[0].length; y++) {
      for (var x=0; x<this.grid.length; x++) {
        var cell = this.getCell(x, y)
        if (cell == undefined) output += '?'
        else if (cell.type == 'line') output += cell.color
        else output += '#'
      }
      output += '\n'
    }
    console.log(output)
  }
}
