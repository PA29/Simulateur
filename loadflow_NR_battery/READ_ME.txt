Le package loadflow_NR_battery comporte les modules utiles pour effectuer un calcul de load flow par la m�thode de Newton-Raphson sur un r�seau �lectrique basse tension comportant des batteries.
Ces modules sont :
> construct.py, qui permet de construire le r�seau gr�ce aux fonctions 
	Y(lines, buses) : construit la matrice d'admittance du r�seau
	powers(buses) : construit les matrices P, Q, theta, V du r�seau � partir des valeurs connues et des estimations initiales
> calc.py, qui permet de r�soudre le load flow
	lf_nr(Y, powers=[P, Q, theta, V], eps, m_iter) : r�alise le calcul de load flow par la m�thode de newton-raphson
	calc_power(t0, v0, Y) : calcule P, Q � chaque bus
> lines_values.py, qui calcule les grandeurs �lectriques relatives aux lignes
	currents(t0, v0, Y)
	losses(t0, v0, Y)
> total_lf.py, qui calcule le load flow total et les nouvelles charges des batteries
	def total_lf(buses, lines, Sb = 1000, Ub = 400, Cs = 0.1, Ps = 50000): (buses2, lines, liste_buses1, P_r1, Q_r1, V_r1, theta_r1, I_r1, Sl_r1, S_r1)
	buses : liste des bus
	lines : lignes
	Sb : base de puissance
	Ub : base de tension
	Cs : charge seuil minimale de batterie
	Ps : puissance seuil (prise comme la valeur de P au transfo � 9h du matin)
	###### retours ######
	buses2 : liste des bus avec les nouvelles charges de batterie
	lines : lignes, inchang�es
	liste_buses1 : liste de l'ordre des bus pour l'affichage
	P_r1 : puissances r�elles
	Q_r1 : puissances r�actives r�elles
	V_r1 : tensions r�elles
	theta_r1 : theta r�els
	I_r1 : intensit� r�elle
	Sl_r1 : pertes par ligne par sens
	S_r1 : pertes totales par ligne
	
