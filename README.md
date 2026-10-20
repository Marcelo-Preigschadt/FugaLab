# FugaLab — A saída está no código

Jogo de plataforma para a Feira das Profissões, agora com **programação visual em blocos e seis salas**. O visitante muda números em três blocos, aplica e observa o resultado na física e no percurso. A arte do laboratório, as animações do robô NIT, o portal, as partículas e os sons permanecem integrados ao jogo.

## Publicar

No repositório **Marcelo-Preigschadt/FugaLab**, abra **Settings → Pages → Deploy from a branch → main → / (root) → Save**.

Endereço após a publicação: **https://marcelo-preigschadt.github.io/FugaLab/**.

Não há instalação, build, API, banco de dados ou fontes remotas. Os recursos gráficos ficam em `assets`. A atualização usa referências de módulos e CSS com `?v=2`; se o navegador ainda mostrar o editor antigo, recarregue com **Ctrl + F5** após o Pages concluir a publicação.

## Como apresentar ao visitante

1. Clique em **Iniciar experimento**. Ande com **← →** ou **A / D**; pule com **Espaço**, **↑** ou **W**.
2. Leia o objetivo e os dois passos acima do cenário. Os blocos usados naquela sala ficam destacados.
3. Clique em **+ / −** ou digite diretamente no número do bloco.
4. Observe **“alteração pendente”**: o jogo ainda usa o valor anterior. A simulação fica pausada durante o ajuste.
5. Clique em **Aplicar blocos e testar**, ou pressione **Enter** dentro de um campo numérico.
6. A simulação utiliza os novos valores e devolve o foco ao jogo. Teste com as setas e o pulo.
7. Use **Preciso de uma dica** se necessário. Não há limite de vidas: quedas e colisões levam ao checkpoint conservando os blocos.
8. Ao completar as seis salas, aparece **“Esta versão foi modificada por você.”**, com os valores escolhidos e um resumo da tentativa.

**Novo visitante** restaura a primeira sala e os valores iniciais. **Jogar com meu código** conserva os blocos criados e reinicia as seis salas.

## Blocos

| Bloco | Efeito | Valores |
| --- | --- | --- |
| **VELOCIDADE** | Define a velocidade desejada do robô. A aceleração e a frenagem continuam graduais. | Zero ou maior, sem teto fixo de 12. Aceita decimais e números grandes representáveis. |
| **PULO** | Define a força inicial do salto. O teto físico da sala impede sair do cenário. | De 1 a 30. |
| **BARREIRAS** | Reconstrói a quantidade de feixes nas salas que possuem obstáculos. Também participa das condições de acesso. | Inteiro de 0 a 12. |

Zero na velocidade impede o robô de andar; zero nas barreiras deixa o percurso sem feixes. Velocidades muito altas são aceitas para experimentação, mas dificultam o controle. O valor precisa ser finito e representável numericamente, inclusive após a conversão de unidades da física.

A interface mostra apenas atribuições visuais e explicações curtas. A opção recolhida **Ver o código criado pelos blocos** permite mostrar as três atribuições JavaScript correspondentes, sem exigir digitação de nomes ou pontuação. O parser interno continua restrito às três atribuições numéricas; não utiliza `eval` ou `Function`.

## Salas e combinações

As soluções abaixo são exemplos testados, não configurações únicas obrigatórias.

