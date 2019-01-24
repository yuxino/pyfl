module.exports = {
  mode: "production",
  devtool: "inline-source-map",
  entry: "./src/index.ts",
  output: {
    filename: "pyfl.min.js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
  }
};
