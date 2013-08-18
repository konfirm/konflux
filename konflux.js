/**
 *       __    Konflux (v0.1.4)- an observer based helper library
 *      /\_\
 *   /\/ / /   Copyright 2012, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT and GPL licenses
 *    \/_/     More information: http://konfirm.net/konflux
 */
;(function(window, undefined){
	var document = window.document,

		//  Private methods

		/**
		 *  Obtain a reference to a specific internal object, creates one if it does not exist
		 *  @name   internal
		 *  @type   function
		 *  @access private
		 *  @param  string object name
		 *  @return object
		 */
		internal = function(key){
			if (typeof _internal[key] === 'undefined')
				_internal[key] = {};
			return _internal[key];
		},
		/**
		 *  Obtain the milliseconds since the UNIX Epoch (Jan 1, 1970 00:00:00)
		 *  @name   time
		 *  @type   function
		 *  @access private
		 *  @return int milliseconds
		 */
		time = function(){
			return Date.now ? Date.now() : (new Date()).getTime();
		},
		/**
		 *  Trace the function call stack for specified function
		 *  @name   trace
		 *  @type   function
		 *  @access private
		 *  @param  function
		 *  @return array backtrace
		 */
		trace = function(f){
			var backtrace = [],
				caller = f || arguments.callee.caller,
				count = 0;
	
			while (caller && count < 10)
			{
				backtrace[count++] = (caller.name || 'anonymous function') + (caller.toString().match(/\(.*\)/) || ['()'])[0];
				caller = caller.caller;
			}
			return backtrace;			
		},
		/**
		 *  Shorthand method creating object prototypes
		 *  @name   proto
		 *  @type   function
		 *  @access private
		 *  @param  function prototype
		 *  @param  object extension
		 *  @return function constructor
		 */
		proto = function(construct, prototype){
			var obj = construct || function(){};
			if (prototype)
			{
				obj.prototype = typeof prototype === 'function' ? new prototype : prototype;
				obj.prototype.constructor = obj;
			}
			return obj;
		},
		/**
		 *  Obtain the elapsed time since Konflux started (roughly), using the format: [Nd ] hh:mm:ss.ms
		 *  @name   elapsed
		 *  @type   function
		 *  @access private
		 *  @return string formatted time
		 */
		elapsed = function(){
			var delta = Math.abs((new Date()).getTime() - _timestamp),
				days = Math.floor(delta / 86400000),
				hours = Math.floor((delta -= days * 86400000) / 3600000),
				minutes = Math.floor((delta -= hours * 3600000) / 60000),
				seconds = Math.floor((delta -= minutes * 60000) / 1000),
				ms = Math.floor(delta -= seconds * 1000);
			return (days > 0 ? days + 'd ' : '') +
					('00' + hours).substr(-2) + ':' + 
					('00' + minutes).substr(-2) + ':' +
					('00' + seconds).substr(-2) + '.' + 
					('000' + ms).substr(-3);
		},
		/**
		 *  Obtain an unique key, the key is guaranteed to be unique within the browser runtime
		 *  @name   unique
		 *  @type   function
		 *  @access private
		 *  @return string key
		 */
		unique = function(){
			return (++_count + time() % 86400000).toString(36);
		},
	
		//  Private properties
		_internal  = {}, //  singleton-like container, providing 'static' objects
		_timestamp = time(), //  rough execution start time
		_count = 0,
	
		konflux = new(proto(null, function(){
			var _k = this;
			
			_k.master  = function(){return _k};
			_k.trace   = trace;
			_k.time    = time;
			_k.elapsed = elapsed;
		}))()
	; //  end var

	/**
	 *  String utils
	 */
	konflux.string = new(function(){
		var string = this,
			/**
			 *  Trim string from leading/trailing whitespace
			 *  @name   _trim
			 *  @type   function
			 *  @access private
			 *  @param  string to trim
			 *  @return trimmed string
			 */
			_trim = function(s){
				var	w = s.replace(/^\s\s*/, ''),
					r = /\s/,
					i = w.length;
				while (r.test(w.charAt(--i)));
				return w.slice(0, i + 1);
			};

		/**
		 *  Trim string from leading/trailing whitespace
		 *  @name   trim
		 *  @type   function
		 *  @access public
		 *  @param  string to trim
		 *  @return trimmed string
		 */
		string.trim = function(s)
		{
			return _trim(s);
		};
	})();

	/**
	 *  Timing utils
	 */
	konflux.timing = new(function(){
		function Delay(call, timeout, reference){
			var delay = this,
				_call = call,
				_timer = null;
				_ref = reference;

			delay.execute = function()
			{
				delay.cancel();
				_call.call();
			};
			delay.cancel = function()
			{
				clearTimeout(_timer);
			};
			delay.start = function()
			{
				_timer = setTimeout(function(){delay.execute()}, timeout);
			};

			delay.start();
		};

		var timing = this,
			_stack = internal('timing.delay'),
			_remove = function(reference){
				if (typeof _stack[reference] !== 'undefined')
				{
					_stack[reference].cancel();
					delete _stack[reference];
				}
			},
			_create = function(call, delay, reference){
				reference = reference || _getReference(call);
				_remove(reference);
				return _stack[reference] = new Delay(call, delay, reference);
			},
			_getReference = function(call){
				return call.toString() || unique();
			};

		timing.create = function(call, delay, reference)
		{
			return _create(call, delay, reference);
		};
	})();

	/**
	 *  Observer object, handles subscriptions to messages
	 */
	konflux.observer = new((function(){
		//  the Observation 'Event'-like object we distribute
		function Observation(s, f, r){
			var observation = this;

			observation.type = s;
			observation.ref  = r;
			observation.unsubscribe = function(){
				trigger('observer.unsubscribe', s, f);
				return disable(s, f);
			};
			observation.stop = function(){
				trigger('observer.stop', s, f);
				_active[r] = false;
			};
			observation.timeStamp = time();
			observation.timeDelta = elapsed();
		};

			//  the actual constructor
		var observer = function(){},
			//  private members
			_subscription = internal("observer.subscriptions"),
			_active = internal("observer.active"),

			/**
			 *  Create the subscription stack if it does not exist
			 *  @name   ensureSubscriptionStack
			 *  @type   function
			 *  @access private
			 *  @param  string stack name
			 *  @return void
			 */
			ensureSubscriptionStack = function(s)
			{
				if (typeof _subscription[s] === 'undefined') _subscription[s] = [];
			},

			/**
			 *  Add handler to specified stack
			 *  @name   add
			 *  @type   function
			 *  @access private
			 *  @param  string stack name
			 *  @param  function handler
			 *  @return int total number of subscriptions in this stack
			 */
			add = function(s, f)
			{
				ensureSubscriptionStack(s);
				return _subscription[s].push(f);
			},

			/**
			 *  Disable a handler for specified stack
			 *  @name   disable
			 *  @type   function
			 *  @access private
			 *  @param  string stack name
			 *  @param  function handler
			 *  @return void
			 *  @note   this method is used from the Observation object, which would influence the number of 
			 *          subscriptions if the subscription itself was removed immediately
			 */
			disable = function(s, f)
			{
				for (var i = 0; i < _subscription[s].length; ++i)
					if (_subscription[s][i] === f)
						_subscription[s][i] = false;
			},

			/**
			 *  Remove specified handler (and all disabled handlers) from specified stack
			 *  @name   remove
			 *  @type   function
			 *  @access private
			 *  @param  string stack name
			 *  @param  function handler (optional)
			 *  @return array removed handlers
			 */
			remove = function(s, f)
			{
				var r = [], n = [], i;
				ensureSubscriptionStack(s);
				for (i = 0; i < _subscription[s].length; ++i)
					(!_subscription[s][i] || _subscription[s][i] === f ? r : n).push(_subscription[s][i]);
				_subscription[s] = n;
				return r;
			},

			/**
			 *  Flush specified stack
			 *  @name   flush
			 *  @type   function
			 *  @access private
			 *  @param  string stack name
			 *  @return array removed handlers (false if the stack did not exist);
			 */
			flush = function(s)
			{
				var r = false;
				if (typeof _subscription[s] !== 'undefined')
				{
					r = _subscription[s];
					delete _subscription[s];
				}
				return r;
			},

			/**
			 *  Trigger the handlers in specified stack
			 *  @name   trigger
			 *  @type   function
			 *  @access private
			 *  @param  string stack name
			 *  @param  mixed  arg1 ... argN
			 *  @return void
			 */
			trigger = function(s)
			{
				var arg = Array.prototype.slice.call(arguments),
					ref = unique(),
					i;

				_active[ref] = true;
				if (typeof _subscription[s] !== 'undefined')
				{
					for (i = 0; i < _subscription[s].length; ++i)
					{
						if (!_active[ref])
							break;
						if (_subscription[s][i])
						{
							arg[0] = new Observation(s, _subscription[s][i], ref);
							_subscription[s][i].apply(_subscription[s][i], arg);
						}
					}
				}
				delete _active[ref];
			};

		//  public members
		observer.prototype = {
			// constructor: observer,
			/**
			 *  Subscribe a handler to an observer stack
			 *  @name   subscribe
			 *  @type   function
			 *  @access public
			 *  @param  string stack name
			 *  @param  function handle
			 *  @return bool success
			 */
			subscribe: function subscribe(stack, handle){
				trigger('observer.subscribe', stack, handle);
				return add(stack, handle) ? true : false;
			},

			/**
			 *  Unsubscribe a handler from an observer stack
			 *  @name   unsubscribe
			 *  @type   function
			 *  @access public
			 *  @param  string stack name
			 *  @param  function handle
			 *  @return array removed handlers
			 */
			unsubscribe: function unsubscribe(stack, handle){
				trigger('observer.unsubscribe', stack, handle);
				return handle ? remove(stack, handle) : flush(stack);
			},

			/**
			 *  Notify all subscribers to a stack
			 *  @name   subscribe
			 *  @type   function
			 *  @access public
			 *  @param  string stack name
			 *  @param  mixed  arg1 ... argN
			 *  @return void
			 */
			notify: function notify(){
				var arg = Array.prototype.slice.call(arguments);
				arg.unshift('observer.notify');
				trigger.apply(trigger, arg);
				return trigger.apply(observer, arguments);
			}
		};
		return observer;
	})())();

	/**
	 *  Event attachment handler
	 */
	konflux.event = new(function(){
		var event = this,
			_queue = internal('event.queue'),

			/**
			 *  Ready state handler, removes all relevant triggers and executes any handler that is set
			 *  @name   _ready
			 *  @type   function
			 *  @access private
			 *  @return void
			 */
			_ready = function(e){
				var run = false,
					p;
				if (document.removeEventListener)
				{
					document.removeEventListener('DOMContentLoaded', _ready, false);
					window.removeEventListener('load', _ready, false);
					run = true;
				}
				else if (document.readyState === 'complete')
				{
					document.detachEvent('onreadystate', _ready);
					window.detachEvent('onload', _ready);
					run = true;
				}

				if (run && _queue.ready)
					for (p in _queue.ready)
						_queue.ready[p].call(e);
			};

		/**
		 *  A custom DOMReady handler
		 *  @name   add
		 *  @type   function
		 *  @access public
		 *  @param  function handler
		 *  @return void
		 */
		event.ready = function(handler){
			//  the document is ready already
			if (document.readyState === 'complete')
				return setTimeout(handler, 1); // make sure we run the 'event' asynchronously

			//  we cannot use the event.listen method, as we need very different event listeners
			if (typeof _queue.ready === 'undefined')
			{
				_queue.ready = [];
				if (document.addEventListener)
				{
					//  prefer the 'DOM ready' event
					document.addEventListener('DOMContentLoaded', _ready, false);
					//  failsafe to window.onload
					window.addEventListener('load', _ready, false);
				}
				else
				{
					//  the closest we can get to 'DOMContentLoaded' in IE, this is still prior to onload
					document.attachEvent('onreadystatechange', _ready);
					//  again the failsafe, now IE style
					window.attachEvent('onload', _ready);
				}
			}
			_queue.ready.push(handler);
		};

		/**
		 *  Add event listeners to target
		 *  @name   listen
		 *  @type   function
		 *  @access public
		 *  @param  DOMElement target
		 *  @param  string event type
		 *  @param  function handler
		 *  @return bool success
		 */
		event.listen = function(target, type, handler){
			if (target.addEventListener)
				return target.addEventListener(type, handler, false);

			var name = 'event_' + type + '_' + handler;
			target[name] = handler;

			if (target.attachEvent)
				return target.attachEvent('on' + type, function(){target[name].apply(target, [window.event])});
			return target['on' + type] = function(e){target[name].apply(target, arguments)};
		};

		return event;
	})();

	/**
	 *  Breakpoint object, add/remove classes on specified object (or body) when specific browser dimensions are met
	 *  (triggers observations when viewport dimensions change)
	 */
	konflux.breakpoint = new(function(){
		var breakpoint = function(){},
			_dimension = internal('breakpoint.dimension'),
			_ratio = internal('breakpoint.ratio'),
			_current = null,
			_timer = null,
			_ratioTimer = null,

			/**
			 *  Handle browser window resize events, matching the most appropriate size
			 *  @name   _resize
			 *  @type   function
			 *  @access private
			 *  @param  event
			 *  @return void
			 */
			_resize = function(e){
				var dimension = _match(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);

				//  if we don't have any valid dimension or the dimension is equal to the current one, stop
				if (!dimension || _current === dimension)
					return false;

				//  is there a current set, remove it
				if (_current)
					_current.element.className = _current.element.className.replace(_current.expression, '');

				//  do we have an element to manipulate
				if (!dimension.element)
					dimension.element = document.body;

				//  set the given class on the element
				dimension.element.className = konflux.string.trim(dimension.element.className) + ' ' + dimension.className;
				konflux.observer.notify('breakpoint.change', dimension.className);

				_current = dimension;
			},
			/**
			 *  Determine the best matching dimension and return the settings
			 *  @name   _match
			 *  @type   function
			 *  @access private
			 *  @param  int browser width
			 *  @return object config
			 */
			_match = function(width){
				var found, delta, min, p;
				for (p in _dimension)
				{
					min = !min ? p : Math.min(min, p);
					if (p < width && (!delta || width - p < delta))
					{
						found = p;
						delta = width - p;
					}
				}
				return _dimension[found] || _dimension[min] || false;
			},
			/**
			 *  Determine the best matching pixel ratio and set the defined classes
			 *  @name   _pixelRatio
			 *  @type   function
			 *  @access private
			 *  @return void
			 */
			_pixelRatio = function(){
				var ratio = typeof window.devicePixelRatio !== 'undefined' ? window.devicePixelRatio : 1;
				if (typeof _ratio[ratio] !== 'undefined')
					_ratio[ratio].element.className = konflux.string.trim(_ratio[ratio].element.className) + ' ' + _ratio[ratio].className;
			};

		/**
		 *  Add breakpoint configuration
		 *  @name   add
		 *  @type   function
		 *  @access public
		 *  @param  int width
		 *  @param  string classname
		 *  @param  DOMElement target (defaults to 'body')
		 *  @return void
		 *  @note   when a breakpoint is added, the _resize handler will be triggered with a slight delay, 
		 *          so if a suitable breakpoint is added it will be used immediately but _resize will occur only once.
		 *          This ought to prevent FOUC
		 */
		breakpoint.add = function(width, className, target){
			clearTimeout(_timer);
			_dimension[width] = {
				expression: new RegExp('\s*' + className + '\s*', 'g'),
				className: className,
				element: target
			};
			_timer = setTimeout(function(){_resize()}, 1);
		};

		/**
		 *  Add pixel ratio configuration
		 *  @name   ratio
		 *  @type   function
		 *  @access public
		 *  @param  int ratio
		 *  @param  string classname
		 *  @param  DOMElement target (defaults to 'body')
		 *  @return void
		 *  @note   as the ratio does not change, the best matching ratio will be added once
		 */
		breakpoint.ratio = function(ratio, className, target){
			clearTimeout(_ratioTimer);
			_ratio[ratio] = {
				expression: new RegExp('\s*' + className + '\s*', 'g'),
				className: className,
				element: target || document.body
			};
			_ratioTimer = setTimeout(function(){_pixelRatio()}, 1);
		};

		//  listen to the resize event
		konflux.event.listen(window, 'resize', _resize);

		return breakpoint;
	})();


	konflux.point = new(function(){
		function Point(x, y){
			var p = this;
			p.x = x;
			p.y = y;
		};
		var point = this;

		point.create = function(x, y){
			return new Point(x, y);
		};

		return point;
	})();


	konflux.canvas = new(function(){
		var canvas = this,
			_relay = function(f){
				return function(){
					f.apply(canvas.context, arguments);
					return canvas;
				};
			},
			_property = function(k, c){
				return function(v){
					var value;
					if (!arguments.length)
						return canvas.context[k];

					canvas.context[k] = v;
					return canvas;
				};
			}
			_processColorStops = function(gradient, color){
				for (p in color)
					gradient.addColorStop(p, color[p]);
			};

		canvas.create = function(width, height){
			var object = document.createElement('canvas');
			object.setAttribute('width', width);
			object.setAttribute('height', height);

			return canvas.init(object);
		};

		canvas.init = function(object){
			var property = {
				globalAlpha: 1,
				globalCompositeOperation: 'source-over',  //  source-over, source-in, source-out, source-atop, destination-over, destination-in, destination-out, destination-atop, lighter, copy, xor
				lineWidth: 1,
				lineCap: 'butt',  //  butt, round, square
				lineJoin: 'miter',  //  round, bevel, miter
				miterLimit: 10,
				strokeStyle: '#000',
				fillStyle: '#000',
				shadowOffsetX: 0,
				shadowOffsetY: 0,
				shadowBlur: 0,
				shadowColor: 'transparent black',
				font: '10px sans-serif',
				textAlign: 'start',  //  start, end, left, right, center
				textBaseLine: 'alphabetic',  //  top, hanging, middle, alphabetic, ideographic, bottom
				width: null //  readonly
			},
			p;
			canvas.object  = object;
			canvas.context = object.getContext('2d');

			for (p in canvas.context)
				if (typeof canvas.context[p] === 'function')
					canvas[p] = _relay(canvas.context[p]);

			for (p in property)
				canvas[p] = _property(p, property[p]);

			return canvas;
		};

		canvas.append = function(o){
			if (typeof o === 'string')
				o = document.getElementById(o);
			o.appendChild(canvas.object);
			return canvas.object && canvas.context ? canvas : canvas.init(canvas.object);
		};

		canvas.shadow = function(x, y, blur, color){
			if (typeof x !== 'undefined')
				canvas.shadowOffsetX(x);
			if (typeof y !== 'undefined')
				canvas.shadowOffsetY(y);
			if (typeof blur !== 'undefined')
				canvas.shadowBlur(blur);
			if (typeof color !== 'undefined')
				canvas.shadowColor(color);

			return canvas;
		};

		canvas.data = function(data){
			var image;
			if (data)
			{
				image = new Image();
				image.src = data;
				canvas.context.clearRect(0, 0, canvas.object.width, canvas.object.height);
				canvas.context.drawImage(image, 0, 0);
				return canvas;
			}
			return canvas.object.toDataURL();
		};

		canvas._fill = function(color){
			if (color)
				canvas.fillStyle(color);
			canvas.fill();
			return canvas;
		};

		canvas._stroke = function(color, width, cap){
			if (color)
				canvas.strokeStyle(color);
			if (width)
				canvas.lineWidth(width);
			if (cap)
				canvas.lineCap(cap);

			canvas.stroke();
			return canvas;
		};

		canvas.radialGradientFill = function(a, ar, b, br, color){
			var gradient = canvas.context.createRadialGradient(a.x, a.y, ar, b.x, b.y, br);
			_processColorStops(gradient, color);
			canvas.fillStyle(gradient);
			canvas.fill();

			return canvas;
		};

		canvas.linearGradientFill = function(a, b, color){
			var gradient = canvas.context.createLinearGradient(a.x, a.y, b.x, b.y);
			_processColorStops(gradient, color);
			canvas.fillStyle(gradient);
			canvas.fill();

			return canvas;
		};

		canvas.circle = function(x, y, radius){
			canvas.beginPath();
			canvas.arc(x, y, radius, 0, Math.PI * 2, 1);
			canvas.closePath();

			return canvas;
		};

		canvas.line = function(){
			var i;
			canvas.beginPath();
			for (i = 0; i < arguments.length; ++i)
				canvas[i == 0 ? 'moveTo' : 'lineTo'](arguments[i].x, arguments[i].y);
			canvas.closePath();

			return canvas;
		};

		return canvas;
	})();


	konflux.logo = new(function(){
		var logo = this,
			P = konflux.point.create,
			render = function(){
				return konflux.canvas.create(100, 75)
					.line(P(3.1, 44.3), P(1.6, 34.9), P(40.6, 65.8), P(96.2, 21.9), P(94.4, 31.2), P(40.6, 75.0), P(3.1, 44.3)).fillStyle('rgb(25, 25, 25)').fill()
					.line(P(77.1, 0.0), P(40.7, 24.7), P(21.4, 11.7), P(0.0, 24.7), P(1.6, 34.9), P(40.6, 65.8), P(96.2, 21.9), P(98.4, 11.7), P(77.1, 0.0)).fillStyle('rgb(7, 221, 246)').fill()
					.globalAlpha(.2).line(P(0.0, 24.7), P(1.6, 34.9), P(40.6, 65.8), P(96.2, 21.9), P(98.4, 11.7), P(40.6, 55.7), P(0.0, 24.7)).fillStyle('rgb(0, 0, 0)').fill();
			};

		logo.append = function(o){
			return render().append(o);
		};
		logo.data = function(){
			return render().data()
		};
		logo.image = function(){
			var img = document.createElement('img');
		img.src = logo.data();
			return img;
		};
	})();

	//  make konflux available on the global (window) scope both as 'konflux' and 'kx'
	window.konflux = window.kx = konflux;
})(window);