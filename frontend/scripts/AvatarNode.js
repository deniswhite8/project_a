var SpriteLoader = require('./SpriteLoader.js'),
	defaultAvatarNode = require('./defaultAvatarNode.json'),
	config = null;

var AvatarNode = function(confData, params) {
	config = window.config;
	
	this._loadValues(this, confData, params);
	this.children = {};
	this.parent = null;
	this._avatarType = params.type;

	confData.extend(defaultAvatarNode);

	var childrenConfData = confData.children;
	delete confData.children;
	this._confData = confData;

	for (var childName in childrenConfData) {
		if (!childrenConfData.hasOwnProperty(childName)) continue;
		
		var childConfData = childrenConfData[childName];
		childConfData.name = childName;
		
		var child = new AvatarNode(childConfData, params);
		this.children[childName] = child;
		child.parent = this;
	}
};

AvatarNode.prototype._childrenForeach = function(callback) {
	for (var childName in this.children) {
		if (!this.children.hasOwnProperty(childName)) continue;

		var child = this.children[childName];
		callback(child);
	}
};

AvatarNode.prototype.createSprite = function() {
	var spriteLoader = new SpriteLoader(),
		self = this;
	this._sprite = spriteLoader.load('../' + config.avatar.path + '/' + this._avatarType + '/' + 
		config.avatar.sprite.path + '/' + this.img);
	
	this._childrenForeach(function (child) {
		child.createSprite();
		self._sprite.addChild(child._sprite);
	});
};

AvatarNode.prototype._loadValues = function(target, source, params) {
	for (var prop in source) {
		if (!source.hasOwnProperty(prop) || prop == 'children') continue;
		var value = source[prop];
		
		if (typeof value == 'object') {
			if (target[prop] === undefined) target[prop] = {};
			this._loadValues(target[prop], source[prop], params);
		} else if (typeof value == 'string' && value.charAt(0) == '$') {
			target[prop] = params[value.substr(1)];
		} else if (typeof value == 'string' && value.indexOf('@name') != -1) {
			target[prop] = value.replace('@name', source.name);
		} else {
			target[prop] = value;
		}
	}
};

AvatarNode.prototype.updateValues = function(params) {
	this._loadValues(this, this._confData, params);
	
	this._childrenForeach(function(child) {
		child.updateValues(params);
	});
};

AvatarNode.prototype.updateSprite = function() {
	this._sprite.position.x = this.x;
	this._sprite.position.y = this.y;
	this._sprite.position.z = this.z;
	this._sprite.rotation = this.angle;
	this._sprite.anchor.x = this.anchor.x;
	this._sprite.anchor.y = this.anchor.y;
	this._sprite.tint = this.tint;

	this._childrenForeach(function(child) {
		child.updateSprite();
	});
};

module.exports = AvatarNode;