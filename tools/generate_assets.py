#!/usr/bin/env python3
"""Gera imagens (PNG) e sons (WAV) originais para o jogo Chuva de Docinhos.

Uso: python tools/generate_assets.py
Requer: pip install numpy pillow
"""
import math
import os
import wave

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "images")
SND = os.path.join(ROOT, "assets", "audio")
SR = 44100


# ---------------------------------------------------------------- imagens
def new(size=256):
    s = size * 2  # desenha em 2x e reduz para suavizar bordas
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im), s


def finish(im, name, size=256):
    im = im.resize((size, size), Image.LANCZOS)
    im.save(os.path.join(IMG, name))


def candy(name, body, stripe):
    im, d, s = new()
    c = s // 2
    # embrulho (pontas)
    d.polygon([(40, c), (150, c - 90), (150, c + 90)], fill=stripe)
    d.polygon([(s - 40, c), (s - 150, c - 90), (s - 150, c + 90)], fill=stripe)
    # corpo
    d.ellipse([110, 110, s - 110, s - 110], fill=body, outline=(255, 255, 255, 255), width=10)
    d.arc([150, 150, s - 150, s - 150], 200, 280, fill=(255, 255, 255, 220), width=18)
    finish(im, name)


def bomb():
    im, d, s = new()
    d.ellipse([70, 130, s - 70, s - 50], fill=(30, 30, 40, 255), outline=(90, 90, 110, 255), width=10)
    d.rectangle([c := s // 2 - 25, 80, c + 50, 150], fill=(70, 70, 80, 255))
    d.line([(s // 2 + 10, 80), (s // 2 + 60, 30)], fill=(200, 160, 80, 255), width=12)
    d.ellipse([s // 2 + 40, 5, s // 2 + 90, 55], fill=(255, 200, 40, 255))
    d.ellipse([150, 190, 220, 250], fill=(255, 255, 255, 120))
    finish(im, "bomb.png")


def ring():
    im, d, s = new(512)
    d.ellipse([20, 20, s - 20, s - 20], outline=(255, 255, 255, 230), width=22)
    d.ellipse([70, 70, s - 70, s - 70], outline=(255, 105, 180, 160), width=12)
    finish(im, "mouth_ring.png", 512)


def heart():
    im, d, s = new(128)
    d.ellipse([20, 30, 140, 150], fill=(255, 60, 90, 255))
    d.ellipse([116, 30, 236, 150], fill=(255, 60, 90, 255))
    d.polygon([(26, 110), (230, 110), (128, 235)], fill=(255, 60, 90, 255))
    finish(im, "heart.png", 128)


def star():
    im, d, s = new(128)
    c = s // 2
    pts = []
    for i in range(10):
        r = 118 if i % 2 == 0 else 50
        a = -math.pi / 2 + i * math.pi / 5
        pts.append((c + r * math.cos(a), c + r * math.sin(a)))
    d.polygon(pts, fill=(255, 225, 60, 255), outline=(255, 255, 255, 255))
    finish(im, "star.png", 128)


def hud():
    im = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([40, 60, 1040, 200], 40, fill=(0, 0, 0, 90))
    im.save(os.path.join(IMG, "hud_bar.png"))


# ------------------------------------------------------------------- sons
def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a=0.005, rel=0.2):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / rel)
    return e


def tone(freq, dur, kind="tri", rel=0.2):
    n = int(SR * dur)
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    if kind == "sine":
        w = np.sin(ph)
    elif kind == "tri":
        w = 2 / np.pi * np.arcsin(np.sin(ph))
    else:  # square suave
        w = np.tanh(3 * np.sin(ph)) * 0.8
    return w * env(n, rel=rel)


def kick(dur=0.25):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = 50 + 120 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 12)


def hat(dur=0.05, seed=1):
    n = int(SR * dur)
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    x = np.diff(x, prepend=0)  # passa-altas simples
    return x * np.exp(-np.arange(n) / SR * 90) * 0.5


def put(buf, start, sig, gain=1.0):
    i = int(start * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i] * gain


def save(name, data, peak=0.89):
    m = np.max(np.abs(data))
    if m > 0:
        data = data / m * peak
    pcm = (data * 32767).astype("<i2")
    with wave.open(os.path.join(SND, name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def bgm():
    bpm = 120
    beat = 60 / bpm
    bars = 8
    total = bars * 4 * beat  # 16 s
    n = int(total * SR)
    buf = np.zeros(n)
    step = beat / 2  # colcheias
    # pentatonica maior de Do: C D E G A
    penta = [60, 62, 64, 67, 69, 72, 74, 76]
    # progressao por compasso: raiz do baixo (C, A, F, G) x2
    roots = [36, 33, 29, 31] * 2
    # padroes de arpejo (indices na pentatonica) por compasso
    pat = [
        [0, 2, 3, 5, 3, 2, 3, 2],
        [1, 3, 4, 6, 4, 3, 4, 3],
        [0, 2, 4, 5, 4, 2, 4, 2],
        [1, 2, 3, 5, 6, 5, 3, 2],
    ]
    for bar in range(bars):
        t0 = bar * 4 * beat
        p = pat[bar % 4]
        for k in range(8):
            note = penta[p[k]]
            # ajusta para acordes: desloca A menor e F levemente mantendo escala
            put(buf, t0 + k * step, tone(midi(note), step * 1.6, "sq", rel=0.12), 0.30)
            # eco suave
            put(buf, t0 + k * step + step * 0.75, tone(midi(note), step, "sq", rel=0.08), 0.10)
        # baixo em semínimas sincopadas
        r = roots[bar]
        for k in (0, 1.5, 2, 3):
            put(buf, t0 + k * beat, tone(midi(r), beat * 0.9, "tri", rel=0.25), 0.55)
        # bumbo em cada tempo, chimbal em contratempos
        for k in range(4):
            put(buf, t0 + k * beat, kick(), 0.8)
            put(buf, t0 + k * beat + beat / 2, hat(seed=bar * 4 + k), 0.5)
        # palmas/snare simples nos tempos 2 e 4
        for k in (1, 3):
            rng = np.random.default_rng(bar * 10 + k)
            nn = int(0.12 * SR)
            sn = rng.standard_normal(nn) * np.exp(-np.arange(nn) / SR * 30)
            put(buf, t0 + k * beat, sn, 0.25)
    # loop perfeito: cauda que passaria do fim volta ao inicio
    return buf


def sfx():
    penta = [72, 74, 76, 79, 81]  # notas ascendentes por nivel de combo
    for i, nt in enumerate(penta, start=1):
        d = tone(midi(nt), 0.25, "sine", rel=0.08)
        d2 = tone(midi(nt + 12), 0.25, "sine", rel=0.05) * 0.4
        sig = np.zeros(int(SR * 0.3))
        put(sig, 0, d)
        put(sig, 0.06, d2)
        save(f"sfx_catch_{i}.wav", sig)
    # bomba: ruido grave descendente
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    rng = np.random.default_rng(7)
    noise = rng.standard_normal(n)
    k = np.convolve(noise, np.ones(30) / 30, mode="same")
    f = 120 * np.exp(-t * 5)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR)
    save("sfx_bomb.wav", (boom * 0.9 + k * 0.8) * np.exp(-t * 6))
    # fim de jogo: 4 notas descendo
    sig = np.zeros(int(SR * 1.4))
    for i, nt in enumerate([67, 64, 60, 55]):
        put(sig, i * 0.25, tone(midi(nt), 0.5, "tri", rel=0.2))
    save("sfx_gameover.wav", sig)
    # inicio: arpejo subindo
    sig = np.zeros(int(SR * 0.8))
    for i, nt in enumerate([60, 64, 67, 72]):
        put(sig, i * 0.09, tone(midi(nt), 0.3, "sq", rel=0.1))
    save("sfx_start.wav", sig)


def main():
    os.makedirs(IMG, exist_ok=True)
    os.makedirs(SND, exist_ok=True)
    candy("candy_pink.png", (255, 105, 180, 255), (255, 182, 220, 255))
    candy("candy_blue.png", (70, 170, 255, 255), (170, 215, 255, 255))
    candy("candy_yellow.png", (255, 210, 50, 255), (255, 240, 150, 255))
    bomb()
    ring()
    heart()
    star()
    hud()
    save("bgm_loop.wav", bgm(), peak=0.7)
    sfx()
    print("Assets gerados em", os.path.join(ROOT, "assets"))


if __name__ == "__main__":
    main()
