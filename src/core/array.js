;(function(konflux) {

	/**
	 *  Array utils
	 *  @module  array
	 *  @note    available as konflux.array / kx.array
	 */
	function KonfluxArray() {
		'use strict';

		/*global type*/

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
		function contains(a, v) {
			for (var i = 0; i < a.length; ++i) {
				if (a[i] === v) {
					return i;
				}
			}

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
		function diff(a, b) {
			var ret = [],
				i;

			for (i = 0; i < a.length; ++i) {
				if (contains(b, a[i]) === false) {
					ret.push(a[i]);
				}
			}

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
		function range(a, b) {
			var r = [];
			b -= a;
			while (r.length <= b) {
				r.push(a + r.length);
			}

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
		function shuffle(a) {
			for (var j, x, i = a.length; i; j = (Math.random() * i) | 0, x = a[--i], a[i] = a[j], a[j] = x);
			return a;
		}

		/**
		 *  Cast given value to an array
		 *  @name    cast
		 *  @type    function
		 *  @access  internal
		 *  @param   mixed source
		 *  @return  array source (bool false if the cast could not be done)
		 *  @note    any scalar value will become an array holding that value (e.g. 'my string' becomes ['my string'])
		 */
		function cast(mixed) {
			var result = false,
				len, i;

			switch (konflux.type(mixed)) {
				case 'object':
					if (!('length' in mixed)) {
						result = [mixed];
						break;
					}

					try {
						result = Array.prototype.slice.call(mixed);
					}
					catch (e) {
						for (result = [], len = mixed.length, i = 0; i < len; ++i) {
							result.push(mixed[i]);
						}
					}

					break;

				case 'null':
				case 'undefined':
					result = [];
					break;

				default:
					result = [mixed];
					break;
			}

			return result;
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

		/**
		 *  Cast given value to an array
		 *  @name    cast
		 *  @type    method
		 *  @access  public
		 *  @param   mixed source
		 *  @return  array source (bool false if the cast could not be done)
		 *  @note    any scalar value will become an array holding that value (e.g. 'my string' becomes ['my string'])
		 */
		array.cast = cast;
	}

	konflux.register('array', new KonfluxArray());

})(konflux);
