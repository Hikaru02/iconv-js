'use strict'
//var log = console.log.bind(console)


var exports = module.exports

var SJIS_UNI_TABLES = require('./table/sjis-uni.js')
var SJIS_UNI_TABLE_1 = SJIS_UNI_TABLES[0]
var SJIS_UNI_TABLE_2 = SJIS_UNI_TABLES[1]
var SJIS_UNI_TABLE_3 = SJIS_UNI_TABLES[2]
var SJIS_UNI_TABLE_SP = SJIS_UNI_TABLES[3]



exports.fromSJIS = function (sjis_buf) {

	var length = sjis_buf.length
	sjis_buf = Buffer.concat([sjis_buf, new Buffer(1)])

	var uni_code = 0
	var utf8_buf = new Buffer(0)

	function concat(utf8_codes) {
		utf8_buf = Buffer.concat([utf8_buf, new Buffer(utf8_codes)])
	}

	var offset = 0
	while (offset < length) {
	
		// sjis -> uni
		var sjis_code = sjis_buf.readUInt8(offset, true)

		if (sjis_code === 0x7E)
			uni_code = 0x203E
		else if (sjis_code < 0x80)
			uni_code = sjis_code
		else if (sjis_code < 0xA0)
			uni_code = SJIS_UNI_TABLE_1[sjis_buf.readUInt16BE(offset++, true) - 0x8140]
		else if (sjis_code < 0xE0)
			uni_code = SJIS_UNI_TABLE_2[sjis_code - 0xA0]
		else
			uni_code = SJIS_UNI_TABLE_3[sjis_buf.readUInt16BE(offset++, true) - 0xE040]

		// uni -> utf8
		if (uni_code < 0x80)
			concat([uni_code])
		else if (uni_code < 0x800)
			concat([uni_code>>>6|0xC0, uni_code&0x3F|0x80])
		else if (uni_code < 0x10000)
			concat([uni_code>>>12|0xE0, uni_code>>>6&0x3F|0x80, uni_code&0x3F|0x80])
		else if (uni_code < 0x200000)
			concat([uni_code>>>18|0xF0, uni_code>>>12&0x3F|0x80, uni_code>>>6&0x3F|0x80, uni_code&0x3F|0x80])
		else if (uni_code < 0x4000000)
			concat([uni_code>>>24|0xF8, uni_code>>>18&0x3F|0x80, uni_code>>>12&0x3F|0x80, uni_code>>>6&0x3F|0x80, uni_code&0x3F|0x80])
		else
			concat([uni_code>>>30|0xFC, uni_code>>>24&0x3F|0x80, uni_code>>>18&0x3F|0x80, uni_code>>>12&0x3F|0x80, uni_code>>>6&0x3F|0x80, uni_code&0x3F|0x80])

		++offset
	}

	return utf8_buf

}



exports.toSJIS = function (utf8_buf) {

	var length = utf8_buf.length
	utf8_buf = Buffer.concat([utf8_buf, new Buffer(5)])

	var uni_code = 0
	var sjis_code = 0
	var sjis_buf = new Buffer(0)
	var index = 0

	function concat(sjis_codes) {
		sjis_buf = Buffer.concat([sjis_buf, new Buffer(sjis_codes)])
	}

	function getBlockCode(n) {
		var code = 0
		for (var i = n-1; i >= 0; --i) {
			code |= (utf8_buf.readUInt8(++offset, true)&0x3F) << i*6
		}
		return code
	}

	var offset = 0
	while (offset < length) {
	
		// utf8 -> uni
		var utf8_code = utf8_buf.readUInt8(offset, true)

		if ((utf8_code&0x80) === 0)
			uni_code = utf8_code
		else if((utf8_code&0xE0) === 0xC0)
			uni_code = (utf8_code&0x1F) << 6 | getBlockCode(1)
		else if((utf8_code&0xF0) === 0xE0)
			uni_code = (utf8_code&0xF) << 12 | getBlockCode(2)
		else if((utf8_code&0xF8) === 0xF0)
			uni_code = (utf8_code&0x7) << 18 | getBlockCode(3)
		else if((utf8_code&0xFC) === 0xF8)
			uni_code = (utf8_code&0x3) << 24 | getBlockCode(4)
		else if((utf8_code&0xFE) === 0xFC)
			uni_code = (utf8_code&0x1) << 30 | getBlockCode(5)

		++offset

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


		if (sjis_code < 0x80)
			concat([sjis_code])
		else if (sjis_code < 0xA0)
			concat([sjis_code>>>8, sjis_code&0xFF])
		else if (sjis_code < 0xE0)
			concat([sjis_code])
		else
			concat([sjis_code>>>8, sjis_code&0xFF])

	}

	return sjis_buf

}


