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
		
		condition.each(function(name, clause){
			if (row[name] !== clause) {
				ok = false;
				return true;
			}
		});

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