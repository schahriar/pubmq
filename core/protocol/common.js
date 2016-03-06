"use strict";

const dgram = require('dgram');
const EventEmitter = require("events");
const BreakCharacter = ' '.charCodeAt(0);
const NextCharacter = ':'.charCodeAt(0);

class PubMQProtocol extends EventEmitter {
  constructor() {
    super();
    this.server = dgram.createSocket('udp4');
  }
  
  _parsePacket(buffer) {
    let parts = [];
    let partCount = 0;
    let i = 0;
    
    for (i = 0; i < buffer.length; i++) {
      if (buffer[i] === BreakCharacter) {
        break;
      } else if (buffer[i] === NextCharacter) {
        partCount++;
      } else {
        if (!parts[partCount]) parts[partCount] = "";
        parts[partCount] += buffer.toString("utf8", i, i+1);
      }
    }
    // Packet not parsable, ignore
    if (partCount < 1) return [null, null, buffer];
    // Parsing error, ignore
    if (partCount > 2) return [null, null, buffer];
    
    // Push remaining buffer as message
    parts.push(buffer.slice(i + 1, buffer.length));
    
    return parts;
  }
  
  _handler(message, sender) {
    let parsedMessage = this._parsePacket(message);
    let command = parsedMessage[0];
    let channel = parsedMessage[1];
    let buffer = parsedMessage[2];
    
    // PubMQ Requires a command
    if (!command) return;
    // List of handlers
    switch(command) {
      case "PUB":
        this.publish(sender, channel, buffer);
      break;
      case "SUB":
        this.subscribe(sender, channel, buffer);
      break;
      case "PING":
        this.ping(sender);
      break;
      case "RES":
        this.resource(sender, channel, buffer);
      break;
    }
  }
  
  send(commands, destination, buffer, callback) {
    // Create a new UDP Client
    const client = dgram.createSocket('udp4');
    // Validate/convert buffer to string
    if (!Buffer.isBuffer(buffer)) buffer = new Buffer((typeof buffer === 'string')?(buffer.toString()):"");
    // Create UDP Packet
    let MessageBuffer = Buffer.concat([new Buffer(commands.join(":") + " "), buffer]);
    
    // Send Over UDP to destination
    client.send(MessageBuffer, 0, MessageBuffer.length, destination.port, destination.address, (error) => {
      if (error && callback) return callback(error);
      else if (error && !callback) {
        // Retry once if packet has failed
        this.send(commands, destination, buffer, function UDP_RETRY(error) {
          client.close();
        });
      } else client.close();
    });
  }
}

module.exports = PubMQProtocol;