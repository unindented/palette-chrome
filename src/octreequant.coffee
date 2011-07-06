################################################################################
#
# Color quantizer using octrees.
#
# Original C++ implementation by John Cristy (http://www.imagemagick.org/).
# Ported to Java by Adam Doppelt (http://gurge.com/amd/java/quantize/).
# Ported to JavaScript by Daniel Perez Alvarez (http://unindented.org/).
#
################################################################################

root: exports ? this

################################################################################

QUICK = true

MAX_RGB = 255
MAX_NODES = 266817
MAX_TREE_DEPTH = 8

# these are precomputed in advance
SQUARES = x * x for x in [-MAX_RGB .. MAX_RGB]
SHIFT = 1 << (15 - x) for x in [0 .. MAX_TREE_DEPTH]

################################################################################

class OctreeQuant

  constructor: ->

  ##
  # Reduce the image to the given number of colors. The pixels are
  # reduced in place.
  # @return The new color palette.
  #
  quantizeImage: (pixels, max_colors) ->
    cube = new Cube(pixels, max_colors)

    cube.classification()
    cube.reduction()
    cube.assignment()

    return cube.colormap

class Cube

  constructor: (pixels, max_colors) ->
    @pixels = pixels
    @max_colors = max_colors

    @colormap = null

    @root = null
    @depth = 0

    # counter for the number of colors in the cube (this gets recalculated often)
    @colors = 0

    # counter for the number of nodes in the tree
    @nodes = 0

    # tree depth = log4 max_colors
    @depth = Math.floor(Math.log(max_colors) / Math.log(4)) + 1

    if @depth > MAX_TREE_DEPTH
      @depth = MAX_TREE_DEPTH
    else if @depth < 2
      @depth = 2

    @root = new Node(this)

  classification: ->
    width = @pixels.length
    height = @pixels[0].length

    # convert to indexed color
    for x in [width - 1 .. 0]
      for y in [height - 1 .. 0]
        pixel = @pixels[x][y]
        red   = (pixel >> 16) & 0xFF
        green = (pixel >>  8) & 0xFF
        blue  = (pixel >>  0) & 0xFF

        # a hard limit on the number of nodes in the tree
        if @nodes > MAX_NODES
          @root.pruneLevel()
          @depth--

        # walk the tree, increasing the number_pixels count for each node
        node = @root
        for level in [1 .. @depth]
          id = (((if red   > node.mid_red   then 1 else 0) << 0) |
                ((if green > node.mid_green then 1 else 0) << 1) |
                ((if blue  > node.mid_blue  then 1 else 0) << 2))

          new Node(node, id, level) if not node.child[id]?

          node = node.child[id]
          node.number_pixels += SHIFT[level]

        node.unique++
        node.total_red   += red
        node.total_green += green
        node.total_blue  += blue

    return this

  reduction: ->
    threshold = 1
    while @colors > @max_colors
      @colors = 0
      threshold = @root.reduce(threshold, Number.MAX_VALUE)

    return this

  assignment: ->
    @colormap = []

    @colors = 0
    @root.colormap()

    width = @pixels.length
    height = @pixels[0].length

    search = new Search()

    # convert to indexed color
    for x in [width - 1 .. 0]
      for y in [height - 1 .. 0]
        pixel = @pixels[x][y]
        red   = (pixel >> 16) & 0xFF
        green = (pixel >>  8) & 0xFF
        blue  = (pixel >>  0) & 0xFF

        # walk the tree to find the cube containing that color
        node = @root
        while true
          id = (((if red   > node.mid_red   then 1 else 0) << 0) |
                ((if green > node.mid_green then 1 else 0) << 1) |
                ((if blue  > node.mid_blue  then 1 else 0) << 2))
          break if not node.child[id]?
          node = node.child[id]

        if QUICK
          # if QUICK is set, just use that node (strictly speaking, this isn't
          # necessarily best match)
          @pixels[x][y] = node.color_number
        else
          # find the closest color
          search.distance = Number.MAX_VALUE
          node.parent.closestColor(red, green, blue, search)
          @pixels[x][y] = search.color_number

    return this

##
# The result of a closest color search.
#
class Search

  constructor: ->
    @distance = 0
    @color_number = 0


