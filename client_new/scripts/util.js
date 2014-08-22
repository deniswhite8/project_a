/*Object.prototype.depthGet = function(strPath) {
    var obj = this;
    strPath.split('.').forEach(function(field) {
        obj = obj[field];
        if (obj === undefined) return undefined;
    });

    return obj;
};

Object.prototype.depthSet = function(strPath, value) {
    var obj = this,
        pathArray = strPath.split('.');

    for (var i = 0; i < pathArray.length - 1; i++) {
        var field = pathArray[i];
        if (obj[field] === undefined) obj[field] = {};
        obj = obj[field];
    }

    obj[pathArray[pathArray.length - 1]] = value;
};*/


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