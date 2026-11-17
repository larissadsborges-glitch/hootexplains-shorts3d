# O PC aguenta? (verificado 16 nov 2026)

## O que o PC tem
- Processador i7-6700K (4 núcleos / 8 threads), 16 GB de RAM (8 GB livres em uso normal), placa GTX 1050 Ti.
- 3 discos SSD: C: 88 GB livres (Windows), **E: 56 GB livres: as gravações e os clipes vão para E:\clipper** (o disco do Windows fica livre), D: 5 GB livres (não usamos).
- Internet por cabo: ~550–680 Mbit/s a descarregar, ~78 Mbit/s a enviar, 18 ms. Sobra muito.
- Modo de energia "Elevado desempenho" e o PC nunca adormece ligado à corrente. Ótimo.

## Teste real (16 nov, 6 min, summit1g + Gaules ao mesmo tempo)
- 2 lives a gravar = ~10% do processador, <1 GB de RAM.
- 720p ocupa ~1,2 GB/hora por live, mas só ficam os últimos 15 min no disco (~300 MB por live).
- 4 momentos encontrados, cada clipe editado em ~45 s (legendas em PT e EN certas, som -13/-14 LUFS).
- Corrigido: o último clipe ficava a meio quando tudo parava; agora a edição acaba a fila primeiro.

## Quantas lives ao mesmo tempo
- **8 com folga** (4 inglês + 4 brasileiro): ~40% do processador e ~3 GB de RAM; a edição faz ~80 clipes/hora.
- Mais de 10 começa a deixar o PC pesado.

## O que tu fazes antes do dia 19
1. **Fechar enquanto grava:** Chrome e Opera GX (o Chrome sozinho estava com 2 GB), uTorrent (utweb: come internet e disco), LM Studio, Steam e Discord (atualizações).
2. **VPN Windscribe desligada** (abranda e muda o país).
3. **Pausar as atualizações do Windows** uma semana (Definições > Windows Update > Pausar), para não reiniciar a meio da noite.
4. O sistema **não usa browser nenhum**, por isso não é preciso outro browser.

## O que não dá
- A placa gráfica não ajuda na edição (o ffmpeg novo pede um driver que já não suporta a GTX 1050 Ti): edita no processador, e chega.
