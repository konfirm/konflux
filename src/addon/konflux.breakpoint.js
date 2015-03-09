/*
 *       __    Konflux Breakpoint (version $DEV$ - $DATE$)
 *      /\_\
 *   /\/ / /   Copyright 2012-2015, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

/*jshint undef: true, curly: false, browser: true, newcap: false*/
//@dep: dom, browser, observer
;(function(konflux){
	'use strict';

	var version = '$DEV$';


	/**
	 *  Breakpoint object, add/remove classes on specified object (or body) when specific browser dimensions are met
	 *  (triggers observations when viewport dimensions change)
	 *  @module  breakpoint
	 *  @note    available as konflux.breakpoint / kx.breakpoint
	 */
	function kxBreakpoint()
	{
		/*jshint validthis: true*/
		var breakpoint = this,
			stack = {},
			tick = false,
			pixelRatio, timeout;


		/**
		 *  Does given object have given property
		 *  @name    hasProperty
		 *  @type    function
		 *  @access  internal
		 *  @param   object haystack
		 *  @param   string property
		 *  @return  bool   available
		 */
		function hasProperty(haystack, needle)
		{
			return needle in haystack;
		}

		/**
		 *  Simple monitor function which calls the update function at a convenient interval
		 *  @name    monitor
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function monitor()
		{
			var now = konflux.time();

			clearTimeout(timeout);

			if (!tick || now - tick > 100)
			{
				tick = now;
				update();
			}

			//  attempt to ease up on the load
			timeout = setTimeout(function(){
				var timer = konflux.browser.feature('requestAnimationFrame') || function(handle){
					setTimeout(handle, 100);
				};

				timer(monitor);
			}, 50);
		}

		/**
		 *  Loop through all element stacks and determine if anything needs updates
		 *  @name    update
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function update()
		{
			var bounds, matched, className, p;

			for (p in stack)
			{
				bounds = stack[p].element.getBoundingClientRect();

				if (stack[p].width !== bounds.width)
				{
					stack[p].width = bounds.width;
					className = stack[p].current;
					matched = match(stack[p], stack[p].width);

					if (matched !== stack[p].match)
					{
						className = null;

						className = stack[p].config[matched].join(' ');
						if (matched && parseInt(matched, 10) <= stack[p].width && hasProperty(stack[p].config, matched))
							stack[p].match = matched;
					}

					if (className !== stack[p].current)
					{
						if (!konflux.empty(stack[p].current))
							konflux.style.removeClass(stack[p].element, stack[p].current);

						if (!konflux.empty(className))
							konflux.style.addClass(stack[p].element, className);

						stack[p].current = className;
						konflux.observer.notify('breakpoint.change', stack[p].current, stack[p].element);
					}
				}
			}
		}

		/**
		 *  Obtain the settings stack for the given element
		 *  @name    getStack
		 *  @type    function
		 *  @access  internal
		 *  @param   DOMElement target
		 *  @return  object     config
		 */
		function getStack(target)
		{
			var ref = konflux.dom.reference(target);

			if (!hasProperty(stack, ref))
				stack[ref] = {
					match: null,
					width: null,
					current: null,
					element: target,
					config: {}
				};

			return stack[ref];
		}

		/**
		 *  Determine the best matching dimension and return the settings
		 *  @name    match
		 *  @type    function
		 *  @access  internal
		 *  @param   object stack reference
		 *  @param   int    browser width
		 *  @return  object config
		 */
		function match(refStack, width)
		{
			var found, delta, min, p;

			if (hasProperty(refStack, 'config'))
			{
				width = Math.round(width);
				for (p in refStack.config)
				{
					p = parseInt(p, 10);
					min = !min ? p : Math.min(min, p);
					if (p <= width && (!delta || width - p <= delta))
					{
						found = p;
						delta = width - p;
					}
				}
			}

			return found >= 0 ? found : min || false;
		}

		/**
		 *  Add a breakpoint which sets given className if element (or the document body) becomes at
		 *  least the given width wide and there is no setting matching better
		 *  @name    add
		 *  @type    function
		 *  @access  internal
		 *  @param   DOMElement target
		 *  @param   number     width
		 *  @param   string     class(es)
		 *  @return  void
		 */
		function add(target, width, className)
		{
			var refStack = getStack(target);

			clearTimeout(timeout);

			if (!hasProperty(refStack.config, width))
				refStack.config[width] = [];

			refStack.config[width].push(className);

			timeout = setTimeout(function(){
				monitor();
			}, 5);
		}

		/**
		 *  Add a breakpoint which sets given className if element (or the document body) becomes at
		 *  least the given width wide and there is no setting matching better
		 *  @name    add
		 *  @type    method
		 *  @access  public
		 *  @param   number     width
		 *  @param   string     class(es)
		 *  @param   DOMElement target [optional, default document.body]
		 *  @return  kxBreakpoint object
		 */
		breakpoint.add = function(width, className, target)
		{
			add(target || document.body, width, className);
			return breakpoint;
		};

		breakpoint.remove = function()
		{
			//  to be implemented
		};

		/**
		 *  Assign className to the body element when a configuration for given pixelRatio matches
		 *  @name    ratio
		 *  @type    method
		 *  @access  public
		 *  @param   number pixelRatio
		 *  @param   string className
		 *  @param   bool   allow to round the ratio to get to a matching ratio
		 *  @param   return bool matched
		 */
		breakpoint.ratio = function(ratio, className, round)
		{
			if (!pixelRatio)
				pixelRatio = konflux.browser.feature('devicePixelRatio') || 1;

			if (ratio === pixelRatio || (round && Math.round(ratio) === pixelRatio))
			{
				konflux.style.addClass(document.body, className);
				return true;
			}
			return false;
		};
	}

	//  Append the breakpoint module to konflux
	konflux.breakpoint = new kxBreakpoint();

})(window.konflux);
