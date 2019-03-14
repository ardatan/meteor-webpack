# Meteor-Webpack

Blog Post : 
https://medium.com/@ardatan/meteor-with-webpack-in-2018-faster-compilation-better-source-handling-benefit-from-bc5ccc5735ef

Meteor-Webpack provides you a development environment that integrates modern web bundler Webpack, and modern perfect full-stack JavaScript framework Meteor.

You need just one atmosphere package to start;
`ardatan:webpack`

This project includes some examples with popular Frontend frameworks and a compiler package that replaces Meteor's bundler with modern web project bundler Webpack.
You have to create a `webpack.config.js` file that has the compilation configurations for both client and server code.
You are to free to choose the directory structure in your project, Webpack will compile your project regarding to your entry definition.

## Simple Migration

### Feel free like you are working in a Webpack CLI

Meteor-Webpack would make you feel you are using Webpack CLI. Just use same cases in Webpack's own documentation.

### Feel free like you are working in a regular Meteor environment as well

Meteor-Webpack can resolve any atmosphere packages and Meteor modules like you are using without Meteor-Webpack

## Try our examples with your favorite Frontend framework

- [Vanilla](https://github.com/ardatan/meteor-webpack/tree/master/examples/vanilla)
- [Angular](https://github.com/ardatan/meteor-webpack/tree/master/examples/angular)
- [React](https://github.com/ardatan/meteor-webpack/tree/master/examples/react)
- [Vue](https://github.com/ardatan/meteor-webpack/tree/master/examples/vue)

## Why Webpack

- Faster compilation thanks to Webpack good caching during compilation
- ES2015 Modules support instead of loading modules on runtime like Meteor's bundle does in CommonJS way, because Meteor only converts ES2015 import syntax,`import module from 'module'`,to CommonJS import syntax; `const module = require('module')`.
- Tree-shaking for smaller final production bundle
- You can migrate your existing Webpack project to Meteor easily.
- You can use your existing Webpack loaders and plugins without a great modification including the ones don't exist as an atmosphere package.
- Hot Module Replacement without reloading in each compilation using Webpack Dev Middleware together with Meteor's `connect`-compatible HTTP Server
- HMR is available for server-side code, so your re-compiled server-side code will be replaced in 'already running' server without restart. So, the recompilation of server-side code takes less time than regular Meteor bundler's.
- Comparisons with other bundlers are explained [here](https://webpack.js.org/comparison/).

## Comparison with other solutions in Meteor

### Regular Meteor Bundler

Regular Meteor Bundler uses `babel` which tranpiles your ES2015 syntax to ES5 even imports to `CommonJS` which creates some limitation for you. For instance, you cannot use ES2015 modules, then you need to import UMD modules which would probably contain unused submodules of this module.
Despite you can use atmosphere packages with Meteor-Webpack, you don't need to add extra atmosphere packages for sass, typescript and others' compilation. For an extra compiler such as sass, less and pug etc; you can just install necessary webpack loader plugins, and add them into `webpack.config.js`. Meteor-Webpack runs exactly same way with `webpack-dev-server`.

### [Meteor Client Bundler](https://github.com/Urigo/meteor-client-bundler)

As in its documentation;
`meteor-client-bundler` is a module bundler which will take a bunch of Atmosphere package and put them into a single module, so we can load Meteor's client scripts regardless of what framework we're using to run our server. 
But you cannot use this client bundle with Server Side Rendering, and you must have two different projects which run on two different servers.
With Meteor-Webpack, you can extract `webpack.config.js` from Angular CLI, `create-react-app` and any other CLI tools', then easily use it with Meteor.

## Before you start

- Remove existing compiler packages; `meteor remove ecmascript es5-shim static-html`
- If you are using Meteor entry points, you have to remove them from your `package.json` 
```json
"meteor": {
  "mainModule": {
    "client": "client/main.js",
    "server": "server/main.js"
  }
}
```
- You have to install webpack and necessary plugins with your favorite package manager; `yarn` or `npm`
- Add Meteor package `webpack` by the command `meteor add ardatan:webpack`
- Create `webpack.config.js`, and define entry module which is necessary for webpack.
- If you have seperate client and server codes, you have to declare two configurations like we have in our example.

## Seperating Client and Server Configuration - IMPORTANT!

- You have to add `target` field by `node` value in the configuration object you want to use as server's;

```js
    const clientConfig = {
        //...
    }
    const serverConfig = {
        //...
        target: 'node',
    }
```

## Meteor Package Imports - IMPORTANT!
- If you are using Meteor's package imports such as `import { Meteor } from 'meteor/meteor'`, `import { Mongo } from 'meteor/mongo'` and also non-global package references such as `import { publishComposite } from 'meteor/reywood:publish-composite'`. You have to install `webpack-meteor-externals` npm package, and add it to both client and server entries in `webpack.config.js`.
- If you are using all of them by their global references without imports, you don't need that package.
```bash
    meteor npm install webpack-meteor-externals --save-dev
```

```js
    const meteorExternals = require('webpack-meteor-externals');
    //...
    externals: [
        meteorExternals()
    ]
    //...
```

### Client Configuration

#### [Webpack Dev Middleware](https://github.com/webpack/webpack-dev-middleware)

If you want to use Webpack's Development Server instead of Meteor's, you have to add `devServer` field in the client configuration;

```js
    devServer: {}
```

then you have to add another atmosphere package to packages;

```bash
    meteor add ardatan:webpack-dev-middleware
```

***NOTE*** Make sure `ardatan:webpack-dev-middleware` is at the bottom of your `.packages` list for the best compatibility with other Meteor packages.

don't forget to install `webpack-dev-middleware` package from NPM;

```bash
    meteor npm install webpack-dev-middleware --save-dev
```

### Server Configuration

#### Loading NPM modules on runtime instead of compiling them by Meteor

- Install `webpack-node-externals`

```bash
    meteor npm install webpack-node-externals --save-dev
```

- Add externals into the server configuration in `webpack.config.js`

```js
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
```

### [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/)

- Process is the same with Webpack; so you have to just change your client and server configuration;

- Add `hot` field for both client and server which is `true`,

```js
    devServer: {
        hot: true
    }
```

- and add the necessary plugin only for client; do not add this plugin for server, `hot: true` is enough for server-side HMR!

```js
    plugins: {
        new webpack.HotModuleReplacementPlugin()
    }
```

- Then install `webpack-dev-middleware`,
- Install client-side HMR middleware [`webpack-hot-middleware`](https://github.com/glenjamin/webpack-hot-middleware) in your project
- Install server-side HMR middleware [`webpack-hot-server-middleware`](https://github.com/60frames/webpack-hot-server-middleware) in your project

- Meteor's bundler may restart your server which is not good for HMR's working process; so we need to disable it by adding `.meteorignore` on the root with the following content;
```
    *
    !.meteor/
    !node_modules/
    !webpack.config.js
```

### meteor/server-render

- Meteor's `server-render` will work as expected if you use webpack to include HTML via `HtmlWebpackPlugin`. **Important: Be sure that server-render is listed BELOW webpack-dev-server in `meteor/packages`**

### Dynamic boilerplate assets

- You can use `WebAppInternals.registerBoilerplateCallback` to dynamically change the CSS and JS served to visitors via `data.js` and `data.css`. In order to use this feature with webpack, you must set `inject: false` on `HtmlWebpackPlugin` and set the environment variable `DYNAMIC_ASSETS=true`.

## Galaxy Deployment
`meteor deploy` command doesn't set `NODE_ENV=production` environment variable. That's why, `webpack` compiler recognizes that it is still a `development` build. You have two options to fix issue;
### First option ( Recommended )
- You have to provide `GALAXY_NODE_OPTIONS=--production` to make `webpack` recognize that it is a `production` build.
or
## Second option
- Create a seperate configuration file for `webpack` which doesn't contain development settings such as `devServer`, and includes `UglifyJs` plugins. Then, set environment variable `WEBPACK_CONFIG_FILE=<filename>`.

## Testing

- Using `meteor test` requires the option  `--test-app-path $(pwd)/.meteortest`. This will run the test inside the `.meteortest` directory in your project. Normally, `meteor test` runs a test version of the application inside your `/tmp` directory, but webpack needs to be able to access the project's `node_modules` folder.

- You may also run into permissions issues after the `.meteortest` folder is created. I recommend adding `rm -r .meteortest` to the beginning of your test command.

- All DDP connections are closed when the dev server recompiles in test mode. This will trigger testing libraries that use DDP (Chimpy) to re-run if they are in watch mode.
