var fs = require('fs');
var StreamBouncer = require('../stream-bouncer');

var sb = new StreamBouncer({
  streamsPerTick: 1,
  poll: 1000,
  throttle: true,
  speed: 0.5*1024*1024 // 500 kB/s
});

sb.on('error', function(err) {
  console.error(err);
});

sb.on('start', function(str) {
  console.log("starting ", str.path);
});


var counter = 1;

sb.on('close', function(str) {
  console.log('stream finished', str.path);

  if(counter > 3) return;

  for (var i = 0; i < 10; i++) {
    sb.push({
      source: fs.createReadStream(['/Users/gabrieltesta/Downloads/sync/', i, '.mp3'].join('')),
      destination: fs.createWriteStream(['/Users/gabrieltesta/Downloads/slave/', i*counter, '.mp3'].join('')),
    });
  }
  counter++;
});

sb.on('count', function(count) {
  console.log([count, 'streams remaining'].join(' '));
});

sb.push({
  source: fs.createReadStream(['/Users/gabrieltesta/Downloads/sync/', 0, '.mp3'].join('')),
  destination: fs.createWriteStream(['/Users/gabrieltesta/Downloads/slave/', 0, '.mp3'].join('')),
});
