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
    var exchange = "direct_logs";
    var args = process.argv.slice(2);

    var msg = args.slice(1).join(" ") || "Hello World!";
    var severity = args.length > 0 ? args[0] : "info";

    channel.assertExchange(exchange, "direct", {
      durable: false,
    });

    channel.publish(exchange, severity, Buffer.from(msg)); // severity is routing key

    console.log(" [x] Sent %s: '%s'", severity, msg);
  });
  setTimeout(function () {
    connection.close();
    process.exit(0);
  }, 500);
});
