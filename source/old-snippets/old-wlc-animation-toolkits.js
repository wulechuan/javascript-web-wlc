/* LLY WAT.js */
/* global
    wlcJS isDomElement
*/


var WAT = new (function AnimationToolkits() {
	var _WAT = this;

	this.setScales = function(elements, scaleX, scaleY, scaleZ) {
		var _sX = wlcJS.getSafeNumber(scaleX, 1);
		var _sY = wlcJS.getSafeNumber(scaleY, _sX);
		var _sZ = wlcJS.getSafeNumber(scaleZ, _sX);
		wlcJS.arraylize(elements).forEach(function (element) {
			element.style.transform = 'scale3d('+_sX+','+_sY+','+_sZ+')';
		});
	};

	this.pauseAnimationsOf = function(elements) {
		wlcJS.arraylize(elements).forEach(function (element) {
			if (!isDomElement(element)) return undefined;
			element.animationIsRunning = false;
			element.style.webkitAnimationPlayState = 'paused';
			element.style.animationPlayState = 'paused';
		});
	};

	this.resumeAnimationsOf = function(elements) {
		wlcJS.arraylize(elements).forEach(function (element) {
			if (!isDomElement(element)) return undefined;
			element.animationIsRunning = true;
			element.style.webkitAnimationPlayState = 'running';
			element.style.animationPlayState = 'running';
		});
	};

	this.toggleAnimationsOf = function(elements) {
		wlcJS.arraylize(elements).forEach(function (element) {
			if (!isDomElement(element)) return undefined;
			if (typeof element.animationIsRunning === 'undefined') element.animationIsRunning = true;
			if (element.animationIsRunning) {
				element.animationIsRunning = false;
				element.style.webkitAnimationPlayState = 'paused';
				element.style.animationPlayState = 'paused';
			} else {
				element.animationIsRunning = true;
				element.style.webkitAnimationPlayState = 'running';
				element.style.animationPlayState = 'running';
			}
		});
	};

	this.clearAnimationsOf = function(elements) {
		wlcJS.arraylize(elements).forEach(function (element) {
			if (!isDomElement(element)) return undefined;
			element.animationIsRunning = false;
			element.style.webkitAnimationPlayState = '';
			element.style.animationPlayState = '';
			element.style.webkitAnimation = '';
			element.style.animation = '';
		});
	};

	this.applyAnimationTo = function(element, keyframesName, playState, duration, delay, iterationCount, direction, timingFunction, fillMode) {
		if (!isDomElement(element)) {
			return false;
		}

		keyframesName = String(keyframesName);
		if (keyframesName.length < 1) {
			return false;
		}

		// element.style.position = 'relative';

		playState = (typeof playState === 'undefined' || (!!playState && String(playState).toLowerCase()!='paused')) ? '' : 'paused';

		duration = Number(duration);
		duration = isNaN(duration) ? '0.6s' : (Math.max(0.05, duration)+'s');

		delay = Number(delay);
		delay = isNaN(delay) ? '0s' : (delay+'s');

		iterationCount = isNaN(Number(iterationCount)) ? (String(iterationCount).toLowerCase()==='infinite' ? 'infinite' : '1' ) : String(Number(iterationCount)); // don't care integer or not

		direction = String(direction);
		direction = (direction==='normal' || direction==='alternate' || direction==='reverse' || direction==='alternate-reverse') ? direction : 'normal';

		timingFunction = timingFunction ? String(timingFunction) : 'ease-in-out'; // be careful

		fillMode = String(fillMode);
		fillMode = (fillMode==='forwards' || fillMode==='backwards' || fillMode==='both') ? fillMode : 'both';

		var _cssAnimation = [
			keyframesName,
			duration,
			timingFunction,
			iterationCount,
			delay,
			direction,
			fillMode,
			playState
		].join(' ');

		// l(_cssAnimation);

		var animationEndEventName = '';
		if (typeof element.style.webkitAnimation != 'undefined') {
			element.style.webkitAnimation = _cssAnimation;
			element.style.webkitBackfaceVisibility = 'hidden';
			animationEndEventName = 'webkitAnimationEnd';
		} else {
			element.style.animation = _cssAnimation;
			animationEndEventName = 'animationend';
			element.style.backfaceVisibility = 'hidden';
		}

		var _eventHandlerOnAnimationEnd = function(event) {
			element.style.webkitAnimation = '';
			element.style.animation = '';
			// element.removeEventListener(animationEndEventName, _eventHandlerOnAnimationEnd);
		};

		element.addEventListener(animationEndEventName, _eventHandlerOnAnimationEnd);
	};

	this.batchApplyAnimationsTo = function(locatorsArray, keyframesName, playState, options, onLatestAnimationEnd) {
		// options {
			//	durationExp:		Number, <default = 0.4>
			//	durationVar:		Number, <default = 0>
			//	delayGlobal:		Number, <default = 0>
			//	delayEachStepExp:	Number, <default = 0>
			//	delayEachStepVar:	Number, <default = 0>
			//
			//	oneByOne:			boolean, <default = false>
			//						// Here oneByOne means extending delay accumulately
			//
			//	oneAfterOne:		boolean, <default = false>
			//						// oneAfterOne ONLY take effects when oneByOne is set true
			//						// Here oneAfterOne means extending delay further more,
			//						// so that the next animation won't even start counting its delay(fake)
			//						// until the previous animation running completely.
			//
			//	timingFunction:		<css standard values>
		// }

		var _ = options || {};

		_.durationExp = wlcJS.getSafeNumber(_.durationExp, 0.4);
		_.durationVar = wlcJS.getSafeNumber(_.durationVar, 0);

		_.delayGlobal = wlcJS.getSafeNumber(_.delayGlobal, 0);

		_.delayEachStepExp = wlcJS.getSafeNumber(_.delayEachStepExp, 0);
		_.delayEachStepVar = wlcJS.getSafeNumber(_.delayEachStepVar, 0);

		_.oneByOne =	!!_.oneByOne;
		_.oneAfterOne =	_.oneByOne && !!_.oneAfterOne;


		var _durationCurrent = NaN;

		var _delayGap = NaN;
		var _delayCurrent = _.delayGlobal;
		var _accumulativeDurationRatio = 1;
		var _accumulativeDurationRatioFactor = 0.97531;
		var _accumulativeDelayGapRatio = 1;
		var _accumulativeDelayGapRatioFactor = 0.87654321;

		var _lastestOneEndTime = 0;
		var _currentOneEndTime = 0;
		var _lastestOneId = locatorsArray.length-1;

		for (var i = 0; i < locatorsArray.length; i++) {
			_durationCurrent =	Math.randomAround(_.durationExp, _.durationVar) * _accumulativeDurationRatio;
			_delayGap =			Math.randomAround(_.delayEachStepExp, _.delayEachStepVar) * _accumulativeDelayGapRatio;

			_accumulativeDurationRatio = _accumulativeDurationRatio * _accumulativeDurationRatioFactor;
			_accumulativeDelayGapRatio = _accumulativeDelayGapRatio * _accumulativeDelayGapRatioFactor;

			if (_.oneByOne) {
				_delayCurrent += _delayGap;
			} else {
				_delayCurrent = _delayGap;
			}

			_currentOneEndTime = _delayCurrent + _durationCurrent;
			if (_currentOneEndTime >= _lastestOneEndTime) {
				_lastestOneEndTime = _currentOneEndTime;
				_lastestOneId = i;
			}

			WAT.applyAnimationTo(
				locatorsArray[i],
				keyframesName,
				playState,
				_durationCurrent,
				_delayCurrent,
				1,
				'normal',
				_.timingFunction,
				'both');

			_delayCurrent += (_.oneAfterOne ? _durationCurrent : 0);
			// l(_durationCurrent, _delayGap, _delayCurrent);
		}

		var _lastestOne = locatorsArray[_lastestOneId];
		var animationEndEventName = '';
		if (typeof _lastestOne.style.webkitAnimation != 'undefined') {
			animationEndEventName = 'webkitAnimationEnd';
		} else {
			animationEndEventName = 'animationend';
		}

		if (typeof onLatestAnimationEnd === 'function') {
			var _eventHandlerOnAnimationEnd = function (event) {
				onLatestAnimationEnd(event);
				_lastestOne.removeEventListener(animationEndEventName, _eventHandlerOnAnimationEnd);
			};
			_lastestOne.addEventListener(animationEndEventName, _eventHandlerOnAnimationEnd);
		}
	};

	this.batchApplyOneByOneAnimationsTo = function(locatorsArray, keyframesName, playState, options, onLatestAnimationEnd) {
		// options {
		//		durationExp:		Number, <default = 0.36>
		//		durationVar:		Number, <default = 0.08>
		//		delayGlobal:		Number, <default = 0>
		//		delayEachStepExp:	Number, <default = 0.12>
		//		delayEachStepVar:	Number, <default = 0.04>
		// }
		var _ = options || {};

		_.durationExp = wlcJS.getSafeNumber(_.durationExp, 0.36);
		_.durationVar = wlcJS.getSafeNumber(_.durationVar, 0.08);

		_.delayGlobal = wlcJS.getSafeNumber(_.delayGlobal, 0);

		_.delayEachStepExp = wlcJS.getSafeNumber(_.delayEachStepExp, 0.09);
		_.delayEachStepVar = wlcJS.getSafeNumber(_.delayEachStepVar, 0.02);

		_.oneByOne =	true;
		_.oneAfterOne =	_.oneByOne && !!_.oneAfterOne;

		this.batchApplyAnimationsTo(locatorsArray, keyframesName, playState, _, onLatestAnimationEnd);
	};


	this.presets = {
		oneByOneFlyIn: function(locatorsArray, playState, wakVarianceId, options, onLatestAnimationEnd) {
			//	wakVarianceId:		<Integer>

			wakVarianceId = wlcJS.getSafeNumber(wakVarianceId, 1);

			var _ = options || {};

			_.durationExp = wlcJS.getSafeNumber(_.durationExp, 0.69);
			_.durationVar = wlcJS.getSafeNumber(_.durationVar, 0.06);

			_.delayGlobal = wlcJS.getSafeNumber(_.delayGlobal, 0);

			_.delayEachStepExp = wlcJS.getSafeNumber(_.delayEachStepExp, 0.19);
			_.delayEachStepVar = wlcJS.getSafeNumber(_.delayEachStepVar, 0.02);

			_.oneByOne =	true;
			_.oneAfterOne =	false;

			_.timingFunction = _.timingFunction ? _.timingFunction : 'ease-in';

			_WAT.batchApplyOneByOneAnimationsTo(
				locatorsArray,
				'wak-flies-in-'+wakVarianceId,
				playState,
				_,
				onLatestAnimationEnd
			);
		},

		oneByOnePopOut: function(locatorsArray, playState, wakVarianceId, options, onLatestAnimationEnd) {
			//	wakVarianceId:		<Integer>

			wakVarianceId = wlcJS.getSafeNumber(wakVarianceId, 3);

			var _ = options || {};

			_.durationExp = wlcJS.getSafeNumber(_.durationExp, 0.69);
			_.durationVar = wlcJS.getSafeNumber(_.durationVar, 0.06);

			_.delayGlobal = wlcJS.getSafeNumber(_.delayGlobal, 0);

			_.delayEachStepExp = wlcJS.getSafeNumber(_.delayEachStepExp, 0.19);
			_.delayEachStepVar = wlcJS.getSafeNumber(_.delayEachStepVar, 0.02);

			_.oneByOne =	true;
			_.oneAfterOne =	false;

			_.timingFunction = _.timingFunction ? _.timingFunction : 'ease-in';

			_WAT.batchApplyOneByOneAnimationsTo(
				locatorsArray,
				'wak-pop-out-'+wakVarianceId,
				playState,
				_,
				onLatestAnimationEnd
			);
		},

		oneByOneRiseUp: function(locatorsArray, playState, wakVarianceId, options, onLatestAnimationEnd) {
			//	wakVarianceId:		<Integer>
			wakVarianceId = wlcJS.getSafeNumber(wakVarianceId, 1);

			var _ = options || {};

			_.durationExp = wlcJS.getSafeNumber(_.durationExp, 0.79);
			_.durationVar = wlcJS.getSafeNumber(_.durationVar, 0.219);

			_.delayGlobal = wlcJS.getSafeNumber(_.delayGlobal, 0);

			_.delayEachStepExp = wlcJS.getSafeNumber(_.delayEachStepExp, 0.19);
			_.delayEachStepVar = wlcJS.getSafeNumber(_.delayEachStepVar, 0.03);

			_.oneByOne =	true;
			_.oneAfterOne =	false;

			_WAT.batchApplyOneByOneAnimationsTo(
				locatorsArray,
				'wak-rises-up-'+wakVarianceId,
				playState,
				_,
				onLatestAnimationEnd
			);
		},

		oneByOneSlideInFromLeft: function(locatorsArray, playState, wakVarianceId, options, onLatestAnimationEnd) {
			//	wakVarianceId:		<Integer>
			wakVarianceId = wlcJS.getSafeNumber(wakVarianceId, 1);

			var _ = options || {};

			_.durationExp = wlcJS.getSafeNumber(_.durationExp, 0.45);
			_.durationVar = wlcJS.getSafeNumber(_.durationVar, 0.01);

			_.delayGlobal = wlcJS.getSafeNumber(_.delayGlobal, 0);

			_.delayEachStepExp = wlcJS.getSafeNumber(_.delayEachStepExp, 0.19);
			_.delayEachStepVar = wlcJS.getSafeNumber(_.delayEachStepVar, 0.03);

			_.oneByOne =	true;
			_.oneAfterOne =	false;

			_.timingFunction = 'ease-out';

			_WAT.batchApplyOneByOneAnimationsTo(
				locatorsArray,
				'wak-slide-in-from-left-'+wakVarianceId,
				playState,
				_,
				onLatestAnimationEnd
			);
		}
	};
});

