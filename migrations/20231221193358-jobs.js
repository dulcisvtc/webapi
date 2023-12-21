module.exports = {
  async up(db, client) {
    const Jobs = db.collection("jobs");

    await Jobs.updateMany(
      { job_id: { $exists: true } }, //
      { $rename: { job_id: "source.id" }, $set: { "source.name": "navio" } }
    );
    await Jobs.updateMany(
      { ts_job_id: { $exists: true } },
      { $rename: { ts_job_id: "source.id" }, $set: { "source.name": "tracksim" } }
    );
  },

  async down(db, client) {},
};
