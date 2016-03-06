"use strict";

const dgram = require('dgram');
const EventEmitter = require("events");
const BreakCharacter = ' '.charCodeAt(0);

class PubMQClient extends EventEmitter {
  constructor(address, port) {
    super();
    
    // Destination Address, format: "<address>:<port>"
    this.address = {
      address: address.split(':')[0],
      port: parseInt(address.split(':')[1])
    };
    // Local port
    this.port = port || 14870;
    
    let MessageHandler = this._handler.bind(this);
    
    this.server = dgram.createSocket('udp4');
    
    this.server.on('message', MessageHandler);
    // Emit Listening event
    this.server.on('listening', () => { this.emit("listening", this.server.address()); });
    // Handler Errors
    this.server.on('error', (error) => { this.emit('error', error); });
    // Handler Close Event
    this.server.on('close', () => { this.emit('closed'); });
    /**
     * @todo: automatically find free port
     */
    // Bind to local port
    this.server.bind(this.port);
  }
  
  _parseMessage(buffer) {
    let channel = "";
    let i = 0;
    
    for (i = 0; i < buffer.length; i++) {
      if (buffer[i] === BreakCharacter) break;

      channel += String.fromCharCode(buffer[i]);
    }
    // Channel not parsable
    if (!channel) return;
    
    return [channel, buffer.slice(i+1, buffer.length)];
  }
  
  _handler(message, sender) {
    let parsedMessage = this._parseMessage(message);
    let channel = parsedMessage[0];
    let buffer = parsedMessage[1];
    
    // Invoke Channel listeners
    this.emit(":" + channel, buffer);
    // Invoke Global listeners
    this.emit(":*", buffer);
  }
  
  send(command, channel, destination, buffer, callback) {
    // Create new UDP Client
    const client = dgram.createSocket('udp4');
    // Validate/convert buffer to string
    if (!Buffer.isBuffer(buffer)) buffer = new Buffer(buffer);
    // Create UDP Packet
    let MessageBuffer = Buffer.concat([new Buffer(command + " " + channel + " "), buffer]);
    
    // Send Over UDP to destination
    client.send(MessageBuffer, 0, MessageBuffer.length, destination.port, destination.address, (error) => {
      if (error && callback) return callback(error);
      else if (error && !callback) {
        // Retry once if packet has failed
        this.send(channel, destination, buffer, function UDP_RETRY(error) {
          client.close();
        });
      } else client.close();
    });
  }
  
  subscribe(channel) {
    this.send("SUB", channel, this.address, this.port + "");
  }
  
  publish(channel, message) {
    this.send("PUB", channel, this.address, message);
  }
}

module.exports = PubMQClient;