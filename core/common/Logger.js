var colors = require('colors/safe'),
    isBrowser = require('./isBrowser.js')

var Logger = function () {
    this.log = this.info = this.warn = this.error = null;
    
    if (isBrowser) {
        this.log = this._browserLog;
        this.info = this._browserInfo;
        this.warn = this._browserWarn;
        this.error = this._browserError;
    } else {
        this.log = this._nodeLog;
        this.info = this._nodeInfo;
        this.warn = this._nodeWarn;
        this.error = this._nodeError;
    }
};

Logger.prototype._browserLog = function(message) {
    console.log(message.clone());
};

Logger.prototype._browserInfo = function(message) {
    console.info(message.clone());
};

Logger.prototype._browserWarn = function(message) {
    console.warn(message.clone());
};

Logger.prototype._browserError = function(message) {
    console.error(message.clone());
};



Logger.prototype._nodeLog = function(message) {
    console.log(message.clone());
};

Logger.prototype._nodeInfo = function(message) {
    console.log(colors.blue(message.clone()));
};

Logger.prototype._nodeWarn = function(message) {
    console.log(colors.yellow(message.clone()));
};

Logger.prototype._nodeError = function(message) {
    console.log(colors.red(message.clone()));
};

module.exports = Logger;