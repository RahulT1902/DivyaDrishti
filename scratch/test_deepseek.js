async function testDeepSeek() {
  const apiKey = "sk-538c4260060940aabf507882328aa72b";
  console.log("Sending chat request to DeepSeek with AbortController timeout...");
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Say hello in 2 words." }],
        max_tokens: 10
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response Text:", text);
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error("Fetch Error: Timeout after 10 seconds.");
    } else {
      console.error("Fetch Error:", err);
    }
  }
}

testDeepSeek();
