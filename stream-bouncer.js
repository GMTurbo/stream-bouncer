// i want to have this
// var queue = new Stream-Bouncer({count: 5, poll: 250, ...})
// but i want to be able to call
// queue.push({source: fs.createReadStream('blah'), destination: fs.createWriteStream('blahout')});

//for ...
// queue.push({...})
//
var through = require('through'),
  events = require('events'),
  util = require('util'),
  _ = require('lodash'),
  ThrottleGroup = require('stream-throttle').ThrottleGroup;


var StreamBouncer = function(options) {

  options = options || {};

  _.extend({
    count: 5,
    poll: 250,
    speed: 0.5 * 1024 * 1024 // 1 GB/s as default
  }, options);

  var tg = new ThrottleGroup({
    rate: speed
  });

  var self = this;

  options.poll = options.poll || 250;

  var queue = [],
    _running = false;

  function push(streamContainer) {

    if (streamContainer.source && streamContainer.destination) {

      queue.push(streamContainer);

      _run();

    } else {

      _emit('error', {
        error: 'push needs a object with source and destination keys'
      });

    }
  }

  //forwarding function to EventEmitter.on
  function on(name, cb) {
    self.on(name, cb);
  }

  function _emit(name, data) {
    self.emit(name, data);
  }

  function _run() {

    if(_running) return;

    _running = true;

    //immediately fire the first stream
    _tick();

    //then poll for the rest
    var interval = setInterval(function() {

        _tick();
        //once queue is empty, then stop polling
        if (queue.length == 0) {
          clearInterval(interval);
          _running = false;
        }
    }, options.poll);
  }

  function _tick(){

    _.each(queue.splice(0, options.count), function(stream) {

      stream.source.on('error', function(err) {
        _emit('error', err);
        this.destroy();
        this.removeAllListeners();
      });

      stream.source.on('close', function() {
        _emit('close', this);
        this.destroy();
        this.removeAllListeners();
      });

      stream.source.pipe(tg.throttle()).pipe(stream.destination);
    });

  }

  return {
    push: push,
    on: on
  };

};

//we want to setup events so we can propogate them
util.inherits(StreamBouncer, events.EventEmitter);

module.exports = StreamBouncer;
