/* sidlynk.utilities */

/* global
	l w e isDom isDomElement qS qSA $
	Components
*/

if (!window.sidlynk) window.sidlynk = {};


(function ($F) { // foundational
	window.l = window.console.log.bind(window.console);
	window.w = window.console.warn.bind(window.console);
	window.e = window.console.error.bind(window.console);

	Array.prototype.indexOfValue = function ( value, startIndex ) {
		startIndex = parseInt( startIndex );
		if (isNaN(startIndex)) startIndex = 0;
		for (var i=startIndex; i<this.length; i++)
			if ( this[i] === value ) return i;
		return -1;
	};

	Array.prototype.has = function () {
		return this.indexOfValue( arguments[0], 0 ) >= 0;
	};

	Array.prototype.hasAll = function () {
		var found = true;
		for (var i=0; i<arguments.length; i++) {
			found = found && this.has( arguments[i] );
			if ( !found ) break;
		}
		return found;
	};

	Array.prototype.hasAny = function () {
		var found = false;
		for (var i=0; i<arguments.length; i++) {
			found = found || this.has( arguments[i] );
			if ( found ) break;
		}
		return found;
	};

	Array.prototype.hasNo = function () {
		var found = false;
		for (var i=0; i<arguments.length; i++) {
			found = found || this.has( arguments[i] );
			if ( found ) break;
		}
		return !found;
	};

	Array.prototype.countOf = function () {
		var count = 0;
		for (var i=0; i<this.length; i++)
			if ( this[i] === arguments[0] )
				count++;
		return count;
	};

	Array.prototype.pushIfHasNo = function () {
		if ( this.has( arguments[0] ) ) 
			return this.indexOfValue( arguments[0], 0 );
		this.push( arguments[0] );
		return (this.length - 1);
	};

	Array.prototype.del = function ( value, startIndex ) {
		var _index = this.indexOfValue( value, startIndex );
		if ( _index >=0 ) {
			this.splice( _index, 1 );
			return true;
		}
		return false;
	};

	Array.prototype.delAll = function () {
		var deletedItemsCount = 0;
		while ( this.has( arguments[0] ) ) {
			this.del( arguments[0], 0 );
			deletedItemsCount++;
		}
		return deletedItemsCount;
	};
})(window.sidlynk);


