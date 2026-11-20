# Guia da Glaucia: "Build Your First Engineering Bot with Grok Bot"

**Packt · 20/11 · 11:00–12:30 (horário de Brasília) = 9:00–10:30 ET · 90 min**

Como usar: deixe este guia aberto numa tela e compartilhe a outra. Cada bloco segue o mesmo roteiro: **(1) objetivo e janela de tempo, (2) HANDS-ON passo a passo, (3) SAY IT (fala em inglês, tradução e pronúncia), (4) transição e (5) checkpoint**. Leia em voz alta só o que está em **inglês** entre aspas. A tradução em itálico e a dica de pronúncia (🔊) abaixo são só para você. Os prompts você **copia e cola**, sem ler.

> Onde não tenho certeza do caminho no app, está escrito **conferir no ensaio**. O guia não traz preços, segredos nem dados do Itaú.

## Índice

<!-- BEGIN GENERATED:toc -->
**Início rápido:** [Run sheet de uma página](#run-sheet-de-uma-pagina) · [Cola de pronúncia](#cola-de-pronuncia)

**Blocos do workshop (cada um com objetivo, hands-on, fala, transição e checkpoint):**

1. [0 · Setup · 11:00–11:05](#0-setup-11001105) · slides 1–5
2. [1 · Criar os bots · 11:05–11:12](#1-criar-os-bots-11051112) · slides 6–8
3. [2 · Design · 11:12–11:20](#2-design-11121120) · slide 9
4. [3 · Verify · 11:20–11:40](#3-verify-11201140) · slides 10–14
5. [4 · Background PR · 11:40–11:55](#4-background-pr-11401155) · slides 15–16
6. [5 · Approval · 11:55–12:10](#5-approval-11551210) · slides 17–18
7. [6 · Recovery · 12:10–12:22](#6-recovery-12101222) · slide 19
8. [7 · Q&A · 12:22–12:30](#7-qa-12221230) · slides 20–23

**Antes do evento:** [Trilha e estado](#trilha-e-estado-da-preparacao) · [Como usar o deck](#como-usar-o-deck) · [Frases de emergência](#frases-de-emergencia) · [Checklist](#checklist-antes-do-evento) · [Charter de todo bot](#charter-de-todo-bot)

<!-- END GENERATED:toc -->

---

## Run sheet de uma página

Minuto a minuto. Para cada slide: o que acontece e o que cortar se estiver atrasada. "Cliques" são os passos que aparecem no slide.

<!-- BEGIN GENERATED:runsheet -->
| Brasília | ET | Slide | O que acontece (cliques e telas) | Tela compartilhada | Se atrasar |
|---|---|---|---|---|---|
| 10:45 | 8:45 | 1 | Abrir deck (F), notas (S), abas prontas: GitHub, Grok Bot, instruções QA/DevOps, preview | Slide 1 | — |
| 11:00 | 9:00 | 1 | Boas-vindas | Deck | Não se apresente por muito tempo. Seu nome está no slide. |
| 11:01 | 9:01 | 2 | Agenda em 8 passos (1 clique) | Deck | Pule este slide. Aperte a seta para a direita. |
| 11:02 | 9:02 | 3 | Tour do repo: README → `mvp/` → `docs/inception.md` (3 cliques) | GitHub | Pule o README. Mostre só a pasta mvp. |
| 11:03 | 9:03 | 4 | Arquitetura do MVP (5 cliques) | Deck | Mostre só a linha de cima. Quinze segundos. |
| 11:04 | 9:04 | 5 | A regra: quem constrói não julga, nenhum bot faz merge (1 clique) | Deck | Este slide nunca é cortado. É o que as pessoas vão lembrar. |
| 11:05 | 9:05 | 6 | Fluxo do time (6 cliques) | Deck | Vinte segundos. Clique rápido e diga só a primeira e a última frase. |
| 11:06 | 9:06 | 7 | Charter: owns · good output · stops (3 cliques) | Deck | Leia só a ideia principal: owns, good output, stops. |
| 11:07 | 9:07 | 8 | **Ao vivo:** criar FDE TypeScript, depois QA e DevOps, skills, grupo | Grok Bot | Não crie o DevOps ao vivo. Mostre só as instruções dele. |
| 11:12 | 9:12 | 9 | **Ao vivo:** prompt de design para o FDE | Grok Bot | Não leia o design inteiro. Mostre só a lista de arquivos e a lista de testes. |
| 11:20 | 9:20 | 10 | Aprovar design (prompt FDE) e **prova do FDE**; "Green CI is not acceptance" | Grok Bot → Deck | Cole o prompt e vá direto para o próximo slide. |
| 11:23 | 9:23 | 11 | Loop PR → verify → approve (5 cliques) | Deck | Trinta segundos. Clique rápido e diga só a última frase. |
| 11:25 | 9:25 | 12 | Regra de todo bot: **prove it works** (3 cliques) | Deck | Diga só a regra e a última frase. Trinta segundos. |
| 11:27 | 9:27 | 13 | Pirâmide de confiança: camadas baratas primeiro, revisão humana por último | Deck | Uma frase: verificações baratas primeiro, revisão humana por último. Depois abra o checklist do QA. |
| 11:28 | 9:28 | 14 | **Ao vivo:** prompt do QA, **prova do QA**, PASS/FAIL/WARN/BLOCKED | Grok Bot | Mostre duas ou três verificações planejadas e os pré-requisitos ausentes. Não apresente o plano como uma avaliação concluída. |
| 11:40 | 9:40 | 15 | **Ao vivo:** prompt do DevOps e **prova do DevOps**, status do CI e preview | Grok Bot / GitHub | Use os links de status que já estão no pull request se o tempo estiver curto. |
| 11:47 | 9:47 | 16 | **Ao vivo:** enviar feedback, ver a barra no dashboard | Preview | Envie só um feedback. Não peça à plateia. |
| 11:55 | 9:55 | 17 | Quem decide sou eu: desfaz em 1 min × humano decide | Deck | Leia só os títulos dos dois cartões. |
| 11:58 | 9:58 | 18 | **Ao vivo:** ler o PR (mudou, QA, CI) e fazer o merge | GitHub | Se vier FAIL, não corrija ao vivo. Mostre como exemplo e siga. |
| 12:10 | 10:10 | 19 | **Recuperação:** concluir núcleo, testes e revisão humana ou declarar BLOCKED; rotina só se tudo estiver concluído | Formulário / dashboard / evidências; Grok Bot só se opcional | A rotina já está omitida. Use o tempo para recuperar o núcleo, mas nunca passe de 12:22 BRT. Ao entrar no recap, diga os bloqueios em voz alta. As perguntas abrem às 12:26 BRT. |
| 12:22 | 10:22 | 20 | Recap: três frases (3 cliques) | Deck | Nunca corte o recap. Leva um minuto. |
| 12:23 | 10:23 | 21 | Economizar uso | Deck | Pule este slide. Termine exatamente às 12:30. |
| 12:24 | 10:24 | 22 | **OPCIONAL:** pstack (`/poteto-mode`, `/poteto-help`) | Deck | Pule este slide. Vá direto para as perguntas. |
| 12:26 | 10:26 | 23 | Perguntas e frase de encerramento (12:29) | Deck | Encerre às 12:29 com a frase final, mesmo que haja perguntas. |
| 12:30 | 10:30 | — | Fim | — | — |
<!-- END GENERATED:runsheet -->

> Nota de fuso: em 20/11 o ET já está no horário de inverno (UTC-5) e Brasília é UTC-3, então ET = Brasília − 2 h.

---

## Trilha e estado da preparação

A trilha principal é o MVP Next.js em `mvp/`; a API Fastify da raiz e os três exercícios antigos são prática extra. Fontes: [spec](../../spec.md), [inception](../inception.md) e [índice de issues/exercícios](../issues/README.md).

Ponto de partida inspecionado: PRs #9, #10 e #27 estão mesclados; a turma parte do `checkpoint/mvp-base` no SHA aprovado pela instrutora (confirmar na issue #21), não da `main`. Não usar a `main` como starter.

Preparação: [#16](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/16) comprova infraestrutura/API na preview isolada; [#17](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/17) alinha material. Referência completa na main e exercícios correspondentes: [#18](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/18) formulário e [#19](https://github.com/glaucia86/grok-bot-engineering-workshop/issues/19) dashboard, podendo compartilhar um único PR de funcionalidade. A aplicação de referência completa deve ser construída e validada antes do evento na main, por PRs e merges humanos. A turma usa checkpoint/mvp-base separado e congelado com lacunas intencionais; não mover essa ref para a referência completa.

Comentário opcional (omitido ou em branco vira `""`, no máximo 1000 caracteres após trim; `null` é inválido), nota inteira 1–5, média com uma casa (`4.25` → `4.3`) e agrupamento `Talk A`/`talk a` seguem a spec. FDE e DevOps usam no máximo três skills; o QA tem uma exceção: mantém a `interrogate` do pstack (decisão da Glaucia, porque a `interrogate` faz parte do pstack). Todos os bots aplicam `principle-prove-it-works` como definição de pronto: nenhum bot diz "pronto" sem prova do artefato real. WARN vale só para lacunas de cobertura AC9; falhas continuam FAIL, falta de acesso/isolamento/evidência continua BLOCKED. Os critérios AC1–12 estão mesclados.

O orçamento de 90 minutos é de planejamento, não resultado de ensaio cronometrado. Das 12:10 às 12:22, recuperação primeiro; a rotina só aparece se o núcleo estiver concluído e sobrar tempo. Os mascotes originais e a foto da apresentadora estão integrados. Os seis espaços de captura foram substituídos por ilustrações prontas e identificadas como exemplos; não é necessário inserir imagens durante a apresentação. Elas explicam o fluxo, mas não substituem a evidência real da aplicação.


---

## Como usar o deck

O deck fica em `docs/speaker/slides/index.html`. Ele funciona offline: o reveal.js, o rough.js (desenhos estilo Excalidraw) e as fontes Virgil e Inter estão dentro da pasta `docs/speaker/slides/vendor/`.

1. **Abrir.** Dê dois cliques em `docs/speaker/slides/index.html` (abre no Chrome ou Edge). Se o navegador bloquear algo em `file://`, rode na pasta `docs/speaker/slides` o comando `npx serve .` e abra o endereço que aparecer. Conferir no ensaio qual dos dois jeitos funciona na sua máquina.
2. **Notas na tela de leitura.** Com o deck em foco, aperte **S**. Abre uma janela nova com o slide atual, o próximo, um cronômetro e as **notas em inglês, com tradução e dica de pronúncia em português** logo abaixo de cada bloco. Arraste essa janela para a tela que **não** é compartilhada. Se o navegador bloquear a janela, libere pop-ups para esse arquivo e aperte S de novo.
3. **Tela cheia na tela compartilhada.** Volte à janela principal (a do slide) e aperte **F**. Para sair da tela cheia, **Esc**.
4. **Compartilhar.** Na plataforma da Packt, compartilhe só a janela do deck (ou a tela onde ela está). Nunca a tela das notas.
5. **Navegar e cliques.** Seta para a direita, espaço ou Page Down = próximo **clique**. Nos slides com diagrama (arquitetura, fluxo do time, loop) e nos cartões, cada clique faz **um passo aparecer**: cada notas diz quantos cliques o slide tem. Seta para a esquerda ou Page Up = voltar. **Esc** ou **O** mostra a visão geral de todos os slides. **B** ou **.** escurece a tela (bom para uma pausa). O endereço muda para `#/N`, então dá para pular direto para um slide pela barra de endereço.
6. **Barra de tempo.** No rodapé do slide há uma barra com 8 segmentos, um por bloco, com a largura proporcional aos minutos. Ela enche conforme o horário planejado do slide e mostra "Brasília · ET". Compare com o relógio real. Se estiver mais de 2 minutos atrasada, use o "Se atrasarX" daquele slide.
7. **Demonstração ao vivo e ilustrações prontas.** Nos slides marcados "Live", troque de janela com Alt+Tab (Cmd+Tab no Mac) para o Grok Bot ou o GitHub e volte para o deck no fim. Os slides já incluem chats simulados, revisão de design, fluxo de CI/preview, formulário/dashboard, checklist de merge e recuperação. Não é necessário preparar ou inserir capturas. Os exemplos são ilustrativos; confira os resultados reais na aplicação ao vivo.
8. **Evidência real.** Abra a aplicação e o PR durante a demonstração. Resultados e dados desenhados nos slides são exemplos, não prova de execução. Capturas de ensaio são opcionais e, se usadas depois, exigem revisão de privacidade.
9. **Notas e blocos desta página vêm da mesma fonte.** As falas, as perguntas e as transições deste guia e das notas do deck são geradas por `scripts/speaker_content.py`. Para mudar uma frase, edite lá e rode `python scripts/speaker_content.py`.

---

<!-- BEGIN GENERATED:emergency -->
## Frases de emergência

> "Let's give it a few seconds."  
> *Vamos dar alguns segundos.*  
> 🔊 seconds → SÉ-kons

> "While the bot works, let me explain."  
> *Enquanto o bot trabalha, deixa eu explicar.*  
> 🔊 explain → ex-PLÊIN

> "Great question. Let's come back to it during Q&A."  
> *Ótima pergunta. Vamos retomá-la durante as perguntas e respostas.*  
> 🔊 great → GRÊIT

> "This is live, so things can be slow."  
> *É ao vivo, então pode demorar.*  
> 🔊 live → LÁIV; slow → SLÓU

> "If the preview is blocked, we keep that result and explain what is missing."  
> *Se a preview estiver bloqueada, mantemos esse resultado e explicamos o que falta.*  
> 🔊 blocked → BLÓCT; verified → VÉ-ri-faid

> "I'll read the question in the chat."  
> *Vou ler a pergunta no chat.*  
> 🔊 read → RÍID

> "Can you repeat that, please?"  
> *Pode repetir, por favor?*  
> 🔊 repeat → ri-PÍIT

> "Let's move on."  
> *Vamos seguir.*  
> 🔊 move → MÚUV

<!-- END GENERATED:emergency -->

Use a referência aceita da main somente se estiver acessível. Se ela também estiver indisponível, explique a limitação e mostre o código/evidência já retida, sem afirmar sucesso do exercício. Uma gravação é opcional, apenas se existir e for identificada como pré-gravada; este guia não exige nem afirma que ela existe.

---

## Checklist antes do evento

### Fork e checkpoint antes do exercício

Ao criar o fork autorizado, **desmarque “Copy the DEFAULT branch only”**: o GitHub só copia todas as branches quando essa opção fica desmarcada ([documentação oficial](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo?tool=webui)). Antes de começar, siga a [verificação e recuperação do checkpoint no README PT-BR](../../README.pt-br.md#verifique-o-checkpoint-do-exercício) ([English](../../README.md#verify-the-exercise-checkpoint)). No clone, confira que `origin` é o fork de exercícios autorizado e execute:

```sh
git ls-remote --exit-code --heads origin refs/heads/checkpoint/mvp-base
```

O resultado deve ter exatamente o SHA congelado aprovado na issue #21 e a ref `refs/heads/checkpoint/mvp-base`. Ref ausente, erro de acesso ou SHA divergente mantém **BLOCKED**; não usar `main` como alternativa. Se o fork veio só com a branch padrão, a recuperação documentada cria apenas a branch ausente a partir do upstream autorizado, com permissão e conferência do SHA, sem sobrescrever branches ou copiar credenciais. Só então criar a branch de exercício a partir do SHA verificado.

**Fala em inglês:** “When you fork, uncheck ‘Copy the DEFAULT branch only’ so the exercise checkpoint comes with it. Before we start, verify the exact remote branch and compare its commit with the instructor-approved frozen base. If it is missing or different, stop and ask for help. Do not start from main.”


- [x] Projeto **`grok-bot-workshop-mvp`** criado na Vercel, com Root Directory `mvp`.
- [x] `DATABASE_URL` configurada na Vercel.
- [x] Tabela `feedback` criada no Neon.
- [ ] Confirmar dataset de teste isolado para o estado vazio. Nunca esvaziar banco compartilhado; nome único não isola o banco. Não apagar o smoke test pré-existente sem autorização específica. Limpar somente dados da execução autorizada.
- [ ] Colocar a `DATABASE_URL` também como **secret no GitHub Actions**. Ela nunca vai em arquivo nem em chat.
- [ ] Gerar o **Protection Bypass for Automation** da Vercel e salvar como secret no GitHub Actions, para o Playwright conseguir abrir a preview. Conferir no ensaio.
- [ ] No commit de base revisado e registrado, preparar e verificar **antes do evento** o workflow de GitHub Actions, o harness com URL explícita da preview e a configuração do Playwright. Secrets configuradas e uma URL disponível, sozinhas, não comprovam esse fluxo.
- [ ] Antes do evento, comprovar a **infraestrutura/API** da issue #16: preview real, POST válido/inválido, GET público, dados isolados e persistência após nova instância, com SHA, CI e artefatos. A página inicial ainda pode ser a padrão. Depois da implementação de #18/#19, ensaiar a aplicação de referência completa na main e guardar sua evidência. Separadamente, verificar a base e as lacunas do checkpoint/mvp-base usado pela turma. A UI completa da referência é uma entrega explícita, não deve ser copiada para preencher as lacunas do exercício.
- [ ] Só considerar a infraestrutura pronta após esse ensaio passar. Se faltar CI, harness, isolamento ou acesso à preview, registrar **BLOCKED**, preparar a correção antes do evento; no palco, explicar o bloqueio e mostrar a referência aceita se disponível; o verificador Fastify local não substitui a validação da preview.
- [ ] Decidir a **visibilidade do repositório** (público ou privado). Antes, confira o histórico em busca de segredos.
- [ ] Atualizar o **Luma/Eventbrite** para 90 minutos.
- [ ] **Ensaio completo** com cronômetro, prints da **sua** conta e demonstração da referência aceita como alternativa, sem confundi-la com o resultado do exercício.
- [ ] QA e DevOps **ainda não criados**. As instruções deles ficam abertas numa aba, prontas para colar.
- [ ] Notificações desligadas e nenhum token visível na tela.
- [ ] Depois do ensaio, limpar somente os dados/processos identificados como pertencentes à execução autorizada, preservando a evidência.

---

## Charter de todo bot

Todo bot tem um charter de três partes. A primeira diz **do que ele é dono**. A segunda descreve **uma boa entrega**, com critérios que dá para checar. A terceira diz **onde ele para**: o que ele desfaz em menos de um minuto, faz sozinho, e o que envia, gasta, publica, apaga ou faz merge espera por você. A regra que vale para todos: **se não consegue mostrar de onde veio o número, deixa o número de fora.**

| Bot | É dono de | Boa entrega | Onde para |
|---|---|---|---|
| FDE | Implementação e PR | PR com o que mudou, por que e como testar, mais os testes e a preview | Sem push na main, sem merge, sem force-push |
| QA | Julgar o PR pela seção 5 do inception | PASS, FAIL, WARN (só cobertura AC9) ou BLOCKED por critério, com evidência | Sem merge, e só apaga o que ele mesmo criou |
| DevOps | CI e Vercel | Link do CI e preview URL, com os segredos conferidos só pela presença | Não mostra nem pede segredo, sem merge |

### Skills do FDE

- `shadcn`
- `vercel-react-best-practices`
- `neon-drizzle`

### Skills do QA

- `playwright-best-practices`
- `playwright-cli`
- `create-verification-skill`
- `interrogate` (pstack)

**Exceção ao limite de 3:** a `interrogate` fica no QA por decisão da Glaucia, porque faz parte do pstack. O QA tem quatro skills; o FDE e o DevOps continuam com no máximo três.

A `create-verification-skill` gera uma skill de verificação local do projeto, que dirige o app e captura evidência. Ela **não** monta o checklist. O checklist vem dos critérios AC1–12 da seção 5 do inception.

### Skills do DevOps

- `deploy-to-vercel`
- `ci-cd-and-automation`

### Passo final de todos os bots

- `principle-prove-it-works` (pstack, copiada em `.agents/skills/principle-prove-it-works`)

Aplicar no fim de cada entrega:

1. Conferir o artefato real, não um proxy, auto-relato ou “compila”.
2. Fazer um script da verificação.
3. Deixar a saída visível.

Essa skill fecha a entrega e não conta no limite de 3.

---

<!-- BEGIN GENERATED:blocks -->
## 0 · Setup · 11:00–11:05

### 🎯 Objetivo e janela

**Janela:** 11:00–11:05 (Brasília) = 9:00–9:05 ET · slides 1–5 · **Meta:** Abrir no horário e mostrar o que já está pronto: repositório, arquitetura e a regra principal.

✂️ **Se atrasar, corte isto:** pule o README e mostre só a pasta `mvp/`.

### 🖱 HANDS-ON · passo a passo

**Slide 1 · Welcome · 11:00–11:01**

1. Antes das 11:00: este slide está em tela cheia (tecla F) na tela compartilhada. Esta janela de notas (tecla S) está na sua tela de leitura.
   - ✅ **Esperado:** O slide preto de título aparece. A barra de tempo embaixo mostra 11:00.
   - ⚠️ **Se falhar:** Se a janela de notas não abriu, libere pop-ups nesta página e aperte S de novo.
2. Clique uma vez no cronômetro desta janela às 11:00 para zerar.

**Slide 2 · The plan · 11:01–11:02** · 1 clique(s) no slide

3. Aperte a seta para a direita uma vez. As quatro carinhas dos bots sobem para o canto.
   - ✅ **Esperado:** A agenda mostra 8 blocos em duas linhas.
4. Passe o dedo pelos blocos, da esquerda para a direita. Não leia cada bloco.
5. Clique uma vez: a última linha aparece (vocês só constroem o formulário e o dashboard).

**Slide 3 · The repo · 11:02–11:03** · 3 clique(s) no slide

6. Clique três vezes: cartão README, cartão mvp, cartão inception. Diga uma frase curta a cada clique.
7. Alt+Tab para o GitHub. Mostre nesta ordem: README.md, depois a pasta mvp/ na branch do exercício exercise/feedback-ui, depois docs/inception.md (role até a seção 5). Volte ao deck.
   - ✅ **Esperado:** Você vê API, schema, migration e testes em mvp/. Diga o que existe; só diga que a infraestrutura está pronta depois de conferir a evidência da issue #16.
   - ⚠️ **Se falhar:** Se o GitHub estiver lento ou a branch sumir, fique no deck e diga: 'O link do repositório está no guia.' Não use a main no lugar da branch do exercício.

**Slide 4 · MVP architecture · 11:03–11:04** · 5 clique(s) no slide

8. Clique 1: navegador e interface Next.js. Clique 2: rota da API. Clique 3: Drizzle e o banco Neon (mais a nota do cadeado). Clique 4: PR do GitHub para o GitHub Actions. Clique 5: preview da Vercel.
   - ✅ **Esperado:** Todas as 8 caixas e setas estão na tela após 5 cliques.
9. Não explique cada ferramenta. Uma frase curta por clique, cerca de 10 segundos cada.

**Slide 5 · The one rule · 11:04–11:05** · 1 clique(s) no slide

10. Pare. Fale devagar. Clique uma vez para mostrar a segunda linha (Nenhum bot faz merge. Eu faço).
   - ✅ **Esperado:** As duas linhas estão na tela. Espere três segundos em silêncio.

### 🗣 SAY IT · fale em inglês

*Slide 1 · Welcome*

> "Welcome, everyone! I am Glaucia. Today we will build a feedback app with a small team of bots. The API code is already in the repository, so we can focus on the form, the results, and how to check the work. I will guide the team, and we will use evidence to decide what is ready. First, let me show you the plan."  
> *Bem-vindos, pessoal! Eu sou a Glaucia. Hoje vamos construir um app de feedback com um pequeno time de bots. O código da API já está no repositório, então podemos focar no formulário, nos resultados e em como conferir o trabalho. Vou orientar o time, e vamos usar evidências para decidir o que está pronto. Primeiro, vou mostrar o plano.*

✂️ **Se atrasar:** Do not introduce yourself for long. Your name is on the slide. *(Não se apresente por muito tempo. Seu nome está no slide.)*

*Slide 2 · The plan*

> "We have 90 minutes. First, we will prepare our team and agree on a design. Then the FDE will build the form and dashboard while QA prepares its checks. After that, we will inspect the preview and review the evidence. A merge is possible, but it is not a promise. If something is blocked, we will say what is missing and finish with questions."  
> *Temos 90 minutos. Primeiro, vamos preparar o time e combinar um design. Depois, o FDE construirá o formulário e o dashboard enquanto o QA prepara as verificações. Em seguida, vamos conferir a preview e revisar as evidências. O merge é uma possibilidade, mas não uma promessa. Se algo estiver bloqueado, vamos dizer o que falta e encerrar com perguntas.*

**Perguntas prováveis**

- **Q:** Will the recording be available? *(A gravação vai ficar disponível?)*  
  **A:** I do not have the details yet. Please ask the Packt team in the chat. *(Ainda não tenho os detalhes. Pergunte ao time da Packt no chat.)*

✂️ **Se atrasar:** Skip this slide. Press the right arrow. *(Pule este slide. Aperte a seta para a direita.)*

*Slide 3 · The repo*

> "This repository has two tracks. The main branch is the complete reference app. The exercise branch, exercise/feedback-ui, already has the API and the database, but no form and no dashboard. That is what our bots will build today. The inception document defines the acceptance criteria, so the team knows what to deliver and how we will check it."  
> *Este repositório tem duas trilhas. A main é a aplicação de referência completa. A branch do exercício, exercise/feedback-ui, já tem a API e o banco, mas não tem formulário nem dashboard. É isso que nossos bots vão construir hoje. O documento inception define os critérios de aceite, para o time saber o que entregar e como vamos conferir.*

**Perguntas prováveis**

- **Q:** Can I get the repo? *(Posso ter acesso ao repositório?)*  
  **A:** Access is given by the instructor. Please ask in the chat. *(O acesso é dado pela instrutora. Pergunte no chat.)*
- **Q:** Why two tracks? *(Por que duas trilhas?)*  
  **A:** The reference stays clean. The exercise has unfinished features so we can build them live. *(A referência fica limpa. O exercício tem funcionalidades incompletas para construirmos ao vivo.)*

✂️ **Se atrasar:** Skip the README. Show only the mvp folder. *(Pule o README. Mostre só a pasta mvp.)*

*Slide 4 · MVP architecture*

> "Let us follow one feedback entry through the app. A user fills in the form in the browser. Next.js sends that input to the API route, where it is checked. The API then uses Drizzle to save it in Neon Postgres. The results page reads the saved feedback and shows the average for each talk. This is why we must test the full journey, not just the form."  
> *Vamos acompanhar um envio de feedback pelo app. Uma pessoa preenche o formulário no navegador. O Next.js envia esses dados à rota da API, onde eles são validados. A API usa o Drizzle para salvá-los no Neon Postgres. A página de resultados lê o feedback salvo e mostra a média de cada palestra. Por isso, precisamos testar o fluxo completo, não apenas o formulário.*

**Perguntas prováveis**

- **Q:** Why Neon and not another database? *(Por que Neon e não outro banco?)*  
  **A:** It is serverless Postgres and it is fast to set up. Any Postgres would work. *(É Postgres serverless e rápido de configurar. Qualquer Postgres serviria.)*
- **Q:** Where is the secret stored? *(Onde fica o segredo?)*  
  **A:** In the approved secure settings for the exercise. Never in committed files or chat. *(Nas configurações seguras aprovadas para o exercício. Nunca em arquivos commitados nem no chat.)*

✂️ **Se atrasar:** Show only the top row. Fifteen seconds. *(Mostre só a linha de cima. Quinze segundos.)*

*Slide 5 · The one rule*

> "Before we create the team, there is one rule to keep in mind. The bot that builds the feature does not give the final verdict on its own work. QA checks it independently, and I review the evidence. No bot merges in this workshop. That decision stays with me, including the decision to wait when something is missing."  
> *Antes de criar o time, temos uma regra para lembrar. O bot que constrói a funcionalidade não dá o veredito final sobre o próprio trabalho. O QA confere de forma independente, e eu reviso as evidências. Nenhum bot faz merge neste workshop. Essa decisão fica comigo, inclusive a decisão de esperar quando algo estiver faltando.*

**Perguntas prováveis**

- **Q:** Can a bot merge if I allow it? *(Um bot pode fazer merge se eu permitir?)*  
  **A:** You can allow it, but we do not do that in this workshop. A merge changes the real world, so a person decides. *(Pode, mas neste workshop não fazemos. O merge muda o mundo real, então uma pessoa decide.)*

✂️ **Se atrasar:** This slide is never cut. It is the one people remember. *(Este slide nunca é cortado. É o que as pessoas vão lembrar.)*

### ✅ Checkpoint

A plateia viu o repositório, a arquitetura e a regra principal. O relógio marca 11:05.

---

## 1 · Criar os bots · 11:05–11:12

### 🎯 Objetivo e janela

**Janela:** 11:05–11:12 (Brasília) = 9:05–9:12 ET · slides 6–8 · **Meta:** Criar o FDE do zero, depois o QA e o DevOps, com no máximo 3 skills cada (o QA tem 4: playwright-best-practices, playwright-cli, create-verification-skill e `interrogate`), e colocar os três num grupo com você. Todo bot termina com a `principle-prove-it-works` (passo final, fora do limite).

✂️ **Se atrasar, corte isto:** não crie o DevOps ao vivo. Mostre só as instruções dele.

### 🖱 HANDS-ON · passo a passo

**Slide 6 · The team flow · 11:05–11:06** · 6 clique(s) no slide

1. Clique 6 vezes. 1: você e o chat do grupo. 2: FDE TypeScript (triângulo verde). 3: QA bot (gota rosa). 4: DevOps (círculo roxo). 5: PR com evidências. 6: a linha vermelha, eu aprovo e faço o merge.
   - ✅ **Esperado:** O diagrama completo aparece com a linha vermelha voltando para você.

**Slide 7 · Every bot has a charter · 11:06–11:07** · 3 clique(s) no slide

2. Clique 3 vezes: cartão do FDE, do QA, do DevOps. Em cada um, leia só Owns, Good output, Stops.
3. Aponte para as cores: cada bot tem sua própria cor e formato.

**Slide 8 · Live: create the FDE · 11:07–11:12** · 2 clique(s) no slide

🎬 **DEMO AO VIVO AGORA →** Alt+Tab para o Grok Bot: criar o FDE, depois QA e DevOps. Volte ao deck no fim: Alt+Tab (Cmd+Tab no Mac).

4. Alt+Tab para o Grok Bot. Clique no botão de criar bot (caminho exato: conferir no ensaio). Nome: FDE TypeScript.
   - ✅ **Esperado:** Abre uma página de bot novo e vazia.
   - ⚠️ **Se falhar:** Se não encontrar o controle, mostre o slide ilustrativo e diga: 'Ainda não consigo concluir esta configuração ao vivo.' Use um bot preparado somente se ele realmente existir e sua configuração tiver sido verificada.
5. Cole o prompt do FDE (abaixo). Depois adicione as 3 skills: shadcn, vercel-react-best-practices, neon-drizzle. Onde ficam as skills no app: conferir no ensaio.
   - ✅ **Esperado:** O bot mostra as instruções e exatamente 3 skills.

   **Prompt para colar:**

```
Role: FDE (Forward Deployed Engineer) for the Talk Feedback app, a Next.js + TypeScript app in mvp/. Ignore the Fastify app at the repository root.

How you work:
1. Design first. Propose the files, contracts and tests, then wait for my approval.
2. After approval, implement on the work branch I give you and open one pull request to the target branch I give you.
3. Reuse the existing API, Zod schema and UI components. Keep the change small.

Done means: the checks pass and you pasted their real output.

Never: push to main, merge, force-push or print secrets.
```

6. Crie QA e DevOps com as instruções completas dos passos 10 e 11 do tutorial. O QA tem quatro skills explicitamente aprovadas; o FDE tem três e o DevOps, duas. Aplique principle-prove-it-works ao final de cada entrega; ela não conta no limite de skills.
   - ⚠️ **Se falhar:** O QA tem quatro skills de propósito: a interrogate fica. O FDE e o DevOps têm no máximo três. A principle-prove-it-works é o passo final de todos e não conta.
7. Crie o grupo 'Workshop - Packt Grok Bot' com você e os três bots (como criar grupo: conferir no ensaio). Volte ao deck por volta das 11:11. A simulação do chat em grupo está pronta: clique uma vez para as skills do FDE e outra para o lembrete de skills.
   - ✅ **Esperado:** O grupo mostra 4 membros: você e 3 bots.

### 🗣 SAY IT · fale em inglês

*Slide 6 · The team flow*

> "Think of me as the tech lead and the three bots as a small team. I give the task and keep the scope clear. The FDE builds the feature, QA checks the agreed criteria, and DevOps reports on CI and the preview. Their work meets in the pull request, where I can review the code, the results, and any blockers before making a decision."  
> *Pensem em mim como a tech lead e nos três bots como um pequeno time. Eu passo a tarefa e mantenho o escopo claro. O FDE constrói a funcionalidade, o QA confere os critérios combinados, e o DevOps informa o estado do CI e da preview. O trabalho se encontra no pull request, onde posso revisar o código, os resultados e os bloqueios antes de decidir.*

**Perguntas prováveis**

- **Q:** Do the bots talk to each other? *(Os bots conversam entre si?)*  
  **A:** They share one group chat, so they can read each other's work. I stay in control. *(Eles compartilham um chat de grupo, então leem o trabalho um do outro. Eu continuo no controle.)*

✂️ **Se atrasar:** Twenty seconds. Click quickly and say only the first and last sentence. *(Vinte segundos. Clique rápido e diga só a primeira e a última frase.)*

*Slide 7 · Every bot has a charter*

> "To make those roles useful, each bot needs a short set of instructions. We tell it what it owns, what a good result looks like, and when it must stop. For example, the FDE owns the code and the pull request, but it cannot merge. These boundaries help us delegate a clear task without handing over every decision. Now we can configure the team."  
> *Para esses papéis funcionarem, cada bot precisa de instruções curtas. Dizemos pelo que ele é responsável, como é um bom resultado e quando deve parar. Por exemplo, o FDE cuida do código e do pull request, mas não pode fazer merge. Esses limites ajudam a delegar uma tarefa clara sem entregar todas as decisões. Agora podemos configurar o time.*

**Perguntas prováveis**

- **Q:** Why three parts? *(Por que três partes?)*  
  **A:** It is short, and each part can be checked. If it is too long, the bot gets confused. *(É curto e cada parte pode ser conferida. Se for longo demais, o bot se confunde.)*

✂️ **Se atrasar:** Read only the yellow idea: owns, good output, stops. *(Leia só a ideia principal: owns, good output, stops.)*

*Slide 8 · Live: create the FDE*

> "I will start with the FDE. I paste its instructions, add its three skills, and check that everything was saved. Then I configure QA with four approved skills and DevOps with two. QA is the explicit exception to our three-skill limit. Every bot also applies the same completion rule: show proof before saying the work is done. Once these settings are verified, we can ask for a design."  
> *Vou começar pelo FDE. Colo as instruções, adiciono as três skills e confiro se tudo foi salvo. Depois configuro o QA com quatro skills aprovadas e o DevOps com duas. O QA é a exceção explícita ao nosso limite de três skills. Todos também aplicam a mesma regra de conclusão: mostrar a prova antes de dizer que terminaram. Depois de conferir as configurações, podemos pedir um design.*

**Perguntas prováveis**

- **Q:** What is a skill? *(O que é uma skill?)*  
  **A:** A skill is a small pack of know-how a bot can load. We keep it to three so the context stays small. *(Uma skill é um pacote pequeno de conhecimento que o bot pode carregar. Limitamos a três para o contexto ficar pequeno.)*
- **Q:** Why does QA have four skills? *(Por que o QA tem quatro skills?)*  
  **A:** It is the one exception. interrogate is part of pstack, and it helps QA challenge a result from many angles. principle-prove-it-works is separate: the final done-step for every bot. *(É a única exceção. A interrogate faz parte do pstack e ajuda o QA a questionar um resultado de vários ângulos. A principle-prove-it-works é à parte: o passo final de todo bot.)*
- **Q:** Can one bot do all roles? *(Um bot só não faz todos os papéis?)*  
  **A:** It can, but it is worse. One role per bot keeps the work clear and checkable. *(Faz, mas fica pior. Um papel por bot deixa o trabalho claro e fácil de conferir.)*

✂️ **Se atrasar:** Do not create DevOps live. Show only its instructions. *(Não crie o DevOps ao vivo. Mostre só as instruções dele.)*

### ✅ Checkpoint

Os três bots existem e estão num grupo com você. FDE e DevOps têm no máximo três skills; o QA tem quatro (com a interrogate). Todo bot termina com a principle-prove-it-works.

---

## 2 · Design · 11:12–11:20

### 🎯 Objetivo e janela

**Janela:** 11:12–11:20 (Brasília) = 9:12–9:20 ET · slides 9 · **Meta:** Pedir um design ao FDE antes de qualquer código e decidir as dúvidas em aberto.

✂️ **Se atrasar, corte isto:** não leia o design inteiro. Mostre só a lista de arquivos e de testes.

### 🖱 HANDS-ON · passo a passo

**Slide 9 · Block 2: Design · 11:12–11:20** · 1 clique(s) no slide

🎬 **DEMO AO VIVO AGORA →** Alt+Tab para o Grok Bot: chat novo com o FDE, colar o prompt de design. Volte ao deck no fim: Alt+Tab (Cmd+Tab no Mac).

1. Abra um chat NOVO com o FDE TypeScript (um chat por tarefa). Cole o prompt de design (abaixo). Clique uma vez no slide para mostrar a lista de revisão do design. A ilustração pronta fica na tela enquanto o FDE trabalha; não é preciso inserir prints.
   - ✅ **Esperado:** O bot começa a trabalhar. Enquanto trabalha, leia a lista no slide.
   - ⚠️ **Se falhar:** Se demorar mais de 2 minutos, diga 'Let's give it a few seconds.' e continue explicando a lista.

   **Prompt para colar:**

```
Context
- Repository: glaucia86/grok-bot-engineering-workshop
- Work branch: exercise/feedback-ui (already exists)
- Pull request target: exercise-target/2026-11-20
- Requirements: spec.md and docs/inception.md section 5 (AC1–AC12) on main
- Read first: the requirements on main, then the code in mvp/ on the work branch
- Already done: POST and GET /api/feedback, the Zod schema and the database. Missing: the UI.

Task: design only, no code yet.
1. /feedback: talk, author, rating 1–5 (required) and an optional comment. Show the same error messages as the API. On success, confirm and reset the form; on error, keep what the user typed.
2. /results: every talk with its average (one decimal, 4.25 → 4.3) and its count, one bar per talk, plus empty, loading and error states.

Deliver: the files you will change, the existing helpers you will reuse and the tests you will add. Keep it short.

Rules: no code until I approve.
```

2. Quando a resposta chegar, mostre três partes: decisões, arquivos, testes.
   - ✅ **Esperado:** Você consegue apontar: decisões, lista de arquivos, lista de testes e uma lista separada de suposições.
3. Se algo ficou em aberto, decida você e escreva a decisão no chat, em uma frase.

### 🗣 SAY IT · fale em inglês

*Slide 9 · Block 2: Design*

> "We are not asking for code yet. The FDE works on its own cloud computer, not on my laptop. It reads the requirements on main, spec.md and the inception document, and the code on the exercise branch, exercise/feedback-ui. Then it explains which files will change, how the form and the results will use the API, and which tests will check the work. I review those choices before we spend time building."  
> *Ainda não estamos pedindo código. O FDE trabalha no computador dele, na nuvem, não no meu notebook. Ele lê os requisitos na main, o spec.md e o documento inception, e o código da branch do exercício, exercise/feedback-ui. Depois explica quais arquivos vão mudar, como o formulário e os resultados vão usar a API e quais testes vão conferir o trabalho. Eu reviso essas escolhas antes de gastarmos tempo construindo.*

**Perguntas prováveis**

- **Q:** Why not let the bot just code? *(Por que não deixar o bot só programar?)*  
  **A:** The design gives QA a clear target. Without it, we may disagree about what is correct. *(O design dá um alvo claro ao QA. Sem ele, podemos discordar sobre o que está correto.)*

✂️ **Se atrasar:** Do not read the whole design. Show only the file list and the test list. *(Não leia o design inteiro. Mostre só a lista de arquivos e a lista de testes.)*

### ✅ Checkpoint

O FDE respondeu com decisões, arquivos e testes. Nenhum código foi escrito ainda.

---

## 3 · Verify · 11:20–11:40

### 🎯 Objetivo e janela

**Janela:** 11:20–11:40 (Brasília) = 9:20–9:40 ET · slides 10–14 · **Meta:** Aprovar o design específico, deixar o FDE implementar e o QA preparar verificações independentes com os critérios atuais do inception. A execução na preview vem após os pré-requisitos do próximo bloco.

✂️ **Se atrasar, corte isto:** não espere o QA terminar todos os critérios. Mostre 2 ou 3 resultados e siga.

### 🖱 HANDS-ON · passo a passo

**Slide 10 · Block 3: Verify · 11:20–11:23** · 1 clique(s) no slide

🎬 **DEMO AO VIVO AGORA →** Alt+Tab para o Grok Bot: chat do FDE, aprovar o design e depois colar o prompt de prova. Volte ao deck no fim: Alt+Tab (Cmd+Tab no Mac).

1. Alt+Tab para o chat do FDE. Cole o prompt de aprovação do design (abaixo). Volte ao deck enquanto ele trabalha.
   - ✅ **Esperado:** O FDE confirma que vai trabalhar na exercise/feedback-ui e que não fará merge.
   - ⚠️ **Se falhar:** Se o FDE perguntar qual repositório ou branch usar, pare e responda com o destino do exercício aprovado pela instrutora. Nunca a main de referência.

   **Prompt para colar:**

```
Design approved.

Context
- Repository: glaucia86/grok-bot-engineering-workshop
- Work branch: exercise/feedback-ui (already exists)
- Pull request target: exercise-target/2026-11-20
- Requirements: spec.md and docs/inception.md section 5 (AC1–AC12) on main

Task:
- Work on exercise/feedback-ui; do not create another branch.
- Write the tests first, then the code.
- From mvp/, run: npm test, npm run lint, npm run typecheck, npm run build, npm run verify:http.

Deliver: one pull request from exercise/feedback-ui into exercise-target/2026-11-20, saying what changed, why, and how to test it.

Rules: do not merge.
```

2. Quando o FDE disser que terminou, cole o prompt de prova (abaixo).
   - ✅ **Esperado:** O FDE cola a saída real de cada comando e o commit que testou.
   - ⚠️ **Se falhar:** Se ele disser que deu certo sem mostrar a saída, peça: 'Show me the real output.'

   **Prompt para colar:**

```
Task: before you say done, prove it works.

Deliver: the real output of each command you ran and the commit you tested. If something failed or you could not run it, say so clearly.

Rules: do not merge.
```

3. Clique uma vez no slide para mostrar a linha sobre o QA. As quatro etiquetas (PASS, FAIL, WARN, BLOCKED) já estão visíveis. Aperte a seta de novo para seguir: as etiquetas sobem para o topo.

**Slide 11 · The loop · 11:23–11:25** · 5 clique(s) no slide

4. Clique 5 vezes. 1: o FDE constrói. 2: pull request, CI e preview. 3: o QA testa o commit. 4: tudo PASS? sim, eu aprovo e faço o merge. 5: FAIL volta para o FDE, e BLOCKED não é aprovação.
   - ✅ **Esperado:** O ciclo está completo. A seta vermelha volta para o FDE.

**Slide 12 · Prove it works · 11:25–11:27** · 3 clique(s) no slide

5. Clique três vezes: conferir o artefato real, não um proxy, e transformar em script. Depois diga a regra em voz alta.
   - ✅ **Esperado:** Os três cartões estão na tela, com as carinhas dos bots e o crédito ao pstack.
6. Aponte os exemplos: 'compila', um auto-relato e um print antigo são proxies. Um valor que você lê do app rodando é a coisa real.

**Slide 13 · How do I trust my agents more? · 11:27–11:28**

7. Deixe este slide por cerca de trinta segundos, logo antes do checklist do QA. Percorra as cinco camadas de cima para baixo e aponte a seta de custo. O crédito e o link da palestra estão no slide; não leia a URL em voz alta.
   - ✅ **Esperado:** A pirâmide, a seta de custo e o crédito a Lauren Tan estão visíveis.

**Slide 14 · Live: QA prepares the checks · 11:28–11:40** · 3 clique(s) no slide

🎬 **DEMO AO VIVO AGORA →** Alt+Tab para o Grok Bot: chat do QA, colar o prompt do QA. Volte ao deck no fim: Alt+Tab (Cmd+Tab no Mac).

8. Abra o chat do QA e envie o prompt de planejamento abaixo. Neste bloco, o QA prepara a matriz AC1–12 enquanto o FDE implementa. Não execute escritas remotas.
   - ✅ **Esperado:** O QA relaciona AC1–12 às verificações planejadas, ferramentas disponíveis e pré-requisitos ausentes. Não há escritas na preview nem resultados PASS inventados nesta etapa de planejamento.
   - ⚠️ **Se falhar:** Se o QA disser BLOCKED, leia o motivo. Falta de acesso, isolamento ou evidência é uma resposta válida: explique. Não esconda.

   **Prompt para colar:**

```
Context
- Repository: glaucia86/grok-bot-engineering-workshop
- Work branch: exercise/feedback-ui (already exists)
- Pull request target: exercise-target/2026-11-20
- Requirements: spec.md and docs/inception.md section 5 (AC1–AC12) on main
- The FDE is building the feedback form and the results page on this branch.

Task: prepare your QA plan from AC1–AC12 in docs/inception.md section 5 on main, not from the FDE's description.

Deliver: one line per criterion: how you will check it (unit test, API call or browser) and what you still need.

Rules: this is a plan, so no PASS or FAIL yet.
```

9. Peça ao QA que confira o plano com os critérios combinados usando o prompt abaixo. Isto confere o plano, não o aplicativo publicado; ainda não há veredito de aceite.
   - ⚠️ **Se falhar:** Se o QA não conseguir mostrar um resultado, ele deve dizer BLOCKED. Não aceite 'deve passar'.

   **Prompt para colar:**

```
Task: for two of the criteria, show me exactly which test file, command or page you will use.

Deliver: the two mappings, with the file paths you inspected.

Rules: plan only, no PASS or FAIL yet.
```

10. Clique três vezes neste slide (é um mock ilustrativo, não resultados reais): linha PASS, linha FAIL, linha BLOCKED.
11. Quando o FDE mandar o link do pull request, abra e confira a linha do topo: exercise-target/2026-11-20 ← exercise/feedback-ui. Se aparecer main, não faça merge e peça ao FDE para trocar o destino.
   - ✅ **Esperado:** O QA indica o alvo planejado e a evidência necessária por critério. Os resultados reais só são registrados após a execução.
12. Plano B se a demo ao vivo quebrar: mostre a aplicação de referência verificada, se estiver acessível. Se não estiver, explique o bloqueio e mostre só evidência retida. Gravação é opcional e deve ser identificada como pré-gravada.

### 🗣 SAY IT · fale em inglês

*Slide 10 · Block 3: Verify*

> "The design is ready, so I approve it. Now the FDE builds it on the same branch, exercise/feedback-ui, runs the tests, and opens a pull request into our exercise target branch, not into main. While it works, QA prepares an independent plan. Green CI will be useful evidence later, but it does not replace the acceptance criteria."  
> *O design está pronto, então eu aprovo. Agora o FDE constrói na mesma branch, exercise/feedback-ui, roda os testes e abre um pull request para a nossa branch de destino do exercício, não para a main. Enquanto ele trabalha, o QA prepara um plano independente. O CI verde vai ser uma evidência útil depois, mas não substitui os critérios de aceite.*

**Perguntas prováveis**

- **Q:** Why a separate QA bot? *(Por que um bot de QA separado?)*  
  **A:** The one who did the work tends to think it is right. A separate bot checks the agreed criteria against the implementation and evidence. *(Quem fez o trabalho tende a achar que está certo. Um bot separado compara os critérios combinados com a implementação e as evidências.)*

✂️ **Se atrasar:** Paste the prompt and go straight to the next slide. *(Cole o prompt e vá direto para o próximo slide.)*

*Slide 11 · The loop*

> "Here is the loop we will follow. The FDE opens a pull request with its changes and local evidence. We then check CI, the preview, and the commit that QA will test. A failed check goes back to the FDE for a focused fix. A missing prerequisite stays blocked. After any change, we check the new commit again, so the final decision uses current evidence."  
> *Este é o ciclo que vamos seguir. O FDE abre um pull request com as alterações e as evidências locais. Depois conferimos o CI, a preview e o commit que o QA testará. Uma verificação com falha volta ao FDE para uma correção pontual. Um pré-requisito ausente continua bloqueado. Após qualquer mudança, conferimos o novo commit, para a decisão final usar evidências atuais.*

**Perguntas prováveis**

- **Q:** What does BLOCKED mean? *(O que significa BLOCKED?)*  
  **A:** It means QA is missing access or evidence. It is an honest answer, not a pass. *(Significa que falta acesso ou evidência ao QA. É uma resposta honesta, não uma aprovação.)*

✂️ **Se atrasar:** Thirty seconds. Click fast and say only the last sentence. *(Trinta segundos. Clique rápido e diga só a última frase.)*

*Slide 12 · Prove it works*

> "When a bot says something works, we need a way to check that claim. A summary, a successful build, or an old screenshot is not enough to prove the full feature. We need to run the relevant check against the actual target and keep the output. A small script makes that check repeatable. The target and permissions still matter: local proof does not authorize a remote write."  
> *Quando um bot diz que algo funciona, precisamos de uma forma de conferir essa afirmação. Um resumo, um build bem-sucedido ou um print antigo não bastam para comprovar a funcionalidade completa. Precisamos executar a verificação relevante no alvo real e guardar a saída. Um pequeno script permite repetir a verificação. O alvo e as permissões continuam importantes: uma prova local não autoriza uma escrita remota.*

**Perguntas prováveis**

- **Q:** Is this a skill or a rule? *(Isto é uma skill ou uma regra?)*  
  **A:** It is a pstack principle, a short skill. Each bot applies it at the end of its work. *(É um princípio do pstack, uma skill curta. Cada bot aplica no fim do trabalho.)*
- **Q:** Why not trust the bot when it says it works? *(Por que não confiar quando o bot diz que funciona?)*  
  **A:** A bot can be sure and wrong. Reading the real value costs little. A wrong guess costs much more. *(Um bot pode estar convicto e errado. Ler o valor real custa pouco. Um palpite errado custa muito mais.)*

✂️ **Se atrasar:** Say only the rule and the last sentence. Thirty seconds. *(Diga só a regra e a última frase. Trinta segundos.)*

*Slide 13 · How do I trust my agents more?*

> "Before the QA bot runs its checklist, here is how I trust an agent more. The pyramid is ordered by cost. The cheap, deterministic layers come first: the codebase, then static analysis. Verification comes next, prose rules after that, and human review last, because it is the most expensive. That is why our bots get skills, tests, and a QA checklist before a human approves."  
> *Antes de o bot de QA rodar o checklist, é assim que eu passo a confiar mais num agente. A pirâmide está ordenada por custo. As camadas baratas e determinísticas vêm primeiro: a base de código e, depois, a análise estática. A verificação vem em seguida, as regras em prosa depois disso, e a revisão humana por último, porque é a mais cara. Por isso os nossos bots recebem skills, testes e um checklist de QA antes de uma pessoa aprovar.*  
> 🔊 pyramid → PÍ-ra-mid; deterministic → di-tèr-mi-NÍS-tic; expensive → iks-PÉN-siv

✂️ **Se atrasar:** One sentence: cheap checks first, human review last. Then open the QA checklist. *(Uma frase: verificações baratas primeiro, revisão humana por último. Depois abra o checklist do QA.)*

*Slide 14 · Live: QA prepares the checks*

> "Now QA prepares the checks while the FDE builds. It starts from the agreed criteria, not from the author’s success message. For each criterion, it says how it will check it and what it still needs. At this stage, we are reviewing a plan. QA evaluates the real pull request in the next block."  
> *Agora o QA prepara as verificações enquanto o FDE constrói. Ele parte dos critérios combinados, não da mensagem de sucesso do autor. Para cada critério, diz como vai conferir e o que ainda falta. Nesta etapa, estamos revisando um plano. O QA avalia o pull request real no próximo bloco.*

**Perguntas prováveis**

- **Q:** How do you know QA is right? *(Como saber que o QA está certo?)*  
  **A:** It must show evidence for each result: a command, a URL, an output. If it cannot, it says BLOCKED. *(Ele precisa mostrar evidência em cada resultado: comando, URL, saída. Se não puder, diz BLOCKED.)*
- **Q:** Is this chat real? *(Este chat é real?)*  
  **A:** The slide is a mock, marked on screen. The chat in Grok Bot is real. *(O slide é um mock, marcado na tela. O chat no Grok Bot é real.)*

✂️ **Se atrasar:** Show two or three planned checks and the missing prerequisites. Do not present the plan as a completed evaluation. *(Mostre duas ou três verificações planejadas e os pré-requisitos ausentes. Não apresente o plano como uma avaliação concluída.)*

### ✅ Checkpoint

O FDE apresentou as evidências locais disponíveis. O QA preparou o plano AC1–12 e indicou os pré-requisitos ausentes da preview; o aceite continua pendente até a avaliação autorizada.

---

## 4 · Background PR · 11:40–11:55

### 🎯 Objetivo e janela

**Janela:** 11:40–11:55 (Brasília) = 9:40–9:55 ET · slides 15–16 · **Meta:** Mostrar que o trabalho roda na nuvem e provar o resultado: status do CI, preview e o gráfico mudando com um feedback real.

✂️ **Se atrasar, corte isto:** pule o pedido de status ao DevOps e abra a preview direto pelo PR.

### 🖱 HANDS-ON · passo a passo

**Slide 15 · Background PR · 11:40–11:47** · 1 clique(s) no slide

🎬 **DEMO AO VIVO AGORA →** Alt+Tab para o Grok Bot: chat do DevOps, depois abrir o PR no GitHub. Volte ao deck no fim: Alt+Tab (Cmd+Tab no Mac).

1. Diga que o trabalho roda na nuvem. Clique uma vez para mostrar o cartão do DevOps (mock).
2. Cole o prompt do DevOps (abaixo) no chat do DevOps.
   - ✅ **Esperado:** O DevOps dá o link do CI, a preview URL e diz que os segredos estão presentes (redacted).
   - ⚠️ **Se falhar:** Se algum valor de segredo aparecer na tela: pare de compartilhar a tela e pause a demonstração. Nunca leia em voz alta. Um operador autorizado deve revogar ou rotacionar a credencial agora, antes de retomar.

   **Prompt para colar:**

```
Context: pull request <PR_URL>

Task: check its GitHub Actions checks and its Vercel preview.

Deliver: each check (pass, fail or pending), the preview link, and whether both match the latest commit.

Rules: read-only; do not merge.
```

3. Cole o prompt de prova do DevOps (abaixo): ele deve abrir a execução real e a preview real e informar o que vê agora.
   - ✅ **Esperado:** O DevOps cola um comando (por exemplo um curl de status) e a saída. Nenhum valor de segredo aparece.

   **Prompt para colar:**

```
Task: before you say done, open the real GitHub Actions run and the real preview now.

Deliver: what you see now, with the links. If the preview asks for a login, say it is protected.

Rules: read-only; never print secrets; do not merge.
```

4. Cole o prompt de avaliação do QA (abaixo) no chat do QA. Os bots não conseguem abrir a preview protegida da Vercel, então BLOCKED para o acesso à preview é o esperado. Se o CI falhou só com 'Test timed out in 5000ms', clique em Re-run failed jobs no GitHub.

   **Prompt para colar:**

```
Context: pull request <PR_URL> is ready.

Task: evaluate it against AC1–AC12 in docs/inception.md on main. Run the tests, read the code and check the API where you can.

Deliver: PASS, FAIL, WARN or BLOCKED per criterion, with the evidence.

Rules: do not write to the database; do not merge.
```


**Slide 16 · Live: send feedback · 11:47–11:55** · 2 clique(s) no slide

🎬 **DEMO AO VIVO AGORA →** Alt+Tab para o navegador: preview do PR, demo do feedback só se o gate passou. Volte ao deck no fim: Alt+Tab (Cmd+Tab no Mac).

5. Abra a preview do pull request (Visit Preview no comentário da Vercel no PR) e vá em /feedback.
   - ⚠️ **Se falhar:** Se a preview não carregar, diga 'This is live, so things can be slow.' Se estiver fora do ar, mostre a aplicação de referência verificada (se acessível) e explique o bloqueio.
6. Clique uma vez para revelar o formulário ilustrado (exemplo). No formulário real, envie talk 'Packt Live 20 Nov', author 'Workshop Demo', nota 5 e comentário vazio. Clique em enviar uma vez só. Clique de novo para revelar o gráfico de exemplo e depois abra /results na preview.
   - ✅ **Esperado:** 'Packt Live 20 Nov' mostra a contagem um a mais do que antes (5.0 e 1 no primeiro envio). Outras talks também aparecem: a preview usa o banco de demonstração compartilhado.
7. Recarregue a página uma vez. O dado precisa continuar lá.
   - ⚠️ **Se falhar:** Se o dado ou resultado esperado sumir após o recarregamento, não esconda. Diga: 'QA will mark this as FAIL.' e mostre a causa só se você souber.
8. Se der tempo, peça uma nota no chat e envie mais um. Se a preview estiver fora do ar, abra a aplicação de referência (https://grok-bot-workshop-mvp.vercel.app/results) e diga que é a referência preparada, não a prova do nosso PR.

### 🗣 SAY IT · fale em inglês

*Slide 15 · Background PR*

> "The pull request brings the work together, and all of it runs in the cloud, not on my laptop. DevOps gives us the real CI and preview links for the latest commit. QA evaluates the same pull request against our criteria. The bots cannot log in to the protected preview, so they say so instead of pretending. I will check the preview myself."  
> *O pull request reúne o trabalho, e tudo roda na nuvem, não no meu notebook. O DevOps traz os links reais do CI e da preview do último commit. O QA avalia o mesmo pull request com os nossos critérios. Os bots não conseguem entrar na preview protegida, então eles avisam em vez de fingir. Eu mesma vou conferir a preview.*

**Perguntas prováveis**

- **Q:** What if a secret or credential appears on screen? *(E se um segredo ou credencial aparecer na tela?)*  
  **A:** I stop sharing the screen and pause the demo. An authorized operator revokes or rotates the credential immediately, in the provider's secure settings, before we resume. Switching windows does not invalidate an exposed credential, and waiting until the session ends leaves it usable. *(Paro de compartilhar a tela e pauso a demonstração. Um operador autorizado revoga ou rotaciona a credencial imediatamente, nas configurações seguras do provedor, antes de retomarmos. Trocar de janela não invalida uma credencial exposta, e esperar o fim da sessão a deixa utilizável.)*

✂️ **Se atrasar:** Use the status links already on the pull request if time is short. *(Use os links de status que já estão no pull request se o tempo estiver curto.)*

*Slide 16 · Live: send feedback*

> "Now I try the real form on the pull request preview. This preview uses our shared demo database, so you will see other talks too. I submit one entry: the talk Packt Live 20 Nov, a rating of five, and no comment. Then I open the results and read the average and the count. Finally, I reload the page. The data must still be there."  
> *Agora eu testo o formulário real na preview do pull request. Essa preview usa o nosso banco de demonstração compartilhado, então vocês vão ver outras talks também. Envio uma resposta: a talk Packt Live 20 Nov, nota cinco e nenhum comentário. Depois abro os resultados e leio a média e a contagem. Por fim, recarrego a página. O dado precisa continuar lá.*

**Perguntas prováveis**

- **Q:** Is the average rounded? *(A média é arredondada?)*  
  **A:** Yes, to one decimal. For example, 4.25 becomes 4.3. *(Sim, para uma casa decimal. Por exemplo, 4.25 vira 4.3.)*
- **Q:** Are Talk A and talk a the same talk? *(Talk A e talk a são a mesma palestra?)*  
  **A:** Yes. The app groups them together. *(Sim. O app agrupa os dois juntos.)*

✂️ **Se atrasar:** Submit only one feedback entry. Do not ask the audience. *(Envie só um feedback. Não peça à plateia.)*

### ✅ Checkpoint

Se os pré-requisitos foram atendidos, o envio sintético autorizado aparece na preview testada. Caso contrário, o pré-requisito ausente é informado como BLOCKED.

---

## 5 · Approval · 11:55–12:10

### 🎯 Objetivo e janela

**Janela:** 11:55–12:10 (Brasília) = 9:55–10:10 ET · slides 17–18 · **Meta:** Ler as três evidências (o que mudou, relatório do QA, CI) e decidir o merge você mesma, no destino de exercício.

✂️ **Se atrasar, corte isto:** se vier FAIL, não corrija ao vivo. Mostre o FAIL como exemplo e diga que a correção fica para depois.

### 🖱 HANDS-ON · passo a passo

**Slide 17 · Block 5: Approval · 11:55–11:58** · 2 clique(s) no slide

1. Clique duas vezes: primeiro o cartão verde (trabalho dentro do escopo aprovado), depois o cartão vermelho (uma pessoa decide). A frase 'Only I can merge.' fica no cartão vermelho.

**Slide 18 · Live: read three things, then decide · 11:58–12:10** · 3 clique(s) no slide

🎬 **DEMO AO VIVO AGORA →** Alt+Tab para o GitHub: confirmar o destino, ler o PR e decidir. Volte ao deck no fim: Alt+Tab (Cmd+Tab no Mac).

2. Abra o pull request no GitHub. Primeiro confirme o destino: o repositório e a branch do exercício aprovados. Nunca a main de referência e nunca o checkpoint congelado.
   - ⚠️ **Se falhar:** Se o destino não estiver claro, pare. Não faça o merge. Diga: 'I will confirm the target first.'
3. Clique no slide: 1 o que mudou, 2 relatório do QA, 3 status do CI. Leia cada um no PR nessa ordem. A frase 'Only I can merge.' já está na tela.
4. Todos os critérios obrigatórios em PASS e os WARN avaliados? Decida e faça o merge você mesma no destino do exercício. Com FAIL ou BLOCKED: não apresente o MVP como aceito.
   - ✅ **Esperado:** O GitHub mostra o PR como merged no destino do exercício.
5. Se o QA disser FAIL, cole o prompt de correção para o FDE (troque <N> e a evidência). Se estiver atrasada, mostre o FAIL como exemplo e diga que a correção fica para depois.
   - ⚠️ **Se falhar:** Se o QA disser BLOCKED, explique que falta acesso ou infraestrutura e que isso é uma resposta honesta.

   **Prompt para colar:**

```
Context: QA reported FAIL on AC<number>: <paste the QA evidence>

Task: fix only that, add a test for it and push to the same branch.

Deliver: the new test output.

Rules: do not merge.
```


### 🗣 SAY IT · fale em inglês

*Slide 17 · Block 5: Approval*

> "We now have evidence to review, but the bots do not make the merge decision. They act within the scope we approved. Being easy to undo does not make an action authorized. Human approval is not distrust of the agent. It is the most expensive layer, so it comes last, after the other layers have filtered what they could. I am responsible for checking the result and deciding whether we can proceed. In this workshop, only I can merge, and I can also decide that the safest next step is to wait."  
> *Agora temos evidências para revisar, mas os bots não tomam a decisão de merge. Eles agem dentro do escopo aprovado. Ser fácil de desfazer não torna uma ação autorizada. A aprovação humana não é desconfiança do agente. É a camada mais cara, então vem por último, depois que as outras camadas filtraram o que puderam. Eu sou responsável por conferir o resultado e decidir se podemos avançar. Neste workshop, só eu posso fazer o merge, e também posso decidir que o próximo passo mais seguro é esperar.*

**Perguntas prováveis**

- **Q:** Why not let the bot merge when all tests pass? *(Por que o bot não faz o merge quando todos os testes passam?)*  
  **A:** A merge changes the real world. Passing tests are evidence, but a person owns the decision. *(O merge muda o mundo real. Testes passando são evidência, mas a decisão é de uma pessoa.)*

✂️ **Se atrasar:** Read only the two card titles. *(Leia só os títulos dos dois cartões.)*

*Slide 18 · Live: read three things, then decide*

> "I review three things for the same commit: the change, the independent QA report, and the CI and preview checks. I also confirm the exercise target. If the required checks and criteria pass, I can decide whether to merge. If something fails, I request a focused fix. If evidence is missing, the result stays blocked. Either way, I explain the decision before we move on."  
> *Reviso três coisas para o mesmo commit: a alteração, o relatório independente do QA e as verificações do CI e da preview. Também confirmo o destino do exercício. Se as verificações e os critérios obrigatórios passarem, posso decidir se farei o merge. Se algo falhar, peço uma correção pontual. Se faltar evidência, o resultado continua bloqueado. Em qualquer caso, explico a decisão antes de seguir.*

**Perguntas prováveis**

- **Q:** What if the FDE keeps failing? *(E se o FDE continuar falhando?)*  
  **A:** Then I stop and rewrite the task or the design. Bots do not decide to try again forever. *(Então eu paro e reescrevo a tarefa ou o design. Bots não decidem tentar para sempre.)*
- **Q:** Is green CI enough to merge? *(CI verde basta para fazer merge?)*  
  **A:** No. Green CI means the configured checks passed. Acceptance needs evidence for the agreed criteria. *(Não. CI verde significa que os checks configurados passaram. O aceite precisa de evidências para os critérios combinados.)*

✂️ **Se atrasar:** If you get FAIL, do not fix it live. Show it as an example and move on. *(Se vier FAIL, não corrija ao vivo. Mostre como exemplo e siga.)*

### ✅ Checkpoint

Você explicou a decisão real. Só houve merge se os critérios e checks obrigatórios passaram, os avisos foram revisados e o destino e as consequências estavam autorizados. FAIL ou BLOCKED não foram apresentados como aceite.

---

## 6 · Recovery · 12:10–12:22

### 🎯 Objetivo e janela

**Janela:** 12:10–12:22 (Brasília) = 10:10–10:22 ET · slides 19 · **Meta:** Recuperar o núcleo: concluir verificação, testes independentes e revisão humana do formulário e dashboard, ou declarar BLOCKED com a evidência que falta. Rotina apenas se tudo estiver concluído e sobrar tempo.

✂️ **Se atrasar, corte isto:** a rotina já está omitida; use o tempo para recuperar o núcleo, sem passar de 12:22 BRT; ao entrar no recap, diga os bloqueios em voz alta; as perguntas abrem às 12:26 BRT.

### 🖱 HANDS-ON · passo a passo

**Slide 19 · Block 6: Recovery first · 12:10–12:22** · 1 clique(s) no slide

1. Confira implementação do núcleo, testes independentes e revisão humana do formulário e dashboard. Use este tempo para concluí-los, ou declare BLOCKED e diga qual evidência falta.
   - ✅ **Esperado:** Núcleo, testes e revisão humana estão concluídos, com evidência.
   - ⚠️ **Se falhar:** Toda evidência ausente continua BLOCKED e é dita em voz alta antes do Q&A.
2. OPCIONAL: somente após concluir núcleo, testes e revisão humana, e antes das 12:22 BRT, mostre o rascunho de texto desativado do passo 24 do tutorial. Não crie nem ative agendamento. Confira a interface no ensaio; não presuma que um controle exista.
   - ✅ **Esperado:** O rascunho mostra Enabled: No.
3. OPCIONAL — somente se tudo estiver concluído e sobrar tempo: execute o prompt da preview offline abaixo nos três arquivos de exemplo locais.
   - ✅ **Esperado:** O bot propõe um label por exemplo (bug, feature ou unclear) e não aplica nada.
   - ⚠️ **Se falhar:** Se tentar mexer em issues reais, pare e diga: 'This is preview only.'

   **Prompt para colar:**

```
Context: docs/routines/daily-triage.md and the three files in docs/issues/.

Task: draft a daily triage routine. For each file: a one-line summary, a suggested label (bug, feature or unclear) and the bot that should own it.

Deliver: the draft as a disabled routine for weekdays at 9 AM, São Paulo time.

Rules: draft only; do not schedule or change anything.
```


### 🗣 SAY IT · fale em inglês

*Slide 19 · Block 6: Recovery first*

> "This time is for finishing the core work first. If implementation, tests, or human review are still incomplete, we use it to recover or explain the blocker. We skip the routine unless everything is complete and there is time left. Even then, we show only a disabled text draft. At 12:22, we stop recovery and recap what happened. Questions begin at 12:26."  
> *Este tempo é para concluir primeiro o trabalho principal. Se implementação, testes ou revisão humana ainda estiverem incompletos, vamos usá-lo para recuperar o trabalho ou explicar o bloqueio. Pulamos a rotina, a menos que tudo esteja concluído e sobre tempo. Mesmo assim, mostramos apenas um rascunho de texto desativado. Às 12:22, encerramos a recuperação e recapitulamos o que aconteceu. As perguntas começam às 12:26.*

**Perguntas prováveis**

- **Q:** What if the core is still incomplete at 12:22 BRT? *(E se o núcleo ainda estiver incompleto às 12:22 BRT?)*  
  **A:** Stop recovery, start recap, and state what remains BLOCKED and which evidence is missing. Start taking questions at 12:26 BRT. *(Encerre a recuperação, comece o recap e diga o que continua BLOCKED e qual evidência falta. Abra as perguntas às 12:26 BRT.)*
- **Q:** Can I shorten the routine to fit? *(Posso encurtar a rotina para caber?)*  
  **A:** No. Skip it completely unless the core, tests, and human review are complete and time remains. *(Não. Pule-a por completo, a menos que núcleo, testes e revisão humana estejam concluídos e sobre tempo.)*

✂️ **Se atrasar:** The routine is already omitted. Use the time to recover the core, but never past 12:22 BRT. As recap starts, say the blockers aloud. We take questions at 12:26 BRT. *(A rotina já está omitida. Use o tempo para recuperar o núcleo, mas nunca passe de 12:22 BRT. Ao entrar no recap, diga os bloqueios em voz alta. As perguntas abrem às 12:26 BRT.)*

### ✅ Checkpoint

Verificação do núcleo, testes independentes e revisão humana estão concluídos, ou cada lacuna restante está BLOCKED com a evidência ausente dita em voz alta quando o recap começa às 12:22 BRT. A recuperação não passou de 12:22; as perguntas abriram às 12:26 BRT. A rotina apareceu somente se tudo estava concluído e sobrou tempo.

---

## 7 · Q&A · 12:22–12:30

### 🎯 Objetivo e janela

**Janela:** 12:22–12:30 (Brasília) = 10:22–10:30 ET · slides 20–23 · **Meta:** Recapitular em três frases, abrir perguntas e encerrar às 12:30.

✂️ **Se atrasar, corte isto:** pule a frase sobre economia de uso. Termine pontualmente às 12:30.

### 🖱 HANDS-ON · passo a passo

**Slide 20 · Recap · 12:22–12:23** · 3 clique(s) no slide

1. Clique três vezes. Leia cada cartão, um por vez, com uma pausa.

**Slide 21 · Bonus: reduce usage · 12:23–12:24** · 3 clique(s) no slide

2. Clique três vezes. Diga só uma frase e siga.

**Slide 22 · Optional: pstack · 12:24–12:26** · 3 clique(s) no slide

3. Slide OPCIONAL. Use só se estiver no horário. Pule se estiver mais de 2 minutos atrasada.
4. Clique três vezes: o crédito, /poteto-mode, /poteto-help. NÃO rode /setup-pstack ao vivo: ele grava um arquivo de regras do Cursor. Mostre os três links só como texto.
   - ⚠️ **Se falhar:** Se alguém pedir para ver ao vivo, diga: 'I will share the link, and you can try it after the session.'

**Slide 23 · Questions? · 12:26–12:30**

5. Abra para perguntas. Leia cada pergunta do chat em voz alta antes de responder.
6. Às 12:29, diga: “Thank you so much! See you next time.” Encerre até 12:30, mesmo que ainda haja perguntas.
   - ✅ **Esperado:** A barra de tempo está cheia. A sessão termina às 12:30.
7. Lembre: o repositório é privado. Os slides e o guia são públicos. O acesso ao código é dado separadamente pela instrutora.

### 🗣 SAY IT · fale em inglês

*Slide 20 · Recap*

> "Let us bring this together. Each bot had one clear role, so we knew who was responsible for each part. We asked for evidence, so we could check the claims instead of trusting a success message. And a human kept control of the important decisions. Those three habits apply even when the work ends with a blocker rather than a merge. If your inner loop produces slop, automating it just produces more slop. That line is from Lauren Tan's talk, All Code Is Slop (Except Mine)."  
> *Vamos juntar as ideias. Cada bot tinha um papel claro, então sabíamos quem era responsável por cada parte. Pedimos evidências para conferir as afirmações, em vez de confiar em uma mensagem de sucesso. E uma pessoa manteve o controle das decisões importantes. Esses três hábitos se aplicam mesmo quando o trabalho termina com um bloqueio, em vez de um merge. Se o ciclo interno produz slop, automatizá-lo só produz mais slop. Essa frase é da palestra de Lauren Tan, All Code Is Slop (Except Mine).*

✂️ **Se atrasar:** Never cut the recap. It takes one minute. *(Nunca corte o recap. Leva um minuto.)*

*Slide 21 · Bonus: reduce usage*

> "One practical tip before we close: keep each task focused. Start a new chat for a new task and send one complete prompt with the context and expected result. The stable role belongs in the bot’s instructions. For supported GitHub tasks, use connectors first and the browser when needed. This keeps the workflow easier to follow and avoids unnecessary context."  
> *Uma dica prática antes de encerrar: mantenha cada tarefa focada. Abra um chat novo para uma tarefa nova e envie um prompt completo com o contexto e o resultado esperado. O papel estável pertence às instruções do bot. Nas tarefas do GitHub compatíveis, use conectores primeiro e o navegador quando necessário. Assim, o fluxo fica mais fácil de acompanhar e evitamos contexto desnecessário.*

✂️ **Se atrasar:** Skip this slide. Finish exactly at 12:30. *(Pule este slide. Termine exatamente às 12:30.)*

*Slide 22 · Optional: pstack*

> "If we have time, here is the source of the pstack skills used in this workflow. The project was created by Lauren Tan. You can use slash poteto-mode to ask for more rigor, or slash poteto-help when you are not sure which skill fits a task. The links are on the slide. We will leave installation and setup for after the session, so we can keep time for your questions."  
> *Se tivermos tempo, aqui está a origem das skills do pstack usadas neste fluxo. O projeto foi criado por Lauren Tan. Vocês podem usar barra poteto-mode para pedir mais rigor ou barra poteto-help quando não souberem qual skill combina com uma tarefa. Os links estão no slide. Vamos deixar a instalação e a configuração para depois da sessão, para preservar o tempo das perguntas.*

**Perguntas prováveis**

- **Q:** Do I need pstack to follow the workshop? *(Preciso do pstack para acompanhar o workshop?)*  
  **A:** No. The repo includes the skills we used. pstack is where they come from. *(Não. O repositório inclui as skills que usamos. O pstack é de onde elas vêm.)*

✂️ **Se atrasar:** Skip this slide. Go straight to Questions. *(Pule este slide. Vá direto para as perguntas.)*

*Slide 23 · Questions?*

> "Now we have time for your questions. Please write them in the chat, and I will read each one before I answer. If I need to check a detail, I will say so. The slides and guide are public; access to the private code is handled separately by the instructor."  
> *Agora temos tempo para as perguntas de vocês. Escrevam no chat, e vou ler cada uma antes de responder. Se eu precisar conferir algum detalhe, vou avisar. Os slides e o guia são públicos; o acesso ao código privado é tratado separadamente pela instrutora.*

**Perguntas prováveis**

- **Q:** Can I get the slides and the guide? *(Posso ter os slides e o guia?)*  
  **A:** Yes. The slides and the guide are public. For the code, ask the instructor for access. *(Sim. Os slides e o guia são públicos. Para o código, peça acesso à instrutora.)*

✂️ **Se atrasar:** Close at 12:29 with the final sentence, even if there are questions. *(Encerre às 12:29 com a frase final, mesmo que haja perguntas.)*

### ➡️ Encerramento

Fim da sessão.

### ✅ Checkpoint

Você leu a frase de encerramento às 12:29. A sessão termina às 12:30.

---

<!-- END GENERATED:blocks -->

<!-- BEGIN GENERATED:pron -->
## Cola de pronúncia

Apoio de ensaio, separado da fala contínua. Não leia esta tabela durante a apresentação. Aproximação em português para praticar em voz alta. A sílaba em MAIÚSCULAS é a mais forte. O som "th" é a língua entre os dentes.

| Palavra | Como falar |
|---|---|
| context | CÓN-tékst |
| deployment | di-PLÓI-ment |
| preview | PRÍ-viu |
| acceptance | ek-SÉP-tans |
| routine | ru-TIIN |
| schema | SKÍ-ma |
| merge | MÉRDJ |
| Neon | NÍ-on |
| Drizzle | DRÍ-zol |
| Zod | ZÓD |
| Playwright | PLÊI-rait |
| Vercel | vêr-SÉL |
| Postgres | PÓST-gres |
| shadcn | CHÁD-si-ên |
| Next.js | NÉKST dê-êi-ES |
| GitHub | GUÍT-hâb |
| evidence | É-vi-dens |
| approve | a-PRUUV |
| secret | SI-cret |
| redacted | ri-DÉC-tid |
| blocked | BLÓCT |
| coverage | CÂ-ve-ridj |
| criteria | crai-TÍ-ri-a |
| branch | BRÉNTCH |
| pull request | PUL ri-QUÉST |
| triage | TRI-ajh |
| Linear | LÍ-ni-er |
| thank you | THÉNK iú |

<!-- END GENERATED:pron -->

