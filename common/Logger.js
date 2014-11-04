var colors = require('colors/safe');

var Logger = function () {
    
};

Logger.prototype.info = function(message) {
    console.log(colors.blue(message));
};

Logger.prototype.warn = function(message) {
    console.log(colors.yellow(message));
};

Logger.prototype.error = function(message) {
    console.log(colors.red(message));
};

module.exports = Logger;