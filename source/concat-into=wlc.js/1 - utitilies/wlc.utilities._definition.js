/**
* The wlc.utilities namespace, aka the object.
 * @namespace wlc.utilities
 * @memberof wlc
 * @author 吴乐川 <wulechuan@live.com>
 */
(function (factory) {
	var thisNameSpace = 'utilities';


	var globalObject = typeof window === 'object' ? window : typeof global === 'object' ? global : null;
	if (!globalObject) {
		throw ReferenceError('Global object is not found.');
	}

	var wlc = globalObject.wlc ;
	if (!wlc) {
		throw ReferenceError('The global "wlc" object is not defined.');
	}

	wlc[thisNameSpace] = factory();
})(function () {
	return {};
});