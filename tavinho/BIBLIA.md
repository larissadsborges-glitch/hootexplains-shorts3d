# A Vida do Tavinho: bíblia da página

Página nova do Instagram, separada do Hoot Explains. Série de humor em cartoon 2D, em **português do Brasil**, em que o público decide o que acontece votando nos comentários.

## Estratégia da dona (4 nov 2026)
- Cada personagem tem o seu próprio perfil. O perfil tem o nome do personagem e vive várias histórias (temporadas). Quando uma acaba, o personagem arranja outro sarilho.
- Inspiração: o **género** de "O Cara da Foto" (@ocaradafotoclt). Copiamos a fórmula, **nunca** o personagem, o guião ou os visuais.

## A fórmula (o que faz o género funcionar)
1. **Gancho com uma situação de vergonha** que toda a gente conhece, contada em ecrãs de telemóvel animados (chat, feed, notificações, dedo a tocar).
2. **Escalada "mas / por isso":** cada linha piora a situação.
3. **Um prazo e uma barra:** "FALTAM X DIAS" e uma barra de progresso que começa quase vazia.
4. **O público decide:** um ecrã dividido em duas cores com 2 opções e o custo de cada uma em dias. "Comenta UMA palavra."
5. **A votação real decide o episódio seguinte.** O comentário fixado explica como votar.
6. **Ritmo:** algo muda no ecrã a cada ~1 s. Legenda de uma palavra de cada vez, a branco com contorno, e as palavras-chave a amarelo ou vermelho.
7. **Narrador na 3.ª pessoa**, voz contínua, sem pausas mortas. 50–70 s.

## Página (decidido a 4 nov 2026)
- **Um perfil por personagem.** O nome do perfil é o nome do personagem, e cada história é uma temporada nova. Quando uma temporada acaba, o personagem arranja outro sarilho. Se um perfil crescer, usa-se para lançar o próximo personagem.
- **Nome:** A Vida do Tavinho (opcional: "A Vida do Tavinho | Humor").
- **@:** por ordem de preferência: `avidadotavinho`, `a.vida.do.tavinho`, `avidadotavinho_`, `vidadotavinho`. Falta saber qual ficou.
- **Bio** (a dona escolheu esta mensagem; falta escolher o formato final):
  ```
  😅 O Tavinho nunca aprende
  🎬 Cada temporada, uma confusão nova
  🗳️ Você decide o que ele faz
  👇 Temporada 1: a ceia da sogra
  ```
- **Conta:** criador de conteúdo, categoria "Criador de vídeos" ou "Entretenimento".
- **Foto de perfil:** o Tavinho em grande plano, a suar, a ocupar o círculo. Fazer depois de a pré-visualização aprovar o estilo.

## Próximos passos
1. A dona escolhe a voz (ver `vozes/VOZES.md`). A recomendação é uma voz humana gravada.
2. A dona aprova o guião do EP1 (`ep01/ROTEIRO.md`).
3. Pré-visualização de 10 s do Tavinho, para aprovar o estilo.
4. EP1 completo e EP2 pronto antes de publicar.

## Estilo da página (aprovado pela dona a 5 nov 2026)
- Vetor plano com **contorno castanho-escuro fino e uniforme** (#3b2622) e **paleta suave**: cores um pouco menos saturadas e ligeiramente quentes. Cenários com muitos pormenores. Nos grandes planos, o fundo fica desfocado.
- Inspirado no tipo de desenho das referências da dona, **sem copiar**: os cenários, as cores e as formas das caras são nossos.
- O código está em `src/tavinho/style.tsx` (contorno, braços e mãos) e `src/tavinho/cast.tsx` (elenco). O filtro da paleta suave está em `Shell.tsx`. A ficha da personagem é a composição `TavinhoSheet`.

## O novo Tavinho (aprovado a 5 nov 2026): desajeitado e engraçado só de olhar
- Cara redonda e bochechuda, com bochechas coradas. Orelhas um pouco grandes. Nariz pequeno e redondo. Dois dentes da frente salientes.
- Olhos grandes com pálpebras que mudam com o humor. Óculos redondos com aro fino em tartaruga, tortos (uma lente mais alta) e a escorregar pelo nariz.
- Cabelo castanho com o caracol na testa e um remoinho espetado.
- Barriga redonda numa camisa pequena demais: um botão a abrir, uma ponta fora das calças, gravata vermelha curta e torta.
- Pernas finas de joelhos para dentro, calças curtas, meias trocadas (uma às riscas, outra às bolinhas) e sapatos castanhos grandes.
- Roupas: camisa e gravata (por defeito), pijama, moletom, t-shirt amarela.

## Personagem: Tavinho (Otávio, 27 anos)
- Baixinho e redondinho, com óculos enormes que escorregam pelo nariz.
- Camisa social azul-clara de botões, apertada na barriga, e gravata vermelha torta.
- Cabelo castanho com um caracol rebelde na testa. Bochechas coradas.
- Sua quando está nervoso, ou seja, sempre (gotas a voar).
- Bom moço, mas mente para impressionar e depois corre atrás do prejuízo.
- **Diferenças obrigatórias em relação ao "Cara da Foto":** nada de boné, nada de dente partido, nada de t-shirt de corrida, nada de barba por fazer.

## Elenco da Temporada 1
- **Camila:** namorada do Tavinho. Doce e orgulhosa dele (o que piora tudo).
- **Dona Celeste:** a sogra. Batom vermelho, óculos na corrente. Conta tudo à família inteira.
- **Vó Dita:** avó do Tavinho. Cozinha como ninguém, mas não para de falar.

## Estilo visual (original)
- Cartoon 2D vetorial, com contorno escuro grosso e cores planas com uma sombra suave.
- **Paleta própria:** azul-noite #1c2340 nos fundos, creme #fff4e0, laranja-abóbora #ff7a2e (cor de acento), verde-menta #3ddc97 (barra de progresso).
- A interface do telemóvel é genérica e inventada. Nunca copiar o layout exato do Instagram nem do WhatsApp.
- Feito em Remotion (2D, SVG/React) neste repositório.

## Regras de produção (herdadas do Hoot)
- Primeiro uma pré-visualização de 10 s de qualquer design novo. Propor guiões e deixar a dona escolher.
- Duas revisões antes de entregar: a minha (folha de frames a cada 0,5 s + verificação de som) e a de um agente independente.
- Sem abreviaturas com pontos na narração (a voz pára em cada ponto).
- Voz: Kokoro TTS em português do Brasil (`pm_alex` / `pf_dora`). Testar e deixar a dona escolher pelo ouvido.
- Ter sempre 2 episódios prontos antes de publicar.
