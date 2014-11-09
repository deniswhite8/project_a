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
	
	this._cleanData[name] = this._difference(this._cleanData[name], data);
	return this._cleanData[name];
};


Cached.prototype.restore = function(data, name) {
	if (!name) return null;
	if (typeof data != 'object') return data;
	if (!this._dirtyData[name]) this._dirtyData[name] = {};
	
	this._dirtyData[name] = data.extend(this._dirtyData[name]);
	
	return this._dirtyData[name];
};

module.exports = Cached;