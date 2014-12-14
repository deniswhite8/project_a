var socketIo = require('socket.io'),
    Pack = require('../../common/Pack.js');

var Network = function(httpServer) {
    this._eventCallbacks = [];
    this._io = socketIo(httpServer);
    this._pack = new Pack();
};

Network.prototype.listen = function() {
    var self = this;
    this._io.sockets.on('connection', function (socket) {
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
            var decodedData = self._pack.decode(data);
            callback.call(self, decodedData, this);        
        }
    });
};

Network.prototype.send = function(socket, name, data) {
    if (!socket || !name || data === null || data === undefined ||
		($.isObject(data) && data.isEmpty())) return;

	var encodedData = this._pack.encode(data);
	socket.emit(name, encodedData);  
};

module.exports = Network;