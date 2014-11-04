var PIXI = require('pixi');

var Graphics = function() {

};

Graphics.prototype.init = function(wrapperDivId, width, height, stats) {
    this._width = width;
    this._height = height;
    this._stage = new PIXI.Stage(0x000000);
	this._renderer = PIXI.autoDetectRenderer(width, height);
	this._viewPort = new PIXI.DisplayObjectContainer();
	this._mapPivot = new PIXI.DisplayObjectContainer();

	this._wrapperDiv = document.getElementById(wrapperDivId);
    this._wrapperDiv.appendChild(stats.domElement);
    
    this._stage.addChild(this._viewPort);
    this._wrapperDiv.appendChild(this._renderer.view);
    this._viewPort.addChild(this._mapPivot);
};

Graphics.prototype.getViewElement = function() {
    return this._renderer.view;  
};




Graphics.prototype.viewPortFocus = function(x, y) {
    this._viewPort.position.x = this._width/2 - x;
	this._viewPort.position.y = this._height/2 - y;
};

Graphics.prototype.getViewPortX = function() {
    return this._viewPort.position.x;
};

Graphics.prototype.getViewPortY = function() {
    return this._viewPort.position.y;
};






Graphics.prototype.addAvatar = function(avatar) {
    if (!avatar) return;
    this._viewPort.addChild(avatar.rootNode._sprite);
};

Graphics.prototype.addChunk = function(chunk) {
    if (!chunk) return;
    this._mapPivot.addChild(chunk._rootGraphicsNode);
};

Graphics.prototype.removeAvatar = function(avatar) {
    if (!avatar) return;
    this._viewPort.removeChild(avatar.rootNode._sprite);
};

Graphics.prototype.removeChunk = function(chunk) {
    if (!chunk) return;
    this._mapPivot.removeChild(chunk._rootGraphicsNode);
};





Graphics.prototype.render = function() {
    this._sortZ(this._viewPort);
    this._renderer.render(this._stage);
};

Graphics.prototype._sortZ = function(node) {
	node.children.sort(function (a, b) {
		return a._z - b._z;
	});
};

module.exports = Graphics;