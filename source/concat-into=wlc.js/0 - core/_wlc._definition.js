/**
 * The global "wlc" namespace, aka the object.
 * @global
 * @namespace wlc
 * @author 吴乐川 <wulechuan@live.com>
 */
(function (constructWhatWeWant) {
	var wlcGlobalNameSpace = 'wlc';







	var global = global || window;
	global[wlcGlobalNameSpace] = constructWhatWeWant();



})(function constructWhatWeWant() {
	/**
	 * @global
	 */
	var wlc = {};

	return wlc;
});