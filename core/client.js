"use strict";

const dgram = require('dgram');
const PubMQProtocol = require("./protocol/common");

class PubMQClient extends PubMQProtocol {
  constructor(port) {
    super();
    // Set Local port
    this.port = port;
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
  
  connect(host, callback) {
    let MessageHandler = this._handler.bind(this);
    
    // Destination Address, format: "<address>:<port>"
    this.address = {
      address: host.split(':')[0],
      port: parseInt(host.split(':')[1])
    };
    
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
    
    // If callback is provided ping host for response
    if (typeof callback === 'function') {
      this.ping(null, callback);
    }
  }
}

module.exports = PubMQClient;