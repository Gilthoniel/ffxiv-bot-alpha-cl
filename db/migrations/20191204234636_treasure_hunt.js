const { TABLE_TREASURE_HUNT } = require('../db');

exports.up = async (knex) => {
  await knex.schema.createTable(TABLE_TREASURE_HUNT, (table) => {
    table.increments('id').primary();
    table.string('guild_id')
      .notNullable();

    table.string('key')
      .notNullable();

    table.string('value')
      .notNullable();

    table.unique(['guild_id', 'key']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists(TABLE_TREASURE_HUNT);
};
