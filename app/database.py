import sqlite3

conn = sqlite3.connect('database.db', check_same_thread=False)
cursor = conn.cursor()


def get_coeff(temps1, temps2, entite):
    #importe les coeffs depuis la base de données pour ajuster les puissances grace aux courbes de charge
    conn = sqlite3.connect('database.db', check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute("""SELECT time,coeff FROM """ + entite + """ WHERE (time > ('""" + temps1 + """') AND time < ('""" + temps2 + """'))""")
    return(cursor.fetchall())
    
conn.close()