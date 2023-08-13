namespace(function() {

window.onload = function() {
  // First load should be smaller to improve FCP
  // However, we need to keep loading until we have a scrollbar, since further puzzles trigger onscroll
  while (document.body.scrollHeight == document.body.clientHeight) {
    if (!addPuzzles(20)) break
  }
}

var offset = 0
function addPuzzles(count) {
  var table = document.getElementById('puzzleTable')
  for (; offset < offset + count; offset++) {
    var puzzleData = window.puzzleList[offset] // Concatenation of display hash and title.
    if (puzzleData == null || puzzleData.length < 8) return false
    var displayHash = puzzleData.substring(0, 8)

    var cell = document.createElement('a')
    table.appendChild(cell)
    cell.href = 'play/' + displayHash + '.html'
    cell.style.margin = '30px'

    var img = document.createElement('img')
    cell.appendChild(img)
    img.style.maxHeight = '200px'
    img.src = 'https://witnesspuzzles-images.s3.amazonaws.com/' + displayHash.substring(0, 2) + '/' + displayHash + '.png'
    // img.src = 'images/' + displayHash + '.png'

    cell.appendChild(document.createElement('br'))

    var link = document.createElement('label')
    cell.appendChild(link)
    link.innerText = puzzleData.substring(8)
    link.style.cursor = 'pointer'
    link.style.color = window.TEXT_COLOR
  }

  return true
}

window.onscroll = function() {
  // Show 'scroll to top' if we're scrolled down sufficiently
  var scrollToTop = document.getElementById('scrollToTop')
  if (scrollToTop) scrollToTop.style.display = (document.body.scrollTop > 800 ? null : 'none')

  // Start loading content when we get close to the bottom
  var currentHeight = document.body.scrollTop + document.body.clientHeight
  if (currentHeight / document.body.scrollHeight > 0.8) {
    addPuzzles(100)
  }
}

})
