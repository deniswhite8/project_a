var avatarTypes = config.avatar.types,
	avatarPath = config.avatar.path,
	defineArguments = [];
	
avatarTypes.forEach(function(typeName, i) {
    defineArguments[i * 2] = '../' + avatarPath + '/' + typeName + '/' + typeName;
    defineArguments[i * 2 + 1] = '../' + avatarPath + '/' + typeName + '/config.json';
});

define(defineArguments, function () {
	
	var AvatarLoader = function() {
	
	};

	AvatarLoader._avatarClasses = {};
	AvatarLoader._avatarConfigs = {};
	
	AvatarLoader.getClass = function(type) {
		return AvatarLoader._avatarClasses[type];
	};
	
	AvatarLoader.getConfig = function(type) {
		return AvatarLoader._avatarConfigs[type];
	};

	avatarTypes.forEach(function (typeName, i) {
		AvatarLoader._avatarClasses[typeName] = arguments[i * 2];
		AvatarLoader._avatarConfigs[typeName] = arguments[i * 2 + 1];
	});

	return AvatarLoader;
});