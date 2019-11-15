import { autoinject } from "aurelia-framework";
import { gql } from "apollo-boost";
import { client } from "./resources/gql-client";

@autoinject
export class Author {
  loading: boolean = true;
  books: any = {};
  author: string = "";

  async activate(vars: any) {
    this.author = vars.author;
    let query: any = gql`
      query($author: String!) {
        audiobooks(where: { author: { _eq: $author } }) {
          title
          year
          slug
          cover
        }
      }
    `;

    const self = this;
    const response = await client
      .query({
        query: query,
        variables: {
          author: vars.author
        }
      })
      .then(resp => {
        console.log(resp);
        self.books = resp.data.audiobooks;
      })
      .finally(() => {
        self.loading = false;
      });
  }
}
