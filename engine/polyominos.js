namespace(function() {

function getPolySize(polyshape) {
  var size = 0
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (isSet(polyshape, x, y)) size++
    }
  }
  if (isEnlarged(polyshape)) size *= 4;
  return size
}

function mask(x, y) {
  return 1 << (x*4 + y)
}

function isSet(polyshape, x, y) {
  if (x < 0 || y < 0) return false
  if (x >= 4 || y >= 4) return false
  return (polyshape & mask(x, y)) !== 0
}

function isEnlarged(polyshape) { return (polyshape & 131072) !== 0; }

// This is 2^20, whereas all the other bits fall into 2^(0-15)
window.ROTATION_BIT = mask(5, 0)

window.isRotated = function(polyshape) {
  return (polyshape & ROTATION_BIT) !== 0
}

function getRotations(polyshape) {
  if (!isRotated(polyshape)) return [polyshape]

  var rotations = [0, 0, 0, 0]
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (isSet(polyshape, x, y)) {
        rotations[0] ^= mask(x, y)
        rotations[1] ^= mask(y, 3-x)
        rotations[2] ^= mask(3-x, 3-y)
        rotations[3] ^= mask(3-y, x)
      }
    }
  }

  return rotations
}

// IMPORTANT NOTE: When formulating these, the top row must contain (0, 0)
// That means there will never be any negative y values.
// (0, 0) must also be a cell in the shape, so that
// placing the shape at (x, y) will fill (x, y)
// Ylops will have -1s on all adjacent cells, to break "overlaps" for polyominos.
window.polyominoFromPolyshape = function(polyshape, ylop=false) {
  for (var y=0; y<4; y++) {
    for (var x=0; x<4; x++) {
      if (isSet(polyshape, x, y)) {
        var topLeft = {'x':x, 'y':y}
        break;
      }
    }
    if (topLeft != null) break;
  }
  if (topLeft == null) return [] // Empty polyomino

  var polyomino = []
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (!isSet(polyshape, x, y)) continue;
      if (isEnlarged(polyshape)) {
        polyomino.push({'x':4*(x - topLeft.x)    , 'y':4*(y - topLeft.y)    })
        polyomino.push({'x':4*(x - topLeft.x) + 2, 'y':4*(y - topLeft.y)    })
        polyomino.push({'x':4*(x - topLeft.x)    , 'y':4*(y - topLeft.y) + 2})
        polyomino.push({'x':4*(x - topLeft.x) + 2, 'y':4*(y - topLeft.y) + 2})
      }else polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y)    })
    }
  }
  return polyomino
}

// In some cases, polyominos and onimoylops will fully cancel each other out.
// However, even if they are the same size, that doesn't guarantee that they fit together.
// As an optimization, we save the results for known combinations of shapes, since there are likely many
// fewer pairings of shapes than paths through the grid.
var knownCancellations = {}

