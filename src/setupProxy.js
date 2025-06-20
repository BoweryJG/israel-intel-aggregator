const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/rss-proxy',
    createProxyMiddleware({
      target: 'http://localhost:8888/.netlify/functions/rss-proxy',
      changeOrigin: true,
      pathRewrite: {
        '^/api/rss-proxy': '',
      },
    })
  );
};