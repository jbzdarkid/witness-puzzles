namespace(function() {

function isCellBridgePathFriendly(puzzle, color, pos) {
  if (pos.x%2 === 0 && pos.y%2 === 0) return false
  var cell = puzzle.getCell(pos.x, pos.y)
  return cell == null || cell.color == null || cell.color === color
}

function makeMinimalTree(graph, root, required) {
  var seen = Array(graph.length).fill(false)
  var result = Array(graph.length).fill(false)
  result[root] = true
  function dfs(node) {
    seen[node] = true
    result[node] = required[node]
    for (var child of graph[node]) {
      if (!seen[child]) {
        dfs(child)
        result[node] = result[node] || result[child]
      }
    }
  }
  dfs(root)
  return result
}

function isTreeUnique(graph, isInTree) {
  var seen = isInTree.slice()
  function dfs(node) {
    seen[node] = true
    var reachableTreeNode = null
    for (var child of graph[node]) {
      var candidate = null
      if (isInTree[child]) {
        candidate = child
      } else if (!seen[child]) {
        candidate = dfs(child)
      }
      if (candidate != null && candidate !== reachableTreeNode) {
        if (reachableTreeNode == null) {
          reachableTreeNode = candidate
        } else {
          return -1
        }
      }
    }
    return reachableTreeNode
  }
  for (var i = 0; i < graph.length; i++) {
    if (!seen[i]) {
      if (dfs(i) === -1) return false
    }
  }
  return true
}

function puzzleCellsAdjacent(first, second, pillar) {
  if (pillar && first.y == second.y && Math.abs(second.x - first.x) === puzzle.width - 1)
    return true
  return Math.abs(second.x - first.x) + Math.abs(second.y - first.y) === 1
}

function bridgeTest(region, puzzle, color, bridges) {
  var nodes = region.cells.filter(pos => isCellBridgePathFriendly(puzzle, color, pos))
  var graph = Array.from(Array(nodes.length), () => [])
  for (var ir = 1; ir < nodes.length; ir++) {
    var right = nodes[ir]
    for (var il = 0; il < ir; il++) {
      var left = nodes[il]
      if (puzzleCellsAdjacent(left, right, puzzle.pillar)) {
        graph[il].push(ir)
        graph[ir].push(il)
      }
    }
  }
  var isBridge = nodes.map(node => bridges.some(bridge => node.x === bridge.x && node.y === bridge.y))
  var isInTree = makeMinimalTree(graph, isBridge.indexOf(true), isBridge)
  for (var i = 0; i < nodes.length; i++) {
    if (isBridge[i] && !isInTree[i]) return false
  }
  return isTreeUnique(graph, isInTree)
}

window.validateBridges = function(puzzle, region, regionData) {
  var bridges = {}
  for (var pos of region) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == null) continue

    // Count color-based elements
    if (cell.color != null) {
      if (cell.type === 'bridge') {
        if (bridges[cell.color] == null) {
          bridges[cell.color] = []
        }
        bridges[cell.color].push(pos)
      }
    }
  }

  for (var color in bridges) {
    var total = 0
    var discardable = 0
    for (var x=1; x < puzzle.width; x+=2) {
      for (var y=1; y < puzzle.height; y+=2) {
        var cell = puzzle.getCell(x, y)
        if (cell != null) {
          if (cell.type === 'bridge' && cell.color === color) total++
          if (cell.type === 'nega') discardable++
        }
      }
    }

    if (bridges[color].length != total) {
      if (bridges[color].length >= total - discardable) {
        // TODO: Negations in other regions can validate the solution
        for (var bridge of bridges[color]) {
          regionData.addInvalid(bridge)
        }
      } else {
        for (var bridge of bridges[color]) {
          regionData.addVeryInvalid(bridge)
        }
      }
    } else if (!window.bridgeTest(region, puzzle, color, bridges[color])) {
      for (var bridge of bridges[color]) {
        regionData.addInvalid(bridge)
      }
    }
  }
}

var DIRECTIONS = [
  {'x': 0, 'y':-1},
  {'x': 1, 'y':-1},
  {'x': 1, 'y': 0},
  {'x': 1, 'y': 1},
  {'x': 0, 'y': 1},
  {'x':-1, 'y': 1},
  {'x':-1, 'y': 0},
  {'x':-1, 'y':-1},
]

window.validateArrows = function(puzzle, region, regionData) {
  for (var pos of region) {
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == null) continue
    if (cell.type != 'arrow') continue
    dir = DIRECTIONS[cell.rot]

    var count = 0
    var x = pos.x + dir.x
    var y = pos.y + dir.y
    for (var i=0; i<100; i++) { // 100 is arbitrary, it's just here to avoid infinite loops.
      var line = puzzle.getLine(x, y)
      console.spam('Testing', x, y, 'for arrow at', pos.x, pos.y, 'found', line)
      if (line == null && (x%2 !== 1 || y%2 !== 1)) break
      if (line > window.LINE_NONE) count++
      if (count > cell.count) break
      x += dir.x * 2
      y += dir.y * 2
      if (puzzle.matchesSymmetricalPos(x, y, pos.x + dir.x, pos.y + dir.y)) break // Pillar exit condition (in case of looping)
    }
    if (count !== cell.count) {
      console.log('Arrow at', pos.x, pos.y, 'crosses', count, 'lines, but should cross', cell.count)
      regionData.addInvalid(pos)
    }
  }
}

window.validateSizers = function(puzzle, region, regionData) {
  var sizers = []
  var regionSize = 0
  for (var pos of region) {
    if (pos.x%2 === 1 && pos.y%2 === 1) regionSize++ // Only count cells for the region
    var cell = puzzle.getCell(pos.x, pos.y)
    if (cell == null) continue
    if (cell.type == 'sizer') sizers.push(pos)
  }
  console.debug('Found', sizers.length, 'sizers')
  if (sizers.length == 0) return // No sizers -- no impact on sizer validity

  var sizerCount = regionSize / sizers.length
  if (sizerCount % 1 != 0) {
    console.log('Region size', regionSize, 'is not a multiple of # sizers', sizers.length)
    for (var sizer of sizers) {
      regionData.addInvalid(sizer)
    }
    return
  }

  if (puzzle.sizerCount == null) puzzle.sizerCount = sizerCount // No other sizes have been defined
  if (puzzle.sizerCount != sizerCount) {
    console.log('sizerCount', sizerCount, 'does not match puzzle sizerCount', puzzle.sizerCount)
    for (var sizer of sizers) {
      regionData.addInvalid(sizer)
    }
  }
}

})