(function ($F) { // utilities: initial definition
	var utilities = {};
	$F.utilities = utilities;

	utilities.migratePropertiesFrom = function(soureObject, shouldOverwriteInsteadOfMerge, shouldOverwriteArrayEvenInMergeMode) {
		if (!soureObject || soureObject instanceof Node || soureObject === window) return;
		if (this === soureObject) {
			e('same object');
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
				w('Overriding old property of DIFFERENT type:\n\tkey: "'+key+'", old type: "'+(typeof this[key])+'", new type: "'+(typeof sourceProperty)+'"');
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
			utilities.migratePropertiesFrom.call(this[key], sourceProperty, shouldOverwriteInsteadOfMerge, shouldOverwriteArray);
		}
	};

	utilities.defineClass = function(prototypeName, ancestorConstructor, initPropertiesCarrier, selfConstructor, _shouldTrace) {
		/*
		// sample usage: begin
			utilities.defineClass.call(sidlynk.app.controllerPrototypes,
				'Page',
				function () {}, // or another {Class}, which of cause is a function
				new (function() { // properties to merge or prepare before construction
					this.init = function (data, options) {};
					this.onShow = function (options) {};
					this.onHide = function () {};
					this.update = function(data) {};
				}),
				function () {}, // self constructor
				false
			);

			// The new (function() {}) creates an object which carries all initPropertiesCarrier,
			// and insert it as the second argument (arguments[1]) of this defineClass method
		// sample usage: end
		*/

		if (typeof prototypeName !== 'string' || !prototypeName) {
			e('Invalid prototype name for building a prototype.');
			return undefined;
		}

		_shouldTrace = !!_shouldTrace;
		// _shouldTrace = _shouldTrace || (prototypeName.search(/^DirectEditBlock/)==0);

		function BasicController() {
			this.data = {};
			this.status = {
				constructed: false
			};
			this.options = {};
			this.controllers = {};
			this.__isInstanceOf__ = { BasicController: true };
		}


		BasicController.classLogName = '{Class:BasicController}';
		BasicController.__classHierarchyDepth__ = 0;


		var _migrate = utilities.migratePropertiesFrom;
		var classLogName = '{Class: '+ (prototypeName ? prototypeName : 'anonymous') + '}';


		var hasAncestorClass = typeof ancestorConstructor === 'function';
		if (!hasAncestorClass) ancestorConstructor = BasicController;
		var selfConstructorIsProvided = typeof selfConstructor === 'function';



		if (typeof initPropertiesCarrier === 'object') {
			// Mark methods owner
			var _method;
			for (var _f in initPropertiesCarrier) {
				_method = initPropertiesCarrier[_f];
				if (typeof _method !== 'function') continue;
				_method.__ownedByClass__ = prototypeName;
			}
		}




		var _constructorSourceCode = (function () {
			// The source code of this anonymous function will be eval()ed below

			var arg = Array.prototype.slice.apply(arguments);
			var _lastArg = arg[arg.length-1];
			var isConstructingMySuccessor = (typeof _lastArg === 'object') && _lastArg && (_lastArg.isConstructingMySuccessor === true);

			if (isConstructingMySuccessor) {
				// l('==> Constructing '+ancestorConstructor.classLogName+' for '+classLogName+' ...');
			} else {
				if (_shouldTrace) l('\n\n==> Constructing '+classLogName+' ...');
				arg.push({ isConstructingMySuccessor: hasAncestorClass });
			}



			ancestorConstructor.apply(this, arg);
			// l('Ancestor '+ancestorConstructor.classLogName+' constructed for', classLogName);



			// Now so-called ancestor are ready,
			// let's override properties with the ones of this class's own.
			// First of all, the classLogName.
			this.classLogName = classLogName;

			// Then, all the initial properties
			if (_shouldTrace) l('Migrating initial properties for '+classLogName+' ...');
			_migrate.call(this, initPropertiesCarrier);



			if (selfConstructorIsProvided) {
				_migrate.call(this, selfConstructor.apply(this, arguments));
			}



			// The onAncestorConstructed method is designed for executing some actions
			// that come with ancestor classes
			// but should be executed after all successors options and properties are ready.
			// By the way, in most cases a method, especially an initialization method
			// should be only executed once, if we designed our program well enough.
			// For example:
			//     the ancestor.options.a = true;
			// while:
			//     the successor.options.a = false;
			// Obviously we want the options.a to be false whenever we are constructing a successor object.
			// Note that:
			//     Even the onAncestorConstructed method belongs to (aka comes with) the ancestor class,
			//     it will be executed over the successor class.
			if (typeof this.onAncestorConstructed === 'function' && !isConstructingMySuccessor) {
				if (_shouldTrace) {
					l('onAncestorConstructed: '+classLogName+' ...',
						// '\n\tprototypeName: "'+prototypeName+'".',
						'\n\tthis.onAncestorConstructed.__ownedByClass__: "'+this.onAncestorConstructed.__ownedByClass__+'".'
					);
				}
				this.onAncestorConstructed.apply(this, arg);
			}



			// There are some actions that should be executed
			// only if the class of the instance is the last node of the classes inheritance chain.
			// In fact, the onConstructedNotAsAnAncestor method is pretty much the same as the onAncestorConstructed method.
			// For the historical reasons, I reserved both ones.
			if (!isConstructingMySuccessor) {
				if (typeof this.onConstructedNotAsAnAncestor === 'function') {
					this.onConstructedNotAsAnAncestor.apply(this, arg);
				}
			}



			this.__isInstanceOf__[prototypeName] = true;
			this.__classHierarchyDepth__ = ancestorConstructor.__classHierarchyDepth__ + 1;
		}).toString();




		_constructorSourceCode = _constructorSourceCode
			.replace(/^\s*function\s+[^\(]+\s*\(/, 'function (');


		// Align source code line numbers
		_constructorSourceCode = (function (lines) {
			var snippet = [];
			for (var i = 0; i < lines; i++) {
				snippet.push('////\n');
			}
			return snippet.join('');
		})(214 - 1) + _constructorSourceCode;




		var thisString = this === window ? 'window.' : 'this.';
		var evalString = thisString+prototypeName+' = '+_constructorSourceCode;
		// if (_shouldTrace) l('Class Source:', evalString.slice(0, Math.min(200, evalString.indexOf('\n'))) + '...}');
		eval(evalString);



		this[prototypeName].classLogName = classLogName;
		this[prototypeName].__classHierarchyDepth__ = ancestorConstructor.__classHierarchyDepth__ + 1;

		return this[prototypeName];
	};

	utilities.createInstanceOf = function(constructor, initArgumentsArray, overridePropertiesCarrier, initActions) {
		var instance;
		if (typeof constructor !== 'function') {
			instance = {};
		} else {
			instance = Object.create(constructor.prototype);
			constructor.apply(instance, initArgumentsArray);
		}

		utilities.migratePropertiesFrom.call(instance, overridePropertiesCarrier);

		if (typeof instance.init === 'function') instance.init();
		if (typeof initActions === 'function') initActions.apply(instance, initArgumentsArray);

		return instance;
	};

	utilities.LCC = function (classInstance) {
		l('Constructing '+classInstance.classLogName+' ...');
	};

	utilities.LCBIP = function (prototypeName) {
		l('Building initial properties to migrate for {Class:'+prototypeName+'} ...');
	};
	window.LCC = utilities.LCC;
	window.LCBIP = utilities.LCBIP;
})(window.sidlynk);


(function ($F) { // utilities: part 1: web environment
	var utilities = $F.utilities;
	utilities.env = (function () {
		function _found(stringToSearchIn, stringToSearch, notCaseSensitive) {
			if (notCaseSensitive) {
				stringToSearchIn = stringToSearchIn.toLowerCase();
				stringToSearch = stringToSearch.toLowerCase();
			}

			return stringToSearchIn.search(stringToSearch) >= 0;
		}
		function uaHas(inString, notCaseSensitive)          { return _found(navigator.userAgent, inString, notCaseSensitive); }
		function uaHasNot(inString, notCaseSensitive)       { return !uaHas(inString, notCaseSensitive); }
		function platformHas(inString, notCaseSensitive)    { return _found(navigator.platform, inString, notCaseSensitive); }
		function platformHasNot(inString, notCaseSensitive) { return !platformHas(inString, notCaseSensitive); }

		if (!window.location.origin) {
			window.location.origin =
					window.location.protocol
				+	'//'
				+	window.location.hostname
				+	(window.location.port ? (':'+window.location.port) : '');
		}


		var pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
		var screenMappedPixelX = screen.width;
		var screenMappedPixelY = screen.height;
		var screenPhysicalPixelX = Math.round( screenMappedPixelX * pixelRatio );
		var screenPhysicalPixelY = Math.round( screenMappedPixelY * pixelRatio );


		var isHighResolutionVirtualScreen =
			screenMappedPixelX >= 1360 && screenMappedPixelY >= 768
		||  screenMappedPixelX >= 768  && screenMappedPixelY >= 1360;

		var isHighResolutionPhysicalScreen =
			screenPhysicalPixelX >= 1360 && screenPhysicalPixelY >= 768
		||  screenPhysicalPixelX >= 768  && screenPhysicalPixelY >= 1360;



		var isWindowsPhoneSimuDesktop = uaHas('WPDesktop');

		var isWindowsPhone7x =
			uaHas('Windows Phone OS 7.') || uaHas('ZuneWP7')
		||  isWindowsPhoneSimuDesktop && uaHasNot('Windows NT');

		var isWindowsPhone8x =
			uaHas('Windows Phone 8.')
		||  isWindowsPhoneSimuDesktop && uaHas('Windows NT 6');

		var isWindowsPhone = isWindowsPhone7x || isWindowsPhone8x || isWindowsPhoneSimuDesktop;

		// to be tested
		var isWindowsRT = uaHas('Windows NT') && uaHas('ARM;') && !isWindowsPhoneSimuDesktop;

		var isWindows = uaHas('Windows') || isWindowsPhone7x;
		var isWindowsTouch = uaHas('Touch') && isWindows;

		// http://www.enterpriseios.com/wiki/UserAgent
		var isIpod = uaHas('iPod') && platformHasNot('Win32');
		var isIphone = uaHas('iPhone') && platformHasNot('Win32');
		var isIpad = uaHas('iPad') && platformHasNot('Win32');
		var isIOS = isIpod || isIphone || isIpad || uaHas('like Mac OS X');// && platformHasNot('Win32');
		var isMacOSX = uaHas('Mac OS X') && uaHasNot('like Mac OS X') && platformHasNot('Win32');

		// isAndroid *NOT* always correct
		var isAndroid = uaHas('Android') || platformHas('Linux arm');



		// http://msdn.microsoft.com/zh-CN/library/ms537503.aspx
		var isIE6 =  uaHas('MSIE 6.');
		var isIE7 =  uaHas('MSIE 7.');
		var isIE8 =  uaHas('MSIE 8.');
		var isIE9 =  uaHas('MSIE 9.');
		var isIE10 = uaHas('MSIE 10.');
		var isIE11 = uaHas('rv:11.');// || uaHas('Trident/7.0');
		
		var isIE8OrOlder = isIE8 || isIE7 || isIE6;
		var isIE11orLater = isIE11;

		var isEngineTrident = uaHas('Trident');
		var isIE = isEngineTrident;// || isIE6 || isIE7 || isIE8 || isIE9 || isIE10 || isIE11;

		var isEdge = uaHas('Edge\/');
		
		var isFirefox = uaHas('Firefox');
		var isEngineGecko = uaHas('Gecko') && uaHasNot('ike Gecko') && isFirefox;

		var isEngineWebkit = uaHas('AppleWebKit');
		var isChrome = uaHas('Chrome\/');
		// var isAndroidDefault = isAndroid && !isChrome;
		var isSafari = uaHas('Safari') && !isChrome && !isAndroid;

		var isEnginePresto = uaHas('Presto');
		var isOldOpera = uaHas('Opera');
		var isNewOpera = isEngineWebkit && uaHas('OPR/');
		var isOperaNext = isNewOpera && uaHas('Edition Next');
		var isOpera = isOldOpera || isNewOpera;

		var isInTouchMode =
			isWindowsTouch || isWindowsPhone || isWindowsRT ||
			isAndroid || isIOS;

		var isDesktopUA =
			isHighResolutionVirtualScreen ||
			isWindowsPhoneSimuDesktop ||
			uaHas('WOW64') ||
			isMacOSX ||
			(!isWindowsPhone && !isAndroid && !isIphone);

		var languageRaw = navigator.language || navigator.userLanguage;
		var isLanguageChinese = languageRaw.toLowerCase() === 'zh-cn';
		var isLanguageEnglish = languageRaw.toLowerCase() === 'en-us';

		var isWeiXinWebView = uaHas('MicroMessenger', true); // Failed in Windows Phone WeiXin

		return {
			language: {
				raw: languageRaw,
				isChinese: isLanguageChinese,
				isEnglish: isLanguageEnglish
			},
			screen: {
				pixelRatio:		pixelRatio
				// mappedPixelX:	screenMappedPixelX,
				// mappedPixelY:	screenMappedPixelY,
				// physicalPixelX:	screenPhysicalPixelX,
				// physicalPixelY:	screenPhysicalPixelY
			},
			os: {
				windows: 		isWindows,
				windowsPhone: 	isWindowsPhone,
				wp: 			isWindowsPhone,
				windowsPhone7: 	isWindowsPhone7x,
				wp7: 			isWindowsPhone7x,
				windowsPhone8: 	isWindowsPhone8x,
				wp8: 			isWindowsPhone8x,
				windowsRT: 		isWindowsRT,
				ios: 			isIOS,
				osx: 			isMacOSX,
				android: 		isAndroid,
				chromeOS: 		null,
				linux:			null // so-called traditional linux
			},
			ua: {
				edge:           isEdge,
				ie:				isIE,
				ie6:			isIE6,
				ie7:			isIE7,
				ie8:			isIE8,
				ie8OrOlder:		isIE8OrOlder,
				ie9:			isIE9,
				ie10:			isIE10,
				ieModern:		isIE11orLater,
				chrome:			isChrome,
				safari:			isSafari,
				opera:			isOpera,
				operaOld:		isOldOpera,
				operaNew:		isNewOpera,
				firefox:		isFirefox
			},
			engine: {
				trident:		isEngineTrident,
				webkit:			isEngineWebkit,
				presto:			isEnginePresto,
				gecko:			isEngineGecko
			},
			mode: {
				touch:			isInTouchMode,
				desktop:		isDesktopUA
			},
			webView: {
				weChat:         isWeiXinWebView,
				weixin:         isWeiXinWebView
			},
			device: {
				windowsPhone:	isWindowsPhone,
				wp:				isWindowsPhone,
				windowsRT:		isWindowsRT,
				ipod:			isIpod,
				ipad:			isIpad,
				iphone:			isIphone
			}
		};
	})();
})(window.sidlynk);


(function ($F) { // utilities: part 2: general tools
	var utilities = $F.utilities;

	utilities.strings = {
		splice: function(string, startIndex, lengthToReplace, insert) {
			return string.slice(0, startIndex) + (insert || '') + string.slice(startIndex + lengthToReplace);
		},

		processCssSelectorForHtmlAttribute: function(attributeName, selectorOrValue) {
			// selectorOrValue means the full selector string or just the value of the attribute
			// for example: it can be either [data-page-name="my-first-page"] or just my-first-page.

			// l(selectorOrValue);

			if (typeof attributeName !== 'string' || !attributeName) {
				e('An html attribute name selector must be a string');
				return undefined;
			}

			if (typeof selectorOrValue !== 'string' || !selectorOrValue) {
				e('A css attribute selector or its value must be a string');
				return undefined;
			}


			var _v = selectorOrValue; // a copy with short name just for conveniences
			var rawSelector = selectorOrValue;
			var soloSelector = '';
			var attributeNameRegExpSafeVersion = attributeName.replace(/\-/g, '\\-');
			var searchPattern = new RegExp('\\[\\s*'+attributeNameRegExpSafeVersion+'\\s*=');

			if (_v.search(searchPattern) < 0) {
				soloSelector = '['+attributeName+'="'+_v+'"]';
				rawSelector = soloSelector;
			} else {
				soloSelector = _v;

				var _i1, _i2;

				_i1 = _v.search(searchPattern);
				_v = _v.slice(_i1);

				_i1 = _v.indexOf('=');
				_i2 = _v.indexOf(']');
				_v = _v.slice(_i1+1, _i2)
					.replace(/^\s*/, '')
					.replace(/\s*$/, '')
				;
				_i1 = _v.slice(0,1);
				_i2 = _v.slice(-1);

				if (_i1==='\'' || _i1==='"' || _i2==='\'' || _i2==='"') {
					if (_i1===_i2) {
						_v = _v.slice(1, -1);
					} else {
						e('Invalid selector: "'+selectorOrValue+'"');
						return undefined;
					}
				}
			}

			// l('Attribute "'+attributeName+'": \''+_v+'\',\nsoloSelector: \''+soloSelector+'\'');

			return {
				attribute: attributeName,
				selector: rawSelector,
				soloSelector: soloSelector, // focusing on this attribute only, other parts are clipped, if any
				value: _v
			};
		},

		removeTerminalSpaces: function (string) {
			string = String(string);
			return string
				.replace(/^\s+/, '')
				.replace(/\s+$/, '')
			;
		},
		removeLineBreaks: function (string) {
			string = String(string);
			return string.replace(/^\s*$/mg, '').replace(/\n+/g, '');
		},
		removeBlankLines: function (string) {
			string = String(string);
			return string.replace(/^\s*$/mg, '').replace(/\n+/g, '\n');
		},

		makeSafeHtml: function (string, isForInputOrTextAreaValue) {
			if (typeof string !== 'string') return '';
			string = string.slice(0, 32766);
			string = string
				.replace(/<\!--.*?-->\s*/ig, '')
				.replace(/>\s+</ig, '><')
				.replace(/<\!doctype[^>]*>/ig, '')
				.replace(/<html\b[^>]*>/ig, '')
				.replace(/<\/html\b[^>]*>/ig, '')
				.replace(/<head\b[^>]*>.*?<\/head\b[^>]*>/ig, '')
				.replace(/<body\b[^>]*>/ig, '')
				.replace(/<\/body\b[^>]*>/ig, '')

				.replace(/<script[^>]*>.*?<\/script[^>]*>/ig, '')
				.replace(/<script[^>]*>/ig, '')
				.replace(/<\/script[^>]*>/ig, '')

				.replace(/<style\b[^>]*>[^<]*<\/style[^>]*>/ig, '')
				.replace(/<meta\b[^>]*>/ig, '')
				.replace(/<link\b[^>]*>/ig, '')

				.replace(/<input\b[^>]*>/ig, '')
				.replace(/<select\b[^>]*>/ig, '')
				.replace(/<\/select\b[^>]*>/ig, '')
				.replace(/<option\b[^>]*>/ig, '')
				.replace(/<\/option\b[^>]*>/ig, '')
				.replace(/<form\b[^>]*>/ig, '')
				.replace(/<\/form\b[^>]*>/ig, '')
				.replace(/<iframe\b[^>]*>/ig, '')
				.replace(/<\/iframe\b[^>]*>/ig, '')

				.replace(/\s*on\w+\=['"]?[^'">]+['"]?(?=<\w+[^>]*)/ig, '')
				.replace(/\s*href\=['"][^'"<>]*javascript[^'"<>]*['"]/ig, '')
				.replace(/\n{2,}/ig, '\n')
			;

			if (!isForInputOrTextAreaValue) {
				string = string
					.replace(/&/ig, '&amp;')
					.replace(/</ig, '&lt;')
					.replace(/>/ig, '&gt;')
				;
			}
			return string;
		},

		makeSafeHtmlAttribute: function(string) {
			string = this.makeSafeHtml(string)
				.replace(/=/ig, '&#x003D;')
				.replace(/"/ig, '&#x0022;')
				.replace(/'/ig, '&#x0027;')
			;
			return string;
		}
	};

	utilities.date = {
		isAnInValidDate: function (date) {
			return isNaN(date.getTime());
		},
		formatDate: function (inputDate, noYear, isShort) {
			noYear = !!noYear;
			isShort = !!isShort;
			var isChinese = !!utilities.env.language.isChinese;
			var dateString = '';

			var _D = new Date(inputDate);
			if (this.isAnInValidDate(_D)) {
				e('Invalid date input. The value of now is used instead.');
				_D = new Date();
			}

			var year  = _D.getFullYear();
			var month = _D.getMonth() + 1;
			var date  = _D.getDate();

			month = (month < 10 ? '0' : '') + month;
			date  = (date  < 10 ? '0' : '') + date;

			if (isChinese && !isShort) {
				dateString = (noYear ? '' : (year + '年')) + month + '月' + date + '日';
			} else {
				dateString = (noYear ? '' : (year + '-' )) + month + '-' + date;
			}

			return dateString;
		},
		formatDateShort: function (date, noYear) {
			return this.formatDate(date, noYear, true);
		},
		formatClock: function (date, hasSeconds) {
			hasSeconds = !!hasSeconds;

			var _D = new Date(date);
			if (this.isAnInValidDate(_D)) _D = new Date();

			var hour  = _D.getHours();
			var min   = _D.getMinutes();
			var sec   = _D.getSeconds();

			hour  = (hour  < 10 ? '0' : '') + hour;
			min   = (min   < 10 ? '0' : '') + min;
			sec   = (sec   < 10 ? '0' : '') + sec;

			return hour + ':' + min + (hasSeconds ? (':' + sec) : '');
		},
		format: function (date, noYear, hasSeconds) {
			return this.formatDate(date, noYear) + ' ' + this.formatClock(date, hasSeconds);
		},
		formatShort: function(date, noYear, hasSeconds) {
			return this.formatDate(date, noYear, true) + ' ' + this.formatClock(date, hasSeconds);
		},
		formatAsBackEndDoes: function(inputDate) {
			var _D = new Date(inputDate);
			if (this.isAnInValidDate(_D)) {
				e('Invalid date input. The value of now is used instead.');
				_D = new Date();
			}

			var year  = _D.getFullYear();
			var month = _D.getMonth() + 1;
			var date  = _D.getDate();
			var hour  = _D.getHours();
			var min   = _D.getMinutes();
			var sec   = _D.getSeconds();

			month = (month < 10 ? '0' : '') + month;
			date  = (date  < 10 ? '0' : '') + date;
			hour  = (hour  < 10 ? '0' : '') + hour;
			min   = (min   < 10 ? '0' : '') + min;
			sec   = (sec   < 10 ? '0' : '') + sec;

			return year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
		},
		isAValidYearMonthDay: function (year, month, day){  
			year = parseInt(year);
			month = parseInt(month);
			day = parseInt(day);

			if (month > 12 || month < 1)  {
				return false;
			}
          
			var isLeapYear = // 闰年
                !(year%3200 === 0) && (
				((year%100 === 0) && (year%400 === 0))
				|| ((year%100 !== 0) && (year%4 === 0))
			);

			if (((',1,3,5,7,8,10,12,').indexOf(','+month+',') != -1) && (day <= 31)) {
				return true;
			} else if (((',4,6,9,11,').indexOf(','+month+',') != -1) && (day <= 30)) {
				return true;
			} else if (day <= 28) {
				return true;
			} else if (isLeapYear && (day <= 29)) {
				return true;
			}

			return false;
		}
	};

	utilities.validator = {
		isAValidQiNiuVideoUrl: function(url) {
			// http://7teb00.com2.z0.glb.qiniucdn.com/
			// even shortest domain name contains 4 characters
			var minLengthOfIpOrDomain = 4;
			var minLengthOfSuffix = 6;

			if (typeof url != 'string') return false;
			if (url.length<minLengthOfIpOrDomain+1+minLengthOfSuffix) return false;

			var _a, _b, _ipOrDomain, _urlSuffix;

			_a = url.search('://');
			if (_a>0) url = url.slice(_a+3);

			_a = url.search(/[\/\?#]/);
			_b = url.search(/[:\/\?#]/);
			// l(_b, _a);

			if (0<=_b && _b<minLengthOfIpOrDomain) return false;

			_ipOrDomain = url;
			_urlSuffix  = url;
			if (_b>=minLengthOfIpOrDomain) {
				_ipOrDomain = url.slice(0, _b);
				_urlSuffix = url.slice(_a+1);
			}

			// l('ipOrDomain:', _ipOrDomain.indexOf('.')<1, '\t"'+_ipOrDomain+'"');
			// l('urlSuffix: ', _urlSuffix.length>=minLengthOfSuffix,     '\t"'+_urlSuffix+'"');

			if (!!_ipOrDomain && _ipOrDomain.indexOf('.')<1) return false;

			return !!_urlSuffix && _urlSuffix.length>=minLengthOfSuffix;
		},
		isChineseCitizenId: function (id) {
			var idCardTester = new RegExp(/^\d{6}(19\d{2}|20[0-2]\d)((0[13-9]|10|11|12)(0[1-9]|[1-2][0-9]|3[01])|(02(0[1-9]|[12][0-9])))\d{3}[0-9xX]$/);
			return idCardTester.test(id+'');
		},
		checkEmailAddress: function (email) {
			if (typeof email === 'string') {
				// do nothing at present
			} else if (isDom(email) && email.nodeName.toLowerCase() === 'input') {
				email = email.value;
			}

			email = email.replace(/^\s+/, '').replace(/\s+$/, '');
			return /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}/.test(email);
		},

		checkMobileNumber: function (mobile, location) {
			if (typeof mobile === 'string') {
				// do nothing
			} else if (isDom(mobile) && mobile.nodeName.toLowerCase() === 'input') {
				mobile = mobile.value;
			}

			mobile = mobile.replace(/\s|-/g, '');

			var isValid = false;
			var targetLength = '13800138000'.length;

			if (!location || typeof location !== 'string') {
				location = 'zh-CN';
			} else {
				location = location.toLowerCase();
			}

			switch (location) {
				case 'cn':
				case 'zh':
				case 'zh-CN':
					isValid =
							mobile.length === targetLength
						&&	mobile.replace(/\D/, '').length === targetLength
						&&	mobile.charAt(0) === '1';
					break;
				default:
			}

			return isValid;
		},
	};

	utilities.validator.isMobileNumber = utilities.validator.checkMobileNumber;
	utilities.validator.isEmailAddress = utilities.validator.checkEmailAddress;

	utilities.countChars = function (string) {
		function charIsLatin(character) { return /[_a-zA-Z0-9%#$]/g.test(character) || character==='-'; }
		function charIsLatinSpace(character) { return /\s/g.test(character); }
		function charIsLatinPunctuation(character) { return /[?\|\\\.\/,;\:\'\"!+<>&\[\]\{\}\(\)=*\^@]/g.test(character); }
		function charIsHan(character) {return /[\u4E00-\u9FA5]/g.test(character); }
		function charIsHanPunctuation(character) { return /[\u3000-\u303F]/g.test(character) || /[？，“”！：；…]/g.test(character); }
		function charIsHanOrPunctuation(character) { return charIsHan(character) || charIsHanPunctuation(character); }

		function count(string) {
			var counts = {
				all: 0,
				allTerms: 0,
				hanChars: 0,
				latinWords: 0,
				spcaesAndLatinPunctuations: 0
			};

			if (typeof string !== 'string' || string.length<1 ) {
				counts.all = 0;
				counts.hanChars = 0;
				counts.latinWords = 0;
				counts.spcaesAndLatinPunctuations = 0;
				return counts;
			}

			var latinWords = [];
			var hanChars = [];
			var splitters = [];

			var newLatinWord = '';
			var hasNewLatinWordStarted = false;
			var hasNewLatinWordEnded = false;
			var isStringEndBeingMet = false;
			var newLatinWordStart = 0;
			var newLatinWordEnd = 0;

			var c, isHan, isLatin, isLatinSplitter;

			for (var i = 0; i < string.length; i++) {
				c = string.charAt(i);

				isHan = charIsHanOrPunctuation(c);
				isLatin = charIsLatin(c);
				isLatinSplitter = charIsLatinPunctuation(c) || charIsLatinSpace(c);
				isStringEndBeingMet = i>=(string.length-1);

				var tempCheck = 0;
				if (isHan) tempCheck++;
				if (isLatin) tempCheck++;
				if (isLatinSplitter) tempCheck++;
				if (tempCheck!=1) {
					console.error('[tempCheck='+tempCheck+']: char:', c, '\t\tH:', isHan, '\tL:', isLatin, '\tS:', isLatinSplitter);
					isHan = false;
					isLatin = false;
					isLatinSplitter = true;
				}

				if (isHan) {
					hanChars.push(c);
					// console.log('汉字或汉语标点', hanChars);
				}

				if (isLatinSplitter) {
					splitters.push(c);
					// console.log('----- splitter -----', splitters);
				}

				if (isLatin) {
					hasNewLatinWordStarted = true;
					hasNewLatinWordEnded = false;
					if (isStringEndBeingMet) {
						newLatinWordEnd = string.length;
						hasNewLatinWordEnded = true;
					}
				}

				if (!isLatin) {
					if (hasNewLatinWordStarted) {
						// console.log('[', i, '] char:', c, 'is not latin');
						hasNewLatinWordEnded = true;
						newLatinWordEnd = i;
					} else {
						newLatinWordStart = i+1;
					}

					hasNewLatinWordStarted = false;
				}

				if (hasNewLatinWordEnded) {
					hasNewLatinWordEnded = false;
					newLatinWord = string.substring(newLatinWordStart, newLatinWordEnd);
					latinWords.push(newLatinWord);
					// console.log('\tso the newLatinWord is:['+newLatinWordStart+'-'+newLatinWordEnd+']', newLatinWord);
					newLatinWordStart = i+1;
				}
			}


			counts.latinWords = latinWords.length;
			counts.hanChars = hanChars.length;
			counts.spcaesAndLatinPunctuations = splitters.length;
			counts.allTerms = counts.hanChars + counts.latinWords;
			counts.all = counts.hanChars + counts.latinWords + counts.spcaesAndLatinPunctuations;

			return counts;
		}

		return count(string);
	};

	utilities.getFileExtensionViaFileName = function (fileName) {
		var ext = '';
		if (typeof fileName != 'string') return ext;
		var lastDotIndex = fileName.lastIndexOf('.');
		if (lastDotIndex > 0) {
			ext = fileName.slice(lastDotIndex+1);
		}

		return ext;
	};

	utilities.generateMailToUrl = function (mailSubject, mailBody, recipients) {
		// http://www.textfixer.com/html/email-html-code.php
		if (!mailSubject) {
			mailSubject = '';
		} else {
			mailSubject = encodeURIComponent(mailSubject)
				// .replace(/\"/g, '%22')
				// .replace(/&/g,  '%26')
				// .replace(/=/g,  '%3D')
				// .replace(/\?/g, '%3F')
				// .replace(/\s+/g, '%20')
				// .replace(/:/g, '%3A')
			;
		}

		if (!mailBody) {
			mailBody = '';
		} else {
			mailBody = encodeURIComponent(mailBody)
				// .replace(/\n/g, '%0A')
				// .replace(/&/g,  '%26')
				// .replace(/\?/g, '%3F')
				// .replace(/\s+/g, '%20')
				// .replace(/:/g, '%3A')
				// .replace(/</g, '%3C')
				// .replace(/>/g, '%3E')
			;
		}

		if (!recipients) {
			recipients = '';
		}

		var urlMailTo = 'mailto:'+ recipients + utilities.jsonToUrlParameters({
			subject: mailSubject,
			body: mailBody
		});

		return urlMailTo;
	};

	utilities.jsonToUrlParameters = function(json, shouldEncodeURIComponent) {
		json = json || {};
		shouldEncodeURIComponent = !!shouldEncodeURIComponent;

		var parametersUrl = '';
		var i=0;

		for (var key in json) {
			parametersUrl += key + '=' + (shouldEncodeURIComponent ? encodeURIComponent(json[key]) : json[key]) + '&';
			i++;
		}
		parametersUrl = parametersUrl.slice(0,-1);
		if (i>0) {
			parametersUrl = '?' + parametersUrl;
		}
		return parametersUrl;
	};

	utilities.evaluateUrlParameters = function () {
		var h = window.location.href;
		var p; // fisrt position of '?' and then parameters sub string
		var s; // position of '#'
		var json = {};
		var i, pair;

		p = h.indexOf('\?');
		if (p<0) return json;

		s = h.indexOf('#');
		if (s<p) s = h.length; // incase '#' comes before '?', which is illegal, but we are still trying to handle that

		p = h.slice(p+1,s);
		p = p.split('&');
		for (i = 0; i < p.length; i++) {
			pair = p[i].split('=');
			if (pair[0].length===0) continue;
			if (pair.length===1) pair.push('');
			var value = pair[1];
			var _temp;
			if (typeof value === 'string') {
				_temp = value.replace(/^\s/, '').replace(/\s$/, '').toLowerCase();
				if (_temp === 'true') value = true;
				if (_temp === 'false') value = false;
			}
			// _temp = parseFloat(value); // Might get wrong value!
			// if (!isNaN(_temp)) value = _temp;
			json[pair[0]] = value;
		}

		this.urlParameters = json;
		return json;
	};

	utilities.jumpToUrl = function(url, parametersJson) {
		url += this.jsonToUrlParameters(parametersJson);
		window.location.assign(url);
	};

	utilities.evaluateRgbArrayOfAColor = function (color) {
		var tempDiv = document.createElement('DIV');
		tempDiv.style.color = color;
		var rgbArray = tempDiv.style.color.toLowerCase().replace(/^rgb\(/, '').replace(/\)$/,'').split(/,\s*/);
		rgbArray = rgbArray.concat([0,0,0]).slice(0,3);
		rgbArray.forEach(function (element,i,a) {
			element = parseInt(element);
			a[i] = isNaN(element) ? 0 : element;
		});
		return rgbArray;
	};

	utilities.copyTextToClipboard = function(textToCopy) {
		if (!textToCopy) return false;
		if (window.clipboardData) {
			// old IE
			window.clipboardData.setData('Text', textToCopy);

			return true;
		} else if (utilities.env.ua.firefox) {
			// old FireFox
			try {
				var str   = Components.classes['@mozilla.org/supports-string;1']    .createInstance(Components.interfaces.nsISupportsString);
				var trans = Components.classes['@mozilla.org/widget/transferable;1'].createInstance(Components.interfaces.nsITransferable);
				var clip  = Components.classes['@mozilla.org/widget/clipboard;1']   .getService(clipid);
			} catch (e) {
				alert('Your browser does not support clipboard accessing.');
				return false;
			}

			str.data  = textToCopy;
			trans.addDataFlavor('text/unicode');
			trans.setTransferData('text/unicode', str, textToCopy.length*2);

			var clipid = Components.interfaces.nsIClipboard;
			clip.setData(trans, null, clipid.kGlobalClipboard);

			return true;
		} else {
			// chrome, safari and new IE
			var body = document.body;
			var copyFrom = document.createElement('textarea');

			copyFrom.style.position = 'fixed';
			copyFrom.style.left = '100%';
			copyFrom.textContent = textToCopy;

			body.appendChild(copyFrom);
			copyFrom.select();
			document.execCommand('copy');
			body.removeChild(copyFrom);
			return true;
		}
	};

	utilities.downloadFile = function(sUrl) {
		//http://pixelscommander.com/en/javascript/javascript-file-download-ignore-content-type/

		if (utilities.env.engine.webkit) {

			var link = document.createElement('a');
			link.href = sUrl;

			if (link.download !== undefined) {
				var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
				link.download = fileName;
			}

			if (document.createEvent) {
				var e = document.createEvent('MouseEvents');
				e.initEvent('click' ,true ,true);
				link.dispatchEvent(e);
				return true;
			}
		}

		var query = '?download';

		window.open(sUrl + query);
	};

	utilities.readImageFileIntoDataUrl = function (imageFile, onLoadHandler){
		if (!imageFile) return null;
		if (typeof onLoadHandler !== 'function') {
			e('No event handler provided for an image file reader, while reading', imageFile.name);
			return null;
		}
		var reader = new FileReader();
		reader.onload = onLoadHandler;
		reader.readAsDataURL(imageFile);
	};

	utilities.Promises = function(initActions, onAddNewPromisesBegin, onAddNewPromisesEnd) {
		this.actions = [];
		this.hasBeenFulfilled = false;
		this.onAddNewPromisesBegin = undefined;
		this.onAddNewPromisesEnd = undefined;
		if (typeof onAddNewPromisesBegin === 'function') this.onAddNewPromisesBegin = onAddNewPromisesBegin;
		if (typeof onAddNewPromisesEnd   === 'function') this.onAddNewPromisesEnd   = onAddNewPromisesEnd;

		this.reset = function() {
			this.hasBeenFulfilled = false;
		};

		this.promise = function(thisObject, callback, privateOptions, times, shouldAddPromiseQuietly, shouldTrace) {
			shouldAddPromiseQuietly = !!shouldAddPromiseQuietly;
			if (typeof callback !== 'function') return this;
			if (typeof thisObject !== 'object') thisObject = null;
			var action = {
				callback: callback,
				thisObject: thisObject,
				times: Math.max(1, parseInt(times)),
				privateOptions: privateOptions
			};

			if (this.hasNo(action)) {
				if (typeof onAddNewPromisesBegin === 'function' && !shouldAddPromiseQuietly) this.onAddNewPromisesBegin();
				this.actions.push(action);
				if (this.hasBeenFulfilled) {
					this.execute(action);
				}
				if (typeof onAddNewPromisesEnd === 'function' && !shouldAddPromiseQuietly) this.onAddNewPromisesEnd();
			}

			action.shouldTrace = !!shouldTrace;
			return this;
		};
		
		this.should = this.promise;
		this.then = this.promise;

		this.cancel = function(thisObject, callback, times, shouldTrace) {
			// if (!!shouldTrace) l('canceling action/callback for ',times,'times');
			if (typeof callback !== 'function') return this;
			if (typeof thisObject !== 'object') thisObject = null;
			var action = {
				callback: callback,
				thisObject: thisObject,
				times: Math.max(1, parseInt(times))
			};
			
			var matchedIndex = this.indexOf(action);
			if (matchedIndex > -1) {
				var matchedAction = this.actions[matchedIndex];
				var remainedTimes = matchedAction.times - action.times;
				if (isNaN(remainedTimes) || remainedTimes===0) {
					this.actions.splice(matchedIndex, 1);
				} else {
					matchedAction.times = remainedTimes;
				}
			}

			return this;
		};

		this.hasNo = function(action) {
			return this.indexOf(action) < 0;
		};

		this.find = function(action) {
			var matchedIndex = this.indexOf(action);
			var matchedItem;
			if (matchedIndex > -1) return this.actions[matchedIndex];
			return undefined;
		};

		this.indexOf = function(targetAction) {
			if (typeof targetAction === 'function') {
				targetAction = {
					callback: targetAction,
					thisObject: null
				};
			} else if (targetAction && typeof targetAction.callback === 'function') {
				if (typeof targetAction.thisObject !== 'object') targetAction.thisObject = null;
			} else {
				return -1;
			}

			for (var _a=0; _a<this.actions.length; _a++) {
				var action = this.actions[_a];
				if (action.callback === targetAction.callback
					&& action.thisObject === targetAction.thisObject
				) {
					return _a;
				}
			}

			return -1;
		};

		this.fulfill = function(commonOptions, shouldTrace) {
			shouldTrace = !!shouldTrace;
			this.hasBeenFulfilled = true;
			// if ((true || !!shouldTrace) && this.actions.length) l('===== fulfill', this.actions.length, 'actions.');
			var actionsToExecute = [].concat(this.actions);
			for (var _a=0; _a<actionsToExecute.length; _a++) this.execute(actionsToExecute[_a], commonOptions, shouldTrace);
			// if ((true || !!shouldTrace) && this.actions.length) l('After executing all actions, actions remianed:',this.actions.length);
		};

		this.execute = function(action, commonOptions, shouldTrace) {
			shouldTrace = !!shouldTrace || !!action.shouldTrace;
			shouldTrace = true;
			// if (!action || typeof action.callback !== 'function') return false;
			// if (!!shouldTrace) e('action.privateOptions:', action.privateOptions, '\ncommonOptions:', commonOptions, '\ncallback:', action.callback, '\nthisObject', action.thisObject);
			if (!action.thisObject) {
				action.callback(action.privateOptions, commonOptions);
			} else {
				action.callback.call(action.thisObject, action.privateOptions, commonOptions);
			}
			// if (!!shouldTrace) l('"action.times" isNaN?',isNaN(action.times));
			if (!isNaN(action.times)) this.cancel(action.thisObject, action.callback, 1, shouldTrace);
		};

		this.promise(initActions);
	};

	utilities.Conditions = function(initConditions) {
		this.conditions = [
			// {
				// name: non-empty unique string for later query
				// isSatisfied: boolean,
				// shouldTestRepeatedly: boolean<default=true>, evaluate only once before this {Conditions} object is reset
				// updater: function that returns a boolean value,
				// thisObject: this for the updater, default is null
			// }
		];

		this.allSatisfiedStatusIsNowStable = false;
		this.onAddNewPromisesBegin = function() { this.whenSatisfied.reset(); this.whenUnsatisfied.reset(); };
		this.onAddNewPromisesEnd = function() { this.test(); };
		
		this.whenSatisfied =   new utilities.Promises([], this.onAddNewPromisesBegin.bind(this), this.onAddNewPromisesEnd.bind(this));
		this.whenUnsatisfied = new utilities.Promises([], this.onAddNewPromisesBegin.bind(this), this.onAddNewPromisesEnd.bind(this));
		
		this.reset = function() {
			this.whenSatisfied.reset();
			this.whenUnsatisfied.reset();
			for (var _c=0; _c<this.conditions.length; _c++) {
				var condition = this.conditions[_c];
				condition.isSatisfied = false;
			}
			this.allSatisfiedStatusIsNowStable = false; 
		};
		
		this._need = function(conditions) {
			if (!conditions) return this;
			
			if (!Array.isArray(conditions)) conditions = [conditions];
			var addedConditions = [];
			for (var _c=0; _c<conditions.length; _c++) {
				var condition = conditions[_c];
				if (typeof condition === 'object'
					&& typeof condition.updater === 'function'
					&& condition.name.length > 0
				) {
					if (typeof condition.thisObject !== 'object') condition.thisObject = null;

					condition.isSatisfied = !!condition.isSatisfied;
					condition.shouldTestRepeatedly = !!condition.shouldTestRepeatedly;

					if (this.hasNo(condition)) addedConditions.push(condition);
				} else {
					continue;
				}
				
			}

			this.conditions = this.conditions.concat(addedConditions);
			return addedConditions;
		};

		this.need = function(conditions) {
			var addedConditions = this._need(conditions);
			// if (addedConditions.length > 0) {
			// 	this.allSatisfiedStatusIsNowStable = false;
			// 	this.test();
			// };
			return this;
		};

		this.needAndTest = function(conditions) {
			var addedConditions = this._need(conditions);
			if (addedConditions.length > 0) {
				this.allSatisfiedStatusIsNowStable = false;
				this.test();
			}
			return this;
		};
		
		this.remove = function(conditions) {
			// If conditions is an empty array, this method won't do anything.
			if (!conditions) return this;
				
			if (!Array.isArray(conditions)) conditions = [conditions];
			var removedConditions = [];
			for (var _c=0; _c<conditions.length; _c++) {
				var condition = conditions[_c];
				if (typeof condition === 'function') {
					condition = {
						updater: condition,
						thisObject: this.onwer
					};
				} else if (condition && typeof condition.updater === 'function') {
					if (typeof condition.thisObject !== 'object') condition.thisObject = null;
				} else {
					continue;
				}
				var matchedIndex = this.indexOf(condition);
				if (matchedIndex > -1) {
					removedConditions.push(this.conditions.splice(matchedIndex,1));
				}
			}
			
			if (removedConditions.length > 0 && !this.allSatisfiedStatusIsNowStable) this.test();
			return this;
		};

		this.hasNo = function(condition) {
			return this.indexOf(condition) < 0;
		};

		this.find = function(condition) {
			var matchedIndex = this.indexOf(condition);
			var matchedItem;
			if (matchedIndex > -1) return this.conditions[matchedIndex];
			return undefined;
		};

		this.indexOf = function(targetCondition) {
			if (typeof targetCondition === 'function') {
				targetCondition = {
					name: undefined,
					updater: targetCondition,
					thisObject: null
				};
			} else if (typeof targetCondition === 'string') {
				if (targetCondition.length < 1) return -1;
				targetCondition = {
					name: targetCondition,
					updater: undefined,
					thisObject: null
				};
			} else if (typeof targetCondition === 'object') {
				if (typeof targetCondition.updater !== 'function') targetCondition.updater = undefined;
				if (typeof targetCondition.name !== 'string' || targetCondition.name.length<1) targetCondition.name = undefined;
				if (!targetCondition.updater && !targetCondition.name) return -1;
				if (typeof targetCondition.thisObject !== 'object') targetCondition.thisObject = null;
			} else {
				return -1;
			}

			for (var _c=0; _c<this.conditions.length; _c++) {
				var condition = this.conditions[_c];
				if (targetCondition.updater) {
					if (   condition.updater === targetCondition.updater
						&& condition.thisObject === targetCondition.thisObject
						// && condition.name === targetCondition.name
					) {
						return _c;
					}
				} else {
					if (condition.name === targetCondition.name) {
						return _c;
					}
				}
			}

			return -1;
		};

		this.set = function(targetCondition, status, shouldTrace) {
			// if (!!shouldTrace) l('Conditions.set("'+targetCondition+'", status:', status, ')');
			var matchedItem = this.find(targetCondition);
			if (matchedItem) {
				var oldStatus = matchedItem.isSatisfied;
				var newStatus = oldStatus;
				if (matchedItem.thisObject) {
					newStatus = matchedItem.updater.call(matchedItem.thisObject, status);
				} else {
					newStatus = matchedItem.updater(status);
				}
				matchedItem.isSatisfied = !!newStatus;
				if (shouldTrace) {
					// l('Conditions.set("'+targetCondition+'",',status,')\tstatus changed?', oldStatus != matchedItem.isSatisfied);
				}

				if (oldStatus != matchedItem.isSatisfied) {
					this.test(!!shouldTrace);
				}
			}
		};
		this.update = this.set;

		this.test = function(shouldTrace) {
			// if (!!shouldTrace) l('testing...\tFirst, allSatisfiedStatusIsNowStable?', this.allSatisfiedStatusIsNowStable);
			if (this.allSatisfiedStatusIsNowStable) {
				// if (!!shouldTrace) l('fulfilling whenSatisfied...');
				this.whenSatisfied.fulfill({}, shouldTrace);
				return true;
			}
			
			var allConditionsAreSatisfied = true;
			var noConditionsShouldTestRepeatedly = true;
			for (var _c=0; _c<this.conditions.length; _c++) {
				var condition = this.conditions[_c];
				if (condition.shouldTestRepeatedly) noConditionsShouldTestRepeatedly = false;
				if (condition.shouldTestRepeatedly || !condition.isSatisfied) {
					condition.isSatisfied = !!condition.updater.call(condition.thisObject);
					if (!condition.isSatisfied) allConditionsAreSatisfied = false;
				}
			}
			
			// if (true || !!shouldTrace) l('Conditions.allConditionsAreSatisfied?', allConditionsAreSatisfied, '\nConditions.conditions', this.conditions);
			if (allConditionsAreSatisfied) {
				if (noConditionsShouldTestRepeatedly) this.allSatisfiedStatusIsNowStable = true;
				this.whenSatisfied.fulfill();
			} else {
				this.whenUnsatisfied.fulfill();
			}
			return allConditionsAreSatisfied;
		};

		this.log = function() {
			var _log = [];
			for (var i = 0; i < this.conditions.length; i++) {
				_log.push(this.conditions[i].isSatisfied);
			}
			l(_log.join());
		};
		
		this.need(initConditions);
	};

	utilities.cookie = {
		has: function (itemName) {
			var c = document.cookie;
			if (c.length===0) { return false; }
			return (c.indexOf( itemName + '=') >= 0);
		},

		get: function (itemName) {
			var c = document.cookie;
			if (!itemName) return c;

			var v = ''; // value

			var start = c.indexOf( itemName + '=');
			if (start < 0) return v;

			start += itemName.length+1;
			var end = c.indexOf(';', start);
			if (end == -1) end = c.length;

			v = c.substring(start, end);
			var vDecoded = decodeURI(v);
			// l(v, vDecoded);

			return vDecoded;
		},

		set: function (itemName, itemValue, itemExpireDays) {
			var c = document.cookie;

			var itemExpiers = '';

			itemExpireDays = parseFloat(itemExpireDays);
			if (!isNaN(itemExpireDays) && itemExpireDays > 0) {
				itemExpireDays = itemExpireDays * 1000 * 3600 * 24;
				var expireDate = new Date();
				expireDate.setTime(expireDate.getTime() + itemExpireDays);
				itemExpiers = ';expires=' + expireDate.toGMTString();
			}

			var item = itemName + '=' + encodeURI( itemValue ) + itemExpiers;

			document.cookie = item; // Do NOT use alias 'c' here!
			return item;
		}
	};

	utilities.BrowserAddressBarController = function() {
		this.replaceUrlWith = function(newHref, shouldReplaceCurrentHistoryStep, statusObject) {
			if (typeof newHref !== 'string' || !newHref) return false;

			var oldHref = window.location.href;
			if (oldHref === newHref) return oldHref;

			var H = window.history;
			if (!H || typeof H.pushState !== 'function' || typeof H.replaceState !== 'function') return false;

			if (!shouldReplaceCurrentHistoryStep) {
				H.pushState(statusObject, '', newHref);
			} else {
				H.replaceState(statusObject, '', newHref);
			}

			return newHref;
		};
		this.setHash = function(hash, status) {
			if (typeof status !== 'object' || !status) {
				status = {};
			}

			var origin = window.location.origin;
			var pathName = window.location.pathname;
			var search = window.location.search;

			hash = hash.replace(/^\s*#/, '');

			var newHref = origin + pathName + search + '#' + hash;
			return this.replaceUrlWith(newHref, true, status);
		};
		this.removeHash = function(status) {
			if (typeof status !== 'object' || !status) {
				status = {};
			}

			var origin = window.location.origin;
			var pathName = window.location.pathname;
			var search = window.location.search;

			var newHref = origin + pathName + search;
			return this.replaceUrlWith(newHref, true, status);
		};
		this.changeUrlParameters = function(newUrlParameters, options) {
			options = options || {};
			options.shouldRemoveHash = !!options.shouldRemoveHash;

			var shouldClearAllUrlParameters =
				typeof newUrlParameters !== 'object'
				|| !newUrlParameters
				|| !!options.shouldClearAllUrlParameters
			;

			var key;


			var _newPCount = 0;
			for (key in newUrlParameters) {
				var valueType = typeof newUrlParameters[key];
				if (valueType === 'function' || (valueType === 'object' && newUrlParameters[key] !== null)) {
					continue;
				}
				_newPCount++;
			}
			shouldClearAllUrlParameters = shouldClearAllUrlParameters || _newPCount === 0;


			if (typeof options.status !== 'object' || !options.status) {
				options.status = {};
			}

			var origin = window.location.origin;
			var pathName = window.location.pathname;
			var hash = options.shouldRemoveHash ? '' : window.location.hash;

			var oldUrlParametersString = window.location.search;
			var newUrlParametersString = '';
			// l('shouldClearAllUrlParameters', shouldClearAllUrlParameters, JSON.stringify(newUrlParametersString));
			if (!shouldClearAllUrlParameters) {
				var mergedUrlParameters = {};
				utilities.migratePropertiesFrom.call(mergedUrlParameters, window.location.urlParameters);
				utilities.migratePropertiesFrom.call(mergedUrlParameters, newUrlParameters);
				for (key in mergedUrlParameters) {
					var value = mergedUrlParameters[key];
					if (
						typeof value === 'undefined'
						|| typeof value === 'function'
						|| (typeof value === 'object' && value !== null) // null value is allowed
					) {
						delete mergedUrlParameters[key];
					}
				}

				newUrlParametersString = utilities.jsonToUrlParameters(mergedUrlParameters);
			}

			var urlParametersWillBeChange = oldUrlParametersString !== newUrlParametersString;
			// l('urlParametersWillBeChange', urlParametersWillBeChange, '\n\told:',oldUrlParametersString, '\n\tnew:',newUrlParametersString, '\n\n');
			var somethingWillChange = urlParametersWillBeChange
				|| (options.shouldRemoveHash && !!hash)
			;

			// l('somethingWillChange', somethingWillChange);
			if (!somethingWillChange) {
				return false;
			}

			if (urlParametersWillBeChange) {
				window.location.urlParameters = mergedUrlParameters;
				if ($F && $F.app && $F.app.commonData) $F.app.commonData.urlParameters = window.location.urlParameters;
				utilities.migratePropertiesFrom.call(options.status, window.location.urlParameters);
			}
			
			// l('options.shouldReplaceCurrentHistoryStep', options.shouldReplaceCurrentHistoryStep);
			var newHref = origin + pathName + newUrlParametersString + hash;
			return this.replaceUrlWith(newHref, !!options.shouldReplaceCurrentHistoryStep, options.status);
		};
	};
})(window.sidlynk);


(function ($F) { // utilities: part 3: dom tools
	var utilities = $F.utilities;

	utilities.domTools = new (function DomTools() {
		window.qS = document.querySelector.bind(document);
		window.qSA = document.querySelectorAll.bind(document);

		window.isDomNode = _isDomNode;
		window.isDomElement = _isDomElement;
		window.isDom = _isDom;

		this.isDomNode = _isDomNode;
		this.isDomElement = _isDomElement;
		this.isDom = _isDom;
		this.prepare = _prepare;

		// $ fallback to qS
		if (!(window.jQuery || window.Zepto)) {
			window.$ = function(e) {
				if (typeof e === 'string') {
					e = qS(e);
				}
				if (_isDom(e)) {
					_prepare(e);
					return e;
				}
				return undefined;
			};
		}


		// _isDomNode() & _isDomElement()
		// http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
		function _isDomNode(o){
			return (
				typeof Node === 'object' ? o instanceof Node : 
				o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName==='string'
			) || o === window;
		}
		function _isDomElement(o){
			return (
				typeof HTMLElement === 'object' ? o instanceof HTMLElement : //DOM2
				o && typeof o === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName==='string'
			);
		}

		function _isDom(o) {
			return _isDomNode(o) || _isDomElement(o);
		}

		function display(shouldShow, duration) {
			var shouldDisableTransition = false;

			if ( (window.jQuery || window.Zepto) ) {
				if (typeof duration !== 'string') duration = parseFloat(duration);
				if (isNaN(duration)) duration = 333;

				if (duration<=0) {
					shouldDisableTransition = true;
				} else {
					(function($) {
						if (shouldShow) {
							$(this).fadeIn(duration);
						} else {
							$(this).fadeOut(duration);
						}
					}).call(this, window.jQuery || window.Zepto );
				}
			} else {
				var _safeDelay = 80;
				duration = Math.max(0, parseFloat(duration)-_safeDelay);
				if (isNaN(duration)) duration = 333 - _safeDelay;

				if (duration<=0) {
					shouldDisableTransition = true;
				} else {
					var _oldInlineTransitionDefinition = this.style.transition;
					this.style.transition = 'opacity ' + (duration/1000)+'s' + ' ease-in-out';

					if (shouldShow) {
						this.on('transitionend', function(e) {
							this.style.transition = '';
							this.style.opacity = '';
							this.style.display = ''; //in case user quickly clicks hideButton during fading in.
							this.off('transitionend');
							this.style.transition = _oldInlineTransitionDefinition;
						});

						this.style.opacity = 0;
						this.style.display = '';
						setTimeout(
							(function () {
								this.style.opacity = 1;
							}).bind(this),
							_safeDelay
						);
					} else {
						this.on('transitionend', function(e) {
							this.style.transition = '';
							this.style.opacity = '';
							this.style.display = 'none';
							this.off('transitionend');
							this.style.transition = _oldInlineTransitionDefinition;
						});

						this.style.opacity = 1;
						setTimeout(
							(function () {
								this.style.opacity = 0;
							}).bind(this),
							_safeDelay
						);
					}
				}
			}

			// l('shouldDisableTransition', shouldDisableTransition, duration, this);
			if (shouldDisableTransition) {
				if (shouldShow) {
					this.style.display = '';
				} else {
					this.style.display = 'none';
				}
			}
		}

		function _prepare(element) {
			if (!isDomElement(element)) {
				return undefined;
			}

			if (element.isPrepared) {
				return element;
			}

			if (typeof element.eventTokens != 'object') element.eventTokens = {};

			var _supportedTypes = [
				'click',
				'dblclick',
				'focus',
				'blur',
				'change',
				'submit',
				'mousedown',
				'mouseup',
				'mousemove',
				'touchstart',
				'touchend',
				'touchmove',
				'keydown',
				'webkitTransitionEnd', // http://gotofritz.net/blog/howto/css3-transitions-callbacks/
				'transitionend',
				'animationstart',
				'animationend',
				'webkitAnimationStart',
				'webkitAnimationEnd'
			];

			for (var _i=0; _i<_supportedTypes.length;_i++) {
				var _type = _supportedTypes[_i];
				if (typeof element.eventTokens[_type] != 'object') element.eventTokens[_type] = {};
				if (!Array.isArray(element.eventTokens[_type].__default__)) element.eventTokens[_type].__default__ = [];
			}

			element.isPrepared = true;
			return element;
		}


		Element.prototype.qS = function () { return this.querySelector.apply(this, arguments); };
		Element.prototype.qSA = function () { return this.querySelectorAll.apply(this, arguments); };

		Element.prototype.die = function () {
			this.parentNode.removeChild(this);
		};

		Element.prototype.getData = function(datasetName, convert) {
			var _result = this.getAttribute('data-'+datasetName);

			if (typeof convert === 'string' && convert) {
				switch (convert) {
					case 'i':
					case 'int':
					case 'integer':
						_result = parseInt(_result); break;

					case 'scalar':
					case 'f':
					case 'float':
						_result = parseFloat(_result); break;

					case 'b':
					case 'bool':
					case 'boolean':
						_result = _result.toLowerCase() === 'true'; break;

					default:
				}
			}

			return (_result == null ? undefined : _result );
		};

		Element.prototype.setData = function(datasetName, value) {
			if (datasetName.search(/^data\-\w/)<0) datasetName = 'data-'+datasetName;
			if (value == null) {
				this.removeAttribute(datasetName);
			} else {
				this.setAttribute(datasetName, value);
			}
		};

		Element.prototype.setRole = function(role) {
			this.setAttribute('role', role);
		};

		Element.prototype.isChildOf = function (parentDom, recursive) {
			recursive = !!recursive;
			if (parentDom === window) return recursive;
			var isChild = false;

			var arr_dom_allChildren = parentDom.childNodes;
			if (recursive) {
				arr_dom_allChildren = parentDom.querySelectorAll('*');
			}

			for (var i = 0; i < arr_dom_allChildren.length; i++) {
				isChild = this === arr_dom_allChildren[i];
				if (isChild) break;
			}
			return isChild;
		};

		Element.prototype.show = function(duration) {
			if (duration === true) duration = 0;
			display.call(this, true, duration);
		};

		Element.prototype.hide = function(duration) {
			if (duration === true) duration = 0;
			display.call(this, false, duration);
		};




		function _getTokensFromEventName(eventName) {
			var _i = eventName.indexOf('.');
			var _eventType = _i<0 ? eventName : eventName.slice(0,_i);
			var _token = '';
			if (_i>=0) {
				_token = eventName.slice(_i+1);
			}

			return {
				eventType: _eventType,
				token: _token
			};

		}

		Element.prototype.on = function(eventName, eventHandler, useCapture) {
			if (typeof eventHandler != 'function') {
				e('Invalid eventHandler!');
			}

			_prepare(this);
			var _t = _getTokensFromEventName(eventName);

			if (!this.eventTokens[_t.eventType] && false) {
				// e('Event Type: "'+_t.eventType+'" is NOT supported.');
			} else {
				if (_t.token) {
					this.eventTokens[_t.eventType][_t.token] = eventHandler;
				} else {
					this.eventTokens[_t.eventType]['__default__'].push(eventHandler);
				}
				this.addEventListener(_t.eventType, eventHandler, useCapture);
			}
		};

		Element.prototype.off = function(eventName, eventHandler, useCapture) {
			_prepare(this);
			var _t = _getTokensFromEventName(eventName);

			if (!this.eventTokens[_t.eventType]) {
				e('Event Type: "'+_t.eventType+'" is NOT supported.');
			} else {



				if (_t.token) {

					var _fetchedHandler = this.eventTokens[_t.eventType][_t.token];

					if (_fetchedHandler === eventHandler || typeof eventHandler != 'function') {

						this.removeEventListener(_t.eventType, _fetchedHandler, useCapture);
						this.eventTokens[_t.eventType][_t.token] = undefined;
						delete this.eventTokens[_t.eventType][_t.token];

					} else {
						// Strange
						e('When tyring removing an event handler, user provides an event handler, as well as a token to fetch an event handler. But they are NOT equal.');
						return;
					}

				} else {

					for (var _liToken in this.eventTokens[_t.eventType]) {

						var _handler = this.eventTokens[_t.eventType][_liToken];
						var _matched = false;
						
						if (_handler === this.eventTokens[_t.eventType].__default__) {

							for (var _liDefault = 0; _liDefault < this.eventTokens[_t.eventType].__default__.length; _liDefault++) {
								var _defaulthandler = this.eventTokens[_t.eventType].__default__[ _liDefault ];

								_matched = typeof eventHandler !== 'function' || _defaulthandler === eventHandler;
								if (_matched) {
									this.removeEventListener(_t.eventType, _defaulthandler, useCapture);
									this.eventTokens[_t.eventType].__default__.splice(_liDefault, 1);
									_liDefault--;
								}

							}

						} else {

							_matched = typeof eventHandler !== 'function' || _handler === eventHandler;
							if (_matched) {
								this.removeEventListener(_t.eventType, _handler, useCapture);
								this.eventTokens[_t.eventType][_liToken] = undefined;
								delete this.eventTokens[_t.eventType][_liToken];
							}

						}
					}
				}


			}
		};

		Element.prototype.centerTo = function (options) {
			// options = {
			//		centerRef:			Object <default=document.documentElement>
			//							centerRef can ONLY be eigher one of below:
			//								1) the document.documentElement Object
			//									note:
			//										window.innerWidth includes the width of vertical scollbar, if any;
			//										body.clientHeight means the height of the entire content, include the overflowing part.
			//								2) the nearest parentNode whose position is among 'relative', 'absolute' and 'fixed'
			//
			//		alongX:				boolean <default=true>
			//		alongY:				boolean <default=true>
			//		offsetX:			Number <default=0>
			//		offsetY:			Number <default=0>
			//
			//		shrinkWhenNeeded:	boolean <default=false>
			//
			//		minMarginTop:		Number <default=15>
			//		minMarginRight:		Number <default=15>
			//		minMarginBottom:	Number <default=15>
			//		minMarginLeft:		Number <default=15>
			// };

			// Sample:
			//		document.getElementById('myElement').centerTo();
			//		// means 'myElement' center to window in both X and Y axes.

			var computedStyle = window.getComputedStyle(this, null);
			if (computedStyle.position === 'static') {
				w(this, '\nThe element is about to be centered, but it\'s "position" attribute is "static".' );
			}


			var _ = options || {};
			// var _defaultRef = document.documentElement;
			var _defaultRef = window;

			if (!_isDom(_.centerRef) ) {
				_.centerRef = _defaultRef;
			} else {
				if (
					_.centerRef == document.documentElement ||
					_.centerRef == document ||
					_.centerRef == document.body ||
					_.centerRef == window
				) {
					_.centerRef = _defaultRef;
				} else {
					// do nothing
				}
			}

			_.alongX = (typeof _.alongX === 'undefined') ? true : !!_.alongX;
			_.alongY = (typeof _.alongY === 'undefined') ? true : !!_.alongY;
			_.shrinkWhenNeeded = (typeof _.shrinkWhenNeeded === 'undefined') ? true : !!_.shrinkWhenNeeded;
			_.offsetX = isNaN(Number(_.offsetX)) ? 0 : Number(_.offsetX);
			_.offsetY = isNaN(Number(_.offsetY)) ? 0 : Number(_.offsetY);

			_.minMarginTop =	isNaN(Number(_.minMarginTop))		? 15 : Number(_.minMarginTop);
			_.minMarginRight =	isNaN(Number(_.minMarginRight))		? 15 : Number(_.minMarginRight);
			_.minMarginBottom =	isNaN(Number(_.minMarginBottom))	? 15 : Number(_.minMarginBottom);
			_.minMarginLeft =	isNaN(Number(_.minMarginLeft))		? 15 : Number(_.minMarginLeft);

			// l('_.centerRef:',_.centerRef);

			if (_.alongX) {
				var selfWidth = parseInt( computedStyle.width );
				var refWidth = _.centerRef === window ? _.centerRef.innerWidth : _.centerRef.clientWidth;
				// l('refWidth:',refWidth,'px\n','selfWidth:',selfWidth,'px\n','_.offsetX:',_.offsetX,'px\n');
				var left = NaN;

				if (_.shrinkWhenNeeded) {
					var selfPaddingHori = parseInt( computedStyle.paddingLeft ) + parseInt( computedStyle.paddingRight );
					var selfBordersHori = parseInt( computedStyle.borderLeftWidth ) + parseInt( computedStyle.borderRightWidth );
					if (typeof this.computedWidthBeforeCenterTo === 'undefined') {
						this.computedWidthBeforeCenterTo = selfWidth;
						this.computedWidthComesFromInlineDefinition = this.style.width.NE;
					} else {
						// always try to use original value
						selfWidth = this.computedWidthBeforeCenterTo;
					}

					var maxAllowedWidth = refWidth - _.minMarginLeft - _.minMarginRight - selfPaddingHori - selfBordersHori;

					if ( selfWidth>maxAllowedWidth ) { // camparing everytime this method being called, in case the container could have changed
						selfWidth = maxAllowedWidth;
						this.style.width = maxAllowedWidth + 'px';
					} else {
						// restore original settings
						if (this.computedWidthBeforeCenterTo) {
							this.style.width = this.computedWidthComesFromInlineDefinition ? (this.computedWidthBeforeCenterTo+'px') : '';
						}
					}

					left = (refWidth - _.minMarginLeft - _.minMarginRight - selfWidth) / 2 + _.offsetX + _.minMarginLeft;
				} else {
					left = (refWidth - _.minMarginLeft - _.minMarginRight - selfWidth) / 2 + _.offsetX + _.minMarginLeft;
				}

				this.style.left = left + 'px';
				this.style.marginLeft = '0';
				this.style.marginRight = '0';
			}

			if (_.alongY) {
				var selfHeight = parseInt( computedStyle.height );
				var refHeight = _.centerRef === window ? _.centerRef.innerHeight : _.centerRef.clientHeight;
				// l('refHeight:',refHeight,'px\n','selfHeight:',selfHeight,'px\n','_.offsetY:',_.offsetY,'px\n');
				var top = NaN;

				if (_.shrinkWhenNeeded) {
					var selfPaddingVert = parseInt( computedStyle.paddingTop ) + parseInt( computedStyle.paddingBottom );
					var selfBordersVert = parseInt( computedStyle.borderTopWidth ) + parseInt( computedStyle.borderBottomWidth );
					if (typeof this.computedHeightBeforeCenterTo === 'undefined') {
						this.computedHeightBeforeCenterTo = selfHeight;
						this.computedHeightComesFromInlineDefinition = this.style.height.NE;
					} else {
						// always try to use original value
						selfHeight = this.computedHeightBeforeCenterTo;
					}

					var maxAllowedHeight = refHeight - _.minMarginTop - _.minMarginBottom - selfPaddingVert - selfBordersVert;

					if ( selfHeight>maxAllowedHeight ) { // camparing everytime this method being called, in case the container could have changed
						selfHeight = maxAllowedHeight;
						this.style.height = maxAllowedHeight + 'px';
					} else {
						// restore original settings
						if (this.computedHeightBeforeCenterTo) {
							this.style.height = this.computedHeightComesFromInlineDefinition ? (this.computedHeightBeforeCenterTo+'px') : '';
						}
					}

					top = (refHeight - _.minMarginTop - _.minMarginBottom - selfHeight) / 2 + _.offsetY + _.minMarginTop;
				} else {
					top = (refHeight - _.minMarginTop - _.minMarginBottom - selfHeight) / 2 + _.offsetY + _.minMarginTop;
				}
				this.style.top = top + 'px';
				this.style.marginTop = '0';
				this.style.marginBottom = '0';
			}

			return { width: selfWidth, height: selfHeight, left: left, top: top };
		};

		Element.prototype.clearCenterTo = function() {
			this.style.margin = '';
			this.style.left = '';
			this.style.top = '';
		};

		if (Object.defineProperty) {
			Object.defineProperty(Element.prototype, 'realStyle', {
				get: function () { return window.getComputedStyle(this, null); }
			});

			Object.defineProperty(Element.prototype, 'cssMatrix', {
				get: function () {
					var oStyle = this.realStyle;
					var cssMatrixString = '';
					var cssMatrix = null;

					if (cssMatrixString.length < 1 && oStyle['transform'])            cssMatrixString = oStyle['transform'];
					if (cssMatrixString.length < 1 && oStyle['-webkit-transform'])    cssMatrixString = oStyle['-webkit-transform'];
					if (cssMatrixString.length < 1 && oStyle['-moz-transform'])       cssMatrixString = oStyle['-moz-transform'];

					if (!cssMatrixString || cssMatrixString.toLowerCase() == 'none') {
						cssMatrix = [];
					} else {
						eval( 'var cssMatrix = [' + cssMatrixString.slice( 'matrix('.length, -1 ) + '];' );
					}

					return cssMatrix;
				}
			});

			Object.defineProperty(Element.prototype, 'realWidth', {
				get: function () { return this.realStyle.width; }
			});

			Object.defineProperty(Element.prototype, 'realHeight', {
				get: function () { return this.realStyle.height; }
			});

			Object.defineProperty(Element.prototype, 'realLeft', {
				get: function () { return this.realStyle.left; }
			});

			Object.defineProperty(Element.prototype, 'realTop', {
				get: function () { return this.realStyle.top; }
			});

			Object.defineProperty(Element.prototype, 'real2DRotationAngle', {
				get: function () {
					var cssMatrix = this.cssMatrix;
					if (cssMatrix.length < 2) return 0;
					var angle = Math.atan2( cssMatrix[0], cssMatrix[1] ) / Math.PI * -180 + 90;
					angle = angle<0 ? angle+360 : angle;
					return angle;
				}
			});
		}
	});

	utilities.setRole = function(el, role) {
		el.setAttribute('role', role);
	};

	utilities.getRole = function(el) {
		if (!el) return '';
		return el.getAttribute('role');
	};

	utilities.enable = function(el, shouldShow, shouldFocus) { // button or input or textarea or select
		if (!el || typeof el.removeAttribute !== 'function') {
			e('Invalid element to enable');
			return false;
		}
		el.removeAttribute('disabled');
		el.disabled = false;
		if (el.hasAttribute('contentEditable')) el.setAttribute('contentEditable', true);
		if (shouldShow) el.show(0);
		if (!!shouldShow && !!shouldFocus) el.focus();
	};

	utilities.disable = function(el, shouldHide) { // button or input or textarea or select
		if (!el || typeof el.setAttribute !== 'function') {
			e('Invalid element to disable');
			return false;
		}
		el.setAttribute('disabled', '');
		el.disabled = true;
		el.blur();
		if (el.hasAttribute('contentEditable')) el.setAttribute('contentEditable', false);
		if (shouldHide) el.hide(0);
	};

	utilities.getValueFromHiddenInput = function(selector, convert, shouldDeleteInputEvenIfValueIsInvalid) {
		var temp = {};
		temp.input = qS(selector);
		var value = '';
		var destroyInputDom = true;
		if (temp.input && (temp.input.value || !!shouldDeleteInputEvenIfValueIsInvalid)) {
			value = temp.input.value;
			if (destroyInputDom) {
				temp.input.parentNode.removeChild(temp.input);
				delete temp.input;
			}
		}

		if (typeof convert === 'string') {
			switch (convert) {
				case 'i':
				case 'int':
				case 'integer':
					value = parseInt(value); break;

				case 'scalar':
				case 'f':
				case 'float':
					value = parseFloat(value); break;

				case 'b':
				case 'bool':
				case 'boolean':
					value = value.toLowerCase() === 'true'; break;

				case 's':
				case 'str':
				case 'string':
				default:
			}
		}

		return value;
	};

	utilities.applyAnimationCssClassOnce = function(el, cssClassToApply, shouldNotInterruptCurrentAnimation, displayMode) {
		if (!(el instanceof Node)) {
			e('Element to animate is not found.');
			return false;
		}

		var that = this;

		var availableCssClassNames = [
			'fade-in-and-dash-leftwards-and-then-fade-out',
			'fade-in-and-dash-leftwards-and-then-fade-out-quickly',
			'fade-in-and-rise-and-then-fade-out',
			'fade-in-and-rise-and-then-fade-out-quickly',
			'fade-in-and-dash-leftwards',
			'fade-in-and-rise',
			'borders-blink-for-error'
		];

		if (!displayMode) displayMode = 'block';

		var temp = parseInt(cssClassToApply);
		if (!isNaN(temp)) {
			cssClassToApply = availableCssClassNames[temp];
		} else if (typeof cssClassToApply === 'string') {
			// use it as is
		} else {
			cssClassToApply = availableCssClassNames[0];
		}


		shouldNotInterruptCurrentAnimation = !!shouldNotInterruptCurrentAnimation;



		var elLogName = '[data-subject="'+el.getData('subject')+'"]';
		el.isRunningAnimation = !!el.isRunningAnimation;





		// l('\n');
		// l(elLogName);


		// l('\tis animating:', el.isRunningAnimation, el.isRunningAnimation ? ' \tshould wait for it:' : '', el.isRunningAnimation ? shouldNotInterruptCurrentAnimation : '');
		if (shouldNotInterruptCurrentAnimation && el.isRunningAnimation) {
			return false;
		}


		if (el.isRunningAnimation) {

			// l('\tstop animation in half way');
			this.stopAnimationCausedByCssClassFor(el, _onElementAnimationEnd, true, displayMode);
			window.setTimeout((function () {
				// l('\n re-apply animation: "'+cssClassToApply+'"');
				this.applyAnimationCssClassOnce(el, cssClassToApply, shouldNotInterruptCurrentAnimation, displayMode);
				// l('class: "'+el.className+'"');
			}).bind(this), 70);

		} else {

			// l('\tapply animation: "'+cssClassToApply+'"');
			el.isRunningAnimation = true;
			if (!el.hasAssignedAniamtionEventHandler) {
				// e('======> setting event handler', elLogName);
				if (utilities.env.engine.webkit) {
					el.on('webkitAnimationEnd', _onElementAnimationEnd);
				} else {
					el.on('animationend', _onElementAnimationEnd);
				}
				el.hasAssignedAniamtionEventHandler = true;
			}

			// l(el);
			// l('\tSetting display mode to "'+displayMode+'"');
			el.style.display = displayMode;
			el.classList.add(cssClassToApply);
			el.runningAnimationCssClassToApply = cssClassToApply;

		}



		function _onElementAnimationEnd(event) {
			// e('***Event***:', event.type,':',event.target.getData('info-subject'));
			// l('\t_onElementAnimationEnd '+elLogName);
			// l('\t"'+el.runningAnimationCssClassToApply+'"');
			that.stopAnimationCausedByCssClassFor(el, _onElementAnimationEnd, false, '');
			el.hasAssignedAniamtionEventHandler = false;
			// l('class: "'+el.className+'"');
		}
	};

	utilities.stopAnimationCausedByCssClassFor = function(el, handler, isInHalfWay, displayMode) {
		// l('--> stop animation caused by "'+el.runningAnimationCssClassToApply+'"');
		// l('class: "'+el.className+'"');

		if (isInHalfWay) {
			setTimeout(function () {
				// l('+++++++++++', displayMode);
				el.style.display = displayMode;
			}, 250);
			setTimeout(function () {
				// l('+++++++++++', displayMode);
				el.style.display = displayMode;
			}, 500);
		} else {
			// l('\tRemove display mode');
			el.style.display = '';
			// e('===',!!isInHalfWay,'===> removing event handler');

			if (utilities.env.engine.webkit) {
				el.off('webkitAnimationEnd', handler);
			} else {
				el.off('animationend', handler);
			}
		}

		el.classList.remove(el.runningAnimationCssClassToApply);
		el.isRunningAnimation = false;
		// l('class: "'+el.className+'"');
	};

	utilities.highlightInvalidInput = function(el, shouldNotInterruptCurrentAnimation) {
		this.applyAnimationCssClassOnce(el, 'borders-blink-for-error', shouldNotInterruptCurrentAnimation);
	};

	utilities.promptInvalidInput = function(inputOrDummy, infoRoot, cssNameForInfoRoot) {
		if (inputOrDummy) this.highlightInvalidInput(inputOrDummy);
		if (infoRoot) this.applyAnimationCssClassOnce(infoRoot, cssNameForInfoRoot, false);
	};

	utilities.ExpandableElementsManager = function(initElements) {
		// how to use:
		//	var myManager = new utilities.ExpandableElementsManager(<some elements here>);
		//	myManager.toggle(<an element>);

		this.elements = [];

		var _expansionStatusExpanded  = 'expanded';
		var _expansionStatusCollapsed = 'collapsed';

		this.process = function (elements) {
			// [ dom, dom, dom ]

			// [ dom, { dom: dom, expandedAtBegining: true }, dom ]

			// [
			//   { dom: dom, expandedAtBegining: true },
			//   { dom: dom, expandedAtBegining: true },
			//   dom
			// ]

			if ($ && elements instanceof $) {
				elements = Array.prototype.slice.apply(elements);
			}

			if (!Array.isArray(elements)) elements = [elements];

			for (var _e = 0; _e < elements.length; _e++) {
				var el = elements[_e];

				if (!el) continue;

				var elIsValid = true;

				if (typeof el === 'string') {
					el = Array.prototype.slice.apply(document.querySelectorAll(el));
					this.process(el);

					continue;
				}

				if (utilities.domTools.isDom(el)) {
					el = { dom: el, expandedAtBegining: false };
				} else {
					if (!utilities.domTools.isDom(el.dom)) {
						elIsValid = false;
					} else {
						el.expandedAtBegining = !!el.expandedAtBegining;
					}
				}

				if (!elIsValid) continue;

				var dom = el.dom;
				if (dom.hasAlreaySetupAsAnExpandableElement) continue;
				dom.hasAlreaySetupAsAnExpandableElement = true;

				dom.setData('expandable', '');
				dom.setData('data-expansion-status', el.expandedAtBegining ? _expansionStatusExpanded : _expansionStatusCollapsed);
				dom.isCollapsing = false;
				dom.isExpanding = false;

				this.elements.push(dom);
			}
		};
		this.collapse = function (el, onCollapsingEnd) {
			if (!el) return false;


			el.isCollapsing = true;
			el.isExpanding = false;

			function onElementCollapsingEnd(event) {
				if (el.isCollapsing) {
					// l('onElementCollapsingEnd');

					el.style.textOverflow = '';
					el.style.whiteSpace = '';
					el.style.height = '';
					el.setData('expansion-status', _expansionStatusCollapsed);

					if (typeof onCollapsingEnd === 'function') {
						onCollapsingEnd.call(el, expandedHeight);
					}
				} else {
					// l('onElementCollapsingEnd - abandoned');
				}

				el.off('transitionend', onElementCollapsingEnd);
			}

			var expandedHeight = parseFloat(el.style.height);

			el.on('transitionend', onElementCollapsingEnd);

			el.style.textOverflow = 'inherit';
			el.style.whiteSpace = 'normal';

			// The collapsed height should be set in css file,
			// otherwise *WE* have no idea how tall *YOUR* element should be.
			el.style.height = '';
		};
		this.expand = function (el, onExpansionStart, onExpansionEnd) {
			if (!el) return false;

			el.isCollapsing = false;
			el.isExpanding = true;

			function onElementExpasionToFakeHeightEnd(event) {
				if (el.isExpanding) {
					// l('onElementExpasionToFakeHeightEnd');
					laterTransitionStartHeight = fakeExpandedHeight;
				} else {
					// l('onElementExpasionToFakeHeightEnd - abandoned');
				}

				el.expansionTransitionForSafariIsRunning = false;
				el.off('transitionend.expansionBeforeHand', onElementExpasionToFakeHeightEnd);
			}

			function onElementExpasionEnd(event) {
				if (el.isExpanding) {
					// l('onElementExpasionEnd');
					actionsOnElementExpasionEnd();
				} else {
					// l('onElementExpasionEnd - abandoned');
				}

				el.off('transitionend.expansion', onElementExpasionEnd);
			}

			function actionsOnElementExpasionEnd() {
				el.style.textOverflow = 'inherit';
				el.style.whiteSpace = 'normal';
				el.style.height = realExpandedHeight + 'px';
				el.setData('expansion-status', _expansionStatusExpanded);
				// el.style.height = '';

				if (typeof onExpansionEnd === 'function') {
					onExpansionEnd.call(el, expandedHeight, el.expandableElementsManagerDeltaHeight);
				}
			}

			function destroyTheClone() {
				elClone.parentNode.removeChild(elClone);
			}


			// bake the current height for css transition
			var originalRealStyle = el.realStyle;
			el.style.height = originalRealStyle['height'];
			el.expansionTransitionForSafariIsRunning = false;

			var collapsedHeight = parseFloat(originalRealStyle['height']);

			// save old value in case there is no need to expand at all,
			// for example the text inside of the el is very few
			var realExpandedHeight = collapsedHeight;

			// The start height for later transition, if any.
			// Since the iOS Safari requires earlier css transition,
			// which MIGHT ends before the later transition could start,
			// we will update this value when safati-transition ends,
			// to help us decide if it is necessary or not to start the later transition at all
			var laterTransitionStartHeight = collapsedHeight;


			var fakeExpandedHeight = parseFloat(el.expandableElementsManagerExpandedHeight);



			// make a clone to evaluate the expanded height, also for css transition
			var elClone = el.cloneNode(true);
			el.parentNode.appendChild(elClone);

			// should set the width for preserving the current shape of the cloned element
			elClone.style.width = originalRealStyle['width'];
			elClone.style.visibility = 'hidden';
			elClone.style.position = 'absolute';
			elClone.style.zIndex = -2;

			var clonedRealStyle = elClone.realStyle;

			elClone.setData('expansion-status', _expansionStatusExpanded);
			elClone.style.height = 'auto';



			// just for making sure the order of our codes is correct
			var timeoutDuration = 1;



			// iOS Safari takes a bit longer than other browsers to get the element prepared,
			// So lets start transition according to a stored expanedHeight before iOS has the el prepared
			// Although the stored height might be outdated and incorrect.
			// Note that the expandedHeight might change over time,
			// that's whay the expanedHeight used here could be incorrect.
			if (utilities.env.os.ios) {
				timeoutDuration = 543;

				var shouldHaveATry = !isNaN(fakeExpandedHeight);
				if (shouldHaveATry) {
					// l('Should have a try before ios is ready.');
					el.expansionTransitionForSafariIsRunning = true;
					el.on('transitionend.expansionBeforeHand', onElementExpasionToFakeHeightEnd);
					el.on('transitionend.expansion', onElementExpasionEnd);

					el.setData('expansion-status', _expansionStatusExpanded);
					el.style.height = fakeExpandedHeight + 'px';
				}
			}




			window.setTimeout(function () {
				// After a while, the expanded clone element should be ready,
				// This time the height should be REAL(so-called)
				realExpandedHeight = parseFloat(clonedRealStyle['height']);



				// add padding on necessary
				var paddingTopPlusBottom = 0;
				if (utilities.env.ua.ieModern) {
					// the box-sizing is border-box, when setting inline css height within IE, IE will treat the height as 'REAL' height
					paddingTopPlusBottom = parseFloat(clonedRealStyle['paddingTop']) + parseFloat(clonedRealStyle['paddingBottom']);
				}
				realExpandedHeight += paddingTopPlusBottom;





				// calculate the delta height for:
				//   1) checking out whether it is necessary or not to trigger a css transition
				//   2) for the argument of event handler
				var deltaHeight = realExpandedHeight - collapsedHeight;
				if (isNaN(deltaHeight)) {
					e('Weird! The deltaHeight is NaN. Now set it to zero.');
					deltaHeight = 0;
				} else {
					// l('deltaHeight', deltaHeight);
				}

				// maybe too late? Since the iOS Safari might require transition starting a lot earlier.
				// No better solution at present.
				if (typeof onExpansionStart === 'function') {
					// Besides, obviously this handler is invoked even if there are no transitions at all
					onExpansionStart.call(el, realExpandedHeight, deltaHeight);
				}






				var theFakeExpandedHeightHappensToBeAlmostCorrect = Math.abs(fakeExpandedHeight - realExpandedHeight) < 2;
				var realExpandedHeightIsAlmostTheSameAsCurrentHeight = Math.abs(laterTransitionStartHeight - realExpandedHeight) < 2;

				var noMoreTransitionNeededAtAll = false;




				if (el.expansionTransitionForSafariIsRunning) {
					noMoreTransitionNeededAtAll = theFakeExpandedHeightHappensToBeAlmostCorrect;
				} else {
					noMoreTransitionNeededAtAll = realExpandedHeightIsAlmostTheSameAsCurrentHeight;
				}




				if (noMoreTransitionNeededAtAll) {
					if (!el.expansionTransitionForSafariIsRunning) {
						actionsOnElementExpasionEnd();
					}
				} else {
					if (!el.expansionTransitionForSafariIsRunning) {
						el.on('transitionend.expansion', onElementExpasionEnd);
					}

					el.setData('expansion-status', _expansionStatusExpanded);
					el.style.height = realExpandedHeight + 'px';



					el.expandableElementsManagerExpandedHeight = realExpandedHeight;
					el.expandableElementsManagerDeltaHeight    = deltaHeight;
				}



				destroyTheClone();
			}, timeoutDuration
			);
		};
		this.toggle = function (el, onExpansionStart, onExpansionEnd, onCollapsingEnd) {
			if (!el) return false;
			if (el.getData('expansion-status') === _expansionStatusExpanded) {
				this.collapse(el, onCollapsingEnd);
			} else {
				this.expand(el, onExpansionStart, onExpansionEnd);
			}
		};

		this.process(initElements);
	};

	utilities.ScrollingToBottomDetector = function(initOptions) {
		initOptions = initOptions || {};

		this.data = {
			disabled: false,
			isWaitingForATimeGap: false
		};

		this.options = {
			pixelTolerance: 20,
			timeGapBetweenLoading: 999
		};

		this.elements = {};

		this.disable = function () {
			this.data.disabled = true;
			$(this.elements.container).off('scroll.ScrollingToBottomDetector');
		};
		this.enable = function () {
			this.data.disabled = false;
			$(this.elements.container).on('scroll.ScrollingToBottomDetector', this.data.wrappedEventHandlerBackup);
		};
		this.onServedContainerScrolling = function (event) {
			if (this.data.disabled) return false;
			var el = this.elements;
			var _r = el.contentRoot;
			var _c = el.container;
			var detectorBottom  = _r.getBoundingClientRect().bottom;
			var containerBottom = (_c===window) ? window.innerHeight : _c.getBoundingClientRect().bottom;

			var tolerance = this.options.pixelTolerance;
			// l('container', containerBottom, '\tdetector', detectorBottom,  '\ttolerance', tolerance);
			if ((detectorBottom + tolerance) <= containerBottom) {
				this.trigger();
			}
		};
		this.trigger = function () {
			if (this.data.isWaitingForATimeGap) {
				return false;
			}
			this.data.isWaitingForATimeGap = true;

			window.setTimeout((function () {
				this.data.isWaitingForATimeGap = false;
			}).bind(this), this.options.timeGapBetweenLoading);

			if (typeof this.onTrigger === 'function') this.onTrigger();
		};
		this.onTrigger = undefined;

		return (function (_o) {
			var _r = _o.contentRoot;
			var _c = _o.container;

			if (!utilities.domTools.isDom(_r)) {
				e('Try building a <ScrollingToBottomDetector>: The content root is not a valid dom!');
				return undefined;
			}

			if (!utilities.domTools.isDom(_c)) {
				w('Try building a <ScrollingToBottomDetector>: The container is not a valid dom! Take the window object as container.');
			} else {
				if (!_r.isChildOf(_c, true)) {
					e(
						'Try building a <ScrollingToBottomDetector>: The content root is not a child of the container.',
						'\ncontentRoot:', _r,
						'\ncontainer:', _c
					);
					return undefined;
				}
			}

			var el = this.elements;
			el.contentRoot = _r;
			el.container = _c;

			_o.pixelTolerance = parseFloat(_o.pixelTolerance);

			if (_o.hasOwnProperty('disabled')) this.data.disabled = !!_o.disabled;

			if (!isNaN(_o.pixelTolerance)) this.options.pixelTolerance = _o.pixelTolerance;
			if (typeof _o.onTrigger === 'function') this.onTrigger = _o.onTrigger;

			this.data.wrappedEventHandlerBackup = this.onServedContainerScrolling.bind(this);
			this.enable();
			return this;
		}).call(this, initOptions);
	};

	utilities.HtmlTemplate = function(templateDom) {
		var children = templateDom.childNodes;
		var firstChildOfNodeType1 = null;

		for (var _c = 0; _c < children.length; _c++) {
			if (children[_c].nodeType === 1) {
				firstChildOfNodeType1 = children[_c];
				break;
			}
		}

		templateDom.parentNode.removeChild(templateDom);
		if (firstChildOfNodeType1) {
			templateDom.removeChild(firstChildOfNodeType1); // this line is for IE11, or may ealier versions too
			templateDom.innerHTML = '';
			templateDom.appendChild(firstChildOfNodeType1);
			this.html = templateDom.innerHTML;
			this.html = this.html
				.replace(/>\s+</g, '><')
				.replace(/<!--[\s|\S]*-->/g, '')
			;
		} else {
			delete this.name;
			return null;
		}

		this.name = templateDom.getData('template-name');

		this.createInstance = function (actions, shouldReturnHtmlString) {
			var newInstanceHtml = this.html;
			shouldReturnHtmlString = !!shouldReturnHtmlString;

			if (typeof actions === 'function') {
				newInstanceHtml = actions(newInstanceHtml);
			}

			if (shouldReturnHtmlString) return newInstanceHtml;

			var tempRoot = document.createElement('DIV');
			tempRoot.innerHTML = newInstanceHtml;
			var questionDom = tempRoot.firstChild;

			return questionDom;
		};
	};
	utilities.HtmlTemplatesCollection = function(treeRootElement) {
		this.templates = {};

		if (isDom(treeRootElement)) {
			this.scanningRoot = treeRootElement;
		} else {
			this.scanningRoot = document.documentElement;
		}

		var templatesDomCollection = this.scanningRoot.qSA('[role="template"]');
		for (var _t = 0; _t < templatesDomCollection.length; _t++) {
			var template = new utilities.HtmlTemplate(templatesDomCollection[_t]);
			if (template && template.name) {
				this.templates[template.name] = template;
			}
		}

		this.get = function (templateName) {
			return this.templates[templateName];
		};
	};

	utilities.MultiLevelSelectLists = function(rootDom, data, levelDepth, initOptions, initBuildingSelectsOptions) {
		levelDepth = parseInt(levelDepth);
		if (!isDom(rootDom)) {
			e('Invalid rootDom for a {MultiLevelSelectLists} object!');
			return undefined;
		}

		if (rootDom.multiLevelSelectListsController) {
			e('The rootDom is already a root for existing {MultiLevelSelectLists} object!');
			return undefined;
		}
		rootDom.multiLevelSelectListsController = this;

		if (isNaN(levelDepth) || levelDepth < 0 || levelDepth > 50) {
			e('Invalid levelDepth for a {MultiLevelSelectLists} object! It must be an integer inside [1, 50].');
			return undefined;
		}



		this.elements = {
			root: rootDom,
		};

		this.data = data || {};

		this.options = {
			shouldDisableDefaultValuesWhenDirty: true,
			defaultValueOfNoSelection: '-',
			defaultLabelOfNoSelection: '-',
			defaultAllowNoSelection:   true,
			dataStructureIsPlane:      true
		};

		this.allLevelsOptions = {
			shownDepth: levelDepth,
			processDepth: levelDepth,
			eachLevel: {
				dom:                  [],
				desiredValue:         [],
				defaultValue:         [],
				allowNoSelection:     [],
				valueOfNoSelection:   [],
				labelOfNoSelection:   [],
				dataStructureIsPlane: []
			}
		};

		this.buildOneEmptySelect = function (rootDom, thisLevel, options) {
			// please override this method
			var sel = document.createElement('SELECT');
			sel.setData('selection-level', thisLevel);
			return sel;
		};

		this.selectDomOnChange = function (rootDom, thisLevel, event) {
			// please override this method
			// l('--> hi! level', thisLevel, 'changed just now!');
		};

		this.selectDomOnChangeInternalAction = function(rootDom, thisLevel, event) {
			var levelHasNotBeenChanged = [];
			var domsArray = this.allLevelsOptions.eachLevel.dom;
			var desiredValues = [];

			for (var i = 0; i < thisLevel; i++) {
				levelHasNotBeenChanged[i] = true;
				desiredValues[i] = domsArray[i].value;
			}

			desiredValues[thisLevel] = domsArray[thisLevel].value;

			if (typeof this.selectDomOnChange === 'function') this.selectDomOnChange(rootDom, thisLevel, event);
			this.refresh(desiredValues, levelHasNotBeenChanged);
		};

		this.config = function(o) {
			o = o || {};
			var oAL = this.allLevelsOptions;
			var oEL = oAL.eachLevel;

			if (o.hasOwnProperty('defaultValueOfNoSelection') && typeof o.defaultValueOfNoSelection === 'string')
				this.options.defaultValueOfNoSelection = o.defaultValueOfNoSelection;

			if (o.hasOwnProperty('defaultLabelOfNoSelection') && typeof o.defaultLabelOfNoSelection === 'string')
				this.options.defaultLabelOfNoSelection = o.defaultLabelOfNoSelection;



			if (o.hasOwnProperty('shouldDisableDefaultValuesWhenDirty'))
				this.options.shouldDisableDefaultValuesWhenDirty = !!o.shouldDisableDefaultValuesWhenDirty;

			if (o.hasOwnProperty('defaultAllowNoSelection'))
				this.options.defaultAllowNoSelection = !!o.defaultAllowNoSelection;



			if (o.hasOwnProperty('data') && typeof o.defaultLabelOfNoSelection === 'object')
				this.options.data = o.data;

			if (Array.isArray(o.eachLevelDefaultValue))         oEL.defaultValue         = o.eachLevelDefaultValue;
			if (Array.isArray(o.eachLevelAllowNoSelection))     oEL.allowNoSelection     = o.eachLevelAllowNoSelection;
			if (Array.isArray(o.eachLevelValueOfNoSelection))   oEL.valueOfNoSelection   = o.eachLevelValueOfNoSelection;
			if (Array.isArray(o.eachLevelLabelOfNoSelection))   oEL.labelOfNoSelection   = o.eachLevelLabelOfNoSelection;
			if (Array.isArray(o.eachLevelDataStructureIsPlane)) oEL.dataStructureIsPlane = o.eachLevelDataStructureIsPlane;



			if (o.hasOwnProperty('buildOneEmptySelect')) {
				if (typeof o.buildOneEmptySelect === 'function') {
					this.buildOneEmptySelect = o.buildOneEmptySelect;
				} else {
					w('Invalid buildOneEmptySelect() method for a {MultiLevelSelectLists} object! Ignored.');
				}
			}

			if (o.hasOwnProperty('selectDomOnChange')) {
				if (typeof o.selectDomOnChange === 'function') {
					this.selectDomOnChange = o.selectDomOnChange;
				} else {
					w('Invalid selectDomOnChange() handler for a {MultiLevelSelectLists} object! Ignored.');
				}
			}
		};

		this.build = function(o) {
			o = o || {};

			var rootDom = this.elements.root;
			var depth = this.allLevelsOptions.processDepth;
			var domsArray = this.allLevelsOptions.eachLevel.dom;

			var i, selectDom;

			rootDom.isDirty = false;

			for (i = 0; i < domsArray.length; i++) {
				selectDom = domsArray[i];
				selectDom.parentNode.removeChild(selectDom);
			}


			domsArray = [];
			for (i = 0; i < depth; i++) {
				selectDom = this.buildOneEmptySelect(rootDom, i, o);
				if (isDom(selectDom) && selectDom.nodeName.toUpperCase() === 'SELECT') {
					rootDom.appendChild(selectDom);
					domsArray.push(selectDom);

					selectDom.onchange = this.selectDomOnChangeInternalAction.bind(this, rootDom, i);
				} else {
					throw new Error('MultiLevelSelectLists.buildOneEmptySelect(rootDom, i, o) method does not return a vaild select element.');
				}
			}
			this.allLevelsOptions.eachLevel.dom = domsArray;

			var oEL = this.allLevelsOptions.eachLevel;

			var tO = this.options;
			makeArrayValid(oEL.desiredValue,         depth, '');
			makeArrayValid(oEL.defaultValue,         depth, tO.defaultValueOfNoSelection);
			makeArrayValid(oEL.allowNoSelection,     depth, tO.defaultAllowNoSelection);
			makeArrayValid(oEL.valueOfNoSelection,   depth, tO.defaultValueOfNoSelection);
			makeArrayValid(oEL.labelOfNoSelection,   depth, tO.defaultLabelOfNoSelection);
			makeArrayValid(oEL.dataStructureIsPlane, depth, tO.dataStructureIsPlane);

			this.refresh(o.desiredValues, null, true, o.isDirty);
		};

		this.die = function(shouldDeleteSelectDomsAlso) {
			shouldDeleteSelectDomsAlso = !!shouldDeleteSelectDomsAlso;
			var domsArray = this.allLevelsOptions.eachLevel.dom;

			for (var i = 0; i < domsArray.length; i++) {
				var selectDom = domsArray[i];
				selectDom.onchange = null;
				if (shouldDeleteSelectDomsAlso) {
					selectDom.parentNode.removeChild(selectDom);
				}
			}

			if (shouldDeleteSelectDomsAlso) {
				domsArray = [];
			}

			delete this.elements.root.multiLevelSelectListsController;
		};

		this.refresh = function(desiredValues, levelHasNotBeenChanged, forceToRebuildAllLevels, isDirty, shownDepth) {
			var oAL = this.allLevelsOptions;
			var oEL = oAL.eachLevel;
			var depth = oAL.processDepth;



			if (Array.isArray(desiredValues)) {
				oEL.desiredValue = makeArrayValid(desiredValues, depth, '');
			}



			if (!Array.isArray(levelHasNotBeenChanged)) levelHasNotBeenChanged = [];
			for (var i=levelHasNotBeenChanged.length; i<depth; i++) levelHasNotBeenChanged[i] = false;
			oEL.hasNotBeenChanged = levelHasNotBeenChanged;



			oAL.forceToRebuildAllLevels = !!forceToRebuildAllLevels;
			isDirty = !!isDirty;



			if (shownDepth != undefined) {
				shownDepth = parseInt(shownDepth);
				if (!isNaN(shownDepth) || shownDepth >= 0) {
					oAL.shownDepth = Math.min(depth, shownDepth);
				}
			}




			var rootDom = this.elements.root;

			if ((rootDom.isDirty || isDirty) && this.options.shouldDisableDefaultValuesWhenDirty) {
				oEL.defaultValue = [].concat(oEL.valueOfNoSelection);
			}

			rootDom.isDirty = true;



			var initLevelOptions = {
				dataArray:                      this.data,
				level:                          0,
				doesNotExist:                   false,
				parentLevelHasBeenRebuilt:      false,
				parentLevelNothingSelected:     false,
				parentLevelValueHasBeenChanged: false
			};

			recursivelyBuildAll(oAL, initLevelOptions);
		};

		this.config(initOptions);
		this.build(initBuildingSelectsOptions);

		function makeArrayValid(array, length, defaultValue) {
			if (!Array.isArray(array)) array = [];
			length = parseInt(length);
			if (isNaN(length) || length<=0) return array;
			if (typeof defaultValue === 'undefined') return array;

			for (var i = 0; i < length; i++) {
				var v = array[i];
				if (typeof v === 'undefined') array[i] = defaultValue;
			}

			if (array.length>length) array = array.slice(0, length);
			return array;
		}
		function recursivelyBuildAll(allLevelsOptions, thisLevelOptions) {
			var oTL = thisLevelOptions;
			var oAL = allLevelsOptions;
			var level = oTL.level;
			if (level >= oAL.processDepth) {
				return level;
			}
			var deepestLevel = level;


			var oEL = oAL.eachLevel;

			var dom                  = oEL.dom[level];
			var desiredValue         = oEL.desiredValue[level];
			var defaultValue         = oEL.defaultValue[level];
			var dataStructureIsPlane = oEL.dataStructureIsPlane[level];
			var allowNoSelection     = oEL.allowNoSelection[level];
			var valueOfNoSelection   = oEL.valueOfNoSelection[level];
			var labelOfNoSelection   = oEL.labelOfNoSelection[level];
			var hasNotBeenChanged    = oEL.hasNotBeenChanged[level];



			var thisLevelDataArray = oTL.dataArray;
			var thisLevelDoesNotExist =
					oTL.doesNotExist
				||  oTL.parentLevelNothingSelected
				||  level >= oAL.shownDepth
				||  !Array.isArray(thisLevelDataArray)
				||  thisLevelDataArray.length<1
			;

			var oNL = { level: level+1 }; // options of next level

			if (thisLevelDoesNotExist) {
				// if parentLevel has NO sub level, then we should turn off (hide) all sub levels
				oNL.doesNotExist = true;
				deepestLevel = recursivelyBuildAll(oAL, oNL);
				dom.style.display = 'none';
				buildOptionsForOneSelectList(dom, [], true, allowNoSelection, valueOfNoSelection, labelOfNoSelection);
			} else {
				dom.style.display = '';

				var thisLevelShouldRebuilt = 
						oAL.forceToRebuildAllLevels
					||  oTL.parentLevelHasBeenRebuilt
					||  oTL.parentLevelValueHasBeenChanged
					||  dom.value !== desiredValue
					||  dom.value.length<1
				;

				if (thisLevelShouldRebuilt) {
					buildOptionsForOneSelectList(dom, thisLevelDataArray, dataStructureIsPlane, allowNoSelection, valueOfNoSelection, labelOfNoSelection);
					oNL.parentLevelHasBeenRebuilt = true;
				} else {
					oNL.parentLevelHasBeenRebuilt = false;
				}

				var oldValue = dom.value;
				var thisLevelActualCurrentSettings = updateCurrentValueOfOneSelectList(
					dom,
					thisLevelDataArray,
					desiredValue,
					defaultValue,
					dataStructureIsPlane,
					allowNoSelection,
					valueOfNoSelection
				);
				oTL.actualIndex  = thisLevelActualCurrentSettings.index;
				oTL.actualValue  = thisLevelActualCurrentSettings.value;
				oTL.actualCurrentData = thisLevelDataArray[thisLevelActualCurrentSettings.index];

				oNL.parentLevelValueHasBeenChanged = !hasNotBeenChanged || oldValue !== dom.value;

				if (thisLevelActualCurrentSettings.nothingSelected) {
					oNL.parentLevelNothingSelected = true;
					oNL.doesNotExist = true;
				} else {
					oNL.parentLevelNothingSelected = false;
					oNL.doesNotExist = false;
					oNL.dataArray = oTL.actualCurrentData[oTL.actualValue];
				}

				deepestLevel = recursivelyBuildAll(oAL, oNL);
			}

			return deepestLevel;
		}
		function buildOptionsForOneSelectList(selectDom, dataArray, dataStructureIsPlane, allowNoSelection, valueOfNoSelection, labelOfNoSelection) {
			var options = [];

			if (allowNoSelection) {
				options.push('<option value="'+valueOfNoSelection+'">'+labelOfNoSelection+'</option>');
			}

			var data, label, value;
			for (var i = 0; i < dataArray.length; i++) {
				data = dataArray[i];

				if (dataStructureIsPlane) {
					label = data;
				} else {
					label = Object.keys(data)[0];
				}

				value = label.toLowerCase();

				options.push('<option value="'+value+'">'+label+'</option>');
			}
			selectDom.innerHTML = options.join('');
		}
		function updateCurrentValueOfOneSelectList(selectDom, dataArray, desiredValue, defaultValue, dataStructureIsPlane, allowNoSelection, valueOfNoSelection) {
			var result = mapValueToJsonDataIndexForOneLevel(dataArray, selectDom.value, desiredValue, defaultValue, dataStructureIsPlane, allowNoSelection, valueOfNoSelection);

			if (allowNoSelection && result.index<0) {
				selectDom.value = valueOfNoSelection;
			} else {
				selectDom.value = result.value;
			}

			return {
				nothingSelected: selectDom.value === valueOfNoSelection,
				value: result.value,
				index: result.index
			};
		}
		function mapValueToJsonDataIndexForOneLevel(dataArray, currentValue, desiredValue, defaultValue, dataStructureIsPlane, allowNoSelection) {
			if (desiredValue) desiredValue = desiredValue.toLowerCase();
			if (defaultValue) defaultValue = defaultValue.toLowerCase();

			var safeValueIndex = 0;
			var safeValue;
			if (dataStructureIsPlane) {
				safeValue = dataArray[safeValueIndex];
			} else {
				safeValue = Object.keys(dataArray[0])[safeValueIndex];
			}


			var actualValue;
			var actualValueIndex = -1;
			var currentValueFound = false;


			var value;

			for (var i=0; i < dataArray.length; i++) {
				var data = dataArray[i];
				if (dataStructureIsPlane) {
					value = data;
				} else {
					value = Object.keys(data)[0];
				}

				value = value.toLowerCase();

				if (!currentValueFound && value===defaultValue) { // search for defaultValue, which might not exist at all
					actualValueIndex = i;
					actualValue = defaultValue;
				}

				if (value===currentValue) { // search for currentValue, which might be out of date
					currentValueFound = true;
					actualValueIndex = i;
					actualValue = currentValue;
				}

				if (value===desiredValue) { // search for desiredValue
					actualValueIndex = i;
					actualValue = value;
					break;
				}
			}

			if (actualValueIndex<0) {
				// l('none of these values are found: currentValue, desiredValue, defaultValue');
				if (!allowNoSelection) {
					actualValueIndex = safeValueIndex;
					actualValue = safeValue;
				}
			}

			// l('--> found: [', actualValueIndex, ']', actualValue);
			return {
				value: actualValue,
				index: actualValueIndex
			};
		}
	};

	utilities.PopupLayersManager = function(rootParent, initOptions) {
		// rootParent: a dom object,
		// initOptions: {
		//     shouldTakeRootAsLayersWrapElement: boolean,
		//     backplateShowingDuration: Number,
		//     backplateHidingDuration: Number
		//     selectors:{
		//         root:       string <default: '[role="popup-layers-container"]'>,
		//         layersWrap: string <default: '[role="popup-layers-container"] [role="popup-layers-wrap"]'>,
		//         backplate:  string <default: '[role="popup-layers-container"] [role="popup-layers-backplate"]'>
		//     }
		// };

		if (!isDom(rootParent)) {
			if (typeof rootParent === 'string') {
				rootParent = document.querySelector(rootParent);
			}

			if (!rootParent) {
				rootParent = document.body;
			}
		}

		var _thisPopupLayersManager = this;

		this.elements = {
			rootParent: rootParent,
			root: null,
			popupLayerWrap: null, // incase we don't want the root container to be the direct parentNode of all popup layers
			backplate: null
		};

		this.backplateIsShown = false;
		this.layers = [];
		this.shownLayers = [];

		this.options = {
			shouldTakeRootAsLayersWrapElement: false,
			backplateShowingDuration: 333,
			backplateHidingDuration: 333,

			shouldDelayUpdatingSizesAndPositions: true,
			onWaitingForWindowResizeIntervalDuration: 666,

			selectors: {
				root:       '[role="popup-layers-container"]',
				layersWrap: '[role="popup-layers-wrap"]',
				backplate:  '[role="popup-layers-backplate"]'
			}
		};

		this.status = {
			isWaitingForWindowResizeStop: false,
			intervalIndexOfWaitingForWindowResize: NaN
		};


		var _tryCreatingPopupWindowsContainer = function () {
			var el = this.elements;

			if (!el.root) { // we guess this must be the first try
				el.root = $(el.rootParent).find(' > '+this.options.selectors.root)[0];
			}
			if (!el.root) {
				el.root = document.createElement('DIV');
				el.root.setAttribute('role', 'popup-layers-container');
				el.rootParent.appendChild(el.root);
			}

			if (this.options.shouldTakeRootAsLayersWrapElement) {
				el.popupLayerWrap = el.root;
			} else {
				el.popupLayerWrap = el.root.querySelector(this.options.selectors.layersWrap);

				if (!el.popupLayerWrap) {
					el.popupLayerWrap = document.createElement('DIV');
					el.popupLayerWrap.setAttribute('role', 'popup-layers-wrap');
					el.root.appendChild(el.popupLayerWrap);
				}
			}

			if (!el.root.hasBeenInitialized) {
				el.root.hasBeenInitialized = true;
			}
		};

		var _tryCreatingBackplate = function (){
			var el = this.elements;

			_tryCreatingPopupWindowsContainer.call(this);

			if (!el.backplate) { // must be first try
				el.backplate = el.root.querySelector(this.options.selectors.backplate);
			}
			if (!el.backplate) {
				el.backplate = document.createElement('div');
				el.backplate.setAttribute('role', 'popup-layers-backplate');
				el.backplate.style.display = 'none';

				var firstChild = el.root.firstChild;
				if (firstChild) {
					el.root.insertBefore(el.backplate, firstChild);
				} else {
					el.root.appendChild(el.backplate);
				}
			}

			if (!el.backplate.hasBeenInitialized) {
				el.backplate.addEventListener('click', function () {
					var _shownLayers = _thisPopupLayersManager.shownLayers;
					if (_shownLayers.length>1 || (_shownLayers[0] && _shownLayers[0].options.hideOnBackplateClick === false)) {
						return false;
					}
					_thisPopupLayersManager.hideAllPopupLayers();
				});

				el.backplate.hasBeenInitialized = true;
			}
		};

		this.onWindowResize = function(event) {
			if (!!this.status.isWaitingForWindowResizeStop || this.status.intervalIndexOfWaitingForWindowResize) {
				return false;
			}
			this.status.isWaitingForWindowResizeStop = true;
			this.status.intervalIndexOfWaitingForWindowResize = window.setInterval(
				this.onWaitingForWindowResize.bind(this),
				this.options.onWaitingForWindowResizeIntervalDuration
			);

			this.doActionsAfterWaitingForWindowResize();
		};
		this.onWaitingForWindowResize = function() {
			// l('resizing slow interval occurs');
			this.status.isWaitingForWindowResizeStop = false;
			window.setTimeout(
				this.doActionsAfterWaitingForWindowResize.bind(this),
				this.options.onWaitingForWindowResizeIntervalDuration * 0.5
			);
		};
		this.doActionsAfterWaitingForWindowResize = function () {
			if (this.options.shouldDelayUpdatingSizesAndPositions) {
				if (this.status.isWaitingForWindowResizeStop) {
					return false;
				}
			}

			if (!isNaN(this.status.intervalIndexOfWaitingForWindowResize))
				window.clearInterval(this.status.intervalIndexOfWaitingForWindowResize);
			this.status.isWaitingForWindowResizeStop = false;
			this.status.intervalIndexOfWaitingForWindowResize = NaN;
			this.refreshAllPopupLayers();
		};

		this.createPopupLayer = function(rootElement, options) {
			_tryCreatingBackplate.call(this);
			var _newLayer = _createPopupLayer(rootElement, options);
			if (_newLayer) {
				this.layers.push(_newLayer);
				this.elements.popupLayerWrap.appendChild(_newLayer.elements.root);
			}
			return _newLayer;
		};

		this.showBackplate = function() {
			this.donNotHideBackplateSoQuickly = true;
			// l('A popup layer is going to show up. So don\'t hide the backplate so quickly!');
			if (!this.backplateIsShown) {
				this.elements.backplate.show(this.options.backplateShowingDuration);
				window.setTimeout((function () {
					// wait for the backplate to show up before any pending popup layers
					this.backplateIsShown = true;
					this.showAllPendingPopupLayers();
				}).bind(this), Math.min(200, this.options.backplateShowingDuration * 0.75));
			} else {
				this.showAllPendingPopupLayers();
			}
		};

		this.hideBackplate = function() {
			this.donNotHideBackplateSoQuickly = false;
			// l('Hide? Let\'s wait for a moment rather.');
			window.setTimeout((function () {
				if (this.backplateIsShown && !this.donNotHideBackplateSoQuickly) {
					// l('Ok, I\'ll hide.');
					this.elements.backplate.hide(this.options.backplateHidingDuration);
					this.backplateIsShown = false;
				} else {
					// l('See, no need to hide backplate, right?');
				}
			}).bind(this), 40);
		};

		this.hideAllPopupLayers = function() {
			this.shownLayers.forEach(function (popupLayer) { popupLayer.hide(); });
		};

		this.refreshAllPopupLayers = function() {
			this.shownLayers.forEach(function (popupLayer) { popupLayer.refresh(); });
		};

		this.pendForShowingPopupLayer = function(popupLayer, o) {
			if (!this.shownLayers.has(popupLayer)) {
				this.shownLayers.push(popupLayer);
				popupLayer.__o = o;
			}

			if (o.shouldShowBackplate) {
				this.showBackplate();
			} else {
				popupLayer.doShow();
			}
		};

		this.showAllPendingPopupLayers = function () {
			// we should delay showing pending popup layers,
			// because we should make sure that the backplate shows up before any popup layer does.
			// Especially when the backplae is the centerRef of any of these popup layers.
			for (var _L = 0; _L < this.shownLayers.length; _L++) {
				var popupLayer = this.shownLayers[_L];
				popupLayer.doShow();
			}
		};

		this.pendForHidingPopupLayer = function(popupLayer) {
			delete popupLayer.__o;
			this.shownLayers.del(popupLayer);
			var countOfLayersWhoRequireBackplate = 0;
			for (var _l = 0; _l < this.shownLayers.length; _l++) {
				if (this.shownLayers[_l].options.shouldShowBackplate) countOfLayersWhoRequireBackplate++;
			}
			if (countOfLayersWhoRequireBackplate < 1)
				this.hideBackplate();
		};


		(function (o) { // config
			o = o || {};
			o.selectors = o.selectors || {};
			var temp;

			if (o.hasOwnProperty('shouldTakeRootAsLayersWrapElement')) this.options.shouldTakeRootAsLayersWrapElement = !!o.shouldTakeRootAsLayersWrapElement;

			temp = parseFloat(o.backplateShowingDuration);
			if (!isNaN(temp)) this.options.backplateShowingDuration = temp;

			temp = parseFloat(o.backplateHidingDuration);
			if (!isNaN(temp)) this.options.backplateHidingDuration = temp;

			if (typeof o.selectors.root === 'string' && o.selectors.root.length > 0) this.options.selectors.root = o.selectors.root;
			if (typeof o.selectors.layersWrap === 'string' && o.selectors.layersWrap.length > 0) this.options.selectors.layersWrap = o.selectors.layersWrap;
			if (typeof o.selectors.backplate === 'string' && o.selectors.backplate.length > 0) this.options.selectors.backplate = o.selectors.backplate;

			window.addEventListener('resize', this.onWindowResize.bind(this));
		}).call(this, initOptions);


		function _createPopupLayer(rootElement, initOptions) {
			// options = {
			//		shouldBeCentered:		boolean		<default=true>
			//		centerRef:				can be any of:
			//									the document.documentElement Object
			//								or  the document Object,		which will be remapped to document.documentElement
			//								or  the window Object,			which will be remapped to document.documentElement
			//								or  the document.body Object,	which will be remapped to document.documentElement
			//								or	the parentNode Object
			//								or	String 'parent'
			//								or	String 'parentNode'
			//								<default=document.documentElement>
			//
			//		offsetX:				Number		<default=0, unit=px>, ONLY takes effects when shouldBeCentered is true
			//		offsetY:				Number		<default=0, unit=px>, ONLY takes effects when shouldBeCentered is true
			//
			//		showingDuration:		Number		<default=333, unit=ms>
			//		hidingDuration:	 		Number		<default=333, unit=ms>
			//
			//		shouldAutoHide:			boolean		<default=false>
			//		autoHideDelayDuration:	Number		<default=1500, unit=ms>, ONLY takes effects when shouldAutoHide is true
			//
			//		shouldShowBackplate:			boolean		<default=true>, could be OVERRIDED by argument of show() method, if that argument is provided.
			//		hideOnBackplateClick:	boolean		<default=false>
			//
			//		showButtons:			[ array of elements ]
			//		hideButtons:			[ array of elements ]
			//		toggleButtons:			[ array of elements ]
			//
			//		minMarginTop:			Number <default=15>
			//		minMarginRight:			Number <default=15>
			//		minMarginBottom:		Number <default=15>
			//		minMarginLeft:			Number <default=15>
				// }

			// this.buttonsWhoShowMe		is the getter that does same as			this.options.showButtons
			// this.buttonsWhoHideMe		is the getter that does same as			this.options.hideButtons
			// this.buttonsWhoToggleMe		is the getter that does same as			this.options.toggleButtons

			if (typeof rootElement === 'string') {
				rootElement = qS('[data-popup-layer-name="'+rootElement+'"]');
			}

			if (!utilities.domTools.isDom(rootElement)) {
				e('Invalid element for the rootElement of a {popupLayer} object.');
				return;
			}

			var _thisPopupLayer = {

				elements: {
					root: rootElement
				},
				logName: '{popupLayer "'+(rootElement.getData('popup-layer-name') || (rootElement.id ? ('#'+rootElement.id) : '<no id>'))+'"}',
				isShown: false,

				options: {
					shouldBeCentered: true,
					centerRef: window,
					offsetX: 0,
					offsetY: 0,

					minMarginTop: 20,
					minMarginRight: 20,
					minMarginBottom: 20,
					minMarginLeft: 20,
						
					showingDuration: 333,
					hidingDuration: 333,

					shouldAutoHide: undefined,
					autoHideDelayDuration: 1500,

					shouldShowBackplate: true,
					hideOnBackplateClick: false,

					showButtons: [],
					hideButtons: [],
					toggleButtons: []
				},

				config: function (options, _allowWarning) { _config.call(this, options, _allowWarning); },

				addShowButtons: function (elementsArray, _allowWarning) { return _addButtonsToArray.call(this, elementsArray, this.options.showButtons, _allowWarning); },
				addHideButtons: function (elementsArray, _allowWarning) { return _addButtonsToArray.call(this, elementsArray, this.options.hideButtons, _allowWarning); },
				addToggleButtons: function (elementsArray, _allowWarning) { return _addButtonsToArray.call(this, elementsArray, this.options.toggleButtons, _allowWarning); },
				removeShowButtons: function (elementsArray) { return _removeButtonsFromArray.call(this, elementsArray, this.options.showButtons); },
				removeHideButtons: function (elementsArray) { return _removeButtonsFromArray.call(this, elementsArray, this.options.hideButtons); },
				removeToggleButtons: function (elementsArray) { return _removeButtonsFromArray.call(this, elementsArray, this.options.toggleButtons); },
				clearShowButtons: function () { _clearButtonsInArray.call(this, 'showButtons'); },
				clearHideButtons: function () { _clearButtonsInArray.call(this, 'hideButtons'); },
				clearToggleButtons: function () { _clearButtonsInArray.call(this, 'toggleButtons'); },

				updateSizeAndPosition: function () { _updateSizeAndPosition.call(this); },
				refresh: function () { _refresh.call(this); },

				show: function (options) { _show.call(this, options); },
				hide: function () { _hide.call(this); },
				doShow: function () { _doShow.call(this); },
				toggle: function () { _toggle.call(this); },
				onShow: undefined,
				onHide: undefined
			};



			function _config(o, _allowWarning) {
				o = o || {};
				var _o = this.options;
				_allowWarning = (typeof _allowWarning === 'undefined') || !!_allowWarning;

				if (o.hasOwnProperty('onShow') && typeof o.onShow === 'function') this.onShow = o.onShow;
				if (o.hasOwnProperty('onHide') && typeof o.onHide === 'function') this.onHide = o.onHide;
				if (o.hasOwnProperty('onRelocateEnd') && typeof o.onRelocateEnd === 'function') this.onRelocateEnd = o.onRelocateEnd;

				if (o.hasOwnProperty('shouldBeCentered')) { _o.shouldBeCentered = !!o.shouldBeCentered; }
				if (o.hasOwnProperty('shouldAutoHide')) { _o.shouldAutoHide = !!o.shouldAutoHide; }
				if (o.hasOwnProperty('shouldShowBackplate')) {
					_o.shouldShowBackplate = !!o.shouldShowBackplate;
				} else {
					if (typeof _o.shouldAutoHide != 'undefined') {
						_o.shouldShowBackplate = !_o.shouldAutoHide;
					}
				}

				if (o.hasOwnProperty('hideOnBackplateClick')) {
					_o.hideOnBackplateClick = !!o.hideOnBackplateClick && _o.shouldShowBackplate;
				}

				if (!isNaN(Number(o.offsetX))) { _o.offsetX = Number(o.offsetX); }
				if (!isNaN(Number(o.offsetY))) { _o.offsetY = Number(o.offsetY); }
				if (!isNaN(Number(o.minMarginTop))) { _o.minMarginTop = Number(o.minMarginTop); }
				if (!isNaN(Number(o.minMarginRight))) { _o.minMarginRight = Number(o.minMarginRight); }
				if (!isNaN(Number(o.minMarginBottom))) { _o.minMarginBottom = Number(o.minMarginBottom); }
				if (!isNaN(Number(o.minMarginLeft))) { _o.minMarginLeft = Number(o.minMarginLeft); }
				if (!isNaN(Number(o.showingDuration))) { _o.showingDuration = Number(o.showingDuration); }
				if (!isNaN(Number(o.hidingDuration))) { _o.hidingDuration = Number(o.hidingDuration); }
				if (!isNaN(Number(o.autoHideDelayDuration))) { _o.autoHideDelayDuration = Number(o.autoHideDelayDuration); }

				if (
					!!o.centerRef && (
						// true || 
						o.centerRef == document.documentElement ||
						o.centerRef == document ||
						o.centerRef == document.body ||
						o.centerRef == window ||
						o.centerRef == this.elements.root.parentNode ||
						o.centerRef.toLowerCase() === 'parent' ||
						o.centerRef.toLowerCase() === 'parentnode' ||
						o.centerRef.toLowerCase() === 'backplate'
					)
				) {

					_o.centerRef = o.centerRef;

					if (o.centerRef == document.documentElement ||
						o.centerRef == document ||
						o.centerRef == document.body ||
						o.centerRef == window
					) {
						o.centerRef = document.documentElement;
					}

					if (_o.centerRef === 'parent' || _o.centerRef === 'parentnode') {
						_o.centerRef = this.elements.root.parentNode;
					}

					if (_o.centerRef === 'backplate') {
						_o.centerRef = _thisPopupLayersManager.elements.backplate;
					}
				}

				if (Array.isArray(o.showButtons)) {
					// this.clearShowButtons();
					this.addShowButtons(o.showButtons, _allowWarning);
				}
				if (Array.isArray(o.hideButtons)) {
					// this.clearHideButtons();
					this.addHideButtons(o.hideButtons, _allowWarning);
				}
				if (Array.isArray(o.toggleButtons)) {
					// this.clearToggleButtons();
					this.addToggleButtons(o.toggleButtons, _allowWarning);
				}


				if (_allowWarning && this.options.hideButtons.length === 0 && this.options.toggleButtons.length === 0 && !this.options.shouldAutoHide) {
					w(this.logName+':\n\tIt has neither hide button nor toggle button.\n\tBeing a NON auto-hide window, it could never be closed interatively.\n\tAlthough it can still be closed programmatically.\n');
				}

				_refresh.call(this);
			}


			function _clearButtonsInArray(arrayName) {
				var a = this.options[arrayName];
				var oldLength = a.length;
				
				if (a===this.options.showButtons) _detachAllShowButtons.call(this);
				if (a===this.options.hideButtons) _detachAllHideButtons.call(this);
				if (a===this.options.toggleButtons) _detachAllToggleButtons.call(this);

				a = [];
				if (oldLength > 0) {
					w('The array "'+arrayName+'" of '+this.logName+' has been cleared! From now on, there is nothing inside this array.');
				}
			}
			function _addButtonsToArray(elementOrArrayToAdd, targetArray, _allowWarning) {
				var addedElements = [];
				_allowWarning = (typeof _allowWarning === 'undefined') || !!_allowWarning;

				if ( typeof elementOrArrayToAdd === 'undefined' || elementOrArrayToAdd === null ) {
					return addedElements;
				}

				var elementsArray = undefined;
				if (Array.isArray(elementOrArrayToAdd)) {
					elementsArray = elementOrArrayToAdd;
				} else {
					elementsArray = [];
					elementsArray.push(elementOrArrayToAdd);
				}

				var targetArrayName = '';
				if (targetArray===this.options.showButtons) targetArrayName = '"showButtons"';
				if (targetArray===this.options.hideButtons) targetArrayName = '"hideButtons"';
				if (targetArray===this.options.toggleButtons) targetArrayName = '"toggleButtons"';

				for (var i = 0; i < elementsArray.length; i++) {
					var element = elementsArray[i];
					var elementIsValid = true;
					if ( utilities.domTools.isDom(element) ) {
						// do nothing
					} else if (typeof element === 'string') {
						var temp = _thisPopupLayer.elements.root.qS(element);
						if (!temp) {
							temp = document.body.qS(element);
						}
						if (temp) {
							element = temp;
						} else {
							elementIsValid = false;
						}

						// l('is string:', element, elementIsValid);
					} else {
						elementIsValid = false;
					}

					if (elementIsValid) {
						var elementAlreadyInOneOfTheArrays = false;
						var elementAlreadyInArrayName = '';

						if (this.options.showButtons.has(element)) {
							elementAlreadyInOneOfTheArrays = true;
							elementAlreadyInArrayName = 'showButtons';
						}

						if (this.options.hideButtons.has(element)) {
							elementAlreadyInOneOfTheArrays = true;
							elementAlreadyInArrayName = 'hideButtons';
						}

						if (this.options.toggleButtons.has(element)) {
							elementAlreadyInOneOfTheArrays = true;
							elementAlreadyInArrayName = 'toggleButtons';
						}

						if (!elementAlreadyInOneOfTheArrays) {
							// l(this.logName+': adding ', element, 'to', targetArrayName);
							targetArray.push( element );
							addedElements.push( element );
						} else {
							if (_allowWarning) {
								e( 'Element already in array "'+elementAlreadyInArrayName+'". Ignored.\nThe element metioned is', element, '\n');
							}
						}
					} else {
						if (_allowWarning) {
							w( 'Invalid element is met when trying to add buttons to '+targetArrayName+' for '+this.logName+'. Ignored.\nThe element metioned is', element, '\n');
						}
						continue;
					}
				}

				if (targetArray===this.options.showButtons) {
					_wireUpShowButtons.call(this, addedElements);
				}

				if (targetArray===this.options.hideButtons) {
					_wireUpHideButtons.call(this, addedElements);
				}

				if (targetArray===this.options.toggleButtons) {
					_wireUpToggleButtons.call(this, addedElements);
				}

				return addedElements;
			}
			function _removeButtonsFromArray(elementOrArrayToAdd, targetArray) {
				var removedElements = [];

				if ( typeof elementOrArrayToAdd === 'undefined' || elementOrArrayToAdd === null ) {
					return removedElements;
				}

				var elementsArray;
				if (Array.isArray(elementOrArrayToAdd)) {
					elementsArray = elementOrArrayToAdd;
				} else {
					elementsArray = [].push(elementOrArrayToAdd);
				}
				// l('_removeButtonsFromArray();');

				for (var i = 0; i < elementsArray.length; i++) {
					var element = elementsArray[ i ];
					if ( utilities.domTools.isDom(element) ) {
						if (targetArray===this.options.showButtons) _detachOneShowButton.call(this,element);
						if (targetArray===this.options.hideButtons) _detachOneHideButton.call(this,element);
						if (targetArray===this.options.toggleButtons) _detachOneToggleButton.call(this,element);
						targetArray.del(element);
						removedElements.push(element);
					} else {
						w( 'Invalid element met when trying to remove buttons for '+this.logName+'. Ignored.' );
						continue;
					}
				}
				return removedElements;
			}



			function _wireUpShowButtons(elementsArray) {
				for (var i = 0; i < elementsArray.length; i++) {
					var element = elementsArray[i];
					var thePopupWindow = this;

					$(element).on('click'+'.showPopupWindow-'+thePopupWindow.elements.root.id,
						function (e) {
							e.preventDefault();
							e.stopPropagation();
							thePopupWindow.show();
						}
					);
				}
			}
			function _wireUpHideButtons(elementsArray) {
				for (var i = 0; i < elementsArray.length; i++) {
					var element = elementsArray[i];
					var thePopupWindow = this;

					$(element).on('click'+'.hidePopupWindow-'+thePopupWindow.elements.root.id,
						function (e) {
							e.preventDefault();
							e.stopPropagation();
							thePopupWindow.hide();
						}
					);
				}
			}
			function _wireUpToggleButtons(elementsArray) {
				for (var i = 0; i < elementsArray.length; i++) {
					var element = elementsArray[i];
					var thePopupWindow = this;

					$(element).on('click'+'.togglePopupWindow-'+thePopupWindow.elements.root.id,
						function (e) {
							e.preventDefault();
							e.stopPropagation();
							thePopupWindow.toggle();
						}
					);
				}
			}



			function _detachOneShowButton(showButton) {
				$(showButton).off('click'+'.showPopupWindow-'+this.elements.root.id);
			}
			function _detachOneHideButton(hideButton) {
				$(hideButton).off('click'+'.hidePopupWindow-'+this.elements.root.id);
			}
			function _detachOneToggleButton(toggleButton) {
				$(toggleButton).off('click'+'.togglePopupWindow-'+this.elements.root.id);
			}
			function _detachAllShowButtons() {
				for (var i = 0; i < this.options.showButtons.length; i++) {
					_detachOneShowButton.call(this, this.options.showButtons[i]);
				}
			}
			function _detachAllHideButtons() {
				for (var i = 0; i < this.options.hideButtons.length; i++) {
					_detachOneHideButton.call(this, this.options.hideButtons[i]);
				}
			}
			function _detachAllToggleButtons() {
				for (var i = 0; i < this.options.toggleButtons.length; i++) {
					_detachOneToggleButton.call(this, this.options.toggleButtons[i]);
				}
			}



			function _updateSizeAndPosition() {
				var _r = this.elements.root;
				var _oldInlineCssTransitionProperty = _r.style.transitionProperty;
				var _oldInlineCssTransitionDuration = _r.style.transitionDuration;
				var _oldInlineCssTransitionTimingFunction = _r.style.transitionTimingFunction;

				_r.style.transitionProperty = 'margin, left, top, width, height';
				_r.style.transitionDuration = '0.3s';
				_r.style.transitionTimingFunction = 'ease-out';

				_r.on('transitionend', function (event) {
					_r.style.transitionProperty = _oldInlineCssTransitionProperty;
					_r.style.transitionDuration = _oldInlineCssTransitionDuration;
					_r.style.transitionTimingFunction = _oldInlineCssTransitionTimingFunction;
				});

				if (this.options.shouldBeCentered) {
					_r.centerTo({
						centerRef:			this.options.centerRef,
						offsetX:			this.options.offsetX,
						offsetY:			this.options.offsetY,
						minMarginTop:		this.options.minMarginTop,
						minMarginRight:		this.options.minMarginRight,
						minMarginBottom:	this.options.minMarginBottom,
						minMarginLeft:		this.options.minMarginLeft
					});
				} else {
					// if (this.options.offsetX != 0) {
					// 	this.elements.root.style.left = this.options.offsetX + 'px';
					// }
					// if (this.options.offsetY != 0) {
					// 	this.elements.root.style.top = this.options.offsetY + 'px';
					// }
				}
				if (typeof this.onRelocateEnd === 'function') this.onRelocateEnd();		
			}
			function _refresh() { if (this.isShown) this.updateSizeAndPosition(); }



			function _show(o) {
				o = o || {};
				o.shouldAutoHide = (o.hasOwnProperty('shouldAutoHide')) ? !!o.shouldAutoHide : !!this.options.shouldAutoHide;
				o.shouldShowBackplate = !o.shouldAutoHide && (o.hasOwnProperty('shouldShowBackplate')) ? !!o.shouldShowBackplate : !!this.options.shouldShowBackplate;

				_thisPopupLayersManager.pendForShowingPopupLayer(this, o);
			}

			function _doShow() {
				if (this.isShown) {
					// l(this.logName+' has already been opened. Skipped.');
					return false;
				}

				var o = this.__o;

				this.isShown = true;
				this.elements.root.show(this.options.showingDuration);
				this.updateSizeAndPosition();

				if (typeof this.onShow === 'function') this.onShow(o.onShowOptions);

				if (o.shouldAutoHide) {
					var _duration = this.options.autoHideDelayDuration + this.options.showingDuration;
					// l(this.logName+' will close automatically in about '+Math.round(_duration/1000)+' seconds.');
					window.setTimeout(function () { _thisPopupLayer.hide(); }, _duration);
				}
			}

			function _hide() {
				if (!this.isShown) {
					// l(this.logName+' has already been closed. Skipped.');
					return false;
				}
				this.isShown = false;

				if (typeof this.onHide === 'function') this.onHide();

				_thisPopupLayersManager.pendForHidingPopupLayer(this);
				this.elements.root.hide(this.options.hidingDuration);
			}
			function _toggle() {
				if (this.isShown) {
					this.hide();
				} else {
					this.show();
				}
			}



			Object.defineProperty(_thisPopupLayer, 'buttonsWhoShowMe', {
				get: function () { return this.options.showButtons; }
			});

			Object.defineProperty(_thisPopupLayer, 'buttonsWhoHideMe', {
				get: function () { return this.options.hideButtons; }
			});

			Object.defineProperty(_thisPopupLayer, 'buttonsWhoToggleMe', {
				get: function () { return this.options.toggleButtons; }
			});



			return (function() { // initializing
				var r = this.elements.root;
				r.style.display = 'none';
				this.config(initOptions, false);

				// l(this.logName+':\n\tJust for conveniences, constructor is now automatically searching all possible hide-buttons:');
				this.addHideButtons([
					r.qS('[role="button-x"]'),
					r.qS('[data-button-role="x"]'),
					'[data-button-role="cancel"]',
					'[data-button-role="save"]',
					'[data-button-role="ok"]',
					'[data-button-role="confirm"]',
					'[data-button-role="yes"]',
					'[data-button-role="no"]'
				], false);

				return this;
			}).apply(_thisPopupLayer);
		}
	};

	utilities.Paginator = function(rootElement, initOptions) {
		if (!utilities.domTools.isDom(rootElement)) {
			e('Invalid element for the rootElement of a {Paginator} object.');
			return undefined;
		}

		this.elements = {
			root: rootElement,
			displayRoot: rootElement
		};

		this.controllers = {};

		this.shouldBuildButtonFirstPage = true;
		this.shouldBuildButtonLastPage =  true;
		this.shouldBuildButtonPrevPage =  true;
		this.shouldBuildButtonNextPage =  true;

		// all indices start from 1
		this.shownPagesCountMax = 5;
		this.buttonsAreAnchors = false;







		this.elements.buttonFirstPage = null;
		this.elements.buttonLastPage = null;
		this.elements.buttonPrevPage = null;
		this.elements.buttonNextPage = null;
		this.elements.buttonsWithIndices = [];

		this.hasPagination = false;
		this.pagesCount = 1;
		this.currentPageIndex = NaN; // force to load 1st page by avoiding currentPage equals to 1
		this.pendingPageIndex = 1;

		this.shownPageIndexFirst = NaN;
		this.shownPageIndexLast = NaN;

		this.actionsOnGotoPage = [];

		this.generateUrl = function (pageIndex) {
			// for anchor <a> elements
			// Please return a vaild url string

			// return '/some-url/' + utilities.jsonToUrlParameters({ page: pageIndex });
			return '#';
		};

		this.tryToShow = function() {
			if (this.hasPagination) {
				this.elements.displayRoot.style.opacity = '';
				this.elements.displayRoot.show();
			} else {
				this.hide();
			}
		};
		this.show = this.tryToShow;
		this.hide = function() {
			this.elements.displayRoot.style.opacity = '';
			this.elements.displayRoot.hide();
		};
		this.fadeOut = function() {
			this.elements.displayRoot.style.opacity = '0';
		};

		this.config = function(o) {
			o = o || {};

			if (typeof o.generateUrl === 'function') this.generateUrl = o.generateUrl;
			if (o.hasOwnProperty('onGotoPage')) {
				if (!Array.isArray(o.onGotoPage)) o.onGotoPage = [o.onGotoPage];
				this.actionsOnGotoPage = this.actionsOnGotoPage.concat(o.onGotoPage);
			}

			if (o.hasOwnProperty('buttonsAreAnchors')) this.buttonsAreAnchors = !!o.buttonsAreAnchors;
			if (o.hasOwnProperty('shouldBuildButtonFirstPage')) this.shouldBuildButtonFirstPage = !!o.shouldBuildButtonFirstPage;
			if (o.hasOwnProperty('shouldBuildButtonLastPage'))  this.shouldBuildButtonLastPage =  !!o.shouldBuildButtonLastPage;
			if (o.hasOwnProperty('shouldBuildButtonPrevPage'))  this.shouldBuildButtonPrevPage =  !!o.shouldBuildButtonPrevPage;
			if (o.hasOwnProperty('shouldBuildButtonNextPage'))  this.shouldBuildButtonNextPage =  !!o.shouldBuildButtonNextPage;

			o.shownPagesCountMax = parseInt(o.shownPagesCountMax);
			if (!isNaN(o.shownPagesCountMax) && o.shownPagesCountMax > 0) this.shownPagesCountMax = o.shownPagesCountMax;

			var oldPagesCount = this.pagesCount;
			o.pagesCount = parseInt(o.pagesCount);
			if (!isNaN(o.pagesCount) && o.pagesCount > 0) this.pagesCount = o.pagesCount;

			if (oldPagesCount != this.pagesCount) {
				// A brand new Paginator is defined,
				// since the pagesCount has been changed
				this.currentPageIndex = NaN;
				this.pendingPageIndex = 1;
			}

			o.currentPageIndex = parseInt(o.currentPageIndex);
			if (!isNaN(o.currentPageIndex)) this.pendingPageIndex = o.currentPageIndex;

			if (o.displayRoot) {
				this.elements.displayRoot = o.displayRoot;
				this.elements.displayRoot.style.transitionProperty = 'opacity';
				this.elements.displayRoot.style.webkitTransitionProperty = 'opacity';
			}

			this.continueGotoPendingPage();
		};

		this.gotoPageByOffset = function(pageIndexOffset) {
			pageIndexOffset = parseInt(pageIndexOffset);
			if (isNaN(pageIndexOffset)) return false;
			this.gotoPage(this.currentPageIndex + pageIndexOffset);
		};

		this.refreshCurrentPage = function() {
			this.gotoPage(this.currentPageIndex, true);
		};

		this.gotoPage = function(targetPageIndex, shouldForceToInvokeAjax) {
			this.pendingPageIndex = _evaluateValidPageIndex.call(this, targetPageIndex);

			if (this.pendingPageIndex!==this.currentPageIndex || !!shouldForceToInvokeAjax) {
				if (this.buttonsAreAnchors) {
					// Basically, this paginator is used only once,
					// because whenver user switches to a different page,
					// the html gets refreshed,
					// and the paginator will be re-constructed.
					this.continueGotoPendingPage();
				} else {
					this.executeAllActionsOnGotoPage();
				}
			}	
		};

		this.executeAllActionsOnGotoPage = function() {
			// For mode that do NOT jump url
			// For mode that do NOT jump url
			// For mode that do NOT jump url
			// Anchor/url based Pagimators will NEVER invoke this method.
			var handler, allActionsAreSucceeded = true;
			for	(var _h=0; _h < this.actionsOnGotoPage.length; _h++) {
				handler = this.actionsOnGotoPage[_h];
				if (typeof handler === 'function') {
					allActionsAreSucceeded = allActionsAreSucceeded && handler(this.pendingPageIndex);
				}
			}
			return allActionsAreSucceeded;
		};

		this.continueGotoPendingPage = function() {
			this.currentPageIndex = this.pendingPageIndex;
			this.rebuildOrHide();
		};

		this.rebuildOrHide = function() {
			this.fadeOut();

			_decidePageIndices.call(this);
			if (!this.hasPagination) {
				this.hide();
				return false;
			}

			setTimeout((function () {
				_rebuildAllButtonDoms.call(this);    // build doms, link doms to events
				_updateLooksOfAllButtons.call(this); // setup css styles, disable or enable certain buttons
				this.tryToShow();
			}).bind(this),
			600);
		};

		utilities.setRole(this.elements.root, 'pagination');
		this.config(initOptions);

		function _evaluateValidPageIndex(pageIndex) {
			if (typeof pageIndex === 'string') {
				switch (pageIndex.toLowerCase()) {
					case 'first-page':
					case 'first':
						pageIndex = 1;
						break;
					case 'last-page':
					case 'last':
						pageIndex = this.pagesCount;
						break;
					default:
				}
			}

			pageIndex = parseInt(pageIndex);
			// Whenever a Paginator object is constructed,
			// the currentPageIndex is NaN at initial.
			//
			// The final value of pageIndex must be a safe value.
			// We need to make sure of that.
			//
			// So, even if we execute "pageIndex = this.currentPageIndex;"
			// they still might be different from each other finally.
			// And the continueGotoPendingPage method thus get invoked,
			// which means the doms will be created for sure.
			if (isNaN(pageIndex)) pageIndex = this.currentPageIndex;
			if (isNaN(pageIndex)) pageIndex = 1;

			pageIndex = Math.max(1, Math.min(this.pagesCount, pageIndex));

			return pageIndex;
		}

		function _decidePageIndices() {
			var pagesCount = this.pagesCount;
			var pendingPageIndex = this.pendingPageIndex;

			this.hasPagination = pagesCount > 1;
			if (!this.hasPagination) return false;

			var maxMarginIndexBeforeCurrent = Math.floor(this.shownPagesCountMax / 2);

			this.shownPageIndexFirst = Math.max(1, pendingPageIndex - maxMarginIndexBeforeCurrent);
			this.shownPageIndexLast = this.shownPageIndexFirst + this.shownPagesCountMax - 1;

			var lackedPagesCount = Math.max(0, this.shownPageIndexLast - pagesCount);
			if (lackedPagesCount>0) {
				this.shownPageIndexLast = pagesCount;
				this.shownPageIndexFirst = Math.max(1, pagesCount - this.shownPagesCountMax + 1);
			}
		}

		function _rebuildAllButtonDoms() {
			// l('  _rebuildAllButtonDoms()    this.currentPageIndex =',this.currentPageIndex);
			var el = this.elements;

			el.buttonFirstPage =  el.root.querySelector('[data-pagination-target="first-page"]');
			el.buttonLastPage =   el.root.querySelector('[data-pagination-target="last-page"]');
			el.buttonPrevPage =   el.root.querySelector('[data-pagination-target="prev-page"]');
			el.buttonNextPage =   el.root.querySelector('[data-pagination-target="next-page"]');



			if (this.shouldBuildButtonFirstPage) {
				if (el.buttonFirstPage) {
					_linkButtonToPage.call(this, el.buttonFirstPage);
					utilities.enable(el.buttonFirstPage); // just for safety
				} else {
					_buildButtonForFirstPage.call(this);
				}
			} else {
				if (el.buttonFirstPage) {
					el.buttonFirstPage.die();
				}
			}



			if (this.shouldBuildButtonPrevPage) {
				if (el.buttonPrevPage) {
					_linkButtonToPage.call(this, el.buttonPrevPage);
					utilities.enable(el.buttonPrevPage); // just for safety
				} else {
					_buildButtonForPrevPage.call(this);
				}
			} else {
				if (el.buttonPrevPage) {
					el.buttonPrevPage.die();
				}
			}



			if (this.shouldBuildButtonNextPage) {
				if (el.buttonNextPage) {
					_linkButtonToPage.call(this, el.buttonNextPage);
					utilities.enable(el.buttonNextPage); // just for safety
				} else {
					_buildButtonForNextPage.call(this);
				}
			} else {
				if (el.buttonNextPage) {
					el.buttonNextPage.die();
				}
			}



			if (this.shouldBuildButtonLastPage) {
				if (el.buttonLastPage) {
					_linkButtonToPage.call(this, el.buttonLastPage);
					utilities.enable(el.buttonLastPage); // just for safety
				} else {
					_buildButtonForLastPage.call(this);
				}
			} else {
				if (el.buttonLastPage) {
					el.buttonLastPage.die();
				}
			}


			var button;
			// remove all old buttons with indices
			for (var _b = 0; _b < this.elements.buttonsWithIndices.length; _b++) {
				button = this.elements.buttonsWithIndices[_b];
				if (button) button.die();
			}
			this.elements.buttonsWithIndices = [];



			// build all buttons with indices again
			for (var p = this.shownPageIndexFirst; p <= this.shownPageIndexLast; p++) {
				button = _buildButtonForPage.call(this, p);
				this.elements.buttonsWithIndices.push(button);
			}
		}

		function _updateLooksOfAllButtons() {
			// l('  _updateLooksOfAllButtons() this.currentPageIndex =',this.currentPageIndex);
			var _b = 0;
			var el = this.elements;

			if (this.currentPageIndex===1) {
				if (el.buttonFirstPage) utilities.disable(el.buttonFirstPage);
				if (el.buttonPrevPage) utilities.disable(el.buttonPrevPage);
			} else {
				if (el.buttonFirstPage) utilities.enable(el.buttonFirstPage);
				if (el.buttonPrevPage) utilities.enable(el.buttonPrevPage);
			}

			if (this.currentPageIndex===this.pagesCount) {
				if (el.buttonNextPage) utilities.disable(el.buttonNextPage);
				if (el.buttonLastPage) utilities.disable(el.buttonLastPage);
			} else {
				if (el.buttonNextPage) utilities.enable(el.buttonNextPage);
				if (el.buttonLastPage) utilities.enable(el.buttonLastPage);
			}

			for (var p = this.shownPageIndexFirst; p <= this.shownPageIndexLast; p++) {
				var button = el.buttonsWithIndices[_b];
				button.isCurrentPage = (p===this.currentPageIndex);

				if (button.isCurrentPage) {
					button.setAttribute('current-page', '');
				} else {
					button.removeAttribute('current-page');
				}

				_b++;
			}
		}

		function _buildButtonForFirstPage() {
			var el = this.elements;
			var button = _buildButton.call(this, 'first-page');
			el.root.appendChild(button);
			el.buttonFirstPage = button;
			return button;
		}

		function _buildButtonForLastPage() {
			var el = this.elements;
			var button = _buildButton.call(this, 'last-page');
			el.root.appendChild(button);
			el.buttonLastPage = button;
			return button;
		}

		function _buildButtonForPrevPage() {
			var el = this.elements;
			var button = _buildButton.call(this, 'prev-page');
			el.root.appendChild(button);
			el.buttonPrevPage = button;
			return button;
		}

		function _buildButtonForNextPage() {
			var el = this.elements;
			var button = _buildButton.call(this, 'next-page');
			el.root.appendChild(button);
			el.buttonNextPage = button;
			return button;
		}

		function _buildButtonForPage(pageIndex) {
			var el = this.elements;
			var button = _buildButton.call(this, 'page', pageIndex);

			var beforeWhichButton = null;
			if (el.buttonNextPage) beforeWhichButton = el.buttonNextPage;
			if (!beforeWhichButton && el.buttonLastPage) beforeWhichButton = el.buttonLastPage;

			if (beforeWhichButton) {
				el.root.insertBefore(button, beforeWhichButton);
			} else {
				el.root.appendChild(button);
			}
			return button;
		}

		function _buildButton(paginationTargetString, pageIndex, textContent) {
			if (typeof pageIndex === 'undefined') {
				switch (paginationTargetString) {
					case 'first-page':	pageIndex = 1; break;
					case 'last-page':	pageIndex = this.pagesCount; break;
					case 'prev-page':	pageIndex = ''; break;
					case 'next-page':	pageIndex = ''; break;
					default: // weird!
				}
			}

			if (typeof textContent === 'undefined') {
				switch (paginationTargetString) {
					case 'first-page':	textContent = ''; /*textContent = 1;*/ break;
					case 'last-page':	textContent = ''; /*textContent = this.pagesCount;*/ break;
					case 'prev-page':	textContent = ''; break;
					case 'next-page':	textContent = ''; break;
					default: // weird!
						textContent = pageIndex;
				}
			}

			var el = this.elements;
			var button;

			if (this.buttonsAreAnchors) {
				button = document.createElement('A');
				button.setAttribute('role', 'button');
			} else {
				button = document.createElement('BUTTON');
			}


			button.setData('pagination-target', paginationTargetString);
			button.textContent = textContent;

			_linkButtonToPage.call(this, button, pageIndex);

			return button;
		}

		function _linkButtonToPage(button, pageIndex) {
			if (this.buttonsAreAnchors) {
				if (typeof this.generateUrl === 'function' && !isNaN(this.currentPageIndex)) {
					if (button.getData('pagination-target')==='next-page') {
						pageIndex = _evaluateValidPageIndex.call(this, this.currentPageIndex + 1);
					} else if (button.getData('pagination-target')==='prev-page') {
						pageIndex = _evaluateValidPageIndex.call(this, this.currentPageIndex - 1);
					} else if (button.getData('pagination-target')==='first-page') {
						pageIndex = 1;
					} else if (button.getData('pagination-target')==='last-page') {
						pageIndex = this.pagesCount;
					} else {
						pageIndex = _evaluateValidPageIndex.call(this, pageIndex);
					}

					button.setData('pagination-index', pageIndex);
					button.href = this.generateUrl(pageIndex);
				}
			} else {
				if (button.alreadyLinkedToPage) return true;
				button.alreadyLinkedToPage = true;

				if (button.getData('pagination-target')==='next-page') {
					button.addEventListener('click', this.gotoPageByOffset.bind(this, 1));
					button.setData('pagination-index', '');
				} else if (button.getData('pagination-target')==='prev-page') {
					button.addEventListener('click', this.gotoPageByOffset.bind(this, -1));
					button.setData('pagination-index', '');
				} else if (button.getData('pagination-target')==='first-page') {
					button.addEventListener('click', this.gotoPage.bind(this, 'first-page'));
					button.setData('pagination-index', '');
				} else if (button.getData('pagination-target')==='last-page') {
					button.addEventListener('click', this.gotoPage.bind(this, 'last-page'));
					button.setData('pagination-index', '');
				} else {
					button.setData('pagination-index', pageIndex);
					button.addEventListener('click', _buttonOnClick.bind(this));
				}
			}
		}

		function _buttonOnClick(event) {
			var button = event.target;
			var pageIndex = parseInt(button.getData('pagination-index'));
			this.gotoPage(pageIndex);
		}
	};

	utilities.fitImageIntoContainer = function(image, container, sizeType) {
		// l('fitImageIntoContainer:', image, container, sizeType);
		var isCoverMode = sizeType === 'cover';
		var _iW = image.naturalWidth;
		var _iH = image.naturalHeight;

		var _cW = $(container).width();
		var _cH = $(container).height();

		var pictureRatio   = _iW / _iH;
		var containerRatio = _cW / _cH;

		var _displayW = _cW;
		var _displayH = _cH;

		image.style.position = 'absolute';

		if (pictureRatio > containerRatio) {
			if (isCoverMode) {
				_displayW = _displayH * pictureRatio;
			} else {
				_displayH = _displayW / pictureRatio;
			}
			image.style.width  = _displayW + 'px';
			image.style.height = _displayH + 'px';
		} else {
			if (isCoverMode) {
				_displayH = _displayW / pictureRatio;
			} else {
				_displayW = _displayH * pictureRatio;
			}
			image.style.width  = _displayW + 'px';
			image.style.height = _displayH + 'px';
		}
		if (
			(pictureRatio >  containerRatio && isCoverMode) ||
			(pictureRatio <= containerRatio && !isCoverMode)
		) {
			image.style.left = ((_cW - _displayW) / 2) + 'px';
			image.style.top  = '0';
		}

		if (
			(pictureRatio <= containerRatio && isCoverMode) ||
			(pictureRatio >  containerRatio && !isCoverMode)
		) {
			image.style.left = '0';
			image.style.top  = ((_cH - _displayH) / 2) + 'px';
		}
	};
	utilities.updateImageNestUnderContainer = function(imageUrl, imageContainer, sizeType) {
		if (!imageContainer) {
			e('Try updating an image: Invalid image container dom provided.');
			return false;
		}

		if (typeof imageUrl !== 'string' || !imageUrl) {
			// w('Invalid image url');
			utilities.clearImageNestUnderContainer(imageContainer);
			return false;
		}
		// e('image url:', imageUrl);

		// imageUrl = encodeURI(imageUrl);

		var img = imageContainer.qS('img');
		if (!img) {
			img = new Image();
			imageContainer.appendChild(img);
		}

		if (!img.hasAlreadyHadOnLoadEventHandlerForUpdating) {
			img.hasAlreadyHadOnLoadEventHandlerForUpdating = true;
			img.onload = function (event) {
				if (sizeType === 'cover' || sizeType === 'contain') {
					utilities.fitImageIntoContainer(img, imageContainer, sizeType);
					setTimeout(function () { utilities.fitImageIntoContainer(img, imageContainer, sizeType); }, 300);
					setTimeout(function () { utilities.fitImageIntoContainer(img, imageContainer, sizeType); }, 1900);
				} else {
					// do nothing
				}
			};
		}

		img.src = imageUrl;

		return true;
	};
	utilities.clearImageNestUnderContainer = function(imageContainer) {
		if (!imageContainer) {
			e('Try clearing an image: Invalid image container dom provided.');
			return false;
		}

		var img = imageContainer.qS('img');
		if (img) img.die();

		return true;
	};

	utilities.FileInputControllerForSingleFile = function(input, initOptions) {
		if (!input || input.tagName.toLowerCase()!=='input' || input.type!=='file') {
			e('Invalid input[file] element.');
			return undefined;
		}

		this.init = function () {
			this.elements = this.elements || {};
			this.elements.input = input;
			this.status = {
				thisInputIsRequired: false,
				sizeLimitationInBytes: NaN,
				allowedFileExtensions: [],

				thisFileInputHasBeenTouched: false,

				file: null,
				thereIsAFileWaitingForUploading: false,
				fileIsOk: false,
				userCancelled: false,
				fileIsTooLarge: false,
				fileTypeIsUnexpected: false,

				message: ''
			};

			this.onChangeActions = [];

			if (typeof initOptions.init === 'function') {
				initOptions.init.call(this);
			} else {
				this.config(initOptions);
			}

			input.addEventListener('change', this.onChange.bind(this));
		};

		this.config = function (options) {
			var status = this.status;
			options = options || {};
			// options.thisInputIsRequired:    boolean
			// options.sizeLimitationInBytes:  integer
			// options.allowedFileExtensions:  array of strings
			// options.accept:                 MIME-Type string
			// options.onChange:               function (event)
			// options.onFileOk:               function (status)
			// options.onFileInvalid:          function (status)
			// options.onUserCancel:           function (status)
			// options.always:                 function (status)

			if (options.hasOwnProperty('thisInputIsRequired')) status.thisInputIsRequired = !!options.thisInputIsRequired;
			if (options.hasOwnProperty('accept')) this.elements.input.accept = options.accept;

			options.sizeLimitationInBytes = parseInt(options.sizeLimitationInBytes);
			if (!isNaN(options.sizeLimitationInBytes) && options.sizeLimitationInBytes > 8) status.sizeLimitationInBytes = options.sizeLimitationInBytes;

			if (Array.isArray(options.allowedFileExtensions)) {
				status.allowedFileExtensions = options.allowedFileExtensions;
			}

			if (typeof options.onChange      === 'function') this.onChangeActions.push(options.onChange);
			if (typeof options.onFileOk      === 'function') this.onFileOk = options.onFileOk;
			if (typeof options.onFileInvalid === 'function') this.onFileInvalid = options.onFileInvalid;
			if (typeof options.onUserCancel  === 'function') this.onUserCancel = options.onUserCancel;
			if (typeof options.always        === 'function') this.always = options.always;
		};

		this.onChange = function (event) {
			for (var _a = 0; _a < this.onChangeActions.length; _a++) {
				this.onChangeActions[_a].call(this, event);
			}

			var status = this.status;
			var input = this.elements.input;


			status.thereIsAFileWaitingForUploading = false;
			status.fileIsOk = true;
			status.userCancelled = false;
			status.fileIsTooLarge = false;
			status.fileTypeIsUnexpected = false;
			status.message = '';

			var message = '';

			status.file = input.files[0];
			if (!status.file) { // sometimes onchange is invoked even if user clicks the 'Cancel' button in the file browser dialog
				status.userCancelled = true;
				status.fileIsOk = false;
				message = 'user cancelled picking file for input[name="'+input.name+'"].' + '\n';
				l(message);
				status.message += message;
			} else {
				var fileExt = utilities.getFileExtensionViaFileName(status.file.name).toLowerCase();

				if (status.allowedFileExtensions.length > 0 && status.allowedFileExtensions.hasNo(fileExt)) {
					status.fileIsOk = false;
					status.fileIsTooLarge = true;
					message = 'File input[name="'+input.name+'"]:\n\tIncorrect file type. Please choose a file of type listed below:\n\t\t', status.allowedFileExtensions.join('; ') + '\n';
					e(message);
					status.message += message;
				}

				if (!isNaN(status.sizeLimitationInBytes) && (status.file.size > status.sizeLimitationInBytes)) {
					status.fileIsOk = false;
					status.fileTypeIsUnexpected = true;
					message = 'File input[name="'+input.name+'"]:\n\tFile size ('+status.file.size+' bytes) is too large,\n\twhich exeeds the limitation of '+status.sizeLimitationInBytes+' bytes.' + '\n';
					e(message);
					status.message += message;
				}
			}



			if(status.fileIsOk){
				status.thisFileInputHasBeenTouched = true;
				status.thereIsAFileWaitingForUploading = true;

				if (typeof this.onFileOk === 'function') this.onFileOk(status);
			} else {
				input.value = '';
				status.thereIsAFileWaitingForUploading = false;

				if (status.userCancelled) {
					if (typeof this.onUserCancel === 'function') this.onUserCancel(status);
				} else {
					if (typeof this.onFileInvalid === 'function') this.onFileInvalid(status);
				}
			}

			if (typeof this.always === 'function') this.always(status);
		};

		this.init();
	};
	utilities.FileInputControllerForSingleImageFile = function(input, initOptions) {
		this.options = {
			defaultImageUrl: '',
			sizeType: 'contain'
		};
		this.elements = {
			imageContainer: undefined,
		};
		var el = this.elements;



		initOptions = initOptions || {};

		var wrappedOnFileOk      = initOptions.onFileOk;
		var wrappedOnFileInvalid = initOptions.onFileInvalid;
		var wrappedOnUserCancel  = initOptions.onUserCancel;
		var wrappedAlways        = initOptions.always;

		if (!initOptions.hasOwnProperty('allowedFileExtensions')) {
			initOptions.allowedFileExtensions = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'tif', 'tiff'];
		}

		if (!initOptions.hasOwnProperty('accept')) {
			initOptions.accept = 'image/*';
		}





		function _selfConfig(options) {
			options = options || {};
			var defaultImageUrlChanged = false;
			var imageContainerChanged = false;
			var sizeTypeChanged = false;

			if (typeof options.defaultImageUrl === 'string' && this.options.defaultImageUrl !== options.defaultImageUrl) {
				this.options.defaultImageUrl = options.defaultImageUrl;
				defaultImageUrlChanged = true;
			}
			if (options.hasOwnProperty('imageContainer') && el.imageContainer !== options.imageContainer) {
				el.imageContainer = options.imageContainer;
				imageContainerChanged = true;
			}

			if (typeof options.sizeType === 'string' && this.options.sizeType !== options.sizeType) {
				this.options.sizeType = options.sizeType;
				sizeTypeChanged = true;
			}

			if (
				(defaultImageUrlChanged || imageContainerChanged || sizeTypeChanged)
				&& !!this.options.defaultImageUrl
				&& !!el.imageContainer
			) {
				if (!this.status.fileIsOk) {
					utilities.updateImageNestUnderContainer(this.options.defaultImageUrl, el.imageContainer, this.options.sizeType);
				} else {
					// if defaultImageUrl is set ASYNC, then we might reach here
					l('user already picked a valid file. we should NOT update the image to default image.');
				}
			}
		}

		initOptions.init = function () {
			var _prototypeConfig = this.config;
			this.config = function (options) {
				// options.thisInputIsRequired:    boolean
				// options.sizeLimitationInBytes:  integer
				// options.allowedFileExtensions:  array of strings
				// options.onChange:               function (event)
				// options.onFileOk:               function (status)
				// options.onFileInvalid:          function (status)
				// options.onUserCancel:           function (status)
				// options.always:                 function (status)

				// options.imageContainer:         dom
				// options.defaultImageUrl:        string
				// options.sizeType:               string

				_prototypeConfig.call(this, options);
				_selfConfig.call(this, options);
			};

			this.config(initOptions);
		};

		initOptions.onFileOk = function (status) {
			utilities.clearImageNestUnderContainer(el.imageContainer);
			var thisController = this;
			utilities.readImageFileIntoDataUrl(status.file, function (progressEvent) {
				utilities.updateImageNestUnderContainer(progressEvent.target.result, thisController.elements.imageContainer, thisController.options.sizeType);
			});
			if (typeof wrappedOnFileOk === 'function') wrappedOnFileOk(status);
		};

		initOptions.onUserCancel = function (status) {
			// utilities.updateImageNestUnderContainer(this.options.defaultImageUrl, el.imageContainer);
			if (typeof wrappedOnUserCancel === 'function') wrappedOnUserCancel(status);
		};

		initOptions.onFileInvalid = function (status) {
			if (typeof wrappedOnFileInvalid === 'function') wrappedOnFileInvalid(status);
		};

		initOptions.always = function (status) {
			if (!status.fileIsOk) {
				if (this.options.defaultImageUrl && el.imageContainer) {
					utilities.updateImageNestUnderContainer(this.options.defaultImageUrl, el.imageContainer);
				}
			}
			if (typeof wrappedAlways === 'function') wrappedAlways(status);
		};




		utilities.FileInputControllerForSingleFile.call(this, input, initOptions);
	};

	utilities.defineClass.call(utilities, 'WebLogicController', null,
		new (function () {
			this.elements = {};
		})
	);

	utilities.defineClass.call(utilities, 'SlotBasic', utilities.WebLogicController,
		new (function () {
			this.onConstructedNotAsAnAncestor = function(data, initOptions) {
				// l(arguments.callee.__ownedByClass__+'.onConstructedNotAsAnAncestor(): '+this.classLogName);
				_buildDom.call(this, data, initOptions);
			};

			function _buildDom(data, initOptions) {
				// l('\t_buildDom(): '+this.classLogName+' ...');
				// l('\t', data);
				var newSlotDom;
				if (typeof this.buildDom === 'function') newSlotDom = this.buildDom(data, initOptions);


				if (newSlotDom instanceof Node) {
					this.elements.root = newSlotDom;
					if (typeof this.setupDom === 'function') {
						this.setupDom(initOptions.indexBase);
					}
					return true;
				} else if (newSlotDom === false) {
					w('Skipped building one '+this.classLogName+', data', data);
					return false;
				} else {
					this.elements.root = undefined;
					e('The {buildDom} method of '+this.classLogName+' didn\'t return a valid dom.\n\tWhat it returned is:', newSlotDom);
					return false;
				}
			}
		}),

		// constructor
		function (data, initOptions) {
			// l('Constructing '+this.classLogName+' ...');
			this.data.rawData = data;
			initOptions = initOptions || {};

			if (typeof initOptions.slotsManager === 'object') {
				this.controllers.slotsManager = initOptions.slotsManager;
			}

			if (!(initOptions.htmlTemplates instanceof utilities.HtmlTemplatesCollection)) {
				w('Invalid htmlTemplates for building a '+this.classLogName+'.');
			}

			var arg = Array.prototype.slice.apply(arguments);
			var _lastArg = arg[arg.length-1];
			if (typeof _lastArg === 'object' && _lastArg.isConstructingMySuccessor === true) {
				// do nothing
			} else {
				if (typeof this.init === 'function') this.init(data, initOptions);
			}
		}
	);

	utilities.defineClass.call(utilities, 'SlotsManager', utilities.WebLogicController,
		new (function () {
			this.htmlTemplates = null;

			this.init = function () {
				this.data.slots = [];

				var el = this.elements;
				var _r = el.root;

				el.stripNoRecords = _r.qS('[role="strip"][data-subject="no-records"]');
				el.stripSlots = _r.qS('[role="strip"][data-subject="slots"]');
				el.slotsGroup = _r.qS('[role="slots-group"]');
				el.slots = [];
			};
			this.clearOldSlots = function () {
				var el = this.elements;
				this.data.slots = [];
				el.slotsGroup.innerHTML = '';
				el.slots = [];
			};
			this.clearOldSlotsAndBuildNewOnesFor = function (dataRecords, options, slotSpecificConstructor) {
				options = options || {};
				options.container = this.elements.slotsGroup;

				this.clearOldSlots();
				this.buildAndAppendSlotsFor(dataRecords, options, slotSpecificConstructor);
			};
			this.buildAndAppendSlotsFor = function (dataRecords, options, slotSpecificConstructor) {
				options = options || {};
				var el = this.elements;

				var container = options.container || el.slotsGroup;

				var _newSlots = this.buildSlotsFor(dataRecords, options, slotSpecificConstructor);
				var _newValidSlots = [];
				var _newSlotsDoms = [];

				var _newSlot, _newSlotDom;
				for (var _s = 0; _s < _newSlots.length; _s++) {
					_newSlot = _newSlots[_s];
					_newSlotDom = _newSlot.elements.root;

					if (_newSlotDom) {
						_newValidSlots.push(_newSlot);
						_newSlotsDoms.push(_newSlotDom);
						container.appendChild(_newSlotDom);
					} else {
						e('Invalid new Slot dom');
					}
				}

				if (_newValidSlots.length > 0) {
					this.data.slots = this.data.slots.concat(_newValidSlots);
					el.slots = el.slots.concat(_newSlotsDoms);
				}
			};
			this.buildSlotsFor = function (dataRecords, options, slotSpecificConstructor) {
				var _newSlots = [];

				if (!Array.isArray(dataRecords)) {
					if (!dataRecords) return _newSlots;
					dataRecords = [dataRecords];
				}


				var slotConstructor;
				var slotConstructorName = this.slotDefaultConstructorName;

				if (slotSpecificConstructor) {
					if (typeof slotSpecificConstructor === 'function') {
						slotConstructor = slotSpecificConstructor;
						slotConstructorName = slotSpecificConstructor.classLogName;
						if (!slotConstructorName) {
							slotConstructorName = slotSpecificConstructor.name || 'specific anonymous constructor';
							slotConstructorName = '{Slot:'+slotConstructorName+'}';
						}
					} else {
						e('Invalid slotSpecificConstructor.');
						return _newSlots;
					}
				} else {
					if (typeof this.slotDefaultConstructor === 'function') {
						slotConstructor = this.slotDefaultConstructor;
					} else {
						e('No valid slotSpecificConstructor, nor slotDefaultConstructor.');
						return _newSlots;
					}
				}


				if (typeof slotConstructor !== 'function') return undefined;


				var indexBase = this.elements.slots.length;
				var _newSlot;

				for (var _d = 0; _d < dataRecords.length; _d++) {
					// l('\n\n\n\n ------- slot['+_d+'] begin ------- \n\n');
					_newSlot = this.buildOneSlot(
						slotConstructor,
						dataRecords[_d],
						{
							htmlTemplates: this.htmlTemplates,
							indexBase: indexBase
						}
					);

					if (_newSlot) _newSlots.push(_newSlot);
					// l('\n ------- slot['+_d+'] end ------- \n\n\n\n');
				}

				return _newSlots;
			};
			this.buildOneSlot = function (constructor, data, options) {
				if (typeof constructor !== 'function') return undefined;

				if (!data) {
					w('No data provided for building a {Slot:'+constructor.name+'}.\n\tdata:', data);
					// return undefined;
				}

				options = options || {};
				options.slotsManager = this;
				var newSlot = new constructor(data, options);
				return newSlot;
			};
			this.removeOneSlot = function(slot, noNeedToOperateDom) {
				if (!slot || !slot.elements || !slot.elements.root) {
					e('Invalid slot to remove. Skipped.');
					return false;
				}

				var dataManager = this.controllers.dataManager;
				if (dataManager) {
					this.data.slots.del(slot);
				}

				if (!noNeedToOperateDom) {
					var slotsGroup = this.elements.slotsGroup;
					if (!slotsGroup) {
						e('Fail to find slotsGroup element while trying to remove a slot dom.');
					} else if (slot.parentNode !== slotsGroup) {
						e('This slot is not the direct child node of the slotsGroup. Removing action skipped.');
					} else {
						slotsGroup.removeChild(slot.elements.root);
					}
				}
			};
		}),

		function (rootDom, initOptions, slotDefaultConstructor) {
			if (!rootDom) {
				e('Invalid rootDom for building a '+this.classLogName+':', rootDom);
				return undefined;
			}

			this.elements.root = rootDom;

			initOptions = initOptions || {};
			if (!(initOptions.htmlTemplates instanceof utilities.HtmlTemplatesCollection)) {
				w('Invalid htmlTemplates for building a {SlotsManager}.\nNote that the constructor of {Slot} might need those templates later.');
			} else {
				this.htmlTemplates = initOptions.htmlTemplates;
				delete initOptions.htmlTemplates;
			}

			utilities.migratePropertiesFrom.call(this.options, initOptions);



			this.slotDefaultConstructor = undefined;
			this.slotDefaultConstructorName = 'not exists';

			if (typeof slotDefaultConstructor === 'function') {
				this.slotDefaultConstructor = slotDefaultConstructor;
				this.slotDefaultConstructorName = slotDefaultConstructor.classLogName;

				this.slotDefaultConstructorName = slotDefaultConstructor.classLogName;
				if (!this.slotDefaultConstructorName) {
					this.slotDefaultConstructorName = slotDefaultConstructor.name || 'default anonymous constructor';
					this.slotDefaultConstructorName = '{Slot:'+this.slotDefaultConstructorName+'}';
				}
			} else {
				if (this.slotDefaultConstructor || this.slotDefaultConstructorName)
					w('Invalid slotDefaultConstructor for this {SlotsManager}.');
			}

			this.init();
		}
	);

	utilities.defineClass.call(utilities, 'PaneBasic', utilities.WebLogicController,
		new (function () {
			this.onShow = undefined;
			this.onHide = undefined;
			this.isAnInstanceOfAPaneClass = true;
		}),

		function (ownerPage, rootDomOrSelectorOrPaneNameOrPaneTabPare) {
			// LCC(this);
			if (!ownerPage) {
				e('Parent page is not set yet!');
				return undefined;
			}

			var _nameAndSelectors;
			var _paneRootDom;
			var _tabRootDom;
			var initOptions = {};

			if (typeof rootDomOrSelectorOrPaneNameOrPaneTabPare === 'object') {
				if (rootDomOrSelectorOrPaneNameOrPaneTabPare.hasOwnProperty('pane')) {
					_paneRootDom = rootDomOrSelectorOrPaneNameOrPaneTabPare.pane;
					if (rootDomOrSelectorOrPaneNameOrPaneTabPare.hasOwnProperty('tab')) _tabRootDom = rootDomOrSelectorOrPaneNameOrPaneTabPare.tab;
					initOptions = rootDomOrSelectorOrPaneNameOrPaneTabPare.options || {};
				} else if (rootDomOrSelectorOrPaneNameOrPaneTabPare instanceof Node) {
					_paneRootDom = rootDomOrSelectorOrPaneNameOrPaneTabPare;
				} else {
					return undefined;
				}
			} else if (typeof rootDomOrSelectorOrPaneNameOrPaneTabPare === 'string') {
				_paneRootDom = rootDomOrSelectorOrPaneNameOrPaneTabPare;
			} else {
				return undefined;
			}



			if (typeof _paneRootDom === 'string') {
				_nameAndSelectors = utilities.strings.processCssSelectorForHtmlAttribute('data-pane-name', _paneRootDom);
				_paneRootDom = ownerPage.elements.root.qS(_nameAndSelectors.selector);
			}


			// l(_paneRootDom, initOptions);
			if (!(_paneRootDom instanceof Node)) {
				e(
					'Invalid root element provided for building a '+this.classLogName+'.',
					'\nThe provided argument was:', rootDomOrSelectorOrPaneNameOrPaneTabPare
				);
				return undefined;
			}

			var el = this.elements;
			el.root = _paneRootDom;


			if (typeof _tabRootDom === 'string') {
				_tabRootDom = ownerPage.elements.root.qS(_tabRootDom);
			}
			if (_tabRootDom) {
				this.elements.tab = _tabRootDom;
			}


			this.name = this.elements.root.getData('pane-name');

			this.page = ownerPage; // for convenience
			this.controllers.ownerPage = ownerPage;
			this.htmlTemplates = this.controllers.ownerPage.htmlTemplates;


			var self = this;
			if (el.tab) el.tab.addEventListener('click', function (event) {
				if (event) {
					event.preventDefault();
					event.stopPropagation();
				}

				self.controllers.panesManager.show(self);
			});
		}
	);

	utilities.defineClass.call(utilities, 'PanesManager', null,
		new (function () {
			this.paneDefaultConstructor = utilities.PaneBasic;
			this.clear = function () {
				this.panes = [];
				this.panesIndexedByNames = {};
				this.currentPane = undefined;
				this.onShowAnyPane = undefined;
				this.onHideAnyPane = undefined;
			};

			this.isAValidPane = function(paneToCheck, shouldLogError) {
				var isValid =
					paneToCheck
					&& typeof paneToCheck === 'object'
					&& typeof paneToCheck.name === 'string'
					&& !!paneToCheck.name
					&& typeof paneToCheck.__isInstanceOf__ === 'object'
					&& paneToCheck.__isInstanceOf__.PaneBasic === true
				;

				if (shouldLogError) {
					try { // paneToCheck might be illegal
						l(
							'isValid:', isValid,
							'\n========================',
							'\n\t !!paneToCheck:', !!paneToCheck,
							'\n\t is an object:', typeof paneToCheck === 'object',
							'\n\t .name is a tring:', typeof paneToCheck.name === 'string',
							'\n\t !!.name:', !!paneToCheck.name,
							'\n\t .__isInstanceOf__ is an object:', typeof paneToCheck.__isInstanceOf__ === 'object',
							'\n\t __isInstanceOf__.PaneBasic:', paneToCheck.__isInstanceOf__.PaneBasic === true
						);
					} catch (error) {
						// do nothing
					}
				}

				if (!isValid && shouldLogError) {
					e('Input is not a valid pane object. A valid pane must have true value of <__isInstanceOf__.PaneBasic> and have a non-empty "name" property.');
				}

				return isValid;
			};
			this.get = function (paneOrIndexOrPaneName) {
				var _paneName = paneOrIndexOrPaneName;
				if (this.isAValidPane(paneOrIndexOrPaneName)) {
					_paneName = paneOrIndexOrPaneName.name;
				} else if (typeof paneOrIndexOrPaneName === 'number') {
					return this.panes[paneOrIndexOrPaneName];
				}

				var _theFoundPane = this.panesIndexedByNames[_paneName];
				if (_theFoundPane) return _theFoundPane.pane;

				return undefined;
			};
			this.getIndexOfPane = function (paneOrPaneName) {
				var _theFoundPane = this.get(paneOrPaneName);
				if (!_theFoundPane) return NaN;
				return this.panesIndexedByNames[_theFoundPane.name].index;
			};
			this.add = function (panesToAdd, specifiedConstructor) {
				if (panesToAdd instanceof NodeList) panesToAdd = Array.prototype.slice.apply(panesToAdd);
				if (!Array.isArray(panesToAdd)) panesToAdd = [panesToAdd];

				for (var _p = 0; _p < panesToAdd.length; _p++) {
					this.addOne(panesToAdd[_p], specifiedConstructor);
				}
			};
			this.addOne = function (paneToAdd, specifiedConstructor) {
				function _addOneValidPane(paneToAdd, tabElementForThePane, shouldOverwrite) {

					var overwriteSucceeded = false;
					var paneIndex = NaN;

					if (shouldOverwrite) {
						var name = paneToAdd.name; // the old pane should have the same name as the paneToAdd's.
						paneIndex = this.getIndexOfPane(name);
						if (!isNaN(paneIndex)) {
							overwriteSucceeded = true;
							this.panes[paneIndex] = paneToAdd;
						}
					}

					if (!overwriteSucceeded) {
						paneIndex = this.panes.length;
						this.panes.push(paneToAdd);
					}

					this.panesIndexedByNames[paneToAdd.name] = { pane: paneToAdd, index: paneIndex };

					if (typeof paneToAdd.controllers !== 'object') paneToAdd.controllers = {};
					paneToAdd.controllers.panesManager = this;

					if (tabElementForThePane instanceof Node) {
						paneToAdd.elements.tab = tabElementForThePane;
						if (!tabElementForThePane.clickEventHasBeenSetup) {
							var thisPanesManager = this;
							tabElementForThePane.on('click', function (event) {
								thisPanesManager.show(paneToAdd);
							});
							tabElementForThePane.clickEventHasBeenSetup = true;
						}
					}
				}

				var shouldRebuildAPaneOfExistingNameIfTheInputPaneToAddIsNotAValidPaneObject = true;
				// When this boolean option above is set to false,
				// and the input paneToAdd is a valid pane object,
				// or the input is an object, who has a property either named 'name' or 'pane',
				//     while the value of this property is a valid pane object,
				// then the pane will NOT be rebuilt;

				// When this boolean option above is set to true,
				// and the input is one of the below:
				//     1) a string stands for the name of a pane,
				//     2) a dom element object, which has an attribute named "data-pane-name" and the value of the attribute is non empty,
				//     3) a configuration object with either "name" or "pane" property ("name" has higher priority),
				//         and the value of the property must be either a non-empty string or a dom, and if it is a dom, the dom should have non-empty "data-pane-name" attribute
				// then, if the evaluated name of the pane already exists, a new pane will be built to replace the existing one.




				// l('\n\n\n==> Try adding pane ...');
				// l('\tpane to add:', paneToAdd);

				var _theValidPaneToAdd;
				var _theFoundPane;

				var _inputIsInvalid = false;
				var _inputProvidesAValidPaneObjectSomehow = false;
				var _inputIsAConfigurationObject = false;

				var _paneName;
				var _paneRootElement;
				var _tabElementForThePane = null;
				var _newPaneConfiguration = undefined;


				var shouldReBuiltANewPane = false;


				var constructor = this.paneDefaultConstructor;
				if (typeof specifiedConstructor === 'function') constructor = specifiedConstructor;
				if (typeof constructor !== 'function') {
					e('No valid constructor is available for {PanesManager} to build a {pane}.');
					return false;
				}


				if (!paneToAdd) {
					_inputIsInvalid = true;
				}


				if (!_inputIsInvalid) {
					_inputProvidesAValidPaneObjectSomehow = this.isAValidPane(paneToAdd, false);


					if (_inputProvidesAValidPaneObjectSomehow) {
						_theValidPaneToAdd = paneToAdd;
					} else if (typeof paneToAdd === 'string') {
						_paneName = paneToAdd;
					} else if (typeof paneToAdd === 'object') {
						if (paneToAdd instanceof Node) {
							_paneRootElement = paneToAdd;
						} else {
							if (paneToAdd.name || paneToAdd.pane) {
								_inputIsAConfigurationObject = true;
								_newPaneConfiguration = paneToAdd;

								// A valid (paneToAdd.name || paneToAdd.pane) can be one of:
								//    1) a {Pane} object
								//    2) a string
								//    3) a dom with non-empty attribut "data-pane-name"
								_paneName = paneToAdd.name || paneToAdd.pane;
								_paneRootElement = _paneName;

								if (typeof _paneName === 'string') {
									// do nothing, just use the _paneName later
								} else if (_paneRootElement instanceof Node) {
									// do nothing at present, let's validate the element later
								} else if (this.isAValidPane(_paneName)) {
									_inputProvidesAValidPaneObjectSomehow = true;
									_theValidPaneToAdd = _paneName;
								} else {
									// e('1');
									_inputIsInvalid = true;
								}

								if (!_inputIsInvalid && paneToAdd.tab instanceof Node) {
									_tabElementForThePane = paneToAdd.tab;
								}
							} else {
								// e('2');
								_inputIsInvalid = true;
							}
						}
					} else {
						// e('3');
						_inputIsInvalid = true;
					}

					if (_paneRootElement instanceof Node) {
						_paneName = _paneRootElement.getData('pane-name');
						if (!_paneName) {
							_paneRootElement = null;
							_inputIsInvalid = true;
						}
					}
				}

				if (_inputIsInvalid) {
					e('Invalid input for adding an pane to this {PanesManager}.\n\tThe input was:', paneToAdd,
						',\n\tWhile a valid input should be one of:',
						'\n\t1): An settings object like { name: \'name-of-the-pane\' [, tab: \'name-of-the-tab\'] [, options: {} ] };',
						'\n\t2): An settings object like { pane: \'name-of-the-pane\' [, tab: \'name-of-the-tab\'] [, options: {} ] };',
						'\n\t3): An html element with attribute named "data-pane-name" and this attribute has a non-empty value;',
						'\n\t4): An {Pane} object.'
					);
					return false;
				}

				if (_inputProvidesAValidPaneObjectSomehow) {
					_theFoundPane = this.get(_theValidPaneToAdd);
					if (_theFoundPane) {
						return true;
					}
				} else {
					_theFoundPane = this.get(_paneName);
				}


				if (!_inputProvidesAValidPaneObjectSomehow) {
					shouldReBuiltANewPane = shouldRebuildAPaneOfExistingNameIfTheInputPaneToAddIsNotAValidPaneObject;

					if (_theFoundPane) {
						// l('A {Pane} named "'+_theFoundPane.name+'" already exists.');
						if (!shouldReBuiltANewPane) {
							return true;
						} else {
							w('We are about to rebuild an existing {Pane} named "'+_theFoundPane.name+'".');
						}
					} else {
						if (!_newPaneConfiguration) {
							if (_paneName) _newPaneConfiguration = _paneName;
						}
					}

					if (!_theFoundPane || shouldReBuiltANewPane) {
						_theValidPaneToAdd = Object.create(constructor.prototype);
						constructor.call(_theValidPaneToAdd, this.controllers.panesOwner, _newPaneConfiguration);

						if (this.isAValidPane(_theValidPaneToAdd)) {
							// l('A new pane of type {'+this.paneDefaultConstructor.name+'} was just created:', _theValidPaneToAdd);
						} else {
							e('Fail to create a pane. Desired name is: "'+_paneName+'"');
							return false;
						}
					} else {
						_theValidPaneToAdd = _theFoundPane;
					}
				}


				_addOneValidPane.call(this, _theValidPaneToAdd, _tabElementForThePane, !!_theFoundPane);


				return true;
			};
			this.show = function (paneToShow, onShowOptions, onHideOptions) {
				function _showOnePane(pane, onShowOptions) {
					if (!pane || !pane.elements || !(pane.elements.root instanceof Node)) {
						e('Trying to show a pane: Invalid pane or its root elements.');
						return false;
					}

					this.currentPane = pane;

					var el2 = pane.elements;

					el2.root.style.display = '';
					if (el2.tab) el2.tab.setData('my-pane-is-current-one', true);

					if (typeof this.onShowAnyPane === 'function') this.onShowAnyPane(pane);
					if (typeof pane.onShow === 'function') pane.onShow(onShowOptions);
				}

				function _hideOnePane(pane, onHideOptions) {
					if (!pane || !pane.elements || !(pane.elements.root instanceof Node)) {
						l('Trying to hide a pane: Invalid pane or its root elements.', pane);
						return false;
					}

					if (pane.elements.root.realStyle.display === 'none') {
						// l('Pane "'+pane.name+'" is already hidden');
						return true;
					}

					var el2 = pane.elements;

					el2.root.style.display = 'none';
					if (el2.tab) el2.tab.setData('my-pane-is-current-one', false);

					if (typeof this.onHideAnyPane === 'function') this.onHideAnyPane(pane);
					if (typeof pane.onHide === 'function') pane.onHide(onHideOptions);
				}


				if (paneToShow === 'last') paneToShow = this.panes[this.panes.length-1];
				paneToShow = this.get(paneToShow);
				if (!paneToShow) return false;

				var _validPaneToShow = undefined;

				for (var _p = 0; _p < this.panes.length; _p++) {
					var pane = this.panes[_p];
					if (pane === paneToShow) {
						_validPaneToShow = pane;
					} else {
						_hideOnePane.call(this, pane, onHideOptions);
					}
				}

				if (_validPaneToShow && this.currentPane !== _validPaneToShow) {
					_showOnePane.call(this, _validPaneToShow, onShowOptions);
				}
			};
			this.getCurrentPane = function () { return this.currentPane; };

			this.clear();
		}),

		function (panesOwner, paneDefaultConstructor) {
			if (typeof panesOwner === 'object') {
				this.controllers.panesOwner = panesOwner;
			} else {
				e('Invalid "panesOwner" for '+this.classLogName+'.');
				return undefined;
			}

			if (typeof paneDefaultConstructor === 'function') {
				this.paneDefaultConstructor = paneDefaultConstructor;
			} else {
				// w('Invalid "paneDefaultConstructor" for '+this.classLogName+'.');
			}
		}
	);

	utilities.pagesManager = {
		pages: [],
		currentPage: undefined,
		pagesByNames: {},

		init: function (o) {
			// o.initShownPage: string or object, the page object or the id of the page
			if (this.pages.length<1) return false;

			o = o || {};
			o.initShowPageOptions = o.initShowPageOptions || {};

			this.setCurrentPageTo(0); // the default init page for safety
			this.showPage(o.initPageToShow, o.initShowPageOptions);
		},

		get: function (page) {
			if (typeof page === 'number' ) {
				page = this.pages[page];
			} else if (typeof page === 'string') {
				page = this.pagesByNames[page];
			}

			if (this.pages.has(page)) {
				return page;
			} else {
				return this.currentPage;
			}
		},

		setCurrentPageTo: function (page) {
			this.currentPage = this.get(page);
			utilities.modalsManager.currentModal = this.currentPage;
		},

		add: function (page, initOptions, shouldNotWarn) {
			var pageIsValid = false;
			if (page && page.name) {
				var el = qS('[data-page-name="'+page.name+'"]');
				pageIsValid = !!el;
				if (pageIsValid && this.pages.hasNo(page)) {
					page.elements.root = el;
					utilities.modalsManager.modals['page-'+page.name] = page;
					this.pagesByNames[page.name] = page;
					this.pages.push(page);

					if (typeof this.onInitAnyPage === 'function') this.onInitAnyPage(page);
					if (typeof page.init === 'function') page.init(initOptions);
				} 
			}

			if (!pageIsValid && !shouldNotWarn) {
				w('Can not find page "'+page.name+'". Skipped.');
				return false;
			}
		},

		showPage: function (pageToShow, o) {
			o = o || {};
			pageToShow = this.get(pageToShow);

			var lastShownPage = this.currentPage;
			// if (pageToShow === lastShownPage) return false;
			// l('----------------------------------------');
			if (pageToShow !== lastShownPage) {
				// l('hide--: [last shown page]', '<'+lastShownPage.name+'>');
				this.hidePage(lastShownPage);
			}

			// l('show==>:', '<'+pageToShow.name+'>', typeof pageToShow.onShow);
			pageToShow.elements.root.style.display = '';
			if (typeof this.onShowAnyPage === 'function') this.onShowAnyPage(pageToShow);
			if (typeof pageToShow.onShow === 'function') pageToShow.onShow(o);
			
			this.setCurrentPageTo(pageToShow);

			this.pages.forEach(function (page, i, pages) {
				var shouldHide = page !== lastShownPage && page !== pageToShow;
				if (shouldHide) {
					// l('hide--:', '<'+page.name+'>');
					page.elements.root.style.display = 'none';
				}
			}, this);
		},

		hidePage: function (pageToHide) {
			pageToHide = this.get(pageToHide);
			if (typeof pageToHide.onHide === 'function') pageToHide.onHide();
			pageToHide.elements.root.style.display = 'none';
		},
	};

	utilities.modalsManager = {
		currentModal: undefined,
		modals: {},
		init: function () {
			document.addEventListener('keydown', this.documentOnKeyDown.bind(this));
			document.addEventListener('keypress', this.documentOnKeyPress.bind(this));
			document.addEventListener('keyup', this.documentOnKeyUp.bind(this));
		},
		assignKeyToElementOfModal: function(modal, element, key) {
			setTimeout((function () {
				this.keys[key] = element;
			}).bind(modal), 1);
		},
		documentOnKeyDown: function(event) {
			var k = event.keyCode;
			if (utilities.pagesManager.currentPage) {
				var modal = this.currentModal;
				if (!modal) return false;
				if (typeof modal.onKeyDown === 'function') {
					modal.onKeyDown.call(utilities.pagesManager.currentPage, event);
					return k;
				}
				return false;
			}
		},
		documentOnKeyPress: function(event) {
			var k = event.keyCode;
			if (utilities.pagesManager.currentPage) {
				var modal = this.currentModal;
				if (!modal) return false;
				if (typeof modal.onKeyPress === 'function') {
					modal.onKeyPress.call(utilities.pagesManager.currentPage, event);
					return k;
				}
				return false;
			}
		},
		documentOnKeyUp: function(event) {
			var k = event.keyCode;
			if (utilities.pagesManager.currentPage) {
				var modal = this.currentModal;
				if (!modal || !modal.keys) return false;
				if (modal.keys['enter'] && k===13 && !event.shift && !event.ctrlKey && !event.altKey && typeof modal.onKeyEnterUp === 'function') {
					modal.onKeyEnterUp(event);
					return k;
				}
				if (modal.keys['spacebar'] && k===32 && !event.shift && !event.ctrlKey && !event.altKey && typeof modal.onKeySpacebarUp === 'function') {
					modal.onKeySpacebarUp(event);
					return k;
				}
				if (typeof modal.onKeyUp === 'function') {
					modal.onKeyUp.call(utilities.pagesManager.currentPage, event);
					return k;
				}
				return false;
			}
		}
	};

	utilities.modalsManager.init();

	utilities.expandableElementsManager = new utilities.ExpandableElementsManager();
	utilities.defaultPopupLayersManager = new utilities.PopupLayersManager();
	// utilities.stopAnimationCausedByCssClass = utilities.stopAnimationCausedByCssClassFor; // for backwards compatability
})(window.sidlynk);


(function ($F) { // utilities: part 4: canvasPainter
	var utilities = $F.utilities;

	utilities.canvasPainter = {
		data: {
			context2DSupported: false,
			transparentColor: { r: 0, g: 0, b: 0, a: 0 }
		},
		init: function () {
			var canvas = document.createElement('canvas');
			var _C = canvas.getContext('2d');
			if (!_C) {
				this.data.context2DSupported = false;
				return false;
			}
			this.data.context2DSupported = true;
		},
		paintTiledImage: function (imageUrl, onPaintEnd, options) {
			if (!this.data.context2DSupported) return false;

			if (typeof imageUrl !== 'string' || imageUrl.length < 1) return false;
			if (typeof onPaintEnd !== 'function') {
				e('No onPaintEnd! There would be no way for you to get the final canvas image.');
				return false;
			}

			var image = new Image(); 
			image.onload = paintOnImageLoaded.bind(this, image, options);
			image.src = imageUrl;

			function guessBackgroundColor (imageData, x, y, w, h) {
				var GBC; // Guessed Background Color

				var bCGuessingColors = this.getRectAreaColorsOfImageData(imageData, x, y, w, h);
				var MSD = this.getMeanSquareDeviationOfAGroupOfColors(
					bCGuessingColors,
					bCGuessingColors[0]
				);

				// l('Mean square deviation of a group of colors:', MSD);
				if (MSD < 0.16 * 255) {
					GBC = this.getAverageColorOf(bCGuessingColors);
				} else {
					GBC = this.data.transparentColor;
				}

				return GBC;
			}

			function fxGrascaleSpecial (canvas, keyingColor) {
				if (!this.data.context2DSupported || !canvas) return false;

				var _C = canvas.getContext('2d');
				var _I = this.generateSnapshotImage(canvas);
				var data = _I.data;


				for (var i = 0; i < data.length; i += 4) {
					var c = { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] };

					var sD = this.getSquareDistanceOfTwoColors(c, keyingColor);
					var threshold = 0.16 * 255;
					var veryClose = sD < (threshold * threshold);
					if (veryClose || c.a < 32 || (Math.max(c.r, c.g, c.b) < 32)) {
						data[i]   = 0;
						data[i+1] = 0;
						data[i+2] = 0;
						data[i+3] = 0;
					} else {
						var validCount = 0;
						if (data[i]   > 64) validCount++; else data[i]   = 0;
						if (data[i+1] > 64) validCount++; else data[i+1] = 0;
						if (data[i+2] > 64) validCount++; else data[i+2] = 0;
						if (validCount > 0) {
							var gray = Math.min(192, Math.ceil((c.r+c.g+c.b)/validCount));
							data[i]   = gray;
							data[i+1] = gray;
							data[i+2] = gray;
						}
					}
				}

				_C.putImageData(_I, 0, 0);
			}

			function paintOnImageLoaded (imageElement, options) {
				options = options || {};
				var _iW = parseFloat(options.imagePrintWidth) || 64;


				var canvas = document.createElement('canvas');
				var _C = canvas.getContext('2d');

				var rawW = imageElement.width;
				var rawH = imageElement.height;

				var pictureRatio = rawW / rawH;
				var printRatio = _iW / rawW;
				var _iH = rawH * printRatio;

				var firstPrintLeft = _iW * -0.3;
				var firstPrintTop  = 10;



				var a = options.gapRatioOfSmallerSide || 1,
					b = options.gapRatioOfBiggerSide || 2,
					c = 0.5;

				var printGapX = _iW * b;
				var printGapY = _iH * a;

				if (pictureRatio < 1) {
					printGapX = _iW * a;
					printGapY = _iH * b;
				}

				var _tileW = _iW + printGapX;
				var _tileH = _iH + printGapY;


				var secondPrintLeft = firstPrintLeft + _tileW * c;

				var _cW = _tileW;
				var _cH = _tileH * 2;

				canvas.width  = _cW;
				canvas.height = _cH;

				_C.drawImage(imageElement, firstPrintLeft,           firstPrintTop,          _iW, _iH);
				_C.drawImage(imageElement, firstPrintLeft  + _tileW, firstPrintTop,          _iW, _iH);
				_C.drawImage(imageElement, firstPrintLeft  - _tileW, firstPrintTop,          _iW, _iH);
				_C.drawImage(imageElement, secondPrintLeft,          firstPrintTop + _tileH, _iW, _iH);
				_C.drawImage(imageElement, secondPrintLeft - _tileW, firstPrintTop + _tileH, _iW, _iH);
				_C.drawImage(imageElement, secondPrintLeft + _tileW, firstPrintTop + _tileH, _iW, _iH);



				var imageData = this.generateSnapshotImageFromImageElement(imageElement);
				// Guess the background color
				var keyingColor = guessBackgroundColor.call(this, imageData, 0, 0, 8, 8);

				// imageData = this.autoCropImage(imageData, keyingColor);

				fxGrascaleSpecial.call(this, canvas, keyingColor);

				// call event handler
				onPaintEnd(canvas);
			}
		},
		generateSnapshotImageFromImageElement: function (imageElement) {
			if (!this.data.context2DSupported || !imageElement) return false;
			var _tempCanvas = document.createElement('canvas');
			_tempCanvas.width  = imageElement.width;
			_tempCanvas.height = imageElement.height;
			_tempCanvas.getContext('2d').drawImage(imageElement, 0, 0);

			return this.generateSnapshotImage(_tempCanvas);
		},
		generateSnapshotImage: function (canvas) {
			if (!this.data.context2DSupported || !canvas) return undefined;
			var imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
			return imageData;
		},
		generateSnapshotUrl: function (canvas) {
			if (!this.data.context2DSupported || !canvas) return '';
			return canvas.toDataURL('image/png');
		},
		getPixelColorOfImageData: function (imageData, x, y) {
			if (!imageData || !imageData.data) return undefined;
			var data = imageData.data;

			x = parseInt(x);
			y = parseInt(y);
			if (isNaN(x) || isNaN(y)) return undefined;

			var _W = imageData.width;
			var _H = imageData.height;

			if (x<0) x = Math.max(0, _W + x);
			if (y<0) y = Math.max(0, _H + y);

			var dataSize = 4; // rgba
			var i = (x*_W + y)*dataSize;

			return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] };
		},
		getRectAreaColorsOfImageData: function (imageData, x, y, w, h) {
			// h is optional. default h=w
			var colors = [];

			if (!imageData || !imageData.data) return colors;
			var data = imageData.data;

			x = parseInt(x);
			y = parseInt(y);
			w = parseInt(w);
			h = parseInt(h);
			if (isNaN(x) || isNaN(y) || isNaN(w)) return colors;
			if (isNaN(h)) h = w;

			var dX = w >= 0 ? 1 : -1;
			var dY = h >= 0 ? 1 : -1;

			for (var i = 0; i < h; i+=dY) {
				for (var j = 0; j < w; j+=dX) {
					colors.push(this.getPixelColorOfImageData(imageData, x+j, y+i));
				}
			}

			return colors;
		},
		getAverageColorOf: function (colors) {
			if (!Array.isArray(colors)) return NaN;
			if (colors.length === 0) return NaN;
			if (colors.length === 1) return colors[0];

			var count = colors.length;
			var sum = this.data.transparentColor;
			for (var i = 0; i < count; i++) {
				sum.r += colors[i].r;
				sum.g += colors[i].g;
				sum.b += colors[i].b;
				sum.a += colors[i].a;
			}
			return {
				r: sum.r/count,
				g: sum.g/count,
				b: sum.b/count,
				a: sum.a/count
			};
		},
		getVarianceOfAGroupOfColors: function (colors, refColor) {
			if (!Array.isArray(colors)) return NaN;
			if (colors.length === 0) return NaN;
			if (colors.length === 1) return 0;

			if (!refColor) refColor = this.getAverageColorOf(colors);

			var variance = 0;
			for (var i = 0; i < colors.length; i++) {
				variance += this.getSquareDistanceOfTwoColors(colors[i], refColor);
			}

			return Math.sqrt(variance);
		},
		getMeanSquareDeviationOfAGroupOfColors: function(colors, refColor) {
			if (!Array.isArray(colors)) return NaN;
			if (colors.length === 0) return NaN;
			if (colors.length === 1) return 0;

			return this.getVarianceOfAGroupOfColors(colors, refColor) / colors.length;
		},
		getSquareDistanceOfTwoColors: function (c1, c2) {
			if (!c1 || !c2) return NaN;
			return (c1.r-c2.r)*(c1.r-c2.r) + (c1.g-c2.g)*(c1.g-c2.g) + (c1.b-c2.b)*(c1.b-c2.b);
		},
		getDistanceOfTwoColors: function (c1, c2) {
			if (!c1 || !c2) return NaN;
			return Math.sqrt(this.getSquareDistanceOfTwoColors(c1, c2));
		},
		distanceOfTwoColorsIsWithinRadius: function (c1, c2, radius) {
			if (!c1 || !c2) return undefined;
			if (radius<0) return false;
			if (radius===0 && c1.r===c2.r && c1.g===c2.g && c1.b===c2.b) return true;
			return this.getSquareDistanceOfTwoColors(c1, c2) < radius*radius;
		},
		autoCropImage: function (imageData, keyingColor) {
			w('not implemented yet!');
			return imageData;
		},
		fxGrascale: function (canvas) {
			if (!this.data.context2DSupported || !canvas) return false;

			var _C = canvas.getContext('2d');
			var _I = this.generateSnapshotImage(canvas);
			var data = _I.data;

			for (var i = 0; i < data.length; i += 4) {
				var r = data[i];
				var g = data[i + 1];
				var b = data[i + 2];
				data[i] = data[i + 1] = data[i + 2] = data[i + 3] = (r+g+b)/3;
			}

			_C.putImageData(_I, 0, 0);
		}
	};

	utilities.canvasPainter.init();
})(window.sidlynk);
