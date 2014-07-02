require(['socket.io', 'pixi', 'avatars', 'input', 'map', 'stats'], function(io, PIXI, avatars, input, map, Stats) {

	var arrayOfAvatars = {},
		socket = io.connect('http://localhost:8080'),
		frameCounter = 0,
		stage = new PIXI.Stage(0x000000),
		renderer = PIXI.autoDetectRenderer(640, 480),
		controlAvatar = null,
		viewPort = new PIXI.DisplayObjectContainer(),
		controlAvatarId,
		mapPivot = map.pivot,
		stats = new Stats(),
		centerDiv = document.getElementById('centerDiv');

	stats.setMode(2);
	centerDiv.appendChild(stats.domElement);


	stage.addChild(viewPort);
	centerDiv.appendChild(renderer.view);
	input.init(renderer.view, arrayOfAvatars);
	requestAnimFrame(animate);

	viewPort.addChild(mapPivot);

    var aim = new PIXI.Sprite(PIXI.Texture.fromImage("img/aim.png"));
    aim.visible = false;
    aim.anchor.x = 0.5;
    aim.anchor.y = 0.5;
    viewPort.addChild(aim);

	function animate() {
		stats.begin();

		frameCounter++;
		if(frameCounter % 12) {
			var inputData = input.getInputData();
			if (inputData) socket.emit('input', inputData);
		}

		if (controlAvatar) {
			viewPort.position.x = 640/2 - controlAvatar._sprite.position.x;
			viewPort.position.y = 480/2 - controlAvatar._sprite.position.y;
		} else {
			controlAvatar = arrayOfAvatars[controlAvatarId];
		}

		input.setOffset(viewPort.position.x, viewPort.position.y);
		var selectId = input.getSelectId();
		if(selectId) {
			var selectAvatar = arrayOfAvatars[selectId];
			aim.visible = true;
			aim.scale.x = aim.scale.y = selectAvatar.radius / 10;

			aim.position.x = arrayOfAvatars[selectId]._sprite.x;
			aim.position.y = arrayOfAvatars[selectId]._sprite.y;
		} else {
			aim.visible = false;
			selectId == null;
			input.clearSelectId();
		}

	    requestAnimFrame(animate);
	    renderer.render(stage);

	    stats.end();
	}



	socket.on('new', function (data) {
		if (arrayOfAvatars[data.id]) return;

		var avatar = new avatars[data.name](),
			sprite = avatar.init(data.params);

		viewPort.addChild(sprite);
		avatar._sprite = sprite;

		arrayOfAvatars[data.id] = avatar;

		viewPort.removeChild(aim);
		viewPort.addChild(aim);
	});

	socket.on('upd', function (data) {
		var avatar = arrayOfAvatars[data.id];
		if (avatar) avatar.update(data.params);
	});

	socket.on('del', function (id) {
		var sprite = arrayOfAvatars[id]._sprite;
		viewPort.removeChild(sprite);
		delete arrayOfAvatars[id];
	});


	socket.on('ctrl', function (id) {
		controlAvatarId = id;
		controlAvatar = arrayOfAvatars[id];
		input.setSelfId(id);
		input.clearSelectId();
	});

	socket.on('error', function (text) {
		alert(text);
	});




	socket.on('new_c', function (chunk) {
		map.addChunk(chunk);
	});

	socket.on('del_c', function (pos) {
		map.deleteChunk(pos);
	});

	socket.on('map_cnf', function (conf) {
		map.setConf(conf);
	});




	socket.emit('login', {
		login: 'denis',//prompt('login'),
		passwd: 'qwe'//prompt('passwd')
	});
});