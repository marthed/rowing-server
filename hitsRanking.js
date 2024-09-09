const fs = require("fs");
const path = require("path");

const resultsFolderPath = "./broom_results";

// Function to convert seconds to minutes and seconds format
function toMinutesAndSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds - minutes * 60);
  return `${minutes}m ${remainingSeconds}s`;
}

async function GenerateHighscores() {
  return new Promise((res, rej) => {
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

          const methodIndex = labels.findIndex((label) => label === "steering_method");
          const modeIndex = labels.findIndex((label) => label === "speed_method");
          const hitIndex = labels.findIndex((label) => label === "hit");
          const timeIndex = labels.findIndex((label) => label === "time");

          if (
            lines.length < 2 ||
            methodIndex === -1 ||
            modeIndex === -1 ||
            hitIndex === -1 ||
            timeIndex === -1
          ) {
            console.warn(`Warning: Skipping file ${file} due to missing data.`);
            continue;
          }

          const secondToLastRow = lines[lines.length - 2].split(",");
          const method = secondToLastRow[methodIndex];
          const mode = secondToLastRow[modeIndex];

          // Count the number of 'True' values in the hit column
          const hitCount = lines.slice(1).reduce((acc, row) => {
            const hitValue = row.split(",")[hitIndex];
            return acc + (hitValue === "True" ? 1 : 0); // Capitalized 'True'
          }, 0);

          const time = parseFloat(secondToLastRow[timeIndex]);
          const participant = file.split("_")[0];

          participantData.push({
            participant,
            method,
            mode,
            hitCount,
            time,
          });
        }
      }

      // Generate rankings for each method and mode based on hit counts and time
      let rankingMap = {};
      for (const data of participantData) {
        const key = `${data.method}-${data.mode}`; // Use '-' instead of '_'
        if (!rankingMap[key]) rankingMap[key] = [];
        rankingMap[key].push(data);
      }

      let allScores = {};

      for (const key in rankingMap) {
        const [methodValue, modeValue] = key.split("-"); // Split with '-'
        console.log(
          `Ranking for method: ${methodValue} and mode: ${modeValue}`
        );

        const sortedRankings = rankingMap[key].sort(
          (a, b) => b.hitCount - a.hitCount || a.time - b.time
        ); // Rank by hitCount, then by time

        sortedRankings.forEach((data, idx) => {
          console.log(
            `${idx + 1}. ${data.participant} with ${
              data.hitCount
            } hits and time ${toMinutesAndSeconds(data.time)}`
          );
        });

        allScores[key] = sortedRankings;

        // Compute and print mean hit count and mean time
        const totalHits = sortedRankings.reduce(
          (acc, entry) => acc + entry.hitCount,
          0
        );
        const totalTimes = sortedRankings.reduce(
          (acc, entry) => acc + entry.time,
          0
        );
        const meanHits = totalHits / sortedRankings.length;
        const meanTime = totalTimes / sortedRankings.length;
        console.log(
          `Mean hits: ${meanHits.toFixed(2)}, Mean time: ${toMinutesAndSeconds(
            meanTime
          )}`
        );
        console.log("\n");
      }
      res(allScores);
    });
  });
}


GenerateHighscores();
// module.exports = {
//   GenerateHighscores,
// };
