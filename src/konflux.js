/*
 *       __    Konflux (version $DEV$ - $DATE$) - a javascript helper library
 *      /\_\
 *   /\/ / /   Copyright 2012-2014, Konfirm (Rogier Spieker)
 *   \  / /    Released under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

/*jshint browser: true, undef: true, unused: true, curly: false, newcap: false, forin: false, devel: true */
;(function(window, undefined) {
	'use strict';

	var version = '$DEV$ - $DATE$ - $COMMIT$',
		document = window.document,
		navigator = window.navigator,
		undef = 'undefined',

		//  Internal properties
		_buffer  = {}, //  singleton-like container, providing 'static' objects
		_count = 0,    //  internal counter, used to create unique values
		_timestamp,    //  rough execution start time
		konflux;

	//  Internal functions

	/**
	 *  Obtain a reference to a specific buffer object, creates one if it does not exist
	 *  @name    buffer
	 *  @type    function
	 *  @access  internal
	 *  @param   string object name
	 *  @return  object buffer
	 */
	function buffer(key) {
		if (undef === typeof _buffer[key]) {
			_buffer[key] = {};
		}

		return _buffer[key];
	}

	/**
	 *  Obtain the milliseconds since the UNIX Epoch (Jan 1, 1970 00:00:00.000)
	 *  @name    time
	 *  @type    function
	 *  @access  internal
	 *  @return  int milliseconds
	 */
	function time() {
		return Date.now ? Date.now() : (new Date()).getTime();
	}

	/**
	 *  Shorthand method for creating a combined version of several objects
	 *  @name    combine
	 *  @type    function
	 *  @access  internal
	 *  @param   object variable1
	 *  @param   object ...
	 *  @param   object variableN
	 *  @return  object combined
	 */
	function combine() {
		var obj = {},
			i, p;

		for (i = 0; i < arguments.length; ++i) {
			if (isType('object', arguments[i])) {
				for (p in arguments[i]) {
					obj[p] = p in obj && isType('object', obj[p]) ? combine(arguments[i][p], obj[p]) : arguments[i][p];
				}
			}
		}

		return obj;
	}

	/**
	 *  Obtain the elapsed time since Konflux started (roughly), using the format: [Nd ] hh:mm:ss.ms
	 *  @name    elapsed
	 *  @type    function
	 *  @access  internal
	 *  @return  string formatted time
	 */
	function elapsed() {
		var day = 86400000,
			hour = 3600000,
			minute = 60000,
			delta = Math.abs((new Date()).getTime() - _timestamp),
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
	}

	/**
	 *  Obtain an unique key, the key is guaranteed to be unique within the browser runtime
	 *  @name    unique
	 *  @type    function
	 *  @access  internal
	 *  @return  string key
	 */
	function unique() {
		return (++_count + time() % 86400000).toString(36);
	}

	/**
	 *  Get the unique reference for given DOM element, adds it if it does not yet exist
	 *  @name    elementReference
	 *  @type    function
	 *  @access  internal
	 *  @param   DOMElement element
	 *  @param   bool       hidden [optional, default false]
	 *  @return  string unique reference
	 *  @note    this function adds an attribute 'data-kxref' to the element if the reference is not hidden
	 *           (the hidden option is not considered to be best practise)
	 */
	function elementReference(element, hidden) {
		var name = 'kxref',
			prepare = {
				window: window,
				document: document,
				root: document.documentElement,
				head: document.head,
				body: document.body
			},
			reference, p;

		//  we don't ever contaminate the window object, document, documentElement or body element
		for (p in prepare) {
			if (element === prepare[p]) {
				reference = p;
				break;
			}
		}

		if (!element || !('nodeType' in element) || element.nodeType !== 1) {
			return false;
		}
		else if (!reference) {
			return hidden ? (name in element ? element[name] : null) : element.getAttribute('data-' + name);
		}

		//  if no reference was set yet, do so now
		reference = unique();

		if (hidden) {
			element[name] = reference;
		}
		else {
			element.setAttribute('data-' + name, reference);
		}

		return reference;
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
			t = type(p);

		if (isType('function', types[t]) && types[t](p))
			return false;
		return true;
	}

	/**
	 *  Determine the type of given variable
	 *  @name    type
	 *  @type    function
	 *  @access  internal
	 *  @param   mixed variable
	 *  @param   bool  explicit
	 *  @return  string type
	 */
	function type(variable, explicit) {
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
	 *  @type    function
	 *  @access  internal
	 *  @param   string type
	 *  @param   mixed  variable
	 *  @return  bool   istype
	 */
	function isType(t, variable) {
		var full = type(variable),
			check = t && t.length ? full.substr(0, t.length) : null;

		if (check !== t) {
			switch (full) {
				case 'object':
					check = type(variable, true).substr(0, t.length);
					break;

				case 'number':
					check = (parseInt(variable) === variable ? 'integer' : 'float').substr(0, t.length);
					break;
			}
		}

		return check === t;
	}

	/**
	 *  Does given object have given property
	 *  @name    hasProperty
	 *  @type    function
	 *  @access  internal
	 *  @param   object haystack
	 *  @param   string property
	 *  @return  bool   available
	 */
	function hasProperty(haystack, needle) {
		return !!(needle in haystack);
	}

	/**
	 *  Provide feedback about deprecated features
	 *  @name    deprecate
	 *  @type    function
	 *  @access  internal
	 *  @param   string message
	 *  @return  void
	 */
	function deprecate(message) {
		var method = ['info', 'warn', 'log'],
			i;

		for (i = 0 ; i < method.length; ++i) {
			if (isType('function', console[method[i]])) {
				console[method[i]](elapsed() + ' DEPRECATED: ' + message);
				break;
			}
		}
	}

	//  use the time() function to obtain the starting time
	_timestamp = time();



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
		var kx = this;

		/**
		 *  Obtain the milliseconds since the UNIX Epoch (Jan 1, 1970 00:00:00.000)
		 *  @name    time
		 *  @type    method
		 *  @access  public
		 *  @return  int milliseconds
		 */
		kx.time = time;

		/**
		 *  Obtain the elapsed time since Konflux started (roughly), using the format: [Nd] hh:mm:ss.ms
		 *  @name    elapsed
		 *  @type    method
		 *  @access  public
		 *  @return  string formatted time
		 */
		kx.elapsed = elapsed;

		/**
		 *  Obtain an unique key, the key is guaranteed to be unique within the browser runtime
		 *  @name    unique
		 *  @type    method
		 *  @access  public
		 *  @return  string key
		 */
		kx.unique = unique;

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
		kx.combine = combine;

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
		kx.type = type;

		/**
		 *  Test the type of given variable
		 *  @name    isType
		 *  @type    method
		 *  @access  public
		 *  @param   string type
		 *  @param   mixed  variable
		 *  @return  bool   istype
		 */
		kx.isType = isType;

		/**
		 *  Convenience function bridging the event.ready method
		 *  @name    ready
		 *  @type    method
		 *  @access  public
		 *  @param   function handler
		 *  @return  bool     is ready
		 */
		kx.ready = function(handler) {
			return 'event' in konflux ? konflux.event.ready(handler) : false;
		};

		/**
		 *  Select elements matching given CSS selector
		 *  @name   select
		 *  @type   method
		 *  @access public
		 *  @param  string     selector
		 *  @param  DOMElement parent
		 *  @return DOMNodeList (empty Array if the dom module is not available)
		 */
		kx.select = function(selector, parent) {
			return 'dom' in konflux ? konflux.dom.select(selector, parent) : new kxIterator([]);
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

			while (prop.length && match.length)
				result[prop.shift()] = match.shift();

			return info ? result : result.version;
		};

		/**
		 *  Create a kxPoint instance
		 *  @name   point
		 *  @type   method
		 *  @access public
		 *  @param  number x position
		 *  @param  number y position
		 *  @return kxPoint point
		 *  @note   As of konflux version > 0.3.1 the points are created without the new keyword
		 *          ('new konflux.point(X, Y)' can now be 'konflux.point(X, Y)')
		 */
		kx.point = function(x, y) {
			return kxPoint(x, y);
		};

		/**
		 *  Create a kxIterator instance
		 *  @name   iterator
		 *  @type   method
		 *  @access public
		 *  @param  mixed collection
		 *  @return kxIterator iterator
		 */
		kx.iterator = function(collection) {
			return collection instanceof kxIterator ? collection : new kxIterator(collection);
		};

		return this;
	}
	konflux = new Konflux();

	/*global kxObserver, kxBrowser, kxURL, kxAjax, kxStyle, kxNumber, kxString, kxArray, kxDOM, kxEvent, kxTiming, kxStorage*/

	//= include ['core/*.js']

	//  expose object instances
	konflux.observer   = new kxObserver();
	konflux.browser    = new kxBrowser();
	konflux.url        = new kxURL();
	konflux.ajax       = new kxAjax();
	konflux.style      = new kxStyle();
	konflux.number     = new kxNumber();
	konflux.string     = new kxString();
	konflux.array      = new kxArray();
	konflux.dom        = new kxDOM();
	konflux.event      = new kxEvent();
	konflux.timing     = new kxTiming();
	konflux.storage    = new kxStorage();

	//  make konflux available on the global (window) scope both as 'konflux' and 'kx'
	window.konflux = window.kx = konflux;
})(window);
