const fs = require("fs");
const path = require("path");

const resultsFolderPath = "./broom_results";
const outputFile = "./combined.txt";

// Read all files in the results folder
fs.readdir(resultsFolderPath, (err, files) => {
  if (err) {
    console.error("Error reading the results directory:", err);
    return;
  }

  let combinedData = "";
  let isFirstFile = true;

  // Go through each file
  for (let file of files) {
    // Ensure it's a text file
    if (path.extname(file) === ".txt") {
      const content = fs.readFileSync(
        path.join(resultsFolderPath, file),
        "utf8"
      );
      const lines = content.split("\n");

      // Get the prefix from the filename
      const prefix = file.split("_")[0];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i]) {
          // Ensure the line isn't empty
          if (i === 0 && isFirstFile) {
            combinedData += "participant," + lines[i] + "\n";
            isFirstFile = false;
            continue; // Jump to the next iteration of the loop
          } else if (i === 0) {
            continue; // Skip the first row for all but the first file
          }
          combinedData += prefix + "," + lines[i] + "\n";
        }
      }
    }
  }

  // Write combined data to the output file
  fs.writeFileSync(outputFile, combinedData, "utf8", (writeErr) => {
    if (writeErr) {
      console.error("Error writing to the combined file:", writeErr);
    } else {
      console.log("Data successfully combined and saved!");
    }
  });
});
