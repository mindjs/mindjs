const { Framework100500 } = require('@framework100500/core');
const { AppModule } = require('./src');

/*
  const app = new Framework100500(AppModule);
  app.bootstrap();
*/
Framework100500.bootstrap(AppModule);
