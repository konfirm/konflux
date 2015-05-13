;(function(konflux) {

	/**
	 *  Number utils
	 *  @module  number
	 *  @note    available as konflux.number / kx.number
	 */
	function KonfluxNumber() {
		'use strict';

		/*global konflux*/

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
		number.even = function(input) {
			input = +input;

			return (input | 0) === input && input % 2 === 0;
		};

		/**
		 *  Test wheter given input is an odd number
		 *  @name    odd
		 *  @type    method
		 *  @access  public
		 *  @param   number input
		 *  @return  bool odd
		 */
		number.odd = function(input) {
			input = +input;

			return (input | 0) === input && !number.even(input);
		};

		/**
		 *  Test wheter given input lies between the low and high values (including the low and high values)
		 *  @name    between
		 *  @type    method
		 *  @access  public
		 *  @param   number input
		 *  @param   number a
		 *  @param   number b
		 *  @return  bool between
		 */
		number.between = function(input, a, b) {
			input = +input;
			a     = +a;
			b     = +b;

			return input >= Math.min(a, b) && input <= Math.max(a, b);
		};

		/**
		 *  Format a number with a given set of decimal length, decimals separator and/or thousands separator
		 *  @name    format
		 *  @type    method
		 *  @access  public
		 *  @param   number input
		 *  @param   number decimals [optional, default 0 - no precision]
		 *  @param   string decimals separator [optional, default '.']
		 *  @param   string thousands separator [optional, default ',']
		 *  @return  string formatted number
		 *  @note    this method is compatible with PHP's number_format function, it either accepts 2 or 4 arguments
		 */
		number.format = function(input, precision, point, separator) {
			var multiplier = precision ? Math.pow(10, precision) : 0;

			//  check whether default values need to be assigned
			point     = !konflux.isType('undefined', point) ? point : '.';
			separator = !konflux.isType('undefined', separator) || arguments.length < 3 ? separator : ',';
			//  format the number
			input = +(('' + input).replace(/[,\.]+/, '.'));
			//  round the last desired decimal
			input = multiplier > 0 ? Math.round(input * multiplier) / multiplier : input;
			//  split input into int value and decimal value
			input = ('' + (!isFinite(input) ? 0 : +input)).split('.');

			//  apply thousands separator, if applicable (number length exceeds 3 and we have a non-empty separator)
			if (input[0].length > 3 && separator && separator !== '') {
				input[0] = konflux.string.chunk(input[0], 3, konflux.string.CHUNK_END).join(separator);
			}

			return input[0] + (precision > 0 ? point + konflux.string.pad(input[1] || '', precision, '0', konflux.string.PAD_RIGHT) : '');
		};
	}

	konflux.register('number', new KonfluxNumber());

})(konflux);
