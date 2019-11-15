import { HttpClient } from "aurelia-fetch-client";

export class Settings {
  scanning: boolean = false;
  uploading: boolean = false;
  httpClient = new HttpClient();

  scan() {
    this.scanning = true;
    this.httpClient
      .post(`http://localhost:8082/scan`)
      .then(response => response.json())
      .then(async data => {
        console.log("data", data);
      })
      .catch(err => {
        alert(`There was an error running the scan: ${err}`);
      })
      .finally(() => {
        this.scanning = false;
      });
  }

  upload() {
    this.uploading = true;
    var input: any = document.querySelector('input[type="file"]');
    var data = new FormData();
    data.append("file", input.files[0]);

    this.httpClient
      .fetch(`http://localhost:8082/upload`, {
        method: "POST",
        body: data
      })
      .then(response => response.json())
      .then(async data => {
        if (data.resp[0].slug) {
          location.assign(`#/book/${data.resp[0].slug}`);
        }
      })
      .catch(err => {
        alert(`There was an error uploading the audiobook: ${err}`);
      })
      .finally(() => {
        this.uploading = false;
      });
  }
}
