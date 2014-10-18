(function () {
  'use strict';

  var Promise = require('bluebird'),
    Retry = require('../lib/index'),
    QUEUE_NAME = 'example-queue',
    FAILURE_QUEUE_NAME = 'example-queue-failure',
    amqp = require('amqplib'),
    channel;


  Promise.resolve(amqp.connect('amqp://guest:guest@localhost:5672'))
    .then(function (conn) {
      return conn.createChannel();
    })
    .then(function (ch) {
      Promise.promisifyAll(ch);
      channel = ch;
    })
    .then(function () {
      return Promise.all([
        channel.assertQueue(QUEUE_NAME, {durable: false, autoDelete: true}),
        channel.assertQueue(FAILURE_QUEUE_NAME, {durable: false, autoDelete: true})
      ]);
    })
    .then(function () {
      /* Without retry:
       channel.consume(QUEUE_NAME, function (msg) { console.log(msg); });
       */
      channel.consume(QUEUE_NAME, new Retry(channel, QUEUE_NAME, FAILURE_QUEUE_NAME, null, function (msg) {
        // do some work...
        // no need to 'ack' or 'nack' anymore.
        console.log(msg);
      }));
      console.log('Example consumer started.');
    });
}());