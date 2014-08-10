var Table = function(tableName) {
	this._tableData = requre(tableName);	
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

module.exports = Table;