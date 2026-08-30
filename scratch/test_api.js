async function test() {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/astrology/chart?email=rahul.telang@hotmail.com');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Error:", e);
  }
}
test();
