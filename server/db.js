module.exports.users = [
    { login: 'denis', passwd: 'qwe', primaryAvatar: 0, foreignAvatar: 2 },
    { login: 'vasya', passwd: '123', primaryAvatar: 1, foreignAvatar: null }
];


module.exports.avatars = [
    { name: 'man',     x: 50,  y: 50,  angle: 0.3,                         hp: 0.7, active: false },
    { name: 'man',     x: 150, y: 50,  angle: 0.3,                         hp: 0.3, active: false },
    { name: 'panzer',  x: 50,  y: 150, angle: 0,         turretAngle: 0.7, hp: 0.6, active: false },
    { name: 'car',     x: 150, y: 150, angle: 0,         turretAngle: 0.7, hp: 0.8, active: true  },
    { name: 'passage', x: 200, y: 200, dir: 'left',      pair: 5,                   active: true  },
    { name: 'passage', x: 300, y: 200, dir: 'downLevel', pair: 4,                   active: true  }
];
