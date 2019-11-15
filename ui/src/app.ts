import { PLATFORM } from "aurelia-pal";
import { Router, RouterConfiguration } from "aurelia-router";

export class App {
  public router: Router;

  public configureRouter(config: RouterConfiguration, router: Router) {
    config.title = "Auricular";
    config.map([
      {
        route: ["", "library"],
        name: "library",
        moduleId: PLATFORM.moduleName("./library"),
        nav: true,
        title: "Library"
      },
      {
        route: "book/:slug",
        name: "book",
        moduleId: PLATFORM.moduleName("./book"),
        title: "Audiobook"
      },
      {
        route: "authors",
        name: "authors",
        moduleId: PLATFORM.moduleName("./authors"),
        nav: true,
        title: "Authors"
      },
      {
        route: "author/:author",
        name: "author",
        moduleId: PLATFORM.moduleName("./author"),
        title: "Author"
      },
      {
        route: "resources",
        name: "abresources",
        moduleId: PLATFORM.moduleName("./abresources"),
        nav: true,
        title: "Resources"
      },
      {
        route: "settings",
        name: "settings",
        moduleId: PLATFORM.moduleName("./settings"),
        nav: true,
        title: "Settings"
      }
    ]);

    this.router = router;
  }
}
