# Yahtzee (Kniffel) - Two Player Dice Game

A beautiful, modern implementation of the classic Yahtzee® dice game for two players, built with vanilla HTML, CSS, and JavaScript, for educational purposes. Includes a computer opponent.

![Yahtzee Game](https://img.shields.io/badge/Game-Yahtzee-6366f1?style=for-the-badge)
![Players](https://img.shields.io/badge/Players-2-ec4899?style=for-the-badge)
![Tech](https://img.shields.io/badge/Tech-HTML%20%2F%20CSS%20%2F%20JS-10b981?style=for-the-badge)

![Video](yahtzee_ai_demo.webp)

## 🎲 Features

- **Two Player Gameplay** - Take turns rolling dice and competing for the highest score
- **One Player vs. AI Gameplay** - Roll dice against your computer and compete for the highest score
- **Beautiful Dark Theme** - Modern UI with gradients, animations, and glowing effects
- **Interactive Dice** - Click to hold dice between rolls, visual feedback for held dice
- **Complete Scorecard** - All 13 Yahtzee categories with automatic score calculation
- **Bonus Scoring** - Upper section bonus (35 points for 63+) and Yahtzee bonus (100 points)
- **Responsive Design** - Plays great on desktop, tablet, and mobile
- **Rules Reference** - Built-in rules modal for quick reference

## 🎮 How to Play

1. **Enter player names** and click "Start Game"
2. **Roll the dice** - You get 3 rolls per turn
3. **Click dice to hold** them between rolls
4. **Select a category** to score after rolling
5. **Take turns** until all 13 categories are filled
6. **Highest score wins!**

## 📊 Scoring Categories

### Upper Section

| Category  | Score                   |
| --------- | ----------------------- |
| Ones      | Sum of all 1s           |
| Twos      | Sum of all 2s           |
| Threes    | Sum of all 3s           |
| Fours     | Sum of all 4s           |
| Fives     | Sum of all 5s           |
| Sixes     | Sum of all 6s           |
| **Bonus** | +35 if upper total ≥ 63 |

### Lower Section

| Category          | Score                               |
| ----------------- | ----------------------------------- |
| Three of a Kind   | Sum of all dice (need 3 matching)   |
| Four of a Kind    | Sum of all dice (need 4 matching)   |
| Full House        | 25 points (3 of one + 2 of another) |
| Small Straight    | 30 points (4 consecutive dice)      |
| Large Straight    | 40 points (5 consecutive dice)      |
| Yahtzee           | 50 points (5 of a kind)             |
| Chance            | Sum of all dice                     |
| **Yahtzee Bonus** | +100 for each additional Yahtzee    |

## 🚀 Getting Started

### Option 1: Open Directly

Simply open `index.html` in any modern web browser.

### Option 2: Local Server

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js
npx serve .

# Then open http://localhost:8080
```

### Option 3: Deploy to Web

These are static files that can be hosted on any web server:

- GitHub Pages
- Netlify
- Vercel
- Any static file hosting

## 📁 File Structure

```
kniffel/
├── index.html    # Main HTML structure
├── styles.css    # All styling and animations
├── game.js       # Game logic and interactivity
└── README.md     # This file
```

## 🎨 Design Features

- **Dark Theme** - Easy on the eyes with deep purple/blue colors
- **Gradient Accents** - Beautiful purple-to-pink gradients
- **Smooth Animations** - Dice rolling, floating effects, and transitions
- **Glassmorphism** - Modern backdrop blur effects
- **Responsive Grid** - Adapts to any screen size

## 🛠️ Technologies

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox, animations
- **JavaScript ES6** - Classes, arrow functions, template literals
- **Google Fonts** - Outfit font family

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📄 Software License

MIT License - Feel free to use, modify, and distribute! 

## Buy the real thing

Yahtzee is registered trademark of Hasbro (which bought Milton Bradley). It was first marketed under the name of Yahtzee by game entrepreneur Edwin S. Lowe in 1956. 

