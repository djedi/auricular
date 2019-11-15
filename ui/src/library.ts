import { autoinject, BindingEngine, observable } from "aurelia-framework";
import { EventAggregator } from "aurelia-event-aggregator";
import { gql } from "apollo-boost";
import { client } from "./resources/gql-client";

@autoinject
export class Library {
  library: any[] = [];
  private subscription: any;
  private loading: boolean = true;
  private term: string = "";

  constructor(
    private bindingEngine: BindingEngine,
    private eventAggregator: EventAggregator
  ) {}

  activate() {
    this.queryData();
  }

  async queryData(): Promise<void> {
    this.loading = true;
    const self = this;
    const response = await client
      .query({
        query: gql`
          {
            audiobooks(order_by: { title: asc }) {
              id
              title
              subtitle
              year
              slug
              cover
            }
          }
        `
      })
      .then(resp => {
        console.log(resp);
        self.library = resp.data.audiobooks;
      })
      .finally(() => {
        self.loading = false;
      });
  }

  async search(): Promise<void> {
    const self = this;
    const response = await client
      .query({
        query: gql`
          query SearchQuery($term: String!) {
            audiobooks(
              where: {
                _or: [
                  { title: { _ilike: $term } }
                  { subtitle: { _ilike: $term } }
                  { author: { _ilike: $term } }
                ]
              }
            ) {
              id
              title
              subtitle
              author
              cover
              slug
              year
            }
          }
        `,
        variables: { term: `%${self.term}%` }
      })
      .then(resp => {
        self.library = resp.data.audiobooks;
      });
  }
}
