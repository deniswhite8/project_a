var fs = require('fs'),
    browserify = require('browserify');

require('../common/util.js');

var startLabel = '// @start',
    endLabel = '// @end',
    _configFileName = 'config.json',
    _localConfig = JSON.parse(fs.readFileSync(__dirname + '/' + _configFileName, 'utf8')),
    _globalConfig = JSON.parse(fs.readFileSync(__dirname + '/../common/' + _configFileName, 'utf8')),
    config = _globalConfig.extend(_localConfig);

var avatarList = function() {
    var fileName = 'scripts/AvatarLoader.js',
        specialRequire = '// @requireAvatarList',
        classesVarName = 'classes',
        configsVarName = 'configs';
        
    var fileContent = fs.readFileSync(__dirname + '/' + fileName, 'utf8'),
        avatarList = config.avatar.list,
        replaceSrc = [specialRequire, startLabel];
    
    var preparePath = function(path, type, avatarPath) {
        return path.replace(new RegExp('\\$type', 'g'), type)
                   .replace(new RegExp('\\$path', 'g'), avatarPath)
                   .replace(/\/+/g, '/');
    };
     
    avatarList.each(function(id, type) {
        replaceSrc.push(preparePath(classesVarName + "['$type'] = require('../../../$path/$type/client/$type.js');",
            type, config.avatar.path));
        replaceSrc.push(preparePath(configsVarName + "['$type'] = require('../../../$path/$type/client/config.json');",
            type, config.avatar.path));
    });
    replaceSrc.push(endLabel);
    
    replaceSrc = replaceSrc.join('\n');
    fileContent = fileContent
        .replace(new RegExp(startLabel + '[\\s\\S]*' + endLabel + '\n', 'gm'), '')
        .replace(specialRequire, replaceSrc);
    fs.writeFileSync(__dirname + '/' + fileName, fileContent, 'utf8');
};



var tilesetConfigs = function() {
    var fileName = 'scripts/SpriteLoader.js',
        specialRequire = '// @requireTilesetConfigs',
        configsVarName = 'tilesetConfigs',
        fileContent = fs.readFileSync(__dirname + '/' + fileName, 'utf8');
    

	var preloadPathList = [config.map.path + '/' + config.map.tileset.path],
	    preloadRequireString = [specialRequire, startLabel];
	config.avatar.list.each(function(id, type) {
		preloadPathList.push(
			config.avatar.path + '/' + type + '/' + config.avatar.sprite.path + '/' + config.avatar.sprite.tileset
		);
	});
	
	preloadPathList.forEach(function(path) {
	    var line = configsVarName + "['" + path + "'] = require('../../../" + path + ".json');";
	    preloadRequireString.push(line.replace(/\/+/g, '/'));
	});
	preloadRequireString.push(endLabel);
	preloadRequireString = preloadRequireString.join('\n');
	
	fileContent = fileContent
        .replace(new RegExp(startLabel + '[\\s\\S]*' + endLabel + '\n', 'gm'), '')
        .replace(specialRequire, preloadRequireString);
    fs.writeFileSync(__dirname + '/' + fileName, fileContent, 'utf8');
};

var build = function() {
    var mainFile = 'main.js',
        outputFile = 'min.js',
        useSourceMap = true;
        
    var b = browserify({
        debug: useSourceMap
    });
    b.add(__dirname + '/' + mainFile);
    b.bundle().pipe(fs.createWriteStream(__dirname + '/' + outputFile));
};

avatarList();
tilesetConfigs();
build();