import sqlite3;

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

conn.close()