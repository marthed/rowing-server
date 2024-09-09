const fs = require("fs");
const path = require("path");

const resultsFolderPath = "./broom_results";

let participantData = [];
let totalScores = {}; // To keep track of total scores across all categories

function toMinutesAndSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds - minutes * 60);
  return `${minutes}m ${remainingSeconds}s`;
}

async function GenerateHighscores() {
  return new Promise((res, rej) => {
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

      let rankingMap = {};
      for (const data of participantData) {
        const key = `${data.method}-${data.mode}`;
        if (!rankingMap[key]) rankingMap[key] = [];
        rankingMap[key].push(data);
      }

      for (const key in rankingMap) {
        const [methodValue, modeValue] = key.split("-");
        console.log(
          `Ranking for method: ${methodValue} and mode: ${modeValue}`
        );

        const sortedRankings = rankingMap[key].sort(
          (a, b) => b.hitCount - a.hitCount || a.time - b.time
        );

        // Assign ranking-based points: 23 points for best ranked, 0 for worst
        const maxPoints = 23;
        sortedRankings.forEach((data, idx) => {
          data.points = maxPoints - idx; // Assuming idx starts from 0

          // Add points to the total score of the participant
          if (!totalScores[data.participant]) {
            totalScores[data.participant] = 0;
          }
          totalScores[data.participant] += data.points;
        });

        // sortedRankings.forEach((data, idx) => {
        //   console.log(
        //     `${idx + 1}. ${data.participant} with ${
        //       data.hitCount
        //     } hits and time ${toMinutesAndSeconds(data.time)} (Points: ${
        //       data.points
        //     })`
        //   );
        // });

        // ... (Mean hits and mean time calculation, if you still want that)
      }

      // Convert totalScores object to array
      const totalScoresArray = Object.keys(totalScores).map((participant) => {
        return {
          participant,
          score: totalScores[participant],
        };
      });

      // Sort the array based on score in descending order
      const sortedTotalScoresArray = totalScoresArray.sort(
        (a, b) => b.score - a.score
      );

      // Log sorted total scores
      console.log("\nSorted Total Scores Across All Categories:");
      sortedTotalScoresArray.forEach((entry, idx) => {
        console.log(`${idx + 1}. ${entry.participant}: ${entry.score} points`);
      });
      res(sortedTotalScoresArray);
    });
  });
}

GenerateHighscores();
// module.exports = {
//   GenerateHighscores,
// };
