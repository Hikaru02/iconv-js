'use strict'
//var log = console.log.bind(console)

var HAS_NODEJS_API = true
var HAS_BOM_DOM_API = false

var SJIS_UNI_TABLES = require('./table/sjis-uni.js')
var SJIS_UNI_TABLE_1 = SJIS_UNI_TABLES[0]
var SJIS_UNI_TABLE_2 = SJIS_UNI_TABLES[1]
var SJIS_UNI_TABLE_3 = SJIS_UNI_TABLES[2]
var SJIS_UNI_TABLE_SP = SJIS_UNI_TABLES[3]





ArrayBuffer.isView = ArrayBuffer.isView || function (x) { // typeof x shuld be 'object'
	return x.constructor.hasOwnProperty('BYTES_PER_ELEMENT') //簡易実装
}

if (HAS_NODEJS_API) {
	Buffer.prototype.toArrayBuffer = Buffer.prototype.toArrayBuffer || function () {
		return new Uint8Array(this).buffer
	}
}





function conv(x, func) {

	if (typeof x === 'object') {
		if (x instanceof ArrayBuffer) {
			return func(x, false)

		} else if (HAS_NODEJS_API && Buffer.isBuffer(x)) {
			return func(x, true)

		} else if (ArrayBuffer.isView(x)) {
			func(x.buffer, false)
			return x
		}

		throw 'Unexpected Object Kind'

	} else if (typeof x === 'string') {
		throw 'Not Suported Yet'

	} else throw 'Unexpected Type'
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

		if (sjis_code === 0x7E) uni_code = 0x203E
		else if (sjis_code < 0x80) uni_code = sjis_code
		else if (sjis_code < 0xA0) {
			if (sjis_i === sjis_len-1) continue
			uni_code = SJIS_UNI_TABLE_1[(sjisView[sjis_i]<<8|sjisView[++sjis_i]) - 0x8140]
		} else if (sjis_code < 0xE0) uni_code = SJIS_UNI_TABLE_2[sjis_code - 0xA0]
		else {
			if (sjis_i === sjis_len-1) continue
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
		else continue

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
		else continue


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




function fromSJIS(x) {
	return conv(x, SJIStoUTF8)
}

function toSJIS(x) {
	return conv(x, UTF8toSJIS)
}



module.exports = {
	fromSJIS: fromSJIS,
	toSJIS: toSJIS,
}
