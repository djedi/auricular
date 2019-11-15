import ApolloClient from "apollo-client";
import { HttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";

// Create an http link:
const httpLink = new HttpLink({
  uri: "http://localhost:8081/v1/graphql"
});

// Instantiate client
export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    addTypename: true
  })
});
