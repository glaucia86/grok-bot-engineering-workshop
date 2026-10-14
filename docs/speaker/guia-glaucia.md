# Guia da Glaucia: "Build Your First Engineering Bot with Grok Bot"

**Packt · 17/11 · 11:00–12:30 (horário de Brasília) = 9:00–10:30 ET · 90 min**

Como usar: deixe este guia aberto numa tela e compartilhe a outra. Leia em voz alta só o que está em **Fala**. A tradução em itálico logo abaixo é só para você. Os prompts você **copia e cola**, sem ler.

| Horário (Brasília) | Bloco |
|---|---|
| 11:00–11:05 | 0 · Setup |
| 11:05–11:12 | 1 · Criar os bots |
| 11:12–11:20 | 2 · Design |
| 11:20–11:40 | 3 · Verify |
| 11:40–11:55 | 4 · Background PR |
| 11:55–12:10 | 5 · Approval |
| 12:10–12:22 | 6 · Routine |
| 12:22–12:30 | 7 · Q&A |

> Onde não tenho certeza do caminho no app, está escrito **conferir no ensaio**. O guia não traz preços, segredos nem dados do Itaú.

---

## Frases de emergência

> "Let's give it a few seconds."
> *Vamos dar alguns segundos.*

> "While the bot works, let me explain."
> *Enquanto o bot trabalha, deixa eu explicar.*

> "Great question. Let's take it at Q&A."
> *Ótima pergunta. Vamos responder no Q&A.*

> "This is live, so things can be slow."
> *É ao vivo, então pode demorar.*

> "Let me show you the recording instead."
> *Vou mostrar a gravação no lugar.*

> "I'll read the question in the chat."
> *Vou ler a pergunta no chat.*

> "Can you repeat that, please?"
> *Pode repetir, por favor?*

> "Let's move on."
> *Vamos seguir.*

---

## Checklist antes do evento

- [x] Projeto **`grok-bot-workshop-mvp`** criado na Vercel, com Root Directory `mvp`.
- [x] `DATABASE_URL` configurada na Vercel.
- [x] Tabela `feedback` criada no Neon.
- [ ] **Apagar a linha do smoke test** da tabela `feedback` no Neon antes do ensaio. Você mesma faz isso no console do Neon. Confira depois que a tabela está vazia, porque o dashboard precisa abrir no estado vazio.
- [ ] Colocar a `DATABASE_URL` também como **secret no GitHub Actions**. Ela nunca vai em arquivo nem em chat.
- [ ] Gerar o **Protection Bypass for Automation** da Vercel e salvar como secret no GitHub Actions, para o Playwright conseguir abrir a preview. Conferir no ensaio.
- [ ] Abrir um PR de teste e confirmar que aparece a preview URL.
- [ ] Decidir a **visibilidade do repositório** (público ou privado). Antes, confira o histórico em busca de segredos.
- [ ] Atualizar o **Luma/Eventbrite** para 90 minutos.
- [ ] **Ensaio completo** com cronômetro, prints da **sua** conta e gravação de cada bloco como plano B.
- [ ] QA e DevOps **ainda não criados**. As instruções deles ficam abertas numa aba, prontas para colar.
- [ ] Notificações desligadas e nenhum token visível na tela.
- [ ] Depois do ensaio, apagar os dados de teste de novo.

---

## Charter de todo bot

Todo bot tem um charter de três partes. A primeira diz **do que ele é dono**. A segunda descreve **uma boa entrega**, com critérios que dá para checar. A terceira diz **onde ele para**: o que ele desfaz em menos de um minuto, faz sozinho, e o que envia, gasta, publica, apaga ou faz merge espera por você. A regra que vale para todos: **se não consegue mostrar de onde veio o número, deixa o número de fora.**

