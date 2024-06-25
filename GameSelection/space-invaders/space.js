var myFont, fontReady = false;
var user;
var bullets = [];
var aliens = [];
var GameOverFlag = false;
var btnVisible = false;
var difficultyIndex = 5;
var score = 0;
var shootSound, hitSound, GOSound;
var betAmount = 0;
var funds = 0;

function fontRead() {
  fontReady = true;
}

function preload() {
  myFont = loadFont("pixels.ttf", fontRead);
}

function setup() {
  shootSound = loadSound('shoot.wav');
  hitSound = loadSound('invaderkilled.wav');
  GOSound = loadSound('pacman_death.wav');
  createCanvas(720, 400);
  user = new userShip(width / 2, height + 10);
  frameRate(60);

  noLoop(); // Stop looping the draw function
  document.getElementById('start').onclick = startGame;
  fetchWalletBalance();
}

function fetchWalletBalance() {
  fetch('http://localhost:5000/gaminghome', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (data.wallet_balance !== undefined) {
      funds = data.wallet_balance;
      document.getElementById('wallet-balance-game').textContent = 'Wallet Balance: $' + funds.toFixed(2);
    } else {
      console.error('Error fetching wallet balance:', data.error);
      alert('Error fetching wallet balance. Please try again.');
    }
  })
  .catch(error => {
    console.error('Error fetching wallet balance:', error);
    alert('Error fetching wallet balance. Please try again.');
  });
}

function startGame() {
  betAmount = parseInt(document.getElementById('amount').value);

  if (isNaN(betAmount) || betAmount <= 0) {
    alert('Please enter a valid bet amount.');
    return;
  }

  if (funds < betAmount) {
    alert('Not enough funds.');
    return;
  }

  funds -= betAmount;
  document.getElementById('wallet-balance-game').textContent = 'Wallet Balance: $' + funds.toFixed(2);
  loop(); // Start looping the draw function
}

function resetGame() {
  location.reload();
}

function draw() {
  background(0);

  if (fontReady && !GameOverFlag) {
    user.show();
    user.update();

    if (aliens.length < difficultyIndex) {
      var alien = new Alien(user.x, height);
      aliens.push(alien);
    }

    if (keyIsDown(LEFT_ARROW)) {
      user.move('left');
    } else if (keyIsDown(RIGHT_ARROW)) {
      user.move('right');
    }

    for (var i = 0; i < aliens.length; i++) {
      aliens[i].show();
      aliens[i].update();
      if (aliens[i].y > (height - 20)) {
        gameOver();
      }
    }

    for (var i = 0; i < bullets.length; i++) {
      bullets[i].show();
      bullets[i].move();
      for (var j = 0; j < aliens.length; j++) {
        if (bullets[i].hits(aliens[j])) {
          aliens.splice(j, 1);
          bullets[i].delmefn();
          score++;
          hitSound.play();

          if (score % 8 == 0) {
            difficultyIndex++;
          }
        }
      }
    }

    for (var i = 0; i < bullets.length; i++) {
      if (bullets[i].y < 0 || bullets[i].delme == true) {
        bullets.splice(i, 1);
      }
    }

    fill(255);
    textSize(24);
    text("Score: " + score, 10, 30);
  } else if (GameOverFlag) {
    fill(255);
    textSize(36);
    textFont("Arial");
    var GOStr = "Final Score: " + score;
    text(GOStr, (width / 2) - 100, height / 2);
    if (!btnVisible) {
      var button = createButton('Restart Game');
      button.mousePressed(resetGame);
      btnVisible = true;
      GOSound.play();
      updateWallet();
    }
  }
}


  
function keyPressed() {
  if (!GameOverFlag) {
    if (keyCode === 32) {
      shootSound.play();
      var bullet = new Bullet(user.x, height);
      bullets.push(bullet);
      }
    }
  }
  
  function userShip(x, y) {
    this.x = x;
    this.y = y;
    this.length = 10;
    
    this.show = function () {
      fill(255);
      textSize(36);
      textFont(myFont);
      text("W", this.x, this.y);
    };
    
    this.update = function () {};
    
    this.move = function (direction) {
      if (direction === 'right') {
        this.x += 5;
      } else if (direction === 'left') {
        this.x -=5;
      }
      this.x = constrain(this.x, 50, width - 50);
    };
  }
  
  function Bullet(x, y) {
    this.x = x;
    this.y = y;
    this.r = 3;
    this.delme = false;
    
    this.show = function () {
      noStroke();
      fill(51, 0, 255);
      ellipse(this.x + 13, this.y - 30, this.r * 2, this.r * 2);
    };
  
    this.move = function () {
      this.y -=15;
    };
  
    this.delmefn = function () {
      this.delme = true;
    };
  
    this.hits = function (alien) {
      var d = dist(this.x, this.y, alien.x, alien.y);
      return d < 20;
    };
  }
  
  function Alien(x, y) {
    this.x = random(50, width - 50);
    this.y = random(20, height / 2);
    var types = ['I', 'H'];
  
    this.show = function () {
      fill(204, 255, 0);
      textSize(36);
      textFont(myFont);
      text(random(types), this.x, this.y);
    };
  
    this.update = function () {
      this.y += 0.5;
    };
  }
  
  function gameOver() {
    GameOverFlag = true;
    noLoop();
  }
  
  function updateWallet() {
    fetch('http://localhost:5000/update_wallet_space_game', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ score: score, bet_amount: betAmount })
    })
    .then(response => response.json())
    .then(data => {
      if (data.new_balance !== undefined) {
        funds = data.new_balance;
        document.getElementById('wallet-balance-game').textContent = 'Wallet Balance: $' + funds.toFixed(2);
        alert('Game Over! Your new balance is $' + funds.toFixed(2));
      } else {
        console.error('Error updating wallet balance:', data.error);
        alert('Error updating wallet balance. Please refresh the page.');
      }
    })
    .catch(error => {
      console.error('Error updating wallet balance:', error);
      alert('Error updating wallet balance. Please refresh the page.');
    });
  }
