/**
 * Created by seth on 8/11/16.
 */
var AlexaAppServer = require('alexa-app-server');
var server = new AlexaAppServer({
  server_root: __dirname,     // Path to root
  public_html: 'public_html', // Static content
  app_dir: 'apps',            // Where alexa-app modules are stored
  app_root: '/alexa/',        // Service root
  port: 8080,                 // What port to use, duh
  httpsPort : 443,
  httpsEnabled: true,
  privateKey: 'private-key.pem',
  certificate: 'cert.cer'
});
server.start();
server.express.use('/test',function(req,res){ res.send("OK"); });