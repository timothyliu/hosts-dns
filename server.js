var dns = require('native-dns');
var arguments = process.argv.slice(2);
var server = dns.createServer();
var hostile = require("hostile");

var preserveFormatting = false;
var hosts = {};
var firstTime = true;

var curDNS = require("dns");
var dnsIPs = curDNS.getServers();
var req = dns.Request({
    question: dns.Question({ name: "google.com", type: 'A' }),
    server: dnsIPs[0],
    /*
    // Optionally you can define an object with these properties,
    // only address is required
    server: { address: '8.8.8.8', port: 53, type: 'udp' },
    */
    timeout: 1000, /* Optional -- default 4000 (4 seconds) */
  });

console.log("preload hosts file to dns records...")
hostile.get(preserveFormatting, function (err, lines) {
  if (err) {
    console.error(err.message)
    // process.exit();
  }
  lines.forEach(function (line) {
    console.log(line);
    var dn = line[1].toLowerCase();
    if(hosts.hasOwnProperty(line[1])) {
      hosts[dn] = hosts[dn] + ',' + line[0];
    } else {
      hosts[dn] = line[0];
    }
  })
})


server.on('request', function (request, response) {
  //console.log(request)
  var qn = request.question[0].name.toLowerCase();

  if(hosts.hasOwnProperty(qn)) {
    var addrs = hosts[qn].split(',');
    for(var i=0; i<addrs.length; i++) {
      response.answer.push(dns.A({
        name: qn,
        address: addrs[i],
        ttl: 600,
      }));
    }
    response.send();
    return;
  }
  // not in hosts then query other dns
  var question = dns.Question({
    name: qn,
    type: 'A', // could also be the numerical representation
  });

  req = dns.Request({
    question: question,
    server: dnsIPs[0],
    timeout: 1000
  });

  // if(firstTime)
  var req_close = req.on('message', function (err, res) {
    if(err) console.error(err, res);
    else console.log(res);
    
    for(var i=0; i<res.answer.length; i++){
      var a = res.answer[i];
      console.log(a.address || a.data);
      if(a.address) {
        response.answer.push(dns.A({
          name: a.name,
          address: a.address,
          ttl: a.ttl,
        }));
      }
    }

    response.send();
    req_close = null;
  });
  firstTime = false;
  req.send();
});

server.on('error', function (err, buff, req, res) {
  console.log(err.stack);
});

req.on('timeout', function () {
  console.log('Timeout in making request');
});

req.on('end', function () {
  /* Always fired at the end */
  var delta = (new Date().getTime()) - start;
  console.log('Finished processing request: ' + delta.toString() + 'ms');
});

server.serve(53);