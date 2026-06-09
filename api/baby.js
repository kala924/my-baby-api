const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "babybot";
const COLLECTION = "replies";

let client;
async function getDB() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db(DB_NAME).collection(COLLECTION);
}

module.exports = async (req, res) => {
  const { text, teach, reply, remove, index, list, edit, replace, senderID } = req.query;

  try {
    const col = await getDB();

    // Teach
    if (teach && reply) {
      const key = teach.toLowerCase().trim();
      const replyList = reply.split(",").map(r => r.trim());
      await col.updateOne(
        { key },
        {
          $push: { replies: { $each: replyList } },
          $inc: { [`teachers.${senderID}`]: replyList.length }
        },
        { upsert: true }
      );
      const doc = await col.findOne({ key });
      return res.json({ message: `✅ ${replyList.length}টা reply শেখানো হয়েছে!`, teachs: doc.replies.length });
    }

    // Remove
    if (remove) {
      const key = remove.toLowerCase().trim();
      const doc = await col.findOne({ key });
      if (!doc) return res.json({ message: "❌ এই message টা নেই!" });
      if (index !== undefined) {
        const idx = parseInt(index);
        doc.replies.splice(idx, 1);
        if (doc.replies.length === 0) {
          await col.deleteOne({ key });
        } else {
          await col.updateOne({ key }, { $set: { replies: doc.replies } });
        }
        return res.json({ message: "✅ Reply মুছে ফেলা হয়েছে!" });
      }
      await col.deleteOne({ key });
      return res.json({ message: "✅ সব reply মুছে ফেলা হয়েছে!" });
    }

    // Edit
    if (edit && replace) {
      const key = edit.toLowerCase().trim();
      const doc = await col.findOne({ key });
      if (!doc) return res.json({ message: "❌ এই message টা নেই!" });
      await col.updateOne({ key }, { $set: { replies: [replace.trim()] } });
      return res.json({ message: "✅ Reply update করা হয়েছে!" });
    }

    // List
    if (list) {
      if (list === "all") {
        const count = await col.countDocuments();
        const all = await col.find({}).toArray();
        const totalReplies = all.reduce((acc, d) => acc + (d.replies?.length || 0), 0);
        const teacherMap = {};
        all.forEach(d => {
          if (d.teachers) {
            Object.entries(d.teachers).forEach(([id, cnt]) => {
              teacherMap[id] = (teacherMap[id] || 0) + cnt;
            });
          }
        });
        const teacherList = Object.entries(teacherMap).map(([id, cnt]) => ({ [id]: cnt }));
        return res.json({ length: count, responseLength: totalReplies, teacher: { teacherList } });
      }
      const key = list.toLowerCase().trim();
      const doc = await col.findOne({ key });
      return res.json({ data: doc ? doc.replies.join(", ") : "কোনো reply নেই!" });
    }

    // Chat reply
    if (text) {
      const key = text.toLowerCase().trim();
      const doc = await col.findOne({ key });
      if (doc && doc.replies.length > 0) {
        const r = doc.replies[Math.floor(Math.random() * doc.replies.length)];
        return res.json({ reply: r });
      }
      return res.json({ reply: "আমি এখনো এটা শিখিনি 🥺 আমাকে শেখাও!" });
    }

    return res.json({ reply: "Bolo baby! 😊" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ reply: "Error: " + err.message });
  }
};
