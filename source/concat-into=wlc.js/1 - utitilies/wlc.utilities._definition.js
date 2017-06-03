/**
* The wlc.utilities namespace, aka the object.
 * @namespace wlc.utilities
 * @memberof wlc
 * @author 吴乐川 <wulechuan@live.com>
 */
(function (factory) {
	var thisNameSpace = 'utilities';


	var global = global || window;
	var wlc = global.wlc;
	if (!wlc) {
		throw ReferenceError('The global "wlc" object is not defined.');
	}

	wlc[thisNameSpace] = factory();
})(function () {
	return {};
});