var fs = require('fs'),
    Chunk = require('./Chunk.js'),
    config = null,
	logger = null;

var Area = function() {
    config = global.config;
	logger = global.logger;
	
	this._chunks = [];
};

Area.prototype.getChunk = function(chunkId) {
    return this._chunks[chunkId];
};

Area.prototype.loadMap = function() {
	var self = this;

	fs.readdirSync(__dirname + '/../../../' + config.map.path).forEach(function(fileName) {
		var fullFileName = __dirname + '/../../../' + config.map.path + "/" + fileName;
		if (fs.lstatSync(fullFileName).isDirectory()) return;
		
		var chunkData = require(fullFileName),
			chunk = new Chunk(chunkData.x, chunkData.y, chunkData.tiles, self);
			
		self._chunks[chunk.id] = chunk;
	});
};

Area.prototype.addAvatar = function(avatar) {
	var chunk = this._chunks[avatar.calcChunkIdByPosition()];
	if (chunk)
		chunk.addAvatar(avatar);
};

Area.prototype.removeAvatar = function(avatar) {
	var chunk = this._chunks[avatar.calcChunkIdByPosition()];
	if (chunk)
		chunk.removeAvatar(avatar);
};

Area.prototype.update = function() {
	this._chunks.forEach(function (chunk) {
		chunk._update();
	});
};

Area.prototype.transferAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	var oldChunk = avatar.chunk,
		newChunk = this._chunks[avatar.calcChunkIdByPosition()];

	if (oldChunk == newChunk) return;

	avatar.chunk = newChunk;
	delete oldChunk._avatars[avatar.id];
	newChunk._avatars[avatar.id] = avatar;

	this.symmetricDifferenceVicinityForeach(oldChunk, newChunk,
		function (chunk) {
			chunk.broadcast(config.network.messages.removeAvatar, avatar.removeMessage(), avatar);
			chunk.sendData(avatar, 'remove');
		},
		function (chunk) {
			chunk.broadcast(config.network.messages.newAvatar, avatar.newMessage(), avatar);
			chunk.sendData(avatar, 'new');
		}
	);
};

Area.prototype.symmetricDifferenceVicinityForeach = function(first, second, callbackForFirst, callbackForSecond) {
	var forFirst = [], forSecond = [];

	first.vicinityForeach(function (chunk) {
		forFirst.push(chunk);
	});

	second.vicinityForeach(function (chunk) {
		forSecond.push(chunk);
	});

	for (var i = 0; i < forFirst.length; i++) {
		for (var j = 0; j < forSecond.length; j++) {
			if (forFirst[i] == forSecond[j]) {
				delete forFirst[i];
				delete forSecond[j];
			}
		}
	}

	forFirst.forEach(callbackForFirst);
	forSecond.forEach(callbackForSecond);
};

Area.prototype.distanceMessage = function(sourceAvatar, name, messageArguments, distance, filter) {
	var chunkSize = config.map.chunk.tile.size * config.map.chunk.size,
		minChunkX = Math.floor((sourceAvatar.x - distance) / chunkSize),
		minChunkY = Math.floor((sourceAvatar.y - distance) / chunkSize),
		maxChunkX = Math.floor((sourceAvatar.x + distance) / chunkSize),
		maxChunkY = Math.floor((sourceAvatar.y + distance) / chunkSize);
		
	for (var chunkY = minChunkY; chunkY <= maxChunkY; chunkY++)
		for (var chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
			var chunkId = chunkX + chunkY * config.map.size,
			    chunk = this.getChunk(chunkId);
			if (chunk) chunk.distanceMessage(sourceAvatar, name, messageArguments, distance, filter);
		}
};

module.exports = Area;