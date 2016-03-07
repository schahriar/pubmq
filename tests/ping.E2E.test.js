// #105
var client = new PubMQ.Client();
describe("Ping/Pong E2E Test Suite", function () {
  it("should ping on connect", function (done) {
    client.connect("localhost:18080", function (error, address) {
      if (error) throw error;
      expect(address).to.have.property("port", '18080');
      done();
    });
  });
  it("should ping/pong", function (done) {
    client.publish("hello", "Queued Message");
    client.ping(null, function (error, address) {
      expect(address).to.have.property("port", "18080");
      done();
    });
  });
});