var classes = {},
	configs = {};

// classes['Car'] = require('../avatars/Car/Car.js');
// configs['Car'] = require('../avatars/Car/config.json');

// classes['Man'] = require('../avatars/Man/Man.js');
// configs['Man'] = require('../avatars/Man/config.json');

classes['Panzer'] = require('../../../avatars/Panzer/client/Panzer.js');
configs['Panzer'] = require('../../../avatars/Panzer/client/config.json');

// classes['Passage'] = require('../avatars/Passage/Passage.js');
// configs['Passage'] = require('../avatars/Passage/config.json');

var AvatarLoader = function() {
	
};

AvatarLoader.prototype.getClass = function(type) {
	return classes[type];
};

AvatarLoader.prototype.getConfig = function(type) {
	return configs[type];
};

module.exports = AvatarLoader;