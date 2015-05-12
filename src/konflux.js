/*
 *       __    Konflux (version $DEV$ - $DATE$) - a javascript helper library
 *      /\_\
 *   /\/ / /   Copyright 2012-2015, Konfirm (Rogier Spieker)
 *   \  / /    Released under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

/*jshint browser: true, 'undefined': true, unused: true, curly: false, newcap: false, forin: false, devel: true */
/*global File, FileList, FormData */
;(function(window, undefined) {
	'use strict';

	var version = '$DEV$ - $DATE$ - $COMMIT$',
		document = window.document,
		navigator = window.navigator,

		//  Internal properties
		konflux;

	//  Internal functions

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
				return p;
			}
		}

		if (!element || !('nodeType' in element) || element.nodeType !== 1) {
			return false;
		}
		else {
			return hidden ? (name in element ? element[name] : null) : element.getAttribute('data-' + name);
		}

		//  if no reference was set yet, do so now
		reference = konflux.unique();

		if (hidden) {
			element[name] = reference;
		}
		else {
			element.setAttribute('data-' + name, reference);
		}

		return reference;
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
			if (konflux.isType('function', console[method[i]])) {
				console[method[i]](konflux.elapsed() + ' DEPRECATED: ' + message);
				break;
			}
		}
	}

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
			timestamp, buffer;

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
		 *  Obtain a reference to a specific buffer object, creates one if it does not exist
		 *  @name    buffer
		 *  @type    function
		 *  @access  internal
		 *  @param   string object name
		 *  @return  object buffer
		 */
		kx.buffer = function(name) {
			if (!buffer) {
				buffer = {};
			}

			if (typeof buffer[name] === 'undefined') {
				buffer[name] = {};
			}

			return buffer[name];
		};

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
				i, p;

			for (i = 0; i < arguments.length; ++i) {
				if (kx.isType('object', arguments[i])) {
					for (p in arguments[i]) {
						obj[p] = p in obj && kx.isType('object', obj[p]) ? kx.combine(arguments[i][p], obj[p]) : arguments[i][p];
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
						check = (parseInt(variable) === variable ? 'integer' : 'float').substr(0, type.length);
						break;
				}
			}

			return check === type;

		};

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
			return 'dom' in konflux ? konflux.dom.select(selector, parent) : new KonfluxIterator([]);
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
		 *  Create a KonfluxPoint instance
		 *  @name   point
		 *  @type   method
		 *  @access public
		 *  @param  number x position
		 *  @param  number y position
		 *  @return KonfluxPoint point
		 *  @note   As of konflux version > 0.3.1 the points are created without the new keyword
		 *          ('new konflux.point(X, Y)' can now be 'konflux.point(X, Y)')
		 */
		kx.point = function(x, y) {
			return new KonfluxPoint(x, y);
		};

		/**
		 *  Create a KonfluxIterator instance
		 *  @name   iterator
		 *  @type   method
		 *  @access public
		 *  @param  mixed collection
		 *  @return KonfluxIterator iterator
		 */
		kx.iterator = function(collection) {
			return collection instanceof KonfluxIterator ? collection : new KonfluxIterator(collection);
		};

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

	konflux = new Konflux();

	//= include core/iterator.js
	//= include core/browser.js
	//= include core/number.js
	//= include core/string.js
	//= include core/array.js
	//= include core/dom.js
	//= include core/event.js
	//= include core/point.js
	//= include core/ajax.js

	/**
	 *  Handle URL's/URI's
	 *  @module  url
	 *  @note    available as konflux.url / kx.url
	 */
	function KonfluxURL() {
		/*jshint validthis: true*/
		var url = this;

		/**
		 *  Parse given URL into its URI components
		 *  @name    parse
		 *  @type    function
		 *  @access  internal
		 *  @param   string location
		 *  @return  object result
		 */
		function parse(location) {
			//  URL regex + key processing based on the work of Derek Watson's jsUri (http://code.google.com/p/jsuri/)
			var match = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/.exec(location),
				prop = ['source', 'protocol', 'domain', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
				result = {};
			while (prop.length)
				result[prop.shift()] = match.length ? match.shift() : '';

			if (result.query)
				result.query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(a, b, c) {
					if (konflux.isType('object', result.query))
						result.query = {};
					if (b)
						result.query[b] = c;
				});
			return result;
		}

		/**
		 *  The parsed url for the URL of the current page
		 *  @name    current
		 *  @type    object
		 *  @access  public
		 */
		url.current = konflux.isType('undefined', window.location.href) ? parse(window.location.href) : false;

		/**
		 *  Parse given URL into its URI components
		 *  @name    parse
		 *  @type    method
		 *  @access  public
		 *  @param   string url
		 *  @return  object result
		 */
		url.parse   = parse;

		/**
		 *  Determine whether given URL is on the same domain as the page itself
		 *  @name    isLocal
		 *  @type    method
		 *  @access  public
		 *  @param   string location
		 *  @return  bool   local
		 */
		url.isLocal = function(location) {
			return url.current.domain === url.parse(location).domain;
		};
	}

	/**
	 *  Style(sheet) manipulation
	 *  @module  style
	 *  @note    available as konflux.style / kx.style
	 */
	function KonfluxStyle() {
		/*jshint validthis: true*/
		var style = this;

		/**
		 *  Obtain the script property notation for given property
		 *  @name    scriptProperty
		 *  @type    function
		 *  @access  internal
		 *  @param   string property
		 *  @return  string script property
		 *  @note    'background-color' => 'backgroundColor'
		 */
		function scriptProperty(property) {
			var n = 0;

			if (property === 'float')
				return 'cssFloat';

			while ((n = property.indexOf('-', n)) >= 0)
				property = property.substr(0, n) + property.charAt(++n).toUpperCase() + property.substring(n + 1);
			return property;
		}

		/**
		 *  Obtain the CSS property notation for given property
		 *  @name    cssProperty
		 *  @type    function
		 *  @access  internal
		 *  @param   string property
		 *  @return  string CSS property
		 *  @note    'backgroundColor' => 'background-color'
		 */
		function cssProperty(property) {
			if (property === 'cssFloat')
				property = 'float';

			return property.replace(/([A-Z])/g, '-$1').toLowerCase();
		}

		/**
		 *  Determine whether or not the property is supported and try a vendor prefix, otherwise return false
		 *  @name    hasProperty
		 *  @type    function
		 *  @access  internal
		 *  @param   string  property
		 *  @param   DOMNode target [optional, default undefined - document.body]
		 *  @return  mixed  (one of: string (script)property, or false)
		 */
		function hasProperty(property, target) {
			property = scriptProperty(property);
			target   = target || document.body;

			if (property in target.style)
				return property;

			property = konflux.browser.prefix() + konflux.string.ucFirst(property);
			if (property in target.style)
				return property;

			return false;
		}

		/**
		 *  Obtain all local stylesheets, where local is determined on a match of the domain
		 *  @name    getLocalStylesheets
		 *  @type    function
		 *  @access  internal
		 *  @return  array stylesheets
		 */
		function getLocalStylesheets() {
			var all = document.styleSheets,
				list = [],
				i;

			for (i = 0; i < all.length; ++i)
				if (konflux.url.isLocal(all[i].href))
					list.push(all[i]);

			return list;
		}

		/**
		 *  Obtain specific stylesheets
		 *  @name    getStylesheet
		 *  @type    function
		 *  @access  internal
		 *  @param   string name [optional, default 'all' - all stylesheets. Possible values 'first', 'last', 'all' or string filename]
		 *  @param   bool   includeOffset [optional, default false - local stylesheets only]
		 *  @return  array stylesheets
		 */
		function getStylesheet(name, includeOffsite) {
			var list = includeOffsite ? document.styleSheets : getLocalStylesheets(),
				match = [],
				i;

			switch (name) {
				//  get the first stylesheet from the list of selected stylesheets
				case 'first':
					if (list.length > 0)
						match = [list[0]];
					break;

				//  get the last stylesheet from the list of selected stylesheets
				case 'last':
					if (list.length > 0)
						match = [list[list.length - 1]];
					break;

				default:

					//  if no name was provided, return the entire list of (editable) stylesheets
					if (name === 'all')
						match = list;
					else if (!name)
						match = false;

					//  search for the stylesheet(s) whose href matches the given name
					else if (list.length > 0)
						for (i = 0; i < list.length; ++i) {
							if (list[i].href && list[i].href.substr(-name.length) === name)
								match.push(list[i]);
							else if (list[i].title && list[i].title === name)
								match.push(list[i]);
						}

					break;
			}

			return match;
		}

		/**
		 *  Obtain a stylesheet by its url or title
		 *  @name    findStylesheet
		 *  @type    function
		 *  @access  internal
		 *  @param   string url
		 *  @param   string name
		 *  @return  StyleSheet (bool false if not found)
		 */
		function findStylesheet(url, name) {
			var match = getStylesheet(url, true);
			if (name && match.length === 0)
				match = getStylesheet(name, true);
			return match.length > 0 ? match[0] : false;
		}

		/**
		 *  Create a new stylesheet
		 *  @name    createStylesheet
		 *  @type    function
		 *  @access  internal
		 *  @param   string url
		 *  @param   bool   before (effectively true for being the first stylesheet, anything else for last)
		 *  @param   string name
		 *  @return  style node
		 */
		function createStylesheet(url, before, name) {
			var element = findStylesheet(url, name),
				head = document.head || document.getElementsByTagName('head')[0];

			if (!element) {
				element = document.createElement(url ? 'link' : 'style');
				element.setAttribute('type', 'text/css');
				element.setAttribute('title', name || 'konflux.style.' + konflux.unique());

				if (/link/i.test(element.nodeName)) {
					element.setAttribute('rel', 'stylesheet');
					element.setAttribute('href', url);
				}

				if (before && document.head.firstChild) {
					head.insertBefore(element, head.firstChild);
				}
				else
				{
					head.appendChild(element);
				}
			}

			return element;
		}

		/**
		 *  Parse the style declarations' cssText into key/value pairs
		 *  @name    getStyleProperties
		 *  @type    function
		 *  @access  internal
		 *  @param   CSS Rule
		 *  @return  Object key value pairs
		 */
		function getStyleProperties(declaration) {
			var list = declaration.split(/\s*;\s*/),
				rules = {},
				i, part;

			for (i = 0; i < list.length; ++i) {
				part = list[i].split(/\s*:\s*/);
				if (part[0] !== '')
					rules[scriptProperty(part.shift())] = normalizeValue(part.join(':'));
			}

			return rules;
		}

		/**
		 *  Normalize given selector string
		 *  @name    normalizeSelector
		 *  @type    function
		 *  @access  internal
		 *  @param   string selector
		 *  @return  string normalized selector
		 */
		function normalizeSelector(selector) {
			return selector.split(/\s+/).join(' ').toLowerCase();
		}

		/**
		 *  Normalize given CSS value
		 *  @name    normalizeValue
		 *  @type    function
		 *  @access  internal
		 *  @param   string value
		 *  @return  string normalized value
		 */
		function normalizeValue(value) {
			var pattern = {
					' ': /\s+/g,               //  minimize whitespace
					'"': /["']/g,              //  unify quotes
					',': /\s*,\s*/g,           //  unify whitespace around separators
					'.': /\b0+\./g,            //  remove leading 0 from decimals
					'0': /0(?:px|em|%|pt)\b/g  //  remove units from 0 value
				},
				p;

			for (p in pattern)
				value = value.replace(pattern[p], p);

			//  most browsers will recalculate hex color notation to rgb, so we do the same
			pattern = value.match(/#([0-9a-f]+)/);
			if (pattern && pattern.length > 0) {
				pattern = pattern[1];
				if (pattern.length % 3 !== 0)
					pattern = konflux.string.pad(pattern, 6, '0');
				else if (pattern.length === 3)
					pattern = pattern[0] + pattern[0] + pattern[1] + pattern[1] + pattern[2] + pattern[2];

				value = 'rgb(' + [
					parseInt(pattern[0] + pattern[1], 16),
					parseInt(pattern[2] + pattern[3], 16),
					parseInt(pattern[4] + pattern[5], 16)
				].join(',') + ')';
			}

			return value;
		}

		/**
		 *  Add one or more css classes to given element
		 *  @name    addClass
		 *  @type    method
		 *  @access  public
		 *  @param   DOMelement element
		 *  @param   string classes (separated by any combination of whitespace and/or comma
		 *  @return  string classes
		 */
		style.addClass = function(element, classes) {
			var current = konflux.string.trim(element.className).split(/\s+/);

			element.className = current.concat(konflux.array.diff(classes.split(/[,\s]+/), current)).join(' ');
			return element.className;
		};

		/**
		 *  Remove one or more css classes from given element
		 *  @name    removeClass
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement element
		 *  @param   string classes (separated by any combination of whitespace and/or comma
		 *  @return  string classes
		 */
		style.removeClass = function(element, classes) {
			var delta = konflux.string.trim(element.className).split(/\s+/),
				classList = konflux.string.trim(classes).split(/[,\s]+/),
				i, p;

			for (i = 0; i < classList.length; ++i) {
				p = konflux.array.contains(delta, classList[i]);
				if (p !== false)
					delta.splice(p, 1);
			}

			element.className = delta.join(' ');
			return element.className;
		};

		/**
		 *  Toggle one or more css classes on given element
		 *  @name    toggleClass
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement element
		 *  @param   string classes (separated by any combination of whitespace and/or comma
		 *  @return  string classes
		 */
		style.toggleClass = function(element, classes) {
			var current = konflux.string.trim(element.className).split(/\s+/),
				classList = konflux.string.trim(classes).split(/[,\s]+/),
				i, p;

			for (i = 0; i < classList.length; ++i) {
				p = konflux.array.contains(current, classList[i]);
				if (p !== false)
					current.splice(p, 1);
				else
					current.push(classList[i]);
			}

			element.className = current.join(' ');
			return element.className;
		};

		/**
		 *  Apply style rules to target DOMElement
		 *  @name    inline
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement target
		 *  @param   object style rules
		 *  @return  KonfluxStyle reference
		 */
		style.inline = function(target, rules) {
			var p, q;

			for (p in rules) {
				q = hasProperty(p);
				if (q)
					target.style[q] = rules[p];
			}

			return style;
		};

		/**
		 *  Obtain a CSS selector for given element
		 *  @name    selector
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement target
		 *  @param   bool       skipNode [optional, default false - include node name]
		 *  @return  string selector
		 */
		style.selector = function(target, skipNode) {
			var node = target.nodeName.toLowerCase(),
				id = target.hasAttribute('id') ? '#' + target.getAttribute('id') : null,
				classes = target.hasAttribute('class') ? '.' + konflux.string.trim(target.getAttribute('class')).split(/\s+/).join('.') : null,
				select = '';

			if (arguments.length === 1 || id || classes)
				select = (skipNode ? '' : node) + (id || classes || '');

			return konflux.string.trim((!id && target.parentNode && target !== document.body ? style.selector(target.parentNode, true) + ' ' : '') + select);
		};

		/**
		 *  Obtain a stylesheet by its name or by a mnemonic (first, last, all)
		 *  @name    sheet
		 *  @type    method
		 *  @access  public
		 *  @param   string target [optional, default 'all' - all stylesheets. Possible values 'first', 'last', 'all' or string filename]
		 *  @param   bool   editable [optional, default true - only editable stylesheets]
		 *  @return  array  stylesheets
		 */
		style.sheet = function(target, editable) {
			var list = getStylesheet(konflux.isType('string', target) ? target : null, editable === false ? true : false),
				i;

			if (konflux.isType('undefined', target.nodeName))
				for (i = 0; i < list.length; ++i)
					if (list[i].ownerNode === target)
						return [list[i]];

			return list;
		};

		/**
		 *  Create a new stylesheet, either as first or last
		 *  @name    create
		 *  @type    method
		 *  @access  public
		 *  @param   bool  before all other stylesheets
		 *  @return  styleSheet
		 */
		style.create = function(name, before) {
			var element = createStylesheet(false, before, name);
			return element.sheet || false;
		};

		/**
		 *  Load an external stylesheet, either as first or last
		 *  @name    load
		 *  @type    method
		 *  @access  public
		 *  @param   string   url the url of the stylesheet to load
		 *  @param   function callback
		 *  @param   bool     before all other style sheets
		 *  @return  style node (<link...> element)
		 */
		style.load = function(url, callback, before) {
			var style = createStylesheet(url, before);

			//  if style is a StyleSheet object, it has the ownerNode property containing the actual DOMElement in which it resides
			if (konflux.isType('undefined', style.ownerNode)) {
				style = style.ownerNode;

				//  it is safe to assume here that the stylesheet was loaded, hence we need to apply the callback (with a slight delay, so the order of returning and execution of the callback is the same for both load scenario's)
				if (callback)
					setTimeout(function() {
						callback.apply(style, [style]);
					}, 1);
			}
			else if (callback) {
				konflux.event.add(style, 'load', function(e) {
					callback.apply(style, [e]);
				});
			}

			return style;
		};

		/**
		 *  Determine whether or not the given style (node) is editable
		 *  @name    isEditable
		 *  @type    method
		 *  @access  public
		 *  @param   Stylesheet object or DOMelement style/link
		 *  @return  bool  editable
		 */
		style.isEditable = function(stylesheet) {
			var list = getLocalStylesheets(),
				node = konflux.isType('undefined', stylesheet.ownerNode) ? stylesheet.ownerNode : stylesheet,
				i;
			for (i = 0; i < list.length; ++i)
				if (list[i].ownerNode === node)
					return true;
			return false;
		};

		/**
		 *  Create and add a new style rule
		 *  @name    add
		 *  @type    method
		 *  @access  public
		 *  @param   string selector
		 *  @param   mixed  rules (one of; object {property: value} or string 'property: value')
		 *  @param   mixed  sheet (either a sheet object or named reference, like 'first', 'last' or file name)
		 *  @param   bool   skipNode [optional, default false - include node name]
		 *  @return  int    index at which the rule was added
		 */
		style.add = function(selector, rules, sheet, skipNode) {
			var rule = '',
				find, p, pr;

			//  in case the selector is not a string but a DOMElement, we go out and create a selector from it
			if (konflux.isType('object', selector) && 'nodeType' in selector)
				selector = style.selector(selector, skipNode) || style.selector(selector);

			//  make the rules into an object
			if (konflux.isType('string', rules))
				rules = getStyleProperties(rules);

			//  if rules isn't an object, we exit right here
			if (konflux.isType('object', rules))
				return false;

			//  if no sheet was provided, or a string reference to a sheet was provided, resolve it
			if (!sheet || konflux.isType('string', sheet))
				sheet = getStylesheet(sheet || 'last');

			//  in case we now have a list of stylesheets, we either want one (if there's just one) or we add the style to all
			if (sheet instanceof Array) {
				if (sheet.length === 1) {
					sheet = sheet[0];
				}
				else if (sheet.length <= 0) {
					sheet = createStylesheet().sheet;
				}
				else
				{
					rule = true;
					for (p = 0; p < sheet.length; ++p)
						rule = rule && style.add(selector, rules, sheet[p]);
					return rule;
				}
			}

			//  populate the find buffer, so we can determine which style rules we actually need
			find = style.find(selector, sheet);
			for (p in rules)
				if (!(p in find) || normalizeValue(find[p]) !== normalizeValue(rules[p])) {
					pr = hasProperty(p);
					if (pr)
						rule += (rule !== '' ? ';' : '') + cssProperty(pr) + ':' + rules[p];
				}

			//  finally, add the rules to the stylesheet
			if (sheet.addRule)
				return sheet.addRule(selector, rule);
			else if (sheet.insertRule)
				return sheet.insertRule(selector + '{' + rule + '}', sheet.cssRules.length);

			return false;
		};

		/**
		 *  Find all style rules for given selector (in optionally given sheet)
		 *  @name    find
		 *  @type    method
		 *  @access  public
		 *  @param   string selector
		 *  @param   mixed  sheet [optional, either a sheet object or named reference, like 'first', 'last' or file name]
		 *  @return  object style rules
		 */
		style.find = function(selector, sheet) {
			var match = {},
				rules, i, j;

			if (selector)
				selector = normalizeSelector(selector);

			if (!sheet)
				sheet = getStylesheet();
			else if (!(sheet instanceof Array))
				sheet = [sheet];

			for (i = 0; i < sheet.length; ++i) {
				rules = kx.type(sheet[i].cssRules) ? sheet[i].cssRules : sheet[i].rules;
				if (rules && rules.length)
					for (j = 0; j < rules.length; ++j)
						if ('selectorText' in rules[j] && (!selector || normalizeSelector(rules[j].selectorText) === selector))
							match = combine(match, getStyleProperties(rules[j].style.cssText));
			}

			return match;
		};

		/**
		 *  Get the given style property from element
		 *  @name    get
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement element
		 *  @param   string     property
		 *  @param   string     pseudo tag [optional, default undefined - no pseudo tag]
		 *  @return  string     value
		 */
		style.get = function(element, property, pseudo) {
			var value;

			property = hasProperty(property);
			if (property) {
				if (element.currentStyle)
					value = element.currentStyle(scriptProperty(property));
				else if (window.getComputedStyle)
					value = document.defaultView.getComputedStyle(element, pseudo || null).getPropertyValue(cssProperty(property));
			}

			return value;
		};

		/**
		 *  Determine whether or not the property is supported and try a vendor prefix, otherwise return false
		 *  @name    property
		 *  @type    method
		 *  @access  public
		 *  @param   string  property
		 *  @param   DOMNode target [optional, default undefined - document.body]
		 *  @return  mixed  (one of: string (script)property, or false)
		 */
		style.property = hasProperty;

		/**
		 *  Calculate the specificity of a selector
		 *  @name    specificity
		 *  @type    method
		 *  @access  public
		 *  @param   string selector
		 *  @return  string specificity ('0.0.0.0')
		 */
		style.specificity = function(selector) {
			var result = [0, 0, 0, 0],
				match = konflux.string.trim(selector.replace(/([#\.\:\[]+)/g, ' $1')).split(/[^a-z0-9\.\[\]'":\*\.#=_-]+/),
				i;

			for (i = 0; i < match.length; ++i)
				++result[/^#/.test(match[i]) ? 1 : (/^(?:\.|\[|:[^:])/.test(match[i]) ? 2 : 3)];

			return result.join('.');
		};
	}

	/**
	 *  Timing utils
	 *  @module  timing
	 *  @note    available as konflux.timing / kx.timing
	 */
	function KonfluxTiming() {
		/*jshint validthis: true*/
		var timing = this,
			stack = konflux.buffer('timing.delay'),
			raf;

		/**
				 *  Delay object, instances of this are be provided for all KonfluxTimings
				 *  @name    KonfluxDelay
				 *  @type    class
				 *  @access  internal
				 *  @param   function handle
				 *  @param   Number   timeout
				 *  @param   string   reference
				 *  @return  KonfluxDelay  object
				 */
		function KonfluxDelay(handler, timeout, reference) {
			/*jshint validthis: true*/
			var delay = this,
				timer = null;

			/**
			 *  Cancel the timer
			 *  @name    cancel
			 *  @type    function
			 *  @access  internal
			 *  @return  void
			 */
			function cancel() {
				clearTimeout(timer);
			}

			/**
			 *  Start the timer
			 *  @name    start
			 *  @type    function
			 *  @access  internal
			 *  @return  void
			 */
			function start() {
				timer = setTimeout(function() {
					if (!raf)
						raf = konflux.browser.feature('requestAnimationFrame') || function(ready) {
							setTimeout(ready, 16);
						};
					raf(cancel);

					handler.call();
				}, timeout);
			}

			//  expose
			/**
			 *  Cancel the timer
			 *  @name    cancel
			 *  @type    method
			 *  @access  public
			 *  @return  void
			 */
			delay.cancel = cancel;

			/**
			 *  Obtain the associated reference
			 *  @name    reference
			 *  @type    method
			 *  @access  public
			 *  @return  string reference
			 */
			delay.reference = function() {
				return reference;
			};

			start();
		}

		/**
		 *  Remove timer object by their reference
		 *  @name    remove
		 *  @type    function
		 *  @access  internal
		 *  @param   string reference
		 *  @return  void
		 */
		function remove(reference) {
			if ('undefined' !== typeof stack[reference]) {
				//  cancel the stack reference
				stack[reference].cancel();

				//  delete it
				delete stack[reference];
			}
		}

		/**
		 *  Create a timer object to call given handler after given delay and store it with given reference
		 *  @name    create
		 *  @type    function
		 *  @access  internal
		 *  @param   function handle
		 *  @param   Number   delay
		 *  @param   string   reference
		 *  @return  KonfluxDelay  object
		 */
		function create(handler, delay, reference) {
			if (reference)
				remove(reference);
			else
				reference = handler.toString() || konflux.unique();
			stack[reference] = new KonfluxDelay(handler, delay || 0, reference);

			return stack[reference];
		}

		//  expose
		/**
		 *  Remove timer object by their reference
		 *  @name    remove
		 *  @type    method
		 *  @access  public
		 *  @param   string reference
		 *  @return  void
		 */
		timing.remove = remove;

		/**
		 *  Create a timer object to call given handler after given delay and store it with given reference
		 *  @name    create
		 *  @type    method
		 *  @access  public
		 *  @param   function handle
		 *  @param   Number   delay
		 *  @param   string   reference
		 *  @return  KonfluxDelay  object
		 */
		timing.create = create;
	}

	//= include core/observer.js

	/**
	 *  Storage object, a simple wrapper for localStorage
	 *  @module  storage
	 *  @note    available as konflux.storage / kx.storage
	 */
	function KonfluxStorage() {
		/*jshint validthis: true*/
		var ls = this,
			maxSize = 2048,
			storage = konflux.isType('undefined', window.localStorage) ? window.localStorage : false,
			fragmentPattern = /^\[fragment:([0-9]+),([0-9]+),([a-z0-9_]+)\]$/;

		/**
		 *  Combine stored fragments together into the original data string
		 *  @name    combineFragments
		 *  @type    function
		 *  @access  internal
		 *  @param   string data index
		 *  @return  string data combined
		 */
		function combineFragments(data) {
			var match = data ? data.match(fragmentPattern) : false,
				part, fragment, length, variable, i;

			if (match) {
				fragment = parseInt(match[1], 10);
				length   = parseInt(match[2], 10);
				variable = match[3];
				data     = '';

				for (i = 0; i < fragment; ++i) {
					part = storage.getItem(variable + i);
					if (part !== null)
						data += part;
					else
						return false;
				}

				if (!data || data.length !== length)
					return false;
			}

			return data;
		}

		/**
		 *  Split a large data string into several smaller fragments
		 *  @name    createFragments
		 *  @type    function
		 *  @access  internal
		 *  @param   string name
		 *  @param   string data
		 *  @return  bool   success
		 */
		function createFragments(name, data) {
			var variable = '__' + name,
				fragment = Math.ceil(data.length / maxSize),
				i;

			for (i = 0; i < fragment; ++i)
				storage.setItem(variable + i, data.substring(i * maxSize, Math.min((i + 1) * maxSize, data.length)));

			//  write the index
			storage.setItem(name, '[fragment:' + fragment + ',' + data.length + ',' + variable + ']');
		}

		/**
		 *  Remove all fragmented keys
		 *  @name    dropFragments
		 *  @type    function
		 *  @access  internal
		 *  @param   array  match
		 *  @return  void
		 */
		function dropFragments(match) {
			var fragment = parseInt(match[1], 10),
				variable = match[3],
				i;

			for (i = 0; i < fragment; ++i)
				remove(variable + i);
		}

		/**
		 *  Obtain all data from localStorage
		 *  @name    getAll
		 *  @type    function
		 *  @access  internal
		 *  @return  mixed  data
		 */
		function getAll() {
			var result = null,
				i, key;

			if (storage) {
				result = {};
				for (i = 0; i < storage.length; ++i) {
					key = storage.key(i);
					result[key] = getItem(key);
				}
			}

			return result;
		}

		/**
		 *  Obtain the data for given name
		 *  @name    getItem
		 *  @type    function
		 *  @access  internal
		 *  @param   string name
		 *  @return  mixed  data
		 */
		function getItem(name) {
			var data = storage ? storage.getItem(name) : false;

			if (data && data.match(fragmentPattern))
				data = combineFragments(data);

			if (data && data.match(/^[a-z0-9]+:.*$/i)) {
				data = /([a-z0-9]+):(.*)/i.exec(data);
				if (data.length > 2 && data[1] === konflux.string.checksum(data[2]))
					return JSON.parse(data[2]);
			}

			return data ? data : false;
		}

		/**
		 *  Set the data for given name
		 *  @name    setItem
		 *  @type    function
		 *  @access  internal
		 *  @param   string name
		 *  @param   mixed  data
		 *  @return  string data
		 */
		function setItem(name, data) {
			data = JSON.stringify(data);
			data = konflux.string.checksum(data) + ':' + data;

			if (storage)
				return data.length > maxSize ? createFragments(name, data) : storage.setItem(name, data);
			return false;
		}

		/**
		 *  Remove the data for given name
		 *  @name    remove
		 *  @type    function
		 *  @access  internal
		 *  @param   string name
		 *  @return  bool   success
		 */
		function remove(name) {
			var data, match;

			if (storage) {
				data = storage.getItem(name);
				if (data && (match = data.match(fragmentPattern)))
					dropFragments(match);
				return storage.removeItem(name);
			}

			return false;
		}

		/**
		 *  Get the data for given name
		 *  @name    get
		 *  @type    method
		 *  @access  public
		 *  @param   string name [optional, default null - get all stored entries]
		 *  @return  mixed  data
		 */
		ls.get = function(name) {
			return name ? getItem(name) : getAll();
		};

		/**
		 *  Set the data for given name
		 *  @name    set
		 *  @type    method
		 *  @access  public
		 *  @param   string name
		 *  @param   mixed  data
		 *  @return  void
		 */
		ls.set = setItem;

		/**
		 *  Remove the data for given name
		 *  @name    remove
		 *  @type    method
		 *  @access  public
		 *  @param   string name
		 *  @return  bool   success
		 */
		ls.remove = remove;

		/**
		 *  Get the amount of stored keys
		 *  @name    length
		 *  @type    method
		 *  @access  public
		 *  @return  number stored keys
		 */
		ls.length = function() {
			return storage ? storage.length : false;
		};

		/**
		 *  Obtain all the keys
		 *  @name    keys
		 *  @type    method
		 *  @access  public
		 *  @return  Array  keys
		 */
		ls.keys = function() {
			var key = getAll(),
				list = [],
				p;

			for (p in key)
				list.push(p);

			return list;
		};

		/**
		 *  Flush all stored items
		 *  @name    flush
		 *  @type    method
		 *  @access  public
		 *  @return  void
		 */
		ls.flush = function() {
			var list = ls.keys(),
				i;
			for (i = 0; i < list.length; ++i)
				remove(list[i]);
		};

		/**
		 *  Obtain the (approximate) byte size of the entire storage
		 *  @name    size
		 *  @type    method
		 *  @access  public
		 *  @return  int size
		 */
		ls.size = function() {
			return decodeURI(encodeURIComponent(JSON.stringify(localStorage))).length;
		};
	}

	//  expose object instances
	konflux.observer   = new KonfluxObserver();
	konflux.browser    = new KonfluxBrowser();
	konflux.url        = new KonfluxURL();
	konflux.ajax       = new KonfluxAjax();
	konflux.style      = new KonfluxStyle();
	konflux.number     = new KonfluxNumber();
	konflux.string     = new KonfluxString();
	konflux.array      = new KonfluxArray();
	konflux.dom        = new KonfluxDOM();
	konflux.event      = new KonfluxEvent();
	konflux.timing     = new KonfluxTiming();
	konflux.storage    = new KonfluxStorage();

	//  make konflux available on the global (window) scope both as 'konflux' and 'kx'
	window.konflux = window.kx = konflux;
})(window);
