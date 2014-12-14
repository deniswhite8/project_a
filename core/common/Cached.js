var config = null,
    isBrowser = require('./isBrowser.js');

var Cached = function() {
	this._cleanData = {};
	this._dirtyData = {};
	
	if (isBrowser) config = window.config;
	else config = global.config;
};

Cached.prototype._difference = function(cleanObject, dirtyObject) {
    var keyDifference, differenceObject = {}, self = this;
    
    cleanObject.each(function(key, cleanValue) {
        if (!$.isObject(cleanValue) || !$.isObject(dirtyObject[key])) {
            if (!(key in dirtyObject) || cleanValue !== dirtyObject[key]) {
                differenceObject[key] = dirtyObject[key];
                if (differenceObject[key] === undefined) differenceObject[key] = null;
            }
        } else if (keyDifference = self._difference(cleanValue, dirtyObject[key])) {
            differenceObject[key] = keyDifference;
        }
    });
    
    dirtyObject.each(function(key, dirtyValue) {
        if (!(key in cleanObject)) {
            differenceObject[key] = dirtyValue;
        }
    });

    return differenceObject;
};

Cached.prototype.clean = function(data, name) {
    if (!config.network.cache.enable) return data;
	if (!data || !name) return null;
	if (!$.isObject(data)) return data;
	if (!this._cleanData[name]) this._cleanData[name] = {};
	
	var result = this._difference(this._cleanData[name], data);
	this._cleanData[name] = data.clone();
	return result;
};

Cached.prototype._deleteNulls = function(object) {
    var self = this;
    
    object.each(function(prop, value) {
        if (value === null) delete object[prop];
        else if ($.isObject(value)) self._deleteNulls(value);
    });
    
    return object;
};

Cached.prototype.restore = function(data, name) {
    if (!config.network.cache.enable) return data;
	if (!name) return null;
	if (!$.isObject(data)) return data;
	if (!this._dirtyData[name]) this._dirtyData[name] = {};
	
	this._dirtyData[name] = data.clone().extend(this._dirtyData[name]);
	this._deleteNulls(this._dirtyData[name]);
	
	return this._dirtyData[name].clone();
};

module.exports = Cached;