| Bot | É dono de | Boa entrega | Onde para |
|---|---|---|---|
| FDE | Implementação e PR | PR com o que mudou, por que e como testar, mais os testes e a preview | Sem push na main, sem merge, sem force-push |
| QA | Julgar o PR pela seção 5 do inception | PASS, FAIL ou BLOCKED por critério, com evidência | Sem merge, e só apaga o que ele mesmo criou |
| DevOps | CI e Vercel | Link do CI e preview URL, com os segredos conferidos só pela presença | Não mostra nem pede segredo, sem merge |

Skills, no máximo 3 por bot:
- **FDE:** shadcn, vercel-react-best-practices, neon-drizzle.
- **QA:** playwright-best-practices, playwright-cli e a skill de verificação do pstack (`create-verification-skill`). O `interrogate` do pstack entra no lugar de uma delas, se precisar. Decidir no ensaio.
- **DevOps:** deploy-to-vercel, ci-cd-and-automation.

---

## 0 · Setup · 11:00–11:05

✂️ **Se atrasar, corte isto:** pule o README e mostre só a pasta `mvp/`.

**O que fazer**
Mostre o repositório nesta ordem: `README.md`, depois a pasta `mvp/` e por fim o `docs/inception.md`. Diga que a base já está pronta (banco, API, schema e testes). Ao vivo, a turma constrói só o formulário e o dashboard.

**Por que isso importa**
Infraestrutura ao vivo quebra fácil e consome o tempo da aula. Com a base pronta, o palco fica para o que importa: bots dividindo o trabalho e você no controle.

**Fala**
> "Welcome! Today we build a real app with a team of bots."
> *Bem-vindos! Hoje vamos construir um app de verdade com um time de bots.*

> "The database and the API are ready."
> *O banco e a API já estão prontos.*

> "The bot that builds does not judge. And no bot merges. I do."
> *O bot que constrói não julga. E nenhum bot faz merge. Quem faz sou eu.*

➡️ **Transição:** "Now, let's create our first bot."
*Agora, vamos criar nosso primeiro bot.*

---

## 1 · Criar os bots · 11:05–11:12

✂️ **Se atrasar, corte isto:** não crie o DevOps ao vivo. Mostre só as instruções dele.

**O que fazer**
Crie o **FDE do zero**: use o botão de criar bot (caminho exato: conferir no ensaio) e cole o prompt abaixo. Depois crie o **QA** e o **DevOps** colando as instruções da seção 4 do `docs/inception.md`. Adicione as skills, no máximo 3 por bot. Por fim, coloque os três num grupo com você.

**Por que isso importa**
Um bot é um papel bem escrito, não mágica. O FDE, criado do zero, mostra como se escreve esse papel. O QA e o DevOps mostram que as instruções podem ser reaproveitadas, como código. Poucas skills mantêm o contexto pequeno, e com contexto pequeno o bot erra menos.

**Fala**
> "A bot needs three things: what it owns, what good looks like, and where it stops."
> *Um bot precisa de três coisas: do que é dono, como é uma boa entrega e onde ele para.*

> "For QA and DevOps, I just paste the instructions."
> *Para o QA e o DevOps, eu só colo as instruções.*

> "Three skills max. Less context, better bot."
> *No máximo três skills. Menos contexto, bot melhor.*

**Prompt (FDE):**
```
You are the Forward Deployed Engineer for Talk Feedback.
You own: reading the issue and docs/inception.md, proposing the change, implementing it end to end in TypeScript on a new branch, and opening a PR.
Good output: a PR that says what changed, why, and how to test it, with test output and the preview URL attached.
Where you stop: anything you can undo in under a minute you may do alone. Never push to main, never merge, never force-push, never delete branches. Sending, spending, publishing, deleting, or merging waits for me.
If you can't show where a number came from, leave it out. Use the GitHub connector, not the browser. One task, one prompt.
```

➡️ **Transição:** "Our team is ready. Let's ask for a design."
*Nosso time está pronto. Vamos pedir um design.*

---

## 2 · Design · 11:12–11:20

