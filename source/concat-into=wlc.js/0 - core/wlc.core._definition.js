/**
 * The wlc.core namespace, aka the object.
 * @namespace core
 * @memberof wlc
 * @author 吴乐川 <wulechuan@live.com>
 */
(function (constructWhatWeWant) {
	var thisNameSpace = 'core';













	var global = global || window;
	var wlc = global.wlc;
	if (!wlc) {
		throw ReferenceError('The global "wlc" object is not defined.');
	}

	wlc[thisNameSpace] = constructWhatWeWant();



})(function constructWhatWeWant() {
	var core = {};

	core.nilFunction = nilFunction;
	core.generateAUniqueTokenUnder = generateAUniqueTokenUnder;

	return core;



	/**
	 * The nil function, often named "noop" in other popular libraries.
	 * @method nilFunction
	 * @memberof! wlc.core
	 * @author 吴乐川 <wulechuan@live.com>
	 */
	function nilFunction() {}





	/**
	 * @method generateAUniqueTokenUnder
	 * @memberof! wlc.core
	 * @author 吴乐川 <wulechuan@live.com>
	 * @param {!object} tokenHost 
	 * @param {?string} prefix 
	 */
	function generateAUniqueTokenUnder(tokenHost, prefix) {
		function doGenerate(prefix) {
			return prefix + [
				Date.now(),
				Math.random().toFixed(10).slice(2)
			].join('-');
		}

		prefix = typeof prefix === 'string' ? prefix : '';
		if (prefix) prefix = prefix.replace(/\-+$/, '') + '-';

		var token = doGenerate(prefix);
		while (tokenHost[token]) {
			token = doGenerate(prefix);
		}

		return token;
	}
});