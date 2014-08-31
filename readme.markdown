# stream-bouncer

![alt-text](http://jeffreyhill.typepad.com/.a/6a00d8341d417153ef01156f3266b2970c-pi)

Create a queue of streams and have the bouncer
make sure they stay in line!

# Example

```javascript
var fs = require('fs');
var StreamBouncer = require('stream-bouncer');

var bouncer = new StreamBouncer({
  streamsPerTick: 1,
  poll: 1000
});

bouncer.on('error', function(err) {
  console.error(err);
});

var counter = 1;

bouncer.on('close', function(str) {
  console.log('stream finished', str.path);
});

bouncer.on('count', function(count) {
  console.log([count, 'streams remaining'].join(' '));
});

for (var i = 0; i < 10; i++) {
  bouncer.push({
    source: fs.createReadStream(['/Users/gabrieltesta/Downloads/sync/', i, '.mp3'].join('')),
    destination: fs.createWriteStream(['/Users/gabrieltesta/Downloads/slave/', i*counter, '.mp3'].join('')),
  });
}

```

# Details

A stream module that allows you to enqueue a bunch of streams without worrying about
defering the piping.  Just queue up as many streams as you want and let the module take
care of the piping for you!

# Methods

```
var StreamBouncer = require('stream-bouncer');
```

### var bouncer = new StreamBouncer();

Create a new instance of a bouncer.

### bouncer.push({source: readStream, destination: writeStream})
add a stream to the queue

# Options
```javascript
var defaultOptions  = {
  streamsPerTick: 5, //how many simultaneous streams to process per tick
  poll: 250, //how long to wait before process {count} # of streams in ms
  speed: 1000 * 1024 * 1024 // transfer speed, 1 GB/s as default
}
```
###example of overloading options
```javascript
var bouncer = new StreamBouncer({
  streamsPerTick: 1,
  poll: 1000
  speed: 2 * 1024 * 1024 //max 2 MB/s tranfer
});
```

# install

With [npm](https://npmjs.org) do:

```
npm install stream-bouncer
```
to get the library.

# license

MIT
