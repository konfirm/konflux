describe('Konflux.point', function(){

	it('point ({x:10, y:100}) x = 10', function(){
		var point = kx.point(10, 100);

		expect(point.x).toEqual(10);
		expect(point.y).toEqual(100);
	});

});
