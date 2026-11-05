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

## Referências da dona (5 nov 2026). Os vídeos estão em `C:\Users\borge\hoot\refs\`
- **`ref_tipo.mp4` ("é este o tipo de vídeo que eu quero"):** um episódio do género "O Cara da Foto". **Copia-se o ritmo e a montagem, nunca o personagem, o guião nem os desenhos.** Diferenças para o nosso EP1:
  1. **Um corte a cada ~1 s.** O enquadramento muda a cada frase: rosto em grande plano extremo → plano geral do quarto → pormenor (dedo a tocar no telemóvel, chinelo com arame, calças com buracos) → telemóvel em ecrã inteiro. O nosso EP1 fica 3–5 s no mesmo plano. **Esta é a mudança principal.**
  2. **Dedo a tocar no telemóvel:** um dedo grande entra no ecrã e toca ("curtir", "descurtir"). Fica muito bem nas cenas de chat e no grupo.
  3. **Grandes planos de reação** (só a cara, a ocupar o ecrã) a cada ~3–5 s. São estas expressões que seguram o público.
  4. **Piadas de pormenor:** zooms rápidos em pormenores ridículos, cada um com a sua legenda.
  5. **Laço "?":** um círculo amarelo grande com "?" (a foto escondida) que regressa várias vezes. Para nós: a "nova mensagem" da Dona Celeste por abrir.
  6. **Legendas:** uma ou duas palavras, a ~70% da altura, a branco, com cor nos nomes e nas palavras-chave (azul, vermelho, amarelo).
  7. **Votação:** ecrã dividido amarelo e vermelho, com "COMENTE UMA PALAVRA", barras "30 DIAS" e "PARECIDO COM A FOTO 3%" e duas cabeças. Fim com "TIRA…" (cliffhanger). A estrutura do nosso EP1 já está igual.
- **`ref_tanquinho.mp4`:** um explicativo 2D de fitness. A copiar: legendas no TOPO, um indicador de passos (1-2-3-🔒) que se vai preenchendo, cartões vermelhos de ecrã inteiro ("ERRO 2"), ícones que aparecem nas palavras-chave, narração sem pausas e, no fim, "MANDA PRO AMIGO".
- **Voz:** não se clona o narrador de nenhuma referência (é uma pessoa real; faria falta autorização). Procuramos a mesma energia. Amostras Chatterbox (Voice Studio, em `C:\Users\borge\vs`) em `out/voz_*.m4a`. A dona achou a 1–3 robótica (a base era o Kokoro). As 4–8 (bases Piper e Chatterbox) estão à espera de escolha. Ver `C:\Users\borge\vs\tav\test_cb.py`.

## Decisões para a dona
- A pergunta da votação, os custos ("custa 1 dia / custa 3 dias") e os riscos de cada lado.
- O `@`: o vídeo usa `@avidadotavinho`. Confirmar que é este o @ que ficou.
- "FALTAM 49 DIAS" vale para quem publicar a 5 de novembro. Para outra data, mudar o número no guião e no ecrã (`Episode.tsx` e `scenes.tsx`).
