var io = require('socket.io').listen(8080),
    db = require('./db'),
    avatarsManager = require('./avatar.js'),
    usersManager = require('./user.js');


avatarsManager.addAll(db.avatars);
usersManager.addAll(db.users);


io.sockets.on('connection', function (socket) {

    socket.on('login', function (data) {
        
        var user = usersManager.login(data.login, data.passwd);

        if (user !== null) {

            usersManager.setSid(user, this.id);

            user.setSocket(socket);
            user.getPrimaryAvatar().enable();

            avatarsManager.sendAll('both', socket.emit, this);

            var primaryAvatarId = user.getPrimaryAvatar().getId();
            socket.emit('ctrl', primaryAvatarId);

            avatarsManager.send('both', socket.broadcast.emit, primaryAvatarId, this);
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

        avatarsManager.input(primaryAvatarId, data);
        avatarsManager.send('upd', io.sockets.emit, primaryAvatarId, io.sockets);
    });
});
