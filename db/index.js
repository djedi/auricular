const { Pool } = require("pg");

const connectionString = "postgres://postgres:@postgres:5432/postgres";
const pool = new Pool({
  connectionString: connectionString
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
