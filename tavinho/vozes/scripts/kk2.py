import os
import json, re, subprocess, numpy as np, onnxruntime as rt, scipy.io.wavfile as wf
M=os.environ.get('KOKORO_DIR','models/')
VOC=json.load(open(os.environ.get('KOKORO_VOCAB','tavinho/vozes/kokoro_config.json')))['vocab']
sess=rt.InferenceSession(M+'kokoro-v1.0.onnx',providers=['CPUExecutionProvider'])
V=np.load(M+'voices-v1.0.bin')
ES=[os.environ.get('ESPEAK','espeak-ng'),'-v','pt-br','-q','--ipa']
def phon(text):
    # keep punctuation: phonemize each piece and glue the marks back in
    out=''
    for piece,mark in re.findall(r'([^,.!?…:;]+)([,.!?…:;]*)',text):
        if not piece.strip(): out+=mark; continue
        p=' '.join(subprocess.run(ES+[piece.strip()],capture_output=True,text=True).stdout.split())
        mark=mark.replace('…','…').replace(':',',').replace(';',',')
        out+=(' ' if out and not out.endswith(' ') else '')+p+mark
    return out
def line(text,style,speed):
    ph=phon(text); toks=[VOC[c] for c in ph if c in VOC][:510]
    return sess.run(None,{'tokens':np.array([[0,*toks,0]],dtype=np.int64),'style':style[len(toks)].astype(np.float32),'speed':np.array([speed],dtype=np.float32)})[0].ravel()
def trim(a,th=0.01):
    idx=np.where(np.abs(a)>th)[0]
    return a[max(0,idx[0]-240):idx[-1]+480] if len(idx) else a
def script(lines,voice,base=1.15):
    style=V[voice] if isinstance(voice,str) else voice
    out=[]
    for text,sp,gap in lines:
        out+=[trim(line(text,style,base*sp)),np.zeros(int(24000*gap),np.float32)]
    a=np.concatenate(out); return a/np.abs(a).max()*0.9
