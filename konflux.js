/*
 *       __    Konflux (version $DEV$ - $DATE$) - a javascript helper library
 *      /\_\
 *   /\/ / /   Copyright 2012-2013, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

/*jshint browser: true, undef: true, unused: true, curly: false, newcap: false, forin: false, devel: true */
/*global File, FileList, FormData */
;(function(window, undefined){
	'use strict';

	var version = '$DEV$ - $DATE$ - $COMMIT$',
		document = window.document,
		navigator = window.navigator,
		undef = 'undefined',
		//  Private properties
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
	 *  @return  object
	 */
	function buffer(key)
	{
		if (typeof _buffer[key] === undef)
			_buffer[key] = {};
		return _buffer[key];
	}

	/**
	 *  Obtain the milliseconds since the UNIX Epoch (Jan 1, 1970 00:00:00.000)
	 *  @name    time
	 *  @type    function
	 *  @access  internal
	 *  @return  int milliseconds
	 */
	function time()
	{
		return Date.now ? Date.now() : (new Date()).getTime();
	}

	/**
	 *  Shorthand method for creating a combined version of several objects
	 *  @name    combine
	 *  @type    function
	 *  @access  internal
	 *  @param   object 1
	 *  @param   object ...
	 *  @param   object N
	 *  @return  function constructor
	 */
	function combine()
	{
		var obj = {},
			i, p;

		for (i = 0; i < arguments.length; ++i)
			if (typeof arguments[i] === 'object')
				for (p in arguments[i])
					obj[p] = p in obj && typeof obj[p] === 'object' ? combine(arguments[i][p], obj[p]) : arguments[i][p];

		return obj;
	}

	/**
	 *  Obtain the elapsed time since Konflux started (roughly), using the format: [Nd ] hh:mm:ss.ms
	 *  @name    elapsed
	 *  @type    function
	 *  @access  internal
	 *  @return  string formatted time
	 */
	function elapsed()
	{
		var day = 86400000,
			hour = 3600000,
			minute = 60000,
			delta = Math.abs((new Date()).getTime() - _timestamp),
			days = Math.floor(delta / day),
			hours = Math.floor((delta -= days * day) / hour),
			minutes = Math.floor((delta -= hours * hour) / minute),
			seconds = Math.floor((delta -= minutes * minute) / 1000),
			ms = Math.floor(delta -= seconds * 1000);

		return (days > 0 ? days + 'd ' : '') +
				('00' + hours).substr(-2) + ':' +
				('00' + minutes).substr(-2) + ':' +
				('00' + seconds).substr(-2) + '.' +
				('000' + ms).substr(-3);
	}

	/**
	 *  Obtain an unique key, the key is guaranteed to be unique within the browser runtime
	 *  @name    unique
	 *  @type    function
	 *  @access  internal
	 *  @return  string key
	 */
	function unique()
	{
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
	function elementReference(element, hidden)
	{
		var name = 'kxref',
			reference = hidden ? (name in element ? element[name] : null) : element.getAttribute('data-' + name);

		//  if no reference was set yet, do so now
		if (!reference)
		{
			reference = unique();
			if (hidden)
				element[name] = reference;
			else
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
	 *  @note    The function follows PHP's empty function; null, undefined, 0, '', '0' and false are all considered empty
	 */
	function empty(p)
	{
		var types = {
				'object':  function(o){if (o instanceof Array)return o.length > 0; for (o in o)return true;return false;},
				'boolean': function(b){return b;},
				'number':  function(n){return n !== 0;},
				'string':  function(s){return !/^0?$/.test(s);}
			};

		if (typeof types[typeof p] === 'function' && types[typeof p](p))
				return false;
		return true;
	}

	/**
	 *  Determine the type of given variable
	 *  @name    type
	 *  @type    function
	 *  @access  internal
	 *  @param   mixed variable
	 *  @return  string type
	 */
	function type(variable)
	{
		return variable instanceof Array ? 'array' : typeof variable;
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
	function hasProperty(haystack, needle)
	{
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
	function deprecate(message)
	{
		var method = ['info', 'warn', 'log'],
			i;
		for (i = 0 ; i < method.length; ++i)
			if (typeof console[method[i]] === 'function')
			{
				console[method[i]].apply(null, [elapsed() + ' DEPRECATED: ' + message]);
				break;
			}
	}

	//  use the time() function to obtain the starting time
	_timestamp = time();



	/**
	 *  The Konflux object itself
	 *  @name    Konflux
	 *  @type    constructor function
	 *  @access  internal
	 *  @return  Konflux instance
	 *  @note    konflux is available both as (window.)konflux and (window.)kx
	 */
	function Konflux()
	{
		/*jshint validthis: true*/
		var kx = this;

		/**
		 *  Return konflux itself
		 *  @name    master
		 *  @type    method
		 *  @access  public
		 *  @return  object konflux
		 */
		kx.master = function()
		{
			return kx;
		};

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
		 *  @param   object 1
		 *  @param   object ...
		 *  @param   object N
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
		 *  @name    type
		 *  @type    method
		 *  @access  public
		 *  @param   mixed  variable
		 *  @param   bool   object types
		 *  @return  string type
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

		/**
		 *  Convenience function bridging the event.ready method
		 *  @name    ready
		 *  @type    method
		 *  @access  public
		 *  @param   function handler
		 *  @return  void
		 */
		kx.ready = function(handler)
		{
			if ('event' in konflux)
				return konflux.event.ready(handler);
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
		kx.select = function(selector, parent)
		{
			return 'dom' in konflux ? konflux.dom.select(selector, parent) : [];
		};

		/**
		 *  Obtain the konflux version info
		 *  @name   version
		 *  @type   method
		 *  @access public
		 *  @param  bool   info (optional, default false - no build information)
		 *  @return string version (object info if bool info is true)
		 */
		kx.version = function(info)
		{
			var match = version.split(' - '),
				prop = ['version', 'date', 'revision', 'type'],
				result = {};

			while (prop.length && match.length)
				result[prop.shift()] = match.shift();

			return info ? result : result.version;
		};

		return this;
	}
	konflux = new Konflux();


	/**
	 *  Browser/feature detection
	 *  @module  browser
	 *  @note    available as konflux.browser / kx.browser
	 */
	function kxBrowser()
	{
		/*jshint validthis: true*/
		var browser = this,
			support = {
				touch: hasProperty(window, 'ontouchstart') || hasProperty(navigator, 'msMaxTouchPoints')
			},
			prefix,
			ieVersion;

		/**
		 *  Determine whether or not the browser is Internet Explorer (4+)
		 *  @name    detectIE
		 *  @type    function
		 *  @access  internal
		 *  @return  mixed (boolean false if not IE, version number if IE)
		 */
		function detectIE()
		{
			//  https://gist.github.com/527683 (Conditional comments only work for IE 5 - 9)
			var node = document.createElement('div'),
				check = node.getElementsByTagName('i'),
				version = 3;

			//  Starting with IE 4 (as version is incremented before first use), an <i> element is added to
			//  the 'node' element surrounded by conditional comments. The 'check' variable is automatically updated
			//  to contain all <i> elements. These elements are not there if the browser does not support conditional
			//  comments or does not match the IE version
			//  Note that there are two conditions for the while loop; the innerHTML filling and the check, the while
			//  loop itself has no body (as it is closed off by a semi-colon right after declaration)
			while (node.innerHTML = '<!--[if gt IE ' + (++version) + ']><i></i><![endif]-->', check.length && version < 10);
			//  Added IE's @cc_on trickery for browser which do not support conditional comments (such as IE10)
			return version > 4 ? version : /*jshint evil: true */Function('/*@cc_on return document.documentMode@*/return false')()/*jshint evil: false */;
		}

		/**
		 *  Determine whether or not the browser has given feature in either the window or document scope
		 *  @name    hasFeature
		 *  @type    function
		 *  @access  internal
		 *  @param   string   feature
		 *  @return  boolean  has feature
		 */
		function hasFeature(feature)
		{
			return typeof support[feature] !== undef ? support[feature] : hasProperty(window, feature) || hasProperty(document, feature);
		}

		/**
		 *  Obtain a specific feature from the browser, be it the native property or the vendor prefixed property
		 *  @name    hasFeature
		 *  @type    function
		 *  @access  internal
		 *  @param   string   feature
		 *  @return  mixed    feature (false if it doesn't exist)
		 */
		function getFeature(feature)
		{
			var vendor = vendorPrefix(),
				uc     = konflux.string.ucFirst(feature),
				object = [
					window,
					document,
					navigator
				],
				search = [
					feature,
					vendor + uc,
					vendor.toLowerCase() + uc
				],
				i;

			while (search.length)
			{
				feature = search.shift();
				for (i = 0; i < object.length; ++i)
					if (hasProperty(object[i], feature))
						return object[i][feature];
			}

			return false;
		}

		/**
		 *  Obtain the vendor prefix for the current browser
		 *  @name   vendorPrefix
		 *  @type   function
		 *  @access internal
		 *  @return string prefix
		 */
		function vendorPrefix()
		{
			var vendor = ['O', 'ms', 'Moz', 'Icab', 'Khtml', 'Webkit'],
				regex  = new RegExp('^(' + vendor.join('|') + ')(?=[A-Z])'),
				script = document.createElement('script'),
				p;

			for (p in script.style)
				if (regex.test(p))
				{
					prefix = p.match(regex).shift();
					break;
				}

			while (!prefix && vendor.length)
			{
				p = vendor.pop();
				if (hasProperty(script.style, p + 'Opacity'))
					prefix = p;
			}

			script = null;
			return prefix;
		}

		/**
		 *  Verify if the browser at hand is any version of Internet Explorer (4+)
		 *  @name    ie
		 *  @type    method
		 *  @access  public
		 *  @return  mixed (boolean false if not IE, version number if IE)
		 *  @see     detectIE
		 *  @note    this public implementation caches the result
		 */
		browser.ie = function()
		{
			if (typeof ieVersion === undef)
				ieVersion = detectIE();
			return ieVersion;
		};
		/**
		 *  Obtain the vendor prefix for the current browser
		 *  @name    prefix
		 *  @type    method
		 *  @access  public
		 *  @return  string prefix
		 *  @note    this public implementation caches the result
		 */
		browser.prefix = function()
		{
			if (!prefix)
				prefix = vendorPrefix();

			return prefix;
		};
		/**
		 *  Obtain a specific feature from the browser
		 *  @name    feature
		 *  @type    method
		 *  @access  public
		 *  @param   string   feature
		 *  @return  mixed    feature (false if it doesn't exist)
		 *  @note    this method attempts to search for the native feature and falls back onto vendor prefixed features
		 */
		browser.feature = function(feature)
		{
			return getFeature(feature);
		};
		/**
		 *  Test whether or not the browser at hand is aware of given feature(s) exist in either the window or document scope
		 *  @name    supports
		 *  @type    method
		 *  @access  public
		 *  @param   string feature1
		 *  @param   string ...
		 *  @param   string featureN
		 *  @return  boolean support
		 *  @note    multiple features can be provided, in which case the return value indicates the support of all given features
		 */
		browser.supports = function()
		{
			var r = true,
				i = arguments.length;

			//  test all the features given
			while (r && --i >= 0)
				r = r && hasFeature(arguments[i]);

			return r;
		};

		/**
		 *  Enable the HTML5 fullscreen mode for given element
		 *  @name    fullscreen
		 *  @type    method
		 *  @access  public
		 *  @param   DOMNode target
		 *  @return  bool    success
		 *  @note    this method is highly experimental
		 */
		browser.fullscreen = function(target)
		{
			var check = ['fullScreen', 'isFullScreen'],
				vendor = konflux.browser.prefix().toLowerCase(),
				method, i;

			if (!target)
				target = document.documentElement;

			for (i = 0, method = null; i < check.length, method === null; ++i)
			{
				method = hasProperty(document, check[i]) ? check[i] : vendor + konflux.string.ucFirst(check[i]);
				if (!hasProperty(document, method))
					method = null;
			}

			vendor = method.match(new RegExp('^' + vendor)) ? vendor : null;
			vendor = (vendor || (document[method] ? 'cancel' : 'request')) + konflux.string.ucFirst((vendor ? (document[method] ? 'cancel' : 'request') : '') + konflux.string.ucFirst(check[0]));

			(document[method] ? document : target)[vendor](target.ALLOW_KEYBOARD_INPUT || null);
		};
	}


	/**
	 *  Handle AJAX requests
	 *  @module  ajax
	 *  @note    available as konflux.ajax / kx.ajax
	 */
	function kxAjax()
	{
		/*jshint validthis: true*/
		var ajax = this,
			stat = {},
			header = {
				'X-Konflux': 'konflux/' + version
			};

		function kxFormData()
		{
			/*jshint validthis: true*/
			var formdata = this,
				data = {};

			formdata.append = function(key, value)
			{
				if (typeof value !== 'object')
					data[key] = value;
			};
			formdata.serialize = function()
			{
				var r = [],
					p;

				for (p in data)
					r.push(p + '=' + encodeURIComponent(data[p]));

				return r.join('&');
			};
		}
		kxFormData.prototype.toString = function()
		{
			return this.serialize();
		};

		/**
		 *  Obtain a new XHR object
		 *  @name    getXMLHTTPRequest
		 *  @type    function
		 *  @access  internal
		 *  @return  object XMLHttpRequest
		 */
		function getXMLHTTPRequest()
		{
			var xhr     = new XMLHttpRequest();
			xhr.__kxref = konflux.unique();
			return xhr;
		}

		/**
		 *  Request a resource using XHR
		 *  @name    request
		 *  @type    function
		 *  @access  internal
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		function request(config)
		{
			var url   = 'url' in config ? config.url : (konflux.url ? konflux.url.path : null),
				type  = 'type' in config ? config.type.toUpperCase() : 'GET',
				data  = 'data' in config ? prepareData(config.data) : '',
				async = 'async' in config ? config.async : true,
				headers = 'header' in config ? combine(config.header, header) : false,
				xhr   = getXMLHTTPRequest(),
				p;

			if (type !== 'POST')
			{
				url += data !== '' ? '?' + data : '';
				data = null;
			}

			xhr.onload = function(){
				var status = Math.floor(this.status / 100),
					state = false;
				++stat[type];

				if (status === 2 && 'success' in config)
				{
					state = 'success';
					config.success.apply(this, process(this));
				}
				else if (status >= 4 && 'error' in config)
				{
					state = 'error';
					config.error.apply(this, [this.status, this.responseText]);
				}

				if ('complete' in config)
				{
					state = !state ? 'complete' : state;
					config.complete.apply(this, [this.status, this.statusText, this]);
				}

				if (state)
					konflux.observer.notify('konflux.ajax.' + type.toLowerCase() + '.' + state, xhr, config);
			};

			if ('progress' in config && typeof config.progress === 'function')
				konflux.event.listen(xhr.upload, 'progress', config.progress);
			if ('error' in config && typeof config.error === 'function')
				konflux.event.listen(xhr, 'error', config.error);
			if ('abort' in config && typeof config.abort === 'function')
				konflux.event.listen(xhr, 'abort', config.abort);

			xhr.open(type, url, async);
			if (headers)
				for (p in headers)
					xhr.setRequestHeader(p, headers[p]);
			xhr.send(data);
			return xhr;
		}

		/**
		 *  Process an XHR response
		 *  @name    process
		 *  @type    function
		 *  @access  internal
		 *  @param   object XMLHttpRequest
		 *  @return  array  response ([status, response text, XMLHttpRequest])
		 */
		function process(xhr)
		{
			var contentType = xhr.getResponseHeader('content-type'),
				result = [];

			switch (contentType)
			{
				case 'application/json':
					result.push(JSON.parse(xhr.responseText));
					result.push(xhr);
					break;

				default:
					result.push(xhr.status);
					result.push(xhr.responseText);
					result.push(xhr);
					break;
			}

			return result;
		}
		/**
		 *  Prepare data to be send
		 *  @name    prepareData
		 *  @type    function
		 *  @access  internal
		 *  @param   mixed  data
		 *  @param   string name
		 *  @param   FormData (or kxFormData) object
		 *  @return  FormData (or kxFormData) object
		 */
		function prepareData(data, name, formData)
		{
			var r = formData || (typeof FormData !== undef ? new FormData() : new kxFormData()),
				p;

			if (typeof File !== undef && data instanceof File)
				r.append(name, data, data.name);
			else if (typeof Blob !== undef && data instanceof Blob)
				r.append(name, data, 'blob');
			else if (data instanceof Array || (typeof FileList !== undef && data instanceof FileList))
				for (p = 0; p < data.length; ++p)
					prepareData(data[p], (name || '') + '[' + p + ']', r);
			else if (typeof data === 'object')
				for (p in data)
					prepareData(data[p], name ? name + '[' + encodeURIComponent(p) + ']' : encodeURIComponent(p), r);
			else
				r.append(name, data);

			return r;
		}
		/**
		 *  Obtain a handler function for given request, this handler is triggered by the konflux observer (konflux.ajax.<type>)
		 *  @name    requestType
		 *  @type    function
		 *  @access  internal
		 *  @param   string   type
		 *  @return  function handler
		 */
		function requestType(type)
		{
			var handler = function(config){
				switch (typeof config)
				{
					case 'object':
						config.type = type;
						break;

					case 'string':
						//  we assume an URL
						config = {
							url: config,
							type: type
						};
						break;

					default:
						config = {
							type: type
						};
				}
				return request(config);
			};
			stat[type.toUpperCase()] = 0;
			konflux.observer.subscribe('konflux.ajax.' + type.toLowerCase(), function(ob, config){
				handler(config);
			});

			return handler;
		}


		/**
		 *  Perform a request
		 *  @name    request
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.request = request;
		/**
		 *  Perform a GET request
		 *  @name    get
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.get    = requestType('GET');
		/**
		 *  Perform a POST request
		 *  @name    post
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.post   = requestType('POST');
		/**
		 *  Perform a PUT request
		 *  @name    put
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.put    = requestType('PUT');
		/**
		 *  Perform a DELETE request
		 *  @name    del
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.del = requestType('DELETE');
		/**
		 *  Perform a PURGE request (mostly supported by caching servers such as Varnish)
		 *  @name    purge
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.purge = requestType('PURGE');
	}


	/**
	 *  Handle URL's/URI's
	 *  @module  url
	 *  @note    available as konflux.url / kx.url
	 */
	function kxURL()
	{
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
		function parse(location)
		{
			//  URL regex + key processing based on the work of Derek Watson's jsUri (http://code.google.com/p/jsuri/)
			var match = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/.exec(location),
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

		/**
		 *  The parsed url for the URL of the current page
		 *  @name    current
		 *  @type    object
		 *  @access  public
		 */
		url.current = typeof window.location.href !== undef ? parse(window.location.href) : false;
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
		url.isLocal = function(location)
		{
			return url.current.domain === url.parse(location).domain;
		};
	}


	/**
	 *  Style(sheet) manipulation
	 *  @module  style
	 *  @note    available as konflux.style / kx.style
	 */
	function kxStyle()
	{
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
		function scriptProperty(property)
		{
			var n = 0;
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
		function cssProperty(property)
		{
			return property.replace(/([A-Z])/g, '-$1').toLowerCase();
		}

		/**
		 *  Determine whether or not the property is supported and try a vendor prefix, otherwise return false
		 *  @name    hasProperty
		 *  @type    function
		 *  @access  internal
		 *  @param   string property
		 *  @return  mixed  (one of: string (script)property, or false)
		 */
		function hasProperty(property)
		{
			property = scriptProperty(property);
			if (property in document.body.style)
				return property;

			property = konflux.browser.prefix() + konflux.string.ucFirst(property);
			if (property in document.body.style)
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
		 *  @name    getStylesheet
		 *  @type    function
		 *  @access  internal
		 *  @param   string name [optional, default 'all'. Possible values 'first', 'last', 'all' or string filename]
		 *  @param   bool   includeOffset [optional, default false, local stylesheets only]
		 *  @return  array stylesheets
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
					if (name === 'all')
						match = list;
					else if (!name)
						match = false;
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
		 *  @name    findStylesheet
		 *  @type    function
		 *  @access  internal
		 *  @param   string url
		 *  @param   string name
		 *  @return  StyleSheet (bool false if not found)
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
		 *  @name    createStylesheet
		 *  @type    function
		 *  @access  internal
		 *  @param   string url
		 *  @param   bool   before (effectively true for being the first stylesheet, anything else for last)
		 *  @param   string name
		 *  @return  style node
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
		 *  @name    getStyleProperties
		 *  @type    function
		 *  @access  internal
		 *  @param   CSS Rule
		 *  @return  Object key value pairs
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
		 *  @name    normalizeSelector
		 *  @type    function
		 *  @access  internal
		 *  @param   string selector
		 *  @return  string normalized selector
		 */
		function normalizeSelector(selector)
		{
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
            pattern = value.match(/#([0-9a-f]+)/);
			if (pattern && pattern.length > 0)
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
		 *  Add one or more css classes to given element
		 *  @name    addClass
		 *  @type    method
		 *  @access  public
		 *  @param   DOMelement element
		 *  @param   string classes (separated by any combination of whitespace and/or comma
		 *  @return  string classes
		 */
		style.addClass = function(element, classes)
		{
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
		style.removeClass = function(element, classes)
		{
			var delta = konflux.string.trim(element.className).split(/\s+/),
				classList = konflux.string.trim(classes).split(/[,\s]+/),
				i, p;

			for (i = 0; i < classList.length; ++i)
			{
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
		style.toggleClass = function(element, classes)
		{
			var current = konflux.string.trim(element.className).split(/\s+/),
				classList = konflux.string.trim(classes).split(/[,\s]+/),
				i, p;

			for (i = 0; i < classList.length; ++i)
			{
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
		 *  @return  void
		 */
		style.inline = function(target, rules)
		{
			var p;

			for (p in rules)
				target.style[scriptProperty(p)] = rules[p];
		};

		/**
		 *  Obtain a CSS selector for given element
		 *  @name    selector
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement target
		 *  @return  string selector
		 */
		style.selector = function(target)
		{
			var node = target.nodeName.toLowerCase(),
				id = target.hasAttribute('id') ? '#' + target.getAttribute('id') : null,
				classes = target.hasAttribute('class') ? '.' + konflux.string.trim(target.getAttribute('class')).split(/\s+/).join('.') : null,
				select = '';

			if (arguments.length === 1 || id || classes)
				select = node + (id || classes || '');

			return konflux.string.trim((!id && target.parentNode && target !== document.body ? style.selector(target.parentNode, true) + ' ' : '') + select);
		};

		/**
		 *  Obtain a stylesheet by its name or by a mnemonic (first, last, all)
		 *  @name    sheet
		 *  @type    method
		 *  @access  public
		 *  @param   string target [optional, default 'all'. Possible values 'first', 'last', 'all' or string filename]
		 *  @param   bool   editable [optional, default true]
		 *  @return  array  stylesheets
		 */
		style.sheet = function(target, editable)
		{
			var list = getStylesheet(typeof target === 'string' ? target : null, editable === false ? true : false),
				i;

			if (typeof target.nodeName !== undef)
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
		style.create = function(name, before)
		{
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
		style.load = function(url, callback, before)
		{
			var style = createStylesheet(url, before);

			//  if style is a StyleSheet object, it has the ownerNode property containing the actual DOMElement in which it resides
			if (typeof style.ownerNode !== undef)
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
		style.isEditable = function(stylesheet)
		{
			var list = getLocalStylesheets(),
				node = typeof stylesheet.ownerNode !== undef ? stylesheet.ownerNode : stylesheet,
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
		 *  @return  int    index at which the rule was added
		 */
		style.add = function(selector, rules, sheet)
		{
			var rule = '',
				find, p, pr;

			//  in case the selector is not a string but a DOMElement, we go out and create a selector from it
			if (typeof selector === 'object' && 'nodeType' in selector)
				selector = style.selector(selector);

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
				else if (sheet.length <= 0)
				{
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
				if (!(p in find) || normalizeValue(find[p]) !== normalizeValue(rules[p]))
				{
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
		 *  @return  string     value
		 */
		style.get = function(element, property)
		{
			var value;

			if (element.currentStyle)
				value = element.currentStyle(scriptProperty(property));
			else if (window.getComputedStyle)
				value = document.defaultView.getComputedStyle(element, null).getPropertyValue(cssProperty(property));

			return value;
		};
	}


	/**
	 *  Number utils
	 *  @module  number
	 *  @note    available as konflux.number / kx.number
	 */
	function kxNumber()
	{
		/*jshint validthis: true*/
		var number = this;


		/**
		 *  Test wheter given input is an even number
		 *  @name    even
		 *  @type    method
		 *  @access  public
		 *  @param   number input
		 *  @return  bool even
		 */
		number.even = function(input)
		{
			return input % 2 === 0;
		};

		/**
		 *  Test wheter given input is an odd number
		 *  @name    odd
		 *  @type    method
		 *  @access  public
		 *  @param   number input
		 *  @return  bool odd
		 */
		number.odd = function(input)
		{
			return !number.even(input);
		};

		/**
		 *  Test wheter given input lies between the low and high values (including the low and high values)
		 *  @name    between
		 *  @type    method
		 *  @access  public
		 *  @param   number input
		 *  @param   number low
		 *  @param   number high
		 *  @return  bool between
		 */
		number.between = function(input, low, high)
		{
			return input >= low && input <= high;
		};
	}


	/**
	 *  String utils
	 *  @module  string
	 *  @note    available as konflux.string / kx.string
	 */
	function kxString()
	{
		/*jshint validthis: true*/
		var string = this;

		/**
		 *  Javascript port of Java’s String.hashCode()
		 *  (Based on http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/)
		 *  @name    hashCode
		 *  @type    function
		 *  @access  internal
		 *  @param   string input
		 *  @return  number hash (32bit integer)
		 */
		function hashCode(s)
		{
			for (var r = 0, i = 0, l = s.length; i < l; ++i)
				r  = (r = r * 31 + s.charCodeAt(i)) & r;
			return r;
		}

		/**
		 *  Create a hash from a string
		 *  @name    hash
		 *  @type    function
		 *  @access  internal
		 *  @param   string source
		 *  @return  string hash
		 */
		function hash(s)
		{
			var p = 16,
				pad = ('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' + s).substr(-(Math.ceil((s.length || 1) / p) * p)),
				r = 0;

			while (pad.length)
			{
				r  += hashCode(pad.substr(0, p));
				pad = pad.substr(p);
			}

			return Math.abs(r).toString(36);
		}

		/**
		 *  Return the ASCII value of given character
		 *  @name    ord
		 *  @type    function
		 *  @access  internal
		 *  @param   string character
		 *  @return  number character code
		 */
		function ord(s)
		{
			return s.charCodeAt(0);
		}

		/**
		 *  Return the character corresponding with given ASCII value
		 *  @name    chr
		 *  @type    function
		 *  @access  internal
		 *  @param   number character code
		 *  @return  string character
		 */
		function chr(n)
		{
			return String.fromCharCode(n);
		}

		/**
		 *  Pad a string
		 *  @name    pad
		 *  @type    function
		 *  @access  internal
		 *  @param   string to pad
		 *  @param   number length
		 *  @param   string pad string
		 *  @param   int pad type
		 *  @return  padded string
		 */
		function pad(s, n, c, t)
		{
			c = Array(n + 1).join(c);
			return (n -= s.length) > 0 && (t = t === string.PAD_LEFT ? n : (t === string.PAD_BOTH ? Math.ceil(n / 2) : 0)) !== false ? (t > 0 ? c.substr(0, t) : '') + s + c.substr(0, n - t) : s;
		}

		/**
		 *  Generate a checksum for given string
		 *  @name    checksum
		 *  @type    function
		 *  @access  internal
		 *  @param   string source
		 *  @return  string checksum
		 */
		function checksum(s)
		{
			for (var n = s.length, r = 0; n > 0; r += n * ord(s[--n]));
			return Math.abs((r + '' + s.length) | 0).toString(36);
		}

		/**
		 *  Generate a UUID
		 *  @name    uuid
		 *  @type    function
		 *  @access  internal
		 *  @return  string uuid
		 */
		function uuid()
		{
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){
				var r = Math.random() * 16 | 0;
				return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
			});
		}

		//  'constants'
		string.PAD_LEFT   = 1;
		string.PAD_BOTH   = 2;
		string.PAD_RIGHT  = 3;
		string.TRIM_LEFT  = 1;
		string.TRIM_BOTH  = 2;
		string.TRIM_RIGHT = 3;

		/**
		 *  Trim string from leading/trailing whitespace
		 *  @name    trim
		 *  @type    method
		 *  @access  public
		 *  @param   string input
		 *  @param   int    side [optional, one of TRIM_LEFT, TRIM_RIGHT, TRIM_BOTH (default)]
		 *  @return  string trimmed
		 *  @note    the side params are located in konflux.string (e.g. konflux.string.TRIM_LEFT)
		 */
		string.trim = function(s, side)
		{
			var	w = side || string.TRIM_BOTH,
				r = w === string.TRIM_RIGHT ? s : s.replace(/^\s\s*/, ''),
				x = /\s/,
				i = r.length;

			if (w !== string.TRIM_LEFT)
				while (x.test(r.charAt(--i)));
			return r.slice(0, i + 1);
		};

		/**
		 *  Reverse given string
		 *  @name    reverse
		 *  @type    method
		 *  @access  public
		 *  @param   string input
		 *  @return  string reversed
		 */
		string.reverse = function(s)
		{
			for (var n = s.length, r = ''; n > 0; r += s[--n]);
			return r;
		};

		/**
		 *  Pad a string
		 *  @name    pad
		 *  @type    method
		 *  @access  public
		 *  @param   string to pad
		 *  @param   number length
		 *  @param   string pad string [optional, default ' ']
		 *  @param   int type [optional, one of: PAD_LEFT, PAD_RIGHT (default), PAD_BOTH]
		 *  @return  string padded
		 *  @note    the type params are located in konflux.string (e.g. konflux.string.PAD_LEFT)
		 */
		string.pad = function(s, n, c, t)
		{
			return pad(s, n, c || ' ', t || string.PAD_RIGHT);
		};

		/**
		 *  Uppercase the first character of given string
		 *  @name    ucFirst
		 *  @type    method
		 *  @access  public
		 *  @param   string input
		 *  @return  string uppercased first character
		 */
		string.ucFirst = function(input)
		{
			return input.charAt(0).toUpperCase() + input.substr(1);
		};

		/**
		 *  Create a hash from a string
		 *  @name    hash
		 *  @type    method
		 *  @access  public
		 *  @param   string input
		 *  @return  string hash
		 */
		string.hash = hash;

		/**
		 *  Generate a checksum for given string
		 *  @name    checksum
		 *  @type    method
		 *  @access  public
		 *  @param   string source
		 *  @return  string checksum
		 */
		string.checksum = checksum;

		/**
		 *  Generate a UUID
		 *  @name    uuid
		 *  @type    method
		 *  @access  public
		 *  @return  string uuid
		 */
		string.uuid = uuid;

		/**
		 *  Return the ASCII value of given character
		 *  @name    ord
		 *  @type    method
		 *  @access  public
		 *  @param   string character
		 *  @return  number character code
		 */
		string.ord = ord;

		/**
		 *  Return the character corresponding with given ASCII value
		 *  @name    chr
		 *  @type    method
		 *  @access  public
		 *  @param   int    code
		 *  @return  string character
		 */
		string.chr = chr;
	}


	/**
	 *  Array utils
	 *  @module  array
	 *  @note    available as konflux.array / kx.array
	 */
	function kxArray()
	{
		/*jshint validthis: true*/
		var array = this;

		/**
		 *  Determine whether given value (needle) is in the array (haystack)
		 *  @name    contains
		 *  @type    function
		 *  @access  internal
		 *  @param   array haystack
		 *  @param   mixed needle
		 *  @return  int   position
		 */
		function contains(a, v)
		{
			for (var i = 0; i < a.length; ++i)
				if (a[i] === v)
					return i;
			return false;
		}

		/**
		 *  Return the difference between two arrays
		 *  @name    diff
		 *  @type    function
		 *  @access  internal
		 *  @param   array array1
		 *  @param   array array2
		 *  @return  array difference
		 */
		function diff(a, b)
		{
			var ret = [],
				i;
			for (i = 0; i < a.length; ++i)
				if (contains(b, a[i]) === false)
					ret.push(a[i]);
			return ret;
		}

		/**
		 *  Create an array with values between (including) given start and end
		 *  @name    range
		 *  @type    function
		 *  @access  internal
		 *  @param   number start
		 *  @param   number end
		 *  @return  array range
		 */
		function range(a, b)
		{
			var r = [];
			b -= a;
			while (r.length <= b)
				r.push(a + r.length);
			return r;
		}

		/**
		 *  Shuffle given array
		 *  @name    shuffle
		 *  @type    function
		 *  @access  internal
		 *  @param   array source
		 *  @return  array shuffled
		 */
		function shuffle(a)
		{
			for (var j, x, i = a.length; i; j = (Math.random() * i) | 0, x = a[--i], a[i] = a[j], a[j] = x);
			return a;
		}


		//  expose
		/**
		 *  Does the array contain given value
		 *  @name    contains
		 *  @type    method
		 *  @access  public
		 *  @param   array   haystack
		 *  @param   mixed   needle
		 *  @return  boolean contains
		 */
		array.contains = contains;

		/**
		 *  Return the difference between two arrays
		 *  @name    diff
		 *  @type    method
		 *  @access  public
		 *  @param   array array1
		 *  @param   array array2
		 *  @return  array difference
		 */
		array.diff = diff;

		/**
		 *  Create an array with values between (including) given start and end
		 *  @name    range
		 *  @type    method
		 *  @access  public
		 *  @param   int start
		 *  @param   int end
		 *  @return  array range
		 */
		array.range = range;

		/**
		 *  Shuffle given array
		 *  @name    shuffle
		 *  @type    method
		 *  @access  public
		 *  @param   array source
		 *  @return  array shuffled
		 */
		array.shuffle = shuffle;
	}


	/**
	 *  DOM Structure helper
	 *  @module  dom
	 *  @note    available as konflux.dom / kx.dom
	 */
	function kxDOM()
	{
		/*jshint validthis: true*/
		var dom = this;

		/**
		 *  Append given source element or structure to the target element
		 *  @name   appendTo
		 *  @type   function
		 *  @access internal
		 *  @param  DOMElement target
		 *  @param  mixed source (one of: DOMElement, Object structure)
		 *  @return Array of added source elements
		 */
		function appendTo(target, source)
		{
			var result, i;

			if (typeof target === 'string')
				target = document.querySelector(target);

			if (source instanceof Array)
			{
				result = [];
				for (i = 0; i < source.length; ++i)
					result.push(appendTo(target, source[i]));
			}
			else
			{
				result = target.appendChild(source);
			}

			return result;
		}

		/**
		 *  Determine whether element is in the ancestor element or the ancestor element itself
		 *  @name   contains
		 *  @type   function
		 *  @access internal
		 *  @param  DOMElement ancestor
		 *  @param  DOMElement element
		 *  @return bool element is (in) ancestor
		 */
		function contains(ancestor, element)
		{
			//  use the contains method if it exists
			if (hasProperty(ancestor, 'contains'))
				return ancestor.contains(element);

			//  old school tree walker
			while (element !== ancestor && (element = element.parentNode));
			return !!element;
		}

		/**
		 *  Create a dom structure from given variable
		 *  @name   createStructure
		 *  @type   function
		 *  @access internal
		 *  @param  mixed source
		 *  @return DOMElement structure
		 */
		function createStructure(struct)
		{
			var nodeName, element, p, i;

			switch (typeof struct)
			{
				case 'object':
					if (struct instanceof Array)
					{
						element = [];
						for (i = 0; i < struct.length; ++i)
							element.push(createStructure(struct[i]));
					}
					else
					{
						nodeName = 'name' in struct ? struct.name : 'div';
						if (!/^[a-z]+$/.test(nodeName))
							element = document.querySelector(nodeName);
						else
							element = document.createElement(nodeName);

						for (p in struct)
						{
							switch (p)
							{
								case 'name':
									//  do nothing
									break;

								case 'child':
								case 'content':
									appendTo(element, createStructure(struct[p]));
									break;

								case 'class':
								case 'className':
									element.setAttribute('class', struct[p]);
									break;

								default:
									element.setAttribute(p, struct[p]);
									break;
							}
						}
					}
					break;

				case 'boolean':
					struct = struct ? 'true' : 'false';
					//  no break, fall through;

				default:
					element = document.createTextNode(struct);
					break;
			}

			return element;
		}

		/**
		 *  Create a dom structure from given variable
		 *  @name   create
		 *  @type   method
		 *  @access public
		 *  @param  mixed source
		 *  @return DOMElement structure
		 */
		dom.create   = createStructure;

		/**
		 *  Append given source element or structure to the target element
		 *  @name   appendTo
		 *  @type   method
		 *  @access public
		 *  @param  DOMElement target
		 *  @param  mixed source (one of: DOMElement, Object structure)
		 *  @return Array of added source elements
		 */
		dom.appendTo = function(target, source)
		{
			return appendTo(target, typeof source === 'object' && typeof source.nodeType !== undef ? source : createStructure(source));
		};

		/**
		 *  Determine whether element is in the ancestor element or the ancestor element itself
		 *  @name   contains
		 *  @type   method
		 *  @access public
		 *  @param  DOMElement ancestor
		 *  @param  DOMElement element
		 *  @return bool is (in) ancestor
		 */
		dom.contains = contains;

		/**
		 *  Select elements matching given CSS selector
		 *  @name   select
		 *  @type   method
		 *  @access public
		 *  @param  string     selector
		 *  @param  DOMElement parent
		 *  @return DOMNodeList
		 */
		dom.select = function(selector, parent)
		{
			return (parent || document).querySelectorAll(selector);
		};

		/**
		 *  Get the unique reference for given DOM element, adds it if it does not yet exist
		 *  @name    reference
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement element
		 *  @return  string unique reference
		 *  @note    this function adds an attribute 'data-kxref' to the element
		 */
		dom.reference = function(element)
		{
			return elementReference(element);
		};
	}


	/**
	 *  Event attachment handler
	 *  @module  event
	 *  @note    available as konflux.event / kx.event
	 */
	function kxEvent()
	{
		/*jshint validthis: true*/
		var event = this,
			queue = buffer('event.queue'),
			touch = konflux.browser.supports('touch');

		/**
		 *  Ready state handler, removes all relevant triggers and executes any handler that is set
		 *  @name    ready
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function ready(e)
		{
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
		}

		/**
		 *  Unify the event object, which makes event more consistent across browsers
		 *  @name    unifyEvent
		 *  @type    function
		 *  @access  internal
		 *  @return  Event object
		 */
		function unifyEvent(e)
		{
			var evt = e || window.event;
			if (typeof evt.target === undef)
				evt.target = typeof evt.srcElement !== undef ? evt.srcElement : null;

			if (/^mouse[a-z]+|drag[a-z]+|drop|click$/i.test(evt.type))
			{
				evt.mouse = new kxPoint(
					evt.pageX ? evt.pageX : (evt.clientX ? evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft : 0),
					evt.pageY ? evt.pageY : (evt.clientY ? evt.clientY + document.body.scrollTop + document.documentElement.scrollTop : 0)
				);
			}
			return evt;
		}

		//  expose
		/**
		 *  Is the browser capable of touch events
		 *  @name    hasTouch
		 *  @type    method
		 *  @access  public
		 *  @return  bool is touch device
		 */
		event.hasTouch = function()
		{
			return touch;
		};

		/**
		 *  A custom DOMReady handler
		 *  @name    ready
		 *  @type    method
		 *  @access  public
		 *  @param   function handler
		 *  @return  void
		 */
		event.ready = function(handler)
		{
			//  the document is ready already
			if (/^interactive|complete$/.test(document.readyState))
				return setTimeout(handler, 1); // make sure we run the 'event' asynchronously

			//  we cannot use the event.listen method, as we need very different event listeners
			if (typeof queue.ready === undef)
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
		 *  @name    listen
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement target
		 *  @param   string event type
		 *  @param   function handler
		 *  @return  function delegate handler
		 */
		event.listen = function(target, type, handler)
		{
			var delegate = function(e){
					handler.apply(target, [unifyEvent(e)]);
				},
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

			return delegate;
		};

		/**
		 *  Listen for events on a parent element and only trigger it if the given selector applies
		 *  @name    live
		 *  @type    method
		 *  @access  public
		 *  @param   target element
		 *  @param   string event type(s)
		 *  @param   string selector
		 *  @param   function handler
		 *  @return  bool success
		 */
		event.live = function(target, type, selector, handler)
		{
			var delegate = function(e){
				/*jshint validthis: true*/
				var list = this.querySelectorAll(selector),
					i;

				for (i = 0; i < list.length; ++i)
					if (konflux.dom.contains(list[i], e.target))
						handler.apply(list[i], [unifyEvent(e)]);
			};
			return event.listen(target, type, delegate);
		};
	}


	/**
	 *  Timing utils
	 *  @module  timing
	 *  @note    available as konflux.timing / kx.timing
	 */
	function kxTiming()
	{
		/*jshint validthis: true*/
		var timing = this,
			stack = buffer('timing.delay');


        /**
		 *  Delay object, instances of this are be provided for all kxTimings
		 *  @name    kxDelay
		 *  @type    class
		 *  @access  internal
		 *  @param   function handle
		 *  @param   Number   timeout
		 *  @param   string   reference
		 *  @return  kxDelay  object
		 */
		function kxDelay(handler, timeout, reference)
		{
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
			function cancel()
			{
				clearTimeout(timer);
			}

			/**
			 *  Start the timer
			 *  @name    start
			 *  @type    function
			 *  @access  internal
			 *  @return  void
			 */
			function start()
			{
				timer = setTimeout(function(){cancel();handler.call();}, timeout);
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
			delay.reference = function()
			{
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
		function remove(reference)
		{
			if (typeof stack[reference] !== undef)
			{
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
		 *  @return  kxDelay  object
		 */
		function create(handler, delay, reference)
		{
			if (reference)
				remove(reference);
			else
				reference = handler.toString() || unique();
			stack[reference] = new kxDelay(handler, delay, reference);

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
		 *  @return  kxDelay  object
		 */
		timing.create = create;
	}


	/**
	 *  Observer object, handles subscriptions to messages
	 *  @module  observer
	 *  @note    available as konflux.observer / kx.observer
	 */
	function kxObserver()
	{
		/*jshint validthis: true*/
		var observer = this,
			subscription = buffer('observer.subscriptions'),
			active = buffer('observer.active');


		/**
		 *  Observation object, instances of this are be provided to all observer notification subscribers
		 *  @name    kxObservation
		 *  @type    class
		 *  @access  internal
		 *  @param   string type
		 *  @param   function handle
		 *  @param   string reference
		 *  @return  kxObservation object
		 */
		function kxObservation(type, handle, reference)
		{
			/*jshint validthis: true*/
			var observation = this;

			observation.type      = type;
			observation.reference = reference;
			observation.timeStamp = time();
			observation.timeDelta = elapsed();

			/**
			 *  Unsubscribe from the current observer stack
			 *  @name    unsubscribe
			 *  @type    method
			 *  @access  public
			 *  @return  void
			 */
			observation.unsubscribe = function()
			{
				return disable(type, handle);
			};
			/**
			 *  Stop the execution of this Observation
			 *  @name    stop
			 *  @type    method
			 *  @access  public
			 *  @return  void
			 */
			observation.stop = function()
			{
				active[reference] = false;
			};
		}


		/**
		 *  Create the subscription stack if it does not exist
		 *  @name    ensureSubscriptionStack
		 *  @type    function
		 *  @access  internal
		 *  @param   string stack name
		 *  @return  void
		 */
		function ensureSubscriptionStack(stack)
		{
			if (typeof subscription[stack] === undef) subscription[stack] = [];
		}

		/**
		 *  Add handler to specified stack
		 *  @name    add
		 *  @type    function
		 *  @access  internal
		 *  @param   string stack name
		 *  @param   function handler
		 *  @return  int total number of subscriptions in this stack
		 */
		function add(stack, handle)
		{
			ensureSubscriptionStack(stack);
			return subscription[stack].push(handle);
		}

		/**
		 *  Disable a handler for specified stack
		 *  @name    disable
		 *  @type    function
		 *  @access  internal
		 *  @param   string stack name
		 *  @param   function handler
		 *  @return  void
		 *  @note    this method is used from the Observation object, which would influence the number of
		 *          subscriptions if the subscription itself was removed immediately
		 */
		function disable(stack, handle)
		{
			var i;

			for (i = 0; i < subscription[stack].length; ++i)
				if (subscription[stack][i] === handle)
					subscription[stack][i] = false;
		}

		/**
		 *  Remove specified handler (and all disabled handlers) from specified stack
		 *  @name    remove
		 *  @type    function
		 *  @access  internal
		 *  @param   string stack name
		 *  @param   function handler [optional]
		 *  @return  array removed handlers
		 */
		function remove(stack, handle)
		{
			var out = [],
				keep = [],
				i;

			ensureSubscriptionStack(stack);
			for (i = 0; i < subscription[stack].length; ++i)
				(!subscription[stack][i] || subscription[stack][i] === handle ? out : keep).push(subscription[stack][i]);
			subscription[stack] = keep;
			return out;
		}

		/**
		 *  Flush specified stack
		 *  @name    flush
		 *  @type    function
		 *  @access  internal
		 *  @param   string stack name
		 *  @return  array removed handlers (false if the stack did not exist);
		 */
		function flush(stack)
		{
			var out = false;

			if (typeof subscription[stack] !== undef)
			{
				out = subscription[stack];
				delete subscription[stack];
			}
			return out;
		}

		/**
		 *  Trigger the handlers in specified stack
		 *  @name    trigger
		 *  @type    function
		 *  @access  internal
		 *  @param   string stack name
		 *  @param   mixed arg1
		 *  @param   mixed ...
		 *  @param   mixed argN
		 *  @return  void
		 */
		function trigger(stack)
		{
			var arg = Array.prototype.slice.call(arguments),
				ref = unique(),
				part = stack.split('.'),
				wildcard = false,
				name, i;

			while (part.length >= 0)
			{
				active[ref] = true;
				name = part.join('.') + (wildcard ? (part.length ? '.' : '') + '*' : '');
				wildcard = true;

				if (typeof subscription[name] !== undef)
					for (i = 0; i < subscription[name].length; ++i)
					{
						if (!active[ref])
							break;

						if (subscription[name][i])
						{
							arg[0] = new kxObservation(stack, subscription[name][i], ref);
							subscription[name][i].apply(subscription[name][i], arg);
						}
					}

				if (!part.pop())
					break;
			}
			delete active[ref];
		}

		/**
		 *  Subscribe a handler to an observer stack
		 *  @name    subscribe
		 *  @type    method
		 *  @access  public
		 *  @param   string stack name
		 *  @param   function handle
		 *  @return  bool success
		 */
		observer.subscribe = function(stack, handle)
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
		 *  @name    unsubscribe
		 *  @type    method
		 *  @access  public
		 *  @param   string stack name
		 *  @param   function handle
		 *  @return  array removed handlers
		 */
		observer.unsubscribe = function(stack, handle)
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
		 *  @name    notify
		 *  @type    method
		 *  @access  public
		 *  @param   string stack name
		 *  @param   mixed  arg1
		 *  @param   mixed  ...
		 *  @param   mixed  argN
		 *  @return  void
		 */
		observer.notify = function()
		{
			return trigger.apply(observer, arguments);
		};
	}


	/**
	 *  Breakpoint object, add/remove classes on specified object (or body) when specific browser dimensions are met
	 *  (triggers observations when viewport dimensions change)
	 *  @module  breakpoint
	 *  @note    available as konflux.breakpoint / kx.breakpoint
	 */
	function kxBreakpoint()
	{
		/*jshint validthis: true*/
		var breakpoint = this,
			stack = buffer('breakpoint.stack'),
			tick = false,
			pixelRatio, timeout;

		/**
		 *  Simple monitor function which calls the update function at a convenient interval
		 *  @name    monitor
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function monitor()
		{
			var now = time();

			clearTimeout(timeout);

			if (!tick || now - tick > 100)
			{
				tick = now;
				update();
			}

			//  attempt to ease up on the load
			timeout = setTimeout(function(){
				var timer = konflux.browser.feature('requestAnimationFrame') || function(handle){
					setTimeout(handle, 100);
				};

				timer(monitor);
			}, 50);
		}

		/**
		 *  Loop through all element stacks and determine if anything needs updates
		 *  @name    update
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function update()
		{
			var bounds, matched, className, p;

			for (p in stack)
			{
				bounds = stack[p].element.getBoundingClientRect();

				if (stack[p].width !== bounds.width)
				{
					stack[p].width = bounds.width;
					className = stack[p].current;
					matched = match(stack[p], stack[p].width);

					if (matched !== stack[p].match)
					{
						className = null;

						className = stack[p].config[matched].join(' ');
						if (matched && parseInt(matched, 10) <= stack[p].width && hasProperty(stack[p].config, matched))
							stack[p].match = matched;
					}

					if (className !== stack[p].current)
					{
						if (!empty(stack[p].current))
							konflux.style.removeClass(stack[p].element, stack[p].current);

						if (!empty(className))
							kx.style.addClass(stack[p].element, className);

						stack[p].current = className;
						konflux.observer.notify('breakpoint.change', stack[p].current, stack[p].element);
					}
				}
			}
		}

		/**
		 *  Obtain the settings stack for the given element
		 *  @name    getStack
		 *  @type    function
		 *  @access  internal
		 *  @param   DOMElement target
		 *  @return  object     config
		 */
		function getStack(target)
		{
			var ref = elementReference(target);

			if (!hasProperty(stack, ref))
				stack[ref] = {
					match: null,
					width: null,
					current: null,
					element: target,
					config: {}
				};

			return stack[ref];
		}

		/**
		 *  Determine the best matching dimension and return the settings
		 *  @name    match
		 *  @type    function
		 *  @access  internal
		 *  @param   object stack reference
		 *  @param   int    browser width
		 *  @return  object config
		 */
		function match(refStack, width)
		{
			var found, delta, min, p;

			if (hasProperty(refStack, 'config'))
			{
				width = Math.round(width);
				for (p in refStack.config)
				{
					p = parseInt(p, 10);
					min = !min ? p : Math.min(min, p);
					if (p <= width && (!delta || width - p <= delta))
					{
						found = p;
						delta = width - p;
					}
				}
			}

			return found >= 0 ? found : min || false;
		}

		/**
		 *  Add a breakpoint which sets given className if element (or the document body) becomes at
		 *  least the given width wide and there is no setting matching better
		 *  @name    add
		 *  @type    function
		 *  @access  internal
		 *  @param   DOMElement target
		 *  @param   number     width
		 *  @param   string     class(es)
		 *  @return  void
		 */
		function add(target, width, className)
		{
			var refStack = getStack(target);

			clearTimeout(timeout);

			if (!hasProperty(refStack.config, width))
				refStack.config[width] = [];

			refStack.config[width].push(className);

			timeout = setTimeout(function(){
				monitor();
			}, 5);
		}

		function remove()
		{
			var test;
		}

		/**
		 *  Add a breakpoint which sets given className if element (or the document body) becomes at
		 *  least the given width wide and there is no setting matching better
		 *  @name    add
		 *  @type    method
		 *  @access  public
		 *  @param   number     width
		 *  @param   string     class(es)
		 *  @param   DOMElement target [optional, default document.body]
		 *  @return  kxBreakpoint object
		 */
		breakpoint.add = function(width, className, target)
		{
			add(target || document.body, width, className);
			return breakpoint;
		};

		breakpoint.remove = function()
		{
			//  to be implemented
		};

		/**
		 *  Assign className to the body element when a configuration for given pixelRatio matches
		 *  @name    ratio
		 *  @type    method
		 *  @access  public
		 *  @param   number pixelRatio
		 *  @param   string className
		 *  @param   bool   allow to round the ratio to get to a matching ratio
		 *  @param   return bool matched
		 */
		breakpoint.ratio = function(ratio, className, round)
		{
			if (!pixelRatio)
				pixelRatio = konflux.browser.feature('devicePixelRatio') || 1;

			if (ratio === pixelRatio || (round && Math.round(ratio) === pixelRatio))
			{
				konflux.style.addClass(document.body, className);
				return true;
			}
			return false;
		};
	}


	/**
	 *  Point object, handling the (heavy) lifting of working with points
	 *  @module  point
	 *  @note    available as konflux.point / kx.point
	 */
	function kxPoint(x, y)
	{
		/*jshint validthis: true*/
		var point = this;

		point.x = x || 0;
		point.y = y || 0;


		/**
		 *  Move the point to a specific position
		 *  @name    to
		 *  @type    method
		 *  @access  public
		 *  @param   number x
		 *  @param   number y
		 *  @return  kxPoint  point
		 */
		point.to = function(x, y)
		{
			point.x = x;
			point.y = y;

			return point;
		};

		/**
		 *  Snap the point to a grid
		 *  @name    snap
		 *  @type    method
		 *  @access  public
		 *  @param   number grid [optional, default 1 - round the position x and y]
		 *  @return  kxPoint  point
		 */
		point.snap = function(grid)
		{
			point.x = grid ? Math.round(point.x / grid) * grid : Math.round(point.x);
			point.y = grid ? Math.round(point.y / grid) * grid : Math.round(point.y);

			return point;
		};

		/**
		 *  Create a new point based on the current
		 *  @name    clone
		 *  @type    method
		 *  @access  public
		 *  @return  kxPoint  point
		 */
		point.clone = function()
		{
			return new kxPoint(point.x, point.y);
		};

		/**
		 *  Move the point object by given x and y
		 *  @name    move
		 *  @type    method
		 *  @access  public
		 *  @param   number x
		 *  @param   number y
		 *  @return  kxPoint  point
		 */
		point.move = function(x, y)
		{
			point.x += x;
			point.y += y;

			return point;
		};

		/**
		 *  Is given point on the exact same position
		 *  @name    equal
		 *  @type    method
		 *  @access  public
		 *  @param   kxPoint point
		 *  @param   bool    round
		 *  @return  bool    equal
		 */
		point.equal = function(p, round)
		{
			return round ? Math.round(point.x) === Math.round(p.x) && Math.round(point.y) === Math.round(p.y) : point.x === p.x && point.y === p.y;
		};

		/**
		 *  Scale the points coordinates by given factor
		 *  @name    scale
		 *  @type    method
		 *  @access  public
		 *  @param   number factor
		 *  @return  void
		 */
		point.scale = function(factor)
		{
			point.x *= factor;
			point.y *= factor;

			return point;
		};

		/**
		 *  Subtract a point for the current point
		 *  @name    subtract
		 *  @type    method
		 *  @access  public
		 *  @param   object point
		 *  @return  kxPoint
		 */
		point.subtract = function(p)
		{
			return new kxPoint(point.x - p.x, point.y - p.y);
		};

		/**
		 *  Add a point to the current point
		 *  @name    add
		 *  @type    method
		 *  @access  public
		 *  @param   object point
		 *  @return  kxPoint
		 */
		point.add = function(p)
		{
			return new kxPoint(point.x + p.x, point.y + p.y);
		};

		/**
		 *  Get the distance between given and current point
		 *  @name    distance
		 *  @type    method
		 *  @access  public
		 *  @param   object point
		 *  @return  number distance
		 */
		point.distance = function(p)
		{
			return Math.sqrt(Math.pow(Math.abs(point.x - p.x), 2) + Math.pow(Math.abs(point.y - p.y), 2));
		};

		/**
		 *  Get the angle in radians between given and current point
		 *  @name    angle
		 *  @type    method
		 *  @access  public
		 *  @param   object point
		 *  @return  number angle
		 */
		point.angle = function(p)
		{
			return Math.atan2(p.x - point.x, p.y - point.y);
		};

		/**
		 *  Create a point with the maximum coordinates of both the current and given point
		 *  @name    max
		 *  @type    method
		 *  @access  public
		 *  @param   kxPoint point 1
		 *  @param   kxPoint ...
		 *  @param   kxPoint point N
		 *  @return  kxPoint
		 */
		point.max = function()
		{
			var x = point.x,
				y = point.y,
				i;

			for (i = 0; i < arguments.length; ++i)
			{
				x = Math.max(x, arguments[i].x);
				y = Math.max(y, arguments[i].y);
			}

			return new kxPoint(x, y);
		};

		/**
		 *  Create a point with the minimum coordinates of both the current and given point
		 *  @name    min
		 *  @type    method
		 *  @access  public
		 *  @param   kxPoint point 1
		 *  @param   kxPoint ...
		 *  @param   kxPoint point N
		 *  @return  kxPoint
		 */
		point.min = function()
		{
			var x = point.x,
				y = point.y,
				i;

			for (i = 0; i < arguments.length; ++i)
			{
				x = Math.min(x, arguments[i].x);
				y = Math.min(y, arguments[i].y);
			}

			return new kxPoint(x, y);
		};

		/**
		 *  Create a new point from the current mapped to isometric coordinates
		 *  @name    iso
		 *  @type    method
		 *  @access  public
		 *  @param   number angle [optional, default 30 degrees]
		 *  @return  kxPoint
		 */
		point.iso = function(angle)
		{
			angle = (angle || 30) * Math.PI / 180;

			return new kxPoint(
				point.x - point.y,
				(point.x + point.y) * angle
			);
		};
	}


	/**
	 *  Cookie object, making working with cookies a wee bit easier
	 *  @module  cookie
	 *  @note    available as konflux.cookie / kx.cookie
	 */
	function kxCookie()
	{
		/*jshint validthis: true*/
		var cookie = this,
			jar = {};

		/**
		 *  Read the available cookie information and populate the jar variable
		 *  @name    init
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function init()
		{
			var part = document.cookie.split(';'),
				data;

			while (part.length)
			{
				data = part.shift().split('=');
				jar[konflux.string.trim(data.shift())] = konflux.string.trim(data.join('='));
			}
		}

		/**
		 *  Set a cookie
		 *  @name    setCookie
		 *  @type    function
		 *  @access  internal
		 *  @param   string key
		 *  @param   string value
		 *  @param   int    expire [optional, default expire at the end of the session]
		 *  @param   string path   [optional, default the current path]
		 *  @param   string domain [optional, default the current domain]
		 *  @param   bool   secure [optional, default false]
		 *  @return  void
		 *  @note    the syntax of setCookie is compatible with that of PHP's setCookie
		 *           this means that setting an empty value (string '' | null | false) or
		 *           an expiry time in the past, the cookie will be removed
		 */
		function setCookie(key, value, expire, path, domain, secure)
		{
			var pairs = [key + '=' + (typeof value === 'number' ? value : value || '')],
				date;

			if (pairs[0].substr(-1) === '=')
				expire = -1;

			if (typeof expire !== undef && expire)
				date = new Date(expire);

			if (date)
			{
				if (date < (new Date()).getTime() && typeof jar[key] !== undef)
					delete jar[key];
				pairs.push('expires=' + date);
			}
			if (typeof path !== undef && path)
				pairs.push('path=' + path);
			if (typeof domain !== undef && domain)
				pairs.push('domain=' + domain);
			if (typeof secure !== undef && secure)
				pairs.push('secure');

			document.cookie = pairs.join(';');
			if (document.cookie.indexOf(pairs.shift()) >= 0)
				jar[key] = value + '';
		}

		/**
		 *  Obtain a cookie value
		 *  @name    getCookie
		 *  @type    function
		 *  @access  internal
		 *  @param   string key
		 *  @return  void
		 */
		function getCookie(key)
		{
			return typeof jar[key] !== undef ? jar[key] : null;
		}


		//  expose
		/**
		 *  Get and/or set cookies
		 *  @name    value
		 *  @type    method
		 *  @access  public
		 *  @param   string key    [optional, an object containing all cookies is returned if omitted]
		 *  @param   string value  [optional, if no value is given the current value will be returned]
		 *  @param   int    expire [optional, default expire at the end of the session]
		 *  @param   string path   [optional, default the current path]
		 *  @param   string domain [optional, default the current domain]
		 *  @param   bool   secure [optional, default false]
		 *  @note    the syntax of setCookie is compatible with that of PHP's setCookie
		 *           this means that setting an empty value (string '' | null | false) or
		 *           an expiry time in the past, the cookie will be removed
		 *  @note    It is not possible to set httpOnly cookies from javascript (as this defies the purpose)
		 *  @return  void
		 */
		cookie.value = function(key, value, expire, path, domain, secure)
		{
			if (typeof key === undef)
				return jar;

			//  if a second argument (value) was given, we update the cookie
			if (arguments.length >= 2)
				setCookie(key, value, expire, path, domain, secure);

			return getCookie(key);
		};

		init();
	}


	/**
	 *  Storage object, a simple wrapper for localStorage
	 *  @module  storage
	 *  @note    available as konflux.storage / kx.storage
	 */
	function kxStorage()
	{
		/*jshint validthis: true*/
		var ls = this,
			maxSize = 2048,
			storage = typeof window.localStorage !== undef ? window.localStorage : false,
			fragmentPattern = /^\[fragment:([0-9]+),([0-9]+),([a-z0-9_]+)\]$/;

		/**
		 *  Combine stored fragments together into the original data string
		 *  @name    combineFragments
		 *  @type    function
		 *  @access  internal
		 *  @param   string data index
		 *  @return  string data combined
		 */
		function combineFragments(data)
		{
			var match, part, fragment, length, variable, i;

			if (data && (match = data.match(fragmentPattern)))
			{
				fragment = parseInt(match[1], 10);
				length   = parseInt(match[2], 10);
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
		function createFragments(name, data)
		{
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
		function dropFragments(match)
		{
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
		function getAll()
		{
			var result = null,
				i, key;

			if (storage)
			{
				result = {};
				for (i = 0; i < storage.length; ++i)
				{
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
		function getItem(name)
		{
			var data = storage ? storage.getItem(name) : false;

			if (data && data.match(fragmentPattern))
				data = combineFragments(data);

			if (data && data.match(/^[a-z0-9]+:.*$/i))
			{
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
		function setItem(name, data)
		{
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
		function remove(name)
		{
			var data, match;

			if (storage)
			{
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
		 *  @param   string name [optional, omit to get all stored entries]
		 *  @return  mixed  data
		 */
		ls.get = function(name)
		{
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
		ls.length = function()
		{
			return storage ? storage.length : false;
		};

		/**
		 *  Obtain all the keys
		 *  @name    keys
		 *  @type    method
		 *  @access  public
		 *  @return  Array  keys
		 */
		ls.keys = function()
		{
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
		ls.flush = function()
		{
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
		ls.size = function()
		{
			return unescape(encodeURIComponent(JSON.stringify(localStorage))).length;
		};
	}


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
		 *  Context wrapper, this is the actual 'canvas' which gets returned
		 *  @module  canvas
		 *  @name    kxCanvasContext
		 *  @type    module
		 *  @access  internal
		 *  @param   DOMElement canvas
		 *  @param   object default properties
		 *  @return  kxCanvasContext instance
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
				var property = combine(defaults || {}, {
						height: null, //  readonly
						width: null   //  readonly
					}),
					p;
				context.ctx2d = canvas.getContext('2d');

				//  relay all methods
				for (p in context.ctx2d)
					if (typeof context[p] !== 'function')
					{
						if (typeof context.ctx2d[p] === 'function')
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
					if (typeof value === undef)
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
					if (typeof value === undef)
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
				var arg = Array.prototype.slice.call(arguments),
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
				else if (typeof width === 'string' && percentage.test(width))
					width = Math.round(canvas.width * (parseInt(width, 10) / 100));

				if (height > 0 && height < 1)
					height = Math.round(canvas.height * height);
				else if (typeof height === 'string' && percentage.test(height))
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
				if (typeof target === 'string')
					target = document.getElementById(target);

				if (typeof target === 'object')
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
				if (typeof x === 'number')
					context.shadowOffsetX(x);
				if (typeof y === 'number')
					context.shadowOffsetY(y);
				if (typeof blur === 'number')
					context.shadowBlur(blur);
				if (typeof color !== undef)
					context.shadowColor(color);

				return context;
			};

			/**
			 *  Get/set the canvas' full dataURL
			 *  @name    drawImage
			 *  @type    method
			 *  @access  public
			 *  @param   image (Specifies the image, canvas, or video element to use)
			 *  @param   sourceX [optional. The x coordinate where to start clipping]
			 *  @param   sourceY [optional. The y coordinate where to start clipping]
			 *  @param   sourceWidth [optional. The width of the clipped image]
			 *  @param   sourceHeight [optional. The height of the clipped image]
			 *  @param   targetX [The x coordinate where to place the image on the canvas]
			 *  @param   targetY [The y coordinate where to place the image on the canvas]
			 *  @param   targetWidth [optional. The width of the image to use (stretch or reduce the image)]
			 *  @param   targetHeight [optional. The height of the image to use (stretch or reduce the image)]
			 *  @return  object kxCanvasContext
			 *  @note    This method is fully compatible with the native drawImage method:
			 *           https://developer.mozilla.org/en/docs/Web/API/CanvasRenderingContext2D#drawImage()
			 */
			context.drawImage = function()
			{
				var arg = Array.prototype.slice.call(arguments);

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
				var arg = Array.prototype.slice.call(arguments);

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
				context.beginPath();
				context.arc(p.x, p.y, radius, 0, Math.PI * 2, 1);
				context.closePath();

				return context;
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
			if (typeof mixed === 'number')
				mixed = canvas.create(mixed, arguments.length > 2 ? arguments[2] : mixed);

			if (mixed instanceof kxCanvasContext)
				return mixed.append(target);
			return false;
		};
	}


	//  expose object references
	konflux.point = kxPoint;

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
	konflux.breakpoint = new kxBreakpoint();
	konflux.cookie     = new kxCookie();
	konflux.storage    = new kxStorage();
	konflux.canvas     = new kxCanvas();

	//  make konflux available on the global (window) scope both as 'konflux' and 'kx'
	window.konflux = window.kx = konflux;
})(window);
