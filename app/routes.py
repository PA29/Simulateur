# -*- coding: utf-8 -*-
"""
Created on Tue Nov 20 17:31:24 2018

@author: Tanguy
"""

from .functions import render_template
from app import app
from .database import cursor
from flask import jsonify

reseau = {
	'bus': [{'x': 50, 'y': 30}, {'x': 50, 'y': 50}, {'x': 25, 'y': 75}, {'x': 75, 'y': 75}],
	'lines': [{'bus1': 0, 'bus2': 1, 'length': 10}, {'bus1': 1, 'bus2': 2, 'length': 10}, {'bus1': 1, 'bus2': 3, 'length': 10}],
	'images': [{'type': 'transfo', 'x': 50, 'y': 20, 'bus': 0}, {'type': 'consommateur', 'x': 50, 'y': 90, 'bus': 2}]
}

@app.route('/')
@app.route('/index')
@app.route('/accueil')
def accueil():
    return render_template('accueil')

@app.route('/main')
def main():
    return render_template('main')

@app.route('/edition')
def edition():
	return jsonify({'leftPanel': render_template('edition/leftPanel'), 'centerPanel': render_template('edition/centerPanel'), 'rightPanel': render_template('edition/rightPanel')});

@app.route('/resultats')
def resultats():
	return jsonify({'leftPanel': '', 'centerPanel': render_template('resultats/centerPanel', jauges = [{'x':60, 'y':80}]), 'rightPanel': render_template('resultats/rightPanel')})

@app.route('/unScenario')
def getReseau():
	return jsonify({'reseau' : reseau})