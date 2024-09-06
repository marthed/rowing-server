const fs = require("fs");
const path = require("path");

const resultsFolderPath = "./broom_results";

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

  function toMinutesAndSeconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds - minutes * 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  // Generate rankings for each method and mode
  let rankingMap = {};
  for (const data of participantData) {
    const key = `${data.method}-${data.mode}`;
    if (!rankingMap[key]) rankingMap[key] = [];
    rankingMap[key].push(data);
  }

  for (const key in rankingMap) {
    const [methodValue, modeValue] = key.split("-");
    console.log(`Ranking for method: ${methodValue} and mode: ${modeValue}`);
    const sortedRankings = rankingMap[key].sort((a, b) => a.time - b.time);

    sortedRankings.forEach((data, idx) => {
      console.log(
        `${idx + 1}. ${data.participant} ${toMinutesAndSeconds(data.time)}`
      );
    });

    // Compute and print mean time
    const totalTimes = sortedRankings.reduce(
      (acc, entry) => acc + entry.time,
      0
    );
    const meanTime = totalTimes / sortedRankings.length;
    console.log(`Mean time: ${toMinutesAndSeconds(meanTime)}`);
    console.log("\n");
  }
});
