var Topic = function Topic() {

  this.listeners = {'trigger:topic': this.topic, 'trigger:shownamn': this.topic};
  this.requireDB = true;

  this.throttleProtection = {};

  this.name = 'topic';
  this.help = {
    "default": "Keeps track of suggested topics, available commands: <trigger>topic add, <trigger>topic today. P.S. för er svenskare, <trigger>shownamn fungerar också bra.",
    "add" : {
      "default": "Add a new suggestion by doign !topic <suggested topic>",
    },
    "today" : {
      "default": "Displays todays suggestions"
    }
  };
};

Topic.prototype.topic = function topic(message) {
  var parts = message.parameters[1].split(' ');
  if (parts[1] == 'today')
  {
    this.list(message);
  }
  else
  {
    parts.shift();
    message.parameters[1] = parts.join(' ');
    this.add(message);
  }
};

Topic.prototype.add = function add(message) {

  var obj = {
    from: message.prefix.nick,
    topic: message.parameters[1]
  };

  this.addRecord(obj, function(result) {
    var add_reply = {
      command: 'PRIVMSG',
      parameters: [message.parameters[0], message.prefix.nick+' grymt! Tack för förslaget ('+obj.topic+')']
    };
    this.igelkott.push(add_reply);

  }.bind(this));
};

Topic.prototype.list = function list(message) {

  var Karma_data = this.igelkott.db.Object.extend("topic");
  var query = new this.igelkott.db.Query(Karma_data);

  var d = new Date();
  var strToday = d.getFullYear()+'-'+d.getMonth()+'-'+(d.getDate() < 10 ? '0'+d.getDate() : d.getDate());
  var date = new Date(strToday);

  query.greaterThan("createdAt", date);
  query.find({
    success: function(results) {
      var topics = [];
      for (var i = 0; i < results.length; ++i) {
        var result = results[i];
        topics.push(results[i].get('topic')+' ('+results[i].get('from')+')');
      }

      var buffer = message.prefix.nick+' dagens förslag: '+topics.join(', ');
      var msg;
      while (buffer.length > 0)
      {
        msg = buffer.slice(0,400); // @TODO: Figure out correct length here
        buffer = buffer.slice(400);

        var add_reply = {
          command: 'PRIVMSG',
          parameters: [message.parameters[0], msg]
        };
        this.igelkott.push(add_reply);
      }
    }.bind(this)
  });
};

Topic.prototype.addRecord = function addRecord(obj, callback) {
  var Topic = this.igelkott.db.Object.extend("topic");
  new Topic().save(obj).then(function(trans) {
    this.igelkott.log('New object created with objectId: ' + trans.id);
    callback();
  }.bind(this), function(error) {
    this.igelkott.log('Failed to create new object, with error code: ' + error.description);
  }.bind(this));
};

exports.Plugin = Topic;