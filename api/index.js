var express      = require('express');
var morgan       = require('morgan');
var compression  = require('compression');
var bodyParser   = require('body-parser');
var UglifyJS     = require('uglify-js');
var CleanCSS     = require('clean-css');
var YUI          = require('yuicompressor');
var errorhandler = require('errorhandler');
var zlib         = require('zlib');
var api          = express();

api.use(morgan('dev'));
api.use(compression());
api.use(bodyParser({ limit: '1mb' }));
api.use(errorhandler());

/**
 * CORS support.
 */

api.all('*', function(req, res, next){
  if (!req.get('Origin')) {
    return next();
  }

  // use "*" here to accept any origin
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');

  if ('OPTIONS' === req.method) {
    return res.send(200);
  }
  next();
});

api.post('/javascript/', function (req, res) {

  if (!req.param('code')) {
    res.send(404, ':(');
  }

  try {
    output = UglifyJS.minify(req.param('code'), {
      fromString: true,
      warnings: true,
      compress: {
        warnings: true
      }
    });
  } catch (error) {
    // users don't need to see filestructure of server
    delete error.stack;
    res.json(500, error);
  }
  res.send(output);

});

api.post('/css/', function (req, res) {

  if (!req.param('code')) {
    res.send(404, ':(');
  }

  var output = {
    code: new CleanCSS({ processImport : false }).minify(req.param('code'))
  };

  res.send(output);

});

api.post('/yui/', function (req, res) {

  if (!req.param('code')) {
    res.send(404, ':(');
  }

  YUI.compress(req.param('code'), {
    type: req.param('type') === 'javascript' ? 'js' : 'css'
  }, function(err, data, extra) {
    //err   If compressor encounters an error, it's stderr will be here
    //data  The compressed string, you write it out where you want it
    //extra The stderr (warnings are printed here in case you want to echo them
    if (err) {
      res.send(500, { yuiError: err });
    } else {
      res.send({ code: data });
    }
  });

});

api.post('/gz/:fileName', function (req, res) {
  zlib.gzip(req.param('code'), function (_, result) {
    res.end(result);
  });
});

api.all('*', function (req, res) {
  res.send(404);
});

port = Number(process.env.PORT || 3000)

api.listen(port, function() {
  console.log('Server listening on port ' + port);
});
