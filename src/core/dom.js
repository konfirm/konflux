/**
 *  DOM Structure helper
 *  @module  dom
 *  @note    available as konflux.dom / kx.dom
 */
function KonfluxDOM() {
	'use strict';

	/*global konflux, document, type, KonfluxIterator, elementReference*/

	/*jshint validthis: true*/
	var dom = this;

	//  constants
	dom.STACK_NEGATIVE   = 1;
	dom.STACK_BLOCK      = dom.STACK_NEGATIVE << 1;
	dom.STACK_FLOAT      = dom.STACK_BLOCK << 1;
	dom.STACK_INLINE     = dom.STACK_FLOAT << 1;
	dom.STACK_POSITIONED = dom.STACK_INLINE << 1;
	dom.STACK_POSITIVE   = dom.STACK_POSITIONED << 1;
	dom.STACK_GLOBAL     = dom.STACK_POSITIVE << 1;

	/**
	 *  Append given source element or structure to the target element
	 *  @name   appendTo
	 *  @type   function
	 *  @access internal
	 *  @param  DOMElement target
	 *  @param  mixed source (one of: DOMElement, Object structure)
	 *  @return Array of added source elements
	 */
	function appendTo(target, source) {
		var result, i;

		if (konflux.isType('string', target)) {
			target = document.querySelector(target);
		}

		if (source instanceof Array) {
			result = [];
			for (i = 0; i < source.length; ++i) {
				result.push(appendTo(target, source[i]));
			}
		}
		else {
			result = target.appendChild(source);
		}

		return result;
	}

	/**
	 *  Determine whether element is in the ancestor element or the ancestor element itself
	 *  @name   contains
	 *  @type   function
	 *  @access internal
	 *  @param  DOMElement ancestor
	 *  @param  DOMElement element
	 *  @return bool element is (in) ancestor
	 */
	function contains(ancestor, element) {
		//  use the contains method if it exists
		if ('contains' in ancestor) {
			return ancestor.contains(element);
		}

		//  old school tree walker
		while (element !== ancestor && element) {
			element = element.parentNode;
		}

		return !!element;
	}

	/**
	 *  Create a dom structure from given variable
	 *  @name   createStructure
	 *  @type   function
	 *  @access internal
	 *  @param  mixed   source
	 *  @param  DOMNode scope
	 *  @return DOMElement structure
	 */
	function createStructure(struct, scope) {
		var nodeName, element, p, i;

		switch (konflux.type(struct)) {
			case 'array':
				element = [];
				for (i = 0; i < struct.length; ++i) {
					element.push(createStructure(struct[i]));
				}

				break;

			case 'object':
				nodeName = 'tag' in struct ? struct.tag : ('name' in struct ? struct.name : 'div');

				if (!/^[a-z]+[a-z0-9-]*$/i.test(nodeName)) {
					element = (scope ? scope.querySelector(nodeName) : null) || document.querySelector(nodeName);
				}
				else {
					element = document.createElement(nodeName);
				}

				for (p in struct) {
					switch (p)
					{
						case 'name':
							if ('tag' in struct) {
								element.setAttribute('name', struct[p]);
							}

							break;

						case 'child':
						case 'content':
							appendTo(element, createStructure(struct[p], element));
							break;

						case 'class':
						case 'className':
							element.setAttribute('class', struct[p]);
							break;

						default:
							element.setAttribute(p, struct[p]);
							break;
					}
				}

				break;

			case 'boolean':
				struct = struct ? 'true' : 'false';
				/* falls through */
			default:
				element = document.createTextNode(struct);
				break;
		}

		return element;
	}

	/**
	 *  Obtain the stacking order index
	 *  @name   stackOrderIndex
	 *  @type   function
	 *  @access internal
	 *  @param  DOMElement node
	 *  @return object stack order (format: {type:<int>, index:<int>})
	 *  @note   the dom constants: STACK_NEGATIVE, STACK_BLOCK, STACK_FLOAT
	 *          STACK_INLINE, STACK_POSITIONED, STACK_POSITIVE, STACK_GLOBAL
	 *          with the type number to determine the matching type.
	 *          e.g. type & konflux.dom.STACK_POSITIONED !== 0 is a positioned element
	 *  @see    spec:  http://www.w3.org/TR/CSS2/zindex.html#painting-order
	 *  @see    human: http://philipwalton.com/articles/what-no-one-told-you-about-z-index/
	 */
	function stackOrderIndex(node) {
		var zIndex = +konflux.style.get(node, 'z-index'),
			opacity = parseFloat(konflux.style.get(node, 'opacity')),
			position = konflux.style.get(node, 'position'),
			display = konflux.style.get(node, 'display'),
			floatValue = konflux.style.get(node, 'float'),
			context = (position !== 'static' && zIndex !== 'auto') || opacity < 1,

			//  https://developer.mozilla.org/en-US/docs/Web/CSS/display
			blockType = /^(?:(?:inline\-)?block|list\-item|table(?:\-(?:cell|caption|column|row))?|table\-(?:column|footer|header|row)\-group|flex|grid)$/.test(display),
			type = parseInt([

				//  fixed positioning, a world in its own
				position === 'fixed' ? 1 : 0,

				//  positive stacking context: 0/1
				context && (zIndex === 'auto' || zIndex >= 0) ? 1 : 0,

				//  positioned (and not stacking context)
				position !== 'static' && !context ? 1 : 0,

				//  inline level elements (natural position order)
				floatValue === 'none' && position === 'static' && !blockType ? 1 : 0,

				//  floating elements are between natural positioned inline and block level elements
				floatValue !== 'none' && !context && position === 'static' ? 1 : 0,

				//  block level element (natural position order)
				floatValue === 'none' && position === 'static' && blockType ? 1 : 0,

				//  negative stacking context
				context && zIndex < 0 ? 1 : 0
			].join(''), 2);

		return {
			type: type,
			index: position !== 'static' || !zIndex || zIndex === 'auto' ? 0 : zIndex,
			context: (dom.STACK_NEGATIVE & type || dom.STACK_POSITIONED & type || dom.STACK_POSITIVE & type || dom.STACK_GLOBAL & type) !== 0
		};
	}


	/**
	 *  Create a dom structure from given variable
	 *  @name   create
	 *  @type   method
	 *  @access public
	 *  @param  mixed source
	 *  @return DOMElement structure
	 */
	dom.create = createStructure;

	/**
	 *  Append given source element or structure to the target element
	 *  @name   appendTo
	 *  @type   method
	 *  @access public
	 *  @param  DOMElement target
	 *  @param  mixed source (one of: DOMElement, Object structure)
	 *  @return Array of added source elements
	 */
	dom.appendTo = function(target, source) {
		return appendTo(target, konflux.isType('object', source) && !konflux.isType('undefined', source.nodeType) ? source : createStructure(source, target));
	};

	/**
	 *  Determine whether element is in the ancestor element or the ancestor element itself
	 *  @name   contains
	 *  @type   method
	 *  @access public
	 *  @param  DOMElement ancestor
	 *  @param  DOMElement element
	 *  @return bool is (in) ancestor
	 */
	dom.contains = contains;

	/**
	 *  Select elements matching given CSS selector
	 *  @name   select
	 *  @type   method
	 *  @access public
	 *  @param  string     selector
	 *  @param  DOMElement parent
	 *  @return KonfluxIterator nodeList
	 */
	dom.select = function(selector, parent) {
		return new KonfluxIterator((parent || document).querySelectorAll(selector));
	};

	/**
	 *  Get the unique reference for given DOM element, adds it if it does not yet exist
	 *  @name    reference
	 *  @type    method
	 *  @access  public
	 *  @param   DOMElement element
	 *  @return  string unique reference
	 *  @note    this function adds an attribute 'data-kxref' to the element
	 */
	dom.reference = function(element) {
		return elementReference(element);
	};

	/**
	 *  Obtain the stacking order level
	 *  @name   stackLevel
	 *  @type   method
	 *  @access public
	 *  @param  DOMElement node
	 *  @return object stack order (format: {type:<int>, index:<int>})
	 */
	dom.stackLevel = stackOrderIndex;
}
