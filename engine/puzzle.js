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
    if ((this.grid[x] & (1 << y)) !== 0) return
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
      this.newGrid(2 * width, 2 * height + 1)
    } else {
      this.newGrid(2 * width + 1, 2 * height + 1)
    }
    this.regionCache = {}
    this.pillar = pillar
  }

  static deserialize(json) {
    var parsed = JSON.parse(json)
    var puzzle = new Puzzle()
    puzzle.name = parsed.name
    puzzle.grid = parsed.grid
    // @Legacy: Grid squares used to use 'false' to indicate emptiness. Now, we use:
    // Cells default to undefined
    // Lines default to {'type':'line', 'color':0}
    for (var x=0; x<puzzle.grid.length; x++) {
      for (var y=0; y<puzzle.grid[x].length; y++) {
        var cell = puzzle.grid[x][y]
        if (cell === false) {
          if (x%2 === 1 && y%2 === 1) puzzle.grid[x][y] = undefined
          else puzzle.grid[x][y] = {'type':'line', 'color':0}
        } else if (cell != undefined && cell.gap === true) {
          // @Legacy: Gaps used to be undefined/true, are now undefined/1/2
          puzzle.grid[x][y].gap = 1
        }
      }
    }
    // @Legacy: Startpoints used to be only parsed.start
    if (parsed.start) {
      parsed.startPoints = [parsed.start]
    }
    // @Legacy: Startpoints used to be a separate array, now they are flags
    if (parsed.startPoints) {
      for (var startPoint of parsed.startPoints) {
        puzzle.grid[startPoint.x][startPoint.y].start = true
      }
    }
    // @Legacy: Endpoints used to be only parsed.end
    if (parsed.end) {
      parsed.endPoints = [parsed.end]
    }
    // @Legacy: Endpoints used to be a separate array, now they are flags
    if (parsed.endPoints) {
      for (var endPoint of parsed.endPoints) {
        puzzle.grid[endPoint.x][endPoint.y].end = endPoint.dir
      }
    }
    // @Legacy: Dots and gaps used to be separate arrays
    // Now, they are flags on the individual lines.
    if (parsed.dots) {
      for (var dot of parsed.dots) {
        puzzle.grid[dot.x][dot.y].dot = 1
      }
    }
    if (parsed.gaps) {
      for (var gap of parsed.gaps) {
        puzzle.grid[gap.x][gap.y].gap = 1
      }
    }
    puzzle.regionCache = parsed.regionCache
    puzzle.pillar = parsed.pillar
    puzzle.symmetry = parsed.symmetry
    return puzzle
  }

  serialize() {
    return JSON.stringify(this)
  }

  // This is explicitly *not* just clearing the grid, so that external references
  // to the grid are not also cleared.
  newGrid(width, height) {
    if (width == undefined) { // Called by someone who just wants to clear the grid.
      width = this.grid.length
      height = this.grid[0].length
    }
    this.grid = []
    for (var x=0; x<width; x++) {
      this.grid[x] = []
      for (var y=0; y<height; y++) {
        if (x%2 === 1 && y%2 === 1) this.grid[x][y] = undefined
        else this.grid[x][y] = {'type':'line', 'color':0}
      }
    }
  }

  // Wrap a value around at the width of the grid. No-op if not in pillar mode.
  _mod(val) {
    if (!this.pillar) return val
    // @Performance: Pre-compute a large, safe modulo value (maybe width * height * 2?)
    // return (val + largezero) % this.grid.length
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

  getSymmetricalDir(dir) {
    if (this.symmetry == undefined) return dir
    if (this.symmetry.x === true) {
      if (dir === 'left') return 'right'
      if (dir === 'right') return 'left'
    }
    if (this.symmetry.y === true) {
      if (dir === 'top') return 'bottom'
      if (dir === 'bottom') return 'top'
    }
  }

  getSymmetricalPos(x, y) {
    if (this.symmetry != undefined) {
      if (this.pillar) x += this.grid.length/2 - 1
      if (this.symmetry.x === true) {
        x = (this.grid.length - 1) - x
      }
      if (this.symmetry.y === true) {
        y = (this.grid[0].length - 1) - y
      }
    }
    return {'x':x, 'y':y}
  }

  // A variant of getCell which specifically returns line values,
  // and treats objects as being out-of-bounds
  getLine(x, y) {
    var cell = this.getCell(x, y)
    if (cell == undefined) return undefined
    if (cell.type !== 'line') return undefined
    return cell.color
  }

  // A variant of setCell which updates the contents, instead of overwriting.
  updateCell(x, y, properties) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return
    Object.assign(this.grid[x][y], properties)
  }

  getValidEndDirs(x, y) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return []

    var dirs = []
    if (x === 0 && !this.pillar) dirs.push('left')
    if (y === 0) dirs.push('top')
    if (x === this.grid.length - 1 && !this.pillar) dirs.push('right')
    if (y === this.grid[x].length - 1) dirs.push('bottom')
    return dirs
  }

  // Called on a solution. Computes a list of gaps to show as hints which *do not*
  // break the path.
  loadHints() {
    this.hints = []
    for (var x=0; x<this.grid.length; x++) {
      for (var y=0; y<this.grid[x].length; y++) {
        if (x%2 + y%2 === 1 && this.getLine(x, y) > 0) {
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
      this.grid[hint.x][hint.y].gap = 1
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
      var hint = goodHints.splice(window.randInt(goodHints.length), 1)[0]
    } else if (badHints.length > 0) {
      var hint = badHints.splice(window.randInt(badHints.length), 1)[0]
    } else {
      return
    }
    this.grid[hint.x][hint.y].gap = 1
    this.hints = badHints.concat(goodHints)
    return hint
  }

  clearLines() {
    for (var x=0; x<this.grid.length; x++) {
      for (var y=0; y<this.grid[x].length; y++) {
        if (x%2 === 1 && y%2 === 1) continue
        else Object.assign(this.grid[x][y], {'color':0, 'dir':undefined})
      }
    }
  }

  _floodFill(x, y, region) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return
    if (this.grid[x][y] === undefined) return
    region.setCell(x, y)
    this.setCell(x, y, undefined)

    // @Performance: Why is this ordered TLBR?
    this._floodFill(x, y + 1, region)
    this._floodFill(x + 1, y, region)
    this._floodFill(x, y - 1, region)
    this._floodFill(x - 1, y, region)
  }

  getRegions() {
    // Make a copy of the grid -- we will be overwriting it
    var savedGrid = this.grid
    this.newGrid()
    // Override all elements with empty lines -- this means that flood fill is just
    // looking for lines with color 0.
    for (var x=0; x<savedGrid.length; x++) {
      for (var y=0; y<savedGrid[x].length; y++) {
        var cell = savedGrid[x][y]
        if (cell != undefined && cell.type === 'line' && cell.color > 0) {
          this.grid[x][y] = undefined
        } else {
          this.grid[x][y] = true
        }
      }
    }

    var regions = []
    for (var x=0; x<this.grid.length; x++) {
      for (var y=0; y<this.grid[x].length; y++) {
        if (this.grid[x][y] == undefined) continue

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
    // If the log level is too low, skip this
    if (console.log.toString().length == 13) return
    var output = ''
    for (var y=0; y<this.grid[0].length; y++) {
      for (var x=0; x<this.grid.length; x++) {
        var cell = this.getCell(x, y)
        if (cell == undefined) output += '?'
        else if (cell.type === 'line') output += cell.color
        else output += '#'
      }
      output += '\n'
    }
    console.log(output)
  }
}
