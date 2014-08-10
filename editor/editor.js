var http = require('http'),
	fs   = require('fs'),
	url = require('url');



function loadConf() {
	return JSON.parse(fs.readFileSync('./conf.json', 'utf8'));
}

function getInit(conf) {

	var tiles = fs.readdirSync(conf.clientPath + 'img/tiles/');
	for(var i = 0; i < tiles.length; i++) {
		tiles[i] = tiles[i].split('.')[0];
	}

	var avatars = Object.keys(conf.avatars),
		avatarConf = conf.avatars;
		avatarFuncs = {};
	for(var i = 0; i < avatars.length; i++) {
		avatars[i] = avatars[i].split('.')[0];
		avatarFuncs[avatars[i]] = fs.readFileSync(conf.clientPath + 'scripts/avatars/' + avatars[i] + '.js', 'utf8');
	}

	var data = {
		tiles: tiles,
		avatars: avatars,
		clientPath: conf.clientPath,
		avatarFuncs: avatarFuncs,
		avatarConf: avatarConf
	};

	return JSON.stringify(data);
}

function open(name, conf) {
	var files = fs.readdirSync(conf.serverPath + name + '/');

	var data = {chunks: []};

	for(var i = 0; i < files.length; i++) {
		var txt = fs.readFileSync(conf.serverPath + name + '/' + files[i], 'utf8'),
			json = JSON.parse(txt);
		if(files[i] == 'avatars.json') data.avatars = json;
		else if(files[i] == 'conf.json') data.conf = json;
		else data.chunks.push(json);
	}

	return JSON.stringify(data);
}

http.createServer(function(request, response) {

	var _url = url.parse(request.url, true),
		resp,
		conf = loadConf();

	if(_url.pathname == '/init') resp = getInit(conf);
	else if(_url.pathname == '/open') resp = open(_url.query.name, conf);

	response.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin':'*'});
	response.write(resp);
	response.end();
}).listen(8888);