var express = require('express'),
    config = null;

var Page = function() {
    config = global.config;
    
    var app = express();
    app.use(express.static(__dirname + '/../../' + config.frontend.root.directory));
    app.get('/', function(req, res) {
        res.sendFile(config.frontend.root.file);
    });
    
    this._app = app;
};

Page.prototype.getApp = function() {
    return this._app;
};

module.exports = Page;