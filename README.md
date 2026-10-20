# FugaLab — A saída está no código

Jogo de plataforma para a Feira das Profissões. O visitante controla o robô NIT e modifica a programação **dentro da própria tela do jogo**. As mudanças alteram a física e o percurso imediatamente após clicar em **Executar código**.

O jogo usa arte própria de laboratório, atlas de oito poses do robô, câmera com acompanhamento, partículas, portal animado, efeitos sonoros opcionais e interface adaptada para computador, datashow e telas menores. Não utiliza bibliotecas externas, fontes remotas, APIs, banco de dados ou processo de build.

## Publicar no GitHub Pages

1. No repositório **Marcelo-Preigschadt/FugaLab**, abra **Settings → Pages**.
2. Em **Build and deployment**, selecione **Deploy from a branch**.
3. Escolha **main**, pasta **/ (root)** e clique em **Save**.
4. Depois da publicação, abra **https://marcelo-preigschadt.github.io/FugaLab/**.

Os arquivos já ficam na raiz do repositório. A pasta `assets` deve acompanhar o código. Nenhuma instalação de npm é necessária para publicar ou jogar.

## Operação na feira

1. Abra o site em Chrome, Edge ou Firefox atualizado.
2. Clique em **Tela cheia** ou use F11. O terminal permanece visível durante a partida.
3. Clique em **Iniciar experimento**.
4. Use **← →** ou **A / D** para andar, e **Espaço**, **W** ou **↑** para pular.
5. Quando o desafio exigir uma mudança, clique no número correspondente no terminal. A simulação pausa enquanto o código é editado.
6. Clique em **Executar código** ou use **Ctrl + Enter**. O jogo aplica todas as instruções válidas e devolve o controle ao robô.
7. Ao final, o jogo exibe **“Esta versão foi modificada por você.”**, os valores programados, o tempo ativo da simulação e o número de alterações.
8. **Jogar com meu código** reinicia as salas conservando a configuração criada. **Preparar para o próximo visitante** ou **Novo visitante** restaura os parâmetros originais.

O som começa desligado. O botão de som permite ativá-lo com uma ação do visitante. Em dispositivos com tela de toque, aparecem botões direcionais e de pulo.

## Os três desafios

| Sala | Problema observável | Parâmetro | Uma solução testada |
| --- | --- | --- | --- |
| 01 — Propulsão | O salto inicial não alcança a plataforma elevada. | `forcaDoPulo` | Alterar de **8** para **14**, pular junto à plataforma e alcançar o núcleo. |
| 02 — Aceleração | O sensor abre a porta por **1,85 segundo**; a velocidade inicial não permite atravessar a tempo. | `velocidade` | Alterar de **5** para **8**, executar e correr para a porta. |
| 03 — Controle do percurso | O portal exige no máximo três barreiras ativas. Os feixes que permanecem precisam ser superados. | `quantidadeDeObstaculos` | Alterar de **6** para **3**, executar e pular sobre as barreiras. **0** também é permitido. |

O botão **Preciso de uma dica** oferece uma sugestão relativa à sala atual. Colisões com os feixes levam ao checkpoint da sala, conservando o código. Não há limite de vidas.

## Código do visitante

```javascript
// Ajuste o robô para escapar.
const velocidade = 5;
const forcaDoPulo = 8;
const quantidadeDeObstaculos = 6;
```

| Variável | Valores aceitos |
| --- | --- |
| `velocidade` | Número de 3 a 12; aceita casas decimais com ponto. |
| `forcaDoPulo` | Número de 6 a 20; aceita casas decimais com ponto. |
| `quantidadeDeObstaculos` | Número inteiro de 0 a 10. |

O terminal implementa um **subconjunto de atribuições do JavaScript**, com as três variáveis acima, declarações `const`/`let` opcionais e comentários `//`. Não é um console JavaScript de uso geral. Não aceita expressões, funções, comandos de rede ou scripts arbitrários. Não utiliza `eval` nem `Function`.

A validação é transacional: erro de nome, valor, instrução duplicada ou variável ausente impede a aplicação de **todas** as alterações daquela execução. A linha problemática e a mensagem são exibidas no terminal. A configuração válida anterior permanece em uso.

Ao mudar a velocidade na sala 02, o robô retorna ao começo do trecho para repetir o teste da porta. Ao mudar a quantidade de barreiras na sala 03, o percurso é reconstruído e o robô volta ao checkpoint, evitando barreiras novas sobre o personagem. Alterar o pulo mantém a posição do robô.

## Atalhos e foco

- **P:** pausar ou continuar.
- **R:** reiniciar a sala atual sem apagar o código.
- **F:** alternar tela cheia, fora do editor.
- **Escape:** pausar; dentro do editor, sai da edição e abre a pausa. O navegador pode usar Escape primeiro para sair da tela cheia.
- **Ctrl + Enter / Cmd + Enter:** executar o código a partir do editor.
- **Tab**, dentro do editor: inserir dois espaços.

Trocar de aba ou tirar o foco da janela pausa o jogo. Clicar novamente no cenário depois de editar permite voltar ao jogo sem executar o texto pendente; o terminal continua indicando que há alterações não executadas.

## Rodar localmente

Na pasta do projeto, com Python instalado:

```sh
python -m http.server 8000
```

Abra **http://localhost:8000**. Não abra `index.html` por duplo clique: os módulos JavaScript precisam ser servidos por HTTP/HTTPS. Todos os recursos são locais; o servidor local funciona sem internet após obter os arquivos. No GitHub Pages, a conexão é necessária para o carregamento inicial. Não há service worker ou cache offline automático.

## Organização

- `index.html`: interface, terminal e telas de início/pausa/vitória.
- `style.css`: composição, sintaxe do editor e adaptação a diferentes telas.
- `logic.js`: parser do terminal, parâmetros, física, colisões e objetivos.
- `render.js`: arte, atlas do robô, câmera, cenário, partículas e portal.
- `app.js`: interação, teclado/toque, aplicação de código, estados e áudio.
- `assets/laboratorio.png`: cenário original.
- `assets/nit-atlas.png`: atlas original do robô, quatro colunas por duas linhas, com transparência preservada.
- `assets/icon.svg`: ícone do jogo.
- `tests/logic.test.js`: testes da lógica e do percurso completo.
- `docs/ARTE.md`: direção de arte e origem dos recursos.

A física avança com passo fixo de **1/120 s**, gravidade em unidades por segundo e aceleração/desaceleração independentes da taxa de quadros. O controle inclui tolerância de borda e buffer de pulo. A animação de corrida acompanha a distância percorrida, em vez de continuar rodando com o personagem parado na parede. A câmera ajusta o campo horizontal à proporção do cenário na tela.

## Verificação

```sh
npm test
```

Ou `node --test tests/*.test.js`, sem instalar dependências. Os testes incluem validação do terminal, rejeição de instruções arbitrárias, colisão, efeito real do pulo, porta temporizada, alteração das barreiras e conclusão das três salas por entradas de movimento/pulo.

A interface também foi verificada em navegador Chromium, em 1440×960, 1024×768 e 390×844. Um teste com teclado percorreu as três salas, executou as três alterações pelo terminal e chegou à tela de vitória, além de testar feedback para valor inválido. Não é uma garantia de desempenho em todos os computadores: a máquina do laboratório e o datashow continuam sendo o ambiente final de uso.
