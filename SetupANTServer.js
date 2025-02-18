const os = require('os');

const networkInterfaces = os.networkInterfaces();


function SetupANTServer(socket, oculusIp) {

  let localIp = "";

  for (const interfaceName in networkInterfaces) {
    for (const network of networkInterfaces[interfaceName]) {
      if (network.family === 'IPv4' && !network.internal) {
        localIp = network.address.replace(/[^0-9.]/g, '')
      }
    }
  }

  socket.send(
    `ip;${oculusIp}`,
    8080,
    localIp,
    (error) => {
      if (error) {
        console.error("Error while sending UDP message:", error);
      } else {
        console.log(
          "UDP message to ANT+ server with ip: " + oculusIp + " sent successfully!"
        );
      }
    }
  );
}

module.exports = SetupANTServer;