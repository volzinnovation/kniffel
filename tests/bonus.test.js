const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const gamePath = path.join(__dirname, "..", "game.js");
const gameCode = fs.readFileSync(gamePath, "utf8");

const elements = new Map();

global.document = {
  addEventListener: () => {},
  getElementById: (id) => {
    if (!elements.has(id)) {
      elements.set(id, { textContent: "" });
    }
    return elements.get(id);
  },
};

vm.runInThisContext(gameCode);

const categories = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
  "threeOfKind",
  "fourOfKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "yahtzee",
  "chance",
];

function runUpdateWithScores(scores) {
  elements.clear();
  const mockGame = {
    players: [
      { scores: { ...scores }, yahtzeeBonus: 0 },
      { scores: {}, yahtzeeBonus: 0 },
    ],
    categories,
  };

  YahtzeeGame.prototype.updateTotals.call(mockGame);

  return {
    upper: elements.get("p1-upper-subtotal").textContent,
    bonus: elements.get("p1-bonus").textContent,
  };
}

const atThreshold = runUpdateWithScores({
  ones: 3,
  twos: 6,
  threes: 9,
  fours: 12,
  fives: 15,
  sixes: 18,
});

assert.strictEqual(atThreshold.upper, 63);
assert.strictEqual(atThreshold.bonus, 35);

const belowThreshold = runUpdateWithScores({
  ones: 3,
  twos: 6,
  threes: 9,
  fours: 12,
  fives: 15,
  sixes: 17,
});

assert.strictEqual(belowThreshold.upper, 62);
assert.strictEqual(belowThreshold.bonus, 0);

console.log("Upper subtotal bonus tests passed.");
