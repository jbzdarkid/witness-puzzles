window.updatePuzzle = function() {
    var svg = document.getElementById('puzzle')
    while (svg.firstChild) svg.removeChild(svg.firstChild)
    var request = new XMLHttpRequest()
    request.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let puzzle = Puzzle.deserialize(this.responseText);
            window.setTheme(puzzle.theme)
            draw(puzzle)
        }
    }
    request.open("GET", "./" + window.puzzleSet + "/" + window.currentPanel + '.json', true)
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    request.send()
}

window.onSolvedPuzzle = function(paths) {
    if (window.currentPanel >= window.nowPanel && window.currentPanel != window.maxPanel) {
        setTimeout(() => {
            window.currentPanel++;
            window[window.puzzleSet]++;
            window.nowPanel = window.currentPanel;
            window.updatePuzzle()
        }, 1000);
    }
}

window.reloadSymbolTheme = function() {
    draw(window.puzzle)
}

function getNext() {
    if (window.currentPanel == window.maxPanel) return;
    window.currentPanel++;
    window[window.puzzleSet]++;
    window.updatePuzzle()
}

function getPrev() {
    if (window.currentPanel == 0) return;
    window.currentPanel--;
    window[window.puzzleSet]--;
    window.updatePuzzle()
}