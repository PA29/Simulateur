import sqlite3
import numpy as np
#import matplotlib.pyplot as plt

conn = sqlite3.connect('database.db', check_same_thread=False)
cursor = conn.cursor()


def get_coeff(temps1, temps2, entite):
    #importe les coeffs depuis la base de données pour ajuster les puissances grace aux courbes de charge
    conn = sqlite3.connect('database.db', check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute("""SELECT time,coeff FROM """ + entite + """ WHERE (time > ('""" + temps1 + """') AND time < ('""" + temps2 + """'))""")
    X=cursor.fetchall()
    conn.close()
    return(X)
    
conn.close()

#def affichage_courbe_puissance(season,type_conso='RES1_BASE'): #attention échelle des heures fausse"
#    if season==False:
#        coeffs_conso = get_coeff('2018-08-09T08:30:00+02:00', '2018-08-10T08:30:00+02:00',type_conso)
#        coeffs_conso = sorted(coeffs_conso)
#        X=np.arange(0,len(coeffs_conso),1)
#        plt.plot(X,np.transpose(np.array(coeffs_conso))[1])
#    else :
#        coeffs_conso = get_coeff('2018-01-20T08:30:00+02:00', '2018-01-21T08:30:00+02:00',type_conso)
#        coeffs_conso = sorted(coeffs_conso)
#        X=np.arange(0,len(coeffs_conso),1)
#        plt.plot(X,np.transpose(np.array(coeffs_conso))[1])    