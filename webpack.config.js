const path = require('path');

module.exports = {
  entry: './src/app.jsx',
  watch: true,
  output: {
    path: path.resolve('app'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      }, {
        test: /\.(scss|css)$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      }, {
        test: /\.(png|jpg|gif)$/,
        exclude: /node_modules/,
        use: ['file-loader']
    }],
  }
};
