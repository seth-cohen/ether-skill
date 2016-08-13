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

    if (self.id) {
      googleHelper.getMessage(self.id).then(
        function(message) {
          console.log('Message.fetchSuccess', message);
          var payload = message.payload;
          var headers = payload.headers;

          self.threadID = message.threadId;
          self.date = message.internalDate;
          self.snippet = message.snippet;

          var rawBody = new Buffer(getBody(payload), 'base64');
          self.body = rawBody.toString().substring(0, 6000);

          var sender = _.findWhere(headers, {name: 'From'});
          self.sender = sender ? sender.value : '';

          var subject = _.findWhere(headers, {name: 'Subject'});
          self.subject = subject ? subject.value : '';
          resolve();
        },
        function(err) {
          console.log('Message.fetchError', err);
          console.log('Google Helper getMessage failed. Response', err);
          reject('Google Helper getMessage failed. Response: ' + err);
        }
      )
    } else {
      reject('Cannot fetch message without ID.');
    }
  });
};

function getBody(payload) {
  console.log('Getting Body');
  var encodedBody = '';
  if (typeof payload.parts === 'undefined') {
    encodedBody = payload.body.data;
  }
  else {
    encodedBody = getTextPart(payload.parts);
  }
  return encodedBody;
}

function getTextPart(parts) {
  console.log('Getting text part');
  var textPart = _.findWhere(parts, {mimeType: 'text/plain'});
  return textPart ? textPart.body.data : '';
}
