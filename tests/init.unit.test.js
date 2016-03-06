// #1
describe("Initialization Test Suite", function () {
  this.timeout(5000);
  it("should start listening", function (done) {
    server.listen(18080);
    server.on("listening", done.bind(null, null));
  });
  it("should ping/pong", function (done) {
    var client = new PubMQ.Client(8087);
    client.connect("localhost:18080");
    client.ping(null, function (error, address) {
      expect(address).to.have.property("port", "18080");
      done();
    });
  });
  it("should ping on connect", function (done) {
    var client = new PubMQ.Client(8094);
    client.connect("localhost:18080", function (error, address) {
      if (error) throw error;
      expect(address).to.have.property("port", '18080');
      done();
    });
  });
  it("should pub/sub", function (done) {
    var client1 = new PubMQ.Client(8090);
    client1.connect("localhost:18080");
    client1.subscribe("hello");
    client1.on(":hello", function (message) {
      expect(message.toString()).to.equal("hello world!");
      done();
    });
    setTimeout(function () {
      var client2 = new PubMQ.Client(8092);
      client2.connect("localhost:18080");
      client2.publish("hello", "hello world!");
    }, 20);
  });
});