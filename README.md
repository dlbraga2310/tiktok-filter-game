# Chuva de Docinhos (filtro de TikTok)

Um jogo simples para fazer no **Effect House**, o programa gratuito da TikTok para criar filtros.

**Como joga:** doces caem do topo da tela. A pessoa **abre a boca** para pegar os doces e **evita as bombas**. Quanto mais doces seguidos, maior o **combo** (ate x5), e cada doce vale mais pontos. O jogo vai ficando mais rapido. Sao 3 vidas (bomba ou doce que cai no chao tira uma vida). Cada doce pego toca uma nota mais aguda, entao pegar varios seguidos "toca uma musiquinha". Isso e o que deixa viciante.

---

## IMPORTANTE: leia isto antes (honestidade)

Este projeto foi montado **sem poder abrir o Effect House** (ele so roda em Windows/Mac, e quem montou usou um ambiente sem ele). Entao:

- **Testado de verdade:** a logica do jogo (pontos, combo, vidas, velocidade, bombas) tem 13 testes automaticos que passam. Os sons e imagens foram gerados e conferidos (duracao, tamanho).
- **NAO testado:** o script `scripts/GameController.js` dentro do Effect House. Os nomes de comandos da API (ler a boca, mover objetos, tocar som) podem precisar de ajustes pequenos na sua versao. Se algo nao funcionar, a secao "Se der problema" abaixo ajuda.
- **Nao ha promessa de dinheiro.** Veja a secao de monetizacao no fim.

---

## O que tem nesta pasta

| Pasta/arquivo | Para que serve |
|---|---|
| `assets/images/` | Imagens prontas: 3 doces, bomba, anel da boca, coracao, estrela |
| `assets/audio/` | Sons prontos: `bgm_loop.wav` (musica de 16 s que repete), `sfx_catch_1..5.wav` (pegar doce, cada um mais agudo), `sfx_bomb.wav`, `sfx_gameover.wav`, `sfx_start.wav` |
| `scripts/GameController.js` | O script que voce coloca no Effect House |
| `src/gameLogic.js` | A mesma logica, separada para testar |
| `tests/` | Testes automaticos |
| `tools/generate_assets.py` | Gerador das imagens e sons (voce **nao precisa** usar, ja estao prontos) |

Todos os sons e imagens sao originais, criados por codigo. Nenhuma musica de terceiros, entao nao ha problema de direitos autorais.

---

## Passo a passo no Windows (do zero)

### 1. Preparar o computador

1. Crie uma conta no TikTok (se ainda nao tem) e **use o mesmo login depois**.
2. Baixe o Effect House no site oficial: [effecthouse.tiktok.com](https://effecthouse.tiktok.com). Clique em **Download** e escolha **Windows**.
3. Instale (Avancar, Avancar, Concluir) e abra o programa. Entre com sua conta do TikTok.
4. Baixe este projeto para o computador (pasta `tiktok-filter-game`). Voce **nao precisa instalar Python nem Node**.

### 2. Criar o projeto

1. No Effect House, clique em **New Project** (Novo Projeto) e escolha **Blank** (em branco) ou um modelo de **Face** (rosto).
2. De o nome `ChuvaDeDocinhos` e crie.
3. Voce vera 4 areas: **Hierarchy** (lista de objetos, a esquerda), **Scene/Preview** (o centro, com a camera), **Inspector** (propriedades, a direita) e **Assets** (arquivos, embaixo).

### 3. Importar as imagens, sons e script

1. Na area **Assets**, clique com o botao direito, **Import** (Importar), e escolha todos os arquivos de `assets/images/` e `assets/audio/`.
2. Para o script: clique com o botao direito em Assets, **New > Script** (ou **Import**) e use o conteudo de `scripts/GameController.js`. Se criar novo, apague o texto de exemplo e cole o nosso. O nome do arquivo deve ser `GameController.js`.

### 4. Criar os objetos da cena

Na **Hierarchy**, clique em **+** (Add) e crie os itens abaixo. **Os nomes precisam ser exatamente iguais**, com maiusculas e minusculas. (Se preferir outros nomes, mude o bloco `CONFIG` no inicio do script.)

| Nome | Tipo (menu +) | Observacao |
|---|---|---|
| `ScoreText` | Text (2D) | Canto superior, tamanho grande |
| `LivesText` | Text (2D) | Abaixo do placar |
| `MessageText` | Text (2D) | No meio da tela |
| `MouthRing` | Image/Sprite (2D) | Use `mouth_ring.png`. Fica na altura da boca |
| `Item1` ... `Item8` | Objeto vazio (Empty) | Oito copias (Ctrl+D duplica) |
| dentro de cada `ItemN` | 4 Images, nesta ordem: | 1) `candy_pink.png`, 2) `candy_blue.png`, 3) `candy_yellow.png`, 4) `bomb.png` |
| `BgmLoop` | Audio | Arquivo `bgm_loop.wav`, marque **Loop** |
| `SfxStart` | Audio | `sfx_start.wav` |
| `SfxCatch1` ... `SfxCatch5` | Audio | `sfx_catch_1.wav` ... `sfx_catch_5.wav` |
| `SfxBomb` | Audio | `sfx_bomb.wav` |
| `SfxGameOver` | Audio | `sfx_gameover.wav` |

