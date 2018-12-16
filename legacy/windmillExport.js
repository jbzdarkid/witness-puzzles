function exportToWindmill() {
  var entities = []
  var consecutiveEmpty = 0
  for (var x=0; x<puzzle.grid.length; x++) {
    for (var y=0; y<puzzle.grid[x].length; y++) {
      var entity = puzzle.grid[x][y]
      if (entity == false) {
        consecutiveEmpty++
      } else {
        if (consecutiveEmpty > 0) {
          var emptyRLE = new Entity()
          emptyRLE.count = consecutiveEmpty
          entities.push(emptyRLE)
          consecutiveEmpty = 0
        }
        entities.push(entity) // TODO: More encoding needed

        var types = ['unknown', 'none', 'basic', 'start', 'end', 'disjoint', 'hexagon', 'square', 'star', 'tetris', 'error', 'triangle']
        var colors = ['uknown', 'black', 'white', 'cyan', 'magenta', 'yellow', 'red', 'green', 'blue', 'orange']
        // Start point
        // var index = x + puzzle.grid.length*y
        // this.entities[index] = new Entity(Type.START)
        // End point
        // new Entity(Type.END, undefined, new Orientation(1, 0))
      }
    }
  }
  if (consecutiveEmpty > 0) {
    var emptyRLE = new Entity()
    emptyRLE.count = consecutiveEmpty
    entities.push(emptyRLE)
    consecutiveEmpty = 0
  }

  var storage = new Storage(puzzle.width, entities)
  var encoded = storage.encode64()
  // Base64UrlSafe
  encoded = encode.replace(/\//g, '_').replace(/\+/g, '-')
  return encoded + '_0'
}