namespace(function() {

// 1. In MySQL Workbench, select all rows
// 2. Right click -> Copy row (tab separated)
// 3. Paste into a new file, save as puzzles.tsv
// 4. Go to http://127.0.0.1:5000/pages/verify_puzzles.html
// 5. Open the debugger, input the solution (or fix the solution) based on the log output
// 6. Copy the logged statement into MySQL Workbench and run it

window.onload = function() {
  setTimeout(function() {
    for (row of window.puzzles) {
      var hash = row[0]
      var puzzle_json = row[2]
      var solution_json = row[3]
      var title = row[5]

      var solution = Puzzle.deserialize(solution_json)
      window.validate(solution)
      if (!solution.valid) {
        // Unescape HTML (https://paulschreiber.com/blog/2008/09/20)
        var temp = document.createElement('div')
        temp.innerHTML = title
        document.getElementById('title').innerText = temp.childNodes[0].nodeValue + ' (hash: ' + hash + ')'

        solution.logGrid()
        var puzzle = Puzzle.deserialize(puzzle_json)
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

        break
      }
    }
  }, 100)
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
