var dns = require('native-dns');
var arguments = process.argv.slice(2);
var server = dns.createServer();
var hostile = require("hostile");

var preserveFormatting = false;
var hosts = {};

hostile.get(preserveFormatting, function (err, lines) {
  if (err) {
    console.error(err.message)
    process.exit();
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
    response.answer.push(dns.A({
      name: qn,
      address: hosts[qn],
      ttl: 600,
    }));
  }
  
  response.answer.push(dns.A({
    name: qn,
    address: arguments[0],
    ttl: 600,
  }));
  response.answer.push(dns.A({
    name: qn,
    address: arguments[0],
    ttl: 600,
  }));
  response.additional.push(dns.A({
    name: 'google.com',
    address: '127.0.0.1',
    ttl: 600,
  }));
  response.send();
});

server.on('error', function (err, buff, req, res) {
  console.log(err.stack);
});

server.serve(53);