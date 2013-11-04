var assert = require('chai').assert,
    Stream = require('stream'),
    _ = require('underscore'),
    sinon = require('sinon'),
    Parse = require('parse'),

    Igelkott = require('igelkott'),
    Topic = require('../igelkott-topic.js').Plugin;


function cleanParseClass(igelkott, className, callback) {

  var query = new igelkott.db.Query(className);
  query.find().then(function(results) {
    var promise = igelkott.db.Promise.as();
    _.each(results, function(result) {
      promise = promise.then(function() {
        return result.destroy();
      });
    });
    return promise;
  }).then(function() {
    callback();
  });
}


describe('Topic', function() {

  var igelkott,
      config,
      s,
      spy;

  beforeEach(function () {
    s = new Stream.PassThrough({objectMode: true});

    config = {
      plugins:['privmsg'],
      'adapter': s, 'connect': function() { this.server.emit('connect'); },
      "database": {
        "app_id": process.env.APP_ID,
        "js_key": process.env.JS_KEY
      }
    };

    igelkott = new Igelkott(config);
  });

  it('Should allow users to add suggestions', function(done) {

    this.timeout(50000); // DB queries are slow
    igelkott.plugin.load('topic', Topic);

    s.on('data', function(data) {
      if(data == "PRIVMSG ##botbotbot :dsmith grymt! Tack för förslaget (this is a suggestion)\r\n")
      {
        done();
      }
    });

    cleanParseClass(igelkott, 'topic', function() {
      igelkott.connect();
      s.write(":dsmith!~dsmith@unaffiliated/dsmith PRIVMSG ##botbotbot :!topic this is a suggestion\r\n");
    });
  });


  it('Should return created suggestions', function(done) {

    this.timeout(50000); // DB queries are slow
    igelkott.plugin.load('topic', Topic);

    s.on('data', function(data) {
      if(data == "PRIVMSG ##botbotbot :dsmith grymt! Tack för förslaget (this is a suggestion)\r\n")
      {
        s.write(":dsmith!~dsmith@unaffiliated/dsmith PRIVMSG ##botbotbot :!topic today\r\n");
      }
      else if (data == "PRIVMSG ##botbotbot :dsmith dagens förslag: this is a suggestion (dsmith)\r\n")
      {
        done();
      }
    });

    cleanParseClass(igelkott, 'topic', function() {
      igelkott.connect();
      s.write(":dsmith!~dsmith@unaffiliated/dsmith PRIVMSG ##botbotbot :!topic this is a suggestion\r\n");
    });
  });

});