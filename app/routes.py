# -*- coding: utf-8 -*-
"""
Created on Tue Nov 20 17:31:24 2018

@author: Tanguy
"""

from app import app

from .functions import render_template
from .database import *
from flask import jsonify, request, session, redirect
from tkinter import filedialog
from tkinter import *
from .simul import *
from json import dumps

grid = {
	'bus': [{'x': 50, 'y': 30}, {'x': 50, 'y': 50}, {'x': 25, 'y': 75}, {'x': 75, 'y': 75}],
	'lines': [{'bus1': 0, 'bus2': 1, 'r':0.44, 'x':0.35, 'length': 10}, {'bus1': 1, 'bus2': 2, 'r':0.44, 'x':0.35, 'length': 10}, {'bus1': 1, 'bus2': 3, 'r':0.44, 'x':0.35,  'length': 10}, {'bus1': 2, 'bus2': 3, 'r':0.44, 'x':0.35,  'length': 10}],
	'images': [{'type': 'transfo', 'x': 50, 'y': 20, 'bus': 0, 'Theta': 0.0, 'V': 400}, {'type': 'consommateur', 'x': 50, 'y': 60, 'bus': 1, 'P':-3.0, 'Q':-1.8}, {'type': 'stockage', 'x': 20, 'y': 90, 'bus': 2, 'P':6.0, 'SOC':0.8, 'capacity':13000}, {'type': 'producteur', 'x': 80, 'y': 50, 'bus': 3, 'P':3, 'V':400}]
}

@app.route('/')
@app.route('/index')
@app.route('/accueil')
def accueil():
    return render_template('accueil')

@app.route('/creer')
def creer():
	session['type'] = 'none'
	return render_template('main')

@app.route('/charger/<type>')
def charger(type):
	print(type)

	if (type == 'personal'):
		print("Test")
		root = Tk()
		root.withdraw()
		filename =  filedialog.askopenfilename(initialdir = "/",title = "Select file",filetypes = (("jpeg files","*.jpg"),("all files","*.*")))
		return render_template('main', save_path = filename)
	elif (type != None):
		return render_template('main', model = type)

@app.route('/edition')
def edition():
	return jsonify({'leftPanel': render_template('edition/leftPanel'), 'centerPanel': render_template('edition/centerPanel'), 'rightPanel': render_template('edition/rightPanel')});

@app.route('/dureeSimulation', methods = ['POST'])
def getDureeSimulation():
	#A DEVELOPPER
	return jsonify({'duree' : 100}) #TEMPORAIRE

@app.route('/simulation', methods = ['POST'])
def getResultatsSimulation():
	#les parametres de simulation (saison, ilotage, grid)
	json = request.get_json()
	grid = json.get('grid')
	print(grid)
	results = run_simul(grid, json) #run la simulation, fichier simul.py
	return jsonify(results)

@app.route('/resultats')
def resultats():
	return jsonify({'leftPanel': '', 'centerPanel': render_template('resultats/centerPanel', jauges = [{'x':60, 'y':50}]), 'rightPanel': render_template('resultats/rightPanel')})

@app.route('/unScenario')
def getGrid():
	print(grid)
	return jsonify({'grid' : grid})

@app.route('/parametres', methods = ['POST'])
def getParametres():

    json = request.get_json()
    
    return render_template('_parametres', json = json, variables = getVariables(json['data']['type']))

@app.route('/addJauge', methods = ['POST'])
def getAddJauge():
    json = request.get_json()
    return render_template('_addJauge', json = json)

def getVariables(type):
    if type == 'transfo':
        return {'Tension (V)': [380, 400, 420]}
    elif type == 'consommateur':
        return {'Puissance (kW)': [3, 6, 9, 12], 'Facteur de puissance': [0.8, 0.9, 1]}
    elif type == 'producteur':
        return {'Puissance (kW)': [3, 6, 9, 12], 'Tension (V)': [380, 400, 420]}
