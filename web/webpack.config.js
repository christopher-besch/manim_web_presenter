const html_webpack_plugin = require("html-webpack-plugin");
const inline_chunk_html_plugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const path = require("path");

module.exports = (env) => {
    return {
        // can be development or production
        mode: env["production"] ? "production" : "development",
        // eval good for development
        devtool: env["production"] ? false : "eval-source-map",
        // only entry file, include any imported files
        entry: {
            index: "./src/index.ts",
        },
        module: {
            rules: [{
                // when test passed
                test: /\.ts$/,
                // use ts-loader to compile
                use: "ts-loader",
                include: [path.resolve(__dirname, "src")],
            }, {
                // when test passed
                test: /\.css$/,
                // use css-loader to compile
                use: [
                    {
                        loader: "style-loader"
                    }, {
                        loader: "css-loader"
                    }
                ],
                include: [path.resolve(__dirname, "src")],
            }],
        },
        resolve: {
            extensions: [".ts", ".js", ".css"],
        },
        output: {
            // tell dev server where to serve code in memory from
            publicPath: "../manim_web_presenter/web",
            // template based on keys in entry
            filename: "tmp/[name].js",
            // need absolute path
            path: path.resolve(__dirname, "../manim_web_presenter/web"),
        },
        devServer: {
            publicPath: "/",
            contentBase: "../manim_web_presenter/web",
            hot: true,
        },
        plugins: [
            new html_webpack_plugin({
                template: "./src/index.html",
                filename: "./index.html",
                inject: true,
            }),
            new inline_chunk_html_plugin(html_webpack_plugin, [/index/]),
        ]
    };
};
