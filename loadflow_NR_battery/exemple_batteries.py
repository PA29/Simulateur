# -*- coding: utf-8 -*-
"""
Created on Tue Jan 15 14:30:07 2019

@author: Loïc
"""
import sys
#ajout du dossier au path pour pouvoir importer les modules sans les déplacer dans le site-package d'anaconda
sys.path.append('C:\\Users\\Loïc\\Documents\\Cours\\PA IntiGrid\\LoadFlow')
import loadflow_NR_battery as lf
import loadflow_NR_battery.construct
import loadflow_NR_battery.calc
import loadflow_NR_battery.lines_values
from copy import deepcopy
import numpy as np

###### valeurs per unit ############################################
Sb = 1000 #VA (à choisir)
Pb = 1000 #W (égal à Sb)
Qb = 1000 #VAR (égal à Sb)
Ub = 400 #V (à choisir)
Ib = Sb/(3**(1/2) * Ub) #= 14.4337567297 A (calculé)
Zb = 3*Ub**2/Sb #= 27.7128129211 Ohm (calculé)
####################################################################

#############################################################################

### ligne [bus_1, bus_2, r (ohm/km), x (ohm/km), longueur(km)] ###############
## 0.44 et 0.35 mOhm/km (alu torsadé 70mm^2)
r, x = 0.44, 0.35
lines = [[0, 1, r, x, 0.1], 
         [1, 2, r, x, 0.1], 
         [2, 3, r, x, 0.2],
         [3, 4, r, x, 0.3],
         [4, 5, r, x, 0.1],
         [0, 6, r, x, 0.7],
         [6, 7, r, x, 0.6],
         [7, 8, r, x, 0.5],
         [6, 9, r, x, 0.1],
         [9, 10, r, x, 0.5],
         [0, 11, r, x, 0.25],
         [11, 3, r, x, 0.3]]
for line in lines:
    line[2] = line[2]/Zb
    line[3] = line[3]/Zb
    line[4] = line[4]
##############################################################################  

### bus [id_bus, type_bus (0slack, 1conso, 2prod, 3bat), P ou theta pour slack, Q ou V]
buses = [[0, 0, 0, 400], 
         [1, 1, -9, -9*0.48], 
         [2, 1, -6, -6*0.48],
         [3, 1, 0, 0],
         [4, 1, -6, -6*0.48],
         [5, 2, 9, 400],
         [6, 1, 0, 0],
         [7, 1, -12, -12*0.48],
         [8, 1, -12, -12*0.48],
         [9, 2, 3, 400],
         [10, 3, 2, 0.2, 10000],
         [11, 1, -5, -5*0.48]] #id, type, P (kW, 0.01W à 10 MW), state of charge(%), capacity Wh (1kWh à 10MWh)
buses0 = deepcopy(buses)
#############################################################################
####### calcul sans les batteries
for bus in buses0:
    if bus[1] == 0:
        bus[3] = bus[3]/Ub
    if bus[1] == 1:
        bus[2] = bus[2]*1000/Pb
        bus[3] = bus[3]*1000/Qb
    if bus[1] == 2:
        bus[2] = bus[2]*1000/Pb
        bus[3] = bus[3]/Ub
    if bus[1] == 3:             # conso avec P, Q = 0
        bus[1] = 1
        bus[2] = 0
        bus[3] = 0
    
#############################################################################

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
    print("LE RESEAU N'A PAS PU ETRE RESOLU, VERIFIEZ LES PARAMETRES")

######### retour valeurs réelles #############################################
P_r = Pf*Pb
Q_r = Qf*Qb
V_r = V*Ub
theta_r = theta
I_r = I*Ib
Sl_r = Sl*Sb
S_r = S*Sb
##############################################################################
 # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
####### calcul avec les batteries, en fonction des parametres calculés ######
Cs = 0.1
Ps = 10000
buses1 = deepcopy(buses)

if P_r[0] > Ps :
    for bus in buses1:
        if bus[1] == 0:
            bus[3] = bus[3]/Ub
        if bus[1] == 1:
            bus[2] = bus[2]*1000/Pb
            bus[3] = bus[3]*1000/Qb
        if bus[1] == 2:
            bus[2] = bus[2]*1000/Pb
            bus[3] = bus[3]/Ub
        if bus[1] == 3:             # conso avec P, Q = 0
            if bus[3] < Cs:
                bus[1] = 1
                bus[2] = 0
                bus[3] = 0
            if bus[3] > Cs:         # prod avec P=Pbat, V=Vnom
                bus[1] = 2
                bus[2] = bus[2]*1000/Pb
                bus[3] = 1
else:
    for bus in buses1:
        if bus[1] == 0:
            bus[3] = bus[3]/Ub
        if bus[1] == 1:
            bus[2] = bus[2]*1000/Pb
            bus[3] = bus[3]*1000/Qb
        if bus[1] == 2:
            bus[2] = bus[2]*1000/Pb
            bus[3] = bus[3]/Ub
        if bus[1] == 3:             # conso avec P, Q = -Pbatt, -Qbatt
            if bus[3] < 0.95:
                bus[1] = 1
                bus[2] = -bus[2]*1000/Pb
                bus[3] = 0.48 * bus[2]
            else:                   #conso avec P,Q = 0
                bus[1] = 1
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
    print("LE RESEAU N'A PAS PU ETRE RESOLU, VERIFIEZ LES PARAMETRES")

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
    if bus[1] == 3:
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

############### Représentations ##############################################
import matplotlib.pyplot as plt
plt.close('all')
plt.figure('Réseau')
D=np.exp(2j*np.pi*np.array(lines)[:,0]/len(buses)), np.exp(2j*np.pi*np.array(lines)[:,1]/len(buses))
plt.plot(np.real(D), np.imag(D), color='green')
plt.scatter(np.real(D), np.imag(D), color='red')
plt.figure('Puissances')
plt.bar(liste_buses1, P_r1, color='#a12b54')
plt.figure('Tensions')
plt.bar(liste_buses1, V_r1-380, bottom=380, color='gold')
plt.figure('Intensités')
plt.imshow(np.abs(I_r1), cmap='CMRmap')
plt.colorbar()
