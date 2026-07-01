const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const gamePath = path.join(__dirname, "..", "game.js");
const gameCode = fs.readFileSync(gamePath, "utf8");

global.document = {
  addEventListener: () => {},
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

function makeCoach({ dice, rollsLeft = 2, scores = {} }) {
  const mockGame = {
    currentPlayer: 0,
    dice,
    rollsLeft,
    players: [{ scores }, { scores: {} }],
    categories,
    getCategoryDisplayName: YahtzeeGame.prototype.getCategoryDisplayName,
  };
  return new YahtzeeCoach(mockGame).analyze();
}

const tripleSixes = makeCoach({ dice: [6, 6, 6, 2, 3] });
assert.strictEqual(tripleSixes.state, "ready");
assert(tripleSixes.summary.includes("points"));
assert.deepStrictEqual(tripleSixes.holds, [true, true, true, false, false]);
assert(tripleSixes.options.some((option) => option.category === "sixes" && option.score === 18));

const straightDraw = makeCoach({ dice: [1, 2, 3, 4, 6] });
assert.strictEqual(straightDraw.holds.filter(Boolean).length, 4);
assert(straightDraw.options.some((option) => option.category === "smallStraight" && option.score === 30));

const waiting = makeCoach({ dice: [0, 0, 0, 0, 0], rollsLeft: 3 });
assert.strictEqual(waiting.state, "waiting");
assert.strictEqual(waiting.options.length, 0);

const noRollsLeft = makeCoach({ dice: [2, 3, 4, 5, 6], rollsLeft: 0 });
assert.deepStrictEqual(noRollsLeft.holds, [true, true, true, true, true]);
assert.strictEqual(noRollsLeft.options[0].category, "largeStraight");

console.log("Coach recommendation tests passed.");
