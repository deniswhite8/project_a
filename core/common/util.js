var isBrowser = require('./isBrowser.js');

var $ = {};
$.isObject = function(object) {
    return typeof object === 'object';
};
$.isString = function(object) {
    return typeof object === 'string';
};
$.isFunction = function(object) {
    return typeof object === 'function';
};
if (isBrowser) window.$ = $;
else global.$ = $;


Object.prototype.extend = function(source) {
    var target = this;
    
    source.each(function(prop, sourceProp) {
        if ($.isObject(sourceProp) && sourceProp !== null) {
            if (!$.isObject(target[prop]) || target[prop] === null) {
                target[prop] = {};
            }
            target[prop].extend(sourceProp);
        } else if (target[prop] === undefined) {
            target[prop] = sourceProp;
        }
    });
    
    return target;
};

Object.prototype.clone = function() {
    if (this !== this.valueOf()) return this.valueOf(); 
    
    var cloneObject = {};
    cloneObject.extend(this);
    
    return cloneObject;
};

Object.prototype.isEmpty = function() {
    return !Object.keys(this).length;
};

Object.prototype.each = function(callback) {
    for (var key in this) {
        if (!this.hasOwnProperty(key)) continue;
        
        var result = callback.call(this, key, this[key]);
        if (result) break;
    }  
};