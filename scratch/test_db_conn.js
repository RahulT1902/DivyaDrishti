const net = require("net");

function testConnect(host, port) {
  return new Promise((resolve) => {
    console.log(`Testing connection to ${host}:${port}...`);
    const socket = new net.Socket();
    const startTime = Date.now();

    socket.setTimeout(5000);

    socket.connect(port, host, () => {
      console.log(`SUCCESS: Connected to ${host}:${port} in ${Date.now() - startTime}ms`);
      socket.destroy();
      resolve(true);
    });

    socket.on("error", (err) => {
      console.error(`ERROR: Failed to connect to ${host}:${port} - ${err.message}`);
      socket.destroy();
      resolve(false);
    });

    socket.on("timeout", () => {
      console.error(`TIMEOUT: Connection to ${host}:${port} timed out after 5s`);
      socket.destroy();
      resolve(false);
    });
  });
}

async function run() {
  await testConnect("ep-nameless-cherry-an5srh2z-pooler.c-6.us-east-1.aws.neon.tech", 5432);
  await testConnect("ep-nameless-cherry-an5srh2z.c-6.us-east-1.aws.neon.tech", 5432);
}

run();
