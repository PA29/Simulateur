# -*- coding: utf-8 -*-
"""
Created on Tue Feb 12 14:37:48 2019

@author: Loïc
"""

##ajout du dossier au path pour pouvoir importer les modules sans les déplacer dans le site-package d'anaconda
import sys
sys.path.append('C:\\Users\\Loïc\\Documents\\Cours\\PA IntiGrid\\LoadFlow\\GitHub\\Simulateur')
import loadflow_NR_battery as lf
from copy import deepcopy


def listsfromdict(grid):
    #permet de convertir les dictionnaires bus, ligne en listes utilisables
    dict_bus = grid.get('images')
    buses = []
    for bus in dict_bus:
        buses.append([bus.get('data').get('bus'), bus.get('data').get('type'), bus.get('data').get('Theta'), bus.get('data').get('P'), bus.get('data').get('Q'), bus.get('data').get('V'), bus.get('data').get('SOC'), bus.get('data').get('capacity')])
    buses = [[i for i in buses[j] if i!=None] for j in range(len(buses))]
    dict_line = grid.get('lines')
    lines = []
    for line in dict_line:
        lines.append([line.get('data').get('bus1'), line.get('data').get('bus2'), line.get('data').get('r'), line.get('data').get('x'), line.get('data').get('length')])
    return(buses, lines)

def calcul_total(buses, lines, Sb = 1000, Ub = 400, Cs = 0.1, Ps = 500):
    # réalise le calcul lf en prenant en compte les batteries
    lines0 = deepcopy(lines) #évite la modification de lines en entrée
    buses0 = deepcopy(buses)###########################################################################
    # premier calcul avec un consommateur à la place des batteries, on regarde la P au slack et on compare avec le seuil choisi Ps
    Pb = Sb #VA (égal à Sb)
    Qb = Sb #VAR (égal à Sb)
    Ib = Sb/(3**(1/2) * Ub)
    Zb = 3*Ub**2/Sb
    for line in lines0:
        line[2] = line[2]/Zb
        line[3] = line[3]/Zb
        line[4] = line[4]
    for bus in buses0:
        if bus[1] == 'transfo':
            bus[3] = bus[3]/Ub
        if bus[1] == 'consommateur':
            bus[2] = bus[2]*1000/Pb
            bus[3] = bus[3]*1000/Qb
        if bus[1] == 'producteur':
            bus[2] = bus[2]*1000/Pb
            bus[3] = bus[3]/Ub
        if bus[1] == 'stockage':             # conso avec P, Q = 0
            bus[1] = 'consommateur'
            bus[2] = 0
            bus[3] = 0
    Y = lf.construct.Y(lines0, buses0)
    P, Q, t0, v0, Y, liste_buses = lf.construct.powers(Y, buses0)
    powers=[P, Q, t0, v0]
    eps = 10**-6
    m_iter = 50
    V, theta, duree, err, L= lf.calc.lf_nr(Y, powers, eps, m_iter)
    if len(L) < m_iter:
        Pf, Qf = lf.calc.calc_power(theta, V, Y)
    else:
        print('ici')
        return(buses, lines, [bus[0] for bus in buses], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))])
    P_r = Pf*Pb
    ###########################################################################
    ## calcul avec batteries vraiment utilisées ###############################
    buses1 = deepcopy(buses)
    lines1 = lines0
    for bus in buses1:
        if bus[1] == 'transfo':
            bus[3] = bus[3]/Ub
        if bus[1] == 'consommateur':
            bus[2] = bus[2]*1000/Pb
            bus[3] = bus[3]*1000/Qb
        if bus[1] == 'producteur':
            bus[2] = bus[2]*1000/Pb
            bus[3] = bus[3]/Ub
        if bus[1] == 'stockage':             
            if P_r[0] > Ps :
                if bus[3] < Cs:         # conso avec P, Q = 0
                    bus[1] = 'consommateur'
                    bus[2] = 0
                    bus[3] = 0
                if bus[3] > Cs:         # prod avec P=Pbat, V=Vnom
                    bus[1] = 'producteur'
                    bus[2] = bus[2]*1000/Pb
                    bus[3] = 400/Ub
            else :
                if bus[3] < 0.95:       # conso avec P, Q = -Pbatt, -Qbatt
                    bus[1] = 'consommateur'
                    bus[2] = -bus[2]*1000/Pb
                    bus[3] = 0.48 * bus[2]
                else:                   #conso avec P,Q = 0
                    bus[1] = 'consommateur'
                    bus[2] = 0
                    bus[3] = 0
    #############################################################################
    Y1 = lf.construct.Y(lines1, buses1)
    P1, Q1, t01, v01, Y1, liste_buses1 = lf.construct.powers(Y1, buses1)
    powers=[P1, Q1, t01, v01]
    eps = 10**-6
    m_iter = 50
    V1, theta1, duree1, err1, L1= lf.calc.lf_nr(Y1, powers, eps, m_iter)
    if len(L1) < m_iter:
        Pf1, Qf1 = lf.calc.calc_power(theta1, V1, Y1)
        I1 = lf.lines_values.currents(theta1, V1, Y1)
        S1, Sl1 = lf.lines_values.losses(theta1, V1, Y1)
    else:
        print(L1)
        print('la')
        return(buses, lines, [bus[0] for bus in buses], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))])
    ######### retour valeurs réelles #############################################
    P_r1 = Pf1*Pb
    Q_r1 = Qf1*Qb
    V_r1 = V1*Ub
    theta_r1 = theta1
    I_r1 = I1*Ib
    Sl_r1 = Sl1*Sb
    S_r1 = S1*Sb
    ##############################################################################
    
    ######### nouvelles charges batteries ########################################
    buses2 = deepcopy(buses)
    buses2 = maj_batteries(buses2, liste_buses1, P_r1)
    ##############################################################################
    return(buses2, lines, liste_buses1, P_r1, Q_r1, V_r1, theta_r1, I_r1, Sl_r1, S_r1)

