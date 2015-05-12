/**
 *  Delay object, instances of this are be provided for all kxTimings
 *  @name    kxDelay
 *  @type    class
 *  @access  internal
 *  @param   function handle
 *  @param   Number   timeout
 *  @param   string   reference
 *  @return  kxDelay  object
 */
function kxDelay(handler, timeout, reference) {
	'use strict';

	/*global konflux*/

	/*jshint validthis: true*/
	var delay = this,
		timer = null,
		raf;

	/**
	 *  Cancel the timer
	 *  @name    cancel
	 *  @type    function
	 *  @access  internal
	 *  @return  void
	 */
	function cancel() {
		clearTimeout(timer);
	}

	/**
	 *  Start the timer
	 *  @name    start
	 *  @type    function
	 *  @access  internal
	 *  @return  void
	 */
	function start() {
		timer = setTimeout(function(){
			if (!raf) {
				raf = konflux.browser.feature('requestAnimationFrame') || function(ready) {
					setTimeout(ready, 16);
				};
			}
			raf(cancel);

			handler.call();
		}, timeout);
	}

	//  expose
	/**
	 *  Cancel the timer
	 *  @name    cancel
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
	delay.cancel = cancel;

	/**
	 *  Obtain the associated reference
	 *  @name    reference
	 *  @type    method
	 *  @access  public
	 *  @return  string reference
	 */
	delay.reference = function() {
		return reference;
	};

	start();
}
