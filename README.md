iconv-js - pure javascript character encoding conversion
====================================================================

## Usage

    var iconv = require('iconv-js');
    
    // Convert from SJIS buffer to UTF8 buffer.
    str = iconv.fromSJIS(buffer);
    
    // Convert from UTF8 buffer to SJIS buffer.
    str = iconv.toSJIS(buffer);

## Supported encodings

*   SJIS <-> UTF8
