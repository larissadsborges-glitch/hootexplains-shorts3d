# A Vida do Tavinho: estado do trabalho (5 nov 2026, de madrugada)

## Pronto (pré-visualização com voz provisória)
- **EP1 "A mentira":** `out/avidadotavinho_ep1_PREVIEW_vozprovisoria.mp4` (~55 s). É gerado pela composição `Tavinho` (`src/tavinho/Episode.tsx` e `src/tavinho/scenes.tsx`).
- **Guião final (v3):** narração em `videos/tavinho1/script.json`. A v2 está em `tavinho/ep01/ROTEIRO_v2.md`, com a explicação do que mudou. As notas do revisor independente (estrutura e piadas) foram aplicadas na v3.
- **Elenco 2D:** `src/tavinho/cast.tsx` (Tavinho, Camila, Dona Celeste, Vó Dita). Para conferir os desenhos lado a lado há a composição `TavinhoCast`.
- **Foto de perfil:** `out/avidadotavinho_perfil.png` (composição `TavinhoAvatar`).
- **Capa do EP1:** `out/avidadotavinho_ep1_capa.png` (composição `TavinhoCover`).
- **EP2:** os dois ramos (VÍDEO e VÓ) estão escritos em `tavinho/ep02/ROTEIRO_ramos.md`.

## Amanhã: trocar para a voz ElevenLabs
1. Gerar cada linha (ou o texto todo) com a voz escolhida, em pt-BR, num estilo de apresentador animado.
2. Pedir os **timestamps por palavra** à ElevenLabs (o endpoint "with timestamps"). Assim as legendas ficam certas à palavra, sem estimativa.
3. Escrever `public/videos/tavinho1/voice.wav` e `timings.json` no mesmo formato de agora (beats → words com start/end). Todas as animações estão presas a palavras com `wordTime`, por isso o vídeo reajusta-se sozinho.
4. Render: `npx remotion render build_m Tavinho out/x.mp4 --props='{"videoId":"tavinho1"}' --gl=angle`, seguido de loudnorm −14 LUFS (ver os comandos em `docs/LEARNINGS.md`).
5. Com a voz nova, apontar para **61 s ou mais** (o programa de recompensas do TikTok) só se o ritmo continuar vivo. Caso contrário, ~55 s chegam.

## Ao voltar a gerar a voz provisória (Kokoro)
- Correr sempre com `PYTHONUTF8=1`. Sem isto, o Windows lê o guião com acentos estragados e a voz diz "VocÃª".

## Decisões para a dona
- A pergunta da votação, os custos ("custa 1 dia / custa 3 dias") e os riscos de cada lado.
- O `@`: o vídeo usa `@avidadotavinho`. Confirmar que é este o @ que ficou.
- "FALTAM 49 DIAS" vale para quem publicar a 5 de novembro. Para outra data, mudar o número no guião e no ecrã (`Episode.tsx` e `scenes.tsx`).