// Attempt to fit polyominos in a region into the puzzle.
// This function checks for early exits, then simplifies the grid to a numerical representation:
// * 1 represents a square that has been double-covered (by two polyominos)
//   * Or, in the cancellation case, it represents a square that was covered by a polyomino and not by an onimoylop
// * 0 represents a square that is satisfied, either because:
//   * it is outside the region
//   * (In the normal case) it was inside the region, and has been covered by a polyomino
//   * (In the cancellation case) it was covered by an equal number of polyominos and onimoylops
// * -1 represents a square that needs to be covered once (inside the region, or outside but covered by an onimoylop)
// * -2 represents a square that needs to be covered twice (inside the region & covered by an onimoylop)
// * And etc, for additional layers of polyominos/onimoylops.
function xy(c, w) { return [c % w, Math.floor(c / w)]; }
function ret(x, y, w) { return y * w + x; }
function matrix(global, x, y) {
  if (!global.regionMatrix[y]) return undefined;
  return global.regionMatrix[y][x];
}
function getPortalCoords(c, data, w) { // from: <real>, to: PortalCoords(portalOffset-Adjusted)<virtual>
  for (const i in data.originalRegions.all) {
      if (data.originalRegions.all[i].includes(c)) {
          let [x, y] = xy(c, w);
          x += data.offset[i][0]; y += data.offset[i][1];
          return ret(x - data.totalSpan[0], y - data.totalSpan[1], data.width);
      }
  }
  return undefined;
}
// that is a long list
window.polyFitMaster = function(puzzle, regionNum, global, polys, scalers, downscalable, upscalable) {
  if (scalers[0] > 0 && scalers[1] > 0 && // Pre-calculate scenarios where they cross each other out
      window.polyFitMaster(puzzle, regionNum, global, polys.slice(), [scalers[0] - 1, scalers[1] - 1], downscalable.slice(), upscalable.slice()).length == 0) return [];
  if ((scalers[0] > 0 && upscalable.length == 0) || (scalers[1] > 0 && downscalable.length == 0)) return ['scaler'];
  if (scalers[1] > 0) { // calculate small first
    scalers[1]--;
    for (let j = 0; j < downscalable.length; j++) {
      let newPolys        = polys       .slice(); // copy first
      let newDownscalable = downscalable.slice();
      let   newUpscalable =   upscalable.slice();
      let i = downscalable[j];
      newPolys[i].downscale();
      if (!newPolys[i].downscalable()) {
        newDownscalable.splice(j, 1);
        newUpscalable[i] = -1;
      }
      if (window.polyFitMaster(puzzle, regionNum, global, newPolys, scalers.slice(), newDownscalable, newUpscalable).length == 0) return [];
    }
  } else if (scalers[0] > 0) {
    upscalable = upscalable.filter(val => val >= 0); // filter out downscaled boys at once
    scalers[0]--;
    for (let j = 0; j <   upscalable.length; j++) {
      let newPolys        = polys       .slice(); // copy first
      let   newUpscalable =   upscalable.slice();
      let i =   upscalable[j];
      if (!newPolys[i].upscalable()) {
          newPolys[i].upscale();
          newUpscalable.splice(j, 1);
      } else newPolys[i].upscale();
      if (window.polyFitMaster(puzzle, regionNum, global, newPolys, scalers.slice(), []             , newUpscalable).length == 0) return [];
    }
  } else { // finally, no scalers
    if (polys.length == 0) return [];
    let ylops   = polys.filter(val => val.type == 'ylop');
    let polynts = polys.filter(val => val.type == 'polynt');
    polys       = polys.filter(val => val.type == 'poly');
    let polyCorrect = true; polyntCorrect = true;
    if (polys  .length != 0 || ylops.length != 0) {
      polyCorrect   = window.polyFit    (puzzle, regionNum, global, polys, ylops);
    }
    if (polynts.length != 0) {
      polyntCorrect = window.polyntFitnt(puzzle, regionNum, global, polynts); 
    }
    if ( polyCorrect  ) global.polyIncorrect[regionNum] = false;
    if (!polyntCorrect) global.polyntCorrect[regionNum] = false;
    if (polyCorrect && polyntCorrect) return []; // correct case!
  }
  let res = [];
  if ( global.polyIncorrect[regionNum]) res.push('poly', 'ylop');
  if (!global.polyntCorrect[regionNum]) res.push('polynt')
  if (res.length == 0) res.push('scaler') // something should be wrong
  return res;
}

