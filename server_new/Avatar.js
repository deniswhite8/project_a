var Avatar = function(params, physics) {
	for (var i in params) {
		this[i] = params[i];
	}

	var type = this.type = arguments.callee.caller.name;
	this._avatarConfig = require(config.avatar.path + type + '/config.json');
	physicsConfig = avatarConfig.physics;

	if (physicsConfig) {
		physicsConfig.x = this.x;
		physicsConfig.y = this.y;
		physicsConfig.angle = this.angle;

		this.physicsBody = physics.createBody(physicsConfig);
	}

	this._input = {};
	this.user = null;
};

Avatar.prototype._prepareMessage = function(messageType) {
	var response = {},
		params = this._avatarConfig[messageType];

	params.forEach(function(name) {
		response[name] = this[name];
	});

	return response;
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

Avatar.prototype._calcChunkIndexByPosition = function() {
	x = Math.floor(this.x / config.chunk.tile.size / config.chunk.size);
	y = Math.floor(this.y / config.chunk.tile.size / config.chunk.size);

	var index = x + y * config.chunk.size;
	return index;
};

Avatar.prototype._update = function() {
	if (this.physicsBody) this.physicsBody.update();
	if (this.update) this.update();
};

Avatar.prototype._input = function(input) {
	for (var i in input) {
		this._input[i] = input[i];
	}

	if (this.input) this.input(this._oldInput);
};

module.exports = Avatar;