const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Directory containing the files
const directoryPath = './broom_results';

// Function to calculate the mean
function calculateMean(arr) {
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
}

// Function to calculate the standard deviation
function calculateStandardDeviation(arr) {
    const mean = calculateMean(arr);
    const squareDiffs = arr.map(val => Math.pow(val - mean, 2));
    const avgSquareDiff = calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

// Function to process each file
function processFile(filePath) {
    return new Promise((resolve, reject) => {
        const uniqueValues = { sharpness: new Set() };
        let lastRowTime = null;
        let lastRowDistance = null;
        let secondRowDistance = null;
        let rowIndex = 0;
        let trueHits = 0;
        let times = [];
        let headers = [];

        const readStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: readStream,
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            const values = line.split(',');

            if (headers.length === 0) {
                headers = values; // First line is the header
            } else {
                // Create an object mapping headers to their respective values
                const row = headers.reduce((acc, header, index) => {
                    acc[header] = values[index];
                    return acc;
                }, {});

                // Track the time values for calculating mean and standard deviation
                const timeValue = parseFloat(row.time);
                times.push(timeValue);

                // Add unique values to the sharpness category
                if (row.sharpness) {
                    uniqueValues.sharpness.add(row.sharpness);
                }

                // Count the number of 'True' in the hits column
                if (row.hit === 'True') {
                    trueHits++;
                }

                // Track the time and traveldistance for the last row and the second row
                lastRowTime = timeValue;
                if (rowIndex === 1) {
                    secondRowDistance = parseFloat(row.traveldistance);
                }
                lastRowDistance = parseFloat(row.traveldistance);
            }
            rowIndex++;
        });

        rl.on('close', () => {
            const travelDistanceInMeters = lastRowDistance - secondRowDistance;
            const result = {
                filename: path.basename(filePath),
                time: lastRowTime,
                sharpnessUniqueCount: uniqueValues.sharpness.size,
                distance: travelDistanceInMeters,
                trueHits: trueHits,
                times: times
            };
            resolve(result);
        });

        rl.on('error', reject);
    });
}

// Function to process all files in the directory
async function processDirectory() {
    try {
        const files = fs.readdirSync(directoryPath);
        const results = [];

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            if (path.extname(file) === '.txt') {
                const result = await processFile(filePath);
                results.push(result);
            }
        }

        // Sort the results by time (ascending)
        results.sort((a, b) => a.time - b.time);

        // Calculate overall statistics
        const allTimes = results.flatMap(result => result.times);
        const allTrueHits = results.map(result => result.trueHits);
        const allDistances = results.map(result => result.distance);

        const averageTime = calculateMean(allTimes);
        const stdDevTime = calculateStandardDeviation(allTimes);

        const averageTrueHits = calculateMean(allTrueHits);
        const stdDevTrueHits = calculateStandardDeviation(allTrueHits);

        const averageDistance = calculateMean(allDistances);
        const stdDevDistance = calculateStandardDeviation(allDistances);

        // Group by sharpnessUniqueCount and calculate statistics for each group
        const sharpnessGroups = {};
        results.forEach(result => {
            const count = result.sharpnessUniqueCount;
            if (!sharpnessGroups[count]) {
                sharpnessGroups[count] = {
                    times: [],
                    trueHits: [],
                    distances: []
                };
            }
            sharpnessGroups[count].times.push(...result.times);
            sharpnessGroups[count].trueHits.push(result.trueHits);
            sharpnessGroups[count].distances.push(result.distance);
        });

        // Print the results
        console.log('File Rankings Based on Time (Shortest Time First):');
        results.forEach((result, index) => {
            console.log(
                `${index + 1}. File: ${result.filename}, Time: ${result.time}, Distance: ${result.distance.toFixed(2)} m, Unique Sharpness Options: ${result.sharpnessUniqueCount}`
            );
        });

        console.log('\nOverall Statistics:');
        console.log(`Average Time: ${averageTime.toFixed(2)}, Standard Deviation: ${stdDevTime.toFixed(2)}`);
        console.log(`Average True Hits: ${averageTrueHits.toFixed(2)}, Standard Deviation: ${stdDevTrueHits.toFixed(2)}`);
        console.log(`Average Distance: ${averageDistance.toFixed(2)} m, Standard Deviation: ${stdDevDistance.toFixed(2)} m`);

        console.log('\nStatistics by Sharpness Unique Count:');
        Object.keys(sharpnessGroups).forEach(count => {
            const group = sharpnessGroups[count];
            const avgTime = calculateMean(group.times);
            const stdDevTime = calculateStandardDeviation(group.times);
            const avgTrueHits = calculateMean(group.trueHits);
            const stdDevTrueHits = calculateStandardDeviation(group.trueHits);
            const avgDistance = calculateMean(group.distances);
            const stdDevDistance = calculateStandardDeviation(group.distances);

            console.log(`\nSharpness Unique Count: ${count}`);
            console.log(`  Average Time: ${avgTime.toFixed(2)}, Standard Deviation: ${stdDevTime.toFixed(2)}`);
            console.log(`  Average True Hits: ${avgTrueHits.toFixed(2)}, Standard Deviation: ${stdDevTrueHits.toFixed(2)}`);
            console.log(`  Average Distance: ${avgDistance.toFixed(2)} m, Standard Deviation: ${stdDevDistance.toFixed(2)} m`);
        });
    } catch (err) {
        console.error('Error processing files:', err);
    }
}

// Start processing the directory
processDirectory();
