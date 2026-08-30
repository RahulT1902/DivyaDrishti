const http = require('https');

const url = 'https://divya-drishti-eight.vercel.app/api/predictions/analyze?timeframe=today&domain=career&mode=hi';

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Success:', json.success);
      console.log('Analysis:', json.predictions.analysis);
      console.log('First Life Domain TitleHindi:', json.predictions.lifeDomainPredictions[0].titleHindi);
      console.log('First Life Domain Narrative:', json.predictions.lifeDomainPredictions[0].narrative);
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      console.log('Raw data:', data.slice(0, 500));
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
