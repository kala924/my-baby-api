const replies = {};
const teachers = {};

function getReply(text) {
  const key = text.toLowerCase().trim();
  if (replies[key]) {
    const list = replies[key];
    return list[Math.floor(Math.random() * list.length)];
  }
  return "আমি এখনো এটা শিখিনি 🥺 আমাকে শেখাও!";
}

module.exports = (req, res) => {
  const { text, teach, reply, remove, index, list, edit, replace, senderID } = req.query;

  if (teach && reply) {
    const key = teach.toLowerCase().trim();
    const replyList = reply.split(",").map(r => r.trim());
    if (!replies[key]) replies[key] = [];
    replies[key].push(...replyList);
    if (senderID) teachers[senderID] = (teachers[senderID] || 0) + replyList.length;
    return res.json({ message: `✅ ${replyList.length}টা reply শেখানো হয়েছে!`, teachs: replies[key].length });
  }

  if (remove) {
    const key = remove.toLowerCase().trim();
    if (!replies[key]) return res.json({ message: "❌ এই message টা নেই!" });
    if (index !== undefined) {
      const idx = parseInt(index);
      replies[key].splice(idx, 1);
      if (replies[key].length === 0) delete replies[key];
      return res.json({ message: "✅ Reply মুছে ফেলা হয়েছে!" });
    }
    delete replies[key];
    return res.json({ message: "✅ সব reply মুছে ফেলা হয়েছে!" });
  }

  if (edit && replace) {
    const key = edit.toLowerCase().trim();
    if (!replies[key]) return res.json({ message: "❌ এই message টা নেই!" });
    replies[key] = [replace.trim()];
    return res.json({ message: "✅ Reply update করা হয়েছে!" });
  }

  if (list) {
    if (list === "all") {
      const teacherList = Object.entries(teachers).map(([id, count]) => ({ [id]: count }));
      return res.json({ length: Object.keys(replies).length, responseLength: Object.values(replies).flat().length, teacher: { teacherList } });
    }
    const key = list.toLowerCase().trim();
    return res.json({ data: replies[key] ? replies[key].join(", ") : "কোনো reply নেই!" });
  }

  if (text) {
    return res.json({ reply: getReply(text) });
  }

  return res.json({ reply: "Bolo baby! 😊" });
};
