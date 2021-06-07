namespace(function() {

window.Region = class {
  constructor(length) {
    this.cells = []
    this.grid = []
    for (var x=0; x<length; x++) {
      this.grid.push(0)
    }
  }

  getCell(x, y) {
    return ((this.grid[x] & (1 << y)) !== 0)
  }

  setCell(x, y) {
    if (this.getCell(x, y)) return
    this.grid[x] |= (1 << y)
    this.cells.push({'x':x, 'y':y})
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
window.Puzzle = class {
  constructor(width, height, pillar=false) {
    if (pillar === true) {
      this.newGrid(2 * width, 2 * height + 1)
    } else {
      this.newGrid(2 * width + 1, 2 * height + 1)
    }
    this.pillar = pillar
    this.settings = {
      // If true, negation symbols are allowed to cancel other negation symbols.
      NEGATIONS_CANCEL_NEGATIONS: true,

      // If true, and the count of polyominos and onimoylops is zero, they cancel regardless of shape.
      SHAPELESS_ZERO_POLY: false,

      // If true, the traced line cannot go through the placement of a polyomino.
      PRECISE_POLYOMINOS: true,

      // If false, incorrect elements will not flash when failing the puzzle.
      FLASH_FOR_ERRORS: true,

      // If true, mid-segment startpoints will constitute solid lines, and form boundaries for the region.
      FAT_STARTPOINTS: false,
    }
  }

  static deserialize(json) {
    var parsed = JSON.parse(json)
    // Claim that it's not a pillar (for consistent grid sizing), then double-check ourselves later.
    var puzzle = new Puzzle((parsed.grid.length - 1)/2, (parsed.grid[0].length - 1)/2)
    puzzle.name = parsed.name
    puzzle.autoSolved = parsed.autoSolved
    puzzle.grid = parsed.grid
    puzzle.theme = parsed.theme
    // Legacy: Grid squares used to use 'false' to indicate emptiness.
    // Legacy: Cells may use {} to represent emptiness
    // Now, we use:
    // Cells default to null
    // Lines default to {'type':'line', 'line':0}
    for (var x=0; x<puzzle.width; x++) {
      for (var y=0; y<puzzle.height; y++) {
        var cell = puzzle.grid[x][y]
        if (cell === false || cell == null || cell.type == null) {
          if (x%2 === 1 && y%2 === 1) puzzle.grid[x][y] = null
          else puzzle.grid[x][y] = {'type':'line', 'line':window.LINE_NONE}
        } else {
          if (cell.type === 'poly' || cell.type === 'ylop' || cell.type === 'polynt') {
            if (cell.rot === 'all') {
              // Legacy: Polys and ylops used to have a rot value (before I started using polyshape).
              // rot=all is a holdover that was used to represent rotation polyominos.
              puzzle.grid[x][y].polyshape |= window.ROTATION_BIT
              delete puzzle.grid[x][y].rot
            }
            // Fixup: Sometimes we have a polyshape which is empty. Just ignore these objects.
            if (puzzle.grid[x][y].polyshape & ~window.ROTATION_BIT === 0) puzzle.grid[x][y] = null
          } else if ((x%2 !== 1 || y%2 !== 1) && cell.color != null) {
            // Legacy: Lines used to use 'line' instead of 'color'
            cell.line = cell.color
            delete cell.color
          } else if (cell.gap === true) {
            // Legacy: Gaps used to be null/true, are now null/1/2
            puzzle.grid[x][y].gap = window.GAP_BREAK
          }
        }
      }
    }
    // Legacy: Startpoints used to be only parsed.start
    if (parsed.start) {
      parsed.startPoints = [parsed.start]
    }
    // Legacy: Startpoints used to be a separate array, now they are flags
    if (parsed.startPoints) {
      for (var startPoint of parsed.startPoints) {
        puzzle.grid[startPoint.x][startPoint.y].start = true
      }
    }
    // Legacy: Endpoints used to be only parsed.end
    if (parsed.end) {
      parsed.endPoints = [parsed.end]
    }
    // Legacy: Endpoints used to be a separate array, now they are flags
    if (parsed.endPoints) {
      for (var endPoint of parsed.endPoints) {
        puzzle.grid[endPoint.x][endPoint.y].end = endPoint.dir
      }
    }
    // Legacy: Dots and gaps used to be separate arrays
    // Now, they are flags on the individual lines.
    if (parsed.dots) {
      for (var dot of parsed.dots) {
        puzzle.grid[dot.x][dot.y].dot = window.DOT_BLACK
      }
    }
    if (parsed.gaps) {
      for (var gap of parsed.gaps) {
        puzzle.grid[gap.x][gap.y].gap = window.GAP_BREAK
      }
    }
    if (parsed.settings) {
      for (var key of Object.keys(parsed.settings)) {
        puzzle.settings[key] = parsed.settings[key]
      }
    }
    puzzle.pillar = parsed.pillar
    puzzle.symmetry = parsed.symmetry
    puzzle.largezero = puzzle.width * puzzle.height
    return puzzle
  }

  serialize() {
    return JSON.stringify(this)
  }

  clone() {
    return Puzzle.deserialize(this.serialize())
  }

  // This is explicitly *not* just clearing the grid, so that external references
  // to the grid are not also cleared.
  newGrid(width, height) {
    if (width == null) { // Called by someone who just wants to clear the grid.
      width = this.width
      height = this.height
    }
    this.grid = []
    for (var x=0; x<width; x++) {
      this.grid[x] = []
      for (var y=0; y<height; y++) {
        if (x%2 === 1 && y%2 === 1) this.grid[x][y] = null
        else this.grid[x][y] = {'type':'line', 'line':LINE_NONE}
      }
    }
    // Performance: A large value which is === 0 to be used for pillar wrapping.
    // Performance: Getting the size of the grid has a nonzero cost.
    // Definitely getting the length of the first element isn't optimized.
    this.largezero = width * height * 2
    this.width = this.grid.length
    this.height = this.grid[0].length
  }

  // Wrap a value around at the width of the grid. No-op if not in pillar mode.
  _mod(val) {
    if (this.pillar === false) return val
    return (val + this.largezero) % this.width
  }

  // Determine if an x, y pair is a safe reference inside the grid. This should be invoked at the start of every
  // function, but then functions can access the grid directly.
  _safeCell(x, y) {
    if (x < 0 || x >= this.width) return false
    if (y < 0 || y >= this.height) return false
    return true
  }

  getCell(x, y) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return null
    return this.grid[x][y]
  }

  setCell(x, y, value) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return
    this.grid[x][y] = value
  }

  getSymmetricalDir(dir) {
    if (this.symmetry != null) {
      if (this.symmetry.x === true) {
        if (dir === 'left') return 'right'
        if (dir === 'right') return 'left'
      }
      if (this.symmetry.y === true) {
        if (dir === 'top') return 'bottom'
        if (dir === 'bottom') return 'top'
      }
    }
    return dir
  }

  getSymmetricalPos(x, y) {
    if (this.symmetry != null) {
      if (this.pillar === true) {
        x += this.width/2
        if (this.symmetry.x === true) {
          x = this.width - x
        }
      } else {
        if (this.symmetry.x === true) {
          x = (this.width - 1) - x
        }
      }
      if (this.symmetry.y === true) {
        y = (this.height - 1) - y
      }
    }
    return {'x':this._mod(x), 'y':y}
  }

  getSymmetricalCell(x, y) {
    var pos = this.getSymmetricalPos(x, y)
    return this.getCell(pos.x, pos.y)
  }

  matchesSymmetricalPos(x1, y1, x2, y2) {
    return (this._mod(x1) === x2 && y1 === y2)
  }

  // A variant of getCell which specifically returns line values,
  // and treats objects as being out-of-bounds
  getLine(x, y) {
    var cell = this.getCell(x, y)
    if (cell == null) return null
    if (cell.type !== 'line') return null
    return cell.line
  }

  updateCell2(x, y, key, value) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return
    var cell = this.grid[x][y]
    if (cell == null) return
    cell[key] = value
  }


  getValidEndDirs(x, y) {
    let isEmpty = function(cell) { return (cell == null || cell.gap == window.GAP_FULL) }
    x = this._mod(x)
    if (!this._safeCell(x, y)) return []

    var dirs = []
    if (this.symmetry) {
      let axisx = this.symmetry.x ? -1 : 1;
      let axisy = this.symmetry.y ? -1 : 1;
      let symx = this.symmetry.x ? puzzle.width  - 1 - x : x;
      let symy = this.symmetry.y ? puzzle.height - 1 - y : y;
      if (isEmpty(this.getCell(x - 1, y)) && isEmpty(this.getCell(symx - axisx, symy))) dirs.push('left')
      if (isEmpty(this.getCell(x, y - 1)) && isEmpty(this.getCell(symx, symy - axisy))) dirs.push('top')
      if (isEmpty(this.getCell(x + 1, y)) && isEmpty(this.getCell(symx + axisx, symy))) dirs.push('right')
      if (isEmpty(this.getCell(x, y + 1)) && isEmpty(this.getCell(symx, symy + axisy))) dirs.push('bottom')
    } else {
      if (isEmpty(this.getCell(x - 1, y))) dirs.push('left')
      if (isEmpty(this.getCell(x, y - 1))) dirs.push('top')
      if (isEmpty(this.getCell(x + 1, y))) dirs.push('right')
      if (isEmpty(this.getCell(x, y + 1))) dirs.push('bottom')
    }
    return dirs
  }

  // Called on a solution. Computes a list of gaps to show as hints which *do not*
  // break the path.
  loadHints() {
    this.hints = []
    for (var x=0; x<this.width; x++) {
      for (var y=0; y<this.height; y++) {
        if (x%2 + y%2 === 1 && this.getLine(x, y) > window.LINE_NONE) {
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
    if (hint != null) {
      this.grid[hint.x][hint.y].gap = window.GAP_BREAK
      return
    }

    var goodHints = []
    var badHints = []

    for (var hint of this.hints) {
      if (this.getLine(hint.x, hint.y) > window.LINE_NONE) {
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
    this.grid[hint.x][hint.y].gap = window.GAP_BREAK
    this.hints = badHints.concat(goodHints)
    return hint
  }

  clearLines() {
    for (var x=0; x<this.width; x++) {
      for (var y=0; y<this.height; y++) {
        this.updateCell2(x, y, 'line', 0)
        this.updateCell2(x, y, 'dir', null)
      }
    }
  }

  _floodFill(x, y, region) {
    // Inlined safety checks so we can get the col, which is slightly more performant.
    x = this._mod(x)
    if (!this._safeCell(x, y)) return

    var col = this.grid[x]
    var cell = col[y]
    if (cell === MASKED_PROCESSED) return
    if (cell !== MASKED_INB_NONCOUNT) {
      region.setCell(x, y)
    }
    col[y] = MASKED_PROCESSED

    this._floodFill(x, y + 1, region)
    this._floodFill(x + 1, y, region)
    this._floodFill(x, y - 1, region)
    this._floodFill(x - 1, y, region)
  }

  // Re-uses the same grid, but only called on edges which border the outside
  // Called first to mark cells that are connected to the outside, i.e. should not be part of any region.
  _floodFillOutside(x, y) {
    // Needs safety checks because we're going around corners.
    // Inlined so that we can easily set the cell after.
    x = this._mod(x)
    if (!this._safeCell(x, y)) return
    var cell = this.grid[x][y]
    if (cell === MASKED_PROCESSED) return
    if (x%2 !== y%2 && cell !== MASKED_GAP2) return // Only flood-fill through gap-2
    if (x%2 === 0 && y%2 === 0 && cell === MASKED_DOT) return // Don't flood-fill through dots
    this.grid[x][y] = MASKED_PROCESSED

    if (x%2 === 0 && y%2 === 0) return // Don't flood fill through corners

    this._floodFillOutside(x, y + 1)
    this._floodFillOutside(x + 1, y)
    this._floodFillOutside(x, y - 1)
    this._floodFillOutside(x - 1, y)
  }

  // Returns the original grid (pre-masking). You will need to switch back once you are done flood filling.
  switchToMaskedGrid() {
    // Make a copy of the grid -- we will be overwriting it
    var savedGrid = this.grid
    this.grid = []
    // Override all elements with empty lines -- this means that flood fill is just
    // looking for lines with line=0.
    for (var x=0; x<this.width; x++) {
      var savedRow = savedGrid[x]
      var row = []
      for (var y=0; y<this.height; y++) {
        // Cells are always part of the region
        if (x%2 === 1 && y%2 === 1) {
          row.push(MASKED_INB_COUNT)
          continue;
        }

        var cell = savedRow[y]
        if (cell.line > window.LINE_NONE) {
          row.push(MASKED_PROCESSED) // Traced lines should not be a part of the region
        } else if (cell.gap === window.GAP_FULL) {
          row.push(MASKED_GAP2)
        } else if (cell.dot > window.DOT_NONE) {
          row.push(MASKED_DOT)
        } else {
          row.push(MASKED_INB_COUNT)
        }
      }
      this.grid[x] = row
    }

    // Starting at a mid-segment startpoint
    if (this.startPoint != null && this.startPoint.x%2 !== this.startPoint.y%2) {
      if (this.settings.FAT_STARTPOINTS) {
        // This segment is not in any region (acts as a barrier)
        this.grid[this.startPoint.x][this.startPoint.y] = MASKED_OOB
      } else {
        // This segment is part of this region (acts as an empty cell)
        this.grid[this.startPoint.x][this.startPoint.y] = MASKED_INB_NONCOUNT
      }
    }

    // Ending at a mid-segment endpoint
    if (this.endPoint != null && this.endPoint.x%2 !== this.endPoint.y%2) {
      // This segment is part of this region (acts as an empty cell)
      this.grid[this.endPoint.x][this.endPoint.y] = MASKED_INB_NONCOUNT
    }

    // Mark all outside cells as 'not in any region' (aka null)

    if (this.pillar === false) {
      // Left and right edges (only applies to non-pillars)
      for (var y=1; y<this.height; y+=2) {
        this._floodFillOutside(0, y)
        this._floodFillOutside(this.width - 1, y)
      }
    }

    // Top and bottom edges
    for (var x=1; x<this.width; x+=2) {
      this._floodFillOutside(x, 0)
      this._floodFillOutside(x, this.height - 1)
    }

    return savedGrid
  }

  getRegions() {
    var regions = []
    var savedGrid = this.switchToMaskedGrid()

    for (var x=0; x<this.width; x++) {
      for (var y=0; y<this.height; y++) {
        if (this.grid[x][y] == MASKED_PROCESSED) continue;

        // If this cell is empty (aka hasn't already been used by a region), then create a new one
        // This will also mark all lines inside the new region as used.
        var region = new Region(this.width)
        this._floodFill(x, y, region)
        regions.push(region)
      }
    }
    this.grid = savedGrid
    return regions
  }

  getRegion(x, y) {
    x = this._mod(x)
    if (!this._safeCell(x, y)) return

    var savedGrid = this.switchToMaskedGrid()
    if (this.grid[x][y] == MASKED_PROCESSED) {
      this.grid = savedGrid
      return null
    }

    // If the masked grid hasn't been used at this point, then create a new region.
    // This will also mark all lines inside the new region as used.
    var region = new Region(this.width)
    this._floodFill(x, y, region)

    this.grid = savedGrid
    return region
  }

  logGrid() {
    var output = ''
    for (var y=0; y<this.height; y++) {
      for (var x=0; x<this.width; x++) {
        var cell = this.getCell(x, y)
        if (cell == null) output += ' '
        else if (typeof(cell) == 'number') output += cell
        else if (cell.start === true) output += 'S'
        else if (cell.end != null) output += 'E'
        else if (cell.type === 'line') {
          if (cell.line === 0) output += '.'
          if (cell.line === 1) output += '#'
          if (cell.line === 2) output += '#'
          if (cell.line === 3) output += 'o'
        }
        else output += '?'
      }
      output += '\n'
    }
    console.log(output)
  }
}

// The grid contains 5 colors:
// null: Out of bounds or already processed
var MASKED_OOB = null
var MASKED_PROCESSED = null
// 0: In bounds, awaiting processing, but should not be part of the final region.
var MASKED_INB_NONCOUNT = 0
// 1: In bounds, awaiting processing
var MASKED_INB_COUNT = 1
// 2: Gap-2. After _floodFillOutside, this means "treat normally" (it will be null if oob)
var MASKED_GAP2 = 2
// 3: Dot (of any kind), otherwise identical to 1. Should not be flood-filled through (why the f do we need this)
var MASKED_DOT = 3

})
