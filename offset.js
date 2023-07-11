const hej = [
  -0.0006, 0.0049, 0.0024, -0.0012, 0.0049, 0.0024, 0.0, 0.0043, 0.0024, 0.0,
  0.0043, 0.0024, 0.0, 0.0043, 0.0024, -0.0006, 0.0043, 0.0024, -0.0012, 0.0049,
  0.0024, -0.0031, 0.0049, 0.0024, -0.0079, 0.0104, 0.0122, -0.0006, 0.0043,
  0.0024, -0.0018, 0.0049, 0.0024, -0.0012, 0.0043, 0.0018,
];

let nextValue = "x";

let x = 0;
let y = 0;
let z = 0;

hej.forEach((value, i) => {
  switch (nextValue) {
    case "x":
      x += value;
      nextValue = "y";
      break;
    case "y":
      y += value;
      nextValue = "z";
      break;
    case "z":
      z += value;
      nextValue = "x";
      break;
  }
});

console.log("X: " + x / (hej.length / 3));
console.log("Y: " + y / (hej.length / 3));
console.log("Z: " + z / (hej.length / 3));
