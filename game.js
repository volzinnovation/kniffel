// Yahtzee Game - Main JavaScript with AI Opponent

class YahtzeeAI {
  constructor(game) {
    this.game = game;
  }

  // Get all available (unfilled) categories
  getAvailableCategories() {
    const scores = this.game.players[1].scores;
    return this.game.categories.filter(cat => !scores.hasOwnProperty(cat));
  }

  // Calculate score for any dice combination and category
  calculateScoreForDice(dice, category) {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    dice.forEach(d => counts[d]++);
    const sum = dice.reduce((a, b) => a + b, 0);

    switch (category) {
      case "ones": return counts[1] * 1;
      case "twos": return counts[2] * 2;
      case "threes": return counts[3] * 3;
      case "fours": return counts[4] * 4;
      case "fives": return counts[5] * 5;
      case "sixes": return counts[6] * 6;
      case "threeOfKind": return counts.some(c => c >= 3) ? sum : 0;
      case "fourOfKind": return counts.some(c => c >= 4) ? sum : 0;
      case "fullHouse": return counts.includes(3) && counts.includes(2) ? 25 : 0;
      case "smallStraight": return this.hasSmallStraight(counts) ? 30 : 0;
      case "largeStraight": return this.hasLargeStraight(counts) ? 40 : 0;
      case "yahtzee": return counts.some(c => c === 5) ? 50 : 0;
      case "chance": return sum;
      default: return 0;
    }
  }

  hasSmallStraight(counts) {
    const str = counts.slice(1).map(c => (c > 0 ? "1" : "0")).join("");
    return str.includes("1111");
  }

  hasLargeStraight(counts) {
    const str = counts.slice(1).map(c => (c > 0 ? "1" : "0")).join("");
    return str === "111110" || str === "011111";
  }

  // Calculate the dice counts from current dice
  getDiceCounts(dice) {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    dice.forEach(d => counts[d]++);
    return counts;
  }

  // Evaluate the strategic value of a category (considering upper section bonus)
  getCategoryValue(category, score, scores) {
    let value = score;
    
    // Upper section bonus consideration
    const upperCategories = ["ones", "twos", "threes", "fours", "fives", "sixes"];
    if (upperCategories.includes(category)) {
      const categoryNumber = upperCategories.indexOf(category) + 1;
      const targetScore = categoryNumber * 3; // Target for bonus (3 of each)
      
      // Calculate current upper section total
      let currentUpperTotal = 0;
      let remainingCategories = 0;
      upperCategories.forEach(cat => {
        if (scores.hasOwnProperty(cat)) {
          currentUpperTotal += scores[cat];
        } else if (cat !== category) {
          remainingCategories++;
        }
      });
      
      // If this score helps reach the 63 bonus threshold, add weighted value
      const newTotal = currentUpperTotal + score;
      const targetTotal = 63;
      
      if (newTotal >= targetTotal && currentUpperTotal < targetTotal) {
        // This score gets us the bonus!
        value += 35;
      } else if (score >= targetScore) {
        // Good score for this category, add slight bonus
        value += 5;
      } else if (score < targetScore - 2 && remainingCategories > 0) {
        // Poor score, slight penalty
        value -= 3;
      }
    }

    // Bonus for high-value categories
    if (category === "yahtzee" && score === 50) {
      value += 10; // Yahtzee is very valuable
    }
    if (category === "largeStraight" && score === 40) {
      value += 5;
    }
    if (category === "fullHouse" && score === 25) {
      value += 3;
    }

    // Chance is a fallback - slight penalty to save for later
    if (category === "chance") {
      value -= 2;
    }

    return value;
  }

