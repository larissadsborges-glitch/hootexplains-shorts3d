import numpy as np, scipy.io.wavfile as wf
from kk2 import *
T="Onze da noite. O Tavinho recebe a pior mensagem da vida! É da sogra. A ceia de Natal é sua… Somos doze! Doze pessoas, uma ceia, feita pelo Tavinho. Só tem um problema. Ele não sabe nem fritar um ovo!"
ph=phon(T).replace('ˌ','')   # drop secondary stress: fewer over-stressed syllables
for n,v in [('alex','pm_alex'),('alex_santa',0.6*V['pm_alex']+0.4*V['pm_santa']),('dora','pf_dora')]:
    st=V[v] if isinstance(v,str) else v
    toks=[VOC[c] for c in ph if c in VOC]
    a=sess.run(None,{'tokens':np.array([[0,*toks,0]],dtype=np.int64),'style':st[len(toks)].astype(np.float32),'speed':np.array([1.05],dtype=np.float32)})[0].ravel()
    a=a/np.abs(a).max()*0.9; wf.write(f'k3_{n}.wav',24000,(a*32767).astype(np.int16)); print(n,round(len(a)/24000,1))
