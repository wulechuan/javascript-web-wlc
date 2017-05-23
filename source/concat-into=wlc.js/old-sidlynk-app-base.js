/* old sidlynk app base */

/* global
	wlcJS isDom l w e t $ arrayHas
 */

window.l = window.console.log.bind(window.console);
window.w = window.console.warn.bind(window.console);
window.e = window.console.error.bind(window.console);
window.t = window.console.trace.bind(window.console);
window.sidlynk = {};
// $F means my framework

(function ($F) {
	// utilities
	var u = {
		setRole: function(el, role) {
			el.setAttribute('role', role);
		},

		enable: function(el, shouldFocus) { // button or input or textarea or select
			el.removeAttribute('disabled');
			el.disabled = false;
			if (shouldFocus) el.focus();
		},

		disable: function(el) { // button or input or textarea or select
			el.setAttribute('disabled', '');
			el.disabled = true;
			el.blur();
		},

		jsonToUrlParameters: function(json) {
			json = json || {};

			var parametersUrl = '';
			var i=0;

			for (var key in json) {
				parametersUrl += key + '=' + json[key] + '&';
				i++;
			}
			parametersUrl = parametersUrl.slice(0,-1);
			if (i>0) parametersUrl = '?' + parametersUrl;
			return parametersUrl;
		},

		jumpToUrl: function(url, parameters) {
			url += this.jsonToUrlParameters(parameters);
			// l(url);
			window.location.assign(url);
		},

		downloadFile: function(sUrl) {
			//http://pixelscommander.com/en/javascript/javascript-file-download-ignore-content-type/

			if ($F.app.env.engine.webkit) {

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
		},

		cookie: {
			exists: function (itemName) {
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
		},

		validator: {
			checkInput: function (input) {
				if (!isDom(input) || input.nodeName.toLowerCase() !== 'input' || !input.hasAttribute('required')) return false;

				switch(input.type) {
					case 'email': return this.checkEmailAddress(input);
					case 'text':
					default: return true;
				}
			},

			checkEmailAddress: function (email) {
				if (isDom(email) && email.nodeName.toLowerCase() === 'input') email = email.value;
				return /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}/.test(email);
			},

			checkMobileNumber: function (mobile, location) {
				if (isDom(mobile) && mobile.nodeName.toLowerCase() === 'input') mobile = mobile.value;
				mobile = mobile.replace(/\s|-/g, '');

				var isValid = false;
				var targetLength = '13800138000'.length;

				if (!location || typeof location !== 'string') {
					location==='cn';
				} else {
					location = location.toLowerCase();
				}

				switch (location) {
					case 'cn': {
						isValid =
								mobile.length === targetLength
							&&	mobile.replace(/\D/, '').length === targetLength
							&&	mobile.charAt(0) === '1';
						break;
					}
					default:
				}

				return isValid;
			},
		},

		paginator: function (rootElement, currentPageIndex, initOptions) {
			if (!wlcJS.domTools.isDom(rootElement)) {
				e('Invalid element for the rootElement of a {paginator} object.');
				return;
			}

			var _thisPaginator = {
				elements: {
					root: rootElement,
					buttonFirstPage: null,
					buttonLastPage: null,
					buttonsWithIndices: []
				},

				pagesCount: NaN,
				currentPageIndex: NaN,

				shownPagesCountMax: 5,
				shownPageIndexFirst: NaN,
				shownPageIndexLast: NaN,

				updateTheLook: function () {
					var _b = 0;
					var el = this.elements;

					if (this.currentPageIndex===1) {
						u.disable(el.buttonFirstPage);
					} else {
						u.enable(el.buttonFirstPage);
					}

					if (this.currentPageIndex===this.pagesCount) {
						u.disable(el.buttonLastPage);
					} else {
						u.enable(el.buttonLastPage);
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
				},

				generateUrl: function (pageIndex) { // for anchor <a> elements
					// return '/some-url/' + u.jsonToUrlParameters({ page: pageIndex });
				},

				onGotoPage: function (pageIndex) { // for non anchor elements, aka buttons
					// please return true to allow subsequence actions
					return true;
				},

				gotoPage: function (pageIndex) {
					_gotoPage.call(this, pageIndex);
				},
			};

			function _rebuild(currentPageIndex, o) {
				o = o || {};

				var hasPagination = _decidePageIndices.call(this,
					currentPageIndex,
					{
						pagesCount: o.pagesCount
					}
				);

				if (!hasPagination) {
					this.elements.root.innerHTML = '';
					return false;
				}

				this.buttonsAreAnchors = !!o.buttonsAreAnchors;

				var el = this.elements;

				el.buttonFirstPage =  el.root.querySelector('[data-pagination-target="first-page"]');
				el.buttonLastPage =  el.root.querySelector('[data-pagination-target="last-page"]');

				if (el.buttonFirstPage) {
					u.enable(el.buttonFirstPage); // just for safety
					_linkButtonToPage.call(this, el.buttonFirstPage, 1);
				} else {
					_buildButtonForFirstPage.call(this, Math.max(1, this.shownPageIndexFirst-1));
				}

				if (el.buttonLastPage) {
					u.enable(el.buttonLastPage); // just for safety
					_linkButtonToPage.call(this, el.buttonLastPage, this.pagesCount);
				} else {
					_buildButtonForLastPage.call(this, Math.min(this.pagesCount, this.shownPageIndexLast+1));
				}

				for (var p = this.shownPageIndexFirst; p <= this.shownPageIndexLast; p++) {
					var button = _buildButtonForPage.call(this, p);
					this.elements.buttonsWithIndices.push(button);
				}

				this.updateTheLook();

				return true;
			}

			function _decidePageIndices(currentPageIndex, o) {
				var _temp;

				_temp = parseInt(o.pagesCount);
				if (!isNaN(_temp) && _temp > 0) this.pagesCount = _temp;

				var pagesCount = this.pagesCount;
				var hasPagination = pagesCount && pagesCount > 1;
				if (!hasPagination) return false;



				currentPageIndex = parseInt(currentPageIndex);
				if (isNaN(currentPageIndex)) currentPageIndex = 1;
				currentPageIndex = Math.max(1, Math.min(currentPageIndex, pagesCount));
				this.currentPageIndex = currentPageIndex;



				var maxMarginIndexBeforeCurrent = Math.floor(this.shownPagesCountMax / 2);

				this.shownPageIndexFirst = Math.max(1, currentPageIndex - maxMarginIndexBeforeCurrent);
				this.shownPageIndexLast = this.shownPageIndexFirst + this.shownPagesCountMax - 1;

				var lackedPagesCount = Math.max(0, this.shownPageIndexLast - pagesCount);
				if (lackedPagesCount>0) {
					this.shownPageIndexLast = pagesCount;
					this.shownPageIndexFirst = Math.max(1, pagesCount - this.shownPagesCountMax + 1);
				}

				// l(
				// 	'maxMarginIndexBeforeCurrent', maxMarginIndexBeforeCurrent,
				// 	'\n this.shownPageIndexLast:', this.shownPageIndexLast,
				// 	'\n lackedPagesCount:', lackedPagesCount
				// );

				return true;
			}

			function _buildButton(paginationTargetType, pageIndex, textContent) {
				if (typeof pageIndex === 'undefined') {
					switch (paginationTargetType) {
						case 'first-page':	pageIndex = 1; break;
						case 'last-page':	pageIndex = this.pagesCount; break;
						default: // weird!
					}
				}

				if (typeof textContent === 'undefined') textContent = pageIndex;

				// var el = this.elements;
				var button;

				if (this.buttonsAreAnchors) {
					button = document.createElement('A');
					button.setAttribute('role', 'button');
				} else {
					button = document.createElement('BUTTON');
				}

				button.dataset.paginationTarget = paginationTargetType;
				button.textContent = textContent;

				_linkButtonToPage.call(this, button, pageIndex);

				return button;
			}

			function _buildButtonForFirstPage(pageIndex) {
				var el = this.elements;
				var button = _buildButton.call(this, 'first-page', pageIndex, pageIndex);
				el.root.appendChild(button, el.buttonLastPage);
				el.buttonFirstPage = button;
				return button;
			}

			function _buildButtonForLastPage(pageIndex) {
				var el = this.elements;
				var button = _buildButton.call(this, 'last-page', pageIndex, pageIndex);
				el.root.appendChild(button, el.buttonLastPage);
				el.buttonLastPage = button;
				return button;
			}

			function _buildButtonForPage(pageIndex) {
				var el = this.elements;
				var button = _buildButton.call(this, 'page', pageIndex);

				if (el.buttonLastPage) {
					el.root.insertBefore(button, el.buttonLastPage);
				} else {
					el.root.appendChild(button);
				}
				return button;
			}

			function _linkButtonToPage(button, pageIndex) {
				button.thisPaginator = this;
				button.dataset.paginationIndex = pageIndex;

				if (button.nodeName.toUpperCase() === 'A') {
					button.href = this.generateUrl(pageIndex);
				} else {
					button.addEventListener('click', _buttonOnClick.bind(this));
				}
			}

			function _buttonOnClick(event) {
				var button = event.target;
				var pageIndex = parseInt(button.dataset.paginationIndex);
				_gotoPage.call(button.thisPaginator, pageIndex);
			}

			function _gotoPage(pageIndex) {
				if (pageIndex===this.currentPageIndex) return true;
				var successful = this.onGotoPage(pageIndex);
				if (!successful) return false;
				this.currentPageIndex = pageIndex;
				this.updateTheLook();
			}

			return (function () {
				if (!_rebuild.call(this, currentPageIndex, initOptions)) return undefined;

				return this;
			}).call(_thisPaginator);
		}
	};

	u.popupLayersService = new (function (initOptions) {

		var _popupLayersService = this;

		this.backplateIsShown = false;
		this.layers = [];
		this.shownLayers = [];

		this.elements = {
			root: null,
			popupLayerWrap: null, // incase we don't want the root container to be the direct parentNode of all popup layers
			backplate: null
		};

		this.options = {
			popupLayerWrapIsNotRoot: false,
			backplateShowingDuration: 333,
			backplateHidingDuration: 333
		};


		function _tryCreatingPopupWindowsContainer() {
			var el = this.elements;
			if (!el.root) {
				el.root = document.querySelector('body > [role="popup-layers-container"]');
			}
			if (!el.root) {
				el.root = document.createElement('DIV');
				el.root.setAttribute('role', 'popup-layers-container');
				document.body.appendChild(el.root);
			}

			if (this.options.popupLayerWrapIsNotRoot) {
				el.popupLayerWrap = el.root;
			} else {
				el.popupLayerWrap = el.root.querySelector('[role="popup-layers-wrap"]');

				if (!el.popupLayerWrap) {
					el.popupLayerWrap = document.createElement('DIV');
					el.popupLayerWrap.setAttribute('role', 'popup-layers-wrap');
					el.root.appendChild(this.elements.popupLayerWrap);
				}
			}
		}

		function _tryCreatingBackplate() {
			_tryCreatingPopupWindowsContainer.call(this);

			if (!this.elements.backplate) {
				this.elements.backplate = document.querySelector('body > [role="popup-layers-container"] [role="popup-layers-backplate"]');
			}
			if (!this.elements.backplate) {
				this.elements.backplate = document.createElement('div');
				// this.elements.backplate.id = 'backplate';
				this.elements.backplate.setAttribute('role', 'popup-layers-backplate');
				this.elements.backplate.style.display = 'none';

				var firstChild = this.elements.root.firstChild;
				if (firstChild) {
					this.elements.root.insertBefore(this.elements.backplate, firstChild);
				} else {
					this.elements.root.appendChild(this.elements.backplate);
				}
			}

			this.elements.backplate.addEventListener('click', function () {
				var _shownLayers = _popupLayersService.shownLayers;
				if (_shownLayers.length>1 || _shownLayers[0].options.hideOnBackplateClick === false) {
					return false;
				}
				_popupLayersService.hideAllWindows();
			});
		}

		this.createPopupLayer = function(rootElement, options) {
			_tryCreatingBackplate.call(this);
			window.addEventListener('resize', this.refreshAllWindows.bind(this));
			var _newLayer = _createPopupLayer(rootElement, options);
			if (_newLayer) {
				this.layers.push(_newLayer);
				this.elements.popupLayerWrap.appendChild(_newLayer.elements.root);
			}
			return _newLayer;
		};

		this.showBackplate = function() {
			this.dontHideBackplateSoQuickly = true;
			// l('A popup layer is going to show up. So don\'t hide the backplate so quickly!');
			if (!this.backplateIsShown) {
				this.elements.backplate.show(this.options.backplateShowingDuration);
				this.backplateIsShown = true;
			}
			// window.setTimeout(function () {
			// 	l('OK, popupLayer done. Now we can hide backplate anytime we\'d like to.');
			// 	this.dontHideBackplateSoQuickly = false;
			// }, 10);
		};

		this.hideBackplate = function() {
			// l('Hide? Let\'s wait for a moment rather.');
			this.dontHideBackplateSoQuickly = false;
			window.setTimeout((function () {
				if (this.backplateIsShown && !this.dontHideBackplateSoQuickly) {
					// l('Ok, I\' hide.');
					this.elements.backplate.hide(this.options.backplateHidingDuration);
					this.backplateIsShown = false;
				} else {
					// l('See, no need to hide backplate, right?');
				}
			}).bind(this), 10);
		};

		this.hideAllWindows = function() {
			this.shownLayers.forEach(function (popupLayer) { popupLayer.hide(); });
		};

		this.refreshAllWindows = function() {
			this.shownLayers.forEach(function (popupLayer) { popupLayer.refresh(); });
		};

		this.prepareShowingPopupWindow = function(popupLayer, showBackplate) {
			if (!this.shownLayers.has(popupLayer)) {
				this.shownLayers.push(popupLayer);
			}
			if (showBackplate) {
				this.showBackplate();
			}
		};

		this.prepareHidingPopupLayer = function(popupLayer) {
			this.shownLayers.del(popupLayer);
			var countOfLayersWhoRequireBackplate = 0;
			for (var _l = 0; _l < this.shownLayers.length; _l++) {
				if (this.shownLayers[_l].options.showBackplate) countOfLayersWhoRequireBackplate++;
			}
			if (countOfLayersWhoRequireBackplate < 1)
				this.hideBackplate();
		};


		function _createPopupLayer(rootElement, initOptions) {
			// options = {
			//		centered:				boolean		<default=true>
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
			//		offsetX:				Number		<default=0, unit=px>, ONLY takes effects when centered is true
			//		offsetY:				Number		<default=0, unit=px>, ONLY takes effects when centered is true
			//
			//		showingDuration:		Number		<default=333, unit=ms>
			//		hidingDuration:	 		Number		<default=333, unit=ms>
			//
			//		autoHide:				boolean		<default=false>
			//		autoHideDelayDuration:	Number		<default=1500, unit=ms>, ONLY takes effects when autoHide is true
			//
			//		showBackplate:			boolean		<default=true>, could be OVERRIDED by argument of show() method, if that argument is provided.
			//		hideOnBackplateClick:	boolean		<default=false>
			//
			//		showButtons:			[ array of elements ]
			//		hideButtons:			[ array of elements ]
			//		toggleButtons:			[ array of elements ]
			//
			//		minMarginTop:			Number <default=10>
			//		minMarginRight:			Number <default=10>
			//		minMarginBottom:		Number <default=10>
			//		minMarginLeft:			Number <default=10>
				// }

			// this.buttonsWhoShowMe		is the getter that does same as			this.options.showButtons
			// this.buttonsWhoHideMe		is the getter that does same as			this.options.hideButtons
			// this.buttonsWhoToggleMe		is the getter that does same as			this.options.toggleButtons

			if (!wlcJS.domTools.isDom(rootElement)) {
				e('Invalid element for the rootElement of a {popupLayer} object.');
				return;
			}

			var _thisPopupLayer = {

				elements: {
					root: rootElement
				},
				logName: 'popupLayer "#'+rootElement.id+'"',
				isShown: false,

				options: {
					centered: true,
					centerRef: window,
					offsetX: 0,
					offsetY: 0,

					minMarginTop: 10,
					minMarginRight: 10,
					minMarginBottom: 10,
					minMarginLeft: 10,
						
					showingDuration: 333,
					hidingDuration: 333,

					autoHide: undefined,
					autoHideDelayDuration: 1500,

					showBackplate: true,
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
				toggle: function () { _toggle.call(this); },
				onshow: undefined,
				onhide: undefined
			};



			function _config(o, _allowWarning) {
				o = o || {};
				var _o = this.options;
				_allowWarning = (typeof _allowWarning === 'undefined') || !!_allowWarning;

				if (o.hasOwnProperty('onshow') && typeof o.onshow === 'function') this.onshow = o.onshow;
				if (o.hasOwnProperty('onhide') && typeof o.onhide === 'function') this.onhide = o.onhide;
				if (o.hasOwnProperty('onRelocateEnd') && typeof o.onRelocateEnd === 'function') this.onRelocateEnd = o.onRelocateEnd;

				if (o.hasOwnProperty('centered')) { _o.centered = !!o.centered; }
				if (o.hasOwnProperty('autoHide')) { _o.autoHide = !!o.autoHide; }
				if (o.hasOwnProperty('showBackplate')) {
					_o.showBackplate = !!o.showBackplate;
				} else {
					if (typeof _o.autoHide != 'undefined') {
						_o.showBackplate = !_o.autoHide;
					}
				}

				if (o.hasOwnProperty('hideOnBackplateClick')) {
					_o.hideOnBackplateClick = !!o.hideOnBackplateClick && _o.showBackplate;
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
					o.centerRef && (
						o.centerRef == document.documentElement ||
						o.centerRef == document ||
						o.centerRef == document.body ||
						o.centerRef == window ||
						o.centerRef == this.elements.root.parentNode ||
						o.centerRef.toLowerCase() === 'parent' ||
						o.centerRef.toLowerCase() === 'parentnode'
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
						_o.centerRef = this.elements.root.parentnode;
					}
				}

				if (Array.isArray(o.showButtons)) {
					this.clearShowButtons();
					this.addShowButtons(o.showButtons, _allowWarning);
				}
				if (Array.isArray(o.hideButtons)) {
					this.clearHideButtons();
					this.addHideButtons(o.hideButtons, _allowWarning);
				}
				if (Array.isArray(o.toggleButtons)) {
					this.clearToggleButtons();
					this.addToggleButtons(o.toggleButtons, _allowWarning);
				}


				if (_allowWarning && this.options.hideButtons.length === 0 && this.options.toggleButtons.length === 0 && !this.options.autoHide) {
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
					if ( wlcJS.domTools.isDom(element) ) {
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
								w( 'Element already in array "'+elementAlreadyInArrayName+'". Ignored.\nThe element metioned is', element, '\n');
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
					if ( wlcJS.domTools.isDom(element) ) {
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
				if (this.options.centered) {
					this.elements.root.centerTo({
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
				if (this.isShown) {
					// l(this.logName+' has already been opened. Skipped.');
					// return false;
				}
				this.isShown = true;

				o = o || {};
				o.showBackplate = (o.hasOwnProperty('showBackplate')) ? !!o.showBackplate : !!this.options.showBackplate;
				o.autoHide = (o.hasOwnProperty('autoHide')) ? !!o.autoHide : !!this.options.autoHide;

				if (typeof this.onshow === 'function') this.onshow(o.onshowOptions);
				_popupLayersService.prepareShowingPopupWindow(this, o.showBackplate);

				this.elements.root.show(this.options.showingDuration);
				this.updateSizeAndPosition();

				if (o.autoHide) {
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

				if (typeof this.onhide === 'function') this.onhide();

				_popupLayersService.prepareHidingPopupLayer(this);
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

				// l(this.logName+':\n\tJust for conveniences, construcor is now automatically searching all possible hide-buttons:');
				this.addHideButtons([
					r.qS('[role="button-x"]'),
					// r.qS('.button-ok'),
					// r.qS('.button-confirm'),
					// r.qS('.button-yes')
				], false);

				return this;
			}).apply(_thisPopupLayer);
		}
	});

	var app = {
		language: {
			raw: 'en-US',
			isEnglish: true,
			isChinese: false
		},
		urlParameters: {},
		csrftoken: '',
		elements: {},

		env: (function () {

			function uaHas(inString)          { return navigator.userAgent.search(inString) >= 0; }
			function uaHasNot(inString)       { return navigator.userAgent.search(inString) <  0; }
			function platformHas(inString)    { return navigator.platform.search(inString)  >= 0; }
			function platformHasNot(inString) { return navigator.platform.search(inString)  <  0; }

			if (!window.location.origin) {
				window.location.origin =
						window.location.protocol
					+	'//'
					+	window.location.hostname
					+	(window.location.port ? ':'
					+	window.location.port: '');
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

			return {
				language: {
					raw: languageRaw,
					isChinese: isLanguageChinese,
					isEnglish: isLanguageEnglish
				},
				screen: {
					pixelRatio:		pixelRatio,
					mappedPixelX:	screenMappedPixelX,
					mappedPixelY:	screenMappedPixelY,
					physicalPixelX:	screenPhysicalPixelX,
					physicalPixelY:	screenPhysicalPixelY
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
					ie:				isIE,
					ie6:			isIE6,
					ie7:			isIE7,
					ie8:			isIE8,
					ie8OrOlder:		isIE8OrOlder,
					ie9:			isIE9,
					ie10:			isIE10,
					ieMorden:		isIE11orLater,
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
				device: {
					windowsPhone:	isWindowsPhone,
					wp:				isWindowsPhone,
					windowsRT:		isWindowsRT,
					ipod:			isIpod,
					ipad:			isIpad,
					iphone:			isIphone
				}
			};
		})(),

		init: function () {
			this.evaluateUrlParameters();
			this.fetchCrossSiteRequestForgeryToken();
			this.initLanguageSettings();

			var appRootEl = document.documentElement;
			var el = this.elements;

			if (this.env.mode.touch) {
				appRootEl.classList.add('touch-mode');
				appRootEl.classList.remove('non-touch-mode');
			} else {
				appRootEl.classList.add('non-touch-mode');
				appRootEl.classList.remove('touch-mode');
			}

			// el.appChiefLogo = appRootEl.querySelector('#app-chief-logo');

			el.appCopyrightYear = appRootEl.querySelector('#copyright-year');
			el.appCopyrightYear.textContent = new Date().getFullYear();
		},

		initLanguageSettings: function () {
			var appRootEl = document.documentElement;

			// this.language.raw = this.env.language.raw;
			// this.isEnglish = this.env.language.isEnglish;
			// this.isChinese = this.env.language.isChinese;

			if (this.urlParameters.lang) {
				if (this.urlParameters.lang === 'zh-CN') {
					this.language.raw = 'zh-CN';
					this.language.isChinese = true;
					this.language.isEnglish = false;
				}
			} else {
				var langTag = appRootEl.getAttribute('lang-tag');
				if (langTag==='中文简体' || langTag==='简体中文') {
					this.language.raw = 'zh-CN';
					this.language.isChinese = true;
					this.language.isEnglish = false;
				}
			}

			appRootEl.setAttribute('lang', app.language.raw);
			appRootEl.removeAttribute('lang-tag');
		},

		fetchCrossSiteRequestForgeryToken: function () {
			window.input = document.querySelector('[name=csrfmiddlewaretoken]');
			if (!window.input) return false;
			this.csrftoken = window.input.value;
			window.input.parentNode.removeChild(window.input);
			delete window.input;
		},

		evaluateUrlParameters: function () {
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
				json[pair[0]] = pair[1];
			}

			this.urlParameters = json;
			// l(this.urlParameters);
			return json;
		}
	};

	app.pagesManager = {
		pages: [],
		currentPage: undefined,
		pagesByIds: {},

		init: function (o) {
			// o.initShownPage: string or object, the page object or the id of the page
			if (this.pages.length<1) return false;

			o = o || {};
			o.initShowPageOptions = {};


			this.pages.forEach(function (page, i, pages) {
				var el = document.querySelector('#'+page.id);
				if (el) {
					page.elements.root = el;
					this.pagesByIds[page.id] = page;
					page.init();
				} else {
					console.error('Can not find page with id "'+page.id+'"');
					return false;
				}
			}, this);

			this.currentPage = this.pages[0]; // the default init page

			// l('init page id to show:', this.getPage(o.initPageToShow).element.id, o.initShowPageOptions);
			this.showPage(o.initPageToShow, o.initShowPageOptions);
		},

		getPage: function (pageOrPageId) {
			var page = null;
			if (typeof pageOrPageId === 'string') {
				page = this.pagesByIds[pageOrPageId];
			} else {
				page = pageOrPageId;
			}

			if (arrayHas(this.pages, page)) {
				return page;
			} else {
				return this.currentPage;
			}
		},

		showPage: function (pageToShow, o) {
			o = o || {};
			pageToShow = this.getPage(pageToShow);
			// l(this, pageToShow);

			var lastShownPage = this.currentPage;
			// if (pageToShow === lastShownPage) return false;

			if (pageToShow !== lastShownPage) {
				lastShownPage.onhide(pageToShow);
				lastShownPage.elements.root.style.display = 'none';
			}

			this.currentPage = pageToShow;
			pageToShow.elements.root.style.display = '';
			pageToShow.onshow(o);

			this.pages.forEach(function (page) {
				if (page !== lastShownPage && page !== this.currentPage) {
					page.elements.root.style.display = 'none';
				}
			}, this);
		}
	};

	app.keyboardManager = {
		init: function () {
			document.addEventListener('keyup', function (event) {
				if (app.pagesManager.currentPage) {
					app.pagesManager.currentPage.onKeyUp.call(app.pagesManager.currentPage, event);
				}
			});
		}
	};






	$F.utilities = u;
	$F.app = app;







	app.init();
	app.keyboardManager.init();
	replaceAllImagesWithCorrectLanguageVersions();

	window.onload = function () {
		setupAppFonts();
	};

	function replaceAllImagesWithCorrectLanguageVersions() {
		var imgs = Array.prototype.slice.apply(document.images);
		imgs.forEach(function (img) {
			if (app.language.isChinese && img.src.search('en-US') >= 0) {
				img.src = img.src.replace('en-US', 'zh-CN');
			}
		});
	}

	function setupAppFonts() {
		var style = document.createElement('STYLE');
		style.type = 'text/css';
		style.textContent = 'html, body, button, textarea, input, select, option { font-family: \'Segoe UI\', \'Segoe-UI-Remote\', \'Microsoft Yahei UI\', \'Microsoft Yahei\', \'Lucida Grande\', \'Lato\', \'Lato-Remote\', \'SimHei\'; }';
		document.head.appendChild(style);
	}
})(window.sidlynk);
