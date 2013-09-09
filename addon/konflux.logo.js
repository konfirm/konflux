/*
 *       __    Konflux Logo (version $DEV$ - $DATE$)
 *      /\_\
 *   /\/ / /   Copyright 2012-2013, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */
;(function(konflux){
	'use strict';

	/**
	 *  Logo object, creates the konflux logo on canvas
	 *  @module  logo
	 *  @note    available as konflux.logo / kx.logo
	 */
	function kxLogo()
	{
		var logo = this,
			design = {
				konfirm: [
					//  remove the outline
					{
						lineWidth:[0],
						strokeStyle:['transparent']
					},
					//  the dark base segment
					{
						line:[
							new konflux.point(6, 88),
							new konflux.point(4, 70),
							new konflux.point(82, 132),
							new konflux.point(192, 44),
							new konflux.point(188, 62),
							new konflux.point(82, 150),
							new konflux.point(6, 88)
						],
						fillStyle:['rgb(25,25,25)'],
						fill:[]
					},
					//  the main color fill
					{
						line:[
							new konflux.point(154, 0),
							new konflux.point(82, 50),
							new konflux.point(42, 24),
							new konflux.point(0, 50),
							new konflux.point(4, 70),
							new konflux.point(82, 132),
							new konflux.point(192, 44),
							new konflux.point(198, 24),
							new konflux.point(154, 0)
						],
						fillStyle:[Math.round(Math.random()) === 1 ? 'rgb(10,220,250)' : 'rgb(200,250,10)'],
						fill:[]
					},
					//  the opaque darker overlay
					{
						globalAlpha:[.2],
						line:[
							new konflux.point(0, 50),
							new konflux.point(4, 70),
							new konflux.point(82, 132),
							new konflux.point(192, 44),
							new konflux.point(198, 24),
							new konflux.point(82, 112),
							new konflux.point(0, 50)
						],
						fillStyle:['rgb(0, 0, 0)'],
						fill:[]
					}
				]
			};

		/**
		 *  Render given design into an newly created canvas element
		 *  @name    append
		 *  @type    method
		 *  @access  public
		 *  @param   string design (optional, default 'konfirm', the only available design)
		 *  @return  kxCanvasContext
		 */
		function render(dsgn)
		{
			var c, p, i;
			dsgn = dsgn || 'konfirm';

			if (typeof design[dsgn] !== undef)
			{
				c = konflux.canvas.create(200, 150);
				for (i = 0; i < design[dsgn].length; ++i)
					for (p in design[dsgn][i])
						c[p].apply(null, design[dsgn][i][p]);
				return c;
			}
			return false;
		}

		/**
		 *  Render given design into an newly created canvas element
		 *  @name    append
		 *  @type    method
		 *  @access  public
		 *  @param   string design
		 *  @return  kxCanvasContext
		 */
		logo.append = function(target, design)
		{
			return render(desgin).append(target);
		};

		/**
		 *  Render given design as dataURL
		 *  @name    data
		 *  @type    method
		 *  @access  public
		 *  @param   string design
		 *  @return  string dataURL
		 */
		logo.data = function(design)
		{
			return render(desgin).data();
		};

		/**
		 *  Render given design into an newly created image DOMElement
		 *  @name    image
		 *  @type    method
		 *  @access  public
		 *  @param   string design
		 *  @return  DOMElement image
		 */
		logo.image = function(design)
		{
			var img = document.createElement('img');
			img.src = logo.data(design);
			return img;
		};
	}

	//  Append the logo module to konflux
	konflux.logo  = kxLogo;

})(window.konflux);