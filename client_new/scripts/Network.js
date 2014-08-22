define(['socket.io'], function(io) {

    var Network = function() {
        this._eventCallbacks = [];
        this._socket = null;
    };
    
    Network.prototype.connect = function() {
        this._socket = io.connect(config.network.host + ':' + config.network.port),
    };
    
    Network.prototype.on = function(name, callback) {
        this._socket.on(name, callback);
    };

    return Network;
    
});