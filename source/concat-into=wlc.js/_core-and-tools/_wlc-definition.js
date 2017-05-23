(function (factory) {
	window.wlc = factory();
})(function () {
	var wlc = {};
	var nilFunction = function () {};

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


	wlc.console = console2;


	return wlc;
});