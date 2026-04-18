app.get("/admin/ai-sentiment", verifyAdmin, async (req, res) => {
  try {
    const [feedbackRows] = await db.promise().query(
      `SELECT feedback_text FROM feedback WHERE feedback_text IS NOT NULL AND TRIM(feedback_text) <> ''`
    );

    const counts = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    feedbackRows.forEach((row) => {
      const feedbackText = String(row.feedback_text || "").trim();
      if (!feedbackText) return;

      try {
        const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(feedbackText);
        const compound = sentiment.compound;

        if (compound >= 0.05) {
          counts.positive += 1;
        } else if (compound <= -0.05) {
          counts.negative += 1;
        } else {
          counts.neutral += 1;
        }
      } catch (error) {
        console.error("Error analyzing sentiment for text:", feedbackText, error); 
        counts.neutral += 1;
      }
    });

    res.json([
      { sentiment: "positive", count: counts.positive },
      { sentiment: "neutral", count: counts.neutral },
      { sentiment: "negative", count: counts.negative },
    ]);
  } catch (err) {
    console.error("AI sentiment error:", err);
    res.status(500).json({ message: "Error fetching sentiment data", error: err.message });
  }
});
 
app.get("/admin/ai-sentiment-details", verifyAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;
    const search = (req.query.search || "").trim();

    let whereClause = "WHERE f.feedback_text IS NOT NULL AND TRIM(f.feedback_text) <> ''";
    const params = [];

    if (search) {
      whereClause += " AND (u.fullname LIKE ? OR f.feedback_text LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.promise().query(`SELECT COUNT(*) AS total FROM feedback f LEFT JOIN users u ON f.user_id = u.id ${whereClause}`, params);
    const total = countResult[0]?.total || 0;

    const [feedbackRows] = await db.promise().query(
      `SELECT f.id, f.booking_id, f.user_id, u.fullname AS customer, f.feedback_text AS feedback, f.rating, f.created_at
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       ${whereClause}
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const details = feedbackRows.map((entry) => {
      const text = (entry.feedback || "").trim();
      let compound = 0;
      let label = "neutral";
      try {
        const sentimentScores = vader.SentimentIntensityAnalyzer.polarity_scores(text);
        compound = sentimentScores.compound;
        if (compound >= 0.05) label = "positive";
        else if (compound <= -0.05) label = "negative";
      } catch (e) {
        console.error("Sentiment analysis error for text:", text, e);
      } 

      return {
        id: entry.id,
        customer: entry.customer || "Unknown",
        feedback: text,
        rating: entry.rating,
        createdAt: entry.created_at,
        sentiment: label,
        sentimentScore: compound,
      };
    });

    res.json({
      data: details,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("AI sentiment details error:", err);
    res.status(500).json({ message: "Error fetching sentiment details", error: err.message });
  }
});