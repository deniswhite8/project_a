Object.prototype.extend = function(source) {
    var target = this;
    
    for (var prop in source) {
        if (typeof source[prop] === 'object') {
            target[prop].extend(source[prop]);
        } else if (target[prop] === undefined) {
            target[prop] = source[prop];
        }
    }
};

Object.prototype.clone = function() {
    var cloneObject = {};
    cloneObject.extend(this);
    
    return cloneObject;
};