✂️ **Se atrasar, corte isto:** não leia o design inteiro. Mostre só a lista de arquivos e de testes.

**O que fazer**
Abra um chat novo com o FDE e cole o prompt. Quando a resposta chegar, mostre três partes: as decisões, os arquivos e os testes. Se ficar alguma dúvida em aberto, decida você e escreva a decisão no chat.

**Por que isso importa**
Corrigir um mal-entendido no design custa pouco. Corrigir no código custa caro. O design também vira a régua que o QA vai usar para julgar o PR.

**Fala**
> "No code yet. First, a design."
> *Ainda sem código. Primeiro, um design.*

> "It lists files and tests. So we can check it."
> *Ele lista arquivos e testes. Assim conseguimos conferir.*

**Prompt:**
```
Read docs/inception.md (section 5, Future Next.js MVP contract) and the mvp/ folder on branch checkpoint/mvp-base.
Write a short design, no code yet, for two features: the public feedback form and the talk dashboard with a shadcn bar chart.
Include: clarified decisions, files to change, the shared Zod schema usage, the empty state, and the Vitest and Playwright tests mapped to acceptance criteria 4 to 10.
List anything you assumed separately. Stop and wait for my approval.
```

➡️ **Transição:** "The design looks good. Let's build and verify."
*O design está bom. Vamos construir e verificar.*

---

## 3 · Verify · 11:20–11:40

✂️ **Se atrasar, corte isto:** não espere o QA terminar todos os critérios. Mostre os resultados de 2 ou 3 e siga.

**O que fazer**
Cole o prompt do FDE para aprovar o design. Em seguida, cole o prompt do QA. Mostre que o QA julga pelos critérios do inception, não pelo relatório do FDE. No fim, mostre o resultado PASS, FAIL ou BLOCKED de cada critério.

**Por que isso importa**
Quem fez o trabalho tende a achar que está certo. Um bot separado, olhando só a especificação, dá uma opinião honesta. CI verde não quer dizer aceite.

**Fala**
> "Green CI is not acceptance."
> *CI verde não é aceite.*

> "QA checks the rules we wrote before the code."
> *O QA confere as regras que escrevemos antes do código.*

> "If QA can't check it, it says BLOCKED."
> *Se o QA não consegue conferir, ele diz BLOCKED.*

**Prompt (FDE):**
```
Design approved. Implement it on a new branch from checkpoint/mvp-base and open a PR. Run the Vitest suite and paste the output. Do not merge.
```

**Prompt (QA):**
```
Using the pstack verification skill, build a checklist from docs/inception.md section 5, criteria 1 to 10, without reading the author's PR description.
When the PR is ready, identify the tested commit, run the checks, and report PASS, FAIL, or BLOCKED per criterion with commands, target URL, outputs, and artifacts.
If you can't show where a number came from, leave it out. Never merge.
```

➡️ **Transição:** "The work runs in the background. Let's see the PR."
*O trabalho roda em segundo plano. Vamos ver o PR.*

---

## 4 · Background PR · 11:40–11:55

✂️ **Se atrasar, corte isto:** pule o pedido de status ao DevOps e abra a preview direto pelo PR.

**O que fazer**
Mostre que o trabalho roda na nuvem, não no seu computador. Cole o prompt do DevOps para pegar o status do CI e a preview URL. Abra a preview, envie um feedback pelo formulário e mostre a barra mudando no dashboard.

**Por que isso importa**
O time só vale a pena se você não precisar ficar vigiando. O PR é o ponto de encontro: lá ficam o código, os testes, o CI e a preview.

**Fala**
> "This runs in the cloud, not on my laptop."
> *Isso roda na nuvem, não no meu notebook.*

> "Every PR gets a preview link."
> *Cada PR ganha um link de preview.*

> "Let's send feedback and watch the chart."
> *Vamos enviar um feedback e ver o gráfico.*

