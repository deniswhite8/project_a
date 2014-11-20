var express = require('express'),
    config = null;

var Page = function() {
    config = global.config;
    
    var app = express();
    this._app = app;
    
    for (var i in config.frontend.routers) {
        if (!config.frontend.routers.hasOwnProperty(i)) continue;
        
        var router = config.frontend.routers[i];
            
        if (router.file) this.addRouter(router.query, router.file, router.root);
        else this.addDirectory(router.query, router.root);
    }
};

Page.prototype.addRouter = function(query, file, root) {
    this.getApp().get(query, function(req, res) {
        var fileParts = file.split('/'),
            preparedFileParts = [];
        
        fileParts.forEach(function(part) {
            if (part[0] == ':') part = req.params[part.substr(1)];
            preparedFileParts.push(part);
        });
        
        res.sendFile(preparedFileParts.join('/'), {root: __dirname + '/../../../' + root});
    });
};

Page.prototype.addDirectory = function(query, root) {
    this.getApp().use(query, express.static(__dirname + '/../../../' + root));
};

Page.prototype.getApp = function() {
    return this._app;
};

module.exports = Page;