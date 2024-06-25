document.addEventListener("DOMContentLoaded", function(event) {
    var num_lap = 1,
        results = [],
        funds = 0,
        bethorse,
        amount;

    // Fetch and display wallet balance when the page loads
    fetch('http://localhost:5000/gaminghome', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.wallet_balance !== undefined) {
            funds = data.wallet_balance;
            document.getElementById('wallet-balance-game').textContent = '$' + funds.toFixed(2);
        } else {
            console.error('Error fetching wallet balance:', data.error);
            alert('Error fetching wallet balance. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error fetching wallet balance:', error);
        alert('Error fetching wallet balance. Please try again.');
    });

    document.getElementById('start').onclick = function() {
        amount = parseInt(document.getElementById('amount').value);

        // Check for negative or zero amount
        if (amount <= 0) {
            alert('Please enter a positive bet amount.');
            return;
        }

        // Check for invalid amount (not a number)
        if (isNaN(amount)) {
            alert('Please enter a valid bet amount.');
            return;
        }

        num_lap = parseInt(document.getElementById('num_lap').value);
        bethorse = parseInt(document.getElementById('bethorse').value);

        if (funds < amount) {
            alert('Not enough funds.');
        } else if (num_lap <= 0) {
            alert('Number of laps must be greater than 0.');
        } else {
            playRace();
        }
    };

    function playRace() {
        document.getElementById('start').disabled = true;
        var tds = document.querySelectorAll('#results .result');
        for (var i = 0; i < tds.length; i++) {
            tds[i].className = 'result';
        }
        results = [];
        horse1.run();
        horse2.run();
        horse3.run();
        horse4.run();
    }

    function updateWallet(amount, won) {
        fetch('http://localhost:5000/update_wallet_horse_game', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: amount, won: won, user_id: '{{ user_id_value }}' })  // Replace '{{ user_id_value }}' with the actual user ID value
        })
        .then(response => response.json())
        .then(data => {
            if (data.new_balance !== undefined) {
                funds = data.new_balance;
                document.getElementById('wallet-balance-game').textContent = '$' + funds.toFixed(2);
            } else {
                console.error('Error updating wallet balance:1', data.error);
                alert('Error updating wallet balance. Please refresh the page.');
            }
        })
        .catch(error => {
            console.error('Error updating wallet balance:2', error);
            alert('Error updating wallet balance. Please refresh the page.');
        });
    }

    function Horse(id, x, y) {
        this.element = document.getElementById(id);
        this.speed = Math.random() * 10 + 10;
        this.originX = x;
        this.originY = y;
        this.x = x;
        this.y = y;
        this.number = parseInt(id.replace(/[\D]/g, ''));
        this.lap = 0;

        this.moveRight = function() {
            var horse = this;
            setTimeout(function() {
                horse.x++;
                horse.element.style.left = horse.x + 'vw';

                if (horse.lap == num_lap && horse.x > horse.originX + 6) {
                    horse.arrive();
                } else {
                    if (horse.x < 82.5 - horse.number * 2.5) {
                        horse.moveRight();
                    } else {
                        horse.element.className = 'horse runDown';
                        horse.speed = Math.random() * 10 + 10;
                        horse.moveDown();
                    }
                }
            }, 1000 / this.speed);
        }

        this.moveDown = function() {
            var horse = this;
            setTimeout(function() {
                horse.y++;
                horse.element.style.top = horse.y + 'vh';
                if (horse.y < horse.originY + 65) {
                    horse.moveDown();
                } else {
                    horse.element.className = 'horse runLeft';
                    horse.speed = Math.random() * 10 + 10;
                    horse.moveLeft();
                }
            }, 1000 / this.speed);
        }

        this.moveLeft = function() {
            var horse = this;
            setTimeout(function() {
                horse.x--;
                horse.element.style.left = horse.x + 'vw';
                if (horse.x > 12.5 - horse.number * 2.5) {
                    horse.moveLeft();
                } else {
                    horse.element.className = 'horse runUp';
                    horse.speed = Math.random() * 10 + 10;
                    horse.moveUp();
                }
            }, 1000 / this.speed);
        }

        this.moveUp = function() {
            var horse = this;
            setTimeout(function() {
                horse.y--;
                horse.element.style.top = horse.y + 'vh';
                if (horse.y > horse.originY) {
                    horse.speed = Math.random() * 10 + 10;
                    horse.moveUp();
                } else {
                    horse.element.className = 'horse runRight';
                    horse.lap++;
                    horse.moveRight();
                }
            }, 1000 / this.speed);
        }

        this.run = function() {
            this.element.className = 'horse runRight';
            this.moveRight();
        }

        this.arrive = function() {
            this.element.className = 'horse standRight';
            this.lap = 0;

            var tds = document.querySelectorAll('#results .result');
            tds[results.length].className = 'result horse' + this.number;
            results.push(this.number);

            if (results.length == 1) {
                var won = (this.number == bethorse);
                updateWallet(amount, won);
                if (won) {
                    alert('Congratulations! You won.');
                } else {
                    alert('Better luck next time!');
                }
            } else if (results.length == 4) {
                document.getElementById('start').disabled = false;
            }
        }
    }

    var horse1 = new Horse('horse1', 20, 4);
    var horse2 = new Horse('horse2', 20, 8);
    var horse3 = new Horse('horse3', 20, 12);
    var horse4 = new Horse('horse4', 20, 16);
});
