// In this file you can configure migrate-mongo

const dotenv = require("dotenv");
dotenv.config();

const uri = process.env.DATABASE_URI;
const url = uri.match(/(mongodb:\/\/.+)\//)[1];
const databaseName = uri.match(/\/([^/]+)$/)[1];

const config = {
  mongodb: {
    url,
    databaseName,
    options: {
      // useNewUrlParser: true, // removes a deprecation warning when connecting
      // useUnifiedTopology: true, // removes a deprecating warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    },
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "migratemongo-changelog",

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: ".js",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  // Don't change this, unless you know what you're doing
  moduleSystem: "commonjs",
};

module.exports = config;
