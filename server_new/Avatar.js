var Avatar = function() {
	this._cached = new Cached();
	this.user = null;
};

Avatar.prototype._prepareMessage = function(messageType) {
	var response = {},
		params = this._avatarConfig[messageType];

	params.forEach(function(name) {
		response[name] = this[name];
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

Avatar.prototype.calcChunkIndexByPosition = function() {
	x = Math.floor(this.x / config.chunk.tile.size / config.chunk.size);
	y = Math.floor(this.y / config.chunk.tile.size / config.chunk.size);

	var index = x + y * config.chunk.size;
	return index;
};

Avatar.prototype._init = function(params, physics) {
	for (var i in params) {
		this[i] = params[i];
	}

	this._avatarConfig = require(config.avatar.path + this.type + '/config.json');
	physicsConfig = avatarConfig.physics;

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

	if (this.calcChunkIndexByPosition() != this.chunk.index) {
		return true;
	}
};

Avatar.prototype._input = function(input) {
	var inputData = this._cached.clean(input, 'input');
	if (inputData && this.input) this.input(inputData);
};

Avatar.prototype.disable = function() {
	physics.removeBody(this.physicsBody);
};

Avatar.prototype.enable = function() {
	physics.addBody(this.physicsBody);
};


module.exports = Avatar;