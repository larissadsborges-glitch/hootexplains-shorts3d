import subprocess, numpy as np, scipy.io.wavfile as wf, scipy.signal as ss
from pp import Piper
from kk2 import trim
# (text, length_scale, pitch semitones, gain, gap after, fx)
L=[("Onze da noite, minha gente!",0.78,3,1.0,0.10,''),
   ("O Tavinho recebe a pior mensagem da vida!",0.80,2,0.95,0.12,''),
   ("É da sogra!",0.85,5,1.0,0.18,'shout'),
   ("A ceia de Natal é sua! Somos doze!",0.80,4,1.0,0.14,''),
   ("Doze pessoas! Uma ceia! Feita pelo Tavinho!",0.75,3,0.95,0.20,''),
   ("Só tem um probleminha…",1.05,0,0.8,0.12,''),
   ("Ele não sabe nem fritar um ovo!",0.80,5,1.0,0.10,'shout')]
def ff(i,o,af): subprocess.run(['ffmpeg','-v','error','-y','-i',i,'-af',af,o],check=True)
def rd(n): r,a=wf.read(n); return r,a.astype(np.float32)/32767
for name in ['cadu-medium','faber-medium']:
    p=Piper(name); out=[]
    for k,(t,ls,st,g,gap,fx) in enumerate(L):
        a=trim(p.line(t,length=ls,noise=0.8,noise_w=1.0)); a=a/np.abs(a).max()*0.9
        wf.write('t.wav',p.sr,(a*32767).astype(np.int16))
        af=f'rubberband=pitch={2**(st/12)}:formant=preserved'
        if fx=='shout': af+=',equalizer=f=2500:t=q:w=1:g=5,acompressor=threshold=-24dB:ratio=6:makeup=3,asoftclip=type=tanh'
        ff('t.wav','t2.wav',af); _,b=rd('t2.wav')
        out+=[b/np.abs(b).max()*0.9*g, np.zeros(int(p.sr*gap),np.float32)]
    # laugh: short "ha" syllables falling in pitch
    rng=np.random.default_rng(5)
    for j,st in enumerate([7,6,5,4,3,2]):
        a=trim(p.line("Rá!",length=0.55,noise=0.8,noise_w=1.0)); wf.write('t.wav',p.sr,(a/np.abs(a).max()*32767*0.9).astype(np.int16))
        ff('t.wav','t2.wav',f'rubberband=pitch={2**(st/12)}:formant=preserved'); _,b=rd('t2.wav')
        out+=[b/np.abs(b).max()*(0.85-0.07*j), np.zeros(int(p.sr*rng.uniform(0.02,0.05)),np.float32)]
    a=np.concatenate(out); wf.write(f'host_{name}.wav',p.sr,(a/np.abs(a).max()*0.9*32767).astype(np.int16))
    print(name,round(len(a)/p.sr,1))
