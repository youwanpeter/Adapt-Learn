import VideoRec from "../models/VideoRec.js";

export const getByDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const rec = await VideoRec.findOne({ document: id }).sort({
      createdAt: -1,
    });
    // return OK with an empty array if none found
    return res.status(200).json(rec?.items ?? []);
  } catch (e) {
    return res
      .status(500)
      .json({ message: e.message || "Failed to load videos" });
  }
};
