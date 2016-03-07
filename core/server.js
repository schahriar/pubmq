"use strict";

const dgram = require('dgram');
const ChannelController = require("./Channel");
const PubMQProtocol = require("./protocol/common");

class PubMQServer extends PubMQProtocol {
  constructor(options) {
    super();
    this.channels = new ChannelController(options);
  }
  
  publish(sender, channel, buffer) {
    // Create channel if it doesn't exist
    if (!this.channels.has(channel)) this.channels.create(channel);
    
    let members = this.channels.getAddresses(channel);
    members.forEach((member) => {
      // Broadcast to members of Channel
      this.send(["RES", channel], member, buffer);
    });
    
    // Push Message to Queue
    this.channels.pushMessage(channel, buffer);
  }
  
  subscribe(sender, channel, port) {
    if (!this.hasChannel(channel)) this.createChannel(channel); 
    
    // Create channel if it doesn't exist
    if (!this.channels.has(channel)) this.channels.create(channel);
    // Assign member address
    let memberAddress = {
      address: sender.address,
      port: port.toString('utf8')
    };
    // Create new subscription
    this.channels.pushAddress(channel, memberAddress);
    
    // Send over latest queued messages
    let messages = this.channels.getMessages(channel);
    for (let i = 0; i < messages.length; i++) {
      // Broadcast to members of Channel
      this.send(["RES", channel], memberAddress, messages[i]);
    }
  }
  
  unsubscribe(sender, channel) {
    this.channels.removeAddress(channel, sender);
  }
  
  hasChannel(name) {
    return this.channels.has(name);
  }
  
  createChannel(name) {
    this.channels.create(name);
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
    this.server.on('listening', () => { this.emit("listening", this.server.address()); this.log("LISTENING ON", this.server.address().port); });
    // Handler Errors
    this.server.on('error', ErrorHandler);
    // Handler Close Event
    this.server.on('close', () => { this.emit('closed'); });
    // Bind on given port
    this.server.bind(port || 14850);
  }
}

module.exports = PubMQServer;