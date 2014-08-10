var select, mapDiv, showAvatarPanel;
var renderer, rendererRect, stage, viewPort, avatarsObj, tilesObj;
var avatars = [];
var	conf, chunks = {};

var textures = {};
function loadTexture(name) {
	if (!textures[name]) {
		textures[name] = PIXI.Texture.fromImage(clientPath + "img/" + name);
	}
	var tx = textures[name];
	return new PIXI.Sprite(tx);
}

function getTile(id) {
	return loadTexture('tiles/' + id + '.png');
}


conf = {
	"TILE_SIZE": 42,
	"CHUNK_SIZE": 10,
	"CHUNK_COUNT": 10
};

function initGui() {
	var	avatarsDiv = $('avatars'),
		tilesDiv = $('tiles'),
		btns = [];

	function $(id) {
		return document.getElementById(id);
	}

	function _(tagName, inner, data) {
		var tag = document.createElement(tagName);
		tag.innerHTML = inner;

		for(var i in data) {
			tag[i] = data[i];
		}

		return tag;
	}

	function toolSelect(btn, type, name) {
		btns.forEach(function (e) {
			e.classList.remove('select');
		});
		btn.classList.add('select');

		select = {
			type: type,
			name: name
		};
	}

	avatarList.forEach(function (e) {
		var btn = _('button', e, {'onclick': function() {toolSelect(this, 'avatar', e)}});
		avatarsDiv.appendChild(btn);
		btns.push(btn);
	});

	tileList.forEach(function (e) {
		var btn = _('button', '', {'onclick': function() {toolSelect(this, 'tile', e)}});
		btn.appendChild(_('img', '', {'src': clientPath + 'img/tiles/' + e + '.png'}));
		tilesDiv.appendChild(btn);
		btns.push(btn);
	});

	var btn = _('button', 'Erase', {'className': 'erase', 'onclick': function() {toolSelect(this, 'tile', 0)}});
	tilesDiv.appendChild(btn);
	btns.push(btn);

	selectBtn = $('select');
	selectBtn.onclick = function() {toolSelect(this, 'select')};
	btns.push(selectBtn);
	selectBtn.click();

	mapDiv = $('map');

	var avatarPanelDiv = $('avatarPanel');
	showAvatarPanel = function(avatar) {
		if(avatar) {
			for(var i in avatar._params) {
				if(i != 'name') {
					var	label = _('label', i + ': '),
						input;

					if(avatar._params[i].type == 'bool') input = _('input', '', {type: 'checkbox', checked: avatar._params[i].value, className: 'avatar-data', _dataName: i});
					else if(avatar._params[i].type == 'number') input = _('input', '', {type: 'text', value: avatar._params[i].value, className: 'avatar-data', _dataName: i});
					else if(avatar._params[i].type == 'options') {
						input = _('select', '', {type: 'text', className: 'avatar-data', _dataName: i});
						avatar._params[i].options.forEach(function(e) {
							input.appendChild(_('option', e, {value:e, selected: (e == avatar._params[i].value)}));
						});
					}

					label.appendChild(input);
					avatarPanelDiv.appendChild(label);
				}
				else avatarPanelDiv.appendChild(_('label', i + ': ' + avatar._params[i].value));
			}

			avatarPanelDiv.appendChild(_('button', 'Update', {'id': 'qwe', 'onclick': function() {
				var els = document.getElementsByClassName('avatar-data');
				for(var i = 0; i < els.length; i++) {
					var e = els[i], value;
					if(e.type == 'text') value = Number.parseFloat(e.value);
					else if(e.type == 'checkbox') value = e.checked;
					else if(e.type == 'select-one') value = e.options[e.selectedIndex].value;
					avatar._params[e._dataName].value = value;
				}
				var updParams = {}, initParams = {};
				for(var i in avatar._params) {
					if(avatar._params[i].editable) updParams[i] = avatar._params[i].value;
					else initParams[i] = avatar._params[i].value;
				}
				avatarsObj.removeChild(avatar._sprite);
				var oldParams = avatar._params;
				delete avatars[avatar._id];
				avatar = new avatarFuncs[oldParams.name.value]();
				avatar._params = oldParams;
				var sp = avatar.init(initParams);
				if(avatar.update) avatar.update(updParams);
				avatar._sprite = sp;
				avatarsObj.addChild(sp);
			}}));

			avatarPanelDiv.appendChild(_('button', 'Delete', {'onclick': function() {
				delete avatars[avatar._id];
				avatarsObj.removeChild(avatar._sprite);
				showAvatarPanel(null);
			}}));
		} else {
			while (avatarPanelDiv.firstChild) {
				avatarPanelDiv.removeChild(avatarPanelDiv.firstChild);
			}
		}
	}



	$('open').onclick = function() {
		while(tilesObj.children.length) tilesObj.removeChild(tilesObj.children[0]);
		while(avatarsObj.children.length) avatarsObj.removeChild(avatarsObj.children[0]);

		chunks = {};
		avatars = [];

		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://localhost:8888/open?name=' + $('mapName').value.trim(), false);
		xhr.send(null);
		var data = JSON.parse(xhr.responseText);
		
		conf = data.conf;

		data.chunks.forEach(function (e) {
			var id = e.x + e.y * conf.CHUNK_COUNT;
			chunks[id] = {};
			var chunk = chunks[id];
			chunk.data = e.data;
			chunk.x = e.x;
			chunk.y = e.y;
			chunk.sprites = [];

			chunk.data.forEach(function (v, i) {
				if(v == 0) return;

				var sp = getTile(v);
				sp.position.x = chunk.x * conf.CHUNK_SIZE * conf.TILE_SIZE + (i % conf.CHUNK_SIZE) * conf.TILE_SIZE;
				sp.position.y = chunk.y * conf.CHUNK_SIZE * conf.TILE_SIZE + Math.floor(i / conf.CHUNK_SIZE) * conf.TILE_SIZE;

				tilesObj.addChild(sp);
				chunk.sprites.push(sp);
			});
		});

		data.avatars.data.forEach(function (e, i) {
			var avatar = new avatarFuncs[e.name](),
				sp = avatar.init(e);
			avatarsObj.addChild(sp);
			if(avatar.update) avatar.update(e);
			avatar._sprite = sp;
			avatar._id = i;

			var params = {};

			for(var i in e) {
				params[i] = {value: e[i]};
				var type;

				if(i == 'name') {
					params[i].editable = false;
					type = 'string';
				} else if(i == 'active') {
					params[i].editable = false;
					type = 'bool';
				}
				else if(avatarConf[e.name].init && avatarConf[e.name].init[i] !== undefined) {
					params[i].editable = false;
					type = typeof avatarConf[e.name].init[i];
				} else if(avatarConf[e.name].update && avatarConf[e.name].update[i] !== undefined) {
					params[i].editable = true;
					type = typeof avatarConf[e.name].update[i];
				} else {

				}

				if(type == 'object') {
					type = 'select';
					if (params[i].editable) params[i].options = avatarConf[e.name].update[i];
					else params[i].options = avatarConf[e.name].init[i];
				}

				params[i].type = type;
			}

			avatar._params = params;
			avatars.push(avatar);
			avatar._id = avatars.length - 1;
		});
	};
}
initGui();



