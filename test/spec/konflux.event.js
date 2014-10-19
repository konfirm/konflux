describe('Konflux.event', function(){
	var verify = 'foo';

	it('kx.ready returns true after page load', function(done){

		expect(konflux.ready(function(){
			verify = 'bar';

			done();
		})).toEqual(true);

	});

	it('the ready event still triggered, even if the page was already loaded', function(){
		expect(verify).toEqual('bar');
	});

	it('sends the deprecated message for listen', function(){
		spyOn(console, 'info');
		spyOn(console, 'warn');
		spyOn(console, 'log');
		konflux.event.listen();

		if ('info' in console)
			expect(console.info).toHaveBeenCalled();
		else if ('warn' in console)
			expect(console.warn).toHaveBeenCalled();
		else
			expect(console.log).toHaveBeenCalled();
	});

	it('sends the deprecated message for live', function(){
		spyOn(console, 'info');
		spyOn(console, 'warn');
		spyOn(console, 'log');
		konflux.event.live();

		if ('info' in console)
			expect(console.info).toHaveBeenCalled();
		else if ('warn' in console)
			expect(console.warn).toHaveBeenCalled();
		else
			expect(console.log).toHaveBeenCalled();
	});

	it('hasTouch does not contradict konflux.browser.supports("touch")', function(){
		expect(konflux.event.hasTouch()).toEqual(konflux.browser.supports('touch'));
	});


	describe('Custom events', function(){
		it('custom event on document.body', function(done){
			var triggers = 0;

			konflux.event.add(document.body, 'CustomTest', function(e){
				++triggers;
			});

			setTimeout(function(){
				konflux.event.trigger(document.body, 'CustomTest');
				expect(triggers).toEqual(1);

				konflux.event.remove(document.body, 'CustomTest');
				//  should have no effect on 'triggers'
				konflux.event.trigger(document.body, 'CustomTest');

				expect(triggers).toEqual(1);

				done();
			}, 10);
		});

		it('namespaced custom events on document.body', function(done){
			var triggers = 0;

			function pump(e)
			{
				++triggers;
			}

			konflux.event.add(document.body, 'CustomTest.a', pump);
			konflux.event.add(document.body, 'CustomTest.b, CustomTest.c', pump);

			setTimeout(function(){
				konflux.event.trigger(document.body, 'CustomTest');
				expect(triggers).toEqual(3);

				konflux.event.remove(document.body, 'CustomTest.b');
				//  triggering it now should add only two triggers
				konflux.event.trigger(document.body, 'CustomTest');
				expect(triggers).toEqual(5);


				done();
			}, 10);
		});

		it('namespaced custom event removal', function(done){
			var triggers = 0;

			function pump(e)
			{
				++triggers;
			}

			function pump2(e)
			{
				++triggers;
			}

			konflux.event.add(document.body, 'CustomTest.a, CustomTest.b, CustomTest.c', pump);
			konflux.event.add('body', 'CustomTest.d, CustomTest.e', pump2);
			konflux.event.add(window, 'CustomTest.d, CustomTest.e', pump2);

			setTimeout(function(){
				konflux.event.trigger(document.body, 'CustomTest');
				expect(triggers).toEqual(5);

				konflux.event.trigger(window, 'CustomTest');
				expect(triggers).toEqual(7);

				konflux.event.remove(pump);
				//  this should have removed all three 'CustomTest' handlers from document.body
				//  triggering it now should add two triggers
				konflux.event.trigger(document.body, 'CustomTest');
				expect(triggers).toEqual(9);

				konflux.event.remove('body', pump2);
				//  this should remove any event using pump2 from the body
				//  triggering it now on body should add no triggers
				konflux.event.trigger(document.body, 'CustomTest');
				expect(triggers).toEqual(9);

				done();
			}, 10);
		});
	});
});
