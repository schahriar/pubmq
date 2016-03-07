// #120
var client1 = new PubMQ.Client();
var client2 = new PubMQ.Client();
describe("Subscribe E2E Test Suite", function () {
  before(function (done) {
    client1.connect("localhost:18080", function () {
      client2.connect("localhost:18080", done);
    });
  });
  it("should subscribe and receive queued messages", function (done) {
    client1.subscribe("hello");
    client1.once(":hello", function (message) {
      expect(message.toString()).to.equal("Queued Message");
      done();
    });
  });
  it("should unsubscribe", function () {
    client1.unsubscribe("hello");
  });
  it("should receive up to max (10) queued messages", function (done) {
    this.timeout(5000);
    var max = 10;
    var hits = 0;
    // Buffer 5 over client max
    for (var i = 0; i < max + 5; i++) {
      client2.publish("hello", "NO#" + i);
    }
    function handler(message) {
      hits++;
      if (hits === max) {
        // Wait 100ms to make sure we don't get extra packages
        setTimeout(function () {
          // Remove Listener
          client1.removeListener(":hello", handler);
          done();
        }, 100);
      } else if (hits > max) {
        throw new Error("Received more messages than expected");
      }
    }
    setTimeout(function () {
      // Resubscribe
      client1.on(":hello", handler);
      client1.subscribe("hello");
    }, 1000);
  });
  it("should pub/sub", function (done) {
    client1.once(":hello", function (message) {
      expect(message.toString()).to.equal("hello world!");
      done();
    });
    setTimeout(function () {
      client2.publish("hello", "hello world!");
    }, 20);
  });
});