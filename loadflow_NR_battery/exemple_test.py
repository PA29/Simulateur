# -*- coding: utf-8 -*-
"""
Created on Tue Jan 15 14:30:07 2019

@author: Loïc
"""
import loadflow_NR as lf
import loadflow_NR.construct
import loadflow_NR.calc
import loadflow_NR.lines_values
import numpy as np

###### valeurs per unit ############################################
Sb = 10*10^3 #VA (à choisir)
Pb = 10000 #W (égal à Sb)
Qb = 10000 #VAR (égal à Sb)
Ub = 400 #V (à choisir)
Ib = Sb/(np.sqrt(3) * Ub) #= 14.4337567297 A (calculé)
Zb = Ub/Ib #= 27.7128129211 Ohm (calculé)
####################################################################

### ligne [bus_1, bus_2, r (ohm/km), x (ohm/km), longueur(km)] ###############
## 1.44 et 0.35 mOhm/km
lines = [[0, 1, 0.00144, 0.00035, 0.2], 
         [0, 2, 0.00144, 0.00035, 0.1], 
         [0, 3, 0.00144, 0.00035, 0.05],
         [0, 9, 0.00144, 0.00035, 0.05],
         [0, 5, 0.00144, 0.00035, 0.1],
         [2, 9, 0.00144, 0.00035, 0.05],
         [4, 3, 0.00144, 0.00035, 0.1],
         [0, 4, 0.00144, 0.00035, 0.05],
         [0, 6, 0.00144, 0.00035, 0.1],
         [0, 10, 0.00144, 0.00035, 0.05],
         [0, 8, 0.00144, 0.00035, 0.5],
         [0, 7, 0.00144, 0.00035, 0.3]]
for line in lines:
    line[2] = line[2]/Zb
    line[3] = line[3]/Zb
##############################################################################  
#représente les bus comme des racines de l'unité et les lignes entre eux
# D=np.exp(2j*np.pi*np.array(lines)[:,0]/len(buses)), np.exp(2j*np.pi*np.array(lines)[:,1]/len(buses))
# plt.plot(np.real(D), np.imag(D))
# plt.scatter(np.real(D), np.imag(D))
##############################################################################

### bus [id_bus, type_bus (0slack, 1conso, 2prod), P ou theta pour slack, Q ou V]
# doit etre triée : tous les prod a la fin, slack au debut
buses = [[0, 0, 0, 400], 
         [1, 1, -9, -9*0.4], 
         [2, 1, -6, -6*0.4],
         [3, 1, 0, 0],
         [4, 1, -5, -2],
         [5, 1, -9, -9*0.4],
         [6, 1, 0, 0],
         [7, 1, -12, -12*0.4],
         [8, 2, 1, 402],
         [9, 2, 2, 400],
         [10, 2, 3, 401]]
buses = sorted(buses, key=lambda buses: buses[1]) #sort by type of bus

for bus in buses:
    if bus[1] == 0:
        bus[3] = bus[3]/Ub
    if bus[1] == 1:
        bus[2] = bus[2]*1000/Pb
        bus[3] = bus[3]*1000/Qb
    if bus[1] == 2:
        bus[2] = bus[2]*1000/Pb
        bus[3] = bus[3]/Ub
#############################################################################

Y = lf.construct.Y(lines, buses)
P, Q, t0, v0 = lf.construct.powers(buses)
powers=[P, Q, t0, v0]
eps = 10**-6
m_iter = 100
V, theta, duree, err, L= lf.calc.lf_nr(Y, powers, eps, m_iter)
if len(L) < m_iter:
    Pf, Qf = lf.calc.calc_power(theta, V, Y)
    I = lf.lines_values.currents(theta, V, Y)
    Sl = lf.lines_values.losses(theta, V, Y)
else:
    print("LE RESEAU N'A PAS PU ETRE RESOLU, VERIFIEZ LES PARAMETRES")

######### retour valeurs réelles #############################################
P_r = Pf*Pb
Q_r = Qf*Qb
V_r = V*Ub
theta_r = theta
I_r = I*Ib
S_r = Sl*Sb
##############################################################################