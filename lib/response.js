/*
Copyright 2011 Timothy J Fontaine <tjfontaine@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN

*/

require('bufferjs/concat')
var Header = require('./header')
var Question = require('./question')
var ResourceRecord = require('./resourcerecord')

var Response = exports.Response = function(socket, rinfo) {
  this._socket = socket
  this._rinfo = rinfo

  this.header = new Header()

  this.question = []
  this.answer = []
  this.authority = []
  this.additional = []
}

Response.prototype.send = function() {
  var message = this.pack()
  this._socket.send(message, 0, message.length, this._rinfo.port, this._rinfo.address)
}

Response.prototype.pack = function() {
  this.header.qdcount = this.question.length
  this.header.ancount = this.answer.length
  this.header.nscount = this.authority.length
  this.header.arcount = this.additional.length

  var message = this.header.pack()

  function append(arrs) {
    for (var i=0; i<arrs.length; i++) {
      var a = arrs[i]
      message = Buffer.concat(message, a.pack())
    }
  }

  append(this.question)
  append(this.answer)
  append(this.authority)
  append(this.additional)

  return message
}

Response.prototype.unpack = function(msg) {
  msg = new Buffer(msg)
  this.header = new Header()
  var pos = 0
  this.header.unpack(msg, pos)
  pos += this.header.size

  var parse_section = function(count, type) {
    var ret = []

    for (var i=0; i<count; i++) {
      var t = new type()
      var read = t.unpack(msg, pos)
      pos += read
      ret.push(t)
    }

    return ret
  }

  this.question = parse_section(this.header.qdcount, Question)
  this.answer = parse_section(this.header.ancount, ResourceRecord)
  this.authority = parse_section(this.header.nscount, ResourceRecord)
  this.additional = parse_section(this.header.arcount, ResourceRecord)
}

module.exports = Response