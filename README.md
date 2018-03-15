# Meteor with Webpack
This project includes an example project and a compiler package that replaces Meteor's bundler with modern web project bundler Webpack.
You have to create a `webpack.config.js` file that has the compilation configurations for both client and server code.
You are to free to choose the directory structure in your project, Webpack will compile your project regarding to your entry definition.

## Why Webpack?
- Faster compilation thanks to Webpack good caching during compilation
- ES2015 Modules support instead of loading modules on runtime like Meteor's bundle does in CommonJS way, because Meteor only converts ES2015 import syntax,`import module from 'module'`,to CommonJS import syntax; `const module = require('module')`.
- Tree-shaking for smaller final production bundle
- You can migrate your existing Webpack project to Meteor easily.
- You can use your existing Webpack loaders and plugins without a great modification including the ones don't exist as an atmosphere package.
- Hot Module Replacement without reloading in each compilation using Webpack Dev Middleware together with Meteor's `connect`-compatible HTTP Server

## Before you start
- You have to install webpack and necessary plugins with your favorite package manager; `yarn` or `npm`
- Create `webpack.config.js`, and define entry module which is necessary for webpack.
- If you have seperate client and server codes, you have to declare two configurations like we have in our example.

## Webpack Dev Middleware
If you want to use Webpack's Development Server instead of Meteor's, you have to add `devServer` field and define `publicPath`;
```
    devServer: {}
```
and
```
    output: {
        publicPath: '/'
    },
```
then you have to add another atmosphere package to packages;
```
    meteor add webpack-dev-middleware
```
don't forget to install `webpack-dev-middleware` package from NPM;
```
    npm install webpack-dev-middleware --save
```

## Hot Module Replacement
- Process is the same with Webpack; so you have to just change your configuration;
add `hot` field which is `true`,
```
    devServer: {
        hot: true
    }
```
and add the necessary plugin
```
    plugins: {
        new webpack.HotModuleReplacementPlugin()
    }
```
- Then install `webpack-dev-middleware` and `webpack-hot-middleware` in your project.

### In this example project
- Hot Module Replacement
- Lazy Module
