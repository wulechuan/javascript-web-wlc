/**
 * The wlc.core namespace, aka the object.
 * @namespace core
 * @memberof wlc
 * @author 吴乐川 <wulechuan@live.com>
 */
(function (constructWhatWeWant) {
	var thisNameSpace = 'core';













	var globalObject = global || window;
	var wlc = globalObject.wlc;
	if (!wlc) {
		throw ReferenceError('The global "wlc" object is not defined.');
	}

	wlc[thisNameSpace] = constructWhatWeWant();



})(function constructWhatWeWant() {
	var core = {};

	core.nilFunction = nilFunction;
	core.generateAUniqueTokenUnder = generateAUniqueTokenUnder;
	core.evaluateObjectViaAccessingPath = evaluateObjectViaAccessingPath;
	core.defineBaseProperty = defineBaseProperty;
	core.defineUtility = defineUtility;

	return core;



	/**
	 * The nil function, often named "noop" in other popular libraries or frameworks.
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


	function evaluateObjectViaAccessingPath(/*path, omissiblePrefixOfPath, shouldNotTrimKeys*/) {
		var result = {
			evaluationFailed: false,
			value: undefined
		};

		var evaluatedFullPathSegments = evaluateObjectFullAccessingPath.apply(null, arguments);

		if (!evaluatedFullPathSegments) {
			result.evaluationFailed = true;
			return result;
		}

		console.log(evaluatedFullPathSegments.join('.'));

		var globalObject = typeof window === 'object' ? window : global;
		var evaluatedValue = globalObject;
		var pathDepth = evaluatedFullPathSegments.length;

		var i, key;
		for (i = 1; i < pathDepth; i++) {
			key = evaluatedFullPathSegments[i];
			evaluatedValue = evaluatedValue[key];
			if (evaluatedValue === null || typeof evaluatedValue === 'undefined') {
				if (i < pathDepth-1) {
					result.evaluationFailed = true;
					return result;
				}
			}
		}

		result.value = evaluatedValue;

		return result;
	}

	function evaluateObjectFullAccessingPath(pathToCheck, omissiblePrefixOfPath, shouldNotTrimKeys) {
		if (typeof pathToCheck !== 'string') {
			throw TypeError('The "path" must be a string, e.g. "wlc.core".');
		}

		var shouldTrimKeys = !shouldNotTrimKeys;
		if (typeof omissiblePrefixOfPath !== 'string') {
			if (arguments.length === 2) {
				shouldTrimKeys = !omissiblePrefixOfPath;
			}
			omissiblePrefixOfPath = null;
		// } else {
		// 	if (shouldTrimKeys) {
		// 		omissiblePrefixOfPath = omissiblePrefixOfPath.trim();
		// 	}
		}


		// var globalObject = typeof window === 'object' ? window : global;
		var globalObjectIsWindow = typeof window === 'object';
		var globalObjectName = globalObjectIsWindow ? 'window' : 'global';

		var regExpLeadingWindowSequenceCS;
		var regExpLeadingWindowSequenceCI;
		var regExpLeadingGlobalSequenceCS;
		var regExpLeadingGlobalSequenceCI;
		if (shouldTrimKeys) {
			regExpLeadingWindowSequenceCS = /^window(\.window)*\.?/;
			regExpLeadingWindowSequenceCI = /^window(\.window)*\.?/i;
			regExpLeadingGlobalSequenceCS = /^global(\.global)*\.?/;
			regExpLeadingGlobalSequenceCI = /^global(\.global)*\.?/i;
		} else {
			regExpLeadingWindowSequenceCS = /^\s*window\s*(\.\s*window\s*)*\.?\s*/;
			regExpLeadingWindowSequenceCI = /^\s*window\s*(\.\s*window\s*)*\.?\s*/i;
			regExpLeadingGlobalSequenceCS = /^\s*global\s*(\.\s*global\s*)*\.?\s*/;
			regExpLeadingGlobalSequenceCI = /^\s*global\s*(\.\s*global\s*)*\.?\s*/i;
		}


		var pathToCheckEvaluatedSegments;
		var pathToCheckIsAnAbsolutePath = false;

		var omissiblePrefixEvaluatedSegments = [];
		var omissiblePrefixOfPathIsAnAbsolutePath = false;

		pathToCheckEvaluatedSegments = _evaluate(pathToCheck);
		if (pathToCheckEvaluatedSegments) {
			pathToCheckIsAnAbsolutePath = pathToCheckEvaluatedSegments[0] === globalObjectName;
		} else {
			pathToCheckEvaluatedSegments = [];
		}

		if (omissiblePrefixOfPath) {
			omissiblePrefixEvaluatedSegments = _evaluate(omissiblePrefixOfPath);
			if (omissiblePrefixEvaluatedSegments) {
				omissiblePrefixOfPathIsAnAbsolutePath = omissiblePrefixEvaluatedSegments[0] === globalObjectName;
			} else {
				omissiblePrefixEvaluatedSegments = [];
			}
		}


		var evaluatedFullPathSegments;

		if (!pathToCheckIsAnAbsolutePath && !omissiblePrefixOfPathIsAnAbsolutePath) {
			evaluatedFullPathSegments = [globalObjectName]
				.concat(omissiblePrefixEvaluatedSegments)
				.concat(pathToCheckEvaluatedSegments);
		}
		
		if (!pathToCheckIsAnAbsolutePath && omissiblePrefixOfPathIsAnAbsolutePath) {
			evaluatedFullPathSegments = []
				.concat(omissiblePrefixEvaluatedSegments)
				.concat(pathToCheckEvaluatedSegments);
		}

		if (pathToCheckIsAnAbsolutePath && omissiblePrefixOfPath && !omissiblePrefixOfPathIsAnAbsolutePath) {
			return [];
		}

		if (pathToCheckIsAnAbsolutePath && omissiblePrefixOfPathIsAnAbsolutePath) {
			var evaluatedPathToCheck = pathToCheckEvaluatedSegments.join('.');
			var evaluatedPrefix = omissiblePrefixEvaluatedSegments.join('.');
			var pathToCheckContainsPrefix = evaluatedPathToCheck.match(evaluatedPrefix)
				&& evaluatedPathToCheck.length > evaluatedPrefix.length;

			if (!pathToCheckContainsPrefix) {
				return [];
			}

			evaluatedFullPathSegments = pathToCheckEvaluatedSegments;
		}

		return evaluatedFullPathSegments;


		function _evaluate(path) {
			var rawPath = path; // a backup just for logging;
			var loggingMessage = '';

			if (shouldTrimKeys) {
				path = path
					.replace(/^\s+/, '')
					.replace(/\s+$/, '')
					.replace(/\s*\.\s*/g, '.')
					;
			}


			// A path starts or ends with a dot is illegal.
			if (path.match(/^\./) || path.match(/\.$/)) {
				loggingMessage = 'Invalid string is provided. which is "'+path+'".';
				// throw RangeError(loggingMessage);
				console.error(loggingMessage);
				return false;
			}


			// Two or more continous dots meaning there are keys that are empty strings.
			if (path.match(/\.{2,}/)) {
				console && console.warn(
					'At least one empty-string-keys is among provided keys,',
					'which although is legal but weird.',
					'Keep an eye on it.'
				);
			}


			var leadingKeyIsWindow = path.match(regExpLeadingWindowSequenceCS);
			var leadingKeyIsGlobal = path.match(regExpLeadingGlobalSequenceCS);
			var leadingGlobalVarNameMatchingResult = leadingKeyIsWindow || leadingKeyIsGlobal;

			if (   (leadingKeyIsWindow && !globalObjectIsWindow)
				|| (leadingKeyIsGlobal &&  globalObjectIsWindow)
			) {
				loggingMessage =
					'Invalid string is provided.'+
					' It starts with "'+leadingGlobalVarNameMatchingResult[0]+'"'+
					' while the actual global object is "'+globalObjectName+'"'
				;
				// throw RangeError(loggingMessage);
				console.error(loggingMessage);
				return false;
			}

			var evaluatedSegments = [];
			if (leadingGlobalVarNameMatchingResult) {
				path = path.slice(leadingGlobalVarNameMatchingResult[0].length);
				evaluatedSegments.push(globalObjectName);
			}

			var leadingKeyLooksLikeWindow = path.match(regExpLeadingWindowSequenceCI);
			var leadingKeyLooksLikeGlobal = path.match(regExpLeadingGlobalSequenceCI);
			// var leadingGlobalVarNameMatchingResult2 = leadingKeyLooksLikeWindow || leadingKeyLooksLikeGlobal;

			if (   (leadingKeyLooksLikeWindow &&  globalObjectIsWindow)
				|| (leadingKeyLooksLikeGlobal && !globalObjectIsWindow)
			) {
				console && console.warn(
					'The leading segments of "'+rawPath+'" contain some key(s)',
					'that each looks like the global object (the "'+globalObjectName+')',
					'but is in an incorrect lettle case.',
					'These key(s) each will be treated as a non-global reference.',
					'Keep an eye on that.'
				);
			}

			var propertyKeySequence = path.split('.');

			console && console.log(propertyKeySequence);
			evaluatedSegments = evaluatedSegments.concat(propertyKeySequence);

			return evaluatedSegments;
		}
	}

	function defineBaseProperty(propertyName, propertyFactory) {
		defineSometing('wlc.core', false, propertyName, propertyFactory);
	}

	function defineUtility(utilityName, utilityFactory) {
		defineSometing('wlc.utilities', false, utilityName, utilityFactory);
	}

	function defineSometing(hostObjectPath, shouldNotTrimKeysInHostObjectPath, propertyNameToDefine, propertyFactory) {
		var result = evaluateObjectViaAccessingPath();
		if (!result) {
			throw ReferenceError('');
		}
	}
});