Dica: desmarque **Play on Start** (tocar ao iniciar) nos objetos de audio, pois o script toca na hora certa.

Os objetos de som e imagem ficam na lista, nao precisa arruma-los na tela, exceto os textos e o anel.

### 5. Ligar o script

1. Crie um objeto vazio chamado `Game`.
2. No **Inspector**, clique em **Add Component > Script** e escolha `GameController.js`.

### 6. Rastrear o rosto e a boca

1. Em **+**, adicione **Face Tracker** (ou "Face Effects") para o efeito reconhecer o rosto.
2. O script tenta ler a abertura da boca sozinho. **Se nao funcionar** (provavel na primeira vez, veja abaixo), use o plano B.

### 7. Testar no computador

1. Clique em **Play/Preview** no Effect House. Ele usa a webcam.
2. **Toque/clique na tela** para comecar. Enquanto o mouse esta pressionado, conta como "boca aberta" (so para testar sem a boca).

### 8. Testar no celular

1. No Effect House, clique em **Preview on Device** (testar no celular). Aparece um **QR code**.
2. Abra o **TikTok** no celular, toque no icone de **escanear** (busca > scan) e leia o QR code. O filtro abre na camera do TikTok.
3. Jogue, ajuste o que estiver estranho.

### 9. Publicar

1. Clique em **Publish** (Publicar). Preencha nome (ex.: `Chuva de Docinhos`), icone e descricao.
2. Envie para **revisao**. A TikTok analisa e aprova ou nao (costuma levar de algumas horas a alguns dias). Siga as regras de conteudo da TikTok.
3. Depois de aprovado, o filtro fica disponivel e voce pega o link para divulgar.

---

## Se der problema

- **Nada acontece / erro no console:** abra o painel **Console/Logs**. O script escreve `Objeto nao encontrado: Nome` se um nome estiver errado. Confira os nomes da tabela.
- **A boca nao e detectada:** ajuste o numero `mouthOpenThreshold` no `CONFIG` ou use o **Visual Scripting** do Effect House: crie um gatilho "Mouth Open" (boca aberta) que chama a funcao `setMouthOpenFromTrigger(true)` do script, e "Mouth Close" chamando com `false`.
- **Toque nao inicia o jogo:** use o Visual Scripting com "Screen Touch" chamando `tap()`.
- **Escala errada (doces fora da tela):** mude `worldHalfWidth`, `worldTop`, `worldBottom` no `CONFIG`.
- **Erro em comandos do tipo `getComponent("SDFText")` ou `AudioComponent`:** a API muda entre versoes. Consulte a documentacao oficial em [effecthouse.tiktok.com](https://effecthouse.tiktok.com) (area de Scripting) e troque o nome do comando. Se quiser, copie a mensagem de erro e peca ajuda.
- **Opcao mais facil (sem script):** o Effect House tem modelos prontos de jogo com boca (Templates). Se o script der muito trabalho, comece por um modelo e troque as imagens e sons pelos desta pasta.

---

## Ideias para o filtro ser mais compartilhado

- **Comece rapido:** a primeira coisa que aparece e "Abra a boca!". Em 2 segundos a pessoa ja esta jogando.
- **Partidas curtas (30 a 60 s):** faz a pessoa querer "so mais uma".
- **Rostos engracados:** abrir a boca gera reacoes que dao bons videos. Incentive no texto do filtro: "Desafie um amigo!"
- **Recorde na tela:** o jogo mostra o recorde ao final. As pessoas gravam para provar a pontuacao.
- **Combo com som:** o som sobe de tom a cada combo, esse e o "vicio". Mexa nos sons se quiser outro estilo.
- Poste voce mesmo videos usando o filtro, com 3 a 5 hashtags relevantes, e marque o efeito.
- Faca variacoes (tema Halloween, tema futebol) trocando imagens.

## Monetizacao (sem promessas)

A TikTok tem programas para criadores de efeitos (por exemplo, o **Effect Creator Rewards**), mas **as regras, requisitos e valores mudam e variam por pais**. **Confira nas paginas oficiais** da TikTok/Effect House se voce e elegivel e como funciona. Nao ha garantia de ganho: muitos filtros nao tem muito uso. Trate como um projeto para aprender e testar. Tambem pode divulgar portfolio para marcas, mas isso depende de voce.

---

## Para quem quiser mexer (opcional)

- Mudar a dificuldade: valores no inicio de `src/gameLogic.js` (`DEFAULTS`). Depois copie as mesmas mudancas para o bloco `GAME LOGIC` de `scripts/GameController.js`.
- Rodar testes (precisa Node 18+ instalado): `npm test`
- Gerar imagens e sons de novo (precisa Python 3 com `pip install numpy pillow`): `python tools/generate_assets.py`

## O que NAO foi testado (resumo)

- O script dentro do Effect House (API Amaz): leitura da boca, mover objetos, trocar visibilidade, tocar audio, toque na tela.
- A passos da interface do Effect House acima: os nomes de menus podem diferir um pouco na sua versao.
- O envio para revisao da TikTok.
- Como o jogo "se sente" (velocidade, dificuldade) com um rosto de verdade. Ajuste os numeros ate ficar bom.
- Os sons foram criados por codigo e conferidos so por duracao e volume; ouca e ajuste se quiser.
