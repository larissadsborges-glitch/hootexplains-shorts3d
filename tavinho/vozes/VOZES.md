# Vozes para "A Vida do Tavinho" (testes de 4 nov 2026)

Narração em português do Brasil. Tudo o que está aqui é **grátis** e corre offline.

## Estado
- **Ainda não há voz escolhida.** A dona gosta de uma voz de personagem muito expressiva, ao estilo de um apresentador de auditório exagerado (referência: uma animação da @rafaellatuma, com voz humana). Não copiamos essa voz nem imitamos pessoas reais: procuramos apenas o mesmo **tipo** de energia.
- **Recomendação:** uma voz humana (a dona ou um amigo brasileiro a gravar no telemóvel, ou um locutor freelancer). Eu limpo e trato o som e sincronizo as legendas e a boca. As vozes grátis não conseguem rir nem representar a sério.
- **Alternativa paga:** ElevenLabs (vozes brasileiras expressivas da biblioteca).

## Motores testados
| Motor | Vozes pt-BR | Notas |
|---|---|---|
| Kokoro (`kokoro-v1.0.onnx`) | `pm_alex`, `pm_santa`, `pf_dora` | Soa a robô em pt-BR. Melhora com: pontuação mantida nos fonemas, texto lido de uma vez só, sem acento secundário (`ˌ`), velocidade ~1.05 |
| **Piper (VITS)** | `faber-medium`, `cadu-medium`, `jeff-medium`, `edresson-low` | **Mais natural.** Treinado com vozes reais. `noise=0.8`, `noise_w=1.0` dão mais variação; `length` < 1 é mais rápido |

Amostras em `amostras/`:
- `voz_v3_*`: comparação das vozes
- `voz_emocoes_demo`: sussurro, nervoso, grito, triste e riso, com efeitos
- `voz_animada_*`: estilo "apresentador animado"

## Como gerar (setup)
1. **espeak-ng** (fonemas): `apt install espeak-ng`. Em alternativa, compilar a partir do GitHub (`espeak-ng/espeak-ng`, cmake). Se não estiver no PATH, definir `ESPEAK=/caminho/espeak-ng`.
2. **Kokoro:** `models/kokoro-v1.0.onnx` e `models/voices-v1.0.bin`, das releases do `thewh1teagle/kokoro-onnx` (ver CLAUDE.md). O vocabulário está em `kokoro_config.json`.
3. **Piper:** extrair para `models/piper/` os ficheiros `vits-piper-pt_BR-<voz>.tar.bz2` das releases do GitHub `k2-fsa/sherpa-onnx` (tag `tts-models`).
4. Dependências Python: `onnxruntime`, `numpy`, `scipy`. Também é preciso `ffmpeg` com `rubberband`.
5. Correr a partir da raiz do repositório, por exemplo `python3 tavinho/vozes/scripts/gen5.py`.

## Truques que funcionam
- **Efeitos de emoção** (com o ffmpeg):
  - nervoso: `rubberband` +2,5 semitons, `vibrato` e `tremolo`
  - grito: +3 a +5 semitons, EQ a 2,5 kHz, compressor e `asoftclip`
  - triste: −2,5 semitons, mais lento e `lowpass`
  - sussurro: `fx.whisper()`, que mantém o envelope LPC e troca a voz por ruído
- **Masterização:** highpass, um pouco de corpo a 200 Hz, presença a 3 kHz, de-esser, compressor leve e um eco curtíssimo de "sala" (`aecho` 18/31 ms), terminando em loudnorm −14 LUFS. A sala tira o som seco e "dentro da cabeça".
- **Riso:** sílabas curtas "Rá!" a descer de tom. Fica artificial; é o ponto mais fraco das vozes grátis.
