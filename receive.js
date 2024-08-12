// consumer (receiver)

var amqp = require("amqplib/callback_api");

// set up is same as publisher. open connection and a channel
// declare the queue we consume from

amqp.connect("amqp://localhost", function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }
    var queue = "hello";
    channel.assertQueue(queue, {
      durable: false,
    });
    // declare queue here too because we might start
    // consumer before the publishder, wanna make sure queue exists before we try to consume message from it
    // tell server to deliver us messages from queue
    // since it will push us messages asynchronously, provide a callback
    // that will be executed when rabbitMQ pushes messages to our consumer

    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
    channel.consume(
      queue,
      function (msg) {
        console.log(" [x] Received %s", msg.content.toString());
      },
      {
        noAck: true,
      }
    );
  });
});
