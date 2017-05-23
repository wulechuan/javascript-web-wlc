/**
 * @author 吴乐川 <wulechuan@live.com>
 * @module object-merge
 */
(function (factory) {
	var wlc = window.wlc;
	var utilities = wlc.utilities;

	utilities.mergeBIntoA = factory(
		utilities.generateAUniqueTokenUnder,
		window.console // new wlc.Console('Utilities > object > merging')
	);
})(function (generateAUniqueTokenUnder, C) {
	var recursivelyTravelledReferencesHost = {};

	Object.prototype.mergePropertiesFrom = function() {
		mergeBIntoA.apply(null, [this].concat(Array.prototype.slice(arguments)));
	};

	return mergeBIntoA;

	/**
	 * @author 吴乐川 <wulechuan@live.com>
	 * 
	 * @function - Merge all properties of object B into object A,
	 * 				>	with extra options controlling the merging behaviours.
	 * @name mergeBIntoA
	 * 
	 * @return {object} The original object A, or the newly created object if A was not a valid object.
	 * @param {?object} A - Object to accept new properties.
	 * 				>		If it was not an object or was a null, then a new object will be created.
	 * 
	 * @param {!object} B - Object as the property source.
	 * @param {?number} [objectTransferingMode=0]
	 * 		value is 0: Reference overwriting.
	 * 				>	Overwrite the target property with
	 * 					a reference of the source property, which is an object.
	 * 
	 * 		value is 1: Deep copy.
	 * 				>	Overwrite the target property with
	 * 					a deep copy of the source property, which is an object.
	 * 
	 * 		value is 2: Deep merge.
	 * 				>	Deeply copy source object properties into
	 * 					the original target property object,
	 * 					keeping those existing properties of the target property object,
	 * 					as long as they are not overwritten
	 * 					by properties coming from the source object.
	 * 					If the target property was NOT an object,
	 * 					then take the deeply copied duplication of the source object.
	 * 
	 * 		any other value: Reference Overwriting.
	 * 				>	treated as if it's zero.
	 * 
	 *		Note that the mentioned deeply copyings only travel into objects nested under objects,
	 *		but not arrays nested under objects.
	 *
	 * @param {?number} [arrayTransferingMode=0]
	 * 		value is 0: Reference overwriting.
	 * 				>	Overwrite the target property with
	 * 					a reference of the source property, which is an array.
	 * 
	 * 		value is 1: Deep copy.
	 * 				>	Overwrite the target property with
	 * 					a deep copy of the source property, which is an array.
	 * 
	 * 		value is 2: Concatenate with deep copies of nested arrays.
	 * 				>	Append elements of the source array to the original target array,
	 * 					with all nested sub-arrays copied deeply.
	 * 					If the target property was NOT an array,
	 * 					then take the deeply copied duplication of the source array.
	 * 
	 * 		value is 3: Concatenate without diving recursively into nested arrays.
	 * 				>	Append direct elements of source array to the original target array.
	 * 					If the target property was NOT an array,
	 * 					then take a direct copy of the source array.
	 * 
	 * 		any other value: Reference overwriting.
	 * 				>	Treats the policy of transfering an array
	 * 					the same as that of an object decided by "objectTransferingMode".
	 * 
	 *		Note that the mentioned deeply copyings only travel into arrays inside arrays,
	 *		but not objects inside arrays.
	 *
	 * @param {?(boolean|string)} [proceedSafeCheckSwithOrKey=undefined]
	 * 				>	Set to true to prevent infinite recursive caused by inter-referencing or self referencing.
	 * 					Set to a falthy value to skip the referencing checking.
	 * 					If it's a string, then the string is used as the token for cached references
	 * 					of objects and arrays that are travelled during current root invocation.
	 */
	function mergeBIntoA(a, b, objectTransferingMode, arrayTransferingMode, safeReferencingCheckSwithOkToken) {
		if (a === b) {
			C.e('Merging soure is the same object as the target.');
			return;
		}

		if (a instanceof Node) {
			C.e('Should NOT copy properties to a DOM Node.');
			return;
		}

		if (b instanceof Node) {
			C.e('Should NOT copy properties from a DOM Node.');
			return;
		}

		if (a === window) {
			C.e('Should NOT copy proterties to {window} object.');
			return;
		}
		if (b === window) {
			C.e('Should NOT copy proterties from {window} object.');
			return;
		}

		if (!b || typeof b !== 'object') {
			C.e('Merging source is NOT an object.');
			return;
		}

		if (!a || typeof a !== 'object') {
			a = {};
		}


		if (objectTransferingMode === true) {
			objectTransferingMode = 1;
		} else if (objectTransferingMode === false) {
			objectTransferingMode = 0;
		} else {
			objectTransferingMode = parseInt(objectTransferingMode);
			if (isNaN(objectTransferingMode) || objectTransferingMode<0 || objectTransferingMode>2) {
				objectTransferingMode = 0;
			}
		}


		if (arrayTransferingMode === true) {
			arrayTransferingMode = 1;
		} else if (arrayTransferingMode === false) {
			arrayTransferingMode = 0;
		} else {
			arrayTransferingMode = parseInt(arrayTransferingMode);
			if (isNaN(arrayTransferingMode) || arrayTransferingMode<0 || arrayTransferingMode>3) {
				arrayTransferingMode = objectTransferingMode;
			}
		}

	
		var shouldProceedSafeReferencingCheck = !!safeReferencingCheckSwithOkToken;
		var safeReferencingCheckTokenHost = recursivelyTravelledReferencesHost;
		var safeReferencingCheckToken;
		var allTravelledReferences;
		var thisIsTopLevelInvocation = false;
		if (shouldProceedSafeReferencingCheck) {
			if (typeof safeReferencingCheckSwithOkToken === 'string') {
				safeReferencingCheckToken = safeReferencingCheckSwithOkToken;
			} else {
				thisIsTopLevelInvocation = true;
				safeReferencingCheckToken = generateAUniqueTokenUnder(safeReferencingCheckTokenHost);
				safeReferencingCheckTokenHost[safeReferencingCheckToken] = [];

				C.w(
					'Checking referencing is turned on during recursively travelling an object.',
					'This makes it safer to travelling an object,',
					'however, will also slow down the process dramatically.'
				);
			}

			allTravelledReferences = safeReferencingCheckTokenHost[safeReferencingCheckToken];
		}


		var key, sourceProperty, targetProperty;
		for (key in b) {
			sourceProperty = b[key];
			targetProperty = a[key];

			var sourcePropertyType = typeof sourceProperty;
			var targetPropertyType = typeof targetProperty;

			var sourcePropertyIsAnArray = Array.isArray(sourceProperty);
			var targetPropertyIsAnArray = Array.isArray(targetProperty);

			var sourcePropertyIsAnObjectButNotAnArray =
					!!sourcePropertyType
				&&  sourcePropertyType === 'object'
				&& !sourcePropertyIsAnArray
				;

			var targetPropertyIsAnObjectButNotAnArray =
					!!targetPropertyType
				&&  targetPropertyType === 'object'
				&& !targetPropertyIsAnArray
				;

			if (a.hasOwnProperty(key)
				&& sourcePropertyType !== 'undefined'
				&& sourceProperty !== null
				&& targetPropertyType !== 'undefined'
				&& targetProperty !== null
				&& targetPropertyType !== sourcePropertyType
			) {
				C.w('Overwirting old property with a new one of DIFFERENT type:',
					'\n\t key: "'+key+'",',
					'\n\t old type: "'+(targetPropertyType)+'",',
					'\n\t new type: "'+(sourcePropertyType)+'"'
				);
			}



			if (sourcePropertyIsAnArray && targetPropertyIsAnArray && arrayTransferingMode===3) {
				a[key] = sourceProperty.concat(targetProperty);
				continue;
			}



			var currentSourcePropertyNeedToTravelRecursively =
				(
						(sourcePropertyIsAnArray               && arrayTransferingMode !==0)
					||  (sourcePropertyIsAnObjectButNotAnArray && objectTransferingMode!==0)
				)
				&& sourceProperty !== null
				&& sourceProperty !== window
				&& !(sourceProperty instanceof Node)
				;


			if (!currentSourcePropertyNeedToTravelRecursively) {
				a[key] = sourceProperty;
				continue;
			}

			// Since there is a "continue" statement above nested in the if clause,
			// below are all for "currentSourcePropertyNeedToTravelRecursively === true".



			if (shouldProceedSafeReferencingCheck) {
				var sourcePropertyHasBeenTravelled = false;
				for (var i=0; i<allTravelledReferences.length; i++) {
					var travelRecord = allTravelledReferences[i];
					if (sourceProperty === travelRecord.sourceProperty) {
						sourcePropertyHasBeenTravelled = true;
						break;
					}
				}

				if (sourcePropertyHasBeenTravelled) {
					a[key] = travelRecord.targetProperty;
					continue;
				}
			}

			// Again, there is a "continue" statement above nested in the if clause,
			// which means below are all for "sourcePropertyHasBeenTravelled === false".




			if (sourcePropertyIsAnArray) {
				var copyOfSourceArray = getCopyOfAnArray(
					sourceProperty,
					aaaaaa,
					safeReferencingCheckSwithOkToken
				);

				if (!targetPropertyIsAnArray) {
					a[key] = copyOfSourceArray;
					continue;
				}

				// After the "continue" statement above,
				// now both source and target properties are arrays.

				if (arrayTransferingMode===1) {
					a[key] = copyOfSourceArray;
				}

				if (arrayTransferingMode===2) {
					a[key] = sourceProperty.concat(copyOfSourceArray);
				}

				continue;
			}



			if (sourcePropertyIsAnObjectButNotAnArray) {

				if (!targetPropertyIsAnObjectButNotAnArray || objectTransferingMode===1) {
					var copyOfSourceObject = mergeBIntoA(
						{},
						sourceProperty,
						1,
						arrayTransferingMode,
						safeReferencingCheckSwithOkToken
					);
					a[key] = copyOfSourceObject;
					continue;
				}

				if (objectTransferingMode===2) {
					a[key] = mergeBIntoA(
						targetProperty,
						sourceProperty,
						2,
						arrayTransferingMode,
						safeReferencingCheckSwithOkToken
					);
				}

				continue;
			}


			// Now the sourceProperty can ONLY be object, let's check out whether localProperty is also an object
			// if (a[key] === null || typeof a[key] !== 'object') {
			// 	a[key] = {};
			// }

			// recursively transfer properties
			// mergeBIntoA(a[key], sourceProperty, objectTransferingMode, arrayTransferingMode);
		}




		if (thisIsTopLevelInvocation) {
			delete safeReferencingCheckTokenHost[safeReferencingCheckToken];
		}



		return a;
	}


	/**
	 * @author 吴乐川 <wulechuan@live.com>
	 * @param {!array} sourceArray 
	 * @param {?boolean} shouldUseReferenceOfNestedArrays 
	 * @param {?number} objectTransferingMode 
	 */
	function getCopyOfAnArray(sourceArray, shouldUseReferenceOfNestedArrays, objectTransferingMode) {
		if (!Array.isArray(sourceArray)) {
			C.e('Non-array object passed in.');
			return undefined;
		}


		shouldUseReferenceOfNestedArrays = !!shouldUseReferenceOfNestedArrays;


		if (objectTransferingMode === true) {
			objectTransferingMode = 1;
		} else if (objectTransferingMode === false) {
			objectTransferingMode = 0;
		} else {
			objectTransferingMode = parseInt(objectTransferingMode);
			if (isNaN(objectTransferingMode) || objectTransferingMode<0 || objectTransferingMode>2) {
				objectTransferingMode = 0;
			}
		}


		var result = [];
		for (var i=0; i<sourceArray.length; i++) {
			var element = sourceArray[i];
			if (typeof element !== 'object' || !element || shouldUseReferenceOfNestedArrays) {
				result.push(element);
				continue;
			}

		}

		return result;
	}
});