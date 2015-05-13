/**
 *  Browser/feature detection
 *  @module  browser
 *  @note    available as konflux.browser / kx.browser
 */
function KonfluxBrowser() {
	'use strict';

	/*global konflux, window, document, navigator*/

	/*jshint validthis: true*/
	var browser = this,
		support = {
			touch: 'ontouchstart' in window || 'msMaxTouchPoints' in navigator
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
	function detectIE() {
		//  https://gist.github.com/527683 (Conditional comments only work for IE 5 - 9)
		var node = document.createElement('div'),
			check = node.getElementsByTagName('i'),
			version = 4;

		//  Starting with IE 4 (as version is incremented before first use), an <i> element is added to
		//  the 'node' element surrounded by conditional comments. The 'check' variable is automatically updated
		//  to contain all <i> elements. These elements are not there if the browser does not support conditional
		//  comments or does not match the IE version
		//  Note that there are two conditions for the while loop; the innerHTML filling and the check, the while
		//  loop itself has no body (as it is closed off by a semi-colon right after declaration)
		while (node.innerHTML = '<!--[if gt IE ' + version + ']><i></i><![endif]-->', check.length && version < 10) {
			++version;
		}

		//  Added IE's @cc_on trickery for browser which do not support conditional comments (such as IE10)
		version = version > 4 ? version : /*jshint evil: true */Function('/*@cc_on return document.documentMode;@*/return false')()/*jshint evil: false */;

		//  IE11 removed the @cc_on syntax, so we need to go deeper
		return version ? version : ('-ms-ime-align' in document.documentElement.style ? 11 : false);
	}

	/**
	 *  Determine whether or not the browser has given feature in either the window or document scope
	 *  @name    hasFeature
	 *  @type    function
	 *  @access  internal
	 *  @param   string   feature
	 *  @return  boolean  has feature
	 */
	function hasFeature(feature) {
		return !konflux.isType('undefined', support[feature]) ? support[feature] : feature in window || feature in document;
	}

	/**
	 *  Obtain a specific feature from the browser, be it the native property or the vendor prefixed property
	 *  @name    getFeature
	 *  @type    function
	 *  @access  internal
	 *  @param   mixed    feature [one of: string feature or array with string features]
	 *  @param   array    scope(s) [optional, default null - global scopes]
	 *  @return  mixed    feature (false if it doesn't exist)
	 */
	function getFeature(feature, scope) {
		var vendor = vendorPrefix(),
			//  the objects to search for the feature
			object = scope ? scope : [
				window,
				document,
				navigator
			],
			search = [],
			uc, i;

		if (!(feature instanceof Array)) {
			feature = [feature];
		}

		for (i = 0; i < feature.length; ++i) {
			uc = konflux.string.ucFirst(feature[i]);
			search = search.concat([
				feature[i],
				vendor + uc,
				vendor.toLowerCase() + uc
			]);
		}

		while (search.length) {
			feature = search.shift();

			for (i = 0; i < object.length; ++i) {
				if (feature in object[i]) {
					return object[i][feature];
				}
			}
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
	function vendorPrefix() {
		var vendor = ['Icab', 'Khtml', 'O', 'ms', 'Moz', 'webkit'],
			regex  = new RegExp('^(' + vendor.join('|') + ')(?=[A-Z])'),
			script = document.createElement('script'),
			p;

		//  try to find any vendor prefixed style property on our script node
		for (p in script.style) {
			if (regex.test(p)) {
				prefix = p.match(regex).shift();
				break;
			}
		}

		//  as a last resort, try to see if the <pre>Opacity property exists
		while (!prefix && vendor.length) {
			p = vendor.pop();
			if (p + 'Opacity' in script.style) {
				prefix = p;
			}
		}

		script = null;

		return prefix;
	}

	/**
	 *  Verify if the browser at hand is any version of Internet Explorer (4+)
	 *  @name    ie
	 *  @type    method
	 *  @access  public
	 *  @param   number min version [optional, default null - obtain the version number]
	 *  @return  mixed (boolean false if not IE (or not minimal version), version number if IE)
	 *  @see     detectIE
	 *  @note    this public implementation caches the result
	 */
	browser.ie = function(min) {
		if (konflux.isType('undefined', ieVersion)) {
			ieVersion = detectIE();
		}

		return min && ieVersion ? ieVersion < min : ieVersion;
	};

	/**
	 *  Obtain the vendor prefix for the current browser
	 *  @name    prefix
	 *  @type    method
	 *  @access  public
	 *  @return  string prefix
	 *  @note    this public implementation caches the result
	 */
	browser.prefix = function() {
		if (!prefix) {
			prefix = vendorPrefix();
		}

		return prefix;
	};

	/**
	 *  Obtain a specific feature from the browser
	 *  @name    feature
	 *  @type    method
	 *  @access  public
	 *  @param   mixed    feature [one of: string feature or array with string features]
	 *  @param   mixed    scope(s) [optional, default null - global scopes]
	 *  @return  mixed    feature (false if it doesn't exist)
	 *  @note    this method attempts to search for the native feature and falls back onto vendor prefixed features
	 */
	browser.feature = function(feature, scope) {
		if (scope && !(scope instanceof Array)) {
			scope = [scope];
		}

		return getFeature(feature, scope);
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
	browser.supports = function() {
		var r = true,
			i = arguments.length;

		//  test all the features given
		while (r && --i >= 0) {
			r = r && hasFeature(arguments[i]);
		}

		return r;
	};

	/**
	 *  Enable the HTML5 fullscreen mode for given element
	 *  @name    fullscreen
	 *  @type    method
	 *  @access  public
	 *  @param   DOMNode target [optional, default document.documentElement]
	 *  @return  bool    success
	 *  @note    this method is highly experimental
	 */
	browser.fullscreen = function(target) {
		var check = ['fullScreen', 'isFullScreen'],
			vendor = browser.prefix().toLowerCase(),
			method, i;

		if (!target) {
			target = document.documentElement;
		}

		for (i = 0, method = null; i < check.length, method === null; ++i) {
			method = check[i] in document ? check[i] : vendor + konflux.string.ucFirst(check[i]);
			if (!(method in document)) {
				method = null;
			}
		}

		vendor = method.match(new RegExp('^' + vendor)) ? vendor : null;
		vendor = (vendor || (document[method] ? 'cancel' : 'request')) + konflux.string.ucFirst((vendor ? (document[method] ? 'cancel' : 'request') : '') + konflux.string.ucFirst(check[0]));

		(document[method] ? document : target)[vendor](target.ALLOW_KEYBOARD_INPUT || null);
	};
}
