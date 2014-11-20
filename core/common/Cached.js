var Cached = function() {
	this._cleanData = {};
	this._dirtyData = {};
};

Cached.prototype._difference = function(cleanObject, dirtyObject) {
    var key, keyDifference, differenceObject = {};
    
    for (key in cleanObject) {
        if (!cleanObject.hasOwnProperty(key)) {
        } else if (typeof cleanObject[key] != 'object' || typeof dirtyObject[key] != 'object') {
            if (!(key in dirtyObject) || cleanObject[key] !== dirtyObject[key]) {
                differenceObject[key] = dirtyObject[key];
                if (differenceObject[key] === undefined) differenceObject[key] = null;
            }
        } else if (keyDifference = this._difference(cleanObject[key], dirtyObject[key])) {
            differenceObject[key] = keyDifference;
        }
    }
    for (key in dirtyObject) {
        if (dirtyObject.hasOwnProperty(key) && !(key in cleanObject)) {
            differenceObject[key] = dirtyObject[key];
        }
    }

    return differenceObject;
};

Cached.prototype.clean = function(data, name) {
	if (!data || !name) return null;
	if (typeof data != 'object') return data;
	if (!this._cleanData[name]) this._cleanData[name] = {};
	
	var result = this._difference(this._cleanData[name], data);
	this._cleanData[name] = data.clone();
	return result;
};

Cached.prototype._deleteNulls = function(object) {
    for (var prop in object) {
        if (!object.hasOwnProperty(prop)) continue;
        
        if (object[prop] === null) delete object[prop];
        else if (typeof object[prop] == 'object') this._deleteNulls(object[prop]);
    }
    
    return object;
};

Cached.prototype.restore = function(data, name) {
	if (!name) return null;
	if (typeof data != 'object') return data;
	if (!this._dirtyData[name]) this._dirtyData[name] = {};
	
	this._dirtyData[name] = data.clone().extend(this._dirtyData[name]);
	this._deleteNulls(this._dirtyData[name]);
	
	return this._dirtyData[name].clone();
};

module.exports = Cached;