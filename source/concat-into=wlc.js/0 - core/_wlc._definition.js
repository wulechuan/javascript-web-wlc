/**
 * The global "wlc" namespace, aka the object.
 * @global
 * @namespace wlc
 * @author 吴乐川 <wulechuan@live.com>
 */
(function (constructIt) {
	var wlcGlobalNameSpace = 'wlc';













	var global = global || window;
	global[wlcGlobalNameSpace] = constructIt();



})(function () {
	/**
	 * @global
	 */
	var wlc = {};

	return wlc;
});