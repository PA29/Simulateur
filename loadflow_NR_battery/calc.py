# -*- coding: utf-8 -*-
"""
Created on Tue Jan 15 11:23:33 2019

@author: Loïc
"""
import numpy as np

def gauss_seidel(Y,P,Q,t,v,n_iter):
    nb_cons=len(Q)
    nb_prod=len(P)-len(Q)
    for iteration in range(n_iter):
        for i in range(len(P)):
            if Y[i+1][i+1]!=0 and v[i+1]!=0:
                Ui=v[i+1]*complex(np.cos(t[i+1]),np.sin(t[i+1]))
                Yii=Y[i+1][i+1]
                Pi=P[i]
                if i<nb_cons:
                    Qi=Q[i]
                    Ui=1/Yii*complex(Pi,-Qi)/Ui.conjugate()
                    for k in range(len(P)):
                        if k!=i:
                            Yik=Y[i+1][k+1]
                            Uk=v[k+1]
                            Ui-=1/Yii*Yik*Uk
                    v[i+1]=np.absolute(Ui)
                    t[i+1]=np.angle(Ui)
                else:
                    Si=0
                    for k in range(len(P)):
                        Yik=Y[i+1][k+1]
                        Uk=v[k+1]
                        Si+=Yik.conjugate()*Uk.conjugate()
                    Si*=Ui
                    Qi=Si.imag
                    Ui=1/Yii*complex(Pi,-Qi)/Ui.conjugate()
                    for k in range(len(P)):
                        if k!=i:
                            Yik=Y[i+1][k+1]
                            Uk=v[k+1]
                            Ui-=1/Yii*Yik*Uk
                    t[i+1]=np.angle(Ui)
                
                    

