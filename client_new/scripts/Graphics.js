define(['pixi', 'stats'], function (PIXI, Stats) {
    var Graphics = function() {
        this._frameCounter = 0;
    };
    
    Graphics.prototype.init = function(wrapperDivId, width, height) {
        this._width = width;
        this._height = height;
        this._stage = new PIXI.Stage(0x000000);
		this._renderer = PIXI.autoDetectRenderer(width, height);
		this._viewPort = new PIXI.DisplayObjectContainer();
		this._mapPivot = new PIXI.DisplayObjectContainer();
		this._stats = new Stats();
		this._wrapperDiv = document.getElementById(wrapperDivId);
		
		this._stats.setMode(2);
	    this._wrapperDiv.appendChild(this._stats.domElement);
	    
	    this._stage.addChild(this._viewPort);
	    this._wrapperDiv.appendChild(this._renderer.view);
	    this._viewPort.addChild(this._mapPivot);
    };

	Graphics.prototype.animate = function() {
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
			aim._z = selectAvatar._sprite._z + 1;
			sortZ();
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


	function sortZ() {
		viewPort.children.sort(function (a, b) {
			return a._z - b._z;
		});
	}
});