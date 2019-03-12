# -*- coding: utf-8 -*-
"""
Created on Tue Nov 20 17:36:49 2018

@author: Tanguy
"""

from app import app

app.secret_key = 'Un super PA de qualite'
app.run(debug=True)