def lf_nr(Y, powers, eps, m_iter):
    import numpy as np
    import time
    P = powers[0]
    Q = powers[1]
    t0 = powers[2]
    v0 = powers[3]
    #gauss_seidel(Y,P,Q,t0,v0,3)
    n = len(P)+1
    r = len(Q)
    #décomposition de Yij en A*exp(j*phi)
    angleY = np.angle(Y)
    magnY = np.absolute(Y)
    #spécification des conditions initiales##################################################################################
    t = 0 #initialisation du compteur d'itérations
    converged = False #booléen traduisant la convergence
    ## calcul des valeurs calculées de P et Q, et des deltaP deltaQ
    Pcalc = np.zeros(len(P)) # /!\ P est le même pour les noeuds PV ET PQ
    Qcalc = np.zeros(len(Q))
    for k in range(r):
        for i in range(n):
            Pcalc[k] = Pcalc[k] + v0[i]*v0[1+k]*magnY[1+k][i]*np.cos(angleY[1+k][i] - t0[1+k] + t0[i])
            Qcalc[k] = Qcalc[k] - v0[i]*v0[1+k]*magnY[1+k][i]*np.sin(angleY[1+k][i] - t0[1+k] + t0[i])
    for k in range(n-r-1):
        for i in range(n):
            Pcalc[k+r] += v0[i]*v0[1+k+r]*magnY[1+k+r][i]*np.cos(angleY[1+k+r][i] - t0[1+k+r] + t0[i])
    deltaP0 = P - Pcalc
    deltaQ0 = Q - Qcalc
    ## itérations de la méthode de Newton par construction de la Jacobienne et résolution
    # début de la boucle ######################################################################################################
    duree0 = time.clock()
    L = []
    while converged == False and t < m_iter:
        t += 1
        #on forme la jacobienne
        #[[dP/dtheta, dP/dV],[dQ/dtheta, dQ/dV]]
        #[[J1 J2];[J3 J4]]
        #dP/dtheta
        J11 = np.zeros((n-1, n-1))
        for i in range(n-1):
            for k in range(n-1):
                if k != i :
                    J11[i][k] = -v0[1+i]*v0[1+k]*magnY[1+i][1+k]*np.sin(angleY[1+i][1+k] - t0[1+i] + t0[1+k])#le slack (1) compte pas
            for j in range(n): #le slack (bus 1) compte ici
                if j != 1+i :
                    J11[i][i] += v0[1+i]*v0[j]*magnY[1+i][j]*np.sin(angleY[1+i][j] - t0[1+i] + t0[j])
        #dP/dV
        J12 = np.zeros((n-1, r))
        for i in range(n-1):
            for k in range(r):
                if k != i :
                    J12[i][k] = v0[1+i]*magnY[1+i][1+k]*np.cos(angleY[1+i][1+k] - t0[1+i] + t0[1+k])
            if i < r:
                for j in range(n):
                    if j != i+1:
                        J12[i][i] += v0[j]*magnY[1+i][j]*np.cos(angleY[1+i][j] - t0[1+i] + t0[j])
                J12[i][i] += 2*v0[1+i]*magnY[1+i][1+i]*np.cos(angleY[1+i][1+i])
        #dQ/dtheta
        J21 = np.zeros((r, n-1))
        for i in range(r):
            for k in range(n-1):
                if k != i :
                    J21[i][k] = -v0[1+i]*v0[1+k]*magnY[1+i][1+k]*np.cos(angleY[1+i][1+k] - t0[1+i] + t0[1+k])
            if i < r:
                for j in range(n):
                    if j != i+1:
                        J21[i][i] += v0[1+i]*v0[j]*magnY[1+i][j]*np.cos(angleY[1+i][j] - t0[1+i] + t0[j])
        #dQ/dV
        J22 = np.zeros((r, r))
        for i in range(r):
            for k in range(r):
                if k != i :
                    J22[i][k] = -v0[1+i]*magnY[1+i][1+k]*np.sin(angleY[1+i][1+k] - t0[1+i] + t0[1+k])
            for j in range(n):
                if j != i+1:
                    J22[i][i] += -v0[j]*magnY[1+i][j]*np.sin(angleY[1+i][j] - t0[1+i] + t0[j])
            J22[i][i] += -2*v0[1+i]*magnY[1+i][1+i]*np.sin(angleY[1+i][1+i])
                
        #on construit J
        J1 = np.concatenate((J11,J12), axis=1)
        J2 = np.concatenate((J21,J22), axis=1)
        J = np.concatenate((J1,J2))
        #on construit la matrice des deltas (membre gauche)
        DELTA = np.concatenate((deltaP0, deltaQ0))
        #on résout le système Delta = J * Delta_e
        deltaE = np.linalg.solve(J,DELTA)
        
        #on trouve theta1 et v1
        for i in range(n-1):
            t0[i+1] = t0[i+1] + deltaE[i]
        #t0 = abs(t0%(2*np.pi)) # angle theta modulo 2pi
        for i in range(r):
            v0[i+1] = v0[i+1] + deltaE[n-1+i]
        v0 = abs(v0)
        
        #on substitue ces valeurs dans les équations pour obtenir deltaP1, deltaQ1
        Pcalc = np.zeros(len(P))
        Qcalc = np.zeros(len(Q))
        for k in range(r):
            for i in range(n):
                Pcalc[k] = Pcalc[k] + v0[i]*v0[1+k]*magnY[1+k][i]*np.cos(angleY[1+k][i] - t0[1+k] + t0[i])
                Qcalc[k] = Qcalc[k] - v0[i]*v0[1+k]*magnY[1+k][i]*np.sin(angleY[1+k][i] - t0[1+k] + t0[i])
        for k in range(n-r-1):
            for i in range(n):
                Pcalc[k+r] += v0[i]*v0[1+k+r]*magnY[1+k+r][i]*np.cos(angleY[1+k+r][i] - t0[1+k+r] + t0[i])
        deltaP0 = P - Pcalc
        deltaQ0 = Q - Qcalc
                
        err =  max(np.abs(np.concatenate((deltaP0,deltaQ0))))    
        if err < eps :
            converged = True
        L = np.append(L, err)
    # on relève le temps de calcul
    duree = time.clock() - duree0
    return(v0, t0, duree, err, L)

def calc_power(t0, v0, Y):
    import numpy as np
    magnY = np.absolute(Y)
    angleY = np.angle(Y)
    n = len(t0)
    import numpy as np
    P = np.zeros(n)
    Q = np.zeros(n)
    for i in range (n):
        for j in range(n):
            P[i] += v0[i]*v0[j]*magnY[i][j]*np.cos(angleY[i][j] - t0[i] + t0[j])
            Q[i] -= v0[i]*v0[j]*magnY[i][j]*np.sin(angleY[i][j] - t0[i] + t0[j])
    return(P, Q)
    