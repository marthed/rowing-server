const nmap = require("node-nmap");

nmap.nmapLocation = "nmap";

console.log("Start quickscan");

const quickScan = new nmap.QuickScan("255.255.255.0/24");

console.log("quickscan created");

quickScan.on("complete", (res) => {
  console.log(res);
});

quickScan.on("error", (err) => {
  console.log(err);
});

quickScan.startScan();
