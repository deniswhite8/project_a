var Table = function(tableName) {
	this._tableData = require(tableName);	
};

Table._tables = {};

Table.use = function(tableName) {
	if (!Table._tables[tableName]) {
		Table._tables[tableName] = new Table(tableName);
	}

	return Table._tables[tableName];
};

Table.prototype.fetch = function() {
	if (!arguments.length || arguments.length % 2) return;

	var result = [];
	this._tableData.forEach(function(row) {
		var ok = true;
		for (var i = 0; i < arguments.length - 1; i++) {
			var name = arguments[i],
				value = arguments[i + 1];

			if (row[name] !== value) {
				ok = false;
				break;
			}
		}

		if (ok) result.push(row);
	});

	return result;
};

Table.prototype.save = function(params) {
	if (!params.id) return;

	this._tableData.some(function(row) {
		if (row.id === params.id) {
			row = Object.create(params);
			return true;
		}
	});
};

module.exports = Table;