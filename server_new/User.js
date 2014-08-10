var User = function() {
	this.id =
	this.login =
	this._primaryAvatar =
	this._foreignAvatar =
	this._socket = null;
}

User.prototype.login = function(login, passwd) {
	var table = new Table(config.table.user),
		rows  = table.fetch('login', login, 'passwd', passwd);

	if (rows.length !== 1) return false;

	var row = rows[0];
	this.id = row.id;
	this.login = row.login;
	this._primaryAvatar = row.primaryAvatar;
	this._foreignAvatar = row.foreignAvatar;

	return true;
};

User.prototype.setSocket = function(socket) {
	this._socket = socket;
};

User.prototype.send = function(name, data) {
	if (!this._socket || !name || !data) return;
	this._socket.send(name, data);
};

module.exports = User;