require('../../common/util.js');

var Physics = require('./Physics.js'),
	Area = require('./Area.js'),
	Network = require('./Network.js'),
	User = require('./User.js'),
	Table = require('./Table.js'),
	localConfig = require('../config.json'),
	globalConfig = require('../../common/config.json'),
	Logger = require('../../common/Logger.js'),
	PageApp = require('./Page.js'),
	Connect = require('./Connect.js'),
	self = null,
	config = null,
	logger = null;

var World = function() {
	config = global.config = globalConfig.extend(localConfig);
	
	logger = new Logger();
	global.logger = logger;

	this._area = new Area();
	this._avatars = {};
	logger.info('Creating world');
	
	logger.info('Init physics module');
	this._physics = new Physics();
	
	logger.info('Init page app');
	this._pageApp = new PageApp();
	
	logger.info('Init connect');
	this._connect = new Connect(this._pageApp.getApp());
	
	logger.info('Init newtwork module');
	this._network = new Network(this._connect.getHttpServer());
	
	logger.info('World was created');
	self = this;
};

World.prototype.start = function() {
	logger.info('Starting world');
	logger.info('Starting physics');
	this._physics.init();
	
	logger.info('Load world map');
	this._area.loadMap();

	this._network.on(config.network.messages.userLogin, this.onUserLogin);
	this._network.on(config.network.messages.userInput, this.onUserInput);
	this._network.on('disconnect', this.onUserDisconnect);

	logger.info('Starting network listening (on ' + this._connect.getPort() + ' port)');
	this._connect.listen();

	logger.info('Starting network event listening');
	this._network.listen();

	logger.info('Start update world main loop');
	setInterval(this._update, 1000 / config.update.iterationsPerSecond);
};

World.prototype.onUserLogin = function(data, socket) {
	var user = new User(self._network);

	if (user.login(data.login, data.passwd)) {
		logger.info('User connect: ' + user.getLogin());

		user.setSocket(socket);
		var avatarId = user.getAvatarId();
		if (self.getAvatar(avatarId)) return;
		var avatar = self.loadAvatar(avatarId);
		avatar.user = user;
		self.addAvatar(avatar);
		user.send(config.network.messages.setControlAvatar, avatarId);
	}
};

World.prototype.onUserInput = function(data, socket) {
	var user = new User();
	user = user.getBySocket(socket);
	
	var avatarId = user.getAvatarId(),
		avatar = self.getAvatar(avatarId);
		
	if (!avatar) return;
	
	data = user.restoreInput(data);
	avatar._setInput(data);
};

World.prototype.onUserDisconnect = function(data, socket) {
	var user = new User();
	user = user.getBySocket(socket);
	
	if (!user || !user.id) return;
	
	logger.info('User disconnect: ' + user.getLogin());
	
	user.logout();
	
	var userAvatar = self.getAvatar(user.getAvatarId());
	self.removeAvatar(userAvatar);
};

World.prototype.addAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	this._area.addAvatar(avatar);
	this._avatars[avatar.id] = avatar;
};

World.prototype.removeAvatar = function(avatar) {
	if (!avatar || !avatar.id) return;

	avatar.save();
	this._area.removeAvatar(avatar);
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

	var avatarClass = require('../../../' + config.avatar.path + '/' + row.type + '/server/' + row.type + '.js'),
		avatar = new avatarClass();

	avatar._init(row, this._physics);

	return avatar;
};

World.prototype._update = function() {
	self._area.update.call(self._area);
};

module.exports = World;