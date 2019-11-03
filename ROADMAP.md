# Mind.js Roadmap

#### General stuff:

  * Add/update DOCUMENTATION
  * Add unit/e2e tests
  * Add/Update JS docs
  * Add Typescript types definitions
  * Fix `TODO`s
  * Add documentation web site based on GitHub Pages
  * Improve CI workflow running unit/e2e tests after merging branch into master/develop
  * ...

#### Mind.js packages:

* Common:
  * Add `logger`/`debug-log` utility and service within `CommonModule`
  * Move/get rid of commonly used `lodash` utilities
  * Remove unused helpers
  * ...

* Core:
  * Add methods to `get`/`set` server listener
  * Improve `imports`/`exports`
  * ...
  
* Http:
  * Rework `HttpModule`
  * Complete `HTTP_INTERCEPTOR`s support
  * Add `HttpTestingModule`
  * ...

* Routing:
  * Add `DataResolver`s support
  * Add possibility to render a page 
  * Add `Guard`s support (e.g. `CanActivate`)
  * ...
  
* Testing:
  * Add/complete `overrideModule` method
  * ...

#### Platforms:
  * Add `Express` platform
  * Add `Fastify` platform
  * Add `Restify` platform
  * Add `Hapi` platform
  * Add `uWebSockets` platform
  * Add complex platform solution compliant with `12 factors app` out of the box
  * ...
  
#### Samples:
  * Add/update samples
  * ...
  
#### Modules/Packages:
  * Add `PassportModule`
  * Add Mind.js modules for commonly used Data Bases and their ORMs
  * ...
  
#### MindCMS
 * Create a Content Management System based on Mind.js and Angular
