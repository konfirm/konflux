describe('Konflux.iterator', function(){

	it('Array ([1, 12, 123, 1234]) as collection', function(){
		var coll = [1, 12, 123, 1234],
			test = konflux.iterator(coll),
			c;

		//  direct access (still discouraged..)
		//  should not move the cursor
		c = test.cursor();
		expect(c).toEqual(0);
		expect(test[1]).toEqual(12);
		expect(test[3]).toEqual(1234);
		expect(test.item(1)).toEqual(12);
		expect(test.item(3)).toEqual(1234);
		expect(test.cursor()).toEqual(c);

		//  walking
		//  this does move the cursor
		expect(test.next()).toEqual(1);
		expect(test.next()).toEqual(12);
		expect(test.next()).toEqual(123);
		expect(test.cursor()).toEqual(2);

		//  move the cursor directly
		expect(test.cursor(1)).toEqual(1);
		//  walk
		expect(test.next()).toEqual(123);
		expect(test.next()).toEqual(1234);
		expect(test.cursor()).toEqual(3);

		//  exceeding the boundaries, should not move the cursor
		expect(test.cursor(-100)).toEqual(3);
		expect(test.cursor(100)).toEqual(3);

		//  we should still be at '1234' (cursor: 3)
		expect(test.current()).toEqual(1234);
		expect(test.cursor()).toEqual(3);

		//  we cannot step to the next
		expect(test.next()).toEqual(false);
		expect(test.next()).toEqual(false);
		expect(test.next()).toEqual(false);
		//  lost the current
		expect(test.current()).toEqual(false);

		//  stepping back bring us to the end
		expect(test.prev()).toEqual(1234);
		expect(test.prev()).toEqual(123);
		expect(test.prev()).toEqual(12);
		expect(test.previous()).toEqual(1);

		//  we cannot step beyond the start
		expect(test.previous()).toEqual(false);
		//  the cursor, however, is now negative
		expect(test.cursor()).toEqual(-1);

		//  we should have 4 numeric keys, 0-3
		expect(test.keys()).toEqual([0,1,2,3]);
		//  the collection should be the same as the 'coll' we started with
		expect(test.collection()).toEqual(coll);

		//  we add an entry to the collection
		expect(test.add(12345).length).toEqual(5);
		//  now the collection should not be the same as 'coll' (an iterator collection is not treated by reference)
		expect(test.collection()).not.toEqual(coll);
		//  we expect the keys to have received an new one, 4
		expect(test.keys()).toEqual([0,1,2,3,4]);

		expect(test[4]).toEqual(12345);
		expect(test.item(4)).toEqual(12345);

		//  as the cursor should not have moved, we should be at position 1 after we move to the next
		expect(test.next()).toEqual(1);
		expect(test.next()).toEqual(12);
		expect(test.next()).toEqual(123);
		expect(test.next()).toEqual(1234);
		expect(test.next()).toEqual(12345);

		//  we ought to be at the last entry '12345'
		expect(test.current()).toEqual(12345);
		//  there is no next
		expect(test.next()).toEqual(false);
		expect(test.cursor()).toEqual(test.length);
		//  as we have walked out of the collection, there no longer is a current
		expect(test.current()).toEqual(false);
	});

	it('Object ({a:1, b:12, c:123, d:1234}) as collection', function(){
		var coll = {a:1, b:12, c:123, d:1234},
			test = konflux.iterator(coll),
			c;

		//  direct access (still discouraged..)
		//  should not move the cursor

		c = test.cursor();
		expect(c).toEqual('a');
		expect(test['a']).toEqual(1);
		expect(test['c']).toEqual(123);
		expect(test.a).toEqual(1);
		expect(test.c).toEqual(123);
		expect(test.item('a')).toEqual(1);
		expect(test.item('c')).toEqual(123);
		expect(test.cursor()).toEqual(c);

		//  this does move the cursor
		expect(test.next()).toEqual(1);
		expect(test.next()).toEqual(12);
		expect(test.next()).toEqual(123);
		expect(test.cursor()).toEqual('c');

		expect(test.next()).toEqual(1234);
		expect(test.current()).toEqual(1234);
		expect(test.cursor()).toEqual('d');

		expect(test.prev()).toEqual(123);
		expect(test.prev()).toEqual(12);
		expect(test.previous()).toEqual(1);
		expect(test.previous()).toEqual(false);

		expect(test.cursor('b')).toEqual('b');

	});

	it('String as collection', function(){
		var coll = 'The quick brown fox',
			test = konflux.iterator(coll),
			c;

		//  we expect the string to have been shrinkwrapped into an array, so it should be an array with one single item

		c = test.cursor();
		expect(c).toEqual(0);
		expect(test.length).toEqual(1);
		expect(test[0]).toEqual(coll);

	});

	it('Number as collection', function(){
		var coll = Math.PI,
			test = konflux.iterator(coll),
			c;

		//  we expect the number to have been shrinkwrapped into an array, so it should be an array with one single item

		c = test.cursor();
		expect(c).toEqual(0);
		expect(test.length).toEqual(1);
		expect(test[0]).toEqual(coll);

	});

	it('each', function(){
		var range = ['a', 'b', 'c', 'd', 'e', 'f'],
			obj = {a:1, b:2, c:3, d:4, e:5, f:6},
			n;

		n = '';
		kx.iterator(range).each(function(value){n += value;});
		expect(n).toEqual('abcdef');

		n = '';
		kx.iterator(obj).each(function(value, key){n += key;});
		expect(n).toEqual('abcdef');

		n = '';
		kx.iterator(obj).each(function(value, key){n += value;});
		expect(n).toEqual('123456');
	});

	it('filters', function(){
		var range = ['a', 'b', 'c', 'd', 'e', 'f'];

		expect(
			kx.iterator(range).filter(function(value){return value === 'c';}).collection()
		).toEqual(['c']);
	});

});
