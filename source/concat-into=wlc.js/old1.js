/* old tianxialiangc wlcjs */

/* global
	jQuery zepto qS qSA add isDomNode isDomElement isDom prepare
*/

//////// IE8 begin ////////////////////////////////////////////////////////////////////////////////
var _isVeryOldIE =
		navigator.userAgent.indexOf('MSIE 8.')>0
	||	navigator.userAgent.indexOf('MSIE 7.')>0
	||	navigator.userAgent.indexOf('MSIE 6.')>0
	;

var fakeBind = !Function.prototype.bind || _isVeryOldIE;
if (fakeBind) {
	Function.prototype.bind = function (oThis) {
		if (typeof this !== 'function') {
			// closest thing possible to the ECMAScript 5
			// internal IsCallable function
			throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
		}

		var aArgs = Array.prototype.slice.call(arguments, 1), 
			fToBind = this, 
			fNOP = function () {},
			fBound = function () {
				return fToBind.apply(
					this instanceof fNOP && oThis
					? this
					: oThis,
					aArgs.concat(Array.prototype.slice.call(arguments))
				);
			};

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
}
//////// IE8 end //////////////////////////////////////////////////////////////////////////////////



var wlcJS = new (function () {
	var wlcJS = this, l, w, e;


	//////// IE8 begin ////////////////////////////////////////////////////////////////////////////////
	if (!window.console) { // IE8 does NOT init console object until the F12 tool is activated.
		window.console = {};
		window.console.log = function () {};
		window.console.warn = function () {};
		window.console.error = function () {};
	}

	if (typeof window.console.log !== 'function') { // IE8 says any method of an object is 'object' instead of 'function'
		// since methods are objects instead of functions, we can assign alias to them directly,
		// there is no need to bind them to an alias
		window.l = window.console.log;
		window.w = window.console.warn;
		window.e = window.console.error;
		l = window.console.log;
		w = window.console.warn;
		e = window.console.error;
	} else {
	//////// IE8 end //////////////////////////////////////////////////////////////////////////////////



		window.l = window.console.log.bind(window.console);
		window.w = window.console.warn.bind(window.console);
		window.e = window.console.error.bind(window.console);
		l = window.console.log.bind(window.console);
		w = window.console.warn.bind(window.console);
		e = window.console.error.bind(window.console);



	//////// IE8 begin ////////////////////////////////////////////////////////////////////////////////
	}
	//////// IE8 end //////////////////////////////////////////////////////////////////////////////////



	this.domTools = new WLCDOMTools();
	
	this.getSafeNumber = function(input, safeDefault) {
		var result = Number(input);
		if (isNaN(result)) {
			if (isNaN(safeDefault)) {
				e('Neight input nor safeDefault is a valid Number.');
				return NaN;
			}
			result = safeDefault;
		}
		return result;
	};

	this.arraylize = function(input) {
		var _arr = undefined;
		if (Array.isArray(input)) {
			_arr = input;
		} else {
			_arr = [];
			_arr.push(input);
		}
		return _arr;		
	};



	Number.prototype.format = function (in_n, in_sp) {
		// n: every Nth digi
		// sp: separator

		var n = (typeof in_n !== 'number' || Math.round(in_n) <= 0) ? in_n : 3;
		var sp = in_sp ? in_sp : ',';
		var source = this.toString();
		var result = '';


		var signPos = Math.max(0, source.indexOf('-') + 1, source.indexOf('+') + 1);
		var sign = source.slice(0, signPos);
		if (sign == '+') sign = '';

		var dotPos = source.indexOf('.');

		var str_restPart = '';
		if (dotPos === -1) {
			dotPos = source.length;
		} else {
			str_restPart = source.slice(dotPos, source.length);
		}

		if (dotPos === source.length - 1) {
			str_restPart = '.0';
			// str_restPart = '';
		}

		var str_unsignedInteger = '';
		if (dotPos === signPos) {
			str_unsignedInteger = '0';
		} else {
			str_unsignedInteger = source.slice(signPos, dotPos);
		}

		if (str_unsignedInteger === 0) sign = '';

		var uintLength = str_unsignedInteger.length;
		var firstPos = uintLength % n;
		if (firstPos === 0) firstPos = n;

		var pos1 = 0;
		var pos2 = firstPos;
		result = sign + str_unsignedInteger.slice(pos1, pos2);

		while (pos2 < uintLength) {
			pos1 = pos2;
			pos2 += n;
			result += sp + str_unsignedInteger.slice(pos1, pos2);
		}

		result += str_restPart;

		return result;
	};

	Number.prototype.padding = function (in_minDigisCount) {
		if (isNaN(in_minDigisCount)) {
			e('Invalid input for digits count: use an integer instead.');
			return false;
		}
		var _maxDigitsCount = 50;
		var minDigisCount = Math.min(_maxDigitsCount, in_minDigisCount);
		if (in_minDigisCount>_maxDigitsCount) {
			w('Too large value for digits count: trunced to '+_maxDigitsCount+'.');
		}
		var value = Number(this);
		var absValue = Math.abs(value);
		var sign = value === absValue ? '' : '-';
		var abs = absValue.toString();
		var zerosCount = Math.max(0, minDigisCount - abs.length);
		for (var i = 0; i < zerosCount; i++) {
			abs = '0' + abs;
		}

		return sign + abs;
	};

	Array.prototype.indexOfValue = function ( value, startIndex ) {
		var _startIndex = parseInt( startIndex ) || 0;
		for (var i=_startIndex; i<this.length; i++)
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

	Math.randomAround = function (centerValue, radius) {
		centerValue = parseFloat(centerValue);
		if (isNaN(centerValue)) centerValue = 0;
		radius = parseFloat(radius);
		if (isNaN(radius)) radius = 0.5;

		return ( (Math.random()-0.5)*2*radius + centerValue );
	};

	Math.randomBetween = function (a, b) {
		a = parseFloat(a);
		b = parseFloat(b);
		if (isNaN(a)) a = 0;
		if (isNaN(b)) b = 1;
		return ( Math.random()*(b - a) + a );
	};

	Math.randomAroundE = function(o) {
		//the suffix "E" means "with Expection controls"
			//
			// o.E			<Number> for Expection of random distribution
			// o.V1			<Number> for so-called 'left'  variance around Expection
			// o.V2			<Number> for so-called 'right' variance around Expection
			// o.exp		<Number> for exponential falloff around Expection
			// o.integer	<boolean> whether the output value should be an integer

		o = o || {};

		o.E = Number(o.E);
		o.V1 = Number(o.V1);
		o.V2 = Number(o.V2);

		if (isNaN(o.E)) {
			return NaN;
		}

		if (isNaN(o.V1) && isNaN(o.V2)) {
			o.V1=0;
			o.V2=0;
		}

		if (isNaN(o.V1) && !isNaN(o.V2)) {
			o.V1 = -o.V2;
		}

		if (!isNaN(o.V1) && isNaN(o.V2)) {
			o.V2 = -o.V1;
		}

		
		var _result = o.E;


		if (o.V1!==0 || o.V2!==0) {
			o.exp = parseInt(o.exp);
			if (isNaN(o.exp)) o.exp = 1;

			var _p = Math.random();
			for (var i = 1; i < o.exp; i++) {
				_p = _p * _p;
			}

			var _select = Math.random() > 0.4999999;

			_result = _select ? (o.V1 * _p + o.E) : (o.V2 * _p + o.E);
		}

		return o.integer ? Math.round(_result) : _result;
	};

	Math.randomBetweenE = function(o) {
		//the suffix "E" means "with Expection controls"
			//
			// o.E			<Number> for Expection of random distribution
			// o.min		<Number> for min possible value of random distribution
			// o.max		<Number> for max possible value of random distribution
			// o.exp		<Number> for exponential falloff around Expection
			// o.integer	<boolean> whether the output value should be an integer
	
		o = o || {};

		o.E = Number(o.E);
		o.min = Number(o.min);
		o.max = Number(o.max);

		if (isNaN(o.min) && isNaN(o.max)) {
			return NaN;
		}

		if (isNaN(o.E)) {
			o.E = (o.min + o.max)/2;
		}

		if (o.min==o.max) {
			o.E = o.min;
			return o.min;
		}

		o.V1 = o.min - o.E;
		o.V2 = o.max - o.E;

		return Math.randomAroundE(o);
	};


	Math.truncateDegreesInside0To360 = function ( degree ) {
		var turns = Math.floor(degree / 360);
		return degree - 360 * turns;
	};


	//////// IE8 begin ////////////////////////////////////////////////////////////////////////////////
	if (typeof Object.defineProperty === 'function' && !_isVeryOldIE ) {
		// IE8 DOES support Object.defineProperty BUT CAN NOT define property for String.prototype
	//////// IE8 end //////////////////////////////////////////////////////////////////////////////////



		Object.defineProperty(String.prototype, 'E', { // E means Empty
			get: function () { return this.length === 0; }
		});

		Object.defineProperty(String.prototype, 'NE', { // NE means Not Empty
			get: function () { return this.length > 0; }
		});



	//////// IE8 begin ////////////////////////////////////////////////////////////////////////////////
	}
	//////// IE8 end //////////////////////////////////////////////////////////////////////////////////

	this.lorem = new Lorem;

	function Lorem(initOptions) {
		// o	options
			// o.sentenceEnd	<String> for ends of every sentences
			// o.comma			<String> for ends of every sub-clauses except the last one in a given sentence
			// o.wordEnd		<String> for ends of every words except the last one in a sub-clause or sentence

			// o.language		<String>
			//							if omitted then it's 'zh-CN',
			//							if input is an invalid language, then it's 'zh-CN'
			//							currently only 'en' and 'zh-CN' are valid values 
			//
			// o.alphaBet		<Array> of strings
			//
			// o.prgph.E
			// o.prgph.min
			// o.prgph.max
			// o.prgph.exp
			// o.prgph.wrapTag	<String> xml tagName
			//
			// o.sntnc.E		
			// o.sntnc.min		
			// o.sntnc.max
			// o.sntnc.exp
			// o.sntnc.wrapTag	<String> xml tagName
			//
			// o.claus.E		
			// o.claus.min		
			// o.claus.max
			// o.claus.exp
			// o.claus.wrapTag	<String> xml tagName
			//
			// o.words.E		
			// o.words.min		
			// o.words.max
			// o.words.exp
			// o.words.wrapTag	<String> xml tagName
			//
			// o.chars.E		
			// o.chars.min		
			// o.chars.max
			// o.chars.exp
			// o.chars.wrapTag	<String> xml tagName


		var _alphaBetPresets = {
			'en': [
				'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'
			],

			'zh-CN': [
				'吴','乐','川','印','亚','兰','淙','渊','子','谦','心','迟','庆','欢','笑','甜',
				'丹','怀','立','峰','泠','溪','天','韵','王','琛','舒','晴','海','明','下','国',
				'水','巷','青','云','普','江','西','省','南','昌','市','葵','硕','村','陶','秀',
				'康','英','余','祥','殷','闾','晓','琴','雪','楠','苏','泰','兴','沙','桥','连',
				'港','洛','灵','毛','妹','胖','月','半','文','含','章','贡','菡','菲','北','京',
				'上','实','宝','禄','黄','掌','香','源','黔','晨','达','睿','金','红','珍','邮',
				'电','学','院','刘','宜','华','重','芳','杨','菊','儿','东','湖','区','邓','玫',
				'易','冕','商','叙','若','雷','倩','中','人','小','端','在','谢','蚕','石','通',
				'信','工','程','维','动','画','剑','琴','马','磊','莉','惠','芬','曾','晶','罗',
				'巧','湘','萍','宋','瑞','吕','夷','乔','玲','玉','影','符','劳','生','姚','暄',
				'羽','徐','斌','李','啊','技','校','化','线','纱','漂','染','厂','棉','纺','织',
				'山','咏','席','越','成','强','莲','平','肃','锋',
				'Softimage','XSI','ICE',
				'一','二','三','四','五','六','七','八','九','十','个','百','千','万','亿','点',
				'的','地','得','是','否','有','无','你','我','他','它','们'
			],
		};


		this.options = {};
		this.options.prgph = {};
		this.options.sntnc = {};
		this.options.claus = {};
		this.options.words = {};
		this.options.chars = {};

		function _initRandomizationOptions(E, min, max, exp, wrapTag, isChars) {
			this.E = E;
			this.min = min;
			this.max = max;
			this.exp = exp;
			this.integer = true;
			if (!isChars)
				this.wrapTag = (typeof wrapTag==='string') ? wrapTag.toLowerCase() : '';
		}

		function _initZhCN() {
			// this.options.language = 'zh-CN'
			this.options.sentenceEnd = '。';
			this.options.wordEnd = '';
			this.options.comma = '，';
			this.options.alphaBet = _alphaBetPresets['zh-CN'];

			_initRandomizationOptions.call(this.options.prgph, 5, 1, 8, 2);
			_initRandomizationOptions.call(this.options.sntnc, 3, 1, 8, 3);
			_initRandomizationOptions.call(this.options.claus, 1, 1, 3, 2);
			_initRandomizationOptions.call(this.options.words, 6, 2, 19, 3);
			_initRandomizationOptions.call(this.options.chars, 2, 1, 4, 2, true);
		}

		function _initEn() {
			// this.options.language = 'en'
			this.options.sentenceEnd = '. ';
			this.options.wordEnd = ' ';
			this.options.comma = ', ';
			this.options.alphaBet = _alphaBetPresets['en'];

			_initRandomizationOptions.call(this.options.prgph, 4, 1, 8, 2);
			_initRandomizationOptions.call(this.options.sntnc, 3, 1, 8, 2);
			_initRandomizationOptions.call(this.options.claus, 1, 1, 3, 2);
			_initRandomizationOptions.call(this.options.words, 7, 1, 19, 3);
			_initRandomizationOptions.call(this.options.chars, 7, 1, 13, 2, true);
		}

		function _init() {
			if (this.options.language === 'zh-CN') {
				_initZhCN.call(this);
			} else {
				_initEn.call(this);
			}

			this.options.prgph.wrapTag = 'p';
			this.options.sntnc.wrapTag = '';
			this.options.claus.wrapTag = '';
			this.options.words.wrapTag = '';
		}

		function _safelyUpdateNumber(number, safeDefault) {
			var _n = wlcJS.getSafeNumber(number, safeDefault);
			if (_n<0) _n = safeDefault;
			return _n;
		}

		function _safelyUpdateOptions(o, isChars) {
			if (o.hasOwnProperty('E')) {
				var _E = _safelyUpdateNumber(o.E, this.E);
				this.E = _E;
			}
			if (o.hasOwnProperty('exp')) {
				var _exp = _safelyUpdateNumber(o.exp, this.exp);
				this.exp = _exp;
			}

			var _min = this.min;
			var _max = this.max;
			if (o.hasOwnProperty('min')) {
				_min = _safelyUpdateNumber(o.min, this.min);
			}
			if (o.hasOwnProperty('max')) {
				_max = _safelyUpdateNumber(o.max, this.max);
			}

			if (_min!==0 || _max!==0) {
				this.min = _min;
				this.max = _max;
			}

			if (!isChars && o.hasOwnProperty('wrapTag') && typeof o.wrapTag === 'string') {
				this.wrapTag = o.wrapTag;
			}
		}




		function _builderOfWord(isFirstWord, isLastWord) {
			isFirstWord = !!isFirstWord;
			var _count = Math.randomBetweenE(this.options.chars);
			var _segs = [];
			for (var c=0; c<_count; c++) {
				var _index = Math.randomBetweenE(
					{ E:NaN, min:0, max:this.options.alphaBet.length-1, exp:1, integer:true }
				);
				var _char = String(this.options.alphaBet[_index]);
				if (isFirstWord && c===0) _char = _char.toUpperCase();
				_segs.push(_char);
			}
			if (!isLastWord) {
				_segs.push(this.options.wordEnd);
			}
			return _segs.join('');
		}

		function _builderOfClause(isFirstClause, isLastClause) {
			isFirstClause = !!isFirstClause;
			var _count = Math.randomBetweenE(this.options.words);
			var _segs = [];
			for (var c=0; c<_count; c++) {
				_segs.push(this.buildWord(undefined, (isFirstClause && c===0), (c>=_count-1)));
			}
			if (!isLastClause) {
				_segs.push(this.options.comma);
			}
			return _segs.join('');
		}

		function _builderOfSentence() {
			var _count = Math.randomBetweenE(this.options.claus);
			var _segs = [];
			for (var c=0; c<_count; c++) {
				_segs.push(this.buildClause(undefined, c===0, (c===_count-1)));
			}
			_segs.push(this.options.sentenceEnd);
			return _segs.join('');
		}

		function _builderOfParagraph() {
			var _count = Math.randomBetweenE(this.options.sntnc);
			var _segs = [];
			for (var c=0; c<_count; c++) {
				_segs.push(this.buildSentence(undefined));
			}
			return _segs.join('');
		}

		function _builderOfArticle() {
			var _count = Math.randomBetweenE(this.options.prgph);
			var _segs = [];
			for (var c=0; c<_count; c++) {
				_segs.push(this.buildParagraph(undefined));
			}
			return _segs.join('');
		}





		this.config = function(o) {
			if (typeof o !== 'object') return undefined;

			var _languageChanged = false;
			if (o.hasOwnProperty('language') && typeof o.language==='string' && !!o.language) {
				if (o.language==='en') {
					this.options.language = 'o.language';
					_languageChanged = true;
				} else if (this.options.language != 'zh-CN') {
					this.options.language = 'zh-CN';
					_languageChanged = true;
				}
			}
			if (_languageChanged) {
				_init.call(this);
			}

			if (o.hasOwnProperty('alphaBet') && Array.isArray(o.alphaBet) && o.alphaBet.length>0) {
				this.options.alphaBet = o.alphaBet;
			}

			if ((o.hasOwnProperty('sentenceEnd') && !!o.sentenceEnd) || o.sentenceEnd===0) {
				this.options.sentenceEnd = String(o.sentenceEnd);
			}

			if ((o.hasOwnProperty('wordEnd') && !!o.wordEnd) || o.wordEnd===0) {
				this.options.wordEnd = String(o.wordEnd);
			}

			if ((o.hasOwnProperty('comma') && !!o.comma) || o.comma===0) {
				this.options.comma = String(o.comma);
			}

			if (o.hasOwnProperty('prgph') && typeof o.prgph === 'object' && !!o.prgph) {
				_safelyUpdateOptions.call(this.options.prgph, o.prgph);
			}

			if (o.hasOwnProperty('sntnc') && typeof o.sntnc === 'object' && !!o.sntnc) {
				_safelyUpdateOptions.call(this.options.sntnc, o.sntnc);
			}

			if (o.hasOwnProperty('claus') && typeof o.claus === 'object' && !!o.claus) {
				_safelyUpdateOptions.call(this.options.claus, o.claus);
			}

			if (o.hasOwnProperty('words') && typeof o.words === 'object' && !!o.words) {
				_safelyUpdateOptions.call(this.options.words, o.words);
			}

			if (o.hasOwnProperty('chars') && typeof o.chars === 'object' && !!o.chars) {
				_safelyUpdateOptions.call(this.options.chars, o.chars, true);
			}
		};




		this.buildWord = function(o, isFirstWord, isLastWord, prefix, suffix) {
			// o	options
				// o.chars.E		
				// o.chars.min		
				// o.chars.max
				// o.chars.exp
			if (typeof o === 'object') this.config(o);
			var _wrapTag = this.options.words.wrapTag;
			var _hasWrapTag = _wrapTag.length > 0;
			var openTag = _hasWrapTag ? ('<'+_wrapTag+'>') : '';
			var closeTag = _hasWrapTag ? ('</'+_wrapTag+'>') : '';

			if (typeof prefix!=='string') { prefix = ''; }
			if (typeof suffix!=='string') { suffix = ''; }

			return (
					openTag
				+	prefix
				+	_builderOfWord.call(this, isFirstWord, isLastWord)
				+	suffix
				+	closeTag
			);
		};

		this.buildClause = function(o, isFirstClause, isLastClause, prefix, suffix) {
			// o	options
				// o.words.E		
				// o.words.min		
				// o.words.max
				// o.words.exp
				// o.words.wrapTag
			if (typeof o === 'object') this.config(o);
			var _wrapTag = this.options.claus.wrapTag;
			var _hasWrapTag = _wrapTag.length > 0;
			var openTag = _hasWrapTag ? ('<'+_wrapTag+'>') : '';
			var closeTag = _hasWrapTag ? ('</'+_wrapTag+'>') : '';

			if (typeof prefix!=='string') { prefix = ''; }
			if (typeof suffix!=='string') { suffix = ''; }

			return (
					openTag
				+	prefix
				+	_builderOfClause.call(this, isFirstClause, isLastClause)
				+	suffix
				+	closeTag
			);
		};

		this.buildSentence = function(o, prefix, suffix) {
			// o	options
				// o.claus.E		
				// o.claus.min		
				// o.claus.max
				// o.claus.exp
				// o.claus.wrapTag
			if (typeof o === 'object') this.config(o);
			var _wrapTag = this.options.sntnc.wrapTag;
			var _hasWrapTag = _wrapTag.length > 0;
			var openTag = _hasWrapTag ? ('<'+_wrapTag+'>') : '';
			var closeTag = _hasWrapTag ? ('</'+_wrapTag+'>') : '';

			if (typeof prefix!=='string') { prefix = ''; }
			if (typeof suffix!=='string') { suffix = ''; }

			return (
					openTag
				+	prefix
				+	_builderOfSentence.call(this)
				+	suffix
				+	closeTag
			);
		};

		this.buildParagraph = function(o, prefix, suffix) {
			// o	options
				// o.sntnc.E		
				// o.sntnc.min		
				// o.sntnc.max
				// o.sntnc.exp
				// o.sntnc.wrapTag
			if (typeof o === 'object') this.config(o);
			var _wrapTag = this.options.prgph.wrapTag;
			var _hasWrapTag = _wrapTag.length > 0;
			var openTag = _hasWrapTag ? ('<'+_wrapTag+'>') : '';
			var closeTag = _hasWrapTag ? ('</'+_wrapTag+'>') : '';

			if (typeof prefix!=='string') { prefix = ''; }
			if (typeof suffix!=='string') { suffix = ''; }

			return (
					openTag
				+	prefix
				+	_builderOfParagraph.call(this)
				+	suffix
				+	closeTag
			);
		};

		this.buildArticle = function(o, prefix, suffix) {
			// o	options
				// o.prgph.E		
				// o.prgph.min		
				// o.prgph.max
				// o.prgph.exp
				// o.prgph.wrapTag
			if (typeof o === 'object') this.config(o);
			var _wrapTag = this.options.prgph.wrapTag;
			var _hasWrapTag = _wrapTag.length > 0;
			var openTag = _hasWrapTag ? ('<'+_wrapTag+'>') : '';
			var closeTag = _hasWrapTag ? ('</'+_wrapTag+'>') : '';

			if (typeof prefix!=='string') { prefix = ''; }
			if (typeof suffix!=='string') { suffix = ''; }

			return (
					openTag
				+	prefix
				+	_builderOfArticle.call(this)
				+	suffix
				+	closeTag
			);
		};

		this.options.language = 'zh-CN';
		_init.call(this);
		this.config(initOptions);
	}



	function WLCDOMTools() {

		window.doc = document; // doc or window.doc
		//////// IE8 begin ////////////////////////////////////////////////////////////////////////////////
		if (document.querySelector) {
			if (typeof document.querySelector === 'function') {
		//////// IE8 end //////////////////////////////////////////////////////////////////////////////////




				window.qS = document.querySelector.bind(document);
				window.qSA = document.querySelectorAll.bind(document);




		//////// IE8 begin ////////////////////////////////////////////////////////////////////////////////
			} else {
				// assign aliases directly in IE8, no need to bind them
				window.qS = document.querySelector;
				window.qSA = document.querySelectorAll;
			}
		} else {
			// It's almost impossible morden browsers to come here !
			// Since whenever a browser supports querySelector method, we don't need to bind it to jQuery/Zepto.
			if (jQuery || zepto) {
				(function ($) {
					l('window.qS is set to an alias of jQuery or zepto.');
					window.qS = (function() { return $(Array.prototype.slice.call(arguments).join())[0]; } ).bind();

					l('window.qSA is set to an alias of jQuery or zepto.');
					window.qSA = $;
				})(jQuery || zepto);
			} else {
				window.qS = function() {
					var log0 = 'Browser does NOT support querySelector().';
					e(log0);
					alert(log0);
					window.qS = undefined;
				};
				window.qSA = function() {
					var log0 = 'Browser does NOT support querySelectorAll().';
					e(log0);
					alert(log0);
					window.qSA = undefined;
				};
			}
		}
		//////// IE8 end //////////////////////////////////////////////////////////////////////////////////




		window.add = _addDom;
		document.add = _addDom;

		window.isDomNode = _isDomNode;
		window.isDomElement = _isDomElement;
		window.isDom = _isDom;
		window.prepare = _prepare;


		this.isDomNode = _isDomNode;
		this.isDomElement = _isDomElement;
		this.isDom = _isDom;
		this.prepare = _prepare;

		if (!(window.jQuery || window.Zepto)) {
			window.$ = function(e) {
				if (typeof e === 'string') {
					e = qS(e);
				}
				if (isDom(e)) {
					_prepare(e);
					return e;
				}
				return undefined;
			};
		}


		function _isDomNode (o){
			// http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
			// Returns true if it is a DOM node
			return (
				typeof Node === 'object' ? o instanceof Node : 
				o && typeof o === 'object' && typeof o.nodeType === 'number' && typeof o.nodeName==='string'
			) || o === window;
		}

		function _isDomElement (o){
			// http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
			// Returns true if it is a DOM element    
			return (
				typeof HTMLElement === 'object' ? o instanceof HTMLElement : //DOM2
				o && typeof o === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName==='string'
			);
		}

		function _isDom (o) {
			return _isDomNode(o) || _isDomElement(o);
		}

		function _addDom ( tagName, classNames, id, uri ) {

			if (window.id(id)) {
				w('Element of id ['+id+'] already exists!');
			}

			tagName = tagName || 'div';

			var dom_new = null;
			switch (tagName) {
				case 'text':
				case 'textNode':
					dom_new = document.createTextNode(arguments[1]);
					break;

				case 'comment':
					break;

				default:
					dom_new = document.createElement(tagName);
			}

			if (id) dom_new.id = id;
			if (classNames) dom_new.className = classNames;

			if (tagName === 'script') {
				// dom_new.type = 'text/javascript';
			}

			if (tagName === 'link') {
				// dom_new.type = 'text/css';
				dom_new.rel = 'stylesheet';
			}

			if (uri) {
				switch (tagName) {
					case 'script':
					case 'img':
						dom_new.src = uri;
						break;
					case 'a':
					case 'link':
					case 'css':
						dom_new.href = uri;
						break;
				}
			}

			return dom_new;
		}

		function display(toShow, duration) {
			if ( window.jQuery || window.Zepto ) {
				(function($) {
					// duration = (duration || duration == 0 ) ? duration : null;
					if (toShow) {
						$(this).fadeIn(duration);
					} else {
						$(this).fadeOut(duration);
					}
				}).call(this, window.jQuery || window.Zepto );
			} else {

				var _safeDelay = 80;
				var _oldInlineTransitionDefinition = this.style.transition;
				this.style.transition = 'opacity ' + ( ((duration-_safeDelay)/1000)+'s' ) + ' ease-in-out';

				if (toShow) {

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

		// function show(duration) {
		// 	display.call(this, true, duration);
		// }

		// function hide(duration) {
		// 	display.call(this, false, duration);
		// }

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



		//////// IE8 begin ////////////////////////////////////////////////////////////////////////////////
		var _elementIsPublic = (typeof Element === 'function' || !_isVeryOldIE);
		if (_elementIsPublic) {
		//////// IE8 end //////////////////////////////////////////////////////////////////////////////////



			Element.prototype.qS = function () { return this.querySelector.apply(this, arguments); };
			Element.prototype.qSA = function () { return this.querySelectorAll.apply(this, arguments); };

			Element.prototype.take = function ( dom ) {
				this.appendChild( dom );
				return this;
			};

			Element.prototype.add = function ( tagName, classNames, id, uri ) {
				var dom_new = _addDom( tagName, classNames, id, uri );
				this.take(dom_new);
				return dom_new;
			};

			Element.prototype.die = function () {
				this.parentNode.removeChild(this);
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

				if (!this.eventTokens[_t.eventType]) {
					e('Event Type: "'+_t.eventType+'" is NOT supported.');
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

			Element.prototype.isChildOf = function (in_dom_pseudoParentNode, in_recursive) {
				var recursive = !in_recursive ? false : true;
				var isChild = false;

				var arr_dom_allChildren = in_dom_pseudoParentNode.childNodes;
				if (recursive) {
					arr_dom_allChildren = in_dom_pseudoParentNode.querySelectorAll('*');
				}

				for (var i = 0; i < arr_dom_allChildren.length; i++) {
					isChild = this === arr_dom_allChildren[i];
					if (isChild) break;
				}

				return isChild;
			};

			Element.prototype.show = function(duration) {
				display.call(this, true, duration);
			};

			Element.prototype.hide = function(duration) {
				display.call(this, false, duration);
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
				//		minMarginTop:		Number <default=10>
				//		minMarginRight:		Number <default=10>
				//		minMarginBottom:	Number <default=10>
				//		minMarginLeft:		Number <default=10>
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

				_.minMarginTop =	isNaN(Number(_.minMarginTop))		? 10 : Number(_.minMarginTop);
				_.minMarginRight =	isNaN(Number(_.minMarginRight))		? 10 : Number(_.minMarginRight);
				_.minMarginBottom =	isNaN(Number(_.minMarginBottom))	? 10 : Number(_.minMarginBottom);
				_.minMarginLeft =	isNaN(Number(_.minMarginLeft))		? 10 : Number(_.minMarginLeft);

				// l('_.centerRef:',_.centerRef);

				if (_.alongX) {
					var selfWidth = parseInt( computedStyle.width );
					var refWidth = _.centerRef === window ? _.centerRef.innerWidth : _.centerRef.clientWidth;
					// l('refWidth:',refWidth,'px\n','selfWidth:',selfWidth,'px\n','_.offsetX:',_.offsetX,'px\n');
					var left = undefined;

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
								this.style.width = this.computedWidthComesFromInlineDefinition ? this.computedWidthBeforeCenterTo+'px' : '';
							}
						}

						left = (maxAllowedWidth - selfWidth) / 2 + _.offsetX;
					} else {
						left = (refWidth - selfWidth) / 2 + _.offsetX;
					}

					this.style.left = left + 'px';
					this.style.marginLeft = '0';
				}

				if (_.alongY) {
					var selfHeight = parseInt( computedStyle.height );
					var refHeight = _.centerRef === window ? _.centerRef.innerHeight : _.centerRef.clientHeight;
					// l('refHeight:',refHeight,'px\n','selfHeight:',selfHeight,'px\n','_.offsetY:',_.offsetY,'px\n');
					var top = undefined;

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

						var maxAllowedHeight = refHeight - _.minMarginTop - _.minMarginBottom - selfPaddingVert;

						if ( selfHeight>maxAllowedHeight ) { // camparing everytime this method being called, in case the container could have changed
							selfHeight = maxAllowedHeight;
							this.style.height = maxAllowedHeight + 'px';
						} else {
							// restore original settings
							if (this.computedHeightBeforeCenterTo) {
								this.style.height = this.computedHeightComesFromInlineDefinition ? this.computedHeightBeforeCenterTo+'px' : '';
							}
						}

						top = (maxAllowedHeight - selfHeight) / 2 + _.offsetY;
					} else {
						top = (refHeight - selfHeight) / 2 + _.offsetY;
					}
					this.style.top = top + 'px';
					this.style.marginTop = '0';
				}

				return { width: selfWidth, height: selfHeight, left: left, top: top };
			};



		//////// IE8 begin ////////////////////////////////////////////////////////////////////////////////
		} // Element is NOT public in IE8
		//////// IE8 end //////////////////////////////////////////////////////////////////////////////////

		if (Object.defineProperty) {
			Object.defineProperty(Element.prototype, 'realStyle', {
				get: function () { return window.getComputedStyle(this, null); }
			});

			Object.defineProperty(Element.prototype, 'cssMatrix', {
				get: function () {
					var oStyle = this.realStyle;
					var cssMatrixString = '';
					var cssMatrix = null;

					if (cssMatrixString.E && oStyle['transform'])            cssMatrixString = oStyle['transform'];
					if (cssMatrixString.E && oStyle['-webkit-transform'])    cssMatrixString = oStyle['-webkit-transform'];
					if (cssMatrixString.E && oStyle['-moz-transform'])       cssMatrixString = oStyle['-moz-transform'];

					eval( 'var cssMatrix = [' + cssMatrixString.slice( 'matrix('.length, -1 ) + '];' );
					return cssMatrix;
				}
			});

			Object.defineProperty(Element.prototype, 'real2DRotationAngle', {
				get: function () {
					var cssMatrix = this.cssMatrix;
					var angle = Math.atan2( cssMatrix[0], cssMatrix[1] )/Math.PI* -180 + 90;
					angle = angle<0 ? angle+360 : angle;
					return angle;
				}
			});
		}
	} // Class: WLC_DOM ()
}); // new operator
