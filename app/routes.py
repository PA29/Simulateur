# -*- coding: utf-8 -*-
"""
Created on Tue Nov 20 17:31:24 2018

@author: Tanguy
"""

from .functions import render_template
from app import app
from database import cursor
from flask import jsonify

@app.route('/')
@app.route('/index')
@app.route('/accueil')
def accueil():
    return render_template('accueil', background = "accueil.jpg")

@app.route('/main')
def main():
    return render_template('main')

@app.route('/edition')
def edition():
	return jsonify({'leftPanel': '', 'centerPanel': '<input id="switch" type="button">', 'rightPanel': ''});

@app.route('/resultats')
def resultats():
	return jsonify({'leftPanel': '', 'centerPanel': render_template('buttonsResultats'), 'rightPanel': render_template('graphs')})
