(function (factory) {
	// var wlc = window.wlc;
	factory(window.console);
})(function (C) {
	Object.prototype.mergePropertiesFrom = mergePropertiesFrom;

	function mergePropertiesFrom(soureObject, shouldOverwriteInsteadOfMerge, shouldOverwriteArrayEvenInMergeMode) {
		if (!soureObject || soureObject instanceof Node || soureObject === window) return;
		if (this === soureObject) {
			C.error('same object');
			return;
		}


		shouldOverwriteInsteadOfMerge = !!shouldOverwriteInsteadOfMerge;
		var shouldOverwriteArray = !!shouldOverwriteArrayEvenInMergeMode || shouldOverwriteInsteadOfMerge;


		var sourceProperty;
		for (var key in soureObject) {
			sourceProperty = soureObject[key];

			if (this.hasOwnProperty(key)
				&& typeof sourceProperty !== 'undefined'
				&& sourceProperty !== null
				&& typeof this[key] !== 'undefined'
				&& this[key] !== null
				&& typeof this[key] !== typeof sourceProperty
			) {
				C.w('Overriding old property of DIFFERENT type:\n\tkey: "'+key+'", old type: "'+(typeof this[key])+'", new type: "'+(typeof sourceProperty)+'"');
			}



			if (
				sourceProperty === null
				|| typeof sourceProperty !== 'object'
				|| sourceProperty === window
				|| sourceProperty instanceof Node
				|| shouldOverwriteInsteadOfMerge
			) {
				this[key] = sourceProperty;
				continue;
			}



			if (Array.isArray(sourceProperty)) {
				if (!Array.isArray(this[key]) || shouldOverwriteArray) {
					this[key] = [].concat(sourceProperty); // make sure we use a duplication
				} else {
					this[key] = this[key].concat(sourceProperty);
				}
				continue;
			}


			// Now the sourceProperty can ONLY be object, let's check out whether localProperty is also an object
			if (this[key] === null || typeof this[key] !== 'object') {
				this[key] = {};
			}

			// recursively migrate properties
			mergePropertiesFrom.call(this[key], sourceProperty, shouldOverwriteInsteadOfMerge, shouldOverwriteArray);
		}
	}
});