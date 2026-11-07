"""Mix: voz (TTS) + pulso minimalista + foley de impressao nos eventos. Escreve out/mix.wav (48 kHz estereo)."""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ['LIB']
sys.path.insert(0, f'{LIB}/core/audio')
import sfx
from sfx import SR, add, t_, env_exp, lp, hp, noise
TL = json.load(open(f'{HERE}/timeline.json', encoding='utf-8')); DUR = TL['dur']
EV = json.load(open(f'{HERE}/events.json'))['ev']
N = int(DUR * SR)
voice = np.zeros((N, 2), np.float32); music = np.zeros((N, 2), np.float32); fx = np.zeros((N, 2), np.float32)
for l in TL['lines']:
    a, sr = sf.read(f"{HERE}/voice/{l['id']}.wav", dtype='float32')
    a = resample_poly(a, SR // sr, 1).astype(np.float32)
    add(voice, a, l['t0'], 1.0)
# voz: compressao leve
for c in range(2): voice[:, c] = sfx.compress(voice[:, c], thr=.2, ratio=3)
# musica: 108 bpm, pulso (kick suave), hat e marimba em pentatonica menor
bpm = 108; beat = 60 / bpm; scale = [57, 60, 62, 64, 67, 69]
def pluck(f, d=.5):
    tt = t_(d); return (np.sin(2*np.pi*f*tt) + .3*np.sin(2*np.pi*f*4*tt)*np.exp(-tt*30)) * env_exp(d, .12)
def kick():
    d = .25; tt = t_(d); fr = 50 + 70*np.exp(-tt*30); return np.sin(2*np.pi*np.cumsum(fr)/SR) * env_exp(d, .09)
def hat(): d = .05; return hp(noise(d), 7000) * env_exp(d, .008)
rng = np.random.default_rng(3); pat = [0, 2, 4, 2, 5, 3, 1, 3]
b = 0
while b * beat < DUR:
    t = b * beat
    add(music, kick(), t, .55)
    add(music, hat(), t + beat / 2, .12)
    n = pat[b % 8] % len(scale); f = 440 * 2 ** ((scale[n] - 69) / 12)
    add(music, pluck(f), t + beat / 2, .22, pan=-.3 + .6 * (b % 2))
    if b % 8 == 0: add(music, pluck(440 * 2 ** ((45 - 69) / 12), .9), t, .35)
    b += 1
fade = np.minimum(1, np.minimum(np.arange(N) / (SR * 1.0), (N - np.arange(N)) / (SR * 3.0)))[:, None]
music *= fade
# foley
for e in EV:
    ty = e['type']
    if ty == 'snap': add(fx, sfx.click(1.2, 1) , e['t'], .5)
    elif ty == 'thunk': add(fx, sfx.thump(1, 90), e['t'], .5)
    elif ty == 'tick': add(fx, sfx.click(1.6, .6), e['t'], .4)
# ducking: musica -12 dB sob a voz
env = np.abs(voice).max(axis=1); k = int(.12 * SR)
env = np.convolve(env, np.ones(k) / k, 'same'); duck = 1 - .75 * np.clip(env * 8, 0, 1)
mix = voice * 1.0 + music * .5 * duck[:, None] + fx * .5
mix = sfx.limit(mix.T, .9).T if mix.ndim == 2 and False else mix
mix /= max(1e-6, np.abs(mix).max()) / .9
os.makedirs(f'{HERE}/out', exist_ok=True)
sf.write(f'{HERE}/out/mix.wav', mix, SR)
print('mix ok', DUR)
