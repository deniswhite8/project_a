var http = require('http'),
    config = null;

var Connect = function(app) {
    config = global.config;
    this._httpServer = http.Server(app);
};

Connect.prototype.getHttpServer = function() {
    return this._httpServer;
};

Connect.prototype.getPort = function() {
    return config.network.port || process.env.PORT;
};

Connect.prototype.listen = function() {
    this._httpServer.listen(this.getPort(), function(){});
};

module.exports = Connect;