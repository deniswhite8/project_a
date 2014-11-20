Object.prototype.extend = function(source) {
    var target = this;
    
    for (var prop in source) {
        if (!source.hasOwnProperty(prop)) continue;
        
        if (typeof source[prop] === 'object' && source[prop] !== null) {
            if (typeof target[prop] !== 'object' || target[prop] === null) {
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

Object.prototype.isEmpty = function() {
    return !Object.keys(this).length;
};