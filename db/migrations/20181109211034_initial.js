const {
  TABLE_ROLE_MESSAGE,
  TABLE_ROLE_EMOJI,
} = require('../db');

exports.up = async (knex) => {
  await knex.schema.createTable(TABLE_ROLE_MESSAGE, (table) => {
    table.string('id').primary();
  });

  await knex.schema.createTable(TABLE_ROLE_EMOJI, (table) => {
    table.increments('id').primary();

    table.string('message_id')
      .references('id')
      .inTable(TABLE_ROLE_MESSAGE)
      .notNullable();

    table.string('role_id').notNullable();
    table.string('emoji_id').notNullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists(TABLE_ROLE_EMOJI);
  await knex.schema.dropTableIfExists(TABLE_ROLE_MESSAGE);
};
