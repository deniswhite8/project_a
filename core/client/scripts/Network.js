var Pack = require('../../common/Pack.js');

var config = null;

var Network = function() {
    this._eventCallbacks = [];
    this._socket = null;
    this._pack = new Pack();
    
    config = window.config;
};

Network.prototype.connect = function() {
    this._socket = io();
};

Network.prototype.on = function(name, callback) {
    var self = this;
    
    this._socket.on(name, function(data) {
        var decodedData = self._pack.decode(data);
        callback.call(self, decodedData, this);
    });
};

Network.prototype.send = function(name, data) {
    if (!this._socket) return;
    
    var encodedData = this._pack.encode(data);
    this._socket.emit(name, encodedData);
};

module.exports = Network;
