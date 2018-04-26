# Meteor-Webpack

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
Despite you can use atmosphere packages with Meteor-Webpack, you don't need to add extra atmosphere packages. For an extra compiler such as sass, less and pug etc; you can just install necessary webpack loader plugins, and add them into `webpack.config.js`. Meteor-Webpack runs exactly same way with `webpack-dev-server`.

### [Meteor Client Bundler](https://github.com/Urigo/meteor-client-bundler)

As in its documentation;
`meteor-client-bundler` is a module bundler which will take a bunch of Atmosphere package and put them into a single module, so we can load Meteor's client scripts regardless of what framework we're using to run our server. 
But you cannot use this client bundle with Server Side Rendering, and you must have two different projects which run on two different servers.
With Meteor-Webpack, you can extract `webpack.config.js` from Angular CLI, `create-react-app` and any other CLI tools', then easily use it with Meteor.

## Before you start

- Remove existing compiler packages; `meteor remove ecmascript es5-shim static-html`
- You have to install webpack and necessary plugins with your favorite package manager; `yarn` or `npm`
- Add Meteor package `webpack` by the command `meteor add ardatan:webpack`
- Create `webpack.config.js`, and define entry module which is necessary for webpack.
- If you have seperate client and server codes, you have to declare two configurations like we have in our example.

## Seperating Client and Server Configuration

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

### Client Configuration

#### [Webpack Dev Middleware](https://github.com/webpack/webpack-dev-middleware)

If you want to use Webpack's Development Server instead of Meteor's, you have to add `devServer` field and define `publicPath` in the client configuration;

```js
    devServer: {}
```

and

```js
    output: {
        publicPath: '/'
    },
```

then you have to add another atmosphere package to packages;

```bash
    meteor add ardatan:webpack-dev-middleware
```

don't forget to install `webpack-dev-middleware` package from NPM;

```bash
    npm install webpack-dev-middleware --save
```

### Server Configuration

#### Loading NPM modules on runtime instead of compiling them by Meteor

- Install `webpack-node-externals`

```bash
    npm install webpack-node-externals --save
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

- and add the necessary plugin only for client!

```js
    plugins: {
        new webpack.HotModuleReplacementPlugin()
    }
```

- Then install `webpack-dev-middleware`,
- Install client-side HMR middleware [`webpack-hot-middleware`](https://github.com/glenjamin/webpack-hot-middleware) in your project
- Install server-side HMR middleware [`webpack-hot-server-middleware`](https://github.com/60frames/webpack-hot-server-middleware) in your project