// #1
var client1;
describe("Initialization Test Suite", function () {
  this.timeout(5000);
  it("should start listening", function (done) {
    server.listen(18080);
    server.on("listening", done.bind(null, null));
  });
});