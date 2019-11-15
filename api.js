const path = require("path");
const express = require("express");
const mime = require("mime");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const Jimp = require("jimp");
const shell = require("shelljs");
const exec = require("shelljs.exec");
const proxy = require("express-http-proxy");
const cors = require("cors");
const ab = require("./audiobook");
const db = require("./db");

const app = express();
const port = 8082;

app.use(express.json());
app.use(cors());

app.use("/audiobooks", express.static(path.join(__dirname, "audiobooks")));
app.use("/covers", express.static(path.join(__dirname, "covers")));
app.use("/", express.static(path.join(__dirname, "ui/dist")));
// app.use("/", proxy("http://aurelia:8083"));

app.use(
  fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 }
  })
);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// app.patch("/", (req, res) => {
//   console.log(req.body);
//   console.log(req.params);
//   res.json(req.body);
// });

async function getBookById(id) {
  const { rows } = await db.query("SELECT * FROM audiobooks WHERE id=$1", [id]);
  return rows[0];
}

async function getBookBySlug(slug) {
  const { rows } = await db.query("SELECT * FROM audiobooks WHERE slug=$1", [
    slug
  ]);
  return rows[0];
}

app.get("/:id", (req, res) => {
  res.json(getBookById(req.params.id));
});

app.get("/download/:slug", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM audiobooks WHERE slug=$1", [
    req.params.slug
  ]);

  const file = rows[0].file;
  const filename = path.basename(file);
  const mimetype = mime.lookup(file);

  try {
    res.setHeader("Content-disposition", "attachment; filename=" + filename);
    res.setHeader("Content-type", mimetype);
  } catch (err) {
    console.log("cant set headers", err);
  }

  const filestream = fs.createReadStream(path.resolve(file));
  try {
    filestream.pipe(res);
  } catch (err) {
    console.log("cant pipe", err);
  }
});

app.patch("/:id", (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM audiobooks WHERE id=?;";
  const row = db.prepare(query).get(id);
  console.log("row", row);

  res.json(row);
});

app.get("/:id/chapters", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM audiobooks WHERE id=$1", [
    req.params.id
  ]);
  const book = rows[0];
  let resp = shell.exec(
    `ffprobe -i "${book.file}" -print_format json -show_chapters -loglevel error`,
    { silent: true },
    (data, chapters) => {
      res.send(JSON.parse(chapters));
    }
  );
});

app.post("/upload", async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ err: "No files were uploaded." });
  }
  let file = req.files.file;
  let fullpath = path.join("audiobooks", file.name);
  file.mv(fullpath, async err => {
    if (err) {
      return res.status(500).send(`Error uploading audiobook: ${err}`);
    }
    let resp = await ab.importFile(fullpath);
    res.json({ msg: `Audiobook uploaded: ${file.name}`, resp });
  });
});

app.post("/:id/cover", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM audiobooks WHERE id=$1", [
    req.params.id
  ]);
  const book = rows[0];
  // console.log("book: ", book);
  // console.log(req.files);
  Jimp.read(req.files.image.data)
    .then(image => {
      // Do stuff with the image.
      image
        // .background(0xffffffff)
        .contain(500, 500)
        .write("temp_cover.png");

      console.log("removing cover");
      exec(`mp4art --remove "${book.file}"`);

      setTimeout(() => {
        console.log("adding cover");
        exec(`mp4art --add temp_cover.png "${book.file}"`);
      }, 200);

      setTimeout(() => {
        console.log("moving cover");
        shell.rm("temp_cover.png");
        ab.importFile(book.file);
        res.json({ msg: "done" });
      }, 300);
    })
    .catch(err => {
      // Handle an exception.
      console.log("could not read file", err);
      res.send("could not read image");
    });
});

app.post("/:id/resize-cover", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM audiobooks WHERE id=$1", [
    req.params.id
  ]);
  const book = rows[0];

  console.log("file: ", book.file);
  shell.rm("temp_cover.jpg");
  exec(`ffmpeg -i "${book.file}" -an -codec:v copy temp_cover.jpg`);
  Jimp.read("temp_cover.jpg")
    .then(lenna => {
      lenna
        .contain(500, 500) // resize
        .quality(80) // set JPEG quality
        .write("temp_cover_resized.jpg"); // save
      // now write back to the m4b

      console.log("removing cover");
      shell.exec(`mp4art --remove "${book.file}"`, { async: false });

      console.log("adding cover");
      shell.exec(`mp4art --add temp_cover_resized.jpg "${book.file}"`, {
        async: false
      });

      console.log("moving cover");
      shell.mv("temp_cover_resized.jpg", "foo.jpg");
      ab.importFile(book.file);
    })
    .catch(err => {
      console.error("jimp error:", err);
    })
    .finally(() => {
      shell.rm("temp_cover.jpg");
      res.json({ msg: "done" });
    });
});

app.post("/:id/trim-audible", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM audiobooks WHERE id=$1", [
    req.params.id
  ]);
  const book = rows[0];

  shell.exec(`./trim_audible.sh "${book.file}"`);
  res.json({ msg: "done" });
});

app.post("/scan", async (req, res) => {
  shell.exec("node scan.js");
  res.json({ msg: "done" });
});

app.post("/:id/reimport", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM audiobooks WHERE id=$1", [
    req.params.id
  ]);
  const book = rows[0];

  ab.importFile(book.file);
  res.json({ msg: "done" });
});

app.post("/:id/delete", async (req, res) => {
  const { rows } = await db.query("SELECT * FROM audiobooks WHERE id=$1", [
    req.params.id
  ]);
  const book = rows[0];
  if (!book) {
    res.status(500).send("Book does not exist");
  }

  const deletedPath = path.join(__dirname, "deleted", path.basename(book.file));
  shell.mv(book.file, deletedPath);

  await db.query("DELETE FROM audiobooks WHERE id=$1;", [req.params.id]);
  res.json({ msg: "deleted" });
});
