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
	core.evaluateObjectAccessingPath = evaluateObjectAccessingPath;
	core.defineBaseProperty = defineBaseProperty;
	core.defineUtility = defineUtility;

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



	function evaluateObjectAccessingPath(path, omitablePrefixOfPath, shouldNotTrimKeys) {
		if (typeof path !== 'string') {
			throw TypeError('The "path" must be a string, e.g. "wlc.core".');
		}

		var shouldTrimKeys = !shouldNotTrimKeys;

		if (typeof omitablePrefixOfPath !== 'string') {
			if (arguments.length === 2) {
				shouldTrimKeys = !omitablePrefixOfPath;
			}
			omitablePrefixOfPath = null;
		} else {
			if (shouldTrimKeys) {
				omitablePrefixOfPath = omitablePrefixOfPath.trim();
			}
		}

		var evaluatedObject;
		if (!omitablePrefixOfPath) {
			evaluatedObject = global || window;
		} else {
			evaluatedObject = evaluateObjectAccessingPath(omitablePrefixOfPath, null, !shouldTrimKeys);
			if (!evaluatedObject) {
				return null;
			}
		}


		var regExpLeadingWindowSequenceCS;
		var regExpLeadingWindowSequenceCI;
		var regExpLeadingGlobalSequenceCS;
		var regExpLeadingGlobalSequenceCI;
		if (shouldTrimKeys) {
			regExpLeadingWindowSequenceCS = /^(\s*window\s*\.)*\s*/;
			regExpLeadingWindowSequenceCI = /^(\s*window\s*\.)*\s*/i;
			regExpLeadingGlobalSequenceCS = /^(\s*global\s*\.)*\s*/;
			regExpLeadingGlobalSequenceCI = /^(\s*global\s*\.)*\s*/i;
		} else {
			regExpLeadingWindowSequenceCS = /^(window\.)*/;
			regExpLeadingWindowSequenceCI = /^(window\.)*/i;
			regExpLeadingGlobalSequenceCS = /^(global\.)*?/;
			regExpLeadingGlobalSequenceCI = /^(global\.)*?/i;

		}



		if (shouldTrimKeys) {
			path = path
				.replace(/^\s+/, '')
				.replace(/\s+$/, '')
				.replace(/\s*\.\s*/g, '.')
				;
		}

		if (path.match(/^\s*$/) || path.match(regExpForWeirdTerms)) {
			throw RangeError(
				'Invalid string for "path" argument.'+
				'It\'s "'+path+'".'
			);
		}

		if (path.match(/\.{2,}/)) {
			console && console.warn(
				'An empty string key is provided,',
				'which although is legal but weird.'
			);
		}

		var propertyKeySequence = path.split('.');
		var key0 = propertyKeySequence[0];
		if (key0.match(regExpForGlobalVarCS)) {
			propertyKeySequence.shift();
			key0 = propertyKeySequence[0];
		} else if (key0.match(regExpForGlobalVarCI)) {
			console && console.warn(
				'The first term(aka key), matchs either "global" or "window",',
				'but is incorrect case.',
				'It will be treated as a non-global reference.'
			);
		}

		console && console.log(propertyKeySequence);
	}

	function defineBaseProperty(propertyName, propertyFactory) {
		defineSometing('wlc.core', false, propertyName, propertyFactory);
	}

	function defineUtility(utilityName, utilityFactory) {
		defineSometing('wlc.utilities', false, utilityName, utilityFactory);
	}

	function defineSometing(hostObjectPath, shouldNotTrimKeysInHostObjectPath, propertyNameToDefine, propertyFactory) {
		var result = evaluateObjectAccessingPath();
		if (!result) {
			throw ReferenceError('');
		}
	}
});