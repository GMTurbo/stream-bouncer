var fs = require('fs');
var StreamBouncer = require('./stream-bouncer');

var sb = new StreamBouncer({count: 1, poll: 1000});

sb.on('error', function(err) { console.error(err);} );
sb.on('close', function(str) { console.log('stream finished', str.path);});

for (var i = 0; i < 5; i++) {
  sb.push({
    source: fs.createReadStream(['/Users/gabrieltesta/Downloads/sync/', i,'.mp3'].join('')),
    destination: fs.createWriteStream(['/Users/gabrieltesta/Downloads/slave/', i,'.mp3'].join('')),
  });
}

for (var i = 4; i < 9; i++) {
  sb.push({
    source: fs.createReadStream(['/Users/gabrieltesta/Downloads/sync/', i,'.mp3'].join('')),
    destination: fs.createWriteStream(['/Users/gabrieltesta/Downloads/slave/', i,'.mp3'].join(''))
  });
}
