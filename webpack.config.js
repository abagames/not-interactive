module.exports = function (env) {
  var config = {
    resolve: {
      extensions: ['.ts', '.js'],
      modules: ['node_modules', 'web_modules']
    },
    devServer: {
      contentBase: 'docs'
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /(node_modules|web_modules)/,
          loader: 'awesome-typescript-loader'
        }
      ]
    }
  };
  if (env == null || env.sample_game == null) {
    config.entry = './src/index.ts';
    config.output = {
      path: __dirname + '/docs',
      filename: 'bundle.js'
    };
    config.devtool = 'source-map';
  } else {
    var sampleGame = env.sample_game;
    config.entry = './src/samples/' + sampleGame + '.ts';
    config.output = {
      path: __dirname + '/docs/samples',
      filename: sampleGame + '.js'
    };
  }
  return config;
}
