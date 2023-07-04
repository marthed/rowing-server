const http = require("http");
const fs = require("fs");
const moment = require("moment");

const timezone = "Europe/Stockholm";
const participant = "Dummy";

const server = http.createServer((req, res) => {
  if (req.method === "POST") {
    let body = "";

    // Collect data from the request
    req.on("data", (chunk) => {
      body += chunk;
    });

    // Process the collected data
    req.on("end", () => {
      const data = decodeURIComponent(body);

      const formattedDateTime = moment
        .utc()
        .local()
        .format("YYYY-MM-DD HH:mm:ss");

      const fileName = participant + "_" + formattedDateTime + "_results.txt";
      fs.writeFile("results/" + fileName, data, (err) => {
        if (err) {
          console.error(err);
          res.statusCode = 500;
          res.end("Error writing to file");
        } else {
          res.statusCode = 200;
          res.end("Data written to file");
        }
      });
    });
  } else {
    // Handle other HTTP methods
    res.statusCode = 404;
    res.end("Invalid request");
  }
});

// Start the server on port 3000
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
