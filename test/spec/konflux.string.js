describe('Konflux.String', function() {
	var ws = ' \ttest\r\n\t ',
		dot = '..test..';

	it('trim', function(){
		expect(kx.string.trim(ws)).toEqual('test');
		expect(kx.string.trim(dot)).toEqual(dot);
	});

	it('trim speficied character', function(){
		expect(kx.string.trim(ws, ' ')).toEqual('\ttest\r\n\t');
		expect(kx.string.trim(dot, ' ')).toEqual(dot);

		expect(kx.string.trim(ws, '.')).toEqual(ws);
		expect(kx.string.trim(dot, '.')).toEqual('test');
	});

	it('trim, unspecified character, TRIM_BOTH', function(){
		expect(kx.string.trim(ws, null, kx.string.TRIM_BOTH)).toEqual('test');
		expect(kx.string.trim(dot, null, kx.string.TRIM_BOTH)).toEqual(dot);
	});

	it('trim, specified character, TRIM_BOTH', function(){
		expect(kx.string.trim(ws, ' ', kx.string.TRIM_BOTH)).toEqual('\ttest\r\n\t');
		expect(kx.string.trim(dot, ' ', kx.string.TRIM_BOTH)).toEqual(dot);

		expect(kx.string.trim(ws, '.', kx.string.TRIM_BOTH)).toEqual(ws);
		expect(kx.string.trim(dot, '.', kx.string.TRIM_BOTH)).toEqual('test');
	});

	it('trim, unspecified character, TRIM_LEFT', function(){
		expect(kx.string.trim(ws, null, kx.string.TRIM_LEFT)).toEqual('test\r\n\t ');
		expect(kx.string.trim(dot, null, kx.string.TRIM_LEFT)).toEqual(dot);
	});

	it('trim, specified character, TRIM_LEFT', function(){
		expect(kx.string.trim(ws, ' ', kx.string.TRIM_LEFT)).toEqual('\ttest\r\n\t ');
		expect(kx.string.trim(dot, ' ', kx.string.TRIM_LEFT)).toEqual(dot);

		expect(kx.string.trim(ws, '.', kx.string.TRIM_LEFT)).toEqual(ws);
		expect(kx.string.trim(dot, '.', kx.string.TRIM_LEFT)).toEqual('test..');
	});

	it('trim, unspecified character, TRIM_RIGHT', function(){
		expect(kx.string.trim(ws, null, kx.string.TRIM_RIGHT)).toEqual(' \ttest');
		expect(kx.string.trim(dot, null, kx.string.TRIM_RIGHT)).toEqual(dot);
	});

	it('trim, specified character, TRIM_RIGHT', function(){
		expect(kx.string.trim(ws, ' ', kx.string.TRIM_RIGHT)).toEqual(' \ttest\r\n\t');
		expect(kx.string.trim(dot, ' ', kx.string.TRIM_RIGHT)).toEqual(dot);

		expect(kx.string.trim(ws, '.', kx.string.TRIM_RIGHT)).toEqual(ws);
		expect(kx.string.trim(dot, '.', kx.string.TRIM_RIGHT)).toEqual('..test');
	});
});
