export const makePlan = (topics, dueDateISO, pace = "normal") => {
  const due = new Date(dueDateISO);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.max(1, Math.ceil((due - today) / (1000 * 60 * 60 * 24)));
  const factor = pace === "slow" ? 0.8 : pace === "fast" ? 1.3 : 1.0;

  // distribute topics evenly across days
  const sessions = [];
  topics.forEach((t, i) => {
    const day = new Date(today.getTime());
    day.setDate(today.getDate() + (i % days));
    sessions.push({
      topic: t._id,
      dateISO: day.toISOString(),
      minutes: Math.max(3, Math.round(t.estMinutes * factor)),
    });
  });
  return sessions.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));
};
