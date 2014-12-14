(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Avatar = require('../../../core/client/scripts/Avatar.js');

var Panzer = function() {
	Avatar.call(this);	
};
Panzer.prototype = Object.create(Avatar.prototype);

Panzer.prototype.init = function(params) {
	
};

Panzer.prototype.update = function(params) {
	this.body.children.turret.angle *= -1;
	this.body.children.border.children.line.tint = ((0xFF * params.health) << 8) + ((0xFF * (1-params.health)) << 16);
};

module.exports = Panzer;
},{"../../../core/client/scripts/Avatar.js":5}],2:[function(require,module,exports){
module.exports={
    "body": {
        "x": "#x",
        "y": "#y",
        "z": 10,
        "angle": "#angle",
        "radius": 20,
        "children": {
            "border": {
                "y": -20,
                "children": {
                    "line": {
                        "scale": {
                            "x": "#health"
                        }
                    }
                }
            },
            "turret": {
                "angle": "# sqrt(abs(turretAngle))",
                "anchor": {
                    "x": 0.5,
                    "y": 0.8
                } 
            }
        }
    }
}
},{}],3:[function(require,module,exports){
module.exports={
    "network": {
        "host": "http://localhost"
    },
	"control": {
	    "input": {
	        "frequencySend": 0.1
	    }
	},
	"map": {
		"tileset": {
			"extension": "png"
		}
	},
	"avatar": {
		"path": "avatars/",
		"sprite": {
			"path": "media/"
		}
	},
	"sandbox": {
		"bind": {
			"sqrt": "Math.sqrt",
			"abs": "Math.abs"
		}
	}
}
},{}],4:[function(require,module,exports){
'use strict';

var World = require('./scripts/World.js');

var world = new World();
world.start();
},{"./scripts/World.js":14}],5:[function(require,module,exports){
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
},{"./AvatarNode.js":7}],6:[function(require,module,exports){
var classes = {},
	configs = {};

// @_requireAvatarFolder
// @_start
// classes['Car'] = require('../../../avatars//Car/client/Car.js');
// configs['Car'] = require('../../../avatars//Car/client/config.json');
// classes['Man'] = require('../../../avatars//Man/client/Man.js');
// configs['Man'] = require('../../../avatars//Man/client/config.json');
classes['Panzer'] = require('../../../avatars//Panzer/client/Panzer.js');
configs['Panzer'] = require('../../../avatars//Panzer/client/config.json');
// classes['Passage'] = require('../../../avatars//Passage/client/Passage.js');
// configs['Passage'] = require('../../../avatars//Passage/client/config.json');
// @_end


var AvatarLoader = function() {
	
};

AvatarLoader.prototype.getClass = function(type) {
	return classes[type];
};

AvatarLoader.prototype.getConfig = function(type) {
	return configs[type];
};

module.exports = AvatarLoader;
},{"../../../avatars//Panzer/client/Panzer.js":1,"../../../avatars//Panzer/client/config.json":2}],7:[function(require,module,exports){
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
	this._sprite = spriteLoader.load(config.avatar.path + '/' + this._avatarType + '/' + this.img);
	
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
},{"./Sandbox.js":12,"./SpriteLoader.js":13,"./defaultAvatarNode.json":15}],8:[function(require,module,exports){
var SpriteLoader = require('./SpriteLoader'),
    config = null;

var Chunk = function(data) {
    this.x = data.x;
    this.y = data.y;
    this.id = data.id;
    this._tiles = data.tiles;
    this._rootGraphicsNode = null;
    config = window.config;
    
    this._createTiles();
};

Chunk.prototype._createTiles = function() {
    var spriteLoader = new SpriteLoader(),
        self = this;
        
    this._rootGraphicsNode = spriteLoader.load();
    this._rootGraphicsNode.position.x = this.x * config.map.chunk.size * config.map.chunk.tile.size;
    this._rootGraphicsNode.position.y = this.y * config.map.chunk.size * config.map.chunk.tile.size;
    
    this._tiles.forEach(function(tile, i) {
        if (!tile) return;
        var tileSprite = spriteLoader.load(config.map.tileset.path + '/' + tile + '.' + config.map.tileset.extension);
            
        tileSprite.position.x = (i % config.map.chunk.size) * config.map.chunk.tile.size;
        tileSprite.position.y = Math.floor(i / config.map.chunk.size) * config.map.chunk.tile.size;
        self._rootGraphicsNode.addChild(tileSprite);
    });
};

module.exports = Chunk;
},{"./SpriteLoader":13}],9:[function(require,module,exports){
var PIXI = require('pixi');

var Graphics = function() {

};

Graphics.prototype.init = function(wrapperDivId, width, height, stats) {
    this._width = width;
    this._height = height;
    this._stage = new PIXI.Stage(0x000000);
	this._renderer = PIXI.autoDetectRenderer(width, height);
	this._viewPort = new PIXI.DisplayObjectContainer();
	this._mapPivot = new PIXI.DisplayObjectContainer();

	this._wrapperDiv = document.getElementById(wrapperDivId);
    this._wrapperDiv.appendChild(stats.domElement);
    
    this._stage.addChild(this._viewPort);
    this._wrapperDiv.appendChild(this._renderer.view);
    this._viewPort.addChild(this._mapPivot);
};

Graphics.prototype.getViewElement = function() {
    return this._renderer.view;  
};




Graphics.prototype.viewPortFocus = function(x, y) {
    this._viewPort.position.x = this._width/2 - x;
	this._viewPort.position.y = this._height/2 - y;
};

Graphics.prototype.getViewPortX = function() {
    return this._viewPort.position.x;
};

Graphics.prototype.getViewPortY = function() {
    return this._viewPort.position.y;
};






Graphics.prototype.addAvatar = function(avatar) {
    if (!avatar) return;
    this._viewPort.addChild(avatar.rootNode._sprite);
};

Graphics.prototype.addChunk = function(chunk) {
    if (!chunk) return;
    this._mapPivot.addChild(chunk._rootGraphicsNode);
};

Graphics.prototype.removeAvatar = function(avatar) {
    if (!avatar) return;
    this._viewPort.removeChild(avatar.rootNode._sprite);
};

Graphics.prototype.removeChunk = function(chunk) {
    if (!chunk) return;
    this._mapPivot.removeChild(chunk._rootGraphicsNode);
};





Graphics.prototype.render = function() {
    this._sortZ(this._viewPort);
    this._renderer.render(this._stage);
};

Graphics.prototype._sortZ = function(node) {
	node.children.sort(function (a, b) {
		return a.position.z - b.position.z;
	});
};

module.exports = Graphics;
},{"pixi":90}],10:[function(require,module,exports){
var Cached = require('../../common/Cached.js');

var Input = function() {
    this._dx = 0;
    this._dy = 0;
    this.mouseAngle = 0;
    this._pressedKeys = [];
    this._cached = new Cached();
};

Input.prototype.setOffset = function(dx, dy) {
	this._dx = dx;
	this._dy = dy;
};

Input.prototype.setSelfAvatar = function(avatar) {
	this._selfAvatar = avatar;
};

Input.prototype.getSelectAvatar = function() {
	return this._selectAvatar;
};

Input.prototype.init = function (viewElement, avatars) {
	var rendererRect = viewElement.getBoundingClientRect(),
		width = viewElement.width,
		height = viewElement.height,
        self = this;

	viewElement.addEventListener('mousemove', function(event) {
	    self.mouseX = event.clientX - rendererRect.left;
		self.mouseY = event.clientY - rendererRect.top;
	    self.mouseAngle = Math.atan2(self.mouseY - height/2, self.mouseX - width/2);
	}, false);

	viewElement.addEventListener('mousedown', function(event) {
		var mouseX = event.clientX - rendererRect.left,
		    mouseY = event.clientY - rendererRect.top;
		    
	    self._selectAvatar = null;
	   	avatars.some(function(avatar) {
	   	    if (avatar != self._selfAvatar &&
	   	        Math.pow(avatar.rootNode._sprite.position.x - mouseX + self._dx, 2) +
	   	        Math.pow(avatar.rootNode._sprite.position.y - mouseY + self.dy, 2) <
	   	        Math.pow(avatar.rootNode.radius, 2)) {
	   	            
	    		self._selfAvatar = avatar;
	    		return true;
	    	}
	   	});
    }, false);

    viewElement.addEventListener('mouseup', function(event) {

    }, false);

    window.addEventListener('keydown', function(event) {
        self._pressedKeys[event.keyCode] = true;
    }, false);

    window.addEventListener('keyup', function(event) {
        self._pressedKeys[event.keyCode] = false;
    }, false);
};

Input.prototype.keyIsPressed = function(keyCode) {
	if ($.isString(keyCode))
		keyCode = keyCode.toUpperCase().charCodeAt(0);
	return !!this._pressedKeys[keyCode];
};

Input.prototype.getInputData = function() {
	var input = {
		angle: this.mouseAngle,
		up: this.keyIsPressed('W'),
		down: this.keyIsPressed('S'),
		left: this.keyIsPressed('A'),
		right: this.keyIsPressed('D'),
		inOut: this.keyIsPressed('E') &&
			this.getSelectAvatar() &&
			this.getSelectAvatar().id
	};

	return this._cached.clean(input, 'input');
};

module.exports = Input;
},{"../../common/Cached.js":17}],11:[function(require,module,exports){
var Pack = require('../../common/Pack.js');

var config = null;

var Network = function() {
    this._eventCallbacks = [];
    this._socket = null;
    this._pack = new Pack();
    
    config = window.config;
};

Network.prototype.connect = function() {
    this._socket = io();
};

Network.prototype.on = function(name, callback) {
    var self = this;
    
    this._socket.on(name, function(data) {
        var decodedData = self._pack.decode(data);
        callback.call(self, decodedData, this);
    });
};

Network.prototype.send = function(name, data) {
    if (!this._socket) return;
    
    var encodedData = this._pack.encode(data);
    this._socket.emit(name, encodedData);
};

module.exports = Network;

},{"../../common/Pack.js":19}],12:[function(require,module,exports){
var logger = null,
    config = null;

var Sandbox = function() {
    logger = window.logger;
    config = window.config;
};

Sandbox.prototype.getFunction = function(expression) {
    var dataObjectName = 'params';
    
    var preparedExpression = expression
        .replace(/\[|]|{|}|`|var|function|new|throw|delete|debugger|window|this|if|while|for|case/g, '')
        .replace(/[a-zA-Z_$][0-9a-zA-Z_$]*/g, function(varName) {
            return dataObjectName + '.' + varName; 
        });
    
    config.sandbox.bind.each(function(name, value) {
        preparedExpression = preparedExpression.replace(
            new RegExp(dataObjectName + '.' + name, 'g'), value
        );
    });
    
    preparedExpression = 'return (' + preparedExpression + ');';
    
    try {
        return new Function(dataObjectName, preparedExpression);
    } catch (e) {
        logger.error('Incorrect avatar node function: ' + expression);
        return null;
    }
};

module.exports = Sandbox;
},{}],13:[function(require,module,exports){
var PIXI = require('pixi');

var SpriteLoader = function() {
	
};

SpriteLoader._textures = {};

SpriteLoader.prototype.load = function(fileName) {
	if (fileName) {
		fileName = fileName.replace(/\/+/g, '/');
		
		if (!SpriteLoader._textures[fileName]) {
			SpriteLoader._textures[fileName] = PIXI.Texture.fromImage(fileName);
		}
		
		var texture = SpriteLoader._textures[fileName];
		return new PIXI.Sprite(texture);
	} else {
		return new PIXI.DisplayObjectContainer();
	}
};

module.exports = SpriteLoader;
},{"pixi":90}],14:[function(require,module,exports){
require('../../common/util.js');

var AvatarLoader = require('./AvatarLoader.js'),
    Stats = require('./stats.js'),
    Graphics = require('./Graphics.js'),
    Input = require('./Input.js'),
    Network = require('./Network.js'),
    Chunk = require('./Chunk.js'),
    localConfig = require('../config.json'),
	globalConfig = require('../../common/config.json'),
	Logger = require('../../common/Logger.js'),
	Cached = require('../../common/Cached.js'),
	logger = null,
    config = null,
    self = null;

var World = function() {
    config = window.config = globalConfig.extend(localConfig);
    logger = window.logger = new Logger();
    self = this;
    
    logger.info('Creating world');
    
    this._avatars = [];
    this._frameCounter = 0;
    this._stats = new Stats();
    logger.info('Init graphics module');
    this._graphics = new Graphics();
    this._controlAvatar = null;
    logger.info('Init input module');
    this._input = new Input();
    logger.info('Init network module');
    this._network = new Network();
    this._chunks = [];
    this._cached = new Cached();
    
    this._frameFrequencyInputSend = Math.floor(config.control.input.frequencySend * 60);
    if (this._frameFrequencyInputSend === 0) this._frameFrequencyInputSend = 1;
};

World.prototype.start = function() {
    logger.info('Starting world');
    
    logger.info('Network connect');
    this._network.connect();
    this._stats.setMode(2);
    logger.info('Graphics init');
    this._graphics.init('centerDiv', 640, 480, this._stats);
    logger.info('Input init');
    this._input.init(this._graphics.getViewElement(), this._avatars);
    
    this._network.on(config.network.messages.newChunk, this.onNewChunk);
    this._network.on(config.network.messages.removeChunk, this.onRemoveChunk);
    this._network.on(config.network.messages.newAvatar, this.onNewAvatar);
    this._network.on(config.network.messages.removeAvatar, this.onRemoveAvatar);
    this._network.on(config.network.messages.setControlAvatar, this.onSetControlAvatar);
    this._network.on(config.network.messages.updateAvatar, this.onUpdateAvatar);
    
    this._network.send(config.network.messages.userLogin, {
        login: 'denis',
        passwd: 'qwe'
    });
    
    logger.info('Start update world main loop');
    this._step();
};

World.prototype.onUpdateAvatar = function(data, socket) {
    if (!data || !data.id) return;
    
    data = self._cached.restore(data, 'avatarUpdParams_' + data.id);
    var avatar = self.getAvatar(data.id);
    if (!avatar) return;
    
    avatar._update(data);
};

World.prototype.onNewChunk = function(data, socket) {
    logger.info('New chunk event, data = ');
    logger.log(data);
    
    if (!data || !data.id) return;
    if (self._chunks[data.id]) self.onRemoveChunk();
    
    var chunk = new Chunk(data);
    self._chunks[data.id] = chunk;
    self._graphics.addChunk(chunk);
    
    if (!data.avatars) return;
    data.avatars.forEach(function (avatarData) {
        var avatar = self.createAvatar(avatarData);
        self.addAvatar(avatar);
    });
};

World.prototype.onRemoveChunk = function(data, socket) {
    logger.info('Remove chunk event, data = ');
    logger.log(data);
    
    if (!data || !data.id || !this._chunks[data.id]) return;
    
    self._graphics.removeChunk(self._chunks[data.id]);
    delete self._chunks[data.id];
    
    if (!data.avatars) return;
    data.avatars.forEach(function (avatarData) {
        var avatar = self.getAvatar(avatarData.id);
        self.removeAvatar(avatar);
    });
};

World.prototype.onNewAvatar = function(data, socket) {
    logger.info('New avatar event, data = ');
    logger.log(data);
    
    var avatar = self.createAvatar(data);
    self.addAvatar(avatar);
};

World.prototype.onRemoveAvatar = function(data, socket) {
    logger.info('Remove avatar event, data = ');
    logger.log(data);
    
    var avatar = self.getAvatar(data.id);
    self.removeAvatar(avatar);
};

World.prototype.onSetControlAvatar = function(avatarId, socket) {
    logger.info('Set control avatar event, id = ');
    logger.log(avatarId);
    
    self._controlAvatar = self.getAvatar(avatarId);
};



World.prototype.getAvatar = function(id) {
    if (!id) return;
    
    return this._avatars[id];  
};

World.prototype.removeAvatar = function(avatar) {
    if (!avatar || !avatar.id) return;
    
    this._graphics.removeAvatar(avatar.id);
    delete this._avatars[avatar.id];  
};

World.prototype.addAvatar = function(avatar) {
    if (!avatar || !avatar.id) return;
    
    this._avatars[avatar.id] = avatar;
    this._graphics.addAvatar(avatar);
};

World.prototype.createAvatar = function(params) {
    var type = params.type,
        id = params.id;
        
    if (!type || !id || this.getAvatar(id)) return;
    
    var avatarLoader = new AvatarLoader(),
        avatarClass = avatarLoader.getClass(type),
        avatarConfig = avatarLoader.getConfig(type);
        
    if (!avatarClass || !avatarConfig) return;
    
    var avatar = new avatarClass();
    avatar._init(params, avatarConfig);
    
    return avatar;
};

World.prototype._step = function() {
    self._stats.begin();
    self._updateFunction();
    self._stats.end();
    
    window.requestAnimationFrame(self._step);
};


World.prototype._updateFunction = function() {
    this._frameCounter++;
    
    if(this._frameCounter % this._frameFrequencyInputSend) {
		var inputData = this._input.getInputData();
		if (!inputData.isEmpty()) this._network.send(config.network.messages.userInput, inputData);
	}

	if (this._controlAvatar) {
		this._graphics.viewPortFocus(this._controlAvatar.rootNode.x, this._controlAvatar.rootNode.y);
	}

	this._input.setOffset(this._graphics.getViewPortX(), this._graphics.getViewPortY());
	
	this._graphics.render();
};
    
module.exports = World;
},{"../../common/Cached.js":17,"../../common/Logger.js":18,"../../common/config.json":20,"../../common/util.js":22,"../config.json":3,"./AvatarLoader.js":6,"./Chunk.js":8,"./Graphics.js":9,"./Input.js":10,"./Network.js":11,"./stats.js":16}],15:[function(require,module,exports){
module.exports={
    "x": 0,
    "y": 0,
    "z": 10,
    "angle": 0,
    "radius": 20,
    "anchor": {
        "x": 0.5,
        "y": 0.5
    },
    "scale": {
        "x": 1,
        "y": 1
    },
    "tint": 0xFFFFFF,
    "img": "@name.png"
}
},{}],16:[function(require,module,exports){
// stats.js - http://github.com/mrdoob/stats.js
var Stats=function(){var l=Date.now(),m=l,g=0,n=Infinity,o=0,h=0,p=Infinity,q=0,r=0,s=0,f=document.createElement("div");f.id="stats";f.addEventListener("mousedown",function(b){b.preventDefault();t(++s%2)},!1);f.style.cssText="width:80px;opacity:0.9;cursor:pointer";var a=document.createElement("div");a.id="fps";a.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#002";f.appendChild(a);var i=document.createElement("div");i.id="fpsText";i.style.cssText="color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
i.innerHTML="FPS";a.appendChild(i);var c=document.createElement("div");c.id="fpsGraph";c.style.cssText="position:relative;width:74px;height:30px;background-color:#0ff";for(a.appendChild(c);74>c.children.length;){var j=document.createElement("span");j.style.cssText="width:1px;height:30px;float:left;background-color:#113";c.appendChild(j)}var d=document.createElement("div");d.id="ms";d.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#020;display:none";f.appendChild(d);var k=document.createElement("div");
k.id="msText";k.style.cssText="color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";k.innerHTML="MS";d.appendChild(k);var e=document.createElement("div");e.id="msGraph";e.style.cssText="position:relative;width:74px;height:30px;background-color:#0f0";for(d.appendChild(e);74>e.children.length;)j=document.createElement("span"),j.style.cssText="width:1px;height:30px;float:left;background-color:#131",e.appendChild(j);var t=function(b){s=b;switch(s){case 0:a.style.display=
"block";d.style.display="none";break;case 1:a.style.display="none",d.style.display="block"}};return{REVISION:11,domElement:f,setMode:t,begin:function(){l=Date.now()},end:function(){var b=Date.now();g=b-l;n=Math.min(n,g);o=Math.max(o,g);k.textContent=g+" MS ("+n+"-"+o+")";var a=Math.min(30,30-30*(g/200));e.appendChild(e.firstChild).style.height=a+"px";r++;b>m+1E3&&(h=Math.round(1E3*r/(b-m)),p=Math.min(p,h),q=Math.max(q,h),i.textContent=h+" FPS ("+p+"-"+q+")",a=Math.min(30,30-30*(h/100)),c.appendChild(c.firstChild).style.height=
a+"px",m=b,r=0);return b},update:function(){l=this.end()}}};

module.exports = Stats;
},{}],17:[function(require,module,exports){
(function (global){
var config = null,
    isBrowser = require('./isBrowser.js');

var Cached = function() {
	this._cleanData = {};
	this._dirtyData = {};
	
	if (isBrowser) config = window.config;
	else config = global.config;
};

Cached.prototype._difference = function(cleanObject, dirtyObject) {
    var keyDifference, differenceObject = {}, self = this;
    
    cleanObject.each(function(key, cleanValue) {
        if (!$.isObject(cleanValue) || !$.isObject(dirtyObject[key])) {
            if (!(key in dirtyObject) || cleanValue !== dirtyObject[key]) {
                differenceObject[key] = dirtyObject[key];
                if (differenceObject[key] === undefined) differenceObject[key] = null;
            }
        } else if (keyDifference = self._difference(cleanValue, dirtyObject[key])) {
            differenceObject[key] = keyDifference;
        }
    });
    
    dirtyObject.each(function(key, dirtyValue) {
        if (!(key in cleanObject)) {
            differenceObject[key] = dirtyValue;
        }
    });

    return differenceObject;
};

Cached.prototype.clean = function(data, name) {
    if (!config.network.cache.enable) return data;
	if (!data || !name) return null;
	if (!$.isObject(data)) return data;
	if (!this._cleanData[name]) this._cleanData[name] = {};
	
	var result = this._difference(this._cleanData[name], data);
	this._cleanData[name] = data.clone();
	return result;
};

Cached.prototype._deleteNulls = function(object) {
    var self = this;
    
    object.each(function(prop, value) {
        if (value === null) delete object[prop];
        else if ($.isObject(value)) self._deleteNulls(value);
    });
    
    return object;
};

Cached.prototype.restore = function(data, name) {
    if (!config.network.cache.enable) return data;
	if (!name) return null;
	if (!$.isObject(data)) return data;
	if (!this._dirtyData[name]) this._dirtyData[name] = {};
	
	this._dirtyData[name] = data.clone().extend(this._dirtyData[name]);
	this._deleteNulls(this._dirtyData[name]);
	
	return this._dirtyData[name].clone();
};

module.exports = Cached;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./isBrowser.js":21}],18:[function(require,module,exports){
var colors = require('colors/safe'),
    isBrowser = require('./isBrowser.js')

var Logger = function () {
    this.log = this.info = this.warn = this.error = null;
    
    if (isBrowser) {
        this.log = this._browserLog;
        this.info = this._browserInfo;
        this.warn = this._browserWarn;
        this.error = this._browserError;
    } else {
        this.log = this._nodeLog;
        this.info = this._nodeInfo;
        this.warn = this._nodeWarn;
        this.error = this._nodeError;
    }
};

Logger.prototype._browserLog = function(message) {
    console.log(message.clone());
};

Logger.prototype._browserInfo = function(message) {
    console.info(message.clone());
};

Logger.prototype._browserWarn = function(message) {
    console.warn(message.clone());
};

Logger.prototype._browserError = function(message) {
    console.error(message.clone());
};



Logger.prototype._nodeLog = function(message) {
    console.log(message.clone());
};

Logger.prototype._nodeInfo = function(message) {
    console.log(colors.blue(message.clone()));
};

Logger.prototype._nodeWarn = function(message) {
    console.log(colors.yellow(message.clone()));
};

Logger.prototype._nodeError = function(message) {
    console.log(colors.red(message.clone()));
};

module.exports = Logger;
},{"./isBrowser.js":21,"colors/safe":37}],19:[function(require,module,exports){
(function (global,Buffer){
var nodeMsgpack = require('msgpack-js'),
    browserMsgpack = require('msgpack-js-browser'),
    isBrowser = require('./isBrowser.js'),
    config = null;

var Pack = function() {
    this._msgpack = null;
    
    if (isBrowser) {
        this._msgpack = browserMsgpack;
        config = window.config;
    } else {
        this._msgpack = nodeMsgpack;
        config = global.config;
    }
};

Pack.prototype._msgpackEncode = function(data) {
    var encodedData = this._msgpack.encode(data);
    
    if (isBrowser) {
        return new Uint8Array(encodedData);
    } else {
        return encodedData;
    }
};

Pack.prototype._msgpackDecode = function(bytes) {
    var preparedData = null;
    
    if (isBrowser) {
        preparedData = new Uint8Array(bytes).buffer;
    }
    else {
        preparedData = new Buffer(bytes);
    }
    
    return this._msgpack.decode(preparedData);
};

Pack.prototype.encode = function(data) {
    if (!config.network.pack.enable) return data;
    
    var bytes = this._msgpackEncode(data);
    
    var chars = [],
        length = bytes.length;
    for(var i = 0; i < length; ) {
        chars.push(((bytes[i++] & 0xff) << 8) | (bytes[i++] & 0xff));
    }

    var message = String.fromCharCode.apply(null, chars);
    if (length % 2) message += '+';
    
    return '#' + message;
};

Pack.prototype.decode = function(message) {
    if (!config.network.pack.enable || message[0] != '#') return message;
    else message = message.substr(1);
    
    var length = message.length,
        bytes = [],
        excessByte = false;
        
    if (message[length - 1] == '+') {
        message.slice(0, -1);
        length--;
        excessByte = true;
    }

    for(var i = 0; i < length; i++) {
        var char = message.charCodeAt(i);
        bytes.push(char >>> 8, char & 0xFF);
    }
    
    if (excessByte) bytes.pop();
    
    return this._msgpackDecode(bytes);
};

module.exports = Pack;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./isBrowser.js":21,"buffer":23,"msgpack-js":39,"msgpack-js-browser":38}],20:[function(require,module,exports){
module.exports={
	"map": {
		"chunk": {
			"size": 10,
			"tile": {
				"size": 32
			}
		},
		"size": 32,
		"groupRadius": 2,
		"tileset": {
			"path": "tileset/"
		},
		"distance": {
			"scale": 100
		}
	},
    "network": {
    	"messages": {
	    	"newChunk": "new_tl",
	    	"removeChunk": "del_tl",
	    	"newAvatar": "new_av",
	    	"removeAvatar": "del_av",
	    	"updateAvatar": "upd_av",
	    	"setControlAvatar": "ctrl_av",
	    
	    	"userLogin": "login",
	    	"userInput": "input"
    	},
    	"cache": {
    		"enable": true
    	},
    	"pack": {
    		"enable": true
    	}
    }
}
},{}],21:[function(require,module,exports){
var isBrowser = function() {
    try {
        window;
        return true;
    } catch (e) {
        return false;
    }
};

module.exports = isBrowser();
},{}],22:[function(require,module,exports){
(function (global){
var isBrowser = require('./isBrowser.js');

var $ = {};
$.isObject = function(object) {
    return typeof object === 'object';
};
$.isString = function(object) {
    return typeof object === 'string';
};
$.isFunction = function(object) {
    return typeof object === 'function';
};
if (isBrowser) window.$ = $;
else global.$ = $;


Object.prototype.extend = function(source) {
    var target = this;
    
    source.each(function(prop, sourceProp) {
        if ($.isObject(sourceProp) && sourceProp !== null) {
            if (!$.isObject(target[prop]) || target[prop] === null) {
                target[prop] = {};
            }
            target[prop].extend(sourceProp);
        } else if (target[prop] === undefined) {
            target[prop] = sourceProp;
        }
    });
    
    return target;
};

Object.prototype.clone = function() {
    if (this !== this.valueOf()) return this.valueOf(); 
    
    var cloneObject = {};
    cloneObject.extend(this);
    
    return cloneObject;
};

Object.prototype.isEmpty = function() {
    return !Object.keys(this).length;
};

Object.prototype.each = function(callback) {
    for (var key in this) {
        if (!this.hasOwnProperty(key)) continue;
        
        var result = callback.call(this, key, this[key]);
        if (result) break;
    }  
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./isBrowser.js":21}],23:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    if (encoding === 'base64')
      subject = base64clean(subject)
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new TypeError('must start with number, buffer, array or string')

  if (this.length > kMaxLength)
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
      'size: 0x' + kMaxLength.toString(16) + ' bytes')

  var buf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw new TypeError('Arguments must be Buffers')

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase)
          throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function (b) {
  if(!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max)
      str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0)
    throw new RangeError('offset is not uint')
  if (offset + ext > length)
    throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80))
    return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  if (end < start) throw new TypeError('sourceEnd < sourceStart')
  if (target_start < 0 || target_start >= target.length)
    throw new TypeError('targetStart out of bounds')
  if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds')
  if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new TypeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new TypeError('start out of bounds')
  if (end < 0 || end > this.length) throw new TypeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":24,"ieee754":25,"is-array":26}],24:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],25:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],26:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],27:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],28:[function(require,module,exports){
/*

The MIT License (MIT)

Original Library 
  - Copyright (c) Marak Squires

Additional functionality
 - Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var colors = {};
module['exports'] = colors;

colors.themes = {};

var ansiStyles = colors.styles = require('./styles');
var defineProps = Object.defineProperties;

colors.supportsColor = require('./system/supports-colors');

if (typeof colors.enabled === "undefined") {
  colors.enabled = colors.supportsColor;
}

colors.stripColors = colors.strip = function(str){
  return ("" + str).replace(/\x1B\[\d+m/g, '');
};


var stylize = colors.stylize = function stylize (str, style) {
  return ansiStyles[style].open + str + ansiStyles[style].close;
}

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
var escapeStringRegexp = function (str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }
  return str.replace(matchOperatorsRe,  '\\$&');
}

function build(_styles) {
  var builder = function builder() {
    return applyStyle.apply(builder, arguments);
  };
  builder._styles = _styles;
  // __proto__ is used because we must return a function, but there is
  // no way to create a function with a different prototype.
  builder.__proto__ = proto;
  return builder;
}

var styles = (function () {
  var ret = {};
  ansiStyles.grey = ansiStyles.gray;
  Object.keys(ansiStyles).forEach(function (key) {
    ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
    ret[key] = {
      get: function () {
        return build(this._styles.concat(key));
      }
    };
  });
  return ret;
})();

var proto = defineProps(function colors() {}, styles);

function applyStyle() {
  var args = arguments;
  var argsLen = args.length;
  var str = argsLen !== 0 && String(arguments[0]);
  if (argsLen > 1) {
    for (var a = 1; a < argsLen; a++) {
      str += ' ' + args[a];
    }
  }

  if (!colors.enabled || !str) {
    return str;
  }

  var nestedStyles = this._styles;

  var i = nestedStyles.length;
  while (i--) {
    var code = ansiStyles[nestedStyles[i]];
    str = code.open + str.replace(code.closeRe, code.open) + code.close;
  }

  return str;
}

function applyTheme (theme) {
  for (var style in theme) {
    (function(style){
      colors[style] = function(str){
        return colors[theme[style]](str);
      };
    })(style)
  }
}

colors.setTheme = function (theme) {
  if (typeof theme === 'string') {
    try {
      colors.themes[theme] = require(theme);
      applyTheme(colors.themes[theme]);
      return colors.themes[theme];
    } catch (err) {
      console.log(err);
      return err;
    }
  } else {
    applyTheme(theme);
  }
};

function init() {
  var ret = {};
  Object.keys(styles).forEach(function (name) {
    ret[name] = {
      get: function () {
        return build([name]);
      }
    };
  });
  return ret;
}

var sequencer = function sequencer (map, str) {
  var exploded = str.split(""), i = 0;
  exploded = exploded.map(map);
  return exploded.join("");
};

// custom formatter methods
colors.trap = require('./custom/trap');
colors.zalgo = require('./custom/zalgo');

// maps
colors.maps = {};
colors.maps.america = require('./maps/america');
colors.maps.zebra = require('./maps/zebra');
colors.maps.rainbow = require('./maps/rainbow');
colors.maps.random = require('./maps/random')

for (var map in colors.maps) {
  (function(map){
    colors[map] = function (str) {
      return sequencer(colors.maps[map], str);
    }
  })(map)
}

defineProps(colors, init());
},{"./custom/trap":29,"./custom/zalgo":30,"./maps/america":31,"./maps/rainbow":32,"./maps/random":33,"./maps/zebra":34,"./styles":35,"./system/supports-colors":36}],29:[function(require,module,exports){
module['exports'] = function runTheTrap (text, options) {
  var result = "";
  text = text || "Run the trap, drop the bass";
  text = text.split('');
  var trap = {
    a: ["\u0040", "\u0104", "\u023a", "\u0245", "\u0394", "\u039b", "\u0414"],
    b: ["\u00df", "\u0181", "\u0243", "\u026e", "\u03b2", "\u0e3f"],
    c: ["\u00a9", "\u023b", "\u03fe"],
    d: ["\u00d0", "\u018a", "\u0500" , "\u0501" ,"\u0502", "\u0503"],
    e: ["\u00cb", "\u0115", "\u018e", "\u0258", "\u03a3", "\u03be", "\u04bc", "\u0a6c"],
    f: ["\u04fa"],
    g: ["\u0262"],
    h: ["\u0126", "\u0195", "\u04a2", "\u04ba", "\u04c7", "\u050a"],
    i: ["\u0f0f"],
    j: ["\u0134"],
    k: ["\u0138", "\u04a0", "\u04c3", "\u051e"],
    l: ["\u0139"],
    m: ["\u028d", "\u04cd", "\u04ce", "\u0520", "\u0521", "\u0d69"],
    n: ["\u00d1", "\u014b", "\u019d", "\u0376", "\u03a0", "\u048a"],
    o: ["\u00d8", "\u00f5", "\u00f8", "\u01fe", "\u0298", "\u047a", "\u05dd", "\u06dd", "\u0e4f"],
    p: ["\u01f7", "\u048e"],
    q: ["\u09cd"],
    r: ["\u00ae", "\u01a6", "\u0210", "\u024c", "\u0280", "\u042f"],
    s: ["\u00a7", "\u03de", "\u03df", "\u03e8"],
    t: ["\u0141", "\u0166", "\u0373"],
    u: ["\u01b1", "\u054d"],
    v: ["\u05d8"],
    w: ["\u0428", "\u0460", "\u047c", "\u0d70"],
    x: ["\u04b2", "\u04fe", "\u04fc", "\u04fd"],
    y: ["\u00a5", "\u04b0", "\u04cb"],
    z: ["\u01b5", "\u0240"]
  }
  text.forEach(function(c){
    c = c.toLowerCase();
    var chars = trap[c] || [" "];
    var rand = Math.floor(Math.random() * chars.length);
    if (typeof trap[c] !== "undefined") {
      result += trap[c][rand];
    } else {
      result += c;
    }
  });
  return result;

}

},{}],30:[function(require,module,exports){
// please no
module['exports'] = function zalgo(text, options) {
  text = text || "   he is here   ";
  var soul = {
    "up" : [
      '̍', '̎', '̄', '̅',
      '̿', '̑', '̆', '̐',
      '͒', '͗', '͑', '̇',
      '̈', '̊', '͂', '̓',
      '̈', '͊', '͋', '͌',
      '̃', '̂', '̌', '͐',
      '̀', '́', '̋', '̏',
      '̒', '̓', '̔', '̽',
      '̉', 'ͣ', 'ͤ', 'ͥ',
      'ͦ', 'ͧ', 'ͨ', 'ͩ',
      'ͪ', 'ͫ', 'ͬ', 'ͭ',
      'ͮ', 'ͯ', '̾', '͛',
      '͆', '̚'
    ],
    "down" : [
      '̖', '̗', '̘', '̙',
      '̜', '̝', '̞', '̟',
      '̠', '̤', '̥', '̦',
      '̩', '̪', '̫', '̬',
      '̭', '̮', '̯', '̰',
      '̱', '̲', '̳', '̹',
      '̺', '̻', '̼', 'ͅ',
      '͇', '͈', '͉', '͍',
      '͎', '͓', '͔', '͕',
      '͖', '͙', '͚', '̣'
    ],
    "mid" : [
      '̕', '̛', '̀', '́',
      '͘', '̡', '̢', '̧',
      '̨', '̴', '̵', '̶',
      '͜', '͝', '͞',
      '͟', '͠', '͢', '̸',
      '̷', '͡', ' ҉'
    ]
  },
  all = [].concat(soul.up, soul.down, soul.mid),
  zalgo = {};

  function randomNumber(range) {
    var r = Math.floor(Math.random() * range);
    return r;
  }

  function is_char(character) {
    var bool = false;
    all.filter(function (i) {
      bool = (i === character);
    });
    return bool;
  }
  

  function heComes(text, options) {
    var result = '', counts, l;
    options = options || {};
    options["up"] = options["up"] || true;
    options["mid"] = options["mid"] || true;
    options["down"] = options["down"] || true;
    options["size"] = options["size"] || "maxi";
    text = text.split('');
    for (l in text) {
      if (is_char(l)) {
        continue;
      }
      result = result + text[l];
      counts = {"up" : 0, "down" : 0, "mid" : 0};
      switch (options.size) {
      case 'mini':
        counts.up = randomNumber(8);
        counts.min = randomNumber(2);
        counts.down = randomNumber(8);
        break;
      case 'maxi':
        counts.up = randomNumber(16) + 3;
        counts.min = randomNumber(4) + 1;
        counts.down = randomNumber(64) + 3;
        break;
      default:
        counts.up = randomNumber(8) + 1;
        counts.mid = randomNumber(6) / 2;
        counts.down = randomNumber(8) + 1;
        break;
      }

      var arr = ["up", "mid", "down"];
      for (var d in arr) {
        var index = arr[d];
        for (var i = 0 ; i <= counts[index]; i++) {
          if (options[index]) {
            result = result + soul[index][randomNumber(soul[index].length)];
          }
        }
      }
    }
    return result;
  }
  // don't summon him
  return heComes(text);
}

},{}],31:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function() {
  return function (letter, i, exploded) {
    if(letter === " ") return letter;
    switch(i%3) {
      case 0: return colors.red(letter);
      case 1: return colors.white(letter)
      case 2: return colors.blue(letter)
    }
  }
})();
},{"../colors":28}],32:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function () {
  var rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta']; //RoY G BiV
  return function (letter, i, exploded) {
    if (letter === " ") {
      return letter;
    } else {
      return colors[rainbowColors[i++ % rainbowColors.length]](letter);
    }
  };
})();


},{"../colors":28}],33:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function () {
  var available = ['underline', 'inverse', 'grey', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta'];
  return function(letter, i, exploded) {
    return letter === " " ? letter : colors[available[Math.round(Math.random() * (available.length - 1))]](letter);
  };
})();
},{"../colors":28}],34:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = function (letter, i, exploded) {
  return i % 2 === 0 ? letter : colors.inverse(letter);
};
},{"../colors":28}],35:[function(require,module,exports){
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var styles = {};
module['exports'] = styles;

var codes = {
  reset: [0, 0],

  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],

  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],

  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49],

  // legacy styles for colors pre v1.0.0
  blackBG: [40, 49],
  redBG: [41, 49],
  greenBG: [42, 49],
  yellowBG: [43, 49],
  blueBG: [44, 49],
  magentaBG: [45, 49],
  cyanBG: [46, 49],
  whiteBG: [47, 49]

};

Object.keys(codes).forEach(function (key) {
  var val = codes[key];
  var style = styles[key] = [];
  style.open = '\u001b[' + val[0] + 'm';
  style.close = '\u001b[' + val[1] + 'm';
});
},{}],36:[function(require,module,exports){
(function (process){
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var argv = process.argv;

module.exports = (function () {
  if (argv.indexOf('--no-color') !== -1 ||
    argv.indexOf('--color=false') !== -1) {
    return false;
  }

  if (argv.indexOf('--color') !== -1 ||
    argv.indexOf('--color=true') !== -1 ||
    argv.indexOf('--color=always') !== -1) {
    return true;
  }

  if (process.stdout && !process.stdout.isTTY) {
    return false;
  }

  if (process.platform === 'win32') {
    return true;
  }

  if ('COLORTERM' in process.env) {
    return true;
  }

  if (process.env.TERM === 'dumb') {
    return false;
  }

  if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
    return true;
  }

  return false;
})();
}).call(this,require('_process'))
},{"_process":27}],37:[function(require,module,exports){
//
// Remark: Requiring this file will use the "safe" colors API which will not touch String.prototype
//
//   var colors = require('colors/safe);
//   colors.red("foo")
//
//
var colors = require('./lib/colors');
module['exports'] = colors;
},{"./lib/colors":28}],38:[function(require,module,exports){
( // Module boilerplate to support browser globals and browserify and AMD.
  typeof define === "function" ? function (m) { define("msgpack-js", m); } :
  typeof exports === "object" ? function (m) { module.exports = m(); } :
  function(m){ this.msgpack = m(); }
)(function () {
"use strict";

var exports = {};

exports.inspect = inspect;
function inspect(buffer) {
  if (buffer === undefined) return "undefined";
  var view;
  var type;
  if (buffer instanceof ArrayBuffer) {
    type = "ArrayBuffer";
    view = new DataView(buffer);
  }
  else if (buffer instanceof DataView) {
    type = "DataView";
    view = buffer;
  }
  if (!view) return JSON.stringify(buffer);
  var bytes = [];
  for (var i = 0; i < buffer.byteLength; i++) {
    if (i > 20) {
      bytes.push("...");
      break;
    }
    var byte = view.getUint8(i).toString(16);
    if (byte.length === 1) byte = "0" + byte;
    bytes.push(byte);
  }
  return "<" + type + " " + bytes.join(" ") + ">";
}

// Encode string as utf8 into dataview at offset
exports.utf8Write = utf8Write;
function utf8Write(view, offset, string) {
  var byteLength = view.byteLength;
  for(var i = 0, l = string.length; i < l; i++) {
    var codePoint = string.charCodeAt(i);

    // One byte of UTF-8
    if (codePoint < 0x80) {
      view.setUint8(offset++, codePoint >>> 0 & 0x7f | 0x00);
      continue;
    }

    // Two bytes of UTF-8
    if (codePoint < 0x800) {
      view.setUint8(offset++, codePoint >>> 6 & 0x1f | 0xc0);
      view.setUint8(offset++, codePoint >>> 0 & 0x3f | 0x80);
      continue;
    }

    // Three bytes of UTF-8.  
    if (codePoint < 0x10000) {
      view.setUint8(offset++, codePoint >>> 12 & 0x0f | 0xe0);
      view.setUint8(offset++, codePoint >>> 6  & 0x3f | 0x80);
      view.setUint8(offset++, codePoint >>> 0  & 0x3f | 0x80);
      continue;
    }

    // Four bytes of UTF-8
    if (codePoint < 0x110000) {
      view.setUint8(offset++, codePoint >>> 18 & 0x07 | 0xf0);
      view.setUint8(offset++, codePoint >>> 12 & 0x3f | 0x80);
      view.setUint8(offset++, codePoint >>> 6  & 0x3f | 0x80);
      view.setUint8(offset++, codePoint >>> 0  & 0x3f | 0x80);
      continue;
    }
    throw new Error("bad codepoint " + codePoint);
  }
}

exports.utf8Read = utf8Read;
function utf8Read(view, offset, length) {
  var string = "";
  for (var i = offset, end = offset + length; i < end; i++) {
    var byte = view.getUint8(i);
    // One byte character
    if ((byte & 0x80) === 0x00) {
      string += String.fromCharCode(byte);
      continue;
    }
    // Two byte character
    if ((byte & 0xe0) === 0xc0) {
      string += String.fromCharCode(
        ((byte & 0x0f) << 6) | 
        (view.getUint8(++i) & 0x3f)
      );
      continue;
    }
    // Three byte character
    if ((byte & 0xf0) === 0xe0) {
      string += String.fromCharCode(
        ((byte & 0x0f) << 12) |
        ((view.getUint8(++i) & 0x3f) << 6) |
        ((view.getUint8(++i) & 0x3f) << 0)
      );
      continue;
    }
    // Four byte character
    if ((byte & 0xf8) === 0xf0) {
      string += String.fromCharCode(
        ((byte & 0x07) << 18) |
        ((view.getUint8(++i) & 0x3f) << 12) |
        ((view.getUint8(++i) & 0x3f) << 6) |
        ((view.getUint8(++i) & 0x3f) << 0)
      );
      continue;
    }
    throw new Error("Invalid byte " + byte.toString(16));
  }
  return string;
}

exports.utf8ByteCount = utf8ByteCount;
function utf8ByteCount(string) {
  var count = 0;
  for(var i = 0, l = string.length; i < l; i++) {
    var codePoint = string.charCodeAt(i);
    if (codePoint < 0x80) {
      count += 1;
      continue;
    }
    if (codePoint < 0x800) {
      count += 2;
      continue;
    }
    if (codePoint < 0x10000) {
      count += 3;
      continue;
    }
    if (codePoint < 0x110000) {
      count += 4;
      continue;
    }
    throw new Error("bad codepoint " + codePoint);
  }
  return count;
}

exports.encode = function (value) {
  var buffer = new ArrayBuffer(sizeof(value));
  var view = new DataView(buffer);
  encode(value, view, 0);
  return buffer;
}

exports.decode = decode;

// http://wiki.msgpack.org/display/MSGPACK/Format+specification
// I've extended the protocol to have two new types that were previously reserved.
//   buffer 16  11011000  0xd8
//   buffer 32  11011001  0xd9
// These work just like raw16 and raw32 except they are node buffers instead of strings.
//
// Also I've added a type for `undefined`
//   undefined  11000100  0xc4

function Decoder(view, offset) {
  this.offset = offset || 0;
  this.view = view;
}
Decoder.prototype.map = function (length) {
  var value = {};
  for (var i = 0; i < length; i++) {
    var key = this.parse();
    value[key] = this.parse();
  }
  return value;
};
Decoder.prototype.buf = function (length) {
  var value = new ArrayBuffer(length);
  (new Uint8Array(value)).set(new Uint8Array(this.view.buffer, this.offset, length), 0);
  this.offset += length;
  return value;
};
Decoder.prototype.raw = function (length) {
  var value = utf8Read(this.view, this.offset, length);
  this.offset += length;
  return value;
};
Decoder.prototype.array = function (length) {
  var value = new Array(length);
  for (var i = 0; i < length; i++) {
    value[i] = this.parse();
  }
  return value;
};
Decoder.prototype.parse = function () {
  var type = this.view.getUint8(this.offset);
  var value, length;
  // FixRaw
  if ((type & 0xe0) === 0xa0) {
    length = type & 0x1f;
    this.offset++;
    return this.raw(length);
  }
  // FixMap
  if ((type & 0xf0) === 0x80) {
    length = type & 0x0f;
    this.offset++;
    return this.map(length);
  }
  // FixArray
  if ((type & 0xf0) === 0x90) {
    length = type & 0x0f;
    this.offset++;
    return this.array(length);
  }
  // Positive FixNum
  if ((type & 0x80) === 0x00) {
    this.offset++;
    return type;
  }
  // Negative Fixnum
  if ((type & 0xe0) === 0xe0) {
    value = this.view.getInt8(this.offset);
    this.offset++;
    return value;
  }
  switch (type) {
  // raw 16
  case 0xda:
    length = this.view.getUint16(this.offset + 1);
    this.offset += 3;
    return this.raw(length);
  // raw 32
  case 0xdb:
    length = this.view.getUint32(this.offset + 1);
    this.offset += 5;
    return this.raw(length);
  // nil
  case 0xc0:
    this.offset++;
    return null;
  // false
  case 0xc2:
    this.offset++;
    return false;
  // true
  case 0xc3:
    this.offset++;
    return true;
  // undefined
  case 0xc4:
    this.offset++;
    return undefined;
  // uint8
  case 0xcc:
    value = this.view.getUint8(this.offset + 1);
    this.offset += 2;
    return value;
  // uint 16
  case 0xcd:
    value = this.view.getUint16(this.offset + 1);
    this.offset += 3;
    return value;
  // uint 32
  case 0xce:
    value = this.view.getUint32(this.offset + 1);
    this.offset += 5;
    return value;
  // int 8
  case 0xd0:
    value = this.view.getInt8(this.offset + 1);
    this.offset += 2;
    return value;
  // int 16
  case 0xd1:
    value = this.view.getInt16(this.offset + 1);
    this.offset += 3;
    return value;
  // int 32
  case 0xd2:
    value = this.view.getInt32(this.offset + 1);
    this.offset += 5;
    return value;
  // map 16
  case 0xde:
    length = this.view.getUint16(this.offset + 1);
    this.offset += 3;
    return this.map(length);
  // map 32
  case 0xdf:
    length = this.view.getUint32(this.offset + 1);
    this.offset += 5;
    return this.map(length);
  // array 16
  case 0xdc:
    length = this.view.getUint16(this.offset + 1);
    this.offset += 3;
    return this.array(length);
  // array 32
  case 0xdd:
    length = this.view.getUint32(this.offset + 1);
    this.offset += 5;
    return this.array(length);
  // buffer 16
  case 0xd8:
    length = this.view.getUint16(this.offset + 1);
    this.offset += 3;
    return this.buf(length);
  // buffer 32
  case 0xd9:
    length = this.view.getUint32(this.offset + 1);
    this.offset += 5;
    return this.buf(length);
  // float
  case 0xca:
    value = this.view.getFloat32(this.offset + 1);
    this.offset += 5;
    return value;
  // double
  case 0xcb:
    value = this.view.getFloat64(this.offset + 1);
    this.offset += 9;
    return value;
  }
  throw new Error("Unknown type 0x" + type.toString(16));
};
function decode(buffer) {
  var view = new DataView(buffer);
  var decoder = new Decoder(view);
  var value = decoder.parse();
  if (decoder.offset !== buffer.byteLength) throw new Error((buffer.byteLength - decoder.offset) + " trailing bytes");
  return value;
}

function encode(value, view, offset) {
  var type = typeof value;

  // Strings Bytes
  if (type === "string") {
    var length = utf8ByteCount(value);
    // fix raw
    if (length < 0x20) {
      view.setUint8(offset, length | 0xa0);
      utf8Write(view, offset + 1, value);
      return 1 + length;
    }
    // raw 16
    if (length < 0x10000) {
      view.setUint8(offset, 0xda);
      view.setUint16(offset + 1, length);
      utf8Write(view, offset + 3, value);
      return 3 + length;
    }
    // raw 32
    if (length < 0x100000000) {
      view.setUint8(offset, 0xdb);
      view.setUint32(offset + 1, length);
      utf8Write(view, offset + 5, value);
      return 5 + length;
    }
  }

  if (value instanceof ArrayBuffer) {
    var length = value.byteLength;
    // buffer 16
    if (length < 0x10000) {
      view.setUint8(offset, 0xd8);
      view.setUint16(offset + 1, length);
      (new Uint8Array(view.buffer)).set(new Uint8Array(value), offset + 3);
      return 3 + length;
    }
    // buffer 32
    if (length < 0x100000000) {
      view.setUint8(offset, 0xd9);
      view.setUint32(offset + 1, length);
      (new Uint8Array(view.buffer)).set(new Uint8Array(value), offset + 5);
      return 5 + length;
    }
  }
  
  if (type === "number") {
    // Floating Point
    if ((value << 0) !== value) {
      view.setUint8(offset, 0xcb);
      view.setFloat64(offset + 1, value);
      return 9;
    }

    // Integers
    if (value >=0) {
      // positive fixnum
      if (value < 0x80) {
        view.setUint8(offset, value);
        return 1;
      }
      // uint 8
      if (value < 0x100) {
        view.setUint8(offset, 0xcc);
        view.setUint8(offset + 1, value);
        return 2;
      }
      // uint 16
      if (value < 0x10000) {
        view.setUint8(offset, 0xcd);
        view.setUint16(offset + 1, value);
        return 3;
      }
      // uint 32
      if (value < 0x100000000) {
        view.setUint8(offset, 0xce);
        view.setUint32(offset + 1, value);
        return 5;
      }
      throw new Error("Number too big 0x" + value.toString(16));
    }
    // negative fixnum
    if (value >= -0x20) {
      view.setInt8(offset, value);
      return 1;
    }
    // int 8
    if (value >= -0x80) {
      view.setUint8(offset, 0xd0);
      view.setInt8(offset + 1, value);
      return 2;
    }
    // int 16
    if (value >= -0x8000) {
      view.setUint8(offset, 0xd1);
      view.setInt16(offset + 1, value);
      return 3;
    }
    // int 32
    if (value >= -0x80000000) {
      view.setUint8(offset, 0xd2);
      view.setInt32(offset + 1, value);
      return 5;
    }
    throw new Error("Number too small -0x" + (-value).toString(16).substr(1));
  }
  
  // undefined
  if (type === "undefined") {
    view.setUint8(offset, 0xc4);
    return 1;
  }
  
  // null
  if (value === null) {
    view.setUint8(offset, 0xc0);
    return 1;
  }

  // Boolean
  if (type === "boolean") {
    view.setUint8(offset, value ? 0xc3 : 0xc2);
    return 1;
  }
  
  // Container Types
  if (type === "object") {
    var length, size = 0;
    var isArray = Array.isArray(value);

    if (isArray) {
      length = value.length;
    }
    else {
      var keys = Object.keys(value);
      length = keys.length;
    }

    var size;
    if (length < 0x10) {
      view.setUint8(offset, length | (isArray ? 0x90 : 0x80));
      size = 1;
    }
    else if (length < 0x10000) {
      view.setUint8(offset, isArray ? 0xdc : 0xde);
      view.setUint16(offset + 1, length);
      size = 3;
    }
    else if (length < 0x100000000) {
      view.setUint8(offset, isArray ? 0xdd : 0xdf);
      view.setUint32(offset + 1, length);
      size = 5;
    }

    if (isArray) {
      for (var i = 0; i < length; i++) {
        size += encode(value[i], view, offset + size);
      }
    }
    else {
      for (var i = 0; i < length; i++) {
        var key = keys[i];
        size += encode(key, view, offset + size);
        size += encode(value[key], view, offset + size);
      }
    }
    
    return size;
  }
  throw new Error("Unknown type " + type);
}

function sizeof(value) {
  var type = typeof value;

  // Raw Bytes
  if (type === "string") {
    var length = utf8ByteCount(value);
    if (length < 0x20) {
      return 1 + length;
    }
    if (length < 0x10000) {
      return 3 + length;
    }
    if (length < 0x100000000) {
      return 5 + length;
    }
  }
  
  if (value instanceof ArrayBuffer) {
    var length = value.byteLength;
    if (length < 0x10000) {
      return 3 + length;
    }
    if (length < 0x100000000) {
      return 5 + length;
    }
  }
  
  if (type === "number") {
    // Floating Point
    // double
    if (value << 0 !== value) return 9;

    // Integers
    if (value >=0) {
      // positive fixnum
      if (value < 0x80) return 1;
      // uint 8
      if (value < 0x100) return 2;
      // uint 16
      if (value < 0x10000) return 3;
      // uint 32
      if (value < 0x100000000) return 5;
      // uint 64
      if (value < 0x10000000000000000) return 9;
      throw new Error("Number too big 0x" + value.toString(16));
    }
    // negative fixnum
    if (value >= -0x20) return 1;
    // int 8
    if (value >= -0x80) return 2;
    // int 16
    if (value >= -0x8000) return 3;
    // int 32
    if (value >= -0x80000000) return 5;
    // int 64
    if (value >= -0x8000000000000000) return 9;
    throw new Error("Number too small -0x" + value.toString(16).substr(1));
  }
  
  // Boolean, null, undefined
  if (type === "boolean" || type === "undefined" || value === null) return 1;
  
  // Container Types
  if (type === "object") {
    var length, size = 0;
    if (Array.isArray(value)) {
      length = value.length;
      for (var i = 0; i < length; i++) {
        size += sizeof(value[i]);
      }
    }
    else {
      var keys = Object.keys(value);
      length = keys.length;
      for (var i = 0; i < length; i++) {
        var key = keys[i];
        size += sizeof(key) + sizeof(value[key]);
      }
    }
    if (length < 0x10) {
      return 1 + size;
    }
    if (length < 0x10000) {
      return 3 + size;
    }
    if (length < 0x100000000) {
      return 5 + size;
    }
    throw new Error("Array or object too long 0x" + length.toString(16));
  }
  throw new Error("Unknown type " + type);
}

return exports;

});

},{}],39:[function(require,module,exports){
"use strict";

var bops = require('bops');

exports.encode = function (value) {
  var toJSONed = []
  var size = sizeof(value)
  if(size == 0)
    return undefined
  var buffer = bops.create(size);
  encode(value, buffer, 0);
  return buffer;
};

exports.decode = decode;

// http://wiki.msgpack.org/display/MSGPACK/Format+specification
// I've extended the protocol to have two new types that were previously reserved.
//   buffer 16  11011000  0xd8
//   buffer 32  11011001  0xd9
// These work just like raw16 and raw32 except they are node buffers instead of strings.
//
// Also I've added a type for `undefined`
//   undefined  11000100  0xc4

function Decoder(buffer, offset) {
  this.offset = offset || 0;
  this.buffer = buffer;
}
Decoder.prototype.map = function (length) {
  var value = {};
  for (var i = 0; i < length; i++) {
    var key = this.parse();
    value[key] = this.parse();
  }
  return value;
};
Decoder.prototype.buf = function (length) {
  var value = bops.subarray(this.buffer, this.offset, this.offset + length);
  this.offset += length;
  return value;
};
Decoder.prototype.raw = function (length) {
  var value = bops.to(bops.subarray(this.buffer, this.offset, this.offset + length));
  this.offset += length;
  return value;
};
Decoder.prototype.array = function (length) {
  var value = new Array(length);
  for (var i = 0; i < length; i++) {
    value[i] = this.parse();
  }
  return value;
};
Decoder.prototype.parse = function () {
  var type = this.buffer[this.offset];
  var value, length;
  // FixRaw
  if ((type & 0xe0) === 0xa0) {
    length = type & 0x1f;
    this.offset++;
    return this.raw(length);
  }
  // FixMap
  if ((type & 0xf0) === 0x80) {
    length = type & 0x0f;
    this.offset++;
    return this.map(length);
  }
  // FixArray
  if ((type & 0xf0) === 0x90) {
    length = type & 0x0f;
    this.offset++;
    return this.array(length);
  }
  // Positive FixNum
  if ((type & 0x80) === 0x00) {
    this.offset++;
    return type;
  }
  // Negative Fixnum
  if ((type & 0xe0) === 0xe0) {
    value = bops.readInt8(this.buffer, this.offset);
    this.offset++;
    return value;
  }
  switch (type) {
  // raw 16
  case 0xda:
    length = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return this.raw(length);
  // raw 32
  case 0xdb:
    length = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return this.raw(length);
  // nil
  case 0xc0:
    this.offset++;
    return null;
  // false
  case 0xc2:
    this.offset++;
    return false;
  // true
  case 0xc3:
    this.offset++;
    return true;
  // undefined
  case 0xc4:
    this.offset++;
    return undefined;
  // uint8
  case 0xcc:
    value = this.buffer[this.offset + 1];
    this.offset += 2;
    return value;
  // uint 16
  case 0xcd:
    value = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return value;
  // uint 32
  case 0xce:
    value = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return value;
  // uint64
  case 0xcf:
    value = bops.readUInt64BE(this.buffer, this.offset + 1);
    this.offset += 9;
    return value;
  // int 8
  case 0xd0:
    value = bops.readInt8(this.buffer, this.offset + 1);
    this.offset += 2;
    return value;
  // int 16
  case 0xd1:
    value = bops.readInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return value;
  // int 32
  case 0xd2:
    value = bops.readInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return value;
  // int 64
  case 0xd3:
    value = bops.readInt64BE(this.buffer, this.offset + 1);
    this.offset += 9;
    return value;
  // map 16
  case 0xde:
    length = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return this.map(length);
  // map 32
  case 0xdf:
    length = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return this.map(length);
  // array 16
  case 0xdc:
    length = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return this.array(length);
  // array 32
  case 0xdd:
    length = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return this.array(length);
  // buffer 16
  case 0xd8:
    length = bops.readUInt16BE(this.buffer, this.offset + 1);
    this.offset += 3;
    return this.buf(length);
  // buffer 32
  case 0xd9:
    length = bops.readUInt32BE(this.buffer, this.offset + 1);
    this.offset += 5;
    return this.buf(length);
  // float
  case 0xca:
    value = bops.readFloatBE(this.buffer, this.offset + 1);
    this.offset += 5;
    return value;
  // double
  case 0xcb:
    value = bops.readDoubleBE(this.buffer, this.offset + 1);
    this.offset += 9;
    return value;
  }
  throw new Error("Unknown type 0x" + type.toString(16));
};
function decode(buffer) {
  var decoder = new Decoder(buffer);
  var value = decoder.parse();
  if (decoder.offset !== buffer.length) throw new Error((buffer.length - decoder.offset) + " trailing bytes");
  return value;
}

function encodeableKeys (value) {
  return Object.keys(value).filter(function (e) {
    return 'function' !== typeof value[e] || !!value[e].toJSON
  })
}

function encode(value, buffer, offset) {
  var type = typeof value;
  var length, size;

  // Strings Bytes
  if (type === "string") {
    value = bops.from(value);
    length = value.length;
    // fix raw
    if (length < 0x20) {
      buffer[offset] = length | 0xa0;
      bops.copy(value, buffer, offset + 1);
      return 1 + length;
    }
    // raw 16
    if (length < 0x10000) {
      buffer[offset] = 0xda;
      bops.writeUInt16BE(buffer, length, offset + 1);
      bops.copy(value, buffer, offset + 3);
      return 3 + length;
    }
    // raw 32
    if (length < 0x100000000) {
      buffer[offset] = 0xdb;
      bops.writeUInt32BE(buffer, length, offset + 1);
      bops.copy(value, buffer, offset + 5);
      return 5 + length;
    }
  }

  if (bops.is(value)) {
    length = value.length;
    // buffer 16
    if (length < 0x10000) {
      buffer[offset] = 0xd8;
      bops.writeUInt16BE(buffer, length, offset + 1);
      bops.copy(value, buffer, offset + 3);
      return 3 + length;
    }
    // buffer 32
    if (length < 0x100000000) {
      buffer[offset] = 0xd9;
      bops.writeUInt32BE(buffer, length, offset + 1);
      bops.copy(value, buffer, offset + 5);
      return 5 + length;
    }
  }

  if (type === "number") {
    // Floating Point
    if ((value << 0) !== value) {
      buffer[offset] =  0xcb;
      bops.writeDoubleBE(buffer, value, offset + 1);
      return 9;
    }

    // Integers
    if (value >=0) {
      // positive fixnum
      if (value < 0x80) {
        buffer[offset] = value;
        return 1;
      }
      // uint 8
      if (value < 0x100) {
        buffer[offset] = 0xcc;
        buffer[offset + 1] = value;
        return 2;
      }
      // uint 16
      if (value < 0x10000) {
        buffer[offset] = 0xcd;
        bops.writeUInt16BE(buffer, value, offset + 1);
        return 3;
      }
      // uint 32
      if (value < 0x100000000) {
        buffer[offset] = 0xce;
        bops.writeUInt32BE(buffer, value, offset + 1);
        return 5;
      }
      // uint 64
      if (value < 0x10000000000000000) {
        buffer[offset] = 0xcf;
        bops.writeUInt64BE(buffer, value, offset + 1);
        return 9;
      }
      throw new Error("Number too big 0x" + value.toString(16));
    }
    // negative fixnum
    if (value >= -0x20) {
      bops.writeInt8(buffer, value, offset);
      return 1;
    }
    // int 8
    if (value >= -0x80) {
      buffer[offset] = 0xd0;
      bops.writeInt8(buffer, value, offset + 1);
      return 2;
    }
    // int 16
    if (value >= -0x8000) {
      buffer[offset] = 0xd1;
      bops.writeInt16BE(buffer, value, offset + 1);
      return 3;
    }
    // int 32
    if (value >= -0x80000000) {
      buffer[offset] = 0xd2;
      bops.writeInt32BE(buffer, value, offset + 1);
      return 5;
    }
    // int 64
    if (value >= -0x8000000000000000) {
      buffer[offset] = 0xd3;
      bops.writeInt64BE(buffer, value, offset + 1);
      return 9;
    }
    throw new Error("Number too small -0x" + value.toString(16).substr(1));
  }

  // undefined
  if (type === "undefined") {
    buffer[offset] = 0xc4;
    return 1;
  }

  // null
  if (value === null) {
    buffer[offset] = 0xc0;
    return 1;
  }

  // Boolean
  if (type === "boolean") {
    buffer[offset] = value ? 0xc3 : 0xc2;
    return 1;
  }

  if('function' === typeof value.toJSON)
    return encode(value.toJSON(), buffer, offset)

  // Container Types
  if (type === "object") {

    size = 0;
    var isArray = Array.isArray(value);

    if (isArray) {
      length = value.length;
    }
    else {
      var keys = encodeableKeys(value)
      length = keys.length;
    }

    if (length < 0x10) {
      buffer[offset] = length | (isArray ? 0x90 : 0x80);
      size = 1;
    }
    else if (length < 0x10000) {
      buffer[offset] = isArray ? 0xdc : 0xde;
      bops.writeUInt16BE(buffer, length, offset + 1);
      size = 3;
    }
    else if (length < 0x100000000) {
      buffer[offset] = isArray ? 0xdd : 0xdf;
      bops.writeUInt32BE(buffer, length, offset + 1);
      size = 5;
    }

    if (isArray) {
      for (var i = 0; i < length; i++) {
        size += encode(value[i], buffer, offset + size);
      }
    }
    else {
      for (var i = 0; i < length; i++) {
        var key = keys[i];
        size += encode(key, buffer, offset + size);
        size += encode(value[key], buffer, offset + size);
      }
    }

    return size;
  }
  if(type === "function")
    return undefined
  throw new Error("Unknown type " + type);
}

function sizeof(value) {
  var type = typeof value;
  var length, size;

  // Raw Bytes
  if (type === "string") {
    // TODO: this creates a throw-away buffer which is probably expensive on browsers.
    length = bops.from(value).length;
    if (length < 0x20) {
      return 1 + length;
    }
    if (length < 0x10000) {
      return 3 + length;
    }
    if (length < 0x100000000) {
      return 5 + length;
    }
  }

  if (bops.is(value)) {
    length = value.length;
    if (length < 0x10000) {
      return 3 + length;
    }
    if (length < 0x100000000) {
      return 5 + length;
    }
  }

  if (type === "number") {
    // Floating Point
    // double
    if (value << 0 !== value) return 9;

    // Integers
    if (value >=0) {
      // positive fixnum
      if (value < 0x80) return 1;
      // uint 8
      if (value < 0x100) return 2;
      // uint 16
      if (value < 0x10000) return 3;
      // uint 32
      if (value < 0x100000000) return 5;
      // uint 64
      if (value < 0x10000000000000000) return 9;
      throw new Error("Number too big 0x" + value.toString(16));
    }
    // negative fixnum
    if (value >= -0x20) return 1;
    // int 8
    if (value >= -0x80) return 2;
    // int 16
    if (value >= -0x8000) return 3;
    // int 32
    if (value >= -0x80000000) return 5;
    // int 64
    if (value >= -0x8000000000000000) return 9;
    throw new Error("Number too small -0x" + value.toString(16).substr(1));
  }

  // Boolean, null, undefined
  if (type === "boolean" || type === "undefined" || value === null) return 1;

  if('function' === typeof value.toJSON)
    return sizeof(value.toJSON())

  // Container Types
  if (type === "object") {
    if('function' === typeof value.toJSON)
      value = value.toJSON()

    size = 0;
    if (Array.isArray(value)) {
      length = value.length;
      for (var i = 0; i < length; i++) {
        size += sizeof(value[i]);
      }
    }
    else {
      var keys = encodeableKeys(value)
      length = keys.length;
      for (var i = 0; i < length; i++) {
        var key = keys[i];
        size += sizeof(key) + sizeof(value[key]);
      }
    }
    if (length < 0x10) {
      return 1 + size;
    }
    if (length < 0x10000) {
      return 3 + size;
    }
    if (length < 0x100000000) {
      return 5 + size;
    }
    throw new Error("Array or object too long 0x" + length.toString(16));
  }
  if(type === "function")
    return 0
  throw new Error("Unknown type " + type);
}



},{"bops":40}],40:[function(require,module,exports){
var proto = {}
module.exports = proto

proto.from = require('./from.js')
proto.to = require('./to.js')
proto.is = require('./is.js')
proto.subarray = require('./subarray.js')
proto.join = require('./join.js')
proto.copy = require('./copy.js')
proto.create = require('./create.js')

mix(require('./read.js'), proto)
mix(require('./write.js'), proto)

function mix(from, into) {
  for(var key in from) {
    into[key] = from[key]
  }
}

},{"./copy.js":43,"./create.js":44,"./from.js":45,"./is.js":46,"./join.js":47,"./read.js":49,"./subarray.js":50,"./to.js":51,"./write.js":52}],41:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}],42:[function(require,module,exports){
module.exports = to_utf8

var out = []
  , col = []
  , fcc = String.fromCharCode
  , mask = [0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01]
  , unmask = [
      0x00
    , 0x01
    , 0x02 | 0x01
    , 0x04 | 0x02 | 0x01
    , 0x08 | 0x04 | 0x02 | 0x01
    , 0x10 | 0x08 | 0x04 | 0x02 | 0x01
    , 0x20 | 0x10 | 0x08 | 0x04 | 0x02 | 0x01
    , 0x40 | 0x20 | 0x10 | 0x08 | 0x04 | 0x02 | 0x01
  ]

function to_utf8(bytes, start, end) {
  start = start === undefined ? 0 : start
  end = end === undefined ? bytes.length : end

  var idx = 0
    , hi = 0x80
    , collecting = 0
    , pos
    , by

  col.length =
  out.length = 0

  while(idx < bytes.length) {
    by = bytes[idx]
    if(!collecting && by & hi) {
      pos = find_pad_position(by)
      collecting += pos
      if(pos < 8) {
        col[col.length] = by & unmask[6 - pos]
      }
    } else if(collecting) {
      col[col.length] = by & unmask[6]
      --collecting
      if(!collecting && col.length) {
        out[out.length] = fcc(reduced(col, pos))
        col.length = 0
      }
    } else { 
      out[out.length] = fcc(by)
    }
    ++idx
  }
  if(col.length && !collecting) {
    out[out.length] = fcc(reduced(col, pos))
    col.length = 0
  }
  return out.join('')
}

function find_pad_position(byt) {
  for(var i = 0; i < 7; ++i) {
    if(!(byt & mask[i])) {
      break
    }
  }
  return i
}

function reduced(list) {
  var out = 0
  for(var i = 0, len = list.length; i < len; ++i) {
    out |= list[i] << ((len - i - 1) * 6)
  }
  return out
}

},{}],43:[function(require,module,exports){
module.exports = copy

var slice = [].slice

function copy(source, target, target_start, source_start, source_end) {
  target_start = arguments.length < 3 ? 0 : target_start
  source_start = arguments.length < 4 ? 0 : source_start
  source_end = arguments.length < 5 ? source.length : source_end

  if(source_end === source_start) {
    return
  }

  if(target.length === 0 || source.length === 0) {
    return
  }

  if(source_end > source.length) {
    source_end = source.length
  }

  if(target.length - target_start < source_end - source_start) {
    source_end = target.length - target_start + source_start
  }

  if(source.buffer !== target.buffer) {
    return fast_copy(source, target, target_start, source_start, source_end)
  }
  return slow_copy(source, target, target_start, source_start, source_end)
}

function fast_copy(source, target, target_start, source_start, source_end) {
  var len = (source_end - source_start) + target_start

  for(var i = target_start, j = source_start;
      i < len;
      ++i,
      ++j) {
    target[i] = source[j]
  }
}

function slow_copy(from, to, j, i, jend) {
  // the buffers could overlap.
  var iend = jend + i
    , tmp = new Uint8Array(slice.call(from, i, iend))
    , x = 0

  for(; i < iend; ++i, ++x) {
    to[j++] = tmp[x]
  }
}

},{}],44:[function(require,module,exports){
module.exports = function(size) {
  return new Uint8Array(size)
}

},{}],45:[function(require,module,exports){
module.exports = from

var base64 = require('base64-js')

var decoders = {
    hex: from_hex
  , utf8: from_utf
  , base64: from_base64
}

function from(source, encoding) {
  if(Array.isArray(source)) {
    return new Uint8Array(source)
  }

  return decoders[encoding || 'utf8'](source)
}

function from_hex(str) {
  var size = str.length / 2
    , buf = new Uint8Array(size)
    , character = ''

  for(var i = 0, len = str.length; i < len; ++i) {
    character += str.charAt(i)

    if(i > 0 && (i % 2) === 1) {
      buf[i>>>1] = parseInt(character, 16)
      character = '' 
    }
  }

  return buf 
}

function from_utf(str) {
  var bytes = []
    , tmp
    , ch

  for(var i = 0, len = str.length; i < len; ++i) {
    ch = str.charCodeAt(i)
    if(ch & 0x80) {
      tmp = encodeURIComponent(str.charAt(i)).substr(1).split('%')
      for(var j = 0, jlen = tmp.length; j < jlen; ++j) {
        bytes[bytes.length] = parseInt(tmp[j], 16)
      }
    } else {
      bytes[bytes.length] = ch 
    }
  }

  return new Uint8Array(bytes)
}

function from_base64(str) {
  return new Uint8Array(base64.toByteArray(str)) 
}

},{"base64-js":41}],46:[function(require,module,exports){

module.exports = function(buffer) {
  return buffer instanceof Uint8Array;
}

},{}],47:[function(require,module,exports){
module.exports = join

function join(targets, hint) {
  if(!targets.length) {
    return new Uint8Array(0)
  }

  var len = hint !== undefined ? hint : get_length(targets)
    , out = new Uint8Array(len)
    , cur = targets[0]
    , curlen = cur.length
    , curidx = 0
    , curoff = 0
    , i = 0

  while(i < len) {
    if(curoff === curlen) {
      curoff = 0
      ++curidx
      cur = targets[curidx]
      curlen = cur && cur.length
      continue
    }
    out[i++] = cur[curoff++] 
  }

  return out
}

function get_length(targets) {
  var size = 0
  for(var i = 0, len = targets.length; i < len; ++i) {
    size += targets[i].byteLength
  }
  return size
}

},{}],48:[function(require,module,exports){
var proto
  , map

module.exports = proto = {}

map = typeof WeakMap === 'undefined' ? null : new WeakMap

proto.get = !map ? no_weakmap_get : get

function no_weakmap_get(target) {
  return new DataView(target.buffer, 0)
}

function get(target) {
  var out = map.get(target.buffer)
  if(!out) {
    map.set(target.buffer, out = new DataView(target.buffer, 0))
  }
  return out
}

},{}],49:[function(require,module,exports){
module.exports = {
    readUInt8:      read_uint8
  , readInt8:       read_int8
  , readUInt16LE:   read_uint16_le
  , readUInt32LE:   read_uint32_le
  , readInt16LE:    read_int16_le
  , readInt32LE:    read_int32_le
  , readFloatLE:    read_float_le
  , readDoubleLE:   read_double_le
  , readUInt16BE:   read_uint16_be
  , readUInt32BE:   read_uint32_be
  , readInt16BE:    read_int16_be
  , readInt32BE:    read_int32_be
  , readFloatBE:    read_float_be
  , readDoubleBE:   read_double_be
}

var map = require('./mapped.js')

function read_uint8(target, at) {
  return target[at]
}

function read_int8(target, at) {
  var v = target[at];
  return v < 0x80 ? v : v - 0x100
}

function read_uint16_le(target, at) {
  var dv = map.get(target);
  return dv.getUint16(at + target.byteOffset, true)
}

function read_uint32_le(target, at) {
  var dv = map.get(target);
  return dv.getUint32(at + target.byteOffset, true)
}

function read_int16_le(target, at) {
  var dv = map.get(target);
  return dv.getInt16(at + target.byteOffset, true)
}

function read_int32_le(target, at) {
  var dv = map.get(target);
  return dv.getInt32(at + target.byteOffset, true)
}

function read_float_le(target, at) {
  var dv = map.get(target);
  return dv.getFloat32(at + target.byteOffset, true)
}

function read_double_le(target, at) {
  var dv = map.get(target);
  return dv.getFloat64(at + target.byteOffset, true)
}

function read_uint16_be(target, at) {
  var dv = map.get(target);
  return dv.getUint16(at + target.byteOffset, false)
}

function read_uint32_be(target, at) {
  var dv = map.get(target);
  return dv.getUint32(at + target.byteOffset, false)
}

function read_int16_be(target, at) {
  var dv = map.get(target);
  return dv.getInt16(at + target.byteOffset, false)
}

function read_int32_be(target, at) {
  var dv = map.get(target);
  return dv.getInt32(at + target.byteOffset, false)
}

function read_float_be(target, at) {
  var dv = map.get(target);
  return dv.getFloat32(at + target.byteOffset, false)
}

function read_double_be(target, at) {
  var dv = map.get(target);
  return dv.getFloat64(at + target.byteOffset, false)
}

},{"./mapped.js":48}],50:[function(require,module,exports){
module.exports = subarray

function subarray(buf, from, to) {
  return buf.subarray(from || 0, to || buf.length)
}

},{}],51:[function(require,module,exports){
module.exports = to

var base64 = require('base64-js')
  , toutf8 = require('to-utf8')

var encoders = {
    hex: to_hex
  , utf8: to_utf
  , base64: to_base64
}

function to(buf, encoding) {
  return encoders[encoding || 'utf8'](buf)
}

function to_hex(buf) {
  var str = ''
    , byt

  for(var i = 0, len = buf.length; i < len; ++i) {
    byt = buf[i]
    str += ((byt & 0xF0) >>> 4).toString(16)
    str += (byt & 0x0F).toString(16)
  }

  return str
}

function to_utf(buf) {
  return toutf8(buf)
}

function to_base64(buf) {
  return base64.fromByteArray(buf)
}


},{"base64-js":41,"to-utf8":42}],52:[function(require,module,exports){
module.exports = {
    writeUInt8:      write_uint8
  , writeInt8:       write_int8
  , writeUInt16LE:   write_uint16_le
  , writeUInt32LE:   write_uint32_le
  , writeInt16LE:    write_int16_le
  , writeInt32LE:    write_int32_le
  , writeFloatLE:    write_float_le
  , writeDoubleLE:   write_double_le
  , writeUInt16BE:   write_uint16_be
  , writeUInt32BE:   write_uint32_be
  , writeInt16BE:    write_int16_be
  , writeInt32BE:    write_int32_be
  , writeFloatBE:    write_float_be
  , writeDoubleBE:   write_double_be
}

var map = require('./mapped.js')

function write_uint8(target, value, at) {
  return target[at] = value
}

function write_int8(target, value, at) {
  return target[at] = value < 0 ? value + 0x100 : value
}

function write_uint16_le(target, value, at) {
  var dv = map.get(target);
  return dv.setUint16(at + target.byteOffset, value, true)
}

function write_uint32_le(target, value, at) {
  var dv = map.get(target);
  return dv.setUint32(at + target.byteOffset, value, true)
}

function write_int16_le(target, value, at) {
  var dv = map.get(target);
  return dv.setInt16(at + target.byteOffset, value, true)
}

function write_int32_le(target, value, at) {
  var dv = map.get(target);
  return dv.setInt32(at + target.byteOffset, value, true)
}

function write_float_le(target, value, at) {
  var dv = map.get(target);
  return dv.setFloat32(at + target.byteOffset, value, true)
}

function write_double_le(target, value, at) {
  var dv = map.get(target);
  return dv.setFloat64(at + target.byteOffset, value, true)
}

function write_uint16_be(target, value, at) {
  var dv = map.get(target);
  return dv.setUint16(at + target.byteOffset, value, false)
}

function write_uint32_be(target, value, at) {
  var dv = map.get(target);
  return dv.setUint32(at + target.byteOffset, value, false)
}

function write_int16_be(target, value, at) {
  var dv = map.get(target);
  return dv.setInt16(at + target.byteOffset, value, false)
}

function write_int32_be(target, value, at) {
  var dv = map.get(target);
  return dv.setInt32(at + target.byteOffset, value, false)
}

function write_float_be(target, value, at) {
  var dv = map.get(target);
  return dv.setFloat32(at + target.byteOffset, value, false)
}

function write_double_be(target, value, at) {
  var dv = map.get(target);
  return dv.setFloat64(at + target.byteOffset, value, false)
}

},{"./mapped.js":48}],53:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function InteractionData(){this.global=new Point,this.local=new Point,this.target=null,this.originalEvent=null}function InteractionManager(a){this.stage=a,this.mouse=new InteractionData,this.touchs={},this.tempPoint=new Point,this.mouseoverEnabled=!0,this.pool=[],this.interactiveItems=[],this.interactionDOMElement=null,this.last=0}var globals=require("./core/globals"),Point=require("./geom/Point"),Sprite=require("./display/Sprite"),platform=require("./platform");InteractionData.prototype.getLocalPosition=function(a){var b=a.worldTransform,c=this.global,d=b[0],e=b[1],f=b[2],g=b[3],h=b[4],i=b[5],j=1/(d*h+e*-g);return new Point(h*j*c.x+-e*j*c.y+(i*e-f*h)*j,d*j*c.y+-g*j*c.x+(-i*d+f*g)*j)};var proto=InteractionManager.prototype;proto.handleEvent=function(a){switch(a.type){case"mousedown":this.onMouseDown(a);break;case"mousemove":this.onMouseMove(a);break;case"mouseup":this.onMouseUp(a);break;case"mouseout":this.onMouseOut(a);break;case"touchstart":this.onTouchStart(a);break;case"touchmove":this.onTouchMove(a);break;case"touchend":this.onTouchEnd(a)}},proto.collectInteractiveSprite=function(a,b){for(var c=a.children,d=c.length-1;d>=0;d--){var e=c[d];e.interactive?(b.interactiveChildren=!0,this.interactiveItems.push(e),e.children.length>0&&this.collectInteractiveSprite(e,e)):(e.__iParent=null,e.children.length>0&&this.collectInteractiveSprite(e,b))}},proto.setTarget=function(a){a?null===this.interactionDOMElement&&this.setTargetDomElement(a.view):null!==this.target&&platform.window.removeEventListener("mouseup",this,!0),platform.window.addEventListener("mouseup",this,!0),this.target=a},proto.setTargetDomElement=function(a){null!==this.interactionDOMElement&&(this.interactionDOMElement.style["-ms-content-zooming"]="",this.interactionDOMElement.style["-ms-touch-action"]="",this.interactionDOMElement.removeEventListener("mousemove",this,!0),this.interactionDOMElement.removeEventListener("mousedown",this,!0),this.interactionDOMElement.removeEventListener("mouseout",this,!0),this.interactionDOMElement.removeEventListener("touchstart",this,!0),this.interactionDOMElement.removeEventListener("touchend",this,!0),this.interactionDOMElement.removeEventListener("touchmove",this,!0));var b=platform.navigator;b&&b.msPointerEnabled&&(a.style["-ms-content-zooming"]="none",a.style["-ms-touch-action"]="none"),a.addEventListener("mousemove",this,!0),a.addEventListener("mousedown",this,!0),a.addEventListener("mouseout",this,!0),a.addEventListener("touchstart",this,!0),a.addEventListener("touchend",this,!0),a.addEventListener("touchmove",this,!0),this.interactionDOMElement=a},proto.update=function(){if(this.target){var a=Date.now(),b=a-this.last;if(b=30*b/1e3,!(1>b)){this.last=a;var c,d;if(this.dirty){for(this.dirty=!1,c=0,d=this.interactiveItems.length;d>c;c++)this.interactiveItems[c].interactiveChildren=!1;this.interactiveItems=[],this.stage.interactive&&this.interactiveItems.push(this.stage),this.collectInteractiveSprite(this.stage,this.stage)}for(this.interactionDOMElement.style.cursor="inherit",c=0,d=this.interactiveItems.length;d>c;c++){var e=this.interactiveItems[c];(e.mouseover||e.mouseout||e.buttonMode)&&(e.__hit=this.hitTest(e,this.mouse),this.mouse.target=e,e.__hit?(e.buttonMode&&(this.interactionDOMElement.style.cursor=e.defaultCursor),e.__isOver||(e.mouseover&&e.mouseover(this.mouse),e.__isOver=!0)):e.__isOver&&(e.mouseout&&e.mouseout(this.mouse),e.__isOver=!1))}}}},proto.onMouseMove=function(a){this.mouse.originalEvent=a;var b=this.interactionDOMElement.getBoundingClientRect();this.mouse.global.x=(a.clientX-b.left)*(this.target.width/b.width),this.mouse.global.y=(a.clientY-b.top)*(this.target.height/b.height);for(var c=0,d=this.interactiveItems.length;d>c;c++){var e=this.interactiveItems[c];e.mousemove&&e.mousemove(this.mouse)}},proto.onMouseDown=function(a){this.mouse.originalEvent=a;for(var b=0,c=this.interactiveItems.length;c>b;b++){var d=this.interactiveItems[b];if((d.mousedown||d.click)&&(d.__mouseIsDown=!0,d.__hit=this.hitTest(d,this.mouse),d.__hit&&(d.mousedown&&d.mousedown(this.mouse),d.__isDown=!0,!d.interactiveChildren)))break}},proto.onMouseOut=function(){this.interactionDOMElement.style.cursor="inherit";for(var a=0,b=this.interactiveItems.length;b>a;a++){var c=this.interactiveItems[a];c.__isOver&&(this.mouse.target=c,c.mouseout&&c.mouseout(this.mouse),c.__isOver=!1)}},proto.onMouseUp=function(a){this.mouse.originalEvent=a;for(var b=!1,c=0,d=this.interactiveItems.length;d>c;c++){var e=this.interactiveItems[c];(e.mouseup||e.mouseupoutside||e.click)&&(e.__hit=this.hitTest(e,this.mouse),e.__hit&&!b?(e.mouseup&&e.mouseup(this.mouse),e.__isDown&&e.click&&e.click(this.mouse),e.interactiveChildren||(b=!0)):e.__isDown&&e.mouseupoutside&&e.mouseupoutside(this.mouse),e.__isDown=!1)}},proto.hitTest=function(a,b){var c=b.global;if(a.vcount!==globals.visibleCount)return!1;var d=a instanceof Sprite,e=a.worldTransform,f=e[0],g=e[1],h=e[2],i=e[3],j=e[4],k=e[5],l=1/(f*j+g*-i),m=j*l*c.x+-g*l*c.y+(k*g-h*j)*l,n=f*l*c.y+-i*l*c.x+(-k*f+h*i)*l;if(b.target=a,a.hitArea&&a.hitArea.contains)return a.hitArea.contains(m,n)?(b.target=a,!0):!1;if(d){var o,p=a.texture.frame.width,q=a.texture.frame.height,r=-p*a.anchor.x;if(m>r&&r+p>m&&(o=-q*a.anchor.y,n>o&&o+q>n))return b.target=a,!0}for(var s=0,t=a.children.length;t>s;s++){var u=a.children[s],v=this.hitTest(u,b);if(v)return b.target=a,!0}return!1},proto.onTouchMove=function(a){var b,c,d,e,f,g,h,i=this.interactionDOMElement.getBoundingClientRect(),j=a.changedTouches;for(b=0,c=j.length;c>b;b++)for(d=j[b],e=this.touchs[d.identifier],e.originalEvent=a,e.global.x=(d.clientX-i.left)*(this.target.width/i.width),e.global.y=(d.clientY-i.top)*(this.target.height/i.height),f=0,g=this.interactiveItems.length;g>f;f++)h=this.interactiveItems[b],h.touchmove&&h.touchmove(e)},proto.onTouchStart=function(a){for(var b=this.interactionDOMElement.getBoundingClientRect(),c=a.changedTouches,d=0,e=c.length;e>d;d++){var f=c[d],g=this.pool.pop();g||(g=new InteractionData),g.originalEvent=a,this.touchs[f.identifier]=g,g.global.x=(f.clientX-b.left)*(this.target.width/b.width),g.global.y=(f.clientY-b.top)*(this.target.height/b.height);for(var h=0,i=this.interactiveItems.length;i>h;h++){var j=this.interactiveItems[h];if((j.touchstart||j.tap)&&(j.__hit=this.hitTest(j,g),j.__hit&&(j.touchstart&&j.touchstart(g),j.__isDown=!0,j.__touchData=g,!j.interactiveChildren)))break}}},proto.onTouchEnd=function(a){for(var b=this.interactionDOMElement.getBoundingClientRect(),c=a.changedTouches,d=0,e=c.length;e>d;d++){var f=c[d],g=this.touchs[f.identifier],h=!1;g.global.x=(f.clientX-b.left)*(this.target.width/b.width),g.global.y=(f.clientY-b.top)*(this.target.height/b.height);for(var i=0,j=this.interactiveItems.length;j>i;i++){var k=this.interactiveItems[i],l=k.__touchData;k.__hit=this.hitTest(k,g),l===g&&(g.originalEvent=a,(k.touchend||k.tap)&&(k.__hit&&!h?(k.touchend&&k.touchend(g),k.__isDown&&k.tap&&k.tap(g),k.interactiveChildren||(h=!0)):k.__isDown&&k.touchendoutside&&k.touchendoutside(g),k.__isDown=!1),k.__touchData=null)}this.pool.push(g),this.touchs[f.identifier]=null}},module.exports=InteractionManager;
},{"./core/globals":54,"./display/Sprite":58,"./geom/Point":86,"./platform":97}],54:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";module.exports={gl:null,primitiveShader:null,stripShader:null,defaultShader:null,offset:null,projection:null,texturesToUpdate:[],texturesToDestroy:[],visibleCount:0};
},{}],55:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
function DisplayObject(){this.last=this,this.first=this,this.position=new Point,this.scale=new Point(1,1),this.pivot=new Point(0,0),this.rotation=0,this.alpha=1,this.visible=!0,this.hitArea=null,this.buttonMode=!1,this.renderable=!1,this.parent=null,this.stage=null,this.worldAlpha=1,this._interactive=!1,this.defaultCursor="pointer",this.worldTransform=mat3.create(),this.localTransform=mat3.create(),this.color=[],this.dynamic=!0,this._sr=0,this._cr=1,this.filterArea=new Rectangle(0,0,1,1)}var globals=require("../core/globals"),mat3=require("../geom/matrix").mat3,FilterBlock=require("../filters/FilterBlock"),Point=require("../geom/Point"),Rectangle=require("../geom/Rectangle"),proto=DisplayObject.prototype;proto.setInteractive=function(a){this.interactive=a},Object.defineProperty(proto,"interactive",{get:function(){return this._interactive},set:function(a){this._interactive=a,this.stage&&(this.stage.dirty=!0)}}),Object.defineProperty(proto,"mask",{get:function(){return this._mask},set:function(a){a?this._mask?(a.start=this._mask.start,a.end=this._mask.end):(this.addFilter(a),a.renderable=!1):(this.removeFilter(this._mask),this._mask.renderable=!0),this._mask=a}}),Object.defineProperty(proto,"filters",{get:function(){return this._filters},set:function(a){if(a){this._filters&&this.removeFilter(this._filters),this.addFilter(a);for(var b=[],c=0;c<a.length;c++)for(var d=a[c].passes,e=0;e<d.length;e++)b.push(d[e]);a.start.filterPasses=b}else this._filters&&this.removeFilter(this._filters);this._filters=a}}),proto.addFilter=function(a){var b=new FilterBlock,c=new FilterBlock;a.start=b,a.end=c,b.data=a,c.data=a,b.first=b.last=this,c.first=c.last=this,b.open=!0,b.target=this;var d,e,f=b,g=b;e=this.first._iPrev,e?(d=e._iNext,f._iPrev=e,e._iNext=f):d=this,d&&(d._iPrev=g,g._iNext=d),f=c,g=c,d=null,e=null,e=this.last,d=e._iNext,d&&(d._iPrev=g,g._iNext=d),f._iPrev=e,e._iNext=f;for(var h=this,i=this.last;h;)h.last===i&&(h.last=c),h=h.parent;this.first=b,this.__renderGroup&&this.__renderGroup.addFilterBlocks(b,c)},proto.removeFilter=function(a){var b=a.start,c=b._iNext,d=b._iPrev;c&&(c._iPrev=d),d&&(d._iNext=c),this.first=b._iNext;var e=a.end;c=e._iNext,d=e._iPrev,c&&(c._iPrev=d),d._iNext=c;for(var f=e._iPrev,g=this;g.last===e&&(g.last=f,g=g.parent););this.__renderGroup&&this.__renderGroup.removeFilterBlocks(b,e)},proto.updateTransform=function(){this.rotation!==this.rotationCache&&(this.rotationCache=this.rotation,this._sr=Math.sin(this.rotation),this._cr=Math.cos(this.rotation));var a=this.localTransform,b=this.parent.worldTransform,c=this.worldTransform;a[0]=this._cr*this.scale.x,a[1]=-this._sr*this.scale.y,a[3]=this._sr*this.scale.x,a[4]=this._cr*this.scale.y;var d=this.pivot.x,e=this.pivot.y,f=a[0],g=a[1],h=this.position.x-a[0]*d-e*a[1],i=a[3],j=a[4],k=this.position.y-a[4]*e-d*a[3],l=b[0],m=b[1],n=b[2],o=b[3],p=b[4],q=b[5];a[2]=h,a[5]=k,c[0]=l*f+m*i,c[1]=l*g+m*j,c[2]=l*h+m*k+n,c[3]=o*f+p*i,c[4]=o*g+p*j,c[5]=o*h+p*k+q,this.worldAlpha=this.alpha*this.parent.worldAlpha,this.vcount=globals.visibleCount},module.exports=DisplayObject;
},{"../core/globals":54,"../filters/FilterBlock":76,"../geom/Point":86,"../geom/Rectangle":88,"../geom/matrix":89}],56:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function DisplayObjectContainer(){DisplayObject.call(this),this.children=[]}var DisplayObject=require("./DisplayObject"),proto=DisplayObjectContainer.prototype=Object.create(DisplayObject.prototype,{constructor:{value:DisplayObjectContainer}});proto.addChild=function(a){if(a.parent&&a.parent!==this&&a.parent.removeChild(a),a.parent=this,this.children.push(a),this.stage){var b=a;do b.interactive&&(this.stage.dirty=!0),b.stage=this.stage,b=b._iNext;while(b)}var c,d,e=a.first,f=a.last;d=this._filters||this._mask?this.last._iPrev:this.last,c=d._iNext;for(var g=this,h=d;g;)g.last===h&&(g.last=a.last),g=g.parent;c&&(c._iPrev=f,f._iNext=c),e._iPrev=d,d._iNext=e,this.__renderGroup&&(a.__renderGroup&&a.__renderGroup.removeDisplayObjectAndChildren(a),this.__renderGroup.addDisplayObjectAndChildren(a))},proto.addChildAt=function(a,b){if(!(b>=0&&b<=this.children.length))throw new Error(a+" The index "+b+" supplied is out of bounds "+this.children.length);if(void 0!==a.parent&&a.parent.removeChild(a),a.parent=this,this.stage){var c=a;do c.interactive&&(this.stage.dirty=!0),c.stage=this.stage,c=c._iNext;while(c)}var d,e,f=a.first,g=a.last;if(b===this.children.length){e=this.last;for(var h=this,i=this.last;h;)h.last===i&&(h.last=a.last),h=h.parent}else e=0===b?this:this.children[b-1].last;d=e._iNext,d&&(d._iPrev=g,g._iNext=d),f._iPrev=e,e._iNext=f,this.children.splice(b,0,a),this.__renderGroup&&(a.__renderGroup&&a.__renderGroup.removeDisplayObjectAndChildren(a),this.__renderGroup.addDisplayObjectAndChildren(a))},proto.swapChildren=function(a,b){if(a!==b){var c=this.children.indexOf(a),d=this.children.indexOf(b);if(0>c||0>d)throw new Error("swapChildren: Both the supplied DisplayObjects must be a child of the caller.");this.removeChild(a),this.removeChild(b),d>c?(this.addChildAt(b,c),this.addChildAt(a,d)):(this.addChildAt(a,d),this.addChildAt(b,c))}},proto.getChildAt=function(a){if(a>=0&&a<this.children.length)return this.children[a];throw new Error("Both the supplied DisplayObjects must be a child of the caller "+this)},proto.removeChild=function(a){var b=this.children.indexOf(a);if(-1===b)throw new Error(a+" The supplied DisplayObject must be a child of the caller "+this);var c=a.first,d=a.last,e=d._iNext,f=c._iPrev;if(e&&(e._iPrev=f),f._iNext=e,this.last===d)for(var g=c._iPrev,h=this;h.last===d&&(h.last=g,h=h.parent););if(d._iNext=null,c._iPrev=null,this.stage){var i=a;do i.interactive&&(this.stage.dirty=!0),i.stage=null,i=i._iNext;while(i)}a.__renderGroup&&a.__renderGroup.removeDisplayObjectAndChildren(a),a.parent=void 0,this.children.splice(b,1)},proto.updateTransform=function(){if(this.visible){DisplayObject.prototype.updateTransform.call(this);for(var a=0,b=this.children.length;b>a;a++)this.children[a].updateTransform()}},module.exports=DisplayObjectContainer;
},{"./DisplayObject":55}],57:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function MovieClip(a){Sprite.call(this,a[0]),this.textures=a,this.animationSpeed=1,this.loop=!0,this.onComplete=null,this.currentFrame=0,this.playing=!1}var Sprite=require("./Sprite"),proto=MovieClip.prototype=Object.create(Sprite.prototype,{constructor:{value:MovieClip}});Object.defineProperty(proto,"totalFrames",{get:function(){return this.textures.length}}),proto.stop=function(){this.playing=!1},proto.play=function(){this.playing=!0},proto.gotoAndStop=function(a){this.playing=!1,this.currentFrame=a;var b=this.currentFrame+.5|0;this.setTexture(this.textures[b%this.textures.length])},proto.gotoAndPlay=function(a){this.currentFrame=a,this.playing=!0},proto.updateTransform=function(){if(Sprite.prototype.updateTransform.call(this),this.playing){this.currentFrame+=this.animationSpeed;var a=this.currentFrame+.5|0;this.loop||a<this.textures.length?this.setTexture(this.textures[a%this.textures.length]):a>=this.textures.length&&(this.gotoAndStop(this.textures.length-1),this.onComplete&&this.onComplete())}},module.exports=MovieClip;
},{"./Sprite":58}],58:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Sprite(a){if(DisplayObjectContainer.call(this),this.anchor=new Point,this.texture=a,this.blendMode=blendModes.NORMAL,this._width=0,this._height=0,a.baseTexture.hasLoaded)this.updateFrame=!0;else{var b=this;this.texture.addEventListener("update",function(){b.onTextureUpdate()})}this.renderable=!0}var blendModes=require("./blendModes"),DisplayObjectContainer=require("./DisplayObjectContainer"),Point=require("../geom/Point"),Texture=require("../textures/Texture"),proto=Sprite.prototype=Object.create(DisplayObjectContainer.prototype,{constructor:{value:Sprite}});Object.defineProperty(proto,"width",{get:function(){return this.scale.x*this.texture.frame.width},set:function(a){this.scale.x=a/this.texture.frame.width,this._width=a}}),Object.defineProperty(proto,"height",{get:function(){return this.scale.y*this.texture.frame.height},set:function(a){this.scale.y=a/this.texture.frame.height,this._height=a}}),proto.setTexture=function(a){this.texture.baseTexture!==a.baseTexture?(this.textureChange=!0,this.texture=a,this.__renderGroup&&this.__renderGroup.updateTexture(this)):this.texture=a,this.updateFrame=!0},proto.onTextureUpdate=function(){this._width&&(this.scale.x=this._width/this.texture.frame.width),this._height&&(this.scale.y=this._height/this.texture.frame.height),this.updateFrame=!0},Sprite.fromFrame=function(a){var b=Texture.cache[a];if(!b)throw new Error('The frameId "'+a+'" does not exist in the texture cache'+this);return new Sprite(b)},Sprite.fromImage=function(a){var b=Texture.fromImage(a);return new Sprite(b)},module.exports=Sprite;
},{"../geom/Point":86,"../textures/Texture":115,"./DisplayObjectContainer":56,"./blendModes":60}],59:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Stage(a){DisplayObjectContainer.call(this),this.worldTransform=mat3.create(),this.interactive=!0,this.interactionManager=new InteractionManager(this),this.dirty=!0,this.__childrenAdded=[],this.__childrenRemoved=[],this.stage=this,this.stage.hitArea=new Rectangle(0,0,1e5,1e5),this.setBackgroundColor(a),this.worldVisible=!0}var globals=require("../core/globals"),mat3=require("../geom/matrix").mat3,hex2rgb=require("../utils/color").hex2rgb,DisplayObjectContainer=require("./DisplayObjectContainer"),InteractionManager=require("../InteractionManager"),Rectangle=require("../geom/Rectangle"),proto=Stage.prototype=Object.create(DisplayObjectContainer.prototype,{constructor:{value:Stage}});proto.setInteractionDelegate=function(a){this.interactionManager.setTargetDomElement(a)},proto.updateTransform=function(){this.worldAlpha=1,this.vcount=globals.visibleCount;for(var a=0,b=this.children.length;b>a;a++)this.children[a].updateTransform();this.dirty&&(this.dirty=!1,this.interactionManager.dirty=!0),this.interactive&&this.interactionManager.update()},proto.setBackgroundColor=function(a){this.backgroundColor=a||0,this.backgroundColorSplit=hex2rgb(this.backgroundColor);var b=this.backgroundColor.toString(16);b="000000".substr(0,6-b.length)+b,this.backgroundColorString="#"+b},proto.getMousePosition=function(){return this.interactionManager.mouse.global},module.exports=Stage;
},{"../InteractionManager":53,"../core/globals":54,"../geom/Rectangle":88,"../geom/matrix":89,"../utils/color":118,"./DisplayObjectContainer":56}],60:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";module.exports={NORMAL:0,SCREEN:1};
},{}],61:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function EventTarget(){var a={};this.addEventListener=this.on=function(b,c){void 0===a[b]&&(a[b]=[]),-1===a[b].indexOf(c)&&a[b].push(c)},this.dispatchEvent=this.emit=function(b){if(a[b.type]&&a[b.type].length)for(var c=0,d=a[b.type].length;d>c;c++)a[b.type][c](b)},this.removeEventListener=this.off=function(b,c){var d=a[b].indexOf(c);-1!==d&&a[b].splice(d,1)},this.removeAllEventListeners=function(b){var c=a[b];c&&(c.length=0)}}module.exports=EventTarget;
},{}],62:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function CustomRenderable(){DisplayObject.call(this),this.renderable=!0}var DisplayObject=require("../display/DisplayObject"),proto=CustomRenderable.prototype=Object.create(DisplayObject.prototype,{constructor:{value:CustomRenderable}});proto.renderCanvas=function(){},proto.initWebGL=function(){},proto.renderWebGL=function(){},module.exports=CustomRenderable;
},{"../display/DisplayObject":55}],63:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Rope(a,b){Strip.call(this,a),this.points=b;try{this.verticies=new Float32Array(4*b.length),this.uvs=new Float32Array(4*b.length),this.colors=new Float32Array(2*b.length),this.indices=new Uint16Array(2*b.length)}catch(c){this.verticies=new Array(4*b.length),this.uvs=new Array(4*b.length),this.colors=new Array(2*b.length),this.indices=new Array(2*b.length)}this.refresh()}var Strip=require("./Strip"),DisplayObjectContainer=require("../display/DisplayObjectContainer"),proto=Rope.prototype=Object.create(Strip.prototype,{constructor:{value:Rope}});proto.refresh=function(){var a=this.points;if(!(a.length<1)){var b=this.uvs,c=a[0],d=this.indices,e=this.colors;this.count-=.2,b[0]=0,b[1]=1,b[2]=0,b[3]=1,e[0]=1,e[1]=1,d[0]=0,d[1]=1;for(var f,g,h,i=a.length,j=1;i>j;j++)f=a[j],g=4*j,h=j/(i-1),j%2?(b[g]=h,b[g+1]=0,b[g+2]=h,b[g+3]=1):(b[g]=h,b[g+1]=0,b[g+2]=h,b[g+3]=1),g=2*j,e[g]=1,e[g+1]=1,g=2*j,d[g]=g,d[g+1]=g+1,c=f}},proto.updateTransform=function(){var a=this.points;if(!(a.length<1)){var b,c=a[0],d={x:0,y:0};this.count-=.2;var e=this.verticies;e[0]=c.x+d.x,e[1]=c.y+d.y,e[2]=c.x-d.x,e[3]=c.y-d.y;for(var f,g,h,i,j,k=a.length,l=1;k>l;l++)f=a[l],g=4*l,b=l<a.length-1?a[l+1]:f,d.y=-(b.x-c.x),d.x=b.y-c.y,h=10*(1-l/(k-1)),h>1&&(h=1),i=Math.sqrt(d.x*d.x+d.y*d.y),j=this.texture.height/2,d.x/=i,d.y/=i,d.x*=j,d.y*=j,e[g]=f.x+d.x,e[g+1]=f.y+d.y,e[g+2]=f.x-d.x,e[g+3]=f.y-d.y,c=f;DisplayObjectContainer.prototype.updateTransform.call(this)}},proto.setTexture=function(a){this.texture=a,this.updateFrame=!0},module.exports=Rope;
},{"../display/DisplayObjectContainer":56,"./Strip":65}],64:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Spine(a){if(DisplayObjectContainer.call(this),this.spineData=Spine.animCache[a],!this.spineData)throw new Error("Spine data must be preloaded using SpineLoader or AssetLoader: "+a);this.skeleton=new spine.Skeleton(this.spineData),this.skeleton.updateWorldTransform(),this.stateData=new spine.AnimationStateData(this.spineData),this.state=new spine.AnimationState(this.stateData),this.slotContainers=[];for(var b=0,c=this.skeleton.drawOrder.length;c>b;b++){var d=this.skeleton.drawOrder[b],e=d.attachment,f=new DisplayObjectContainer;if(this.slotContainers.push(f),this.addChild(f),e instanceof spine.RegionAttachment){var g=e.rendererObject.name,h=this.createSprite(d,e.rendererObject);d.currentSprite=h,d.currentSpriteName=g,f.addChild(h)}}}var spine=require("../utils/spine"),DisplayObjectContainer=require("../display/DisplayObjectContainer"),Sprite=require("../display/Sprite"),Texture=require("../textures/Texture"),proto=Spine.prototype=Object.create(DisplayObjectContainer.prototype,{constructor:{value:Spine}});proto.updateTransform=function(){this.lastTime=this.lastTime||Date.now();var a=.001*(Date.now()-this.lastTime);this.lastTime=Date.now(),this.state.update(a),this.state.apply(this.skeleton),this.skeleton.updateWorldTransform();for(var b=this.skeleton.drawOrder,c=0,d=b.length;d>c;c++){var e=b[c],f=e.attachment,g=this.slotContainers[c];if(f instanceof spine.RegionAttachment){if(f.rendererObject&&(!e.currentSpriteName||e.currentSpriteName!==f.name)){var h=f.rendererObject.name;if(void 0!==e.currentSprite&&(e.currentSprite.visible=!1),e.sprites=e.sprites||{},void 0!==e.sprites[h])e.sprites[h].visible=!0;else{var i=this.createSprite(e,f.rendererObject);g.addChild(i)}e.currentSprite=e.sprites[h],e.currentSpriteName=h}g.visible=!0;var j=e.bone;g.position.x=j.worldX+f.x*j.m00+f.y*j.m01,g.position.y=j.worldY+f.x*j.m10+f.y*j.m11,g.scale.x=j.worldScaleX,g.scale.y=j.worldScaleY,g.rotation=-(e.bone.worldRotation*Math.PI/180)}else g.visible=!1}DisplayObjectContainer.prototype.updateTransform.call(this)},proto.createSprite=function(a,b){var c=Texture.cache[b.name]?b.name:b.name+".png",d=new Sprite(Texture.fromFrame(c));return d.scale=b.scale,d.rotation=b.rotation,d.anchor.x=d.anchor.y=.5,a.sprites=a.sprites||{},a.sprites[b.name]=d,d},Spine.animCache={},module.exports=Spine;
},{"../display/DisplayObjectContainer":56,"../display/Sprite":58,"../textures/Texture":115,"../utils/spine":120}],65:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Strip(a,b,c){DisplayObjectContainer.call(this),this.texture=a,this.blendMode=blendModes.NORMAL;try{this.uvs=new Float32Array([0,1,1,1,1,0,0,1]),this.verticies=new Float32Array([0,0,0,0,0,0,0,0,0]),this.colors=new Float32Array([1,1,1,1]),this.indices=new Uint16Array([0,1,2,3])}catch(d){this.uvs=[0,1,1,1,1,0,0,1],this.verticies=[0,0,0,0,0,0,0,0,0],this.colors=[1,1,1,1],this.indices=[0,1,2,3]}if(this.width=b,this.height=c,a.baseTexture.hasLoaded)this.width=this.texture.frame.width,this.height=this.texture.frame.height,this.updateFrame=!0;else{var e=this;this.texture.addEventListener("update",function(){e.onTextureUpdate()})}this.renderable=!0}var blendModes=require("../display/blendModes"),DisplayObjectContainer=require("../display/DisplayObjectContainer"),proto=Strip.prototype=Object.create(DisplayObjectContainer.prototype,{constructor:{value:Strip}});proto.setTexture=function(a){this.texture=a,this.width=a.frame.width,this.height=a.frame.height,this.updateFrame=!0},proto.onTextureUpdate=function(){this.updateFrame=!0},module.exports=Strip;
},{"../display/DisplayObjectContainer":56,"../display/blendModes":60}],66:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function TilingSprite(a,b,c){DisplayObjectContainer.call(this),this.texture=a,this.width=b,this.height=c,this.tileScale=new Point(1,1),this.tilePosition=new Point(0,0),this.renderable=!0,this.blendMode=blendModes.NORMAL}var blendModes=require("../display/blendModes"),DisplayObjectContainer=require("../display/DisplayObjectContainer"),Point=require("../geom/Point"),proto=TilingSprite.prototype=Object.create(DisplayObjectContainer.prototype,{constructor:{value:TilingSprite}});proto.setTexture=function(a){this.texture=a,this.updateFrame=!0},proto.onTextureUpdate=function(){this.updateFrame=!0},module.exports=TilingSprite;
},{"../display/DisplayObjectContainer":56,"../display/blendModes":60,"../geom/Point":86}],67:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function AbstractFilter(a,b){this.passes=[this],this.dirty=!0,this.padding=0,this.uniforms=b||{},this.fragmentSrc=a||[]}module.exports=AbstractFilter;
},{}],68:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function BlurFilter(){this.blurXFilter=new BlurXFilter,this.blurYFilter=new BlurYFilter,this.passes=[this.blurXFilter,this.blurYFilter]}var BlurXFilter=require("./BlurXFilter"),BlurYFilter=require("./BlurYFilter"),proto=BlurFilter.prototype;Object.defineProperty(proto,"blur",{get:function(){return this.blurXFilter.blur},set:function(a){this.blurXFilter.blur=this.blurYFilter.blur=a}}),Object.defineProperty(proto,"blurX",{get:function(){return this.blurXFilter.blur},set:function(a){this.blurXFilter.blur=a}}),Object.defineProperty(proto,"blurY",{get:function(){return this.blurYFilter.blur},set:function(a){this.blurYFilter.blur=a}}),module.exports=BlurFilter;
},{"./BlurXFilter":69,"./BlurYFilter":70}],69:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function BlurXFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={blur:{type:"1f",value:1/512}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform float blur;","uniform sampler2D uSampler;","void main(void) {","   vec4 sum = vec4(0.0);","   sum += texture2D(uSampler, vec2(vTextureCoord.x - 4.0*blur, vTextureCoord.y)) * 0.05;","   sum += texture2D(uSampler, vec2(vTextureCoord.x - 3.0*blur, vTextureCoord.y)) * 0.09;","   sum += texture2D(uSampler, vec2(vTextureCoord.x - 2.0*blur, vTextureCoord.y)) * 0.12;","   sum += texture2D(uSampler, vec2(vTextureCoord.x - blur, vTextureCoord.y)) * 0.15;","   sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y)) * 0.16;","   sum += texture2D(uSampler, vec2(vTextureCoord.x + blur, vTextureCoord.y)) * 0.15;","   sum += texture2D(uSampler, vec2(vTextureCoord.x + 2.0*blur, vTextureCoord.y)) * 0.12;","   sum += texture2D(uSampler, vec2(vTextureCoord.x + 3.0*blur, vTextureCoord.y)) * 0.09;","   sum += texture2D(uSampler, vec2(vTextureCoord.x + 4.0*blur, vTextureCoord.y)) * 0.05;","   gl_FragColor = sum;","}"]}var AbstractFilter=require("./AbstractFilter"),proto=BlurXFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:BlurXFilter}});Object.defineProperty(proto,"blur",{get:function(){return this.uniforms.blur.value/(1/7e3)},set:function(a){this.dirty=!0,this.uniforms.blur.value=1/7e3*a}}),module.exports=BlurXFilter;
},{"./AbstractFilter":67}],70:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function BlurYFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={blur:{type:"1f",value:1/512}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform float blur;","uniform sampler2D uSampler;","void main(void) {","   vec4 sum = vec4(0.0);","   sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y - 4.0*blur)) * 0.05;","   sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y - 3.0*blur)) * 0.09;","   sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y - 2.0*blur)) * 0.12;","   sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y - blur)) * 0.15;","   sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y)) * 0.16;","   sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y + blur)) * 0.15;","   sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y + 2.0*blur)) * 0.12;","   sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y + 3.0*blur)) * 0.09;","   sum += texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y + 4.0*blur)) * 0.05;","   gl_FragColor = sum;","}"]}var AbstractFilter=require("./AbstractFilter"),proto=BlurYFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:BlurYFilter}});Object.defineProperty(proto,"blur",{get:function(){return this.uniforms.blur.value/(1/7e3)},set:function(a){this.uniforms.blur.value=1/7e3*a}}),module.exports=BlurYFilter;
},{"./AbstractFilter":67}],71:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function ColorMatrixFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={matrix:{type:"mat4",value:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform float invert;","uniform mat4 matrix;","uniform sampler2D uSampler;","void main(void) {","   gl_FragColor = texture2D(uSampler, vTextureCoord) * matrix;","   gl_FragColor = gl_FragColor * vColor;","}"]}var AbstractFilter=require("./AbstractFilter"),proto=ColorMatrixFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:ColorMatrixFilter}});Object.defineProperty(proto,"matrix",{get:function(){return this.uniforms.matrix.value},set:function(a){this.uniforms.matrix.value=a}}),module.exports=ColorMatrixFilter;
},{"./AbstractFilter":67}],72:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function ColorStepFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={step:{type:"1f",value:5}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform sampler2D uSampler;","uniform float step;","void main(void) {","   vec4 color = texture2D(uSampler, vTextureCoord);","   color = floor(color * step) / step;","   gl_FragColor = color * vColor;","}"]}var AbstractFilter=require("./AbstractFilter"),proto=ColorStepFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:ColorStepFilter}});Object.defineProperty(proto,"step",{get:function(){return this.uniforms.step.value},set:function(a){this.uniforms.step.value=a}}),module.exports=ColorStepFilter;
},{"./AbstractFilter":67}],73:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function CrossHatchFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={blur:{type:"1f",value:1/512}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform float blur;","uniform sampler2D uSampler;","void main(void) {","    float lum = length(texture2D(uSampler, vTextureCoord.xy).rgb);","    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);","    if (lum < 1.00) {","        if (mod(gl_FragCoord.x + gl_FragCoord.y, 10.0) == 0.0) {","            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);","        }","    }","    if (lum < 0.75) {","        if (mod(gl_FragCoord.x - gl_FragCoord.y, 10.0) == 0.0) {","            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);","        }","    }","    if (lum < 0.50) {","        if (mod(gl_FragCoord.x + gl_FragCoord.y - 5.0, 10.0) == 0.0) {","            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);","        }","    }","    if (lum < 0.3) {","        if (mod(gl_FragCoord.x - gl_FragCoord.y - 5.0, 10.0) == 0.0) {","            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);","        }","    }","}"]}var AbstractFilter=require("./AbstractFilter"),proto=CrossHatchFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:CrossHatchFilter}});Object.defineProperty(proto,"blur",{get:function(){return this.uniforms.blur.value/(1/7e3)},set:function(a){this.uniforms.blur.value=1/7e3*a}}),module.exports=CrossHatchFilter;
},{"./AbstractFilter":67}],74:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function DisplacementFilter(a){AbstractFilter.call(this),this.passes=[this],a.baseTexture._powerOf2=!0,this.uniforms={displacementMap:{type:"sampler2D",value:a},scale:{type:"2f",value:{x:30,y:30}},offset:{type:"2f",value:{x:0,y:0}},mapDimensions:{type:"2f",value:{x:1,y:5112}},dimensions:{type:"4fv",value:[0,0,0,0]}},a.baseTexture.hasLoaded?(this.uniforms.mapDimensions.value.x=a.width,this.uniforms.mapDimensions.value.y=a.height):(this.boundLoadedFunction=this.onTextureLoaded.bind(this),a.baseTexture.on("loaded",this.boundLoadedFunction)),this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform sampler2D displacementMap;","uniform sampler2D uSampler;","uniform vec2 scale;","uniform vec2 offset;","uniform vec4 dimensions;","uniform vec2 mapDimensions;","void main(void) {","   vec2 mapCords = vTextureCoord.xy;","   mapCords += (dimensions.zw + offset)/ dimensions.xy ;","   mapCords.y *= -1.0;","   mapCords.y += 1.0;","   vec2 matSample = texture2D(displacementMap, mapCords).xy;","   matSample -= 0.5;","   matSample *= scale;","   matSample /= mapDimensions;","   gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x + matSample.x, vTextureCoord.y + matSample.y));","   gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb, 1.0);","   vec2 cord = vTextureCoord;","   gl_FragColor = gl_FragColor * vColor;","}"]}var AbstractFilter=require("./AbstractFilter"),proto=DisplacementFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:DisplacementFilter}});proto.onTextureLoaded=function(){this.uniforms.mapDimensions.value.x=this.uniforms.displacementMap.value.width,this.uniforms.mapDimensions.value.y=this.uniforms.displacementMap.value.height,this.uniforms.displacementMap.value.baseTexture.off("loaded",this.boundLoadedFunction)},Object.defineProperty(proto,"map",{get:function(){return this.uniforms.displacementMap.value},set:function(a){this.uniforms.displacementMap.value=a}}),Object.defineProperty(proto,"scale",{get:function(){return this.uniforms.scale.value},set:function(a){this.uniforms.scale.value=a}}),Object.defineProperty(proto,"offset",{get:function(){return this.uniforms.offset.value},set:function(a){this.uniforms.offset.value=a}}),module.exports=DisplacementFilter;
},{"./AbstractFilter":67}],75:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function DotScreenFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={scale:{type:"1f",value:1},angle:{type:"1f",value:5},dimensions:{type:"4fv",value:[0,0,0,0]}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform vec4 dimensions;","uniform sampler2D uSampler;","uniform float angle;","uniform float scale;","float pattern() {","   float s = sin(angle), c = cos(angle);","   vec2 tex = vTextureCoord * dimensions.xy;","   vec2 point = vec2(","       c * tex.x - s * tex.y,","       s * tex.x + c * tex.y","   ) * scale;","   return (sin(point.x) * sin(point.y)) * 4.0;","}","void main() {","   vec4 color = texture2D(uSampler, vTextureCoord);","   float average = (color.r + color.g + color.b) / 3.0;","   gl_FragColor = vec4(vec3(average * 10.0 - 5.0 + pattern()), color.a);","}"]}var AbstractFilter=require("./AbstractFilter"),proto=DotScreenFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:DotScreenFilter}});Object.defineProperty(proto,"scale",{get:function(){return this.uniforms.scale.value},set:function(a){this.dirty=!0,this.uniforms.scale.value=a}}),Object.defineProperty(proto,"angle",{get:function(){return this.uniforms.angle.value},set:function(a){this.dirty=!0,this.uniforms.angle.value=a}}),module.exports=DotScreenFilter;
},{"./AbstractFilter":67}],76:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function FilterBlock(){this.visible=!0,this.renderable=!0}module.exports=FilterBlock;
},{}],77:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function GrayFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={gray:{type:"1f",value:1}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform sampler2D uSampler;","uniform float gray;","void main(void) {","   gl_FragColor = texture2D(uSampler, vTextureCoord);","   gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.2126*gl_FragColor.r + 0.7152*gl_FragColor.g + 0.0722*gl_FragColor.b), gray);","   gl_FragColor = gl_FragColor * vColor;","}"]}var AbstractFilter=require("./AbstractFilter"),proto=GrayFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:GrayFilter}});Object.defineProperty(proto,"gray",{get:function(){return this.uniforms.gray.value},set:function(a){this.uniforms.gray.value=a}}),module.exports=GrayFilter;
},{"./AbstractFilter":67}],78:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function InvertFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={invert:{type:"1f",value:1}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform float invert;","uniform sampler2D uSampler;","void main(void) {","   gl_FragColor = texture2D(uSampler, vTextureCoord);","   gl_FragColor.rgb = mix( (vec3(1)-gl_FragColor.rgb) * gl_FragColor.a, gl_FragColor.rgb, 1.0 - invert);","   gl_FragColor = gl_FragColor * vColor;","}"]}var AbstractFilter=require("./AbstractFilter"),proto=InvertFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:InvertFilter}});Object.defineProperty(proto,"invert",{get:function(){return this.uniforms.invert.value},set:function(a){this.uniforms.invert.value=a}}),module.exports=InvertFilter;
},{"./AbstractFilter":67}],79:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function PixelateFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={invert:{type:"1f",value:0},dimensions:{type:"4fv",value:new Float32Array([1e4,100,10,10])},pixelSize:{type:"2f",value:{x:10,y:10}}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform vec2 testDim;","uniform vec4 dimensions;","uniform vec2 pixelSize;","uniform sampler2D uSampler;","void main(void) {","   vec2 coord = vTextureCoord;","   vec2 size = dimensions.xy/pixelSize;","   vec2 color = floor( ( vTextureCoord * size ) ) / size + pixelSize/dimensions.xy * 0.5;","   gl_FragColor = texture2D(uSampler, color);","}"]}var AbstractFilter=require("./AbstractFilter"),proto=PixelateFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:PixelateFilter}});Object.defineProperty(proto,"size",{get:function(){return this.uniforms.pixelSize.value},set:function(a){this.dirty=!0,this.uniforms.pixelSize.value=a}}),module.exports=PixelateFilter;
},{"./AbstractFilter":67}],80:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function RGBSplitFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={red:{type:"2f",value:{x:20,y:20}},green:{type:"2f",value:{x:-20,y:20}},blue:{type:"2f",value:{x:20,y:-20}},dimensions:{type:"4fv",value:[0,0,0,0]}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform vec2 red;","uniform vec2 green;","uniform vec2 blue;","uniform vec4 dimensions;","uniform sampler2D uSampler;","void main(void) {","   gl_FragColor.r = texture2D(uSampler, vTextureCoord + red/dimensions.xy).r;","   gl_FragColor.g = texture2D(uSampler, vTextureCoord + green/dimensions.xy).g;","   gl_FragColor.b = texture2D(uSampler, vTextureCoord + blue/dimensions.xy).b;","   gl_FragColor.a = texture2D(uSampler, vTextureCoord).a;","}"]}var AbstractFilter=require("./AbstractFilter"),proto=RGBSplitFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:RGBSplitFilter}});Object.defineProperty(proto,"angle",{get:function(){return this.uniforms.blur.value/(1/7e3)},set:function(a){this.uniforms.blur.value=1/7e3*a}}),module.exports=RGBSplitFilter;
},{"./AbstractFilter":67}],81:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function SepiaFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={sepia:{type:"1f",value:1}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform float sepia;","uniform sampler2D uSampler;","const mat3 sepiaMatrix = mat3(0.3588, 0.7044, 0.1368, 0.2990, 0.5870, 0.1140, 0.2392, 0.4696, 0.0912);","void main(void) {","   gl_FragColor = texture2D(uSampler, vTextureCoord);","   gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * sepiaMatrix, sepia);","   gl_FragColor = gl_FragColor * vColor;","}"]}var AbstractFilter=require("./AbstractFilter"),proto=SepiaFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:SepiaFilter}});Object.defineProperty(proto,"sepia",{get:function(){return this.uniforms.sepia.value},set:function(a){this.uniforms.sepia.value=a}}),module.exports=SepiaFilter;
},{"./AbstractFilter":67}],82:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function SmartBlurFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={blur:{type:"1f",value:1/512}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","uniform sampler2D uSampler;","const vec2 delta = vec2(1.0/10.0, 0.0);","float random(vec3 scale, float seed) {","   return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);","}","void main(void) {","   vec4 color = vec4(0.0);","   float total = 0.0;","   float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);","   for (float t = -30.0; t <= 30.0; t++) {","       float percent = (t + offset - 0.5) / 30.0;","       float weight = 1.0 - abs(percent);","       vec4 sample = texture2D(uSampler, vTextureCoord + delta * percent);","       sample.rgb *= sample.a;","       color += sample * weight;","       total += weight;","   }","   gl_FragColor = color / total;","   gl_FragColor.rgb /= gl_FragColor.a + 0.00001;","}"]}var AbstractFilter=require("./AbstractFilter"),proto=SmartBlurFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:SmartBlurFilter}});Object.defineProperty(proto,"blur",{get:function(){return this.uniforms.blur.value},set:function(a){this.uniforms.blur.value=a}}),module.exports=SmartBlurFilter;
},{"./AbstractFilter":67}],83:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function TwistFilter(){AbstractFilter.call(this),this.passes=[this],this.uniforms={radius:{type:"1f",value:.5},angle:{type:"1f",value:5},offset:{type:"2f",value:{x:.5,y:.5}}},this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform vec4 dimensions;","uniform sampler2D uSampler;","uniform float radius;","uniform float angle;","uniform vec2 offset;","void main(void) {","   vec2 coord = vTextureCoord - offset;","   float distance = length(coord);","   if (distance < radius) {","       float ratio = (radius - distance) / radius;","       float angleMod = ratio * ratio * angle;","       float s = sin(angleMod);","       float c = cos(angleMod);","       coord = vec2(coord.x * c - coord.y * s, coord.x * s + coord.y * c);","   }","   gl_FragColor = texture2D(uSampler, coord+offset);","}"]}var AbstractFilter=require("./AbstractFilter"),proto=TwistFilter.prototype=Object.create(AbstractFilter.prototype,{constructor:{value:TwistFilter}});Object.defineProperty(proto,"offset",{get:function(){return this.uniforms.offset.value},set:function(a){this.dirty=!0,this.uniforms.offset.value=a}}),Object.defineProperty(proto,"radius",{get:function(){return this.uniforms.radius.value},set:function(a){this.dirty=!0,this.uniforms.radius.value=a}}),Object.defineProperty(proto,"angle",{get:function(){return this.uniforms.angle.value},set:function(a){this.dirty=!0,this.uniforms.angle.value=a}}),module.exports=TwistFilter;
},{"./AbstractFilter":67}],84:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Circle(a,b,c){this.x=a||0,this.y=b||0,this.radius=c||0}var proto=Circle.prototype;proto.clone=function(){return new Circle(this.x,this.y,this.radius)},proto.contains=function(a,b){if(this.radius<=0)return!1;var c=this.x-a,d=this.y-b,e=this.radius*this.radius;return c*=c,d*=d,e>=c+d},module.exports=Circle;
},{}],85:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Ellipse(a,b,c,d){this.x=a||0,this.y=b||0,this.width=c||0,this.height=d||0}var Rectangle=require("./Rectangle"),proto=Ellipse.prototype;proto.clone=function(){return new Ellipse(this.x,this.y,this.width,this.height)},proto.contains=function(a,b){if(this.width<=0||this.height<=0)return!1;var c=(a-this.x)/this.width-.5,d=(b-this.y)/this.height-.5;return c*=c,d*=d,.25>c+d},proto.getBounds=function(){return new Rectangle(this.x,this.y,this.width,this.height)},module.exports=Ellipse;
},{"./Rectangle":88}],86:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Point(a,b){this.x=a||0,this.y=b||0}Point.prototype.clone=function(){return new Point(this.x,this.y)},module.exports=Point;
},{}],87:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Polygon(a){if(a instanceof Array||(a=Array.prototype.slice.call(arguments)),"number"==typeof a[0]){for(var b=[],c=0,d=a.length;d>c;c+=2)b.push(new Point(a[c],a[c+1]));a=b}this.points=a}var Point=require("./Point"),proto=Polygon.prototype;proto.clone=function(){for(var a=[],b=0;b<this.points.length;b++)a.push(this.points[b].clone());return new Polygon(a)},proto.contains=function(a,b){for(var c=!1,d=0,e=this.points.length-1;d<this.points.length;e=d++){var f=this.points[d].x,g=this.points[d].y,h=this.points[e].x,i=this.points[e].y,j=g>b!=i>b&&(h-f)*(b-g)/(i-g)+f>a;j&&(c=!c)}return c},module.exports=Polygon;
},{"./Point":86}],88:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Rectangle(a,b,c,d){this.x=a||0,this.y=b||0,this.width=c||0,this.height=d||0}var proto=Rectangle.prototype;proto.clone=function(){return new Rectangle(this.x,this.y,this.width,this.height)},proto.contains=function(a,b){if(this.width<=0||this.height<=0)return!1;var c=this.x;if(a>=c&&a<=c+this.width){var d=this.y;if(b>=d&&b<=d+this.height)return!0}return!1},module.exports=Rectangle;
},{}],89:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";var Matrix=exports.Matrix="undefined"!=typeof Float32Array?Float32Array:Array,mat3=exports.mat3={},mat4=exports.mat4={};mat3.create=function(){var a=new Matrix(9);return a[0]=1,a[1]=0,a[2]=0,a[3]=0,a[4]=1,a[5]=0,a[6]=0,a[7]=0,a[8]=1,a},mat3.identity=function(a){return a[0]=1,a[1]=0,a[2]=0,a[3]=0,a[4]=1,a[5]=0,a[6]=0,a[7]=0,a[8]=1,a},mat4.create=function(){var a=new Matrix(16);return a[0]=1,a[1]=0,a[2]=0,a[3]=0,a[4]=0,a[5]=1,a[6]=0,a[7]=0,a[8]=0,a[9]=0,a[10]=1,a[11]=0,a[12]=0,a[13]=0,a[14]=0,a[15]=1,a},mat3.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],f=a[2],g=a[3],h=a[4],i=a[5],j=a[6],k=a[7],l=a[8],m=b[0],n=b[1],o=b[2],p=b[3],q=b[4],r=b[5],s=b[6],t=b[7],u=b[8];return c[0]=m*d+n*g+o*j,c[1]=m*e+n*h+o*k,c[2]=m*f+n*i+o*l,c[3]=p*d+q*g+r*j,c[4]=p*e+q*h+r*k,c[5]=p*f+q*i+r*l,c[6]=s*d+t*g+u*j,c[7]=s*e+t*h+u*k,c[8]=s*f+t*i+u*l,c},mat3.clone=function(a){var b=new Matrix(9);return b[0]=a[0],b[1]=a[1],b[2]=a[2],b[3]=a[3],b[4]=a[4],b[5]=a[5],b[6]=a[6],b[7]=a[7],b[8]=a[8],b},mat3.transpose=function(a,b){if(!b||a===b){var c=a[1],d=a[2],e=a[5];return a[1]=a[3],a[2]=a[6],a[3]=c,a[5]=a[7],a[6]=d,a[7]=e,a}return b[0]=a[0],b[1]=a[3],b[2]=a[6],b[3]=a[1],b[4]=a[4],b[5]=a[7],b[6]=a[2],b[7]=a[5],b[8]=a[8],b},mat3.toMat4=function(a,b){return b||(b=mat4.create()),b[15]=1,b[14]=0,b[13]=0,b[12]=0,b[11]=0,b[10]=a[8],b[9]=a[7],b[8]=a[6],b[7]=0,b[6]=a[5],b[5]=a[4],b[4]=a[3],b[3]=0,b[2]=a[2],b[1]=a[1],b[0]=a[0],b},mat4.create=function(){var a=new Matrix(16);return a[0]=1,a[1]=0,a[2]=0,a[3]=0,a[4]=0,a[5]=1,a[6]=0,a[7]=0,a[8]=0,a[9]=0,a[10]=1,a[11]=0,a[12]=0,a[13]=0,a[14]=0,a[15]=1,a},mat4.transpose=function(a,b){if(!b||a===b){var c=a[1],d=a[2],e=a[3],f=a[6],g=a[7],h=a[11];return a[1]=a[4],a[2]=a[8],a[3]=a[12],a[4]=c,a[6]=a[9],a[7]=a[13],a[8]=d,a[9]=f,a[11]=a[14],a[12]=e,a[13]=g,a[14]=h,a}return b[0]=a[0],b[1]=a[4],b[2]=a[8],b[3]=a[12],b[4]=a[1],b[5]=a[5],b[6]=a[9],b[7]=a[13],b[8]=a[2],b[9]=a[6],b[10]=a[10],b[11]=a[14],b[12]=a[3],b[13]=a[7],b[14]=a[11],b[15]=a[15],b},mat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],f=a[2],g=a[3],h=a[4],i=a[5],j=a[6],k=a[7],l=a[8],m=a[9],n=a[10],o=a[11],p=a[12],q=a[13],r=a[14],s=a[15],t=b[0],u=b[1],v=b[2],w=b[3];return c[0]=t*d+u*h+v*l+w*p,c[1]=t*e+u*i+v*m+w*q,c[2]=t*f+u*j+v*n+w*r,c[3]=t*g+u*k+v*o+w*s,t=b[4],u=b[5],v=b[6],w=b[7],c[4]=t*d+u*h+v*l+w*p,c[5]=t*e+u*i+v*m+w*q,c[6]=t*f+u*j+v*n+w*r,c[7]=t*g+u*k+v*o+w*s,t=b[8],u=b[9],v=b[10],w=b[11],c[8]=t*d+u*h+v*l+w*p,c[9]=t*e+u*i+v*m+w*q,c[10]=t*f+u*j+v*n+w*r,c[11]=t*g+u*k+v*o+w*s,t=b[12],u=b[13],v=b[14],w=b[15],c[12]=t*d+u*h+v*l+w*p,c[13]=t*e+u*i+v*m+w*q,c[14]=t*f+u*j+v*n+w*r,c[15]=t*g+u*k+v*o+w*s,c};
},{}],90:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";var globals=require("./core/globals"),shaders=require("./renderers/webgl/shaders"),matrix=require("./geom/matrix"),pixi=module.exports=Object.create(globals);pixi.Point=require("./geom/Point"),pixi.Rectangle=require("./geom/Rectangle"),pixi.Polygon=require("./geom/Polygon"),pixi.Circle=require("./geom/Circle"),pixi.Ellipse=require("./geom/Ellipse"),pixi.Matrix=matrix.Matrix,pixi.mat3=matrix.mat3,pixi.mat4=matrix.mat4,pixi.blendModes=require("./display/blendModes"),pixi.DisplayObject=require("./display/DisplayObject"),pixi.DisplayObjectContainer=require("./display/DisplayObjectContainer"),pixi.Sprite=require("./display/Sprite"),pixi.MovieClip=require("./display/MovieClip"),pixi.AbstractFilter=require("./filters/AbstractFilter"),pixi.BlurFilter=require("./filters/BlurFilter"),pixi.BlurXFilter=require("./filters/BlurXFilter"),pixi.BlurYFilter=require("./filters/BlurYFilter"),pixi.ColorMatrixFilter=require("./filters/ColorMatrixFilter"),pixi.ColorStepFilter=require("./filters/ColorStepFilter"),pixi.CrossHatchFilter=require("./filters/CrossHatchFilter"),pixi.DisplacementFilter=require("./filters/DisplacementFilter"),pixi.DotScreenFilter=require("./filters/DotScreenFilter"),pixi.FilterBlock=require("./filters/FilterBlock"),pixi.GrayFilter=require("./filters/GrayFilter"),pixi.InvertFilter=require("./filters/InvertFilter"),pixi.PixelateFilter=require("./filters/PixelateFilter"),pixi.RGBSplitFilter=require("./filters/RGBSplitFilter"),pixi.SepiaFilter=require("./filters/SepiaFilter"),pixi.SmartBlurFilter=require("./filters/SmartBlurFilter"),pixi.TwistFilter=require("./filters/TwistFilter"),pixi.Text=require("./text/Text"),pixi.BitmapText=require("./text/BitmapText"),pixi.InteractionManager=require("./InteractionManager"),pixi.Stage=require("./display/Stage"),pixi.EventTarget=require("./events/EventTarget"),pixi.autoDetectRenderer=require("./utils/autoDetectRenderer"),pixi.PolyK=require("./utils/Polyk"),pixi.WebGLGraphics=require("./renderers/webgl/graphics"),pixi.WebGLRenderer=require("./renderers/webgl/WebGLRenderer"),pixi.WebGLBatch=require("./renderers/webgl/WebGLBatch"),pixi.WebGLRenderGroup=require("./renderers/webgl/WebGLRenderGroup"),pixi.CanvasRenderer=require("./renderers/canvas/CanvasRenderer"),pixi.CanvasGraphics=require("./renderers/canvas/graphics"),pixi.Graphics=require("./primitives/Graphics"),pixi.Strip=require("./extras/Strip"),pixi.Rope=require("./extras/Rope"),pixi.TilingSprite=require("./extras/TilingSprite"),pixi.Spine=require("./extras/Spine"),pixi.CustomRenderable=require("./extras/CustomRenderable"),pixi.BaseTexture=require("./textures/BaseTexture"),pixi.Texture=require("./textures/Texture"),pixi.RenderTexture=require("./textures/RenderTexture"),pixi.AssetLoader=require("./loaders/AssetLoader"),pixi.JsonLoader=require("./loaders/JsonLoader"),pixi.SpriteSheetLoader=require("./loaders/SpriteSheetLoader"),pixi.ImageLoader=require("./loaders/ImageLoader"),pixi.BitmapFontLoader=require("./loaders/BitmapFontLoader"),pixi.SpineLoader=require("./loaders/SpineLoader"),pixi.initDefaultShaders=shaders.initDefaultShaders,pixi.activatePrimitiveShader=shaders.activatePrimitiveShader,pixi.deactivatePrimitiveShader=shaders.deactivatePrimitiveShader,pixi.activateStripShader=shaders.activateStripShader,pixi.deactivateStripShader=shaders.deactivateStripShader;var debug=require("./utils/debug");pixi.runList=debug.runList;
},{"./InteractionManager":53,"./core/globals":54,"./display/DisplayObject":55,"./display/DisplayObjectContainer":56,"./display/MovieClip":57,"./display/Sprite":58,"./display/Stage":59,"./display/blendModes":60,"./events/EventTarget":61,"./extras/CustomRenderable":62,"./extras/Rope":63,"./extras/Spine":64,"./extras/Strip":65,"./extras/TilingSprite":66,"./filters/AbstractFilter":67,"./filters/BlurFilter":68,"./filters/BlurXFilter":69,"./filters/BlurYFilter":70,"./filters/ColorMatrixFilter":71,"./filters/ColorStepFilter":72,"./filters/CrossHatchFilter":73,"./filters/DisplacementFilter":74,"./filters/DotScreenFilter":75,"./filters/FilterBlock":76,"./filters/GrayFilter":77,"./filters/InvertFilter":78,"./filters/PixelateFilter":79,"./filters/RGBSplitFilter":80,"./filters/SepiaFilter":81,"./filters/SmartBlurFilter":82,"./filters/TwistFilter":83,"./geom/Circle":84,"./geom/Ellipse":85,"./geom/Point":86,"./geom/Polygon":87,"./geom/Rectangle":88,"./geom/matrix":89,"./loaders/AssetLoader":91,"./loaders/BitmapFontLoader":92,"./loaders/ImageLoader":93,"./loaders/JsonLoader":94,"./loaders/SpineLoader":95,"./loaders/SpriteSheetLoader":96,"./primitives/Graphics":98,"./renderers/canvas/CanvasRenderer":99,"./renderers/canvas/graphics":100,"./renderers/webgl/WebGLBatch":104,"./renderers/webgl/WebGLRenderGroup":106,"./renderers/webgl/WebGLRenderer":107,"./renderers/webgl/graphics":109,"./renderers/webgl/shaders":110,"./text/BitmapText":111,"./text/Text":112,"./textures/BaseTexture":113,"./textures/RenderTexture":114,"./textures/Texture":115,"./utils/Polyk":116,"./utils/autoDetectRenderer":117,"./utils/debug":119}],91:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function getDataType(a){var b="data:",c=a.slice(0,b.length).toLowerCase();if(c===b){var d=a.slice(b.length),e=d.indexOf(",");if(-1===e)return null;var f=d.slice(0,e).split(";")[0];return f&&"text/plain"!==f.toLowerCase()?f.split("/").pop().toLowerCase():"txt"}return null}function AssetLoader(a,b){EventTarget.call(this),this.assetURLs=a,this.crossorigin=b}var EventTarget=require("../events/EventTarget"),loadersByType={},proto=AssetLoader.prototype;proto.load=function(){function a(){b.onAssetLoaded()}var b=this;this.loadCount=this.assetURLs.length;for(var c=0,d=this.assetURLs.length;d>c;c++){var e=this.assetURLs[c],f=getDataType(e);f||(f=e.split("?").shift().split(".").pop().toLowerCase());var g=loadersByType[f];if(!g)throw new Error(f+" is an unsupported file type");var h=new g(e,this.crossorigin);h.addEventListener("loaded",a),h.load()}},proto.onAssetLoaded=function(){this.loadCount--,this.dispatchEvent({type:"onProgress",content:this}),this.onProgress&&this.onProgress(),this.loadCount||(this.dispatchEvent({type:"onComplete",content:this}),this.onComplete&&this.onComplete())},AssetLoader.registerLoaderType=function(a,b){loadersByType[a]=b},module.exports=AssetLoader;
},{"../events/EventTarget":61}],92:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function BitmapFontLoader(a,b){EventTarget.call(this),this.url=a,this.crossorigin=b,this.baseUrl=a.replace(/[^\/]*$/,""),this.texture=null}var AssetLoader=require("./AssetLoader"),ImageLoader=require("./ImageLoader"),Rectangle=require("../geom/Rectangle"),EventTarget=require("../events/EventTarget"),BitmapText=require("../text/BitmapText"),Texture=require("../textures/Texture"),platform=require("../platform"),proto=BitmapFontLoader.prototype;proto.handleEvent=function(a){switch(a.type){case"load":this.onXMLLoaded();break;default:this.onError()}},proto.load=function(){this.request=platform.createRequest(),this.request.addEventListener("load",this),this.request.addEventListener("error",this),this.request.open("GET",this.url,!0),this.request.overrideMimeType&&this.request.overrideMimeType("application/xml"),this.request.send(null)},proto.onXMLLoaded=function(){var a=this.baseUrl+this.request.responseXML.getElementsByTagName("page")[0].attributes.getNamedItem("file").nodeValue,b=new ImageLoader(a,this.crossorigin);this.texture=b.texture.baseTexture;var c={},d=this.request.responseXML.getElementsByTagName("info")[0],e=this.request.responseXML.getElementsByTagName("common")[0];c.font=d.attributes.getNamedItem("face").nodeValue,c.size=parseInt(d.attributes.getNamedItem("size").nodeValue,10),c.lineHeight=parseInt(e.attributes.getNamedItem("lineHeight").nodeValue,10),c.chars={};for(var f=this.request.responseXML.getElementsByTagName("char"),g=0;g<f.length;g++){var h=parseInt(f[g].attributes.getNamedItem("id").nodeValue,10),i=new Rectangle(parseInt(f[g].attributes.getNamedItem("x").nodeValue,10),parseInt(f[g].attributes.getNamedItem("y").nodeValue,10),parseInt(f[g].attributes.getNamedItem("width").nodeValue,10),parseInt(f[g].attributes.getNamedItem("height").nodeValue,10));c.chars[h]={xOffset:parseInt(f[g].attributes.getNamedItem("xoffset").nodeValue,10),yOffset:parseInt(f[g].attributes.getNamedItem("yoffset").nodeValue,10),xAdvance:parseInt(f[g].attributes.getNamedItem("xadvance").nodeValue,10),kerning:{},texture:Texture.cache[h]=new Texture(this.texture,i)}}var j=this.request.responseXML.getElementsByTagName("kerning");for(g=0;g<j.length;g++){var k=parseInt(j[g].attributes.getNamedItem("first").nodeValue,10),l=parseInt(j[g].attributes.getNamedItem("second").nodeValue,10),m=parseInt(j[g].attributes.getNamedItem("amount").nodeValue,10);c.chars[l].kerning[k]=m}BitmapText.fonts[c.font]=c;var n=this;b.addEventListener("loaded",function(){n.onLoaded()}),b.load()},proto.onLoaded=function(){this.loaded=!0,this.dispatchEvent({type:"loaded",content:this})},proto.onError=function(){this.dispatchEvent({type:"error",content:this})},AssetLoader.registerLoaderType("xml",BitmapFontLoader),AssetLoader.registerLoaderType("fnt",BitmapFontLoader),module.exports=BitmapFontLoader;
},{"../events/EventTarget":61,"../geom/Rectangle":88,"../platform":97,"../text/BitmapText":111,"../textures/Texture":115,"./AssetLoader":91,"./ImageLoader":93}],93:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function ImageLoader(a,b){EventTarget.call(this),this.texture=Texture.fromImage(a,b),this.frames=[]}var AssetLoader=require("./AssetLoader"),EventTarget=require("../events/EventTarget"),Texture=require("../textures/Texture"),proto=ImageLoader.prototype;proto.load=function(){if(this.texture.baseTexture.hasLoaded)this.onLoaded();else{var a=this;this.texture.baseTexture.addEventListener("loaded",function(){a.onLoaded()})}},proto.onLoaded=function(){this.dispatchEvent({type:"loaded",content:this})},proto.loadFramedSpriteSheet=function(a,b,c){this.frames=[];for(var d=Math.floor(this.texture.width/a),e=Math.floor(this.texture.height/b),f=0,g=0;e>g;g++)for(var h=0;d>h;h++,f++){var i=new Texture(this.texture,{x:h*a,y:g*b,width:a,height:b});this.frames.push(i),c&&(Texture.cache[c+"-"+f]=i)}if(this.texture.baseTexture.hasLoaded)this.onLoaded();else{var j=this;this.texture.baseTexture.addEventListener("loaded",function(){j.onLoaded()})}},AssetLoader.registerLoaderType("jpg",ImageLoader),AssetLoader.registerLoaderType("jpeg",ImageLoader),AssetLoader.registerLoaderType("png",ImageLoader),AssetLoader.registerLoaderType("gif",ImageLoader),module.exports=ImageLoader;
},{"../events/EventTarget":61,"../textures/Texture":115,"./AssetLoader":91}],94:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function JsonLoader(a,b){EventTarget.call(this),this.url=a,this.crossorigin=b,this.baseUrl=a.replace(/[^\/]*$/,""),this.loaded=!1}var AssetLoader=require("./AssetLoader"),ImageLoader=require("./ImageLoader"),EventTarget=require("../events/EventTarget"),Texture=require("../textures/Texture"),Spine=require("../extras/Spine"),SkeletonJson=require("../utils/spine").SkeletonJson,platform=require("../platform"),proto=JsonLoader.prototype;proto.handleEvent=function(a){switch(a.type){case"load":this.onJSONLoaded();break;default:this.onError()}},proto.load=function(){this.request=platform.createRequest(),this.request.addEventListener("load",this),this.request.addEventListener("error",this),this.request.open("GET",this.url,!0),this.request.overrideMimeType&&this.request.overrideMimeType("application/json"),this.request.send(null)},proto.onJSONLoaded=function(){if(this.json=JSON.parse(this.request.responseText),this.json.frames){var a=this,b=this.baseUrl+this.json.meta.image,c=new ImageLoader(b,this.crossorigin),d=this.json.frames;this.texture=c.texture.baseTexture,c.addEventListener("loaded",function(){a.onLoaded()});for(var e in d){var f=d[e].frame;f&&(Texture.cache[e]=new Texture(this.texture,{x:f.x,y:f.y,width:f.w,height:f.h}),d[e].trimmed&&(Texture.cache[e].realSize=d[e].spriteSourceSize,Texture.cache[e].trim.x=0))}c.load()}else if(this.json.bones){var g=new SkeletonJson,h=g.readSkeletonData(this.json);Spine.animCache[this.url]=h,this.onLoaded()}else this.onLoaded()},proto.onLoaded=function(){this.loaded=!0,this.dispatchEvent({type:"loaded",content:this})},proto.onError=function(){this.dispatchEvent({type:"error",content:this})},AssetLoader.registerLoaderType("json",JsonLoader),module.exports=JsonLoader;
},{"../events/EventTarget":61,"../extras/Spine":64,"../platform":97,"../textures/Texture":115,"../utils/spine":120,"./AssetLoader":91,"./ImageLoader":93}],95:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function SpineLoader(a,b){EventTarget.call(this),this.url=a,this.crossorigin=b,this.loaded=!1}var AssetLoader=require("./AssetLoader"),JsonLoader=require("./JsonLoader"),EventTarget=require("../events/EventTarget"),Spine=require("../extras/Spine"),SkeletonJson=require("../utils/spine").SkeletonJson,proto=SpineLoader.prototype;proto.load=function(){var a=this,b=new JsonLoader(this.url,this.crossorigin);b.addEventListener("loaded",function(b){a.json=b.content.json,a.onJSONLoaded()}),b.load()},proto.onJSONLoaded=function(){var a=new SkeletonJson,b=a.readSkeletonData(this.json);Spine.animCache[this.url]=b,this.onLoaded()},proto.onLoaded=function(){this.loaded=!0,this.dispatchEvent({type:"loaded",content:this})},AssetLoader.registerLoaderType("anim",SpineLoader),module.exports=SpineLoader;
},{"../events/EventTarget":61,"../extras/Spine":64,"../utils/spine":120,"./AssetLoader":91,"./JsonLoader":94}],96:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function SpriteSheetLoader(a,b){EventTarget.call(this),this.url=a,this.crossorigin=b,this.baseUrl=a.replace(/[^\/]*$/,""),this.texture=null,this.frames={}}var JsonLoader=require("./JsonLoader"),ImageLoader=require("./ImageLoader"),EventTarget=require("../events/EventTarget"),Texture=require("../textures/Texture"),proto=SpriteSheetLoader.prototype;proto.load=function(){var a=this,b=new JsonLoader(this.url,this.crossorigin);b.addEventListener("loaded",function(b){a.json=b.content.json,a.onJSONLoaded()}),b.load()},proto.onJSONLoaded=function(){var a=this,b=this.baseUrl+this.json.meta.image,c=new ImageLoader(b,this.crossorigin),d=this.json.frames;this.texture=c.texture.baseTexture,c.addEventListener("loaded",function(){a.onLoaded()});for(var e in d){var f=d[e].frame;f&&(Texture.cache[e]=new Texture(this.texture,{x:f.x,y:f.y,width:f.w,height:f.h}),d[e].trimmed&&(Texture.cache[e].realSize=d[e].spriteSourceSize,Texture.cache[e].trim.x=0))}c.load()},proto.onLoaded=function(){this.dispatchEvent({type:"loaded",content:this})},module.exports=SpriteSheetLoader;
},{"../events/EventTarget":61,"../textures/Texture":115,"./ImageLoader":93,"./JsonLoader":94}],97:[function(require,module,exports){
(function (global){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
module.exports={console:global.console,document:global.document,location:global.location,navigator:global.navigator,window:global.window,createCanvas:function(){return global.document.createElement("canvas")},createImage:function(){return new global.Image},createRequest:function(){return new global.XMLHttpRequest}};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],98:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Graphics(){DisplayObjectContainer.call(this),this.renderable=!0,this.fillAlpha=1,this.lineWidth=0,this.lineColor="black",this.graphicsData=[],this.currentPath={points:[]}}var DisplayObjectContainer=require("../display/DisplayObjectContainer"),Rectangle=require("../geom/Rectangle"),proto=Graphics.prototype=Object.create(DisplayObjectContainer.prototype,{constructor:{value:Graphics}});proto.lineStyle=function(a,b,c){this.currentPath.points.length||this.graphicsData.pop(),this.lineWidth=a||0,this.lineColor=b||0,this.lineAlpha=arguments.length<3?1:c,this.currentPath={lineWidth:this.lineWidth,lineColor:this.lineColor,lineAlpha:this.lineAlpha,fillColor:this.fillColor,fillAlpha:this.fillAlpha,fill:this.filling,points:[],type:Graphics.POLY},this.graphicsData.push(this.currentPath)},proto.moveTo=function(a,b){this.currentPath.points.length||this.graphicsData.pop(),this.currentPath=this.currentPath={lineWidth:this.lineWidth,lineColor:this.lineColor,lineAlpha:this.lineAlpha,fillColor:this.fillColor,fillAlpha:this.fillAlpha,fill:this.filling,points:[],type:Graphics.POLY},this.currentPath.points.push(a,b),this.graphicsData.push(this.currentPath)},proto.lineTo=function(a,b){this.currentPath.points.push(a,b),this.dirty=!0},proto.beginFill=function(a,b){this.filling=!0,this.fillColor=a||0,this.fillAlpha=arguments.length<2?1:b},proto.endFill=function(){this.filling=!1,this.fillColor=null,this.fillAlpha=1},proto.drawRect=function(a,b,c,d){this.currentPath.points.length||this.graphicsData.pop(),this.currentPath={lineWidth:this.lineWidth,lineColor:this.lineColor,lineAlpha:this.lineAlpha,fillColor:this.fillColor,fillAlpha:this.fillAlpha,fill:this.filling,points:[a,b,c,d],type:Graphics.RECT},this.graphicsData.push(this.currentPath),this.dirty=!0},proto.drawCircle=function(a,b,c){this.currentPath.points.length||this.graphicsData.pop(),this.currentPath={lineWidth:this.lineWidth,lineColor:this.lineColor,lineAlpha:this.lineAlpha,fillColor:this.fillColor,fillAlpha:this.fillAlpha,fill:this.filling,points:[a,b,c,c],type:Graphics.CIRC},this.graphicsData.push(this.currentPath),this.dirty=!0},proto.drawElipse=function(a,b,c,d){this.currentPath.points.length||this.graphicsData.pop(),this.currentPath={lineWidth:this.lineWidth,lineColor:this.lineColor,lineAlpha:this.lineAlpha,fillColor:this.fillColor,fillAlpha:this.fillAlpha,fill:this.filling,points:[a,b,c,d],type:Graphics.ELIP},this.graphicsData.push(this.currentPath),this.dirty=!0},proto.clear=function(){this.lineWidth=0,this.filling=!1,this.dirty=!0,this.clearDirty=!0,this.graphicsData=[],this.bounds=null},proto.updateFilterBounds=function(){if(!this.bounds){for(var a,b,c,d=1/0,e=-1/0,f=1/0,g=-1/0,h=0;h<this.graphicsData.length;h++){var i=this.graphicsData[h],j=i.type,k=i.lineWidth;if(a=i.points,j===Graphics.RECT){b=a.x-k/2,c=a.y-k/2;var l=a.width+k,m=a.height+k;d=d>b?b:d,e=b+l>e?b+l:e,f=f>c?b:f,g=c+m>g?c+m:g}else if(j===Graphics.CIRC||j===Graphics.ELIP){b=a.x,c=a.y;var n=a.radius+k/2;d=d>b-n?b-n:d,e=b+n>e?b+n:e,f=f>c-n?c-n:f,g=c+n>g?c+n:g}else for(var o=0;o<a.length;o+=2)b=a[o],c=a[o+1],d=d>b-k?b-k:d,e=b+k>e?b+k:e,f=f>c-k?c-k:f,g=c+k>g?c+k:g}this.bounds=new Rectangle(d,f,e-d,g-f)}},Graphics.POLY=0,Graphics.RECT=1,Graphics.CIRC=2,Graphics.ELIP=3,module.exports=Graphics;
},{"../display/DisplayObjectContainer":56,"../geom/Rectangle":88}],99:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function CanvasRenderer(a,b,c,d){this.transparent=d,this.width=a||800,this.height=b||600,this.view=c||platform.createCanvas(),this.context=this.view.getContext("2d"),this.smoothProperty=null,"imageSmoothingEnabled"in this.context?this.smoothProperty="imageSmoothingEnabled":"webkitImageSmoothingEnabled"in this.context?this.smoothProperty="webkitImageSmoothingEnabled":"mozImageSmoothingEnabled"in this.context?this.smoothProperty="mozImageSmoothingEnabled":"oImageSmoothingEnabled"in this.context&&(this.smoothProperty="oImageSmoothingEnabled"),this.scaleMode=null,this.refresh=!0,this.view.width=this.width,this.view.height=this.height,this.count=0}var platform=require("../../platform"),globals=require("../../core/globals"),canvasGraphics=require("./graphics"),BaseTexture=require("../../textures/BaseTexture"),Texture=require("../../textures/Texture"),Sprite=require("../../display/Sprite"),TilingSprite=require("../../extras/TilingSprite"),Strip=require("../../extras/Strip"),CustomRenderable=require("../../extras/CustomRenderable"),Graphics=require("../../primitives/Graphics"),FilterBlock=require("../../filters/FilterBlock"),proto=CanvasRenderer.prototype;proto.render=function(a){globals.texturesToUpdate=[],globals.texturesToDestroy=[],globals.visibleCount++,a.updateTransform(),this.view.style.backgroundColor===a.backgroundColorString||this.transparent||(this.view.style.backgroundColor=a.backgroundColorString),this.context.setTransform(1,0,0,1,0,0),this.context.clearRect(0,0,this.width,this.height),this.renderDisplayObject(a),a.interactive&&(a._interactiveEventsAdded||(a._interactiveEventsAdded=!0,a.interactionManager.setTarget(this))),Texture.frameUpdates.length>0&&(Texture.frameUpdates=[])},proto.resize=function(a,b){this.width=a,this.height=b,this.view.width=a,this.view.height=b},proto.renderDisplayObject=function(a){var b,c=this.context;c.globalCompositeOperation="source-over";var d=a.last._iNext;a=a.first;do if(b=a.worldTransform,a.visible)if(a.renderable){if(a instanceof Sprite){var e=a.texture.frame;e&&e.width&&e.height&&a.texture.baseTexture.source&&(c.globalAlpha=a.worldAlpha,c.setTransform(b[0],b[3],b[1],b[4],b[2],b[5]),this.smoothProperty&&this.scaleMode!==a.texture.baseTexture.scaleMode&&(this.scaleMode=a.texture.baseTexture.scaleMode,c[this.smoothProperty]=this.scaleMode===BaseTexture.SCALE_MODE.LINEAR),c.drawImage(a.texture.baseTexture.source,e.x,e.y,e.width,e.height,a.anchor.x*-e.width,a.anchor.y*-e.height,e.width,e.height))}else if(a instanceof Strip)c.setTransform(b[0],b[3],b[1],b[4],b[2],b[5]),this.renderStrip(a);else if(a instanceof TilingSprite)c.setTransform(b[0],b[3],b[1],b[4],b[2],b[5]),this.renderTilingSprite(a);else if(a instanceof CustomRenderable)c.setTransform(b[0],b[3],b[1],b[4],b[2],b[5]),a.renderCanvas(this);else if(a instanceof Graphics)c.setTransform(b[0],b[3],b[1],b[4],b[2],b[5]),canvasGraphics.renderGraphics(a,c);else if(a instanceof FilterBlock&&a.data instanceof Graphics){var f=a.data;if(a.open){c.save();var g=f.alpha,h=f.worldTransform;c.setTransform(h[0],h[3],h[1],h[4],h[2],h[5]),f.worldAlpha=.5,c.worldAlpha=0,canvasGraphics.renderGraphicsMask(f,c),c.clip(),f.worldAlpha=g}else c.restore()}a=a._iNext}else a=a._iNext;else a=a.last._iNext;while(a!==d)},proto.renderStripFlat=function(a){var b=this.context,c=a.verticies,d=c.length/2;this.count++,b.beginPath();for(var e=1;d-2>e;e++){var f=2*e,g=c[f],h=c[f+2],i=c[f+4],j=c[f+1],k=c[f+3],l=c[f+5];b.moveTo(g,j),b.lineTo(h,k),b.lineTo(i,l)}b.fillStyle="#FF0000",b.fill(),b.closePath()},proto.renderTilingSprite=function(a){var b=this.context;b.globalAlpha=a.worldAlpha,a.__tilePattern||(a.__tilePattern=b.createPattern(a.texture.baseTexture.source,"repeat")),b.beginPath();var c=a.tilePosition,d=a.tileScale;b.scale(d.x,d.y),b.translate(c.x,c.y),b.fillStyle=a.__tilePattern,b.fillRect(-c.x,-c.y,a.width/d.x,a.height/d.y),b.scale(1/d.x,1/d.y),b.translate(-c.x,-c.y),b.closePath()},proto.renderStrip=function(a){var b=this.context,c=a.verticies,d=a.uvs,e=c.length/2;this.count++;for(var f=1;e-2>f;f++){var g=2*f,h=c[g],i=c[g+2],j=c[g+4],k=c[g+1],l=c[g+3],m=c[g+5],n=d[g]*a.texture.width,o=d[g+2]*a.texture.width,p=d[g+4]*a.texture.width,q=d[g+1]*a.texture.height,r=d[g+3]*a.texture.height,s=d[g+5]*a.texture.height;b.save(),b.beginPath(),b.moveTo(h,k),b.lineTo(i,l),b.lineTo(j,m),b.closePath(),b.clip();var t=n*r+q*p+o*s-r*p-q*o-n*s,u=h*r+q*j+i*s-r*j-q*i-h*s,v=n*i+h*p+o*j-i*p-h*o-n*j,w=n*r*j+q*i*p+h*o*s-h*r*p-q*o*j-n*i*s,x=k*r+q*m+l*s-r*m-q*l-k*s,y=n*l+k*p+o*m-l*p-k*o-n*m,z=n*r*m+q*l*p+k*o*s-k*r*p-q*o*m-n*l*s;b.transform(u/t,x/t,v/t,y/t,w/t,z/t),b.drawImage(a.texture.baseTexture.source,0,0),b.restore()}},module.exports=CanvasRenderer;
},{"../../core/globals":54,"../../display/Sprite":58,"../../extras/CustomRenderable":62,"../../extras/Strip":65,"../../extras/TilingSprite":66,"../../filters/FilterBlock":76,"../../platform":97,"../../primitives/Graphics":98,"../../textures/BaseTexture":113,"../../textures/Texture":115,"./graphics":100}],100:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";var platform=require("../../platform"),Graphics=require("../../primitives/Graphics");exports.renderGraphics=function(a,b){for(var c,d,e,f,g=a.worldAlpha,h="",i=0,j=a.graphicsData.length;j>i;i++)if(c=a.graphicsData[i],d=c.points,h=b.strokeStyle="#"+("00000"+(0|c.lineColor).toString(16)).substr(-6),b.lineWidth=c.lineWidth,c.type===Graphics.POLY){for(b.beginPath(),b.moveTo(d[0],d[1]),e=1,f=d.length/2;f>e;e++)b.lineTo(d[2*e],d[2*e+1]);d[0]===d[d.length-2]&&d[1]===d[d.length-1]&&b.closePath(),c.fill&&(b.globalAlpha=c.fillAlpha*g,b.fillStyle=h="#"+("00000"+(0|c.fillColor).toString(16)).substr(-6),b.fill()),c.lineWidth&&(b.globalAlpha=c.lineAlpha*g,b.stroke())}else if(c.type===Graphics.RECT)(c.fillColor||0===c.fillColor)&&(b.globalAlpha=c.fillAlpha*g,b.fillStyle=h="#"+("00000"+(0|c.fillColor).toString(16)).substr(-6),b.fillRect(d[0],d[1],d[2],d[3])),c.lineWidth&&(b.globalAlpha=c.lineAlpha*g,b.strokeRect(d[0],d[1],d[2],d[3]));else if(c.type===Graphics.CIRC)b.beginPath(),b.arc(d[0],d[1],d[2],0,2*Math.PI),b.closePath(),c.fill&&(b.globalAlpha=c.fillAlpha*g,b.fillStyle=h="#"+("00000"+(0|c.fillColor).toString(16)).substr(-6),b.fill()),c.lineWidth&&(b.globalAlpha=c.lineAlpha*g,b.stroke());else if(c.type===Graphics.ELIP){var k=c.points,l=2*k[2],m=2*k[3],n=k[0]-l/2,o=k[1]-m/2;b.beginPath();var p=.5522848,q=l/2*p,r=m/2*p,s=n+l,t=o+m,u=n+l/2,v=o+m/2;b.moveTo(n,v),b.bezierCurveTo(n,v-r,u-q,o,u,o),b.bezierCurveTo(u+q,o,s,v-r,s,v),b.bezierCurveTo(s,v+r,u+q,t,u,t),b.bezierCurveTo(u-q,t,n,v+r,n,v),b.closePath(),c.fill&&(b.globalAlpha=c.fillAlpha*g,b.fillStyle=h="#"+("00000"+(0|c.fillColor).toString(16)).substr(-6),b.fill()),c.lineWidth&&(b.globalAlpha=c.lineAlpha*g,b.stroke())}},exports.renderGraphicsMask=function(a,b){var c=a.graphicsData.length;if(0!==c){c>1&&(c=1,platform.console.warn("Pixi.js warning: masks in canvas can only mask using the first path in the graphics object"));for(var d=0;1>d;d++){var e=a.graphicsData[d],f=e.points;if(e.type===Graphics.POLY){b.beginPath(),b.moveTo(f[0],f[1]);for(var g=1;g<f.length/2;g++)b.lineTo(f[2*g],f[2*g+1]);f[0]===f[f.length-2]&&f[1]===f[f.length-1]&&b.closePath()}else if(e.type===Graphics.RECT)b.beginPath(),b.rect(f[0],f[1],f[2],f[3]),b.closePath();else if(e.type===Graphics.CIRC)b.beginPath(),b.arc(f[0],f[1],f[2],0,2*Math.PI),b.closePath();else if(e.type===Graphics.ELIP){var h=e.points,i=2*h[2],j=2*h[3],k=h[0]-i/2,l=h[1]-j/2;b.beginPath();var m=.5522848,n=i/2*m,o=j/2*m,p=k+i,q=l+j,r=k+i/2,s=l+j/2;b.moveTo(k,s),b.bezierCurveTo(k,s-o,r-n,l,r,l),b.bezierCurveTo(r+n,l,p,s-o,p,s),b.bezierCurveTo(p,s+o,r+n,q,r,q),b.bezierCurveTo(r-n,q,k,s+o,k,s),b.closePath()}}}};
},{"../../platform":97,"../../primitives/Graphics":98}],101:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function PixiShader(){this.program=null,this.fragmentSrc=["precision lowp float;","varying vec2 vTextureCoord;","varying float vColor;","uniform sampler2D uSampler;","void main(void) {","   gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor;","}"],this.textureCount=0}var compile=require("./compile"),globals=require("../../core/globals"),proto=PixiShader.prototype;proto.init=function(){var a=globals.gl,b=compile.program(a,this.vertexSrc||PixiShader.defaultVertexSrc,this.fragmentSrc);a.useProgram(b),this.uSampler=a.getUniformLocation(b,"uSampler"),this.projectionVector=a.getUniformLocation(b,"projectionVector"),this.offsetVector=a.getUniformLocation(b,"offsetVector"),this.dimensions=a.getUniformLocation(b,"dimensions"),this.aVertexPosition=a.getAttribLocation(b,"aVertexPosition"),this.colorAttribute=a.getAttribLocation(b,"aColor"),this.aTextureCoord=a.getAttribLocation(b,"aTextureCoord");for(var c in this.uniforms)this.uniforms[c].uniformLocation=a.getUniformLocation(b,c);this.initUniforms(),this.program=b},proto.initUniforms=function(){this.textureCount=1;var a;for(var b in this.uniforms){a=this.uniforms[b];var c=a.type;"sampler2D"===c?(a._init=!1,null!==a.value&&this.initSampler2D(a)):"mat2"===c||"mat3"===c||"mat4"===c?(a.glMatrix=!0,a.glValueLength=1,"mat2"===c?a.glFunc=globals.gl.uniformMatrix2fv:"mat3"===c?a.glFunc=globals.gl.uniformMatrix3fv:"mat4"===c&&(a.glFunc=globals.gl.uniformMatrix4fv)):(a.glFunc=globals.gl["uniform"+c],a.glValueLength="2f"===c||"2i"===c?2:"3f"===c||"3i"===c?3:"4f"===c||"4i"===c?4:1)}},proto.initSampler2D=function(a){if(a.value&&a.value.baseTexture&&a.value.baseTexture.hasLoaded){if(globals.gl.activeTexture(globals.gl["TEXTURE"+this.textureCount]),globals.gl.bindTexture(globals.gl.TEXTURE_2D,a.value.baseTexture._glTexture),a.textureData){var b=a.textureData,c=b.magFilter?b.magFilter:globals.gl.LINEAR,d=b.minFilter?b.minFilter:globals.gl.LINEAR,e=b.wrapS?b.wrapS:globals.gl.CLAMP_TO_EDGE,f=b.wrapT?b.wrapT:globals.gl.CLAMP_TO_EDGE,g=b.luminance?globals.gl.LUMINANCE:globals.gl.RGBA;if(b.repeat&&(e=globals.gl.REPEAT,f=globals.gl.REPEAT),globals.gl.pixelStorei(globals.gl.UNPACK_FLIP_Y_WEBGL,!1),b.width){var h=b.width?b.width:512,i=b.height?b.height:2,j=b.border?b.border:0;globals.gl.texImage2D(globals.gl.TEXTURE_2D,0,g,h,i,j,g,globals.gl.UNSIGNED_BYTE,null)}else globals.gl.texImage2D(globals.gl.TEXTURE_2D,0,g,globals.gl.RGBA,globals.gl.UNSIGNED_BYTE,a.value.baseTexture.source);globals.gl.texParameteri(globals.gl.TEXTURE_2D,globals.gl.TEXTURE_MAG_FILTER,c),globals.gl.texParameteri(globals.gl.TEXTURE_2D,globals.gl.TEXTURE_MIN_FILTER,d),globals.gl.texParameteri(globals.gl.TEXTURE_2D,globals.gl.TEXTURE_WRAP_S,e),globals.gl.texParameteri(globals.gl.TEXTURE_2D,globals.gl.TEXTURE_WRAP_T,f)}globals.gl.uniform1i(a.uniformLocation,this.textureCount),a._init=!0,this.textureCount++}},proto.syncUniforms=function(){this.textureCount=1;var a;for(var b in this.uniforms)a=this.uniforms[b],1===a.glValueLength?a.glMatrix===!0?a.glFunc.call(globals.gl,a.uniformLocation,a.transpose,a.value):a.glFunc.call(globals.gl,a.uniformLocation,a.value):2===a.glValueLength?a.glFunc.call(globals.gl,a.uniformLocation,a.value.x,a.value.y):3===a.glValueLength?a.glFunc.call(globals.gl,a.uniformLocation,a.value.x,a.value.y,a.value.z):4===a.glValueLength?a.glFunc.call(globals.gl,a.uniformLocation,a.value.x,a.value.y,a.value.z,a.value.w):"sampler2D"===a.type&&(a._init?(globals.gl.activeTexture(globals.gl["TEXTURE"+this.textureCount]),globals.gl.bindTexture(globals.gl.TEXTURE_2D,a.value.baseTexture._glTexture),globals.gl.uniform1i(a.uniformLocation,this.textureCount),this.textureCount++):this.initSampler2D(a))},PixiShader.defaultVertexSrc=["attribute vec2 aVertexPosition;","attribute vec2 aTextureCoord;","attribute float aColor;","uniform vec2 projectionVector;","uniform vec2 offsetVector;","varying vec2 vTextureCoord;","varying float vColor;","const vec2 center = vec2(-1.0, 1.0);","void main(void) {","   gl_Position = vec4( ((aVertexPosition + offsetVector) / projectionVector) + center , 0.0, 1.0);","   vTextureCoord = aTextureCoord;","   vColor = aColor;","}"],module.exports=PixiShader;
},{"../../core/globals":54,"./compile":108}],102:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function PrimitiveShader(){this.program=null,this.fragmentSrc=["precision mediump float;","varying vec4 vColor;","void main(void) {","   gl_FragColor = vColor;","}"],this.vertexSrc=["attribute vec2 aVertexPosition;","attribute vec4 aColor;","uniform mat3 translationMatrix;","uniform vec2 projectionVector;","uniform vec2 offsetVector;","uniform float alpha;","varying vec4 vColor;","void main(void) {","   vec3 v = translationMatrix * vec3(aVertexPosition , 1.0);","   v -= offsetVector.xyx;","   gl_Position = vec4( v.x / projectionVector.x -1.0, v.y / -projectionVector.y + 1.0 , 0.0, 1.0);","   vColor = aColor  * alpha;","}"]}var compile=require("./compile"),globals=require("../../core/globals");PrimitiveShader.prototype.init=function(){var a=globals.gl,b=compile.program(a,this.vertexSrc,this.fragmentSrc);a.useProgram(b),this.projectionVector=a.getUniformLocation(b,"projectionVector"),this.offsetVector=a.getUniformLocation(b,"offsetVector"),this.aVertexPosition=a.getAttribLocation(b,"aVertexPosition"),this.colorAttribute=a.getAttribLocation(b,"aColor"),this.translationMatrix=a.getUniformLocation(b,"translationMatrix"),this.alpha=a.getUniformLocation(b,"alpha"),this.program=b},module.exports=PrimitiveShader;
},{"../../core/globals":54,"./compile":108}],103:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function StripShader(){this.program=null,this.fragmentSrc=["precision mediump float;","varying vec2 vTextureCoord;","varying float vColor;","uniform float alpha;","uniform sampler2D uSampler;","void main(void) {","   gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x, vTextureCoord.y));","   gl_FragColor = gl_FragColor * alpha;","}"],this.vertexSrc=["attribute vec2 aVertexPosition;","attribute vec2 aTextureCoord;","attribute float aColor;","uniform mat3 translationMatrix;","uniform vec2 projectionVector;","varying vec2 vTextureCoord;","varying vec2 offsetVector;","varying float vColor;","void main(void) {","   vec3 v = translationMatrix * vec3(aVertexPosition, 1.0);","   v -= offsetVector.xyx;","   gl_Position = vec4( v.x / projectionVector.x -1.0, v.y / projectionVector.y + 1.0 , 0.0, 1.0);","   vTextureCoord = aTextureCoord;","   vColor = aColor;","}"]}var compile=require("./compile"),globals=require("../../core/globals");StripShader.prototype.init=function(){var a=globals.gl,b=compile.program(a,this.vertexSrc,this.fragmentSrc);a.useProgram(b),this.uSampler=a.getUniformLocation(b,"uSampler"),this.projectionVector=a.getUniformLocation(b,"projectionVector"),this.offsetVector=a.getUniformLocation(b,"offsetVector"),this.colorAttribute=a.getAttribLocation(b,"aColor"),this.aVertexPosition=a.getAttribLocation(b,"aVertexPosition"),this.aTextureCoord=a.getAttribLocation(b,"aTextureCoord"),this.translationMatrix=a.getUniformLocation(b,"translationMatrix"),this.alpha=a.getUniformLocation(b,"alpha"),this.program=b},module.exports=StripShader;
},{"../../core/globals":54,"./compile":108}],104:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function WebGLBatch(a){this.gl=a,this.size=0,this.vertexBuffer=a.createBuffer(),this.indexBuffer=a.createBuffer(),this.uvBuffer=a.createBuffer(),this.colorBuffer=a.createBuffer(),this.blendMode=blendModes.NORMAL,this.dynamicSize=1}var globals=require("../../core/globals"),blendModes=require("../../display/blendModes"),proto=WebGLBatch.prototype;proto.clean=function(){this.verticies=[],this.uvs=[],this.indices=[],this.colors=[],this.dynamicSize=1,this.texture=null,this.last=null,this.size=0,this.head=null,this.tail=null},proto.restoreLostContext=function(a){this.gl=a,this.vertexBuffer=a.createBuffer(),this.indexBuffer=a.createBuffer(),this.uvBuffer=a.createBuffer(),this.colorBuffer=a.createBuffer()},proto.init=function(a){a.batch=this,this.dirty=!0,this.blendMode=a.blendMode,this.texture=a.texture.baseTexture,this.head=a,this.tail=a,this.size=1,this.growBatch()},proto.insertBefore=function(a,b){this.size++,a.batch=this,this.dirty=!0;var c=b.__prev;b.__prev=a,a.__next=b,c?(a.__prev=c,c.__next=a):this.head=a},proto.insertAfter=function(a,b){this.size++,a.batch=this,this.dirty=!0;var c=b.__next;b.__next=a,a.__prev=b,c?(a.__next=c,c.__prev=a):this.tail=a},proto.remove=function(a){return this.size--,this.size?(a.__prev?a.__prev.__next=a.__next:(this.head=a.__next,this.head.__prev=null),a.__next?a.__next.__prev=a.__prev:(this.tail=a.__prev,this.tail.__next=null),a.batch=null,a.__next=null,a.__prev=null,this.dirty=!0,void 0):(a.batch=null,a.__prev=null,a.__next=null,void 0)},proto.split=function(a){this.dirty=!0;var b=new WebGLBatch(this.gl);b.init(a),b.texture=this.texture,b.tail=this.tail,this.tail=a.__prev,this.tail.__next=null,a.__prev=null;for(var c=0;a;)c++,a.batch=b,a=a.__next;return b.size=c,this.size-=c,b},proto.merge=function(a){this.dirty=!0,this.tail.__next=a.head,a.head.__prev=this.tail,this.size+=a.size,this.tail=a.tail;for(var b=a.head;b;)b.batch=this,b=b.__next},proto.growBatch=function(){var a=this.gl;this.dynamicSize=1===this.size?1:1.5*this.size,this.verticies=new Float32Array(8*this.dynamicSize),a.bindBuffer(a.ARRAY_BUFFER,this.vertexBuffer),a.bufferData(a.ARRAY_BUFFER,this.verticies,a.DYNAMIC_DRAW),this.uvs=new Float32Array(8*this.dynamicSize),a.bindBuffer(a.ARRAY_BUFFER,this.uvBuffer),a.bufferData(a.ARRAY_BUFFER,this.uvs,a.DYNAMIC_DRAW),this.dirtyUVS=!0,this.colors=new Float32Array(4*this.dynamicSize),a.bindBuffer(a.ARRAY_BUFFER,this.colorBuffer),a.bufferData(a.ARRAY_BUFFER,this.colors,a.DYNAMIC_DRAW),this.dirtyColors=!0,this.indices=new Uint16Array(6*this.dynamicSize);for(var b=0,c=this.indices.length/6;c>b;b++){var d=6*b,e=4*b;this.indices[d+0]=e+0,this.indices[d+1]=e+1,this.indices[d+2]=e+2,this.indices[d+3]=e+0,this.indices[d+4]=e+2,this.indices[d+5]=e+3}a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,this.indexBuffer),a.bufferData(a.ELEMENT_ARRAY_BUFFER,this.indices,a.STATIC_DRAW)},proto.refresh=function(){this.dynamicSize<this.size&&this.growBatch();for(var a,b,c=0,d=this.head;d;){a=8*c;var e=d.texture,f=e.frame,g=e.baseTexture.width,h=e.baseTexture.height;this.uvs[a+0]=f.x/g,this.uvs[a+1]=f.y/h,this.uvs[a+2]=(f.x+f.width)/g,this.uvs[a+3]=f.y/h,this.uvs[a+4]=(f.x+f.width)/g,this.uvs[a+5]=(f.y+f.height)/h,this.uvs[a+6]=f.x/g,this.uvs[a+7]=(f.y+f.height)/h,d.updateFrame=!1,b=4*c,this.colors[b]=this.colors[b+1]=this.colors[b+2]=this.colors[b+3]=d.worldAlpha,d=d.__next,c++}this.dirtyUVS=!0,this.dirtyColors=!0},proto.update=function(){for(var a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q=0,r=this.head,s=this.verticies,t=this.uvs,u=this.colors;r;){if(r.vcount===globals.visibleCount){if(b=r.texture.frame.width,c=r.texture.frame.height,d=r.anchor.x,e=r.anchor.y,f=b*(1-d),g=b*-d,h=c*(1-e),i=c*-e,j=8*q,a=r.worldTransform,k=a[0],l=a[3],m=a[1],n=a[4],o=a[2],p=a[5],s[j+0]=k*g+m*i+o,s[j+1]=n*i+l*g+p,s[j+2]=k*f+m*i+o,s[j+3]=n*i+l*f+p,s[j+4]=k*f+m*h+o,s[j+5]=n*h+l*f+p,s[j+6]=k*g+m*h+o,s[j+7]=n*h+l*g+p,r.updateFrame||r.texture.updateFrame){this.dirtyUVS=!0;var v=r.texture,w=v.frame,x=v.baseTexture.width,y=v.baseTexture.height;t[j+0]=w.x/x,t[j+1]=w.y/y,t[j+2]=(w.x+w.width)/x,t[j+3]=w.y/y,t[j+4]=(w.x+w.width)/x,t[j+5]=(w.y+w.height)/y,t[j+6]=w.x/x,t[j+7]=(w.y+w.height)/y,r.updateFrame=!1}if(r.cacheAlpha!==r.worldAlpha){r.cacheAlpha=r.worldAlpha;var z=4*q;u[z]=u[z+1]=u[z+2]=u[z+3]=r.worldAlpha,this.dirtyColors=!0}}else j=8*q,s[j+0]=s[j+1]=s[j+2]=s[j+3]=s[j+4]=s[j+5]=s[j+6]=s[j+7]=0;q++,r=r.__next}},proto.render=function(a,b){if(a=a||0,arguments.length<2&&(b=this.size),this.dirty&&(this.refresh(),this.dirty=!1),this.size){this.update();var c=this.gl,d=globals.defaultShader;c.bindBuffer(c.ARRAY_BUFFER,this.vertexBuffer),c.bufferSubData(c.ARRAY_BUFFER,0,this.verticies),c.vertexAttribPointer(d.aVertexPosition,2,c.FLOAT,!1,0,0),c.bindBuffer(c.ARRAY_BUFFER,this.uvBuffer),this.dirtyUVS&&(this.dirtyUVS=!1,c.bufferSubData(c.ARRAY_BUFFER,0,this.uvs)),c.vertexAttribPointer(d.aTextureCoord,2,c.FLOAT,!1,0,0),c.activeTexture(c.TEXTURE0),c.bindTexture(c.TEXTURE_2D,this.texture._glTexture),c.bindBuffer(c.ARRAY_BUFFER,this.colorBuffer),this.dirtyColors&&(this.dirtyColors=!1,c.bufferSubData(c.ARRAY_BUFFER,0,this.colors)),c.vertexAttribPointer(d.colorAttribute,1,c.FLOAT,!1,0,0),c.bindBuffer(c.ELEMENT_ARRAY_BUFFER,this.indexBuffer);var e=b-a;c.drawElements(c.TRIANGLES,6*e,c.UNSIGNED_SHORT,2*a*6)}};var batches=[];WebGLBatch.restoreBatches=function(a){for(var b=0,c=batches.length;c>b;b++)batches[b].restoreLostContext(a)},WebGLBatch.getBatch=function(){return batches.length?batches.pop():new WebGLBatch(globals.gl)},WebGLBatch.returnBatch=function(a){a.clean(),batches.push(a)},module.exports=WebGLBatch;
},{"../../core/globals":54,"../../display/blendModes":60}],105:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function FilterTexture(a,b){var c=globals.gl;this.frameBuffer=c.createFramebuffer(),this.texture=c.createTexture(),c.bindTexture(c.TEXTURE_2D,this.texture),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_MAG_FILTER,c.LINEAR),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_MIN_FILTER,c.LINEAR),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_WRAP_S,c.CLAMP_TO_EDGE),c.texParameteri(c.TEXTURE_2D,c.TEXTURE_WRAP_T,c.CLAMP_TO_EDGE),c.bindFramebuffer(c.FRAMEBUFFER,this.framebuffer),c.bindFramebuffer(c.FRAMEBUFFER,this.frameBuffer),c.framebufferTexture2D(c.FRAMEBUFFER,c.COLOR_ATTACHMENT0,c.TEXTURE_2D,this.texture,0),this.resize(a,b)}function WebGLFilterManager(a){this.transparent=a,this.filterStack=[],this.texturePool=[],this.offsetX=0,this.offsetY=0,this.initShaderBuffers()}var globals=require("../../core/globals"),Sprite=require("../../display/Sprite"),Graphics=require("../../primitives/Graphics"),PixiShader=require("./PixiShader");FilterTexture.prototype.resize=function(a,b){if(this.width!==a||this.height!==b){this.width=a,this.height=b;var c=globals.gl;c.bindTexture(c.TEXTURE_2D,this.texture),c.texImage2D(c.TEXTURE_2D,0,c.RGBA,a,b,0,c.RGBA,c.UNSIGNED_BYTE,null)}};var proto=WebGLFilterManager.prototype;proto.begin=function(a,b){this.width=2*a.x,this.height=2*-a.y,this.buffer=b},proto.pushFilter=function(a){var b=globals.gl;this.filterStack.push(a);var c=a.filterPasses[0];this.offsetX+=a.target.filterArea.x,this.offsetY+=a.target.filterArea.y;var d=this.texturePool.pop();d?d.resize(this.width,this.height):d=new FilterTexture(this.width,this.height),b.bindTexture(b.TEXTURE_2D,d.texture),this.getBounds(a.target);var e=a.target.filterArea,f=c.padding;e.x-=f,e.y-=f,e.width+=2*f,e.height+=2*f,e.x<0&&(e.x=0),e.width>this.width&&(e.width=this.width),e.y<0&&(e.y=0),e.height>this.height&&(e.height=this.height),b.bindFramebuffer(b.FRAMEBUFFER,d.frameBuffer),b.viewport(0,0,e.width,e.height),globals.projection.x=e.width/2,globals.projection.y=-e.height/2,globals.offset.x=-e.x,globals.offset.y=-e.y,b.uniform2f(globals.defaultShader.projectionVector,e.width/2,-e.height/2),b.uniform2f(globals.defaultShader.offsetVector,-e.x,-e.y),b.colorMask(!0,!0,!0,!0),b.clearColor(0,0,0,0),b.clear(b.COLOR_BUFFER_BIT),a._glFilterTexture=d},proto.popFilter=function(){var a=globals.gl,b=this.filterStack.pop(),c=b.target.filterArea,d=b._glFilterTexture;if(b.filterPasses.length>1){a.viewport(0,0,c.width,c.height),a.bindBuffer(a.ARRAY_BUFFER,this.vertexBuffer),this.vertexArray[0]=0,this.vertexArray[1]=c.height,this.vertexArray[2]=c.width,this.vertexArray[3]=c.height,this.vertexArray[4]=0,this.vertexArray[5]=0,this.vertexArray[6]=c.width,this.vertexArray[7]=0,a.bufferSubData(a.ARRAY_BUFFER,0,this.vertexArray),a.bindBuffer(a.ARRAY_BUFFER,this.uvBuffer),this.uvArray[2]=c.width/this.width,this.uvArray[5]=c.height/this.height,this.uvArray[6]=c.width/this.width,this.uvArray[7]=c.height/this.height,a.bufferSubData(a.ARRAY_BUFFER,0,this.uvArray);var e=d,f=this.texturePool.pop();f||(f=new FilterTexture(this.width,this.height)),a.bindFramebuffer(a.FRAMEBUFFER,f.frameBuffer),a.clear(a.COLOR_BUFFER_BIT),a.disable(a.BLEND);for(var g=0;g<b.filterPasses.length-1;g++){var h=b.filterPasses[g];a.bindFramebuffer(a.FRAMEBUFFER,f.frameBuffer),a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,e.texture),this.applyFilterPass(h,c,c.width,c.height);var i=e;e=f,f=i}a.enable(a.BLEND),d=e,this.texturePool.push(f)}var j=b.filterPasses[b.filterPasses.length-1];this.offsetX-=c.x,this.offsetY-=c.y;var k=this.width,l=this.height,m=0,n=0,o=this.buffer;if(0===this.filterStack.length)a.colorMask(!0,!0,!0,this.transparent);else{var p=this.filterStack[this.filterStack.length-1];c=p.target.filterArea,k=c.width,l=c.height,m=c.x,n=c.y,o=p._glFilterTexture.frameBuffer}globals.projection.x=k/2,globals.projection.y=-l/2,globals.offset.x=m,globals.offset.y=n,c=b.target.filterArea;var q=c.x-m,r=c.y-n;a.bindBuffer(a.ARRAY_BUFFER,this.vertexBuffer),this.vertexArray[0]=q,this.vertexArray[1]=r+c.height,this.vertexArray[2]=q+c.width,this.vertexArray[3]=r+c.height,this.vertexArray[4]=q,this.vertexArray[5]=r,this.vertexArray[6]=q+c.width,this.vertexArray[7]=r,a.bufferSubData(a.ARRAY_BUFFER,0,this.vertexArray),a.bindBuffer(a.ARRAY_BUFFER,this.uvBuffer),this.uvArray[2]=c.width/this.width,this.uvArray[5]=c.height/this.height,this.uvArray[6]=c.width/this.width,this.uvArray[7]=c.height/this.height,a.bufferSubData(a.ARRAY_BUFFER,0,this.uvArray),a.viewport(0,0,k,l),a.bindFramebuffer(a.FRAMEBUFFER,o),a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,d.texture),this.applyFilterPass(j,c,k,l),a.useProgram(globals.defaultShader.program),a.uniform2f(globals.defaultShader.projectionVector,k/2,-l/2),a.uniform2f(globals.defaultShader.offsetVector,-m,-n),this.texturePool.push(d),b._glFilterTexture=null},proto.applyFilterPass=function(a,b,c,d){var e=globals.gl,f=a.shader;f||(f=new PixiShader,f.fragmentSrc=a.fragmentSrc,f.uniforms=a.uniforms,f.init(),a.shader=f),e.useProgram(f.program),e.uniform2f(f.projectionVector,c/2,-d/2),e.uniform2f(f.offsetVector,0,0),a.uniforms.dimensions&&(a.uniforms.dimensions.value[0]=this.width,a.uniforms.dimensions.value[1]=this.height,a.uniforms.dimensions.value[2]=this.vertexArray[0],a.uniforms.dimensions.value[3]=this.vertexArray[5]),f.syncUniforms(),e.bindBuffer(e.ARRAY_BUFFER,this.vertexBuffer),e.vertexAttribPointer(f.aVertexPosition,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ARRAY_BUFFER,this.uvBuffer),e.vertexAttribPointer(f.aTextureCoord,2,e.FLOAT,!1,0,0),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.indexBuffer),e.drawElements(e.TRIANGLES,6,e.UNSIGNED_SHORT,0)},proto.initShaderBuffers=function(){var a=globals.gl;this.vertexBuffer=a.createBuffer(),this.uvBuffer=a.createBuffer(),this.indexBuffer=a.createBuffer(),this.vertexArray=new Float32Array([0,0,1,0,0,1,1,1]),a.bindBuffer(a.ARRAY_BUFFER,this.vertexBuffer),a.bufferData(a.ARRAY_BUFFER,this.vertexArray,a.STATIC_DRAW),this.uvArray=new Float32Array([0,0,1,0,0,1,1,1]),a.bindBuffer(a.ARRAY_BUFFER,this.uvBuffer),a.bufferData(a.ARRAY_BUFFER,this.uvArray,a.STATIC_DRAW),a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,this.indexBuffer),a.bufferData(a.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,1,3,2]),a.STATIC_DRAW)},proto.getBounds=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z=a.first,A=a.last._iNext,B=-1/0,C=-1/0,D=1/0,E=1/0;do{if(z.visible)if(z instanceof Sprite)c=z.texture.frame.width,d=z.texture.frame.height,e=z.anchor.x,f=z.anchor.y,g=c*(1-e),h=c*-e,i=d*(1-f),j=d*-f,k=!0;else if(z instanceof Graphics){z.updateFilterBounds();var F=z.bounds;c=F.width,d=F.height,g=F.x,h=F.x+F.width,i=F.y,j=F.y+F.height,k=!0}k&&(b=z.worldTransform,l=b[0],m=b[3],n=b[1],o=b[4],p=b[2],q=b[5],r=l*h+n*j+p,v=o*j+m*h+q,s=l*g+n*j+p,w=o*j+m*g+q,t=l*g+n*i+p,x=o*i+m*g+q,u=l*h+n*i+p,y=o*i+m*h+q,D=D>r?r:D,D=D>s?s:D,D=D>t?t:D,D=D>u?u:D,E=E>v?v:E,E=E>w?w:E,E=E>x?x:E,E=E>y?y:E,B=r>B?r:B,B=s>B?s:B,B=t>B?t:B,B=u>B?u:B,C=v>C?v:C,C=w>C?w:C,C=x>C?x:C,C=y>C?y:C),k=!1,z=z._iNext}while(z!==A);a.filterArea.x=D,a.filterArea.y=E,a.filterArea.width=B-D,a.filterArea.height=C-E},module.exports=WebGLFilterManager;
},{"../../core/globals":54,"../../display/Sprite":58,"../../primitives/Graphics":98,"./PixiShader":101}],106:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function WebGLRenderGroup(a,b){this.gl=a,this.root=null,this.backgroundColor=void 0,this.transparent=void 0===b?!0:b,this.batchs=[],this.toRemove=[],this.filterManager=new WebGLFilterManager(this.transparent)}var globals=require("../../core/globals"),shaders=require("./shaders"),webglGraphics=require("./graphics"),WebGLBatch=require("./WebGLBatch"),WebGLFilterManager=require("./WebGLFilterManager"),mat3=require("../../geom/matrix").mat3,BaseTexture=require("../../textures/BaseTexture"),TilingSprite=require("../../extras/TilingSprite"),Strip=require("../../extras/Strip"),Graphics=require("../../primitives/Graphics"),FilterBlock=require("../../filters/FilterBlock"),Sprite=require("../../display/Sprite"),CustomRenderable=require("../../extras/CustomRenderable"),proto=WebGLRenderGroup.prototype;proto.setRenderable=function(a){this.root&&this.removeDisplayObjectAndChildren(this.root),a.worldVisible=a.visible,this.root=a,this.addDisplayObjectAndChildren(a)},proto.render=function(a,b){var c=this.gl;WebGLRenderGroup.updateTextures(c),c.uniform2f(globals.defaultShader.projectionVector,a.x,a.y),this.filterManager.begin(a,b),c.blendFunc(c.ONE,c.ONE_MINUS_SRC_ALPHA);for(var d,e=0;e<this.batchs.length;e++)d=this.batchs[e],d instanceof WebGLBatch?this.batchs[e].render():this.renderSpecial(d,a)},proto.handleFilter=function(){},proto.renderSpecific=function(a,b,c){var d=this.gl;WebGLRenderGroup.updateTextures(d),d.uniform2f(globals.defaultShader.projectionVector,b.x,b.y),this.filterManager.begin(b,c);for(var e,f,g,h,i,j,k=a.first;k._iNext&&(!k.renderable||!k.__renderGroup);)k=k._iNext;var l=k.batch;if(k instanceof Sprite)if(l=k.batch,j=l.head,j===k)e=0;else for(e=1;j.__next!==k;)e++,j=j.__next;else l=k;for(var m=a.last;m._iPrev&&(!m.renderable||!m.__renderGroup);)m=m._iNext;if(m instanceof Sprite)if(i=m.batch,j=i.head,j===m)g=0;else for(g=1;j.__next!==m;)g++,j=j.__next;else i=m;if(l===i)return l instanceof WebGLBatch?l.render(e,g+1):this.renderSpecial(l,b),void 0;f=this.batchs.indexOf(l),h=this.batchs.indexOf(i),l instanceof WebGLBatch?l.render(e):this.renderSpecial(l,b);for(var n,o=f+1;h>o;o++)n=this.batchs[o],n instanceof WebGLBatch?this.batchs[o].render():this.renderSpecial(n,b);i instanceof WebGLBatch?i.render(0,g+1):this.renderSpecial(i,b)},proto.renderSpecial=function(a,b){var c=a.vcount===globals.visibleCount;a instanceof TilingSprite?c&&this.renderTilingSprite(a,b):a instanceof Strip?c&&this.renderStrip(a,b):a instanceof CustomRenderable?c&&a.renderWebGL(this,b):a instanceof Graphics?c&&a.renderable&&webglGraphics.renderGraphics(a,b):a instanceof FilterBlock&&this.handleFilterBlock(a,b)};var maskStack=[];proto.handleFilterBlock=function(a,b){var c=globals.gl;if(a.open)a.data instanceof Array?this.filterManager.pushFilter(a):(maskStack.push(a),c.enable(c.STENCIL_TEST),c.colorMask(!1,!1,!1,!1),c.stencilFunc(c.ALWAYS,1,1),c.stencilOp(c.KEEP,c.KEEP,c.INCR),webglGraphics.renderGraphics(a.data,b),c.colorMask(!0,!0,!0,!0),c.stencilFunc(c.NOTEQUAL,0,maskStack.length),c.stencilOp(c.KEEP,c.KEEP,c.KEEP));else if(a.data instanceof Array)this.filterManager.popFilter();else{var d=maskStack.pop(a);d&&(c.colorMask(!1,!1,!1,!1),c.stencilFunc(c.ALWAYS,1,1),c.stencilOp(c.KEEP,c.KEEP,c.DECR),webglGraphics.renderGraphics(d.data,b),c.colorMask(!0,!0,!0,!0),c.stencilFunc(c.NOTEQUAL,0,maskStack.length),c.stencilOp(c.KEEP,c.KEEP,c.KEEP)),c.disable(c.STENCIL_TEST)}},proto.updateTexture=function(a){this.removeObject(a);for(var b=a.first;b!==this.root&&(b=b._iPrev,!b.renderable||!b.__renderGroup););for(var c=a.last;c._iNext&&(c=c._iNext,!c.renderable||!c.__renderGroup););this.insertObject(a,b,c)},proto.addFilterBlocks=function(a,b){a.__renderGroup=this,b.__renderGroup=this;for(var c=a;c!==this.root.first&&(c=c._iPrev,!c.renderable||!c.__renderGroup););this.insertAfter(a,c);for(var d=b;d!==this.root.first&&(d=d._iPrev,!d.renderable||!d.__renderGroup););this.insertAfter(b,d)},proto.removeFilterBlocks=function(a,b){this.removeObject(a),this.removeObject(b)},proto.addDisplayObjectAndChildren=function(a){a.__renderGroup&&a.__renderGroup.removeDisplayObjectAndChildren(a);for(var b=a.first;b!==this.root.first&&(b=b._iPrev,!b.renderable||!b.__renderGroup););for(var c=a.last;c._iNext&&(c=c._iNext,!c.renderable||!c.__renderGroup););var d=a.first,e=a.last._iNext;do d.__renderGroup=this,d.renderable&&(this.insertObject(d,b,c),b=d),d=d._iNext;while(d!==e)},proto.removeDisplayObjectAndChildren=function(a){if(a.__renderGroup===this)do a.__renderGroup=null,a.renderable&&this.removeObject(a),a=a._iNext;while(a)},proto.insertObject=function(a,b,c){var d,e,f=b,g=c;if(a instanceof Sprite){var h,i;if(f instanceof Sprite){if(h=f.batch,h&&h.texture===a.texture.baseTexture&&h.blendMode===a.blendMode)return h.insertAfter(a,f),void 0}else h=f;if(g)if(g instanceof Sprite){if(i=g.batch){if(i.texture===a.texture.baseTexture&&i.blendMode===a.blendMode)return i.insertBefore(a,g),void 0;if(i===h){var j=h.split(g);return d=WebGLBatch.getBatch(),e=this.batchs.indexOf(h),d.init(a),this.batchs.splice(e+1,0,d,j),void 0}}}else i=g;return d=WebGLBatch.getBatch(),d.init(a),h?(e=this.batchs.indexOf(h),this.batchs.splice(e+1,0,d)):this.batchs.push(d),void 0}a instanceof TilingSprite?this.initTilingSprite(a):a instanceof Strip&&this.initStrip(a),this.insertAfter(a,f)},proto.insertAfter=function(a,b){var c,d,e;b instanceof Sprite?(c=b.batch,c?c.tail===b?(e=this.batchs.indexOf(c),this.batchs.splice(e+1,0,a)):(d=c.split(b.__next),e=this.batchs.indexOf(c),this.batchs.splice(e+1,0,a,d)):this.batchs.push(a)):(e=this.batchs.indexOf(b),this.batchs.splice(e+1,0,a))},proto.removeObject=function(a){var b,c;if(a instanceof Sprite){var d=a.batch;if(!d)return;d.remove(a),d.size||(b=d)}else b=a;if(b){if(c=this.batchs.indexOf(b),-1===c)return;if(0===c||c===this.batchs.length-1)return this.batchs.splice(c,1),b instanceof WebGLBatch&&WebGLBatch.returnBatch(b),void 0;if(this.batchs[c-1]instanceof WebGLBatch&&this.batchs[c+1]instanceof WebGLBatch&&this.batchs[c-1].texture===this.batchs[c+1].texture&&this.batchs[c-1].blendMode===this.batchs[c+1].blendMode)return this.batchs[c-1].merge(this.batchs[c+1]),b instanceof WebGLBatch&&WebGLBatch.returnBatch(b),WebGLBatch.returnBatch(this.batchs[c+1]),this.batchs.splice(c,2),void 0;this.batchs.splice(c,1),b instanceof WebGLBatch&&WebGLBatch.returnBatch(b)}},proto.initTilingSprite=function(a){var b=this.gl;a.verticies=new Float32Array([0,0,a.width,0,a.width,a.height,0,a.height]),a.uvs=new Float32Array([0,0,1,0,1,1,0,1]),a.colors=new Float32Array([1,1,1,1]),a.indices=new Uint16Array([0,1,3,2]),a._vertexBuffer=b.createBuffer(),a._indexBuffer=b.createBuffer(),a._uvBuffer=b.createBuffer(),a._colorBuffer=b.createBuffer(),b.bindBuffer(b.ARRAY_BUFFER,a._vertexBuffer),b.bufferData(b.ARRAY_BUFFER,a.verticies,b.STATIC_DRAW),b.bindBuffer(b.ARRAY_BUFFER,a._uvBuffer),b.bufferData(b.ARRAY_BUFFER,a.uvs,b.DYNAMIC_DRAW),b.bindBuffer(b.ARRAY_BUFFER,a._colorBuffer),b.bufferData(b.ARRAY_BUFFER,a.colors,b.STATIC_DRAW),b.bindBuffer(b.ELEMENT_ARRAY_BUFFER,a._indexBuffer),b.bufferData(b.ELEMENT_ARRAY_BUFFER,a.indices,b.STATIC_DRAW),a.texture.baseTexture._glTexture?(b.bindTexture(b.TEXTURE_2D,a.texture.baseTexture._glTexture),b.texParameteri(b.TEXTURE_2D,b.TEXTURE_WRAP_S,b.REPEAT),b.texParameteri(b.TEXTURE_2D,b.TEXTURE_WRAP_T,b.REPEAT),a.texture.baseTexture._powerOf2=!0):a.texture.baseTexture._powerOf2=!0},proto.renderStrip=function(a,b){var c=this.gl;shaders.activateStripShader();var d=globals.stripShader,e=mat3.clone(a.worldTransform);mat3.transpose(e),c.uniformMatrix3fv(d.translationMatrix,!1,e),c.uniform2f(d.projectionVector,b.x,b.y),c.uniform2f(d.offsetVector,-globals.offset.x,-globals.offset.y),c.uniform1f(d.alpha,a.worldAlpha),a.dirty?(a.dirty=!1,c.bindBuffer(c.ARRAY_BUFFER,a._vertexBuffer),c.bufferData(c.ARRAY_BUFFER,a.verticies,c.STATIC_DRAW),c.vertexAttribPointer(d.aVertexPosition,2,c.FLOAT,!1,0,0),c.bindBuffer(c.ARRAY_BUFFER,a._uvBuffer),c.bufferData(c.ARRAY_BUFFER,a.uvs,c.STATIC_DRAW),c.vertexAttribPointer(d.aTextureCoord,2,c.FLOAT,!1,0,0),c.activeTexture(c.TEXTURE0),c.bindTexture(c.TEXTURE_2D,a.texture.baseTexture._glTexture),c.bindBuffer(c.ARRAY_BUFFER,a._colorBuffer),c.bufferData(c.ARRAY_BUFFER,a.colors,c.STATIC_DRAW),c.vertexAttribPointer(d.colorAttribute,1,c.FLOAT,!1,0,0),c.bindBuffer(c.ELEMENT_ARRAY_BUFFER,a._indexBuffer),c.bufferData(c.ELEMENT_ARRAY_BUFFER,a.indices,c.STATIC_DRAW)):(c.bindBuffer(c.ARRAY_BUFFER,a._vertexBuffer),c.bufferSubData(c.ARRAY_BUFFER,0,a.verticies),c.vertexAttribPointer(d.aVertexPosition,2,c.FLOAT,!1,0,0),c.bindBuffer(c.ARRAY_BUFFER,a._uvBuffer),c.vertexAttribPointer(d.aTextureCoord,2,c.FLOAT,!1,0,0),c.activeTexture(c.TEXTURE0),c.bindTexture(c.TEXTURE_2D,a.texture.baseTexture._glTexture),c.bindBuffer(c.ARRAY_BUFFER,a._colorBuffer),c.vertexAttribPointer(d.colorAttribute,1,c.FLOAT,!1,0,0),c.bindBuffer(c.ELEMENT_ARRAY_BUFFER,a._indexBuffer)),c.drawElements(c.TRIANGLE_STRIP,a.indices.length,c.UNSIGNED_SHORT,0),shaders.deactivateStripShader()},proto.renderTilingSprite=function(a,b){var c=this.gl,d=a.tilePosition,e=a.tileScale,f=d.x/a.texture.baseTexture.width,g=d.y/a.texture.baseTexture.height,h=a.width/a.texture.baseTexture.width/e.x,i=a.height/a.texture.baseTexture.height/e.y;a.uvs[0]=0-f,a.uvs[1]=0-g,a.uvs[2]=1*h-f,a.uvs[3]=0-g,a.uvs[4]=1*h-f,a.uvs[5]=1*i-g,a.uvs[6]=0-f,a.uvs[7]=1*i-g,c.bindBuffer(c.ARRAY_BUFFER,a._uvBuffer),c.bufferSubData(c.ARRAY_BUFFER,0,a.uvs),this.renderStrip(a,b)},proto.initStrip=function(a){var b=this.gl;a._vertexBuffer=b.createBuffer(),a._indexBuffer=b.createBuffer(),a._uvBuffer=b.createBuffer(),a._colorBuffer=b.createBuffer(),b.bindBuffer(b.ARRAY_BUFFER,a._vertexBuffer),b.bufferData(b.ARRAY_BUFFER,a.verticies,b.DYNAMIC_DRAW),b.bindBuffer(b.ARRAY_BUFFER,a._uvBuffer),b.bufferData(b.ARRAY_BUFFER,a.uvs,b.STATIC_DRAW),b.bindBuffer(b.ARRAY_BUFFER,a._colorBuffer),b.bufferData(b.ARRAY_BUFFER,a.colors,b.STATIC_DRAW),b.bindBuffer(b.ELEMENT_ARRAY_BUFFER,a._indexBuffer),b.bufferData(b.ELEMENT_ARRAY_BUFFER,a.indices,b.STATIC_DRAW)},WebGLRenderGroup.updateTexture=function(a,b){b._glTexture||(b._glTexture=a.createTexture()),b.hasLoaded&&(a.bindTexture(a.TEXTURE_2D,b._glTexture),a.pixelStorei(a.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!0),a.texImage2D(a.TEXTURE_2D,0,a.RGBA,a.RGBA,a.UNSIGNED_BYTE,b.source),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,b.scaleMode===BaseTexture.SCALE_MODE.LINEAR?a.LINEAR:a.NEAREST),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,b.scaleMode===BaseTexture.SCALE_MODE.LINEAR?a.LINEAR:a.NEAREST),b._powerOf2?(a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.REPEAT),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.REPEAT)):(a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE)),a.bindTexture(a.TEXTURE_2D,null))},WebGLRenderGroup.destroyTexture=function(a,b){b._glTexture&&(b._glTexture=a.createTexture(),a.deleteTexture(a.TEXTURE_2D,b._glTexture))},WebGLRenderGroup.updateTextures=function(a){for(var b=0,c=globals.texturesToUpdate.length;c>b;b++)WebGLRenderGroup.updateTexture(a,globals.texturesToUpdate[b]);for(b=0,c=globals.texturesToDestroy.length;c>b;b++)WebGLRenderGroup.destroyTexture(a,globals.texturesToDestroy[b]);globals.texturesToUpdate=[],globals.texturesToDestroy=[]},module.exports=WebGLRenderGroup;
},{"../../core/globals":54,"../../display/Sprite":58,"../../extras/CustomRenderable":62,"../../extras/Strip":65,"../../extras/TilingSprite":66,"../../filters/FilterBlock":76,"../../geom/matrix":89,"../../primitives/Graphics":98,"../../textures/BaseTexture":113,"./WebGLBatch":104,"./WebGLFilterManager":105,"./graphics":109,"./shaders":110}],107:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function WebGLRenderer(a,b,c,d,e){var f;this.transparent=!!d,this.width=a||800,this.height=b||600,this.view=c||platform.createCanvas(),this.view.width=this.width,this.view.height=this.height;var g=this;this.view.addEventListener("webglcontextlost",function(a){g.handleContextLost(a)},!1),this.view.addEventListener("webglcontextrestored",function(a){g.handleContextRestored(a)},!1),this.batchs=[];var h={alpha:this.transparent,antialias:!!e,premultipliedAlpha:!1,stencil:!0};try{f=this.view.getContext("experimental-webgl",h)}catch(i){try{f=this.view.getContext("webgl",h)}catch(j){throw new Error(" This browser does not support webGL. Try using the canvas renderer"+this)}}this.gl=globals.gl=f,shaders.initDefaultShaders(),f.useProgram(globals.defaultShader.program),this.batch=new WebGLBatch(f),f.disable(f.DEPTH_TEST),f.disable(f.CULL_FACE),f.enable(f.BLEND),f.colorMask(!0,!0,!0,this.transparent),this.projection=globals.projection=new Point(400,300),this.offset=globals.offset=new Point(0,0),this.resize(this.width,this.height),this.contextLost=!1,this.stageRenderGroup=new WebGLRenderGroup(this.gl,this.transparent)}var platform=require("../../platform"),globals=require("../../core/globals"),shaders=require("./shaders"),WebGLBatch=require("./WebGLBatch"),WebGLRenderGroup=require("./WebGLRenderGroup"),Point=require("../../geom/Point"),Texture=require("../../textures/Texture"),proto=WebGLRenderer.prototype;proto.render=function(a){if(!this.contextLost){this.__stage!==a&&(this.__stage=a,this.stageRenderGroup.setRenderable(a));var b=this.gl;if(WebGLRenderGroup.updateTextures(b),globals.visibleCount++,a.updateTransform(),b.colorMask(!0,!0,!0,this.transparent),b.viewport(0,0,this.width,this.height),b.bindFramebuffer(b.FRAMEBUFFER,null),b.clearColor(a.backgroundColorSplit[0],a.backgroundColorSplit[1],a.backgroundColorSplit[2],!this.transparent),b.clear(b.COLOR_BUFFER_BIT),this.stageRenderGroup.backgroundColor=a.backgroundColorSplit,this.projection.x=this.width/2,this.projection.y=-this.height/2,this.stageRenderGroup.render(this.projection),a.interactive&&(a._interactiveEventsAdded||(a._interactiveEventsAdded=!0,a.interactionManager.setTarget(this))),Texture.frameUpdates.length>0){for(var c=0,d=Texture.frameUpdates.length;d>c;c++)Texture.frameUpdates[c].updateFrame=!1;Texture.frameUpdates=[]}}},proto.resize=function(a,b){this.width=a,this.height=b,this.view.width=a,this.view.height=b,this.gl.viewport(0,0,this.width,this.height),this.projection.x=this.width/2,this.projection.y=-this.height/2},proto.handleContextLost=function(a){a.preventDefault(),this.contextLost=!0},proto.handleContextRestored=function(){var a=this.gl=this.view.getContext("experimental-webgl",{alpha:!0});this.initShaders();for(var b in Texture.cache){var c=Texture.cache[b].baseTexture;c._glTexture=null,WebGLRenderGroup.updateTexture(a,c)}for(var d=0,e=this.batchs.length;e>d;d++)this.batchs[d].restoreLostContext(a),this.batchs[d].dirty=!0;WebGLBatch.restoreBatches(a),this.contextLost=!1},module.exports=WebGLRenderer;
},{"../../core/globals":54,"../../geom/Point":86,"../../platform":97,"../../textures/Texture":115,"./WebGLBatch":104,"./WebGLRenderGroup":106,"./shaders":110}],108:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";var platform=require("../../platform");exports.shader=function(a,b,c){var d=b.join("\n"),e=a.createShader(c);return a.shaderSource(e,d),a.compileShader(e),a.getShaderParameter(e,a.COMPILE_STATUS)?e:(platform.console&&platform.console.error(a.getShaderInfoLog(e)),null)},exports.program=function(a,b,c){var d=exports.shader(a,c,a.FRAGMENT_SHADER),e=exports.shader(a,b,a.VERTEX_SHADER),f=a.createProgram();return a.attachShader(f,e),a.attachShader(f,d),a.linkProgram(f),a.getProgramParameter(f,a.LINK_STATUS)?f:(platform.console&&platform.console.error("Could not initialise shaders"),null)};
},{"../../platform":97}],109:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";var shaders=require("./shaders"),globals=require("../../core/globals"),mat3=require("../../geom/matrix").mat3,hex2rgb=require("../../utils/color").hex2rgb,triangulate=require("../../utils/Polyk").triangulate,Point=require("../../geom/Point"),Graphics=require("../../primitives/Graphics");exports.renderGraphics=function(a,b){var c=globals.gl;a._webGL||(a._webGL={points:[],indices:[],lastIndex:0,buffer:c.createBuffer(),indexBuffer:c.createBuffer()}),a.dirty&&(a.dirty=!1,a.clearDirty&&(a.clearDirty=!1,a._webGL.lastIndex=0,a._webGL.points=[],a._webGL.indices=[]),exports.updateGraphics(a)),shaders.activatePrimitiveShader();var d=mat3.clone(a.worldTransform);mat3.transpose(d),c.blendFunc(c.ONE,c.ONE_MINUS_SRC_ALPHA),c.uniformMatrix3fv(globals.primitiveShader.translationMatrix,!1,d),c.uniform2f(globals.primitiveShader.projectionVector,b.x,-b.y),c.uniform2f(globals.primitiveShader.offsetVector,-globals.offset.x,-globals.offset.y),c.uniform1f(globals.primitiveShader.alpha,a.worldAlpha),c.bindBuffer(c.ARRAY_BUFFER,a._webGL.buffer),c.vertexAttribPointer(globals.primitiveShader.aVertexPosition,2,c.FLOAT,!1,24,0),c.vertexAttribPointer(globals.primitiveShader.colorAttribute,4,c.FLOAT,!1,24,8),c.bindBuffer(c.ELEMENT_ARRAY_BUFFER,a._webGL.indexBuffer),c.drawElements(c.TRIANGLE_STRIP,a._webGL.indices.length,c.UNSIGNED_SHORT,0),shaders.deactivatePrimitiveShader()},exports.updateGraphics=function(a){for(var b=a._webGL.lastIndex;b<a.graphicsData.length;b++){var c=a.graphicsData[b];c.type===Graphics.POLY?(c.fill&&c.points.length>3&&exports.buildPoly(c,a._webGL),c.lineWidth>0&&exports.buildLine(c,a._webGL)):c.type===Graphics.RECT?exports.buildRectangle(c,a._webGL):c.type===Graphics.CIRC||c.type===Graphics.ELIP,exports.buildCircle(c,a._webGL)}a._webGL.lastIndex=a.graphicsData.length;var d=globals.gl;a._webGL.glPoints=new Float32Array(a._webGL.points),d.bindBuffer(d.ARRAY_BUFFER,a._webGL.buffer),d.bufferData(d.ARRAY_BUFFER,a._webGL.glPoints,d.STATIC_DRAW),a._webGL.glIndicies=new Uint16Array(a._webGL.indices),d.bindBuffer(d.ELEMENT_ARRAY_BUFFER,a._webGL.indexBuffer),d.bufferData(d.ELEMENT_ARRAY_BUFFER,a._webGL.glIndicies,d.STATIC_DRAW)},exports.buildRectangle=function(a,b){var c=a.points,d=c[0],e=c[1],f=c[2],g=c[3];if(a.fill){var h=hex2rgb(a.fillColor),i=a.fillAlpha,j=h[0]*i,k=h[1]*i,l=h[2]*i,m=b.points,n=b.indices,o=m.length/6;m.push(d,e),m.push(j,k,l,i),m.push(d+f,e),m.push(j,k,l,i),m.push(d,e+g),m.push(j,k,l,i),m.push(d+f,e+g),m.push(j,k,l,i),n.push(o,o,o+1,o+2,o+3,o+3)}a.lineWidth&&(a.points=[d,e,d+f,e,d+f,e+g,d,e+g,d,e],exports.buildLine(a,b))},exports.buildCircle=function(a,b){var c=a.points,d=c[0],e=c[1],f=c[2],g=c[3],h=40,i=2*Math.PI/h,j=0;if(a.fill){var k=hex2rgb(a.fillColor),l=a.fillAlpha,m=k[0]*l,n=k[1]*l,o=k[2]*l,p=b.points,q=b.indices,r=p.length/6;for(q.push(r),j=0;h+1>j;j++)p.push(d,e,m,n,o,l),p.push(d+Math.sin(i*j)*f,e+Math.cos(i*j)*g,m,n,o,l),q.push(r++,r++);q.push(r-1)}if(a.lineWidth){for(a.points=[],j=0;h+1>j;j++)a.points.push(d+Math.sin(i*j)*f,e+Math.cos(i*j)*g);exports.buildLine(a,b)}},exports.buildLine=function(a,b){var c=0,d=a.points;if(0!==d.length){if(a.lineWidth%2)for(c=0;c<d.length;c++)d[c]+=.5;var e=new Point(d[0],d[1]),f=new Point(d[d.length-2],d[d.length-1]);if(e.x===f.x&&e.y===f.y){d.pop(),d.pop(),f=new Point(d[d.length-2],d[d.length-1]);var g=f.x+.5*(e.x-f.x),h=f.y+.5*(e.y-f.y);d.unshift(g,h),d.push(g,h)}var i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F=b.points,G=b.indices,H=d.length/2,I=d.length,J=F.length/6,K=a.lineWidth/2,L=hex2rgb(a.lineColor),M=a.lineAlpha,N=L[0]*M,O=L[1]*M,P=L[2]*M;for(k=d[0],l=d[1],m=d[2],n=d[3],q=-(l-n),r=k-m,E=Math.sqrt(q*q+r*r),q/=E,r/=E,q*=K,r*=K,F.push(k-q,l-r,N,O,P,M),F.push(k+q,l+r,N,O,P,M),c=1;H-1>c;c++)k=d[2*(c-1)],l=d[2*(c-1)+1],m=d[2*c],n=d[2*c+1],o=d[2*(c+1)],p=d[2*(c+1)+1],q=-(l-n),r=k-m,E=Math.sqrt(q*q+r*r),q/=E,r/=E,q*=K,r*=K,s=-(n-p),t=m-o,E=Math.sqrt(s*s+t*t),s/=E,t/=E,s*=K,t*=K,w=-r+l-(-r+n),x=-q+m-(-q+k),y=(-q+k)*(-r+n)-(-q+m)*(-r+l),z=-t+p-(-t+n),A=-s+m-(-s+o),B=(-s+o)*(-t+n)-(-s+m)*(-t+p),C=w*A-z*x,Math.abs(C)<.1?(C+=10.1,F.push(m-q,n-r,N,O,P,M),F.push(m+q,n+r,N,O,P,M)):(i=(x*B-A*y)/C,j=(z*y-w*B)/C,D=(i-m)*(i-m)+(j-n)+(j-n),D>19600?(u=q-s,v=r-t,E=Math.sqrt(u*u+v*v),u/=E,v/=E,u*=K,v*=K,F.push(m-u,n-v),F.push(N,O,P,M),F.push(m+u,n+v),F.push(N,O,P,M),F.push(m-u,n-v),F.push(N,O,P,M),I++):(F.push(i,j),F.push(N,O,P,M),F.push(m-(i-m),n-(j-n)),F.push(N,O,P,M)));for(k=d[2*(H-2)],l=d[2*(H-2)+1],m=d[2*(H-1)],n=d[2*(H-1)+1],q=-(l-n),r=k-m,E=Math.sqrt(q*q+r*r),q/=E,r/=E,q*=K,r*=K,F.push(m-q,n-r),F.push(N,O,P,M),F.push(m+q,n+r),F.push(N,O,P,M),G.push(J),c=0;I>c;c++)G.push(J++);G.push(J-1)}},exports.buildPoly=function(a,b){var c=a.points;if(!(c.length<6)){var d=b.points,e=b.indices,f=c.length/2,g=hex2rgb(a.fillColor),h=a.fillAlpha,i=g[0]*h,j=g[1]*h,k=g[2]*h,l=triangulate(c),m=d.length/6,n=0;for(n=0;n<l.length;n+=3)e.push(l[n]+m),e.push(l[n]+m),e.push(l[n+1]+m),e.push(l[n+2]+m),e.push(l[n+2]+m);for(n=0;f>n;n++)d.push(c[2*n],c[2*n+1],i,j,k,h)}};
},{"../../core/globals":54,"../../geom/Point":86,"../../geom/matrix":89,"../../primitives/Graphics":98,"../../utils/Polyk":116,"../../utils/color":118,"./shaders":110}],110:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";var globals=require("../../core/globals"),PrimitiveShader=require("./PrimitiveShader"),StripShader=require("./StripShader"),PixiShader=require("./PixiShader");exports.initDefaultShaders=function(){globals.primitiveShader=new PrimitiveShader,globals.primitiveShader.init(),globals.stripShader=new StripShader,globals.stripShader.init(),globals.defaultShader=new PixiShader,globals.defaultShader.init();var a=globals.gl,b=globals.defaultShader.program;a.useProgram(b),a.enableVertexAttribArray(globals.defaultShader.aVertexPosition),a.enableVertexAttribArray(globals.defaultShader.colorAttribute),a.enableVertexAttribArray(globals.defaultShader.aTextureCoord)},exports.activatePrimitiveShader=function(){var a=globals.gl;a.useProgram(globals.primitiveShader.program),a.disableVertexAttribArray(globals.defaultShader.aVertexPosition),a.disableVertexAttribArray(globals.defaultShader.colorAttribute),a.disableVertexAttribArray(globals.defaultShader.aTextureCoord),a.enableVertexAttribArray(globals.primitiveShader.aVertexPosition),a.enableVertexAttribArray(globals.primitiveShader.colorAttribute)},exports.deactivatePrimitiveShader=function(){var a=globals.gl;a.useProgram(globals.defaultShader.program),a.disableVertexAttribArray(globals.primitiveShader.aVertexPosition),a.disableVertexAttribArray(globals.primitiveShader.colorAttribute),a.enableVertexAttribArray(globals.defaultShader.aVertexPosition),a.enableVertexAttribArray(globals.defaultShader.colorAttribute),a.enableVertexAttribArray(globals.defaultShader.aTextureCoord)},exports.activateStripShader=function(){var a=globals.gl;a.useProgram(globals.stripShader.program)},exports.deactivateStripShader=function(){var a=globals.gl;a.useProgram(globals.defaultShader.program)};
},{"../../core/globals":54,"./PixiShader":101,"./PrimitiveShader":102,"./StripShader":103}],111:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function BitmapText(a,b){DisplayObjectContainer.call(this),this.setText(a),this.setStyle(b),this.updateText(),this.dirty=!1}var DisplayObjectContainer=require("../display/DisplayObjectContainer"),Sprite=require("../display/Sprite"),Point=require("../geom/Point"),proto=BitmapText.prototype=Object.create(DisplayObjectContainer.prototype,{constructor:{value:BitmapText}});proto.setText=function(a){this.text=a||" ",this.dirty=!0},proto.setStyle=function(a){a=a||{},a.align=a.align||"left",this.style=a;var b=a.font.split(" ");this.fontName=b[b.length-1],this.fontSize=b.length>=2?parseInt(b[b.length-2],10):BitmapText.fonts[this.fontName].size,this.dirty=!0},proto.updateText=function(){for(var a=BitmapText.fonts[this.fontName],b=new Point,c=null,d=[],e=0,f=[],g=0,h=this.fontSize/a.size,i=0;i<this.text.length;i++){var j=this.text.charCodeAt(i);if(/(?:\r\n|\r|\n)/.test(this.text.charAt(i)))f.push(b.x),e=Math.max(e,b.x),g++,b.x=0,b.y+=a.lineHeight,c=null;else{var k=a.chars[j];k&&(c&&k[c]&&(b.x+=k.kerning[c]),d.push({texture:k.texture,line:g,charCode:j,position:new Point(b.x+k.xOffset,b.y+k.yOffset)}),b.x+=k.xAdvance,c=j)}}f.push(b.x),e=Math.max(e,b.x);var l=[];for(i=0;g>=i;i++){var m=0;"right"===this.style.align?m=e-f[i]:"center"===this.style.align&&(m=(e-f[i])/2),l.push(m)}for(i=0;i<d.length;i++){var n=new Sprite(d[i].texture);n.position.x=(d[i].position.x+l[d[i].line])*h,n.position.y=d[i].position.y*h,n.scale.x=n.scale.y=h,this.addChild(n)}this.width=e*h,this.height=(b.y+a.lineHeight)*h},proto.updateTransform=function(){if(this.dirty){for(;this.children.length>0;)this.removeChild(this.getChildAt(0));this.updateText(),this.dirty=!1}DisplayObjectContainer.prototype.updateTransform.call(this)},BitmapText.fonts={},module.exports=BitmapText;
},{"../display/DisplayObjectContainer":56,"../display/Sprite":58,"../geom/Point":86}],112:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Text(a,b){this.canvas=platform.createCanvas(),this.context=this.canvas.getContext("2d"),Sprite.call(this,Texture.fromCanvas(this.canvas)),this.setText(a),this.setStyle(b),this.updateText(),this.dirty=!1}var platform=require("../platform"),globals=require("../core/globals"),Point=require("../geom/Point"),Sprite=require("../display/Sprite"),Texture=require("../textures/Texture"),proto=Text.prototype=Object.create(Sprite.prototype,{constructor:{value:Text}});proto.setStyle=function(a){a=a||{},a.font=a.font||"bold 20pt Arial",a.fill=a.fill||"black",a.align=a.align||"left",a.stroke=a.stroke||"black",a.strokeThickness=a.strokeThickness||0,a.wordWrap=a.wordWrap||!1,a.wordWrapWidth=a.wordWrapWidth||100,this.style=a,this.dirty=!0},proto.setText=function(a){this.text=a.toString()||" ",this.dirty=!0},proto.updateText=function(){this.context.font=this.style.font;var a=this.text;this.style.wordWrap&&(a=this.wordWrap(this.text));for(var b=a.split(/(?:\r\n|\r|\n)/),c=[],d=0,e=0;e<b.length;e++){var f=this.context.measureText(b[e]).width;c[e]=f,d=Math.max(d,f)}this.canvas.width=d+this.style.strokeThickness;var g=this.determineFontHeight("font: "+this.style.font+";")+this.style.strokeThickness;for(this.canvas.height=g*b.length,this.context.fillStyle=this.style.fill,this.context.font=this.style.font,this.context.strokeStyle=this.style.stroke,this.context.lineWidth=this.style.strokeThickness,this.context.textBaseline="top",e=0;e<b.length;e++){var h=new Point(this.style.strokeThickness/2,this.style.strokeThickness/2+e*g);"right"===this.style.align?h.x+=d-c[e]:"center"===this.style.align&&(h.x+=(d-c[e])/2),this.style.stroke&&this.style.strokeThickness&&this.context.strokeText(b[e],h.x,h.y),this.style.fill&&this.context.fillText(b[e],h.x,h.y)}this.updateTexture()},proto.updateTexture=function(){this.texture.baseTexture.width=this.canvas.width,this.texture.baseTexture.height=this.canvas.height,this.texture.frame.width=this.canvas.width,this.texture.frame.height=this.canvas.height,this._width=this.canvas.width,this._height=this.canvas.height,globals.texturesToUpdate.push(this.texture.baseTexture)},proto.updateTransform=function(){this.dirty&&(this.updateText(),this.dirty=!1),Sprite.prototype.updateTransform.call(this)},proto.determineFontHeight=function(a){var b=Text.heightCache[a];if(!b){var c=platform.document.getElementsByTagName("body")[0],d=platform.document.createElement("div"),e=platform.document.createTextNode("M");d.appendChild(e),d.setAttribute("style",a+";position:absolute;top:0;left:0"),c.appendChild(d),b=d.offsetHeight,Text.heightCache[a]=b,c.removeChild(d)}return b},proto.wordWrap=function(a){for(var b="",c=a.split("\n"),d=0;d<c.length;d++){for(var e=this.style.wordWrapWidth,f=c[d].split(" "),g=0;g<f.length;g++){var h=this.context.measureText(f[g]).width,i=h+this.context.measureText(" ").width;i>e?(g>0&&(b+="\n"),b+=f[g]+" ",e=this.style.wordWrapWidth-h):(e-=i,b+=f[g]+" ")}b+="\n"}return b},proto.destroy=function(a){a&&this.texture.destroy()},Text.heightCache={},module.exports=Text;
},{"../core/globals":54,"../display/Sprite":58,"../geom/Point":86,"../platform":97,"../textures/Texture":115}],113:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function BaseTexture(a,b){if(EventTarget.call(this),this.width=100,this.height=100,this.scaleMode=b||BaseTexture.SCALE_MODE.DEFAULT,this.hasLoaded=!1,this.source=a,a){if("complete"in this.source)if(this.source.complete)this.hasLoaded=!0,this.width=this.source.width,this.height=this.source.height,globals.texturesToUpdate.push(this);else{var c=this;this.source.onload=function(){c.hasLoaded=!0,c.width=c.source.width,c.height=c.source.height,globals.texturesToUpdate.push(c),c.dispatchEvent({type:"loaded",content:c})}}else this.hasLoaded=!0,this.width=this.source.width,this.height=this.source.height,globals.texturesToUpdate.push(this);this.imageUrl=null,this._powerOf2=!1}}var platform=require("../platform"),globals=require("../core/globals"),EventTarget=require("../events/EventTarget"),baseTextureCache={},proto=BaseTexture.prototype;proto.destroy=function(){this.source.src&&(this.imageUrl in baseTextureCache&&delete baseTextureCache[this.imageUrl],this.imageUrl=null,this.source.src=null),this.source=null,globals.texturesToDestroy.push(this)},proto.updateSourceImage=function(a){this.hasLoaded=!1,this.source.src=null,this.source.src=a},BaseTexture.fromImage=function(a,b,c){var d=baseTextureCache[a];if(!d){var e=new platform.createImage;b&&(e.crossOrigin=""),e.src=a,d=new BaseTexture(e,c),d.imageUrl=a,baseTextureCache[a]=d}return d},BaseTexture.SCALE_MODE={DEFAULT:0,LINEAR:0,NEAREST:1},module.exports=BaseTexture;
},{"../core/globals":54,"../events/EventTarget":61,"../platform":97}],114:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function RenderTexture(a,b){EventTarget.call(this),this.width=a||100,this.height=b||100,this.identityMatrix=mat3.create(),this.frame=new Rectangle(0,0,this.width,this.height),globals.gl?this.initWebGL():this.initCanvas()}var globals=require("../core/globals"),mat3=require("../geom/matrix").mat3,Texture=require("./Texture"),BaseTexture=require("./BaseTexture"),Point=require("../geom/Point"),Rectangle=require("../geom/Rectangle"),EventTarget=require("../events/EventTarget"),CanvasRenderer=require("../renderers/canvas/CanvasRenderer"),WebGLRenderGroup=require("../renderers/webgl/WebGLRenderGroup"),proto=RenderTexture.prototype=Object.create(Texture.prototype,{constructor:{value:RenderTexture}});proto.initWebGL=function(){var a=globals.gl;this.glFramebuffer=a.createFramebuffer(),a.bindFramebuffer(a.FRAMEBUFFER,this.glFramebuffer),this.glFramebuffer.width=this.width,this.glFramebuffer.height=this.height,this.baseTexture=new BaseTexture,this.baseTexture.width=this.width,this.baseTexture.height=this.height,this.baseTexture._glTexture=a.createTexture(),a.bindTexture(a.TEXTURE_2D,this.baseTexture._glTexture),a.texImage2D(a.TEXTURE_2D,0,a.RGBA,this.width,this.height,0,a.RGBA,a.UNSIGNED_BYTE,null),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),this.baseTexture.isRender=!0,a.bindFramebuffer(a.FRAMEBUFFER,this.glFramebuffer),a.framebufferTexture2D(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,this.baseTexture._glTexture,0),this.projection=new Point(this.width/2,-this.height/2),this.render=this.renderWebGL},proto.resize=function(a,b){if(this.width=a,this.height=b,globals.gl){this.projection.x=this.width/2,this.projection.y=-this.height/2;var c=globals.gl;c.bindTexture(c.TEXTURE_2D,this.baseTexture._glTexture),c.texImage2D(c.TEXTURE_2D,0,c.RGBA,this.width,this.height,0,c.RGBA,c.UNSIGNED_BYTE,null)}else this.frame.width=this.width,this.frame.height=this.height,this.renderer.resize(this.width,this.height)},proto.initCanvas=function(){this.renderer=new CanvasRenderer(this.width,this.height,null,0),this.baseTexture=new BaseTexture(this.renderer.view),this.frame=new Rectangle(0,0,this.width,this.height),this.render=this.renderCanvas},proto.renderWebGL=function(a,b,c){var d=globals.gl;d.colorMask(!0,!0,!0,!0),d.viewport(0,0,this.width,this.height),d.bindFramebuffer(d.FRAMEBUFFER,this.glFramebuffer),c&&(d.clearColor(0,0,0,0),d.clear(d.COLOR_BUFFER_BIT));var e=a.children,f=a.worldTransform;a.worldTransform=mat3.create(),a.worldTransform[4]=-1,a.worldTransform[5]=-2*this.projection.y,b&&(a.worldTransform[2]=b.x,a.worldTransform[5]-=b.y),globals.visibleCount++,a.vcount=globals.visibleCount;for(var g=0,h=e.length;h>g;g++)e[g].updateTransform();var i=a.__renderGroup;i?a===i.root?i.render(this.projection,this.glFramebuffer):i.renderSpecific(a,this.projection,this.glFramebuffer):(this.renderGroup||(this.renderGroup=new WebGLRenderGroup(d)),this.renderGroup.setRenderable(a),this.renderGroup.render(this.projection,this.glFramebuffer)),a.worldTransform=f},proto.renderCanvas=function(a,b,c){var d=a.children;a.worldTransform=mat3.create(),b&&(a.worldTransform[2]=b.x,a.worldTransform[5]=b.y);for(var e=0,f=d.length;f>e;e++)d[e].updateTransform();c&&this.renderer.context.clearRect(0,0,this.width,this.height),this.renderer.renderDisplayObject(a),this.renderer.context.setTransform(1,0,0,1,0,0)},module.exports=RenderTexture;
},{"../core/globals":54,"../events/EventTarget":61,"../geom/Point":86,"../geom/Rectangle":88,"../geom/matrix":89,"../renderers/canvas/CanvasRenderer":99,"../renderers/webgl/WebGLRenderGroup":106,"./BaseTexture":113,"./Texture":115}],115:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function Texture(a,b){if(EventTarget.call(this),b||(this.noFrame=!0,b=new Rectangle(0,0,1,1)),a instanceof Texture&&(a=a.baseTexture),this.baseTexture=a,this.frame=b,this.trim=new Point,this.scope=this,a.hasLoaded)this.noFrame&&(b=new Rectangle(0,0,a.width,a.height)),this.setFrame(b);else{var c=this;a.addEventListener("loaded",function(){c.onBaseTextureLoaded()})}}var BaseTexture=require("./BaseTexture"),Point=require("../geom/Point"),Rectangle=require("../geom/Rectangle"),EventTarget=require("../events/EventTarget"),proto=Texture.prototype;proto.onBaseTextureLoaded=function(){var a=this.baseTexture;a.removeEventListener("loaded",this.onLoaded),this.noFrame&&(this.frame=new Rectangle(0,0,a.width,a.height)),this.noFrame=!1,this.width=this.frame.width,this.height=this.frame.height,this.scope.dispatchEvent({type:"update",content:this})},proto.destroy=function(a){a&&this.baseTexture.destroy()},proto.setFrame=function(a){if(this.frame=a,this.width=a.width,this.height=a.height,a.x+a.width>this.baseTexture.width||a.y+a.height>this.baseTexture.height)throw new Error("Texture Error: frame does not fit inside the base Texture dimensions "+this);this.updateFrame=!0,Texture.frameUpdates.push(this)},Texture.fromImage=function(a,b,c){var d=Texture.cache[a];return d||(d=new Texture(BaseTexture.fromImage(a,b,c)),Texture.cache[a]=d),d},Texture.fromFrame=function(a){var b=Texture.cache[a];if(!b)throw new Error('The frameId "'+a+'" does not exist in the texture cache '+this);return b},Texture.fromCanvas=function(a,b){var c=new BaseTexture(a,b);return new Texture(c)},Texture.addTextureToCache=function(a,b){Texture.cache[b]=a},Texture.removeTextureFromCache=function(a){var b=Texture.cache[a];return Texture.cache[a]=null,b},Texture.cache={},Texture.frameUpdates=[],Texture.SCALE_MODE=BaseTexture.SCALE_MODE,module.exports=Texture;
},{"../events/EventTarget":61,"../geom/Point":86,"../geom/Rectangle":88,"./BaseTexture":113}],116:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function pointInTriangle(a,b,c,d,e,f,g,h){var i=g-c,j=h-d,k=e-c,l=f-d,m=a-c,n=b-d,o=i*i+j*j,p=i*k+j*l,q=i*m+j*n,r=k*k+l*l,s=k*m+l*n,t=1/(o*r-p*p),u=(r*q-p*s)*t,v=(o*s-p*q)*t;return u>=0&&v>=0&&1>u+v}function convex(a,b,c,d,e,f,g){return(b-d)*(e-c)+(c-a)*(f-d)>=0===g}var platform=require("../platform");exports.triangulate=function(a){var b=!0,c=a.length>>1;if(3>c)return[];for(var d=[],e=[],f=0;c>f;f++)e.push(f);f=0;for(var g=c;g>3;){var h=e[(f+0)%g],i=e[(f+1)%g],j=e[(f+2)%g],k=a[2*h],l=a[2*h+1],m=a[2*i],n=a[2*i+1],o=a[2*j],p=a[2*j+1],q=!1;if(convex(k,l,m,n,o,p,b)){q=!0;for(var r=0;g>r;r++){var s=e[r];if(s!==h&&s!==i&&s!==j&&pointInTriangle(a[2*s],a[2*s+1],k,l,m,n,o,p)){q=!1;break}}}if(q)d.push(h,i,j),e.splice((f+1)%g,1),g--,f=0;else if(f++>3*g){if(!b)return platform.console.warn("PIXI Warning: shape too complex to fill"),[];for(d=[],e=[],f=0;c>f;f++)e.push(f);f=0,g=c,b=!1}}return d.push(e[0],e[1],e[2]),d};
},{"../platform":97}],117:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";var platform=require("../platform"),CanvasRenderer=require("../renderers/canvas/CanvasRenderer"),WebGLRenderer=require("../renderers/webgl/WebGLRenderer");module.exports=function(a,b,c,d,e){a||(a=800),b||(b=600);var f=function(){try{var a=platform.createCanvas();return!!platform.window.WebGLRenderingContext&&(a.getContext("webgl")||a.getContext("experimental-webgl"))}catch(b){return!1}}();if(f&&platform.navigator){var g=-1!==platform.navigator.userAgent.toLowerCase().indexOf("trident");f=!g}return f?new WebGLRenderer(a,b,c,d,e):new CanvasRenderer(a,b,c,d)};
},{"../platform":97,"../renderers/canvas/CanvasRenderer":99,"../renderers/webgl/WebGLRenderer":107}],118:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";exports.hex2rgb=function(a){return[(a>>16&255)/255,(a>>8&255)/255,(255&a)/255]};
},{}],119:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";function logGroup(a){var b=platform.console;b.groupCollapsed?b.groupCollapsed(a):b.group?b.group(a):b.log(a+" >>>>>>>>>")}function logGroupEnd(a){var b=platform.console;b.groupEnd?b.groupEnd(a):b.log(a+" _________")}var platform=require("../platform");exports.runList=function(a,b){var c=0,d=a.first;for(b="pixi.runList"+(b?"("+b+")":""),logGroup(b),platform.console.log(d);d._iNext;)if(c++,d=d._iNext,platform.console.log(d),c>100){platform.console.log("BREAK");break}logGroupEnd(b)};
},{"../platform":97}],120:[function(require,module,exports){
/**
 * pixi 0.2.1 (6aa0030)
 * http://drkibitz.github.io/node-pixi/
 * Copyright (c) 2013-2014 Dr. Kibitz, http://drkibitz.com
 * Super fast 2D rendering engine for browserify, that uses WebGL with a context 2d fallback.
 * built: Sun Jan 05 2014 01:53:58 GMT-0500 (EST)
 *
 * Pixi.js - v1.3.0
 * Copyright (c) 2012, Mat Groves
 */
"use strict";var spine=module.exports={};spine.BoneData=function(a,b){this.name=a,this.parent=b},spine.BoneData.prototype={length:0,x:0,y:0,rotation:0,scaleX:1,scaleY:1},spine.SlotData=function(a,b){this.name=a,this.boneData=b},spine.SlotData.prototype={r:1,g:1,b:1,a:1,attachmentName:null},spine.Bone=function(a,b){this.data=a,this.parent=b,this.setToSetupPose()},spine.Bone.yDown=!1,spine.Bone.prototype={x:0,y:0,rotation:0,scaleX:1,scaleY:1,m00:0,m01:0,worldX:0,m10:0,m11:0,worldY:0,worldRotation:0,worldScaleX:1,worldScaleY:1,updateWorldTransform:function(a,b){var c=this.parent;null!=c?(this.worldX=this.x*c.m00+this.y*c.m01+c.worldX,this.worldY=this.x*c.m10+this.y*c.m11+c.worldY,this.worldScaleX=c.worldScaleX*this.scaleX,this.worldScaleY=c.worldScaleY*this.scaleY,this.worldRotation=c.worldRotation+this.rotation):(this.worldX=this.x,this.worldY=this.y,this.worldScaleX=this.scaleX,this.worldScaleY=this.scaleY,this.worldRotation=this.rotation);var d=this.worldRotation*Math.PI/180,e=Math.cos(d),f=Math.sin(d);this.m00=e*this.worldScaleX,this.m10=f*this.worldScaleX,this.m01=-f*this.worldScaleY,this.m11=e*this.worldScaleY,a&&(this.m00=-this.m00,this.m01=-this.m01),b&&(this.m10=-this.m10,this.m11=-this.m11),spine.Bone.yDown&&(this.m10=-this.m10,this.m11=-this.m11)},setToSetupPose:function(){var a=this.data;this.x=a.x,this.y=a.y,this.rotation=a.rotation,this.scaleX=a.scaleX,this.scaleY=a.scaleY}},spine.Slot=function(a,b,c){this.data=a,this.skeleton=b,this.bone=c,this.setToSetupPose()},spine.Slot.prototype={r:1,g:1,b:1,a:1,_attachmentTime:0,attachment:null,setAttachment:function(a){this.attachment=a,this._attachmentTime=this.skeleton.time},setAttachmentTime:function(a){this._attachmentTime=this.skeleton.time-a},getAttachmentTime:function(){return this.skeleton.time-this._attachmentTime},setToSetupPose:function(){var a=this.data;this.r=a.r,this.g=a.g,this.b=a.b,this.a=a.a;for(var b=this.skeleton.data.slots,c=0,d=b.length;d>c;c++)if(b[c]==a){this.setAttachment(a.attachmentName?this.skeleton.getAttachmentBySlotIndex(c,a.attachmentName):null);break}}},spine.Skin=function(a){this.name=a,this.attachments={}},spine.Skin.prototype={addAttachment:function(a,b,c){this.attachments[a+":"+b]=c},getAttachment:function(a,b){return this.attachments[a+":"+b]},_attachAll:function(a,b){for(var c in b.attachments){var d=c.indexOf(":"),e=parseInt(c.substring(0,d),10),f=c.substring(d+1),g=a.slots[e];if(g.attachment&&g.attachment.name==f){var h=this.getAttachment(e,f);h&&g.setAttachment(h)}}}},spine.Animation=function(a,b,c){this.name=a,this.timelines=b,this.duration=c},spine.Animation.prototype={apply:function(a,b,c){c&&this.duration&&(b%=this.duration);for(var d=this.timelines,e=0,f=d.length;f>e;e++)d[e].apply(a,b,1)},mix:function(a,b,c,d){c&&this.duration&&(b%=this.duration);for(var e=this.timelines,f=0,g=e.length;g>f;f++)e[f].apply(a,b,d)}},spine.binarySearch=function(a,b,c){var d=0,e=Math.floor(a.length/c)-2;if(!e)return c;for(var f=e>>>1;;){if(a[(f+1)*c]<=b?d=f+1:e=f,d==e)return(d+1)*c;f=d+e>>>1}},spine.linearSearch=function(a,b,c){for(var d=0,e=a.length-c;e>=d;d+=c)if(a[d]>b)return d;return-1},spine.Curves=function(a){this.curves=[],this.curves.length=6*(a-1)},spine.Curves.prototype={setLinear:function(a){this.curves[6*a]=0},setStepped:function(a){this.curves[6*a]=-1},setCurve:function(a,b,c,d,e){var f=.1,g=f*f,h=g*f,i=3*f,j=3*g,k=6*g,l=6*h,m=2*-b+d,n=2*-c+e,o=3*(b-d)+1,p=3*(c-e)+1,q=6*a,r=this.curves;r[q]=b*i+m*j+o*h,r[q+1]=c*i+n*j+p*h,r[q+2]=m*k+o*l,r[q+3]=n*k+p*l,r[q+4]=o*l,r[q+5]=p*l},getCurvePercent:function(a,b){b=0>b?0:b>1?1:b;var c=6*a,d=this.curves,e=d[c];if(!e)return b;if(-1==e)return 0;for(var f=d[c+1],g=d[c+2],h=d[c+3],i=d[c+4],j=d[c+5],k=e,l=f,m=8;;){if(k>=b){var n=k-e,o=l-f;return o+(l-o)*(b-n)/(k-n)}if(!m)break;m--,e+=g,f+=h,g+=i,h+=j,k+=e,l+=f}return l+(1-l)*(b-k)/(1-k)}},spine.RotateTimeline=function(a){this.curves=new spine.Curves(a),this.frames=[],this.frames.length=2*a},spine.RotateTimeline.prototype={boneIndex:0,getFrameCount:function(){return this.frames.length/2},setFrame:function(a,b,c){a*=2,this.frames[a]=b,this.frames[a+1]=c},apply:function(a,b,c){var d,e=this.frames;if(!(b<e[0])){var f=a.bones[this.boneIndex];if(b>=e[e.length-2]){for(d=f.data.rotation+e[e.length-1]-f.rotation;d>180;)d-=360;for(;-180>d;)d+=360;return f.rotation+=d*c,void 0}var g=spine.binarySearch(e,b,2),h=e[g-1],i=e[g],j=1-(b-i)/(e[g-2]-i);for(j=this.curves.getCurvePercent(g/2-1,j),d=e[g+1]-h;d>180;)d-=360;for(;-180>d;)d+=360;for(d=f.data.rotation+(h+d*j)-f.rotation;d>180;)d-=360;for(;-180>d;)d+=360;f.rotation+=d*c}}},spine.TranslateTimeline=function(a){this.curves=new spine.Curves(a),this.frames=[],this.frames.length=3*a},spine.TranslateTimeline.prototype={boneIndex:0,getFrameCount:function(){return this.frames.length/3},setFrame:function(a,b,c,d){a*=3,this.frames[a]=b,this.frames[a+1]=c,this.frames[a+2]=d},apply:function(a,b,c){var d=this.frames;if(!(b<d[0])){var e=a.bones[this.boneIndex];if(b>=d[d.length-3])return e.x+=(e.data.x+d[d.length-2]-e.x)*c,e.y+=(e.data.y+d[d.length-1]-e.y)*c,void 0;var f=spine.binarySearch(d,b,3),g=d[f-2],h=d[f-1],i=d[f],j=1-(b-i)/(d[f+-3]-i);j=this.curves.getCurvePercent(f/3-1,j),e.x+=(e.data.x+g+(d[f+1]-g)*j-e.x)*c,e.y+=(e.data.y+h+(d[f+2]-h)*j-e.y)*c}}},spine.ScaleTimeline=function(a){this.curves=new spine.Curves(a),this.frames=[],this.frames.length=3*a},spine.ScaleTimeline.prototype={boneIndex:0,getFrameCount:function(){return this.frames.length/3},setFrame:function(a,b,c,d){a*=3,this.frames[a]=b,this.frames[a+1]=c,this.frames[a+2]=d},apply:function(a,b,c){var d=this.frames;if(!(b<d[0])){var e=a.bones[this.boneIndex];if(b>=d[d.length-3])return e.scaleX+=(e.data.scaleX-1+d[d.length-2]-e.scaleX)*c,e.scaleY+=(e.data.scaleY-1+d[d.length-1]-e.scaleY)*c,void 0;var f=spine.binarySearch(d,b,3),g=d[f-2],h=d[f-1],i=d[f],j=1-(b-i)/(d[f+-3]-i);j=this.curves.getCurvePercent(f/3-1,j),e.scaleX+=(e.data.scaleX-1+g+(d[f+1]-g)*j-e.scaleX)*c,e.scaleY+=(e.data.scaleY-1+h+(d[f+2]-h)*j-e.scaleY)*c}}},spine.ColorTimeline=function(a){this.curves=new spine.Curves(a),this.frames=[],this.frames.length=5*a},spine.ColorTimeline.prototype={slotIndex:0,getFrameCount:function(){return this.frames.length/2},setFrame:function(a,b,c,d,e,f){a*=5,this.frames[a]=b,this.frames[a+1]=c,this.frames[a+2]=d,this.frames[a+3]=e,this.frames[a+4]=f},apply:function(a,b,c){var d=this.frames;if(!(b<d[0])){var e=a.slots[this.slotIndex];if(b>=d[d.length-5]){var f=d.length-1;return e.r=d[f-3],e.g=d[f-2],e.b=d[f-1],e.a=d[f],void 0}var g=spine.binarySearch(d,b,5),h=d[g-4],i=d[g-3],j=d[g-2],k=d[g-1],l=d[g],m=1-(b-l)/(d[g-5]-l);m=this.curves.getCurvePercent(g/5-1,m);var n=h+(d[g+1]-h)*m,o=i+(d[g+2]-i)*m,p=j+(d[g+3]-j)*m,q=k+(d[g+4]-k)*m;1>c?(e.r+=(n-e.r)*c,e.g+=(o-e.g)*c,e.b+=(p-e.b)*c,e.a+=(q-e.a)*c):(e.r=n,e.g=o,e.b=p,e.a=q)}}},spine.AttachmentTimeline=function(a){this.curves=new spine.Curves(a),this.frames=[],this.frames.length=a,this.attachmentNames=[],this.attachmentNames.length=a},spine.AttachmentTimeline.prototype={slotIndex:0,getFrameCount:function(){return this.frames.length},setFrame:function(a,b,c){this.frames[a]=b,this.attachmentNames[a]=c},apply:function(a,b){var c=this.frames;if(!(b<c[0])){var d;d=b>=c[c.length-1]?c.length-1:spine.binarySearch(c,b,1)-1;var e=this.attachmentNames[d];a.slots[this.slotIndex].setAttachment(e?a.getAttachmentBySlotIndex(this.slotIndex,e):null)}}},spine.SkeletonData=function(){this.bones=[],this.slots=[],this.skins=[],this.animations=[]},spine.SkeletonData.prototype={defaultSkin:null,findBone:function(a){for(var b=this.bones,c=0,d=b.length;d>c;c++)if(b[c].name==a)return b[c];return null},findBoneIndex:function(a){for(var b=this.bones,c=0,d=b.length;d>c;c++)if(b[c].name==a)return c;return-1},findSlot:function(a){for(var b=this.slots,c=0,d=b.length;d>c;c++)if(b[c].name==a)return b[c];return null},findSlotIndex:function(a){for(var b=this.slots,c=0,d=b.length;d>c;c++)if(b[c].name==a)return c;return-1},findSkin:function(a){for(var b=this.skins,c=0,d=b.length;d>c;c++)if(b[c].name==a)return b[c];return null},findAnimation:function(a){for(var b=this.animations,c=0,d=b.length;d>c;c++)if(b[c].name==a)return b[c];return null}},spine.Skeleton=function(a){this.data=a,this.bones=[];for(var b=0,c=a.bones.length;c>b;b++){var d=a.bones[b],e=d.parent?this.bones[a.bones.indexOf(d.parent)]:null;this.bones.push(new spine.Bone(d,e))}for(this.slots=[],this.drawOrder=[],b=0,c=a.slots.length;c>b;b++){var f=a.slots[b],g=this.bones[a.bones.indexOf(f.boneData)],h=new spine.Slot(f,this,g);this.slots.push(h),this.drawOrder.push(h)}},spine.Skeleton.prototype={x:0,y:0,skin:null,r:1,g:1,b:1,a:1,time:0,flipX:!1,flipY:!1,updateWorldTransform:function(){for(var a=this.flipX,b=this.flipY,c=this.bones,d=0,e=c.length;e>d;d++)c[d].updateWorldTransform(a,b)},setToSetupPose:function(){this.setBonesToSetupPose(),this.setSlotsToSetupPose()},setBonesToSetupPose:function(){for(var a=this.bones,b=0,c=a.length;c>b;b++)a[b].setToSetupPose()},setSlotsToSetupPose:function(){for(var a=this.slots,b=0,c=a.length;c>b;b++)a[b].setToSetupPose(b)},getRootBone:function(){return this.bones.length?this.bones[0]:null},findBone:function(a){for(var b=this.bones,c=0,d=b.length;d>c;c++)if(b[c].data.name==a)return b[c];return null},findBoneIndex:function(a){for(var b=this.bones,c=0,d=b.length;d>c;c++)if(b[c].data.name==a)return c;return-1},findSlot:function(a){for(var b=this.slots,c=0,d=b.length;d>c;c++)if(b[c].data.name==a)return b[c];return null},findSlotIndex:function(a){for(var b=this.slots,c=0,d=b.length;d>c;c++)if(b[c].data.name==a)return c;return-1},setSkinByName:function(a){var b=this.data.findSkin(a);if(!b)throw"Skin not found: "+a;this.setSkin(b)},setSkin:function(a){this.skin&&a&&a._attachAll(this,this.skin),this.skin=a},getAttachmentBySlotName:function(a,b){return this.getAttachmentBySlotIndex(this.data.findSlotIndex(a),b)},getAttachmentBySlotIndex:function(a,b){if(this.skin){var c=this.skin.getAttachment(a,b);if(c)return c}return this.data.defaultSkin?this.data.defaultSkin.getAttachment(a,b):null},setAttachment:function(a,b){for(var c=this.slots,d=0,e=c.size;e>d;d++){var f=c[d];if(f.data.name==a){var g=null;if(b&&(g=this.getAttachment(d,b),null==g))throw"Attachment not found: "+b+", for slot: "+a;return f.setAttachment(g),void 0}}throw"Slot not found: "+a},update:function(a){this.time+=a}},spine.AttachmentType={region:0},spine.RegionAttachment=function(){this.offset=[],this.offset.length=8,this.uvs=[],this.uvs.length=8},spine.RegionAttachment.prototype={x:0,y:0,rotation:0,scaleX:1,scaleY:1,width:0,height:0,rendererObject:null,regionOffsetX:0,regionOffsetY:0,regionWidth:0,regionHeight:0,regionOriginalWidth:0,regionOriginalHeight:0,setUVs:function(a,b,c,d,e){var f=this.uvs;e?(f[2]=a,f[3]=d,f[4]=a,f[5]=b,f[6]=c,f[7]=b,f[0]=c,f[1]=d):(f[0]=a,f[1]=d,f[2]=a,f[3]=b,f[4]=c,f[5]=b,f[6]=c,f[7]=d)},updateOffset:function(){var a=this.width/this.regionOriginalWidth*this.scaleX,b=this.height/this.regionOriginalHeight*this.scaleY,c=-this.width/2*this.scaleX+this.regionOffsetX*a,d=-this.height/2*this.scaleY+this.regionOffsetY*b,e=c+this.regionWidth*a,f=d+this.regionHeight*b,g=this.rotation*Math.PI/180,h=Math.cos(g),i=Math.sin(g),j=c*h+this.x,k=c*i,l=d*h+this.y,m=d*i,n=e*h+this.x,o=e*i,p=f*h+this.y,q=f*i,r=this.offset;r[0]=j-m,r[1]=l+k,r[2]=j-q,r[3]=p+k,r[4]=n-q,r[5]=p+o,r[6]=n-m,r[7]=l+o},computeVertices:function(a,b,c,d){a+=c.worldX,b+=c.worldY;var e=c.m00,f=c.m01,g=c.m10,h=c.m11,i=this.offset;d[0]=i[0]*e+i[1]*f+a,d[1]=i[0]*g+i[1]*h+b,d[2]=i[2]*e+i[3]*f+a,d[3]=i[2]*g+i[3]*h+b,d[4]=i[4]*e+i[5]*f+a,d[5]=i[4]*g+i[5]*h+b,d[6]=i[6]*e+i[7]*f+a,d[7]=i[6]*g+i[7]*h+b}},spine.AnimationStateData=function(a){this.skeletonData=a,this.animationToMixTime={}},spine.AnimationStateData.prototype={defaultMix:0,setMixByName:function(a,b,c){var d=this.skeletonData.findAnimation(a);if(!d)throw"Animation not found: "+a;var e=this.skeletonData.findAnimation(b);if(!e)throw"Animation not found: "+b;this.setMix(d,e,c)},setMix:function(a,b,c){this.animationToMixTime[a.name+":"+b.name]=c},getMix:function(a,b){var c=this.animationToMixTime[a.name+":"+b.name];return c?c:this.defaultMix}},spine.AnimationState=function(a){this.data=a,this.queue=[]},spine.AnimationState.prototype={current:null,previous:null,currentTime:0,previousTime:0,currentLoop:!1,previousLoop:!1,mixTime:0,mixDuration:0,update:function(a){if(this.currentTime+=a,this.previousTime+=a,this.mixTime+=a,this.queue.length>0){var b=this.queue[0];this.currentTime>=b.delay&&(this._setAnimation(b.animation,b.loop),this.queue.shift())}},apply:function(a){if(this.current)if(this.previous){this.previous.apply(a,this.previousTime,this.previousLoop);var b=this.mixTime/this.mixDuration;b>=1&&(b=1,this.previous=null),this.current.mix(a,this.currentTime,this.currentLoop,b)}else this.current.apply(a,this.currentTime,this.currentLoop)},clearAnimation:function(){this.previous=null,this.current=null,this.queue.length=0},_setAnimation:function(a,b){this.previous=null,a&&this.current&&(this.mixDuration=this.data.getMix(this.current,a),this.mixDuration>0&&(this.mixTime=0,this.previous=this.current,this.previousTime=this.currentTime,this.previousLoop=this.currentLoop)),this.current=a,this.currentLoop=b,this.currentTime=0},setAnimationByName:function(a,b){var c=this.data.skeletonData.findAnimation(a);if(!c)throw"Animation not found: "+a;this.setAnimation(c,b)},setAnimation:function(a,b){this.queue.length=0,this._setAnimation(a,b)},addAnimationByName:function(a,b,c){var d=this.data.skeletonData.findAnimation(a);if(!d)throw"Animation not found: "+a;this.addAnimation(d,b,c)},addAnimation:function(a,b,c){var d={};if(d.animation=a,d.loop=b,!c||0>=c){var e=this.queue.length?this.queue[this.queue.length-1].animation:this.current;c=null!=e?e.duration-this.data.getMix(e,a)+(c||0):0}d.delay=c,this.queue.push(d)},isComplete:function(){return!this.current||this.currentTime>=this.current.duration}},spine.SkeletonJson=function(a){this.attachmentLoader=a},spine.SkeletonJson.prototype={scale:1,readSkeletonData:function(a){for(var b,c=new spine.SkeletonData,d=a.bones,e=0,f=d.length;f>e;e++){var g=d[e],h=null;if(g.parent&&(h=c.findBone(g.parent),!h))throw"Parent bone not found: "+g.parent;b=new spine.BoneData(g.name,h),b.length=(g.length||0)*this.scale,b.x=(g.x||0)*this.scale,b.y=(g.y||0)*this.scale,b.rotation=g.rotation||0,b.scaleX=g.scaleX||1,b.scaleY=g.scaleY||1,c.bones.push(b)}var i=a.slots;for(e=0,f=i.length;f>e;e++){var j=i[e];if(b=c.findBone(j.bone),!b)throw"Slot bone not found: "+j.bone;var k=new spine.SlotData(j.name,b),l=j.color;l&&(k.r=spine.SkeletonJson.toColor(l,0),k.g=spine.SkeletonJson.toColor(l,1),k.b=spine.SkeletonJson.toColor(l,2),k.a=spine.SkeletonJson.toColor(l,3)),k.attachmentName=j.attachment,c.slots.push(k)}var m=a.skins;for(var n in m)if(m.hasOwnProperty(n)){var o=m[n],p=new spine.Skin(n);for(var q in o)if(o.hasOwnProperty(q)){var r=c.findSlotIndex(q),s=o[q];for(var t in s)if(s.hasOwnProperty(t)){var u=this.readAttachment(p,t,s[t]);null!=u&&p.addAttachment(r,t,u)}}c.skins.push(p),"default"==p.name&&(c.defaultSkin=p)}var v=a.animations;for(var w in v)v.hasOwnProperty(w)&&this.readAnimation(w,v[w],c);return c},readAttachment:function(a,b,c){b=c.name||b;var d=spine.AttachmentType[c.type||"region"];if(d==spine.AttachmentType.region){var e=new spine.RegionAttachment;return e.x=(c.x||0)*this.scale,e.y=(c.y||0)*this.scale,e.scaleX=c.scaleX||1,e.scaleY=c.scaleY||1,e.rotation=c.rotation||0,e.width=(c.width||32)*this.scale,e.height=(c.height||32)*this.scale,e.updateOffset(),e.rendererObject={},e.rendererObject.name=b,e.rendererObject.scale={},e.rendererObject.scale.x=e.scaleX,e.rendererObject.scale.y=e.scaleY,e.rendererObject.rotation=-e.rotation*Math.PI/180,e}throw"Unknown attachment type: "+d},readAnimation:function(a,b,c){var d,e,f,g,h,i,j,k=[],l=0,m=b.bones;for(var n in m)if(m.hasOwnProperty(n)){var o=c.findBoneIndex(n);if(-1==o)throw"Bone not found: "+n;var p=m[n];for(f in p)if(p.hasOwnProperty(f))if(h=p[f],"rotate"==f){for(e=new spine.RotateTimeline(h.length),e.boneIndex=o,d=0,i=0,j=h.length;j>i;i++)g=h[i],e.setFrame(d,g.time,g.angle),spine.SkeletonJson.readCurve(e,d,g),d++;k.push(e),l=Math.max(l,e.frames[2*e.getFrameCount()-2])}else{if("translate"!=f&&"scale"!=f)throw"Invalid timeline type for a bone: "+f+" ("+n+")";var q=1;for("scale"==f?e=new spine.ScaleTimeline(h.length):(e=new spine.TranslateTimeline(h.length),q=this.scale),e.boneIndex=o,d=0,i=0,j=h.length;j>i;i++){g=h[i];var r=(g.x||0)*q,s=(g.y||0)*q;e.setFrame(d,g.time,r,s),spine.SkeletonJson.readCurve(e,d,g),d++}k.push(e),l=Math.max(l,e.frames[3*e.getFrameCount()-3])}}var t=b.slots;for(var u in t)if(t.hasOwnProperty(u)){var v=t[u],w=c.findSlotIndex(u);for(f in v)if(v.hasOwnProperty(f))if(h=v[f],"color"==f){for(e=new spine.ColorTimeline(h.length),e.slotIndex=w,d=0,i=0,j=h.length;j>i;i++){g=h[i];var x=g.color,y=spine.SkeletonJson.toColor(x,0),z=spine.SkeletonJson.toColor(x,1),A=spine.SkeletonJson.toColor(x,2),B=spine.SkeletonJson.toColor(x,3);e.setFrame(d,g.time,y,z,A,B),spine.SkeletonJson.readCurve(e,d,g),d++}k.push(e),l=Math.max(l,e.frames[5*e.getFrameCount()-5])}else{if("attachment"!=f)throw"Invalid timeline type for a slot: "+f+" ("+u+")";for(e=new spine.AttachmentTimeline(h.length),e.slotIndex=w,d=0,i=0,j=h.length;j>i;i++)g=h[i],e.setFrame(d++,g.time,g.name);k.push(e),l=Math.max(l,e.frames[e.getFrameCount()-1])}}c.animations.push(new spine.Animation(a,k,l))}},spine.SkeletonJson.readCurve=function(a,b,c){var d=c.curve;d&&("stepped"==d?a.curves.setStepped(b):d instanceof Array&&a.curves.setCurve(b,d[0],d[1],d[2],d[3]))},spine.SkeletonJson.toColor=function(a,b){if(8!=a.length)throw"Color hexidecimal length must be 8, recieved: "+a;return parseInt(a.substring(2*b,2),16)/255},spine.Atlas=function(a,b){this.textureLoader=b,this.pages=[],this.regions=[];var c=new spine.AtlasReader(a),d=[];d.length=4;for(var e=null;;){var f=c.readLine();if(null==f)break;if(f=c.trim(f),f.length)if(e){var g=new spine.AtlasRegion;g.name=f,g.page=e,g.rotate="true"==c.readValue(),c.readTuple(d);var h=parseInt(d[0],10),i=parseInt(d[1],10);c.readTuple(d);var j=parseInt(d[0],10),k=parseInt(d[1],10);g.u=h/e.width,g.v=i/e.height,g.rotate?(g.u2=(h+k)/e.width,g.v2=(i+j)/e.height):(g.u2=(h+j)/e.width,g.v2=(i+k)/e.height),g.x=h,g.y=i,g.width=Math.abs(j),g.height=Math.abs(k),4==c.readTuple(d)&&(g.splits=[parseInt(d[0],10),parseInt(d[1],10),parseInt(d[2],10),parseInt(d[3],10)],4==c.readTuple(d)&&(g.pads=[parseInt(d[0],10),parseInt(d[1],10),parseInt(d[2],10),parseInt(d[3],10)],c.readTuple(d))),g.originalWidth=parseInt(d[0],10),g.originalHeight=parseInt(d[1],10),c.readTuple(d),g.offsetX=parseInt(d[0],10),g.offsetY=parseInt(d[1],10),g.index=parseInt(c.readValue(),10),this.regions.push(g)}else{e=new spine.AtlasPage,e.name=f,e.format=spine.Atlas.Format[c.readValue()],c.readTuple(d),e.minFilter=spine.Atlas.TextureFilter[d[0]],e.magFilter=spine.Atlas.TextureFilter[d[1]];var l=c.readValue();e.uWrap=spine.Atlas.TextureWrap.clampToEdge,e.vWrap=spine.Atlas.TextureWrap.clampToEdge,"x"==l?e.uWrap=spine.Atlas.TextureWrap.repeat:"y"==l?e.vWrap=spine.Atlas.TextureWrap.repeat:"xy"==l&&(e.uWrap=e.vWrap=spine.Atlas.TextureWrap.repeat),b.load(e,f),this.pages.push(e)}else e=null}},spine.Atlas.prototype={findRegion:function(a){for(var b=this.regions,c=0,d=b.length;d>c;c++)if(b[c].name==a)return b[c];return null},dispose:function(){for(var a=this.pages,b=0,c=a.length;c>b;b++)this.textureLoader.unload(a[b].rendererObject)},updateUVs:function(a){for(var b=this.regions,c=0,d=b.length;d>c;c++){var e=b[c];e.page==a&&(e.u=e.x/a.width,e.v=e.y/a.height,e.rotate?(e.u2=(e.x+e.height)/a.width,e.v2=(e.y+e.width)/a.height):(e.u2=(e.x+e.width)/a.width,e.v2=(e.y+e.height)/a.height))}}},spine.Atlas.Format={alpha:0,intensity:1,luminanceAlpha:2,rgb565:3,rgba4444:4,rgb888:5,rgba8888:6},spine.Atlas.TextureFilter={nearest:0,linear:1,mipMap:2,mipMapNearestNearest:3,mipMapLinearNearest:4,mipMapNearestLinear:5,mipMapLinearLinear:6},spine.Atlas.TextureWrap={mirroredRepeat:0,clampToEdge:1,repeat:2},spine.AtlasPage=function(){},spine.AtlasPage.prototype={name:null,format:null,minFilter:null,magFilter:null,uWrap:null,vWrap:null,rendererObject:null,width:0,height:0},spine.AtlasRegion=function(){},spine.AtlasRegion.prototype={page:null,name:null,x:0,y:0,width:0,height:0,u:0,v:0,u2:0,v2:0,offsetX:0,offsetY:0,originalWidth:0,originalHeight:0,index:0,rotate:!1,splits:null,pads:null},spine.AtlasReader=function(a){this.lines=a.split(/\r\n|\r|\n/)},spine.AtlasReader.prototype={index:0,trim:function(a){return a.replace(/^\s+|\s+$/g,"")},readLine:function(){return this.index>=this.lines.length?null:this.lines[this.index++]},readValue:function(){var a=this.readLine(),b=a.indexOf(":");if(-1==b)throw"Invalid line: "+a;return this.trim(a.substring(b+1))},readTuple:function(a){var b=this.readLine(),c=b.indexOf(":");if(-1==c)throw"Invalid line: "+b;for(var d=0,e=c+1;3>d;d++){var f=b.indexOf(",",e);if(-1==f){if(!d)throw"Invalid line: "+b;break}a[d]=this.trim(b.substr(e,f-e)),e=f+1}return a[d]=this.trim(b.substring(e)),d+1}},spine.AtlasAttachmentLoader=function(a){this.atlas=a},spine.AtlasAttachmentLoader.prototype={newAttachment:function(a,b,c){switch(b){case spine.AttachmentType.region:var d=this.atlas.findRegion(c);if(!d)throw"Region not found in atlas: "+c+" ("+b+")";var e=new spine.RegionAttachment(c);return e.rendererObject=d,e.setUVs(d.u,d.v,d.u2,d.v2,d.rotate),e.regionOffsetX=d.offsetX,e.regionOffsetY=d.offsetY,e.regionWidth=d.width,e.regionHeight=d.height,e.regionOriginalWidth=d.originalWidth,e.regionOriginalHeight=d.originalHeight,e}throw"Unknown attachment type: "+b}},spine.Bone.yDown=!0;
},{}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImF2YXRhcnMvUGFuemVyL2NsaWVudC9QYW56ZXIuanMiLCJhdmF0YXJzL1Bhbnplci9jbGllbnQvY29uZmlnLmpzb24iLCJjb3JlL2NsaWVudC9jb25maWcuanNvbiIsImNvcmUvY2xpZW50L21haW4uanMiLCJjb3JlL2NsaWVudC9zY3JpcHRzL0F2YXRhci5qcyIsImNvcmUvY2xpZW50L3NjcmlwdHMvQXZhdGFyTG9hZGVyLmpzIiwiY29yZS9jbGllbnQvc2NyaXB0cy9BdmF0YXJOb2RlLmpzIiwiY29yZS9jbGllbnQvc2NyaXB0cy9DaHVuay5qcyIsImNvcmUvY2xpZW50L3NjcmlwdHMvR3JhcGhpY3MuanMiLCJjb3JlL2NsaWVudC9zY3JpcHRzL0lucHV0LmpzIiwiY29yZS9jbGllbnQvc2NyaXB0cy9OZXR3b3JrLmpzIiwiY29yZS9jbGllbnQvc2NyaXB0cy9TYW5kYm94LmpzIiwiY29yZS9jbGllbnQvc2NyaXB0cy9TcHJpdGVMb2FkZXIuanMiLCJjb3JlL2NsaWVudC9zY3JpcHRzL1dvcmxkLmpzIiwiY29yZS9jbGllbnQvc2NyaXB0cy9kZWZhdWx0QXZhdGFyTm9kZS5qc29uIiwiY29yZS9jbGllbnQvc2NyaXB0cy9zdGF0cy5qcyIsImNvcmUvY29tbW9uL0NhY2hlZC5qcyIsImNvcmUvY29tbW9uL0xvZ2dlci5qcyIsImNvcmUvY29tbW9uL1BhY2suanMiLCJjb3JlL2NvbW1vbi9jb25maWcuanNvbiIsImNvcmUvY29tbW9uL2lzQnJvd3Nlci5qcyIsImNvcmUvY29tbW9uL3V0aWwuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCJjb3JlL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzIiwiY29yZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiY29yZS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pcy1hcnJheS9pbmRleC5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL2NvbG9ycy9saWIvY29sb3JzLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvY29sb3JzL2xpYi9jdXN0b20vdHJhcC5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL2NvbG9ycy9saWIvY3VzdG9tL3phbGdvLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvY29sb3JzL2xpYi9tYXBzL2FtZXJpY2EuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9jb2xvcnMvbGliL21hcHMvcmFpbmJvdy5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL2NvbG9ycy9saWIvbWFwcy9yYW5kb20uanMiLCJjb3JlL25vZGVfbW9kdWxlcy9jb2xvcnMvbGliL21hcHMvemVicmEuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9jb2xvcnMvbGliL3N0eWxlcy5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL2NvbG9ycy9saWIvc3lzdGVtL3N1cHBvcnRzLWNvbG9ycy5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL2NvbG9ycy9zYWZlLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvbXNncGFjay1qcy1icm93c2VyL21zZ3BhY2suanMiLCJjb3JlL25vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL21zZ3BhY2suanMiLCJjb3JlL25vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL2luZGV4LmpzIiwiY29yZS9ub2RlX21vZHVsZXMvbXNncGFjay1qcy9ub2RlX21vZHVsZXMvYm9wcy9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL25vZGVfbW9kdWxlcy90by11dGY4L2luZGV4LmpzIiwiY29yZS9ub2RlX21vZHVsZXMvbXNncGFjay1qcy9ub2RlX21vZHVsZXMvYm9wcy90eXBlZGFycmF5L2NvcHkuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL3R5cGVkYXJyYXkvY3JlYXRlLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvbXNncGFjay1qcy9ub2RlX21vZHVsZXMvYm9wcy90eXBlZGFycmF5L2Zyb20uanMiLCJjb3JlL25vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL3R5cGVkYXJyYXkvaXMuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL3R5cGVkYXJyYXkvam9pbi5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL21zZ3BhY2stanMvbm9kZV9tb2R1bGVzL2JvcHMvdHlwZWRhcnJheS9tYXBwZWQuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL3R5cGVkYXJyYXkvcmVhZC5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL21zZ3BhY2stanMvbm9kZV9tb2R1bGVzL2JvcHMvdHlwZWRhcnJheS9zdWJhcnJheS5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL21zZ3BhY2stanMvbm9kZV9tb2R1bGVzL2JvcHMvdHlwZWRhcnJheS90by5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL21zZ3BhY2stanMvbm9kZV9tb2R1bGVzL2JvcHMvdHlwZWRhcnJheS93cml0ZS5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvSW50ZXJhY3Rpb25NYW5hZ2VyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9jb3JlL2dsb2JhbHMuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2Rpc3BsYXkvRGlzcGxheU9iamVjdC5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZGlzcGxheS9EaXNwbGF5T2JqZWN0Q29udGFpbmVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9kaXNwbGF5L01vdmllQ2xpcC5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZGlzcGxheS9TcHJpdGUuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2Rpc3BsYXkvU3RhZ2UuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2Rpc3BsYXkvYmxlbmRNb2Rlcy5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZXZlbnRzL0V2ZW50VGFyZ2V0LmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9leHRyYXMvQ3VzdG9tUmVuZGVyYWJsZS5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZXh0cmFzL1JvcGUuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2V4dHJhcy9TcGluZS5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZXh0cmFzL1N0cmlwLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9leHRyYXMvVGlsaW5nU3ByaXRlLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL0Fic3RyYWN0RmlsdGVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL0JsdXJGaWx0ZXIuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvQmx1clhGaWx0ZXIuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvQmx1cllGaWx0ZXIuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvQ29sb3JNYXRyaXhGaWx0ZXIuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvQ29sb3JTdGVwRmlsdGVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL0Nyb3NzSGF0Y2hGaWx0ZXIuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvRGlzcGxhY2VtZW50RmlsdGVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL0RvdFNjcmVlbkZpbHRlci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9GaWx0ZXJCbG9jay5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9HcmF5RmlsdGVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL0ludmVydEZpbHRlci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9QaXhlbGF0ZUZpbHRlci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9SR0JTcGxpdEZpbHRlci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9TZXBpYUZpbHRlci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9TbWFydEJsdXJGaWx0ZXIuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvVHdpc3RGaWx0ZXIuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2dlb20vQ2lyY2xlLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9nZW9tL0VsbGlwc2UuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2dlb20vUG9pbnQuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2dlb20vUG9seWdvbi5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvZ2VvbS9SZWN0YW5nbGUuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2dlb20vbWF0cml4LmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9pbmRleC5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvbG9hZGVycy9Bc3NldExvYWRlci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvbG9hZGVycy9CaXRtYXBGb250TG9hZGVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9sb2FkZXJzL0ltYWdlTG9hZGVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9sb2FkZXJzL0pzb25Mb2FkZXIuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2xvYWRlcnMvU3BpbmVMb2FkZXIuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL2xvYWRlcnMvU3ByaXRlU2hlZXRMb2FkZXIuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL3BsYXRmb3JtLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9wcmltaXRpdmVzL0dyYXBoaWNzLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9yZW5kZXJlcnMvY2FudmFzL0NhbnZhc1JlbmRlcmVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9yZW5kZXJlcnMvY2FudmFzL2dyYXBoaWNzLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9yZW5kZXJlcnMvd2ViZ2wvUGl4aVNoYWRlci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL1ByaW1pdGl2ZVNoYWRlci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL1N0cmlwU2hhZGVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9yZW5kZXJlcnMvd2ViZ2wvV2ViR0xCYXRjaC5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL1dlYkdMRmlsdGVyTWFuYWdlci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL1dlYkdMUmVuZGVyR3JvdXAuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL3JlbmRlcmVycy93ZWJnbC9XZWJHTFJlbmRlcmVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9yZW5kZXJlcnMvd2ViZ2wvY29tcGlsZS5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL2dyYXBoaWNzLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS9yZW5kZXJlcnMvd2ViZ2wvc2hhZGVycy5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvdGV4dC9CaXRtYXBUZXh0LmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS90ZXh0L1RleHQuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL3RleHR1cmVzL0Jhc2VUZXh0dXJlLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS90ZXh0dXJlcy9SZW5kZXJUZXh0dXJlLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS90ZXh0dXJlcy9UZXh0dXJlLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS91dGlscy9Qb2x5ay5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvdXRpbHMvYXV0b0RldGVjdFJlbmRlcmVyLmpzIiwiY29yZS9ub2RlX21vZHVsZXMvcGl4aS91dGlscy9jb2xvci5qcyIsImNvcmUvbm9kZV9tb2R1bGVzL3BpeGkvdXRpbHMvZGVidWcuanMiLCJjb3JlL25vZGVfbW9kdWxlcy9waXhpL3V0aWxzL3NwaW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4ZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBBdmF0YXIgPSByZXF1aXJlKCcuLi8uLi8uLi9jb3JlL2NsaWVudC9zY3JpcHRzL0F2YXRhci5qcycpO1xuXG52YXIgUGFuemVyID0gZnVuY3Rpb24oKSB7XG5cdEF2YXRhci5jYWxsKHRoaXMpO1x0XG59O1xuUGFuemVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQXZhdGFyLnByb3RvdHlwZSk7XG5cblBhbnplci5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKHBhcmFtcykge1xuXHRcbn07XG5cblBhbnplci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ocGFyYW1zKSB7XG5cdHRoaXMuYm9keS5jaGlsZHJlbi50dXJyZXQuYW5nbGUgKj0gLTE7XG5cdHRoaXMuYm9keS5jaGlsZHJlbi5ib3JkZXIuY2hpbGRyZW4ubGluZS50aW50ID0gKCgweEZGICogcGFyYW1zLmhlYWx0aCkgPDwgOCkgKyAoKDB4RkYgKiAoMS1wYXJhbXMuaGVhbHRoKSkgPDwgMTYpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW56ZXI7IiwibW9kdWxlLmV4cG9ydHM9e1xuICAgIFwiYm9keVwiOiB7XG4gICAgICAgIFwieFwiOiBcIiN4XCIsXG4gICAgICAgIFwieVwiOiBcIiN5XCIsXG4gICAgICAgIFwielwiOiAxMCxcbiAgICAgICAgXCJhbmdsZVwiOiBcIiNhbmdsZVwiLFxuICAgICAgICBcInJhZGl1c1wiOiAyMCxcbiAgICAgICAgXCJjaGlsZHJlblwiOiB7XG4gICAgICAgICAgICBcImJvcmRlclwiOiB7XG4gICAgICAgICAgICAgICAgXCJ5XCI6IC0yMCxcbiAgICAgICAgICAgICAgICBcImNoaWxkcmVuXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJsaW5lXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2NhbGVcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwieFwiOiBcIiNoZWFsdGhcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFwidHVycmV0XCI6IHtcbiAgICAgICAgICAgICAgICBcImFuZ2xlXCI6IFwiIyBzcXJ0KGFicyh0dXJyZXRBbmdsZSkpXCIsXG4gICAgICAgICAgICAgICAgXCJhbmNob3JcIjoge1xuICAgICAgICAgICAgICAgICAgICBcInhcIjogMC41LFxuICAgICAgICAgICAgICAgICAgICBcInlcIjogMC44XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0iLCJtb2R1bGUuZXhwb3J0cz17XG4gICAgXCJuZXR3b3JrXCI6IHtcbiAgICAgICAgXCJob3N0XCI6IFwiaHR0cDovL2xvY2FsaG9zdFwiXG4gICAgfSxcblx0XCJjb250cm9sXCI6IHtcblx0ICAgIFwiaW5wdXRcIjoge1xuXHQgICAgICAgIFwiZnJlcXVlbmN5U2VuZFwiOiAwLjFcblx0ICAgIH1cblx0fSxcblx0XCJtYXBcIjoge1xuXHRcdFwidGlsZXNldFwiOiB7XG5cdFx0XHRcImV4dGVuc2lvblwiOiBcInBuZ1wiXG5cdFx0fVxuXHR9LFxuXHRcImF2YXRhclwiOiB7XG5cdFx0XCJwYXRoXCI6IFwiYXZhdGFycy9cIixcblx0XHRcInNwcml0ZVwiOiB7XG5cdFx0XHRcInBhdGhcIjogXCJtZWRpYS9cIlxuXHRcdH1cblx0fSxcblx0XCJzYW5kYm94XCI6IHtcblx0XHRcImJpbmRcIjoge1xuXHRcdFx0XCJzcXJ0XCI6IFwiTWF0aC5zcXJ0XCIsXG5cdFx0XHRcImFic1wiOiBcIk1hdGguYWJzXCJcblx0XHR9XG5cdH1cbn0iLCIndXNlIHN0cmljdCc7XG5cbnZhciBXb3JsZCA9IHJlcXVpcmUoJy4vc2NyaXB0cy9Xb3JsZC5qcycpO1xuXG52YXIgd29ybGQgPSBuZXcgV29ybGQoKTtcbndvcmxkLnN0YXJ0KCk7IiwidmFyIEF2YXRhck5vZGUgPSByZXF1aXJlKCcuL0F2YXRhck5vZGUuanMnKSxcblx0Y29uZmlnID0gbnVsbDtcblxudmFyIEF2YXRhciA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnJvb3ROb2RlID0gbnVsbDtcblx0Y29uZmlnID0gd2luZG93LmNvbmZpZztcbn07XG5cbkF2YXRhci5wcm90b3R5cGUuX2NyZWF0ZVJvb3ROb2RlID0gZnVuY3Rpb24oc3RydWN0dXJlQ29uZmlnLCBwYXJhbXMpIHtcblx0dmFyIHJvb3ROb2RlTmFtZSA9IE9iamVjdC5rZXlzKHN0cnVjdHVyZUNvbmZpZylbMF0sXG5cdFx0ZGF0YSA9IHN0cnVjdHVyZUNvbmZpZ1tyb290Tm9kZU5hbWVdO1xuXHRcblx0ZGF0YS5uYW1lID0gcm9vdE5vZGVOYW1lO1xuXHR0aGlzLnJvb3ROb2RlID0gbmV3IEF2YXRhck5vZGUoZGF0YSwgcGFyYW1zKTtcblx0dGhpc1tyb290Tm9kZU5hbWVdID0gdGhpcy5yb290Tm9kZTtcbn07XG5cbkF2YXRhci5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbihwYXJhbXMsIHN0cnVjdHVyZUNvbmZpZykge1xuXHR0aGlzLmlkID0gcGFyYW1zLmlkO1xuXHR0aGlzLnR5cGUgPSBwYXJhbXMuaWQ7XG5cdFxuXHRwYXJhbXMueCAqPSBjb25maWcubWFwLmRpc3RhbmNlLnNjYWxlO1xuXHRwYXJhbXMueSAqPSBjb25maWcubWFwLmRpc3RhbmNlLnNjYWxlO1xuXHRcblx0dGhpcy5fY3JlYXRlUm9vdE5vZGUoc3RydWN0dXJlQ29uZmlnLCBwYXJhbXMpO1xuXHR0aGlzLnJvb3ROb2RlLnVwZGF0ZVZhbHVlcyhwYXJhbXMpO1xuXG5cdGlmICh0aGlzLmluaXQpIHRoaXMuaW5pdChwYXJhbXMpO1xuXHRcblx0dGhpcy5yb290Tm9kZS5jcmVhdGVTcHJpdGUoKTtcblx0dGhpcy5yb290Tm9kZS51cGRhdGVTcHJpdGUoKTtcbn07XG5cbkF2YXRhci5wcm90b3R5cGUuX3VwZGF0ZSA9IGZ1bmN0aW9uKHBhcmFtcykge1xuXHRwYXJhbXMueCAqPSBjb25maWcubWFwLmRpc3RhbmNlLnNjYWxlO1xuXHRwYXJhbXMueSAqPSBjb25maWcubWFwLmRpc3RhbmNlLnNjYWxlO1xuXHRcblx0dGhpcy5yb290Tm9kZS51cGRhdGVWYWx1ZXMocGFyYW1zKTtcblx0aWYgKHRoaXMudXBkYXRlKSB0aGlzLnVwZGF0ZShwYXJhbXMpO1xuXHR0aGlzLnJvb3ROb2RlLnVwZGF0ZVNwcml0ZSgpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdmF0YXI7IiwidmFyIGNsYXNzZXMgPSB7fSxcblx0Y29uZmlncyA9IHt9O1xuXG4vLyBAX3JlcXVpcmVBdmF0YXJGb2xkZXJcbi8vIEBfc3RhcnRcbi8vIGNsYXNzZXNbJ0NhciddID0gcmVxdWlyZSgnLi4vLi4vLi4vYXZhdGFycy8vQ2FyL2NsaWVudC9DYXIuanMnKTtcbi8vIGNvbmZpZ3NbJ0NhciddID0gcmVxdWlyZSgnLi4vLi4vLi4vYXZhdGFycy8vQ2FyL2NsaWVudC9jb25maWcuanNvbicpO1xuLy8gY2xhc3Nlc1snTWFuJ10gPSByZXF1aXJlKCcuLi8uLi8uLi9hdmF0YXJzLy9NYW4vY2xpZW50L01hbi5qcycpO1xuLy8gY29uZmlnc1snTWFuJ10gPSByZXF1aXJlKCcuLi8uLi8uLi9hdmF0YXJzLy9NYW4vY2xpZW50L2NvbmZpZy5qc29uJyk7XG5jbGFzc2VzWydQYW56ZXInXSA9IHJlcXVpcmUoJy4uLy4uLy4uL2F2YXRhcnMvL1Bhbnplci9jbGllbnQvUGFuemVyLmpzJyk7XG5jb25maWdzWydQYW56ZXInXSA9IHJlcXVpcmUoJy4uLy4uLy4uL2F2YXRhcnMvL1Bhbnplci9jbGllbnQvY29uZmlnLmpzb24nKTtcbi8vIGNsYXNzZXNbJ1Bhc3NhZ2UnXSA9IHJlcXVpcmUoJy4uLy4uLy4uL2F2YXRhcnMvL1Bhc3NhZ2UvY2xpZW50L1Bhc3NhZ2UuanMnKTtcbi8vIGNvbmZpZ3NbJ1Bhc3NhZ2UnXSA9IHJlcXVpcmUoJy4uLy4uLy4uL2F2YXRhcnMvL1Bhc3NhZ2UvY2xpZW50L2NvbmZpZy5qc29uJyk7XG4vLyBAX2VuZFxuXG5cbnZhciBBdmF0YXJMb2FkZXIgPSBmdW5jdGlvbigpIHtcblx0XG59O1xuXG5BdmF0YXJMb2FkZXIucHJvdG90eXBlLmdldENsYXNzID0gZnVuY3Rpb24odHlwZSkge1xuXHRyZXR1cm4gY2xhc3Nlc1t0eXBlXTtcbn07XG5cbkF2YXRhckxvYWRlci5wcm90b3R5cGUuZ2V0Q29uZmlnID0gZnVuY3Rpb24odHlwZSkge1xuXHRyZXR1cm4gY29uZmlnc1t0eXBlXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXZhdGFyTG9hZGVyOyIsInZhciBTcHJpdGVMb2FkZXIgPSByZXF1aXJlKCcuL1Nwcml0ZUxvYWRlci5qcycpLFxuXHRkZWZhdWx0QXZhdGFyTm9kZSA9IHJlcXVpcmUoJy4vZGVmYXVsdEF2YXRhck5vZGUuanNvbicpLFxuXHRTYW5kYm94ID0gcmVxdWlyZSgnLi9TYW5kYm94LmpzJyksXG5cdGNvbmZpZyA9IG51bGw7XG5cbnZhciBBdmF0YXJOb2RlID0gZnVuY3Rpb24oY29uZkRhdGEsIHBhcmFtcykge1xuXHRjb25maWcgPSB3aW5kb3cuY29uZmlnO1xuXHRcblx0dGhpcy5fc2FuZGJveCA9IG5ldyBTYW5kYm94KCk7XG5cdHRoaXMuX2xvYWRWYWx1ZXModGhpcywgY29uZkRhdGEsIHBhcmFtcyk7XG5cdHRoaXMuY2hpbGRyZW4gPSB7fTtcblx0dGhpcy5wYXJlbnQgPSBudWxsO1xuXHR0aGlzLl9hdmF0YXJUeXBlID0gcGFyYW1zLnR5cGU7XG5cblx0Y29uZkRhdGEuZXh0ZW5kKGRlZmF1bHRBdmF0YXJOb2RlKTtcblxuXHR2YXIgY2hpbGRyZW5Db25mRGF0YSA9IGNvbmZEYXRhLmNoaWxkcmVuO1xuXHR0aGlzLl9jb25mRGF0YSA9IHRoaXMuX3ByZXBhcmVDb25maWcoY29uZkRhdGEpO1xuXG5cdHZhciBzZWxmID0gdGhpcztcblx0aWYgKGNoaWxkcmVuQ29uZkRhdGEpIHtcblx0XHRjaGlsZHJlbkNvbmZEYXRhLmVhY2goZnVuY3Rpb24oY2hpbGROYW1lLCBjaGlsZENvbmZEYXRhKSB7XG5cdFx0XHRjaGlsZENvbmZEYXRhLm5hbWUgPSBjaGlsZE5hbWU7XG5cdFx0XHRcblx0XHRcdHZhciBjaGlsZCA9IG5ldyBBdmF0YXJOb2RlKGNoaWxkQ29uZkRhdGEsIHBhcmFtcyk7XG5cdFx0XHRzZWxmLmNoaWxkcmVuW2NoaWxkTmFtZV0gPSBjaGlsZDtcblx0XHRcdGNoaWxkLnBhcmVudCA9IHNlbGY7XG5cdFx0fSk7XG5cdH1cbn07XG5cbkF2YXRhck5vZGUucHJvdG90eXBlLl9wcmVwYXJlQ29uZmlnID0gZnVuY3Rpb24oY29uZkRhdGEpIHtcblx0ZGVsZXRlIGNvbmZEYXRhLmNoaWxkcmVuO1xuXG5cdHZhciBzZWxmID0gdGhpcztcblx0Y29uZkRhdGEuZWFjaChmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xuXHRcdGlmICgkLmlzT2JqZWN0KHZhbHVlKSkge1xuXHRcdFx0c2VsZi5fcHJlcGFyZUNvbmZpZyh2YWx1ZSk7XG5cdFx0fSBlbHNlIGlmICgkLmlzU3RyaW5nKHZhbHVlKSAmJiB2YWx1ZS5pbmRleE9mKCdAbmFtZScpICE9IC0xKSB7XG5cdFx0XHRjb25mRGF0YVtwcm9wXSA9IHZhbHVlLnJlcGxhY2UoJ0BuYW1lJywgc2VsZi5uYW1lKTtcblx0XHR9IGVsc2UgaWYgKCQuaXNTdHJpbmcodmFsdWUpICYmIHZhbHVlLmNoYXJBdCgwKSA9PSAnIycpIHtcblx0XHRcdGNvbmZEYXRhW3Byb3BdID0gc2VsZi5fc2FuZGJveC5nZXRGdW5jdGlvbih2YWx1ZS5zdWJzdHIoMSkpO1xuXHRcdH1cblx0fSk7XG5cdFxuXHRyZXR1cm4gY29uZkRhdGE7XG59O1xuXG5BdmF0YXJOb2RlLnByb3RvdHlwZS5fY2hpbGRyZW5Gb3JlYWNoID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0dGhpcy5jaGlsZHJlbi5lYWNoKGZ1bmN0aW9uKGNoaWxkTmFtZSwgY2hpbGQpIHtcblx0XHRjYWxsYmFjayhjaGlsZCk7XG5cdH0pO1xufTtcblxuQXZhdGFyTm9kZS5wcm90b3R5cGUuY3JlYXRlU3ByaXRlID0gZnVuY3Rpb24oKSB7XG5cdHZhciBzcHJpdGVMb2FkZXIgPSBuZXcgU3ByaXRlTG9hZGVyKCksXG5cdFx0c2VsZiA9IHRoaXM7XG5cdHRoaXMuX3Nwcml0ZSA9IHNwcml0ZUxvYWRlci5sb2FkKGNvbmZpZy5hdmF0YXIucGF0aCArICcvJyArIHRoaXMuX2F2YXRhclR5cGUgKyAnLycgKyB0aGlzLmltZyk7XG5cdFxuXHR0aGlzLl9jaGlsZHJlbkZvcmVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG5cdFx0Y2hpbGQuY3JlYXRlU3ByaXRlKCk7XG5cdFx0c2VsZi5fc3ByaXRlLmFkZENoaWxkKGNoaWxkLl9zcHJpdGUpO1xuXHR9KTtcbn07XG5cbkF2YXRhck5vZGUucHJvdG90eXBlLl9sb2FkVmFsdWVzID0gZnVuY3Rpb24odGFyZ2V0LCBzb3VyY2UsIHBhcmFtcykge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdHNvdXJjZS5lYWNoKGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdFx0aWYgKHByb3AgPT0gJ2NoaWxkcmVuJykgcmV0dXJuO1xuXHRcdFxuXHRcdGlmICgkLmlzT2JqZWN0KHZhbHVlKSkge1xuXHRcdFx0aWYgKHRhcmdldFtwcm9wXSA9PT0gdW5kZWZpbmVkKSB0YXJnZXRbcHJvcF0gPSB7fTtcblx0XHRcdHNlbGYuX2xvYWRWYWx1ZXModGFyZ2V0W3Byb3BdLCBzb3VyY2VbcHJvcF0sIHBhcmFtcyk7XG5cdFx0fSBlbHNlIGlmICgkLmlzRnVuY3Rpb24odmFsdWUpKSB7XG5cdFx0XHR0YXJnZXRbcHJvcF0gPSB2YWx1ZShwYXJhbXMpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0YXJnZXRbcHJvcF0gPSB2YWx1ZTtcblx0XHR9XG5cdH0pO1xufTtcblxuQXZhdGFyTm9kZS5wcm90b3R5cGUudXBkYXRlVmFsdWVzID0gZnVuY3Rpb24ocGFyYW1zKSB7XG5cdHRoaXMuX2xvYWRWYWx1ZXModGhpcywgdGhpcy5fY29uZkRhdGEsIHBhcmFtcyk7XG5cdFxuXHR0aGlzLl9jaGlsZHJlbkZvcmVhY2goZnVuY3Rpb24oY2hpbGQpIHtcblx0XHRjaGlsZC51cGRhdGVWYWx1ZXMocGFyYW1zKTtcblx0fSk7XG59O1xuXG5BdmF0YXJOb2RlLnByb3RvdHlwZS51cGRhdGVTcHJpdGUgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fc3ByaXRlLnBvc2l0aW9uLnggPSB0aGlzLng7XG5cdHRoaXMuX3Nwcml0ZS5wb3NpdGlvbi55ID0gdGhpcy55O1xuXHR0aGlzLl9zcHJpdGUucG9zaXRpb24ueiA9IHRoaXMuejtcblx0dGhpcy5fc3ByaXRlLnJvdGF0aW9uID0gdGhpcy5hbmdsZTtcblx0dGhpcy5fc3ByaXRlLmFuY2hvci54ID0gdGhpcy5hbmNob3IueDtcblx0dGhpcy5fc3ByaXRlLmFuY2hvci55ID0gdGhpcy5hbmNob3IueTtcblx0dGhpcy5fc3ByaXRlLnNjYWxlLnggPSB0aGlzLnNjYWxlLng7XG5cdHRoaXMuX3Nwcml0ZS5zY2FsZS55ID0gdGhpcy5zY2FsZS55O1xuXHR0aGlzLl9zcHJpdGUudGludCA9IHRoaXMudGludDtcblxuXHR0aGlzLl9jaGlsZHJlbkZvcmVhY2goZnVuY3Rpb24oY2hpbGQpIHtcblx0XHRjaGlsZC51cGRhdGVTcHJpdGUoKTtcblx0fSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF2YXRhck5vZGU7IiwidmFyIFNwcml0ZUxvYWRlciA9IHJlcXVpcmUoJy4vU3ByaXRlTG9hZGVyJyksXG4gICAgY29uZmlnID0gbnVsbDtcblxudmFyIENodW5rID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHRoaXMueCA9IGRhdGEueDtcbiAgICB0aGlzLnkgPSBkYXRhLnk7XG4gICAgdGhpcy5pZCA9IGRhdGEuaWQ7XG4gICAgdGhpcy5fdGlsZXMgPSBkYXRhLnRpbGVzO1xuICAgIHRoaXMuX3Jvb3RHcmFwaGljc05vZGUgPSBudWxsO1xuICAgIGNvbmZpZyA9IHdpbmRvdy5jb25maWc7XG4gICAgXG4gICAgdGhpcy5fY3JlYXRlVGlsZXMoKTtcbn07XG5cbkNodW5rLnByb3RvdHlwZS5fY3JlYXRlVGlsZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3ByaXRlTG9hZGVyID0gbmV3IFNwcml0ZUxvYWRlcigpLFxuICAgICAgICBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgdGhpcy5fcm9vdEdyYXBoaWNzTm9kZSA9IHNwcml0ZUxvYWRlci5sb2FkKCk7XG4gICAgdGhpcy5fcm9vdEdyYXBoaWNzTm9kZS5wb3NpdGlvbi54ID0gdGhpcy54ICogY29uZmlnLm1hcC5jaHVuay5zaXplICogY29uZmlnLm1hcC5jaHVuay50aWxlLnNpemU7XG4gICAgdGhpcy5fcm9vdEdyYXBoaWNzTm9kZS5wb3NpdGlvbi55ID0gdGhpcy55ICogY29uZmlnLm1hcC5jaHVuay5zaXplICogY29uZmlnLm1hcC5jaHVuay50aWxlLnNpemU7XG4gICAgXG4gICAgdGhpcy5fdGlsZXMuZm9yRWFjaChmdW5jdGlvbih0aWxlLCBpKSB7XG4gICAgICAgIGlmICghdGlsZSkgcmV0dXJuO1xuICAgICAgICB2YXIgdGlsZVNwcml0ZSA9IHNwcml0ZUxvYWRlci5sb2FkKGNvbmZpZy5tYXAudGlsZXNldC5wYXRoICsgJy8nICsgdGlsZSArICcuJyArIGNvbmZpZy5tYXAudGlsZXNldC5leHRlbnNpb24pO1xuICAgICAgICAgICAgXG4gICAgICAgIHRpbGVTcHJpdGUucG9zaXRpb24ueCA9IChpICUgY29uZmlnLm1hcC5jaHVuay5zaXplKSAqIGNvbmZpZy5tYXAuY2h1bmsudGlsZS5zaXplO1xuICAgICAgICB0aWxlU3ByaXRlLnBvc2l0aW9uLnkgPSBNYXRoLmZsb29yKGkgLyBjb25maWcubWFwLmNodW5rLnNpemUpICogY29uZmlnLm1hcC5jaHVuay50aWxlLnNpemU7XG4gICAgICAgIHNlbGYuX3Jvb3RHcmFwaGljc05vZGUuYWRkQ2hpbGQodGlsZVNwcml0ZSk7XG4gICAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENodW5rOyIsInZhciBQSVhJID0gcmVxdWlyZSgncGl4aScpO1xuXG52YXIgR3JhcGhpY3MgPSBmdW5jdGlvbigpIHtcblxufTtcblxuR3JhcGhpY3MucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbih3cmFwcGVyRGl2SWQsIHdpZHRoLCBoZWlnaHQsIHN0YXRzKSB7XG4gICAgdGhpcy5fd2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLl9oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdGhpcy5fc3RhZ2UgPSBuZXcgUElYSS5TdGFnZSgweDAwMDAwMCk7XG5cdHRoaXMuX3JlbmRlcmVyID0gUElYSS5hdXRvRGV0ZWN0UmVuZGVyZXIod2lkdGgsIGhlaWdodCk7XG5cdHRoaXMuX3ZpZXdQb3J0ID0gbmV3IFBJWEkuRGlzcGxheU9iamVjdENvbnRhaW5lcigpO1xuXHR0aGlzLl9tYXBQaXZvdCA9IG5ldyBQSVhJLkRpc3BsYXlPYmplY3RDb250YWluZXIoKTtcblxuXHR0aGlzLl93cmFwcGVyRGl2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQod3JhcHBlckRpdklkKTtcbiAgICB0aGlzLl93cmFwcGVyRGl2LmFwcGVuZENoaWxkKHN0YXRzLmRvbUVsZW1lbnQpO1xuICAgIFxuICAgIHRoaXMuX3N0YWdlLmFkZENoaWxkKHRoaXMuX3ZpZXdQb3J0KTtcbiAgICB0aGlzLl93cmFwcGVyRGl2LmFwcGVuZENoaWxkKHRoaXMuX3JlbmRlcmVyLnZpZXcpO1xuICAgIHRoaXMuX3ZpZXdQb3J0LmFkZENoaWxkKHRoaXMuX21hcFBpdm90KTtcbn07XG5cbkdyYXBoaWNzLnByb3RvdHlwZS5nZXRWaWV3RWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9yZW5kZXJlci52aWV3OyAgXG59O1xuXG5cblxuXG5HcmFwaGljcy5wcm90b3R5cGUudmlld1BvcnRGb2N1cyA9IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICB0aGlzLl92aWV3UG9ydC5wb3NpdGlvbi54ID0gdGhpcy5fd2lkdGgvMiAtIHg7XG5cdHRoaXMuX3ZpZXdQb3J0LnBvc2l0aW9uLnkgPSB0aGlzLl9oZWlnaHQvMiAtIHk7XG59O1xuXG5HcmFwaGljcy5wcm90b3R5cGUuZ2V0Vmlld1BvcnRYID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdQb3J0LnBvc2l0aW9uLng7XG59O1xuXG5HcmFwaGljcy5wcm90b3R5cGUuZ2V0Vmlld1BvcnRZID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdQb3J0LnBvc2l0aW9uLnk7XG59O1xuXG5cblxuXG5cblxuR3JhcGhpY3MucHJvdG90eXBlLmFkZEF2YXRhciA9IGZ1bmN0aW9uKGF2YXRhcikge1xuICAgIGlmICghYXZhdGFyKSByZXR1cm47XG4gICAgdGhpcy5fdmlld1BvcnQuYWRkQ2hpbGQoYXZhdGFyLnJvb3ROb2RlLl9zcHJpdGUpO1xufTtcblxuR3JhcGhpY3MucHJvdG90eXBlLmFkZENodW5rID0gZnVuY3Rpb24oY2h1bmspIHtcbiAgICBpZiAoIWNodW5rKSByZXR1cm47XG4gICAgdGhpcy5fbWFwUGl2b3QuYWRkQ2hpbGQoY2h1bmsuX3Jvb3RHcmFwaGljc05vZGUpO1xufTtcblxuR3JhcGhpY3MucHJvdG90eXBlLnJlbW92ZUF2YXRhciA9IGZ1bmN0aW9uKGF2YXRhcikge1xuICAgIGlmICghYXZhdGFyKSByZXR1cm47XG4gICAgdGhpcy5fdmlld1BvcnQucmVtb3ZlQ2hpbGQoYXZhdGFyLnJvb3ROb2RlLl9zcHJpdGUpO1xufTtcblxuR3JhcGhpY3MucHJvdG90eXBlLnJlbW92ZUNodW5rID0gZnVuY3Rpb24oY2h1bmspIHtcbiAgICBpZiAoIWNodW5rKSByZXR1cm47XG4gICAgdGhpcy5fbWFwUGl2b3QucmVtb3ZlQ2hpbGQoY2h1bmsuX3Jvb3RHcmFwaGljc05vZGUpO1xufTtcblxuXG5cblxuXG5HcmFwaGljcy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fc29ydFoodGhpcy5fdmlld1BvcnQpO1xuICAgIHRoaXMuX3JlbmRlcmVyLnJlbmRlcih0aGlzLl9zdGFnZSk7XG59O1xuXG5HcmFwaGljcy5wcm90b3R5cGUuX3NvcnRaID0gZnVuY3Rpb24obm9kZSkge1xuXHRub2RlLmNoaWxkcmVuLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcblx0XHRyZXR1cm4gYS5wb3NpdGlvbi56IC0gYi5wb3NpdGlvbi56O1xuXHR9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gR3JhcGhpY3M7IiwidmFyIENhY2hlZCA9IHJlcXVpcmUoJy4uLy4uL2NvbW1vbi9DYWNoZWQuanMnKTtcblxudmFyIElucHV0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fZHggPSAwO1xuICAgIHRoaXMuX2R5ID0gMDtcbiAgICB0aGlzLm1vdXNlQW5nbGUgPSAwO1xuICAgIHRoaXMuX3ByZXNzZWRLZXlzID0gW107XG4gICAgdGhpcy5fY2FjaGVkID0gbmV3IENhY2hlZCgpO1xufTtcblxuSW5wdXQucHJvdG90eXBlLnNldE9mZnNldCA9IGZ1bmN0aW9uKGR4LCBkeSkge1xuXHR0aGlzLl9keCA9IGR4O1xuXHR0aGlzLl9keSA9IGR5O1xufTtcblxuSW5wdXQucHJvdG90eXBlLnNldFNlbGZBdmF0YXIgPSBmdW5jdGlvbihhdmF0YXIpIHtcblx0dGhpcy5fc2VsZkF2YXRhciA9IGF2YXRhcjtcbn07XG5cbklucHV0LnByb3RvdHlwZS5nZXRTZWxlY3RBdmF0YXIgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHRoaXMuX3NlbGVjdEF2YXRhcjtcbn07XG5cbklucHV0LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKHZpZXdFbGVtZW50LCBhdmF0YXJzKSB7XG5cdHZhciByZW5kZXJlclJlY3QgPSB2aWV3RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcblx0XHR3aWR0aCA9IHZpZXdFbGVtZW50LndpZHRoLFxuXHRcdGhlaWdodCA9IHZpZXdFbGVtZW50LmhlaWdodCxcbiAgICAgICAgc2VsZiA9IHRoaXM7XG5cblx0dmlld0VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgIHNlbGYubW91c2VYID0gZXZlbnQuY2xpZW50WCAtIHJlbmRlcmVyUmVjdC5sZWZ0O1xuXHRcdHNlbGYubW91c2VZID0gZXZlbnQuY2xpZW50WSAtIHJlbmRlcmVyUmVjdC50b3A7XG5cdCAgICBzZWxmLm1vdXNlQW5nbGUgPSBNYXRoLmF0YW4yKHNlbGYubW91c2VZIC0gaGVpZ2h0LzIsIHNlbGYubW91c2VYIC0gd2lkdGgvMik7XG5cdH0sIGZhbHNlKTtcblxuXHR2aWV3RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBtb3VzZVggPSBldmVudC5jbGllbnRYIC0gcmVuZGVyZXJSZWN0LmxlZnQsXG5cdFx0ICAgIG1vdXNlWSA9IGV2ZW50LmNsaWVudFkgLSByZW5kZXJlclJlY3QudG9wO1xuXHRcdCAgICBcblx0ICAgIHNlbGYuX3NlbGVjdEF2YXRhciA9IG51bGw7XG5cdCAgIFx0YXZhdGFycy5zb21lKGZ1bmN0aW9uKGF2YXRhcikge1xuXHQgICBcdCAgICBpZiAoYXZhdGFyICE9IHNlbGYuX3NlbGZBdmF0YXIgJiZcblx0ICAgXHQgICAgICAgIE1hdGgucG93KGF2YXRhci5yb290Tm9kZS5fc3ByaXRlLnBvc2l0aW9uLnggLSBtb3VzZVggKyBzZWxmLl9keCwgMikgK1xuXHQgICBcdCAgICAgICAgTWF0aC5wb3coYXZhdGFyLnJvb3ROb2RlLl9zcHJpdGUucG9zaXRpb24ueSAtIG1vdXNlWSArIHNlbGYuZHksIDIpIDxcblx0ICAgXHQgICAgICAgIE1hdGgucG93KGF2YXRhci5yb290Tm9kZS5yYWRpdXMsIDIpKSB7XG5cdCAgIFx0ICAgICAgICAgICAgXG5cdCAgICBcdFx0c2VsZi5fc2VsZkF2YXRhciA9IGF2YXRhcjtcblx0ICAgIFx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIFx0fVxuXHQgICBcdH0pO1xuICAgIH0sIGZhbHNlKTtcblxuICAgIHZpZXdFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBmdW5jdGlvbihldmVudCkge1xuXG4gICAgfSwgZmFsc2UpO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBzZWxmLl9wcmVzc2VkS2V5c1tldmVudC5rZXlDb2RlXSA9IHRydWU7XG4gICAgfSwgZmFsc2UpO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgc2VsZi5fcHJlc3NlZEtleXNbZXZlbnQua2V5Q29kZV0gPSBmYWxzZTtcbiAgICB9LCBmYWxzZSk7XG59O1xuXG5JbnB1dC5wcm90b3R5cGUua2V5SXNQcmVzc2VkID0gZnVuY3Rpb24oa2V5Q29kZSkge1xuXHRpZiAoJC5pc1N0cmluZyhrZXlDb2RlKSlcblx0XHRrZXlDb2RlID0ga2V5Q29kZS50b1VwcGVyQ2FzZSgpLmNoYXJDb2RlQXQoMCk7XG5cdHJldHVybiAhIXRoaXMuX3ByZXNzZWRLZXlzW2tleUNvZGVdO1xufTtcblxuSW5wdXQucHJvdG90eXBlLmdldElucHV0RGF0YSA9IGZ1bmN0aW9uKCkge1xuXHR2YXIgaW5wdXQgPSB7XG5cdFx0YW5nbGU6IHRoaXMubW91c2VBbmdsZSxcblx0XHR1cDogdGhpcy5rZXlJc1ByZXNzZWQoJ1cnKSxcblx0XHRkb3duOiB0aGlzLmtleUlzUHJlc3NlZCgnUycpLFxuXHRcdGxlZnQ6IHRoaXMua2V5SXNQcmVzc2VkKCdBJyksXG5cdFx0cmlnaHQ6IHRoaXMua2V5SXNQcmVzc2VkKCdEJyksXG5cdFx0aW5PdXQ6IHRoaXMua2V5SXNQcmVzc2VkKCdFJykgJiZcblx0XHRcdHRoaXMuZ2V0U2VsZWN0QXZhdGFyKCkgJiZcblx0XHRcdHRoaXMuZ2V0U2VsZWN0QXZhdGFyKCkuaWRcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5fY2FjaGVkLmNsZWFuKGlucHV0LCAnaW5wdXQnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gSW5wdXQ7IiwidmFyIFBhY2sgPSByZXF1aXJlKCcuLi8uLi9jb21tb24vUGFjay5qcycpO1xuXG52YXIgY29uZmlnID0gbnVsbDtcblxudmFyIE5ldHdvcmsgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9ldmVudENhbGxiYWNrcyA9IFtdO1xuICAgIHRoaXMuX3NvY2tldCA9IG51bGw7XG4gICAgdGhpcy5fcGFjayA9IG5ldyBQYWNrKCk7XG4gICAgXG4gICAgY29uZmlnID0gd2luZG93LmNvbmZpZztcbn07XG5cbk5ldHdvcmsucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9zb2NrZXQgPSBpbygpO1xufTtcblxuTmV0d29yay5wcm90b3R5cGUub24gPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBcbiAgICB0aGlzLl9zb2NrZXQub24obmFtZSwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgZGVjb2RlZERhdGEgPSBzZWxmLl9wYWNrLmRlY29kZShkYXRhKTtcbiAgICAgICAgY2FsbGJhY2suY2FsbChzZWxmLCBkZWNvZGVkRGF0YSwgdGhpcyk7XG4gICAgfSk7XG59O1xuXG5OZXR3b3JrLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24obmFtZSwgZGF0YSkge1xuICAgIGlmICghdGhpcy5fc29ja2V0KSByZXR1cm47XG4gICAgXG4gICAgdmFyIGVuY29kZWREYXRhID0gdGhpcy5fcGFjay5lbmNvZGUoZGF0YSk7XG4gICAgdGhpcy5fc29ja2V0LmVtaXQobmFtZSwgZW5jb2RlZERhdGEpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBOZXR3b3JrO1xuIiwidmFyIGxvZ2dlciA9IG51bGwsXG4gICAgY29uZmlnID0gbnVsbDtcblxudmFyIFNhbmRib3ggPSBmdW5jdGlvbigpIHtcbiAgICBsb2dnZXIgPSB3aW5kb3cubG9nZ2VyO1xuICAgIGNvbmZpZyA9IHdpbmRvdy5jb25maWc7XG59O1xuXG5TYW5kYm94LnByb3RvdHlwZS5nZXRGdW5jdGlvbiA9IGZ1bmN0aW9uKGV4cHJlc3Npb24pIHtcbiAgICB2YXIgZGF0YU9iamVjdE5hbWUgPSAncGFyYW1zJztcbiAgICBcbiAgICB2YXIgcHJlcGFyZWRFeHByZXNzaW9uID0gZXhwcmVzc2lvblxuICAgICAgICAucmVwbGFjZSgvXFxbfF18e3x9fGB8dmFyfGZ1bmN0aW9ufG5ld3x0aHJvd3xkZWxldGV8ZGVidWdnZXJ8d2luZG93fHRoaXN8aWZ8d2hpbGV8Zm9yfGNhc2UvZywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9bYS16QS1aXyRdWzAtOWEtekEtWl8kXSovZywgZnVuY3Rpb24odmFyTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFPYmplY3ROYW1lICsgJy4nICsgdmFyTmFtZTsgXG4gICAgICAgIH0pO1xuICAgIFxuICAgIGNvbmZpZy5zYW5kYm94LmJpbmQuZWFjaChmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgICBwcmVwYXJlZEV4cHJlc3Npb24gPSBwcmVwYXJlZEV4cHJlc3Npb24ucmVwbGFjZShcbiAgICAgICAgICAgIG5ldyBSZWdFeHAoZGF0YU9iamVjdE5hbWUgKyAnLicgKyBuYW1lLCAnZycpLCB2YWx1ZVxuICAgICAgICApO1xuICAgIH0pO1xuICAgIFxuICAgIHByZXBhcmVkRXhwcmVzc2lvbiA9ICdyZXR1cm4gKCcgKyBwcmVwYXJlZEV4cHJlc3Npb24gKyAnKTsnO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgRnVuY3Rpb24oZGF0YU9iamVjdE5hbWUsIHByZXBhcmVkRXhwcmVzc2lvbik7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ0luY29ycmVjdCBhdmF0YXIgbm9kZSBmdW5jdGlvbjogJyArIGV4cHJlc3Npb24pO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNhbmRib3g7IiwidmFyIFBJWEkgPSByZXF1aXJlKCdwaXhpJyk7XG5cbnZhciBTcHJpdGVMb2FkZXIgPSBmdW5jdGlvbigpIHtcblx0XG59O1xuXG5TcHJpdGVMb2FkZXIuX3RleHR1cmVzID0ge307XG5cblNwcml0ZUxvYWRlci5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKGZpbGVOYW1lKSB7XG5cdGlmIChmaWxlTmFtZSkge1xuXHRcdGZpbGVOYW1lID0gZmlsZU5hbWUucmVwbGFjZSgvXFwvKy9nLCAnLycpO1xuXHRcdFxuXHRcdGlmICghU3ByaXRlTG9hZGVyLl90ZXh0dXJlc1tmaWxlTmFtZV0pIHtcblx0XHRcdFNwcml0ZUxvYWRlci5fdGV4dHVyZXNbZmlsZU5hbWVdID0gUElYSS5UZXh0dXJlLmZyb21JbWFnZShmaWxlTmFtZSk7XG5cdFx0fVxuXHRcdFxuXHRcdHZhciB0ZXh0dXJlID0gU3ByaXRlTG9hZGVyLl90ZXh0dXJlc1tmaWxlTmFtZV07XG5cdFx0cmV0dXJuIG5ldyBQSVhJLlNwcml0ZSh0ZXh0dXJlKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gbmV3IFBJWEkuRGlzcGxheU9iamVjdENvbnRhaW5lcigpO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNwcml0ZUxvYWRlcjsiLCJyZXF1aXJlKCcuLi8uLi9jb21tb24vdXRpbC5qcycpO1xuXG52YXIgQXZhdGFyTG9hZGVyID0gcmVxdWlyZSgnLi9BdmF0YXJMb2FkZXIuanMnKSxcbiAgICBTdGF0cyA9IHJlcXVpcmUoJy4vc3RhdHMuanMnKSxcbiAgICBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MuanMnKSxcbiAgICBJbnB1dCA9IHJlcXVpcmUoJy4vSW5wdXQuanMnKSxcbiAgICBOZXR3b3JrID0gcmVxdWlyZSgnLi9OZXR3b3JrLmpzJyksXG4gICAgQ2h1bmsgPSByZXF1aXJlKCcuL0NodW5rLmpzJyksXG4gICAgbG9jYWxDb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcuanNvbicpLFxuXHRnbG9iYWxDb25maWcgPSByZXF1aXJlKCcuLi8uLi9jb21tb24vY29uZmlnLmpzb24nKSxcblx0TG9nZ2VyID0gcmVxdWlyZSgnLi4vLi4vY29tbW9uL0xvZ2dlci5qcycpLFxuXHRDYWNoZWQgPSByZXF1aXJlKCcuLi8uLi9jb21tb24vQ2FjaGVkLmpzJyksXG5cdGxvZ2dlciA9IG51bGwsXG4gICAgY29uZmlnID0gbnVsbCxcbiAgICBzZWxmID0gbnVsbDtcblxudmFyIFdvcmxkID0gZnVuY3Rpb24oKSB7XG4gICAgY29uZmlnID0gd2luZG93LmNvbmZpZyA9IGdsb2JhbENvbmZpZy5leHRlbmQobG9jYWxDb25maWcpO1xuICAgIGxvZ2dlciA9IHdpbmRvdy5sb2dnZXIgPSBuZXcgTG9nZ2VyKCk7XG4gICAgc2VsZiA9IHRoaXM7XG4gICAgXG4gICAgbG9nZ2VyLmluZm8oJ0NyZWF0aW5nIHdvcmxkJyk7XG4gICAgXG4gICAgdGhpcy5fYXZhdGFycyA9IFtdO1xuICAgIHRoaXMuX2ZyYW1lQ291bnRlciA9IDA7XG4gICAgdGhpcy5fc3RhdHMgPSBuZXcgU3RhdHMoKTtcbiAgICBsb2dnZXIuaW5mbygnSW5pdCBncmFwaGljcyBtb2R1bGUnKTtcbiAgICB0aGlzLl9ncmFwaGljcyA9IG5ldyBHcmFwaGljcygpO1xuICAgIHRoaXMuX2NvbnRyb2xBdmF0YXIgPSBudWxsO1xuICAgIGxvZ2dlci5pbmZvKCdJbml0IGlucHV0IG1vZHVsZScpO1xuICAgIHRoaXMuX2lucHV0ID0gbmV3IElucHV0KCk7XG4gICAgbG9nZ2VyLmluZm8oJ0luaXQgbmV0d29yayBtb2R1bGUnKTtcbiAgICB0aGlzLl9uZXR3b3JrID0gbmV3IE5ldHdvcmsoKTtcbiAgICB0aGlzLl9jaHVua3MgPSBbXTtcbiAgICB0aGlzLl9jYWNoZWQgPSBuZXcgQ2FjaGVkKCk7XG4gICAgXG4gICAgdGhpcy5fZnJhbWVGcmVxdWVuY3lJbnB1dFNlbmQgPSBNYXRoLmZsb29yKGNvbmZpZy5jb250cm9sLmlucHV0LmZyZXF1ZW5jeVNlbmQgKiA2MCk7XG4gICAgaWYgKHRoaXMuX2ZyYW1lRnJlcXVlbmN5SW5wdXRTZW5kID09PSAwKSB0aGlzLl9mcmFtZUZyZXF1ZW5jeUlucHV0U2VuZCA9IDE7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICBsb2dnZXIuaW5mbygnU3RhcnRpbmcgd29ybGQnKTtcbiAgICBcbiAgICBsb2dnZXIuaW5mbygnTmV0d29yayBjb25uZWN0Jyk7XG4gICAgdGhpcy5fbmV0d29yay5jb25uZWN0KCk7XG4gICAgdGhpcy5fc3RhdHMuc2V0TW9kZSgyKTtcbiAgICBsb2dnZXIuaW5mbygnR3JhcGhpY3MgaW5pdCcpO1xuICAgIHRoaXMuX2dyYXBoaWNzLmluaXQoJ2NlbnRlckRpdicsIDY0MCwgNDgwLCB0aGlzLl9zdGF0cyk7XG4gICAgbG9nZ2VyLmluZm8oJ0lucHV0IGluaXQnKTtcbiAgICB0aGlzLl9pbnB1dC5pbml0KHRoaXMuX2dyYXBoaWNzLmdldFZpZXdFbGVtZW50KCksIHRoaXMuX2F2YXRhcnMpO1xuICAgIFxuICAgIHRoaXMuX25ldHdvcmsub24oY29uZmlnLm5ldHdvcmsubWVzc2FnZXMubmV3Q2h1bmssIHRoaXMub25OZXdDaHVuayk7XG4gICAgdGhpcy5fbmV0d29yay5vbihjb25maWcubmV0d29yay5tZXNzYWdlcy5yZW1vdmVDaHVuaywgdGhpcy5vblJlbW92ZUNodW5rKTtcbiAgICB0aGlzLl9uZXR3b3JrLm9uKGNvbmZpZy5uZXR3b3JrLm1lc3NhZ2VzLm5ld0F2YXRhciwgdGhpcy5vbk5ld0F2YXRhcik7XG4gICAgdGhpcy5fbmV0d29yay5vbihjb25maWcubmV0d29yay5tZXNzYWdlcy5yZW1vdmVBdmF0YXIsIHRoaXMub25SZW1vdmVBdmF0YXIpO1xuICAgIHRoaXMuX25ldHdvcmsub24oY29uZmlnLm5ldHdvcmsubWVzc2FnZXMuc2V0Q29udHJvbEF2YXRhciwgdGhpcy5vblNldENvbnRyb2xBdmF0YXIpO1xuICAgIHRoaXMuX25ldHdvcmsub24oY29uZmlnLm5ldHdvcmsubWVzc2FnZXMudXBkYXRlQXZhdGFyLCB0aGlzLm9uVXBkYXRlQXZhdGFyKTtcbiAgICBcbiAgICB0aGlzLl9uZXR3b3JrLnNlbmQoY29uZmlnLm5ldHdvcmsubWVzc2FnZXMudXNlckxvZ2luLCB7XG4gICAgICAgIGxvZ2luOiAnZGVuaXMnLFxuICAgICAgICBwYXNzd2Q6ICdxd2UnXG4gICAgfSk7XG4gICAgXG4gICAgbG9nZ2VyLmluZm8oJ1N0YXJ0IHVwZGF0ZSB3b3JsZCBtYWluIGxvb3AnKTtcbiAgICB0aGlzLl9zdGVwKCk7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUub25VcGRhdGVBdmF0YXIgPSBmdW5jdGlvbihkYXRhLCBzb2NrZXQpIHtcbiAgICBpZiAoIWRhdGEgfHwgIWRhdGEuaWQpIHJldHVybjtcbiAgICBcbiAgICBkYXRhID0gc2VsZi5fY2FjaGVkLnJlc3RvcmUoZGF0YSwgJ2F2YXRhclVwZFBhcmFtc18nICsgZGF0YS5pZCk7XG4gICAgdmFyIGF2YXRhciA9IHNlbGYuZ2V0QXZhdGFyKGRhdGEuaWQpO1xuICAgIGlmICghYXZhdGFyKSByZXR1cm47XG4gICAgXG4gICAgYXZhdGFyLl91cGRhdGUoZGF0YSk7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUub25OZXdDaHVuayA9IGZ1bmN0aW9uKGRhdGEsIHNvY2tldCkge1xuICAgIGxvZ2dlci5pbmZvKCdOZXcgY2h1bmsgZXZlbnQsIGRhdGEgPSAnKTtcbiAgICBsb2dnZXIubG9nKGRhdGEpO1xuICAgIFxuICAgIGlmICghZGF0YSB8fCAhZGF0YS5pZCkgcmV0dXJuO1xuICAgIGlmIChzZWxmLl9jaHVua3NbZGF0YS5pZF0pIHNlbGYub25SZW1vdmVDaHVuaygpO1xuICAgIFxuICAgIHZhciBjaHVuayA9IG5ldyBDaHVuayhkYXRhKTtcbiAgICBzZWxmLl9jaHVua3NbZGF0YS5pZF0gPSBjaHVuaztcbiAgICBzZWxmLl9ncmFwaGljcy5hZGRDaHVuayhjaHVuayk7XG4gICAgXG4gICAgaWYgKCFkYXRhLmF2YXRhcnMpIHJldHVybjtcbiAgICBkYXRhLmF2YXRhcnMuZm9yRWFjaChmdW5jdGlvbiAoYXZhdGFyRGF0YSkge1xuICAgICAgICB2YXIgYXZhdGFyID0gc2VsZi5jcmVhdGVBdmF0YXIoYXZhdGFyRGF0YSk7XG4gICAgICAgIHNlbGYuYWRkQXZhdGFyKGF2YXRhcik7XG4gICAgfSk7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUub25SZW1vdmVDaHVuayA9IGZ1bmN0aW9uKGRhdGEsIHNvY2tldCkge1xuICAgIGxvZ2dlci5pbmZvKCdSZW1vdmUgY2h1bmsgZXZlbnQsIGRhdGEgPSAnKTtcbiAgICBsb2dnZXIubG9nKGRhdGEpO1xuICAgIFxuICAgIGlmICghZGF0YSB8fCAhZGF0YS5pZCB8fCAhdGhpcy5fY2h1bmtzW2RhdGEuaWRdKSByZXR1cm47XG4gICAgXG4gICAgc2VsZi5fZ3JhcGhpY3MucmVtb3ZlQ2h1bmsoc2VsZi5fY2h1bmtzW2RhdGEuaWRdKTtcbiAgICBkZWxldGUgc2VsZi5fY2h1bmtzW2RhdGEuaWRdO1xuICAgIFxuICAgIGlmICghZGF0YS5hdmF0YXJzKSByZXR1cm47XG4gICAgZGF0YS5hdmF0YXJzLmZvckVhY2goZnVuY3Rpb24gKGF2YXRhckRhdGEpIHtcbiAgICAgICAgdmFyIGF2YXRhciA9IHNlbGYuZ2V0QXZhdGFyKGF2YXRhckRhdGEuaWQpO1xuICAgICAgICBzZWxmLnJlbW92ZUF2YXRhcihhdmF0YXIpO1xuICAgIH0pO1xufTtcblxuV29ybGQucHJvdG90eXBlLm9uTmV3QXZhdGFyID0gZnVuY3Rpb24oZGF0YSwgc29ja2V0KSB7XG4gICAgbG9nZ2VyLmluZm8oJ05ldyBhdmF0YXIgZXZlbnQsIGRhdGEgPSAnKTtcbiAgICBsb2dnZXIubG9nKGRhdGEpO1xuICAgIFxuICAgIHZhciBhdmF0YXIgPSBzZWxmLmNyZWF0ZUF2YXRhcihkYXRhKTtcbiAgICBzZWxmLmFkZEF2YXRhcihhdmF0YXIpO1xufTtcblxuV29ybGQucHJvdG90eXBlLm9uUmVtb3ZlQXZhdGFyID0gZnVuY3Rpb24oZGF0YSwgc29ja2V0KSB7XG4gICAgbG9nZ2VyLmluZm8oJ1JlbW92ZSBhdmF0YXIgZXZlbnQsIGRhdGEgPSAnKTtcbiAgICBsb2dnZXIubG9nKGRhdGEpO1xuICAgIFxuICAgIHZhciBhdmF0YXIgPSBzZWxmLmdldEF2YXRhcihkYXRhLmlkKTtcbiAgICBzZWxmLnJlbW92ZUF2YXRhcihhdmF0YXIpO1xufTtcblxuV29ybGQucHJvdG90eXBlLm9uU2V0Q29udHJvbEF2YXRhciA9IGZ1bmN0aW9uKGF2YXRhcklkLCBzb2NrZXQpIHtcbiAgICBsb2dnZXIuaW5mbygnU2V0IGNvbnRyb2wgYXZhdGFyIGV2ZW50LCBpZCA9ICcpO1xuICAgIGxvZ2dlci5sb2coYXZhdGFySWQpO1xuICAgIFxuICAgIHNlbGYuX2NvbnRyb2xBdmF0YXIgPSBzZWxmLmdldEF2YXRhcihhdmF0YXJJZCk7XG59O1xuXG5cblxuV29ybGQucHJvdG90eXBlLmdldEF2YXRhciA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgaWYgKCFpZCkgcmV0dXJuO1xuICAgIFxuICAgIHJldHVybiB0aGlzLl9hdmF0YXJzW2lkXTsgIFxufTtcblxuV29ybGQucHJvdG90eXBlLnJlbW92ZUF2YXRhciA9IGZ1bmN0aW9uKGF2YXRhcikge1xuICAgIGlmICghYXZhdGFyIHx8ICFhdmF0YXIuaWQpIHJldHVybjtcbiAgICBcbiAgICB0aGlzLl9ncmFwaGljcy5yZW1vdmVBdmF0YXIoYXZhdGFyLmlkKTtcbiAgICBkZWxldGUgdGhpcy5fYXZhdGFyc1thdmF0YXIuaWRdOyAgXG59O1xuXG5Xb3JsZC5wcm90b3R5cGUuYWRkQXZhdGFyID0gZnVuY3Rpb24oYXZhdGFyKSB7XG4gICAgaWYgKCFhdmF0YXIgfHwgIWF2YXRhci5pZCkgcmV0dXJuO1xuICAgIFxuICAgIHRoaXMuX2F2YXRhcnNbYXZhdGFyLmlkXSA9IGF2YXRhcjtcbiAgICB0aGlzLl9ncmFwaGljcy5hZGRBdmF0YXIoYXZhdGFyKTtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5jcmVhdGVBdmF0YXIgPSBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICB2YXIgdHlwZSA9IHBhcmFtcy50eXBlLFxuICAgICAgICBpZCA9IHBhcmFtcy5pZDtcbiAgICAgICAgXG4gICAgaWYgKCF0eXBlIHx8ICFpZCB8fCB0aGlzLmdldEF2YXRhcihpZCkpIHJldHVybjtcbiAgICBcbiAgICB2YXIgYXZhdGFyTG9hZGVyID0gbmV3IEF2YXRhckxvYWRlcigpLFxuICAgICAgICBhdmF0YXJDbGFzcyA9IGF2YXRhckxvYWRlci5nZXRDbGFzcyh0eXBlKSxcbiAgICAgICAgYXZhdGFyQ29uZmlnID0gYXZhdGFyTG9hZGVyLmdldENvbmZpZyh0eXBlKTtcbiAgICAgICAgXG4gICAgaWYgKCFhdmF0YXJDbGFzcyB8fCAhYXZhdGFyQ29uZmlnKSByZXR1cm47XG4gICAgXG4gICAgdmFyIGF2YXRhciA9IG5ldyBhdmF0YXJDbGFzcygpO1xuICAgIGF2YXRhci5faW5pdChwYXJhbXMsIGF2YXRhckNvbmZpZyk7XG4gICAgXG4gICAgcmV0dXJuIGF2YXRhcjtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5fc3RlcCA9IGZ1bmN0aW9uKCkge1xuICAgIHNlbGYuX3N0YXRzLmJlZ2luKCk7XG4gICAgc2VsZi5fdXBkYXRlRnVuY3Rpb24oKTtcbiAgICBzZWxmLl9zdGF0cy5lbmQoKTtcbiAgICBcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHNlbGYuX3N0ZXApO1xufTtcblxuXG5Xb3JsZC5wcm90b3R5cGUuX3VwZGF0ZUZ1bmN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fZnJhbWVDb3VudGVyKys7XG4gICAgXG4gICAgaWYodGhpcy5fZnJhbWVDb3VudGVyICUgdGhpcy5fZnJhbWVGcmVxdWVuY3lJbnB1dFNlbmQpIHtcblx0XHR2YXIgaW5wdXREYXRhID0gdGhpcy5faW5wdXQuZ2V0SW5wdXREYXRhKCk7XG5cdFx0aWYgKCFpbnB1dERhdGEuaXNFbXB0eSgpKSB0aGlzLl9uZXR3b3JrLnNlbmQoY29uZmlnLm5ldHdvcmsubWVzc2FnZXMudXNlcklucHV0LCBpbnB1dERhdGEpO1xuXHR9XG5cblx0aWYgKHRoaXMuX2NvbnRyb2xBdmF0YXIpIHtcblx0XHR0aGlzLl9ncmFwaGljcy52aWV3UG9ydEZvY3VzKHRoaXMuX2NvbnRyb2xBdmF0YXIucm9vdE5vZGUueCwgdGhpcy5fY29udHJvbEF2YXRhci5yb290Tm9kZS55KTtcblx0fVxuXG5cdHRoaXMuX2lucHV0LnNldE9mZnNldCh0aGlzLl9ncmFwaGljcy5nZXRWaWV3UG9ydFgoKSwgdGhpcy5fZ3JhcGhpY3MuZ2V0Vmlld1BvcnRZKCkpO1xuXHRcblx0dGhpcy5fZ3JhcGhpY3MucmVuZGVyKCk7XG59O1xuICAgIFxubW9kdWxlLmV4cG9ydHMgPSBXb3JsZDsiLCJtb2R1bGUuZXhwb3J0cz17XG4gICAgXCJ4XCI6IDAsXG4gICAgXCJ5XCI6IDAsXG4gICAgXCJ6XCI6IDEwLFxuICAgIFwiYW5nbGVcIjogMCxcbiAgICBcInJhZGl1c1wiOiAyMCxcbiAgICBcImFuY2hvclwiOiB7XG4gICAgICAgIFwieFwiOiAwLjUsXG4gICAgICAgIFwieVwiOiAwLjVcbiAgICB9LFxuICAgIFwic2NhbGVcIjoge1xuICAgICAgICBcInhcIjogMSxcbiAgICAgICAgXCJ5XCI6IDFcbiAgICB9LFxuICAgIFwidGludFwiOiAweEZGRkZGRixcbiAgICBcImltZ1wiOiBcIkBuYW1lLnBuZ1wiXG59IiwiLy8gc3RhdHMuanMgLSBodHRwOi8vZ2l0aHViLmNvbS9tcmRvb2Ivc3RhdHMuanNcbnZhciBTdGF0cz1mdW5jdGlvbigpe3ZhciBsPURhdGUubm93KCksbT1sLGc9MCxuPUluZmluaXR5LG89MCxoPTAscD1JbmZpbml0eSxxPTAscj0wLHM9MCxmPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Zi5pZD1cInN0YXRzXCI7Zi5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsZnVuY3Rpb24oYil7Yi5wcmV2ZW50RGVmYXVsdCgpO3QoKytzJTIpfSwhMSk7Zi5zdHlsZS5jc3NUZXh0PVwid2lkdGg6ODBweDtvcGFjaXR5OjAuOTtjdXJzb3I6cG9pbnRlclwiO3ZhciBhPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7YS5pZD1cImZwc1wiO2Euc3R5bGUuY3NzVGV4dD1cInBhZGRpbmc6MCAwIDNweCAzcHg7dGV4dC1hbGlnbjpsZWZ0O2JhY2tncm91bmQtY29sb3I6IzAwMlwiO2YuYXBwZW5kQ2hpbGQoYSk7dmFyIGk9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtpLmlkPVwiZnBzVGV4dFwiO2kuc3R5bGUuY3NzVGV4dD1cImNvbG9yOiMwZmY7Zm9udC1mYW1pbHk6SGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWY7Zm9udC1zaXplOjlweDtmb250LXdlaWdodDpib2xkO2xpbmUtaGVpZ2h0OjE1cHhcIjtcbmkuaW5uZXJIVE1MPVwiRlBTXCI7YS5hcHBlbmRDaGlsZChpKTt2YXIgYz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2MuaWQ9XCJmcHNHcmFwaFwiO2Muc3R5bGUuY3NzVGV4dD1cInBvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjc0cHg7aGVpZ2h0OjMwcHg7YmFja2dyb3VuZC1jb2xvcjojMGZmXCI7Zm9yKGEuYXBwZW5kQ2hpbGQoYyk7NzQ+Yy5jaGlsZHJlbi5sZW5ndGg7KXt2YXIgaj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtqLnN0eWxlLmNzc1RleHQ9XCJ3aWR0aDoxcHg7aGVpZ2h0OjMwcHg7ZmxvYXQ6bGVmdDtiYWNrZ3JvdW5kLWNvbG9yOiMxMTNcIjtjLmFwcGVuZENoaWxkKGopfXZhciBkPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7ZC5pZD1cIm1zXCI7ZC5zdHlsZS5jc3NUZXh0PVwicGFkZGluZzowIDAgM3B4IDNweDt0ZXh0LWFsaWduOmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMDIwO2Rpc3BsYXk6bm9uZVwiO2YuYXBwZW5kQ2hpbGQoZCk7dmFyIGs9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbmsuaWQ9XCJtc1RleHRcIjtrLnN0eWxlLmNzc1RleHQ9XCJjb2xvcjojMGYwO2ZvbnQtZmFtaWx5OkhlbHZldGljYSxBcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZTo5cHg7Zm9udC13ZWlnaHQ6Ym9sZDtsaW5lLWhlaWdodDoxNXB4XCI7ay5pbm5lckhUTUw9XCJNU1wiO2QuYXBwZW5kQ2hpbGQoayk7dmFyIGU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtlLmlkPVwibXNHcmFwaFwiO2Uuc3R5bGUuY3NzVGV4dD1cInBvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjc0cHg7aGVpZ2h0OjMwcHg7YmFja2dyb3VuZC1jb2xvcjojMGYwXCI7Zm9yKGQuYXBwZW5kQ2hpbGQoZSk7NzQ+ZS5jaGlsZHJlbi5sZW5ndGg7KWo9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIiksai5zdHlsZS5jc3NUZXh0PVwid2lkdGg6MXB4O2hlaWdodDozMHB4O2Zsb2F0OmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMTMxXCIsZS5hcHBlbmRDaGlsZChqKTt2YXIgdD1mdW5jdGlvbihiKXtzPWI7c3dpdGNoKHMpe2Nhc2UgMDphLnN0eWxlLmRpc3BsYXk9XG5cImJsb2NrXCI7ZC5zdHlsZS5kaXNwbGF5PVwibm9uZVwiO2JyZWFrO2Nhc2UgMTphLnN0eWxlLmRpc3BsYXk9XCJub25lXCIsZC5zdHlsZS5kaXNwbGF5PVwiYmxvY2tcIn19O3JldHVybntSRVZJU0lPTjoxMSxkb21FbGVtZW50OmYsc2V0TW9kZTp0LGJlZ2luOmZ1bmN0aW9uKCl7bD1EYXRlLm5vdygpfSxlbmQ6ZnVuY3Rpb24oKXt2YXIgYj1EYXRlLm5vdygpO2c9Yi1sO249TWF0aC5taW4obixnKTtvPU1hdGgubWF4KG8sZyk7ay50ZXh0Q29udGVudD1nK1wiIE1TIChcIituK1wiLVwiK28rXCIpXCI7dmFyIGE9TWF0aC5taW4oMzAsMzAtMzAqKGcvMjAwKSk7ZS5hcHBlbmRDaGlsZChlLmZpcnN0Q2hpbGQpLnN0eWxlLmhlaWdodD1hK1wicHhcIjtyKys7Yj5tKzFFMyYmKGg9TWF0aC5yb3VuZCgxRTMqci8oYi1tKSkscD1NYXRoLm1pbihwLGgpLHE9TWF0aC5tYXgocSxoKSxpLnRleHRDb250ZW50PWgrXCIgRlBTIChcIitwK1wiLVwiK3ErXCIpXCIsYT1NYXRoLm1pbigzMCwzMC0zMCooaC8xMDApKSxjLmFwcGVuZENoaWxkKGMuZmlyc3RDaGlsZCkuc3R5bGUuaGVpZ2h0PVxuYStcInB4XCIsbT1iLHI9MCk7cmV0dXJuIGJ9LHVwZGF0ZTpmdW5jdGlvbigpe2w9dGhpcy5lbmQoKX19fTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0czsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgY29uZmlnID0gbnVsbCxcbiAgICBpc0Jyb3dzZXIgPSByZXF1aXJlKCcuL2lzQnJvd3Nlci5qcycpO1xuXG52YXIgQ2FjaGVkID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuX2NsZWFuRGF0YSA9IHt9O1xuXHR0aGlzLl9kaXJ0eURhdGEgPSB7fTtcblx0XG5cdGlmIChpc0Jyb3dzZXIpIGNvbmZpZyA9IHdpbmRvdy5jb25maWc7XG5cdGVsc2UgY29uZmlnID0gZ2xvYmFsLmNvbmZpZztcbn07XG5cbkNhY2hlZC5wcm90b3R5cGUuX2RpZmZlcmVuY2UgPSBmdW5jdGlvbihjbGVhbk9iamVjdCwgZGlydHlPYmplY3QpIHtcbiAgICB2YXIga2V5RGlmZmVyZW5jZSwgZGlmZmVyZW5jZU9iamVjdCA9IHt9LCBzZWxmID0gdGhpcztcbiAgICBcbiAgICBjbGVhbk9iamVjdC5lYWNoKGZ1bmN0aW9uKGtleSwgY2xlYW5WYWx1ZSkge1xuICAgICAgICBpZiAoISQuaXNPYmplY3QoY2xlYW5WYWx1ZSkgfHwgISQuaXNPYmplY3QoZGlydHlPYmplY3Rba2V5XSkpIHtcbiAgICAgICAgICAgIGlmICghKGtleSBpbiBkaXJ0eU9iamVjdCkgfHwgY2xlYW5WYWx1ZSAhPT0gZGlydHlPYmplY3Rba2V5XSkge1xuICAgICAgICAgICAgICAgIGRpZmZlcmVuY2VPYmplY3Rba2V5XSA9IGRpcnR5T2JqZWN0W2tleV07XG4gICAgICAgICAgICAgICAgaWYgKGRpZmZlcmVuY2VPYmplY3Rba2V5XSA9PT0gdW5kZWZpbmVkKSBkaWZmZXJlbmNlT2JqZWN0W2tleV0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGtleURpZmZlcmVuY2UgPSBzZWxmLl9kaWZmZXJlbmNlKGNsZWFuVmFsdWUsIGRpcnR5T2JqZWN0W2tleV0pKSB7XG4gICAgICAgICAgICBkaWZmZXJlbmNlT2JqZWN0W2tleV0gPSBrZXlEaWZmZXJlbmNlO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgZGlydHlPYmplY3QuZWFjaChmdW5jdGlvbihrZXksIGRpcnR5VmFsdWUpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIGNsZWFuT2JqZWN0KSkge1xuICAgICAgICAgICAgZGlmZmVyZW5jZU9iamVjdFtrZXldID0gZGlydHlWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRpZmZlcmVuY2VPYmplY3Q7XG59O1xuXG5DYWNoZWQucHJvdG90eXBlLmNsZWFuID0gZnVuY3Rpb24oZGF0YSwgbmFtZSkge1xuICAgIGlmICghY29uZmlnLm5ldHdvcmsuY2FjaGUuZW5hYmxlKSByZXR1cm4gZGF0YTtcblx0aWYgKCFkYXRhIHx8ICFuYW1lKSByZXR1cm4gbnVsbDtcblx0aWYgKCEkLmlzT2JqZWN0KGRhdGEpKSByZXR1cm4gZGF0YTtcblx0aWYgKCF0aGlzLl9jbGVhbkRhdGFbbmFtZV0pIHRoaXMuX2NsZWFuRGF0YVtuYW1lXSA9IHt9O1xuXHRcblx0dmFyIHJlc3VsdCA9IHRoaXMuX2RpZmZlcmVuY2UodGhpcy5fY2xlYW5EYXRhW25hbWVdLCBkYXRhKTtcblx0dGhpcy5fY2xlYW5EYXRhW25hbWVdID0gZGF0YS5jbG9uZSgpO1xuXHRyZXR1cm4gcmVzdWx0O1xufTtcblxuQ2FjaGVkLnByb3RvdHlwZS5fZGVsZXRlTnVsbHMgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgXG4gICAgb2JqZWN0LmVhY2goZnVuY3Rpb24ocHJvcCwgdmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSBkZWxldGUgb2JqZWN0W3Byb3BdO1xuICAgICAgICBlbHNlIGlmICgkLmlzT2JqZWN0KHZhbHVlKSkgc2VsZi5fZGVsZXRlTnVsbHModmFsdWUpO1xuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5DYWNoZWQucHJvdG90eXBlLnJlc3RvcmUgPSBmdW5jdGlvbihkYXRhLCBuYW1lKSB7XG4gICAgaWYgKCFjb25maWcubmV0d29yay5jYWNoZS5lbmFibGUpIHJldHVybiBkYXRhO1xuXHRpZiAoIW5hbWUpIHJldHVybiBudWxsO1xuXHRpZiAoISQuaXNPYmplY3QoZGF0YSkpIHJldHVybiBkYXRhO1xuXHRpZiAoIXRoaXMuX2RpcnR5RGF0YVtuYW1lXSkgdGhpcy5fZGlydHlEYXRhW25hbWVdID0ge307XG5cdFxuXHR0aGlzLl9kaXJ0eURhdGFbbmFtZV0gPSBkYXRhLmNsb25lKCkuZXh0ZW5kKHRoaXMuX2RpcnR5RGF0YVtuYW1lXSk7XG5cdHRoaXMuX2RlbGV0ZU51bGxzKHRoaXMuX2RpcnR5RGF0YVtuYW1lXSk7XG5cdFxuXHRyZXR1cm4gdGhpcy5fZGlydHlEYXRhW25hbWVdLmNsb25lKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhY2hlZDtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsInZhciBjb2xvcnMgPSByZXF1aXJlKCdjb2xvcnMvc2FmZScpLFxuICAgIGlzQnJvd3NlciA9IHJlcXVpcmUoJy4vaXNCcm93c2VyLmpzJylcblxudmFyIExvZ2dlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmxvZyA9IHRoaXMuaW5mbyA9IHRoaXMud2FybiA9IHRoaXMuZXJyb3IgPSBudWxsO1xuICAgIFxuICAgIGlmIChpc0Jyb3dzZXIpIHtcbiAgICAgICAgdGhpcy5sb2cgPSB0aGlzLl9icm93c2VyTG9nO1xuICAgICAgICB0aGlzLmluZm8gPSB0aGlzLl9icm93c2VySW5mbztcbiAgICAgICAgdGhpcy53YXJuID0gdGhpcy5fYnJvd3Nlcldhcm47XG4gICAgICAgIHRoaXMuZXJyb3IgPSB0aGlzLl9icm93c2VyRXJyb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5sb2cgPSB0aGlzLl9ub2RlTG9nO1xuICAgICAgICB0aGlzLmluZm8gPSB0aGlzLl9ub2RlSW5mbztcbiAgICAgICAgdGhpcy53YXJuID0gdGhpcy5fbm9kZVdhcm47XG4gICAgICAgIHRoaXMuZXJyb3IgPSB0aGlzLl9ub2RlRXJyb3I7XG4gICAgfVxufTtcblxuTG9nZ2VyLnByb3RvdHlwZS5fYnJvd3NlckxvZyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlLmNsb25lKCkpO1xufTtcblxuTG9nZ2VyLnByb3RvdHlwZS5fYnJvd3NlckluZm8gPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgY29uc29sZS5pbmZvKG1lc3NhZ2UuY2xvbmUoKSk7XG59O1xuXG5Mb2dnZXIucHJvdG90eXBlLl9icm93c2VyV2FybiA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLndhcm4obWVzc2FnZS5jbG9uZSgpKTtcbn07XG5cbkxvZ2dlci5wcm90b3R5cGUuX2Jyb3dzZXJFcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmVycm9yKG1lc3NhZ2UuY2xvbmUoKSk7XG59O1xuXG5cblxuTG9nZ2VyLnByb3RvdHlwZS5fbm9kZUxvZyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlLmNsb25lKCkpO1xufTtcblxuTG9nZ2VyLnByb3RvdHlwZS5fbm9kZUluZm8gPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgY29uc29sZS5sb2coY29sb3JzLmJsdWUobWVzc2FnZS5jbG9uZSgpKSk7XG59O1xuXG5Mb2dnZXIucHJvdG90eXBlLl9ub2RlV2FybiA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmxvZyhjb2xvcnMueWVsbG93KG1lc3NhZ2UuY2xvbmUoKSkpO1xufTtcblxuTG9nZ2VyLnByb3RvdHlwZS5fbm9kZUVycm9yID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKGNvbG9ycy5yZWQobWVzc2FnZS5jbG9uZSgpKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExvZ2dlcjsiLCIoZnVuY3Rpb24gKGdsb2JhbCxCdWZmZXIpe1xudmFyIG5vZGVNc2dwYWNrID0gcmVxdWlyZSgnbXNncGFjay1qcycpLFxuICAgIGJyb3dzZXJNc2dwYWNrID0gcmVxdWlyZSgnbXNncGFjay1qcy1icm93c2VyJyksXG4gICAgaXNCcm93c2VyID0gcmVxdWlyZSgnLi9pc0Jyb3dzZXIuanMnKSxcbiAgICBjb25maWcgPSBudWxsO1xuXG52YXIgUGFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX21zZ3BhY2sgPSBudWxsO1xuICAgIFxuICAgIGlmIChpc0Jyb3dzZXIpIHtcbiAgICAgICAgdGhpcy5fbXNncGFjayA9IGJyb3dzZXJNc2dwYWNrO1xuICAgICAgICBjb25maWcgPSB3aW5kb3cuY29uZmlnO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX21zZ3BhY2sgPSBub2RlTXNncGFjaztcbiAgICAgICAgY29uZmlnID0gZ2xvYmFsLmNvbmZpZztcbiAgICB9XG59O1xuXG5QYWNrLnByb3RvdHlwZS5fbXNncGFja0VuY29kZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgZW5jb2RlZERhdGEgPSB0aGlzLl9tc2dwYWNrLmVuY29kZShkYXRhKTtcbiAgICBcbiAgICBpZiAoaXNCcm93c2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShlbmNvZGVkRGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGVuY29kZWREYXRhO1xuICAgIH1cbn07XG5cblBhY2sucHJvdG90eXBlLl9tc2dwYWNrRGVjb2RlID0gZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICB2YXIgcHJlcGFyZWREYXRhID0gbnVsbDtcbiAgICBcbiAgICBpZiAoaXNCcm93c2VyKSB7XG4gICAgICAgIHByZXBhcmVkRGF0YSA9IG5ldyBVaW50OEFycmF5KGJ5dGVzKS5idWZmZXI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBwcmVwYXJlZERhdGEgPSBuZXcgQnVmZmVyKGJ5dGVzKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRoaXMuX21zZ3BhY2suZGVjb2RlKHByZXBhcmVkRGF0YSk7XG59O1xuXG5QYWNrLnByb3RvdHlwZS5lbmNvZGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgaWYgKCFjb25maWcubmV0d29yay5wYWNrLmVuYWJsZSkgcmV0dXJuIGRhdGE7XG4gICAgXG4gICAgdmFyIGJ5dGVzID0gdGhpcy5fbXNncGFja0VuY29kZShkYXRhKTtcbiAgICBcbiAgICB2YXIgY2hhcnMgPSBbXSxcbiAgICAgICAgbGVuZ3RoID0gYnl0ZXMubGVuZ3RoO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICkge1xuICAgICAgICBjaGFycy5wdXNoKCgoYnl0ZXNbaSsrXSAmIDB4ZmYpIDw8IDgpIHwgKGJ5dGVzW2krK10gJiAweGZmKSk7XG4gICAgfVxuXG4gICAgdmFyIG1lc3NhZ2UgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIGNoYXJzKTtcbiAgICBpZiAobGVuZ3RoICUgMikgbWVzc2FnZSArPSAnKyc7XG4gICAgXG4gICAgcmV0dXJuICcjJyArIG1lc3NhZ2U7XG59O1xuXG5QYWNrLnByb3RvdHlwZS5kZWNvZGUgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgaWYgKCFjb25maWcubmV0d29yay5wYWNrLmVuYWJsZSB8fCBtZXNzYWdlWzBdICE9ICcjJykgcmV0dXJuIG1lc3NhZ2U7XG4gICAgZWxzZSBtZXNzYWdlID0gbWVzc2FnZS5zdWJzdHIoMSk7XG4gICAgXG4gICAgdmFyIGxlbmd0aCA9IG1lc3NhZ2UubGVuZ3RoLFxuICAgICAgICBieXRlcyA9IFtdLFxuICAgICAgICBleGNlc3NCeXRlID0gZmFsc2U7XG4gICAgICAgIFxuICAgIGlmIChtZXNzYWdlW2xlbmd0aCAtIDFdID09ICcrJykge1xuICAgICAgICBtZXNzYWdlLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgbGVuZ3RoLS07XG4gICAgICAgIGV4Y2Vzc0J5dGUgPSB0cnVlO1xuICAgIH1cblxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhciA9IG1lc3NhZ2UuY2hhckNvZGVBdChpKTtcbiAgICAgICAgYnl0ZXMucHVzaChjaGFyID4+PiA4LCBjaGFyICYgMHhGRik7XG4gICAgfVxuICAgIFxuICAgIGlmIChleGNlc3NCeXRlKSBieXRlcy5wb3AoKTtcbiAgICBcbiAgICByZXR1cm4gdGhpcy5fbXNncGFja0RlY29kZShieXRlcyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhY2s7XG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcikiLCJtb2R1bGUuZXhwb3J0cz17XG5cdFwibWFwXCI6IHtcblx0XHRcImNodW5rXCI6IHtcblx0XHRcdFwic2l6ZVwiOiAxMCxcblx0XHRcdFwidGlsZVwiOiB7XG5cdFx0XHRcdFwic2l6ZVwiOiAzMlxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0XCJzaXplXCI6IDMyLFxuXHRcdFwiZ3JvdXBSYWRpdXNcIjogMixcblx0XHRcInRpbGVzZXRcIjoge1xuXHRcdFx0XCJwYXRoXCI6IFwidGlsZXNldC9cIlxuXHRcdH0sXG5cdFx0XCJkaXN0YW5jZVwiOiB7XG5cdFx0XHRcInNjYWxlXCI6IDEwMFxuXHRcdH1cblx0fSxcbiAgICBcIm5ldHdvcmtcIjoge1xuICAgIFx0XCJtZXNzYWdlc1wiOiB7XG5cdCAgICBcdFwibmV3Q2h1bmtcIjogXCJuZXdfdGxcIixcblx0ICAgIFx0XCJyZW1vdmVDaHVua1wiOiBcImRlbF90bFwiLFxuXHQgICAgXHRcIm5ld0F2YXRhclwiOiBcIm5ld19hdlwiLFxuXHQgICAgXHRcInJlbW92ZUF2YXRhclwiOiBcImRlbF9hdlwiLFxuXHQgICAgXHRcInVwZGF0ZUF2YXRhclwiOiBcInVwZF9hdlwiLFxuXHQgICAgXHRcInNldENvbnRyb2xBdmF0YXJcIjogXCJjdHJsX2F2XCIsXG5cdCAgICBcblx0ICAgIFx0XCJ1c2VyTG9naW5cIjogXCJsb2dpblwiLFxuXHQgICAgXHRcInVzZXJJbnB1dFwiOiBcImlucHV0XCJcbiAgICBcdH0sXG4gICAgXHRcImNhY2hlXCI6IHtcbiAgICBcdFx0XCJlbmFibGVcIjogdHJ1ZVxuICAgIFx0fSxcbiAgICBcdFwicGFja1wiOiB7XG4gICAgXHRcdFwiZW5hYmxlXCI6IHRydWVcbiAgICBcdH1cbiAgICB9XG59IiwidmFyIGlzQnJvd3NlciA9IGZ1bmN0aW9uKCkge1xuICAgIHRyeSB7XG4gICAgICAgIHdpbmRvdztcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc0Jyb3dzZXIoKTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG52YXIgaXNCcm93c2VyID0gcmVxdWlyZSgnLi9pc0Jyb3dzZXIuanMnKTtcblxudmFyICQgPSB7fTtcbiQuaXNPYmplY3QgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCc7XG59O1xuJC5pc1N0cmluZyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqZWN0ID09PSAnc3RyaW5nJztcbn07XG4kLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gdHlwZW9mIG9iamVjdCA9PT0gJ2Z1bmN0aW9uJztcbn07XG5pZiAoaXNCcm93c2VyKSB3aW5kb3cuJCA9ICQ7XG5lbHNlIGdsb2JhbC4kID0gJDtcblxuXG5PYmplY3QucHJvdG90eXBlLmV4dGVuZCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgIHZhciB0YXJnZXQgPSB0aGlzO1xuICAgIFxuICAgIHNvdXJjZS5lYWNoKGZ1bmN0aW9uKHByb3AsIHNvdXJjZVByb3ApIHtcbiAgICAgICAgaWYgKCQuaXNPYmplY3Qoc291cmNlUHJvcCkgJiYgc291cmNlUHJvcCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKCEkLmlzT2JqZWN0KHRhcmdldFtwcm9wXSkgfHwgdGFyZ2V0W3Byb3BdID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YXJnZXRbcHJvcF0uZXh0ZW5kKHNvdXJjZVByb3ApO1xuICAgICAgICB9IGVsc2UgaWYgKHRhcmdldFtwcm9wXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSBzb3VyY2VQcm9wO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIHRhcmdldDtcbn07XG5cbk9iamVjdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcyAhPT0gdGhpcy52YWx1ZU9mKCkpIHJldHVybiB0aGlzLnZhbHVlT2YoKTsgXG4gICAgXG4gICAgdmFyIGNsb25lT2JqZWN0ID0ge307XG4gICAgY2xvbmVPYmplY3QuZXh0ZW5kKHRoaXMpO1xuICAgIFxuICAgIHJldHVybiBjbG9uZU9iamVjdDtcbn07XG5cbk9iamVjdC5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhT2JqZWN0LmtleXModGhpcykubGVuZ3RoO1xufTtcblxuT2JqZWN0LnByb3RvdHlwZS5lYWNoID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcykge1xuICAgICAgICBpZiAoIXRoaXMuaGFzT3duUHJvcGVydHkoa2V5KSkgY29udGludWU7XG4gICAgICAgIFxuICAgICAgICB2YXIgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBrZXksIHRoaXNba2V5XSk7XG4gICAgICAgIGlmIChyZXN1bHQpIGJyZWFrO1xuICAgIH0gIFxufTtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpcy1hcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbnZhciBrTWF4TGVuZ3RoID0gMHgzZmZmZmZmZlxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBVc2UgT2JqZWN0IGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBOb3RlOlxuICpcbiAqIC0gSW1wbGVtZW50YXRpb24gbXVzdCBzdXBwb3J0IGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLlxuICogICBGaXJlZm94IDQtMjkgbGFja2VkIHN1cHBvcnQsIGZpeGVkIGluIEZpcmVmb3ggMzArLlxuICogICBTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOC5cbiAqXG4gKiAgLSBDaHJvbWUgOS0xMCBpcyBtaXNzaW5nIHRoZSBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uLlxuICpcbiAqICAtIElFMTAgaGFzIGEgYnJva2VuIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhcnJheXMgb2ZcbiAqICAgIGluY29ycmVjdCBsZW5ndGggaW4gc29tZSBzaXR1YXRpb25zLlxuICpcbiAqIFdlIGRldGVjdCB0aGVzZSBidWdneSBicm93c2VycyBhbmQgc2V0IGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGAgdG8gYGZhbHNlYCBzbyB0aGV5IHdpbGxcbiAqIGdldCB0aGUgT2JqZWN0IGltcGxlbWVudGF0aW9uLCB3aGljaCBpcyBzbG93ZXIgYnV0IHdpbGwgd29yayBjb3JyZWN0bHkuXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gKGZ1bmN0aW9uICgpIHtcbiAgdHJ5IHtcbiAgICB2YXIgYnVmID0gbmV3IEFycmF5QnVmZmVyKDApXG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KGJ1ZilcbiAgICBhcnIuZm9vID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfVxuICAgIHJldHVybiA0MiA9PT0gYXJyLmZvbygpICYmIC8vIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkXG4gICAgICAgIHR5cGVvZiBhcnIuc3ViYXJyYXkgPT09ICdmdW5jdGlvbicgJiYgLy8gY2hyb21lIDktMTAgbGFjayBgc3ViYXJyYXlgXG4gICAgICAgIG5ldyBVaW50OEFycmF5KDEpLnN1YmFycmF5KDEsIDEpLmJ5dGVMZW5ndGggPT09IDAgLy8gaWUxMCBoYXMgYnJva2VuIGBzdWJhcnJheWBcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59KSgpXG5cbi8qKlxuICogQ2xhc3M6IEJ1ZmZlclxuICogPT09PT09PT09PT09PVxuICpcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgYXJlIGF1Z21lbnRlZFxuICogd2l0aCBmdW5jdGlvbiBwcm9wZXJ0aWVzIGZvciBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgQVBJIGZ1bmN0aW9ucy4gV2UgdXNlXG4gKiBgVWludDhBcnJheWAgc28gdGhhdCBzcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdCByZXR1cm5zXG4gKiBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBCeSBhdWdtZW50aW5nIHRoZSBpbnN0YW5jZXMsIHdlIGNhbiBhdm9pZCBtb2RpZnlpbmcgdGhlIGBVaW50OEFycmF5YFxuICogcHJvdG90eXBlLlxuICovXG5mdW5jdGlvbiBCdWZmZXIgKHN1YmplY3QsIGVuY29kaW5nLCBub1plcm8pIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpXG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybylcblxuICB2YXIgdHlwZSA9IHR5cGVvZiBzdWJqZWN0XG5cbiAgLy8gRmluZCB0aGUgbGVuZ3RoXG4gIHZhciBsZW5ndGhcbiAgaWYgKHR5cGUgPT09ICdudW1iZXInKVxuICAgIGxlbmd0aCA9IHN1YmplY3QgPiAwID8gc3ViamVjdCA+Pj4gMCA6IDBcbiAgZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAoZW5jb2RpbmcgPT09ICdiYXNlNjQnKVxuICAgICAgc3ViamVjdCA9IGJhc2U2NGNsZWFuKHN1YmplY3QpXG4gICAgbGVuZ3RoID0gQnVmZmVyLmJ5dGVMZW5ndGgoc3ViamVjdCwgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcgJiYgc3ViamVjdCAhPT0gbnVsbCkgeyAvLyBhc3N1bWUgb2JqZWN0IGlzIGFycmF5LWxpa2VcbiAgICBpZiAoc3ViamVjdC50eXBlID09PSAnQnVmZmVyJyAmJiBpc0FycmF5KHN1YmplY3QuZGF0YSkpXG4gICAgICBzdWJqZWN0ID0gc3ViamVjdC5kYXRhXG4gICAgbGVuZ3RoID0gK3N1YmplY3QubGVuZ3RoID4gMCA/IE1hdGguZmxvb3IoK3N1YmplY3QubGVuZ3RoKSA6IDBcbiAgfSBlbHNlXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbXVzdCBzdGFydCB3aXRoIG51bWJlciwgYnVmZmVyLCBhcnJheSBvciBzdHJpbmcnKVxuXG4gIGlmICh0aGlzLmxlbmd0aCA+IGtNYXhMZW5ndGgpXG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAnc2l6ZTogMHgnICsga01heExlbmd0aC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcblxuICB2YXIgYnVmXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFByZWZlcnJlZDogUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBidWYgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkobGVuZ3RoKSlcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIFRISVMgaW5zdGFuY2Ugb2YgQnVmZmVyIChjcmVhdGVkIGJ5IGBuZXdgKVxuICAgIGJ1ZiA9IHRoaXNcbiAgICBidWYubGVuZ3RoID0gbGVuZ3RoXG4gICAgYnVmLl9pc0J1ZmZlciA9IHRydWVcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2Ygc3ViamVjdC5ieXRlTGVuZ3RoID09PSAnbnVtYmVyJykge1xuICAgIC8vIFNwZWVkIG9wdGltaXphdGlvbiAtLSB1c2Ugc2V0IGlmIHdlJ3JlIGNvcHlpbmcgZnJvbSBhIHR5cGVkIGFycmF5XG4gICAgYnVmLl9zZXQoc3ViamVjdClcbiAgfSBlbHNlIGlmIChpc0FycmF5aXNoKHN1YmplY3QpKSB7XG4gICAgLy8gVHJlYXQgYXJyYXktaXNoIG9iamVjdHMgYXMgYSBieXRlIGFycmF5XG4gICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKVxuICAgICAgICBidWZbaV0gPSBzdWJqZWN0LnJlYWRVSW50OChpKVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspXG4gICAgICAgIGJ1ZltpXSA9ICgoc3ViamVjdFtpXSAlIDI1NikgKyAyNTYpICUgMjU2XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgYnVmLndyaXRlKHN1YmplY3QsIDAsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdudW1iZXInICYmICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiAhbm9aZXJvKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBidWZbaV0gPSAwXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiAoYikge1xuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIG11c3QgYmUgQnVmZmVycycpXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbiAmJiBhW2ldID09PSBiW2ldOyBpKyspIHt9XG4gIGlmIChpICE9PSBsZW4pIHtcbiAgICB4ID0gYVtpXVxuICAgIHkgPSBiW2ldXG4gIH1cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIChsaXN0LCB0b3RhbExlbmd0aCkge1xuICBpZiAoIWlzQXJyYXkobGlzdCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1VzYWdlOiBCdWZmZXIuY29uY2F0KGxpc3RbLCBsZW5ndGhdKScpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfSBlbHNlIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBsaXN0WzBdXG4gIH1cblxuICB2YXIgaVxuICBpZiAodG90YWxMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIHRvdGFsTGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0b3RhbExlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHRvdGFsTGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gZnVuY3Rpb24gKHN0ciwgZW5jb2RpbmcpIHtcbiAgdmFyIHJldFxuICBzdHIgPSBzdHIgKyAnJ1xuICBzd2l0Y2ggKGVuY29kaW5nIHx8ICd1dGY4Jykge1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoICogMlxuICAgICAgYnJlYWtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aCA+Pj4gMVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSB1dGY4VG9CeXRlcyhzdHIpLmxlbmd0aFxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgcmV0ID0gYmFzZTY0VG9CeXRlcyhzdHIpLmxlbmd0aFxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0ID0gc3RyLmxlbmd0aFxuICB9XG4gIHJldHVybiByZXRcbn1cblxuLy8gcHJlLXNldCBmb3IgdmFsdWVzIHRoYXQgbWF5IGV4aXN0IGluIHRoZSBmdXR1cmVcbkJ1ZmZlci5wcm90b3R5cGUubGVuZ3RoID0gdW5kZWZpbmVkXG5CdWZmZXIucHJvdG90eXBlLnBhcmVudCA9IHVuZGVmaW5lZFxuXG4vLyB0b1N0cmluZyhlbmNvZGluZywgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPT09IEluZmluaXR5ID8gdGhpcy5sZW5ndGggOiBlbmQgPj4+IDBcblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoZW5kIDw9IHN0YXJ0KSByZXR1cm4gJydcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpXG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChiKSB7XG4gIGlmKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkubWF0Y2goLy57Mn0vZykuam9pbignICcpXG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KVxuICAgICAgc3RyICs9ICcgLi4uICdcbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKVxufVxuXG4vLyBgZ2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAoc3RyTGVuICUgMiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYnl0ZSA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAoaXNOYU4oYnl0ZSkpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBieXRlXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBTdXBwb3J0IGJvdGggKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKVxuICAvLyBhbmQgdGhlIGxlZ2FjeSAoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0LCBsZW5ndGgpXG4gIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgaWYgKCFpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2UgeyAgLy8gbGVnYWN5XG4gICAgdmFyIHN3YXAgPSBlbmNvZGluZ1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgb2Zmc2V0ID0gbGVuZ3RoXG4gICAgbGVuZ3RoID0gc3dhcFxuICB9XG5cbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZyB8fCAndXRmOCcpLnRvTG93ZXJDYXNlKClcblxuICB2YXIgcmV0XG4gIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgICAgcmV0ID0gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIHJldCA9IGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIHJldCA9IGJpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0ID0gdXRmMTZsZVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJlcyA9ICcnXG4gIHZhciB0bXAgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBpZiAoYnVmW2ldIDw9IDB4N0YpIHtcbiAgICAgIHJlcyArPSBkZWNvZGVVdGY4Q2hhcih0bXApICsgU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gICAgICB0bXAgPSAnJ1xuICAgIH0gZWxzZSB7XG4gICAgICB0bXAgKz0gJyUnICsgYnVmW2ldLnRvU3RyaW5nKDE2KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXMgKyBkZWNvZGVVdGY4Q2hhcih0bXApXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICByZXR1cm4gYXNjaWlTbGljZShidWYsIHN0YXJ0LCBlbmQpXG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlbjtcbiAgICBpZiAoc3RhcnQgPCAwKVxuICAgICAgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApXG4gICAgICBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpXG4gICAgZW5kID0gc3RhcnRcblxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICByZXR1cm4gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICB2YXIgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkLCB0cnVlKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICAgIHJldHVybiBuZXdCdWZcbiAgfVxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMClcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aClcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKVxuICAgIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYnVmZmVyIG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFR5cGVFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgMik7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgJiAoMHhmZiA8PCAoOCAqIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpKSkpID4+PlxuICAgICAgKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkgKiA4XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Ugb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Ugb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICB9IGVsc2Ugb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gdmFsdWVcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWVcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Ugb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9IHZhbHVlXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gKHRhcmdldCwgdGFyZ2V0X3N0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIHZhciBzb3VyY2UgPSB0aGlzXG5cbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKCF0YXJnZXRfc3RhcnQpIHRhcmdldF9zdGFydCA9IDBcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVyblxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCBzb3VyY2UubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmIChlbmQgPCBzdGFydCkgdGhyb3cgbmV3IFR5cGVFcnJvcignc291cmNlRW5kIDwgc291cmNlU3RhcnQnKVxuICBpZiAodGFyZ2V0X3N0YXJ0IDwgMCB8fCB0YXJnZXRfc3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aClcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSBzb3VyY2UubGVuZ3RoKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzb3VyY2VTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDAgfHwgZW5kID4gc291cmNlLmxlbmd0aCkgdGhyb3cgbmV3IFR5cGVFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aClcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCA8IGVuZCAtIHN0YXJ0KVxuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgKyBzdGFydFxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmIChsZW4gPCAxMDAwIHx8ICFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0X3N0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldF9zdGFydClcbiAgfVxufVxuXG4vLyBmaWxsKHZhbHVlLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXZhbHVlKSB2YWx1ZSA9IDBcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kKSBlbmQgPSB0aGlzLmxlbmd0aFxuXG4gIGlmIChlbmQgPCBzdGFydCkgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFR5cGVFcnJvcignc3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChlbmQgPCAwIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsdWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gdXRmOFRvQnl0ZXModmFsdWUudG9TdHJpbmcoKSlcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGBBcnJheUJ1ZmZlcmAgd2l0aCB0aGUgKmNvcGllZCogbWVtb3J5IG9mIHRoZSBidWZmZXIgaW5zdGFuY2UuXG4gKiBBZGRlZCBpbiBOb2RlIDAuMTIuIE9ubHkgYXZhaWxhYmxlIGluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBBcnJheUJ1ZmZlci5cbiAqL1xuQnVmZmVyLnByb3RvdHlwZS50b0FycmF5QnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgICByZXR1cm4gKG5ldyBCdWZmZXIodGhpcykpLmJ1ZmZlclxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5sZW5ndGgpXG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYnVmLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAxKSB7XG4gICAgICAgIGJ1ZltpXSA9IHRoaXNbaV1cbiAgICAgIH1cbiAgICAgIHJldHVybiBidWYuYnVmZmVyXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0J1ZmZlci50b0FycmF5QnVmZmVyIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJylcbiAgfVxufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBCUCA9IEJ1ZmZlci5wcm90b3R5cGVcblxuLyoqXG4gKiBBdWdtZW50IGEgVWludDhBcnJheSAqaW5zdGFuY2UqIChub3QgdGhlIFVpbnQ4QXJyYXkgY2xhc3MhKSB3aXRoIEJ1ZmZlciBtZXRob2RzXG4gKi9cbkJ1ZmZlci5fYXVnbWVudCA9IGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLmNvbnN0cnVjdG9yID0gQnVmZmVyXG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBnZXQvc2V0IG1ldGhvZHMgYmVmb3JlIG92ZXJ3cml0aW5nXG4gIGFyci5fZ2V0ID0gYXJyLmdldFxuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkLCB3aWxsIGJlIHJlbW92ZWQgaW4gbm9kZSAwLjEzK1xuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5lcXVhbHMgPSBCUC5lcXVhbHNcbiAgYXJyLmNvbXBhcmUgPSBCUC5jb21wYXJlXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rXFwvMC05QS16XS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0cmluZ3RyaW0oc3RyKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gaXNBcnJheWlzaCAoc3ViamVjdCkge1xuICByZXR1cm4gaXNBcnJheShzdWJqZWN0KSB8fCBCdWZmZXIuaXNCdWZmZXIoc3ViamVjdCkgfHxcbiAgICAgIHN1YmplY3QgJiYgdHlwZW9mIHN1YmplY3QgPT09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2Ygc3ViamVjdC5sZW5ndGggPT09ICdudW1iZXInXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYiA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaWYgKGIgPD0gMHg3Rikge1xuICAgICAgYnl0ZUFycmF5LnB1c2goYilcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHN0YXJ0ID0gaVxuICAgICAgaWYgKGIgPj0gMHhEODAwICYmIGIgPD0gMHhERkZGKSBpKytcbiAgICAgIHZhciBoID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0ci5zbGljZShzdGFydCwgaSsxKSkuc3Vic3RyKDEpLnNwbGl0KCclJylcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgaC5sZW5ndGg7IGorKykge1xuICAgICAgICBieXRlQXJyYXkucHVzaChwYXJzZUludChoW2pdLCAxNikpXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KHN0cilcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpXG4gICAgICBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIGRlY29kZVV0ZjhDaGFyIChzdHIpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHN0cilcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoMHhGRkZEKSAvLyBVVEYgOCBpbnZhbGlkIGNoYXJcbiAgfVxufVxuIiwidmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuOyhmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cbiAgdmFyIEFyciA9ICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpXG4gICAgPyBVaW50OEFycmF5XG4gICAgOiBBcnJheVxuXG5cdHZhciBQTFVTICAgPSAnKycuY2hhckNvZGVBdCgwKVxuXHR2YXIgU0xBU0ggID0gJy8nLmNoYXJDb2RlQXQoMClcblx0dmFyIE5VTUJFUiA9ICcwJy5jaGFyQ29kZUF0KDApXG5cdHZhciBMT1dFUiAgPSAnYScuY2hhckNvZGVBdCgwKVxuXHR2YXIgVVBQRVIgID0gJ0EnLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUylcblx0XHRcdHJldHVybiA2MiAvLyAnKydcblx0XHRpZiAoY29kZSA9PT0gU0xBU0gpXG5cdFx0XHRyZXR1cm4gNjMgLy8gJy8nXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIpXG5cdFx0XHRyZXR1cm4gLTEgLy9ubyBtYXRjaFxuXHRcdGlmIChjb2RlIDwgTlVNQkVSICsgMTApXG5cdFx0XHRyZXR1cm4gY29kZSAtIE5VTUJFUiArIDI2ICsgMjZcblx0XHRpZiAoY29kZSA8IFVQUEVSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIFVQUEVSXG5cdFx0aWYgKGNvZGUgPCBMT1dFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBMT1dFUiArIDI2XG5cdH1cblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheSAoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcblxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG5cdFx0fVxuXG5cdFx0Ly8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcblx0XHQvLyBpZiB0aGVyZSBhcmUgdHdvIHBsYWNlaG9sZGVycywgdGhhbiB0aGUgdHdvIGNoYXJhY3RlcnMgYmVmb3JlIGl0XG5cdFx0Ly8gcmVwcmVzZW50IG9uZSBieXRlXG5cdFx0Ly8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG5cdFx0Ly8gdGhpcyBpcyBqdXN0IGEgY2hlYXAgaGFjayB0byBub3QgZG8gaW5kZXhPZiB0d2ljZVxuXHRcdHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cdFx0cGxhY2VIb2xkZXJzID0gJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDIpID8gMiA6ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAxKSA/IDEgOiAwXG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBuZXcgQXJyKGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycylcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aFxuXG5cdFx0dmFyIEwgPSAwXG5cblx0XHRmdW5jdGlvbiBwdXNoICh2KSB7XG5cdFx0XHRhcnJbTCsrXSA9IHZcblx0XHR9XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDE4KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDEyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpIDw8IDYpIHwgZGVjb2RlKGI2NC5jaGFyQXQoaSArIDMpKVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KVxuXHRcdFx0cHVzaCgodG1wICYgMHhGRjAwKSA+PiA4KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdGlmIChwbGFjZUhvbGRlcnMgPT09IDIpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA+PiA0KVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDEwKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpIDw8IDQpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPj4gMilcblx0XHRcdHB1c2goKHRtcCA+PiA4KSAmIDB4RkYpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyclxuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCAodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aFxuXG5cdFx0ZnVuY3Rpb24gZW5jb2RlIChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXAuY2hhckF0KG51bSlcblx0XHR9XG5cblx0XHRmdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuXHRcdFx0cmV0dXJuIGVuY29kZShudW0gPj4gMTggJiAweDNGKSArIGVuY29kZShudW0gPj4gMTIgJiAweDNGKSArIGVuY29kZShudW0gPj4gNiAmIDB4M0YpICsgZW5jb2RlKG51bSAmIDB4M0YpXG5cdFx0fVxuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSlcblx0XHRcdG91dHB1dCArPSB0cmlwbGV0VG9CYXNlNjQodGVtcClcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPT0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0XHRjYXNlIDI6XG5cdFx0XHRcdHRlbXAgPSAodWludDhbdWludDgubGVuZ3RoIC0gMl0gPDwgOCkgKyAodWludDhbdWludDgubGVuZ3RoIC0gMV0pXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAxMClcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA+PiA0KSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgMikgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz0nXG5cdFx0XHRcdGJyZWFrXG5cdFx0fVxuXG5cdFx0cmV0dXJuIG91dHB1dFxuXHR9XG5cblx0ZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5XG5cdGV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjRcbn0odHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnID8gKHRoaXMuYmFzZTY0anMgPSB7fSkgOiBleHBvcnRzKSlcbiIsImV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgbkJpdHMgPSAtNyxcbiAgICAgIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMCxcbiAgICAgIGQgPSBpc0xFID8gLTEgOiAxLFxuICAgICAgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXTtcblxuICBpICs9IGQ7XG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIHMgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBlTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgZSA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IG1MZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhcztcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpO1xuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbik7XG4gICAgZSA9IGUgLSBlQmlhcztcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKTtcbn07XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbihidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgYyxcbiAgICAgIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDEsXG4gICAgICBlTWF4ID0gKDEgPDwgZUxlbikgLSAxLFxuICAgICAgZUJpYXMgPSBlTWF4ID4+IDEsXG4gICAgICBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMCksXG4gICAgICBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSksXG4gICAgICBkID0gaXNMRSA/IDEgOiAtMSxcbiAgICAgIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDA7XG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSk7XG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDA7XG4gICAgZSA9IGVNYXg7XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpO1xuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLTtcbiAgICAgIGMgKj0gMjtcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKTtcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKys7XG4gICAgICBjIC89IDI7XG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMDtcbiAgICAgIGUgPSBlTWF4O1xuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgIGUgPSBlICsgZUJpYXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgIGUgPSAwO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpO1xuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG07XG4gIGVMZW4gKz0gbUxlbjtcbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KTtcblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjg7XG59O1xuIiwiXG4vKipcbiAqIGlzQXJyYXlcbiAqL1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbi8qKlxuICogdG9TdHJpbmdcbiAqL1xuXG52YXIgc3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCB0aGUgZ2l2ZW4gYHZhbGBcbiAqIGlzIGFuIGFycmF5LlxuICpcbiAqIGV4YW1wbGU6XG4gKlxuICogICAgICAgIGlzQXJyYXkoW10pO1xuICogICAgICAgIC8vID4gdHJ1ZVxuICogICAgICAgIGlzQXJyYXkoYXJndW1lbnRzKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKiAgICAgICAgaXNBcnJheSgnJyk7XG4gKiAgICAgICAgLy8gPiBmYWxzZVxuICpcbiAqIEBwYXJhbSB7bWl4ZWR9IHZhbFxuICogQHJldHVybiB7Ym9vbH1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXkgfHwgZnVuY3Rpb24gKHZhbCkge1xuICByZXR1cm4gISEgdmFsICYmICdbb2JqZWN0IEFycmF5XScgPT0gc3RyLmNhbGwodmFsKTtcbn07XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5NdXRhdGlvbk9ic2VydmVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuTXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICB2YXIgcXVldWUgPSBbXTtcblxuICAgIGlmIChjYW5NdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICAgIHZhciBoaWRkZW5EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB2YXIgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcXVldWVMaXN0ID0gcXVldWUuc2xpY2UoKTtcbiAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICBxdWV1ZUxpc3QuZm9yRWFjaChmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoaGlkZGVuRGl2LCB7IGF0dHJpYnV0ZXM6IHRydWUgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGhpZGRlbkRpdi5zZXRBdHRyaWJ1dGUoJ3llcycsICdubycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwiLypcblxuVGhlIE1JVCBMaWNlbnNlIChNSVQpXG5cbk9yaWdpbmFsIExpYnJhcnkgXG4gIC0gQ29weXJpZ2h0IChjKSBNYXJhayBTcXVpcmVzXG5cbkFkZGl0aW9uYWwgZnVuY3Rpb25hbGl0eVxuIC0gQ29weXJpZ2h0IChjKSBTaW5kcmUgU29yaHVzIDxzaW5kcmVzb3JodXNAZ21haWwuY29tPiAoc2luZHJlc29yaHVzLmNvbSlcblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuXG4qL1xuXG52YXIgY29sb3JzID0ge307XG5tb2R1bGVbJ2V4cG9ydHMnXSA9IGNvbG9ycztcblxuY29sb3JzLnRoZW1lcyA9IHt9O1xuXG52YXIgYW5zaVN0eWxlcyA9IGNvbG9ycy5zdHlsZXMgPSByZXF1aXJlKCcuL3N0eWxlcycpO1xudmFyIGRlZmluZVByb3BzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXM7XG5cbmNvbG9ycy5zdXBwb3J0c0NvbG9yID0gcmVxdWlyZSgnLi9zeXN0ZW0vc3VwcG9ydHMtY29sb3JzJyk7XG5cbmlmICh0eXBlb2YgY29sb3JzLmVuYWJsZWQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgY29sb3JzLmVuYWJsZWQgPSBjb2xvcnMuc3VwcG9ydHNDb2xvcjtcbn1cblxuY29sb3JzLnN0cmlwQ29sb3JzID0gY29sb3JzLnN0cmlwID0gZnVuY3Rpb24oc3RyKXtcbiAgcmV0dXJuIChcIlwiICsgc3RyKS5yZXBsYWNlKC9cXHgxQlxcW1xcZCttL2csICcnKTtcbn07XG5cblxudmFyIHN0eWxpemUgPSBjb2xvcnMuc3R5bGl6ZSA9IGZ1bmN0aW9uIHN0eWxpemUgKHN0ciwgc3R5bGUpIHtcbiAgcmV0dXJuIGFuc2lTdHlsZXNbc3R5bGVdLm9wZW4gKyBzdHIgKyBhbnNpU3R5bGVzW3N0eWxlXS5jbG9zZTtcbn1cblxudmFyIG1hdGNoT3BlcmF0b3JzUmUgPSAvW3xcXFxce30oKVtcXF1eJCsqPy5dL2c7XG52YXIgZXNjYXBlU3RyaW5nUmVnZXhwID0gZnVuY3Rpb24gKHN0cikge1xuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBhIHN0cmluZycpO1xuICB9XG4gIHJldHVybiBzdHIucmVwbGFjZShtYXRjaE9wZXJhdG9yc1JlLCAgJ1xcXFwkJicpO1xufVxuXG5mdW5jdGlvbiBidWlsZChfc3R5bGVzKSB7XG4gIHZhciBidWlsZGVyID0gZnVuY3Rpb24gYnVpbGRlcigpIHtcbiAgICByZXR1cm4gYXBwbHlTdHlsZS5hcHBseShidWlsZGVyLCBhcmd1bWVudHMpO1xuICB9O1xuICBidWlsZGVyLl9zdHlsZXMgPSBfc3R5bGVzO1xuICAvLyBfX3Byb3RvX18gaXMgdXNlZCBiZWNhdXNlIHdlIG11c3QgcmV0dXJuIGEgZnVuY3Rpb24sIGJ1dCB0aGVyZSBpc1xuICAvLyBubyB3YXkgdG8gY3JlYXRlIGEgZnVuY3Rpb24gd2l0aCBhIGRpZmZlcmVudCBwcm90b3R5cGUuXG4gIGJ1aWxkZXIuX19wcm90b19fID0gcHJvdG87XG4gIHJldHVybiBidWlsZGVyO1xufVxuXG52YXIgc3R5bGVzID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJldCA9IHt9O1xuICBhbnNpU3R5bGVzLmdyZXkgPSBhbnNpU3R5bGVzLmdyYXk7XG4gIE9iamVjdC5rZXlzKGFuc2lTdHlsZXMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIGFuc2lTdHlsZXNba2V5XS5jbG9zZVJlID0gbmV3IFJlZ0V4cChlc2NhcGVTdHJpbmdSZWdleHAoYW5zaVN0eWxlc1trZXldLmNsb3NlKSwgJ2cnKTtcbiAgICByZXRba2V5XSA9IHtcbiAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYnVpbGQodGhpcy5fc3R5bGVzLmNvbmNhdChrZXkpKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiAgcmV0dXJuIHJldDtcbn0pKCk7XG5cbnZhciBwcm90byA9IGRlZmluZVByb3BzKGZ1bmN0aW9uIGNvbG9ycygpIHt9LCBzdHlsZXMpO1xuXG5mdW5jdGlvbiBhcHBseVN0eWxlKCkge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGFyZ3NMZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IGFyZ3NMZW4gIT09IDAgJiYgU3RyaW5nKGFyZ3VtZW50c1swXSk7XG4gIGlmIChhcmdzTGVuID4gMSkge1xuICAgIGZvciAodmFyIGEgPSAxOyBhIDwgYXJnc0xlbjsgYSsrKSB7XG4gICAgICBzdHIgKz0gJyAnICsgYXJnc1thXTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNvbG9ycy5lbmFibGVkIHx8ICFzdHIpIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgdmFyIG5lc3RlZFN0eWxlcyA9IHRoaXMuX3N0eWxlcztcblxuICB2YXIgaSA9IG5lc3RlZFN0eWxlcy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICB2YXIgY29kZSA9IGFuc2lTdHlsZXNbbmVzdGVkU3R5bGVzW2ldXTtcbiAgICBzdHIgPSBjb2RlLm9wZW4gKyBzdHIucmVwbGFjZShjb2RlLmNsb3NlUmUsIGNvZGUub3BlbikgKyBjb2RlLmNsb3NlO1xuICB9XG5cbiAgcmV0dXJuIHN0cjtcbn1cblxuZnVuY3Rpb24gYXBwbHlUaGVtZSAodGhlbWUpIHtcbiAgZm9yICh2YXIgc3R5bGUgaW4gdGhlbWUpIHtcbiAgICAoZnVuY3Rpb24oc3R5bGUpe1xuICAgICAgY29sb3JzW3N0eWxlXSA9IGZ1bmN0aW9uKHN0cil7XG4gICAgICAgIHJldHVybiBjb2xvcnNbdGhlbWVbc3R5bGVdXShzdHIpO1xuICAgICAgfTtcbiAgICB9KShzdHlsZSlcbiAgfVxufVxuXG5jb2xvcnMuc2V0VGhlbWUgPSBmdW5jdGlvbiAodGhlbWUpIHtcbiAgaWYgKHR5cGVvZiB0aGVtZSA9PT0gJ3N0cmluZycpIHtcbiAgICB0cnkge1xuICAgICAgY29sb3JzLnRoZW1lc1t0aGVtZV0gPSByZXF1aXJlKHRoZW1lKTtcbiAgICAgIGFwcGx5VGhlbWUoY29sb3JzLnRoZW1lc1t0aGVtZV0pO1xuICAgICAgcmV0dXJuIGNvbG9ycy50aGVtZXNbdGhlbWVdO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgIHJldHVybiBlcnI7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGFwcGx5VGhlbWUodGhlbWUpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBpbml0KCkge1xuICB2YXIgcmV0ID0ge307XG4gIE9iamVjdC5rZXlzKHN0eWxlcykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldFtuYW1lXSA9IHtcbiAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYnVpbGQoW25hbWVdKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcbiAgcmV0dXJuIHJldDtcbn1cblxudmFyIHNlcXVlbmNlciA9IGZ1bmN0aW9uIHNlcXVlbmNlciAobWFwLCBzdHIpIHtcbiAgdmFyIGV4cGxvZGVkID0gc3RyLnNwbGl0KFwiXCIpLCBpID0gMDtcbiAgZXhwbG9kZWQgPSBleHBsb2RlZC5tYXAobWFwKTtcbiAgcmV0dXJuIGV4cGxvZGVkLmpvaW4oXCJcIik7XG59O1xuXG4vLyBjdXN0b20gZm9ybWF0dGVyIG1ldGhvZHNcbmNvbG9ycy50cmFwID0gcmVxdWlyZSgnLi9jdXN0b20vdHJhcCcpO1xuY29sb3JzLnphbGdvID0gcmVxdWlyZSgnLi9jdXN0b20vemFsZ28nKTtcblxuLy8gbWFwc1xuY29sb3JzLm1hcHMgPSB7fTtcbmNvbG9ycy5tYXBzLmFtZXJpY2EgPSByZXF1aXJlKCcuL21hcHMvYW1lcmljYScpO1xuY29sb3JzLm1hcHMuemVicmEgPSByZXF1aXJlKCcuL21hcHMvemVicmEnKTtcbmNvbG9ycy5tYXBzLnJhaW5ib3cgPSByZXF1aXJlKCcuL21hcHMvcmFpbmJvdycpO1xuY29sb3JzLm1hcHMucmFuZG9tID0gcmVxdWlyZSgnLi9tYXBzL3JhbmRvbScpXG5cbmZvciAodmFyIG1hcCBpbiBjb2xvcnMubWFwcykge1xuICAoZnVuY3Rpb24obWFwKXtcbiAgICBjb2xvcnNbbWFwXSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICAgIHJldHVybiBzZXF1ZW5jZXIoY29sb3JzLm1hcHNbbWFwXSwgc3RyKTtcbiAgICB9XG4gIH0pKG1hcClcbn1cblxuZGVmaW5lUHJvcHMoY29sb3JzLCBpbml0KCkpOyIsIm1vZHVsZVsnZXhwb3J0cyddID0gZnVuY3Rpb24gcnVuVGhlVHJhcCAodGV4dCwgb3B0aW9ucykge1xuICB2YXIgcmVzdWx0ID0gXCJcIjtcbiAgdGV4dCA9IHRleHQgfHwgXCJSdW4gdGhlIHRyYXAsIGRyb3AgdGhlIGJhc3NcIjtcbiAgdGV4dCA9IHRleHQuc3BsaXQoJycpO1xuICB2YXIgdHJhcCA9IHtcbiAgICBhOiBbXCJcXHUwMDQwXCIsIFwiXFx1MDEwNFwiLCBcIlxcdTAyM2FcIiwgXCJcXHUwMjQ1XCIsIFwiXFx1MDM5NFwiLCBcIlxcdTAzOWJcIiwgXCJcXHUwNDE0XCJdLFxuICAgIGI6IFtcIlxcdTAwZGZcIiwgXCJcXHUwMTgxXCIsIFwiXFx1MDI0M1wiLCBcIlxcdTAyNmVcIiwgXCJcXHUwM2IyXCIsIFwiXFx1MGUzZlwiXSxcbiAgICBjOiBbXCJcXHUwMGE5XCIsIFwiXFx1MDIzYlwiLCBcIlxcdTAzZmVcIl0sXG4gICAgZDogW1wiXFx1MDBkMFwiLCBcIlxcdTAxOGFcIiwgXCJcXHUwNTAwXCIgLCBcIlxcdTA1MDFcIiAsXCJcXHUwNTAyXCIsIFwiXFx1MDUwM1wiXSxcbiAgICBlOiBbXCJcXHUwMGNiXCIsIFwiXFx1MDExNVwiLCBcIlxcdTAxOGVcIiwgXCJcXHUwMjU4XCIsIFwiXFx1MDNhM1wiLCBcIlxcdTAzYmVcIiwgXCJcXHUwNGJjXCIsIFwiXFx1MGE2Y1wiXSxcbiAgICBmOiBbXCJcXHUwNGZhXCJdLFxuICAgIGc6IFtcIlxcdTAyNjJcIl0sXG4gICAgaDogW1wiXFx1MDEyNlwiLCBcIlxcdTAxOTVcIiwgXCJcXHUwNGEyXCIsIFwiXFx1MDRiYVwiLCBcIlxcdTA0YzdcIiwgXCJcXHUwNTBhXCJdLFxuICAgIGk6IFtcIlxcdTBmMGZcIl0sXG4gICAgajogW1wiXFx1MDEzNFwiXSxcbiAgICBrOiBbXCJcXHUwMTM4XCIsIFwiXFx1MDRhMFwiLCBcIlxcdTA0YzNcIiwgXCJcXHUwNTFlXCJdLFxuICAgIGw6IFtcIlxcdTAxMzlcIl0sXG4gICAgbTogW1wiXFx1MDI4ZFwiLCBcIlxcdTA0Y2RcIiwgXCJcXHUwNGNlXCIsIFwiXFx1MDUyMFwiLCBcIlxcdTA1MjFcIiwgXCJcXHUwZDY5XCJdLFxuICAgIG46IFtcIlxcdTAwZDFcIiwgXCJcXHUwMTRiXCIsIFwiXFx1MDE5ZFwiLCBcIlxcdTAzNzZcIiwgXCJcXHUwM2EwXCIsIFwiXFx1MDQ4YVwiXSxcbiAgICBvOiBbXCJcXHUwMGQ4XCIsIFwiXFx1MDBmNVwiLCBcIlxcdTAwZjhcIiwgXCJcXHUwMWZlXCIsIFwiXFx1MDI5OFwiLCBcIlxcdTA0N2FcIiwgXCJcXHUwNWRkXCIsIFwiXFx1MDZkZFwiLCBcIlxcdTBlNGZcIl0sXG4gICAgcDogW1wiXFx1MDFmN1wiLCBcIlxcdTA0OGVcIl0sXG4gICAgcTogW1wiXFx1MDljZFwiXSxcbiAgICByOiBbXCJcXHUwMGFlXCIsIFwiXFx1MDFhNlwiLCBcIlxcdTAyMTBcIiwgXCJcXHUwMjRjXCIsIFwiXFx1MDI4MFwiLCBcIlxcdTA0MmZcIl0sXG4gICAgczogW1wiXFx1MDBhN1wiLCBcIlxcdTAzZGVcIiwgXCJcXHUwM2RmXCIsIFwiXFx1MDNlOFwiXSxcbiAgICB0OiBbXCJcXHUwMTQxXCIsIFwiXFx1MDE2NlwiLCBcIlxcdTAzNzNcIl0sXG4gICAgdTogW1wiXFx1MDFiMVwiLCBcIlxcdTA1NGRcIl0sXG4gICAgdjogW1wiXFx1MDVkOFwiXSxcbiAgICB3OiBbXCJcXHUwNDI4XCIsIFwiXFx1MDQ2MFwiLCBcIlxcdTA0N2NcIiwgXCJcXHUwZDcwXCJdLFxuICAgIHg6IFtcIlxcdTA0YjJcIiwgXCJcXHUwNGZlXCIsIFwiXFx1MDRmY1wiLCBcIlxcdTA0ZmRcIl0sXG4gICAgeTogW1wiXFx1MDBhNVwiLCBcIlxcdTA0YjBcIiwgXCJcXHUwNGNiXCJdLFxuICAgIHo6IFtcIlxcdTAxYjVcIiwgXCJcXHUwMjQwXCJdXG4gIH1cbiAgdGV4dC5mb3JFYWNoKGZ1bmN0aW9uKGMpe1xuICAgIGMgPSBjLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIGNoYXJzID0gdHJhcFtjXSB8fCBbXCIgXCJdO1xuICAgIHZhciByYW5kID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoKTtcbiAgICBpZiAodHlwZW9mIHRyYXBbY10gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJlc3VsdCArPSB0cmFwW2NdW3JhbmRdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgKz0gYztcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xuXG59XG4iLCIvLyBwbGVhc2Ugbm9cbm1vZHVsZVsnZXhwb3J0cyddID0gZnVuY3Rpb24gemFsZ28odGV4dCwgb3B0aW9ucykge1xuICB0ZXh0ID0gdGV4dCB8fCBcIiAgIGhlIGlzIGhlcmUgICBcIjtcbiAgdmFyIHNvdWwgPSB7XG4gICAgXCJ1cFwiIDogW1xuICAgICAgJ8yNJywgJ8yOJywgJ8yEJywgJ8yFJyxcbiAgICAgICfMvycsICfMkScsICfMhicsICfMkCcsXG4gICAgICAnzZInLCAnzZcnLCAnzZEnLCAnzIcnLFxuICAgICAgJ8yIJywgJ8yKJywgJ82CJywgJ8yTJyxcbiAgICAgICfMiCcsICfNiicsICfNiycsICfNjCcsXG4gICAgICAnzIMnLCAnzIInLCAnzIwnLCAnzZAnLFxuICAgICAgJ8yAJywgJ8yBJywgJ8yLJywgJ8yPJyxcbiAgICAgICfMkicsICfMkycsICfMlCcsICfMvScsXG4gICAgICAnzIknLCAnzaMnLCAnzaQnLCAnzaUnLFxuICAgICAgJ82mJywgJ82nJywgJ82oJywgJ82pJyxcbiAgICAgICfNqicsICfNqycsICfNrCcsICfNrScsXG4gICAgICAnza4nLCAnza8nLCAnzL4nLCAnzZsnLFxuICAgICAgJ82GJywgJ8yaJ1xuICAgIF0sXG4gICAgXCJkb3duXCIgOiBbXG4gICAgICAnzJYnLCAnzJcnLCAnzJgnLCAnzJknLFxuICAgICAgJ8ycJywgJ8ydJywgJ8yeJywgJ8yfJyxcbiAgICAgICfMoCcsICfMpCcsICfMpScsICfMpicsXG4gICAgICAnzKknLCAnzKonLCAnzKsnLCAnzKwnLFxuICAgICAgJ8ytJywgJ8yuJywgJ8yvJywgJ8ywJyxcbiAgICAgICfMsScsICfMsicsICfMsycsICfMuScsXG4gICAgICAnzLonLCAnzLsnLCAnzLwnLCAnzYUnLFxuICAgICAgJ82HJywgJ82IJywgJ82JJywgJ82NJyxcbiAgICAgICfNjicsICfNkycsICfNlCcsICfNlScsXG4gICAgICAnzZYnLCAnzZknLCAnzZonLCAnzKMnXG4gICAgXSxcbiAgICBcIm1pZFwiIDogW1xuICAgICAgJ8yVJywgJ8ybJywgJ8yAJywgJ8yBJyxcbiAgICAgICfNmCcsICfMoScsICfMoicsICfMpycsXG4gICAgICAnzKgnLCAnzLQnLCAnzLUnLCAnzLYnLFxuICAgICAgJ82cJywgJ82dJywgJ82eJyxcbiAgICAgICfNnycsICfNoCcsICfNoicsICfMuCcsXG4gICAgICAnzLcnLCAnzaEnLCAnINKJJ1xuICAgIF1cbiAgfSxcbiAgYWxsID0gW10uY29uY2F0KHNvdWwudXAsIHNvdWwuZG93biwgc291bC5taWQpLFxuICB6YWxnbyA9IHt9O1xuXG4gIGZ1bmN0aW9uIHJhbmRvbU51bWJlcihyYW5nZSkge1xuICAgIHZhciByID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcmFuZ2UpO1xuICAgIHJldHVybiByO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNfY2hhcihjaGFyYWN0ZXIpIHtcbiAgICB2YXIgYm9vbCA9IGZhbHNlO1xuICAgIGFsbC5maWx0ZXIoZnVuY3Rpb24gKGkpIHtcbiAgICAgIGJvb2wgPSAoaSA9PT0gY2hhcmFjdGVyKTtcbiAgICB9KTtcbiAgICByZXR1cm4gYm9vbDtcbiAgfVxuICBcblxuICBmdW5jdGlvbiBoZUNvbWVzKHRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgcmVzdWx0ID0gJycsIGNvdW50cywgbDtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zW1widXBcIl0gPSBvcHRpb25zW1widXBcIl0gfHwgdHJ1ZTtcbiAgICBvcHRpb25zW1wibWlkXCJdID0gb3B0aW9uc1tcIm1pZFwiXSB8fCB0cnVlO1xuICAgIG9wdGlvbnNbXCJkb3duXCJdID0gb3B0aW9uc1tcImRvd25cIl0gfHwgdHJ1ZTtcbiAgICBvcHRpb25zW1wic2l6ZVwiXSA9IG9wdGlvbnNbXCJzaXplXCJdIHx8IFwibWF4aVwiO1xuICAgIHRleHQgPSB0ZXh0LnNwbGl0KCcnKTtcbiAgICBmb3IgKGwgaW4gdGV4dCkge1xuICAgICAgaWYgKGlzX2NoYXIobCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXN1bHQgPSByZXN1bHQgKyB0ZXh0W2xdO1xuICAgICAgY291bnRzID0ge1widXBcIiA6IDAsIFwiZG93blwiIDogMCwgXCJtaWRcIiA6IDB9O1xuICAgICAgc3dpdGNoIChvcHRpb25zLnNpemUpIHtcbiAgICAgIGNhc2UgJ21pbmknOlxuICAgICAgICBjb3VudHMudXAgPSByYW5kb21OdW1iZXIoOCk7XG4gICAgICAgIGNvdW50cy5taW4gPSByYW5kb21OdW1iZXIoMik7XG4gICAgICAgIGNvdW50cy5kb3duID0gcmFuZG9tTnVtYmVyKDgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21heGknOlxuICAgICAgICBjb3VudHMudXAgPSByYW5kb21OdW1iZXIoMTYpICsgMztcbiAgICAgICAgY291bnRzLm1pbiA9IHJhbmRvbU51bWJlcig0KSArIDE7XG4gICAgICAgIGNvdW50cy5kb3duID0gcmFuZG9tTnVtYmVyKDY0KSArIDM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY291bnRzLnVwID0gcmFuZG9tTnVtYmVyKDgpICsgMTtcbiAgICAgICAgY291bnRzLm1pZCA9IHJhbmRvbU51bWJlcig2KSAvIDI7XG4gICAgICAgIGNvdW50cy5kb3duID0gcmFuZG9tTnVtYmVyKDgpICsgMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHZhciBhcnIgPSBbXCJ1cFwiLCBcIm1pZFwiLCBcImRvd25cIl07XG4gICAgICBmb3IgKHZhciBkIGluIGFycikge1xuICAgICAgICB2YXIgaW5kZXggPSBhcnJbZF07XG4gICAgICAgIGZvciAodmFyIGkgPSAwIDsgaSA8PSBjb3VudHNbaW5kZXhdOyBpKyspIHtcbiAgICAgICAgICBpZiAob3B0aW9uc1tpbmRleF0pIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdCArIHNvdWxbaW5kZXhdW3JhbmRvbU51bWJlcihzb3VsW2luZGV4XS5sZW5ndGgpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICAvLyBkb24ndCBzdW1tb24gaGltXG4gIHJldHVybiBoZUNvbWVzKHRleHQpO1xufVxuIiwidmFyIGNvbG9ycyA9IHJlcXVpcmUoJy4uL2NvbG9ycycpO1xuXG5tb2R1bGVbJ2V4cG9ydHMnXSA9IChmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChsZXR0ZXIsIGksIGV4cGxvZGVkKSB7XG4gICAgaWYobGV0dGVyID09PSBcIiBcIikgcmV0dXJuIGxldHRlcjtcbiAgICBzd2l0Y2goaSUzKSB7XG4gICAgICBjYXNlIDA6IHJldHVybiBjb2xvcnMucmVkKGxldHRlcik7XG4gICAgICBjYXNlIDE6IHJldHVybiBjb2xvcnMud2hpdGUobGV0dGVyKVxuICAgICAgY2FzZSAyOiByZXR1cm4gY29sb3JzLmJsdWUobGV0dGVyKVxuICAgIH1cbiAgfVxufSkoKTsiLCJ2YXIgY29sb3JzID0gcmVxdWlyZSgnLi4vY29sb3JzJyk7XG5cbm1vZHVsZVsnZXhwb3J0cyddID0gKGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJhaW5ib3dDb2xvcnMgPSBbJ3JlZCcsICd5ZWxsb3cnLCAnZ3JlZW4nLCAnYmx1ZScsICdtYWdlbnRhJ107IC8vUm9ZIEcgQmlWXG4gIHJldHVybiBmdW5jdGlvbiAobGV0dGVyLCBpLCBleHBsb2RlZCkge1xuICAgIGlmIChsZXR0ZXIgPT09IFwiIFwiKSB7XG4gICAgICByZXR1cm4gbGV0dGVyO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY29sb3JzW3JhaW5ib3dDb2xvcnNbaSsrICUgcmFpbmJvd0NvbG9ycy5sZW5ndGhdXShsZXR0ZXIpO1xuICAgIH1cbiAgfTtcbn0pKCk7XG5cbiIsInZhciBjb2xvcnMgPSByZXF1aXJlKCcuLi9jb2xvcnMnKTtcblxubW9kdWxlWydleHBvcnRzJ10gPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgYXZhaWxhYmxlID0gWyd1bmRlcmxpbmUnLCAnaW52ZXJzZScsICdncmV5JywgJ3llbGxvdycsICdyZWQnLCAnZ3JlZW4nLCAnYmx1ZScsICd3aGl0ZScsICdjeWFuJywgJ21hZ2VudGEnXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGxldHRlciwgaSwgZXhwbG9kZWQpIHtcbiAgICByZXR1cm4gbGV0dGVyID09PSBcIiBcIiA/IGxldHRlciA6IGNvbG9yc1thdmFpbGFibGVbTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogKGF2YWlsYWJsZS5sZW5ndGggLSAxKSldXShsZXR0ZXIpO1xuICB9O1xufSkoKTsiLCJ2YXIgY29sb3JzID0gcmVxdWlyZSgnLi4vY29sb3JzJyk7XG5cbm1vZHVsZVsnZXhwb3J0cyddID0gZnVuY3Rpb24gKGxldHRlciwgaSwgZXhwbG9kZWQpIHtcbiAgcmV0dXJuIGkgJSAyID09PSAwID8gbGV0dGVyIDogY29sb3JzLmludmVyc2UobGV0dGVyKTtcbn07IiwiLypcblRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG5Db3B5cmlnaHQgKGMpIFNpbmRyZSBTb3JodXMgPHNpbmRyZXNvcmh1c0BnbWFpbC5jb20+IChzaW5kcmVzb3JodXMuY29tKVxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuXG5cbiovXG5cbnZhciBzdHlsZXMgPSB7fTtcbm1vZHVsZVsnZXhwb3J0cyddID0gc3R5bGVzO1xuXG52YXIgY29kZXMgPSB7XG4gIHJlc2V0OiBbMCwgMF0sXG5cbiAgYm9sZDogWzEsIDIyXSxcbiAgZGltOiBbMiwgMjJdLFxuICBpdGFsaWM6IFszLCAyM10sXG4gIHVuZGVybGluZTogWzQsIDI0XSxcbiAgaW52ZXJzZTogWzcsIDI3XSxcbiAgaGlkZGVuOiBbOCwgMjhdLFxuICBzdHJpa2V0aHJvdWdoOiBbOSwgMjldLFxuXG4gIGJsYWNrOiBbMzAsIDM5XSxcbiAgcmVkOiBbMzEsIDM5XSxcbiAgZ3JlZW46IFszMiwgMzldLFxuICB5ZWxsb3c6IFszMywgMzldLFxuICBibHVlOiBbMzQsIDM5XSxcbiAgbWFnZW50YTogWzM1LCAzOV0sXG4gIGN5YW46IFszNiwgMzldLFxuICB3aGl0ZTogWzM3LCAzOV0sXG4gIGdyYXk6IFs5MCwgMzldLFxuICBncmV5OiBbOTAsIDM5XSxcblxuICBiZ0JsYWNrOiBbNDAsIDQ5XSxcbiAgYmdSZWQ6IFs0MSwgNDldLFxuICBiZ0dyZWVuOiBbNDIsIDQ5XSxcbiAgYmdZZWxsb3c6IFs0MywgNDldLFxuICBiZ0JsdWU6IFs0NCwgNDldLFxuICBiZ01hZ2VudGE6IFs0NSwgNDldLFxuICBiZ0N5YW46IFs0NiwgNDldLFxuICBiZ1doaXRlOiBbNDcsIDQ5XSxcblxuICAvLyBsZWdhY3kgc3R5bGVzIGZvciBjb2xvcnMgcHJlIHYxLjAuMFxuICBibGFja0JHOiBbNDAsIDQ5XSxcbiAgcmVkQkc6IFs0MSwgNDldLFxuICBncmVlbkJHOiBbNDIsIDQ5XSxcbiAgeWVsbG93Qkc6IFs0MywgNDldLFxuICBibHVlQkc6IFs0NCwgNDldLFxuICBtYWdlbnRhQkc6IFs0NSwgNDldLFxuICBjeWFuQkc6IFs0NiwgNDldLFxuICB3aGl0ZUJHOiBbNDcsIDQ5XVxuXG59O1xuXG5PYmplY3Qua2V5cyhjb2RlcykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciB2YWwgPSBjb2Rlc1trZXldO1xuICB2YXIgc3R5bGUgPSBzdHlsZXNba2V5XSA9IFtdO1xuICBzdHlsZS5vcGVuID0gJ1xcdTAwMWJbJyArIHZhbFswXSArICdtJztcbiAgc3R5bGUuY2xvc2UgPSAnXFx1MDAxYlsnICsgdmFsWzFdICsgJ20nO1xufSk7IiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qXG5UaGUgTUlUIExpY2Vuc2UgKE1JVClcblxuQ29weXJpZ2h0IChjKSBTaW5kcmUgU29yaHVzIDxzaW5kcmVzb3JodXNAZ21haWwuY29tPiAoc2luZHJlc29yaHVzLmNvbSlcblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuXG4qL1xuXG52YXIgYXJndiA9IHByb2Nlc3MuYXJndjtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuICBpZiAoYXJndi5pbmRleE9mKCctLW5vLWNvbG9yJykgIT09IC0xIHx8XG4gICAgYXJndi5pbmRleE9mKCctLWNvbG9yPWZhbHNlJykgIT09IC0xKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKGFyZ3YuaW5kZXhPZignLS1jb2xvcicpICE9PSAtMSB8fFxuICAgIGFyZ3YuaW5kZXhPZignLS1jb2xvcj10cnVlJykgIT09IC0xIHx8XG4gICAgYXJndi5pbmRleE9mKCctLWNvbG9yPWFsd2F5cycpICE9PSAtMSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKHByb2Nlc3Muc3Rkb3V0ICYmICFwcm9jZXNzLnN0ZG91dC5pc1RUWSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAoJ0NPTE9SVEVSTScgaW4gcHJvY2Vzcy5lbnYpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLmVudi5URVJNID09PSAnZHVtYicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoL15zY3JlZW58Xnh0ZXJtfF52dDEwMHxjb2xvcnxhbnNpfGN5Z3dpbnxsaW51eC9pLnRlc3QocHJvY2Vzcy5lbnYuVEVSTSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn0pKCk7XG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSkiLCIvL1xuLy8gUmVtYXJrOiBSZXF1aXJpbmcgdGhpcyBmaWxlIHdpbGwgdXNlIHRoZSBcInNhZmVcIiBjb2xvcnMgQVBJIHdoaWNoIHdpbGwgbm90IHRvdWNoIFN0cmluZy5wcm90b3R5cGVcbi8vXG4vLyAgIHZhciBjb2xvcnMgPSByZXF1aXJlKCdjb2xvcnMvc2FmZSk7XG4vLyAgIGNvbG9ycy5yZWQoXCJmb29cIilcbi8vXG4vL1xudmFyIGNvbG9ycyA9IHJlcXVpcmUoJy4vbGliL2NvbG9ycycpO1xubW9kdWxlWydleHBvcnRzJ10gPSBjb2xvcnM7IiwiKCAvLyBNb2R1bGUgYm9pbGVycGxhdGUgdG8gc3VwcG9ydCBicm93c2VyIGdsb2JhbHMgYW5kIGJyb3dzZXJpZnkgYW5kIEFNRC5cbiAgdHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiID8gZnVuY3Rpb24gKG0pIHsgZGVmaW5lKFwibXNncGFjay1qc1wiLCBtKTsgfSA6XG4gIHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiID8gZnVuY3Rpb24gKG0pIHsgbW9kdWxlLmV4cG9ydHMgPSBtKCk7IH0gOlxuICBmdW5jdGlvbihtKXsgdGhpcy5tc2dwYWNrID0gbSgpOyB9XG4pKGZ1bmN0aW9uICgpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgZXhwb3J0cyA9IHt9O1xuXG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuZnVuY3Rpb24gaW5zcGVjdChidWZmZXIpIHtcbiAgaWYgKGJ1ZmZlciA9PT0gdW5kZWZpbmVkKSByZXR1cm4gXCJ1bmRlZmluZWRcIjtcbiAgdmFyIHZpZXc7XG4gIHZhciB0eXBlO1xuICBpZiAoYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICB0eXBlID0gXCJBcnJheUJ1ZmZlclwiO1xuICAgIHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcbiAgfVxuICBlbHNlIGlmIChidWZmZXIgaW5zdGFuY2VvZiBEYXRhVmlldykge1xuICAgIHR5cGUgPSBcIkRhdGFWaWV3XCI7XG4gICAgdmlldyA9IGJ1ZmZlcjtcbiAgfVxuICBpZiAoIXZpZXcpIHJldHVybiBKU09OLnN0cmluZ2lmeShidWZmZXIpO1xuICB2YXIgYnl0ZXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBidWZmZXIuYnl0ZUxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGkgPiAyMCkge1xuICAgICAgYnl0ZXMucHVzaChcIi4uLlwiKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB2YXIgYnl0ZSA9IHZpZXcuZ2V0VWludDgoaSkudG9TdHJpbmcoMTYpO1xuICAgIGlmIChieXRlLmxlbmd0aCA9PT0gMSkgYnl0ZSA9IFwiMFwiICsgYnl0ZTtcbiAgICBieXRlcy5wdXNoKGJ5dGUpO1xuICB9XG4gIHJldHVybiBcIjxcIiArIHR5cGUgKyBcIiBcIiArIGJ5dGVzLmpvaW4oXCIgXCIpICsgXCI+XCI7XG59XG5cbi8vIEVuY29kZSBzdHJpbmcgYXMgdXRmOCBpbnRvIGRhdGF2aWV3IGF0IG9mZnNldFxuZXhwb3J0cy51dGY4V3JpdGUgPSB1dGY4V3JpdGU7XG5mdW5jdGlvbiB1dGY4V3JpdGUodmlldywgb2Zmc2V0LCBzdHJpbmcpIHtcbiAgdmFyIGJ5dGVMZW5ndGggPSB2aWV3LmJ5dGVMZW5ndGg7XG4gIGZvcih2YXIgaSA9IDAsIGwgPSBzdHJpbmcubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xuXG4gICAgLy8gT25lIGJ5dGUgb2YgVVRGLThcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQrKywgY29kZVBvaW50ID4+PiAwICYgMHg3ZiB8IDB4MDApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gVHdvIGJ5dGVzIG9mIFVURi04XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCsrLCBjb2RlUG9pbnQgPj4+IDYgJiAweDFmIHwgMHhjMCk7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCsrLCBjb2RlUG9pbnQgPj4+IDAgJiAweDNmIHwgMHg4MCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBUaHJlZSBieXRlcyBvZiBVVEYtOC4gIFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCsrLCBjb2RlUG9pbnQgPj4+IDEyICYgMHgwZiB8IDB4ZTApO1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQrKywgY29kZVBvaW50ID4+PiA2ICAmIDB4M2YgfCAweDgwKTtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0KyssIGNvZGVQb2ludCA+Pj4gMCAgJiAweDNmIHwgMHg4MCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBGb3VyIGJ5dGVzIG9mIFVURi04XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCsrLCBjb2RlUG9pbnQgPj4+IDE4ICYgMHgwNyB8IDB4ZjApO1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQrKywgY29kZVBvaW50ID4+PiAxMiAmIDB4M2YgfCAweDgwKTtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0KyssIGNvZGVQb2ludCA+Pj4gNiAgJiAweDNmIHwgMHg4MCk7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCsrLCBjb2RlUG9pbnQgPj4+IDAgICYgMHgzZiB8IDB4ODApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcImJhZCBjb2RlcG9pbnQgXCIgKyBjb2RlUG9pbnQpO1xuICB9XG59XG5cbmV4cG9ydHMudXRmOFJlYWQgPSB1dGY4UmVhZDtcbmZ1bmN0aW9uIHV0ZjhSZWFkKHZpZXcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBzdHJpbmcgPSBcIlwiO1xuICBmb3IgKHZhciBpID0gb2Zmc2V0LCBlbmQgPSBvZmZzZXQgKyBsZW5ndGg7IGkgPCBlbmQ7IGkrKykge1xuICAgIHZhciBieXRlID0gdmlldy5nZXRVaW50OChpKTtcbiAgICAvLyBPbmUgYnl0ZSBjaGFyYWN0ZXJcbiAgICBpZiAoKGJ5dGUgJiAweDgwKSA9PT0gMHgwMCkge1xuICAgICAgc3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gVHdvIGJ5dGUgY2hhcmFjdGVyXG4gICAgaWYgKChieXRlICYgMHhlMCkgPT09IDB4YzApIHtcbiAgICAgIHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKFxuICAgICAgICAoKGJ5dGUgJiAweDBmKSA8PCA2KSB8IFxuICAgICAgICAodmlldy5nZXRVaW50OCgrK2kpICYgMHgzZilcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gVGhyZWUgYnl0ZSBjaGFyYWN0ZXJcbiAgICBpZiAoKGJ5dGUgJiAweGYwKSA9PT0gMHhlMCkge1xuICAgICAgc3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoXG4gICAgICAgICgoYnl0ZSAmIDB4MGYpIDw8IDEyKSB8XG4gICAgICAgICgodmlldy5nZXRVaW50OCgrK2kpICYgMHgzZikgPDwgNikgfFxuICAgICAgICAoKHZpZXcuZ2V0VWludDgoKytpKSAmIDB4M2YpIDw8IDApXG4gICAgICApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIC8vIEZvdXIgYnl0ZSBjaGFyYWN0ZXJcbiAgICBpZiAoKGJ5dGUgJiAweGY4KSA9PT0gMHhmMCkge1xuICAgICAgc3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoXG4gICAgICAgICgoYnl0ZSAmIDB4MDcpIDw8IDE4KSB8XG4gICAgICAgICgodmlldy5nZXRVaW50OCgrK2kpICYgMHgzZikgPDwgMTIpIHxcbiAgICAgICAgKCh2aWV3LmdldFVpbnQ4KCsraSkgJiAweDNmKSA8PCA2KSB8XG4gICAgICAgICgodmlldy5nZXRVaW50OCgrK2kpICYgMHgzZikgPDwgMClcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBieXRlIFwiICsgYnl0ZS50b1N0cmluZygxNikpO1xuICB9XG4gIHJldHVybiBzdHJpbmc7XG59XG5cbmV4cG9ydHMudXRmOEJ5dGVDb3VudCA9IHV0ZjhCeXRlQ291bnQ7XG5mdW5jdGlvbiB1dGY4Qnl0ZUNvdW50KHN0cmluZykge1xuICB2YXIgY291bnQgPSAwO1xuICBmb3IodmFyIGkgPSAwLCBsID0gc3RyaW5nLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHZhciBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgY291bnQgKz0gMTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGNvdW50ICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGNvdW50ICs9IDM7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBjb3VudCArPSA0O1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcImJhZCBjb2RlcG9pbnQgXCIgKyBjb2RlUG9pbnQpO1xuICB9XG4gIHJldHVybiBjb3VudDtcbn1cblxuZXhwb3J0cy5lbmNvZGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihzaXplb2YodmFsdWUpKTtcbiAgdmFyIHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcbiAgZW5jb2RlKHZhbHVlLCB2aWV3LCAwKTtcbiAgcmV0dXJuIGJ1ZmZlcjtcbn1cblxuZXhwb3J0cy5kZWNvZGUgPSBkZWNvZGU7XG5cbi8vIGh0dHA6Ly93aWtpLm1zZ3BhY2sub3JnL2Rpc3BsYXkvTVNHUEFDSy9Gb3JtYXQrc3BlY2lmaWNhdGlvblxuLy8gSSd2ZSBleHRlbmRlZCB0aGUgcHJvdG9jb2wgdG8gaGF2ZSB0d28gbmV3IHR5cGVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHJlc2VydmVkLlxuLy8gICBidWZmZXIgMTYgIDExMDExMDAwICAweGQ4XG4vLyAgIGJ1ZmZlciAzMiAgMTEwMTEwMDEgIDB4ZDlcbi8vIFRoZXNlIHdvcmsganVzdCBsaWtlIHJhdzE2IGFuZCByYXczMiBleGNlcHQgdGhleSBhcmUgbm9kZSBidWZmZXJzIGluc3RlYWQgb2Ygc3RyaW5ncy5cbi8vXG4vLyBBbHNvIEkndmUgYWRkZWQgYSB0eXBlIGZvciBgdW5kZWZpbmVkYFxuLy8gICB1bmRlZmluZWQgIDExMDAwMTAwICAweGM0XG5cbmZ1bmN0aW9uIERlY29kZXIodmlldywgb2Zmc2V0KSB7XG4gIHRoaXMub2Zmc2V0ID0gb2Zmc2V0IHx8IDA7XG4gIHRoaXMudmlldyA9IHZpZXc7XG59XG5EZWNvZGVyLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gIHZhciB2YWx1ZSA9IHt9O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGtleSA9IHRoaXMucGFyc2UoKTtcbiAgICB2YWx1ZVtrZXldID0gdGhpcy5wYXJzZSgpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5EZWNvZGVyLnByb3RvdHlwZS5idWYgPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gIHZhciB2YWx1ZSA9IG5ldyBBcnJheUJ1ZmZlcihsZW5ndGgpO1xuICAobmV3IFVpbnQ4QXJyYXkodmFsdWUpKS5zZXQobmV3IFVpbnQ4QXJyYXkodGhpcy52aWV3LmJ1ZmZlciwgdGhpcy5vZmZzZXQsIGxlbmd0aCksIDApO1xuICB0aGlzLm9mZnNldCArPSBsZW5ndGg7XG4gIHJldHVybiB2YWx1ZTtcbn07XG5EZWNvZGVyLnByb3RvdHlwZS5yYXcgPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gIHZhciB2YWx1ZSA9IHV0ZjhSZWFkKHRoaXMudmlldywgdGhpcy5vZmZzZXQsIGxlbmd0aCk7XG4gIHRoaXMub2Zmc2V0ICs9IGxlbmd0aDtcbiAgcmV0dXJuIHZhbHVlO1xufTtcbkRlY29kZXIucHJvdG90eXBlLmFycmF5ID0gZnVuY3Rpb24gKGxlbmd0aCkge1xuICB2YXIgdmFsdWUgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhbHVlW2ldID0gdGhpcy5wYXJzZSgpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5EZWNvZGVyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHR5cGUgPSB0aGlzLnZpZXcuZ2V0VWludDgodGhpcy5vZmZzZXQpO1xuICB2YXIgdmFsdWUsIGxlbmd0aDtcbiAgLy8gRml4UmF3XG4gIGlmICgodHlwZSAmIDB4ZTApID09PSAweGEwKSB7XG4gICAgbGVuZ3RoID0gdHlwZSAmIDB4MWY7XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdGhpcy5yYXcobGVuZ3RoKTtcbiAgfVxuICAvLyBGaXhNYXBcbiAgaWYgKCh0eXBlICYgMHhmMCkgPT09IDB4ODApIHtcbiAgICBsZW5ndGggPSB0eXBlICYgMHgwZjtcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiB0aGlzLm1hcChsZW5ndGgpO1xuICB9XG4gIC8vIEZpeEFycmF5XG4gIGlmICgodHlwZSAmIDB4ZjApID09PSAweDkwKSB7XG4gICAgbGVuZ3RoID0gdHlwZSAmIDB4MGY7XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdGhpcy5hcnJheShsZW5ndGgpO1xuICB9XG4gIC8vIFBvc2l0aXZlIEZpeE51bVxuICBpZiAoKHR5cGUgJiAweDgwKSA9PT0gMHgwMCkge1xuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cbiAgLy8gTmVnYXRpdmUgRml4bnVtXG4gIGlmICgodHlwZSAmIDB4ZTApID09PSAweGUwKSB7XG4gICAgdmFsdWUgPSB0aGlzLnZpZXcuZ2V0SW50OCh0aGlzLm9mZnNldCk7XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgc3dpdGNoICh0eXBlKSB7XG4gIC8vIHJhdyAxNlxuICBjYXNlIDB4ZGE6XG4gICAgbGVuZ3RoID0gdGhpcy52aWV3LmdldFVpbnQxNih0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDM7XG4gICAgcmV0dXJuIHRoaXMucmF3KGxlbmd0aCk7XG4gIC8vIHJhdyAzMlxuICBjYXNlIDB4ZGI6XG4gICAgbGVuZ3RoID0gdGhpcy52aWV3LmdldFVpbnQzMih0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDU7XG4gICAgcmV0dXJuIHRoaXMucmF3KGxlbmd0aCk7XG4gIC8vIG5pbFxuICBjYXNlIDB4YzA6XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gbnVsbDtcbiAgLy8gZmFsc2VcbiAgY2FzZSAweGMyOlxuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyB0cnVlXG4gIGNhc2UgMHhjMzpcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiB0cnVlO1xuICAvLyB1bmRlZmluZWRcbiAgY2FzZSAweGM0OlxuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgLy8gdWludDhcbiAgY2FzZSAweGNjOlxuICAgIHZhbHVlID0gdGhpcy52aWV3LmdldFVpbnQ4KHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMjtcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIHVpbnQgMTZcbiAgY2FzZSAweGNkOlxuICAgIHZhbHVlID0gdGhpcy52aWV3LmdldFVpbnQxNih0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDM7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyB1aW50IDMyXG4gIGNhc2UgMHhjZTpcbiAgICB2YWx1ZSA9IHRoaXMudmlldy5nZXRVaW50MzIodGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA1O1xuICAgIHJldHVybiB2YWx1ZTtcbiAgLy8gaW50IDhcbiAgY2FzZSAweGQwOlxuICAgIHZhbHVlID0gdGhpcy52aWV3LmdldEludDgodGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSAyO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgLy8gaW50IDE2XG4gIGNhc2UgMHhkMTpcbiAgICB2YWx1ZSA9IHRoaXMudmlldy5nZXRJbnQxNih0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDM7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyBpbnQgMzJcbiAgY2FzZSAweGQyOlxuICAgIHZhbHVlID0gdGhpcy52aWV3LmdldEludDMyKHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gNTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIG1hcCAxNlxuICBjYXNlIDB4ZGU6XG4gICAgbGVuZ3RoID0gdGhpcy52aWV3LmdldFVpbnQxNih0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDM7XG4gICAgcmV0dXJuIHRoaXMubWFwKGxlbmd0aCk7XG4gIC8vIG1hcCAzMlxuICBjYXNlIDB4ZGY6XG4gICAgbGVuZ3RoID0gdGhpcy52aWV3LmdldFVpbnQzMih0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDU7XG4gICAgcmV0dXJuIHRoaXMubWFwKGxlbmd0aCk7XG4gIC8vIGFycmF5IDE2XG4gIGNhc2UgMHhkYzpcbiAgICBsZW5ndGggPSB0aGlzLnZpZXcuZ2V0VWludDE2KHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdGhpcy5hcnJheShsZW5ndGgpO1xuICAvLyBhcnJheSAzMlxuICBjYXNlIDB4ZGQ6XG4gICAgbGVuZ3RoID0gdGhpcy52aWV3LmdldFVpbnQzMih0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDU7XG4gICAgcmV0dXJuIHRoaXMuYXJyYXkobGVuZ3RoKTtcbiAgLy8gYnVmZmVyIDE2XG4gIGNhc2UgMHhkODpcbiAgICBsZW5ndGggPSB0aGlzLnZpZXcuZ2V0VWludDE2KHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdGhpcy5idWYobGVuZ3RoKTtcbiAgLy8gYnVmZmVyIDMyXG4gIGNhc2UgMHhkOTpcbiAgICBsZW5ndGggPSB0aGlzLnZpZXcuZ2V0VWludDMyKHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gNTtcbiAgICByZXR1cm4gdGhpcy5idWYobGVuZ3RoKTtcbiAgLy8gZmxvYXRcbiAgY2FzZSAweGNhOlxuICAgIHZhbHVlID0gdGhpcy52aWV3LmdldEZsb2F0MzIodGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA1O1xuICAgIHJldHVybiB2YWx1ZTtcbiAgLy8gZG91YmxlXG4gIGNhc2UgMHhjYjpcbiAgICB2YWx1ZSA9IHRoaXMudmlldy5nZXRGbG9hdDY0KHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gOTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biB0eXBlIDB4XCIgKyB0eXBlLnRvU3RyaW5nKDE2KSk7XG59O1xuZnVuY3Rpb24gZGVjb2RlKGJ1ZmZlcikge1xuICB2YXIgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuICB2YXIgZGVjb2RlciA9IG5ldyBEZWNvZGVyKHZpZXcpO1xuICB2YXIgdmFsdWUgPSBkZWNvZGVyLnBhcnNlKCk7XG4gIGlmIChkZWNvZGVyLm9mZnNldCAhPT0gYnVmZmVyLmJ5dGVMZW5ndGgpIHRocm93IG5ldyBFcnJvcigoYnVmZmVyLmJ5dGVMZW5ndGggLSBkZWNvZGVyLm9mZnNldCkgKyBcIiB0cmFpbGluZyBieXRlc1wiKTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBlbmNvZGUodmFsdWUsIHZpZXcsIG9mZnNldCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcblxuICAvLyBTdHJpbmdzIEJ5dGVzXG4gIGlmICh0eXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgdmFyIGxlbmd0aCA9IHV0ZjhCeXRlQ291bnQodmFsdWUpO1xuICAgIC8vIGZpeCByYXdcbiAgICBpZiAobGVuZ3RoIDwgMHgyMCkge1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIGxlbmd0aCB8IDB4YTApO1xuICAgICAgdXRmOFdyaXRlKHZpZXcsIG9mZnNldCArIDEsIHZhbHVlKTtcbiAgICAgIHJldHVybiAxICsgbGVuZ3RoO1xuICAgIH1cbiAgICAvLyByYXcgMTZcbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMCkge1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIDB4ZGEpO1xuICAgICAgdmlldy5zZXRVaW50MTYob2Zmc2V0ICsgMSwgbGVuZ3RoKTtcbiAgICAgIHV0ZjhXcml0ZSh2aWV3LCBvZmZzZXQgKyAzLCB2YWx1ZSk7XG4gICAgICByZXR1cm4gMyArIGxlbmd0aDtcbiAgICB9XG4gICAgLy8gcmF3IDMyXG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDAwMDAwKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgMHhkYik7XG4gICAgICB2aWV3LnNldFVpbnQzMihvZmZzZXQgKyAxLCBsZW5ndGgpO1xuICAgICAgdXRmOFdyaXRlKHZpZXcsIG9mZnNldCArIDUsIHZhbHVlKTtcbiAgICAgIHJldHVybiA1ICsgbGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgdmFyIGxlbmd0aCA9IHZhbHVlLmJ5dGVMZW5ndGg7XG4gICAgLy8gYnVmZmVyIDE2XG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDApIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCAweGQ4KTtcbiAgICAgIHZpZXcuc2V0VWludDE2KG9mZnNldCArIDEsIGxlbmd0aCk7XG4gICAgICAobmV3IFVpbnQ4QXJyYXkodmlldy5idWZmZXIpKS5zZXQobmV3IFVpbnQ4QXJyYXkodmFsdWUpLCBvZmZzZXQgKyAzKTtcbiAgICAgIHJldHVybiAzICsgbGVuZ3RoO1xuICAgIH1cbiAgICAvLyBidWZmZXIgMzJcbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMDAwMDApIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCAweGQ5KTtcbiAgICAgIHZpZXcuc2V0VWludDMyKG9mZnNldCArIDEsIGxlbmd0aCk7XG4gICAgICAobmV3IFVpbnQ4QXJyYXkodmlldy5idWZmZXIpKS5zZXQobmV3IFVpbnQ4QXJyYXkodmFsdWUpLCBvZmZzZXQgKyA1KTtcbiAgICAgIHJldHVybiA1ICsgbGVuZ3RoO1xuICAgIH1cbiAgfVxuICBcbiAgaWYgKHR5cGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAvLyBGbG9hdGluZyBQb2ludFxuICAgIGlmICgodmFsdWUgPDwgMCkgIT09IHZhbHVlKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgMHhjYik7XG4gICAgICB2aWV3LnNldEZsb2F0NjQob2Zmc2V0ICsgMSwgdmFsdWUpO1xuICAgICAgcmV0dXJuIDk7XG4gICAgfVxuXG4gICAgLy8gSW50ZWdlcnNcbiAgICBpZiAodmFsdWUgPj0wKSB7XG4gICAgICAvLyBwb3NpdGl2ZSBmaXhudW1cbiAgICAgIGlmICh2YWx1ZSA8IDB4ODApIHtcbiAgICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG4gICAgICAvLyB1aW50IDhcbiAgICAgIGlmICh2YWx1ZSA8IDB4MTAwKSB7XG4gICAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCAweGNjKTtcbiAgICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQgKyAxLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiAyO1xuICAgICAgfVxuICAgICAgLy8gdWludCAxNlxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDAwMCkge1xuICAgICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgMHhjZCk7XG4gICAgICAgIHZpZXcuc2V0VWludDE2KG9mZnNldCArIDEsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIDM7XG4gICAgICB9XG4gICAgICAvLyB1aW50IDMyXG4gICAgICBpZiAodmFsdWUgPCAweDEwMDAwMDAwMCkge1xuICAgICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgMHhjZSk7XG4gICAgICAgIHZpZXcuc2V0VWludDMyKG9mZnNldCArIDEsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIDU7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOdW1iZXIgdG9vIGJpZyAweFwiICsgdmFsdWUudG9TdHJpbmcoMTYpKTtcbiAgICB9XG4gICAgLy8gbmVnYXRpdmUgZml4bnVtXG4gICAgaWYgKHZhbHVlID49IC0weDIwKSB7XG4gICAgICB2aWV3LnNldEludDgob2Zmc2V0LCB2YWx1ZSk7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgLy8gaW50IDhcbiAgICBpZiAodmFsdWUgPj0gLTB4ODApIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCAweGQwKTtcbiAgICAgIHZpZXcuc2V0SW50OChvZmZzZXQgKyAxLCB2YWx1ZSk7XG4gICAgICByZXR1cm4gMjtcbiAgICB9XG4gICAgLy8gaW50IDE2XG4gICAgaWYgKHZhbHVlID49IC0weDgwMDApIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCAweGQxKTtcbiAgICAgIHZpZXcuc2V0SW50MTYob2Zmc2V0ICsgMSwgdmFsdWUpO1xuICAgICAgcmV0dXJuIDM7XG4gICAgfVxuICAgIC8vIGludCAzMlxuICAgIGlmICh2YWx1ZSA+PSAtMHg4MDAwMDAwMCkge1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIDB4ZDIpO1xuICAgICAgdmlldy5zZXRJbnQzMihvZmZzZXQgKyAxLCB2YWx1ZSk7XG4gICAgICByZXR1cm4gNTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTnVtYmVyIHRvbyBzbWFsbCAtMHhcIiArICgtdmFsdWUpLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSkpO1xuICB9XG4gIFxuICAvLyB1bmRlZmluZWRcbiAgaWYgKHR5cGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgMHhjNCk7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgXG4gIC8vIG51bGxcbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgdmlldy5zZXRVaW50OChvZmZzZXQsIDB4YzApO1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLy8gQm9vbGVhblxuICBpZiAodHlwZSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgdmFsdWUgPyAweGMzIDogMHhjMik7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgXG4gIC8vIENvbnRhaW5lciBUeXBlc1xuICBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikge1xuICAgIHZhciBsZW5ndGgsIHNpemUgPSAwO1xuICAgIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG5cbiAgICBpZiAoaXNBcnJheSkge1xuICAgICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgfVxuXG4gICAgdmFyIHNpemU7XG4gICAgaWYgKGxlbmd0aCA8IDB4MTApIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCBsZW5ndGggfCAoaXNBcnJheSA/IDB4OTAgOiAweDgwKSk7XG4gICAgICBzaXplID0gMTtcbiAgICB9XG4gICAgZWxzZSBpZiAobGVuZ3RoIDwgMHgxMDAwMCkge1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIGlzQXJyYXkgPyAweGRjIDogMHhkZSk7XG4gICAgICB2aWV3LnNldFVpbnQxNihvZmZzZXQgKyAxLCBsZW5ndGgpO1xuICAgICAgc2l6ZSA9IDM7XG4gICAgfVxuICAgIGVsc2UgaWYgKGxlbmd0aCA8IDB4MTAwMDAwMDAwKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgaXNBcnJheSA/IDB4ZGQgOiAweGRmKTtcbiAgICAgIHZpZXcuc2V0VWludDMyKG9mZnNldCArIDEsIGxlbmd0aCk7XG4gICAgICBzaXplID0gNTtcbiAgICB9XG5cbiAgICBpZiAoaXNBcnJheSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBzaXplICs9IGVuY29kZSh2YWx1ZVtpXSwgdmlldywgb2Zmc2V0ICsgc2l6ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgc2l6ZSArPSBlbmNvZGUoa2V5LCB2aWV3LCBvZmZzZXQgKyBzaXplKTtcbiAgICAgICAgc2l6ZSArPSBlbmNvZGUodmFsdWVba2V5XSwgdmlldywgb2Zmc2V0ICsgc2l6ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBzaXplO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gdHlwZSBcIiArIHR5cGUpO1xufVxuXG5mdW5jdGlvbiBzaXplb2YodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG5cbiAgLy8gUmF3IEJ5dGVzXG4gIGlmICh0eXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgdmFyIGxlbmd0aCA9IHV0ZjhCeXRlQ291bnQodmFsdWUpO1xuICAgIGlmIChsZW5ndGggPCAweDIwKSB7XG4gICAgICByZXR1cm4gMSArIGxlbmd0aDtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDApIHtcbiAgICAgIHJldHVybiAzICsgbGVuZ3RoO1xuICAgIH1cbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMDAwMDApIHtcbiAgICAgIHJldHVybiA1ICsgbGVuZ3RoO1xuICAgIH1cbiAgfVxuICBcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICB2YXIgbGVuZ3RoID0gdmFsdWUuYnl0ZUxlbmd0aDtcbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMCkge1xuICAgICAgcmV0dXJuIDMgKyBsZW5ndGg7XG4gICAgfVxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwMDAwMCkge1xuICAgICAgcmV0dXJuIDUgKyBsZW5ndGg7XG4gICAgfVxuICB9XG4gIFxuICBpZiAodHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgIC8vIEZsb2F0aW5nIFBvaW50XG4gICAgLy8gZG91YmxlXG4gICAgaWYgKHZhbHVlIDw8IDAgIT09IHZhbHVlKSByZXR1cm4gOTtcblxuICAgIC8vIEludGVnZXJzXG4gICAgaWYgKHZhbHVlID49MCkge1xuICAgICAgLy8gcG9zaXRpdmUgZml4bnVtXG4gICAgICBpZiAodmFsdWUgPCAweDgwKSByZXR1cm4gMTtcbiAgICAgIC8vIHVpbnQgOFxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDApIHJldHVybiAyO1xuICAgICAgLy8gdWludCAxNlxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDAwMCkgcmV0dXJuIDM7XG4gICAgICAvLyB1aW50IDMyXG4gICAgICBpZiAodmFsdWUgPCAweDEwMDAwMDAwMCkgcmV0dXJuIDU7XG4gICAgICAvLyB1aW50IDY0XG4gICAgICBpZiAodmFsdWUgPCAweDEwMDAwMDAwMDAwMDAwMDAwKSByZXR1cm4gOTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk51bWJlciB0b28gYmlnIDB4XCIgKyB2YWx1ZS50b1N0cmluZygxNikpO1xuICAgIH1cbiAgICAvLyBuZWdhdGl2ZSBmaXhudW1cbiAgICBpZiAodmFsdWUgPj0gLTB4MjApIHJldHVybiAxO1xuICAgIC8vIGludCA4XG4gICAgaWYgKHZhbHVlID49IC0weDgwKSByZXR1cm4gMjtcbiAgICAvLyBpbnQgMTZcbiAgICBpZiAodmFsdWUgPj0gLTB4ODAwMCkgcmV0dXJuIDM7XG4gICAgLy8gaW50IDMyXG4gICAgaWYgKHZhbHVlID49IC0weDgwMDAwMDAwKSByZXR1cm4gNTtcbiAgICAvLyBpbnQgNjRcbiAgICBpZiAodmFsdWUgPj0gLTB4ODAwMDAwMDAwMDAwMDAwMCkgcmV0dXJuIDk7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTnVtYmVyIHRvbyBzbWFsbCAtMHhcIiArIHZhbHVlLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSkpO1xuICB9XG4gIFxuICAvLyBCb29sZWFuLCBudWxsLCB1bmRlZmluZWRcbiAgaWYgKHR5cGUgPT09IFwiYm9vbGVhblwiIHx8IHR5cGUgPT09IFwidW5kZWZpbmVkXCIgfHwgdmFsdWUgPT09IG51bGwpIHJldHVybiAxO1xuICBcbiAgLy8gQ29udGFpbmVyIFR5cGVzXG4gIGlmICh0eXBlID09PSBcIm9iamVjdFwiKSB7XG4gICAgdmFyIGxlbmd0aCwgc2l6ZSA9IDA7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNpemUgKz0gc2l6ZW9mKHZhbHVlW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgc2l6ZSArPSBzaXplb2Yoa2V5KSArIHNpemVvZih2YWx1ZVtrZXldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDB4MTApIHtcbiAgICAgIHJldHVybiAxICsgc2l6ZTtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDApIHtcbiAgICAgIHJldHVybiAzICsgc2l6ZTtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDAwMDAwKSB7XG4gICAgICByZXR1cm4gNSArIHNpemU7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkFycmF5IG9yIG9iamVjdCB0b28gbG9uZyAweFwiICsgbGVuZ3RoLnRvU3RyaW5nKDE2KSk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biB0eXBlIFwiICsgdHlwZSk7XG59XG5cbnJldHVybiBleHBvcnRzO1xuXG59KTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgYm9wcyA9IHJlcXVpcmUoJ2JvcHMnKTtcblxuZXhwb3J0cy5lbmNvZGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIHRvSlNPTmVkID0gW11cbiAgdmFyIHNpemUgPSBzaXplb2YodmFsdWUpXG4gIGlmKHNpemUgPT0gMClcbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIHZhciBidWZmZXIgPSBib3BzLmNyZWF0ZShzaXplKTtcbiAgZW5jb2RlKHZhbHVlLCBidWZmZXIsIDApO1xuICByZXR1cm4gYnVmZmVyO1xufTtcblxuZXhwb3J0cy5kZWNvZGUgPSBkZWNvZGU7XG5cbi8vIGh0dHA6Ly93aWtpLm1zZ3BhY2sub3JnL2Rpc3BsYXkvTVNHUEFDSy9Gb3JtYXQrc3BlY2lmaWNhdGlvblxuLy8gSSd2ZSBleHRlbmRlZCB0aGUgcHJvdG9jb2wgdG8gaGF2ZSB0d28gbmV3IHR5cGVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHJlc2VydmVkLlxuLy8gICBidWZmZXIgMTYgIDExMDExMDAwICAweGQ4XG4vLyAgIGJ1ZmZlciAzMiAgMTEwMTEwMDEgIDB4ZDlcbi8vIFRoZXNlIHdvcmsganVzdCBsaWtlIHJhdzE2IGFuZCByYXczMiBleGNlcHQgdGhleSBhcmUgbm9kZSBidWZmZXJzIGluc3RlYWQgb2Ygc3RyaW5ncy5cbi8vXG4vLyBBbHNvIEkndmUgYWRkZWQgYSB0eXBlIGZvciBgdW5kZWZpbmVkYFxuLy8gICB1bmRlZmluZWQgIDExMDAwMTAwICAweGM0XG5cbmZ1bmN0aW9uIERlY29kZXIoYnVmZmVyLCBvZmZzZXQpIHtcbiAgdGhpcy5vZmZzZXQgPSBvZmZzZXQgfHwgMDtcbiAgdGhpcy5idWZmZXIgPSBidWZmZXI7XG59XG5EZWNvZGVyLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gIHZhciB2YWx1ZSA9IHt9O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGtleSA9IHRoaXMucGFyc2UoKTtcbiAgICB2YWx1ZVtrZXldID0gdGhpcy5wYXJzZSgpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5EZWNvZGVyLnByb3RvdHlwZS5idWYgPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gIHZhciB2YWx1ZSA9IGJvcHMuc3ViYXJyYXkodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0LCB0aGlzLm9mZnNldCArIGxlbmd0aCk7XG4gIHRoaXMub2Zmc2V0ICs9IGxlbmd0aDtcbiAgcmV0dXJuIHZhbHVlO1xufTtcbkRlY29kZXIucHJvdG90eXBlLnJhdyA9IGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgdmFyIHZhbHVlID0gYm9wcy50byhib3BzLnN1YmFycmF5KHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCwgdGhpcy5vZmZzZXQgKyBsZW5ndGgpKTtcbiAgdGhpcy5vZmZzZXQgKz0gbGVuZ3RoO1xuICByZXR1cm4gdmFsdWU7XG59O1xuRGVjb2Rlci5wcm90b3R5cGUuYXJyYXkgPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gIHZhciB2YWx1ZSA9IG5ldyBBcnJheShsZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFsdWVbaV0gPSB0aGlzLnBhcnNlKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcbkRlY29kZXIucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdHlwZSA9IHRoaXMuYnVmZmVyW3RoaXMub2Zmc2V0XTtcbiAgdmFyIHZhbHVlLCBsZW5ndGg7XG4gIC8vIEZpeFJhd1xuICBpZiAoKHR5cGUgJiAweGUwKSA9PT0gMHhhMCkge1xuICAgIGxlbmd0aCA9IHR5cGUgJiAweDFmO1xuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIHRoaXMucmF3KGxlbmd0aCk7XG4gIH1cbiAgLy8gRml4TWFwXG4gIGlmICgodHlwZSAmIDB4ZjApID09PSAweDgwKSB7XG4gICAgbGVuZ3RoID0gdHlwZSAmIDB4MGY7XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdGhpcy5tYXAobGVuZ3RoKTtcbiAgfVxuICAvLyBGaXhBcnJheVxuICBpZiAoKHR5cGUgJiAweGYwKSA9PT0gMHg5MCkge1xuICAgIGxlbmd0aCA9IHR5cGUgJiAweDBmO1xuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIHRoaXMuYXJyYXkobGVuZ3RoKTtcbiAgfVxuICAvLyBQb3NpdGl2ZSBGaXhOdW1cbiAgaWYgKCh0eXBlICYgMHg4MCkgPT09IDB4MDApIHtcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiB0eXBlO1xuICB9XG4gIC8vIE5lZ2F0aXZlIEZpeG51bVxuICBpZiAoKHR5cGUgJiAweGUwKSA9PT0gMHhlMCkge1xuICAgIHZhbHVlID0gYm9wcy5yZWFkSW50OCh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQpO1xuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHN3aXRjaCAodHlwZSkge1xuICAvLyByYXcgMTZcbiAgY2FzZSAweGRhOlxuICAgIGxlbmd0aCA9IGJvcHMucmVhZFVJbnQxNkJFKHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDM7XG4gICAgcmV0dXJuIHRoaXMucmF3KGxlbmd0aCk7XG4gIC8vIHJhdyAzMlxuICBjYXNlIDB4ZGI6XG4gICAgbGVuZ3RoID0gYm9wcy5yZWFkVUludDMyQkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gNTtcbiAgICByZXR1cm4gdGhpcy5yYXcobGVuZ3RoKTtcbiAgLy8gbmlsXG4gIGNhc2UgMHhjMDpcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiBudWxsO1xuICAvLyBmYWxzZVxuICBjYXNlIDB4YzI6XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIHRydWVcbiAgY2FzZSAweGMzOlxuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIHRydWU7XG4gIC8vIHVuZGVmaW5lZFxuICBjYXNlIDB4YzQ6XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAvLyB1aW50OFxuICBjYXNlIDB4Y2M6XG4gICAgdmFsdWUgPSB0aGlzLmJ1ZmZlclt0aGlzLm9mZnNldCArIDFdO1xuICAgIHRoaXMub2Zmc2V0ICs9IDI7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyB1aW50IDE2XG4gIGNhc2UgMHhjZDpcbiAgICB2YWx1ZSA9IGJvcHMucmVhZFVJbnQxNkJFKHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDM7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyB1aW50IDMyXG4gIGNhc2UgMHhjZTpcbiAgICB2YWx1ZSA9IGJvcHMucmVhZFVJbnQzMkJFKHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDU7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyB1aW50NjRcbiAgY2FzZSAweGNmOlxuICAgIHZhbHVlID0gYm9wcy5yZWFkVUludDY0QkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gOTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIGludCA4XG4gIGNhc2UgMHhkMDpcbiAgICB2YWx1ZSA9IGJvcHMucmVhZEludDgodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMjtcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIGludCAxNlxuICBjYXNlIDB4ZDE6XG4gICAgdmFsdWUgPSBib3BzLnJlYWRJbnQxNkJFKHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDM7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyBpbnQgMzJcbiAgY2FzZSAweGQyOlxuICAgIHZhbHVlID0gYm9wcy5yZWFkSW50MzJCRSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA1O1xuICAgIHJldHVybiB2YWx1ZTtcbiAgLy8gaW50IDY0XG4gIGNhc2UgMHhkMzpcbiAgICB2YWx1ZSA9IGJvcHMucmVhZEludDY0QkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gOTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIG1hcCAxNlxuICBjYXNlIDB4ZGU6XG4gICAgbGVuZ3RoID0gYm9wcy5yZWFkVUludDE2QkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdGhpcy5tYXAobGVuZ3RoKTtcbiAgLy8gbWFwIDMyXG4gIGNhc2UgMHhkZjpcbiAgICBsZW5ndGggPSBib3BzLnJlYWRVSW50MzJCRSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA1O1xuICAgIHJldHVybiB0aGlzLm1hcChsZW5ndGgpO1xuICAvLyBhcnJheSAxNlxuICBjYXNlIDB4ZGM6XG4gICAgbGVuZ3RoID0gYm9wcy5yZWFkVUludDE2QkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdGhpcy5hcnJheShsZW5ndGgpO1xuICAvLyBhcnJheSAzMlxuICBjYXNlIDB4ZGQ6XG4gICAgbGVuZ3RoID0gYm9wcy5yZWFkVUludDMyQkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gNTtcbiAgICByZXR1cm4gdGhpcy5hcnJheShsZW5ndGgpO1xuICAvLyBidWZmZXIgMTZcbiAgY2FzZSAweGQ4OlxuICAgIGxlbmd0aCA9IGJvcHMucmVhZFVJbnQxNkJFKHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDM7XG4gICAgcmV0dXJuIHRoaXMuYnVmKGxlbmd0aCk7XG4gIC8vIGJ1ZmZlciAzMlxuICBjYXNlIDB4ZDk6XG4gICAgbGVuZ3RoID0gYm9wcy5yZWFkVUludDMyQkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gNTtcbiAgICByZXR1cm4gdGhpcy5idWYobGVuZ3RoKTtcbiAgLy8gZmxvYXRcbiAgY2FzZSAweGNhOlxuICAgIHZhbHVlID0gYm9wcy5yZWFkRmxvYXRCRSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA1O1xuICAgIHJldHVybiB2YWx1ZTtcbiAgLy8gZG91YmxlXG4gIGNhc2UgMHhjYjpcbiAgICB2YWx1ZSA9IGJvcHMucmVhZERvdWJsZUJFKHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gdHlwZSAweFwiICsgdHlwZS50b1N0cmluZygxNikpO1xufTtcbmZ1bmN0aW9uIGRlY29kZShidWZmZXIpIHtcbiAgdmFyIGRlY29kZXIgPSBuZXcgRGVjb2RlcihidWZmZXIpO1xuICB2YXIgdmFsdWUgPSBkZWNvZGVyLnBhcnNlKCk7XG4gIGlmIChkZWNvZGVyLm9mZnNldCAhPT0gYnVmZmVyLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKChidWZmZXIubGVuZ3RoIC0gZGVjb2Rlci5vZmZzZXQpICsgXCIgdHJhaWxpbmcgYnl0ZXNcIik7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZW5jb2RlYWJsZUtleXMgKHZhbHVlKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyh2YWx1ZSkuZmlsdGVyKGZ1bmN0aW9uIChlKSB7XG4gICAgcmV0dXJuICdmdW5jdGlvbicgIT09IHR5cGVvZiB2YWx1ZVtlXSB8fCAhIXZhbHVlW2VdLnRvSlNPTlxuICB9KVxufVxuXG5mdW5jdGlvbiBlbmNvZGUodmFsdWUsIGJ1ZmZlciwgb2Zmc2V0KSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICB2YXIgbGVuZ3RoLCBzaXplO1xuXG4gIC8vIFN0cmluZ3MgQnl0ZXNcbiAgaWYgKHR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICB2YWx1ZSA9IGJvcHMuZnJvbSh2YWx1ZSk7XG4gICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgIC8vIGZpeCByYXdcbiAgICBpZiAobGVuZ3RoIDwgMHgyMCkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSBsZW5ndGggfCAweGEwO1xuICAgICAgYm9wcy5jb3B5KHZhbHVlLCBidWZmZXIsIG9mZnNldCArIDEpO1xuICAgICAgcmV0dXJuIDEgKyBsZW5ndGg7XG4gICAgfVxuICAgIC8vIHJhdyAxNlxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwKSB7XG4gICAgICBidWZmZXJbb2Zmc2V0XSA9IDB4ZGE7XG4gICAgICBib3BzLndyaXRlVUludDE2QkUoYnVmZmVyLCBsZW5ndGgsIG9mZnNldCArIDEpO1xuICAgICAgYm9wcy5jb3B5KHZhbHVlLCBidWZmZXIsIG9mZnNldCArIDMpO1xuICAgICAgcmV0dXJuIDMgKyBsZW5ndGg7XG4gICAgfVxuICAgIC8vIHJhdyAzMlxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwMDAwMCkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSAweGRiO1xuICAgICAgYm9wcy53cml0ZVVJbnQzMkJFKGJ1ZmZlciwgbGVuZ3RoLCBvZmZzZXQgKyAxKTtcbiAgICAgIGJvcHMuY29weSh2YWx1ZSwgYnVmZmVyLCBvZmZzZXQgKyA1KTtcbiAgICAgIHJldHVybiA1ICsgbGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIGlmIChib3BzLmlzKHZhbHVlKSkge1xuICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcbiAgICAvLyBidWZmZXIgMTZcbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMCkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSAweGQ4O1xuICAgICAgYm9wcy53cml0ZVVJbnQxNkJFKGJ1ZmZlciwgbGVuZ3RoLCBvZmZzZXQgKyAxKTtcbiAgICAgIGJvcHMuY29weSh2YWx1ZSwgYnVmZmVyLCBvZmZzZXQgKyAzKTtcbiAgICAgIHJldHVybiAzICsgbGVuZ3RoO1xuICAgIH1cbiAgICAvLyBidWZmZXIgMzJcbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMDAwMDApIHtcbiAgICAgIGJ1ZmZlcltvZmZzZXRdID0gMHhkOTtcbiAgICAgIGJvcHMud3JpdGVVSW50MzJCRShidWZmZXIsIGxlbmd0aCwgb2Zmc2V0ICsgMSk7XG4gICAgICBib3BzLmNvcHkodmFsdWUsIGJ1ZmZlciwgb2Zmc2V0ICsgNSk7XG4gICAgICByZXR1cm4gNSArIGxlbmd0aDtcbiAgICB9XG4gIH1cblxuICBpZiAodHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgIC8vIEZsb2F0aW5nIFBvaW50XG4gICAgaWYgKCh2YWx1ZSA8PCAwKSAhPT0gdmFsdWUpIHtcbiAgICAgIGJ1ZmZlcltvZmZzZXRdID0gIDB4Y2I7XG4gICAgICBib3BzLndyaXRlRG91YmxlQkUoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0ICsgMSk7XG4gICAgICByZXR1cm4gOTtcbiAgICB9XG5cbiAgICAvLyBJbnRlZ2Vyc1xuICAgIGlmICh2YWx1ZSA+PTApIHtcbiAgICAgIC8vIHBvc2l0aXZlIGZpeG51bVxuICAgICAgaWYgKHZhbHVlIDwgMHg4MCkge1xuICAgICAgICBidWZmZXJbb2Zmc2V0XSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIC8vIHVpbnQgOFxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDApIHtcbiAgICAgICAgYnVmZmVyW29mZnNldF0gPSAweGNjO1xuICAgICAgICBidWZmZXJbb2Zmc2V0ICsgMV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIDI7XG4gICAgICB9XG4gICAgICAvLyB1aW50IDE2XG4gICAgICBpZiAodmFsdWUgPCAweDEwMDAwKSB7XG4gICAgICAgIGJ1ZmZlcltvZmZzZXRdID0gMHhjZDtcbiAgICAgICAgYm9wcy53cml0ZVVJbnQxNkJFKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCArIDEpO1xuICAgICAgICByZXR1cm4gMztcbiAgICAgIH1cbiAgICAgIC8vIHVpbnQgMzJcbiAgICAgIGlmICh2YWx1ZSA8IDB4MTAwMDAwMDAwKSB7XG4gICAgICAgIGJ1ZmZlcltvZmZzZXRdID0gMHhjZTtcbiAgICAgICAgYm9wcy53cml0ZVVJbnQzMkJFKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCArIDEpO1xuICAgICAgICByZXR1cm4gNTtcbiAgICAgIH1cbiAgICAgIC8vIHVpbnQgNjRcbiAgICAgIGlmICh2YWx1ZSA8IDB4MTAwMDAwMDAwMDAwMDAwMDApIHtcbiAgICAgICAgYnVmZmVyW29mZnNldF0gPSAweGNmO1xuICAgICAgICBib3BzLndyaXRlVUludDY0QkUoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0ICsgMSk7XG4gICAgICAgIHJldHVybiA5O1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTnVtYmVyIHRvbyBiaWcgMHhcIiArIHZhbHVlLnRvU3RyaW5nKDE2KSk7XG4gICAgfVxuICAgIC8vIG5lZ2F0aXZlIGZpeG51bVxuICAgIGlmICh2YWx1ZSA+PSAtMHgyMCkge1xuICAgICAgYm9wcy53cml0ZUludDgoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0KTtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICAvLyBpbnQgOFxuICAgIGlmICh2YWx1ZSA+PSAtMHg4MCkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSAweGQwO1xuICAgICAgYm9wcy53cml0ZUludDgoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0ICsgMSk7XG4gICAgICByZXR1cm4gMjtcbiAgICB9XG4gICAgLy8gaW50IDE2XG4gICAgaWYgKHZhbHVlID49IC0weDgwMDApIHtcbiAgICAgIGJ1ZmZlcltvZmZzZXRdID0gMHhkMTtcbiAgICAgIGJvcHMud3JpdGVJbnQxNkJFKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCArIDEpO1xuICAgICAgcmV0dXJuIDM7XG4gICAgfVxuICAgIC8vIGludCAzMlxuICAgIGlmICh2YWx1ZSA+PSAtMHg4MDAwMDAwMCkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSAweGQyO1xuICAgICAgYm9wcy53cml0ZUludDMyQkUoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0ICsgMSk7XG4gICAgICByZXR1cm4gNTtcbiAgICB9XG4gICAgLy8gaW50IDY0XG4gICAgaWYgKHZhbHVlID49IC0weDgwMDAwMDAwMDAwMDAwMDApIHtcbiAgICAgIGJ1ZmZlcltvZmZzZXRdID0gMHhkMztcbiAgICAgIGJvcHMud3JpdGVJbnQ2NEJFKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCArIDEpO1xuICAgICAgcmV0dXJuIDk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIk51bWJlciB0b28gc21hbGwgLTB4XCIgKyB2YWx1ZS50b1N0cmluZygxNikuc3Vic3RyKDEpKTtcbiAgfVxuXG4gIC8vIHVuZGVmaW5lZFxuICBpZiAodHlwZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGJ1ZmZlcltvZmZzZXRdID0gMHhjNDtcbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIC8vIG51bGxcbiAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgYnVmZmVyW29mZnNldF0gPSAweGMwO1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLy8gQm9vbGVhblxuICBpZiAodHlwZSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICBidWZmZXJbb2Zmc2V0XSA9IHZhbHVlID8gMHhjMyA6IDB4YzI7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICBpZignZnVuY3Rpb24nID09PSB0eXBlb2YgdmFsdWUudG9KU09OKVxuICAgIHJldHVybiBlbmNvZGUodmFsdWUudG9KU09OKCksIGJ1ZmZlciwgb2Zmc2V0KVxuXG4gIC8vIENvbnRhaW5lciBUeXBlc1xuICBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikge1xuXG4gICAgc2l6ZSA9IDA7XG4gICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHZhbHVlKTtcblxuICAgIGlmIChpc0FycmF5KSB7XG4gICAgICBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBlbmNvZGVhYmxlS2V5cyh2YWx1ZSlcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIH1cblxuICAgIGlmIChsZW5ndGggPCAweDEwKSB7XG4gICAgICBidWZmZXJbb2Zmc2V0XSA9IGxlbmd0aCB8IChpc0FycmF5ID8gMHg5MCA6IDB4ODApO1xuICAgICAgc2l6ZSA9IDE7XG4gICAgfVxuICAgIGVsc2UgaWYgKGxlbmd0aCA8IDB4MTAwMDApIHtcbiAgICAgIGJ1ZmZlcltvZmZzZXRdID0gaXNBcnJheSA/IDB4ZGMgOiAweGRlO1xuICAgICAgYm9wcy53cml0ZVVJbnQxNkJFKGJ1ZmZlciwgbGVuZ3RoLCBvZmZzZXQgKyAxKTtcbiAgICAgIHNpemUgPSAzO1xuICAgIH1cbiAgICBlbHNlIGlmIChsZW5ndGggPCAweDEwMDAwMDAwMCkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSBpc0FycmF5ID8gMHhkZCA6IDB4ZGY7XG4gICAgICBib3BzLndyaXRlVUludDMyQkUoYnVmZmVyLCBsZW5ndGgsIG9mZnNldCArIDEpO1xuICAgICAgc2l6ZSA9IDU7XG4gICAgfVxuXG4gICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2l6ZSArPSBlbmNvZGUodmFsdWVbaV0sIGJ1ZmZlciwgb2Zmc2V0ICsgc2l6ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgc2l6ZSArPSBlbmNvZGUoa2V5LCBidWZmZXIsIG9mZnNldCArIHNpemUpO1xuICAgICAgICBzaXplICs9IGVuY29kZSh2YWx1ZVtrZXldLCBidWZmZXIsIG9mZnNldCArIHNpemUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzaXplO1xuICB9XG4gIGlmKHR5cGUgPT09IFwiZnVuY3Rpb25cIilcbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gdHlwZSBcIiArIHR5cGUpO1xufVxuXG5mdW5jdGlvbiBzaXplb2YodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHZhciBsZW5ndGgsIHNpemU7XG5cbiAgLy8gUmF3IEJ5dGVzXG4gIGlmICh0eXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgLy8gVE9ETzogdGhpcyBjcmVhdGVzIGEgdGhyb3ctYXdheSBidWZmZXIgd2hpY2ggaXMgcHJvYmFibHkgZXhwZW5zaXZlIG9uIGJyb3dzZXJzLlxuICAgIGxlbmd0aCA9IGJvcHMuZnJvbSh2YWx1ZSkubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPCAweDIwKSB7XG4gICAgICByZXR1cm4gMSArIGxlbmd0aDtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDApIHtcbiAgICAgIHJldHVybiAzICsgbGVuZ3RoO1xuICAgIH1cbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMDAwMDApIHtcbiAgICAgIHJldHVybiA1ICsgbGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIGlmIChib3BzLmlzKHZhbHVlKSkge1xuICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMCkge1xuICAgICAgcmV0dXJuIDMgKyBsZW5ndGg7XG4gICAgfVxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwMDAwMCkge1xuICAgICAgcmV0dXJuIDUgKyBsZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgaWYgKHR5cGUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAvLyBGbG9hdGluZyBQb2ludFxuICAgIC8vIGRvdWJsZVxuICAgIGlmICh2YWx1ZSA8PCAwICE9PSB2YWx1ZSkgcmV0dXJuIDk7XG5cbiAgICAvLyBJbnRlZ2Vyc1xuICAgIGlmICh2YWx1ZSA+PTApIHtcbiAgICAgIC8vIHBvc2l0aXZlIGZpeG51bVxuICAgICAgaWYgKHZhbHVlIDwgMHg4MCkgcmV0dXJuIDE7XG4gICAgICAvLyB1aW50IDhcbiAgICAgIGlmICh2YWx1ZSA8IDB4MTAwKSByZXR1cm4gMjtcbiAgICAgIC8vIHVpbnQgMTZcbiAgICAgIGlmICh2YWx1ZSA8IDB4MTAwMDApIHJldHVybiAzO1xuICAgICAgLy8gdWludCAzMlxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDAwMDAwMDApIHJldHVybiA1O1xuICAgICAgLy8gdWludCA2NFxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDAwMDAwMDAwMDAwMDAwMCkgcmV0dXJuIDk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOdW1iZXIgdG9vIGJpZyAweFwiICsgdmFsdWUudG9TdHJpbmcoMTYpKTtcbiAgICB9XG4gICAgLy8gbmVnYXRpdmUgZml4bnVtXG4gICAgaWYgKHZhbHVlID49IC0weDIwKSByZXR1cm4gMTtcbiAgICAvLyBpbnQgOFxuICAgIGlmICh2YWx1ZSA+PSAtMHg4MCkgcmV0dXJuIDI7XG4gICAgLy8gaW50IDE2XG4gICAgaWYgKHZhbHVlID49IC0weDgwMDApIHJldHVybiAzO1xuICAgIC8vIGludCAzMlxuICAgIGlmICh2YWx1ZSA+PSAtMHg4MDAwMDAwMCkgcmV0dXJuIDU7XG4gICAgLy8gaW50IDY0XG4gICAgaWYgKHZhbHVlID49IC0weDgwMDAwMDAwMDAwMDAwMDApIHJldHVybiA5O1xuICAgIHRocm93IG5ldyBFcnJvcihcIk51bWJlciB0b28gc21hbGwgLTB4XCIgKyB2YWx1ZS50b1N0cmluZygxNikuc3Vic3RyKDEpKTtcbiAgfVxuXG4gIC8vIEJvb2xlYW4sIG51bGwsIHVuZGVmaW5lZFxuICBpZiAodHlwZSA9PT0gXCJib29sZWFuXCIgfHwgdHlwZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCB2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuIDE7XG5cbiAgaWYoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIHZhbHVlLnRvSlNPTilcbiAgICByZXR1cm4gc2l6ZW9mKHZhbHVlLnRvSlNPTigpKVxuXG4gIC8vIENvbnRhaW5lciBUeXBlc1xuICBpZiAodHlwZSA9PT0gXCJvYmplY3RcIikge1xuICAgIGlmKCdmdW5jdGlvbicgPT09IHR5cGVvZiB2YWx1ZS50b0pTT04pXG4gICAgICB2YWx1ZSA9IHZhbHVlLnRvSlNPTigpXG5cbiAgICBzaXplID0gMDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2l6ZSArPSBzaXplb2YodmFsdWVbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gZW5jb2RlYWJsZUtleXModmFsdWUpXG4gICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgIHNpemUgKz0gc2l6ZW9mKGtleSkgKyBzaXplb2YodmFsdWVba2V5XSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChsZW5ndGggPCAweDEwKSB7XG4gICAgICByZXR1cm4gMSArIHNpemU7XG4gICAgfVxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwKSB7XG4gICAgICByZXR1cm4gMyArIHNpemU7XG4gICAgfVxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwMDAwMCkge1xuICAgICAgcmV0dXJuIDUgKyBzaXplO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcnJheSBvciBvYmplY3QgdG9vIGxvbmcgMHhcIiArIGxlbmd0aC50b1N0cmluZygxNikpO1xuICB9XG4gIGlmKHR5cGUgPT09IFwiZnVuY3Rpb25cIilcbiAgICByZXR1cm4gMFxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHR5cGUgXCIgKyB0eXBlKTtcbn1cblxuXG4iLCJ2YXIgcHJvdG8gPSB7fVxubW9kdWxlLmV4cG9ydHMgPSBwcm90b1xuXG5wcm90by5mcm9tID0gcmVxdWlyZSgnLi9mcm9tLmpzJylcbnByb3RvLnRvID0gcmVxdWlyZSgnLi90by5qcycpXG5wcm90by5pcyA9IHJlcXVpcmUoJy4vaXMuanMnKVxucHJvdG8uc3ViYXJyYXkgPSByZXF1aXJlKCcuL3N1YmFycmF5LmpzJylcbnByb3RvLmpvaW4gPSByZXF1aXJlKCcuL2pvaW4uanMnKVxucHJvdG8uY29weSA9IHJlcXVpcmUoJy4vY29weS5qcycpXG5wcm90by5jcmVhdGUgPSByZXF1aXJlKCcuL2NyZWF0ZS5qcycpXG5cbm1peChyZXF1aXJlKCcuL3JlYWQuanMnKSwgcHJvdG8pXG5taXgocmVxdWlyZSgnLi93cml0ZS5qcycpLCBwcm90bylcblxuZnVuY3Rpb24gbWl4KGZyb20sIGludG8pIHtcbiAgZm9yKHZhciBrZXkgaW4gZnJvbSkge1xuICAgIGludG9ba2V5XSA9IGZyb21ba2V5XVxuICB9XG59XG4iLCIoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkoYjY0KSB7XG5cdFx0dmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnI7XG5cdFxuXHRcdGlmIChiNjQubGVuZ3RoICUgNCA+IDApIHtcblx0XHRcdHRocm93ICdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jztcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0cGxhY2VIb2xkZXJzID0gYjY0LmluZGV4T2YoJz0nKTtcblx0XHRwbGFjZUhvbGRlcnMgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIHBsYWNlSG9sZGVycyA6IDA7XG5cblx0XHQvLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcblx0XHRhcnIgPSBbXTsvL25ldyBVaW50OEFycmF5KGI2NC5sZW5ndGggKiAzIC8gNCAtIHBsYWNlSG9sZGVycyk7XG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGg7XG5cblx0XHRmb3IgKGkgPSAwLCBqID0gMDsgaSA8IGw7IGkgKz0gNCwgaiArPSAzKSB7XG5cdFx0XHR0bXAgPSAobG9va3VwLmluZGV4T2YoYjY0W2ldKSA8PCAxOCkgfCAobG9va3VwLmluZGV4T2YoYjY0W2kgKyAxXSkgPDwgMTIpIHwgKGxvb2t1cC5pbmRleE9mKGI2NFtpICsgMl0pIDw8IDYpIHwgbG9va3VwLmluZGV4T2YoYjY0W2kgKyAzXSk7XG5cdFx0XHRhcnIucHVzaCgodG1wICYgMHhGRjAwMDApID4+IDE2KTtcblx0XHRcdGFyci5wdXNoKCh0bXAgJiAweEZGMDApID4+IDgpO1xuXHRcdFx0YXJyLnB1c2godG1wICYgMHhGRik7XG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGxvb2t1cC5pbmRleE9mKGI2NFtpXSkgPDwgMikgfCAobG9va3VwLmluZGV4T2YoYjY0W2kgKyAxXSkgPj4gNCk7XG5cdFx0XHRhcnIucHVzaCh0bXAgJiAweEZGKTtcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGxvb2t1cC5pbmRleE9mKGI2NFtpXSkgPDwgMTApIHwgKGxvb2t1cC5pbmRleE9mKGI2NFtpICsgMV0pIDw8IDQpIHwgKGxvb2t1cC5pbmRleE9mKGI2NFtpICsgMl0pID4+IDIpO1xuXHRcdFx0YXJyLnB1c2goKHRtcCA+PiA4KSAmIDB4RkYpO1xuXHRcdFx0YXJyLnB1c2godG1wICYgMHhGRik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFycjtcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQodWludDgpIHtcblx0XHR2YXIgaSxcblx0XHRcdGV4dHJhQnl0ZXMgPSB1aW50OC5sZW5ndGggJSAzLCAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuXHRcdFx0b3V0cHV0ID0gXCJcIixcblx0XHRcdHRlbXAsIGxlbmd0aDtcblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICsgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICsgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gKyBsb29rdXBbbnVtICYgMHgzRl07XG5cdFx0fTtcblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pO1xuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKTtcblx0XHR9XG5cblx0XHQvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG5cdFx0c3dpdGNoIChleHRyYUJ5dGVzKSB7XG5cdFx0XHRjYXNlIDE6XG5cdFx0XHRcdHRlbXAgPSB1aW50OFt1aW50OC5sZW5ndGggLSAxXTtcblx0XHRcdFx0b3V0cHV0ICs9IGxvb2t1cFt0ZW1wID4+IDJdO1xuXHRcdFx0XHRvdXRwdXQgKz0gbG9va3VwWyh0ZW1wIDw8IDQpICYgMHgzRl07XG5cdFx0XHRcdG91dHB1dCArPSAnPT0nO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSk7XG5cdFx0XHRcdG91dHB1dCArPSBsb29rdXBbdGVtcCA+PiAxMF07XG5cdFx0XHRcdG91dHB1dCArPSBsb29rdXBbKHRlbXAgPj4gNCkgJiAweDNGXTtcblx0XHRcdFx0b3V0cHV0ICs9IGxvb2t1cFsodGVtcCA8PCAyKSAmIDB4M0ZdO1xuXHRcdFx0XHRvdXRwdXQgKz0gJz0nO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0O1xuXHR9XG5cblx0bW9kdWxlLmV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheTtcblx0bW9kdWxlLmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IHVpbnQ4VG9CYXNlNjQ7XG59KCkpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB0b191dGY4XG5cbnZhciBvdXQgPSBbXVxuICAsIGNvbCA9IFtdXG4gICwgZmNjID0gU3RyaW5nLmZyb21DaGFyQ29kZVxuICAsIG1hc2sgPSBbMHg0MCwgMHgyMCwgMHgxMCwgMHgwOCwgMHgwNCwgMHgwMiwgMHgwMV1cbiAgLCB1bm1hc2sgPSBbXG4gICAgICAweDAwXG4gICAgLCAweDAxXG4gICAgLCAweDAyIHwgMHgwMVxuICAgICwgMHgwNCB8IDB4MDIgfCAweDAxXG4gICAgLCAweDA4IHwgMHgwNCB8IDB4MDIgfCAweDAxXG4gICAgLCAweDEwIHwgMHgwOCB8IDB4MDQgfCAweDAyIHwgMHgwMVxuICAgICwgMHgyMCB8IDB4MTAgfCAweDA4IHwgMHgwNCB8IDB4MDIgfCAweDAxXG4gICAgLCAweDQwIHwgMHgyMCB8IDB4MTAgfCAweDA4IHwgMHgwNCB8IDB4MDIgfCAweDAxXG4gIF1cblxuZnVuY3Rpb24gdG9fdXRmOChieXRlcywgc3RhcnQsIGVuZCkge1xuICBzdGFydCA9IHN0YXJ0ID09PSB1bmRlZmluZWQgPyAwIDogc3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBieXRlcy5sZW5ndGggOiBlbmRcblxuICB2YXIgaWR4ID0gMFxuICAgICwgaGkgPSAweDgwXG4gICAgLCBjb2xsZWN0aW5nID0gMFxuICAgICwgcG9zXG4gICAgLCBieVxuXG4gIGNvbC5sZW5ndGggPVxuICBvdXQubGVuZ3RoID0gMFxuXG4gIHdoaWxlKGlkeCA8IGJ5dGVzLmxlbmd0aCkge1xuICAgIGJ5ID0gYnl0ZXNbaWR4XVxuICAgIGlmKCFjb2xsZWN0aW5nICYmIGJ5ICYgaGkpIHtcbiAgICAgIHBvcyA9IGZpbmRfcGFkX3Bvc2l0aW9uKGJ5KVxuICAgICAgY29sbGVjdGluZyArPSBwb3NcbiAgICAgIGlmKHBvcyA8IDgpIHtcbiAgICAgICAgY29sW2NvbC5sZW5ndGhdID0gYnkgJiB1bm1hc2tbNiAtIHBvc11cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYoY29sbGVjdGluZykge1xuICAgICAgY29sW2NvbC5sZW5ndGhdID0gYnkgJiB1bm1hc2tbNl1cbiAgICAgIC0tY29sbGVjdGluZ1xuICAgICAgaWYoIWNvbGxlY3RpbmcgJiYgY29sLmxlbmd0aCkge1xuICAgICAgICBvdXRbb3V0Lmxlbmd0aF0gPSBmY2MocmVkdWNlZChjb2wsIHBvcykpXG4gICAgICAgIGNvbC5sZW5ndGggPSAwXG4gICAgICB9XG4gICAgfSBlbHNlIHsgXG4gICAgICBvdXRbb3V0Lmxlbmd0aF0gPSBmY2MoYnkpXG4gICAgfVxuICAgICsraWR4XG4gIH1cbiAgaWYoY29sLmxlbmd0aCAmJiAhY29sbGVjdGluZykge1xuICAgIG91dFtvdXQubGVuZ3RoXSA9IGZjYyhyZWR1Y2VkKGNvbCwgcG9zKSlcbiAgICBjb2wubGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBvdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZmluZF9wYWRfcG9zaXRpb24oYnl0KSB7XG4gIGZvcih2YXIgaSA9IDA7IGkgPCA3OyArK2kpIHtcbiAgICBpZighKGJ5dCAmIG1hc2tbaV0pKSB7XG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiByZWR1Y2VkKGxpc3QpIHtcbiAgdmFyIG91dCA9IDBcbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbGlzdC5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIG91dCB8PSBsaXN0W2ldIDw8ICgobGVuIC0gaSAtIDEpICogNilcbiAgfVxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGNvcHlcblxudmFyIHNsaWNlID0gW10uc2xpY2VcblxuZnVuY3Rpb24gY29weShzb3VyY2UsIHRhcmdldCwgdGFyZ2V0X3N0YXJ0LCBzb3VyY2Vfc3RhcnQsIHNvdXJjZV9lbmQpIHtcbiAgdGFyZ2V0X3N0YXJ0ID0gYXJndW1lbnRzLmxlbmd0aCA8IDMgPyAwIDogdGFyZ2V0X3N0YXJ0XG4gIHNvdXJjZV9zdGFydCA9IGFyZ3VtZW50cy5sZW5ndGggPCA0ID8gMCA6IHNvdXJjZV9zdGFydFxuICBzb3VyY2VfZW5kID0gYXJndW1lbnRzLmxlbmd0aCA8IDUgPyBzb3VyY2UubGVuZ3RoIDogc291cmNlX2VuZFxuXG4gIGlmKHNvdXJjZV9lbmQgPT09IHNvdXJjZV9zdGFydCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgaWYodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCBzb3VyY2UubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBpZihzb3VyY2VfZW5kID4gc291cmNlLmxlbmd0aCkge1xuICAgIHNvdXJjZV9lbmQgPSBzb3VyY2UubGVuZ3RoXG4gIH1cblxuICBpZih0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgc291cmNlX2VuZCAtIHNvdXJjZV9zdGFydCkge1xuICAgIHNvdXJjZV9lbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0ICsgc291cmNlX3N0YXJ0XG4gIH1cblxuICBpZihzb3VyY2UuYnVmZmVyICE9PSB0YXJnZXQuYnVmZmVyKSB7XG4gICAgcmV0dXJuIGZhc3RfY29weShzb3VyY2UsIHRhcmdldCwgdGFyZ2V0X3N0YXJ0LCBzb3VyY2Vfc3RhcnQsIHNvdXJjZV9lbmQpXG4gIH1cbiAgcmV0dXJuIHNsb3dfY29weShzb3VyY2UsIHRhcmdldCwgdGFyZ2V0X3N0YXJ0LCBzb3VyY2Vfc3RhcnQsIHNvdXJjZV9lbmQpXG59XG5cbmZ1bmN0aW9uIGZhc3RfY29weShzb3VyY2UsIHRhcmdldCwgdGFyZ2V0X3N0YXJ0LCBzb3VyY2Vfc3RhcnQsIHNvdXJjZV9lbmQpIHtcbiAgdmFyIGxlbiA9IChzb3VyY2VfZW5kIC0gc291cmNlX3N0YXJ0KSArIHRhcmdldF9zdGFydFxuXG4gIGZvcih2YXIgaSA9IHRhcmdldF9zdGFydCwgaiA9IHNvdXJjZV9zdGFydDtcbiAgICAgIGkgPCBsZW47XG4gICAgICArK2ksXG4gICAgICArK2opIHtcbiAgICB0YXJnZXRbaV0gPSBzb3VyY2Vbal1cbiAgfVxufVxuXG5mdW5jdGlvbiBzbG93X2NvcHkoZnJvbSwgdG8sIGosIGksIGplbmQpIHtcbiAgLy8gdGhlIGJ1ZmZlcnMgY291bGQgb3ZlcmxhcC5cbiAgdmFyIGllbmQgPSBqZW5kICsgaVxuICAgICwgdG1wID0gbmV3IFVpbnQ4QXJyYXkoc2xpY2UuY2FsbChmcm9tLCBpLCBpZW5kKSlcbiAgICAsIHggPSAwXG5cbiAgZm9yKDsgaSA8IGllbmQ7ICsraSwgKyt4KSB7XG4gICAgdG9baisrXSA9IHRtcFt4XVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHNpemUpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZyb21cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG5cbnZhciBkZWNvZGVycyA9IHtcbiAgICBoZXg6IGZyb21faGV4XG4gICwgdXRmODogZnJvbV91dGZcbiAgLCBiYXNlNjQ6IGZyb21fYmFzZTY0XG59XG5cbmZ1bmN0aW9uIGZyb20oc291cmNlLCBlbmNvZGluZykge1xuICBpZihBcnJheS5pc0FycmF5KHNvdXJjZSkpIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoc291cmNlKVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZXJzW2VuY29kaW5nIHx8ICd1dGY4J10oc291cmNlKVxufVxuXG5mdW5jdGlvbiBmcm9tX2hleChzdHIpIHtcbiAgdmFyIHNpemUgPSBzdHIubGVuZ3RoIC8gMlxuICAgICwgYnVmID0gbmV3IFVpbnQ4QXJyYXkoc2l6ZSlcbiAgICAsIGNoYXJhY3RlciA9ICcnXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgY2hhcmFjdGVyICs9IHN0ci5jaGFyQXQoaSlcblxuICAgIGlmKGkgPiAwICYmIChpICUgMikgPT09IDEpIHtcbiAgICAgIGJ1ZltpPj4+MV0gPSBwYXJzZUludChjaGFyYWN0ZXIsIDE2KVxuICAgICAgY2hhcmFjdGVyID0gJycgXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZiBcbn1cblxuZnVuY3Rpb24gZnJvbV91dGYoc3RyKSB7XG4gIHZhciBieXRlcyA9IFtdXG4gICAgLCB0bXBcbiAgICAsIGNoXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgY2ggPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGlmKGNoICYgMHg4MCkge1xuICAgICAgdG1wID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0ci5jaGFyQXQoaSkpLnN1YnN0cigxKS5zcGxpdCgnJScpXG4gICAgICBmb3IodmFyIGogPSAwLCBqbGVuID0gdG1wLmxlbmd0aDsgaiA8IGpsZW47ICsraikge1xuICAgICAgICBieXRlc1tieXRlcy5sZW5ndGhdID0gcGFyc2VJbnQodG1wW2pdLCAxNilcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYnl0ZXNbYnl0ZXMubGVuZ3RoXSA9IGNoIFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgVWludDhBcnJheShieXRlcylcbn1cblxuZnVuY3Rpb24gZnJvbV9iYXNlNjQoc3RyKSB7XG4gIHJldHVybiBuZXcgVWludDhBcnJheShiYXNlNjQudG9CeXRlQXJyYXkoc3RyKSkgXG59XG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYnVmZmVyKSB7XG4gIHJldHVybiBidWZmZXIgaW5zdGFuY2VvZiBVaW50OEFycmF5O1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBqb2luXG5cbmZ1bmN0aW9uIGpvaW4odGFyZ2V0cywgaGludCkge1xuICBpZighdGFyZ2V0cy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoMClcbiAgfVxuXG4gIHZhciBsZW4gPSBoaW50ICE9PSB1bmRlZmluZWQgPyBoaW50IDogZ2V0X2xlbmd0aCh0YXJnZXRzKVxuICAgICwgb3V0ID0gbmV3IFVpbnQ4QXJyYXkobGVuKVxuICAgICwgY3VyID0gdGFyZ2V0c1swXVxuICAgICwgY3VybGVuID0gY3VyLmxlbmd0aFxuICAgICwgY3VyaWR4ID0gMFxuICAgICwgY3Vyb2ZmID0gMFxuICAgICwgaSA9IDBcblxuICB3aGlsZShpIDwgbGVuKSB7XG4gICAgaWYoY3Vyb2ZmID09PSBjdXJsZW4pIHtcbiAgICAgIGN1cm9mZiA9IDBcbiAgICAgICsrY3VyaWR4XG4gICAgICBjdXIgPSB0YXJnZXRzW2N1cmlkeF1cbiAgICAgIGN1cmxlbiA9IGN1ciAmJiBjdXIubGVuZ3RoXG4gICAgICBjb250aW51ZVxuICAgIH1cbiAgICBvdXRbaSsrXSA9IGN1cltjdXJvZmYrK10gXG4gIH1cblxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIGdldF9sZW5ndGgodGFyZ2V0cykge1xuICB2YXIgc2l6ZSA9IDBcbiAgZm9yKHZhciBpID0gMCwgbGVuID0gdGFyZ2V0cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHNpemUgKz0gdGFyZ2V0c1tpXS5ieXRlTGVuZ3RoXG4gIH1cbiAgcmV0dXJuIHNpemVcbn1cbiIsInZhciBwcm90b1xuICAsIG1hcFxuXG5tb2R1bGUuZXhwb3J0cyA9IHByb3RvID0ge31cblxubWFwID0gdHlwZW9mIFdlYWtNYXAgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IG5ldyBXZWFrTWFwXG5cbnByb3RvLmdldCA9ICFtYXAgPyBub193ZWFrbWFwX2dldCA6IGdldFxuXG5mdW5jdGlvbiBub193ZWFrbWFwX2dldCh0YXJnZXQpIHtcbiAgcmV0dXJuIG5ldyBEYXRhVmlldyh0YXJnZXQuYnVmZmVyLCAwKVxufVxuXG5mdW5jdGlvbiBnZXQodGFyZ2V0KSB7XG4gIHZhciBvdXQgPSBtYXAuZ2V0KHRhcmdldC5idWZmZXIpXG4gIGlmKCFvdXQpIHtcbiAgICBtYXAuc2V0KHRhcmdldC5idWZmZXIsIG91dCA9IG5ldyBEYXRhVmlldyh0YXJnZXQuYnVmZmVyLCAwKSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByZWFkVUludDg6ICAgICAgcmVhZF91aW50OFxuICAsIHJlYWRJbnQ4OiAgICAgICByZWFkX2ludDhcbiAgLCByZWFkVUludDE2TEU6ICAgcmVhZF91aW50MTZfbGVcbiAgLCByZWFkVUludDMyTEU6ICAgcmVhZF91aW50MzJfbGVcbiAgLCByZWFkSW50MTZMRTogICAgcmVhZF9pbnQxNl9sZVxuICAsIHJlYWRJbnQzMkxFOiAgICByZWFkX2ludDMyX2xlXG4gICwgcmVhZEZsb2F0TEU6ICAgIHJlYWRfZmxvYXRfbGVcbiAgLCByZWFkRG91YmxlTEU6ICAgcmVhZF9kb3VibGVfbGVcbiAgLCByZWFkVUludDE2QkU6ICAgcmVhZF91aW50MTZfYmVcbiAgLCByZWFkVUludDMyQkU6ICAgcmVhZF91aW50MzJfYmVcbiAgLCByZWFkSW50MTZCRTogICAgcmVhZF9pbnQxNl9iZVxuICAsIHJlYWRJbnQzMkJFOiAgICByZWFkX2ludDMyX2JlXG4gICwgcmVhZEZsb2F0QkU6ICAgIHJlYWRfZmxvYXRfYmVcbiAgLCByZWFkRG91YmxlQkU6ICAgcmVhZF9kb3VibGVfYmVcbn1cblxudmFyIG1hcCA9IHJlcXVpcmUoJy4vbWFwcGVkLmpzJylcblxuZnVuY3Rpb24gcmVhZF91aW50OCh0YXJnZXQsIGF0KSB7XG4gIHJldHVybiB0YXJnZXRbYXRdXG59XG5cbmZ1bmN0aW9uIHJlYWRfaW50OCh0YXJnZXQsIGF0KSB7XG4gIHZhciB2ID0gdGFyZ2V0W2F0XTtcbiAgcmV0dXJuIHYgPCAweDgwID8gdiA6IHYgLSAweDEwMFxufVxuXG5mdW5jdGlvbiByZWFkX3VpbnQxNl9sZSh0YXJnZXQsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LmdldFVpbnQxNihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCB0cnVlKVxufVxuXG5mdW5jdGlvbiByZWFkX3VpbnQzMl9sZSh0YXJnZXQsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LmdldFVpbnQzMihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCB0cnVlKVxufVxuXG5mdW5jdGlvbiByZWFkX2ludDE2X2xlKHRhcmdldCwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuZ2V0SW50MTYoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdHJ1ZSlcbn1cblxuZnVuY3Rpb24gcmVhZF9pbnQzMl9sZSh0YXJnZXQsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LmdldEludDMyKGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHRydWUpXG59XG5cbmZ1bmN0aW9uIHJlYWRfZmxvYXRfbGUodGFyZ2V0LCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5nZXRGbG9hdDMyKGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHRydWUpXG59XG5cbmZ1bmN0aW9uIHJlYWRfZG91YmxlX2xlKHRhcmdldCwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuZ2V0RmxvYXQ2NChhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCB0cnVlKVxufVxuXG5mdW5jdGlvbiByZWFkX3VpbnQxNl9iZSh0YXJnZXQsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LmdldFVpbnQxNihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gcmVhZF91aW50MzJfYmUodGFyZ2V0LCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5nZXRVaW50MzIoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIHJlYWRfaW50MTZfYmUodGFyZ2V0LCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5nZXRJbnQxNihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gcmVhZF9pbnQzMl9iZSh0YXJnZXQsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LmdldEludDMyKGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiByZWFkX2Zsb2F0X2JlKHRhcmdldCwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuZ2V0RmxvYXQzMihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gcmVhZF9kb3VibGVfYmUodGFyZ2V0LCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5nZXRGbG9hdDY0KGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIGZhbHNlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBzdWJhcnJheVxuXG5mdW5jdGlvbiBzdWJhcnJheShidWYsIGZyb20sIHRvKSB7XG4gIHJldHVybiBidWYuc3ViYXJyYXkoZnJvbSB8fCAwLCB0byB8fCBidWYubGVuZ3RoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB0b1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbiAgLCB0b3V0ZjggPSByZXF1aXJlKCd0by11dGY4JylcblxudmFyIGVuY29kZXJzID0ge1xuICAgIGhleDogdG9faGV4XG4gICwgdXRmODogdG9fdXRmXG4gICwgYmFzZTY0OiB0b19iYXNlNjRcbn1cblxuZnVuY3Rpb24gdG8oYnVmLCBlbmNvZGluZykge1xuICByZXR1cm4gZW5jb2RlcnNbZW5jb2RpbmcgfHwgJ3V0ZjgnXShidWYpXG59XG5cbmZ1bmN0aW9uIHRvX2hleChidWYpIHtcbiAgdmFyIHN0ciA9ICcnXG4gICAgLCBieXRcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBieXQgPSBidWZbaV1cbiAgICBzdHIgKz0gKChieXQgJiAweEYwKSA+Pj4gNCkudG9TdHJpbmcoMTYpXG4gICAgc3RyICs9IChieXQgJiAweDBGKS50b1N0cmluZygxNilcbiAgfVxuXG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gdG9fdXRmKGJ1Zikge1xuICByZXR1cm4gdG91dGY4KGJ1Zilcbn1cblxuZnVuY3Rpb24gdG9fYmFzZTY0KGJ1Zikge1xuICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB3cml0ZVVJbnQ4OiAgICAgIHdyaXRlX3VpbnQ4XG4gICwgd3JpdGVJbnQ4OiAgICAgICB3cml0ZV9pbnQ4XG4gICwgd3JpdGVVSW50MTZMRTogICB3cml0ZV91aW50MTZfbGVcbiAgLCB3cml0ZVVJbnQzMkxFOiAgIHdyaXRlX3VpbnQzMl9sZVxuICAsIHdyaXRlSW50MTZMRTogICAgd3JpdGVfaW50MTZfbGVcbiAgLCB3cml0ZUludDMyTEU6ICAgIHdyaXRlX2ludDMyX2xlXG4gICwgd3JpdGVGbG9hdExFOiAgICB3cml0ZV9mbG9hdF9sZVxuICAsIHdyaXRlRG91YmxlTEU6ICAgd3JpdGVfZG91YmxlX2xlXG4gICwgd3JpdGVVSW50MTZCRTogICB3cml0ZV91aW50MTZfYmVcbiAgLCB3cml0ZVVJbnQzMkJFOiAgIHdyaXRlX3VpbnQzMl9iZVxuICAsIHdyaXRlSW50MTZCRTogICAgd3JpdGVfaW50MTZfYmVcbiAgLCB3cml0ZUludDMyQkU6ICAgIHdyaXRlX2ludDMyX2JlXG4gICwgd3JpdGVGbG9hdEJFOiAgICB3cml0ZV9mbG9hdF9iZVxuICAsIHdyaXRlRG91YmxlQkU6ICAgd3JpdGVfZG91YmxlX2JlXG59XG5cbnZhciBtYXAgPSByZXF1aXJlKCcuL21hcHBlZC5qcycpXG5cbmZ1bmN0aW9uIHdyaXRlX3VpbnQ4KHRhcmdldCwgdmFsdWUsIGF0KSB7XG4gIHJldHVybiB0YXJnZXRbYXRdID0gdmFsdWVcbn1cblxuZnVuY3Rpb24gd3JpdGVfaW50OCh0YXJnZXQsIHZhbHVlLCBhdCkge1xuICByZXR1cm4gdGFyZ2V0W2F0XSA9IHZhbHVlIDwgMCA/IHZhbHVlICsgMHgxMDAgOiB2YWx1ZVxufVxuXG5mdW5jdGlvbiB3cml0ZV91aW50MTZfbGUodGFyZ2V0LCB2YWx1ZSwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuc2V0VWludDE2KGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHZhbHVlLCB0cnVlKVxufVxuXG5mdW5jdGlvbiB3cml0ZV91aW50MzJfbGUodGFyZ2V0LCB2YWx1ZSwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuc2V0VWludDMyKGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHZhbHVlLCB0cnVlKVxufVxuXG5mdW5jdGlvbiB3cml0ZV9pbnQxNl9sZSh0YXJnZXQsIHZhbHVlLCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5zZXRJbnQxNihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCB2YWx1ZSwgdHJ1ZSlcbn1cblxuZnVuY3Rpb24gd3JpdGVfaW50MzJfbGUodGFyZ2V0LCB2YWx1ZSwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuc2V0SW50MzIoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdmFsdWUsIHRydWUpXG59XG5cbmZ1bmN0aW9uIHdyaXRlX2Zsb2F0X2xlKHRhcmdldCwgdmFsdWUsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LnNldEZsb2F0MzIoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdmFsdWUsIHRydWUpXG59XG5cbmZ1bmN0aW9uIHdyaXRlX2RvdWJsZV9sZSh0YXJnZXQsIHZhbHVlLCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5zZXRGbG9hdDY0KGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHZhbHVlLCB0cnVlKVxufVxuXG5mdW5jdGlvbiB3cml0ZV91aW50MTZfYmUodGFyZ2V0LCB2YWx1ZSwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuc2V0VWludDE2KGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHZhbHVlLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gd3JpdGVfdWludDMyX2JlKHRhcmdldCwgdmFsdWUsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LnNldFVpbnQzMihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCB2YWx1ZSwgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIHdyaXRlX2ludDE2X2JlKHRhcmdldCwgdmFsdWUsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LnNldEludDE2KGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHZhbHVlLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gd3JpdGVfaW50MzJfYmUodGFyZ2V0LCB2YWx1ZSwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuc2V0SW50MzIoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdmFsdWUsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiB3cml0ZV9mbG9hdF9iZSh0YXJnZXQsIHZhbHVlLCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5zZXRGbG9hdDMyKGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHZhbHVlLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gd3JpdGVfZG91YmxlX2JlKHRhcmdldCwgdmFsdWUsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LnNldEZsb2F0NjQoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdmFsdWUsIGZhbHNlKVxufVxuIiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gSW50ZXJhY3Rpb25EYXRhKCl7dGhpcy5nbG9iYWw9bmV3IFBvaW50LHRoaXMubG9jYWw9bmV3IFBvaW50LHRoaXMudGFyZ2V0PW51bGwsdGhpcy5vcmlnaW5hbEV2ZW50PW51bGx9ZnVuY3Rpb24gSW50ZXJhY3Rpb25NYW5hZ2VyKGEpe3RoaXMuc3RhZ2U9YSx0aGlzLm1vdXNlPW5ldyBJbnRlcmFjdGlvbkRhdGEsdGhpcy50b3VjaHM9e30sdGhpcy50ZW1wUG9pbnQ9bmV3IFBvaW50LHRoaXMubW91c2VvdmVyRW5hYmxlZD0hMCx0aGlzLnBvb2w9W10sdGhpcy5pbnRlcmFjdGl2ZUl0ZW1zPVtdLHRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50PW51bGwsdGhpcy5sYXN0PTB9dmFyIGdsb2JhbHM9cmVxdWlyZShcIi4vY29yZS9nbG9iYWxzXCIpLFBvaW50PXJlcXVpcmUoXCIuL2dlb20vUG9pbnRcIiksU3ByaXRlPXJlcXVpcmUoXCIuL2Rpc3BsYXkvU3ByaXRlXCIpLHBsYXRmb3JtPXJlcXVpcmUoXCIuL3BsYXRmb3JtXCIpO0ludGVyYWN0aW9uRGF0YS5wcm90b3R5cGUuZ2V0TG9jYWxQb3NpdGlvbj1mdW5jdGlvbihhKXt2YXIgYj1hLndvcmxkVHJhbnNmb3JtLGM9dGhpcy5nbG9iYWwsZD1iWzBdLGU9YlsxXSxmPWJbMl0sZz1iWzNdLGg9Yls0XSxpPWJbNV0saj0xLyhkKmgrZSotZyk7cmV0dXJuIG5ldyBQb2ludChoKmoqYy54Ky1lKmoqYy55KyhpKmUtZipoKSpqLGQqaipjLnkrLWcqaipjLngrKC1pKmQrZipnKSpqKX07dmFyIHByb3RvPUludGVyYWN0aW9uTWFuYWdlci5wcm90b3R5cGU7cHJvdG8uaGFuZGxlRXZlbnQ9ZnVuY3Rpb24oYSl7c3dpdGNoKGEudHlwZSl7Y2FzZVwibW91c2Vkb3duXCI6dGhpcy5vbk1vdXNlRG93bihhKTticmVhaztjYXNlXCJtb3VzZW1vdmVcIjp0aGlzLm9uTW91c2VNb3ZlKGEpO2JyZWFrO2Nhc2VcIm1vdXNldXBcIjp0aGlzLm9uTW91c2VVcChhKTticmVhaztjYXNlXCJtb3VzZW91dFwiOnRoaXMub25Nb3VzZU91dChhKTticmVhaztjYXNlXCJ0b3VjaHN0YXJ0XCI6dGhpcy5vblRvdWNoU3RhcnQoYSk7YnJlYWs7Y2FzZVwidG91Y2htb3ZlXCI6dGhpcy5vblRvdWNoTW92ZShhKTticmVhaztjYXNlXCJ0b3VjaGVuZFwiOnRoaXMub25Ub3VjaEVuZChhKX19LHByb3RvLmNvbGxlY3RJbnRlcmFjdGl2ZVNwcml0ZT1mdW5jdGlvbihhLGIpe2Zvcih2YXIgYz1hLmNoaWxkcmVuLGQ9Yy5sZW5ndGgtMTtkPj0wO2QtLSl7dmFyIGU9Y1tkXTtlLmludGVyYWN0aXZlPyhiLmludGVyYWN0aXZlQ2hpbGRyZW49ITAsdGhpcy5pbnRlcmFjdGl2ZUl0ZW1zLnB1c2goZSksZS5jaGlsZHJlbi5sZW5ndGg+MCYmdGhpcy5jb2xsZWN0SW50ZXJhY3RpdmVTcHJpdGUoZSxlKSk6KGUuX19pUGFyZW50PW51bGwsZS5jaGlsZHJlbi5sZW5ndGg+MCYmdGhpcy5jb2xsZWN0SW50ZXJhY3RpdmVTcHJpdGUoZSxiKSl9fSxwcm90by5zZXRUYXJnZXQ9ZnVuY3Rpb24oYSl7YT9udWxsPT09dGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQmJnRoaXMuc2V0VGFyZ2V0RG9tRWxlbWVudChhLnZpZXcpOm51bGwhPT10aGlzLnRhcmdldCYmcGxhdGZvcm0ud2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsdGhpcywhMCkscGxhdGZvcm0ud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsdGhpcywhMCksdGhpcy50YXJnZXQ9YX0scHJvdG8uc2V0VGFyZ2V0RG9tRWxlbWVudD1mdW5jdGlvbihhKXtudWxsIT09dGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQmJih0aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudC5zdHlsZVtcIi1tcy1jb250ZW50LXpvb21pbmdcIl09XCJcIix0aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudC5zdHlsZVtcIi1tcy10b3VjaC1hY3Rpb25cIl09XCJcIix0aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsdGhpcywhMCksdGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLHRoaXMsITApLHRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW91dFwiLHRoaXMsITApLHRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsdGhpcywhMCksdGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsdGhpcywhMCksdGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLHRoaXMsITApKTt2YXIgYj1wbGF0Zm9ybS5uYXZpZ2F0b3I7YiYmYi5tc1BvaW50ZXJFbmFibGVkJiYoYS5zdHlsZVtcIi1tcy1jb250ZW50LXpvb21pbmdcIl09XCJub25lXCIsYS5zdHlsZVtcIi1tcy10b3VjaC1hY3Rpb25cIl09XCJub25lXCIpLGEuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLHRoaXMsITApLGEuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLHRoaXMsITApLGEuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsdGhpcywhMCksYS5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLHRoaXMsITApLGEuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsdGhpcywhMCksYS5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsdGhpcywhMCksdGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQ9YX0scHJvdG8udXBkYXRlPWZ1bmN0aW9uKCl7aWYodGhpcy50YXJnZXQpe3ZhciBhPURhdGUubm93KCksYj1hLXRoaXMubGFzdDtpZihiPTMwKmIvMWUzLCEoMT5iKSl7dGhpcy5sYXN0PWE7dmFyIGMsZDtpZih0aGlzLmRpcnR5KXtmb3IodGhpcy5kaXJ0eT0hMSxjPTAsZD10aGlzLmludGVyYWN0aXZlSXRlbXMubGVuZ3RoO2Q+YztjKyspdGhpcy5pbnRlcmFjdGl2ZUl0ZW1zW2NdLmludGVyYWN0aXZlQ2hpbGRyZW49ITE7dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zPVtdLHRoaXMuc3RhZ2UuaW50ZXJhY3RpdmUmJnRoaXMuaW50ZXJhY3RpdmVJdGVtcy5wdXNoKHRoaXMuc3RhZ2UpLHRoaXMuY29sbGVjdEludGVyYWN0aXZlU3ByaXRlKHRoaXMuc3RhZ2UsdGhpcy5zdGFnZSl9Zm9yKHRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50LnN0eWxlLmN1cnNvcj1cImluaGVyaXRcIixjPTAsZD10aGlzLmludGVyYWN0aXZlSXRlbXMubGVuZ3RoO2Q+YztjKyspe3ZhciBlPXRoaXMuaW50ZXJhY3RpdmVJdGVtc1tjXTsoZS5tb3VzZW92ZXJ8fGUubW91c2VvdXR8fGUuYnV0dG9uTW9kZSkmJihlLl9faGl0PXRoaXMuaGl0VGVzdChlLHRoaXMubW91c2UpLHRoaXMubW91c2UudGFyZ2V0PWUsZS5fX2hpdD8oZS5idXR0b25Nb2RlJiYodGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQuc3R5bGUuY3Vyc29yPWUuZGVmYXVsdEN1cnNvciksZS5fX2lzT3Zlcnx8KGUubW91c2VvdmVyJiZlLm1vdXNlb3Zlcih0aGlzLm1vdXNlKSxlLl9faXNPdmVyPSEwKSk6ZS5fX2lzT3ZlciYmKGUubW91c2VvdXQmJmUubW91c2VvdXQodGhpcy5tb3VzZSksZS5fX2lzT3Zlcj0hMSkpfX19fSxwcm90by5vbk1vdXNlTW92ZT1mdW5jdGlvbihhKXt0aGlzLm1vdXNlLm9yaWdpbmFsRXZlbnQ9YTt2YXIgYj10aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTt0aGlzLm1vdXNlLmdsb2JhbC54PShhLmNsaWVudFgtYi5sZWZ0KSoodGhpcy50YXJnZXQud2lkdGgvYi53aWR0aCksdGhpcy5tb3VzZS5nbG9iYWwueT0oYS5jbGllbnRZLWIudG9wKSoodGhpcy50YXJnZXQuaGVpZ2h0L2IuaGVpZ2h0KTtmb3IodmFyIGM9MCxkPXRoaXMuaW50ZXJhY3RpdmVJdGVtcy5sZW5ndGg7ZD5jO2MrKyl7dmFyIGU9dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zW2NdO2UubW91c2Vtb3ZlJiZlLm1vdXNlbW92ZSh0aGlzLm1vdXNlKX19LHByb3RvLm9uTW91c2VEb3duPWZ1bmN0aW9uKGEpe3RoaXMubW91c2Uub3JpZ2luYWxFdmVudD1hO2Zvcih2YXIgYj0wLGM9dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zLmxlbmd0aDtjPmI7YisrKXt2YXIgZD10aGlzLmludGVyYWN0aXZlSXRlbXNbYl07aWYoKGQubW91c2Vkb3dufHxkLmNsaWNrKSYmKGQuX19tb3VzZUlzRG93bj0hMCxkLl9faGl0PXRoaXMuaGl0VGVzdChkLHRoaXMubW91c2UpLGQuX19oaXQmJihkLm1vdXNlZG93biYmZC5tb3VzZWRvd24odGhpcy5tb3VzZSksZC5fX2lzRG93bj0hMCwhZC5pbnRlcmFjdGl2ZUNoaWxkcmVuKSkpYnJlYWt9fSxwcm90by5vbk1vdXNlT3V0PWZ1bmN0aW9uKCl7dGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQuc3R5bGUuY3Vyc29yPVwiaW5oZXJpdFwiO2Zvcih2YXIgYT0wLGI9dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zLmxlbmd0aDtiPmE7YSsrKXt2YXIgYz10aGlzLmludGVyYWN0aXZlSXRlbXNbYV07Yy5fX2lzT3ZlciYmKHRoaXMubW91c2UudGFyZ2V0PWMsYy5tb3VzZW91dCYmYy5tb3VzZW91dCh0aGlzLm1vdXNlKSxjLl9faXNPdmVyPSExKX19LHByb3RvLm9uTW91c2VVcD1mdW5jdGlvbihhKXt0aGlzLm1vdXNlLm9yaWdpbmFsRXZlbnQ9YTtmb3IodmFyIGI9ITEsYz0wLGQ9dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zLmxlbmd0aDtkPmM7YysrKXt2YXIgZT10aGlzLmludGVyYWN0aXZlSXRlbXNbY107KGUubW91c2V1cHx8ZS5tb3VzZXVwb3V0c2lkZXx8ZS5jbGljaykmJihlLl9faGl0PXRoaXMuaGl0VGVzdChlLHRoaXMubW91c2UpLGUuX19oaXQmJiFiPyhlLm1vdXNldXAmJmUubW91c2V1cCh0aGlzLm1vdXNlKSxlLl9faXNEb3duJiZlLmNsaWNrJiZlLmNsaWNrKHRoaXMubW91c2UpLGUuaW50ZXJhY3RpdmVDaGlsZHJlbnx8KGI9ITApKTplLl9faXNEb3duJiZlLm1vdXNldXBvdXRzaWRlJiZlLm1vdXNldXBvdXRzaWRlKHRoaXMubW91c2UpLGUuX19pc0Rvd249ITEpfX0scHJvdG8uaGl0VGVzdD1mdW5jdGlvbihhLGIpe3ZhciBjPWIuZ2xvYmFsO2lmKGEudmNvdW50IT09Z2xvYmFscy52aXNpYmxlQ291bnQpcmV0dXJuITE7dmFyIGQ9YSBpbnN0YW5jZW9mIFNwcml0ZSxlPWEud29ybGRUcmFuc2Zvcm0sZj1lWzBdLGc9ZVsxXSxoPWVbMl0saT1lWzNdLGo9ZVs0XSxrPWVbNV0sbD0xLyhmKmorZyotaSksbT1qKmwqYy54Ky1nKmwqYy55KyhrKmctaCpqKSpsLG49ZipsKmMueSstaSpsKmMueCsoLWsqZitoKmkpKmw7aWYoYi50YXJnZXQ9YSxhLmhpdEFyZWEmJmEuaGl0QXJlYS5jb250YWlucylyZXR1cm4gYS5oaXRBcmVhLmNvbnRhaW5zKG0sbik/KGIudGFyZ2V0PWEsITApOiExO2lmKGQpe3ZhciBvLHA9YS50ZXh0dXJlLmZyYW1lLndpZHRoLHE9YS50ZXh0dXJlLmZyYW1lLmhlaWdodCxyPS1wKmEuYW5jaG9yLng7aWYobT5yJiZyK3A+bSYmKG89LXEqYS5hbmNob3IueSxuPm8mJm8rcT5uKSlyZXR1cm4gYi50YXJnZXQ9YSwhMH1mb3IodmFyIHM9MCx0PWEuY2hpbGRyZW4ubGVuZ3RoO3Q+cztzKyspe3ZhciB1PWEuY2hpbGRyZW5bc10sdj10aGlzLmhpdFRlc3QodSxiKTtpZih2KXJldHVybiBiLnRhcmdldD1hLCEwfXJldHVybiExfSxwcm90by5vblRvdWNoTW92ZT1mdW5jdGlvbihhKXt2YXIgYixjLGQsZSxmLGcsaCxpPXRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLGo9YS5jaGFuZ2VkVG91Y2hlcztmb3IoYj0wLGM9ai5sZW5ndGg7Yz5iO2IrKylmb3IoZD1qW2JdLGU9dGhpcy50b3VjaHNbZC5pZGVudGlmaWVyXSxlLm9yaWdpbmFsRXZlbnQ9YSxlLmdsb2JhbC54PShkLmNsaWVudFgtaS5sZWZ0KSoodGhpcy50YXJnZXQud2lkdGgvaS53aWR0aCksZS5nbG9iYWwueT0oZC5jbGllbnRZLWkudG9wKSoodGhpcy50YXJnZXQuaGVpZ2h0L2kuaGVpZ2h0KSxmPTAsZz10aGlzLmludGVyYWN0aXZlSXRlbXMubGVuZ3RoO2c+ZjtmKyspaD10aGlzLmludGVyYWN0aXZlSXRlbXNbYl0saC50b3VjaG1vdmUmJmgudG91Y2htb3ZlKGUpfSxwcm90by5vblRvdWNoU3RhcnQ9ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPXRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLGM9YS5jaGFuZ2VkVG91Y2hlcyxkPTAsZT1jLmxlbmd0aDtlPmQ7ZCsrKXt2YXIgZj1jW2RdLGc9dGhpcy5wb29sLnBvcCgpO2d8fChnPW5ldyBJbnRlcmFjdGlvbkRhdGEpLGcub3JpZ2luYWxFdmVudD1hLHRoaXMudG91Y2hzW2YuaWRlbnRpZmllcl09ZyxnLmdsb2JhbC54PShmLmNsaWVudFgtYi5sZWZ0KSoodGhpcy50YXJnZXQud2lkdGgvYi53aWR0aCksZy5nbG9iYWwueT0oZi5jbGllbnRZLWIudG9wKSoodGhpcy50YXJnZXQuaGVpZ2h0L2IuaGVpZ2h0KTtmb3IodmFyIGg9MCxpPXRoaXMuaW50ZXJhY3RpdmVJdGVtcy5sZW5ndGg7aT5oO2grKyl7dmFyIGo9dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zW2hdO2lmKChqLnRvdWNoc3RhcnR8fGoudGFwKSYmKGouX19oaXQ9dGhpcy5oaXRUZXN0KGosZyksai5fX2hpdCYmKGoudG91Y2hzdGFydCYmai50b3VjaHN0YXJ0KGcpLGouX19pc0Rvd249ITAsai5fX3RvdWNoRGF0YT1nLCFqLmludGVyYWN0aXZlQ2hpbGRyZW4pKSlicmVha319fSxwcm90by5vblRvdWNoRW5kPWZ1bmN0aW9uKGEpe2Zvcih2YXIgYj10aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxjPWEuY2hhbmdlZFRvdWNoZXMsZD0wLGU9Yy5sZW5ndGg7ZT5kO2QrKyl7dmFyIGY9Y1tkXSxnPXRoaXMudG91Y2hzW2YuaWRlbnRpZmllcl0saD0hMTtnLmdsb2JhbC54PShmLmNsaWVudFgtYi5sZWZ0KSoodGhpcy50YXJnZXQud2lkdGgvYi53aWR0aCksZy5nbG9iYWwueT0oZi5jbGllbnRZLWIudG9wKSoodGhpcy50YXJnZXQuaGVpZ2h0L2IuaGVpZ2h0KTtmb3IodmFyIGk9MCxqPXRoaXMuaW50ZXJhY3RpdmVJdGVtcy5sZW5ndGg7aj5pO2krKyl7dmFyIGs9dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zW2ldLGw9ay5fX3RvdWNoRGF0YTtrLl9faGl0PXRoaXMuaGl0VGVzdChrLGcpLGw9PT1nJiYoZy5vcmlnaW5hbEV2ZW50PWEsKGsudG91Y2hlbmR8fGsudGFwKSYmKGsuX19oaXQmJiFoPyhrLnRvdWNoZW5kJiZrLnRvdWNoZW5kKGcpLGsuX19pc0Rvd24mJmsudGFwJiZrLnRhcChnKSxrLmludGVyYWN0aXZlQ2hpbGRyZW58fChoPSEwKSk6ay5fX2lzRG93biYmay50b3VjaGVuZG91dHNpZGUmJmsudG91Y2hlbmRvdXRzaWRlKGcpLGsuX19pc0Rvd249ITEpLGsuX190b3VjaERhdGE9bnVsbCl9dGhpcy5wb29sLnB1c2goZyksdGhpcy50b3VjaHNbZi5pZGVudGlmaWVyXT1udWxsfX0sbW9kdWxlLmV4cG9ydHM9SW50ZXJhY3Rpb25NYW5hZ2VyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO21vZHVsZS5leHBvcnRzPXtnbDpudWxsLHByaW1pdGl2ZVNoYWRlcjpudWxsLHN0cmlwU2hhZGVyOm51bGwsZGVmYXVsdFNoYWRlcjpudWxsLG9mZnNldDpudWxsLHByb2plY3Rpb246bnVsbCx0ZXh0dXJlc1RvVXBkYXRlOltdLHRleHR1cmVzVG9EZXN0cm95OltdLHZpc2libGVDb3VudDowfTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5mdW5jdGlvbiBEaXNwbGF5T2JqZWN0KCl7dGhpcy5sYXN0PXRoaXMsdGhpcy5maXJzdD10aGlzLHRoaXMucG9zaXRpb249bmV3IFBvaW50LHRoaXMuc2NhbGU9bmV3IFBvaW50KDEsMSksdGhpcy5waXZvdD1uZXcgUG9pbnQoMCwwKSx0aGlzLnJvdGF0aW9uPTAsdGhpcy5hbHBoYT0xLHRoaXMudmlzaWJsZT0hMCx0aGlzLmhpdEFyZWE9bnVsbCx0aGlzLmJ1dHRvbk1vZGU9ITEsdGhpcy5yZW5kZXJhYmxlPSExLHRoaXMucGFyZW50PW51bGwsdGhpcy5zdGFnZT1udWxsLHRoaXMud29ybGRBbHBoYT0xLHRoaXMuX2ludGVyYWN0aXZlPSExLHRoaXMuZGVmYXVsdEN1cnNvcj1cInBvaW50ZXJcIix0aGlzLndvcmxkVHJhbnNmb3JtPW1hdDMuY3JlYXRlKCksdGhpcy5sb2NhbFRyYW5zZm9ybT1tYXQzLmNyZWF0ZSgpLHRoaXMuY29sb3I9W10sdGhpcy5keW5hbWljPSEwLHRoaXMuX3NyPTAsdGhpcy5fY3I9MSx0aGlzLmZpbHRlckFyZWE9bmV3IFJlY3RhbmdsZSgwLDAsMSwxKX12YXIgZ2xvYmFscz1yZXF1aXJlKFwiLi4vY29yZS9nbG9iYWxzXCIpLG1hdDM9cmVxdWlyZShcIi4uL2dlb20vbWF0cml4XCIpLm1hdDMsRmlsdGVyQmxvY2s9cmVxdWlyZShcIi4uL2ZpbHRlcnMvRmlsdGVyQmxvY2tcIiksUG9pbnQ9cmVxdWlyZShcIi4uL2dlb20vUG9pbnRcIiksUmVjdGFuZ2xlPXJlcXVpcmUoXCIuLi9nZW9tL1JlY3RhbmdsZVwiKSxwcm90bz1EaXNwbGF5T2JqZWN0LnByb3RvdHlwZTtwcm90by5zZXRJbnRlcmFjdGl2ZT1mdW5jdGlvbihhKXt0aGlzLmludGVyYWN0aXZlPWF9LE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImludGVyYWN0aXZlXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLl9pbnRlcmFjdGl2ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMuX2ludGVyYWN0aXZlPWEsdGhpcy5zdGFnZSYmKHRoaXMuc3RhZ2UuZGlydHk9ITApfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcIm1hc2tcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX21hc2t9LHNldDpmdW5jdGlvbihhKXthP3RoaXMuX21hc2s/KGEuc3RhcnQ9dGhpcy5fbWFzay5zdGFydCxhLmVuZD10aGlzLl9tYXNrLmVuZCk6KHRoaXMuYWRkRmlsdGVyKGEpLGEucmVuZGVyYWJsZT0hMSk6KHRoaXMucmVtb3ZlRmlsdGVyKHRoaXMuX21hc2spLHRoaXMuX21hc2sucmVuZGVyYWJsZT0hMCksdGhpcy5fbWFzaz1hfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImZpbHRlcnNcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2ZpbHRlcnN9LHNldDpmdW5jdGlvbihhKXtpZihhKXt0aGlzLl9maWx0ZXJzJiZ0aGlzLnJlbW92ZUZpbHRlcih0aGlzLl9maWx0ZXJzKSx0aGlzLmFkZEZpbHRlcihhKTtmb3IodmFyIGI9W10sYz0wO2M8YS5sZW5ndGg7YysrKWZvcih2YXIgZD1hW2NdLnBhc3NlcyxlPTA7ZTxkLmxlbmd0aDtlKyspYi5wdXNoKGRbZV0pO2Euc3RhcnQuZmlsdGVyUGFzc2VzPWJ9ZWxzZSB0aGlzLl9maWx0ZXJzJiZ0aGlzLnJlbW92ZUZpbHRlcih0aGlzLl9maWx0ZXJzKTt0aGlzLl9maWx0ZXJzPWF9fSkscHJvdG8uYWRkRmlsdGVyPWZ1bmN0aW9uKGEpe3ZhciBiPW5ldyBGaWx0ZXJCbG9jayxjPW5ldyBGaWx0ZXJCbG9jazthLnN0YXJ0PWIsYS5lbmQ9YyxiLmRhdGE9YSxjLmRhdGE9YSxiLmZpcnN0PWIubGFzdD10aGlzLGMuZmlyc3Q9Yy5sYXN0PXRoaXMsYi5vcGVuPSEwLGIudGFyZ2V0PXRoaXM7dmFyIGQsZSxmPWIsZz1iO2U9dGhpcy5maXJzdC5faVByZXYsZT8oZD1lLl9pTmV4dCxmLl9pUHJldj1lLGUuX2lOZXh0PWYpOmQ9dGhpcyxkJiYoZC5faVByZXY9ZyxnLl9pTmV4dD1kKSxmPWMsZz1jLGQ9bnVsbCxlPW51bGwsZT10aGlzLmxhc3QsZD1lLl9pTmV4dCxkJiYoZC5faVByZXY9ZyxnLl9pTmV4dD1kKSxmLl9pUHJldj1lLGUuX2lOZXh0PWY7Zm9yKHZhciBoPXRoaXMsaT10aGlzLmxhc3Q7aDspaC5sYXN0PT09aSYmKGgubGFzdD1jKSxoPWgucGFyZW50O3RoaXMuZmlyc3Q9Yix0aGlzLl9fcmVuZGVyR3JvdXAmJnRoaXMuX19yZW5kZXJHcm91cC5hZGRGaWx0ZXJCbG9ja3MoYixjKX0scHJvdG8ucmVtb3ZlRmlsdGVyPWZ1bmN0aW9uKGEpe3ZhciBiPWEuc3RhcnQsYz1iLl9pTmV4dCxkPWIuX2lQcmV2O2MmJihjLl9pUHJldj1kKSxkJiYoZC5faU5leHQ9YyksdGhpcy5maXJzdD1iLl9pTmV4dDt2YXIgZT1hLmVuZDtjPWUuX2lOZXh0LGQ9ZS5faVByZXYsYyYmKGMuX2lQcmV2PWQpLGQuX2lOZXh0PWM7Zm9yKHZhciBmPWUuX2lQcmV2LGc9dGhpcztnLmxhc3Q9PT1lJiYoZy5sYXN0PWYsZz1nLnBhcmVudCk7KTt0aGlzLl9fcmVuZGVyR3JvdXAmJnRoaXMuX19yZW5kZXJHcm91cC5yZW1vdmVGaWx0ZXJCbG9ja3MoYixlKX0scHJvdG8udXBkYXRlVHJhbnNmb3JtPWZ1bmN0aW9uKCl7dGhpcy5yb3RhdGlvbiE9PXRoaXMucm90YXRpb25DYWNoZSYmKHRoaXMucm90YXRpb25DYWNoZT10aGlzLnJvdGF0aW9uLHRoaXMuX3NyPU1hdGguc2luKHRoaXMucm90YXRpb24pLHRoaXMuX2NyPU1hdGguY29zKHRoaXMucm90YXRpb24pKTt2YXIgYT10aGlzLmxvY2FsVHJhbnNmb3JtLGI9dGhpcy5wYXJlbnQud29ybGRUcmFuc2Zvcm0sYz10aGlzLndvcmxkVHJhbnNmb3JtO2FbMF09dGhpcy5fY3IqdGhpcy5zY2FsZS54LGFbMV09LXRoaXMuX3NyKnRoaXMuc2NhbGUueSxhWzNdPXRoaXMuX3NyKnRoaXMuc2NhbGUueCxhWzRdPXRoaXMuX2NyKnRoaXMuc2NhbGUueTt2YXIgZD10aGlzLnBpdm90LngsZT10aGlzLnBpdm90LnksZj1hWzBdLGc9YVsxXSxoPXRoaXMucG9zaXRpb24ueC1hWzBdKmQtZSphWzFdLGk9YVszXSxqPWFbNF0saz10aGlzLnBvc2l0aW9uLnktYVs0XSplLWQqYVszXSxsPWJbMF0sbT1iWzFdLG49YlsyXSxvPWJbM10scD1iWzRdLHE9Yls1XTthWzJdPWgsYVs1XT1rLGNbMF09bCpmK20qaSxjWzFdPWwqZyttKmosY1syXT1sKmgrbSprK24sY1szXT1vKmYrcCppLGNbNF09bypnK3AqaixjWzVdPW8qaCtwKmsrcSx0aGlzLndvcmxkQWxwaGE9dGhpcy5hbHBoYSp0aGlzLnBhcmVudC53b3JsZEFscGhhLHRoaXMudmNvdW50PWdsb2JhbHMudmlzaWJsZUNvdW50fSxtb2R1bGUuZXhwb3J0cz1EaXNwbGF5T2JqZWN0OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIERpc3BsYXlPYmplY3RDb250YWluZXIoKXtEaXNwbGF5T2JqZWN0LmNhbGwodGhpcyksdGhpcy5jaGlsZHJlbj1bXX12YXIgRGlzcGxheU9iamVjdD1yZXF1aXJlKFwiLi9EaXNwbGF5T2JqZWN0XCIpLHByb3RvPURpc3BsYXlPYmplY3RDb250YWluZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoRGlzcGxheU9iamVjdC5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpEaXNwbGF5T2JqZWN0Q29udGFpbmVyfX0pO3Byb3RvLmFkZENoaWxkPWZ1bmN0aW9uKGEpe2lmKGEucGFyZW50JiZhLnBhcmVudCE9PXRoaXMmJmEucGFyZW50LnJlbW92ZUNoaWxkKGEpLGEucGFyZW50PXRoaXMsdGhpcy5jaGlsZHJlbi5wdXNoKGEpLHRoaXMuc3RhZ2Upe3ZhciBiPWE7ZG8gYi5pbnRlcmFjdGl2ZSYmKHRoaXMuc3RhZ2UuZGlydHk9ITApLGIuc3RhZ2U9dGhpcy5zdGFnZSxiPWIuX2lOZXh0O3doaWxlKGIpfXZhciBjLGQsZT1hLmZpcnN0LGY9YS5sYXN0O2Q9dGhpcy5fZmlsdGVyc3x8dGhpcy5fbWFzaz90aGlzLmxhc3QuX2lQcmV2OnRoaXMubGFzdCxjPWQuX2lOZXh0O2Zvcih2YXIgZz10aGlzLGg9ZDtnOylnLmxhc3Q9PT1oJiYoZy5sYXN0PWEubGFzdCksZz1nLnBhcmVudDtjJiYoYy5faVByZXY9ZixmLl9pTmV4dD1jKSxlLl9pUHJldj1kLGQuX2lOZXh0PWUsdGhpcy5fX3JlbmRlckdyb3VwJiYoYS5fX3JlbmRlckdyb3VwJiZhLl9fcmVuZGVyR3JvdXAucmVtb3ZlRGlzcGxheU9iamVjdEFuZENoaWxkcmVuKGEpLHRoaXMuX19yZW5kZXJHcm91cC5hZGREaXNwbGF5T2JqZWN0QW5kQ2hpbGRyZW4oYSkpfSxwcm90by5hZGRDaGlsZEF0PWZ1bmN0aW9uKGEsYil7aWYoIShiPj0wJiZiPD10aGlzLmNoaWxkcmVuLmxlbmd0aCkpdGhyb3cgbmV3IEVycm9yKGErXCIgVGhlIGluZGV4IFwiK2IrXCIgc3VwcGxpZWQgaXMgb3V0IG9mIGJvdW5kcyBcIit0aGlzLmNoaWxkcmVuLmxlbmd0aCk7aWYodm9pZCAwIT09YS5wYXJlbnQmJmEucGFyZW50LnJlbW92ZUNoaWxkKGEpLGEucGFyZW50PXRoaXMsdGhpcy5zdGFnZSl7dmFyIGM9YTtkbyBjLmludGVyYWN0aXZlJiYodGhpcy5zdGFnZS5kaXJ0eT0hMCksYy5zdGFnZT10aGlzLnN0YWdlLGM9Yy5faU5leHQ7d2hpbGUoYyl9dmFyIGQsZSxmPWEuZmlyc3QsZz1hLmxhc3Q7aWYoYj09PXRoaXMuY2hpbGRyZW4ubGVuZ3RoKXtlPXRoaXMubGFzdDtmb3IodmFyIGg9dGhpcyxpPXRoaXMubGFzdDtoOyloLmxhc3Q9PT1pJiYoaC5sYXN0PWEubGFzdCksaD1oLnBhcmVudH1lbHNlIGU9MD09PWI/dGhpczp0aGlzLmNoaWxkcmVuW2ItMV0ubGFzdDtkPWUuX2lOZXh0LGQmJihkLl9pUHJldj1nLGcuX2lOZXh0PWQpLGYuX2lQcmV2PWUsZS5faU5leHQ9Zix0aGlzLmNoaWxkcmVuLnNwbGljZShiLDAsYSksdGhpcy5fX3JlbmRlckdyb3VwJiYoYS5fX3JlbmRlckdyb3VwJiZhLl9fcmVuZGVyR3JvdXAucmVtb3ZlRGlzcGxheU9iamVjdEFuZENoaWxkcmVuKGEpLHRoaXMuX19yZW5kZXJHcm91cC5hZGREaXNwbGF5T2JqZWN0QW5kQ2hpbGRyZW4oYSkpfSxwcm90by5zd2FwQ2hpbGRyZW49ZnVuY3Rpb24oYSxiKXtpZihhIT09Yil7dmFyIGM9dGhpcy5jaGlsZHJlbi5pbmRleE9mKGEpLGQ9dGhpcy5jaGlsZHJlbi5pbmRleE9mKGIpO2lmKDA+Y3x8MD5kKXRocm93IG5ldyBFcnJvcihcInN3YXBDaGlsZHJlbjogQm90aCB0aGUgc3VwcGxpZWQgRGlzcGxheU9iamVjdHMgbXVzdCBiZSBhIGNoaWxkIG9mIHRoZSBjYWxsZXIuXCIpO3RoaXMucmVtb3ZlQ2hpbGQoYSksdGhpcy5yZW1vdmVDaGlsZChiKSxkPmM/KHRoaXMuYWRkQ2hpbGRBdChiLGMpLHRoaXMuYWRkQ2hpbGRBdChhLGQpKToodGhpcy5hZGRDaGlsZEF0KGEsZCksdGhpcy5hZGRDaGlsZEF0KGIsYykpfX0scHJvdG8uZ2V0Q2hpbGRBdD1mdW5jdGlvbihhKXtpZihhPj0wJiZhPHRoaXMuY2hpbGRyZW4ubGVuZ3RoKXJldHVybiB0aGlzLmNoaWxkcmVuW2FdO3Rocm93IG5ldyBFcnJvcihcIkJvdGggdGhlIHN1cHBsaWVkIERpc3BsYXlPYmplY3RzIG11c3QgYmUgYSBjaGlsZCBvZiB0aGUgY2FsbGVyIFwiK3RoaXMpfSxwcm90by5yZW1vdmVDaGlsZD1mdW5jdGlvbihhKXt2YXIgYj10aGlzLmNoaWxkcmVuLmluZGV4T2YoYSk7aWYoLTE9PT1iKXRocm93IG5ldyBFcnJvcihhK1wiIFRoZSBzdXBwbGllZCBEaXNwbGF5T2JqZWN0IG11c3QgYmUgYSBjaGlsZCBvZiB0aGUgY2FsbGVyIFwiK3RoaXMpO3ZhciBjPWEuZmlyc3QsZD1hLmxhc3QsZT1kLl9pTmV4dCxmPWMuX2lQcmV2O2lmKGUmJihlLl9pUHJldj1mKSxmLl9pTmV4dD1lLHRoaXMubGFzdD09PWQpZm9yKHZhciBnPWMuX2lQcmV2LGg9dGhpcztoLmxhc3Q9PT1kJiYoaC5sYXN0PWcsaD1oLnBhcmVudCk7KTtpZihkLl9pTmV4dD1udWxsLGMuX2lQcmV2PW51bGwsdGhpcy5zdGFnZSl7dmFyIGk9YTtkbyBpLmludGVyYWN0aXZlJiYodGhpcy5zdGFnZS5kaXJ0eT0hMCksaS5zdGFnZT1udWxsLGk9aS5faU5leHQ7d2hpbGUoaSl9YS5fX3JlbmRlckdyb3VwJiZhLl9fcmVuZGVyR3JvdXAucmVtb3ZlRGlzcGxheU9iamVjdEFuZENoaWxkcmVuKGEpLGEucGFyZW50PXZvaWQgMCx0aGlzLmNoaWxkcmVuLnNwbGljZShiLDEpfSxwcm90by51cGRhdGVUcmFuc2Zvcm09ZnVuY3Rpb24oKXtpZih0aGlzLnZpc2libGUpe0Rpc3BsYXlPYmplY3QucHJvdG90eXBlLnVwZGF0ZVRyYW5zZm9ybS5jYWxsKHRoaXMpO2Zvcih2YXIgYT0wLGI9dGhpcy5jaGlsZHJlbi5sZW5ndGg7Yj5hO2ErKyl0aGlzLmNoaWxkcmVuW2FdLnVwZGF0ZVRyYW5zZm9ybSgpfX0sbW9kdWxlLmV4cG9ydHM9RGlzcGxheU9iamVjdENvbnRhaW5lcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBNb3ZpZUNsaXAoYSl7U3ByaXRlLmNhbGwodGhpcyxhWzBdKSx0aGlzLnRleHR1cmVzPWEsdGhpcy5hbmltYXRpb25TcGVlZD0xLHRoaXMubG9vcD0hMCx0aGlzLm9uQ29tcGxldGU9bnVsbCx0aGlzLmN1cnJlbnRGcmFtZT0wLHRoaXMucGxheWluZz0hMX12YXIgU3ByaXRlPXJlcXVpcmUoXCIuL1Nwcml0ZVwiKSxwcm90bz1Nb3ZpZUNsaXAucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoU3ByaXRlLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOk1vdmllQ2xpcH19KTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJ0b3RhbEZyYW1lc1wiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy50ZXh0dXJlcy5sZW5ndGh9fSkscHJvdG8uc3RvcD1mdW5jdGlvbigpe3RoaXMucGxheWluZz0hMX0scHJvdG8ucGxheT1mdW5jdGlvbigpe3RoaXMucGxheWluZz0hMH0scHJvdG8uZ290b0FuZFN0b3A9ZnVuY3Rpb24oYSl7dGhpcy5wbGF5aW5nPSExLHRoaXMuY3VycmVudEZyYW1lPWE7dmFyIGI9dGhpcy5jdXJyZW50RnJhbWUrLjV8MDt0aGlzLnNldFRleHR1cmUodGhpcy50ZXh0dXJlc1tiJXRoaXMudGV4dHVyZXMubGVuZ3RoXSl9LHByb3RvLmdvdG9BbmRQbGF5PWZ1bmN0aW9uKGEpe3RoaXMuY3VycmVudEZyYW1lPWEsdGhpcy5wbGF5aW5nPSEwfSxwcm90by51cGRhdGVUcmFuc2Zvcm09ZnVuY3Rpb24oKXtpZihTcHJpdGUucHJvdG90eXBlLnVwZGF0ZVRyYW5zZm9ybS5jYWxsKHRoaXMpLHRoaXMucGxheWluZyl7dGhpcy5jdXJyZW50RnJhbWUrPXRoaXMuYW5pbWF0aW9uU3BlZWQ7dmFyIGE9dGhpcy5jdXJyZW50RnJhbWUrLjV8MDt0aGlzLmxvb3B8fGE8dGhpcy50ZXh0dXJlcy5sZW5ndGg/dGhpcy5zZXRUZXh0dXJlKHRoaXMudGV4dHVyZXNbYSV0aGlzLnRleHR1cmVzLmxlbmd0aF0pOmE+PXRoaXMudGV4dHVyZXMubGVuZ3RoJiYodGhpcy5nb3RvQW5kU3RvcCh0aGlzLnRleHR1cmVzLmxlbmd0aC0xKSx0aGlzLm9uQ29tcGxldGUmJnRoaXMub25Db21wbGV0ZSgpKX19LG1vZHVsZS5leHBvcnRzPU1vdmllQ2xpcDsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBTcHJpdGUoYSl7aWYoRGlzcGxheU9iamVjdENvbnRhaW5lci5jYWxsKHRoaXMpLHRoaXMuYW5jaG9yPW5ldyBQb2ludCx0aGlzLnRleHR1cmU9YSx0aGlzLmJsZW5kTW9kZT1ibGVuZE1vZGVzLk5PUk1BTCx0aGlzLl93aWR0aD0wLHRoaXMuX2hlaWdodD0wLGEuYmFzZVRleHR1cmUuaGFzTG9hZGVkKXRoaXMudXBkYXRlRnJhbWU9ITA7ZWxzZXt2YXIgYj10aGlzO3RoaXMudGV4dHVyZS5hZGRFdmVudExpc3RlbmVyKFwidXBkYXRlXCIsZnVuY3Rpb24oKXtiLm9uVGV4dHVyZVVwZGF0ZSgpfSl9dGhpcy5yZW5kZXJhYmxlPSEwfXZhciBibGVuZE1vZGVzPXJlcXVpcmUoXCIuL2JsZW5kTW9kZXNcIiksRGlzcGxheU9iamVjdENvbnRhaW5lcj1yZXF1aXJlKFwiLi9EaXNwbGF5T2JqZWN0Q29udGFpbmVyXCIpLFBvaW50PXJlcXVpcmUoXCIuLi9nZW9tL1BvaW50XCIpLFRleHR1cmU9cmVxdWlyZShcIi4uL3RleHR1cmVzL1RleHR1cmVcIikscHJvdG89U3ByaXRlLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKERpc3BsYXlPYmplY3RDb250YWluZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6U3ByaXRlfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcIndpZHRoXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnNjYWxlLngqdGhpcy50ZXh0dXJlLmZyYW1lLndpZHRofSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5zY2FsZS54PWEvdGhpcy50ZXh0dXJlLmZyYW1lLndpZHRoLHRoaXMuX3dpZHRoPWF9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiaGVpZ2h0XCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnNjYWxlLnkqdGhpcy50ZXh0dXJlLmZyYW1lLmhlaWdodH0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMuc2NhbGUueT1hL3RoaXMudGV4dHVyZS5mcmFtZS5oZWlnaHQsdGhpcy5faGVpZ2h0PWF9fSkscHJvdG8uc2V0VGV4dHVyZT1mdW5jdGlvbihhKXt0aGlzLnRleHR1cmUuYmFzZVRleHR1cmUhPT1hLmJhc2VUZXh0dXJlPyh0aGlzLnRleHR1cmVDaGFuZ2U9ITAsdGhpcy50ZXh0dXJlPWEsdGhpcy5fX3JlbmRlckdyb3VwJiZ0aGlzLl9fcmVuZGVyR3JvdXAudXBkYXRlVGV4dHVyZSh0aGlzKSk6dGhpcy50ZXh0dXJlPWEsdGhpcy51cGRhdGVGcmFtZT0hMH0scHJvdG8ub25UZXh0dXJlVXBkYXRlPWZ1bmN0aW9uKCl7dGhpcy5fd2lkdGgmJih0aGlzLnNjYWxlLng9dGhpcy5fd2lkdGgvdGhpcy50ZXh0dXJlLmZyYW1lLndpZHRoKSx0aGlzLl9oZWlnaHQmJih0aGlzLnNjYWxlLnk9dGhpcy5faGVpZ2h0L3RoaXMudGV4dHVyZS5mcmFtZS5oZWlnaHQpLHRoaXMudXBkYXRlRnJhbWU9ITB9LFNwcml0ZS5mcm9tRnJhbWU9ZnVuY3Rpb24oYSl7dmFyIGI9VGV4dHVyZS5jYWNoZVthXTtpZighYil0aHJvdyBuZXcgRXJyb3IoJ1RoZSBmcmFtZUlkIFwiJythKydcIiBkb2VzIG5vdCBleGlzdCBpbiB0aGUgdGV4dHVyZSBjYWNoZScrdGhpcyk7cmV0dXJuIG5ldyBTcHJpdGUoYil9LFNwcml0ZS5mcm9tSW1hZ2U9ZnVuY3Rpb24oYSl7dmFyIGI9VGV4dHVyZS5mcm9tSW1hZ2UoYSk7cmV0dXJuIG5ldyBTcHJpdGUoYil9LG1vZHVsZS5leHBvcnRzPVNwcml0ZTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBTdGFnZShhKXtEaXNwbGF5T2JqZWN0Q29udGFpbmVyLmNhbGwodGhpcyksdGhpcy53b3JsZFRyYW5zZm9ybT1tYXQzLmNyZWF0ZSgpLHRoaXMuaW50ZXJhY3RpdmU9ITAsdGhpcy5pbnRlcmFjdGlvbk1hbmFnZXI9bmV3IEludGVyYWN0aW9uTWFuYWdlcih0aGlzKSx0aGlzLmRpcnR5PSEwLHRoaXMuX19jaGlsZHJlbkFkZGVkPVtdLHRoaXMuX19jaGlsZHJlblJlbW92ZWQ9W10sdGhpcy5zdGFnZT10aGlzLHRoaXMuc3RhZ2UuaGl0QXJlYT1uZXcgUmVjdGFuZ2xlKDAsMCwxZTUsMWU1KSx0aGlzLnNldEJhY2tncm91bmRDb2xvcihhKSx0aGlzLndvcmxkVmlzaWJsZT0hMH12YXIgZ2xvYmFscz1yZXF1aXJlKFwiLi4vY29yZS9nbG9iYWxzXCIpLG1hdDM9cmVxdWlyZShcIi4uL2dlb20vbWF0cml4XCIpLm1hdDMsaGV4MnJnYj1yZXF1aXJlKFwiLi4vdXRpbHMvY29sb3JcIikuaGV4MnJnYixEaXNwbGF5T2JqZWN0Q29udGFpbmVyPXJlcXVpcmUoXCIuL0Rpc3BsYXlPYmplY3RDb250YWluZXJcIiksSW50ZXJhY3Rpb25NYW5hZ2VyPXJlcXVpcmUoXCIuLi9JbnRlcmFjdGlvbk1hbmFnZXJcIiksUmVjdGFuZ2xlPXJlcXVpcmUoXCIuLi9nZW9tL1JlY3RhbmdsZVwiKSxwcm90bz1TdGFnZS5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShEaXNwbGF5T2JqZWN0Q29udGFpbmVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOlN0YWdlfX0pO3Byb3RvLnNldEludGVyYWN0aW9uRGVsZWdhdGU9ZnVuY3Rpb24oYSl7dGhpcy5pbnRlcmFjdGlvbk1hbmFnZXIuc2V0VGFyZ2V0RG9tRWxlbWVudChhKX0scHJvdG8udXBkYXRlVHJhbnNmb3JtPWZ1bmN0aW9uKCl7dGhpcy53b3JsZEFscGhhPTEsdGhpcy52Y291bnQ9Z2xvYmFscy52aXNpYmxlQ291bnQ7Zm9yKHZhciBhPTAsYj10aGlzLmNoaWxkcmVuLmxlbmd0aDtiPmE7YSsrKXRoaXMuY2hpbGRyZW5bYV0udXBkYXRlVHJhbnNmb3JtKCk7dGhpcy5kaXJ0eSYmKHRoaXMuZGlydHk9ITEsdGhpcy5pbnRlcmFjdGlvbk1hbmFnZXIuZGlydHk9ITApLHRoaXMuaW50ZXJhY3RpdmUmJnRoaXMuaW50ZXJhY3Rpb25NYW5hZ2VyLnVwZGF0ZSgpfSxwcm90by5zZXRCYWNrZ3JvdW5kQ29sb3I9ZnVuY3Rpb24oYSl7dGhpcy5iYWNrZ3JvdW5kQ29sb3I9YXx8MCx0aGlzLmJhY2tncm91bmRDb2xvclNwbGl0PWhleDJyZ2IodGhpcy5iYWNrZ3JvdW5kQ29sb3IpO3ZhciBiPXRoaXMuYmFja2dyb3VuZENvbG9yLnRvU3RyaW5nKDE2KTtiPVwiMDAwMDAwXCIuc3Vic3RyKDAsNi1iLmxlbmd0aCkrYix0aGlzLmJhY2tncm91bmRDb2xvclN0cmluZz1cIiNcIitifSxwcm90by5nZXRNb3VzZVBvc2l0aW9uPWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuaW50ZXJhY3Rpb25NYW5hZ2VyLm1vdXNlLmdsb2JhbH0sbW9kdWxlLmV4cG9ydHM9U3RhZ2U7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7bW9kdWxlLmV4cG9ydHM9e05PUk1BTDowLFNDUkVFTjoxfTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBFdmVudFRhcmdldCgpe3ZhciBhPXt9O3RoaXMuYWRkRXZlbnRMaXN0ZW5lcj10aGlzLm9uPWZ1bmN0aW9uKGIsYyl7dm9pZCAwPT09YVtiXSYmKGFbYl09W10pLC0xPT09YVtiXS5pbmRleE9mKGMpJiZhW2JdLnB1c2goYyl9LHRoaXMuZGlzcGF0Y2hFdmVudD10aGlzLmVtaXQ9ZnVuY3Rpb24oYil7aWYoYVtiLnR5cGVdJiZhW2IudHlwZV0ubGVuZ3RoKWZvcih2YXIgYz0wLGQ9YVtiLnR5cGVdLmxlbmd0aDtkPmM7YysrKWFbYi50eXBlXVtjXShiKX0sdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyPXRoaXMub2ZmPWZ1bmN0aW9uKGIsYyl7dmFyIGQ9YVtiXS5pbmRleE9mKGMpOy0xIT09ZCYmYVtiXS5zcGxpY2UoZCwxKX0sdGhpcy5yZW1vdmVBbGxFdmVudExpc3RlbmVycz1mdW5jdGlvbihiKXt2YXIgYz1hW2JdO2MmJihjLmxlbmd0aD0wKX19bW9kdWxlLmV4cG9ydHM9RXZlbnRUYXJnZXQ7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQ3VzdG9tUmVuZGVyYWJsZSgpe0Rpc3BsYXlPYmplY3QuY2FsbCh0aGlzKSx0aGlzLnJlbmRlcmFibGU9ITB9dmFyIERpc3BsYXlPYmplY3Q9cmVxdWlyZShcIi4uL2Rpc3BsYXkvRGlzcGxheU9iamVjdFwiKSxwcm90bz1DdXN0b21SZW5kZXJhYmxlLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKERpc3BsYXlPYmplY3QucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6Q3VzdG9tUmVuZGVyYWJsZX19KTtwcm90by5yZW5kZXJDYW52YXM9ZnVuY3Rpb24oKXt9LHByb3RvLmluaXRXZWJHTD1mdW5jdGlvbigpe30scHJvdG8ucmVuZGVyV2ViR0w9ZnVuY3Rpb24oKXt9LG1vZHVsZS5leHBvcnRzPUN1c3RvbVJlbmRlcmFibGU7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gUm9wZShhLGIpe1N0cmlwLmNhbGwodGhpcyxhKSx0aGlzLnBvaW50cz1iO3RyeXt0aGlzLnZlcnRpY2llcz1uZXcgRmxvYXQzMkFycmF5KDQqYi5sZW5ndGgpLHRoaXMudXZzPW5ldyBGbG9hdDMyQXJyYXkoNCpiLmxlbmd0aCksdGhpcy5jb2xvcnM9bmV3IEZsb2F0MzJBcnJheSgyKmIubGVuZ3RoKSx0aGlzLmluZGljZXM9bmV3IFVpbnQxNkFycmF5KDIqYi5sZW5ndGgpfWNhdGNoKGMpe3RoaXMudmVydGljaWVzPW5ldyBBcnJheSg0KmIubGVuZ3RoKSx0aGlzLnV2cz1uZXcgQXJyYXkoNCpiLmxlbmd0aCksdGhpcy5jb2xvcnM9bmV3IEFycmF5KDIqYi5sZW5ndGgpLHRoaXMuaW5kaWNlcz1uZXcgQXJyYXkoMipiLmxlbmd0aCl9dGhpcy5yZWZyZXNoKCl9dmFyIFN0cmlwPXJlcXVpcmUoXCIuL1N0cmlwXCIpLERpc3BsYXlPYmplY3RDb250YWluZXI9cmVxdWlyZShcIi4uL2Rpc3BsYXkvRGlzcGxheU9iamVjdENvbnRhaW5lclwiKSxwcm90bz1Sb3BlLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKFN0cmlwLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOlJvcGV9fSk7cHJvdG8ucmVmcmVzaD1mdW5jdGlvbigpe3ZhciBhPXRoaXMucG9pbnRzO2lmKCEoYS5sZW5ndGg8MSkpe3ZhciBiPXRoaXMudXZzLGM9YVswXSxkPXRoaXMuaW5kaWNlcyxlPXRoaXMuY29sb3JzO3RoaXMuY291bnQtPS4yLGJbMF09MCxiWzFdPTEsYlsyXT0wLGJbM109MSxlWzBdPTEsZVsxXT0xLGRbMF09MCxkWzFdPTE7Zm9yKHZhciBmLGcsaCxpPWEubGVuZ3RoLGo9MTtpPmo7aisrKWY9YVtqXSxnPTQqaixoPWovKGktMSksaiUyPyhiW2ddPWgsYltnKzFdPTAsYltnKzJdPWgsYltnKzNdPTEpOihiW2ddPWgsYltnKzFdPTAsYltnKzJdPWgsYltnKzNdPTEpLGc9MipqLGVbZ109MSxlW2crMV09MSxnPTIqaixkW2ddPWcsZFtnKzFdPWcrMSxjPWZ9fSxwcm90by51cGRhdGVUcmFuc2Zvcm09ZnVuY3Rpb24oKXt2YXIgYT10aGlzLnBvaW50cztpZighKGEubGVuZ3RoPDEpKXt2YXIgYixjPWFbMF0sZD17eDowLHk6MH07dGhpcy5jb3VudC09LjI7dmFyIGU9dGhpcy52ZXJ0aWNpZXM7ZVswXT1jLngrZC54LGVbMV09Yy55K2QueSxlWzJdPWMueC1kLngsZVszXT1jLnktZC55O2Zvcih2YXIgZixnLGgsaSxqLGs9YS5sZW5ndGgsbD0xO2s+bDtsKyspZj1hW2xdLGc9NCpsLGI9bDxhLmxlbmd0aC0xP2FbbCsxXTpmLGQueT0tKGIueC1jLngpLGQueD1iLnktYy55LGg9MTAqKDEtbC8oay0xKSksaD4xJiYoaD0xKSxpPU1hdGguc3FydChkLngqZC54K2QueSpkLnkpLGo9dGhpcy50ZXh0dXJlLmhlaWdodC8yLGQueC89aSxkLnkvPWksZC54Kj1qLGQueSo9aixlW2ddPWYueCtkLngsZVtnKzFdPWYueStkLnksZVtnKzJdPWYueC1kLngsZVtnKzNdPWYueS1kLnksYz1mO0Rpc3BsYXlPYmplY3RDb250YWluZXIucHJvdG90eXBlLnVwZGF0ZVRyYW5zZm9ybS5jYWxsKHRoaXMpfX0scHJvdG8uc2V0VGV4dHVyZT1mdW5jdGlvbihhKXt0aGlzLnRleHR1cmU9YSx0aGlzLnVwZGF0ZUZyYW1lPSEwfSxtb2R1bGUuZXhwb3J0cz1Sb3BlOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFNwaW5lKGEpe2lmKERpc3BsYXlPYmplY3RDb250YWluZXIuY2FsbCh0aGlzKSx0aGlzLnNwaW5lRGF0YT1TcGluZS5hbmltQ2FjaGVbYV0sIXRoaXMuc3BpbmVEYXRhKXRocm93IG5ldyBFcnJvcihcIlNwaW5lIGRhdGEgbXVzdCBiZSBwcmVsb2FkZWQgdXNpbmcgU3BpbmVMb2FkZXIgb3IgQXNzZXRMb2FkZXI6IFwiK2EpO3RoaXMuc2tlbGV0b249bmV3IHNwaW5lLlNrZWxldG9uKHRoaXMuc3BpbmVEYXRhKSx0aGlzLnNrZWxldG9uLnVwZGF0ZVdvcmxkVHJhbnNmb3JtKCksdGhpcy5zdGF0ZURhdGE9bmV3IHNwaW5lLkFuaW1hdGlvblN0YXRlRGF0YSh0aGlzLnNwaW5lRGF0YSksdGhpcy5zdGF0ZT1uZXcgc3BpbmUuQW5pbWF0aW9uU3RhdGUodGhpcy5zdGF0ZURhdGEpLHRoaXMuc2xvdENvbnRhaW5lcnM9W107Zm9yKHZhciBiPTAsYz10aGlzLnNrZWxldG9uLmRyYXdPcmRlci5sZW5ndGg7Yz5iO2IrKyl7dmFyIGQ9dGhpcy5za2VsZXRvbi5kcmF3T3JkZXJbYl0sZT1kLmF0dGFjaG1lbnQsZj1uZXcgRGlzcGxheU9iamVjdENvbnRhaW5lcjtpZih0aGlzLnNsb3RDb250YWluZXJzLnB1c2goZiksdGhpcy5hZGRDaGlsZChmKSxlIGluc3RhbmNlb2Ygc3BpbmUuUmVnaW9uQXR0YWNobWVudCl7dmFyIGc9ZS5yZW5kZXJlck9iamVjdC5uYW1lLGg9dGhpcy5jcmVhdGVTcHJpdGUoZCxlLnJlbmRlcmVyT2JqZWN0KTtkLmN1cnJlbnRTcHJpdGU9aCxkLmN1cnJlbnRTcHJpdGVOYW1lPWcsZi5hZGRDaGlsZChoKX19fXZhciBzcGluZT1yZXF1aXJlKFwiLi4vdXRpbHMvc3BpbmVcIiksRGlzcGxheU9iamVjdENvbnRhaW5lcj1yZXF1aXJlKFwiLi4vZGlzcGxheS9EaXNwbGF5T2JqZWN0Q29udGFpbmVyXCIpLFNwcml0ZT1yZXF1aXJlKFwiLi4vZGlzcGxheS9TcHJpdGVcIiksVGV4dHVyZT1yZXF1aXJlKFwiLi4vdGV4dHVyZXMvVGV4dHVyZVwiKSxwcm90bz1TcGluZS5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShEaXNwbGF5T2JqZWN0Q29udGFpbmVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOlNwaW5lfX0pO3Byb3RvLnVwZGF0ZVRyYW5zZm9ybT1mdW5jdGlvbigpe3RoaXMubGFzdFRpbWU9dGhpcy5sYXN0VGltZXx8RGF0ZS5ub3coKTt2YXIgYT0uMDAxKihEYXRlLm5vdygpLXRoaXMubGFzdFRpbWUpO3RoaXMubGFzdFRpbWU9RGF0ZS5ub3coKSx0aGlzLnN0YXRlLnVwZGF0ZShhKSx0aGlzLnN0YXRlLmFwcGx5KHRoaXMuc2tlbGV0b24pLHRoaXMuc2tlbGV0b24udXBkYXRlV29ybGRUcmFuc2Zvcm0oKTtmb3IodmFyIGI9dGhpcy5za2VsZXRvbi5kcmF3T3JkZXIsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKyl7dmFyIGU9YltjXSxmPWUuYXR0YWNobWVudCxnPXRoaXMuc2xvdENvbnRhaW5lcnNbY107aWYoZiBpbnN0YW5jZW9mIHNwaW5lLlJlZ2lvbkF0dGFjaG1lbnQpe2lmKGYucmVuZGVyZXJPYmplY3QmJighZS5jdXJyZW50U3ByaXRlTmFtZXx8ZS5jdXJyZW50U3ByaXRlTmFtZSE9PWYubmFtZSkpe3ZhciBoPWYucmVuZGVyZXJPYmplY3QubmFtZTtpZih2b2lkIDAhPT1lLmN1cnJlbnRTcHJpdGUmJihlLmN1cnJlbnRTcHJpdGUudmlzaWJsZT0hMSksZS5zcHJpdGVzPWUuc3ByaXRlc3x8e30sdm9pZCAwIT09ZS5zcHJpdGVzW2hdKWUuc3ByaXRlc1toXS52aXNpYmxlPSEwO2Vsc2V7dmFyIGk9dGhpcy5jcmVhdGVTcHJpdGUoZSxmLnJlbmRlcmVyT2JqZWN0KTtnLmFkZENoaWxkKGkpfWUuY3VycmVudFNwcml0ZT1lLnNwcml0ZXNbaF0sZS5jdXJyZW50U3ByaXRlTmFtZT1ofWcudmlzaWJsZT0hMDt2YXIgaj1lLmJvbmU7Zy5wb3NpdGlvbi54PWoud29ybGRYK2YueCpqLm0wMCtmLnkqai5tMDEsZy5wb3NpdGlvbi55PWoud29ybGRZK2YueCpqLm0xMCtmLnkqai5tMTEsZy5zY2FsZS54PWoud29ybGRTY2FsZVgsZy5zY2FsZS55PWoud29ybGRTY2FsZVksZy5yb3RhdGlvbj0tKGUuYm9uZS53b3JsZFJvdGF0aW9uKk1hdGguUEkvMTgwKX1lbHNlIGcudmlzaWJsZT0hMX1EaXNwbGF5T2JqZWN0Q29udGFpbmVyLnByb3RvdHlwZS51cGRhdGVUcmFuc2Zvcm0uY2FsbCh0aGlzKX0scHJvdG8uY3JlYXRlU3ByaXRlPWZ1bmN0aW9uKGEsYil7dmFyIGM9VGV4dHVyZS5jYWNoZVtiLm5hbWVdP2IubmFtZTpiLm5hbWUrXCIucG5nXCIsZD1uZXcgU3ByaXRlKFRleHR1cmUuZnJvbUZyYW1lKGMpKTtyZXR1cm4gZC5zY2FsZT1iLnNjYWxlLGQucm90YXRpb249Yi5yb3RhdGlvbixkLmFuY2hvci54PWQuYW5jaG9yLnk9LjUsYS5zcHJpdGVzPWEuc3ByaXRlc3x8e30sYS5zcHJpdGVzW2IubmFtZV09ZCxkfSxTcGluZS5hbmltQ2FjaGU9e30sbW9kdWxlLmV4cG9ydHM9U3BpbmU7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gU3RyaXAoYSxiLGMpe0Rpc3BsYXlPYmplY3RDb250YWluZXIuY2FsbCh0aGlzKSx0aGlzLnRleHR1cmU9YSx0aGlzLmJsZW5kTW9kZT1ibGVuZE1vZGVzLk5PUk1BTDt0cnl7dGhpcy51dnM9bmV3IEZsb2F0MzJBcnJheShbMCwxLDEsMSwxLDAsMCwxXSksdGhpcy52ZXJ0aWNpZXM9bmV3IEZsb2F0MzJBcnJheShbMCwwLDAsMCwwLDAsMCwwLDBdKSx0aGlzLmNvbG9ycz1uZXcgRmxvYXQzMkFycmF5KFsxLDEsMSwxXSksdGhpcy5pbmRpY2VzPW5ldyBVaW50MTZBcnJheShbMCwxLDIsM10pfWNhdGNoKGQpe3RoaXMudXZzPVswLDEsMSwxLDEsMCwwLDFdLHRoaXMudmVydGljaWVzPVswLDAsMCwwLDAsMCwwLDAsMF0sdGhpcy5jb2xvcnM9WzEsMSwxLDFdLHRoaXMuaW5kaWNlcz1bMCwxLDIsM119aWYodGhpcy53aWR0aD1iLHRoaXMuaGVpZ2h0PWMsYS5iYXNlVGV4dHVyZS5oYXNMb2FkZWQpdGhpcy53aWR0aD10aGlzLnRleHR1cmUuZnJhbWUud2lkdGgsdGhpcy5oZWlnaHQ9dGhpcy50ZXh0dXJlLmZyYW1lLmhlaWdodCx0aGlzLnVwZGF0ZUZyYW1lPSEwO2Vsc2V7dmFyIGU9dGhpczt0aGlzLnRleHR1cmUuYWRkRXZlbnRMaXN0ZW5lcihcInVwZGF0ZVwiLGZ1bmN0aW9uKCl7ZS5vblRleHR1cmVVcGRhdGUoKX0pfXRoaXMucmVuZGVyYWJsZT0hMH12YXIgYmxlbmRNb2Rlcz1yZXF1aXJlKFwiLi4vZGlzcGxheS9ibGVuZE1vZGVzXCIpLERpc3BsYXlPYmplY3RDb250YWluZXI9cmVxdWlyZShcIi4uL2Rpc3BsYXkvRGlzcGxheU9iamVjdENvbnRhaW5lclwiKSxwcm90bz1TdHJpcC5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShEaXNwbGF5T2JqZWN0Q29udGFpbmVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOlN0cmlwfX0pO3Byb3RvLnNldFRleHR1cmU9ZnVuY3Rpb24oYSl7dGhpcy50ZXh0dXJlPWEsdGhpcy53aWR0aD1hLmZyYW1lLndpZHRoLHRoaXMuaGVpZ2h0PWEuZnJhbWUuaGVpZ2h0LHRoaXMudXBkYXRlRnJhbWU9ITB9LHByb3RvLm9uVGV4dHVyZVVwZGF0ZT1mdW5jdGlvbigpe3RoaXMudXBkYXRlRnJhbWU9ITB9LG1vZHVsZS5leHBvcnRzPVN0cmlwOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFRpbGluZ1Nwcml0ZShhLGIsYyl7RGlzcGxheU9iamVjdENvbnRhaW5lci5jYWxsKHRoaXMpLHRoaXMudGV4dHVyZT1hLHRoaXMud2lkdGg9Yix0aGlzLmhlaWdodD1jLHRoaXMudGlsZVNjYWxlPW5ldyBQb2ludCgxLDEpLHRoaXMudGlsZVBvc2l0aW9uPW5ldyBQb2ludCgwLDApLHRoaXMucmVuZGVyYWJsZT0hMCx0aGlzLmJsZW5kTW9kZT1ibGVuZE1vZGVzLk5PUk1BTH12YXIgYmxlbmRNb2Rlcz1yZXF1aXJlKFwiLi4vZGlzcGxheS9ibGVuZE1vZGVzXCIpLERpc3BsYXlPYmplY3RDb250YWluZXI9cmVxdWlyZShcIi4uL2Rpc3BsYXkvRGlzcGxheU9iamVjdENvbnRhaW5lclwiKSxQb2ludD1yZXF1aXJlKFwiLi4vZ2VvbS9Qb2ludFwiKSxwcm90bz1UaWxpbmdTcHJpdGUucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoRGlzcGxheU9iamVjdENvbnRhaW5lci5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpUaWxpbmdTcHJpdGV9fSk7cHJvdG8uc2V0VGV4dHVyZT1mdW5jdGlvbihhKXt0aGlzLnRleHR1cmU9YSx0aGlzLnVwZGF0ZUZyYW1lPSEwfSxwcm90by5vblRleHR1cmVVcGRhdGU9ZnVuY3Rpb24oKXt0aGlzLnVwZGF0ZUZyYW1lPSEwfSxtb2R1bGUuZXhwb3J0cz1UaWxpbmdTcHJpdGU7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQWJzdHJhY3RGaWx0ZXIoYSxiKXt0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy5kaXJ0eT0hMCx0aGlzLnBhZGRpbmc9MCx0aGlzLnVuaWZvcm1zPWJ8fHt9LHRoaXMuZnJhZ21lbnRTcmM9YXx8W119bW9kdWxlLmV4cG9ydHM9QWJzdHJhY3RGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQmx1ckZpbHRlcigpe3RoaXMuYmx1clhGaWx0ZXI9bmV3IEJsdXJYRmlsdGVyLHRoaXMuYmx1cllGaWx0ZXI9bmV3IEJsdXJZRmlsdGVyLHRoaXMucGFzc2VzPVt0aGlzLmJsdXJYRmlsdGVyLHRoaXMuYmx1cllGaWx0ZXJdfXZhciBCbHVyWEZpbHRlcj1yZXF1aXJlKFwiLi9CbHVyWEZpbHRlclwiKSxCbHVyWUZpbHRlcj1yZXF1aXJlKFwiLi9CbHVyWUZpbHRlclwiKSxwcm90bz1CbHVyRmlsdGVyLnByb3RvdHlwZTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJibHVyXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmJsdXJYRmlsdGVyLmJsdXJ9LHNldDpmdW5jdGlvbihhKXt0aGlzLmJsdXJYRmlsdGVyLmJsdXI9dGhpcy5ibHVyWUZpbHRlci5ibHVyPWF9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiYmx1clhcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuYmx1clhGaWx0ZXIuYmx1cn0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMuYmx1clhGaWx0ZXIuYmx1cj1hfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImJsdXJZXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmJsdXJZRmlsdGVyLmJsdXJ9LHNldDpmdW5jdGlvbihhKXt0aGlzLmJsdXJZRmlsdGVyLmJsdXI9YX19KSxtb2R1bGUuZXhwb3J0cz1CbHVyRmlsdGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEJsdXJYRmlsdGVyKCl7QWJzdHJhY3RGaWx0ZXIuY2FsbCh0aGlzKSx0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy51bmlmb3Jtcz17Ymx1cjp7dHlwZTpcIjFmXCIsdmFsdWU6MS81MTJ9fSx0aGlzLmZyYWdtZW50U3JjPVtcInByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1wiLFwidmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XCIsXCJ2YXJ5aW5nIGZsb2F0IHZDb2xvcjtcIixcInVuaWZvcm0gZmxvYXQgYmx1cjtcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgIHZlYzQgc3VtID0gdmVjNCgwLjApO1wiLFwiICAgc3VtICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdmVjMih2VGV4dHVyZUNvb3JkLnggLSA0LjAqYmx1ciwgdlRleHR1cmVDb29yZC55KSkgKiAwLjA1O1wiLFwiICAgc3VtICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdmVjMih2VGV4dHVyZUNvb3JkLnggLSAzLjAqYmx1ciwgdlRleHR1cmVDb29yZC55KSkgKiAwLjA5O1wiLFwiICAgc3VtICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdmVjMih2VGV4dHVyZUNvb3JkLnggLSAyLjAqYmx1ciwgdlRleHR1cmVDb29yZC55KSkgKiAwLjEyO1wiLFwiICAgc3VtICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdmVjMih2VGV4dHVyZUNvb3JkLnggLSBibHVyLCB2VGV4dHVyZUNvb3JkLnkpKSAqIDAuMTU7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCwgdlRleHR1cmVDb29yZC55KSkgKiAwLjE2O1wiLFwiICAgc3VtICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdmVjMih2VGV4dHVyZUNvb3JkLnggKyBibHVyLCB2VGV4dHVyZUNvb3JkLnkpKSAqIDAuMTU7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCArIDIuMCpibHVyLCB2VGV4dHVyZUNvb3JkLnkpKSAqIDAuMTI7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCArIDMuMCpibHVyLCB2VGV4dHVyZUNvb3JkLnkpKSAqIDAuMDk7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCArIDQuMCpibHVyLCB2VGV4dHVyZUNvb3JkLnkpKSAqIDAuMDU7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSBzdW07XCIsXCJ9XCJdfXZhciBBYnN0cmFjdEZpbHRlcj1yZXF1aXJlKFwiLi9BYnN0cmFjdEZpbHRlclwiKSxwcm90bz1CbHVyWEZpbHRlci5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShBYnN0cmFjdEZpbHRlci5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpCbHVyWEZpbHRlcn19KTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJibHVyXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLmJsdXIudmFsdWUvKDEvN2UzKX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMuZGlydHk9ITAsdGhpcy51bmlmb3Jtcy5ibHVyLnZhbHVlPTEvN2UzKmF9fSksbW9kdWxlLmV4cG9ydHM9Qmx1clhGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQmx1cllGaWx0ZXIoKXtBYnN0cmFjdEZpbHRlci5jYWxsKHRoaXMpLHRoaXMucGFzc2VzPVt0aGlzXSx0aGlzLnVuaWZvcm1zPXtibHVyOnt0eXBlOlwiMWZcIix2YWx1ZToxLzUxMn19LHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSBmbG9hdCBibHVyO1wiLFwidW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgdmVjNCBzdW0gPSB2ZWM0KDAuMCk7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCwgdlRleHR1cmVDb29yZC55IC0gNC4wKmJsdXIpKSAqIDAuMDU7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCwgdlRleHR1cmVDb29yZC55IC0gMy4wKmJsdXIpKSAqIDAuMDk7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCwgdlRleHR1cmVDb29yZC55IC0gMi4wKmJsdXIpKSAqIDAuMTI7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCwgdlRleHR1cmVDb29yZC55IC0gYmx1cikpICogMC4xNTtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkpKSAqIDAuMTY7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCwgdlRleHR1cmVDb29yZC55ICsgYmx1cikpICogMC4xNTtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkgKyAyLjAqYmx1cikpICogMC4xMjtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkgKyAzLjAqYmx1cikpICogMC4wOTtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkgKyA0LjAqYmx1cikpICogMC4wNTtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IHN1bTtcIixcIn1cIl19dmFyIEFic3RyYWN0RmlsdGVyPXJlcXVpcmUoXCIuL0Fic3RyYWN0RmlsdGVyXCIpLHByb3RvPUJsdXJZRmlsdGVyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEFic3RyYWN0RmlsdGVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOkJsdXJZRmlsdGVyfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImJsdXJcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuYmx1ci52YWx1ZS8oMS83ZTMpfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy51bmlmb3Jtcy5ibHVyLnZhbHVlPTEvN2UzKmF9fSksbW9kdWxlLmV4cG9ydHM9Qmx1cllGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQ29sb3JNYXRyaXhGaWx0ZXIoKXtBYnN0cmFjdEZpbHRlci5jYWxsKHRoaXMpLHRoaXMucGFzc2VzPVt0aGlzXSx0aGlzLnVuaWZvcm1zPXttYXRyaXg6e3R5cGU6XCJtYXQ0XCIsdmFsdWU6WzEsMCwwLDAsMCwxLDAsMCwwLDAsMSwwLDAsMCwwLDFdfX0sdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIGZsb2F0IGludmVydDtcIixcInVuaWZvcm0gbWF0NCBtYXRyaXg7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZUZXh0dXJlQ29vcmQpICogbWF0cml4O1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gZ2xfRnJhZ0NvbG9yICogdkNvbG9yO1wiLFwifVwiXX12YXIgQWJzdHJhY3RGaWx0ZXI9cmVxdWlyZShcIi4vQWJzdHJhY3RGaWx0ZXJcIikscHJvdG89Q29sb3JNYXRyaXhGaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6Q29sb3JNYXRyaXhGaWx0ZXJ9fSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwibWF0cml4XCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLm1hdHJpeC52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMudW5pZm9ybXMubWF0cml4LnZhbHVlPWF9fSksbW9kdWxlLmV4cG9ydHM9Q29sb3JNYXRyaXhGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQ29sb3JTdGVwRmlsdGVyKCl7QWJzdHJhY3RGaWx0ZXIuY2FsbCh0aGlzKSx0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy51bmlmb3Jtcz17c3RlcDp7dHlwZTpcIjFmXCIsdmFsdWU6NX19LHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XCIsXCJ1bmlmb3JtIGZsb2F0IHN0ZXA7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgdmVjNCBjb2xvciA9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCk7XCIsXCIgICBjb2xvciA9IGZsb29yKGNvbG9yICogc3RlcCkgLyBzdGVwO1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gY29sb3IgKiB2Q29sb3I7XCIsXCJ9XCJdfXZhciBBYnN0cmFjdEZpbHRlcj1yZXF1aXJlKFwiLi9BYnN0cmFjdEZpbHRlclwiKSxwcm90bz1Db2xvclN0ZXBGaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6Q29sb3JTdGVwRmlsdGVyfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcInN0ZXBcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuc3RlcC52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMudW5pZm9ybXMuc3RlcC52YWx1ZT1hfX0pLG1vZHVsZS5leHBvcnRzPUNvbG9yU3RlcEZpbHRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBDcm9zc0hhdGNoRmlsdGVyKCl7QWJzdHJhY3RGaWx0ZXIuY2FsbCh0aGlzKSx0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy51bmlmb3Jtcz17Ymx1cjp7dHlwZTpcIjFmXCIsdmFsdWU6MS81MTJ9fSx0aGlzLmZyYWdtZW50U3JjPVtcInByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1wiLFwidmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XCIsXCJ2YXJ5aW5nIGZsb2F0IHZDb2xvcjtcIixcInVuaWZvcm0gZmxvYXQgYmx1cjtcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgICBmbG9hdCBsdW0gPSBsZW5ndGgodGV4dHVyZTJEKHVTYW1wbGVyLCB2VGV4dHVyZUNvb3JkLnh5KS5yZ2IpO1wiLFwiICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoMS4wLCAxLjAsIDEuMCwgMS4wKTtcIixcIiAgICBpZiAobHVtIDwgMS4wMCkge1wiLFwiICAgICAgICBpZiAobW9kKGdsX0ZyYWdDb29yZC54ICsgZ2xfRnJhZ0Nvb3JkLnksIDEwLjApID09IDAuMCkge1wiLFwiICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCgwLjAsIDAuMCwgMC4wLCAxLjApO1wiLFwiICAgICAgICB9XCIsXCIgICAgfVwiLFwiICAgIGlmIChsdW0gPCAwLjc1KSB7XCIsXCIgICAgICAgIGlmIChtb2QoZ2xfRnJhZ0Nvb3JkLnggLSBnbF9GcmFnQ29vcmQueSwgMTAuMCkgPT0gMC4wKSB7XCIsXCIgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KDAuMCwgMC4wLCAwLjAsIDEuMCk7XCIsXCIgICAgICAgIH1cIixcIiAgICB9XCIsXCIgICAgaWYgKGx1bSA8IDAuNTApIHtcIixcIiAgICAgICAgaWYgKG1vZChnbF9GcmFnQ29vcmQueCArIGdsX0ZyYWdDb29yZC55IC0gNS4wLCAxMC4wKSA9PSAwLjApIHtcIixcIiAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoMC4wLCAwLjAsIDAuMCwgMS4wKTtcIixcIiAgICAgICAgfVwiLFwiICAgIH1cIixcIiAgICBpZiAobHVtIDwgMC4zKSB7XCIsXCIgICAgICAgIGlmIChtb2QoZ2xfRnJhZ0Nvb3JkLnggLSBnbF9GcmFnQ29vcmQueSAtIDUuMCwgMTAuMCkgPT0gMC4wKSB7XCIsXCIgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KDAuMCwgMC4wLCAwLjAsIDEuMCk7XCIsXCIgICAgICAgIH1cIixcIiAgICB9XCIsXCJ9XCJdfXZhciBBYnN0cmFjdEZpbHRlcj1yZXF1aXJlKFwiLi9BYnN0cmFjdEZpbHRlclwiKSxwcm90bz1Dcm9zc0hhdGNoRmlsdGVyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEFic3RyYWN0RmlsdGVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOkNyb3NzSGF0Y2hGaWx0ZXJ9fSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiYmx1clwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy51bmlmb3Jtcy5ibHVyLnZhbHVlLygxLzdlMyl9LHNldDpmdW5jdGlvbihhKXt0aGlzLnVuaWZvcm1zLmJsdXIudmFsdWU9MS83ZTMqYX19KSxtb2R1bGUuZXhwb3J0cz1Dcm9zc0hhdGNoRmlsdGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIERpc3BsYWNlbWVudEZpbHRlcihhKXtBYnN0cmFjdEZpbHRlci5jYWxsKHRoaXMpLHRoaXMucGFzc2VzPVt0aGlzXSxhLmJhc2VUZXh0dXJlLl9wb3dlck9mMj0hMCx0aGlzLnVuaWZvcm1zPXtkaXNwbGFjZW1lbnRNYXA6e3R5cGU6XCJzYW1wbGVyMkRcIix2YWx1ZTphfSxzY2FsZTp7dHlwZTpcIjJmXCIsdmFsdWU6e3g6MzAseTozMH19LG9mZnNldDp7dHlwZTpcIjJmXCIsdmFsdWU6e3g6MCx5OjB9fSxtYXBEaW1lbnNpb25zOnt0eXBlOlwiMmZcIix2YWx1ZTp7eDoxLHk6NTExMn19LGRpbWVuc2lvbnM6e3R5cGU6XCI0ZnZcIix2YWx1ZTpbMCwwLDAsMF19fSxhLmJhc2VUZXh0dXJlLmhhc0xvYWRlZD8odGhpcy51bmlmb3Jtcy5tYXBEaW1lbnNpb25zLnZhbHVlLng9YS53aWR0aCx0aGlzLnVuaWZvcm1zLm1hcERpbWVuc2lvbnMudmFsdWUueT1hLmhlaWdodCk6KHRoaXMuYm91bmRMb2FkZWRGdW5jdGlvbj10aGlzLm9uVGV4dHVyZUxvYWRlZC5iaW5kKHRoaXMpLGEuYmFzZVRleHR1cmUub24oXCJsb2FkZWRcIix0aGlzLmJvdW5kTG9hZGVkRnVuY3Rpb24pKSx0aGlzLmZyYWdtZW50U3JjPVtcInByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1wiLFwidmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XCIsXCJ2YXJ5aW5nIGZsb2F0IHZDb2xvcjtcIixcInVuaWZvcm0gc2FtcGxlcjJEIGRpc3BsYWNlbWVudE1hcDtcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwidW5pZm9ybSB2ZWMyIHNjYWxlO1wiLFwidW5pZm9ybSB2ZWMyIG9mZnNldDtcIixcInVuaWZvcm0gdmVjNCBkaW1lbnNpb25zO1wiLFwidW5pZm9ybSB2ZWMyIG1hcERpbWVuc2lvbnM7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgdmVjMiBtYXBDb3JkcyA9IHZUZXh0dXJlQ29vcmQueHk7XCIsXCIgICBtYXBDb3JkcyArPSAoZGltZW5zaW9ucy56dyArIG9mZnNldCkvIGRpbWVuc2lvbnMueHkgO1wiLFwiICAgbWFwQ29yZHMueSAqPSAtMS4wO1wiLFwiICAgbWFwQ29yZHMueSArPSAxLjA7XCIsXCIgICB2ZWMyIG1hdFNhbXBsZSA9IHRleHR1cmUyRChkaXNwbGFjZW1lbnRNYXAsIG1hcENvcmRzKS54eTtcIixcIiAgIG1hdFNhbXBsZSAtPSAwLjU7XCIsXCIgICBtYXRTYW1wbGUgKj0gc2NhbGU7XCIsXCIgICBtYXRTYW1wbGUgLz0gbWFwRGltZW5zaW9ucztcIixcIiAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1U2FtcGxlciwgdmVjMih2VGV4dHVyZUNvb3JkLnggKyBtYXRTYW1wbGUueCwgdlRleHR1cmVDb29yZC55ICsgbWF0U2FtcGxlLnkpKTtcIixcIiAgIGdsX0ZyYWdDb2xvci5yZ2IgPSBtaXgoIGdsX0ZyYWdDb2xvci5yZ2IsIGdsX0ZyYWdDb2xvci5yZ2IsIDEuMCk7XCIsXCIgICB2ZWMyIGNvcmQgPSB2VGV4dHVyZUNvb3JkO1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gZ2xfRnJhZ0NvbG9yICogdkNvbG9yO1wiLFwifVwiXX12YXIgQWJzdHJhY3RGaWx0ZXI9cmVxdWlyZShcIi4vQWJzdHJhY3RGaWx0ZXJcIikscHJvdG89RGlzcGxhY2VtZW50RmlsdGVyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEFic3RyYWN0RmlsdGVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOkRpc3BsYWNlbWVudEZpbHRlcn19KTtwcm90by5vblRleHR1cmVMb2FkZWQ9ZnVuY3Rpb24oKXt0aGlzLnVuaWZvcm1zLm1hcERpbWVuc2lvbnMudmFsdWUueD10aGlzLnVuaWZvcm1zLmRpc3BsYWNlbWVudE1hcC52YWx1ZS53aWR0aCx0aGlzLnVuaWZvcm1zLm1hcERpbWVuc2lvbnMudmFsdWUueT10aGlzLnVuaWZvcm1zLmRpc3BsYWNlbWVudE1hcC52YWx1ZS5oZWlnaHQsdGhpcy51bmlmb3Jtcy5kaXNwbGFjZW1lbnRNYXAudmFsdWUuYmFzZVRleHR1cmUub2ZmKFwibG9hZGVkXCIsdGhpcy5ib3VuZExvYWRlZEZ1bmN0aW9uKX0sT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwibWFwXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLmRpc3BsYWNlbWVudE1hcC52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMudW5pZm9ybXMuZGlzcGxhY2VtZW50TWFwLnZhbHVlPWF9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwic2NhbGVcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuc2NhbGUudmFsdWV9LHNldDpmdW5jdGlvbihhKXt0aGlzLnVuaWZvcm1zLnNjYWxlLnZhbHVlPWF9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwib2Zmc2V0XCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLm9mZnNldC52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMudW5pZm9ybXMub2Zmc2V0LnZhbHVlPWF9fSksbW9kdWxlLmV4cG9ydHM9RGlzcGxhY2VtZW50RmlsdGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIERvdFNjcmVlbkZpbHRlcigpe0Fic3RyYWN0RmlsdGVyLmNhbGwodGhpcyksdGhpcy5wYXNzZXM9W3RoaXNdLHRoaXMudW5pZm9ybXM9e3NjYWxlOnt0eXBlOlwiMWZcIix2YWx1ZToxfSxhbmdsZTp7dHlwZTpcIjFmXCIsdmFsdWU6NX0sZGltZW5zaW9uczp7dHlwZTpcIjRmdlwiLHZhbHVlOlswLDAsMCwwXX19LHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSB2ZWM0IGRpbWVuc2lvbnM7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcInVuaWZvcm0gZmxvYXQgYW5nbGU7XCIsXCJ1bmlmb3JtIGZsb2F0IHNjYWxlO1wiLFwiZmxvYXQgcGF0dGVybigpIHtcIixcIiAgIGZsb2F0IHMgPSBzaW4oYW5nbGUpLCBjID0gY29zKGFuZ2xlKTtcIixcIiAgIHZlYzIgdGV4ID0gdlRleHR1cmVDb29yZCAqIGRpbWVuc2lvbnMueHk7XCIsXCIgICB2ZWMyIHBvaW50ID0gdmVjMihcIixcIiAgICAgICBjICogdGV4LnggLSBzICogdGV4LnksXCIsXCIgICAgICAgcyAqIHRleC54ICsgYyAqIHRleC55XCIsXCIgICApICogc2NhbGU7XCIsXCIgICByZXR1cm4gKHNpbihwb2ludC54KSAqIHNpbihwb2ludC55KSkgKiA0LjA7XCIsXCJ9XCIsXCJ2b2lkIG1haW4oKSB7XCIsXCIgICB2ZWM0IGNvbG9yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2VGV4dHVyZUNvb3JkKTtcIixcIiAgIGZsb2F0IGF2ZXJhZ2UgPSAoY29sb3IuciArIGNvbG9yLmcgKyBjb2xvci5iKSAvIDMuMDtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IHZlYzQodmVjMyhhdmVyYWdlICogMTAuMCAtIDUuMCArIHBhdHRlcm4oKSksIGNvbG9yLmEpO1wiLFwifVwiXX12YXIgQWJzdHJhY3RGaWx0ZXI9cmVxdWlyZShcIi4vQWJzdHJhY3RGaWx0ZXJcIikscHJvdG89RG90U2NyZWVuRmlsdGVyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEFic3RyYWN0RmlsdGVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOkRvdFNjcmVlbkZpbHRlcn19KTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJzY2FsZVwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy51bmlmb3Jtcy5zY2FsZS52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMuZGlydHk9ITAsdGhpcy51bmlmb3Jtcy5zY2FsZS52YWx1ZT1hfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImFuZ2xlXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLmFuZ2xlLnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5kaXJ0eT0hMCx0aGlzLnVuaWZvcm1zLmFuZ2xlLnZhbHVlPWF9fSksbW9kdWxlLmV4cG9ydHM9RG90U2NyZWVuRmlsdGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEZpbHRlckJsb2NrKCl7dGhpcy52aXNpYmxlPSEwLHRoaXMucmVuZGVyYWJsZT0hMH1tb2R1bGUuZXhwb3J0cz1GaWx0ZXJCbG9jazsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBHcmF5RmlsdGVyKCl7QWJzdHJhY3RGaWx0ZXIuY2FsbCh0aGlzKSx0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy51bmlmb3Jtcz17Z3JheTp7dHlwZTpcIjFmXCIsdmFsdWU6MX19LHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XCIsXCJ1bmlmb3JtIGZsb2F0IGdyYXk7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2VGV4dHVyZUNvb3JkKTtcIixcIiAgIGdsX0ZyYWdDb2xvci5yZ2IgPSBtaXgoZ2xfRnJhZ0NvbG9yLnJnYiwgdmVjMygwLjIxMjYqZ2xfRnJhZ0NvbG9yLnIgKyAwLjcxNTIqZ2xfRnJhZ0NvbG9yLmcgKyAwLjA3MjIqZ2xfRnJhZ0NvbG9yLmIpLCBncmF5KTtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IGdsX0ZyYWdDb2xvciAqIHZDb2xvcjtcIixcIn1cIl19dmFyIEFic3RyYWN0RmlsdGVyPXJlcXVpcmUoXCIuL0Fic3RyYWN0RmlsdGVyXCIpLHByb3RvPUdyYXlGaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6R3JheUZpbHRlcn19KTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJncmF5XCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLmdyYXkudmFsdWV9LHNldDpmdW5jdGlvbihhKXt0aGlzLnVuaWZvcm1zLmdyYXkudmFsdWU9YX19KSxtb2R1bGUuZXhwb3J0cz1HcmF5RmlsdGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEludmVydEZpbHRlcigpe0Fic3RyYWN0RmlsdGVyLmNhbGwodGhpcyksdGhpcy5wYXNzZXM9W3RoaXNdLHRoaXMudW5pZm9ybXM9e2ludmVydDp7dHlwZTpcIjFmXCIsdmFsdWU6MX19LHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSBmbG9hdCBpbnZlcnQ7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZUZXh0dXJlQ29vcmQpO1wiLFwiICAgZ2xfRnJhZ0NvbG9yLnJnYiA9IG1peCggKHZlYzMoMSktZ2xfRnJhZ0NvbG9yLnJnYikgKiBnbF9GcmFnQ29sb3IuYSwgZ2xfRnJhZ0NvbG9yLnJnYiwgMS4wIC0gaW52ZXJ0KTtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IGdsX0ZyYWdDb2xvciAqIHZDb2xvcjtcIixcIn1cIl19dmFyIEFic3RyYWN0RmlsdGVyPXJlcXVpcmUoXCIuL0Fic3RyYWN0RmlsdGVyXCIpLHByb3RvPUludmVydEZpbHRlci5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShBYnN0cmFjdEZpbHRlci5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpJbnZlcnRGaWx0ZXJ9fSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiaW52ZXJ0XCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLmludmVydC52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMudW5pZm9ybXMuaW52ZXJ0LnZhbHVlPWF9fSksbW9kdWxlLmV4cG9ydHM9SW52ZXJ0RmlsdGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFBpeGVsYXRlRmlsdGVyKCl7QWJzdHJhY3RGaWx0ZXIuY2FsbCh0aGlzKSx0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy51bmlmb3Jtcz17aW52ZXJ0Ont0eXBlOlwiMWZcIix2YWx1ZTowfSxkaW1lbnNpb25zOnt0eXBlOlwiNGZ2XCIsdmFsdWU6bmV3IEZsb2F0MzJBcnJheShbMWU0LDEwMCwxMCwxMF0pfSxwaXhlbFNpemU6e3R5cGU6XCIyZlwiLHZhbHVlOnt4OjEwLHk6MTB9fX0sdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIHZlYzIgdGVzdERpbTtcIixcInVuaWZvcm0gdmVjNCBkaW1lbnNpb25zO1wiLFwidW5pZm9ybSB2ZWMyIHBpeGVsU2l6ZTtcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgIHZlYzIgY29vcmQgPSB2VGV4dHVyZUNvb3JkO1wiLFwiICAgdmVjMiBzaXplID0gZGltZW5zaW9ucy54eS9waXhlbFNpemU7XCIsXCIgICB2ZWMyIGNvbG9yID0gZmxvb3IoICggdlRleHR1cmVDb29yZCAqIHNpemUgKSApIC8gc2l6ZSArIHBpeGVsU2l6ZS9kaW1lbnNpb25zLnh5ICogMC41O1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCBjb2xvcik7XCIsXCJ9XCJdfXZhciBBYnN0cmFjdEZpbHRlcj1yZXF1aXJlKFwiLi9BYnN0cmFjdEZpbHRlclwiKSxwcm90bz1QaXhlbGF0ZUZpbHRlci5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShBYnN0cmFjdEZpbHRlci5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpQaXhlbGF0ZUZpbHRlcn19KTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJzaXplXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLnBpeGVsU2l6ZS52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMuZGlydHk9ITAsdGhpcy51bmlmb3Jtcy5waXhlbFNpemUudmFsdWU9YX19KSxtb2R1bGUuZXhwb3J0cz1QaXhlbGF0ZUZpbHRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBSR0JTcGxpdEZpbHRlcigpe0Fic3RyYWN0RmlsdGVyLmNhbGwodGhpcyksdGhpcy5wYXNzZXM9W3RoaXNdLHRoaXMudW5pZm9ybXM9e3JlZDp7dHlwZTpcIjJmXCIsdmFsdWU6e3g6MjAseToyMH19LGdyZWVuOnt0eXBlOlwiMmZcIix2YWx1ZTp7eDotMjAseToyMH19LGJsdWU6e3R5cGU6XCIyZlwiLHZhbHVlOnt4OjIwLHk6LTIwfX0sZGltZW5zaW9uczp7dHlwZTpcIjRmdlwiLHZhbHVlOlswLDAsMCwwXX19LHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSB2ZWMyIHJlZDtcIixcInVuaWZvcm0gdmVjMiBncmVlbjtcIixcInVuaWZvcm0gdmVjMiBibHVlO1wiLFwidW5pZm9ybSB2ZWM0IGRpbWVuc2lvbnM7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICBnbF9GcmFnQ29sb3IuciA9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCArIHJlZC9kaW1lbnNpb25zLnh5KS5yO1wiLFwiICAgZ2xfRnJhZ0NvbG9yLmcgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZUZXh0dXJlQ29vcmQgKyBncmVlbi9kaW1lbnNpb25zLnh5KS5nO1wiLFwiICAgZ2xfRnJhZ0NvbG9yLmIgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZUZXh0dXJlQ29vcmQgKyBibHVlL2RpbWVuc2lvbnMueHkpLmI7XCIsXCIgICBnbF9GcmFnQ29sb3IuYSA9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCkuYTtcIixcIn1cIl19dmFyIEFic3RyYWN0RmlsdGVyPXJlcXVpcmUoXCIuL0Fic3RyYWN0RmlsdGVyXCIpLHByb3RvPVJHQlNwbGl0RmlsdGVyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEFic3RyYWN0RmlsdGVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOlJHQlNwbGl0RmlsdGVyfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImFuZ2xlXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLmJsdXIudmFsdWUvKDEvN2UzKX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMudW5pZm9ybXMuYmx1ci52YWx1ZT0xLzdlMyphfX0pLG1vZHVsZS5leHBvcnRzPVJHQlNwbGl0RmlsdGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFNlcGlhRmlsdGVyKCl7QWJzdHJhY3RGaWx0ZXIuY2FsbCh0aGlzKSx0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy51bmlmb3Jtcz17c2VwaWE6e3R5cGU6XCIxZlwiLHZhbHVlOjF9fSx0aGlzLmZyYWdtZW50U3JjPVtcInByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1wiLFwidmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XCIsXCJ2YXJ5aW5nIGZsb2F0IHZDb2xvcjtcIixcInVuaWZvcm0gZmxvYXQgc2VwaWE7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcImNvbnN0IG1hdDMgc2VwaWFNYXRyaXggPSBtYXQzKDAuMzU4OCwgMC43MDQ0LCAwLjEzNjgsIDAuMjk5MCwgMC41ODcwLCAwLjExNDAsIDAuMjM5MiwgMC40Njk2LCAwLjA5MTIpO1wiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCk7XCIsXCIgICBnbF9GcmFnQ29sb3IucmdiID0gbWl4KCBnbF9GcmFnQ29sb3IucmdiLCBnbF9GcmFnQ29sb3IucmdiICogc2VwaWFNYXRyaXgsIHNlcGlhKTtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IGdsX0ZyYWdDb2xvciAqIHZDb2xvcjtcIixcIn1cIl19dmFyIEFic3RyYWN0RmlsdGVyPXJlcXVpcmUoXCIuL0Fic3RyYWN0RmlsdGVyXCIpLHByb3RvPVNlcGlhRmlsdGVyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEFic3RyYWN0RmlsdGVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOlNlcGlhRmlsdGVyfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcInNlcGlhXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLnNlcGlhLnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy51bmlmb3Jtcy5zZXBpYS52YWx1ZT1hfX0pLG1vZHVsZS5leHBvcnRzPVNlcGlhRmlsdGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFNtYXJ0Qmx1ckZpbHRlcigpe0Fic3RyYWN0RmlsdGVyLmNhbGwodGhpcyksdGhpcy5wYXNzZXM9W3RoaXNdLHRoaXMudW5pZm9ybXM9e2JsdXI6e3R5cGU6XCIxZlwiLHZhbHVlOjEvNTEyfX0sdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XCIsXCJjb25zdCB2ZWMyIGRlbHRhID0gdmVjMigxLjAvMTAuMCwgMC4wKTtcIixcImZsb2F0IHJhbmRvbSh2ZWMzIHNjYWxlLCBmbG9hdCBzZWVkKSB7XCIsXCIgICByZXR1cm4gZnJhY3Qoc2luKGRvdChnbF9GcmFnQ29vcmQueHl6ICsgc2VlZCwgc2NhbGUpKSAqIDQzNzU4LjU0NTMgKyBzZWVkKTtcIixcIn1cIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICB2ZWM0IGNvbG9yID0gdmVjNCgwLjApO1wiLFwiICAgZmxvYXQgdG90YWwgPSAwLjA7XCIsXCIgICBmbG9hdCBvZmZzZXQgPSByYW5kb20odmVjMygxMi45ODk4LCA3OC4yMzMsIDE1MS43MTgyKSwgMC4wKTtcIixcIiAgIGZvciAoZmxvYXQgdCA9IC0zMC4wOyB0IDw9IDMwLjA7IHQrKykge1wiLFwiICAgICAgIGZsb2F0IHBlcmNlbnQgPSAodCArIG9mZnNldCAtIDAuNSkgLyAzMC4wO1wiLFwiICAgICAgIGZsb2F0IHdlaWdodCA9IDEuMCAtIGFicyhwZXJjZW50KTtcIixcIiAgICAgICB2ZWM0IHNhbXBsZSA9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCArIGRlbHRhICogcGVyY2VudCk7XCIsXCIgICAgICAgc2FtcGxlLnJnYiAqPSBzYW1wbGUuYTtcIixcIiAgICAgICBjb2xvciArPSBzYW1wbGUgKiB3ZWlnaHQ7XCIsXCIgICAgICAgdG90YWwgKz0gd2VpZ2h0O1wiLFwiICAgfVwiLFwiICAgZ2xfRnJhZ0NvbG9yID0gY29sb3IgLyB0b3RhbDtcIixcIiAgIGdsX0ZyYWdDb2xvci5yZ2IgLz0gZ2xfRnJhZ0NvbG9yLmEgKyAwLjAwMDAxO1wiLFwifVwiXX12YXIgQWJzdHJhY3RGaWx0ZXI9cmVxdWlyZShcIi4vQWJzdHJhY3RGaWx0ZXJcIikscHJvdG89U21hcnRCbHVyRmlsdGVyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEFic3RyYWN0RmlsdGVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOlNtYXJ0Qmx1ckZpbHRlcn19KTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJibHVyXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLmJsdXIudmFsdWV9LHNldDpmdW5jdGlvbihhKXt0aGlzLnVuaWZvcm1zLmJsdXIudmFsdWU9YX19KSxtb2R1bGUuZXhwb3J0cz1TbWFydEJsdXJGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gVHdpc3RGaWx0ZXIoKXtBYnN0cmFjdEZpbHRlci5jYWxsKHRoaXMpLHRoaXMucGFzc2VzPVt0aGlzXSx0aGlzLnVuaWZvcm1zPXtyYWRpdXM6e3R5cGU6XCIxZlwiLHZhbHVlOi41fSxhbmdsZTp7dHlwZTpcIjFmXCIsdmFsdWU6NX0sb2Zmc2V0Ont0eXBlOlwiMmZcIix2YWx1ZTp7eDouNSx5Oi41fX19LHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSB2ZWM0IGRpbWVuc2lvbnM7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcInVuaWZvcm0gZmxvYXQgcmFkaXVzO1wiLFwidW5pZm9ybSBmbG9hdCBhbmdsZTtcIixcInVuaWZvcm0gdmVjMiBvZmZzZXQ7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgdmVjMiBjb29yZCA9IHZUZXh0dXJlQ29vcmQgLSBvZmZzZXQ7XCIsXCIgICBmbG9hdCBkaXN0YW5jZSA9IGxlbmd0aChjb29yZCk7XCIsXCIgICBpZiAoZGlzdGFuY2UgPCByYWRpdXMpIHtcIixcIiAgICAgICBmbG9hdCByYXRpbyA9IChyYWRpdXMgLSBkaXN0YW5jZSkgLyByYWRpdXM7XCIsXCIgICAgICAgZmxvYXQgYW5nbGVNb2QgPSByYXRpbyAqIHJhdGlvICogYW5nbGU7XCIsXCIgICAgICAgZmxvYXQgcyA9IHNpbihhbmdsZU1vZCk7XCIsXCIgICAgICAgZmxvYXQgYyA9IGNvcyhhbmdsZU1vZCk7XCIsXCIgICAgICAgY29vcmQgPSB2ZWMyKGNvb3JkLnggKiBjIC0gY29vcmQueSAqIHMsIGNvb3JkLnggKiBzICsgY29vcmQueSAqIGMpO1wiLFwiICAgfVwiLFwiICAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCBjb29yZCtvZmZzZXQpO1wiLFwifVwiXX12YXIgQWJzdHJhY3RGaWx0ZXI9cmVxdWlyZShcIi4vQWJzdHJhY3RGaWx0ZXJcIikscHJvdG89VHdpc3RGaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6VHdpc3RGaWx0ZXJ9fSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwib2Zmc2V0XCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLm9mZnNldC52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMuZGlydHk9ITAsdGhpcy51bmlmb3Jtcy5vZmZzZXQudmFsdWU9YX19KSxPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJyYWRpdXNcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMucmFkaXVzLnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5kaXJ0eT0hMCx0aGlzLnVuaWZvcm1zLnJhZGl1cy52YWx1ZT1hfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImFuZ2xlXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLmFuZ2xlLnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5kaXJ0eT0hMCx0aGlzLnVuaWZvcm1zLmFuZ2xlLnZhbHVlPWF9fSksbW9kdWxlLmV4cG9ydHM9VHdpc3RGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQ2lyY2xlKGEsYixjKXt0aGlzLng9YXx8MCx0aGlzLnk9Ynx8MCx0aGlzLnJhZGl1cz1jfHwwfXZhciBwcm90bz1DaXJjbGUucHJvdG90eXBlO3Byb3RvLmNsb25lPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBDaXJjbGUodGhpcy54LHRoaXMueSx0aGlzLnJhZGl1cyl9LHByb3RvLmNvbnRhaW5zPWZ1bmN0aW9uKGEsYil7aWYodGhpcy5yYWRpdXM8PTApcmV0dXJuITE7dmFyIGM9dGhpcy54LWEsZD10aGlzLnktYixlPXRoaXMucmFkaXVzKnRoaXMucmFkaXVzO3JldHVybiBjKj1jLGQqPWQsZT49YytkfSxtb2R1bGUuZXhwb3J0cz1DaXJjbGU7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gRWxsaXBzZShhLGIsYyxkKXt0aGlzLng9YXx8MCx0aGlzLnk9Ynx8MCx0aGlzLndpZHRoPWN8fDAsdGhpcy5oZWlnaHQ9ZHx8MH12YXIgUmVjdGFuZ2xlPXJlcXVpcmUoXCIuL1JlY3RhbmdsZVwiKSxwcm90bz1FbGxpcHNlLnByb3RvdHlwZTtwcm90by5jbG9uZT1mdW5jdGlvbigpe3JldHVybiBuZXcgRWxsaXBzZSh0aGlzLngsdGhpcy55LHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpfSxwcm90by5jb250YWlucz1mdW5jdGlvbihhLGIpe2lmKHRoaXMud2lkdGg8PTB8fHRoaXMuaGVpZ2h0PD0wKXJldHVybiExO3ZhciBjPShhLXRoaXMueCkvdGhpcy53aWR0aC0uNSxkPShiLXRoaXMueSkvdGhpcy5oZWlnaHQtLjU7cmV0dXJuIGMqPWMsZCo9ZCwuMjU+YytkfSxwcm90by5nZXRCb3VuZHM9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IFJlY3RhbmdsZSh0aGlzLngsdGhpcy55LHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpfSxtb2R1bGUuZXhwb3J0cz1FbGxpcHNlOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFBvaW50KGEsYil7dGhpcy54PWF8fDAsdGhpcy55PWJ8fDB9UG9pbnQucHJvdG90eXBlLmNsb25lPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBQb2ludCh0aGlzLngsdGhpcy55KX0sbW9kdWxlLmV4cG9ydHM9UG9pbnQ7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gUG9seWdvbihhKXtpZihhIGluc3RhbmNlb2YgQXJyYXl8fChhPUFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpLFwibnVtYmVyXCI9PXR5cGVvZiBhWzBdKXtmb3IodmFyIGI9W10sYz0wLGQ9YS5sZW5ndGg7ZD5jO2MrPTIpYi5wdXNoKG5ldyBQb2ludChhW2NdLGFbYysxXSkpO2E9Yn10aGlzLnBvaW50cz1hfXZhciBQb2ludD1yZXF1aXJlKFwiLi9Qb2ludFwiKSxwcm90bz1Qb2x5Z29uLnByb3RvdHlwZTtwcm90by5jbG9uZT1mdW5jdGlvbigpe2Zvcih2YXIgYT1bXSxiPTA7Yjx0aGlzLnBvaW50cy5sZW5ndGg7YisrKWEucHVzaCh0aGlzLnBvaW50c1tiXS5jbG9uZSgpKTtyZXR1cm4gbmV3IFBvbHlnb24oYSl9LHByb3RvLmNvbnRhaW5zPWZ1bmN0aW9uKGEsYil7Zm9yKHZhciBjPSExLGQ9MCxlPXRoaXMucG9pbnRzLmxlbmd0aC0xO2Q8dGhpcy5wb2ludHMubGVuZ3RoO2U9ZCsrKXt2YXIgZj10aGlzLnBvaW50c1tkXS54LGc9dGhpcy5wb2ludHNbZF0ueSxoPXRoaXMucG9pbnRzW2VdLngsaT10aGlzLnBvaW50c1tlXS55LGo9Zz5iIT1pPmImJihoLWYpKihiLWcpLyhpLWcpK2Y+YTtqJiYoYz0hYyl9cmV0dXJuIGN9LG1vZHVsZS5leHBvcnRzPVBvbHlnb247IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gUmVjdGFuZ2xlKGEsYixjLGQpe3RoaXMueD1hfHwwLHRoaXMueT1ifHwwLHRoaXMud2lkdGg9Y3x8MCx0aGlzLmhlaWdodD1kfHwwfXZhciBwcm90bz1SZWN0YW5nbGUucHJvdG90eXBlO3Byb3RvLmNsb25lPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBSZWN0YW5nbGUodGhpcy54LHRoaXMueSx0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KX0scHJvdG8uY29udGFpbnM9ZnVuY3Rpb24oYSxiKXtpZih0aGlzLndpZHRoPD0wfHx0aGlzLmhlaWdodDw9MClyZXR1cm4hMTt2YXIgYz10aGlzLng7aWYoYT49YyYmYTw9Yyt0aGlzLndpZHRoKXt2YXIgZD10aGlzLnk7aWYoYj49ZCYmYjw9ZCt0aGlzLmhlaWdodClyZXR1cm4hMH1yZXR1cm4hMX0sbW9kdWxlLmV4cG9ydHM9UmVjdGFuZ2xlOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO3ZhciBNYXRyaXg9ZXhwb3J0cy5NYXRyaXg9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIEZsb2F0MzJBcnJheT9GbG9hdDMyQXJyYXk6QXJyYXksbWF0Mz1leHBvcnRzLm1hdDM9e30sbWF0ND1leHBvcnRzLm1hdDQ9e307bWF0My5jcmVhdGU9ZnVuY3Rpb24oKXt2YXIgYT1uZXcgTWF0cml4KDkpO3JldHVybiBhWzBdPTEsYVsxXT0wLGFbMl09MCxhWzNdPTAsYVs0XT0xLGFbNV09MCxhWzZdPTAsYVs3XT0wLGFbOF09MSxhfSxtYXQzLmlkZW50aXR5PWZ1bmN0aW9uKGEpe3JldHVybiBhWzBdPTEsYVsxXT0wLGFbMl09MCxhWzNdPTAsYVs0XT0xLGFbNV09MCxhWzZdPTAsYVs3XT0wLGFbOF09MSxhfSxtYXQ0LmNyZWF0ZT1mdW5jdGlvbigpe3ZhciBhPW5ldyBNYXRyaXgoMTYpO3JldHVybiBhWzBdPTEsYVsxXT0wLGFbMl09MCxhWzNdPTAsYVs0XT0wLGFbNV09MSxhWzZdPTAsYVs3XT0wLGFbOF09MCxhWzldPTAsYVsxMF09MSxhWzExXT0wLGFbMTJdPTAsYVsxM109MCxhWzE0XT0wLGFbMTVdPTEsYX0sbWF0My5tdWx0aXBseT1mdW5jdGlvbihhLGIsYyl7Y3x8KGM9YSk7dmFyIGQ9YVswXSxlPWFbMV0sZj1hWzJdLGc9YVszXSxoPWFbNF0saT1hWzVdLGo9YVs2XSxrPWFbN10sbD1hWzhdLG09YlswXSxuPWJbMV0sbz1iWzJdLHA9YlszXSxxPWJbNF0scj1iWzVdLHM9Yls2XSx0PWJbN10sdT1iWzhdO3JldHVybiBjWzBdPW0qZCtuKmcrbypqLGNbMV09bSplK24qaCtvKmssY1syXT1tKmYrbippK28qbCxjWzNdPXAqZCtxKmcrcipqLGNbNF09cCplK3EqaCtyKmssY1s1XT1wKmYrcSppK3IqbCxjWzZdPXMqZCt0KmcrdSpqLGNbN109cyplK3QqaCt1KmssY1s4XT1zKmYrdCppK3UqbCxjfSxtYXQzLmNsb25lPWZ1bmN0aW9uKGEpe3ZhciBiPW5ldyBNYXRyaXgoOSk7cmV0dXJuIGJbMF09YVswXSxiWzFdPWFbMV0sYlsyXT1hWzJdLGJbM109YVszXSxiWzRdPWFbNF0sYls1XT1hWzVdLGJbNl09YVs2XSxiWzddPWFbN10sYls4XT1hWzhdLGJ9LG1hdDMudHJhbnNwb3NlPWZ1bmN0aW9uKGEsYil7aWYoIWJ8fGE9PT1iKXt2YXIgYz1hWzFdLGQ9YVsyXSxlPWFbNV07cmV0dXJuIGFbMV09YVszXSxhWzJdPWFbNl0sYVszXT1jLGFbNV09YVs3XSxhWzZdPWQsYVs3XT1lLGF9cmV0dXJuIGJbMF09YVswXSxiWzFdPWFbM10sYlsyXT1hWzZdLGJbM109YVsxXSxiWzRdPWFbNF0sYls1XT1hWzddLGJbNl09YVsyXSxiWzddPWFbNV0sYls4XT1hWzhdLGJ9LG1hdDMudG9NYXQ0PWZ1bmN0aW9uKGEsYil7cmV0dXJuIGJ8fChiPW1hdDQuY3JlYXRlKCkpLGJbMTVdPTEsYlsxNF09MCxiWzEzXT0wLGJbMTJdPTAsYlsxMV09MCxiWzEwXT1hWzhdLGJbOV09YVs3XSxiWzhdPWFbNl0sYls3XT0wLGJbNl09YVs1XSxiWzVdPWFbNF0sYls0XT1hWzNdLGJbM109MCxiWzJdPWFbMl0sYlsxXT1hWzFdLGJbMF09YVswXSxifSxtYXQ0LmNyZWF0ZT1mdW5jdGlvbigpe3ZhciBhPW5ldyBNYXRyaXgoMTYpO3JldHVybiBhWzBdPTEsYVsxXT0wLGFbMl09MCxhWzNdPTAsYVs0XT0wLGFbNV09MSxhWzZdPTAsYVs3XT0wLGFbOF09MCxhWzldPTAsYVsxMF09MSxhWzExXT0wLGFbMTJdPTAsYVsxM109MCxhWzE0XT0wLGFbMTVdPTEsYX0sbWF0NC50cmFuc3Bvc2U9ZnVuY3Rpb24oYSxiKXtpZighYnx8YT09PWIpe3ZhciBjPWFbMV0sZD1hWzJdLGU9YVszXSxmPWFbNl0sZz1hWzddLGg9YVsxMV07cmV0dXJuIGFbMV09YVs0XSxhWzJdPWFbOF0sYVszXT1hWzEyXSxhWzRdPWMsYVs2XT1hWzldLGFbN109YVsxM10sYVs4XT1kLGFbOV09ZixhWzExXT1hWzE0XSxhWzEyXT1lLGFbMTNdPWcsYVsxNF09aCxhfXJldHVybiBiWzBdPWFbMF0sYlsxXT1hWzRdLGJbMl09YVs4XSxiWzNdPWFbMTJdLGJbNF09YVsxXSxiWzVdPWFbNV0sYls2XT1hWzldLGJbN109YVsxM10sYls4XT1hWzJdLGJbOV09YVs2XSxiWzEwXT1hWzEwXSxiWzExXT1hWzE0XSxiWzEyXT1hWzNdLGJbMTNdPWFbN10sYlsxNF09YVsxMV0sYlsxNV09YVsxNV0sYn0sbWF0NC5tdWx0aXBseT1mdW5jdGlvbihhLGIsYyl7Y3x8KGM9YSk7dmFyIGQ9YVswXSxlPWFbMV0sZj1hWzJdLGc9YVszXSxoPWFbNF0saT1hWzVdLGo9YVs2XSxrPWFbN10sbD1hWzhdLG09YVs5XSxuPWFbMTBdLG89YVsxMV0scD1hWzEyXSxxPWFbMTNdLHI9YVsxNF0scz1hWzE1XSx0PWJbMF0sdT1iWzFdLHY9YlsyXSx3PWJbM107cmV0dXJuIGNbMF09dCpkK3UqaCt2KmwrdypwLGNbMV09dCplK3UqaSt2Km0rdypxLGNbMl09dCpmK3Uqait2Km4rdypyLGNbM109dCpnK3Uqayt2Km8rdypzLHQ9Yls0XSx1PWJbNV0sdj1iWzZdLHc9Yls3XSxjWzRdPXQqZCt1KmgrdipsK3cqcCxjWzVdPXQqZSt1KmkrdiptK3cqcSxjWzZdPXQqZit1KmordipuK3cqcixjWzddPXQqZyt1KmsrdipvK3cqcyx0PWJbOF0sdT1iWzldLHY9YlsxMF0sdz1iWzExXSxjWzhdPXQqZCt1KmgrdipsK3cqcCxjWzldPXQqZSt1KmkrdiptK3cqcSxjWzEwXT10KmYrdSpqK3Yqbit3KnIsY1sxMV09dCpnK3Uqayt2Km8rdypzLHQ9YlsxMl0sdT1iWzEzXSx2PWJbMTRdLHc9YlsxNV0sY1sxMl09dCpkK3UqaCt2KmwrdypwLGNbMTNdPXQqZSt1KmkrdiptK3cqcSxjWzE0XT10KmYrdSpqK3Yqbit3KnIsY1sxNV09dCpnK3Uqayt2Km8rdypzLGN9OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO3ZhciBnbG9iYWxzPXJlcXVpcmUoXCIuL2NvcmUvZ2xvYmFsc1wiKSxzaGFkZXJzPXJlcXVpcmUoXCIuL3JlbmRlcmVycy93ZWJnbC9zaGFkZXJzXCIpLG1hdHJpeD1yZXF1aXJlKFwiLi9nZW9tL21hdHJpeFwiKSxwaXhpPW1vZHVsZS5leHBvcnRzPU9iamVjdC5jcmVhdGUoZ2xvYmFscyk7cGl4aS5Qb2ludD1yZXF1aXJlKFwiLi9nZW9tL1BvaW50XCIpLHBpeGkuUmVjdGFuZ2xlPXJlcXVpcmUoXCIuL2dlb20vUmVjdGFuZ2xlXCIpLHBpeGkuUG9seWdvbj1yZXF1aXJlKFwiLi9nZW9tL1BvbHlnb25cIikscGl4aS5DaXJjbGU9cmVxdWlyZShcIi4vZ2VvbS9DaXJjbGVcIikscGl4aS5FbGxpcHNlPXJlcXVpcmUoXCIuL2dlb20vRWxsaXBzZVwiKSxwaXhpLk1hdHJpeD1tYXRyaXguTWF0cml4LHBpeGkubWF0Mz1tYXRyaXgubWF0MyxwaXhpLm1hdDQ9bWF0cml4Lm1hdDQscGl4aS5ibGVuZE1vZGVzPXJlcXVpcmUoXCIuL2Rpc3BsYXkvYmxlbmRNb2Rlc1wiKSxwaXhpLkRpc3BsYXlPYmplY3Q9cmVxdWlyZShcIi4vZGlzcGxheS9EaXNwbGF5T2JqZWN0XCIpLHBpeGkuRGlzcGxheU9iamVjdENvbnRhaW5lcj1yZXF1aXJlKFwiLi9kaXNwbGF5L0Rpc3BsYXlPYmplY3RDb250YWluZXJcIikscGl4aS5TcHJpdGU9cmVxdWlyZShcIi4vZGlzcGxheS9TcHJpdGVcIikscGl4aS5Nb3ZpZUNsaXA9cmVxdWlyZShcIi4vZGlzcGxheS9Nb3ZpZUNsaXBcIikscGl4aS5BYnN0cmFjdEZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL0Fic3RyYWN0RmlsdGVyXCIpLHBpeGkuQmx1ckZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL0JsdXJGaWx0ZXJcIikscGl4aS5CbHVyWEZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL0JsdXJYRmlsdGVyXCIpLHBpeGkuQmx1cllGaWx0ZXI9cmVxdWlyZShcIi4vZmlsdGVycy9CbHVyWUZpbHRlclwiKSxwaXhpLkNvbG9yTWF0cml4RmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvQ29sb3JNYXRyaXhGaWx0ZXJcIikscGl4aS5Db2xvclN0ZXBGaWx0ZXI9cmVxdWlyZShcIi4vZmlsdGVycy9Db2xvclN0ZXBGaWx0ZXJcIikscGl4aS5Dcm9zc0hhdGNoRmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvQ3Jvc3NIYXRjaEZpbHRlclwiKSxwaXhpLkRpc3BsYWNlbWVudEZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL0Rpc3BsYWNlbWVudEZpbHRlclwiKSxwaXhpLkRvdFNjcmVlbkZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL0RvdFNjcmVlbkZpbHRlclwiKSxwaXhpLkZpbHRlckJsb2NrPXJlcXVpcmUoXCIuL2ZpbHRlcnMvRmlsdGVyQmxvY2tcIikscGl4aS5HcmF5RmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvR3JheUZpbHRlclwiKSxwaXhpLkludmVydEZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL0ludmVydEZpbHRlclwiKSxwaXhpLlBpeGVsYXRlRmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvUGl4ZWxhdGVGaWx0ZXJcIikscGl4aS5SR0JTcGxpdEZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL1JHQlNwbGl0RmlsdGVyXCIpLHBpeGkuU2VwaWFGaWx0ZXI9cmVxdWlyZShcIi4vZmlsdGVycy9TZXBpYUZpbHRlclwiKSxwaXhpLlNtYXJ0Qmx1ckZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL1NtYXJ0Qmx1ckZpbHRlclwiKSxwaXhpLlR3aXN0RmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvVHdpc3RGaWx0ZXJcIikscGl4aS5UZXh0PXJlcXVpcmUoXCIuL3RleHQvVGV4dFwiKSxwaXhpLkJpdG1hcFRleHQ9cmVxdWlyZShcIi4vdGV4dC9CaXRtYXBUZXh0XCIpLHBpeGkuSW50ZXJhY3Rpb25NYW5hZ2VyPXJlcXVpcmUoXCIuL0ludGVyYWN0aW9uTWFuYWdlclwiKSxwaXhpLlN0YWdlPXJlcXVpcmUoXCIuL2Rpc3BsYXkvU3RhZ2VcIikscGl4aS5FdmVudFRhcmdldD1yZXF1aXJlKFwiLi9ldmVudHMvRXZlbnRUYXJnZXRcIikscGl4aS5hdXRvRGV0ZWN0UmVuZGVyZXI9cmVxdWlyZShcIi4vdXRpbHMvYXV0b0RldGVjdFJlbmRlcmVyXCIpLHBpeGkuUG9seUs9cmVxdWlyZShcIi4vdXRpbHMvUG9seWtcIikscGl4aS5XZWJHTEdyYXBoaWNzPXJlcXVpcmUoXCIuL3JlbmRlcmVycy93ZWJnbC9ncmFwaGljc1wiKSxwaXhpLldlYkdMUmVuZGVyZXI9cmVxdWlyZShcIi4vcmVuZGVyZXJzL3dlYmdsL1dlYkdMUmVuZGVyZXJcIikscGl4aS5XZWJHTEJhdGNoPXJlcXVpcmUoXCIuL3JlbmRlcmVycy93ZWJnbC9XZWJHTEJhdGNoXCIpLHBpeGkuV2ViR0xSZW5kZXJHcm91cD1yZXF1aXJlKFwiLi9yZW5kZXJlcnMvd2ViZ2wvV2ViR0xSZW5kZXJHcm91cFwiKSxwaXhpLkNhbnZhc1JlbmRlcmVyPXJlcXVpcmUoXCIuL3JlbmRlcmVycy9jYW52YXMvQ2FudmFzUmVuZGVyZXJcIikscGl4aS5DYW52YXNHcmFwaGljcz1yZXF1aXJlKFwiLi9yZW5kZXJlcnMvY2FudmFzL2dyYXBoaWNzXCIpLHBpeGkuR3JhcGhpY3M9cmVxdWlyZShcIi4vcHJpbWl0aXZlcy9HcmFwaGljc1wiKSxwaXhpLlN0cmlwPXJlcXVpcmUoXCIuL2V4dHJhcy9TdHJpcFwiKSxwaXhpLlJvcGU9cmVxdWlyZShcIi4vZXh0cmFzL1JvcGVcIikscGl4aS5UaWxpbmdTcHJpdGU9cmVxdWlyZShcIi4vZXh0cmFzL1RpbGluZ1Nwcml0ZVwiKSxwaXhpLlNwaW5lPXJlcXVpcmUoXCIuL2V4dHJhcy9TcGluZVwiKSxwaXhpLkN1c3RvbVJlbmRlcmFibGU9cmVxdWlyZShcIi4vZXh0cmFzL0N1c3RvbVJlbmRlcmFibGVcIikscGl4aS5CYXNlVGV4dHVyZT1yZXF1aXJlKFwiLi90ZXh0dXJlcy9CYXNlVGV4dHVyZVwiKSxwaXhpLlRleHR1cmU9cmVxdWlyZShcIi4vdGV4dHVyZXMvVGV4dHVyZVwiKSxwaXhpLlJlbmRlclRleHR1cmU9cmVxdWlyZShcIi4vdGV4dHVyZXMvUmVuZGVyVGV4dHVyZVwiKSxwaXhpLkFzc2V0TG9hZGVyPXJlcXVpcmUoXCIuL2xvYWRlcnMvQXNzZXRMb2FkZXJcIikscGl4aS5Kc29uTG9hZGVyPXJlcXVpcmUoXCIuL2xvYWRlcnMvSnNvbkxvYWRlclwiKSxwaXhpLlNwcml0ZVNoZWV0TG9hZGVyPXJlcXVpcmUoXCIuL2xvYWRlcnMvU3ByaXRlU2hlZXRMb2FkZXJcIikscGl4aS5JbWFnZUxvYWRlcj1yZXF1aXJlKFwiLi9sb2FkZXJzL0ltYWdlTG9hZGVyXCIpLHBpeGkuQml0bWFwRm9udExvYWRlcj1yZXF1aXJlKFwiLi9sb2FkZXJzL0JpdG1hcEZvbnRMb2FkZXJcIikscGl4aS5TcGluZUxvYWRlcj1yZXF1aXJlKFwiLi9sb2FkZXJzL1NwaW5lTG9hZGVyXCIpLHBpeGkuaW5pdERlZmF1bHRTaGFkZXJzPXNoYWRlcnMuaW5pdERlZmF1bHRTaGFkZXJzLHBpeGkuYWN0aXZhdGVQcmltaXRpdmVTaGFkZXI9c2hhZGVycy5hY3RpdmF0ZVByaW1pdGl2ZVNoYWRlcixwaXhpLmRlYWN0aXZhdGVQcmltaXRpdmVTaGFkZXI9c2hhZGVycy5kZWFjdGl2YXRlUHJpbWl0aXZlU2hhZGVyLHBpeGkuYWN0aXZhdGVTdHJpcFNoYWRlcj1zaGFkZXJzLmFjdGl2YXRlU3RyaXBTaGFkZXIscGl4aS5kZWFjdGl2YXRlU3RyaXBTaGFkZXI9c2hhZGVycy5kZWFjdGl2YXRlU3RyaXBTaGFkZXI7dmFyIGRlYnVnPXJlcXVpcmUoXCIuL3V0aWxzL2RlYnVnXCIpO3BpeGkucnVuTGlzdD1kZWJ1Zy5ydW5MaXN0OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIGdldERhdGFUeXBlKGEpe3ZhciBiPVwiZGF0YTpcIixjPWEuc2xpY2UoMCxiLmxlbmd0aCkudG9Mb3dlckNhc2UoKTtpZihjPT09Yil7dmFyIGQ9YS5zbGljZShiLmxlbmd0aCksZT1kLmluZGV4T2YoXCIsXCIpO2lmKC0xPT09ZSlyZXR1cm4gbnVsbDt2YXIgZj1kLnNsaWNlKDAsZSkuc3BsaXQoXCI7XCIpWzBdO3JldHVybiBmJiZcInRleHQvcGxhaW5cIiE9PWYudG9Mb3dlckNhc2UoKT9mLnNwbGl0KFwiL1wiKS5wb3AoKS50b0xvd2VyQ2FzZSgpOlwidHh0XCJ9cmV0dXJuIG51bGx9ZnVuY3Rpb24gQXNzZXRMb2FkZXIoYSxiKXtFdmVudFRhcmdldC5jYWxsKHRoaXMpLHRoaXMuYXNzZXRVUkxzPWEsdGhpcy5jcm9zc29yaWdpbj1ifXZhciBFdmVudFRhcmdldD1yZXF1aXJlKFwiLi4vZXZlbnRzL0V2ZW50VGFyZ2V0XCIpLGxvYWRlcnNCeVR5cGU9e30scHJvdG89QXNzZXRMb2FkZXIucHJvdG90eXBlO3Byb3RvLmxvYWQ9ZnVuY3Rpb24oKXtmdW5jdGlvbiBhKCl7Yi5vbkFzc2V0TG9hZGVkKCl9dmFyIGI9dGhpczt0aGlzLmxvYWRDb3VudD10aGlzLmFzc2V0VVJMcy5sZW5ndGg7Zm9yKHZhciBjPTAsZD10aGlzLmFzc2V0VVJMcy5sZW5ndGg7ZD5jO2MrKyl7dmFyIGU9dGhpcy5hc3NldFVSTHNbY10sZj1nZXREYXRhVHlwZShlKTtmfHwoZj1lLnNwbGl0KFwiP1wiKS5zaGlmdCgpLnNwbGl0KFwiLlwiKS5wb3AoKS50b0xvd2VyQ2FzZSgpKTt2YXIgZz1sb2FkZXJzQnlUeXBlW2ZdO2lmKCFnKXRocm93IG5ldyBFcnJvcihmK1wiIGlzIGFuIHVuc3VwcG9ydGVkIGZpbGUgdHlwZVwiKTt2YXIgaD1uZXcgZyhlLHRoaXMuY3Jvc3NvcmlnaW4pO2guYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRlZFwiLGEpLGgubG9hZCgpfX0scHJvdG8ub25Bc3NldExvYWRlZD1mdW5jdGlvbigpe3RoaXMubG9hZENvdW50LS0sdGhpcy5kaXNwYXRjaEV2ZW50KHt0eXBlOlwib25Qcm9ncmVzc1wiLGNvbnRlbnQ6dGhpc30pLHRoaXMub25Qcm9ncmVzcyYmdGhpcy5vblByb2dyZXNzKCksdGhpcy5sb2FkQ291bnR8fCh0aGlzLmRpc3BhdGNoRXZlbnQoe3R5cGU6XCJvbkNvbXBsZXRlXCIsY29udGVudDp0aGlzfSksdGhpcy5vbkNvbXBsZXRlJiZ0aGlzLm9uQ29tcGxldGUoKSl9LEFzc2V0TG9hZGVyLnJlZ2lzdGVyTG9hZGVyVHlwZT1mdW5jdGlvbihhLGIpe2xvYWRlcnNCeVR5cGVbYV09Yn0sbW9kdWxlLmV4cG9ydHM9QXNzZXRMb2FkZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQml0bWFwRm9udExvYWRlcihhLGIpe0V2ZW50VGFyZ2V0LmNhbGwodGhpcyksdGhpcy51cmw9YSx0aGlzLmNyb3Nzb3JpZ2luPWIsdGhpcy5iYXNlVXJsPWEucmVwbGFjZSgvW15cXC9dKiQvLFwiXCIpLHRoaXMudGV4dHVyZT1udWxsfXZhciBBc3NldExvYWRlcj1yZXF1aXJlKFwiLi9Bc3NldExvYWRlclwiKSxJbWFnZUxvYWRlcj1yZXF1aXJlKFwiLi9JbWFnZUxvYWRlclwiKSxSZWN0YW5nbGU9cmVxdWlyZShcIi4uL2dlb20vUmVjdGFuZ2xlXCIpLEV2ZW50VGFyZ2V0PXJlcXVpcmUoXCIuLi9ldmVudHMvRXZlbnRUYXJnZXRcIiksQml0bWFwVGV4dD1yZXF1aXJlKFwiLi4vdGV4dC9CaXRtYXBUZXh0XCIpLFRleHR1cmU9cmVxdWlyZShcIi4uL3RleHR1cmVzL1RleHR1cmVcIikscGxhdGZvcm09cmVxdWlyZShcIi4uL3BsYXRmb3JtXCIpLHByb3RvPUJpdG1hcEZvbnRMb2FkZXIucHJvdG90eXBlO3Byb3RvLmhhbmRsZUV2ZW50PWZ1bmN0aW9uKGEpe3N3aXRjaChhLnR5cGUpe2Nhc2VcImxvYWRcIjp0aGlzLm9uWE1MTG9hZGVkKCk7YnJlYWs7ZGVmYXVsdDp0aGlzLm9uRXJyb3IoKX19LHByb3RvLmxvYWQ9ZnVuY3Rpb24oKXt0aGlzLnJlcXVlc3Q9cGxhdGZvcm0uY3JlYXRlUmVxdWVzdCgpLHRoaXMucmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLHRoaXMpLHRoaXMucmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIix0aGlzKSx0aGlzLnJlcXVlc3Qub3BlbihcIkdFVFwiLHRoaXMudXJsLCEwKSx0aGlzLnJlcXVlc3Qub3ZlcnJpZGVNaW1lVHlwZSYmdGhpcy5yZXF1ZXN0Lm92ZXJyaWRlTWltZVR5cGUoXCJhcHBsaWNhdGlvbi94bWxcIiksdGhpcy5yZXF1ZXN0LnNlbmQobnVsbCl9LHByb3RvLm9uWE1MTG9hZGVkPWZ1bmN0aW9uKCl7dmFyIGE9dGhpcy5iYXNlVXJsK3RoaXMucmVxdWVzdC5yZXNwb25zZVhNTC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInBhZ2VcIilbMF0uYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJmaWxlXCIpLm5vZGVWYWx1ZSxiPW5ldyBJbWFnZUxvYWRlcihhLHRoaXMuY3Jvc3NvcmlnaW4pO3RoaXMudGV4dHVyZT1iLnRleHR1cmUuYmFzZVRleHR1cmU7dmFyIGM9e30sZD10aGlzLnJlcXVlc3QucmVzcG9uc2VYTUwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbmZvXCIpWzBdLGU9dGhpcy5yZXF1ZXN0LnJlc3BvbnNlWE1MLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY29tbW9uXCIpWzBdO2MuZm9udD1kLmF0dHJpYnV0ZXMuZ2V0TmFtZWRJdGVtKFwiZmFjZVwiKS5ub2RlVmFsdWUsYy5zaXplPXBhcnNlSW50KGQuYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJzaXplXCIpLm5vZGVWYWx1ZSwxMCksYy5saW5lSGVpZ2h0PXBhcnNlSW50KGUuYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJsaW5lSGVpZ2h0XCIpLm5vZGVWYWx1ZSwxMCksYy5jaGFycz17fTtmb3IodmFyIGY9dGhpcy5yZXF1ZXN0LnJlc3BvbnNlWE1MLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiY2hhclwiKSxnPTA7ZzxmLmxlbmd0aDtnKyspe3ZhciBoPXBhcnNlSW50KGZbZ10uYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJpZFwiKS5ub2RlVmFsdWUsMTApLGk9bmV3IFJlY3RhbmdsZShwYXJzZUludChmW2ddLmF0dHJpYnV0ZXMuZ2V0TmFtZWRJdGVtKFwieFwiKS5ub2RlVmFsdWUsMTApLHBhcnNlSW50KGZbZ10uYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJ5XCIpLm5vZGVWYWx1ZSwxMCkscGFyc2VJbnQoZltnXS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcIndpZHRoXCIpLm5vZGVWYWx1ZSwxMCkscGFyc2VJbnQoZltnXS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcImhlaWdodFwiKS5ub2RlVmFsdWUsMTApKTtjLmNoYXJzW2hdPXt4T2Zmc2V0OnBhcnNlSW50KGZbZ10uYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJ4b2Zmc2V0XCIpLm5vZGVWYWx1ZSwxMCkseU9mZnNldDpwYXJzZUludChmW2ddLmF0dHJpYnV0ZXMuZ2V0TmFtZWRJdGVtKFwieW9mZnNldFwiKS5ub2RlVmFsdWUsMTApLHhBZHZhbmNlOnBhcnNlSW50KGZbZ10uYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJ4YWR2YW5jZVwiKS5ub2RlVmFsdWUsMTApLGtlcm5pbmc6e30sdGV4dHVyZTpUZXh0dXJlLmNhY2hlW2hdPW5ldyBUZXh0dXJlKHRoaXMudGV4dHVyZSxpKX19dmFyIGo9dGhpcy5yZXF1ZXN0LnJlc3BvbnNlWE1MLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwia2VybmluZ1wiKTtmb3IoZz0wO2c8ai5sZW5ndGg7ZysrKXt2YXIgaz1wYXJzZUludChqW2ddLmF0dHJpYnV0ZXMuZ2V0TmFtZWRJdGVtKFwiZmlyc3RcIikubm9kZVZhbHVlLDEwKSxsPXBhcnNlSW50KGpbZ10uYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJzZWNvbmRcIikubm9kZVZhbHVlLDEwKSxtPXBhcnNlSW50KGpbZ10uYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJhbW91bnRcIikubm9kZVZhbHVlLDEwKTtjLmNoYXJzW2xdLmtlcm5pbmdba109bX1CaXRtYXBUZXh0LmZvbnRzW2MuZm9udF09Yzt2YXIgbj10aGlzO2IuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRlZFwiLGZ1bmN0aW9uKCl7bi5vbkxvYWRlZCgpfSksYi5sb2FkKCl9LHByb3RvLm9uTG9hZGVkPWZ1bmN0aW9uKCl7dGhpcy5sb2FkZWQ9ITAsdGhpcy5kaXNwYXRjaEV2ZW50KHt0eXBlOlwibG9hZGVkXCIsY29udGVudDp0aGlzfSl9LHByb3RvLm9uRXJyb3I9ZnVuY3Rpb24oKXt0aGlzLmRpc3BhdGNoRXZlbnQoe3R5cGU6XCJlcnJvclwiLGNvbnRlbnQ6dGhpc30pfSxBc3NldExvYWRlci5yZWdpc3RlckxvYWRlclR5cGUoXCJ4bWxcIixCaXRtYXBGb250TG9hZGVyKSxBc3NldExvYWRlci5yZWdpc3RlckxvYWRlclR5cGUoXCJmbnRcIixCaXRtYXBGb250TG9hZGVyKSxtb2R1bGUuZXhwb3J0cz1CaXRtYXBGb250TG9hZGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEltYWdlTG9hZGVyKGEsYil7RXZlbnRUYXJnZXQuY2FsbCh0aGlzKSx0aGlzLnRleHR1cmU9VGV4dHVyZS5mcm9tSW1hZ2UoYSxiKSx0aGlzLmZyYW1lcz1bXX12YXIgQXNzZXRMb2FkZXI9cmVxdWlyZShcIi4vQXNzZXRMb2FkZXJcIiksRXZlbnRUYXJnZXQ9cmVxdWlyZShcIi4uL2V2ZW50cy9FdmVudFRhcmdldFwiKSxUZXh0dXJlPXJlcXVpcmUoXCIuLi90ZXh0dXJlcy9UZXh0dXJlXCIpLHByb3RvPUltYWdlTG9hZGVyLnByb3RvdHlwZTtwcm90by5sb2FkPWZ1bmN0aW9uKCl7aWYodGhpcy50ZXh0dXJlLmJhc2VUZXh0dXJlLmhhc0xvYWRlZCl0aGlzLm9uTG9hZGVkKCk7ZWxzZXt2YXIgYT10aGlzO3RoaXMudGV4dHVyZS5iYXNlVGV4dHVyZS5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkXCIsZnVuY3Rpb24oKXthLm9uTG9hZGVkKCl9KX19LHByb3RvLm9uTG9hZGVkPWZ1bmN0aW9uKCl7dGhpcy5kaXNwYXRjaEV2ZW50KHt0eXBlOlwibG9hZGVkXCIsY29udGVudDp0aGlzfSl9LHByb3RvLmxvYWRGcmFtZWRTcHJpdGVTaGVldD1mdW5jdGlvbihhLGIsYyl7dGhpcy5mcmFtZXM9W107Zm9yKHZhciBkPU1hdGguZmxvb3IodGhpcy50ZXh0dXJlLndpZHRoL2EpLGU9TWF0aC5mbG9vcih0aGlzLnRleHR1cmUuaGVpZ2h0L2IpLGY9MCxnPTA7ZT5nO2crKylmb3IodmFyIGg9MDtkPmg7aCsrLGYrKyl7dmFyIGk9bmV3IFRleHR1cmUodGhpcy50ZXh0dXJlLHt4OmgqYSx5OmcqYix3aWR0aDphLGhlaWdodDpifSk7dGhpcy5mcmFtZXMucHVzaChpKSxjJiYoVGV4dHVyZS5jYWNoZVtjK1wiLVwiK2ZdPWkpfWlmKHRoaXMudGV4dHVyZS5iYXNlVGV4dHVyZS5oYXNMb2FkZWQpdGhpcy5vbkxvYWRlZCgpO2Vsc2V7dmFyIGo9dGhpczt0aGlzLnRleHR1cmUuYmFzZVRleHR1cmUuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRlZFwiLGZ1bmN0aW9uKCl7ai5vbkxvYWRlZCgpfSl9fSxBc3NldExvYWRlci5yZWdpc3RlckxvYWRlclR5cGUoXCJqcGdcIixJbWFnZUxvYWRlciksQXNzZXRMb2FkZXIucmVnaXN0ZXJMb2FkZXJUeXBlKFwianBlZ1wiLEltYWdlTG9hZGVyKSxBc3NldExvYWRlci5yZWdpc3RlckxvYWRlclR5cGUoXCJwbmdcIixJbWFnZUxvYWRlciksQXNzZXRMb2FkZXIucmVnaXN0ZXJMb2FkZXJUeXBlKFwiZ2lmXCIsSW1hZ2VMb2FkZXIpLG1vZHVsZS5leHBvcnRzPUltYWdlTG9hZGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEpzb25Mb2FkZXIoYSxiKXtFdmVudFRhcmdldC5jYWxsKHRoaXMpLHRoaXMudXJsPWEsdGhpcy5jcm9zc29yaWdpbj1iLHRoaXMuYmFzZVVybD1hLnJlcGxhY2UoL1teXFwvXSokLyxcIlwiKSx0aGlzLmxvYWRlZD0hMX12YXIgQXNzZXRMb2FkZXI9cmVxdWlyZShcIi4vQXNzZXRMb2FkZXJcIiksSW1hZ2VMb2FkZXI9cmVxdWlyZShcIi4vSW1hZ2VMb2FkZXJcIiksRXZlbnRUYXJnZXQ9cmVxdWlyZShcIi4uL2V2ZW50cy9FdmVudFRhcmdldFwiKSxUZXh0dXJlPXJlcXVpcmUoXCIuLi90ZXh0dXJlcy9UZXh0dXJlXCIpLFNwaW5lPXJlcXVpcmUoXCIuLi9leHRyYXMvU3BpbmVcIiksU2tlbGV0b25Kc29uPXJlcXVpcmUoXCIuLi91dGlscy9zcGluZVwiKS5Ta2VsZXRvbkpzb24scGxhdGZvcm09cmVxdWlyZShcIi4uL3BsYXRmb3JtXCIpLHByb3RvPUpzb25Mb2FkZXIucHJvdG90eXBlO3Byb3RvLmhhbmRsZUV2ZW50PWZ1bmN0aW9uKGEpe3N3aXRjaChhLnR5cGUpe2Nhc2VcImxvYWRcIjp0aGlzLm9uSlNPTkxvYWRlZCgpO2JyZWFrO2RlZmF1bHQ6dGhpcy5vbkVycm9yKCl9fSxwcm90by5sb2FkPWZ1bmN0aW9uKCl7dGhpcy5yZXF1ZXN0PXBsYXRmb3JtLmNyZWF0ZVJlcXVlc3QoKSx0aGlzLnJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIix0aGlzKSx0aGlzLnJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsdGhpcyksdGhpcy5yZXF1ZXN0Lm9wZW4oXCJHRVRcIix0aGlzLnVybCwhMCksdGhpcy5yZXF1ZXN0Lm92ZXJyaWRlTWltZVR5cGUmJnRoaXMucmVxdWVzdC5vdmVycmlkZU1pbWVUeXBlKFwiYXBwbGljYXRpb24vanNvblwiKSx0aGlzLnJlcXVlc3Quc2VuZChudWxsKX0scHJvdG8ub25KU09OTG9hZGVkPWZ1bmN0aW9uKCl7aWYodGhpcy5qc29uPUpTT04ucGFyc2UodGhpcy5yZXF1ZXN0LnJlc3BvbnNlVGV4dCksdGhpcy5qc29uLmZyYW1lcyl7dmFyIGE9dGhpcyxiPXRoaXMuYmFzZVVybCt0aGlzLmpzb24ubWV0YS5pbWFnZSxjPW5ldyBJbWFnZUxvYWRlcihiLHRoaXMuY3Jvc3NvcmlnaW4pLGQ9dGhpcy5qc29uLmZyYW1lczt0aGlzLnRleHR1cmU9Yy50ZXh0dXJlLmJhc2VUZXh0dXJlLGMuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRlZFwiLGZ1bmN0aW9uKCl7YS5vbkxvYWRlZCgpfSk7Zm9yKHZhciBlIGluIGQpe3ZhciBmPWRbZV0uZnJhbWU7ZiYmKFRleHR1cmUuY2FjaGVbZV09bmV3IFRleHR1cmUodGhpcy50ZXh0dXJlLHt4OmYueCx5OmYueSx3aWR0aDpmLncsaGVpZ2h0OmYuaH0pLGRbZV0udHJpbW1lZCYmKFRleHR1cmUuY2FjaGVbZV0ucmVhbFNpemU9ZFtlXS5zcHJpdGVTb3VyY2VTaXplLFRleHR1cmUuY2FjaGVbZV0udHJpbS54PTApKX1jLmxvYWQoKX1lbHNlIGlmKHRoaXMuanNvbi5ib25lcyl7dmFyIGc9bmV3IFNrZWxldG9uSnNvbixoPWcucmVhZFNrZWxldG9uRGF0YSh0aGlzLmpzb24pO1NwaW5lLmFuaW1DYWNoZVt0aGlzLnVybF09aCx0aGlzLm9uTG9hZGVkKCl9ZWxzZSB0aGlzLm9uTG9hZGVkKCl9LHByb3RvLm9uTG9hZGVkPWZ1bmN0aW9uKCl7dGhpcy5sb2FkZWQ9ITAsdGhpcy5kaXNwYXRjaEV2ZW50KHt0eXBlOlwibG9hZGVkXCIsY29udGVudDp0aGlzfSl9LHByb3RvLm9uRXJyb3I9ZnVuY3Rpb24oKXt0aGlzLmRpc3BhdGNoRXZlbnQoe3R5cGU6XCJlcnJvclwiLGNvbnRlbnQ6dGhpc30pfSxBc3NldExvYWRlci5yZWdpc3RlckxvYWRlclR5cGUoXCJqc29uXCIsSnNvbkxvYWRlciksbW9kdWxlLmV4cG9ydHM9SnNvbkxvYWRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBTcGluZUxvYWRlcihhLGIpe0V2ZW50VGFyZ2V0LmNhbGwodGhpcyksdGhpcy51cmw9YSx0aGlzLmNyb3Nzb3JpZ2luPWIsdGhpcy5sb2FkZWQ9ITF9dmFyIEFzc2V0TG9hZGVyPXJlcXVpcmUoXCIuL0Fzc2V0TG9hZGVyXCIpLEpzb25Mb2FkZXI9cmVxdWlyZShcIi4vSnNvbkxvYWRlclwiKSxFdmVudFRhcmdldD1yZXF1aXJlKFwiLi4vZXZlbnRzL0V2ZW50VGFyZ2V0XCIpLFNwaW5lPXJlcXVpcmUoXCIuLi9leHRyYXMvU3BpbmVcIiksU2tlbGV0b25Kc29uPXJlcXVpcmUoXCIuLi91dGlscy9zcGluZVwiKS5Ta2VsZXRvbkpzb24scHJvdG89U3BpbmVMb2FkZXIucHJvdG90eXBlO3Byb3RvLmxvYWQ9ZnVuY3Rpb24oKXt2YXIgYT10aGlzLGI9bmV3IEpzb25Mb2FkZXIodGhpcy51cmwsdGhpcy5jcm9zc29yaWdpbik7Yi5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkXCIsZnVuY3Rpb24oYil7YS5qc29uPWIuY29udGVudC5qc29uLGEub25KU09OTG9hZGVkKCl9KSxiLmxvYWQoKX0scHJvdG8ub25KU09OTG9hZGVkPWZ1bmN0aW9uKCl7dmFyIGE9bmV3IFNrZWxldG9uSnNvbixiPWEucmVhZFNrZWxldG9uRGF0YSh0aGlzLmpzb24pO1NwaW5lLmFuaW1DYWNoZVt0aGlzLnVybF09Yix0aGlzLm9uTG9hZGVkKCl9LHByb3RvLm9uTG9hZGVkPWZ1bmN0aW9uKCl7dGhpcy5sb2FkZWQ9ITAsdGhpcy5kaXNwYXRjaEV2ZW50KHt0eXBlOlwibG9hZGVkXCIsY29udGVudDp0aGlzfSl9LEFzc2V0TG9hZGVyLnJlZ2lzdGVyTG9hZGVyVHlwZShcImFuaW1cIixTcGluZUxvYWRlciksbW9kdWxlLmV4cG9ydHM9U3BpbmVMb2FkZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gU3ByaXRlU2hlZXRMb2FkZXIoYSxiKXtFdmVudFRhcmdldC5jYWxsKHRoaXMpLHRoaXMudXJsPWEsdGhpcy5jcm9zc29yaWdpbj1iLHRoaXMuYmFzZVVybD1hLnJlcGxhY2UoL1teXFwvXSokLyxcIlwiKSx0aGlzLnRleHR1cmU9bnVsbCx0aGlzLmZyYW1lcz17fX12YXIgSnNvbkxvYWRlcj1yZXF1aXJlKFwiLi9Kc29uTG9hZGVyXCIpLEltYWdlTG9hZGVyPXJlcXVpcmUoXCIuL0ltYWdlTG9hZGVyXCIpLEV2ZW50VGFyZ2V0PXJlcXVpcmUoXCIuLi9ldmVudHMvRXZlbnRUYXJnZXRcIiksVGV4dHVyZT1yZXF1aXJlKFwiLi4vdGV4dHVyZXMvVGV4dHVyZVwiKSxwcm90bz1TcHJpdGVTaGVldExvYWRlci5wcm90b3R5cGU7cHJvdG8ubG9hZD1mdW5jdGlvbigpe3ZhciBhPXRoaXMsYj1uZXcgSnNvbkxvYWRlcih0aGlzLnVybCx0aGlzLmNyb3Nzb3JpZ2luKTtiLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkZWRcIixmdW5jdGlvbihiKXthLmpzb249Yi5jb250ZW50Lmpzb24sYS5vbkpTT05Mb2FkZWQoKX0pLGIubG9hZCgpfSxwcm90by5vbkpTT05Mb2FkZWQ9ZnVuY3Rpb24oKXt2YXIgYT10aGlzLGI9dGhpcy5iYXNlVXJsK3RoaXMuanNvbi5tZXRhLmltYWdlLGM9bmV3IEltYWdlTG9hZGVyKGIsdGhpcy5jcm9zc29yaWdpbiksZD10aGlzLmpzb24uZnJhbWVzO3RoaXMudGV4dHVyZT1jLnRleHR1cmUuYmFzZVRleHR1cmUsYy5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkXCIsZnVuY3Rpb24oKXthLm9uTG9hZGVkKCl9KTtmb3IodmFyIGUgaW4gZCl7dmFyIGY9ZFtlXS5mcmFtZTtmJiYoVGV4dHVyZS5jYWNoZVtlXT1uZXcgVGV4dHVyZSh0aGlzLnRleHR1cmUse3g6Zi54LHk6Zi55LHdpZHRoOmYudyxoZWlnaHQ6Zi5ofSksZFtlXS50cmltbWVkJiYoVGV4dHVyZS5jYWNoZVtlXS5yZWFsU2l6ZT1kW2VdLnNwcml0ZVNvdXJjZVNpemUsVGV4dHVyZS5jYWNoZVtlXS50cmltLng9MCkpfWMubG9hZCgpfSxwcm90by5vbkxvYWRlZD1mdW5jdGlvbigpe3RoaXMuZGlzcGF0Y2hFdmVudCh7dHlwZTpcImxvYWRlZFwiLGNvbnRlbnQ6dGhpc30pfSxtb2R1bGUuZXhwb3J0cz1TcHJpdGVTaGVldExvYWRlcjsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5tb2R1bGUuZXhwb3J0cz17Y29uc29sZTpnbG9iYWwuY29uc29sZSxkb2N1bWVudDpnbG9iYWwuZG9jdW1lbnQsbG9jYXRpb246Z2xvYmFsLmxvY2F0aW9uLG5hdmlnYXRvcjpnbG9iYWwubmF2aWdhdG9yLHdpbmRvdzpnbG9iYWwud2luZG93LGNyZWF0ZUNhbnZhczpmdW5jdGlvbigpe3JldHVybiBnbG9iYWwuZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKX0sY3JlYXRlSW1hZ2U6ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IGdsb2JhbC5JbWFnZX0sY3JlYXRlUmVxdWVzdDpmdW5jdGlvbigpe3JldHVybiBuZXcgZ2xvYmFsLlhNTEh0dHBSZXF1ZXN0fX07XG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBHcmFwaGljcygpe0Rpc3BsYXlPYmplY3RDb250YWluZXIuY2FsbCh0aGlzKSx0aGlzLnJlbmRlcmFibGU9ITAsdGhpcy5maWxsQWxwaGE9MSx0aGlzLmxpbmVXaWR0aD0wLHRoaXMubGluZUNvbG9yPVwiYmxhY2tcIix0aGlzLmdyYXBoaWNzRGF0YT1bXSx0aGlzLmN1cnJlbnRQYXRoPXtwb2ludHM6W119fXZhciBEaXNwbGF5T2JqZWN0Q29udGFpbmVyPXJlcXVpcmUoXCIuLi9kaXNwbGF5L0Rpc3BsYXlPYmplY3RDb250YWluZXJcIiksUmVjdGFuZ2xlPXJlcXVpcmUoXCIuLi9nZW9tL1JlY3RhbmdsZVwiKSxwcm90bz1HcmFwaGljcy5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShEaXNwbGF5T2JqZWN0Q29udGFpbmVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOkdyYXBoaWNzfX0pO3Byb3RvLmxpbmVTdHlsZT1mdW5jdGlvbihhLGIsYyl7dGhpcy5jdXJyZW50UGF0aC5wb2ludHMubGVuZ3RofHx0aGlzLmdyYXBoaWNzRGF0YS5wb3AoKSx0aGlzLmxpbmVXaWR0aD1hfHwwLHRoaXMubGluZUNvbG9yPWJ8fDAsdGhpcy5saW5lQWxwaGE9YXJndW1lbnRzLmxlbmd0aDwzPzE6Yyx0aGlzLmN1cnJlbnRQYXRoPXtsaW5lV2lkdGg6dGhpcy5saW5lV2lkdGgsbGluZUNvbG9yOnRoaXMubGluZUNvbG9yLGxpbmVBbHBoYTp0aGlzLmxpbmVBbHBoYSxmaWxsQ29sb3I6dGhpcy5maWxsQ29sb3IsZmlsbEFscGhhOnRoaXMuZmlsbEFscGhhLGZpbGw6dGhpcy5maWxsaW5nLHBvaW50czpbXSx0eXBlOkdyYXBoaWNzLlBPTFl9LHRoaXMuZ3JhcGhpY3NEYXRhLnB1c2godGhpcy5jdXJyZW50UGF0aCl9LHByb3RvLm1vdmVUbz1mdW5jdGlvbihhLGIpe3RoaXMuY3VycmVudFBhdGgucG9pbnRzLmxlbmd0aHx8dGhpcy5ncmFwaGljc0RhdGEucG9wKCksdGhpcy5jdXJyZW50UGF0aD10aGlzLmN1cnJlbnRQYXRoPXtsaW5lV2lkdGg6dGhpcy5saW5lV2lkdGgsbGluZUNvbG9yOnRoaXMubGluZUNvbG9yLGxpbmVBbHBoYTp0aGlzLmxpbmVBbHBoYSxmaWxsQ29sb3I6dGhpcy5maWxsQ29sb3IsZmlsbEFscGhhOnRoaXMuZmlsbEFscGhhLGZpbGw6dGhpcy5maWxsaW5nLHBvaW50czpbXSx0eXBlOkdyYXBoaWNzLlBPTFl9LHRoaXMuY3VycmVudFBhdGgucG9pbnRzLnB1c2goYSxiKSx0aGlzLmdyYXBoaWNzRGF0YS5wdXNoKHRoaXMuY3VycmVudFBhdGgpfSxwcm90by5saW5lVG89ZnVuY3Rpb24oYSxiKXt0aGlzLmN1cnJlbnRQYXRoLnBvaW50cy5wdXNoKGEsYiksdGhpcy5kaXJ0eT0hMH0scHJvdG8uYmVnaW5GaWxsPWZ1bmN0aW9uKGEsYil7dGhpcy5maWxsaW5nPSEwLHRoaXMuZmlsbENvbG9yPWF8fDAsdGhpcy5maWxsQWxwaGE9YXJndW1lbnRzLmxlbmd0aDwyPzE6Yn0scHJvdG8uZW5kRmlsbD1mdW5jdGlvbigpe3RoaXMuZmlsbGluZz0hMSx0aGlzLmZpbGxDb2xvcj1udWxsLHRoaXMuZmlsbEFscGhhPTF9LHByb3RvLmRyYXdSZWN0PWZ1bmN0aW9uKGEsYixjLGQpe3RoaXMuY3VycmVudFBhdGgucG9pbnRzLmxlbmd0aHx8dGhpcy5ncmFwaGljc0RhdGEucG9wKCksdGhpcy5jdXJyZW50UGF0aD17bGluZVdpZHRoOnRoaXMubGluZVdpZHRoLGxpbmVDb2xvcjp0aGlzLmxpbmVDb2xvcixsaW5lQWxwaGE6dGhpcy5saW5lQWxwaGEsZmlsbENvbG9yOnRoaXMuZmlsbENvbG9yLGZpbGxBbHBoYTp0aGlzLmZpbGxBbHBoYSxmaWxsOnRoaXMuZmlsbGluZyxwb2ludHM6W2EsYixjLGRdLHR5cGU6R3JhcGhpY3MuUkVDVH0sdGhpcy5ncmFwaGljc0RhdGEucHVzaCh0aGlzLmN1cnJlbnRQYXRoKSx0aGlzLmRpcnR5PSEwfSxwcm90by5kcmF3Q2lyY2xlPWZ1bmN0aW9uKGEsYixjKXt0aGlzLmN1cnJlbnRQYXRoLnBvaW50cy5sZW5ndGh8fHRoaXMuZ3JhcGhpY3NEYXRhLnBvcCgpLHRoaXMuY3VycmVudFBhdGg9e2xpbmVXaWR0aDp0aGlzLmxpbmVXaWR0aCxsaW5lQ29sb3I6dGhpcy5saW5lQ29sb3IsbGluZUFscGhhOnRoaXMubGluZUFscGhhLGZpbGxDb2xvcjp0aGlzLmZpbGxDb2xvcixmaWxsQWxwaGE6dGhpcy5maWxsQWxwaGEsZmlsbDp0aGlzLmZpbGxpbmcscG9pbnRzOlthLGIsYyxjXSx0eXBlOkdyYXBoaWNzLkNJUkN9LHRoaXMuZ3JhcGhpY3NEYXRhLnB1c2godGhpcy5jdXJyZW50UGF0aCksdGhpcy5kaXJ0eT0hMH0scHJvdG8uZHJhd0VsaXBzZT1mdW5jdGlvbihhLGIsYyxkKXt0aGlzLmN1cnJlbnRQYXRoLnBvaW50cy5sZW5ndGh8fHRoaXMuZ3JhcGhpY3NEYXRhLnBvcCgpLHRoaXMuY3VycmVudFBhdGg9e2xpbmVXaWR0aDp0aGlzLmxpbmVXaWR0aCxsaW5lQ29sb3I6dGhpcy5saW5lQ29sb3IsbGluZUFscGhhOnRoaXMubGluZUFscGhhLGZpbGxDb2xvcjp0aGlzLmZpbGxDb2xvcixmaWxsQWxwaGE6dGhpcy5maWxsQWxwaGEsZmlsbDp0aGlzLmZpbGxpbmcscG9pbnRzOlthLGIsYyxkXSx0eXBlOkdyYXBoaWNzLkVMSVB9LHRoaXMuZ3JhcGhpY3NEYXRhLnB1c2godGhpcy5jdXJyZW50UGF0aCksdGhpcy5kaXJ0eT0hMH0scHJvdG8uY2xlYXI9ZnVuY3Rpb24oKXt0aGlzLmxpbmVXaWR0aD0wLHRoaXMuZmlsbGluZz0hMSx0aGlzLmRpcnR5PSEwLHRoaXMuY2xlYXJEaXJ0eT0hMCx0aGlzLmdyYXBoaWNzRGF0YT1bXSx0aGlzLmJvdW5kcz1udWxsfSxwcm90by51cGRhdGVGaWx0ZXJCb3VuZHM9ZnVuY3Rpb24oKXtpZighdGhpcy5ib3VuZHMpe2Zvcih2YXIgYSxiLGMsZD0xLzAsZT0tMS8wLGY9MS8wLGc9LTEvMCxoPTA7aDx0aGlzLmdyYXBoaWNzRGF0YS5sZW5ndGg7aCsrKXt2YXIgaT10aGlzLmdyYXBoaWNzRGF0YVtoXSxqPWkudHlwZSxrPWkubGluZVdpZHRoO2lmKGE9aS5wb2ludHMsaj09PUdyYXBoaWNzLlJFQ1Qpe2I9YS54LWsvMixjPWEueS1rLzI7dmFyIGw9YS53aWR0aCtrLG09YS5oZWlnaHQraztkPWQ+Yj9iOmQsZT1iK2w+ZT9iK2w6ZSxmPWY+Yz9iOmYsZz1jK20+Zz9jK206Z31lbHNlIGlmKGo9PT1HcmFwaGljcy5DSVJDfHxqPT09R3JhcGhpY3MuRUxJUCl7Yj1hLngsYz1hLnk7dmFyIG49YS5yYWRpdXMray8yO2Q9ZD5iLW4/Yi1uOmQsZT1iK24+ZT9iK246ZSxmPWY+Yy1uP2MtbjpmLGc9YytuPmc/YytuOmd9ZWxzZSBmb3IodmFyIG89MDtvPGEubGVuZ3RoO28rPTIpYj1hW29dLGM9YVtvKzFdLGQ9ZD5iLWs/Yi1rOmQsZT1iK2s+ZT9iK2s6ZSxmPWY+Yy1rP2MtazpmLGc9YytrPmc/YytrOmd9dGhpcy5ib3VuZHM9bmV3IFJlY3RhbmdsZShkLGYsZS1kLGctZil9fSxHcmFwaGljcy5QT0xZPTAsR3JhcGhpY3MuUkVDVD0xLEdyYXBoaWNzLkNJUkM9MixHcmFwaGljcy5FTElQPTMsbW9kdWxlLmV4cG9ydHM9R3JhcGhpY3M7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQ2FudmFzUmVuZGVyZXIoYSxiLGMsZCl7dGhpcy50cmFuc3BhcmVudD1kLHRoaXMud2lkdGg9YXx8ODAwLHRoaXMuaGVpZ2h0PWJ8fDYwMCx0aGlzLnZpZXc9Y3x8cGxhdGZvcm0uY3JlYXRlQ2FudmFzKCksdGhpcy5jb250ZXh0PXRoaXMudmlldy5nZXRDb250ZXh0KFwiMmRcIiksdGhpcy5zbW9vdGhQcm9wZXJ0eT1udWxsLFwiaW1hZ2VTbW9vdGhpbmdFbmFibGVkXCJpbiB0aGlzLmNvbnRleHQ/dGhpcy5zbW9vdGhQcm9wZXJ0eT1cImltYWdlU21vb3RoaW5nRW5hYmxlZFwiOlwid2Via2l0SW1hZ2VTbW9vdGhpbmdFbmFibGVkXCJpbiB0aGlzLmNvbnRleHQ/dGhpcy5zbW9vdGhQcm9wZXJ0eT1cIndlYmtpdEltYWdlU21vb3RoaW5nRW5hYmxlZFwiOlwibW96SW1hZ2VTbW9vdGhpbmdFbmFibGVkXCJpbiB0aGlzLmNvbnRleHQ/dGhpcy5zbW9vdGhQcm9wZXJ0eT1cIm1vekltYWdlU21vb3RoaW5nRW5hYmxlZFwiOlwib0ltYWdlU21vb3RoaW5nRW5hYmxlZFwiaW4gdGhpcy5jb250ZXh0JiYodGhpcy5zbW9vdGhQcm9wZXJ0eT1cIm9JbWFnZVNtb290aGluZ0VuYWJsZWRcIiksdGhpcy5zY2FsZU1vZGU9bnVsbCx0aGlzLnJlZnJlc2g9ITAsdGhpcy52aWV3LndpZHRoPXRoaXMud2lkdGgsdGhpcy52aWV3LmhlaWdodD10aGlzLmhlaWdodCx0aGlzLmNvdW50PTB9dmFyIHBsYXRmb3JtPXJlcXVpcmUoXCIuLi8uLi9wbGF0Zm9ybVwiKSxnbG9iYWxzPXJlcXVpcmUoXCIuLi8uLi9jb3JlL2dsb2JhbHNcIiksY2FudmFzR3JhcGhpY3M9cmVxdWlyZShcIi4vZ3JhcGhpY3NcIiksQmFzZVRleHR1cmU9cmVxdWlyZShcIi4uLy4uL3RleHR1cmVzL0Jhc2VUZXh0dXJlXCIpLFRleHR1cmU9cmVxdWlyZShcIi4uLy4uL3RleHR1cmVzL1RleHR1cmVcIiksU3ByaXRlPXJlcXVpcmUoXCIuLi8uLi9kaXNwbGF5L1Nwcml0ZVwiKSxUaWxpbmdTcHJpdGU9cmVxdWlyZShcIi4uLy4uL2V4dHJhcy9UaWxpbmdTcHJpdGVcIiksU3RyaXA9cmVxdWlyZShcIi4uLy4uL2V4dHJhcy9TdHJpcFwiKSxDdXN0b21SZW5kZXJhYmxlPXJlcXVpcmUoXCIuLi8uLi9leHRyYXMvQ3VzdG9tUmVuZGVyYWJsZVwiKSxHcmFwaGljcz1yZXF1aXJlKFwiLi4vLi4vcHJpbWl0aXZlcy9HcmFwaGljc1wiKSxGaWx0ZXJCbG9jaz1yZXF1aXJlKFwiLi4vLi4vZmlsdGVycy9GaWx0ZXJCbG9ja1wiKSxwcm90bz1DYW52YXNSZW5kZXJlci5wcm90b3R5cGU7cHJvdG8ucmVuZGVyPWZ1bmN0aW9uKGEpe2dsb2JhbHMudGV4dHVyZXNUb1VwZGF0ZT1bXSxnbG9iYWxzLnRleHR1cmVzVG9EZXN0cm95PVtdLGdsb2JhbHMudmlzaWJsZUNvdW50KyssYS51cGRhdGVUcmFuc2Zvcm0oKSx0aGlzLnZpZXcuc3R5bGUuYmFja2dyb3VuZENvbG9yPT09YS5iYWNrZ3JvdW5kQ29sb3JTdHJpbmd8fHRoaXMudHJhbnNwYXJlbnR8fCh0aGlzLnZpZXcuc3R5bGUuYmFja2dyb3VuZENvbG9yPWEuYmFja2dyb3VuZENvbG9yU3RyaW5nKSx0aGlzLmNvbnRleHQuc2V0VHJhbnNmb3JtKDEsMCwwLDEsMCwwKSx0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsMCx0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KSx0aGlzLnJlbmRlckRpc3BsYXlPYmplY3QoYSksYS5pbnRlcmFjdGl2ZSYmKGEuX2ludGVyYWN0aXZlRXZlbnRzQWRkZWR8fChhLl9pbnRlcmFjdGl2ZUV2ZW50c0FkZGVkPSEwLGEuaW50ZXJhY3Rpb25NYW5hZ2VyLnNldFRhcmdldCh0aGlzKSkpLFRleHR1cmUuZnJhbWVVcGRhdGVzLmxlbmd0aD4wJiYoVGV4dHVyZS5mcmFtZVVwZGF0ZXM9W10pfSxwcm90by5yZXNpemU9ZnVuY3Rpb24oYSxiKXt0aGlzLndpZHRoPWEsdGhpcy5oZWlnaHQ9Yix0aGlzLnZpZXcud2lkdGg9YSx0aGlzLnZpZXcuaGVpZ2h0PWJ9LHByb3RvLnJlbmRlckRpc3BsYXlPYmplY3Q9ZnVuY3Rpb24oYSl7dmFyIGIsYz10aGlzLmNvbnRleHQ7Yy5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb249XCJzb3VyY2Utb3ZlclwiO3ZhciBkPWEubGFzdC5faU5leHQ7YT1hLmZpcnN0O2RvIGlmKGI9YS53b3JsZFRyYW5zZm9ybSxhLnZpc2libGUpaWYoYS5yZW5kZXJhYmxlKXtpZihhIGluc3RhbmNlb2YgU3ByaXRlKXt2YXIgZT1hLnRleHR1cmUuZnJhbWU7ZSYmZS53aWR0aCYmZS5oZWlnaHQmJmEudGV4dHVyZS5iYXNlVGV4dHVyZS5zb3VyY2UmJihjLmdsb2JhbEFscGhhPWEud29ybGRBbHBoYSxjLnNldFRyYW5zZm9ybShiWzBdLGJbM10sYlsxXSxiWzRdLGJbMl0sYls1XSksdGhpcy5zbW9vdGhQcm9wZXJ0eSYmdGhpcy5zY2FsZU1vZGUhPT1hLnRleHR1cmUuYmFzZVRleHR1cmUuc2NhbGVNb2RlJiYodGhpcy5zY2FsZU1vZGU9YS50ZXh0dXJlLmJhc2VUZXh0dXJlLnNjYWxlTW9kZSxjW3RoaXMuc21vb3RoUHJvcGVydHldPXRoaXMuc2NhbGVNb2RlPT09QmFzZVRleHR1cmUuU0NBTEVfTU9ERS5MSU5FQVIpLGMuZHJhd0ltYWdlKGEudGV4dHVyZS5iYXNlVGV4dHVyZS5zb3VyY2UsZS54LGUueSxlLndpZHRoLGUuaGVpZ2h0LGEuYW5jaG9yLngqLWUud2lkdGgsYS5hbmNob3IueSotZS5oZWlnaHQsZS53aWR0aCxlLmhlaWdodCkpfWVsc2UgaWYoYSBpbnN0YW5jZW9mIFN0cmlwKWMuc2V0VHJhbnNmb3JtKGJbMF0sYlszXSxiWzFdLGJbNF0sYlsyXSxiWzVdKSx0aGlzLnJlbmRlclN0cmlwKGEpO2Vsc2UgaWYoYSBpbnN0YW5jZW9mIFRpbGluZ1Nwcml0ZSljLnNldFRyYW5zZm9ybShiWzBdLGJbM10sYlsxXSxiWzRdLGJbMl0sYls1XSksdGhpcy5yZW5kZXJUaWxpbmdTcHJpdGUoYSk7ZWxzZSBpZihhIGluc3RhbmNlb2YgQ3VzdG9tUmVuZGVyYWJsZSljLnNldFRyYW5zZm9ybShiWzBdLGJbM10sYlsxXSxiWzRdLGJbMl0sYls1XSksYS5yZW5kZXJDYW52YXModGhpcyk7ZWxzZSBpZihhIGluc3RhbmNlb2YgR3JhcGhpY3MpYy5zZXRUcmFuc2Zvcm0oYlswXSxiWzNdLGJbMV0sYls0XSxiWzJdLGJbNV0pLGNhbnZhc0dyYXBoaWNzLnJlbmRlckdyYXBoaWNzKGEsYyk7ZWxzZSBpZihhIGluc3RhbmNlb2YgRmlsdGVyQmxvY2smJmEuZGF0YSBpbnN0YW5jZW9mIEdyYXBoaWNzKXt2YXIgZj1hLmRhdGE7aWYoYS5vcGVuKXtjLnNhdmUoKTt2YXIgZz1mLmFscGhhLGg9Zi53b3JsZFRyYW5zZm9ybTtjLnNldFRyYW5zZm9ybShoWzBdLGhbM10saFsxXSxoWzRdLGhbMl0saFs1XSksZi53b3JsZEFscGhhPS41LGMud29ybGRBbHBoYT0wLGNhbnZhc0dyYXBoaWNzLnJlbmRlckdyYXBoaWNzTWFzayhmLGMpLGMuY2xpcCgpLGYud29ybGRBbHBoYT1nfWVsc2UgYy5yZXN0b3JlKCl9YT1hLl9pTmV4dH1lbHNlIGE9YS5faU5leHQ7ZWxzZSBhPWEubGFzdC5faU5leHQ7d2hpbGUoYSE9PWQpfSxwcm90by5yZW5kZXJTdHJpcEZsYXQ9ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcy5jb250ZXh0LGM9YS52ZXJ0aWNpZXMsZD1jLmxlbmd0aC8yO3RoaXMuY291bnQrKyxiLmJlZ2luUGF0aCgpO2Zvcih2YXIgZT0xO2QtMj5lO2UrKyl7dmFyIGY9MiplLGc9Y1tmXSxoPWNbZisyXSxpPWNbZis0XSxqPWNbZisxXSxrPWNbZiszXSxsPWNbZis1XTtiLm1vdmVUbyhnLGopLGIubGluZVRvKGgsayksYi5saW5lVG8oaSxsKX1iLmZpbGxTdHlsZT1cIiNGRjAwMDBcIixiLmZpbGwoKSxiLmNsb3NlUGF0aCgpfSxwcm90by5yZW5kZXJUaWxpbmdTcHJpdGU9ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcy5jb250ZXh0O2IuZ2xvYmFsQWxwaGE9YS53b3JsZEFscGhhLGEuX190aWxlUGF0dGVybnx8KGEuX190aWxlUGF0dGVybj1iLmNyZWF0ZVBhdHRlcm4oYS50ZXh0dXJlLmJhc2VUZXh0dXJlLnNvdXJjZSxcInJlcGVhdFwiKSksYi5iZWdpblBhdGgoKTt2YXIgYz1hLnRpbGVQb3NpdGlvbixkPWEudGlsZVNjYWxlO2Iuc2NhbGUoZC54LGQueSksYi50cmFuc2xhdGUoYy54LGMueSksYi5maWxsU3R5bGU9YS5fX3RpbGVQYXR0ZXJuLGIuZmlsbFJlY3QoLWMueCwtYy55LGEud2lkdGgvZC54LGEuaGVpZ2h0L2QueSksYi5zY2FsZSgxL2QueCwxL2QueSksYi50cmFuc2xhdGUoLWMueCwtYy55KSxiLmNsb3NlUGF0aCgpfSxwcm90by5yZW5kZXJTdHJpcD1mdW5jdGlvbihhKXt2YXIgYj10aGlzLmNvbnRleHQsYz1hLnZlcnRpY2llcyxkPWEudXZzLGU9Yy5sZW5ndGgvMjt0aGlzLmNvdW50Kys7Zm9yKHZhciBmPTE7ZS0yPmY7ZisrKXt2YXIgZz0yKmYsaD1jW2ddLGk9Y1tnKzJdLGo9Y1tnKzRdLGs9Y1tnKzFdLGw9Y1tnKzNdLG09Y1tnKzVdLG49ZFtnXSphLnRleHR1cmUud2lkdGgsbz1kW2crMl0qYS50ZXh0dXJlLndpZHRoLHA9ZFtnKzRdKmEudGV4dHVyZS53aWR0aCxxPWRbZysxXSphLnRleHR1cmUuaGVpZ2h0LHI9ZFtnKzNdKmEudGV4dHVyZS5oZWlnaHQscz1kW2crNV0qYS50ZXh0dXJlLmhlaWdodDtiLnNhdmUoKSxiLmJlZ2luUGF0aCgpLGIubW92ZVRvKGgsayksYi5saW5lVG8oaSxsKSxiLmxpbmVUbyhqLG0pLGIuY2xvc2VQYXRoKCksYi5jbGlwKCk7dmFyIHQ9bipyK3EqcCtvKnMtcipwLXEqby1uKnMsdT1oKnIrcSpqK2kqcy1yKmotcSppLWgqcyx2PW4qaStoKnArbypqLWkqcC1oKm8tbipqLHc9bipyKmorcSppKnAraCpvKnMtaCpyKnAtcSpvKmotbippKnMseD1rKnIrcSptK2wqcy1yKm0tcSpsLWsqcyx5PW4qbCtrKnArbyptLWwqcC1rKm8tbiptLHo9bipyKm0rcSpsKnAraypvKnMtaypyKnAtcSpvKm0tbipsKnM7Yi50cmFuc2Zvcm0odS90LHgvdCx2L3QseS90LHcvdCx6L3QpLGIuZHJhd0ltYWdlKGEudGV4dHVyZS5iYXNlVGV4dHVyZS5zb3VyY2UsMCwwKSxiLnJlc3RvcmUoKX19LG1vZHVsZS5leHBvcnRzPUNhbnZhc1JlbmRlcmVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO3ZhciBwbGF0Zm9ybT1yZXF1aXJlKFwiLi4vLi4vcGxhdGZvcm1cIiksR3JhcGhpY3M9cmVxdWlyZShcIi4uLy4uL3ByaW1pdGl2ZXMvR3JhcGhpY3NcIik7ZXhwb3J0cy5yZW5kZXJHcmFwaGljcz1mdW5jdGlvbihhLGIpe2Zvcih2YXIgYyxkLGUsZixnPWEud29ybGRBbHBoYSxoPVwiXCIsaT0wLGo9YS5ncmFwaGljc0RhdGEubGVuZ3RoO2o+aTtpKyspaWYoYz1hLmdyYXBoaWNzRGF0YVtpXSxkPWMucG9pbnRzLGg9Yi5zdHJva2VTdHlsZT1cIiNcIisoXCIwMDAwMFwiKygwfGMubGluZUNvbG9yKS50b1N0cmluZygxNikpLnN1YnN0cigtNiksYi5saW5lV2lkdGg9Yy5saW5lV2lkdGgsYy50eXBlPT09R3JhcGhpY3MuUE9MWSl7Zm9yKGIuYmVnaW5QYXRoKCksYi5tb3ZlVG8oZFswXSxkWzFdKSxlPTEsZj1kLmxlbmd0aC8yO2Y+ZTtlKyspYi5saW5lVG8oZFsyKmVdLGRbMiplKzFdKTtkWzBdPT09ZFtkLmxlbmd0aC0yXSYmZFsxXT09PWRbZC5sZW5ndGgtMV0mJmIuY2xvc2VQYXRoKCksYy5maWxsJiYoYi5nbG9iYWxBbHBoYT1jLmZpbGxBbHBoYSpnLGIuZmlsbFN0eWxlPWg9XCIjXCIrKFwiMDAwMDBcIisoMHxjLmZpbGxDb2xvcikudG9TdHJpbmcoMTYpKS5zdWJzdHIoLTYpLGIuZmlsbCgpKSxjLmxpbmVXaWR0aCYmKGIuZ2xvYmFsQWxwaGE9Yy5saW5lQWxwaGEqZyxiLnN0cm9rZSgpKX1lbHNlIGlmKGMudHlwZT09PUdyYXBoaWNzLlJFQ1QpKGMuZmlsbENvbG9yfHwwPT09Yy5maWxsQ29sb3IpJiYoYi5nbG9iYWxBbHBoYT1jLmZpbGxBbHBoYSpnLGIuZmlsbFN0eWxlPWg9XCIjXCIrKFwiMDAwMDBcIisoMHxjLmZpbGxDb2xvcikudG9TdHJpbmcoMTYpKS5zdWJzdHIoLTYpLGIuZmlsbFJlY3QoZFswXSxkWzFdLGRbMl0sZFszXSkpLGMubGluZVdpZHRoJiYoYi5nbG9iYWxBbHBoYT1jLmxpbmVBbHBoYSpnLGIuc3Ryb2tlUmVjdChkWzBdLGRbMV0sZFsyXSxkWzNdKSk7ZWxzZSBpZihjLnR5cGU9PT1HcmFwaGljcy5DSVJDKWIuYmVnaW5QYXRoKCksYi5hcmMoZFswXSxkWzFdLGRbMl0sMCwyKk1hdGguUEkpLGIuY2xvc2VQYXRoKCksYy5maWxsJiYoYi5nbG9iYWxBbHBoYT1jLmZpbGxBbHBoYSpnLGIuZmlsbFN0eWxlPWg9XCIjXCIrKFwiMDAwMDBcIisoMHxjLmZpbGxDb2xvcikudG9TdHJpbmcoMTYpKS5zdWJzdHIoLTYpLGIuZmlsbCgpKSxjLmxpbmVXaWR0aCYmKGIuZ2xvYmFsQWxwaGE9Yy5saW5lQWxwaGEqZyxiLnN0cm9rZSgpKTtlbHNlIGlmKGMudHlwZT09PUdyYXBoaWNzLkVMSVApe3ZhciBrPWMucG9pbnRzLGw9MiprWzJdLG09MiprWzNdLG49a1swXS1sLzIsbz1rWzFdLW0vMjtiLmJlZ2luUGF0aCgpO3ZhciBwPS41NTIyODQ4LHE9bC8yKnAscj1tLzIqcCxzPW4rbCx0PW8rbSx1PW4rbC8yLHY9byttLzI7Yi5tb3ZlVG8obix2KSxiLmJlemllckN1cnZlVG8obix2LXIsdS1xLG8sdSxvKSxiLmJlemllckN1cnZlVG8odStxLG8scyx2LXIscyx2KSxiLmJlemllckN1cnZlVG8ocyx2K3IsdStxLHQsdSx0KSxiLmJlemllckN1cnZlVG8odS1xLHQsbix2K3Isbix2KSxiLmNsb3NlUGF0aCgpLGMuZmlsbCYmKGIuZ2xvYmFsQWxwaGE9Yy5maWxsQWxwaGEqZyxiLmZpbGxTdHlsZT1oPVwiI1wiKyhcIjAwMDAwXCIrKDB8Yy5maWxsQ29sb3IpLnRvU3RyaW5nKDE2KSkuc3Vic3RyKC02KSxiLmZpbGwoKSksYy5saW5lV2lkdGgmJihiLmdsb2JhbEFscGhhPWMubGluZUFscGhhKmcsYi5zdHJva2UoKSl9fSxleHBvcnRzLnJlbmRlckdyYXBoaWNzTWFzaz1mdW5jdGlvbihhLGIpe3ZhciBjPWEuZ3JhcGhpY3NEYXRhLmxlbmd0aDtpZigwIT09Yyl7Yz4xJiYoYz0xLHBsYXRmb3JtLmNvbnNvbGUud2FybihcIlBpeGkuanMgd2FybmluZzogbWFza3MgaW4gY2FudmFzIGNhbiBvbmx5IG1hc2sgdXNpbmcgdGhlIGZpcnN0IHBhdGggaW4gdGhlIGdyYXBoaWNzIG9iamVjdFwiKSk7Zm9yKHZhciBkPTA7MT5kO2QrKyl7dmFyIGU9YS5ncmFwaGljc0RhdGFbZF0sZj1lLnBvaW50cztpZihlLnR5cGU9PT1HcmFwaGljcy5QT0xZKXtiLmJlZ2luUGF0aCgpLGIubW92ZVRvKGZbMF0sZlsxXSk7Zm9yKHZhciBnPTE7ZzxmLmxlbmd0aC8yO2crKyliLmxpbmVUbyhmWzIqZ10sZlsyKmcrMV0pO2ZbMF09PT1mW2YubGVuZ3RoLTJdJiZmWzFdPT09ZltmLmxlbmd0aC0xXSYmYi5jbG9zZVBhdGgoKX1lbHNlIGlmKGUudHlwZT09PUdyYXBoaWNzLlJFQ1QpYi5iZWdpblBhdGgoKSxiLnJlY3QoZlswXSxmWzFdLGZbMl0sZlszXSksYi5jbG9zZVBhdGgoKTtlbHNlIGlmKGUudHlwZT09PUdyYXBoaWNzLkNJUkMpYi5iZWdpblBhdGgoKSxiLmFyYyhmWzBdLGZbMV0sZlsyXSwwLDIqTWF0aC5QSSksYi5jbG9zZVBhdGgoKTtlbHNlIGlmKGUudHlwZT09PUdyYXBoaWNzLkVMSVApe3ZhciBoPWUucG9pbnRzLGk9MipoWzJdLGo9MipoWzNdLGs9aFswXS1pLzIsbD1oWzFdLWovMjtiLmJlZ2luUGF0aCgpO3ZhciBtPS41NTIyODQ4LG49aS8yKm0sbz1qLzIqbSxwPWsraSxxPWwraixyPWsraS8yLHM9bCtqLzI7Yi5tb3ZlVG8oayxzKSxiLmJlemllckN1cnZlVG8oayxzLW8sci1uLGwscixsKSxiLmJlemllckN1cnZlVG8ocituLGwscCxzLW8scCxzKSxiLmJlemllckN1cnZlVG8ocCxzK28scituLHEscixxKSxiLmJlemllckN1cnZlVG8oci1uLHEsayxzK28sayxzKSxiLmNsb3NlUGF0aCgpfX19fTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBQaXhpU2hhZGVyKCl7dGhpcy5wcm9ncmFtPW51bGwsdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbG93cCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZUZXh0dXJlQ29vcmQpICogdkNvbG9yO1wiLFwifVwiXSx0aGlzLnRleHR1cmVDb3VudD0wfXZhciBjb21waWxlPXJlcXVpcmUoXCIuL2NvbXBpbGVcIiksZ2xvYmFscz1yZXF1aXJlKFwiLi4vLi4vY29yZS9nbG9iYWxzXCIpLHByb3RvPVBpeGlTaGFkZXIucHJvdG90eXBlO3Byb3RvLmluaXQ9ZnVuY3Rpb24oKXt2YXIgYT1nbG9iYWxzLmdsLGI9Y29tcGlsZS5wcm9ncmFtKGEsdGhpcy52ZXJ0ZXhTcmN8fFBpeGlTaGFkZXIuZGVmYXVsdFZlcnRleFNyYyx0aGlzLmZyYWdtZW50U3JjKTthLnVzZVByb2dyYW0oYiksdGhpcy51U2FtcGxlcj1hLmdldFVuaWZvcm1Mb2NhdGlvbihiLFwidVNhbXBsZXJcIiksdGhpcy5wcm9qZWN0aW9uVmVjdG9yPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJwcm9qZWN0aW9uVmVjdG9yXCIpLHRoaXMub2Zmc2V0VmVjdG9yPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJvZmZzZXRWZWN0b3JcIiksdGhpcy5kaW1lbnNpb25zPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJkaW1lbnNpb25zXCIpLHRoaXMuYVZlcnRleFBvc2l0aW9uPWEuZ2V0QXR0cmliTG9jYXRpb24oYixcImFWZXJ0ZXhQb3NpdGlvblwiKSx0aGlzLmNvbG9yQXR0cmlidXRlPWEuZ2V0QXR0cmliTG9jYXRpb24oYixcImFDb2xvclwiKSx0aGlzLmFUZXh0dXJlQ29vcmQ9YS5nZXRBdHRyaWJMb2NhdGlvbihiLFwiYVRleHR1cmVDb29yZFwiKTtmb3IodmFyIGMgaW4gdGhpcy51bmlmb3Jtcyl0aGlzLnVuaWZvcm1zW2NdLnVuaWZvcm1Mb2NhdGlvbj1hLmdldFVuaWZvcm1Mb2NhdGlvbihiLGMpO3RoaXMuaW5pdFVuaWZvcm1zKCksdGhpcy5wcm9ncmFtPWJ9LHByb3RvLmluaXRVbmlmb3Jtcz1mdW5jdGlvbigpe3RoaXMudGV4dHVyZUNvdW50PTE7dmFyIGE7Zm9yKHZhciBiIGluIHRoaXMudW5pZm9ybXMpe2E9dGhpcy51bmlmb3Jtc1tiXTt2YXIgYz1hLnR5cGU7XCJzYW1wbGVyMkRcIj09PWM/KGEuX2luaXQ9ITEsbnVsbCE9PWEudmFsdWUmJnRoaXMuaW5pdFNhbXBsZXIyRChhKSk6XCJtYXQyXCI9PT1jfHxcIm1hdDNcIj09PWN8fFwibWF0NFwiPT09Yz8oYS5nbE1hdHJpeD0hMCxhLmdsVmFsdWVMZW5ndGg9MSxcIm1hdDJcIj09PWM/YS5nbEZ1bmM9Z2xvYmFscy5nbC51bmlmb3JtTWF0cml4MmZ2OlwibWF0M1wiPT09Yz9hLmdsRnVuYz1nbG9iYWxzLmdsLnVuaWZvcm1NYXRyaXgzZnY6XCJtYXQ0XCI9PT1jJiYoYS5nbEZ1bmM9Z2xvYmFscy5nbC51bmlmb3JtTWF0cml4NGZ2KSk6KGEuZ2xGdW5jPWdsb2JhbHMuZ2xbXCJ1bmlmb3JtXCIrY10sYS5nbFZhbHVlTGVuZ3RoPVwiMmZcIj09PWN8fFwiMmlcIj09PWM/MjpcIjNmXCI9PT1jfHxcIjNpXCI9PT1jPzM6XCI0ZlwiPT09Y3x8XCI0aVwiPT09Yz80OjEpfX0scHJvdG8uaW5pdFNhbXBsZXIyRD1mdW5jdGlvbihhKXtpZihhLnZhbHVlJiZhLnZhbHVlLmJhc2VUZXh0dXJlJiZhLnZhbHVlLmJhc2VUZXh0dXJlLmhhc0xvYWRlZCl7aWYoZ2xvYmFscy5nbC5hY3RpdmVUZXh0dXJlKGdsb2JhbHMuZ2xbXCJURVhUVVJFXCIrdGhpcy50ZXh0dXJlQ291bnRdKSxnbG9iYWxzLmdsLmJpbmRUZXh0dXJlKGdsb2JhbHMuZ2wuVEVYVFVSRV8yRCxhLnZhbHVlLmJhc2VUZXh0dXJlLl9nbFRleHR1cmUpLGEudGV4dHVyZURhdGEpe3ZhciBiPWEudGV4dHVyZURhdGEsYz1iLm1hZ0ZpbHRlcj9iLm1hZ0ZpbHRlcjpnbG9iYWxzLmdsLkxJTkVBUixkPWIubWluRmlsdGVyP2IubWluRmlsdGVyOmdsb2JhbHMuZ2wuTElORUFSLGU9Yi53cmFwUz9iLndyYXBTOmdsb2JhbHMuZ2wuQ0xBTVBfVE9fRURHRSxmPWIud3JhcFQ/Yi53cmFwVDpnbG9iYWxzLmdsLkNMQU1QX1RPX0VER0UsZz1iLmx1bWluYW5jZT9nbG9iYWxzLmdsLkxVTUlOQU5DRTpnbG9iYWxzLmdsLlJHQkE7aWYoYi5yZXBlYXQmJihlPWdsb2JhbHMuZ2wuUkVQRUFULGY9Z2xvYmFscy5nbC5SRVBFQVQpLGdsb2JhbHMuZ2wucGl4ZWxTdG9yZWkoZ2xvYmFscy5nbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCExKSxiLndpZHRoKXt2YXIgaD1iLndpZHRoP2Iud2lkdGg6NTEyLGk9Yi5oZWlnaHQ/Yi5oZWlnaHQ6MixqPWIuYm9yZGVyP2IuYm9yZGVyOjA7Z2xvYmFscy5nbC50ZXhJbWFnZTJEKGdsb2JhbHMuZ2wuVEVYVFVSRV8yRCwwLGcsaCxpLGosZyxnbG9iYWxzLmdsLlVOU0lHTkVEX0JZVEUsbnVsbCl9ZWxzZSBnbG9iYWxzLmdsLnRleEltYWdlMkQoZ2xvYmFscy5nbC5URVhUVVJFXzJELDAsZyxnbG9iYWxzLmdsLlJHQkEsZ2xvYmFscy5nbC5VTlNJR05FRF9CWVRFLGEudmFsdWUuYmFzZVRleHR1cmUuc291cmNlKTtnbG9iYWxzLmdsLnRleFBhcmFtZXRlcmkoZ2xvYmFscy5nbC5URVhUVVJFXzJELGdsb2JhbHMuZ2wuVEVYVFVSRV9NQUdfRklMVEVSLGMpLGdsb2JhbHMuZ2wudGV4UGFyYW1ldGVyaShnbG9iYWxzLmdsLlRFWFRVUkVfMkQsZ2xvYmFscy5nbC5URVhUVVJFX01JTl9GSUxURVIsZCksZ2xvYmFscy5nbC50ZXhQYXJhbWV0ZXJpKGdsb2JhbHMuZ2wuVEVYVFVSRV8yRCxnbG9iYWxzLmdsLlRFWFRVUkVfV1JBUF9TLGUpLGdsb2JhbHMuZ2wudGV4UGFyYW1ldGVyaShnbG9iYWxzLmdsLlRFWFRVUkVfMkQsZ2xvYmFscy5nbC5URVhUVVJFX1dSQVBfVCxmKX1nbG9iYWxzLmdsLnVuaWZvcm0xaShhLnVuaWZvcm1Mb2NhdGlvbix0aGlzLnRleHR1cmVDb3VudCksYS5faW5pdD0hMCx0aGlzLnRleHR1cmVDb3VudCsrfX0scHJvdG8uc3luY1VuaWZvcm1zPWZ1bmN0aW9uKCl7dGhpcy50ZXh0dXJlQ291bnQ9MTt2YXIgYTtmb3IodmFyIGIgaW4gdGhpcy51bmlmb3JtcylhPXRoaXMudW5pZm9ybXNbYl0sMT09PWEuZ2xWYWx1ZUxlbmd0aD9hLmdsTWF0cml4PT09ITA/YS5nbEZ1bmMuY2FsbChnbG9iYWxzLmdsLGEudW5pZm9ybUxvY2F0aW9uLGEudHJhbnNwb3NlLGEudmFsdWUpOmEuZ2xGdW5jLmNhbGwoZ2xvYmFscy5nbCxhLnVuaWZvcm1Mb2NhdGlvbixhLnZhbHVlKToyPT09YS5nbFZhbHVlTGVuZ3RoP2EuZ2xGdW5jLmNhbGwoZ2xvYmFscy5nbCxhLnVuaWZvcm1Mb2NhdGlvbixhLnZhbHVlLngsYS52YWx1ZS55KTozPT09YS5nbFZhbHVlTGVuZ3RoP2EuZ2xGdW5jLmNhbGwoZ2xvYmFscy5nbCxhLnVuaWZvcm1Mb2NhdGlvbixhLnZhbHVlLngsYS52YWx1ZS55LGEudmFsdWUueik6ND09PWEuZ2xWYWx1ZUxlbmd0aD9hLmdsRnVuYy5jYWxsKGdsb2JhbHMuZ2wsYS51bmlmb3JtTG9jYXRpb24sYS52YWx1ZS54LGEudmFsdWUueSxhLnZhbHVlLnosYS52YWx1ZS53KTpcInNhbXBsZXIyRFwiPT09YS50eXBlJiYoYS5faW5pdD8oZ2xvYmFscy5nbC5hY3RpdmVUZXh0dXJlKGdsb2JhbHMuZ2xbXCJURVhUVVJFXCIrdGhpcy50ZXh0dXJlQ291bnRdKSxnbG9iYWxzLmdsLmJpbmRUZXh0dXJlKGdsb2JhbHMuZ2wuVEVYVFVSRV8yRCxhLnZhbHVlLmJhc2VUZXh0dXJlLl9nbFRleHR1cmUpLGdsb2JhbHMuZ2wudW5pZm9ybTFpKGEudW5pZm9ybUxvY2F0aW9uLHRoaXMudGV4dHVyZUNvdW50KSx0aGlzLnRleHR1cmVDb3VudCsrKTp0aGlzLmluaXRTYW1wbGVyMkQoYSkpfSxQaXhpU2hhZGVyLmRlZmF1bHRWZXJ0ZXhTcmM9W1wiYXR0cmlidXRlIHZlYzIgYVZlcnRleFBvc2l0aW9uO1wiLFwiYXR0cmlidXRlIHZlYzIgYVRleHR1cmVDb29yZDtcIixcImF0dHJpYnV0ZSBmbG9hdCBhQ29sb3I7XCIsXCJ1bmlmb3JtIHZlYzIgcHJvamVjdGlvblZlY3RvcjtcIixcInVuaWZvcm0gdmVjMiBvZmZzZXRWZWN0b3I7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwiY29uc3QgdmVjMiBjZW50ZXIgPSB2ZWMyKC0xLjAsIDEuMCk7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgZ2xfUG9zaXRpb24gPSB2ZWM0KCAoKGFWZXJ0ZXhQb3NpdGlvbiArIG9mZnNldFZlY3RvcikgLyBwcm9qZWN0aW9uVmVjdG9yKSArIGNlbnRlciAsIDAuMCwgMS4wKTtcIixcIiAgIHZUZXh0dXJlQ29vcmQgPSBhVGV4dHVyZUNvb3JkO1wiLFwiICAgdkNvbG9yID0gYUNvbG9yO1wiLFwifVwiXSxtb2R1bGUuZXhwb3J0cz1QaXhpU2hhZGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFByaW1pdGl2ZVNoYWRlcigpe3RoaXMucHJvZ3JhbT1udWxsLHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzQgdkNvbG9yO1wiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IHZDb2xvcjtcIixcIn1cIl0sdGhpcy52ZXJ0ZXhTcmM9W1wiYXR0cmlidXRlIHZlYzIgYVZlcnRleFBvc2l0aW9uO1wiLFwiYXR0cmlidXRlIHZlYzQgYUNvbG9yO1wiLFwidW5pZm9ybSBtYXQzIHRyYW5zbGF0aW9uTWF0cml4O1wiLFwidW5pZm9ybSB2ZWMyIHByb2plY3Rpb25WZWN0b3I7XCIsXCJ1bmlmb3JtIHZlYzIgb2Zmc2V0VmVjdG9yO1wiLFwidW5pZm9ybSBmbG9hdCBhbHBoYTtcIixcInZhcnlpbmcgdmVjNCB2Q29sb3I7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgdmVjMyB2ID0gdHJhbnNsYXRpb25NYXRyaXggKiB2ZWMzKGFWZXJ0ZXhQb3NpdGlvbiAsIDEuMCk7XCIsXCIgICB2IC09IG9mZnNldFZlY3Rvci54eXg7XCIsXCIgICBnbF9Qb3NpdGlvbiA9IHZlYzQoIHYueCAvIHByb2plY3Rpb25WZWN0b3IueCAtMS4wLCB2LnkgLyAtcHJvamVjdGlvblZlY3Rvci55ICsgMS4wICwgMC4wLCAxLjApO1wiLFwiICAgdkNvbG9yID0gYUNvbG9yICAqIGFscGhhO1wiLFwifVwiXX12YXIgY29tcGlsZT1yZXF1aXJlKFwiLi9jb21waWxlXCIpLGdsb2JhbHM9cmVxdWlyZShcIi4uLy4uL2NvcmUvZ2xvYmFsc1wiKTtQcmltaXRpdmVTaGFkZXIucHJvdG90eXBlLmluaXQ9ZnVuY3Rpb24oKXt2YXIgYT1nbG9iYWxzLmdsLGI9Y29tcGlsZS5wcm9ncmFtKGEsdGhpcy52ZXJ0ZXhTcmMsdGhpcy5mcmFnbWVudFNyYyk7YS51c2VQcm9ncmFtKGIpLHRoaXMucHJvamVjdGlvblZlY3Rvcj1hLmdldFVuaWZvcm1Mb2NhdGlvbihiLFwicHJvamVjdGlvblZlY3RvclwiKSx0aGlzLm9mZnNldFZlY3Rvcj1hLmdldFVuaWZvcm1Mb2NhdGlvbihiLFwib2Zmc2V0VmVjdG9yXCIpLHRoaXMuYVZlcnRleFBvc2l0aW9uPWEuZ2V0QXR0cmliTG9jYXRpb24oYixcImFWZXJ0ZXhQb3NpdGlvblwiKSx0aGlzLmNvbG9yQXR0cmlidXRlPWEuZ2V0QXR0cmliTG9jYXRpb24oYixcImFDb2xvclwiKSx0aGlzLnRyYW5zbGF0aW9uTWF0cml4PWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJ0cmFuc2xhdGlvbk1hdHJpeFwiKSx0aGlzLmFscGhhPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJhbHBoYVwiKSx0aGlzLnByb2dyYW09Yn0sbW9kdWxlLmV4cG9ydHM9UHJpbWl0aXZlU2hhZGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFN0cmlwU2hhZGVyKCl7dGhpcy5wcm9ncmFtPW51bGwsdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIGZsb2F0IGFscGhhO1wiLFwidW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCwgdlRleHR1cmVDb29yZC55KSk7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSBnbF9GcmFnQ29sb3IgKiBhbHBoYTtcIixcIn1cIl0sdGhpcy52ZXJ0ZXhTcmM9W1wiYXR0cmlidXRlIHZlYzIgYVZlcnRleFBvc2l0aW9uO1wiLFwiYXR0cmlidXRlIHZlYzIgYVRleHR1cmVDb29yZDtcIixcImF0dHJpYnV0ZSBmbG9hdCBhQ29sb3I7XCIsXCJ1bmlmb3JtIG1hdDMgdHJhbnNsYXRpb25NYXRyaXg7XCIsXCJ1bmlmb3JtIHZlYzIgcHJvamVjdGlvblZlY3RvcjtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyB2ZWMyIG9mZnNldFZlY3RvcjtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgIHZlYzMgdiA9IHRyYW5zbGF0aW9uTWF0cml4ICogdmVjMyhhVmVydGV4UG9zaXRpb24sIDEuMCk7XCIsXCIgICB2IC09IG9mZnNldFZlY3Rvci54eXg7XCIsXCIgICBnbF9Qb3NpdGlvbiA9IHZlYzQoIHYueCAvIHByb2plY3Rpb25WZWN0b3IueCAtMS4wLCB2LnkgLyBwcm9qZWN0aW9uVmVjdG9yLnkgKyAxLjAgLCAwLjAsIDEuMCk7XCIsXCIgICB2VGV4dHVyZUNvb3JkID0gYVRleHR1cmVDb29yZDtcIixcIiAgIHZDb2xvciA9IGFDb2xvcjtcIixcIn1cIl19dmFyIGNvbXBpbGU9cmVxdWlyZShcIi4vY29tcGlsZVwiKSxnbG9iYWxzPXJlcXVpcmUoXCIuLi8uLi9jb3JlL2dsb2JhbHNcIik7U3RyaXBTaGFkZXIucHJvdG90eXBlLmluaXQ9ZnVuY3Rpb24oKXt2YXIgYT1nbG9iYWxzLmdsLGI9Y29tcGlsZS5wcm9ncmFtKGEsdGhpcy52ZXJ0ZXhTcmMsdGhpcy5mcmFnbWVudFNyYyk7YS51c2VQcm9ncmFtKGIpLHRoaXMudVNhbXBsZXI9YS5nZXRVbmlmb3JtTG9jYXRpb24oYixcInVTYW1wbGVyXCIpLHRoaXMucHJvamVjdGlvblZlY3Rvcj1hLmdldFVuaWZvcm1Mb2NhdGlvbihiLFwicHJvamVjdGlvblZlY3RvclwiKSx0aGlzLm9mZnNldFZlY3Rvcj1hLmdldFVuaWZvcm1Mb2NhdGlvbihiLFwib2Zmc2V0VmVjdG9yXCIpLHRoaXMuY29sb3JBdHRyaWJ1dGU9YS5nZXRBdHRyaWJMb2NhdGlvbihiLFwiYUNvbG9yXCIpLHRoaXMuYVZlcnRleFBvc2l0aW9uPWEuZ2V0QXR0cmliTG9jYXRpb24oYixcImFWZXJ0ZXhQb3NpdGlvblwiKSx0aGlzLmFUZXh0dXJlQ29vcmQ9YS5nZXRBdHRyaWJMb2NhdGlvbihiLFwiYVRleHR1cmVDb29yZFwiKSx0aGlzLnRyYW5zbGF0aW9uTWF0cml4PWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJ0cmFuc2xhdGlvbk1hdHJpeFwiKSx0aGlzLmFscGhhPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJhbHBoYVwiKSx0aGlzLnByb2dyYW09Yn0sbW9kdWxlLmV4cG9ydHM9U3RyaXBTaGFkZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gV2ViR0xCYXRjaChhKXt0aGlzLmdsPWEsdGhpcy5zaXplPTAsdGhpcy52ZXJ0ZXhCdWZmZXI9YS5jcmVhdGVCdWZmZXIoKSx0aGlzLmluZGV4QnVmZmVyPWEuY3JlYXRlQnVmZmVyKCksdGhpcy51dkJ1ZmZlcj1hLmNyZWF0ZUJ1ZmZlcigpLHRoaXMuY29sb3JCdWZmZXI9YS5jcmVhdGVCdWZmZXIoKSx0aGlzLmJsZW5kTW9kZT1ibGVuZE1vZGVzLk5PUk1BTCx0aGlzLmR5bmFtaWNTaXplPTF9dmFyIGdsb2JhbHM9cmVxdWlyZShcIi4uLy4uL2NvcmUvZ2xvYmFsc1wiKSxibGVuZE1vZGVzPXJlcXVpcmUoXCIuLi8uLi9kaXNwbGF5L2JsZW5kTW9kZXNcIikscHJvdG89V2ViR0xCYXRjaC5wcm90b3R5cGU7cHJvdG8uY2xlYW49ZnVuY3Rpb24oKXt0aGlzLnZlcnRpY2llcz1bXSx0aGlzLnV2cz1bXSx0aGlzLmluZGljZXM9W10sdGhpcy5jb2xvcnM9W10sdGhpcy5keW5hbWljU2l6ZT0xLHRoaXMudGV4dHVyZT1udWxsLHRoaXMubGFzdD1udWxsLHRoaXMuc2l6ZT0wLHRoaXMuaGVhZD1udWxsLHRoaXMudGFpbD1udWxsfSxwcm90by5yZXN0b3JlTG9zdENvbnRleHQ9ZnVuY3Rpb24oYSl7dGhpcy5nbD1hLHRoaXMudmVydGV4QnVmZmVyPWEuY3JlYXRlQnVmZmVyKCksdGhpcy5pbmRleEJ1ZmZlcj1hLmNyZWF0ZUJ1ZmZlcigpLHRoaXMudXZCdWZmZXI9YS5jcmVhdGVCdWZmZXIoKSx0aGlzLmNvbG9yQnVmZmVyPWEuY3JlYXRlQnVmZmVyKCl9LHByb3RvLmluaXQ9ZnVuY3Rpb24oYSl7YS5iYXRjaD10aGlzLHRoaXMuZGlydHk9ITAsdGhpcy5ibGVuZE1vZGU9YS5ibGVuZE1vZGUsdGhpcy50ZXh0dXJlPWEudGV4dHVyZS5iYXNlVGV4dHVyZSx0aGlzLmhlYWQ9YSx0aGlzLnRhaWw9YSx0aGlzLnNpemU9MSx0aGlzLmdyb3dCYXRjaCgpfSxwcm90by5pbnNlcnRCZWZvcmU9ZnVuY3Rpb24oYSxiKXt0aGlzLnNpemUrKyxhLmJhdGNoPXRoaXMsdGhpcy5kaXJ0eT0hMDt2YXIgYz1iLl9fcHJldjtiLl9fcHJldj1hLGEuX19uZXh0PWIsYz8oYS5fX3ByZXY9YyxjLl9fbmV4dD1hKTp0aGlzLmhlYWQ9YX0scHJvdG8uaW5zZXJ0QWZ0ZXI9ZnVuY3Rpb24oYSxiKXt0aGlzLnNpemUrKyxhLmJhdGNoPXRoaXMsdGhpcy5kaXJ0eT0hMDt2YXIgYz1iLl9fbmV4dDtiLl9fbmV4dD1hLGEuX19wcmV2PWIsYz8oYS5fX25leHQ9YyxjLl9fcHJldj1hKTp0aGlzLnRhaWw9YX0scHJvdG8ucmVtb3ZlPWZ1bmN0aW9uKGEpe3JldHVybiB0aGlzLnNpemUtLSx0aGlzLnNpemU/KGEuX19wcmV2P2EuX19wcmV2Ll9fbmV4dD1hLl9fbmV4dDoodGhpcy5oZWFkPWEuX19uZXh0LHRoaXMuaGVhZC5fX3ByZXY9bnVsbCksYS5fX25leHQ/YS5fX25leHQuX19wcmV2PWEuX19wcmV2Oih0aGlzLnRhaWw9YS5fX3ByZXYsdGhpcy50YWlsLl9fbmV4dD1udWxsKSxhLmJhdGNoPW51bGwsYS5fX25leHQ9bnVsbCxhLl9fcHJldj1udWxsLHRoaXMuZGlydHk9ITAsdm9pZCAwKTooYS5iYXRjaD1udWxsLGEuX19wcmV2PW51bGwsYS5fX25leHQ9bnVsbCx2b2lkIDApfSxwcm90by5zcGxpdD1mdW5jdGlvbihhKXt0aGlzLmRpcnR5PSEwO3ZhciBiPW5ldyBXZWJHTEJhdGNoKHRoaXMuZ2wpO2IuaW5pdChhKSxiLnRleHR1cmU9dGhpcy50ZXh0dXJlLGIudGFpbD10aGlzLnRhaWwsdGhpcy50YWlsPWEuX19wcmV2LHRoaXMudGFpbC5fX25leHQ9bnVsbCxhLl9fcHJldj1udWxsO2Zvcih2YXIgYz0wO2E7KWMrKyxhLmJhdGNoPWIsYT1hLl9fbmV4dDtyZXR1cm4gYi5zaXplPWMsdGhpcy5zaXplLT1jLGJ9LHByb3RvLm1lcmdlPWZ1bmN0aW9uKGEpe3RoaXMuZGlydHk9ITAsdGhpcy50YWlsLl9fbmV4dD1hLmhlYWQsYS5oZWFkLl9fcHJldj10aGlzLnRhaWwsdGhpcy5zaXplKz1hLnNpemUsdGhpcy50YWlsPWEudGFpbDtmb3IodmFyIGI9YS5oZWFkO2I7KWIuYmF0Y2g9dGhpcyxiPWIuX19uZXh0fSxwcm90by5ncm93QmF0Y2g9ZnVuY3Rpb24oKXt2YXIgYT10aGlzLmdsO3RoaXMuZHluYW1pY1NpemU9MT09PXRoaXMuc2l6ZT8xOjEuNSp0aGlzLnNpemUsdGhpcy52ZXJ0aWNpZXM9bmV3IEZsb2F0MzJBcnJheSg4KnRoaXMuZHluYW1pY1NpemUpLGEuYmluZEJ1ZmZlcihhLkFSUkFZX0JVRkZFUix0aGlzLnZlcnRleEJ1ZmZlciksYS5idWZmZXJEYXRhKGEuQVJSQVlfQlVGRkVSLHRoaXMudmVydGljaWVzLGEuRFlOQU1JQ19EUkFXKSx0aGlzLnV2cz1uZXcgRmxvYXQzMkFycmF5KDgqdGhpcy5keW5hbWljU2l6ZSksYS5iaW5kQnVmZmVyKGEuQVJSQVlfQlVGRkVSLHRoaXMudXZCdWZmZXIpLGEuYnVmZmVyRGF0YShhLkFSUkFZX0JVRkZFUix0aGlzLnV2cyxhLkRZTkFNSUNfRFJBVyksdGhpcy5kaXJ0eVVWUz0hMCx0aGlzLmNvbG9ycz1uZXcgRmxvYXQzMkFycmF5KDQqdGhpcy5keW5hbWljU2l6ZSksYS5iaW5kQnVmZmVyKGEuQVJSQVlfQlVGRkVSLHRoaXMuY29sb3JCdWZmZXIpLGEuYnVmZmVyRGF0YShhLkFSUkFZX0JVRkZFUix0aGlzLmNvbG9ycyxhLkRZTkFNSUNfRFJBVyksdGhpcy5kaXJ0eUNvbG9ycz0hMCx0aGlzLmluZGljZXM9bmV3IFVpbnQxNkFycmF5KDYqdGhpcy5keW5hbWljU2l6ZSk7Zm9yKHZhciBiPTAsYz10aGlzLmluZGljZXMubGVuZ3RoLzY7Yz5iO2IrKyl7dmFyIGQ9NipiLGU9NCpiO3RoaXMuaW5kaWNlc1tkKzBdPWUrMCx0aGlzLmluZGljZXNbZCsxXT1lKzEsdGhpcy5pbmRpY2VzW2QrMl09ZSsyLHRoaXMuaW5kaWNlc1tkKzNdPWUrMCx0aGlzLmluZGljZXNbZCs0XT1lKzIsdGhpcy5pbmRpY2VzW2QrNV09ZSszfWEuYmluZEJ1ZmZlcihhLkVMRU1FTlRfQVJSQVlfQlVGRkVSLHRoaXMuaW5kZXhCdWZmZXIpLGEuYnVmZmVyRGF0YShhLkVMRU1FTlRfQVJSQVlfQlVGRkVSLHRoaXMuaW5kaWNlcyxhLlNUQVRJQ19EUkFXKX0scHJvdG8ucmVmcmVzaD1mdW5jdGlvbigpe3RoaXMuZHluYW1pY1NpemU8dGhpcy5zaXplJiZ0aGlzLmdyb3dCYXRjaCgpO2Zvcih2YXIgYSxiLGM9MCxkPXRoaXMuaGVhZDtkOyl7YT04KmM7dmFyIGU9ZC50ZXh0dXJlLGY9ZS5mcmFtZSxnPWUuYmFzZVRleHR1cmUud2lkdGgsaD1lLmJhc2VUZXh0dXJlLmhlaWdodDt0aGlzLnV2c1thKzBdPWYueC9nLHRoaXMudXZzW2ErMV09Zi55L2gsdGhpcy51dnNbYSsyXT0oZi54K2Yud2lkdGgpL2csdGhpcy51dnNbYSszXT1mLnkvaCx0aGlzLnV2c1thKzRdPShmLngrZi53aWR0aCkvZyx0aGlzLnV2c1thKzVdPShmLnkrZi5oZWlnaHQpL2gsdGhpcy51dnNbYSs2XT1mLngvZyx0aGlzLnV2c1thKzddPShmLnkrZi5oZWlnaHQpL2gsZC51cGRhdGVGcmFtZT0hMSxiPTQqYyx0aGlzLmNvbG9yc1tiXT10aGlzLmNvbG9yc1tiKzFdPXRoaXMuY29sb3JzW2IrMl09dGhpcy5jb2xvcnNbYiszXT1kLndvcmxkQWxwaGEsZD1kLl9fbmV4dCxjKyt9dGhpcy5kaXJ0eVVWUz0hMCx0aGlzLmRpcnR5Q29sb3JzPSEwfSxwcm90by51cGRhdGU9ZnVuY3Rpb24oKXtmb3IodmFyIGEsYixjLGQsZSxmLGcsaCxpLGosayxsLG0sbixvLHAscT0wLHI9dGhpcy5oZWFkLHM9dGhpcy52ZXJ0aWNpZXMsdD10aGlzLnV2cyx1PXRoaXMuY29sb3JzO3I7KXtpZihyLnZjb3VudD09PWdsb2JhbHMudmlzaWJsZUNvdW50KXtpZihiPXIudGV4dHVyZS5mcmFtZS53aWR0aCxjPXIudGV4dHVyZS5mcmFtZS5oZWlnaHQsZD1yLmFuY2hvci54LGU9ci5hbmNob3IueSxmPWIqKDEtZCksZz1iKi1kLGg9YyooMS1lKSxpPWMqLWUsaj04KnEsYT1yLndvcmxkVHJhbnNmb3JtLGs9YVswXSxsPWFbM10sbT1hWzFdLG49YVs0XSxvPWFbMl0scD1hWzVdLHNbaiswXT1rKmcrbSppK28sc1tqKzFdPW4qaStsKmcrcCxzW2orMl09aypmK20qaStvLHNbaiszXT1uKmkrbCpmK3Asc1tqKzRdPWsqZittKmgrbyxzW2orNV09bipoK2wqZitwLHNbais2XT1rKmcrbSpoK28sc1tqKzddPW4qaCtsKmcrcCxyLnVwZGF0ZUZyYW1lfHxyLnRleHR1cmUudXBkYXRlRnJhbWUpe3RoaXMuZGlydHlVVlM9ITA7dmFyIHY9ci50ZXh0dXJlLHc9di5mcmFtZSx4PXYuYmFzZVRleHR1cmUud2lkdGgseT12LmJhc2VUZXh0dXJlLmhlaWdodDt0W2orMF09dy54L3gsdFtqKzFdPXcueS95LHRbaisyXT0ody54K3cud2lkdGgpL3gsdFtqKzNdPXcueS95LHRbais0XT0ody54K3cud2lkdGgpL3gsdFtqKzVdPSh3Lnkrdy5oZWlnaHQpL3ksdFtqKzZdPXcueC94LHRbais3XT0ody55K3cuaGVpZ2h0KS95LHIudXBkYXRlRnJhbWU9ITF9aWYoci5jYWNoZUFscGhhIT09ci53b3JsZEFscGhhKXtyLmNhY2hlQWxwaGE9ci53b3JsZEFscGhhO3ZhciB6PTQqcTt1W3pdPXVbeisxXT11W3orMl09dVt6KzNdPXIud29ybGRBbHBoYSx0aGlzLmRpcnR5Q29sb3JzPSEwfX1lbHNlIGo9OCpxLHNbaiswXT1zW2orMV09c1tqKzJdPXNbaiszXT1zW2orNF09c1tqKzVdPXNbais2XT1zW2orN109MDtxKysscj1yLl9fbmV4dH19LHByb3RvLnJlbmRlcj1mdW5jdGlvbihhLGIpe2lmKGE9YXx8MCxhcmd1bWVudHMubGVuZ3RoPDImJihiPXRoaXMuc2l6ZSksdGhpcy5kaXJ0eSYmKHRoaXMucmVmcmVzaCgpLHRoaXMuZGlydHk9ITEpLHRoaXMuc2l6ZSl7dGhpcy51cGRhdGUoKTt2YXIgYz10aGlzLmdsLGQ9Z2xvYmFscy5kZWZhdWx0U2hhZGVyO2MuYmluZEJ1ZmZlcihjLkFSUkFZX0JVRkZFUix0aGlzLnZlcnRleEJ1ZmZlciksYy5idWZmZXJTdWJEYXRhKGMuQVJSQVlfQlVGRkVSLDAsdGhpcy52ZXJ0aWNpZXMpLGMudmVydGV4QXR0cmliUG9pbnRlcihkLmFWZXJ0ZXhQb3NpdGlvbiwyLGMuRkxPQVQsITEsMCwwKSxjLmJpbmRCdWZmZXIoYy5BUlJBWV9CVUZGRVIsdGhpcy51dkJ1ZmZlciksdGhpcy5kaXJ0eVVWUyYmKHRoaXMuZGlydHlVVlM9ITEsYy5idWZmZXJTdWJEYXRhKGMuQVJSQVlfQlVGRkVSLDAsdGhpcy51dnMpKSxjLnZlcnRleEF0dHJpYlBvaW50ZXIoZC5hVGV4dHVyZUNvb3JkLDIsYy5GTE9BVCwhMSwwLDApLGMuYWN0aXZlVGV4dHVyZShjLlRFWFRVUkUwKSxjLmJpbmRUZXh0dXJlKGMuVEVYVFVSRV8yRCx0aGlzLnRleHR1cmUuX2dsVGV4dHVyZSksYy5iaW5kQnVmZmVyKGMuQVJSQVlfQlVGRkVSLHRoaXMuY29sb3JCdWZmZXIpLHRoaXMuZGlydHlDb2xvcnMmJih0aGlzLmRpcnR5Q29sb3JzPSExLGMuYnVmZmVyU3ViRGF0YShjLkFSUkFZX0JVRkZFUiwwLHRoaXMuY29sb3JzKSksYy52ZXJ0ZXhBdHRyaWJQb2ludGVyKGQuY29sb3JBdHRyaWJ1dGUsMSxjLkZMT0FULCExLDAsMCksYy5iaW5kQnVmZmVyKGMuRUxFTUVOVF9BUlJBWV9CVUZGRVIsdGhpcy5pbmRleEJ1ZmZlcik7dmFyIGU9Yi1hO2MuZHJhd0VsZW1lbnRzKGMuVFJJQU5HTEVTLDYqZSxjLlVOU0lHTkVEX1NIT1JULDIqYSo2KX19O3ZhciBiYXRjaGVzPVtdO1dlYkdMQmF0Y2gucmVzdG9yZUJhdGNoZXM9ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPTAsYz1iYXRjaGVzLmxlbmd0aDtjPmI7YisrKWJhdGNoZXNbYl0ucmVzdG9yZUxvc3RDb250ZXh0KGEpfSxXZWJHTEJhdGNoLmdldEJhdGNoPWZ1bmN0aW9uKCl7cmV0dXJuIGJhdGNoZXMubGVuZ3RoP2JhdGNoZXMucG9wKCk6bmV3IFdlYkdMQmF0Y2goZ2xvYmFscy5nbCl9LFdlYkdMQmF0Y2gucmV0dXJuQmF0Y2g9ZnVuY3Rpb24oYSl7YS5jbGVhbigpLGJhdGNoZXMucHVzaChhKX0sbW9kdWxlLmV4cG9ydHM9V2ViR0xCYXRjaDsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBGaWx0ZXJUZXh0dXJlKGEsYil7dmFyIGM9Z2xvYmFscy5nbDt0aGlzLmZyYW1lQnVmZmVyPWMuY3JlYXRlRnJhbWVidWZmZXIoKSx0aGlzLnRleHR1cmU9Yy5jcmVhdGVUZXh0dXJlKCksYy5iaW5kVGV4dHVyZShjLlRFWFRVUkVfMkQsdGhpcy50ZXh0dXJlKSxjLnRleFBhcmFtZXRlcmkoYy5URVhUVVJFXzJELGMuVEVYVFVSRV9NQUdfRklMVEVSLGMuTElORUFSKSxjLnRleFBhcmFtZXRlcmkoYy5URVhUVVJFXzJELGMuVEVYVFVSRV9NSU5fRklMVEVSLGMuTElORUFSKSxjLnRleFBhcmFtZXRlcmkoYy5URVhUVVJFXzJELGMuVEVYVFVSRV9XUkFQX1MsYy5DTEFNUF9UT19FREdFKSxjLnRleFBhcmFtZXRlcmkoYy5URVhUVVJFXzJELGMuVEVYVFVSRV9XUkFQX1QsYy5DTEFNUF9UT19FREdFKSxjLmJpbmRGcmFtZWJ1ZmZlcihjLkZSQU1FQlVGRkVSLHRoaXMuZnJhbWVidWZmZXIpLGMuYmluZEZyYW1lYnVmZmVyKGMuRlJBTUVCVUZGRVIsdGhpcy5mcmFtZUJ1ZmZlciksYy5mcmFtZWJ1ZmZlclRleHR1cmUyRChjLkZSQU1FQlVGRkVSLGMuQ09MT1JfQVRUQUNITUVOVDAsYy5URVhUVVJFXzJELHRoaXMudGV4dHVyZSwwKSx0aGlzLnJlc2l6ZShhLGIpfWZ1bmN0aW9uIFdlYkdMRmlsdGVyTWFuYWdlcihhKXt0aGlzLnRyYW5zcGFyZW50PWEsdGhpcy5maWx0ZXJTdGFjaz1bXSx0aGlzLnRleHR1cmVQb29sPVtdLHRoaXMub2Zmc2V0WD0wLHRoaXMub2Zmc2V0WT0wLHRoaXMuaW5pdFNoYWRlckJ1ZmZlcnMoKX12YXIgZ2xvYmFscz1yZXF1aXJlKFwiLi4vLi4vY29yZS9nbG9iYWxzXCIpLFNwcml0ZT1yZXF1aXJlKFwiLi4vLi4vZGlzcGxheS9TcHJpdGVcIiksR3JhcGhpY3M9cmVxdWlyZShcIi4uLy4uL3ByaW1pdGl2ZXMvR3JhcGhpY3NcIiksUGl4aVNoYWRlcj1yZXF1aXJlKFwiLi9QaXhpU2hhZGVyXCIpO0ZpbHRlclRleHR1cmUucHJvdG90eXBlLnJlc2l6ZT1mdW5jdGlvbihhLGIpe2lmKHRoaXMud2lkdGghPT1hfHx0aGlzLmhlaWdodCE9PWIpe3RoaXMud2lkdGg9YSx0aGlzLmhlaWdodD1iO3ZhciBjPWdsb2JhbHMuZ2w7Yy5iaW5kVGV4dHVyZShjLlRFWFRVUkVfMkQsdGhpcy50ZXh0dXJlKSxjLnRleEltYWdlMkQoYy5URVhUVVJFXzJELDAsYy5SR0JBLGEsYiwwLGMuUkdCQSxjLlVOU0lHTkVEX0JZVEUsbnVsbCl9fTt2YXIgcHJvdG89V2ViR0xGaWx0ZXJNYW5hZ2VyLnByb3RvdHlwZTtwcm90by5iZWdpbj1mdW5jdGlvbihhLGIpe3RoaXMud2lkdGg9MiphLngsdGhpcy5oZWlnaHQ9MiotYS55LHRoaXMuYnVmZmVyPWJ9LHByb3RvLnB1c2hGaWx0ZXI9ZnVuY3Rpb24oYSl7dmFyIGI9Z2xvYmFscy5nbDt0aGlzLmZpbHRlclN0YWNrLnB1c2goYSk7dmFyIGM9YS5maWx0ZXJQYXNzZXNbMF07dGhpcy5vZmZzZXRYKz1hLnRhcmdldC5maWx0ZXJBcmVhLngsdGhpcy5vZmZzZXRZKz1hLnRhcmdldC5maWx0ZXJBcmVhLnk7dmFyIGQ9dGhpcy50ZXh0dXJlUG9vbC5wb3AoKTtkP2QucmVzaXplKHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpOmQ9bmV3IEZpbHRlclRleHR1cmUodGhpcy53aWR0aCx0aGlzLmhlaWdodCksYi5iaW5kVGV4dHVyZShiLlRFWFRVUkVfMkQsZC50ZXh0dXJlKSx0aGlzLmdldEJvdW5kcyhhLnRhcmdldCk7dmFyIGU9YS50YXJnZXQuZmlsdGVyQXJlYSxmPWMucGFkZGluZztlLngtPWYsZS55LT1mLGUud2lkdGgrPTIqZixlLmhlaWdodCs9MipmLGUueDwwJiYoZS54PTApLGUud2lkdGg+dGhpcy53aWR0aCYmKGUud2lkdGg9dGhpcy53aWR0aCksZS55PDAmJihlLnk9MCksZS5oZWlnaHQ+dGhpcy5oZWlnaHQmJihlLmhlaWdodD10aGlzLmhlaWdodCksYi5iaW5kRnJhbWVidWZmZXIoYi5GUkFNRUJVRkZFUixkLmZyYW1lQnVmZmVyKSxiLnZpZXdwb3J0KDAsMCxlLndpZHRoLGUuaGVpZ2h0KSxnbG9iYWxzLnByb2plY3Rpb24ueD1lLndpZHRoLzIsZ2xvYmFscy5wcm9qZWN0aW9uLnk9LWUuaGVpZ2h0LzIsZ2xvYmFscy5vZmZzZXQueD0tZS54LGdsb2JhbHMub2Zmc2V0Lnk9LWUueSxiLnVuaWZvcm0yZihnbG9iYWxzLmRlZmF1bHRTaGFkZXIucHJvamVjdGlvblZlY3RvcixlLndpZHRoLzIsLWUuaGVpZ2h0LzIpLGIudW5pZm9ybTJmKGdsb2JhbHMuZGVmYXVsdFNoYWRlci5vZmZzZXRWZWN0b3IsLWUueCwtZS55KSxiLmNvbG9yTWFzayghMCwhMCwhMCwhMCksYi5jbGVhckNvbG9yKDAsMCwwLDApLGIuY2xlYXIoYi5DT0xPUl9CVUZGRVJfQklUKSxhLl9nbEZpbHRlclRleHR1cmU9ZH0scHJvdG8ucG9wRmlsdGVyPWZ1bmN0aW9uKCl7dmFyIGE9Z2xvYmFscy5nbCxiPXRoaXMuZmlsdGVyU3RhY2sucG9wKCksYz1iLnRhcmdldC5maWx0ZXJBcmVhLGQ9Yi5fZ2xGaWx0ZXJUZXh0dXJlO2lmKGIuZmlsdGVyUGFzc2VzLmxlbmd0aD4xKXthLnZpZXdwb3J0KDAsMCxjLndpZHRoLGMuaGVpZ2h0KSxhLmJpbmRCdWZmZXIoYS5BUlJBWV9CVUZGRVIsdGhpcy52ZXJ0ZXhCdWZmZXIpLHRoaXMudmVydGV4QXJyYXlbMF09MCx0aGlzLnZlcnRleEFycmF5WzFdPWMuaGVpZ2h0LHRoaXMudmVydGV4QXJyYXlbMl09Yy53aWR0aCx0aGlzLnZlcnRleEFycmF5WzNdPWMuaGVpZ2h0LHRoaXMudmVydGV4QXJyYXlbNF09MCx0aGlzLnZlcnRleEFycmF5WzVdPTAsdGhpcy52ZXJ0ZXhBcnJheVs2XT1jLndpZHRoLHRoaXMudmVydGV4QXJyYXlbN109MCxhLmJ1ZmZlclN1YkRhdGEoYS5BUlJBWV9CVUZGRVIsMCx0aGlzLnZlcnRleEFycmF5KSxhLmJpbmRCdWZmZXIoYS5BUlJBWV9CVUZGRVIsdGhpcy51dkJ1ZmZlciksdGhpcy51dkFycmF5WzJdPWMud2lkdGgvdGhpcy53aWR0aCx0aGlzLnV2QXJyYXlbNV09Yy5oZWlnaHQvdGhpcy5oZWlnaHQsdGhpcy51dkFycmF5WzZdPWMud2lkdGgvdGhpcy53aWR0aCx0aGlzLnV2QXJyYXlbN109Yy5oZWlnaHQvdGhpcy5oZWlnaHQsYS5idWZmZXJTdWJEYXRhKGEuQVJSQVlfQlVGRkVSLDAsdGhpcy51dkFycmF5KTt2YXIgZT1kLGY9dGhpcy50ZXh0dXJlUG9vbC5wb3AoKTtmfHwoZj1uZXcgRmlsdGVyVGV4dHVyZSh0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KSksYS5iaW5kRnJhbWVidWZmZXIoYS5GUkFNRUJVRkZFUixmLmZyYW1lQnVmZmVyKSxhLmNsZWFyKGEuQ09MT1JfQlVGRkVSX0JJVCksYS5kaXNhYmxlKGEuQkxFTkQpO2Zvcih2YXIgZz0wO2c8Yi5maWx0ZXJQYXNzZXMubGVuZ3RoLTE7ZysrKXt2YXIgaD1iLmZpbHRlclBhc3Nlc1tnXTthLmJpbmRGcmFtZWJ1ZmZlcihhLkZSQU1FQlVGRkVSLGYuZnJhbWVCdWZmZXIpLGEuYWN0aXZlVGV4dHVyZShhLlRFWFRVUkUwKSxhLmJpbmRUZXh0dXJlKGEuVEVYVFVSRV8yRCxlLnRleHR1cmUpLHRoaXMuYXBwbHlGaWx0ZXJQYXNzKGgsYyxjLndpZHRoLGMuaGVpZ2h0KTt2YXIgaT1lO2U9ZixmPWl9YS5lbmFibGUoYS5CTEVORCksZD1lLHRoaXMudGV4dHVyZVBvb2wucHVzaChmKX12YXIgaj1iLmZpbHRlclBhc3Nlc1tiLmZpbHRlclBhc3Nlcy5sZW5ndGgtMV07dGhpcy5vZmZzZXRYLT1jLngsdGhpcy5vZmZzZXRZLT1jLnk7dmFyIGs9dGhpcy53aWR0aCxsPXRoaXMuaGVpZ2h0LG09MCxuPTAsbz10aGlzLmJ1ZmZlcjtpZigwPT09dGhpcy5maWx0ZXJTdGFjay5sZW5ndGgpYS5jb2xvck1hc2soITAsITAsITAsdGhpcy50cmFuc3BhcmVudCk7ZWxzZXt2YXIgcD10aGlzLmZpbHRlclN0YWNrW3RoaXMuZmlsdGVyU3RhY2subGVuZ3RoLTFdO2M9cC50YXJnZXQuZmlsdGVyQXJlYSxrPWMud2lkdGgsbD1jLmhlaWdodCxtPWMueCxuPWMueSxvPXAuX2dsRmlsdGVyVGV4dHVyZS5mcmFtZUJ1ZmZlcn1nbG9iYWxzLnByb2plY3Rpb24ueD1rLzIsZ2xvYmFscy5wcm9qZWN0aW9uLnk9LWwvMixnbG9iYWxzLm9mZnNldC54PW0sZ2xvYmFscy5vZmZzZXQueT1uLGM9Yi50YXJnZXQuZmlsdGVyQXJlYTt2YXIgcT1jLngtbSxyPWMueS1uO2EuYmluZEJ1ZmZlcihhLkFSUkFZX0JVRkZFUix0aGlzLnZlcnRleEJ1ZmZlciksdGhpcy52ZXJ0ZXhBcnJheVswXT1xLHRoaXMudmVydGV4QXJyYXlbMV09citjLmhlaWdodCx0aGlzLnZlcnRleEFycmF5WzJdPXErYy53aWR0aCx0aGlzLnZlcnRleEFycmF5WzNdPXIrYy5oZWlnaHQsdGhpcy52ZXJ0ZXhBcnJheVs0XT1xLHRoaXMudmVydGV4QXJyYXlbNV09cix0aGlzLnZlcnRleEFycmF5WzZdPXErYy53aWR0aCx0aGlzLnZlcnRleEFycmF5WzddPXIsYS5idWZmZXJTdWJEYXRhKGEuQVJSQVlfQlVGRkVSLDAsdGhpcy52ZXJ0ZXhBcnJheSksYS5iaW5kQnVmZmVyKGEuQVJSQVlfQlVGRkVSLHRoaXMudXZCdWZmZXIpLHRoaXMudXZBcnJheVsyXT1jLndpZHRoL3RoaXMud2lkdGgsdGhpcy51dkFycmF5WzVdPWMuaGVpZ2h0L3RoaXMuaGVpZ2h0LHRoaXMudXZBcnJheVs2XT1jLndpZHRoL3RoaXMud2lkdGgsdGhpcy51dkFycmF5WzddPWMuaGVpZ2h0L3RoaXMuaGVpZ2h0LGEuYnVmZmVyU3ViRGF0YShhLkFSUkFZX0JVRkZFUiwwLHRoaXMudXZBcnJheSksYS52aWV3cG9ydCgwLDAsayxsKSxhLmJpbmRGcmFtZWJ1ZmZlcihhLkZSQU1FQlVGRkVSLG8pLGEuYWN0aXZlVGV4dHVyZShhLlRFWFRVUkUwKSxhLmJpbmRUZXh0dXJlKGEuVEVYVFVSRV8yRCxkLnRleHR1cmUpLHRoaXMuYXBwbHlGaWx0ZXJQYXNzKGosYyxrLGwpLGEudXNlUHJvZ3JhbShnbG9iYWxzLmRlZmF1bHRTaGFkZXIucHJvZ3JhbSksYS51bmlmb3JtMmYoZ2xvYmFscy5kZWZhdWx0U2hhZGVyLnByb2plY3Rpb25WZWN0b3Isay8yLC1sLzIpLGEudW5pZm9ybTJmKGdsb2JhbHMuZGVmYXVsdFNoYWRlci5vZmZzZXRWZWN0b3IsLW0sLW4pLHRoaXMudGV4dHVyZVBvb2wucHVzaChkKSxiLl9nbEZpbHRlclRleHR1cmU9bnVsbH0scHJvdG8uYXBwbHlGaWx0ZXJQYXNzPWZ1bmN0aW9uKGEsYixjLGQpe3ZhciBlPWdsb2JhbHMuZ2wsZj1hLnNoYWRlcjtmfHwoZj1uZXcgUGl4aVNoYWRlcixmLmZyYWdtZW50U3JjPWEuZnJhZ21lbnRTcmMsZi51bmlmb3Jtcz1hLnVuaWZvcm1zLGYuaW5pdCgpLGEuc2hhZGVyPWYpLGUudXNlUHJvZ3JhbShmLnByb2dyYW0pLGUudW5pZm9ybTJmKGYucHJvamVjdGlvblZlY3RvcixjLzIsLWQvMiksZS51bmlmb3JtMmYoZi5vZmZzZXRWZWN0b3IsMCwwKSxhLnVuaWZvcm1zLmRpbWVuc2lvbnMmJihhLnVuaWZvcm1zLmRpbWVuc2lvbnMudmFsdWVbMF09dGhpcy53aWR0aCxhLnVuaWZvcm1zLmRpbWVuc2lvbnMudmFsdWVbMV09dGhpcy5oZWlnaHQsYS51bmlmb3Jtcy5kaW1lbnNpb25zLnZhbHVlWzJdPXRoaXMudmVydGV4QXJyYXlbMF0sYS51bmlmb3Jtcy5kaW1lbnNpb25zLnZhbHVlWzNdPXRoaXMudmVydGV4QXJyYXlbNV0pLGYuc3luY1VuaWZvcm1zKCksZS5iaW5kQnVmZmVyKGUuQVJSQVlfQlVGRkVSLHRoaXMudmVydGV4QnVmZmVyKSxlLnZlcnRleEF0dHJpYlBvaW50ZXIoZi5hVmVydGV4UG9zaXRpb24sMixlLkZMT0FULCExLDAsMCksZS5iaW5kQnVmZmVyKGUuQVJSQVlfQlVGRkVSLHRoaXMudXZCdWZmZXIpLGUudmVydGV4QXR0cmliUG9pbnRlcihmLmFUZXh0dXJlQ29vcmQsMixlLkZMT0FULCExLDAsMCksZS5iaW5kQnVmZmVyKGUuRUxFTUVOVF9BUlJBWV9CVUZGRVIsdGhpcy5pbmRleEJ1ZmZlciksZS5kcmF3RWxlbWVudHMoZS5UUklBTkdMRVMsNixlLlVOU0lHTkVEX1NIT1JULDApfSxwcm90by5pbml0U2hhZGVyQnVmZmVycz1mdW5jdGlvbigpe3ZhciBhPWdsb2JhbHMuZ2w7dGhpcy52ZXJ0ZXhCdWZmZXI9YS5jcmVhdGVCdWZmZXIoKSx0aGlzLnV2QnVmZmVyPWEuY3JlYXRlQnVmZmVyKCksdGhpcy5pbmRleEJ1ZmZlcj1hLmNyZWF0ZUJ1ZmZlcigpLHRoaXMudmVydGV4QXJyYXk9bmV3IEZsb2F0MzJBcnJheShbMCwwLDEsMCwwLDEsMSwxXSksYS5iaW5kQnVmZmVyKGEuQVJSQVlfQlVGRkVSLHRoaXMudmVydGV4QnVmZmVyKSxhLmJ1ZmZlckRhdGEoYS5BUlJBWV9CVUZGRVIsdGhpcy52ZXJ0ZXhBcnJheSxhLlNUQVRJQ19EUkFXKSx0aGlzLnV2QXJyYXk9bmV3IEZsb2F0MzJBcnJheShbMCwwLDEsMCwwLDEsMSwxXSksYS5iaW5kQnVmZmVyKGEuQVJSQVlfQlVGRkVSLHRoaXMudXZCdWZmZXIpLGEuYnVmZmVyRGF0YShhLkFSUkFZX0JVRkZFUix0aGlzLnV2QXJyYXksYS5TVEFUSUNfRFJBVyksYS5iaW5kQnVmZmVyKGEuRUxFTUVOVF9BUlJBWV9CVUZGRVIsdGhpcy5pbmRleEJ1ZmZlciksYS5idWZmZXJEYXRhKGEuRUxFTUVOVF9BUlJBWV9CVUZGRVIsbmV3IFVpbnQxNkFycmF5KFswLDEsMiwxLDMsMl0pLGEuU1RBVElDX0RSQVcpfSxwcm90by5nZXRCb3VuZHM9ZnVuY3Rpb24oYSl7dmFyIGIsYyxkLGUsZixnLGgsaSxqLGssbCxtLG4sbyxwLHEscixzLHQsdSx2LHcseCx5LHo9YS5maXJzdCxBPWEubGFzdC5faU5leHQsQj0tMS8wLEM9LTEvMCxEPTEvMCxFPTEvMDtkb3tpZih6LnZpc2libGUpaWYoeiBpbnN0YW5jZW9mIFNwcml0ZSljPXoudGV4dHVyZS5mcmFtZS53aWR0aCxkPXoudGV4dHVyZS5mcmFtZS5oZWlnaHQsZT16LmFuY2hvci54LGY9ei5hbmNob3IueSxnPWMqKDEtZSksaD1jKi1lLGk9ZCooMS1mKSxqPWQqLWYsaz0hMDtlbHNlIGlmKHogaW5zdGFuY2VvZiBHcmFwaGljcyl7ei51cGRhdGVGaWx0ZXJCb3VuZHMoKTt2YXIgRj16LmJvdW5kcztjPUYud2lkdGgsZD1GLmhlaWdodCxnPUYueCxoPUYueCtGLndpZHRoLGk9Ri55LGo9Ri55K0YuaGVpZ2h0LGs9ITB9ayYmKGI9ei53b3JsZFRyYW5zZm9ybSxsPWJbMF0sbT1iWzNdLG49YlsxXSxvPWJbNF0scD1iWzJdLHE9Yls1XSxyPWwqaCtuKmorcCx2PW8qaittKmgrcSxzPWwqZytuKmorcCx3PW8qaittKmcrcSx0PWwqZytuKmkrcCx4PW8qaSttKmcrcSx1PWwqaCtuKmkrcCx5PW8qaSttKmgrcSxEPUQ+cj9yOkQsRD1EPnM/czpELEQ9RD50P3Q6RCxEPUQ+dT91OkQsRT1FPnY/djpFLEU9RT53P3c6RSxFPUU+eD94OkUsRT1FPnk/eTpFLEI9cj5CP3I6QixCPXM+Qj9zOkIsQj10PkI/dDpCLEI9dT5CP3U6QixDPXY+Qz92OkMsQz13PkM/dzpDLEM9eD5DP3g6QyxDPXk+Qz95OkMpLGs9ITEsej16Ll9pTmV4dH13aGlsZSh6IT09QSk7YS5maWx0ZXJBcmVhLng9RCxhLmZpbHRlckFyZWEueT1FLGEuZmlsdGVyQXJlYS53aWR0aD1CLUQsYS5maWx0ZXJBcmVhLmhlaWdodD1DLUV9LG1vZHVsZS5leHBvcnRzPVdlYkdMRmlsdGVyTWFuYWdlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBXZWJHTFJlbmRlckdyb3VwKGEsYil7dGhpcy5nbD1hLHRoaXMucm9vdD1udWxsLHRoaXMuYmFja2dyb3VuZENvbG9yPXZvaWQgMCx0aGlzLnRyYW5zcGFyZW50PXZvaWQgMD09PWI/ITA6Yix0aGlzLmJhdGNocz1bXSx0aGlzLnRvUmVtb3ZlPVtdLHRoaXMuZmlsdGVyTWFuYWdlcj1uZXcgV2ViR0xGaWx0ZXJNYW5hZ2VyKHRoaXMudHJhbnNwYXJlbnQpfXZhciBnbG9iYWxzPXJlcXVpcmUoXCIuLi8uLi9jb3JlL2dsb2JhbHNcIiksc2hhZGVycz1yZXF1aXJlKFwiLi9zaGFkZXJzXCIpLHdlYmdsR3JhcGhpY3M9cmVxdWlyZShcIi4vZ3JhcGhpY3NcIiksV2ViR0xCYXRjaD1yZXF1aXJlKFwiLi9XZWJHTEJhdGNoXCIpLFdlYkdMRmlsdGVyTWFuYWdlcj1yZXF1aXJlKFwiLi9XZWJHTEZpbHRlck1hbmFnZXJcIiksbWF0Mz1yZXF1aXJlKFwiLi4vLi4vZ2VvbS9tYXRyaXhcIikubWF0MyxCYXNlVGV4dHVyZT1yZXF1aXJlKFwiLi4vLi4vdGV4dHVyZXMvQmFzZVRleHR1cmVcIiksVGlsaW5nU3ByaXRlPXJlcXVpcmUoXCIuLi8uLi9leHRyYXMvVGlsaW5nU3ByaXRlXCIpLFN0cmlwPXJlcXVpcmUoXCIuLi8uLi9leHRyYXMvU3RyaXBcIiksR3JhcGhpY3M9cmVxdWlyZShcIi4uLy4uL3ByaW1pdGl2ZXMvR3JhcGhpY3NcIiksRmlsdGVyQmxvY2s9cmVxdWlyZShcIi4uLy4uL2ZpbHRlcnMvRmlsdGVyQmxvY2tcIiksU3ByaXRlPXJlcXVpcmUoXCIuLi8uLi9kaXNwbGF5L1Nwcml0ZVwiKSxDdXN0b21SZW5kZXJhYmxlPXJlcXVpcmUoXCIuLi8uLi9leHRyYXMvQ3VzdG9tUmVuZGVyYWJsZVwiKSxwcm90bz1XZWJHTFJlbmRlckdyb3VwLnByb3RvdHlwZTtwcm90by5zZXRSZW5kZXJhYmxlPWZ1bmN0aW9uKGEpe3RoaXMucm9vdCYmdGhpcy5yZW1vdmVEaXNwbGF5T2JqZWN0QW5kQ2hpbGRyZW4odGhpcy5yb290KSxhLndvcmxkVmlzaWJsZT1hLnZpc2libGUsdGhpcy5yb290PWEsdGhpcy5hZGREaXNwbGF5T2JqZWN0QW5kQ2hpbGRyZW4oYSl9LHByb3RvLnJlbmRlcj1mdW5jdGlvbihhLGIpe3ZhciBjPXRoaXMuZ2w7V2ViR0xSZW5kZXJHcm91cC51cGRhdGVUZXh0dXJlcyhjKSxjLnVuaWZvcm0yZihnbG9iYWxzLmRlZmF1bHRTaGFkZXIucHJvamVjdGlvblZlY3RvcixhLngsYS55KSx0aGlzLmZpbHRlck1hbmFnZXIuYmVnaW4oYSxiKSxjLmJsZW5kRnVuYyhjLk9ORSxjLk9ORV9NSU5VU19TUkNfQUxQSEEpO2Zvcih2YXIgZCxlPTA7ZTx0aGlzLmJhdGNocy5sZW5ndGg7ZSsrKWQ9dGhpcy5iYXRjaHNbZV0sZCBpbnN0YW5jZW9mIFdlYkdMQmF0Y2g/dGhpcy5iYXRjaHNbZV0ucmVuZGVyKCk6dGhpcy5yZW5kZXJTcGVjaWFsKGQsYSl9LHByb3RvLmhhbmRsZUZpbHRlcj1mdW5jdGlvbigpe30scHJvdG8ucmVuZGVyU3BlY2lmaWM9ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPXRoaXMuZ2w7V2ViR0xSZW5kZXJHcm91cC51cGRhdGVUZXh0dXJlcyhkKSxkLnVuaWZvcm0yZihnbG9iYWxzLmRlZmF1bHRTaGFkZXIucHJvamVjdGlvblZlY3RvcixiLngsYi55KSx0aGlzLmZpbHRlck1hbmFnZXIuYmVnaW4oYixjKTtmb3IodmFyIGUsZixnLGgsaSxqLGs9YS5maXJzdDtrLl9pTmV4dCYmKCFrLnJlbmRlcmFibGV8fCFrLl9fcmVuZGVyR3JvdXApOylrPWsuX2lOZXh0O3ZhciBsPWsuYmF0Y2g7aWYoayBpbnN0YW5jZW9mIFNwcml0ZSlpZihsPWsuYmF0Y2gsaj1sLmhlYWQsaj09PWspZT0wO2Vsc2UgZm9yKGU9MTtqLl9fbmV4dCE9PWs7KWUrKyxqPWouX19uZXh0O2Vsc2UgbD1rO2Zvcih2YXIgbT1hLmxhc3Q7bS5faVByZXYmJighbS5yZW5kZXJhYmxlfHwhbS5fX3JlbmRlckdyb3VwKTspbT1tLl9pTmV4dDtpZihtIGluc3RhbmNlb2YgU3ByaXRlKWlmKGk9bS5iYXRjaCxqPWkuaGVhZCxqPT09bSlnPTA7ZWxzZSBmb3IoZz0xO2ouX19uZXh0IT09bTspZysrLGo9ai5fX25leHQ7ZWxzZSBpPW07aWYobD09PWkpcmV0dXJuIGwgaW5zdGFuY2VvZiBXZWJHTEJhdGNoP2wucmVuZGVyKGUsZysxKTp0aGlzLnJlbmRlclNwZWNpYWwobCxiKSx2b2lkIDA7Zj10aGlzLmJhdGNocy5pbmRleE9mKGwpLGg9dGhpcy5iYXRjaHMuaW5kZXhPZihpKSxsIGluc3RhbmNlb2YgV2ViR0xCYXRjaD9sLnJlbmRlcihlKTp0aGlzLnJlbmRlclNwZWNpYWwobCxiKTtmb3IodmFyIG4sbz1mKzE7aD5vO28rKyluPXRoaXMuYmF0Y2hzW29dLG4gaW5zdGFuY2VvZiBXZWJHTEJhdGNoP3RoaXMuYmF0Y2hzW29dLnJlbmRlcigpOnRoaXMucmVuZGVyU3BlY2lhbChuLGIpO2kgaW5zdGFuY2VvZiBXZWJHTEJhdGNoP2kucmVuZGVyKDAsZysxKTp0aGlzLnJlbmRlclNwZWNpYWwoaSxiKX0scHJvdG8ucmVuZGVyU3BlY2lhbD1mdW5jdGlvbihhLGIpe3ZhciBjPWEudmNvdW50PT09Z2xvYmFscy52aXNpYmxlQ291bnQ7YSBpbnN0YW5jZW9mIFRpbGluZ1Nwcml0ZT9jJiZ0aGlzLnJlbmRlclRpbGluZ1Nwcml0ZShhLGIpOmEgaW5zdGFuY2VvZiBTdHJpcD9jJiZ0aGlzLnJlbmRlclN0cmlwKGEsYik6YSBpbnN0YW5jZW9mIEN1c3RvbVJlbmRlcmFibGU/YyYmYS5yZW5kZXJXZWJHTCh0aGlzLGIpOmEgaW5zdGFuY2VvZiBHcmFwaGljcz9jJiZhLnJlbmRlcmFibGUmJndlYmdsR3JhcGhpY3MucmVuZGVyR3JhcGhpY3MoYSxiKTphIGluc3RhbmNlb2YgRmlsdGVyQmxvY2smJnRoaXMuaGFuZGxlRmlsdGVyQmxvY2soYSxiKX07dmFyIG1hc2tTdGFjaz1bXTtwcm90by5oYW5kbGVGaWx0ZXJCbG9jaz1mdW5jdGlvbihhLGIpe3ZhciBjPWdsb2JhbHMuZ2w7aWYoYS5vcGVuKWEuZGF0YSBpbnN0YW5jZW9mIEFycmF5P3RoaXMuZmlsdGVyTWFuYWdlci5wdXNoRmlsdGVyKGEpOihtYXNrU3RhY2sucHVzaChhKSxjLmVuYWJsZShjLlNURU5DSUxfVEVTVCksYy5jb2xvck1hc2soITEsITEsITEsITEpLGMuc3RlbmNpbEZ1bmMoYy5BTFdBWVMsMSwxKSxjLnN0ZW5jaWxPcChjLktFRVAsYy5LRUVQLGMuSU5DUiksd2ViZ2xHcmFwaGljcy5yZW5kZXJHcmFwaGljcyhhLmRhdGEsYiksYy5jb2xvck1hc2soITAsITAsITAsITApLGMuc3RlbmNpbEZ1bmMoYy5OT1RFUVVBTCwwLG1hc2tTdGFjay5sZW5ndGgpLGMuc3RlbmNpbE9wKGMuS0VFUCxjLktFRVAsYy5LRUVQKSk7ZWxzZSBpZihhLmRhdGEgaW5zdGFuY2VvZiBBcnJheSl0aGlzLmZpbHRlck1hbmFnZXIucG9wRmlsdGVyKCk7ZWxzZXt2YXIgZD1tYXNrU3RhY2sucG9wKGEpO2QmJihjLmNvbG9yTWFzayghMSwhMSwhMSwhMSksYy5zdGVuY2lsRnVuYyhjLkFMV0FZUywxLDEpLGMuc3RlbmNpbE9wKGMuS0VFUCxjLktFRVAsYy5ERUNSKSx3ZWJnbEdyYXBoaWNzLnJlbmRlckdyYXBoaWNzKGQuZGF0YSxiKSxjLmNvbG9yTWFzayghMCwhMCwhMCwhMCksYy5zdGVuY2lsRnVuYyhjLk5PVEVRVUFMLDAsbWFza1N0YWNrLmxlbmd0aCksYy5zdGVuY2lsT3AoYy5LRUVQLGMuS0VFUCxjLktFRVApKSxjLmRpc2FibGUoYy5TVEVOQ0lMX1RFU1QpfX0scHJvdG8udXBkYXRlVGV4dHVyZT1mdW5jdGlvbihhKXt0aGlzLnJlbW92ZU9iamVjdChhKTtmb3IodmFyIGI9YS5maXJzdDtiIT09dGhpcy5yb290JiYoYj1iLl9pUHJldiwhYi5yZW5kZXJhYmxlfHwhYi5fX3JlbmRlckdyb3VwKTspO2Zvcih2YXIgYz1hLmxhc3Q7Yy5faU5leHQmJihjPWMuX2lOZXh0LCFjLnJlbmRlcmFibGV8fCFjLl9fcmVuZGVyR3JvdXApOyk7dGhpcy5pbnNlcnRPYmplY3QoYSxiLGMpfSxwcm90by5hZGRGaWx0ZXJCbG9ja3M9ZnVuY3Rpb24oYSxiKXthLl9fcmVuZGVyR3JvdXA9dGhpcyxiLl9fcmVuZGVyR3JvdXA9dGhpcztmb3IodmFyIGM9YTtjIT09dGhpcy5yb290LmZpcnN0JiYoYz1jLl9pUHJldiwhYy5yZW5kZXJhYmxlfHwhYy5fX3JlbmRlckdyb3VwKTspO3RoaXMuaW5zZXJ0QWZ0ZXIoYSxjKTtmb3IodmFyIGQ9YjtkIT09dGhpcy5yb290LmZpcnN0JiYoZD1kLl9pUHJldiwhZC5yZW5kZXJhYmxlfHwhZC5fX3JlbmRlckdyb3VwKTspO3RoaXMuaW5zZXJ0QWZ0ZXIoYixkKX0scHJvdG8ucmVtb3ZlRmlsdGVyQmxvY2tzPWZ1bmN0aW9uKGEsYil7dGhpcy5yZW1vdmVPYmplY3QoYSksdGhpcy5yZW1vdmVPYmplY3QoYil9LHByb3RvLmFkZERpc3BsYXlPYmplY3RBbmRDaGlsZHJlbj1mdW5jdGlvbihhKXthLl9fcmVuZGVyR3JvdXAmJmEuX19yZW5kZXJHcm91cC5yZW1vdmVEaXNwbGF5T2JqZWN0QW5kQ2hpbGRyZW4oYSk7Zm9yKHZhciBiPWEuZmlyc3Q7YiE9PXRoaXMucm9vdC5maXJzdCYmKGI9Yi5faVByZXYsIWIucmVuZGVyYWJsZXx8IWIuX19yZW5kZXJHcm91cCk7KTtmb3IodmFyIGM9YS5sYXN0O2MuX2lOZXh0JiYoYz1jLl9pTmV4dCwhYy5yZW5kZXJhYmxlfHwhYy5fX3JlbmRlckdyb3VwKTspO3ZhciBkPWEuZmlyc3QsZT1hLmxhc3QuX2lOZXh0O2RvIGQuX19yZW5kZXJHcm91cD10aGlzLGQucmVuZGVyYWJsZSYmKHRoaXMuaW5zZXJ0T2JqZWN0KGQsYixjKSxiPWQpLGQ9ZC5faU5leHQ7d2hpbGUoZCE9PWUpfSxwcm90by5yZW1vdmVEaXNwbGF5T2JqZWN0QW5kQ2hpbGRyZW49ZnVuY3Rpb24oYSl7aWYoYS5fX3JlbmRlckdyb3VwPT09dGhpcylkbyBhLl9fcmVuZGVyR3JvdXA9bnVsbCxhLnJlbmRlcmFibGUmJnRoaXMucmVtb3ZlT2JqZWN0KGEpLGE9YS5faU5leHQ7d2hpbGUoYSl9LHByb3RvLmluc2VydE9iamVjdD1mdW5jdGlvbihhLGIsYyl7dmFyIGQsZSxmPWIsZz1jO2lmKGEgaW5zdGFuY2VvZiBTcHJpdGUpe3ZhciBoLGk7aWYoZiBpbnN0YW5jZW9mIFNwcml0ZSl7aWYoaD1mLmJhdGNoLGgmJmgudGV4dHVyZT09PWEudGV4dHVyZS5iYXNlVGV4dHVyZSYmaC5ibGVuZE1vZGU9PT1hLmJsZW5kTW9kZSlyZXR1cm4gaC5pbnNlcnRBZnRlcihhLGYpLHZvaWQgMH1lbHNlIGg9ZjtpZihnKWlmKGcgaW5zdGFuY2VvZiBTcHJpdGUpe2lmKGk9Zy5iYXRjaCl7aWYoaS50ZXh0dXJlPT09YS50ZXh0dXJlLmJhc2VUZXh0dXJlJiZpLmJsZW5kTW9kZT09PWEuYmxlbmRNb2RlKXJldHVybiBpLmluc2VydEJlZm9yZShhLGcpLHZvaWQgMDtpZihpPT09aCl7dmFyIGo9aC5zcGxpdChnKTtyZXR1cm4gZD1XZWJHTEJhdGNoLmdldEJhdGNoKCksZT10aGlzLmJhdGNocy5pbmRleE9mKGgpLGQuaW5pdChhKSx0aGlzLmJhdGNocy5zcGxpY2UoZSsxLDAsZCxqKSx2b2lkIDB9fX1lbHNlIGk9ZztyZXR1cm4gZD1XZWJHTEJhdGNoLmdldEJhdGNoKCksZC5pbml0KGEpLGg/KGU9dGhpcy5iYXRjaHMuaW5kZXhPZihoKSx0aGlzLmJhdGNocy5zcGxpY2UoZSsxLDAsZCkpOnRoaXMuYmF0Y2hzLnB1c2goZCksdm9pZCAwfWEgaW5zdGFuY2VvZiBUaWxpbmdTcHJpdGU/dGhpcy5pbml0VGlsaW5nU3ByaXRlKGEpOmEgaW5zdGFuY2VvZiBTdHJpcCYmdGhpcy5pbml0U3RyaXAoYSksdGhpcy5pbnNlcnRBZnRlcihhLGYpfSxwcm90by5pbnNlcnRBZnRlcj1mdW5jdGlvbihhLGIpe3ZhciBjLGQsZTtiIGluc3RhbmNlb2YgU3ByaXRlPyhjPWIuYmF0Y2gsYz9jLnRhaWw9PT1iPyhlPXRoaXMuYmF0Y2hzLmluZGV4T2YoYyksdGhpcy5iYXRjaHMuc3BsaWNlKGUrMSwwLGEpKTooZD1jLnNwbGl0KGIuX19uZXh0KSxlPXRoaXMuYmF0Y2hzLmluZGV4T2YoYyksdGhpcy5iYXRjaHMuc3BsaWNlKGUrMSwwLGEsZCkpOnRoaXMuYmF0Y2hzLnB1c2goYSkpOihlPXRoaXMuYmF0Y2hzLmluZGV4T2YoYiksdGhpcy5iYXRjaHMuc3BsaWNlKGUrMSwwLGEpKX0scHJvdG8ucmVtb3ZlT2JqZWN0PWZ1bmN0aW9uKGEpe3ZhciBiLGM7aWYoYSBpbnN0YW5jZW9mIFNwcml0ZSl7dmFyIGQ9YS5iYXRjaDtpZighZClyZXR1cm47ZC5yZW1vdmUoYSksZC5zaXplfHwoYj1kKX1lbHNlIGI9YTtpZihiKXtpZihjPXRoaXMuYmF0Y2hzLmluZGV4T2YoYiksLTE9PT1jKXJldHVybjtpZigwPT09Y3x8Yz09PXRoaXMuYmF0Y2hzLmxlbmd0aC0xKXJldHVybiB0aGlzLmJhdGNocy5zcGxpY2UoYywxKSxiIGluc3RhbmNlb2YgV2ViR0xCYXRjaCYmV2ViR0xCYXRjaC5yZXR1cm5CYXRjaChiKSx2b2lkIDA7aWYodGhpcy5iYXRjaHNbYy0xXWluc3RhbmNlb2YgV2ViR0xCYXRjaCYmdGhpcy5iYXRjaHNbYysxXWluc3RhbmNlb2YgV2ViR0xCYXRjaCYmdGhpcy5iYXRjaHNbYy0xXS50ZXh0dXJlPT09dGhpcy5iYXRjaHNbYysxXS50ZXh0dXJlJiZ0aGlzLmJhdGNoc1tjLTFdLmJsZW5kTW9kZT09PXRoaXMuYmF0Y2hzW2MrMV0uYmxlbmRNb2RlKXJldHVybiB0aGlzLmJhdGNoc1tjLTFdLm1lcmdlKHRoaXMuYmF0Y2hzW2MrMV0pLGIgaW5zdGFuY2VvZiBXZWJHTEJhdGNoJiZXZWJHTEJhdGNoLnJldHVybkJhdGNoKGIpLFdlYkdMQmF0Y2gucmV0dXJuQmF0Y2godGhpcy5iYXRjaHNbYysxXSksdGhpcy5iYXRjaHMuc3BsaWNlKGMsMiksdm9pZCAwO3RoaXMuYmF0Y2hzLnNwbGljZShjLDEpLGIgaW5zdGFuY2VvZiBXZWJHTEJhdGNoJiZXZWJHTEJhdGNoLnJldHVybkJhdGNoKGIpfX0scHJvdG8uaW5pdFRpbGluZ1Nwcml0ZT1mdW5jdGlvbihhKXt2YXIgYj10aGlzLmdsO2EudmVydGljaWVzPW5ldyBGbG9hdDMyQXJyYXkoWzAsMCxhLndpZHRoLDAsYS53aWR0aCxhLmhlaWdodCwwLGEuaGVpZ2h0XSksYS51dnM9bmV3IEZsb2F0MzJBcnJheShbMCwwLDEsMCwxLDEsMCwxXSksYS5jb2xvcnM9bmV3IEZsb2F0MzJBcnJheShbMSwxLDEsMV0pLGEuaW5kaWNlcz1uZXcgVWludDE2QXJyYXkoWzAsMSwzLDJdKSxhLl92ZXJ0ZXhCdWZmZXI9Yi5jcmVhdGVCdWZmZXIoKSxhLl9pbmRleEJ1ZmZlcj1iLmNyZWF0ZUJ1ZmZlcigpLGEuX3V2QnVmZmVyPWIuY3JlYXRlQnVmZmVyKCksYS5fY29sb3JCdWZmZXI9Yi5jcmVhdGVCdWZmZXIoKSxiLmJpbmRCdWZmZXIoYi5BUlJBWV9CVUZGRVIsYS5fdmVydGV4QnVmZmVyKSxiLmJ1ZmZlckRhdGEoYi5BUlJBWV9CVUZGRVIsYS52ZXJ0aWNpZXMsYi5TVEFUSUNfRFJBVyksYi5iaW5kQnVmZmVyKGIuQVJSQVlfQlVGRkVSLGEuX3V2QnVmZmVyKSxiLmJ1ZmZlckRhdGEoYi5BUlJBWV9CVUZGRVIsYS51dnMsYi5EWU5BTUlDX0RSQVcpLGIuYmluZEJ1ZmZlcihiLkFSUkFZX0JVRkZFUixhLl9jb2xvckJ1ZmZlciksYi5idWZmZXJEYXRhKGIuQVJSQVlfQlVGRkVSLGEuY29sb3JzLGIuU1RBVElDX0RSQVcpLGIuYmluZEJ1ZmZlcihiLkVMRU1FTlRfQVJSQVlfQlVGRkVSLGEuX2luZGV4QnVmZmVyKSxiLmJ1ZmZlckRhdGEoYi5FTEVNRU5UX0FSUkFZX0JVRkZFUixhLmluZGljZXMsYi5TVEFUSUNfRFJBVyksYS50ZXh0dXJlLmJhc2VUZXh0dXJlLl9nbFRleHR1cmU/KGIuYmluZFRleHR1cmUoYi5URVhUVVJFXzJELGEudGV4dHVyZS5iYXNlVGV4dHVyZS5fZ2xUZXh0dXJlKSxiLnRleFBhcmFtZXRlcmkoYi5URVhUVVJFXzJELGIuVEVYVFVSRV9XUkFQX1MsYi5SRVBFQVQpLGIudGV4UGFyYW1ldGVyaShiLlRFWFRVUkVfMkQsYi5URVhUVVJFX1dSQVBfVCxiLlJFUEVBVCksYS50ZXh0dXJlLmJhc2VUZXh0dXJlLl9wb3dlck9mMj0hMCk6YS50ZXh0dXJlLmJhc2VUZXh0dXJlLl9wb3dlck9mMj0hMH0scHJvdG8ucmVuZGVyU3RyaXA9ZnVuY3Rpb24oYSxiKXt2YXIgYz10aGlzLmdsO3NoYWRlcnMuYWN0aXZhdGVTdHJpcFNoYWRlcigpO3ZhciBkPWdsb2JhbHMuc3RyaXBTaGFkZXIsZT1tYXQzLmNsb25lKGEud29ybGRUcmFuc2Zvcm0pO21hdDMudHJhbnNwb3NlKGUpLGMudW5pZm9ybU1hdHJpeDNmdihkLnRyYW5zbGF0aW9uTWF0cml4LCExLGUpLGMudW5pZm9ybTJmKGQucHJvamVjdGlvblZlY3RvcixiLngsYi55KSxjLnVuaWZvcm0yZihkLm9mZnNldFZlY3RvciwtZ2xvYmFscy5vZmZzZXQueCwtZ2xvYmFscy5vZmZzZXQueSksYy51bmlmb3JtMWYoZC5hbHBoYSxhLndvcmxkQWxwaGEpLGEuZGlydHk/KGEuZGlydHk9ITEsYy5iaW5kQnVmZmVyKGMuQVJSQVlfQlVGRkVSLGEuX3ZlcnRleEJ1ZmZlciksYy5idWZmZXJEYXRhKGMuQVJSQVlfQlVGRkVSLGEudmVydGljaWVzLGMuU1RBVElDX0RSQVcpLGMudmVydGV4QXR0cmliUG9pbnRlcihkLmFWZXJ0ZXhQb3NpdGlvbiwyLGMuRkxPQVQsITEsMCwwKSxjLmJpbmRCdWZmZXIoYy5BUlJBWV9CVUZGRVIsYS5fdXZCdWZmZXIpLGMuYnVmZmVyRGF0YShjLkFSUkFZX0JVRkZFUixhLnV2cyxjLlNUQVRJQ19EUkFXKSxjLnZlcnRleEF0dHJpYlBvaW50ZXIoZC5hVGV4dHVyZUNvb3JkLDIsYy5GTE9BVCwhMSwwLDApLGMuYWN0aXZlVGV4dHVyZShjLlRFWFRVUkUwKSxjLmJpbmRUZXh0dXJlKGMuVEVYVFVSRV8yRCxhLnRleHR1cmUuYmFzZVRleHR1cmUuX2dsVGV4dHVyZSksYy5iaW5kQnVmZmVyKGMuQVJSQVlfQlVGRkVSLGEuX2NvbG9yQnVmZmVyKSxjLmJ1ZmZlckRhdGEoYy5BUlJBWV9CVUZGRVIsYS5jb2xvcnMsYy5TVEFUSUNfRFJBVyksYy52ZXJ0ZXhBdHRyaWJQb2ludGVyKGQuY29sb3JBdHRyaWJ1dGUsMSxjLkZMT0FULCExLDAsMCksYy5iaW5kQnVmZmVyKGMuRUxFTUVOVF9BUlJBWV9CVUZGRVIsYS5faW5kZXhCdWZmZXIpLGMuYnVmZmVyRGF0YShjLkVMRU1FTlRfQVJSQVlfQlVGRkVSLGEuaW5kaWNlcyxjLlNUQVRJQ19EUkFXKSk6KGMuYmluZEJ1ZmZlcihjLkFSUkFZX0JVRkZFUixhLl92ZXJ0ZXhCdWZmZXIpLGMuYnVmZmVyU3ViRGF0YShjLkFSUkFZX0JVRkZFUiwwLGEudmVydGljaWVzKSxjLnZlcnRleEF0dHJpYlBvaW50ZXIoZC5hVmVydGV4UG9zaXRpb24sMixjLkZMT0FULCExLDAsMCksYy5iaW5kQnVmZmVyKGMuQVJSQVlfQlVGRkVSLGEuX3V2QnVmZmVyKSxjLnZlcnRleEF0dHJpYlBvaW50ZXIoZC5hVGV4dHVyZUNvb3JkLDIsYy5GTE9BVCwhMSwwLDApLGMuYWN0aXZlVGV4dHVyZShjLlRFWFRVUkUwKSxjLmJpbmRUZXh0dXJlKGMuVEVYVFVSRV8yRCxhLnRleHR1cmUuYmFzZVRleHR1cmUuX2dsVGV4dHVyZSksYy5iaW5kQnVmZmVyKGMuQVJSQVlfQlVGRkVSLGEuX2NvbG9yQnVmZmVyKSxjLnZlcnRleEF0dHJpYlBvaW50ZXIoZC5jb2xvckF0dHJpYnV0ZSwxLGMuRkxPQVQsITEsMCwwKSxjLmJpbmRCdWZmZXIoYy5FTEVNRU5UX0FSUkFZX0JVRkZFUixhLl9pbmRleEJ1ZmZlcikpLGMuZHJhd0VsZW1lbnRzKGMuVFJJQU5HTEVfU1RSSVAsYS5pbmRpY2VzLmxlbmd0aCxjLlVOU0lHTkVEX1NIT1JULDApLHNoYWRlcnMuZGVhY3RpdmF0ZVN0cmlwU2hhZGVyKCl9LHByb3RvLnJlbmRlclRpbGluZ1Nwcml0ZT1mdW5jdGlvbihhLGIpe3ZhciBjPXRoaXMuZ2wsZD1hLnRpbGVQb3NpdGlvbixlPWEudGlsZVNjYWxlLGY9ZC54L2EudGV4dHVyZS5iYXNlVGV4dHVyZS53aWR0aCxnPWQueS9hLnRleHR1cmUuYmFzZVRleHR1cmUuaGVpZ2h0LGg9YS53aWR0aC9hLnRleHR1cmUuYmFzZVRleHR1cmUud2lkdGgvZS54LGk9YS5oZWlnaHQvYS50ZXh0dXJlLmJhc2VUZXh0dXJlLmhlaWdodC9lLnk7YS51dnNbMF09MC1mLGEudXZzWzFdPTAtZyxhLnV2c1syXT0xKmgtZixhLnV2c1szXT0wLWcsYS51dnNbNF09MSpoLWYsYS51dnNbNV09MSppLWcsYS51dnNbNl09MC1mLGEudXZzWzddPTEqaS1nLGMuYmluZEJ1ZmZlcihjLkFSUkFZX0JVRkZFUixhLl91dkJ1ZmZlciksYy5idWZmZXJTdWJEYXRhKGMuQVJSQVlfQlVGRkVSLDAsYS51dnMpLHRoaXMucmVuZGVyU3RyaXAoYSxiKX0scHJvdG8uaW5pdFN0cmlwPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuZ2w7YS5fdmVydGV4QnVmZmVyPWIuY3JlYXRlQnVmZmVyKCksYS5faW5kZXhCdWZmZXI9Yi5jcmVhdGVCdWZmZXIoKSxhLl91dkJ1ZmZlcj1iLmNyZWF0ZUJ1ZmZlcigpLGEuX2NvbG9yQnVmZmVyPWIuY3JlYXRlQnVmZmVyKCksYi5iaW5kQnVmZmVyKGIuQVJSQVlfQlVGRkVSLGEuX3ZlcnRleEJ1ZmZlciksYi5idWZmZXJEYXRhKGIuQVJSQVlfQlVGRkVSLGEudmVydGljaWVzLGIuRFlOQU1JQ19EUkFXKSxiLmJpbmRCdWZmZXIoYi5BUlJBWV9CVUZGRVIsYS5fdXZCdWZmZXIpLGIuYnVmZmVyRGF0YShiLkFSUkFZX0JVRkZFUixhLnV2cyxiLlNUQVRJQ19EUkFXKSxiLmJpbmRCdWZmZXIoYi5BUlJBWV9CVUZGRVIsYS5fY29sb3JCdWZmZXIpLGIuYnVmZmVyRGF0YShiLkFSUkFZX0JVRkZFUixhLmNvbG9ycyxiLlNUQVRJQ19EUkFXKSxiLmJpbmRCdWZmZXIoYi5FTEVNRU5UX0FSUkFZX0JVRkZFUixhLl9pbmRleEJ1ZmZlciksYi5idWZmZXJEYXRhKGIuRUxFTUVOVF9BUlJBWV9CVUZGRVIsYS5pbmRpY2VzLGIuU1RBVElDX0RSQVcpfSxXZWJHTFJlbmRlckdyb3VwLnVwZGF0ZVRleHR1cmU9ZnVuY3Rpb24oYSxiKXtiLl9nbFRleHR1cmV8fChiLl9nbFRleHR1cmU9YS5jcmVhdGVUZXh0dXJlKCkpLGIuaGFzTG9hZGVkJiYoYS5iaW5kVGV4dHVyZShhLlRFWFRVUkVfMkQsYi5fZ2xUZXh0dXJlKSxhLnBpeGVsU3RvcmVpKGEuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCEwKSxhLnRleEltYWdlMkQoYS5URVhUVVJFXzJELDAsYS5SR0JBLGEuUkdCQSxhLlVOU0lHTkVEX0JZVEUsYi5zb3VyY2UpLGEudGV4UGFyYW1ldGVyaShhLlRFWFRVUkVfMkQsYS5URVhUVVJFX01BR19GSUxURVIsYi5zY2FsZU1vZGU9PT1CYXNlVGV4dHVyZS5TQ0FMRV9NT0RFLkxJTkVBUj9hLkxJTkVBUjphLk5FQVJFU1QpLGEudGV4UGFyYW1ldGVyaShhLlRFWFRVUkVfMkQsYS5URVhUVVJFX01JTl9GSUxURVIsYi5zY2FsZU1vZGU9PT1CYXNlVGV4dHVyZS5TQ0FMRV9NT0RFLkxJTkVBUj9hLkxJTkVBUjphLk5FQVJFU1QpLGIuX3Bvd2VyT2YyPyhhLnRleFBhcmFtZXRlcmkoYS5URVhUVVJFXzJELGEuVEVYVFVSRV9XUkFQX1MsYS5SRVBFQVQpLGEudGV4UGFyYW1ldGVyaShhLlRFWFRVUkVfMkQsYS5URVhUVVJFX1dSQVBfVCxhLlJFUEVBVCkpOihhLnRleFBhcmFtZXRlcmkoYS5URVhUVVJFXzJELGEuVEVYVFVSRV9XUkFQX1MsYS5DTEFNUF9UT19FREdFKSxhLnRleFBhcmFtZXRlcmkoYS5URVhUVVJFXzJELGEuVEVYVFVSRV9XUkFQX1QsYS5DTEFNUF9UT19FREdFKSksYS5iaW5kVGV4dHVyZShhLlRFWFRVUkVfMkQsbnVsbCkpfSxXZWJHTFJlbmRlckdyb3VwLmRlc3Ryb3lUZXh0dXJlPWZ1bmN0aW9uKGEsYil7Yi5fZ2xUZXh0dXJlJiYoYi5fZ2xUZXh0dXJlPWEuY3JlYXRlVGV4dHVyZSgpLGEuZGVsZXRlVGV4dHVyZShhLlRFWFRVUkVfMkQsYi5fZ2xUZXh0dXJlKSl9LFdlYkdMUmVuZGVyR3JvdXAudXBkYXRlVGV4dHVyZXM9ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPTAsYz1nbG9iYWxzLnRleHR1cmVzVG9VcGRhdGUubGVuZ3RoO2M+YjtiKyspV2ViR0xSZW5kZXJHcm91cC51cGRhdGVUZXh0dXJlKGEsZ2xvYmFscy50ZXh0dXJlc1RvVXBkYXRlW2JdKTtmb3IoYj0wLGM9Z2xvYmFscy50ZXh0dXJlc1RvRGVzdHJveS5sZW5ndGg7Yz5iO2IrKylXZWJHTFJlbmRlckdyb3VwLmRlc3Ryb3lUZXh0dXJlKGEsZ2xvYmFscy50ZXh0dXJlc1RvRGVzdHJveVtiXSk7Z2xvYmFscy50ZXh0dXJlc1RvVXBkYXRlPVtdLGdsb2JhbHMudGV4dHVyZXNUb0Rlc3Ryb3k9W119LG1vZHVsZS5leHBvcnRzPVdlYkdMUmVuZGVyR3JvdXA7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gV2ViR0xSZW5kZXJlcihhLGIsYyxkLGUpe3ZhciBmO3RoaXMudHJhbnNwYXJlbnQ9ISFkLHRoaXMud2lkdGg9YXx8ODAwLHRoaXMuaGVpZ2h0PWJ8fDYwMCx0aGlzLnZpZXc9Y3x8cGxhdGZvcm0uY3JlYXRlQ2FudmFzKCksdGhpcy52aWV3LndpZHRoPXRoaXMud2lkdGgsdGhpcy52aWV3LmhlaWdodD10aGlzLmhlaWdodDt2YXIgZz10aGlzO3RoaXMudmlldy5hZGRFdmVudExpc3RlbmVyKFwid2ViZ2xjb250ZXh0bG9zdFwiLGZ1bmN0aW9uKGEpe2cuaGFuZGxlQ29udGV4dExvc3QoYSl9LCExKSx0aGlzLnZpZXcuYWRkRXZlbnRMaXN0ZW5lcihcIndlYmdsY29udGV4dHJlc3RvcmVkXCIsZnVuY3Rpb24oYSl7Zy5oYW5kbGVDb250ZXh0UmVzdG9yZWQoYSl9LCExKSx0aGlzLmJhdGNocz1bXTt2YXIgaD17YWxwaGE6dGhpcy50cmFuc3BhcmVudCxhbnRpYWxpYXM6ISFlLHByZW11bHRpcGxpZWRBbHBoYTohMSxzdGVuY2lsOiEwfTt0cnl7Zj10aGlzLnZpZXcuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiLGgpfWNhdGNoKGkpe3RyeXtmPXRoaXMudmlldy5nZXRDb250ZXh0KFwid2ViZ2xcIixoKX1jYXRjaChqKXt0aHJvdyBuZXcgRXJyb3IoXCIgVGhpcyBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgd2ViR0wuIFRyeSB1c2luZyB0aGUgY2FudmFzIHJlbmRlcmVyXCIrdGhpcyl9fXRoaXMuZ2w9Z2xvYmFscy5nbD1mLHNoYWRlcnMuaW5pdERlZmF1bHRTaGFkZXJzKCksZi51c2VQcm9ncmFtKGdsb2JhbHMuZGVmYXVsdFNoYWRlci5wcm9ncmFtKSx0aGlzLmJhdGNoPW5ldyBXZWJHTEJhdGNoKGYpLGYuZGlzYWJsZShmLkRFUFRIX1RFU1QpLGYuZGlzYWJsZShmLkNVTExfRkFDRSksZi5lbmFibGUoZi5CTEVORCksZi5jb2xvck1hc2soITAsITAsITAsdGhpcy50cmFuc3BhcmVudCksdGhpcy5wcm9qZWN0aW9uPWdsb2JhbHMucHJvamVjdGlvbj1uZXcgUG9pbnQoNDAwLDMwMCksdGhpcy5vZmZzZXQ9Z2xvYmFscy5vZmZzZXQ9bmV3IFBvaW50KDAsMCksdGhpcy5yZXNpemUodGhpcy53aWR0aCx0aGlzLmhlaWdodCksdGhpcy5jb250ZXh0TG9zdD0hMSx0aGlzLnN0YWdlUmVuZGVyR3JvdXA9bmV3IFdlYkdMUmVuZGVyR3JvdXAodGhpcy5nbCx0aGlzLnRyYW5zcGFyZW50KX12YXIgcGxhdGZvcm09cmVxdWlyZShcIi4uLy4uL3BsYXRmb3JtXCIpLGdsb2JhbHM9cmVxdWlyZShcIi4uLy4uL2NvcmUvZ2xvYmFsc1wiKSxzaGFkZXJzPXJlcXVpcmUoXCIuL3NoYWRlcnNcIiksV2ViR0xCYXRjaD1yZXF1aXJlKFwiLi9XZWJHTEJhdGNoXCIpLFdlYkdMUmVuZGVyR3JvdXA9cmVxdWlyZShcIi4vV2ViR0xSZW5kZXJHcm91cFwiKSxQb2ludD1yZXF1aXJlKFwiLi4vLi4vZ2VvbS9Qb2ludFwiKSxUZXh0dXJlPXJlcXVpcmUoXCIuLi8uLi90ZXh0dXJlcy9UZXh0dXJlXCIpLHByb3RvPVdlYkdMUmVuZGVyZXIucHJvdG90eXBlO3Byb3RvLnJlbmRlcj1mdW5jdGlvbihhKXtpZighdGhpcy5jb250ZXh0TG9zdCl7dGhpcy5fX3N0YWdlIT09YSYmKHRoaXMuX19zdGFnZT1hLHRoaXMuc3RhZ2VSZW5kZXJHcm91cC5zZXRSZW5kZXJhYmxlKGEpKTt2YXIgYj10aGlzLmdsO2lmKFdlYkdMUmVuZGVyR3JvdXAudXBkYXRlVGV4dHVyZXMoYiksZ2xvYmFscy52aXNpYmxlQ291bnQrKyxhLnVwZGF0ZVRyYW5zZm9ybSgpLGIuY29sb3JNYXNrKCEwLCEwLCEwLHRoaXMudHJhbnNwYXJlbnQpLGIudmlld3BvcnQoMCwwLHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpLGIuYmluZEZyYW1lYnVmZmVyKGIuRlJBTUVCVUZGRVIsbnVsbCksYi5jbGVhckNvbG9yKGEuYmFja2dyb3VuZENvbG9yU3BsaXRbMF0sYS5iYWNrZ3JvdW5kQ29sb3JTcGxpdFsxXSxhLmJhY2tncm91bmRDb2xvclNwbGl0WzJdLCF0aGlzLnRyYW5zcGFyZW50KSxiLmNsZWFyKGIuQ09MT1JfQlVGRkVSX0JJVCksdGhpcy5zdGFnZVJlbmRlckdyb3VwLmJhY2tncm91bmRDb2xvcj1hLmJhY2tncm91bmRDb2xvclNwbGl0LHRoaXMucHJvamVjdGlvbi54PXRoaXMud2lkdGgvMix0aGlzLnByb2plY3Rpb24ueT0tdGhpcy5oZWlnaHQvMix0aGlzLnN0YWdlUmVuZGVyR3JvdXAucmVuZGVyKHRoaXMucHJvamVjdGlvbiksYS5pbnRlcmFjdGl2ZSYmKGEuX2ludGVyYWN0aXZlRXZlbnRzQWRkZWR8fChhLl9pbnRlcmFjdGl2ZUV2ZW50c0FkZGVkPSEwLGEuaW50ZXJhY3Rpb25NYW5hZ2VyLnNldFRhcmdldCh0aGlzKSkpLFRleHR1cmUuZnJhbWVVcGRhdGVzLmxlbmd0aD4wKXtmb3IodmFyIGM9MCxkPVRleHR1cmUuZnJhbWVVcGRhdGVzLmxlbmd0aDtkPmM7YysrKVRleHR1cmUuZnJhbWVVcGRhdGVzW2NdLnVwZGF0ZUZyYW1lPSExO1RleHR1cmUuZnJhbWVVcGRhdGVzPVtdfX19LHByb3RvLnJlc2l6ZT1mdW5jdGlvbihhLGIpe3RoaXMud2lkdGg9YSx0aGlzLmhlaWdodD1iLHRoaXMudmlldy53aWR0aD1hLHRoaXMudmlldy5oZWlnaHQ9Yix0aGlzLmdsLnZpZXdwb3J0KDAsMCx0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KSx0aGlzLnByb2plY3Rpb24ueD10aGlzLndpZHRoLzIsdGhpcy5wcm9qZWN0aW9uLnk9LXRoaXMuaGVpZ2h0LzJ9LHByb3RvLmhhbmRsZUNvbnRleHRMb3N0PWZ1bmN0aW9uKGEpe2EucHJldmVudERlZmF1bHQoKSx0aGlzLmNvbnRleHRMb3N0PSEwfSxwcm90by5oYW5kbGVDb250ZXh0UmVzdG9yZWQ9ZnVuY3Rpb24oKXt2YXIgYT10aGlzLmdsPXRoaXMudmlldy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIse2FscGhhOiEwfSk7dGhpcy5pbml0U2hhZGVycygpO2Zvcih2YXIgYiBpbiBUZXh0dXJlLmNhY2hlKXt2YXIgYz1UZXh0dXJlLmNhY2hlW2JdLmJhc2VUZXh0dXJlO2MuX2dsVGV4dHVyZT1udWxsLFdlYkdMUmVuZGVyR3JvdXAudXBkYXRlVGV4dHVyZShhLGMpfWZvcih2YXIgZD0wLGU9dGhpcy5iYXRjaHMubGVuZ3RoO2U+ZDtkKyspdGhpcy5iYXRjaHNbZF0ucmVzdG9yZUxvc3RDb250ZXh0KGEpLHRoaXMuYmF0Y2hzW2RdLmRpcnR5PSEwO1dlYkdMQmF0Y2gucmVzdG9yZUJhdGNoZXMoYSksdGhpcy5jb250ZXh0TG9zdD0hMX0sbW9kdWxlLmV4cG9ydHM9V2ViR0xSZW5kZXJlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjt2YXIgcGxhdGZvcm09cmVxdWlyZShcIi4uLy4uL3BsYXRmb3JtXCIpO2V4cG9ydHMuc2hhZGVyPWZ1bmN0aW9uKGEsYixjKXt2YXIgZD1iLmpvaW4oXCJcXG5cIiksZT1hLmNyZWF0ZVNoYWRlcihjKTtyZXR1cm4gYS5zaGFkZXJTb3VyY2UoZSxkKSxhLmNvbXBpbGVTaGFkZXIoZSksYS5nZXRTaGFkZXJQYXJhbWV0ZXIoZSxhLkNPTVBJTEVfU1RBVFVTKT9lOihwbGF0Zm9ybS5jb25zb2xlJiZwbGF0Zm9ybS5jb25zb2xlLmVycm9yKGEuZ2V0U2hhZGVySW5mb0xvZyhlKSksbnVsbCl9LGV4cG9ydHMucHJvZ3JhbT1mdW5jdGlvbihhLGIsYyl7dmFyIGQ9ZXhwb3J0cy5zaGFkZXIoYSxjLGEuRlJBR01FTlRfU0hBREVSKSxlPWV4cG9ydHMuc2hhZGVyKGEsYixhLlZFUlRFWF9TSEFERVIpLGY9YS5jcmVhdGVQcm9ncmFtKCk7cmV0dXJuIGEuYXR0YWNoU2hhZGVyKGYsZSksYS5hdHRhY2hTaGFkZXIoZixkKSxhLmxpbmtQcm9ncmFtKGYpLGEuZ2V0UHJvZ3JhbVBhcmFtZXRlcihmLGEuTElOS19TVEFUVVMpP2Y6KHBsYXRmb3JtLmNvbnNvbGUmJnBsYXRmb3JtLmNvbnNvbGUuZXJyb3IoXCJDb3VsZCBub3QgaW5pdGlhbGlzZSBzaGFkZXJzXCIpLG51bGwpfTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjt2YXIgc2hhZGVycz1yZXF1aXJlKFwiLi9zaGFkZXJzXCIpLGdsb2JhbHM9cmVxdWlyZShcIi4uLy4uL2NvcmUvZ2xvYmFsc1wiKSxtYXQzPXJlcXVpcmUoXCIuLi8uLi9nZW9tL21hdHJpeFwiKS5tYXQzLGhleDJyZ2I9cmVxdWlyZShcIi4uLy4uL3V0aWxzL2NvbG9yXCIpLmhleDJyZ2IsdHJpYW5ndWxhdGU9cmVxdWlyZShcIi4uLy4uL3V0aWxzL1BvbHlrXCIpLnRyaWFuZ3VsYXRlLFBvaW50PXJlcXVpcmUoXCIuLi8uLi9nZW9tL1BvaW50XCIpLEdyYXBoaWNzPXJlcXVpcmUoXCIuLi8uLi9wcmltaXRpdmVzL0dyYXBoaWNzXCIpO2V4cG9ydHMucmVuZGVyR3JhcGhpY3M9ZnVuY3Rpb24oYSxiKXt2YXIgYz1nbG9iYWxzLmdsO2EuX3dlYkdMfHwoYS5fd2ViR0w9e3BvaW50czpbXSxpbmRpY2VzOltdLGxhc3RJbmRleDowLGJ1ZmZlcjpjLmNyZWF0ZUJ1ZmZlcigpLGluZGV4QnVmZmVyOmMuY3JlYXRlQnVmZmVyKCl9KSxhLmRpcnR5JiYoYS5kaXJ0eT0hMSxhLmNsZWFyRGlydHkmJihhLmNsZWFyRGlydHk9ITEsYS5fd2ViR0wubGFzdEluZGV4PTAsYS5fd2ViR0wucG9pbnRzPVtdLGEuX3dlYkdMLmluZGljZXM9W10pLGV4cG9ydHMudXBkYXRlR3JhcGhpY3MoYSkpLHNoYWRlcnMuYWN0aXZhdGVQcmltaXRpdmVTaGFkZXIoKTt2YXIgZD1tYXQzLmNsb25lKGEud29ybGRUcmFuc2Zvcm0pO21hdDMudHJhbnNwb3NlKGQpLGMuYmxlbmRGdW5jKGMuT05FLGMuT05FX01JTlVTX1NSQ19BTFBIQSksYy51bmlmb3JtTWF0cml4M2Z2KGdsb2JhbHMucHJpbWl0aXZlU2hhZGVyLnRyYW5zbGF0aW9uTWF0cml4LCExLGQpLGMudW5pZm9ybTJmKGdsb2JhbHMucHJpbWl0aXZlU2hhZGVyLnByb2plY3Rpb25WZWN0b3IsYi54LC1iLnkpLGMudW5pZm9ybTJmKGdsb2JhbHMucHJpbWl0aXZlU2hhZGVyLm9mZnNldFZlY3RvciwtZ2xvYmFscy5vZmZzZXQueCwtZ2xvYmFscy5vZmZzZXQueSksYy51bmlmb3JtMWYoZ2xvYmFscy5wcmltaXRpdmVTaGFkZXIuYWxwaGEsYS53b3JsZEFscGhhKSxjLmJpbmRCdWZmZXIoYy5BUlJBWV9CVUZGRVIsYS5fd2ViR0wuYnVmZmVyKSxjLnZlcnRleEF0dHJpYlBvaW50ZXIoZ2xvYmFscy5wcmltaXRpdmVTaGFkZXIuYVZlcnRleFBvc2l0aW9uLDIsYy5GTE9BVCwhMSwyNCwwKSxjLnZlcnRleEF0dHJpYlBvaW50ZXIoZ2xvYmFscy5wcmltaXRpdmVTaGFkZXIuY29sb3JBdHRyaWJ1dGUsNCxjLkZMT0FULCExLDI0LDgpLGMuYmluZEJ1ZmZlcihjLkVMRU1FTlRfQVJSQVlfQlVGRkVSLGEuX3dlYkdMLmluZGV4QnVmZmVyKSxjLmRyYXdFbGVtZW50cyhjLlRSSUFOR0xFX1NUUklQLGEuX3dlYkdMLmluZGljZXMubGVuZ3RoLGMuVU5TSUdORURfU0hPUlQsMCksc2hhZGVycy5kZWFjdGl2YXRlUHJpbWl0aXZlU2hhZGVyKCl9LGV4cG9ydHMudXBkYXRlR3JhcGhpY3M9ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPWEuX3dlYkdMLmxhc3RJbmRleDtiPGEuZ3JhcGhpY3NEYXRhLmxlbmd0aDtiKyspe3ZhciBjPWEuZ3JhcGhpY3NEYXRhW2JdO2MudHlwZT09PUdyYXBoaWNzLlBPTFk/KGMuZmlsbCYmYy5wb2ludHMubGVuZ3RoPjMmJmV4cG9ydHMuYnVpbGRQb2x5KGMsYS5fd2ViR0wpLGMubGluZVdpZHRoPjAmJmV4cG9ydHMuYnVpbGRMaW5lKGMsYS5fd2ViR0wpKTpjLnR5cGU9PT1HcmFwaGljcy5SRUNUP2V4cG9ydHMuYnVpbGRSZWN0YW5nbGUoYyxhLl93ZWJHTCk6Yy50eXBlPT09R3JhcGhpY3MuQ0lSQ3x8Yy50eXBlPT09R3JhcGhpY3MuRUxJUCxleHBvcnRzLmJ1aWxkQ2lyY2xlKGMsYS5fd2ViR0wpfWEuX3dlYkdMLmxhc3RJbmRleD1hLmdyYXBoaWNzRGF0YS5sZW5ndGg7dmFyIGQ9Z2xvYmFscy5nbDthLl93ZWJHTC5nbFBvaW50cz1uZXcgRmxvYXQzMkFycmF5KGEuX3dlYkdMLnBvaW50cyksZC5iaW5kQnVmZmVyKGQuQVJSQVlfQlVGRkVSLGEuX3dlYkdMLmJ1ZmZlciksZC5idWZmZXJEYXRhKGQuQVJSQVlfQlVGRkVSLGEuX3dlYkdMLmdsUG9pbnRzLGQuU1RBVElDX0RSQVcpLGEuX3dlYkdMLmdsSW5kaWNpZXM9bmV3IFVpbnQxNkFycmF5KGEuX3dlYkdMLmluZGljZXMpLGQuYmluZEJ1ZmZlcihkLkVMRU1FTlRfQVJSQVlfQlVGRkVSLGEuX3dlYkdMLmluZGV4QnVmZmVyKSxkLmJ1ZmZlckRhdGEoZC5FTEVNRU5UX0FSUkFZX0JVRkZFUixhLl93ZWJHTC5nbEluZGljaWVzLGQuU1RBVElDX0RSQVcpfSxleHBvcnRzLmJ1aWxkUmVjdGFuZ2xlPWZ1bmN0aW9uKGEsYil7dmFyIGM9YS5wb2ludHMsZD1jWzBdLGU9Y1sxXSxmPWNbMl0sZz1jWzNdO2lmKGEuZmlsbCl7dmFyIGg9aGV4MnJnYihhLmZpbGxDb2xvciksaT1hLmZpbGxBbHBoYSxqPWhbMF0qaSxrPWhbMV0qaSxsPWhbMl0qaSxtPWIucG9pbnRzLG49Yi5pbmRpY2VzLG89bS5sZW5ndGgvNjttLnB1c2goZCxlKSxtLnB1c2goaixrLGwsaSksbS5wdXNoKGQrZixlKSxtLnB1c2goaixrLGwsaSksbS5wdXNoKGQsZStnKSxtLnB1c2goaixrLGwsaSksbS5wdXNoKGQrZixlK2cpLG0ucHVzaChqLGssbCxpKSxuLnB1c2gobyxvLG8rMSxvKzIsbyszLG8rMyl9YS5saW5lV2lkdGgmJihhLnBvaW50cz1bZCxlLGQrZixlLGQrZixlK2csZCxlK2csZCxlXSxleHBvcnRzLmJ1aWxkTGluZShhLGIpKX0sZXhwb3J0cy5idWlsZENpcmNsZT1mdW5jdGlvbihhLGIpe3ZhciBjPWEucG9pbnRzLGQ9Y1swXSxlPWNbMV0sZj1jWzJdLGc9Y1szXSxoPTQwLGk9MipNYXRoLlBJL2gsaj0wO2lmKGEuZmlsbCl7dmFyIGs9aGV4MnJnYihhLmZpbGxDb2xvciksbD1hLmZpbGxBbHBoYSxtPWtbMF0qbCxuPWtbMV0qbCxvPWtbMl0qbCxwPWIucG9pbnRzLHE9Yi5pbmRpY2VzLHI9cC5sZW5ndGgvNjtmb3IocS5wdXNoKHIpLGo9MDtoKzE+ajtqKyspcC5wdXNoKGQsZSxtLG4sbyxsKSxwLnB1c2goZCtNYXRoLnNpbihpKmopKmYsZStNYXRoLmNvcyhpKmopKmcsbSxuLG8sbCkscS5wdXNoKHIrKyxyKyspO3EucHVzaChyLTEpfWlmKGEubGluZVdpZHRoKXtmb3IoYS5wb2ludHM9W10saj0wO2grMT5qO2orKylhLnBvaW50cy5wdXNoKGQrTWF0aC5zaW4oaSpqKSpmLGUrTWF0aC5jb3MoaSpqKSpnKTtleHBvcnRzLmJ1aWxkTGluZShhLGIpfX0sZXhwb3J0cy5idWlsZExpbmU9ZnVuY3Rpb24oYSxiKXt2YXIgYz0wLGQ9YS5wb2ludHM7aWYoMCE9PWQubGVuZ3RoKXtpZihhLmxpbmVXaWR0aCUyKWZvcihjPTA7YzxkLmxlbmd0aDtjKyspZFtjXSs9LjU7dmFyIGU9bmV3IFBvaW50KGRbMF0sZFsxXSksZj1uZXcgUG9pbnQoZFtkLmxlbmd0aC0yXSxkW2QubGVuZ3RoLTFdKTtpZihlLng9PT1mLngmJmUueT09PWYueSl7ZC5wb3AoKSxkLnBvcCgpLGY9bmV3IFBvaW50KGRbZC5sZW5ndGgtMl0sZFtkLmxlbmd0aC0xXSk7dmFyIGc9Zi54Ky41KihlLngtZi54KSxoPWYueSsuNSooZS55LWYueSk7ZC51bnNoaWZ0KGcsaCksZC5wdXNoKGcsaCl9dmFyIGksaixrLGwsbSxuLG8scCxxLHIscyx0LHUsdix3LHgseSx6LEEsQixDLEQsRSxGPWIucG9pbnRzLEc9Yi5pbmRpY2VzLEg9ZC5sZW5ndGgvMixJPWQubGVuZ3RoLEo9Ri5sZW5ndGgvNixLPWEubGluZVdpZHRoLzIsTD1oZXgycmdiKGEubGluZUNvbG9yKSxNPWEubGluZUFscGhhLE49TFswXSpNLE89TFsxXSpNLFA9TFsyXSpNO2ZvcihrPWRbMF0sbD1kWzFdLG09ZFsyXSxuPWRbM10scT0tKGwtbikscj1rLW0sRT1NYXRoLnNxcnQocSpxK3IqcikscS89RSxyLz1FLHEqPUsscio9SyxGLnB1c2goay1xLGwtcixOLE8sUCxNKSxGLnB1c2goaytxLGwrcixOLE8sUCxNKSxjPTE7SC0xPmM7YysrKWs9ZFsyKihjLTEpXSxsPWRbMiooYy0xKSsxXSxtPWRbMipjXSxuPWRbMipjKzFdLG89ZFsyKihjKzEpXSxwPWRbMiooYysxKSsxXSxxPS0obC1uKSxyPWstbSxFPU1hdGguc3FydChxKnErcipyKSxxLz1FLHIvPUUscSo9SyxyKj1LLHM9LShuLXApLHQ9bS1vLEU9TWF0aC5zcXJ0KHMqcyt0KnQpLHMvPUUsdC89RSxzKj1LLHQqPUssdz0tcitsLSgtcituKSx4PS1xK20tKC1xK2spLHk9KC1xK2spKigtcituKS0oLXErbSkqKC1yK2wpLHo9LXQrcC0oLXQrbiksQT0tcyttLSgtcytvKSxCPSgtcytvKSooLXQrbiktKC1zK20pKigtdCtwKSxDPXcqQS16KngsTWF0aC5hYnMoQyk8LjE/KEMrPTEwLjEsRi5wdXNoKG0tcSxuLXIsTixPLFAsTSksRi5wdXNoKG0rcSxuK3IsTixPLFAsTSkpOihpPSh4KkItQSp5KS9DLGo9KHoqeS13KkIpL0MsRD0oaS1tKSooaS1tKSsoai1uKSsoai1uKSxEPjE5NjAwPyh1PXEtcyx2PXItdCxFPU1hdGguc3FydCh1KnUrdip2KSx1Lz1FLHYvPUUsdSo9Syx2Kj1LLEYucHVzaChtLXUsbi12KSxGLnB1c2goTixPLFAsTSksRi5wdXNoKG0rdSxuK3YpLEYucHVzaChOLE8sUCxNKSxGLnB1c2gobS11LG4tdiksRi5wdXNoKE4sTyxQLE0pLEkrKyk6KEYucHVzaChpLGopLEYucHVzaChOLE8sUCxNKSxGLnB1c2gobS0oaS1tKSxuLShqLW4pKSxGLnB1c2goTixPLFAsTSkpKTtmb3Ioaz1kWzIqKEgtMildLGw9ZFsyKihILTIpKzFdLG09ZFsyKihILTEpXSxuPWRbMiooSC0xKSsxXSxxPS0obC1uKSxyPWstbSxFPU1hdGguc3FydChxKnErcipyKSxxLz1FLHIvPUUscSo9SyxyKj1LLEYucHVzaChtLXEsbi1yKSxGLnB1c2goTixPLFAsTSksRi5wdXNoKG0rcSxuK3IpLEYucHVzaChOLE8sUCxNKSxHLnB1c2goSiksYz0wO0k+YztjKyspRy5wdXNoKEorKyk7Ry5wdXNoKEotMSl9fSxleHBvcnRzLmJ1aWxkUG9seT1mdW5jdGlvbihhLGIpe3ZhciBjPWEucG9pbnRzO2lmKCEoYy5sZW5ndGg8Nikpe3ZhciBkPWIucG9pbnRzLGU9Yi5pbmRpY2VzLGY9Yy5sZW5ndGgvMixnPWhleDJyZ2IoYS5maWxsQ29sb3IpLGg9YS5maWxsQWxwaGEsaT1nWzBdKmgsaj1nWzFdKmgsaz1nWzJdKmgsbD10cmlhbmd1bGF0ZShjKSxtPWQubGVuZ3RoLzYsbj0wO2ZvcihuPTA7bjxsLmxlbmd0aDtuKz0zKWUucHVzaChsW25dK20pLGUucHVzaChsW25dK20pLGUucHVzaChsW24rMV0rbSksZS5wdXNoKGxbbisyXSttKSxlLnB1c2gobFtuKzJdK20pO2ZvcihuPTA7Zj5uO24rKylkLnB1c2goY1syKm5dLGNbMipuKzFdLGksaixrLGgpfX07IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7dmFyIGdsb2JhbHM9cmVxdWlyZShcIi4uLy4uL2NvcmUvZ2xvYmFsc1wiKSxQcmltaXRpdmVTaGFkZXI9cmVxdWlyZShcIi4vUHJpbWl0aXZlU2hhZGVyXCIpLFN0cmlwU2hhZGVyPXJlcXVpcmUoXCIuL1N0cmlwU2hhZGVyXCIpLFBpeGlTaGFkZXI9cmVxdWlyZShcIi4vUGl4aVNoYWRlclwiKTtleHBvcnRzLmluaXREZWZhdWx0U2hhZGVycz1mdW5jdGlvbigpe2dsb2JhbHMucHJpbWl0aXZlU2hhZGVyPW5ldyBQcmltaXRpdmVTaGFkZXIsZ2xvYmFscy5wcmltaXRpdmVTaGFkZXIuaW5pdCgpLGdsb2JhbHMuc3RyaXBTaGFkZXI9bmV3IFN0cmlwU2hhZGVyLGdsb2JhbHMuc3RyaXBTaGFkZXIuaW5pdCgpLGdsb2JhbHMuZGVmYXVsdFNoYWRlcj1uZXcgUGl4aVNoYWRlcixnbG9iYWxzLmRlZmF1bHRTaGFkZXIuaW5pdCgpO3ZhciBhPWdsb2JhbHMuZ2wsYj1nbG9iYWxzLmRlZmF1bHRTaGFkZXIucHJvZ3JhbTthLnVzZVByb2dyYW0oYiksYS5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShnbG9iYWxzLmRlZmF1bHRTaGFkZXIuYVZlcnRleFBvc2l0aW9uKSxhLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMuZGVmYXVsdFNoYWRlci5jb2xvckF0dHJpYnV0ZSksYS5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShnbG9iYWxzLmRlZmF1bHRTaGFkZXIuYVRleHR1cmVDb29yZCl9LGV4cG9ydHMuYWN0aXZhdGVQcmltaXRpdmVTaGFkZXI9ZnVuY3Rpb24oKXt2YXIgYT1nbG9iYWxzLmdsO2EudXNlUHJvZ3JhbShnbG9iYWxzLnByaW1pdGl2ZVNoYWRlci5wcm9ncmFtKSxhLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheShnbG9iYWxzLmRlZmF1bHRTaGFkZXIuYVZlcnRleFBvc2l0aW9uKSxhLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheShnbG9iYWxzLmRlZmF1bHRTaGFkZXIuY29sb3JBdHRyaWJ1dGUpLGEuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMuZGVmYXVsdFNoYWRlci5hVGV4dHVyZUNvb3JkKSxhLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMucHJpbWl0aXZlU2hhZGVyLmFWZXJ0ZXhQb3NpdGlvbiksYS5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShnbG9iYWxzLnByaW1pdGl2ZVNoYWRlci5jb2xvckF0dHJpYnV0ZSl9LGV4cG9ydHMuZGVhY3RpdmF0ZVByaW1pdGl2ZVNoYWRlcj1mdW5jdGlvbigpe3ZhciBhPWdsb2JhbHMuZ2w7YS51c2VQcm9ncmFtKGdsb2JhbHMuZGVmYXVsdFNoYWRlci5wcm9ncmFtKSxhLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheShnbG9iYWxzLnByaW1pdGl2ZVNoYWRlci5hVmVydGV4UG9zaXRpb24pLGEuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMucHJpbWl0aXZlU2hhZGVyLmNvbG9yQXR0cmlidXRlKSxhLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMuZGVmYXVsdFNoYWRlci5hVmVydGV4UG9zaXRpb24pLGEuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoZ2xvYmFscy5kZWZhdWx0U2hhZGVyLmNvbG9yQXR0cmlidXRlKSxhLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMuZGVmYXVsdFNoYWRlci5hVGV4dHVyZUNvb3JkKX0sZXhwb3J0cy5hY3RpdmF0ZVN0cmlwU2hhZGVyPWZ1bmN0aW9uKCl7dmFyIGE9Z2xvYmFscy5nbDthLnVzZVByb2dyYW0oZ2xvYmFscy5zdHJpcFNoYWRlci5wcm9ncmFtKX0sZXhwb3J0cy5kZWFjdGl2YXRlU3RyaXBTaGFkZXI9ZnVuY3Rpb24oKXt2YXIgYT1nbG9iYWxzLmdsO2EudXNlUHJvZ3JhbShnbG9iYWxzLmRlZmF1bHRTaGFkZXIucHJvZ3JhbSl9OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEJpdG1hcFRleHQoYSxiKXtEaXNwbGF5T2JqZWN0Q29udGFpbmVyLmNhbGwodGhpcyksdGhpcy5zZXRUZXh0KGEpLHRoaXMuc2V0U3R5bGUoYiksdGhpcy51cGRhdGVUZXh0KCksdGhpcy5kaXJ0eT0hMX12YXIgRGlzcGxheU9iamVjdENvbnRhaW5lcj1yZXF1aXJlKFwiLi4vZGlzcGxheS9EaXNwbGF5T2JqZWN0Q29udGFpbmVyXCIpLFNwcml0ZT1yZXF1aXJlKFwiLi4vZGlzcGxheS9TcHJpdGVcIiksUG9pbnQ9cmVxdWlyZShcIi4uL2dlb20vUG9pbnRcIikscHJvdG89Qml0bWFwVGV4dC5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShEaXNwbGF5T2JqZWN0Q29udGFpbmVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOkJpdG1hcFRleHR9fSk7cHJvdG8uc2V0VGV4dD1mdW5jdGlvbihhKXt0aGlzLnRleHQ9YXx8XCIgXCIsdGhpcy5kaXJ0eT0hMH0scHJvdG8uc2V0U3R5bGU9ZnVuY3Rpb24oYSl7YT1hfHx7fSxhLmFsaWduPWEuYWxpZ258fFwibGVmdFwiLHRoaXMuc3R5bGU9YTt2YXIgYj1hLmZvbnQuc3BsaXQoXCIgXCIpO3RoaXMuZm9udE5hbWU9YltiLmxlbmd0aC0xXSx0aGlzLmZvbnRTaXplPWIubGVuZ3RoPj0yP3BhcnNlSW50KGJbYi5sZW5ndGgtMl0sMTApOkJpdG1hcFRleHQuZm9udHNbdGhpcy5mb250TmFtZV0uc2l6ZSx0aGlzLmRpcnR5PSEwfSxwcm90by51cGRhdGVUZXh0PWZ1bmN0aW9uKCl7Zm9yKHZhciBhPUJpdG1hcFRleHQuZm9udHNbdGhpcy5mb250TmFtZV0sYj1uZXcgUG9pbnQsYz1udWxsLGQ9W10sZT0wLGY9W10sZz0wLGg9dGhpcy5mb250U2l6ZS9hLnNpemUsaT0wO2k8dGhpcy50ZXh0Lmxlbmd0aDtpKyspe3ZhciBqPXRoaXMudGV4dC5jaGFyQ29kZUF0KGkpO2lmKC8oPzpcXHJcXG58XFxyfFxcbikvLnRlc3QodGhpcy50ZXh0LmNoYXJBdChpKSkpZi5wdXNoKGIueCksZT1NYXRoLm1heChlLGIueCksZysrLGIueD0wLGIueSs9YS5saW5lSGVpZ2h0LGM9bnVsbDtlbHNle3ZhciBrPWEuY2hhcnNbal07ayYmKGMmJmtbY10mJihiLngrPWsua2VybmluZ1tjXSksZC5wdXNoKHt0ZXh0dXJlOmsudGV4dHVyZSxsaW5lOmcsY2hhckNvZGU6aixwb3NpdGlvbjpuZXcgUG9pbnQoYi54K2sueE9mZnNldCxiLnkray55T2Zmc2V0KX0pLGIueCs9ay54QWR2YW5jZSxjPWopfX1mLnB1c2goYi54KSxlPU1hdGgubWF4KGUsYi54KTt2YXIgbD1bXTtmb3IoaT0wO2c+PWk7aSsrKXt2YXIgbT0wO1wicmlnaHRcIj09PXRoaXMuc3R5bGUuYWxpZ24/bT1lLWZbaV06XCJjZW50ZXJcIj09PXRoaXMuc3R5bGUuYWxpZ24mJihtPShlLWZbaV0pLzIpLGwucHVzaChtKX1mb3IoaT0wO2k8ZC5sZW5ndGg7aSsrKXt2YXIgbj1uZXcgU3ByaXRlKGRbaV0udGV4dHVyZSk7bi5wb3NpdGlvbi54PShkW2ldLnBvc2l0aW9uLngrbFtkW2ldLmxpbmVdKSpoLG4ucG9zaXRpb24ueT1kW2ldLnBvc2l0aW9uLnkqaCxuLnNjYWxlLng9bi5zY2FsZS55PWgsdGhpcy5hZGRDaGlsZChuKX10aGlzLndpZHRoPWUqaCx0aGlzLmhlaWdodD0oYi55K2EubGluZUhlaWdodCkqaH0scHJvdG8udXBkYXRlVHJhbnNmb3JtPWZ1bmN0aW9uKCl7aWYodGhpcy5kaXJ0eSl7Zm9yKDt0aGlzLmNoaWxkcmVuLmxlbmd0aD4wOyl0aGlzLnJlbW92ZUNoaWxkKHRoaXMuZ2V0Q2hpbGRBdCgwKSk7dGhpcy51cGRhdGVUZXh0KCksdGhpcy5kaXJ0eT0hMX1EaXNwbGF5T2JqZWN0Q29udGFpbmVyLnByb3RvdHlwZS51cGRhdGVUcmFuc2Zvcm0uY2FsbCh0aGlzKX0sQml0bWFwVGV4dC5mb250cz17fSxtb2R1bGUuZXhwb3J0cz1CaXRtYXBUZXh0OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFRleHQoYSxiKXt0aGlzLmNhbnZhcz1wbGF0Zm9ybS5jcmVhdGVDYW52YXMoKSx0aGlzLmNvbnRleHQ9dGhpcy5jYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpLFNwcml0ZS5jYWxsKHRoaXMsVGV4dHVyZS5mcm9tQ2FudmFzKHRoaXMuY2FudmFzKSksdGhpcy5zZXRUZXh0KGEpLHRoaXMuc2V0U3R5bGUoYiksdGhpcy51cGRhdGVUZXh0KCksdGhpcy5kaXJ0eT0hMX12YXIgcGxhdGZvcm09cmVxdWlyZShcIi4uL3BsYXRmb3JtXCIpLGdsb2JhbHM9cmVxdWlyZShcIi4uL2NvcmUvZ2xvYmFsc1wiKSxQb2ludD1yZXF1aXJlKFwiLi4vZ2VvbS9Qb2ludFwiKSxTcHJpdGU9cmVxdWlyZShcIi4uL2Rpc3BsYXkvU3ByaXRlXCIpLFRleHR1cmU9cmVxdWlyZShcIi4uL3RleHR1cmVzL1RleHR1cmVcIikscHJvdG89VGV4dC5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShTcHJpdGUucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6VGV4dH19KTtwcm90by5zZXRTdHlsZT1mdW5jdGlvbihhKXthPWF8fHt9LGEuZm9udD1hLmZvbnR8fFwiYm9sZCAyMHB0IEFyaWFsXCIsYS5maWxsPWEuZmlsbHx8XCJibGFja1wiLGEuYWxpZ249YS5hbGlnbnx8XCJsZWZ0XCIsYS5zdHJva2U9YS5zdHJva2V8fFwiYmxhY2tcIixhLnN0cm9rZVRoaWNrbmVzcz1hLnN0cm9rZVRoaWNrbmVzc3x8MCxhLndvcmRXcmFwPWEud29yZFdyYXB8fCExLGEud29yZFdyYXBXaWR0aD1hLndvcmRXcmFwV2lkdGh8fDEwMCx0aGlzLnN0eWxlPWEsdGhpcy5kaXJ0eT0hMH0scHJvdG8uc2V0VGV4dD1mdW5jdGlvbihhKXt0aGlzLnRleHQ9YS50b1N0cmluZygpfHxcIiBcIix0aGlzLmRpcnR5PSEwfSxwcm90by51cGRhdGVUZXh0PWZ1bmN0aW9uKCl7dGhpcy5jb250ZXh0LmZvbnQ9dGhpcy5zdHlsZS5mb250O3ZhciBhPXRoaXMudGV4dDt0aGlzLnN0eWxlLndvcmRXcmFwJiYoYT10aGlzLndvcmRXcmFwKHRoaXMudGV4dCkpO2Zvcih2YXIgYj1hLnNwbGl0KC8oPzpcXHJcXG58XFxyfFxcbikvKSxjPVtdLGQ9MCxlPTA7ZTxiLmxlbmd0aDtlKyspe3ZhciBmPXRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChiW2VdKS53aWR0aDtjW2VdPWYsZD1NYXRoLm1heChkLGYpfXRoaXMuY2FudmFzLndpZHRoPWQrdGhpcy5zdHlsZS5zdHJva2VUaGlja25lc3M7dmFyIGc9dGhpcy5kZXRlcm1pbmVGb250SGVpZ2h0KFwiZm9udDogXCIrdGhpcy5zdHlsZS5mb250K1wiO1wiKSt0aGlzLnN0eWxlLnN0cm9rZVRoaWNrbmVzcztmb3IodGhpcy5jYW52YXMuaGVpZ2h0PWcqYi5sZW5ndGgsdGhpcy5jb250ZXh0LmZpbGxTdHlsZT10aGlzLnN0eWxlLmZpbGwsdGhpcy5jb250ZXh0LmZvbnQ9dGhpcy5zdHlsZS5mb250LHRoaXMuY29udGV4dC5zdHJva2VTdHlsZT10aGlzLnN0eWxlLnN0cm9rZSx0aGlzLmNvbnRleHQubGluZVdpZHRoPXRoaXMuc3R5bGUuc3Ryb2tlVGhpY2tuZXNzLHRoaXMuY29udGV4dC50ZXh0QmFzZWxpbmU9XCJ0b3BcIixlPTA7ZTxiLmxlbmd0aDtlKyspe3ZhciBoPW5ldyBQb2ludCh0aGlzLnN0eWxlLnN0cm9rZVRoaWNrbmVzcy8yLHRoaXMuc3R5bGUuc3Ryb2tlVGhpY2tuZXNzLzIrZSpnKTtcInJpZ2h0XCI9PT10aGlzLnN0eWxlLmFsaWduP2gueCs9ZC1jW2VdOlwiY2VudGVyXCI9PT10aGlzLnN0eWxlLmFsaWduJiYoaC54Kz0oZC1jW2VdKS8yKSx0aGlzLnN0eWxlLnN0cm9rZSYmdGhpcy5zdHlsZS5zdHJva2VUaGlja25lc3MmJnRoaXMuY29udGV4dC5zdHJva2VUZXh0KGJbZV0saC54LGgueSksdGhpcy5zdHlsZS5maWxsJiZ0aGlzLmNvbnRleHQuZmlsbFRleHQoYltlXSxoLngsaC55KX10aGlzLnVwZGF0ZVRleHR1cmUoKX0scHJvdG8udXBkYXRlVGV4dHVyZT1mdW5jdGlvbigpe3RoaXMudGV4dHVyZS5iYXNlVGV4dHVyZS53aWR0aD10aGlzLmNhbnZhcy53aWR0aCx0aGlzLnRleHR1cmUuYmFzZVRleHR1cmUuaGVpZ2h0PXRoaXMuY2FudmFzLmhlaWdodCx0aGlzLnRleHR1cmUuZnJhbWUud2lkdGg9dGhpcy5jYW52YXMud2lkdGgsdGhpcy50ZXh0dXJlLmZyYW1lLmhlaWdodD10aGlzLmNhbnZhcy5oZWlnaHQsdGhpcy5fd2lkdGg9dGhpcy5jYW52YXMud2lkdGgsdGhpcy5faGVpZ2h0PXRoaXMuY2FudmFzLmhlaWdodCxnbG9iYWxzLnRleHR1cmVzVG9VcGRhdGUucHVzaCh0aGlzLnRleHR1cmUuYmFzZVRleHR1cmUpfSxwcm90by51cGRhdGVUcmFuc2Zvcm09ZnVuY3Rpb24oKXt0aGlzLmRpcnR5JiYodGhpcy51cGRhdGVUZXh0KCksdGhpcy5kaXJ0eT0hMSksU3ByaXRlLnByb3RvdHlwZS51cGRhdGVUcmFuc2Zvcm0uY2FsbCh0aGlzKX0scHJvdG8uZGV0ZXJtaW5lRm9udEhlaWdodD1mdW5jdGlvbihhKXt2YXIgYj1UZXh0LmhlaWdodENhY2hlW2FdO2lmKCFiKXt2YXIgYz1wbGF0Zm9ybS5kb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF0sZD1wbGF0Zm9ybS5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLGU9cGxhdGZvcm0uZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJNXCIpO2QuYXBwZW5kQ2hpbGQoZSksZC5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLGErXCI7cG9zaXRpb246YWJzb2x1dGU7dG9wOjA7bGVmdDowXCIpLGMuYXBwZW5kQ2hpbGQoZCksYj1kLm9mZnNldEhlaWdodCxUZXh0LmhlaWdodENhY2hlW2FdPWIsYy5yZW1vdmVDaGlsZChkKX1yZXR1cm4gYn0scHJvdG8ud29yZFdyYXA9ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPVwiXCIsYz1hLnNwbGl0KFwiXFxuXCIpLGQ9MDtkPGMubGVuZ3RoO2QrKyl7Zm9yKHZhciBlPXRoaXMuc3R5bGUud29yZFdyYXBXaWR0aCxmPWNbZF0uc3BsaXQoXCIgXCIpLGc9MDtnPGYubGVuZ3RoO2crKyl7dmFyIGg9dGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KGZbZ10pLndpZHRoLGk9aCt0aGlzLmNvbnRleHQubWVhc3VyZVRleHQoXCIgXCIpLndpZHRoO2k+ZT8oZz4wJiYoYis9XCJcXG5cIiksYis9ZltnXStcIiBcIixlPXRoaXMuc3R5bGUud29yZFdyYXBXaWR0aC1oKTooZS09aSxiKz1mW2ddK1wiIFwiKX1iKz1cIlxcblwifXJldHVybiBifSxwcm90by5kZXN0cm95PWZ1bmN0aW9uKGEpe2EmJnRoaXMudGV4dHVyZS5kZXN0cm95KCl9LFRleHQuaGVpZ2h0Q2FjaGU9e30sbW9kdWxlLmV4cG9ydHM9VGV4dDsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBCYXNlVGV4dHVyZShhLGIpe2lmKEV2ZW50VGFyZ2V0LmNhbGwodGhpcyksdGhpcy53aWR0aD0xMDAsdGhpcy5oZWlnaHQ9MTAwLHRoaXMuc2NhbGVNb2RlPWJ8fEJhc2VUZXh0dXJlLlNDQUxFX01PREUuREVGQVVMVCx0aGlzLmhhc0xvYWRlZD0hMSx0aGlzLnNvdXJjZT1hLGEpe2lmKFwiY29tcGxldGVcImluIHRoaXMuc291cmNlKWlmKHRoaXMuc291cmNlLmNvbXBsZXRlKXRoaXMuaGFzTG9hZGVkPSEwLHRoaXMud2lkdGg9dGhpcy5zb3VyY2Uud2lkdGgsdGhpcy5oZWlnaHQ9dGhpcy5zb3VyY2UuaGVpZ2h0LGdsb2JhbHMudGV4dHVyZXNUb1VwZGF0ZS5wdXNoKHRoaXMpO2Vsc2V7dmFyIGM9dGhpczt0aGlzLnNvdXJjZS5vbmxvYWQ9ZnVuY3Rpb24oKXtjLmhhc0xvYWRlZD0hMCxjLndpZHRoPWMuc291cmNlLndpZHRoLGMuaGVpZ2h0PWMuc291cmNlLmhlaWdodCxnbG9iYWxzLnRleHR1cmVzVG9VcGRhdGUucHVzaChjKSxjLmRpc3BhdGNoRXZlbnQoe3R5cGU6XCJsb2FkZWRcIixjb250ZW50OmN9KX19ZWxzZSB0aGlzLmhhc0xvYWRlZD0hMCx0aGlzLndpZHRoPXRoaXMuc291cmNlLndpZHRoLHRoaXMuaGVpZ2h0PXRoaXMuc291cmNlLmhlaWdodCxnbG9iYWxzLnRleHR1cmVzVG9VcGRhdGUucHVzaCh0aGlzKTt0aGlzLmltYWdlVXJsPW51bGwsdGhpcy5fcG93ZXJPZjI9ITF9fXZhciBwbGF0Zm9ybT1yZXF1aXJlKFwiLi4vcGxhdGZvcm1cIiksZ2xvYmFscz1yZXF1aXJlKFwiLi4vY29yZS9nbG9iYWxzXCIpLEV2ZW50VGFyZ2V0PXJlcXVpcmUoXCIuLi9ldmVudHMvRXZlbnRUYXJnZXRcIiksYmFzZVRleHR1cmVDYWNoZT17fSxwcm90bz1CYXNlVGV4dHVyZS5wcm90b3R5cGU7cHJvdG8uZGVzdHJveT1mdW5jdGlvbigpe3RoaXMuc291cmNlLnNyYyYmKHRoaXMuaW1hZ2VVcmwgaW4gYmFzZVRleHR1cmVDYWNoZSYmZGVsZXRlIGJhc2VUZXh0dXJlQ2FjaGVbdGhpcy5pbWFnZVVybF0sdGhpcy5pbWFnZVVybD1udWxsLHRoaXMuc291cmNlLnNyYz1udWxsKSx0aGlzLnNvdXJjZT1udWxsLGdsb2JhbHMudGV4dHVyZXNUb0Rlc3Ryb3kucHVzaCh0aGlzKX0scHJvdG8udXBkYXRlU291cmNlSW1hZ2U9ZnVuY3Rpb24oYSl7dGhpcy5oYXNMb2FkZWQ9ITEsdGhpcy5zb3VyY2Uuc3JjPW51bGwsdGhpcy5zb3VyY2Uuc3JjPWF9LEJhc2VUZXh0dXJlLmZyb21JbWFnZT1mdW5jdGlvbihhLGIsYyl7dmFyIGQ9YmFzZVRleHR1cmVDYWNoZVthXTtpZighZCl7dmFyIGU9bmV3IHBsYXRmb3JtLmNyZWF0ZUltYWdlO2ImJihlLmNyb3NzT3JpZ2luPVwiXCIpLGUuc3JjPWEsZD1uZXcgQmFzZVRleHR1cmUoZSxjKSxkLmltYWdlVXJsPWEsYmFzZVRleHR1cmVDYWNoZVthXT1kfXJldHVybiBkfSxCYXNlVGV4dHVyZS5TQ0FMRV9NT0RFPXtERUZBVUxUOjAsTElORUFSOjAsTkVBUkVTVDoxfSxtb2R1bGUuZXhwb3J0cz1CYXNlVGV4dHVyZTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBSZW5kZXJUZXh0dXJlKGEsYil7RXZlbnRUYXJnZXQuY2FsbCh0aGlzKSx0aGlzLndpZHRoPWF8fDEwMCx0aGlzLmhlaWdodD1ifHwxMDAsdGhpcy5pZGVudGl0eU1hdHJpeD1tYXQzLmNyZWF0ZSgpLHRoaXMuZnJhbWU9bmV3IFJlY3RhbmdsZSgwLDAsdGhpcy53aWR0aCx0aGlzLmhlaWdodCksZ2xvYmFscy5nbD90aGlzLmluaXRXZWJHTCgpOnRoaXMuaW5pdENhbnZhcygpfXZhciBnbG9iYWxzPXJlcXVpcmUoXCIuLi9jb3JlL2dsb2JhbHNcIiksbWF0Mz1yZXF1aXJlKFwiLi4vZ2VvbS9tYXRyaXhcIikubWF0MyxUZXh0dXJlPXJlcXVpcmUoXCIuL1RleHR1cmVcIiksQmFzZVRleHR1cmU9cmVxdWlyZShcIi4vQmFzZVRleHR1cmVcIiksUG9pbnQ9cmVxdWlyZShcIi4uL2dlb20vUG9pbnRcIiksUmVjdGFuZ2xlPXJlcXVpcmUoXCIuLi9nZW9tL1JlY3RhbmdsZVwiKSxFdmVudFRhcmdldD1yZXF1aXJlKFwiLi4vZXZlbnRzL0V2ZW50VGFyZ2V0XCIpLENhbnZhc1JlbmRlcmVyPXJlcXVpcmUoXCIuLi9yZW5kZXJlcnMvY2FudmFzL0NhbnZhc1JlbmRlcmVyXCIpLFdlYkdMUmVuZGVyR3JvdXA9cmVxdWlyZShcIi4uL3JlbmRlcmVycy93ZWJnbC9XZWJHTFJlbmRlckdyb3VwXCIpLHByb3RvPVJlbmRlclRleHR1cmUucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoVGV4dHVyZS5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpSZW5kZXJUZXh0dXJlfX0pO3Byb3RvLmluaXRXZWJHTD1mdW5jdGlvbigpe3ZhciBhPWdsb2JhbHMuZ2w7dGhpcy5nbEZyYW1lYnVmZmVyPWEuY3JlYXRlRnJhbWVidWZmZXIoKSxhLmJpbmRGcmFtZWJ1ZmZlcihhLkZSQU1FQlVGRkVSLHRoaXMuZ2xGcmFtZWJ1ZmZlciksdGhpcy5nbEZyYW1lYnVmZmVyLndpZHRoPXRoaXMud2lkdGgsdGhpcy5nbEZyYW1lYnVmZmVyLmhlaWdodD10aGlzLmhlaWdodCx0aGlzLmJhc2VUZXh0dXJlPW5ldyBCYXNlVGV4dHVyZSx0aGlzLmJhc2VUZXh0dXJlLndpZHRoPXRoaXMud2lkdGgsdGhpcy5iYXNlVGV4dHVyZS5oZWlnaHQ9dGhpcy5oZWlnaHQsdGhpcy5iYXNlVGV4dHVyZS5fZ2xUZXh0dXJlPWEuY3JlYXRlVGV4dHVyZSgpLGEuYmluZFRleHR1cmUoYS5URVhUVVJFXzJELHRoaXMuYmFzZVRleHR1cmUuX2dsVGV4dHVyZSksYS50ZXhJbWFnZTJEKGEuVEVYVFVSRV8yRCwwLGEuUkdCQSx0aGlzLndpZHRoLHRoaXMuaGVpZ2h0LDAsYS5SR0JBLGEuVU5TSUdORURfQllURSxudWxsKSxhLnRleFBhcmFtZXRlcmkoYS5URVhUVVJFXzJELGEuVEVYVFVSRV9NQUdfRklMVEVSLGEuTElORUFSKSxhLnRleFBhcmFtZXRlcmkoYS5URVhUVVJFXzJELGEuVEVYVFVSRV9NSU5fRklMVEVSLGEuTElORUFSKSxhLnRleFBhcmFtZXRlcmkoYS5URVhUVVJFXzJELGEuVEVYVFVSRV9XUkFQX1MsYS5DTEFNUF9UT19FREdFKSxhLnRleFBhcmFtZXRlcmkoYS5URVhUVVJFXzJELGEuVEVYVFVSRV9XUkFQX1QsYS5DTEFNUF9UT19FREdFKSx0aGlzLmJhc2VUZXh0dXJlLmlzUmVuZGVyPSEwLGEuYmluZEZyYW1lYnVmZmVyKGEuRlJBTUVCVUZGRVIsdGhpcy5nbEZyYW1lYnVmZmVyKSxhLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGEuRlJBTUVCVUZGRVIsYS5DT0xPUl9BVFRBQ0hNRU5UMCxhLlRFWFRVUkVfMkQsdGhpcy5iYXNlVGV4dHVyZS5fZ2xUZXh0dXJlLDApLHRoaXMucHJvamVjdGlvbj1uZXcgUG9pbnQodGhpcy53aWR0aC8yLC10aGlzLmhlaWdodC8yKSx0aGlzLnJlbmRlcj10aGlzLnJlbmRlcldlYkdMfSxwcm90by5yZXNpemU9ZnVuY3Rpb24oYSxiKXtpZih0aGlzLndpZHRoPWEsdGhpcy5oZWlnaHQ9YixnbG9iYWxzLmdsKXt0aGlzLnByb2plY3Rpb24ueD10aGlzLndpZHRoLzIsdGhpcy5wcm9qZWN0aW9uLnk9LXRoaXMuaGVpZ2h0LzI7dmFyIGM9Z2xvYmFscy5nbDtjLmJpbmRUZXh0dXJlKGMuVEVYVFVSRV8yRCx0aGlzLmJhc2VUZXh0dXJlLl9nbFRleHR1cmUpLGMudGV4SW1hZ2UyRChjLlRFWFRVUkVfMkQsMCxjLlJHQkEsdGhpcy53aWR0aCx0aGlzLmhlaWdodCwwLGMuUkdCQSxjLlVOU0lHTkVEX0JZVEUsbnVsbCl9ZWxzZSB0aGlzLmZyYW1lLndpZHRoPXRoaXMud2lkdGgsdGhpcy5mcmFtZS5oZWlnaHQ9dGhpcy5oZWlnaHQsdGhpcy5yZW5kZXJlci5yZXNpemUodGhpcy53aWR0aCx0aGlzLmhlaWdodCl9LHByb3RvLmluaXRDYW52YXM9ZnVuY3Rpb24oKXt0aGlzLnJlbmRlcmVyPW5ldyBDYW52YXNSZW5kZXJlcih0aGlzLndpZHRoLHRoaXMuaGVpZ2h0LG51bGwsMCksdGhpcy5iYXNlVGV4dHVyZT1uZXcgQmFzZVRleHR1cmUodGhpcy5yZW5kZXJlci52aWV3KSx0aGlzLmZyYW1lPW5ldyBSZWN0YW5nbGUoMCwwLHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpLHRoaXMucmVuZGVyPXRoaXMucmVuZGVyQ2FudmFzfSxwcm90by5yZW5kZXJXZWJHTD1mdW5jdGlvbihhLGIsYyl7dmFyIGQ9Z2xvYmFscy5nbDtkLmNvbG9yTWFzayghMCwhMCwhMCwhMCksZC52aWV3cG9ydCgwLDAsdGhpcy53aWR0aCx0aGlzLmhlaWdodCksZC5iaW5kRnJhbWVidWZmZXIoZC5GUkFNRUJVRkZFUix0aGlzLmdsRnJhbWVidWZmZXIpLGMmJihkLmNsZWFyQ29sb3IoMCwwLDAsMCksZC5jbGVhcihkLkNPTE9SX0JVRkZFUl9CSVQpKTt2YXIgZT1hLmNoaWxkcmVuLGY9YS53b3JsZFRyYW5zZm9ybTthLndvcmxkVHJhbnNmb3JtPW1hdDMuY3JlYXRlKCksYS53b3JsZFRyYW5zZm9ybVs0XT0tMSxhLndvcmxkVHJhbnNmb3JtWzVdPS0yKnRoaXMucHJvamVjdGlvbi55LGImJihhLndvcmxkVHJhbnNmb3JtWzJdPWIueCxhLndvcmxkVHJhbnNmb3JtWzVdLT1iLnkpLGdsb2JhbHMudmlzaWJsZUNvdW50KyssYS52Y291bnQ9Z2xvYmFscy52aXNpYmxlQ291bnQ7Zm9yKHZhciBnPTAsaD1lLmxlbmd0aDtoPmc7ZysrKWVbZ10udXBkYXRlVHJhbnNmb3JtKCk7dmFyIGk9YS5fX3JlbmRlckdyb3VwO2k/YT09PWkucm9vdD9pLnJlbmRlcih0aGlzLnByb2plY3Rpb24sdGhpcy5nbEZyYW1lYnVmZmVyKTppLnJlbmRlclNwZWNpZmljKGEsdGhpcy5wcm9qZWN0aW9uLHRoaXMuZ2xGcmFtZWJ1ZmZlcik6KHRoaXMucmVuZGVyR3JvdXB8fCh0aGlzLnJlbmRlckdyb3VwPW5ldyBXZWJHTFJlbmRlckdyb3VwKGQpKSx0aGlzLnJlbmRlckdyb3VwLnNldFJlbmRlcmFibGUoYSksdGhpcy5yZW5kZXJHcm91cC5yZW5kZXIodGhpcy5wcm9qZWN0aW9uLHRoaXMuZ2xGcmFtZWJ1ZmZlcikpLGEud29ybGRUcmFuc2Zvcm09Zn0scHJvdG8ucmVuZGVyQ2FudmFzPWZ1bmN0aW9uKGEsYixjKXt2YXIgZD1hLmNoaWxkcmVuO2Eud29ybGRUcmFuc2Zvcm09bWF0My5jcmVhdGUoKSxiJiYoYS53b3JsZFRyYW5zZm9ybVsyXT1iLngsYS53b3JsZFRyYW5zZm9ybVs1XT1iLnkpO2Zvcih2YXIgZT0wLGY9ZC5sZW5ndGg7Zj5lO2UrKylkW2VdLnVwZGF0ZVRyYW5zZm9ybSgpO2MmJnRoaXMucmVuZGVyZXIuY29udGV4dC5jbGVhclJlY3QoMCwwLHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpLHRoaXMucmVuZGVyZXIucmVuZGVyRGlzcGxheU9iamVjdChhKSx0aGlzLnJlbmRlcmVyLmNvbnRleHQuc2V0VHJhbnNmb3JtKDEsMCwwLDEsMCwwKX0sbW9kdWxlLmV4cG9ydHM9UmVuZGVyVGV4dHVyZTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBUZXh0dXJlKGEsYil7aWYoRXZlbnRUYXJnZXQuY2FsbCh0aGlzKSxifHwodGhpcy5ub0ZyYW1lPSEwLGI9bmV3IFJlY3RhbmdsZSgwLDAsMSwxKSksYSBpbnN0YW5jZW9mIFRleHR1cmUmJihhPWEuYmFzZVRleHR1cmUpLHRoaXMuYmFzZVRleHR1cmU9YSx0aGlzLmZyYW1lPWIsdGhpcy50cmltPW5ldyBQb2ludCx0aGlzLnNjb3BlPXRoaXMsYS5oYXNMb2FkZWQpdGhpcy5ub0ZyYW1lJiYoYj1uZXcgUmVjdGFuZ2xlKDAsMCxhLndpZHRoLGEuaGVpZ2h0KSksdGhpcy5zZXRGcmFtZShiKTtlbHNle3ZhciBjPXRoaXM7YS5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkXCIsZnVuY3Rpb24oKXtjLm9uQmFzZVRleHR1cmVMb2FkZWQoKX0pfX12YXIgQmFzZVRleHR1cmU9cmVxdWlyZShcIi4vQmFzZVRleHR1cmVcIiksUG9pbnQ9cmVxdWlyZShcIi4uL2dlb20vUG9pbnRcIiksUmVjdGFuZ2xlPXJlcXVpcmUoXCIuLi9nZW9tL1JlY3RhbmdsZVwiKSxFdmVudFRhcmdldD1yZXF1aXJlKFwiLi4vZXZlbnRzL0V2ZW50VGFyZ2V0XCIpLHByb3RvPVRleHR1cmUucHJvdG90eXBlO3Byb3RvLm9uQmFzZVRleHR1cmVMb2FkZWQ9ZnVuY3Rpb24oKXt2YXIgYT10aGlzLmJhc2VUZXh0dXJlO2EucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImxvYWRlZFwiLHRoaXMub25Mb2FkZWQpLHRoaXMubm9GcmFtZSYmKHRoaXMuZnJhbWU9bmV3IFJlY3RhbmdsZSgwLDAsYS53aWR0aCxhLmhlaWdodCkpLHRoaXMubm9GcmFtZT0hMSx0aGlzLndpZHRoPXRoaXMuZnJhbWUud2lkdGgsdGhpcy5oZWlnaHQ9dGhpcy5mcmFtZS5oZWlnaHQsdGhpcy5zY29wZS5kaXNwYXRjaEV2ZW50KHt0eXBlOlwidXBkYXRlXCIsY29udGVudDp0aGlzfSl9LHByb3RvLmRlc3Ryb3k9ZnVuY3Rpb24oYSl7YSYmdGhpcy5iYXNlVGV4dHVyZS5kZXN0cm95KCl9LHByb3RvLnNldEZyYW1lPWZ1bmN0aW9uKGEpe2lmKHRoaXMuZnJhbWU9YSx0aGlzLndpZHRoPWEud2lkdGgsdGhpcy5oZWlnaHQ9YS5oZWlnaHQsYS54K2Eud2lkdGg+dGhpcy5iYXNlVGV4dHVyZS53aWR0aHx8YS55K2EuaGVpZ2h0PnRoaXMuYmFzZVRleHR1cmUuaGVpZ2h0KXRocm93IG5ldyBFcnJvcihcIlRleHR1cmUgRXJyb3I6IGZyYW1lIGRvZXMgbm90IGZpdCBpbnNpZGUgdGhlIGJhc2UgVGV4dHVyZSBkaW1lbnNpb25zIFwiK3RoaXMpO3RoaXMudXBkYXRlRnJhbWU9ITAsVGV4dHVyZS5mcmFtZVVwZGF0ZXMucHVzaCh0aGlzKX0sVGV4dHVyZS5mcm9tSW1hZ2U9ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPVRleHR1cmUuY2FjaGVbYV07cmV0dXJuIGR8fChkPW5ldyBUZXh0dXJlKEJhc2VUZXh0dXJlLmZyb21JbWFnZShhLGIsYykpLFRleHR1cmUuY2FjaGVbYV09ZCksZH0sVGV4dHVyZS5mcm9tRnJhbWU9ZnVuY3Rpb24oYSl7dmFyIGI9VGV4dHVyZS5jYWNoZVthXTtpZighYil0aHJvdyBuZXcgRXJyb3IoJ1RoZSBmcmFtZUlkIFwiJythKydcIiBkb2VzIG5vdCBleGlzdCBpbiB0aGUgdGV4dHVyZSBjYWNoZSAnK3RoaXMpO3JldHVybiBifSxUZXh0dXJlLmZyb21DYW52YXM9ZnVuY3Rpb24oYSxiKXt2YXIgYz1uZXcgQmFzZVRleHR1cmUoYSxiKTtyZXR1cm4gbmV3IFRleHR1cmUoYyl9LFRleHR1cmUuYWRkVGV4dHVyZVRvQ2FjaGU9ZnVuY3Rpb24oYSxiKXtUZXh0dXJlLmNhY2hlW2JdPWF9LFRleHR1cmUucmVtb3ZlVGV4dHVyZUZyb21DYWNoZT1mdW5jdGlvbihhKXt2YXIgYj1UZXh0dXJlLmNhY2hlW2FdO3JldHVybiBUZXh0dXJlLmNhY2hlW2FdPW51bGwsYn0sVGV4dHVyZS5jYWNoZT17fSxUZXh0dXJlLmZyYW1lVXBkYXRlcz1bXSxUZXh0dXJlLlNDQUxFX01PREU9QmFzZVRleHR1cmUuU0NBTEVfTU9ERSxtb2R1bGUuZXhwb3J0cz1UZXh0dXJlOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIHBvaW50SW5UcmlhbmdsZShhLGIsYyxkLGUsZixnLGgpe3ZhciBpPWctYyxqPWgtZCxrPWUtYyxsPWYtZCxtPWEtYyxuPWItZCxvPWkqaStqKmoscD1pKmsraipsLHE9aSptK2oqbixyPWsqaytsKmwscz1rKm0rbCpuLHQ9MS8obypyLXAqcCksdT0ocipxLXAqcykqdCx2PShvKnMtcCpxKSp0O3JldHVybiB1Pj0wJiZ2Pj0wJiYxPnUrdn1mdW5jdGlvbiBjb252ZXgoYSxiLGMsZCxlLGYsZyl7cmV0dXJuKGItZCkqKGUtYykrKGMtYSkqKGYtZCk+PTA9PT1nfXZhciBwbGF0Zm9ybT1yZXF1aXJlKFwiLi4vcGxhdGZvcm1cIik7ZXhwb3J0cy50cmlhbmd1bGF0ZT1mdW5jdGlvbihhKXt2YXIgYj0hMCxjPWEubGVuZ3RoPj4xO2lmKDM+YylyZXR1cm5bXTtmb3IodmFyIGQ9W10sZT1bXSxmPTA7Yz5mO2YrKyllLnB1c2goZik7Zj0wO2Zvcih2YXIgZz1jO2c+Mzspe3ZhciBoPWVbKGYrMCklZ10saT1lWyhmKzEpJWddLGo9ZVsoZisyKSVnXSxrPWFbMipoXSxsPWFbMipoKzFdLG09YVsyKmldLG49YVsyKmkrMV0sbz1hWzIqal0scD1hWzIqaisxXSxxPSExO2lmKGNvbnZleChrLGwsbSxuLG8scCxiKSl7cT0hMDtmb3IodmFyIHI9MDtnPnI7cisrKXt2YXIgcz1lW3JdO2lmKHMhPT1oJiZzIT09aSYmcyE9PWomJnBvaW50SW5UcmlhbmdsZShhWzIqc10sYVsyKnMrMV0sayxsLG0sbixvLHApKXtxPSExO2JyZWFrfX19aWYocSlkLnB1c2goaCxpLGopLGUuc3BsaWNlKChmKzEpJWcsMSksZy0tLGY9MDtlbHNlIGlmKGYrKz4zKmcpe2lmKCFiKXJldHVybiBwbGF0Zm9ybS5jb25zb2xlLndhcm4oXCJQSVhJIFdhcm5pbmc6IHNoYXBlIHRvbyBjb21wbGV4IHRvIGZpbGxcIiksW107Zm9yKGQ9W10sZT1bXSxmPTA7Yz5mO2YrKyllLnB1c2goZik7Zj0wLGc9YyxiPSExfX1yZXR1cm4gZC5wdXNoKGVbMF0sZVsxXSxlWzJdKSxkfTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjt2YXIgcGxhdGZvcm09cmVxdWlyZShcIi4uL3BsYXRmb3JtXCIpLENhbnZhc1JlbmRlcmVyPXJlcXVpcmUoXCIuLi9yZW5kZXJlcnMvY2FudmFzL0NhbnZhc1JlbmRlcmVyXCIpLFdlYkdMUmVuZGVyZXI9cmVxdWlyZShcIi4uL3JlbmRlcmVycy93ZWJnbC9XZWJHTFJlbmRlcmVyXCIpO21vZHVsZS5leHBvcnRzPWZ1bmN0aW9uKGEsYixjLGQsZSl7YXx8KGE9ODAwKSxifHwoYj02MDApO3ZhciBmPWZ1bmN0aW9uKCl7dHJ5e3ZhciBhPXBsYXRmb3JtLmNyZWF0ZUNhbnZhcygpO3JldHVybiEhcGxhdGZvcm0ud2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dCYmKGEuZ2V0Q29udGV4dChcIndlYmdsXCIpfHxhLmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIikpfWNhdGNoKGIpe3JldHVybiExfX0oKTtpZihmJiZwbGF0Zm9ybS5uYXZpZ2F0b3Ipe3ZhciBnPS0xIT09cGxhdGZvcm0ubmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJ0cmlkZW50XCIpO2Y9IWd9cmV0dXJuIGY/bmV3IFdlYkdMUmVuZGVyZXIoYSxiLGMsZCxlKTpuZXcgQ2FudmFzUmVuZGVyZXIoYSxiLGMsZCl9OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2V4cG9ydHMuaGV4MnJnYj1mdW5jdGlvbihhKXtyZXR1cm5bKGE+PjE2JjI1NSkvMjU1LChhPj44JjI1NSkvMjU1LCgyNTUmYSkvMjU1XX07IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gbG9nR3JvdXAoYSl7dmFyIGI9cGxhdGZvcm0uY29uc29sZTtiLmdyb3VwQ29sbGFwc2VkP2IuZ3JvdXBDb2xsYXBzZWQoYSk6Yi5ncm91cD9iLmdyb3VwKGEpOmIubG9nKGErXCIgPj4+Pj4+Pj4+XCIpfWZ1bmN0aW9uIGxvZ0dyb3VwRW5kKGEpe3ZhciBiPXBsYXRmb3JtLmNvbnNvbGU7Yi5ncm91cEVuZD9iLmdyb3VwRW5kKGEpOmIubG9nKGErXCIgX19fX19fX19fXCIpfXZhciBwbGF0Zm9ybT1yZXF1aXJlKFwiLi4vcGxhdGZvcm1cIik7ZXhwb3J0cy5ydW5MaXN0PWZ1bmN0aW9uKGEsYil7dmFyIGM9MCxkPWEuZmlyc3Q7Zm9yKGI9XCJwaXhpLnJ1bkxpc3RcIisoYj9cIihcIitiK1wiKVwiOlwiXCIpLGxvZ0dyb3VwKGIpLHBsYXRmb3JtLmNvbnNvbGUubG9nKGQpO2QuX2lOZXh0OylpZihjKyssZD1kLl9pTmV4dCxwbGF0Zm9ybS5jb25zb2xlLmxvZyhkKSxjPjEwMCl7cGxhdGZvcm0uY29uc29sZS5sb2coXCJCUkVBS1wiKTticmVha31sb2dHcm91cEVuZChiKX07IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7dmFyIHNwaW5lPW1vZHVsZS5leHBvcnRzPXt9O3NwaW5lLkJvbmVEYXRhPWZ1bmN0aW9uKGEsYil7dGhpcy5uYW1lPWEsdGhpcy5wYXJlbnQ9Yn0sc3BpbmUuQm9uZURhdGEucHJvdG90eXBlPXtsZW5ndGg6MCx4OjAseTowLHJvdGF0aW9uOjAsc2NhbGVYOjEsc2NhbGVZOjF9LHNwaW5lLlNsb3REYXRhPWZ1bmN0aW9uKGEsYil7dGhpcy5uYW1lPWEsdGhpcy5ib25lRGF0YT1ifSxzcGluZS5TbG90RGF0YS5wcm90b3R5cGU9e3I6MSxnOjEsYjoxLGE6MSxhdHRhY2htZW50TmFtZTpudWxsfSxzcGluZS5Cb25lPWZ1bmN0aW9uKGEsYil7dGhpcy5kYXRhPWEsdGhpcy5wYXJlbnQ9Yix0aGlzLnNldFRvU2V0dXBQb3NlKCl9LHNwaW5lLkJvbmUueURvd249ITEsc3BpbmUuQm9uZS5wcm90b3R5cGU9e3g6MCx5OjAscm90YXRpb246MCxzY2FsZVg6MSxzY2FsZVk6MSxtMDA6MCxtMDE6MCx3b3JsZFg6MCxtMTA6MCxtMTE6MCx3b3JsZFk6MCx3b3JsZFJvdGF0aW9uOjAsd29ybGRTY2FsZVg6MSx3b3JsZFNjYWxlWToxLHVwZGF0ZVdvcmxkVHJhbnNmb3JtOmZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcy5wYXJlbnQ7bnVsbCE9Yz8odGhpcy53b3JsZFg9dGhpcy54KmMubTAwK3RoaXMueSpjLm0wMStjLndvcmxkWCx0aGlzLndvcmxkWT10aGlzLngqYy5tMTArdGhpcy55KmMubTExK2Mud29ybGRZLHRoaXMud29ybGRTY2FsZVg9Yy53b3JsZFNjYWxlWCp0aGlzLnNjYWxlWCx0aGlzLndvcmxkU2NhbGVZPWMud29ybGRTY2FsZVkqdGhpcy5zY2FsZVksdGhpcy53b3JsZFJvdGF0aW9uPWMud29ybGRSb3RhdGlvbit0aGlzLnJvdGF0aW9uKToodGhpcy53b3JsZFg9dGhpcy54LHRoaXMud29ybGRZPXRoaXMueSx0aGlzLndvcmxkU2NhbGVYPXRoaXMuc2NhbGVYLHRoaXMud29ybGRTY2FsZVk9dGhpcy5zY2FsZVksdGhpcy53b3JsZFJvdGF0aW9uPXRoaXMucm90YXRpb24pO3ZhciBkPXRoaXMud29ybGRSb3RhdGlvbipNYXRoLlBJLzE4MCxlPU1hdGguY29zKGQpLGY9TWF0aC5zaW4oZCk7dGhpcy5tMDA9ZSp0aGlzLndvcmxkU2NhbGVYLHRoaXMubTEwPWYqdGhpcy53b3JsZFNjYWxlWCx0aGlzLm0wMT0tZip0aGlzLndvcmxkU2NhbGVZLHRoaXMubTExPWUqdGhpcy53b3JsZFNjYWxlWSxhJiYodGhpcy5tMDA9LXRoaXMubTAwLHRoaXMubTAxPS10aGlzLm0wMSksYiYmKHRoaXMubTEwPS10aGlzLm0xMCx0aGlzLm0xMT0tdGhpcy5tMTEpLHNwaW5lLkJvbmUueURvd24mJih0aGlzLm0xMD0tdGhpcy5tMTAsdGhpcy5tMTE9LXRoaXMubTExKX0sc2V0VG9TZXR1cFBvc2U6ZnVuY3Rpb24oKXt2YXIgYT10aGlzLmRhdGE7dGhpcy54PWEueCx0aGlzLnk9YS55LHRoaXMucm90YXRpb249YS5yb3RhdGlvbix0aGlzLnNjYWxlWD1hLnNjYWxlWCx0aGlzLnNjYWxlWT1hLnNjYWxlWX19LHNwaW5lLlNsb3Q9ZnVuY3Rpb24oYSxiLGMpe3RoaXMuZGF0YT1hLHRoaXMuc2tlbGV0b249Yix0aGlzLmJvbmU9Yyx0aGlzLnNldFRvU2V0dXBQb3NlKCl9LHNwaW5lLlNsb3QucHJvdG90eXBlPXtyOjEsZzoxLGI6MSxhOjEsX2F0dGFjaG1lbnRUaW1lOjAsYXR0YWNobWVudDpudWxsLHNldEF0dGFjaG1lbnQ6ZnVuY3Rpb24oYSl7dGhpcy5hdHRhY2htZW50PWEsdGhpcy5fYXR0YWNobWVudFRpbWU9dGhpcy5za2VsZXRvbi50aW1lfSxzZXRBdHRhY2htZW50VGltZTpmdW5jdGlvbihhKXt0aGlzLl9hdHRhY2htZW50VGltZT10aGlzLnNrZWxldG9uLnRpbWUtYX0sZ2V0QXR0YWNobWVudFRpbWU6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5za2VsZXRvbi50aW1lLXRoaXMuX2F0dGFjaG1lbnRUaW1lfSxzZXRUb1NldHVwUG9zZTpmdW5jdGlvbigpe3ZhciBhPXRoaXMuZGF0YTt0aGlzLnI9YS5yLHRoaXMuZz1hLmcsdGhpcy5iPWEuYix0aGlzLmE9YS5hO2Zvcih2YXIgYj10aGlzLnNrZWxldG9uLmRhdGEuc2xvdHMsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKylpZihiW2NdPT1hKXt0aGlzLnNldEF0dGFjaG1lbnQoYS5hdHRhY2htZW50TmFtZT90aGlzLnNrZWxldG9uLmdldEF0dGFjaG1lbnRCeVNsb3RJbmRleChjLGEuYXR0YWNobWVudE5hbWUpOm51bGwpO2JyZWFrfX19LHNwaW5lLlNraW49ZnVuY3Rpb24oYSl7dGhpcy5uYW1lPWEsdGhpcy5hdHRhY2htZW50cz17fX0sc3BpbmUuU2tpbi5wcm90b3R5cGU9e2FkZEF0dGFjaG1lbnQ6ZnVuY3Rpb24oYSxiLGMpe3RoaXMuYXR0YWNobWVudHNbYStcIjpcIitiXT1jfSxnZXRBdHRhY2htZW50OmZ1bmN0aW9uKGEsYil7cmV0dXJuIHRoaXMuYXR0YWNobWVudHNbYStcIjpcIitiXX0sX2F0dGFjaEFsbDpmdW5jdGlvbihhLGIpe2Zvcih2YXIgYyBpbiBiLmF0dGFjaG1lbnRzKXt2YXIgZD1jLmluZGV4T2YoXCI6XCIpLGU9cGFyc2VJbnQoYy5zdWJzdHJpbmcoMCxkKSwxMCksZj1jLnN1YnN0cmluZyhkKzEpLGc9YS5zbG90c1tlXTtpZihnLmF0dGFjaG1lbnQmJmcuYXR0YWNobWVudC5uYW1lPT1mKXt2YXIgaD10aGlzLmdldEF0dGFjaG1lbnQoZSxmKTtoJiZnLnNldEF0dGFjaG1lbnQoaCl9fX19LHNwaW5lLkFuaW1hdGlvbj1mdW5jdGlvbihhLGIsYyl7dGhpcy5uYW1lPWEsdGhpcy50aW1lbGluZXM9Yix0aGlzLmR1cmF0aW9uPWN9LHNwaW5lLkFuaW1hdGlvbi5wcm90b3R5cGU9e2FwcGx5OmZ1bmN0aW9uKGEsYixjKXtjJiZ0aGlzLmR1cmF0aW9uJiYoYiU9dGhpcy5kdXJhdGlvbik7Zm9yKHZhciBkPXRoaXMudGltZWxpbmVzLGU9MCxmPWQubGVuZ3RoO2Y+ZTtlKyspZFtlXS5hcHBseShhLGIsMSl9LG1peDpmdW5jdGlvbihhLGIsYyxkKXtjJiZ0aGlzLmR1cmF0aW9uJiYoYiU9dGhpcy5kdXJhdGlvbik7Zm9yKHZhciBlPXRoaXMudGltZWxpbmVzLGY9MCxnPWUubGVuZ3RoO2c+ZjtmKyspZVtmXS5hcHBseShhLGIsZCl9fSxzcGluZS5iaW5hcnlTZWFyY2g9ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPTAsZT1NYXRoLmZsb29yKGEubGVuZ3RoL2MpLTI7aWYoIWUpcmV0dXJuIGM7Zm9yKHZhciBmPWU+Pj4xOzspe2lmKGFbKGYrMSkqY108PWI/ZD1mKzE6ZT1mLGQ9PWUpcmV0dXJuKGQrMSkqYztmPWQrZT4+PjF9fSxzcGluZS5saW5lYXJTZWFyY2g9ZnVuY3Rpb24oYSxiLGMpe2Zvcih2YXIgZD0wLGU9YS5sZW5ndGgtYztlPj1kO2QrPWMpaWYoYVtkXT5iKXJldHVybiBkO3JldHVybi0xfSxzcGluZS5DdXJ2ZXM9ZnVuY3Rpb24oYSl7dGhpcy5jdXJ2ZXM9W10sdGhpcy5jdXJ2ZXMubGVuZ3RoPTYqKGEtMSl9LHNwaW5lLkN1cnZlcy5wcm90b3R5cGU9e3NldExpbmVhcjpmdW5jdGlvbihhKXt0aGlzLmN1cnZlc1s2KmFdPTB9LHNldFN0ZXBwZWQ6ZnVuY3Rpb24oYSl7dGhpcy5jdXJ2ZXNbNiphXT0tMX0sc2V0Q3VydmU6ZnVuY3Rpb24oYSxiLGMsZCxlKXt2YXIgZj0uMSxnPWYqZixoPWcqZixpPTMqZixqPTMqZyxrPTYqZyxsPTYqaCxtPTIqLWIrZCxuPTIqLWMrZSxvPTMqKGItZCkrMSxwPTMqKGMtZSkrMSxxPTYqYSxyPXRoaXMuY3VydmVzO3JbcV09YippK20qaitvKmgscltxKzFdPWMqaStuKmorcCpoLHJbcSsyXT1tKmsrbypsLHJbcSszXT1uKmsrcCpsLHJbcSs0XT1vKmwscltxKzVdPXAqbH0sZ2V0Q3VydmVQZXJjZW50OmZ1bmN0aW9uKGEsYil7Yj0wPmI/MDpiPjE/MTpiO3ZhciBjPTYqYSxkPXRoaXMuY3VydmVzLGU9ZFtjXTtpZighZSlyZXR1cm4gYjtpZigtMT09ZSlyZXR1cm4gMDtmb3IodmFyIGY9ZFtjKzFdLGc9ZFtjKzJdLGg9ZFtjKzNdLGk9ZFtjKzRdLGo9ZFtjKzVdLGs9ZSxsPWYsbT04Ozspe2lmKGs+PWIpe3ZhciBuPWstZSxvPWwtZjtyZXR1cm4gbysobC1vKSooYi1uKS8oay1uKX1pZighbSlicmVhazttLS0sZSs9ZyxmKz1oLGcrPWksaCs9aixrKz1lLGwrPWZ9cmV0dXJuIGwrKDEtbCkqKGItaykvKDEtayl9fSxzcGluZS5Sb3RhdGVUaW1lbGluZT1mdW5jdGlvbihhKXt0aGlzLmN1cnZlcz1uZXcgc3BpbmUuQ3VydmVzKGEpLHRoaXMuZnJhbWVzPVtdLHRoaXMuZnJhbWVzLmxlbmd0aD0yKmF9LHNwaW5lLlJvdGF0ZVRpbWVsaW5lLnByb3RvdHlwZT17Ym9uZUluZGV4OjAsZ2V0RnJhbWVDb3VudDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmZyYW1lcy5sZW5ndGgvMn0sc2V0RnJhbWU6ZnVuY3Rpb24oYSxiLGMpe2EqPTIsdGhpcy5mcmFtZXNbYV09Yix0aGlzLmZyYW1lc1thKzFdPWN9LGFwcGx5OmZ1bmN0aW9uKGEsYixjKXt2YXIgZCxlPXRoaXMuZnJhbWVzO2lmKCEoYjxlWzBdKSl7dmFyIGY9YS5ib25lc1t0aGlzLmJvbmVJbmRleF07aWYoYj49ZVtlLmxlbmd0aC0yXSl7Zm9yKGQ9Zi5kYXRhLnJvdGF0aW9uK2VbZS5sZW5ndGgtMV0tZi5yb3RhdGlvbjtkPjE4MDspZC09MzYwO2Zvcig7LTE4MD5kOylkKz0zNjA7cmV0dXJuIGYucm90YXRpb24rPWQqYyx2b2lkIDB9dmFyIGc9c3BpbmUuYmluYXJ5U2VhcmNoKGUsYiwyKSxoPWVbZy0xXSxpPWVbZ10saj0xLShiLWkpLyhlW2ctMl0taSk7Zm9yKGo9dGhpcy5jdXJ2ZXMuZ2V0Q3VydmVQZXJjZW50KGcvMi0xLGopLGQ9ZVtnKzFdLWg7ZD4xODA7KWQtPTM2MDtmb3IoOy0xODA+ZDspZCs9MzYwO2ZvcihkPWYuZGF0YS5yb3RhdGlvbisoaCtkKmopLWYucm90YXRpb247ZD4xODA7KWQtPTM2MDtmb3IoOy0xODA+ZDspZCs9MzYwO2Yucm90YXRpb24rPWQqY319fSxzcGluZS5UcmFuc2xhdGVUaW1lbGluZT1mdW5jdGlvbihhKXt0aGlzLmN1cnZlcz1uZXcgc3BpbmUuQ3VydmVzKGEpLHRoaXMuZnJhbWVzPVtdLHRoaXMuZnJhbWVzLmxlbmd0aD0zKmF9LHNwaW5lLlRyYW5zbGF0ZVRpbWVsaW5lLnByb3RvdHlwZT17Ym9uZUluZGV4OjAsZ2V0RnJhbWVDb3VudDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmZyYW1lcy5sZW5ndGgvM30sc2V0RnJhbWU6ZnVuY3Rpb24oYSxiLGMsZCl7YSo9Myx0aGlzLmZyYW1lc1thXT1iLHRoaXMuZnJhbWVzW2ErMV09Yyx0aGlzLmZyYW1lc1thKzJdPWR9LGFwcGx5OmZ1bmN0aW9uKGEsYixjKXt2YXIgZD10aGlzLmZyYW1lcztpZighKGI8ZFswXSkpe3ZhciBlPWEuYm9uZXNbdGhpcy5ib25lSW5kZXhdO2lmKGI+PWRbZC5sZW5ndGgtM10pcmV0dXJuIGUueCs9KGUuZGF0YS54K2RbZC5sZW5ndGgtMl0tZS54KSpjLGUueSs9KGUuZGF0YS55K2RbZC5sZW5ndGgtMV0tZS55KSpjLHZvaWQgMDt2YXIgZj1zcGluZS5iaW5hcnlTZWFyY2goZCxiLDMpLGc9ZFtmLTJdLGg9ZFtmLTFdLGk9ZFtmXSxqPTEtKGItaSkvKGRbZistM10taSk7aj10aGlzLmN1cnZlcy5nZXRDdXJ2ZVBlcmNlbnQoZi8zLTEsaiksZS54Kz0oZS5kYXRhLngrZysoZFtmKzFdLWcpKmotZS54KSpjLGUueSs9KGUuZGF0YS55K2grKGRbZisyXS1oKSpqLWUueSkqY319fSxzcGluZS5TY2FsZVRpbWVsaW5lPWZ1bmN0aW9uKGEpe3RoaXMuY3VydmVzPW5ldyBzcGluZS5DdXJ2ZXMoYSksdGhpcy5mcmFtZXM9W10sdGhpcy5mcmFtZXMubGVuZ3RoPTMqYX0sc3BpbmUuU2NhbGVUaW1lbGluZS5wcm90b3R5cGU9e2JvbmVJbmRleDowLGdldEZyYW1lQ291bnQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5mcmFtZXMubGVuZ3RoLzN9LHNldEZyYW1lOmZ1bmN0aW9uKGEsYixjLGQpe2EqPTMsdGhpcy5mcmFtZXNbYV09Yix0aGlzLmZyYW1lc1thKzFdPWMsdGhpcy5mcmFtZXNbYSsyXT1kfSxhcHBseTpmdW5jdGlvbihhLGIsYyl7dmFyIGQ9dGhpcy5mcmFtZXM7aWYoIShiPGRbMF0pKXt2YXIgZT1hLmJvbmVzW3RoaXMuYm9uZUluZGV4XTtpZihiPj1kW2QubGVuZ3RoLTNdKXJldHVybiBlLnNjYWxlWCs9KGUuZGF0YS5zY2FsZVgtMStkW2QubGVuZ3RoLTJdLWUuc2NhbGVYKSpjLGUuc2NhbGVZKz0oZS5kYXRhLnNjYWxlWS0xK2RbZC5sZW5ndGgtMV0tZS5zY2FsZVkpKmMsdm9pZCAwO3ZhciBmPXNwaW5lLmJpbmFyeVNlYXJjaChkLGIsMyksZz1kW2YtMl0saD1kW2YtMV0saT1kW2ZdLGo9MS0oYi1pKS8oZFtmKy0zXS1pKTtqPXRoaXMuY3VydmVzLmdldEN1cnZlUGVyY2VudChmLzMtMSxqKSxlLnNjYWxlWCs9KGUuZGF0YS5zY2FsZVgtMStnKyhkW2YrMV0tZykqai1lLnNjYWxlWCkqYyxlLnNjYWxlWSs9KGUuZGF0YS5zY2FsZVktMStoKyhkW2YrMl0taCkqai1lLnNjYWxlWSkqY319fSxzcGluZS5Db2xvclRpbWVsaW5lPWZ1bmN0aW9uKGEpe3RoaXMuY3VydmVzPW5ldyBzcGluZS5DdXJ2ZXMoYSksdGhpcy5mcmFtZXM9W10sdGhpcy5mcmFtZXMubGVuZ3RoPTUqYX0sc3BpbmUuQ29sb3JUaW1lbGluZS5wcm90b3R5cGU9e3Nsb3RJbmRleDowLGdldEZyYW1lQ291bnQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5mcmFtZXMubGVuZ3RoLzJ9LHNldEZyYW1lOmZ1bmN0aW9uKGEsYixjLGQsZSxmKXthKj01LHRoaXMuZnJhbWVzW2FdPWIsdGhpcy5mcmFtZXNbYSsxXT1jLHRoaXMuZnJhbWVzW2ErMl09ZCx0aGlzLmZyYW1lc1thKzNdPWUsdGhpcy5mcmFtZXNbYSs0XT1mfSxhcHBseTpmdW5jdGlvbihhLGIsYyl7dmFyIGQ9dGhpcy5mcmFtZXM7aWYoIShiPGRbMF0pKXt2YXIgZT1hLnNsb3RzW3RoaXMuc2xvdEluZGV4XTtpZihiPj1kW2QubGVuZ3RoLTVdKXt2YXIgZj1kLmxlbmd0aC0xO3JldHVybiBlLnI9ZFtmLTNdLGUuZz1kW2YtMl0sZS5iPWRbZi0xXSxlLmE9ZFtmXSx2b2lkIDB9dmFyIGc9c3BpbmUuYmluYXJ5U2VhcmNoKGQsYiw1KSxoPWRbZy00XSxpPWRbZy0zXSxqPWRbZy0yXSxrPWRbZy0xXSxsPWRbZ10sbT0xLShiLWwpLyhkW2ctNV0tbCk7bT10aGlzLmN1cnZlcy5nZXRDdXJ2ZVBlcmNlbnQoZy81LTEsbSk7dmFyIG49aCsoZFtnKzFdLWgpKm0sbz1pKyhkW2crMl0taSkqbSxwPWorKGRbZyszXS1qKSptLHE9aysoZFtnKzRdLWspKm07MT5jPyhlLnIrPShuLWUucikqYyxlLmcrPShvLWUuZykqYyxlLmIrPShwLWUuYikqYyxlLmErPShxLWUuYSkqYyk6KGUucj1uLGUuZz1vLGUuYj1wLGUuYT1xKX19fSxzcGluZS5BdHRhY2htZW50VGltZWxpbmU9ZnVuY3Rpb24oYSl7dGhpcy5jdXJ2ZXM9bmV3IHNwaW5lLkN1cnZlcyhhKSx0aGlzLmZyYW1lcz1bXSx0aGlzLmZyYW1lcy5sZW5ndGg9YSx0aGlzLmF0dGFjaG1lbnROYW1lcz1bXSx0aGlzLmF0dGFjaG1lbnROYW1lcy5sZW5ndGg9YX0sc3BpbmUuQXR0YWNobWVudFRpbWVsaW5lLnByb3RvdHlwZT17c2xvdEluZGV4OjAsZ2V0RnJhbWVDb3VudDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmZyYW1lcy5sZW5ndGh9LHNldEZyYW1lOmZ1bmN0aW9uKGEsYixjKXt0aGlzLmZyYW1lc1thXT1iLHRoaXMuYXR0YWNobWVudE5hbWVzW2FdPWN9LGFwcGx5OmZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcy5mcmFtZXM7aWYoIShiPGNbMF0pKXt2YXIgZDtkPWI+PWNbYy5sZW5ndGgtMV0/Yy5sZW5ndGgtMTpzcGluZS5iaW5hcnlTZWFyY2goYyxiLDEpLTE7dmFyIGU9dGhpcy5hdHRhY2htZW50TmFtZXNbZF07YS5zbG90c1t0aGlzLnNsb3RJbmRleF0uc2V0QXR0YWNobWVudChlP2EuZ2V0QXR0YWNobWVudEJ5U2xvdEluZGV4KHRoaXMuc2xvdEluZGV4LGUpOm51bGwpfX19LHNwaW5lLlNrZWxldG9uRGF0YT1mdW5jdGlvbigpe3RoaXMuYm9uZXM9W10sdGhpcy5zbG90cz1bXSx0aGlzLnNraW5zPVtdLHRoaXMuYW5pbWF0aW9ucz1bXX0sc3BpbmUuU2tlbGV0b25EYXRhLnByb3RvdHlwZT17ZGVmYXVsdFNraW46bnVsbCxmaW5kQm9uZTpmdW5jdGlvbihhKXtmb3IodmFyIGI9dGhpcy5ib25lcyxjPTAsZD1iLmxlbmd0aDtkPmM7YysrKWlmKGJbY10ubmFtZT09YSlyZXR1cm4gYltjXTtyZXR1cm4gbnVsbH0sZmluZEJvbmVJbmRleDpmdW5jdGlvbihhKXtmb3IodmFyIGI9dGhpcy5ib25lcyxjPTAsZD1iLmxlbmd0aDtkPmM7YysrKWlmKGJbY10ubmFtZT09YSlyZXR1cm4gYztyZXR1cm4tMX0sZmluZFNsb3Q6ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPXRoaXMuc2xvdHMsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKylpZihiW2NdLm5hbWU9PWEpcmV0dXJuIGJbY107cmV0dXJuIG51bGx9LGZpbmRTbG90SW5kZXg6ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPXRoaXMuc2xvdHMsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKylpZihiW2NdLm5hbWU9PWEpcmV0dXJuIGM7cmV0dXJuLTF9LGZpbmRTa2luOmZ1bmN0aW9uKGEpe2Zvcih2YXIgYj10aGlzLnNraW5zLGM9MCxkPWIubGVuZ3RoO2Q+YztjKyspaWYoYltjXS5uYW1lPT1hKXJldHVybiBiW2NdO3JldHVybiBudWxsfSxmaW5kQW5pbWF0aW9uOmZ1bmN0aW9uKGEpe2Zvcih2YXIgYj10aGlzLmFuaW1hdGlvbnMsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKylpZihiW2NdLm5hbWU9PWEpcmV0dXJuIGJbY107cmV0dXJuIG51bGx9fSxzcGluZS5Ta2VsZXRvbj1mdW5jdGlvbihhKXt0aGlzLmRhdGE9YSx0aGlzLmJvbmVzPVtdO2Zvcih2YXIgYj0wLGM9YS5ib25lcy5sZW5ndGg7Yz5iO2IrKyl7dmFyIGQ9YS5ib25lc1tiXSxlPWQucGFyZW50P3RoaXMuYm9uZXNbYS5ib25lcy5pbmRleE9mKGQucGFyZW50KV06bnVsbDt0aGlzLmJvbmVzLnB1c2gobmV3IHNwaW5lLkJvbmUoZCxlKSl9Zm9yKHRoaXMuc2xvdHM9W10sdGhpcy5kcmF3T3JkZXI9W10sYj0wLGM9YS5zbG90cy5sZW5ndGg7Yz5iO2IrKyl7dmFyIGY9YS5zbG90c1tiXSxnPXRoaXMuYm9uZXNbYS5ib25lcy5pbmRleE9mKGYuYm9uZURhdGEpXSxoPW5ldyBzcGluZS5TbG90KGYsdGhpcyxnKTt0aGlzLnNsb3RzLnB1c2goaCksdGhpcy5kcmF3T3JkZXIucHVzaChoKX19LHNwaW5lLlNrZWxldG9uLnByb3RvdHlwZT17eDowLHk6MCxza2luOm51bGwscjoxLGc6MSxiOjEsYToxLHRpbWU6MCxmbGlwWDohMSxmbGlwWTohMSx1cGRhdGVXb3JsZFRyYW5zZm9ybTpmdW5jdGlvbigpe2Zvcih2YXIgYT10aGlzLmZsaXBYLGI9dGhpcy5mbGlwWSxjPXRoaXMuYm9uZXMsZD0wLGU9Yy5sZW5ndGg7ZT5kO2QrKyljW2RdLnVwZGF0ZVdvcmxkVHJhbnNmb3JtKGEsYil9LHNldFRvU2V0dXBQb3NlOmZ1bmN0aW9uKCl7dGhpcy5zZXRCb25lc1RvU2V0dXBQb3NlKCksdGhpcy5zZXRTbG90c1RvU2V0dXBQb3NlKCl9LHNldEJvbmVzVG9TZXR1cFBvc2U6ZnVuY3Rpb24oKXtmb3IodmFyIGE9dGhpcy5ib25lcyxiPTAsYz1hLmxlbmd0aDtjPmI7YisrKWFbYl0uc2V0VG9TZXR1cFBvc2UoKX0sc2V0U2xvdHNUb1NldHVwUG9zZTpmdW5jdGlvbigpe2Zvcih2YXIgYT10aGlzLnNsb3RzLGI9MCxjPWEubGVuZ3RoO2M+YjtiKyspYVtiXS5zZXRUb1NldHVwUG9zZShiKX0sZ2V0Um9vdEJvbmU6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5ib25lcy5sZW5ndGg/dGhpcy5ib25lc1swXTpudWxsfSxmaW5kQm9uZTpmdW5jdGlvbihhKXtmb3IodmFyIGI9dGhpcy5ib25lcyxjPTAsZD1iLmxlbmd0aDtkPmM7YysrKWlmKGJbY10uZGF0YS5uYW1lPT1hKXJldHVybiBiW2NdO3JldHVybiBudWxsfSxmaW5kQm9uZUluZGV4OmZ1bmN0aW9uKGEpe2Zvcih2YXIgYj10aGlzLmJvbmVzLGM9MCxkPWIubGVuZ3RoO2Q+YztjKyspaWYoYltjXS5kYXRhLm5hbWU9PWEpcmV0dXJuIGM7cmV0dXJuLTF9LGZpbmRTbG90OmZ1bmN0aW9uKGEpe2Zvcih2YXIgYj10aGlzLnNsb3RzLGM9MCxkPWIubGVuZ3RoO2Q+YztjKyspaWYoYltjXS5kYXRhLm5hbWU9PWEpcmV0dXJuIGJbY107cmV0dXJuIG51bGx9LGZpbmRTbG90SW5kZXg6ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPXRoaXMuc2xvdHMsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKylpZihiW2NdLmRhdGEubmFtZT09YSlyZXR1cm4gYztyZXR1cm4tMX0sc2V0U2tpbkJ5TmFtZTpmdW5jdGlvbihhKXt2YXIgYj10aGlzLmRhdGEuZmluZFNraW4oYSk7aWYoIWIpdGhyb3dcIlNraW4gbm90IGZvdW5kOiBcIithO3RoaXMuc2V0U2tpbihiKX0sc2V0U2tpbjpmdW5jdGlvbihhKXt0aGlzLnNraW4mJmEmJmEuX2F0dGFjaEFsbCh0aGlzLHRoaXMuc2tpbiksdGhpcy5za2luPWF9LGdldEF0dGFjaG1lbnRCeVNsb3ROYW1lOmZ1bmN0aW9uKGEsYil7cmV0dXJuIHRoaXMuZ2V0QXR0YWNobWVudEJ5U2xvdEluZGV4KHRoaXMuZGF0YS5maW5kU2xvdEluZGV4KGEpLGIpfSxnZXRBdHRhY2htZW50QnlTbG90SW5kZXg6ZnVuY3Rpb24oYSxiKXtpZih0aGlzLnNraW4pe3ZhciBjPXRoaXMuc2tpbi5nZXRBdHRhY2htZW50KGEsYik7aWYoYylyZXR1cm4gY31yZXR1cm4gdGhpcy5kYXRhLmRlZmF1bHRTa2luP3RoaXMuZGF0YS5kZWZhdWx0U2tpbi5nZXRBdHRhY2htZW50KGEsYik6bnVsbH0sc2V0QXR0YWNobWVudDpmdW5jdGlvbihhLGIpe2Zvcih2YXIgYz10aGlzLnNsb3RzLGQ9MCxlPWMuc2l6ZTtlPmQ7ZCsrKXt2YXIgZj1jW2RdO2lmKGYuZGF0YS5uYW1lPT1hKXt2YXIgZz1udWxsO2lmKGImJihnPXRoaXMuZ2V0QXR0YWNobWVudChkLGIpLG51bGw9PWcpKXRocm93XCJBdHRhY2htZW50IG5vdCBmb3VuZDogXCIrYitcIiwgZm9yIHNsb3Q6IFwiK2E7cmV0dXJuIGYuc2V0QXR0YWNobWVudChnKSx2b2lkIDB9fXRocm93XCJTbG90IG5vdCBmb3VuZDogXCIrYX0sdXBkYXRlOmZ1bmN0aW9uKGEpe3RoaXMudGltZSs9YX19LHNwaW5lLkF0dGFjaG1lbnRUeXBlPXtyZWdpb246MH0sc3BpbmUuUmVnaW9uQXR0YWNobWVudD1mdW5jdGlvbigpe3RoaXMub2Zmc2V0PVtdLHRoaXMub2Zmc2V0Lmxlbmd0aD04LHRoaXMudXZzPVtdLHRoaXMudXZzLmxlbmd0aD04fSxzcGluZS5SZWdpb25BdHRhY2htZW50LnByb3RvdHlwZT17eDowLHk6MCxyb3RhdGlvbjowLHNjYWxlWDoxLHNjYWxlWToxLHdpZHRoOjAsaGVpZ2h0OjAscmVuZGVyZXJPYmplY3Q6bnVsbCxyZWdpb25PZmZzZXRYOjAscmVnaW9uT2Zmc2V0WTowLHJlZ2lvbldpZHRoOjAscmVnaW9uSGVpZ2h0OjAscmVnaW9uT3JpZ2luYWxXaWR0aDowLHJlZ2lvbk9yaWdpbmFsSGVpZ2h0OjAsc2V0VVZzOmZ1bmN0aW9uKGEsYixjLGQsZSl7dmFyIGY9dGhpcy51dnM7ZT8oZlsyXT1hLGZbM109ZCxmWzRdPWEsZls1XT1iLGZbNl09YyxmWzddPWIsZlswXT1jLGZbMV09ZCk6KGZbMF09YSxmWzFdPWQsZlsyXT1hLGZbM109YixmWzRdPWMsZls1XT1iLGZbNl09YyxmWzddPWQpfSx1cGRhdGVPZmZzZXQ6ZnVuY3Rpb24oKXt2YXIgYT10aGlzLndpZHRoL3RoaXMucmVnaW9uT3JpZ2luYWxXaWR0aCp0aGlzLnNjYWxlWCxiPXRoaXMuaGVpZ2h0L3RoaXMucmVnaW9uT3JpZ2luYWxIZWlnaHQqdGhpcy5zY2FsZVksYz0tdGhpcy53aWR0aC8yKnRoaXMuc2NhbGVYK3RoaXMucmVnaW9uT2Zmc2V0WCphLGQ9LXRoaXMuaGVpZ2h0LzIqdGhpcy5zY2FsZVkrdGhpcy5yZWdpb25PZmZzZXRZKmIsZT1jK3RoaXMucmVnaW9uV2lkdGgqYSxmPWQrdGhpcy5yZWdpb25IZWlnaHQqYixnPXRoaXMucm90YXRpb24qTWF0aC5QSS8xODAsaD1NYXRoLmNvcyhnKSxpPU1hdGguc2luKGcpLGo9YypoK3RoaXMueCxrPWMqaSxsPWQqaCt0aGlzLnksbT1kKmksbj1lKmgrdGhpcy54LG89ZSppLHA9ZipoK3RoaXMueSxxPWYqaSxyPXRoaXMub2Zmc2V0O3JbMF09ai1tLHJbMV09bCtrLHJbMl09ai1xLHJbM109cCtrLHJbNF09bi1xLHJbNV09cCtvLHJbNl09bi1tLHJbN109bCtvfSxjb21wdXRlVmVydGljZXM6ZnVuY3Rpb24oYSxiLGMsZCl7YSs9Yy53b3JsZFgsYis9Yy53b3JsZFk7dmFyIGU9Yy5tMDAsZj1jLm0wMSxnPWMubTEwLGg9Yy5tMTEsaT10aGlzLm9mZnNldDtkWzBdPWlbMF0qZStpWzFdKmYrYSxkWzFdPWlbMF0qZytpWzFdKmgrYixkWzJdPWlbMl0qZStpWzNdKmYrYSxkWzNdPWlbMl0qZytpWzNdKmgrYixkWzRdPWlbNF0qZStpWzVdKmYrYSxkWzVdPWlbNF0qZytpWzVdKmgrYixkWzZdPWlbNl0qZStpWzddKmYrYSxkWzddPWlbNl0qZytpWzddKmgrYn19LHNwaW5lLkFuaW1hdGlvblN0YXRlRGF0YT1mdW5jdGlvbihhKXt0aGlzLnNrZWxldG9uRGF0YT1hLHRoaXMuYW5pbWF0aW9uVG9NaXhUaW1lPXt9fSxzcGluZS5BbmltYXRpb25TdGF0ZURhdGEucHJvdG90eXBlPXtkZWZhdWx0TWl4OjAsc2V0TWl4QnlOYW1lOmZ1bmN0aW9uKGEsYixjKXt2YXIgZD10aGlzLnNrZWxldG9uRGF0YS5maW5kQW5pbWF0aW9uKGEpO2lmKCFkKXRocm93XCJBbmltYXRpb24gbm90IGZvdW5kOiBcIithO3ZhciBlPXRoaXMuc2tlbGV0b25EYXRhLmZpbmRBbmltYXRpb24oYik7aWYoIWUpdGhyb3dcIkFuaW1hdGlvbiBub3QgZm91bmQ6IFwiK2I7dGhpcy5zZXRNaXgoZCxlLGMpfSxzZXRNaXg6ZnVuY3Rpb24oYSxiLGMpe3RoaXMuYW5pbWF0aW9uVG9NaXhUaW1lW2EubmFtZStcIjpcIitiLm5hbWVdPWN9LGdldE1peDpmdW5jdGlvbihhLGIpe3ZhciBjPXRoaXMuYW5pbWF0aW9uVG9NaXhUaW1lW2EubmFtZStcIjpcIitiLm5hbWVdO3JldHVybiBjP2M6dGhpcy5kZWZhdWx0TWl4fX0sc3BpbmUuQW5pbWF0aW9uU3RhdGU9ZnVuY3Rpb24oYSl7dGhpcy5kYXRhPWEsdGhpcy5xdWV1ZT1bXX0sc3BpbmUuQW5pbWF0aW9uU3RhdGUucHJvdG90eXBlPXtjdXJyZW50Om51bGwscHJldmlvdXM6bnVsbCxjdXJyZW50VGltZTowLHByZXZpb3VzVGltZTowLGN1cnJlbnRMb29wOiExLHByZXZpb3VzTG9vcDohMSxtaXhUaW1lOjAsbWl4RHVyYXRpb246MCx1cGRhdGU6ZnVuY3Rpb24oYSl7aWYodGhpcy5jdXJyZW50VGltZSs9YSx0aGlzLnByZXZpb3VzVGltZSs9YSx0aGlzLm1peFRpbWUrPWEsdGhpcy5xdWV1ZS5sZW5ndGg+MCl7dmFyIGI9dGhpcy5xdWV1ZVswXTt0aGlzLmN1cnJlbnRUaW1lPj1iLmRlbGF5JiYodGhpcy5fc2V0QW5pbWF0aW9uKGIuYW5pbWF0aW9uLGIubG9vcCksdGhpcy5xdWV1ZS5zaGlmdCgpKX19LGFwcGx5OmZ1bmN0aW9uKGEpe2lmKHRoaXMuY3VycmVudClpZih0aGlzLnByZXZpb3VzKXt0aGlzLnByZXZpb3VzLmFwcGx5KGEsdGhpcy5wcmV2aW91c1RpbWUsdGhpcy5wcmV2aW91c0xvb3ApO3ZhciBiPXRoaXMubWl4VGltZS90aGlzLm1peER1cmF0aW9uO2I+PTEmJihiPTEsdGhpcy5wcmV2aW91cz1udWxsKSx0aGlzLmN1cnJlbnQubWl4KGEsdGhpcy5jdXJyZW50VGltZSx0aGlzLmN1cnJlbnRMb29wLGIpfWVsc2UgdGhpcy5jdXJyZW50LmFwcGx5KGEsdGhpcy5jdXJyZW50VGltZSx0aGlzLmN1cnJlbnRMb29wKX0sY2xlYXJBbmltYXRpb246ZnVuY3Rpb24oKXt0aGlzLnByZXZpb3VzPW51bGwsdGhpcy5jdXJyZW50PW51bGwsdGhpcy5xdWV1ZS5sZW5ndGg9MH0sX3NldEFuaW1hdGlvbjpmdW5jdGlvbihhLGIpe3RoaXMucHJldmlvdXM9bnVsbCxhJiZ0aGlzLmN1cnJlbnQmJih0aGlzLm1peER1cmF0aW9uPXRoaXMuZGF0YS5nZXRNaXgodGhpcy5jdXJyZW50LGEpLHRoaXMubWl4RHVyYXRpb24+MCYmKHRoaXMubWl4VGltZT0wLHRoaXMucHJldmlvdXM9dGhpcy5jdXJyZW50LHRoaXMucHJldmlvdXNUaW1lPXRoaXMuY3VycmVudFRpbWUsdGhpcy5wcmV2aW91c0xvb3A9dGhpcy5jdXJyZW50TG9vcCkpLHRoaXMuY3VycmVudD1hLHRoaXMuY3VycmVudExvb3A9Yix0aGlzLmN1cnJlbnRUaW1lPTB9LHNldEFuaW1hdGlvbkJ5TmFtZTpmdW5jdGlvbihhLGIpe3ZhciBjPXRoaXMuZGF0YS5za2VsZXRvbkRhdGEuZmluZEFuaW1hdGlvbihhKTtpZighYyl0aHJvd1wiQW5pbWF0aW9uIG5vdCBmb3VuZDogXCIrYTt0aGlzLnNldEFuaW1hdGlvbihjLGIpfSxzZXRBbmltYXRpb246ZnVuY3Rpb24oYSxiKXt0aGlzLnF1ZXVlLmxlbmd0aD0wLHRoaXMuX3NldEFuaW1hdGlvbihhLGIpfSxhZGRBbmltYXRpb25CeU5hbWU6ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPXRoaXMuZGF0YS5za2VsZXRvbkRhdGEuZmluZEFuaW1hdGlvbihhKTtpZighZCl0aHJvd1wiQW5pbWF0aW9uIG5vdCBmb3VuZDogXCIrYTt0aGlzLmFkZEFuaW1hdGlvbihkLGIsYyl9LGFkZEFuaW1hdGlvbjpmdW5jdGlvbihhLGIsYyl7dmFyIGQ9e307aWYoZC5hbmltYXRpb249YSxkLmxvb3A9YiwhY3x8MD49Yyl7dmFyIGU9dGhpcy5xdWV1ZS5sZW5ndGg/dGhpcy5xdWV1ZVt0aGlzLnF1ZXVlLmxlbmd0aC0xXS5hbmltYXRpb246dGhpcy5jdXJyZW50O2M9bnVsbCE9ZT9lLmR1cmF0aW9uLXRoaXMuZGF0YS5nZXRNaXgoZSxhKSsoY3x8MCk6MH1kLmRlbGF5PWMsdGhpcy5xdWV1ZS5wdXNoKGQpfSxpc0NvbXBsZXRlOmZ1bmN0aW9uKCl7cmV0dXJuIXRoaXMuY3VycmVudHx8dGhpcy5jdXJyZW50VGltZT49dGhpcy5jdXJyZW50LmR1cmF0aW9ufX0sc3BpbmUuU2tlbGV0b25Kc29uPWZ1bmN0aW9uKGEpe3RoaXMuYXR0YWNobWVudExvYWRlcj1hfSxzcGluZS5Ta2VsZXRvbkpzb24ucHJvdG90eXBlPXtzY2FsZToxLHJlYWRTa2VsZXRvbkRhdGE6ZnVuY3Rpb24oYSl7Zm9yKHZhciBiLGM9bmV3IHNwaW5lLlNrZWxldG9uRGF0YSxkPWEuYm9uZXMsZT0wLGY9ZC5sZW5ndGg7Zj5lO2UrKyl7dmFyIGc9ZFtlXSxoPW51bGw7aWYoZy5wYXJlbnQmJihoPWMuZmluZEJvbmUoZy5wYXJlbnQpLCFoKSl0aHJvd1wiUGFyZW50IGJvbmUgbm90IGZvdW5kOiBcIitnLnBhcmVudDtiPW5ldyBzcGluZS5Cb25lRGF0YShnLm5hbWUsaCksYi5sZW5ndGg9KGcubGVuZ3RofHwwKSp0aGlzLnNjYWxlLGIueD0oZy54fHwwKSp0aGlzLnNjYWxlLGIueT0oZy55fHwwKSp0aGlzLnNjYWxlLGIucm90YXRpb249Zy5yb3RhdGlvbnx8MCxiLnNjYWxlWD1nLnNjYWxlWHx8MSxiLnNjYWxlWT1nLnNjYWxlWXx8MSxjLmJvbmVzLnB1c2goYil9dmFyIGk9YS5zbG90cztmb3IoZT0wLGY9aS5sZW5ndGg7Zj5lO2UrKyl7dmFyIGo9aVtlXTtpZihiPWMuZmluZEJvbmUoai5ib25lKSwhYil0aHJvd1wiU2xvdCBib25lIG5vdCBmb3VuZDogXCIrai5ib25lO3ZhciBrPW5ldyBzcGluZS5TbG90RGF0YShqLm5hbWUsYiksbD1qLmNvbG9yO2wmJihrLnI9c3BpbmUuU2tlbGV0b25Kc29uLnRvQ29sb3IobCwwKSxrLmc9c3BpbmUuU2tlbGV0b25Kc29uLnRvQ29sb3IobCwxKSxrLmI9c3BpbmUuU2tlbGV0b25Kc29uLnRvQ29sb3IobCwyKSxrLmE9c3BpbmUuU2tlbGV0b25Kc29uLnRvQ29sb3IobCwzKSksay5hdHRhY2htZW50TmFtZT1qLmF0dGFjaG1lbnQsYy5zbG90cy5wdXNoKGspfXZhciBtPWEuc2tpbnM7Zm9yKHZhciBuIGluIG0paWYobS5oYXNPd25Qcm9wZXJ0eShuKSl7dmFyIG89bVtuXSxwPW5ldyBzcGluZS5Ta2luKG4pO2Zvcih2YXIgcSBpbiBvKWlmKG8uaGFzT3duUHJvcGVydHkocSkpe3ZhciByPWMuZmluZFNsb3RJbmRleChxKSxzPW9bcV07Zm9yKHZhciB0IGluIHMpaWYocy5oYXNPd25Qcm9wZXJ0eSh0KSl7dmFyIHU9dGhpcy5yZWFkQXR0YWNobWVudChwLHQsc1t0XSk7bnVsbCE9dSYmcC5hZGRBdHRhY2htZW50KHIsdCx1KX19Yy5za2lucy5wdXNoKHApLFwiZGVmYXVsdFwiPT1wLm5hbWUmJihjLmRlZmF1bHRTa2luPXApfXZhciB2PWEuYW5pbWF0aW9ucztmb3IodmFyIHcgaW4gdil2Lmhhc093blByb3BlcnR5KHcpJiZ0aGlzLnJlYWRBbmltYXRpb24odyx2W3ddLGMpO3JldHVybiBjfSxyZWFkQXR0YWNobWVudDpmdW5jdGlvbihhLGIsYyl7Yj1jLm5hbWV8fGI7dmFyIGQ9c3BpbmUuQXR0YWNobWVudFR5cGVbYy50eXBlfHxcInJlZ2lvblwiXTtpZihkPT1zcGluZS5BdHRhY2htZW50VHlwZS5yZWdpb24pe3ZhciBlPW5ldyBzcGluZS5SZWdpb25BdHRhY2htZW50O3JldHVybiBlLng9KGMueHx8MCkqdGhpcy5zY2FsZSxlLnk9KGMueXx8MCkqdGhpcy5zY2FsZSxlLnNjYWxlWD1jLnNjYWxlWHx8MSxlLnNjYWxlWT1jLnNjYWxlWXx8MSxlLnJvdGF0aW9uPWMucm90YXRpb258fDAsZS53aWR0aD0oYy53aWR0aHx8MzIpKnRoaXMuc2NhbGUsZS5oZWlnaHQ9KGMuaGVpZ2h0fHwzMikqdGhpcy5zY2FsZSxlLnVwZGF0ZU9mZnNldCgpLGUucmVuZGVyZXJPYmplY3Q9e30sZS5yZW5kZXJlck9iamVjdC5uYW1lPWIsZS5yZW5kZXJlck9iamVjdC5zY2FsZT17fSxlLnJlbmRlcmVyT2JqZWN0LnNjYWxlLng9ZS5zY2FsZVgsZS5yZW5kZXJlck9iamVjdC5zY2FsZS55PWUuc2NhbGVZLGUucmVuZGVyZXJPYmplY3Qucm90YXRpb249LWUucm90YXRpb24qTWF0aC5QSS8xODAsZX10aHJvd1wiVW5rbm93biBhdHRhY2htZW50IHR5cGU6IFwiK2R9LHJlYWRBbmltYXRpb246ZnVuY3Rpb24oYSxiLGMpe3ZhciBkLGUsZixnLGgsaSxqLGs9W10sbD0wLG09Yi5ib25lcztmb3IodmFyIG4gaW4gbSlpZihtLmhhc093blByb3BlcnR5KG4pKXt2YXIgbz1jLmZpbmRCb25lSW5kZXgobik7aWYoLTE9PW8pdGhyb3dcIkJvbmUgbm90IGZvdW5kOiBcIituO3ZhciBwPW1bbl07Zm9yKGYgaW4gcClpZihwLmhhc093blByb3BlcnR5KGYpKWlmKGg9cFtmXSxcInJvdGF0ZVwiPT1mKXtmb3IoZT1uZXcgc3BpbmUuUm90YXRlVGltZWxpbmUoaC5sZW5ndGgpLGUuYm9uZUluZGV4PW8sZD0wLGk9MCxqPWgubGVuZ3RoO2o+aTtpKyspZz1oW2ldLGUuc2V0RnJhbWUoZCxnLnRpbWUsZy5hbmdsZSksc3BpbmUuU2tlbGV0b25Kc29uLnJlYWRDdXJ2ZShlLGQsZyksZCsrO2sucHVzaChlKSxsPU1hdGgubWF4KGwsZS5mcmFtZXNbMiplLmdldEZyYW1lQ291bnQoKS0yXSl9ZWxzZXtpZihcInRyYW5zbGF0ZVwiIT1mJiZcInNjYWxlXCIhPWYpdGhyb3dcIkludmFsaWQgdGltZWxpbmUgdHlwZSBmb3IgYSBib25lOiBcIitmK1wiIChcIituK1wiKVwiO3ZhciBxPTE7Zm9yKFwic2NhbGVcIj09Zj9lPW5ldyBzcGluZS5TY2FsZVRpbWVsaW5lKGgubGVuZ3RoKTooZT1uZXcgc3BpbmUuVHJhbnNsYXRlVGltZWxpbmUoaC5sZW5ndGgpLHE9dGhpcy5zY2FsZSksZS5ib25lSW5kZXg9byxkPTAsaT0wLGo9aC5sZW5ndGg7aj5pO2krKyl7Zz1oW2ldO3ZhciByPShnLnh8fDApKnEscz0oZy55fHwwKSpxO2Uuc2V0RnJhbWUoZCxnLnRpbWUscixzKSxzcGluZS5Ta2VsZXRvbkpzb24ucmVhZEN1cnZlKGUsZCxnKSxkKyt9ay5wdXNoKGUpLGw9TWF0aC5tYXgobCxlLmZyYW1lc1szKmUuZ2V0RnJhbWVDb3VudCgpLTNdKX19dmFyIHQ9Yi5zbG90cztmb3IodmFyIHUgaW4gdClpZih0Lmhhc093blByb3BlcnR5KHUpKXt2YXIgdj10W3VdLHc9Yy5maW5kU2xvdEluZGV4KHUpO2ZvcihmIGluIHYpaWYodi5oYXNPd25Qcm9wZXJ0eShmKSlpZihoPXZbZl0sXCJjb2xvclwiPT1mKXtmb3IoZT1uZXcgc3BpbmUuQ29sb3JUaW1lbGluZShoLmxlbmd0aCksZS5zbG90SW5kZXg9dyxkPTAsaT0wLGo9aC5sZW5ndGg7aj5pO2krKyl7Zz1oW2ldO3ZhciB4PWcuY29sb3IseT1zcGluZS5Ta2VsZXRvbkpzb24udG9Db2xvcih4LDApLHo9c3BpbmUuU2tlbGV0b25Kc29uLnRvQ29sb3IoeCwxKSxBPXNwaW5lLlNrZWxldG9uSnNvbi50b0NvbG9yKHgsMiksQj1zcGluZS5Ta2VsZXRvbkpzb24udG9Db2xvcih4LDMpO2Uuc2V0RnJhbWUoZCxnLnRpbWUseSx6LEEsQiksc3BpbmUuU2tlbGV0b25Kc29uLnJlYWRDdXJ2ZShlLGQsZyksZCsrfWsucHVzaChlKSxsPU1hdGgubWF4KGwsZS5mcmFtZXNbNSplLmdldEZyYW1lQ291bnQoKS01XSl9ZWxzZXtpZihcImF0dGFjaG1lbnRcIiE9Zil0aHJvd1wiSW52YWxpZCB0aW1lbGluZSB0eXBlIGZvciBhIHNsb3Q6IFwiK2YrXCIgKFwiK3UrXCIpXCI7Zm9yKGU9bmV3IHNwaW5lLkF0dGFjaG1lbnRUaW1lbGluZShoLmxlbmd0aCksZS5zbG90SW5kZXg9dyxkPTAsaT0wLGo9aC5sZW5ndGg7aj5pO2krKylnPWhbaV0sZS5zZXRGcmFtZShkKyssZy50aW1lLGcubmFtZSk7ay5wdXNoKGUpLGw9TWF0aC5tYXgobCxlLmZyYW1lc1tlLmdldEZyYW1lQ291bnQoKS0xXSl9fWMuYW5pbWF0aW9ucy5wdXNoKG5ldyBzcGluZS5BbmltYXRpb24oYSxrLGwpKX19LHNwaW5lLlNrZWxldG9uSnNvbi5yZWFkQ3VydmU9ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPWMuY3VydmU7ZCYmKFwic3RlcHBlZFwiPT1kP2EuY3VydmVzLnNldFN0ZXBwZWQoYik6ZCBpbnN0YW5jZW9mIEFycmF5JiZhLmN1cnZlcy5zZXRDdXJ2ZShiLGRbMF0sZFsxXSxkWzJdLGRbM10pKX0sc3BpbmUuU2tlbGV0b25Kc29uLnRvQ29sb3I9ZnVuY3Rpb24oYSxiKXtpZig4IT1hLmxlbmd0aCl0aHJvd1wiQ29sb3IgaGV4aWRlY2ltYWwgbGVuZ3RoIG11c3QgYmUgOCwgcmVjaWV2ZWQ6IFwiK2E7cmV0dXJuIHBhcnNlSW50KGEuc3Vic3RyaW5nKDIqYiwyKSwxNikvMjU1fSxzcGluZS5BdGxhcz1mdW5jdGlvbihhLGIpe3RoaXMudGV4dHVyZUxvYWRlcj1iLHRoaXMucGFnZXM9W10sdGhpcy5yZWdpb25zPVtdO3ZhciBjPW5ldyBzcGluZS5BdGxhc1JlYWRlcihhKSxkPVtdO2QubGVuZ3RoPTQ7Zm9yKHZhciBlPW51bGw7Oyl7dmFyIGY9Yy5yZWFkTGluZSgpO2lmKG51bGw9PWYpYnJlYWs7aWYoZj1jLnRyaW0oZiksZi5sZW5ndGgpaWYoZSl7dmFyIGc9bmV3IHNwaW5lLkF0bGFzUmVnaW9uO2cubmFtZT1mLGcucGFnZT1lLGcucm90YXRlPVwidHJ1ZVwiPT1jLnJlYWRWYWx1ZSgpLGMucmVhZFR1cGxlKGQpO3ZhciBoPXBhcnNlSW50KGRbMF0sMTApLGk9cGFyc2VJbnQoZFsxXSwxMCk7Yy5yZWFkVHVwbGUoZCk7dmFyIGo9cGFyc2VJbnQoZFswXSwxMCksaz1wYXJzZUludChkWzFdLDEwKTtnLnU9aC9lLndpZHRoLGcudj1pL2UuaGVpZ2h0LGcucm90YXRlPyhnLnUyPShoK2spL2Uud2lkdGgsZy52Mj0oaStqKS9lLmhlaWdodCk6KGcudTI9KGgraikvZS53aWR0aCxnLnYyPShpK2spL2UuaGVpZ2h0KSxnLng9aCxnLnk9aSxnLndpZHRoPU1hdGguYWJzKGopLGcuaGVpZ2h0PU1hdGguYWJzKGspLDQ9PWMucmVhZFR1cGxlKGQpJiYoZy5zcGxpdHM9W3BhcnNlSW50KGRbMF0sMTApLHBhcnNlSW50KGRbMV0sMTApLHBhcnNlSW50KGRbMl0sMTApLHBhcnNlSW50KGRbM10sMTApXSw0PT1jLnJlYWRUdXBsZShkKSYmKGcucGFkcz1bcGFyc2VJbnQoZFswXSwxMCkscGFyc2VJbnQoZFsxXSwxMCkscGFyc2VJbnQoZFsyXSwxMCkscGFyc2VJbnQoZFszXSwxMCldLGMucmVhZFR1cGxlKGQpKSksZy5vcmlnaW5hbFdpZHRoPXBhcnNlSW50KGRbMF0sMTApLGcub3JpZ2luYWxIZWlnaHQ9cGFyc2VJbnQoZFsxXSwxMCksYy5yZWFkVHVwbGUoZCksZy5vZmZzZXRYPXBhcnNlSW50KGRbMF0sMTApLGcub2Zmc2V0WT1wYXJzZUludChkWzFdLDEwKSxnLmluZGV4PXBhcnNlSW50KGMucmVhZFZhbHVlKCksMTApLHRoaXMucmVnaW9ucy5wdXNoKGcpfWVsc2V7ZT1uZXcgc3BpbmUuQXRsYXNQYWdlLGUubmFtZT1mLGUuZm9ybWF0PXNwaW5lLkF0bGFzLkZvcm1hdFtjLnJlYWRWYWx1ZSgpXSxjLnJlYWRUdXBsZShkKSxlLm1pbkZpbHRlcj1zcGluZS5BdGxhcy5UZXh0dXJlRmlsdGVyW2RbMF1dLGUubWFnRmlsdGVyPXNwaW5lLkF0bGFzLlRleHR1cmVGaWx0ZXJbZFsxXV07dmFyIGw9Yy5yZWFkVmFsdWUoKTtlLnVXcmFwPXNwaW5lLkF0bGFzLlRleHR1cmVXcmFwLmNsYW1wVG9FZGdlLGUudldyYXA9c3BpbmUuQXRsYXMuVGV4dHVyZVdyYXAuY2xhbXBUb0VkZ2UsXCJ4XCI9PWw/ZS51V3JhcD1zcGluZS5BdGxhcy5UZXh0dXJlV3JhcC5yZXBlYXQ6XCJ5XCI9PWw/ZS52V3JhcD1zcGluZS5BdGxhcy5UZXh0dXJlV3JhcC5yZXBlYXQ6XCJ4eVwiPT1sJiYoZS51V3JhcD1lLnZXcmFwPXNwaW5lLkF0bGFzLlRleHR1cmVXcmFwLnJlcGVhdCksYi5sb2FkKGUsZiksdGhpcy5wYWdlcy5wdXNoKGUpfWVsc2UgZT1udWxsfX0sc3BpbmUuQXRsYXMucHJvdG90eXBlPXtmaW5kUmVnaW9uOmZ1bmN0aW9uKGEpe2Zvcih2YXIgYj10aGlzLnJlZ2lvbnMsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKylpZihiW2NdLm5hbWU9PWEpcmV0dXJuIGJbY107cmV0dXJuIG51bGx9LGRpc3Bvc2U6ZnVuY3Rpb24oKXtmb3IodmFyIGE9dGhpcy5wYWdlcyxiPTAsYz1hLmxlbmd0aDtjPmI7YisrKXRoaXMudGV4dHVyZUxvYWRlci51bmxvYWQoYVtiXS5yZW5kZXJlck9iamVjdCl9LHVwZGF0ZVVWczpmdW5jdGlvbihhKXtmb3IodmFyIGI9dGhpcy5yZWdpb25zLGM9MCxkPWIubGVuZ3RoO2Q+YztjKyspe3ZhciBlPWJbY107ZS5wYWdlPT1hJiYoZS51PWUueC9hLndpZHRoLGUudj1lLnkvYS5oZWlnaHQsZS5yb3RhdGU/KGUudTI9KGUueCtlLmhlaWdodCkvYS53aWR0aCxlLnYyPShlLnkrZS53aWR0aCkvYS5oZWlnaHQpOihlLnUyPShlLngrZS53aWR0aCkvYS53aWR0aCxlLnYyPShlLnkrZS5oZWlnaHQpL2EuaGVpZ2h0KSl9fX0sc3BpbmUuQXRsYXMuRm9ybWF0PXthbHBoYTowLGludGVuc2l0eToxLGx1bWluYW5jZUFscGhhOjIscmdiNTY1OjMscmdiYTQ0NDQ6NCxyZ2I4ODg6NSxyZ2JhODg4ODo2fSxzcGluZS5BdGxhcy5UZXh0dXJlRmlsdGVyPXtuZWFyZXN0OjAsbGluZWFyOjEsbWlwTWFwOjIsbWlwTWFwTmVhcmVzdE5lYXJlc3Q6MyxtaXBNYXBMaW5lYXJOZWFyZXN0OjQsbWlwTWFwTmVhcmVzdExpbmVhcjo1LG1pcE1hcExpbmVhckxpbmVhcjo2fSxzcGluZS5BdGxhcy5UZXh0dXJlV3JhcD17bWlycm9yZWRSZXBlYXQ6MCxjbGFtcFRvRWRnZToxLHJlcGVhdDoyfSxzcGluZS5BdGxhc1BhZ2U9ZnVuY3Rpb24oKXt9LHNwaW5lLkF0bGFzUGFnZS5wcm90b3R5cGU9e25hbWU6bnVsbCxmb3JtYXQ6bnVsbCxtaW5GaWx0ZXI6bnVsbCxtYWdGaWx0ZXI6bnVsbCx1V3JhcDpudWxsLHZXcmFwOm51bGwscmVuZGVyZXJPYmplY3Q6bnVsbCx3aWR0aDowLGhlaWdodDowfSxzcGluZS5BdGxhc1JlZ2lvbj1mdW5jdGlvbigpe30sc3BpbmUuQXRsYXNSZWdpb24ucHJvdG90eXBlPXtwYWdlOm51bGwsbmFtZTpudWxsLHg6MCx5OjAsd2lkdGg6MCxoZWlnaHQ6MCx1OjAsdjowLHUyOjAsdjI6MCxvZmZzZXRYOjAsb2Zmc2V0WTowLG9yaWdpbmFsV2lkdGg6MCxvcmlnaW5hbEhlaWdodDowLGluZGV4OjAscm90YXRlOiExLHNwbGl0czpudWxsLHBhZHM6bnVsbH0sc3BpbmUuQXRsYXNSZWFkZXI9ZnVuY3Rpb24oYSl7dGhpcy5saW5lcz1hLnNwbGl0KC9cXHJcXG58XFxyfFxcbi8pfSxzcGluZS5BdGxhc1JlYWRlci5wcm90b3R5cGU9e2luZGV4OjAsdHJpbTpmdW5jdGlvbihhKXtyZXR1cm4gYS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLFwiXCIpfSxyZWFkTGluZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLmluZGV4Pj10aGlzLmxpbmVzLmxlbmd0aD9udWxsOnRoaXMubGluZXNbdGhpcy5pbmRleCsrXX0scmVhZFZhbHVlOmZ1bmN0aW9uKCl7dmFyIGE9dGhpcy5yZWFkTGluZSgpLGI9YS5pbmRleE9mKFwiOlwiKTtpZigtMT09Yil0aHJvd1wiSW52YWxpZCBsaW5lOiBcIithO3JldHVybiB0aGlzLnRyaW0oYS5zdWJzdHJpbmcoYisxKSl9LHJlYWRUdXBsZTpmdW5jdGlvbihhKXt2YXIgYj10aGlzLnJlYWRMaW5lKCksYz1iLmluZGV4T2YoXCI6XCIpO2lmKC0xPT1jKXRocm93XCJJbnZhbGlkIGxpbmU6IFwiK2I7Zm9yKHZhciBkPTAsZT1jKzE7Mz5kO2QrKyl7dmFyIGY9Yi5pbmRleE9mKFwiLFwiLGUpO2lmKC0xPT1mKXtpZighZCl0aHJvd1wiSW52YWxpZCBsaW5lOiBcIitiO2JyZWFrfWFbZF09dGhpcy50cmltKGIuc3Vic3RyKGUsZi1lKSksZT1mKzF9cmV0dXJuIGFbZF09dGhpcy50cmltKGIuc3Vic3RyaW5nKGUpKSxkKzF9fSxzcGluZS5BdGxhc0F0dGFjaG1lbnRMb2FkZXI9ZnVuY3Rpb24oYSl7dGhpcy5hdGxhcz1hfSxzcGluZS5BdGxhc0F0dGFjaG1lbnRMb2FkZXIucHJvdG90eXBlPXtuZXdBdHRhY2htZW50OmZ1bmN0aW9uKGEsYixjKXtzd2l0Y2goYil7Y2FzZSBzcGluZS5BdHRhY2htZW50VHlwZS5yZWdpb246dmFyIGQ9dGhpcy5hdGxhcy5maW5kUmVnaW9uKGMpO2lmKCFkKXRocm93XCJSZWdpb24gbm90IGZvdW5kIGluIGF0bGFzOiBcIitjK1wiIChcIitiK1wiKVwiO3ZhciBlPW5ldyBzcGluZS5SZWdpb25BdHRhY2htZW50KGMpO3JldHVybiBlLnJlbmRlcmVyT2JqZWN0PWQsZS5zZXRVVnMoZC51LGQudixkLnUyLGQudjIsZC5yb3RhdGUpLGUucmVnaW9uT2Zmc2V0WD1kLm9mZnNldFgsZS5yZWdpb25PZmZzZXRZPWQub2Zmc2V0WSxlLnJlZ2lvbldpZHRoPWQud2lkdGgsZS5yZWdpb25IZWlnaHQ9ZC5oZWlnaHQsZS5yZWdpb25PcmlnaW5hbFdpZHRoPWQub3JpZ2luYWxXaWR0aCxlLnJlZ2lvbk9yaWdpbmFsSGVpZ2h0PWQub3JpZ2luYWxIZWlnaHQsZX10aHJvd1wiVW5rbm93biBhdHRhY2htZW50IHR5cGU6IFwiK2J9fSxzcGluZS5Cb25lLnlEb3duPSEwOyJdfQ==
