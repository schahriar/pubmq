"use strict";

const dgram = require('dgram');
const EventEmitter = require("events");
const BreakCharacter = ' '.charCodeAt(0);

class PubMQServer extends EventEmitter {
  constructor() {
    super();
    this.server = dgram.createSocket('udp4');
    this.channels = new Map();
  }
  
  _parseMessage(buffer) {
    let command = "";
    let channel = "";
    let step = 0;
    let i = 0;
    
    for (i = 0; i < buffer.length; i++) {
      if (buffer[i] === BreakCharacter) {
        if (step >= 1) {
          break;
        }
        step++;
      } else {
        if (step < 1) {
          command += String.fromCharCode(buffer[i]);
        } else {
          channel += String.fromCharCode(buffer[i]);
        }
      }
    }
    // Packet not parsable, ignore
    if (step < 1) return [null, null, buffer];
    
    return [command, channel, buffer.slice(i + 1, buffer.length)];
  }
  
  _handler(message, sender) {
    let parsedMessage = this._parseMessage(message);
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
    }
  }
  
  send(channel, destination, buffer, callback) {
    // Create new UDP Client
    const client = dgram.createSocket('udp4');
    // Validate/convert buffer to string
    if (!Buffer.isBuffer(buffer)) buffer = new Buffer(buffer);
    // Create UDP Packet
    let MessageBuffer = Buffer.concat([new Buffer(channel + " "), buffer]);
    
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
  
  publish(sender, channel, buffer) {
    // If Channel doesn't exist no one is listening
    if (!this.hasChannel(channel)) return;
    
    let members = this.getChannel(channel);
    for (let i = 0; i < members.length; i++) {
      // Broadcast to members of Channel
      this.send(channel, members[i], buffer);
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
  
  ping(sender) {
    /**
     * @todo: Implement Client-side version
     */
    this.send("ping", sender, "pong");
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