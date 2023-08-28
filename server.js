const http = require("http");
const fs = require("fs");
const moment = require("moment");
const dgram = require("dgram");

const timezone = "Europe/Stockholm";

const participant = "P8";

const routeMap = {
  "/": "static/index.html",
};

const prefixMapping = {
  "/method": "me",
  "/travel": "tr",
  "/next": "gs",
  "/track": "tk",
  "/inverted": "in",
};

const codeMappings = {
  feet: 100,
  head: 200,
  hand: 300,
  _2D: 400,
  _3D: 500,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
};

let currentGameState = "";

const socket = dgram.createSocket("udp4");

const serverAddress = "192.168.227.218";
const serverPort = 1234;

// Close the socket when finished
socket.on("close", () => {
  console.log("Socket closed");
});

// Handle any socket errors
socket.on("error", (error) => {
  console.error("Socket error:", error);
});

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
  } else {
    res.end("<h1>Sorry, page not found</h1>");
  }
}

async function HandlePOST(req, res) {
  try {
    console.log("Incoming post request: " + req.url);
    if (
      req.url === "/method" ||
      req.url === "/travel" ||
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
            serverAddress,
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
    } else if (req.url === "/next" || req.url === "/inverted") {
      socket.send(
        `${prefixMapping[req.url]}`,
        serverPort,
        serverAddress,
        (error) => {
          if (error) {
            console.error("Error while sending UDP message:", error);
          } else {
            console.log(
              `UDP message with ${
                prefixMapping[req.url]
              } sent to ${serverAddress}:${serverPort}`
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
          .format("YYYY-MM-DD HH:mm:ss");

        const fileName = participant + "_" + formattedDateTime + "_results.txt";

        console.log("Writing: " + fileName + " to disk...");
        fs.writeFile("results/" + fileName, data, (err) => {
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
    }
  } catch (e) {
    console.log(e);
  }
}

const server = http.createServer((req, res) => {
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
