const os = require('os');

function SetupOculus(socket, oculusServer, oculusPort) {

  const networkInterfaces = os.networkInterfaces();

  let myServerAddress = "";


  for (const interfaceName in networkInterfaces) {
    for (const network of networkInterfaces[interfaceName]) {
      if (network.family === 'IPv4' && !network.internal) {
        myServerAddress = network.address.replace(/[^0-9.]/g, '')
      }
    }
  }
  
  console.log('Your IP Address:', myServerAddress);
  
  socket.send(
    `ip;${myServerAddress}`,
    oculusPort,
    oculusServer,
    (error) => {
      if (error) {
        console.error("Error while sending UDP message:", error);
      } else {
        console.log(
          `UDP message to Oculus sent with this server ip: ${myServerAddress} `
        );
      }
    }
  );
}

module.exports = SetupOculus;