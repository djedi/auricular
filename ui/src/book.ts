import { autoinject, BindingEngine, observable } from "aurelia-framework";
import { HttpClient } from "aurelia-fetch-client";
import { EventAggregator } from "aurelia-event-aggregator";
import { gql } from "apollo-boost";
import { client } from "./resources/gql-client";

@autoinject
export class Book {
  loading: boolean = true;
  book: any = {};
  channels: any = [];
  slug: string = "";
  httpClient = new HttpClient();

  async activate(vars: any) {
    this.slug = vars.slug;
    let query: any = gql`
      query($slug: String!) {
        audiobooks(where: { slug: { _eq: $slug } }) {
          id
          title
          subtitle
          cover
          year
          author
          copyright
          file
          audible_removed
        }
      }
    `;

    const self = this;
    const response = await client
      .query({
        query: query,
        variables: {
          slug: vars.slug
        }
      })
      .then(resp => {
        console.log(resp);
        self.book = resp.data.audiobooks[0];

        self.httpClient
          .fetch(`http://localhost:8082/${this.book.id}/chapters`)
          .then(response => response.json())
          .then(data => {
            console.log("data", data);
            self.channels = data.chapters;
            console.log("self", self);
          })
          .catch(err => {
            console.log("problem fetching chapters", err);
          });
      })
      .finally(() => {
        self.loading = false;
      });
  }

  speed(rate) {
    let p: any = document.getElementById("player");
    p.playbackRate = rate;
  }

  uploadCover(uploadImage) {
    console.log(uploadImage);
    let formData = new FormData();
    formData.append("image", uploadImage[0]);
    console.log(formData);

    var request = new XMLHttpRequest();
    request.open("POST", `http://localhost:8082/${this.book.id}/cover`);
    request.send(formData);

    setTimeout(() => {
      location.reload();
    }, 2000);

    //return this.upload('api/upload', {}, this.selectedFiles[0]).then(() => this.clearFiles());
  }

  setTime(seconds) {
    let player: any = document.getElementById("player");
    player.currentTime = seconds;
    player.play();
  }

  trimAudible() {
    this.httpClient
      .post(`http://localhost:8082/${this.book.id}/trim-audible`)
      .then(response => response.json())
      .then(async data => {
        console.log("data", data);
        this.markAudibleRemoved();
      })
      .catch(err => {
        console.log("error trimming audible", err);
      });
  }

  async markAudibleRemoved() {
    console.log(this.book.id);
    let mutation = gql`
      mutation($id: Int!) {
        update_audiobooks(
          where: { id: { _eq: $id } }
          _set: { audible_removed: true }
        ) {
          affected_rows
          returning {
            id
            audible_removed
          }
        }
      }
    `;
    const response = await client
      .mutate({
        mutation: mutation,
        variables: {
          id: this.book.id
        }
      })
      .then(resp => {
        console.log(resp);
        this.book.audible_removed = true;
      })
      .catch(err => {
        console.error("could not mark audible removed:", err);
      });
  }

  reimport() {
    this.httpClient
      .post(`http://localhost:8082/${this.book.id}/reimport`)
      .then(response => response.json())
      .then(async data => {
        console.log("data", data);
      })
      .catch(err => {
        console.log("error trimming audible", err);
      });
  }

  delete() {
    const sure = confirm("Are you sure you want to delete this book?");
    if (sure) {
      this.httpClient
        .post(`http://localhost:8082/${this.book.id}/delete`)
        .then(response => response.json())
        .then(async data => {
          location.assign("#/");
        })
        .catch(err => {
          console.log("error deleting book", err);
        });
    }
  }
}
