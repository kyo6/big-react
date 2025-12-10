// babel.config.js
module.exports = {
  presets: ["@babel/preset-env"],
  plugins: [["@babel/plugin-transform-react-jsx", { throwIfNamespace: false }]],
};
