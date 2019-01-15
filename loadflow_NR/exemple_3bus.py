# -*- coding: utf-8 -*-
"""
Created on Tue Jan 15 14:30:07 2019

@author: Loïc
"""
import loadflow_NR as lf
import loadflow_NR.construct
import loadflow_NR.calc
import loadflow_NR.lines_values
### ligne [bus_1, bus_2, r (ohm/m), x (ohm/m), longueur(m)]
lines = [[0, 1, 0.02, 0.04, 1], [0, 2, 0.01, 0.03, 1], [1, 2, 0.0125, 0.025, 1]]
### bus [id_bus, type_bus (0slack, 1conso, 2prod), P ou theta pour slack, Q ou V]
buses = [[0, 0, 0, 1.05], [2, 2, -1.0, -2.0], [1, 1, 1.0, 1.0]]
buses = sorted(buses, key=lambda buses: buses[1]) #sort by type of bus

Y = lf.construct.Y(lines, buses)
P, Q, t0, v0 = lf.construct.powers(buses)
powers=[P, Q, t0, v0]
eps = 10**-5
m_iter = 100
V, theta, duree, err, L = lf.calc.lf_nr(Y, powers, eps, m_iter)
P, Q = lf.calc.calc_power(theta, V, Y)
I = lf.lines_values.currents(theta, V, Y)
Sl = lf.lines_values.losses(theta, V, Y)