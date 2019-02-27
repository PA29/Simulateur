import sqlite3
import numpy as np
import json
from json import dumps

conn = sqlite3.connect('database.db', check_same_thread=False)
cursor = conn.cursor()


def get_coeff(temps1, temps2, entite):
    conn = sqlite3.connect('database.db', check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute("""SELECT time,coeff FROM """ + entite + """ WHERE time > ('""" + temps1 + """') AND time < ('""" + temps2 + """')""")
    return(cursor.fetchall())

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)
    
conn.close()