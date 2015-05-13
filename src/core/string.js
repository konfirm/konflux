;(function(konflux) {

	/**
	 *  String utils
	 *  @module  string
	 *  @note    available as konflux.string / kx.string
	 */
	function KonfluxString() {
		'use strict';

		/*global konflux*/

		/*jshint validthis: true*/
		var string = this;

		//  'constants'
		string.PAD_LEFT    = 1;
		string.PAD_BOTH    = 2;
		string.PAD_RIGHT   = 3;
		string.TRIM_LEFT   = 1;
		string.TRIM_BOTH   = 2;
		string.TRIM_RIGHT  = 3;
		string.CHUNK_START = 1;
		string.CHUNK_END   = 2;


		/**
		 *  Javascript port of Java's String.hashCode()
		 *  (Based on http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/)
		 *  @name    hashCode
		 *  @type    function
		 *  @access  internal
		 *  @param   string input
		 *  @return  number hash (32bit integer)
		 */
		function hashCode(s) {
			for (var r = 0, i = 0, l = s.length; i < l; ++i) {
				r  = (r = r * 31 + s.charCodeAt(i)) & r;
			}

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
		function hash(s) {
			var p = 16,
				pad = ('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' + s).substr(-(Math.ceil((s.length || 1) / p) * p)),
				r = 0;

			while (pad.length) {
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
		function ord(s) {
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
		function chr(n) {
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
		function pad(s, n, c, t) {
			c = new Array(n + 1).join(c);

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
		function checksum(s) {
			for (var n = s.length, r = 0; n > 0; --n) {
				r += n * ord(s[n]);
			}

			return Math.abs((r + '' + s.length) | 0).toString(36);
		}

		/**
		 *  Generate a UUID
		 *  @name    uuid
		 *  @type    function
		 *  @access  internal
		 *  @return  string uuid
		 */
		function uuid() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0;

				return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
			});
		}

		/**
		 *  Split given string into chunks of given size
		 *  @name    chunk
		 *  @type    function
		 *  @access  internal
		 *  @param   string input
		 *  @param   int    size [optional, default 1]
		 *  @param   bool   end [optional, default false - start from the beginning of the input string]
		 *  @return  array chunks
		 *  @note    the last chunk is provided as is, there for it can be of a length less than given size
		 */
		function chunk(input, size, end) {
			var source = '' + input,
				output = [],
				i;

			if (!size || size === 1) {
				output = source.split('');
			}
			else if (input.length < size) {
				output.push(input);
			}
			else if (end) {
				for (i = source.length; i > 0; output.unshift(source.substr(i -= Math.min(source.length, size))), source) {
					source = source.substring(0, i);
				}
			}
			else {
				while (source.length > 0, output.push(source.substring(0, size)), source) {
					source = source.substr(size);
				}
			}

			return output;
		}

		/**
		 *  Convert characters based on their ASCII value
		 *  @name    ascii
		 *  @type    function
		 *  @access  internal
		 *  @param   string input
		 *  @param   object conversion (syntax: {replacement: [ASCII value, ASCII value, ...]})
		 *  @return  string converted
		 */
		function ascii(input, convert) {
			var result = [],
				i, p, s;

			for (i = 0; i < input.length; ++i) {
				s = input.substr(i, 1);
				for (p in convert) {
					if (konflux.array.contains(convert[p], s.charCodeAt(0)) !== false) {
						s = p;
						break;
					}
				}

				result.push(s);
			}

			return result.join('');
		}

		/**
		 *  Convert characters based on their ASCII value
		 *  @name    ascii
		 *  @type    method
		 *  @access  public
		 *  @param   string input
		 *  @param   object conversion (syntax: {replacement: [ASCII value, ASCII value, ...]} - optional, default high ASCII characters)
		 *  @return  string converted
		 */
		string.ascii = function(input, user) {
			return ascii(input, user || {
				A: [192, 193, 194, 195, 196, 197],
				C: [199],
				E: [200, 201, 202, 203],
				I: [204, 205, 206, 207],
				D: [208],
				N: [209],
				O: [210, 211, 212, 213, 214, 216],
				U: [217, 218, 219, 220],
				Y: [221],
				ss: [223],
				a: [224, 225, 226, 227, 228, 229],
				beta: [946],
				c: [231],
				e: [232, 233, 234, 235],
				i: [236, 237, 238, 239],
				n: [241],
				o: [240, 242, 243, 244, 245, 246],
				u: [249, 250, 251, 252],
				y: [253]
			});
		};

		/**
		 *  Trim string from leading/trailing pattern (whitespace by default)
		 *  @name    trim
		 *  @type    method
		 *  @access  public
		 *  @param   string input
		 *  @param   string character [default \s, may be the contents of a regular expression pattern]
		 *  @param   int    side [optional, One of: TRIM_BOTH (default), TRIM_LEFT, TRIM_RIGHT]
		 *  @return  string trimmed
		 *  @note    the side params are located in konflux.string (e.g. konflux.string.TRIM_LEFT)
		 */
		string.trim = function(input, chr, dir) {
			var chars = chr || ' \n\r\t\f',
				f, t;

			for (t = input.length; t > 0 && dir !== string.TRIM_LEFT && chars.indexOf(input.charAt(--t)) >= 0;);
			for (f = 0; f < t && dir !== string.TRIM_RIGHT && chars.indexOf(input.charAt(f)) >= 0; ++f);

			return input.substring(f, t + 1);
		};


		/**
		 *  Reverse given string
		 *  @name    reverse
		 *  @type    method
		 *  @access  public
		 *  @param   string input
		 *  @return  string reversed
		 */
		string.reverse = function(s) {
			for (var n = s.length, r = ''; n > 0; --n) {
				r += s[n];
			}

			return r;
		};

		/**
		 *  Pad a string
		 *  @name    pad
		 *  @type    method
		 *  @access  public
		 *  @param   string to pad
		 *  @param   number length
		 *  @param   string pad string [optional, default ' ' - a space]
		 *  @param   int type [optional, default PAD_RIGHT - add padding to the right. One of: PAD_LEFT, PAD_RIGHT (default), PAD_BOTH]
		 *  @return  string padded
		 *  @note    the type params are located in konflux.string (e.g. konflux.string.PAD_LEFT)
		 */
		string.pad = function(s, n, c, t) {
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
		string.ucFirst = function(input) {
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

		/**
		 *  Divide the given input string into chunks of certain size
		 *  @name    chunk
		 *  @type    method
		 *  @access  public
		 *  @param   string input
		 *  @param   int    size [optional, default 1]
		 *  @param   int    direction [optional, default CHUNK_START - start the chunks from the start, one of: CHUNK_START, CHUNK_END]
		 *  @return  array chunks
		 *  @note    the last chunk is provided as is, there for it can be of a length less than given size
		 */
		string.chunk = function(input, size, start) {
			return chunk(input, size || 1, start === string.CHUNK_END);
		};

		/**
		 *  Prepare given input string for use in a regular expression
		 *  @name    escapeRegExp
		 *  @type    method
		 *  @access  public
		 *  @param   string input
		 *  @param   string delimiter [optional, default null - no delimeter to consider]
		 *  @return  string escaped
		 */
		string.escapeRegExp = function(input, delimeter) {
			var chars = '.\\+*?[^]$(){}=!<>|:-'.split(''),
				pattern = new RegExp('[' + chars.concat(delimeter ? [delimeter] : []).join('\\') + ']', 'g');

			return konflux.isType('string', input) ? input.replace(pattern, '\\$&') : '';
		};
	}

	konflux.register('string', new KonfluxString());

})(konflux);
