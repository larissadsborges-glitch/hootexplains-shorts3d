# Clipper — clipes de lives, grátis (16 nov 2026)

O que faz:
1. **Grava a live** (Twitch, YouTube; Kick por testar) a partir de agora, com yt-dlp.
2. **Encontra os melhores momentos sozinho** (ver `react.py`):
   - **Chat da Twitch:** cada pessoa conta uma vez a cada 5 s, com o peso da sua mensagem mais forte. Pedir clipe ("clip it", "CLIPA") vale 4; riso (KEKW, ICANT, kkkk, jajaja, 💀), choque (wtf, meu deus, monkaS, ???) e hype (Pog, W, bora, 🔥) valem 2; tristeza (L, F, Sadge) vale 1,5; uma parede só de emotes vale 1,3; uma mensagem normal vale 1. Os emotes do próprio canal (7TV, BTTV, FFZ, xqcLUL...) contam. Bots e !comandos não contam. Raids e chuvas de subs oferecidos ficam abafados durante 30-90 s.
   - **3 ou mais pessoas a pedir clipe** também dão um momento.
   - **Pico de volume** (gritos, risos), que funciona também no Kick e no YouTube.
   - **Pontuação:** chat + volume + pedidos de clipe. Nenhum sinal é obrigatório. A fasquia sobe com cada clipe dos últimos 10 min, por isso uma live agitada dá só os melhores. O editor faz primeiro o clipe mais forte. Todas as hipóteses e pontuações ficam em `highlights.jsonl`.
3. **Corta** 25 s antes do momento até 8 s depois.
4. **Edita na hora** para vertical 1080x1920 (ver `layout.py`):
   - **Webcam num canto:** a câmara vai para cima e o jogo para baixo, sem repetir a cara (uma fatia inevitável fica desfocada). **A câmara é a live toda:** corte vertical à volta da cara. **Sem webcam:** a live ao centro sobre fundo desfocado.
   - Legendas grandes palavra a palavra entre a câmara e o jogo: a palavra dita a amarelo, as reações (NO WAY, WHAT, LET'S GO) a vermelho.
   - Gancho no topo = a frase dita no momento. Etiqueta amarela de contexto tirada do título da live (GTA 6 · LAUNCH DAY, GTA 6 · FIRST TIME, GTA RP).
   - **Mensagens reais do chat** a aparecer no momento (sem nomes, sem insultos).
   - Replay no fim: **desligado** (16 nov, não queres). Continua no código (`replay=True`) se um dia for preciso.
   - Clipes com anúncios da Twitch ("Commercial break") são deitados fora. Crédito @do_streamer, som a -14 LUFS.
5. **Separa e prepara para publicar:** cada clipe vai para `E:\clipper\prontos\<en|pt|es>\` ou `E:\clipper\rever\<língua>\` (música, palavra proibida, pouca fala) com um .txt: título, legenda com crédito e link, hashtags, pontuação e transcrição. O nome do ficheiro traz a hora, o canal e os pontos. O gancho é a frase dita no momento; se ninguém falar, usa o gancho do canal. Não começa a meio de uma frase. **Publicar é contigo.** Regras em `REGRAS.md`.
6. **Guarda sempre a gravação original (17 Nov):** cada clipe feito deixa em `<pasta de saída>\originais\` a gravação SEM edição, com o mesmo nome do clipe + `_original.mp4`: 3 min antes do momento até 50 s depois, na qualidade da live (sem recompressão). O .txt do clipe diz onde está. Só se o disco ficar com menos de 15 GB livres é que os originais mais antigos são apagados (fica escrito no registo).
6. **Aguenta o dia todo:** se um canal ainda não está em direto ou se a live cai, tenta outra vez a cada 60 s (podes ligar tudo antes de os streamers começarem). Os pedaços da live são apagados no fim de cada sessão e o corte cru é apagado depois de editado. Com menos de 8 GB livres no disco deixa de fazer clipes novos.

Tudo local e grátis: yt-dlp, ffmpeg, faster-whisper (já instalados em `.hoottools`).

## Comandos (Git Bash)
```bash
export HF_HOME=C:/Users/borge/.hoottools/cache/hf
PY=/c/Users/borge/.hoottools/venv/Scripts/python.exe
cd /c/Users/borge/hoot/tools/clipper
# vigiar uma live durante 60 min
$PY -I clipper.py watch https://www.twitch.tv/CANAL --minutes 60 --hook "ELE NÃO ESPERAVA ISTO"
# editar só um vídeo/momento
$PY -I clipper.py edit video.mp4 --start 120 --end 150 --hook "GANCHO" --credit "@canal"
# testar o leitor do chat
$PY -I clipper.py chat CANAL --seconds 60
```

## Regras
- Só criadores que **deixam** fazer clipes (programas de clipping, regras no canal/Discord). Crédito sempre no ecrã.
- Evitar momentos com música de fundo (o Instagram/YouTube corta o som ou bloqueia).
- Edição sempre (gancho + legendas): clipe cru é tratado como cópia.

## Testado (16 nov)
- Leitor do chat da Twitch: liga e conta mensagens.
- Edição: vídeo 16:9 e vertical, legendas, gancho, crédito, -14,2 LUFS; 22 s editados em ~35 s.
- Live real: ensaio com 3 lives (16 nov), 10 clipes, fila esvaziada.
- Nova deteção (16 nov): testada numa live simulada (spammer ignorado, raid abafado, momento real 18 pontos, grito sem chat 8,4 pontos) e no chat real do xQc (emotes carregados).
- Falta: chat do Kick (a forma não oficial foi bloqueada; no Kick só volume) e do YouTube.