def maj_batteries(buses, liste_buses, P):
    # met à jour les charges de batterie d'après la puissance débitée calculée
    # pas demi heure
    pas_temps = 0.5 #heure
    for bus in buses:
        if bus[1] == 'stockage':
            Cmax = bus[4]
            SOC = bus[3]
            id_bus = bus[0]
            for i in range(len(liste_buses)) :
                if liste_buses[i] == id_bus :
                    C = Cmax*SOC
                    # calcul de l'énergie perdue
                    Elost = P[i]*pas_temps
                    C = C - Elost
                    SOC1 = C/Cmax
                    if SOC1 < 0:
                        SOC1 = 0
                    elif SOC1 > 1:
                        SOC1 = 1
                    bus[3] = SOC1
    return(buses)

def lf_ilote(buses, lines, Sb = 1000, Ub = 400, Cs = 0.1):
    #réalise le calcul lf en prenant en compte l'ilotage
    maxPbat = 0
    id_slack = 0
    # nombre batteries, pleines, déchargées
    n_bat, n_full, n_disc = 0, 0, 0
    buses_init = deepcopy(buses)
    for bus in buses_init :
        if bus[1] == 'transfo':
            bus[1] = 'consommateur'
            bus[2] = 0
            bus[3] = 0
        if bus[1] == 'stockage':
            n_bat += 1
            if bus[3] < Cs:
                n_disc +=1
            if bus[3] > 0.95:
                n_full += 1
    # s'il existe au moins une batterie non déchargée
    # et au moins une batterie non pleine
    if n_disc < n_bat and n_full < n_bat:
        for bus in buses_init:
            if bus[1] == 'stockage':
                # si la batterie n'est pas déchargée, elle peut être slack (il en existe au moins une)
                if bus[3] > Cs:
                    if bus[2] > maxPbat:
                        maxPbat = bus[2]
                        id_slack = bus[0]
    #si aucune batterie ne peut délivrer ou absorber de puissance, impossible
    if maxPbat == 0:    
        return(buses, lines, [bus[0] for bus in buses], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))])
    for bus in buses_init:
        if bus[0] == id_slack:
            bus[1] = 'transfo'
            bus[2] = 0.0
            bus[3] = 400
    # on fait un calcul de loadflow en déclenchant les petites batteries dès que la batterie-slack débite (Ps = 0)
    buses2, lines2, liste_buses, P_r, Q_r, V_r, theta_r, I_r, Sl_r, S_r = calcul_total(buses_init, lines, Ps = 0)
    # on regarde quelle puissance (indice de P_r) correspond à la batterie slack
    id_P = id_slack
    for i in range(len(liste_buses)):
        if liste_buses[i] == id_slack:
            id_P = i
    #si la puissance demandée à la batterie slack est supérieure à la puissance qu'elle peut délivrer, impossible
    if P_r[id_P] > Sb*maxPbat: 
        return(buses, lines, [bus[0] for bus in buses], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))])
    #si la batterie slack doit absorber de la puissance mais qu'elle est deja pleine, impossible
    if P_r[id_P] < 0: 
        if buses2[id_P][3] > 0.95:
            return(buses, lines, [bus[0] for bus in buses], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))])
    # on met à jour la charge des batteries
    buses3 = deepcopy(buses)
    buses3 = maj_batteries(buses3, liste_buses, P_r)
    return(buses3, lines2, liste_buses, P_r, Q_r, V_r, theta_r, I_r, Sl_r, S_r)
