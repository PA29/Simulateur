import sqlite3
import numpy as np
import matplotlib.pyplot as plt



grid = {
	'bus': [{'data':{'x': 50, 'y': 30}}, {'data':{'x': 50, 'y': 50}}, {'data':{'x': 25, 'y': 75}}, {'data':{'x': 75, 'y': 75}}, {'data':{'x': 10, 'y': 20}}],
	'lines': [{'data':{'bus1': 0, 'bus2': 1, 'r':0.44, 'x':0.35, 'length': 10}}, {'data':{'bus1': 1, 'bus2': 2, 'r':0.44, 'x':0.35, 'length': 10}}, {'data':{'bus1': 1, 'bus2': 3, 'r':0.44, 'x':0.35,  'length': 10}}, {'data':{'bus1': 2, 'bus2': 3, 'r':0.44, 'x':0.35,  'length': 100}}, {'data':{'bus1': 2, 'bus2': 4, 'r':0.44, 'x':0.35,  'length': 100}}],
	'images': [{'data':{'type': 'transfo', 'x': 50, 'y': 20, 'bus': 0, 'Theta': 0.0, 'V': 400}}, {'data':{'type': 'consommateur', 'x': 50, 'y': 60, 'bus': 1, 'P':-3.0, 'Q':-1.8}}, {'data':{'type': 'stockage', 'x': 20, 'y': 90, 'bus': 2, 'P':12.0, 'SOC':0.8, 'capacity':20000}}, {'data':{'type': 'producteur', 'x': 80, 'y': 50, 'bus': 3, 'P':6, 'V':400}}, {'data':{'type': 'consommateur', 'x': 20, 'y': 20, 'bus': 4, 'P':-6.0, 'Q':-1.5}}]
}

def get_coeff(temps1, temps2, entite):
    #importe les coeffs depuis la base de données pour ajuster les puissances grace aux courbes de charge
    conn = sqlite3.connect('database.db', check_same_thread=False)
    cursor = conn.cursor()
    cursor.execute("""SELECT time,coeff FROM """ + entite + """ WHERE (time > ('""" + temps1 + """') AND time < ('""" + temps2 + """'))""")
    X=cursor.fetchall()
    conn.close()
    return(X)
    



def listsfromdict(grid):
    #permet de convertir les dictionnaires bus, ligne en listes utilisables
    dict_bus = grid.get('images')
    buses = []
    for bus in dict_bus:
         buses.append([bus.get('data').get('bus'), bus.get('data').get('type'), bus.get('data').get('x'), bus.get('data').get('y'), bus.get('data').get('Theta'), bus.get('data').get('P'), bus.get('data').get('Q'), bus.get('data').get('V'), bus.get('data').get('SOC'), bus.get('data').get('capacity')])
    dict_line = grid.get('lines')
    lines = []
    for line in dict_line:
        lines.append([line.get('data').get('bus1'), line.get('data').get('bus2'), line.get('data').get('r'), line.get('data').get('x'), line.get('data').get('length')])
    dict_pos_buses=grid.get('bus')
    pos_buses=[]
    for pos_bus in dict_pos_buses: 
        pos_buses.append([pos_bus.get('data').get('x'), pos_bus.get('data').get('y')])
        
    return(buses, lines, pos_buses)
    
    
def post_grid (nom_scenario,grid): #scenario en str, grid sous forme de dictionnaire
    #Lancer cette fonction qu'une seule fois par scenario
    #A faire : une manière d'écraser un scenario 
    conn = sqlite3.connect('database_scenarios.db')
    cursor = conn.cursor()
    
    buses,lines,pos_buses=listsfromdict(grid)
    cursor.execute("CREATE TABLE IF NOT EXISTS " +nom_scenario + "_buses"+ "(id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE ,bus INTEGER, type TEXT ,x FLOAT, y FLOAT, Theta FLOAT, P FLOAT, Q FLOAT,  V FLOAT, SOC FLOAT, capacity FLOAT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS " +nom_scenario + "_lines"+ "(id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE ,bus1 INTEGER,bus2 INTEGER, r FLOAT, x FLOAT ,length FLOAT)")
    cursor.execute("CREATE TABLE IF NOT EXISTS " +nom_scenario + "_pos_buses"+ "(id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,x FLOAT,y FLOAT)")
    
    for i in range (len(buses)):
        
        data = {"bus": buses[i][0], "type" : buses[i][1], "x" : buses[i][2], "y" : buses[i][3], "Theta": buses[i][4] , "P": buses[i][5], "Q": buses[i][6], "V": buses[i] [7], "SOC": buses[i][8], "capacity": buses[i][9]}
        cursor.execute("INSERT  INTO " +nom_scenario + "_buses"+"(bus, type, x, y, Theta, P, Q, V, SOC, capacity) VALUES(:bus, :type, :x, :y, :Theta, :P, :Q, :V, :SOC, :capacity)", data)
    
    for i in range (len(lines)):
        data = {"bus1": lines[i][0], "bus2" : lines[i][1], "r" : lines[i][2], "x" : lines[i][3], "length": lines[i][4]}
        cursor.execute("INSERT  INTO " +nom_scenario + "_lines"+"(bus1, bus2, r, x , length) VALUES(:bus1, :bus2, :r, :x, :length)", data)
    
    for i in range (len(pos_buses)):
        data = {"x": pos_buses[i][0], "y" : pos_buses[i][1]}
        cursor.execute("INSERT  INTO " +nom_scenario + "_pos_buses"+"(x, y) VALUES(:x, :y)", data)    
    
    conn.commit()
    conn.close()
    

        

def affichage_courbe_puissance(season,type_conso='RES1_BASE'): #attention échelle des heures fausse"
    if season==False:
        coeffs_conso = get_coeff('2018-08-09T08:30:00+02:00', '2018-08-10T08:30:00+02:00',type_conso)
        coeffs_conso = sorted(coeffs_conso)
        X=np.arange(0,len(coeffs_conso),1)
        plt.plot(X,np.transpose(np.array(coeffs_conso))[1])
    else :
        coeffs_conso = get_coeff('2018-01-20T08:30:00+02:00', '2018-01-21T08:30:00+02:00',type_conso)
        coeffs_conso = sorted(coeffs_conso)
        X=np.arange(0,len(coeffs_conso),1)
        plt.plot(X,np.transpose(np.array(coeffs_conso))[1])    
        
        

