import express from 'express';
import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { subscriptionManager } from './subscriptions';
import bodyParser from 'body-parser';

import schema from './schema'

const PORT = 3000;

const WS_PORT = process.env.WS_PORT || 8080;

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/graphql', graphqlExpress(req => {
  // Get the query, the same way express-graphql does it
  // https://github.com/graphql/express-graphql/blob/3fa6e68582d6d933d37fa9e841da5d2aa39261cd/src/index.js#L257
  const query = req.query.query || req.body.query;
  if (query && query.length > 2000) {
    // None of our app's queries are this long
    // Probably indicates someone trying to send an overly expensive query
    throw new Error('Query too large.');
  }

  return { schema }

}));

app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql'
}));

app.route('/fb')
  .post((req, res) => {
    console.log("post receive");
    console.log(req.body);
    return res.status(200).send('ok')
  })
  .get((req, res) => {
    return res.status(200).send(req.query['hub.challenge'])
  })


app.listen(PORT, () => console.log(`API Server is now running on http://localhost:${PORT}`));

// WebSocket server for subscriptions
const websocketServer = createServer((request, response) => {
  response.writeHead(404);
  response.end();
});

websocketServer.listen(WS_PORT, () => console.log( // eslint-disable-line no-console
  `Websocket Server is now running on http://localhost:${WS_PORT}`
));

// eslint-disable-next-line
new SubscriptionServer({ subscriptionManager }, websocketServer);
