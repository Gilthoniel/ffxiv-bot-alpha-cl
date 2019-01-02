module.exports = {
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: './db/db.sqlite',
  },
  migrations: {
    directory: './db/migrations',
  },
};
