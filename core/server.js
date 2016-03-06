"use strict";

const dgram = require('dgram');
const PubMQProtocol = require("./protocol/common");

class PubMQServer extends PubMQProtocol {
  constructor() {
    super();
    this.channels = new Map();
  }
  
  publish(sender, channel, buffer) {
    // If Channel doesn't exist no one is listening
    if (!this.hasChannel(channel)) return;
    
    let members = this.getChannel(channel);
    for (let i = 0; i < members.length; i++) {
      // Broadcast to members of Channel
      this.send(["RES", channel], members[i], buffer);
    }
  }
  
  subscribe(sender, channel, port) {
    if (!this.hasChannel(channel)) this.createChannel(channel); 
    
    // Create new subscription
    this.getChannel(channel).push({
      address: sender.address,
      port: port.toString('utf8')
    });
  }
  
  hasChannel(name) {
    return this.channels.has(name);
  }
  
  createChannel(name) {
    this.channels.set(name, []);
  }
  
  getChannel(name) {
    return this.channels.get(name);
  }
  
  log() {
    let args = [];
    // V8 Optimized Argument convertor
    for(let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    /**
     * @todo: Prettify logging
     */
    console.log.apply(console.log, args);
  }
  
  listen(port) {
    let MessageHandler = this._handler.bind(this);
    let ErrorHandler = this.log.bind(this, "PubMQ:ERROR");
    
    // Set server port
    this.port = port;
    
    this.server.on('message', MessageHandler);
    // Emit Listening event
    this.server.on('listening', () => { this.emit("listening", this.server.address()); });
    // Handler Errors
    this.server.on('error', ErrorHandler);
    // Handler Close Event
    this.server.on('close', () => { this.emit('closed'); });
    // Bind on given port
    this.server.bind(port || 14850);
  }
}

module.exports = PubMQServer;