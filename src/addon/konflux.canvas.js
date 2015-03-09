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

	var version = '$DEV$',
		undef = 'undefined';


	/**
	 *  Canvas object, allowing for chainable access to canvas methods
	 *  @module  canvas
	 *  @note    available as konflux.canvas / kx.canvas
	 */
	function kxCanvas()
	{
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
		canvas.create = function(width, height, defaults)
		{
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
		canvas.init = function(object, defaults)
		{
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
		canvas.append = function(target, mixed)
		{
			if (konflux.isType('number', mixed))
				mixed = canvas.create(mixed, arguments.length > 2 ? arguments[2] : mixed);

			if (mixed instanceof kxCanvasContext)
				return mixed.append(target);
			return false;
		};
	}

	/**
	 *  Context wrapper, this is the actual 'canvas' which gets returned
	 *  @name    kxCanvasContext
	 *  @type    module
	 *  @access  internal
	 *  @param   DOMElement canvas
	 *  @param   object default properties
	 *  @return  kxCanvasContext instance
	 *  @note    By default all methods available in the (browser own) canvas context are made available, the ones
	 *           documented are merely the ones overrided/added.
	 */
	function kxCanvasContext(canvas, defaults)
	{
		/*jshint validthis: true*/
		var context = this;

		/**
		 *  kxCanvasContext initializer function
		 *  @name    init
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function init()
		{
			var property = konflux.combine(defaults || {}, {
					height: null, //  readonly
					width: null   //  readonly
				}),
				p;
			context.ctx2d = canvas.getContext('2d');

			//  relay all methods
			for (p in context.ctx2d)
				if ('function' !== typeof context[p])
				{
					if (konflux.isType('function', context.ctx2d[p]))
						context[p] = relayMethod(context.ctx2d[p]);
					else if (p in context.ctx2d.canvas)
						context[p] = relayCanvasProperty(p, p in property && property[p] === null);
					else
						context[p] = relayProperty(p, p in property && property[p] === null);

					if (p in property && property[p] !== null)
						context[p](property[p]);
				}
		}

		/**
		 *  Create a delegation function which call a context method and returns the kxCanvasContext
		 *  instance (providing chainability)
		 *  @name    relayMethod
		 *  @type    function
		 *  @access  internal
		 *  @param   function context method
		 *  @return  function delegate
		 */
		function relayMethod(f)
		{
			return function(){
				f.apply(context.ctx2d, arguments);
				return context;
			};
		}

		/**
		 *  Create a delegation function which gets/sets a canvas value and returns the kxCanvasContext
		 *  instance (providing chainability)
		 *  @name    relayCanvasProperty
		 *  @type    function
		 *  @access  internal
		 *  @param   string   canvas property
		 *  @param   bool     read only
		 *  @return  function delegate
		 */
		function relayCanvasProperty(key, ro)
		{
			return function(value){
				if (konflux.isType(undef, value))
					return context.ctx2d.canvas[key];
				if (!ro)
					context.ctx2d.canvas[key] = value;
				return context;
			};
		}

		/**
		 *  Create a delegation function which gets/sets a context value and returns the kxCanvasContext
		 *  instance (providing chainability)
		 *  @name    relayProperty
		 *  @type    function
		 *  @access  internal
		 *  @param   string  context property
		 *  @param   bool    read only
		 *  @return  function delegate
		 */
		function relayProperty(key, ro)
		{
			return function(value){
				if (konflux.isType(undef, value))
					return context.ctx2d[key];
				if (!ro)
					context.ctx2d[key] = value;
				return context;
			};
		}

		/**
		 *  Add a gradient fill to the canvas, adding colorstops to the the provided gradient
		 *  @name    gradientFill
		 *  @type    function
		 *  @access  internal
		 *  @param   object gradient
		 *  @param   object color ({<position>:<color>})
		 *  @return  object kxCanvasContext
		 */
		function gradientFill(gradient, color)
		{
			var p;
			for (p in color)
				gradient.addColorStop(p, color[p]);

			context.fillStyle(gradient);
			context.fill();

			return context;
		}

		/**
		 *  Draw a multitude of line segments from a list of kx.point instances (or {x:N, y:N}) in
		 *  a fully enclosed path
		 *  @name    path
		 *  @type    function
		 *  @access  internal
		 *  @param   mixed point (one of: kxPoint or Array of points)
		 *  @param   mixed ...
		 *  @param   mixed pointN
		 *  @return  object kxCanvasContext
		 */
		function path()
		{
			var arg = konflux.array.cast(arguments),
				len = arguments.length,
				i;

			if (len === 1 && arg[0] instanceof Array)
				return context.line.apply(context.line, arg[0]);

			context.beginPath();
			for (i = 0; i < len; ++i)
				if (i === len - 1 && arguments[i].equal(arguments[0]))
					context.closePath();
				else
					context[i === 0 ? 'moveTo' : 'lineTo'](arguments[i].x, arguments[i].y);

			return context;
		}


		/**
		 *  Resize the current canvas into a new one
		 *  @name    resize
		 *  @type    method
		 *  @access  public
		 *  @param   mixed width (one of: number, string percentage)
		 *  @param   mixed height (one of: number, string percentage)
		 *  @return  object kxCanvas
		 */
		context.resize = function(width, height)
		{
			var percentage = /([0-9]+)%/,
				cnvs;

			if (width > 0 && width < 1)
				width = Math.round(canvas.width * width);
			else if (konflux.isType('string', width) && percentage.test(width))
				width = Math.round(canvas.width * (parseInt(width, 10) / 100));

			if (height > 0 && height < 1)
				height = Math.round(canvas.height * height);
			else if (konflux.isType('string', height) && percentage.test(height))
				height = Math.round(canvas.height * (parseInt(height, 10) / 100));

			if (!width && height)
				width = Math.round(height * (canvas.width / canvas.height));
			else if (!height && width)
				height = Math.round(width * (canvas.height / canvas.width));

			if (width && height)
			{
				cnvs = konflux.canvas.create(width, height);
				cnvs.drawImage(context, 0, 0, canvas.width, canvas.height, 0, 0, width, height);
				return cnvs;
			}
			return false;
		};

		/**
		 *  Get/set the canvas' full dataURL
		 *  @name    data
		 *  @type    method
		 *  @access  public
		 *  @param   string data (one of: the full data url to apply, or the mime type to obtain)
		 *  @param   number quality (only used when obtaining the dataURL)
		 *  @return  mixed  result (string dataURL when obtaining, object kxCanvasContext when providing)
		 */
		context.data = function(data, quality)
		{
			var image;
			if (data && !/^[a-z]+\/[a-z0-9\-\+\.]+/.test(data))
			{
				image     = new Image();
				image.src = data;
				context.ctx2d.clearRect(0, 0, canvas.width, canvas.height);
				context.drawImage(image, 0, 0);
				return context;
			}
			return canvas.toDataURL(data, quality || 0.8);
		};

		/**
		 *  Append the canvas object associtated with the current kxCanvasContext to given DOM target
		 *  @name    append
		 *  @type    method
		 *  @access  public
		 *  @param   mixed target (one of: DOMElement or string id)
		 *  @return  mixed result (kxCanvasContext on success, bool false otherwise)
		 */
		context.append = function(target)
		{
			if (konflux.isType('string', target))
				target = document.getElementById(target);

			if (konflux.isType('object', target))
				return target.appendChild(canvas) ? context : false;

			return false;
		};

		/**
		 *  Shorthand method to provide shadows to the canvas
		 *  @name    shadow
		 *  @type    method
		 *  @access  public
		 *  @param   number offsetX (skipped if not a number)
		 *  @param   number offsetY (skipped if not a number)
		 *  @param   number blur (skipped if not a number)
		 *  @param   mixed color (applied as provided, if provided)
		 *  @return  object kxCanvasContext
		 */
		context.shadow = function(x, y, blur, color)
		{
			if (konflux.isType('number', x))
				context.shadowOffsetX(x);
			if (konflux.isType('number', y))
				context.shadowOffsetY(y);
			if (konflux.isType('number', blur))
				context.shadowBlur(blur);
			if (!konflux.isType(undef, color))
				context.shadowColor(color);

			return context;
		};

		/**
		 *  Get/set the canvas' full dataURL
		 *  @name    drawImage
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement image (Specifies the image, canvas, or video element to use)
		 *  @param   number     sourceX [optional. The x coordinate where to start clipping]
		 *  @param   number     sourceY [optional. The y coordinate where to start clipping]
		 *  @param   number     sourceWidth [optional. The width of the clipped image]
		 *  @param   number     sourceHeight [optional. The height of the clipped image]
		 *  @param   number     targetX
		 *  @param   number     targetY
		 *  @param   number     targetWidth [optional, default null - sourceWidth]
		 *  @param   number     targetHeight [optional, default null - sourceHeight]
		 *  @return  object     kxCanvasContext
		 *  @note    This method is fully compatible with the native drawImage method:
		 *           https://developer.mozilla.org/en/docs/Web/API/CanvasRenderingContext2D#drawImage()
		 */
		context.drawImage = function()
		{
			var arg = konflux.array.cast(arguments);

			//  if we have a request to draw a kxCanvasContext, we honorate it by fetching its canvas
			if (arg[0] instanceof kxCanvasContext)
				arg[0] = arg[0].ctx2d.canvas;

			context.ctx2d.drawImage.apply(context.ctx2d, arg);
			return context;
		};

		/**
		 *  Get the image data from the canvas
		 *  @name    getImageData
		 *  @type    method
		 *  @access  public
		 *  @param   number x
		 *  @param   number y
		 *  @param   number width
		 *  @param   number height
		 *  @return  ImageData data
		 */
		context.getImageData = function()
		{
			var arg = konflux.array.cast(arguments);

			return context.ctx2d.getImageData.apply(context.ctx2d, arg);
		};

		/**
		 *  Fill the current (closed) shape
		 *  @name    colorFill
		 *  @type    method
		 *  @access  public
		 *  @param   mixed color (applied as provided, if provided, using the default fillStyle otherwise)
		 *  @return  object kxCanvasContext
		 */
		context.colorFill = function(color)
		{
			if (color)
				context.fillStyle(color);
			context.fill();
			return context;
		};

		/**
		 *  Set the stroke style
		 *  @name    strokeStyle
		 *  @type    method
		 *  @access  public
		 *  @param   mixed color
		 *  @param   number width (line thickness)
		 *  @param   string lineCap (one of: 'butt','round','square')
		 *  @return  object kxCanvasContext
		 */
		context.strokeStyle = function(color, width, cap)
		{
			if (color)
				context.ctx2d.strokeStyle = color;
			if (width)
				context.ctx2d.lineWidth = width;
			if (cap)
				context.ctx2d.lineCap = cap;

			return context;
		};

		/**
		 *  Apply a radial gradient fill
		 *  @name    radialGradientFill
		 *  @type    method
		 *  @access  public
		 *  @param   kxPoint centerA (instead of a kxPoint, an object {x:<num>, y:<num>} will suffice)
		 *  @param   number radiusA
		 *  @param   kxPoint centerB (instead of a kxPoint, an object {x:<num>, y:<num>} will suffice)
		 *  @param   number radiusB
		 *  @param   mixed color
		 *  @return  object kxCanvasContext
		 */
		context.radialGradientFill = function(a, ar, b, br, color)
		{
			return gradientFill(context.ctx2d.createRadialGradient(a.x, a.y, ar, b.x, b.y, br), color);
		};

		/**
		 *  Apply a linear gradient fill
		 *  @name    linearGradientFill
		 *  @type    method
		 *  @access  public
		 *  @param   kxPoint from (instead of a kxPoint, an object {x:<num>, y:<num>} will suffice)
		 *  @param   kxPoint to (instead of a kxPoint, an object {x:<num>, y:<num>} will suffice)
		 *  @param   mixed color
		 *  @return  object kxCanvasContext
		 */
		context.linearGradientFill = function(a, b, color)
		{
			return gradientFill(context.ctx2d.createLinearGradient(a.x, a.y, b.x, b.y), color);
		};

		/**
		 *  Draw a circle
		 *  @name    circle
		 *  @type    method
		 *  @access  public
		 *  @param   kxPoint center (instead of a kxPoint, an object {x:<num>, y:<num>} will suffice)
		 *  @param   number  radius
		 *  @return  object kxCanvasContext
		 */
		context.circle = function(p, radius)
		{
			return context
				.beginPath()
				.arc(p.x, p.y, radius, 0, Math.PI * 2, 1)
				.closePath()
			;
		};

		/**
		 *  Draw a multitude of line segments from a list of kx.point instances (or {x:N, y:N}) in
		 *  a fully enclosed path
		 *  @name    path
		 *  @type    method
		 *  @access  public
		 *  @param   mixed point (one of: kxPoint or Array of points)
		 *  @param   mixed ...
		 *  @param   mixed pointN
		 *  @return  object kxCanvasContext
		 */
		context.path = path;

		/**
		 *  Create a pattern from an image, canvas or video
		 *  @name    createPattern
		 *  @type    method
		 *  @access  public
		 *  @param   object source (one of: image-, canvas-, video element)
		 *  @param   string repeat (one of: repeat (default), no-repeat, repeat-x, repeat-y)
		 *  @return  object CanvasPattern
		 */
		context.createPattern = function(source, repeat)
		{
			return context.ctx2d.createPattern(source, repeat || 'repeat');
		};

		/**
		 *  Create a rectangle shape with a radius for the corners
		 *  @name    roundedRect
		 *  @type    method
		 *  @access  public
		 *  @param   object kxPoint (top left corner)
		 *  @param   object kxPoint (bottom right corner)
		 *  @param   number radius
		 *  @return  object kxCanvasContext
		 */
		context.roundedRect = function(a, b, radius)
		{
			return context
				.beginPath()
				.moveTo(a.x + radius, a.y)
				.lineTo(a.x + b.x - radius, a.y)
				.quadraticCurveTo(a.x + b.x, a.y, a.x + b.x, a.y + radius)
				.lineTo(a.x + b.x, a.y + b.y - radius)
				.quadraticCurveTo(a.x + b.x, a.y + b.y, a.x + b.x - radius, a.y + b.y)
				.lineTo(a.x + radius, a.y + b.y)
				.quadraticCurveTo(a.x, a.y + b.y, a.x, a.y + b.y - radius)
				.lineTo(a.x, a.y + radius)
				.quadraticCurveTo(a.x, a.y, a.x + radius, a.y)
				.closePath()
			;
		};

		/**
		 *  Draw a stroked path
		 *  @name    line
		 *  @type    method
		 *  @access  public
		 *  @param   mixed point (one of: kxPoint or Array of points)
		 *  @param   mixed ...
		 *  @param   mixed pointN
		 *  @return  object kxCanvasContext
		 */
		context.line = function()
		{
			return context
				.path.apply(context.path, arguments)
				.stroke();
		};

		init();
	}


	//  register kxCanvas as konflux.canvas
	konflux.canvas = new kxCanvas();

})(window.konflux);
