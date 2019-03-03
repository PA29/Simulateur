# -*- coding: utf-8 -*-
"""
Created on Thu Feb 28 15:14:38 2019

@author: Loïc
"""

from .database import *
from loadflow_NR_battery import total_lf
from copy import deepcopy
import numpy as np
import json

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

def run_simul(grid, json):   
    B, L = total_lf.listsfromdict(grid)
    
    ###########################################
    #si ilotage=true
    #   heures_ilotage = json.get(heures_ilotage)
    ###########################################
    
    #changer les coeff en fonction de la saison ###############################
    season = json.get('season')
    if season == False :
        coeffs_conso = get_coeff('2018-08-09T08:30:00+02:00', '2018-08-10T08:30:00+02:00', 'RES1_BASE')
        coeffs_conso = sorted(coeffs_conso)
        coeffs_prod = get_coeff('2018-08-09T08:30:00+02:00', '2018-08-10T08:30:00+02:00', 'PRD3_BASE')
        coeffs_prod = sorted(coeffs_prod)
    else :
        coeffs_conso = get_coeff('2018-01-20T08:30:00+02:00', '2018-01-21T08:30:00+02:00', 'RES1_BASE')
        coeffs_conso = sorted(coeffs_conso)
        coeffs_prod = get_coeff('2018-01-20T08:30:00+02:00', '2018-01-20T08:30:00+02:00', 'PRD3_BASE')
        coeffs_prod = sorted(coeffs_prod)
    coeffs = [[coeffs_conso[i][0], coeffs_conso[i][1], coeffs_prod[i][1]]for i in range(len(coeffs_conso))]
    ###########################################################################
    buses, lines, liste_buses, P, Q, V, theta, I, Sl, S = [],[],[],[],[],[],[],[],[],[]
    times = []
    busest = []
    for coeff in coeffs :
        times.append(coeff[0])
        buses0 = deepcopy(B)
        for bus in buses0:
            if bus[1] == 'consommateur':
                bus[2] = bus[2]*coeff[1]
                bus[3] = bus[3]*coeff[1]
            if bus[1] == 'producteur':
                bus[2] = bus[2]*coeff[2]
            #if bus[1] == 'transfo':
            #   if coeff[0][0] in heures_ilotage:
            #       bus[1] = 'consommateur'
            #       bus[2] = 0
            #       bus[3] = 0
            #on veut la nouvelle charge des batteries
            if bus[1] == 'stockage':
                for buz in busest:
                    if buz[0] == bus[0]:
                        bus[3] = buz[3]
        busest, linest, liste_busest, Pt, Qt, Vt, thetat, It, Slt, St = total_lf.calcul_total(buses0, L)
        buses, lines, liste_buses, P, Q, V, theta, I, Sl, S = buses+[busest], lines+[linest], liste_buses+[liste_busest], P+[Pt], Q+[Qt], V+[Vt], theta+[thetat], I+[It], Sl+[Slt], S+[St]
    return({"heures":times, "buses":buses, "lines":lines, "liste_bus":liste_buses, "P":P, "Q":Q, "V":V, "theta":theta, "abs(I)":[[abs(xi) for xi in x] for x in I], "abs(Sl)":[[abs(xi) for xi in x] for x in Sl], "abs(S)":[[abs(xi) for xi in x] for x in S]})