##
# A single node in the tree.
#
class Node

  constructor: (parent, id, level) ->
    @cube = null

    # parent node
    @parent = null

    # child nodes
    @child = null
    @nchild = 0

    # our index within our parent
    @id = 0
    # our level within the tree
    @level = 0
    # our color midpoint
    @mid_red   = 0
    @mid_green = 0
    @mid_blue  = 0

    # the pixel count for this node and all children
    @number_pixels = 0

    # the pixel count for this node
    @unique = 0
    # the sum of all pixels contained in this node
    @total_red   = 0
    @total_green = 0
    @total_blue  = 0

    # used to build the colormap
    @color_number = 0

    if not id? or not level?
      @cube = parent
      @parent = this
      @child = []
      @id = 0
      @level = 0

      @number_pixels = Number.MAX_VALUE

      @mid_red   = (MAX_RGB + 1) >> 1
      @mid_green = (MAX_RGB + 1) >> 1
      @mid_blue  = (MAX_RGB + 1) >> 1
    else
      @cube = parent.cube
      @parent = parent
      @child = []
      @id = id
      @level = level

      # add to the cube
      @cube.nodes++
      @cube.colors++ if @level == @cube.depth

      # add to the parent
      @parent.nchild++
      @parent.child[@id] = this

      # figure out our midpoint
      bi = (1 << (MAX_TREE_DEPTH - level)) >> 1
      @mid_red   = @parent.mid_red   + ((@id & 1) > 0 ? bi : -bi)
      @mid_green = @parent.mid_green + ((@id & 2) > 0 ? bi : -bi)
      @mid_blue  = @parent.mid_blue  + ((@id & 4) > 0 ? bi : -bi)

  ##
  # Remove this child node, and make sure our parent absorbs our pixel
  # statistics.
  #
  pruneChild: ->
    @parent.nchild--
    @parent.unique += @unique
    @parent.total_red   += @total_red
    @parent.total_green += @total_green
    @parent.total_blue  += @total_blue
    @parent.child[@id] = null
    @cube.nodes--
    @cube = null
    @parent = null

    return this

  ##
  # Prune the lowest layer of the tree.
  #
  pruneLevel: ->
    if @nchild != 0
      for id in [0..7]
        @child[id].pruneLevel() if @child[id]?

    @pruneChild() if @level == @cube.depth

    return this

  ##
  # Remove any nodes that have fewer than threshold pixels. Also, as long as
  # we're walking the tree:
  #
  #  - figure out the color with the fewest pixels
  #  - recalculate the total number of colors in the tree
  #
  reduce: (threshold, next_threshold) ->
    if @nchild != 0
      for id in [0..7]
        next_threshold = @child[id].reduce(threshold, next_threshold) if @child[id]?

    if @number_pixels <= threshold
      @pruneChild()
    else
      @cube.colors++ if @unique != 0
      next_threshold = @number_pixels if @number_pixels < next_threshold

    return next_threshold

  ##
  # Traverse the color cube tree and note each colormap entry. A colormap
  # entry is any node in the color cube tree where the number of unique
  # colors is not zero.
  #
  colormap: ->
    if @nchild != 0
      for id in [0..7]
        @child[id].colormap() if @child[id]?

    if @unique != 0
      red   = ((@total_red   + (@unique >> 1)) / @unique)
      green = ((@total_green + (@unique >> 1)) / @unique)
      blue  = ((@total_blue  + (@unique >> 1)) / @unique)
      @cube.colormap[@cube.colors] = (((        0xFF) << 24) |
                                      ((red   & 0xFF) << 16) |
                                      ((green & 0xFF) <<  8) |
                                      ((blue  & 0xFF) <<  0))
      @color_number = @cube.colors++

    return this

  ##
  # Traverse the color cube tree at a particular node and determine which
  # colormap entry best represents the input color.
  #
  closestColor: (red, green, blue, search) ->
    if @nchild != 0
      for id in [0..7]
        @child[id].closestColor(red, green, blue, search) if @child[id]?

      if @unique != 0
        color = @cube.colormap[@color_number]
        distance = @distance(color, red, green, blue)
        if distance < search.distance
          search.distance = distance
          search.color_number = @color_number

    return this

  ##
  # Figure out the distance between this node and some color.
  #
  distance: (color, red, green, blue) ->
    (SQUARES[((color >> 16) & 0xFF) - red   + MAX_RGB] +
     SQUARES[((color >>  8) & 0xFF) - green + MAX_RGB] +
     SQUARES[((color >>  0) & 0xFF) - blue  + MAX_RGB])

################################################################################

# export OctreeQuant
root.OctreeQuant = OctreeQuant

