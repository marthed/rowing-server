

/* ### BEFORE EXPERIMENT, SET ADRESS AND PARTICIPANT NUMBER  ### */
const unityServerAddress = "192.168.48.214"; // For the headset or machine running oculus link
let participant = "P20";

/* ### */ 


const http = require("http");
const fs = require("fs");
const moment = require("moment");
const dgram = require("dgram");
//const { GenerateHighscores } = require("./hitsRanking.js");
const os = require("os");

const serverPort = 1234;

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
console.log("Unity application IP Address: ", unityServerAddress);

const timezone = "Europe/Stockholm";

const routeMap = {
  "/": "static/index.html",
  "/scores": "static/scores.html",
};

const prefixMapping = {
  "/speed": "sp",
  "/steering": "st",
  "/next": "gs",
  "/track": "tk",
  "/inverted": "in",
  "/info": "if",
  "/toggleMenu": "tm",
  "/toggleLocomotion": "tl",
};

const codeMappings = {
  controller_speed: 100,
  headset_speed: 200,
  controller_steer: 300,
  headset_steer: 400,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
};

let currentGameState = "";

const socket = dgram.createSocket("udp4");

// Close the socket when finished
socket.on("close", () => {
  console.log("Socket closed");
});

// Handle any socket errors
socket.on("error", (error) => {
  console.error("Socket error:", error);
});

socket.send(
  `ip;${myServerAddress}`,
  serverPort,
  unityServerAddress,
  (error) => {
    if (error) {
      console.error("Error while sending UDP message:", error);
    } else {
      console.log(
        `UDP message with ip: ${myServerAddress} sent successfully!`
      );
    }
  }
);

async function HandleGET(req, res) {
  if (routeMap[req.url]) {
    fs.readFile(routeMap[req.url], (error, data) => {
      if (error) {
        console.log(error);
        res.end();
        return;
      }
      res.writeHead(200, {
        "Content-Type": "text/html",
      });

      res.write(data);
      res.end();
    });
  } else if (req.url === "/state") {
    res.setHeader("Content-Type", "application/json");
    //res.writeHead(200);
    res.end(currentGameState);
  } else if (req.url === "/highscores") {
    try {
      console.log("GET SCORES");
      const scores = await GenerateHighscores();
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(scores));
    } catch (error) {
      console.log(error);
    }
  }
  else if (req.url === "/info") {
    try {
      console.log("Get info from unity application...");
      socket.send(
        `${prefixMapping[req.url]}`,
        serverPort,
        unityServerAddress,
        (error) => {
          if (error) {
            console.error("Error while sending UDP message:", error);
          } else {
            console.log(
              "UDP message with info request sent successfully"
            );
          }
        }
      );
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end("GET request received successfully!");
    } catch (error) {
      console.log(error);
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/plain");
      res.end("Error");
    }
  }  
  else {
    res.end("<h1>Sorry, page not found</h1>");
  }
}

async function HandlePOST(req, res) {
  try {
    console.log("Incoming post request: " + req.url);
    if (
      req.url === "/speed" ||
      req.url === "/steering" ||
      req.url === "/track"
    ) {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        try {
          const data = decodeURIComponent(body);
          const jsonData = JSON.parse(data);
          console.log("Received JSON data:", jsonData);

          socket.send(
            `${prefixMapping[req.url]};${codeMappings[jsonData.value]}`,
            serverPort,
            unityServerAddress,
            (error) => {
              if (error) {
                console.error("Error while sending UDP message:", error);
              } else {
                console.log(
                  "UDP message with: " + jsonData.value + " sent successfully!"
                );
              }
            }
          );

          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("POST request received successfully!");
        } catch (error) {
          console.log(error);
          res.statusCode = 400;
          res.setHeader("Content-Type", "text/plain");
          res.end("Error parsing JSON data");
        }
      });
      return;
    } else if (req.url === "/next" || req.url === "/inverted" || req.url === "/toggleMenu" || req.url === "/toggleLocomotion") {
      socket.send(
        `${prefixMapping[req.url]}`,
        serverPort,
        unityServerAddress,
        (error) => {
          if (error) {
            console.error("Error while sending UDP message:", error);
          } else {
            console.log(
              `UDP message with ${
                prefixMapping[req.url]
              } sent to ${unityServerAddress}:${serverPort}`
            );
          }
        }
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end("POST request received successfully!");
      return;
    } else if (req.url === "/state") {
      console.log("Current state received");

      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        try {
          const data = decodeURIComponent(body);

          console.log("Current game state: " + data);
          currentGameState = data;

          //const stateData = data.split(";");

          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.end("POST request received successfully!");
        } catch (error) {
          console.log(error);
          res.statusCode = 400;
          res.setHeader("Content-Type", "text/plain");
          res.end("Error parsing JSON data");
        }
      });
      return;
    } else if (req.url === "/trail") {
      let body = "";
      // Collect data from the request
      req.on("data", (chunk) => {
        body += chunk;
      });

      // Process the collected data
      req.on("end", () => {
        console.log("Data received");
        const data = decodeURIComponent(body);

        const formattedDateTime = moment
          .utc()
          .local()
          .format("YYYY-MM-DD HH:mm:ss").replace(/[- :]/g, '_')

        const fileName = participant + "_" + formattedDateTime + "_results.txt";

        console.log("Writing: " + fileName + " to disk...");
        fs.writeFile("broom_results/" + fileName, data, (err) => {
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end("Error writing to file");
          } else {
            console.log("Complete");
            res.statusCode = 200;
            res.end("Data written to file");
          }
        });
      });
    } else if (req.url === "/participant") {
      let body = "";
      // Collect data from the request
      req.on("data", (chunk) => {
        body += chunk;
      });

      // Process the collected data
      req.on("end", () => {
        console.log("Data received");
        const data = decodeURIComponent(body);
        const { value } = JSON.parse(data);

        console.log("Setting new participant name: ", value);

        participant = value;

        res.statusCode = 200;
        res.end("Participant name updated");
      });
    }
    else if (req.url === "/info") {
      let body = "";
      // Collect data from the request
      req.on("data", (chunk) => {
        body += chunk;
      });

      // Process the collected data
      req.on("end", () => {
        console.log("Data received");
        const data = decodeURIComponent(body);
        const [speed, steering, track, state] = data.split(";");

        console.log(`Selected speed method: ${speed}`);
        console.log(`Selected steering method: ${steering}`);
        console.log(`Selected track: ${track}`);
        console.log(`Current state: ${state}`);
        
        res.statusCode = 200;
        res.end("Participant name updated");
      });
    }
  }
   catch (e) {
    console.log(e);
  }
}

const server = http.createServer((req, res) => {
  console.log("\n Incoming request...");
  console.log("Current participant: ", participant);

  if (req.method === "GET") {
    HandleGET(req, res);
  } else if (req.method === "POST") {
    HandlePOST(req, res);
  } else {
    res.writeHead(404);
    res.end("Invalid request");
  }
});

// Start the server on port 3000
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
