var puzzles = [
  {'display_hash':'2D99CC28', 'url':'/images/2D/2D99CC28.png', 'title':'foo'},
  {'display_hash':'EB678CA3', 'url':'/images/EB/EB678CA3.png', 'title':'bar'},
  {'display_hash':'F23DF4F6', 'url':'/images/F2/F23DF4F6.png', 'title':'baz'}
]

window.onload = function() {
  for (var link of document.getElementsByClassName('link')) {
    link.onclick = function() {
      window.location = this.getAttribute('href')
    }
  }

  var navbar = document.getElementById('navbar')
  navbar.style.borderBottom = '2px solid ' + window.BORDER
  navbar.style.background = window.PAGE_BACKGROUND


  // puzzles = SomeApiCall(); // Or, I can load this in the python layer? Both?
  var table = document.getElementById('puzzleTable')

  for (var puzzle of puzzles) {
    var cell = document.createElement('a')
    table.appendChild(cell)
    cell.href = '/play/' + puzzle.display_hash
    cell.style.margin = '30px'

    var img = document.createElement('img')
    cell.appendChild(img)
    img.style.maxHeight = '200px'
    img.src = puzzle.url

    cell.appendChild(document.createElement('br'))

    var label = document.createElement('label')
    cell.appendChild(label)
    label.innerText = puzzle.title
    label.style.cursor = 'pointer'
  }
}
