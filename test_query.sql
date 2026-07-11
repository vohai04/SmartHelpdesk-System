SELECT "Id", "Title", "IsAiTriaged", "Priority", "AiSentiment", left("AiSummary", 30) as Summary FROM "Tickets" ORDER BY "CreatedAt" DESC LIMIT 3;
