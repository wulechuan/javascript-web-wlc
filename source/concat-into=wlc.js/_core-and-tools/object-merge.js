(function (factory) {
	var wlc = window.wlc;
	wlc.utitlies.mergeBIntoA = factory(window.console);
})(function (C) {
	Object.prototype.mergePropertiesFrom = function() {
		mergeBIntoA.apply(null, [this].concat(Array.prototype.slice(arguments)));
	};

	return mergeBIntoA;

	/**
	 * 
	 * @param {?object} A 
	 * @param {!object} B 
	 * @param {?number} [objectMergingMode=0]
	 * 		value is 0: Uses reference of the source property, which is an object,
	 * 					to overwrite the target property.
	 * 		value is 1: Uses a deeply copied duplication of the source property, which is an object,
	 * 					to overwrite the target property.
	 * 		value is 2: deeply copy source object properties to into target property object.
	 * 					If target propert was NOT an object,
	 * 					then take the deeply copied duplication of the source object.
	 * 		any other values: treated as if it's zero.
	 * 
	 *		Note that the mentioned deeply copyings only travel into objects nested under objects,
	 *		but not arrays inside objects.
	 * @param {?number} [arrayMergingMode=3]
	 * 		value is 0: Uses reference of the source property, which is an array,
	 * 					to overwrite the target property.
	 * 		value is 1: Uses a deeply copied duplication of the source property, which is an array,
	 * 					to overwrite the target property.
	 * 		value is 2: concatenates source array to target array property.
	 * 					If target propert was NOT an array,
	 * 					then take the deeply copied duplication of the source array.
	 * 		any other values: treated same policy as "{@link objectMergingMode}";
	 * 
	 *		Note that the mentioned deeply copyings only travel into arrays inside arrays,
	 *		but not objects inside arrays.
	 */
	function mergeBIntoA(A, B, objectMergingMode, arrayMergingMode) {
		if (A === B) {
			C.e('Merging soure is the same object as the target.');
			return;
		}

		if (A instanceof Node) {
			C.e('Should NOT copy properties to a DOM Node.');
			return;
		}

		if (B instanceof Node) {
			C.e('Should NOT copy properties from a DOM Node.');
			return;
		}

		if (A === window) {
			C.e('Should NOT copy proterties to {window} object.');
			return;
		}
		if (B === window) {
			C.e('Should NOT copy proterties from {window} object.');
			return;
		}

		if (!B || typeof B !== 'object') {
			C.e('Merging source is NOT an object.');
			return;
		}

		if (!A || typeof A !== 'object') A = {};



		objectMergingMode = parseInt(objectMergingMode);
		arrayMergingMode  = parseInt(arrayMergingMode);

		if (isNaN(objectMergingMode) || objectMergingMode<0 || objectMergingMode>2) objectMergingMode = 0;
		if (isNaN(arrayMergingMode)  || arrayMergingMode<0  || arrayMergingMode>2)  arrayMergingMode  = 3;

		shouldNotDeeplyCopyObjectProperties = !!shouldNotDeeplyCopyObjectProperties;
		shouldNotDeeplyCopyArrayElements    = !!shouldNotDeeplyCopyArrayElements;

		var key, sourceProperty, targetProperty;
		for (key in B) {
			targetProperty = A[key];
			sourceProperty = B[key];

			if (A.hasOwnProperty(key)
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



			if (sourceProperty === null
				|| typeof sourceProperty !== 'object'
				|| sourceProperty === window
				|| sourceProperty instanceof Node
				|| shouldNotDeeplyCopyObjectProperties
			) {
				A[key] = sourceProperty;
				continue;
			}



			if (Array.isArray(sourceProperty)) {
				if (!Array.isArray(A[key]) || shouldNotDeeplyCopyArrayElements) {
					A[key] = [].concat(sourceProperty); // make sure we use a duplication
				} else {
					A[key] = A[key].concat(sourceProperty);
				}
				continue;
			}


			// Now the sourceProperty can ONLY be object, let's check out whether localProperty is also an object
			if (A[key] === null || typeof A[key] !== 'object') {
				A[key] = {};
			}

			// recursively migrate properties
			mergeBIntoA(A[key], sourceProperty, shouldNotDeeplyCopyObjectProperties, shouldNotDeeplyCopyArrayElements);
		}

		return A;
	}
});