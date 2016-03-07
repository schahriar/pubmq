// #110
var client = new PubMQ.Client();
var listener = new PubMQ.Client();

describe("Publish E2E Test Suite", function () {
  before(function (done) {
    client.connect("localhost:18080", (error) => {
      if (error) throw error;
      listener.connect("localhost:18080", done);
    });
  });
  it("should publish a String message", function (done) {
    listener.once(":test", (message) => {
      expect(message.equals(new Buffer("sample message"))).to.be.equal(true);
      done();
    });
    client.publish("test", "sample message");
    listener.subscribe("test");
  });
});