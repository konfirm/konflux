describe('Konflux.Array', function() {
	var A = [1, 2, 3, 4, 'string', null, 6, 7, {b: {c:1}}],
		B = ['string', {a: 1}, undefined, 4, 5, 'string', 7, 8, 9];

	it('contains', function() {
		expect(kx.array.contains(A, 4)).toEqual(3);
		expect(kx.array.contains(A, 10)).toBe(false);
		expect(kx.array.contains(A, null)).toEqual(5);
		expect(kx.array.contains(A, {b:{c:1}})).toEqual(false);
		expect(kx.array.contains(B, 'string')).toEqual(0);
		expect(kx.array.contains(B, {a: 1})).toEqual(false);
	});

	it('diff', function() {
		expect(kx.array.diff(A, B)).toEqual([1, 2, 3, null, 6, {b: {c:1}}]);
		expect(kx.array.diff(B, A)).toEqual([{a: 1}, undefined, 5, 8, 9]);
	});

	it('range', function() {
		var range = kx.array.range(1,100),
			i;

		expect(kx.array.range(1,2)).toEqual([1,2]);
		expect(range.length).toEqual(100);

		for (i = 0; i < range.length; i += 5) {
			expect(range[i]).toBe(i + 1);
		}
	});

	it('shuffle', function() {
		expect(kx.array.shuffle(A).sort()).toEqual(A.sort());
		expect(kx.array.shuffle(A)).not.toEqual(kx.array.shuffle([1, 2, 3, 4, 'string', null, 6, 7]));

		spyOn(kx.array, 'shuffle');
		kx.array.shuffle();
		expect(kx.array.shuffle).toHaveBeenCalled();
	});

	it('cast', function() {
		expect(kx.array.cast('test')).toEqual(['test']);
		expect(kx.array.cast(A)).toEqual([A]);
		expect(kx.array.cast({a:1, b: {c:2}})).toEqual([{a:1, b: {c:2}}]);
		expect(kx.array.cast(A, 4, B)).toEqual([A]);
		expect(kx.array.cast(null)).toEqual([]);
		expect(kx.array.cast(undefined)).toEqual([]);
	});
});
