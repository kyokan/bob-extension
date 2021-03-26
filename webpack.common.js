const path = require("path");

module.exports = {
    entry: {
        backgroundPage: path.join(__dirname, "src/background/backgroundPage.ts"),
        popup: path.join(__dirname, "src/ui/popup.tsx"),
    },
    output: {
        path: path.join(__dirname, "dist/js"),
        filename: "[name].js",
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.tsx?$/,
                use: "ts-loader",
            },
            {
                exclude: /node_modules/,
                test: /\.scss$/,
                use: [
                    {
                        loader: "style-loader", // Creates style nodes from JS strings
                    },
                    {
                        loader: "css-loader", // Translates CSS into CommonJS
                    },
                    {
                        loader: "sass-loader", // Compiles Sass to CSS
                    },
                ],
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                use: [
                    'file-loader',
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            publicPath: 'assets',
                            bypassOnDebug: true, // webpack@1.x
                            disable: true, // webpack@2.x and newer
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js",  '.png', '.svg'],
        alias: {
            "@src": path.resolve(__dirname, "src/"),
        },
    },
};
