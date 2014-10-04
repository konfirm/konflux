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
		it('recognises array types', function(){
			expect(kx.type([])).toBe('array');
			expect(kx.type(''.split(''))).toBe('array');
			expect(kx.type(Array(10).join('-'))).not.toBe('array');
			expect(kx.type({})).not.toBe('array');
		});
	});

	describe('Strong type determination', function(){
		it('recognises number types', function(){
			expect(kx.type(0, true)).toBe('integer');
			expect(kx.type(0.0, true)).toBe('integer');
			expect(kx.type(1.2, true)).toBe('float');
		});
	});

});
