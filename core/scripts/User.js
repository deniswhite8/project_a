var Table = require('./Table.js'),
	config = null;

var User = function() {
	this.id =
	this._login =
	this._primaryAvatar =
	this._foreignAvatar =
	this._socket = null;
	
	config = global.config;
};

User.userBySocketId = {};

User.prototype.login = function(login, passwd) {
	var table = Table.use(config.table.user),
		rows  = table.fetch({'login': login, 'passwd': passwd});

	if (rows.length !== 1) return false;

	var row = rows[0];
	this.id = row.id;
	this._login = row.login;
	this._primaryAvatar = row.primaryAvatar;
	this._foreignAvatar = row.foreignAvatar;

	return true;
};

User.prototype.getBySocket = function(socket) {
	return User.userBySocketId[socket.id];
};

User.prototype.setSocket = function(socket) {
	this._socket = socket;
	User.userBySocketId[socket.id] = this;
};

User.prototype.logout = function() {
	var socket = this._socket;
	if (!socket || !User.userBySocketId[socket.id]) return;
	
	delete User.userBySocketId[socket.id];	
};

User.prototype.send = function(name, data) {
	if (!this._socket || !name || !data || !Object.keys(data).length) return;
	this._socket.emit(name, data);
};

User.prototype.getAvatarId = function() {
	return this._primaryAvatar;
};

User.prototype.getLogin = function() {
	return this._login;
};

module.exports = User;