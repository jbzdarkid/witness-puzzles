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
            if (!this.nega?.length) { // oh no! no more negators!
                if (this.copier?.length && this.negaSource) { // but i can copy the used up negator!
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

const NEGATE_IMMEDIATELY = ['dot', 'cross', 'curve', 'triangle', 'atriangle', 'arrow', 'dart', 'twobytwo']; // these work individually, and can be negated
const CHECK_ALSO = { // removing this 1 thing can affect these other symbols
    'square': ['pentagon'],
    'pentagon': ['square'],
    'celledhex': ['dart', 'divdiamond', 'poly', 'ylop']
};
const ALWAYS_CHECK = ['bridge', 'star', 'pokerchip'];
const METASHAPES = ['nega', 'copier'];
const NONSYMBOLS = ['line']; // extension sake
const NONSYMBOL_PROPERTY = ['type', 'line', 'start', 'end'];
const COLOR_DEPENDENT = ['square', 'star', 'pentagon', 'vtriangle', 'bridge'];

function eraseShape(puzzle, x, y) {
    let cell = puzzle.grid[x][y];
    if (NONSYMBOLS.includes(cell?.type)) {
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
function ret(x, y, w=width) { return y * w + x; }
function xy(c, w=width) { return [c % w, Math.floor(c / w)]; }
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
function dr(n) { return [DIR[n].x, DIR[n].y]; }
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
function contains(a, b) {
    let max = (a.length > b.length) ? a : b;
    let min = (a.length > b.length) ? b : a;
    for (e of min) if (!max.includes(e)) return false;
    return true;        
}
function isBounded(puzzle, x, y) { return (0 <= x && x < puzzle.width && 0 <= y && y < puzzle.height); }
function matrix(global, x, y) { return global.regionMatrix[y]?.[x]; }
function safepush(obj, k, v, makeset=false) { obj[k] ??= (makeset ? new Set() : []); makeset ? obj[k].add(v) : obj[k].push(v); }
function getPortalCoords(c, data) { // from: <real>, to: PortalCoords(portalOffset-Adjusted)<virtual>
    for (const i in data.originalRegions.all) {
        if (data.originalRegions.all[i].includes(c)) {
            let [x, y] = xy(c);
            x += data.offset[i][0]; y += data.offset[i][1];
            return ret(x - data.totalSpan[0], y - data.totalSpan[1], data.width);
        }
    }
    return undefined;
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
    if (puzzle.valid) {
        for (fn of preValidate) {
            if (fn.or ? intersects(fn.or, global.shapes) : (fn.orNot ? !intersects(fn.orNot, global.shapes) : fn.orCustom(puzzle, global))) { // prereq for exec
                fn.exec(puzzle, global, quick); if (!puzzle.valid && quick) return;
            }
        }
        for (fn of lineValidate) { // zeroth region (on-the-line) detection
            if (fn.or ? intersects(fn.or, global.regionShapes[0]) : (fn.orNot ? !intersects(fn.orNot, global.shapes) : fn.orCustom(puzzle, global))) { 
                fn.exec(puzzle, global, quick); if (!puzzle.valid && quick) return;
            }
        }
        for (let i = 1; i < global.regions.all.length; i++) { // there is at least 1 region (i think)
            for (fn of validate) {
                if (fn.or ? intersects(fn.or, global.regionShapes[i]) : (fn.orNot ? !intersects(fn.orNot, global.shapes) : fn.orCustom(puzzle, global))) { 
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
    let portalColorPos = {};
    let portalRegionPos = {};
    let portalRegionColor = {};
    let portalColorRegion = {};
    let portalPosColor = {};
    let portalPosRegion = {};
    for (let x = 0; x < puzzle.width; x++) {
        for (let y = 0; y < puzzle.height; y++) {
            let cell = puzzle.grid[x][y];
            if (cell == null) continue;
            if (cell.type == 'portal') {
                global.shapes.add('portal');
                safepush(portalColorPos, cell.color, ret(x, y));
                portalPosColor[ret(x, y)] = cell.color;
            }
        }
    }
    for (region of puzzle.getRegions()) {
        i++;
        global.regions.all.push([])
        for (const pos of region.cells) {
            let c = ret(pos.x, pos.y);
            global.regionMatrix[pos.y][pos.x] = i;
            global.regions.all[i].push(ret(pos.x, pos.y));
        }
        global.regionNum = i + 1;
    }
    if (global.shapes.has('portal')) { // certified portal business
        for (const color in portalColorPos) for (const c of portalColorPos[color]) {
            const region = matrix(global, ...xy(c));
            safepush(portalRegionPos, region, c);
            portalPosRegion[c] = region;
            safepush(portalRegionColor, region, color);
            safepush(portalColorRegion, color, region);
        }
        // step 1: find two in same region
        for (const region in portalRegionColor) {
            if ((new Set(portalRegionColor[region])).size !== portalRegionColor[region].length) { // check duppes
                console.info('[!] Portal Fault: dupe portal at region', region);   
                puzzle.valid = false;
                puzzle.invalidElements.push(...(portalRegionPos[region]));
                return [puzzle, global];
            }
        }
        // step 2: link together
        let portalRegionLinks = [];
        let temp = null;
        for (const group of Object.values(portalColorRegion)) {
            temp = group;
            for (let i = 0; i < portalRegionLinks.length; i++) {
                if (temp.length == 1) {
                    temp = null;
                    break;
                } else if (contains(portalRegionLinks[i], temp)) {
                    console.info('[!] Portal Fault: portal loop detected');   
                    puzzle.valid = false;
                    console.info(group, portalRegionLinks[i]);
                    puzzle.invalidElements.push(...group, ...portalRegionLinks[i]);
                    return [puzzle, global];
                } else if (intersects(portalRegionLinks[i], temp)) {
                    portalRegionLinks[i].push(...temp);
                    temp = null;
                    break;
                }
            }
            if (temp) {
                portalRegionLinks.push(temp);
            }
        }
        portalRegionLinks = portalRegionLinks.map(arr => [...new Set(arr)]);
        // step 3: merge the regions
        function calcSpan(arr, span=[null, null, null, null], offset=[0, 0]) {
            let [x1, y1, x2, y2] = span;
            for (const c of arr) {
                let [x, y] = xy(c);
                x += offset[0]; y += offset[1];
                if (x1 === null) [x1, y1, x2, y2] = [x, y, x, y];
                else {
                    if (x < x1) x1 = x;
                    if (x > x2) x2 = x;
                    if (y < y1) y1 = y;
                    if (y > y2) y2 = y;
                }
            }
            return [x1, y1, x2, y2];
        }

        function loop(data, sourceRegion, sourceOffset) {
            for (const source of portalRegionPos[sourceRegion]) {
                data.originalRegions.all[data.originalRegionNums.indexOf(portalPosRegion[source])] = global.regions.all[portalPosRegion[source]].slice();
                const color = portalPosColor[source];
                const destList = portalColorPos[color].filter(e => e != source);
                for (const dest of destList) {
                    if (dest === undefined) continue;
                    const region = portalPosRegion[dest];
                    if (data.originalRegionNums.includes(region)) continue;
                    data.originalRegionNums.push(region);
                    let [x1, y1, x2, y2] = [...xy(source), ...xy(dest)];
                    const offset = [x1 - x2 + sourceOffset[0], y1 - y2 + sourceOffset[1]];
                    data.offset.push(offset);
                    data.totalSpan = calcSpan(global.regions.all[region], data.totalSpan, offset);
                    loop(data, region, offset);
                }
            }
        }
        
        if (portalRegionLinks.reduce((prv, cur) => { return Math.max(cur.length, prv) }, 0) > 1) { // single portal (trol)
            global.portalData = {};
            portalRegionLinks = portalRegionLinks.map(arr => { return arr.sort((a, b) => a - b) }); // sort
            for (const group of portalRegionLinks) { // actual start of step 3 (pane)
                global.portalData[group[0]] = {
                    'originalRegionNums': [group[0]],
                    'originalRegions': {
                        all: [],
                        cell: [],
                        line: [], 
                        corner: [],
                        edge: [],
                    },
                    'regions': {
                        all: [],
                        cell: [],
                        line: [],
                        corner: [],
                        edge: [],
                    },
                    'regionPosCell': {},
                    'totalSpan': calcSpan(global.regions.all[group[0]]), // x1, y1, x2, y2
                    'offset': [[0, 0]], // x, y
                };
                let data = global.portalData[group[0]];
                loop(data, group[0], data.offset[0]);
                if (data.totalSpan[0] > data.totalSpan[2]) { let temp = data.totalSpan[0]; data.totalSpan[0] = data.totalSpan[2]; data.totalSpan[2] = temp; }
                if (data.totalSpan[1] > data.totalSpan[3]) { let temp = data.totalSpan[1]; data.totalSpan[1] = data.totalSpan[3]; data.totalSpan[3] = temp; }
                data.totalSpan[2] += 1; data.totalSpan[3] += 1;
                // console.info(data.totalSpan);
                if ((data.totalSpan[0] % 2) != 0) data.totalSpan[0] -= 1;
                if ((data.totalSpan[1] % 2) != 0) data.totalSpan[1] -= 1;
                if ((data.totalSpan[2] % 2) != 0) data.totalSpan[2] += 1;
                if ((data.totalSpan[3] % 2) != 0) data.totalSpan[3] += 1;
                data.width = data.totalSpan[2] - data.totalSpan[0] + 1;
                data.height = data.totalSpan[3] - data.totalSpan[1] + 1;
                for (let i = 0; i < data.offset.length; i++) {
                    const offset = data.offset[i];
                    const list = data.originalRegions.all[i];
                    for (const c of list) {
                        let [x, y] = xy(c);
                        let cell = puzzle.getCell(x, y);
                        const newc = getPortalCoords(c, data);
                        data.regions.all.push(newc);
                        if (!cell || (cell.type == 'line' && !cell.dot)) continue;
                        safepush(data.regionPosCell, newc, cell);
                    }
                    data.regions.all = [...new Set(data.regions.all)];
                }
            }
            // step 4: actually merge regions
            let conversionTable = Array.from({length: global.regionNum}, (_, i) => i);
            for (const data of Object.values(global.portalData)) {
                for (let i = 1; i < data.originalRegionNums.length; i++) {
                    const num = conversionTable.indexOf(data.originalRegionNums[i]);
                    if (num < 0) continue; // sanity check
                    conversionTable.splice(num, 1, data.originalRegionNums[0]);
                }
            }
            let numLookup = [...new Set(conversionTable)].sort((a, b) => a - b);
            conversionTable = conversionTable.map(a => numLookup.indexOf(a));
            for (const num in global.portalData) {
                global.regions.all[num] = global.portalData[num].originalRegions.all.flat();
            }
            global.regions.all = global.regions.all.filter((_, i) => numLookup.includes(i));
            global.regionMatrix = global.regionMatrix.map(row => row.map(i => conversionTable[i]))
            global.regionNum = numLookup.length;
            // step 4.5: rename
            global.portalRegion = [];
            global.portalData = Object.values(global.portalData);
            for (const i in global.portalData) for (const k of global.portalData[i].originalRegionNums) {
                global.portalRegion[i] = conversionTable[k]
            }
        }
    }
    for (let i = 0; i < global.regionNum; i++) {
        global.regionData.push(new RegionData())
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
    // ACCESS POINTS FILTERING
    function filterRegionArr(data, source, dest, fn) {
        data[dest] = data[source].map(arr => arr.filter(c => fn(...xy(c))));
    }

    filterRegionArr(global.regions, 'all', 'cell',    detectionMode.cell);
    filterRegionArr(global.regions, 'all', 'line',    detectionMode.line);
    filterRegionArr(global.regions, 'line', 'corner', detectionMode.corner);
    filterRegionArr(global.regions, 'line', 'edge',   detectionMode.edge);

    global.regionCells = { all: [], cell: [], line: [], corner: [], edge: [] };
    for (const region of global.regions.all) {
        global.regionCells.all.push(region.filter(c => { let cell = cel(puzzle, c); if (!cell) return false; if (cell.type == 'line' && !cell.dot) return false; return true; }));
    }
    
    filterRegionArr(global.regionCells, 'all', 'cell',    detectionMode.cell);
    filterRegionArr(global.regionCells, 'all', 'line',    detectionMode.line);
    filterRegionArr(global.regionCells, 'line', 'corner', detectionMode.corner);
    filterRegionArr(global.regionCells, 'line', 'edge',   detectionMode.edge);

    if (global.portalData) for (const data of global.portalData) { 
        const w = data.width;
        filterRegionArr(data.originalRegions, 'all', 'cell',    detectionMode.cell);
        filterRegionArr(data.originalRegions, 'all', 'line',    detectionMode.line);
        filterRegionArr(data.originalRegions, 'line', 'corner', detectionMode.corner);
        filterRegionArr(data.originalRegions, 'line', 'edge',   detectionMode.edge);
        
        data.regions.cell   = data.regions.all .filter(c => detectionMode.cell  (...xy(c, w)));
        data.regions.line   = data.regions.all .filter(c => detectionMode.line  (...xy(c, w)));
        data.regions.corner = data.regions.line.filter(c => detectionMode.corner(...xy(c, w)));
        data.regions.edge   = data.regions.line.filter(c => detectionMode.edge  (...xy(c, w)));
    }

    global.regionShapes = [];
    for (const region of global.regionCells.all) {
        let st = new Set();
        for (shape of region) {
            const cell = puzzle.getCell(...xy(shape));
            if (cell?.type == 'line') {
                if (!cell.dot) continue;
                if (window.DOT_BLACK <= cell.dot && cell.dot < 5) st.add('dot');
                else if (window.CUSTOM_CROSS >= cell.dot && cell.dot > window.CUSTOM_CURVE) st.add('cross');
                else if (window.CUSTOM_CURVE >= cell.dot && cell.dot > window.CUSTOM_X) st.add('curve');
                else if (window.CUSTOM_X >= cell.dot) st.add('x');
            } else st.add(cell?.type);
        }
        global.regionShapes.push([...st]);
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
                    if (!cell?.color) continue;
                    global.regionColors[k][i][cell.color] ??= [];
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
                global.vtriangleColors[color] ??= count;
                for (const [k, v] of Object.entries(global.vtriangleColors)) {
                    if (k == color) { if (v != count)   global.vtriangleColors[k] = -1; }
                    else              if (v == count) { global.vtriangleColors[k] = -1; global.vtriangleColors[color] = -1; }
                }
            }
        }
    }, {
        '_name': 'SIZER VALUE DETERMINATION',
        'or': ['sizer'],
        'exec': function(puzzle, global, quick) {
            let globalSizerInfo = [];
            for (let i = 1; i < global.regionNum; i++) { 
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
                    global.sizerWeights[k] ??= v;
                    if (global.sizerWeights[k] != v) global.sizerWeights[k] = -1;
                }
            }
        }
    }, {
        '_name': 'BLACK HOLES CHECK',
        'or': ['blackhole', 'whitehole'],
        'exec': function(puzzle, global, quick) {
            let count = {};
            let pos = {};
            global.invalidHoles = [];
            for (const region of global.regionCells.cell) for (const c of region) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                let color = cell.type + cell.color;
                if (!pos[color]) {
                    count[color] = [0, 0, 0, 0];
                    pos[color] = [];
                }
                pos[color].push(c);
                if (cell.type == 'blackhole') {
                    if (matrix(global, x+1, y) === 0) count[color][0]++;
                    if (matrix(global, x-1, y) === 0) count[color][1]++;
                    if (matrix(global, x, y-1) === 0) count[color][2]++;
                    if (matrix(global, x, y+1) === 0) count[color][3]++;
                } else {
                    if (matrix(global, x+1, y+1) === 0) count[color][0]++;
                    if (matrix(global, x-1, y-1) === 0) count[color][1]++;
                    if (matrix(global, x+1, y-1) === 0) count[color][2]++;
                    if (matrix(global, x-1, y+1) === 0) count[color][3]++;
                }
            }
            for (color in pos) {
                if (!(count[color][0] == 1 && count[color][1] == 1 && count[color][2] == 1 && count[color][3] == 1)) {
                    global.invalidHoles.push(...pos[color]);
                    if (!puzzle.valid && quick) return;
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
                    global.bridgeRegions[color] ??= new Set([matrix(global, x, y)]);
                    global.bridgeRegions[color].add(matrix(global, x, y));
                    if (global.bridges[color]) { // already existing
                        global.invalidBridges[color] ??= global.bridges[color];
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
            let bridgeRegions = Array.from({length: global.regionNum}, () => []);
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
                color[cell.type] ??= cell.color; // init
                if (color[cell.type] != cell.color) { // bonk
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
        '_name': 'ANTITRIANGLE CHECK',
        'or': ['atriangle'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum]) {
                let [x, y] = xy(c);
                let cell = puzzle.getCell(x, y);
                if (!this.or.includes(cell.type)) continue;
                let count = 0 // undefined + undefined = NaN !== 0
                // 1,0 -1,0 0,1 0,-1 -1,2, 1,2 2,-1 2,1 -1,-2 1,-2 -2,-1 -2,1
                if (matrix(global, x+1, y) + matrix(global, x, y+1) === 0) count++;
                if (matrix(global, x-1, y) + matrix(global, x, y+1) === 0) count++;
                if (matrix(global, x+1, y) + matrix(global, x, y-1) === 0) count++;
                if (matrix(global, x-1, y) + matrix(global, x, y-1) === 0) count++;
                if (matrix(global, x+2, y+1) + matrix(global, x+1, y+2) === 0) count++;
                if (matrix(global, x-2, y+1) + matrix(global, x-1, y+2) === 0) count++;
                if (matrix(global, x+2, y-1) + matrix(global, x+1, y-2) === 0) count++;
                if (matrix(global, x-2, y-1) + matrix(global, x-1, y-2) === 0) count++;
                if (matrix(global, x+1, y) + matrix(global, x+2, y+1) === 0) count++;
                if (matrix(global, x+1, y) + matrix(global, x+2, y-1) === 0) count++;
                if (matrix(global, x-1, y) + matrix(global, x-2, y+1) === 0) count++;
                if (matrix(global, x-1, y) + matrix(global, x-2, y-1) === 0) count++;
                if (matrix(global, x, y+1) + matrix(global, x+1, y+2) === 0) count++;
                if (matrix(global, x, y+1) + matrix(global, x-1, y+2) === 0) count++;
                if (matrix(global, x, y-1) + matrix(global, x+1, y-2) === 0) count++;
                if (matrix(global, x, y-1) + matrix(global, x-1, y-2) === 0) count++;
                if (count != cell.count) {
                    console.info('[!] Anti-Triangle fault at', x, y, 'needs', cell.count, 'turns - actually has', count);
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
        '_name': 'CHIPS CHECK',
        'or': ['pokerchip'],
        'exec': function(puzzle, regionNum, global, quick) {
            const isPortaled = global.portalRegion && (global.portalRegion.indexOf(regionNum) + 1);
            const data = isPortaled ? global.portalData[isPortaled-1] : null;
            const w = data ? data.width : puzzle.width;
            let mode = {};
            let pos = {};
            let chippos = {};
            for (const c of global.regionCells.cell[regionNum]) { // here we go
                const [x, y] = data ? xy(getPortalCoords(c, data), w) : xy(c);
                let cell = puzzle.getCell(...xy(c));
                let color = cell.color;
                if (this.or.includes(cell.type)) {
                    if (!chippos[color]) chippos[color] = [];
                    chippos[color].push(c);
                }
                if (mode[color] == -1) continue; // bonked
                if (mode[color] === undefined) { // detected 1
                    mode[color] = null;
                    pos[color] = [x, y];
                } else if (mode[color] === null) { // detected 2
                    if (x == pos[color][0]) {
                        mode[color] = 0;
                        pos[color] = x;
                    } else if (y == pos[color][1]) {
                        mode[color] = 1;
                        pos[color] = y;
                    } else mode[color] = -1;
                } else {
                    if (mode[color] == 0) { if (x != pos[color]) mode[color] = -1; }
                    else { if (y != pos[color]) mode[color] = -1; }
                }
            }
            for (color in chippos) {
                if (mode[color] == -1 || mode[color] == undefined) global.regionData[regionNum].addInvalids(puzzle, chippos[color]);
            }
        }
    }, {
        '_name': 'ARROW CHECK',
        'or': ['arrow'],
        'exec': function(puzzle, regionNum, global, quick) {     
            for (let c of global.regionCells.cell[regionNum]) {
                let [sourcex, sourcey] = xy(c);
                let cell = puzzle.getCell(sourcex, sourcey);
                if (!this.or.includes(cell.type)) continue;
                let count = 0; let [dx, dy] = dr(cell.rot);
                let x = sourcex; let y = sourcey;
                x -= dx; y -= dy;
                dx *= 2; dy *= 2; x += dx; y += dy;
                for (let _ = 1; _ < puzzle.width * puzzle.height; _++) { // every square must be traveled if the loop gets to this point
                    if (puzzle.pillar) x = (x + puzzle.width) % puzzle.width;
                    if (!isBounded(puzzle, x, y)) break; 
                    if (x == sourcex && y == sourcey) break; 
                    if (matrix(global, x, y) === 0) {
                        count++;
                        if (count > cell.count) break;
                    }
                    x += dx; y += dy // increment
                }
                if (cell.count != count) {
                    console.info('[!] Arrow fault at', sourcex, sourcey, 'needs', cell.count, 'instances - actually has', count);
                    global.regionData[regionNum].addInvalid(puzzle, c);
                    if (!puzzle.valid && quick) return;
                }
            }
        }
    }, {
        '_name': 'DART CHECK',
        'or': ['dart'],
        'exec': function(puzzle, regionNum, global, quick) {
            const isPortaled = global.portalRegion && (global.portalRegion.indexOf(regionNum) + 1);
            let darts = [];
            for (const c of global.regionCells.cell[regionNum]) if (this.or.includes(puzzle.getCell(...xy(c)).type)) darts.push(c);
            const data = isPortaled ? global.portalData[isPortaled-1] : null;
            let span = data ? data.totalSpan : [0, 0, puzzle.width, puzzle.height];
            for (const c of darts) { // here we go
                const cell = puzzle.getCell(...xy(c));
                const dir = dr(cell.rot).map(a => a * 2); const count = cell.count;
                const w = data ? data.width : puzzle.width;
                const [sx, sy] = data ? xy(getPortalCoords(c, data), w) : xy(c);
                let [x, y] = [sx, sy];
                let wraparound = false;
                if ((puzzle.pillar && !data) || (puzzle.pillar && span[0] <= 0 && span[2] >= puzzle.width)) {
                    wraparound = true;
                    span[2] = puzzle.width;
                    span[0] = 0;
                }
                let target = 0;
                for (let i = 0; i < (data ? data.regions.cell.length : global.regions.cell[regionNum].length); i++) { // main detection loop
                    x += dir[0]; y += dir[1];
                    if (wraparound) {
                        if (x < 0) x += puzzle.width;
                        if (x >= puzzle.width) x -= puzzle.width;
                    }
                    if ((data && data.regions.cell.includes(ret(x, y, w))) || !data && matrix(global, x, y) == regionNum) target++;
                    if (span[0] > x || x >= span[2] || span[1] > y || y > span[3] || (x == sx && y == sy) || target > count) break;
                }
                if (target !== count) {
                    console.info('[!] Dart fault at', sx, sy, 'needs', count, 'instances - actually has', target);
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
            const isPortaled = (global.portalRegion != undefined) && (global.portalRegion.indexOf(regionNum) + 1);
            let twobytwos = [];
            for (const c of global.regionCells.cell[regionNum]) if (this.or.includes(puzzle.getCell(...xy(c)).type)) twobytwos.push(c);
            const data = isPortaled ? global.portalData[isPortaled-1] : null;
            const w = data ? data.width : puzzle.width;
            let isReg = function(x, y) { 
                if (data) return data.regions.cell.includes(ret(x, y, w, data.totalSpan[0], data.totalSpan[1]));
                else return matrix(global, x, y) == regionNum;
            };
            for (const c of twobytwos) {
                const [x, y] = data ? xy(getPortalCoords(c, data), w) : xy(c);
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
                        const [dxtemp, dytemp] = dr(cell.rot);
                        darts.push({'pos': c, 'dx': dxtemp*2, 'dy': dytemp*2});
                        break;
                    case 'star':
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
                let x = sourcex + dart.dx;
                let y = sourcey + dart.dy;
                for (let _ = 1; _ < puzzle.width * puzzle.height; _++) { // every square must be traveled if the loop gets to this point
                    if (!isBounded(puzzle, x, y)) break; 
                    if (x == sourcex && y == sourcey) break; 
                    hexes = hexes.filter(c => { return c.pos != ret(x, y); });
                    if (!hexes.length) return; // true epic
                    x += dart.dx; y += dart.dy // increment
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
        '_name': 'POLYOMINO CHECK',
        'or': ['poly', 'ylop', 'polynt', 'scaler'],
        'exec': function(puzzle, regionNum, global, quick) { 
            let polys = []; let scalers = [0, 0];
            let pos = { poly: [], ylop: [], polynt: [], scaler: [] };
            for (const c of global.regionCells.cell[regionNum]) {
                let cell = puzzle.getCell(...xy(c));
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
        '_name': 'BLACK HOLE CHECK',
        'or': ['blackhole', 'whitehole'],
        'exec': function(puzzle, regionNum, global, quick) {
            for (let c of global.regionCells.cell[regionNum])  
            if (global.invalidHoles.includes(c)) global.regionData[regionNum].addInvalid(puzzle, c);
        }
    }, {
        '_name': 'BRIDGE CHECK',
        'or': ['bridge'],
        'exec': function(puzzle, regionNum, global, quick) {
            const isPortaled = (global.portalRegion != undefined) && (global.portalRegion.indexOf(regionNum) + 1);
            let portals = [];
            if (isPortaled) for (const c of global.regionCells.cell[regionNum]) if (puzzle.getCell(...xy(c))?.type == 'portal') portals.push(c);
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
                    for (const p1 of portals) for (const p2 of portals) {
                        if (puzzle.getCell(...xy(p1)).color == puzzle.getCell(...xy(p2)).color && p1 != p2) adj[p1].push(p2);
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

// TODO: INTERACTION WITH: POLYOMINO, BRIDGE FINALIZE