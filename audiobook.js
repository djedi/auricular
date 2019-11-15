const mm = require("music-metadata");
const fs = require("fs");
const slug = require("slug");
const { Client } = require("pg");

const COVERS_DIR = "covers";

module.exports = {
  importFile: async f => {
    if (!fs.existsSync(f)) {
      return false;
    }
    const connectionString = "postgres://postgres:@postgres:5432/postgres";
    const client = new Client({
      connectionString: connectionString
    });
    client.connect();

    return await mm
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

        let sql = `SELECT id FROM audiobooks WHERE title=$1;`;
        let query = { text: sql, values: [obj.title] };
        let foundId = false;
        await client
          .query(query)
          .then(res => {
            // console.log("res", res);
            try {
              foundId = res.rows[0]["id"];
            } catch (err) {}
          })
          .catch(err => {
            console.log("error querying audiobooks:", err);
          });

        console.log("foundId", foundId);
        values = [
          obj.title,
          obj.subtitle,
          obj.slug,
          obj.year || null,
          obj.artist,
          obj.copyright || null,
          cover,
          obj.file,
          duration
        ];
        if (foundId) {
          sql = `UPDATE audiobooks SET title=$1, subtitle=$2, slug=$3, year=$4, author=$5, copyright=$6, cover=$7, file=$8, duration=$9 
            WHERE id=$10 RETURNING id, slug;`;
          values.push(foundId);
        } else {
          sql = `INSERT INTO audiobooks(title, subtitle, slug, year, author, copyright, cover, file, duration) 
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, slug;`;
        }

        query = {
          text: sql,
          values
        };

        return await client
          .query(query)
          .then(res => {
            return res.rows;
          })
          .catch(e => console.error("error adding row", e.stack));
      })
      .catch(err => {
        console.error("Error parsing media file:", err, f);
      })
      .finally(() => {
        client.end();
      });
  }
};
