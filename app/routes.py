# -*- coding: utf-8 -*-
"""
Created on Tue Nov 20 17:31:24 2018

@author: Tanguy
"""

from functions import render_template
from app import app

@app.route('/')
@app.route('/index')
@app.route('/accueil')
def accueil():
    return render_template('accueil')

@app.route('/reseau')
def reseau():
    return render_template('reseau')

@app.route('/resultats')
def resultats():
    return render_template('resultats')