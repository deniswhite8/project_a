var Table = require('./Table.js'),
	Cached = require('../../common/Cached.js'),
	config = null;

var Avatar = function() {
	this._cached = new Cached();
	this.user = null;
	
	config = global.config;
};

Avatar.prototype._prepareMessage = function(messageType) {
	var response = {},
		params = this._avatarConfig[messageType],
		self = this;

	params.forEach(function(name) {
		response[name] = self[name];
	});

	return this._cached.clean(response, messageType);
};

Avatar.prototype.newMessage = function() {
	return this._prepareMessage('newMessage');
};

Avatar.prototype.updMessage = function() {
	return this._prepareMessage('updMessage');
};

Avatar.prototype.removeMessage = function() {
	return {id: this.id};
};

Avatar.prototype.save = function() {
	if (!this.id) return;

	var table = Table.use(config.table.avatar);
};

Avatar.prototype.calcChunkIdByPosition = function() {
	var x = Math.floor(this.x / config.chunk.tile.size / config.chunk.size),
		y = Math.floor(this.y / config.chunk.tile.size / config.chunk.size);

	var chunkId = x + y * config.chunk.size;
	return chunkId;
};

Avatar.prototype._init = function(params, physics) {
	for (var i in params) {
		this[i] = params[i];
	}

	this._physics = physics;
	this._avatarConfig = require('../' + config.avatar.path + '/' + this.type + '/config.json');
	var physicsConfig = this._avatarConfig.physics;

	if (physicsConfig) {
		physicsConfig.x = this.x;
		physicsConfig.y = this.y;
		physicsConfig.angle = this.angle;

		this.physicsBody = physics.createBody(physicsConfig);
	}

	if (this.init) this.init();
};

Avatar.prototype._update = function() {
	if (this.physicsBody) {
		this.physicsBody.update();

		var params = this.physicsBody.getParams();
		this.x = params.x;
		this.y = params.y;
		this.angle = params.angle;
	}
	if (this.update) this.update();

	if (this.calcChunkIdByPosition() != this.chunk.id) {
		return true;
	}
};

Avatar.prototype._input = function(input) {
	var inputData = this._cached.clean(input, 'input');
	if (inputData && this.input) this.input(inputData);
};

Avatar.prototype.disable = function() {
	this._physics.removeBody(this.physicsBody);
};

Avatar.prototype.enable = function() {
	this._physics.addBody(this.physicsBody);
};


module.exports = Avatar;