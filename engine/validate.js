// what if i rewrite
namespace(function() {
class RegionData {
    constructor() {
        // puzzle.invalidElements = []; // confirmed bad ones
        // this.nega = []; // c of negators
        // this.copier = []; // c of copiers, which can be used in place of negators
        /**
         * {
         *  pos: <position in c form>,
         *  copyfrom: <position in c form>,
         * }
         */
        // puzzle.negations = []; // confirmed negation pairs
        this.invalids = []; // invalid? (needs checking)
    }
    /**
     * InvalidQuestionMark data structure
     * {
     *   pos: <position in c form>,
     *   region: <region number>,
     *   type: <cell.type>,
     *   color: <cell.color>,
     *   count: <cell.count>,
     *   rot: <cell.rot>
     * }
     * * what if two stars and one triangle in a region?
     * ! removing a sun would satisfy, given that the triangles are satisfied
     * 
     * * what if 2 orange star, 2 blue star and 1 orange&blue hypothetical symbol?
     * ! add hypothetical symbol into the loop
     */

    /**
     * @param {Puzzle} puzzle 
     * @param {pos<c>} c 
     */
    addInvalid(puzzle, c, immediately=false) {
        let [x, y] = xy(c);
        let cell = puzzle.getCell(x, y);
        if (immediately || NEGATE_IMMEDIATELY.includes(cell.type) || cell.dot > window.CUSTOM_X) {
            if (!this.nega || !this.nega.length) { // oh no! no more negators!
                if (this.copier && this.copier.length && this.negaSource) { // but i can copy the used up negator!
                    let copyc = this.copier.pop();
                    let [copyx, copyy] = xy(copyc);
                    let [sourcex, sourcey] = xy(this.negaSource)
                    window.savedGrid[copyx][copyy] = window.savedGrid[sourcex][sourcey]; // copy!
                    puzzle.negations.push({ 'source': {'x': copyx, 'y': copyy}, 'target': {'x': x, 'y': y} });
                    eraseShape(puzzle, x, y); eraseShape(puzzle, copyx, copyy);
                } else { // copiers won't save you now!
                    puzzle.valid = false;
                    puzzle.invalidElements.push(c);
                }
            } else { // use a negator...
                let negac = this.nega.pop();
                let [negax, negay] = xy(negac); 
                puzzle.negations.push({ 'source': {'x': negax, 'y': negay}, 'target': {'x': x, 'y': y} });
                eraseShape(puzzle, x, y); eraseShape(puzzle, negax, negay);
            }
        } else {
            this.invalids.push(c);
        }
    }

    addInvalids(puzzle, cs, immediately=false) { for (const c of cs) { this.addInvalid(puzzle, c, immediately); }}
}

class Polyomino {
    constructor(puzzle, c) {
        this.pos = c;
        let [x, y] = xy(c);
        this.cell = puzzle.getCell(x, y);
        this.shape = this.cell.polyshape + 0; // 131072: upscale flag, 1048576: rotate flag
        this.type = this.cell.type;
    }
    aon(e) { return (this.cell.polyshape & e == 0) || (this.cell.polyshape & e == e); }
    downscalable() {
        return this.aon(51) && this.aon(204) && this.aon(13056) && this.aon(52224); // check if each 2x2 square is in same state
    }
    upscalable() { 
        return (this.cell.polyshape == this.cell.polyshape & 1048627); // check if only first 2x2 exist (+1048576)
    }
    downscale() { // nearest neighbor
        let ret = this.cell.polyshape & 1048576;
        if (this.cell.polyshape &    1) ret += 1; // if x1y1~x2y2, x1y1
        if (this.cell.polyshape &    4) ret += 2;
        if (this.cell.polyshape &  512) ret += 16;
        if (this.cell.polyshape & 2048) ret += 32; 
        this.cell.polyshape = ret;
    }
    upscale() { 
        if (this.upscalable()) {
            let ret = this.cell.polyshape & 1048576;
            if (this.cell.polyshape &  1) ret += 51; // if x1y1, x1y1~x2y2
            if (this.cell.polyshape &  2) ret += 204;
            if (this.cell.polyshape & 16) ret += 13056;
            if (this.cell.polyshape & 32) ret += 52224; 
            this.cell.polyshape = ret;
        } else this.cell.polyshape += 131072;
    }
}

const NEGATE_IMMEDIATELY = ['dot', 'cross', 'curve', 'triangle', 'arrow', 'dart', 'twobytwo']; // these work individually, and can be negated
const CHECK_ALSO = { // removing this 1 thing can affect these other symbols
    'square': ['pentagon'],
    'pentagon': ['square'],
    'celledhex': ['dart', 'divdiamond', 'poly', 'ylop']
};
const ALWAYS_CHECK = ['bridge', 'star'];
const METASHAPES = ['nega', 'copier'];
const NONSYMBOLS = ['line']; // extension sake
const NONSYMBOL_PROPERTY = ['type', 'line', 'start', 'end'];
const COLOR_DEPENDENT = ['square', 'star', 'pentagon', 'vtriangle', 'bridge'];

function eraseShape(puzzle, x, y) {
    let cell = puzzle.grid[x][y];
    if (cell && NONSYMBOLS.includes(cell.type)) {
        let newCell = {};
        for (prop of NONSYMBOL_PROPERTY)
            newCell[prop] = cell[prop]
        puzzle.grid[x][y] = newCell;
    } else {
        puzzle.grid[x][y] = null;
    }
}

// coordinate conversion
let width; 
let height;
function ret(x, y) { return y * width + x; }
function xy(c) { return [c % width, Math.floor(c / width)]; }
function cel(puzzle, c) { let [x, y] = xy(c); return puzzle.getCell(x, y); }
const DIR = [
    {'x': 0, 'y':-1},
    {'x': 1, 'y':-1},
    {'x': 1, 'y': 0},
    {'x': 1, 'y': 1},
    {'x': 0, 'y': 1},
    {'x':-1, 'y': 1},
    {'x':-1, 'y': 0},
    {'x':-1, 'y':-1},
];  
function dr(n) {
    return DIR[n];
}
const detectionMode = {
    "all":    (x, y) => { return true; },
    "cell":   (x, y) => { return (x & y) % 2 == 1; },
    "line":   (x, y) => { return (x & y) % 2 == 0; },
    "corner": (x, y) => { return (x | y) % 2 == 0; },
    "edge":   (x, y) => { return (x ^ y) % 2 == 1; }
};
function intersect(a, b) { return a.filter(k => b.includes(k)); } // intersection of two arrays
function intersects(a, b) { // check for intersection
    if (a.length == 0 && b.length == 0) return false;
    if (a.length == 1) return b.includes(a[0]); if (b.length == 1) return a.includes(b[0]);
    return a.reduce((k, p) => { return k || b.includes(p);}, false);
}
function isBounded(puzzle, x, y) {
  return (0 <= x && x < puzzle.width && 0 <= y && y < puzzle.height);
}
function matrix(global, x, y) {
    if (!global.regionMatrix[y]) return undefined;
    return global.regionMatrix[y][x];
}

// Determines if the current grid state is solvable. Modifies the puzzle element with:
// valid: Boolean (true/false)
// invalidElements: Array[Object{'x':int, 'y':int}]
// negations: Array[Object{'source':{'x':int, 'y':int}, 'target':{'x':int, 'y':int}}]
window.validate = function(puzzle, quick) {
    let global;
    puzzle.invalidElements = []; // once elements go in this list, nothing is removed
    puzzle.negations = [];
    puzzle.valid = true; // puzzle true until proven false
    width = puzzle.width;
    height = puzzle.height;
    [puzzle, global] = init(puzzle);
    for (fn of preValidate) {
        if (fn.or ? intersects(fn.or, global.shapes) : (fn.orNot ? !intersects(fn.orNot, global.shapes) : fn.orCustom(puzzle, global))) { // prereq for exec
            fn.exec(puzzle, global, quick); if (!puzzle.valid && quick) return;
        }
    }
    for (fn of lineValidate) { // zeroth region (on-the-line) detection
        if (fn.or ? intersects(fn.or, global.shapes) : (fn.orNot ? !intersects(fn.orNot, global.shapes) : fn.orCustom(puzzle, global))) { 
            fn.exec(puzzle, global, quick); if (!puzzle.valid && quick) return;
        }
    }
    for (let i = 1; i < global.regions.all.length; i++) { // there is at least 1 region (i think)
        for (fn of validate) {
            if (fn.or ? intersects(fn.or, global.shapes) : (fn.orNot ? !intersects(fn.orNot, global.shapes) : fn.orCustom(puzzle, global))) { 
                fn.exec(puzzle, i, global, quick); if (!puzzle.valid && quick) return;
            }
        }
    }
    // handle metashapes here cuz AAAAAAAAAAAAAAHHHHHHHHHHH
    for (fn of postValidate) {
        if (fn.or ? intersects(fn.or, global.shapes) : (fn.orNot ? !intersects(fn.orNot, global.shapes) : fn.orCustom(puzzle, global))) { // prereq for exec
            fn.exec(puzzle, global, quick); if (!puzzle.valid && quick) return;
        }
    }
    for (r of global.regionData) puzzle.invalidElements = puzzle.invalidElements.concat(r.invalids);
    console.info(puzzle.invalidElements)
    for (let i = 0; i < puzzle.invalidElements.length; i++) {
        let c = puzzle.invalidElements[i];
        let [x, y] = xy(c);
        puzzle.invalidElements[i] = {'x': x, 'y': y};
    }
    puzzle.grid = window.savedGrid;
    delete window.savedGrid;
    puzzle.valid = puzzle.invalidElements.length == 0;
    // console.warn(puzzle, global);
}

function init(puzzle) { // initialize globals
    let global = {
        'valid': true,
        'shapes': new Set(),
        'regionData': [],
        'regionNum': 0,
        'regionMatrix': Array.from({ length: puzzle.height }, () => Array.from({ length: puzzle.width }, () => 0)),
        'regions': {
            all: [[]],
            cell: [],
            line: [],
            corner: [],
            edge: [],
        }
    };
    window.savedGrid = puzzle.grid;
    let i = 0;
    global.regionData.push(new RegionData()) // regiondata for region 0 (the line)
    for (region of puzzle.getRegions()) {
        i++;
        global.regions.all.push([])
        global.regionData.push(new RegionData())
        for (const pos of region.cells) {
            global.regionMatrix[pos.y][pos.x] = i;
            global.regions.all[i].push(ret(pos.x, pos.y));
        }
        global.regionNum = i;
    }
    for (let x = 0; x < puzzle.width; x++) {
        for (let y = 0; y < puzzle.height; y++) {
            let c = ret(x, y);
            if (global.regionMatrix[y][x] == 0) global.regions.all[0].push(c)
            let cell = puzzle.grid[x][y];
            if (cell == null) continue;
            // dots
            if (cell.dot > window.DOT_NONE) global.shapes.add('dot')
            else if (window.CUSTOM_CURVE < cell.dot && cell.dot <= window.CUSTOM_CROSS) global.shapes.add('cross')
            else if (window.    CUSTOM_X < cell.dot && cell.dot <= window.CUSTOM_CURVE) global.shapes.add('curve')
            else if (                                  cell.dot <= window.CUSTOM_X    ) global.shapes.add('x')
            if (NONSYMBOLS.includes(cell.type)) continue;
            global.shapes.add(cell.type);
            // all my homies hate metashapes
            let regionNum = global.regionMatrix[y][x];
            if (METASHAPES.includes(cell.type)) {
                if (!global.regionData[regionNum][cell.type]) global.regionData[regionNum][cell.type] = [];
                global.regionData[regionNum][cell.type].push(c);
            }
            if (!global.regionData[regionNum].negaSource && cell.type == 'nega') 
                global.regionData[regionNum].negaSource = c;
        }
    }
    // filtering it now instead of continuing everything
    for (region of global.regions.all) {
        global.regions.cell.push(region.filter(c => { let [x, y] = xy(c); return detectionMode.cell(x, y); }));
        global.regions.line.push(region.filter(c => { let [x, y] = xy(c); return detectionMode.line(x, y); }));
    }
    for (region of global.regions.line) {
        global.regions.corner.push(region.filter(c => { let [x, y] = xy(c); return detectionMode.corner(x, y); }));
        global.regions.edge  .push(region.filter(c => { let [x, y] = xy(c); return detectionMode.edge  (x, y); }));
    }
    global.regionCells = { all: [], cell: [], line: [], corner: [], edge: [] };
    for (region of global.regions.all) {
        global.regionCells.all.push(region.filter(c => { let cell = cel(puzzle, c); if (!cell) return false; if (cell.type == 'line' && !cell.dot) return false; return true; }));
    }
    for (region of global.regionCells.all) {
        global.regionCells.cell.push(region.filter(c => { let [x, y] = xy(c); return detectionMode.cell(x, y); }));
        global.regionCells.line.push(region.filter(c => { let [x, y] = xy(c); return detectionMode.line(x, y); }));
    }
    for (region of global.regionCells.line) {
        global.regionCells.corner.push(region.filter(c => { let [x, y] = xy(c); return detectionMode.corner(x, y); }));
        global.regionCells.edge  .push(region.filter(c => { let [x, y] = xy(c); return detectionMode.edge  (x, y); }));
    }
    global.shapes = Array.from(global.shapes); // array-ify shapes for streamline
    if (intersects(COLOR_DEPENDENT, global.shapes)) { // colorify
        global.regionColors = {
            all: [],
            cell: [],
            line: [],
            corner: [],
            edge: [],
        };
        for (const [k, regions] of Object.entries(global.regions)) {
            let i = 0;
            for (const region of regions) {
                global.regionColors[k].push({});
                for (const pos of region) { // triple loop! yeahhhh
                    const cell = cel(puzzle, pos);
                    if (!cell || !cell.color) continue;
                    if (!global.regionColors[k][i][cell.color]) global.regionColors[k][i][cell.color] = [];
                    global.regionColors[k][i][cell.color].push(pos);
                }
                i++;
            }
        }
    }
    return [puzzle, global];
}

const preValidate = [
    {
        '_name': 'WRONG COLORED LINE DETECTION',
        'or': ['dot', 'cross', 'curve'], // this should trigger on all poly
        'exec': function(puzzle, global, quick) {
            const DOT_BLUE   = [window.DOT_BLUE, window.CUSTOM_CROSS_BLUE, window.CUSTOM_CROSS_BLUE_FILLED, window.CUSTOM_CURVE_BLUE, window.CUSTOM_CURVE_BLUE_FILLED];
            const DOT_YELLOW = [window.DOT_YELLOW, window.CUSTOM_CROSS_YELLOW, window.CUSTOM_CROSS_YELLOW_FILLED, window.CUSTOM_CURVE_YELLOW, window.CUSTOM_CURVE_YELLOW_FILLED];
            for (let c of global.regionCells.all[0]) { // cell on line rn
                let [x, y] = xy(c);
                let cell = puzzle.grid[x][y];
                if ((DOT_BLUE.includes(cell.dot) && cell.line !== window.LINE_BLUE)
                || (DOT_YELLOW.includes(cell.dot) && cell.line !== window.LINE_YELLOW)) {
                    console.info('[pre][!] Wrong Colored Dots: ', x, ',', y)
                    global.regionData[0].addInvalid(puzzle, c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'INIT POLYOMINO VALIDATION',
        'or': ['poly', 'ylop', 'polynt', 'scaler'],
        'exec': function(puzzle, global, quick) {
            global.polyntCorrect = []; global.polyIncorrect = [];
        }
    }, {
        '_name': 'TENUOUS TRIANGLE VALUE DETERMINATION',
        'or': ['vtriangle'],
        'exec': function(puzzle, global, quick) {
            global.vtriangleColors = {};
            for (const region of global.regionCells.cell) for (const c of region) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                let color = cell.color;
                if (quick && global.vtriangleColors[color] == -1) continue;
                let count = 0;
                if (matrix(global, x+1, y) === 0) count++;
                if (matrix(global, x-1, y) === 0) count++;
                if (matrix(global, x, y-1) === 0) count++;
                if (matrix(global, x, y+1) === 0) count++;
                if (!puzzle.settings.ALLOW_ZERO_TENUOUS_TRIANGLE && count == 0) count = -1;
                if (!global.vtriangleColors[color]) global.vtriangleColors[color] = count;
                else {
                    for (const [k, v] of Object.entries(global.vtriangleColors)) {
                        if (k == color) { if (v != count)   global.vtriangleColors[k] = -1; }
                        else              if (v == count) { global.vtriangleColors[k] = -1; global.vtriangleColors[color] = -1; }
                    }
                }
            }
        }
    }, {
        '_name': 'SIZER VALUE DETERMINATION',
        'or': ['sizer'],
        'exec': function(puzzle, global, quick) {
            let globalSizerInfo = [];
            for (let i = 1; i <= global.regionNum; i++) { 
                const region = global.regionCells.cell[i];
                let sizerInfo = {size: 0, weight: {}, pos: {}};
                sizerInfo.size = global.regions.cell[i].length;
                for (const c of region) {
                    let [x, y] = xy(c);
                    let cell = puzzle.getCell(x, y);
                    if (!this.or.includes(cell.type)) continue;
                    let color = cell.color;
                    if (!sizerInfo.pos[color]) sizerInfo.pos[color] = [];
                    sizerInfo.pos[color].push(c);
                }
                if (Object.keys(sizerInfo.pos).length === 0) continue; // no sizer in the region
                for (const k in sizerInfo.pos) {
                    sizerInfo.weight[k] = sizerInfo.size / sizerInfo.pos[k].length;
                    if (!puzzle.settings.ALLOW_FRACTION_SIZER && (sizerInfo.size % sizerInfo.pos[k].length != 0)) sizerInfo.weight[k] = -1;
                }
                globalSizerInfo.push(sizerInfo);
            }
            global.sizerWeights = {}
            for (const i in globalSizerInfo) {
                for (const [k, v] of Object.entries(globalSizerInfo[i].weight)) {
                    if (global.sizerWeights[k] == -1) continue;
                    if (!global.sizerWeights[k]) global.sizerWeights[k] = v;
                    else if (global.sizerWeights[k] != v) global.sizerWeights[k] = -1;
                }
            }
        }
    }, {
        '_name': 'BRIDGE CROSS-REGION CHECK',
        'or': ['bridge'],
        'exec': function(puzzle, global, quick) {
            global.bridges = {};
            global.invalidBridges = {};
            global.bridgeRegions = {};
            for (const region of global.regionCells.cell) {
                let bridges = {};
                for (const c of region) {
                    let [x, y] = xy(c);
                    let cell = puzzle.getCell(x, y);
                    if (!this.or.includes(cell.type)) continue;
                    let color = cell.color;
                    if (!global.bridgeRegions[color]) global.bridgeRegions[color] = new Set([matrix(global, x, y)]);
                    else global.bridgeRegions[color].add(matrix(global, x, y));
                    if (global.bridges[color]) { // already existing
                        if (!global.invalidBridges[color]) global.invalidBridges[color] = global.bridges[color];
                        delete global.bridges[color];
                        global.invalidBridges[color].push(c);
                    } else {
                        if (!bridges[color]) bridges[color] = [];
                        bridges[color].push(c);
                    }
                }
                Object.assign(global.bridges, bridges);
            }
            for (const k in global.bridgeRegions) global.bridgeRegions[k] = Array.from(global.bridgeRegions[k]);
            // TODO: change this with better negation handling after ur done negating
            Object.assign(global.bridges, global.invalidBridges);
            let bridgeRegions = Array.from({length: global.regionNum + 1}, () => []);
            for (const [color, regions] of Object.entries(global.bridgeRegions)) {
                for (const region of regions) bridgeRegions[region].push(color);
            }
            global.bridgeRegions = bridgeRegions;
        }
    }
];

const lineValidate = [
    {
        '_name': 'CROSS N CURVES',
        'or': ['cross', 'curve'],
        'exec': function(puzzle, global, quick) {
            const isCross = function(x, y) {
                if (puzzle.pillar) x = (x + puzzle.width) % puzzle.width; // pillary boys, i hate pillary boys
                return matrix(global, x, y) === 0;
            }
            for (let c of global.regionCells.corner[0]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!cell.dot || cell.dot >= window.DOT_NONE) continue;
                if ((cell.dot > window.CUSTOM_CURVE) // CROSS;
                ? (!(isCross(x-1,y) && isCross(x+1,y)) && !(isCross(x,y-1) && isCross(x,y+1)))
                : ( (isCross(x-1,y) && isCross(x+1,y)) ||  (isCross(x,y-1) && isCross(x,y+1)))) { // thats a long list... 2!
                    console.info('[line][!] Wrongly Crossed... well, Cross: ', x, y);
                    global.regionData[0].addInvalid(puzzle, c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'X MARKINGS',
        'or': ['x'],
        'exec': function(puzzle, global, quick) {
            global.invalidXs = [];
            for (let c of global.regionCells.corner[0]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (cell.dot > window.CUSTOM_X) continue;
                let spokes = -cell.dot - 13
                let regions = new Set();
                if (spokes & 1) regions.add(matrix(global, x-1, y-1));
                if (spokes & 2) regions.add(matrix(global, x+1, y-1));
                if (spokes & 4) regions.add(matrix(global, x-1, y+1));
                if (spokes & 8) regions.add(matrix(global, x+1, y+1));
                regions = Array.from(regions);
                global.invalidXs.push(regions);
            }
        }
    }
]

const validate = [
    {
        '_name': 'DOT CHECK',
        'or': ['dot', 'cross', 'curve'],
        'exec': function(puzzle, regionNum, global, quick) {
            const DOT_BLACK  = [window.DOT_BLACK, window.DOT_BLUE, window.DOT_YELLOW, window.DOT_INVISIBLE, window.CUSTOM_CROSS_FILLED, window.CUSTOM_CROSS_BLUE_FILLED, window.CUSTOM_CROSS_YELLOW_FILLED, window.CUSTOM_CURVE_FILLED];
            for (let c of global.regionCells.line[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (DOT_BLACK.includes(cell.dot)) { // bonk
                    console.info('[!] Uncovered Dot: ', x, y);
                    global.regionData[regionNum].addInvalid(puzzle, c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'SQUARE & PENTAGON',
        'or': ['square', 'pentagon'],
        'exec': function(puzzle, regionNum, global, quick) {
            let pos = {'square': [], 'pentagon': []};
            let color = {'square': null, 'pentagon': null};
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                pos[cell.type].push(c);
                if (color[cell.type] == -1) continue; // no need to continue already bonked
                if (color[cell.type] == null) color[cell.type] = cell.color; // init
                else if (color[cell.type] != cell.color) { // bonk
                    console.info('[!] Segregation fault: ', cell.color, cell.type)
                    color[cell.type] = -1
                }
                if (color.square == color.pentagon) {
                    console.info('[!] Cross-Shape Segregation fault: ', cell.color)
                    color.square = -1; color.pentagon = -1;
                }
            }
            if (color.square   == -1) global.regionData[regionNum].addInvalids(puzzle, pos.square);
            if (color.pentagon == -1) global.regionData[regionNum].addInvalids(puzzle, pos.pentagon);
        }
    }, {
        '_name': 'STAR',
        'or': ['star'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                if (global.regionColors.cell[regionNum][cell.color].length != 2) {
                    console.info('[!] Star fault: ', cell.color);
                    global.regionData[regionNum].addInvalid(puzzle, c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'TRIANGLE CHECK',
        'or': ['triangle'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                let count = 0 // count !!
                if (matrix(global, x+1, y) === 0) count++;
                if (matrix(global, x-1, y) === 0) count++;
                if (matrix(global, x, y-1) === 0) count++;
                if (matrix(global, x, y+1) === 0) count++;
                if (count != cell.count) {
                    console.info('[!] Triangle fault at', x, y, 'needs', cell.count, 'sides - actually has', count);
                    global.regionData[regionNum].addInvalid(puzzle, c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'TENUOUS TRIANGLE CHECK',
        'or': ['vtriangle'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                if (global.vtriangleColors[cell.color] == -1) global.regionData[regionNum].addInvalid(puzzle, c);
            }
        }
    }, {
        '_name': 'SIZER CHECK',
        'or': ['sizer'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                if (global.sizerWeights[cell.color] == -1) global.regionData[regionNum].addInvalid(puzzle, c);
            }
        }
    }, {
        '_name': 'ARROW CHECKS',
        'or': ['arrow', 'dart'],
        'exec': function(puzzle, regionNum, global, quick) {     
            for (let c of global.regionCells.cell[regionNum]) {
                let [sourcex, sourcey] = xy(c);
                let cell = puzzle.getCell(sourcex, sourcey);
                if (!this.or.includes(cell.type)) continue;
                let count = 0; let dir = dr(cell.rot);
                if (cell.type == 'dart') { dir.x *= 2; dir.y *= 2; }
                let x = sourcex + dir.x; let y = sourcey + dir.y;
                for (let _ = 1; _ < puzzle.width * puzzle.height; _++) { // every square must be traveled if the loop gets to this point
                    if (!isBounded(puzzle, x, y)) break; 
                    if (x == sourcex && y == sourcey) break; 
                    if (matrix(global, x, y) === (cell.type == 'arrow' ? 0 : regionNum)) {
                        count++;
                        if (count > cell.count) break;
                    }
                    x += dir.x; y += dir.y // increment
                    if (puzzle.pillar) x = (x + puzzle.width) % puzzle.width;
                }
                if (cell.count != count) {
                    console.info('[!] Directional Counter fault at', sourcex, sourcey, 'needs', cell.count, 'instances - actually has', count);
                    global.regionData[regionNum].addInvalid(puzzle, c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'DIVIDED DIAMOND CHECK',
        'or': ['divdiamond'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (this.or.includes(cell.type)) {
                    if (cell.count != global.regionCells.all[regionNum].length) {
                        console.info('[!] Divided Diamond fault at', x, y, 'needs', cell.count, 'instances - actually has', global.regionCells.all[regionNum].length);
                        global.regionData[regionNum].addInvalid(puzzle, c);
                        if (!puzzle.valid && quick) return;
                    }
                }
            }
        }
    }, {
        '_name': 'TWO BY TWO CHECK',
        'or': ['twobytwo'],
        'exec': function(puzzle, regionNum, global, quick) {
            let isReg = function(x, y) { return isBounded(puzzle, x, y) && (matrix(global, x, y) === regionNum); };
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (this.or.includes(cell.type)) {
                    if ( isReg(x+2, y-2) && isReg(x+2, y) && isReg(x, y-2) 
                      || isReg(x-2, y-2) && isReg(x-2, y) && isReg(x, y-2) 
                      || isReg(x+2, y+2) && isReg(x+2, y) && isReg(x, y+2) 
                      || isReg(x-2, y+2) && isReg(x-2, y) && isReg(x, y+2)) { // thats a long if statement 
                        console.info('[!] Two-by-two fault at', x, y);
                        global.regionData[regionNum].addInvalid(puzzle, c);
                        if (!puzzle.valid && quick) return;
                    }
                }
            }
        }
    }, {
        '_name': 'CELLED HEX CHECK',
        'or': ['celledhex'],
        'exec': function(puzzle, regionNum, global, quick) {
            let hexes = [];
            let colors = [];
            let darts = [];
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                switch (cell.type) {
                    case 'divdiamond':
                    case 'poly':
                        return; // true immediately
                    case 'celledhex':
                        hexes.push({'pos': c, 'cell': cell});
                        break;
                    case 'dart':
                        darts.push({'pos': c, 'dir': dr(cell.rot)});
                        break;
                    case 'sun':
                        colors.push(cell.color);
                        break;
                }
            }
            if (!hexes.length) return; // true epic
            for (const color of colors) {
                hexes = hexes.filter(c => { return c.cell.color != color; });
                if (!hexes.length) return; // true epic
            }
            for (const dart of darts) {
                let [sourcex, sourcey] = xy(dart.pos);
                let x = sourcex + dart.dir.x * 2;
                let y = sourcey + dart.dir.y * 2;
                for (let _ = 1; _ < puzzle.width * puzzle.height; _++) { // every square must be traveled if the loop gets to this point
                    if (!isBounded(puzzle, x, y)) break; 
                    if (x == sourcex && y == sourcey) break; 
                    hexes = hexes.filter(c => { return c.pos != ret(x, y); });
                    if (!hexes.length) return; // true epic
                    x += dart.dir.x * 2; y += dart.dir.y * 2 // increment
                    if (puzzle.pillar) x = (x + puzzle.width) % puzzle.width;
                }
            }
            console.info('[!] Celled Hex Fault');
            for (const hex of hexes) { // hexes also interact with negators, to be always wrong
                puzzle.valid = false;
                puzzle.invalidElements.push(hex.pos);
            }
        }
    }, {
        '_name': 'POLYOMINO CHECK GOES HERE',
        'or': ['poly', 'ylop', 'polynt', 'scaler'],
        'exec': function(puzzle, regionNum, global, quick) {
            let polys = []; let scalers = [0, 0];
            let pos = { poly: [], ylop: [], polynt: [], scaler: [] };
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                pos[cell.type].push(c);
                if (cell.type == 'scaler') {
                    if (cell.flip) scalers[1]++;
                    else scalers[0]++;
                }
                else polys.push(new Polyomino(puzzle, c));
            }
            let downscalable = [];          
            for (let i = 0; i < polys.length; i++) if (polys[i].downscalable()) downscalable.push(i); // every polys are upscalable rn
            global.polyntCorrect[regionNum] = true; global.polyIncorrect[regionNum] = true;
            let ret = window.polyFitMaster(puzzle, regionNum, global, polys, scalers, downscalable, Array.from({length: polys.length}, (_, i) => i));
            for (poly of polys) {
                poly.cell.polyshape = poly.shape;
            }
            for (mistake of ret)
                global.regionData[regionNum].addInvalids(puzzle, pos[mistake]);
        }
    }, {
        '_name': 'BRIDGE CHECK',
        'or': ['bridge'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (const color of global.bridgeRegions[regionNum]) {
                if (global.invalidBridges[color]) { // invalid
                    for (c of global.bridges[color]) {
                        let [x, y] = xy(c);
                        if (matrix(global, x, y) == regionNum) global.regionData[regionNum].addInvalid(puzzle, c);
                    }
                } else { // valid, start logic
                    //* make adjacency graph
                    let adj = {};
                    function isCellBridgePathFriendly(x, y, color) { 
                        if (matrix(global, x, y) !== regionNum) return false;
                        let cell = puzzle.getCell(x, y);
                        return !cell || !cell.color === null || cell.color === color; 
                    }
                    for (c of global.regions.cell[regionNum]) {
                        adj[c] = [];
                        let [x, y] = xy(c);
                        if (isCellBridgePathFriendly(x-2, y, color)) adj[c].push(ret(x-2, y));
                        if (isCellBridgePathFriendly(x+2, y, color)) adj[c].push(ret(x+2, y));
                        if (isCellBridgePathFriendly(x, y-2, color)) adj[c].push(ret(x, y-2));
                        if (isCellBridgePathFriendly(x, y+2, color)) adj[c].push(ret(x, y+2));
                    }
                    //* make tree
                    let seen = new Set();
                    let tree = new Set(global.bridges[color]);
                    function treeloop(fromparam) {
                        const from = fromparam;
                        seen.add(from);
                        for (const child of adj[from]) if (!seen.has(child)) {
                            treeloop(child);
                            if (tree.has(child)) tree.add(from);
                        }
                    }
                    treeloop(global.bridges[color][0]);
                    seen = new Set(tree);
                    //* check if tree is unique
                    function uniqueloop(from) {
                        seen.add(from);
                        let reachableTreeNode = null;
                        for (const child of adj[from]) {
                            const candidate = tree.has(child) ? child : (seen.has(child) ? null : uniqueloop(child));
                            if (candidate !== null && candidate !== reachableTreeNode) {
                                if (reachableTreeNode === null) reachableTreeNode = candidate;
                                else return -1;
                            }
                        }
                        return reachableTreeNode;
                    }
                    let res = false;
                    for (c of global.regions.cell[regionNum]) if (!seen.has(c) && (uniqueloop(c) === -1)) res = true;
                    if (res) {
                        console.info('[!] Bridge fault on region', regionNum, 'color', color, global.bridges[color]);
                        global.regionData[regionNum].addInvalids(puzzle, global.bridges[color]);
                    }
                }
            }
        }
    }
];

const postValidate = [

];

})