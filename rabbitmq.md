# Rabbit MQ

- message broker that implements advanced message queuing protocol (AMQP)
- standardizes using producers brokers and consumers
- increases loose coupling and scalability

producer -> exchange -> queue -> consumer

- producer emits messages to exchange
- consumer receives messages from queue
- binding connects an exchange with a queue using binding key
- exchange compares routing key with binding key
- messages distribution depends on exchange types
- fanout, direct, topic (partial match) and headers
- default nameless exchange -> routing key with queue name, indirectly allows sending directly to queues

exchange forwards message to queue, consumer takes up message from queue and consume it. can have multiple queues. exchange connects to queue with binding and binding key.

to send a message, producer specifies a routing key. 
fanout -> sends to all queues

direct: routing key = binding key

topic exchange allows partial match of keys

header uses message header instead of routing key

default (nameless) exhcnage -> routing key = queue name

no routing key -> message will get lost

## Work queue

- distribute time consuming tasks among mutiple workers
- avoid doing a resource intensive task immediately and having to wait for it to complete. schedule the task to be done later. encapsulate a task as a message and send it to a queue. 
- a worker process running in the background will pop the tasks and eventually execute the job.
- when you run many workers the tasks will be shared between them. useful in web apps where it's impossible to handle a complex task during a short http request window

node new_task.js "First message."
node new_task.js "Second message.."
node new_task.js "Third message..."
node new_task.js "Fourth message...."
node new_task.js "Fifth message....."

rabbitMQ will send each message to the next consume, so average every consumer will get same number of messages. This is called round-robin.

- once rabbitmq devliers a message to consumer, it immediately marks it for deletion. if terminates a worker, you los ethe message it was just processing. messages that were dispatched to this worker but were not handled are also lost.
- we dont want to lose any task. if a worker dies, we'd like the task to be delivered to another worker.
- in order to make sure message is never lost, rabbitmq supports message acknowledgements. ack is sent back by the consumer to tell rabbitMQ that a particular message has been received, processed and that rabbitmq is free to delete it.
- if consumer dies (chanel closed, connection closed or tcp connection lost) without sending an ack, rabbitmq will understand message wasnt processed fully and will re-queue it. if there are other consumers, it will redliever it to another consumer.
- timeout is enforced on consumer delivery acknowledgment. helps detect buggy/stuck consumers that never acknowledge deliveries. default 30mins. 
- manual consumer acknowledgments have been turned off in previous examples. turn on with noAck: false, and send a proper acknowlegment from worker once we are done with a task.
- acknowledgment must be sent on the same channel that received the delivery.
- attempts to acknowledge using a different channel will result in a channel level protocol exception.

It's a common mistake to miss the ack. It's an easy error, but the consequences are serious. Messages will be redelivered when your client quits (which may look like random redelivery), but RabbitMQ will eat more and more memory as it won't be able to release any unacked messages.

## Message durability

- if server stops or crashes, tasks will be lost. it will forget the queues and messages unless you tell it not to.
- need to mark both the queue and messages as durable.

## Fair dispatch

- prefetch=1, tells rabbitmq not to give more than one message to a worker at a time. dont dispatch new message to a worker until it has processed and acknowledged the previous one, but instead dispatch it to the next worker that is not still busy.

- use message ack and prefetch to set up a work queue. durability lets tasks survive even if rabbitmq is restarted.


## Publish/subscribe

- assumption behind a work queue is that each task is delivered to exactly one worker.
- deliver a message to multiple consumers -> known as publish / subscribe
- published messages are going to be broadcasted to all receivers
- previously we sent and received messages to and from a queue.
- producer doesnt know if a mesage will be devliered to a queue at all.
- producer can only send messages to an exchange. exchange receives messages from producers, and pushes them to queues. the exchange must know exactly what to do with a message it receives. rules for that are defined by exchange type.
- direct, topic, headers, fanout (broadcast to all)
- default exchange (routing key = queue name)

for logger, we want fresh, empty queue whenever we connect to rabbit, and two, once we disconnect consumer, the queue should be auto deleted.
In the amqp.node client, when we supply queue name as an empty string, we create a non-durable queue with a generated name.


### Bindings

- already created fanout exchange and a queue, now we wneed to tell exchange to send messages to our queue. relationship between exchange and a queue is called a binding.
  
- Direct exchange
  - a message goes to queues whose binding key exactly matches the routing key of the message

### Topic exchange

messages sent to a topic exchange cant have an arbitrary routing key, it must be a list of words, delimited by dots.

binding key must also be in the same form. logic behind topic exchange is similar to direct, a mesage sent with a particular routing key will be delivered to all quqest that are bound with a matching binding key.

Two important special cases for binding keys:
- * star can substitute for exactly one word
- # hash can substitute for zero or more words

when special characters are not used in bindings, topic exchange will behave just like a direct one

## RPC

- when in doubt avoid RPC. use async pipeline.
- make sure it's obvious which function call is local and which is remote
- document system
- handle error cases, how should client react when RPC server is down for a long time

### Callback queue

- client sends a request message, server replies with a response message
- need to send a callback queue address with the request.

steps
1. when client starts up, creates anonymous excluse callback queue
2. for RPC request, client sends a message with two properties: reply to (which is set to the callback queue) and correlation_id (which is set to a unique value for every request)
3. the request is sent to an rpc_queue queue
4. the RPC worker (aka server) is waitinf for requests on that queue. when a request appears, it does the job and sends a message with the result back to the client, using the queue from the reply_to field
5. client waits for data on the callback queue, when msg appears, checks correlation_id. if it matche sthe value from the request it returns the response to the application

