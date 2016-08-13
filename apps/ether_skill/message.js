var _ = require('underscore');
var googleHelper = require('./google_api_helper');

module.exports = Message;
function Message(options) {
  options = options || {};

  this.id = options.id || null;
  this.threadID = options.threadID || null;
  this.sender = options.sender || null;
  this.body = options.body || null;
  this.snippet = options.snippet || null;
  this.subject = options.subject || null;
  this.date = options.date || null;
}

/**
 *
 * @param id
 * @returns {Promise}
 */
Message.prototype.fetch = function(id) {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (id) {
      self.id = id;
    }

    if (this.id) {
      googleHelper.getMessage(this.id).then(
        function(message) {
          var payload = message.payload;
          var headers = payload.headers;

          self.threadID = message.threadId;
          self.date = message.internalDate;
          self.snippet = message.snippet;

          var rawBody = new Buffer(payload.body, 'base64');
          self.body = rawBody.toString();

          var sender = _.findWhere(headers, {name: 'From'});
          self.sender = sender ? sender.value : '';

          var subject = _.findWhere(headers, {name: 'Subject'});
          self.subject = subject ? subject.value : '';
          resolve();
        },
        function(err) {
          console.log('Google Helper getMessage failed. Response', err);
          reject('Google Helper getMessage failed. Response: ' + err);
        }
      )
    } else {
      reject('Cannot fetch message without ID.');
    }
  });
};
