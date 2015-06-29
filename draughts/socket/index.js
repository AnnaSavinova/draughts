var Draughts = require('models/game');
var Game = new Draughts();

module.exports = function(server) {
    var io = require('socket.io').listen(server);
    io.set('origins', 'localhost:*');

    io.sockets.on('connection', function (socket) {
        socket.on('move', function (changes, cb) {
            socket.broadcast.emit('move', changes);
            cb();
        });

        socket.on('start', function () {
            Game.start(socket.id.toString(), function (start, gameId, opponent) {
                if (start) {
                    socket.join(gameId);

                    if (io && io.sockets && io.sockets.sockets) {
                        var sockets = io.sockets.sockets;
                        for (var i = 0; i < sockets.length; ++i) {
                            var _socket = sockets[i];
                            if (_socket.id && _socket.id === opponent) {
                                var opp_socket = _socket;
                                break;
                            }
                        }
                    }

                    opp_socket.join(gameId);
                    socket.emit('ready', gameId, 'white');
                    opp_socket.emit('ready', gameId, 'black');
                } else {
                    // ожидание
                    socket.emit('wait');
                }
            });
        });

        socket.on('end', function (win_color, cb) {
            Game.end(socket.id.toString(), function(gameId) {
                socket.broadcast.emit('end', win_color);
                socket.leave(gameId);
                cb(gameId);
            });
        });
    });
    return io;
};