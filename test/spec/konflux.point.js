describe('Konflux.point', function(){

	it('point ({x:10, y:100})', function(){
		var point = kx.point(10, 100);

		expect(point.x).toEqual(10);
		expect(point.y).toEqual(100);
	});

	it('moves to', function(){
		var point = kx.point(10, 10);

		point.to(25, 25);
		expect(point.x).toEqual(25);
		expect(point.y).toEqual(25);

		point.to(125.75, 125.75);
		expect(point.x).toEqual(125.75);
		expect(point.y).toEqual(125.75);
	});

	it('moves by', function(){
		var point = kx.point(10, 10);

		point.move(25, 25);
		expect(point.x).toEqual(35);
		expect(point.y).toEqual(35);

		point.move(-5, -10);
		expect(point.x).toEqual(30);
		expect(point.y).toEqual(25);
	});

	it('snaps to grid', function(){
		var point = kx.point(125.75, 125.75);

		point.snap();
		expect(point.x).toEqual(126);
		expect(point.y).toEqual(126);

		point.to(125.75, 125.75);
		point.snap(5);
		expect(point.x).toEqual(125);
		expect(point.y).toEqual(125);

		point.to(127.75, 122.50);
		point.snap(5);
		expect(point.x).toEqual(130);
		expect(point.y).toEqual(125);
	});

	it('clones', function(){
		var point = kx.point(15, 15),
			clone = point.clone();

		expect(clone.x).toEqual(15);
		expect(clone.y).toEqual(15);

		clone.to(10, 10);

		//  clone should be at 10, 10
		expect(clone.x).toEqual(10);
		expect(clone.y).toEqual(10);
		//  point should still be at 15, 15
		expect(point.x).toEqual(15);
		expect(point.y).toEqual(15);
	});

	it('equals', function(){
		var point = kx.point(15, 15),
			clone = point.clone();

		expect(clone.equal(point)).toEqual(true);
		expect(point.equal(clone)).toEqual(true);

		expect(clone.equal(point, true)).toEqual(true);
		expect(point.equal(clone, true)).toEqual(true);

		point.move(0.1, 0.2);
		expect(clone.equal(point)).toEqual(false);
		expect(point.equal(clone)).toEqual(false);
		expect(clone.equal(point, true)).toEqual(true);
		expect(point.equal(clone, true)).toEqual(true);
	});

	it('scales', function(){
		var point = kx.point(15, 15);

		point.scale(10);
		expect(point.x).toEqual(150);
		expect(point.y).toEqual(150);
	});

	it('subtracts', function(){
		var point = kx.point(15, 15),
			target = point.subtract(kx.point(10, 5));

		expect(target.x).toEqual(5);
		expect(target.y).toEqual(10);
	});

	it('adds', function(){
		var point = kx.point(15, 15),
			target = point.add(kx.point(10, 5));

		expect(target.x).toEqual(25);
		expect(target.y).toEqual(20);
	});

	it('gets distance', function(){
		var a = kx.point(15, 15),
			b = a.add(a);

		expect(b.x).toEqual(30);
		expect(b.y).toEqual(30);

		expect(Math.round(b.distance(a))).toEqual(21);

		b = b.subtract(kx.point(0, 15));
		expect(b.x).toEqual(30);
		expect(b.y).toEqual(15);

		expect(b.distance(a)).toEqual(15);
	});

	it('gets angle', function(){
		var a = kx.point(15, 15),
			b = a.add(a);

		expect(b.x).toEqual(30);
		expect(b.y).toEqual(30);

		expect(b.angle(a)).toEqual(-Math.PI * 0.75);

		b = b.subtract(kx.point(0, 15));
		expect(b.x).toEqual(30);
		expect(b.y).toEqual(15);

		expect(b.angle(a)).toEqual(-Math.PI * 0.5);
	});

	it('mins and maxes', function(){
		var a = kx.point(15, 15),
			b = kx.point(5, 25),
			max = a.max(b),
			min = a.min(b);

		expect(max.x).toEqual(15);
		expect(max.y).toEqual(25);
		expect(min.x).toEqual(5);
		expect(min.y).toEqual(15);

		max = b.max(a);
		min = b.min(a);

		expect(max.x).toEqual(15);
		expect(max.y).toEqual(25);
		expect(min.x).toEqual(5);
		expect(min.y).toEqual(15);
	});

	it('iso\'s', function(){
		var a = kx.point(150, 50),
			iso = a.iso(45);

		expect(iso.x).toEqual(100);
		expect(Math.round(iso.y)).toEqual(157);

		iso = a.iso(30);
		expect(iso.x).toEqual(100);
		expect(Math.round(iso.y)).toEqual(105);

		iso = a.iso(60);
		expect(iso.x).toEqual(100);
		expect(Math.round(iso.y)).toEqual(209);

		iso = a.iso(15);
		expect(iso.x).toEqual(100);
		expect(Math.round(iso.y)).toEqual(52);
	});

	it('mids', function(){
		var a = kx.point(100, 100),
			b = kx.point(200, 200),
			mid = a.mid(b);

		expect(mid.x).toEqual(150);
		expect(mid.y).toEqual(150);
	});

});
