// Checks for the talk rating feature (issue 01).
export default [
  ["create rated feedback", "POST", "/feedback", { talkId: "rated", author: "verify", comment: "good", rating: 4 }, 201, (b) => b.rating === 4],
  ["create rated feedback 2", "POST", "/feedback", { talkId: "rated", author: "verify", comment: "great", rating: 5 }, 201, (b) => b.rating === 5],
  ["reject rating 6", "POST", "/feedback", { talkId: "rated", author: "verify", comment: "x", rating: 6 }, 400, () => true],
  ["talk rating average", "GET", "/talks/rated/rating", undefined, 200, (b) => b.average === 4.5 && b.count === 2],
  ["talk without ratings", "GET", "/talks/none/rating", undefined, 200, (b) => b.average === null && b.count === 0],
];
