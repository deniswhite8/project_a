var io = require('socket.io').listen(8080),
    db = require('./db');

function login(login, passwd) {
    for (var i = 0; i < db.users.length; i++) {
        var user = db.users[i];
        if (user.login === login && user.passwd === passwd) {
            return i;
        }
    }
    return null;
}

var sid2uidData = {};

function setSid2uid(socketId, userId) {
    sid2uidData[socketId] = userId;
}

function sid2uid(socketId) {
    return sid2uidData[socketId];
}

function getUser(userId) {
    return db.users[userId];
}

function getUserPrimaryAvatar(userId) {
    return db.avatars[db.users[userId].primaryAvatar];
}

function getAvatar(avatarId) {
    return db.avatars[avatarId];
}

function getUserBySid(socketId) {
    return db.users[sid2uid(socketId)];
}



var inputUpdateData = {
    panzer: function(avatar, input) {
        avatar.params.turretAngle = input.angle;
    }
};

function inputUpdate(avatar, input) {
    inputUpdateData[avatar.name](avatar, input);
}

io.sockets.on('connection', function (socket) {

    socket.on('login', function (data) {
        
        var id = login(data.login, data.passwd);

        if (id !== null) {

            setSid2uid(this.id, id);

            getUser(id).socket = socket;
            getUserPrimaryAvatar(id).active = true;

            db.avatars.forEach(function(e, i) {
                if (e.active) {
                    socket.emit('new', {
                        id: i,
                        name: e.name
                    });

                    socket.emit('upd', {
                        id: i,
                        params: e.params
                    });
                }
            });

            socket.emit('ctrl', getUser(id).primaryAvatar);

            socket.broadcast.emit('new', {
                id: getUser(id).primaryAvatar,
                name: getUserPrimaryAvatar(id).name
            });

            socket.broadcast.emit('upd', {
                id: getUser(id).primaryAvatar,
                params: getUserPrimaryAvatar(id).params
            });
        } else {
            socket.emit('error', 'login failed');
            socket.disconnect();
        }
    });

    socket.on('disconnect', function () {
        var user = getUserBySid(this.id);
        if(!user) return;

        var avatarId = user.primaryAvatar;
        getAvatar(avatarId).active = false;
        socket.broadcast.emit('del', avatarId);
    });

    socket.on('input', function (data) {
        var user = getUserBySid(this.id);
        if(!user) return;

        var avatarId = user.primaryAvatar;
        var avatar = getAvatar(avatarId);
        
        inputUpdate(avatar, data);

        io.sockets.emit('upd', {
            id: avatarId,
            params: avatar.params
        });
    });
});
