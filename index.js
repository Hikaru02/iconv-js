if (typeof iconv_js != 'object') var iconv_js = {}
iconv_js = (function (iconv_js) { 'use strict'
//----------------------------------------------------------



	//var log = console.log.bind(console)


	var HAS_NODEJS_API  = typeof module != 'undefined' && typeof Buffer != 'undefined'
	var HAS_BOM_DOM_API = typeof window != 'undefined'




//ES6 APIs
	Object.assign = Object.assign || function assign(target, source) {
		Object.keys(source).forEach(function (key) {
			target[key] = source[key]
		})
	}

	ArrayBuffer.isView = ArrayBuffer.isView || function isView(x) {
		return typeof x == 'object' && x.constructor.hasOwnProperty('BYTES_PER_ELEMENT')
	}


//util
	






//init

	var SJIS_UNI_TABLE_1, SJIS_UNI_TABLE_2, SJIS_UNI_TABLE_3, SJIS_UNI_TABLE_SP


function init() {

	if (HAS_NODEJS_API) {
		var SJIS_UNI_TABLE = require('./table/sjis-uni.js')
	} else {
		var SJIS_UNI_TABLE = iconv_js.SJIS_UNI_TABLE
	}

	SJIS_UNI_TABLE_1  = SJIS_UNI_TABLE[0]
	SJIS_UNI_TABLE_2  = SJIS_UNI_TABLE[1]
	SJIS_UNI_TABLE_3  = SJIS_UNI_TABLE[2]
	SJIS_UNI_TABLE_SP = SJIS_UNI_TABLE[3]

	var exports = {
		fromSJIS: fromSJIS,
		toSJIS: toSJIS,
	}

	if (HAS_NODEJS_API) {
		module.exports = exports
	} else {
		Object.assign(iconv_js, exports)
	}
	return iconv_js
}




//main
	if (HAS_NODEJS_API) {
		init()
	} else {
		iconv_js.init = init
	}
	return iconv_js




//

function conv(x, func) {

	if (typeof x === 'object') {
		if (x instanceof ArrayBuffer) {
			return func(x, false)

		} else if (HAS_NODEJS_API && Buffer.isBuffer(x)) {
			return func(x, true)

		} else if (ArrayBuffer.isView(x)) {
			return new x.constructor(func(x.buffer, false))

		} else throw 'Unexpected Object Kind'

	} else if (typeof x === 'string') {
		throw 'Not Suported Yet'

	} else throw 'Unexpected Type'
}





function fromSJIS(x) {
	return conv(x, SJIStoUTF8)
}

function toSJIS(x) {
	return conv(x, UTF8toSJIS)
}




function SJIStoUTF8(sjis_buf, UES_NODEJS_BUFFR) {

	var uni_code = 0

	if (UES_NODEJS_BUFFR) {
		var sjis_len = sjis_buf.length
		var sjisView = sjis_buf
		var utf8_buf = new Buffer(sjis_len*3) // 要検討（2~6）
		var utf8View = utf8_buf
	} else {
		var sjis_len = sjis_buf.byteLength
		var sjisView = new Uint8Array(sjis_buf)
		var utf8_buf = new ArrayBuffer(sjis_len*3) // 要検討（2~6）
		var utf8View = new Uint8Array(utf8_buf)
	}


	var sjis_i = 0, utf8_i = 0

	while (sjis_i < sjis_len) {
	
		// sjis -> uni
		var sjis_code = sjisView[sjis_i]

		if (sjis_code === 0x7E) {
			uni_code = 0x203E

		} else if (sjis_code < 0x80) {
			uni_code = sjis_code

		} else if (sjis_code < 0xA0) {
			if (sjis_i === sjis_len-1) break
			uni_code = SJIS_UNI_TABLE_1[(sjisView[sjis_i]<<8|sjisView[++sjis_i]) - 0x8140]

		} else if (sjis_code < 0xE0) {
			uni_code = SJIS_UNI_TABLE_2[sjis_code - 0xA0]

		} else {
			if (sjis_i === sjis_len-1) break
			uni_code = SJIS_UNI_TABLE_3[(sjisView[sjis_i]<<8|sjisView[++sjis_i]) - 0xE040]

		}

		++sjis_i

		// uni -> utf8
		if (uni_code < 0x80) {
			utf8View[utf8_i++] = uni_code
		} else if (uni_code < 0x800) {
			utf8View[utf8_i++] = uni_code>>>6|0xC0
			utf8View[utf8_i++] = uni_code&0x3F|0x80
		} else if (uni_code < 0x10000) {
			utf8View[utf8_i++] = uni_code>>>12|0xE0
			utf8View[utf8_i++] = uni_code>>>6&0x3F|0x80
			utf8View[utf8_i++] = uni_code&0x3F|0x80
		} else if (uni_code < 0x200000) {
			utf8View[utf8_i++] = uni_code>>>18|0xF0
			utf8View[utf8_i++] = uni_code>>>12&0x3F|0x80
			utf8View[utf8_i++] = uni_code>>>6&0x3F|0x80
			utf8View[utf8_i++] = uni_code&0x3F|0x80
		} else if (uni_code < 0x4000000) {
			utf8View[utf8_i++] = uni_code>>>24|0xF8
			utf8View[utf8_i++] = uni_code>>>18&0x3F|0x80
			utf8View[utf8_i++] = uni_code>>>12&0x3F|0x80
			utf8View[utf8_i++] = uni_code>>>6&0x3F|0x80
			utf8View[utf8_i++] = uni_code&0x3F|0x80
		} else {
			utf8View[utf8_i++] = uni_code>>>30|0xFC
			utf8View[utf8_i++] = uni_code>>>24&0x3F|0x80
			utf8View[utf8_i++] = uni_code>>>18&0x3F|0x80
			utf8View[utf8_i++] = uni_code>>>12&0x3F|0x80
			utf8View[utf8_i++] = uni_code>>>6&0x3F|0x80
			utf8View[utf8_i++] = uni_code&0x3F|0x80
		}

	}


	return utf8_buf.slice(0, utf8_i)

}






function UTF8toSJIS(utf8_buf, UES_NODEJS_BUFFR) {

	

	var uni_code = 0, sjis_code = 0
	var index = 0

	if (UES_NODEJS_BUFFR) {
		var utf8_len = utf8_buf.length
		var utf8View = utf8_buf
		var sjis_buf = new Buffer(utf8_len*3) // 要検討（2~6）
		var sjisView = sjis_buf
	} else {
		var utf8_len = utf8_buf.byteLength
		var utf8View = new Uint8Array(utf8_buf)
		var sjis_buf = new ArrayBuffer(utf8_len*3) // 要検討（2~6）
		var sjisView = new Uint8Array(sjis_buf)
	}


	//function indexOf(table, code) { for (var i = 0; i < table.length; ++i) if (table[i] === code) return i; return -1 }

	/*
	function getBlockCode(n) {
		var code = 0
		for (var i = n-1; i >= 0; --i) {
			code |= (utf8View[++utf8_i]&0x3F) << i*6
		}
		return code
	}
	*/

	var utf8_i = 0, sjis_i = 0

	while (utf8_i < utf8_len) {
	
		// utf8 -> uni
		var utf8_code = utf8View[utf8_i]

		if ((utf8_code&0x80) === 0)
			uni_code = utf8_code
		else if((utf8_code&0xE0) === 0xC0)
			uni_code = (utf8_code&0x1F)<<6 | (utf8View[++utf8_i]&0x3F)
		else if((utf8_code&0xF0) === 0xE0)
			uni_code = (utf8_code&0xF)<<12 | (utf8View[++utf8_i]&0x3F)<<6 | (utf8View[++utf8_i]&0x3F)
		else if((utf8_code&0xF8) === 0xF0)
			uni_code = (utf8_code&0x7)<<18 | (utf8View[++utf8_i]&0x3F)<<12 | (utf8View[++utf8_i]&0x3F)<<6 | (utf8View[++utf8_i]&0x3F)
		else if((utf8_code&0xFC) === 0xF8)
			uni_code = (utf8_code&0x3)<<24 | (utf8View[++utf8_i]&0x3F)<<18 | (utf8View[++utf8_i]&0x3F)<<12 | (utf8View[++utf8_i]&0x3F)<<6 | (utf8View[++utf8_i]&0x3F)
		else if((utf8_code&0xFE) === 0xFC)
			uni_code = (utf8_code&0x1)<<30 | (utf8View[++utf8_i]&0x3F)<<24 | (utf8View[++utf8_i]&0x3F)<<18 | (utf8View[++utf8_i]&0x3F)<<12 | (utf8View[++utf8_i]&0x3F)<<6 | (utf8View[++utf8_i]&0x3F)
		else {++utf8_i; continue}

		++utf8_i

		// uni -> sjis
		if (uni_code === 0x203E) 
			sjis_code = 0x7E
		else if (uni_code < 0x80)
			sjis_code = uni_code
		else if ((index = SJIS_UNI_TABLE_2.indexOf(uni_code)) >= 0)
			sjis_code = index + 0xA0
		else if ((index = SJIS_UNI_TABLE_SP[uni_code]|0) > 0)
			sjis_code = index
		else if ((index = SJIS_UNI_TABLE_1.indexOf(uni_code)) >= 0)
			sjis_code = index + 0x8140
		else if ((index = SJIS_UNI_TABLE_3.indexOf(uni_code)) >= 0)
			sjis_code = index + 0xE040
		else {++utf8_i; continue}


		if (sjis_code < 0x80) {
			sjisView[sjis_i++] = sjis_code
		} else if (sjis_code < 0xA0) {
			sjisView[sjis_i++] = sjis_code>>>8
			sjisView[sjis_i++] = sjis_code&0xFF
		} else if (sjis_code < 0xE0) {
			sjisView[sjis_i++] = sjis_code
		} else {
			sjisView[sjis_i++] = sjis_code>>>8
			sjisView[sjis_i++] = sjis_code&0xFF
		}

	}

	
	return sjis_buf.slice(0, sjis_i)

}




function KutenToSJIS(ku, ten) {


}







//----------------------------------------------------------
})(iconv_js);