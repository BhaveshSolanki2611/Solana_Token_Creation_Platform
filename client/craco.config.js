const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Ignore source map warnings from node_modules
      webpackConfig.ignoreWarnings = [/Failed to parse source map/];

      // Add fallbacks for node core modules - make sure crypto is properly polyfilled
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser.js'),
        assert: require.resolve('assert'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        url: require.resolve('url'),
        zlib: require.resolve('browserify-zlib'),
        path: require.resolve('path-browserify'),
        fs: false,
        net: false,
        tls: false,
        vm: require.resolve('vm-browserify'),
      };

      // Add plugins for Buffer and process
      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser.js',
          crypto: 'crypto-browserify',
        }),
      ];
      
      return webpackConfig;
    },
  },
}; 