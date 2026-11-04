from kk2 import *
L=[("Onze da noite.",0.95,0.10),
   ("O Tavinho recebe a pior mensagem da vida!",1.05,0.18),
   ("É da sogra.",0.95,0.22),
   ("\"A ceia de Natal é sua… Somos doze!\"",1.0,0.20),
   ("Doze pessoas, uma ceia, feita pelo Tavinho.",1.08,0.12),
   ("Só tem um problema.",0.92,0.20),
   ("Ele não sabe nem fritar um ovo!",1.05,0.0)]
opts=[('1_alex','pm_alex'),('2_santa','pm_santa'),('3_dora','pf_dora'),('4_alex_santa',0.6*V['pm_alex']+0.4*V['pm_santa'])]
for n,v in opts:
    a=script(L,v); wf.write(f'v2_{n}.wav',24000,(a*32767).astype(np.int16)); print(n,round(len(a)/24000,1))
