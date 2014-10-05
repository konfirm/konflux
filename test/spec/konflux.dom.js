describe('Konflux.select', function(){

	it('select("body")[0] = document.body', function(){
		expect(konflux.select("body")[0]).toEqual(document.body);
	});

	it('select("body").next() = document.body', function(){
		expect(konflux.select("body").next()).toEqual(document.body);
	});

	it('select("script").length = document.getElementsByTagName("script").length', function(){
		expect(konflux.select("script").length).toEqual(document.getElementsByTagName("script").length);
	});

	it('select("meh").length = 0', function(){
		expect(konflux.select("meh").length).toEqual(0);
	});

});
