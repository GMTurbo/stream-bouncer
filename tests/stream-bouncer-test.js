var fs = require('fs');
var StreamBouncer = require('../stream-bouncer');

var sb = new StreamBouncer({
  streamsPerTick: 3,
  poll: 250,
  throttle: true,
  speed: 20*1024*1024 // 500 kB/s
});

sb.on('error', function(err) {
  console.error(err);
});

var counter = 1;

sb.on('start', function(str) {
  console.log("starting ", str.path);
});

sb.on('close', function(str) {
  console.log('stream finished', str.path);
});

sb.on('count', function(count) {
  console.log([count, 'streams remaining'].join(' '));
});

for (var i = 0; i < 10; i++) {
  sb.push({
    source: fs.createReadStream(['C:\\Users\\gtesta\\Documents\\node\\stream-bouncer\\tests\\testData\\', i, '.zip'].join('')),
    destination: fs.createWriteStream(['C:\\Users\\gtesta\\Documents\\node\\stream-bouncer\\tests\\testData\\out\\', i, '.zip'].join('')),
  });
}
