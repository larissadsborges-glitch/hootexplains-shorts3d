import numpy as np, scipy.signal as ss, scipy.linalg as sl
SR=24000
def whisper(a,order=22):
    """Keep the vocal tract shape (LPC), replace the voice buzz with breath noise."""
    n=int(0.025*SR); h=n//4; win=np.hanning(n); out=np.zeros(len(a)+n); rng=np.random.default_rng(1)
    pre=ss.lfilter([1,-0.95],1,a)
    for i in range(0,len(a)-n,h):
        f=pre[i:i+n]*win
        r=np.correlate(f,f,'full')[n-1:n+order]
        if r[0]<1e-8: continue
        r[0]*=1.0001
        lpc=sl.solve_toeplitz(r[:order],r[1:order+1]); A=np.concatenate([[1],-lpc])
        res=ss.lfilter(A,1,f); g=np.sqrt(np.mean(res**2))
        y=ss.lfilter([1],A,rng.standard_normal(n)*g)
        out[i:i+n]+=y*win
    out=ss.lfilter([1],[1,-0.95],out[:len(a)])
    out=ss.sosfilt(ss.butter(4,300,'hp',fs=SR,output='sos'),out)
    return out/np.abs(out).max()*0.6