window.polyFit = function(puzzle, regionNum, global, polys, ylops) {
  const isPortaled = global.portalRegion && (global.portalRegion.indexOf(regionNum) + 1);
  const data = isPortaled ? global.portalData[isPortaled-1] : null;
  let span = data ? data.totalSpan : [0, 0, puzzle.width, puzzle.height];
  const w = data ? data.width : puzzle.width;
  let polyCount = polys.reduce((prev, cur) => prev + getPolySize(cur.cell.polyshape), 0) - ylops.reduce((prev, cur) => prev + getPolySize(cur.cell.polyshape), 0);
  let key, res;
  polys = polys.map(v => v.cell);
  ylops = ylops.map(v => v.cell);
  if (polyCount > 0 && polyCount !== (data ? data.regions.cell.length : global.regions.cell[regionNum].length)) {
    console.info('[!] Combined size of polyominos and onimoylops', polyCount, 'does not match region size', (data ? data.regions.cell.length : global.regions.cell[regionNum].length));
    return false;
  }
  if (polyCount < 0) {
    console.info('[!] Combined size of onimoylops is greater than polyominos by', -polyCount)
    return false;
  }
  key = null;
  if (polyCount === 0) {
    if (puzzle.settings.SHAPELESS_ZERO_POLY) return true;
    // These will be ordered by the order of cells in the region, which isn't exactly consistent.
    // In practice, it seems to be good enough.
    key  = '';  for (const ylop of ylops) key += ' ' + ylop.polyshape;
    key += '|'; for (const poly of polys) key += ' ' + poly.polyshape;
    res = knownCancellations[key];
    if (res != null) return res;
  }
  // For polyominos, we clear the grid to mark it up again:
  let savedGrid = puzzle.grid;
  // First, we mark all cells as 0: Cells outside the target region should be unaffected.
  puzzle.grid = Array(data ? data.height : puzzle.height).fill(0).map(a => Array(data ? data.width : puzzle.width).fill(0));
  // In the normal case, we mark every cell as -1: It needs to be covered by one poly
  if (polyCount > 0) {
    for (let c of (data ? data.regions.cell : global.regions.cell[regionNum])) {
        let [x, y] = (data ? xy(c, w) : xy(c, puzzle.width));
        puzzle.grid[y][x] = -1;
    }
  } // In the exact match case, we leave every cell marked 0: Polys and ylops need to cancel.
  res = placeYlops(ylops, 0, polys.slice(), puzzle);
  if (polyCount === 0) knownCancellations[key] = res;
  puzzle.grid = savedGrid;
  return res;
}

// turns out the poly function was also recursing and brute forcing like no tomorrow, lets go
window.polyntFitnt = function(puzzle, regionNum, global, polynts) { // best name
  if (polynts.filter(v => getPolySize(v.cell.polyshape) == 1).length != 0) {
    console.log('[!] 1x1 not polyomino');
    return false;
  }
  const isPortaled = global.portalRegion && (global.portalRegion.indexOf(regionNum) + 1);
  const data = isPortaled ? global.portalData[isPortaled-1] : null;
  const w = data ? data.width : puzzle.width;
  polynts = polynts.filter(v => getPolySize(v.cell.polyshape) <= global.regions.cell[regionNum].length).map(v => v.cell);
  var res = true // true until breaks are found
  for (var polynt of polynts) {
    for (var polyntshape of getRotations(polynt.polyshape, polynt.rot)) {
      console.spam('Selected polyntshape', polyntshape)
      let cells = polyominoFromPolyshape(polyntshape)
      for (var c of (data ? data.regions.cell : global.regions.cell[regionNum])) {
        let [x, y] = (data ? xy(c, w) : xy(c, puzzle.width));
        var found = true;
        for (cell of cells) {
          if ((data && !data.regions.cell.includes(ret(cell.x + x, cell.y + y, w)))
          || (!data && matrix(global, cell.x + x, cell.y + y) != regionNum)) {
            found = false;
            break;
          }
        }
        if (found) {
          console.log('[!] Antipolyomino can fit')
          res = false;
          break;
        }
      }
      if (found) break;
    }
  }
  return res;
}

// If false, poly doesn't fit and grid is unmodified
// If true, poly fits and grid is modified (with the placement)
function tryPlacePolyshape(cells, y, x, puzzle, sign) {
  console.spam('Placing at', x, y, 'with sign', sign)
  var numCells = cells.length
  for (var i=0; i<numCells; i++) {
    var cell = cells[i]
    var puzzleCell = puzzle.grid[cell.y + y]?.[cell.x + x]
    if (puzzleCell == null) return false
    cell.value = puzzleCell
  }
  for (var i=0; i<numCells; i++) {
    var cell = cells[i]
    puzzle.grid[cell.y + y][cell.x + x] = cell.value + sign;
  }
  return true
}

