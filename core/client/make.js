var fs = require('fs'),
    exec = require('child_process').exec,
    browserify = require('browserify');

var avatarFolderify = function() {
    var fileName = 'scripts/AvatarLoader.js',
        specialRequire = '// @requireAvatarFolder',
        startLabel = '// @start',
        endLabel = '// @end',
        configFileName = 'config.json',
        classesVarName = 'classes',
        configsVarName = 'configs';
        
    var config = JSON.parse(fs.readFileSync(__dirname + '/' + configFileName, 'utf8')),
        fileContent = fs.readFileSync(__dirname + '/' + fileName, 'utf8'),
        avatarList = fs.readdirSync(__dirname + '/../../' + config.avatar.path),
        replaceSrc = [specialRequire, startLabel];
    
    var preparePath = function(path, name, avatarPath) {
        return path.replace(new RegExp('\\$name', 'g'), name)
                   .replace(new RegExp('\\$path', 'g'), avatarPath);
    };
     
    avatarList.forEach(function(name) {
        replaceSrc.push(preparePath(classesVarName + "['$name'] = require('../../../$path/$name/client/$name.js');",
            name, config.avatar.path));
        replaceSrc.push(preparePath(configsVarName + "['$name'] = require('../../../$path/$name/client/config.json');",
            name, config.avatar.path));
    });
    replaceSrc.push(endLabel);
    
    replaceSrc = replaceSrc.join('\n');
    fileContent = fileContent
        .replace(new RegExp(startLabel + '[\\s\\S]*' + endLabel, 'gm'), '')
        .replace(specialRequire, replaceSrc);
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

avatarFolderify();
build();