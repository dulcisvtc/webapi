module.exports = {
  async up(db, client) {
    const Jobs = db.collection("jobs");

    const jobs = await Jobs.find({}).toArray();

    for (const job of jobs) {
      job.source = {};
      if (job.job_id) {
        job.source.id = job.job_id;
        job.source.name = "navio";

        delete job.job_id;
      } else if (job.ts_job_id) {
        job.source.id = job.ts_job_id;
        job.source.name = "tracksim";

        delete job.ts_job_id;
      }

      await Jobs.updateOne({ _id: job._id }, { $set: job });
    }
  },

  async down(db, client) {},
};