**Prompt (DevOps):**
```
For the open PR, report the GitHub Actions status and the Vercel preview URL, with links.
Verify DATABASE_URL and the protection bypass secret by presence only, values redacted. Never print or ask for a secret. Never merge.
```

➡️ **Transição:** "The bots are done. Now it's my decision."
*Os bots terminaram. Agora a decisão é minha.*

---

## 5 · Approval · 11:55–12:10

✂️ **Se atrasar, corte isto:** se vier FAIL, não corrija ao vivo. Mostre o FAIL como exemplo e diga que a correção fica para depois.

**O que fazer**
Abra o PR e leia três partes: o que mudou, o relatório do QA e o status do CI. Se estiver tudo em PASS, aprove e faça **você** o merge, na tela. Se vier FAIL, cole o prompt abaixo.

**Por que isso importa**
O merge mexe no mundo real, então quem decide é uma pessoa. O bot faz sozinho só o que se desfaz em um minuto.

**Fala**
> "The bots brought the evidence. I decide."
> *Os bots trouxeram a evidência. Quem decide sou eu.*

> "Undo in a minute? The bot can do it. Send, spend, publish, delete? A human decides."
> *Desfaz em um minuto? O bot pode fazer. Enviar, gastar, publicar, apagar? Quem decide é um humano.*

> "I always merge."
> *Quem faz o merge sou sempre eu.*

**Prompt (se vier FAIL, para o FDE):**
```
QA reported FAIL on criterion <N>: <paste QA evidence>. Fix only that, push to the same branch, and paste the new test output. Do not merge.
```

➡️ **Transição:** "Last step: let the bot work without me asking."
*Último passo: deixar o bot trabalhar sem eu pedir.*

---

## 6 · Routine · 12:10–12:22

✂️ **Se atrasar, corte isto:** não crie a rotina. Mostre a tela de rotinas e leia o prompt.

**O que fazer**
Crie uma rotina com o recurso de **rotinas nativo** do Grok Bot, não com o automate-me (a tela fica para conferir no ensaio). Cole o prompt abaixo, que é baseado no `docs/routines/daily-triage.md`. Depois mostre a opção de gatilho.

**Por que isso importa**
Um bot que você precisa chamar é uma ferramenta. Um bot com rotina faz parte do time. Rodar poucas vezes e ficar quieto quando não há nada mantém o custo baixo.

**Fala**
> "A bot with a routine is a teammate."
> *Um bot com rotina é um colega de time.*

> "Once a day. If nothing is new, one line."
> *Uma vez por dia. Se não houver nada novo, uma linha.*

> "Routines can also start from a Linear issue."
> *As rotinas também podem começar a partir de uma issue do Linear.*

**Prompt:**
```
Every weekday at 9:00, triage new GitHub issues in this repo: label each one, link it to the matching acceptance criterion in docs/inception.md, and suggest which bot owns it.
Don't comment or change anything; report to me. If there is nothing new, answer in one line.
```

➡️ **Transição:** "Let's recap, then your questions."
*Vamos recapitular e depois ouvir as perguntas de vocês.*

---

## 7 · Q&A · 12:22–12:30

✂️ **Se atrasar, corte isto:** pule a frase sobre economia de uso. Termine pontualmente às 12:30.

**O que fazer**
Leia as três frases de resumo e abra para perguntas. Se uma pergunta for difícil de entender, use "I'll read the question in the chat". Às 12:29, leia a frase de encerramento.

**Por que isso importa**
As pessoas esquecem os cliques, mas lembram da estrutura: um bot por papel, evidência para cada afirmação e um humano no merge.

**Fala**
> "One bot per role. Evidence for every claim. A human on every big step."
> *Um bot por papel. Evidência para cada afirmação. Um humano em cada passo importante.*

> "To save usage: new chat per task, one full prompt."
> *Para economizar uso: um chat novo por tarefa e um prompt completo.*

> "Questions?"
> *Perguntas?*

➡️ **Encerramento:** "Thank you so much! See you next time."
*Muito obrigada! Até a próxima.*
