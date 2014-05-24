require(['socket.io', 'pixi', 'avatars'], function(io, PIXI, avatars) {

	var arrayOfAvatars = {},
		socket = io.connect('http://localhost:8080');



	var input = {
			angle: 0
		},
		frameCounter = 0;

	var stage = new PIXI.Stage(0x000000),
		renderer = PIXI.autoDetectRenderer(400, 300),
		controlAvatar = null,
		viewPort = new PIXI.DisplayObjectContainer();

	stage.addChild(viewPort);
	document.body.appendChild(renderer.view);
	requestAnimFrame(animate);

	function animate() {
		frameCounter++;
		if(frameCounter % 5) socket.emit('input', input);

		if (controlAvatar) {
			viewPort.position.x = 400/2 - controlAvatar._sprite.position.x;
			viewPort.position.y = 300/2 - controlAvatar._sprite.position.y;
		}

	    requestAnimFrame(animate); 
	    renderer.render(stage);
	}



	socket.on('new', function (data) {
		var avatar = new avatars[data.name](),
			sprite = avatar.init();

		viewPort.addChild(sprite);
		avatar._sprite = sprite;

		arrayOfAvatars[data.id] = avatar;
	});

	socket.on('upd', function (data) {
		var avatar = arrayOfAvatars[data.id];
		avatar.update(data.params);
	});

	socket.on('del', function (id) {
		var sprite = arrayOfAvatars[id]._sprite;
		viewPort.removeChild(sprite);
		delete arrayOfAvatars[id];
	});


	socket.on('ctrl', function (id) {
		controlAvatar = arrayOfAvatars[id];
	});

	socket.on('error', function (text) {
		alert(text);
	});




	socket.emit('login', {
		login: prompt('login'),
		passwd: prompt('passwd')
	});


	var rendererRect = renderer.view.getBoundingClientRect();
	renderer.view.addEventListener('mousemove', function(e) {
	    var mouseX = e.clientX - rendererRect.left;
	    var mouseY = e.clientY - rendererRect.top;
	    input.angle = Math.atan2(mouseY - 400/2, mouseX - 300/2);
	}, false);


});