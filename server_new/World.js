var Physics = require('Physics.js'),
	Network = require('Network.js'),
	config = require('config.json');


var World = function() {
	global.config = config;

	this._chunks = [];

	this._physics = new Physics();
	this._network = new Network();
};

World.prototype.start = function() {
	this._physics.init();
	this._network.listen();

	setInterval(this._update, config.physics.iterations);
};

World.prototype.addAvatar = function(avatar) {
	var chunk = this._chunks[avatar._calcChunkIndexByPosition()];
	if (chunk)
		chunk.addAvatar(avatar);
};

World.prototype.removeAvatar = function(avatar) {
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

World.prototype._update = function() {
	this._chunks.forEach(function (chunk) {
		chunk._update();
	});
};

module.exports = World;