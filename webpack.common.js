const path = require("path");
const webpack = require("webpack");

const envPlugin = new webpack.EnvironmentPlugin({
  NODE_ENV: "development",
  NETWORK_TYPE: "main"
});

module.exports = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    bob3: path.join(__dirname, "src/contentscripts/bob3.ts"),
    content: path.join(__dirname, "src/contentscripts/index.ts"),
    backgroundPage: path.join(__dirname, "src/background/backgroundPage.ts"),
    popup: path.join(__dirname, "src/ui/popup.tsx"),
    federalist: path.join(__dirname, "src/ui/federalist.tsx"),
  },
  output: {
    path: path.join(__dirname, "dist/js"),
    filename: "[name].js",
    clean: true // Webpack 5 cleans output folder
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    alias: {
      "@src": path.resolve(__dirname, "src/"),
    },
    fallback: {
      fs: false,
      path: require.resolve("path-browserify"),
      crypto: require.resolve("crypto-browserify"),
      vm: require.resolve("vm-browserify"),
      os: require.resolve("os-browserify/browser"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      timers: require.resolve("timers-browserify"),
      zlib: require.resolve("browserify-zlib"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      url: require.resolve("url/"),
      assert: require.resolve("assert/"),
      util: require.resolve("util/"),
      querystring: require.resolve("querystring-es3"),
    }
  },
  module: {
    rules: [
      // TypeScript
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          }
        },
        exclude: /node_modules/,
      },
      // Transpile modern JS in node_modules
      {
        test: /\.m?js$/,
        exclude: /node_modules\/(?!(bdb|blru|bheep)\/)/, // add other problematic packages here
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            cacheDirectory: true
          }
        }
      },
      // JSX/JS in src
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: { presets: ["@babel/preset-env"], cacheDirectory: true }
        }
      },
      // SCSS
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              api: 'modern-compiler',
              implementation: require("sass"),
              sassOptions: {
                quietDeps: true,
                includePaths: [path.resolve(__dirname, ".")]
              }
            }
          }
        ]
      },
      // Images
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: "asset/resource",
        generator: {
          filename: "../assets/[name].[hash][ext]"
        }
      }
    ]
  },
  plugins: [
    envPlugin,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js',
      setImmediate: ['timers-browserify', 'setImmediate'],
      clearImmediate: ['timers-browserify', 'clearImmediate'],
    })
  ],
  devtool: "source-map"
};
