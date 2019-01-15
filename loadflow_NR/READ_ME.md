Le package loadflow_NR comporte les modules utiles pour effactuer un calcul de load flow par la méthode de Newton-Raphson sur un réseau électrique basse tension.
Ces modules sont :
> construct.py, qui permet de construire le réseau grâce aux fonctions 
	Y(lines, buses) : construit la matrice d'admittance du réseau
	powers(buses) : construit les matrices P, Q, theta, V du réseau à partir des valeurs connues et des estimations initiales
> calc.py, qui permet de résoudre le load flow
	lf_nr(Y, powers=[P, Q, theta, V], eps, m_iter) : réalise le calcul de load flow par la méthode de newton-raphson
	calc_power(t0, v0, Y) : calcule P, Q à chaque bus
> lines_values.py, qui calcules les grandeurs électriques relatives aux lignes
	currents(t0, v0, Y)
	losses(t0, v0, Y)
