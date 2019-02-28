module.exports = {
  mode: "production",
  devtool: "inline-source-map",
  entry: "./src/index.ts",
  output: {
    filename: "pyfl.min.js",
    libraryTarget: "umd",
    umdNamedDefine: true,
    globalObject: `(typeof self !== 'undefined' ? self : this)`
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
  }
};
