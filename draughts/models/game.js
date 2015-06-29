var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Draughts = function() {
    EventEmitter.call(this);
    // ������ id ���� = ������ ����
    this.games = [];
    // ������ ������������� ��������� ���������� ��� ������ ����
    this.free = [];
    // ������ ������������ ������������� = id ����
    this.users = [];
};

module.exports = Draughts;
util.inherits(Draughts, EventEmitter);

var GameItem = function(user, opponent) {
    // �������������� �������
    EventEmitter.call(this);
    // ������
    this.user = user;
    this.opponent = opponent;
    // ��� �����
    this.turn = 'white';
};
util.inherits(GameItem, EventEmitter);

Draughts.prototype.start = function(user, cb) {
    // ���� ��������� ����
    if(Object.keys(this.free).length > 0) {
        var opponent = Object.keys(this.free).shift();
        delete this.free[opponent];
        // ���� ���� ��������� ����, ������ �� ����
        var game = new GameItem(user, opponent);
        var id = [
            Math.random() * 0xffff | 0
            , Math.random() * 0xffff | 0
            , Math.random() * 0xffff | 0
            , Date.now()
        ].join('-');
        // ��������� ���� � ������ �����������
        this.games[id] = game;
        this.users[user] = id;
        this.users[opponent] = id;
        cb(true, id, opponent);
    } else {
        this.free[user] = true;
        cb(false);
    }
};

/**
 * ������� �� ����
 */
Draughts.prototype.end = function(user, cb) {
    delete this.free[user];
    var gameId = this.users[user];
    if(this.games[gameId] === undefined) return;
    delete this.games[gameId];
    delete this.users[user];
    cb(gameId);
};
