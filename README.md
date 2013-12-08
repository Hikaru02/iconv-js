iconv-js - pure javascript character encoding conversion
====================================================================

## Usage

#### Node.js

**I recommend that you use [jconv](https://github.com/narirou/jconv) instead of this module.**
    
    var iconv = require('iconv-js');
    
    // Convert from SJIS buffer to UTF8 buffer.
    utf8_buffer = iconv.fromSJIS(sjis_buffer);
    
    // Convert from UTF8 buffer to SJIS buffer.
    sjis_buffer = iconv.toSJIS(utf8_buffer);
    
    
        
#### Browser

**I recommend that you use [Web Encoding API](http://encoding.spec.whatwg.org/) instead of this module.**

    <script src="iconv-js/index.js"></script>
    <script src="iconv-js/table/sjis-uni.js"></script>
    <script>

    var iconv = iconv_js.init();
            
    // Convert from SJIS arraybuffer to UTF8 arraybuffer.
    utf8_arraybuffer = iconv.fromSJIS(sjis_arraybuffer);
    
    // Convert from UTF8 arraybuffer to SJIS arraybuffer.
    sjis_arraybuffer = iconv.toSJIS(utf8_arraybuffer);

    </script>
        
    

## Supported encodings

*   SJIS(win) <-> UTF8

