var AvatarNode = require('./AvatarNode.js');

var Avatar = function() {
	this.rootNode = null;
};

Avatar.prototype._createRootNode = function(config, params) {
	var rootNodeName = Object.keys(config)[0],
		data = config[rootNodeName];
	
	data.name = rootNodeName;
	this.rootNode = new AvatarNode(data, params);
	this[rootNodeName] = this.rootNode;
};

Avatar.prototype._init = function(params, config) {
	this.id = params.id;
	this.type = params.id;
	
	this._createRootNode(config, params);
	this.rootNode.updateValues(params);

	if (this.init) this.init(params);
	
	this.rootNode.createSprite();
	this.rootNode.updateSprite();
};

Avatar.prototype._update = function(params) {
	this.rootNode.updateValues(params);
	if (this.update) this.update(params);
	this.rootNode.updateSprite();
};

module.exports = Avatar;