describe('Konflux.dom', function(){

	describe('select', function(){

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

	describe('appendTo', function(){
		var isolate = document.createElement('div');

		function truncate(target)
		{
			while (target.firstChild)
				target.removeChild(target.firstChild);
		}

		it('finds the target using querySelector', function(){
			var target = document.getElementById('domtarget'),
				result = konflux.dom.appendTo('#domtarget', "found it");

			expect(result.nodeType).toEqual(3);
			expect(result.nodeValue).toEqual('found it');
			expect(result.parentNode).toEqual(target);

			truncate(target);
		});

		it('creates a textNode from string', function(){
			var result = konflux.dom.appendTo(isolate, 'foo');

			expect(result.nodeType).toEqual(3);
			expect(result.nodeValue).toEqual('foo');
			expect(result.parentNode).toEqual(isolate);

			truncate(isolate);
		});

		it('creates a textNode from numbers', function(){
			var result = konflux.dom.appendTo(isolate, Math.PI);

			expect(result.nodeType).toEqual(3);
			expect(result.nodeValue).toEqual('' + Math.PI);
			expect(result.parentNode).toEqual(isolate);

			truncate(isolate);
		});

		it('creates a textNode from boolean', function(){
			var result = konflux.dom.appendTo(isolate, true);

			expect(result.nodeType).toEqual(3);
			expect(result.nodeValue).toEqual('true');
			expect(result.parentNode).toEqual(isolate);


			result = konflux.dom.appendTo(isolate, false);

			expect(result.nodeType).toEqual(3);
			expect(result.nodeValue).toEqual('false');
			expect(result.parentNode).toEqual(isolate);

			truncate(isolate);
		});

		it('Creates multiple elements from array', function(){
			var list = konflux.dom.appendTo(isolate, ["one", 2, false, true]);

			expect(list.length).toEqual(4);

			expect(list[0].nodeType).toEqual(3);
			expect(list[0].nodeValue).toEqual('one');
			expect(list[0].parentNode).toEqual(isolate);

			expect(list[1].nodeType).toEqual(3);
			expect(list[1].nodeValue).toEqual('2');
			expect(list[1].parentNode).toEqual(isolate);

			expect(list[2].nodeType).toEqual(3);
			expect(list[2].nodeValue).toEqual('false');
			expect(list[2].parentNode).toEqual(isolate);

			expect(list[3].nodeType).toEqual(3);
			expect(list[3].nodeValue).toEqual('true');
			expect(list[3].parentNode).toEqual(isolate);

			truncate(isolate);
		});

		it('Creates DIV-element from empty object', function(){
			var struct = konflux.dom.appendTo(isolate, {});

			expect(struct.nodeType).toEqual(1);
			expect(struct.nodeName).toEqual('DIV');  //  the default behavior (in HTML nodeNames are always returned uppercased)
			expect(struct.parentNode).toEqual(isolate);

			truncate(isolate);
		});

		it('Creates named-element from object {name:"span"}', function(){
			var struct = konflux.dom.appendTo(isolate, {name:'span'});

			expect(struct.nodeType).toEqual(1);
			expect(struct.nodeName).toEqual('SPAN');
			expect(struct.parentNode).toEqual(isolate);

			truncate(isolate);
		});

		it('Creates element by from object {tag:"h3"}', function(){
			var struct = konflux.dom.appendTo(isolate, {tag:'h3'});

			expect(struct.nodeType).toEqual(1);
			expect(struct.nodeName).toEqual('H3');
			expect(struct.parentNode).toEqual(isolate);

			truncate(isolate);
		});

		it('Creates custom element from object {tag:"custom-element"}', function(){
			var struct = konflux.dom.appendTo(isolate, {name:'custom-element'});

			expect(struct.nodeType).toEqual(1);
			expect(struct.nodeName).toEqual('CUSTOM-ELEMENT');
			expect(struct.parentNode).toEqual(isolate);

			truncate(isolate);
		});

		it('Creates named-element with id from object {name:"span", id:"hello"}', function(){
			var struct = konflux.dom.appendTo(isolate, {name:'span', id:'hello'});

			expect(struct.nodeType).toEqual(1);
			expect(struct.nodeName).toEqual('SPAN');
			expect(struct.hasAttribute('id')).toEqual(true);
			expect(struct.getAttribute('id')).toEqual('hello');
			expect(struct.parentNode).toEqual(isolate);

			//  no truncate!
		});

		it('References node (selected by name) from object {name:"#hello", "class": "nifty example"}', function(){
			var struct = isolate.querySelector('#hello');

			//  if a selector is provided as nodeName, there will no element be created, but instead it becomes the target
			//  this means we expect it to be modified
			expect(konflux.dom.appendTo(isolate, {name:'#hello', 'class': 'nifty example'})).toEqual(struct);

			//  repeat the tests
			expect(struct.nodeType).toEqual(1);
			expect(struct.nodeName).toEqual('SPAN');
			expect(struct.hasAttribute('id')).toEqual(true);
			expect(struct.getAttribute('id')).toEqual('hello');
			expect(struct.parentNode).toEqual(isolate);

			//  and test for the new attribute
			expect(struct.hasAttribute('class')).toEqual(true);
			expect(struct.getAttribute('class')).toEqual('nifty example');

			truncate(isolate);
		});

		it('Creates named-element with id from object {name:"span", child:[1, {name: "strong", id: "hulk", content: "example"}, "three"]}', function(){
			var struct = konflux.dom.appendTo(isolate, {name:'span', child:[1, {name: 'strong', id: 'hulk', content: 'example'}, 'three']}),
				child;

			expect(struct.nodeType).toEqual(1);
			expect(struct.nodeName).toEqual('SPAN');
			expect(struct.parentNode).toEqual(isolate);
			expect(struct.childNodes.length).toEqual(3);

			child = struct.childNodes;

			expect(child[0].nodeType).toEqual(3);
			expect(child[0].nodeName).toEqual('#text');
			expect(child[0].nodeValue).toEqual('1');

			expect(child[1].nodeType).toEqual(1);
			expect(child[1].nodeName).toEqual('STRONG');
			expect(child[1].childNodes.length).toEqual(1);
			expect(child[1].firstChild.nodeType).toEqual(3);
			expect(child[1].firstChild.nodeName).toEqual('#text');
			expect(child[1].firstChild.nodeValue).toEqual('example');
			expect(child[1].hasAttribute('id')).toEqual(true);
			expect(child[1].getAttribute('id')).toEqual('hulk');

			expect(child[2].nodeType).toEqual(3);
			expect(child[2].nodeName).toEqual('#text');
			expect(child[2].nodeValue).toEqual('three');


			truncate(isolate);
		});

	});

	describe('reference', function(){
		it('does not polute window, document, documentElement, head or body', function(){
			expect(konflux.dom.reference(window)).toEqual('window');
			expect(konflux.dom.reference(document)).toEqual('document');
			expect(konflux.dom.reference(document.documentElement)).toEqual('root');
			expect(konflux.dom.reference(document.head)).toEqual('head');
			expect(konflux.dom.reference(document.body)).toEqual('body');
			expect(document.body.getAttribute('data-kxref')).toEqual(null);
		});

		it('does not do anything for non DOM-elements', function(){
			expect(konflux.dom.reference()).toEqual(false);
			expect(konflux.dom.reference({})).toEqual(false);
			expect(konflux.dom.reference(document.createTextNode('foo'))).toEqual(false);
		});

		it('has consistent references but differs per unique element', function(){
			var list = document.querySelectorAll('*'),
				reference = [],
				ref, i;

			for (i = 0; i < list.length; ++i)
			{
				ref = konflux.dom.reference(list[i]);
				expect(reference.join(',').indexOf(ref)).toEqual(-1);
				reference[i] = ref;
			}

			for (i = 0; i < list.length; ++i)
				expect(konflux.dom.reference(list[i])).toEqual(reference[i]);

		});
	});

	describe('contains', function(){
		it('body in documentElement', function(){
			expect(konflux.dom.contains(document.documentElement, document.body)).toEqual(true);
		});

		it('not documentElement in body', function(){
			expect(konflux.dom.contains(document.body, document.documentElement)).toEqual(false);
		});
	});

	describe('stackOrderIndex', function(){
		it('has constants', function(){
			expect(konflux.dom.STACK_NEGATIVE).toEqual(1);
			expect(konflux.dom.STACK_BLOCK).toEqual(2);
			expect(konflux.dom.STACK_FLOAT).toEqual(4);
			expect(konflux.dom.STACK_INLINE).toEqual(8);
			expect(konflux.dom.STACK_POSITIONED).toEqual(16);
			expect(konflux.dom.STACK_POSITIVE).toEqual(32);
			expect(konflux.dom.STACK_GLOBAL).toEqual(64);
		});

		it('documentElement to equal {type: konflux.dom.STACK_BLOCK, index: 0, context: false}', function(){
			var stack = konflux.dom.stackLevel(document.documentElement);

			expect(stack.index).toEqual(0);
			expect(stack.context).toEqual(false);

			expect(stack.type & konflux.dom.STACK_NEGATIVE).toEqual(0);
			expect(stack.type & konflux.dom.STACK_BLOCK).toEqual(konflux.dom.STACK_BLOCK);
			expect(stack.type & konflux.dom.STACK_FLOAT).toEqual(0);
			expect(stack.type & konflux.dom.STACK_INLINE).toEqual(0);
			expect(stack.type & konflux.dom.STACK_POSITIONED).toEqual(0);
			expect(stack.type & konflux.dom.STACK_POSITIVE).toEqual(0);
			expect(stack.type & konflux.dom.STACK_GLOBAL).toEqual(0);
		});

		it('head to equal {type: 8, index: 0, context: false}', function(){
			var stack = konflux.dom.stackLevel(document.head);

			expect(stack.index).toEqual(0);
			expect(stack.context).toEqual(false);

			expect(stack.type & konflux.dom.STACK_NEGATIVE).toEqual(0);
			expect(stack.type & konflux.dom.STACK_BLOCK).toEqual(0);
			expect(stack.type & konflux.dom.STACK_FLOAT).toEqual(0);
			expect(stack.type & konflux.dom.STACK_INLINE).toEqual(konflux.dom.STACK_INLINE);
			expect(stack.type & konflux.dom.STACK_POSITIONED).toEqual(0);
			expect(stack.type & konflux.dom.STACK_POSITIVE).toEqual(0);
			expect(stack.type & konflux.dom.STACK_GLOBAL).toEqual(0);
		});

		it('body to equal {type: konflux.dom.STACK_BLOCK, index: 0, context: false}', function(){
			var stack = konflux.dom.stackLevel(document.body);

			expect(stack.index).toEqual(0);
			expect(stack.context).toEqual(false);

			expect(stack.type & konflux.dom.STACK_NEGATIVE).toEqual(0);
			expect(stack.type & konflux.dom.STACK_BLOCK).toEqual(konflux.dom.STACK_BLOCK);
			expect(stack.type & konflux.dom.STACK_FLOAT).toEqual(0);
			expect(stack.type & konflux.dom.STACK_INLINE).toEqual(0);
			expect(stack.type & konflux.dom.STACK_POSITIONED).toEqual(0);
			expect(stack.type & konflux.dom.STACK_POSITIVE).toEqual(0);
			expect(stack.type & konflux.dom.STACK_GLOBAL).toEqual(0);
		});
	});
});
