/*
 *       __    Konflux Logo (version $DEV$ - $DATE$)
 *      /\_\
 *   /\/ / /   Copyright 2012-2014, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

//@dep: canvas, point
;(function(konflux) {
	'use strict';

	var version = '$DEV$ - $DATE$ - $COMMIT$',
		point = konflux.point,
		design = {
			konflux: [

				//  remove the outline
				{
					lineWidth:[0],
					strokeStyle:['transparent']
				},

				//  'white' main color fill
				{
					line: [
						point(72, 0),
						point(45, 25),
						point(0, 117),
						point(39, 147),
						point(70, 124),
						point(97, 59),
						point(121, 39)
					],
					fillStyle: ['rgb(242,242,242)'],
					fill:[]
				},

				//  blue main color fill
				{
					line:[
						point(155, 30),
						point(148, 50),
						point(128, 33),
						point(97, 59),
						point(84, 90),
						point(159, 150),
						point(192, 127),
						point(220, 35),
						point(185, 7)
					],
					fillStyle: ['rgb(10,220,250)'],
					fill: []
				},

				//  the opaque darker overlays
				{
					line: [
						point(72, 0),
						point(29, 92),
						point(70, 124),
						point(39, 147),
						point(0, 117),
						point(45, 25)
					],
					fillStyle: ['rgba(0,0,0,.2)'],
					fill:[]
				},
				{
					line: [
						point(185, 7),
						point(165, 64),
						point(148, 50),
						point(155, 30)
					],
					fillStyle: ['rgba(0,0,0,.2)'],
					fill:[]
				},
				{
					line: [
						point(115, 65),
						point(192, 127),
						point(159, 150),
						point(84, 90),
						point(97, 59),
						point(128, 34)
					],
					fillStyle: ['rgba(0,0,0,.2)'],
					fill:[]
				},

				//  the dark base segment
				{
					line:[
						point(45, 25),
						point(0, 117),
						point(39, 147),
						point(54, 136),
						point(14, 105),
						point(59, 12)
					],
					fillStyle: ['rgb(50,50,50)'],
					fill: []
				},
				{
					line: [
						point(97, 59),
						point(84, 90),
						point(159, 150),
						point(175, 139),
						point(99, 78),
						point(112, 47)
					],
					fillStyle: ['rgb(50,50,50)'],
					fill:[]
				},
				{
					line: [
						point(155, 30),
						point(170, 18.4),
						point(156, 56.8),
						point(148, 50)
					],
					fillStyle: ['rgb(50,50,50)'],
					fill:[]
				}
			],
			konfirm: [

				//  remove the outline
				{
					lineWidth:[0],
					strokeStyle:['transparent']
				},

				//  the dark base segment
				{
					line:[
						point(6, 88),
						point(4, 70),
						point(82, 132),
						point(192, 44),
						point(188, 62),
						point(82, 150),
						point(6, 88)
					],
					fillStyle:['rgb(25,25,25)'],
					fill:[]
				},

				//  the main color fill
				{
					line:[
						point(154, 0),
						point(82, 50),
						point(42, 24),
						point(0, 50),
						point(4, 70),
						point(82, 132),
						point(192, 44),
						point(198, 24),
						point(154, 0)
					],
					fillStyle:[Math.round(Math.random()) === 1 ? 'rgb(10,220,250)' : 'rgb(200,250,10)'],
					fill:[]
				},

				//  the opaque darker overlay
				{
					globalAlpha:[0.2],
					line:[
						point(0, 50),
						point(4, 70),
						point(82, 132),
						point(192, 44),
						point(198, 24),
						point(82, 112),
						point(0, 50)
					],
					fillStyle:['rgb(0, 0, 0)'],
					fill:[]
				}
			]
		};

	/**
	 *  Logo object, creates the konflux logo on canvas
	 *  @module  logo
	 *  @note    available as konflux.logo / kx.logo
	 */
	function KonfluxLogo() {
		/*jshint validthis: true*/
		var logo = this;

		/**
		 *  Get the name of the first design
		 *  @name    first
		 *  @type    function
		 *  @access  internal
		 *  @return  string name
		 */
		function first() {
			var p;

			for (p in design) {
				return p;
			}

			return false;
		}

		/**
		 *  Add a named design
		 *  @name    add
		 *  @type    function
		 *  @access  internal
		 *  @param   string name
		 *  @param   array  design instructions
		 *  @return  array  design instructions
		 */
		function add(name, config) {
			design[name] = config;

			return design[name];
		}

		/**
		 *  Get the width and height of given design
		 *  @name    size
		 *  @type    function
		 *  @access  internal
		 *  @param   string name
		 *  @return  array  dimensions
		 */
		function size(name) {
			var result = false,
				p, i, j;

			if (name in design) {
				result = konflux.point();
				for (i = 0; i < design[name].length; ++i) {
					for (p in design[name][i]) {
						for (j = 0; j < design[name][i][p].length; ++j) {
							if (design[name][i][p][j].x && design[name][i][p][j].y) {
								result = result.max(design[name][i][p][j]);
							}
						}
					}
				}
			}

			return result;
		}

		/**
		 *  Remove a named design
		 *  @name    remove
		 *  @type    function
		 *  @access  internal
		 *  @param   string name
		 *  @return  array  design instructions (bool false if the design did not exist)
		 */
		function remove(name) {
			var result = false;

			if (name in design) {
				result = design[name];

				delete design[name];
			}

			return result;
		}

		/**
		 *  Render given design into an newly created canvas element
		 *  @name    append
		 *  @type    function
		 *  @access  internal
		 *  @param   string design (optional, default 'konflux', the first available design)
		 *  @return  KonfluxCanvasContext
		 */
		function render(name) {
			var c, p, i;

			name = name || first();

			if (name in design) {
				c = size(name);
				c = konflux.canvas.create(c.x, c.y);

				for (i = 0; i < design[name].length; ++i) {
					for (p in design[name][i]) {
						c[p].apply(null, design[name][i][p]);
					}
				}

				return c;
			}

			return false;
		}

		/**
		 *  Add a named design to the list of possible designs to render
		 *  @name    add
		 *  @type    method
		 *  @access  public
		 *  @param   string name
		 *  @param   array  design instructions
		 *  @return  array  design instructions
		 */
		logo.add = add;

		/**
		 *  Remove a named design from the list of possible designs to render
		 *  @name    remove
		 *  @type    method
		 *  @access  public
		 *  @param   string name
		 *  @return  array  design instructions (bool false if the design did not exist)
		 */
		logo.remove = remove;

		/**
		 *  Render given design into an newly created canvas element and append it to target
		 *  @name    append
		 *  @type    method
		 *  @access  public
		 *  @param   string design
		 *  @return  KonfluxCanvasContext
		 */
		logo.append = function(target, design) {
			var canvas = render(design);

			return canvas ? canvas.append(target) : false;
		};

		/**
		 *  Render given design as dataURL
		 *  @name    data
		 *  @type    method
		 *  @access  public
		 *  @param   string design
		 *  @return  string dataURL
		 */
		logo.data = function(name) {
			var canvas = render(name);

			return canvas ? canvas.data() : false;
		};

		/**
		 *  Render given design into an newly created image DOMElement
		 *  @name    image
		 *  @type    method
		 *  @access  public
		 *  @param   string design
		 *  @return  DOMElement image
		 */
		logo.image = function(name) {
			var img = document.createElement('img');
			img.src = logo.data(name);

			return img;
		};
	}

	//  Append the module to konflux
	konflux.register('logo', KonfluxLogo);

})(window.konflux);
