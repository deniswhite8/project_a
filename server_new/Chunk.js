var Chunk = function(x, y, chunks) {
	this._tiles = [];
	this._avatars = {};
	this._chunks = chunks;

	this.x = x;
	this.y = y;
};

Chunk.prototype.addAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	this._avatars[avatar.id] = avatar;

	this.groupForeach(function(chunk) {
		chunk.broadcast(config.avatar.newAvatar, avatar.newMessage(), avatar);
		chunk.sendData(avatar, 'new');
	});
};

Chunk.prototype.removeAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	delete this._avatars[avatar.id];

	this.groupForeach(function(chunk) {
		chunk.broadcast(config.avatar.removeAvatar, avatar.removeMessage(), avatar);
		chunk.sendData(avatar, 'remove');
	});
};

Chunk.prototype.broadcast = function(name, data, exceptAvatar) {
	var userId = avatar.user.id;

	this._avatars.forEach(function(avatar) {
		if (avatar.user.id !== userId) {
			avatar.user.send(name, data);
		}
	});
};

Chunk.prototype.sendData = function(recipientAvatar, type) {
	if (type == 'new') type = true;
	else if (type == 'remove') type = false;
	else return;

	if (type) recipientAvatar.user.send(config.message.newChunkTiles, this._tiles);
	else recipientAvatar.user.send(config.message.removeChunkTiles, this.x + this.y * config.chunk.size);

	this._avatars.forEach(function(avatar) {
		if (type) recipientAvatar.user.send(config.message.newAvatar, avatar.newMessage());
		else recipientAvatar.user.send(config.message.removeAvatar, avatar.removeMessage());
	});
};

Chunk.prototype.groupForeach = function(callback) {
	var groupRadius = config.chunk.groupRadius - 1;

	for(var x = this.x - groupRadius; x < this.x + groupRadius; x++)
		for(var y = this.y - groupRadius; y < this.y + groupRadius; y++) {
			var index = x + y * config.chunk.size;
			if (!this._chunks[index]) continue;
			callback(this._chunks[index]);
		}
};

module.exports = Chunk;