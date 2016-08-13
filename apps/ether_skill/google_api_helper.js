var fs = require('fs');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var _ = require('underscore');

var apiAccessToken = null;
var CLIENT_PATH = __dirname + '/client_secret.json';

var googleHelper = {
  /**
   *
   * @param accessToken
   */
  setAccessToken: function(accessToken) {
    apiAccessToken = accessToken;
  },

  /**
   * @returns {*}
   */
  getOAuthClient: function() {
    var credentials = fs.readFileSync(CLIENT_PATH);
    credentials = JSON.parse(credentials);

    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    oauth2Client.credentials = {
      access_token: apiAccessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      created: Date.now()
    };

    return oauth2Client;
  },

  /**
   * Get's array of all user's messages filtered with query.
   *
   * @param {String} query    The query string to use when retrieving messages
   *
   * @returns {Promise}
   */
  getEmailIDs: function(query) {
    var gmail = google.gmail('v1');
    var self = this;
    return new Promise(function(resolve, reject) {
      gmail.users.messages.list({
        auth: self.getOAuthClient(),
        userId: 'me',
        q: query
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          reject(err);
        } else {
          console.log('The Response', response);
          resolve(_.pluck(response.messages, 'id'));
        }
      });
    });
  },

  /**
   *
   * @param id
   * @returns {Promise}
   */
  getMessage: function(id) {
    var gmail = google.gmail('v1');
    var self = this;
    return new Promise(function(resolve, reject) {
      gmail.users.messages.get({
        auth: self.getOAuthClient(),
        userId: 'me',
        id: id
      }, function(err, response) {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
};
module.exports = googleHelper;
