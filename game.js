// Yahtzee Game - Main JavaScript

class YahtzeeGame {
  constructor() {
    this.players = [
      { name: "Player 1", scores: {}, yahtzeeBonus: 0 },
      { name: "Player 2", scores: {}, yahtzeeBonus: 0 },
    ];
    this.currentPlayer = 0;
    this.dice = [0, 0, 0, 0, 0];
    this.held = [false, false, false, false, false];
    this.rollsLeft = 3;
    this.round = 1;
    this.categories = [
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
    this.init();
  }

  init() {
    // DOM Elements
    this.startScreen = document.getElementById("start-screen");
    this.gameScreen = document.getElementById("game-screen");
    this.startBtn = document.getElementById("start-game-btn");
    this.rollBtn = document.getElementById("roll-btn");
    this.rulesBtn = document.getElementById("rules-btn");
    this.newGameBtn = document.getElementById("new-game-btn");
    this.closeRulesBtn = document.getElementById("close-rules");
    this.playAgainBtn = document.getElementById("play-again-btn");
    this.rulesModal = document.getElementById("rules-modal");
    this.gameoverModal = document.getElementById("gameover-modal");
    this.diceContainer = document.getElementById("dice-container");
    this.currentPlayerDisplay = document.getElementById("current-player-name");
    this.rollsLeftDisplay = document.getElementById("rolls-left");
    this.roundDisplay = document.getElementById("current-round");

    // Event Listeners
    this.startBtn.addEventListener("click", () => this.startGame());
    this.rollBtn.addEventListener("click", () => this.rollDice());
    this.rulesBtn.addEventListener("click", () => this.showRules());
    this.closeRulesBtn.addEventListener("click", () => this.hideRules());
    this.newGameBtn.addEventListener("click", () => this.resetToStart());
    this.playAgainBtn.addEventListener("click", () => this.resetToStart());
    this.rulesModal.addEventListener("click", (e) => {
      if (e.target === this.rulesModal) this.hideRules();
    });

    // Dice click handlers
    const diceElements = this.diceContainer.querySelectorAll(".die");
    diceElements.forEach((die, index) => {
      die.addEventListener("click", () => this.toggleHold(index));
    });

    // Score cell click handlers
    document.querySelectorAll(".score-cell").forEach((cell) => {
      cell.addEventListener("click", () => this.selectCategory(cell));
    });
  }

  startGame() {
    const p1Name =
      document.getElementById("player1-name").value.trim() || "Player 1";
    const p2Name =
      document.getElementById("player2-name").value.trim() || "Player 2";

    this.players[0].name = p1Name;
    this.players[1].name = p2Name;
    this.players[0].scores = {};
    this.players[1].scores = {};
    this.players[0].yahtzeeBonus = 0;
    this.players[1].yahtzeeBonus = 0;

    document.getElementById("p1-header").textContent = p1Name;
    document.getElementById("p2-header").textContent = p2Name;

    this.currentPlayer = 0;
    this.round = 1;
    this.resetTurn();
    this.updateDisplay();
    this.clearAllScores();

    this.startScreen.classList.remove("active");
    this.gameScreen.classList.add("active");
  }

  resetTurn() {
    this.dice = [0, 0, 0, 0, 0];
    this.held = [false, false, false, false, false];
    this.rollsLeft = 3;
    this.updateDiceDisplay();
    this.updateAvailableCategories();
    this.rollBtn.disabled = false;
  }

  rollDice() {
    if (this.rollsLeft <= 0) return;

    const diceElements = this.diceContainer.querySelectorAll(".die");

    // Add rolling animation
    diceElements.forEach((die, i) => {
      if (!this.held[i]) {
        die.classList.add("rolling");
      }
    });

    // Roll unheld dice
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        if (!this.held[i]) {
          this.dice[i] = Math.floor(Math.random() * 6) + 1;
        }
      }

      this.rollsLeft--;
      this.updateDiceDisplay();
      this.rollsLeftDisplay.textContent = this.rollsLeft;
      this.updateAvailableCategories();

      diceElements.forEach((die) => die.classList.remove("rolling"));

      if (this.rollsLeft <= 0) {
        this.rollBtn.disabled = true;
      }
    }, 500);
  }

  toggleHold(index) {
    if (this.rollsLeft === 3 || this.dice[index] === 0) return;
    this.held[index] = !this.held[index];
    this.updateDiceDisplay();
  }

  updateDiceDisplay() {
    const diceElements = this.diceContainer.querySelectorAll(".die");
    diceElements.forEach((die, i) => {
      const face = die.querySelector(".die-face");
      face.innerHTML = this.getDieFaceHTML(this.dice[i]);
      die.classList.toggle("held", this.held[i]);
      die.dataset.value = this.dice[i];
    });
  }

  getDieFaceHTML(value) {
    const patterns = {
      0: [],
      1: [[2, 2]],
      2: [
        [1, 1],
        [3, 3],
      ],
      3: [
        [1, 1],
        [2, 2],
        [3, 3],
      ],
      4: [
        [1, 1],
        [1, 3],
        [3, 1],
        [3, 3],
      ],
      5: [
        [1, 1],
        [1, 3],
        [2, 2],
        [3, 1],
        [3, 3],
      ],
      6: [
        [1, 1],
        [1, 2],
        [1, 3],
        [3, 1],
        [3, 2],
        [3, 3],
      ],
    };

    const dots = patterns[value] || [];
    let html = "";
    for (let row = 1; row <= 3; row++) {
      for (let col = 1; col <= 3; col++) {
        const hasDot = dots.some(([r, c]) => r === row && c === col);
        html += hasDot ? '<div class="dot"></div>' : "<div></div>";
      }
    }
    return html;
  }

  updateAvailableCategories() {
    const player = this.currentPlayer + 1;
    const scores = this.players[this.currentPlayer].scores;

    document
      .querySelectorAll(`.score-cell[data-player="${player}"]`)
      .forEach((cell) => {
        const category = cell.dataset.category;
        cell.classList.remove("available");

        if (!scores.hasOwnProperty(category) && this.rollsLeft < 3) {
          cell.classList.add("available");
          const potentialScore = this.calculateScore(category);
          cell.textContent = potentialScore;
        } else if (scores.hasOwnProperty(category)) {
          cell.textContent = scores[category];
        }
      });
  }

  calculateScore(category) {
    const dice = [...this.dice];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    dice.forEach((d) => counts[d]++);
    const sum = dice.reduce((a, b) => a + b, 0);

    switch (category) {
      case "ones":
        return counts[1] * 1;
      case "twos":
        return counts[2] * 2;
      case "threes":
        return counts[3] * 3;
      case "fours":
        return counts[4] * 4;
      case "fives":
        return counts[5] * 5;
      case "sixes":
        return counts[6] * 6;
      case "threeOfKind":
        return counts.some((c) => c >= 3) ? sum : 0;
      case "fourOfKind":
        return counts.some((c) => c >= 4) ? sum : 0;
      case "fullHouse":
        return counts.includes(3) && counts.includes(2) ? 25 : 0;
      case "smallStraight":
        return this.hasSmallStraight(counts) ? 30 : 0;
      case "largeStraight":
        return this.hasLargeStraight(counts) ? 40 : 0;
      case "yahtzee":
        return counts.some((c) => c === 5) ? 50 : 0;
      case "chance":
        return sum;
      default:
        return 0;
    }
  }

  hasSmallStraight(counts) {
    const str = counts
      .slice(1)
      .map((c) => (c > 0 ? "1" : "0"))
      .join("");
    return str.includes("1111");
  }

  hasLargeStraight(counts) {
    const str = counts
      .slice(1)
      .map((c) => (c > 0 ? "1" : "0"))
      .join("");
    return str === "111110" || str === "011111";
  }

  selectCategory(cell) {
    if (!cell.classList.contains("available")) return;

    const category = cell.dataset.category;
    const player = this.players[this.currentPlayer];
    const score = this.calculateScore(category);

    // Check for Yahtzee bonus
    if (category === "yahtzee" && score === 50) {
      // First Yahtzee
    } else if (
      this.dice.every((d) => d === this.dice[0]) &&
      player.scores.hasOwnProperty("yahtzee") &&
      player.scores["yahtzee"] === 50
    ) {
      // Yahtzee bonus!
      player.yahtzeeBonus += 100;
      this.updateYahtzeeBonus();
    }

    player.scores[category] = score;
    cell.classList.remove("available");
    cell.classList.add("scored");
    if (score === 0) cell.classList.add("zero");
    cell.textContent = score;

    this.updateTotals();
    this.nextTurn();
  }

  updateTotals() {
    for (let p = 0; p < 2; p++) {
      const scores = this.players[p].scores;
      const upperCategories = [
        "ones",
        "twos",
        "threes",
        "fours",
        "fives",
        "sixes",
      ];

      let upperSum = 0;
      upperCategories.forEach((cat) => {
        if (scores.hasOwnProperty(cat)) {
          upperSum += scores[cat];
        }
      });

      const bonus = upperSum >= 63 ? 35 : 0;

      let lowerSum = 0;
      this.categories.slice(6).forEach((cat) => {
        if (scores.hasOwnProperty(cat)) {
          lowerSum += scores[cat];
        }
      });

      const total = upperSum + bonus + lowerSum + this.players[p].yahtzeeBonus;

      document.getElementById(`p${p + 1}-upper-subtotal`).textContent =
        upperSum;
      document.getElementById(`p${p + 1}-bonus`).textContent = bonus;
      document.getElementById(`p${p + 1}-total`).textContent = total;
    }
  }

  updateYahtzeeBonus() {
    for (let p = 0; p < 2; p++) {
      document.getElementById(`p${p + 1}-yahtzee-bonus`).textContent =
        this.players[p].yahtzeeBonus;
    }
  }

  nextTurn() {
    // Check if game is over
    const totalCategories = this.categories.length;
    const p1Filled = Object.keys(this.players[0].scores).length;
    const p2Filled = Object.keys(this.players[1].scores).length;

    if (p1Filled === totalCategories && p2Filled === totalCategories) {
      this.endGame();
      return;
    }

    // Switch player
    this.currentPlayer = (this.currentPlayer + 1) % 2;

    // Update round when both players have played
    if (this.currentPlayer === 0) {
      this.round = Math.min(13, Math.floor((p1Filled + p2Filled) / 2) + 1);
    }

    this.roundDisplay.textContent = this.round;
    this.resetTurn();
    this.updateDisplay();
  }

  updateDisplay() {
    const player = this.players[this.currentPlayer];
    this.currentPlayerDisplay.textContent = player.name;
    this.currentPlayerDisplay.classList.toggle(
      "player2",
      this.currentPlayer === 1
    );
    this.rollsLeftDisplay.textContent = this.rollsLeft;
  }

  endGame() {
    const p1Total = parseInt(document.getElementById("p1-total").textContent);
    const p2Total = parseInt(document.getElementById("p2-total").textContent);

    let winner;
    if (p1Total > p2Total) {
      winner = `${this.players[0].name} Wins!`;
    } else if (p2Total > p1Total) {
      winner = `${this.players[1].name} Wins!`;
    } else {
      winner = "It's a Tie!";
    }

    document.getElementById("winner-text").textContent = winner;
    document.getElementById("final-p1-name").textContent = this.players[0].name;
    document.getElementById("final-p2-name").textContent = this.players[1].name;
    document.getElementById("final-p1-score").textContent = p1Total;
    document.getElementById("final-p2-score").textContent = p2Total;

    this.gameoverModal.classList.add("active");
    this.createConfetti();
  }

  createConfetti() {
    const confettiContainer = document.getElementById("confetti");
    confettiContainer.innerHTML = "";

    const colors = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement("div");
      confetti.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${
                  colors[Math.floor(Math.random() * colors.length)]
                };
                left: ${Math.random() * 100}%;
                top: -10px;
                opacity: ${Math.random() * 0.5 + 0.5};
                transform: rotate(${Math.random() * 360}deg);
                animation: confettiFall ${
                  Math.random() * 2 + 2
                }s linear forwards;
            `;
      confettiContainer.appendChild(confetti);
    }

    // Add confetti animation
    if (!document.getElementById("confetti-style")) {
      const style = document.createElement("style");
      style.id = "confetti-style";
      style.textContent = `
                @keyframes confettiFall {
                    to {
                        top: 100%;
                        transform: rotate(720deg) translateX(${
                          Math.random() * 100 - 50
                        }px);
                    }
                }
            `;
      document.head.appendChild(style);
    }
  }

  clearAllScores() {
    document.querySelectorAll(".score-cell").forEach((cell) => {
      cell.textContent = "";
      cell.classList.remove("available", "scored", "zero");
    });

    for (let p = 1; p <= 2; p++) {
      document.getElementById(`p${p}-upper-subtotal`).textContent = "0";
      document.getElementById(`p${p}-bonus`).textContent = "0";
      document.getElementById(`p${p}-yahtzee-bonus`).textContent = "0";
      document.getElementById(`p${p}-total`).textContent = "0";
    }
  }

  resetToStart() {
    this.gameoverModal.classList.remove("active");
    this.gameScreen.classList.remove("active");
    this.startScreen.classList.add("active");
  }

  showRules() {
    this.rulesModal.classList.add("active");
  }

  hideRules() {
    this.rulesModal.classList.remove("active");
  }
}

// Initialize game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new YahtzeeGame();
});
