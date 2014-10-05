describe('Konflux Core - basics', function(){

	it('has both the konflux and kx global object variables, which are equal', function(){
		expect(typeof konflux).toBe('object');
		expect(kx).toEqual(konflux);
	});

	//  kx.time
	it('provides the correct time', function(){
		expect(kx.time()).toEqual(new Date().getTime());
	});

	//  kx.elapsed
	it('properly formats and tracks elapsed time', function(done){
		//  we expect the elapsed to be anywhere between 00:00:00.000 and 00:00:00.999
		expect(kx.elapsed()).toMatch(/00:00:00\.[0-9]{3}/);

		setTimeout(function(){
			//  we expect the elapsed to be anywhere between 00:00:01.000 and 00:00:02.999
			expect(kx.elapsed()).toMatch(/00:00:0[1-2]\.[0-9]{3}/);

			done();
		}, 1000);
	});

	//  kx.unique
	it('creates truely unique keys', function(){
		var unique = kx.unique(),
			iterators = 2000,
			i;

		for (i = 0; i < iterators; ++i)
		{
			expect(unique).not.toEqual(kx.unique());
			expect(kx.unique()).not.toEqual(kx.unique());
		}
	});

	describe('Combining variables', function(){

		it('combine {a:1} into {a:1}', function(){
			expect(kx.combine({a:1})).toEqual({a:1});
		});

		it('combine {}, {a:1} into {a:1}', function(){
			expect(kx.combine({}, {a:1})).toEqual({a:1});
		});

		it('combine {a:1}, {a:null,b:2} into {a:null, b:2}', function(){
			expect(kx.combine({a:1}, {a:null,b:2})).toEqual({a:null,b:2});
		});

		it('combines {a:4}, {a:3, b:2}, {b:1}, {a:2}, {a:1} into {a:1,b:1}', function(){
			expect(kx.combine({a:4}, {a:3, b:2}, {b:1}, {a:2}, {a:1})).toEqual({a:1,b:1});
		});

	});

	describe('testing for empty values', function(){

		it('empty: null', function(){
			expect(kx.empty(null)).toEqual(true);
		});

		it('not empty: "null"', function(){
			expect(kx.empty("null")).toEqual(false);
		});

		it('empty: false', function(){
			expect(kx.empty(false)).toEqual(true);
		});

		it('not empty: "false"', function(){
			expect(kx.empty("false")).toEqual(false);
		});

		it('not empty: true', function(){
			expect(kx.empty(true)).toEqual(false);
		});

		it('empty: "" ', function(){
			expect(kx.empty("")).toEqual(true);
		});

		it('not empty: " " ', function(){
			expect(kx.empty(" ")).toEqual(false);
		});

		it('empty: 0', function(){
			expect(kx.empty(0)).toEqual(true);
		});

		it('empty: "0"', function(){
			expect(kx.empty("0")).toEqual(true);
		});

		it('empty: 0.0', function(){
			expect(kx.empty(0.0)).toEqual(true);
		});

		it('not empty: "0.0"', function(){
			expect(kx.empty("0.0")).toEqual(false);
		});

		it('empty: {}', function(){
			expect(kx.empty({})).toEqual(true);
		});

		it('not empty: {a:""}', function(){
			expect(kx.empty({a:""})).toEqual(false);
		});

		it('empty: []', function(){
			expect(kx.empty([])).toEqual(true);
		});

		it('not empty: [0]', function(){
			expect(kx.empty([0])).toEqual(false);
		});

		it('empty: null, false, {}, [], 0, "", "0"', function(){
			expect(kx.empty(null, false, {}, [], 0, "")).toEqual(true);
		});

		it('not empty: "null", false, {}, [], 0, "", "0"', function(){
			expect(kx.empty("null", false, {}, [], 0, "")).toEqual(false);
		});

		it('not empty: null, "false", {}, [], 0, "", "0"', function(){
			expect(kx.empty(null, "false", {}, [], 0, "")).toEqual(false);
		});

		it('not empty: null, false, "{}", [], 0, "", "0"', function(){
			expect(kx.empty(null, false, "{}", [], 0, "")).toEqual(false);
		});

		it('not empty: null, false, {0:0}, [], 0, "", "0"', function(){
			expect(kx.empty(null, false, {0:0}, [], 0, "")).toEqual(false);
		});

		it('not empty: null, false, {}, "[]", 0, "", "0"', function(){
			expect(kx.empty(null, false, {}, "[]", 0, "")).toEqual(false);
		});

		it('not empty: null, false, {}, [0], 0, "", "0"', function(){
			expect(kx.empty(null, false, {}, [0], 0, "")).toEqual(false);
		});

		it('not empty: null, false, {}, [], 1, "", "0"', function(){
			expect(kx.empty(null, false, {}, [], 1, "")).toEqual(false);
		});

		it('not empty: null, false, {}, [], -1, "", "0"', function(){
			expect(kx.empty(null, false, {}, [], -1, "")).toEqual(false);
		});

		it('empty: null, false, {}, [], 0.0, "", "0"', function(){
			expect(kx.empty(null, false, {}, [], 0.0, "")).toEqual(true);
		});

		it('empty: null, false, {}, [], 0.0, "", "0"', function(){
			expect(kx.empty(null, false, {}, [], 0.0, "")).toEqual(true);
		});

	});

	describe('Basic type determination', function(){
		function A(){}
		function B(){}
		B.prototype.test = function(){};

		it('recognises array types', function(){
			expect(kx.type([])).toBe('array');
			expect(kx.type(''.split(''))).toBe('array');
			expect(kx.type(Array(10).join('-'))).not.toBe('array');
			expect(kx.type({})).not.toBe('array');
		});

		it('recognises object types', function(){
			expect(kx.type({})).toBe('object');
			expect(kx.type({a:'b'})).toBe('object');
			expect(kx.type(new A())).toBe('object');
			expect(kx.type(new B())).toBe('object');
		});

		it('recognises string types', function(){
			expect(kx.type('the quick brown fox')).toBe('string');
			expect(kx.type('jumps over the lazy dog')).toBe('string');
		});

		it('recognises number types', function(){
			expect(kx.type(0)).toBe('number');
			expect(kx.type(0.0)).toBe('number');
			expect(kx.type(1)).toBe('number');
			expect(kx.type(1.2)).toBe('number');
			expect(kx.type(-1)).toBe('number');
			expect(kx.type(-1.2)).toBe('number');
			expect(kx.type(Math.PI)).toBe('number');
			expect(kx.type(Math.PI | 0)).toBe('number');
			expect(kx.type(parseInt(Math.PI))).toBe('number');
		});

		it('recognises boolean types', function(){
			expect(kx.type(false)).toBe('boolean');
			expect(kx.type(true)).toBe('boolean');
		});

		it('recognises null types', function(){
			expect(kx.type(null)).toBe('null');
		});

		it('recognises undefined types', function(){
			expect(kx.type(undefined)).toBe('undefined');
			expect(kx.type()).toBe('undefined');
		});
	});

	describe('Strong type determination', function(){
		function C(){}
		function D(){}
		D.prototype.test = function(){};

		it('recognises array types', function(){
			expect(kx.type([], true)).toBe('array');
			expect(kx.type(''.split(''), true)).toBe('array');
			expect(kx.type(Array(10).join('-'), true)).not.toBe('array');
			expect(kx.type({}, true)).not.toBe('array');
		});

		it('recognises object types', function(){
			expect(kx.type({}, true)).toBe('object');
			expect(kx.type({a:'b'}, true)).toBe('object');
			expect(kx.type(new C(), true)).toBe('C');
			expect(kx.type(new D(), true)).toBe('D');
		});

		it('recognises string types', function(){
			expect(kx.type('the quick brown fox', true)).toBe('string');
			expect(kx.type('jumps over the lazy dog', true)).toBe('string');
		});

		it('recognises number types', function(){
			expect(kx.type(0, true)).toBe('number');
			expect(kx.type(0.0, true)).toBe('number');
			expect(kx.type(1, true)).toBe('number');
			expect(kx.type(1.2, true)).toBe('number');
			expect(kx.type(-1, true)).toBe('number');
			expect(kx.type(-1.2, true)).toBe('number');
			expect(kx.type(Math.PI, true)).toBe('number');
			expect(kx.type(Math.PI | 0, true)).toBe('number');
			expect(kx.type(parseInt(Math.PI), true)).toBe('number');
		});

		it('recognises boolean types', function(){
			expect(kx.type(false, true)).toBe('boolean');
			expect(kx.type(true, true)).toBe('boolean');
		});

		it('recognises null types', function(){
			expect(kx.type(null, true)).toBe('null');
		});

		it('recognises undefined types', function(){
			expect(kx.type(undefined, true)).toBe('undefined');
		});
	});

	describe('Basic type comparison', function(){
		function A(){}
		function B(){}
		B.prototype.test = function(){};

		it('recognises array types', function(){
			expect(kx.isType('array', [])).toBe(true);
			expect(kx.isType('array', ''.split(''))).toBe(true);
			expect(kx.isType('array', Array(10).join('-'))).not.toBe(true);
			expect(kx.isType('array', {})).not.toBe(true);

			expect(kx.isType('arr', [])).toBe(true);
			expect(kx.isType('arr', ''.split(''))).toBe(true);
			expect(kx.isType('arr', Array(10).join('-'))).not.toBe(true);
			expect(kx.isType('arr', {})).not.toBe(true);

			expect(kx.isType('a', [])).toBe(true);
			expect(kx.isType('a', ''.split(''))).toBe(true);
			expect(kx.isType('a', Array(10).join('-'))).not.toBe(true);
			expect(kx.isType('a', {})).not.toBe(true);
		});

		it('recognises object types', function(){
			expect(kx.isType('object', {})).toBe(true);
			expect(kx.isType('object', {a:'b'})).toBe(true);
			expect(kx.isType('object', new A())).toBe(true);
			expect(kx.isType('object', new B())).toBe(true);

			expect(kx.isType('A', new A())).toBe(true);
			expect(kx.isType('B', new B())).toBe(true);

			expect(kx.isType('obj', {})).toBe(true);
			expect(kx.isType('obj', {a:'b'})).toBe(true);
			expect(kx.isType('obj', new A())).toBe(true);
			expect(kx.isType('obj', new B())).toBe(true);

			expect(kx.isType('o', {})).toBe(true);
			expect(kx.isType('o', {a:'b'})).toBe(true);
			expect(kx.isType('o', new A())).toBe(true);
			expect(kx.isType('o', new B())).toBe(true);

		});

		it('recognises string types', function(){
			expect(kx.isType('string', 'the quick brown fox')).toBe(true);
			expect(kx.isType('string', 'jumps over the lazy dog')).toBe(true);

			expect(kx.isType('str', 'the quick brown fox')).toBe(true);
			expect(kx.isType('str', 'jumps over the lazy dog')).toBe(true);

			expect(kx.isType('s', 'the quick brown fox')).toBe(true);
			expect(kx.isType('s', 'jumps over the lazy dog')).toBe(true);
		});

		it('recognises number types', function(){
			expect(kx.isType('number', 0)).toBe(true);
			expect(kx.isType('integer', 0)).toBe(true);
			expect(kx.isType('float', 0)).toBe(false);
			expect(kx.isType('number', 0.0)).toBe(true);
			expect(kx.isType('integer', 0.0)).toBe(true);
			expect(kx.isType('float', 0.0)).toBe(false);
			expect(kx.isType('number', 1)).toBe(true);
			expect(kx.isType('integer', 1)).toBe(true);
			expect(kx.isType('float', 1)).toBe(false);
			expect(kx.isType('number', 1.2)).toBe(true);
			expect(kx.isType('integer', 1.2)).toBe(false);
			expect(kx.isType('float', 1.2)).toBe(true);

			expect(kx.isType('num', 0)).toBe(true);
			expect(kx.isType('int', 0)).toBe(true);
			expect(kx.isType('fl', 0)).toBe(false);
			expect(kx.isType('num', 0.0)).toBe(true);
			expect(kx.isType('int', 0.0)).toBe(true);
			expect(kx.isType('fl', 0.0)).toBe(false);
			expect(kx.isType('num', 1)).toBe(true);
			expect(kx.isType('int', 1)).toBe(true);
			expect(kx.isType('fl', 1)).toBe(false);
			expect(kx.isType('num', 1.2)).toBe(true);
			expect(kx.isType('int', 1.2)).toBe(false);
			expect(kx.isType('fl', 1.2)).toBe(true);

			expect(kx.isType('n', 0)).toBe(true);
			expect(kx.isType('i', 0)).toBe(true);
			expect(kx.isType('f', 0)).toBe(false);
			expect(kx.isType('n', 0.0)).toBe(true);
			expect(kx.isType('i', 0.0)).toBe(true);
			expect(kx.isType('f', 0.0)).toBe(false);
			expect(kx.isType('n', 1)).toBe(true);
			expect(kx.isType('i', 1)).toBe(true);
			expect(kx.isType('f', 1)).toBe(false);
			expect(kx.isType('n', 1.2)).toBe(true);
			expect(kx.isType('i', 1.2)).toBe(false);
			expect(kx.isType('f', 1.2)).toBe(true);
		});

		it('recognises boolean types', function(){
			expect(kx.isType('boolean', false)).toBe(true);
			expect(kx.isType('boolean', true)).toBe(true);

			expect(kx.isType('bool', false)).toBe(true);
			expect(kx.isType('bool', true)).toBe(true);

			expect(kx.isType('b', false)).toBe(true);
			expect(kx.isType('b', true)).toBe(true);
		});

		it('recognises null types', function(){
			expect(kx.isType('object', null)).toBe(false);
			expect(kx.isType('null', null)).toBe(true);

			expect(kx.isType('obj', null)).toBe(false);
			expect(kx.isType('n', null)).toBe(true);

			expect(kx.isType('o', null)).toBe(false);
		});

		it('recognises undefined types', function(){
			expect(kx.isType('undefined', undefined)).toBe(true);
			expect(kx.isType('undefined')).toBe(true);

			expect(kx.isType('undef', undefined)).toBe(true);
			expect(kx.isType('undef')).toBe(true);

			expect(kx.isType('u', undefined)).toBe(true);
			expect(kx.isType('u')).toBe(true);
		});
	});

});
