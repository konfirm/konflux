/*
 *       __    Konflux Cookie (version $DEV$ - $DATE$)
 *      /\_\
 *   /\/ / /   Copyright 2012-2015, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

//@dep: string
;(function(konflux) {
	'use strict';

	var version = '$DEV$ - $DATE$ - $COMMIT$';

	/**
	 *  Cookie object, making working with cookies a wee bit easier
	 *  @module  cookie
	 *  @note    available as konflux.cookie / kx.cookie
	 */
	function KonfluxCookie() {
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
		function init() {
			var part = document.cookie.split(';'),
				data;

			while (part.length) {
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
		 *  @param   int    expire [optional, default null - expire at the end of the session]
		 *  @param   string path   [optional, default null - the current path]
		 *  @param   string domain [optional, default null - the current domain]
		 *  @param   bool   secure [optional, default false - not secure]
		 *  @return  void
		 *  @note    the syntax of setCookie is compatible with that of PHP's setCookie
		 *           this means that setting an empty value (string '' | null | false) or
		 *           an expiry time in the past, the cookie will be removed
		 */
		function setCookie(key, value, expire, path, domain, secure) {
			var pairs = [key + '=' + (konflux.isType('number', value) ? value : value || '')],
				date;

			if (pairs[0].substr(-1) === '=') {
				expire = -1;
			}

			if (!konflux.isType('undefined', expire) && expire) {
				date = new Date(expire);
			}

			if (date) {
				if (date < (new Date()).getTime() && !konflux.isType('undefined', jar[key])) {
					delete jar[key];
				}

				pairs.push('expires=' + date);
			}

			if (!konflux.isType('undefined', path) && path) {
				pairs.push('path=' + path);
			}

			if (!konflux.isType('undefined', domain) && domain) {
				pairs.push('domain=' + domain);
			}

			if (!konflux.isType('undefined', secure) && secure) {
				pairs.push('secure');
			}

			document.cookie = pairs.join(';');
			if (document.cookie.indexOf(pairs.shift()) >= 0) {
				jar[key] = value + '';
			}
		}

		/**
		 *  Obtain a cookie value
		 *  @name    getCookie
		 *  @type    function
		 *  @access  internal
		 *  @param   string key
		 *  @return  void
		 */
		function getCookie(key) {
			return !konflux.isType('undefined', jar[key]) ? jar[key] : null;
		}

		//  expose
		/**
		 *  Get and/or set cookies
		 *  @name    value
		 *  @type    method
		 *  @access  public
		 *  @param   string key    [optional, default null - return all cookies]
		 *  @param   string value  [optional, default null - return current value]
		 *  @param   int    expire [optional, default null - expire at the end of the session]
		 *  @param   string path   [optional, default null - the current path]
		 *  @param   string domain [optional, default null - the current domain]
		 *  @param   bool   secure [optional, default false - not secure]
		 *  @note    the syntax of setCookie is compatible with that of PHP's setCookie
		 *           this means that setting an empty value (string '' | null | false) or
		 *           an expiry time in the past, the cookie will be removed
		 *  @note    It is not possible to set httpOnly cookies from javascript (as this defies the purpose)
		 *  @return  void
		 */
		cookie.value = function(key, value, expire, path, domain, secure) {
			if (konflux.isType('undefined', key)) {
				return jar;
			}

			//  if a second argument (value) was given, we update the cookie
			if (arguments.length >= 2) {
				setCookie(key, value, expire, path, domain, secure);
			}

			return getCookie(key);
		};

		init();
	}

	//  Append the cookie module to konflux
	konflux.cookie = KonfluxCookie;

})(window.konflux);
