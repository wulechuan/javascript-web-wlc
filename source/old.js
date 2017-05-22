/* global
	$
*/

window.webLogicControls = {};

(function () {
	var wlc = this;
	var nilFunction = function () {};
	var C = (window.console && typeof window.console.log === 'function') ?
		(function (C) {
			C.l = C.log;
			C.t = C.trace;
			C.w = C.warn;
			C.e = C.error;
			return C;
		})(window.console) : {
			l: nilFunction,
			t: nilFunction,
			w: nilFunction,
			e: nilFunction
		};

	var AbstractClass = {};
	this.AbstractClass = AbstractClass;
	(function () { // AbstractClass

	}).call(AbstractClass);


	var WCU = {};
	this.CoreUtilities = WCU;
	(function () { // CoreUtilities
		this.invoke = function () {
			// Possible arguments sequences:
			//     1) array, true, <function or functionNameString> [, actual arguments ...],
			//        This treats array as a single owner/this object,
			//        and obviously the function should be a method of an array
			//
			//        Note:
			//            For conveniences, "array, false, function" is NOT valid.
			//            Otherwise every time we'd like to do batch work,
			//            we have to provide a false at arguments[1]
			//
			//     2) array, <function or functionNameString> [, actual arguments ...]
			//        This dives in the the array, recursively run invoke for each member of the array
			//
			//     3) <non-function, non-array value>, <function or functionNameString> [, actual arguments ...]
			//        This treats the first argument as owner/this object of the function in arguments[1].
			//
			//     4) <function or functionNameString> [, actual arguments ...]
			//        This treats the omitted owner/this object being window.


			var iterationDepth = 0;
			var maxIterationDepth = 1;
			return iterate.apply(null, arguments);


			function iterate() {
				iterationDepth++;

				if (arguments.length < 1) return;

				var theOwnerDecided = false;

				var args = Array.prototype.slice.apply(arguments);
				var func;

				var owners = args[0];

				if (typeof owners === 'function') {
					func = owners;
					owners = window;
					theOwnerDecided = true;
					args = args.slice(1);
				} else {
					if (Array.isArray(owners) && args[1] === true) {
						theOwnerDecided = true;
						func = args[2];
						args = args.slice(3);
					} else {
						theOwnerDecided = !Array.isArray(owners);

						if (owners === undefined || owners === null) {
							// null, omitted owners
							owners = window;
						}

						func = args[1];

						args = args.slice(2);
					}

					if (!(typeof func === 'function' || (typeof func === 'string' && func.length > 0))) {
						C.e('Function/method not provided.');
						return;
					}
				}

				if (theOwnerDecided) {
					if (typeof func === 'string') {
						if (typeof owners[func] !== 'function') {
							if (typeof owners === 'object' && !Array.isArray(owners)) {
								C.e('Function/method not found via string "'+func+'" for', owners);
							} else {
								C.e('Function/method not found via string "'+func+'" for '+
									(Array.isArray(owners) ? 'an <array>' : ('a <' + typeof owners+'>'))+'.'
								);
							}
							return;
						}
						func = owners[func];
					}

					return func.apply(owners, args);
				} else {
					if (Array.isArray(owners)) {
						var results = [];
						if (iterationDepth <= maxIterationDepth) {
							for (var i = 0; i < owners.length; i++) {
								results.push(
									iterate.apply(null, [owners[i], func].concat(args))
								);
							}
						}

						return results; // might limited by maxIterationDepth
					} else {
						// hopefully impossible
					}
				}
			}
		};


		var save = {};
		this.save = save;
		(function () {
			function _updateValueSafely(recursiveDepth, desiredType, targetObject, key, sourceValue, allowToRemoveTargetValue, valueParser, shouldTrace) {
				var resultStates = {
					newValueHasBeenTaken: false,
					oldValueHasBeenRemoved: false,
					valueHasBeenChanged: false,
					valueHasBeenCreated: false,
					valueTypeChanged: false,
					inputValueWasInvalid: false
				};
				// a valid valueParser MUST return an object like this:
				// {
				//     isValid: boolean,
				//     value: the value, which is NOT necessarily be valid, because we rely on the isValid boolean
				// }

				// The value is NOT necessarily to change for newValueHasBeenTaken to be true.
				// for example:
				//     at begining:
				//         targetObject.propertyA === 3
				//     then:
				//         targetObject.propertyA = 3
				// In this situation, the newValueHasBeenTaken is true even if the values before and after this action happen to be the same.

				allowToRemoveTargetValue = !!allowToRemoveTargetValue;

				var oldKeyExisted = targetObject.hasOwnProperty(key);
				var oldValue = targetObject[key];
				var parsedResult = {
					isValid: false,
					value: sourceValue
				};
				var targetValueOldTypeWrong = oldKeyExisted && typeof oldValue !== desiredType;
				var warningMessage = 'Property "'+key+'" has been set to a "'+desiredType+'" value. Note that the old value was of type "'+typeof targetObject[key]+'".';

				if (!key || typeof key !== 'string' || typeof targetObject !== 'object' || !targetObject) {
					throw TypeError('Invalid targetObject or key provided.');
				} else {
					if (typeof sourceValue === 'function') {

						if (desiredType !== 'function') {
							resultStates.inputValueWasInvalid = true;
						} else {

							/* *********************************** */
							parsedResult.isValid = true;
							/* *********************************** */

						}

					} else if (typeof sourceValue === 'undefined') {

						if (allowToRemoveTargetValue) {

							/* *********************************** */
							delete targetObject[key];
							/* *********************************** */

							// here the parsedResult.isValid is still FALSE but the resultStates.inputValueWasInvalid is also FLASE

							resultStates.oldValueHasBeenRemoved = oldKeyExisted;
							resultStates.valueHasBeenChanged = oldKeyExisted && typeof oldValue !== 'undefined';
						} else {
							resultStates.inputValueWasInvalid = true;
						}

					} else if (sourceValue === null) {

						if (allowToRemoveTargetValue) {

							/* *********************************** */
							delete targetObject[key];
							/* *********************************** */

							// here the parsedResult.isValid is still FALSE but the resultStates.inputValueWasInvalid is also FLASE

							resultStates.oldValueHasBeenRemoved = oldKeyExisted;
							resultStates.valueHasBeenChanged = oldValue !== null;
						} else {
							resultStates.inputValueWasInvalid = true;
						}

					} else {

						if (typeof sourceValue !== 'object') {
							if (typeof valueParser !== 'function') {

								/* *********************************** */
								parsedResult.isValid = true; // simple don't parse or validate the soureValue, treating it valid.
								/* *********************************** */

							} else {
								parsedResult = valueParser(sourceValue);
							}
						} else if (typeof sourceValue === 'object' && sourceValue !== null && sourceValue.hasOwnProperty(key)) {
							if (recursiveDepth && recursiveDepth > 0) {
								resultStates = _updateValueSafely(recursiveDepth-1, desiredType, targetObject, key, sourceValue[key], allowToRemoveTargetValue, valueParser, shouldTrace);
							} else {
								resultStates.inputValueWasInvalid = true;
							}
						} else {
							resultStates.inputValueWasInvalid = true;
						}

					}
				}

				if (parsedResult.isValid) {

					/* *********************************** */
					targetObject[key] = parsedResult.value; 
					/* *********************************** */

					resultStates.newValueHasBeenTaken = true;
					resultStates.valueHasBeenCreated = !oldKeyExisted;
					resultStates.valueHasBeenChanged = !oldKeyExisted || (targetObject[key] !== oldValue);

					if (targetValueOldTypeWrong) {
						resultStates.valueTypeChanged = true;
						console.warn(warningMessage);
					}
				}

				return resultStates;
			}

			this.boolean = function (targetObject, key, sourceValue, allowToRemoveTargetValue/*, shouldTrace*/) {
				return _updateValueSafely(
					1,
					'boolean',
					targetObject, key, sourceValue, allowToRemoveTargetValue,
					function (value) {
						return {
							isValid: true,
							value: !!value
						};
					}
				);
			};
			this.number = function (targetObject, key, sourceValue, allowToRemoveTargetValue, allowNaNValue, customParser/*, shouldTrace*/) {
				return _updateValueSafely(
					1,
					'number',
					targetObject, key, sourceValue, allowToRemoveTargetValue,
					function (value) {
						var result = {
							isValid: true,
							value: value
						};
						result.value = parseFloat(value);
						result.isValid = !!allowNaNValue || !isNaN(result.value);
						if (result.isValid && typeof customParser === 'function') {
							result = customParser(value);
						}
						return result;
					}
				);
			};
			this.numberPositive = function (targetObject, key, sourceValue, allowToRemoveTargetValue/*, shouldTrace*/) {
				return this.number(
					targetObject, key, sourceValue, allowToRemoveTargetValue,
					false,
					function (value) {
						return {
							isValid: value > 0,
							value: value
						};
					}
				);
			};
			this.numberNonNegative = function (targetObject, key, sourceValue, allowToRemoveTargetValue/*, shouldTrace*/) {
				return this.number(
					targetObject, key, sourceValue, allowToRemoveTargetValue,
					false,
					function (value) {
						return {
							isValid: value >= 0,
							value: value
						};
					}
				);
			};
			this.numberNoLessThan = function (targetObject, key, sourceValue, allowToRemoveTargetValue, limit/*, shouldTrace*/) {
				return this.number(
					targetObject, key, sourceValue, allowToRemoveTargetValue,
					false,
					function (value) {
						limit = parseFloat(limit);
						var limitValid = !isNaN(limit);

						if (!limitValid) {
							throw('Invalid limitation provided while setting value to a number no less than the limitation.');
						}

						return {
							isValid: value >= limit,
							value: value
						};
					}
				);
			};
			this.numberLessThan = function (targetObject, key, sourceValue, allowToRemoveTargetValue, limit/*, shouldTrace*/) {
				return this.number(
					targetObject, key, sourceValue, allowToRemoveTargetValue,
					false,
					function (value) {
						limit = parseFloat(limit);
						var limitValid = !isNaN(limit);

						if (!limitValid) {
							throw('Invalid limitation provided while setting value to a number less than the limitation.');
						}

						return {
							isValid: value < limit,
							value: value
						};
					}
				);
			};
			this.numberInRange = function (targetObject, key, sourceValue, allowToRemoveTargetValue, rangeA, rangeB/*, shouldTrace*/) {
				return this.number(
					targetObject, key, sourceValue, allowToRemoveTargetValue,
					false,
					function (value) {
						rangeA = parseFloat(rangeA);
						rangeB = parseFloat(rangeB);

						var rangeAValid = !isNaN(rangeA);
						var rangeBValid = !isNaN(rangeB);

						if (!rangeAValid || !rangeBValid) {
							throw('Invalid range provided while setting value to a number with range.');
						}

						var start = Math.min(rangeA, rangeB);
						var end = Math.max(rangeA, rangeB);

						return {
							isValid: (value >= start) && (value < end),
							value: value
						};
					}
				);
			};
			this.string = function (targetObject, key, sourceValue, allowToRemoveTargetValue, allowEmptyString, customParser/*, shouldTrace*/) {
				return _updateValueSafely(
					1,
					'string',
					targetObject, key, sourceValue, allowToRemoveTargetValue,
					function (value) {
						var result = {
							isValid: (typeof value === 'string') && (!!allowEmptyString || value.length > 0),
							value: value
						};
						if (result.isValid && typeof customParser === 'function') {
							result = customParser(value);
						}
						return result;
					}
				);
			};
			this.method = function (targetObject, key, sourceFunction, allowToRemoveExistingFunction/*, shouldTrace*/) {
				return _updateValueSafely(
					1,
					'function',
					targetObject,
					key,
					sourceFunction,
					allowToRemoveExistingFunction
				);
			};
		}).call(save);


		var objectToolkit = {};
		this.objectToolkit = objectToolkit;
		(function () {
			this.destroyInstanceObject = function (obj) {
				if (obj === window) {
					C.w('Cannot destroy window.');
				} else if (obj instanceof Node) {
					C.w('Cannot destroy DOM node.');
				} else if (typeof obj === 'object') {
					for (var p in obj) {
						delete obj[p];
					}

					obj.hasBeenDestroied = true;
				}

				return obj;
			};
			this.destroyInstanceIfInitFailed = function(status, actionOnSuccess) {
				if (typeof status !== 'object') {
					throw 'Wrong way to utilize afterInit tool. The "status" object is NOT found within scope.';
				}

				if (status.isInitializing) {
					if (status.noNeedToConstruct) {
						delete status.noNeedToConstruct;
						C.l('No need to construct <'+this.constructor.name+'>.');
						objectToolkit.destroyInstanceObject(this);
						return;
					} else if (status.noNeedToReconstruct) {
						delete status.noNeedToReconstruct;
						return;
					} else {
						C.e('Fail to construct <'+this.constructor.name+'>.');
						objectToolkit.destroyInstanceObject(this);
					}
					return;
				}

				WCU.invoke(this, actionOnSuccess);
			};
			this.invokeCallbacks = function (callbacksArray) {
				if (typeof callbacksArray === 'function') {
					callbacksArray = [callbacksArray];
				}

				if (!Array.isArray(callbacksArray)) return;

				var args = Array.prototype.slice.apply(arguments);
				args = args.slice(1);
				for (var i = 0; i < callbacksArray.length; i++) {
					var callback = callbacksArray[i];
					if (typeof callback === 'function') callback.apply(this, args);
				}
			};

			this.evaluateDotNotationChain = function (rootObject, dotNotationString, desiredType) {
				if (typeof dotNotationString !== 'string' || dotNotationString.length < 3) return;

				dotNotationString = dotNotationString
					.replace(/^[\.\s]+/, '')
					.replace(/[\.\s]+$/, '')
					.replace(/\s*\.\s*/, '.')
				;

				var validPathSoFar;
				if (rootObject === undefined || rootObject === null) {
					rootObject = window;
					validPathSoFar = 'window';
				} else {
					validPathSoFar = '['+typeof rootObject+']';
				}
				var dotNotationStringLog = validPathSoFar + '.' + dotNotationString;

				var failedToFound = false;
				var typeIncorrect = false;

				var keys = dotNotationString.split('.');

				var resultProperty = rootObject;
				var key;
				for (var i = 0; i < keys.length; i++) {
					key = keys[i];
					resultProperty = resultProperty[key];
					// C.l('['+i+'] "'+validPathSoFar+'"', typeof resultProperty);

					if (resultProperty === undefined || resultProperty === null) {
						failedToFound = true;
						break;
					}

					validPathSoFar += '.' + key;
				}




				var desiredTypeProvided = false;
				if (typeof desiredType === 'string') desiredType = desiredType.toLowerCase();
				switch (desiredType) {
					case 'boolean':
					case 'number':
					case 'object':
					case 'function':
					case 'string':
						desiredTypeProvided = true;
						break;
					default:
				}

				var foundType; 
				if (!failedToFound && desiredTypeProvided) {
					foundType = typeof resultProperty;
					typeIncorrect = foundType !== desiredType;
				}




				var resultInvalid = failedToFound || typeIncorrect;

				if (resultInvalid) {
					if (failedToFound) {
						C.e(
							'Fail to found desired property via string "'+dotNotationStringLog+'".',
							'\n\t'+validPathSoFar+' has no property named "'+key+'"'
						);
					} else if (typeIncorrect) {
						C.e(
							'Found property via "'+dotNotationStringLog+'",',
							'\n\tbut in type of'+foundType+' insead of "'+desiredType+'"'
						);
					}
					return;
				}

				// C.l('Evaluated resultProperty function:', resultProperty);
				return resultProperty;
			};

			this.evaluateDotNotationChainViaHTMLAttribute = function(element, attributeName) {
				if (!(element instanceof Node)) return false;
				var dotNotationString = element.getAttribute(attributeName);
				if (!dotNotationString) return;

				var replacedArguments = Array.prototype.slice.apply(arguments);
				replacedArguments[0] = window;
				replacedArguments[1] = dotNotationString;
				return this.evaluateDotNotationChain.apply(this, replacedArguments);
			};
		}).call(objectToolkit);


		var stringFormatters = {};
		this.stringFormatters = stringFormatters;
		(function () {
			this.format = function (text, formatType, isInputField, options) {
				if (!text || typeof text !== 'string') return text;
				var formatter = this.evaluateFormatterFromType(formatType, isInputField, options);
				if (!formatter) return text;
				return formatter(text);
			};
			this.evaluateFormatterFromType = function(builtInFormatType, isInputField/*, options*/) {
				if (typeof builtInFormatType !== 'string') return;

				var builtInFormatters = WCU.stringFormatters; // alias for minifiying

				var formatterFound = false;
				var formatter;
				switch (builtInFormatType) {
					case 'chinese-id-card':
					case 'chinese-id-number':
						if (isInputField) {
							formatter = builtInFormatters.chineseIDNumberInput;
						} else {
							formatter = builtInFormatters.chineseIDNumber;
						}
						formatterFound = true;
						break;

					case 'mobile':
					case 'cellphone':
						if (isInputField) {
							formatter = builtInFormatters.mobileInput;
						} else {
							formatter = builtInFormatters.mobile;
						}
						formatterFound = true;
						break;

					case 'bank':
					case 'bank-card':
					case 'chinese-bank':
					case 'chinese-bank-card':
						if (isInputField) {
							formatter = builtInFormatters.chineseBankCardInput;
						} else {
							formatter = builtInFormatters.chineseBankCard;
						}
						formatterFound = true;
						break;

					default:
				}
				if (!formatterFound) {
					C.w('No built-in formatter for "'+builtInFormatType+'" type.');
				}

				return formatter;
			};
			this.pureDigits = function(text) {
				return text.replace(/[^0-9]/g, '');
			};
			this.chineseIDNumber = function(text) {
				// asterisk (*) is allowed
				var divider = ' ';
				return text
					.replace(/[^xX\s0-9\*]/g, '')
					.replace(/([\d\*]{6})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/([\d\*]{6}[\s\-][\d\*]{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/([\d\*]{6}[\s\-][\d\*]{4}[\s\-][\d\*]{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/([\d\*]{6}[\s\-][\d\*]{4}[\s\-][\d\*]{4}[\s\-][\d\*]{3}.)(.*)/, '$1')
					.replace(/([\d\*]{6}[\s\-][\d\*]{4}[\s\-][\d\*]{4}[\s\-][\d\*]{3})([xX0-9\*])?(.*)/, '$1$2')
					.replace(/[\s\-]+$/, '')
					.replace(/([\dxX\*\s\-]{21})(.*)/, '$1')
					.toUpperCase()
				;
			};
			this.chineseIDNumberInput = function (text) {
				// asterisk (*) is NOT allowed
				var divider = ' ';
				return text
					.replace(/[^xX\s0-9]/g, '')
					.replace(/(\d{6})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/(\d{6}[\s\-]\d{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/(\d{6}[\s\-]\d{4}[\s\-]\d{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/(\d{6}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{3}.)(.*)/, '$1')
					.replace(/(\d{6}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{3})([xX0-9])?(.*)/, '$1$2')
					.replace(/[\s\-]+$/, '')
					.replace(/([\dxX\s\-]{21})(.*)/, '$1')
					.toUpperCase()
				;
			};
			this.mobile = function(text) {
				// asterisk (*) is allowed
				var divider = ' ';
				return text
					.replace(/^\-/, '')
					.replace(/[^\-\+\*\d]/g, '')
					.replace(/(\s|.)\+/g, '$1')
					.replace(/([\d\*]{3})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/([\d\*]{3}[\s\-][\d\*]{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/([\d\*]{3}[\s\-][\d\*]{4}[\s\-][\d\*]{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/[\s\-]+$/, '')
					.replace(/([\d\*\s\-]{18})(.*)/, '$1')
				;
			};
			this.mobileInput = function(text) {
				// asterisk (*) is NOT allowed
				var divider = ' ';
				return text
					.replace(/^\-/, '')
					.replace(/[^\-\+\d]/g, '')
					.replace(/(\s|.)\+/g, '$1')
					.replace(/(\d{3})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/(\d{3}[\s\-]\d{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/(\d{3}[\s\-]\d{4}[\s\-]\d{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/[\s\-]+$/, '')
					.replace(/([\d\s\-]{18})(.*)/, '$1')
				;
			};
			this.chineseBankCard = function(text) {
				// C.l('format bank', text);
				// asterisk (*) is allowed
				var divider = ' ';
				return text
					.replace(/[^\d\*]/g, '')
					.replace(/([\d\*]{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/([\d\*]{4}[\s\-][\d\*]{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/([\d\*]{4}[\s\-][\d\*]{4}[\s\-][\d\*]{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/([\d\*]{4}[\s\-][\d\*]{4}[\s\-][\d\*]{4}[\s\-][\d\*]{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/([\d\*]{4}[\s\-][\d\*]{4}[\s\-][\d\*]{4}[\s\-][\d\*]{4}[\s\-][\d\*]{3})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/[\s\-]+$/, '')
					.replace(/([\d\*\s\-]{35})(.*)/, '$1')
				;
			};
			this.chineseBankCardInput = function(text) {
				// asterisk (*) is NOT allowed
				var divider = ' ';
				return text
					.replace(/[^0-9]/g, '')
					.replace(/(\d{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/(\d{4}[\s\-]\d{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/(\d{4}[\s\-]\d{4}[\s\-]\d{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/(\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/(\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{3})[\s\-]*(.*)/, '$1'+divider+'$2')
					.replace(/[\s\-]+$/, '')
					.replace(/([\d\s\-]{35})(.*)/, '$1')
				;
			};


			this.DecimalToChineseNumbers = function DecimalToChineseNumbers(initOptions) {
				var c0s = '〇';
				var c1s = '一';
				var c2s = '二';
				var c3s = '三';
				var c4s = '四';
				var c5s = '五';
				var c6s = '六';
				var c7s = '七';
				var c8s = '八';
				var c9s = '九';
				var c10s = '十';
				var c100s = '百';
				var c1000s = '千';
				var c10000s = '万';
				var cBaseUnitMoneyS = '元';

				var c0t = '零';
				var c1t = '壹';
				var c2t = '贰';
				var c3t = '叁';
				var c4t = '肆';
				var c5t = '伍';
				var c6t = '陆';
				var c7t = '柒';
				var c8t = '捌';
				var c9t = '玖';
				var c10t = '拾';
				var c100t = '佰';
				var c1000t = '仟';
				var c10000t = '萬';
				var cBaseUnitMoneyT = '圆';

				var cBaseUnitRegular = '个';
				var cDot = '点';
				var cYi = '亿';
				var cFractionUnitsMoney = '角分厘豪';
				var cSuffixZheng = '整';


				this.options = { // default values, will be overrided by runtime values
					isMoney: true,
					tenWritesOneTen: false, // 拾写作壹拾；零拾写作零壹拾
					jianXie: false, // 简写
					jianXieLing: false, // 简写零
					jianXieShiBaiQian: false, // 简写十百千
					jianXieWan: false, // 简写万
					jianXieMoneyUnitYuan: false, // 简写元
					fractionMaxDigitsRegular: NaN, // 非货币（钱数）最长小数位数
					fractionMaxDigitsMoney: 2 // 货币（钱数）最长小数位
				};

				this.data = {
					lastGroomedInput: '',
					lastConciseValue: '',
					lastResult: '',
					lastValueHadDot: false
				};

				this.config = config.bind(this);
				this.format = format.bind(this);


				var status = {};


				init.call(this);




				function init() {
					status.isInitializing = true;
					status.noNeedToReconstruct = false;
					this.config(initOptions, this.options);
					delete status.isInitializing;
					delete status.noNeedToReconstruct;
				}

				function config(newOptions, targetOptions) {
					var isInitializing = !!status.isInitializing;

					if (typeof targetOptions !== 'object' || !targetOptions) {
						targetOptions = this.options; // by default we config the this.options instead of runtime options
					}
					if (!isInitializing && typeof targetOptions !== 'object') {
						throw('No targetOptions provided.');
					}

					isInitializing = isInitializing && (targetOptions === this.options);


					WCU.save.number(targetOptions, 'fractionMaxDigitsRegular', newOptions, false, true);
					WCU.save.numberNoLessThan(targetOptions, 'fractionMaxDigitsMoney', newOptions, false, 2);

					var saveBool = WCU.save.boolean;

					var R1 = saveBool(targetOptions, 'isMoney', newOptions);
					// C.t('changed?', R1.valueHasBeenChanged, 'isMoney:', targetOptions.isMoney);
					var R4;
					if (R1.valueHasBeenChanged || isInitializing) {
						R4 = saveBool(targetOptions, 'jianXie', !targetOptions.isMoney);
					}

					var R2 = saveBool(targetOptions, 'jianXie', newOptions);
					var R3 = saveBool(targetOptions, 'tenWritesOneTen', newOptions);

					if ((R4 && R4.valueHasBeenChanged) || R2.valueHasBeenChanged || isInitializing) {
						// if (!targetOptions.isMoney) {
						// 	saveBool(targetOptions, 'jianXieLing', targetOptions.jianXie);
						// }

						saveBool(targetOptions, 'jianXieShiBaiQian', targetOptions.jianXie);
						saveBool(targetOptions, 'jianXieWan', targetOptions.jianXie);
						saveBool(targetOptions, 'jianXieMoneyUnitYuan', targetOptions.jianXie);
					}

					saveBool(targetOptions, 'jianXieLing', newOptions);
					saveBool(targetOptions, 'jianXieShiBaiQian', newOptions);
					saveBool(targetOptions, 'jianXieWan', newOptions);
					saveBool(targetOptions, 'jianXieMoneyUnitYuan', newOptions);


					if (R1.valueHasBeenChanged || R3.valueHasBeenChanged || isInitializing) {
						targetOptions.tenWritesOneTen = targetOptions.tenWritesOneTen || targetOptions.isMoney;
					}
				}

				function format(n, optionsOrIsMoney, shouldLog) {
					// http://www.cnblogs.com/zyxzhsh/archive/2010/10/18/1854476.html

					var inputIsValid = true;
					shouldLog = !!shouldLog;


					if (typeof n === 'number') {
						inputIsValid = !isNaN(n);
						n = n.toString();
					} else if (typeof n === 'string') {
						inputIsValid = /^\d*\.?\d*$/.test(n) && n.length > 0; // 允许小数点前后均无数字，故意要求不那么严格
					} else {
						inputIsValid = false;
					}

					if (!inputIsValid) {
						this.data.lastValueHadDot = false;
						this.data.lastGroomedInput = n;
						this.data.lastConciseValue = '';
						this.data.lastResult = '';
						return '';
						// throw('Invalid number to convert to Chinese capital number.');
					}


					var options = {}; // runtime copy


					this.config(this.options, options); // first of all, copy default values into runtime options


					if (typeof optionsOrIsMoney === 'boolean' || typeof optionsOrIsMoney === 'number') {
						this.config({
							isMoney: optionsOrIsMoney
						}, options);
					} else if (typeof optionsOrIsMoney === 'object' && optionsOrIsMoney) { // should handle null object
						this.config(optionsOrIsMoney, options);
					}

					// if (shouldLog) C.l(options);



					n = n
						.replace(/^0+/, '')
						// .replace(/\.$/, '') // we need to record wheather there was a dot within the input
					;



					var c0 = options.jianXieLing ? c0s : c0t;
					var c1 = options.jianXie ? c1s : c1t;
					var c2 = options.jianXie ? c2s : c2t;
					var c3 = options.jianXie ? c3s : c3t;
					var c4 = options.jianXie ? c4s : c4t;
					var c5 = options.jianXie ? c5s : c5t;
					var c6 = options.jianXie ? c6s : c6t;
					var c7 = options.jianXie ? c7s : c7t;
					var c8 = options.jianXie ? c8s : c8t;
					var c9 = options.jianXie ? c9s : c9t;
					var c10 = options.jianXieShiBaiQian ? c10s : c10t;
					var c100 = options.jianXieShiBaiQian ? c100s : c100t;
					var c1000 = options.jianXieShiBaiQian ? c1000s : c1000t;
					var c10000 = options.jianXieWan ? c10000s : c10000t;

					var cBaseUnitMoney = options.jianXieMoneyUnitYuan ? cBaseUnitMoneyS : cBaseUnitMoneyT;

					var cNumbers  = [c0, c1, c2, c3, c4, c5, c6, c7, c8, c9];
					var cIntUnits = (function () {
						var section = c1000+c100+c10+c10000+c1000+c100+c10; // 千百十万千百十
						return section+cYi+section;
					})();




					var fractionMaxDigitsMoneyDecided = cFractionUnitsMoney.length;

					var fractionMaxDigitsMoneyAllowed = parseInt(options.fractionMaxDigitsMoney);
					if (!isNaN(fractionMaxDigitsMoneyAllowed) && fractionMaxDigitsMoneyAllowed>1) {
						fractionMaxDigitsMoneyDecided = Math.min(fractionMaxDigitsMoneyAllowed, fractionMaxDigitsMoneyDecided);
					}



					var cUnits = cIntUnits;
					var fractionMaxDigits;

					if (options.isMoney) {
						cUnits += cBaseUnitMoney; // 追加个位数字单位，即“圆”。
						fractionMaxDigits = fractionMaxDigitsMoneyDecided;
					} else {
						cUnits += cBaseUnitRegular; // 追加个位数字临时占位单位，即“个”。
						fractionMaxDigits = parseInt(options.fractionMaxDigitsRegular);
					}



					var pop = n.indexOf('.'); // position of point

					var nInterger = '';
					var nFractionRaw = '';
					var inputSegmentAfterDot ='';
					var nFraction = '';
					var i; // loop indexer

					if (pop >= 0) {
						nInterger = n.substring(0, pop);
						inputSegmentAfterDot = n.substring(pop+1);

						if (!isNaN(fractionMaxDigits)) {
							inputSegmentAfterDot = n.substr(pop+1, fractionMaxDigits);
						}

						nFractionRaw = inputSegmentAfterDot.replace(/0*$/, '');
					} else {
						nInterger = n;
					}


					if (options.isMoney) {
						if (nFractionRaw.length > 0) {
							cUnits += cFractionUnitsMoney.slice(0, fractionMaxDigits);
							nFraction = (nFractionRaw + '0000000000000000000000000').slice(0, fractionMaxDigits);
						}
						// 钱数小数点后面的各个数字也带单位，为数字位数与单位位数对应，此处须预先补零
					} else {
						nFraction = nFractionRaw;
					}


					var nWithUnit = nInterger;
					if (options.isMoney) {
						nWithUnit += nFraction; // 钱数小数点后面的各个数字也带单位，所以处理方法与整数部分相同
					}

					cUnits = cUnits.slice(-nWithUnit.length);

					var result = '';
					var resultFraction = '';


					var needSuffixZheng = options.isMoney && (nFractionRaw.length < fractionMaxDigits);


					if (shouldLog) {
						C.l(
							'n:', n, '\t pop:', pop,
							'\n\t nInterger:', nInterger,
							'\n\t fractionMaxDigits:', fractionMaxDigits,
							'\n\t nFractionRaw:', nFractionRaw,
							'\n\t nFraction:', nFraction,
							'\n\t nWithUnit:', nWithUnit,
							'\n\t nWithUnit.length:', nWithUnit.length,
							'\n\t cUnits:', cUnits,
							'\n\t needSuffixZheng:', needSuffixZheng
						);
					}


					for (i=0; i < nWithUnit.length; i++) {
						result += cNumbers[nWithUnit.charAt(i)] + cUnits.charAt(i);
					}

					if (!options.isMoney && nFraction.length) { // 还要处理小数部分，常规模式下，小数部分无单位
						resultFraction = cDot;
						for (i=0; i < nFraction.length; i++) {
							resultFraction += cNumbers[nFraction.charAt(i)];
						}
					}

					if (result.length < 1) {
						result = c0 + (options.isMoney ? cBaseUnitMoney : cBaseUnitRegular);
					}
					if (shouldLog) C.l(options.isMoney, result);




					var regexp;



					if (!options.isMoney) {
						// 去除非钱数的临时单位，即“个”
						regexp = new RegExp(cBaseUnitRegular);
						result = result.replace(regexp, '');
						if (shouldLog) C.l('\n'+regexp + ' ----> '+'""'+ '\n\t\t' + result);
					}



					// 取得所有零值的配套单位，例如“零仟零佰”变成“零零”；其中，最新钱数单位暂不处理，因为末尾的零值须另行处理
					regexp = new RegExp(
						c0+'('+
							(
								c1000+c100+c10+(options.isMoney ? cFractionUnitsMoney.slice(0, fractionMaxDigitsMoneyDecided-1) : '')
							).split('').join('|')+
						')',
						'g'
					);
					result = result.replace(regexp, c0);
					if (shouldLog) C.l('\n'+regexp + ' ----> '+c0+ '\n\t\t' + result);


					// 处理连零
					regexp = new RegExp(c0+'+', 'g');
					result = result.replace(regexp, c0);
					if (shouldLog) C.l('\n'+regexp + ' ----> '+c0+ '\n\t\t' + result);


					// 处理连零之后（注意，是之后），“零亿”、“零万”之前剩余的“零”须去除
					regexp = new RegExp(c0+'('+cYi+'|'+c10000+')', 'g');
					result = result.replace(regexp, '$1');
					if (shouldLog) C.l('\n'+regexp + ' ----> '+'$1'+ '\n\t\t' + result);



					// 去除零万之前的零之后（注意，是之后），“亿”、“万”二字可能紧邻，须将“万”字替换为“零”字；
					// 但如果“亿万”二字后面原本就紧跟“零”字，则不需追加额外“零”字
					regexp = new RegExp(cYi+c10000+c0+'*', 'g');
					result = result.replace(regexp, cYi+c0);
					if (shouldLog) C.l('\n'+regexp + ' ----> '+cYi+c0+ '\n\t\t' + result);



					// 为安全起见，很多场合要求将小于二十的值，写作“壹拾”，即“壹”不省略
					// 如果不要求写作“壹拾”，则应去除前面的“壹”
					if (!options.tenWritesOneTen) {
						
						regexp = new RegExp('^'+c1+c10);
						result = result.replace(regexp, c10);
						if (shouldLog) C.l('\n'+regexp + ' ----> '+c10+ '\n\t\t' + result);


						regexp = new RegExp(c0+c1+c10, 'g');
						result = result.replace(regexp, c0+c10);
						if (shouldLog) C.l('\n'+regexp + ' ----> '+c10+ '\n\t\t' + result);
					}


					// 如果“零”出现在整数部分或整个字符串末尾，却又不是整数部分唯一的字符或整个串唯一的字符，那么应去除该“零”
					regexp = new RegExp('(.+)'+c0+(options.isMoney ? ('('+cBaseUnitMoney+')') :'$'));
					result = result.replace(regexp, '$1$2');
					if (shouldLog) C.l('\n'+regexp + ' ----> '+'$1$2'+ '\n\t\t' + result);



					if (options.isMoney) {
						// 钱数最小单位前方如果出现了零，则零连同单位整个去掉
						var smallestMoneyUnitThatUsed = cFractionUnitsMoney[fractionMaxDigitsMoneyDecided-1];
						regexp = new RegExp(c0+smallestMoneyUnitThatUsed);
						result = result.replace(regexp, '');
						// if (shouldLog) C.l('smallestMoneyUnitThatUsed:', smallestMoneyUnitThatUsed);
						if (shouldLog) C.l('\n'+regexp + ' ----> '+'""'+ '\n\t\t' + result);


						// 如果没有整数部分，即仅有“角分厘豪”，那么字符串首部的“零”须去除
						if (nInterger.length < 1 && nFractionRaw.length > 0) {
							regexp = new RegExp('^'+c0+'+');
							result = result.replace(regexp, '');
							if (shouldLog) C.l('\n'+regexp + ' ----> '+'""'+ '\n\t\t' + result);
						}


						// 如果亿或者万字后面是元，而元之后还有合法内容，则亿字或万字后面不一个“零”字
						regexp = new RegExp('('+cYi+'|'+c10000+')'+cBaseUnitMoney+'(.+)');
						result = result.replace(regexp, '$1'+cBaseUnitMoney+c0+'$2');
						if (shouldLog) C.l('\n'+regexp + ' ----> '+'$1'+cBaseUnitMoney+c0+'$2'+ '\n\t\t' + result);


						// 假定钱数最小单位是“分”，那么“两角”应做“两角整”；
						// 假定钱数最小单位是“厘”，那么“两分”应做“两分整”；
						// 依此类推
						if (needSuffixZheng) {
							result += cSuffixZheng;
						}
					} else {
						result += resultFraction;

						// 如果“零点”并非出现在字符串起始，那么应去除该“零”
						regexp = new RegExp('(.+)'+c0+cDot);
						result = result.replace(regexp, '$1'+cDot);
						if (shouldLog) C.l('\n'+regexp + ' ----> '+'$1'+cDot+ '\n\t\t' + result);


						// 如果“点”出现在字符串末尾，那么应去除该“点”
						regexp = new RegExp(cDot+'$');
						result = result.replace(regexp, '');
						if (shouldLog) C.l('\n'+regexp + ' ----> '+'""'+ '\n\t\t' + result);
					}



					var nIntergerString = nInterger.length ? nInterger : '0';
					this.data.lastValueHadDot = pop >= 0;
					this.data.lastResult = result;
					this.data.lastGroomedInput = nIntergerString +
						(this.data.lastValueHadDot ? ('.') : '') + inputSegmentAfterDot
					;
					this.data.lastConciseValue = nIntergerString +
						(nFractionRaw.length ? ('.') : '') + nFractionRaw
					;

					if (shouldLog) C.l('\nFINAL：\n\t\t', this.data);
					return result;
				}
			};
			this.decimalToChineseNumbers = (function () { // for direct usage
				var formatter = new this.DecimalToChineseNumbers({
					isMoney: false,
				});
				return formatter;
			}).call(this);
			this.decimalToChineseMoney = (function () { // for direct usage
				var formatter = new this.DecimalToChineseNumbers({
					isMoney: true
				});
				return formatter;
			}).call(this);
		}).call(stringFormatters);


		var validateString = {};
		this.validateString = validateString;
		(function () {
			function getNonEmptyString(value) {
				if (value && typeof value === 'string') return value;
				return '';
			}
			this.toBe = this;
			this.being = this;
			this.digitsOnly = function (value) {
				return /\d+/.test(getNonEmptyString(value));
			};
		}).call(validateString);
	}).call(WCU);


	var DOM = {};
	this.DOM = DOM;
	(function () { // DOM
		this.getRole = function (dom) {
			if (dom instanceof Node) {
				var role = dom.getAttribute('role');
				if (typeof role === 'string') return role.toLowerCase();
			}
			return '';
		};

		this.setRole = function (dom, newRole) {
			if (!(dom instanceof Node) || !newRole || typeof newRole !== 'string') {
				return '';
			}

			newRole = newRole.toLowerCase();

			var existingRole = dom.getAttribute('role');
			if (typeof existingRole === 'string' && existingRole.length > 0) {
				C.w('Changing role of an element is Not recommanded by W3C.');
			}

			dom.setAttribute('role', newRole);

			return newRole;
		};

		this.ANestedInB = function (A, B, considerAisBAsTrue) {
			if (!(A instanceof Node && B instanceof Node)) return false;

			if (!considerAisBAsTrue) A = A.parentNode;
			while (A.tagName && A!==document.body && A!==B) {
				A = A.parentNode;
			}

			return A===B;
		};

		this.validateRootElement = function(dom, constructorName, options) {
			options = options || {};

			if (!options.domAlias || typeof options.domAlias !== 'string') {
				options.domAlias = 'rootElement';
			}

			if (typeof constructorName === 'object') {
				constructorName = constructorName.constructor.name;
			} else if (typeof constructorName === 'function') {
				constructorName = constructorName.name;
			}

			if (!constructorName || typeof constructorName !== 'string') {
				constructorName = '<untitled constructor>';
			}

			if (
				!(dom instanceof Node) || 
				dom === document || 
				dom === document.documentElement ||
				(dom === document.body && !options.allowBody)
			) {
				var errorString = 'Invalid '+options.domAlias+' for constructing a '+constructorName+'.';
				if (!options.shouldThrowError) {
					C.e(errorString);
					return null;
				} else {
					throw(errorString);
				}
			}

			return dom;
		};

		// this.makeSureParentNodeHasChildren = function (parentNode, desiredCount, className, desiredTagName) {
			// if (!parentNode) return false;

			// desiredCount = parseInt(desiredCount);
			// if (isNaN(desiredCount) || desiredCount < 1) return false;

			// if (!className || typeof className === 'string') {
			// 	return false;
			// }

			// if (!desiredTagName || typeof desiredTagName === 'string') {
			// 	if (!/(\w+)|(\w+[\w\-]*\w+)/.test(desiredTagName)) {
			// 		return false;
			// 	}
			// 	desiredTagName = '';
			// }

			// var $foundChildren = $(parentNode).find(desiredTagName+'.'+className);

			// var i, child;

			// var tagName;
			// if (!desiredTagName && $foundChildren.length > 0) {
			// 	tagName = $foundChildren[0].tagName;
			// } else {
			// 	tagName = desiredTagName || 'div';
			// }


			// for (i = $foundChildren.length; i < desiredCount; i++) {
			// 	child = document.createElement(tagName);
			// 	$(child).addClass(className);
			// 	parentNode.appendChild(child);
			// }
			// for (i = desiredCount; i < $foundChildren.length; i++) {
			// 	child = $foundChildren[i];
			// 	child.parentNode.removeChild(child);
			// }

			// var finalChildren = Array.prototype.slice.apply(
			// 	$(parentNode).find(tagName+'.'+className)
			// );

			// for (i = 0; i < finalChildren.length; i++) {
			// 	child = finalChildren[i];
			// 	if (child.parentNode !== parentNode) {
			// 		parentNode.appendChild(child);
			// 	}
			// }

			// return (finalChildren.length > 1) ? finalChildren : finalChildren[0];
		// };
	}).call(DOM);


	var generalTools = {};
	this.generalTools = generalTools;
	(function () {
		this.URI = {
			evaluateParameters: function (URIString) {
				if (typeof URIString !== 'string') URIString = window.location.href;
				var p; // fisrt position of '?' and then parameters sub string
				var s; // position of '#'
				var urlP = {};
				var i, pair;

				p = URIString.indexOf('\?');
				if (p<0) return urlP;

				s = URIString.indexOf('#');
				if (s<p) s = URIString.length; // in case '#' comes before '?', which is illegal, but we are still trying to handle that

				p = URIString.slice(p+1,s);

				p = p.split('&');
				for (i = 0; i < p.length; i++) {
					pair = p[i].split('=');
					if (pair[0].length===0) continue;
					if (pair.length===1) pair.push('');
					urlP[pair[0]] = decodeURIComponent(pair[1]);
				}

				return urlP;
			},

			generateURIComponentFromObject: function(parameters, URIToAppendTo) {
				parameters = parameters || {};

				var parametersURI = '';
				var i=0;

				for (var key in parameters) {
					parametersURI += '&' + key + '=' + encodeURIComponent(parameters[key]);
					i++;
				}

				var alreadyHasQuestionMark = false;
				if (typeof URIToAppendTo === 'string' && URIToAppendTo.length > 0) {
					alreadyHasQuestionMark = !!URIToAppendTo.match(/\?/);
				} else {
					if (i > 0) {
						URIToAppendTo = '?';
					}
				}

				var questionMarkIsAtEnd = URIToAppendTo.slice(-1) === '?';
				if (questionMarkIsAtEnd) {
					parametersURI = parametersURI.slice(1);
				}
				
				parametersURI = URIToAppendTo + parametersURI;

				return parametersURI;
			}
		};
	}).call(generalTools);


	var animation = {};
	this.animation = animation;
	(function () {
		var animationEnv = {
			cssTransitionsAreSupported: true,
			cssAnimationsAreSupported: true,
			cssTransitionPropertyName: 'transition',
			cssTransitionEndEventName: 'transitionend',
			cssAnimationPropertyName: 'animation',
			cssAnimationEndEventName: 'animationend'
		};

		var _BS = document.body.style;

		var _w3cT = typeof _BS.transition === 'string';
		var _webkitT = typeof _BS.webkitTransition === 'string';
		animationEnv.cssTransitionsAreSupported = _w3cT || _webkitT;
		if (!_w3cT && _webkitT) {
			animationEnv.cssTransitionPropertyName = 'webkitTransition';
			animationEnv.cssTransitionEndEventName = 'webkitTransitionEnd';
		}

		var _w3cA = typeof _BS.animation === 'string';
		var _webkitA = typeof _BS.webkitAnimation === 'string';
		animationEnv.cssAnimationsAreSupported = _w3cA || _webkitA;
		if (!_w3cA && _webkitA) {
			animationEnv.cssAnimationPropertyName = 'webkitAnimation';
			animationEnv.cssAnimationEndEventName = 'webkitAnimationEnd';
		}


		this.env = animationEnv;
		this.applyMultipleViaAnimationName = applyMultipleAnimationsViaAnimationName;
		this.applySingleViaAnimationName   = applySingleAnimationViaAnimationName;
		this.applySingleViaCssClassName    = applySingleAnimationViaCssClassName;


		function applyMultipleAnimationsViaAnimationName(targets, animationNameString, options) {
			var privateOptions = {
				playOneAfterOne: false,
				firstDelay: 0,
				delayA: 0.12,
				delayB: 0.319,
				durationA: 0.27,
				durationB: 0.32
			};

			var privateStatus = {
				onEachAnimationEnd: [],
				onAllAnimationsEnd: []
			};

			WCU.save.boolean(privateOptions, 'playOneAfterOne', options);

			WCU.save.number(privateOptions, 'firstDelay', options);
			WCU.save.number(privateOptions, 'delayA', options);
			WCU.save.number(privateOptions, 'delayB', options);

			WCU.save.numberNonNegative(privateOptions, 'durationA', options);
			WCU.save.numberNonNegative(privateOptions, 'durationB', options);


			delete options.playOneAfterOne;
			delete options.firstDelay;
			delete options.delayA;
			delete options.delayB;
			delete options.durationA;
			delete options.durationB;


			var i, callBack;

			if (options.hasOwnProperty('onEachAnimationEnd')) {
				if (!Array.isArray(options.onEachAnimationEnd)) {
					options.onEachAnimationEnd = [options.onEachAnimationEnd];
				}

				for (i = 0; i < options.onEachAnimationEnd.length; i++) {
					callBack = options.onEachAnimationEnd[i];
					if (typeof callBack === 'function') {
						privateStatus.onEachAnimationEnd.push(callBack);
					}
				}
				delete options.onEachAnimationEnd;
			}

			options.onAnimationEnd = _onEachAnimationEnd;


			if (options.hasOwnProperty('onAllAnimationsEnd')) {
				if (!Array.isArray(options.onAllAnimationsEnd)) {
					options.onAllAnimationsEnd = [options.onAllAnimationsEnd];
				}

				for (i = 0; i < options.onAllAnimationsEnd.length; i++) {
					callBack = options.onAllAnimationsEnd[i];
					if (typeof callBack === 'function') {
						privateStatus.onAllAnimationsEnd.push(callBack);
					}
				}
				delete options.onAllAnimationsEnd;
			}


			options.animationDefinitionSuffix = 'both';


			// var delays = [];
			// var durations = [];
			// var delaysPlusDurations = [];
			var maxDelay = -100000;
			var maxDuration = 0;
			var maxDelayPlusDuration = 0;


			var _O = privateOptions;

			var elementOfMaxDelay;
			var elementOfMaxDuration;
			var elementOfMaxDelayPlusDuration;
			var delay = _O.firstDelay;
			var duration;

			var cssClassNames = options.cssClassNamesToAddDuringGroupAnimation || null;
			$(targets).addClass(cssClassNames);

			for (i = 0; i < targets.length; i++) {
				var target = targets[i];

				if (delay > maxDelay) {
					maxDelay = delay;
					elementOfMaxDelay = target;
				}

				duration = _randomBetween(_O.durationA, _O.durationB);
				if (duration > maxDuration) {
					maxDuration = duration;
					elementOfMaxDuration = target;
				}

				var delayPlusDuration = delay + duration;
				if (delayPlusDuration > maxDelayPlusDuration) {
					maxDelayPlusDuration = delayPlusDuration;
					elementOfMaxDelayPlusDuration = target;
				}

				// delays[i] = delay;
				// durations[i] = duration;
				// delaysPlusDurations[i] = delayPlusDuration;

				options.delay = delay;
				options.duration = duration;
				options.secondsToWaitForAnimationEnd = delayPlusDuration;


				applySingleAnimationViaAnimationName(target, animationNameString, options);


				var offset = _randomBetween(_O.delayA, _O.delayB);
				if (_O.playOneAfterOne) {
					delay = offset + delayPlusDuration;
				} else {
					delay += offset;
				}
			}


			function _randomBetween(a, b) {
				return b + (a-b) * Math.random();
			}

			function _onEachAnimationEnd() {
				var calbacks = privateStatus.onEachAnimationEnd;
				var element = this;
				for (var i = 0; i < calbacks.length; i++) {
					var callBack = calbacks[i];
					if (typeof callBack === 'function') {
						callBack.apply(element, arguments);
					}
				}

				if (element === elementOfMaxDelayPlusDuration) {
					_onAllAnimationsEnd.apply(null, arguments);
				} else {
					$(element).addClass('waiting');
				}
			}

			function _onAllAnimationsEnd() {
				$(targets).removeClass('waiting '+cssClassNames);

				var calbacks = privateStatus.onAllAnimationsEnd;
				for (var i = 0; i < calbacks.length; i++) {
					var callBack = calbacks[i];
					if (typeof callBack === 'function') {
						callBack.apply(null, arguments);
					}
				}
			}
		}

		function applySingleAnimationViaCssClassName(target, cssClassName, knownDuration, options) {
			// knownDuration is for animation end timer
			knownDuration = parseFloat(knownDuration);
			if (isNaN(knownDuration) || knownDuration < 0) {
				C.e('Please provide knownDuration for css animation via css class.');
				return false;
			}

			if (typeof options !== 'object') options = {};

			options.duration = knownDuration;

			_applyAnimation(target, doApplyAnimation, doRemoveAnimation, options);

			function doApplyAnimation(target/*, options*/) {
				$(target).addClass(cssClassName);
				return true;
			}

			function doRemoveAnimation() {
				$(target).removeClass(cssClassName);
			}
		}

		function applySingleAnimationViaAnimationName(element, animationNameString, options) {
			_applyAnimation(element, doApplyAnimation, doRemoveAnimation, options);

			function doApplyAnimation(element, options) {
				var duration = ' '+options.duration+'s';
				var delay    = (options.delay)    ? (' '+options.delay+'s') : '';
				var suffix   = (options.animationDefinitionSuffix) ? (' '+options.animationDefinitionSuffix) : '';

				var animationDefinition = animationNameString + duration + delay + suffix;

				if (animationEnv.cssAnimationsAreSupported) {
					element.style[animationEnv.cssAnimationPropertyName] = animationDefinition;
				}

				if (options.cssClassNamesToAdd) {
					$(element).addClass(options.cssClassNamesToAdd);
				}

				return true;
			}

			function doRemoveAnimation() {
				// C.t('remove ani from', this);
				this.style[animationEnv.cssAnimationPropertyName] = '';

				if (options.cssClassNamesToAdd) {
					$(element).addClass(options.cssClassNamesToAdd);
				}
			}
		}

		function _applyAnimation(element, doApplyAnimation, doRemoveAnimation, options) {
			var privateOptions = {
				cssClassNamesToAdd: '',
				showBeforeAnimating: false,
				allowedMinDuration: 0.2,
				duration: 0.3,
				actionAfterPlayingAnimation: null,
				shouldNotWaitForAnimationEndForEver: true,
				secondsToWaitForAnimationEnd: 0.4
			};

			var privateStatus = {
				animationNotEndedEitherWay: true,
				onAnimationEnd: []
			};

			options = options || {};

			WCU.save.boolean(privateOptions, 'showBeforeAnimating', options);
			WCU.save.boolean(privateOptions, 'shouldNotWaitForAnimationEndForEver', options);

			var R1 = WCU.save.numberNoLessThan(privateOptions, 'duration', options, false, privateOptions.allowedMinDuration);
			var R2 = WCU.save.numberNoLessThan(privateOptions, 'secondsToWaitForAnimationEnd', options, false, privateOptions.duration);
			if (R1.valueHasBeenChanged && !R2.valueHasBeenChanged) {
				privateOptions.secondsToWaitForAnimationEnd = Math.max(privateOptions.secondsToWaitForAnimationEnd, privateOptions.duration);
			}

			if (options.actionAfterPlayingAnimation === 'hide') {
				privateOptions.actionAfterPlayingAnimation = 'hide';
			} else if (
				options.actionAfterPlayingAnimation === 'nothing' ||
				options.actionAfterPlayingAnimation === 'none' ||
				options.actionAfterPlayingAnimation === 'null' ||
				options.actionAfterPlayingAnimation === null
			) {
				privateOptions.actionAfterPlayingAnimation = null;
			} else if (
				options.actionAfterPlayingAnimation === 'remove' ||
				options.actionAfterPlayingAnimation === 'delete' ||
				options.actionAfterPlayingAnimation === 'del' ||
				options.actionAfterPlayingAnimation === 'destroy'
			) {
				privateOptions.actionAfterPlayingAnimation = 'remove';
			}


			options.duration = privateOptions.duration; // for "doApplyAnimation"


			if (options.hasOwnProperty('onAnimationEnd')) {
				if (!Array.isArray(options.onAnimationEnd)) {
					options.onAnimationEnd = [options.onAnimationEnd];
				}

				for (var i = 0; i < options.onAnimationEnd.length; i++) {
					var callBack = options.onAnimationEnd[i];
					if (typeof callBack === 'function') {
						privateStatus.onAnimationEnd.push(callBack);
					}
				}
			}


			var succeeded = doApplyAnimation(element, options);

			if (succeeded) {
				// C.l('applied!', options);
				var nonCssAnimationClassName = animationEnv.cssAnimationsAreSupported ? '' : 'non-css-ani ';
				$(element).addClass('animating '+nonCssAnimationClassName+privateOptions.cssClassNamesToAdd);

				if (privateOptions.showBeforeAnimating) {
					$(element).show();
				}

				element.addEventListener(animationEnv.cssAnimationEndEventName, _onAnimationEnd);
				if (privateOptions.shouldNotWaitForAnimationEndForEver) {
					setTimeout(function () {
						_onAnimationEnd(null, true);
					}, privateOptions.secondsToWaitForAnimationEnd * 1000);
				}
			}

			function _onAnimationEnd(event, invokedViaTimer) {
				if (!privateStatus.animationNotEndedEitherWay) {
					return true;
				}
				privateStatus.animationNotEndedEitherWay = false;

				if (invokedViaTimer === true) {
					if (animation.env.cssAnimationsAreSupported) {
						// C.w('Timer ends waiting of animation for ', element);
					}
				}

				if (animationEnv.cssAnimationsAreSupported) {
					element.removeEventListener(animationEnv.cssAnimationEndEventName, _onAnimationEnd);
					$(element).removeClass('animating '+privateOptions.cssClassNamesToAdd);
				}


				if (typeof doRemoveAnimation === 'function') doRemoveAnimation.apply(element, arguments);

				for (var i = 0; i < privateStatus.onAnimationEnd.length; i++) {
					var callBack = privateStatus.onAnimationEnd[i];
					if (typeof callBack === 'function') {
						callBack.apply(element, arguments);
					}
				}


				if (privateOptions.actionAfterPlayingAnimation === 'hide') {
					$(element).hide();
				} else if (privateOptions.actionAfterPlayingAnimation === 'remove') {
					element.parentNode.removeChild(element);
				}
			}
		}
	}).call(animation);


	var UI = {};
	this.UI = UI;
	(function () { // UI
		this.bodyClickListener = new BodyClickListener();
		function BodyClickListener() {
			/*
				require:
					ANestedInB()
			*/
			this.registeredElements = [];

			this.register = function (elements, callback) {
				if (typeof callback !== 'function') return false;

				if (!Array.isArray(elements)) elements = [elements];
				for (var i = 0; i < elements.length; i++) {
					var el = elements[i];
					if (!el) continue;
					this.registeredElements.push({
						element: el,
						callback: callback
					});
				}
			};

			this.broadCastOutsideClickToRegisteredElements = function (clickedEl) {
				for (var i = 0; i < this.registeredElements.length; i++) {
					var record = this.registeredElements[i];
					var el = record.element;
					var isOutside = this.testClickOutsideElement(el, clickedEl);
					if (isOutside) {
						record.callback(clickedEl);
					}
				}
			};

			this.testClickOutsideElement = function (testEl, clickedEl) {
				return !wlc.DOM.ANestedInB(clickedEl, testEl, true);

				// if (!testEl || !clickedEl) return true;

				// while (clickedEl && clickedEl!==document.body && clickedEl!==testEl) {
				// 	clickedEl = clickedEl.parentNode;
				// }

				// return testEl !== clickedEl;
			};

			function init() {
				$('body').on('click', (function (event) {
					var clickedEl = event.target;
					this.broadCastOutsideClickToRegisteredElements(clickedEl);
				}).bind(this));
			}

			init.call(this);
		}

		// this.Menu_NOT_DONE_YET = function Menu(rootElement, initOptions) {
			// // function example() {
			// // 	conf = conf || {};
			// // 	conf.level1IdPrefix = 'menu-chief-1-';
			// // 	setMenuCurrentItemForLevel(1, 2, $('#app-chief-nav'), conf);
			// // }

			// this.options = {
			// 	cssClassItemActive: 'current',
			// 	cssClassItemParentOfActive: 'current-parent'
			// };

			// this.onItemActivate = undefined;
			// this.onItemDeactivate = undefined;

			// function setMenuCurrentItemForLevel(level, depth, parentDom, conf) {
			// 	level = parseInt(level);
			// 	depth = parseInt(depth);
			// 	var levelIsValid = level > 0;
			// 	var depthIsValid = depth >= level;

			// 	if (!levelIsValid || !depthIsValid) {
			// 		throw('Invalid menu level/depth for configuring a menu tree.');
			// 	}
			// 	if (typeof conf !== 'object') {
			// 		throw('Invalid configuration object for configuring a menu tree.');
			// 	}

			// 	var prefix = conf['level'+level+'IdPrefix'];
			// 	var desiredId = prefix + conf['level'+level];

			// 	var $allItems = $(parentDom).find('.menu.level-'+level+' > .menu-item');
			// 	var currentItem;
			// 	var currentItemId;

			// 	$allItems.each(function (index, menuItem) {
			// 		var itemLabel = $(menuItem).find('> a > .label')[0];
			// 		var itemId = itemLabel.id;

			// 		var isCurrentItemOrParentOfCurrentItem = itemId && desiredId && (itemId===desiredId);
			// 		var isCurrentItem = isCurrentItemOrParentOfCurrentItem && level === depth;
			// 		if (isCurrentItemOrParentOfCurrentItem) {
			// 			currentItem = menuItem;
			// 			currentItemId = itemId;
			// 			if (isCurrentItem) {
			// 				$(menuItem).addClass('current');
			// 				$(menuItem).removeClass('current-parent');
			// 			} else {
			// 				$(menuItem).addClass('current-parent');
			// 				$(menuItem).removeClass('current');
			// 			}
			// 		} else {
			// 			$(menuItem).removeClass('current');
			// 			$(menuItem).removeClass('current-parent');
			// 		}
			// 	});

			// 	var currentSubMenuItem = null;
			// 	if (level < depth && currentItem) {
			// 		var nextLevel = level + 1;
			// 		conf['level'+nextLevel+'IdPrefix'] = currentItemId + '-' + nextLevel + '-';
			// 		currentSubMenuItem = setMenuCurrentItemForLevel(nextLevel, depth, currentItem, conf);
			// 		if (currentSubMenuItem) {
			// 			$(currentItem).addClass('has-sub-menu'); // update this for robustness
			// 			$(currentItem).addClass('coupled-shown');
			// 		}
			// 	}

			// 	return currentSubMenuItem || currentItem;
			// }
		// };

		this.PopupLayersManager = function PopupLayersManager() {
			var thisController = this;

			// var privateStatus = {};

			var privateOptions = {
				shouldNotWaitForAnimationEndForEver: true,
				secondsToWaitBeforeBackPlateLeavingAniamtionStart: 0.5,
				secondsToWaitBackPlateLeavingAniamtionEnd: 0.6,
				secondsToWaitPopupWindowShowingAniamtionEnd: 0.8,
				secondsToWaitPopupWindowLeavingAniamtionEnd: 1.0,
				cssAnimationSupported: true,
				cssAnimationEndEventName: 'animationend'
			};

			var elements = {
				$popupLayersContainersUnderApp: $('.app > .popup-layers')
			};

			this.show = function (popupLayerIdOrDom, event, options) {
				_showOrHidePopupLayer(popupLayerIdOrDom, true, event, options);
			};
			this.hide = function (popupLayerIdOrDom, options) {
				_showOrHidePopupLayer(popupLayerIdOrDom, options);
			};

			this.processAllUnder = _processAllUnder.bind(this);

			(function _init () {
				this.processAllUnder('app');
			}).call(this);

			function _processAllUnder(appOrPageOrPLContainer) {
				var $plContainers;
				if (appOrPageOrPLContainer === 'app') {
					$plContainers = elements.$popupLayersContainersUnderApp;
				} else if (appOrPageOrPLContainer === 'all-pages') {
					$plContainers = $('.page .popup-layers');
				} else if ($(appOrPageOrPLContainer).hasClass('page')) {
					$plContainers = $(appOrPageOrPLContainer).find('.popup-layers');
				} else if ($(appOrPageOrPLContainer).hasClass('.popup-layers')) {
					$plContainers = $(appOrPageOrPLContainer);
				} else {
					return false;
				}

				if ($plContainers.length < 1) {
					return false;
				}

				$plContainers.each(function () {
					var plContainer = this;
					var $plContainer = $(plContainer);

					var $bp = $plContainer.find('.popup-layers-back-plate');
					if ($bp.length < 1) {
						C.w('Back plate not found under ', plContainer);
					}

					$plContainer.find('.popup-layer').each(function () {
						var pl = this;
						if (!!pl.status && (pl.status.popupLayerHasBeenProcessed === true)) {
							C.l('Skipped popup-layer "'+pl.id+'", which has already been processed.');
							return true;
						}

						if (typeof pl.elements !== 'object') pl.elements = {};

						pl.elements.popupLayersBackPlate = $bp[0];
						// C.l(pl.id, pl.elements.popupLayersBackPlate);

						var $pl = $(pl);

						$pl.find('[button-action="confirm"], [button-action="cancel"]').on('click', function() {
							thisController.hide(pl);
						});

						var $pw = $pl.find('.popup-window');
						_clearCssClassNamesAboutShowingAnimationsForPopupWindow($pw);
						_clearCssClassNamesAboutLeavingAnimationsForPopupWindow($pw);

						if (typeof pl.status !== 'object') pl.status = {};
						pl.status.popupLayerHasBeenProcessed = true;
					});
				});
			}

			function _clearCssClassNamesAboutShowingAnimationsForPopupWindow($pw) {
				$pw
					.removeClass([
						'shows-up-from-center',
						'shows-up-from-top',
						'shows-up-from-top-left',
						'shows-up-from-top-right',
						'shows-up-from-bottom',
						'tall-window-shows-up-from-bottom',
						'shows-up-from-bottom-left',
						'shows-up-from-bottom-right',
						'shows-up-from-leftside',
						'shows-up-from-rightside'
					].join(' '))
				;
			}

			function _clearCssClassNamesAboutLeavingAnimationsForPopupWindow($pw) {
				$pw
					.removeClass([
						'regular-window-leave-from-above',
						'tiny-window-leave-from-above',
						'tall-window-leave-from-above'
					].join(' '))
				;
			}

			function _showOrHidePopupLayer(popupLayerIdOrDom, isToShow, eventOfShow, options) {
				if (!popupLayerIdOrDom) return false;

				options = options || {};

				var plId, pl;
				if (typeof popupLayerIdOrDom === 'string') {
					plId = '#'+popupLayerIdOrDom.replace(/^\s*#?/, '').replace(/\s*$/, '');
					pl = $(plId)[0];
				} else {
					pl = popupLayerIdOrDom;
					plId = pl.id;
				}

				if (!pl) {
					C.e('Cannot find popup layer with id "'+plId+'".');
					return false;			
				}


				var bp = null;
				if (!pl.elements) {
					C.w('Popup layer with id "'+plId+'" might not be initialized.');
				} else {
					bp = pl.elements.popupLayersBackPlate;
				}

				var $bp = $(bp);
				
				$bp.removeClass('popup-layer-back-plate-leaving'); // just for safety

				var $pl = $(pl);
				var $pw = $pl.find('.popup-window');
				var pw = $pw[0];

				var isPoliteMessage = $pl.hasClass('polite-message');
				var isPopupPanel = $pl.hasClass('has-docked-panel');
				var hasPopupWindowOrDialog = !$pl.hasClass('has-no-popup-window');

				var pwHeightCategory = 'regular';

				if (!isToShow) {
					var needToPlayLeavingAnimation = animation.env.cssAnimationsAreSupported &&
						!!pw && hasPopupWindowOrDialog &&
						!isPopupPanel && !isPoliteMessage
					;
					var needToHideBackPlate = !!bp && !isPoliteMessage;
						
					if (needToPlayLeavingAnimation) {
						var pwHeight = $pw.outerHeight();
						if (pwHeight <= (window.innerHeight * 0.25)) {
							pwHeightCategory = 'tiny';
						} else if (pwHeight > (window.innerHeight * 0.79)) {
							pwHeightCategory = 'tall';
						}

						// _clearCssClassNamesAboutShowingAnimationsForPopupWindow($pw);
						animation.applySingleViaCssClassName(
							pw,
							pwHeightCategory+'-window-leave-from-above',
							privateOptions.secondsToWaitPopupWindowLeavingAniamtionEnd,
							{
								onAnimationEnd: function () {
									$pl.hide();
								}
							}
						);
					} else {
						if (isPoliteMessage) {
							$pl.fadeOut();
						} else {
							$pl.hide();					
						}
					}

					if (needToHideBackPlate) {
						var needToHideBackPlateAfterAnimation = animation.env.cssAnimationsAreSupported;
						if (needToHideBackPlateAfterAnimation && needToPlayLeavingAnimation) {
							setTimeout(function () {
								animation.applySingleViaCssClassName(
									bp,
									'popup-layer-back-plate-leaving', 
									privateOptions.secondsToWaitBackPlateLeavingAniamtionEnd,
									{
										actionAfterPlayingAnimation: 'hide'
									}
								);
							}, privateOptions.secondsToWaitBeforeBackPlateLeavingAniamtionStart * 1000);
						} else {
							// $bp.hide();
							animation.applySingleViaCssClassName(
								bp,
								'popup-layer-back-plate-leaving', 
								privateOptions.secondsToWaitBackPlateLeavingAniamtionEnd,
								{
									actionAfterPlayingAnimation: 'hide'
								}
							);
						}
					}
				} else {
					var needToShowBackPlate = !!bp && !isPoliteMessage;
					if (needToShowBackPlate) $bp.show();

					var needToPlayShowingAnimation = animation.env.cssAnimationsAreSupported &&
						!!pw && hasPopupWindowOrDialog &&
						!isPopupPanel
					;

					if (!needToPlayShowingAnimation) {
						// nothing to prepare for
					} else {
						// prepare for animation
						var needToAssignCssClassNameForAnimation = !isPoliteMessage;



						// Height of popup window NOT available yet!
						if ($pw.hasClass('full-screen')) {
							pwHeightCategory = 'tall';
						}



						var chosenCssClassNameForShowingAnimation;

						var needToDecideShowingUpDirection = needToAssignCssClassNameForAnimation && true; // always do this
						if (needToDecideShowingUpDirection) {
							chosenCssClassNameForShowingAnimation = _decideShowingUpSourceDirection(eventOfShow, pwHeightCategory);
						}

						if (needToAssignCssClassNameForAnimation && chosenCssClassNameForShowingAnimation) {
							// $pw.addClass(chosenCssClassNameForShowingAnimation);
							animation.applySingleViaCssClassName(
								pw,
								chosenCssClassNameForShowingAnimation,
								privateOptions.secondsToWaitPopupWindowShowingAniamtionEnd
							);
						}
					}

					if (!!eventOfShow && eventOfShow.target instanceof Node && typeof eventOfShow.target.blur === 'function') {
						eventOfShow.target.blur();
					}

					setTimeout(function () {
						// css animation-delay does not work very well, so we use timer here
						// plus we have to wait for PopupLayer ::before pseudo element to be ready

						$pl.show(
							// do NOT use jquery.show(complete) callback.
							// otherwise the process will effect css animation of popup window under the popup layer.
						);
					}, 100);

					if (!isPoliteMessage && (!options.shouldNotAutoFocusAnything || options.focusingObject)) {
						setTimeout(function () {
							tryToFocusSomething($pl, options.focusingObject);
						}, 10);
					}



					var shouldHideAutomatically = isPoliteMessage;
					if (shouldHideAutomatically) {
						var durationBeforeAutoHide = 3000;
						var _temp = parseFloat(pl.getAttribute('data-showing-duration-in-seconds'));
						if (!isNaN(_temp) && _temp > 2) durationBeforeAutoHide = _temp * 1000;

						setTimeout(function () {
							thisController.hide($pl[0]);
						}, durationBeforeAutoHide);
					}
				}
			}

			function tryToFocusSomething($pl, focusingObject) {
				if (focusingObject && typeof focusingObject.focus === 'function') {
					focusingObject.focus();
				} else {
					var focusableElements1 =  Array.prototype.slice.apply($pl.find('input, textarea, [contentEditable="true"]'));
					var focusableElements2 =  Array.prototype.slice.apply($pl.find('button'));
					var focusableElements3 =  Array.prototype.slice.apply($pl.find('a'));

					var focusableElements = focusableElements1
						.concat(focusableElements2)
						.concat(focusableElements3)
					;

					var firstFocusable = focusableElements[0];
					if (firstFocusable) firstFocusable.focus();
				}
			}

			function _decideShowingUpSourceDirection(event, pwHeightCategory) {
				var cssClass = 'shows-up-from-bottom';

				if (pwHeightCategory === 'tall') {
					cssClass = pwHeightCategory+'-window-shows-up-from-bottom';
					return cssClass;
				}

				if (typeof event !== 'object' || typeof event.pageX !== 'number' || typeof event.pageY !== 'number') {
					return cssClass;
				}

				var w = window.innerWidth;
				var h = window.innerHeight;
				var x = event.pageX;
				var y = event.pageY;
				var ratioX = 0.33;
				var ratioY = 0.4;

				var isLeft = x <= w * ratioX;
				var isRight = x >= w * (1 - ratioX);
				var isAbove = y <= h * ratioY;
				var isBelow = y >= h * (1 - ratioY);

				if (isAbove) {
					cssClass = 'shows-up-from-top';
					if (isLeft) {
						cssClass = 'shows-up-from-top-left';
					} else if (isRight) {
						cssClass = 'shows-up-from-top-right';
					}
				} else if (isBelow) {
					if (isLeft) {
						cssClass = 'shows-up-from-bottom-left';
					} else if (isRight) {
						cssClass = 'shows-up-from-bottom-right';
					}
				} else {
					if (isLeft) {
						cssClass = 'shows-up-from-leftside';
					} else if (isRight) {
						cssClass = 'shows-up-from-rightside';
					}
				}

				// C.l(w, h, x, y, cssClass);

				return cssClass;
			}
		};
		this.popupLayersManager = new this.PopupLayersManager();

		this.DraggingController = function (rootElement, initOptions) {
			/*
				require:
					ANestedInB()
			*/
			rootElement = wlc.DOM.validateRootElement(rootElement, this, {
				allowBody: true
			});

			this.options = {
				durationForResettingPosition: 0.4,
				maxOffsetX: 120,
				maxOffsetY: 180,
				triggerX: 60,
				triggerY: 90,
				// triggerResetX: 60 * 0.75,
				// triggerResetY: 90 * 0.75,
				triggerDirection: 'downwards'
			};

			this.onFirstTrigger = undefined;
			this.onEachTrigger = undefined;

			this.config = function (options) {
				config.call(this, options);
			};

			this.enable = function () {
				status.enabled = true;
			};

			this.disable = function () {
				status.enabled = false;
				this.cancelDragging();
			};

			this.cancelDragging = function () {
				if (status.mouseDownEvent) status.shouldCancelDragging = true;
			};

			var status = {
				enabled: true,
				triggerCount: 0,
				justTriggered: false,
				mouseDownEvent: null,
				draggingDirectionIsHorizontal: undefined,
				draggingDirectionIsNegative: undefined,
				isDraggingAlongTriggerDirection: false,
				draggingDirectionHasBeenDecided: false,
				transitionIsPlaying: false
			};

			var data = {
				movingElementOldInlineTransform: ''
			};

			var triggerCallBackOptions = {
				rootElement: rootElement,
				movingElement: null,
				status: status
			};

			function onMouseDown(event) {
				if (status.enabled && !status.transitionIsPlaying) {
					prepareDragging.call(this, event);
				}
			}

			function onMouseUp() {
				if (status.isDraggingAlongTriggerDirection) {
					resetMovingElementPosition.call(this);
				}
				clearStatus();
			}

			function onMouseMove(event) {
				if (status.shouldCancelDragging) {
					clearStatus();
				} else {
					detectValidDragging.call(this, event);
				}
			}




			function config(options) {
				options = options || {};

				if (options.hasOwnProperty('movingElement')) {
					var me = options.movingElement;
					if (me instanceof Node) {
						if (wlc.DOM.ANestedInB(rootElement, me)) {
							console.warn('DraggingController: The rootElement is a descendant of the movingElement.');
						}
					} else if (me === null) {
						me = rootElement;
					} else {
						me = undefined;
					}

					if (me) {
						var cbo = triggerCallBackOptions;

						if (cbo.movingElement instanceof Node) {
							restoreMovingElement();
							restoreMovingElementTransition();
						}

						cbo.movingElement = me;
						data.movingElementOriginalInlineTransform = me.style.transform;
						data.movingElementOriginalInlineTransition = me.style.transition;

						this.cancelDragging();
					}
				}

				switch (options.triggerDirection) {
					case 'l':
						this.options.triggerDirection = 'leftwards';
						break;
					case 'r':
						this.options.triggerDirection = 'rightwards';
						break;
					case 'u':
						this.options.triggerDirection = 'upwards';
						break;
					case 'd':
						this.options.triggerDirection = 'downwards';
						break;

					case 'left':
					case 'right':
					case 'up':
					case 'down':
						this.options.triggerDirection = options.triggerDirection+'wards';
						break;

					case 'leftwards':
					case 'rightwards':
					case 'upwards':
					case 'downwards':
						this.options.triggerDirection = options.triggerDirection;
						break;

					default:
						// do nothing
				}

				var _O = this.options;

				if (options.durationForResettingPosition > 0) _O.durationForResettingPosition = options.durationForResettingPosition;

				if (options.maxOffsetX > 0) _O.maxOffsetX = options.maxOffsetX;
				if (options.maxOffsetY > 0) _O.maxOffsetY = options.maxOffsetY;

				if (options.triggerX > 0) _O.triggerX = Math.min(_O.maxOffsetX, options.triggerX);
				if (options.triggerY > 0) _O.triggerY = Math.min(_O.maxOffsetY, options.triggerY);

				_O.triggerResetX = _O.triggerX * 0.75;
				_O.triggerResetY = _O.triggerY * 0.75;

				if (options.triggerResetX > 0) _O.triggerResetX = Math.min(_O.triggerResetX, options.triggerResetX);
				if (options.triggerResetY > 0) _O.triggerResetY = Math.min(_O.triggerResetY, options.triggerResetY);

				if (typeof options.onFirstTrigger === 'function') this.onFirstTrigger = options.onFirstTrigger;
				if (typeof options.onEachTrigger === 'function') this.onEachTrigger = options.onEachTrigger;
			}

			function restoreMovingElement() {
				var style = triggerCallBackOptions.movingElement.style;
				style.webkitTouchCallout = '';
				style.webkitUserSelect = '';
				style.khtmlUserSelect = '';
				style.mozUserSelect = '';
				style.msUserSelect = '';
				style.userSelect = '';
				style.transform = data.movingElementOriginalInlineTransform;
			}
			function restoreMovingElementTransition() {
				triggerCallBackOptions.movingElement.style.transition = data.movingElementOriginalInlineTransition;
				status.transitionIsPlaying = false;
			}

			function clearStatus() {
				status.shouldCancelDragging = false;
				status.mouseDownEvent = null;
				status.triggerCount = 0;
				status.justTriggered = false;
				status.draggingDirectionIsHorizontal = undefined;
				status.draggingDirectionIsNegative = undefined;
				status.isDraggingAlongTriggerDirection = false;
				status.draggingDirectionHasBeenDecided = false;
			}

			function prepareDragging(event) {
				clearStatus(); // just for sure
				restoreMovingElement(); // just for sure

				status.mouseDownEvent = event;

				switch (this.options.triggerDirection) {
					case 'leftwards':
					case 'rightwards':
						status.draggingDirectionIsHorizontal = true;
						break;

					default:
					case 'upwards':
					case 'downwards':
						status.draggingDirectionIsHorizontal = false;
						break;
				}
			}

			function resetMovingElementPosition() {
				if (status.transitionIsPlaying) return true;
				status.transitionIsPlaying = true;
				var me = triggerCallBackOptions.movingElement;
				me.style.transition = 'transform '+this.options.durationForResettingPosition+'s ease-out';
				me.addEventListener('transitionend', removeTransitionEndHandler);

				restoreMovingElement();
			}

			function removeTransitionEndHandler() {
				var me = triggerCallBackOptions.movingElement;
				me.removeEventListener('transitionend', removeTransitionEndHandler);
				restoreMovingElementTransition();
			}

			function detectValidDragging(event) {
				var _E = status.mouseDownEvent;
				if (!_E) return false;

				var x1 = _E.pageX;
				var y1 = _E.pageY;

				var x2 = event.pageX;
				var y2 = event.pageY;

				var dx = x2 - x1;
				var dy = y2 - y1;

				var dxA = Math.abs(dx);
				var dyA = Math.abs(dy);


				if (!status.draggingDirectionHasBeenDecided) {
					var hasDraggedFarEnough = dy*dy + dx*dx >= 50;
					if (hasDraggedFarEnough) {
						status.draggingDirectionHasBeenDecided = true;
						switch (this.options.triggerDirection) {
							case 'leftwards':
								status.isDraggingAlongTriggerDirection = dx < -5 && dxA > dyA*3;
								status.draggingDirectionIsNegative = dx < 0;
								break;

							case 'rightwards':
								status.isDraggingAlongTriggerDirection = dx >  5 && dxA > dyA*3;
								status.draggingDirectionIsNegative = dx < 0;
								break;

							case 'upwards':
								status.isDraggingAlongTriggerDirection = dy < -5 && dyA > dxA*3;
								status.draggingDirectionIsNegative = dy < 0;
								break;

							default:
							case 'downwards':
								status.isDraggingAlongTriggerDirection = dy >  5 && dyA > dxA*3;
								status.draggingDirectionIsNegative = dy < 0;
								break;
						}
					}
				} else if (status.isDraggingAlongTriggerDirection) {
					updateMovingElementPositionAndDealWithTrigger.call(this, dx, dy, dxA, dyA);
				}
			}

			function updateMovingElementPositionAndDealWithTrigger(dx, dy, dxA, dyA) {
				var me = triggerCallBackOptions.movingElement;
				var style = me. style;

				style.transitionProperty = 'none';
				style.webkitTouchCallout = 'none';
				style.webkitUserSelect = 'none';
				style.khtmlUserSelect = 'none';
				style.mozUserSelect = 'none';
				style.msUserSelect = 'none';
				style.userSelect = 'none';

				var maxOffset, maxDraggingLength, delta, deltaAbs, triggerLength, triggerResetLength, tranlateAxis, screenSize, clickCoord;
				if (status.draggingDirectionIsHorizontal) {
					maxOffset = this.options.maxOffsetX;
					triggerLength = this.options.triggerX;
					triggerResetLength = this.options.triggerResetX;
					delta = dx;
					deltaAbs = dxA;
					tranlateAxis = 'X';
					screenSize = window.innerWidth;
					clickCoord = status.mouseDownEvent.pageX;
				} else {
					maxOffset = this.options.maxOffsetY;
					triggerLength = this.options.triggerY;
					triggerResetLength = this.options.triggerResetY;
					delta = dy;
					deltaAbs = dyA;
					tranlateAxis = 'Y';
					screenSize = window.innerHeight;
					clickCoord = status.mouseDownEvent.pageY;
				}


				var targetOffset = 0;
				var isNeg = status.draggingDirectionIsNegative;
				if ((isNeg && delta > 0) || (!isNeg && delta < 0)) {
					// targetOffset = 0;
				} else {
					targetOffset = delta;

					var draggingFalloffStartPoint = 5;
					if (deltaAbs > draggingFalloffStartPoint) {
						maxDraggingLength = Math.max(draggingFalloffStartPoint, (isNeg ? clickCoord : (screenSize - clickCoord)) * 0.6);
						var rawRatio = Math.min(1, (deltaAbs - draggingFalloffStartPoint) / maxDraggingLength);
						targetOffset = rawRatio * (maxOffset - draggingFalloffStartPoint) + draggingFalloffStartPoint;
						if (isNeg) targetOffset = -targetOffset;
					}
				}

				if (Math.abs(targetOffset) >= maxOffset) { // in case accuracy were not promised
					targetOffset = isNeg ? -maxOffset : maxOffset;
				}

				me.style.transform = 'translate'+tranlateAxis+'('+targetOffset+'px)';



				var mayTrigger      = deltaAbs >= triggerLength;
				var mayResetTrigger = deltaAbs <= triggerResetLength;



				if (mayTrigger) {
					if (!status.justTriggered) {
						status.triggerCount++;
						status.justTriggered = true;

						if (status.triggerCount === 1 && typeof this.onFirstTrigger === 'function') {
							this.onFirstTrigger(event, triggerCallBackOptions);
						}

						if (typeof this.onEachTrigger === 'function') {
							this.onEachTrigger(event, triggerCallBackOptions);
						}
					}
				}

				if (status.justTriggered && mayResetTrigger) {
					status.justTriggered = false;
				}
			}

			function init () {
				status.isInitializing = true;
				status.noNeedToReconstruct = false;

				this.config(initOptions);

				var $_r = $(rootElement);
				$_r
					.on('mousedown', onMouseDown.bind(this))
					.on('mouseup',   onMouseUp  .bind(this))
					.on('mousemove', onMouseMove.bind(this))
				;

				clearStatus();

				delete status.isInitializing;
				delete status.noNeedToReconstruct;
			}

			init.call(this);
			if (status.isInitializing) {
				C.e('Fail to construct <'+this.constructor.name+'>.');
				WCU.objectToolkit.destroyInstanceObject(this);
				return;
			}
		};

		this.VirtualForm = function VirtualForm(rootElement) {
			rootElement = wlc.DOM.validateRootElement(rootElement, this, {
				allowBody: true
			});
			if (!rootElement) rootElement = document.body;

			var OT = WCU.objectToolkit;
			var status = {
				rootElementIsAForm: rootElement.tagName.toLowerCase() === 'form',
				hasNoValidationAttributeAtBeginning: false,
			};


			if (status.rootElementIsAForm) {
				status.hasNoValidationAttributeAtBeginning = !rootElement.hasAttribute('novalidate');
			}

			var publicStatus = {
				allFieldsValidities: []
			};

			var elements = {
				root: rootElement,
				allFields: [],
				requiredFields: [],
				buttonsForSubmission: []
			};

			this.elements = {};
			this.status = publicStatus;
			this.validate = validate.bind(this);
			// this.getField = getField.bind(this);
			// this.getVirtualField = getVirtualField.bind(this);
			this.setFieldValidityByIndex = setFieldValidityByIndex.bind(this);
			this.rebuild = function () {
				console.log('Rebuilding an existing {'+this.constructor.name+'}...');
				config.call(this);
			};


			init.call(this);
			OT.destroyInstanceIfInitFailed.call(this, status, function () {
				rootElement.virtualForm = this;
			});



			function init() {
				status.isInitializing = true;
				status.noNeedToReconstruct = false;

				if (rootElement.virtualForm instanceof UI.VirtualForm) {
					rootElement.virtualForm.rebuild();
					status.noNeedToReconstruct = true;
					return;
				}

				if (!config.call(this)) return;

				delete status.isInitializing;
				delete status.noNeedToReconstruct;
			}

			function config() {
				var isFirstTime = !!status.isInitializing;

				var oldRequiredFields = elements.requiredFields;
				// var oldButtonsForSubmission = this.elements.buttonsForSubmission;

				// requiredFieldsChanged does not mean the value of these elements changed, but addition or deletion of them instead
				var requiredFieldsChanged = oldRequiredFields.length !== elements.requiredFields.length; // fake implementation

				collectElements.call(this);


				if (isFirstTime && elements.requiredFields.length < 1) {
					status.noNeedToConstruct = true;
					return false;
				}


				if (isFirstTime || requiredFieldsChanged) {
					this.elements.root = rootElement; // just for safety
					this.elements.allFields            = [].concat(elements.allFields);
					this.elements.requiredFields       = [].concat(elements.requiredFields);
					this.elements.buttonsForSubmission = [].concat(elements.buttonsForSubmission);

					buildAllVirtualFieldsAsNeeded.call(this);

					if (status.rootElementIsAForm) {
						$(rootElement).on('reset', function (/*event*/) {
							// event.preventDefault();
							var fields = elements.allFields;
							for (var i = 0; i < fields.length; i++) {
								fields[i].virtualField.clearValue();
							}
						});
					}
				}

				return true;
			}

			function collectElements() {
				var $allInvolvedElements;

				if (status.rootElementIsAForm) {
					$allInvolvedElements = $(rootElement.elements); // in case some fields/buttons NOT nested under <form> but has an attribute named "form"
				} else {
					$allInvolvedElements = $(rootElement).find('input, textarea, select, [contentEditable="true"]');
				}

				var $allInputs = $allInvolvedElements.filter(function (index, el) {
					var tnlc = el.tagName.toLowerCase();

					if (tnlc === 'input' || tnlc === 'textarea' || tnlc === 'select') {
						return true;
					}

					var ce = el.getAttribute('contentEditable');
					if (typeof ce === 'string') ce = ce.toLowerCase();

					return ce === 'true';
				});

				var $allRequiredInputs = $allInputs.filter(function (index, el) {
					return el.hasAttribute('required');
				});


				var $buttonsForSubmission = $allInvolvedElements.filter(function (index, el) {
					var attr =  el.getAttribute('button-action');
					if (attr) attr = attr.toLowerCase();
					return attr==='submit';
				});

				elements.allFields            = Array.prototype.slice.apply($allInputs);
				elements.requiredFields       = Array.prototype.slice.apply($allRequiredInputs);
				elements.buttonsForSubmission = Array.prototype.slice.apply($buttonsForSubmission);
			}

			function buildAllVirtualFieldsAsNeeded() {
				var i;
				var atLeastOneNewVirtualFieldCreated = false;
				var fieldElements = elements.allFields;
				for (i = 0; i < fieldElements.length; i++) {
					var thisOneCreated = createNewVirtualFieldAsNeeded.call(this, i);
					atLeastOneNewVirtualFieldCreated = atLeastOneNewVirtualFieldCreated || thisOneCreated;
				}

				// if (atLeastOneNewVirtualFieldCreated) {
				// 	C.t('validating virtualForm after building virtualFields...');
				// 	this.validate();
				// }
			}

			function createNewVirtualFieldAsNeeded(index) {
				// index = parseInt(index);
				// if (isNaN(index) || index <0 || index >= elements.requiredFields.length) return false;
				var field = elements.requiredFields[index];
				// if (!(field instanceof Node)) return;
				var virtualField = new UI.VirtualField(field, {
					virtualForm: this,
					indexInVirtualForm: index
				});
				return !virtualField.hasBeenDestroied;
			}

			function getField(index) {
				index = parseInt(index);
				if (isNaN(index) || index < 0 || index >= elements.requiredFields.length) {
					C.e('Invalid index provided.');
					return;
				}
				var field = elements.requiredFields[index];
				if (!field || !(field.virtualField instanceof UI.VirtualField)) return null;

				return field;
			}

			// function getVirtualField(index) {
			// 	var field = getField.call(this, index);
			// 	if (field) {
			// 		return field.virtualField;
			// 	}

			// 	return;
			// }

			function validate() {
				// C.t('validating virtualForm');
				for (var i = 0; i < elements.requiredFields.length; i++) {
					validateFieldByIndex.call(this, i);
				}

				// C.t('CHECKING AFTER VALIDATING VIRTUALFORM...');
				checkValidities.call(this);
			}

			function checkValidities(options) {
				var allInputsAreValid = true;
				if (status.rootElementIsAForm && rootElement.hasAttribute('novalidate')) {
					if (status.hasNoValidationAttributeAtBeginning) {
						C.w('form has been added "novalidate" attribute later.');
					}
				} else {
					// C.l('updating virtualForm validation status');

					options = options || {};
					options.shouldSkipDisabledInputs = !!options.shouldSkipDisabledInputs; // not implemented yet
					options.shouldSkipReadOnlyInputs = !!options.shouldSkipReadOnlyInputs; // not implemented yet

					for (var i = 0; i < publicStatus.allFieldsValidities.length; i++) {
						if (!publicStatus.allFieldsValidities[i]) {
							allInputsAreValid = false;
							break;
						}
					}
					// C.l('\t allInputsAreValid?', allInputsAreValid);
				}

				elements.buttonsForSubmission.forEach(function (button) {
					button.disabled = !allInputsAreValid;
				});

				return allInputsAreValid;
			}

			function validateFieldByIndex(index) {
				var field = getField.call(this, index);
				if (field) {
					field.virtualField.validate(true);
				}
			}

			function setFieldValidityByIndex(index, isValid, holdOnCheckingFormOverallValidities) {
				// C.l('recieving field status: ', index, isValid);
				var field = getField.call(this, index);
				if (field && typeof isValid === 'boolean') {
					publicStatus.allFieldsValidities[index] = isValid;

					if (!holdOnCheckingFormOverallValidities) {
						// C.l('\t ==> CHECKING on VirtualField Callback...');
						checkValidities.call(this);
					}
				}

			}
		};

		this.VirtualField = function VirtualField(fieldElement, initOptions) {
			if (!(fieldElement instanceof Node)) return;

			var OT = WCU.objectToolkit;
			var status = {
				virtualForm: undefined,
				indexInVirtualForm: NaN,

				isSelect: false,
				isCheckbox: false,
				isRadio: false,
				isText: false,
				isPassword: false,

				valueIsEmpty: true,
				valueIsValid: false,
				validator: null,
				formatter: null,
				onChange: undefined,
				onValueChange: [],
				registeredEventHandlers: []
			};

			var publicStatus = {
				value: '',
				isEmpty: true,
				isValid: false,
				field: fieldElement
			};

			var elements = {
				clearButtons: [],
				field: fieldElement,
				tips: {
					// default: null,
					// error: {}
				}
			};


			this.elements = {};
			this.status = publicStatus;

			this.processCurrentValue = processCurrentValue.bind(this);
			this.validate = validate.bind(this);
			this.getValue = function () {
				return fieldElement.value;
			};
			this.setValue = setValue.bind(this);
			this.clearValue = clearValue.bind(this);

			this.scanForTips = scanForTipsDefaultMethod.bind(this);
			this.config = config.bind(this);
			this.setFormatter = function (formatter) {
				this.config({
					formatter: formatter
				});
			};
			this.setValidator = function (validator) {
				this.config({
					validator: validator
				});
			};


			init.call(this);
			OT.destroyInstanceIfInitFailed.call(this, status, function () {
				fieldElement.virtualField = this;
			});


			function init() {
				status.isInitializing = true;
				status.noNeedToReconstruct = false;

				if (fieldElement.virtualField instanceof UI.VirtualField) {
					fieldElement.virtualField.config(initOptions);
					status.noNeedToReconstruct = true;
					return;
				}

				if (!config.call(this, initOptions)) return;

				delete status.isInitializing;
				delete status.noNeedToReconstruct;
			}

			function config(options) {
				options = options || {};
				var isFirstTime = !!status.isInitializing;

				this.elements.field = fieldElement; // just for safety


				if (typeof options.onValueChange === 'function') status.onValueChange.push(options.onValueChange);



				var virtualFormOptionsAreValid = 
					(options.virtualForm instanceof UI.VirtualForm) &&
					typeof options.indexInVirtualForm === 'number' &&
					!!options.virtualForm.elements &&
					!!options.virtualForm.elements.requiredFields &&
					options.indexInVirtualForm >= 0 &&
					options.indexInVirtualForm < options.virtualForm.elements.requiredFields.length
				;
				// C.l(
				// 	'\n',(options.virtualForm instanceof UI.VirtualForm),
				// 	'\n',typeof options.indexInVirtualForm === 'number',
				// 	'\n',!!options.virtualForm.elements,
				// 	'\n',!!options.virtualForm.elements.requiredFields,
				// 	'\n',options.indexInVirtualForm >= 0,
				// 	'\n',options.indexInVirtualForm < options.virtualForm.elements.requiredFields.length
				// );

				var virtualFormSetupChanged = false;
				if (virtualFormOptionsAreValid) {
					if (status.virtualForm === options.virtualForm && status.indexInVirtualForm === options.indexInVirtualForm) {
						// its correct, nothing to do
					} else {
						if (!isFirstTime) {
							C.l('Adding existing {'+this.constructor.name+'} to {'+options.virtualForm.constructor.name+'}...');
						}
						virtualFormSetupChanged = true;
						status.virtualForm = options.virtualForm;
						status.indexInVirtualForm = options.indexInVirtualForm;
					}
				}



				if (isFirstTime) { // The type of an input field is changable! But why would we do that!
					var tnlc = fieldElement.tagName.toLowerCase();

					status.isSelect = false;
					status.isCheckbox = false;
					status.isRadio = false;
					status.isText = false;
					status.isPassword = false;

					if (tnlc === 'input') {
						status.isSelect = false;

						var type = fieldElement.type.toLowerCase();
						if (type === 'checkbox') {
							status.isCheckbox = true;

						} else if (type === 'radio') {
							status.isText = false;
							status.isRadio = true;
						} else {
							status.isText = true;
							status.isPassword = type === 'password';
						}
					} else if (tnlc === 'textarea') {
						status.isText = true;
					} else if (tnlc === 'select') {
						status.isSelect = true;
					} else { // contentEditable
						status.isText = true;
					}
				}




				setupValidator.call(this, options, isFirstTime);
				setupFormatter.call(this, options, isFirstTime);
				setupEventHandlers.call(this, isFirstTime);


				if (isFirstTime) {
					setupClearInputButton.call(this, null, isFirstTime);
				}


				var R = WCU.save.method(status, 'scanForTips', options, false);
				if (isFirstTime || R.valueHasBeenChanged) {
					this.scanForTips();
					this.elements.tips = {
						default: elements.tips.default,
						errors:  elements.tips.errors // reference instead of duplication
					};
				}



				this.processCurrentValue();


				return true;
			}

			function setupFormatter(options, isFirstTime) {
				// if (!isFirstTime && !!status.formatter) return;

				if (!status.isText) return;


				options = options || {};


				var formatter;
				var formatterIsSpecified;
				var formatterChanged = false;
				var formatterRemoved = false;

				if (typeof options.formatter === 'function') { // override HTML's setup with options argument's
					formatterIsSpecified = true;
					formatter = options.formatter;
				} else if (options.formatter === null) {
					formatterRemoved = true;
					formatterChanged = !!status.formatter;
					status.formatter = null;
				}
				
				if (formatterRemoved) {
					if (!isFirstTime && formatterChanged) {

					}
				} else {
					if (!formatterIsSpecified) {
						formatter = WCU.objectToolkit.evaluateDotNotationChainViaHTMLAttribute(
							fieldElement, 'data-formatter'
						);
						formatterIsSpecified = typeof formatter === 'function';
					}

					if (!formatterIsSpecified) {
						formatter = WCU.stringFormatters.evaluateFormatterFromType(
							fieldElement.getAttribute('data-text-format'), true
						);
						formatterIsSpecified = typeof formatter === 'function';
					}

					if (
						(!formatterIsSpecified && typeof status.formatter === 'function') ||
						( formatterIsSpecified && formatter === status.formatter)
					) {
						// do nothing
					} else {
						if (formatterIsSpecified) {
							status.formatter = formatter;
							formatterChanged = true;
						}
					}



					if (!status.formatter) { // using default formatters
						if (status.isPassword) {
							// status.validator = defaultFormatterForTextInputField;
						} else {
							// status.validator = defaultFormatterForTextInputField;
						}

						formatterChanged = !!status.formatter;
					}


					if (!isFirstTime && formatterChanged) {
						onFormatterChange.call(this);
					}
				}
			}
			function onFormatterChange() {
				processCurrentValue.call(this);
			}

			function setupValidator(options, isFirstTime) {
				// if (!isFirstTime && !!status.validator) return;


				options = options || {};


				var validator = WCU.objectToolkit.evaluateDotNotationChainViaHTMLAttribute(fieldElement, 'data-validator');
				var validatorIsSpecified = typeof validator === 'function';
				var validatorChanged = false;
				var validatorRemoved = false;

				if (typeof options.validator === 'function') { // override HTML's setup with options argument's
					validator = options.validator;
					validatorIsSpecified = true;
				} else if (options.validator === null) {
					validatorRemoved = true;
					validatorChanged = !!status.validator;
					status.validator = null;
				}


				if (validatorRemoved) {
					if (!isFirstTime && validatorChanged) {

					}
				} else {
					if (
						(!validatorIsSpecified && typeof status.validator === 'function') ||
						( validatorIsSpecified && validator === status.validator)
					) {
					} else {
						if (validatorIsSpecified) {
							status.validator = validator;
							validatorChanged = true;
						}
					}



					if (!status.validator) {
						if (status.isPassword) {
							status.validator = defaultValidatorForTextInputField;
						} else if (status.isText) {
							status.validator = defaultValidatorForTextInputField;
						} else if (status.isCheckbox) {
							status.validator = defaultValidatorForCheckbox;
						} else if (status.isRadio) {
							status.validator = defaultValidatorForRadio;
						} else if (status.isSelect) {
							status.validator = defaultValidatorForSelect;
						} else {
							// hopefully impossible
						}

						validatorChanged = !!status.validator;
					}



					if (!isFirstTime && validatorChanged) {
						onValidatorChange.call(this);
					}
				}
			}
			function onValidatorChange() {
				processCurrentValue.call(this);
			}

			function setupEventHandlers(isFirstTime) {
				if (!isFirstTime) return;



				var boundEventHandler;



				boundEventHandler = onChange.bind(this);
				if (status.isText) {
					$(fieldElement).on('input', boundEventHandler);
				} else if (status.isCheckbox || status.isRadio || status.isSelect) {
					$(fieldElement).on('change', boundEventHandler);
				}
				fieldElement.onUpdateAtHiddenState = boundEventHandler;




				boundEventHandler = onFocus.bind(this);
				$(fieldElement).on('focus', boundEventHandler);



				boundEventHandler = onBlur.bind(this);
				$(fieldElement).on('blur', boundEventHandler);
			}

			function setupClearInputButton(scanRootElement, isFirstTime) {
				if (!isFirstTime) return;

				var id = fieldElement.id;
				if (!id) return;
				if (!status.isText) return;


				if (!(scanRootElement instanceof Node)) {
					scanRootElement = $(fieldElement).parents('.page');
				}

				var $buttons = $(scanRootElement).find('button[button-action="clear-input-field"][for-input="'+id+'"]');

				elements.clearButtons = Array.prototype.slice.apply($buttons);
				var thisVirtualField = this;

				$buttons.each(function () {
					var type = this.getAttribute('type');
					if (!type || type.length < 1 || type==='submit') {
						this.setAttribute('type', 'button'); // prevent this from submitting <form>
					}

					$(this).on('click', function (event) {
						if (event) {
							event.preventDefault();
							event.stopPropagation();
						}

						thisVirtualField.clearValue();

						setTimeout(function () {
							fieldElement.focus();
						}, 0);


						C.w('Ugly codes below.');
						if (typeof fieldElement.elements === 'object') {
							var el = fieldElement.elements;
							if (el.coupledChineseNumbers) {
								el.coupledChineseNumbers.innerHTML = '';
							}
						}
					});
				});
			}

			function scanForTipsDefaultMethod(scanRootElement) {
				var id = fieldElement.id;
				if (!id) return;


				if (!(scanRootElement instanceof Node)) {
					scanRootElement = $(fieldElement).parents('.page');
				}
				// C.l(scanRootElement);


				elements.tips.default = $(scanRootElement).find('.input-tip.default[for="'+id+'"]')[0];
				elements.tips.errors = Array.prototype.slice.apply(
					$(scanRootElement).find('.input-tip.error[for="'+id+'"]')
				);
			}

			function onChange() {
				// C.l('\t Bound Event Handler invoked for ', fieldElement.tagName, fieldElement.type);
				this.processCurrentValue();

				for (var i = 0; i < status.onValueChange.length; i++) {
					var callback = status.onValueChange[i];
					if (typeof callback === 'function') {
						callback.call(this, this.status, event);
					}
				}
			}


			function onFocus() {
			}

			function onBlur() {
				updateCssClasses.call(this);
			}

			function setValue(value) {
				if (value !== fieldElement.value) {
					fieldElement.value = value;
					onChange.call(this);
				}
			}

			function clearValue() {
				setValue.call(this, '');
			}

			function processCurrentValue() {
				format.call(this);
				validate.call(this, false);

				publicStatus.isEmpty = status.valueIsEmpty;
				publicStatus.isValid = status.valueIsValid;
				publicStatus.value = fieldElement.value;
			}

			function format() {
				var fomattedValue = fieldElement.value;
				if (typeof status.formatter === 'function') {
					fomattedValue = status.formatter.call(this, fomattedValue);
				}

				if (fieldElement.value !== fomattedValue) {
					fieldElement.value = fomattedValue;
				}
			}

			function defaultValidatorForTextInputField() {
				return fieldElement.value.replace(/^\s+/, '').replace(/\s+$/, '').length > 0;
			}
			function defaultValidatorForCheckbox() {
				return fieldElement.checked;
			}
			function defaultValidatorForRadio() {
				C.e('Radio validator not implemented!');
				return true;
			}
			function defaultValidatorForSelect() {
				return fieldElement.value !== -1;
			}

			function validate(ownerVirtualFormItselfCallThisProactively) {
				updateStatus.call(this);

				var validator = status.validator;

				var validateResult = {
					isValid: true,
					errorInfoElement: null
				};

				if (typeof validator === 'function') {
					var rawResult = validator.call(this);
					if (typeof rawResult === 'boolean') {
						validateResult.isValid = rawResult;
					} else if (!rawResult || typeof rawResult !== 'object' || typeof rawResult.isValid !== 'boolean') {
						C.e('Invalid return value of a input value validator. The return MUST be either a boolean or an object which contains a boolean property with property name "isValid".');
						validateResult.isValid = false;
					} else {
						validateResult.isValid = rawResult.isValid;
						if (rawResult.errorInfoElement instanceof Node) {
							validateResult.errorInfoElement = rawResult.errorInfoElement;
						}
					}
				}

				status.valueIsValid = validateResult.isValid;

				// C.l('\t --> Validating virtualField ['+status.indexInVirtualForm+']', fieldElement.tagName, fieldElement.type);
				// C.l('\t\t isEmpty?', status.valueIsEmpty, '\t isValid?', status.valueIsValid);

				if (status.virtualForm) {
					status.virtualForm.setFieldValidityByIndex(
					status.indexInVirtualForm,
					status.valueIsValid,
					ownerVirtualFormItselfCallThisProactively
					);
				}

				updateCssClasses.call(this);
				updateInfoTips.call(this, validateResult);


				return status.valueIsValid;
			}

			function updateStatus() {
				var isEmpty = true;
				if (status.isText) {
					isEmpty = fieldElement.value.length < 1;
				} else if (status.isCheckbox) {
					isEmpty = !fieldElement.checked;
				} else if (status.isRadio) {
					C.e('Radio not implemented yet!');
					isEmpty = !fieldElement.checked;
				} else if (status.isSelect) {
					isEmpty = fieldElement.selectedIndex === -1;
				}

				status.valueIsEmpty = isEmpty;
				// C.l('updateStatus, value='+fieldElement.value, '\t isText?', status.isText, '\t isEmpty?', status.valueIsEmpty);

				updateClearTextFieldButtons.call(this);
			}

			function updateClearTextFieldButtons() {
				if (status.valueIsEmpty) {
					$(elements.clearButtons).hide();
				} else {
					$(elements.clearButtons).show();
				}
			}

			function updateCssClasses() {
				setTimeout(function () {
					if (status.valueIsEmpty) {
						$(fieldElement)
							.removeClass('non-empty-field')
							.addClass('empty-field')
						;
					} else {
						$(fieldElement)
							.removeClass('empty-field')
							.addClass('non-empty-field')
						;
					}
				}, 60);


				if (status.valueIsValid) {
					$(fieldElement).removeClass('value-invalid');
				} else {
					$(fieldElement)   .addClass('value-invalid');
				}
			}

			function updateInfoTips(validateResult) {
				var defaultTip = elements.tips.default;
				var errorTip   = validateResult.errorInfoElement;
				if (!validateResult.isValid && !!errorTip) {
					showOrHideInputTip(defaultTip, true, false);
					showOrHideInputTip(errorTip, false, true);
				} else {
					showOrHideInputTip(defaultTip, true, true);
					showOrHideInputTip(elements.tips.errors, false, false); // hide all errors
				}

			}

			function showOrHideInputTip(tipElement, isDefaultTip, isToShow) {
				if (isToShow) {
					if (isDefaultTip) {
						$(tipElement).removeClass('hidden');
					} else {
						$(tipElement).addClass('shown');
					}
				} else {
					if (isDefaultTip) {
						$(tipElement).addClass('hidden');
					} else {
						$(tipElement).removeClass('shown');
					}
				}
			}
		};

		this.FixedCharsCountInput = function FixedCharsCountInput(rootElement, initOptions) {
			// '\u25fc' 实心圆圈
			// '\u2022' 加重号

			var OT = WCU.objectToolkit;
			rootElement = wlc.DOM.validateRootElement(rootElement, this);

			var privateOptions = {
				defaultCharsCountIfOmitted: 6,
				rootClassName:  'fixed-count-chars-input-block',
				inputClassName: 'fixed-count-chars-input',

				widthWrapperClassName:   'width-wrapper',
				decoGridsGroupClassName: 'deco-grids-group',
				decoGridClassName:       'deco-grid',
				inputWrapperClassName:   'input-wrapper',

				decoGridStatusFilledClassName: 'filled',

				focusedClassName: 'focus',
				isPureDigitsClassName: 'input-only-digits',
				isPasswordClassName: 'input-is-password',

				testerClassName: 'fixed-count-chars-input-tester'
			};

			var inputElement;
			var widthWrapperElement;
			var elements = {
				decoGridsElements: [],
				$decoGridsElements: null
			};

			var status = {
				shouldEvaluateCharWidthOnFocus: true,

				charsCountLimitation: NaN,
				isPassword: false,
				isPureDigits: false,

				isEmpty: true,
				isFilled: false,
				isValid: false,

				isDisabled: false,
				isFocused: false,

				virtualField: undefined,

				onInput: [],
				onClear: [],
				onFill: [], // on full length filled
				onValid: [],
				onInvalid: [],
				onEnable: [],
				onDisable: [],
				onFocus: [],
				onBlur: []
			};

			this.status = {
				value: '',
				charsCountLimitation: NaN,
				isPassword: false,
				isPureDigits: false,

				isEmpty: true,
				isFilled: false,
				isValid: false,

				isDisabled: false,
				isFocused: false
			};

			var _runCallbacks = (OT.invokeCallbacks).bind(this);


			this.config = config.bind(this);
			this.getValue = function () {
				return inputElement.value;
			};
			// this.setValue = function (newValue) {
			// 	if (newValue !== inputElement.value) {
			// 		inputElement.value = newValue;
			// 		inputElement.virtualField.processCurrentValue();
			// 		inputOnInput.call(this, null);
			// 	}
			// };
			this.clear = function () {
				clearInput.call(this);
			};
			this.enable = function () {
				$(rootElement).removeClass('disabled');
				enableInput.call(this);
			};
			this.disable = function () {
				$(rootElement).addClass('disabled');
				disableInput.call(this);
			};
			this.focus = function () {
				inputElement.focus();
			};
			this.blur = function () {
				inputElement.blur();
			};



			init.call(this);
			OT.destroyInstanceIfInitFailed.call(this, status, function () {
				$(rootElement).addClass(privateOptions.rootClassName);
				rootElement.fixedCharsCountInput = this;
			});



			function init() {
				status.isInitializing = true;
				status.noNeedToReconstruct = false;


				if (!rootElement) return false;

				if (rootElement.fixedCharsCountInput instanceof FixedCharsCountInput) {
					rootElement.fixedCharsCountInput.config(initOptions);
					status.noNeedToReconstruct = true;
					return;
				}


				var $inputElements = $(rootElement).find('input.'+privateOptions.inputClassName);
				if ($inputElements.length > 1) {
					C.e('Too many input fields not found when constructing a '+this.constructor.name+'.');
					return false;
				} else if ($inputElements.length < 1) {
					$inputElements = $(rootElement).find('input');
					if ($inputElements.length === 1) {
						inputElement = $inputElements[0];
					} else {
						// C.e('Input field not found when constructing a '+this.constructor.name+'.');
						// return false;
					}
				} else {
					inputElement = $inputElements[0];
				}


				if (inputElement) {
					var type = inputElement.type.toLowerCase();
					if (
						type === 'checkbox' || type === 'radio'  || type === 'hidden' ||
						type === 'submit'   || type === 'button' || type === 'image'
					) {
						if ($(inputElement).hasClass(privateOptions.inputClassName)) {
							C.e('Invalid input type encounted when constructing a '+this.constructor.name+'.');
							return false;
						} else {
							inputElement = undefined;
						}
					}
				}


				if (!config.call(this, initOptions)) {
					C.e('Initial configuration failed.');
					return;
				}

				if (initOptions.isTesting) {
					$(rootElement).addClass('testing');
				}


				delete status.isInitializing;
				delete status.noNeedToReconstruct;
			}

			function config(options) {
				// options:
					// inputName:
					//     <string:''>, empty string is allowed,
					//     and this will overrite HTML inline setting
					//
					// typeForChoosingKeyboard:
					//     <string:''>, empty string is allowed,
					//     'submit', 'button', 'checkbox', 'raido', 'image' and 'hidden' are NOT allowed
					//     and this will overrite HTML inline setting
					//
					// isPassword:
					//     <boolean:false>,
					//     and this will override HTML inline setting
					//
					//
					// isPureDigits:
					//     <boolean:true>,
					//     and this will override HTML inline setting
					//

				var isFirstTime = !!status.isInitializing;


				options = options || {};

				if (typeof options.onInput   === 'function') status.onInput  .push(options.onInput);
				if (typeof options.onClear   === 'function') status.onClear  .push(options.onClear);
				if (typeof options.onFill    === 'function') status.onFill   .push(options.onFill);
				if (typeof options.onValid   === 'function') status.onValid  .push(options.onValid);
				if (typeof options.onInvalid === 'function') status.onInvalid.push(options.onInvalid);
				if (typeof options.onEnable  === 'function') status.onEnable .push(options.onEnable);
				if (typeof options.onDisable === 'function') status.onDisable.push(options.onDisable);
				if (typeof options.onFocus   === 'function') status.onFocus  .push(options.onFocus);
				if (typeof options.onBlur    === 'function') status.onBlur   .push(options.onBlur);



				detectCharsCount.call(this, options);
				// hopefully after detectCharsCount, inputElement is available



				if (isFirstTime) {
					$(inputElement).addClass(privateOptions.inputClassName);
					status.boundOnInputEventHandler = inputOnInput.bind(this);
					status.virtualField = new UI.VirtualField(inputElement, {
						onValueChange: status.boundOnInputEventHandler
					});
					cacheVirtualFieldStatus.call(this);
					status.boundOnFocusEventHandler = inputOnFocus.bind(this);
					status.boundOnBlurEventHandler  = inputOnBlur .bind(this);
					$(inputElement).on('focus', status.boundOnFocusEventHandler);
					$(inputElement).on('blur',  status.boundOnBlurEventHandler);
				}




				inputElement.readOnly = false;
				inputElement.autocomplete = 'off';

				if (typeof options.typeForChoosingKeyboard === 'string') {
					var _type = options.typeForChoosingKeyboard;
					if (!_type) {
						inputElement.type = '';
					} else {
						_type = _type.replace(/^\s+/, '').replace(/\s+$/, '').toLowerCase();
						switch (_type) {
							case 'submit':
							case 'button':
							case 'checkbox':
							case 'raido':
							case 'hidden':
							case 'image':
								_type = '';
								break;
						}
						inputElement.type = _type;
					}
				}

				if (typeof options.inputName === 'string') {
					inputElement.name = options.inputName;
				}



				detectPureDigitsSwith.call(this, options);
				detectPasswordSwitch .call(this, options);



				this.enable();


				if (isFirstTime ||
					status.charsCountChanged ||
					status.pureDigitsSwitchChanged ||
					status.passwordSwitchChanged
				) {
					evaluateCharWidthOfInput.call(this, null, false);

					// input might be HIDDEN(Display: none or parents Display: none),
					// so the charWidth revaluated here might NOT be correct
					status.shouldEvaluateCharWidthOnFocus = true;
				}

				if (!status.passwordSwitchChanged) {
					if (isFirstTime || status.charsCountChanged || status.pureDigitsSwitchChanged) {
						inputOnInput.call(this);
					}
				}


				delete status.charsCountChanged;
				delete status.pureDigitsSwitchChanged;
				delete status.passwordSwitchChanged;



				return true;
			}

			function detectCharsCount(options) {
				var isFirstTime = !!status.isInitializing;

				var minCount = 1;
				var charsCount = NaN;
				var charsCountIsSpecified = false;

				if (options.hasOwnProperty('charsCount')) {
					charsCount = parseInt(options.charsCount);
					charsCountIsSpecified = !!charsCount && charsCount >= minCount;
				}

				if (!charsCountIsSpecified) {
					charsCount = parseInt(rootElement.getAttribute('data-chars-count'));
					charsCountIsSpecified = !!charsCount && charsCount >= minCount;
				}

				var tagName, i;
				var $existingDecoGrids = $(rootElement).find('.'+privateOptions.decoGridClassName);

				var invalidGrids = [];
				var validGrids = [];
				for (i = 0; i < $existingDecoGrids.length; i++) {
					tagName = $existingDecoGrids[i].tagName.toLowerCase();
					if (tagName === 'input' || tagName === 'textarea') {
						invalidGrids.push($existingDecoGrids[i]);
					} else {
						validGrids  .push($existingDecoGrids[i]);
					}
				}

				for (i = 0; i < invalidGrids.length; i++) {
					var tempElement = invalidGrids[i];
					tempElement.parentNode.removeChild(tempElement);
				}

				if (isFirstTime && !charsCountIsSpecified) {
					// charsCount = validGrids.length;
					charsCount = $existingDecoGrids.length;
				}

				if (!charsCount || charsCount < minCount) {
					C.w('Neither chars-count nor deco-grid detected. Default value "'+privateOptions.defaultCharsCountIfOmitted+'" is used.');
					charsCount = privateOptions.defaultCharsCountIfOmitted;
				}

				if (charsCount !== status.charsCountLimitation) {
					status.charsCountLimitation = charsCount;
					status.charsCountChanged = true;
					updateDomsOnCharsCountChange.call(this, validGrids);
				}
			}
			function updateDomsOnCharsCountChange(existingDecoGrids) {
				this.status.charsCountLimitation = status.charsCountLimitation;


				var isFirstTime = !!status.isInitializing;


				if (isFirstTime && !inputElement) {
					inputElement = document.createElement('input');
					// inputElement.className = privateOptions.inputClassName;
				}

				rootElement .setAttribute('data-chars-count', status.charsCountLimitation);
				inputElement.setAttribute('maxlength',        status.charsCountLimitation);

				var $r = $(rootElement);

				var i, removeThereElements, $tempElements, tempElement;


				if (isFirstTime) {
					$tempElements = $r.find('.'+privateOptions.widthWrapperClassName);
					if ($tempElements.length > 0) {
						widthWrapperElement = $tempElements[0];

						if (widthWrapperElement.tagName.toLowerCase() !== 'label') {
							removeThereElements = $tempElements;
							widthWrapperElement = undefined;
						} else {
							removeThereElements = $tempElements.slice(1);
						}

						for (i = 0; i < removeThereElements.length; i++) {
							tempElement = removeThereElements[i];
							tempElement.parentNode.removeChild(tempElement);
						}
					}

					if (!widthWrapperElement) {
						widthWrapperElement = document.createElement('label');
						widthWrapperElement.className = privateOptions.widthWrapperClassName;
						rootElement.appendChild(widthWrapperElement);
					}
				}



				var inputWrapperElement;
				if (isFirstTime) {
					$tempElements = $r.find('.'+privateOptions.inputWrapperClassName);
					if ($tempElements.length > 0) {
						inputWrapperElement = $tempElements[0];
						removeThereElements = $tempElements.slice(1);

						for (i = 0; i < removeThereElements.length; i++) {
							tempElement = removeThereElements[i];
							tempElement.parentNode.removeChild(tempElement);
						}
					}

					if (!inputWrapperElement) {
						inputWrapperElement = document.createElement('div');
						inputWrapperElement.className = privateOptions.inputWrapperClassName;
						widthWrapperElement.appendChild(inputWrapperElement);
					} else {
						if (inputWrapperElement.parentNode !== widthWrapperElement) {
							widthWrapperElement.appendChild(inputWrapperElement);
						}
					}

					if (inputElement.parentNode !== inputWrapperElement) {
						inputWrapperElement.appendChild(inputElement);
					}
				}



				inputElement.style.marginLeft = 'calc('+ (100 / status.charsCountLimitation) + '% - 0.5em)';



				var decoGridsGroupElement;
				if (isFirstTime) {
					$tempElements = $r.find('.'+privateOptions.decoGridsGroupClassName);
					if ($tempElements.length > 0) {
						decoGridsGroupElement = $tempElements[0];
						removeThereElements = $tempElements.slice(1);

						for (i = 0; i < removeThereElements.length; i++) {
							tempElement = removeThereElements[i];
							tempElement.parentNode.removeChild(tempElement);
						}
					}

					if (!decoGridsGroupElement) {
						decoGridsGroupElement = document.createElement('div');
						decoGridsGroupElement.className = privateOptions.decoGridsGroupClassName;
						widthWrapperElement.insertBefore(decoGridsGroupElement, inputWrapperElement);
					} else {
						if (decoGridsGroupElement.parentNode !== widthWrapperElement) {
							widthWrapperElement.appendChild(decoGridsGroupElement);
						}
					}
				}

				var tagName = 'span';
				if (!isFirstTime || (existingDecoGrids && existingDecoGrids.length > 0)) {
					tagName = existingDecoGrids[0].tagName.toLowerCase();
				}

				var decoGridElement;
				for (i = existingDecoGrids.length; i < status.charsCountLimitation; i++) {
					decoGridElement = document.createElement(tagName);
					decoGridElement.className = privateOptions.decoGridClassName;
					decoGridsGroupElement.appendChild(decoGridElement);
				}
				for (i = status.charsCountLimitation; i < existingDecoGrids.length; i++) {
					decoGridElement = existingDecoGrids[i];
					decoGridElement.parentNode.removeChild(decoGridElement);
				}

				var decoGridsElements = Array.prototype.slice.apply(
					$(rootElement).find('.'+privateOptions.decoGridClassName)
				);
				elements.decoGridsElements = decoGridsElements;
				elements.$decoGridsElements = [];
				for (i = 0; i < decoGridsElements.length; i++) {
					decoGridElement = decoGridsElements[i];
					elements.$decoGridsElements[i] = $(decoGridElement);
					decoGridElement.style.width = (100 / status.charsCountLimitation) + '%';
					if (decoGridElement.parentNode !== decoGridsGroupElement) {
						decoGridsGroupElement.appendChild(decoGridElement);
					}
				}
			}

			function detectPureDigitsSwith(options) {
				var isFirstTime = !!status.isInitializing;

				var isPureDigits;
				if (options.isPureDigits !== undefined) {
					isPureDigits = !!options.isPureDigits;
				} else {
					isPureDigits = $(rootElement).hasClass(privateOptions.isPureDigitsClassName);
				}

				var R = WCU.save.boolean(status, 'isPureDigits', isPureDigits);

				var shouldUpdate = false;
				if (isFirstTime) {
					shouldUpdate = status.isPureDigits || R.valueHasBeenChanged;
				} else {
					shouldUpdate = R.valueHasBeenChanged;
				}

				status.pureDigitsSwitchChanged = R.valueHasBeenChanged;

				if (shouldUpdate) {
					updateDomsOnPureDigitsSwithToggled.call(this);
				}
			}
			function updateDomsOnPureDigitsSwithToggled() {
				this.status.isPureDigits = status.isPureDigits;

				if (status.isPureDigits) {
					$(inputElement).addClass(privateOptions.isPureDigitsClassName);
					inputElement.virtualField.setFormatter(WCU.stringFormatters.pureDigits);
				} else {
					$(inputElement).removeCalss(privateOptions.isPureDigitsClassName);
					inputElement.virtualField.setFormatter(null);
				}
			}

			function detectPasswordSwitch(options) {
				var isFirstTime = !!status.isInitializing;


				var isPassword;
				if (options.isPassword !== undefined) {
					isPassword = !!options.isPassword;
				} else {
					isPassword = $(rootElement).hasClass('input-is-password');
				}

				var R = WCU.save.boolean(status, 'isPassword', isPassword);

				var shouldUpdate = false;
				if (isFirstTime) {
					shouldUpdate = status.isPassword || R.valueHasBeenChanged;
				} else {
					shouldUpdate = R.valueHasBeenChanged;
				}

				status.passwordSwitchChanged = R.valueHasBeenChanged;

				if (shouldUpdate) {
					updateDomsOnPasswordSwitchToggled.call(this);
				}
			}
			function updateDomsOnPasswordSwitchToggled() {
				this.status.isPassword = status.isPassword;

				if (status.isPassword) {
					$(inputElement).addClass(privateOptions.isPasswordClassName);
				} else {
					$(inputElement).removeCalss(privateOptions.isPasswordClassName);
				}
				this.clear();
			}

			function cacheVirtualFieldStatus() {
				var VF = inputElement.virtualField;
				status.isEmpty = VF.isEmpty;
				status.isValid = VF.isValid;
			}

			function enableInput() {
				if (inputElement.disabled) {
					inputElement.disabled = false;
					inputElement.virtualField.processCurrentValue();
					_runCallbacks(status.onEnable, this.status);
					inputOnInput.call(this, null);
				}
			}

			function disableInput() {
				if (!inputElement.disabled) {
					inputElement.disabled = true;
					_runCallbacks(status.onDisable, this.status);
				}
			}

			function clearInput() {
				if (inputElement.value.length > 0) {
					inputElement.value = '';
					inputOnInput.call(this, null);
					_runCallbacks(status.onClear, this.status);
				}
			}

			function inputOnFocus() {
				// C.l('inputOnFocus');
				status.isFocused = true;

				if (status.shouldEvaluateCharWidthOnFocus) {
					evaluateCharWidthOfInput.call(this, null, !!initOptions.isTesting);
				}
				status.shouldEvaluateCharWidthOnFocus = false;

				updateDecoGrids.call(this);
				_runCallbacks(status.onFocus, this.status, event);
			}

			function inputOnBlur() {
				// C.t('inputOnBlur');
				status.isFocused = false;
				updateDecoGrids.call(this);
				_runCallbacks(status.onBlur, this.status, event);
			}

			function inputOnInput(event) {
				// C.l('inputOnInput, disabled?', inputElement.disabled);
				if (inputElement.disabled) return;

				var value = inputElement.value;
				var valueLength = value.length;
				var charsCountLimit = status.charsCountLimitation;
				var virtualField = inputElement.virtualField;


				var isEmpty = valueLength < 1; // virtualField.status.isEmpty
				var shouldRunOnEmptyCallbacks = isEmpty && !status.isEmpty;
				status.isEmpty = isEmpty;



				var isFilled = charsCountLimit && valueLength >= charsCountLimit;
				if (isFilled) {
					if (valueLength > charsCountLimit) {
						value = value.slice(0, charsCountLimit);
						inputElement.value = value;
					}
					valueLength = charsCountLimit;
				}
				var shouldRunOnFilledCallbacks = isFilled && !status.isFilled;
				status.isFilled = isFilled;



				var isValid = isFilled && virtualField.status.isValid;
				var shouldRunOnValidCallbacks   =  isValid && !status.isValid;
				var shouldRunOnInvalidCallbacks = !isValid &&  status.isValid;

				status.isValid = isValid;
				// cacheVirtualFieldStatus.call(this);


				this.status.value = value;
				this.status.isEmpty = isEmpty;
				this.status.isFilled = isFilled;
				this.status.isValid = isValid;

				_runCallbacks(status.onInput, this.status, event);

				if (shouldRunOnEmptyCallbacks) {
					_runCallbacks(status.onClear, this.status, event);
				}
				if (shouldRunOnFilledCallbacks) {
					_runCallbacks(status.onFill, this.status, event);
				}
				if (shouldRunOnValidCallbacks) {
					_runCallbacks(status.onValid, this.status, event);
				}
				if (shouldRunOnInvalidCallbacks) {
					_runCallbacks(status.onInvalid, this.status, event);
				}


				updateDecoGrids.call(this);
			}

			function updateDecoGrids() {
				var value = inputElement.value;
				var shownCount = value.length;
				var $grids = elements.$decoGridsElements;
				// C.t('status.isFocused', status.isFocused, '\t\tvalue="'+value+'"');
				for (var i = 0; i < $grids.length; i++) {
					var $grid = $grids[i];
					if (status.isFocused &&
						(i === shownCount || (i === shownCount-1 && shownCount === status.charsCountLimitation))
					) {
						// C.l(true, '['+i+']', $grid);
						$grid.addClass(privateOptions.focusedClassName);
					} else {
						// C.l(false, '['+i+']', $grid);
						$grid.removeClass(privateOptions.focusedClassName);
					}

					if (i < shownCount) {
						$grid.addClass(privateOptions.decoGridStatusFilledClassName);
						if (!status.isPassword) $grid.html(value.charAt(i));
					} else {
						$grid.removeClass(privateOptions.decoGridStatusFilledClassName);
						if (!status.isPassword) $grid.html('');
					}
				}

				if (this.status.isEmpty) {
					$(rootElement).addClass('empty-field');
					$(rootElement).removeClass('non-empty-field');
				} else {
					$(rootElement).addClass('non-empty-field');
					$(rootElement).removeClass('empty-field');
				}
			}

			function evaluateCharWidthOfInput(testChar, shouldLog) {
				var parentNode = widthWrapperElement;
				var charsCount = status.charsCountLimitation;
				var moduleWidth = $(widthWrapperElement).outerWidth();

				var HTMLLogElement;
				var log = [];
				var logTemp;
				if (shouldLog) {
					HTMLLogElement = document.createElement('P');
					HTMLLogElement.style.textAlign = 'left';
					rootElement.appendChild(HTMLLogElement);
				}

				var testSpansWrapper;
				var spans = [];
				// var charWidth = NaN;
				var letterSpacing = NaN;

				_setup();
				setTimeout(function () {
					// _evaluateCharWidth(false);
					_evaluateLetterSpacing(shouldLog);
				}, 79);


				function _onDetectionDone() {
					if (shouldLog) {
						if (HTMLLogElement) {
							HTMLLogElement.innerHTML = log.join('<br>\n');
						}
						C.l('Clearing test doms...', parentNode, testSpansWrapper);
					} else {
						parentNode.removeChild(testSpansWrapper);
					}
				}

				function _setup() {
					if (typeof testChar !== 'string' || testChar.length < 1) {
						testChar = '\u2022';
					} else {
						testChar = testChar.charAt(0);
					}

					var testSpansCount = status.charsCountLimitation;

					var innerHTML = testChar;
					var i;

					testSpansWrapper = document.createElement('SPAN');
					testSpansWrapper.className = 'fixed-count-chars-input-tester-wrapper';

					for (i = 0; i < testSpansCount; i++) {
						var span = document.createElement('SPAN');
						span.innerHTML = innerHTML;
						span.className = privateOptions.testerClassName;
						testSpansWrapper.appendChild(span);
						spans.push(span);

						innerHTML += testChar;
					}

					widthWrapperElement.appendChild(testSpansWrapper);
				}

				// function _evaluateCharWidth(shouldLog) {
				// 	var spanWidths = [];
				// 	var charWidths = [];
				// 	var lastSpanWidth = 0;

				// 	var log = [];
				// 	var i;
				// 	for (i = 0; i < spans.length; i++) {
				// 		spanWidths[i] = $(spans[i]).outerWidth();
				// 		charWidths[i] = spanWidths[i] - lastSpanWidth;
				// 		lastSpanWidth = spanWidths[i];
				// 		if (shouldLog) {
				// 			log.push('width['+i+']: ' + charWidths[i] + ' ' + spanWidths[i]);
				// 		}
				// 	}

				// 	var charWidthBiases = [];
				// 	var maxBias = 0;
				// 	for (i = 1; i < spans.length; i++) {
				// 		charWidthBiases[i] = charWidths[i] - charWidths[i-1];
				// 		maxBias = Math.max(charWidthBiases[i], maxBias);
				// 	}
				// 	log.push('maxBias: ' + maxBias);


				// 	if (shouldLog) {
				// 		var logC = log.join('\n');
				// 		var logH = log.join('<br>\n');

				// 		C.l(logC);
				// 		if (HTMLLogElement) HTMLLogElement.innerHTML += logH;
				// 	}

				// 	charWidth = charWidths[0];
				// 	if (maxBias > 2) charWidth = NaN;
				// }

				function _evaluateLetterSpacing(shouldLog) {
					var _timeGapMS = 87;
					var _maxTryingPassCount = 6;
					var _fullWidthIncludsLastLetterSpacing = true;
					var theTestSpan = spans[charsCount-1];
					// C.l(theTestSpan);

					var $theTestSpan = $(theTestSpan);
					if (shouldLog) {
						$theTestSpan.addClass('width-detector');
					}

					var _gapsCount = _fullWidthIncludsLastLetterSpacing ? charsCount : (charsCount-1);


					var _spanWidth = $theTestSpan.outerWidth();
					var _widthDiff = moduleWidth - _spanWidth;

					letterSpacing = _widthDiff / _gapsCount;

					var executionTime = 0;
					var resultEvaluated = false;

					__checkSpanNewWidthAndAdjsutLetterSpacing();
					for (var i = 0; i < _maxTryingPassCount; i++) {
						setTimeout(__iterate.bind(this, i), _timeGapMS*(i+1));
					}

					function __checkSpanNewWidthAndAdjsutLetterSpacing() {
						_spanWidth = $(theTestSpan).outerWidth();
						_widthDiff = moduleWidth - _spanWidth;
						letterSpacing += _widthDiff / _gapsCount;
						theTestSpan.style.letterSpacing = letterSpacing+'px';

						if (shouldLog) {
							logTemp = [
								'checking ['+executionTime+']...',
								'\tspanWith:' + _spanWidth,
								'\tdiff:' + _widthDiff,
								'\tletterSpacing:' + letterSpacing
							];
							C.l(logTemp.join('\n'));
							log.push(logTemp.join('<br>\n')+'<br>\n');
						}
					}

					function __iterate(i) {
						executionTime++;

						if (shouldLog) {
							C.l(
								'pass '+executionTime+'('+i+'/'+_maxTryingPassCount+')',
								'\tresult:', resultEvaluated
							);
						}

						if (resultEvaluated) return;

						if (Math.abs(_widthDiff) <= 2) resultEvaluated = true;

						if (executionTime >= _maxTryingPassCount ||resultEvaluated) {
							_onResultEvaluated();
						} else {
							__checkSpanNewWidthAndAdjsutLetterSpacing();
						}
					}
				}

				function _onResultEvaluated() {
					_updateInputElementMeasurement();
				}
				function _updateInputElementMeasurement() {
					var textOffset = letterSpacing * -0.5;

					if (shouldLog) {
						logTemp = [
							'total width: '+   moduleWidth,
							// 'charWidth: '+     charWidth,
							'charsCount: '+    charsCount,
							'letterSpacing: '+ letterSpacing,
							'textOffset: '+    textOffset,
							''
						];
						log.push(logTemp.join('<br>\n'));

						C.l(logTemp.join('\t '));
					}

					inputElement.style.letterSpacing = letterSpacing + 'px';
					inputElement.style.left = textOffset + 'px';

					_onDetectionDone();
				}
			}
		};

		this.ProgressRing = function ProgressRing(rootElement, initOptions) {
			rootElement = wlc.DOM.validateRootElement(rootElement, this);

			this.options = {
				useCanvas: true,
				colorHighLightStroke: '#f60',
				colorBgStroke: '#eaeaea',
				useTransitions: true,
				transitionsTotalDuration: 0.51219,
				treatTotalDurationAsRoughSpeed: true, // that is 360deg per duration
				doNotQueueAnyDregree: false,
				takeLastQueuedDegreeOnly: true,
			};

			this.config = config.bind(this);
			this.getDegree = getDegree.bind(this);
			this.getPercentage = getPercentage.bind(this);
			this.setDegreeTo = setDegreeTo.bind(this);
			this.setPercentageTo = setPercentageTo.bind(this);
			this.setDegreeViaHTMLAttribute = function () {
				this.setDegreeTo('html-attribute-value');
			};



			var OT = WCU.objectToolkit;

			var eChartRing;
			var eChartRingItemStyle = {
				normal: {
					color: this.options.colorHighLightStroke
				}
			};
			var eChartRingBgStyle = {
				normal: {
					color: 'transparent'
				}
			};





			var half1, half2, pKeyTransitionDuration;

			var halves = [];
			var half1Settings = { index: 1 };
			var half2Settings = { index: 2 };

			var currentDegree = 0;
			var currentTargetDegree;
			var status = {
				isRunning: false,
				queuedDegrees: []
			};

			var half1DegreeMeansHidden = 0;
			var half2DegreeMeansHidden = 180;

			init.call(this);
			OT.destroyInstanceIfInitFailed.call(this, status, function () {
				rootElement.progressRing = this;
			});


			function init() {
				status.isInitializing = true;
				status.noNeedToReconstruct = false;
				if (!rootElement) return false;

				this.config(initOptions);
				currentDegree = _parseDegreeVia(currentDegree);

				if (initOptions && !!initOptions.disableInitialUpdate) {
				} else {
					var thisController = this;
					setTimeout(function () { // important for first running, especially for the first acting half element
						thisController.setDegreeViaHTMLAttribute();
					}, 0);
				}

				delete status.isInitializing;
				delete status.noNeedToReconstruct;
				return true;
			}

			function prepareDoms() {
				if (this.options.useCanvas) {
					prepareDomsForCanvas.call(this);
				} else {
					prepareDomsForElements.call(this);
				}
			}
			function prepareDomsForCanvas() {
				if (!window.echarts) return false;

				$(rootElement).addClass('use-canvas');
				$(rootElement).removeClass('huge-scale-down quadruple-scale-down uses-css-clip');

				eChartRing = window.echarts.init(rootElement);

				var radii = evaluateRadiiForCanvas.call(this);
				var options = {
					series: [
						{
							type:'pie',
							radius: radii,
							hoverAnimation: false,
							label: {
								normal: {
									show: false    
								}  
							},
							itemStyle: {
								normal: {
									color: this.options.colorBgStroke
								}
							},
							data: [ 100 ],
							animation: false
						},
						{
							type:'pie',
							radius: radii,
							hoverAnimation: false,
							label: {
								normal: {
									show: false    
								}  
							},
							data:[
								{
									value: 0,
									itemStyle: eChartRingItemStyle
								},
								{
									value: 100,
									itemStyle: eChartRingBgStyle,
								}
							]
						}
					]
				};

				eChartRing.setOption(options);
			}
			function prepareDomsForElements() { // add or remve doms as needed
				$(rootElement).removeClass('use-canvas');
				// $(rootElement).addClass('uses-css-clip');
				// $(rootElement).removeClass('huge-scale-down').removeClass('quadruple-scale-down'); // really bad
				// $(rootElement).addClass('huge-scale-down').removeClass('quadruple-scale-down'); // smooth but blur
				$(rootElement).addClass('quadruple-scale-down').removeClass('huge-scale-down'); // balanced


				var $halfMasks = $(rootElement).find('> .half-mask');
				var count, i, j, _mask, $half, _half;

				if ($halfMasks.length < 2) {
					count = 2 - $halfMasks.length;
					var tagName = 'B';
					if (count===1) tagName = $halfMasks[0].tagName;

					for (i = 0; i < count; i++) {
						_mask = document.createElement(tagName);
						_mask.className = 'half-mask';

						$halfMasks.push(_mask);
						rootElement.appendChild(_mask);
					}
				} else if ($halfMasks.length > 2) {
					for (i = 2; i < $halfMasks.length; i++) {
						_mask = $halfMasks[i];
						rootElement.removeChild(_mask);
					}
				}


				for (i = 0; i < $halfMasks.length; i++) {
					_mask = $halfMasks[i];
					$half = $(_mask).find('> .half');
					if ($half.length < 1) {
						_half = document.createElement('i');
						_half.className = 'half';

						$half.push(_half);
						_mask.appendChild(_half);
					} else {
						_half = $half[0];
						if ($half.length > 1) {
							for (j = 1; j < $half.length; j++) {
								_mask.removeChild(_half);
							}
						}
					}

					halves.push(_half);
				}

				half1 = halves[0];
				half2 = halves[1];

				$(half1.parentNode).addClass('half-1').removeClass('half-2');
				$(half2.parentNode).addClass('half-2').removeClass('half-1');

				var _S = half1.style;
				var possibleKeyPrefixes = [
					'',
					'webkit',
					'ms',
					'moz'
				];

				var keyName = 'transitionDuration';
				for (var k = 0; k < possibleKeyPrefixes.length; k++) {
					var pre = possibleKeyPrefixes[k];
					var key;
					if (!pre) {
						key = keyName;
					} else {
						key = pre + keyName.slice(0, 1).toUpperCase() + keyName.slice(1);
					}
					if (typeof _S[key] === 'string') {
						pKeyTransitionDuration = key;
						break;
					}
				}

				half1.style.transform = 'rotate('+half1DegreeMeansHidden+'deg)';
				half2.style.transform = 'rotate('+half2DegreeMeansHidden+'deg)';

				half1Settings.dom = half1;
				half1Settings.style = half1.style;

				half2Settings.dom = half2;
				half2Settings.style = half2.style;
			}

			function config(options) {
				if (typeof options !== 'object' || !options) return;

				var R, temp;


				WCU.save.boolean(this.options, 'disableInitialUpdate', options);


				temp = {
					useCanvas: this.options.useCanvas
				};
				R = WCU.save.boolean(temp, 'useCanvas', options);
				if (R.valueHasBeenChanged) {
					if (temp.useCanvas && !window.echarts) {
						R.valueHasBeenChanged = false;
						C.e('Echarts not found. Doms not changed.');
					} else {
						this.options.useCanvas = temp.useCanvas;
					}
				}



				WCU.save.boolean(this.options, 'useTransitions', options);
				WCU.save.boolean(this.options, 'doNotQueueAnyDregree', options);
				WCU.save.boolean(this.options, 'takeLastQueuedDegreeOnly', options);
				WCU.save.boolean(this.options, 'treatTotalDurationAsRoughSpeed', options);
				WCU.save.numberNoLessThan(this.options, 'transitionsTotalDuration', options, false, 0.05);

				if (!!status.isInitializing || R.valueHasBeenChanged) {
					prepareDoms.call(this);
				}

				// console.log('single ring configered: ', this.options);
			}

			function _parseDegreeVia(degree) {
				var inputWasValid = true;
				var degreeFloatValue = NaN;

				if (typeof degree === 'number' && !isNaN(degree)) {
					degreeFloatValue = degree;
				} else {
					degreeFloatValue = parseFloat(degree);

					if (isNaN(degreeFloatValue)) {
						inputWasValid = false;
						degreeFloatValue = 0;
					} else {
						var stringIsPercentage = !!degree.match(/^\s*[\+\-]?[\d\.]*\d+%\D*\s*$/);

						if (stringIsPercentage) {
							degreeFloatValue = 3.6 * degreeFloatValue;
						}
					}
				}

				var degreeFloatValueSafe = degreeFloatValue % 360;

				degree         = (degreeFloatValue)    .toFixed(3);
				var degreeSafe = (degreeFloatValueSafe).toFixed(3);

				degreeFloatValue     = parseFloat(degree);
				degreeFloatValueSafe = parseFloat(degreeSafe);

				if (degreeFloatValueSafe === 0 && degreeFloatValue >= 359.9999) degreeFloatValueSafe = 360;

				var result = {
					inputWasValid: inputWasValid,
					raw: degreeFloatValue,
					safe: degreeFloatValueSafe
				};
				// console.log(result);

				return result;
			}

			function _getDegreeFromHtml() {
				return _parseDegreeVia(rootElement.getAttribute('data-degree'));
			}

			function getDegree() {
				if (typeof currentTargetDegree !== 'object') {
					return 0;
				}

				return currentTargetDegree.raw;
			}

			function getPercentage() {
				return this.getDegree() / 360;
			}

			function setPercentageTo(newPercentage) {
				if (typeof newPercentage === 'string') {
					newPercentage = (parseFloat(newPercentage) || 0) * 0.01;
					// var stringIsPercentage = !!newPercentage.match(/^\s*[\+\-]?[\d\.]*\d+%\D*\s*$/);
					// if (stringIsPercentage) {
					// }
				} else if (typeof newPercentage === 'number' && !isNaN(newPercentage)) {
				} else {
					newPercentage = 0;
				}

				newPercentage = Math.min(0, Math.max(100, newPercentage)) + '%';

				this.setDegreeTo(newPercentage * 360);
			}

			function setDegreeTo(newDegree) {
				if (status.isRunning && this.options.doNotQueueAnyDregree) {
				} else {
					queueOneNewDegree.call(this, newDegree);
				}
				fetchDegreeFromQueueAndUpdateDomsOrCanvas.call(this);
			}

			function queueOneNewDegree(newDegree) {
				if (newDegree === 'html-attribute-value') {
					newDegree = _getDegreeFromHtml();
				} else if (!newDegree || typeof newDegree === 'number' || newDegree === true) {
					newDegree = _parseDegreeVia(newDegree);
				} else {
					newDegree = _parseDegreeVia(newDegree.raw);
				}

				if (this.options.takeLastQueuedDegreeOnly) {
					status.queuedDegrees.splice(0);
				}
				status.queuedDegrees.push(newDegree);
			}

			function fetchDegreeFromQueue() {
				return status.queuedDegrees.splice(0, 1)[0];
			}

			function fetchDegreeFromQueueAndUpdateDomsOrCanvas() {
				// C.l('This ring is already running:', status.isRunning);
				if (status.isRunning) {
					return;
				}

				var newDegree = fetchDegreeFromQueue.call(this);
				if (typeof newDegree !== 'object' || typeof newDegree.safe !== 'number' || isNaN(newDegree.safe)) {
					return false;
				}

				currentTargetDegree = newDegree;

				if (this.options.useCanvas) {
					fetchDegreeFromQueueAndUpdateCanvas.call(this, newDegree);
				} else {
					fetchDegreeFromQueueAndUpdateDoms.call(this, newDegree);
				}
			}

			function evaluateRadiiForCanvas() {
				if (!eChartRing || typeof eChartRing.getWidth !== 'function') {
					return [ '92%', '100%' ];
				}

				var chartWidth = eChartRing.getWidth();
				var radii = [
					((chartWidth - 7) / chartWidth * 100)+'%',
					'100%'
				];

				return radii;
			}

			function fetchDegreeFromQueueAndUpdateCanvas(newDegree) {
				// use eCharts
				var thisController = this;

				var degree = newDegree.safe;
				var value1 = degree / 360;

				var options = {
					series: [{
					},
					{
						radius: evaluateRadiiForCanvas.call(this), // in case canvas resized
						data:[
							{
								value: value1,
								itemStyle: eChartRingItemStyle
							},
							{
								value: (1 - value1),
								itemStyle: eChartRingBgStyle,
							}
						]
					}]
				};

				eChartRing.setOption(options);
				onUpdateDone();

				function onUpdateDone() {
					rootElement.getAttribute('data-degree', newDegree.raw);
					currentDegree = newDegree;

					status.isRunning = false;
					// console.trace('-- everything done! --', currentDegree);

					fetchDegreeFromQueueAndUpdateDomsOrCanvas.call(thisController);
				}
			}

			function fetchDegreeFromQueueAndUpdateDoms(newDegree) {
				var thisController = this;
				status.isRunning = true;

				var oldSafeDegree = currentDegree.safe;
				var newSafeDegree = newDegree.safe;
				var deltaTotalAbs = Math.abs(newSafeDegree - oldSafeDegree);
				var eitherTransitionsIsNecessary = !!this.options.useTransitions && deltaTotalAbs > 1; // at least one degree to change

				// console.log('\n\n=== from', oldSafeDegree, 'to', newSafeDegree, '===', deltaTotalAbs, 'transition?', this.options.useTransitions, '\t', this.options.transitionsTotalDuration, 'sec');

				_processHalfSettings.call(this,
					half1Settings,
					Math.min(180, oldSafeDegree),
					Math.min(180, newSafeDegree),
					this.options.transitionsTotalDuration
				);
				_processHalfSettings.call(this,
					half2Settings,
					Math.max(180, oldSafeDegree),
					Math.max(180, newSafeDegree),
					this.options.transitionsTotalDuration
				);

				function _processHalfSettings (_S, oldSafeDegree, newSafeDegree, totalDurationOrSpeed) {
					_S.oldDegree = oldSafeDegree;
					_S.newDegree = newSafeDegree;
					_S.delta = _S.oldDegree - _S.newDegree;
					_S.deltaAbs = Math.abs(_S.delta);

					if (deltaTotalAbs < 0.001) {
						_S.duration = 0;
					} else {
						if (this.options.treatTotalDurationAsRoughSpeed) {
							_S.duration = totalDurationOrSpeed * _S.deltaAbs / 360;
						} else {
							_S.duration = totalDurationOrSpeed * _S.deltaAbs / deltaTotalAbs;
						}
					}

					_S.transitionNecessary = eitherTransitionsIsNecessary && _S.duration > 0.01 && _S.deltaAbs > 0.1;
					if (_S.transitionNecessary) {
						$(_S.dom).removeClass('no-transition');
						_S.style[pKeyTransitionDuration] = _S.duration + 's';
					} else {
						$(_S.dom).addClass('no-transition');
					}
					// console.log('transition?', _S.transitionNecessary, '\t',
					// 	_S.style[pKeyTransitionDuration],
					// 	'\t\t', _S.deltaAbs+' deg to go: ',
					// 	oldSafeDegree, 'to', newSafeDegree
					// );
				}


				var halfA, halfB; // transition of halfA goes BEFORE transition of halfB

				if (oldSafeDegree <= 180) {
					halfA = half1Settings;
					halfB = half2Settings;
				} else {
					halfA = half2Settings;
					halfB = half1Settings;
				}

				// console.log('action order will be: half', halfA.index, '>>> half', halfB.index);


				updateHalfA();
				var aTransitionEndedAnyHow = false;
				var bTransitionEndedAnyHow = false;


				function updateHalfA() {
					// console.log('update A [', halfA.index,']:\t', halfA.oldDegree, '-->', halfA.newDegree, '\t transition?', halfA.transitionNecessary, '\t\t',halfA.duration,'sec');
					halfA.style.transform = 'rotate('+halfA.newDegree+'deg)';

					if (!halfA.transitionNecessary) {
						updateHalfB();
						setTimeout(function () {
							$(halfA.dom).removeClass('no-transition');
						}, 0);
					} else {
						// console.log('B is waiting for A...');
						setTimeout(function () { onTransitionAEnd(false); }, halfA.duration * 1010);
						halfA.dom.addEventListener('transitionend', onTransitionAEnd);
					}
				}
				function onTransitionAEnd (/*eventOrFalse*/) {
					if (aTransitionEndedAnyHow) return true;

					// console.log('transition A end.\t\t\t from timer?', eventOrFalse===false, halfA.duration);
					halfA.dom.removeEventListener('transitionend', onTransitionAEnd);
					aTransitionEndedAnyHow = true;
					updateHalfB();
				}

				function updateHalfB() {
					// console.log('update B [', halfB.index,']:\t', halfB.oldDegree, '-->', halfB.newDegree, '\t transition?', halfB.transitionNecessary, '\t\t',halfB.duration,'sec');
					halfB.style.transform = 'rotate('+halfB.newDegree+'deg)';

					if (!halfB.transitionNecessary) {
						onBothHalvesUpdated();
						setTimeout(function () {
							$(halfB.dom).removeClass('no-transition');
						}, 0);
					} else {
						// console.log('finishing is waiting for B...');
						setTimeout(function () { onTransitionBEnd(false); }, halfB.duration * 1010);
						halfB.dom.addEventListener('transitionend', onTransitionBEnd);
					}
				}
				function onTransitionBEnd (/*eventOrFalse*/) {
					if (bTransitionEndedAnyHow) return true;

					// console.log('transition B end.\t from timer?', eventOrFalse===false, halfB.duration);
					halfB.dom.removeEventListener('transitionend', onTransitionBEnd);
					bTransitionEndedAnyHow = true;
					onBothHalvesUpdated();
				}

				function onBothHalvesUpdated() {
					halfA.style[pKeyTransitionDuration] = '';
					halfB.style[pKeyTransitionDuration] = '';

					rootElement.getAttribute('data-degree', newDegree.raw);
					currentDegree = newDegree;

					status.isRunning = false;
					// console.trace('-- everything done! --', currentDegree);

					fetchDegreeFromQueueAndUpdateDomsOrCanvas.call(thisController);
				}


				return newDegree;
			}
		};

		this.ProgressRings = function ProgressRings(rootElement, initOptions) {
			rootElement = wlc.DOM.validateRootElement(rootElement, this);

			this.options = {
				// useTransitions: true,
				// singleRingTransitionsTotalDuration: NaN,
				// treatTotalDurationAsRoughSpeed: true,
				// doNotQueueAnyDregree: false,
				// takeLastQueuedDegreeOnly: true,
				perRings: []
			};

			var rings = [];

			this.controllers = {
				rings: rings
			};

			this.createOneRing = createOneRing.bind(this);
			this.config = config.bind(this);
			this.getDegree = getDegree.bind(this);
			this.getDegrees = getDegrees.bind(this);
			this.getPercentage = getPercentage.bind(this);
			this.getPercentages = getPercentages.bind(this);
			this.setDegrees = setDegrees.bind(this);
			this.setPercentages = setPercentages.bind(this);

			var OT = WCU.objectToolkit;
			var status = {};

			init.call(this);
			OT.destroyInstanceIfInitFailed.call(this, status, function () {
				rootElement.progressRings = this;
			});


			function init() {
				status.isInitializing = true;
				status.noNeedToReconstruct = false;
				this.config(initOptions);

				if (!rootElement) return false;

				var ringsDom = $(rootElement).find('.ring');
				if (ringsDom.length < 1) {
					C.e('No ring element found under rootElement when constructing a '+this.constructor.name+'.\n rootElement:', rootElement);
					return false;
				}

				for (var i = 0; i < ringsDom.length; i++) {
					this.createOneRing(ringsDom[i]);
				}

				delete status.isInitializing;
				delete status.noNeedToReconstruct;
			}

			function getDegree(index) {
				index = parseInt(index) || 0;
				var ring = rings[index];
				if (!ring) return undefined;
				return ring.getDegree();
			}

			function getPercentage(index) {
				var deg = this.getDegree(index);
				if (typeof deg === 'number') {
					if (isNaN(deg)) return undefined;
					return deg / 360;
				}

				return undefined;
			}

			function getDegrees() {
				var results = [];
				for (var i = 0; i < rings.length; i++) {
					results.push(rings[i].getDegree());
				}
				return results;
			}

			function getPercentages() {
				var results = [];
				for (var i = 0; i < rings.length; i++) {
					results.push(rings[i].getDegree() / 360);
				}
				return results;
			}

			function setDegrees(degrees) {
				if (!Array.isArray(degrees)) degrees = [degrees];
				var count = Math.min(degrees.length, rings.length);
				for (var i = 0; i < count; i++) {
					rings[i].setDegreeTo(degrees[i]);
				}
			}

			function setPercentages(percentages) {
				if (!Array.isArray(percentages)) percentages = [percentages];
				var count = Math.min(percentages.length, rings.length);
				for (var i = 0; i < count; i++) {
					rings[i].setPercentageTo(percentages[i]);
				}
			}

			function createOneRing(ringRootElement) {
				var results = evaluateOptionsOfRings.call(this, rings.length);
				var options =results.optionsPerRings[0]; // single options object
				var newRing = new UI.ProgressRing(ringRootElement, options);
				if (newRing.hasBeenDestroied) {
					C.e('Fail to create ring for rings controller.');
					return;
				}
				rings.push(newRing);
			}

			function config(options) {
				var shouldNotConfigRings = !!status.isInitializing;
				if (typeof options !== 'object' || !options) return;

				WCU.save.boolean(this.options, 'disableInitialUpdate', options, true);
				WCU.save.boolean(this.options, 'useTransitions', options, true);
				WCU.save.boolean(this.options, 'doNotQueueAnyDregree', options, true);
				WCU.save.boolean(this.options, 'takeLastQueuedDegreeOnly', options, true);
				WCU.save.boolean(this.options, 'treatTotalDurationAsRoughSpeed', options, true);
				WCU.save.numberPositive(this.options, 'singleRingTransitionsTotalDuration', options, true);

				if (options.hasOwnProperty('perRings')) {
					if (typeof options.perRings === 'undefined' || options.perRings === null) {
						this.options.perRings.splice(0, this.options.perRings.length);
					} else {
						var _oprS; // source
						var _oprT = this.options.perRings; // target

						if (typeof options.perRings === 'object') {
							_oprS = options.perRings;
							if (!Array.isArray(_oprS)) _oprS = [_oprS];
						} else {
							_oprS = [];
						}

						for (var i = 0; i < _oprS.length; i++) {
							var _oprSI = _oprS[i];
							var _oprTI = _oprT[i];

							if (typeof _oprSI !== 'object' || !_oprSI) {
								continue;
							}

							if (typeof _oprTI !== 'object' || !_oprTI) {
								_oprT[i] = _oprSI;
								continue;
							}

							WCU.save.boolean(_oprTI, 'disableInitialUpdate', _oprSI, true);
							WCU.save.boolean(_oprTI, 'useTransitions', _oprSI, true);
							WCU.save.boolean(_oprTI, 'doNotQueueAnyDregree', _oprSI, true);
							WCU.save.boolean(_oprTI, 'takeLastQueuedDegreeOnly', _oprSI, true);
							WCU.save.boolean(_oprTI, 'treatTotalDurationAsRoughSpeed', _oprSI, true);
							WCU.save.numberPositive(_oprTI, 'singleRingTransitionsTotalDuration', _oprSI, true);
						}
					}
				}

				if (!shouldNotConfigRings) {
					configRings.call(this);
				}

				// console.log('ProgressRings options:', this.options);
			}

			function configRings(indexRangeA, indexRangeB) {
				var results = evaluateOptionsOfRings.call(this, i).optionsPerRings[0];

				indexRangeA = results.indexRangeA; // valid values
				indexRangeB = results.indexRangeB; // valid values
				var optionsPerRings = results.optionsPerRings;

				for (var i = 0; i < optionsPerRings.length; i++) {
					var ring = rings[i];
					if (ring) ring.config(optionsPerRings[i]);
				}
			}

			function evaluateOptionsOfRings(indexRangeA, indexRangeB) {
				var results = {
					indexRangeA: NaN,
					indexRangeB: NaN,
					optionsPerRings: []
				};

				indexRangeA = parseInt(indexRangeA);
				indexRangeB = parseInt(indexRangeB);

				var ringsCount = rings.length;

				var validIndexRangeAProvided = indexRangeA >= 0; // exceeding [rings.length] is allowed
				if (!validIndexRangeAProvided) {
					indexRangeA = 0;
				}
				var validIndexRangeBProvided = indexRangeB >= 0; // exceeding [rings.length] is allowed
				if (!validIndexRangeBProvided) {
					if (validIndexRangeAProvided) {
						indexRangeB = indexRangeA;
					} else {
						indexRangeB = ringsCount - 1;
					}
				}

				var loopStart = Math.min(indexRangeA, indexRangeB);
				var loopEnd = Math.max(indexRangeA, indexRangeB);

				results.indexRangeA = loopStart;
				results.indexRangeB = loopEnd;

				var _oGlobalDefault = this.options;
				var _oprS = this.options.perRings;
				for (var i = loopStart; i <= loopEnd; i++) {
					var _oprSI = _oprS[i];
					var _oprTI = {};

					if (typeof _oprSI !== 'object' || !_oprSI) {
						_oprSI = {};
					}

					var R;

					R = WCU.save.boolean(_oprTI, 'disableInitialUpdate', _oprSI);
					if (!R.valueHasBeenCreated) {
						WCU.save.boolean(_oprTI, 'disableInitialUpdate', _oGlobalDefault);
					}

					R = WCU.save.boolean(_oprTI, 'doNotQueueAnyDregree', _oprSI);
					if (!R.valueHasBeenCreated) {
						WCU.save.boolean(_oprTI, 'doNotQueueAnyDregree', _oGlobalDefault);
					}

					R = WCU.save.boolean(_oprTI, 'takeLastQueuedDegreeOnly', _oprSI);
					if (!R.valueHasBeenCreated) {
						WCU.save.boolean(_oprTI, 'takeLastQueuedDegreeOnly', _oGlobalDefault);
					}

					R = WCU.save.boolean(_oprTI, 'useTransitions', _oprSI);
					if (!R.valueHasBeenCreated) {
						WCU.save.boolean(_oprTI, 'useTransitions', _oGlobalDefault);
					}

					R = WCU.save.boolean(_oprTI, 'treatTotalDurationAsRoughSpeed', _oprSI);
					if (!R.valueHasBeenCreated) {
						WCU.save.boolean(_oprTI, 'treatTotalDurationAsRoughSpeed', _oGlobalDefault);
					}

					R = WCU.save.numberPositive(_oprTI, 'transitionsTotalDuration', _oprSI);
					if (!R.valueHasBeenCreated) {
						WCU.save.numberPositive(_oprTI, 'transitionsTotalDuration', _oGlobalDefault.singleRingTransitionsTotalDuration);
					}

					// C.l('merged options for ring ['+i+']', _oprTI);
					results.optionsPerRings.push(_oprTI);
				}

				return results;
			}
		};

		this.TabPanelSet = function TabPanelSet(rootElement, initOptions) {
			var thisController = this;
			rootElement = wlc.DOM.validateRootElement(rootElement, this);


			var elements = {
				rootElement: rootElement,
				panels: [],
				tabList: null,
				tabs: [],
				tabListCurrentItemHint: null,

				currentTab: null,
				currentPanel: null
			};

			var OT = WCU.objectToolkit;
			var status = {
				isOnAction: false
			};

			var publicStatus = { // not public in any way at present
				// elements: elements,
				// options: this.options,
				currentPanelIndex: NaN
			};


			this.elements = elements;
			this.options = {
				allowToShowNone: false,
				selectorOfPanel: '.panel',
				selectorOfTabList: '.tab-list',
				selectorOfTab: '> li', // treat as under tablist, so in face this value is "rootElement .tab-list > li"
				selectorOfTabListCurrentItemHint: '> .current-item-hint', // treat as under tablist, so in face this value is "rootElement .tab-list > .current-item-hint"
				classNameOfCurrentPanel: 'current'
			};

			this.config = config.bind(this);
			this.getPanel = getPanel.bind(this);
			this.getPanelViaTab = getPanelViaTab.bind(this);
			this.showPanel = showPanel.bind(this);
			this.showPanelViaTab = showPanelViaTab.bind(this);
			this.showPrevPanel = showPrevPanel.bind(this);
			this.showNextPanel = showNextPanel.bind(this);
			this.slideTabCurrentItemHintTo = slideTabCurrentItemHintTo.bind(this);

			// If the panel is shown through a way other than showPanel/showPrevPanel/showNextPanel/showPanelViaTab,
			// for example the panel is shown via the famous Swiper.js,
			// then we need to update tablist separately.
			this.syncStatusToPanel = function (thePanelOrTheTabOrTheIndex, shouldTrace) {
				syncStatusToPanel.call(this, thePanelOrTheTabOrTheIndex, shouldTrace, false);
			};

			var $tabList;
			var $tabs;
			var tabListCurrentItemHint;

			function config(options) {
				var isInitializing = !!status.isInitializing;
				var shouldWarnAllowToShowNone = false;
				if (!options) {
					shouldWarnAllowToShowNone = this.options.allowToShowNone && isInitializing;
				} else {
					var R1 = WCU.save.boolean(this.options, 'allowToShowNone', options);

					shouldWarnAllowToShowNone = (isInitializing || R1.valueHasBeenChanged) && this.options.allowToShowNone;
				}

				if (shouldWarnAllowToShowNone) {
					C.w('This TabPanelSet allows to show none of its member panel.');
				}

				WCU.save.method(this, 'onPanelShow', options, true);
				WCU.save.method(this, 'onPanelHide', options, true);

				WCU.save.string(this.options, 'selectorOfPanel', options, false, false);
				WCU.save.string(this.options, 'selectorOfTabList', options, false, false);
				WCU.save.string(this.options, 'selectorOfTab', options, false, false);
				WCU.save.string(this.options, 'selectorOfTabListCurrentItemHint', options, false, false);
			}

			function init() {
				status.isInitializing = true;
				status.noNeedToReconstruct = false;

				if (!rootElement) return;

				this.config(initOptions);

				var $root = $(rootElement);

				var $panels = $root.find(this.options.selectorOfPanel);
				if ($panels.length < 1) {
					C.e('No panel was found under <'+this.constructor.name+'> rootElement:', rootElement);
					return false;
				}

				$tabList = $root.find(this.options.selectorOfTabList);
				if ($tabList.length > 1) {
					C.e('More than one tablists were found under <'+this.constructor.name+'> rootElement:', rootElement);
					return false;
				}

				$tabs = $tabList.find(this.options.selectorOfTab);
				if ($tabs.length !== $panels.length) {
					C.w('The count of panels ('+$panels.length+') and that of tabs ('+$tabs.length+') do not match under <'+this.constructor.name+'> rootElement:', rootElement);
				}

				tabListCurrentItemHint = $tabList.find(this.options.selectorOfTabListCurrentItemHint);
				if (tabListCurrentItemHint.length > 1) {
					C.w('More than one tablists current item hint element were found under <'+this.constructor.name+'> rootElement:', rootElement);
				}
				tabListCurrentItemHint = tabListCurrentItemHint[0];

				// we'd better make sure the order of tabs in elements.tabs matches the order of panels in elements.panels
				// elements.panels  = elements.panels.concat($panels);
				// elements.tabs    = elements.tabs.concat($tabs);
				elements.tabList = $tabList[0];
				elements.tabListCurrentItemHint = tabListCurrentItemHint;

				$panels.each(function () {
					// we'd better make sure the order of tabs in elements.tabs matches the order of panels in elements.panels
					this.panelIndex = elements.panels.length;
					elements.panels[this.panelIndex] = this;
					this.elements = { tab: null };
				});

				$tabs.each(function () {
					var myPanelId = this.getAttribute('aria-controls');
					if (!myPanelId) {
						C.w('Uncoupled tab met.', this);
						return false;
					}

					var myPanel = $('#'+myPanelId)[0];

					if (!myPanel) {
						C.e('Can not find controlled panel for tab [expected panel id="'+myPanelId+'"].');
						return false;
					}

					// we'd better make sure the order of tabs in elements.tabs matches the order of panels in elements.panels
					elements.tabs[myPanel.panelIndex] = this;
					this.panelIndex = myPanel.panelIndex;
					myPanel.elements.tab = this;
					this.elements = { panel: myPanel };
				});


				if ($tabs.length > 1) {
					$tabs.on('click', function (event) {
						if (typeof thisController.onTabClick === 'function') {
							thisController.onTabClick(this, event);
						}
						thisController.showPanelViaTab(this);
					});
					$tabs.on('mouseover', function () {
						thisController.slideTabCurrentItemHintTo(this);
					});
					$tabList.on('mouseout', function () {
						thisController.slideTabCurrentItemHintTo(elements.currentTab);
					});
				}


				if (initOptions && initOptions.doNotShowPanelAtInit) {
				} else {
					// C.l('Showing init panel...');
					this.showPanelViaTab(initOptions ? initOptions.initTab : 0);
				}


				delete status.isInitializing;
				delete status.noNeedToReconstruct;
				return true;
			}

			init.call(this);
			OT.destroyInstanceIfInitFailed.call(this, status, function () {
				rootElement.tabPanelSet = this;
			});

			function slideTabCurrentItemHintTo(theTab) {
				if (!tabListCurrentItemHint || !tabListCurrentItemHint.style) return false;

				var tabListCurrentItemHintCssLeft = 0;

				if (!theTab) {
					tabListCurrentItemHint.style.clip = '';
					return true;
				}

				var _P = $(theTab).offsetParent();
				var _L = $(theTab).offset().left;
				var _LP = $(_P).offset().left;

				_L -= _LP;
				_L -= tabListCurrentItemHintCssLeft;

				var _W = $(theTab).outerWidth();

				var _R = _L+_W;


				tabListCurrentItemHint.style.clip = 'rect('+
						'0, '+
					_R+ 'px, '+
						'3px, '+
					_L+ 'px)'
				;

				return true;
			}

			function getPanel(input) {
				// The input argument could be a tab dom, a panel dom, an integer or a string contains a number, or simply be omitted.
				// If the input is omitted and the currentPanel exists, then the currentPanel is returned.
				// If the input is omitted while the currentPanel does NOT exist, then null is returned.
				// If the input is NOT omitted and a non-object value is provided,  the currentPanel is returned if the currentPanel exists, otherwise the null.
				// But if the input is NOT omitted and an invalid object is provided, this function returns false instead of null.
				// If a panel dom or its tab dom is provided but the panel is NOT the member of this TabPanelSet, then false instead of null is returned.
				var inputPanel;
				var theFoundPanel;
				var inputPanelIndex;

				var inputIsAnObjectThatIsNotANull = typeof input === 'object' && !!input; // handle null object
				var inputIsAPanel = (input instanceof Node) && (typeof input.panelIndex === 'number') && (input.panelIndex >= 0) &&  (typeof input.elements === 'object');
				var inputIsATab   = inputIsAPanel && (input.elements.panel instanceof Node);
				inputIsAPanel = inputIsAPanel && !inputIsATab;

				if (inputIsAnObjectThatIsNotANull) {
					if (inputIsAPanel) {
						// inputPanelIndex = parseInt(input.panelIndex);
						inputPanel = input;
						inputPanelIndex = inputPanel.panelIndex;
					} else if (inputIsATab) {
						inputPanel = input.elements.panel;
						inputPanelIndex = inputPanel.panelIndex;
					} else {
						// some nonsense object
						C.e('Invalid object provided. It might be a uncoupled tab and had skipped setup.', input);
						return false;
					}
				} else {
					inputPanelIndex = parseInt(input);
				}

				if (isNaN(inputPanelIndex)) {
					if (typeof publicStatus.currentPanelIndex !== 'number' || isNaN(publicStatus.currentPanelIndex) || !elements.currentPanel) {
						if (!status.isInitializing) {
							C.w('The desired panel can not be found, nor can the currentPanel.');
						}
						return null;
					} else {
						return elements.currentPanel;
					}
				}

				inputPanelIndex = Math.max(0, Math.min(elements.panels.length-1, inputPanelIndex));
				theFoundPanel = elements.panels[inputPanelIndex];

				if (inputPanel && (theFoundPanel !== inputPanel)) {
					C.e('The input panel is not a member of this TabPanelSet.');
					return false;
				}

				if (!theFoundPanel) {
					C.e('The input was not a dom, then a valid index was evaluated. But an invalid panel got via the index. The panels array might have issue.');
					// Either:
					//     the input was neither a panel dom nor a tab dom,
					//     so inputPanelIndex was evaluated within allowed value range,
					//     and theFoundPanel should be get from the elements.panels array.
					//     thus !theFoundPanel should be false.
					//     in short, if !inputPanel then !!theFoundPanel is hopefully always true,
					//     unless the elements.panels array contains invalid member, which is hopefully impossible.
					// Or:
					//     the input was a panel or a tab dom,
					//     but the panelIndex of the input might NOT be within allowed value range,
					//     since the input itself might not be a valid member of this TabPanelSet,
					//     thus !theFoundPanel might be true (theFoundPanel might be undefined).

					return false;
				}

				return theFoundPanel;
			}

			function getPanelViaTab(tabNameOrTabDomOrPanelIndex) {
				if (typeof tabNameOrTabDomOrPanelIndex === 'string') {
					var panelIndex = parseInt(tabNameOrTabDomOrPanelIndex);
					if (isNaN(panelIndex)) {
						var tabDomOrTabLabelDom = $('#panel-tab-'+tabNameOrTabDomOrPanelIndex)[0];
						var tabDom;
						if (tabDomOrTabLabelDom) {
							if (wlc.DOM.getRole(tabDomOrTabLabelDom) === 'tab') {
								tabDom = tabDomOrTabLabelDom;
							} else {
								tabDom = $(tabDomOrTabLabelDom).parents('[role="tab"]')[0];
							}

							return this.getPanel(tabDom);
						} else {
							return null;
						}
					}
				}

				return this.getPanel(tabNameOrTabDomOrPanelIndex);
			}

			function showPrevPanel() {
				this.showPanel(publicStatus.currentPanelIndex-1);
			}

			function showNextPanel() {
				this.showPanel(publicStatus.currentPanelIndex+1);
			}

			function showPanelViaTab(tab) {
				this.showPanel(this.getPanelViaTab(tab));
			}

			function showPanel(thePanelOrTheTabOrTheIndex, shouldTrace) {
				// C.l('Requested to show', thePanelOrTheTabOrTheIndex);
				var thePanel = this.getPanel(thePanelOrTheTabOrTheIndex);
				if (thePanel === false) { // false means thePanel is a nonsense input, while null means omitted panel
					return false;
				}

				var shouldTakeAction = (!elements.currentPanel && !!thePanel) || (!!elements.currentPanel && (thePanel !== elements.currentPanel));

				if (!thePanel && !elements.currentPanel && !this.options.allowToShowNone) {
					shouldTakeAction = true;
					thePanel = elements.panels[0];
				}

				if (shouldTakeAction) {
					// C.l('\t Showing "#'+thePanel.id+'"');
					syncStatusToPanel.call(this, thePanel, shouldTrace, true);
				// } else {
				// 	C.t('Skipped');
				}
			}

			function syncStatusToPanel(thePanelOrTheTabOrTheIndex, shouldTrace, isMotiveActionFromShowPanel) {
				if (status.isOnAction) {
					// C.e('Re-entered, might encount an infinite loop invoking.');
					return false;
				}
				status.isOnAction = true;

				var thePanel = this.getPanel(thePanelOrTheTabOrTheIndex);

				if (thePanel === false) {
					return false;
				}

				if (!thePanel) {
					elements.currentTab = null;
					elements.currentPanel = null;
					publicStatus.currentPanelIndex = NaN;
				} else {
					if (shouldTrace) C.l('----------------------');
					for (var i = 0; i < elements.panels.length; i++) {
						var panel = elements.panels[i];
						_showHideOnePanel.call(this, panel, (thePanel && panel === thePanel), shouldTrace, isMotiveActionFromShowPanel);
					}

					elements.currentPanel = thePanel;
					publicStatus.currentPanelIndex = thePanel.panelIndex;
					if (thePanel.elements) {
						elements.currentTab = thePanel.elements.tab;
					} else {
						C.w('This panel [id="'+thePanel.id+'"] seems not initialized correctly.');
					}
				}

				this.slideTabCurrentItemHintTo(elements.currentTab);

				status.isOnAction = false;
			}

			function _showHideOnePanel(panel, isToShow, shouldTrace/*, isMotiveActionFromShowPanel*/) {
				// shouldTrace = true;
				if (shouldTrace) C.t(isToShow ? 'show --> ' : 'hide', panel.id);
				if (!panel) return false;

				var tab = panel.elements.tab;

				if (isToShow) {
					panel.setAttribute('aria-hidden', false);
					$(tab).addClass('current');
					$(panel).addClass('current');
					var nameToShowInPageHeader = panel.dataset.nameInPageHeader;
					if (nameToShowInPageHeader) {
						$(panel).parents('.page').find('.page-header .header-bar .center h1').html(nameToShowInPageHeader);
						$('title').html(nameToShowInPageHeader);
					}

					if (typeof thisController.onPanelShow === 'function') {
						if (shouldTrace) C.l('Calling onPanelShow ...', thisController);
						thisController.onPanelShow(panel);
					}
				} else {
					panel.setAttribute('aria-hidden', true);
					$(tab).removeClass('current');
					$(panel).removeClass('current');

					if (typeof thisController.onPanelHide === 'function') {
						thisController.onPanelHide(panel);
					}
				}

				return true;
			}
		};
	}).call(UI);
}).call(window.webLogicControls);