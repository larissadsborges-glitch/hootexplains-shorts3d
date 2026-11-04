import os
import json, numpy as np, onnxruntime as rt, sys
sys.path.insert(0,os.path.dirname(__file__))
from kk2 import phon
D=os.environ.get('PIPER_DIR','models/piper/')
class Piper:
    def __init__(s,name):
        base=f'{D}vits-piper-pt_BR-{name}/pt_BR-{name}'
        s.cfg=json.load(open(base+'.onnx.json')); s.map=s.cfg['phoneme_id_map']
        s.sess=rt.InferenceSession(base+'.onnx',providers=['CPUExecutionProvider']); s.sr=s.cfg['audio']['sample_rate']
    def line(s,text,length=1.0,noise=0.667,noise_w=0.8):
        ph=phon(text); ids=s.map['^']+s.map['_']
        for c in ph:
            if c in s.map: ids+=s.map[c]+s.map['_']
        ids+=s.map['$']
        a=s.sess.run(None,{'input':np.array([ids],np.int64),'input_lengths':np.array([len(ids)],np.int64),'scales':np.array([noise,length,noise_w],np.float32)})[0].ravel()
        return a.astype(np.float32)
