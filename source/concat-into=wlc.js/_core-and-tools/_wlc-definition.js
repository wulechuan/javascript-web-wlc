(function (factory) {
	window.wlc = factory();
})(function () {
	function nilFunction() {}

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

	var console2 = (function defineShortcutsForConsoleMethods() {
		var methodsToProcess = {
			log:      'l',
			trace:    't',
			warn:     'w',
			error:    'e',
			group:    'gs',
			groupEnd: 'ge',
		};

		var c = {}, method, shortcut;
		if (window.console && typeof window.console.log === 'function') {
			for (method in methodsToProcess) {
				shortcut = methodsToProcess[method];
				c[method] = window.console[method].bind(window.console);
				c[shortcut] = c[method];
			}
		} else {
			for (method in methodsToProcess) {
				shortcut = methodsToProcess[method];
				c[method] = nilFunction;
				c[shortcut] = nilFunction;
			}
		}

		return c;
	})();

	var utilities = {};

	utilities.nilFunction = nilFunction;
	utilities.generateAUniqueTokenUnder = generateAUniqueTokenUnder;

	var wlc = {};

	wlc.console = console2;
	wlc.utilities = utilities;

	return wlc;
});