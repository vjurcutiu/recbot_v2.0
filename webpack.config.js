import path from 'path';

export default {
  mode: 'production', // or 'development'
  entry: {
    main: './src/init.js',
    background: './background.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(process.cwd(), 'dist'),
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};
