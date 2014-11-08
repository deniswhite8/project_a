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
	logger = null,
    config = null,
    self = null;

var World = function() {
    config = window.config = globalConfig.extend(localConfig);
    logger = window.loger = new Logger();
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
    
    this._network.on(config.messages.newChunk, this.onNewChunk);
    this._network.on(config.messages.removeChunk, this.onRemoveChunk);
    this._network.on(config.messages.newAvatar, this.onNewAvatar);
    this._network.on(config.messages.removeAvatar, this.onRemoveAvatar);
    this._network.on(config.messages.setControlAvatar, this.onSetControlAvatar);
    
    this._network.send(config.messages.userLogin, {
        login: 'denis',
        passwd: 'qwe'
    });
    
    logger.info('Start update world main loop');
    this._step();
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
        self._graphics.addAvatar(avatar);
    });
};

World.prototype.onRemoveChunk = function(data, socket) {
    logger.info('Remove chunk event, data = ');
    logger.log(data);
    
    if (!data || !data.id || !this._chunks[data.id]) return;
    
    self._graphics.removeAvatar(self._chunks[data.id]);
    delete self._chunks[data.id];
    
    if (!data.avatars) return;
    data.avatars.forEach(function (avatarData) {
        self.removeAvatar(avatarData.id);
        self._graphics.removeAvatar(avatarData.id);
    });
};

World.prototype.onNewAvatar = function(data, socket) {
    logger.info('New avatar event, data = ');
    logger.log(data);
    
    var avatar = self.createAvatar(data);
    self._graphics.addAvatar(avatar);
};

World.prototype.onRemoveAvatar = function(data, socket) {
    logger.info('Remove avatar event, data = ');
    logger.log(data);
    
    self.removeAvatar(data.id);
    self._graphics.removeAvatar(data.id);
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

World.prototype.removeAvatar = function(id) {
    if (!id) return;
    
    delete this._avatars[id];  
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
    var self = this;
    
    window.requestAnimationFrame(function() {
        self._stats.begin();
        
        self._updateFunction();
        
        self._step();
        self._stats.end();
    });
};


World.prototype._updateFunction = function() {
    this._frameCounter++;
    
    if(this._frameCounter % this._frameFrequencyInputSend) {
		var inputData = this._input.getInputData();
		if (inputData) this._network.send(config.messages.userInput, inputData);
	}

	if (this._controlAvatar) {
		this._graphics.viewPortFocus(this._controlAvatar.rootNode.x, this._controlAvatar.rootNode.y);
	}

	this._input.setOffset(this._graphics.getViewPortX(), this._graphics.getViewPortY());
	
	this._graphics.render();
};
    
module.exports = World;