var events = require('events'),
  util = require('util'),
  identityStream = require('identity-stream');

var StreamBouncer = function(options) {

  options = options || {};

  options.poll = options.poll || 100;
  options.streamsPerTick = options.streamsPerTick || 3;
  options.throttle = options.throttle || false;
  options.speed = options.speed || false;

  if (options.poll < 100) {
    options.poll = 100;
    console.log('stream-bouncer: polling interval minimum is 100ms');
  }

  if (options.throttle) {
    ThrottleGroup = require('stream-throttle').ThrottleGroup;
    var tg = new ThrottleGroup({
      rate: options.speed
    });
  }

  var self = this;

  var queue = [],
    _running = false, //bool indicating if stream piping is still occuring
    _sending = false, //bool indicating if streams are still sending data
    _runCount = 0;
  //only exposed function.  push a stream container onto into the list
  function push(streamContainer) {

    if (streamContainer.source && streamContainer.destination) {

      streamContainer.middle = streamContainer.middle || new identityStream();

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

  //forwarding function to EventEmitter.emit
  function _emit(name, data) {
    self.emit(name, data);
  }

  //make worker function
  function _run() {

    if (_running) return;

    _running = true;

    //immediately fire the first stream
    _tick();
    //then poll for the rest
    var interval = setInterval(function() {

      _tick();
      //once queue is empty, then stop polling
      if (queue.length == 0 && !_sending) {
        clearInterval(interval);
        _running = false;
      }
    }, options.poll);
  }

  function _tick() {

    if (_runCount == options.streamsPerTick) {
      return;
    }
    var streamContainer = queue.splice(0, 1);
    if (streamContainer[0])
      _beginStream(streamContainer[0]);

  }

  function _beginStream(streamContainer) {

    _runCount++;

    _emit('start', streamContainer.source);

    streamContainer.source.on('error', function(err) {
      _emit('error', err);
      _runCount--;
      _sending = (_runCount != 0);
      this.destroy();
      this.removeAllListeners();
    });

    streamContainer.source.on('close', function() {
      _runCount--;
      _emit('close', this);
      _emit('count', queue.length + _runCount);
      _sending = (_runCount != 0);
      this.destroy();
      this.removeAllListeners();
    });

    if (tg) {
      streamContainer.source
        .pipe(streamContainer.middle)
        .pipe(tg.throttle())
        .pipe(streamContainer.destination);
    } else {
      streamContainer.source
        .pipe(streamContainer.middle)
        .pipe(streamContainer.destination);
    }
  }

  return {
    push: push,
    on: on
  };

};

//we want to setup events so we can propogate them
util.inherits(StreamBouncer, events.EventEmitter);

module.exports = StreamBouncer;
