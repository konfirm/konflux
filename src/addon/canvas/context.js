/**
 *  Context wrapper, this is the actual 'canvas' which gets returned
 *  @name    KonfluxCanvasContext
 *  @type    module
 *  @access  internal
 *  @param   DOMElement canvas
 *  @param   object default properties
 *  @return  KonfluxCanvasContext instance
 *  @note    By default all methods available in the (browser own) canvas context are made available, the ones
 *           documented are merely the ones overrided/added.
 */

//@depends: array
function KonfluxCanvasContext(canvas, defaults) {
	'use strict';

	/*jshint validthis: true*/
	var context = this;

	/**
	 *  KonfluxCanvasContext initializer function
	 *  @name    init
	 *  @type    function
	 *  @access  internal
	 *  @return  void
	 */
	function init() {
		var property = combine(defaults || {}, {
				height: null,
				width: null
			}),
			key;

		context.ctx2d = canvas.getContext('2d');

		//  relay all methods
		for (key in context.ctx2d) {
			if (typeof context[key] !== 'function') {
				context[key] = relay(key, property);

				//  if the key is present in the configuration (e.g. provided as default value)
				//  the (now created) relay method is invoked with this value
				if (key in property && property[key] !== null) {
					context[key](property[key]);
				}
			}
		}
	}

	/**
	 *  Find the most appropriate way to relay given key
	 *  @name    relay
	 *  @access  internal
	 *  @param   string  key
	 *  @param   Object  config
	 *  @return  void
	 */
	function relay(key, config) {
		var scope = context.ctx2d;

		if (typeof scope[key] === 'function') {
			return relayMethod(scope[key]);
		}

		return relayProperty(
			key,
			key in scope.canvas ? scope.canvas : scope,
			key in config && config[key] === null
		);
	}

	/**
	 *  Cast the provided variable to an array
	 *  @name    castToArray
	 *  @access  internal
	 *  @param   mixed  array-like
	 *  @return  Array
	 */
	function castToArray(variable) {
		return Array.prototype.slice.call(variable);
	}

	/**
	 *  Test whether provided variable is an object
	 *  @name    isObject
	 *  @access  internal
	 *  @param   mixed    test
	 *  @return  boolean  isObject
	 */
	function isObject(test) {
		return test && typeof test === 'object' && !(test instanceof Array);
	}

	/**
	 *  Obtain the coordinates of a region as used often by the Canvas API
	 *  @name    region
	 *  @access  internal
	 *  @param   mixed   x1  [number or point, optional, default undefined - 0]
	 *  @param   mixed   y1  [number or point, optional, default undefined - 0]
	 *  @param   number  x2  [optional, default undefined - canvas.width - x1]
	 *  @param   number  y2  [optional, default undefined - canvas.height - y1]
	 *  @return  Array  [x1, y1, x2, y2]
	 *  @note    Usage: region()                  =>  [0, 0, width, height]
	 *                  region(100, 100)          =>  [100, 100, width - 100, height - 100]
	 *                  region({x:100}, {x:200})  =>  [100, 0, 200, height]
	 *                  region(100, 100, 200)     =>  [100, 100, 200, height - 100]
	 *                  region({x:100, y: 100})   =>  [100, 100, width - 100, height - 100]
	 */
	function region(a, b, c, d) {
		var result = [
				(isObject(a) ? a.x : a) || 0,
				(isObject(a) ? a.y : b) || 0,
				(isObject(b) ? b.x : c) || canvas.width,
				(isObject(b) ? b.y : d) || canvas.height
			];

		if (!c) {
			result[2] = result[2] - result[0];
		}

		if (!d) {
			result[3] = result[3] - result[1];
		}

		return result;
	}

	/**
	 *  Shallow object cloner
	 *  @name    combine
	 *  @access  internal
	 *  @param   Object a...
	 *  @return  Object combined
	 */
	function combine() {
		var result = {},
			arg = arguments,
			i, p;

		for (i = 0; i < arg.length; ++i) {
			if (isObject(arg[i])) {
				for (p in arg[i]) {
					result[p] = p in result && isObject(result[p]) ? combine(arg[i][p], result[p]) : arg[i][p];
				}
			}
		}

		return result;
	}

	/**
	 *  Create a delegation function which call a context method and returns the KonfluxCanvasContext
	 *  instance (providing chainability)
	 *  @name    relayMethod
	 *  @type    function
	 *  @access  internal
	 *  @param   function context method
	 *  @return  function delegate
	 */
	function relayMethod(fn) {
		return function() {
			fn.apply(context.ctx2d, arguments);

			return context;
		};
	}

	/**
	 *  Create a delegation function which gets/sets a context value and returns
	 *  the KonfluxCanvasContext instance (providing chainability)
	 *  @name    relayProperty
	 *  @type    function
	 *  @access  internal
	 *  @param   string  context property
	 *  @param   object  scope   [one of context2d or canvas]
	 *  @param   bool    read only
	 *  @return  function delegate
	 */
	function relayProperty(key, scope, ro) {
		return function(value) {
			if (typeof value === 'undefined') {
				return scope[key];
			}

			if (!ro) {
				scope[key] = value;
			}

			return context;
		};
	}

	/**
	 *  Update all properties from the list, if a value was provided
	 *  @name    updateContextProperty
	 *  @access  internal
	 *  @param   Array   propertyList
	 *  @param   Array   arguments  [does accept the function arguments array-like object]
	 *  @return  object  KonfluxCanvasContext
	 */
	function updateContextProperty(keys, arg) {
		var length = Math.min(keys.length, arg.length),
			i;

		for (i = 0; i < length; ++i) {
			context.ctx2d[keys[i]] = arg[i];
		}

		return context;
	}

	/**
	 *  Add a gradient fill to the canvas, adding colorstops to the the provided gradient
	 *  @name    gradientFill
	 *  @type    function
	 *  @access  internal
	 *  @param   object gradient
	 *  @param   object color ({<position>:<color>})
	 *  @return  object KonfluxCanvasContext
	 */
	function gradientFill(gradient, color) {
		var key;

		for (key in color) {
			gradient.addColorStop(key, color[key]);
		}

		return context
			.fillStyle(gradient)
			.fill()
		;
	}

	/**
	 *  Compare two points, without requiring the kxPoint.equals method
	 *  @name    isEqualPoint
	 *  @access  internal
	 *  @param   point a  [one of kxPoint or Object containing x/y properties]
	 *  @param   point b  [one of kxPoint or Object containing x/y properties]
	 *  @return  bool  equals
	 */
	function isEqualPoint(a, b) {
		return a.x === b.x && a.y === b.y;
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
	context.resize = function(width, height) {
		var percentage = /([0-9]+)%/;

		if (width > 0 && width < 1) {
			width = Math.round(canvas.width * width);
		}
		else if (typeof width === 'string' && percentage.test(width)) {
			width = Math.round(canvas.width * (parseInt(width, 10) / 100));
		}

		if (height > 0 && height < 1) {
			height = Math.round(canvas.height * height);
		}
		else if (typeof height === 'string' && percentage.test(height)) {
			height = Math.round(canvas.height * (parseInt(height, 10) / 100));
		}

		if (!width && height) {
			width = Math.round(height * (canvas.width / canvas.height));
		}
		else if (!height && width) {
			height = Math.round(width * (canvas.height / canvas.width));
		}

		if (width && height) {
			return canvas.create(width, height)
				.drawImage.apply(null, [context].concat(region(), [0, 0, width, height]))
			;
		}

		return false;
	};

	/**
	 *  Clear the entire or a specified portion of the canvas
	 *  @name    clear
	 *  @type    method
	 *  @access  public
	 *  @param   kxPoint  from  [optional, default (0, 0)]
	 *  @param   kxPoint  to    [optional, default (width, height)]
	 *  @return  KonfluxCanvasContext
	 */
	context.clear = function(a, b) {
		return context.clearRect.apply(context, region(a, b));
	};

	/**
	 *  Get/set the canvas' full dataURL
	 *  @name    data
	 *  @type    method
	 *  @access  public
	 *  @param   string data (one of: the full data url to apply, or the mime type to obtain)
	 *  @param   number quality (only used when obtaining the dataURL)
	 *  @return  mixed  result (string dataURL if obtaining, object KonfluxCanvasContext if providing)
	 */
	context.data = function(data, quality) {
		var image;

		if (data && !/^[a-z]+\/[a-z0-9\-\+\.]+/.test(data)) {
			image     = new Image();
			image.src = data;

			return context
				.clear()
				.drawImage(image, 0, 0)
			;
		}

		return canvas.toDataURL(data, quality || 0.8);
	};

	/**
	 *  Append the canvas object associtated with the current KonfluxCanvasContext to given DOM target
	 *  @name    append
	 *  @type    method
	 *  @access  public
	 *  @param   mixed target (one of: DOMElement or string id)
	 *  @return  mixed result (KonfluxCanvasContext on success, bool false otherwise)
	 */
	context.append = function(target) {
		if (typeof target === 'string') {
			target = document.getElementById(target);
		}

		if (typeof target === 'object' && !(target instanceof Array)) {
			return target.appendChild(canvas) ? context : false;
		}

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
	 *  @return  object KonfluxCanvasContext
	 */
	context.shadow = function() {
		return updateContextProperty(
			['shadowOffsetX', 'shadowOffsetY', 'shadowBlur', 'shadowColor'],
			arguments
		);
	};

	/**
	 *  Set the stroke style
	 *  @name    strokeStyle
	 *  @type    method
	 *  @access  public
	 *  @param   mixed   strokeStyle (color)
	 *  @param   number  lineWidth
	 *  @param   string  lineCap     [one of: 'butt','round','square']
	 *  @return  object  KonfluxCanvasContext
	 */
	context.strokeStyle = function() {
		return updateContextProperty(
			['strokeStyle', 'lineWidth', 'lineCap'],
			arguments
		);
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
	 *  @return  object     KonfluxCanvasContext
	 *  @note    This method is fully compatible with the native drawImage method:
	 *           https://developer.mozilla.org/en/docs/Web/API/CanvasRenderingContext2D#drawImage()
	 */
	context.drawImage = function() {
		var arg = castToArray(arguments);

		//  if we have a request to draw a KonfluxCanvasContext, we honorate it by fetching its canvas
		if (arg[0] instanceof KonfluxCanvasContext) {
			arg[0] = arg[0].ctx2d.canvas;
		}

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
	context.getImageData = function() {
		return context.ctx2d.getImageData.apply(
			context.ctx2d,
			region.apply(null, arguments)
		);
	};

	/**
	 *  Fill the current (closed) shape
	 *  @name    colorFill
	 *  @type    method
	 *  @access  public
	 *  @param   mixed color (applied as provided, if provided, using the default fillStyle otherwise)
	 *  @return  object KonfluxCanvasContext
	 */
	context.colorFill = function(color) {
		if (color) {
			context.fillStyle(color);
		}

		return context
			.fill()
		;
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
	 *  @return  object KonfluxCanvasContext
	 */
	context.radialGradientFill = function(a, ar, b, br, color) {
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
	 *  @return  object KonfluxCanvasContext
	 */
	context.linearGradientFill = function(a, b, color) {
		return gradientFill(context.ctx2d.createLinearGradient(a.x, a.y, b.x, b.y), color);
	};

	/**
	 *  Draw a circle
	 *  @name    circle
	 *  @type    method
	 *  @access  public
	 *  @param   kxPoint center (instead of a kxPoint, an object {x:<num>, y:<num>} will suffice)
	 *  @param   number  radius
	 *  @return  object KonfluxCanvasContext
	 */
	context.circle = function(p, radius) {
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
	 *  @return  object KonfluxCanvasContext
	 */
	context.path = function() {
		var arg = castToArray(arguments),
			length = arg.length - 1,
			i;

		if (length === 1 && arg[0] instanceof Array) {
			return context.line.apply(context.line, arg[0]);
		}

		context.beginPath();
		for (i = 0; i <= length; ++i) {
			if (i === length && isEqualPoint(arg[i], arg[0])) {
				context.closePath();
			}
			else {
				context[i === 0 ? 'moveTo' : 'lineTo'](arg[i].x, arg[i].y);
			}
		}

		return context;
	};

	/**
	 *  Create a pattern from an image, canvas or video
	 *  @name    createPattern
	 *  @type    method
	 *  @access  public
	 *  @param   object source (one of: image-, canvas-, video element)
	 *  @param   string repeat (one of: repeat (default), no-repeat, repeat-x, repeat-y)
	 *  @return  object CanvasPattern
	 */
	context.createPattern = function(source, repeat) {
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
	 *  @return  object KonfluxCanvasContext
	 */
	context.roundedRect = function(a, b, radius) {
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
	 *  @return  object KonfluxCanvasContext
	 */
	context.line = function() {
		return context
			.path.apply(context, arguments)
			.stroke()
		;
	};

	//  initialise the Context
	init();
}
