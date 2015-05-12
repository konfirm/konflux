/**
 *  Observation object, instances of this are be provided to all observer notification subscribers
 *  @name    KonfluxObservation
 *  @type    module
 *  @access  internal
 *  @param   string type
 *  @param   function handle
 *  @param   string reference
 *  @return  KonfluxObservation object
 */
function KonfluxObservation(type, handle, reference) {
	'use strict';

	/*global time, elapsed, disable, active*/

	/*jshint validthis: true*/
	var observation = this;

	observation.type      = type;
	observation.reference = reference;
	observation.timeStamp = konflux.time();
	observation.timeDelta = konflux.elapsed();

	/**
	 *  Unsubscribe from the current observer stack
	 *  @name    unsubscribe
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
	observation.unsubscribe = function() {
		return disable(type, handle);
	};
	/**
	 *  Stop the execution of this Observation
	 *  @name    stop
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
	observation.stop = function() {
		active[reference] = false;
	};
}
