import Topic from "../models/Topic.js";
import StudyPlan from "../models/StudyPlan.js";
import { makePlan } from "../services/plan.service.js";

export const createPlan = async (req, res) => {
  const { documentId, topicIds, dueDateISO, pace = "normal" } = req.body;
  const topics = await Topic.find({
    _id: { $in: topicIds },
    document: documentId,
  }).sort({ order: 1 });
  const sessions = makePlan(topics, dueDateISO, pace);
  const plan = await StudyPlan.create({
    owner: req.user.sub,
    document: documentId,
    sessions,
    dueDateISO,
  });
  res.json(plan);
};

export const myPlans = async (req, res) => {
  const plans = await StudyPlan.find({ owner: req.user.sub })
    .sort({ createdAt: -1 })
    .populate("document");
  res.json(plans);
};