  // Choose which dice to keep based on current state and strategy
  chooseDiceToKeep(dice, rollsLeft) {
    const availableCategories = this.getAvailableCategories();
    const counts = this.getDiceCounts(dice);
    const scores = this.game.players[1].scores;
    
    // Find the best value face to collect
    let bestFace = 0;
    let bestFaceCount = 0;
    
    for (let face = 1; face <= 6; face++) {
      if (counts[face] > bestFaceCount) {
        bestFaceCount = counts[face];
        bestFace = face;
      } else if (counts[face] === bestFaceCount && face > bestFace) {
        // Prefer higher faces for same count
        bestFace = face;
      }
    }

    // Strategy based on available categories and current dice
    const held = [false, false, false, false, false];

    // Check for Yahtzee opportunity
    if (availableCategories.includes("yahtzee") && bestFaceCount >= 3) {
      // Go for Yahtzee - keep all matching dice
      dice.forEach((d, i) => {
        if (d === bestFace) held[i] = true;
      });
      return held;
    }

    // Check for Large Straight opportunity
    if (availableCategories.includes("largeStraight")) {
      const uniqueDice = [...new Set(dice)].sort((a, b) => a - b);
      // Check for potential straight
      if (uniqueDice.length >= 4) {
        // Keep dice that could form a straight
        const isLowStraight = [1, 2, 3, 4].every(n => uniqueDice.includes(n));
        const isHighStraight = [3, 4, 5, 6].every(n => uniqueDice.includes(n));
        const isMidStraight = [2, 3, 4, 5].every(n => uniqueDice.includes(n));
        
        if (isLowStraight || isHighStraight || isMidStraight) {
          const targetSet = isLowStraight ? [1, 2, 3, 4] : (isHighStraight ? [3, 4, 5, 6] : [2, 3, 4, 5]);
          const kept = new Set();
          dice.forEach((d, i) => {
            if (targetSet.includes(d) && !kept.has(d)) {
              held[i] = true;
              kept.add(d);
            }
          });
          return held;
        }
      }
    }

    // Check for Small Straight opportunity
    if (availableCategories.includes("smallStraight") && !availableCategories.includes("largeStraight")) {
      const uniqueDice = [...new Set(dice)].sort((a, b) => a - b);
      if (uniqueDice.length >= 3) {
        // Keep unique dice for straight potential
        const kept = new Set();
        dice.forEach((d, i) => {
          if (!kept.has(d) && d >= 1 && d <= 6) {
            held[i] = true;
            kept.add(d);
          }
        });
        return held;
      }
    }

    // Check for Full House opportunity
    if (availableCategories.includes("fullHouse")) {
      let threeKind = 0;
      let twoKind = 0;
      for (let face = 1; face <= 6; face++) {
        if (counts[face] >= 3) threeKind = face;
        else if (counts[face] >= 2) twoKind = face;
      }
      
      if (threeKind > 0 || (bestFaceCount >= 2 && rollsLeft > 0)) {
        // Keep the pairs/triples
        dice.forEach((d, i) => {
          if (counts[d] >= 2) held[i] = true;
        });
        return held;
      }
    }

    // Check for Four of a Kind opportunity
    if (availableCategories.includes("fourOfKind") && bestFaceCount >= 3) {
      dice.forEach((d, i) => {
        if (d === bestFace) held[i] = true;
      });
      return held;
    }

    // Check for Three of a Kind opportunity
    if (availableCategories.includes("threeOfKind") && bestFaceCount >= 2) {
      dice.forEach((d, i) => {
        if (d === bestFace) held[i] = true;
      });
      return held;
    }

    // Upper section strategy - keep matching high-value dice
    const upperCategories = ["sixes", "fives", "fours", "threes", "twos", "ones"];
    for (const cat of upperCategories) {
      if (availableCategories.includes(cat)) {
        const faceValue = upperCategories.indexOf(cat) === 0 ? 6 : 
                          upperCategories.indexOf(cat) === 1 ? 5 :
                          upperCategories.indexOf(cat) === 2 ? 4 :
                          upperCategories.indexOf(cat) === 3 ? 3 :
                          upperCategories.indexOf(cat) === 4 ? 2 : 1;
        
        if (counts[faceValue] >= 2) {
          dice.forEach((d, i) => {
            if (d === faceValue) held[i] = true;
          });
          return held;
        }
      }
    }

    // Default: keep the most common face if >= 2, prioritizing high values
    if (bestFaceCount >= 2) {
      dice.forEach((d, i) => {
        if (d === bestFace) held[i] = true;
      });
    }

    return held;
  }

