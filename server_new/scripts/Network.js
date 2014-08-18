var io = require('socket.io');


var Network = function() {
    this._eventCallbacks = [];
};

Network.prototype.listen = function() {
    io.listen(config.network.port);

    io.sockets.on('connection', function (socket) {
        this._eventCallbacks.forEach(function(eventCallback) {
            socket.on(eventCallback.name, eventCallback.callback);
        });
    });
};

Network.prototype.on = function(name, callback) {
    this._eventCallbacks.push({
        name: name,
        callback: callback
    });
};

module.exports = Network;