var io = require('socket.io');

var Network = function() {
    this._eventCallbacks = [];
    this._socket = null;
};

Network.prototype.connect = function() {
    this._socket = io.connect(config.network.host + ':' + config.network.port);
};

Network.prototype.on = function(name, callback) {
    var self = this;
    
    this._socket.on(name, function(data) {
        callback.call(self, data, this);
    });
};

Network.prototype.sen = function(name, data) {
    if (!this._socket) return;
    
    this._socket.emit(name, data);
};

module.exports = Network;
