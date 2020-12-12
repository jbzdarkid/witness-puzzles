namespace(function() {

// 1. In MySQL Workbench, run "select * from puzzle" and select all rows
// 2. Right click -> Copy row (tab separated)
// 3. Paste into a new file, save as puzzles.tsv
// 4. Go to http://127.0.0.1:5000/pages/verify_puzzles.html
// 5. Open the debugger, input the solution (or fix the solution) based on the log output
// 6. Copy the logged statement into MySQL Workbench and run it

function verifyPuzzle(hash, date, puzzle_json, solution_json, url, title) {
  var puzzle = Puzzle.deserialize(puzzle_json)
  var solution = Puzzle.deserialize(solution_json)

  // Note: Do not fix up puzzles here! If there is a bug with bad/malformed puzzle data, fix the deserializer.

  window.validate(solution, true)
  if (!solution.valid) {
    // Unescape HTML (https://paulschreiber.com/blog/2008/09/20)
    var temp = document.createElement('div')
    temp.innerHTML = title
    document.getElementById('title').innerText = temp.childNodes[0].nodeValue + ' (hash: ' + hash + ')'

    window.draw(puzzle)
    window.TRACE_COMPLETION_FUNC = function(solution) {
      var sql_statement = 'update puzzle\n' +
      'set solution_json = \'' + solution.serialize() + '\'\n' +
      'where display_hash = \'' + hash + '\'\n'
      console.info(sql_statement)
    }

    window.deletePuzzle = function() {
      var sql_statement = 'delete from puzzle\n' +
      'where display_hash = \'' + hash + '\'\n'
      console.info(sql_statement)
    }

    setLogLevel('log')
    window.validate(solution, false)
    solution.logGrid()
  }
  return solution.valid
}

var i = 0
window.onload = function() {
  function validateOnePuzzle() {
    if (i >= window.puzzles.length) {
      document.getElementById('title').innerText = 'All puzzles valid!'
      return
    }

    var row = window.puzzles[i]
    i++
    document.getElementById('title').innerText = 'Validating ' + row[0] + '...'
    var valid = verifyPuzzle(row[0], row[1], row[2], row[3], row[4], row[5])
    if (!valid) return
    setTimeout(validateOnePuzzle, 10)
  }
  validateOnePuzzle()
}

window.findPuzzle = function() {
  var search = prompt('Enter search term')
  for (row of window.puzzles) {
    var hash = row[0]
    var puzzle_json = row[2]
    var title = row[5]
    if (!search.includes(title)) continue

    var puzzle = Puzzle.deserialize(puzzle_json)
    window.draw(puzzle)



  }
}

})
