define(['pixi'], function (PIXI) {

	var avatars = {},
		textures = {};

	function load(fileName) {
		if (!textures[fileName]) {
			textures[fileName] = PIXI.Texture.fromImage("./img/" + fileName);
		}
		var tx = textures[fileName];
		return new PIXI.Sprite(tx);
	}

	avatars.panzer = function() {
		var turret = load("turret.png"),
			body   = load("body.png");

		this.init = function() {
			turret.anchor.x = 0.5;
			turret.anchor.y = 0.8;
			body.anchor.x = 0.5;
			body.anchor.y = 0.5;

			body.addChild(turret);
			return body;
		};

		this.update = function(params) {
			body.position.x = params.x;
			body.position.y = params.y;
			body.rotation = params.bodyAngle;
			turret.rotation = params.turretAngle;
		};
	};

	return avatars;
});