// Bahut simple in-memory rate limiter — extra npm package ki zaroorat nahi.
// Production mein bahut zyada traffic ho to Redis-based limiter better hota hai,
// lekin ek chhoti/medium public site ke liye ye kaafi hai.

module.exports = function rateLimit({ windowMs = 10 * 60 * 1000, max = 20 } = {}) {
  const hits = new Map(); // ip -> [timestamps]

  return function (req, res, next) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const arr = (hits.get(ip) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) {
      return res.status(429).json({ error: 'Bahut zyada requests aa gayi hain, thodi der baad try karo.' });
    }
    arr.push(now);
    hits.set(ip, arr);

    // purani entries occasionally clean karo taaki memory na badhe
    if (hits.size > 5000) {
      for (const [key, times] of hits) {
        if (!times.some(t => now - t < windowMs)) hits.delete(key);
      }
    }
    next();
  };
};
