/*
 *       __    Konflux - Isometric polygons (version $DEV$ - $DATE$)
 *      /\_\
 *   /\/ / /   Copyright 2012-2014, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

/*jshint undef: true, newcap: false, forin: false, maxstatements: 10, maxparams: 4, browser: true */
//@dep: polygon
;(function(konflux){
    'use strict';

    var version = '$DEV$';


	/**
	 *  Isometric shapes based on konflux.polygon
	 *  @module  iso
	 *  @note    available as konflux.iso / kx.iso
	 *  @note    All public methods from konflux.polygon are inherited by konflux.iso (allowing konflux.iso to move, snap, scale, etc (all in 2d space!))
	 */
	function kxISO()
	{
		/*jshint validthis: true*/
		var iso = this,
			arg = Array.prototype.slice.call(arguments),
			poly = arg[0] instanceof konflux.polygon ? arg[0] : new konflux.polygon(arg);


		/**
		 *  Initialize the isometric polygon, inheriting all public methods konflux.polygon instances have
		 *  @name    init
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function init()
		{
			var p;

			for (p in poly)
				if (typeof poly[p] === 'function' && !(p in iso))
					iso[p] = bridge(p);
		}

		/**
		 *  Create a function which acts as bridge onto the konflux.polygon and ensures chainability
		 *  @name    bridge
		 *  @type    function
		 *  @access  internal
		 *  @param   string   method
		 *  @return  function handler
		 */
		function bridge(method)
		{
			return function(){
				var arg = Array.prototype.slice.call(arguments),
					result = poly[method].apply(poly, arg);

				if (result instanceof konflux.polygon)
					result = result === poly ? iso : new kxISO(result);

				return result;
			};
		}

		/**
		 *  Sort an array of konflux.polygons to their most likely Z-axis (assumes the same Z-axis voor all polygons)
		 *  @name    zOrder
		 *  @type    function
		 *  @access  internal
		 *  @param   Array  konflux.polygon
		 *  @return  Array  konflux.polygon sorted
		 */
		function zOrder(polyList)
		{
			polyList.sort(function(a, b){
				var pa = a.points()[0].min.apply(null, a),
					pb = b.points()[0].min.apply(null, b);

				return (pa.x + pa.y) - (pb.x + pb.y);
			});
			return polyList;
		}

		/**
		 *  Draw the konflux.iso onto given canvas
		 *  @name    draw
		 *  @type    method
		 *  @access  public
		 *  @param   kxCanvas  canvas
		 *  @param   string    color [optional, default rgb(255, 128, 0) - orange]
		 *  @param   number    isometric angle [optional, default 30 degrees - the most common angle]
		 *  @param   number    height [optional, default 20]
		 *  @return  kxISO     iso
		 */
		iso.draw = function(canvas, color, iso, height)
		{
			var shape = iso ? poly.iso(iso || 30) : poly.clone(),
				buffer = {left:[], right:[]},
				points = shape.points(),
				length = points.length,
				i, j;

			height = height ? height : (iso ? Math.min(iso * 0.2, 16) : false);

			if (height > 0)
			{
				for (i = 0; i < length; ++i)
				{
					j = (i + 1) % length;
					buffer[Math.floor(Math.abs(points[i].angle(points[j]))) === 2 ? 'left' : 'right'].push(new konflux.polygon(
						points[i],
						points[j],
						points[j].clone().move(0, height),
						points[i].clone().move(0, height)
					));
				}
				for (j in buffer)
				{
					buffer[j] = zOrder(buffer[j]);
					for (i in buffer[j])
						buffer[j][i]
							.draw(canvas, color)
							.draw(canvas, j === 'left' ? 'rgba(0,0,0,.2)' : 'rgba(0,0,0,.1)')
						;
				}
			}

			shape.draw(canvas, color);

			return iso;
		};

		/**
		 *  Clone the konflux.iso and return the newly created clone
		 *  @name    clone
		 *  @type    method
		 *  @access  public
		 *  @return  kxISO iso
		 */
		iso.clone = function()
		{
			return new kxISO(poly.clone());
		};

		init();
	}

	//  register kxISO as konflux.iso
	konflux.iso = kxISO;

})(window.konflux);
