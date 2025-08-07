import logging
import asyncio
from aiogram import Bot, Dispatcher, executor, types
import sqlite3

API_TOKEN = '7813641931:AAFzIi_efv27bLYAz6pf4S3JEMiVdwzFV9Q'

logging.basicConfig(level=logging.INFO)

bot = Bot(token=API_TOKEN)
dp = Dispatcher(bot)

# Initialize SQLite database
conn = sqlite3.connect('chatbot.db')
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    gender TEXT,
    is_vip INTEGER DEFAULT 0,
    in_chat INTEGER DEFAULT 0,
    partner_id INTEGER DEFAULT NULL
)''')
c.execute('''CREATE TABLE IF NOT EXISTS queue (
    user_id INTEGER PRIMARY KEY,
    preferred_gender TEXT
)''')
conn.commit()

# Database Helpers
def add_user(user_id):
    c.execute("INSERT OR IGNORE INTO users (user_id) VALUES (?)", (user_id,))
    conn.commit()

def set_gender(user_id, gender):
    c.execute("UPDATE users SET gender=? WHERE user_id=?", (gender, user_id))
    conn.commit()

def get_gender(user_id):
    c.execute("SELECT gender FROM users WHERE user_id=?", (user_id,))
    row = c.fetchone()
    return row[0] if row else None

def set_vip(user_id):
    c.execute("UPDATE users SET is_vip=1 WHERE user_id=?", (user_id,))
    conn.commit()

def is_vip(user_id):
    c.execute("SELECT is_vip FROM users WHERE user_id=?", (user_id,))
    row = c.fetchone()
    return row[0] == 1 if row else False

def set_partner(user1, user2):
    c.execute("UPDATE users SET in_chat=1, partner_id=? WHERE user_id=?", (user2, user1))
    c.execute("UPDATE users SET in_chat=1, partner_id=? WHERE user_id=?", (user1, user2))
    conn.commit()

def get_partner(user_id):
    c.execute("SELECT partner_id FROM users WHERE user_id=?", (user_id,))
    row = c.fetchone()
    return row[0] if row else None

def disconnect(user_id):
    c.execute("UPDATE users SET in_chat=0, partner_id=NULL WHERE user_id=?", (user_id,))
    c.execute("DELETE FROM queue WHERE user_id=?", (user_id,))
    conn.commit()

def add_to_queue(user_id, preferred_gender):
    c.execute("INSERT OR REPLACE INTO queue (user_id, preferred_gender) VALUES (?, ?)", (user_id, preferred_gender))
    conn.commit()

def find_match(user_id, my_gender, preference):
    c.execute("SELECT user_id FROM queue WHERE user_id != ?", (user_id,))
    for row in c.fetchall():
        partner_id = row[0]
        partner_gender = get_gender(partner_id)
        if preference in (None, partner_gender):
            c.execute("DELETE FROM queue WHERE user_id=?", (partner_id,))
            c.execute("DELETE FROM queue WHERE user_id=?", (user_id,))
            conn.commit()
            return partner_id
    return None

# Bot Handlers
@dp.message_handler(commands=['start'])
async def start(message: types.Message):
    add_user(message.from_user.id)
    await message.answer("👋 Welcome! Please set your gender:\n/male or /female")

@dp.message_handler(commands=['male', 'female'])
async def set_user_gender(message: types.Message):
    gender = message.text[1:]
    set_gender(message.from_user.id, gender)
    await message.answer(f"✅ Gender set to {gender}. Use /chat to find a partner.")

@dp.message_handler(commands=['vip'])
async def vip(message: types.Message):
    set_vip(message.from_user.id)
    await message.answer("🎉 You are now a VIP user!")

@dp.message_handler(commands=['chat'])
async def chat(message: types.Message):
    uid = message.from_user.id
    if is_vip(uid):
        await message.answer("Select preferred gender:\n/prefer_male\n/prefer_female\n/random")
    else:
        add_to_queue(uid, None)
        await try_to_connect(uid)

@dp.message_handler(commands=['prefer_male', 'prefer_female', 'random'])
async def vip_preference(message: types.Message):
    uid = message.from_user.id
    if not is_vip(uid):
        await message.answer("⚠️ VIP only. Use /vip to upgrade.")
        return
    pref = message.text.split('_')[-1]
    if pref == 'random':
        pref = None
    add_to_queue(uid, pref)
    await try_to_connect(uid)

async def try_to_connect(uid):
    gender = get_gender(uid)
    c.execute("SELECT preferred_gender FROM queue WHERE user_id=?", (uid,))
    pref_row = c.fetchone()
    pref = pref_row[0] if pref_row else None
    match = find_match(uid, gender, pref)
    if match:
        set_partner(uid, match)
        await bot.send_message(uid, "✅ Connected! Start chatting.\nUse /abort or /next anytime.")
        await bot.send_message(match, "✅ Connected! Start chatting.\nUse /abort or /next anytime.")
    else:
        await bot.send_message(uid, "⏳ Waiting for a partner...")

@dp.message_handler(commands=['abort'])
async def abort(message: types.Message):
    uid = message.from_user.id
    partner = get_partner(uid)
    disconnect(uid)
    if partner:
        disconnect(partner)
        await bot.send_message(partner, "⚠️ The other user left the chat.")
    await message.answer("❌ Chat ended. Use /chat to find a new partner.")

@dp.message_handler(commands=['next', 'refresh'])
async def next_chat(message: types.Message):
    await abort(message)
    await chat(message)

@dp.message_handler()
async def relay(message: types.Message):
    uid = message.from_user.id
    partner = get_partner(uid)
    if partner:
        await bot.send_message(partner, message.text)
    else:
        await message.answer("💬 You're not in a chat. Use /chat to start.")

# Predefined VIP Users
predefined_vips = [5780432274, 7374613331]
for vip_id in predefined_vips:
    add_user(vip_id)
    set_vip(vip_id)

if __name__ == '__main__':
    executor.start_polling(dp, skip_updates=True)
