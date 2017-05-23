/**
 * @author 吴乐川 <wulechuan@live.com>
 * @module object-merge
 */
(function (factory) {
	var wlc = window.wlc;
	wlc.utilities.mergeBIntoA = factory(window.console);
})(function (C) {
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
	 * 		value is 0: Reference Overwriting.
	 * 				>	Uses reference of the source property, which is an object,
	 * 					to overwrite the target property.
	 * 
	 * 		value is 1: Copy.
	 * 				>	Uses a deeply copied duplication of the source property, which is an object,
	 * 					to overwrite the target property.
	 * 
	 * 		value is 2: Deeply Copy.
	 * 				>	deeply copy source object properties to into target property object.
	 * 					If target propert was NOT an object,
	 * 					then take the deeply copied duplication of the source object.
	 * 
	 * 		any other value: Reference Overwriting.
	 * 				>	treated as if it's zero.
	 * 
	 *		Note that the mentioned deeply copyings only travel into objects nested under objects,
	 *		but not arrays inside objects.
	 *
	 * @param {?number} [arrayTransferingMode=3]
	 * 		value is 0: Reference Overwriting.
	 * 				>	Uses reference of the source property, which is an array,
	 * 					to overwrite the target property.
	 * 
	 * 		value is 1: Copy.
	 * 				>	Uses a deeply copied duplication of the source property, which is an array,
	 * 					to overwrite the target property.
	 * 
	 * 		value is 2: Deep Copy.
	 * 				>	concatenates source array to target array property.
	 * 					If target propert was NOT an array,
	 * 					then take the deeply copied duplication of the source array.
	 * 
	 * 		any other value: Reference Overwriting.
	 * 				>	Treats the policy of transfering an array
	 * 					the same as that of an object decided by "objectTransferingMode".
	 * 					A value of 3 is taken for inner usage.
	 * 
	 *		Note that the mentioned deeply copyings only travel into arrays inside arrays,
	 *		but not objects inside arrays.
	 */
	function mergeBIntoA(a, b, objectTransferingMode, arrayTransferingMode) {
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
			if (isNaN(arrayTransferingMode) || arrayTransferingMode<0 || arrayTransferingMode>2) {
				arrayTransferingMode = 3;
			}
		}


		var key, sourceProperty, targetProperty;
		for (key in b) {
			targetProperty = a[key];
			sourceProperty = b[key];

			if (a.hasOwnProperty(key)
				&& typeof sourceProperty !== 'undefined'
				&& sourceProperty !== null
				&& typeof targetProperty !== 'undefined'
				&& targetProperty !== null
				&& typeof targetProperty !== typeof sourceProperty
			) {
				C.w('Overriding old property of DIFFERENT type:',
					'\n\t key: "'+key+'",',
					'\n\t old type: "'+(typeof targetProperty)+'",',
					'\n\t new type: "'+(typeof sourceProperty)+'"'
				);
			}



			if (sourceProperty instanceof Node
				|| sourceProperty === window
				|| sourceProperty === null
				|| typeof sourceProperty !== 'object'
			) {
				a[key] = sourceProperty;
				continue;
			}



			if (Array.isArray(sourceProperty)) {
				if (arrayTransferingMode === 0 || (arrayTransferingMode ===3 && objectTransferingMode === 0)) {
					a[key] = sourceProperty;
					continue;
				}

				var deeplyCopyHost = mergeBIntoA({}, sourceProperty, objectTransferingMode, arrayTransferingMode);
				if (!Array.isArray(targetProperty)) {
					a[key] = [].concat(sourceProperty); // make sure we use a duplication
				} else {
					a[key] = targetProperty.concat(sourceProperty);
				}
				continue;
			} else if (typeof sourceProperty === 'object') {
				if (objectTransferingMode===0) {
					a[key] = sourceProperty;
					continue;
				}


			}


			// Now the sourceProperty can ONLY be object, let's check out whether localProperty is also an object
			if (a[key] === null || typeof a[key] !== 'object') {
				a[key] = {};
			}

			// recursively migrate properties
			mergeBIntoA(a[key], sourceProperty, objectTransferingMode, arrayTransferingMode);
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