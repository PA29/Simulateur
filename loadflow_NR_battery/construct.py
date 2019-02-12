# -*- coding: utf-8 -*-
"""
Created on Tue Jan 15 11:10:28 2019

@author: Loïc
"""
### ligne [bus_1, bus_2, r (ohm/m), x (ohm/m), longueur(m)]
lines = [[0, 1, 0.02, 0.04, 1], [0, 2, 0.01, 0.03, 1], [1, 2, 0.0125, 0.025, 1]]
### bus [id_bus, type_bus (0slack, 1conso, 2prod), P ou theta pour slack, Q ou V]
buses = [[0, 0, 0, 1.05], [2, 1, -1.0, -2.0], [1, 2, 1.0, 1.04]]
buses = sorted(buses, key=lambda buses: buses[1]) #sort by type of bus

def Y(lines=lines, buses=buses):
    import numpy as np
    n = len(buses)
    Y = np.zeros((n,n), dtype=complex)
    for i in range(n): #termes extra-diagonaux a partir de la liste des lignes
        for line in lines:
            if line[0] == i:
                Y[i][line[1]] = (-1.+0.j)/(line[2]*line[4]+1j*line[3]*line[4])
                Y[line[1]][i] = Y[i][line[1]]
            if line[1] == i:
                Y[i][line[0]] = (-1.+0.j)/(line[2]*line[4]+1j*line[3]*line[4])
                Y[line[0]][i] = Y[i][line[0]]
    for i in range(n): #ajout des termes diagonaux
        Y[i][i] = -sum(Y[i])
    return(Y)

def powers(matY, buses=buses):
    import numpy as np
    #définition des valeurs fixées############################################################################################
    P = np.array([])
    Q = np.array([])
    V = np.array([])
    t0 = np.array([])
    liste = np.array([])
    for bus in buses:
        if bus[1] == 0:
            t0 = np.append(t0, bus[2])
            V = np.append(V, bus[3])
            liste = np.append(liste, bus[0])
    for bus in buses:
        if bus[1] == 1:
            P = np.append(P, bus[2])
            Q = np.append(Q, bus[3])
            V = np.append(V, 1.0)
            t0 = np.append(t0, 0.0)
            liste = np.append(liste, bus[0])
    for bus in buses:
        if bus[1] == 2:
            P = np.append(P, bus[2])
            V = np.append(V, bus[3])
            t0 = np.append(t0, 0.0)
            liste = np.append(liste, bus[0])
    #normalement, comme la liste buses est triée, les producteurs sont après les consommateurs
    Y = [[matY[int(i)][int(j)] for i in liste] for j in liste]
    return(P, Q, t0, V, Y, liste)