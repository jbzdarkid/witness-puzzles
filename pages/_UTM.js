var puzzle

window.onload = function() {
  loadPuzzleRegion('Tutorial')
}

function loadPuzzleRegion(region) {
  var areaPuzzles = document.getElementById('areaPuzzles')
  while (areaPuzzles.getElementsByTagName('option').length > 0) {
    areaPuzzles.getElementsByTagName('option')[0].remove()
  }
  // areaPuzzles.value = '' // Forces onchange to fire for any selection

  for (var puzzleInfo of window.ALL_PUZZLES) {
    if (puzzleInfo['area'] != region) continue
    var option = document.createElement('option')
    option.value = puzzleInfo['data']
    option.innerText = puzzleInfo['name']
    areaPuzzles.appendChild(option)
  }
}

function loadSinglePuzzle(puzzleData) {
  puzzle = Puzzle.deserialize(puzzleData)
  window.draw(puzzle)
}

function _showSolution(solutions, num) {
  if (num < 0) num = solutions.length - 1
  if (num >= solutions.length) num = 0

  var previousSolution = document.getElementById('previousSolution')
  var solutionCount = document.getElementById('solutionCount')
  var nextSolution = document.getElementById('nextSolution')

  solutionCount.innerText = (num + 1) + ' of ' + solutions.length
  previousSolution.onclick = function() {_showSolution(solutions, num - 1)}
  nextSolution.onclick = function() {_showSolution(solutions, num + 1)}

  window.draw(solutions[num])
  document.getElementById('solutionViewer').style.display = null
}

function solvePuzzle() {
  var solutions = window.solve(puzzle)
  // TODO: Some way of sorting solutions
  // https://github.com/jbzdarkid/witness-puzzles/blob/master/legacy/_UTM.js#L425
  _showSolution(solutions, 0)
}

