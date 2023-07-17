JavaScript implementation of the puzzles in The Witness

If you want to see the product, head over to [witnesspuzzles.com](https://witnesspuzzles.com)

# Table of Contents
1. [Overview / Explanation of files](#Overview)
    1. [utilities.js](#utilitiesjs)
    1. [puzzle.js](#puzzlejs)
    1. [display2.js](#display2js)
    1. [svg.js](#svgjs)
    1. [validate.js](#validatejs)
    1. [polyominos.js](#polyominosjs)
    1. [trace2.js](#trace2js)
    1. [solve.js](#solvejs)
1. [Contributing](#Contributing)
1. [Legal](#Legal)

# Overview
This repo handles puzzle creation, solution, and displaying. The core engine is made of 8 files:

## utilities.js
This file has a bunch of small utilities (logging, color handling, settings, platform compatibility, sounds, and animations)

## puzzle.js
This contains the model of the system, it describes how the puzzles are stored.  
The internal grid contains the edges as well as the cells, so what is visually 2x2 is internally a 5x5.  
Regions are collections of cells, and are created once the puzzle has been divided by a line. Regions do not include the drawn line, so the regions are disjoint.  
Pillars are represented by cutting a column off the right-hand side, and any operations on the grid are simply done under modular arithmetic. This means that almost everything will call puzzle.getCell(x, y) instead of puzzle.grid[x][y], since x might be a value like -5, which needs to be "pillared".  
All objects in the grid are JSON objects, with a 'type' parameter. 'type=line' represents the lines around the cells -- these objects should never be null, since they also retain information about start, end, dots, and gaps. Types like 'square', 'star', 'triangle', 'negation' represent more conventional puzzle mechanics.  
Puzzle objects can sometimes be 'solution objects', which means they have a path traced on them. There is no guarantee made that this path is continuous, valid, or non-branching.

## display2.js
This contains the view of the system, it takes a puzzle object and renders it. Again, the rendering is dumb, and won't check for bad input data (e.g. overlapping gaps + dots). All of the puzzle is rendered into the same SVG, to which future drawings may be added.  
However, once the puzzle has been drawn, it is considered 'flat', and it should be treated as if it were a static image.  
This file also deals with the rendering of so called 'solution objects', aka puzzles with lines on them. The drawing follows the data inside the grid blindly, with no additional validation.

## svg.js
This contains the exact pixel values for the mechanics, along with variant logic (e.g. rotating gaps, rendering polyominos from numeric mask, or positioning multiple triangles).  
In general, nothing outside of svg should be aware of the size or looks of the rendered objects.

## validate.js
The primary method here is validate(), which takes a puzzle object and annotates it with validity. This determines which mechanics need to be validated, along with checking each applicable mechanic.  
As well as validity, validate() will also determine the list of invalid elements and the list of negation pairings. Since both of these need to be computed fully, there are no early exits, all applicable mechanics must be evaluated.  
Aside from marking validity, invalid elements, and negations, the original puzzle object is unmodified, and subsequent calls to validate() will return the same result, invalid elements, and negations.

## polyominos.js
This file is an extension of logic from validate.js. It contains all logic and lists of polyominos.  
Polyominos in this engine are represented by bitmask -- each one fits into 16 bits. As with everywhere in this system, X represents horizontal, and Y represents vertical, so bit 7 would be `X=1`, `Y=3` (`X*4 + Y = mask`). You could also say "1 across, 3 down".  
The key bit of logic here is polyominoFromPolyshape, which converts one of these masks (very small, easy to manage) into a list of grid locations. Recall that the grid is double-sized, so this also does the job of filling out the spaces between the polyomino's "squares".  

## trace2.js
Tracing (drawing lines on the grid) is one of the most complex parts of this engine. While drawing a line, yoru position is tracked in four ways:  
First, data.pos tracks your position in the puzzle grid.  
Second, data.x and data.y track the position of the cursor in the rendered puzzle.  
Third, data.bbox (bounding box) tracks the edges of the current cell.  
Fourth, data.path keeps track of the movement through the grid, and also handles all of the actually drawn paths.  

Tracing takes the following steps:
1. Handle wall collision and determine in which direction the excess motion should be redirected. This also detects if you should turn at an intersection.  
At this point, all of the resulting movement is linear, though the direction is not explicitly known. data.x/data.y will now be the 'final' location of the cursor, and the bounding box/path/position will play catch-up.  
2. Handle gap collision and collision with the symmetrical line. This needs to be comptuted at every cell to ensure that moving multiple cells in one frame doesn't skip over gaps.  
3. Determine if the position has changed cells -- if so, compute the direction which we moved.  
Additionally, prevent the cursor from leaving the grid if the momentum is too serious.  
If the direction is none, we stop the loop at this time.  
4. If we moved to wrap around a pillar, update data.x to account for this motion.  
  4a. If this direction is the opposite of the last direction, we backed up into the previous cell. In this case, we remove a segment from the path and then change data.pos (our location in the grid).  
  4b. If this direction is not the opposite, we entered a new cell. In this case, change data.pos and then add a segment to the path.  
5. Goto 2  

## solve.js
This is a very straightforwards brute-force solver. We do depth-first recursive backtracking to try every single solution to the puzzle. We compute if the current cell is valid (not already colored), and then recurse in all 4 directions.  
Once we hit a wall, we can validate the region we've just enclosed. If it's invalid (or we've just cut off our only exit), there's no reason to keep going.   
The solution path is saved on the grid to allow for easy re-tracing.

# Contributing
I'm not accepting contributions at this time, but I am accepting feedback via the main site. Thank you for your interest!

# Legal
This code is licensed under BSD 3-Clause. You are free to fork this project and play with it, within the limits of [the license](LICENSE.md).