function initPixi() {
	stage = new PIXI.Stage(0x000000);
	renderer = PIXI.autoDetectRenderer(640, 480);
	viewPort = new PIXI.DisplayObjectContainer();
	tilesObj = new PIXI.DisplayObjectContainer();
	avatarsObj = new PIXI.DisplayObjectContainer();

	viewPort.position.x = 640/2;
	viewPort.position.y = 480/2;

	stage.addChild(viewPort);
	viewPort.addChild(tilesObj);
	viewPort.addChild(avatarsObj);
	mapDiv.appendChild(renderer.view);

	rendererRect = renderer.view.getBoundingClientRect();
}
initPixi();



function initAvatarFuncs() {
	function define(a, b) {
		return b({DisplayObjectContainer: PIXI.DisplayObjectContainer, load: loadTexture});
	}
	for(var i in avatarFuncs) {
		avatarFuncs[i] = eval(avatarFuncs[i]);
	}
}
initAvatarFuncs();



function addAvatar(posX, posY, name) {

	var prepareInitArray = function(arr) {
		var str = '';
		arr.forEach(function(e, i) {
			str += (i + 1) + ') ' + e + '\n';
		});
		return str;
	}

	var avatar = new avatarFuncs[name](),
		params = {};

	params.name = {value: avatar.constructor.name, editable:false, type:'string'}
	params.active = {value: true, editable:true, type:'bool'};

	var newConf = avatarConf[name].init;
	if(!newConf) newConf = {}; 
	else newConf = JSON.parse(JSON.stringify( newConf ));
	
	for(var i in newConf) {
		if(typeof newConf[i] == 'number') {
			params[i] = {editable: false, type:'number'};
			params[i].value = newConf[i];
		} else {
			var ind = 0,//prompt(prepareInitArray(newConf[i])),
				val = newConf[i][ind - 1];
			if(!val) {
				alert('Error!');
				return;
			}
			params[i] = {editable: false, type:'options', options: newConf[i]};
			params[i].value = newConf[i] = val;
		}
	}


	if(newConf.x !== undefined) params.x.value = newConf.x = posX;
	if(newConf.y !== undefined) params.y.value = newConf.y = posY;

	var sprite = avatar.init(newConf);
	avatarsObj.addChild(sprite);
	avatars.push(avatar);
	avatar._sprite = sprite;
	avatar._id = avatars.length - 1;

	var updConf = avatarConf[name].update;
	if(updConf) {
		updConf = JSON.parse(JSON.stringify( updConf ));

		for(var i in updConf) {
			params[i] = {editable: true, type: typeof updConf[i]};
			params[i].value = updConf[i];
		}

		if(updConf.x !== undefined) params.x.value = updConf.x = posX;
		if(updConf.y !== undefined) params.y.value = updConf.y = posY;

		avatar.update(updConf);

	}

	avatar._params = params;

	return avatar;
}


