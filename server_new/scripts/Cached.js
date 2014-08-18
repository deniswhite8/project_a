var Cached = function() {
	this._data = {};
};

Cached.prototype.clean = function(data, name) {
	if (!data || !name) return null;
	if (!this._data[name]) this._data[name] = {};

	var result = {};

	for (var i in data[name]) {
		if (data[name][i] !== this._data[name][i]) {
			this._data[name][i] = data[name][i];
			result[i] = data[name][i];
		}
	}

	if (!Object.keys(result).length) result = null;

	return result;
};

module.exports = Cached;