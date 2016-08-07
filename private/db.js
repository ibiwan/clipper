const util    = require('util');

var db_uri = util.format( 'mongodb://%s:%s@%s:%s/%s',
  process.env.DB_USER, process.env.DB_PASS, process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME
);

module.exports = {
	'url' : db_uri
}
