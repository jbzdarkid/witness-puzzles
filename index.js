window.updatePuzzle = function() {
    var svg = document.getElementById('puzzle')
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    var request = new XMLHttpRequest()
    request.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let puzzle = Puzzle.deserialize(this.responseText);
            document.getElementById('theme').href = './theme/' + puzzle.theme + '.css'
            draw(puzzle)
        }
    }
    request.open("GET", "./puzzles/" + window.currentPanel + '.json', true)
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    request.send()
}

window.onSolvedPuzzle = function(paths) {
    if (window.currentPanel == window.nowPanel && window.currentPanel != window.maxPanel) {
        window.currentPanel++;
        window.nowPanel++;
        window.updatePuzzle()
    }
}

function getNext() {
    if (window.currentPanel == window.nowPanel) return;
    window.currentPanel++;
    window.updatePuzzle()
}

function getPrev() {
    if (window.currentPanel == 0) return;
    window.currentPanel--;
    window.updatePuzzle()
}