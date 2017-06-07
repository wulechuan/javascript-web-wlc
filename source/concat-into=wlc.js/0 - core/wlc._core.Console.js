/**
 * The wlc.core.Console class for creating wlc flavour console objects.
 * The wlc.core.defaultConsole method as the defaultly available console object.
 * 
 * @memberof wlc.core
 * @author 吴乐川 <wulechuan@live.com>
 * 
 * To make this file run in browser without any other js snippet depended on,
 * the minimum requirements are:
 * 		> existance of the "window.wlc" object;
 * 		> existance of the "window.wlc.core" object;
 * 		> existance of the "window.wlc.core.nilFunction" method;
 * 
 * A single line will fulfill the requirements mentioned above:
 * 		window.wlc = { core: { nilFunction: function () {} } };
 */
(function (constructWhatWeWant) {
	var nameOfConsoleClass = 'Console';
	var nameOfDefaultConsoleObject = 'defaultConsole';
	var methodAliasMap = {
		log:      'l',
		trace:    't',
		warn:     'w',
		error:    'e',
		group:    'gs',
		groupEnd: 'ge'
	};
	// window.wlc = { core: { nilFunction: function () {} } };



	var globalObject = typeof window === 'object' ? window : typeof global === 'object' ? global : null;
	if (!globalObject) {
		throw ReferenceError('Global object is not found.');
	}

	var core = globalObject.wlc && globalObject.wlc.core;
	if (!core) {
		throw ReferenceError('The "wlc.core" is not defined.');
	}
	if (typeof core.nilFunction !== 'function') {
		throw ReferenceError('The "wlc.core.nilFunction" is not defined.');
	}

	var WlcConsole = constructWhatWeWant(
		globalObject.console,
		methodAliasMap,
		core.nilFunction
	);

	core[nameOfConsoleClass] = WlcConsole;
	core[nameOfDefaultConsoleObject] = new WlcConsole('wlc >');



})(function constructWhatWeWant(rawConsoleObject, methodAliasMap, nilFunction) {
	var rawConsoleObjectIsAvailable =
		rawConsoleObject
		&& typeof rawConsoleObject.log === 'function'
		;

	return WlcConsole;




	/**
	 * The factory function for creating wlc flavour console objects.
	 * @class WlcConsole
	 * @name wlc.core.Console
	 * @namespace wlc.core
	 * @author 吴乐川 <wulechuan@live.com>
	 * @param {!array} sourceArray
	 * @param {?boolean} shouldUseReferenceOfNestedArrays
	 * @param {?(number|boolean)} objectTransferingMode
	 */
	function WlcConsole(loggingPrefix) {
		buildAliasFor(this, methodAliasMap, loggingPrefix);
	}


	/**
	 * Define some short alias for original loggin methods such as log, warn, error, etc.
	 * @private
	 * @author 吴乐川 <wulechuan@live.com>
	 * @param {?string} loggingPrefix
	 */
	function buildAliasFor(consoleObject, methodAliasMap, loggingPrefix) {
		var method, alias;

		if (rawConsoleObjectIsAvailable) {
			if (!loggingPrefix || typeof loggingPrefix !== 'string') {
				loggingPrefix = null;
			} else {
				// We should preserve the terminal spaces.
				// loggingPrefix = loggingPrefix.trim();
			}

			for (method in methodAliasMap) {
				alias = methodAliasMap[method];
				if (loggingPrefix) {
					consoleObject[method] = rawConsoleObject[method].bind(rawConsoleObject, loggingPrefix);
				} else {
					consoleObject[method] = rawConsoleObject[method].bind(rawConsoleObject);
				}

				consoleObject[alias] = consoleObject[method];
			}
		} else {
			for (method in methodAliasMap) {
				alias = methodAliasMap[method];
				consoleObject[method] = nilFunction;
				consoleObject[alias] = nilFunction;
			}
		}
	}
});