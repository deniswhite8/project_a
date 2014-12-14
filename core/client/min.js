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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9hdmF0YXJzL1Bhbnplci9jbGllbnQvUGFuemVyLmpzIiwiLi4vYXZhdGFycy9QYW56ZXIvY2xpZW50L2NvbmZpZy5qc29uIiwiY2xpZW50L2NvbmZpZy5qc29uIiwiY2xpZW50L21haW4uanMiLCJjbGllbnQvc2NyaXB0cy9BdmF0YXIuanMiLCJjbGllbnQvc2NyaXB0cy9BdmF0YXJMb2FkZXIuanMiLCJjbGllbnQvc2NyaXB0cy9BdmF0YXJOb2RlLmpzIiwiY2xpZW50L3NjcmlwdHMvQ2h1bmsuanMiLCJjbGllbnQvc2NyaXB0cy9HcmFwaGljcy5qcyIsImNsaWVudC9zY3JpcHRzL0lucHV0LmpzIiwiY2xpZW50L3NjcmlwdHMvTmV0d29yay5qcyIsImNsaWVudC9zY3JpcHRzL1NhbmRib3guanMiLCJjbGllbnQvc2NyaXB0cy9TcHJpdGVMb2FkZXIuanMiLCJjbGllbnQvc2NyaXB0cy9Xb3JsZC5qcyIsImNsaWVudC9zY3JpcHRzL2RlZmF1bHRBdmF0YXJOb2RlLmpzb24iLCJjbGllbnQvc2NyaXB0cy9zdGF0cy5qcyIsImNvbW1vbi9DYWNoZWQuanMiLCJjb21tb24vTG9nZ2VyLmpzIiwiY29tbW9uL1BhY2suanMiLCJjb21tb24vY29uZmlnLmpzb24iLCJjb21tb24vaXNCcm93c2VyLmpzIiwiY29tbW9uL3V0aWwuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2xpYi9iNjQuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaXMtYXJyYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2NvbG9ycy9saWIvY29sb3JzLmpzIiwibm9kZV9tb2R1bGVzL2NvbG9ycy9saWIvY3VzdG9tL3RyYXAuanMiLCJub2RlX21vZHVsZXMvY29sb3JzL2xpYi9jdXN0b20vemFsZ28uanMiLCJub2RlX21vZHVsZXMvY29sb3JzL2xpYi9tYXBzL2FtZXJpY2EuanMiLCJub2RlX21vZHVsZXMvY29sb3JzL2xpYi9tYXBzL3JhaW5ib3cuanMiLCJub2RlX21vZHVsZXMvY29sb3JzL2xpYi9tYXBzL3JhbmRvbS5qcyIsIm5vZGVfbW9kdWxlcy9jb2xvcnMvbGliL21hcHMvemVicmEuanMiLCJub2RlX21vZHVsZXMvY29sb3JzL2xpYi9zdHlsZXMuanMiLCJub2RlX21vZHVsZXMvY29sb3JzL2xpYi9zeXN0ZW0vc3VwcG9ydHMtY29sb3JzLmpzIiwibm9kZV9tb2R1bGVzL2NvbG9ycy9zYWZlLmpzIiwibm9kZV9tb2R1bGVzL21zZ3BhY2stanMtYnJvd3Nlci9tc2dwYWNrLmpzIiwibm9kZV9tb2R1bGVzL21zZ3BhY2stanMvbXNncGFjay5qcyIsIm5vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21zZ3BhY2stanMvbm9kZV9tb2R1bGVzL2JvcHMvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzIiwibm9kZV9tb2R1bGVzL21zZ3BhY2stanMvbm9kZV9tb2R1bGVzL2JvcHMvbm9kZV9tb2R1bGVzL3RvLXV0ZjgvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbXNncGFjay1qcy9ub2RlX21vZHVsZXMvYm9wcy90eXBlZGFycmF5L2NvcHkuanMiLCJub2RlX21vZHVsZXMvbXNncGFjay1qcy9ub2RlX21vZHVsZXMvYm9wcy90eXBlZGFycmF5L2NyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL3R5cGVkYXJyYXkvZnJvbS5qcyIsIm5vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL3R5cGVkYXJyYXkvaXMuanMiLCJub2RlX21vZHVsZXMvbXNncGFjay1qcy9ub2RlX21vZHVsZXMvYm9wcy90eXBlZGFycmF5L2pvaW4uanMiLCJub2RlX21vZHVsZXMvbXNncGFjay1qcy9ub2RlX21vZHVsZXMvYm9wcy90eXBlZGFycmF5L21hcHBlZC5qcyIsIm5vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL3R5cGVkYXJyYXkvcmVhZC5qcyIsIm5vZGVfbW9kdWxlcy9tc2dwYWNrLWpzL25vZGVfbW9kdWxlcy9ib3BzL3R5cGVkYXJyYXkvc3ViYXJyYXkuanMiLCJub2RlX21vZHVsZXMvbXNncGFjay1qcy9ub2RlX21vZHVsZXMvYm9wcy90eXBlZGFycmF5L3RvLmpzIiwibm9kZV9tb2R1bGVzL21zZ3BhY2stanMvbm9kZV9tb2R1bGVzL2JvcHMvdHlwZWRhcnJheS93cml0ZS5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL0ludGVyYWN0aW9uTWFuYWdlci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2NvcmUvZ2xvYmFscy5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2Rpc3BsYXkvRGlzcGxheU9iamVjdC5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2Rpc3BsYXkvRGlzcGxheU9iamVjdENvbnRhaW5lci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2Rpc3BsYXkvTW92aWVDbGlwLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZGlzcGxheS9TcHJpdGUuanMiLCJub2RlX21vZHVsZXMvcGl4aS9kaXNwbGF5L1N0YWdlLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZGlzcGxheS9ibGVuZE1vZGVzLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZXZlbnRzL0V2ZW50VGFyZ2V0LmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZXh0cmFzL0N1c3RvbVJlbmRlcmFibGUuanMiLCJub2RlX21vZHVsZXMvcGl4aS9leHRyYXMvUm9wZS5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2V4dHJhcy9TcGluZS5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2V4dHJhcy9TdHJpcC5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2V4dHJhcy9UaWxpbmdTcHJpdGUuanMiLCJub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL0Fic3RyYWN0RmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9CbHVyRmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9CbHVyWEZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvQmx1cllGaWx0ZXIuanMiLCJub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL0NvbG9yTWF0cml4RmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9Db2xvclN0ZXBGaWx0ZXIuanMiLCJub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL0Nyb3NzSGF0Y2hGaWx0ZXIuanMiLCJub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL0Rpc3BsYWNlbWVudEZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvRG90U2NyZWVuRmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9GaWx0ZXJCbG9jay5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvR3JheUZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvSW52ZXJ0RmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9QaXhlbGF0ZUZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2ZpbHRlcnMvUkdCU3BsaXRGaWx0ZXIuanMiLCJub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL1NlcGlhRmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZmlsdGVycy9TbWFydEJsdXJGaWx0ZXIuanMiLCJub2RlX21vZHVsZXMvcGl4aS9maWx0ZXJzL1R3aXN0RmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZ2VvbS9DaXJjbGUuanMiLCJub2RlX21vZHVsZXMvcGl4aS9nZW9tL0VsbGlwc2UuanMiLCJub2RlX21vZHVsZXMvcGl4aS9nZW9tL1BvaW50LmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZ2VvbS9Qb2x5Z29uLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvZ2VvbS9SZWN0YW5nbGUuanMiLCJub2RlX21vZHVsZXMvcGl4aS9nZW9tL21hdHJpeC5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvbG9hZGVycy9Bc3NldExvYWRlci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2xvYWRlcnMvQml0bWFwRm9udExvYWRlci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL2xvYWRlcnMvSW1hZ2VMb2FkZXIuanMiLCJub2RlX21vZHVsZXMvcGl4aS9sb2FkZXJzL0pzb25Mb2FkZXIuanMiLCJub2RlX21vZHVsZXMvcGl4aS9sb2FkZXJzL1NwaW5lTG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvbG9hZGVycy9TcHJpdGVTaGVldExvYWRlci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL3BsYXRmb3JtLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvcHJpbWl0aXZlcy9HcmFwaGljcy5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL3JlbmRlcmVycy9jYW52YXMvQ2FudmFzUmVuZGVyZXIuanMiLCJub2RlX21vZHVsZXMvcGl4aS9yZW5kZXJlcnMvY2FudmFzL2dyYXBoaWNzLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL1BpeGlTaGFkZXIuanMiLCJub2RlX21vZHVsZXMvcGl4aS9yZW5kZXJlcnMvd2ViZ2wvUHJpbWl0aXZlU2hhZGVyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL1N0cmlwU2hhZGVyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL1dlYkdMQmF0Y2guanMiLCJub2RlX21vZHVsZXMvcGl4aS9yZW5kZXJlcnMvd2ViZ2wvV2ViR0xGaWx0ZXJNYW5hZ2VyLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL1dlYkdMUmVuZGVyR3JvdXAuanMiLCJub2RlX21vZHVsZXMvcGl4aS9yZW5kZXJlcnMvd2ViZ2wvV2ViR0xSZW5kZXJlci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL3JlbmRlcmVycy93ZWJnbC9jb21waWxlLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL2dyYXBoaWNzLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvcmVuZGVyZXJzL3dlYmdsL3NoYWRlcnMuanMiLCJub2RlX21vZHVsZXMvcGl4aS90ZXh0L0JpdG1hcFRleHQuanMiLCJub2RlX21vZHVsZXMvcGl4aS90ZXh0L1RleHQuanMiLCJub2RlX21vZHVsZXMvcGl4aS90ZXh0dXJlcy9CYXNlVGV4dHVyZS5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL3RleHR1cmVzL1JlbmRlclRleHR1cmUuanMiLCJub2RlX21vZHVsZXMvcGl4aS90ZXh0dXJlcy9UZXh0dXJlLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvdXRpbHMvUG9seWsuanMiLCJub2RlX21vZHVsZXMvcGl4aS91dGlscy9hdXRvRGV0ZWN0UmVuZGVyZXIuanMiLCJub2RlX21vZHVsZXMvcGl4aS91dGlscy9jb2xvci5qcyIsIm5vZGVfbW9kdWxlcy9waXhpL3V0aWxzL2RlYnVnLmpzIiwibm9kZV9tb2R1bGVzL3BpeGkvdXRpbHMvc3BpbmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4bEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEF2YXRhciA9IHJlcXVpcmUoJy4uLy4uLy4uL2NvcmUvY2xpZW50L3NjcmlwdHMvQXZhdGFyLmpzJyk7XG5cbnZhciBQYW56ZXIgPSBmdW5jdGlvbigpIHtcblx0QXZhdGFyLmNhbGwodGhpcyk7XHRcbn07XG5QYW56ZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShBdmF0YXIucHJvdG90eXBlKTtcblxuUGFuemVyLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24ocGFyYW1zKSB7XG5cdFxufTtcblxuUGFuemVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihwYXJhbXMpIHtcblx0dGhpcy5ib2R5LmNoaWxkcmVuLnR1cnJldC5hbmdsZSAqPSAtMTtcblx0dGhpcy5ib2R5LmNoaWxkcmVuLmJvcmRlci5jaGlsZHJlbi5saW5lLnRpbnQgPSAoKDB4RkYgKiBwYXJhbXMuaGVhbHRoKSA8PCA4KSArICgoMHhGRiAqICgxLXBhcmFtcy5oZWFsdGgpKSA8PCAxNik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbnplcjsiLCJtb2R1bGUuZXhwb3J0cz17XG4gICAgXCJib2R5XCI6IHtcbiAgICAgICAgXCJ4XCI6IFwiI3hcIixcbiAgICAgICAgXCJ5XCI6IFwiI3lcIixcbiAgICAgICAgXCJ6XCI6IDEwLFxuICAgICAgICBcImFuZ2xlXCI6IFwiI2FuZ2xlXCIsXG4gICAgICAgIFwicmFkaXVzXCI6IDIwLFxuICAgICAgICBcImNoaWxkcmVuXCI6IHtcbiAgICAgICAgICAgIFwiYm9yZGVyXCI6IHtcbiAgICAgICAgICAgICAgICBcInlcIjogLTIwLFxuICAgICAgICAgICAgICAgIFwiY2hpbGRyZW5cIjoge1xuICAgICAgICAgICAgICAgICAgICBcImxpbmVcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJzY2FsZVwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ4XCI6IFwiI2hlYWx0aFwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCJ0dXJyZXRcIjoge1xuICAgICAgICAgICAgICAgIFwiYW5nbGVcIjogXCIjIHNxcnQoYWJzKHR1cnJldEFuZ2xlKSlcIixcbiAgICAgICAgICAgICAgICBcImFuY2hvclwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwieFwiOiAwLjUsXG4gICAgICAgICAgICAgICAgICAgIFwieVwiOiAwLjhcbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSIsIm1vZHVsZS5leHBvcnRzPXtcbiAgICBcIm5ldHdvcmtcIjoge1xuICAgICAgICBcImhvc3RcIjogXCJodHRwOi8vbG9jYWxob3N0XCJcbiAgICB9LFxuXHRcImNvbnRyb2xcIjoge1xuXHQgICAgXCJpbnB1dFwiOiB7XG5cdCAgICAgICAgXCJmcmVxdWVuY3lTZW5kXCI6IDAuMVxuXHQgICAgfVxuXHR9LFxuXHRcIm1hcFwiOiB7XG5cdFx0XCJ0aWxlc2V0XCI6IHtcblx0XHRcdFwiZXh0ZW5zaW9uXCI6IFwicG5nXCJcblx0XHR9XG5cdH0sXG5cdFwiYXZhdGFyXCI6IHtcblx0XHRcInBhdGhcIjogXCJhdmF0YXJzL1wiLFxuXHRcdFwic3ByaXRlXCI6IHtcblx0XHRcdFwicGF0aFwiOiBcIm1lZGlhL1wiXG5cdFx0fVxuXHR9LFxuXHRcInNhbmRib3hcIjoge1xuXHRcdFwiYmluZFwiOiB7XG5cdFx0XHRcInNxcnRcIjogXCJNYXRoLnNxcnRcIixcblx0XHRcdFwiYWJzXCI6IFwiTWF0aC5hYnNcIlxuXHRcdH1cblx0fVxufSIsIid1c2Ugc3RyaWN0JztcblxudmFyIFdvcmxkID0gcmVxdWlyZSgnLi9zY3JpcHRzL1dvcmxkLmpzJyk7XG5cbnZhciB3b3JsZCA9IG5ldyBXb3JsZCgpO1xud29ybGQuc3RhcnQoKTsiLCJ2YXIgQXZhdGFyTm9kZSA9IHJlcXVpcmUoJy4vQXZhdGFyTm9kZS5qcycpLFxuXHRjb25maWcgPSBudWxsO1xuXG52YXIgQXZhdGFyID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMucm9vdE5vZGUgPSBudWxsO1xuXHRjb25maWcgPSB3aW5kb3cuY29uZmlnO1xufTtcblxuQXZhdGFyLnByb3RvdHlwZS5fY3JlYXRlUm9vdE5vZGUgPSBmdW5jdGlvbihzdHJ1Y3R1cmVDb25maWcsIHBhcmFtcykge1xuXHR2YXIgcm9vdE5vZGVOYW1lID0gT2JqZWN0LmtleXMoc3RydWN0dXJlQ29uZmlnKVswXSxcblx0XHRkYXRhID0gc3RydWN0dXJlQ29uZmlnW3Jvb3ROb2RlTmFtZV07XG5cdFxuXHRkYXRhLm5hbWUgPSByb290Tm9kZU5hbWU7XG5cdHRoaXMucm9vdE5vZGUgPSBuZXcgQXZhdGFyTm9kZShkYXRhLCBwYXJhbXMpO1xuXHR0aGlzW3Jvb3ROb2RlTmFtZV0gPSB0aGlzLnJvb3ROb2RlO1xufTtcblxuQXZhdGFyLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKHBhcmFtcywgc3RydWN0dXJlQ29uZmlnKSB7XG5cdHRoaXMuaWQgPSBwYXJhbXMuaWQ7XG5cdHRoaXMudHlwZSA9IHBhcmFtcy5pZDtcblx0XG5cdHBhcmFtcy54ICo9IGNvbmZpZy5tYXAuZGlzdGFuY2Uuc2NhbGU7XG5cdHBhcmFtcy55ICo9IGNvbmZpZy5tYXAuZGlzdGFuY2Uuc2NhbGU7XG5cdFxuXHR0aGlzLl9jcmVhdGVSb290Tm9kZShzdHJ1Y3R1cmVDb25maWcsIHBhcmFtcyk7XG5cdHRoaXMucm9vdE5vZGUudXBkYXRlVmFsdWVzKHBhcmFtcyk7XG5cblx0aWYgKHRoaXMuaW5pdCkgdGhpcy5pbml0KHBhcmFtcyk7XG5cdFxuXHR0aGlzLnJvb3ROb2RlLmNyZWF0ZVNwcml0ZSgpO1xuXHR0aGlzLnJvb3ROb2RlLnVwZGF0ZVNwcml0ZSgpO1xufTtcblxuQXZhdGFyLnByb3RvdHlwZS5fdXBkYXRlID0gZnVuY3Rpb24ocGFyYW1zKSB7XG5cdHBhcmFtcy54ICo9IGNvbmZpZy5tYXAuZGlzdGFuY2Uuc2NhbGU7XG5cdHBhcmFtcy55ICo9IGNvbmZpZy5tYXAuZGlzdGFuY2Uuc2NhbGU7XG5cdFxuXHR0aGlzLnJvb3ROb2RlLnVwZGF0ZVZhbHVlcyhwYXJhbXMpO1xuXHRpZiAodGhpcy51cGRhdGUpIHRoaXMudXBkYXRlKHBhcmFtcyk7XG5cdHRoaXMucm9vdE5vZGUudXBkYXRlU3ByaXRlKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEF2YXRhcjsiLCJ2YXIgY2xhc3NlcyA9IHt9LFxuXHRjb25maWdzID0ge307XG5cbi8vIEBfcmVxdWlyZUF2YXRhckZvbGRlclxuLy8gQF9zdGFydFxuLy8gY2xhc3Nlc1snQ2FyJ10gPSByZXF1aXJlKCcuLi8uLi8uLi9hdmF0YXJzLy9DYXIvY2xpZW50L0Nhci5qcycpO1xuLy8gY29uZmlnc1snQ2FyJ10gPSByZXF1aXJlKCcuLi8uLi8uLi9hdmF0YXJzLy9DYXIvY2xpZW50L2NvbmZpZy5qc29uJyk7XG4vLyBjbGFzc2VzWydNYW4nXSA9IHJlcXVpcmUoJy4uLy4uLy4uL2F2YXRhcnMvL01hbi9jbGllbnQvTWFuLmpzJyk7XG4vLyBjb25maWdzWydNYW4nXSA9IHJlcXVpcmUoJy4uLy4uLy4uL2F2YXRhcnMvL01hbi9jbGllbnQvY29uZmlnLmpzb24nKTtcbmNsYXNzZXNbJ1BhbnplciddID0gcmVxdWlyZSgnLi4vLi4vLi4vYXZhdGFycy8vUGFuemVyL2NsaWVudC9QYW56ZXIuanMnKTtcbmNvbmZpZ3NbJ1BhbnplciddID0gcmVxdWlyZSgnLi4vLi4vLi4vYXZhdGFycy8vUGFuemVyL2NsaWVudC9jb25maWcuanNvbicpO1xuLy8gY2xhc3Nlc1snUGFzc2FnZSddID0gcmVxdWlyZSgnLi4vLi4vLi4vYXZhdGFycy8vUGFzc2FnZS9jbGllbnQvUGFzc2FnZS5qcycpO1xuLy8gY29uZmlnc1snUGFzc2FnZSddID0gcmVxdWlyZSgnLi4vLi4vLi4vYXZhdGFycy8vUGFzc2FnZS9jbGllbnQvY29uZmlnLmpzb24nKTtcbi8vIEBfZW5kXG5cblxudmFyIEF2YXRhckxvYWRlciA9IGZ1bmN0aW9uKCkge1xuXHRcbn07XG5cbkF2YXRhckxvYWRlci5wcm90b3R5cGUuZ2V0Q2xhc3MgPSBmdW5jdGlvbih0eXBlKSB7XG5cdHJldHVybiBjbGFzc2VzW3R5cGVdO1xufTtcblxuQXZhdGFyTG9hZGVyLnByb3RvdHlwZS5nZXRDb25maWcgPSBmdW5jdGlvbih0eXBlKSB7XG5cdHJldHVybiBjb25maWdzW3R5cGVdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBdmF0YXJMb2FkZXI7IiwidmFyIFNwcml0ZUxvYWRlciA9IHJlcXVpcmUoJy4vU3ByaXRlTG9hZGVyLmpzJyksXG5cdGRlZmF1bHRBdmF0YXJOb2RlID0gcmVxdWlyZSgnLi9kZWZhdWx0QXZhdGFyTm9kZS5qc29uJyksXG5cdFNhbmRib3ggPSByZXF1aXJlKCcuL1NhbmRib3guanMnKSxcblx0Y29uZmlnID0gbnVsbDtcblxudmFyIEF2YXRhck5vZGUgPSBmdW5jdGlvbihjb25mRGF0YSwgcGFyYW1zKSB7XG5cdGNvbmZpZyA9IHdpbmRvdy5jb25maWc7XG5cdFxuXHR0aGlzLl9zYW5kYm94ID0gbmV3IFNhbmRib3goKTtcblx0dGhpcy5fbG9hZFZhbHVlcyh0aGlzLCBjb25mRGF0YSwgcGFyYW1zKTtcblx0dGhpcy5jaGlsZHJlbiA9IHt9O1xuXHR0aGlzLnBhcmVudCA9IG51bGw7XG5cdHRoaXMuX2F2YXRhclR5cGUgPSBwYXJhbXMudHlwZTtcblxuXHRjb25mRGF0YS5leHRlbmQoZGVmYXVsdEF2YXRhck5vZGUpO1xuXG5cdHZhciBjaGlsZHJlbkNvbmZEYXRhID0gY29uZkRhdGEuY2hpbGRyZW47XG5cdHRoaXMuX2NvbmZEYXRhID0gdGhpcy5fcHJlcGFyZUNvbmZpZyhjb25mRGF0YSk7XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRpZiAoY2hpbGRyZW5Db25mRGF0YSkge1xuXHRcdGNoaWxkcmVuQ29uZkRhdGEuZWFjaChmdW5jdGlvbihjaGlsZE5hbWUsIGNoaWxkQ29uZkRhdGEpIHtcblx0XHRcdGNoaWxkQ29uZkRhdGEubmFtZSA9IGNoaWxkTmFtZTtcblx0XHRcdFxuXHRcdFx0dmFyIGNoaWxkID0gbmV3IEF2YXRhck5vZGUoY2hpbGRDb25mRGF0YSwgcGFyYW1zKTtcblx0XHRcdHNlbGYuY2hpbGRyZW5bY2hpbGROYW1lXSA9IGNoaWxkO1xuXHRcdFx0Y2hpbGQucGFyZW50ID0gc2VsZjtcblx0XHR9KTtcblx0fVxufTtcblxuQXZhdGFyTm9kZS5wcm90b3R5cGUuX3ByZXBhcmVDb25maWcgPSBmdW5jdGlvbihjb25mRGF0YSkge1xuXHRkZWxldGUgY29uZkRhdGEuY2hpbGRyZW47XG5cblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRjb25mRGF0YS5lYWNoKGZ1bmN0aW9uKHByb3AsIHZhbHVlKSB7XG5cdFx0aWYgKCQuaXNPYmplY3QodmFsdWUpKSB7XG5cdFx0XHRzZWxmLl9wcmVwYXJlQ29uZmlnKHZhbHVlKTtcblx0XHR9IGVsc2UgaWYgKCQuaXNTdHJpbmcodmFsdWUpICYmIHZhbHVlLmluZGV4T2YoJ0BuYW1lJykgIT0gLTEpIHtcblx0XHRcdGNvbmZEYXRhW3Byb3BdID0gdmFsdWUucmVwbGFjZSgnQG5hbWUnLCBzZWxmLm5hbWUpO1xuXHRcdH0gZWxzZSBpZiAoJC5pc1N0cmluZyh2YWx1ZSkgJiYgdmFsdWUuY2hhckF0KDApID09ICcjJykge1xuXHRcdFx0Y29uZkRhdGFbcHJvcF0gPSBzZWxmLl9zYW5kYm94LmdldEZ1bmN0aW9uKHZhbHVlLnN1YnN0cigxKSk7XG5cdFx0fVxuXHR9KTtcblx0XG5cdHJldHVybiBjb25mRGF0YTtcbn07XG5cbkF2YXRhck5vZGUucHJvdG90eXBlLl9jaGlsZHJlbkZvcmVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHR0aGlzLmNoaWxkcmVuLmVhY2goZnVuY3Rpb24oY2hpbGROYW1lLCBjaGlsZCkge1xuXHRcdGNhbGxiYWNrKGNoaWxkKTtcblx0fSk7XG59O1xuXG5BdmF0YXJOb2RlLnByb3RvdHlwZS5jcmVhdGVTcHJpdGUgPSBmdW5jdGlvbigpIHtcblx0dmFyIHNwcml0ZUxvYWRlciA9IG5ldyBTcHJpdGVMb2FkZXIoKSxcblx0XHRzZWxmID0gdGhpcztcblx0dGhpcy5fc3ByaXRlID0gc3ByaXRlTG9hZGVyLmxvYWQoY29uZmlnLmF2YXRhci5wYXRoICsgJy8nICsgdGhpcy5fYXZhdGFyVHlwZSArICcvJyArIHRoaXMuaW1nKTtcblx0XG5cdHRoaXMuX2NoaWxkcmVuRm9yZWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcblx0XHRjaGlsZC5jcmVhdGVTcHJpdGUoKTtcblx0XHRzZWxmLl9zcHJpdGUuYWRkQ2hpbGQoY2hpbGQuX3Nwcml0ZSk7XG5cdH0pO1xufTtcblxuQXZhdGFyTm9kZS5wcm90b3R5cGUuX2xvYWRWYWx1ZXMgPSBmdW5jdGlvbih0YXJnZXQsIHNvdXJjZSwgcGFyYW1zKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblx0c291cmNlLmVhY2goZnVuY3Rpb24ocHJvcCwgdmFsdWUpIHtcblx0XHRpZiAocHJvcCA9PSAnY2hpbGRyZW4nKSByZXR1cm47XG5cdFx0XG5cdFx0aWYgKCQuaXNPYmplY3QodmFsdWUpKSB7XG5cdFx0XHRpZiAodGFyZ2V0W3Byb3BdID09PSB1bmRlZmluZWQpIHRhcmdldFtwcm9wXSA9IHt9O1xuXHRcdFx0c2VsZi5fbG9hZFZhbHVlcyh0YXJnZXRbcHJvcF0sIHNvdXJjZVtwcm9wXSwgcGFyYW1zKTtcblx0XHR9IGVsc2UgaWYgKCQuaXNGdW5jdGlvbih2YWx1ZSkpIHtcblx0XHRcdHRhcmdldFtwcm9wXSA9IHZhbHVlKHBhcmFtcyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRhcmdldFtwcm9wXSA9IHZhbHVlO1xuXHRcdH1cblx0fSk7XG59O1xuXG5BdmF0YXJOb2RlLnByb3RvdHlwZS51cGRhdGVWYWx1ZXMgPSBmdW5jdGlvbihwYXJhbXMpIHtcblx0dGhpcy5fbG9hZFZhbHVlcyh0aGlzLCB0aGlzLl9jb25mRGF0YSwgcGFyYW1zKTtcblx0XG5cdHRoaXMuX2NoaWxkcmVuRm9yZWFjaChmdW5jdGlvbihjaGlsZCkge1xuXHRcdGNoaWxkLnVwZGF0ZVZhbHVlcyhwYXJhbXMpO1xuXHR9KTtcbn07XG5cbkF2YXRhck5vZGUucHJvdG90eXBlLnVwZGF0ZVNwcml0ZSA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLl9zcHJpdGUucG9zaXRpb24ueCA9IHRoaXMueDtcblx0dGhpcy5fc3ByaXRlLnBvc2l0aW9uLnkgPSB0aGlzLnk7XG5cdHRoaXMuX3Nwcml0ZS5wb3NpdGlvbi56ID0gdGhpcy56O1xuXHR0aGlzLl9zcHJpdGUucm90YXRpb24gPSB0aGlzLmFuZ2xlO1xuXHR0aGlzLl9zcHJpdGUuYW5jaG9yLnggPSB0aGlzLmFuY2hvci54O1xuXHR0aGlzLl9zcHJpdGUuYW5jaG9yLnkgPSB0aGlzLmFuY2hvci55O1xuXHR0aGlzLl9zcHJpdGUuc2NhbGUueCA9IHRoaXMuc2NhbGUueDtcblx0dGhpcy5fc3ByaXRlLnNjYWxlLnkgPSB0aGlzLnNjYWxlLnk7XG5cdHRoaXMuX3Nwcml0ZS50aW50ID0gdGhpcy50aW50O1xuXG5cdHRoaXMuX2NoaWxkcmVuRm9yZWFjaChmdW5jdGlvbihjaGlsZCkge1xuXHRcdGNoaWxkLnVwZGF0ZVNwcml0ZSgpO1xuXHR9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXZhdGFyTm9kZTsiLCJ2YXIgU3ByaXRlTG9hZGVyID0gcmVxdWlyZSgnLi9TcHJpdGVMb2FkZXInKSxcbiAgICBjb25maWcgPSBudWxsO1xuXG52YXIgQ2h1bmsgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhpcy54ID0gZGF0YS54O1xuICAgIHRoaXMueSA9IGRhdGEueTtcbiAgICB0aGlzLmlkID0gZGF0YS5pZDtcbiAgICB0aGlzLl90aWxlcyA9IGRhdGEudGlsZXM7XG4gICAgdGhpcy5fcm9vdEdyYXBoaWNzTm9kZSA9IG51bGw7XG4gICAgY29uZmlnID0gd2luZG93LmNvbmZpZztcbiAgICBcbiAgICB0aGlzLl9jcmVhdGVUaWxlcygpO1xufTtcblxuQ2h1bmsucHJvdG90eXBlLl9jcmVhdGVUaWxlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzcHJpdGVMb2FkZXIgPSBuZXcgU3ByaXRlTG9hZGVyKCksXG4gICAgICAgIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICB0aGlzLl9yb290R3JhcGhpY3NOb2RlID0gc3ByaXRlTG9hZGVyLmxvYWQoKTtcbiAgICB0aGlzLl9yb290R3JhcGhpY3NOb2RlLnBvc2l0aW9uLnggPSB0aGlzLnggKiBjb25maWcubWFwLmNodW5rLnNpemUgKiBjb25maWcubWFwLmNodW5rLnRpbGUuc2l6ZTtcbiAgICB0aGlzLl9yb290R3JhcGhpY3NOb2RlLnBvc2l0aW9uLnkgPSB0aGlzLnkgKiBjb25maWcubWFwLmNodW5rLnNpemUgKiBjb25maWcubWFwLmNodW5rLnRpbGUuc2l6ZTtcbiAgICBcbiAgICB0aGlzLl90aWxlcy5mb3JFYWNoKGZ1bmN0aW9uKHRpbGUsIGkpIHtcbiAgICAgICAgaWYgKCF0aWxlKSByZXR1cm47XG4gICAgICAgIHZhciB0aWxlU3ByaXRlID0gc3ByaXRlTG9hZGVyLmxvYWQoY29uZmlnLm1hcC50aWxlc2V0LnBhdGggKyAnLycgKyB0aWxlICsgJy4nICsgY29uZmlnLm1hcC50aWxlc2V0LmV4dGVuc2lvbik7XG4gICAgICAgICAgICBcbiAgICAgICAgdGlsZVNwcml0ZS5wb3NpdGlvbi54ID0gKGkgJSBjb25maWcubWFwLmNodW5rLnNpemUpICogY29uZmlnLm1hcC5jaHVuay50aWxlLnNpemU7XG4gICAgICAgIHRpbGVTcHJpdGUucG9zaXRpb24ueSA9IE1hdGguZmxvb3IoaSAvIGNvbmZpZy5tYXAuY2h1bmsuc2l6ZSkgKiBjb25maWcubWFwLmNodW5rLnRpbGUuc2l6ZTtcbiAgICAgICAgc2VsZi5fcm9vdEdyYXBoaWNzTm9kZS5hZGRDaGlsZCh0aWxlU3ByaXRlKTtcbiAgICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2h1bms7IiwidmFyIFBJWEkgPSByZXF1aXJlKCdwaXhpJyk7XG5cbnZhciBHcmFwaGljcyA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5HcmFwaGljcy5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uKHdyYXBwZXJEaXZJZCwgd2lkdGgsIGhlaWdodCwgc3RhdHMpIHtcbiAgICB0aGlzLl93aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuX2hlaWdodCA9IGhlaWdodDtcbiAgICB0aGlzLl9zdGFnZSA9IG5ldyBQSVhJLlN0YWdlKDB4MDAwMDAwKTtcblx0dGhpcy5fcmVuZGVyZXIgPSBQSVhJLmF1dG9EZXRlY3RSZW5kZXJlcih3aWR0aCwgaGVpZ2h0KTtcblx0dGhpcy5fdmlld1BvcnQgPSBuZXcgUElYSS5EaXNwbGF5T2JqZWN0Q29udGFpbmVyKCk7XG5cdHRoaXMuX21hcFBpdm90ID0gbmV3IFBJWEkuRGlzcGxheU9iamVjdENvbnRhaW5lcigpO1xuXG5cdHRoaXMuX3dyYXBwZXJEaXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh3cmFwcGVyRGl2SWQpO1xuICAgIHRoaXMuX3dyYXBwZXJEaXYuYXBwZW5kQ2hpbGQoc3RhdHMuZG9tRWxlbWVudCk7XG4gICAgXG4gICAgdGhpcy5fc3RhZ2UuYWRkQ2hpbGQodGhpcy5fdmlld1BvcnQpO1xuICAgIHRoaXMuX3dyYXBwZXJEaXYuYXBwZW5kQ2hpbGQodGhpcy5fcmVuZGVyZXIudmlldyk7XG4gICAgdGhpcy5fdmlld1BvcnQuYWRkQ2hpbGQodGhpcy5fbWFwUGl2b3QpO1xufTtcblxuR3JhcGhpY3MucHJvdG90eXBlLmdldFZpZXdFbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmVyLnZpZXc7ICBcbn07XG5cblxuXG5cbkdyYXBoaWNzLnByb3RvdHlwZS52aWV3UG9ydEZvY3VzID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHRoaXMuX3ZpZXdQb3J0LnBvc2l0aW9uLnggPSB0aGlzLl93aWR0aC8yIC0geDtcblx0dGhpcy5fdmlld1BvcnQucG9zaXRpb24ueSA9IHRoaXMuX2hlaWdodC8yIC0geTtcbn07XG5cbkdyYXBoaWNzLnByb3RvdHlwZS5nZXRWaWV3UG9ydFggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld1BvcnQucG9zaXRpb24ueDtcbn07XG5cbkdyYXBoaWNzLnByb3RvdHlwZS5nZXRWaWV3UG9ydFkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld1BvcnQucG9zaXRpb24ueTtcbn07XG5cblxuXG5cblxuXG5HcmFwaGljcy5wcm90b3R5cGUuYWRkQXZhdGFyID0gZnVuY3Rpb24oYXZhdGFyKSB7XG4gICAgaWYgKCFhdmF0YXIpIHJldHVybjtcbiAgICB0aGlzLl92aWV3UG9ydC5hZGRDaGlsZChhdmF0YXIucm9vdE5vZGUuX3Nwcml0ZSk7XG59O1xuXG5HcmFwaGljcy5wcm90b3R5cGUuYWRkQ2h1bmsgPSBmdW5jdGlvbihjaHVuaykge1xuICAgIGlmICghY2h1bmspIHJldHVybjtcbiAgICB0aGlzLl9tYXBQaXZvdC5hZGRDaGlsZChjaHVuay5fcm9vdEdyYXBoaWNzTm9kZSk7XG59O1xuXG5HcmFwaGljcy5wcm90b3R5cGUucmVtb3ZlQXZhdGFyID0gZnVuY3Rpb24oYXZhdGFyKSB7XG4gICAgaWYgKCFhdmF0YXIpIHJldHVybjtcbiAgICB0aGlzLl92aWV3UG9ydC5yZW1vdmVDaGlsZChhdmF0YXIucm9vdE5vZGUuX3Nwcml0ZSk7XG59O1xuXG5HcmFwaGljcy5wcm90b3R5cGUucmVtb3ZlQ2h1bmsgPSBmdW5jdGlvbihjaHVuaykge1xuICAgIGlmICghY2h1bmspIHJldHVybjtcbiAgICB0aGlzLl9tYXBQaXZvdC5yZW1vdmVDaGlsZChjaHVuay5fcm9vdEdyYXBoaWNzTm9kZSk7XG59O1xuXG5cblxuXG5cbkdyYXBoaWNzLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9zb3J0Wih0aGlzLl92aWV3UG9ydCk7XG4gICAgdGhpcy5fcmVuZGVyZXIucmVuZGVyKHRoaXMuX3N0YWdlKTtcbn07XG5cbkdyYXBoaWNzLnByb3RvdHlwZS5fc29ydFogPSBmdW5jdGlvbihub2RlKSB7XG5cdG5vZGUuY2hpbGRyZW4uc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHRcdHJldHVybiBhLnBvc2l0aW9uLnogLSBiLnBvc2l0aW9uLno7XG5cdH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcmFwaGljczsiLCJ2YXIgQ2FjaGVkID0gcmVxdWlyZSgnLi4vLi4vY29tbW9uL0NhY2hlZC5qcycpO1xuXG52YXIgSW5wdXQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9keCA9IDA7XG4gICAgdGhpcy5fZHkgPSAwO1xuICAgIHRoaXMubW91c2VBbmdsZSA9IDA7XG4gICAgdGhpcy5fcHJlc3NlZEtleXMgPSBbXTtcbiAgICB0aGlzLl9jYWNoZWQgPSBuZXcgQ2FjaGVkKCk7XG59O1xuXG5JbnB1dC5wcm90b3R5cGUuc2V0T2Zmc2V0ID0gZnVuY3Rpb24oZHgsIGR5KSB7XG5cdHRoaXMuX2R4ID0gZHg7XG5cdHRoaXMuX2R5ID0gZHk7XG59O1xuXG5JbnB1dC5wcm90b3R5cGUuc2V0U2VsZkF2YXRhciA9IGZ1bmN0aW9uKGF2YXRhcikge1xuXHR0aGlzLl9zZWxmQXZhdGFyID0gYXZhdGFyO1xufTtcblxuSW5wdXQucHJvdG90eXBlLmdldFNlbGVjdEF2YXRhciA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fc2VsZWN0QXZhdGFyO1xufTtcblxuSW5wdXQucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAodmlld0VsZW1lbnQsIGF2YXRhcnMpIHtcblx0dmFyIHJlbmRlcmVyUmVjdCA9IHZpZXdFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuXHRcdHdpZHRoID0gdmlld0VsZW1lbnQud2lkdGgsXG5cdFx0aGVpZ2h0ID0gdmlld0VsZW1lbnQuaGVpZ2h0LFxuICAgICAgICBzZWxmID0gdGhpcztcblxuXHR2aWV3RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgc2VsZi5tb3VzZVggPSBldmVudC5jbGllbnRYIC0gcmVuZGVyZXJSZWN0LmxlZnQ7XG5cdFx0c2VsZi5tb3VzZVkgPSBldmVudC5jbGllbnRZIC0gcmVuZGVyZXJSZWN0LnRvcDtcblx0ICAgIHNlbGYubW91c2VBbmdsZSA9IE1hdGguYXRhbjIoc2VsZi5tb3VzZVkgLSBoZWlnaHQvMiwgc2VsZi5tb3VzZVggLSB3aWR0aC8yKTtcblx0fSwgZmFsc2UpO1xuXG5cdHZpZXdFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIG1vdXNlWCA9IGV2ZW50LmNsaWVudFggLSByZW5kZXJlclJlY3QubGVmdCxcblx0XHQgICAgbW91c2VZID0gZXZlbnQuY2xpZW50WSAtIHJlbmRlcmVyUmVjdC50b3A7XG5cdFx0ICAgIFxuXHQgICAgc2VsZi5fc2VsZWN0QXZhdGFyID0gbnVsbDtcblx0ICAgXHRhdmF0YXJzLnNvbWUoZnVuY3Rpb24oYXZhdGFyKSB7XG5cdCAgIFx0ICAgIGlmIChhdmF0YXIgIT0gc2VsZi5fc2VsZkF2YXRhciAmJlxuXHQgICBcdCAgICAgICAgTWF0aC5wb3coYXZhdGFyLnJvb3ROb2RlLl9zcHJpdGUucG9zaXRpb24ueCAtIG1vdXNlWCArIHNlbGYuX2R4LCAyKSArXG5cdCAgIFx0ICAgICAgICBNYXRoLnBvdyhhdmF0YXIucm9vdE5vZGUuX3Nwcml0ZS5wb3NpdGlvbi55IC0gbW91c2VZICsgc2VsZi5keSwgMikgPFxuXHQgICBcdCAgICAgICAgTWF0aC5wb3coYXZhdGFyLnJvb3ROb2RlLnJhZGl1cywgMikpIHtcblx0ICAgXHQgICAgICAgICAgICBcblx0ICAgIFx0XHRzZWxmLl9zZWxmQXZhdGFyID0gYXZhdGFyO1xuXHQgICAgXHRcdHJldHVybiB0cnVlO1xuXHQgICAgXHR9XG5cdCAgIFx0fSk7XG4gICAgfSwgZmFsc2UpO1xuXG4gICAgdmlld0VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cbiAgICB9LCBmYWxzZSk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHNlbGYuX3ByZXNzZWRLZXlzW2V2ZW50LmtleUNvZGVdID0gdHJ1ZTtcbiAgICB9LCBmYWxzZSk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBzZWxmLl9wcmVzc2VkS2V5c1tldmVudC5rZXlDb2RlXSA9IGZhbHNlO1xuICAgIH0sIGZhbHNlKTtcbn07XG5cbklucHV0LnByb3RvdHlwZS5rZXlJc1ByZXNzZWQgPSBmdW5jdGlvbihrZXlDb2RlKSB7XG5cdGlmICgkLmlzU3RyaW5nKGtleUNvZGUpKVxuXHRcdGtleUNvZGUgPSBrZXlDb2RlLnRvVXBwZXJDYXNlKCkuY2hhckNvZGVBdCgwKTtcblx0cmV0dXJuICEhdGhpcy5fcHJlc3NlZEtleXNba2V5Q29kZV07XG59O1xuXG5JbnB1dC5wcm90b3R5cGUuZ2V0SW5wdXREYXRhID0gZnVuY3Rpb24oKSB7XG5cdHZhciBpbnB1dCA9IHtcblx0XHRhbmdsZTogdGhpcy5tb3VzZUFuZ2xlLFxuXHRcdHVwOiB0aGlzLmtleUlzUHJlc3NlZCgnVycpLFxuXHRcdGRvd246IHRoaXMua2V5SXNQcmVzc2VkKCdTJyksXG5cdFx0bGVmdDogdGhpcy5rZXlJc1ByZXNzZWQoJ0EnKSxcblx0XHRyaWdodDogdGhpcy5rZXlJc1ByZXNzZWQoJ0QnKSxcblx0XHRpbk91dDogdGhpcy5rZXlJc1ByZXNzZWQoJ0UnKSAmJlxuXHRcdFx0dGhpcy5nZXRTZWxlY3RBdmF0YXIoKSAmJlxuXHRcdFx0dGhpcy5nZXRTZWxlY3RBdmF0YXIoKS5pZFxuXHR9O1xuXG5cdHJldHVybiB0aGlzLl9jYWNoZWQuY2xlYW4oaW5wdXQsICdpbnB1dCcpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dDsiLCJ2YXIgUGFjayA9IHJlcXVpcmUoJy4uLy4uL2NvbW1vbi9QYWNrLmpzJyk7XG5cbnZhciBjb25maWcgPSBudWxsO1xuXG52YXIgTmV0d29yayA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2V2ZW50Q2FsbGJhY2tzID0gW107XG4gICAgdGhpcy5fc29ja2V0ID0gbnVsbDtcbiAgICB0aGlzLl9wYWNrID0gbmV3IFBhY2soKTtcbiAgICBcbiAgICBjb25maWcgPSB3aW5kb3cuY29uZmlnO1xufTtcblxuTmV0d29yay5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3NvY2tldCA9IGlvKCk7XG59O1xuXG5OZXR3b3JrLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIFxuICAgIHRoaXMuX3NvY2tldC5vbihuYW1lLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBkZWNvZGVkRGF0YSA9IHNlbGYuX3BhY2suZGVjb2RlKGRhdGEpO1xuICAgICAgICBjYWxsYmFjay5jYWxsKHNlbGYsIGRlY29kZWREYXRhLCB0aGlzKTtcbiAgICB9KTtcbn07XG5cbk5ldHdvcmsucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihuYW1lLCBkYXRhKSB7XG4gICAgaWYgKCF0aGlzLl9zb2NrZXQpIHJldHVybjtcbiAgICBcbiAgICB2YXIgZW5jb2RlZERhdGEgPSB0aGlzLl9wYWNrLmVuY29kZShkYXRhKTtcbiAgICB0aGlzLl9zb2NrZXQuZW1pdChuYW1lLCBlbmNvZGVkRGF0YSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5ldHdvcms7XG4iLCJ2YXIgbG9nZ2VyID0gbnVsbCxcbiAgICBjb25maWcgPSBudWxsO1xuXG52YXIgU2FuZGJveCA9IGZ1bmN0aW9uKCkge1xuICAgIGxvZ2dlciA9IHdpbmRvdy5sb2dnZXI7XG4gICAgY29uZmlnID0gd2luZG93LmNvbmZpZztcbn07XG5cblNhbmRib3gucHJvdG90eXBlLmdldEZ1bmN0aW9uID0gZnVuY3Rpb24oZXhwcmVzc2lvbikge1xuICAgIHZhciBkYXRhT2JqZWN0TmFtZSA9ICdwYXJhbXMnO1xuICAgIFxuICAgIHZhciBwcmVwYXJlZEV4cHJlc3Npb24gPSBleHByZXNzaW9uXG4gICAgICAgIC5yZXBsYWNlKC9cXFt8XXx7fH18YHx2YXJ8ZnVuY3Rpb258bmV3fHRocm93fGRlbGV0ZXxkZWJ1Z2dlcnx3aW5kb3d8dGhpc3xpZnx3aGlsZXxmb3J8Y2FzZS9nLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL1thLXpBLVpfJF1bMC05YS16QS1aXyRdKi9nLCBmdW5jdGlvbih2YXJOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YU9iamVjdE5hbWUgKyAnLicgKyB2YXJOYW1lOyBcbiAgICAgICAgfSk7XG4gICAgXG4gICAgY29uZmlnLnNhbmRib3guYmluZC5lYWNoKGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHByZXBhcmVkRXhwcmVzc2lvbiA9IHByZXBhcmVkRXhwcmVzc2lvbi5yZXBsYWNlKFxuICAgICAgICAgICAgbmV3IFJlZ0V4cChkYXRhT2JqZWN0TmFtZSArICcuJyArIG5hbWUsICdnJyksIHZhbHVlXG4gICAgICAgICk7XG4gICAgfSk7XG4gICAgXG4gICAgcHJlcGFyZWRFeHByZXNzaW9uID0gJ3JldHVybiAoJyArIHByZXBhcmVkRXhwcmVzc2lvbiArICcpOyc7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG5ldyBGdW5jdGlvbihkYXRhT2JqZWN0TmFtZSwgcHJlcGFyZWRFeHByZXNzaW9uKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignSW5jb3JyZWN0IGF2YXRhciBub2RlIGZ1bmN0aW9uOiAnICsgZXhwcmVzc2lvbik7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2FuZGJveDsiLCJ2YXIgUElYSSA9IHJlcXVpcmUoJ3BpeGknKTtcblxudmFyIFNwcml0ZUxvYWRlciA9IGZ1bmN0aW9uKCkge1xuXHRcbn07XG5cblNwcml0ZUxvYWRlci5fdGV4dHVyZXMgPSB7fTtcblxuU3ByaXRlTG9hZGVyLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24oZmlsZU5hbWUpIHtcblx0aWYgKGZpbGVOYW1lKSB7XG5cdFx0ZmlsZU5hbWUgPSBmaWxlTmFtZS5yZXBsYWNlKC9cXC8rL2csICcvJyk7XG5cdFx0XG5cdFx0aWYgKCFTcHJpdGVMb2FkZXIuX3RleHR1cmVzW2ZpbGVOYW1lXSkge1xuXHRcdFx0U3ByaXRlTG9hZGVyLl90ZXh0dXJlc1tmaWxlTmFtZV0gPSBQSVhJLlRleHR1cmUuZnJvbUltYWdlKGZpbGVOYW1lKTtcblx0XHR9XG5cdFx0XG5cdFx0dmFyIHRleHR1cmUgPSBTcHJpdGVMb2FkZXIuX3RleHR1cmVzW2ZpbGVOYW1lXTtcblx0XHRyZXR1cm4gbmV3IFBJWEkuU3ByaXRlKHRleHR1cmUpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBuZXcgUElYSS5EaXNwbGF5T2JqZWN0Q29udGFpbmVyKCk7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU3ByaXRlTG9hZGVyOyIsInJlcXVpcmUoJy4uLy4uL2NvbW1vbi91dGlsLmpzJyk7XG5cbnZhciBBdmF0YXJMb2FkZXIgPSByZXF1aXJlKCcuL0F2YXRhckxvYWRlci5qcycpLFxuICAgIFN0YXRzID0gcmVxdWlyZSgnLi9zdGF0cy5qcycpLFxuICAgIEdyYXBoaWNzID0gcmVxdWlyZSgnLi9HcmFwaGljcy5qcycpLFxuICAgIElucHV0ID0gcmVxdWlyZSgnLi9JbnB1dC5qcycpLFxuICAgIE5ldHdvcmsgPSByZXF1aXJlKCcuL05ldHdvcmsuanMnKSxcbiAgICBDaHVuayA9IHJlcXVpcmUoJy4vQ2h1bmsuanMnKSxcbiAgICBsb2NhbENvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZy5qc29uJyksXG5cdGdsb2JhbENvbmZpZyA9IHJlcXVpcmUoJy4uLy4uL2NvbW1vbi9jb25maWcuanNvbicpLFxuXHRMb2dnZXIgPSByZXF1aXJlKCcuLi8uLi9jb21tb24vTG9nZ2VyLmpzJyksXG5cdENhY2hlZCA9IHJlcXVpcmUoJy4uLy4uL2NvbW1vbi9DYWNoZWQuanMnKSxcblx0bG9nZ2VyID0gbnVsbCxcbiAgICBjb25maWcgPSBudWxsLFxuICAgIHNlbGYgPSBudWxsO1xuXG52YXIgV29ybGQgPSBmdW5jdGlvbigpIHtcbiAgICBjb25maWcgPSB3aW5kb3cuY29uZmlnID0gZ2xvYmFsQ29uZmlnLmV4dGVuZChsb2NhbENvbmZpZyk7XG4gICAgbG9nZ2VyID0gd2luZG93LmxvZ2dlciA9IG5ldyBMb2dnZXIoKTtcbiAgICBzZWxmID0gdGhpcztcbiAgICBcbiAgICBsb2dnZXIuaW5mbygnQ3JlYXRpbmcgd29ybGQnKTtcbiAgICBcbiAgICB0aGlzLl9hdmF0YXJzID0gW107XG4gICAgdGhpcy5fZnJhbWVDb3VudGVyID0gMDtcbiAgICB0aGlzLl9zdGF0cyA9IG5ldyBTdGF0cygpO1xuICAgIGxvZ2dlci5pbmZvKCdJbml0IGdyYXBoaWNzIG1vZHVsZScpO1xuICAgIHRoaXMuX2dyYXBoaWNzID0gbmV3IEdyYXBoaWNzKCk7XG4gICAgdGhpcy5fY29udHJvbEF2YXRhciA9IG51bGw7XG4gICAgbG9nZ2VyLmluZm8oJ0luaXQgaW5wdXQgbW9kdWxlJyk7XG4gICAgdGhpcy5faW5wdXQgPSBuZXcgSW5wdXQoKTtcbiAgICBsb2dnZXIuaW5mbygnSW5pdCBuZXR3b3JrIG1vZHVsZScpO1xuICAgIHRoaXMuX25ldHdvcmsgPSBuZXcgTmV0d29yaygpO1xuICAgIHRoaXMuX2NodW5rcyA9IFtdO1xuICAgIHRoaXMuX2NhY2hlZCA9IG5ldyBDYWNoZWQoKTtcbiAgICBcbiAgICB0aGlzLl9mcmFtZUZyZXF1ZW5jeUlucHV0U2VuZCA9IE1hdGguZmxvb3IoY29uZmlnLmNvbnRyb2wuaW5wdXQuZnJlcXVlbmN5U2VuZCAqIDYwKTtcbiAgICBpZiAodGhpcy5fZnJhbWVGcmVxdWVuY3lJbnB1dFNlbmQgPT09IDApIHRoaXMuX2ZyYW1lRnJlcXVlbmN5SW5wdXRTZW5kID0gMTtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIGxvZ2dlci5pbmZvKCdTdGFydGluZyB3b3JsZCcpO1xuICAgIFxuICAgIGxvZ2dlci5pbmZvKCdOZXR3b3JrIGNvbm5lY3QnKTtcbiAgICB0aGlzLl9uZXR3b3JrLmNvbm5lY3QoKTtcbiAgICB0aGlzLl9zdGF0cy5zZXRNb2RlKDIpO1xuICAgIGxvZ2dlci5pbmZvKCdHcmFwaGljcyBpbml0Jyk7XG4gICAgdGhpcy5fZ3JhcGhpY3MuaW5pdCgnY2VudGVyRGl2JywgNjQwLCA0ODAsIHRoaXMuX3N0YXRzKTtcbiAgICBsb2dnZXIuaW5mbygnSW5wdXQgaW5pdCcpO1xuICAgIHRoaXMuX2lucHV0LmluaXQodGhpcy5fZ3JhcGhpY3MuZ2V0Vmlld0VsZW1lbnQoKSwgdGhpcy5fYXZhdGFycyk7XG4gICAgXG4gICAgdGhpcy5fbmV0d29yay5vbihjb25maWcubmV0d29yay5tZXNzYWdlcy5uZXdDaHVuaywgdGhpcy5vbk5ld0NodW5rKTtcbiAgICB0aGlzLl9uZXR3b3JrLm9uKGNvbmZpZy5uZXR3b3JrLm1lc3NhZ2VzLnJlbW92ZUNodW5rLCB0aGlzLm9uUmVtb3ZlQ2h1bmspO1xuICAgIHRoaXMuX25ldHdvcmsub24oY29uZmlnLm5ldHdvcmsubWVzc2FnZXMubmV3QXZhdGFyLCB0aGlzLm9uTmV3QXZhdGFyKTtcbiAgICB0aGlzLl9uZXR3b3JrLm9uKGNvbmZpZy5uZXR3b3JrLm1lc3NhZ2VzLnJlbW92ZUF2YXRhciwgdGhpcy5vblJlbW92ZUF2YXRhcik7XG4gICAgdGhpcy5fbmV0d29yay5vbihjb25maWcubmV0d29yay5tZXNzYWdlcy5zZXRDb250cm9sQXZhdGFyLCB0aGlzLm9uU2V0Q29udHJvbEF2YXRhcik7XG4gICAgdGhpcy5fbmV0d29yay5vbihjb25maWcubmV0d29yay5tZXNzYWdlcy51cGRhdGVBdmF0YXIsIHRoaXMub25VcGRhdGVBdmF0YXIpO1xuICAgIFxuICAgIHRoaXMuX25ldHdvcmsuc2VuZChjb25maWcubmV0d29yay5tZXNzYWdlcy51c2VyTG9naW4sIHtcbiAgICAgICAgbG9naW46ICdkZW5pcycsXG4gICAgICAgIHBhc3N3ZDogJ3F3ZSdcbiAgICB9KTtcbiAgICBcbiAgICBsb2dnZXIuaW5mbygnU3RhcnQgdXBkYXRlIHdvcmxkIG1haW4gbG9vcCcpO1xuICAgIHRoaXMuX3N0ZXAoKTtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5vblVwZGF0ZUF2YXRhciA9IGZ1bmN0aW9uKGRhdGEsIHNvY2tldCkge1xuICAgIGlmICghZGF0YSB8fCAhZGF0YS5pZCkgcmV0dXJuO1xuICAgIFxuICAgIGRhdGEgPSBzZWxmLl9jYWNoZWQucmVzdG9yZShkYXRhLCAnYXZhdGFyVXBkUGFyYW1zXycgKyBkYXRhLmlkKTtcbiAgICB2YXIgYXZhdGFyID0gc2VsZi5nZXRBdmF0YXIoZGF0YS5pZCk7XG4gICAgaWYgKCFhdmF0YXIpIHJldHVybjtcbiAgICBcbiAgICBhdmF0YXIuX3VwZGF0ZShkYXRhKTtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5vbk5ld0NodW5rID0gZnVuY3Rpb24oZGF0YSwgc29ja2V0KSB7XG4gICAgbG9nZ2VyLmluZm8oJ05ldyBjaHVuayBldmVudCwgZGF0YSA9ICcpO1xuICAgIGxvZ2dlci5sb2coZGF0YSk7XG4gICAgXG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmlkKSByZXR1cm47XG4gICAgaWYgKHNlbGYuX2NodW5rc1tkYXRhLmlkXSkgc2VsZi5vblJlbW92ZUNodW5rKCk7XG4gICAgXG4gICAgdmFyIGNodW5rID0gbmV3IENodW5rKGRhdGEpO1xuICAgIHNlbGYuX2NodW5rc1tkYXRhLmlkXSA9IGNodW5rO1xuICAgIHNlbGYuX2dyYXBoaWNzLmFkZENodW5rKGNodW5rKTtcbiAgICBcbiAgICBpZiAoIWRhdGEuYXZhdGFycykgcmV0dXJuO1xuICAgIGRhdGEuYXZhdGFycy5mb3JFYWNoKGZ1bmN0aW9uIChhdmF0YXJEYXRhKSB7XG4gICAgICAgIHZhciBhdmF0YXIgPSBzZWxmLmNyZWF0ZUF2YXRhcihhdmF0YXJEYXRhKTtcbiAgICAgICAgc2VsZi5hZGRBdmF0YXIoYXZhdGFyKTtcbiAgICB9KTtcbn07XG5cbldvcmxkLnByb3RvdHlwZS5vblJlbW92ZUNodW5rID0gZnVuY3Rpb24oZGF0YSwgc29ja2V0KSB7XG4gICAgbG9nZ2VyLmluZm8oJ1JlbW92ZSBjaHVuayBldmVudCwgZGF0YSA9ICcpO1xuICAgIGxvZ2dlci5sb2coZGF0YSk7XG4gICAgXG4gICAgaWYgKCFkYXRhIHx8ICFkYXRhLmlkIHx8ICF0aGlzLl9jaHVua3NbZGF0YS5pZF0pIHJldHVybjtcbiAgICBcbiAgICBzZWxmLl9ncmFwaGljcy5yZW1vdmVDaHVuayhzZWxmLl9jaHVua3NbZGF0YS5pZF0pO1xuICAgIGRlbGV0ZSBzZWxmLl9jaHVua3NbZGF0YS5pZF07XG4gICAgXG4gICAgaWYgKCFkYXRhLmF2YXRhcnMpIHJldHVybjtcbiAgICBkYXRhLmF2YXRhcnMuZm9yRWFjaChmdW5jdGlvbiAoYXZhdGFyRGF0YSkge1xuICAgICAgICB2YXIgYXZhdGFyID0gc2VsZi5nZXRBdmF0YXIoYXZhdGFyRGF0YS5pZCk7XG4gICAgICAgIHNlbGYucmVtb3ZlQXZhdGFyKGF2YXRhcik7XG4gICAgfSk7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUub25OZXdBdmF0YXIgPSBmdW5jdGlvbihkYXRhLCBzb2NrZXQpIHtcbiAgICBsb2dnZXIuaW5mbygnTmV3IGF2YXRhciBldmVudCwgZGF0YSA9ICcpO1xuICAgIGxvZ2dlci5sb2coZGF0YSk7XG4gICAgXG4gICAgdmFyIGF2YXRhciA9IHNlbGYuY3JlYXRlQXZhdGFyKGRhdGEpO1xuICAgIHNlbGYuYWRkQXZhdGFyKGF2YXRhcik7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUub25SZW1vdmVBdmF0YXIgPSBmdW5jdGlvbihkYXRhLCBzb2NrZXQpIHtcbiAgICBsb2dnZXIuaW5mbygnUmVtb3ZlIGF2YXRhciBldmVudCwgZGF0YSA9ICcpO1xuICAgIGxvZ2dlci5sb2coZGF0YSk7XG4gICAgXG4gICAgdmFyIGF2YXRhciA9IHNlbGYuZ2V0QXZhdGFyKGRhdGEuaWQpO1xuICAgIHNlbGYucmVtb3ZlQXZhdGFyKGF2YXRhcik7XG59O1xuXG5Xb3JsZC5wcm90b3R5cGUub25TZXRDb250cm9sQXZhdGFyID0gZnVuY3Rpb24oYXZhdGFySWQsIHNvY2tldCkge1xuICAgIGxvZ2dlci5pbmZvKCdTZXQgY29udHJvbCBhdmF0YXIgZXZlbnQsIGlkID0gJyk7XG4gICAgbG9nZ2VyLmxvZyhhdmF0YXJJZCk7XG4gICAgXG4gICAgc2VsZi5fY29udHJvbEF2YXRhciA9IHNlbGYuZ2V0QXZhdGFyKGF2YXRhcklkKTtcbn07XG5cblxuXG5Xb3JsZC5wcm90b3R5cGUuZ2V0QXZhdGFyID0gZnVuY3Rpb24oaWQpIHtcbiAgICBpZiAoIWlkKSByZXR1cm47XG4gICAgXG4gICAgcmV0dXJuIHRoaXMuX2F2YXRhcnNbaWRdOyAgXG59O1xuXG5Xb3JsZC5wcm90b3R5cGUucmVtb3ZlQXZhdGFyID0gZnVuY3Rpb24oYXZhdGFyKSB7XG4gICAgaWYgKCFhdmF0YXIgfHwgIWF2YXRhci5pZCkgcmV0dXJuO1xuICAgIFxuICAgIHRoaXMuX2dyYXBoaWNzLnJlbW92ZUF2YXRhcihhdmF0YXIuaWQpO1xuICAgIGRlbGV0ZSB0aGlzLl9hdmF0YXJzW2F2YXRhci5pZF07ICBcbn07XG5cbldvcmxkLnByb3RvdHlwZS5hZGRBdmF0YXIgPSBmdW5jdGlvbihhdmF0YXIpIHtcbiAgICBpZiAoIWF2YXRhciB8fCAhYXZhdGFyLmlkKSByZXR1cm47XG4gICAgXG4gICAgdGhpcy5fYXZhdGFyc1thdmF0YXIuaWRdID0gYXZhdGFyO1xuICAgIHRoaXMuX2dyYXBoaWNzLmFkZEF2YXRhcihhdmF0YXIpO1xufTtcblxuV29ybGQucHJvdG90eXBlLmNyZWF0ZUF2YXRhciA9IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgIHZhciB0eXBlID0gcGFyYW1zLnR5cGUsXG4gICAgICAgIGlkID0gcGFyYW1zLmlkO1xuICAgICAgICBcbiAgICBpZiAoIXR5cGUgfHwgIWlkIHx8IHRoaXMuZ2V0QXZhdGFyKGlkKSkgcmV0dXJuO1xuICAgIFxuICAgIHZhciBhdmF0YXJMb2FkZXIgPSBuZXcgQXZhdGFyTG9hZGVyKCksXG4gICAgICAgIGF2YXRhckNsYXNzID0gYXZhdGFyTG9hZGVyLmdldENsYXNzKHR5cGUpLFxuICAgICAgICBhdmF0YXJDb25maWcgPSBhdmF0YXJMb2FkZXIuZ2V0Q29uZmlnKHR5cGUpO1xuICAgICAgICBcbiAgICBpZiAoIWF2YXRhckNsYXNzIHx8ICFhdmF0YXJDb25maWcpIHJldHVybjtcbiAgICBcbiAgICB2YXIgYXZhdGFyID0gbmV3IGF2YXRhckNsYXNzKCk7XG4gICAgYXZhdGFyLl9pbml0KHBhcmFtcywgYXZhdGFyQ29uZmlnKTtcbiAgICBcbiAgICByZXR1cm4gYXZhdGFyO1xufTtcblxuV29ybGQucHJvdG90eXBlLl9zdGVwID0gZnVuY3Rpb24oKSB7XG4gICAgc2VsZi5fc3RhdHMuYmVnaW4oKTtcbiAgICBzZWxmLl91cGRhdGVGdW5jdGlvbigpO1xuICAgIHNlbGYuX3N0YXRzLmVuZCgpO1xuICAgIFxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoc2VsZi5fc3RlcCk7XG59O1xuXG5cbldvcmxkLnByb3RvdHlwZS5fdXBkYXRlRnVuY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9mcmFtZUNvdW50ZXIrKztcbiAgICBcbiAgICBpZih0aGlzLl9mcmFtZUNvdW50ZXIgJSB0aGlzLl9mcmFtZUZyZXF1ZW5jeUlucHV0U2VuZCkge1xuXHRcdHZhciBpbnB1dERhdGEgPSB0aGlzLl9pbnB1dC5nZXRJbnB1dERhdGEoKTtcblx0XHRpZiAoIWlucHV0RGF0YS5pc0VtcHR5KCkpIHRoaXMuX25ldHdvcmsuc2VuZChjb25maWcubmV0d29yay5tZXNzYWdlcy51c2VySW5wdXQsIGlucHV0RGF0YSk7XG5cdH1cblxuXHRpZiAodGhpcy5fY29udHJvbEF2YXRhcikge1xuXHRcdHRoaXMuX2dyYXBoaWNzLnZpZXdQb3J0Rm9jdXModGhpcy5fY29udHJvbEF2YXRhci5yb290Tm9kZS54LCB0aGlzLl9jb250cm9sQXZhdGFyLnJvb3ROb2RlLnkpO1xuXHR9XG5cblx0dGhpcy5faW5wdXQuc2V0T2Zmc2V0KHRoaXMuX2dyYXBoaWNzLmdldFZpZXdQb3J0WCgpLCB0aGlzLl9ncmFwaGljcy5nZXRWaWV3UG9ydFkoKSk7XG5cdFxuXHR0aGlzLl9ncmFwaGljcy5yZW5kZXIoKTtcbn07XG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmxkOyIsIm1vZHVsZS5leHBvcnRzPXtcbiAgICBcInhcIjogMCxcbiAgICBcInlcIjogMCxcbiAgICBcInpcIjogMTAsXG4gICAgXCJhbmdsZVwiOiAwLFxuICAgIFwicmFkaXVzXCI6IDIwLFxuICAgIFwiYW5jaG9yXCI6IHtcbiAgICAgICAgXCJ4XCI6IDAuNSxcbiAgICAgICAgXCJ5XCI6IDAuNVxuICAgIH0sXG4gICAgXCJzY2FsZVwiOiB7XG4gICAgICAgIFwieFwiOiAxLFxuICAgICAgICBcInlcIjogMVxuICAgIH0sXG4gICAgXCJ0aW50XCI6IDB4RkZGRkZGLFxuICAgIFwiaW1nXCI6IFwiQG5hbWUucG5nXCJcbn0iLCIvLyBzdGF0cy5qcyAtIGh0dHA6Ly9naXRodWIuY29tL21yZG9vYi9zdGF0cy5qc1xudmFyIFN0YXRzPWZ1bmN0aW9uKCl7dmFyIGw9RGF0ZS5ub3coKSxtPWwsZz0wLG49SW5maW5pdHksbz0wLGg9MCxwPUluZmluaXR5LHE9MCxyPTAscz0wLGY9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtmLmlkPVwic3RhdHNcIjtmLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIixmdW5jdGlvbihiKXtiLnByZXZlbnREZWZhdWx0KCk7dCgrK3MlMil9LCExKTtmLnN0eWxlLmNzc1RleHQ9XCJ3aWR0aDo4MHB4O29wYWNpdHk6MC45O2N1cnNvcjpwb2ludGVyXCI7dmFyIGE9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTthLmlkPVwiZnBzXCI7YS5zdHlsZS5jc3NUZXh0PVwicGFkZGluZzowIDAgM3B4IDNweDt0ZXh0LWFsaWduOmxlZnQ7YmFja2dyb3VuZC1jb2xvcjojMDAyXCI7Zi5hcHBlbmRDaGlsZChhKTt2YXIgaT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2kuaWQ9XCJmcHNUZXh0XCI7aS5zdHlsZS5jc3NUZXh0PVwiY29sb3I6IzBmZjtmb250LWZhbWlseTpIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZjtmb250LXNpemU6OXB4O2ZvbnQtd2VpZ2h0OmJvbGQ7bGluZS1oZWlnaHQ6MTVweFwiO1xuaS5pbm5lckhUTUw9XCJGUFNcIjthLmFwcGVuZENoaWxkKGkpO3ZhciBjPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7Yy5pZD1cImZwc0dyYXBoXCI7Yy5zdHlsZS5jc3NUZXh0PVwicG9zaXRpb246cmVsYXRpdmU7d2lkdGg6NzRweDtoZWlnaHQ6MzBweDtiYWNrZ3JvdW5kLWNvbG9yOiMwZmZcIjtmb3IoYS5hcHBlbmRDaGlsZChjKTs3ND5jLmNoaWxkcmVuLmxlbmd0aDspe3ZhciBqPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO2ouc3R5bGUuY3NzVGV4dD1cIndpZHRoOjFweDtoZWlnaHQ6MzBweDtmbG9hdDpsZWZ0O2JhY2tncm91bmQtY29sb3I6IzExM1wiO2MuYXBwZW5kQ2hpbGQoail9dmFyIGQ9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtkLmlkPVwibXNcIjtkLnN0eWxlLmNzc1RleHQ9XCJwYWRkaW5nOjAgMCAzcHggM3B4O3RleHQtYWxpZ246bGVmdDtiYWNrZ3JvdW5kLWNvbG9yOiMwMjA7ZGlzcGxheTpub25lXCI7Zi5hcHBlbmRDaGlsZChkKTt2YXIgaz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuay5pZD1cIm1zVGV4dFwiO2suc3R5bGUuY3NzVGV4dD1cImNvbG9yOiMwZjA7Zm9udC1mYW1pbHk6SGVsdmV0aWNhLEFyaWFsLHNhbnMtc2VyaWY7Zm9udC1zaXplOjlweDtmb250LXdlaWdodDpib2xkO2xpbmUtaGVpZ2h0OjE1cHhcIjtrLmlubmVySFRNTD1cIk1TXCI7ZC5hcHBlbmRDaGlsZChrKTt2YXIgZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO2UuaWQ9XCJtc0dyYXBoXCI7ZS5zdHlsZS5jc3NUZXh0PVwicG9zaXRpb246cmVsYXRpdmU7d2lkdGg6NzRweDtoZWlnaHQ6MzBweDtiYWNrZ3JvdW5kLWNvbG9yOiMwZjBcIjtmb3IoZC5hcHBlbmRDaGlsZChlKTs3ND5lLmNoaWxkcmVuLmxlbmd0aDspaj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKSxqLnN0eWxlLmNzc1RleHQ9XCJ3aWR0aDoxcHg7aGVpZ2h0OjMwcHg7ZmxvYXQ6bGVmdDtiYWNrZ3JvdW5kLWNvbG9yOiMxMzFcIixlLmFwcGVuZENoaWxkKGopO3ZhciB0PWZ1bmN0aW9uKGIpe3M9Yjtzd2l0Y2gocyl7Y2FzZSAwOmEuc3R5bGUuZGlzcGxheT1cblwiYmxvY2tcIjtkLnN0eWxlLmRpc3BsYXk9XCJub25lXCI7YnJlYWs7Y2FzZSAxOmEuc3R5bGUuZGlzcGxheT1cIm5vbmVcIixkLnN0eWxlLmRpc3BsYXk9XCJibG9ja1wifX07cmV0dXJue1JFVklTSU9OOjExLGRvbUVsZW1lbnQ6ZixzZXRNb2RlOnQsYmVnaW46ZnVuY3Rpb24oKXtsPURhdGUubm93KCl9LGVuZDpmdW5jdGlvbigpe3ZhciBiPURhdGUubm93KCk7Zz1iLWw7bj1NYXRoLm1pbihuLGcpO289TWF0aC5tYXgobyxnKTtrLnRleHRDb250ZW50PWcrXCIgTVMgKFwiK24rXCItXCIrbytcIilcIjt2YXIgYT1NYXRoLm1pbigzMCwzMC0zMCooZy8yMDApKTtlLmFwcGVuZENoaWxkKGUuZmlyc3RDaGlsZCkuc3R5bGUuaGVpZ2h0PWErXCJweFwiO3IrKztiPm0rMUUzJiYoaD1NYXRoLnJvdW5kKDFFMypyLyhiLW0pKSxwPU1hdGgubWluKHAsaCkscT1NYXRoLm1heChxLGgpLGkudGV4dENvbnRlbnQ9aCtcIiBGUFMgKFwiK3ArXCItXCIrcStcIilcIixhPU1hdGgubWluKDMwLDMwLTMwKihoLzEwMCkpLGMuYXBwZW5kQ2hpbGQoYy5maXJzdENoaWxkKS5zdHlsZS5oZWlnaHQ9XG5hK1wicHhcIixtPWIscj0wKTtyZXR1cm4gYn0sdXBkYXRlOmZ1bmN0aW9uKCl7bD10aGlzLmVuZCgpfX19O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRzOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBjb25maWcgPSBudWxsLFxuICAgIGlzQnJvd3NlciA9IHJlcXVpcmUoJy4vaXNCcm93c2VyLmpzJyk7XG5cbnZhciBDYWNoZWQgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fY2xlYW5EYXRhID0ge307XG5cdHRoaXMuX2RpcnR5RGF0YSA9IHt9O1xuXHRcblx0aWYgKGlzQnJvd3NlcikgY29uZmlnID0gd2luZG93LmNvbmZpZztcblx0ZWxzZSBjb25maWcgPSBnbG9iYWwuY29uZmlnO1xufTtcblxuQ2FjaGVkLnByb3RvdHlwZS5fZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGNsZWFuT2JqZWN0LCBkaXJ0eU9iamVjdCkge1xuICAgIHZhciBrZXlEaWZmZXJlbmNlLCBkaWZmZXJlbmNlT2JqZWN0ID0ge30sIHNlbGYgPSB0aGlzO1xuICAgIFxuICAgIGNsZWFuT2JqZWN0LmVhY2goZnVuY3Rpb24oa2V5LCBjbGVhblZhbHVlKSB7XG4gICAgICAgIGlmICghJC5pc09iamVjdChjbGVhblZhbHVlKSB8fCAhJC5pc09iamVjdChkaXJ0eU9iamVjdFtrZXldKSkge1xuICAgICAgICAgICAgaWYgKCEoa2V5IGluIGRpcnR5T2JqZWN0KSB8fCBjbGVhblZhbHVlICE9PSBkaXJ0eU9iamVjdFtrZXldKSB7XG4gICAgICAgICAgICAgICAgZGlmZmVyZW5jZU9iamVjdFtrZXldID0gZGlydHlPYmplY3Rba2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoZGlmZmVyZW5jZU9iamVjdFtrZXldID09PSB1bmRlZmluZWQpIGRpZmZlcmVuY2VPYmplY3Rba2V5XSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5RGlmZmVyZW5jZSA9IHNlbGYuX2RpZmZlcmVuY2UoY2xlYW5WYWx1ZSwgZGlydHlPYmplY3Rba2V5XSkpIHtcbiAgICAgICAgICAgIGRpZmZlcmVuY2VPYmplY3Rba2V5XSA9IGtleURpZmZlcmVuY2U7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICBkaXJ0eU9iamVjdC5lYWNoKGZ1bmN0aW9uKGtleSwgZGlydHlWYWx1ZSkge1xuICAgICAgICBpZiAoIShrZXkgaW4gY2xlYW5PYmplY3QpKSB7XG4gICAgICAgICAgICBkaWZmZXJlbmNlT2JqZWN0W2tleV0gPSBkaXJ0eVZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGlmZmVyZW5jZU9iamVjdDtcbn07XG5cbkNhY2hlZC5wcm90b3R5cGUuY2xlYW4gPSBmdW5jdGlvbihkYXRhLCBuYW1lKSB7XG4gICAgaWYgKCFjb25maWcubmV0d29yay5jYWNoZS5lbmFibGUpIHJldHVybiBkYXRhO1xuXHRpZiAoIWRhdGEgfHwgIW5hbWUpIHJldHVybiBudWxsO1xuXHRpZiAoISQuaXNPYmplY3QoZGF0YSkpIHJldHVybiBkYXRhO1xuXHRpZiAoIXRoaXMuX2NsZWFuRGF0YVtuYW1lXSkgdGhpcy5fY2xlYW5EYXRhW25hbWVdID0ge307XG5cdFxuXHR2YXIgcmVzdWx0ID0gdGhpcy5fZGlmZmVyZW5jZSh0aGlzLl9jbGVhbkRhdGFbbmFtZV0sIGRhdGEpO1xuXHR0aGlzLl9jbGVhbkRhdGFbbmFtZV0gPSBkYXRhLmNsb25lKCk7XG5cdHJldHVybiByZXN1bHQ7XG59O1xuXG5DYWNoZWQucHJvdG90eXBlLl9kZWxldGVOdWxscyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBcbiAgICBvYmplY3QuZWFjaChmdW5jdGlvbihwcm9wLCB2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIGRlbGV0ZSBvYmplY3RbcHJvcF07XG4gICAgICAgIGVsc2UgaWYgKCQuaXNPYmplY3QodmFsdWUpKSBzZWxmLl9kZWxldGVOdWxscyh2YWx1ZSk7XG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIG9iamVjdDtcbn07XG5cbkNhY2hlZC5wcm90b3R5cGUucmVzdG9yZSA9IGZ1bmN0aW9uKGRhdGEsIG5hbWUpIHtcbiAgICBpZiAoIWNvbmZpZy5uZXR3b3JrLmNhY2hlLmVuYWJsZSkgcmV0dXJuIGRhdGE7XG5cdGlmICghbmFtZSkgcmV0dXJuIG51bGw7XG5cdGlmICghJC5pc09iamVjdChkYXRhKSkgcmV0dXJuIGRhdGE7XG5cdGlmICghdGhpcy5fZGlydHlEYXRhW25hbWVdKSB0aGlzLl9kaXJ0eURhdGFbbmFtZV0gPSB7fTtcblx0XG5cdHRoaXMuX2RpcnR5RGF0YVtuYW1lXSA9IGRhdGEuY2xvbmUoKS5leHRlbmQodGhpcy5fZGlydHlEYXRhW25hbWVdKTtcblx0dGhpcy5fZGVsZXRlTnVsbHModGhpcy5fZGlydHlEYXRhW25hbWVdKTtcblx0XG5cdHJldHVybiB0aGlzLl9kaXJ0eURhdGFbbmFtZV0uY2xvbmUoKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FjaGVkO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIGNvbG9ycyA9IHJlcXVpcmUoJ2NvbG9ycy9zYWZlJyksXG4gICAgaXNCcm93c2VyID0gcmVxdWlyZSgnLi9pc0Jyb3dzZXIuanMnKVxuXG52YXIgTG9nZ2VyID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMubG9nID0gdGhpcy5pbmZvID0gdGhpcy53YXJuID0gdGhpcy5lcnJvciA9IG51bGw7XG4gICAgXG4gICAgaWYgKGlzQnJvd3Nlcikge1xuICAgICAgICB0aGlzLmxvZyA9IHRoaXMuX2Jyb3dzZXJMb2c7XG4gICAgICAgIHRoaXMuaW5mbyA9IHRoaXMuX2Jyb3dzZXJJbmZvO1xuICAgICAgICB0aGlzLndhcm4gPSB0aGlzLl9icm93c2VyV2FybjtcbiAgICAgICAgdGhpcy5lcnJvciA9IHRoaXMuX2Jyb3dzZXJFcnJvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxvZyA9IHRoaXMuX25vZGVMb2c7XG4gICAgICAgIHRoaXMuaW5mbyA9IHRoaXMuX25vZGVJbmZvO1xuICAgICAgICB0aGlzLndhcm4gPSB0aGlzLl9ub2RlV2FybjtcbiAgICAgICAgdGhpcy5lcnJvciA9IHRoaXMuX25vZGVFcnJvcjtcbiAgICB9XG59O1xuXG5Mb2dnZXIucHJvdG90eXBlLl9icm93c2VyTG9nID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UuY2xvbmUoKSk7XG59O1xuXG5Mb2dnZXIucHJvdG90eXBlLl9icm93c2VySW5mbyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmluZm8obWVzc2FnZS5jbG9uZSgpKTtcbn07XG5cbkxvZ2dlci5wcm90b3R5cGUuX2Jyb3dzZXJXYXJuID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIGNvbnNvbGUud2FybihtZXNzYWdlLmNsb25lKCkpO1xufTtcblxuTG9nZ2VyLnByb3RvdHlwZS5fYnJvd3NlckVycm9yID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZS5jbG9uZSgpKTtcbn07XG5cblxuXG5Mb2dnZXIucHJvdG90eXBlLl9ub2RlTG9nID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UuY2xvbmUoKSk7XG59O1xuXG5Mb2dnZXIucHJvdG90eXBlLl9ub2RlSW5mbyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmxvZyhjb2xvcnMuYmx1ZShtZXNzYWdlLmNsb25lKCkpKTtcbn07XG5cbkxvZ2dlci5wcm90b3R5cGUuX25vZGVXYXJuID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIGNvbnNvbGUubG9nKGNvbG9ycy55ZWxsb3cobWVzc2FnZS5jbG9uZSgpKSk7XG59O1xuXG5Mb2dnZXIucHJvdG90eXBlLl9ub2RlRXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgY29uc29sZS5sb2coY29sb3JzLnJlZChtZXNzYWdlLmNsb25lKCkpKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTG9nZ2VyOyIsIihmdW5jdGlvbiAoZ2xvYmFsLEJ1ZmZlcil7XG52YXIgbm9kZU1zZ3BhY2sgPSByZXF1aXJlKCdtc2dwYWNrLWpzJyksXG4gICAgYnJvd3Nlck1zZ3BhY2sgPSByZXF1aXJlKCdtc2dwYWNrLWpzLWJyb3dzZXInKSxcbiAgICBpc0Jyb3dzZXIgPSByZXF1aXJlKCcuL2lzQnJvd3Nlci5qcycpLFxuICAgIGNvbmZpZyA9IG51bGw7XG5cbnZhciBQYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fbXNncGFjayA9IG51bGw7XG4gICAgXG4gICAgaWYgKGlzQnJvd3Nlcikge1xuICAgICAgICB0aGlzLl9tc2dwYWNrID0gYnJvd3Nlck1zZ3BhY2s7XG4gICAgICAgIGNvbmZpZyA9IHdpbmRvdy5jb25maWc7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbXNncGFjayA9IG5vZGVNc2dwYWNrO1xuICAgICAgICBjb25maWcgPSBnbG9iYWwuY29uZmlnO1xuICAgIH1cbn07XG5cblBhY2sucHJvdG90eXBlLl9tc2dwYWNrRW5jb2RlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBlbmNvZGVkRGF0YSA9IHRoaXMuX21zZ3BhY2suZW5jb2RlKGRhdGEpO1xuICAgIFxuICAgIGlmIChpc0Jyb3dzZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGVuY29kZWREYXRhKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZW5jb2RlZERhdGE7XG4gICAgfVxufTtcblxuUGFjay5wcm90b3R5cGUuX21zZ3BhY2tEZWNvZGUgPSBmdW5jdGlvbihieXRlcykge1xuICAgIHZhciBwcmVwYXJlZERhdGEgPSBudWxsO1xuICAgIFxuICAgIGlmIChpc0Jyb3dzZXIpIHtcbiAgICAgICAgcHJlcGFyZWREYXRhID0gbmV3IFVpbnQ4QXJyYXkoYnl0ZXMpLmJ1ZmZlcjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHByZXBhcmVkRGF0YSA9IG5ldyBCdWZmZXIoYnl0ZXMpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcy5fbXNncGFjay5kZWNvZGUocHJlcGFyZWREYXRhKTtcbn07XG5cblBhY2sucHJvdG90eXBlLmVuY29kZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICBpZiAoIWNvbmZpZy5uZXR3b3JrLnBhY2suZW5hYmxlKSByZXR1cm4gZGF0YTtcbiAgICBcbiAgICB2YXIgYnl0ZXMgPSB0aGlzLl9tc2dwYWNrRW5jb2RlKGRhdGEpO1xuICAgIFxuICAgIHZhciBjaGFycyA9IFtdLFxuICAgICAgICBsZW5ndGggPSBieXRlcy5sZW5ndGg7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKSB7XG4gICAgICAgIGNoYXJzLnB1c2goKChieXRlc1tpKytdICYgMHhmZikgPDwgOCkgfCAoYnl0ZXNbaSsrXSAmIDB4ZmYpKTtcbiAgICB9XG5cbiAgICB2YXIgbWVzc2FnZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgY2hhcnMpO1xuICAgIGlmIChsZW5ndGggJSAyKSBtZXNzYWdlICs9ICcrJztcbiAgICBcbiAgICByZXR1cm4gJyMnICsgbWVzc2FnZTtcbn07XG5cblBhY2sucHJvdG90eXBlLmRlY29kZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICBpZiAoIWNvbmZpZy5uZXR3b3JrLnBhY2suZW5hYmxlIHx8IG1lc3NhZ2VbMF0gIT0gJyMnKSByZXR1cm4gbWVzc2FnZTtcbiAgICBlbHNlIG1lc3NhZ2UgPSBtZXNzYWdlLnN1YnN0cigxKTtcbiAgICBcbiAgICB2YXIgbGVuZ3RoID0gbWVzc2FnZS5sZW5ndGgsXG4gICAgICAgIGJ5dGVzID0gW10sXG4gICAgICAgIGV4Y2Vzc0J5dGUgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgaWYgKG1lc3NhZ2VbbGVuZ3RoIC0gMV0gPT0gJysnKSB7XG4gICAgICAgIG1lc3NhZ2Uuc2xpY2UoMCwgLTEpO1xuICAgICAgICBsZW5ndGgtLTtcbiAgICAgICAgZXhjZXNzQnl0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGFyID0gbWVzc2FnZS5jaGFyQ29kZUF0KGkpO1xuICAgICAgICBieXRlcy5wdXNoKGNoYXIgPj4+IDgsIGNoYXIgJiAweEZGKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKGV4Y2Vzc0J5dGUpIGJ5dGVzLnBvcCgpO1xuICAgIFxuICAgIHJldHVybiB0aGlzLl9tc2dwYWNrRGVjb2RlKGJ5dGVzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGFjaztcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyKSIsIm1vZHVsZS5leHBvcnRzPXtcblx0XCJtYXBcIjoge1xuXHRcdFwiY2h1bmtcIjoge1xuXHRcdFx0XCJzaXplXCI6IDEwLFxuXHRcdFx0XCJ0aWxlXCI6IHtcblx0XHRcdFx0XCJzaXplXCI6IDMyXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRcInNpemVcIjogMzIsXG5cdFx0XCJncm91cFJhZGl1c1wiOiAyLFxuXHRcdFwidGlsZXNldFwiOiB7XG5cdFx0XHRcInBhdGhcIjogXCJ0aWxlc2V0L1wiXG5cdFx0fSxcblx0XHRcImRpc3RhbmNlXCI6IHtcblx0XHRcdFwic2NhbGVcIjogMTAwXG5cdFx0fVxuXHR9LFxuICAgIFwibmV0d29ya1wiOiB7XG4gICAgXHRcIm1lc3NhZ2VzXCI6IHtcblx0ICAgIFx0XCJuZXdDaHVua1wiOiBcIm5ld190bFwiLFxuXHQgICAgXHRcInJlbW92ZUNodW5rXCI6IFwiZGVsX3RsXCIsXG5cdCAgICBcdFwibmV3QXZhdGFyXCI6IFwibmV3X2F2XCIsXG5cdCAgICBcdFwicmVtb3ZlQXZhdGFyXCI6IFwiZGVsX2F2XCIsXG5cdCAgICBcdFwidXBkYXRlQXZhdGFyXCI6IFwidXBkX2F2XCIsXG5cdCAgICBcdFwic2V0Q29udHJvbEF2YXRhclwiOiBcImN0cmxfYXZcIixcblx0ICAgIFxuXHQgICAgXHRcInVzZXJMb2dpblwiOiBcImxvZ2luXCIsXG5cdCAgICBcdFwidXNlcklucHV0XCI6IFwiaW5wdXRcIlxuICAgIFx0fSxcbiAgICBcdFwiY2FjaGVcIjoge1xuICAgIFx0XHRcImVuYWJsZVwiOiB0cnVlXG4gICAgXHR9LFxuICAgIFx0XCJwYWNrXCI6IHtcbiAgICBcdFx0XCJlbmFibGVcIjogdHJ1ZVxuICAgIFx0fVxuICAgIH1cbn0iLCJ2YXIgaXNCcm93c2VyID0gZnVuY3Rpb24oKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgd2luZG93O1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQnJvd3NlcigpOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbnZhciBpc0Jyb3dzZXIgPSByZXF1aXJlKCcuL2lzQnJvd3Nlci5qcycpO1xuXG52YXIgJCA9IHt9O1xuJC5pc09iamVjdCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0Jztcbn07XG4kLmlzU3RyaW5nID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvYmplY3QgPT09ICdzdHJpbmcnO1xufTtcbiQuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqZWN0ID09PSAnZnVuY3Rpb24nO1xufTtcbmlmIChpc0Jyb3dzZXIpIHdpbmRvdy4kID0gJDtcbmVsc2UgZ2xvYmFsLiQgPSAkO1xuXG5cbk9iamVjdC5wcm90b3R5cGUuZXh0ZW5kID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgdmFyIHRhcmdldCA9IHRoaXM7XG4gICAgXG4gICAgc291cmNlLmVhY2goZnVuY3Rpb24ocHJvcCwgc291cmNlUHJvcCkge1xuICAgICAgICBpZiAoJC5pc09iamVjdChzb3VyY2VQcm9wKSAmJiBzb3VyY2VQcm9wICE9PSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoISQuaXNPYmplY3QodGFyZ2V0W3Byb3BdKSB8fCB0YXJnZXRbcHJvcF0gPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcF0gPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhcmdldFtwcm9wXS5leHRlbmQoc291cmNlUHJvcCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGFyZ2V0W3Byb3BdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRhcmdldFtwcm9wXSA9IHNvdXJjZVByb3A7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gdGFyZ2V0O1xufTtcblxuT2JqZWN0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzICE9PSB0aGlzLnZhbHVlT2YoKSkgcmV0dXJuIHRoaXMudmFsdWVPZigpOyBcbiAgICBcbiAgICB2YXIgY2xvbmVPYmplY3QgPSB7fTtcbiAgICBjbG9uZU9iamVjdC5leHRlbmQodGhpcyk7XG4gICAgXG4gICAgcmV0dXJuIGNsb25lT2JqZWN0O1xufTtcblxuT2JqZWN0LnByb3RvdHlwZS5pc0VtcHR5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICFPYmplY3Qua2V5cyh0aGlzKS5sZW5ndGg7XG59O1xuXG5PYmplY3QucHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzKSB7XG4gICAgICAgIGlmICghdGhpcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSBjb250aW51ZTtcbiAgICAgICAgXG4gICAgICAgIHZhciByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIGtleSwgdGhpc1trZXldKTtcbiAgICAgICAgaWYgKHJlc3VsdCkgYnJlYWs7XG4gICAgfSAgXG59O1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzLWFycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxudmFyIGtNYXhMZW5ndGggPSAweDNmZmZmZmZmXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIE5vdGU6XG4gKlxuICogLSBJbXBsZW1lbnRhdGlvbiBtdXN0IHN1cHBvcnQgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YCBpbnN0YW5jZXMuXG4gKiAgIEZpcmVmb3ggNC0yOSBsYWNrZWQgc3VwcG9ydCwgZml4ZWQgaW4gRmlyZWZveCAzMCsuXG4gKiAgIFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4LlxuICpcbiAqICAtIENocm9tZSA5LTEwIGlzIG1pc3NpbmcgdGhlIGBUeXBlZEFycmF5LnByb3RvdHlwZS5zdWJhcnJheWAgZnVuY3Rpb24uXG4gKlxuICogIC0gSUUxMCBoYXMgYSBicm9rZW4gYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFycmF5cyBvZlxuICogICAgaW5jb3JyZWN0IGxlbmd0aCBpbiBzb21lIHNpdHVhdGlvbnMuXG4gKlxuICogV2UgZGV0ZWN0IHRoZXNlIGJ1Z2d5IGJyb3dzZXJzIGFuZCBzZXQgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYCB0byBgZmFsc2VgIHNvIHRoZXkgd2lsbFxuICogZ2V0IHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24sIHdoaWNoIGlzIHNsb3dlciBidXQgd2lsbCB3b3JrIGNvcnJlY3RseS5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSAoZnVuY3Rpb24gKCkge1xuICB0cnkge1xuICAgIHZhciBidWYgPSBuZXcgQXJyYXlCdWZmZXIoMClcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoYnVmKVxuICAgIGFyci5mb28gPSBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9XG4gICAgcmV0dXJuIDQyID09PSBhcnIuZm9vKCkgJiYgLy8gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWRcbiAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgbmV3IFVpbnQ4QXJyYXkoMSkuc3ViYXJyYXkoMSwgMSkuYnl0ZUxlbmd0aCA9PT0gMCAvLyBpZTEwIGhhcyBicm9rZW4gYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn0pKClcblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKVxuXG4gIHZhciB0eXBlID0gdHlwZW9mIHN1YmplY3RcblxuICAvLyBGaW5kIHRoZSBsZW5ndGhcbiAgdmFyIGxlbmd0aFxuICBpZiAodHlwZSA9PT0gJ251bWJlcicpXG4gICAgbGVuZ3RoID0gc3ViamVjdCA+IDAgPyBzdWJqZWN0ID4+PiAwIDogMFxuICBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGlmIChlbmNvZGluZyA9PT0gJ2Jhc2U2NCcpXG4gICAgICBzdWJqZWN0ID0gYmFzZTY0Y2xlYW4oc3ViamVjdClcbiAgICBsZW5ndGggPSBCdWZmZXIuYnl0ZUxlbmd0aChzdWJqZWN0LCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0JyAmJiBzdWJqZWN0ICE9PSBudWxsKSB7IC8vIGFzc3VtZSBvYmplY3QgaXMgYXJyYXktbGlrZVxuICAgIGlmIChzdWJqZWN0LnR5cGUgPT09ICdCdWZmZXInICYmIGlzQXJyYXkoc3ViamVjdC5kYXRhKSlcbiAgICAgIHN1YmplY3QgPSBzdWJqZWN0LmRhdGFcbiAgICBsZW5ndGggPSArc3ViamVjdC5sZW5ndGggPiAwID8gTWF0aC5mbG9vcigrc3ViamVjdC5sZW5ndGgpIDogMFxuICB9IGVsc2VcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtdXN0IHN0YXJ0IHdpdGggbnVtYmVyLCBidWZmZXIsIGFycmF5IG9yIHN0cmluZycpXG5cbiAgaWYgKHRoaXMubGVuZ3RoID4ga01heExlbmd0aClcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICdzaXplOiAweCcgKyBrTWF4TGVuZ3RoLnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuXG4gIHZhciBidWZcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUHJlZmVycmVkOiBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGJ1ZiA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gVEhJUyBpbnN0YW5jZSBvZiBCdWZmZXIgKGNyZWF0ZWQgYnkgYG5ld2ApXG4gICAgYnVmID0gdGhpc1xuICAgIGJ1Zi5sZW5ndGggPSBsZW5ndGhcbiAgICBidWYuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIHR5cGVvZiBzdWJqZWN0LmJ5dGVMZW5ndGggPT09ICdudW1iZXInKSB7XG4gICAgLy8gU3BlZWQgb3B0aW1pemF0aW9uIC0tIHVzZSBzZXQgaWYgd2UncmUgY29weWluZyBmcm9tIGEgdHlwZWQgYXJyYXlcbiAgICBidWYuX3NldChzdWJqZWN0KVxuICB9IGVsc2UgaWYgKGlzQXJyYXlpc2goc3ViamVjdCkpIHtcbiAgICAvLyBUcmVhdCBhcnJheS1pc2ggb2JqZWN0cyBhcyBhIGJ5dGUgYXJyYXlcbiAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN1YmplY3QpKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspXG4gICAgICAgIGJ1ZltpXSA9IHN1YmplY3QucmVhZFVJbnQ4KGkpXG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKylcbiAgICAgICAgYnVmW2ldID0gKChzdWJqZWN0W2ldICUgMjU2KSArIDI1NikgJSAyNTZcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBidWYud3JpdGUoc3ViamVjdCwgMCwgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ251bWJlcicgJiYgIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmICFub1plcm8pIHtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGJ1ZltpXSA9IDBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIChiKSB7XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSlcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuICYmIGFbaV0gPT09IGJbaV07IGkrKykge31cbiAgaWYgKGkgIT09IGxlbikge1xuICAgIHggPSBhW2ldXG4gICAgeSA9IGJbaV1cbiAgfVxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICdyYXcnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gKGxpc3QsIHRvdGFsTGVuZ3RoKSB7XG4gIGlmICghaXNBcnJheShsaXN0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVXNhZ2U6IEJ1ZmZlci5jb25jYXQobGlzdFssIGxlbmd0aF0pJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9IGVsc2UgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGxpc3RbMF1cbiAgfVxuXG4gIHZhciBpXG4gIGlmICh0b3RhbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdG90YWxMZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRvdGFsTGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIodG90YWxMZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuQnVmZmVyLmJ5dGVMZW5ndGggPSBmdW5jdGlvbiAoc3RyLCBlbmNvZGluZykge1xuICB2YXIgcmV0XG4gIHN0ciA9IHN0ciArICcnXG4gIHN3aXRjaCAoZW5jb2RpbmcgfHwgJ3V0ZjgnKSB7XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAncmF3JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGhcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggKiAyXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoID4+PiAxXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG4vLyBwcmUtc2V0IGZvciB2YWx1ZXMgdGhhdCBtYXkgZXhpc3QgaW4gdGhlIGZ1dHVyZVxuQnVmZmVyLnByb3RvdHlwZS5sZW5ndGggPSB1bmRlZmluZWRcbkJ1ZmZlci5wcm90b3R5cGUucGFyZW50ID0gdW5kZWZpbmVkXG5cbi8vIHRvU3RyaW5nKGVuY29kaW5nLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICBzdGFydCA9IHN0YXJ0ID4+PiAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA9PT0gSW5maW5pdHkgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG4gIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmIChlbmQgPD0gc3RhcnQpIHJldHVybiAnJ1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSlcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gKGIpIHtcbiAgaWYoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBpZiAodGhpcy5sZW5ndGggPiAwKSB7XG4gICAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5tYXRjaCgvLnsyfS9nKS5qb2luKCcgJylcbiAgICBpZiAodGhpcy5sZW5ndGggPiBtYXgpXG4gICAgICBzdHIgKz0gJyAuLi4gJ1xuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpXG59XG5cbi8vIGBnZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5nZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLnJlYWRVSW50OChvZmZzZXQpXG59XG5cbi8vIGBzZXRgIHdpbGwgYmUgcmVtb3ZlZCBpbiBOb2RlIDAuMTMrXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uICh2LCBvZmZzZXQpIHtcbiAgY29uc29sZS5sb2coJy5zZXQoKSBpcyBkZXByZWNhdGVkLiBBY2Nlc3MgdXNpbmcgYXJyYXkgaW5kZXhlcyBpbnN0ZWFkLicpXG4gIHJldHVybiB0aGlzLndyaXRlVUludDgodiwgb2Zmc2V0KVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIC8vIG11c3QgYmUgYW4gZXZlbiBudW1iZXIgb2YgZGlnaXRzXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG4gIGlmIChzdHJMZW4gJSAyICE9PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBieXRlID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihieXRlKSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IGJ5dGVcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBiaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG4gIHJldHVybiBjaGFyc1dyaXR0ZW5cbn1cblxuZnVuY3Rpb24gdXRmMTZsZVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIGNoYXJzV3JpdHRlbiA9IGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIFN1cHBvcnQgYm90aCAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpXG4gIC8vIGFuZCB0aGUgbGVnYWN5IChzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBpZiAoIWlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7ICAvLyBsZWdhY3lcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGhcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgICByZXQgPSB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYXNjaWknOlxuICAgICAgcmV0ID0gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgIHJldCA9IGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSB1dGYxNmxlV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmVzID0gJydcbiAgdmFyIHRtcCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGlmIChidWZbaV0gPD0gMHg3Rikge1xuICAgICAgcmVzICs9IGRlY29kZVV0ZjhDaGFyKHRtcCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgICAgIHRtcCA9ICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIHRtcCArPSAnJScgKyBidWZbaV0udG9TdHJpbmcoMTYpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcyArIGRlY29kZVV0ZjhDaGFyKHRtcClcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBiaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHJldHVybiBhc2NpaVNsaWNlKGJ1Ziwgc3RhcnQsIGVuZClcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2kgKyAxXSAqIDI1NilcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuO1xuICAgIGlmIChzdGFydCA8IDApXG4gICAgICBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMClcbiAgICAgIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydClcbiAgICBlbmQgPSBzdGFydFxuXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHJldHVybiBCdWZmZXIuX2F1Z21lbnQodGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSlcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIHZhciBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQsIHRydWUpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gICAgcmV0dXJuIG5ld0J1ZlxuICB9XG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKVxuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpXG4gICAgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdidWZmZXIgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCAyKTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuZnVuY3Rpb24gb2JqZWN0V3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuKSB7XG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDQpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlID4+PiAobGl0dGxlRW5kaWFuID8gaSA6IDMgLSBpKSAqIDgpICYgMHhmZlxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Ugb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Ugb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydClcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gdmFsdWVcbiAgfSBlbHNlIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFR5cGVFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpXG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAodGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXNcblxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoIXRhcmdldF9zdGFydCkgdGFyZ2V0X3N0YXJ0ID0gMFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHNvdXJjZS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzb3VyY2VFbmQgPCBzb3VyY2VTdGFydCcpXG4gIGlmICh0YXJnZXRfc3RhcnQgPCAwIHx8IHRhcmdldF9zdGFydCA+PSB0YXJnZXQubGVuZ3RoKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHNvdXJjZS5sZW5ndGgpIHRocm93IG5ldyBUeXBlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCB8fCBlbmQgPiBzb3VyY2UubGVuZ3RoKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKVxuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgZW5kIC0gc3RhcnQpXG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCArIHN0YXJ0XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKGxlbiA8IDEwMDAgfHwgIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRfc3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRhcmdldC5fc2V0KHRoaXMuc3ViYXJyYXkoc3RhcnQsIHN0YXJ0ICsgbGVuKSwgdGFyZ2V0X3N0YXJ0KVxuICB9XG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmQgPCBzdGFydCcpXG5cbiAgLy8gRmlsbCAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdzdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDAgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSB1dGY4VG9CeXRlcyh2YWx1ZS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAgIHJldHVybiAobmV3IEJ1ZmZlcih0aGlzKSkuYnVmZmVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmxlbmd0aClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQnVmZmVyLnRvQXJyYXlCdWZmZXIgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXInKVxuICB9XG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIEJQID0gQnVmZmVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEF1Z21lbnQgYSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgVWludDhBcnJheSBjbGFzcyEpIHdpdGggQnVmZmVyIG1ldGhvZHNcbiAqL1xuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gKGFycikge1xuICBhcnIuY29uc3RydWN0b3IgPSBCdWZmZXJcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IGdldC9zZXQgbWV0aG9kcyBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9nZXQgPSBhcnIuZ2V0XG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWQsIHdpbGwgYmUgcmVtb3ZlZCBpbiBub2RlIDAuMTMrXG4gIGFyci5nZXQgPSBCUC5nZXRcbiAgYXJyLnNldCA9IEJQLnNldFxuXG4gIGFyci53cml0ZSA9IEJQLndyaXRlXG4gIGFyci50b1N0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0xvY2FsZVN0cmluZyA9IEJQLnRvU3RyaW5nXG4gIGFyci50b0pTT04gPSBCUC50b0pTT05cbiAgYXJyLmVxdWFscyA9IEJQLmVxdWFsc1xuICBhcnIuY29tcGFyZSA9IEJQLmNvbXBhcmVcbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludDggPSBCUC5yZWFkVUludDhcbiAgYXJyLnJlYWRVSW50MTZMRSA9IEJQLnJlYWRVSW50MTZMRVxuICBhcnIucmVhZFVJbnQxNkJFID0gQlAucmVhZFVJbnQxNkJFXG4gIGFyci5yZWFkVUludDMyTEUgPSBCUC5yZWFkVUludDMyTEVcbiAgYXJyLnJlYWRVSW50MzJCRSA9IEJQLnJlYWRVSW50MzJCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnQ4ID0gQlAud3JpdGVJbnQ4XG4gIGFyci53cml0ZUludDE2TEUgPSBCUC53cml0ZUludDE2TEVcbiAgYXJyLndyaXRlSW50MTZCRSA9IEJQLndyaXRlSW50MTZCRVxuICBhcnIud3JpdGVJbnQzMkxFID0gQlAud3JpdGVJbnQzMkxFXG4gIGFyci53cml0ZUludDMyQkUgPSBCUC53cml0ZUludDMyQkVcbiAgYXJyLndyaXRlRmxvYXRMRSA9IEJQLndyaXRlRmxvYXRMRVxuICBhcnIud3JpdGVGbG9hdEJFID0gQlAud3JpdGVGbG9hdEJFXG4gIGFyci53cml0ZURvdWJsZUxFID0gQlAud3JpdGVEb3VibGVMRVxuICBhcnIud3JpdGVEb3VibGVCRSA9IEJQLndyaXRlRG91YmxlQkVcbiAgYXJyLmZpbGwgPSBCUC5maWxsXG4gIGFyci5pbnNwZWN0ID0gQlAuaW5zcGVjdFxuICBhcnIudG9BcnJheUJ1ZmZlciA9IEJQLnRvQXJyYXlCdWZmZXJcblxuICByZXR1cm4gYXJyXG59XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLXpdL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyaW5ndHJpbShzdHIpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG5mdW5jdGlvbiBpc0FycmF5aXNoIChzdWJqZWN0KSB7XG4gIHJldHVybiBpc0FycmF5KHN1YmplY3QpIHx8IEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSB8fFxuICAgICAgc3ViamVjdCAmJiB0eXBlb2Ygc3ViamVjdCA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZiBzdWJqZWN0Lmxlbmd0aCA9PT0gJ251bWJlcidcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIHZhciBiID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBpZiAoYiA8PSAweDdGKSB7XG4gICAgICBieXRlQXJyYXkucHVzaChiKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgc3RhcnQgPSBpXG4gICAgICBpZiAoYiA+PSAweEQ4MDAgJiYgYiA8PSAweERGRkYpIGkrK1xuICAgICAgdmFyIGggPSBlbmNvZGVVUklDb21wb25lbnQoc3RyLnNsaWNlKHN0YXJ0LCBpKzEpKS5zdWJzdHIoMSkuc3BsaXQoJyUnKVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBoLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGJ5dGVBcnJheS5wdXNoKHBhcnNlSW50KGhbal0sIDE2KSlcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoc3RyKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSlcbiAgICAgIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gZGVjb2RlVXRmOENoYXIgKHN0cikge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyKVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgweEZGRkQpIC8vIFVURiA4IGludmFsaWQgY2hhclxuICB9XG59XG4iLCJ2YXIgbG9va3VwID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nO1xuXG47KGZ1bmN0aW9uIChleHBvcnRzKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuICB2YXIgQXJyID0gKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJylcbiAgICA/IFVpbnQ4QXJyYXlcbiAgICA6IEFycmF5XG5cblx0dmFyIFBMVVMgICA9ICcrJy5jaGFyQ29kZUF0KDApXG5cdHZhciBTTEFTSCAgPSAnLycuY2hhckNvZGVBdCgwKVxuXHR2YXIgTlVNQkVSID0gJzAnLmNoYXJDb2RlQXQoMClcblx0dmFyIExPV0VSICA9ICdhJy5jaGFyQ29kZUF0KDApXG5cdHZhciBVUFBFUiAgPSAnQScuY2hhckNvZGVBdCgwKVxuXG5cdGZ1bmN0aW9uIGRlY29kZSAoZWx0KSB7XG5cdFx0dmFyIGNvZGUgPSBlbHQuY2hhckNvZGVBdCgwKVxuXHRcdGlmIChjb2RlID09PSBQTFVTKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSClcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24oYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSxcbiAgICAgIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDEsXG4gICAgICBlTWF4ID0gKDEgPDwgZUxlbikgLSAxLFxuICAgICAgZUJpYXMgPSBlTWF4ID4+IDEsXG4gICAgICBuQml0cyA9IC03LFxuICAgICAgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwLFxuICAgICAgZCA9IGlzTEUgPyAtMSA6IDEsXG4gICAgICBzID0gYnVmZmVyW29mZnNldCArIGldO1xuXG4gIGkgKz0gZDtcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgcyA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IGVMZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSBlICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpO1xuICBlID4+PSAoLW5CaXRzKTtcbiAgbkJpdHMgKz0gbUxlbjtcbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCk7XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzO1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSk7XG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICBlID0gZSAtIGVCaWFzO1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pO1xufTtcblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjLFxuICAgICAgZUxlbiA9IG5CeXRlcyAqIDggLSBtTGVuIC0gMSxcbiAgICAgIGVNYXggPSAoMSA8PCBlTGVuKSAtIDEsXG4gICAgICBlQmlhcyA9IGVNYXggPj4gMSxcbiAgICAgIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKSxcbiAgICAgIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKSxcbiAgICAgIGQgPSBpc0xFID8gMSA6IC0xLFxuICAgICAgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMDtcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKTtcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMDtcbiAgICBlID0gZU1heDtcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMik7XG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tO1xuICAgICAgYyAqPSAyO1xuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gYztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpO1xuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrKztcbiAgICAgIGMgLz0gMjtcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwO1xuICAgICAgZSA9IGVNYXg7XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICh2YWx1ZSAqIGMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IGUgKyBlQmlhcztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pO1xuICAgICAgZSA9IDA7XG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCk7XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbTtcbiAgZUxlbiArPSBtTGVuO1xuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpO1xuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyODtcbn07XG4iLCJcbi8qKlxuICogaXNBcnJheVxuICovXG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiB0b1N0cmluZ1xuICovXG5cbnZhciBzdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBgdmFsYFxuICogaXMgYW4gYXJyYXkuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgaXNBcnJheShbXSk7XG4gKiAgICAgICAgLy8gPiB0cnVlXG4gKiAgICAgICAgaXNBcnJheShhcmd1bWVudHMpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqICAgICAgICBpc0FycmF5KCcnKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKlxuICogQHBhcmFtIHttaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtib29sfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiAhISB2YWwgJiYgJ1tvYmplY3QgQXJyYXldJyA9PSBzdHIuY2FsbCh2YWwpO1xufTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhbk11dGF0aW9uT2JzZXJ2ZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIHZhciBxdWV1ZSA9IFtdO1xuXG4gICAgaWYgKGNhbk11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgICAgdmFyIGhpZGRlbkRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBxdWV1ZUxpc3QgPSBxdWV1ZS5zbGljZSgpO1xuICAgICAgICAgICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgIHF1ZXVlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShoaWRkZW5EaXYsIHsgYXR0cmlidXRlczogdHJ1ZSB9KTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIGlmICghcXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaGlkZGVuRGl2LnNldEF0dHJpYnV0ZSgneWVzJywgJ25vJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCIvKlxuXG5UaGUgTUlUIExpY2Vuc2UgKE1JVClcblxuT3JpZ2luYWwgTGlicmFyeSBcbiAgLSBDb3B5cmlnaHQgKGMpIE1hcmFrIFNxdWlyZXNcblxuQWRkaXRpb25hbCBmdW5jdGlvbmFsaXR5XG4gLSBDb3B5cmlnaHQgKGMpIFNpbmRyZSBTb3JodXMgPHNpbmRyZXNvcmh1c0BnbWFpbC5jb20+IChzaW5kcmVzb3JodXMuY29tKVxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuXG5cbiovXG5cbnZhciBjb2xvcnMgPSB7fTtcbm1vZHVsZVsnZXhwb3J0cyddID0gY29sb3JzO1xuXG5jb2xvcnMudGhlbWVzID0ge307XG5cbnZhciBhbnNpU3R5bGVzID0gY29sb3JzLnN0eWxlcyA9IHJlcXVpcmUoJy4vc3R5bGVzJyk7XG52YXIgZGVmaW5lUHJvcHMgPSBPYmplY3QuZGVmaW5lUHJvcGVydGllcztcblxuY29sb3JzLnN1cHBvcnRzQ29sb3IgPSByZXF1aXJlKCcuL3N5c3RlbS9zdXBwb3J0cy1jb2xvcnMnKTtcblxuaWYgKHR5cGVvZiBjb2xvcnMuZW5hYmxlZCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICBjb2xvcnMuZW5hYmxlZCA9IGNvbG9ycy5zdXBwb3J0c0NvbG9yO1xufVxuXG5jb2xvcnMuc3RyaXBDb2xvcnMgPSBjb2xvcnMuc3RyaXAgPSBmdW5jdGlvbihzdHIpe1xuICByZXR1cm4gKFwiXCIgKyBzdHIpLnJlcGxhY2UoL1xceDFCXFxbXFxkK20vZywgJycpO1xufTtcblxuXG52YXIgc3R5bGl6ZSA9IGNvbG9ycy5zdHlsaXplID0gZnVuY3Rpb24gc3R5bGl6ZSAoc3RyLCBzdHlsZSkge1xuICByZXR1cm4gYW5zaVN0eWxlc1tzdHlsZV0ub3BlbiArIHN0ciArIGFuc2lTdHlsZXNbc3R5bGVdLmNsb3NlO1xufVxuXG52YXIgbWF0Y2hPcGVyYXRvcnNSZSA9IC9bfFxcXFx7fSgpW1xcXV4kKyo/Ll0vZztcbnZhciBlc2NhcGVTdHJpbmdSZWdleHAgPSBmdW5jdGlvbiAoc3RyKSB7XG4gIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGEgc3RyaW5nJyk7XG4gIH1cbiAgcmV0dXJuIHN0ci5yZXBsYWNlKG1hdGNoT3BlcmF0b3JzUmUsICAnXFxcXCQmJyk7XG59XG5cbmZ1bmN0aW9uIGJ1aWxkKF9zdHlsZXMpIHtcbiAgdmFyIGJ1aWxkZXIgPSBmdW5jdGlvbiBidWlsZGVyKCkge1xuICAgIHJldHVybiBhcHBseVN0eWxlLmFwcGx5KGJ1aWxkZXIsIGFyZ3VtZW50cyk7XG4gIH07XG4gIGJ1aWxkZXIuX3N0eWxlcyA9IF9zdHlsZXM7XG4gIC8vIF9fcHJvdG9fXyBpcyB1c2VkIGJlY2F1c2Ugd2UgbXVzdCByZXR1cm4gYSBmdW5jdGlvbiwgYnV0IHRoZXJlIGlzXG4gIC8vIG5vIHdheSB0byBjcmVhdGUgYSBmdW5jdGlvbiB3aXRoIGEgZGlmZmVyZW50IHByb3RvdHlwZS5cbiAgYnVpbGRlci5fX3Byb3RvX18gPSBwcm90bztcbiAgcmV0dXJuIGJ1aWxkZXI7XG59XG5cbnZhciBzdHlsZXMgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcmV0ID0ge307XG4gIGFuc2lTdHlsZXMuZ3JleSA9IGFuc2lTdHlsZXMuZ3JheTtcbiAgT2JqZWN0LmtleXMoYW5zaVN0eWxlcykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgYW5zaVN0eWxlc1trZXldLmNsb3NlUmUgPSBuZXcgUmVnRXhwKGVzY2FwZVN0cmluZ1JlZ2V4cChhbnNpU3R5bGVzW2tleV0uY2xvc2UpLCAnZycpO1xuICAgIHJldFtrZXldID0ge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBidWlsZCh0aGlzLl9zdHlsZXMuY29uY2F0KGtleSkpO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuICByZXR1cm4gcmV0O1xufSkoKTtcblxudmFyIHByb3RvID0gZGVmaW5lUHJvcHMoZnVuY3Rpb24gY29sb3JzKCkge30sIHN0eWxlcyk7XG5cbmZ1bmN0aW9uIGFwcGx5U3R5bGUoKSB7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgYXJnc0xlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gYXJnc0xlbiAhPT0gMCAmJiBTdHJpbmcoYXJndW1lbnRzWzBdKTtcbiAgaWYgKGFyZ3NMZW4gPiAxKSB7XG4gICAgZm9yICh2YXIgYSA9IDE7IGEgPCBhcmdzTGVuOyBhKyspIHtcbiAgICAgIHN0ciArPSAnICcgKyBhcmdzW2FdO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY29sb3JzLmVuYWJsZWQgfHwgIXN0cikge1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICB2YXIgbmVzdGVkU3R5bGVzID0gdGhpcy5fc3R5bGVzO1xuXG4gIHZhciBpID0gbmVzdGVkU3R5bGVzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIHZhciBjb2RlID0gYW5zaVN0eWxlc1tuZXN0ZWRTdHlsZXNbaV1dO1xuICAgIHN0ciA9IGNvZGUub3BlbiArIHN0ci5yZXBsYWNlKGNvZGUuY2xvc2VSZSwgY29kZS5vcGVuKSArIGNvZGUuY2xvc2U7XG4gIH1cblxuICByZXR1cm4gc3RyO1xufVxuXG5mdW5jdGlvbiBhcHBseVRoZW1lICh0aGVtZSkge1xuICBmb3IgKHZhciBzdHlsZSBpbiB0aGVtZSkge1xuICAgIChmdW5jdGlvbihzdHlsZSl7XG4gICAgICBjb2xvcnNbc3R5bGVdID0gZnVuY3Rpb24oc3RyKXtcbiAgICAgICAgcmV0dXJuIGNvbG9yc1t0aGVtZVtzdHlsZV1dKHN0cik7XG4gICAgICB9O1xuICAgIH0pKHN0eWxlKVxuICB9XG59XG5cbmNvbG9ycy5zZXRUaGVtZSA9IGZ1bmN0aW9uICh0aGVtZSkge1xuICBpZiAodHlwZW9mIHRoZW1lID09PSAnc3RyaW5nJykge1xuICAgIHRyeSB7XG4gICAgICBjb2xvcnMudGhlbWVzW3RoZW1lXSA9IHJlcXVpcmUodGhlbWUpO1xuICAgICAgYXBwbHlUaGVtZShjb2xvcnMudGhlbWVzW3RoZW1lXSk7XG4gICAgICByZXR1cm4gY29sb3JzLnRoZW1lc1t0aGVtZV07XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgcmV0dXJuIGVycjtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYXBwbHlUaGVtZSh0aGVtZSk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gIHZhciByZXQgPSB7fTtcbiAgT2JqZWN0LmtleXMoc3R5bGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0W25hbWVdID0ge1xuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBidWlsZChbbmFtZV0pO1xuICAgICAgfVxuICAgIH07XG4gIH0pO1xuICByZXR1cm4gcmV0O1xufVxuXG52YXIgc2VxdWVuY2VyID0gZnVuY3Rpb24gc2VxdWVuY2VyIChtYXAsIHN0cikge1xuICB2YXIgZXhwbG9kZWQgPSBzdHIuc3BsaXQoXCJcIiksIGkgPSAwO1xuICBleHBsb2RlZCA9IGV4cGxvZGVkLm1hcChtYXApO1xuICByZXR1cm4gZXhwbG9kZWQuam9pbihcIlwiKTtcbn07XG5cbi8vIGN1c3RvbSBmb3JtYXR0ZXIgbWV0aG9kc1xuY29sb3JzLnRyYXAgPSByZXF1aXJlKCcuL2N1c3RvbS90cmFwJyk7XG5jb2xvcnMuemFsZ28gPSByZXF1aXJlKCcuL2N1c3RvbS96YWxnbycpO1xuXG4vLyBtYXBzXG5jb2xvcnMubWFwcyA9IHt9O1xuY29sb3JzLm1hcHMuYW1lcmljYSA9IHJlcXVpcmUoJy4vbWFwcy9hbWVyaWNhJyk7XG5jb2xvcnMubWFwcy56ZWJyYSA9IHJlcXVpcmUoJy4vbWFwcy96ZWJyYScpO1xuY29sb3JzLm1hcHMucmFpbmJvdyA9IHJlcXVpcmUoJy4vbWFwcy9yYWluYm93Jyk7XG5jb2xvcnMubWFwcy5yYW5kb20gPSByZXF1aXJlKCcuL21hcHMvcmFuZG9tJylcblxuZm9yICh2YXIgbWFwIGluIGNvbG9ycy5tYXBzKSB7XG4gIChmdW5jdGlvbihtYXApe1xuICAgIGNvbG9yc1ttYXBdID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgcmV0dXJuIHNlcXVlbmNlcihjb2xvcnMubWFwc1ttYXBdLCBzdHIpO1xuICAgIH1cbiAgfSkobWFwKVxufVxuXG5kZWZpbmVQcm9wcyhjb2xvcnMsIGluaXQoKSk7IiwibW9kdWxlWydleHBvcnRzJ10gPSBmdW5jdGlvbiBydW5UaGVUcmFwICh0ZXh0LCBvcHRpb25zKSB7XG4gIHZhciByZXN1bHQgPSBcIlwiO1xuICB0ZXh0ID0gdGV4dCB8fCBcIlJ1biB0aGUgdHJhcCwgZHJvcCB0aGUgYmFzc1wiO1xuICB0ZXh0ID0gdGV4dC5zcGxpdCgnJyk7XG4gIHZhciB0cmFwID0ge1xuICAgIGE6IFtcIlxcdTAwNDBcIiwgXCJcXHUwMTA0XCIsIFwiXFx1MDIzYVwiLCBcIlxcdTAyNDVcIiwgXCJcXHUwMzk0XCIsIFwiXFx1MDM5YlwiLCBcIlxcdTA0MTRcIl0sXG4gICAgYjogW1wiXFx1MDBkZlwiLCBcIlxcdTAxODFcIiwgXCJcXHUwMjQzXCIsIFwiXFx1MDI2ZVwiLCBcIlxcdTAzYjJcIiwgXCJcXHUwZTNmXCJdLFxuICAgIGM6IFtcIlxcdTAwYTlcIiwgXCJcXHUwMjNiXCIsIFwiXFx1MDNmZVwiXSxcbiAgICBkOiBbXCJcXHUwMGQwXCIsIFwiXFx1MDE4YVwiLCBcIlxcdTA1MDBcIiAsIFwiXFx1MDUwMVwiICxcIlxcdTA1MDJcIiwgXCJcXHUwNTAzXCJdLFxuICAgIGU6IFtcIlxcdTAwY2JcIiwgXCJcXHUwMTE1XCIsIFwiXFx1MDE4ZVwiLCBcIlxcdTAyNThcIiwgXCJcXHUwM2EzXCIsIFwiXFx1MDNiZVwiLCBcIlxcdTA0YmNcIiwgXCJcXHUwYTZjXCJdLFxuICAgIGY6IFtcIlxcdTA0ZmFcIl0sXG4gICAgZzogW1wiXFx1MDI2MlwiXSxcbiAgICBoOiBbXCJcXHUwMTI2XCIsIFwiXFx1MDE5NVwiLCBcIlxcdTA0YTJcIiwgXCJcXHUwNGJhXCIsIFwiXFx1MDRjN1wiLCBcIlxcdTA1MGFcIl0sXG4gICAgaTogW1wiXFx1MGYwZlwiXSxcbiAgICBqOiBbXCJcXHUwMTM0XCJdLFxuICAgIGs6IFtcIlxcdTAxMzhcIiwgXCJcXHUwNGEwXCIsIFwiXFx1MDRjM1wiLCBcIlxcdTA1MWVcIl0sXG4gICAgbDogW1wiXFx1MDEzOVwiXSxcbiAgICBtOiBbXCJcXHUwMjhkXCIsIFwiXFx1MDRjZFwiLCBcIlxcdTA0Y2VcIiwgXCJcXHUwNTIwXCIsIFwiXFx1MDUyMVwiLCBcIlxcdTBkNjlcIl0sXG4gICAgbjogW1wiXFx1MDBkMVwiLCBcIlxcdTAxNGJcIiwgXCJcXHUwMTlkXCIsIFwiXFx1MDM3NlwiLCBcIlxcdTAzYTBcIiwgXCJcXHUwNDhhXCJdLFxuICAgIG86IFtcIlxcdTAwZDhcIiwgXCJcXHUwMGY1XCIsIFwiXFx1MDBmOFwiLCBcIlxcdTAxZmVcIiwgXCJcXHUwMjk4XCIsIFwiXFx1MDQ3YVwiLCBcIlxcdTA1ZGRcIiwgXCJcXHUwNmRkXCIsIFwiXFx1MGU0ZlwiXSxcbiAgICBwOiBbXCJcXHUwMWY3XCIsIFwiXFx1MDQ4ZVwiXSxcbiAgICBxOiBbXCJcXHUwOWNkXCJdLFxuICAgIHI6IFtcIlxcdTAwYWVcIiwgXCJcXHUwMWE2XCIsIFwiXFx1MDIxMFwiLCBcIlxcdTAyNGNcIiwgXCJcXHUwMjgwXCIsIFwiXFx1MDQyZlwiXSxcbiAgICBzOiBbXCJcXHUwMGE3XCIsIFwiXFx1MDNkZVwiLCBcIlxcdTAzZGZcIiwgXCJcXHUwM2U4XCJdLFxuICAgIHQ6IFtcIlxcdTAxNDFcIiwgXCJcXHUwMTY2XCIsIFwiXFx1MDM3M1wiXSxcbiAgICB1OiBbXCJcXHUwMWIxXCIsIFwiXFx1MDU0ZFwiXSxcbiAgICB2OiBbXCJcXHUwNWQ4XCJdLFxuICAgIHc6IFtcIlxcdTA0MjhcIiwgXCJcXHUwNDYwXCIsIFwiXFx1MDQ3Y1wiLCBcIlxcdTBkNzBcIl0sXG4gICAgeDogW1wiXFx1MDRiMlwiLCBcIlxcdTA0ZmVcIiwgXCJcXHUwNGZjXCIsIFwiXFx1MDRmZFwiXSxcbiAgICB5OiBbXCJcXHUwMGE1XCIsIFwiXFx1MDRiMFwiLCBcIlxcdTA0Y2JcIl0sXG4gICAgejogW1wiXFx1MDFiNVwiLCBcIlxcdTAyNDBcIl1cbiAgfVxuICB0ZXh0LmZvckVhY2goZnVuY3Rpb24oYyl7XG4gICAgYyA9IGMudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgY2hhcnMgPSB0cmFwW2NdIHx8IFtcIiBcIl07XG4gICAgdmFyIHJhbmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFycy5sZW5ndGgpO1xuICAgIGlmICh0eXBlb2YgdHJhcFtjXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcmVzdWx0ICs9IHRyYXBbY11bcmFuZF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCArPSBjO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG5cbn1cbiIsIi8vIHBsZWFzZSBub1xubW9kdWxlWydleHBvcnRzJ10gPSBmdW5jdGlvbiB6YWxnbyh0ZXh0LCBvcHRpb25zKSB7XG4gIHRleHQgPSB0ZXh0IHx8IFwiICAgaGUgaXMgaGVyZSAgIFwiO1xuICB2YXIgc291bCA9IHtcbiAgICBcInVwXCIgOiBbXG4gICAgICAnzI0nLCAnzI4nLCAnzIQnLCAnzIUnLFxuICAgICAgJ8y/JywgJ8yRJywgJ8yGJywgJ8yQJyxcbiAgICAgICfNkicsICfNlycsICfNkScsICfMhycsXG4gICAgICAnzIgnLCAnzIonLCAnzYInLCAnzJMnLFxuICAgICAgJ8yIJywgJ82KJywgJ82LJywgJ82MJyxcbiAgICAgICfMgycsICfMgicsICfMjCcsICfNkCcsXG4gICAgICAnzIAnLCAnzIEnLCAnzIsnLCAnzI8nLFxuICAgICAgJ8ySJywgJ8yTJywgJ8yUJywgJ8y9JyxcbiAgICAgICfMiScsICfNoycsICfNpCcsICfNpScsXG4gICAgICAnzaYnLCAnzacnLCAnzagnLCAnzaknLFxuICAgICAgJ82qJywgJ82rJywgJ82sJywgJ82tJyxcbiAgICAgICfNricsICfNrycsICfMvicsICfNmycsXG4gICAgICAnzYYnLCAnzJonXG4gICAgXSxcbiAgICBcImRvd25cIiA6IFtcbiAgICAgICfMlicsICfMlycsICfMmCcsICfMmScsXG4gICAgICAnzJwnLCAnzJ0nLCAnzJ4nLCAnzJ8nLFxuICAgICAgJ8ygJywgJ8ykJywgJ8ylJywgJ8ymJyxcbiAgICAgICfMqScsICfMqicsICfMqycsICfMrCcsXG4gICAgICAnzK0nLCAnzK4nLCAnzK8nLCAnzLAnLFxuICAgICAgJ8yxJywgJ8yyJywgJ8yzJywgJ8y5JyxcbiAgICAgICfMuicsICfMuycsICfMvCcsICfNhScsXG4gICAgICAnzYcnLCAnzYgnLCAnzYknLCAnzY0nLFxuICAgICAgJ82OJywgJ82TJywgJ82UJywgJ82VJyxcbiAgICAgICfNlicsICfNmScsICfNmicsICfMoydcbiAgICBdLFxuICAgIFwibWlkXCIgOiBbXG4gICAgICAnzJUnLCAnzJsnLCAnzIAnLCAnzIEnLFxuICAgICAgJ82YJywgJ8yhJywgJ8yiJywgJ8ynJyxcbiAgICAgICfMqCcsICfMtCcsICfMtScsICfMticsXG4gICAgICAnzZwnLCAnzZ0nLCAnzZ4nLFxuICAgICAgJ82fJywgJ82gJywgJ82iJywgJ8y4JyxcbiAgICAgICfMtycsICfNoScsICcg0oknXG4gICAgXVxuICB9LFxuICBhbGwgPSBbXS5jb25jYXQoc291bC51cCwgc291bC5kb3duLCBzb3VsLm1pZCksXG4gIHphbGdvID0ge307XG5cbiAgZnVuY3Rpb24gcmFuZG9tTnVtYmVyKHJhbmdlKSB7XG4gICAgdmFyIHIgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiByYW5nZSk7XG4gICAgcmV0dXJuIHI7XG4gIH1cblxuICBmdW5jdGlvbiBpc19jaGFyKGNoYXJhY3Rlcikge1xuICAgIHZhciBib29sID0gZmFsc2U7XG4gICAgYWxsLmZpbHRlcihmdW5jdGlvbiAoaSkge1xuICAgICAgYm9vbCA9IChpID09PSBjaGFyYWN0ZXIpO1xuICAgIH0pO1xuICAgIHJldHVybiBib29sO1xuICB9XG4gIFxuXG4gIGZ1bmN0aW9uIGhlQ29tZXModGV4dCwgb3B0aW9ucykge1xuICAgIHZhciByZXN1bHQgPSAnJywgY291bnRzLCBsO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIG9wdGlvbnNbXCJ1cFwiXSA9IG9wdGlvbnNbXCJ1cFwiXSB8fCB0cnVlO1xuICAgIG9wdGlvbnNbXCJtaWRcIl0gPSBvcHRpb25zW1wibWlkXCJdIHx8IHRydWU7XG4gICAgb3B0aW9uc1tcImRvd25cIl0gPSBvcHRpb25zW1wiZG93blwiXSB8fCB0cnVlO1xuICAgIG9wdGlvbnNbXCJzaXplXCJdID0gb3B0aW9uc1tcInNpemVcIl0gfHwgXCJtYXhpXCI7XG4gICAgdGV4dCA9IHRleHQuc3BsaXQoJycpO1xuICAgIGZvciAobCBpbiB0ZXh0KSB7XG4gICAgICBpZiAoaXNfY2hhcihsKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdCA9IHJlc3VsdCArIHRleHRbbF07XG4gICAgICBjb3VudHMgPSB7XCJ1cFwiIDogMCwgXCJkb3duXCIgOiAwLCBcIm1pZFwiIDogMH07XG4gICAgICBzd2l0Y2ggKG9wdGlvbnMuc2l6ZSkge1xuICAgICAgY2FzZSAnbWluaSc6XG4gICAgICAgIGNvdW50cy51cCA9IHJhbmRvbU51bWJlcig4KTtcbiAgICAgICAgY291bnRzLm1pbiA9IHJhbmRvbU51bWJlcigyKTtcbiAgICAgICAgY291bnRzLmRvd24gPSByYW5kb21OdW1iZXIoOCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbWF4aSc6XG4gICAgICAgIGNvdW50cy51cCA9IHJhbmRvbU51bWJlcigxNikgKyAzO1xuICAgICAgICBjb3VudHMubWluID0gcmFuZG9tTnVtYmVyKDQpICsgMTtcbiAgICAgICAgY291bnRzLmRvd24gPSByYW5kb21OdW1iZXIoNjQpICsgMztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb3VudHMudXAgPSByYW5kb21OdW1iZXIoOCkgKyAxO1xuICAgICAgICBjb3VudHMubWlkID0gcmFuZG9tTnVtYmVyKDYpIC8gMjtcbiAgICAgICAgY291bnRzLmRvd24gPSByYW5kb21OdW1iZXIoOCkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgdmFyIGFyciA9IFtcInVwXCIsIFwibWlkXCIsIFwiZG93blwiXTtcbiAgICAgIGZvciAodmFyIGQgaW4gYXJyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGFycltkXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAgOyBpIDw9IGNvdW50c1tpbmRleF07IGkrKykge1xuICAgICAgICAgIGlmIChvcHRpb25zW2luZGV4XSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0ICsgc291bFtpbmRleF1bcmFuZG9tTnVtYmVyKHNvdWxbaW5kZXhdLmxlbmd0aCldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIC8vIGRvbid0IHN1bW1vbiBoaW1cbiAgcmV0dXJuIGhlQ29tZXModGV4dCk7XG59XG4iLCJ2YXIgY29sb3JzID0gcmVxdWlyZSgnLi4vY29sb3JzJyk7XG5cbm1vZHVsZVsnZXhwb3J0cyddID0gKGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKGxldHRlciwgaSwgZXhwbG9kZWQpIHtcbiAgICBpZihsZXR0ZXIgPT09IFwiIFwiKSByZXR1cm4gbGV0dGVyO1xuICAgIHN3aXRjaChpJTMpIHtcbiAgICAgIGNhc2UgMDogcmV0dXJuIGNvbG9ycy5yZWQobGV0dGVyKTtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGNvbG9ycy53aGl0ZShsZXR0ZXIpXG4gICAgICBjYXNlIDI6IHJldHVybiBjb2xvcnMuYmx1ZShsZXR0ZXIpXG4gICAgfVxuICB9XG59KSgpOyIsInZhciBjb2xvcnMgPSByZXF1aXJlKCcuLi9jb2xvcnMnKTtcblxubW9kdWxlWydleHBvcnRzJ10gPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcmFpbmJvd0NvbG9ycyA9IFsncmVkJywgJ3llbGxvdycsICdncmVlbicsICdibHVlJywgJ21hZ2VudGEnXTsgLy9Sb1kgRyBCaVZcbiAgcmV0dXJuIGZ1bmN0aW9uIChsZXR0ZXIsIGksIGV4cGxvZGVkKSB7XG4gICAgaWYgKGxldHRlciA9PT0gXCIgXCIpIHtcbiAgICAgIHJldHVybiBsZXR0ZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb2xvcnNbcmFpbmJvd0NvbG9yc1tpKysgJSByYWluYm93Q29sb3JzLmxlbmd0aF1dKGxldHRlcik7XG4gICAgfVxuICB9O1xufSkoKTtcblxuIiwidmFyIGNvbG9ycyA9IHJlcXVpcmUoJy4uL2NvbG9ycycpO1xuXG5tb2R1bGVbJ2V4cG9ydHMnXSA9IChmdW5jdGlvbiAoKSB7XG4gIHZhciBhdmFpbGFibGUgPSBbJ3VuZGVybGluZScsICdpbnZlcnNlJywgJ2dyZXknLCAneWVsbG93JywgJ3JlZCcsICdncmVlbicsICdibHVlJywgJ3doaXRlJywgJ2N5YW4nLCAnbWFnZW50YSddO1xuICByZXR1cm4gZnVuY3Rpb24obGV0dGVyLCBpLCBleHBsb2RlZCkge1xuICAgIHJldHVybiBsZXR0ZXIgPT09IFwiIFwiID8gbGV0dGVyIDogY29sb3JzW2F2YWlsYWJsZVtNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAoYXZhaWxhYmxlLmxlbmd0aCAtIDEpKV1dKGxldHRlcik7XG4gIH07XG59KSgpOyIsInZhciBjb2xvcnMgPSByZXF1aXJlKCcuLi9jb2xvcnMnKTtcblxubW9kdWxlWydleHBvcnRzJ10gPSBmdW5jdGlvbiAobGV0dGVyLCBpLCBleHBsb2RlZCkge1xuICByZXR1cm4gaSAlIDIgPT09IDAgPyBsZXR0ZXIgOiBjb2xvcnMuaW52ZXJzZShsZXR0ZXIpO1xufTsiLCIvKlxuVGhlIE1JVCBMaWNlbnNlIChNSVQpXG5cbkNvcHlyaWdodCAoYykgU2luZHJlIFNvcmh1cyA8c2luZHJlc29yaHVzQGdtYWlsLmNvbT4gKHNpbmRyZXNvcmh1cy5jb20pXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cblxuKi9cblxudmFyIHN0eWxlcyA9IHt9O1xubW9kdWxlWydleHBvcnRzJ10gPSBzdHlsZXM7XG5cbnZhciBjb2RlcyA9IHtcbiAgcmVzZXQ6IFswLCAwXSxcblxuICBib2xkOiBbMSwgMjJdLFxuICBkaW06IFsyLCAyMl0sXG4gIGl0YWxpYzogWzMsIDIzXSxcbiAgdW5kZXJsaW5lOiBbNCwgMjRdLFxuICBpbnZlcnNlOiBbNywgMjddLFxuICBoaWRkZW46IFs4LCAyOF0sXG4gIHN0cmlrZXRocm91Z2g6IFs5LCAyOV0sXG5cbiAgYmxhY2s6IFszMCwgMzldLFxuICByZWQ6IFszMSwgMzldLFxuICBncmVlbjogWzMyLCAzOV0sXG4gIHllbGxvdzogWzMzLCAzOV0sXG4gIGJsdWU6IFszNCwgMzldLFxuICBtYWdlbnRhOiBbMzUsIDM5XSxcbiAgY3lhbjogWzM2LCAzOV0sXG4gIHdoaXRlOiBbMzcsIDM5XSxcbiAgZ3JheTogWzkwLCAzOV0sXG4gIGdyZXk6IFs5MCwgMzldLFxuXG4gIGJnQmxhY2s6IFs0MCwgNDldLFxuICBiZ1JlZDogWzQxLCA0OV0sXG4gIGJnR3JlZW46IFs0MiwgNDldLFxuICBiZ1llbGxvdzogWzQzLCA0OV0sXG4gIGJnQmx1ZTogWzQ0LCA0OV0sXG4gIGJnTWFnZW50YTogWzQ1LCA0OV0sXG4gIGJnQ3lhbjogWzQ2LCA0OV0sXG4gIGJnV2hpdGU6IFs0NywgNDldLFxuXG4gIC8vIGxlZ2FjeSBzdHlsZXMgZm9yIGNvbG9ycyBwcmUgdjEuMC4wXG4gIGJsYWNrQkc6IFs0MCwgNDldLFxuICByZWRCRzogWzQxLCA0OV0sXG4gIGdyZWVuQkc6IFs0MiwgNDldLFxuICB5ZWxsb3dCRzogWzQzLCA0OV0sXG4gIGJsdWVCRzogWzQ0LCA0OV0sXG4gIG1hZ2VudGFCRzogWzQ1LCA0OV0sXG4gIGN5YW5CRzogWzQ2LCA0OV0sXG4gIHdoaXRlQkc6IFs0NywgNDldXG5cbn07XG5cbk9iamVjdC5rZXlzKGNvZGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgdmFyIHZhbCA9IGNvZGVzW2tleV07XG4gIHZhciBzdHlsZSA9IHN0eWxlc1trZXldID0gW107XG4gIHN0eWxlLm9wZW4gPSAnXFx1MDAxYlsnICsgdmFsWzBdICsgJ20nO1xuICBzdHlsZS5jbG9zZSA9ICdcXHUwMDFiWycgKyB2YWxbMV0gKyAnbSc7XG59KTsiLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xuLypcblRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG5Db3B5cmlnaHQgKGMpIFNpbmRyZSBTb3JodXMgPHNpbmRyZXNvcmh1c0BnbWFpbC5jb20+IChzaW5kcmVzb3JodXMuY29tKVxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuXG5cbiovXG5cbnZhciBhcmd2ID0gcHJvY2Vzcy5hcmd2O1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG4gIGlmIChhcmd2LmluZGV4T2YoJy0tbm8tY29sb3InKSAhPT0gLTEgfHxcbiAgICBhcmd2LmluZGV4T2YoJy0tY29sb3I9ZmFsc2UnKSAhPT0gLTEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoYXJndi5pbmRleE9mKCctLWNvbG9yJykgIT09IC0xIHx8XG4gICAgYXJndi5pbmRleE9mKCctLWNvbG9yPXRydWUnKSAhPT0gLTEgfHxcbiAgICBhcmd2LmluZGV4T2YoJy0tY29sb3I9YWx3YXlzJykgIT09IC0xKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAocHJvY2Vzcy5zdGRvdXQgJiYgIXByb2Nlc3Muc3Rkb3V0LmlzVFRZKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmICgnQ09MT1JURVJNJyBpbiBwcm9jZXNzLmVudikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKHByb2Nlc3MuZW52LlRFUk0gPT09ICdkdW1iJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICgvXnNjcmVlbnxeeHRlcm18XnZ0MTAwfGNvbG9yfGFuc2l8Y3lnd2lufGxpbnV4L2kudGVzdChwcm9jZXNzLmVudi5URVJNKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufSkoKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKCdfcHJvY2VzcycpKSIsIi8vXG4vLyBSZW1hcms6IFJlcXVpcmluZyB0aGlzIGZpbGUgd2lsbCB1c2UgdGhlIFwic2FmZVwiIGNvbG9ycyBBUEkgd2hpY2ggd2lsbCBub3QgdG91Y2ggU3RyaW5nLnByb3RvdHlwZVxuLy9cbi8vICAgdmFyIGNvbG9ycyA9IHJlcXVpcmUoJ2NvbG9ycy9zYWZlKTtcbi8vICAgY29sb3JzLnJlZChcImZvb1wiKVxuLy9cbi8vXG52YXIgY29sb3JzID0gcmVxdWlyZSgnLi9saWIvY29sb3JzJyk7XG5tb2R1bGVbJ2V4cG9ydHMnXSA9IGNvbG9yczsiLCIoIC8vIE1vZHVsZSBib2lsZXJwbGF0ZSB0byBzdXBwb3J0IGJyb3dzZXIgZ2xvYmFscyBhbmQgYnJvd3NlcmlmeSBhbmQgQU1ELlxuICB0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgPyBmdW5jdGlvbiAobSkgeyBkZWZpbmUoXCJtc2dwYWNrLWpzXCIsIG0pOyB9IDpcbiAgdHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIgPyBmdW5jdGlvbiAobSkgeyBtb2R1bGUuZXhwb3J0cyA9IG0oKTsgfSA6XG4gIGZ1bmN0aW9uKG0peyB0aGlzLm1zZ3BhY2sgPSBtKCk7IH1cbikoZnVuY3Rpb24gKCkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBleHBvcnRzID0ge307XG5cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5mdW5jdGlvbiBpbnNwZWN0KGJ1ZmZlcikge1xuICBpZiAoYnVmZmVyID09PSB1bmRlZmluZWQpIHJldHVybiBcInVuZGVmaW5lZFwiO1xuICB2YXIgdmlldztcbiAgdmFyIHR5cGU7XG4gIGlmIChidWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHR5cGUgPSBcIkFycmF5QnVmZmVyXCI7XG4gICAgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuICB9XG4gIGVsc2UgaWYgKGJ1ZmZlciBpbnN0YW5jZW9mIERhdGFWaWV3KSB7XG4gICAgdHlwZSA9IFwiRGF0YVZpZXdcIjtcbiAgICB2aWV3ID0gYnVmZmVyO1xuICB9XG4gIGlmICghdmlldykgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGJ1ZmZlcik7XG4gIHZhciBieXRlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1ZmZlci5ieXRlTGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaSA+IDIwKSB7XG4gICAgICBieXRlcy5wdXNoKFwiLi4uXCIpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHZhciBieXRlID0gdmlldy5nZXRVaW50OChpKS50b1N0cmluZygxNik7XG4gICAgaWYgKGJ5dGUubGVuZ3RoID09PSAxKSBieXRlID0gXCIwXCIgKyBieXRlO1xuICAgIGJ5dGVzLnB1c2goYnl0ZSk7XG4gIH1cbiAgcmV0dXJuIFwiPFwiICsgdHlwZSArIFwiIFwiICsgYnl0ZXMuam9pbihcIiBcIikgKyBcIj5cIjtcbn1cblxuLy8gRW5jb2RlIHN0cmluZyBhcyB1dGY4IGludG8gZGF0YXZpZXcgYXQgb2Zmc2V0XG5leHBvcnRzLnV0ZjhXcml0ZSA9IHV0ZjhXcml0ZTtcbmZ1bmN0aW9uIHV0ZjhXcml0ZSh2aWV3LCBvZmZzZXQsIHN0cmluZykge1xuICB2YXIgYnl0ZUxlbmd0aCA9IHZpZXcuYnl0ZUxlbmd0aDtcbiAgZm9yKHZhciBpID0gMCwgbCA9IHN0cmluZy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICB2YXIgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG5cbiAgICAvLyBPbmUgYnl0ZSBvZiBVVEYtOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCsrLCBjb2RlUG9pbnQgPj4+IDAgJiAweDdmIHwgMHgwMCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBUd28gYnl0ZXMgb2YgVVRGLThcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0KyssIGNvZGVQb2ludCA+Pj4gNiAmIDB4MWYgfCAweGMwKTtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0KyssIGNvZGVQb2ludCA+Pj4gMCAmIDB4M2YgfCAweDgwKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFRocmVlIGJ5dGVzIG9mIFVURi04LiAgXG4gICAgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0KyssIGNvZGVQb2ludCA+Pj4gMTIgJiAweDBmIHwgMHhlMCk7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCsrLCBjb2RlUG9pbnQgPj4+IDYgICYgMHgzZiB8IDB4ODApO1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQrKywgY29kZVBvaW50ID4+PiAwICAmIDB4M2YgfCAweDgwKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIEZvdXIgYnl0ZXMgb2YgVVRGLThcbiAgICBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0KyssIGNvZGVQb2ludCA+Pj4gMTggJiAweDA3IHwgMHhmMCk7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCsrLCBjb2RlUG9pbnQgPj4+IDEyICYgMHgzZiB8IDB4ODApO1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQrKywgY29kZVBvaW50ID4+PiA2ICAmIDB4M2YgfCAweDgwKTtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0KyssIGNvZGVQb2ludCA+Pj4gMCAgJiAweDNmIHwgMHg4MCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYmFkIGNvZGVwb2ludCBcIiArIGNvZGVQb2ludCk7XG4gIH1cbn1cblxuZXhwb3J0cy51dGY4UmVhZCA9IHV0ZjhSZWFkO1xuZnVuY3Rpb24gdXRmOFJlYWQodmlldywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgdmFyIHN0cmluZyA9IFwiXCI7XG4gIGZvciAodmFyIGkgPSBvZmZzZXQsIGVuZCA9IG9mZnNldCArIGxlbmd0aDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdmFyIGJ5dGUgPSB2aWV3LmdldFVpbnQ4KGkpO1xuICAgIC8vIE9uZSBieXRlIGNoYXJhY3RlclxuICAgIGlmICgoYnl0ZSAmIDB4ODApID09PSAweDAwKSB7XG4gICAgICBzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICAvLyBUd28gYnl0ZSBjaGFyYWN0ZXJcbiAgICBpZiAoKGJ5dGUgJiAweGUwKSA9PT0gMHhjMCkge1xuICAgICAgc3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoXG4gICAgICAgICgoYnl0ZSAmIDB4MGYpIDw8IDYpIHwgXG4gICAgICAgICh2aWV3LmdldFVpbnQ4KCsraSkgJiAweDNmKVxuICAgICAgKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICAvLyBUaHJlZSBieXRlIGNoYXJhY3RlclxuICAgIGlmICgoYnl0ZSAmIDB4ZjApID09PSAweGUwKSB7XG4gICAgICBzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAgICAgKChieXRlICYgMHgwZikgPDwgMTIpIHxcbiAgICAgICAgKCh2aWV3LmdldFVpbnQ4KCsraSkgJiAweDNmKSA8PCA2KSB8XG4gICAgICAgICgodmlldy5nZXRVaW50OCgrK2kpICYgMHgzZikgPDwgMClcbiAgICAgICk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gRm91ciBieXRlIGNoYXJhY3RlclxuICAgIGlmICgoYnl0ZSAmIDB4ZjgpID09PSAweGYwKSB7XG4gICAgICBzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAgICAgKChieXRlICYgMHgwNykgPDwgMTgpIHxcbiAgICAgICAgKCh2aWV3LmdldFVpbnQ4KCsraSkgJiAweDNmKSA8PCAxMikgfFxuICAgICAgICAoKHZpZXcuZ2V0VWludDgoKytpKSAmIDB4M2YpIDw8IDYpIHxcbiAgICAgICAgKCh2aWV3LmdldFVpbnQ4KCsraSkgJiAweDNmKSA8PCAwKVxuICAgICAgKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGJ5dGUgXCIgKyBieXRlLnRvU3RyaW5nKDE2KSk7XG4gIH1cbiAgcmV0dXJuIHN0cmluZztcbn1cblxuZXhwb3J0cy51dGY4Qnl0ZUNvdW50ID0gdXRmOEJ5dGVDb3VudDtcbmZ1bmN0aW9uIHV0ZjhCeXRlQ291bnQoc3RyaW5nKSB7XG4gIHZhciBjb3VudCA9IDA7XG4gIGZvcih2YXIgaSA9IDAsIGwgPSBzdHJpbmcubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdmFyIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBjb3VudCArPSAxO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgY291bnQgKz0gMjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgY291bnQgKz0gMztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGNvdW50ICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYmFkIGNvZGVwb2ludCBcIiArIGNvZGVQb2ludCk7XG4gIH1cbiAgcmV0dXJuIGNvdW50O1xufVxuXG5leHBvcnRzLmVuY29kZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHNpemVvZih2YWx1ZSkpO1xuICB2YXIgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuICBlbmNvZGUodmFsdWUsIHZpZXcsIDApO1xuICByZXR1cm4gYnVmZmVyO1xufVxuXG5leHBvcnRzLmRlY29kZSA9IGRlY29kZTtcblxuLy8gaHR0cDovL3dpa2kubXNncGFjay5vcmcvZGlzcGxheS9NU0dQQUNLL0Zvcm1hdCtzcGVjaWZpY2F0aW9uXG4vLyBJJ3ZlIGV4dGVuZGVkIHRoZSBwcm90b2NvbCB0byBoYXZlIHR3byBuZXcgdHlwZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgcmVzZXJ2ZWQuXG4vLyAgIGJ1ZmZlciAxNiAgMTEwMTEwMDAgIDB4ZDhcbi8vICAgYnVmZmVyIDMyICAxMTAxMTAwMSAgMHhkOVxuLy8gVGhlc2Ugd29yayBqdXN0IGxpa2UgcmF3MTYgYW5kIHJhdzMyIGV4Y2VwdCB0aGV5IGFyZSBub2RlIGJ1ZmZlcnMgaW5zdGVhZCBvZiBzdHJpbmdzLlxuLy9cbi8vIEFsc28gSSd2ZSBhZGRlZCBhIHR5cGUgZm9yIGB1bmRlZmluZWRgXG4vLyAgIHVuZGVmaW5lZCAgMTEwMDAxMDAgIDB4YzRcblxuZnVuY3Rpb24gRGVjb2Rlcih2aWV3LCBvZmZzZXQpIHtcbiAgdGhpcy5vZmZzZXQgPSBvZmZzZXQgfHwgMDtcbiAgdGhpcy52aWV3ID0gdmlldztcbn1cbkRlY29kZXIucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgdmFyIHZhbHVlID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIga2V5ID0gdGhpcy5wYXJzZSgpO1xuICAgIHZhbHVlW2tleV0gPSB0aGlzLnBhcnNlKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcbkRlY29kZXIucHJvdG90eXBlLmJ1ZiA9IGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgdmFyIHZhbHVlID0gbmV3IEFycmF5QnVmZmVyKGxlbmd0aCk7XG4gIChuZXcgVWludDhBcnJheSh2YWx1ZSkpLnNldChuZXcgVWludDhBcnJheSh0aGlzLnZpZXcuYnVmZmVyLCB0aGlzLm9mZnNldCwgbGVuZ3RoKSwgMCk7XG4gIHRoaXMub2Zmc2V0ICs9IGxlbmd0aDtcbiAgcmV0dXJuIHZhbHVlO1xufTtcbkRlY29kZXIucHJvdG90eXBlLnJhdyA9IGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgdmFyIHZhbHVlID0gdXRmOFJlYWQodGhpcy52aWV3LCB0aGlzLm9mZnNldCwgbGVuZ3RoKTtcbiAgdGhpcy5vZmZzZXQgKz0gbGVuZ3RoO1xuICByZXR1cm4gdmFsdWU7XG59O1xuRGVjb2Rlci5wcm90b3R5cGUuYXJyYXkgPSBmdW5jdGlvbiAobGVuZ3RoKSB7XG4gIHZhciB2YWx1ZSA9IG5ldyBBcnJheShsZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFsdWVbaV0gPSB0aGlzLnBhcnNlKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcbkRlY29kZXIucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdHlwZSA9IHRoaXMudmlldy5nZXRVaW50OCh0aGlzLm9mZnNldCk7XG4gIHZhciB2YWx1ZSwgbGVuZ3RoO1xuICAvLyBGaXhSYXdcbiAgaWYgKCh0eXBlICYgMHhlMCkgPT09IDB4YTApIHtcbiAgICBsZW5ndGggPSB0eXBlICYgMHgxZjtcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiB0aGlzLnJhdyhsZW5ndGgpO1xuICB9XG4gIC8vIEZpeE1hcFxuICBpZiAoKHR5cGUgJiAweGYwKSA9PT0gMHg4MCkge1xuICAgIGxlbmd0aCA9IHR5cGUgJiAweDBmO1xuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIHRoaXMubWFwKGxlbmd0aCk7XG4gIH1cbiAgLy8gRml4QXJyYXlcbiAgaWYgKCh0eXBlICYgMHhmMCkgPT09IDB4OTApIHtcbiAgICBsZW5ndGggPSB0eXBlICYgMHgwZjtcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiB0aGlzLmFycmF5KGxlbmd0aCk7XG4gIH1cbiAgLy8gUG9zaXRpdmUgRml4TnVtXG4gIGlmICgodHlwZSAmIDB4ODApID09PSAweDAwKSB7XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdHlwZTtcbiAgfVxuICAvLyBOZWdhdGl2ZSBGaXhudW1cbiAgaWYgKCh0eXBlICYgMHhlMCkgPT09IDB4ZTApIHtcbiAgICB2YWx1ZSA9IHRoaXMudmlldy5nZXRJbnQ4KHRoaXMub2Zmc2V0KTtcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBzd2l0Y2ggKHR5cGUpIHtcbiAgLy8gcmF3IDE2XG4gIGNhc2UgMHhkYTpcbiAgICBsZW5ndGggPSB0aGlzLnZpZXcuZ2V0VWludDE2KHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdGhpcy5yYXcobGVuZ3RoKTtcbiAgLy8gcmF3IDMyXG4gIGNhc2UgMHhkYjpcbiAgICBsZW5ndGggPSB0aGlzLnZpZXcuZ2V0VWludDMyKHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gNTtcbiAgICByZXR1cm4gdGhpcy5yYXcobGVuZ3RoKTtcbiAgLy8gbmlsXG4gIGNhc2UgMHhjMDpcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiBudWxsO1xuICAvLyBmYWxzZVxuICBjYXNlIDB4YzI6XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIHRydWVcbiAgY2FzZSAweGMzOlxuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIHRydWU7XG4gIC8vIHVuZGVmaW5lZFxuICBjYXNlIDB4YzQ6XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAvLyB1aW50OFxuICBjYXNlIDB4Y2M6XG4gICAgdmFsdWUgPSB0aGlzLnZpZXcuZ2V0VWludDgodGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSAyO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgLy8gdWludCAxNlxuICBjYXNlIDB4Y2Q6XG4gICAgdmFsdWUgPSB0aGlzLnZpZXcuZ2V0VWludDE2KHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIHVpbnQgMzJcbiAgY2FzZSAweGNlOlxuICAgIHZhbHVlID0gdGhpcy52aWV3LmdldFVpbnQzMih0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDU7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyBpbnQgOFxuICBjYXNlIDB4ZDA6XG4gICAgdmFsdWUgPSB0aGlzLnZpZXcuZ2V0SW50OCh0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDI7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyBpbnQgMTZcbiAgY2FzZSAweGQxOlxuICAgIHZhbHVlID0gdGhpcy52aWV3LmdldEludDE2KHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIGludCAzMlxuICBjYXNlIDB4ZDI6XG4gICAgdmFsdWUgPSB0aGlzLnZpZXcuZ2V0SW50MzIodGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA1O1xuICAgIHJldHVybiB2YWx1ZTtcbiAgLy8gbWFwIDE2XG4gIGNhc2UgMHhkZTpcbiAgICBsZW5ndGggPSB0aGlzLnZpZXcuZ2V0VWludDE2KHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdGhpcy5tYXAobGVuZ3RoKTtcbiAgLy8gbWFwIDMyXG4gIGNhc2UgMHhkZjpcbiAgICBsZW5ndGggPSB0aGlzLnZpZXcuZ2V0VWludDMyKHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gNTtcbiAgICByZXR1cm4gdGhpcy5tYXAobGVuZ3RoKTtcbiAgLy8gYXJyYXkgMTZcbiAgY2FzZSAweGRjOlxuICAgIGxlbmd0aCA9IHRoaXMudmlldy5nZXRVaW50MTYodGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSAzO1xuICAgIHJldHVybiB0aGlzLmFycmF5KGxlbmd0aCk7XG4gIC8vIGFycmF5IDMyXG4gIGNhc2UgMHhkZDpcbiAgICBsZW5ndGggPSB0aGlzLnZpZXcuZ2V0VWludDMyKHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gNTtcbiAgICByZXR1cm4gdGhpcy5hcnJheShsZW5ndGgpO1xuICAvLyBidWZmZXIgMTZcbiAgY2FzZSAweGQ4OlxuICAgIGxlbmd0aCA9IHRoaXMudmlldy5nZXRVaW50MTYodGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSAzO1xuICAgIHJldHVybiB0aGlzLmJ1ZihsZW5ndGgpO1xuICAvLyBidWZmZXIgMzJcbiAgY2FzZSAweGQ5OlxuICAgIGxlbmd0aCA9IHRoaXMudmlldy5nZXRVaW50MzIodGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA1O1xuICAgIHJldHVybiB0aGlzLmJ1ZihsZW5ndGgpO1xuICAvLyBmbG9hdFxuICBjYXNlIDB4Y2E6XG4gICAgdmFsdWUgPSB0aGlzLnZpZXcuZ2V0RmxvYXQzMih0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDU7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyBkb3VibGVcbiAgY2FzZSAweGNiOlxuICAgIHZhbHVlID0gdGhpcy52aWV3LmdldEZsb2F0NjQodGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA5O1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHR5cGUgMHhcIiArIHR5cGUudG9TdHJpbmcoMTYpKTtcbn07XG5mdW5jdGlvbiBkZWNvZGUoYnVmZmVyKSB7XG4gIHZhciB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG4gIHZhciBkZWNvZGVyID0gbmV3IERlY29kZXIodmlldyk7XG4gIHZhciB2YWx1ZSA9IGRlY29kZXIucGFyc2UoKTtcbiAgaWYgKGRlY29kZXIub2Zmc2V0ICE9PSBidWZmZXIuYnl0ZUxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKChidWZmZXIuYnl0ZUxlbmd0aCAtIGRlY29kZXIub2Zmc2V0KSArIFwiIHRyYWlsaW5nIGJ5dGVzXCIpO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGVuY29kZSh2YWx1ZSwgdmlldywgb2Zmc2V0KSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuXG4gIC8vIFN0cmluZ3MgQnl0ZXNcbiAgaWYgKHR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICB2YXIgbGVuZ3RoID0gdXRmOEJ5dGVDb3VudCh2YWx1ZSk7XG4gICAgLy8gZml4IHJhd1xuICAgIGlmIChsZW5ndGggPCAweDIwKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgbGVuZ3RoIHwgMHhhMCk7XG4gICAgICB1dGY4V3JpdGUodmlldywgb2Zmc2V0ICsgMSwgdmFsdWUpO1xuICAgICAgcmV0dXJuIDEgKyBsZW5ndGg7XG4gICAgfVxuICAgIC8vIHJhdyAxNlxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgMHhkYSk7XG4gICAgICB2aWV3LnNldFVpbnQxNihvZmZzZXQgKyAxLCBsZW5ndGgpO1xuICAgICAgdXRmOFdyaXRlKHZpZXcsIG9mZnNldCArIDMsIHZhbHVlKTtcbiAgICAgIHJldHVybiAzICsgbGVuZ3RoO1xuICAgIH1cbiAgICAvLyByYXcgMzJcbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMDAwMDApIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCAweGRiKTtcbiAgICAgIHZpZXcuc2V0VWludDMyKG9mZnNldCArIDEsIGxlbmd0aCk7XG4gICAgICB1dGY4V3JpdGUodmlldywgb2Zmc2V0ICsgNSwgdmFsdWUpO1xuICAgICAgcmV0dXJuIDUgKyBsZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICB2YXIgbGVuZ3RoID0gdmFsdWUuYnl0ZUxlbmd0aDtcbiAgICAvLyBidWZmZXIgMTZcbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMCkge1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIDB4ZDgpO1xuICAgICAgdmlldy5zZXRVaW50MTYob2Zmc2V0ICsgMSwgbGVuZ3RoKTtcbiAgICAgIChuZXcgVWludDhBcnJheSh2aWV3LmJ1ZmZlcikpLnNldChuZXcgVWludDhBcnJheSh2YWx1ZSksIG9mZnNldCArIDMpO1xuICAgICAgcmV0dXJuIDMgKyBsZW5ndGg7XG4gICAgfVxuICAgIC8vIGJ1ZmZlciAzMlxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwMDAwMCkge1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIDB4ZDkpO1xuICAgICAgdmlldy5zZXRVaW50MzIob2Zmc2V0ICsgMSwgbGVuZ3RoKTtcbiAgICAgIChuZXcgVWludDhBcnJheSh2aWV3LmJ1ZmZlcikpLnNldChuZXcgVWludDhBcnJheSh2YWx1ZSksIG9mZnNldCArIDUpO1xuICAgICAgcmV0dXJuIDUgKyBsZW5ndGg7XG4gICAgfVxuICB9XG4gIFxuICBpZiAodHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgIC8vIEZsb2F0aW5nIFBvaW50XG4gICAgaWYgKCh2YWx1ZSA8PCAwKSAhPT0gdmFsdWUpIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCAweGNiKTtcbiAgICAgIHZpZXcuc2V0RmxvYXQ2NChvZmZzZXQgKyAxLCB2YWx1ZSk7XG4gICAgICByZXR1cm4gOTtcbiAgICB9XG5cbiAgICAvLyBJbnRlZ2Vyc1xuICAgIGlmICh2YWx1ZSA+PTApIHtcbiAgICAgIC8vIHBvc2l0aXZlIGZpeG51bVxuICAgICAgaWYgKHZhbHVlIDwgMHg4MCkge1xuICAgICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIC8vIHVpbnQgOFxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDApIHtcbiAgICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIDB4Y2MpO1xuICAgICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCArIDEsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIDI7XG4gICAgICB9XG4gICAgICAvLyB1aW50IDE2XG4gICAgICBpZiAodmFsdWUgPCAweDEwMDAwKSB7XG4gICAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCAweGNkKTtcbiAgICAgICAgdmlldy5zZXRVaW50MTYob2Zmc2V0ICsgMSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gMztcbiAgICAgIH1cbiAgICAgIC8vIHVpbnQgMzJcbiAgICAgIGlmICh2YWx1ZSA8IDB4MTAwMDAwMDAwKSB7XG4gICAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCAweGNlKTtcbiAgICAgICAgdmlldy5zZXRVaW50MzIob2Zmc2V0ICsgMSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gNTtcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk51bWJlciB0b28gYmlnIDB4XCIgKyB2YWx1ZS50b1N0cmluZygxNikpO1xuICAgIH1cbiAgICAvLyBuZWdhdGl2ZSBmaXhudW1cbiAgICBpZiAodmFsdWUgPj0gLTB4MjApIHtcbiAgICAgIHZpZXcuc2V0SW50OChvZmZzZXQsIHZhbHVlKTtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICAvLyBpbnQgOFxuICAgIGlmICh2YWx1ZSA+PSAtMHg4MCkge1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIDB4ZDApO1xuICAgICAgdmlldy5zZXRJbnQ4KG9mZnNldCArIDEsIHZhbHVlKTtcbiAgICAgIHJldHVybiAyO1xuICAgIH1cbiAgICAvLyBpbnQgMTZcbiAgICBpZiAodmFsdWUgPj0gLTB4ODAwMCkge1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIDB4ZDEpO1xuICAgICAgdmlldy5zZXRJbnQxNihvZmZzZXQgKyAxLCB2YWx1ZSk7XG4gICAgICByZXR1cm4gMztcbiAgICB9XG4gICAgLy8gaW50IDMyXG4gICAgaWYgKHZhbHVlID49IC0weDgwMDAwMDAwKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgMHhkMik7XG4gICAgICB2aWV3LnNldEludDMyKG9mZnNldCArIDEsIHZhbHVlKTtcbiAgICAgIHJldHVybiA1O1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJOdW1iZXIgdG9vIHNtYWxsIC0weFwiICsgKC12YWx1ZSkudG9TdHJpbmcoMTYpLnN1YnN0cigxKSk7XG4gIH1cbiAgXG4gIC8vIHVuZGVmaW5lZFxuICBpZiAodHlwZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCAweGM0KTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLy8gbnVsbFxuICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgMHhjMCk7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvLyBCb29sZWFuXG4gIGlmICh0eXBlID09PSBcImJvb2xlYW5cIikge1xuICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCB2YWx1ZSA/IDB4YzMgOiAweGMyKTtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBcbiAgLy8gQ29udGFpbmVyIFR5cGVzXG4gIGlmICh0eXBlID09PSBcIm9iamVjdFwiKSB7XG4gICAgdmFyIGxlbmd0aCwgc2l6ZSA9IDA7XG4gICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KHZhbHVlKTtcblxuICAgIGlmIChpc0FycmF5KSB7XG4gICAgICBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB9XG5cbiAgICB2YXIgc2l6ZTtcbiAgICBpZiAobGVuZ3RoIDwgMHgxMCkge1xuICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQsIGxlbmd0aCB8IChpc0FycmF5ID8gMHg5MCA6IDB4ODApKTtcbiAgICAgIHNpemUgPSAxO1xuICAgIH1cbiAgICBlbHNlIGlmIChsZW5ndGggPCAweDEwMDAwKSB7XG4gICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCwgaXNBcnJheSA/IDB4ZGMgOiAweGRlKTtcbiAgICAgIHZpZXcuc2V0VWludDE2KG9mZnNldCArIDEsIGxlbmd0aCk7XG4gICAgICBzaXplID0gMztcbiAgICB9XG4gICAgZWxzZSBpZiAobGVuZ3RoIDwgMHgxMDAwMDAwMDApIHtcbiAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0LCBpc0FycmF5ID8gMHhkZCA6IDB4ZGYpO1xuICAgICAgdmlldy5zZXRVaW50MzIob2Zmc2V0ICsgMSwgbGVuZ3RoKTtcbiAgICAgIHNpemUgPSA1O1xuICAgIH1cblxuICAgIGlmIChpc0FycmF5KSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNpemUgKz0gZW5jb2RlKHZhbHVlW2ldLCB2aWV3LCBvZmZzZXQgKyBzaXplKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICBzaXplICs9IGVuY29kZShrZXksIHZpZXcsIG9mZnNldCArIHNpemUpO1xuICAgICAgICBzaXplICs9IGVuY29kZSh2YWx1ZVtrZXldLCB2aWV3LCBvZmZzZXQgKyBzaXplKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHNpemU7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biB0eXBlIFwiICsgdHlwZSk7XG59XG5cbmZ1bmN0aW9uIHNpemVvZih2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcblxuICAvLyBSYXcgQnl0ZXNcbiAgaWYgKHR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICB2YXIgbGVuZ3RoID0gdXRmOEJ5dGVDb3VudCh2YWx1ZSk7XG4gICAgaWYgKGxlbmd0aCA8IDB4MjApIHtcbiAgICAgIHJldHVybiAxICsgbGVuZ3RoO1xuICAgIH1cbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMCkge1xuICAgICAgcmV0dXJuIDMgKyBsZW5ndGg7XG4gICAgfVxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwMDAwMCkge1xuICAgICAgcmV0dXJuIDUgKyBsZW5ndGg7XG4gICAgfVxuICB9XG4gIFxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHZhciBsZW5ndGggPSB2YWx1ZS5ieXRlTGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPCAweDEwMDAwKSB7XG4gICAgICByZXR1cm4gMyArIGxlbmd0aDtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDAwMDAwKSB7XG4gICAgICByZXR1cm4gNSArIGxlbmd0aDtcbiAgICB9XG4gIH1cbiAgXG4gIGlmICh0eXBlID09PSBcIm51bWJlclwiKSB7XG4gICAgLy8gRmxvYXRpbmcgUG9pbnRcbiAgICAvLyBkb3VibGVcbiAgICBpZiAodmFsdWUgPDwgMCAhPT0gdmFsdWUpIHJldHVybiA5O1xuXG4gICAgLy8gSW50ZWdlcnNcbiAgICBpZiAodmFsdWUgPj0wKSB7XG4gICAgICAvLyBwb3NpdGl2ZSBmaXhudW1cbiAgICAgIGlmICh2YWx1ZSA8IDB4ODApIHJldHVybiAxO1xuICAgICAgLy8gdWludCA4XG4gICAgICBpZiAodmFsdWUgPCAweDEwMCkgcmV0dXJuIDI7XG4gICAgICAvLyB1aW50IDE2XG4gICAgICBpZiAodmFsdWUgPCAweDEwMDAwKSByZXR1cm4gMztcbiAgICAgIC8vIHVpbnQgMzJcbiAgICAgIGlmICh2YWx1ZSA8IDB4MTAwMDAwMDAwKSByZXR1cm4gNTtcbiAgICAgIC8vIHVpbnQgNjRcbiAgICAgIGlmICh2YWx1ZSA8IDB4MTAwMDAwMDAwMDAwMDAwMDApIHJldHVybiA5O1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTnVtYmVyIHRvbyBiaWcgMHhcIiArIHZhbHVlLnRvU3RyaW5nKDE2KSk7XG4gICAgfVxuICAgIC8vIG5lZ2F0aXZlIGZpeG51bVxuICAgIGlmICh2YWx1ZSA+PSAtMHgyMCkgcmV0dXJuIDE7XG4gICAgLy8gaW50IDhcbiAgICBpZiAodmFsdWUgPj0gLTB4ODApIHJldHVybiAyO1xuICAgIC8vIGludCAxNlxuICAgIGlmICh2YWx1ZSA+PSAtMHg4MDAwKSByZXR1cm4gMztcbiAgICAvLyBpbnQgMzJcbiAgICBpZiAodmFsdWUgPj0gLTB4ODAwMDAwMDApIHJldHVybiA1O1xuICAgIC8vIGludCA2NFxuICAgIGlmICh2YWx1ZSA+PSAtMHg4MDAwMDAwMDAwMDAwMDAwKSByZXR1cm4gOTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJOdW1iZXIgdG9vIHNtYWxsIC0weFwiICsgdmFsdWUudG9TdHJpbmcoMTYpLnN1YnN0cigxKSk7XG4gIH1cbiAgXG4gIC8vIEJvb2xlYW4sIG51bGwsIHVuZGVmaW5lZFxuICBpZiAodHlwZSA9PT0gXCJib29sZWFuXCIgfHwgdHlwZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCB2YWx1ZSA9PT0gbnVsbCkgcmV0dXJuIDE7XG4gIFxuICAvLyBDb250YWluZXIgVHlwZXNcbiAgaWYgKHR5cGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICB2YXIgbGVuZ3RoLCBzaXplID0gMDtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2l6ZSArPSBzaXplb2YodmFsdWVbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICBzaXplICs9IHNpemVvZihrZXkpICsgc2l6ZW9mKHZhbHVlW2tleV0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobGVuZ3RoIDwgMHgxMCkge1xuICAgICAgcmV0dXJuIDEgKyBzaXplO1xuICAgIH1cbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMCkge1xuICAgICAgcmV0dXJuIDMgKyBzaXplO1xuICAgIH1cbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMDAwMDApIHtcbiAgICAgIHJldHVybiA1ICsgc2l6ZTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQXJyYXkgb3Igb2JqZWN0IHRvbyBsb25nIDB4XCIgKyBsZW5ndGgudG9TdHJpbmcoMTYpKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duIHR5cGUgXCIgKyB0eXBlKTtcbn1cblxucmV0dXJuIGV4cG9ydHM7XG5cbn0pO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBib3BzID0gcmVxdWlyZSgnYm9wcycpO1xuXG5leHBvcnRzLmVuY29kZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgdG9KU09OZWQgPSBbXVxuICB2YXIgc2l6ZSA9IHNpemVvZih2YWx1ZSlcbiAgaWYoc2l6ZSA9PSAwKVxuICAgIHJldHVybiB1bmRlZmluZWRcbiAgdmFyIGJ1ZmZlciA9IGJvcHMuY3JlYXRlKHNpemUpO1xuICBlbmNvZGUodmFsdWUsIGJ1ZmZlciwgMCk7XG4gIHJldHVybiBidWZmZXI7XG59O1xuXG5leHBvcnRzLmRlY29kZSA9IGRlY29kZTtcblxuLy8gaHR0cDovL3dpa2kubXNncGFjay5vcmcvZGlzcGxheS9NU0dQQUNLL0Zvcm1hdCtzcGVjaWZpY2F0aW9uXG4vLyBJJ3ZlIGV4dGVuZGVkIHRoZSBwcm90b2NvbCB0byBoYXZlIHR3byBuZXcgdHlwZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgcmVzZXJ2ZWQuXG4vLyAgIGJ1ZmZlciAxNiAgMTEwMTEwMDAgIDB4ZDhcbi8vICAgYnVmZmVyIDMyICAxMTAxMTAwMSAgMHhkOVxuLy8gVGhlc2Ugd29yayBqdXN0IGxpa2UgcmF3MTYgYW5kIHJhdzMyIGV4Y2VwdCB0aGV5IGFyZSBub2RlIGJ1ZmZlcnMgaW5zdGVhZCBvZiBzdHJpbmdzLlxuLy9cbi8vIEFsc28gSSd2ZSBhZGRlZCBhIHR5cGUgZm9yIGB1bmRlZmluZWRgXG4vLyAgIHVuZGVmaW5lZCAgMTEwMDAxMDAgIDB4YzRcblxuZnVuY3Rpb24gRGVjb2RlcihidWZmZXIsIG9mZnNldCkge1xuICB0aGlzLm9mZnNldCA9IG9mZnNldCB8fCAwO1xuICB0aGlzLmJ1ZmZlciA9IGJ1ZmZlcjtcbn1cbkRlY29kZXIucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgdmFyIHZhbHVlID0ge307XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIga2V5ID0gdGhpcy5wYXJzZSgpO1xuICAgIHZhbHVlW2tleV0gPSB0aGlzLnBhcnNlKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcbkRlY29kZXIucHJvdG90eXBlLmJ1ZiA9IGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgdmFyIHZhbHVlID0gYm9wcy5zdWJhcnJheSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQsIHRoaXMub2Zmc2V0ICsgbGVuZ3RoKTtcbiAgdGhpcy5vZmZzZXQgKz0gbGVuZ3RoO1xuICByZXR1cm4gdmFsdWU7XG59O1xuRGVjb2Rlci5wcm90b3R5cGUucmF3ID0gZnVuY3Rpb24gKGxlbmd0aCkge1xuICB2YXIgdmFsdWUgPSBib3BzLnRvKGJvcHMuc3ViYXJyYXkodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0LCB0aGlzLm9mZnNldCArIGxlbmd0aCkpO1xuICB0aGlzLm9mZnNldCArPSBsZW5ndGg7XG4gIHJldHVybiB2YWx1ZTtcbn07XG5EZWNvZGVyLnByb3RvdHlwZS5hcnJheSA9IGZ1bmN0aW9uIChsZW5ndGgpIHtcbiAgdmFyIHZhbHVlID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YWx1ZVtpXSA9IHRoaXMucGFyc2UoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59O1xuRGVjb2Rlci5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB0eXBlID0gdGhpcy5idWZmZXJbdGhpcy5vZmZzZXRdO1xuICB2YXIgdmFsdWUsIGxlbmd0aDtcbiAgLy8gRml4UmF3XG4gIGlmICgodHlwZSAmIDB4ZTApID09PSAweGEwKSB7XG4gICAgbGVuZ3RoID0gdHlwZSAmIDB4MWY7XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdGhpcy5yYXcobGVuZ3RoKTtcbiAgfVxuICAvLyBGaXhNYXBcbiAgaWYgKCh0eXBlICYgMHhmMCkgPT09IDB4ODApIHtcbiAgICBsZW5ndGggPSB0eXBlICYgMHgwZjtcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiB0aGlzLm1hcChsZW5ndGgpO1xuICB9XG4gIC8vIEZpeEFycmF5XG4gIGlmICgodHlwZSAmIDB4ZjApID09PSAweDkwKSB7XG4gICAgbGVuZ3RoID0gdHlwZSAmIDB4MGY7XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdGhpcy5hcnJheShsZW5ndGgpO1xuICB9XG4gIC8vIFBvc2l0aXZlIEZpeE51bVxuICBpZiAoKHR5cGUgJiAweDgwKSA9PT0gMHgwMCkge1xuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIHR5cGU7XG4gIH1cbiAgLy8gTmVnYXRpdmUgRml4bnVtXG4gIGlmICgodHlwZSAmIDB4ZTApID09PSAweGUwKSB7XG4gICAgdmFsdWUgPSBib3BzLnJlYWRJbnQ4KHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCk7XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgc3dpdGNoICh0eXBlKSB7XG4gIC8vIHJhdyAxNlxuICBjYXNlIDB4ZGE6XG4gICAgbGVuZ3RoID0gYm9wcy5yZWFkVUludDE2QkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdGhpcy5yYXcobGVuZ3RoKTtcbiAgLy8gcmF3IDMyXG4gIGNhc2UgMHhkYjpcbiAgICBsZW5ndGggPSBib3BzLnJlYWRVSW50MzJCRSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA1O1xuICAgIHJldHVybiB0aGlzLnJhdyhsZW5ndGgpO1xuICAvLyBuaWxcbiAgY2FzZSAweGMwOlxuICAgIHRoaXMub2Zmc2V0Kys7XG4gICAgcmV0dXJuIG51bGw7XG4gIC8vIGZhbHNlXG4gIGNhc2UgMHhjMjpcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gdHJ1ZVxuICBjYXNlIDB4YzM6XG4gICAgdGhpcy5vZmZzZXQrKztcbiAgICByZXR1cm4gdHJ1ZTtcbiAgLy8gdW5kZWZpbmVkXG4gIGNhc2UgMHhjNDpcbiAgICB0aGlzLm9mZnNldCsrO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIC8vIHVpbnQ4XG4gIGNhc2UgMHhjYzpcbiAgICB2YWx1ZSA9IHRoaXMuYnVmZmVyW3RoaXMub2Zmc2V0ICsgMV07XG4gICAgdGhpcy5vZmZzZXQgKz0gMjtcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIHVpbnQgMTZcbiAgY2FzZSAweGNkOlxuICAgIHZhbHVlID0gYm9wcy5yZWFkVUludDE2QkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIHVpbnQgMzJcbiAgY2FzZSAweGNlOlxuICAgIHZhbHVlID0gYm9wcy5yZWFkVUludDMyQkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gNTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIHVpbnQ2NFxuICBjYXNlIDB4Y2Y6XG4gICAgdmFsdWUgPSBib3BzLnJlYWRVSW50NjRCRSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA5O1xuICAgIHJldHVybiB2YWx1ZTtcbiAgLy8gaW50IDhcbiAgY2FzZSAweGQwOlxuICAgIHZhbHVlID0gYm9wcy5yZWFkSW50OCh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSAyO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgLy8gaW50IDE2XG4gIGNhc2UgMHhkMTpcbiAgICB2YWx1ZSA9IGJvcHMucmVhZEludDE2QkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdmFsdWU7XG4gIC8vIGludCAzMlxuICBjYXNlIDB4ZDI6XG4gICAgdmFsdWUgPSBib3BzLnJlYWRJbnQzMkJFKHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDU7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyBpbnQgNjRcbiAgY2FzZSAweGQzOlxuICAgIHZhbHVlID0gYm9wcy5yZWFkSW50NjRCRSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA5O1xuICAgIHJldHVybiB2YWx1ZTtcbiAgLy8gbWFwIDE2XG4gIGNhc2UgMHhkZTpcbiAgICBsZW5ndGggPSBib3BzLnJlYWRVSW50MTZCRSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSAzO1xuICAgIHJldHVybiB0aGlzLm1hcChsZW5ndGgpO1xuICAvLyBtYXAgMzJcbiAgY2FzZSAweGRmOlxuICAgIGxlbmd0aCA9IGJvcHMucmVhZFVJbnQzMkJFKHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDU7XG4gICAgcmV0dXJuIHRoaXMubWFwKGxlbmd0aCk7XG4gIC8vIGFycmF5IDE2XG4gIGNhc2UgMHhkYzpcbiAgICBsZW5ndGggPSBib3BzLnJlYWRVSW50MTZCRSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSAzO1xuICAgIHJldHVybiB0aGlzLmFycmF5KGxlbmd0aCk7XG4gIC8vIGFycmF5IDMyXG4gIGNhc2UgMHhkZDpcbiAgICBsZW5ndGggPSBib3BzLnJlYWRVSW50MzJCRSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA1O1xuICAgIHJldHVybiB0aGlzLmFycmF5KGxlbmd0aCk7XG4gIC8vIGJ1ZmZlciAxNlxuICBjYXNlIDB4ZDg6XG4gICAgbGVuZ3RoID0gYm9wcy5yZWFkVUludDE2QkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gMztcbiAgICByZXR1cm4gdGhpcy5idWYobGVuZ3RoKTtcbiAgLy8gYnVmZmVyIDMyXG4gIGNhc2UgMHhkOTpcbiAgICBsZW5ndGggPSBib3BzLnJlYWRVSW50MzJCRSh0aGlzLmJ1ZmZlciwgdGhpcy5vZmZzZXQgKyAxKTtcbiAgICB0aGlzLm9mZnNldCArPSA1O1xuICAgIHJldHVybiB0aGlzLmJ1ZihsZW5ndGgpO1xuICAvLyBmbG9hdFxuICBjYXNlIDB4Y2E6XG4gICAgdmFsdWUgPSBib3BzLnJlYWRGbG9hdEJFKHRoaXMuYnVmZmVyLCB0aGlzLm9mZnNldCArIDEpO1xuICAgIHRoaXMub2Zmc2V0ICs9IDU7XG4gICAgcmV0dXJuIHZhbHVlO1xuICAvLyBkb3VibGVcbiAgY2FzZSAweGNiOlxuICAgIHZhbHVlID0gYm9wcy5yZWFkRG91YmxlQkUodGhpcy5idWZmZXIsIHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgdGhpcy5vZmZzZXQgKz0gOTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biB0eXBlIDB4XCIgKyB0eXBlLnRvU3RyaW5nKDE2KSk7XG59O1xuZnVuY3Rpb24gZGVjb2RlKGJ1ZmZlcikge1xuICB2YXIgZGVjb2RlciA9IG5ldyBEZWNvZGVyKGJ1ZmZlcik7XG4gIHZhciB2YWx1ZSA9IGRlY29kZXIucGFyc2UoKTtcbiAgaWYgKGRlY29kZXIub2Zmc2V0ICE9PSBidWZmZXIubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoKGJ1ZmZlci5sZW5ndGggLSBkZWNvZGVyLm9mZnNldCkgKyBcIiB0cmFpbGluZyBieXRlc1wiKTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBlbmNvZGVhYmxlS2V5cyAodmFsdWUpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKHZhbHVlKS5maWx0ZXIoZnVuY3Rpb24gKGUpIHtcbiAgICByZXR1cm4gJ2Z1bmN0aW9uJyAhPT0gdHlwZW9mIHZhbHVlW2VdIHx8ICEhdmFsdWVbZV0udG9KU09OXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGVuY29kZSh2YWx1ZSwgYnVmZmVyLCBvZmZzZXQpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHZhciBsZW5ndGgsIHNpemU7XG5cbiAgLy8gU3RyaW5ncyBCeXRlc1xuICBpZiAodHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIHZhbHVlID0gYm9wcy5mcm9tKHZhbHVlKTtcbiAgICBsZW5ndGggPSB2YWx1ZS5sZW5ndGg7XG4gICAgLy8gZml4IHJhd1xuICAgIGlmIChsZW5ndGggPCAweDIwKSB7XG4gICAgICBidWZmZXJbb2Zmc2V0XSA9IGxlbmd0aCB8IDB4YTA7XG4gICAgICBib3BzLmNvcHkodmFsdWUsIGJ1ZmZlciwgb2Zmc2V0ICsgMSk7XG4gICAgICByZXR1cm4gMSArIGxlbmd0aDtcbiAgICB9XG4gICAgLy8gcmF3IDE2XG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDApIHtcbiAgICAgIGJ1ZmZlcltvZmZzZXRdID0gMHhkYTtcbiAgICAgIGJvcHMud3JpdGVVSW50MTZCRShidWZmZXIsIGxlbmd0aCwgb2Zmc2V0ICsgMSk7XG4gICAgICBib3BzLmNvcHkodmFsdWUsIGJ1ZmZlciwgb2Zmc2V0ICsgMyk7XG4gICAgICByZXR1cm4gMyArIGxlbmd0aDtcbiAgICB9XG4gICAgLy8gcmF3IDMyXG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDAwMDAwKSB7XG4gICAgICBidWZmZXJbb2Zmc2V0XSA9IDB4ZGI7XG4gICAgICBib3BzLndyaXRlVUludDMyQkUoYnVmZmVyLCBsZW5ndGgsIG9mZnNldCArIDEpO1xuICAgICAgYm9wcy5jb3B5KHZhbHVlLCBidWZmZXIsIG9mZnNldCArIDUpO1xuICAgICAgcmV0dXJuIDUgKyBsZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgaWYgKGJvcHMuaXModmFsdWUpKSB7XG4gICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgIC8vIGJ1ZmZlciAxNlxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwKSB7XG4gICAgICBidWZmZXJbb2Zmc2V0XSA9IDB4ZDg7XG4gICAgICBib3BzLndyaXRlVUludDE2QkUoYnVmZmVyLCBsZW5ndGgsIG9mZnNldCArIDEpO1xuICAgICAgYm9wcy5jb3B5KHZhbHVlLCBidWZmZXIsIG9mZnNldCArIDMpO1xuICAgICAgcmV0dXJuIDMgKyBsZW5ndGg7XG4gICAgfVxuICAgIC8vIGJ1ZmZlciAzMlxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwMDAwMCkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSAweGQ5O1xuICAgICAgYm9wcy53cml0ZVVJbnQzMkJFKGJ1ZmZlciwgbGVuZ3RoLCBvZmZzZXQgKyAxKTtcbiAgICAgIGJvcHMuY29weSh2YWx1ZSwgYnVmZmVyLCBvZmZzZXQgKyA1KTtcbiAgICAgIHJldHVybiA1ICsgbGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0eXBlID09PSBcIm51bWJlclwiKSB7XG4gICAgLy8gRmxvYXRpbmcgUG9pbnRcbiAgICBpZiAoKHZhbHVlIDw8IDApICE9PSB2YWx1ZSkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSAgMHhjYjtcbiAgICAgIGJvcHMud3JpdGVEb3VibGVCRShidWZmZXIsIHZhbHVlLCBvZmZzZXQgKyAxKTtcbiAgICAgIHJldHVybiA5O1xuICAgIH1cblxuICAgIC8vIEludGVnZXJzXG4gICAgaWYgKHZhbHVlID49MCkge1xuICAgICAgLy8gcG9zaXRpdmUgZml4bnVtXG4gICAgICBpZiAodmFsdWUgPCAweDgwKSB7XG4gICAgICAgIGJ1ZmZlcltvZmZzZXRdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgICAgLy8gdWludCA4XG4gICAgICBpZiAodmFsdWUgPCAweDEwMCkge1xuICAgICAgICBidWZmZXJbb2Zmc2V0XSA9IDB4Y2M7XG4gICAgICAgIGJ1ZmZlcltvZmZzZXQgKyAxXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gMjtcbiAgICAgIH1cbiAgICAgIC8vIHVpbnQgMTZcbiAgICAgIGlmICh2YWx1ZSA8IDB4MTAwMDApIHtcbiAgICAgICAgYnVmZmVyW29mZnNldF0gPSAweGNkO1xuICAgICAgICBib3BzLndyaXRlVUludDE2QkUoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0ICsgMSk7XG4gICAgICAgIHJldHVybiAzO1xuICAgICAgfVxuICAgICAgLy8gdWludCAzMlxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDAwMDAwMDApIHtcbiAgICAgICAgYnVmZmVyW29mZnNldF0gPSAweGNlO1xuICAgICAgICBib3BzLndyaXRlVUludDMyQkUoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0ICsgMSk7XG4gICAgICAgIHJldHVybiA1O1xuICAgICAgfVxuICAgICAgLy8gdWludCA2NFxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDAwMDAwMDAwMDAwMDAwMCkge1xuICAgICAgICBidWZmZXJbb2Zmc2V0XSA9IDB4Y2Y7XG4gICAgICAgIGJvcHMud3JpdGVVSW50NjRCRShidWZmZXIsIHZhbHVlLCBvZmZzZXQgKyAxKTtcbiAgICAgICAgcmV0dXJuIDk7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOdW1iZXIgdG9vIGJpZyAweFwiICsgdmFsdWUudG9TdHJpbmcoMTYpKTtcbiAgICB9XG4gICAgLy8gbmVnYXRpdmUgZml4bnVtXG4gICAgaWYgKHZhbHVlID49IC0weDIwKSB7XG4gICAgICBib3BzLndyaXRlSW50OChidWZmZXIsIHZhbHVlLCBvZmZzZXQpO1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIC8vIGludCA4XG4gICAgaWYgKHZhbHVlID49IC0weDgwKSB7XG4gICAgICBidWZmZXJbb2Zmc2V0XSA9IDB4ZDA7XG4gICAgICBib3BzLndyaXRlSW50OChidWZmZXIsIHZhbHVlLCBvZmZzZXQgKyAxKTtcbiAgICAgIHJldHVybiAyO1xuICAgIH1cbiAgICAvLyBpbnQgMTZcbiAgICBpZiAodmFsdWUgPj0gLTB4ODAwMCkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSAweGQxO1xuICAgICAgYm9wcy53cml0ZUludDE2QkUoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0ICsgMSk7XG4gICAgICByZXR1cm4gMztcbiAgICB9XG4gICAgLy8gaW50IDMyXG4gICAgaWYgKHZhbHVlID49IC0weDgwMDAwMDAwKSB7XG4gICAgICBidWZmZXJbb2Zmc2V0XSA9IDB4ZDI7XG4gICAgICBib3BzLndyaXRlSW50MzJCRShidWZmZXIsIHZhbHVlLCBvZmZzZXQgKyAxKTtcbiAgICAgIHJldHVybiA1O1xuICAgIH1cbiAgICAvLyBpbnQgNjRcbiAgICBpZiAodmFsdWUgPj0gLTB4ODAwMDAwMDAwMDAwMDAwMCkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSAweGQzO1xuICAgICAgYm9wcy53cml0ZUludDY0QkUoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0ICsgMSk7XG4gICAgICByZXR1cm4gOTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTnVtYmVyIHRvbyBzbWFsbCAtMHhcIiArIHZhbHVlLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSkpO1xuICB9XG5cbiAgLy8gdW5kZWZpbmVkXG4gIGlmICh0eXBlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgYnVmZmVyW29mZnNldF0gPSAweGM0O1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgLy8gbnVsbFxuICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICBidWZmZXJbb2Zmc2V0XSA9IDB4YzA7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvLyBCb29sZWFuXG4gIGlmICh0eXBlID09PSBcImJvb2xlYW5cIikge1xuICAgIGJ1ZmZlcltvZmZzZXRdID0gdmFsdWUgPyAweGMzIDogMHhjMjtcbiAgICByZXR1cm4gMTtcbiAgfVxuXG4gIGlmKCdmdW5jdGlvbicgPT09IHR5cGVvZiB2YWx1ZS50b0pTT04pXG4gICAgcmV0dXJuIGVuY29kZSh2YWx1ZS50b0pTT04oKSwgYnVmZmVyLCBvZmZzZXQpXG5cbiAgLy8gQ29udGFpbmVyIFR5cGVzXG4gIGlmICh0eXBlID09PSBcIm9iamVjdFwiKSB7XG5cbiAgICBzaXplID0gMDtcbiAgICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkodmFsdWUpO1xuXG4gICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IGVuY29kZWFibGVLZXlzKHZhbHVlKVxuICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgfVxuXG4gICAgaWYgKGxlbmd0aCA8IDB4MTApIHtcbiAgICAgIGJ1ZmZlcltvZmZzZXRdID0gbGVuZ3RoIHwgKGlzQXJyYXkgPyAweDkwIDogMHg4MCk7XG4gICAgICBzaXplID0gMTtcbiAgICB9XG4gICAgZWxzZSBpZiAobGVuZ3RoIDwgMHgxMDAwMCkge1xuICAgICAgYnVmZmVyW29mZnNldF0gPSBpc0FycmF5ID8gMHhkYyA6IDB4ZGU7XG4gICAgICBib3BzLndyaXRlVUludDE2QkUoYnVmZmVyLCBsZW5ndGgsIG9mZnNldCArIDEpO1xuICAgICAgc2l6ZSA9IDM7XG4gICAgfVxuICAgIGVsc2UgaWYgKGxlbmd0aCA8IDB4MTAwMDAwMDAwKSB7XG4gICAgICBidWZmZXJbb2Zmc2V0XSA9IGlzQXJyYXkgPyAweGRkIDogMHhkZjtcbiAgICAgIGJvcHMud3JpdGVVSW50MzJCRShidWZmZXIsIGxlbmd0aCwgb2Zmc2V0ICsgMSk7XG4gICAgICBzaXplID0gNTtcbiAgICB9XG5cbiAgICBpZiAoaXNBcnJheSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBzaXplICs9IGVuY29kZSh2YWx1ZVtpXSwgYnVmZmVyLCBvZmZzZXQgKyBzaXplKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW2ldO1xuICAgICAgICBzaXplICs9IGVuY29kZShrZXksIGJ1ZmZlciwgb2Zmc2V0ICsgc2l6ZSk7XG4gICAgICAgIHNpemUgKz0gZW5jb2RlKHZhbHVlW2tleV0sIGJ1ZmZlciwgb2Zmc2V0ICsgc2l6ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpemU7XG4gIH1cbiAgaWYodHlwZSA9PT0gXCJmdW5jdGlvblwiKVxuICAgIHJldHVybiB1bmRlZmluZWRcbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biB0eXBlIFwiICsgdHlwZSk7XG59XG5cbmZ1bmN0aW9uIHNpemVvZih2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgdmFyIGxlbmd0aCwgc2l6ZTtcblxuICAvLyBSYXcgQnl0ZXNcbiAgaWYgKHR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAvLyBUT0RPOiB0aGlzIGNyZWF0ZXMgYSB0aHJvdy1hd2F5IGJ1ZmZlciB3aGljaCBpcyBwcm9iYWJseSBleHBlbnNpdmUgb24gYnJvd3NlcnMuXG4gICAgbGVuZ3RoID0gYm9wcy5mcm9tKHZhbHVlKS5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCA8IDB4MjApIHtcbiAgICAgIHJldHVybiAxICsgbGVuZ3RoO1xuICAgIH1cbiAgICBpZiAobGVuZ3RoIDwgMHgxMDAwMCkge1xuICAgICAgcmV0dXJuIDMgKyBsZW5ndGg7XG4gICAgfVxuICAgIGlmIChsZW5ndGggPCAweDEwMDAwMDAwMCkge1xuICAgICAgcmV0dXJuIDUgKyBsZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgaWYgKGJvcHMuaXModmFsdWUpKSB7XG4gICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPCAweDEwMDAwKSB7XG4gICAgICByZXR1cm4gMyArIGxlbmd0aDtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDAwMDAwKSB7XG4gICAgICByZXR1cm4gNSArIGxlbmd0aDtcbiAgICB9XG4gIH1cblxuICBpZiAodHlwZSA9PT0gXCJudW1iZXJcIikge1xuICAgIC8vIEZsb2F0aW5nIFBvaW50XG4gICAgLy8gZG91YmxlXG4gICAgaWYgKHZhbHVlIDw8IDAgIT09IHZhbHVlKSByZXR1cm4gOTtcblxuICAgIC8vIEludGVnZXJzXG4gICAgaWYgKHZhbHVlID49MCkge1xuICAgICAgLy8gcG9zaXRpdmUgZml4bnVtXG4gICAgICBpZiAodmFsdWUgPCAweDgwKSByZXR1cm4gMTtcbiAgICAgIC8vIHVpbnQgOFxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDApIHJldHVybiAyO1xuICAgICAgLy8gdWludCAxNlxuICAgICAgaWYgKHZhbHVlIDwgMHgxMDAwMCkgcmV0dXJuIDM7XG4gICAgICAvLyB1aW50IDMyXG4gICAgICBpZiAodmFsdWUgPCAweDEwMDAwMDAwMCkgcmV0dXJuIDU7XG4gICAgICAvLyB1aW50IDY0XG4gICAgICBpZiAodmFsdWUgPCAweDEwMDAwMDAwMDAwMDAwMDAwKSByZXR1cm4gOTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk51bWJlciB0b28gYmlnIDB4XCIgKyB2YWx1ZS50b1N0cmluZygxNikpO1xuICAgIH1cbiAgICAvLyBuZWdhdGl2ZSBmaXhudW1cbiAgICBpZiAodmFsdWUgPj0gLTB4MjApIHJldHVybiAxO1xuICAgIC8vIGludCA4XG4gICAgaWYgKHZhbHVlID49IC0weDgwKSByZXR1cm4gMjtcbiAgICAvLyBpbnQgMTZcbiAgICBpZiAodmFsdWUgPj0gLTB4ODAwMCkgcmV0dXJuIDM7XG4gICAgLy8gaW50IDMyXG4gICAgaWYgKHZhbHVlID49IC0weDgwMDAwMDAwKSByZXR1cm4gNTtcbiAgICAvLyBpbnQgNjRcbiAgICBpZiAodmFsdWUgPj0gLTB4ODAwMDAwMDAwMDAwMDAwMCkgcmV0dXJuIDk7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTnVtYmVyIHRvbyBzbWFsbCAtMHhcIiArIHZhbHVlLnRvU3RyaW5nKDE2KS5zdWJzdHIoMSkpO1xuICB9XG5cbiAgLy8gQm9vbGVhbiwgbnVsbCwgdW5kZWZpbmVkXG4gIGlmICh0eXBlID09PSBcImJvb2xlYW5cIiB8fCB0eXBlID09PSBcInVuZGVmaW5lZFwiIHx8IHZhbHVlID09PSBudWxsKSByZXR1cm4gMTtcblxuICBpZignZnVuY3Rpb24nID09PSB0eXBlb2YgdmFsdWUudG9KU09OKVxuICAgIHJldHVybiBzaXplb2YodmFsdWUudG9KU09OKCkpXG5cbiAgLy8gQ29udGFpbmVyIFR5cGVzXG4gIGlmICh0eXBlID09PSBcIm9iamVjdFwiKSB7XG4gICAgaWYoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIHZhbHVlLnRvSlNPTilcbiAgICAgIHZhbHVlID0gdmFsdWUudG9KU09OKClcblxuICAgIHNpemUgPSAwO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgbGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBzaXplICs9IHNpemVvZih2YWx1ZVtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBlbmNvZGVhYmxlS2V5cyh2YWx1ZSlcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgc2l6ZSArPSBzaXplb2Yoa2V5KSArIHNpemVvZih2YWx1ZVtrZXldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDB4MTApIHtcbiAgICAgIHJldHVybiAxICsgc2l6ZTtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDApIHtcbiAgICAgIHJldHVybiAzICsgc2l6ZTtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCA8IDB4MTAwMDAwMDAwKSB7XG4gICAgICByZXR1cm4gNSArIHNpemU7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkFycmF5IG9yIG9iamVjdCB0b28gbG9uZyAweFwiICsgbGVuZ3RoLnRvU3RyaW5nKDE2KSk7XG4gIH1cbiAgaWYodHlwZSA9PT0gXCJmdW5jdGlvblwiKVxuICAgIHJldHVybiAwXG4gIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gdHlwZSBcIiArIHR5cGUpO1xufVxuXG5cbiIsInZhciBwcm90byA9IHt9XG5tb2R1bGUuZXhwb3J0cyA9IHByb3RvXG5cbnByb3RvLmZyb20gPSByZXF1aXJlKCcuL2Zyb20uanMnKVxucHJvdG8udG8gPSByZXF1aXJlKCcuL3RvLmpzJylcbnByb3RvLmlzID0gcmVxdWlyZSgnLi9pcy5qcycpXG5wcm90by5zdWJhcnJheSA9IHJlcXVpcmUoJy4vc3ViYXJyYXkuanMnKVxucHJvdG8uam9pbiA9IHJlcXVpcmUoJy4vam9pbi5qcycpXG5wcm90by5jb3B5ID0gcmVxdWlyZSgnLi9jb3B5LmpzJylcbnByb3RvLmNyZWF0ZSA9IHJlcXVpcmUoJy4vY3JlYXRlLmpzJylcblxubWl4KHJlcXVpcmUoJy4vcmVhZC5qcycpLCBwcm90bylcbm1peChyZXF1aXJlKCcuL3dyaXRlLmpzJyksIHByb3RvKVxuXG5mdW5jdGlvbiBtaXgoZnJvbSwgaW50bykge1xuICBmb3IodmFyIGtleSBpbiBmcm9tKSB7XG4gICAgaW50b1trZXldID0gZnJvbVtrZXldXG4gIH1cbn1cbiIsIihmdW5jdGlvbiAoZXhwb3J0cykge1xuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGxvb2t1cCA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcblxuXHRmdW5jdGlvbiBiNjRUb0J5dGVBcnJheShiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFycjtcblx0XG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnO1xuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHRwbGFjZUhvbGRlcnMgPSBiNjQuaW5kZXhPZignPScpO1xuXHRcdHBsYWNlSG9sZGVycyA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gcGxhY2VIb2xkZXJzIDogMDtcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IFtdOy8vbmV3IFVpbnQ4QXJyYXkoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKTtcblxuXHRcdC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcblx0XHRsID0gcGxhY2VIb2xkZXJzID4gMCA/IGI2NC5sZW5ndGggLSA0IDogYjY0Lmxlbmd0aDtcblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChsb29rdXAuaW5kZXhPZihiNjRbaV0pIDw8IDE4KSB8IChsb29rdXAuaW5kZXhPZihiNjRbaSArIDFdKSA8PCAxMikgfCAobG9va3VwLmluZGV4T2YoYjY0W2kgKyAyXSkgPDwgNikgfCBsb29rdXAuaW5kZXhPZihiNjRbaSArIDNdKTtcblx0XHRcdGFyci5wdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpO1xuXHRcdFx0YXJyLnB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOCk7XG5cdFx0XHRhcnIucHVzaCh0bXAgJiAweEZGKTtcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAobG9va3VwLmluZGV4T2YoYjY0W2ldKSA8PCAyKSB8IChsb29rdXAuaW5kZXhPZihiNjRbaSArIDFdKSA+PiA0KTtcblx0XHRcdGFyci5wdXNoKHRtcCAmIDB4RkYpO1xuXHRcdH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG5cdFx0XHR0bXAgPSAobG9va3VwLmluZGV4T2YoYjY0W2ldKSA8PCAxMCkgfCAobG9va3VwLmluZGV4T2YoYjY0W2kgKyAxXSkgPDwgNCkgfCAobG9va3VwLmluZGV4T2YoYjY0W2kgKyAyXSkgPj4gMik7XG5cdFx0XHRhcnIucHVzaCgodG1wID4+IDgpICYgMHhGRik7XG5cdFx0XHRhcnIucHVzaCh0bXAgJiAweEZGKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyO1xuXHR9XG5cblx0ZnVuY3Rpb24gdWludDhUb0Jhc2U2NCh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoO1xuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gKyBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gKyBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArIGxvb2t1cFtudW0gJiAweDNGXTtcblx0XHR9O1xuXG5cdFx0Ly8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuXHRcdGZvciAoaSA9IDAsIGxlbmd0aCA9IHVpbnQ4Lmxlbmd0aCAtIGV4dHJhQnl0ZXM7IGkgPCBsZW5ndGg7IGkgKz0gMykge1xuXHRcdFx0dGVtcCA9ICh1aW50OFtpXSA8PCAxNikgKyAodWludDhbaSArIDFdIDw8IDgpICsgKHVpbnQ4W2kgKyAyXSk7XG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApO1xuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdO1xuXHRcdFx0XHRvdXRwdXQgKz0gbG9va3VwW3RlbXAgPj4gMl07XG5cdFx0XHRcdG91dHB1dCArPSBsb29rdXBbKHRlbXAgPDwgNCkgJiAweDNGXTtcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKTtcblx0XHRcdFx0b3V0cHV0ICs9IGxvb2t1cFt0ZW1wID4+IDEwXTtcblx0XHRcdFx0b3V0cHV0ICs9IGxvb2t1cFsodGVtcCA+PiA0KSAmIDB4M0ZdO1xuXHRcdFx0XHRvdXRwdXQgKz0gbG9va3VwWyh0ZW1wIDw8IDIpICYgMHgzRl07XG5cdFx0XHRcdG91dHB1dCArPSAnPSc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXQ7XG5cdH1cblxuXHRtb2R1bGUuZXhwb3J0cy50b0J5dGVBcnJheSA9IGI2NFRvQnl0ZUFycmF5O1xuXHRtb2R1bGUuZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NDtcbn0oKSk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRvX3V0ZjhcblxudmFyIG91dCA9IFtdXG4gICwgY29sID0gW11cbiAgLCBmY2MgPSBTdHJpbmcuZnJvbUNoYXJDb2RlXG4gICwgbWFzayA9IFsweDQwLCAweDIwLCAweDEwLCAweDA4LCAweDA0LCAweDAyLCAweDAxXVxuICAsIHVubWFzayA9IFtcbiAgICAgIDB4MDBcbiAgICAsIDB4MDFcbiAgICAsIDB4MDIgfCAweDAxXG4gICAgLCAweDA0IHwgMHgwMiB8IDB4MDFcbiAgICAsIDB4MDggfCAweDA0IHwgMHgwMiB8IDB4MDFcbiAgICAsIDB4MTAgfCAweDA4IHwgMHgwNCB8IDB4MDIgfCAweDAxXG4gICAgLCAweDIwIHwgMHgxMCB8IDB4MDggfCAweDA0IHwgMHgwMiB8IDB4MDFcbiAgICAsIDB4NDAgfCAweDIwIHwgMHgxMCB8IDB4MDggfCAweDA0IHwgMHgwMiB8IDB4MDFcbiAgXVxuXG5mdW5jdGlvbiB0b191dGY4KGJ5dGVzLCBzdGFydCwgZW5kKSB7XG4gIHN0YXJ0ID0gc3RhcnQgPT09IHVuZGVmaW5lZCA/IDAgOiBzdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGJ5dGVzLmxlbmd0aCA6IGVuZFxuXG4gIHZhciBpZHggPSAwXG4gICAgLCBoaSA9IDB4ODBcbiAgICAsIGNvbGxlY3RpbmcgPSAwXG4gICAgLCBwb3NcbiAgICAsIGJ5XG5cbiAgY29sLmxlbmd0aCA9XG4gIG91dC5sZW5ndGggPSAwXG5cbiAgd2hpbGUoaWR4IDwgYnl0ZXMubGVuZ3RoKSB7XG4gICAgYnkgPSBieXRlc1tpZHhdXG4gICAgaWYoIWNvbGxlY3RpbmcgJiYgYnkgJiBoaSkge1xuICAgICAgcG9zID0gZmluZF9wYWRfcG9zaXRpb24oYnkpXG4gICAgICBjb2xsZWN0aW5nICs9IHBvc1xuICAgICAgaWYocG9zIDwgOCkge1xuICAgICAgICBjb2xbY29sLmxlbmd0aF0gPSBieSAmIHVubWFza1s2IC0gcG9zXVxuICAgICAgfVxuICAgIH0gZWxzZSBpZihjb2xsZWN0aW5nKSB7XG4gICAgICBjb2xbY29sLmxlbmd0aF0gPSBieSAmIHVubWFza1s2XVxuICAgICAgLS1jb2xsZWN0aW5nXG4gICAgICBpZighY29sbGVjdGluZyAmJiBjb2wubGVuZ3RoKSB7XG4gICAgICAgIG91dFtvdXQubGVuZ3RoXSA9IGZjYyhyZWR1Y2VkKGNvbCwgcG9zKSlcbiAgICAgICAgY29sLmxlbmd0aCA9IDBcbiAgICAgIH1cbiAgICB9IGVsc2UgeyBcbiAgICAgIG91dFtvdXQubGVuZ3RoXSA9IGZjYyhieSlcbiAgICB9XG4gICAgKytpZHhcbiAgfVxuICBpZihjb2wubGVuZ3RoICYmICFjb2xsZWN0aW5nKSB7XG4gICAgb3V0W291dC5sZW5ndGhdID0gZmNjKHJlZHVjZWQoY29sLCBwb3MpKVxuICAgIGNvbC5sZW5ndGggPSAwXG4gIH1cbiAgcmV0dXJuIG91dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmaW5kX3BhZF9wb3NpdGlvbihieXQpIHtcbiAgZm9yKHZhciBpID0gMDsgaSA8IDc7ICsraSkge1xuICAgIGlmKCEoYnl0ICYgbWFza1tpXSkpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHJlZHVjZWQobGlzdCkge1xuICB2YXIgb3V0ID0gMFxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgb3V0IHw9IGxpc3RbaV0gPDwgKChsZW4gLSBpIC0gMSkgKiA2KVxuICB9XG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gY29weVxuXG52YXIgc2xpY2UgPSBbXS5zbGljZVxuXG5mdW5jdGlvbiBjb3B5KHNvdXJjZSwgdGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHNvdXJjZV9zdGFydCwgc291cmNlX2VuZCkge1xuICB0YXJnZXRfc3RhcnQgPSBhcmd1bWVudHMubGVuZ3RoIDwgMyA/IDAgOiB0YXJnZXRfc3RhcnRcbiAgc291cmNlX3N0YXJ0ID0gYXJndW1lbnRzLmxlbmd0aCA8IDQgPyAwIDogc291cmNlX3N0YXJ0XG4gIHNvdXJjZV9lbmQgPSBhcmd1bWVudHMubGVuZ3RoIDwgNSA/IHNvdXJjZS5sZW5ndGggOiBzb3VyY2VfZW5kXG5cbiAgaWYoc291cmNlX2VuZCA9PT0gc291cmNlX3N0YXJ0KSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBpZih0YXJnZXQubGVuZ3RoID09PSAwIHx8IHNvdXJjZS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGlmKHNvdXJjZV9lbmQgPiBzb3VyY2UubGVuZ3RoKSB7XG4gICAgc291cmNlX2VuZCA9IHNvdXJjZS5sZW5ndGhcbiAgfVxuXG4gIGlmKHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgPCBzb3VyY2VfZW5kIC0gc291cmNlX3N0YXJ0KSB7XG4gICAgc291cmNlX2VuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRfc3RhcnQgKyBzb3VyY2Vfc3RhcnRcbiAgfVxuXG4gIGlmKHNvdXJjZS5idWZmZXIgIT09IHRhcmdldC5idWZmZXIpIHtcbiAgICByZXR1cm4gZmFzdF9jb3B5KHNvdXJjZSwgdGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHNvdXJjZV9zdGFydCwgc291cmNlX2VuZClcbiAgfVxuICByZXR1cm4gc2xvd19jb3B5KHNvdXJjZSwgdGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHNvdXJjZV9zdGFydCwgc291cmNlX2VuZClcbn1cblxuZnVuY3Rpb24gZmFzdF9jb3B5KHNvdXJjZSwgdGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHNvdXJjZV9zdGFydCwgc291cmNlX2VuZCkge1xuICB2YXIgbGVuID0gKHNvdXJjZV9lbmQgLSBzb3VyY2Vfc3RhcnQpICsgdGFyZ2V0X3N0YXJ0XG5cbiAgZm9yKHZhciBpID0gdGFyZ2V0X3N0YXJ0LCBqID0gc291cmNlX3N0YXJ0O1xuICAgICAgaSA8IGxlbjtcbiAgICAgICsraSxcbiAgICAgICsraikge1xuICAgIHRhcmdldFtpXSA9IHNvdXJjZVtqXVxuICB9XG59XG5cbmZ1bmN0aW9uIHNsb3dfY29weShmcm9tLCB0bywgaiwgaSwgamVuZCkge1xuICAvLyB0aGUgYnVmZmVycyBjb3VsZCBvdmVybGFwLlxuICB2YXIgaWVuZCA9IGplbmQgKyBpXG4gICAgLCB0bXAgPSBuZXcgVWludDhBcnJheShzbGljZS5jYWxsKGZyb20sIGksIGllbmQpKVxuICAgICwgeCA9IDBcblxuICBmb3IoOyBpIDwgaWVuZDsgKytpLCArK3gpIHtcbiAgICB0b1tqKytdID0gdG1wW3hdXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2l6ZSkge1xuICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoc2l6ZSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnJvbVxuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcblxudmFyIGRlY29kZXJzID0ge1xuICAgIGhleDogZnJvbV9oZXhcbiAgLCB1dGY4OiBmcm9tX3V0ZlxuICAsIGJhc2U2NDogZnJvbV9iYXNlNjRcbn1cblxuZnVuY3Rpb24gZnJvbShzb3VyY2UsIGVuY29kaW5nKSB7XG4gIGlmKEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShzb3VyY2UpXG4gIH1cblxuICByZXR1cm4gZGVjb2RlcnNbZW5jb2RpbmcgfHwgJ3V0ZjgnXShzb3VyY2UpXG59XG5cbmZ1bmN0aW9uIGZyb21faGV4KHN0cikge1xuICB2YXIgc2l6ZSA9IHN0ci5sZW5ndGggLyAyXG4gICAgLCBidWYgPSBuZXcgVWludDhBcnJheShzaXplKVxuICAgICwgY2hhcmFjdGVyID0gJydcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBzdHIubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBjaGFyYWN0ZXIgKz0gc3RyLmNoYXJBdChpKVxuXG4gICAgaWYoaSA+IDAgJiYgKGkgJSAyKSA9PT0gMSkge1xuICAgICAgYnVmW2k+Pj4xXSA9IHBhcnNlSW50KGNoYXJhY3RlciwgMTYpXG4gICAgICBjaGFyYWN0ZXIgPSAnJyBcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmIFxufVxuXG5mdW5jdGlvbiBmcm9tX3V0ZihzdHIpIHtcbiAgdmFyIGJ5dGVzID0gW11cbiAgICAsIHRtcFxuICAgICwgY2hcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBzdHIubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBjaCA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaWYoY2ggJiAweDgwKSB7XG4gICAgICB0bXAgPSBlbmNvZGVVUklDb21wb25lbnQoc3RyLmNoYXJBdChpKSkuc3Vic3RyKDEpLnNwbGl0KCclJylcbiAgICAgIGZvcih2YXIgaiA9IDAsIGpsZW4gPSB0bXAubGVuZ3RoOyBqIDwgamxlbjsgKytqKSB7XG4gICAgICAgIGJ5dGVzW2J5dGVzLmxlbmd0aF0gPSBwYXJzZUludCh0bXBbal0sIDE2KVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBieXRlc1tieXRlcy5sZW5ndGhdID0gY2ggXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJ5dGVzKVxufVxuXG5mdW5jdGlvbiBmcm9tX2Jhc2U2NChzdHIpIHtcbiAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGJhc2U2NC50b0J5dGVBcnJheShzdHIpKSBcbn1cbiIsIlxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihidWZmZXIpIHtcbiAgcmV0dXJuIGJ1ZmZlciBpbnN0YW5jZW9mIFVpbnQ4QXJyYXk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGpvaW5cblxuZnVuY3Rpb24gam9pbih0YXJnZXRzLCBoaW50KSB7XG4gIGlmKCF0YXJnZXRzLmxlbmd0aCkge1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheSgwKVxuICB9XG5cbiAgdmFyIGxlbiA9IGhpbnQgIT09IHVuZGVmaW5lZCA/IGhpbnQgOiBnZXRfbGVuZ3RoKHRhcmdldHMpXG4gICAgLCBvdXQgPSBuZXcgVWludDhBcnJheShsZW4pXG4gICAgLCBjdXIgPSB0YXJnZXRzWzBdXG4gICAgLCBjdXJsZW4gPSBjdXIubGVuZ3RoXG4gICAgLCBjdXJpZHggPSAwXG4gICAgLCBjdXJvZmYgPSAwXG4gICAgLCBpID0gMFxuXG4gIHdoaWxlKGkgPCBsZW4pIHtcbiAgICBpZihjdXJvZmYgPT09IGN1cmxlbikge1xuICAgICAgY3Vyb2ZmID0gMFxuICAgICAgKytjdXJpZHhcbiAgICAgIGN1ciA9IHRhcmdldHNbY3VyaWR4XVxuICAgICAgY3VybGVuID0gY3VyICYmIGN1ci5sZW5ndGhcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIG91dFtpKytdID0gY3VyW2N1cm9mZisrXSBcbiAgfVxuXG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gZ2V0X2xlbmd0aCh0YXJnZXRzKSB7XG4gIHZhciBzaXplID0gMFxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0YXJnZXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgc2l6ZSArPSB0YXJnZXRzW2ldLmJ5dGVMZW5ndGhcbiAgfVxuICByZXR1cm4gc2l6ZVxufVxuIiwidmFyIHByb3RvXG4gICwgbWFwXG5cbm1vZHVsZS5leHBvcnRzID0gcHJvdG8gPSB7fVxuXG5tYXAgPSB0eXBlb2YgV2Vha01hcCA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogbmV3IFdlYWtNYXBcblxucHJvdG8uZ2V0ID0gIW1hcCA/IG5vX3dlYWttYXBfZ2V0IDogZ2V0XG5cbmZ1bmN0aW9uIG5vX3dlYWttYXBfZ2V0KHRhcmdldCkge1xuICByZXR1cm4gbmV3IERhdGFWaWV3KHRhcmdldC5idWZmZXIsIDApXG59XG5cbmZ1bmN0aW9uIGdldCh0YXJnZXQpIHtcbiAgdmFyIG91dCA9IG1hcC5nZXQodGFyZ2V0LmJ1ZmZlcilcbiAgaWYoIW91dCkge1xuICAgIG1hcC5zZXQodGFyZ2V0LmJ1ZmZlciwgb3V0ID0gbmV3IERhdGFWaWV3KHRhcmdldC5idWZmZXIsIDApKVxuICB9XG4gIHJldHVybiBvdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlYWRVSW50ODogICAgICByZWFkX3VpbnQ4XG4gICwgcmVhZEludDg6ICAgICAgIHJlYWRfaW50OFxuICAsIHJlYWRVSW50MTZMRTogICByZWFkX3VpbnQxNl9sZVxuICAsIHJlYWRVSW50MzJMRTogICByZWFkX3VpbnQzMl9sZVxuICAsIHJlYWRJbnQxNkxFOiAgICByZWFkX2ludDE2X2xlXG4gICwgcmVhZEludDMyTEU6ICAgIHJlYWRfaW50MzJfbGVcbiAgLCByZWFkRmxvYXRMRTogICAgcmVhZF9mbG9hdF9sZVxuICAsIHJlYWREb3VibGVMRTogICByZWFkX2RvdWJsZV9sZVxuICAsIHJlYWRVSW50MTZCRTogICByZWFkX3VpbnQxNl9iZVxuICAsIHJlYWRVSW50MzJCRTogICByZWFkX3VpbnQzMl9iZVxuICAsIHJlYWRJbnQxNkJFOiAgICByZWFkX2ludDE2X2JlXG4gICwgcmVhZEludDMyQkU6ICAgIHJlYWRfaW50MzJfYmVcbiAgLCByZWFkRmxvYXRCRTogICAgcmVhZF9mbG9hdF9iZVxuICAsIHJlYWREb3VibGVCRTogICByZWFkX2RvdWJsZV9iZVxufVxuXG52YXIgbWFwID0gcmVxdWlyZSgnLi9tYXBwZWQuanMnKVxuXG5mdW5jdGlvbiByZWFkX3VpbnQ4KHRhcmdldCwgYXQpIHtcbiAgcmV0dXJuIHRhcmdldFthdF1cbn1cblxuZnVuY3Rpb24gcmVhZF9pbnQ4KHRhcmdldCwgYXQpIHtcbiAgdmFyIHYgPSB0YXJnZXRbYXRdO1xuICByZXR1cm4gdiA8IDB4ODAgPyB2IDogdiAtIDB4MTAwXG59XG5cbmZ1bmN0aW9uIHJlYWRfdWludDE2X2xlKHRhcmdldCwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuZ2V0VWludDE2KGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHRydWUpXG59XG5cbmZ1bmN0aW9uIHJlYWRfdWludDMyX2xlKHRhcmdldCwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuZ2V0VWludDMyKGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHRydWUpXG59XG5cbmZ1bmN0aW9uIHJlYWRfaW50MTZfbGUodGFyZ2V0LCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5nZXRJbnQxNihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCB0cnVlKVxufVxuXG5mdW5jdGlvbiByZWFkX2ludDMyX2xlKHRhcmdldCwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuZ2V0SW50MzIoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdHJ1ZSlcbn1cblxuZnVuY3Rpb24gcmVhZF9mbG9hdF9sZSh0YXJnZXQsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LmdldEZsb2F0MzIoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdHJ1ZSlcbn1cblxuZnVuY3Rpb24gcmVhZF9kb3VibGVfbGUodGFyZ2V0LCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5nZXRGbG9hdDY0KGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHRydWUpXG59XG5cbmZ1bmN0aW9uIHJlYWRfdWludDE2X2JlKHRhcmdldCwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuZ2V0VWludDE2KGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiByZWFkX3VpbnQzMl9iZSh0YXJnZXQsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LmdldFVpbnQzMihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gcmVhZF9pbnQxNl9iZSh0YXJnZXQsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LmdldEludDE2KGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiByZWFkX2ludDMyX2JlKHRhcmdldCwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuZ2V0SW50MzIoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIHJlYWRfZmxvYXRfYmUodGFyZ2V0LCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5nZXRGbG9hdDMyKGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiByZWFkX2RvdWJsZV9iZSh0YXJnZXQsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LmdldEZsb2F0NjQoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgZmFsc2UpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHN1YmFycmF5XG5cbmZ1bmN0aW9uIHN1YmFycmF5KGJ1ZiwgZnJvbSwgdG8pIHtcbiAgcmV0dXJuIGJ1Zi5zdWJhcnJheShmcm9tIHx8IDAsIHRvIHx8IGJ1Zi5sZW5ndGgpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHRvXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxuICAsIHRvdXRmOCA9IHJlcXVpcmUoJ3RvLXV0ZjgnKVxuXG52YXIgZW5jb2RlcnMgPSB7XG4gICAgaGV4OiB0b19oZXhcbiAgLCB1dGY4OiB0b191dGZcbiAgLCBiYXNlNjQ6IHRvX2Jhc2U2NFxufVxuXG5mdW5jdGlvbiB0byhidWYsIGVuY29kaW5nKSB7XG4gIHJldHVybiBlbmNvZGVyc1tlbmNvZGluZyB8fCAndXRmOCddKGJ1Zilcbn1cblxuZnVuY3Rpb24gdG9faGV4KGJ1Zikge1xuICB2YXIgc3RyID0gJydcbiAgICAsIGJ5dFxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGJ5dCA9IGJ1ZltpXVxuICAgIHN0ciArPSAoKGJ5dCAmIDB4RjApID4+PiA0KS50b1N0cmluZygxNilcbiAgICBzdHIgKz0gKGJ5dCAmIDB4MEYpLnRvU3RyaW5nKDE2KVxuICB9XG5cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiB0b191dGYoYnVmKSB7XG4gIHJldHVybiB0b3V0ZjgoYnVmKVxufVxuXG5mdW5jdGlvbiB0b19iYXNlNjQoYnVmKSB7XG4gIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHdyaXRlVUludDg6ICAgICAgd3JpdGVfdWludDhcbiAgLCB3cml0ZUludDg6ICAgICAgIHdyaXRlX2ludDhcbiAgLCB3cml0ZVVJbnQxNkxFOiAgIHdyaXRlX3VpbnQxNl9sZVxuICAsIHdyaXRlVUludDMyTEU6ICAgd3JpdGVfdWludDMyX2xlXG4gICwgd3JpdGVJbnQxNkxFOiAgICB3cml0ZV9pbnQxNl9sZVxuICAsIHdyaXRlSW50MzJMRTogICAgd3JpdGVfaW50MzJfbGVcbiAgLCB3cml0ZUZsb2F0TEU6ICAgIHdyaXRlX2Zsb2F0X2xlXG4gICwgd3JpdGVEb3VibGVMRTogICB3cml0ZV9kb3VibGVfbGVcbiAgLCB3cml0ZVVJbnQxNkJFOiAgIHdyaXRlX3VpbnQxNl9iZVxuICAsIHdyaXRlVUludDMyQkU6ICAgd3JpdGVfdWludDMyX2JlXG4gICwgd3JpdGVJbnQxNkJFOiAgICB3cml0ZV9pbnQxNl9iZVxuICAsIHdyaXRlSW50MzJCRTogICAgd3JpdGVfaW50MzJfYmVcbiAgLCB3cml0ZUZsb2F0QkU6ICAgIHdyaXRlX2Zsb2F0X2JlXG4gICwgd3JpdGVEb3VibGVCRTogICB3cml0ZV9kb3VibGVfYmVcbn1cblxudmFyIG1hcCA9IHJlcXVpcmUoJy4vbWFwcGVkLmpzJylcblxuZnVuY3Rpb24gd3JpdGVfdWludDgodGFyZ2V0LCB2YWx1ZSwgYXQpIHtcbiAgcmV0dXJuIHRhcmdldFthdF0gPSB2YWx1ZVxufVxuXG5mdW5jdGlvbiB3cml0ZV9pbnQ4KHRhcmdldCwgdmFsdWUsIGF0KSB7XG4gIHJldHVybiB0YXJnZXRbYXRdID0gdmFsdWUgPCAwID8gdmFsdWUgKyAweDEwMCA6IHZhbHVlXG59XG5cbmZ1bmN0aW9uIHdyaXRlX3VpbnQxNl9sZSh0YXJnZXQsIHZhbHVlLCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5zZXRVaW50MTYoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdmFsdWUsIHRydWUpXG59XG5cbmZ1bmN0aW9uIHdyaXRlX3VpbnQzMl9sZSh0YXJnZXQsIHZhbHVlLCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5zZXRVaW50MzIoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdmFsdWUsIHRydWUpXG59XG5cbmZ1bmN0aW9uIHdyaXRlX2ludDE2X2xlKHRhcmdldCwgdmFsdWUsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LnNldEludDE2KGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHZhbHVlLCB0cnVlKVxufVxuXG5mdW5jdGlvbiB3cml0ZV9pbnQzMl9sZSh0YXJnZXQsIHZhbHVlLCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5zZXRJbnQzMihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCB2YWx1ZSwgdHJ1ZSlcbn1cblxuZnVuY3Rpb24gd3JpdGVfZmxvYXRfbGUodGFyZ2V0LCB2YWx1ZSwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuc2V0RmxvYXQzMihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCB2YWx1ZSwgdHJ1ZSlcbn1cblxuZnVuY3Rpb24gd3JpdGVfZG91YmxlX2xlKHRhcmdldCwgdmFsdWUsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LnNldEZsb2F0NjQoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdmFsdWUsIHRydWUpXG59XG5cbmZ1bmN0aW9uIHdyaXRlX3VpbnQxNl9iZSh0YXJnZXQsIHZhbHVlLCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5zZXRVaW50MTYoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdmFsdWUsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiB3cml0ZV91aW50MzJfYmUodGFyZ2V0LCB2YWx1ZSwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuc2V0VWludDMyKGF0ICsgdGFyZ2V0LmJ5dGVPZmZzZXQsIHZhbHVlLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gd3JpdGVfaW50MTZfYmUodGFyZ2V0LCB2YWx1ZSwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuc2V0SW50MTYoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdmFsdWUsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiB3cml0ZV9pbnQzMl9iZSh0YXJnZXQsIHZhbHVlLCBhdCkge1xuICB2YXIgZHYgPSBtYXAuZ2V0KHRhcmdldCk7XG4gIHJldHVybiBkdi5zZXRJbnQzMihhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCB2YWx1ZSwgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIHdyaXRlX2Zsb2F0X2JlKHRhcmdldCwgdmFsdWUsIGF0KSB7XG4gIHZhciBkdiA9IG1hcC5nZXQodGFyZ2V0KTtcbiAgcmV0dXJuIGR2LnNldEZsb2F0MzIoYXQgKyB0YXJnZXQuYnl0ZU9mZnNldCwgdmFsdWUsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiB3cml0ZV9kb3VibGVfYmUodGFyZ2V0LCB2YWx1ZSwgYXQpIHtcbiAgdmFyIGR2ID0gbWFwLmdldCh0YXJnZXQpO1xuICByZXR1cm4gZHYuc2V0RmxvYXQ2NChhdCArIHRhcmdldC5ieXRlT2Zmc2V0LCB2YWx1ZSwgZmFsc2UpXG59XG4iLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBJbnRlcmFjdGlvbkRhdGEoKXt0aGlzLmdsb2JhbD1uZXcgUG9pbnQsdGhpcy5sb2NhbD1uZXcgUG9pbnQsdGhpcy50YXJnZXQ9bnVsbCx0aGlzLm9yaWdpbmFsRXZlbnQ9bnVsbH1mdW5jdGlvbiBJbnRlcmFjdGlvbk1hbmFnZXIoYSl7dGhpcy5zdGFnZT1hLHRoaXMubW91c2U9bmV3IEludGVyYWN0aW9uRGF0YSx0aGlzLnRvdWNocz17fSx0aGlzLnRlbXBQb2ludD1uZXcgUG9pbnQsdGhpcy5tb3VzZW92ZXJFbmFibGVkPSEwLHRoaXMucG9vbD1bXSx0aGlzLmludGVyYWN0aXZlSXRlbXM9W10sdGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQ9bnVsbCx0aGlzLmxhc3Q9MH12YXIgZ2xvYmFscz1yZXF1aXJlKFwiLi9jb3JlL2dsb2JhbHNcIiksUG9pbnQ9cmVxdWlyZShcIi4vZ2VvbS9Qb2ludFwiKSxTcHJpdGU9cmVxdWlyZShcIi4vZGlzcGxheS9TcHJpdGVcIikscGxhdGZvcm09cmVxdWlyZShcIi4vcGxhdGZvcm1cIik7SW50ZXJhY3Rpb25EYXRhLnByb3RvdHlwZS5nZXRMb2NhbFBvc2l0aW9uPWZ1bmN0aW9uKGEpe3ZhciBiPWEud29ybGRUcmFuc2Zvcm0sYz10aGlzLmdsb2JhbCxkPWJbMF0sZT1iWzFdLGY9YlsyXSxnPWJbM10saD1iWzRdLGk9Yls1XSxqPTEvKGQqaCtlKi1nKTtyZXR1cm4gbmV3IFBvaW50KGgqaipjLngrLWUqaipjLnkrKGkqZS1mKmgpKmosZCpqKmMueSstZypqKmMueCsoLWkqZCtmKmcpKmopfTt2YXIgcHJvdG89SW50ZXJhY3Rpb25NYW5hZ2VyLnByb3RvdHlwZTtwcm90by5oYW5kbGVFdmVudD1mdW5jdGlvbihhKXtzd2l0Y2goYS50eXBlKXtjYXNlXCJtb3VzZWRvd25cIjp0aGlzLm9uTW91c2VEb3duKGEpO2JyZWFrO2Nhc2VcIm1vdXNlbW92ZVwiOnRoaXMub25Nb3VzZU1vdmUoYSk7YnJlYWs7Y2FzZVwibW91c2V1cFwiOnRoaXMub25Nb3VzZVVwKGEpO2JyZWFrO2Nhc2VcIm1vdXNlb3V0XCI6dGhpcy5vbk1vdXNlT3V0KGEpO2JyZWFrO2Nhc2VcInRvdWNoc3RhcnRcIjp0aGlzLm9uVG91Y2hTdGFydChhKTticmVhaztjYXNlXCJ0b3VjaG1vdmVcIjp0aGlzLm9uVG91Y2hNb3ZlKGEpO2JyZWFrO2Nhc2VcInRvdWNoZW5kXCI6dGhpcy5vblRvdWNoRW5kKGEpfX0scHJvdG8uY29sbGVjdEludGVyYWN0aXZlU3ByaXRlPWZ1bmN0aW9uKGEsYil7Zm9yKHZhciBjPWEuY2hpbGRyZW4sZD1jLmxlbmd0aC0xO2Q+PTA7ZC0tKXt2YXIgZT1jW2RdO2UuaW50ZXJhY3RpdmU/KGIuaW50ZXJhY3RpdmVDaGlsZHJlbj0hMCx0aGlzLmludGVyYWN0aXZlSXRlbXMucHVzaChlKSxlLmNoaWxkcmVuLmxlbmd0aD4wJiZ0aGlzLmNvbGxlY3RJbnRlcmFjdGl2ZVNwcml0ZShlLGUpKTooZS5fX2lQYXJlbnQ9bnVsbCxlLmNoaWxkcmVuLmxlbmd0aD4wJiZ0aGlzLmNvbGxlY3RJbnRlcmFjdGl2ZVNwcml0ZShlLGIpKX19LHByb3RvLnNldFRhcmdldD1mdW5jdGlvbihhKXthP251bGw9PT10aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudCYmdGhpcy5zZXRUYXJnZXREb21FbGVtZW50KGEudmlldyk6bnVsbCE9PXRoaXMudGFyZ2V0JiZwbGF0Zm9ybS53aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIix0aGlzLCEwKSxwbGF0Zm9ybS53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIix0aGlzLCEwKSx0aGlzLnRhcmdldD1hfSxwcm90by5zZXRUYXJnZXREb21FbGVtZW50PWZ1bmN0aW9uKGEpe251bGwhPT10aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudCYmKHRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50LnN0eWxlW1wiLW1zLWNvbnRlbnQtem9vbWluZ1wiXT1cIlwiLHRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50LnN0eWxlW1wiLW1zLXRvdWNoLWFjdGlvblwiXT1cIlwiLHRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIix0aGlzLCEwKSx0aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsdGhpcywhMCksdGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsdGhpcywhMCksdGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIix0aGlzLCEwKSx0aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIix0aGlzLCEwKSx0aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsdGhpcywhMCkpO3ZhciBiPXBsYXRmb3JtLm5hdmlnYXRvcjtiJiZiLm1zUG9pbnRlckVuYWJsZWQmJihhLnN0eWxlW1wiLW1zLWNvbnRlbnQtem9vbWluZ1wiXT1cIm5vbmVcIixhLnN0eWxlW1wiLW1zLXRvdWNoLWFjdGlvblwiXT1cIm5vbmVcIiksYS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsdGhpcywhMCksYS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsdGhpcywhMCksYS5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdXRcIix0aGlzLCEwKSxhLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsdGhpcywhMCksYS5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIix0aGlzLCEwKSxhLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIix0aGlzLCEwKSx0aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudD1hfSxwcm90by51cGRhdGU9ZnVuY3Rpb24oKXtpZih0aGlzLnRhcmdldCl7dmFyIGE9RGF0ZS5ub3coKSxiPWEtdGhpcy5sYXN0O2lmKGI9MzAqYi8xZTMsISgxPmIpKXt0aGlzLmxhc3Q9YTt2YXIgYyxkO2lmKHRoaXMuZGlydHkpe2Zvcih0aGlzLmRpcnR5PSExLGM9MCxkPXRoaXMuaW50ZXJhY3RpdmVJdGVtcy5sZW5ndGg7ZD5jO2MrKyl0aGlzLmludGVyYWN0aXZlSXRlbXNbY10uaW50ZXJhY3RpdmVDaGlsZHJlbj0hMTt0aGlzLmludGVyYWN0aXZlSXRlbXM9W10sdGhpcy5zdGFnZS5pbnRlcmFjdGl2ZSYmdGhpcy5pbnRlcmFjdGl2ZUl0ZW1zLnB1c2godGhpcy5zdGFnZSksdGhpcy5jb2xsZWN0SW50ZXJhY3RpdmVTcHJpdGUodGhpcy5zdGFnZSx0aGlzLnN0YWdlKX1mb3IodGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQuc3R5bGUuY3Vyc29yPVwiaW5oZXJpdFwiLGM9MCxkPXRoaXMuaW50ZXJhY3RpdmVJdGVtcy5sZW5ndGg7ZD5jO2MrKyl7dmFyIGU9dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zW2NdOyhlLm1vdXNlb3Zlcnx8ZS5tb3VzZW91dHx8ZS5idXR0b25Nb2RlKSYmKGUuX19oaXQ9dGhpcy5oaXRUZXN0KGUsdGhpcy5tb3VzZSksdGhpcy5tb3VzZS50YXJnZXQ9ZSxlLl9faGl0PyhlLmJ1dHRvbk1vZGUmJih0aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudC5zdHlsZS5jdXJzb3I9ZS5kZWZhdWx0Q3Vyc29yKSxlLl9faXNPdmVyfHwoZS5tb3VzZW92ZXImJmUubW91c2VvdmVyKHRoaXMubW91c2UpLGUuX19pc092ZXI9ITApKTplLl9faXNPdmVyJiYoZS5tb3VzZW91dCYmZS5tb3VzZW91dCh0aGlzLm1vdXNlKSxlLl9faXNPdmVyPSExKSl9fX19LHByb3RvLm9uTW91c2VNb3ZlPWZ1bmN0aW9uKGEpe3RoaXMubW91c2Uub3JpZ2luYWxFdmVudD1hO3ZhciBiPXRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO3RoaXMubW91c2UuZ2xvYmFsLng9KGEuY2xpZW50WC1iLmxlZnQpKih0aGlzLnRhcmdldC53aWR0aC9iLndpZHRoKSx0aGlzLm1vdXNlLmdsb2JhbC55PShhLmNsaWVudFktYi50b3ApKih0aGlzLnRhcmdldC5oZWlnaHQvYi5oZWlnaHQpO2Zvcih2YXIgYz0wLGQ9dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zLmxlbmd0aDtkPmM7YysrKXt2YXIgZT10aGlzLmludGVyYWN0aXZlSXRlbXNbY107ZS5tb3VzZW1vdmUmJmUubW91c2Vtb3ZlKHRoaXMubW91c2UpfX0scHJvdG8ub25Nb3VzZURvd249ZnVuY3Rpb24oYSl7dGhpcy5tb3VzZS5vcmlnaW5hbEV2ZW50PWE7Zm9yKHZhciBiPTAsYz10aGlzLmludGVyYWN0aXZlSXRlbXMubGVuZ3RoO2M+YjtiKyspe3ZhciBkPXRoaXMuaW50ZXJhY3RpdmVJdGVtc1tiXTtpZigoZC5tb3VzZWRvd258fGQuY2xpY2spJiYoZC5fX21vdXNlSXNEb3duPSEwLGQuX19oaXQ9dGhpcy5oaXRUZXN0KGQsdGhpcy5tb3VzZSksZC5fX2hpdCYmKGQubW91c2Vkb3duJiZkLm1vdXNlZG93bih0aGlzLm1vdXNlKSxkLl9faXNEb3duPSEwLCFkLmludGVyYWN0aXZlQ2hpbGRyZW4pKSlicmVha319LHByb3RvLm9uTW91c2VPdXQ9ZnVuY3Rpb24oKXt0aGlzLmludGVyYWN0aW9uRE9NRWxlbWVudC5zdHlsZS5jdXJzb3I9XCJpbmhlcml0XCI7Zm9yKHZhciBhPTAsYj10aGlzLmludGVyYWN0aXZlSXRlbXMubGVuZ3RoO2I+YTthKyspe3ZhciBjPXRoaXMuaW50ZXJhY3RpdmVJdGVtc1thXTtjLl9faXNPdmVyJiYodGhpcy5tb3VzZS50YXJnZXQ9YyxjLm1vdXNlb3V0JiZjLm1vdXNlb3V0KHRoaXMubW91c2UpLGMuX19pc092ZXI9ITEpfX0scHJvdG8ub25Nb3VzZVVwPWZ1bmN0aW9uKGEpe3RoaXMubW91c2Uub3JpZ2luYWxFdmVudD1hO2Zvcih2YXIgYj0hMSxjPTAsZD10aGlzLmludGVyYWN0aXZlSXRlbXMubGVuZ3RoO2Q+YztjKyspe3ZhciBlPXRoaXMuaW50ZXJhY3RpdmVJdGVtc1tjXTsoZS5tb3VzZXVwfHxlLm1vdXNldXBvdXRzaWRlfHxlLmNsaWNrKSYmKGUuX19oaXQ9dGhpcy5oaXRUZXN0KGUsdGhpcy5tb3VzZSksZS5fX2hpdCYmIWI/KGUubW91c2V1cCYmZS5tb3VzZXVwKHRoaXMubW91c2UpLGUuX19pc0Rvd24mJmUuY2xpY2smJmUuY2xpY2sodGhpcy5tb3VzZSksZS5pbnRlcmFjdGl2ZUNoaWxkcmVufHwoYj0hMCkpOmUuX19pc0Rvd24mJmUubW91c2V1cG91dHNpZGUmJmUubW91c2V1cG91dHNpZGUodGhpcy5tb3VzZSksZS5fX2lzRG93bj0hMSl9fSxwcm90by5oaXRUZXN0PWZ1bmN0aW9uKGEsYil7dmFyIGM9Yi5nbG9iYWw7aWYoYS52Y291bnQhPT1nbG9iYWxzLnZpc2libGVDb3VudClyZXR1cm4hMTt2YXIgZD1hIGluc3RhbmNlb2YgU3ByaXRlLGU9YS53b3JsZFRyYW5zZm9ybSxmPWVbMF0sZz1lWzFdLGg9ZVsyXSxpPWVbM10saj1lWzRdLGs9ZVs1XSxsPTEvKGYqaitnKi1pKSxtPWoqbCpjLngrLWcqbCpjLnkrKGsqZy1oKmopKmwsbj1mKmwqYy55Ky1pKmwqYy54KygtaypmK2gqaSkqbDtpZihiLnRhcmdldD1hLGEuaGl0QXJlYSYmYS5oaXRBcmVhLmNvbnRhaW5zKXJldHVybiBhLmhpdEFyZWEuY29udGFpbnMobSxuKT8oYi50YXJnZXQ9YSwhMCk6ITE7aWYoZCl7dmFyIG8scD1hLnRleHR1cmUuZnJhbWUud2lkdGgscT1hLnRleHR1cmUuZnJhbWUuaGVpZ2h0LHI9LXAqYS5hbmNob3IueDtpZihtPnImJnIrcD5tJiYobz0tcSphLmFuY2hvci55LG4+byYmbytxPm4pKXJldHVybiBiLnRhcmdldD1hLCEwfWZvcih2YXIgcz0wLHQ9YS5jaGlsZHJlbi5sZW5ndGg7dD5zO3MrKyl7dmFyIHU9YS5jaGlsZHJlbltzXSx2PXRoaXMuaGl0VGVzdCh1LGIpO2lmKHYpcmV0dXJuIGIudGFyZ2V0PWEsITB9cmV0dXJuITF9LHByb3RvLm9uVG91Y2hNb3ZlPWZ1bmN0aW9uKGEpe3ZhciBiLGMsZCxlLGYsZyxoLGk9dGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksaj1hLmNoYW5nZWRUb3VjaGVzO2ZvcihiPTAsYz1qLmxlbmd0aDtjPmI7YisrKWZvcihkPWpbYl0sZT10aGlzLnRvdWNoc1tkLmlkZW50aWZpZXJdLGUub3JpZ2luYWxFdmVudD1hLGUuZ2xvYmFsLng9KGQuY2xpZW50WC1pLmxlZnQpKih0aGlzLnRhcmdldC53aWR0aC9pLndpZHRoKSxlLmdsb2JhbC55PShkLmNsaWVudFktaS50b3ApKih0aGlzLnRhcmdldC5oZWlnaHQvaS5oZWlnaHQpLGY9MCxnPXRoaXMuaW50ZXJhY3RpdmVJdGVtcy5sZW5ndGg7Zz5mO2YrKyloPXRoaXMuaW50ZXJhY3RpdmVJdGVtc1tiXSxoLnRvdWNobW92ZSYmaC50b3VjaG1vdmUoZSl9LHByb3RvLm9uVG91Y2hTdGFydD1mdW5jdGlvbihhKXtmb3IodmFyIGI9dGhpcy5pbnRlcmFjdGlvbkRPTUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksYz1hLmNoYW5nZWRUb3VjaGVzLGQ9MCxlPWMubGVuZ3RoO2U+ZDtkKyspe3ZhciBmPWNbZF0sZz10aGlzLnBvb2wucG9wKCk7Z3x8KGc9bmV3IEludGVyYWN0aW9uRGF0YSksZy5vcmlnaW5hbEV2ZW50PWEsdGhpcy50b3VjaHNbZi5pZGVudGlmaWVyXT1nLGcuZ2xvYmFsLng9KGYuY2xpZW50WC1iLmxlZnQpKih0aGlzLnRhcmdldC53aWR0aC9iLndpZHRoKSxnLmdsb2JhbC55PShmLmNsaWVudFktYi50b3ApKih0aGlzLnRhcmdldC5oZWlnaHQvYi5oZWlnaHQpO2Zvcih2YXIgaD0wLGk9dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zLmxlbmd0aDtpPmg7aCsrKXt2YXIgaj10aGlzLmludGVyYWN0aXZlSXRlbXNbaF07aWYoKGoudG91Y2hzdGFydHx8ai50YXApJiYoai5fX2hpdD10aGlzLmhpdFRlc3QoaixnKSxqLl9faGl0JiYoai50b3VjaHN0YXJ0JiZqLnRvdWNoc3RhcnQoZyksai5fX2lzRG93bj0hMCxqLl9fdG91Y2hEYXRhPWcsIWouaW50ZXJhY3RpdmVDaGlsZHJlbikpKWJyZWFrfX19LHByb3RvLm9uVG91Y2hFbmQ9ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPXRoaXMuaW50ZXJhY3Rpb25ET01FbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLGM9YS5jaGFuZ2VkVG91Y2hlcyxkPTAsZT1jLmxlbmd0aDtlPmQ7ZCsrKXt2YXIgZj1jW2RdLGc9dGhpcy50b3VjaHNbZi5pZGVudGlmaWVyXSxoPSExO2cuZ2xvYmFsLng9KGYuY2xpZW50WC1iLmxlZnQpKih0aGlzLnRhcmdldC53aWR0aC9iLndpZHRoKSxnLmdsb2JhbC55PShmLmNsaWVudFktYi50b3ApKih0aGlzLnRhcmdldC5oZWlnaHQvYi5oZWlnaHQpO2Zvcih2YXIgaT0wLGo9dGhpcy5pbnRlcmFjdGl2ZUl0ZW1zLmxlbmd0aDtqPmk7aSsrKXt2YXIgaz10aGlzLmludGVyYWN0aXZlSXRlbXNbaV0sbD1rLl9fdG91Y2hEYXRhO2suX19oaXQ9dGhpcy5oaXRUZXN0KGssZyksbD09PWcmJihnLm9yaWdpbmFsRXZlbnQ9YSwoay50b3VjaGVuZHx8ay50YXApJiYoay5fX2hpdCYmIWg/KGsudG91Y2hlbmQmJmsudG91Y2hlbmQoZyksay5fX2lzRG93biYmay50YXAmJmsudGFwKGcpLGsuaW50ZXJhY3RpdmVDaGlsZHJlbnx8KGg9ITApKTprLl9faXNEb3duJiZrLnRvdWNoZW5kb3V0c2lkZSYmay50b3VjaGVuZG91dHNpZGUoZyksay5fX2lzRG93bj0hMSksay5fX3RvdWNoRGF0YT1udWxsKX10aGlzLnBvb2wucHVzaChnKSx0aGlzLnRvdWNoc1tmLmlkZW50aWZpZXJdPW51bGx9fSxtb2R1bGUuZXhwb3J0cz1JbnRlcmFjdGlvbk1hbmFnZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7bW9kdWxlLmV4cG9ydHM9e2dsOm51bGwscHJpbWl0aXZlU2hhZGVyOm51bGwsc3RyaXBTaGFkZXI6bnVsbCxkZWZhdWx0U2hhZGVyOm51bGwsb2Zmc2V0Om51bGwscHJvamVjdGlvbjpudWxsLHRleHR1cmVzVG9VcGRhdGU6W10sdGV4dHVyZXNUb0Rlc3Ryb3k6W10sdmlzaWJsZUNvdW50OjB9OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cbmZ1bmN0aW9uIERpc3BsYXlPYmplY3QoKXt0aGlzLmxhc3Q9dGhpcyx0aGlzLmZpcnN0PXRoaXMsdGhpcy5wb3NpdGlvbj1uZXcgUG9pbnQsdGhpcy5zY2FsZT1uZXcgUG9pbnQoMSwxKSx0aGlzLnBpdm90PW5ldyBQb2ludCgwLDApLHRoaXMucm90YXRpb249MCx0aGlzLmFscGhhPTEsdGhpcy52aXNpYmxlPSEwLHRoaXMuaGl0QXJlYT1udWxsLHRoaXMuYnV0dG9uTW9kZT0hMSx0aGlzLnJlbmRlcmFibGU9ITEsdGhpcy5wYXJlbnQ9bnVsbCx0aGlzLnN0YWdlPW51bGwsdGhpcy53b3JsZEFscGhhPTEsdGhpcy5faW50ZXJhY3RpdmU9ITEsdGhpcy5kZWZhdWx0Q3Vyc29yPVwicG9pbnRlclwiLHRoaXMud29ybGRUcmFuc2Zvcm09bWF0My5jcmVhdGUoKSx0aGlzLmxvY2FsVHJhbnNmb3JtPW1hdDMuY3JlYXRlKCksdGhpcy5jb2xvcj1bXSx0aGlzLmR5bmFtaWM9ITAsdGhpcy5fc3I9MCx0aGlzLl9jcj0xLHRoaXMuZmlsdGVyQXJlYT1uZXcgUmVjdGFuZ2xlKDAsMCwxLDEpfXZhciBnbG9iYWxzPXJlcXVpcmUoXCIuLi9jb3JlL2dsb2JhbHNcIiksbWF0Mz1yZXF1aXJlKFwiLi4vZ2VvbS9tYXRyaXhcIikubWF0MyxGaWx0ZXJCbG9jaz1yZXF1aXJlKFwiLi4vZmlsdGVycy9GaWx0ZXJCbG9ja1wiKSxQb2ludD1yZXF1aXJlKFwiLi4vZ2VvbS9Qb2ludFwiKSxSZWN0YW5nbGU9cmVxdWlyZShcIi4uL2dlb20vUmVjdGFuZ2xlXCIpLHByb3RvPURpc3BsYXlPYmplY3QucHJvdG90eXBlO3Byb3RvLnNldEludGVyYWN0aXZlPWZ1bmN0aW9uKGEpe3RoaXMuaW50ZXJhY3RpdmU9YX0sT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiaW50ZXJhY3RpdmVcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2ludGVyYWN0aXZlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5faW50ZXJhY3RpdmU9YSx0aGlzLnN0YWdlJiYodGhpcy5zdGFnZS5kaXJ0eT0hMCl9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwibWFza1wiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fbWFza30sc2V0OmZ1bmN0aW9uKGEpe2E/dGhpcy5fbWFzaz8oYS5zdGFydD10aGlzLl9tYXNrLnN0YXJ0LGEuZW5kPXRoaXMuX21hc2suZW5kKToodGhpcy5hZGRGaWx0ZXIoYSksYS5yZW5kZXJhYmxlPSExKToodGhpcy5yZW1vdmVGaWx0ZXIodGhpcy5fbWFzayksdGhpcy5fbWFzay5yZW5kZXJhYmxlPSEwKSx0aGlzLl9tYXNrPWF9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiZmlsdGVyc1wiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fZmlsdGVyc30sc2V0OmZ1bmN0aW9uKGEpe2lmKGEpe3RoaXMuX2ZpbHRlcnMmJnRoaXMucmVtb3ZlRmlsdGVyKHRoaXMuX2ZpbHRlcnMpLHRoaXMuYWRkRmlsdGVyKGEpO2Zvcih2YXIgYj1bXSxjPTA7YzxhLmxlbmd0aDtjKyspZm9yKHZhciBkPWFbY10ucGFzc2VzLGU9MDtlPGQubGVuZ3RoO2UrKyliLnB1c2goZFtlXSk7YS5zdGFydC5maWx0ZXJQYXNzZXM9Yn1lbHNlIHRoaXMuX2ZpbHRlcnMmJnRoaXMucmVtb3ZlRmlsdGVyKHRoaXMuX2ZpbHRlcnMpO3RoaXMuX2ZpbHRlcnM9YX19KSxwcm90by5hZGRGaWx0ZXI9ZnVuY3Rpb24oYSl7dmFyIGI9bmV3IEZpbHRlckJsb2NrLGM9bmV3IEZpbHRlckJsb2NrO2Euc3RhcnQ9YixhLmVuZD1jLGIuZGF0YT1hLGMuZGF0YT1hLGIuZmlyc3Q9Yi5sYXN0PXRoaXMsYy5maXJzdD1jLmxhc3Q9dGhpcyxiLm9wZW49ITAsYi50YXJnZXQ9dGhpczt2YXIgZCxlLGY9YixnPWI7ZT10aGlzLmZpcnN0Ll9pUHJldixlPyhkPWUuX2lOZXh0LGYuX2lQcmV2PWUsZS5faU5leHQ9Zik6ZD10aGlzLGQmJihkLl9pUHJldj1nLGcuX2lOZXh0PWQpLGY9YyxnPWMsZD1udWxsLGU9bnVsbCxlPXRoaXMubGFzdCxkPWUuX2lOZXh0LGQmJihkLl9pUHJldj1nLGcuX2lOZXh0PWQpLGYuX2lQcmV2PWUsZS5faU5leHQ9Zjtmb3IodmFyIGg9dGhpcyxpPXRoaXMubGFzdDtoOyloLmxhc3Q9PT1pJiYoaC5sYXN0PWMpLGg9aC5wYXJlbnQ7dGhpcy5maXJzdD1iLHRoaXMuX19yZW5kZXJHcm91cCYmdGhpcy5fX3JlbmRlckdyb3VwLmFkZEZpbHRlckJsb2NrcyhiLGMpfSxwcm90by5yZW1vdmVGaWx0ZXI9ZnVuY3Rpb24oYSl7dmFyIGI9YS5zdGFydCxjPWIuX2lOZXh0LGQ9Yi5faVByZXY7YyYmKGMuX2lQcmV2PWQpLGQmJihkLl9pTmV4dD1jKSx0aGlzLmZpcnN0PWIuX2lOZXh0O3ZhciBlPWEuZW5kO2M9ZS5faU5leHQsZD1lLl9pUHJldixjJiYoYy5faVByZXY9ZCksZC5faU5leHQ9Yztmb3IodmFyIGY9ZS5faVByZXYsZz10aGlzO2cubGFzdD09PWUmJihnLmxhc3Q9ZixnPWcucGFyZW50KTspO3RoaXMuX19yZW5kZXJHcm91cCYmdGhpcy5fX3JlbmRlckdyb3VwLnJlbW92ZUZpbHRlckJsb2NrcyhiLGUpfSxwcm90by51cGRhdGVUcmFuc2Zvcm09ZnVuY3Rpb24oKXt0aGlzLnJvdGF0aW9uIT09dGhpcy5yb3RhdGlvbkNhY2hlJiYodGhpcy5yb3RhdGlvbkNhY2hlPXRoaXMucm90YXRpb24sdGhpcy5fc3I9TWF0aC5zaW4odGhpcy5yb3RhdGlvbiksdGhpcy5fY3I9TWF0aC5jb3ModGhpcy5yb3RhdGlvbikpO3ZhciBhPXRoaXMubG9jYWxUcmFuc2Zvcm0sYj10aGlzLnBhcmVudC53b3JsZFRyYW5zZm9ybSxjPXRoaXMud29ybGRUcmFuc2Zvcm07YVswXT10aGlzLl9jcip0aGlzLnNjYWxlLngsYVsxXT0tdGhpcy5fc3IqdGhpcy5zY2FsZS55LGFbM109dGhpcy5fc3IqdGhpcy5zY2FsZS54LGFbNF09dGhpcy5fY3IqdGhpcy5zY2FsZS55O3ZhciBkPXRoaXMucGl2b3QueCxlPXRoaXMucGl2b3QueSxmPWFbMF0sZz1hWzFdLGg9dGhpcy5wb3NpdGlvbi54LWFbMF0qZC1lKmFbMV0saT1hWzNdLGo9YVs0XSxrPXRoaXMucG9zaXRpb24ueS1hWzRdKmUtZCphWzNdLGw9YlswXSxtPWJbMV0sbj1iWzJdLG89YlszXSxwPWJbNF0scT1iWzVdO2FbMl09aCxhWzVdPWssY1swXT1sKmYrbSppLGNbMV09bCpnK20qaixjWzJdPWwqaCttKmsrbixjWzNdPW8qZitwKmksY1s0XT1vKmcrcCpqLGNbNV09bypoK3AqaytxLHRoaXMud29ybGRBbHBoYT10aGlzLmFscGhhKnRoaXMucGFyZW50LndvcmxkQWxwaGEsdGhpcy52Y291bnQ9Z2xvYmFscy52aXNpYmxlQ291bnR9LG1vZHVsZS5leHBvcnRzPURpc3BsYXlPYmplY3Q7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gRGlzcGxheU9iamVjdENvbnRhaW5lcigpe0Rpc3BsYXlPYmplY3QuY2FsbCh0aGlzKSx0aGlzLmNoaWxkcmVuPVtdfXZhciBEaXNwbGF5T2JqZWN0PXJlcXVpcmUoXCIuL0Rpc3BsYXlPYmplY3RcIikscHJvdG89RGlzcGxheU9iamVjdENvbnRhaW5lci5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShEaXNwbGF5T2JqZWN0LnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOkRpc3BsYXlPYmplY3RDb250YWluZXJ9fSk7cHJvdG8uYWRkQ2hpbGQ9ZnVuY3Rpb24oYSl7aWYoYS5wYXJlbnQmJmEucGFyZW50IT09dGhpcyYmYS5wYXJlbnQucmVtb3ZlQ2hpbGQoYSksYS5wYXJlbnQ9dGhpcyx0aGlzLmNoaWxkcmVuLnB1c2goYSksdGhpcy5zdGFnZSl7dmFyIGI9YTtkbyBiLmludGVyYWN0aXZlJiYodGhpcy5zdGFnZS5kaXJ0eT0hMCksYi5zdGFnZT10aGlzLnN0YWdlLGI9Yi5faU5leHQ7d2hpbGUoYil9dmFyIGMsZCxlPWEuZmlyc3QsZj1hLmxhc3Q7ZD10aGlzLl9maWx0ZXJzfHx0aGlzLl9tYXNrP3RoaXMubGFzdC5faVByZXY6dGhpcy5sYXN0LGM9ZC5faU5leHQ7Zm9yKHZhciBnPXRoaXMsaD1kO2c7KWcubGFzdD09PWgmJihnLmxhc3Q9YS5sYXN0KSxnPWcucGFyZW50O2MmJihjLl9pUHJldj1mLGYuX2lOZXh0PWMpLGUuX2lQcmV2PWQsZC5faU5leHQ9ZSx0aGlzLl9fcmVuZGVyR3JvdXAmJihhLl9fcmVuZGVyR3JvdXAmJmEuX19yZW5kZXJHcm91cC5yZW1vdmVEaXNwbGF5T2JqZWN0QW5kQ2hpbGRyZW4oYSksdGhpcy5fX3JlbmRlckdyb3VwLmFkZERpc3BsYXlPYmplY3RBbmRDaGlsZHJlbihhKSl9LHByb3RvLmFkZENoaWxkQXQ9ZnVuY3Rpb24oYSxiKXtpZighKGI+PTAmJmI8PXRoaXMuY2hpbGRyZW4ubGVuZ3RoKSl0aHJvdyBuZXcgRXJyb3IoYStcIiBUaGUgaW5kZXggXCIrYitcIiBzdXBwbGllZCBpcyBvdXQgb2YgYm91bmRzIFwiK3RoaXMuY2hpbGRyZW4ubGVuZ3RoKTtpZih2b2lkIDAhPT1hLnBhcmVudCYmYS5wYXJlbnQucmVtb3ZlQ2hpbGQoYSksYS5wYXJlbnQ9dGhpcyx0aGlzLnN0YWdlKXt2YXIgYz1hO2RvIGMuaW50ZXJhY3RpdmUmJih0aGlzLnN0YWdlLmRpcnR5PSEwKSxjLnN0YWdlPXRoaXMuc3RhZ2UsYz1jLl9pTmV4dDt3aGlsZShjKX12YXIgZCxlLGY9YS5maXJzdCxnPWEubGFzdDtpZihiPT09dGhpcy5jaGlsZHJlbi5sZW5ndGgpe2U9dGhpcy5sYXN0O2Zvcih2YXIgaD10aGlzLGk9dGhpcy5sYXN0O2g7KWgubGFzdD09PWkmJihoLmxhc3Q9YS5sYXN0KSxoPWgucGFyZW50fWVsc2UgZT0wPT09Yj90aGlzOnRoaXMuY2hpbGRyZW5bYi0xXS5sYXN0O2Q9ZS5faU5leHQsZCYmKGQuX2lQcmV2PWcsZy5faU5leHQ9ZCksZi5faVByZXY9ZSxlLl9pTmV4dD1mLHRoaXMuY2hpbGRyZW4uc3BsaWNlKGIsMCxhKSx0aGlzLl9fcmVuZGVyR3JvdXAmJihhLl9fcmVuZGVyR3JvdXAmJmEuX19yZW5kZXJHcm91cC5yZW1vdmVEaXNwbGF5T2JqZWN0QW5kQ2hpbGRyZW4oYSksdGhpcy5fX3JlbmRlckdyb3VwLmFkZERpc3BsYXlPYmplY3RBbmRDaGlsZHJlbihhKSl9LHByb3RvLnN3YXBDaGlsZHJlbj1mdW5jdGlvbihhLGIpe2lmKGEhPT1iKXt2YXIgYz10aGlzLmNoaWxkcmVuLmluZGV4T2YoYSksZD10aGlzLmNoaWxkcmVuLmluZGV4T2YoYik7aWYoMD5jfHwwPmQpdGhyb3cgbmV3IEVycm9yKFwic3dhcENoaWxkcmVuOiBCb3RoIHRoZSBzdXBwbGllZCBEaXNwbGF5T2JqZWN0cyBtdXN0IGJlIGEgY2hpbGQgb2YgdGhlIGNhbGxlci5cIik7dGhpcy5yZW1vdmVDaGlsZChhKSx0aGlzLnJlbW92ZUNoaWxkKGIpLGQ+Yz8odGhpcy5hZGRDaGlsZEF0KGIsYyksdGhpcy5hZGRDaGlsZEF0KGEsZCkpOih0aGlzLmFkZENoaWxkQXQoYSxkKSx0aGlzLmFkZENoaWxkQXQoYixjKSl9fSxwcm90by5nZXRDaGlsZEF0PWZ1bmN0aW9uKGEpe2lmKGE+PTAmJmE8dGhpcy5jaGlsZHJlbi5sZW5ndGgpcmV0dXJuIHRoaXMuY2hpbGRyZW5bYV07dGhyb3cgbmV3IEVycm9yKFwiQm90aCB0aGUgc3VwcGxpZWQgRGlzcGxheU9iamVjdHMgbXVzdCBiZSBhIGNoaWxkIG9mIHRoZSBjYWxsZXIgXCIrdGhpcyl9LHByb3RvLnJlbW92ZUNoaWxkPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuY2hpbGRyZW4uaW5kZXhPZihhKTtpZigtMT09PWIpdGhyb3cgbmV3IEVycm9yKGErXCIgVGhlIHN1cHBsaWVkIERpc3BsYXlPYmplY3QgbXVzdCBiZSBhIGNoaWxkIG9mIHRoZSBjYWxsZXIgXCIrdGhpcyk7dmFyIGM9YS5maXJzdCxkPWEubGFzdCxlPWQuX2lOZXh0LGY9Yy5faVByZXY7aWYoZSYmKGUuX2lQcmV2PWYpLGYuX2lOZXh0PWUsdGhpcy5sYXN0PT09ZClmb3IodmFyIGc9Yy5faVByZXYsaD10aGlzO2gubGFzdD09PWQmJihoLmxhc3Q9ZyxoPWgucGFyZW50KTspO2lmKGQuX2lOZXh0PW51bGwsYy5faVByZXY9bnVsbCx0aGlzLnN0YWdlKXt2YXIgaT1hO2RvIGkuaW50ZXJhY3RpdmUmJih0aGlzLnN0YWdlLmRpcnR5PSEwKSxpLnN0YWdlPW51bGwsaT1pLl9pTmV4dDt3aGlsZShpKX1hLl9fcmVuZGVyR3JvdXAmJmEuX19yZW5kZXJHcm91cC5yZW1vdmVEaXNwbGF5T2JqZWN0QW5kQ2hpbGRyZW4oYSksYS5wYXJlbnQ9dm9pZCAwLHRoaXMuY2hpbGRyZW4uc3BsaWNlKGIsMSl9LHByb3RvLnVwZGF0ZVRyYW5zZm9ybT1mdW5jdGlvbigpe2lmKHRoaXMudmlzaWJsZSl7RGlzcGxheU9iamVjdC5wcm90b3R5cGUudXBkYXRlVHJhbnNmb3JtLmNhbGwodGhpcyk7Zm9yKHZhciBhPTAsYj10aGlzLmNoaWxkcmVuLmxlbmd0aDtiPmE7YSsrKXRoaXMuY2hpbGRyZW5bYV0udXBkYXRlVHJhbnNmb3JtKCl9fSxtb2R1bGUuZXhwb3J0cz1EaXNwbGF5T2JqZWN0Q29udGFpbmVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIE1vdmllQ2xpcChhKXtTcHJpdGUuY2FsbCh0aGlzLGFbMF0pLHRoaXMudGV4dHVyZXM9YSx0aGlzLmFuaW1hdGlvblNwZWVkPTEsdGhpcy5sb29wPSEwLHRoaXMub25Db21wbGV0ZT1udWxsLHRoaXMuY3VycmVudEZyYW1lPTAsdGhpcy5wbGF5aW5nPSExfXZhciBTcHJpdGU9cmVxdWlyZShcIi4vU3ByaXRlXCIpLHByb3RvPU1vdmllQ2xpcC5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShTcHJpdGUucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6TW92aWVDbGlwfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcInRvdGFsRnJhbWVzXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnRleHR1cmVzLmxlbmd0aH19KSxwcm90by5zdG9wPWZ1bmN0aW9uKCl7dGhpcy5wbGF5aW5nPSExfSxwcm90by5wbGF5PWZ1bmN0aW9uKCl7dGhpcy5wbGF5aW5nPSEwfSxwcm90by5nb3RvQW5kU3RvcD1mdW5jdGlvbihhKXt0aGlzLnBsYXlpbmc9ITEsdGhpcy5jdXJyZW50RnJhbWU9YTt2YXIgYj10aGlzLmN1cnJlbnRGcmFtZSsuNXwwO3RoaXMuc2V0VGV4dHVyZSh0aGlzLnRleHR1cmVzW2IldGhpcy50ZXh0dXJlcy5sZW5ndGhdKX0scHJvdG8uZ290b0FuZFBsYXk9ZnVuY3Rpb24oYSl7dGhpcy5jdXJyZW50RnJhbWU9YSx0aGlzLnBsYXlpbmc9ITB9LHByb3RvLnVwZGF0ZVRyYW5zZm9ybT1mdW5jdGlvbigpe2lmKFNwcml0ZS5wcm90b3R5cGUudXBkYXRlVHJhbnNmb3JtLmNhbGwodGhpcyksdGhpcy5wbGF5aW5nKXt0aGlzLmN1cnJlbnRGcmFtZSs9dGhpcy5hbmltYXRpb25TcGVlZDt2YXIgYT10aGlzLmN1cnJlbnRGcmFtZSsuNXwwO3RoaXMubG9vcHx8YTx0aGlzLnRleHR1cmVzLmxlbmd0aD90aGlzLnNldFRleHR1cmUodGhpcy50ZXh0dXJlc1thJXRoaXMudGV4dHVyZXMubGVuZ3RoXSk6YT49dGhpcy50ZXh0dXJlcy5sZW5ndGgmJih0aGlzLmdvdG9BbmRTdG9wKHRoaXMudGV4dHVyZXMubGVuZ3RoLTEpLHRoaXMub25Db21wbGV0ZSYmdGhpcy5vbkNvbXBsZXRlKCkpfX0sbW9kdWxlLmV4cG9ydHM9TW92aWVDbGlwOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFNwcml0ZShhKXtpZihEaXNwbGF5T2JqZWN0Q29udGFpbmVyLmNhbGwodGhpcyksdGhpcy5hbmNob3I9bmV3IFBvaW50LHRoaXMudGV4dHVyZT1hLHRoaXMuYmxlbmRNb2RlPWJsZW5kTW9kZXMuTk9STUFMLHRoaXMuX3dpZHRoPTAsdGhpcy5faGVpZ2h0PTAsYS5iYXNlVGV4dHVyZS5oYXNMb2FkZWQpdGhpcy51cGRhdGVGcmFtZT0hMDtlbHNle3ZhciBiPXRoaXM7dGhpcy50ZXh0dXJlLmFkZEV2ZW50TGlzdGVuZXIoXCJ1cGRhdGVcIixmdW5jdGlvbigpe2Iub25UZXh0dXJlVXBkYXRlKCl9KX10aGlzLnJlbmRlcmFibGU9ITB9dmFyIGJsZW5kTW9kZXM9cmVxdWlyZShcIi4vYmxlbmRNb2Rlc1wiKSxEaXNwbGF5T2JqZWN0Q29udGFpbmVyPXJlcXVpcmUoXCIuL0Rpc3BsYXlPYmplY3RDb250YWluZXJcIiksUG9pbnQ9cmVxdWlyZShcIi4uL2dlb20vUG9pbnRcIiksVGV4dHVyZT1yZXF1aXJlKFwiLi4vdGV4dHVyZXMvVGV4dHVyZVwiKSxwcm90bz1TcHJpdGUucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoRGlzcGxheU9iamVjdENvbnRhaW5lci5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpTcHJpdGV9fSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwid2lkdGhcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuc2NhbGUueCp0aGlzLnRleHR1cmUuZnJhbWUud2lkdGh9LHNldDpmdW5jdGlvbihhKXt0aGlzLnNjYWxlLng9YS90aGlzLnRleHR1cmUuZnJhbWUud2lkdGgsdGhpcy5fd2lkdGg9YX19KSxPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJoZWlnaHRcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuc2NhbGUueSp0aGlzLnRleHR1cmUuZnJhbWUuaGVpZ2h0fSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5zY2FsZS55PWEvdGhpcy50ZXh0dXJlLmZyYW1lLmhlaWdodCx0aGlzLl9oZWlnaHQ9YX19KSxwcm90by5zZXRUZXh0dXJlPWZ1bmN0aW9uKGEpe3RoaXMudGV4dHVyZS5iYXNlVGV4dHVyZSE9PWEuYmFzZVRleHR1cmU/KHRoaXMudGV4dHVyZUNoYW5nZT0hMCx0aGlzLnRleHR1cmU9YSx0aGlzLl9fcmVuZGVyR3JvdXAmJnRoaXMuX19yZW5kZXJHcm91cC51cGRhdGVUZXh0dXJlKHRoaXMpKTp0aGlzLnRleHR1cmU9YSx0aGlzLnVwZGF0ZUZyYW1lPSEwfSxwcm90by5vblRleHR1cmVVcGRhdGU9ZnVuY3Rpb24oKXt0aGlzLl93aWR0aCYmKHRoaXMuc2NhbGUueD10aGlzLl93aWR0aC90aGlzLnRleHR1cmUuZnJhbWUud2lkdGgpLHRoaXMuX2hlaWdodCYmKHRoaXMuc2NhbGUueT10aGlzLl9oZWlnaHQvdGhpcy50ZXh0dXJlLmZyYW1lLmhlaWdodCksdGhpcy51cGRhdGVGcmFtZT0hMH0sU3ByaXRlLmZyb21GcmFtZT1mdW5jdGlvbihhKXt2YXIgYj1UZXh0dXJlLmNhY2hlW2FdO2lmKCFiKXRocm93IG5ldyBFcnJvcignVGhlIGZyYW1lSWQgXCInK2ErJ1wiIGRvZXMgbm90IGV4aXN0IGluIHRoZSB0ZXh0dXJlIGNhY2hlJyt0aGlzKTtyZXR1cm4gbmV3IFNwcml0ZShiKX0sU3ByaXRlLmZyb21JbWFnZT1mdW5jdGlvbihhKXt2YXIgYj1UZXh0dXJlLmZyb21JbWFnZShhKTtyZXR1cm4gbmV3IFNwcml0ZShiKX0sbW9kdWxlLmV4cG9ydHM9U3ByaXRlOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFN0YWdlKGEpe0Rpc3BsYXlPYmplY3RDb250YWluZXIuY2FsbCh0aGlzKSx0aGlzLndvcmxkVHJhbnNmb3JtPW1hdDMuY3JlYXRlKCksdGhpcy5pbnRlcmFjdGl2ZT0hMCx0aGlzLmludGVyYWN0aW9uTWFuYWdlcj1uZXcgSW50ZXJhY3Rpb25NYW5hZ2VyKHRoaXMpLHRoaXMuZGlydHk9ITAsdGhpcy5fX2NoaWxkcmVuQWRkZWQ9W10sdGhpcy5fX2NoaWxkcmVuUmVtb3ZlZD1bXSx0aGlzLnN0YWdlPXRoaXMsdGhpcy5zdGFnZS5oaXRBcmVhPW5ldyBSZWN0YW5nbGUoMCwwLDFlNSwxZTUpLHRoaXMuc2V0QmFja2dyb3VuZENvbG9yKGEpLHRoaXMud29ybGRWaXNpYmxlPSEwfXZhciBnbG9iYWxzPXJlcXVpcmUoXCIuLi9jb3JlL2dsb2JhbHNcIiksbWF0Mz1yZXF1aXJlKFwiLi4vZ2VvbS9tYXRyaXhcIikubWF0MyxoZXgycmdiPXJlcXVpcmUoXCIuLi91dGlscy9jb2xvclwiKS5oZXgycmdiLERpc3BsYXlPYmplY3RDb250YWluZXI9cmVxdWlyZShcIi4vRGlzcGxheU9iamVjdENvbnRhaW5lclwiKSxJbnRlcmFjdGlvbk1hbmFnZXI9cmVxdWlyZShcIi4uL0ludGVyYWN0aW9uTWFuYWdlclwiKSxSZWN0YW5nbGU9cmVxdWlyZShcIi4uL2dlb20vUmVjdGFuZ2xlXCIpLHByb3RvPVN0YWdlLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKERpc3BsYXlPYmplY3RDb250YWluZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6U3RhZ2V9fSk7cHJvdG8uc2V0SW50ZXJhY3Rpb25EZWxlZ2F0ZT1mdW5jdGlvbihhKXt0aGlzLmludGVyYWN0aW9uTWFuYWdlci5zZXRUYXJnZXREb21FbGVtZW50KGEpfSxwcm90by51cGRhdGVUcmFuc2Zvcm09ZnVuY3Rpb24oKXt0aGlzLndvcmxkQWxwaGE9MSx0aGlzLnZjb3VudD1nbG9iYWxzLnZpc2libGVDb3VudDtmb3IodmFyIGE9MCxiPXRoaXMuY2hpbGRyZW4ubGVuZ3RoO2I+YTthKyspdGhpcy5jaGlsZHJlblthXS51cGRhdGVUcmFuc2Zvcm0oKTt0aGlzLmRpcnR5JiYodGhpcy5kaXJ0eT0hMSx0aGlzLmludGVyYWN0aW9uTWFuYWdlci5kaXJ0eT0hMCksdGhpcy5pbnRlcmFjdGl2ZSYmdGhpcy5pbnRlcmFjdGlvbk1hbmFnZXIudXBkYXRlKCl9LHByb3RvLnNldEJhY2tncm91bmRDb2xvcj1mdW5jdGlvbihhKXt0aGlzLmJhY2tncm91bmRDb2xvcj1hfHwwLHRoaXMuYmFja2dyb3VuZENvbG9yU3BsaXQ9aGV4MnJnYih0aGlzLmJhY2tncm91bmRDb2xvcik7dmFyIGI9dGhpcy5iYWNrZ3JvdW5kQ29sb3IudG9TdHJpbmcoMTYpO2I9XCIwMDAwMDBcIi5zdWJzdHIoMCw2LWIubGVuZ3RoKStiLHRoaXMuYmFja2dyb3VuZENvbG9yU3RyaW5nPVwiI1wiK2J9LHByb3RvLmdldE1vdXNlUG9zaXRpb249ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5pbnRlcmFjdGlvbk1hbmFnZXIubW91c2UuZ2xvYmFsfSxtb2R1bGUuZXhwb3J0cz1TdGFnZTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjttb2R1bGUuZXhwb3J0cz17Tk9STUFMOjAsU0NSRUVOOjF9OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEV2ZW50VGFyZ2V0KCl7dmFyIGE9e307dGhpcy5hZGRFdmVudExpc3RlbmVyPXRoaXMub249ZnVuY3Rpb24oYixjKXt2b2lkIDA9PT1hW2JdJiYoYVtiXT1bXSksLTE9PT1hW2JdLmluZGV4T2YoYykmJmFbYl0ucHVzaChjKX0sdGhpcy5kaXNwYXRjaEV2ZW50PXRoaXMuZW1pdD1mdW5jdGlvbihiKXtpZihhW2IudHlwZV0mJmFbYi50eXBlXS5sZW5ndGgpZm9yKHZhciBjPTAsZD1hW2IudHlwZV0ubGVuZ3RoO2Q+YztjKyspYVtiLnR5cGVdW2NdKGIpfSx0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXI9dGhpcy5vZmY9ZnVuY3Rpb24oYixjKXt2YXIgZD1hW2JdLmluZGV4T2YoYyk7LTEhPT1kJiZhW2JdLnNwbGljZShkLDEpfSx0aGlzLnJlbW92ZUFsbEV2ZW50TGlzdGVuZXJzPWZ1bmN0aW9uKGIpe3ZhciBjPWFbYl07YyYmKGMubGVuZ3RoPTApfX1tb2R1bGUuZXhwb3J0cz1FdmVudFRhcmdldDsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBDdXN0b21SZW5kZXJhYmxlKCl7RGlzcGxheU9iamVjdC5jYWxsKHRoaXMpLHRoaXMucmVuZGVyYWJsZT0hMH12YXIgRGlzcGxheU9iamVjdD1yZXF1aXJlKFwiLi4vZGlzcGxheS9EaXNwbGF5T2JqZWN0XCIpLHByb3RvPUN1c3RvbVJlbmRlcmFibGUucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoRGlzcGxheU9iamVjdC5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpDdXN0b21SZW5kZXJhYmxlfX0pO3Byb3RvLnJlbmRlckNhbnZhcz1mdW5jdGlvbigpe30scHJvdG8uaW5pdFdlYkdMPWZ1bmN0aW9uKCl7fSxwcm90by5yZW5kZXJXZWJHTD1mdW5jdGlvbigpe30sbW9kdWxlLmV4cG9ydHM9Q3VzdG9tUmVuZGVyYWJsZTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBSb3BlKGEsYil7U3RyaXAuY2FsbCh0aGlzLGEpLHRoaXMucG9pbnRzPWI7dHJ5e3RoaXMudmVydGljaWVzPW5ldyBGbG9hdDMyQXJyYXkoNCpiLmxlbmd0aCksdGhpcy51dnM9bmV3IEZsb2F0MzJBcnJheSg0KmIubGVuZ3RoKSx0aGlzLmNvbG9ycz1uZXcgRmxvYXQzMkFycmF5KDIqYi5sZW5ndGgpLHRoaXMuaW5kaWNlcz1uZXcgVWludDE2QXJyYXkoMipiLmxlbmd0aCl9Y2F0Y2goYyl7dGhpcy52ZXJ0aWNpZXM9bmV3IEFycmF5KDQqYi5sZW5ndGgpLHRoaXMudXZzPW5ldyBBcnJheSg0KmIubGVuZ3RoKSx0aGlzLmNvbG9ycz1uZXcgQXJyYXkoMipiLmxlbmd0aCksdGhpcy5pbmRpY2VzPW5ldyBBcnJheSgyKmIubGVuZ3RoKX10aGlzLnJlZnJlc2goKX12YXIgU3RyaXA9cmVxdWlyZShcIi4vU3RyaXBcIiksRGlzcGxheU9iamVjdENvbnRhaW5lcj1yZXF1aXJlKFwiLi4vZGlzcGxheS9EaXNwbGF5T2JqZWN0Q29udGFpbmVyXCIpLHByb3RvPVJvcGUucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoU3RyaXAucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6Um9wZX19KTtwcm90by5yZWZyZXNoPWZ1bmN0aW9uKCl7dmFyIGE9dGhpcy5wb2ludHM7aWYoIShhLmxlbmd0aDwxKSl7dmFyIGI9dGhpcy51dnMsYz1hWzBdLGQ9dGhpcy5pbmRpY2VzLGU9dGhpcy5jb2xvcnM7dGhpcy5jb3VudC09LjIsYlswXT0wLGJbMV09MSxiWzJdPTAsYlszXT0xLGVbMF09MSxlWzFdPTEsZFswXT0wLGRbMV09MTtmb3IodmFyIGYsZyxoLGk9YS5sZW5ndGgsaj0xO2k+ajtqKyspZj1hW2pdLGc9NCpqLGg9ai8oaS0xKSxqJTI/KGJbZ109aCxiW2crMV09MCxiW2crMl09aCxiW2crM109MSk6KGJbZ109aCxiW2crMV09MCxiW2crMl09aCxiW2crM109MSksZz0yKmosZVtnXT0xLGVbZysxXT0xLGc9MipqLGRbZ109ZyxkW2crMV09ZysxLGM9Zn19LHByb3RvLnVwZGF0ZVRyYW5zZm9ybT1mdW5jdGlvbigpe3ZhciBhPXRoaXMucG9pbnRzO2lmKCEoYS5sZW5ndGg8MSkpe3ZhciBiLGM9YVswXSxkPXt4OjAseTowfTt0aGlzLmNvdW50LT0uMjt2YXIgZT10aGlzLnZlcnRpY2llcztlWzBdPWMueCtkLngsZVsxXT1jLnkrZC55LGVbMl09Yy54LWQueCxlWzNdPWMueS1kLnk7Zm9yKHZhciBmLGcsaCxpLGosaz1hLmxlbmd0aCxsPTE7az5sO2wrKylmPWFbbF0sZz00KmwsYj1sPGEubGVuZ3RoLTE/YVtsKzFdOmYsZC55PS0oYi54LWMueCksZC54PWIueS1jLnksaD0xMCooMS1sLyhrLTEpKSxoPjEmJihoPTEpLGk9TWF0aC5zcXJ0KGQueCpkLngrZC55KmQueSksaj10aGlzLnRleHR1cmUuaGVpZ2h0LzIsZC54Lz1pLGQueS89aSxkLngqPWosZC55Kj1qLGVbZ109Zi54K2QueCxlW2crMV09Zi55K2QueSxlW2crMl09Zi54LWQueCxlW2crM109Zi55LWQueSxjPWY7RGlzcGxheU9iamVjdENvbnRhaW5lci5wcm90b3R5cGUudXBkYXRlVHJhbnNmb3JtLmNhbGwodGhpcyl9fSxwcm90by5zZXRUZXh0dXJlPWZ1bmN0aW9uKGEpe3RoaXMudGV4dHVyZT1hLHRoaXMudXBkYXRlRnJhbWU9ITB9LG1vZHVsZS5leHBvcnRzPVJvcGU7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gU3BpbmUoYSl7aWYoRGlzcGxheU9iamVjdENvbnRhaW5lci5jYWxsKHRoaXMpLHRoaXMuc3BpbmVEYXRhPVNwaW5lLmFuaW1DYWNoZVthXSwhdGhpcy5zcGluZURhdGEpdGhyb3cgbmV3IEVycm9yKFwiU3BpbmUgZGF0YSBtdXN0IGJlIHByZWxvYWRlZCB1c2luZyBTcGluZUxvYWRlciBvciBBc3NldExvYWRlcjogXCIrYSk7dGhpcy5za2VsZXRvbj1uZXcgc3BpbmUuU2tlbGV0b24odGhpcy5zcGluZURhdGEpLHRoaXMuc2tlbGV0b24udXBkYXRlV29ybGRUcmFuc2Zvcm0oKSx0aGlzLnN0YXRlRGF0YT1uZXcgc3BpbmUuQW5pbWF0aW9uU3RhdGVEYXRhKHRoaXMuc3BpbmVEYXRhKSx0aGlzLnN0YXRlPW5ldyBzcGluZS5BbmltYXRpb25TdGF0ZSh0aGlzLnN0YXRlRGF0YSksdGhpcy5zbG90Q29udGFpbmVycz1bXTtmb3IodmFyIGI9MCxjPXRoaXMuc2tlbGV0b24uZHJhd09yZGVyLmxlbmd0aDtjPmI7YisrKXt2YXIgZD10aGlzLnNrZWxldG9uLmRyYXdPcmRlcltiXSxlPWQuYXR0YWNobWVudCxmPW5ldyBEaXNwbGF5T2JqZWN0Q29udGFpbmVyO2lmKHRoaXMuc2xvdENvbnRhaW5lcnMucHVzaChmKSx0aGlzLmFkZENoaWxkKGYpLGUgaW5zdGFuY2VvZiBzcGluZS5SZWdpb25BdHRhY2htZW50KXt2YXIgZz1lLnJlbmRlcmVyT2JqZWN0Lm5hbWUsaD10aGlzLmNyZWF0ZVNwcml0ZShkLGUucmVuZGVyZXJPYmplY3QpO2QuY3VycmVudFNwcml0ZT1oLGQuY3VycmVudFNwcml0ZU5hbWU9ZyxmLmFkZENoaWxkKGgpfX19dmFyIHNwaW5lPXJlcXVpcmUoXCIuLi91dGlscy9zcGluZVwiKSxEaXNwbGF5T2JqZWN0Q29udGFpbmVyPXJlcXVpcmUoXCIuLi9kaXNwbGF5L0Rpc3BsYXlPYmplY3RDb250YWluZXJcIiksU3ByaXRlPXJlcXVpcmUoXCIuLi9kaXNwbGF5L1Nwcml0ZVwiKSxUZXh0dXJlPXJlcXVpcmUoXCIuLi90ZXh0dXJlcy9UZXh0dXJlXCIpLHByb3RvPVNwaW5lLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKERpc3BsYXlPYmplY3RDb250YWluZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6U3BpbmV9fSk7cHJvdG8udXBkYXRlVHJhbnNmb3JtPWZ1bmN0aW9uKCl7dGhpcy5sYXN0VGltZT10aGlzLmxhc3RUaW1lfHxEYXRlLm5vdygpO3ZhciBhPS4wMDEqKERhdGUubm93KCktdGhpcy5sYXN0VGltZSk7dGhpcy5sYXN0VGltZT1EYXRlLm5vdygpLHRoaXMuc3RhdGUudXBkYXRlKGEpLHRoaXMuc3RhdGUuYXBwbHkodGhpcy5za2VsZXRvbiksdGhpcy5za2VsZXRvbi51cGRhdGVXb3JsZFRyYW5zZm9ybSgpO2Zvcih2YXIgYj10aGlzLnNrZWxldG9uLmRyYXdPcmRlcixjPTAsZD1iLmxlbmd0aDtkPmM7YysrKXt2YXIgZT1iW2NdLGY9ZS5hdHRhY2htZW50LGc9dGhpcy5zbG90Q29udGFpbmVyc1tjXTtpZihmIGluc3RhbmNlb2Ygc3BpbmUuUmVnaW9uQXR0YWNobWVudCl7aWYoZi5yZW5kZXJlck9iamVjdCYmKCFlLmN1cnJlbnRTcHJpdGVOYW1lfHxlLmN1cnJlbnRTcHJpdGVOYW1lIT09Zi5uYW1lKSl7dmFyIGg9Zi5yZW5kZXJlck9iamVjdC5uYW1lO2lmKHZvaWQgMCE9PWUuY3VycmVudFNwcml0ZSYmKGUuY3VycmVudFNwcml0ZS52aXNpYmxlPSExKSxlLnNwcml0ZXM9ZS5zcHJpdGVzfHx7fSx2b2lkIDAhPT1lLnNwcml0ZXNbaF0pZS5zcHJpdGVzW2hdLnZpc2libGU9ITA7ZWxzZXt2YXIgaT10aGlzLmNyZWF0ZVNwcml0ZShlLGYucmVuZGVyZXJPYmplY3QpO2cuYWRkQ2hpbGQoaSl9ZS5jdXJyZW50U3ByaXRlPWUuc3ByaXRlc1toXSxlLmN1cnJlbnRTcHJpdGVOYW1lPWh9Zy52aXNpYmxlPSEwO3ZhciBqPWUuYm9uZTtnLnBvc2l0aW9uLng9ai53b3JsZFgrZi54KmoubTAwK2YueSpqLm0wMSxnLnBvc2l0aW9uLnk9ai53b3JsZFkrZi54KmoubTEwK2YueSpqLm0xMSxnLnNjYWxlLng9ai53b3JsZFNjYWxlWCxnLnNjYWxlLnk9ai53b3JsZFNjYWxlWSxnLnJvdGF0aW9uPS0oZS5ib25lLndvcmxkUm90YXRpb24qTWF0aC5QSS8xODApfWVsc2UgZy52aXNpYmxlPSExfURpc3BsYXlPYmplY3RDb250YWluZXIucHJvdG90eXBlLnVwZGF0ZVRyYW5zZm9ybS5jYWxsKHRoaXMpfSxwcm90by5jcmVhdGVTcHJpdGU9ZnVuY3Rpb24oYSxiKXt2YXIgYz1UZXh0dXJlLmNhY2hlW2IubmFtZV0/Yi5uYW1lOmIubmFtZStcIi5wbmdcIixkPW5ldyBTcHJpdGUoVGV4dHVyZS5mcm9tRnJhbWUoYykpO3JldHVybiBkLnNjYWxlPWIuc2NhbGUsZC5yb3RhdGlvbj1iLnJvdGF0aW9uLGQuYW5jaG9yLng9ZC5hbmNob3IueT0uNSxhLnNwcml0ZXM9YS5zcHJpdGVzfHx7fSxhLnNwcml0ZXNbYi5uYW1lXT1kLGR9LFNwaW5lLmFuaW1DYWNoZT17fSxtb2R1bGUuZXhwb3J0cz1TcGluZTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBTdHJpcChhLGIsYyl7RGlzcGxheU9iamVjdENvbnRhaW5lci5jYWxsKHRoaXMpLHRoaXMudGV4dHVyZT1hLHRoaXMuYmxlbmRNb2RlPWJsZW5kTW9kZXMuTk9STUFMO3RyeXt0aGlzLnV2cz1uZXcgRmxvYXQzMkFycmF5KFswLDEsMSwxLDEsMCwwLDFdKSx0aGlzLnZlcnRpY2llcz1uZXcgRmxvYXQzMkFycmF5KFswLDAsMCwwLDAsMCwwLDAsMF0pLHRoaXMuY29sb3JzPW5ldyBGbG9hdDMyQXJyYXkoWzEsMSwxLDFdKSx0aGlzLmluZGljZXM9bmV3IFVpbnQxNkFycmF5KFswLDEsMiwzXSl9Y2F0Y2goZCl7dGhpcy51dnM9WzAsMSwxLDEsMSwwLDAsMV0sdGhpcy52ZXJ0aWNpZXM9WzAsMCwwLDAsMCwwLDAsMCwwXSx0aGlzLmNvbG9ycz1bMSwxLDEsMV0sdGhpcy5pbmRpY2VzPVswLDEsMiwzXX1pZih0aGlzLndpZHRoPWIsdGhpcy5oZWlnaHQ9YyxhLmJhc2VUZXh0dXJlLmhhc0xvYWRlZCl0aGlzLndpZHRoPXRoaXMudGV4dHVyZS5mcmFtZS53aWR0aCx0aGlzLmhlaWdodD10aGlzLnRleHR1cmUuZnJhbWUuaGVpZ2h0LHRoaXMudXBkYXRlRnJhbWU9ITA7ZWxzZXt2YXIgZT10aGlzO3RoaXMudGV4dHVyZS5hZGRFdmVudExpc3RlbmVyKFwidXBkYXRlXCIsZnVuY3Rpb24oKXtlLm9uVGV4dHVyZVVwZGF0ZSgpfSl9dGhpcy5yZW5kZXJhYmxlPSEwfXZhciBibGVuZE1vZGVzPXJlcXVpcmUoXCIuLi9kaXNwbGF5L2JsZW5kTW9kZXNcIiksRGlzcGxheU9iamVjdENvbnRhaW5lcj1yZXF1aXJlKFwiLi4vZGlzcGxheS9EaXNwbGF5T2JqZWN0Q29udGFpbmVyXCIpLHByb3RvPVN0cmlwLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKERpc3BsYXlPYmplY3RDb250YWluZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6U3RyaXB9fSk7cHJvdG8uc2V0VGV4dHVyZT1mdW5jdGlvbihhKXt0aGlzLnRleHR1cmU9YSx0aGlzLndpZHRoPWEuZnJhbWUud2lkdGgsdGhpcy5oZWlnaHQ9YS5mcmFtZS5oZWlnaHQsdGhpcy51cGRhdGVGcmFtZT0hMH0scHJvdG8ub25UZXh0dXJlVXBkYXRlPWZ1bmN0aW9uKCl7dGhpcy51cGRhdGVGcmFtZT0hMH0sbW9kdWxlLmV4cG9ydHM9U3RyaXA7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gVGlsaW5nU3ByaXRlKGEsYixjKXtEaXNwbGF5T2JqZWN0Q29udGFpbmVyLmNhbGwodGhpcyksdGhpcy50ZXh0dXJlPWEsdGhpcy53aWR0aD1iLHRoaXMuaGVpZ2h0PWMsdGhpcy50aWxlU2NhbGU9bmV3IFBvaW50KDEsMSksdGhpcy50aWxlUG9zaXRpb249bmV3IFBvaW50KDAsMCksdGhpcy5yZW5kZXJhYmxlPSEwLHRoaXMuYmxlbmRNb2RlPWJsZW5kTW9kZXMuTk9STUFMfXZhciBibGVuZE1vZGVzPXJlcXVpcmUoXCIuLi9kaXNwbGF5L2JsZW5kTW9kZXNcIiksRGlzcGxheU9iamVjdENvbnRhaW5lcj1yZXF1aXJlKFwiLi4vZGlzcGxheS9EaXNwbGF5T2JqZWN0Q29udGFpbmVyXCIpLFBvaW50PXJlcXVpcmUoXCIuLi9nZW9tL1BvaW50XCIpLHByb3RvPVRpbGluZ1Nwcml0ZS5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShEaXNwbGF5T2JqZWN0Q29udGFpbmVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOlRpbGluZ1Nwcml0ZX19KTtwcm90by5zZXRUZXh0dXJlPWZ1bmN0aW9uKGEpe3RoaXMudGV4dHVyZT1hLHRoaXMudXBkYXRlRnJhbWU9ITB9LHByb3RvLm9uVGV4dHVyZVVwZGF0ZT1mdW5jdGlvbigpe3RoaXMudXBkYXRlRnJhbWU9ITB9LG1vZHVsZS5leHBvcnRzPVRpbGluZ1Nwcml0ZTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBBYnN0cmFjdEZpbHRlcihhLGIpe3RoaXMucGFzc2VzPVt0aGlzXSx0aGlzLmRpcnR5PSEwLHRoaXMucGFkZGluZz0wLHRoaXMudW5pZm9ybXM9Ynx8e30sdGhpcy5mcmFnbWVudFNyYz1hfHxbXX1tb2R1bGUuZXhwb3J0cz1BYnN0cmFjdEZpbHRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBCbHVyRmlsdGVyKCl7dGhpcy5ibHVyWEZpbHRlcj1uZXcgQmx1clhGaWx0ZXIsdGhpcy5ibHVyWUZpbHRlcj1uZXcgQmx1cllGaWx0ZXIsdGhpcy5wYXNzZXM9W3RoaXMuYmx1clhGaWx0ZXIsdGhpcy5ibHVyWUZpbHRlcl19dmFyIEJsdXJYRmlsdGVyPXJlcXVpcmUoXCIuL0JsdXJYRmlsdGVyXCIpLEJsdXJZRmlsdGVyPXJlcXVpcmUoXCIuL0JsdXJZRmlsdGVyXCIpLHByb3RvPUJsdXJGaWx0ZXIucHJvdG90eXBlO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImJsdXJcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuYmx1clhGaWx0ZXIuYmx1cn0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMuYmx1clhGaWx0ZXIuYmx1cj10aGlzLmJsdXJZRmlsdGVyLmJsdXI9YX19KSxPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJibHVyWFwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5ibHVyWEZpbHRlci5ibHVyfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5ibHVyWEZpbHRlci5ibHVyPWF9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiYmx1cllcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuYmx1cllGaWx0ZXIuYmx1cn0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMuYmx1cllGaWx0ZXIuYmx1cj1hfX0pLG1vZHVsZS5leHBvcnRzPUJsdXJGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQmx1clhGaWx0ZXIoKXtBYnN0cmFjdEZpbHRlci5jYWxsKHRoaXMpLHRoaXMucGFzc2VzPVt0aGlzXSx0aGlzLnVuaWZvcm1zPXtibHVyOnt0eXBlOlwiMWZcIix2YWx1ZToxLzUxMn19LHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSBmbG9hdCBibHVyO1wiLFwidW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgdmVjNCBzdW0gPSB2ZWM0KDAuMCk7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCAtIDQuMCpibHVyLCB2VGV4dHVyZUNvb3JkLnkpKSAqIDAuMDU7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCAtIDMuMCpibHVyLCB2VGV4dHVyZUNvb3JkLnkpKSAqIDAuMDk7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCAtIDIuMCpibHVyLCB2VGV4dHVyZUNvb3JkLnkpKSAqIDAuMTI7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCAtIGJsdXIsIHZUZXh0dXJlQ29vcmQueSkpICogMC4xNTtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkpKSAqIDAuMTY7XCIsXCIgICBzdW0gKz0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCArIGJsdXIsIHZUZXh0dXJlQ29vcmQueSkpICogMC4xNTtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54ICsgMi4wKmJsdXIsIHZUZXh0dXJlQ29vcmQueSkpICogMC4xMjtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54ICsgMy4wKmJsdXIsIHZUZXh0dXJlQ29vcmQueSkpICogMC4wOTtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54ICsgNC4wKmJsdXIsIHZUZXh0dXJlQ29vcmQueSkpICogMC4wNTtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IHN1bTtcIixcIn1cIl19dmFyIEFic3RyYWN0RmlsdGVyPXJlcXVpcmUoXCIuL0Fic3RyYWN0RmlsdGVyXCIpLHByb3RvPUJsdXJYRmlsdGVyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEFic3RyYWN0RmlsdGVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOkJsdXJYRmlsdGVyfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImJsdXJcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuYmx1ci52YWx1ZS8oMS83ZTMpfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5kaXJ0eT0hMCx0aGlzLnVuaWZvcm1zLmJsdXIudmFsdWU9MS83ZTMqYX19KSxtb2R1bGUuZXhwb3J0cz1CbHVyWEZpbHRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBCbHVyWUZpbHRlcigpe0Fic3RyYWN0RmlsdGVyLmNhbGwodGhpcyksdGhpcy5wYXNzZXM9W3RoaXNdLHRoaXMudW5pZm9ybXM9e2JsdXI6e3R5cGU6XCIxZlwiLHZhbHVlOjEvNTEyfX0sdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIGZsb2F0IGJsdXI7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICB2ZWM0IHN1bSA9IHZlYzQoMC4wKTtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkgLSA0LjAqYmx1cikpICogMC4wNTtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkgLSAzLjAqYmx1cikpICogMC4wOTtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkgLSAyLjAqYmx1cikpICogMC4xMjtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkgLSBibHVyKSkgKiAwLjE1O1wiLFwiICAgc3VtICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdmVjMih2VGV4dHVyZUNvb3JkLngsIHZUZXh0dXJlQ29vcmQueSkpICogMC4xNjtcIixcIiAgIHN1bSArPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkgKyBibHVyKSkgKiAwLjE1O1wiLFwiICAgc3VtICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdmVjMih2VGV4dHVyZUNvb3JkLngsIHZUZXh0dXJlQ29vcmQueSArIDIuMCpibHVyKSkgKiAwLjEyO1wiLFwiICAgc3VtICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdmVjMih2VGV4dHVyZUNvb3JkLngsIHZUZXh0dXJlQ29vcmQueSArIDMuMCpibHVyKSkgKiAwLjA5O1wiLFwiICAgc3VtICs9IHRleHR1cmUyRCh1U2FtcGxlciwgdmVjMih2VGV4dHVyZUNvb3JkLngsIHZUZXh0dXJlQ29vcmQueSArIDQuMCpibHVyKSkgKiAwLjA1O1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gc3VtO1wiLFwifVwiXX12YXIgQWJzdHJhY3RGaWx0ZXI9cmVxdWlyZShcIi4vQWJzdHJhY3RGaWx0ZXJcIikscHJvdG89Qmx1cllGaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6Qmx1cllGaWx0ZXJ9fSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiYmx1clwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy51bmlmb3Jtcy5ibHVyLnZhbHVlLygxLzdlMyl9LHNldDpmdW5jdGlvbihhKXt0aGlzLnVuaWZvcm1zLmJsdXIudmFsdWU9MS83ZTMqYX19KSxtb2R1bGUuZXhwb3J0cz1CbHVyWUZpbHRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBDb2xvck1hdHJpeEZpbHRlcigpe0Fic3RyYWN0RmlsdGVyLmNhbGwodGhpcyksdGhpcy5wYXNzZXM9W3RoaXNdLHRoaXMudW5pZm9ybXM9e21hdHJpeDp7dHlwZTpcIm1hdDRcIix2YWx1ZTpbMSwwLDAsMCwwLDEsMCwwLDAsMCwxLDAsMCwwLDAsMV19fSx0aGlzLmZyYWdtZW50U3JjPVtcInByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1wiLFwidmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XCIsXCJ2YXJ5aW5nIGZsb2F0IHZDb2xvcjtcIixcInVuaWZvcm0gZmxvYXQgaW52ZXJ0O1wiLFwidW5pZm9ybSBtYXQ0IG1hdHJpeDtcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCkgKiBtYXRyaXg7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSBnbF9GcmFnQ29sb3IgKiB2Q29sb3I7XCIsXCJ9XCJdfXZhciBBYnN0cmFjdEZpbHRlcj1yZXF1aXJlKFwiLi9BYnN0cmFjdEZpbHRlclwiKSxwcm90bz1Db2xvck1hdHJpeEZpbHRlci5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShBYnN0cmFjdEZpbHRlci5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpDb2xvck1hdHJpeEZpbHRlcn19KTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJtYXRyaXhcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMubWF0cml4LnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy51bmlmb3Jtcy5tYXRyaXgudmFsdWU9YX19KSxtb2R1bGUuZXhwb3J0cz1Db2xvck1hdHJpeEZpbHRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBDb2xvclN0ZXBGaWx0ZXIoKXtBYnN0cmFjdEZpbHRlci5jYWxsKHRoaXMpLHRoaXMucGFzc2VzPVt0aGlzXSx0aGlzLnVuaWZvcm1zPXtzdGVwOnt0eXBlOlwiMWZcIix2YWx1ZTo1fX0sdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcInVuaWZvcm0gZmxvYXQgc3RlcDtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICB2ZWM0IGNvbG9yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2VGV4dHVyZUNvb3JkKTtcIixcIiAgIGNvbG9yID0gZmxvb3IoY29sb3IgKiBzdGVwKSAvIHN0ZXA7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSBjb2xvciAqIHZDb2xvcjtcIixcIn1cIl19dmFyIEFic3RyYWN0RmlsdGVyPXJlcXVpcmUoXCIuL0Fic3RyYWN0RmlsdGVyXCIpLHByb3RvPUNvbG9yU3RlcEZpbHRlci5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShBYnN0cmFjdEZpbHRlci5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpDb2xvclN0ZXBGaWx0ZXJ9fSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwic3RlcFwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy51bmlmb3Jtcy5zdGVwLnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy51bmlmb3Jtcy5zdGVwLnZhbHVlPWF9fSksbW9kdWxlLmV4cG9ydHM9Q29sb3JTdGVwRmlsdGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIENyb3NzSGF0Y2hGaWx0ZXIoKXtBYnN0cmFjdEZpbHRlci5jYWxsKHRoaXMpLHRoaXMucGFzc2VzPVt0aGlzXSx0aGlzLnVuaWZvcm1zPXtibHVyOnt0eXBlOlwiMWZcIix2YWx1ZToxLzUxMn19LHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSBmbG9hdCBibHVyO1wiLFwidW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgIGZsb2F0IGx1bSA9IGxlbmd0aCh0ZXh0dXJlMkQodVNhbXBsZXIsIHZUZXh0dXJlQ29vcmQueHkpLnJnYik7XCIsXCIgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCgxLjAsIDEuMCwgMS4wLCAxLjApO1wiLFwiICAgIGlmIChsdW0gPCAxLjAwKSB7XCIsXCIgICAgICAgIGlmIChtb2QoZ2xfRnJhZ0Nvb3JkLnggKyBnbF9GcmFnQ29vcmQueSwgMTAuMCkgPT0gMC4wKSB7XCIsXCIgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSB2ZWM0KDAuMCwgMC4wLCAwLjAsIDEuMCk7XCIsXCIgICAgICAgIH1cIixcIiAgICB9XCIsXCIgICAgaWYgKGx1bSA8IDAuNzUpIHtcIixcIiAgICAgICAgaWYgKG1vZChnbF9GcmFnQ29vcmQueCAtIGdsX0ZyYWdDb29yZC55LCAxMC4wKSA9PSAwLjApIHtcIixcIiAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoMC4wLCAwLjAsIDAuMCwgMS4wKTtcIixcIiAgICAgICAgfVwiLFwiICAgIH1cIixcIiAgICBpZiAobHVtIDwgMC41MCkge1wiLFwiICAgICAgICBpZiAobW9kKGdsX0ZyYWdDb29yZC54ICsgZ2xfRnJhZ0Nvb3JkLnkgLSA1LjAsIDEwLjApID09IDAuMCkge1wiLFwiICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCgwLjAsIDAuMCwgMC4wLCAxLjApO1wiLFwiICAgICAgICB9XCIsXCIgICAgfVwiLFwiICAgIGlmIChsdW0gPCAwLjMpIHtcIixcIiAgICAgICAgaWYgKG1vZChnbF9GcmFnQ29vcmQueCAtIGdsX0ZyYWdDb29yZC55IC0gNS4wLCAxMC4wKSA9PSAwLjApIHtcIixcIiAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IHZlYzQoMC4wLCAwLjAsIDAuMCwgMS4wKTtcIixcIiAgICAgICAgfVwiLFwiICAgIH1cIixcIn1cIl19dmFyIEFic3RyYWN0RmlsdGVyPXJlcXVpcmUoXCIuL0Fic3RyYWN0RmlsdGVyXCIpLHByb3RvPUNyb3NzSGF0Y2hGaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6Q3Jvc3NIYXRjaEZpbHRlcn19KTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJibHVyXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLmJsdXIudmFsdWUvKDEvN2UzKX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMudW5pZm9ybXMuYmx1ci52YWx1ZT0xLzdlMyphfX0pLG1vZHVsZS5leHBvcnRzPUNyb3NzSGF0Y2hGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gRGlzcGxhY2VtZW50RmlsdGVyKGEpe0Fic3RyYWN0RmlsdGVyLmNhbGwodGhpcyksdGhpcy5wYXNzZXM9W3RoaXNdLGEuYmFzZVRleHR1cmUuX3Bvd2VyT2YyPSEwLHRoaXMudW5pZm9ybXM9e2Rpc3BsYWNlbWVudE1hcDp7dHlwZTpcInNhbXBsZXIyRFwiLHZhbHVlOmF9LHNjYWxlOnt0eXBlOlwiMmZcIix2YWx1ZTp7eDozMCx5OjMwfX0sb2Zmc2V0Ont0eXBlOlwiMmZcIix2YWx1ZTp7eDowLHk6MH19LG1hcERpbWVuc2lvbnM6e3R5cGU6XCIyZlwiLHZhbHVlOnt4OjEseTo1MTEyfX0sZGltZW5zaW9uczp7dHlwZTpcIjRmdlwiLHZhbHVlOlswLDAsMCwwXX19LGEuYmFzZVRleHR1cmUuaGFzTG9hZGVkPyh0aGlzLnVuaWZvcm1zLm1hcERpbWVuc2lvbnMudmFsdWUueD1hLndpZHRoLHRoaXMudW5pZm9ybXMubWFwRGltZW5zaW9ucy52YWx1ZS55PWEuaGVpZ2h0KToodGhpcy5ib3VuZExvYWRlZEZ1bmN0aW9uPXRoaXMub25UZXh0dXJlTG9hZGVkLmJpbmQodGhpcyksYS5iYXNlVGV4dHVyZS5vbihcImxvYWRlZFwiLHRoaXMuYm91bmRMb2FkZWRGdW5jdGlvbikpLHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSBzYW1wbGVyMkQgZGlzcGxhY2VtZW50TWFwO1wiLFwidW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XCIsXCJ1bmlmb3JtIHZlYzIgc2NhbGU7XCIsXCJ1bmlmb3JtIHZlYzIgb2Zmc2V0O1wiLFwidW5pZm9ybSB2ZWM0IGRpbWVuc2lvbnM7XCIsXCJ1bmlmb3JtIHZlYzIgbWFwRGltZW5zaW9ucztcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICB2ZWMyIG1hcENvcmRzID0gdlRleHR1cmVDb29yZC54eTtcIixcIiAgIG1hcENvcmRzICs9IChkaW1lbnNpb25zLnp3ICsgb2Zmc2V0KS8gZGltZW5zaW9ucy54eSA7XCIsXCIgICBtYXBDb3Jkcy55ICo9IC0xLjA7XCIsXCIgICBtYXBDb3Jkcy55ICs9IDEuMDtcIixcIiAgIHZlYzIgbWF0U2FtcGxlID0gdGV4dHVyZTJEKGRpc3BsYWNlbWVudE1hcCwgbWFwQ29yZHMpLnh5O1wiLFwiICAgbWF0U2FtcGxlIC09IDAuNTtcIixcIiAgIG1hdFNhbXBsZSAqPSBzY2FsZTtcIixcIiAgIG1hdFNhbXBsZSAvPSBtYXBEaW1lbnNpb25zO1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2ZWMyKHZUZXh0dXJlQ29vcmQueCArIG1hdFNhbXBsZS54LCB2VGV4dHVyZUNvb3JkLnkgKyBtYXRTYW1wbGUueSkpO1wiLFwiICAgZ2xfRnJhZ0NvbG9yLnJnYiA9IG1peCggZ2xfRnJhZ0NvbG9yLnJnYiwgZ2xfRnJhZ0NvbG9yLnJnYiwgMS4wKTtcIixcIiAgIHZlYzIgY29yZCA9IHZUZXh0dXJlQ29vcmQ7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSBnbF9GcmFnQ29sb3IgKiB2Q29sb3I7XCIsXCJ9XCJdfXZhciBBYnN0cmFjdEZpbHRlcj1yZXF1aXJlKFwiLi9BYnN0cmFjdEZpbHRlclwiKSxwcm90bz1EaXNwbGFjZW1lbnRGaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6RGlzcGxhY2VtZW50RmlsdGVyfX0pO3Byb3RvLm9uVGV4dHVyZUxvYWRlZD1mdW5jdGlvbigpe3RoaXMudW5pZm9ybXMubWFwRGltZW5zaW9ucy52YWx1ZS54PXRoaXMudW5pZm9ybXMuZGlzcGxhY2VtZW50TWFwLnZhbHVlLndpZHRoLHRoaXMudW5pZm9ybXMubWFwRGltZW5zaW9ucy52YWx1ZS55PXRoaXMudW5pZm9ybXMuZGlzcGxhY2VtZW50TWFwLnZhbHVlLmhlaWdodCx0aGlzLnVuaWZvcm1zLmRpc3BsYWNlbWVudE1hcC52YWx1ZS5iYXNlVGV4dHVyZS5vZmYoXCJsb2FkZWRcIix0aGlzLmJvdW5kTG9hZGVkRnVuY3Rpb24pfSxPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJtYXBcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuZGlzcGxhY2VtZW50TWFwLnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy51bmlmb3Jtcy5kaXNwbGFjZW1lbnRNYXAudmFsdWU9YX19KSxPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJzY2FsZVwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy51bmlmb3Jtcy5zY2FsZS52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMudW5pZm9ybXMuc2NhbGUudmFsdWU9YX19KSxPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJvZmZzZXRcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMub2Zmc2V0LnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy51bmlmb3Jtcy5vZmZzZXQudmFsdWU9YX19KSxtb2R1bGUuZXhwb3J0cz1EaXNwbGFjZW1lbnRGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gRG90U2NyZWVuRmlsdGVyKCl7QWJzdHJhY3RGaWx0ZXIuY2FsbCh0aGlzKSx0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy51bmlmb3Jtcz17c2NhbGU6e3R5cGU6XCIxZlwiLHZhbHVlOjF9LGFuZ2xlOnt0eXBlOlwiMWZcIix2YWx1ZTo1fSxkaW1lbnNpb25zOnt0eXBlOlwiNGZ2XCIsdmFsdWU6WzAsMCwwLDBdfX0sdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIHZlYzQgZGltZW5zaW9ucztcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwidW5pZm9ybSBmbG9hdCBhbmdsZTtcIixcInVuaWZvcm0gZmxvYXQgc2NhbGU7XCIsXCJmbG9hdCBwYXR0ZXJuKCkge1wiLFwiICAgZmxvYXQgcyA9IHNpbihhbmdsZSksIGMgPSBjb3MoYW5nbGUpO1wiLFwiICAgdmVjMiB0ZXggPSB2VGV4dHVyZUNvb3JkICogZGltZW5zaW9ucy54eTtcIixcIiAgIHZlYzIgcG9pbnQgPSB2ZWMyKFwiLFwiICAgICAgIGMgKiB0ZXgueCAtIHMgKiB0ZXgueSxcIixcIiAgICAgICBzICogdGV4LnggKyBjICogdGV4LnlcIixcIiAgICkgKiBzY2FsZTtcIixcIiAgIHJldHVybiAoc2luKHBvaW50LngpICogc2luKHBvaW50LnkpKSAqIDQuMDtcIixcIn1cIixcInZvaWQgbWFpbigpIHtcIixcIiAgIHZlYzQgY29sb3IgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZUZXh0dXJlQ29vcmQpO1wiLFwiICAgZmxvYXQgYXZlcmFnZSA9IChjb2xvci5yICsgY29sb3IuZyArIGNvbG9yLmIpIC8gMy4wO1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gdmVjNCh2ZWMzKGF2ZXJhZ2UgKiAxMC4wIC0gNS4wICsgcGF0dGVybigpKSwgY29sb3IuYSk7XCIsXCJ9XCJdfXZhciBBYnN0cmFjdEZpbHRlcj1yZXF1aXJlKFwiLi9BYnN0cmFjdEZpbHRlclwiKSxwcm90bz1Eb3RTY3JlZW5GaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6RG90U2NyZWVuRmlsdGVyfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcInNjYWxlXCIse2dldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLnVuaWZvcm1zLnNjYWxlLnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5kaXJ0eT0hMCx0aGlzLnVuaWZvcm1zLnNjYWxlLnZhbHVlPWF9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiYW5nbGVcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuYW5nbGUudmFsdWV9LHNldDpmdW5jdGlvbihhKXt0aGlzLmRpcnR5PSEwLHRoaXMudW5pZm9ybXMuYW5nbGUudmFsdWU9YX19KSxtb2R1bGUuZXhwb3J0cz1Eb3RTY3JlZW5GaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gRmlsdGVyQmxvY2soKXt0aGlzLnZpc2libGU9ITAsdGhpcy5yZW5kZXJhYmxlPSEwfW1vZHVsZS5leHBvcnRzPUZpbHRlckJsb2NrOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEdyYXlGaWx0ZXIoKXtBYnN0cmFjdEZpbHRlci5jYWxsKHRoaXMpLHRoaXMucGFzc2VzPVt0aGlzXSx0aGlzLnVuaWZvcm1zPXtncmF5Ont0eXBlOlwiMWZcIix2YWx1ZToxfX0sdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcInVuaWZvcm0gZmxvYXQgZ3JheTtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZUZXh0dXJlQ29vcmQpO1wiLFwiICAgZ2xfRnJhZ0NvbG9yLnJnYiA9IG1peChnbF9GcmFnQ29sb3IucmdiLCB2ZWMzKDAuMjEyNipnbF9GcmFnQ29sb3IuciArIDAuNzE1MipnbF9GcmFnQ29sb3IuZyArIDAuMDcyMipnbF9GcmFnQ29sb3IuYiksIGdyYXkpO1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gZ2xfRnJhZ0NvbG9yICogdkNvbG9yO1wiLFwifVwiXX12YXIgQWJzdHJhY3RGaWx0ZXI9cmVxdWlyZShcIi4vQWJzdHJhY3RGaWx0ZXJcIikscHJvdG89R3JheUZpbHRlci5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShBYnN0cmFjdEZpbHRlci5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpHcmF5RmlsdGVyfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImdyYXlcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuZ3JheS52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMudW5pZm9ybXMuZ3JheS52YWx1ZT1hfX0pLG1vZHVsZS5leHBvcnRzPUdyYXlGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gSW52ZXJ0RmlsdGVyKCl7QWJzdHJhY3RGaWx0ZXIuY2FsbCh0aGlzKSx0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy51bmlmb3Jtcz17aW52ZXJ0Ont0eXBlOlwiMWZcIix2YWx1ZToxfX0sdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIGZsb2F0IGludmVydDtcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCk7XCIsXCIgICBnbF9GcmFnQ29sb3IucmdiID0gbWl4KCAodmVjMygxKS1nbF9GcmFnQ29sb3IucmdiKSAqIGdsX0ZyYWdDb2xvci5hLCBnbF9GcmFnQ29sb3IucmdiLCAxLjAgLSBpbnZlcnQpO1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gZ2xfRnJhZ0NvbG9yICogdkNvbG9yO1wiLFwifVwiXX12YXIgQWJzdHJhY3RGaWx0ZXI9cmVxdWlyZShcIi4vQWJzdHJhY3RGaWx0ZXJcIikscHJvdG89SW52ZXJ0RmlsdGVyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEFic3RyYWN0RmlsdGVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOkludmVydEZpbHRlcn19KTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJpbnZlcnRcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuaW52ZXJ0LnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy51bmlmb3Jtcy5pbnZlcnQudmFsdWU9YX19KSxtb2R1bGUuZXhwb3J0cz1JbnZlcnRGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gUGl4ZWxhdGVGaWx0ZXIoKXtBYnN0cmFjdEZpbHRlci5jYWxsKHRoaXMpLHRoaXMucGFzc2VzPVt0aGlzXSx0aGlzLnVuaWZvcm1zPXtpbnZlcnQ6e3R5cGU6XCIxZlwiLHZhbHVlOjB9LGRpbWVuc2lvbnM6e3R5cGU6XCI0ZnZcIix2YWx1ZTpuZXcgRmxvYXQzMkFycmF5KFsxZTQsMTAwLDEwLDEwXSl9LHBpeGVsU2l6ZTp7dHlwZTpcIjJmXCIsdmFsdWU6e3g6MTAseToxMH19fSx0aGlzLmZyYWdtZW50U3JjPVtcInByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1wiLFwidmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XCIsXCJ2YXJ5aW5nIGZsb2F0IHZDb2xvcjtcIixcInVuaWZvcm0gdmVjMiB0ZXN0RGltO1wiLFwidW5pZm9ybSB2ZWM0IGRpbWVuc2lvbnM7XCIsXCJ1bmlmb3JtIHZlYzIgcGl4ZWxTaXplO1wiLFwidW5pZm9ybSBzYW1wbGVyMkQgdVNhbXBsZXI7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgdmVjMiBjb29yZCA9IHZUZXh0dXJlQ29vcmQ7XCIsXCIgICB2ZWMyIHNpemUgPSBkaW1lbnNpb25zLnh5L3BpeGVsU2l6ZTtcIixcIiAgIHZlYzIgY29sb3IgPSBmbG9vciggKCB2VGV4dHVyZUNvb3JkICogc2l6ZSApICkgLyBzaXplICsgcGl4ZWxTaXplL2RpbWVuc2lvbnMueHkgKiAwLjU7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIGNvbG9yKTtcIixcIn1cIl19dmFyIEFic3RyYWN0RmlsdGVyPXJlcXVpcmUoXCIuL0Fic3RyYWN0RmlsdGVyXCIpLHByb3RvPVBpeGVsYXRlRmlsdGVyLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKEFic3RyYWN0RmlsdGVyLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOlBpeGVsYXRlRmlsdGVyfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcInNpemVcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMucGl4ZWxTaXplLnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5kaXJ0eT0hMCx0aGlzLnVuaWZvcm1zLnBpeGVsU2l6ZS52YWx1ZT1hfX0pLG1vZHVsZS5leHBvcnRzPVBpeGVsYXRlRmlsdGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFJHQlNwbGl0RmlsdGVyKCl7QWJzdHJhY3RGaWx0ZXIuY2FsbCh0aGlzKSx0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy51bmlmb3Jtcz17cmVkOnt0eXBlOlwiMmZcIix2YWx1ZTp7eDoyMCx5OjIwfX0sZ3JlZW46e3R5cGU6XCIyZlwiLHZhbHVlOnt4Oi0yMCx5OjIwfX0sYmx1ZTp7dHlwZTpcIjJmXCIsdmFsdWU6e3g6MjAseTotMjB9fSxkaW1lbnNpb25zOnt0eXBlOlwiNGZ2XCIsdmFsdWU6WzAsMCwwLDBdfX0sdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIHZlYzIgcmVkO1wiLFwidW5pZm9ybSB2ZWMyIGdyZWVuO1wiLFwidW5pZm9ybSB2ZWMyIGJsdWU7XCIsXCJ1bmlmb3JtIHZlYzQgZGltZW5zaW9ucztcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgIGdsX0ZyYWdDb2xvci5yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2VGV4dHVyZUNvb3JkICsgcmVkL2RpbWVuc2lvbnMueHkpLnI7XCIsXCIgICBnbF9GcmFnQ29sb3IuZyA9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCArIGdyZWVuL2RpbWVuc2lvbnMueHkpLmc7XCIsXCIgICBnbF9GcmFnQ29sb3IuYiA9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCArIGJsdWUvZGltZW5zaW9ucy54eSkuYjtcIixcIiAgIGdsX0ZyYWdDb2xvci5hID0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2VGV4dHVyZUNvb3JkKS5hO1wiLFwifVwiXX12YXIgQWJzdHJhY3RGaWx0ZXI9cmVxdWlyZShcIi4vQWJzdHJhY3RGaWx0ZXJcIikscHJvdG89UkdCU3BsaXRGaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6UkdCU3BsaXRGaWx0ZXJ9fSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiYW5nbGVcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuYmx1ci52YWx1ZS8oMS83ZTMpfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy51bmlmb3Jtcy5ibHVyLnZhbHVlPTEvN2UzKmF9fSksbW9kdWxlLmV4cG9ydHM9UkdCU3BsaXRGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gU2VwaWFGaWx0ZXIoKXtBYnN0cmFjdEZpbHRlci5jYWxsKHRoaXMpLHRoaXMucGFzc2VzPVt0aGlzXSx0aGlzLnVuaWZvcm1zPXtzZXBpYTp7dHlwZTpcIjFmXCIsdmFsdWU6MX19LHRoaXMuZnJhZ21lbnRTcmM9W1wicHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7XCIsXCJ2YXJ5aW5nIHZlYzIgdlRleHR1cmVDb29yZDtcIixcInZhcnlpbmcgZmxvYXQgdkNvbG9yO1wiLFwidW5pZm9ybSBmbG9hdCBzZXBpYTtcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwiY29uc3QgbWF0MyBzZXBpYU1hdHJpeCA9IG1hdDMoMC4zNTg4LCAwLjcwNDQsIDAuMTM2OCwgMC4yOTkwLCAwLjU4NzAsIDAuMTE0MCwgMC4yMzkyLCAwLjQ2OTYsIDAuMDkxMik7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2VGV4dHVyZUNvb3JkKTtcIixcIiAgIGdsX0ZyYWdDb2xvci5yZ2IgPSBtaXgoIGdsX0ZyYWdDb2xvci5yZ2IsIGdsX0ZyYWdDb2xvci5yZ2IgKiBzZXBpYU1hdHJpeCwgc2VwaWEpO1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gZ2xfRnJhZ0NvbG9yICogdkNvbG9yO1wiLFwifVwiXX12YXIgQWJzdHJhY3RGaWx0ZXI9cmVxdWlyZShcIi4vQWJzdHJhY3RGaWx0ZXJcIikscHJvdG89U2VwaWFGaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6U2VwaWFGaWx0ZXJ9fSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwic2VwaWFcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuc2VwaWEudmFsdWV9LHNldDpmdW5jdGlvbihhKXt0aGlzLnVuaWZvcm1zLnNlcGlhLnZhbHVlPWF9fSksbW9kdWxlLmV4cG9ydHM9U2VwaWFGaWx0ZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gU21hcnRCbHVyRmlsdGVyKCl7QWJzdHJhY3RGaWx0ZXIuY2FsbCh0aGlzKSx0aGlzLnBhc3Nlcz1bdGhpc10sdGhpcy51bmlmb3Jtcz17Ymx1cjp7dHlwZTpcIjFmXCIsdmFsdWU6MS81MTJ9fSx0aGlzLmZyYWdtZW50U3JjPVtcInByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1wiLFwidmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcImNvbnN0IHZlYzIgZGVsdGEgPSB2ZWMyKDEuMC8xMC4wLCAwLjApO1wiLFwiZmxvYXQgcmFuZG9tKHZlYzMgc2NhbGUsIGZsb2F0IHNlZWQpIHtcIixcIiAgIHJldHVybiBmcmFjdChzaW4oZG90KGdsX0ZyYWdDb29yZC54eXogKyBzZWVkLCBzY2FsZSkpICogNDM3NTguNTQ1MyArIHNlZWQpO1wiLFwifVwiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgIHZlYzQgY29sb3IgPSB2ZWM0KDAuMCk7XCIsXCIgICBmbG9hdCB0b3RhbCA9IDAuMDtcIixcIiAgIGZsb2F0IG9mZnNldCA9IHJhbmRvbSh2ZWMzKDEyLjk4OTgsIDc4LjIzMywgMTUxLjcxODIpLCAwLjApO1wiLFwiICAgZm9yIChmbG9hdCB0ID0gLTMwLjA7IHQgPD0gMzAuMDsgdCsrKSB7XCIsXCIgICAgICAgZmxvYXQgcGVyY2VudCA9ICh0ICsgb2Zmc2V0IC0gMC41KSAvIDMwLjA7XCIsXCIgICAgICAgZmxvYXQgd2VpZ2h0ID0gMS4wIC0gYWJzKHBlcmNlbnQpO1wiLFwiICAgICAgIHZlYzQgc2FtcGxlID0gdGV4dHVyZTJEKHVTYW1wbGVyLCB2VGV4dHVyZUNvb3JkICsgZGVsdGEgKiBwZXJjZW50KTtcIixcIiAgICAgICBzYW1wbGUucmdiICo9IHNhbXBsZS5hO1wiLFwiICAgICAgIGNvbG9yICs9IHNhbXBsZSAqIHdlaWdodDtcIixcIiAgICAgICB0b3RhbCArPSB3ZWlnaHQ7XCIsXCIgICB9XCIsXCIgICBnbF9GcmFnQ29sb3IgPSBjb2xvciAvIHRvdGFsO1wiLFwiICAgZ2xfRnJhZ0NvbG9yLnJnYiAvPSBnbF9GcmFnQ29sb3IuYSArIDAuMDAwMDE7XCIsXCJ9XCJdfXZhciBBYnN0cmFjdEZpbHRlcj1yZXF1aXJlKFwiLi9BYnN0cmFjdEZpbHRlclwiKSxwcm90bz1TbWFydEJsdXJGaWx0ZXIucHJvdG90eXBlPU9iamVjdC5jcmVhdGUoQWJzdHJhY3RGaWx0ZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6U21hcnRCbHVyRmlsdGVyfX0pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcImJsdXJcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuYmx1ci52YWx1ZX0sc2V0OmZ1bmN0aW9uKGEpe3RoaXMudW5pZm9ybXMuYmx1ci52YWx1ZT1hfX0pLG1vZHVsZS5leHBvcnRzPVNtYXJ0Qmx1ckZpbHRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBUd2lzdEZpbHRlcigpe0Fic3RyYWN0RmlsdGVyLmNhbGwodGhpcyksdGhpcy5wYXNzZXM9W3RoaXNdLHRoaXMudW5pZm9ybXM9e3JhZGl1czp7dHlwZTpcIjFmXCIsdmFsdWU6LjV9LGFuZ2xlOnt0eXBlOlwiMWZcIix2YWx1ZTo1fSxvZmZzZXQ6e3R5cGU6XCIyZlwiLHZhbHVlOnt4Oi41LHk6LjV9fX0sdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ1bmlmb3JtIHZlYzQgZGltZW5zaW9ucztcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwidW5pZm9ybSBmbG9hdCByYWRpdXM7XCIsXCJ1bmlmb3JtIGZsb2F0IGFuZ2xlO1wiLFwidW5pZm9ybSB2ZWMyIG9mZnNldDtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICB2ZWMyIGNvb3JkID0gdlRleHR1cmVDb29yZCAtIG9mZnNldDtcIixcIiAgIGZsb2F0IGRpc3RhbmNlID0gbGVuZ3RoKGNvb3JkKTtcIixcIiAgIGlmIChkaXN0YW5jZSA8IHJhZGl1cykge1wiLFwiICAgICAgIGZsb2F0IHJhdGlvID0gKHJhZGl1cyAtIGRpc3RhbmNlKSAvIHJhZGl1cztcIixcIiAgICAgICBmbG9hdCBhbmdsZU1vZCA9IHJhdGlvICogcmF0aW8gKiBhbmdsZTtcIixcIiAgICAgICBmbG9hdCBzID0gc2luKGFuZ2xlTW9kKTtcIixcIiAgICAgICBmbG9hdCBjID0gY29zKGFuZ2xlTW9kKTtcIixcIiAgICAgICBjb29yZCA9IHZlYzIoY29vcmQueCAqIGMgLSBjb29yZC55ICogcywgY29vcmQueCAqIHMgKyBjb29yZC55ICogYyk7XCIsXCIgICB9XCIsXCIgICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIGNvb3JkK29mZnNldCk7XCIsXCJ9XCJdfXZhciBBYnN0cmFjdEZpbHRlcj1yZXF1aXJlKFwiLi9BYnN0cmFjdEZpbHRlclwiKSxwcm90bz1Ud2lzdEZpbHRlci5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShBYnN0cmFjdEZpbHRlci5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpUd2lzdEZpbHRlcn19KTtPYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG8sXCJvZmZzZXRcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMub2Zmc2V0LnZhbHVlfSxzZXQ6ZnVuY3Rpb24oYSl7dGhpcy5kaXJ0eT0hMCx0aGlzLnVuaWZvcm1zLm9mZnNldC52YWx1ZT1hfX0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eShwcm90byxcInJhZGl1c1wiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy51bmlmb3Jtcy5yYWRpdXMudmFsdWV9LHNldDpmdW5jdGlvbihhKXt0aGlzLmRpcnR5PSEwLHRoaXMudW5pZm9ybXMucmFkaXVzLnZhbHVlPWF9fSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvLFwiYW5nbGVcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMudW5pZm9ybXMuYW5nbGUudmFsdWV9LHNldDpmdW5jdGlvbihhKXt0aGlzLmRpcnR5PSEwLHRoaXMudW5pZm9ybXMuYW5nbGUudmFsdWU9YX19KSxtb2R1bGUuZXhwb3J0cz1Ud2lzdEZpbHRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBDaXJjbGUoYSxiLGMpe3RoaXMueD1hfHwwLHRoaXMueT1ifHwwLHRoaXMucmFkaXVzPWN8fDB9dmFyIHByb3RvPUNpcmNsZS5wcm90b3R5cGU7cHJvdG8uY2xvbmU9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IENpcmNsZSh0aGlzLngsdGhpcy55LHRoaXMucmFkaXVzKX0scHJvdG8uY29udGFpbnM9ZnVuY3Rpb24oYSxiKXtpZih0aGlzLnJhZGl1czw9MClyZXR1cm4hMTt2YXIgYz10aGlzLngtYSxkPXRoaXMueS1iLGU9dGhpcy5yYWRpdXMqdGhpcy5yYWRpdXM7cmV0dXJuIGMqPWMsZCo9ZCxlPj1jK2R9LG1vZHVsZS5leHBvcnRzPUNpcmNsZTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBFbGxpcHNlKGEsYixjLGQpe3RoaXMueD1hfHwwLHRoaXMueT1ifHwwLHRoaXMud2lkdGg9Y3x8MCx0aGlzLmhlaWdodD1kfHwwfXZhciBSZWN0YW5nbGU9cmVxdWlyZShcIi4vUmVjdGFuZ2xlXCIpLHByb3RvPUVsbGlwc2UucHJvdG90eXBlO3Byb3RvLmNsb25lPWZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBFbGxpcHNlKHRoaXMueCx0aGlzLnksdGhpcy53aWR0aCx0aGlzLmhlaWdodCl9LHByb3RvLmNvbnRhaW5zPWZ1bmN0aW9uKGEsYil7aWYodGhpcy53aWR0aDw9MHx8dGhpcy5oZWlnaHQ8PTApcmV0dXJuITE7dmFyIGM9KGEtdGhpcy54KS90aGlzLndpZHRoLS41LGQ9KGItdGhpcy55KS90aGlzLmhlaWdodC0uNTtyZXR1cm4gYyo9YyxkKj1kLC4yNT5jK2R9LHByb3RvLmdldEJvdW5kcz1mdW5jdGlvbigpe3JldHVybiBuZXcgUmVjdGFuZ2xlKHRoaXMueCx0aGlzLnksdGhpcy53aWR0aCx0aGlzLmhlaWdodCl9LG1vZHVsZS5leHBvcnRzPUVsbGlwc2U7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gUG9pbnQoYSxiKXt0aGlzLng9YXx8MCx0aGlzLnk9Ynx8MH1Qb2ludC5wcm90b3R5cGUuY2xvbmU9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IFBvaW50KHRoaXMueCx0aGlzLnkpfSxtb2R1bGUuZXhwb3J0cz1Qb2ludDsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBQb2x5Z29uKGEpe2lmKGEgaW5zdGFuY2VvZiBBcnJheXx8KGE9QXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSksXCJudW1iZXJcIj09dHlwZW9mIGFbMF0pe2Zvcih2YXIgYj1bXSxjPTAsZD1hLmxlbmd0aDtkPmM7Yys9MiliLnB1c2gobmV3IFBvaW50KGFbY10sYVtjKzFdKSk7YT1ifXRoaXMucG9pbnRzPWF9dmFyIFBvaW50PXJlcXVpcmUoXCIuL1BvaW50XCIpLHByb3RvPVBvbHlnb24ucHJvdG90eXBlO3Byb3RvLmNsb25lPWZ1bmN0aW9uKCl7Zm9yKHZhciBhPVtdLGI9MDtiPHRoaXMucG9pbnRzLmxlbmd0aDtiKyspYS5wdXNoKHRoaXMucG9pbnRzW2JdLmNsb25lKCkpO3JldHVybiBuZXcgUG9seWdvbihhKX0scHJvdG8uY29udGFpbnM9ZnVuY3Rpb24oYSxiKXtmb3IodmFyIGM9ITEsZD0wLGU9dGhpcy5wb2ludHMubGVuZ3RoLTE7ZDx0aGlzLnBvaW50cy5sZW5ndGg7ZT1kKyspe3ZhciBmPXRoaXMucG9pbnRzW2RdLngsZz10aGlzLnBvaW50c1tkXS55LGg9dGhpcy5wb2ludHNbZV0ueCxpPXRoaXMucG9pbnRzW2VdLnksaj1nPmIhPWk+YiYmKGgtZikqKGItZykvKGktZykrZj5hO2omJihjPSFjKX1yZXR1cm4gY30sbW9kdWxlLmV4cG9ydHM9UG9seWdvbjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBSZWN0YW5nbGUoYSxiLGMsZCl7dGhpcy54PWF8fDAsdGhpcy55PWJ8fDAsdGhpcy53aWR0aD1jfHwwLHRoaXMuaGVpZ2h0PWR8fDB9dmFyIHByb3RvPVJlY3RhbmdsZS5wcm90b3R5cGU7cHJvdG8uY2xvbmU9ZnVuY3Rpb24oKXtyZXR1cm4gbmV3IFJlY3RhbmdsZSh0aGlzLngsdGhpcy55LHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpfSxwcm90by5jb250YWlucz1mdW5jdGlvbihhLGIpe2lmKHRoaXMud2lkdGg8PTB8fHRoaXMuaGVpZ2h0PD0wKXJldHVybiExO3ZhciBjPXRoaXMueDtpZihhPj1jJiZhPD1jK3RoaXMud2lkdGgpe3ZhciBkPXRoaXMueTtpZihiPj1kJiZiPD1kK3RoaXMuaGVpZ2h0KXJldHVybiEwfXJldHVybiExfSxtb2R1bGUuZXhwb3J0cz1SZWN0YW5nbGU7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7dmFyIE1hdHJpeD1leHBvcnRzLk1hdHJpeD1cInVuZGVmaW5lZFwiIT10eXBlb2YgRmxvYXQzMkFycmF5P0Zsb2F0MzJBcnJheTpBcnJheSxtYXQzPWV4cG9ydHMubWF0Mz17fSxtYXQ0PWV4cG9ydHMubWF0ND17fTttYXQzLmNyZWF0ZT1mdW5jdGlvbigpe3ZhciBhPW5ldyBNYXRyaXgoOSk7cmV0dXJuIGFbMF09MSxhWzFdPTAsYVsyXT0wLGFbM109MCxhWzRdPTEsYVs1XT0wLGFbNl09MCxhWzddPTAsYVs4XT0xLGF9LG1hdDMuaWRlbnRpdHk9ZnVuY3Rpb24oYSl7cmV0dXJuIGFbMF09MSxhWzFdPTAsYVsyXT0wLGFbM109MCxhWzRdPTEsYVs1XT0wLGFbNl09MCxhWzddPTAsYVs4XT0xLGF9LG1hdDQuY3JlYXRlPWZ1bmN0aW9uKCl7dmFyIGE9bmV3IE1hdHJpeCgxNik7cmV0dXJuIGFbMF09MSxhWzFdPTAsYVsyXT0wLGFbM109MCxhWzRdPTAsYVs1XT0xLGFbNl09MCxhWzddPTAsYVs4XT0wLGFbOV09MCxhWzEwXT0xLGFbMTFdPTAsYVsxMl09MCxhWzEzXT0wLGFbMTRdPTAsYVsxNV09MSxhfSxtYXQzLm11bHRpcGx5PWZ1bmN0aW9uKGEsYixjKXtjfHwoYz1hKTt2YXIgZD1hWzBdLGU9YVsxXSxmPWFbMl0sZz1hWzNdLGg9YVs0XSxpPWFbNV0saj1hWzZdLGs9YVs3XSxsPWFbOF0sbT1iWzBdLG49YlsxXSxvPWJbMl0scD1iWzNdLHE9Yls0XSxyPWJbNV0scz1iWzZdLHQ9Yls3XSx1PWJbOF07cmV0dXJuIGNbMF09bSpkK24qZytvKmosY1sxXT1tKmUrbipoK28qayxjWzJdPW0qZituKmkrbypsLGNbM109cCpkK3EqZytyKmosY1s0XT1wKmUrcSpoK3IqayxjWzVdPXAqZitxKmkrcipsLGNbNl09cypkK3QqZyt1KmosY1s3XT1zKmUrdCpoK3UqayxjWzhdPXMqZit0KmkrdSpsLGN9LG1hdDMuY2xvbmU9ZnVuY3Rpb24oYSl7dmFyIGI9bmV3IE1hdHJpeCg5KTtyZXR1cm4gYlswXT1hWzBdLGJbMV09YVsxXSxiWzJdPWFbMl0sYlszXT1hWzNdLGJbNF09YVs0XSxiWzVdPWFbNV0sYls2XT1hWzZdLGJbN109YVs3XSxiWzhdPWFbOF0sYn0sbWF0My50cmFuc3Bvc2U9ZnVuY3Rpb24oYSxiKXtpZighYnx8YT09PWIpe3ZhciBjPWFbMV0sZD1hWzJdLGU9YVs1XTtyZXR1cm4gYVsxXT1hWzNdLGFbMl09YVs2XSxhWzNdPWMsYVs1XT1hWzddLGFbNl09ZCxhWzddPWUsYX1yZXR1cm4gYlswXT1hWzBdLGJbMV09YVszXSxiWzJdPWFbNl0sYlszXT1hWzFdLGJbNF09YVs0XSxiWzVdPWFbN10sYls2XT1hWzJdLGJbN109YVs1XSxiWzhdPWFbOF0sYn0sbWF0My50b01hdDQ9ZnVuY3Rpb24oYSxiKXtyZXR1cm4gYnx8KGI9bWF0NC5jcmVhdGUoKSksYlsxNV09MSxiWzE0XT0wLGJbMTNdPTAsYlsxMl09MCxiWzExXT0wLGJbMTBdPWFbOF0sYls5XT1hWzddLGJbOF09YVs2XSxiWzddPTAsYls2XT1hWzVdLGJbNV09YVs0XSxiWzRdPWFbM10sYlszXT0wLGJbMl09YVsyXSxiWzFdPWFbMV0sYlswXT1hWzBdLGJ9LG1hdDQuY3JlYXRlPWZ1bmN0aW9uKCl7dmFyIGE9bmV3IE1hdHJpeCgxNik7cmV0dXJuIGFbMF09MSxhWzFdPTAsYVsyXT0wLGFbM109MCxhWzRdPTAsYVs1XT0xLGFbNl09MCxhWzddPTAsYVs4XT0wLGFbOV09MCxhWzEwXT0xLGFbMTFdPTAsYVsxMl09MCxhWzEzXT0wLGFbMTRdPTAsYVsxNV09MSxhfSxtYXQ0LnRyYW5zcG9zZT1mdW5jdGlvbihhLGIpe2lmKCFifHxhPT09Yil7dmFyIGM9YVsxXSxkPWFbMl0sZT1hWzNdLGY9YVs2XSxnPWFbN10saD1hWzExXTtyZXR1cm4gYVsxXT1hWzRdLGFbMl09YVs4XSxhWzNdPWFbMTJdLGFbNF09YyxhWzZdPWFbOV0sYVs3XT1hWzEzXSxhWzhdPWQsYVs5XT1mLGFbMTFdPWFbMTRdLGFbMTJdPWUsYVsxM109ZyxhWzE0XT1oLGF9cmV0dXJuIGJbMF09YVswXSxiWzFdPWFbNF0sYlsyXT1hWzhdLGJbM109YVsxMl0sYls0XT1hWzFdLGJbNV09YVs1XSxiWzZdPWFbOV0sYls3XT1hWzEzXSxiWzhdPWFbMl0sYls5XT1hWzZdLGJbMTBdPWFbMTBdLGJbMTFdPWFbMTRdLGJbMTJdPWFbM10sYlsxM109YVs3XSxiWzE0XT1hWzExXSxiWzE1XT1hWzE1XSxifSxtYXQ0Lm11bHRpcGx5PWZ1bmN0aW9uKGEsYixjKXtjfHwoYz1hKTt2YXIgZD1hWzBdLGU9YVsxXSxmPWFbMl0sZz1hWzNdLGg9YVs0XSxpPWFbNV0saj1hWzZdLGs9YVs3XSxsPWFbOF0sbT1hWzldLG49YVsxMF0sbz1hWzExXSxwPWFbMTJdLHE9YVsxM10scj1hWzE0XSxzPWFbMTVdLHQ9YlswXSx1PWJbMV0sdj1iWzJdLHc9YlszXTtyZXR1cm4gY1swXT10KmQrdSpoK3YqbCt3KnAsY1sxXT10KmUrdSppK3YqbSt3KnEsY1syXT10KmYrdSpqK3Yqbit3KnIsY1szXT10KmcrdSprK3Yqbyt3KnMsdD1iWzRdLHU9Yls1XSx2PWJbNl0sdz1iWzddLGNbNF09dCpkK3UqaCt2KmwrdypwLGNbNV09dCplK3UqaSt2Km0rdypxLGNbNl09dCpmK3Uqait2Km4rdypyLGNbN109dCpnK3Uqayt2Km8rdypzLHQ9Yls4XSx1PWJbOV0sdj1iWzEwXSx3PWJbMTFdLGNbOF09dCpkK3UqaCt2KmwrdypwLGNbOV09dCplK3UqaSt2Km0rdypxLGNbMTBdPXQqZit1KmordipuK3cqcixjWzExXT10KmcrdSprK3Yqbyt3KnMsdD1iWzEyXSx1PWJbMTNdLHY9YlsxNF0sdz1iWzE1XSxjWzEyXT10KmQrdSpoK3YqbCt3KnAsY1sxM109dCplK3UqaSt2Km0rdypxLGNbMTRdPXQqZit1KmordipuK3cqcixjWzE1XT10KmcrdSprK3Yqbyt3KnMsY307IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7dmFyIGdsb2JhbHM9cmVxdWlyZShcIi4vY29yZS9nbG9iYWxzXCIpLHNoYWRlcnM9cmVxdWlyZShcIi4vcmVuZGVyZXJzL3dlYmdsL3NoYWRlcnNcIiksbWF0cml4PXJlcXVpcmUoXCIuL2dlb20vbWF0cml4XCIpLHBpeGk9bW9kdWxlLmV4cG9ydHM9T2JqZWN0LmNyZWF0ZShnbG9iYWxzKTtwaXhpLlBvaW50PXJlcXVpcmUoXCIuL2dlb20vUG9pbnRcIikscGl4aS5SZWN0YW5nbGU9cmVxdWlyZShcIi4vZ2VvbS9SZWN0YW5nbGVcIikscGl4aS5Qb2x5Z29uPXJlcXVpcmUoXCIuL2dlb20vUG9seWdvblwiKSxwaXhpLkNpcmNsZT1yZXF1aXJlKFwiLi9nZW9tL0NpcmNsZVwiKSxwaXhpLkVsbGlwc2U9cmVxdWlyZShcIi4vZ2VvbS9FbGxpcHNlXCIpLHBpeGkuTWF0cml4PW1hdHJpeC5NYXRyaXgscGl4aS5tYXQzPW1hdHJpeC5tYXQzLHBpeGkubWF0ND1tYXRyaXgubWF0NCxwaXhpLmJsZW5kTW9kZXM9cmVxdWlyZShcIi4vZGlzcGxheS9ibGVuZE1vZGVzXCIpLHBpeGkuRGlzcGxheU9iamVjdD1yZXF1aXJlKFwiLi9kaXNwbGF5L0Rpc3BsYXlPYmplY3RcIikscGl4aS5EaXNwbGF5T2JqZWN0Q29udGFpbmVyPXJlcXVpcmUoXCIuL2Rpc3BsYXkvRGlzcGxheU9iamVjdENvbnRhaW5lclwiKSxwaXhpLlNwcml0ZT1yZXF1aXJlKFwiLi9kaXNwbGF5L1Nwcml0ZVwiKSxwaXhpLk1vdmllQ2xpcD1yZXF1aXJlKFwiLi9kaXNwbGF5L01vdmllQ2xpcFwiKSxwaXhpLkFic3RyYWN0RmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvQWJzdHJhY3RGaWx0ZXJcIikscGl4aS5CbHVyRmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvQmx1ckZpbHRlclwiKSxwaXhpLkJsdXJYRmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvQmx1clhGaWx0ZXJcIikscGl4aS5CbHVyWUZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL0JsdXJZRmlsdGVyXCIpLHBpeGkuQ29sb3JNYXRyaXhGaWx0ZXI9cmVxdWlyZShcIi4vZmlsdGVycy9Db2xvck1hdHJpeEZpbHRlclwiKSxwaXhpLkNvbG9yU3RlcEZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL0NvbG9yU3RlcEZpbHRlclwiKSxwaXhpLkNyb3NzSGF0Y2hGaWx0ZXI9cmVxdWlyZShcIi4vZmlsdGVycy9Dcm9zc0hhdGNoRmlsdGVyXCIpLHBpeGkuRGlzcGxhY2VtZW50RmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvRGlzcGxhY2VtZW50RmlsdGVyXCIpLHBpeGkuRG90U2NyZWVuRmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvRG90U2NyZWVuRmlsdGVyXCIpLHBpeGkuRmlsdGVyQmxvY2s9cmVxdWlyZShcIi4vZmlsdGVycy9GaWx0ZXJCbG9ja1wiKSxwaXhpLkdyYXlGaWx0ZXI9cmVxdWlyZShcIi4vZmlsdGVycy9HcmF5RmlsdGVyXCIpLHBpeGkuSW52ZXJ0RmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvSW52ZXJ0RmlsdGVyXCIpLHBpeGkuUGl4ZWxhdGVGaWx0ZXI9cmVxdWlyZShcIi4vZmlsdGVycy9QaXhlbGF0ZUZpbHRlclwiKSxwaXhpLlJHQlNwbGl0RmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvUkdCU3BsaXRGaWx0ZXJcIikscGl4aS5TZXBpYUZpbHRlcj1yZXF1aXJlKFwiLi9maWx0ZXJzL1NlcGlhRmlsdGVyXCIpLHBpeGkuU21hcnRCbHVyRmlsdGVyPXJlcXVpcmUoXCIuL2ZpbHRlcnMvU21hcnRCbHVyRmlsdGVyXCIpLHBpeGkuVHdpc3RGaWx0ZXI9cmVxdWlyZShcIi4vZmlsdGVycy9Ud2lzdEZpbHRlclwiKSxwaXhpLlRleHQ9cmVxdWlyZShcIi4vdGV4dC9UZXh0XCIpLHBpeGkuQml0bWFwVGV4dD1yZXF1aXJlKFwiLi90ZXh0L0JpdG1hcFRleHRcIikscGl4aS5JbnRlcmFjdGlvbk1hbmFnZXI9cmVxdWlyZShcIi4vSW50ZXJhY3Rpb25NYW5hZ2VyXCIpLHBpeGkuU3RhZ2U9cmVxdWlyZShcIi4vZGlzcGxheS9TdGFnZVwiKSxwaXhpLkV2ZW50VGFyZ2V0PXJlcXVpcmUoXCIuL2V2ZW50cy9FdmVudFRhcmdldFwiKSxwaXhpLmF1dG9EZXRlY3RSZW5kZXJlcj1yZXF1aXJlKFwiLi91dGlscy9hdXRvRGV0ZWN0UmVuZGVyZXJcIikscGl4aS5Qb2x5Sz1yZXF1aXJlKFwiLi91dGlscy9Qb2x5a1wiKSxwaXhpLldlYkdMR3JhcGhpY3M9cmVxdWlyZShcIi4vcmVuZGVyZXJzL3dlYmdsL2dyYXBoaWNzXCIpLHBpeGkuV2ViR0xSZW5kZXJlcj1yZXF1aXJlKFwiLi9yZW5kZXJlcnMvd2ViZ2wvV2ViR0xSZW5kZXJlclwiKSxwaXhpLldlYkdMQmF0Y2g9cmVxdWlyZShcIi4vcmVuZGVyZXJzL3dlYmdsL1dlYkdMQmF0Y2hcIikscGl4aS5XZWJHTFJlbmRlckdyb3VwPXJlcXVpcmUoXCIuL3JlbmRlcmVycy93ZWJnbC9XZWJHTFJlbmRlckdyb3VwXCIpLHBpeGkuQ2FudmFzUmVuZGVyZXI9cmVxdWlyZShcIi4vcmVuZGVyZXJzL2NhbnZhcy9DYW52YXNSZW5kZXJlclwiKSxwaXhpLkNhbnZhc0dyYXBoaWNzPXJlcXVpcmUoXCIuL3JlbmRlcmVycy9jYW52YXMvZ3JhcGhpY3NcIikscGl4aS5HcmFwaGljcz1yZXF1aXJlKFwiLi9wcmltaXRpdmVzL0dyYXBoaWNzXCIpLHBpeGkuU3RyaXA9cmVxdWlyZShcIi4vZXh0cmFzL1N0cmlwXCIpLHBpeGkuUm9wZT1yZXF1aXJlKFwiLi9leHRyYXMvUm9wZVwiKSxwaXhpLlRpbGluZ1Nwcml0ZT1yZXF1aXJlKFwiLi9leHRyYXMvVGlsaW5nU3ByaXRlXCIpLHBpeGkuU3BpbmU9cmVxdWlyZShcIi4vZXh0cmFzL1NwaW5lXCIpLHBpeGkuQ3VzdG9tUmVuZGVyYWJsZT1yZXF1aXJlKFwiLi9leHRyYXMvQ3VzdG9tUmVuZGVyYWJsZVwiKSxwaXhpLkJhc2VUZXh0dXJlPXJlcXVpcmUoXCIuL3RleHR1cmVzL0Jhc2VUZXh0dXJlXCIpLHBpeGkuVGV4dHVyZT1yZXF1aXJlKFwiLi90ZXh0dXJlcy9UZXh0dXJlXCIpLHBpeGkuUmVuZGVyVGV4dHVyZT1yZXF1aXJlKFwiLi90ZXh0dXJlcy9SZW5kZXJUZXh0dXJlXCIpLHBpeGkuQXNzZXRMb2FkZXI9cmVxdWlyZShcIi4vbG9hZGVycy9Bc3NldExvYWRlclwiKSxwaXhpLkpzb25Mb2FkZXI9cmVxdWlyZShcIi4vbG9hZGVycy9Kc29uTG9hZGVyXCIpLHBpeGkuU3ByaXRlU2hlZXRMb2FkZXI9cmVxdWlyZShcIi4vbG9hZGVycy9TcHJpdGVTaGVldExvYWRlclwiKSxwaXhpLkltYWdlTG9hZGVyPXJlcXVpcmUoXCIuL2xvYWRlcnMvSW1hZ2VMb2FkZXJcIikscGl4aS5CaXRtYXBGb250TG9hZGVyPXJlcXVpcmUoXCIuL2xvYWRlcnMvQml0bWFwRm9udExvYWRlclwiKSxwaXhpLlNwaW5lTG9hZGVyPXJlcXVpcmUoXCIuL2xvYWRlcnMvU3BpbmVMb2FkZXJcIikscGl4aS5pbml0RGVmYXVsdFNoYWRlcnM9c2hhZGVycy5pbml0RGVmYXVsdFNoYWRlcnMscGl4aS5hY3RpdmF0ZVByaW1pdGl2ZVNoYWRlcj1zaGFkZXJzLmFjdGl2YXRlUHJpbWl0aXZlU2hhZGVyLHBpeGkuZGVhY3RpdmF0ZVByaW1pdGl2ZVNoYWRlcj1zaGFkZXJzLmRlYWN0aXZhdGVQcmltaXRpdmVTaGFkZXIscGl4aS5hY3RpdmF0ZVN0cmlwU2hhZGVyPXNoYWRlcnMuYWN0aXZhdGVTdHJpcFNoYWRlcixwaXhpLmRlYWN0aXZhdGVTdHJpcFNoYWRlcj1zaGFkZXJzLmRlYWN0aXZhdGVTdHJpcFNoYWRlcjt2YXIgZGVidWc9cmVxdWlyZShcIi4vdXRpbHMvZGVidWdcIik7cGl4aS5ydW5MaXN0PWRlYnVnLnJ1bkxpc3Q7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gZ2V0RGF0YVR5cGUoYSl7dmFyIGI9XCJkYXRhOlwiLGM9YS5zbGljZSgwLGIubGVuZ3RoKS50b0xvd2VyQ2FzZSgpO2lmKGM9PT1iKXt2YXIgZD1hLnNsaWNlKGIubGVuZ3RoKSxlPWQuaW5kZXhPZihcIixcIik7aWYoLTE9PT1lKXJldHVybiBudWxsO3ZhciBmPWQuc2xpY2UoMCxlKS5zcGxpdChcIjtcIilbMF07cmV0dXJuIGYmJlwidGV4dC9wbGFpblwiIT09Zi50b0xvd2VyQ2FzZSgpP2Yuc3BsaXQoXCIvXCIpLnBvcCgpLnRvTG93ZXJDYXNlKCk6XCJ0eHRcIn1yZXR1cm4gbnVsbH1mdW5jdGlvbiBBc3NldExvYWRlcihhLGIpe0V2ZW50VGFyZ2V0LmNhbGwodGhpcyksdGhpcy5hc3NldFVSTHM9YSx0aGlzLmNyb3Nzb3JpZ2luPWJ9dmFyIEV2ZW50VGFyZ2V0PXJlcXVpcmUoXCIuLi9ldmVudHMvRXZlbnRUYXJnZXRcIiksbG9hZGVyc0J5VHlwZT17fSxwcm90bz1Bc3NldExvYWRlci5wcm90b3R5cGU7cHJvdG8ubG9hZD1mdW5jdGlvbigpe2Z1bmN0aW9uIGEoKXtiLm9uQXNzZXRMb2FkZWQoKX12YXIgYj10aGlzO3RoaXMubG9hZENvdW50PXRoaXMuYXNzZXRVUkxzLmxlbmd0aDtmb3IodmFyIGM9MCxkPXRoaXMuYXNzZXRVUkxzLmxlbmd0aDtkPmM7YysrKXt2YXIgZT10aGlzLmFzc2V0VVJMc1tjXSxmPWdldERhdGFUeXBlKGUpO2Z8fChmPWUuc3BsaXQoXCI/XCIpLnNoaWZ0KCkuc3BsaXQoXCIuXCIpLnBvcCgpLnRvTG93ZXJDYXNlKCkpO3ZhciBnPWxvYWRlcnNCeVR5cGVbZl07aWYoIWcpdGhyb3cgbmV3IEVycm9yKGYrXCIgaXMgYW4gdW5zdXBwb3J0ZWQgZmlsZSB0eXBlXCIpO3ZhciBoPW5ldyBnKGUsdGhpcy5jcm9zc29yaWdpbik7aC5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkXCIsYSksaC5sb2FkKCl9fSxwcm90by5vbkFzc2V0TG9hZGVkPWZ1bmN0aW9uKCl7dGhpcy5sb2FkQ291bnQtLSx0aGlzLmRpc3BhdGNoRXZlbnQoe3R5cGU6XCJvblByb2dyZXNzXCIsY29udGVudDp0aGlzfSksdGhpcy5vblByb2dyZXNzJiZ0aGlzLm9uUHJvZ3Jlc3MoKSx0aGlzLmxvYWRDb3VudHx8KHRoaXMuZGlzcGF0Y2hFdmVudCh7dHlwZTpcIm9uQ29tcGxldGVcIixjb250ZW50OnRoaXN9KSx0aGlzLm9uQ29tcGxldGUmJnRoaXMub25Db21wbGV0ZSgpKX0sQXNzZXRMb2FkZXIucmVnaXN0ZXJMb2FkZXJUeXBlPWZ1bmN0aW9uKGEsYil7bG9hZGVyc0J5VHlwZVthXT1ifSxtb2R1bGUuZXhwb3J0cz1Bc3NldExvYWRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBCaXRtYXBGb250TG9hZGVyKGEsYil7RXZlbnRUYXJnZXQuY2FsbCh0aGlzKSx0aGlzLnVybD1hLHRoaXMuY3Jvc3NvcmlnaW49Yix0aGlzLmJhc2VVcmw9YS5yZXBsYWNlKC9bXlxcL10qJC8sXCJcIiksdGhpcy50ZXh0dXJlPW51bGx9dmFyIEFzc2V0TG9hZGVyPXJlcXVpcmUoXCIuL0Fzc2V0TG9hZGVyXCIpLEltYWdlTG9hZGVyPXJlcXVpcmUoXCIuL0ltYWdlTG9hZGVyXCIpLFJlY3RhbmdsZT1yZXF1aXJlKFwiLi4vZ2VvbS9SZWN0YW5nbGVcIiksRXZlbnRUYXJnZXQ9cmVxdWlyZShcIi4uL2V2ZW50cy9FdmVudFRhcmdldFwiKSxCaXRtYXBUZXh0PXJlcXVpcmUoXCIuLi90ZXh0L0JpdG1hcFRleHRcIiksVGV4dHVyZT1yZXF1aXJlKFwiLi4vdGV4dHVyZXMvVGV4dHVyZVwiKSxwbGF0Zm9ybT1yZXF1aXJlKFwiLi4vcGxhdGZvcm1cIikscHJvdG89Qml0bWFwRm9udExvYWRlci5wcm90b3R5cGU7cHJvdG8uaGFuZGxlRXZlbnQ9ZnVuY3Rpb24oYSl7c3dpdGNoKGEudHlwZSl7Y2FzZVwibG9hZFwiOnRoaXMub25YTUxMb2FkZWQoKTticmVhaztkZWZhdWx0OnRoaXMub25FcnJvcigpfX0scHJvdG8ubG9hZD1mdW5jdGlvbigpe3RoaXMucmVxdWVzdD1wbGF0Zm9ybS5jcmVhdGVSZXF1ZXN0KCksdGhpcy5yZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsdGhpcyksdGhpcy5yZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLHRoaXMpLHRoaXMucmVxdWVzdC5vcGVuKFwiR0VUXCIsdGhpcy51cmwsITApLHRoaXMucmVxdWVzdC5vdmVycmlkZU1pbWVUeXBlJiZ0aGlzLnJlcXVlc3Qub3ZlcnJpZGVNaW1lVHlwZShcImFwcGxpY2F0aW9uL3htbFwiKSx0aGlzLnJlcXVlc3Quc2VuZChudWxsKX0scHJvdG8ub25YTUxMb2FkZWQ9ZnVuY3Rpb24oKXt2YXIgYT10aGlzLmJhc2VVcmwrdGhpcy5yZXF1ZXN0LnJlc3BvbnNlWE1MLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicGFnZVwiKVswXS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcImZpbGVcIikubm9kZVZhbHVlLGI9bmV3IEltYWdlTG9hZGVyKGEsdGhpcy5jcm9zc29yaWdpbik7dGhpcy50ZXh0dXJlPWIudGV4dHVyZS5iYXNlVGV4dHVyZTt2YXIgYz17fSxkPXRoaXMucmVxdWVzdC5yZXNwb25zZVhNTC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImluZm9cIilbMF0sZT10aGlzLnJlcXVlc3QucmVzcG9uc2VYTUwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjb21tb25cIilbMF07Yy5mb250PWQuYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJmYWNlXCIpLm5vZGVWYWx1ZSxjLnNpemU9cGFyc2VJbnQoZC5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcInNpemVcIikubm9kZVZhbHVlLDEwKSxjLmxpbmVIZWlnaHQ9cGFyc2VJbnQoZS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcImxpbmVIZWlnaHRcIikubm9kZVZhbHVlLDEwKSxjLmNoYXJzPXt9O2Zvcih2YXIgZj10aGlzLnJlcXVlc3QucmVzcG9uc2VYTUwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJjaGFyXCIpLGc9MDtnPGYubGVuZ3RoO2crKyl7dmFyIGg9cGFyc2VJbnQoZltnXS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcImlkXCIpLm5vZGVWYWx1ZSwxMCksaT1uZXcgUmVjdGFuZ2xlKHBhcnNlSW50KGZbZ10uYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJ4XCIpLm5vZGVWYWx1ZSwxMCkscGFyc2VJbnQoZltnXS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcInlcIikubm9kZVZhbHVlLDEwKSxwYXJzZUludChmW2ddLmF0dHJpYnV0ZXMuZ2V0TmFtZWRJdGVtKFwid2lkdGhcIikubm9kZVZhbHVlLDEwKSxwYXJzZUludChmW2ddLmF0dHJpYnV0ZXMuZ2V0TmFtZWRJdGVtKFwiaGVpZ2h0XCIpLm5vZGVWYWx1ZSwxMCkpO2MuY2hhcnNbaF09e3hPZmZzZXQ6cGFyc2VJbnQoZltnXS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcInhvZmZzZXRcIikubm9kZVZhbHVlLDEwKSx5T2Zmc2V0OnBhcnNlSW50KGZbZ10uYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJ5b2Zmc2V0XCIpLm5vZGVWYWx1ZSwxMCkseEFkdmFuY2U6cGFyc2VJbnQoZltnXS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcInhhZHZhbmNlXCIpLm5vZGVWYWx1ZSwxMCksa2VybmluZzp7fSx0ZXh0dXJlOlRleHR1cmUuY2FjaGVbaF09bmV3IFRleHR1cmUodGhpcy50ZXh0dXJlLGkpfX12YXIgaj10aGlzLnJlcXVlc3QucmVzcG9uc2VYTUwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJrZXJuaW5nXCIpO2ZvcihnPTA7ZzxqLmxlbmd0aDtnKyspe3ZhciBrPXBhcnNlSW50KGpbZ10uYXR0cmlidXRlcy5nZXROYW1lZEl0ZW0oXCJmaXJzdFwiKS5ub2RlVmFsdWUsMTApLGw9cGFyc2VJbnQoaltnXS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcInNlY29uZFwiKS5ub2RlVmFsdWUsMTApLG09cGFyc2VJbnQoaltnXS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShcImFtb3VudFwiKS5ub2RlVmFsdWUsMTApO2MuY2hhcnNbbF0ua2VybmluZ1trXT1tfUJpdG1hcFRleHQuZm9udHNbYy5mb250XT1jO3ZhciBuPXRoaXM7Yi5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkXCIsZnVuY3Rpb24oKXtuLm9uTG9hZGVkKCl9KSxiLmxvYWQoKX0scHJvdG8ub25Mb2FkZWQ9ZnVuY3Rpb24oKXt0aGlzLmxvYWRlZD0hMCx0aGlzLmRpc3BhdGNoRXZlbnQoe3R5cGU6XCJsb2FkZWRcIixjb250ZW50OnRoaXN9KX0scHJvdG8ub25FcnJvcj1mdW5jdGlvbigpe3RoaXMuZGlzcGF0Y2hFdmVudCh7dHlwZTpcImVycm9yXCIsY29udGVudDp0aGlzfSl9LEFzc2V0TG9hZGVyLnJlZ2lzdGVyTG9hZGVyVHlwZShcInhtbFwiLEJpdG1hcEZvbnRMb2FkZXIpLEFzc2V0TG9hZGVyLnJlZ2lzdGVyTG9hZGVyVHlwZShcImZudFwiLEJpdG1hcEZvbnRMb2FkZXIpLG1vZHVsZS5leHBvcnRzPUJpdG1hcEZvbnRMb2FkZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gSW1hZ2VMb2FkZXIoYSxiKXtFdmVudFRhcmdldC5jYWxsKHRoaXMpLHRoaXMudGV4dHVyZT1UZXh0dXJlLmZyb21JbWFnZShhLGIpLHRoaXMuZnJhbWVzPVtdfXZhciBBc3NldExvYWRlcj1yZXF1aXJlKFwiLi9Bc3NldExvYWRlclwiKSxFdmVudFRhcmdldD1yZXF1aXJlKFwiLi4vZXZlbnRzL0V2ZW50VGFyZ2V0XCIpLFRleHR1cmU9cmVxdWlyZShcIi4uL3RleHR1cmVzL1RleHR1cmVcIikscHJvdG89SW1hZ2VMb2FkZXIucHJvdG90eXBlO3Byb3RvLmxvYWQ9ZnVuY3Rpb24oKXtpZih0aGlzLnRleHR1cmUuYmFzZVRleHR1cmUuaGFzTG9hZGVkKXRoaXMub25Mb2FkZWQoKTtlbHNle3ZhciBhPXRoaXM7dGhpcy50ZXh0dXJlLmJhc2VUZXh0dXJlLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkZWRcIixmdW5jdGlvbigpe2Eub25Mb2FkZWQoKX0pfX0scHJvdG8ub25Mb2FkZWQ9ZnVuY3Rpb24oKXt0aGlzLmRpc3BhdGNoRXZlbnQoe3R5cGU6XCJsb2FkZWRcIixjb250ZW50OnRoaXN9KX0scHJvdG8ubG9hZEZyYW1lZFNwcml0ZVNoZWV0PWZ1bmN0aW9uKGEsYixjKXt0aGlzLmZyYW1lcz1bXTtmb3IodmFyIGQ9TWF0aC5mbG9vcih0aGlzLnRleHR1cmUud2lkdGgvYSksZT1NYXRoLmZsb29yKHRoaXMudGV4dHVyZS5oZWlnaHQvYiksZj0wLGc9MDtlPmc7ZysrKWZvcih2YXIgaD0wO2Q+aDtoKyssZisrKXt2YXIgaT1uZXcgVGV4dHVyZSh0aGlzLnRleHR1cmUse3g6aCphLHk6ZypiLHdpZHRoOmEsaGVpZ2h0OmJ9KTt0aGlzLmZyYW1lcy5wdXNoKGkpLGMmJihUZXh0dXJlLmNhY2hlW2MrXCItXCIrZl09aSl9aWYodGhpcy50ZXh0dXJlLmJhc2VUZXh0dXJlLmhhc0xvYWRlZCl0aGlzLm9uTG9hZGVkKCk7ZWxzZXt2YXIgaj10aGlzO3RoaXMudGV4dHVyZS5iYXNlVGV4dHVyZS5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkXCIsZnVuY3Rpb24oKXtqLm9uTG9hZGVkKCl9KX19LEFzc2V0TG9hZGVyLnJlZ2lzdGVyTG9hZGVyVHlwZShcImpwZ1wiLEltYWdlTG9hZGVyKSxBc3NldExvYWRlci5yZWdpc3RlckxvYWRlclR5cGUoXCJqcGVnXCIsSW1hZ2VMb2FkZXIpLEFzc2V0TG9hZGVyLnJlZ2lzdGVyTG9hZGVyVHlwZShcInBuZ1wiLEltYWdlTG9hZGVyKSxBc3NldExvYWRlci5yZWdpc3RlckxvYWRlclR5cGUoXCJnaWZcIixJbWFnZUxvYWRlciksbW9kdWxlLmV4cG9ydHM9SW1hZ2VMb2FkZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gSnNvbkxvYWRlcihhLGIpe0V2ZW50VGFyZ2V0LmNhbGwodGhpcyksdGhpcy51cmw9YSx0aGlzLmNyb3Nzb3JpZ2luPWIsdGhpcy5iYXNlVXJsPWEucmVwbGFjZSgvW15cXC9dKiQvLFwiXCIpLHRoaXMubG9hZGVkPSExfXZhciBBc3NldExvYWRlcj1yZXF1aXJlKFwiLi9Bc3NldExvYWRlclwiKSxJbWFnZUxvYWRlcj1yZXF1aXJlKFwiLi9JbWFnZUxvYWRlclwiKSxFdmVudFRhcmdldD1yZXF1aXJlKFwiLi4vZXZlbnRzL0V2ZW50VGFyZ2V0XCIpLFRleHR1cmU9cmVxdWlyZShcIi4uL3RleHR1cmVzL1RleHR1cmVcIiksU3BpbmU9cmVxdWlyZShcIi4uL2V4dHJhcy9TcGluZVwiKSxTa2VsZXRvbkpzb249cmVxdWlyZShcIi4uL3V0aWxzL3NwaW5lXCIpLlNrZWxldG9uSnNvbixwbGF0Zm9ybT1yZXF1aXJlKFwiLi4vcGxhdGZvcm1cIikscHJvdG89SnNvbkxvYWRlci5wcm90b3R5cGU7cHJvdG8uaGFuZGxlRXZlbnQ9ZnVuY3Rpb24oYSl7c3dpdGNoKGEudHlwZSl7Y2FzZVwibG9hZFwiOnRoaXMub25KU09OTG9hZGVkKCk7YnJlYWs7ZGVmYXVsdDp0aGlzLm9uRXJyb3IoKX19LHByb3RvLmxvYWQ9ZnVuY3Rpb24oKXt0aGlzLnJlcXVlc3Q9cGxhdGZvcm0uY3JlYXRlUmVxdWVzdCgpLHRoaXMucmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLHRoaXMpLHRoaXMucmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIix0aGlzKSx0aGlzLnJlcXVlc3Qub3BlbihcIkdFVFwiLHRoaXMudXJsLCEwKSx0aGlzLnJlcXVlc3Qub3ZlcnJpZGVNaW1lVHlwZSYmdGhpcy5yZXF1ZXN0Lm92ZXJyaWRlTWltZVR5cGUoXCJhcHBsaWNhdGlvbi9qc29uXCIpLHRoaXMucmVxdWVzdC5zZW5kKG51bGwpfSxwcm90by5vbkpTT05Mb2FkZWQ9ZnVuY3Rpb24oKXtpZih0aGlzLmpzb249SlNPTi5wYXJzZSh0aGlzLnJlcXVlc3QucmVzcG9uc2VUZXh0KSx0aGlzLmpzb24uZnJhbWVzKXt2YXIgYT10aGlzLGI9dGhpcy5iYXNlVXJsK3RoaXMuanNvbi5tZXRhLmltYWdlLGM9bmV3IEltYWdlTG9hZGVyKGIsdGhpcy5jcm9zc29yaWdpbiksZD10aGlzLmpzb24uZnJhbWVzO3RoaXMudGV4dHVyZT1jLnRleHR1cmUuYmFzZVRleHR1cmUsYy5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkXCIsZnVuY3Rpb24oKXthLm9uTG9hZGVkKCl9KTtmb3IodmFyIGUgaW4gZCl7dmFyIGY9ZFtlXS5mcmFtZTtmJiYoVGV4dHVyZS5jYWNoZVtlXT1uZXcgVGV4dHVyZSh0aGlzLnRleHR1cmUse3g6Zi54LHk6Zi55LHdpZHRoOmYudyxoZWlnaHQ6Zi5ofSksZFtlXS50cmltbWVkJiYoVGV4dHVyZS5jYWNoZVtlXS5yZWFsU2l6ZT1kW2VdLnNwcml0ZVNvdXJjZVNpemUsVGV4dHVyZS5jYWNoZVtlXS50cmltLng9MCkpfWMubG9hZCgpfWVsc2UgaWYodGhpcy5qc29uLmJvbmVzKXt2YXIgZz1uZXcgU2tlbGV0b25Kc29uLGg9Zy5yZWFkU2tlbGV0b25EYXRhKHRoaXMuanNvbik7U3BpbmUuYW5pbUNhY2hlW3RoaXMudXJsXT1oLHRoaXMub25Mb2FkZWQoKX1lbHNlIHRoaXMub25Mb2FkZWQoKX0scHJvdG8ub25Mb2FkZWQ9ZnVuY3Rpb24oKXt0aGlzLmxvYWRlZD0hMCx0aGlzLmRpc3BhdGNoRXZlbnQoe3R5cGU6XCJsb2FkZWRcIixjb250ZW50OnRoaXN9KX0scHJvdG8ub25FcnJvcj1mdW5jdGlvbigpe3RoaXMuZGlzcGF0Y2hFdmVudCh7dHlwZTpcImVycm9yXCIsY29udGVudDp0aGlzfSl9LEFzc2V0TG9hZGVyLnJlZ2lzdGVyTG9hZGVyVHlwZShcImpzb25cIixKc29uTG9hZGVyKSxtb2R1bGUuZXhwb3J0cz1Kc29uTG9hZGVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFNwaW5lTG9hZGVyKGEsYil7RXZlbnRUYXJnZXQuY2FsbCh0aGlzKSx0aGlzLnVybD1hLHRoaXMuY3Jvc3NvcmlnaW49Yix0aGlzLmxvYWRlZD0hMX12YXIgQXNzZXRMb2FkZXI9cmVxdWlyZShcIi4vQXNzZXRMb2FkZXJcIiksSnNvbkxvYWRlcj1yZXF1aXJlKFwiLi9Kc29uTG9hZGVyXCIpLEV2ZW50VGFyZ2V0PXJlcXVpcmUoXCIuLi9ldmVudHMvRXZlbnRUYXJnZXRcIiksU3BpbmU9cmVxdWlyZShcIi4uL2V4dHJhcy9TcGluZVwiKSxTa2VsZXRvbkpzb249cmVxdWlyZShcIi4uL3V0aWxzL3NwaW5lXCIpLlNrZWxldG9uSnNvbixwcm90bz1TcGluZUxvYWRlci5wcm90b3R5cGU7cHJvdG8ubG9hZD1mdW5jdGlvbigpe3ZhciBhPXRoaXMsYj1uZXcgSnNvbkxvYWRlcih0aGlzLnVybCx0aGlzLmNyb3Nzb3JpZ2luKTtiLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkZWRcIixmdW5jdGlvbihiKXthLmpzb249Yi5jb250ZW50Lmpzb24sYS5vbkpTT05Mb2FkZWQoKX0pLGIubG9hZCgpfSxwcm90by5vbkpTT05Mb2FkZWQ9ZnVuY3Rpb24oKXt2YXIgYT1uZXcgU2tlbGV0b25Kc29uLGI9YS5yZWFkU2tlbGV0b25EYXRhKHRoaXMuanNvbik7U3BpbmUuYW5pbUNhY2hlW3RoaXMudXJsXT1iLHRoaXMub25Mb2FkZWQoKX0scHJvdG8ub25Mb2FkZWQ9ZnVuY3Rpb24oKXt0aGlzLmxvYWRlZD0hMCx0aGlzLmRpc3BhdGNoRXZlbnQoe3R5cGU6XCJsb2FkZWRcIixjb250ZW50OnRoaXN9KX0sQXNzZXRMb2FkZXIucmVnaXN0ZXJMb2FkZXJUeXBlKFwiYW5pbVwiLFNwaW5lTG9hZGVyKSxtb2R1bGUuZXhwb3J0cz1TcGluZUxvYWRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBTcHJpdGVTaGVldExvYWRlcihhLGIpe0V2ZW50VGFyZ2V0LmNhbGwodGhpcyksdGhpcy51cmw9YSx0aGlzLmNyb3Nzb3JpZ2luPWIsdGhpcy5iYXNlVXJsPWEucmVwbGFjZSgvW15cXC9dKiQvLFwiXCIpLHRoaXMudGV4dHVyZT1udWxsLHRoaXMuZnJhbWVzPXt9fXZhciBKc29uTG9hZGVyPXJlcXVpcmUoXCIuL0pzb25Mb2FkZXJcIiksSW1hZ2VMb2FkZXI9cmVxdWlyZShcIi4vSW1hZ2VMb2FkZXJcIiksRXZlbnRUYXJnZXQ9cmVxdWlyZShcIi4uL2V2ZW50cy9FdmVudFRhcmdldFwiKSxUZXh0dXJlPXJlcXVpcmUoXCIuLi90ZXh0dXJlcy9UZXh0dXJlXCIpLHByb3RvPVNwcml0ZVNoZWV0TG9hZGVyLnByb3RvdHlwZTtwcm90by5sb2FkPWZ1bmN0aW9uKCl7dmFyIGE9dGhpcyxiPW5ldyBKc29uTG9hZGVyKHRoaXMudXJsLHRoaXMuY3Jvc3NvcmlnaW4pO2IuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRlZFwiLGZ1bmN0aW9uKGIpe2EuanNvbj1iLmNvbnRlbnQuanNvbixhLm9uSlNPTkxvYWRlZCgpfSksYi5sb2FkKCl9LHByb3RvLm9uSlNPTkxvYWRlZD1mdW5jdGlvbigpe3ZhciBhPXRoaXMsYj10aGlzLmJhc2VVcmwrdGhpcy5qc29uLm1ldGEuaW1hZ2UsYz1uZXcgSW1hZ2VMb2FkZXIoYix0aGlzLmNyb3Nzb3JpZ2luKSxkPXRoaXMuanNvbi5mcmFtZXM7dGhpcy50ZXh0dXJlPWMudGV4dHVyZS5iYXNlVGV4dHVyZSxjLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkZWRcIixmdW5jdGlvbigpe2Eub25Mb2FkZWQoKX0pO2Zvcih2YXIgZSBpbiBkKXt2YXIgZj1kW2VdLmZyYW1lO2YmJihUZXh0dXJlLmNhY2hlW2VdPW5ldyBUZXh0dXJlKHRoaXMudGV4dHVyZSx7eDpmLngseTpmLnksd2lkdGg6Zi53LGhlaWdodDpmLmh9KSxkW2VdLnRyaW1tZWQmJihUZXh0dXJlLmNhY2hlW2VdLnJlYWxTaXplPWRbZV0uc3ByaXRlU291cmNlU2l6ZSxUZXh0dXJlLmNhY2hlW2VdLnRyaW0ueD0wKSl9Yy5sb2FkKCl9LHByb3RvLm9uTG9hZGVkPWZ1bmN0aW9uKCl7dGhpcy5kaXNwYXRjaEV2ZW50KHt0eXBlOlwibG9hZGVkXCIsY29udGVudDp0aGlzfSl9LG1vZHVsZS5leHBvcnRzPVNwcml0ZVNoZWV0TG9hZGVyOyIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cbm1vZHVsZS5leHBvcnRzPXtjb25zb2xlOmdsb2JhbC5jb25zb2xlLGRvY3VtZW50Omdsb2JhbC5kb2N1bWVudCxsb2NhdGlvbjpnbG9iYWwubG9jYXRpb24sbmF2aWdhdG9yOmdsb2JhbC5uYXZpZ2F0b3Isd2luZG93Omdsb2JhbC53aW5kb3csY3JlYXRlQ2FudmFzOmZ1bmN0aW9uKCl7cmV0dXJuIGdsb2JhbC5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpfSxjcmVhdGVJbWFnZTpmdW5jdGlvbigpe3JldHVybiBuZXcgZ2xvYmFsLkltYWdlfSxjcmVhdGVSZXF1ZXN0OmZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBnbG9iYWwuWE1MSHR0cFJlcXVlc3R9fTtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEdyYXBoaWNzKCl7RGlzcGxheU9iamVjdENvbnRhaW5lci5jYWxsKHRoaXMpLHRoaXMucmVuZGVyYWJsZT0hMCx0aGlzLmZpbGxBbHBoYT0xLHRoaXMubGluZVdpZHRoPTAsdGhpcy5saW5lQ29sb3I9XCJibGFja1wiLHRoaXMuZ3JhcGhpY3NEYXRhPVtdLHRoaXMuY3VycmVudFBhdGg9e3BvaW50czpbXX19dmFyIERpc3BsYXlPYmplY3RDb250YWluZXI9cmVxdWlyZShcIi4uL2Rpc3BsYXkvRGlzcGxheU9iamVjdENvbnRhaW5lclwiKSxSZWN0YW5nbGU9cmVxdWlyZShcIi4uL2dlb20vUmVjdGFuZ2xlXCIpLHByb3RvPUdyYXBoaWNzLnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKERpc3BsYXlPYmplY3RDb250YWluZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6R3JhcGhpY3N9fSk7cHJvdG8ubGluZVN0eWxlPWZ1bmN0aW9uKGEsYixjKXt0aGlzLmN1cnJlbnRQYXRoLnBvaW50cy5sZW5ndGh8fHRoaXMuZ3JhcGhpY3NEYXRhLnBvcCgpLHRoaXMubGluZVdpZHRoPWF8fDAsdGhpcy5saW5lQ29sb3I9Ynx8MCx0aGlzLmxpbmVBbHBoYT1hcmd1bWVudHMubGVuZ3RoPDM/MTpjLHRoaXMuY3VycmVudFBhdGg9e2xpbmVXaWR0aDp0aGlzLmxpbmVXaWR0aCxsaW5lQ29sb3I6dGhpcy5saW5lQ29sb3IsbGluZUFscGhhOnRoaXMubGluZUFscGhhLGZpbGxDb2xvcjp0aGlzLmZpbGxDb2xvcixmaWxsQWxwaGE6dGhpcy5maWxsQWxwaGEsZmlsbDp0aGlzLmZpbGxpbmcscG9pbnRzOltdLHR5cGU6R3JhcGhpY3MuUE9MWX0sdGhpcy5ncmFwaGljc0RhdGEucHVzaCh0aGlzLmN1cnJlbnRQYXRoKX0scHJvdG8ubW92ZVRvPWZ1bmN0aW9uKGEsYil7dGhpcy5jdXJyZW50UGF0aC5wb2ludHMubGVuZ3RofHx0aGlzLmdyYXBoaWNzRGF0YS5wb3AoKSx0aGlzLmN1cnJlbnRQYXRoPXRoaXMuY3VycmVudFBhdGg9e2xpbmVXaWR0aDp0aGlzLmxpbmVXaWR0aCxsaW5lQ29sb3I6dGhpcy5saW5lQ29sb3IsbGluZUFscGhhOnRoaXMubGluZUFscGhhLGZpbGxDb2xvcjp0aGlzLmZpbGxDb2xvcixmaWxsQWxwaGE6dGhpcy5maWxsQWxwaGEsZmlsbDp0aGlzLmZpbGxpbmcscG9pbnRzOltdLHR5cGU6R3JhcGhpY3MuUE9MWX0sdGhpcy5jdXJyZW50UGF0aC5wb2ludHMucHVzaChhLGIpLHRoaXMuZ3JhcGhpY3NEYXRhLnB1c2godGhpcy5jdXJyZW50UGF0aCl9LHByb3RvLmxpbmVUbz1mdW5jdGlvbihhLGIpe3RoaXMuY3VycmVudFBhdGgucG9pbnRzLnB1c2goYSxiKSx0aGlzLmRpcnR5PSEwfSxwcm90by5iZWdpbkZpbGw9ZnVuY3Rpb24oYSxiKXt0aGlzLmZpbGxpbmc9ITAsdGhpcy5maWxsQ29sb3I9YXx8MCx0aGlzLmZpbGxBbHBoYT1hcmd1bWVudHMubGVuZ3RoPDI/MTpifSxwcm90by5lbmRGaWxsPWZ1bmN0aW9uKCl7dGhpcy5maWxsaW5nPSExLHRoaXMuZmlsbENvbG9yPW51bGwsdGhpcy5maWxsQWxwaGE9MX0scHJvdG8uZHJhd1JlY3Q9ZnVuY3Rpb24oYSxiLGMsZCl7dGhpcy5jdXJyZW50UGF0aC5wb2ludHMubGVuZ3RofHx0aGlzLmdyYXBoaWNzRGF0YS5wb3AoKSx0aGlzLmN1cnJlbnRQYXRoPXtsaW5lV2lkdGg6dGhpcy5saW5lV2lkdGgsbGluZUNvbG9yOnRoaXMubGluZUNvbG9yLGxpbmVBbHBoYTp0aGlzLmxpbmVBbHBoYSxmaWxsQ29sb3I6dGhpcy5maWxsQ29sb3IsZmlsbEFscGhhOnRoaXMuZmlsbEFscGhhLGZpbGw6dGhpcy5maWxsaW5nLHBvaW50czpbYSxiLGMsZF0sdHlwZTpHcmFwaGljcy5SRUNUfSx0aGlzLmdyYXBoaWNzRGF0YS5wdXNoKHRoaXMuY3VycmVudFBhdGgpLHRoaXMuZGlydHk9ITB9LHByb3RvLmRyYXdDaXJjbGU9ZnVuY3Rpb24oYSxiLGMpe3RoaXMuY3VycmVudFBhdGgucG9pbnRzLmxlbmd0aHx8dGhpcy5ncmFwaGljc0RhdGEucG9wKCksdGhpcy5jdXJyZW50UGF0aD17bGluZVdpZHRoOnRoaXMubGluZVdpZHRoLGxpbmVDb2xvcjp0aGlzLmxpbmVDb2xvcixsaW5lQWxwaGE6dGhpcy5saW5lQWxwaGEsZmlsbENvbG9yOnRoaXMuZmlsbENvbG9yLGZpbGxBbHBoYTp0aGlzLmZpbGxBbHBoYSxmaWxsOnRoaXMuZmlsbGluZyxwb2ludHM6W2EsYixjLGNdLHR5cGU6R3JhcGhpY3MuQ0lSQ30sdGhpcy5ncmFwaGljc0RhdGEucHVzaCh0aGlzLmN1cnJlbnRQYXRoKSx0aGlzLmRpcnR5PSEwfSxwcm90by5kcmF3RWxpcHNlPWZ1bmN0aW9uKGEsYixjLGQpe3RoaXMuY3VycmVudFBhdGgucG9pbnRzLmxlbmd0aHx8dGhpcy5ncmFwaGljc0RhdGEucG9wKCksdGhpcy5jdXJyZW50UGF0aD17bGluZVdpZHRoOnRoaXMubGluZVdpZHRoLGxpbmVDb2xvcjp0aGlzLmxpbmVDb2xvcixsaW5lQWxwaGE6dGhpcy5saW5lQWxwaGEsZmlsbENvbG9yOnRoaXMuZmlsbENvbG9yLGZpbGxBbHBoYTp0aGlzLmZpbGxBbHBoYSxmaWxsOnRoaXMuZmlsbGluZyxwb2ludHM6W2EsYixjLGRdLHR5cGU6R3JhcGhpY3MuRUxJUH0sdGhpcy5ncmFwaGljc0RhdGEucHVzaCh0aGlzLmN1cnJlbnRQYXRoKSx0aGlzLmRpcnR5PSEwfSxwcm90by5jbGVhcj1mdW5jdGlvbigpe3RoaXMubGluZVdpZHRoPTAsdGhpcy5maWxsaW5nPSExLHRoaXMuZGlydHk9ITAsdGhpcy5jbGVhckRpcnR5PSEwLHRoaXMuZ3JhcGhpY3NEYXRhPVtdLHRoaXMuYm91bmRzPW51bGx9LHByb3RvLnVwZGF0ZUZpbHRlckJvdW5kcz1mdW5jdGlvbigpe2lmKCF0aGlzLmJvdW5kcyl7Zm9yKHZhciBhLGIsYyxkPTEvMCxlPS0xLzAsZj0xLzAsZz0tMS8wLGg9MDtoPHRoaXMuZ3JhcGhpY3NEYXRhLmxlbmd0aDtoKyspe3ZhciBpPXRoaXMuZ3JhcGhpY3NEYXRhW2hdLGo9aS50eXBlLGs9aS5saW5lV2lkdGg7aWYoYT1pLnBvaW50cyxqPT09R3JhcGhpY3MuUkVDVCl7Yj1hLngtay8yLGM9YS55LWsvMjt2YXIgbD1hLndpZHRoK2ssbT1hLmhlaWdodCtrO2Q9ZD5iP2I6ZCxlPWIrbD5lP2IrbDplLGY9Zj5jP2I6ZixnPWMrbT5nP2MrbTpnfWVsc2UgaWYoaj09PUdyYXBoaWNzLkNJUkN8fGo9PT1HcmFwaGljcy5FTElQKXtiPWEueCxjPWEueTt2YXIgbj1hLnJhZGl1cytrLzI7ZD1kPmItbj9iLW46ZCxlPWIrbj5lP2IrbjplLGY9Zj5jLW4/Yy1uOmYsZz1jK24+Zz9jK246Z31lbHNlIGZvcih2YXIgbz0wO288YS5sZW5ndGg7bys9MiliPWFbb10sYz1hW28rMV0sZD1kPmItaz9iLWs6ZCxlPWIraz5lP2IrazplLGY9Zj5jLWs/Yy1rOmYsZz1jK2s+Zz9jK2s6Z310aGlzLmJvdW5kcz1uZXcgUmVjdGFuZ2xlKGQsZixlLWQsZy1mKX19LEdyYXBoaWNzLlBPTFk9MCxHcmFwaGljcy5SRUNUPTEsR3JhcGhpY3MuQ0lSQz0yLEdyYXBoaWNzLkVMSVA9Myxtb2R1bGUuZXhwb3J0cz1HcmFwaGljczsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBDYW52YXNSZW5kZXJlcihhLGIsYyxkKXt0aGlzLnRyYW5zcGFyZW50PWQsdGhpcy53aWR0aD1hfHw4MDAsdGhpcy5oZWlnaHQ9Ynx8NjAwLHRoaXMudmlldz1jfHxwbGF0Zm9ybS5jcmVhdGVDYW52YXMoKSx0aGlzLmNvbnRleHQ9dGhpcy52aWV3LmdldENvbnRleHQoXCIyZFwiKSx0aGlzLnNtb290aFByb3BlcnR5PW51bGwsXCJpbWFnZVNtb290aGluZ0VuYWJsZWRcImluIHRoaXMuY29udGV4dD90aGlzLnNtb290aFByb3BlcnR5PVwiaW1hZ2VTbW9vdGhpbmdFbmFibGVkXCI6XCJ3ZWJraXRJbWFnZVNtb290aGluZ0VuYWJsZWRcImluIHRoaXMuY29udGV4dD90aGlzLnNtb290aFByb3BlcnR5PVwid2Via2l0SW1hZ2VTbW9vdGhpbmdFbmFibGVkXCI6XCJtb3pJbWFnZVNtb290aGluZ0VuYWJsZWRcImluIHRoaXMuY29udGV4dD90aGlzLnNtb290aFByb3BlcnR5PVwibW96SW1hZ2VTbW9vdGhpbmdFbmFibGVkXCI6XCJvSW1hZ2VTbW9vdGhpbmdFbmFibGVkXCJpbiB0aGlzLmNvbnRleHQmJih0aGlzLnNtb290aFByb3BlcnR5PVwib0ltYWdlU21vb3RoaW5nRW5hYmxlZFwiKSx0aGlzLnNjYWxlTW9kZT1udWxsLHRoaXMucmVmcmVzaD0hMCx0aGlzLnZpZXcud2lkdGg9dGhpcy53aWR0aCx0aGlzLnZpZXcuaGVpZ2h0PXRoaXMuaGVpZ2h0LHRoaXMuY291bnQ9MH12YXIgcGxhdGZvcm09cmVxdWlyZShcIi4uLy4uL3BsYXRmb3JtXCIpLGdsb2JhbHM9cmVxdWlyZShcIi4uLy4uL2NvcmUvZ2xvYmFsc1wiKSxjYW52YXNHcmFwaGljcz1yZXF1aXJlKFwiLi9ncmFwaGljc1wiKSxCYXNlVGV4dHVyZT1yZXF1aXJlKFwiLi4vLi4vdGV4dHVyZXMvQmFzZVRleHR1cmVcIiksVGV4dHVyZT1yZXF1aXJlKFwiLi4vLi4vdGV4dHVyZXMvVGV4dHVyZVwiKSxTcHJpdGU9cmVxdWlyZShcIi4uLy4uL2Rpc3BsYXkvU3ByaXRlXCIpLFRpbGluZ1Nwcml0ZT1yZXF1aXJlKFwiLi4vLi4vZXh0cmFzL1RpbGluZ1Nwcml0ZVwiKSxTdHJpcD1yZXF1aXJlKFwiLi4vLi4vZXh0cmFzL1N0cmlwXCIpLEN1c3RvbVJlbmRlcmFibGU9cmVxdWlyZShcIi4uLy4uL2V4dHJhcy9DdXN0b21SZW5kZXJhYmxlXCIpLEdyYXBoaWNzPXJlcXVpcmUoXCIuLi8uLi9wcmltaXRpdmVzL0dyYXBoaWNzXCIpLEZpbHRlckJsb2NrPXJlcXVpcmUoXCIuLi8uLi9maWx0ZXJzL0ZpbHRlckJsb2NrXCIpLHByb3RvPUNhbnZhc1JlbmRlcmVyLnByb3RvdHlwZTtwcm90by5yZW5kZXI9ZnVuY3Rpb24oYSl7Z2xvYmFscy50ZXh0dXJlc1RvVXBkYXRlPVtdLGdsb2JhbHMudGV4dHVyZXNUb0Rlc3Ryb3k9W10sZ2xvYmFscy52aXNpYmxlQ291bnQrKyxhLnVwZGF0ZVRyYW5zZm9ybSgpLHRoaXMudmlldy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3I9PT1hLmJhY2tncm91bmRDb2xvclN0cmluZ3x8dGhpcy50cmFuc3BhcmVudHx8KHRoaXMudmlldy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3I9YS5iYWNrZ3JvdW5kQ29sb3JTdHJpbmcpLHRoaXMuY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwwLDAsMSwwLDApLHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwwLHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpLHRoaXMucmVuZGVyRGlzcGxheU9iamVjdChhKSxhLmludGVyYWN0aXZlJiYoYS5faW50ZXJhY3RpdmVFdmVudHNBZGRlZHx8KGEuX2ludGVyYWN0aXZlRXZlbnRzQWRkZWQ9ITAsYS5pbnRlcmFjdGlvbk1hbmFnZXIuc2V0VGFyZ2V0KHRoaXMpKSksVGV4dHVyZS5mcmFtZVVwZGF0ZXMubGVuZ3RoPjAmJihUZXh0dXJlLmZyYW1lVXBkYXRlcz1bXSl9LHByb3RvLnJlc2l6ZT1mdW5jdGlvbihhLGIpe3RoaXMud2lkdGg9YSx0aGlzLmhlaWdodD1iLHRoaXMudmlldy53aWR0aD1hLHRoaXMudmlldy5oZWlnaHQ9Yn0scHJvdG8ucmVuZGVyRGlzcGxheU9iamVjdD1mdW5jdGlvbihhKXt2YXIgYixjPXRoaXMuY29udGV4dDtjLmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbj1cInNvdXJjZS1vdmVyXCI7dmFyIGQ9YS5sYXN0Ll9pTmV4dDthPWEuZmlyc3Q7ZG8gaWYoYj1hLndvcmxkVHJhbnNmb3JtLGEudmlzaWJsZSlpZihhLnJlbmRlcmFibGUpe2lmKGEgaW5zdGFuY2VvZiBTcHJpdGUpe3ZhciBlPWEudGV4dHVyZS5mcmFtZTtlJiZlLndpZHRoJiZlLmhlaWdodCYmYS50ZXh0dXJlLmJhc2VUZXh0dXJlLnNvdXJjZSYmKGMuZ2xvYmFsQWxwaGE9YS53b3JsZEFscGhhLGMuc2V0VHJhbnNmb3JtKGJbMF0sYlszXSxiWzFdLGJbNF0sYlsyXSxiWzVdKSx0aGlzLnNtb290aFByb3BlcnR5JiZ0aGlzLnNjYWxlTW9kZSE9PWEudGV4dHVyZS5iYXNlVGV4dHVyZS5zY2FsZU1vZGUmJih0aGlzLnNjYWxlTW9kZT1hLnRleHR1cmUuYmFzZVRleHR1cmUuc2NhbGVNb2RlLGNbdGhpcy5zbW9vdGhQcm9wZXJ0eV09dGhpcy5zY2FsZU1vZGU9PT1CYXNlVGV4dHVyZS5TQ0FMRV9NT0RFLkxJTkVBUiksYy5kcmF3SW1hZ2UoYS50ZXh0dXJlLmJhc2VUZXh0dXJlLnNvdXJjZSxlLngsZS55LGUud2lkdGgsZS5oZWlnaHQsYS5hbmNob3IueCotZS53aWR0aCxhLmFuY2hvci55Ki1lLmhlaWdodCxlLndpZHRoLGUuaGVpZ2h0KSl9ZWxzZSBpZihhIGluc3RhbmNlb2YgU3RyaXApYy5zZXRUcmFuc2Zvcm0oYlswXSxiWzNdLGJbMV0sYls0XSxiWzJdLGJbNV0pLHRoaXMucmVuZGVyU3RyaXAoYSk7ZWxzZSBpZihhIGluc3RhbmNlb2YgVGlsaW5nU3ByaXRlKWMuc2V0VHJhbnNmb3JtKGJbMF0sYlszXSxiWzFdLGJbNF0sYlsyXSxiWzVdKSx0aGlzLnJlbmRlclRpbGluZ1Nwcml0ZShhKTtlbHNlIGlmKGEgaW5zdGFuY2VvZiBDdXN0b21SZW5kZXJhYmxlKWMuc2V0VHJhbnNmb3JtKGJbMF0sYlszXSxiWzFdLGJbNF0sYlsyXSxiWzVdKSxhLnJlbmRlckNhbnZhcyh0aGlzKTtlbHNlIGlmKGEgaW5zdGFuY2VvZiBHcmFwaGljcyljLnNldFRyYW5zZm9ybShiWzBdLGJbM10sYlsxXSxiWzRdLGJbMl0sYls1XSksY2FudmFzR3JhcGhpY3MucmVuZGVyR3JhcGhpY3MoYSxjKTtlbHNlIGlmKGEgaW5zdGFuY2VvZiBGaWx0ZXJCbG9jayYmYS5kYXRhIGluc3RhbmNlb2YgR3JhcGhpY3Mpe3ZhciBmPWEuZGF0YTtpZihhLm9wZW4pe2Muc2F2ZSgpO3ZhciBnPWYuYWxwaGEsaD1mLndvcmxkVHJhbnNmb3JtO2Muc2V0VHJhbnNmb3JtKGhbMF0saFszXSxoWzFdLGhbNF0saFsyXSxoWzVdKSxmLndvcmxkQWxwaGE9LjUsYy53b3JsZEFscGhhPTAsY2FudmFzR3JhcGhpY3MucmVuZGVyR3JhcGhpY3NNYXNrKGYsYyksYy5jbGlwKCksZi53b3JsZEFscGhhPWd9ZWxzZSBjLnJlc3RvcmUoKX1hPWEuX2lOZXh0fWVsc2UgYT1hLl9pTmV4dDtlbHNlIGE9YS5sYXN0Ll9pTmV4dDt3aGlsZShhIT09ZCl9LHByb3RvLnJlbmRlclN0cmlwRmxhdD1mdW5jdGlvbihhKXt2YXIgYj10aGlzLmNvbnRleHQsYz1hLnZlcnRpY2llcyxkPWMubGVuZ3RoLzI7dGhpcy5jb3VudCsrLGIuYmVnaW5QYXRoKCk7Zm9yKHZhciBlPTE7ZC0yPmU7ZSsrKXt2YXIgZj0yKmUsZz1jW2ZdLGg9Y1tmKzJdLGk9Y1tmKzRdLGo9Y1tmKzFdLGs9Y1tmKzNdLGw9Y1tmKzVdO2IubW92ZVRvKGcsaiksYi5saW5lVG8oaCxrKSxiLmxpbmVUbyhpLGwpfWIuZmlsbFN0eWxlPVwiI0ZGMDAwMFwiLGIuZmlsbCgpLGIuY2xvc2VQYXRoKCl9LHByb3RvLnJlbmRlclRpbGluZ1Nwcml0ZT1mdW5jdGlvbihhKXt2YXIgYj10aGlzLmNvbnRleHQ7Yi5nbG9iYWxBbHBoYT1hLndvcmxkQWxwaGEsYS5fX3RpbGVQYXR0ZXJufHwoYS5fX3RpbGVQYXR0ZXJuPWIuY3JlYXRlUGF0dGVybihhLnRleHR1cmUuYmFzZVRleHR1cmUuc291cmNlLFwicmVwZWF0XCIpKSxiLmJlZ2luUGF0aCgpO3ZhciBjPWEudGlsZVBvc2l0aW9uLGQ9YS50aWxlU2NhbGU7Yi5zY2FsZShkLngsZC55KSxiLnRyYW5zbGF0ZShjLngsYy55KSxiLmZpbGxTdHlsZT1hLl9fdGlsZVBhdHRlcm4sYi5maWxsUmVjdCgtYy54LC1jLnksYS53aWR0aC9kLngsYS5oZWlnaHQvZC55KSxiLnNjYWxlKDEvZC54LDEvZC55KSxiLnRyYW5zbGF0ZSgtYy54LC1jLnkpLGIuY2xvc2VQYXRoKCl9LHByb3RvLnJlbmRlclN0cmlwPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuY29udGV4dCxjPWEudmVydGljaWVzLGQ9YS51dnMsZT1jLmxlbmd0aC8yO3RoaXMuY291bnQrKztmb3IodmFyIGY9MTtlLTI+ZjtmKyspe3ZhciBnPTIqZixoPWNbZ10saT1jW2crMl0saj1jW2crNF0saz1jW2crMV0sbD1jW2crM10sbT1jW2crNV0sbj1kW2ddKmEudGV4dHVyZS53aWR0aCxvPWRbZysyXSphLnRleHR1cmUud2lkdGgscD1kW2crNF0qYS50ZXh0dXJlLndpZHRoLHE9ZFtnKzFdKmEudGV4dHVyZS5oZWlnaHQscj1kW2crM10qYS50ZXh0dXJlLmhlaWdodCxzPWRbZys1XSphLnRleHR1cmUuaGVpZ2h0O2Iuc2F2ZSgpLGIuYmVnaW5QYXRoKCksYi5tb3ZlVG8oaCxrKSxiLmxpbmVUbyhpLGwpLGIubGluZVRvKGosbSksYi5jbG9zZVBhdGgoKSxiLmNsaXAoKTt2YXIgdD1uKnIrcSpwK28qcy1yKnAtcSpvLW4qcyx1PWgqcitxKmoraSpzLXIqai1xKmktaCpzLHY9bippK2gqcCtvKmotaSpwLWgqby1uKmosdz1uKnIqaitxKmkqcCtoKm8qcy1oKnIqcC1xKm8qai1uKmkqcyx4PWsqcitxKm0rbCpzLXIqbS1xKmwtaypzLHk9bipsK2sqcCtvKm0tbCpwLWsqby1uKm0sej1uKnIqbStxKmwqcCtrKm8qcy1rKnIqcC1xKm8qbS1uKmwqcztiLnRyYW5zZm9ybSh1L3QseC90LHYvdCx5L3Qsdy90LHovdCksYi5kcmF3SW1hZ2UoYS50ZXh0dXJlLmJhc2VUZXh0dXJlLnNvdXJjZSwwLDApLGIucmVzdG9yZSgpfX0sbW9kdWxlLmV4cG9ydHM9Q2FudmFzUmVuZGVyZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7dmFyIHBsYXRmb3JtPXJlcXVpcmUoXCIuLi8uLi9wbGF0Zm9ybVwiKSxHcmFwaGljcz1yZXF1aXJlKFwiLi4vLi4vcHJpbWl0aXZlcy9HcmFwaGljc1wiKTtleHBvcnRzLnJlbmRlckdyYXBoaWNzPWZ1bmN0aW9uKGEsYil7Zm9yKHZhciBjLGQsZSxmLGc9YS53b3JsZEFscGhhLGg9XCJcIixpPTAsaj1hLmdyYXBoaWNzRGF0YS5sZW5ndGg7aj5pO2krKylpZihjPWEuZ3JhcGhpY3NEYXRhW2ldLGQ9Yy5wb2ludHMsaD1iLnN0cm9rZVN0eWxlPVwiI1wiKyhcIjAwMDAwXCIrKDB8Yy5saW5lQ29sb3IpLnRvU3RyaW5nKDE2KSkuc3Vic3RyKC02KSxiLmxpbmVXaWR0aD1jLmxpbmVXaWR0aCxjLnR5cGU9PT1HcmFwaGljcy5QT0xZKXtmb3IoYi5iZWdpblBhdGgoKSxiLm1vdmVUbyhkWzBdLGRbMV0pLGU9MSxmPWQubGVuZ3RoLzI7Zj5lO2UrKyliLmxpbmVUbyhkWzIqZV0sZFsyKmUrMV0pO2RbMF09PT1kW2QubGVuZ3RoLTJdJiZkWzFdPT09ZFtkLmxlbmd0aC0xXSYmYi5jbG9zZVBhdGgoKSxjLmZpbGwmJihiLmdsb2JhbEFscGhhPWMuZmlsbEFscGhhKmcsYi5maWxsU3R5bGU9aD1cIiNcIisoXCIwMDAwMFwiKygwfGMuZmlsbENvbG9yKS50b1N0cmluZygxNikpLnN1YnN0cigtNiksYi5maWxsKCkpLGMubGluZVdpZHRoJiYoYi5nbG9iYWxBbHBoYT1jLmxpbmVBbHBoYSpnLGIuc3Ryb2tlKCkpfWVsc2UgaWYoYy50eXBlPT09R3JhcGhpY3MuUkVDVCkoYy5maWxsQ29sb3J8fDA9PT1jLmZpbGxDb2xvcikmJihiLmdsb2JhbEFscGhhPWMuZmlsbEFscGhhKmcsYi5maWxsU3R5bGU9aD1cIiNcIisoXCIwMDAwMFwiKygwfGMuZmlsbENvbG9yKS50b1N0cmluZygxNikpLnN1YnN0cigtNiksYi5maWxsUmVjdChkWzBdLGRbMV0sZFsyXSxkWzNdKSksYy5saW5lV2lkdGgmJihiLmdsb2JhbEFscGhhPWMubGluZUFscGhhKmcsYi5zdHJva2VSZWN0KGRbMF0sZFsxXSxkWzJdLGRbM10pKTtlbHNlIGlmKGMudHlwZT09PUdyYXBoaWNzLkNJUkMpYi5iZWdpblBhdGgoKSxiLmFyYyhkWzBdLGRbMV0sZFsyXSwwLDIqTWF0aC5QSSksYi5jbG9zZVBhdGgoKSxjLmZpbGwmJihiLmdsb2JhbEFscGhhPWMuZmlsbEFscGhhKmcsYi5maWxsU3R5bGU9aD1cIiNcIisoXCIwMDAwMFwiKygwfGMuZmlsbENvbG9yKS50b1N0cmluZygxNikpLnN1YnN0cigtNiksYi5maWxsKCkpLGMubGluZVdpZHRoJiYoYi5nbG9iYWxBbHBoYT1jLmxpbmVBbHBoYSpnLGIuc3Ryb2tlKCkpO2Vsc2UgaWYoYy50eXBlPT09R3JhcGhpY3MuRUxJUCl7dmFyIGs9Yy5wb2ludHMsbD0yKmtbMl0sbT0yKmtbM10sbj1rWzBdLWwvMixvPWtbMV0tbS8yO2IuYmVnaW5QYXRoKCk7dmFyIHA9LjU1MjI4NDgscT1sLzIqcCxyPW0vMipwLHM9bitsLHQ9byttLHU9bitsLzIsdj1vK20vMjtiLm1vdmVUbyhuLHYpLGIuYmV6aWVyQ3VydmVUbyhuLHYtcix1LXEsbyx1LG8pLGIuYmV6aWVyQ3VydmVUbyh1K3EsbyxzLHYtcixzLHYpLGIuYmV6aWVyQ3VydmVUbyhzLHYrcix1K3EsdCx1LHQpLGIuYmV6aWVyQ3VydmVUbyh1LXEsdCxuLHYrcixuLHYpLGIuY2xvc2VQYXRoKCksYy5maWxsJiYoYi5nbG9iYWxBbHBoYT1jLmZpbGxBbHBoYSpnLGIuZmlsbFN0eWxlPWg9XCIjXCIrKFwiMDAwMDBcIisoMHxjLmZpbGxDb2xvcikudG9TdHJpbmcoMTYpKS5zdWJzdHIoLTYpLGIuZmlsbCgpKSxjLmxpbmVXaWR0aCYmKGIuZ2xvYmFsQWxwaGE9Yy5saW5lQWxwaGEqZyxiLnN0cm9rZSgpKX19LGV4cG9ydHMucmVuZGVyR3JhcGhpY3NNYXNrPWZ1bmN0aW9uKGEsYil7dmFyIGM9YS5ncmFwaGljc0RhdGEubGVuZ3RoO2lmKDAhPT1jKXtjPjEmJihjPTEscGxhdGZvcm0uY29uc29sZS53YXJuKFwiUGl4aS5qcyB3YXJuaW5nOiBtYXNrcyBpbiBjYW52YXMgY2FuIG9ubHkgbWFzayB1c2luZyB0aGUgZmlyc3QgcGF0aCBpbiB0aGUgZ3JhcGhpY3Mgb2JqZWN0XCIpKTtmb3IodmFyIGQ9MDsxPmQ7ZCsrKXt2YXIgZT1hLmdyYXBoaWNzRGF0YVtkXSxmPWUucG9pbnRzO2lmKGUudHlwZT09PUdyYXBoaWNzLlBPTFkpe2IuYmVnaW5QYXRoKCksYi5tb3ZlVG8oZlswXSxmWzFdKTtmb3IodmFyIGc9MTtnPGYubGVuZ3RoLzI7ZysrKWIubGluZVRvKGZbMipnXSxmWzIqZysxXSk7ZlswXT09PWZbZi5sZW5ndGgtMl0mJmZbMV09PT1mW2YubGVuZ3RoLTFdJiZiLmNsb3NlUGF0aCgpfWVsc2UgaWYoZS50eXBlPT09R3JhcGhpY3MuUkVDVCliLmJlZ2luUGF0aCgpLGIucmVjdChmWzBdLGZbMV0sZlsyXSxmWzNdKSxiLmNsb3NlUGF0aCgpO2Vsc2UgaWYoZS50eXBlPT09R3JhcGhpY3MuQ0lSQyliLmJlZ2luUGF0aCgpLGIuYXJjKGZbMF0sZlsxXSxmWzJdLDAsMipNYXRoLlBJKSxiLmNsb3NlUGF0aCgpO2Vsc2UgaWYoZS50eXBlPT09R3JhcGhpY3MuRUxJUCl7dmFyIGg9ZS5wb2ludHMsaT0yKmhbMl0saj0yKmhbM10saz1oWzBdLWkvMixsPWhbMV0tai8yO2IuYmVnaW5QYXRoKCk7dmFyIG09LjU1MjI4NDgsbj1pLzIqbSxvPWovMiptLHA9aytpLHE9bCtqLHI9aytpLzIscz1sK2ovMjtiLm1vdmVUbyhrLHMpLGIuYmV6aWVyQ3VydmVUbyhrLHMtbyxyLW4sbCxyLGwpLGIuYmV6aWVyQ3VydmVUbyhyK24sbCxwLHMtbyxwLHMpLGIuYmV6aWVyQ3VydmVUbyhwLHMrbyxyK24scSxyLHEpLGIuYmV6aWVyQ3VydmVUbyhyLW4scSxrLHMrbyxrLHMpLGIuY2xvc2VQYXRoKCl9fX19OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFBpeGlTaGFkZXIoKXt0aGlzLnByb2dyYW09bnVsbCx0aGlzLmZyYWdtZW50U3JjPVtcInByZWNpc2lvbiBsb3dwIGZsb2F0O1wiLFwidmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XCIsXCJ2YXJ5aW5nIGZsb2F0IHZDb2xvcjtcIixcInVuaWZvcm0gc2FtcGxlcjJEIHVTYW1wbGVyO1wiLFwidm9pZCBtYWluKHZvaWQpIHtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1U2FtcGxlciwgdlRleHR1cmVDb29yZCkgKiB2Q29sb3I7XCIsXCJ9XCJdLHRoaXMudGV4dHVyZUNvdW50PTB9dmFyIGNvbXBpbGU9cmVxdWlyZShcIi4vY29tcGlsZVwiKSxnbG9iYWxzPXJlcXVpcmUoXCIuLi8uLi9jb3JlL2dsb2JhbHNcIikscHJvdG89UGl4aVNoYWRlci5wcm90b3R5cGU7cHJvdG8uaW5pdD1mdW5jdGlvbigpe3ZhciBhPWdsb2JhbHMuZ2wsYj1jb21waWxlLnByb2dyYW0oYSx0aGlzLnZlcnRleFNyY3x8UGl4aVNoYWRlci5kZWZhdWx0VmVydGV4U3JjLHRoaXMuZnJhZ21lbnRTcmMpO2EudXNlUHJvZ3JhbShiKSx0aGlzLnVTYW1wbGVyPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJ1U2FtcGxlclwiKSx0aGlzLnByb2plY3Rpb25WZWN0b3I9YS5nZXRVbmlmb3JtTG9jYXRpb24oYixcInByb2plY3Rpb25WZWN0b3JcIiksdGhpcy5vZmZzZXRWZWN0b3I9YS5nZXRVbmlmb3JtTG9jYXRpb24oYixcIm9mZnNldFZlY3RvclwiKSx0aGlzLmRpbWVuc2lvbnM9YS5nZXRVbmlmb3JtTG9jYXRpb24oYixcImRpbWVuc2lvbnNcIiksdGhpcy5hVmVydGV4UG9zaXRpb249YS5nZXRBdHRyaWJMb2NhdGlvbihiLFwiYVZlcnRleFBvc2l0aW9uXCIpLHRoaXMuY29sb3JBdHRyaWJ1dGU9YS5nZXRBdHRyaWJMb2NhdGlvbihiLFwiYUNvbG9yXCIpLHRoaXMuYVRleHR1cmVDb29yZD1hLmdldEF0dHJpYkxvY2F0aW9uKGIsXCJhVGV4dHVyZUNvb3JkXCIpO2Zvcih2YXIgYyBpbiB0aGlzLnVuaWZvcm1zKXRoaXMudW5pZm9ybXNbY10udW5pZm9ybUxvY2F0aW9uPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsYyk7dGhpcy5pbml0VW5pZm9ybXMoKSx0aGlzLnByb2dyYW09Yn0scHJvdG8uaW5pdFVuaWZvcm1zPWZ1bmN0aW9uKCl7dGhpcy50ZXh0dXJlQ291bnQ9MTt2YXIgYTtmb3IodmFyIGIgaW4gdGhpcy51bmlmb3Jtcyl7YT10aGlzLnVuaWZvcm1zW2JdO3ZhciBjPWEudHlwZTtcInNhbXBsZXIyRFwiPT09Yz8oYS5faW5pdD0hMSxudWxsIT09YS52YWx1ZSYmdGhpcy5pbml0U2FtcGxlcjJEKGEpKTpcIm1hdDJcIj09PWN8fFwibWF0M1wiPT09Y3x8XCJtYXQ0XCI9PT1jPyhhLmdsTWF0cml4PSEwLGEuZ2xWYWx1ZUxlbmd0aD0xLFwibWF0MlwiPT09Yz9hLmdsRnVuYz1nbG9iYWxzLmdsLnVuaWZvcm1NYXRyaXgyZnY6XCJtYXQzXCI9PT1jP2EuZ2xGdW5jPWdsb2JhbHMuZ2wudW5pZm9ybU1hdHJpeDNmdjpcIm1hdDRcIj09PWMmJihhLmdsRnVuYz1nbG9iYWxzLmdsLnVuaWZvcm1NYXRyaXg0ZnYpKTooYS5nbEZ1bmM9Z2xvYmFscy5nbFtcInVuaWZvcm1cIitjXSxhLmdsVmFsdWVMZW5ndGg9XCIyZlwiPT09Y3x8XCIyaVwiPT09Yz8yOlwiM2ZcIj09PWN8fFwiM2lcIj09PWM/MzpcIjRmXCI9PT1jfHxcIjRpXCI9PT1jPzQ6MSl9fSxwcm90by5pbml0U2FtcGxlcjJEPWZ1bmN0aW9uKGEpe2lmKGEudmFsdWUmJmEudmFsdWUuYmFzZVRleHR1cmUmJmEudmFsdWUuYmFzZVRleHR1cmUuaGFzTG9hZGVkKXtpZihnbG9iYWxzLmdsLmFjdGl2ZVRleHR1cmUoZ2xvYmFscy5nbFtcIlRFWFRVUkVcIit0aGlzLnRleHR1cmVDb3VudF0pLGdsb2JhbHMuZ2wuYmluZFRleHR1cmUoZ2xvYmFscy5nbC5URVhUVVJFXzJELGEudmFsdWUuYmFzZVRleHR1cmUuX2dsVGV4dHVyZSksYS50ZXh0dXJlRGF0YSl7dmFyIGI9YS50ZXh0dXJlRGF0YSxjPWIubWFnRmlsdGVyP2IubWFnRmlsdGVyOmdsb2JhbHMuZ2wuTElORUFSLGQ9Yi5taW5GaWx0ZXI/Yi5taW5GaWx0ZXI6Z2xvYmFscy5nbC5MSU5FQVIsZT1iLndyYXBTP2Iud3JhcFM6Z2xvYmFscy5nbC5DTEFNUF9UT19FREdFLGY9Yi53cmFwVD9iLndyYXBUOmdsb2JhbHMuZ2wuQ0xBTVBfVE9fRURHRSxnPWIubHVtaW5hbmNlP2dsb2JhbHMuZ2wuTFVNSU5BTkNFOmdsb2JhbHMuZ2wuUkdCQTtpZihiLnJlcGVhdCYmKGU9Z2xvYmFscy5nbC5SRVBFQVQsZj1nbG9iYWxzLmdsLlJFUEVBVCksZ2xvYmFscy5nbC5waXhlbFN0b3JlaShnbG9iYWxzLmdsLlVOUEFDS19GTElQX1lfV0VCR0wsITEpLGIud2lkdGgpe3ZhciBoPWIud2lkdGg/Yi53aWR0aDo1MTIsaT1iLmhlaWdodD9iLmhlaWdodDoyLGo9Yi5ib3JkZXI/Yi5ib3JkZXI6MDtnbG9iYWxzLmdsLnRleEltYWdlMkQoZ2xvYmFscy5nbC5URVhUVVJFXzJELDAsZyxoLGksaixnLGdsb2JhbHMuZ2wuVU5TSUdORURfQllURSxudWxsKX1lbHNlIGdsb2JhbHMuZ2wudGV4SW1hZ2UyRChnbG9iYWxzLmdsLlRFWFRVUkVfMkQsMCxnLGdsb2JhbHMuZ2wuUkdCQSxnbG9iYWxzLmdsLlVOU0lHTkVEX0JZVEUsYS52YWx1ZS5iYXNlVGV4dHVyZS5zb3VyY2UpO2dsb2JhbHMuZ2wudGV4UGFyYW1ldGVyaShnbG9iYWxzLmdsLlRFWFRVUkVfMkQsZ2xvYmFscy5nbC5URVhUVVJFX01BR19GSUxURVIsYyksZ2xvYmFscy5nbC50ZXhQYXJhbWV0ZXJpKGdsb2JhbHMuZ2wuVEVYVFVSRV8yRCxnbG9iYWxzLmdsLlRFWFRVUkVfTUlOX0ZJTFRFUixkKSxnbG9iYWxzLmdsLnRleFBhcmFtZXRlcmkoZ2xvYmFscy5nbC5URVhUVVJFXzJELGdsb2JhbHMuZ2wuVEVYVFVSRV9XUkFQX1MsZSksZ2xvYmFscy5nbC50ZXhQYXJhbWV0ZXJpKGdsb2JhbHMuZ2wuVEVYVFVSRV8yRCxnbG9iYWxzLmdsLlRFWFRVUkVfV1JBUF9ULGYpfWdsb2JhbHMuZ2wudW5pZm9ybTFpKGEudW5pZm9ybUxvY2F0aW9uLHRoaXMudGV4dHVyZUNvdW50KSxhLl9pbml0PSEwLHRoaXMudGV4dHVyZUNvdW50Kyt9fSxwcm90by5zeW5jVW5pZm9ybXM9ZnVuY3Rpb24oKXt0aGlzLnRleHR1cmVDb3VudD0xO3ZhciBhO2Zvcih2YXIgYiBpbiB0aGlzLnVuaWZvcm1zKWE9dGhpcy51bmlmb3Jtc1tiXSwxPT09YS5nbFZhbHVlTGVuZ3RoP2EuZ2xNYXRyaXg9PT0hMD9hLmdsRnVuYy5jYWxsKGdsb2JhbHMuZ2wsYS51bmlmb3JtTG9jYXRpb24sYS50cmFuc3Bvc2UsYS52YWx1ZSk6YS5nbEZ1bmMuY2FsbChnbG9iYWxzLmdsLGEudW5pZm9ybUxvY2F0aW9uLGEudmFsdWUpOjI9PT1hLmdsVmFsdWVMZW5ndGg/YS5nbEZ1bmMuY2FsbChnbG9iYWxzLmdsLGEudW5pZm9ybUxvY2F0aW9uLGEudmFsdWUueCxhLnZhbHVlLnkpOjM9PT1hLmdsVmFsdWVMZW5ndGg/YS5nbEZ1bmMuY2FsbChnbG9iYWxzLmdsLGEudW5pZm9ybUxvY2F0aW9uLGEudmFsdWUueCxhLnZhbHVlLnksYS52YWx1ZS56KTo0PT09YS5nbFZhbHVlTGVuZ3RoP2EuZ2xGdW5jLmNhbGwoZ2xvYmFscy5nbCxhLnVuaWZvcm1Mb2NhdGlvbixhLnZhbHVlLngsYS52YWx1ZS55LGEudmFsdWUueixhLnZhbHVlLncpOlwic2FtcGxlcjJEXCI9PT1hLnR5cGUmJihhLl9pbml0PyhnbG9iYWxzLmdsLmFjdGl2ZVRleHR1cmUoZ2xvYmFscy5nbFtcIlRFWFRVUkVcIit0aGlzLnRleHR1cmVDb3VudF0pLGdsb2JhbHMuZ2wuYmluZFRleHR1cmUoZ2xvYmFscy5nbC5URVhUVVJFXzJELGEudmFsdWUuYmFzZVRleHR1cmUuX2dsVGV4dHVyZSksZ2xvYmFscy5nbC51bmlmb3JtMWkoYS51bmlmb3JtTG9jYXRpb24sdGhpcy50ZXh0dXJlQ291bnQpLHRoaXMudGV4dHVyZUNvdW50KyspOnRoaXMuaW5pdFNhbXBsZXIyRChhKSl9LFBpeGlTaGFkZXIuZGVmYXVsdFZlcnRleFNyYz1bXCJhdHRyaWJ1dGUgdmVjMiBhVmVydGV4UG9zaXRpb247XCIsXCJhdHRyaWJ1dGUgdmVjMiBhVGV4dHVyZUNvb3JkO1wiLFwiYXR0cmlidXRlIGZsb2F0IGFDb2xvcjtcIixcInVuaWZvcm0gdmVjMiBwcm9qZWN0aW9uVmVjdG9yO1wiLFwidW5pZm9ybSB2ZWMyIG9mZnNldFZlY3RvcjtcIixcInZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJjb25zdCB2ZWMyIGNlbnRlciA9IHZlYzIoLTEuMCwgMS4wKTtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICBnbF9Qb3NpdGlvbiA9IHZlYzQoICgoYVZlcnRleFBvc2l0aW9uICsgb2Zmc2V0VmVjdG9yKSAvIHByb2plY3Rpb25WZWN0b3IpICsgY2VudGVyICwgMC4wLCAxLjApO1wiLFwiICAgdlRleHR1cmVDb29yZCA9IGFUZXh0dXJlQ29vcmQ7XCIsXCIgICB2Q29sb3IgPSBhQ29sb3I7XCIsXCJ9XCJdLG1vZHVsZS5leHBvcnRzPVBpeGlTaGFkZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gUHJpbWl0aXZlU2hhZGVyKCl7dGhpcy5wcm9ncmFtPW51bGwsdGhpcy5mcmFnbWVudFNyYz1bXCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcInZhcnlpbmcgdmVjNCB2Q29sb3I7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgZ2xfRnJhZ0NvbG9yID0gdkNvbG9yO1wiLFwifVwiXSx0aGlzLnZlcnRleFNyYz1bXCJhdHRyaWJ1dGUgdmVjMiBhVmVydGV4UG9zaXRpb247XCIsXCJhdHRyaWJ1dGUgdmVjNCBhQ29sb3I7XCIsXCJ1bmlmb3JtIG1hdDMgdHJhbnNsYXRpb25NYXRyaXg7XCIsXCJ1bmlmb3JtIHZlYzIgcHJvamVjdGlvblZlY3RvcjtcIixcInVuaWZvcm0gdmVjMiBvZmZzZXRWZWN0b3I7XCIsXCJ1bmlmb3JtIGZsb2F0IGFscGhhO1wiLFwidmFyeWluZyB2ZWM0IHZDb2xvcjtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICB2ZWMzIHYgPSB0cmFuc2xhdGlvbk1hdHJpeCAqIHZlYzMoYVZlcnRleFBvc2l0aW9uICwgMS4wKTtcIixcIiAgIHYgLT0gb2Zmc2V0VmVjdG9yLnh5eDtcIixcIiAgIGdsX1Bvc2l0aW9uID0gdmVjNCggdi54IC8gcHJvamVjdGlvblZlY3Rvci54IC0xLjAsIHYueSAvIC1wcm9qZWN0aW9uVmVjdG9yLnkgKyAxLjAgLCAwLjAsIDEuMCk7XCIsXCIgICB2Q29sb3IgPSBhQ29sb3IgICogYWxwaGE7XCIsXCJ9XCJdfXZhciBjb21waWxlPXJlcXVpcmUoXCIuL2NvbXBpbGVcIiksZ2xvYmFscz1yZXF1aXJlKFwiLi4vLi4vY29yZS9nbG9iYWxzXCIpO1ByaW1pdGl2ZVNoYWRlci5wcm90b3R5cGUuaW5pdD1mdW5jdGlvbigpe3ZhciBhPWdsb2JhbHMuZ2wsYj1jb21waWxlLnByb2dyYW0oYSx0aGlzLnZlcnRleFNyYyx0aGlzLmZyYWdtZW50U3JjKTthLnVzZVByb2dyYW0oYiksdGhpcy5wcm9qZWN0aW9uVmVjdG9yPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJwcm9qZWN0aW9uVmVjdG9yXCIpLHRoaXMub2Zmc2V0VmVjdG9yPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJvZmZzZXRWZWN0b3JcIiksdGhpcy5hVmVydGV4UG9zaXRpb249YS5nZXRBdHRyaWJMb2NhdGlvbihiLFwiYVZlcnRleFBvc2l0aW9uXCIpLHRoaXMuY29sb3JBdHRyaWJ1dGU9YS5nZXRBdHRyaWJMb2NhdGlvbihiLFwiYUNvbG9yXCIpLHRoaXMudHJhbnNsYXRpb25NYXRyaXg9YS5nZXRVbmlmb3JtTG9jYXRpb24oYixcInRyYW5zbGF0aW9uTWF0cml4XCIpLHRoaXMuYWxwaGE9YS5nZXRVbmlmb3JtTG9jYXRpb24oYixcImFscGhhXCIpLHRoaXMucHJvZ3JhbT1ifSxtb2R1bGUuZXhwb3J0cz1QcmltaXRpdmVTaGFkZXI7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gU3RyaXBTaGFkZXIoKXt0aGlzLnByb2dyYW09bnVsbCx0aGlzLmZyYWdtZW50U3JjPVtcInByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1wiLFwidmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XCIsXCJ2YXJ5aW5nIGZsb2F0IHZDb2xvcjtcIixcInVuaWZvcm0gZmxvYXQgYWxwaGE7XCIsXCJ1bmlmb3JtIHNhbXBsZXIyRCB1U2FtcGxlcjtcIixcInZvaWQgbWFpbih2b2lkKSB7XCIsXCIgICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodVNhbXBsZXIsIHZlYzIodlRleHR1cmVDb29yZC54LCB2VGV4dHVyZUNvb3JkLnkpKTtcIixcIiAgIGdsX0ZyYWdDb2xvciA9IGdsX0ZyYWdDb2xvciAqIGFscGhhO1wiLFwifVwiXSx0aGlzLnZlcnRleFNyYz1bXCJhdHRyaWJ1dGUgdmVjMiBhVmVydGV4UG9zaXRpb247XCIsXCJhdHRyaWJ1dGUgdmVjMiBhVGV4dHVyZUNvb3JkO1wiLFwiYXR0cmlidXRlIGZsb2F0IGFDb2xvcjtcIixcInVuaWZvcm0gbWF0MyB0cmFuc2xhdGlvbk1hdHJpeDtcIixcInVuaWZvcm0gdmVjMiBwcm9qZWN0aW9uVmVjdG9yO1wiLFwidmFyeWluZyB2ZWMyIHZUZXh0dXJlQ29vcmQ7XCIsXCJ2YXJ5aW5nIHZlYzIgb2Zmc2V0VmVjdG9yO1wiLFwidmFyeWluZyBmbG9hdCB2Q29sb3I7XCIsXCJ2b2lkIG1haW4odm9pZCkge1wiLFwiICAgdmVjMyB2ID0gdHJhbnNsYXRpb25NYXRyaXggKiB2ZWMzKGFWZXJ0ZXhQb3NpdGlvbiwgMS4wKTtcIixcIiAgIHYgLT0gb2Zmc2V0VmVjdG9yLnh5eDtcIixcIiAgIGdsX1Bvc2l0aW9uID0gdmVjNCggdi54IC8gcHJvamVjdGlvblZlY3Rvci54IC0xLjAsIHYueSAvIHByb2plY3Rpb25WZWN0b3IueSArIDEuMCAsIDAuMCwgMS4wKTtcIixcIiAgIHZUZXh0dXJlQ29vcmQgPSBhVGV4dHVyZUNvb3JkO1wiLFwiICAgdkNvbG9yID0gYUNvbG9yO1wiLFwifVwiXX12YXIgY29tcGlsZT1yZXF1aXJlKFwiLi9jb21waWxlXCIpLGdsb2JhbHM9cmVxdWlyZShcIi4uLy4uL2NvcmUvZ2xvYmFsc1wiKTtTdHJpcFNoYWRlci5wcm90b3R5cGUuaW5pdD1mdW5jdGlvbigpe3ZhciBhPWdsb2JhbHMuZ2wsYj1jb21waWxlLnByb2dyYW0oYSx0aGlzLnZlcnRleFNyYyx0aGlzLmZyYWdtZW50U3JjKTthLnVzZVByb2dyYW0oYiksdGhpcy51U2FtcGxlcj1hLmdldFVuaWZvcm1Mb2NhdGlvbihiLFwidVNhbXBsZXJcIiksdGhpcy5wcm9qZWN0aW9uVmVjdG9yPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJwcm9qZWN0aW9uVmVjdG9yXCIpLHRoaXMub2Zmc2V0VmVjdG9yPWEuZ2V0VW5pZm9ybUxvY2F0aW9uKGIsXCJvZmZzZXRWZWN0b3JcIiksdGhpcy5jb2xvckF0dHJpYnV0ZT1hLmdldEF0dHJpYkxvY2F0aW9uKGIsXCJhQ29sb3JcIiksdGhpcy5hVmVydGV4UG9zaXRpb249YS5nZXRBdHRyaWJMb2NhdGlvbihiLFwiYVZlcnRleFBvc2l0aW9uXCIpLHRoaXMuYVRleHR1cmVDb29yZD1hLmdldEF0dHJpYkxvY2F0aW9uKGIsXCJhVGV4dHVyZUNvb3JkXCIpLHRoaXMudHJhbnNsYXRpb25NYXRyaXg9YS5nZXRVbmlmb3JtTG9jYXRpb24oYixcInRyYW5zbGF0aW9uTWF0cml4XCIpLHRoaXMuYWxwaGE9YS5nZXRVbmlmb3JtTG9jYXRpb24oYixcImFscGhhXCIpLHRoaXMucHJvZ3JhbT1ifSxtb2R1bGUuZXhwb3J0cz1TdHJpcFNoYWRlcjsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBXZWJHTEJhdGNoKGEpe3RoaXMuZ2w9YSx0aGlzLnNpemU9MCx0aGlzLnZlcnRleEJ1ZmZlcj1hLmNyZWF0ZUJ1ZmZlcigpLHRoaXMuaW5kZXhCdWZmZXI9YS5jcmVhdGVCdWZmZXIoKSx0aGlzLnV2QnVmZmVyPWEuY3JlYXRlQnVmZmVyKCksdGhpcy5jb2xvckJ1ZmZlcj1hLmNyZWF0ZUJ1ZmZlcigpLHRoaXMuYmxlbmRNb2RlPWJsZW5kTW9kZXMuTk9STUFMLHRoaXMuZHluYW1pY1NpemU9MX12YXIgZ2xvYmFscz1yZXF1aXJlKFwiLi4vLi4vY29yZS9nbG9iYWxzXCIpLGJsZW5kTW9kZXM9cmVxdWlyZShcIi4uLy4uL2Rpc3BsYXkvYmxlbmRNb2Rlc1wiKSxwcm90bz1XZWJHTEJhdGNoLnByb3RvdHlwZTtwcm90by5jbGVhbj1mdW5jdGlvbigpe3RoaXMudmVydGljaWVzPVtdLHRoaXMudXZzPVtdLHRoaXMuaW5kaWNlcz1bXSx0aGlzLmNvbG9ycz1bXSx0aGlzLmR5bmFtaWNTaXplPTEsdGhpcy50ZXh0dXJlPW51bGwsdGhpcy5sYXN0PW51bGwsdGhpcy5zaXplPTAsdGhpcy5oZWFkPW51bGwsdGhpcy50YWlsPW51bGx9LHByb3RvLnJlc3RvcmVMb3N0Q29udGV4dD1mdW5jdGlvbihhKXt0aGlzLmdsPWEsdGhpcy52ZXJ0ZXhCdWZmZXI9YS5jcmVhdGVCdWZmZXIoKSx0aGlzLmluZGV4QnVmZmVyPWEuY3JlYXRlQnVmZmVyKCksdGhpcy51dkJ1ZmZlcj1hLmNyZWF0ZUJ1ZmZlcigpLHRoaXMuY29sb3JCdWZmZXI9YS5jcmVhdGVCdWZmZXIoKX0scHJvdG8uaW5pdD1mdW5jdGlvbihhKXthLmJhdGNoPXRoaXMsdGhpcy5kaXJ0eT0hMCx0aGlzLmJsZW5kTW9kZT1hLmJsZW5kTW9kZSx0aGlzLnRleHR1cmU9YS50ZXh0dXJlLmJhc2VUZXh0dXJlLHRoaXMuaGVhZD1hLHRoaXMudGFpbD1hLHRoaXMuc2l6ZT0xLHRoaXMuZ3Jvd0JhdGNoKCl9LHByb3RvLmluc2VydEJlZm9yZT1mdW5jdGlvbihhLGIpe3RoaXMuc2l6ZSsrLGEuYmF0Y2g9dGhpcyx0aGlzLmRpcnR5PSEwO3ZhciBjPWIuX19wcmV2O2IuX19wcmV2PWEsYS5fX25leHQ9YixjPyhhLl9fcHJldj1jLGMuX19uZXh0PWEpOnRoaXMuaGVhZD1hfSxwcm90by5pbnNlcnRBZnRlcj1mdW5jdGlvbihhLGIpe3RoaXMuc2l6ZSsrLGEuYmF0Y2g9dGhpcyx0aGlzLmRpcnR5PSEwO3ZhciBjPWIuX19uZXh0O2IuX19uZXh0PWEsYS5fX3ByZXY9YixjPyhhLl9fbmV4dD1jLGMuX19wcmV2PWEpOnRoaXMudGFpbD1hfSxwcm90by5yZW1vdmU9ZnVuY3Rpb24oYSl7cmV0dXJuIHRoaXMuc2l6ZS0tLHRoaXMuc2l6ZT8oYS5fX3ByZXY/YS5fX3ByZXYuX19uZXh0PWEuX19uZXh0Oih0aGlzLmhlYWQ9YS5fX25leHQsdGhpcy5oZWFkLl9fcHJldj1udWxsKSxhLl9fbmV4dD9hLl9fbmV4dC5fX3ByZXY9YS5fX3ByZXY6KHRoaXMudGFpbD1hLl9fcHJldix0aGlzLnRhaWwuX19uZXh0PW51bGwpLGEuYmF0Y2g9bnVsbCxhLl9fbmV4dD1udWxsLGEuX19wcmV2PW51bGwsdGhpcy5kaXJ0eT0hMCx2b2lkIDApOihhLmJhdGNoPW51bGwsYS5fX3ByZXY9bnVsbCxhLl9fbmV4dD1udWxsLHZvaWQgMCl9LHByb3RvLnNwbGl0PWZ1bmN0aW9uKGEpe3RoaXMuZGlydHk9ITA7dmFyIGI9bmV3IFdlYkdMQmF0Y2godGhpcy5nbCk7Yi5pbml0KGEpLGIudGV4dHVyZT10aGlzLnRleHR1cmUsYi50YWlsPXRoaXMudGFpbCx0aGlzLnRhaWw9YS5fX3ByZXYsdGhpcy50YWlsLl9fbmV4dD1udWxsLGEuX19wcmV2PW51bGw7Zm9yKHZhciBjPTA7YTspYysrLGEuYmF0Y2g9YixhPWEuX19uZXh0O3JldHVybiBiLnNpemU9Yyx0aGlzLnNpemUtPWMsYn0scHJvdG8ubWVyZ2U9ZnVuY3Rpb24oYSl7dGhpcy5kaXJ0eT0hMCx0aGlzLnRhaWwuX19uZXh0PWEuaGVhZCxhLmhlYWQuX19wcmV2PXRoaXMudGFpbCx0aGlzLnNpemUrPWEuc2l6ZSx0aGlzLnRhaWw9YS50YWlsO2Zvcih2YXIgYj1hLmhlYWQ7YjspYi5iYXRjaD10aGlzLGI9Yi5fX25leHR9LHByb3RvLmdyb3dCYXRjaD1mdW5jdGlvbigpe3ZhciBhPXRoaXMuZ2w7dGhpcy5keW5hbWljU2l6ZT0xPT09dGhpcy5zaXplPzE6MS41KnRoaXMuc2l6ZSx0aGlzLnZlcnRpY2llcz1uZXcgRmxvYXQzMkFycmF5KDgqdGhpcy5keW5hbWljU2l6ZSksYS5iaW5kQnVmZmVyKGEuQVJSQVlfQlVGRkVSLHRoaXMudmVydGV4QnVmZmVyKSxhLmJ1ZmZlckRhdGEoYS5BUlJBWV9CVUZGRVIsdGhpcy52ZXJ0aWNpZXMsYS5EWU5BTUlDX0RSQVcpLHRoaXMudXZzPW5ldyBGbG9hdDMyQXJyYXkoOCp0aGlzLmR5bmFtaWNTaXplKSxhLmJpbmRCdWZmZXIoYS5BUlJBWV9CVUZGRVIsdGhpcy51dkJ1ZmZlciksYS5idWZmZXJEYXRhKGEuQVJSQVlfQlVGRkVSLHRoaXMudXZzLGEuRFlOQU1JQ19EUkFXKSx0aGlzLmRpcnR5VVZTPSEwLHRoaXMuY29sb3JzPW5ldyBGbG9hdDMyQXJyYXkoNCp0aGlzLmR5bmFtaWNTaXplKSxhLmJpbmRCdWZmZXIoYS5BUlJBWV9CVUZGRVIsdGhpcy5jb2xvckJ1ZmZlciksYS5idWZmZXJEYXRhKGEuQVJSQVlfQlVGRkVSLHRoaXMuY29sb3JzLGEuRFlOQU1JQ19EUkFXKSx0aGlzLmRpcnR5Q29sb3JzPSEwLHRoaXMuaW5kaWNlcz1uZXcgVWludDE2QXJyYXkoNip0aGlzLmR5bmFtaWNTaXplKTtmb3IodmFyIGI9MCxjPXRoaXMuaW5kaWNlcy5sZW5ndGgvNjtjPmI7YisrKXt2YXIgZD02KmIsZT00KmI7dGhpcy5pbmRpY2VzW2QrMF09ZSswLHRoaXMuaW5kaWNlc1tkKzFdPWUrMSx0aGlzLmluZGljZXNbZCsyXT1lKzIsdGhpcy5pbmRpY2VzW2QrM109ZSswLHRoaXMuaW5kaWNlc1tkKzRdPWUrMix0aGlzLmluZGljZXNbZCs1XT1lKzN9YS5iaW5kQnVmZmVyKGEuRUxFTUVOVF9BUlJBWV9CVUZGRVIsdGhpcy5pbmRleEJ1ZmZlciksYS5idWZmZXJEYXRhKGEuRUxFTUVOVF9BUlJBWV9CVUZGRVIsdGhpcy5pbmRpY2VzLGEuU1RBVElDX0RSQVcpfSxwcm90by5yZWZyZXNoPWZ1bmN0aW9uKCl7dGhpcy5keW5hbWljU2l6ZTx0aGlzLnNpemUmJnRoaXMuZ3Jvd0JhdGNoKCk7Zm9yKHZhciBhLGIsYz0wLGQ9dGhpcy5oZWFkO2Q7KXthPTgqYzt2YXIgZT1kLnRleHR1cmUsZj1lLmZyYW1lLGc9ZS5iYXNlVGV4dHVyZS53aWR0aCxoPWUuYmFzZVRleHR1cmUuaGVpZ2h0O3RoaXMudXZzW2ErMF09Zi54L2csdGhpcy51dnNbYSsxXT1mLnkvaCx0aGlzLnV2c1thKzJdPShmLngrZi53aWR0aCkvZyx0aGlzLnV2c1thKzNdPWYueS9oLHRoaXMudXZzW2ErNF09KGYueCtmLndpZHRoKS9nLHRoaXMudXZzW2ErNV09KGYueStmLmhlaWdodCkvaCx0aGlzLnV2c1thKzZdPWYueC9nLHRoaXMudXZzW2ErN109KGYueStmLmhlaWdodCkvaCxkLnVwZGF0ZUZyYW1lPSExLGI9NCpjLHRoaXMuY29sb3JzW2JdPXRoaXMuY29sb3JzW2IrMV09dGhpcy5jb2xvcnNbYisyXT10aGlzLmNvbG9yc1tiKzNdPWQud29ybGRBbHBoYSxkPWQuX19uZXh0LGMrK310aGlzLmRpcnR5VVZTPSEwLHRoaXMuZGlydHlDb2xvcnM9ITB9LHByb3RvLnVwZGF0ZT1mdW5jdGlvbigpe2Zvcih2YXIgYSxiLGMsZCxlLGYsZyxoLGksaixrLGwsbSxuLG8scCxxPTAscj10aGlzLmhlYWQscz10aGlzLnZlcnRpY2llcyx0PXRoaXMudXZzLHU9dGhpcy5jb2xvcnM7cjspe2lmKHIudmNvdW50PT09Z2xvYmFscy52aXNpYmxlQ291bnQpe2lmKGI9ci50ZXh0dXJlLmZyYW1lLndpZHRoLGM9ci50ZXh0dXJlLmZyYW1lLmhlaWdodCxkPXIuYW5jaG9yLngsZT1yLmFuY2hvci55LGY9YiooMS1kKSxnPWIqLWQsaD1jKigxLWUpLGk9YyotZSxqPTgqcSxhPXIud29ybGRUcmFuc2Zvcm0saz1hWzBdLGw9YVszXSxtPWFbMV0sbj1hWzRdLG89YVsyXSxwPWFbNV0sc1tqKzBdPWsqZyttKmkrbyxzW2orMV09bippK2wqZytwLHNbaisyXT1rKmYrbSppK28sc1tqKzNdPW4qaStsKmYrcCxzW2orNF09aypmK20qaCtvLHNbais1XT1uKmgrbCpmK3Asc1tqKzZdPWsqZyttKmgrbyxzW2orN109bipoK2wqZytwLHIudXBkYXRlRnJhbWV8fHIudGV4dHVyZS51cGRhdGVGcmFtZSl7dGhpcy5kaXJ0eVVWUz0hMDt2YXIgdj1yLnRleHR1cmUsdz12LmZyYW1lLHg9di5iYXNlVGV4dHVyZS53aWR0aCx5PXYuYmFzZVRleHR1cmUuaGVpZ2h0O3RbaiswXT13LngveCx0W2orMV09dy55L3ksdFtqKzJdPSh3Lngrdy53aWR0aCkveCx0W2orM109dy55L3ksdFtqKzRdPSh3Lngrdy53aWR0aCkveCx0W2orNV09KHcueSt3LmhlaWdodCkveSx0W2orNl09dy54L3gsdFtqKzddPSh3Lnkrdy5oZWlnaHQpL3ksci51cGRhdGVGcmFtZT0hMX1pZihyLmNhY2hlQWxwaGEhPT1yLndvcmxkQWxwaGEpe3IuY2FjaGVBbHBoYT1yLndvcmxkQWxwaGE7dmFyIHo9NCpxO3Vbel09dVt6KzFdPXVbeisyXT11W3orM109ci53b3JsZEFscGhhLHRoaXMuZGlydHlDb2xvcnM9ITB9fWVsc2Ugaj04KnEsc1tqKzBdPXNbaisxXT1zW2orMl09c1tqKzNdPXNbais0XT1zW2orNV09c1tqKzZdPXNbais3XT0wO3ErKyxyPXIuX19uZXh0fX0scHJvdG8ucmVuZGVyPWZ1bmN0aW9uKGEsYil7aWYoYT1hfHwwLGFyZ3VtZW50cy5sZW5ndGg8MiYmKGI9dGhpcy5zaXplKSx0aGlzLmRpcnR5JiYodGhpcy5yZWZyZXNoKCksdGhpcy5kaXJ0eT0hMSksdGhpcy5zaXplKXt0aGlzLnVwZGF0ZSgpO3ZhciBjPXRoaXMuZ2wsZD1nbG9iYWxzLmRlZmF1bHRTaGFkZXI7Yy5iaW5kQnVmZmVyKGMuQVJSQVlfQlVGRkVSLHRoaXMudmVydGV4QnVmZmVyKSxjLmJ1ZmZlclN1YkRhdGEoYy5BUlJBWV9CVUZGRVIsMCx0aGlzLnZlcnRpY2llcyksYy52ZXJ0ZXhBdHRyaWJQb2ludGVyKGQuYVZlcnRleFBvc2l0aW9uLDIsYy5GTE9BVCwhMSwwLDApLGMuYmluZEJ1ZmZlcihjLkFSUkFZX0JVRkZFUix0aGlzLnV2QnVmZmVyKSx0aGlzLmRpcnR5VVZTJiYodGhpcy5kaXJ0eVVWUz0hMSxjLmJ1ZmZlclN1YkRhdGEoYy5BUlJBWV9CVUZGRVIsMCx0aGlzLnV2cykpLGMudmVydGV4QXR0cmliUG9pbnRlcihkLmFUZXh0dXJlQ29vcmQsMixjLkZMT0FULCExLDAsMCksYy5hY3RpdmVUZXh0dXJlKGMuVEVYVFVSRTApLGMuYmluZFRleHR1cmUoYy5URVhUVVJFXzJELHRoaXMudGV4dHVyZS5fZ2xUZXh0dXJlKSxjLmJpbmRCdWZmZXIoYy5BUlJBWV9CVUZGRVIsdGhpcy5jb2xvckJ1ZmZlciksdGhpcy5kaXJ0eUNvbG9ycyYmKHRoaXMuZGlydHlDb2xvcnM9ITEsYy5idWZmZXJTdWJEYXRhKGMuQVJSQVlfQlVGRkVSLDAsdGhpcy5jb2xvcnMpKSxjLnZlcnRleEF0dHJpYlBvaW50ZXIoZC5jb2xvckF0dHJpYnV0ZSwxLGMuRkxPQVQsITEsMCwwKSxjLmJpbmRCdWZmZXIoYy5FTEVNRU5UX0FSUkFZX0JVRkZFUix0aGlzLmluZGV4QnVmZmVyKTt2YXIgZT1iLWE7Yy5kcmF3RWxlbWVudHMoYy5UUklBTkdMRVMsNiplLGMuVU5TSUdORURfU0hPUlQsMiphKjYpfX07dmFyIGJhdGNoZXM9W107V2ViR0xCYXRjaC5yZXN0b3JlQmF0Y2hlcz1mdW5jdGlvbihhKXtmb3IodmFyIGI9MCxjPWJhdGNoZXMubGVuZ3RoO2M+YjtiKyspYmF0Y2hlc1tiXS5yZXN0b3JlTG9zdENvbnRleHQoYSl9LFdlYkdMQmF0Y2guZ2V0QmF0Y2g9ZnVuY3Rpb24oKXtyZXR1cm4gYmF0Y2hlcy5sZW5ndGg/YmF0Y2hlcy5wb3AoKTpuZXcgV2ViR0xCYXRjaChnbG9iYWxzLmdsKX0sV2ViR0xCYXRjaC5yZXR1cm5CYXRjaD1mdW5jdGlvbihhKXthLmNsZWFuKCksYmF0Y2hlcy5wdXNoKGEpfSxtb2R1bGUuZXhwb3J0cz1XZWJHTEJhdGNoOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEZpbHRlclRleHR1cmUoYSxiKXt2YXIgYz1nbG9iYWxzLmdsO3RoaXMuZnJhbWVCdWZmZXI9Yy5jcmVhdGVGcmFtZWJ1ZmZlcigpLHRoaXMudGV4dHVyZT1jLmNyZWF0ZVRleHR1cmUoKSxjLmJpbmRUZXh0dXJlKGMuVEVYVFVSRV8yRCx0aGlzLnRleHR1cmUpLGMudGV4UGFyYW1ldGVyaShjLlRFWFRVUkVfMkQsYy5URVhUVVJFX01BR19GSUxURVIsYy5MSU5FQVIpLGMudGV4UGFyYW1ldGVyaShjLlRFWFRVUkVfMkQsYy5URVhUVVJFX01JTl9GSUxURVIsYy5MSU5FQVIpLGMudGV4UGFyYW1ldGVyaShjLlRFWFRVUkVfMkQsYy5URVhUVVJFX1dSQVBfUyxjLkNMQU1QX1RPX0VER0UpLGMudGV4UGFyYW1ldGVyaShjLlRFWFRVUkVfMkQsYy5URVhUVVJFX1dSQVBfVCxjLkNMQU1QX1RPX0VER0UpLGMuYmluZEZyYW1lYnVmZmVyKGMuRlJBTUVCVUZGRVIsdGhpcy5mcmFtZWJ1ZmZlciksYy5iaW5kRnJhbWVidWZmZXIoYy5GUkFNRUJVRkZFUix0aGlzLmZyYW1lQnVmZmVyKSxjLmZyYW1lYnVmZmVyVGV4dHVyZTJEKGMuRlJBTUVCVUZGRVIsYy5DT0xPUl9BVFRBQ0hNRU5UMCxjLlRFWFRVUkVfMkQsdGhpcy50ZXh0dXJlLDApLHRoaXMucmVzaXplKGEsYil9ZnVuY3Rpb24gV2ViR0xGaWx0ZXJNYW5hZ2VyKGEpe3RoaXMudHJhbnNwYXJlbnQ9YSx0aGlzLmZpbHRlclN0YWNrPVtdLHRoaXMudGV4dHVyZVBvb2w9W10sdGhpcy5vZmZzZXRYPTAsdGhpcy5vZmZzZXRZPTAsdGhpcy5pbml0U2hhZGVyQnVmZmVycygpfXZhciBnbG9iYWxzPXJlcXVpcmUoXCIuLi8uLi9jb3JlL2dsb2JhbHNcIiksU3ByaXRlPXJlcXVpcmUoXCIuLi8uLi9kaXNwbGF5L1Nwcml0ZVwiKSxHcmFwaGljcz1yZXF1aXJlKFwiLi4vLi4vcHJpbWl0aXZlcy9HcmFwaGljc1wiKSxQaXhpU2hhZGVyPXJlcXVpcmUoXCIuL1BpeGlTaGFkZXJcIik7RmlsdGVyVGV4dHVyZS5wcm90b3R5cGUucmVzaXplPWZ1bmN0aW9uKGEsYil7aWYodGhpcy53aWR0aCE9PWF8fHRoaXMuaGVpZ2h0IT09Yil7dGhpcy53aWR0aD1hLHRoaXMuaGVpZ2h0PWI7dmFyIGM9Z2xvYmFscy5nbDtjLmJpbmRUZXh0dXJlKGMuVEVYVFVSRV8yRCx0aGlzLnRleHR1cmUpLGMudGV4SW1hZ2UyRChjLlRFWFRVUkVfMkQsMCxjLlJHQkEsYSxiLDAsYy5SR0JBLGMuVU5TSUdORURfQllURSxudWxsKX19O3ZhciBwcm90bz1XZWJHTEZpbHRlck1hbmFnZXIucHJvdG90eXBlO3Byb3RvLmJlZ2luPWZ1bmN0aW9uKGEsYil7dGhpcy53aWR0aD0yKmEueCx0aGlzLmhlaWdodD0yKi1hLnksdGhpcy5idWZmZXI9Yn0scHJvdG8ucHVzaEZpbHRlcj1mdW5jdGlvbihhKXt2YXIgYj1nbG9iYWxzLmdsO3RoaXMuZmlsdGVyU3RhY2sucHVzaChhKTt2YXIgYz1hLmZpbHRlclBhc3Nlc1swXTt0aGlzLm9mZnNldFgrPWEudGFyZ2V0LmZpbHRlckFyZWEueCx0aGlzLm9mZnNldFkrPWEudGFyZ2V0LmZpbHRlckFyZWEueTt2YXIgZD10aGlzLnRleHR1cmVQb29sLnBvcCgpO2Q/ZC5yZXNpemUodGhpcy53aWR0aCx0aGlzLmhlaWdodCk6ZD1uZXcgRmlsdGVyVGV4dHVyZSh0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KSxiLmJpbmRUZXh0dXJlKGIuVEVYVFVSRV8yRCxkLnRleHR1cmUpLHRoaXMuZ2V0Qm91bmRzKGEudGFyZ2V0KTt2YXIgZT1hLnRhcmdldC5maWx0ZXJBcmVhLGY9Yy5wYWRkaW5nO2UueC09ZixlLnktPWYsZS53aWR0aCs9MipmLGUuaGVpZ2h0Kz0yKmYsZS54PDAmJihlLng9MCksZS53aWR0aD50aGlzLndpZHRoJiYoZS53aWR0aD10aGlzLndpZHRoKSxlLnk8MCYmKGUueT0wKSxlLmhlaWdodD50aGlzLmhlaWdodCYmKGUuaGVpZ2h0PXRoaXMuaGVpZ2h0KSxiLmJpbmRGcmFtZWJ1ZmZlcihiLkZSQU1FQlVGRkVSLGQuZnJhbWVCdWZmZXIpLGIudmlld3BvcnQoMCwwLGUud2lkdGgsZS5oZWlnaHQpLGdsb2JhbHMucHJvamVjdGlvbi54PWUud2lkdGgvMixnbG9iYWxzLnByb2plY3Rpb24ueT0tZS5oZWlnaHQvMixnbG9iYWxzLm9mZnNldC54PS1lLngsZ2xvYmFscy5vZmZzZXQueT0tZS55LGIudW5pZm9ybTJmKGdsb2JhbHMuZGVmYXVsdFNoYWRlci5wcm9qZWN0aW9uVmVjdG9yLGUud2lkdGgvMiwtZS5oZWlnaHQvMiksYi51bmlmb3JtMmYoZ2xvYmFscy5kZWZhdWx0U2hhZGVyLm9mZnNldFZlY3RvciwtZS54LC1lLnkpLGIuY29sb3JNYXNrKCEwLCEwLCEwLCEwKSxiLmNsZWFyQ29sb3IoMCwwLDAsMCksYi5jbGVhcihiLkNPTE9SX0JVRkZFUl9CSVQpLGEuX2dsRmlsdGVyVGV4dHVyZT1kfSxwcm90by5wb3BGaWx0ZXI9ZnVuY3Rpb24oKXt2YXIgYT1nbG9iYWxzLmdsLGI9dGhpcy5maWx0ZXJTdGFjay5wb3AoKSxjPWIudGFyZ2V0LmZpbHRlckFyZWEsZD1iLl9nbEZpbHRlclRleHR1cmU7aWYoYi5maWx0ZXJQYXNzZXMubGVuZ3RoPjEpe2Eudmlld3BvcnQoMCwwLGMud2lkdGgsYy5oZWlnaHQpLGEuYmluZEJ1ZmZlcihhLkFSUkFZX0JVRkZFUix0aGlzLnZlcnRleEJ1ZmZlciksdGhpcy52ZXJ0ZXhBcnJheVswXT0wLHRoaXMudmVydGV4QXJyYXlbMV09Yy5oZWlnaHQsdGhpcy52ZXJ0ZXhBcnJheVsyXT1jLndpZHRoLHRoaXMudmVydGV4QXJyYXlbM109Yy5oZWlnaHQsdGhpcy52ZXJ0ZXhBcnJheVs0XT0wLHRoaXMudmVydGV4QXJyYXlbNV09MCx0aGlzLnZlcnRleEFycmF5WzZdPWMud2lkdGgsdGhpcy52ZXJ0ZXhBcnJheVs3XT0wLGEuYnVmZmVyU3ViRGF0YShhLkFSUkFZX0JVRkZFUiwwLHRoaXMudmVydGV4QXJyYXkpLGEuYmluZEJ1ZmZlcihhLkFSUkFZX0JVRkZFUix0aGlzLnV2QnVmZmVyKSx0aGlzLnV2QXJyYXlbMl09Yy53aWR0aC90aGlzLndpZHRoLHRoaXMudXZBcnJheVs1XT1jLmhlaWdodC90aGlzLmhlaWdodCx0aGlzLnV2QXJyYXlbNl09Yy53aWR0aC90aGlzLndpZHRoLHRoaXMudXZBcnJheVs3XT1jLmhlaWdodC90aGlzLmhlaWdodCxhLmJ1ZmZlclN1YkRhdGEoYS5BUlJBWV9CVUZGRVIsMCx0aGlzLnV2QXJyYXkpO3ZhciBlPWQsZj10aGlzLnRleHR1cmVQb29sLnBvcCgpO2Z8fChmPW5ldyBGaWx0ZXJUZXh0dXJlKHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpKSxhLmJpbmRGcmFtZWJ1ZmZlcihhLkZSQU1FQlVGRkVSLGYuZnJhbWVCdWZmZXIpLGEuY2xlYXIoYS5DT0xPUl9CVUZGRVJfQklUKSxhLmRpc2FibGUoYS5CTEVORCk7Zm9yKHZhciBnPTA7ZzxiLmZpbHRlclBhc3Nlcy5sZW5ndGgtMTtnKyspe3ZhciBoPWIuZmlsdGVyUGFzc2VzW2ddO2EuYmluZEZyYW1lYnVmZmVyKGEuRlJBTUVCVUZGRVIsZi5mcmFtZUJ1ZmZlciksYS5hY3RpdmVUZXh0dXJlKGEuVEVYVFVSRTApLGEuYmluZFRleHR1cmUoYS5URVhUVVJFXzJELGUudGV4dHVyZSksdGhpcy5hcHBseUZpbHRlclBhc3MoaCxjLGMud2lkdGgsYy5oZWlnaHQpO3ZhciBpPWU7ZT1mLGY9aX1hLmVuYWJsZShhLkJMRU5EKSxkPWUsdGhpcy50ZXh0dXJlUG9vbC5wdXNoKGYpfXZhciBqPWIuZmlsdGVyUGFzc2VzW2IuZmlsdGVyUGFzc2VzLmxlbmd0aC0xXTt0aGlzLm9mZnNldFgtPWMueCx0aGlzLm9mZnNldFktPWMueTt2YXIgaz10aGlzLndpZHRoLGw9dGhpcy5oZWlnaHQsbT0wLG49MCxvPXRoaXMuYnVmZmVyO2lmKDA9PT10aGlzLmZpbHRlclN0YWNrLmxlbmd0aClhLmNvbG9yTWFzayghMCwhMCwhMCx0aGlzLnRyYW5zcGFyZW50KTtlbHNle3ZhciBwPXRoaXMuZmlsdGVyU3RhY2tbdGhpcy5maWx0ZXJTdGFjay5sZW5ndGgtMV07Yz1wLnRhcmdldC5maWx0ZXJBcmVhLGs9Yy53aWR0aCxsPWMuaGVpZ2h0LG09Yy54LG49Yy55LG89cC5fZ2xGaWx0ZXJUZXh0dXJlLmZyYW1lQnVmZmVyfWdsb2JhbHMucHJvamVjdGlvbi54PWsvMixnbG9iYWxzLnByb2plY3Rpb24ueT0tbC8yLGdsb2JhbHMub2Zmc2V0Lng9bSxnbG9iYWxzLm9mZnNldC55PW4sYz1iLnRhcmdldC5maWx0ZXJBcmVhO3ZhciBxPWMueC1tLHI9Yy55LW47YS5iaW5kQnVmZmVyKGEuQVJSQVlfQlVGRkVSLHRoaXMudmVydGV4QnVmZmVyKSx0aGlzLnZlcnRleEFycmF5WzBdPXEsdGhpcy52ZXJ0ZXhBcnJheVsxXT1yK2MuaGVpZ2h0LHRoaXMudmVydGV4QXJyYXlbMl09cStjLndpZHRoLHRoaXMudmVydGV4QXJyYXlbM109citjLmhlaWdodCx0aGlzLnZlcnRleEFycmF5WzRdPXEsdGhpcy52ZXJ0ZXhBcnJheVs1XT1yLHRoaXMudmVydGV4QXJyYXlbNl09cStjLndpZHRoLHRoaXMudmVydGV4QXJyYXlbN109cixhLmJ1ZmZlclN1YkRhdGEoYS5BUlJBWV9CVUZGRVIsMCx0aGlzLnZlcnRleEFycmF5KSxhLmJpbmRCdWZmZXIoYS5BUlJBWV9CVUZGRVIsdGhpcy51dkJ1ZmZlciksdGhpcy51dkFycmF5WzJdPWMud2lkdGgvdGhpcy53aWR0aCx0aGlzLnV2QXJyYXlbNV09Yy5oZWlnaHQvdGhpcy5oZWlnaHQsdGhpcy51dkFycmF5WzZdPWMud2lkdGgvdGhpcy53aWR0aCx0aGlzLnV2QXJyYXlbN109Yy5oZWlnaHQvdGhpcy5oZWlnaHQsYS5idWZmZXJTdWJEYXRhKGEuQVJSQVlfQlVGRkVSLDAsdGhpcy51dkFycmF5KSxhLnZpZXdwb3J0KDAsMCxrLGwpLGEuYmluZEZyYW1lYnVmZmVyKGEuRlJBTUVCVUZGRVIsbyksYS5hY3RpdmVUZXh0dXJlKGEuVEVYVFVSRTApLGEuYmluZFRleHR1cmUoYS5URVhUVVJFXzJELGQudGV4dHVyZSksdGhpcy5hcHBseUZpbHRlclBhc3MoaixjLGssbCksYS51c2VQcm9ncmFtKGdsb2JhbHMuZGVmYXVsdFNoYWRlci5wcm9ncmFtKSxhLnVuaWZvcm0yZihnbG9iYWxzLmRlZmF1bHRTaGFkZXIucHJvamVjdGlvblZlY3RvcixrLzIsLWwvMiksYS51bmlmb3JtMmYoZ2xvYmFscy5kZWZhdWx0U2hhZGVyLm9mZnNldFZlY3RvciwtbSwtbiksdGhpcy50ZXh0dXJlUG9vbC5wdXNoKGQpLGIuX2dsRmlsdGVyVGV4dHVyZT1udWxsfSxwcm90by5hcHBseUZpbHRlclBhc3M9ZnVuY3Rpb24oYSxiLGMsZCl7dmFyIGU9Z2xvYmFscy5nbCxmPWEuc2hhZGVyO2Z8fChmPW5ldyBQaXhpU2hhZGVyLGYuZnJhZ21lbnRTcmM9YS5mcmFnbWVudFNyYyxmLnVuaWZvcm1zPWEudW5pZm9ybXMsZi5pbml0KCksYS5zaGFkZXI9ZiksZS51c2VQcm9ncmFtKGYucHJvZ3JhbSksZS51bmlmb3JtMmYoZi5wcm9qZWN0aW9uVmVjdG9yLGMvMiwtZC8yKSxlLnVuaWZvcm0yZihmLm9mZnNldFZlY3RvciwwLDApLGEudW5pZm9ybXMuZGltZW5zaW9ucyYmKGEudW5pZm9ybXMuZGltZW5zaW9ucy52YWx1ZVswXT10aGlzLndpZHRoLGEudW5pZm9ybXMuZGltZW5zaW9ucy52YWx1ZVsxXT10aGlzLmhlaWdodCxhLnVuaWZvcm1zLmRpbWVuc2lvbnMudmFsdWVbMl09dGhpcy52ZXJ0ZXhBcnJheVswXSxhLnVuaWZvcm1zLmRpbWVuc2lvbnMudmFsdWVbM109dGhpcy52ZXJ0ZXhBcnJheVs1XSksZi5zeW5jVW5pZm9ybXMoKSxlLmJpbmRCdWZmZXIoZS5BUlJBWV9CVUZGRVIsdGhpcy52ZXJ0ZXhCdWZmZXIpLGUudmVydGV4QXR0cmliUG9pbnRlcihmLmFWZXJ0ZXhQb3NpdGlvbiwyLGUuRkxPQVQsITEsMCwwKSxlLmJpbmRCdWZmZXIoZS5BUlJBWV9CVUZGRVIsdGhpcy51dkJ1ZmZlciksZS52ZXJ0ZXhBdHRyaWJQb2ludGVyKGYuYVRleHR1cmVDb29yZCwyLGUuRkxPQVQsITEsMCwwKSxlLmJpbmRCdWZmZXIoZS5FTEVNRU5UX0FSUkFZX0JVRkZFUix0aGlzLmluZGV4QnVmZmVyKSxlLmRyYXdFbGVtZW50cyhlLlRSSUFOR0xFUyw2LGUuVU5TSUdORURfU0hPUlQsMCl9LHByb3RvLmluaXRTaGFkZXJCdWZmZXJzPWZ1bmN0aW9uKCl7dmFyIGE9Z2xvYmFscy5nbDt0aGlzLnZlcnRleEJ1ZmZlcj1hLmNyZWF0ZUJ1ZmZlcigpLHRoaXMudXZCdWZmZXI9YS5jcmVhdGVCdWZmZXIoKSx0aGlzLmluZGV4QnVmZmVyPWEuY3JlYXRlQnVmZmVyKCksdGhpcy52ZXJ0ZXhBcnJheT1uZXcgRmxvYXQzMkFycmF5KFswLDAsMSwwLDAsMSwxLDFdKSxhLmJpbmRCdWZmZXIoYS5BUlJBWV9CVUZGRVIsdGhpcy52ZXJ0ZXhCdWZmZXIpLGEuYnVmZmVyRGF0YShhLkFSUkFZX0JVRkZFUix0aGlzLnZlcnRleEFycmF5LGEuU1RBVElDX0RSQVcpLHRoaXMudXZBcnJheT1uZXcgRmxvYXQzMkFycmF5KFswLDAsMSwwLDAsMSwxLDFdKSxhLmJpbmRCdWZmZXIoYS5BUlJBWV9CVUZGRVIsdGhpcy51dkJ1ZmZlciksYS5idWZmZXJEYXRhKGEuQVJSQVlfQlVGRkVSLHRoaXMudXZBcnJheSxhLlNUQVRJQ19EUkFXKSxhLmJpbmRCdWZmZXIoYS5FTEVNRU5UX0FSUkFZX0JVRkZFUix0aGlzLmluZGV4QnVmZmVyKSxhLmJ1ZmZlckRhdGEoYS5FTEVNRU5UX0FSUkFZX0JVRkZFUixuZXcgVWludDE2QXJyYXkoWzAsMSwyLDEsMywyXSksYS5TVEFUSUNfRFJBVyl9LHByb3RvLmdldEJvdW5kcz1mdW5jdGlvbihhKXt2YXIgYixjLGQsZSxmLGcsaCxpLGosayxsLG0sbixvLHAscSxyLHMsdCx1LHYsdyx4LHksej1hLmZpcnN0LEE9YS5sYXN0Ll9pTmV4dCxCPS0xLzAsQz0tMS8wLEQ9MS8wLEU9MS8wO2Rve2lmKHoudmlzaWJsZSlpZih6IGluc3RhbmNlb2YgU3ByaXRlKWM9ei50ZXh0dXJlLmZyYW1lLndpZHRoLGQ9ei50ZXh0dXJlLmZyYW1lLmhlaWdodCxlPXouYW5jaG9yLngsZj16LmFuY2hvci55LGc9YyooMS1lKSxoPWMqLWUsaT1kKigxLWYpLGo9ZCotZixrPSEwO2Vsc2UgaWYoeiBpbnN0YW5jZW9mIEdyYXBoaWNzKXt6LnVwZGF0ZUZpbHRlckJvdW5kcygpO3ZhciBGPXouYm91bmRzO2M9Ri53aWR0aCxkPUYuaGVpZ2h0LGc9Ri54LGg9Ri54K0Yud2lkdGgsaT1GLnksaj1GLnkrRi5oZWlnaHQsaz0hMH1rJiYoYj16LndvcmxkVHJhbnNmb3JtLGw9YlswXSxtPWJbM10sbj1iWzFdLG89Yls0XSxwPWJbMl0scT1iWzVdLHI9bCpoK24qaitwLHY9bypqK20qaCtxLHM9bCpnK24qaitwLHc9bypqK20qZytxLHQ9bCpnK24qaStwLHg9byppK20qZytxLHU9bCpoK24qaStwLHk9byppK20qaCtxLEQ9RD5yP3I6RCxEPUQ+cz9zOkQsRD1EPnQ/dDpELEQ9RD51P3U6RCxFPUU+dj92OkUsRT1FPnc/dzpFLEU9RT54P3g6RSxFPUU+eT95OkUsQj1yPkI/cjpCLEI9cz5CP3M6QixCPXQ+Qj90OkIsQj11PkI/dTpCLEM9dj5DP3Y6QyxDPXc+Qz93OkMsQz14PkM/eDpDLEM9eT5DP3k6Qyksaz0hMSx6PXouX2lOZXh0fXdoaWxlKHohPT1BKTthLmZpbHRlckFyZWEueD1ELGEuZmlsdGVyQXJlYS55PUUsYS5maWx0ZXJBcmVhLndpZHRoPUItRCxhLmZpbHRlckFyZWEuaGVpZ2h0PUMtRX0sbW9kdWxlLmV4cG9ydHM9V2ViR0xGaWx0ZXJNYW5hZ2VyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFdlYkdMUmVuZGVyR3JvdXAoYSxiKXt0aGlzLmdsPWEsdGhpcy5yb290PW51bGwsdGhpcy5iYWNrZ3JvdW5kQ29sb3I9dm9pZCAwLHRoaXMudHJhbnNwYXJlbnQ9dm9pZCAwPT09Yj8hMDpiLHRoaXMuYmF0Y2hzPVtdLHRoaXMudG9SZW1vdmU9W10sdGhpcy5maWx0ZXJNYW5hZ2VyPW5ldyBXZWJHTEZpbHRlck1hbmFnZXIodGhpcy50cmFuc3BhcmVudCl9dmFyIGdsb2JhbHM9cmVxdWlyZShcIi4uLy4uL2NvcmUvZ2xvYmFsc1wiKSxzaGFkZXJzPXJlcXVpcmUoXCIuL3NoYWRlcnNcIiksd2ViZ2xHcmFwaGljcz1yZXF1aXJlKFwiLi9ncmFwaGljc1wiKSxXZWJHTEJhdGNoPXJlcXVpcmUoXCIuL1dlYkdMQmF0Y2hcIiksV2ViR0xGaWx0ZXJNYW5hZ2VyPXJlcXVpcmUoXCIuL1dlYkdMRmlsdGVyTWFuYWdlclwiKSxtYXQzPXJlcXVpcmUoXCIuLi8uLi9nZW9tL21hdHJpeFwiKS5tYXQzLEJhc2VUZXh0dXJlPXJlcXVpcmUoXCIuLi8uLi90ZXh0dXJlcy9CYXNlVGV4dHVyZVwiKSxUaWxpbmdTcHJpdGU9cmVxdWlyZShcIi4uLy4uL2V4dHJhcy9UaWxpbmdTcHJpdGVcIiksU3RyaXA9cmVxdWlyZShcIi4uLy4uL2V4dHJhcy9TdHJpcFwiKSxHcmFwaGljcz1yZXF1aXJlKFwiLi4vLi4vcHJpbWl0aXZlcy9HcmFwaGljc1wiKSxGaWx0ZXJCbG9jaz1yZXF1aXJlKFwiLi4vLi4vZmlsdGVycy9GaWx0ZXJCbG9ja1wiKSxTcHJpdGU9cmVxdWlyZShcIi4uLy4uL2Rpc3BsYXkvU3ByaXRlXCIpLEN1c3RvbVJlbmRlcmFibGU9cmVxdWlyZShcIi4uLy4uL2V4dHJhcy9DdXN0b21SZW5kZXJhYmxlXCIpLHByb3RvPVdlYkdMUmVuZGVyR3JvdXAucHJvdG90eXBlO3Byb3RvLnNldFJlbmRlcmFibGU9ZnVuY3Rpb24oYSl7dGhpcy5yb290JiZ0aGlzLnJlbW92ZURpc3BsYXlPYmplY3RBbmRDaGlsZHJlbih0aGlzLnJvb3QpLGEud29ybGRWaXNpYmxlPWEudmlzaWJsZSx0aGlzLnJvb3Q9YSx0aGlzLmFkZERpc3BsYXlPYmplY3RBbmRDaGlsZHJlbihhKX0scHJvdG8ucmVuZGVyPWZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcy5nbDtXZWJHTFJlbmRlckdyb3VwLnVwZGF0ZVRleHR1cmVzKGMpLGMudW5pZm9ybTJmKGdsb2JhbHMuZGVmYXVsdFNoYWRlci5wcm9qZWN0aW9uVmVjdG9yLGEueCxhLnkpLHRoaXMuZmlsdGVyTWFuYWdlci5iZWdpbihhLGIpLGMuYmxlbmRGdW5jKGMuT05FLGMuT05FX01JTlVTX1NSQ19BTFBIQSk7Zm9yKHZhciBkLGU9MDtlPHRoaXMuYmF0Y2hzLmxlbmd0aDtlKyspZD10aGlzLmJhdGNoc1tlXSxkIGluc3RhbmNlb2YgV2ViR0xCYXRjaD90aGlzLmJhdGNoc1tlXS5yZW5kZXIoKTp0aGlzLnJlbmRlclNwZWNpYWwoZCxhKX0scHJvdG8uaGFuZGxlRmlsdGVyPWZ1bmN0aW9uKCl7fSxwcm90by5yZW5kZXJTcGVjaWZpYz1mdW5jdGlvbihhLGIsYyl7dmFyIGQ9dGhpcy5nbDtXZWJHTFJlbmRlckdyb3VwLnVwZGF0ZVRleHR1cmVzKGQpLGQudW5pZm9ybTJmKGdsb2JhbHMuZGVmYXVsdFNoYWRlci5wcm9qZWN0aW9uVmVjdG9yLGIueCxiLnkpLHRoaXMuZmlsdGVyTWFuYWdlci5iZWdpbihiLGMpO2Zvcih2YXIgZSxmLGcsaCxpLGosaz1hLmZpcnN0O2suX2lOZXh0JiYoIWsucmVuZGVyYWJsZXx8IWsuX19yZW5kZXJHcm91cCk7KWs9ay5faU5leHQ7dmFyIGw9ay5iYXRjaDtpZihrIGluc3RhbmNlb2YgU3ByaXRlKWlmKGw9ay5iYXRjaCxqPWwuaGVhZCxqPT09ayllPTA7ZWxzZSBmb3IoZT0xO2ouX19uZXh0IT09azspZSsrLGo9ai5fX25leHQ7ZWxzZSBsPWs7Zm9yKHZhciBtPWEubGFzdDttLl9pUHJldiYmKCFtLnJlbmRlcmFibGV8fCFtLl9fcmVuZGVyR3JvdXApOyltPW0uX2lOZXh0O2lmKG0gaW5zdGFuY2VvZiBTcHJpdGUpaWYoaT1tLmJhdGNoLGo9aS5oZWFkLGo9PT1tKWc9MDtlbHNlIGZvcihnPTE7ai5fX25leHQhPT1tOylnKyssaj1qLl9fbmV4dDtlbHNlIGk9bTtpZihsPT09aSlyZXR1cm4gbCBpbnN0YW5jZW9mIFdlYkdMQmF0Y2g/bC5yZW5kZXIoZSxnKzEpOnRoaXMucmVuZGVyU3BlY2lhbChsLGIpLHZvaWQgMDtmPXRoaXMuYmF0Y2hzLmluZGV4T2YobCksaD10aGlzLmJhdGNocy5pbmRleE9mKGkpLGwgaW5zdGFuY2VvZiBXZWJHTEJhdGNoP2wucmVuZGVyKGUpOnRoaXMucmVuZGVyU3BlY2lhbChsLGIpO2Zvcih2YXIgbixvPWYrMTtoPm87bysrKW49dGhpcy5iYXRjaHNbb10sbiBpbnN0YW5jZW9mIFdlYkdMQmF0Y2g/dGhpcy5iYXRjaHNbb10ucmVuZGVyKCk6dGhpcy5yZW5kZXJTcGVjaWFsKG4sYik7aSBpbnN0YW5jZW9mIFdlYkdMQmF0Y2g/aS5yZW5kZXIoMCxnKzEpOnRoaXMucmVuZGVyU3BlY2lhbChpLGIpfSxwcm90by5yZW5kZXJTcGVjaWFsPWZ1bmN0aW9uKGEsYil7dmFyIGM9YS52Y291bnQ9PT1nbG9iYWxzLnZpc2libGVDb3VudDthIGluc3RhbmNlb2YgVGlsaW5nU3ByaXRlP2MmJnRoaXMucmVuZGVyVGlsaW5nU3ByaXRlKGEsYik6YSBpbnN0YW5jZW9mIFN0cmlwP2MmJnRoaXMucmVuZGVyU3RyaXAoYSxiKTphIGluc3RhbmNlb2YgQ3VzdG9tUmVuZGVyYWJsZT9jJiZhLnJlbmRlcldlYkdMKHRoaXMsYik6YSBpbnN0YW5jZW9mIEdyYXBoaWNzP2MmJmEucmVuZGVyYWJsZSYmd2ViZ2xHcmFwaGljcy5yZW5kZXJHcmFwaGljcyhhLGIpOmEgaW5zdGFuY2VvZiBGaWx0ZXJCbG9jayYmdGhpcy5oYW5kbGVGaWx0ZXJCbG9jayhhLGIpfTt2YXIgbWFza1N0YWNrPVtdO3Byb3RvLmhhbmRsZUZpbHRlckJsb2NrPWZ1bmN0aW9uKGEsYil7dmFyIGM9Z2xvYmFscy5nbDtpZihhLm9wZW4pYS5kYXRhIGluc3RhbmNlb2YgQXJyYXk/dGhpcy5maWx0ZXJNYW5hZ2VyLnB1c2hGaWx0ZXIoYSk6KG1hc2tTdGFjay5wdXNoKGEpLGMuZW5hYmxlKGMuU1RFTkNJTF9URVNUKSxjLmNvbG9yTWFzayghMSwhMSwhMSwhMSksYy5zdGVuY2lsRnVuYyhjLkFMV0FZUywxLDEpLGMuc3RlbmNpbE9wKGMuS0VFUCxjLktFRVAsYy5JTkNSKSx3ZWJnbEdyYXBoaWNzLnJlbmRlckdyYXBoaWNzKGEuZGF0YSxiKSxjLmNvbG9yTWFzayghMCwhMCwhMCwhMCksYy5zdGVuY2lsRnVuYyhjLk5PVEVRVUFMLDAsbWFza1N0YWNrLmxlbmd0aCksYy5zdGVuY2lsT3AoYy5LRUVQLGMuS0VFUCxjLktFRVApKTtlbHNlIGlmKGEuZGF0YSBpbnN0YW5jZW9mIEFycmF5KXRoaXMuZmlsdGVyTWFuYWdlci5wb3BGaWx0ZXIoKTtlbHNle3ZhciBkPW1hc2tTdGFjay5wb3AoYSk7ZCYmKGMuY29sb3JNYXNrKCExLCExLCExLCExKSxjLnN0ZW5jaWxGdW5jKGMuQUxXQVlTLDEsMSksYy5zdGVuY2lsT3AoYy5LRUVQLGMuS0VFUCxjLkRFQ1IpLHdlYmdsR3JhcGhpY3MucmVuZGVyR3JhcGhpY3MoZC5kYXRhLGIpLGMuY29sb3JNYXNrKCEwLCEwLCEwLCEwKSxjLnN0ZW5jaWxGdW5jKGMuTk9URVFVQUwsMCxtYXNrU3RhY2subGVuZ3RoKSxjLnN0ZW5jaWxPcChjLktFRVAsYy5LRUVQLGMuS0VFUCkpLGMuZGlzYWJsZShjLlNURU5DSUxfVEVTVCl9fSxwcm90by51cGRhdGVUZXh0dXJlPWZ1bmN0aW9uKGEpe3RoaXMucmVtb3ZlT2JqZWN0KGEpO2Zvcih2YXIgYj1hLmZpcnN0O2IhPT10aGlzLnJvb3QmJihiPWIuX2lQcmV2LCFiLnJlbmRlcmFibGV8fCFiLl9fcmVuZGVyR3JvdXApOyk7Zm9yKHZhciBjPWEubGFzdDtjLl9pTmV4dCYmKGM9Yy5faU5leHQsIWMucmVuZGVyYWJsZXx8IWMuX19yZW5kZXJHcm91cCk7KTt0aGlzLmluc2VydE9iamVjdChhLGIsYyl9LHByb3RvLmFkZEZpbHRlckJsb2Nrcz1mdW5jdGlvbihhLGIpe2EuX19yZW5kZXJHcm91cD10aGlzLGIuX19yZW5kZXJHcm91cD10aGlzO2Zvcih2YXIgYz1hO2MhPT10aGlzLnJvb3QuZmlyc3QmJihjPWMuX2lQcmV2LCFjLnJlbmRlcmFibGV8fCFjLl9fcmVuZGVyR3JvdXApOyk7dGhpcy5pbnNlcnRBZnRlcihhLGMpO2Zvcih2YXIgZD1iO2QhPT10aGlzLnJvb3QuZmlyc3QmJihkPWQuX2lQcmV2LCFkLnJlbmRlcmFibGV8fCFkLl9fcmVuZGVyR3JvdXApOyk7dGhpcy5pbnNlcnRBZnRlcihiLGQpfSxwcm90by5yZW1vdmVGaWx0ZXJCbG9ja3M9ZnVuY3Rpb24oYSxiKXt0aGlzLnJlbW92ZU9iamVjdChhKSx0aGlzLnJlbW92ZU9iamVjdChiKX0scHJvdG8uYWRkRGlzcGxheU9iamVjdEFuZENoaWxkcmVuPWZ1bmN0aW9uKGEpe2EuX19yZW5kZXJHcm91cCYmYS5fX3JlbmRlckdyb3VwLnJlbW92ZURpc3BsYXlPYmplY3RBbmRDaGlsZHJlbihhKTtmb3IodmFyIGI9YS5maXJzdDtiIT09dGhpcy5yb290LmZpcnN0JiYoYj1iLl9pUHJldiwhYi5yZW5kZXJhYmxlfHwhYi5fX3JlbmRlckdyb3VwKTspO2Zvcih2YXIgYz1hLmxhc3Q7Yy5faU5leHQmJihjPWMuX2lOZXh0LCFjLnJlbmRlcmFibGV8fCFjLl9fcmVuZGVyR3JvdXApOyk7dmFyIGQ9YS5maXJzdCxlPWEubGFzdC5faU5leHQ7ZG8gZC5fX3JlbmRlckdyb3VwPXRoaXMsZC5yZW5kZXJhYmxlJiYodGhpcy5pbnNlcnRPYmplY3QoZCxiLGMpLGI9ZCksZD1kLl9pTmV4dDt3aGlsZShkIT09ZSl9LHByb3RvLnJlbW92ZURpc3BsYXlPYmplY3RBbmRDaGlsZHJlbj1mdW5jdGlvbihhKXtpZihhLl9fcmVuZGVyR3JvdXA9PT10aGlzKWRvIGEuX19yZW5kZXJHcm91cD1udWxsLGEucmVuZGVyYWJsZSYmdGhpcy5yZW1vdmVPYmplY3QoYSksYT1hLl9pTmV4dDt3aGlsZShhKX0scHJvdG8uaW5zZXJ0T2JqZWN0PWZ1bmN0aW9uKGEsYixjKXt2YXIgZCxlLGY9YixnPWM7aWYoYSBpbnN0YW5jZW9mIFNwcml0ZSl7dmFyIGgsaTtpZihmIGluc3RhbmNlb2YgU3ByaXRlKXtpZihoPWYuYmF0Y2gsaCYmaC50ZXh0dXJlPT09YS50ZXh0dXJlLmJhc2VUZXh0dXJlJiZoLmJsZW5kTW9kZT09PWEuYmxlbmRNb2RlKXJldHVybiBoLmluc2VydEFmdGVyKGEsZiksdm9pZCAwfWVsc2UgaD1mO2lmKGcpaWYoZyBpbnN0YW5jZW9mIFNwcml0ZSl7aWYoaT1nLmJhdGNoKXtpZihpLnRleHR1cmU9PT1hLnRleHR1cmUuYmFzZVRleHR1cmUmJmkuYmxlbmRNb2RlPT09YS5ibGVuZE1vZGUpcmV0dXJuIGkuaW5zZXJ0QmVmb3JlKGEsZyksdm9pZCAwO2lmKGk9PT1oKXt2YXIgaj1oLnNwbGl0KGcpO3JldHVybiBkPVdlYkdMQmF0Y2guZ2V0QmF0Y2goKSxlPXRoaXMuYmF0Y2hzLmluZGV4T2YoaCksZC5pbml0KGEpLHRoaXMuYmF0Y2hzLnNwbGljZShlKzEsMCxkLGopLHZvaWQgMH19fWVsc2UgaT1nO3JldHVybiBkPVdlYkdMQmF0Y2guZ2V0QmF0Y2goKSxkLmluaXQoYSksaD8oZT10aGlzLmJhdGNocy5pbmRleE9mKGgpLHRoaXMuYmF0Y2hzLnNwbGljZShlKzEsMCxkKSk6dGhpcy5iYXRjaHMucHVzaChkKSx2b2lkIDB9YSBpbnN0YW5jZW9mIFRpbGluZ1Nwcml0ZT90aGlzLmluaXRUaWxpbmdTcHJpdGUoYSk6YSBpbnN0YW5jZW9mIFN0cmlwJiZ0aGlzLmluaXRTdHJpcChhKSx0aGlzLmluc2VydEFmdGVyKGEsZil9LHByb3RvLmluc2VydEFmdGVyPWZ1bmN0aW9uKGEsYil7dmFyIGMsZCxlO2IgaW5zdGFuY2VvZiBTcHJpdGU/KGM9Yi5iYXRjaCxjP2MudGFpbD09PWI/KGU9dGhpcy5iYXRjaHMuaW5kZXhPZihjKSx0aGlzLmJhdGNocy5zcGxpY2UoZSsxLDAsYSkpOihkPWMuc3BsaXQoYi5fX25leHQpLGU9dGhpcy5iYXRjaHMuaW5kZXhPZihjKSx0aGlzLmJhdGNocy5zcGxpY2UoZSsxLDAsYSxkKSk6dGhpcy5iYXRjaHMucHVzaChhKSk6KGU9dGhpcy5iYXRjaHMuaW5kZXhPZihiKSx0aGlzLmJhdGNocy5zcGxpY2UoZSsxLDAsYSkpfSxwcm90by5yZW1vdmVPYmplY3Q9ZnVuY3Rpb24oYSl7dmFyIGIsYztpZihhIGluc3RhbmNlb2YgU3ByaXRlKXt2YXIgZD1hLmJhdGNoO2lmKCFkKXJldHVybjtkLnJlbW92ZShhKSxkLnNpemV8fChiPWQpfWVsc2UgYj1hO2lmKGIpe2lmKGM9dGhpcy5iYXRjaHMuaW5kZXhPZihiKSwtMT09PWMpcmV0dXJuO2lmKDA9PT1jfHxjPT09dGhpcy5iYXRjaHMubGVuZ3RoLTEpcmV0dXJuIHRoaXMuYmF0Y2hzLnNwbGljZShjLDEpLGIgaW5zdGFuY2VvZiBXZWJHTEJhdGNoJiZXZWJHTEJhdGNoLnJldHVybkJhdGNoKGIpLHZvaWQgMDtpZih0aGlzLmJhdGNoc1tjLTFdaW5zdGFuY2VvZiBXZWJHTEJhdGNoJiZ0aGlzLmJhdGNoc1tjKzFdaW5zdGFuY2VvZiBXZWJHTEJhdGNoJiZ0aGlzLmJhdGNoc1tjLTFdLnRleHR1cmU9PT10aGlzLmJhdGNoc1tjKzFdLnRleHR1cmUmJnRoaXMuYmF0Y2hzW2MtMV0uYmxlbmRNb2RlPT09dGhpcy5iYXRjaHNbYysxXS5ibGVuZE1vZGUpcmV0dXJuIHRoaXMuYmF0Y2hzW2MtMV0ubWVyZ2UodGhpcy5iYXRjaHNbYysxXSksYiBpbnN0YW5jZW9mIFdlYkdMQmF0Y2gmJldlYkdMQmF0Y2gucmV0dXJuQmF0Y2goYiksV2ViR0xCYXRjaC5yZXR1cm5CYXRjaCh0aGlzLmJhdGNoc1tjKzFdKSx0aGlzLmJhdGNocy5zcGxpY2UoYywyKSx2b2lkIDA7dGhpcy5iYXRjaHMuc3BsaWNlKGMsMSksYiBpbnN0YW5jZW9mIFdlYkdMQmF0Y2gmJldlYkdMQmF0Y2gucmV0dXJuQmF0Y2goYil9fSxwcm90by5pbml0VGlsaW5nU3ByaXRlPWZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuZ2w7YS52ZXJ0aWNpZXM9bmV3IEZsb2F0MzJBcnJheShbMCwwLGEud2lkdGgsMCxhLndpZHRoLGEuaGVpZ2h0LDAsYS5oZWlnaHRdKSxhLnV2cz1uZXcgRmxvYXQzMkFycmF5KFswLDAsMSwwLDEsMSwwLDFdKSxhLmNvbG9ycz1uZXcgRmxvYXQzMkFycmF5KFsxLDEsMSwxXSksYS5pbmRpY2VzPW5ldyBVaW50MTZBcnJheShbMCwxLDMsMl0pLGEuX3ZlcnRleEJ1ZmZlcj1iLmNyZWF0ZUJ1ZmZlcigpLGEuX2luZGV4QnVmZmVyPWIuY3JlYXRlQnVmZmVyKCksYS5fdXZCdWZmZXI9Yi5jcmVhdGVCdWZmZXIoKSxhLl9jb2xvckJ1ZmZlcj1iLmNyZWF0ZUJ1ZmZlcigpLGIuYmluZEJ1ZmZlcihiLkFSUkFZX0JVRkZFUixhLl92ZXJ0ZXhCdWZmZXIpLGIuYnVmZmVyRGF0YShiLkFSUkFZX0JVRkZFUixhLnZlcnRpY2llcyxiLlNUQVRJQ19EUkFXKSxiLmJpbmRCdWZmZXIoYi5BUlJBWV9CVUZGRVIsYS5fdXZCdWZmZXIpLGIuYnVmZmVyRGF0YShiLkFSUkFZX0JVRkZFUixhLnV2cyxiLkRZTkFNSUNfRFJBVyksYi5iaW5kQnVmZmVyKGIuQVJSQVlfQlVGRkVSLGEuX2NvbG9yQnVmZmVyKSxiLmJ1ZmZlckRhdGEoYi5BUlJBWV9CVUZGRVIsYS5jb2xvcnMsYi5TVEFUSUNfRFJBVyksYi5iaW5kQnVmZmVyKGIuRUxFTUVOVF9BUlJBWV9CVUZGRVIsYS5faW5kZXhCdWZmZXIpLGIuYnVmZmVyRGF0YShiLkVMRU1FTlRfQVJSQVlfQlVGRkVSLGEuaW5kaWNlcyxiLlNUQVRJQ19EUkFXKSxhLnRleHR1cmUuYmFzZVRleHR1cmUuX2dsVGV4dHVyZT8oYi5iaW5kVGV4dHVyZShiLlRFWFRVUkVfMkQsYS50ZXh0dXJlLmJhc2VUZXh0dXJlLl9nbFRleHR1cmUpLGIudGV4UGFyYW1ldGVyaShiLlRFWFRVUkVfMkQsYi5URVhUVVJFX1dSQVBfUyxiLlJFUEVBVCksYi50ZXhQYXJhbWV0ZXJpKGIuVEVYVFVSRV8yRCxiLlRFWFRVUkVfV1JBUF9ULGIuUkVQRUFUKSxhLnRleHR1cmUuYmFzZVRleHR1cmUuX3Bvd2VyT2YyPSEwKTphLnRleHR1cmUuYmFzZVRleHR1cmUuX3Bvd2VyT2YyPSEwfSxwcm90by5yZW5kZXJTdHJpcD1mdW5jdGlvbihhLGIpe3ZhciBjPXRoaXMuZ2w7c2hhZGVycy5hY3RpdmF0ZVN0cmlwU2hhZGVyKCk7dmFyIGQ9Z2xvYmFscy5zdHJpcFNoYWRlcixlPW1hdDMuY2xvbmUoYS53b3JsZFRyYW5zZm9ybSk7bWF0My50cmFuc3Bvc2UoZSksYy51bmlmb3JtTWF0cml4M2Z2KGQudHJhbnNsYXRpb25NYXRyaXgsITEsZSksYy51bmlmb3JtMmYoZC5wcm9qZWN0aW9uVmVjdG9yLGIueCxiLnkpLGMudW5pZm9ybTJmKGQub2Zmc2V0VmVjdG9yLC1nbG9iYWxzLm9mZnNldC54LC1nbG9iYWxzLm9mZnNldC55KSxjLnVuaWZvcm0xZihkLmFscGhhLGEud29ybGRBbHBoYSksYS5kaXJ0eT8oYS5kaXJ0eT0hMSxjLmJpbmRCdWZmZXIoYy5BUlJBWV9CVUZGRVIsYS5fdmVydGV4QnVmZmVyKSxjLmJ1ZmZlckRhdGEoYy5BUlJBWV9CVUZGRVIsYS52ZXJ0aWNpZXMsYy5TVEFUSUNfRFJBVyksYy52ZXJ0ZXhBdHRyaWJQb2ludGVyKGQuYVZlcnRleFBvc2l0aW9uLDIsYy5GTE9BVCwhMSwwLDApLGMuYmluZEJ1ZmZlcihjLkFSUkFZX0JVRkZFUixhLl91dkJ1ZmZlciksYy5idWZmZXJEYXRhKGMuQVJSQVlfQlVGRkVSLGEudXZzLGMuU1RBVElDX0RSQVcpLGMudmVydGV4QXR0cmliUG9pbnRlcihkLmFUZXh0dXJlQ29vcmQsMixjLkZMT0FULCExLDAsMCksYy5hY3RpdmVUZXh0dXJlKGMuVEVYVFVSRTApLGMuYmluZFRleHR1cmUoYy5URVhUVVJFXzJELGEudGV4dHVyZS5iYXNlVGV4dHVyZS5fZ2xUZXh0dXJlKSxjLmJpbmRCdWZmZXIoYy5BUlJBWV9CVUZGRVIsYS5fY29sb3JCdWZmZXIpLGMuYnVmZmVyRGF0YShjLkFSUkFZX0JVRkZFUixhLmNvbG9ycyxjLlNUQVRJQ19EUkFXKSxjLnZlcnRleEF0dHJpYlBvaW50ZXIoZC5jb2xvckF0dHJpYnV0ZSwxLGMuRkxPQVQsITEsMCwwKSxjLmJpbmRCdWZmZXIoYy5FTEVNRU5UX0FSUkFZX0JVRkZFUixhLl9pbmRleEJ1ZmZlciksYy5idWZmZXJEYXRhKGMuRUxFTUVOVF9BUlJBWV9CVUZGRVIsYS5pbmRpY2VzLGMuU1RBVElDX0RSQVcpKTooYy5iaW5kQnVmZmVyKGMuQVJSQVlfQlVGRkVSLGEuX3ZlcnRleEJ1ZmZlciksYy5idWZmZXJTdWJEYXRhKGMuQVJSQVlfQlVGRkVSLDAsYS52ZXJ0aWNpZXMpLGMudmVydGV4QXR0cmliUG9pbnRlcihkLmFWZXJ0ZXhQb3NpdGlvbiwyLGMuRkxPQVQsITEsMCwwKSxjLmJpbmRCdWZmZXIoYy5BUlJBWV9CVUZGRVIsYS5fdXZCdWZmZXIpLGMudmVydGV4QXR0cmliUG9pbnRlcihkLmFUZXh0dXJlQ29vcmQsMixjLkZMT0FULCExLDAsMCksYy5hY3RpdmVUZXh0dXJlKGMuVEVYVFVSRTApLGMuYmluZFRleHR1cmUoYy5URVhUVVJFXzJELGEudGV4dHVyZS5iYXNlVGV4dHVyZS5fZ2xUZXh0dXJlKSxjLmJpbmRCdWZmZXIoYy5BUlJBWV9CVUZGRVIsYS5fY29sb3JCdWZmZXIpLGMudmVydGV4QXR0cmliUG9pbnRlcihkLmNvbG9yQXR0cmlidXRlLDEsYy5GTE9BVCwhMSwwLDApLGMuYmluZEJ1ZmZlcihjLkVMRU1FTlRfQVJSQVlfQlVGRkVSLGEuX2luZGV4QnVmZmVyKSksYy5kcmF3RWxlbWVudHMoYy5UUklBTkdMRV9TVFJJUCxhLmluZGljZXMubGVuZ3RoLGMuVU5TSUdORURfU0hPUlQsMCksc2hhZGVycy5kZWFjdGl2YXRlU3RyaXBTaGFkZXIoKX0scHJvdG8ucmVuZGVyVGlsaW5nU3ByaXRlPWZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcy5nbCxkPWEudGlsZVBvc2l0aW9uLGU9YS50aWxlU2NhbGUsZj1kLngvYS50ZXh0dXJlLmJhc2VUZXh0dXJlLndpZHRoLGc9ZC55L2EudGV4dHVyZS5iYXNlVGV4dHVyZS5oZWlnaHQsaD1hLndpZHRoL2EudGV4dHVyZS5iYXNlVGV4dHVyZS53aWR0aC9lLngsaT1hLmhlaWdodC9hLnRleHR1cmUuYmFzZVRleHR1cmUuaGVpZ2h0L2UueTthLnV2c1swXT0wLWYsYS51dnNbMV09MC1nLGEudXZzWzJdPTEqaC1mLGEudXZzWzNdPTAtZyxhLnV2c1s0XT0xKmgtZixhLnV2c1s1XT0xKmktZyxhLnV2c1s2XT0wLWYsYS51dnNbN109MSppLWcsYy5iaW5kQnVmZmVyKGMuQVJSQVlfQlVGRkVSLGEuX3V2QnVmZmVyKSxjLmJ1ZmZlclN1YkRhdGEoYy5BUlJBWV9CVUZGRVIsMCxhLnV2cyksdGhpcy5yZW5kZXJTdHJpcChhLGIpfSxwcm90by5pbml0U3RyaXA9ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcy5nbDthLl92ZXJ0ZXhCdWZmZXI9Yi5jcmVhdGVCdWZmZXIoKSxhLl9pbmRleEJ1ZmZlcj1iLmNyZWF0ZUJ1ZmZlcigpLGEuX3V2QnVmZmVyPWIuY3JlYXRlQnVmZmVyKCksYS5fY29sb3JCdWZmZXI9Yi5jcmVhdGVCdWZmZXIoKSxiLmJpbmRCdWZmZXIoYi5BUlJBWV9CVUZGRVIsYS5fdmVydGV4QnVmZmVyKSxiLmJ1ZmZlckRhdGEoYi5BUlJBWV9CVUZGRVIsYS52ZXJ0aWNpZXMsYi5EWU5BTUlDX0RSQVcpLGIuYmluZEJ1ZmZlcihiLkFSUkFZX0JVRkZFUixhLl91dkJ1ZmZlciksYi5idWZmZXJEYXRhKGIuQVJSQVlfQlVGRkVSLGEudXZzLGIuU1RBVElDX0RSQVcpLGIuYmluZEJ1ZmZlcihiLkFSUkFZX0JVRkZFUixhLl9jb2xvckJ1ZmZlciksYi5idWZmZXJEYXRhKGIuQVJSQVlfQlVGRkVSLGEuY29sb3JzLGIuU1RBVElDX0RSQVcpLGIuYmluZEJ1ZmZlcihiLkVMRU1FTlRfQVJSQVlfQlVGRkVSLGEuX2luZGV4QnVmZmVyKSxiLmJ1ZmZlckRhdGEoYi5FTEVNRU5UX0FSUkFZX0JVRkZFUixhLmluZGljZXMsYi5TVEFUSUNfRFJBVyl9LFdlYkdMUmVuZGVyR3JvdXAudXBkYXRlVGV4dHVyZT1mdW5jdGlvbihhLGIpe2IuX2dsVGV4dHVyZXx8KGIuX2dsVGV4dHVyZT1hLmNyZWF0ZVRleHR1cmUoKSksYi5oYXNMb2FkZWQmJihhLmJpbmRUZXh0dXJlKGEuVEVYVFVSRV8yRCxiLl9nbFRleHR1cmUpLGEucGl4ZWxTdG9yZWkoYS5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsITApLGEudGV4SW1hZ2UyRChhLlRFWFRVUkVfMkQsMCxhLlJHQkEsYS5SR0JBLGEuVU5TSUdORURfQllURSxiLnNvdXJjZSksYS50ZXhQYXJhbWV0ZXJpKGEuVEVYVFVSRV8yRCxhLlRFWFRVUkVfTUFHX0ZJTFRFUixiLnNjYWxlTW9kZT09PUJhc2VUZXh0dXJlLlNDQUxFX01PREUuTElORUFSP2EuTElORUFSOmEuTkVBUkVTVCksYS50ZXhQYXJhbWV0ZXJpKGEuVEVYVFVSRV8yRCxhLlRFWFRVUkVfTUlOX0ZJTFRFUixiLnNjYWxlTW9kZT09PUJhc2VUZXh0dXJlLlNDQUxFX01PREUuTElORUFSP2EuTElORUFSOmEuTkVBUkVTVCksYi5fcG93ZXJPZjI/KGEudGV4UGFyYW1ldGVyaShhLlRFWFRVUkVfMkQsYS5URVhUVVJFX1dSQVBfUyxhLlJFUEVBVCksYS50ZXhQYXJhbWV0ZXJpKGEuVEVYVFVSRV8yRCxhLlRFWFRVUkVfV1JBUF9ULGEuUkVQRUFUKSk6KGEudGV4UGFyYW1ldGVyaShhLlRFWFRVUkVfMkQsYS5URVhUVVJFX1dSQVBfUyxhLkNMQU1QX1RPX0VER0UpLGEudGV4UGFyYW1ldGVyaShhLlRFWFRVUkVfMkQsYS5URVhUVVJFX1dSQVBfVCxhLkNMQU1QX1RPX0VER0UpKSxhLmJpbmRUZXh0dXJlKGEuVEVYVFVSRV8yRCxudWxsKSl9LFdlYkdMUmVuZGVyR3JvdXAuZGVzdHJveVRleHR1cmU9ZnVuY3Rpb24oYSxiKXtiLl9nbFRleHR1cmUmJihiLl9nbFRleHR1cmU9YS5jcmVhdGVUZXh0dXJlKCksYS5kZWxldGVUZXh0dXJlKGEuVEVYVFVSRV8yRCxiLl9nbFRleHR1cmUpKX0sV2ViR0xSZW5kZXJHcm91cC51cGRhdGVUZXh0dXJlcz1mdW5jdGlvbihhKXtmb3IodmFyIGI9MCxjPWdsb2JhbHMudGV4dHVyZXNUb1VwZGF0ZS5sZW5ndGg7Yz5iO2IrKylXZWJHTFJlbmRlckdyb3VwLnVwZGF0ZVRleHR1cmUoYSxnbG9iYWxzLnRleHR1cmVzVG9VcGRhdGVbYl0pO2ZvcihiPTAsYz1nbG9iYWxzLnRleHR1cmVzVG9EZXN0cm95Lmxlbmd0aDtjPmI7YisrKVdlYkdMUmVuZGVyR3JvdXAuZGVzdHJveVRleHR1cmUoYSxnbG9iYWxzLnRleHR1cmVzVG9EZXN0cm95W2JdKTtnbG9iYWxzLnRleHR1cmVzVG9VcGRhdGU9W10sZ2xvYmFscy50ZXh0dXJlc1RvRGVzdHJveT1bXX0sbW9kdWxlLmV4cG9ydHM9V2ViR0xSZW5kZXJHcm91cDsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBXZWJHTFJlbmRlcmVyKGEsYixjLGQsZSl7dmFyIGY7dGhpcy50cmFuc3BhcmVudD0hIWQsdGhpcy53aWR0aD1hfHw4MDAsdGhpcy5oZWlnaHQ9Ynx8NjAwLHRoaXMudmlldz1jfHxwbGF0Zm9ybS5jcmVhdGVDYW52YXMoKSx0aGlzLnZpZXcud2lkdGg9dGhpcy53aWR0aCx0aGlzLnZpZXcuaGVpZ2h0PXRoaXMuaGVpZ2h0O3ZhciBnPXRoaXM7dGhpcy52aWV3LmFkZEV2ZW50TGlzdGVuZXIoXCJ3ZWJnbGNvbnRleHRsb3N0XCIsZnVuY3Rpb24oYSl7Zy5oYW5kbGVDb250ZXh0TG9zdChhKX0sITEpLHRoaXMudmlldy5hZGRFdmVudExpc3RlbmVyKFwid2ViZ2xjb250ZXh0cmVzdG9yZWRcIixmdW5jdGlvbihhKXtnLmhhbmRsZUNvbnRleHRSZXN0b3JlZChhKX0sITEpLHRoaXMuYmF0Y2hzPVtdO3ZhciBoPXthbHBoYTp0aGlzLnRyYW5zcGFyZW50LGFudGlhbGlhczohIWUscHJlbXVsdGlwbGllZEFscGhhOiExLHN0ZW5jaWw6ITB9O3RyeXtmPXRoaXMudmlldy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIsaCl9Y2F0Y2goaSl7dHJ5e2Y9dGhpcy52aWV3LmdldENvbnRleHQoXCJ3ZWJnbFwiLGgpfWNhdGNoKGope3Rocm93IG5ldyBFcnJvcihcIiBUaGlzIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB3ZWJHTC4gVHJ5IHVzaW5nIHRoZSBjYW52YXMgcmVuZGVyZXJcIit0aGlzKX19dGhpcy5nbD1nbG9iYWxzLmdsPWYsc2hhZGVycy5pbml0RGVmYXVsdFNoYWRlcnMoKSxmLnVzZVByb2dyYW0oZ2xvYmFscy5kZWZhdWx0U2hhZGVyLnByb2dyYW0pLHRoaXMuYmF0Y2g9bmV3IFdlYkdMQmF0Y2goZiksZi5kaXNhYmxlKGYuREVQVEhfVEVTVCksZi5kaXNhYmxlKGYuQ1VMTF9GQUNFKSxmLmVuYWJsZShmLkJMRU5EKSxmLmNvbG9yTWFzayghMCwhMCwhMCx0aGlzLnRyYW5zcGFyZW50KSx0aGlzLnByb2plY3Rpb249Z2xvYmFscy5wcm9qZWN0aW9uPW5ldyBQb2ludCg0MDAsMzAwKSx0aGlzLm9mZnNldD1nbG9iYWxzLm9mZnNldD1uZXcgUG9pbnQoMCwwKSx0aGlzLnJlc2l6ZSh0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KSx0aGlzLmNvbnRleHRMb3N0PSExLHRoaXMuc3RhZ2VSZW5kZXJHcm91cD1uZXcgV2ViR0xSZW5kZXJHcm91cCh0aGlzLmdsLHRoaXMudHJhbnNwYXJlbnQpfXZhciBwbGF0Zm9ybT1yZXF1aXJlKFwiLi4vLi4vcGxhdGZvcm1cIiksZ2xvYmFscz1yZXF1aXJlKFwiLi4vLi4vY29yZS9nbG9iYWxzXCIpLHNoYWRlcnM9cmVxdWlyZShcIi4vc2hhZGVyc1wiKSxXZWJHTEJhdGNoPXJlcXVpcmUoXCIuL1dlYkdMQmF0Y2hcIiksV2ViR0xSZW5kZXJHcm91cD1yZXF1aXJlKFwiLi9XZWJHTFJlbmRlckdyb3VwXCIpLFBvaW50PXJlcXVpcmUoXCIuLi8uLi9nZW9tL1BvaW50XCIpLFRleHR1cmU9cmVxdWlyZShcIi4uLy4uL3RleHR1cmVzL1RleHR1cmVcIikscHJvdG89V2ViR0xSZW5kZXJlci5wcm90b3R5cGU7cHJvdG8ucmVuZGVyPWZ1bmN0aW9uKGEpe2lmKCF0aGlzLmNvbnRleHRMb3N0KXt0aGlzLl9fc3RhZ2UhPT1hJiYodGhpcy5fX3N0YWdlPWEsdGhpcy5zdGFnZVJlbmRlckdyb3VwLnNldFJlbmRlcmFibGUoYSkpO3ZhciBiPXRoaXMuZ2w7aWYoV2ViR0xSZW5kZXJHcm91cC51cGRhdGVUZXh0dXJlcyhiKSxnbG9iYWxzLnZpc2libGVDb3VudCsrLGEudXBkYXRlVHJhbnNmb3JtKCksYi5jb2xvck1hc2soITAsITAsITAsdGhpcy50cmFuc3BhcmVudCksYi52aWV3cG9ydCgwLDAsdGhpcy53aWR0aCx0aGlzLmhlaWdodCksYi5iaW5kRnJhbWVidWZmZXIoYi5GUkFNRUJVRkZFUixudWxsKSxiLmNsZWFyQ29sb3IoYS5iYWNrZ3JvdW5kQ29sb3JTcGxpdFswXSxhLmJhY2tncm91bmRDb2xvclNwbGl0WzFdLGEuYmFja2dyb3VuZENvbG9yU3BsaXRbMl0sIXRoaXMudHJhbnNwYXJlbnQpLGIuY2xlYXIoYi5DT0xPUl9CVUZGRVJfQklUKSx0aGlzLnN0YWdlUmVuZGVyR3JvdXAuYmFja2dyb3VuZENvbG9yPWEuYmFja2dyb3VuZENvbG9yU3BsaXQsdGhpcy5wcm9qZWN0aW9uLng9dGhpcy53aWR0aC8yLHRoaXMucHJvamVjdGlvbi55PS10aGlzLmhlaWdodC8yLHRoaXMuc3RhZ2VSZW5kZXJHcm91cC5yZW5kZXIodGhpcy5wcm9qZWN0aW9uKSxhLmludGVyYWN0aXZlJiYoYS5faW50ZXJhY3RpdmVFdmVudHNBZGRlZHx8KGEuX2ludGVyYWN0aXZlRXZlbnRzQWRkZWQ9ITAsYS5pbnRlcmFjdGlvbk1hbmFnZXIuc2V0VGFyZ2V0KHRoaXMpKSksVGV4dHVyZS5mcmFtZVVwZGF0ZXMubGVuZ3RoPjApe2Zvcih2YXIgYz0wLGQ9VGV4dHVyZS5mcmFtZVVwZGF0ZXMubGVuZ3RoO2Q+YztjKyspVGV4dHVyZS5mcmFtZVVwZGF0ZXNbY10udXBkYXRlRnJhbWU9ITE7VGV4dHVyZS5mcmFtZVVwZGF0ZXM9W119fX0scHJvdG8ucmVzaXplPWZ1bmN0aW9uKGEsYil7dGhpcy53aWR0aD1hLHRoaXMuaGVpZ2h0PWIsdGhpcy52aWV3LndpZHRoPWEsdGhpcy52aWV3LmhlaWdodD1iLHRoaXMuZ2wudmlld3BvcnQoMCwwLHRoaXMud2lkdGgsdGhpcy5oZWlnaHQpLHRoaXMucHJvamVjdGlvbi54PXRoaXMud2lkdGgvMix0aGlzLnByb2plY3Rpb24ueT0tdGhpcy5oZWlnaHQvMn0scHJvdG8uaGFuZGxlQ29udGV4dExvc3Q9ZnVuY3Rpb24oYSl7YS5wcmV2ZW50RGVmYXVsdCgpLHRoaXMuY29udGV4dExvc3Q9ITB9LHByb3RvLmhhbmRsZUNvbnRleHRSZXN0b3JlZD1mdW5jdGlvbigpe3ZhciBhPXRoaXMuZ2w9dGhpcy52aWV3LmdldENvbnRleHQoXCJleHBlcmltZW50YWwtd2ViZ2xcIix7YWxwaGE6ITB9KTt0aGlzLmluaXRTaGFkZXJzKCk7Zm9yKHZhciBiIGluIFRleHR1cmUuY2FjaGUpe3ZhciBjPVRleHR1cmUuY2FjaGVbYl0uYmFzZVRleHR1cmU7Yy5fZ2xUZXh0dXJlPW51bGwsV2ViR0xSZW5kZXJHcm91cC51cGRhdGVUZXh0dXJlKGEsYyl9Zm9yKHZhciBkPTAsZT10aGlzLmJhdGNocy5sZW5ndGg7ZT5kO2QrKyl0aGlzLmJhdGNoc1tkXS5yZXN0b3JlTG9zdENvbnRleHQoYSksdGhpcy5iYXRjaHNbZF0uZGlydHk9ITA7V2ViR0xCYXRjaC5yZXN0b3JlQmF0Y2hlcyhhKSx0aGlzLmNvbnRleHRMb3N0PSExfSxtb2R1bGUuZXhwb3J0cz1XZWJHTFJlbmRlcmVyOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO3ZhciBwbGF0Zm9ybT1yZXF1aXJlKFwiLi4vLi4vcGxhdGZvcm1cIik7ZXhwb3J0cy5zaGFkZXI9ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPWIuam9pbihcIlxcblwiKSxlPWEuY3JlYXRlU2hhZGVyKGMpO3JldHVybiBhLnNoYWRlclNvdXJjZShlLGQpLGEuY29tcGlsZVNoYWRlcihlKSxhLmdldFNoYWRlclBhcmFtZXRlcihlLGEuQ09NUElMRV9TVEFUVVMpP2U6KHBsYXRmb3JtLmNvbnNvbGUmJnBsYXRmb3JtLmNvbnNvbGUuZXJyb3IoYS5nZXRTaGFkZXJJbmZvTG9nKGUpKSxudWxsKX0sZXhwb3J0cy5wcm9ncmFtPWZ1bmN0aW9uKGEsYixjKXt2YXIgZD1leHBvcnRzLnNoYWRlcihhLGMsYS5GUkFHTUVOVF9TSEFERVIpLGU9ZXhwb3J0cy5zaGFkZXIoYSxiLGEuVkVSVEVYX1NIQURFUiksZj1hLmNyZWF0ZVByb2dyYW0oKTtyZXR1cm4gYS5hdHRhY2hTaGFkZXIoZixlKSxhLmF0dGFjaFNoYWRlcihmLGQpLGEubGlua1Byb2dyYW0oZiksYS5nZXRQcm9ncmFtUGFyYW1ldGVyKGYsYS5MSU5LX1NUQVRVUyk/ZjoocGxhdGZvcm0uY29uc29sZSYmcGxhdGZvcm0uY29uc29sZS5lcnJvcihcIkNvdWxkIG5vdCBpbml0aWFsaXNlIHNoYWRlcnNcIiksbnVsbCl9OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO3ZhciBzaGFkZXJzPXJlcXVpcmUoXCIuL3NoYWRlcnNcIiksZ2xvYmFscz1yZXF1aXJlKFwiLi4vLi4vY29yZS9nbG9iYWxzXCIpLG1hdDM9cmVxdWlyZShcIi4uLy4uL2dlb20vbWF0cml4XCIpLm1hdDMsaGV4MnJnYj1yZXF1aXJlKFwiLi4vLi4vdXRpbHMvY29sb3JcIikuaGV4MnJnYix0cmlhbmd1bGF0ZT1yZXF1aXJlKFwiLi4vLi4vdXRpbHMvUG9seWtcIikudHJpYW5ndWxhdGUsUG9pbnQ9cmVxdWlyZShcIi4uLy4uL2dlb20vUG9pbnRcIiksR3JhcGhpY3M9cmVxdWlyZShcIi4uLy4uL3ByaW1pdGl2ZXMvR3JhcGhpY3NcIik7ZXhwb3J0cy5yZW5kZXJHcmFwaGljcz1mdW5jdGlvbihhLGIpe3ZhciBjPWdsb2JhbHMuZ2w7YS5fd2ViR0x8fChhLl93ZWJHTD17cG9pbnRzOltdLGluZGljZXM6W10sbGFzdEluZGV4OjAsYnVmZmVyOmMuY3JlYXRlQnVmZmVyKCksaW5kZXhCdWZmZXI6Yy5jcmVhdGVCdWZmZXIoKX0pLGEuZGlydHkmJihhLmRpcnR5PSExLGEuY2xlYXJEaXJ0eSYmKGEuY2xlYXJEaXJ0eT0hMSxhLl93ZWJHTC5sYXN0SW5kZXg9MCxhLl93ZWJHTC5wb2ludHM9W10sYS5fd2ViR0wuaW5kaWNlcz1bXSksZXhwb3J0cy51cGRhdGVHcmFwaGljcyhhKSksc2hhZGVycy5hY3RpdmF0ZVByaW1pdGl2ZVNoYWRlcigpO3ZhciBkPW1hdDMuY2xvbmUoYS53b3JsZFRyYW5zZm9ybSk7bWF0My50cmFuc3Bvc2UoZCksYy5ibGVuZEZ1bmMoYy5PTkUsYy5PTkVfTUlOVVNfU1JDX0FMUEhBKSxjLnVuaWZvcm1NYXRyaXgzZnYoZ2xvYmFscy5wcmltaXRpdmVTaGFkZXIudHJhbnNsYXRpb25NYXRyaXgsITEsZCksYy51bmlmb3JtMmYoZ2xvYmFscy5wcmltaXRpdmVTaGFkZXIucHJvamVjdGlvblZlY3RvcixiLngsLWIueSksYy51bmlmb3JtMmYoZ2xvYmFscy5wcmltaXRpdmVTaGFkZXIub2Zmc2V0VmVjdG9yLC1nbG9iYWxzLm9mZnNldC54LC1nbG9iYWxzLm9mZnNldC55KSxjLnVuaWZvcm0xZihnbG9iYWxzLnByaW1pdGl2ZVNoYWRlci5hbHBoYSxhLndvcmxkQWxwaGEpLGMuYmluZEJ1ZmZlcihjLkFSUkFZX0JVRkZFUixhLl93ZWJHTC5idWZmZXIpLGMudmVydGV4QXR0cmliUG9pbnRlcihnbG9iYWxzLnByaW1pdGl2ZVNoYWRlci5hVmVydGV4UG9zaXRpb24sMixjLkZMT0FULCExLDI0LDApLGMudmVydGV4QXR0cmliUG9pbnRlcihnbG9iYWxzLnByaW1pdGl2ZVNoYWRlci5jb2xvckF0dHJpYnV0ZSw0LGMuRkxPQVQsITEsMjQsOCksYy5iaW5kQnVmZmVyKGMuRUxFTUVOVF9BUlJBWV9CVUZGRVIsYS5fd2ViR0wuaW5kZXhCdWZmZXIpLGMuZHJhd0VsZW1lbnRzKGMuVFJJQU5HTEVfU1RSSVAsYS5fd2ViR0wuaW5kaWNlcy5sZW5ndGgsYy5VTlNJR05FRF9TSE9SVCwwKSxzaGFkZXJzLmRlYWN0aXZhdGVQcmltaXRpdmVTaGFkZXIoKX0sZXhwb3J0cy51cGRhdGVHcmFwaGljcz1mdW5jdGlvbihhKXtmb3IodmFyIGI9YS5fd2ViR0wubGFzdEluZGV4O2I8YS5ncmFwaGljc0RhdGEubGVuZ3RoO2IrKyl7dmFyIGM9YS5ncmFwaGljc0RhdGFbYl07Yy50eXBlPT09R3JhcGhpY3MuUE9MWT8oYy5maWxsJiZjLnBvaW50cy5sZW5ndGg+MyYmZXhwb3J0cy5idWlsZFBvbHkoYyxhLl93ZWJHTCksYy5saW5lV2lkdGg+MCYmZXhwb3J0cy5idWlsZExpbmUoYyxhLl93ZWJHTCkpOmMudHlwZT09PUdyYXBoaWNzLlJFQ1Q/ZXhwb3J0cy5idWlsZFJlY3RhbmdsZShjLGEuX3dlYkdMKTpjLnR5cGU9PT1HcmFwaGljcy5DSVJDfHxjLnR5cGU9PT1HcmFwaGljcy5FTElQLGV4cG9ydHMuYnVpbGRDaXJjbGUoYyxhLl93ZWJHTCl9YS5fd2ViR0wubGFzdEluZGV4PWEuZ3JhcGhpY3NEYXRhLmxlbmd0aDt2YXIgZD1nbG9iYWxzLmdsO2EuX3dlYkdMLmdsUG9pbnRzPW5ldyBGbG9hdDMyQXJyYXkoYS5fd2ViR0wucG9pbnRzKSxkLmJpbmRCdWZmZXIoZC5BUlJBWV9CVUZGRVIsYS5fd2ViR0wuYnVmZmVyKSxkLmJ1ZmZlckRhdGEoZC5BUlJBWV9CVUZGRVIsYS5fd2ViR0wuZ2xQb2ludHMsZC5TVEFUSUNfRFJBVyksYS5fd2ViR0wuZ2xJbmRpY2llcz1uZXcgVWludDE2QXJyYXkoYS5fd2ViR0wuaW5kaWNlcyksZC5iaW5kQnVmZmVyKGQuRUxFTUVOVF9BUlJBWV9CVUZGRVIsYS5fd2ViR0wuaW5kZXhCdWZmZXIpLGQuYnVmZmVyRGF0YShkLkVMRU1FTlRfQVJSQVlfQlVGRkVSLGEuX3dlYkdMLmdsSW5kaWNpZXMsZC5TVEFUSUNfRFJBVyl9LGV4cG9ydHMuYnVpbGRSZWN0YW5nbGU9ZnVuY3Rpb24oYSxiKXt2YXIgYz1hLnBvaW50cyxkPWNbMF0sZT1jWzFdLGY9Y1syXSxnPWNbM107aWYoYS5maWxsKXt2YXIgaD1oZXgycmdiKGEuZmlsbENvbG9yKSxpPWEuZmlsbEFscGhhLGo9aFswXSppLGs9aFsxXSppLGw9aFsyXSppLG09Yi5wb2ludHMsbj1iLmluZGljZXMsbz1tLmxlbmd0aC82O20ucHVzaChkLGUpLG0ucHVzaChqLGssbCxpKSxtLnB1c2goZCtmLGUpLG0ucHVzaChqLGssbCxpKSxtLnB1c2goZCxlK2cpLG0ucHVzaChqLGssbCxpKSxtLnB1c2goZCtmLGUrZyksbS5wdXNoKGosayxsLGkpLG4ucHVzaChvLG8sbysxLG8rMixvKzMsbyszKX1hLmxpbmVXaWR0aCYmKGEucG9pbnRzPVtkLGUsZCtmLGUsZCtmLGUrZyxkLGUrZyxkLGVdLGV4cG9ydHMuYnVpbGRMaW5lKGEsYikpfSxleHBvcnRzLmJ1aWxkQ2lyY2xlPWZ1bmN0aW9uKGEsYil7dmFyIGM9YS5wb2ludHMsZD1jWzBdLGU9Y1sxXSxmPWNbMl0sZz1jWzNdLGg9NDAsaT0yKk1hdGguUEkvaCxqPTA7aWYoYS5maWxsKXt2YXIgaz1oZXgycmdiKGEuZmlsbENvbG9yKSxsPWEuZmlsbEFscGhhLG09a1swXSpsLG49a1sxXSpsLG89a1syXSpsLHA9Yi5wb2ludHMscT1iLmluZGljZXMscj1wLmxlbmd0aC82O2ZvcihxLnB1c2gociksaj0wO2grMT5qO2orKylwLnB1c2goZCxlLG0sbixvLGwpLHAucHVzaChkK01hdGguc2luKGkqaikqZixlK01hdGguY29zKGkqaikqZyxtLG4sbyxsKSxxLnB1c2gocisrLHIrKyk7cS5wdXNoKHItMSl9aWYoYS5saW5lV2lkdGgpe2ZvcihhLnBvaW50cz1bXSxqPTA7aCsxPmo7aisrKWEucG9pbnRzLnB1c2goZCtNYXRoLnNpbihpKmopKmYsZStNYXRoLmNvcyhpKmopKmcpO2V4cG9ydHMuYnVpbGRMaW5lKGEsYil9fSxleHBvcnRzLmJ1aWxkTGluZT1mdW5jdGlvbihhLGIpe3ZhciBjPTAsZD1hLnBvaW50cztpZigwIT09ZC5sZW5ndGgpe2lmKGEubGluZVdpZHRoJTIpZm9yKGM9MDtjPGQubGVuZ3RoO2MrKylkW2NdKz0uNTt2YXIgZT1uZXcgUG9pbnQoZFswXSxkWzFdKSxmPW5ldyBQb2ludChkW2QubGVuZ3RoLTJdLGRbZC5sZW5ndGgtMV0pO2lmKGUueD09PWYueCYmZS55PT09Zi55KXtkLnBvcCgpLGQucG9wKCksZj1uZXcgUG9pbnQoZFtkLmxlbmd0aC0yXSxkW2QubGVuZ3RoLTFdKTt2YXIgZz1mLngrLjUqKGUueC1mLngpLGg9Zi55Ky41KihlLnktZi55KTtkLnVuc2hpZnQoZyxoKSxkLnB1c2goZyxoKX12YXIgaSxqLGssbCxtLG4sbyxwLHEscixzLHQsdSx2LHcseCx5LHosQSxCLEMsRCxFLEY9Yi5wb2ludHMsRz1iLmluZGljZXMsSD1kLmxlbmd0aC8yLEk9ZC5sZW5ndGgsSj1GLmxlbmd0aC82LEs9YS5saW5lV2lkdGgvMixMPWhleDJyZ2IoYS5saW5lQ29sb3IpLE09YS5saW5lQWxwaGEsTj1MWzBdKk0sTz1MWzFdKk0sUD1MWzJdKk07Zm9yKGs9ZFswXSxsPWRbMV0sbT1kWzJdLG49ZFszXSxxPS0obC1uKSxyPWstbSxFPU1hdGguc3FydChxKnErcipyKSxxLz1FLHIvPUUscSo9SyxyKj1LLEYucHVzaChrLXEsbC1yLE4sTyxQLE0pLEYucHVzaChrK3EsbCtyLE4sTyxQLE0pLGM9MTtILTE+YztjKyspaz1kWzIqKGMtMSldLGw9ZFsyKihjLTEpKzFdLG09ZFsyKmNdLG49ZFsyKmMrMV0sbz1kWzIqKGMrMSldLHA9ZFsyKihjKzEpKzFdLHE9LShsLW4pLHI9ay1tLEU9TWF0aC5zcXJ0KHEqcStyKnIpLHEvPUUsci89RSxxKj1LLHIqPUsscz0tKG4tcCksdD1tLW8sRT1NYXRoLnNxcnQocypzK3QqdCkscy89RSx0Lz1FLHMqPUssdCo9Syx3PS1yK2wtKC1yK24pLHg9LXErbS0oLXEraykseT0oLXEraykqKC1yK24pLSgtcSttKSooLXIrbCksej0tdCtwLSgtdCtuKSxBPS1zK20tKC1zK28pLEI9KC1zK28pKigtdCtuKS0oLXMrbSkqKC10K3ApLEM9dypBLXoqeCxNYXRoLmFicyhDKTwuMT8oQys9MTAuMSxGLnB1c2gobS1xLG4tcixOLE8sUCxNKSxGLnB1c2gobStxLG4rcixOLE8sUCxNKSk6KGk9KHgqQi1BKnkpL0Msaj0oeip5LXcqQikvQyxEPShpLW0pKihpLW0pKyhqLW4pKyhqLW4pLEQ+MTk2MDA/KHU9cS1zLHY9ci10LEU9TWF0aC5zcXJ0KHUqdSt2KnYpLHUvPUUsdi89RSx1Kj1LLHYqPUssRi5wdXNoKG0tdSxuLXYpLEYucHVzaChOLE8sUCxNKSxGLnB1c2gobSt1LG4rdiksRi5wdXNoKE4sTyxQLE0pLEYucHVzaChtLXUsbi12KSxGLnB1c2goTixPLFAsTSksSSsrKTooRi5wdXNoKGksaiksRi5wdXNoKE4sTyxQLE0pLEYucHVzaChtLShpLW0pLG4tKGotbikpLEYucHVzaChOLE8sUCxNKSkpO2ZvcihrPWRbMiooSC0yKV0sbD1kWzIqKEgtMikrMV0sbT1kWzIqKEgtMSldLG49ZFsyKihILTEpKzFdLHE9LShsLW4pLHI9ay1tLEU9TWF0aC5zcXJ0KHEqcStyKnIpLHEvPUUsci89RSxxKj1LLHIqPUssRi5wdXNoKG0tcSxuLXIpLEYucHVzaChOLE8sUCxNKSxGLnB1c2gobStxLG4rciksRi5wdXNoKE4sTyxQLE0pLEcucHVzaChKKSxjPTA7ST5jO2MrKylHLnB1c2goSisrKTtHLnB1c2goSi0xKX19LGV4cG9ydHMuYnVpbGRQb2x5PWZ1bmN0aW9uKGEsYil7dmFyIGM9YS5wb2ludHM7aWYoIShjLmxlbmd0aDw2KSl7dmFyIGQ9Yi5wb2ludHMsZT1iLmluZGljZXMsZj1jLmxlbmd0aC8yLGc9aGV4MnJnYihhLmZpbGxDb2xvciksaD1hLmZpbGxBbHBoYSxpPWdbMF0qaCxqPWdbMV0qaCxrPWdbMl0qaCxsPXRyaWFuZ3VsYXRlKGMpLG09ZC5sZW5ndGgvNixuPTA7Zm9yKG49MDtuPGwubGVuZ3RoO24rPTMpZS5wdXNoKGxbbl0rbSksZS5wdXNoKGxbbl0rbSksZS5wdXNoKGxbbisxXSttKSxlLnB1c2gobFtuKzJdK20pLGUucHVzaChsW24rMl0rbSk7Zm9yKG49MDtmPm47bisrKWQucHVzaChjWzIqbl0sY1syKm4rMV0saSxqLGssaCl9fTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjt2YXIgZ2xvYmFscz1yZXF1aXJlKFwiLi4vLi4vY29yZS9nbG9iYWxzXCIpLFByaW1pdGl2ZVNoYWRlcj1yZXF1aXJlKFwiLi9QcmltaXRpdmVTaGFkZXJcIiksU3RyaXBTaGFkZXI9cmVxdWlyZShcIi4vU3RyaXBTaGFkZXJcIiksUGl4aVNoYWRlcj1yZXF1aXJlKFwiLi9QaXhpU2hhZGVyXCIpO2V4cG9ydHMuaW5pdERlZmF1bHRTaGFkZXJzPWZ1bmN0aW9uKCl7Z2xvYmFscy5wcmltaXRpdmVTaGFkZXI9bmV3IFByaW1pdGl2ZVNoYWRlcixnbG9iYWxzLnByaW1pdGl2ZVNoYWRlci5pbml0KCksZ2xvYmFscy5zdHJpcFNoYWRlcj1uZXcgU3RyaXBTaGFkZXIsZ2xvYmFscy5zdHJpcFNoYWRlci5pbml0KCksZ2xvYmFscy5kZWZhdWx0U2hhZGVyPW5ldyBQaXhpU2hhZGVyLGdsb2JhbHMuZGVmYXVsdFNoYWRlci5pbml0KCk7dmFyIGE9Z2xvYmFscy5nbCxiPWdsb2JhbHMuZGVmYXVsdFNoYWRlci5wcm9ncmFtO2EudXNlUHJvZ3JhbShiKSxhLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMuZGVmYXVsdFNoYWRlci5hVmVydGV4UG9zaXRpb24pLGEuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoZ2xvYmFscy5kZWZhdWx0U2hhZGVyLmNvbG9yQXR0cmlidXRlKSxhLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMuZGVmYXVsdFNoYWRlci5hVGV4dHVyZUNvb3JkKX0sZXhwb3J0cy5hY3RpdmF0ZVByaW1pdGl2ZVNoYWRlcj1mdW5jdGlvbigpe3ZhciBhPWdsb2JhbHMuZ2w7YS51c2VQcm9ncmFtKGdsb2JhbHMucHJpbWl0aXZlU2hhZGVyLnByb2dyYW0pLGEuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMuZGVmYXVsdFNoYWRlci5hVmVydGV4UG9zaXRpb24pLGEuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMuZGVmYXVsdFNoYWRlci5jb2xvckF0dHJpYnV0ZSksYS5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoZ2xvYmFscy5kZWZhdWx0U2hhZGVyLmFUZXh0dXJlQ29vcmQpLGEuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoZ2xvYmFscy5wcmltaXRpdmVTaGFkZXIuYVZlcnRleFBvc2l0aW9uKSxhLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMucHJpbWl0aXZlU2hhZGVyLmNvbG9yQXR0cmlidXRlKX0sZXhwb3J0cy5kZWFjdGl2YXRlUHJpbWl0aXZlU2hhZGVyPWZ1bmN0aW9uKCl7dmFyIGE9Z2xvYmFscy5nbDthLnVzZVByb2dyYW0oZ2xvYmFscy5kZWZhdWx0U2hhZGVyLnByb2dyYW0pLGEuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGdsb2JhbHMucHJpbWl0aXZlU2hhZGVyLmFWZXJ0ZXhQb3NpdGlvbiksYS5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoZ2xvYmFscy5wcmltaXRpdmVTaGFkZXIuY29sb3JBdHRyaWJ1dGUpLGEuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoZ2xvYmFscy5kZWZhdWx0U2hhZGVyLmFWZXJ0ZXhQb3NpdGlvbiksYS5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShnbG9iYWxzLmRlZmF1bHRTaGFkZXIuY29sb3JBdHRyaWJ1dGUpLGEuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoZ2xvYmFscy5kZWZhdWx0U2hhZGVyLmFUZXh0dXJlQ29vcmQpfSxleHBvcnRzLmFjdGl2YXRlU3RyaXBTaGFkZXI9ZnVuY3Rpb24oKXt2YXIgYT1nbG9iYWxzLmdsO2EudXNlUHJvZ3JhbShnbG9iYWxzLnN0cmlwU2hhZGVyLnByb2dyYW0pfSxleHBvcnRzLmRlYWN0aXZhdGVTdHJpcFNoYWRlcj1mdW5jdGlvbigpe3ZhciBhPWdsb2JhbHMuZ2w7YS51c2VQcm9ncmFtKGdsb2JhbHMuZGVmYXVsdFNoYWRlci5wcm9ncmFtKX07IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gQml0bWFwVGV4dChhLGIpe0Rpc3BsYXlPYmplY3RDb250YWluZXIuY2FsbCh0aGlzKSx0aGlzLnNldFRleHQoYSksdGhpcy5zZXRTdHlsZShiKSx0aGlzLnVwZGF0ZVRleHQoKSx0aGlzLmRpcnR5PSExfXZhciBEaXNwbGF5T2JqZWN0Q29udGFpbmVyPXJlcXVpcmUoXCIuLi9kaXNwbGF5L0Rpc3BsYXlPYmplY3RDb250YWluZXJcIiksU3ByaXRlPXJlcXVpcmUoXCIuLi9kaXNwbGF5L1Nwcml0ZVwiKSxQb2ludD1yZXF1aXJlKFwiLi4vZ2VvbS9Qb2ludFwiKSxwcm90bz1CaXRtYXBUZXh0LnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKERpc3BsYXlPYmplY3RDb250YWluZXIucHJvdG90eXBlLHtjb25zdHJ1Y3Rvcjp7dmFsdWU6Qml0bWFwVGV4dH19KTtwcm90by5zZXRUZXh0PWZ1bmN0aW9uKGEpe3RoaXMudGV4dD1hfHxcIiBcIix0aGlzLmRpcnR5PSEwfSxwcm90by5zZXRTdHlsZT1mdW5jdGlvbihhKXthPWF8fHt9LGEuYWxpZ249YS5hbGlnbnx8XCJsZWZ0XCIsdGhpcy5zdHlsZT1hO3ZhciBiPWEuZm9udC5zcGxpdChcIiBcIik7dGhpcy5mb250TmFtZT1iW2IubGVuZ3RoLTFdLHRoaXMuZm9udFNpemU9Yi5sZW5ndGg+PTI/cGFyc2VJbnQoYltiLmxlbmd0aC0yXSwxMCk6Qml0bWFwVGV4dC5mb250c1t0aGlzLmZvbnROYW1lXS5zaXplLHRoaXMuZGlydHk9ITB9LHByb3RvLnVwZGF0ZVRleHQ9ZnVuY3Rpb24oKXtmb3IodmFyIGE9Qml0bWFwVGV4dC5mb250c1t0aGlzLmZvbnROYW1lXSxiPW5ldyBQb2ludCxjPW51bGwsZD1bXSxlPTAsZj1bXSxnPTAsaD10aGlzLmZvbnRTaXplL2Euc2l6ZSxpPTA7aTx0aGlzLnRleHQubGVuZ3RoO2krKyl7dmFyIGo9dGhpcy50ZXh0LmNoYXJDb2RlQXQoaSk7aWYoLyg/OlxcclxcbnxcXHJ8XFxuKS8udGVzdCh0aGlzLnRleHQuY2hhckF0KGkpKSlmLnB1c2goYi54KSxlPU1hdGgubWF4KGUsYi54KSxnKyssYi54PTAsYi55Kz1hLmxpbmVIZWlnaHQsYz1udWxsO2Vsc2V7dmFyIGs9YS5jaGFyc1tqXTtrJiYoYyYma1tjXSYmKGIueCs9ay5rZXJuaW5nW2NdKSxkLnB1c2goe3RleHR1cmU6ay50ZXh0dXJlLGxpbmU6ZyxjaGFyQ29kZTpqLHBvc2l0aW9uOm5ldyBQb2ludChiLngray54T2Zmc2V0LGIueStrLnlPZmZzZXQpfSksYi54Kz1rLnhBZHZhbmNlLGM9ail9fWYucHVzaChiLngpLGU9TWF0aC5tYXgoZSxiLngpO3ZhciBsPVtdO2ZvcihpPTA7Zz49aTtpKyspe3ZhciBtPTA7XCJyaWdodFwiPT09dGhpcy5zdHlsZS5hbGlnbj9tPWUtZltpXTpcImNlbnRlclwiPT09dGhpcy5zdHlsZS5hbGlnbiYmKG09KGUtZltpXSkvMiksbC5wdXNoKG0pfWZvcihpPTA7aTxkLmxlbmd0aDtpKyspe3ZhciBuPW5ldyBTcHJpdGUoZFtpXS50ZXh0dXJlKTtuLnBvc2l0aW9uLng9KGRbaV0ucG9zaXRpb24ueCtsW2RbaV0ubGluZV0pKmgsbi5wb3NpdGlvbi55PWRbaV0ucG9zaXRpb24ueSpoLG4uc2NhbGUueD1uLnNjYWxlLnk9aCx0aGlzLmFkZENoaWxkKG4pfXRoaXMud2lkdGg9ZSpoLHRoaXMuaGVpZ2h0PShiLnkrYS5saW5lSGVpZ2h0KSpofSxwcm90by51cGRhdGVUcmFuc2Zvcm09ZnVuY3Rpb24oKXtpZih0aGlzLmRpcnR5KXtmb3IoO3RoaXMuY2hpbGRyZW4ubGVuZ3RoPjA7KXRoaXMucmVtb3ZlQ2hpbGQodGhpcy5nZXRDaGlsZEF0KDApKTt0aGlzLnVwZGF0ZVRleHQoKSx0aGlzLmRpcnR5PSExfURpc3BsYXlPYmplY3RDb250YWluZXIucHJvdG90eXBlLnVwZGF0ZVRyYW5zZm9ybS5jYWxsKHRoaXMpfSxCaXRtYXBUZXh0LmZvbnRzPXt9LG1vZHVsZS5leHBvcnRzPUJpdG1hcFRleHQ7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gVGV4dChhLGIpe3RoaXMuY2FudmFzPXBsYXRmb3JtLmNyZWF0ZUNhbnZhcygpLHRoaXMuY29udGV4dD10aGlzLmNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIiksU3ByaXRlLmNhbGwodGhpcyxUZXh0dXJlLmZyb21DYW52YXModGhpcy5jYW52YXMpKSx0aGlzLnNldFRleHQoYSksdGhpcy5zZXRTdHlsZShiKSx0aGlzLnVwZGF0ZVRleHQoKSx0aGlzLmRpcnR5PSExfXZhciBwbGF0Zm9ybT1yZXF1aXJlKFwiLi4vcGxhdGZvcm1cIiksZ2xvYmFscz1yZXF1aXJlKFwiLi4vY29yZS9nbG9iYWxzXCIpLFBvaW50PXJlcXVpcmUoXCIuLi9nZW9tL1BvaW50XCIpLFNwcml0ZT1yZXF1aXJlKFwiLi4vZGlzcGxheS9TcHJpdGVcIiksVGV4dHVyZT1yZXF1aXJlKFwiLi4vdGV4dHVyZXMvVGV4dHVyZVwiKSxwcm90bz1UZXh0LnByb3RvdHlwZT1PYmplY3QuY3JlYXRlKFNwcml0ZS5wcm90b3R5cGUse2NvbnN0cnVjdG9yOnt2YWx1ZTpUZXh0fX0pO3Byb3RvLnNldFN0eWxlPWZ1bmN0aW9uKGEpe2E9YXx8e30sYS5mb250PWEuZm9udHx8XCJib2xkIDIwcHQgQXJpYWxcIixhLmZpbGw9YS5maWxsfHxcImJsYWNrXCIsYS5hbGlnbj1hLmFsaWdufHxcImxlZnRcIixhLnN0cm9rZT1hLnN0cm9rZXx8XCJibGFja1wiLGEuc3Ryb2tlVGhpY2tuZXNzPWEuc3Ryb2tlVGhpY2tuZXNzfHwwLGEud29yZFdyYXA9YS53b3JkV3JhcHx8ITEsYS53b3JkV3JhcFdpZHRoPWEud29yZFdyYXBXaWR0aHx8MTAwLHRoaXMuc3R5bGU9YSx0aGlzLmRpcnR5PSEwfSxwcm90by5zZXRUZXh0PWZ1bmN0aW9uKGEpe3RoaXMudGV4dD1hLnRvU3RyaW5nKCl8fFwiIFwiLHRoaXMuZGlydHk9ITB9LHByb3RvLnVwZGF0ZVRleHQ9ZnVuY3Rpb24oKXt0aGlzLmNvbnRleHQuZm9udD10aGlzLnN0eWxlLmZvbnQ7dmFyIGE9dGhpcy50ZXh0O3RoaXMuc3R5bGUud29yZFdyYXAmJihhPXRoaXMud29yZFdyYXAodGhpcy50ZXh0KSk7Zm9yKHZhciBiPWEuc3BsaXQoLyg/OlxcclxcbnxcXHJ8XFxuKS8pLGM9W10sZD0wLGU9MDtlPGIubGVuZ3RoO2UrKyl7dmFyIGY9dGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KGJbZV0pLndpZHRoO2NbZV09ZixkPU1hdGgubWF4KGQsZil9dGhpcy5jYW52YXMud2lkdGg9ZCt0aGlzLnN0eWxlLnN0cm9rZVRoaWNrbmVzczt2YXIgZz10aGlzLmRldGVybWluZUZvbnRIZWlnaHQoXCJmb250OiBcIit0aGlzLnN0eWxlLmZvbnQrXCI7XCIpK3RoaXMuc3R5bGUuc3Ryb2tlVGhpY2tuZXNzO2Zvcih0aGlzLmNhbnZhcy5oZWlnaHQ9ZypiLmxlbmd0aCx0aGlzLmNvbnRleHQuZmlsbFN0eWxlPXRoaXMuc3R5bGUuZmlsbCx0aGlzLmNvbnRleHQuZm9udD10aGlzLnN0eWxlLmZvbnQsdGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlPXRoaXMuc3R5bGUuc3Ryb2tlLHRoaXMuY29udGV4dC5saW5lV2lkdGg9dGhpcy5zdHlsZS5zdHJva2VUaGlja25lc3MsdGhpcy5jb250ZXh0LnRleHRCYXNlbGluZT1cInRvcFwiLGU9MDtlPGIubGVuZ3RoO2UrKyl7dmFyIGg9bmV3IFBvaW50KHRoaXMuc3R5bGUuc3Ryb2tlVGhpY2tuZXNzLzIsdGhpcy5zdHlsZS5zdHJva2VUaGlja25lc3MvMitlKmcpO1wicmlnaHRcIj09PXRoaXMuc3R5bGUuYWxpZ24/aC54Kz1kLWNbZV06XCJjZW50ZXJcIj09PXRoaXMuc3R5bGUuYWxpZ24mJihoLngrPShkLWNbZV0pLzIpLHRoaXMuc3R5bGUuc3Ryb2tlJiZ0aGlzLnN0eWxlLnN0cm9rZVRoaWNrbmVzcyYmdGhpcy5jb250ZXh0LnN0cm9rZVRleHQoYltlXSxoLngsaC55KSx0aGlzLnN0eWxlLmZpbGwmJnRoaXMuY29udGV4dC5maWxsVGV4dChiW2VdLGgueCxoLnkpfXRoaXMudXBkYXRlVGV4dHVyZSgpfSxwcm90by51cGRhdGVUZXh0dXJlPWZ1bmN0aW9uKCl7dGhpcy50ZXh0dXJlLmJhc2VUZXh0dXJlLndpZHRoPXRoaXMuY2FudmFzLndpZHRoLHRoaXMudGV4dHVyZS5iYXNlVGV4dHVyZS5oZWlnaHQ9dGhpcy5jYW52YXMuaGVpZ2h0LHRoaXMudGV4dHVyZS5mcmFtZS53aWR0aD10aGlzLmNhbnZhcy53aWR0aCx0aGlzLnRleHR1cmUuZnJhbWUuaGVpZ2h0PXRoaXMuY2FudmFzLmhlaWdodCx0aGlzLl93aWR0aD10aGlzLmNhbnZhcy53aWR0aCx0aGlzLl9oZWlnaHQ9dGhpcy5jYW52YXMuaGVpZ2h0LGdsb2JhbHMudGV4dHVyZXNUb1VwZGF0ZS5wdXNoKHRoaXMudGV4dHVyZS5iYXNlVGV4dHVyZSl9LHByb3RvLnVwZGF0ZVRyYW5zZm9ybT1mdW5jdGlvbigpe3RoaXMuZGlydHkmJih0aGlzLnVwZGF0ZVRleHQoKSx0aGlzLmRpcnR5PSExKSxTcHJpdGUucHJvdG90eXBlLnVwZGF0ZVRyYW5zZm9ybS5jYWxsKHRoaXMpfSxwcm90by5kZXRlcm1pbmVGb250SGVpZ2h0PWZ1bmN0aW9uKGEpe3ZhciBiPVRleHQuaGVpZ2h0Q2FjaGVbYV07aWYoIWIpe3ZhciBjPXBsYXRmb3JtLmRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYm9keVwiKVswXSxkPXBsYXRmb3JtLmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksZT1wbGF0Zm9ybS5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIk1cIik7ZC5hcHBlbmRDaGlsZChlKSxkLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsYStcIjtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6MDtsZWZ0OjBcIiksYy5hcHBlbmRDaGlsZChkKSxiPWQub2Zmc2V0SGVpZ2h0LFRleHQuaGVpZ2h0Q2FjaGVbYV09YixjLnJlbW92ZUNoaWxkKGQpfXJldHVybiBifSxwcm90by53b3JkV3JhcD1mdW5jdGlvbihhKXtmb3IodmFyIGI9XCJcIixjPWEuc3BsaXQoXCJcXG5cIiksZD0wO2Q8Yy5sZW5ndGg7ZCsrKXtmb3IodmFyIGU9dGhpcy5zdHlsZS53b3JkV3JhcFdpZHRoLGY9Y1tkXS5zcGxpdChcIiBcIiksZz0wO2c8Zi5sZW5ndGg7ZysrKXt2YXIgaD10aGlzLmNvbnRleHQubWVhc3VyZVRleHQoZltnXSkud2lkdGgsaT1oK3RoaXMuY29udGV4dC5tZWFzdXJlVGV4dChcIiBcIikud2lkdGg7aT5lPyhnPjAmJihiKz1cIlxcblwiKSxiKz1mW2ddK1wiIFwiLGU9dGhpcy5zdHlsZS53b3JkV3JhcFdpZHRoLWgpOihlLT1pLGIrPWZbZ10rXCIgXCIpfWIrPVwiXFxuXCJ9cmV0dXJuIGJ9LHByb3RvLmRlc3Ryb3k9ZnVuY3Rpb24oYSl7YSYmdGhpcy50ZXh0dXJlLmRlc3Ryb3koKX0sVGV4dC5oZWlnaHRDYWNoZT17fSxtb2R1bGUuZXhwb3J0cz1UZXh0OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIEJhc2VUZXh0dXJlKGEsYil7aWYoRXZlbnRUYXJnZXQuY2FsbCh0aGlzKSx0aGlzLndpZHRoPTEwMCx0aGlzLmhlaWdodD0xMDAsdGhpcy5zY2FsZU1vZGU9Ynx8QmFzZVRleHR1cmUuU0NBTEVfTU9ERS5ERUZBVUxULHRoaXMuaGFzTG9hZGVkPSExLHRoaXMuc291cmNlPWEsYSl7aWYoXCJjb21wbGV0ZVwiaW4gdGhpcy5zb3VyY2UpaWYodGhpcy5zb3VyY2UuY29tcGxldGUpdGhpcy5oYXNMb2FkZWQ9ITAsdGhpcy53aWR0aD10aGlzLnNvdXJjZS53aWR0aCx0aGlzLmhlaWdodD10aGlzLnNvdXJjZS5oZWlnaHQsZ2xvYmFscy50ZXh0dXJlc1RvVXBkYXRlLnB1c2godGhpcyk7ZWxzZXt2YXIgYz10aGlzO3RoaXMuc291cmNlLm9ubG9hZD1mdW5jdGlvbigpe2MuaGFzTG9hZGVkPSEwLGMud2lkdGg9Yy5zb3VyY2Uud2lkdGgsYy5oZWlnaHQ9Yy5zb3VyY2UuaGVpZ2h0LGdsb2JhbHMudGV4dHVyZXNUb1VwZGF0ZS5wdXNoKGMpLGMuZGlzcGF0Y2hFdmVudCh7dHlwZTpcImxvYWRlZFwiLGNvbnRlbnQ6Y30pfX1lbHNlIHRoaXMuaGFzTG9hZGVkPSEwLHRoaXMud2lkdGg9dGhpcy5zb3VyY2Uud2lkdGgsdGhpcy5oZWlnaHQ9dGhpcy5zb3VyY2UuaGVpZ2h0LGdsb2JhbHMudGV4dHVyZXNUb1VwZGF0ZS5wdXNoKHRoaXMpO3RoaXMuaW1hZ2VVcmw9bnVsbCx0aGlzLl9wb3dlck9mMj0hMX19dmFyIHBsYXRmb3JtPXJlcXVpcmUoXCIuLi9wbGF0Zm9ybVwiKSxnbG9iYWxzPXJlcXVpcmUoXCIuLi9jb3JlL2dsb2JhbHNcIiksRXZlbnRUYXJnZXQ9cmVxdWlyZShcIi4uL2V2ZW50cy9FdmVudFRhcmdldFwiKSxiYXNlVGV4dHVyZUNhY2hlPXt9LHByb3RvPUJhc2VUZXh0dXJlLnByb3RvdHlwZTtwcm90by5kZXN0cm95PWZ1bmN0aW9uKCl7dGhpcy5zb3VyY2Uuc3JjJiYodGhpcy5pbWFnZVVybCBpbiBiYXNlVGV4dHVyZUNhY2hlJiZkZWxldGUgYmFzZVRleHR1cmVDYWNoZVt0aGlzLmltYWdlVXJsXSx0aGlzLmltYWdlVXJsPW51bGwsdGhpcy5zb3VyY2Uuc3JjPW51bGwpLHRoaXMuc291cmNlPW51bGwsZ2xvYmFscy50ZXh0dXJlc1RvRGVzdHJveS5wdXNoKHRoaXMpfSxwcm90by51cGRhdGVTb3VyY2VJbWFnZT1mdW5jdGlvbihhKXt0aGlzLmhhc0xvYWRlZD0hMSx0aGlzLnNvdXJjZS5zcmM9bnVsbCx0aGlzLnNvdXJjZS5zcmM9YX0sQmFzZVRleHR1cmUuZnJvbUltYWdlPWZ1bmN0aW9uKGEsYixjKXt2YXIgZD1iYXNlVGV4dHVyZUNhY2hlW2FdO2lmKCFkKXt2YXIgZT1uZXcgcGxhdGZvcm0uY3JlYXRlSW1hZ2U7YiYmKGUuY3Jvc3NPcmlnaW49XCJcIiksZS5zcmM9YSxkPW5ldyBCYXNlVGV4dHVyZShlLGMpLGQuaW1hZ2VVcmw9YSxiYXNlVGV4dHVyZUNhY2hlW2FdPWR9cmV0dXJuIGR9LEJhc2VUZXh0dXJlLlNDQUxFX01PREU9e0RFRkFVTFQ6MCxMSU5FQVI6MCxORUFSRVNUOjF9LG1vZHVsZS5leHBvcnRzPUJhc2VUZXh0dXJlOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFJlbmRlclRleHR1cmUoYSxiKXtFdmVudFRhcmdldC5jYWxsKHRoaXMpLHRoaXMud2lkdGg9YXx8MTAwLHRoaXMuaGVpZ2h0PWJ8fDEwMCx0aGlzLmlkZW50aXR5TWF0cml4PW1hdDMuY3JlYXRlKCksdGhpcy5mcmFtZT1uZXcgUmVjdGFuZ2xlKDAsMCx0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KSxnbG9iYWxzLmdsP3RoaXMuaW5pdFdlYkdMKCk6dGhpcy5pbml0Q2FudmFzKCl9dmFyIGdsb2JhbHM9cmVxdWlyZShcIi4uL2NvcmUvZ2xvYmFsc1wiKSxtYXQzPXJlcXVpcmUoXCIuLi9nZW9tL21hdHJpeFwiKS5tYXQzLFRleHR1cmU9cmVxdWlyZShcIi4vVGV4dHVyZVwiKSxCYXNlVGV4dHVyZT1yZXF1aXJlKFwiLi9CYXNlVGV4dHVyZVwiKSxQb2ludD1yZXF1aXJlKFwiLi4vZ2VvbS9Qb2ludFwiKSxSZWN0YW5nbGU9cmVxdWlyZShcIi4uL2dlb20vUmVjdGFuZ2xlXCIpLEV2ZW50VGFyZ2V0PXJlcXVpcmUoXCIuLi9ldmVudHMvRXZlbnRUYXJnZXRcIiksQ2FudmFzUmVuZGVyZXI9cmVxdWlyZShcIi4uL3JlbmRlcmVycy9jYW52YXMvQ2FudmFzUmVuZGVyZXJcIiksV2ViR0xSZW5kZXJHcm91cD1yZXF1aXJlKFwiLi4vcmVuZGVyZXJzL3dlYmdsL1dlYkdMUmVuZGVyR3JvdXBcIikscHJvdG89UmVuZGVyVGV4dHVyZS5wcm90b3R5cGU9T2JqZWN0LmNyZWF0ZShUZXh0dXJlLnByb3RvdHlwZSx7Y29uc3RydWN0b3I6e3ZhbHVlOlJlbmRlclRleHR1cmV9fSk7cHJvdG8uaW5pdFdlYkdMPWZ1bmN0aW9uKCl7dmFyIGE9Z2xvYmFscy5nbDt0aGlzLmdsRnJhbWVidWZmZXI9YS5jcmVhdGVGcmFtZWJ1ZmZlcigpLGEuYmluZEZyYW1lYnVmZmVyKGEuRlJBTUVCVUZGRVIsdGhpcy5nbEZyYW1lYnVmZmVyKSx0aGlzLmdsRnJhbWVidWZmZXIud2lkdGg9dGhpcy53aWR0aCx0aGlzLmdsRnJhbWVidWZmZXIuaGVpZ2h0PXRoaXMuaGVpZ2h0LHRoaXMuYmFzZVRleHR1cmU9bmV3IEJhc2VUZXh0dXJlLHRoaXMuYmFzZVRleHR1cmUud2lkdGg9dGhpcy53aWR0aCx0aGlzLmJhc2VUZXh0dXJlLmhlaWdodD10aGlzLmhlaWdodCx0aGlzLmJhc2VUZXh0dXJlLl9nbFRleHR1cmU9YS5jcmVhdGVUZXh0dXJlKCksYS5iaW5kVGV4dHVyZShhLlRFWFRVUkVfMkQsdGhpcy5iYXNlVGV4dHVyZS5fZ2xUZXh0dXJlKSxhLnRleEltYWdlMkQoYS5URVhUVVJFXzJELDAsYS5SR0JBLHRoaXMud2lkdGgsdGhpcy5oZWlnaHQsMCxhLlJHQkEsYS5VTlNJR05FRF9CWVRFLG51bGwpLGEudGV4UGFyYW1ldGVyaShhLlRFWFRVUkVfMkQsYS5URVhUVVJFX01BR19GSUxURVIsYS5MSU5FQVIpLGEudGV4UGFyYW1ldGVyaShhLlRFWFRVUkVfMkQsYS5URVhUVVJFX01JTl9GSUxURVIsYS5MSU5FQVIpLGEudGV4UGFyYW1ldGVyaShhLlRFWFRVUkVfMkQsYS5URVhUVVJFX1dSQVBfUyxhLkNMQU1QX1RPX0VER0UpLGEudGV4UGFyYW1ldGVyaShhLlRFWFRVUkVfMkQsYS5URVhUVVJFX1dSQVBfVCxhLkNMQU1QX1RPX0VER0UpLHRoaXMuYmFzZVRleHR1cmUuaXNSZW5kZXI9ITAsYS5iaW5kRnJhbWVidWZmZXIoYS5GUkFNRUJVRkZFUix0aGlzLmdsRnJhbWVidWZmZXIpLGEuZnJhbWVidWZmZXJUZXh0dXJlMkQoYS5GUkFNRUJVRkZFUixhLkNPTE9SX0FUVEFDSE1FTlQwLGEuVEVYVFVSRV8yRCx0aGlzLmJhc2VUZXh0dXJlLl9nbFRleHR1cmUsMCksdGhpcy5wcm9qZWN0aW9uPW5ldyBQb2ludCh0aGlzLndpZHRoLzIsLXRoaXMuaGVpZ2h0LzIpLHRoaXMucmVuZGVyPXRoaXMucmVuZGVyV2ViR0x9LHByb3RvLnJlc2l6ZT1mdW5jdGlvbihhLGIpe2lmKHRoaXMud2lkdGg9YSx0aGlzLmhlaWdodD1iLGdsb2JhbHMuZ2wpe3RoaXMucHJvamVjdGlvbi54PXRoaXMud2lkdGgvMix0aGlzLnByb2plY3Rpb24ueT0tdGhpcy5oZWlnaHQvMjt2YXIgYz1nbG9iYWxzLmdsO2MuYmluZFRleHR1cmUoYy5URVhUVVJFXzJELHRoaXMuYmFzZVRleHR1cmUuX2dsVGV4dHVyZSksYy50ZXhJbWFnZTJEKGMuVEVYVFVSRV8yRCwwLGMuUkdCQSx0aGlzLndpZHRoLHRoaXMuaGVpZ2h0LDAsYy5SR0JBLGMuVU5TSUdORURfQllURSxudWxsKX1lbHNlIHRoaXMuZnJhbWUud2lkdGg9dGhpcy53aWR0aCx0aGlzLmZyYW1lLmhlaWdodD10aGlzLmhlaWdodCx0aGlzLnJlbmRlcmVyLnJlc2l6ZSh0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KX0scHJvdG8uaW5pdENhbnZhcz1mdW5jdGlvbigpe3RoaXMucmVuZGVyZXI9bmV3IENhbnZhc1JlbmRlcmVyKHRoaXMud2lkdGgsdGhpcy5oZWlnaHQsbnVsbCwwKSx0aGlzLmJhc2VUZXh0dXJlPW5ldyBCYXNlVGV4dHVyZSh0aGlzLnJlbmRlcmVyLnZpZXcpLHRoaXMuZnJhbWU9bmV3IFJlY3RhbmdsZSgwLDAsdGhpcy53aWR0aCx0aGlzLmhlaWdodCksdGhpcy5yZW5kZXI9dGhpcy5yZW5kZXJDYW52YXN9LHByb3RvLnJlbmRlcldlYkdMPWZ1bmN0aW9uKGEsYixjKXt2YXIgZD1nbG9iYWxzLmdsO2QuY29sb3JNYXNrKCEwLCEwLCEwLCEwKSxkLnZpZXdwb3J0KDAsMCx0aGlzLndpZHRoLHRoaXMuaGVpZ2h0KSxkLmJpbmRGcmFtZWJ1ZmZlcihkLkZSQU1FQlVGRkVSLHRoaXMuZ2xGcmFtZWJ1ZmZlciksYyYmKGQuY2xlYXJDb2xvcigwLDAsMCwwKSxkLmNsZWFyKGQuQ09MT1JfQlVGRkVSX0JJVCkpO3ZhciBlPWEuY2hpbGRyZW4sZj1hLndvcmxkVHJhbnNmb3JtO2Eud29ybGRUcmFuc2Zvcm09bWF0My5jcmVhdGUoKSxhLndvcmxkVHJhbnNmb3JtWzRdPS0xLGEud29ybGRUcmFuc2Zvcm1bNV09LTIqdGhpcy5wcm9qZWN0aW9uLnksYiYmKGEud29ybGRUcmFuc2Zvcm1bMl09Yi54LGEud29ybGRUcmFuc2Zvcm1bNV0tPWIueSksZ2xvYmFscy52aXNpYmxlQ291bnQrKyxhLnZjb3VudD1nbG9iYWxzLnZpc2libGVDb3VudDtmb3IodmFyIGc9MCxoPWUubGVuZ3RoO2g+ZztnKyspZVtnXS51cGRhdGVUcmFuc2Zvcm0oKTt2YXIgaT1hLl9fcmVuZGVyR3JvdXA7aT9hPT09aS5yb290P2kucmVuZGVyKHRoaXMucHJvamVjdGlvbix0aGlzLmdsRnJhbWVidWZmZXIpOmkucmVuZGVyU3BlY2lmaWMoYSx0aGlzLnByb2plY3Rpb24sdGhpcy5nbEZyYW1lYnVmZmVyKToodGhpcy5yZW5kZXJHcm91cHx8KHRoaXMucmVuZGVyR3JvdXA9bmV3IFdlYkdMUmVuZGVyR3JvdXAoZCkpLHRoaXMucmVuZGVyR3JvdXAuc2V0UmVuZGVyYWJsZShhKSx0aGlzLnJlbmRlckdyb3VwLnJlbmRlcih0aGlzLnByb2plY3Rpb24sdGhpcy5nbEZyYW1lYnVmZmVyKSksYS53b3JsZFRyYW5zZm9ybT1mfSxwcm90by5yZW5kZXJDYW52YXM9ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPWEuY2hpbGRyZW47YS53b3JsZFRyYW5zZm9ybT1tYXQzLmNyZWF0ZSgpLGImJihhLndvcmxkVHJhbnNmb3JtWzJdPWIueCxhLndvcmxkVHJhbnNmb3JtWzVdPWIueSk7Zm9yKHZhciBlPTAsZj1kLmxlbmd0aDtmPmU7ZSsrKWRbZV0udXBkYXRlVHJhbnNmb3JtKCk7YyYmdGhpcy5yZW5kZXJlci5jb250ZXh0LmNsZWFyUmVjdCgwLDAsdGhpcy53aWR0aCx0aGlzLmhlaWdodCksdGhpcy5yZW5kZXJlci5yZW5kZXJEaXNwbGF5T2JqZWN0KGEpLHRoaXMucmVuZGVyZXIuY29udGV4dC5zZXRUcmFuc2Zvcm0oMSwwLDAsMSwwLDApfSxtb2R1bGUuZXhwb3J0cz1SZW5kZXJUZXh0dXJlOyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO2Z1bmN0aW9uIFRleHR1cmUoYSxiKXtpZihFdmVudFRhcmdldC5jYWxsKHRoaXMpLGJ8fCh0aGlzLm5vRnJhbWU9ITAsYj1uZXcgUmVjdGFuZ2xlKDAsMCwxLDEpKSxhIGluc3RhbmNlb2YgVGV4dHVyZSYmKGE9YS5iYXNlVGV4dHVyZSksdGhpcy5iYXNlVGV4dHVyZT1hLHRoaXMuZnJhbWU9Yix0aGlzLnRyaW09bmV3IFBvaW50LHRoaXMuc2NvcGU9dGhpcyxhLmhhc0xvYWRlZCl0aGlzLm5vRnJhbWUmJihiPW5ldyBSZWN0YW5nbGUoMCwwLGEud2lkdGgsYS5oZWlnaHQpKSx0aGlzLnNldEZyYW1lKGIpO2Vsc2V7dmFyIGM9dGhpczthLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkZWRcIixmdW5jdGlvbigpe2Mub25CYXNlVGV4dHVyZUxvYWRlZCgpfSl9fXZhciBCYXNlVGV4dHVyZT1yZXF1aXJlKFwiLi9CYXNlVGV4dHVyZVwiKSxQb2ludD1yZXF1aXJlKFwiLi4vZ2VvbS9Qb2ludFwiKSxSZWN0YW5nbGU9cmVxdWlyZShcIi4uL2dlb20vUmVjdGFuZ2xlXCIpLEV2ZW50VGFyZ2V0PXJlcXVpcmUoXCIuLi9ldmVudHMvRXZlbnRUYXJnZXRcIikscHJvdG89VGV4dHVyZS5wcm90b3R5cGU7cHJvdG8ub25CYXNlVGV4dHVyZUxvYWRlZD1mdW5jdGlvbigpe3ZhciBhPXRoaXMuYmFzZVRleHR1cmU7YS5yZW1vdmVFdmVudExpc3RlbmVyKFwibG9hZGVkXCIsdGhpcy5vbkxvYWRlZCksdGhpcy5ub0ZyYW1lJiYodGhpcy5mcmFtZT1uZXcgUmVjdGFuZ2xlKDAsMCxhLndpZHRoLGEuaGVpZ2h0KSksdGhpcy5ub0ZyYW1lPSExLHRoaXMud2lkdGg9dGhpcy5mcmFtZS53aWR0aCx0aGlzLmhlaWdodD10aGlzLmZyYW1lLmhlaWdodCx0aGlzLnNjb3BlLmRpc3BhdGNoRXZlbnQoe3R5cGU6XCJ1cGRhdGVcIixjb250ZW50OnRoaXN9KX0scHJvdG8uZGVzdHJveT1mdW5jdGlvbihhKXthJiZ0aGlzLmJhc2VUZXh0dXJlLmRlc3Ryb3koKX0scHJvdG8uc2V0RnJhbWU9ZnVuY3Rpb24oYSl7aWYodGhpcy5mcmFtZT1hLHRoaXMud2lkdGg9YS53aWR0aCx0aGlzLmhlaWdodD1hLmhlaWdodCxhLngrYS53aWR0aD50aGlzLmJhc2VUZXh0dXJlLndpZHRofHxhLnkrYS5oZWlnaHQ+dGhpcy5iYXNlVGV4dHVyZS5oZWlnaHQpdGhyb3cgbmV3IEVycm9yKFwiVGV4dHVyZSBFcnJvcjogZnJhbWUgZG9lcyBub3QgZml0IGluc2lkZSB0aGUgYmFzZSBUZXh0dXJlIGRpbWVuc2lvbnMgXCIrdGhpcyk7dGhpcy51cGRhdGVGcmFtZT0hMCxUZXh0dXJlLmZyYW1lVXBkYXRlcy5wdXNoKHRoaXMpfSxUZXh0dXJlLmZyb21JbWFnZT1mdW5jdGlvbihhLGIsYyl7dmFyIGQ9VGV4dHVyZS5jYWNoZVthXTtyZXR1cm4gZHx8KGQ9bmV3IFRleHR1cmUoQmFzZVRleHR1cmUuZnJvbUltYWdlKGEsYixjKSksVGV4dHVyZS5jYWNoZVthXT1kKSxkfSxUZXh0dXJlLmZyb21GcmFtZT1mdW5jdGlvbihhKXt2YXIgYj1UZXh0dXJlLmNhY2hlW2FdO2lmKCFiKXRocm93IG5ldyBFcnJvcignVGhlIGZyYW1lSWQgXCInK2ErJ1wiIGRvZXMgbm90IGV4aXN0IGluIHRoZSB0ZXh0dXJlIGNhY2hlICcrdGhpcyk7cmV0dXJuIGJ9LFRleHR1cmUuZnJvbUNhbnZhcz1mdW5jdGlvbihhLGIpe3ZhciBjPW5ldyBCYXNlVGV4dHVyZShhLGIpO3JldHVybiBuZXcgVGV4dHVyZShjKX0sVGV4dHVyZS5hZGRUZXh0dXJlVG9DYWNoZT1mdW5jdGlvbihhLGIpe1RleHR1cmUuY2FjaGVbYl09YX0sVGV4dHVyZS5yZW1vdmVUZXh0dXJlRnJvbUNhY2hlPWZ1bmN0aW9uKGEpe3ZhciBiPVRleHR1cmUuY2FjaGVbYV07cmV0dXJuIFRleHR1cmUuY2FjaGVbYV09bnVsbCxifSxUZXh0dXJlLmNhY2hlPXt9LFRleHR1cmUuZnJhbWVVcGRhdGVzPVtdLFRleHR1cmUuU0NBTEVfTU9ERT1CYXNlVGV4dHVyZS5TQ0FMRV9NT0RFLG1vZHVsZS5leHBvcnRzPVRleHR1cmU7IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcG9pbnRJblRyaWFuZ2xlKGEsYixjLGQsZSxmLGcsaCl7dmFyIGk9Zy1jLGo9aC1kLGs9ZS1jLGw9Zi1kLG09YS1jLG49Yi1kLG89aSppK2oqaixwPWkqaytqKmwscT1pKm0raipuLHI9ayprK2wqbCxzPWsqbStsKm4sdD0xLyhvKnItcCpwKSx1PShyKnEtcCpzKSp0LHY9KG8qcy1wKnEpKnQ7cmV0dXJuIHU+PTAmJnY+PTAmJjE+dSt2fWZ1bmN0aW9uIGNvbnZleChhLGIsYyxkLGUsZixnKXtyZXR1cm4oYi1kKSooZS1jKSsoYy1hKSooZi1kKT49MD09PWd9dmFyIHBsYXRmb3JtPXJlcXVpcmUoXCIuLi9wbGF0Zm9ybVwiKTtleHBvcnRzLnRyaWFuZ3VsYXRlPWZ1bmN0aW9uKGEpe3ZhciBiPSEwLGM9YS5sZW5ndGg+PjE7aWYoMz5jKXJldHVybltdO2Zvcih2YXIgZD1bXSxlPVtdLGY9MDtjPmY7ZisrKWUucHVzaChmKTtmPTA7Zm9yKHZhciBnPWM7Zz4zOyl7dmFyIGg9ZVsoZiswKSVnXSxpPWVbKGYrMSklZ10saj1lWyhmKzIpJWddLGs9YVsyKmhdLGw9YVsyKmgrMV0sbT1hWzIqaV0sbj1hWzIqaSsxXSxvPWFbMipqXSxwPWFbMipqKzFdLHE9ITE7aWYoY29udmV4KGssbCxtLG4sbyxwLGIpKXtxPSEwO2Zvcih2YXIgcj0wO2c+cjtyKyspe3ZhciBzPWVbcl07aWYocyE9PWgmJnMhPT1pJiZzIT09aiYmcG9pbnRJblRyaWFuZ2xlKGFbMipzXSxhWzIqcysxXSxrLGwsbSxuLG8scCkpe3E9ITE7YnJlYWt9fX1pZihxKWQucHVzaChoLGksaiksZS5zcGxpY2UoKGYrMSklZywxKSxnLS0sZj0wO2Vsc2UgaWYoZisrPjMqZyl7aWYoIWIpcmV0dXJuIHBsYXRmb3JtLmNvbnNvbGUud2FybihcIlBJWEkgV2FybmluZzogc2hhcGUgdG9vIGNvbXBsZXggdG8gZmlsbFwiKSxbXTtmb3IoZD1bXSxlPVtdLGY9MDtjPmY7ZisrKWUucHVzaChmKTtmPTAsZz1jLGI9ITF9fXJldHVybiBkLnB1c2goZVswXSxlWzFdLGVbMl0pLGR9OyIsIi8qKlxuICogcGl4aSAwLjIuMSAoNmFhMDAzMClcbiAqIGh0dHA6Ly9kcmtpYml0ei5naXRodWIuaW8vbm9kZS1waXhpL1xuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTQgRHIuIEtpYml0eiwgaHR0cDovL2Rya2liaXR6LmNvbVxuICogU3VwZXIgZmFzdCAyRCByZW5kZXJpbmcgZW5naW5lIGZvciBicm93c2VyaWZ5LCB0aGF0IHVzZXMgV2ViR0wgd2l0aCBhIGNvbnRleHQgMmQgZmFsbGJhY2suXG4gKiBidWlsdDogU3VuIEphbiAwNSAyMDE0IDAxOjUzOjU4IEdNVC0wNTAwIChFU1QpXG4gKlxuICogUGl4aS5qcyAtIHYxLjMuMFxuICogQ29weXJpZ2h0IChjKSAyMDEyLCBNYXQgR3JvdmVzXG4gKi9cblwidXNlIHN0cmljdFwiO3ZhciBwbGF0Zm9ybT1yZXF1aXJlKFwiLi4vcGxhdGZvcm1cIiksQ2FudmFzUmVuZGVyZXI9cmVxdWlyZShcIi4uL3JlbmRlcmVycy9jYW52YXMvQ2FudmFzUmVuZGVyZXJcIiksV2ViR0xSZW5kZXJlcj1yZXF1aXJlKFwiLi4vcmVuZGVyZXJzL3dlYmdsL1dlYkdMUmVuZGVyZXJcIik7bW9kdWxlLmV4cG9ydHM9ZnVuY3Rpb24oYSxiLGMsZCxlKXthfHwoYT04MDApLGJ8fChiPTYwMCk7dmFyIGY9ZnVuY3Rpb24oKXt0cnl7dmFyIGE9cGxhdGZvcm0uY3JlYXRlQ2FudmFzKCk7cmV0dXJuISFwbGF0Zm9ybS53aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0JiYoYS5nZXRDb250ZXh0KFwid2ViZ2xcIil8fGEuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiKSl9Y2F0Y2goYil7cmV0dXJuITF9fSgpO2lmKGYmJnBsYXRmb3JtLm5hdmlnYXRvcil7dmFyIGc9LTEhPT1wbGF0Zm9ybS5uYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcInRyaWRlbnRcIik7Zj0hZ31yZXR1cm4gZj9uZXcgV2ViR0xSZW5kZXJlcihhLGIsYyxkLGUpOm5ldyBDYW52YXNSZW5kZXJlcihhLGIsYyxkKX07IiwiLyoqXG4gKiBwaXhpIDAuMi4xICg2YWEwMDMwKVxuICogaHR0cDovL2Rya2liaXR6LmdpdGh1Yi5pby9ub2RlLXBpeGkvXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNCBEci4gS2liaXR6LCBodHRwOi8vZHJraWJpdHouY29tXG4gKiBTdXBlciBmYXN0IDJEIHJlbmRlcmluZyBlbmdpbmUgZm9yIGJyb3dzZXJpZnksIHRoYXQgdXNlcyBXZWJHTCB3aXRoIGEgY29udGV4dCAyZCBmYWxsYmFjay5cbiAqIGJ1aWx0OiBTdW4gSmFuIDA1IDIwMTQgMDE6NTM6NTggR01ULTA1MDAgKEVTVClcbiAqXG4gKiBQaXhpLmpzIC0gdjEuMy4wXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTIsIE1hdCBHcm92ZXNcbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7ZXhwb3J0cy5oZXgycmdiPWZ1bmN0aW9uKGEpe3JldHVyblsoYT4+MTYmMjU1KS8yNTUsKGE+PjgmMjU1KS8yNTUsKDI1NSZhKS8yNTVdfTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjtmdW5jdGlvbiBsb2dHcm91cChhKXt2YXIgYj1wbGF0Zm9ybS5jb25zb2xlO2IuZ3JvdXBDb2xsYXBzZWQ/Yi5ncm91cENvbGxhcHNlZChhKTpiLmdyb3VwP2IuZ3JvdXAoYSk6Yi5sb2coYStcIiA+Pj4+Pj4+Pj5cIil9ZnVuY3Rpb24gbG9nR3JvdXBFbmQoYSl7dmFyIGI9cGxhdGZvcm0uY29uc29sZTtiLmdyb3VwRW5kP2IuZ3JvdXBFbmQoYSk6Yi5sb2coYStcIiBfX19fX19fX19cIil9dmFyIHBsYXRmb3JtPXJlcXVpcmUoXCIuLi9wbGF0Zm9ybVwiKTtleHBvcnRzLnJ1bkxpc3Q9ZnVuY3Rpb24oYSxiKXt2YXIgYz0wLGQ9YS5maXJzdDtmb3IoYj1cInBpeGkucnVuTGlzdFwiKyhiP1wiKFwiK2IrXCIpXCI6XCJcIiksbG9nR3JvdXAoYikscGxhdGZvcm0uY29uc29sZS5sb2coZCk7ZC5faU5leHQ7KWlmKGMrKyxkPWQuX2lOZXh0LHBsYXRmb3JtLmNvbnNvbGUubG9nKGQpLGM+MTAwKXtwbGF0Zm9ybS5jb25zb2xlLmxvZyhcIkJSRUFLXCIpO2JyZWFrfWxvZ0dyb3VwRW5kKGIpfTsiLCIvKipcbiAqIHBpeGkgMC4yLjEgKDZhYTAwMzApXG4gKiBodHRwOi8vZHJraWJpdHouZ2l0aHViLmlvL25vZGUtcGl4aS9cbiAqIENvcHlyaWdodCAoYykgMjAxMy0yMDE0IERyLiBLaWJpdHosIGh0dHA6Ly9kcmtpYml0ei5jb21cbiAqIFN1cGVyIGZhc3QgMkQgcmVuZGVyaW5nIGVuZ2luZSBmb3IgYnJvd3NlcmlmeSwgdGhhdCB1c2VzIFdlYkdMIHdpdGggYSBjb250ZXh0IDJkIGZhbGxiYWNrLlxuICogYnVpbHQ6IFN1biBKYW4gMDUgMjAxNCAwMTo1Mzo1OCBHTVQtMDUwMCAoRVNUKVxuICpcbiAqIFBpeGkuanMgLSB2MS4zLjBcbiAqIENvcHlyaWdodCAoYykgMjAxMiwgTWF0IEdyb3Zlc1xuICovXG5cInVzZSBzdHJpY3RcIjt2YXIgc3BpbmU9bW9kdWxlLmV4cG9ydHM9e307c3BpbmUuQm9uZURhdGE9ZnVuY3Rpb24oYSxiKXt0aGlzLm5hbWU9YSx0aGlzLnBhcmVudD1ifSxzcGluZS5Cb25lRGF0YS5wcm90b3R5cGU9e2xlbmd0aDowLHg6MCx5OjAscm90YXRpb246MCxzY2FsZVg6MSxzY2FsZVk6MX0sc3BpbmUuU2xvdERhdGE9ZnVuY3Rpb24oYSxiKXt0aGlzLm5hbWU9YSx0aGlzLmJvbmVEYXRhPWJ9LHNwaW5lLlNsb3REYXRhLnByb3RvdHlwZT17cjoxLGc6MSxiOjEsYToxLGF0dGFjaG1lbnROYW1lOm51bGx9LHNwaW5lLkJvbmU9ZnVuY3Rpb24oYSxiKXt0aGlzLmRhdGE9YSx0aGlzLnBhcmVudD1iLHRoaXMuc2V0VG9TZXR1cFBvc2UoKX0sc3BpbmUuQm9uZS55RG93bj0hMSxzcGluZS5Cb25lLnByb3RvdHlwZT17eDowLHk6MCxyb3RhdGlvbjowLHNjYWxlWDoxLHNjYWxlWToxLG0wMDowLG0wMTowLHdvcmxkWDowLG0xMDowLG0xMTowLHdvcmxkWTowLHdvcmxkUm90YXRpb246MCx3b3JsZFNjYWxlWDoxLHdvcmxkU2NhbGVZOjEsdXBkYXRlV29ybGRUcmFuc2Zvcm06ZnVuY3Rpb24oYSxiKXt2YXIgYz10aGlzLnBhcmVudDtudWxsIT1jPyh0aGlzLndvcmxkWD10aGlzLngqYy5tMDArdGhpcy55KmMubTAxK2Mud29ybGRYLHRoaXMud29ybGRZPXRoaXMueCpjLm0xMCt0aGlzLnkqYy5tMTErYy53b3JsZFksdGhpcy53b3JsZFNjYWxlWD1jLndvcmxkU2NhbGVYKnRoaXMuc2NhbGVYLHRoaXMud29ybGRTY2FsZVk9Yy53b3JsZFNjYWxlWSp0aGlzLnNjYWxlWSx0aGlzLndvcmxkUm90YXRpb249Yy53b3JsZFJvdGF0aW9uK3RoaXMucm90YXRpb24pOih0aGlzLndvcmxkWD10aGlzLngsdGhpcy53b3JsZFk9dGhpcy55LHRoaXMud29ybGRTY2FsZVg9dGhpcy5zY2FsZVgsdGhpcy53b3JsZFNjYWxlWT10aGlzLnNjYWxlWSx0aGlzLndvcmxkUm90YXRpb249dGhpcy5yb3RhdGlvbik7dmFyIGQ9dGhpcy53b3JsZFJvdGF0aW9uKk1hdGguUEkvMTgwLGU9TWF0aC5jb3MoZCksZj1NYXRoLnNpbihkKTt0aGlzLm0wMD1lKnRoaXMud29ybGRTY2FsZVgsdGhpcy5tMTA9Zip0aGlzLndvcmxkU2NhbGVYLHRoaXMubTAxPS1mKnRoaXMud29ybGRTY2FsZVksdGhpcy5tMTE9ZSp0aGlzLndvcmxkU2NhbGVZLGEmJih0aGlzLm0wMD0tdGhpcy5tMDAsdGhpcy5tMDE9LXRoaXMubTAxKSxiJiYodGhpcy5tMTA9LXRoaXMubTEwLHRoaXMubTExPS10aGlzLm0xMSksc3BpbmUuQm9uZS55RG93biYmKHRoaXMubTEwPS10aGlzLm0xMCx0aGlzLm0xMT0tdGhpcy5tMTEpfSxzZXRUb1NldHVwUG9zZTpmdW5jdGlvbigpe3ZhciBhPXRoaXMuZGF0YTt0aGlzLng9YS54LHRoaXMueT1hLnksdGhpcy5yb3RhdGlvbj1hLnJvdGF0aW9uLHRoaXMuc2NhbGVYPWEuc2NhbGVYLHRoaXMuc2NhbGVZPWEuc2NhbGVZfX0sc3BpbmUuU2xvdD1mdW5jdGlvbihhLGIsYyl7dGhpcy5kYXRhPWEsdGhpcy5za2VsZXRvbj1iLHRoaXMuYm9uZT1jLHRoaXMuc2V0VG9TZXR1cFBvc2UoKX0sc3BpbmUuU2xvdC5wcm90b3R5cGU9e3I6MSxnOjEsYjoxLGE6MSxfYXR0YWNobWVudFRpbWU6MCxhdHRhY2htZW50Om51bGwsc2V0QXR0YWNobWVudDpmdW5jdGlvbihhKXt0aGlzLmF0dGFjaG1lbnQ9YSx0aGlzLl9hdHRhY2htZW50VGltZT10aGlzLnNrZWxldG9uLnRpbWV9LHNldEF0dGFjaG1lbnRUaW1lOmZ1bmN0aW9uKGEpe3RoaXMuX2F0dGFjaG1lbnRUaW1lPXRoaXMuc2tlbGV0b24udGltZS1hfSxnZXRBdHRhY2htZW50VGltZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLnNrZWxldG9uLnRpbWUtdGhpcy5fYXR0YWNobWVudFRpbWV9LHNldFRvU2V0dXBQb3NlOmZ1bmN0aW9uKCl7dmFyIGE9dGhpcy5kYXRhO3RoaXMucj1hLnIsdGhpcy5nPWEuZyx0aGlzLmI9YS5iLHRoaXMuYT1hLmE7Zm9yKHZhciBiPXRoaXMuc2tlbGV0b24uZGF0YS5zbG90cyxjPTAsZD1iLmxlbmd0aDtkPmM7YysrKWlmKGJbY109PWEpe3RoaXMuc2V0QXR0YWNobWVudChhLmF0dGFjaG1lbnROYW1lP3RoaXMuc2tlbGV0b24uZ2V0QXR0YWNobWVudEJ5U2xvdEluZGV4KGMsYS5hdHRhY2htZW50TmFtZSk6bnVsbCk7YnJlYWt9fX0sc3BpbmUuU2tpbj1mdW5jdGlvbihhKXt0aGlzLm5hbWU9YSx0aGlzLmF0dGFjaG1lbnRzPXt9fSxzcGluZS5Ta2luLnByb3RvdHlwZT17YWRkQXR0YWNobWVudDpmdW5jdGlvbihhLGIsYyl7dGhpcy5hdHRhY2htZW50c1thK1wiOlwiK2JdPWN9LGdldEF0dGFjaG1lbnQ6ZnVuY3Rpb24oYSxiKXtyZXR1cm4gdGhpcy5hdHRhY2htZW50c1thK1wiOlwiK2JdfSxfYXR0YWNoQWxsOmZ1bmN0aW9uKGEsYil7Zm9yKHZhciBjIGluIGIuYXR0YWNobWVudHMpe3ZhciBkPWMuaW5kZXhPZihcIjpcIiksZT1wYXJzZUludChjLnN1YnN0cmluZygwLGQpLDEwKSxmPWMuc3Vic3RyaW5nKGQrMSksZz1hLnNsb3RzW2VdO2lmKGcuYXR0YWNobWVudCYmZy5hdHRhY2htZW50Lm5hbWU9PWYpe3ZhciBoPXRoaXMuZ2V0QXR0YWNobWVudChlLGYpO2gmJmcuc2V0QXR0YWNobWVudChoKX19fX0sc3BpbmUuQW5pbWF0aW9uPWZ1bmN0aW9uKGEsYixjKXt0aGlzLm5hbWU9YSx0aGlzLnRpbWVsaW5lcz1iLHRoaXMuZHVyYXRpb249Y30sc3BpbmUuQW5pbWF0aW9uLnByb3RvdHlwZT17YXBwbHk6ZnVuY3Rpb24oYSxiLGMpe2MmJnRoaXMuZHVyYXRpb24mJihiJT10aGlzLmR1cmF0aW9uKTtmb3IodmFyIGQ9dGhpcy50aW1lbGluZXMsZT0wLGY9ZC5sZW5ndGg7Zj5lO2UrKylkW2VdLmFwcGx5KGEsYiwxKX0sbWl4OmZ1bmN0aW9uKGEsYixjLGQpe2MmJnRoaXMuZHVyYXRpb24mJihiJT10aGlzLmR1cmF0aW9uKTtmb3IodmFyIGU9dGhpcy50aW1lbGluZXMsZj0wLGc9ZS5sZW5ndGg7Zz5mO2YrKyllW2ZdLmFwcGx5KGEsYixkKX19LHNwaW5lLmJpbmFyeVNlYXJjaD1mdW5jdGlvbihhLGIsYyl7dmFyIGQ9MCxlPU1hdGguZmxvb3IoYS5sZW5ndGgvYyktMjtpZighZSlyZXR1cm4gYztmb3IodmFyIGY9ZT4+PjE7Oyl7aWYoYVsoZisxKSpjXTw9Yj9kPWYrMTplPWYsZD09ZSlyZXR1cm4oZCsxKSpjO2Y9ZCtlPj4+MX19LHNwaW5lLmxpbmVhclNlYXJjaD1mdW5jdGlvbihhLGIsYyl7Zm9yKHZhciBkPTAsZT1hLmxlbmd0aC1jO2U+PWQ7ZCs9YylpZihhW2RdPmIpcmV0dXJuIGQ7cmV0dXJuLTF9LHNwaW5lLkN1cnZlcz1mdW5jdGlvbihhKXt0aGlzLmN1cnZlcz1bXSx0aGlzLmN1cnZlcy5sZW5ndGg9NiooYS0xKX0sc3BpbmUuQ3VydmVzLnByb3RvdHlwZT17c2V0TGluZWFyOmZ1bmN0aW9uKGEpe3RoaXMuY3VydmVzWzYqYV09MH0sc2V0U3RlcHBlZDpmdW5jdGlvbihhKXt0aGlzLmN1cnZlc1s2KmFdPS0xfSxzZXRDdXJ2ZTpmdW5jdGlvbihhLGIsYyxkLGUpe3ZhciBmPS4xLGc9ZipmLGg9ZypmLGk9MypmLGo9MypnLGs9NipnLGw9NipoLG09MiotYitkLG49MiotYytlLG89MyooYi1kKSsxLHA9MyooYy1lKSsxLHE9NiphLHI9dGhpcy5jdXJ2ZXM7cltxXT1iKmkrbSpqK28qaCxyW3ErMV09YyppK24qaitwKmgscltxKzJdPW0qaytvKmwscltxKzNdPW4qaytwKmwscltxKzRdPW8qbCxyW3ErNV09cCpsfSxnZXRDdXJ2ZVBlcmNlbnQ6ZnVuY3Rpb24oYSxiKXtiPTA+Yj8wOmI+MT8xOmI7dmFyIGM9NiphLGQ9dGhpcy5jdXJ2ZXMsZT1kW2NdO2lmKCFlKXJldHVybiBiO2lmKC0xPT1lKXJldHVybiAwO2Zvcih2YXIgZj1kW2MrMV0sZz1kW2MrMl0saD1kW2MrM10saT1kW2MrNF0saj1kW2MrNV0saz1lLGw9ZixtPTg7Oyl7aWYoaz49Yil7dmFyIG49ay1lLG89bC1mO3JldHVybiBvKyhsLW8pKihiLW4pLyhrLW4pfWlmKCFtKWJyZWFrO20tLSxlKz1nLGYrPWgsZys9aSxoKz1qLGsrPWUsbCs9Zn1yZXR1cm4gbCsoMS1sKSooYi1rKS8oMS1rKX19LHNwaW5lLlJvdGF0ZVRpbWVsaW5lPWZ1bmN0aW9uKGEpe3RoaXMuY3VydmVzPW5ldyBzcGluZS5DdXJ2ZXMoYSksdGhpcy5mcmFtZXM9W10sdGhpcy5mcmFtZXMubGVuZ3RoPTIqYX0sc3BpbmUuUm90YXRlVGltZWxpbmUucHJvdG90eXBlPXtib25lSW5kZXg6MCxnZXRGcmFtZUNvdW50OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuZnJhbWVzLmxlbmd0aC8yfSxzZXRGcmFtZTpmdW5jdGlvbihhLGIsYyl7YSo9Mix0aGlzLmZyYW1lc1thXT1iLHRoaXMuZnJhbWVzW2ErMV09Y30sYXBwbHk6ZnVuY3Rpb24oYSxiLGMpe3ZhciBkLGU9dGhpcy5mcmFtZXM7aWYoIShiPGVbMF0pKXt2YXIgZj1hLmJvbmVzW3RoaXMuYm9uZUluZGV4XTtpZihiPj1lW2UubGVuZ3RoLTJdKXtmb3IoZD1mLmRhdGEucm90YXRpb24rZVtlLmxlbmd0aC0xXS1mLnJvdGF0aW9uO2Q+MTgwOylkLT0zNjA7Zm9yKDstMTgwPmQ7KWQrPTM2MDtyZXR1cm4gZi5yb3RhdGlvbis9ZCpjLHZvaWQgMH12YXIgZz1zcGluZS5iaW5hcnlTZWFyY2goZSxiLDIpLGg9ZVtnLTFdLGk9ZVtnXSxqPTEtKGItaSkvKGVbZy0yXS1pKTtmb3Ioaj10aGlzLmN1cnZlcy5nZXRDdXJ2ZVBlcmNlbnQoZy8yLTEsaiksZD1lW2crMV0taDtkPjE4MDspZC09MzYwO2Zvcig7LTE4MD5kOylkKz0zNjA7Zm9yKGQ9Zi5kYXRhLnJvdGF0aW9uKyhoK2QqaiktZi5yb3RhdGlvbjtkPjE4MDspZC09MzYwO2Zvcig7LTE4MD5kOylkKz0zNjA7Zi5yb3RhdGlvbis9ZCpjfX19LHNwaW5lLlRyYW5zbGF0ZVRpbWVsaW5lPWZ1bmN0aW9uKGEpe3RoaXMuY3VydmVzPW5ldyBzcGluZS5DdXJ2ZXMoYSksdGhpcy5mcmFtZXM9W10sdGhpcy5mcmFtZXMubGVuZ3RoPTMqYX0sc3BpbmUuVHJhbnNsYXRlVGltZWxpbmUucHJvdG90eXBlPXtib25lSW5kZXg6MCxnZXRGcmFtZUNvdW50OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuZnJhbWVzLmxlbmd0aC8zfSxzZXRGcmFtZTpmdW5jdGlvbihhLGIsYyxkKXthKj0zLHRoaXMuZnJhbWVzW2FdPWIsdGhpcy5mcmFtZXNbYSsxXT1jLHRoaXMuZnJhbWVzW2ErMl09ZH0sYXBwbHk6ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPXRoaXMuZnJhbWVzO2lmKCEoYjxkWzBdKSl7dmFyIGU9YS5ib25lc1t0aGlzLmJvbmVJbmRleF07aWYoYj49ZFtkLmxlbmd0aC0zXSlyZXR1cm4gZS54Kz0oZS5kYXRhLngrZFtkLmxlbmd0aC0yXS1lLngpKmMsZS55Kz0oZS5kYXRhLnkrZFtkLmxlbmd0aC0xXS1lLnkpKmMsdm9pZCAwO3ZhciBmPXNwaW5lLmJpbmFyeVNlYXJjaChkLGIsMyksZz1kW2YtMl0saD1kW2YtMV0saT1kW2ZdLGo9MS0oYi1pKS8oZFtmKy0zXS1pKTtqPXRoaXMuY3VydmVzLmdldEN1cnZlUGVyY2VudChmLzMtMSxqKSxlLngrPShlLmRhdGEueCtnKyhkW2YrMV0tZykqai1lLngpKmMsZS55Kz0oZS5kYXRhLnkraCsoZFtmKzJdLWgpKmotZS55KSpjfX19LHNwaW5lLlNjYWxlVGltZWxpbmU9ZnVuY3Rpb24oYSl7dGhpcy5jdXJ2ZXM9bmV3IHNwaW5lLkN1cnZlcyhhKSx0aGlzLmZyYW1lcz1bXSx0aGlzLmZyYW1lcy5sZW5ndGg9MyphfSxzcGluZS5TY2FsZVRpbWVsaW5lLnByb3RvdHlwZT17Ym9uZUluZGV4OjAsZ2V0RnJhbWVDb3VudDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmZyYW1lcy5sZW5ndGgvM30sc2V0RnJhbWU6ZnVuY3Rpb24oYSxiLGMsZCl7YSo9Myx0aGlzLmZyYW1lc1thXT1iLHRoaXMuZnJhbWVzW2ErMV09Yyx0aGlzLmZyYW1lc1thKzJdPWR9LGFwcGx5OmZ1bmN0aW9uKGEsYixjKXt2YXIgZD10aGlzLmZyYW1lcztpZighKGI8ZFswXSkpe3ZhciBlPWEuYm9uZXNbdGhpcy5ib25lSW5kZXhdO2lmKGI+PWRbZC5sZW5ndGgtM10pcmV0dXJuIGUuc2NhbGVYKz0oZS5kYXRhLnNjYWxlWC0xK2RbZC5sZW5ndGgtMl0tZS5zY2FsZVgpKmMsZS5zY2FsZVkrPShlLmRhdGEuc2NhbGVZLTErZFtkLmxlbmd0aC0xXS1lLnNjYWxlWSkqYyx2b2lkIDA7dmFyIGY9c3BpbmUuYmluYXJ5U2VhcmNoKGQsYiwzKSxnPWRbZi0yXSxoPWRbZi0xXSxpPWRbZl0saj0xLShiLWkpLyhkW2YrLTNdLWkpO2o9dGhpcy5jdXJ2ZXMuZ2V0Q3VydmVQZXJjZW50KGYvMy0xLGopLGUuc2NhbGVYKz0oZS5kYXRhLnNjYWxlWC0xK2crKGRbZisxXS1nKSpqLWUuc2NhbGVYKSpjLGUuc2NhbGVZKz0oZS5kYXRhLnNjYWxlWS0xK2grKGRbZisyXS1oKSpqLWUuc2NhbGVZKSpjfX19LHNwaW5lLkNvbG9yVGltZWxpbmU9ZnVuY3Rpb24oYSl7dGhpcy5jdXJ2ZXM9bmV3IHNwaW5lLkN1cnZlcyhhKSx0aGlzLmZyYW1lcz1bXSx0aGlzLmZyYW1lcy5sZW5ndGg9NSphfSxzcGluZS5Db2xvclRpbWVsaW5lLnByb3RvdHlwZT17c2xvdEluZGV4OjAsZ2V0RnJhbWVDb3VudDpmdW5jdGlvbigpe3JldHVybiB0aGlzLmZyYW1lcy5sZW5ndGgvMn0sc2V0RnJhbWU6ZnVuY3Rpb24oYSxiLGMsZCxlLGYpe2EqPTUsdGhpcy5mcmFtZXNbYV09Yix0aGlzLmZyYW1lc1thKzFdPWMsdGhpcy5mcmFtZXNbYSsyXT1kLHRoaXMuZnJhbWVzW2ErM109ZSx0aGlzLmZyYW1lc1thKzRdPWZ9LGFwcGx5OmZ1bmN0aW9uKGEsYixjKXt2YXIgZD10aGlzLmZyYW1lcztpZighKGI8ZFswXSkpe3ZhciBlPWEuc2xvdHNbdGhpcy5zbG90SW5kZXhdO2lmKGI+PWRbZC5sZW5ndGgtNV0pe3ZhciBmPWQubGVuZ3RoLTE7cmV0dXJuIGUucj1kW2YtM10sZS5nPWRbZi0yXSxlLmI9ZFtmLTFdLGUuYT1kW2ZdLHZvaWQgMH12YXIgZz1zcGluZS5iaW5hcnlTZWFyY2goZCxiLDUpLGg9ZFtnLTRdLGk9ZFtnLTNdLGo9ZFtnLTJdLGs9ZFtnLTFdLGw9ZFtnXSxtPTEtKGItbCkvKGRbZy01XS1sKTttPXRoaXMuY3VydmVzLmdldEN1cnZlUGVyY2VudChnLzUtMSxtKTt2YXIgbj1oKyhkW2crMV0taCkqbSxvPWkrKGRbZysyXS1pKSptLHA9aisoZFtnKzNdLWopKm0scT1rKyhkW2crNF0taykqbTsxPmM/KGUucis9KG4tZS5yKSpjLGUuZys9KG8tZS5nKSpjLGUuYis9KHAtZS5iKSpjLGUuYSs9KHEtZS5hKSpjKTooZS5yPW4sZS5nPW8sZS5iPXAsZS5hPXEpfX19LHNwaW5lLkF0dGFjaG1lbnRUaW1lbGluZT1mdW5jdGlvbihhKXt0aGlzLmN1cnZlcz1uZXcgc3BpbmUuQ3VydmVzKGEpLHRoaXMuZnJhbWVzPVtdLHRoaXMuZnJhbWVzLmxlbmd0aD1hLHRoaXMuYXR0YWNobWVudE5hbWVzPVtdLHRoaXMuYXR0YWNobWVudE5hbWVzLmxlbmd0aD1hfSxzcGluZS5BdHRhY2htZW50VGltZWxpbmUucHJvdG90eXBlPXtzbG90SW5kZXg6MCxnZXRGcmFtZUNvdW50OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuZnJhbWVzLmxlbmd0aH0sc2V0RnJhbWU6ZnVuY3Rpb24oYSxiLGMpe3RoaXMuZnJhbWVzW2FdPWIsdGhpcy5hdHRhY2htZW50TmFtZXNbYV09Y30sYXBwbHk6ZnVuY3Rpb24oYSxiKXt2YXIgYz10aGlzLmZyYW1lcztpZighKGI8Y1swXSkpe3ZhciBkO2Q9Yj49Y1tjLmxlbmd0aC0xXT9jLmxlbmd0aC0xOnNwaW5lLmJpbmFyeVNlYXJjaChjLGIsMSktMTt2YXIgZT10aGlzLmF0dGFjaG1lbnROYW1lc1tkXTthLnNsb3RzW3RoaXMuc2xvdEluZGV4XS5zZXRBdHRhY2htZW50KGU/YS5nZXRBdHRhY2htZW50QnlTbG90SW5kZXgodGhpcy5zbG90SW5kZXgsZSk6bnVsbCl9fX0sc3BpbmUuU2tlbGV0b25EYXRhPWZ1bmN0aW9uKCl7dGhpcy5ib25lcz1bXSx0aGlzLnNsb3RzPVtdLHRoaXMuc2tpbnM9W10sdGhpcy5hbmltYXRpb25zPVtdfSxzcGluZS5Ta2VsZXRvbkRhdGEucHJvdG90eXBlPXtkZWZhdWx0U2tpbjpudWxsLGZpbmRCb25lOmZ1bmN0aW9uKGEpe2Zvcih2YXIgYj10aGlzLmJvbmVzLGM9MCxkPWIubGVuZ3RoO2Q+YztjKyspaWYoYltjXS5uYW1lPT1hKXJldHVybiBiW2NdO3JldHVybiBudWxsfSxmaW5kQm9uZUluZGV4OmZ1bmN0aW9uKGEpe2Zvcih2YXIgYj10aGlzLmJvbmVzLGM9MCxkPWIubGVuZ3RoO2Q+YztjKyspaWYoYltjXS5uYW1lPT1hKXJldHVybiBjO3JldHVybi0xfSxmaW5kU2xvdDpmdW5jdGlvbihhKXtmb3IodmFyIGI9dGhpcy5zbG90cyxjPTAsZD1iLmxlbmd0aDtkPmM7YysrKWlmKGJbY10ubmFtZT09YSlyZXR1cm4gYltjXTtyZXR1cm4gbnVsbH0sZmluZFNsb3RJbmRleDpmdW5jdGlvbihhKXtmb3IodmFyIGI9dGhpcy5zbG90cyxjPTAsZD1iLmxlbmd0aDtkPmM7YysrKWlmKGJbY10ubmFtZT09YSlyZXR1cm4gYztyZXR1cm4tMX0sZmluZFNraW46ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPXRoaXMuc2tpbnMsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKylpZihiW2NdLm5hbWU9PWEpcmV0dXJuIGJbY107cmV0dXJuIG51bGx9LGZpbmRBbmltYXRpb246ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPXRoaXMuYW5pbWF0aW9ucyxjPTAsZD1iLmxlbmd0aDtkPmM7YysrKWlmKGJbY10ubmFtZT09YSlyZXR1cm4gYltjXTtyZXR1cm4gbnVsbH19LHNwaW5lLlNrZWxldG9uPWZ1bmN0aW9uKGEpe3RoaXMuZGF0YT1hLHRoaXMuYm9uZXM9W107Zm9yKHZhciBiPTAsYz1hLmJvbmVzLmxlbmd0aDtjPmI7YisrKXt2YXIgZD1hLmJvbmVzW2JdLGU9ZC5wYXJlbnQ/dGhpcy5ib25lc1thLmJvbmVzLmluZGV4T2YoZC5wYXJlbnQpXTpudWxsO3RoaXMuYm9uZXMucHVzaChuZXcgc3BpbmUuQm9uZShkLGUpKX1mb3IodGhpcy5zbG90cz1bXSx0aGlzLmRyYXdPcmRlcj1bXSxiPTAsYz1hLnNsb3RzLmxlbmd0aDtjPmI7YisrKXt2YXIgZj1hLnNsb3RzW2JdLGc9dGhpcy5ib25lc1thLmJvbmVzLmluZGV4T2YoZi5ib25lRGF0YSldLGg9bmV3IHNwaW5lLlNsb3QoZix0aGlzLGcpO3RoaXMuc2xvdHMucHVzaChoKSx0aGlzLmRyYXdPcmRlci5wdXNoKGgpfX0sc3BpbmUuU2tlbGV0b24ucHJvdG90eXBlPXt4OjAseTowLHNraW46bnVsbCxyOjEsZzoxLGI6MSxhOjEsdGltZTowLGZsaXBYOiExLGZsaXBZOiExLHVwZGF0ZVdvcmxkVHJhbnNmb3JtOmZ1bmN0aW9uKCl7Zm9yKHZhciBhPXRoaXMuZmxpcFgsYj10aGlzLmZsaXBZLGM9dGhpcy5ib25lcyxkPTAsZT1jLmxlbmd0aDtlPmQ7ZCsrKWNbZF0udXBkYXRlV29ybGRUcmFuc2Zvcm0oYSxiKX0sc2V0VG9TZXR1cFBvc2U6ZnVuY3Rpb24oKXt0aGlzLnNldEJvbmVzVG9TZXR1cFBvc2UoKSx0aGlzLnNldFNsb3RzVG9TZXR1cFBvc2UoKX0sc2V0Qm9uZXNUb1NldHVwUG9zZTpmdW5jdGlvbigpe2Zvcih2YXIgYT10aGlzLmJvbmVzLGI9MCxjPWEubGVuZ3RoO2M+YjtiKyspYVtiXS5zZXRUb1NldHVwUG9zZSgpfSxzZXRTbG90c1RvU2V0dXBQb3NlOmZ1bmN0aW9uKCl7Zm9yKHZhciBhPXRoaXMuc2xvdHMsYj0wLGM9YS5sZW5ndGg7Yz5iO2IrKylhW2JdLnNldFRvU2V0dXBQb3NlKGIpfSxnZXRSb290Qm9uZTpmdW5jdGlvbigpe3JldHVybiB0aGlzLmJvbmVzLmxlbmd0aD90aGlzLmJvbmVzWzBdOm51bGx9LGZpbmRCb25lOmZ1bmN0aW9uKGEpe2Zvcih2YXIgYj10aGlzLmJvbmVzLGM9MCxkPWIubGVuZ3RoO2Q+YztjKyspaWYoYltjXS5kYXRhLm5hbWU9PWEpcmV0dXJuIGJbY107cmV0dXJuIG51bGx9LGZpbmRCb25lSW5kZXg6ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPXRoaXMuYm9uZXMsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKylpZihiW2NdLmRhdGEubmFtZT09YSlyZXR1cm4gYztyZXR1cm4tMX0sZmluZFNsb3Q6ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPXRoaXMuc2xvdHMsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKylpZihiW2NdLmRhdGEubmFtZT09YSlyZXR1cm4gYltjXTtyZXR1cm4gbnVsbH0sZmluZFNsb3RJbmRleDpmdW5jdGlvbihhKXtmb3IodmFyIGI9dGhpcy5zbG90cyxjPTAsZD1iLmxlbmd0aDtkPmM7YysrKWlmKGJbY10uZGF0YS5uYW1lPT1hKXJldHVybiBjO3JldHVybi0xfSxzZXRTa2luQnlOYW1lOmZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMuZGF0YS5maW5kU2tpbihhKTtpZighYil0aHJvd1wiU2tpbiBub3QgZm91bmQ6IFwiK2E7dGhpcy5zZXRTa2luKGIpfSxzZXRTa2luOmZ1bmN0aW9uKGEpe3RoaXMuc2tpbiYmYSYmYS5fYXR0YWNoQWxsKHRoaXMsdGhpcy5za2luKSx0aGlzLnNraW49YX0sZ2V0QXR0YWNobWVudEJ5U2xvdE5hbWU6ZnVuY3Rpb24oYSxiKXtyZXR1cm4gdGhpcy5nZXRBdHRhY2htZW50QnlTbG90SW5kZXgodGhpcy5kYXRhLmZpbmRTbG90SW5kZXgoYSksYil9LGdldEF0dGFjaG1lbnRCeVNsb3RJbmRleDpmdW5jdGlvbihhLGIpe2lmKHRoaXMuc2tpbil7dmFyIGM9dGhpcy5za2luLmdldEF0dGFjaG1lbnQoYSxiKTtpZihjKXJldHVybiBjfXJldHVybiB0aGlzLmRhdGEuZGVmYXVsdFNraW4/dGhpcy5kYXRhLmRlZmF1bHRTa2luLmdldEF0dGFjaG1lbnQoYSxiKTpudWxsfSxzZXRBdHRhY2htZW50OmZ1bmN0aW9uKGEsYil7Zm9yKHZhciBjPXRoaXMuc2xvdHMsZD0wLGU9Yy5zaXplO2U+ZDtkKyspe3ZhciBmPWNbZF07aWYoZi5kYXRhLm5hbWU9PWEpe3ZhciBnPW51bGw7aWYoYiYmKGc9dGhpcy5nZXRBdHRhY2htZW50KGQsYiksbnVsbD09ZykpdGhyb3dcIkF0dGFjaG1lbnQgbm90IGZvdW5kOiBcIitiK1wiLCBmb3Igc2xvdDogXCIrYTtyZXR1cm4gZi5zZXRBdHRhY2htZW50KGcpLHZvaWQgMH19dGhyb3dcIlNsb3Qgbm90IGZvdW5kOiBcIithfSx1cGRhdGU6ZnVuY3Rpb24oYSl7dGhpcy50aW1lKz1hfX0sc3BpbmUuQXR0YWNobWVudFR5cGU9e3JlZ2lvbjowfSxzcGluZS5SZWdpb25BdHRhY2htZW50PWZ1bmN0aW9uKCl7dGhpcy5vZmZzZXQ9W10sdGhpcy5vZmZzZXQubGVuZ3RoPTgsdGhpcy51dnM9W10sdGhpcy51dnMubGVuZ3RoPTh9LHNwaW5lLlJlZ2lvbkF0dGFjaG1lbnQucHJvdG90eXBlPXt4OjAseTowLHJvdGF0aW9uOjAsc2NhbGVYOjEsc2NhbGVZOjEsd2lkdGg6MCxoZWlnaHQ6MCxyZW5kZXJlck9iamVjdDpudWxsLHJlZ2lvbk9mZnNldFg6MCxyZWdpb25PZmZzZXRZOjAscmVnaW9uV2lkdGg6MCxyZWdpb25IZWlnaHQ6MCxyZWdpb25PcmlnaW5hbFdpZHRoOjAscmVnaW9uT3JpZ2luYWxIZWlnaHQ6MCxzZXRVVnM6ZnVuY3Rpb24oYSxiLGMsZCxlKXt2YXIgZj10aGlzLnV2cztlPyhmWzJdPWEsZlszXT1kLGZbNF09YSxmWzVdPWIsZls2XT1jLGZbN109YixmWzBdPWMsZlsxXT1kKTooZlswXT1hLGZbMV09ZCxmWzJdPWEsZlszXT1iLGZbNF09YyxmWzVdPWIsZls2XT1jLGZbN109ZCl9LHVwZGF0ZU9mZnNldDpmdW5jdGlvbigpe3ZhciBhPXRoaXMud2lkdGgvdGhpcy5yZWdpb25PcmlnaW5hbFdpZHRoKnRoaXMuc2NhbGVYLGI9dGhpcy5oZWlnaHQvdGhpcy5yZWdpb25PcmlnaW5hbEhlaWdodCp0aGlzLnNjYWxlWSxjPS10aGlzLndpZHRoLzIqdGhpcy5zY2FsZVgrdGhpcy5yZWdpb25PZmZzZXRYKmEsZD0tdGhpcy5oZWlnaHQvMip0aGlzLnNjYWxlWSt0aGlzLnJlZ2lvbk9mZnNldFkqYixlPWMrdGhpcy5yZWdpb25XaWR0aCphLGY9ZCt0aGlzLnJlZ2lvbkhlaWdodCpiLGc9dGhpcy5yb3RhdGlvbipNYXRoLlBJLzE4MCxoPU1hdGguY29zKGcpLGk9TWF0aC5zaW4oZyksaj1jKmgrdGhpcy54LGs9YyppLGw9ZCpoK3RoaXMueSxtPWQqaSxuPWUqaCt0aGlzLngsbz1lKmkscD1mKmgrdGhpcy55LHE9ZippLHI9dGhpcy5vZmZzZXQ7clswXT1qLW0sclsxXT1sK2ssclsyXT1qLXEsclszXT1wK2sscls0XT1uLXEscls1XT1wK28scls2XT1uLW0scls3XT1sK299LGNvbXB1dGVWZXJ0aWNlczpmdW5jdGlvbihhLGIsYyxkKXthKz1jLndvcmxkWCxiKz1jLndvcmxkWTt2YXIgZT1jLm0wMCxmPWMubTAxLGc9Yy5tMTAsaD1jLm0xMSxpPXRoaXMub2Zmc2V0O2RbMF09aVswXSplK2lbMV0qZithLGRbMV09aVswXSpnK2lbMV0qaCtiLGRbMl09aVsyXSplK2lbM10qZithLGRbM109aVsyXSpnK2lbM10qaCtiLGRbNF09aVs0XSplK2lbNV0qZithLGRbNV09aVs0XSpnK2lbNV0qaCtiLGRbNl09aVs2XSplK2lbN10qZithLGRbN109aVs2XSpnK2lbN10qaCtifX0sc3BpbmUuQW5pbWF0aW9uU3RhdGVEYXRhPWZ1bmN0aW9uKGEpe3RoaXMuc2tlbGV0b25EYXRhPWEsdGhpcy5hbmltYXRpb25Ub01peFRpbWU9e319LHNwaW5lLkFuaW1hdGlvblN0YXRlRGF0YS5wcm90b3R5cGU9e2RlZmF1bHRNaXg6MCxzZXRNaXhCeU5hbWU6ZnVuY3Rpb24oYSxiLGMpe3ZhciBkPXRoaXMuc2tlbGV0b25EYXRhLmZpbmRBbmltYXRpb24oYSk7aWYoIWQpdGhyb3dcIkFuaW1hdGlvbiBub3QgZm91bmQ6IFwiK2E7dmFyIGU9dGhpcy5za2VsZXRvbkRhdGEuZmluZEFuaW1hdGlvbihiKTtpZighZSl0aHJvd1wiQW5pbWF0aW9uIG5vdCBmb3VuZDogXCIrYjt0aGlzLnNldE1peChkLGUsYyl9LHNldE1peDpmdW5jdGlvbihhLGIsYyl7dGhpcy5hbmltYXRpb25Ub01peFRpbWVbYS5uYW1lK1wiOlwiK2IubmFtZV09Y30sZ2V0TWl4OmZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcy5hbmltYXRpb25Ub01peFRpbWVbYS5uYW1lK1wiOlwiK2IubmFtZV07cmV0dXJuIGM/Yzp0aGlzLmRlZmF1bHRNaXh9fSxzcGluZS5BbmltYXRpb25TdGF0ZT1mdW5jdGlvbihhKXt0aGlzLmRhdGE9YSx0aGlzLnF1ZXVlPVtdfSxzcGluZS5BbmltYXRpb25TdGF0ZS5wcm90b3R5cGU9e2N1cnJlbnQ6bnVsbCxwcmV2aW91czpudWxsLGN1cnJlbnRUaW1lOjAscHJldmlvdXNUaW1lOjAsY3VycmVudExvb3A6ITEscHJldmlvdXNMb29wOiExLG1peFRpbWU6MCxtaXhEdXJhdGlvbjowLHVwZGF0ZTpmdW5jdGlvbihhKXtpZih0aGlzLmN1cnJlbnRUaW1lKz1hLHRoaXMucHJldmlvdXNUaW1lKz1hLHRoaXMubWl4VGltZSs9YSx0aGlzLnF1ZXVlLmxlbmd0aD4wKXt2YXIgYj10aGlzLnF1ZXVlWzBdO3RoaXMuY3VycmVudFRpbWU+PWIuZGVsYXkmJih0aGlzLl9zZXRBbmltYXRpb24oYi5hbmltYXRpb24sYi5sb29wKSx0aGlzLnF1ZXVlLnNoaWZ0KCkpfX0sYXBwbHk6ZnVuY3Rpb24oYSl7aWYodGhpcy5jdXJyZW50KWlmKHRoaXMucHJldmlvdXMpe3RoaXMucHJldmlvdXMuYXBwbHkoYSx0aGlzLnByZXZpb3VzVGltZSx0aGlzLnByZXZpb3VzTG9vcCk7dmFyIGI9dGhpcy5taXhUaW1lL3RoaXMubWl4RHVyYXRpb247Yj49MSYmKGI9MSx0aGlzLnByZXZpb3VzPW51bGwpLHRoaXMuY3VycmVudC5taXgoYSx0aGlzLmN1cnJlbnRUaW1lLHRoaXMuY3VycmVudExvb3AsYil9ZWxzZSB0aGlzLmN1cnJlbnQuYXBwbHkoYSx0aGlzLmN1cnJlbnRUaW1lLHRoaXMuY3VycmVudExvb3ApfSxjbGVhckFuaW1hdGlvbjpmdW5jdGlvbigpe3RoaXMucHJldmlvdXM9bnVsbCx0aGlzLmN1cnJlbnQ9bnVsbCx0aGlzLnF1ZXVlLmxlbmd0aD0wfSxfc2V0QW5pbWF0aW9uOmZ1bmN0aW9uKGEsYil7dGhpcy5wcmV2aW91cz1udWxsLGEmJnRoaXMuY3VycmVudCYmKHRoaXMubWl4RHVyYXRpb249dGhpcy5kYXRhLmdldE1peCh0aGlzLmN1cnJlbnQsYSksdGhpcy5taXhEdXJhdGlvbj4wJiYodGhpcy5taXhUaW1lPTAsdGhpcy5wcmV2aW91cz10aGlzLmN1cnJlbnQsdGhpcy5wcmV2aW91c1RpbWU9dGhpcy5jdXJyZW50VGltZSx0aGlzLnByZXZpb3VzTG9vcD10aGlzLmN1cnJlbnRMb29wKSksdGhpcy5jdXJyZW50PWEsdGhpcy5jdXJyZW50TG9vcD1iLHRoaXMuY3VycmVudFRpbWU9MH0sc2V0QW5pbWF0aW9uQnlOYW1lOmZ1bmN0aW9uKGEsYil7dmFyIGM9dGhpcy5kYXRhLnNrZWxldG9uRGF0YS5maW5kQW5pbWF0aW9uKGEpO2lmKCFjKXRocm93XCJBbmltYXRpb24gbm90IGZvdW5kOiBcIithO3RoaXMuc2V0QW5pbWF0aW9uKGMsYil9LHNldEFuaW1hdGlvbjpmdW5jdGlvbihhLGIpe3RoaXMucXVldWUubGVuZ3RoPTAsdGhpcy5fc2V0QW5pbWF0aW9uKGEsYil9LGFkZEFuaW1hdGlvbkJ5TmFtZTpmdW5jdGlvbihhLGIsYyl7dmFyIGQ9dGhpcy5kYXRhLnNrZWxldG9uRGF0YS5maW5kQW5pbWF0aW9uKGEpO2lmKCFkKXRocm93XCJBbmltYXRpb24gbm90IGZvdW5kOiBcIithO3RoaXMuYWRkQW5pbWF0aW9uKGQsYixjKX0sYWRkQW5pbWF0aW9uOmZ1bmN0aW9uKGEsYixjKXt2YXIgZD17fTtpZihkLmFuaW1hdGlvbj1hLGQubG9vcD1iLCFjfHwwPj1jKXt2YXIgZT10aGlzLnF1ZXVlLmxlbmd0aD90aGlzLnF1ZXVlW3RoaXMucXVldWUubGVuZ3RoLTFdLmFuaW1hdGlvbjp0aGlzLmN1cnJlbnQ7Yz1udWxsIT1lP2UuZHVyYXRpb24tdGhpcy5kYXRhLmdldE1peChlLGEpKyhjfHwwKTowfWQuZGVsYXk9Yyx0aGlzLnF1ZXVlLnB1c2goZCl9LGlzQ29tcGxldGU6ZnVuY3Rpb24oKXtyZXR1cm4hdGhpcy5jdXJyZW50fHx0aGlzLmN1cnJlbnRUaW1lPj10aGlzLmN1cnJlbnQuZHVyYXRpb259fSxzcGluZS5Ta2VsZXRvbkpzb249ZnVuY3Rpb24oYSl7dGhpcy5hdHRhY2htZW50TG9hZGVyPWF9LHNwaW5lLlNrZWxldG9uSnNvbi5wcm90b3R5cGU9e3NjYWxlOjEscmVhZFNrZWxldG9uRGF0YTpmdW5jdGlvbihhKXtmb3IodmFyIGIsYz1uZXcgc3BpbmUuU2tlbGV0b25EYXRhLGQ9YS5ib25lcyxlPTAsZj1kLmxlbmd0aDtmPmU7ZSsrKXt2YXIgZz1kW2VdLGg9bnVsbDtpZihnLnBhcmVudCYmKGg9Yy5maW5kQm9uZShnLnBhcmVudCksIWgpKXRocm93XCJQYXJlbnQgYm9uZSBub3QgZm91bmQ6IFwiK2cucGFyZW50O2I9bmV3IHNwaW5lLkJvbmVEYXRhKGcubmFtZSxoKSxiLmxlbmd0aD0oZy5sZW5ndGh8fDApKnRoaXMuc2NhbGUsYi54PShnLnh8fDApKnRoaXMuc2NhbGUsYi55PShnLnl8fDApKnRoaXMuc2NhbGUsYi5yb3RhdGlvbj1nLnJvdGF0aW9ufHwwLGIuc2NhbGVYPWcuc2NhbGVYfHwxLGIuc2NhbGVZPWcuc2NhbGVZfHwxLGMuYm9uZXMucHVzaChiKX12YXIgaT1hLnNsb3RzO2ZvcihlPTAsZj1pLmxlbmd0aDtmPmU7ZSsrKXt2YXIgaj1pW2VdO2lmKGI9Yy5maW5kQm9uZShqLmJvbmUpLCFiKXRocm93XCJTbG90IGJvbmUgbm90IGZvdW5kOiBcIitqLmJvbmU7dmFyIGs9bmV3IHNwaW5lLlNsb3REYXRhKGoubmFtZSxiKSxsPWouY29sb3I7bCYmKGsucj1zcGluZS5Ta2VsZXRvbkpzb24udG9Db2xvcihsLDApLGsuZz1zcGluZS5Ta2VsZXRvbkpzb24udG9Db2xvcihsLDEpLGsuYj1zcGluZS5Ta2VsZXRvbkpzb24udG9Db2xvcihsLDIpLGsuYT1zcGluZS5Ta2VsZXRvbkpzb24udG9Db2xvcihsLDMpKSxrLmF0dGFjaG1lbnROYW1lPWouYXR0YWNobWVudCxjLnNsb3RzLnB1c2goayl9dmFyIG09YS5za2lucztmb3IodmFyIG4gaW4gbSlpZihtLmhhc093blByb3BlcnR5KG4pKXt2YXIgbz1tW25dLHA9bmV3IHNwaW5lLlNraW4obik7Zm9yKHZhciBxIGluIG8paWYoby5oYXNPd25Qcm9wZXJ0eShxKSl7dmFyIHI9Yy5maW5kU2xvdEluZGV4KHEpLHM9b1txXTtmb3IodmFyIHQgaW4gcylpZihzLmhhc093blByb3BlcnR5KHQpKXt2YXIgdT10aGlzLnJlYWRBdHRhY2htZW50KHAsdCxzW3RdKTtudWxsIT11JiZwLmFkZEF0dGFjaG1lbnQocix0LHUpfX1jLnNraW5zLnB1c2gocCksXCJkZWZhdWx0XCI9PXAubmFtZSYmKGMuZGVmYXVsdFNraW49cCl9dmFyIHY9YS5hbmltYXRpb25zO2Zvcih2YXIgdyBpbiB2KXYuaGFzT3duUHJvcGVydHkodykmJnRoaXMucmVhZEFuaW1hdGlvbih3LHZbd10sYyk7cmV0dXJuIGN9LHJlYWRBdHRhY2htZW50OmZ1bmN0aW9uKGEsYixjKXtiPWMubmFtZXx8Yjt2YXIgZD1zcGluZS5BdHRhY2htZW50VHlwZVtjLnR5cGV8fFwicmVnaW9uXCJdO2lmKGQ9PXNwaW5lLkF0dGFjaG1lbnRUeXBlLnJlZ2lvbil7dmFyIGU9bmV3IHNwaW5lLlJlZ2lvbkF0dGFjaG1lbnQ7cmV0dXJuIGUueD0oYy54fHwwKSp0aGlzLnNjYWxlLGUueT0oYy55fHwwKSp0aGlzLnNjYWxlLGUuc2NhbGVYPWMuc2NhbGVYfHwxLGUuc2NhbGVZPWMuc2NhbGVZfHwxLGUucm90YXRpb249Yy5yb3RhdGlvbnx8MCxlLndpZHRoPShjLndpZHRofHwzMikqdGhpcy5zY2FsZSxlLmhlaWdodD0oYy5oZWlnaHR8fDMyKSp0aGlzLnNjYWxlLGUudXBkYXRlT2Zmc2V0KCksZS5yZW5kZXJlck9iamVjdD17fSxlLnJlbmRlcmVyT2JqZWN0Lm5hbWU9YixlLnJlbmRlcmVyT2JqZWN0LnNjYWxlPXt9LGUucmVuZGVyZXJPYmplY3Quc2NhbGUueD1lLnNjYWxlWCxlLnJlbmRlcmVyT2JqZWN0LnNjYWxlLnk9ZS5zY2FsZVksZS5yZW5kZXJlck9iamVjdC5yb3RhdGlvbj0tZS5yb3RhdGlvbipNYXRoLlBJLzE4MCxlfXRocm93XCJVbmtub3duIGF0dGFjaG1lbnQgdHlwZTogXCIrZH0scmVhZEFuaW1hdGlvbjpmdW5jdGlvbihhLGIsYyl7dmFyIGQsZSxmLGcsaCxpLGosaz1bXSxsPTAsbT1iLmJvbmVzO2Zvcih2YXIgbiBpbiBtKWlmKG0uaGFzT3duUHJvcGVydHkobikpe3ZhciBvPWMuZmluZEJvbmVJbmRleChuKTtpZigtMT09byl0aHJvd1wiQm9uZSBub3QgZm91bmQ6IFwiK247dmFyIHA9bVtuXTtmb3IoZiBpbiBwKWlmKHAuaGFzT3duUHJvcGVydHkoZikpaWYoaD1wW2ZdLFwicm90YXRlXCI9PWYpe2ZvcihlPW5ldyBzcGluZS5Sb3RhdGVUaW1lbGluZShoLmxlbmd0aCksZS5ib25lSW5kZXg9byxkPTAsaT0wLGo9aC5sZW5ndGg7aj5pO2krKylnPWhbaV0sZS5zZXRGcmFtZShkLGcudGltZSxnLmFuZ2xlKSxzcGluZS5Ta2VsZXRvbkpzb24ucmVhZEN1cnZlKGUsZCxnKSxkKys7ay5wdXNoKGUpLGw9TWF0aC5tYXgobCxlLmZyYW1lc1syKmUuZ2V0RnJhbWVDb3VudCgpLTJdKX1lbHNle2lmKFwidHJhbnNsYXRlXCIhPWYmJlwic2NhbGVcIiE9Zil0aHJvd1wiSW52YWxpZCB0aW1lbGluZSB0eXBlIGZvciBhIGJvbmU6IFwiK2YrXCIgKFwiK24rXCIpXCI7dmFyIHE9MTtmb3IoXCJzY2FsZVwiPT1mP2U9bmV3IHNwaW5lLlNjYWxlVGltZWxpbmUoaC5sZW5ndGgpOihlPW5ldyBzcGluZS5UcmFuc2xhdGVUaW1lbGluZShoLmxlbmd0aCkscT10aGlzLnNjYWxlKSxlLmJvbmVJbmRleD1vLGQ9MCxpPTAsaj1oLmxlbmd0aDtqPmk7aSsrKXtnPWhbaV07dmFyIHI9KGcueHx8MCkqcSxzPShnLnl8fDApKnE7ZS5zZXRGcmFtZShkLGcudGltZSxyLHMpLHNwaW5lLlNrZWxldG9uSnNvbi5yZWFkQ3VydmUoZSxkLGcpLGQrK31rLnB1c2goZSksbD1NYXRoLm1heChsLGUuZnJhbWVzWzMqZS5nZXRGcmFtZUNvdW50KCktM10pfX12YXIgdD1iLnNsb3RzO2Zvcih2YXIgdSBpbiB0KWlmKHQuaGFzT3duUHJvcGVydHkodSkpe3ZhciB2PXRbdV0sdz1jLmZpbmRTbG90SW5kZXgodSk7Zm9yKGYgaW4gdilpZih2Lmhhc093blByb3BlcnR5KGYpKWlmKGg9dltmXSxcImNvbG9yXCI9PWYpe2ZvcihlPW5ldyBzcGluZS5Db2xvclRpbWVsaW5lKGgubGVuZ3RoKSxlLnNsb3RJbmRleD13LGQ9MCxpPTAsaj1oLmxlbmd0aDtqPmk7aSsrKXtnPWhbaV07dmFyIHg9Zy5jb2xvcix5PXNwaW5lLlNrZWxldG9uSnNvbi50b0NvbG9yKHgsMCksej1zcGluZS5Ta2VsZXRvbkpzb24udG9Db2xvcih4LDEpLEE9c3BpbmUuU2tlbGV0b25Kc29uLnRvQ29sb3IoeCwyKSxCPXNwaW5lLlNrZWxldG9uSnNvbi50b0NvbG9yKHgsMyk7ZS5zZXRGcmFtZShkLGcudGltZSx5LHosQSxCKSxzcGluZS5Ta2VsZXRvbkpzb24ucmVhZEN1cnZlKGUsZCxnKSxkKyt9ay5wdXNoKGUpLGw9TWF0aC5tYXgobCxlLmZyYW1lc1s1KmUuZ2V0RnJhbWVDb3VudCgpLTVdKX1lbHNle2lmKFwiYXR0YWNobWVudFwiIT1mKXRocm93XCJJbnZhbGlkIHRpbWVsaW5lIHR5cGUgZm9yIGEgc2xvdDogXCIrZitcIiAoXCIrdStcIilcIjtmb3IoZT1uZXcgc3BpbmUuQXR0YWNobWVudFRpbWVsaW5lKGgubGVuZ3RoKSxlLnNsb3RJbmRleD13LGQ9MCxpPTAsaj1oLmxlbmd0aDtqPmk7aSsrKWc9aFtpXSxlLnNldEZyYW1lKGQrKyxnLnRpbWUsZy5uYW1lKTtrLnB1c2goZSksbD1NYXRoLm1heChsLGUuZnJhbWVzW2UuZ2V0RnJhbWVDb3VudCgpLTFdKX19Yy5hbmltYXRpb25zLnB1c2gobmV3IHNwaW5lLkFuaW1hdGlvbihhLGssbCkpfX0sc3BpbmUuU2tlbGV0b25Kc29uLnJlYWRDdXJ2ZT1mdW5jdGlvbihhLGIsYyl7dmFyIGQ9Yy5jdXJ2ZTtkJiYoXCJzdGVwcGVkXCI9PWQ/YS5jdXJ2ZXMuc2V0U3RlcHBlZChiKTpkIGluc3RhbmNlb2YgQXJyYXkmJmEuY3VydmVzLnNldEN1cnZlKGIsZFswXSxkWzFdLGRbMl0sZFszXSkpfSxzcGluZS5Ta2VsZXRvbkpzb24udG9Db2xvcj1mdW5jdGlvbihhLGIpe2lmKDghPWEubGVuZ3RoKXRocm93XCJDb2xvciBoZXhpZGVjaW1hbCBsZW5ndGggbXVzdCBiZSA4LCByZWNpZXZlZDogXCIrYTtyZXR1cm4gcGFyc2VJbnQoYS5zdWJzdHJpbmcoMipiLDIpLDE2KS8yNTV9LHNwaW5lLkF0bGFzPWZ1bmN0aW9uKGEsYil7dGhpcy50ZXh0dXJlTG9hZGVyPWIsdGhpcy5wYWdlcz1bXSx0aGlzLnJlZ2lvbnM9W107dmFyIGM9bmV3IHNwaW5lLkF0bGFzUmVhZGVyKGEpLGQ9W107ZC5sZW5ndGg9NDtmb3IodmFyIGU9bnVsbDs7KXt2YXIgZj1jLnJlYWRMaW5lKCk7aWYobnVsbD09ZilicmVhaztpZihmPWMudHJpbShmKSxmLmxlbmd0aClpZihlKXt2YXIgZz1uZXcgc3BpbmUuQXRsYXNSZWdpb247Zy5uYW1lPWYsZy5wYWdlPWUsZy5yb3RhdGU9XCJ0cnVlXCI9PWMucmVhZFZhbHVlKCksYy5yZWFkVHVwbGUoZCk7dmFyIGg9cGFyc2VJbnQoZFswXSwxMCksaT1wYXJzZUludChkWzFdLDEwKTtjLnJlYWRUdXBsZShkKTt2YXIgaj1wYXJzZUludChkWzBdLDEwKSxrPXBhcnNlSW50KGRbMV0sMTApO2cudT1oL2Uud2lkdGgsZy52PWkvZS5oZWlnaHQsZy5yb3RhdGU/KGcudTI9KGgraykvZS53aWR0aCxnLnYyPShpK2opL2UuaGVpZ2h0KTooZy51Mj0oaCtqKS9lLndpZHRoLGcudjI9KGkraykvZS5oZWlnaHQpLGcueD1oLGcueT1pLGcud2lkdGg9TWF0aC5hYnMoaiksZy5oZWlnaHQ9TWF0aC5hYnMoayksND09Yy5yZWFkVHVwbGUoZCkmJihnLnNwbGl0cz1bcGFyc2VJbnQoZFswXSwxMCkscGFyc2VJbnQoZFsxXSwxMCkscGFyc2VJbnQoZFsyXSwxMCkscGFyc2VJbnQoZFszXSwxMCldLDQ9PWMucmVhZFR1cGxlKGQpJiYoZy5wYWRzPVtwYXJzZUludChkWzBdLDEwKSxwYXJzZUludChkWzFdLDEwKSxwYXJzZUludChkWzJdLDEwKSxwYXJzZUludChkWzNdLDEwKV0sYy5yZWFkVHVwbGUoZCkpKSxnLm9yaWdpbmFsV2lkdGg9cGFyc2VJbnQoZFswXSwxMCksZy5vcmlnaW5hbEhlaWdodD1wYXJzZUludChkWzFdLDEwKSxjLnJlYWRUdXBsZShkKSxnLm9mZnNldFg9cGFyc2VJbnQoZFswXSwxMCksZy5vZmZzZXRZPXBhcnNlSW50KGRbMV0sMTApLGcuaW5kZXg9cGFyc2VJbnQoYy5yZWFkVmFsdWUoKSwxMCksdGhpcy5yZWdpb25zLnB1c2goZyl9ZWxzZXtlPW5ldyBzcGluZS5BdGxhc1BhZ2UsZS5uYW1lPWYsZS5mb3JtYXQ9c3BpbmUuQXRsYXMuRm9ybWF0W2MucmVhZFZhbHVlKCldLGMucmVhZFR1cGxlKGQpLGUubWluRmlsdGVyPXNwaW5lLkF0bGFzLlRleHR1cmVGaWx0ZXJbZFswXV0sZS5tYWdGaWx0ZXI9c3BpbmUuQXRsYXMuVGV4dHVyZUZpbHRlcltkWzFdXTt2YXIgbD1jLnJlYWRWYWx1ZSgpO2UudVdyYXA9c3BpbmUuQXRsYXMuVGV4dHVyZVdyYXAuY2xhbXBUb0VkZ2UsZS52V3JhcD1zcGluZS5BdGxhcy5UZXh0dXJlV3JhcC5jbGFtcFRvRWRnZSxcInhcIj09bD9lLnVXcmFwPXNwaW5lLkF0bGFzLlRleHR1cmVXcmFwLnJlcGVhdDpcInlcIj09bD9lLnZXcmFwPXNwaW5lLkF0bGFzLlRleHR1cmVXcmFwLnJlcGVhdDpcInh5XCI9PWwmJihlLnVXcmFwPWUudldyYXA9c3BpbmUuQXRsYXMuVGV4dHVyZVdyYXAucmVwZWF0KSxiLmxvYWQoZSxmKSx0aGlzLnBhZ2VzLnB1c2goZSl9ZWxzZSBlPW51bGx9fSxzcGluZS5BdGxhcy5wcm90b3R5cGU9e2ZpbmRSZWdpb246ZnVuY3Rpb24oYSl7Zm9yKHZhciBiPXRoaXMucmVnaW9ucyxjPTAsZD1iLmxlbmd0aDtkPmM7YysrKWlmKGJbY10ubmFtZT09YSlyZXR1cm4gYltjXTtyZXR1cm4gbnVsbH0sZGlzcG9zZTpmdW5jdGlvbigpe2Zvcih2YXIgYT10aGlzLnBhZ2VzLGI9MCxjPWEubGVuZ3RoO2M+YjtiKyspdGhpcy50ZXh0dXJlTG9hZGVyLnVubG9hZChhW2JdLnJlbmRlcmVyT2JqZWN0KX0sdXBkYXRlVVZzOmZ1bmN0aW9uKGEpe2Zvcih2YXIgYj10aGlzLnJlZ2lvbnMsYz0wLGQ9Yi5sZW5ndGg7ZD5jO2MrKyl7dmFyIGU9YltjXTtlLnBhZ2U9PWEmJihlLnU9ZS54L2Eud2lkdGgsZS52PWUueS9hLmhlaWdodCxlLnJvdGF0ZT8oZS51Mj0oZS54K2UuaGVpZ2h0KS9hLndpZHRoLGUudjI9KGUueStlLndpZHRoKS9hLmhlaWdodCk6KGUudTI9KGUueCtlLndpZHRoKS9hLndpZHRoLGUudjI9KGUueStlLmhlaWdodCkvYS5oZWlnaHQpKX19fSxzcGluZS5BdGxhcy5Gb3JtYXQ9e2FscGhhOjAsaW50ZW5zaXR5OjEsbHVtaW5hbmNlQWxwaGE6MixyZ2I1NjU6MyxyZ2JhNDQ0NDo0LHJnYjg4ODo1LHJnYmE4ODg4OjZ9LHNwaW5lLkF0bGFzLlRleHR1cmVGaWx0ZXI9e25lYXJlc3Q6MCxsaW5lYXI6MSxtaXBNYXA6MixtaXBNYXBOZWFyZXN0TmVhcmVzdDozLG1pcE1hcExpbmVhck5lYXJlc3Q6NCxtaXBNYXBOZWFyZXN0TGluZWFyOjUsbWlwTWFwTGluZWFyTGluZWFyOjZ9LHNwaW5lLkF0bGFzLlRleHR1cmVXcmFwPXttaXJyb3JlZFJlcGVhdDowLGNsYW1wVG9FZGdlOjEscmVwZWF0OjJ9LHNwaW5lLkF0bGFzUGFnZT1mdW5jdGlvbigpe30sc3BpbmUuQXRsYXNQYWdlLnByb3RvdHlwZT17bmFtZTpudWxsLGZvcm1hdDpudWxsLG1pbkZpbHRlcjpudWxsLG1hZ0ZpbHRlcjpudWxsLHVXcmFwOm51bGwsdldyYXA6bnVsbCxyZW5kZXJlck9iamVjdDpudWxsLHdpZHRoOjAsaGVpZ2h0OjB9LHNwaW5lLkF0bGFzUmVnaW9uPWZ1bmN0aW9uKCl7fSxzcGluZS5BdGxhc1JlZ2lvbi5wcm90b3R5cGU9e3BhZ2U6bnVsbCxuYW1lOm51bGwseDowLHk6MCx3aWR0aDowLGhlaWdodDowLHU6MCx2OjAsdTI6MCx2MjowLG9mZnNldFg6MCxvZmZzZXRZOjAsb3JpZ2luYWxXaWR0aDowLG9yaWdpbmFsSGVpZ2h0OjAsaW5kZXg6MCxyb3RhdGU6ITEsc3BsaXRzOm51bGwscGFkczpudWxsfSxzcGluZS5BdGxhc1JlYWRlcj1mdW5jdGlvbihhKXt0aGlzLmxpbmVzPWEuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLyl9LHNwaW5lLkF0bGFzUmVhZGVyLnByb3RvdHlwZT17aW5kZXg6MCx0cmltOmZ1bmN0aW9uKGEpe3JldHVybiBhLnJlcGxhY2UoL15cXHMrfFxccyskL2csXCJcIil9LHJlYWRMaW5lOmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuaW5kZXg+PXRoaXMubGluZXMubGVuZ3RoP251bGw6dGhpcy5saW5lc1t0aGlzLmluZGV4KytdfSxyZWFkVmFsdWU6ZnVuY3Rpb24oKXt2YXIgYT10aGlzLnJlYWRMaW5lKCksYj1hLmluZGV4T2YoXCI6XCIpO2lmKC0xPT1iKXRocm93XCJJbnZhbGlkIGxpbmU6IFwiK2E7cmV0dXJuIHRoaXMudHJpbShhLnN1YnN0cmluZyhiKzEpKX0scmVhZFR1cGxlOmZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMucmVhZExpbmUoKSxjPWIuaW5kZXhPZihcIjpcIik7aWYoLTE9PWMpdGhyb3dcIkludmFsaWQgbGluZTogXCIrYjtmb3IodmFyIGQ9MCxlPWMrMTszPmQ7ZCsrKXt2YXIgZj1iLmluZGV4T2YoXCIsXCIsZSk7aWYoLTE9PWYpe2lmKCFkKXRocm93XCJJbnZhbGlkIGxpbmU6IFwiK2I7YnJlYWt9YVtkXT10aGlzLnRyaW0oYi5zdWJzdHIoZSxmLWUpKSxlPWYrMX1yZXR1cm4gYVtkXT10aGlzLnRyaW0oYi5zdWJzdHJpbmcoZSkpLGQrMX19LHNwaW5lLkF0bGFzQXR0YWNobWVudExvYWRlcj1mdW5jdGlvbihhKXt0aGlzLmF0bGFzPWF9LHNwaW5lLkF0bGFzQXR0YWNobWVudExvYWRlci5wcm90b3R5cGU9e25ld0F0dGFjaG1lbnQ6ZnVuY3Rpb24oYSxiLGMpe3N3aXRjaChiKXtjYXNlIHNwaW5lLkF0dGFjaG1lbnRUeXBlLnJlZ2lvbjp2YXIgZD10aGlzLmF0bGFzLmZpbmRSZWdpb24oYyk7aWYoIWQpdGhyb3dcIlJlZ2lvbiBub3QgZm91bmQgaW4gYXRsYXM6IFwiK2MrXCIgKFwiK2IrXCIpXCI7dmFyIGU9bmV3IHNwaW5lLlJlZ2lvbkF0dGFjaG1lbnQoYyk7cmV0dXJuIGUucmVuZGVyZXJPYmplY3Q9ZCxlLnNldFVWcyhkLnUsZC52LGQudTIsZC52MixkLnJvdGF0ZSksZS5yZWdpb25PZmZzZXRYPWQub2Zmc2V0WCxlLnJlZ2lvbk9mZnNldFk9ZC5vZmZzZXRZLGUucmVnaW9uV2lkdGg9ZC53aWR0aCxlLnJlZ2lvbkhlaWdodD1kLmhlaWdodCxlLnJlZ2lvbk9yaWdpbmFsV2lkdGg9ZC5vcmlnaW5hbFdpZHRoLGUucmVnaW9uT3JpZ2luYWxIZWlnaHQ9ZC5vcmlnaW5hbEhlaWdodCxlfXRocm93XCJVbmtub3duIGF0dGFjaG1lbnQgdHlwZTogXCIrYn19LHNwaW5lLkJvbmUueURvd249ITA7Il19
