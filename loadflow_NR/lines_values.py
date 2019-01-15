# -*- coding: utf-8 -*-
"""
Created on Tue Jan 15 14:22:08 2019

@author: Loïc
"""

def currents(t0, v0, Y):
    import numpy as np
    n = len(t0)
    V = v0*np.exp(1j*t0)
    I = np.zeros((n,n), dtype=complex)
    for i in range(n):
        for j in range(n):
            I[i][j] = Y[i][j] * (V[i] - V[j])
    return(I)

def losses(t0, v0, Y):
    import numpy as np
    n = len(t0)
    V = v0*np.exp(1j*t0)
    I = np.zeros((n,n), dtype=complex)
    for i in range(n):
        for j in range(n):
            I[i][j] = Y[i][j] * (V[i] - V[j])
    S = np.zeros((n,n), dtype=complex)
    for i in range(n):
        for j in range(n):
            S[i][j] = V[i] * np.conj(I[i][j])
    Sl = np.zeros((n,n), dtype=complex)
    for i in range(n):
        for j in range(n):
            Sl[i][j] = S[i][j] + S[j][i]
    return(Sl)