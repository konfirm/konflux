/**
 *       __    Konflux (version 0.2.4, rev 317) - a javascript helper library
 *      /\_\
 *   /\/ / /   Copyright 2012-2013, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */
;(function(window, undefined){
	"use strict";

	var document = window.document,

		//  Private functions

		/**
		 *  Obtain a reference to a specific buffer object, creates one if it does not exist
		 *  @name   buffer
		 *  @type   function
		 *  @access internal
		 *  @param  string object name
		 *  @return object
		 */
		buffer = function(key)
		{
			if (typeof _buffer[key] === 'undefined')
				_buffer[key] = {};
			return _buffer[key];
		},
		/**
		 *  Obtain the milliseconds since the UNIX Epoch (Jan 1, 1970 00:00:00)
		 *  @name   time
		 *  @type   function
		 *  @access internal
		 *  @return int milliseconds
		 */
		time = function()
		{
			return Date.now ? Date.now() : (new Date()).getTime();
		},
		/**
		 *  Shorthand method for creating a combined version of several objects
		 *  @name   combine
		 *  @type   function
		 *  @access internal
		 *  @param  object 1
		 *  @param  object ...
		 *  @param  object N
		 *  @return function constructor
		 */
		combine = function()
		{
			var obj = {},
				i, p;

			for (i = 0; i < arguments.length; ++i)
				if (typeof arguments[i] === 'object')
					for (p in arguments[i])
						obj[p] = arguments[i][p];

			return obj;
		},
		/**
		 *  Shorthand method creating object prototypes
		 *  @name   proto
		 *  @type   function
		 *  @access internal
		 *  @param  function prototype
		 *  @param  object extension
		 *  @return function constructor
		 */
		proto = function(construct, prototype)
		{
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
		 *  @access internal
		 *  @return string formatted time
		 */
		elapsed = function()
		{
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
		 *  @access internal
		 *  @return string key
		 */
		unique = function()
		{
			return (++_count + time() % 86400000).toString(36);
		},
		/**
		 *  Verify whether given argument is empty
		 *  @name   empty
		 *  @type   function
		 *  @access internal
		 *  @param  mixed variable to check
`		 *  @note   The function follows PHP's empty function; null, undefined, 0, '', '0' and false are all considered empty
		 */
		empty = function(p)
		{
			var types = {
					'object':  function(o){if (o instanceof Array)return o.length > 0; for (o in o)return true;return false},
					'boolean': function(b){return b},
					'number':  function(n){return n !== 0},
					'string':  function(s){return !/^0?$/.test(p)}
				};

			if (typeof types[typeof p] === 'function' && types[typeof p](p))
 					return false;
			return true;
		},
		/**
		 *  Determine the type of given variable
		 *  @name   type
		 *  @type   function
		 *  @access internal
		 *  @param  mixed variable
		 *  @return string type
		 */
		type = function(variable)
		{
			return variable instanceof Array ? 'array' : typeof variable;
		},

		//  Private properties
		_buffer  = {}, //  singleton-like container, providing 'static' objects
		_timestamp = time(), //  rough execution start time
		_count = 0,

		konflux
	; //  end var

	function Konflux()
	{
		var kx = this;

		/**
		 *  Return konflux itself
		 *  @name   master
		 *  @type   method
		 *  @access public
		 *  @return object konflux
		 */
		kx.master = function()
		{
			return kx
		};

		/**
		 *  Obtain the milliseconds since the UNIX Epoch (Jan 1, 1970 00:00:00)
		 *  @name   time
		 *  @type   method
		 *  @access public
		 *  @return int milliseconds
		 */
		kx.time = time;

		/**
		 *  Obtain the elapsed time since Konflux started (roughly), using the format: [Nd ] hh:mm:ss.ms
		 *  @name   elapsed
		 *  @type   method
		 *  @access public
		 *  @return string formatted time
		 */
		kx.elapsed = elapsed;

		/**
		 *  Obtain an unique key, the key is guaranteed to be unique within the browser runtime
		 *  @name   unique
		 *  @type   method
		 *  @access public
		 *  @return string key
		 */
		kx.unique = unique;

		/**
		 *  Verify whether given arguments are empty
		 *  @name   empty
		 *  @type   method
		 *  @access public
		 *  @param  mixed variable1
		 *  @param  mixed variableN, ...
		 *  @return bool  variable is empty
		 */
		kx.empty = function()
		{
			var arg = Array.prototype.slice.call(arguments);
			while (arg.length)
				if (!empty(arg.shift()))
					return false;
			return true;
		};

		/**
		 *  Determine the type of given variable
		 *  @name   type
		 *  @type   method
		 *  @access public
		 *  @param  mixed  variable
		 *  @param  bool   object types
		 *  @return string type
		 */
		kx.type = function(variable, objectTypes)
		{
			var result = type(variable),
				name;

			if (result === 'object' && objectTypes)
			{
				name = /(?:function\s+)?(.{1,})\(/i.exec(variable.constructor.toString());
				if (name && name.length > 1)
 					result = name[1];
			}

			return result;
		};
	}
	konflux = new Konflux();


	/**
	 *  Browser/feature detection
	 *  @note  available as konflux.browser / kx.browser
	 */
	function kxBrowser()
	{
		var browser = this,
			ieVersion;

		/**
		 *  Verify if the browser at hand is any version of Internet Explorer (4+)
		 *  @name   detectIE
		 *  @type   function
		 *  @access internal
		 *  @return mixed (boolean false if not IE, version number if IE)
		 */
		function detectIE()
		{
			//  https://gist.github.com/527683 (Conditional comments only work for IE 5 - 9)
			var node = document.createElement('div'),
				check = node.getElementsByTagName('i'),
				version = 0;

			//  Starting with IE 4 (as version is incremented before first use), an <i> element is added to
			//  the 'node' element surrounded by conditional comments. The 'check' variable is automatically updated
			//  to contain all <i> elements. These elements are not there if the browser does not support conditional
			//  comments or does not match the IE version.
			//  Note that there are two conditions for the while loop; the innerHTML filling and the check, the while
			//  loop itself has no body (as it is closed off by a semi-colon right after declaration)
			while (
				node.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->',
				check.length && version < 10
			);
			//  Added IE's @cc_on trickery for browser which do not support conditional comments (such as IE10)
			return version > 4 ? version : Function('/*@cc_on return document.documentMode@*/return false')();
		}

		/**
		 *  Verify if the browser at hand is any version of Internet Explorer (4+)
		 *  @name   ie
		 *  @type   method
		 *  @access public
		 *  @return mixed (boolean false if not IE, version number if IE)
		 *  @see    detectIE
		 *  @note   this public implementation caches the result
		 */
		browser.ie = function()
		{
			if (typeof ieVersion === 'undefined')
				ieVersion = detectIE();
			return ieVersion;
		}
		/**
		 *  Test whether or not the browser at hand is aware of given feature(s) exist in either the window or document scope
		 *  @name   supports
		 *  @type   method
		 *  @access public
		 *  @param  string feature
		 *  @param  string ...
		 *  @return boolean support
		 *  @note   multi features can be provided, in which case the return value indicates the support of all given features
		 */
		browser.supports = function()
		{
			var r = true,
				i = arguments.length;
			while (r && --i >= 0)
				r = r && (typeof window[arguments[i]] !== 'undefined' || typeof document[arguments[i]] !== 'undefined');
			return r;
		}
	}


	/**
	 *  Handle URL's/URI's
	 *  @note  available as konflux.url / kx.url
	 */
	function kxURL()
	{
		var url = this;

		function parse(loc)
		{
			//  URL regex + key processing based on the work of Derek Watson's jsUri (http://code.google.com/p/jsuri/)
			var match = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/.exec(loc),
				prop = ['source', 'protocol', 'domain', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
				result = {};
			while (prop.length)
				result[prop.shift()] = match.length ? match.shift() : '';

			if (result.query)
				result.query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(a, b, c){
					if (typeof result.query !== 'object')
						result.query = {};
					if (b)
						result.query[b] = c;
				});
			return result;
		}

		url.current = window && window.location ? parse(window.location.href) : false;
		url.parse   = parse;
		url.isLocal = function(loc)
		{
			return url.current.domain === url.parse(loc).domain;
		};
	}


	/**
	 *  Style(sheet) manipulation
	 *  @note  available as konflux.style / kx.style
	 */
	function kxStyle()
	{
		var style = this;

		/**
		 *  Obtain the script property notation for given property
		 *  @name   scriptProperty
		 *  @type   function
		 *  @access internal
		 *  @param  string property
		 *  @return string script property
		 *  @note   'background-color' => 'backgroundColor'
		 */
		function scriptProperty(property)
		{
			var n = 0;
			while ((n = property.indexOf('-', n)) >= 0)
				property = property.substr(0, n) + property.charAt(++n).toUpperCase() + property.substring(n + 1);
			return property;
		}

		/**
		 *  Obtain the CSS property notation for given property
		 *  @name   cssProperty
		 *  @type   function
		 *  @access internal
		 *  @param  string property
		 *  @return string CSS property
		 *  @note   'backgroundColor' => 'background-color'
		 */
		function cssProperty(property)
		{
			return property.replace(/([A-Z])/g, '-$1').toLowerCase();
		}

		/**
		 *  Obtain all local stylesheets, where local is determined on a match of the domain
		 *  @name   getLocalStylesheets
		 *  @type   function
		 *  @access internal
		 *  @return Array stylesheets
		 */
		function getLocalStylesheets()
		{
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
		 *  @name   getStylesheet
		 *  @type   function
		 *  @access internal
		 *  @param  string name (optional, default 'all'. Possible values 'first', 'last', 'all' or string filename)
		 *  @param  bool   includeOffset (optional default false, local stylesheets only)
		 *  @return Array stylesheets
		 */
		function getStylesheet(name, includeOffsite)
		{
			var list = includeOffsite ? document.styleSheets : getLocalStylesheets(),
				match = [],
				i;

			switch (name)
			{
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
					if (!name || name === 'all')
						match = list;
					//  search for the stylesheet(s) whose href matches the given name
					else if (list.length > 0)
						for (i = 0; i < list.length; ++i)
						{
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
		 *  @name   findStylesheet
		 *  @type   function
		 *  @access internal
		 *  @param  string url
		 *  @param  string name
		 *  @return StyleSheet (bool false if not found)
		 */
		function findStylesheet(url, name)
		{
			var match = getStylesheet(url, true);
			if (name && match.length === 0)
				match = getStylesheet(name, true);
			return match.length > 0 ? match[0] : false;
		}

		/**
		 *  Create a new stylesheet
		 *  @name   createStylesheet
		 *  @type   function
		 *  @access internal
		 *  @param  string url
		 *  @param  bool   before (effectively true for being the first stylesheet, anything else for last)
		 *  @param  string name
		 *  @return style node
		 */
		function createStylesheet(url, before, name)
		{
			var element = findStylesheet(url, name),
				head = document.head || document.getElementsByTagName('head')[0];

			if (!element)
			{
				element = document.createElement(url ? 'link' : 'style');
				element.setAttribute('type', 'text/css');
				element.setAttribute('title', name || 'konflux.style.' + unique());

				if (/link/i.test(element.nodeName))
				{
					element.setAttribute('rel', 'stylesheet');
					element.setAttribute('href', url);
				}

				if (before && document.head.firstChild)
				{
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
		 *  @name   getStyleProperties
		 *  @type   function
		 *  @access internal
		 *  @param  CSS Rule
		 *  @return Object key value pairs
		 */
		function getStyleProperties(declaration)
		{
			var list = declaration.split(/\s*;\s*/),
				rules = {},
				i, part;

			for (i = 0; i < list.length; ++i)
			{
				part = list[i].split(/\s*:\s*/);
				if (part[0] !== '')
					rules[scriptProperty(part.shift())] = normalizeValue(part.join(':'));
			}

			return rules;
		}

		/**
		 *  Normalize given selector string
		 *  @name   normalizeSelector
		 *  @type   function
		 *  @access internal
		 *  @param  string selector
		 *  @return string normalized selector
		 */
		function normalizeSelector(selector)
		{
			return selector.split(/\s+/).join(' ').toLowerCase();
		}

		/**
		 *  Normalize given CSS value
		 *  @name   normalizeValue
		 *  @type   function
		 *  @access internal
		 *  @param  string value
		 *  @return string normalized value
		 */
		function normalizeValue(value)
		{
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
			if (pattern = value.match(/#([0-9a-f]+)/))
			{
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
		 *  Obtain a stylesheet by its name or by a mnemonic (first, last, all)
		 *  @name   sheet
		 *  @type   method
		 *  @access public
		 *  @param  string target (optional, default 'all'. Possible values 'first', 'last', 'all' or string filename)
		 *  @param  bool   editable (optional, default true)
		 *  @return Array  stylesheets
		 */
		style.sheet = function(target, editable)
		{
			var list = getStylesheet(typeof target === 'string' ? target : null, editable === false ? true : false),
				i;

			if (typeof target.nodeName !== 'undefined')
				for (i = 0; i < list.length; ++i)
					if (list[i].ownerNode === target)
						return [list[i]];

			return list;
		};

		/**
		 *  Create a new stylesheet, either as first or last
		 *  @name   create
		 *  @type   method
		 *  @access public
		 *  @param  bool  before all other stylesheets
		 *  @return styleSheet
		 */
		 style.create = function(name, before)
		 {
		 	return createStylesheet(false, before, name);
		 };

		/**
		 *  Load an external stylesheet, either as first or last
		 *  @name   load
		 *  @type   method
		 *  @access public
		 *  @param  string   url the url of the stylesheet to load
		 *  @param  function callback
		 *  @param  bool     before all other style sheets
		 *  @return style node (<link...> element
		 */
		 style.load = function(url, callback, before)
		 {
		 	var style = createStylesheet(url, before);

			//  if style is a StyleSheet object, it has the ownerNode property containing the actual DOMElement in which it resides
			if (typeof style.ownerNode !== 'undefined')
			{
				style = style.ownerNode;
				//  it is safe to assume here that the stylesheet was loaded, hence we need to apply the callback (with a slight delay, so the order of returning and execution of the callback is the same for both load scenario's)
				if (callback)
					setTimeout(function(){
						callback.apply(style, [style]);
					}, 1);
			}
			else if (callback)
		 	{
				konflux.event.listen(style, 'load', function(e){
					callback.apply(style, [style]);
				});
		 	}
		 	return style;
		 };

		/**
		 *  Determine whether or not the given style (node) is editable
		 *  @name   isEditable
		 *  @type   method
		 *  @access public
		 *  @param  Stylesheet object or DOMelement style/link
		 *  @return bool  editable
		 */
		style.isEditable = function(stylesheet)
		{
			var list = getLocalStylesheets(),
				node = typeof stylesheet.ownerNode !== 'undefined' ? stylesheet.ownerNode : stylesheet,
				i;
			for (i = 0; i < list.length; ++i)
				if (list[i].ownerNode === node)
					return true;
			return false;
		};


		/**
		 *  Create and add a new style rule
		 *  @name   add
		 *  @type   method
		 *  @access public
		 *  @param  string selector
		 *  @param  mixed  rules (one of; object {property: value} or string 'property: value')
		 *  @param  mixed  sheet (either a sheet object or named reference, like 'first', 'last' or file name)
		 *  @return int    index at which the rule was added
		 */
		style.add = function(selector, rules, sheet)
		{
			var rule = '',
				find, p;

			//  make the rules into an object
			if (typeof rules === 'string')
				rules = getStyleProperties(rules);

			//  if rules isn't an object, we exit right here
			if (typeof rules !== 'object')
				return false;

			//  if no sheet was provided, or a string reference to a sheet was provided, resolve it
			if (!sheet || typeof sheet === 'string')
				sheet = getStylesheet(sheet || 'last');

			//  in case we now have a list of stylesheets, we either want one (if there's just one) or we add the style to all
			if (sheet instanceof Array)
			{
				if (sheet.length === 1)
				{
					sheet = sheet[0];
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
				if (typeof find[p] === 'undefined' || normalizeValue(find[p]) !== normalizeValue(rules[p]))
					rule += (rule !== '' ? ';' : '') + cssProperty(p) + ':' + rules[p];

			//  finally, add the rules to the stylesheet
			if (sheet.addRule)
				return sheet.addRule(selector, rule);
			else if (sheet.insertRule)
				return sheet.insertRule(selector + '{' + rule + '}', sheet.cssRules.length);

			return false;
		};

		/**
		 *  Find all style rules for given selector (in optionally given sheet)
		 *  @name   find
		 *  @type   method
		 *  @access public
		 *  @param  string selector
		 *  @param  mixed  sheet (optional, either a sheet object or named reference, like 'first', 'last' or file name)
		 *  @return object style rules
		 */
		style.find = function(selector, sheet)
		{
			var match = {},
				rules, i, j;

			if (selector)
				selector = normalizeSelector(selector);

			if (!sheet)
				sheet = getStylesheet();
			else if (!(sheet instanceof Array))
				sheet = [sheet];

			for (i = 0; i < sheet.length; ++i)
			{
				rules = typeof sheet[i].cssRules ? sheet[i].cssRules : sheet[i].rules;
				if (rules)
					for (j = 0; j < rules.length; ++j)
						if (!selector || normalizeSelector(rules[j].selectorText) === selector)
							match = combine(match, getStyleProperties(rules[j].style.cssText));
			}

			return match;
		};
	}


	/**
	 *  String utils
	 *  @note  available as konflux.string / kx.string
	 */
	function kxString()
	{
		var string = this,
			/**
			 *  Javascript port of Java’s String.hashCode()
			 *  (Based on http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/)
			 *  @name   hashCode
			 *  @type   function
			 *  @access internal
			 *  @param  string input
			 *  @return number hash (32bit integer)
			 */
			hashCode = function(s)
			{
				for (var r = 0, i = 0, l = s.length; i < l; ++i)
					r  = (r = r * 31 + s.charCodeAt(i)) & r;
				return r;
			},
			/**
			 *  Create a hash from a string
			 *  @name   hash
			 *  @type   function
			 *  @access internal
			 *  @param  string source
			 *  @return string hash
			 */
			hash = function(s)
			{
				var p = 8,
					pad = ('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' + s).substr(-(Math.ceil((s.length || 1) / p) * p)),
					r = 0;
				while (pad.length)
				{
					r  += hashCode(pad.substr(0, p));
					pad = pad.substr(p);
				}
				return Math.abs(r).toString(36);
			},
			/**
			 *  Return the ASCII value of given character
			 *  @name   ord
			 *  @type   function
			 *  @access internal
			 *  @param  string character
			 *  @return number character code
			 */
			ord = function(s)
			{
				return s.charCodeAt(0);
			},
			/**
			 *  Return the character corresponding with given ASCII value
			 *  @name   chr
			 *  @type   function
			 *  @access internal
			 *  @param  number character code
			 *  @return string character
			 */
			chr = function(n)
			{
				return String.fromCharCode(n);
			},
			/**
			 *  Pad a string
			 *  @name   pad
			 *  @type   function
			 *  @access internal
			 *  @param  string to pad
			 *  @param  number length
			 *  @param  string pad string (optional, default ' ')
			 *  @param  int pad type (optional, default PAD_RIGHT)
			 *  @return padded string
			 */
			pad = function(s, n, c, t)
			{
				c = Array(n).join(c);
				return (n -= s.length) > 0 && (t = t === string.PAD_LEFT ? n : (t === string.PAD_BOTH ? Math.ceil(n / 2): 0)) !== false
					? (t > 0 ? c.substr(0, 1 + t) : '') + s + c.substr(0, 1 + n - t)
					: s;
			},
			/**
			 *  Generate a checksum for given string
			 *  @name   checksum
			 *  @type   function
			 *  @access internal
			 *  @param  string source
			 *  @return string checksum
			 */
			checksum = function(s)
			{
				for (var n = s.length, r = 0; n > 0; r += n * ord(s[--n]));
				return Math.abs((r + '' + s.length) | 0).toString(36);
			},
			/**
			 *  Generate a UUID
			 *  @name   uuid
			 *  @type   function
			 *  @access internal
			 *  @return string uuid
			 */
			uuid = function()
			{
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
					var r = Math.random() * 16 | 0;
					return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
				});
			};

		//  'constants'
		string.PAD_LEFT  = 1;
		string.PAD_BOTH  = 2;
		string.PAD_RIGHT = 3;

		/**
		 *  Trim string from leading/trailing whitespace
		 *  @name   trim
		 *  @type   method
		 *  @access public
		 *  @param  string to trim
		 *  @return trimmed string
		 */
		string.trim = function(s)
		{
			var	r = s.replace(/^\s\s*/, ''),
				x = /\s/,
				i = r.length;
			while (x.test(r.charAt(--i)));
			return r.slice(0, i + 1);
		};
		/**
		 *  Reverse given string
		 *  @name   reverse
		 *  @type   method
		 *  @access public
		 *  @param  string to reverse
		 *  @return reversed string
		 */
		string.reverse = function(s)
		{
			for (var n = s.length, r = ''; n > 0; r += s[--n]);
			return r;
		};
		/**
		 *  Pad a string
		 *  @name   pad
		 *  @type   method
		 *  @access public
		 *  @param  string to pad
		 *  @param  number length
		 *  @param  string pad string (optional, default ' ')
		 *  @param  int pad type (optional, default PAD_RIGHT)
		 *  @return padded string
		 */
		string.pad = function(s, n, c, t)
		{
			return pad(s, n, c || ' ', t || string.PAD_RIGHT);
		};
		/**
		 *  Create a hash from a string
		 *  @name   hash
		 *  @type   method
		 *  @access public
		 *  @param  string source
		 *  @return string hash
		 */
		string.hash = function(s)
		{
			return hash(s);
		};
		/**
		 *  Generate a checksum for given string
		 *  @name   checksum
		 *  @type   method
		 *  @access public
		 *  @param  string source
		 *  @return string checksum
		 */
		string.checksum = checksum;
		/**
		 *  Generate a UUID
		 *  @name   uuid
		 *  @type   method
		 *  @access public
		 *  @return string uuid
		 */
		string.uuid = uuid;
	}


	/**
	 *  Array utils
	 *  @note  available as konflux.array / kx.array
	 */
	function kxArray()
	{
		var array = this,
			/**
			 *  Create a hash from a string
			 *  @name   contains
			 *  @type   function
			 *  @access internal
			 *  @param  array haystack
			 *  @param  mixed value
			 *  @return boolean contains
			 */
			contains = function(a, v)
			{
				for (var i = 0; i < a.length; ++i)
					if (a[i] === v)
						return true;
				return false;
			},
			/**
			 *  Return the difference between two arrays
			 *  @name   diff
			 *  @type   function
			 *  @access internal
			 *  @param  array array1
			 *  @param  array array2
			 *  @return array difference
			 */
			diff = function(a, b)
			{
				var ret = [],
					i;
				for (i = 0; i < a.length; ++i)
					if (!contains(b, a[i]))
						ret.push(a[i]);
				return ret;
			},
			/**
			 *  Create an array with values between (including) given start and end
			 *  @name   range
			 *  @type   function
			 *  @access internal
			 *  @param  number start
			 *  @param  number end
			 *  @return array range
			 */
			range = function(a, b)
			{
				var r = [];
				b -= a;
				while (r.length <= b)
					r.push(a + r.length);
				return r;
			},
			/**
			 *  Shuffle given array
			 *  @name   shuffle
			 *  @type   function
			 *  @access internal
			 *  @param  array source
			 *  @return array shuffled
			 */
			shuffle = function(a)
			{
				for (var j, x, i = a.length; i; j = parseInt(Math.random() * i), x = a[--i], a[i] = a[j], a[j] = x);
				return a;
			};


		//  expose
		/**
		 *  Create a hash from a string
		 *  @name   hash
		 *  @type   method
		 *  @access public
		 *  @param  array haystack
		 *  @param  mixed value
		 *  @return boolean contains
		 */
		array.contains = contains;
		/**
		 *  Return the difference between two arrays
		 *  @name   diff
		 *  @type   function
		 *  @access internal
		 *  @param  array array1
		 *  @param  array array2
		 *  @return array difference
		 */
		array.diff = diff;
		/**
		 *  Create an array with values between (including) given start and end
		 *  @name   range
		 *  @type   method
		 *  @access public
		 *  @param  number start
		 *  @param  number end
		 *  @return array range
		 */
		array.range = range;
		/**
		 *  Shuffle given array
		 *  @type   method
		 *  @access public
		 *  @access internal
		 *  @param  array source
		 *  @return array shuffled
		 */
		array.shuffle = shuffle;
	}


	/**
	 *  Event attachment handler
	 *  @note  available as konflux.event / kx.event
	 */
	function kxEvent()
	{
		var event = this,
			queue = buffer('event.queue'),

			/**
			 *  Ready state handler, removes all relevant triggers and executes any handler that is set
			 *  @name   ready
			 *  @type   function
			 *  @access internal
			 *  @return void
			 */
			ready = function(e){
				var run = false,
					p;

				if (document.removeEventListener)
				{
					document.removeEventListener('DOMContentLoaded', ready, false);
					window.removeEventListener('load', ready, false);
					run = true;
				}
				else if (document.readyState === 'complete')
				{
					document.detachEvent('onreadystate', ready);
					window.detachEvent('onload', ready);
					run = true;
				}

				if (run && queue.ready)
					for (p in queue.ready)
						queue.ready[p].call(e);
			},
			/**
			 *  Unify the event object, which makes event more consistent across browsers
			 *  @name   unifyEvent
			 *  @type   function
			 *  @access internal
			 *  @return Event object
			 */
			unifyEvent = function(e)
			{
				var evt = e || window.event;
				if (typeof evt.target === 'undefined')
					evt.target = typeof evt.srcElement !== 'undefined' ? evt.srcElement : null;

				if (/^mouse[a-z]+|drag[a-z]+|drop$/i.test(evt.type))
				{
					evt.mouse = new kxPoint(
						evt.pageX ? evt.pageX : (evt.clientX ? evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft : 0),
						evt.pageY ? evt.pageY : (evt.clientY ? evt.clientY + document.body.scrollTop + document.documentElement.scrollTop : 0)
					);
				}
				return evt;
			};

		/**
		 *  A custom DOMReady handler
		 *  @name   add
		 *  @type   method
		 *  @access public
		 *  @param  function handler
		 *  @return void
		 */
		event.ready = function(handler){
			//  the document is ready already
			if (document.readyState === 'complete')
				return setTimeout(handler, 1); // make sure we run the 'event' asynchronously

			//  we cannot use the event.listen method, as we need very different event listeners
			if (typeof queue.ready === 'undefined')
			{
				queue.ready = [];
				if (document.addEventListener)
				{
					//  prefer the 'DOM ready' event
					document.addEventListener('DOMContentLoaded', ready, false);
					//  failsafe to window.onload
					window.addEventListener('load', ready, false);
				}
				else
				{
					//  the closest we can get to 'DOMContentLoaded' in IE, this is still prior to onload
					document.attachEvent('onreadystatechange', ready);
					//  again the failsafe, now IE style
					window.attachEvent('onload', ready);
				}
			}
			queue.ready.push(handler);
		};

		/**
		 *  Add event listeners to target
		 *  @name   listen
		 *  @type   method
		 *  @access public
		 *  @param  DOMElement target
		 *  @param  string event type
		 *  @param  function handler
		 *  @return bool success
		 */
		event.listen = function(target, type, handler){
			var delegate = function(e){handler.apply(target, [unifyEvent(e)])},
				list = typeof type === 'string' ? type.split(',') : type,
				i;

			for (i = 0; i < list.length; ++i)
			{
				if (target.addEventListener)
					target.addEventListener(list[i], delegate, false);
				else if (target.attachEvent)
					target.attachEvent('on' + list[i], delegate);
				else
					target['on' + list[i]] = delegate;
			}

			return event;
		};
	}


	/**
	 *  Timing utils
	 *  @note  available as konflux.timing / kx.timing
	 *  @TODO  documentation (honestly... what DOES this do??)
	 */
	function kxTiming()
	{
		function kxDelay(handler, timeout, reference){
			var delay = this,
				timer = null,
				cancel = function(){
					clearTimeout(timer);
				},
				start = function(){
					timer = setTimeout(function(){cancel();handler.call();}, timeout);
				};

			delay.cancel = function()
			{
				cancel();
			};

			start();
		}


		var timing = this,
			stack = buffer('timing.delay'),
			remove = function(reference){
				if (typeof stack[reference] !== 'undefined')
				{
					//  cancel the stack reference
					stack[reference].cancel();
					//  delete it
					delete stack[reference];
				}
			},
			create = function(handler, delay, reference){
				if (reference)
					remove(reference);
				else
					reference = handler.toString() || unique();
				return stack[reference] = new kxDelay(handler, delay, reference);
			};

 		timing.remove = remove;
 		timing.create = create;
	}


	/**
	 *  Observer object, handles subscriptions to messages
	 *  @note  available as konflux.observer / kx.observer
	 */
	function kxObserver()
	{
		var observer = this,
			subscription = buffer('observer.subscriptions'),
			active = buffer('observer.active'),

			/**
			 *  Create the subscription stack if it does not exist
			 *  @name   ensureSubscriptionStack
			 *  @type   function
			 *  @access internal
			 *  @param  string stack name
			 *  @return void
			 */
			ensureSubscriptionStack = function(s)
			{
				if (typeof subscription[s] === 'undefined') subscription[s] = [];
			},
			/**
			 *  Add handler to specified stack
			 *  @name   add
			 *  @type   function
			 *  @access internal
			 *  @param  string stack name
			 *  @param  function handler
			 *  @return int total number of subscriptions in this stack
			 */
			add = function(s, f)
			{
				ensureSubscriptionStack(s);
				return subscription[s].push(f);
			},
			/**
			 *  Disable a handler for specified stack
			 *  @name   disable
			 *  @type   function
			 *  @access internal
			 *  @param  string stack name
			 *  @param  function handler
			 *  @return void
			 *  @note   this method is used from the Observation object, which would influence the number of
			 *          subscriptions if the subscription itself was removed immediately
			 */
			disable = function(s, f)
			{
				for (var i = 0; i < subscription[s].length; ++i)
					if (subscription[s][i] === f)
						subscription[s][i] = false;
			},
			/**
			 *  Remove specified handler (and all disabled handlers) from specified stack
			 *  @name   remove
			 *  @type   function
			 *  @access internal
			 *  @param  string stack name
			 *  @param  function handler (optional)
			 *  @return array removed handlers
			 */
			remove = function(s, f)
			{
				var r = [], n = [], i;
				ensureSubscriptionStack(s);
				for (i = 0; i < subscription[s].length; ++i)
					(!subscription[s][i] || subscription[s][i] === f ? r : n).push(subscription[s][i]);
				subscription[s] = n;
				return r;
			},
			/**
			 *  Flush specified stack
			 *  @name   flush
			 *  @type   function
			 *  @access internal
			 *  @param  string stack name
			 *  @return array removed handlers (false if the stack did not exist);
			 */
			flush = function(s)
			{
				var r = false;
				if (typeof subscription[s] !== 'undefined')
				{
					r = subscription[s];
					delete subscription[s];
				}
				return r;
			},
			/**
			 *  Trigger the handlers in specified stack
			 *  @name   trigger
			 *  @type   function
			 *  @access internal
			 *  @param  string stack name
			 *  @param  mixed  arg1 ... argN
			 *  @return void
			 */
			trigger = function(s)
			{
				var arg = Array.prototype.slice.call(arguments),
					ref = unique(),
					part = s.split('.'),
					wildcard = false,
					name, i;

				while (part.length >= 0)
				{
					active[ref] = true;
					name = part.join('.') + (wildcard ? (part.length ? '.' : '') + '*' : '');
					wildcard = true;

					if (typeof subscription[name] !== 'undefined')
						for (i = 0; i < subscription[name].length; ++i)
						{
							if (!active[ref])
								break;
							if (subscription[name][i])
							{
								arg[0] = new kxObservation(s, subscription[name][i], ref);
								subscription[name][i].apply(subscription[name][i], arg);
							}
						}

					if (!part.pop())
						break;
				}
				delete active[ref];
			};

		/**
		 *  Observation object, instances of this are be provided to all observer notification subscribers
		 *  @name   kxObservation
		 *  @type   class
		 *  @access internal
		 *  @param  string type
		 *  @param  function handle
		 *  @param  string reference
		 *  @return kxObservation object
		 */
		function kxObservation(type, handle, reference)
		{
			var observation = this;

			observation.type      = type;
			observation.reference = reference;
			observation.timeStamp = time();
			observation.timeDelta = elapsed();

			/**
			 *  Unsubscribe from the current observer stack
			 *  @name   unsubscribe
			 *  @type   function
			 *  @access public
			 *  @return void
			 */
			observation.unsubscribe = function()
			{
				return disable(type, handle);
			};
			/**
			 *  Stop the execution of this Observation
			 *  @name   stop
			 *  @type   function
			 *  @access public
			 *  @return void
			 */
			observation.stop = function()
			{
				active[reference] = false;
			};
		};

		/**
		 *  Subscribe a handler to an observer stack
		 *  @name   subscribe
		 *  @type   method
		 *  @access public
		 *  @param  string stack name
		 *  @param  function handle
		 *  @return bool success
		 */
		observer.subscribe = function subscribe(stack, handle)
		{
			var list = stack.split(','),
				result = true,
				i;
			for (i = 0; i < list.length; ++i)
				result = (add(list[i], handle) ? true : false) && result;
			return result;
		};

		/**
		 *  Unsubscribe a handler from an observer stack
		 *  @name   unsubscribe
		 *  @type   method
		 *  @access public
		 *  @param  string stack name
		 *  @param  function handle
		 *  @return array removed handlers
		 */
		observer.unsubscribe = function unsubscribe(stack, handle)
		{
			var list = stack.split(','),
				result = [],
				i;
			for (i = 0; i < list.length; ++i)
				result = result.concat(handle ? remove(list[i], handle) : flush(list[i]));
			return result;
		};

		/**
		 *  Notify all subscribers to a stack
		 *  @name   subscribe
		 *  @type   method
		 *  @access public
		 *  @param  string stack name
		 *  @param  mixed  arg1 ... argN
		 *  @return void
		 */
		observer.notify = function notify()
		{
			return trigger.apply(observer, arguments);
		};
	}


	/**
	 *  Breakpoint object, add/remove classes on specified object (or body) when specific browser dimensions are met
	 *  (triggers observations when viewport dimensions change)
	 *  @note  available as konflux.breakpoint / kx.breakpoint
	 */
	function kxBreakpoint()
	{
		var breakpoint = this,
			dimensionStack = buffer('breakpoint.dimension'),
			ratioStack = buffer('breakpoint.ratio'),
			current = null,
			timer = null,
			ratioTimer = null,

			/**
			 *  Handle browser window resize events, matching the most appropriate size
			 *  @name   _resize
			 *  @type   function
			 *  @access internal
			 *  @param  event
			 *  @return void
			 */
			resize = function(e)
			{
				var dimension = match(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);

				//  if we don't have any valid dimension or the dimension is equal to the current one, stop
				if (!dimension || current === dimension)
					return false;

				//  is there a current set, remove it
				if (current)
					current.element.className = current.element.className.replace(current.expression, '');

				//  do we have an element to manipulate
				if (!dimension.element)
					dimension.element = document.body;

				//  set the given class on the element
				dimension.element.className = konflux.string.trim(dimension.element.className + ' ' + dimension.className);
				konflux.observer.notify('breakpoint.change', dimension.className);

				current = dimension;
			},
			/**
			 *  Determine the best matching dimension and return the settings
			 *  @name   match
			 *  @type   function
			 *  @access internal
			 *  @param  int browser width
			 *  @return object config
			 */
			match = function(width){
				var found, delta, min, p;
				for (p in dimensionStack)
				{
					min = !min ? p : Math.min(min, p);
					if (p < width && (!delta || width - p < delta))
					{
						found = p;
						delta = width - p;
					}
				}
				return dimensionStack[found] || dimensionStack[min] || false;
			},
			/**
			 *  Determine the best matching pixel ratio and set the defined classes
			 *  @name   pixelRatio
			 *  @type   function
			 *  @access internal
			 *  @return void
			 */
			pixelRatio = function(){
				var ratio = typeof window.devicePixelRatio !== 'undefined' ? window.devicePixelRatio : 1;
				if (typeof ratioStack[ratio] !== 'undefined')
					ratioStack[ratio].element.className = konflux.string.trim(ratioStack[ratio].element.className) + ' ' + ratioStack[ratio].className;
			};

		/**
		 *  Add breakpoint configuration
		 *  @name   add
		 *  @type   function
		 *  @access public
		 *  @param  int width
		 *  @param  string classname
		 *  @param  DOMElement target (defaults to 'body')
		 *  @return breakpoint object
		 *  @note   when a breakpoint is added, the _resize handler will be triggered with a slight delay,
		 *          so if a suitable breakpoint is added it will be used immediately but _resize will occur only once.
		 *          This ought to prevent FOUC
		 */
		breakpoint.add = function(width, className, target)
		{
			clearTimeout(timer);
			dimensionStack[width] = {
				expression: new RegExp('\s*' + className + '\s*', 'g'),
				className: className,
				element: target
			};
			timer = setTimeout(function(){resize()}, 1);
			return breakpoint;
		};

		/**
		 *  Add pixel ratio configuration
		 *  @name   ratio
		 *  @type   function
		 *  @access public
		 *  @param  int ratio
		 *  @param  string classname
		 *  @param  DOMElement target (defaults to 'body')
		 *  @return breakpoint object
		 *  @note   as the ratio does not change, the best matching ratio will be added once
		 */
		breakpoint.ratio = function(ratio, className, target)
		{
			clearTimeout(ratioTimer);
			ratioStack[ratio] = {
				expression: new RegExp('\s*' + className + '\s*', 'g'),
				className: className,
				element: target || document.body
			};
			ratioTimer = setTimeout(function(){pixelRatio()}, 1);
			return breakpoint;
		};

		//  listen to the resize event
		konflux.event.listen(window, 'resize', resize);
	}


	/**
	 *  Point object, handling the (heavy) lifting of working with points
	 *  @note  available as konflux.point / kx.point
	 *  @TODO  documentation
	 */
	function kxPoint(x, y)
	{
		var point = this;
		point.x = x || 0;
		point.y = y || 0;

		/**
		 *  Move the point object by given x and y
		 *  @name   move
		 *  @type   method
		 *  @access public
		 *  @param  number x
		 *  @param  number y
		 *  @return void
		 */
		point.move = function(x, y)
		{
			point.x += x;
			point.y += y;
		};

		/**
		 *  Scale the points coordinates by given factor
		 *  @name   scale
		 *  @type   method
		 *  @access public
		 *  @param  number factor
		 *  @return void
		 */
		point.scale = function(factor)
		{
			point.x *= factor;
			point.y *= factor;
		};

		/**
		 *  Subtract a point for the current point
		 *  @name   subtract
		 *  @type   method
		 *  @access public
		 *  @param  object point
		 *  @return kxPoint
		 */
		point.subtract = function(p)
		{
			return new kxPoint(point.x - p.x, point.y - p.y);
		};

		/**
		 *  Add a point to the current point
		 *  @name   add
		 *  @type   method
		 *  @access public
		 *  @param  object point
		 *  @return kxPoint
		 */
		point.add = function(p)
		{
			return new kxPoint(pint.x + p.x, point.y + p.y);
		};

		/**
		 *  Get the distance between given and current point
		 *  @name   distance
		 *  @type   method
		 *  @access public
		 *  @param  object point
		 *  @return number distance
		 */
		point.distance = function(p)
		{
			return Math.sqrt(Math.pow(Math.abs(point.x - p.x), 2) + Math.pow(Math.abs(point.y - p.y), 2));
		};

		/**
		 *  Get the angle in radians between given and current point
		 *  @name   angle
		 *  @type   method
		 *  @access public
		 *  @param  object point
		 *  @return number angle
		 */
		point.angle = function(p)
		{
			return Math.atan2(point.x - p.x, point.y - p.y);
		};
	}


	/**
	 *  Cookie object, making working with cookies a wee bit easier
	 *  @note  available as konflux.cookie / kx.cookie
	 */
	function kxCookie()
	{
		var cookie = this,
			jar = {},
			/**
			 *  Read the available cookie information and populate the jar variable
			 *  @name   init
			 *  @type   function
			 *  @access internal
			 *  @return void
			 */
			init = function()
			{
				var part = document.cookie.split(';'),
					data;

				while (part.length)
				{
					data = part.shift().split('=');
					jar[konflux.string.trim(data.shift())] = konflux.string.trim(data.join('='));
				}
			},
			/**
			 *  Set a cookie
			 *  @name   setCookie
			 *  @type   function
			 *  @access internal
			 *  @param  string key
			 *  @param  string value
			 *  @param  int    expire [optional, default expire at the end of the session]
			 *  @param  string path   [optional, default the current path]
			 *  @param  string domain [optional, default the current domain]
			 *  @return void
			 *  @note   the syntax of setCookie is compatible with that of PHP's setCookie
			 *          this means that setting an empty value (string '' | null | false) or
			 *          an expiry time in the past, the cookie will be removed
			 */
			setCookie = function(key, value, expire, path, domain)
			{
				var pairs = [key + '=' + (typeof value === 'number' ? value : value || '')],
					date;

				if (pairs[0].substr(-1) === '=')
					expire = -1;

				if (typeof expire !== 'undefined' && expire)
					date = new Date(expire);

				if (date)
				{
					if (date < (new Date()).getTime() && typeof jar[key] !== 'undefined')
						delete jar[key];
					pairs.push('expires=' + date);
				}
				if (typeof path !== 'undefined' && path)
					pairs.push('path=' + path);
				if (typeof domain !== 'undefined' && domain)
					pairs.push('domain=' + domain);

				document.cookie = pairs.join(';');
				if (document.cookie.indexOf(pairs.shift()) >= 0)
					jar[key] = value + '';
			},
			/**
			 *  Obtain a cookie value
			 *  @name   getCookie
			 *  @type   function
			 *  @access internal
			 *  @param  string key
			 *  @return void
			 */
			getCookie = function(key)
			{
				return typeof jar[key] !== 'undefined' ? jar[key] : null;
			};


		/**
		 *  Get and/or set cookies
		 *  @name   value
		 *  @type   function
		 *  @access internal
		 *  @param  string key    [optional, an object containing all cookies is returned id omitted]
		 *  @param  string value  [optional, if no value is given the current value will be returned]
		 *  @param  int    expire [optional, default expire at the end of the session]
		 *  @param  string path   [optional, default the current path]
		 *  @param  string domain [optional, default the current domain]
		 *  @return void
		 */
		cookie.value = function(key, value, expire, path, domain)
		{
			if (typeof key === 'undefined')
				return jar;

			//  if a second argument (value) was given, we update the cookie
			if (arguments.length >= 2)
				setCookie(key, value, expire, path, domain);

			return getCookie(key);
		}

		init();
	}


	/**
	 *  Storage object, a simple wrapper for localStorage
	 *  @note  available as konflux.storage / kx.storage
	 */
	function kxStorage()
	{
		var ls = this,
			maxSize = 2048,
			storage = typeof window.localStorage !== 'undefined' ? window.localStorage : false;

		/**
		 *  Combine stored fragments together into the original data string
		 *  @name   combineFragments
		 *  @type   function
		 *  @access internal
		 *  @param  string data index
		 *  @return string data combined
		 */
		function combineFragments(data)
		{
			var match, part, fragment, length, variable, i;

			if (data && (match = data.match(/^\[fragment:([0-9]+),([0-9]+),([a-z_]+)\]$/)))
			{
				fragment = parseInt(match[1]);
				length   = parseInt(match[2]);
				variable = match[3];
				data     = '';

				for (i = 0; i < fragment; ++i)
				{
					part = storage.getItem(variable + i);
					if (part !== null)
						data += part;
					else
						return false;
				}

				if (!data || data.length != length)
					return false;
			}
			return data;
		}

		/**
		 *  Split a large data string into several smaller fragments
		 *  @name   createFragments
		 *  @type   function
		 *  @access internal
		 *  @param  string name
		 *  @param  string data
		 *  @return bool   success
		 */
		function createFragments(name, data)
		{
			var variable = '__' + name,
				fragment = Math.ceil(data.length / maxSize),
				success  = storage.setItem(name, '[fragment:' + fragment + ',' + data.length + ',' + variable + ']'),
				i;

			for (i = 0; i < fragment; ++i)
				success = success && storage.setItem(variable + i, data.substring(i * maxSize, Math.min(i * maxSize + maxSize, data.length)));

			return success;
		}

		/**
		 *  Remove all fragmented keys
		 *  @name   dropFragments
		 *  @type   function
		 *  @access internal
		 *  @param  array  match
		 *  @return void
		 */
		function dropFragments(match)
		{
			var fragment = parseInt(match[1]),
				variable = match[3],
				i;

			for (i = 0; i < fragment; ++i)
				drop(variable + i);
		}

		/**
		 *  Obtain the data for given name
		 *  @name   getItem
		 *  @type   function
		 *  @access internal
		 *  @param  string name
		 *  @return mixed  data
		 */
		function getItem(name)
		{
			var data = storage ? storage.getItem(name) : false,
				checksum;

			if (data && data.match(/^\[fragment:([0-9]+),([0-9]+),([a-z_]+)\]$/))
				data = combineFragments(data);

			data = /([a-z0-9]+):(.*)/i.exec(data);
			if (data.length > 2 && data[1] === konflux.string.checksum(data[2]))
				return JSON.parse(data[2]);

			return false;
		}

		/**
		 *  Set the data for given name
		 *  @name   setItem
		 *  @type   function
		 *  @access internal
		 *  @param  string name
		 *  @param  mixed  data
		 *  @return string data
		 */
		function setItem(name, data)
		{
			data = JSON.stringify(data);
			data = konflux.string.checksum(data) + ':' + data;

			if (storage)
				return data.length > maxSize ? createFragments(name, data) : storage.setItem(name, data);
			return false;
		}

		/**
		 *  Drop the data for given name
		 *  @name   drop
		 *  @type   function
		 *  @access internal
		 *  @param  string name
		 *  @return bool   success
		 */
		function drop(name)
		{
			var data, match;

			if (storage)
			{
				data = storage.getItem(name);
				if (data && (match = data.match(/^\[fragment:([0-9]+),([0-9]+),([a-z_]+)\]$/)))
					dropFragments(match);
				return storage.removeItem(name);
			}
			return false;
		}


		/**
		 *  Get the data for given name
		 *  @name   get
		 *  @type   method
		 *  @access public
		 *  @param  string name
		 *  @return mixed  data
		 */
		ls.get = getItem;

		/**
		 *  Set the data for given name
		 *  @name   set
		 *  @type   method
		 *  @access public
		 *  @param  string name
		 *  @param  mixed  data
		 *  @return void
		 */
		ls.set = setItem;

		/**
		 *  Remove the data for given name
		 *  @name   remove
		 *  @type   method
		 *  @access public
		 *  @param  string name
		 *  @return bool   success
		 */
		ls.remove = drop;
	}


	/**
	 *  Canvas object, allowing for chainable access to canvas methods
	 *  @note  available as konflux.canvas / kx.canvas
	 *  @TODO  documentation
	 */
	function kxCanvas()
	{
		var canvas = this;

		function kxCanvasContext(canvas)
		{
			var context = this;

				function init()
				{
					var property = {
							globalAlpha: 1,
							globalCompositeOperation: 'source-over',  //  source-over, source-in, source-out, source-atop, destination-over, destination-in, destination-out, destination-atop, lighter, copy, xor
							height: null, //  readonly
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
					context.ctx2d = canvas.getContext('2d');

					//  relay all methods
					for (p in context.ctx2d)
						if (typeof context.ctx2d[p] === 'function')
							context[p] = relayMethod(context.ctx2d[p]);

					//  relay all properties (as we want chainability)
					for (p in property)
					{
						context[p] = relayProperty(p);
						context[p](property[p]);
					}
				}

				function relayMethod(f)
				{
					return function(){
						f.apply(context.ctx2d, arguments);
						return context;
					};
				}

				function relayProperty(key)
				{
					return function(value){
						if (typeof value === 'undefined')
							return context.ctx2d[key];
						context.ctx2d[key] = value;
						return context;
					};
				}

				function gradientFill(gradient, color)
				{
					var p;
					for (p in color)
						gradient.addColorStop(p, color[p]);

					context.fillStyle(gradient);
					context.fill();

					return context;
				}

				context.data = function(data)
				{
					var image;
					if (data)
					{
						image = new Image();
						image.src = data;
						context.ctx2d.clearRect(0, 0, canvas.width, canvas.height);
						context.drawImage(image, 0, 0);
						return context;
					}
					return canvas.toDataURL();
				};

				context.append = function(target)
				{
					if (typeof target === 'string')
						target = document.getElementById(target);

					if (typeof target === 'object')
						return target.appendChild(canvas) ? context : false;

					return false;
				};

				context.shadow = function(x, y, blur, color)
				{
					if (typeof x === 'number')
						context.shadowOffsetX(x);
					if (typeof y === 'number')
						context.shadowOffsetY(y);
					if (typeof blur === 'number')
						context.shadowBlur(blur);
					if (typeof color !== 'undefined')
						context.shadowColor(color);

					return context;
				};

				context.colorFill = function(color)
				{
					if (color)
						context.fillStyle(color);
					context.fill();
					return context;
				};

				context.strokeStyle = function(color, width, cap)
				{
					if (color)
						context.strokeStyle(color);
					if (width)
						context.lineWidth(width);
					if (cap)
						context.lineCap(cap);

					context.stroke();
					return context;
				};

				context.radialGradientFill = function(a, ar, b, br, color)
				{
					return gradientFill(context.ctx2d.createRadialGradient(a.x, a.y, ar, b.x, b.y, br), color);
				};

				context.linearGradientFill = function(a, b, color)
				{
					return gradientFill(context.ctx2d.createLinearGradient(a.x, a.y, b.x, b.y), color);
				};

				context.circle = function(x, y, radius)
				{
					context.beginPath();
					context.arc(x, y, radius, 0, Math.PI * 2, 1);
					context.closePath();

					return context;
				};

				context.line = function()
				{
					var len = arguments.length,
						i;
					context.beginPath();
					for (i = 0; i < len; ++i)
						if (i == len - 1 && arguments[i].x === arguments[0].x && arguments[i].y === arguments[0].y)
							context.closePath();
						else
							context[i == 0 ? 'moveTo' : 'lineTo'](arguments[i].x, arguments[i].y);
					context.stroke();
					return context;
				};


			init();
		}


		canvas.create = function(width, height)
		{
			var object = document.createElement('canvas');
			object.setAttribute('width', width);
			object.setAttribute('height', height);

			return canvas.init(object);
		};
		canvas.init = function(object)
		{
			return new kxCanvasContext(object);
		};
		canvas.append = function(target, mixed)
		{
			if (typeof mixed === 'number')
				mixed = canvas.create(arguments[1], arguments[2]);

			if (mixed instanceof kxCanvasContext)
				return mixed.append(target);
			return false;
		};
	}


	/**
	 *  Logo object, creates the konflux logo on canvas
	 *  @note  available as konflux.logo / kx.logo
	 *  @TODO  documentation
	 */
	function kxLogo()
	{
		var logo = this,
			P = function(x, y){
				return new konflux.point(x, y);
			},
			design = {
				konfirm: [
					{line:[P(3, 44), P(2, 35), P(41, 66), P(96, 22), P(94, 31), P(41, 75), P(3, 44)],fillStyle:['rgb(25,25,25)'],fill:[]},
					{line:[P(77, 0), P(41, 25), P(21, 12), P(0, 25), P(2, 35), P(41, 66), P(96, 22), P(99, 12), P(77, 0)],fillStyle:['rgb(7,221,246)'],fill:[]},
					{globalAlpha:[.2],line:[P(0, 25), P(2, 35), P(41, 66), P(96, 22), P(99, 12), P(41, 56), P(0, 25)],fillStyle:['rgb(0, 0, 0)'],fill:[]}
				]
			},
			render = function(dsgn){
				var c, p, i;
				dsgn = dsgn || 'konfirm';

				if (typeof design[dsgn] !== 'undefined')
				{
					c = konflux.canvas.create(100, 75);
					for (i = 0; i < design[dsgn].length; ++i)
						for (p in design[dsgn][i])
							c[p].apply(null, design[dsgn][i][p]);
					return c;
				}
				return false;
			};

		logo.append = function(o)
		{
			return render().append(o);
		};
		logo.data = function()
		{
			return render().data()
		};
		logo.image = function()
		{
			var img = document.createElement('img');
			img.src = logo.data();
			return img;
		};
	}



	//  expose object references
	konflux.point = kxPoint;
	konflux.logo  = kxLogo;

	//  expose object instances
	konflux.browser    = new kxBrowser();
	konflux.url        = new kxURL();
	konflux.style      = new kxStyle();
	konflux.string     = new kxString();
	konflux.array      = new kxArray();
	konflux.event      = new kxEvent();
	konflux.timing     = new kxTiming();
	konflux.observer   = new kxObserver();
	konflux.breakpoint = new kxBreakpoint();
	konflux.cookie     = new kxCookie();
	konflux.storage    = new kxStorage();
	konflux.canvas     = new kxCanvas();


	//  make konflux available on the global (window) scope both as 'konflux' and 'kx'
	window.konflux = window.kx = konflux;
})(window);