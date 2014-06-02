var io = require('socket.io').listen(8080),
    db = require('./db'),
    avatarsManager = require('./avatar.js'),
    usersManager = require('./user.js');

io.set('log level', 0);

avatarsManager.addClasses('avatars');

avatarsManager.addAll(db.avatars);
usersManager.addAll(db.users);


setInterval(function() {
    avatarsManager.update(1/10);
    avatarsManager.sendAll('upd', io.sockets.emit, io.sockets);
}, 1/10);


io.sockets.on('connection', function (socket) {

    socket.on('login', function (data) {
        
        var user = usersManager.login(data.login, data.passwd);

        if (user !== null) {

            user._oldInput = {};
            usersManager.setSid(user, this.id);
            user.getPrimaryAvatar().enable();

            avatarsManager.sendAll('both', socket.emit, this);
            var primaryAvatarId = user.getPrimaryAvatar().getId();
            avatarsManager.send('both', socket.broadcast.emit, primaryAvatarId, this);

            user.setSocket(socket, this);
        } else {
            socket.emit('error', 'login failed');
            socket.disconnect();
        }
    });

    socket.on('disconnect', function () {
        var user = usersManager.getBySid(this.id);
        if(!user) return;

        var primaryAvatar = user.getPrimaryAvatar();
        primaryAvatar.disable();
        socket.broadcast.emit('del', primaryAvatar.getId());
    });

    socket.on('input', function (data) {
        var user = usersManager.getBySid(this.id);
        if(!user) return;

        var primaryAvatar = user.getPrimaryAvatar();
            primaryAvatarId = primaryAvatar.getId();

        if (data.angle === undefined) data.angle = user._oldInput.angle;
        else user._oldInput.angle = data.angle;

        if (data.up === undefined) data.up = user._oldInput.up;
        else user._oldInput.up = data.up;

        if (data.down === undefined) data.down = user._oldInput.down;
        else user._oldInput.down = data.down;

        if (data.left === undefined) data.left = user._oldInput.left;
        else user._oldInput.left = data.left;
        
        if (data.right === undefined) data.right = user._oldInput.right;
        else user._oldInput.right = data.right;

        avatarsManager.input(primaryAvatarId, data);
    });
});
