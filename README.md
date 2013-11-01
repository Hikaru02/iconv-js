iconv-js - pure javascript character encoding conversion
====================================================================

## Usage

    var iconv = require('iconv-js');
    
    // Convert from SJIS buffer to UTF8 buffer.
    utf8_buffer = iconv.fromSJIS(sjis_buffer);
    
    // Convert from UTF8 buffer to SJIS buffer.
    sjis_buffer = iconv.toSJIS(utf8_buffer);

## Supported encodings

*   SJIS <-> UTF8

## TODO

*   Add more encodings.
