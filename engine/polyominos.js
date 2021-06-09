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
      polyomino.push({'x':2*(x - topLeft.x), 'y':2*(y - topLeft.y)})
      
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
function xy(c) { return [c % window.puzzle.width, Math.floor(c / window.puzzle.width)]; } // worse xy lol
const DOWNSCALE = { 51: 1, 255: 3, 13311: 19, 65331: 49, 65484: 50, 13107: 17, 13260: 18, 52275: 33, 52479: 35, 65535: 51, 1048627: 1048577, 1048831: 1048579, 1061887: 1048595, 1113907: 1048625, 1114060: 1048626, 1061683: 1048593, 1061836: 1048594, 1100851: 1048609, 1101055: 1048611, 1114111: 1048627 };
const DOWNSCALEABLE = [51, 255, 13311, 65331, 65484, 13107, 13260, 52275, 52479, 65535, 1048627, 1048831, 1061887, 1113907, 1114060, 1061683, 1061836, 1100851, 1101055, 1048627];
const UPSCALE = { 1: 51, 3: 255, 19: 13311, 49: 65331, 50: 65484, 17: 13107, 18: 13260, 33: 52275, 35: 52479, 51: 65535, 1048577: 1048627, 1048579: 1048831, 1048595: 1061887, 1048625: 1113907, 1048626: 1114060, 1048593: 1061683, 1048594: 1061836, 1048609: 1100851, 1048611: 1101055, 1048627: 1114111 };
const UPSCALABLE = [1, 3, 19, 49, 50, 17, 18, 33, 35, 51, 1048577, 1048579, 1048595, 1048625, 1048626, 1048593, 1048594, 1048609, 1048611, 1048627];
// that is a long list
window.polyFitMaster = function(puzzle, regionNum, global, quick, finalpolys, bigable, smallable, bigs, smalls) {
  // all my homies hate scaler
  if (bigs > 0 && smalls > 0 && window.polyFitMaster(puzzle, regionNum, global, quick, finalpolys, bigable, smallable, bigs - 1, smalls - 1)) return true; // bigs and smalls cancel each other out;
  // use up smalls
  if (smalls > 0) for (let i = 0; i < smallable.length; i++) {
    let res = bigable.slice();
    let list = smallable.slice();
    let small = DOWNSCALE[smallable[i]];
    if (!DOWNSCALEABLE.includes(small)) {
      list.splice(i, 1);
      res.push(small);
    }
    if (window.polyFitMaster(puzzle, regionNum, global, quick, finalpolys, res, list, bigs, smalls - 1)) return true;
  }
  for (elem of smallable) bigable.push(elem);
  smallable = null;
  // use up bigs now
  if (bigs > 0) for (let i = 0; i < bigable.length; i++) {
    let res = finalpolys.slice();
    let list = bigable.slice();
    if (!UPSCALABLE.includes(bigable[i])) {
      list.splice(i, 1);
      res.push(bigable[i] + 131072);
    } else {
      list[i] = UPSCALE[bigable[i]];
    }
    if (window.polyFitMaster(puzzle, regionNum, global, quick, res, list, null, bigs, smalls - 1)) return true;
  }
  for (elem of bigable) finalpolys.push(elem);
  bigable = null;
  // no scaler, polyfit now
  return window.polyFit(puzzle, regionNum, global, quick);
}

window.polyFit = function(puzzle, regionNum, global, quick) {
  let polypos = [];
  let polys = []
  let ylops = []
  let polyCount = 0
  let key, ret;
  for (let c of global.regionCells.cell[regionNum]) {
      let [x, y] = xy(c);
      let cell = puzzle.getCell(x, y);
      if (!(cell && ['poly', 'ylop'].includes(cell.type))) continue;
      polypos.push(c);
      if (cell.type === 'poly') {
        polys.push(cell)
        polyCount += getPolySize(cell.polyshape)
      } else if (cell.type === 'ylop') {
        ylops.push(cell)
        polyCount -= getPolySize(cell.polyshape)
      }
  }
  if (polys.length + ylops.length === 0) {
    console.log('No polyominos or onimoylops inside the region, vacuously true')
    return true;
  }
  if (polyCount > 0 && polyCount !== global.regions.cell[regionNum].length) {
    console.log('[!] Combined size of polyominos and onimoylops', polyCount, 'does not match region size', global.regions.cell[regionNum].length);
    return false;
  }
  if (polyCount < 0) {
    console.log('[!] Combined size of onimoylops is greater than polyominos by', -polyCount)
    return false;
  }
  key = null;
  if (polyCount === 0) {
    if (puzzle.settings.SHAPELESS_ZERO_POLY) return;
    // These will be ordered by the order of cells in the region, which isn't exactly consistent.
    // In practice, it seems to be good enough.
    key  = '';  for (const ylop of ylops) key += ' ' + ylop.polyshape;
    key += '|'; for (const poly of polys) key += ' ' + poly.polyshape;
    ret = knownCancellations[key];
    if (ret !== null) return ret;
  }
  // For polyominos, we clear the grid to mark it up again:
  let savedGrid = puzzle.grid;
  // First, we mark all cells as 0: Cells outside the target region should be unaffected.
  puzzle.grid = Array.from({ length: puzzle.width }, () => Array.from({ length: puzzle.height }, () => 0));
  // In the normal case, we mark every cell as -1: It needs to be covered by one poly
  if (polyCount > 0) {
    for (let c of global.regions.cell[regionNum]) {
        let [x, y] = xy(c);
        puzzle.setCell(x, y, -1);
    }
  } // In the exact match case, we leave every cell marked 0: Polys and ylops need to cancel.
  ret = placeYlops(ylops, 0, polys.slice(), puzzle);
  if (polyCount === 0) knownCancellations[key] = ret;
  puzzle.grid = savedGrid;
  return ret;
}

