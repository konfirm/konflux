;(function(konflux) {

	/**
	 *  Timing utils
	 *  @module  timing
	 *  @note    available as konflux.timing / kx.timing
	 */
	function KonfluxTiming() {
		'use strict';

		/*jshint validthis: true*/
		var timing = this,
			stack = {},
			raf;

		//= include timing/delay.js

		/**
		 *  Remove timer object by their reference
		 *  @name    remove
		 *  @type    function
		 *  @access  internal
		 *  @param   string reference
		 *  @return  void
		 */
		function remove(reference) {
			if ('undefined' !== typeof stack[reference]) {
				//  cancel the stack reference
				stack[reference].cancel();

				//  delete it
				delete stack[reference];
			}
		}

		/**
		 *  Create a timer object to call given handler after given delay and store it with given reference
		 *  @name    create
		 *  @type    function
		 *  @access  internal
		 *  @param   function handle
		 *  @param   Number   delay
		 *  @param   string   reference
		 *  @return  KonfluxDelay  object
		 */
		function create(handler, delay, reference) {
			if (reference)
				remove(reference);
			else
				reference = handler.toString() || konflux.unique();
			stack[reference] = new KonfluxDelay(handler, delay || 0, reference);

			return stack[reference];
		}

		//  expose
		/**
		 *  Remove timer object by their reference
		 *  @name    remove
		 *  @type    method
		 *  @access  public
		 *  @param   string reference
		 *  @return  void
		 */
		timing.remove = remove;

		/**
		 *  Create a timer object to call given handler after given delay and store it with given reference
		 *  @name    create
		 *  @type    method
		 *  @access  public
		 *  @param   function handle
		 *  @param   Number   delay
		 *  @param   string   reference
		 *  @return  KonfluxDelay  object
		 */
		timing.create = create;
	}

	konflux.register('timing', new KonfluxTiming());

})(konflux);
