# PubMQ
PubMQ is a lightweight message queue and pub/sub library that uses a custom protocol implemented as a small layer on top of the UDP protocol. It is idea for **real-time communication** where asynchronous messages are broadcasted within channels.

*Note that PubMQ is unreliable (UDP) by design and thus ideal for time critical applications.*

------

[![Build Status](https://travis-ci.org/schahriar/pubmq.svg?branch=master)](https://travis-ci.org/schahriar/pubmq)
[![Test Coverage](https://codeclimate.com/github/schahriar/pubmq/badges/coverage.svg)](https://codeclimate.com/github/schahriar/pubmq/coverage)

## Installation
### Client:
```
npm install --save pubmq
```
### Server:
Install PubMQ package globally:
```
npm install -g pubmq
```
Install PubMQ server on port `14850`:
```
pubmq install -p=14850
```
Create startup script to launch PubMQ on restart: [(Checkout PM2 startup script for more info)](http://pm2.keymetrics.io/docs/usage/startup/)
```
pubmq startup <distribution>
```

## Usage
### Subscriber
```javascript
const PubMQClient = require("pubmq").Client;
let client = new PubMQClient();

// Connect to a PubMQ Server
client.connect("localhost:14850", (error) => {
  if (error) throw error;
  
  // Subscribe to the test channel (channels are automatically created)
  client.subscribe("test");
  
  // Listen for messages (note the semi-colon prefix)
  client.on(":test", (message) => {
    // Message is a buffer, convert to string
    let strMessage = message.toString("utf8");
    console.log(strMessage);
  });
});

// Output after pub: Hello World
```
### Publisher
```javascript
const PubMQClient = require("pubmq").Client;
let client = new PubMQClient();

// Connect to a PubMQ Server
client.connect("localhost:14850", (error) => {
  if (error) throw error;
  
  // Publish a message to test channel
  client.publish("test", "Hello World");
});
```