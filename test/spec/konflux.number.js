describe('Konflux.number', function(){

	//  parity
	it('odd and even', function(){
		//  simple integers
		expect(konflux.number.even(1)).toEqual(false);
		expect(konflux.number.even(2)).toEqual(true);
		expect(konflux.number.odd(1)).toEqual(true);
		expect(konflux.number.odd(2)).toEqual(false);

		//  integers in strings
		expect(konflux.number.even("121")).toEqual(false);
		expect(konflux.number.even("342")).toEqual(true);
		expect(konflux.number.odd("689")).toEqual(true);
		expect(konflux.number.odd("234")).toEqual(false);

		//  floats
		expect(konflux.number.odd(1.1)).toEqual(false);
		expect(konflux.number.even(2.1)).toEqual(false);
		expect(konflux.number.odd(.1)).toEqual(false);
		expect(konflux.number.even(.2)).toEqual(false);

		//  floats in strings
		expect(konflux.number.odd("3231.1")).toEqual(false);
		expect(konflux.number.even("42134.123")).toEqual(false);
		expect(konflux.number.odd(".1")).toEqual(false);
		expect(konflux.number.even(".2")).toEqual(false);

		//  Built-in constants (PI being a float, infinity being... well... infinite)
		expect(konflux.number.odd(Math.PI)).toEqual(false);
		expect(konflux.number.even(Math.PI)).toEqual(false);
		expect(konflux.number.odd(Infinity)).toEqual(false);
		expect(konflux.number.even(Infinity)).toEqual(false);

		//  Engineer numbers
		expect(konflux.number.even(.01e3)).toEqual(true);
		expect(konflux.number.odd(.07e2)).toEqual(true);
		expect(konflux.number.even(".09e5")).toEqual(true);
		expect(konflux.number.odd(".03e2")).toEqual(true);
	});


	//  Between
	it ('between', function(){
		//  simple integers
		expect(konflux.number.between(1, 0, 2)).toEqual(true);
		expect(konflux.number.between(1, 1, 2)).toEqual(true);
		expect(konflux.number.between(1, 0, 1)).toEqual(true);
		expect(konflux.number.between(1, 1, 1)).toEqual(true);

		//  mixed strings and integers
		expect(konflux.number.between("10", 0, 20)).toEqual(true);
		expect(konflux.number.between("10", "0", 20)).toEqual(true);
		expect(konflux.number.between("10", 0, "20")).toEqual(true);
		expect(konflux.number.between("13", "7", "14")).toEqual(true);

		//  Built-in constants
		expect(konflux.number.between(Math.PI, 3, "4")).toEqual(true);
		expect(konflux.number.between(7, false, Infinity)).toEqual(true);
		expect(konflux.number.between(7, Infinity, false)).toEqual(true);
		expect(konflux.number.between(7, Infinity)).toEqual(false);
		expect(konflux.number.between(.5, false, true)).toEqual(true);

		//  Engineer numbers
		expect(konflux.number.between(.5e5, 0, 10000)).toEqual(false);
		expect(konflux.number.between(.5e5, 0, 50000)).toEqual(true);
		expect(konflux.number.between(.5e5, 0, 10000)).toEqual(false);
		expect(konflux.number.between(.5e5, 0, 50000)).toEqual(true);
	});


	//  format
	it('formatting', function(){

		//  formatting without precision
		expect(konflux.number.format(12)).toEqual("12");
		expect(konflux.number.format("12")).toEqual("12");

		expect(konflux.number.format(1234)).toEqual("1234");
		expect(konflux.number.format("1234")).toEqual("1234");

		expect(konflux.number.format(123456)).toEqual("123456");
		expect(konflux.number.format("123456")).toEqual("123456");

		expect(konflux.number.format(1234.56)).toEqual("1234");
		expect(konflux.number.format("1234.56")).toEqual("1234");
		expect(konflux.number.format("1234,56")).toEqual("1234");

		expect(konflux.number.format(1234.56789)).toEqual("1234");
		expect(konflux.number.format("1234.56789")).toEqual("1234");
		expect(konflux.number.format("1234,56789")).toEqual("1234");


		//  formatting with precision
		expect(konflux.number.format(12, 2)).toEqual("12.00");
		expect(konflux.number.format(1234, 3)).toEqual("1234.000");

		expect(konflux.number.format(1234.56789, 4)).toEqual("1234.5679");
		expect(konflux.number.format("1234.56789", 2)).toEqual("1234.57");
		expect(konflux.number.format("1234,56789", 1)).toEqual("1234.6");

		//  formatting with precision, decimal separator and thousands separator
		expect(konflux.number.format(12, 2, ",", ".")).toEqual("12,00");
		expect(konflux.number.format(1234, 3, ",", ".")).toEqual("1.234,000");
		expect(konflux.number.format(1234.56789, 4, ",", ".")).toEqual("1.234,5679");
		expect(konflux.number.format("1234.56789", 2, ",", "")).toEqual("1234,57");
		expect(konflux.number.format("1234,56789", 1, ",", "")).toEqual("1234,6");

		//  formatting with precision, decimal separator (omiting thousands separator)
		expect(konflux.number.format(12, 2, ",")).toEqual("12,00");
		expect(konflux.number.format(1234, 3, ",")).toEqual("1,234,000");
		expect(konflux.number.format(1234.56789, 4, ",")).toEqual("1,234,5679");
		expect(konflux.number.format("1234.56789", 2, ",")).toEqual("1,234,57");
		expect(konflux.number.format("1234,56789", 1, ",")).toEqual("1,234,6");

		//  larger number
		expect(konflux.number.format(4321234.56789, 2, ".")).toEqual("4,321,234.57");
		expect(konflux.number.format(4321234.56789, 2, ".", " ")).toEqual("4 321 234.57");
		expect(konflux.number.format(4321234.56789, 6, ",", ".")).toEqual("4.321.234,567890");
		expect(konflux.number.format("4321234.56789", 2, ",", "")).toEqual("4321234,57");
		expect(konflux.number.format("4321234,56789", 1)).toEqual("4321234.6");
	});


});
