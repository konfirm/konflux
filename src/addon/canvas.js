/*
 *       __    Konflux - Canvas module - allowing for chainable canvas operations (version $DEV$ - $DATE$)
 *      /\_\
 *   /\/ / /   Copyright 2012-2014, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */
;(function(konflux) {
	'use strict';

	var version = '$DEV$ - $DATE$ - $COMMIT$';

	/**
	 *  Canvas object, allowing for chainable access to canvas methods
	 *  @module  canvas
	 *  @note    available as konflux.canvas / kx.canvas
	 */
	function KonfluxCanvas() {
		/*jshint validthis: true*/
		var canvas = this;

		/*global KonfluxCanvasContext*/
		//@embed canvas/context

		/**
		 *  Create a new canvas
		 *  @name    create
		 *  @type    method
		 *  @access  public
		 *  @param   number width
		 *  @param   number height
		 *  @param   object default settings
		 *  @return  object KonfluxCanvasContext
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
		 *  @return  object KonfluxCanvasContext
		 */
		canvas.init = function(object, defaults) {
			return new KonfluxCanvasContext(object, defaults);
		};

		/**
		 *  Create a new DOMElement canvas and append it to given target
		 *  @name    append
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement target
		 *  @param   mixed source (one of: KonfluxCanvasContext or number width)
		 *  @param   number height (ignored if the second arguments is not a number)
		 *  @return  object KonfluxCanvasContext (bool false if the mixed source did not lead to an KonfluxCanvasContext instance)
		 */
		canvas.append = function(target, mixed) {
			if (konflux.isType('number', mixed)) {
				mixed = canvas.create(mixed, arguments.length > 2 ? arguments[2] : mixed);
			}

			if (mixed instanceof KonfluxCanvasContext) {
				return mixed.append(target);
			}

			return false;
		};
	}

	//  Append the module to konflux
	konflux.register('canvas', new KonfluxCanvas());

})(window.konflux);
