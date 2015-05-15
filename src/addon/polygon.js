/*
 *       __    Konflux - Polygons (version $DEV$ - $DATE$)
 *      /\_\
 *   /\/ / /   Copyright 2012-2014, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

//@dep: point
;(function(konflux) {
	'use strict';

	var version = '$DEV$ - $DATE$ - $COMMIT$';

	/**
	 *  Polygon shapes based on konflux.points
	 *  @module  polygon
	 *  @note    available as konflux.polygon / kx.polygon
	 *  @note    All public methods from konflux.point are inherited by konflux.polygon
	 *           (allowing konflux.polygon to move, snap, scale, etc)
	 */
	function KonfluxPolygon() {
		/*jshint validthis: true*/
		var polygon = this,
			points = arguments.length && arguments[0] instanceof Array ? arguments[0] : Array.prototype.slice.call(arguments);

		/**
		 *  Initialize the polygon, inheriting all public methods konflux.point instances have
		 *  @name    init
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function init() {
			var p;

			for (p in points[0]) {
				if (typeof points[0][p] === 'function' && !(p in polygon)) {
					polygon[p] = bridge(p);
				}
			}
		}

		/**
		 *  Create a function which acts as bridge onto all konflux.points within konflux.polygon and ensures chainability
		 *  @name    bridge
		 *  @type    function
		 *  @access  internal
		 *  @param   string   method
		 *  @return  function handler
		 */
		function bridge(method) {
			return function() {
				var arg = Array.prototype.slice.call(arguments),
					result = batch.apply(polygon, [method].concat(arg));

				if ('length' in result && result.length > 0 && result[0].x && result[0].y) {
					result = result[0] === points[0] ? polygon : new KonfluxPolygon(result);
				}

				return result;
			};
		}

		/**
		 *  Call a method with the same arguments on all konflux.points within the konflux.polygon instance and return
		 *  their individual values in an array
		 *  @name    batch
		 *  @type    function
		 *  @access  internal
		 *  @param   string  method
		 *  @param   mixed   arg 1
		 *  @param   mixed   ...
		 *  @param   mixed   arg N
		 *  @return  Array   result
		 */
		function batch() {
			var arg = Array.prototype.slice.call(arguments),
				method = arg.shift(),
				result = [],
				i;

			for (i = 0; i < points.length; ++i) {
				result.push(points[i][method].apply(points[i], arg));
			}

			return result;
		}

		/**
		 *  Close the polygon by ensuring the last konflux.point equals the first
		 *  @name    close
		 *  @type    method
		 *  @access  public
		 *  @return  KonfluxPolygon polygon
		 */
		polygon.close = function() {
			//  make sure we have a closed shape, if the last point is not equal to the first, we clone it and add it to the stack
			if (!points[0].equal(points[points.length - 1])) {
				points.push(points[0].clone());
			}

			return polygon;
		};

		/**
		 *  Obtain all konflux.point instances within the konflux.polygon instance
		 *  @name    points
		 *  @type    method
		 *  @access  public
		 *  @return  Array  konflux.points
		 */
		polygon.points = function() {
			return points;
		};

		/**
		 *  Draw the konflux.polygon onto given canvas
		 *  @name    draw
		 *  @type    method
		 *  @access  public
		 *  @param   KonfluxCanvas  canvas
		 *  @param   string    color [optional, default rgb(255, 128, 0) - orange]
		 *  @return  KonfluxPolygon polygon
		 */
		polygon.draw = function(canvas, color) {
			canvas
				.fillStyle(color || 'rgb(255,128,0)')
				.line(points)
				.fill()
			;

			return polygon;
		};

		/**
		 *  Clone the konflux.polygon and return the newly created clone
		 *  @name    clone
		 *  @type    method
		 *  @access  public
		 *  @return  KonfluxPolygon polygon
		 */
		polygon.clone = function() {
			var clone = [],
				i;

			for (i = 0; i < points.length; ++i) {
				clone.push(points[i].clone());
			}

			return new KonfluxPolygon(clone);
		};

		init();
	}

	//  Append the module to konflux
	konflux.register('polygon', new KonfluxPolygon);

})(window.konflux);
