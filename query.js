var dns = require('native-dns'),
  util = require('util');

var question = dns.Question({
  name: 'www.google.com',
  type: 'A', // could also be the numerical representation
});

var start = new Date().getTime();

var req = dns.Request({
  question: question,
  server: '8.8.8.8',
  /*
  // Optionally you can define an object with these properties,
  // only address is required
  server: { address: '8.8.8.8', port: 53, type: 'udp' },
  */
  timeout: 1000, /* Optional -- default 4000 (4 seconds) */
});

req.on('timeout', function () {
  console.log('Timeout in making request');
});

req.on('message', function (err, res) {
  if(err) console.error(err, res);
  else console.log(res);
  /* answer, authority, additional are all arrays with ResourceRecords */
  res.answer.forEach(function (a) {
    /* promote goes from a generic ResourceRecord to A, AAAA, CNAME etc */
    console.log(a.address);
  });
});

req.on('end', function () {
  /* Always fired at the end */
  var delta = (new Date().getTime()) - start;
  console.log('Finished processing request: ' + delta.toString() + 'ms');
});

req.send();