const fs = require("fs");
const recursvie = require("recursive-readdir");
const path = require("path");
const mm = require("music-metadata");
const util = require("util");
const slug = require("slug");
const rimraf = require("rimraf");
const { Pool, Client } = require("pg");

const connectionString = "postgres://postgres:@postgres:5432/postgres";
const pool = new Pool({
  connectionString: connectionString
});
const client = new Client({
  connectionString: connectionString
});
client.connect();

const mediaPath = "audiobooks";
const ext = ".m4b";
const audiobooks = [];
const COVERS_DIR = "covers";

try {
  if (!fs.existsSync(mediaPath)) {
    console.log(`Media path (${mediaPath}) does not exist.`);
    process.exit();
  }
} catch (err) {
  console.error("Error checking for mediaPath", err);
}

client.query(`TRUNCATE audiobooks;`);
client.query(`ALTER SEQUENCE audiobooks_id_seq RESTART WITH 1`);

rimraf.sync(`${COVERS_DIR}/*`);

const files = recursvie(mediaPath, (err, files) => {
  const targetFiles = files.filter(file => {
    return path.extname(file).toLowerCase() === ext;
  });

  let promises = [];
  let p2 = null;
  targetFiles.forEach(f => {
    let p = mm
      .parseFile(f, { native: true })
      .then(async metadata => {
        // console.log(util.inspect(metadata, { showHidden: true, depth: null }));
        let duration = metadata.format.duration;
        // console.log('duration', duration);
        let title = metadata.common.title;
        // console.log("title", title);
        let obj = metadata.common;
        obj.file = f;
        obj.slug = slug(title, { lower: true });
        let cover = `${COVERS_DIR}/${obj.slug}.jpg`;
        try {
          fs.writeFileSync(cover, metadata.common.picture[0].data);
        } catch (err) {
          console.log("Could not write cover image for ", f, err);
        }
        obj.picture = cover;
        audiobooks.push(metadata.common);
        let sql = `INSERT INTO audiobooks(title, subtitle, slug, year, author, copyright, cover, file, duration) 
          VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9);`;

        const query = {
          text: sql,
          values: [
            obj.title,
            obj.subtitle,
            obj.slug,
            obj.year || null,
            obj.artist,
            obj.copyright || null,
            cover,
            obj.file,
            duration
          ]
        };

        // promise
        await client
          .query(query)
          .then(res => {})
          .catch(e => console.error("error adding row", e.stack));
      })
      .catch(err => {
        console.error("Error parsing media file:", err, f);
      });
    promises.push(p);
  });

  Promise.all(promises).then(() => {
    audiobooks.sort((a, b) => (a.title > b.title ? 1 : -1));
    fs.writeFileSync("audiobooks.json", JSON.stringify(audiobooks, null, 2));
    client.end();
    console.log("\ncomplete");
  });
});
