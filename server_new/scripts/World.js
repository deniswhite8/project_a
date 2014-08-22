var Physics = require('Physics.js'),
	Network = require('Network.js'),
	User = require('User.js'),
	Table = require('Table.js'),
	Chunk = require('Chunk.js'),
	config = require('../config.json'),
	fs = require("fs");


var World = function() {
	global.config = config;

	this._chunks = [];
	this._avatars = {};

	this._physics = new Physics();
	this._network = new Network();
};

World.prototype.start = function() {
	this._physics.init();
	this.loadMap();

	this._network.on(config.messages.userLogin, this.onUserLogin);
	this._network.on(config.messages.userInput, this.onUserInput);
	this._network.on(config.messages.userDisconect, this.onUserDisconect);

	this._network.listen();

	setInterval(this._update, config.physics.iterations);
};

World.prototype.userLogin = function(data) {
	var user = new User();

	if (user.login(data.login, data.passwd)) {
		var avatarId = user.getAvatarId();
		if (this.getAvatar(avatarId)) return;
		var avatar = this.createAvatar(avatarId);
		this.addAvatar(avatar);
		user.send(config.messages.controlAvatar, avatarId);
	}
};

World.prototype.userInput = function(data) {
	
};

World.prototype.userDisconect = function(data) {

};

World.prototype.loadMap = function() {
	var self = this;
	
	fs.readdirSync(config.map.path).forEach(function(fileName) {
		var chunkData = require(config.map.path + "/" + fileName),
			chunk = new Chunk(chunkData.x, chunkData.y, chunkData.tiles, self._chunks);
			
		self._chunks[chunk.index] = chunk;
	});
};

World.prototype.addAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	var chunk = this._chunks[avatar._calcChunkIndexByPosition()];
	if (chunk)
		chunk.addAvatar(avatar);

	this._avatars[avatar.id] = avatar;
};

World.prototype.removeAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	var chunk = this._chunks[avatar._calcChunkIndexByPosition()];
	if (chunk)
		chunk.removeAvatar(avatar);

	delete this._avatars[avatar.id];
};

World.prototype.getAvatar = function(id) {
	if (!id) return;

	return this._avatars[id];
};

World.prototype.createAvatar = function(id) {
	if (!id || this.getAvatar(id)) return;
	
	var table = Table.use(config.table.avatar),
		rows  = table.fetch('id', id);

	if (rows.length !== 1) return;

	var row = rows[0];

	var avatarClass = require('../' + config.avatar.path + '/' + row.type + '/' + row.type + '.js'),
		avatar = new avatarClass();

	avatar._init(row.params, this._physics);

	return avatar;
};

World.prototype._update = function() {
	this._chunks.forEach(function (chunk) {
		chunk._update();
	});
};

module.exports = World;