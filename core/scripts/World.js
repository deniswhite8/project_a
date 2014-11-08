require('../../common/util.js');

var Physics = require('./Physics.js'),
	NetworkEvent = require('./NetworkEvent.js'),
	User = require('./User.js'),
	Table = require('./Table.js'),
	Chunk = require('./Chunk.js'),
	localConfig = require('../config.json'),
	globalConfig = require('../../common/config.json'),
	Logger = require('../../common/Logger.js'),
	PageApp = require('./Page.js'),
	Connect = require('./Connect.js'),
	fs = require("fs"),
	self = null,
	config = null,
	logger = null;

var World = function() {
	config = global.config = globalConfig.extend(localConfig);
	
	logger = new Logger();
	global.logger = logger;

	this._chunks = [];
	this._avatars = {};
	logger.info('Creating world');
	
	logger.info('Init physics module');
	this._physics = new Physics();
	
	logger.info('Init page app');
	this._pageApp = new PageApp();
	
	logger.info('Init connect');
	this._connect = new Connect(this._pageApp.getApp());
	
	logger.info('Init newtwork module');
	this._networkEvent = new NetworkEvent(this._connect.getHttpServer());
	
	logger.info('World was created');
	self = this;
};

World.prototype.start = function() {
	logger.info('Starting world');
	logger.info('Starting physics');
	this._physics.init();
	
	logger.info('Load world map');
	this.loadMap();

	this._networkEvent.on(config.messages.userLogin, this.onUserLogin);
	this._networkEvent.on(config.messages.userInput, this.onUserInput);
	this._networkEvent.on('disconnect', this.onUserDisconnect);

	logger.info('Starting network listening (on ' + this._connect.getPort() + ' port)');
	this._connect.listen();

	logger.info('Starting network event listening');
	this._networkEvent.listen();

	logger.info('Start update world main loop');
	setInterval(this._update, config.physics.iterations);
};

World.prototype.onUserLogin = function(data, socket) {
	var user = new User();

	if (user.login(data.login, data.passwd)) {
		logger.info('User connect: ' + user.getLogin());

		user.setSocket(socket);
		var avatarId = user.getAvatarId();
		if (self.getAvatar(avatarId)) return;
		var avatar = self.loadAvatar(avatarId);
		avatar.user = user;
		self.addAvatar(avatar);
		user.send(config.messages.setControlAvatar, avatarId);
	}
};

World.prototype.onUserInput = function(data, socket) {
	var user = new User();
	user = user.getBySocket(socket);
	
	var avatarId = user.getAvatarId(),
		avatar = self.getAvatar(avatarId);
		
	if (!avatar) return;
	
	data = user.restoreInput(data);
	avatar._input(data);
};

World.prototype.onUserDisconnect = function(data, socket) {
	var user = new User();
	user = user.getBySocket(socket);
	
	if (!user || !user.id) return;
	
	logger.info('User disconnect: ' + user.getLogin());
	
	var userAvatar = self.getAvatar(user.getAvatarId());
	self.removeAvatar(userAvatar);
};

World.prototype.loadMap = function() {
	var self = this;

	fs.readdirSync(__dirname + '/../' + config.map.path).forEach(function(fileName) {
		var chunkData = require('./../' + config.map.path + "/" + fileName),
			chunk = new Chunk(chunkData.x, chunkData.y, chunkData.tiles, self._chunks);
			
		self._chunks[chunk.id] = chunk;
	});
};

World.prototype.addAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	var chunk = this._chunks[avatar.calcChunkIdByPosition()];
	if (chunk)
		chunk.addAvatar(avatar);

	this._avatars[avatar.id] = avatar;
};

World.prototype.removeAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	var chunk = this._chunks[avatar.calcChunkIdByPosition()];
	if (chunk)
		chunk.removeAvatar(avatar);

	delete this._avatars[avatar.id];
};

World.prototype.getAvatar = function(id) {
	if (!id) return;

	return this._avatars[id];
};

World.prototype.loadAvatar = function(id) {
	if (!id || this.getAvatar(id)) return;
	
	var table = Table.use(config.table.avatar),
		rows  = table.fetch({'id': id});

	if (rows.length !== 1) return;

	var row = rows[0];

	var avatarClass = require('../' + config.avatar.path + '/' + row.type + '/' + row.type + '.js'),
		avatar = new avatarClass();

	avatar._init(row, this._physics);

	return avatar;
};

World.prototype._update = function() {
	self._chunks.forEach(function (chunk) {
		chunk._update();
	});
};

module.exports = World;