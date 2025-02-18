const mdns = require('mdns');
const http = require("http");

//Set up an mDNS browser for HTTP services (or adjust for your service type)

function SetupArduino(oculusIp) {
  console.log("Send oculus ip to Arduino...")
  const browser = mdns.createBrowser(mdns.tcp('http'));

  browser.on('serviceUp', function (service) {
    console.log("Service Found: ", service);
    if (service.name === 'rowing_hands') {
      console.log(`Found Arduino at ${service.addresses[0]}:${service.port}`);
      
      let data = "";
      const req = http.request({ hostname: service.host, port: service.port, path: "/", method: "POST", headers: {
        'Content-Type': 'text/plain',                  // Set the content type as plain text
        'Content-Length': Buffer.byteLength(oculusIp)  // Set the content length
      } }, (res) => {
        console.log(`Status Code: ${res.statusCode}`); // Print the status code
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('No more data in response.');
          console.log(data);
        });
      });

      req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
      });

      req.write(`@${oculusIp}`);
      console.log("Sent request to ", req);
      req.end();
      }
  });


  browser.on('serviceDown', function (service) {
    console.log("Service Down: ", service);
  });

  // Start the mDNS browser
  browser.start();
}
module.exports = SetupArduino;

