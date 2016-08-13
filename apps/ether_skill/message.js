'use strict';
var _ = require('underscore');
var googleHelper = require('./google_api_helper');

/**
 * Constructor for Message objects
 *
 * @param {object} options
 * @constructor
 */
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
module.exports = Message;

/**
 * Fetch the data from the API helper
 *
 * @param {number} [id] ID of the message to retrieve. Will override internal id if already set
 * @returns {Promise}
 */
Message.prototype.fetch = function (id) {
  var self = this;
  return new Promise(function (resolve, reject) {
    if (id) {
      self.id = id;
    }

    if (self.id) {
      googleHelper.getMessage(self.id).then(
        /**
         * @param {Object} message
         * @param {string} message.threadId
         * @param {number} message.internalDate
         * @param {string} message.snippet
         * @param {Object} message.payload
         */
        function (message) {
          console.log('Message.fetchSuccess', message);
          var payload = message.payload,
            headers = payload.headers;

          self.threadID = message.threadId;
          self.date = message.internalDate;
          self.snippet = message.snippet;

          // Alexa ssml is limited to 8000 characters - trim here to 6000 just to be safe
          var rawBody = new Buffer(getBody(payload), 'base64');
          self.body = rawBody.toString().substring(0, 6000);

          var sender = _.findWhere(headers, {name: 'From'});
          self.sender = sender ? sender.value : '';

          var subject = _.findWhere(headers, {name: 'Subject'});
          self.subject = subject ? subject.value : '';
          resolve();
        },
        function (err) {
          console.log('Message.fetchError', err);
          console.log('Google Helper getMessage failed. Response', err);
          reject('Google Helper getMessage failed. Response: ' + err);
        }
      );
    } else {
      reject('Cannot fetch message without ID.');
    }
  });
};

/**
 * Return the Base64 encoded version of the body text. This is required because of the inconsistent way in which
 * multipart emails store the body
 *
 * @param {Object} payload The message payload
 * @param {Object} payload.body The body of the message payload
 * @param {[]} payload.parts The multiple parts of the message payload
 * @returns {string}
 */
function getBody(payload) {
  console.log('Getting Body');
  var encodedBody = '';
  if (typeof payload.parts === 'undefined') {
    encodedBody = payload.body.data;
  } else {
    encodedBody = getTextPart(payload.parts);
  }
  return encodedBody;
}

/**
 * Get the text portion of the body for multipart emails
 *
 * @param {[]} parts The multiple parts of the message payload
 * @returns {string}
 */
function getTextPart(parts) {
  console.log('Getting text part');
  var textPart = _.findWhere(parts, {mimeType: 'text/plain'});
  return textPart ? textPart.body.data : '';
}
