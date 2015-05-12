/*
 *       __    Konflux - Canvas module - allowing for chainable canvas operations (version $DEV$ - $DATE$)
 *      /\_\
 *   /\/ / /   Copyright 2012-2014, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

/*jshint undef: true, newcap: false, forin: false, maxstatements: 10, maxparams: 4, browser: true */
//@dep: array
;(function(konflux){
	'use strict';

	var version = '$DEV$';

	/*global kxCanvasContext*/
	//= include canvas/context.js

	/**
	 *  Canvas object, allowing for chainable access to canvas methods
	 *  @module  canvas
	 *  @note    available as konflux.canvas / kx.canvas
	 */
	function kxCanvas() {
		/*jshint validthis: true*/
		var canvas = this;

		/**
		 *  Create a new canvas
		 *  @name    create
		 *  @type    method
		 *  @access  public
		 *  @param   number width
		 *  @param   number height
		 *  @param   object default settings
		 *  @return  object kxCanvasContext
		 */
		canvas.create = function(width, height, defaults) {
			var object = document.createElement('canvas');
			object.setAttribute('width', width);
			object.setAttribute('height', height);

			return canvas.init(object, defaults);
		};

		/**
		 *  Initialize a canvas so it can be drawn using konflux
		 *  @name    init
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement canvas
		 *  @param   object default settings
		 *  @return  object kxCanvasContext
		 */
		canvas.init = function(object, defaults) {
			return new kxCanvasContext(object, defaults);
		};

		/**
		 *  Create a new DOMElement canvas and append it to given target
		 *  @name    append
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement target
		 *  @param   mixed source (one of: kxCanvasContext or number width)
		 *  @param   number height (ignored if the second arguments is not a number)
		 *  @return  object kxCanvasContext (bool false if the mixed source did not lead to an kxCanvasContext instance)
		 */
		canvas.append = function(target, mixed) {
			if (konflux.isType('number', mixed)) {
				mixed = canvas.create(mixed, arguments.length > 2 ? arguments[2] : mixed);
			}

			if (mixed instanceof kxCanvasContext) {
				return mixed.append(target);
			}

			return false;
		};
	}

	//  register kxCanvas as konflux.canvas
	konflux.canvas = new kxCanvas();

})(window.konflux);
