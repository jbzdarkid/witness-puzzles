JavaScript implementation of the puzzles in The Witness

# Table of Contents
1. [Overview / Explanation of files](#Overview)
  1. [utilities.js](#utilitiesjs)
  1. [puzzle.js](#puzzlejs)
1. [Contributing]
1. [Legal]

# Overview
This repo handles puzzle creation, solution, and displaying. The core engine is made of 8 files:

## utilities.js
This file has a bunch of small utilities (logging, color handling, settings, platform compatibility, sounds, and animations)

## puzzle.js
This contains the model of the system, it describes how the puzzles are stored.
The internal grid contains the edges as well as the cells, so what is visually 2x2 is internally a 5x5.
Regions are collections of cells, and are created once the puzzle has been divided by a line. Regions do not include the drawn line, so the regions are disjoint.
Pillars are represented by cutting a column off the right-hand side, and any operations on the grid are simply done under modular arithmetic. This means that almost everything will call puzzle.getCell(x, y) instead of puzzle.grid[x][y], since x might be a value like -5, which needs to be "pillared".
All objects in the grid are JSON objects, with a 'type' parameter. 'type=line' represents the lines around the cells -- these objects should never be undefined, since they also retain information about start, end, dots, and gaps. Types like 'square', 'star', 'triangle', 'negation' represent more conventional puzzle mechanics.
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
This file is separate from validate.js mostly for legacy reasons. It contains all logic and lists of polyominos.
Polyominos in this engine are represented by bitmask -- each one fits into 16 bits. As with everywhere in this system, X represents horizontal, and Y represents vertical, so bit 7 would be X=1, Y=3 (X*4 + Y = mask). You could also say "1 across, 3 down".
The key bit of logic here is polyominoFromPolyshape, which converts one of these masks (very small, easy to manage) into a list of grid locations. Recall that the grid is double-sized, so this also does the job of filling out the spaces between the polyomino's "squares".

## trace2.js
Tracing (drawing lines on the grid) is one of the most complex parts of this engine. It follows these steps:
1. Handle wall collision and determine in which direction the excess movement should be redirected. This also includes turning at intersections.
At this point, all of the movement is linear, though the direction is not explicitly known.
2. Handle gap collision and collision with the symmetrical line. This needs to be comptuted at every cell to ensure that moving multiple cells in one frame doesn't skip over gaps.
3. Determine if the position has changed cells -- if so, compute the direction which we moved
4. Determine if movement has caused a pillar rotation, and handle that edge case
5. Move the location to the next cell, and modify the puzzle object

## solve.js
