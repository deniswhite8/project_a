var Physics = require('Physics.js'),
	Network = require('Network.js'),
	config = require('config.json');


var World = function() {
	global.config = config;

	this._chunks = [];
	this._avatars = [];

	this._physics = new Physics();
	this._network = new Network();
};

World.prototype.start = function() {
	this._physics.init();
	this._network.listen();
};

World.prototype.addAvatar = function(avatar) {
	if (this._avatars[avatar.id]) return;

	this._avatars[avatar.id] = avatar;

	var chunk = this._chunks[avatar._calcChunkIndexByPosition()];
	if (chunk)
		chunk.addAvatar(avatar);
};

World.prototype.removeAvatar = function(avatar) {
	if (this._avatars[avatar.id]) return;

	delete this._avatars[avatar.id];

	var chunk = this._chunks[avatar._calcChunkIndexByPosition()];
	if (chunk)
		chunk.removeAvatar(avatar);
};

World.prototype.createAvatar = function(id) {
	var table = new Table(config.table.avatar),
		rows  = table.fetch('id', id);

	if (rows.length !== 1) return;

	var row = rows[0];

	var avatarClass = require(config.avatar.path + row.type + '/' + row.type + '.js'),
		avatar = new avatarClass(row.params, this._physics);

	return avatar;
};

module.exports = World;