/**
 *  Handle URL's/URI's
 *  @module  url
 *  @note    available as konflux.url / kx.url
 */
function kxURL() {
	'use strict';

	/*global window, isType, undef*/

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
		while (prop.length) {
			result[prop.shift()] = match.length ? match.shift() : '';
		}

		if (result.query) {
			result.query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(a, b, c) {
				if (!isType('object', result.query)) {
					result.query = {};
				}

				if (b) {
					result.query[b] = c;
				}
			});
		}

		return result;
	}

	/**
	 *  The parsed url for the URL of the current page
	 *  @name    current
	 *  @type    object
	 *  @access  public
	 */
	url.current = !isType(undef, window.location.href) ? parse(window.location.href) : false;

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
