"use strict";

const dgram = require('dgram');
const PubMQProtocol = require("./protocol/common");

class PubMQClient extends PubMQProtocol {
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
  
  subscribe(channel) {
    this.send(["SUB", channel], this.address, this.port + "");
  }
  
  publish(channel, message) {
    this.send(["PUB", channel], this.address, message);
  }
  
  resource(sender, channel, buffer) {
    // Invoke Channel listeners
    this.emit(":" + channel, buffer);
    // Invoke Global listeners
    this.emit(":*", buffer);
  }
}

module.exports = PubMQClient;