function addTile(mouseX, mouseY) {
	var	chunkX = Math.floor(mouseX / conf.TILE_SIZE / conf.CHUNK_SIZE),
    	chunkY = Math.floor(mouseY / conf.TILE_SIZE / conf.CHUNK_SIZE),
    	chunkId = chunkX + chunkY * conf.CHUNK_COUNT,
    	chunk = chunks[chunkId],
    	tileX = Math.floor(mouseX / conf.TILE_SIZE) - chunkX * conf.CHUNK_SIZE,
    	tileY = Math.floor(mouseY / conf.TILE_SIZE) - chunkY * conf.CHUNK_SIZE,
    	tileId = tileX + tileY * conf.CHUNK_SIZE;


	if(!chunk) {
    	chunks[chunkId] = {};
    	chunk = chunks[chunkId];
    	chunk.data = [];
    	chunk.x = chunkX;
    	chunk.y = chunkY;
    	chunk.sprites = [];

    	for(var i = 0; i < conf.CHUNK_SIZE * conf.CHUNK_SIZE; i++) chunk.data[i] = 0;
	}

	if(chunk.data[tileId] != select.name) {
	    chunk.data[tileId] = select.name;

	    var oldTile = chunk.sprites[tileId];
	    if(oldTile) {
	    	tilesObj.removeChild(oldTile);
	    	delete chunk.sprites[tileId];
	    }

	    if(select.name != 0) {
		    var tileSp = getTile(select.name);
		    tileSp.position.x = chunkX * conf.TILE_SIZE * conf.CHUNK_SIZE + tileX * conf.TILE_SIZE;
		    tileSp.position.y = chunkY * conf.TILE_SIZE * conf.CHUNK_SIZE + tileY * conf.TILE_SIZE;
			tilesObj.addChild(tileSp);
			chunk.sprites[tileId] = tileSp;
		}
	}

    if(chunk.sprites.length == 0) chunks[chunkId];
}


function sortZ() {
	avatarsObj.children.sort(function (a, b) {
		return a._z - b._z;
	});
}

var selecteds, curS = 0;
function initEvents() {
	var click = false;

	renderer.view.addEventListener('mousedown', function(e) {
		click = true;

		var	mouseX = (e.clientX - rendererRect.left - viewPort.position.x) / viewPort.scale.x,
		    mouseY = (e.clientY - rendererRect.top - viewPort.position.y) / viewPort.scale.y;

		if (select.type == 'avatar') {
			var av = addAvatar(mouseX, mouseY, select.name);
			sortZ();
			selecteds = [av];
			showAvatarPanel(null);
			curS = 0;
			showAvatarPanel(selecteds[curS]);
		} else if(select.type == 'tile') addTile(mouseX, mouseY);
		else if(select.type == 'select') {
			selecteds = [];
			showAvatarPanel(null);
			curS = 0;
			avatars.forEach(function (av, i) {
				if(av && Math.pow(mouseX - av._sprite.x, 2) + Math.pow(mouseY - av._sprite.y, 2) <= av.radius * av.radius)
					selecteds.push(av);
			});
			showAvatarPanel(selecteds[curS]);
		}
	}, false);

	window.addEventListener('keydown', function(e) {
		if(e.keyCode == 'Q'.charCodeAt(0)) {
			curS++;
			if(curS >= selecteds.length) curS = 0;
			showAvatarPanel(null);
			showAvatarPanel(selecteds[curS]);
		} else if(e.keyCode == 'W'.charCodeAt(0)) viewPort.position.y += 10;
		  else if(e.keyCode == 'S'.charCodeAt(0)) viewPort.position.y -= 10;
		  else if(e.keyCode == 'A'.charCodeAt(0)) viewPort.position.x += 10;
		  else if(e.keyCode == 'D'.charCodeAt(0)) viewPort.position.x -= 10;
	}, false);

	renderer.view.addEventListener('mouseup', function(e) {
		click = false;
	}, false);

	renderer.view.addEventListener('mousewheel',function(e) {
		var d = 0;
	    if(e.wheelDelta > 0) d = 2;
	    else d = 0.5;

	    viewPort.scale.x *= d;
	    viewPort.scale.y *= d;

	    viewPort.position.x = (viewPort.position.x - 640/2) * d + 640/2;
	    viewPort.position.y = (viewPort.position.y - 480/2) * d + 480/2;
	}, false);


	renderer.view.addEventListener('mousemove', function(e) {
		if(!click) return;

		var	mouseX = (e.clientX - rendererRect.left - viewPort.position.x) / viewPort.scale.x,
			mouseY = (e.clientY - rendererRect.top - viewPort.position.y) / viewPort.scale.y;

		if(select.type == 'tile') addTile(mouseX, mouseY);
    		

	}, false);
}
initEvents();


requestAnimFrame(animate);
function animate() {
	requestAnimFrame(animate);
	renderer.render(stage);
}