var Table = function(tableName) {
	this._tableData = require('../' + tableName).data;	
};

Table._tables = {};

Table.use = function(tableName) {
	if (!Table._tables[tableName]) {
		Table._tables[tableName] = new Table(tableName);
	}

	return Table._tables[tableName];
};

Table.prototype.fetch = function(condition) {
	var result = [];
	this._tableData.forEach(function(row) {
		var ok = true;
		for (var name in condition) {
			if (typeof name !== 'string' || typeof condition === 'object') continue;

			if (row[name] !== condition[name]) {
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