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