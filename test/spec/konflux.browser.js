describe('Konflux.browser', function(){

	it('IE', function(){
		expect(konflux.browser.ie(20)).toBe(false);
		expect(typeof konflux.browser.ie()).toBe('boolean');
	});

	it('prefix', function(){
		expect(konflux.browser.prefix()).toMatch(/^o|ms|moz|icab|khtml|webkit$/i);
	});

	it('support', function(){
		expect(konflux.browser.supports('getElementById', 'getElementsByTagName')).not.toEqual(false);
		expect(konflux.browser.supports('kxFluff', 'never gonna happen')).toEqual(false);
	});

	it('feature', function(){
		expect(typeof konflux.browser.feature('getElementById')).toEqual('function');
		expect(typeof konflux.browser.feature('getElementsByTagName')).toEqual('function');
	});

	it('unknown feature', function(){
		expect(konflux.browser.feature('kxFluff' + konflux.unique())).toEqual(false);
	});

	describe('per browser requestAnimationFrame', function(){
		switch (konflux.browser.prefix().toLowerCase())
		{
			case 'o':
				it('opera-features', function(){
					expect(konflux.browser.feature('requestAnimationFrame')).toEqual(window.requestAnimationFrame || window.oRequestAnimationFrame || false);
				});
				break;

			case 'ms':
				it('ms-features', function(){
					expect(konflux.browser.feature('requestAnimationFrame')).toEqual(window.requestAnimationFrame || window.msRequestAnimationFrame || false);
				});
				break;

			case 'moz':
				it('moz-features', function(){
					expect(konflux.browser.feature('requestAnimationFrame')).toEqual(window.requestAnimationFrame || window.mozRequestAnimationFrame || false);
				});
				break;

			case 'webkit':
				it('webkit-features', function(){
					expect(konflux.browser.feature('requestAnimationFrame')).toEqual(window.requestAnimationFrame || window.webkitRequestAnimationFrame || false);
				});
				break;
		}
	});

});
