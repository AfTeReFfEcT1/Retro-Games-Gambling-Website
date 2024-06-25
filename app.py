from flask import Flask, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../instance/vault842.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app, supports_credentials=True)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(200), nullable=False)
    wallet = db.relationship('Wallet', backref='user', uselist=False)

class Wallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    balance = db.Column(db.Float, default=0.0)

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    phone = data.get('phone')
    password = generate_password_hash(data.get('password'), method='pbkdf2:sha256')

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email address already exists'}), 400

    new_user = User(username=username, email=email, phone=phone, password=password)
    db.session.add(new_user)
    db.session.commit()

    new_wallet = Wallet(user_id=new_user.id)
    db.session.add(new_wallet)
    db.session.commit()

    session['user_id'] = new_user.id

    return jsonify({'message': 'User created successfully'})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid username or password'}), 401

    session['user_id'] = user.id

    return jsonify({'message': 'User logged in successfully'})

@app.route('/gaminghome', methods=['GET'])
def gaminghome():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    wallet_balance = user.wallet.balance if user.wallet else 0.0

    return jsonify({
        'wallet_balance': wallet_balance
    })

@app.route('/deposit', methods=['POST'])
def deposit():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    amount = data.get('amount')

    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    user.wallet.balance += amount
    db.session.commit()

    return jsonify({'new_balance': user.wallet.balance})

@app.route('/withdraw', methods=['POST'])
def withdraw():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    amount = data.get('amount')

    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    if amount > user.wallet.balance:
        return jsonify({'error': 'Insufficient balance'}), 400

    user.wallet.balance -= amount
    db.session.commit()

    return jsonify({'new_balance': user.wallet.balance})

@app.route('/update_wallet_horse_game', methods=['POST'])
def update_wallet_horse_game():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']  # This line should not be indented
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    amount = data.get('amount')
    won = data.get('won')

    if not amount or amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400

    if won:
        user.wallet.balance += amount
    else:
        if amount > user.wallet.balance:
            return jsonify({'error': 'Insufficient balance'}), 400
        user.wallet.balance -= amount

    db.session.commit()

    return jsonify({'new_balance': user.wallet.balance})


@app.route('/update_wallet_space_game', methods=['POST'])
def update_wallet_space_game():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    score = data.get('score')
    bet_amount = data.get('bet_amount')

    if not bet_amount or bet_amount <= 0:
        return jsonify({'error': 'Invalid bet amount'}), 400

    if score is None or score < 0:
        return jsonify({'error': 'Invalid score'}), 400

    if score < 20:
        amount_won = 0
    elif score < 40:
        amount_won = bet_amount * (score / 40)
    else:
        amount_won = bet_amount + (bet_amount // 10)

    if amount_won > 0:
        user.wallet.balance += amount_won
    else:
        user.wallet.balance -= bet_amount
        if user.wallet.balance < 0:
            user.wallet.balance = 0

    db.session.commit()

    return jsonify({'new_balance': user.wallet.balance})



if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

