var dns = require('../dns')

var server = dns.createServer('udp4')
server.bind(5353)

server.on('request', function(request, response) {
  console.log(request)
  response.answer.push(new dns.types.A({
    name: request.question[0].name,
    address: '127.0.0.1',
    ttl: 600,
  }))
  response.send()
});