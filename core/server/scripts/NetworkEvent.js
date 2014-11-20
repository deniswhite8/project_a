var socketIo = require('socket.io');

var NetworkEvent = function(httpServer) {
    this._eventCallbacks = [];
    this._io = socketIo(httpServer);
};

NetworkEvent.prototype.listen = function() {
    var self = this;
    this._io.sockets.on('connection', function (socket) {
        self._eventCallbacks.forEach(function(eventCallback) {
            socket.on(eventCallback.name, eventCallback.callback);
        });
    });
};

NetworkEvent.prototype.on = function(name, callback) {
    var self = this;
    
    this._eventCallbacks.push({
        name: name,
        callback: function(data) {
            callback.call(self, data, this);        
        }
    });
};

module.exports = NetworkEvent;