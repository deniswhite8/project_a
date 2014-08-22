define(['SpriteLoader', 'defaultAvatarNode.json'], function(SpriteLoader, defaultAvatarNode) {

	var AvatarNode = function(name, confData) {
		this.name = name;
		this.children = {};
		this.parent = null;
		this.createSprite();

		confData.extend(defaultAvatarNode);

		var childrenConfData = confData.children;
		delete confData.children;
		this._confData = confData;

		for (var childName in childrenConfData) {
			var child = new AvatarNode(childName, childrenConfData[childName]);
			this.children[childName] = child;
			child.parent = this;
		}
	};

	AvatarNode.prototype.childrenForeach = function(callback) {
		for (var childName in this.children) {
			var child = this.children[childName];
			callback(child);
		}
	};

	AvatarNode.prototype.createSprite = function() {
		this._sprite = SpriteLoader.load(this.img);

		this.childrenForeach(function(child) {
			child.createSprite();
			this._sprite.addChild(child._sprite);
		});
	};

	AvatarNode.prototype._loadValues = function(target, source, params) {
		for (var prop in source) {
			var value = source[prop];
			
			if (typeof value === 'object') {
				if (target[prop] === undefined) target[prop] = {};
				this._loadValues(target[prop], source[prop], params);
			} else if (value.charAt(0) == '$') {
				target[prop] = params[value.substr(1)];
			} else if (value.indexOf('@name') != -1) {
				target[prop] = params[value.replace('@name', this.name)];
			} else {
				target[prop] = value;
			}
		}
	};

	AvatarNode.prototype.updateValues = function(params) {
		this._loadValues(this, this._confData, params);
		
		this.childrenForeach(function(child) {
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

		this.childrenForeach(function(child) {
			child.updateSprite();
		});
	};

	return AvatarNode;
});