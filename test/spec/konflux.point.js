describe('Konflux.point', function(){

	var point = konflux.point(10, 100);
	it('point ({x:10, y:100}) x = 10', function(){
		expect(point.x).toEqual(10);
	});
	it('point ({x:10, y:100}) y = 100', function(){
		expect(point.y).toEqual(100);
	});

});
