var nodeMsgpack = require('msgpack-js'),
    browserMsgpack = require('msgpack-js-browser'),
    isBrowser = require('./isBrowser.js'),
    config = null;

var Pack = function() {
    this._msgpack = null;
    
    if (isBrowser) {
        this._msgpack = browserMsgpack;
        config = window.config;
    } else {
        this._msgpack = nodeMsgpack;
        config = global.config;
    }
};

Pack.prototype._msgpackEncode = function(data) {
    var encodedData = this._msgpack.encode(data);
    
    if (isBrowser) {
        return new Uint8Array(encodedData);
    } else {
        return encodedData;
    }
};

Pack.prototype._msgpackDecode = function(bytes) {
    var preparedData = null;
    
    if (isBrowser) {
        preparedData = new Uint8Array(bytes).buffer;
    }
    else {
        preparedData = new Buffer(bytes);
    }
    
    return this._msgpack.decode(preparedData);
};

Pack.prototype.encode = function(data) {
    if (!config.network.pack.enable) return data;
    
    var bytes = this._msgpackEncode(data);
    
    var chars = [],
        length = bytes.length;
    for(var i = 0; i < length; ) {
        chars.push(((bytes[i++] & 0xff) << 8) | (bytes[i++] & 0xff));
    }

    var message = String.fromCharCode.apply(null, chars);
    if (length % 2) message += '+';
    
    return '#' + message;
};

Pack.prototype.decode = function(message) {
    if (!config.network.pack.enable || message[0] != '#') return message;
    else message = message.substr(1);
    
    var length = message.length,
        bytes = [],
        excessByte = false;
        
    if (message[length - 1] == '+') {
        message.slice(0, -1);
        length--;
        excessByte = true;
    }

    for(var i = 0; i < length; i++) {
        var char = message.charCodeAt(i);
        bytes.push(char >>> 8, char & 0xFF);
    }
    
    if (excessByte) bytes.pop();
    
    return this._msgpackDecode(bytes);
};

module.exports = Pack;