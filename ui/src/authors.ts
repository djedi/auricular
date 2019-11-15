import { autoinject, BindingEngine, observable } from "aurelia-framework";
import { EventAggregator } from "aurelia-event-aggregator";
import { gql } from "apollo-boost";
import { client } from "./resources/gql-client";

@autoinject
export class Authors {
  authors: any[] = [];
  private loading: boolean = true;

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
          query {
            audiobooks(distinct_on: author, order_by: { author: asc }) {
              author
            }
          }
        `
      })
      .then(resp => {
        self.authors = resp.data.audiobooks.map(ab => ab.author);
      })
      .finally(() => {
        self.loading = false;
      });
  }
}
