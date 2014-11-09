Object.prototype.extend = function(source) {
    var target = this;
    
    for (var prop in source) {
        if (!source.hasOwnProperty(prop)) continue;
        
        if (typeof source[prop] === 'object') {
            if (typeof target[prop] !== 'object') {
                target[prop] = {};
            }
            target[prop].extend(source[prop]);
        } else if (target[prop] === undefined) {
            target[prop] = source[prop];
        }
    }
    
    return target;
};

Object.prototype.clone = function() {
    var cloneObject = {};
    cloneObject.extend(this);
    
    return cloneObject;
};