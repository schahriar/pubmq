"use strict";

const SmartQueue = require("./SmartQueue");

class Channel {
  constructor(options) {
    this.map = new Map();
    this.options = options || {};
  }
  
  has(name) {
    return this.map.has(name);
  }
  
  get(name) {
    return this.map.get(name);
  }
  
  getAddresses(name) {
    return this.map.get(name).list;
  }
  
  getMessages(name) {
    return this.map.get(name).queue.list();
  }
  
  create(name) {
    this.map.set(name, {
      queue: new SmartQueue(parseInt(this.options.size) || 10, this.options.ttl || 5000),
      list: new Set()
    });
  }
  
  pushAddress(name, address) {
    let map = this.map.get(name);
    if (!map) return false;
    
    map.list.add(address);
  }
  
  pushMessage(name, message) {
    let map = this.map.get(name);
    if (!map) return false;
    
    map.queue.push(message);
  }
  
  removeAddress(name, address) {
    let map = this.map.get(name);
    if (!map) return false;
    
    map.list.delete(address);
  }
}

module.exports = Channel;