| Sala | Problema | Blocos principais | Exemplo de solução |
| --- | --- | --- | --- |
| **01 — Propulsão** | A plataforma está acima do alcance inicial. | Pulo | Velocidade **5**, pulo **14**, barreiras **6**. Aproxime-se, pule e alcance o núcleo. |
| **02 — Aceleração** | O sensor abre a porta por **1,85 s**. | Velocidade | Velocidade **8**, pulo **14**, barreiras **6**. Corra sobre o sensor. |
| **03 — Percurso** | O portal de transferência exige no máximo **3** barreiras. | Barreiras | Velocidade **8**, pulo **14**, barreiras **3**. Pule os feixes até o portal; **0** também é permitido. |
| **04 — Salto de precisão** | Há um vão e uma margem elevada. Altura e alcance horizontal precisam funcionar juntos. | Velocidade + pulo | Velocidade **10**, pulo **17**, barreiras **3**. Pule pouco antes do vão, pouse na plataforma e alcance o núcleo. |
| **05 — Rota expressa** | A porta abre por **1,30 s**, e o sensor exige até **2** barreiras. | Velocidade + barreiras | Velocidade **12**, pulo **17**, barreiras **2**. Ative o sensor e salte os feixes. |
| **06 — Reator central** | Primeiro carregue o núcleo mais alto. Depois atravesse a porta de **0,55 s**, com até **1** barreira. | Os três blocos | Velocidade **18**, pulo **20**, barreiras **1**. Alcance o núcleo; no checkpoint final, corra pelo sensor e pule o último feixe. |

O núcleo da sala 06 permanece carregado ao reiniciar ou reaplicar os blocos. Assim, a segunda parte pode ser repetida sem refazer o salto inicial.

## Aplicação e checkpoints

Na sala 01, alterar o pulo mantém a posição do robô. Nas salas seguintes, aplicar uma configuração diferente reinicia o trecho para um teste coerente, sem deixar novas barreiras sobre o personagem nem reutilizar um cronômetro já vencido. A sala 06 usa o checkpoint após o núcleo quando ele já foi carregado.

Valores inválidos ou campos vazios impedem a aplicação de todos os blocos daquela tentativa. Os valores anteriores continuam ativos. O destaque de alteração pendente diferencia claramente editar de aplicar. Ao clicar no cenário com ajustes pendentes, o jogo pede para aplicá-los antes de continuar.

## Atalhos

- **P:** pausar/continuar.
- **R:** reiniciar o trecho mantendo os blocos.
- **F:** tela cheia, fora dos campos numéricos.
- **Escape:** pausar; o navegador pode usar Escape primeiro para sair da tela cheia.
- **Enter**, dentro de um campo: aplicar blocos.
- **Ctrl + Enter / Cmd + Enter**, fora dos campos: aplicar blocos.

O som começa desligado. Trocar de aba ou tirar o foco da janela pausa a simulação. Em telas de toque, aparecem controles direcionais e de pulo.

## Rodar localmente

Com Python instalado, na pasta do projeto:

```sh
python -m http.server 8000
```

Abra **http://localhost:8000**. Não abra o HTML por duplo clique, pois os módulos precisam de HTTP/HTTPS. Os arquivos são locais e o servidor pode funcionar sem internet após obter o projeto. O Pages precisa de conexão para o carregamento inicial; não há cache offline automático.

## Organização

- `index.html` / `style.css`: interface em blocos, orientação, progresso e telas de início/pausa/vitória.
- `app.js`: blocos pendentes/aplicados, teclado, toque, áudio e atualização dos objetivos.
- `logic.js`: seis salas, configuração, parser, física, colisões e checkpoints.
- `render.js`: arte, animações, câmera, vão, plataformas, portas, feixes e portais.
- `assets/`: cenário, atlas original do robô e ícone.
- `tests/logic.test.js`: validação e percurso completo das seis salas.
- `docs/ARTE.md`: origem e direção dos recursos gráficos.

A física usa passo fixo de **1/120 s**. Colisões com paredes e portas verificam o cruzamento entre posições; os feixes usam teste de segmento contra a área expandida do obstáculo para não serem ignorados quando o deslocamento por quadro aumenta. Os valores de velocidade não exigem aumentar o número de passos de física. O teto e os limites do mundo mantêm o robô dentro do laboratório.

## Testes

```sh
npm test
```

Ou `node --test tests/*.test.js`, sem dependências. Os testes incluem velocidade acima do limite antigo, colisões em alta velocidade, bloqueio de sensores, queda no vão, checkpoint do núcleo e conclusão das seis salas por movimento e pulo. A interface em blocos e a sequência completa também são verificadas no navegador antes do envio ao repositório.
