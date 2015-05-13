;(function(konflux) {

	/**
	 *  KonfluxPoint object, handling the (heavy) lifting of working with points
	 *  @module  point
	 *  @factory konflux.point
	 *  @param   number x position
	 *  @param   number y position
	 *  @note    available as konflux.point / kx.point
	 */
	function KonfluxPoint(x, y) {
		'use strict';

		/*jshint validthis: true*/
		var point = this;

		point.x = x || 0;
		point.y = y || 0;

		/**
		 *  Move the point to a specific position
		 *  @name    to
		 *  @type    method
		 *  @access  public
		 *  @param   number x
		 *  @param   number y
		 *  @return  KonfluxPoint  point
		 */
		point.to = function(x, y) {
			point.x = x;
			point.y = y;

			return point;
		};

		/**
		 *  Snap the point to a grid
		 *  @name    snap
		 *  @type    method
		 *  @access  public
		 *  @param   number grid [optional, default 1 - round the position x and y]
		 *  @return  KonfluxPoint  point
		 */
		point.snap = function(grid) {
			point.x = grid ? Math.round(point.x / grid) * grid : Math.round(point.x);
			point.y = grid ? Math.round(point.y / grid) * grid : Math.round(point.y);

			return point;
		};

		/**
		 *  Create a new point based on the current
		 *  @name    clone
		 *  @type    method
		 *  @access  public
		 *  @return  KonfluxPoint  point
		 */
		point.clone = function() {
			return new KonfluxPoint(point.x, point.y);
		};

		/**
		 *  Move the point object by given x and y
		 *  @name    move
		 *  @type    method
		 *  @access  public
		 *  @param   number x
		 *  @param   number y
		 *  @return  KonfluxPoint  point
		 */
		point.move = function(x, y) {
			point.x += x;
			point.y += y;

			return point;
		};

		/**
		 *  Is given point on the exact same position
		 *  @name    equal
		 *  @type    method
		 *  @access  public
		 *  @param   KonfluxPoint point
		 *  @param   bool    round
		 *  @return  bool    equal
		 */
		point.equal = function(p, round) {
			return round ? Math.round(point.x) === Math.round(p.x) && Math.round(point.y) === Math.round(p.y) : point.x === p.x && point.y === p.y;
		};

		/**
		 *  Scale the points coordinates by given factor
		 *  @name    scale
		 *  @type    method
		 *  @access  public
		 *  @param   number factor
		 *  @return  void
		 */
		point.scale = function(factor) {
			point.x *= factor;
			point.y *= factor;

			return point;
		};

		/**
		 *  Subtract a point for the current point
		 *  @name    subtract
		 *  @type    method
		 *  @access  public
		 *  @param   object point
		 *  @return  KonfluxPoint
		 */
		point.subtract = function(p) {
			return new KonfluxPoint(point.x - p.x, point.y - p.y);
		};

		/**
		 *  Add a point to the current point
		 *  @name    add
		 *  @type    method
		 *  @access  public
		 *  @param   object point
		 *  @return  KonfluxPoint
		 */
		point.add = function(p) {
			return new KonfluxPoint(point.x + p.x, point.y + p.y);
		};

		/**
		 *  Get the distance between given and current point
		 *  @name    distance
		 *  @type    method
		 *  @access  public
		 *  @param   object point
		 *  @return  number distance
		 */
		point.distance = function(p) {
			return Math.sqrt(Math.pow(Math.abs(point.x - p.x), 2) + Math.pow(Math.abs(point.y - p.y), 2));
		};

		/**
		 *  Get the angle in radians between given and current point
		 *  @name    angle
		 *  @type    method
		 *  @access  public
		 *  @param   object point
		 *  @return  number angle
		 */
		point.angle = function(p) {
			return Math.atan2(p.x - point.x, p.y - point.y);
		};

		/**
		 *  Create a point with the maximum coordinates of both the current and given point
		 *  @name    max
		 *  @type    method
		 *  @access  public
		 *  @param   KonfluxPoint point1
		 *  @param   KonfluxPoint ...
		 *  @param   KonfluxPoint pointN
		 *  @return  KonfluxPoint
		 */
		point.max = function() {
			var x = point.x,
				y = point.y,
				i;

			for (i = 0; i < arguments.length; ++i) {
				x = Math.max(x, arguments[i].x);
				y = Math.max(y, arguments[i].y);
			}

			return new KonfluxPoint(x, y);
		};

		/**
		 *  Create a point with the minimum coordinates of both the current and given point
		 *  @name    min
		 *  @type    method
		 *  @access  public
		 *  @param   KonfluxPoint point1
		 *  @param   KonfluxPoint ...
		 *  @param   KonfluxPoint pointN
		 *  @return  KonfluxPoint
		 */
		point.min = function() {
			var x = point.x,
				y = point.y,
				i;

			for (i = 0; i < arguments.length; ++i) {
				x = Math.min(x, arguments[i].x);
				y = Math.min(y, arguments[i].y);
			}

			return new KonfluxPoint(x, y);
		};

		/**
		 *  Create a new point from the current mapped to isometric coordinates
		 *  @name    iso
		 *  @type    method
		 *  @access  public
		 *  @param   number angle [optional, default 30 degrees]
		 *  @return  KonfluxPoint
		 */
		point.iso = function(angle) {
			angle = (angle || 30) * Math.PI / 180;

			return new KonfluxPoint(
				point.x - point.y,
				(point.x + point.y) * angle
			);
		};

		/**
		 *  Create a new point between the current and given point
		 *  @name    mid
		 *  @type    method
		 *  @access  public
		 *  @param   KonfluxPoint p
		 *  @return  KonfluxPoint mid
		 */
		point.mid = function(p) {
			return new KonfluxPoint(
				(point.x + p.x) * 0.5,
				(point.y + p.y) * 0.5
			);
		};
	}

	/**
	 *  Create a KonfluxPoint instance
	 *  @name   point
	 *  @type   method
	 *  @access public
	 *  @param  number x position
	 *  @param  number y position
	 *  @return KonfluxPoint point
	 *  @note   As of konflux version > 0.3.1 the points are created without the new keyword
	 *          ('new konflux.point(X, Y)' can now be 'konflux.point(X, Y)')
	 */
	konflux.register('point', function(x, y) {
		return new KonfluxPoint(x, y);
	});

})(konflux);
