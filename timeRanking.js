const fs = require("fs");
const path = require("path");

const resultsFolderPath = "./results";

let participantData = [];

// Read all files in the results folder
fs.readdir(resultsFolderPath, (err, files) => {
  if (err) {
    console.error("Error reading the results directory:", err);
    return;
  }

  for (let file of files) {
    if (path.extname(file) === ".txt") {
      const content = fs.readFileSync(
        path.join(resultsFolderPath, file),
        "utf8"
      );
      const lines = content.split("\n");

      const labels = lines[0].split(",");

      const methodIndex = labels.findIndex((label) => label === "method");
      const modeIndex = labels.findIndex((label) => label === "mode");
      const timeIndex = labels.findIndex((label) => label === "time");

      if (
        lines.length < 2 ||
        methodIndex === -1 ||
        modeIndex === -1 ||
        timeIndex === -1
      ) {
        console.warn(`Warning: Skipping file ${file} due to missing data.`);
        continue;
      }

      const secondToLastRow = lines[lines.length - 2].split(",");
      const method = secondToLastRow[methodIndex];
      const mode = secondToLastRow[modeIndex];
      const time = parseFloat(secondToLastRow[timeIndex]);
      const participant = file.split("_")[0];

      participantData.push({
        participant,
        method,
        mode,
        time,
      });
    }
  }

  // Generate rankings for each method and mode
  let rankingMap = {};
  for (const data of participantData) {
    const key = `${data.method}_${data.mode}`;
    if (!rankingMap[key]) rankingMap[key] = [];
    rankingMap[key].push(data);
  }

  // for (const key in rankingMap) {
  //   const [methodValue, modeValue] = key.split("_");
  //   console.log(`Ranking for method: ${methodValue} and mode: ${modeValue}`);
  //   rankingMap[key]
  //     .sort((a, b) => a.time - b.time)
  //     .forEach((data, idx) => {
  //       console.log(`${idx + 1}. ${data.participant} ${data.time}s`);
  //     });
  //   console.log("\n");
  // }
});
