# FugaLab — a saída está no código

Jogo de programação para a feira das profissões. O visitante edita código dentro da própria tela: os valores mudam o robô, os obstáculos e o armamento. Arte ilustrada, seis setores, drones de patrulha, torres, combate e um guardião final.

## Publicar no GitHub Pages

Em **Settings → Pages**, selecione **Deploy from a branch**, branch **main**, pasta **/ (root)**. Mantenha todos os arquivos e a pasta `assets`. O jogo é estático e não precisa de instalação, compilação, conta, webcam ou servidor de aplicação. Depois de uma atualização, use Ctrl + F5 caso apareça a versão anterior.

Para testar localmente, sirva esta pasta com um servidor HTTP, por exemplo `python3 -m http.server 8000`, e abra `http://localhost:8000`. Abrir index.html diretamente como arquivo pode bloquear os módulos JavaScript.

## A experiência do visitante

O visitante começa jogando, sem tutorial obrigatório e sem uma pausa ao entrar nas salas. As instruções que antecipavam a solução foram retiradas. Ao falhar em um salto, ficar bloqueado na plataforma, encontrar drones sem arma, atingir lasers ou perder o tempo da porta, recebe uma dica contextual sem interromper o controle. A dica destaca o editor; o botão **Editar código** permite ir até ele voluntariamente. **Preciso de uma dica** continua disponível para solicitar a solução sugerida.

O som vem ligado. O primeiro clique desbloqueia o Web Audio do navegador; o botão de som permite silenciar e religar. Novo visitante e troca de sala preservam a preferência de áudio.

Os avisos do cenário usam letras claras sobre placas escuras. O tamanho de texto em Canvas compensa a escala do jogo para manter pelo menos 16 pixels CSS; HUD, orientações e notificações usam tipografia maior para projeção.

O código inicial contém três variáveis:

```js
const velocidade = 5;
const forcaDoPulo = 8;
const quantidadeDeObstaculos = 6;
```

Na segunda sala, o visitante precisa **escrever uma nova linha**, criando a habilidade de disparar:

```js
const arma = 1;
```

A arma não existe na programação inicial. Apagar sua declaração ou definir zero desativa os disparos. Valor 1: laser; 2: disparo rápido; 3: três projéteis em leque. Segurar J ou X dispara na direção em que o robô está olhando.

Clique em **Executar código** ou pressione Ctrl + Enter. O editor pausa o jogo enquanto a pessoa escreve. Erros mostram a linha e mantêm a configuração anterior. As dicas de cada fase explicam o que escrever e como testar o resultado.

| Setor | Desafio | Uma combinação possível |
| --- | --- | --- |
| 1. Propulsão | Alcançar o núcleo elevado | Pulo 14 |
| 2. Segurança | Criar a arma e destruir dois drones; saltar as coberturas | Arma 1 ou 2, pulo 14 |
| 3. Defesa | Combinar cenário, coberturas, torre e patrulhas | Até 3 barreiras, arma 2 |
| 4. Ponte | Cruzar o vão, pousar na margem alta e enfrentar a sentinela | Velocidade 10, pulo 17, arma ativa |
| 5. Fuga | Eliminar guardas, salvar checkpoint e vencer porta temporizada | Velocidade 12, pulo 17, até 2 barreiras |
| 6. Reator | Ativar núcleo alto, romper escudo e derrotar o chefe | Pulo 20, arma 3, até 1 barreira |

As combinações são sugestões. A velocidade não tem teto fixo; valores exagerados tornam o controle difícil. Pulo aceita 1 a 30, obstáculos 0 a 12, arma 0 a 3. Quantidade de obstáculos e arma exigem inteiros.

## Controles e combate

- Setas ou A/D: mover. Espaço, W ou ↑: pular.
- J ou X: segurar para atirar. R: reiniciar trecho. P/Esc: pausar. F: tela cheia.
- Botões de toque também permitem andar, pular e disparar.
- O robô tem três pontos de energia. Após um impacto, ganha proteção temporária. Perder toda a energia ou cair retorna ao checkpoint com energia restaurada.
- Caixas bloqueiam projéteis dos dois lados. Salte ou mude de posição para ter linha de tiro.
- Inimigos mostram uma linha de mira antes de atacar; o tiro segue a direção anunciada, permitindo esquiva.
- Drones patrulham e flutuam. Torres guardam posições fixas. O guardião dispara leques de projéteis e fica protegido até o núcleo ser ativado.
- Eliminar todos os defensores restaura a energia. Inimigos derrotados e o dano já causado são preservados nos reinícios do trecho, inclusive ao executar código: a feira favorece experimentação e progresso.
- A sala 5 salva o checkpoint após o combate. A sala 6 salva o núcleo e reposiciona o robô no acesso à arena.
- **Novo visitante** limpa todo o progresso e restaura o código inicial. O final mostra “Esta versão foi modificada por você”.

## Arquivos

`index.html`: interface. `style.css`: visual e adaptação ao projetor. `logic.js`: parser, física, fases e combate. `render.js`: desenho, sprites e efeitos. `app.js`: editor, entradas e estado da interface. `assets/`: arte original do laboratório e do robô, preservada nesta versão.

O terminal interpreta atribuições numéricas conhecidas; não usa eval nem executa JavaScript arbitrário. Cada variável deve ser escrita em uma linha. Aceita const/let, comentários `//` e ponto e vírgula opcional.

## Verificação

Execute `npm test` com Node.js. A suíte cobre parser, criação da arma, modos de disparo, dano, cobertura, aviso prévio dos ataques, checkpoints, escudo, colisões e uma campanha completa com movimentos, saltos e tiros, sem teletransportar o jogador.
