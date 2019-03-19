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
        buses.append([bus.get('bus'), bus.get('type'), bus.get('Theta'), bus.get('P'), bus.get('Q'), bus.get('V'), bus.get('SOC'), bus.get('capacity')])
    buses = [[i for i in buses[j] if i!=None] for j in range(len(buses))]
    dict_line = grid.get('lines')
    lines = []
    for line in dict_line:
        lines.append([line.get('bus1'), line.get('bus2'), line.get('r'), line.get('x'), line.get('length')])
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
        return(buses, lines, [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))])
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
        return(buses, lines, [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))])
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
    return(buses2, lines, P_r1, Q_r1, V_r1, theta_r1, I_r1, Sl_r1, S_r1)

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
                    if bus[1] == 'stockage':
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

def lf_ilote(buses, lines, Sb = 1000, Ub = 400, Cs = 0.05):
    Y1 = lf.construct.Y(lines, buses)
    P1, Q1, t01, v01, Y1, liste_buses = lf.construct.powers(Y1, buses)
    therearebatteries = False
    battery_chosen = False
    buses_init = deepcopy(buses)
    for bus in buses_init :
        if bus[1] == 'stockage':
            therearebatteries = True
    if therearebatteries == False:
        return(buses, lines, [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))])
    buses_iter = deepcopy(buses_init)
    while battery_chosen == False:
        for bus in buses_iter :
            if bus[1] == 'transfo':
                bus[1] = 'consommateur'
                bus[2] = 0
                bus[3] = 0
        ##### on regarde si toutes les batteries sont pleines, auquel cas on déconnecte le plus petit producteur #####
        n_batt, n_full = 0, 0
        for bus in buses_init :
            if bus[1] == 'stockage':
                n_batt+=1
                if bus[4] > 0.95:
                    n_full+=1
        if n_batt == n_full:
            P_min = float('inf')
            for bus in buses_init :
                if bus[1] == 'producteur':
                    if bus[2] < P_min:
                        P_max = bus[2]
                        id_deco = bus[0]
            #si il n'y a pas de producteurs, réseau peut pas être résolu
            if P_min == float('inf'):
                return(buses, lines, [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))])
            for bus in buses_init:
                if bus[0] == id_deco:
                    if bus[1] == 'producteur':
                        bus[2] = 0.0
                        bus[3] = 400
        ##########################################################################################################
        # a chaque nouvelle itération, les batteries qui n'ont pas marché sont soit full soit empty, c'est donc (j'explique pas tout) des consommateurs nuls
        P_max = 0
        for bus in buses_init:
            if bus[1] == 'stockage':
                if bus[2] > P_max:
                    P_max = bus[2]
                    id_slack = bus[0]
        for bus in buses_init:
            if bus[0] == id_slack:
                if bus[1] == 'stockage':
                    bus[1] = 'transfo'
                    bus[2] = 0.0
                    bus[3] = 400
        # on fait un calcul de loadflow en déclenchant les petites batteries dès que la batterie-slack débite (Ps = 0)
        buses2, lines2, P_r, Q_r, V_r, theta_r, I_r, Sl_r, S_r = calcul_total(buses_init, lines, Ps = 0)
        # on regarde quelle puissance (indice de P_r) correspond à la batterie slack
        id_P = id_slack
        for i in range(len(liste_buses)):
            if buses2[liste_buses[i]] == id_slack:
                id_P = i
        #si la puissance demandée à la batterie slack est supérieure à la puissance qu'elle peut délivrer, impossible
        if P_r[id_P] > 0: 
            if P_r[id_P] < P_max:
                for bus in buses_init:
                    if bus[0] == id_slack:
                        SOC = bus[4]
                if SOC > 0:
                    battery_chosen = True
            else:
                return(buses, lines, [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))])
        else:
            for bus in buses_init:
                if bus[0] == id_slack:
                    SOC = bus[4]
            if SOC < 1:
                battery_chosen = True
    buses3 = deepcopy(buses)
    buses3 = maj_batteries(buses3, liste_buses, P_r)
    P_f, Q_f, V_f, theta_f, I_f, Sl_f, S_f = [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [0 for i in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))], [[0 for i in range(len(buses))] for j in range(len(buses))]
    for i in range(len(liste_buses)):
        P_f[int(liste_buses[i])] = P_r[i]
        Q_f[int(liste_buses[i])] = Q_r[i]
        V_f[int(liste_buses[i])] = V_r[i]
        theta_f[int(liste_buses[i])] = theta_r[i]
        I_f[int(liste_buses[i])] = I_r[i]
        Sl_f[int(liste_buses[i])] = Sl_r[i]
        S_f[int(liste_buses[i])] = S_r[i]
        for j in range(len(liste_buses)):
            I_f[i][int(liste_buses[j])] = I_r[i][j]
            Sl_f[i][int(liste_buses[j])] = Sl_r[i][j]
            S_f[i][int(liste_buses[j])] = S_r[i][j]
    return(buses3, lines2, P_f, Q_f, V_f, theta_f, I_f, Sl_f, S_f)