// turns out the poly function was also recursing and brute forcing like no tomorrow, lets go
window.polyntFitnt = function(region, puzzle, regionData, regionMatrix) { // best name
  var polynts = []
  var regionSize = 0
  for (const pos of region.cells) {
    if (pos.x%2 === 1 && pos.y%2 === 1) regionSize++
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == null) continue;
    if (cell.polyshape === 0) continue;
    if (cell.type === 'polynt') {
      polynts.push(pos)
    }
  }
  if (polynts.length === 0) {
    console.log('No not polyominos inside the region, vacuously true')
    return true;
  }
  var ret = true // true until breaks are found
  for (var polyntpos of polynts) {
    var polynt = puzzle.getCell(polyntpos.x, polyntpos.y)
    if (getPolySize(polynt.polyshape) > regionSize) {
      console.log('polynt size is bigger than region, true')
      return true;
    }
    for (var polyntshape of getRotations(polynt.polyshape, polynt.rot)) {
      console.spam('Selected polyntshape', polyntshape)
      let cells = polyominoFromPolyshape(polyntshape, false, false)
      for (var pos of region.cells) {
        if (!puzzle.pillar && (0 > pos.x || pos.x >= puzzle.width || 0 > pos.y || pos.y >= puzzle.height)) continue; // non-pillars
        if ((pos.x & pos.y) % 2 != 1) continue;
        var found = true;
        for (cell of cells) {
          if (regionMatrix[cell.y + pos.y] === undefined || regionMatrix[cell.y + pos.y][cell.x + pos.x] == null) {
            found = false;
            break;
          }
        }
        if (found) {
          console.log('Antipolyomino at', polyntpos.x, polyntpos.y, 'can fit')
          regionData.addInvalid(polyntpos)
          ret = false;
          break;
        }
      }
      if (found) break;
    }
  }
  return ret;
}

// If false, poly doesn't fit and grid is unmodified
// If true, poly fits and grid is modified (with the placement)
function tryPlacePolyshape(cells, x, y, puzzle, sign) {
  console.spam('Placing at', x, y, 'with sign', sign)
  var numCells = cells.length
  for (var i=0; i<numCells; i++) {
    var cell = cells[i]
    var puzzleCell = puzzle.getCell(cell.x + x, cell.y + y)
    if (puzzleCell == null) return false
    cell.value = puzzleCell
  }
  for (var i=0; i<numCells; i++) {
    var cell = cells[i]
    puzzle.setCell(cell.x + x, cell.y + y, cell.value + sign)
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
        if (!tryPlacePolyshape(cells, x, y, puzzle, -1)) continue;
        console.group('')
        if (placeYlops(ylops, i+1, polys, puzzle)) return true
        console.groupEnd('')
        if (!tryPlacePolyshape(cells, x, y, puzzle, +1)) continue;
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
  for (var x=0; x<puzzle.width; x++) {
    var row = puzzle.grid[x]
    for (var y=0; y<puzzle.height; y++) {
      var cell = row[y]
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
      if (puzzle.grid[x][y] >= 0) continue;
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
        var cells = polyominoFromPolyshape(polyshape, false)
        if (!tryPlacePolyshape(cells, openCell.x, openCell.y, puzzle, +1)) {
          console.spam('Polyshape', polyshape, 'does not fit into', openCell.x, openCell.y)
          continue;
        }
        console.group('')
        if (placePolys(polys, puzzle)) return true
        console.groupEnd('')
        // Should not fail, as it's an inversion of the above tryPlacePolyshape
        tryPlacePolyshape(cells, openCell.x, openCell.y, puzzle, -1)
      }
      polys.splice(i, 0, poly)
    }
  }
  console.log('Grid non-empty with >0 polys, but no valid recursion.')
  return false
}

})
