import subprocess, numpy as np, scipy.io.wavfile as wf
from kk2 import *
from fx import whisper
VOICE=0.6*V['pm_alex']+0.4*V['pm_santa']
def save(n,a): wf.write(n,24000,(np.clip(a,-1,1)*32767).astype(np.int16))
def ff(i,o,af): subprocess.run(['ffmpeg','-v','error','-y','-i',i,'-af',af,'-ar','24000',o],check=True)
def load(n): r,a=wf.read(n); return a.astype(np.float32)/32767
def tok_line(ph,speed):
    toks=[VOC[c] for c in ph if c in VOC]
    return trim(sess.run(None,{'tokens':np.array([[0,*toks,0]],dtype=np.int64),'style':VOICE[len(toks)].astype(np.float32),'speed':np.array([speed],dtype=np.float32)})[0].ravel())
def P(st): return 2**(st/12)
parts=[]
# 1 normal
save('d1.wav',script([("Onze da noite.",0.95,0.1),("O Tavinho recebe a pior mensagem da vida!",1.05,0)],VOICE)); ff('d1.wav','e1.wav','anull')
# 2 whisper
a=script([("Ele não sabe nem fritar um ovo…",0.9,0)],VOICE); save('d2.wav',whisper(a)); ff('d2.wav','e2.wav','equalizer=f=4000:t=q:w=1:g=3')
# 3 nervous: higher, faster, shaky
save('d3.wav',script([("Doze pessoas?!",1.15,0.08),("Feita por mim?!",1.2,0)],VOICE)); ff('d3.wav','e3.wav',f'rubberband=pitch={P(2.5)}:formant=preserved,vibrato=f=7:d=0.12,tremolo=f=6:d=0.15')
# 4 shouting / excited
save('d4.wav',script([("A ceia de Natal é sua!",1.1,0)],VOICE)); ff('d4.wav','e4.wav',f'rubberband=pitch={P(3.5)}:formant=preserved,equalizer=f=2500:t=q:w=1:g=5,acompressor=threshold=-25dB:ratio=6:makeup=4,asoftclip=type=tanh')
# 5 sad / defeated: slower, lower, darker
save('d5.wav',script([("Agora… não tem volta.",0.82,0)],VOICE)); ff('d5.wav','e5.wav',f'rubberband=pitch={P(-2.5)}:formant=preserved,lowpass=f=5000')
# 6 laugh: short "ha" syllables falling in pitch, with breaths
rng=np.random.default_rng(3); lau=[]
for k,st in enumerate([5,4,3,2,1,0,-1]):
    s=tok_line('hˈa',1.6 if k else 1.3); save('l.wav',s); ff('l.wav','l2.wav',f'rubberband=pitch={P(st)}:formant=preserved')
    lau+=[load('l2.wav')*(1-0.06*k), np.zeros(int(24000*rng.uniform(0.03,0.07)),np.float32)]
br=rng.standard_normal(int(24000*0.35)).astype(np.float32)*0.04*np.hanning(int(24000*0.35)).astype(np.float32)
save('d6.wav',np.concatenate(lau+[br])); ff('d6.wav','e6.wav','highpass=f=150')
gap=np.zeros(int(24000*0.9),np.float32)
allp=[]
for i in range(1,7): x=load(f'e{i}.wav'); allp+=[x/np.abs(x).max()*0.9,gap]
save('demo_raw.wav',np.concatenate(allp))
