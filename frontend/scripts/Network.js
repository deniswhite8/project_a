var config = null;

var Network = function() {
    this._eventCallbacks = [];
    this._socket = null;
    
    config = window.config;
};

Network.prototype.connect = function() {
    this._socket = io();
};

Network.prototype.on = function(name, callback) {
    var self = this;
    
    this._socket.on(name, function(data) {
        callback.call(self, data, this);
    });
};

Network.prototype.send = function(name, data) {
    if (!this._socket) return;
    
    this._socket.emit(name, data);
};

module.exports = Network;
