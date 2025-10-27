// ESM
export const ping = (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
};
