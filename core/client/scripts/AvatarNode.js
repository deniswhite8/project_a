var SpriteLoader = require('./SpriteLoader.js'),
	defaultAvatarNode = require('./defaultAvatarNode.json'),
	Sandbox = require('./Sandbox.js'),
	config = null;

var AvatarNode = function(confData, params) {
	config = window.config;
	
	this._sandbox = new Sandbox();
	this._loadValues(this, confData, params);
	this.children = {};
	this.parent = null;
	this._avatarType = params.type;

	confData.extend(defaultAvatarNode);

	var childrenConfData = confData.children;
	this._confData = this._prepareConfig(confData);

	var self = this;
	if (childrenConfData) {
		childrenConfData.each(function(childName, childConfData) {
			childConfData.name = childName;
			
			var child = new AvatarNode(childConfData, params);
			self.children[childName] = child;
			child.parent = self;
		});
	}
};

AvatarNode.prototype._prepareConfig = function(confData) {
	delete confData.children;

	var self = this;
	confData.each(function(prop, value) {
		if ($.isObject(value)) {
			self._prepareConfig(value);
		} else if ($.isString(value) && value.indexOf('@name') != -1) {
			confData[prop] = value.replace('@name', self.name);
		} else if ($.isString(value) && value.charAt(0) == '#') {
			confData[prop] = self._sandbox.getFunction(value.substr(1));
		}
	});
	
	return confData;
};

AvatarNode.prototype._childrenForeach = function(callback) {
	this.children.each(function(childName, child) {
		callback(child);
	});
};

AvatarNode.prototype.createSprite = function() {
	var spriteLoader = new SpriteLoader(),
		self = this;
	this._sprite = spriteLoader.getAvatarNode(this._avatarType, this.img);
	
	this._childrenForeach(function (child) {
		child.createSprite();
		self._sprite.addChild(child._sprite);
	});
};

AvatarNode.prototype._loadValues = function(target, source, params) {
	var self = this;
	source.each(function(prop, value) {
		if (prop == 'children') return;
		
		if ($.isObject(value)) {
			if (target[prop] === undefined) target[prop] = {};
			self._loadValues(target[prop], source[prop], params);
		} else if ($.isFunction(value)) {
			target[prop] = value(params);
		} else {
			target[prop] = value;
		}
	});
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
	this._sprite.scale.x = this.scale.x;
	this._sprite.scale.y = this.scale.y;
	this._sprite.tint = this.tint;

	this._childrenForeach(function(child) {
		child.updateSprite();
	});
};

module.exports = AvatarNode;