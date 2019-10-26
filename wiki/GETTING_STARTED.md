# Mind.js 

## Application setup

+ Download and install [Node.js 10.x or higher](https://nodejs.org). We recommend using the Node.js **v.12.x** for best performance.
  (_Note: use [nvm](https://github.com/nvm-sh/nvm) if you need to use different versions of Node.js_)

+ Create a project directory:
```bash
mkdir mind-project && cd mind-project
```
  
+ Initialize a `package.json`:
```bash
npm init
```

+ Add mind dependencies to your project:
```bash
npm i @mindjs/common @mindjs/core @mindjs/routing @mindjs/platform-koa
```

```bash
touch main.js
mkdir app
mkdir app/src
touch app/src/app.module.js
```

in `app/src/app.module.js`
```javascript
const { Module } = require('@mindjs/common');
const { HTTP_METHODS } = require('@mindjs/common/http');
const { CoreModule } = require('@mindjs/core');
const { RoutingModule } = require('@mindjs/routing');

module.exports = Module(class MindAppModule{}, {
  imports: [
    CoreModule.forRoot(),
    RoutingModule.forRoot({
      providers: [],
      routerDescriptor: {
        prefix: 'api',
        commonMiddleware: [],
        routes: [
          {
            path: 'hello-mind',
            method: HTTP_METHODS.GET,
            handler: async (ctx) => {
              ctx.body = {
                msg: 'Hello, Mind',
              }
            }
          }
        ],
      },   
    }),
  ],
  providers: [],
});
```

in `main.js`
```javascript
const { mindPlatformKoa } = require('@mindjs/platform-koa');

const MindAppModule = require('./app/src/app.module');

mindPlatformKoa().bootstrapModule(MindAppModule);
```
+ Run your mind app:
```bash
node main.js
```

Now your mind application is accessible on `http://localhost:4400` with two API endpoints: `/ping` (which comes with Koa platform) and `/api/hello-mind` which you have just created.

