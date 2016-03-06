"use strict";

const Deque = require("double-ended-queue");

class SmartQueue {
  constructor(size, ttl) {
    this.limit = size; // Maximum number of queued messages
    this.ttl = ttl; // TTL of Queued Messages
    // Create Queue
    this.queue = new Deque(size);
    // Create filter & interval
    let filter = this._filter.bind(this);
    setInterval(filter, 500);
  }
  
  _filter() {
    while(this.queue.length) {
      let last = this.queue.peekBack();
      // Compare time difference with STAMP + TTL
      if ((last.stamp + this.ttl) < Date.now()) {
        // Remove last element
        this.queue.shift();
      } else {
        // All elements past this have time to live
        break;
      }
    }
  }
  
  push(element) {
    // Make sure we stay within limits
    if (this.queue.length >= (this.limit)) {
      this.queue.shift();
    }
    this.queue.push({
      stamp: Date.now(),
      value: element
    });
  }
  
  list() {
    let list = [];
    let queue = this.queue.toArray();
    // List based on value
    for (let i = 0; i < queue.length; i++) {
      list.push(queue[i].value);
    }
    return list;
  }
}

module.exports = SmartQueue;