async function testApi() {
  const url = "http://localhost:3001/api/astrology/chat";
  const body = {
    question: "Jupiter has moved from my lagna house to my 2nd house and also Venus is going to join Jupiter in a day or two. How's that going to be ?",
    email: "rahul.telang@hotmail.com"
  };

  console.log("Sending request to:", url);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Request failed:", err);
  }
}

testApi();
