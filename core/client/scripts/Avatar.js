var AvatarNode = require('./AvatarNode.js'),
	config = null;

var Avatar = function() {
	this.rootNode = null;
	config = window.config;
};

Avatar.prototype._createRootNode = function(structureConfig, params) {
	var rootNodeName = Object.keys(structureConfig)[0],
		data = structureConfig[rootNodeName];
	
	data.name = rootNodeName;
	this.rootNode = new AvatarNode(data, params);
	this[rootNodeName] = this.rootNode;
};

Avatar.prototype._init = function(params, structureConfig) {
	this.id = params.id;
	this.type = params.id;
	
	params.x *= config.map.distance.scale;
	params.y *= config.map.distance.scale;
	
	this._createRootNode(structureConfig, params);
	this.rootNode.updateValues(params);

	if (this.init) this.init(params);
	
	this.rootNode.createSprite();
	this.rootNode.updateSprite();
};

Avatar.prototype._update = function(params) {
	params.x *= config.map.distance.scale;
	params.y *= config.map.distance.scale;
	
	this.rootNode.updateValues(params);
	if (this.update) this.update(params);
	this.rootNode.updateSprite();
};

module.exports = Avatar;