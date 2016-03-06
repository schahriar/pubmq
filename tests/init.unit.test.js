// #1
describe("Initialization Test Suite", function () {
  this.timeout(10000);
  it("should start listening", function (done) {
    server.listen(18080);
    server.on("listening", done.bind(null, null));
  });
  it("should pub/sub", function (done) {
    var client1 = new PubMQ.Client("localhost:18080", 8090);
    client1.subscribe("hello");
    client1.on(":hello", function (message) {
      //expect(message.toString()).to.equal("hello world!");
      done();
    });
    setTimeout(function () {
      var client2 = new PubMQ.Client("localhost:18080", 8092);
      client2.publish("hello", "hello world!");
    }, 20);
  });
});