const knex = require('knex');
const knexfile = require('../knexfile');

const TABLE_ROLE_MESSAGE = 'role_message';
const TABLE_ROLE_EMOJI = 'role_emoji';

module.exports = {
  db: knex(knexfile),

  TABLE_ROLE_MESSAGE,
  TABLE_ROLE_EMOJI,
};
