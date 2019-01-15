Le package loadflow_NR comporte les modules utiles pour effactuer un calcul de load flow par la m�thode de Newton-Raphson sur un r�seau �lectrique basse tension.
Ces modules sont :
> construct.py, qui permet de construire le r�seau gr�ce aux fonctions 
	Y(lines, buses) : construit la matrice d'admittance du r�seau
	powers(buses) : construit les matrices P, Q, theta, V du r�seau � partir des valeurs connues et des estimations initiales
> calc.py, qui permet de r�soudre le load flow
	lf_nr(Y, powers=[P, Q, theta, V], eps, m_iter) : r�alise le calcul de load flow par la m�thode de newton-raphson
	calc_power(t0, v0, Y) : calcule P, Q � chaque bus
> lines_values.py, qui calcules les grandeurs �lectriques relatives aux lignes
	currents(t0, v0, Y)
	losses(t0, v0, Y)
