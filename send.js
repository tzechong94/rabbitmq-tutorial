// publisher (sender)

var amqp = require("amqplib/callback_api");

// connect to rabbitmq server
// connect to channel, where most of the api for getting things done reside
// to send, we must declare a queue for us to send to; then we can publish a message to the queue
amqp.connect("amqp://localhost", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    var queue = "hello";
    var msg = "Hello world";

    channel.assertQueue(queue, {
      durable: false,
    });
    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent %s", msg);
  });
  setTimeout(function () {
    connection.close();
    process.exit(0);
  }, 500);
});

// declaring a queue is idempotent, only created if it doesnt exist already
// msg content is a byte array, can encode whatever you like
