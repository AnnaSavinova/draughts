var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Draughts = function() {
    EventEmitter.call(this);
    // Массив id игры = объект игры
    this.games = [];
    // Массив пользователей ожидающих оппонентов для начало игры
    this.free = [];
    // Массив подключённых пользователей = id игры
    this.users = [];
};

module.exports = Draughts;
util.inherits(Draughts, EventEmitter);

var GameItem = function(user, opponent) {
    // Инициализируем события
    EventEmitter.call(this);
    // Игроки
    this.user = user;
    this.opponent = opponent;
    // Кто ходит
    this.turn = 'white';
};
util.inherits(GameItem, EventEmitter);

Draughts.prototype.start = function(user, cb) {
    // Ищем свободные игры
    if(Object.keys(this.free).length > 0) {
        var opponent = Object.keys(this.free).shift();
        delete this.free[opponent];
        // Если есть ожидающие игру, создаём им игру
        var game = new GameItem(user, opponent);
        var id = [
            Math.random() * 0xffff | 0
            , Math.random() * 0xffff | 0
            , Math.random() * 0xffff | 0
            , Date.now()
        ].join('-');
        // Добавляем игру в список действующих
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
 * Выходим из игры
 */
Draughts.prototype.end = function(user, cb) {
    delete this.free[user];
    var gameId = this.users[user];
    if(this.games[gameId] === undefined) return;
    delete this.games[gameId];
    delete this.users[user];
    cb(gameId);
};
