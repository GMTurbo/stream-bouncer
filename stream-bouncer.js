var events = require('events'),
  util = require('util'),
  _ = require('lodash');


var StreamBouncer = function(options) {

  options = options || {};

  _.defaults(options, {
    streamsPerTick: 5,
    poll: 250,
    throttle: false,
    speed: 1000 * 1024 * 1024 // 1 GB/s as default
  });

  if (options.throttle) {
    ThrottleGroup = require('stream-throttle').ThrottleGroup;
    var tg = new ThrottleGroup({
      rate: options.speed
    });
  }

  var self = this;

  var queue = [],
    _running = false, //bool indicating if stream piping is still occuring
    _sending = false; //bool indicating if streams are still sending data

  //only exposed function.  push a stream container onto into the list
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

  //run a single tick of the run method
  function _tick() {

    //if we're still sending data from the previous tick
    // then we want to continue waiting
    if (_sending) return;

    //splice the amount of streams to run
    //if streamsPerTick is greater than the size of the
    //array then splice knows how to deal with that
    var arrr = queue.splice(0, options.streamsPerTick);

    (function(arr, tillComplete) {

      _sending = (tillComplete > 0);

      _.each(arr, function(stream) {

        _emit('start', stream.source);

        stream.source.on('error', function(err) {
          _emit('error', err);
          tillComplete--;
          _sending = (tillComplete != 0);
          this.destroy();
          this.removeAllListeners();
        });

        stream.source.on('close', function() {
          _emit('close', this);
          _emit('count', queue.length + tillComplete);
          tillComplete--;
          _sending = (tillComplete != 0);
          this.destroy();
          this.removeAllListeners();
        });

        if (tg) {
          stream.source
            .pipe(tg.throttle())
            .pipe(stream.destination);
        } else {
          stream.source
            .pipe(stream.destination);
        }

      });
    })(arrr, arrr.length);

  }

  return {
    push: push,
    on: on
  };

};

//we want to setup events so we can propogate them
util.inherits(StreamBouncer, events.EventEmitter);

module.exports = StreamBouncer;
