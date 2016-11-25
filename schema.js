import fetch from 'isomorphic-fetch'

import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLInterfaceType
} from 'graphql';

const API_TVMAG_ROOT = 'http://api-tvmag.lefigaro.fr/'
const PRIME_TIME_ENDPOINT = 'http://api-tvmag.lefigaro.fr/1.0/schedules/prime-time?is_default=1'
const HEADLINES_ENDPOINT = 'http://api.fidji.lefigaro.fr/export/articles/?source=tvmag.lefigaro.fr&type=ART&type=LIV&limit=25&full=0&oneprofile=1&mediaref=1&section_id=36001'
const SERIES_HEADLINES_ENDPOINT = 'http://api.fidji.lefigaro.fr/export/articles/?source=tvmag.lefigaro.fr&type=ART&section=S%C3%A9ries&limit=9&full=0&oneprofile=1&mediaref=1'
const PEOPLE_HEADLINES_ENDPOINT = 'http://api.fidji.lefigaro.fr/export/articles/?source=tvmag.lefigaro.fr&limit=13&full=0&oneprofile=1&mediaref=1&section_id=36006'

const HeadlinesType = new GraphQLEnumType({
  name: 'HeadlinesType',
  values: {
    INFO: { value: 0 },
    SERIES: { value: 1 },
    PEOPLE: { value: 2 },
  }
})

const headlinesEndpoints = [HEADLINES_ENDPOINT, SERIES_HEADLINES_ENDPOINT, PEOPLE_HEADLINES_ENDPOINT]


const ArticleExcerpt = new GraphQLObjectType({
  name: 'ArticleExcerpt',
  description: 'An article excerpt',
  fields: () => ({
    time: { type: GraphQLString, description: 'A date string' },
    thumbnail: { type: GraphQLString },
    title: { type: GraphQLString },
    description: { type: GraphQLString }
  })
})


const Program = new GraphQLObjectType({
  name: 'Program',
  description: 'A program',
  fields: () => ({
    channel: { type: GraphQLString },
    thumbnail: { type: GraphQLString },
    title: { type: GraphQLString },
    startAt: { type: GraphQLInt, description: 'a EPOCH timestamp' }
  })
})


const Query = new GraphQLObjectType({
  name: 'TVMagSchema',
  description: "Root of the TVMag Schema",
  fields: () => ({
    tonightPrograms: {
      type: new GraphQLList(Program),
      args: {
        offset: { type: GraphQLInt },
        limit: { type: GraphQLInt },
      },
      resolve: (root, { offset = 0, limit = 0 }) => (
        fetch(PRIME_TIME_ENDPOINT)
        .then(res => res.json())
        .then(jsonRes => {
          return (jsonRes.schedules.slice(offset,limit+offset).map(schedule => {
            const broadcast = schedule.broadcasts[0]
            const program = broadcast.program
            return {
              channel: schedule.name,
              thumbnail: `${API_TVMAG_ROOT}${program.photos[0]}`,
              title: program.title,
              startAt: broadcast.start_at
            }
          }))
        })
      )
    },
    headlines: {
      type: new GraphQLList(ArticleExcerpt),
      args: {
        type: { type: HeadlinesType },
        offset: { type: GraphQLInt },
        limit: { type: GraphQLInt },
      },
      resolve: (root, { type, offset, limit }) => (
        fetch(headlinesEndpoints[type])
        .then(res => res.json())
        .then(jsonRes => jsonRes.news.feed.slice(offset, limit+offset).map(feedEntry => {
          return {
            time: feedEntry.modified,
            thumbnail: feedEntry.default.image,
            title: feedEntry.default.title,
            description: feedEntry.default.snippet
          }
        }))
      )
    }
  })
});

const Schema = new GraphQLSchema({
  query: Query
});

export default Schema;
