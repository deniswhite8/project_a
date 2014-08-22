define(['AvatarNode'], function (AvatarNode) {

	var Avatar = function() {
		this.rootNode = null;
	};
	
	Avatar.prototype._createRootNode = function(config) {
		var rootNodeName = Object.keys(config)[0],
			data = config[rootNodeName];
		
		this.rootNode = new AvatarNode(rootNodeName, data);
		this[rootNodeName] = this.rootNode;
	};
	
	Avatar.prototype._init = function(params, config) {
		this._createRootNode(config);
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
	
	return Avatar;
});