module.exports = function(app) {
  app.get('/', require('./frontpage').get);
  app.get('/game', require('./game').get);

};
