var AvatarLoader = function() {

};

AvatarLoader.prototype.getClass = function(type) {
	return require('../' + config.avatar.path + '/' + type + '/' + typeName);
};

AvatarLoader.prototype.getConfig = function(type) {
	return require('../' + config.avatar.path + '/' + type + '/config.json');
};

module.exports = AvatarLoader;