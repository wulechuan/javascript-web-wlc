/**
 * The global "wlc" namespace, aka the object.
 * @global
 * @namespace wlc
 * @author 吴乐川 <wulechuan@live.com>
 */
(function (constructWhatWeWant) {
	var wlcGlobalNameSpace = 'wlc';







	var globalObject = typeof window === 'object' ? window : typeof global === 'object' ? global : null;
	if (!globalObject) {
		throw ReferenceError('Global object is not found.');
	}

	globalObject[wlcGlobalNameSpace] = constructWhatWeWant();



})(function constructWhatWeWant() {
	/**
	 * @global
	 */
	var wlc = {};

	return wlc;
});