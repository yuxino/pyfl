const path = require("node:path");

const shared = {
  mode: "production",
  devtool: false,
  target: ["web", "es2018"],
  entry: "./src/index.ts",
  resolve: { extensions: [".ts", ".js"] },
  module: {
    rules: [{ test: /\.ts$/, loader: "ts-loader", options: { transpileOnly: true } }]
  }
};

const modernEntries = Object.fromEntries([
  "common", "common-phrases", "full", "full-phrases", "common-search", "full-search"
].map(name => [name, `./src/modern/${name}.ts`]));

module.exports = [
  {
    ...shared,
    name: "umd",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "pyfl.min.js",
      libraryTarget: "umd",
      umdNamedDefine: true,
      globalObject: "(typeof self !== 'undefined' ? self : this)"
    }
  },
  {
    ...shared,
    name: "esm",
    experiments: { outputModule: true },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "index.mjs",
      library: { type: "module" }
    }
  },
  {
    ...shared,
    name: "modern-cjs",
    entry: modernEntries,
    output: {
      path: path.resolve(__dirname, "dist/modern"),
      filename: "[name].cjs",
      library: { type: "commonjs2" }
    }
  },
  {
    ...shared,
    name: "modern-esm",
    entry: modernEntries,
    experiments: { outputModule: true },
    output: {
      path: path.resolve(__dirname, "dist/modern"),
      filename: "[name].mjs",
      library: { type: "module" }
    }
  }
];
