var colors = require('colors/safe');

var Logger = function () {
    
};

Logger.prototype._isBrowser = function() {
    try {
        !!window;
        return true;
    } catch (e) {
        return false;
    }
};

Logger.prototype.log = function(message) {
    if (this._isBrowser()) console.log(message);
    else console.log(message);
};

Logger.prototype.info = function(message) {
    if (this._isBrowser()) console.info(message);
    else console.log(colors.blue(message));
};

Logger.prototype.warn = function(message) {
    if (this._isBrowser()) console.warn(message);
    else console.log(colors.yellow(message));
};

Logger.prototype.error = function(message) {
    if (this._isBrowser()) console.error(message);
    else console.log(colors.red(message));
};

module.exports = Logger;