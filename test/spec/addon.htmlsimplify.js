describe('Konflux.HTMLSimplify', function() {
	var simplifier = new kx.htmlsimplify({
			selector: ['div', 'span', 'p', 'strike', 'code', 'u'],
			style: [
				{property: 'text-decoration', value: 'line-through', replace: 'strike'},
				{property: 'text-decoration', value: 'underline', allow: ['a'], replace: 'underline'}
			],
			replace: {
				strike: 'strike',
				underline: 'u'
			}
		});

	it('removes unnecessary spans', function() {
		var html = 'some <span>nifty setup</span>';

		expect(simplifier.clean(html)).toEqual('some nifty setup');
	});

	it('cleans up classes', function() {
		var html = [
				'some <span class="nifty setup">nifty setup</span>',
				'some <a href="/path/to/file" class="nifty setup">nifty setup</a>',
			];

		expect(simplifier.clean(html[0])).toEqual('some nifty setup');
		expect(simplifier.clean(html[1])).toEqual('some <a href="/path/to/file">nifty setup</a>');
	});

	it('replaces strike', function() {
		var html = 'some <span style="text-decoration: line-through;">striked</span> text';

		expect(simplifier.clean(html)).toEqual('some <strike>striked</strike> text');
	});

	it('replaces strike, adds underline', function() {
		var html = 'some <span style="text-decoration: line-through;">striked</span> and <span style="text-decoration: underline;">underlined</span> text';

		expect(simplifier.clean(html)).toEqual('some <strike>striked</strike> and <u>underlined</u> text');
	});

	it('preserves the outer div element', function() {
		var html = '<div>Test<div>more test</div><br> And even more text</div>';

		expect(simplifier.clean(html)).toEqual('<div>Test<div>more test</div><br> And even more text</div>');
	});
});
