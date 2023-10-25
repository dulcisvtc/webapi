module.exports = {
  async up(db, client) {
    const events = await db.collection("events");

    await events.updateMany(
      {},
      {
        $rename: {
          slot_id: "slotId",
          slot_image: "slotImage",
        },
      }
    );
  },

  async down(db, client) {
    const events = await db.collection("events");

    await events.updateMany(
      {},
      {
        $rename: {
          slotId: "slot_id",
          slotImage: "slot_image",
        },
      }
    );
  },
};
