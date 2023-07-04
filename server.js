const http = require("http");
const fs = require("fs");

// Create a server
const server = http.createServer((req, res) => {
  if (req.method === "POST") {
    let body = "";

    // Collect data from the request
    req.on("data", (chunk) => {
      body += chunk;
    });

    // Process the collected data
    req.on("end", () => {
      // Write the data to a file
      const data = decodeURIComponent(body);

      const participant = "Dummy";
      const formattedDateTime = Date.now().toLocaleString("sv-SE", {
        timeZone: "Europe/Stockholm",
      });
      console.log(`Current date and time in Stockholm: ${formattedDateTime}`);

      const fileName = participant + "_" + formattedDateTime + "_results.txt";
      fs.writeFile(fileName, data, (err) => {
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
