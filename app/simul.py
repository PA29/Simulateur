# -*- coding: utf-8 -*-
"""
Created on Thu Feb 28 15:14:38 2019

@author: Loïc
"""

from .database import get_coeff
from loadflow_NR_battery import total_lf
from copy import deepcopy
import numpy as np
import json

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)
    
def convert_ilotage(season, ilotage):
    #convertit les données d'ilotage en dates utilisables
    if ilotage == None:
        #si pas d'ilotage, on retourne quand meme un double str pour faciliter le traitement
        return('0','0')
    #ilotage est sous forme de 2 chiffres, on convertit en heures de debut et fin
    if ilotage.get('ilotagePermanent') == True:
        if season == False:
            t1 = '2018-08-09T08:30:00+02:00'
            t2 = '2018-08-10T08:30:00+02:00'
        if season == True:
            t1 = '2018-01-20T08:30:00+02:00'
            t2 = '2018-01-21T08:30:00+02:00'
        return (t1, t2)
    debut = ilotage.get('beg')
    fin = ilotage.get('end')
    if season == False:
        if len(str(debut))==1:
            t1 = '2018-08-09T0'+str(debut)+':30:00+02:00'
        else :
            t1 = '2018-08-09T'+str(debut)+':30:00+02:00'
        if len(str(fin))==1:
            t2 = '2018-08-09T0'+str(fin)+':30:00+02:00'
        else :
            t2 = '2018-08-09T'+str(fin)+':30:00+02:00'
    else :
        if len(str(debut))==1:
            t1 = '2018-01-20T0'+str(debut)+':30:00+02:00'
        else :
            t1 = '2018-01-20T'+str(debut)+':30:00+02:00'
        if len(str(fin))==1:
            t2 = '2018-01-20T0'+str(fin)+':30:00+02:00'
        else :
            t2 = '2018-01-20T'+str(fin)+':30:00+02:00'
    return(t1, t2)
        
    
def run_simul(grid, jsonParam):   
    B, L = total_lf.listsfromdict(grid)
    
    ###########################################
    # obtention des paramètres de calcul
    print(type(jsonParam))
    ilotage = jsonParam.get('ilotage')
    season = jsonParam.get('season')
    # debut et fin d'ilotage
    t1, t2 = convert_ilotage(season, ilotage)
    ###########################################
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
    coeffs = [[coeffs_conso[i][0], coeffs_conso[i][1], coeffs_prod[i][1]]for i in range(len(coeffs_conso))] #coeffs_conso[~][0] : heure , coeffs_conso[~][1] :coeff de consommateur type , coeffs_conso[~][2] :coeff de producteur type
    ###########################################################################
    buses, lines, liste_buses, P, Q, V, theta, I, Sl, S = [],[],[],[],[],[],[],[],[],[]
    times = []
    busest = []
    
    ##### Définition de P_seuil_batteries des batteries à partir de la puissance à t=0 du slack
    
    busesp=deepcopy(B)
    for bus in busesp:
        if bus[1]=='consommateur':
            bus[2]=bus[2]*coeffs[0][1]
            bus[3]=bus[3]*coeffs[0][1]
        if bus[1]=='producteur':
            bus[2]=bus[2]*coeffs[0][2]
        if bus[1]=='stockage':
            #pour cette première étape les batteries sont consideres comme des consommateurs nuls
            bus[1]='consommateur'
            bus[2]=0  
            bus[3]=0
    busesp, linesp, liste_busesp, Pp, Qp, Vp, thetap, Ip, Slp, Sp = total_lf.calcul_total(busesp, L)
    
    P_seuil_batteries=Pp[0]

    #######Calcul de P, Q, V, theta pour tous les t 
    
    for coeff in coeffs :
        times.append(coeff[0])
        buses0 = deepcopy(B)
        for bus in buses0:
            if bus[1] == 'consommateur':
                bus[2] = bus[2]*coeff[1]
                bus[3] = bus[3]*coeff[1]
            if bus[1] == 'producteur':
                bus[2] = bus[2]*coeff[2]
            #on veut la nouvelle charge des batteries
            #on reprend celle calculée à l'itération précédente
            if bus[1] == 'stockage':
                for buz in busest:
                    if buz[0] == bus[0]:
                        bus[3] = buz[3]

        # si on est sur une heure d'ilotage, calcul iloté
        if coeff[0] > t1 and coeff[0] < t2:
            busest, linest, liste_busest, Pt, Qt, Vt, thetat, It, Slt, St = total_lf.lf_ilote(buses0, L)
        # sinon, calcul classique
        else:
            busest, linest, liste_busest, Pt, Qt, Vt, thetat, It, Slt, St = total_lf.calcul_total(buses0, L, Ps = P_seuil_batteries)
        buses, lines, liste_buses, P, Q, V, theta, I, Sl, S = buses+[busest], lines+[linest], liste_buses+[liste_busest], P+[Pt], Q+[Qt], V+[Vt], theta+[thetat], I+[It], Sl+[Slt], S+[St]
    return({"heures":times, "buses":buses, "lines":lines, "liste_bus":liste_buses, "P":P, "Q":Q, "V":V, "theta":theta, "abs(I)":[[[abs(xi) for xi in x] for x in i] for i in I], "abs(Sl)":[[[abs(xi) for xi in x] for x in sl] for sl in Sl], "abs(S)":[[[abs(xi) for xi in x] for x in s] for s in S]})
