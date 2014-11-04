var io = require('socket.io'),
    config = null;

var Network = function() {
    this._eventCallbacks = [];
    config = global.config;
};

Network.prototype.listen = function() {
    io = io.listen(config.network.port);

    var self = this;
    io.sockets.on('connection', function (socket) {
        self._eventCallbacks.forEach(function(eventCallback) {
            socket.on(eventCallback.name, eventCallback.callback);
        });
    });
};

Network.prototype.on = function(name, callback) {
    var self = this;
    
    this._eventCallbacks.push({
        name: name,
        callback: function(data) {
            callback.call(self, data, this);        
        }
    });
};

module.exports = Network;