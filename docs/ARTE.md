# Direção de arte do FugaLab

## Recursos originais

Os dois recursos raster foram gerados com a ferramenta integrada de geração de imagens, especificamente para este jogo, e foram incorporados ao repositório. Os PNGs originais foram preservados; a seleção de quadros do robô acontece em Canvas durante o carregamento.

### Cenário — `assets/laboratorio.png`

Direção: laboratório de robótica de ficção científica em vista lateral, ilustração de jogo 2.5D com metal texturizado, arquitetura azul-petróleo, janelas para um campus futurista ao entardecer, iluminação ciano e âmbar e área frontal livre para a jogabilidade. Sem interface ou textos embutidos.

Prompt de produção: “polished 2D side-scrolling platform game background for FugaLab, a programming laboratory escape game, not a UI mockup”; “premium hand-painted 2.5D game environment”; “industrial teal-blue architecture”; “huge layered observation windows overlooking distant futuristic campus at dusk”; “mostly empty foreground traversal area”; “no text, no logos, no UI, no watermark”.

O renderizador alinha a borda ilustrada do piso ao plano de colisão e compõe sobre a arte as plataformas, porta, sensor, feixes e portal. A câmera acompanha o personagem; o cenário usa deslocamento menor para produzir paralaxe.

### Personagem — `assets/nit-atlas.png`

Direção: robô pesquisador NIT em perfil, com carcaça de cerâmica clara, juntas azul-petróleo, visor preto com olhos ciano, antena e mochila propulsora laranja. Atlas transparente de oito poses em quatro colunas por duas linhas.

Prompt de produção: “exact 4-column by 2-row game character animation sprite sheet with transparent background”; “identical design in every frame”; “cream ceramic armor, teal-blue mechanical joints, black glass face screen with two glowing cyan eyes, one short antenna, compact orange backpack propulsion unit”; “four sequential running cycle poses”; “standing idle”; “jumping upwards”; “airborne descending”; “victory pose with one arm raised”; “no text, no frame labels, no numbers, no logos, no watermark”.

Linha 1: quatro fases de corrida. Linha 2: parado, subida, descida e comemoração. Os quadros são recortados por transparência em tempo de execução e usam uma escala comum baseada na pose parada. Virar para a esquerda espelha o sprite inteiro, preservando a identidade do personagem.

## Composição e efeitos nativos

Interface, realce de sintaxe, partículas, piso, plataformas, feixes, sensor, porta e portal foram implementados em HTML/CSS/Canvas. Sons foram sintetizados com Web Audio. Não há recursos de terceiros baixados de bancos de imagens, trilhas, marcas ou sprites de outros jogos.

Os inimigos e as armas são desenhos nativos em Canvas: drones com propulsores, torres fixas e um guardião ampliado com escudo. Usam carcaças metálicas em gradiente, visor vermelho, miras de ataque, jatos animados, barras de energia e partículas. A paleta de alerta distingue a segurança do robô protagonista sem alterar os PNGs originais.
