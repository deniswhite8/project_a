var Cached = function() {
	this._cleanData = {};
	this._dirtyData = {};
};

Cached.prototype.clean = function(data, name) {
	if (!data || !name) return null;
	if (!this._cleanData[name]) this._cleanData[name] = {};

	var result = {};

	for (var i in data) {
		if (data[i] !== this._cleanData[name][i]) {
			this._cleanData[name][i] = data[i];
			result[i] = data[i];
		}
	}
	
	for (var i in this._cleanData[name]) {
		if (data[i] === undefined) {
			delete this._cleanData[name][i];
			result[i] = undefined;
		}
	}

	if (!Object.keys(result).length) result = null;

	return result;
};

Cached.prototype.restore = function(data, name) {
	if (!name) return null;
	if (!this._dirtyData[name]) this._dirtyData[name] = {};
	
	for (var i in data) {
		this._dirtyData[name][i] = data[i];
	}
	
	return this._dirtyData[name];
};

module.exports = Cached;