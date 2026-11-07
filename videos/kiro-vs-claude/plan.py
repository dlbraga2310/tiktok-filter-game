"""Timeline unica: horarios de cada fala (a partir das duracoes do TTS). Escreve timeline.json."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
LEAD, GAP, TAIL = 1.0, 0.9, 6.0
lines = json.load(open(f'{HERE}/lines.json', encoding='utf-8'))
dur = json.load(open(f'{HERE}/voice/dur.json'))
t = LEAD; out = []
for L in lines:
    d = dur[L['id']]
    out.append({'id': L['id'], 't0': round(t, 3), 't1': round(t + d, 3), 'text': L['text']})
    t += d + GAP
total = round(out[-1]['t1'] + TAIL, 3)
json.dump({'dur': total, 'lines': out}, open(f'{HERE}/timeline.json', 'w'), ensure_ascii=False, indent=1)
print('DUR', total)
