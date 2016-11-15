import { PubSub, SubscriptionManager } from 'graphql-subscriptions';
import schema from './schema';
// the default PubSub is based on EventEmitters. It can easily
// be replaced with one different one, e.g. Redis
const pubsub = new PubSub();
const subscriptionManager = new SubscriptionManager({
  schema,
  pubsub,
  setupFunctions: {
    counterIncremented: (options, args) => ({
      counterIncremented: value => true  // since we have only one counter, we want to run the subscription each time
    }),
  },
});
export { subscriptionManager, pubsub };