  // Choose the best category to score
  chooseBestCategory(dice) {
    const availableCategories = this.getAvailableCategories();
    const scores = this.game.players[1].scores;
    
    let bestCategory = null;
    let bestValue = -Infinity;
    let bestScore = 0;

    for (const category of availableCategories) {
      const score = this.calculateScoreForDice(dice, category);
      const value = this.getCategoryValue(category, score, scores);

      // Special handling: don't waste Yahtzee on 0
      if (category === "yahtzee" && score === 0 && availableCategories.length > 1) {
        continue;
      }

      // Prefer non-zero scores
      if (score > 0 && value > bestValue) {
        bestValue = value;
        bestCategory = category;
        bestScore = score;
      } else if (score === 0 && bestValue < 0) {
        // Only consider 0 scores if we haven't found anything good
        if (value > bestValue) {
          bestValue = value;
          bestCategory = category;
          bestScore = score;
        }
      }
    }

    // If no good category found, pick the one with least penalty for 0
    if (bestCategory === null || (bestScore === 0 && availableCategories.length > 1)) {
      const sacrificeOrder = ["ones", "twos", "threes", "fours", "fives", "sixes", 
                              "smallStraight", "largeStraight", "fullHouse", 
                              "threeOfKind", "fourOfKind", "chance", "yahtzee"];
      
      for (const cat of sacrificeOrder) {
        if (availableCategories.includes(cat)) {
          const score = this.calculateScoreForDice(dice, cat);
          if (score === 0 || bestCategory === null) {
            bestCategory = cat;
            break;
          }
        }
      }
    }

    return bestCategory || availableCategories[0];
  }