// Places the ylops such that they are inside of the grid, then checks if the polys
// zero the region.
function placeYlops(ylops, i, polys, puzzle) {
  // Base case: No more ylops to place, start placing polys
  if (i === ylops.length) return placePolys(polys, puzzle)

  var ylop = ylops[i]
  var ylopRotations = getRotations(ylop.polyshape, ylop.rot)
  for (var x=1; x<puzzle.width; x+=2) {
    for (var y=1; y<puzzle.height; y+=2) {
      console.log('Placing ylop', ylop, 'at', x, y)
      for (var polyshape of ylopRotations) {
        var cells = polyominoFromPolyshape(polyshape, true)
        if (!tryPlacePolyshape(cells, y, x, puzzle, -1)) continue;
        console.group('')
        if (placeYlops(ylops, i+1, polys, puzzle)) return true
        console.groupEnd('')
        if (!tryPlacePolyshape(cells, y, x, puzzle, +1)) continue;
      }
    }
  }
  console.log('Tried all ylop placements with no success.')
  return false
}

// Returns whether or not a set of polyominos fit into a region.
// Solves via recursive backtracking: Some piece must fill the top left square,
// so try every piece to fill it, then recurse.
function placePolys(polys, puzzle) {
  // Check for overlapping polyominos, and handle exit cases for all polyominos placed.
  var allPolysPlaced = (polys.length === 0)
  for (var y=1; y<puzzle.height; y+=2) {
    var row = puzzle.grid[y]
    for (var x=1; x<puzzle.width; x+=2) {
      var cell = row[x]
      if (cell > 0) {
        console.log('Cell', x, y, 'has been overfilled and no ylops left to place')
        return false
      }
      if (allPolysPlaced && cell < 0 && x%2 === 1 && y%2 === 1) {
        // Normal, center cell with a negative value & no polys remaining.
        console.log('All polys placed, but grid not full')
        return false
      }
    }
  }
  if (allPolysPlaced) {
    console.log('All polys placed, and grid full')
    return true
  }

  // The top-left (first open cell) must be filled by a polyomino.
  // However in the case of pillars, there is no top-left, so we try all open cells in the
  // top-most open row
  var openCells = []
  for (var y=1; y<puzzle.height; y+=2) {
    for (var x=1; x<puzzle.width; x+=2) {
      if (puzzle.grid[y][x] >= 0) continue;
      openCells.push({'x':x, 'y':y})
      if (puzzle.pillar === false) break;
    }
    if (openCells.length > 0) break;
  }

  if (openCells.length === 0) {
    console.log('Polys remaining but grid full')
    return false
  }

  for (var openCell of openCells) {
    var attemptedPolyshapes = []
    for (var i=0; i<polys.length; i++) {
      var poly = polys[i]
      console.spam('Selected poly', poly)
      if (attemptedPolyshapes.includes(poly.polyshape)) {
        console.spam('Polyshape', poly.polyshape, 'has already been attempted')
        continue;
      }
      attemptedPolyshapes.push(poly.polyshape)
      polys.splice(i, 1)
      for (var polyshape of getRotations(poly.polyshape, poly.rot)) {
        console.spam('Selected polyshape', polyshape)
        var cells = polyominoFromPolyshape(polyshape)
        if (!tryPlacePolyshape(cells, openCell.y, openCell.x, puzzle, +1)) {
          console.spam('Polyshape', polyshape, 'does not fit into', openCell.x, openCell.y)
          continue;
        }
        console.group('')
        if (placePolys(polys, puzzle)) return true
        console.groupEnd('')
        // Should not fail, as it's an inversion of the above tryPlacePolyshape
        tryPlacePolyshape(cells, openCell.y, openCell.x, puzzle, -1)
      }
      polys.splice(i, 0, poly)
    }
  }
  console.log('Grid non-empty with >0 polys, but no valid recursion.')
  return false
}

})
