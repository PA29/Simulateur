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

def calcul_total(buses, lines0, Sb = 1000, Ub = 400, Cs = 0.1, Ps = 500):
    lines = deepcopy(lines0) #évite la modification de lines en entrée
    Pb = Sb #VAR (égal à Sb)
    Qb = Sb #VAR (égal à Sb)
    Ib = Sb/(3**(1/2) * Ub)
    Zb = 3*Ub**2/Sb
    for line in lines:
        line[2] = line[2]/Zb
        line[3] = line[3]/Zb
        line[4] = line[4]
    buses0 = deepcopy(buses)
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
    Y = lf.construct.Y(lines, buses0)
    P, Q, t0, v0, Y, liste_buses = lf.construct.powers(Y, buses0)
    powers=[P, Q, t0, v0]
    eps = 10**-6
    m_iter = 50
    V, theta, duree, err, L= lf.calc.lf_nr(Y, powers, eps, m_iter)
    if len(L) < m_iter:
        Pf, Qf = lf.calc.calc_power(theta, V, Y)
        I = lf.lines_values.currents(theta, V, Y)
        S, Sl = lf.lines_values.losses(theta, V, Y)
    else:
        return({'error'})
    P_r = Pf*Pb
    ###########################################################################
    buses1 = deepcopy(buses)

    if P_r[0] > Ps :
        for bus in buses1:
            if bus[1] == 'transfo':
                bus[3] = bus[3]/Ub
            if bus[1] == 'consommateur':
                bus[2] = bus[2]*1000/Pb
                bus[3] = bus[3]*1000/Qb
            if bus[1] == 'producteur':
                bus[2] = bus[2]*1000/Pb
                bus[3] = bus[3]/Ub
            if bus[1] == 'stockage':             # conso avec P, Q = 0
                if bus[3] < Cs:
                    bus[1] = 'consommateur'
                    bus[2] = 0
                    bus[3] = 0
                if bus[3] > Cs:         # prod avec P=Pbat, V=Vnom
                    bus[1] = 'producteur'
                    bus[2] = bus[2]*1000/Pb
                    bus[3] = 1
    else:
        for bus in buses1:
            if bus[1] == 'transfo':
                bus[3] = bus[3]/Ub
            if bus[1] == 'consommateur':
                bus[2] = bus[2]*1000/Pb
                bus[3] = bus[3]*1000/Qb
            if bus[1] == 'producteur':
                bus[2] = bus[2]*1000/Pb
                bus[3] = bus[3]/Ub
            if bus[1] == 'stockage':             # conso avec P, Q = -Pbatt, -Qbatt
                if bus[3] < 0.95:
                    bus[1] = 'consommateur'
                    bus[2] = -bus[2]*1000/Pb
                    bus[3] = 0.48 * bus[2]
                else:                   #conso avec P,Q = 0
                    bus[1] = 'consommateur'
                    bus[2] = 0
                    bus[3] = 0
        
    #############################################################################
    Y1 = lf.construct.Y(lines, buses1)
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
        return({'error'})
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
    pas_temps = 0.5 #heure
    for bus in buses2:
        if bus[1] == 'stockage':
            Cmax = bus[4]
            SOC = bus[3]
            id_bus = bus[0]
            for i in range(len(liste_buses1)) :
                if liste_buses1[i] == id_bus :
                    C = Cmax*SOC
                    Elost = P_r1[i]*pas_temps
                    C = C - Elost
                    SOC1 = C/Cmax
                    if SOC1 < 0:
                        SOC1 = 0
                    elif SOC1 > 1:
                        SOC1 = 1
                    bus[3] = SOC1
    ##############################################################################
    return(buses2, lines0, liste_buses1, P_r1, Q_r1, V_r1, theta_r1, I_r1, Sl_r1, S_r1)