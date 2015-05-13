/*
 *       __    Konflux (version $DEV$ - $DATE$) - a javascript helper library
 *      /\_\
 *   /\/ / /   Copyright 2012-2015, Konfirm (Rogier Spieker)
 *   \  / /    Released under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

;(function(window, undefined) {
	'use strict';

	var version = '$DEV$ - $DATE$ - $COMMIT$';

	/**
	 *  The Konflux object itself
	 *  @name    Konflux
	 *  @type    constructor function
	 *  @access  internal
	 *  @return  object   konflux
	 *  @note    konflux is available both as (window.)konflux and (window.)kx
	 */
	function Konflux() {
		/*jshint validthis: true*/
		var kx = this,
			counter = 0,
			timestamp;

		function init() {
			timestamp = kx.time();
		}

		/**
		 *  Verify whether given argument is empty
		 *  @name    empty
		 *  @type    function
		 *  @access  internal
		 *  @param   mixed variable to check
		 *  @return  bool  empty
		 *  @note    The function follows PHP's empty function; null, undefined, 0, '', '0', {}, [] and false are all considered empty
		 */
		function empty(p) {
			var types = {
					array:   function(a) {
						return a.length > 0;
					},

					object:  function(o) {
						for (o in o) {
							return true;
						}

						return false;
					},

					boolean: function(b) {
						return b;
					},

					number:  function(n) {
						return n !== 0;
					},

					string:  function(s) {
						return !/^0?$/.test(s);
					}
				},
				t = kx.type(p);

			if (konflux.isType('function', types[t]) && types[t](p)) {
				return false;
			}

			return true;
		}

		/**
		 *  Obtain the milliseconds since the UNIX Epoch (Jan 1, 1970 00:00:00.000)
		 *  @name    time
		 *  @type    method
		 *  @access  public
		 *  @return  int milliseconds
		 */
		kx.time = function() {
			return Date.now ? Date.now() : (new Date()).getTime();
		};

		/**
		 *  Obtain the elapsed time since Konflux started (roughly), using the format: [Nd] hh:mm:ss.ms
		 *  @name    elapsed
		 *  @type    method
		 *  @access  public
		 *  @return  string formatted time
		 */
		kx.elapsed = function() {
			var day = 86400000,
				hour = 3600000,
				minute = 60000,
				delta = Math.abs((new Date()).getTime() - timestamp),
				days = Math.floor(delta / day),
				hours = Math.floor((delta -= days * day) / hour),
				minutes = Math.floor((delta -= hours * hour) / minute),
				seconds = Math.floor((delta -= minutes * minute) / 1000),
				ms = Math.floor(delta -= seconds * 1000),
				zero = '000';

			return (days > 0 ? days + 'd ' : '') +
					(zero + hours).substr(-2) + ':' +
					(zero + minutes).substr(-2) + ':' +
					(zero + seconds).substr(-2) + '.' +
					(zero + ms).substr(-3);
		};

		/**
		 *  Obtain an unique key, the key is guaranteed to be unique within the browser runtime
		 *  @name    unique
		 *  @type    method
		 *  @access  public
		 *  @return  string key
		 */
		kx.unique = function() {
			return (++counter + konflux.time() % 86400000).toString(36);
		};

		/**
		 *  Shorthand method for creating a combined version of several objects
		 *  @name    combine
		 *  @type    method
		 *  @access  public
		 *  @param   object variable1
		 *  @param   object ...
		 *  @param   object variableN
		 *  @return  function constructor
		 */
		kx.combine = function() {
			var obj = {},
				arg = arguments,
				i, p;

			for (i = 0; i < arg.length; ++i) {
				if (kx.isType('object', arg[i])) {
					for (p in arg[i]) {
						obj[p] = p in obj && kx.isType('object', obj[p]) ? kx.combine(arg[i][p], obj[p]) : arg[i][p];
					}
				}
			}

			return obj;
		}

		/**
		 *  Verify whether given arguments are empty
		 *  @name    empty
		 *  @type    method
		 *  @access  public
		 *  @param   mixed variable1
		 *  @param   mixed ...
		 *  @param   mixed variableN
		 *  @return  bool  variables are empty
		 */
		kx.empty = function() {
			var arg = konflux.array.cast(arguments);
			while (arg.length) {
				if (!empty(arg.shift())) {
					return false;
				}
			}

			return true;
		};

		/**
		 *  Determine the type of given variable
		 *  @name    type
		 *  @type    method
		 *  @access  public
		 *  @param   mixed  variable
		 *  @param   bool   explicit types [optional, default undefined - simple types]
		 *  @return  string type
		 */
		kx.type = function(variable, explicit) {
			var result = variable instanceof Array ? 'array' : (variable === null ? 'null' : typeof variable),
				name;

			if (explicit && result === 'object') {
				name = /(?:function\s+)?(.{1,})\(/i.exec(variable.constructor.toString());

				if (name && name.length > 1 && name[1] !== 'Object') {
					return name[1];
				}
			}

			return result;
		}

		/**
		 *  Test the type of given variable
		 *  @name    isType
		 *  @type    method
		 *  @access  public
		 *  @param   string type
		 *  @param   mixed  variable
		 *  @return  bool  is type
		 */
		kx.isType = function(type, variable) {
			var full = kx.type(variable),
				check = type && type.length ? full.substr(0, type.length) : null;

			if (check !== type) {
				switch (full) {
					case 'object':
						check = kx.type(variable, true).substr(0, type.length);
						break;

					case 'number':
						check = (parseInt(variable, 10) === variable ? 'integer' : 'float').substr(0, type.length);
						break;
				}
			}

			return check === type;

		};

		/**
		 *  Obtain the konflux version info
		 *  @name   version
		 *  @type   method
		 *  @access public
		 *  @param  bool   info [optional, default false - no build information]
		 *  @return string version (object info if bool info is true)
		 */
		kx.version = function(info) {
			var match = version.split(' - '),
				prop = ['version', 'date', 'revision', 'type'],
				result = {};

			while (prop.length && match.length) {
				result[prop.shift()] = match.shift();
			}

			return info ? result : result.version;
		};

		/**
		 *  Provide feedback about deprecated features, once (per function, per browser view)
		 *  @name    deprecate
		 *  @type    function
		 *  @access  public
		 *  @param   string   message
		 *  @param   function callback
		 *  @param   object   scope [optional, default undefined - no scope]
		 *  @return  void
		 */
		kx.deprecate = function(message, callback, scope) {
			var shown;

			return function() {
				var method = ['info', 'warn', 'log'],
					i;

				if (!shown) {
					shown = true;

					for (i = 0 ; i < method.length; ++i) {
						if (kx.isType('function', console[method[i]])) {
							console[method[i]](kx.elapsed() + ' DEPRECATED: ' + message);
							break;
						}
					}
				}

				return callback.apply(scope || null, arguments);
			};
		}


		/**
		 *  Register a module or function onto the kx object
		 *  @name    register
		 *  @access  public
		 *  @param   string  name
		 *  @param   mixed   value [one of: object (module) or function]
		 *  @return  mixed   old value
		 */
		kx.register = function(name, module) {
			var result = false;

			if (kx.isType('function', module) || kx.isType('object', module)) {
				result = name in kx ? kx[name] : null;
				kx[name] = module;
			}

			return result;
		};

		init();
	}

	(function(konflux){
		//  expose object instances

		//= include core/observer.js
		//= include core/browser.js
		//= include core/url.js
		//= include core/ajax.js
		//= include core/style.js
		//= include core/number.js
		//= include core/string.js
		//= include core/array.js
		//= include core/dom.js
		//= include core/event.js
		//= include core/timing.js
		//= include core/storage.js
		//= include core/point.js
		//= include core/iterator.js

		//  make konflux available on the global (window) scope both as 'konflux' and 'kx'
		window.konflux = window.kx = konflux;
	})(new Konflux());

})(window);
