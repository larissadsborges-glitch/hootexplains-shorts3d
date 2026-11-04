import numpy as np, scipy.io.wavfile as wf
from pp import Piper
from kk2 import trim
L=[("Onze da noite.",1.05,0.10),
   ("O Tavinho recebe a pior mensagem da vida!",0.95,0.18),
   ("É da sogra.",1.05,0.22),
   ("A ceia de Natal é sua… Somos doze!",1.0,0.20),
   ("Doze pessoas, uma ceia, feita pelo Tavinho.",0.93,0.12),
   ("Só tem um problema.",1.08,0.20),
   ("Ele não sabe nem fritar um ovo!",0.95,0.0)]
for name in ['faber-medium','cadu-medium','jeff-medium','edresson-low']:
    p=Piper(name); out=[]
    for t,ls,g in L: out+=[trim(p.line(t,length=0.92*ls)),np.zeros(int(p.sr*g),np.float32)]
    a=np.concatenate(out); a=a/np.abs(a).max()*0.9
    wf.write(f'p_{name}.wav',p.sr,(a*32767).astype(np.int16)); print(name,round(len(a)/p.sr,1))
