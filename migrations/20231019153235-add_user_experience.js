module.exports = {
  async up(db, client) {
    const users = await db.collection("users");

    await users.updateMany(
      {
        experience: { $exists: false },
      },
      {
        $set: { experience: 0 },
      }
    );
  },

  async down(db, client) {
    const users = await db.collection("users");

    await users.updateMany(
      {
        experience: { $exists: true },
      },
      {
        $unset: { experience: 1 },
      }
    );
  },
};