  // Should we continue rolling?
  shouldContinueRolling(dice, rollsLeft) {
    if (rollsLeft <= 0) return false;

    const availableCategories = this.getAvailableCategories();
    const counts = this.getDiceCounts(dice);
    
    // Check if we have a Yahtzee already
    if (counts.some(c => c === 5)) return false;
    
    // Check if we have a large straight
    if (availableCategories.includes("largeStraight")) {
      const uniqueDice = [...new Set(dice)].sort((a, b) => a - b);
      if (uniqueDice.length === 5 && 
          (uniqueDice.join("") === "12345" || uniqueDice.join("") === "23456")) {
        return false;
      }
    }

    // Check if we have a good full house
    if (availableCategories.includes("fullHouse") && 
        counts.includes(3) && counts.includes(2)) {
      return false;
    }

    // Generally continue rolling if we don't have a strong hand
    const maxCount = Math.max(...counts);
    const sum = dice.reduce((a, b) => a + b, 0);

    // If we have 4 of a kind and going for yahtzee, keep rolling
    if (maxCount === 4 && availableCategories.includes("yahtzee") && rollsLeft > 0) {
      return true;
    }

    // If we have a great chance score, might stop
    if (sum >= 25 && availableCategories.includes("chance")) {
      if (maxCount < 3) return false;
    }

    // If we have 3+ of a kind with high face, might stop
    if (maxCount >= 3) {
      const face = counts.indexOf(maxCount);
      if (face >= 5 && !availableCategories.includes("yahtzee")) {
        return rollsLeft > 1 && maxCount < 4;
      }
    }

    return rollsLeft > 0;
  }
}

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
    this.gameMode = "human"; // "human" or "computer"
    this.ai = new YahtzeeAI(this);
    this.isAITurn = false;
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
    this.aiThinkingIndicator = document.getElementById("ai-thinking");
    this.aiStatus = document.getElementById("ai-status");
    this.aiStatusText = document.getElementById("ai-status-text");
    this.diceHint = document.getElementById("dice-hint");
    this.player2InputGroup = document.getElementById("player2-input-group");

    // Game Mode Buttons
    this.modeHumanBtn = document.getElementById("mode-human");
    this.modeComputerBtn = document.getElementById("mode-computer");

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

    // Game Mode Selection
    this.modeHumanBtn.addEventListener("click", () => this.setGameMode("human"));
    this.modeComputerBtn.addEventListener("click", () => this.setGameMode("computer"));

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

  setGameMode(mode) {
    this.gameMode = mode;
    
    // Update button styles
    this.modeHumanBtn.classList.toggle("active", mode === "human");
    this.modeComputerBtn.classList.toggle("active", mode === "computer");
    
    // Show/hide player 2 input
    if (mode === "computer") {
      this.player2InputGroup.classList.add("hidden-smooth");
    } else {
      this.player2InputGroup.classList.remove("hidden-smooth");
    }
  }

  startGame() {
    const p1Name =
      document.getElementById("player1-name").value.trim() || "Player 1";
    const p2Name = this.gameMode === "computer" ? "🤖 Computer" :
      (document.getElementById("player2-name").value.trim() || "Player 2");

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
    this.isAITurn = false;
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
    if (this.isAITurn && this.currentPlayer !== 1) return;

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
    // Don't allow holding during AI turn
    if (this.isAITurn) return;
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
    // Clear all previously available hints and potential scores
    document.querySelectorAll(".score-cell").forEach((cell) => {
      cell.classList.remove("available");
      const p = parseInt(cell.dataset.player) - 1;
      const category = cell.dataset.category;
      if (!this.players[p].scores.hasOwnProperty(category)) {
        cell.textContent = "";
      }
    });

    const playerNum = this.currentPlayer + 1;
    const scores = this.players[this.currentPlayer].scores;

    // Only show hints for current player if they have rolled at least once
    if (this.rollsLeft < 3) {
      document
        .querySelectorAll(`.score-cell[data-player="${playerNum}"]`)
        .forEach((cell) => {
          const category = cell.dataset.category;
          if (!scores.hasOwnProperty(category)) {
            cell.classList.add("available");
            const potentialScore = this.calculateScore(category);
            cell.textContent = potentialScore;
          }
        });
    }
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
    // Don't allow selection during AI turn (unless it's the AI selecting)
    if (this.isAITurn && this.currentPlayer === 1) {
      // AI is selecting, allow it
    } else if (this.isAITurn) {
      return;
    }
    
    if (!cell.classList.contains("available")) return;
    if (parseInt(cell.dataset.player) !== this.currentPlayer + 1) return;

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

  // AI selects a category programmatically
  aiSelectCategory(category) {
    const cell = document.querySelector(
      `.score-cell[data-player="2"][data-category="${category}"]`
    );
    if (cell) {
      this.selectCategory(cell);
    }
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
    // Hide AI indicators
    this.aiThinkingIndicator.classList.remove("active");
    this.aiStatus.classList.remove("active");
    this.diceHint.style.display = "block";
    this.isAITurn = false;

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

    // If it's AI's turn, start AI play
    if (this.gameMode === "computer" && this.currentPlayer === 1) {
      this.startAITurn();
    }
  }

  startAITurn() {
    this.isAITurn = true;
    this.aiThinkingIndicator.classList.add("active");
    this.diceHint.style.display = "none";
    
    // Disable roll button during AI turn
    this.rollBtn.disabled = true;

    // Show status and start after delay
    this.showAIStatus("Getting ready to roll...");
    setTimeout(() => this.aiPerformTurn(), 1000);
  }

  showAIStatus(message) {
    this.aiStatusText.textContent = message;
    this.aiStatus.classList.add("active");
  }

  hideAIStatus() {
    this.aiStatus.classList.remove("active");
  }

  getCategoryDisplayName(category) {
    const names = {
      ones: "Ones", twos: "Twos", threes: "Threes", fours: "Fours",
      fives: "Fives", sixes: "Sixes", threeOfKind: "Three of a Kind",
      fourOfKind: "Four of a Kind", fullHouse: "Full House",
      smallStraight: "Small Straight", largeStraight: "Large Straight",
      yahtzee: "Yahtzee", chance: "Chance"
    };
    return names[category] || category;
  }

  aiPerformTurn() {
    // First roll
    this.showAIStatus("🎲 Rolling dice...");
    
    this.aiRollDice(() => {
      // Wait 1 second to evaluate dice
      setTimeout(() => {
        // Decide whether to continue rolling
        if (this.ai.shouldContinueRolling(this.dice, this.rollsLeft)) {
          // Choose which dice to keep
          const heldDice = this.ai.chooseDiceToKeep(this.dice, this.rollsLeft);
          const keptValues = this.dice.filter((_, i) => heldDice[i]);
          
          if (keptValues.length > 0) {
            this.showAIStatus(`🔒 Keeping ${keptValues.join(", ")}...`);
          } else {
            this.showAIStatus("🔄 Re-rolling all dice...");
          }
          
          // Wait 1 second before showing the lock
          setTimeout(() => {
            this.held = heldDice;
            this.updateDiceDisplay();
            
            // Wait 1 second before second roll
            setTimeout(() => {
              this.showAIStatus("🎲 Rolling again...");
              
              this.aiRollDice(() => {
                // Wait 1 second to evaluate dice
                setTimeout(() => {
                  // Decide whether to continue rolling
                  if (this.ai.shouldContinueRolling(this.dice, this.rollsLeft)) {
                    // Choose which dice to keep
                    const heldDice2 = this.ai.chooseDiceToKeep(this.dice, this.rollsLeft);
                    const keptValues2 = this.dice.filter((_, i) => heldDice2[i]);
                    
                    if (keptValues2.length > 0) {
                      this.showAIStatus(`🔒 Keeping ${keptValues2.join(", ")}...`);
                    } else {
                      this.showAIStatus("🔄 Re-rolling all dice...");
                    }
                    
                    // Wait 1 second before showing the lock
                    setTimeout(() => {
                      this.held = heldDice2;
                      this.updateDiceDisplay();
                      
                      // Wait 1 second before third roll
                      setTimeout(() => {
                        this.showAIStatus("🎲 Final roll...");
                        
                        this.aiRollDice(() => {
                          // Choose category after final roll
                          this.aiChooseCategory();
                        });
                      }, 1000);
                    }, 1000);
                  } else {
                    // Good enough, choose category
                    this.aiChooseCategory();
                  }
                }, 1000);
              });
            }, 1000);
          }, 1000);
        } else {
          // Good roll, choose category immediately
          this.aiChooseCategory();
        }
      }, 1000);
    });
  }

  aiRollDice(callback) {
    if (this.rollsLeft <= 0) {
      callback();
      return;
    }

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

      // Short delay after dice settle
      setTimeout(callback, 300);
    }, 600);
  }

  aiChooseCategory() {
    const bestCategory = this.ai.chooseBestCategory(this.dice);
    const score = this.calculateScore(bestCategory);
    const categoryName = this.getCategoryDisplayName(bestCategory);
    
    this.showAIStatus(`✅ Scoring ${score} in ${categoryName}`);
    
    // Wait 1 second before scoring
    setTimeout(() => {
      this.aiSelectCategory(bestCategory);
    }, 1000);
  }

  updateDisplay() {
    const player = this.players[this.currentPlayer];
    this.currentPlayerDisplay.textContent = player.name;
    this.currentPlayerDisplay.classList.toggle(
      "player2",
      this.currentPlayer === 1
    );
    this.rollsLeftDisplay.textContent = this.rollsLeft;

    // Highlight active player column
    document.getElementById("p1-header").classList.toggle("active-column", this.currentPlayer === 0);
    document.getElementById("p2-header").classList.toggle("active-column", this.currentPlayer === 1);
    
    // Also highlight the cells in the active column
    document.querySelectorAll(".score-row").forEach(row => {
      const cells = row.querySelectorAll(".score-cell");
      cells.forEach(cell => {
        const isCurrentPlayerCell = parseInt(cell.dataset.player) === this.currentPlayer + 1;
        cell.classList.toggle("active-player-cell", isCurrentPlayerCell);
      });
    });
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
    this.aiThinkingIndicator.classList.remove("active");
    this.aiStatus.classList.remove("active");
    this.diceHint.style.display = "block";
    this.isAITurn = false;
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
