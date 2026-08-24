import http from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 8788);

const SUMMARY_TEXT =
  "Mock study summary — photosynthesis converts light energy into chemical energy stored in glucose.";

const QUIZ_PAYLOAD = {
  questions: [
    {
      question: "What is the main output of photosynthesis?",
      options: ["Oxygen", "Glucose", "Carbon dioxide", "ATP"],
      correctIndex: 1,
      explanation: "Photosynthesis stores energy in glucose.",
    },
  ],
};

const CARDS_PAYLOAD = {
  cards: [
    { front: "What is photosynthesis?", back: "The process of converting light into chemical energy." },
  ],
};

function responsesPayload(instructions) {
  let text;
  if (/flashcard/i.test(instructions)) text = JSON.stringify(CARDS_PAYLOAD);
  else if (/quiz/i.test(instructions)) text = JSON.stringify(QUIZ_PAYLOAD);
  else text = SUMMARY_TEXT;
  return {
    id: "chatcmpl_mock",
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "mock",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  };
}

const server = http.createServer(async (req, res) => {
  try {
    let body = "";
    for await (const chunk of req) body += chunk;

    if (req.url.includes("/audio/speech")) {
      const mp3 = Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      res.writeHead(200, { "Content-Type": "audio/mpeg", "Content-Length": mp3.length });
      res.end(mp3);
      return;
    }

    let parsed = {};
    try {
      parsed = JSON.parse(body || "{}");
    } catch {
      /* ignore */
    }
    const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
    const instructions = messages.length > 0 ? messages[0].content : "";
    const payload = responsesPayload(instructions);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
});

server.listen(PORT, () => {
  console.log(`[mock-openai] listening on :${PORT}`);
});