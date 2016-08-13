var alexa = require('alexa-app');
var googleHelper = require('./google_api_helper');
var Message = require('./message');

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;

// Define an alexa-app
var app = new alexa.app('etherskill');

app.launch(function(request, response) {
  response.say('Welcome to The Ether. You can check your gmail account\'s unread messages here.');
  response.card({
    type: 'Standard',
    title: 'My Cool Card',
    content: 'This is the\ncontent of my card'
  });
});

app.intent('CheckMessagesIntent', {
    utterances: ['to check my messages', 'to check my email', 'check email', 'check my email', 'check messages']
  }, function(req, res) {
    console.log(req.sessionDetails);

    if (req.sessionDetails.accessToken === null) {
      res.say('To get the most out of the Ether, please view the card to link your account.');
      res.linkAccount();
    } else {

      googleHelper.setAccessToken(req.sessionDetails.accessToken);
      googleHelper.getEmailIDs('is:unread').then(
        function(messages) {
          console.log('OnSuccess', messages);
          res.session('messages', messages);
          res.session('currentIndex', 0);
          res.say('You have ' + messages.length + ' unread messages. Would you like details for the first message?');
          res.shouldEndSession(false);
          res.send();
        },
        function(err) {
          console.log('OnError', err);
          res.say('There was an error retrieving messages from gmail.' + err);
          res.send();
        }
      );

      return false;
    }
  }
);

app.intent('MessageDetailsIntent', {
    utterances: ['yup', 'yes', 'message details', 'sure', 'yeah sure']
  }, function(req, res) {
    console.log(req.sessionDetails);

    if (req.sessionDetails.accessToken === null) {
      res.linkAccount();
    } else {

      googleHelper.setAccessToken(req.sessionDetails.accessToken);

      var currentIndex = req.sessionDetails.attributes.currentIndex || 0;
      var messages = req.sessionDetails.attributes.messages || [];
      console.log('Messages', messages);
      console.log('CurrentIndex', currentIndex);
      if (messages.length === 0) {
        res.say('You have no unread messages. Say \'Check my messages\' to check for new messages.');
        res.shouldEndSession(false);
      } else {

        if (currentIndex >= messages.length) {
          res.say('You have no more unread messages.');
        } else {
          var message = new Message({id: messages[currentIndex]});
          var moreMessages = currentIndex < (messages.length - 1);
          message.fetch().then(
            function() {
              res.say(
                'Message From: ' + message.sender.replace(/(<[^>]*>)|[^a-z0-9\.@\s]/gi, '') + '. '
                + 'Subject: ' + message.subject + '. '
                + 'Say \'Read\' for the message body. '
                + moreMessages ? 'Say \'Next\' to hear next messages details. ' : ''
              );
              res.shouldEndSession(false);
              res.session('currentMessage', message);
              res.send();
            },
            function(err) {
              res.say('There was an error retrieving messages from gmail.' + err);
              res.send();
            }
          )
        }

        return false;
      }
    }
  }
);

app.intent('ReadMessageSnippetIntent', {
    utterances: ['read', 'body', 'more', 'again']
  }, function(req, res) {
    console.log(req.sessionDetails);

    if (req.sessionDetails.accessToken === null) {
      res.linkAccount();
    } else {

      var currentIndex = req.sessionDetails.attributes.currentIndex || 0;
      var messages = req.sessionDetails.attributes.messages || [];
      var currentMessage = req.sessionDetails.attributes.currentMessage || null;
      console.log('Message', currentMessage);
      if (!message) {
        res.say('Sorry, but there isn\'t a message to read. Say \'Check my messages\' to check for new messages.');
        res.shouldEndSession(false);
      } else {
        var moreMessages = currentIndex < (messages.length - 1);
        res.say(
          'Message Body: ' + message.body + '. '
          + 'Say \'Again\' to hear this message again. '
          + moreMessages ? 'Say \'Next\' to hear next messages details. ' : ''
        );
        res.shouldEndSession(false);
      }
    }
  }
);

app.intent('NextMessageDetailsIntent', {
    utterances: ['next']
  }, function(req, res) {
    if (req.sessionDetails.accessToken === null) {
      res.linkAccount();
    } else {

      googleHelper.setAccessToken(req.sessionDetails.accessToken);

      var currentIndex = req.sessionDetails.attributes.currentIndex || 0;
      var messages = req.sessionDetails.attributes.messages || [];
      console.log('Messages', messages);
      console.log('CurrentIndex', currentIndex);
      if (messages.length === 0) {
        res.say('You have no unread messages. Say \'Check my messages\' to check for new messages.');
        res.shouldEndSession(false);
      } else {

        if (currentIndex >= messages.length) {
          res.say('You have no more unread messages.');
        } else {
          ++currentIndex;
          var message = new Message({id: messages[currentIndex]});
          var moreMessages = currentIndex < (messages.length - 1);
          message.fetch().then(
            function() {
              res.say(
                'Next message from: ' + message.sender.replace(/(<[^>]*>)|[^a-z0-9\.@\s]/gi, '') + '. '
                + 'Subject: ' + message.subject + '. '
                + 'Say \'Read\' for the message body. '
                + moreMessages ? 'Say \'Next\' to hear next messages details. ' : ''
              );
              res.shouldEndSession(false);
              res.session('currentMessage', message);
              res.send();
            },
            function(err) {
              res.say('There was an error retrieving messages from gmail.' + err);
              res.send();
            }
          );
          res.session('currentIndex', currentIndex);
        }

        return false;
      }
    }
  }
);
module.exports = app;
