require(['socket.io', 'pixi', 'avatars', 'input'], function(io, PIXI, avatars, input) {

	var arrayOfAvatars = {},
		socket = io.connect('http://localhost:8080'),
		frameCounter = 0,
		stage = new PIXI.Stage(0x000000),
		renderer = PIXI.autoDetectRenderer(400, 300),
		controlAvatar = null,
		viewPort = new PIXI.DisplayObjectContainer(),
		controlAvatarId;


	stage.addChild(viewPort);
	document.body.appendChild(renderer.view);
	input.init(renderer.view, arrayOfAvatars);
	requestAnimFrame(animate);

    var drop = new PIXI.Sprite(PIXI.Texture.fromImage("img/drop.png"));
    drop.position.x = 0;
    drop.position.y = 0;
    viewPort.addChild(drop);

    var aim = new PIXI.Sprite(PIXI.Texture.fromImage("img/aim.png"));
    aim.visible = false;
    aim.anchor.x = 0.5;
    aim.anchor.y = 0.5;
    viewPort.addChild(aim);

	function animate() {
		frameCounter++;
		if(frameCounter % 12) {
			var inputData = input.getInputData();
			if (inputData) socket.emit('input', inputData);
		}

		if (controlAvatar) {
			viewPort.position.x = 400/2 - controlAvatar._sprite.position.x;
			viewPort.position.y = 300/2 - controlAvatar._sprite.position.y;
		}

		input.setOffset(viewPort.position.x, viewPort.position.y);
		var selectId = input.getSelectId();
		if(selectId && selectId != controlAvatarId) {
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
	}



	socket.on('new', function (data) {
		if (arrayOfAvatars[data.id]) return;

		var avatar = new avatars[data.name](),
			sprite = avatar.init();

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
	});

	socket.on('error', function (text) {
		alert(text);
	});




	socket.emit('login', {
		login: prompt('login'),
		passwd: prompt('passwd')
	});
});