"""Single source for the speaker talk track: deck notes (index.html) and guide blocks (guia-glaucia.md).

Usage:  python scripts/speaker_content.py          # rewrite generated parts
        python scripts/speaker_content.py --check  # fail if committed files are out of date
Continuous English passages, Portuguese reference translations, recovery cues and questions are shared, so deck and guide use identical wording. Pronunciation is a separate rehearsal reference.
"""
import html, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DECK = ROOT / "docs/speaker/slides/index.html"
GUIDE = ROOT / "docs/speaker/guia-glaucia.md"
PROMPTS = json.loads((ROOT / "scripts/speaker_prompts.json").read_text(encoding="utf-8"))

# ---------- helpers: D = hands-on step, S = say line, Q = question ----------
def D(en, pt, ok=None, fail=None, prompt=None):
    return dict(en=en, pt=pt, ok=ok, fail=fail, prompt=prompt)
def S(en, pt, ph=""):
    return dict(en=en, pt=pt, ph=ph)
def Q(qen, aen, qpt, apt):
    return dict(qen=qen, aen=aen, qpt=qpt, apt=apt)

# ---------- blocks ----------
BLOCKS = [
 dict(name="Setup", t="11:00–11:05", et="9:00–9:05", slides=(1, 5),
  goal=("Abrir no horário e mostrar o que já está pronto: repositório, arquitetura e a regra principal.",
        "Open on time and show what is ready: the repo, the architecture, and the main rule."),
  cut="pule o README e mostre só a pasta `mvp/`.",
  check=("The audience saw the repo, the architecture, and the one rule. The clock says 11:05.",
         "A plateia viu o repositório, a arquitetura e a regra principal. O relógio marca 11:05.")),
 dict(name="Criar os bots", t="11:05–11:12", et="9:05–9:12", slides=(6, 8),
  goal=("Criar o FDE do zero, depois o QA e o DevOps, com no máximo 3 skills cada (o QA tem 4: playwright-best-practices, playwright-cli, create-verification-skill e `interrogate`), e colocar os três num grupo com você. Todo bot termina com a `principle-prove-it-works` (passo final, fora do limite).",
        "Create and verify the three bots: FDE with three skills, QA with four explicitly approved skills, and DevOps with two. Use a group only after rehearsing that interface. Every bot applies principle-prove-it-works at completion; it does not count toward the skill limit."),
  cut="não crie o DevOps ao vivo. Mostre só as instruções dele.",
  check=("Three bots exist and sit in one group chat with you. FDE and DevOps have three skills at most; QA has four (including interrogate). Every bot finishes with principle-prove-it-works.",
         "Os três bots existem e estão num grupo com você. FDE e DevOps têm no máximo três skills; o QA tem quatro (com a interrogate). Todo bot termina com a principle-prove-it-works.")),
 dict(name="Design", t="11:12–11:20", et="9:12–9:20", slides=(9, 9),
  goal=("Pedir um design ao FDE antes de qualquer código e decidir as dúvidas em aberto.",
        "Ask the FDE for a design before any code, and settle any open questions."),
  cut="não leia o design inteiro. Mostre só a lista de arquivos e de testes.",
  check=("The FDE answered with decisions, files to change, and tests. No code was written yet.",
         "O FDE respondeu com decisões, arquivos e testes. Nenhum código foi escrito ainda.")),
 dict(name="Verify", t="11:20–11:40", et="9:20–9:40", slides=(10, 14),
  goal=("Aprovar o design específico, deixar o FDE implementar e o QA preparar verificações independentes com os critérios atuais do inception. A execução na preview vem após os pré-requisitos do próximo bloco.",
        "Approve the specific design, let FDE implement, and let QA prepare independent checks against the current inception criteria. Preview execution comes after the gate in the next block."),
  cut="não espere o QA terminar todos os critérios. Mostre 2 ou 3 resultados e siga.",
  check=("FDE supplied available local evidence. QA prepared the AC1–12 plan and named missing preview prerequisites; acceptance remains pending until the gated evaluation.",
         "O FDE apresentou as evidências locais disponíveis. O QA preparou o plano AC1–12 e indicou os pré-requisitos ausentes da preview; o aceite continua pendente até a avaliação autorizada.")),
 dict(name="Background PR", t="11:40–11:55", et="9:40–9:55", slides=(15, 16),
  goal=("Mostrar que o trabalho roda na nuvem e provar o resultado: status do CI, preview e o gráfico mudando com um feedback real.",
        "Show that the work runs in the cloud and prove the result: CI status, preview, and the chart moving with real feedback."),
  cut="pule o pedido de status ao DevOps e abra a preview direto pelo PR.",
  check=("If the gate passed, the authorized synthetic entry appears in the tested preview. Otherwise, the missing prerequisite is reported as BLOCKED.",
         "Se os pré-requisitos foram atendidos, o envio sintético autorizado aparece na preview testada. Caso contrário, o pré-requisito ausente é informado como BLOCKED.")),
 dict(name="Approval", t="11:55–12:10", et="9:55–10:10", slides=(17, 18),
  goal=("Ler as três evidências (o que mudou, relatório do QA, CI) e decidir o merge você mesma, no destino de exercício.",
        "Read the three pieces of evidence (what changed, QA report, CI) and make the merge decision yourself, on the exercise target."),
  cut="se vier FAIL, não corrija ao vivo. Mostre o FAIL como exemplo e diga que a correção fica para depois.",
  check=("You explained the actual decision. A merge occurred only if the required criteria and checks passed, warnings were reviewed, and the destination and consequences were authorized. FAIL or BLOCKED was not called acceptance.",
         "Você explicou a decisão real. Só houve merge se os critérios e checks obrigatórios passaram, os avisos foram revisados e o destino e as consequências estavam autorizados. FAIL ou BLOCKED não foram apresentados como aceite.")),
 dict(name="Recovery", t="12:10–12:22", et="10:10–10:22", slides=(19, 19),
  goal=("Recuperar o núcleo: concluir verificação, testes independentes e revisão humana do formulário e dashboard, ou declarar BLOCKED com a evidência que falta. Rotina apenas se tudo estiver concluído e sobrar tempo.",
        "Recover the core: complete verification, independent tests, and human review of the form and dashboard, or declare BLOCKED with the missing evidence. Show the routine only if everything is complete and time remains."),
  cut="a rotina já está omitida; use o tempo para recuperar o núcleo, sem passar de 12:22 BRT; ao entrar no recap, diga os bloqueios em voz alta; as perguntas abrem às 12:26 BRT.",
  check=("Core verification, independent tests, and human review are complete, or each remaining gap is BLOCKED with missing evidence named aloud when recap starts at 12:22 BRT. Recovery did not extend past 12:22; questions opened at 12:26 BRT. The routine appeared only if everything was complete and time remained.",
         "Verificação do núcleo, testes independentes e revisão humana estão concluídos, ou cada lacuna restante está BLOCKED com a evidência ausente dita em voz alta quando o recap começa às 12:22 BRT. A recuperação não passou de 12:22; as perguntas abriram às 12:26 BRT. A rotina apareceu somente se tudo estava concluído e sobrou tempo.")),
 dict(name="Q&A", t="12:22–12:30", et="10:22–10:30", slides=(20, 23),
  goal=("Recapitular em três frases, abrir perguntas e encerrar às 12:30.",
        "Recap in three sentences, take questions, and finish at 12:30."),
  cut="pule a frase sobre economia de uso. Termine pontualmente às 12:30.",
  check=("You read the closing line at 12:29. The session ends at 12:30.",
         "Você leu a frase de encerramento às 12:29. A sessão termina às 12:30.")),
]

# ---------- slides ----------
SL = []
def slide(**k): SL.append(k)

slide(title="Welcome", t="11:00–11:01", m=1, clicks=0,
 do=[D("Before 11:00: this slide is full screen (press F) on the shared screen. This notes window (press S) is on your reading screen.",
       "Antes das 11:00: este slide está em tela cheia (tecla F) na tela compartilhada. Esta janela de notas (tecla S) está na sua tela de leitura.",
       ok=("The black title slide shows. The clock bar at the bottom shows 11:00.", "O slide preto de título aparece. A barra de tempo embaixo mostra 11:00."),
       fail=("If the notes window did not open, allow pop-ups for this page and press S again.", "Se a janela de notas não abriu, libere pop-ups nesta página e aperte S de novo.")),
     D("Click the timer in this window once at 11:00 to reset it to zero.", "Clique uma vez no cronômetro desta janela às 11:00 para zerar.")],
 say=[S("Welcome, everyone! I am Glaucia. Today we will build a feedback app with a small team of bots. The API code is already in the repository, so we can focus on the form, the results, and how to check the work. I will guide the team, and we will use evidence to decide what is ready. First, let me show you the plan.", "Bem-vindos, pessoal! Eu sou a Glaucia. Hoje vamos construir um app de feedback com um pequeno time de bots. O código da API já está no repositório, então podemos focar no formulário, nos resultados e em como conferir o trabalho. Vou orientar o time, e vamos usar evidências para decidir o que está pronto. Primeiro, vou mostrar o plano.")],
 cut=("Do not introduce yourself for long. Your name is on the slide.", "Não se apresente por muito tempo. Seu nome está no slide."),
 qa=[], nxt=None)

slide(title="The plan", t="11:01–11:02", m=1, clicks=1,
 do=[D("Press the right arrow once. The four bot faces move to the top corner.", "Aperte a seta para a direita uma vez. As quatro carinhas dos bots sobem para o canto.",
       ok=("The agenda shows 8 tiles in two rows.", "A agenda mostra 8 blocos em duas linhas.")),
     D("Move your finger along the tiles, left to right. Do not read each tile.", "Passe o dedo pelos blocos, da esquerda para a direita. Não leia cada bloco."),
     D("Click once: the last line appears (you only build the form and the dashboard).", "Clique uma vez: a última linha aparece (vocês só constroem o formulário e o dashboard).")],
 say=[S("We have 90 minutes. First, we will prepare our team and agree on a design. Then the FDE will build the form and dashboard while QA prepares its checks. After that, we will inspect the preview and review the evidence. A merge is possible, but it is not a promise. If something is blocked, we will say what is missing and finish with questions.", "Temos 90 minutos. Primeiro, vamos preparar o time e combinar um design. Depois, o FDE construirá o formulário e o dashboard enquanto o QA prepara as verificações. Em seguida, vamos conferir a preview e revisar as evidências. O merge é uma possibilidade, mas não uma promessa. Se algo estiver bloqueado, vamos dizer o que falta e encerrar com perguntas.")],
 cut=("Skip this slide. Press the right arrow.", "Pule este slide. Aperte a seta para a direita."),
 qa=[Q("Will the recording be available?", "I do not have the details yet. Please ask the Packt team in the chat.",
       "A gravação vai ficar disponível?", "Ainda não tenho os detalhes. Pergunte ao time da Packt no chat.")],
 nxt=None)

slide(title="The repo", t="11:02–11:03", m=1, clicks=3,
 do=[D("Click three times: README card, mvp card, inception card. Say one short sentence for each click.", "Clique três vezes: cartão README, cartão mvp, cartão inception. Diga uma frase curta a cada clique."),
     D("Alt+Tab to GitHub. Show in this order: README.md, then the mvp/ folder on the exercise branch exercise/feedback-ui, then docs/inception.md (scroll to section 5). Go back to the deck.",
       "Alt+Tab para o GitHub. Mostre nesta ordem: README.md, depois a pasta mvp/ na branch do exercício exercise/feedback-ui, depois docs/inception.md (role até a seção 5). Volte ao deck.",
       ok=("You can see API, schema, migration and tests in mvp/. Say what exists; do not say the infrastructure is ready until the issue #16 evidence is checked.", "Você vê API, schema, migration e testes em mvp/. Diga o que existe; só diga que a infraestrutura está pronta depois de conferir a evidência da issue #16."),
       fail=("If GitHub is slow or the branch is missing, stay on the deck and say: 'The repo link is in the guide.' Do not use main as a replacement for the exercise branch.", "Se o GitHub estiver lento ou a branch sumir, fique no deck e diga: 'O link do repositório está no guia.' Não use a main no lugar da branch do exercício."))],
 say=[S("This repository has two tracks. The main branch is the complete reference app. The exercise branch, exercise/feedback-ui, already has the API and the database, but no form and no dashboard. That is what our bots will build today. The inception document defines the acceptance criteria, so the team knows what to deliver and how we will check it.", "Este repositório tem duas trilhas. A main é a aplicação de referência completa. A branch do exercício, exercise/feedback-ui, já tem a API e o banco, mas não tem formulário nem dashboard. É isso que nossos bots vão construir hoje. O documento inception define os critérios de aceite, para o time saber o que entregar e como vamos conferir.")],
 cut=("Skip the README. Show only the mvp folder.", "Pule o README. Mostre só a pasta mvp."),
 qa=[Q("Can I get the repo?", "Access is given by the instructor. Please ask in the chat.", "Posso ter acesso ao repositório?", "O acesso é dado pela instrutora. Pergunte no chat."),
     Q("Why two tracks?", "The reference stays clean. The exercise has unfinished features so we can build them live.", "Por que duas trilhas?", "A referência fica limpa. O exercício tem funcionalidades incompletas para construirmos ao vivo.")],
 nxt=None)

slide(title="MVP architecture", t="11:03–11:04", m=1, clicks=5,
 do=[D("Click 1: browser and Next.js UI. Click 2: API route. Click 3: Drizzle and the Neon database (plus the lock note). Click 4: GitHub PR to GitHub Actions. Click 5: Vercel preview.",
       "Clique 1: navegador e interface Next.js. Clique 2: rota da API. Clique 3: Drizzle e o banco Neon (mais a nota do cadeado). Clique 4: PR do GitHub para o GitHub Actions. Clique 5: preview da Vercel.",
       ok=("All 8 boxes and arrows are on screen after 5 clicks.", "Todas as 8 caixas e setas estão na tela após 5 cliques.")),
     D("Do not explain each tool. One short sentence per click, about 10 seconds each.", "Não explique cada ferramenta. Uma frase curta por clique, cerca de 10 segundos cada.")],
 say=[S("Let us follow one feedback entry through the app. A user fills in the form in the browser. Next.js sends that input to the API route, where it is checked. The API then uses Drizzle to save it in Neon Postgres. The results page reads the saved feedback and shows the average for each talk. This is why we must test the full journey, not just the form.", "Vamos acompanhar um envio de feedback pelo app. Uma pessoa preenche o formulário no navegador. O Next.js envia esses dados à rota da API, onde eles são validados. A API usa o Drizzle para salvá-los no Neon Postgres. A página de resultados lê o feedback salvo e mostra a média de cada palestra. Por isso, precisamos testar o fluxo completo, não apenas o formulário.")],
 cut=("Show only the top row. Fifteen seconds.", "Mostre só a linha de cima. Quinze segundos."),
 qa=[Q("Why Neon and not another database?", "It is serverless Postgres and it is fast to set up. Any Postgres would work.", "Por que Neon e não outro banco?", "É Postgres serverless e rápido de configurar. Qualquer Postgres serviria."),
     Q("Where is the secret stored?", "In the approved secure settings for the exercise. Never in committed files or chat.", "Onde fica o segredo?", "Nas configurações seguras aprovadas para o exercício. Nunca em arquivos commitados nem no chat.")],
 nxt=None)

slide(title="The one rule", t="11:04–11:05", m=1, clicks=1,
 do=[D("Stop. Speak slowly. Click once to show the second line (No bot merges. I do.).", "Pare. Fale devagar. Clique uma vez para mostrar a segunda linha (Nenhum bot faz merge. Eu faço).",
       ok=("Both lines are on screen. Wait three seconds in silence.", "As duas linhas estão na tela. Espere três segundos em silêncio."))],
 say=[S("Before we create the team, there is one rule to keep in mind. The bot that builds the feature does not give the final verdict on its own work. QA checks it independently, and I review the evidence. No bot merges in this workshop. That decision stays with me, including the decision to wait when something is missing.", "Antes de criar o time, temos uma regra para lembrar. O bot que constrói a funcionalidade não dá o veredito final sobre o próprio trabalho. O QA confere de forma independente, e eu reviso as evidências. Nenhum bot faz merge neste workshop. Essa decisão fica comigo, inclusive a decisão de esperar quando algo estiver faltando.")],
 cut=("This slide is never cut. It is the one people remember.", "Este slide nunca é cortado. É o que as pessoas vão lembrar."),
 qa=[Q("Can a bot merge if I allow it?", "You can allow it, but we do not do that in this workshop. A merge changes the real world, so a person decides.",
       "Um bot pode fazer merge se eu permitir?", "Pode, mas neste workshop não fazemos. O merge muda o mundo real, então uma pessoa decide.")],
 check_block=True, nxt=None)

slide(title="The team flow", t="11:05–11:06", m=1, clicks=6,
 do=[D("Click 6 times. 1: you and the group chat. 2: FDE TypeScript (green triangle). 3: QA bot (pink drop). 4: DevOps (purple circle). 5: PR with evidence. 6: the red line, I approve and merge.",
       "Clique 6 vezes. 1: você e o chat do grupo. 2: FDE TypeScript (triângulo verde). 3: QA bot (gota rosa). 4: DevOps (círculo roxo). 5: PR com evidências. 6: a linha vermelha, eu aprovo e faço o merge.",
       ok=("The full diagram shows with the red loop back to you.", "O diagrama completo aparece com a linha vermelha voltando para você."))],
 say=[S("Think of me as the tech lead and the three bots as a small team. I give the task and keep the scope clear. The FDE builds the feature, QA checks the agreed criteria, and DevOps reports on CI and the preview. Their work meets in the pull request, where I can review the code, the results, and any blockers before making a decision.", "Pensem em mim como a tech lead e nos três bots como um pequeno time. Eu passo a tarefa e mantenho o escopo claro. O FDE constrói a funcionalidade, o QA confere os critérios combinados, e o DevOps informa o estado do CI e da preview. O trabalho se encontra no pull request, onde posso revisar o código, os resultados e os bloqueios antes de decidir.")],
 cut=("Twenty seconds. Click quickly and say only the first and last sentence.", "Vinte segundos. Clique rápido e diga só a primeira e a última frase."),
 qa=[Q("Do the bots talk to each other?", "They share one group chat, so they can read each other's work. I stay in control.", "Os bots conversam entre si?", "Eles compartilham um chat de grupo, então leem o trabalho um do outro. Eu continuo no controle.")],
 nxt=None)

slide(title="Every bot has a charter", t="11:06–11:07", m=1, clicks=3,
 do=[D("Click 3 times: FDE card, QA card, DevOps card. For each: read only Owns, Good output, Stops.", "Clique 3 vezes: cartão do FDE, do QA, do DevOps. Em cada um, leia só Owns, Good output, Stops."),
     D("Point to the colors: each bot has its own color and shape.", "Aponte para as cores: cada bot tem sua própria cor e formato.")],
 say=[S("To make those roles useful, each bot needs a short set of instructions. We tell it what it owns, what a good result looks like, and when it must stop. For example, the FDE owns the code and the pull request, but it cannot merge. These boundaries help us delegate a clear task without handing over every decision. Now we can configure the team.", "Para esses papéis funcionarem, cada bot precisa de instruções curtas. Dizemos pelo que ele é responsável, como é um bom resultado e quando deve parar. Por exemplo, o FDE cuida do código e do pull request, mas não pode fazer merge. Esses limites ajudam a delegar uma tarefa clara sem entregar todas as decisões. Agora podemos configurar o time.")],
 cut=("Read only the yellow idea: owns, good output, stops.", "Leia só a ideia principal: owns, good output, stops."),
 qa=[Q("Why three parts?", "It is short, and each part can be checked. If it is too long, the bot gets confused.", "Por que três partes?", "É curto e cada parte pode ser conferida. Se for longo demais, o bot se confunde.")],
 nxt=None)

slide(title="Live: create the FDE", t="11:07–11:12", m=5, clicks=2, live=True,
 do=[D("Alt+Tab to Grok Bot. Click the button to create a bot (exact path: confirm in rehearsal). Name: FDE TypeScript.", "Alt+Tab para o Grok Bot. Clique no botão de criar bot (caminho exato: conferir no ensaio). Nome: FDE TypeScript.",
       ok=("A new empty bot page opens.", "Abre uma página de bot novo e vazia."),
       fail=("If you cannot find the control, show the illustrative slide and say: 'I cannot complete this live setup yet.' Use a prepared bot only if it actually exists and its configuration was verified.", "Se não encontrar o controle, mostre o slide ilustrativo e diga: 'Ainda não consigo concluir esta configuração ao vivo.' Use um bot preparado somente se ele realmente existir e sua configuração tiver sido verificada.")),
     D("Paste the FDE prompt (below). Then add the 3 skills: shadcn, vercel-react-best-practices, neon-drizzle. Where skills live in the app: confirm in rehearsal.",
       "Cole o prompt do FDE (abaixo). Depois adicione as 3 skills: shadcn, vercel-react-best-practices, neon-drizzle. Onde ficam as skills no app: conferir no ensaio.", prompt=0,
       ok=("The bot shows its instructions and exactly 3 skills.", "O bot mostra as instruções e exatamente 3 skills.")),
     D("Create QA and DevOps using the full instructions in tutorial steps 10 and 11. QA has four explicitly approved skills; FDE has three and DevOps has two. Apply principle-prove-it-works at the end of every deliverable; it does not count toward the skill limit.",
       "Crie QA e DevOps com as instruções completas dos passos 10 e 11 do tutorial. O QA tem quatro skills explicitamente aprovadas; o FDE tem três e o DevOps, duas. Aplique principle-prove-it-works ao final de cada entrega; ela não conta no limite de skills.",
       fail=("QA has four skills on purpose: interrogate stays. The FDE and DevOps have three at most. principle-prove-it-works is the final step for all, not counted.", "O QA tem quatro skills de propósito: a interrogate fica. O FDE e o DevOps têm no máximo três. A principle-prove-it-works é o passo final de todos e não conta.")),
     D("Create the group 'Workshop - Packt Grok Bot' with you and the three bots (how to create a group: confirm in rehearsal). Go back to the deck around 11:11. The shared-chat simulation is ready: click once for the FDE skills and once for the skills reminder.",
       "Crie o grupo 'Workshop - Packt Grok Bot' com você e os três bots (como criar grupo: conferir no ensaio). Volte ao deck por volta das 11:11. A simulação do chat em grupo está pronta: clique uma vez para as skills do FDE e outra para o lembrete de skills.",
       ok=("The group shows 4 members: you plus 3 bots.", "O grupo mostra 4 membros: você e 3 bots."))],
 say=[S("I will start with the FDE. I paste its instructions, add its three skills, and check that everything was saved. Then I configure QA with four approved skills and DevOps with two. QA is the explicit exception to our three-skill limit. Every bot also applies the same completion rule: show proof before saying the work is done. Once these settings are verified, we can ask for a design.", "Vou começar pelo FDE. Colo as instruções, adiciono as três skills e confiro se tudo foi salvo. Depois configuro o QA com quatro skills aprovadas e o DevOps com duas. O QA é a exceção explícita ao nosso limite de três skills. Todos também aplicam a mesma regra de conclusão: mostrar a prova antes de dizer que terminaram. Depois de conferir as configurações, podemos pedir um design.")],
 cut=("Do not create DevOps live. Show only its instructions.", "Não crie o DevOps ao vivo. Mostre só as instruções dele."),
 qa=[Q("What is a skill?", "A skill is a small pack of know-how a bot can load. We keep it to three so the context stays small.", "O que é uma skill?", "Uma skill é um pacote pequeno de conhecimento que o bot pode carregar. Limitamos a três para o contexto ficar pequeno."),
     Q("Why does QA have four skills?", "It is the one exception. interrogate is part of pstack, and it helps QA challenge a result from many angles. principle-prove-it-works is separate: the final done-step for every bot.", "Por que o QA tem quatro skills?", "É a única exceção. A interrogate faz parte do pstack e ajuda o QA a questionar um resultado de vários ângulos. A principle-prove-it-works é à parte: o passo final de todo bot."),
     Q("Can one bot do all roles?", "It can, but it is worse. One role per bot keeps the work clear and checkable.", "Um bot só não faz todos os papéis?", "Faz, mas fica pior. Um papel por bot deixa o trabalho claro e fácil de conferir.")],
 nxt=None)

slide(title="Block 2: Design", t="11:12–11:20", m=8, clicks=1, live=True,
 do=[D("Open a NEW chat with FDE TypeScript (one chat per task). Paste the design prompt (below). Click once on the slide to show the design-review checklist. The ready illustration stays on screen while the FDE works; no screenshot is needed.", "Abra um chat NOVO com o FDE TypeScript (um chat por tarefa). Cole o prompt de design (abaixo). Clique uma vez no slide para mostrar a lista de revisão do design. A ilustração pronta fica na tela enquanto o FDE trabalha; não é preciso inserir prints.", prompt=1,
       ok=("The bot starts working. While it works, read the checklist on the slide.", "O bot começa a trabalhar. Enquanto trabalha, leia a lista no slide."),
       fail=("If it takes more than 2 minutes, say 'Let's give it a few seconds.' and keep explaining the checklist.", "Se demorar mais de 2 minutos, diga 'Let's give it a few seconds.' e continue explicando a lista.")),
     D("When the answer arrives, show three parts: decisions, files, tests.", "Quando a resposta chegar, mostre três partes: decisões, arquivos, testes.",
       ok=("You can point to: decisions, a file list, a test list, and a separate list of assumptions.", "Você consegue apontar: decisões, lista de arquivos, lista de testes e uma lista separada de suposições.")),
     D("If something is open, decide it yourself and write the decision in the chat, in one sentence.", "Se algo ficou em aberto, decida você e escreva a decisão no chat, em uma frase.")],
 say=[S("We are not asking for code yet. The FDE works on its own cloud computer, not on my laptop. It reads the requirements on main, spec.md and the inception document, and the code on the exercise branch, exercise/feedback-ui. Then it explains which files will change, how the form and the results will use the API, and which tests will check the work. I review those choices before we spend time building.", "Ainda não estamos pedindo código. O FDE trabalha no computador dele, na nuvem, não no meu notebook. Ele lê os requisitos na main, o spec.md e o documento inception, e o código da branch do exercício, exercise/feedback-ui. Depois explica quais arquivos vão mudar, como o formulário e os resultados vão usar a API e quais testes vão conferir o trabalho. Eu reviso essas escolhas antes de gastarmos tempo construindo.")],
 cut=("Do not read the whole design. Show only the file list and the test list.", "Não leia o design inteiro. Mostre só a lista de arquivos e a lista de testes."),
 qa=[Q("Why not let the bot just code?", "The design gives QA a clear target. Without it, we may disagree about what is correct.", "Por que não deixar o bot só programar?", "O design dá um alvo claro ao QA. Sem ele, podemos discordar sobre o que está correto.")],
 nxt=None)

slide(title="Block 3: Verify", t="11:20–11:23", m=3, clicks=1, live=True,
 do=[D("Alt+Tab to the FDE chat. Paste the design approval prompt (below). Go back to the deck while it works.", "Alt+Tab para o chat do FDE. Cole o prompt de aprovação do design (abaixo). Volte ao deck enquanto ele trabalha.", prompt=2,
       ok=("The FDE confirms it will work on exercise/feedback-ui and will not merge.", "O FDE confirma que vai trabalhar na exercise/feedback-ui e que não fará merge."),
       fail=("If the FDE asks which repo or branch to target, stop and answer with the instructor-approved exercise target. Never the reference main.", "Se o FDE perguntar qual repositório ou branch usar, pare e responda com o destino do exercício aprovado pela instrutora. Nunca a main de referência.")),
     D("When the FDE says it is done, paste the proof prompt (below).", "Quando o FDE disser que terminou, cole o prompt de prova (abaixo).", prompt=3,
       ok=("The FDE pastes the real output of each command and the commit it tested.", "O FDE cola a saída real de cada comando e o commit que testou."),
       fail=("If it reports success without output, ask: 'Show me the real output.'", "Se ele disser que deu certo sem mostrar a saída, peça: 'Show me the real output.'")),
     D("Click once on the slide to show the line about QA. The four status pills (PASS, FAIL, WARN, BLOCKED) are already visible. Press the right arrow again to go on: the pills move to the top.", "Clique uma vez no slide para mostrar a linha sobre o QA. As quatro etiquetas (PASS, FAIL, WARN, BLOCKED) já estão visíveis. Aperte a seta de novo para seguir: as etiquetas sobem para o topo.")],
 say=[S("The design is ready, so I approve it. Now the FDE builds it on the same branch, exercise/feedback-ui, runs the tests, and opens a pull request into our exercise target branch, not into main. While it works, QA prepares an independent plan. Green CI will be useful evidence later, but it does not replace the acceptance criteria.", "O design está pronto, então eu aprovo. Agora o FDE constrói na mesma branch, exercise/feedback-ui, roda os testes e abre um pull request para a nossa branch de destino do exercício, não para a main. Enquanto ele trabalha, o QA prepara um plano independente. O CI verde vai ser uma evidência útil depois, mas não substitui os critérios de aceite.")],
 cut=("Paste the prompt and go straight to the next slide.", "Cole o prompt e vá direto para o próximo slide."),
 qa=[Q("Why a separate QA bot?", "The one who did the work tends to think it is right. A separate bot checks the agreed criteria against the implementation and evidence.", "Por que um bot de QA separado?", "Quem fez o trabalho tende a achar que está certo. Um bot separado compara os critérios combinados com a implementação e as evidências.")],
 nxt=None)

slide(title="The loop", t="11:23–11:25", m=2, clicks=5,
 do=[D("Click 5 times. 1: FDE builds. 2: pull request, CI and preview. 3: QA tests the commit. 4: all PASS? yes, I approve and merge. 5: FAIL goes back to the FDE, and BLOCKED is not a pass.",
       "Clique 5 vezes. 1: o FDE constrói. 2: pull request, CI e preview. 3: o QA testa o commit. 4: tudo PASS? sim, eu aprovo e faço o merge. 5: FAIL volta para o FDE, e BLOCKED não é aprovação.",
       ok=("The loop is complete. The red arrow goes back to the FDE.", "O ciclo está completo. A seta vermelha volta para o FDE."))],
 say=[S("Here is the loop we will follow. The FDE opens a pull request with its changes and local evidence. We then check CI, the preview, and the commit that QA will test. A failed check goes back to the FDE for a focused fix. A missing prerequisite stays blocked. After any change, we check the new commit again, so the final decision uses current evidence.", "Este é o ciclo que vamos seguir. O FDE abre um pull request com as alterações e as evidências locais. Depois conferimos o CI, a preview e o commit que o QA testará. Uma verificação com falha volta ao FDE para uma correção pontual. Um pré-requisito ausente continua bloqueado. Após qualquer mudança, conferimos o novo commit, para a decisão final usar evidências atuais.")],
 cut=("Thirty seconds. Click fast and say only the last sentence.", "Trinta segundos. Clique rápido e diga só a última frase."),
 qa=[Q("What does BLOCKED mean?", "It means QA is missing access or evidence. It is an honest answer, not a pass.", "O que significa BLOCKED?", "Significa que falta acesso ou evidência ao QA. É uma resposta honesta, não uma aprovação.")],
 nxt=None)

slide(title="Prove it works", t="11:25–11:27", m=2, clicks=3,
 do=[D("Click three times: check the real artifact, not a proxy, script it. Then say the rule out loud.", "Clique três vezes: conferir o artefato real, não um proxy, e transformar em script. Depois diga a regra em voz alta.",
       ok=("The three cards are on screen with the bot faces and the pstack credit.", "Os três cartões estão na tela, com as carinhas dos bots e o crédito ao pstack.")),
     D("Point to the examples: 'it compiles', a self-report, a cached screenshot are proxies. A value you read from the running app is the real thing.", "Aponte os exemplos: 'compila', um auto-relato e um print antigo são proxies. Um valor que você lê do app rodando é a coisa real.")],
 say=[S("When a bot says something works, we need a way to check that claim. A summary, a successful build, or an old screenshot is not enough to prove the full feature. We need to run the relevant check against the actual target and keep the output. A small script makes that check repeatable. The target and permissions still matter: local proof does not authorize a remote write.", "Quando um bot diz que algo funciona, precisamos de uma forma de conferir essa afirmação. Um resumo, um build bem-sucedido ou um print antigo não bastam para comprovar a funcionalidade completa. Precisamos executar a verificação relevante no alvo real e guardar a saída. Um pequeno script permite repetir a verificação. O alvo e as permissões continuam importantes: uma prova local não autoriza uma escrita remota.")],
 cut=("Say only the rule and the last sentence. Thirty seconds.", "Diga só a regra e a última frase. Trinta segundos."),
 qa=[Q("Is this a skill or a rule?", "It is a pstack principle, a short skill. Each bot applies it at the end of its work.", "Isto é uma skill ou uma regra?", "É um princípio do pstack, uma skill curta. Cada bot aplica no fim do trabalho."),
     Q("Why not trust the bot when it says it works?", "A bot can be sure and wrong. Reading the real value costs little. A wrong guess costs much more.", "Por que não confiar quando o bot diz que funciona?", "Um bot pode estar convicto e errado. Ler o valor real custa pouco. Um palpite errado custa muito mais.")],
 nxt=None)

slide(title="How do I trust my agents more?", t="11:27–11:28", m=1, clicks=0,
 do=[D("Leave this slide up for about thirty seconds, just before the QA checklist. Trace the five layers from top to bottom and point at the cost arrow. The credit and the talk link are on the slide; do not read the URL aloud.",
       "Deixe este slide por cerca de trinta segundos, logo antes do checklist do QA. Percorra as cinco camadas de cima para baixo e aponte a seta de custo. O crédito e o link da palestra estão no slide; não leia a URL em voz alta.",
       ok=("The pyramid, the cost arrow and the Lauren Tan credit are visible.", "A pirâmide, a seta de custo e o crédito a Lauren Tan estão visíveis."))],
 say=[S("Before the QA bot runs its checklist, here is how I trust an agent more. The pyramid is ordered by cost. The cheap, deterministic layers come first: the codebase, then static analysis. Verification comes next, prose rules after that, and human review last, because it is the most expensive. That is why our bots get skills, tests, and a QA checklist before a human approves.",
       "Antes de o bot de QA rodar o checklist, é assim que eu passo a confiar mais num agente. A pirâmide está ordenada por custo. As camadas baratas e determinísticas vêm primeiro: a base de código e, depois, a análise estática. A verificação vem em seguida, as regras em prosa depois disso, e a revisão humana por último, porque é a mais cara. Por isso os nossos bots recebem skills, testes e um checklist de QA antes de uma pessoa aprovar.",
       "pyramid → PÍ-ra-mid; deterministic → di-tèr-mi-NÍS-tic; expensive → iks-PÉN-siv")],
 cut=("One sentence: cheap checks first, human review last. Then open the QA checklist.", "Uma frase: verificações baratas primeiro, revisão humana por último. Depois abra o checklist do QA."),
 qa=[], nxt=None)

slide(title="Live: QA prepares the checks", t="11:28–11:40", m=12, clicks=3, live=True,
 do=[D("Open the QA chat and send the planning prompt below. During this block, QA prepares the AC1–12 matrix while FDE implements. Do not run remote writes.", "Abra o chat do QA e envie o prompt de planejamento abaixo. Neste bloco, o QA prepara a matriz AC1–12 enquanto o FDE implementa. Não execute escritas remotas.", prompt=4,
       ok=("QA maps AC1–12 to planned checks, available tooling and missing prerequisites. No preview writes or invented PASS results occur in this planning step.", "O QA relaciona AC1–12 às verificações planejadas, ferramentas disponíveis e pré-requisitos ausentes. Não há escritas na preview nem resultados PASS inventados nesta etapa de planejamento."),
       fail=("If QA says BLOCKED, read why. Missing access, isolation or evidence is a valid answer: explain it. Do not hide it.", "Se o QA disser BLOCKED, leia o motivo. Falta de acesso, isolamento ou evidência é uma resposta válida: explique. Não esconda.")),
     D("Ask QA to verify its plan against the agreed criteria using the prompt below. This checks the plan, not the deployed application; there is no acceptance verdict yet.", "Peça ao QA que confira o plano com os critérios combinados usando o prompt abaixo. Isto confere o plano, não o aplicativo publicado; ainda não há veredito de aceite.", prompt=5,
       fail=("If QA cannot show a result, it must say BLOCKED. Do not accept 'it should pass'.", "Se o QA não conseguir mostrar um resultado, ele deve dizer BLOCKED. Não aceite 'deve passar'.")),
     D("Click three times on this slide (it is an illustrative mock, not real results): PASS line, FAIL line, BLOCKED line.", "Clique três vezes neste slide (é um mock ilustrativo, não resultados reais): linha PASS, linha FAIL, linha BLOCKED."),
     D("When the FDE sends the pull request link, open it and check the top line: exercise-target/2026-11-20 ← exercise/feedback-ui. If it says main, do not merge and ask the FDE to change the target.", "Quando o FDE mandar o link do pull request, abra e confira a linha do topo: exercise-target/2026-11-20 ← exercise/feedback-ui. Se aparecer main, não faça merge e peça ao FDE para trocar o destino.",
       ok=("QA names the planned target and required evidence per criterion. Actual results are recorded only after execution.", "O QA indica o alvo planejado e a evidência necessária por critério. Os resultados reais só são registrados após a execução.")),
     D("Backup plan if the live demo breaks: show the verified reference app if it is reachable. If it is not, explain the block and show only retained evidence. A recording is optional and must be labeled as pre-recorded.",
       "Plano B se a demo ao vivo quebrar: mostre a aplicação de referência verificada, se estiver acessível. Se não estiver, explique o bloqueio e mostre só evidência retida. Gravação é opcional e deve ser identificada como pré-gravada.")],
 say=[S("Now QA prepares the checks while the FDE builds. It starts from the agreed criteria, not from the author’s success message. For each criterion, it says how it will check it and what it still needs. At this stage, we are reviewing a plan. QA evaluates the real pull request in the next block.", "Agora o QA prepara as verificações enquanto o FDE constrói. Ele parte dos critérios combinados, não da mensagem de sucesso do autor. Para cada critério, diz como vai conferir e o que ainda falta. Nesta etapa, estamos revisando um plano. O QA avalia o pull request real no próximo bloco.")],
 cut=("Show two or three planned checks and the missing prerequisites. Do not present the plan as a completed evaluation.", "Mostre duas ou três verificações planejadas e os pré-requisitos ausentes. Não apresente o plano como uma avaliação concluída."),
 qa=[Q("How do you know QA is right?", "It must show evidence for each result: a command, a URL, an output. If it cannot, it says BLOCKED.", "Como saber que o QA está certo?", "Ele precisa mostrar evidência em cada resultado: comando, URL, saída. Se não puder, diz BLOCKED."),
     Q("Is this chat real?", "The slide is a mock, marked on screen. The chat in Grok Bot is real.", "Este chat é real?", "O slide é um mock, marcado na tela. O chat no Grok Bot é real.")],
 nxt=None)

slide(title="Background PR", t="11:40–11:47", m=7, clicks=1, live=True,
 do=[D("Say that the work runs in the cloud. Click once to show the DevOps card (mock).", "Diga que o trabalho roda na nuvem. Clique uma vez para mostrar o cartão do DevOps (mock)."),
     D("Paste the DevOps prompt (below) in the DevOps chat.", "Cole o prompt do DevOps (abaixo) no chat do DevOps.", prompt=6,
       ok=("DevOps gives the CI link, the preview URL, and says the secrets are present (redacted).", "O DevOps dá o link do CI, a preview URL e diz que os segredos estão presentes (redacted)."),
       fail=("If a secret value appears on screen: stop sharing the screen and pause the demo. Never read it out loud. An authorized operator must revoke or rotate it now, before you resume.", "Se algum valor de segredo aparecer na tela: pare de compartilhar a tela e pause a demonstração. Nunca leia em voz alta. Um operador autorizado deve revogar ou rotacionar a credencial agora, antes de retomar.")),
     D("Paste the DevOps prove-it-works prompt (below): it must open the real run and the real preview and report what it sees now.", "Cole o prompt de prova do DevOps (abaixo): ele deve abrir a execução real e a preview real e informar o que vê agora.", prompt=7,
       ok=("DevOps pastes one command (for example a curl status check) and its output. No secret value appears.", "O DevOps cola um comando (por exemplo um curl de status) e a saída. Nenhum valor de segredo aparece.")),
     D("Paste the QA evaluation prompt (below) in the QA chat. The bots cannot open the protected Vercel preview, so BLOCKED for preview access is expected. If CI failed only with 'Test timed out in 5000ms', click Re-run failed jobs on GitHub.", "Cole o prompt de avaliação do QA (abaixo) no chat do QA. Os bots não conseguem abrir a preview protegida da Vercel, então BLOCKED para o acesso à preview é o esperado. Se o CI falhou só com 'Test timed out in 5000ms', clique em Re-run failed jobs no GitHub.", prompt=10)],
 say=[S("The pull request brings the work together, and all of it runs in the cloud, not on my laptop. DevOps gives us the real CI and preview links for the latest commit. QA evaluates the same pull request against our criteria. The bots cannot log in to the protected preview, so they say so instead of pretending. I will check the preview myself.", "O pull request reúne o trabalho, e tudo roda na nuvem, não no meu notebook. O DevOps traz os links reais do CI e da preview do último commit. O QA avalia o mesmo pull request com os nossos critérios. Os bots não conseguem entrar na preview protegida, então eles avisam em vez de fingir. Eu mesma vou conferir a preview.")],
 cut=("Use the status links already on the pull request if time is short.", "Use os links de status que já estão no pull request se o tempo estiver curto."),
 qa=[Q("What if a secret or credential appears on screen?", "I stop sharing the screen and pause the demo. An authorized operator revokes or rotates the credential immediately, in the provider's secure settings, before we resume. Switching windows does not invalidate an exposed credential, and waiting until the session ends leaves it usable.", "E se um segredo ou credencial aparecer na tela?", "Paro de compartilhar a tela e pauso a demonstração. Um operador autorizado revoga ou rotaciona a credencial imediatamente, nas configurações seguras do provedor, antes de retomarmos. Trocar de janela não invalida uma credencial exposta, e esperar o fim da sessão a deixa utilizável.")],
 nxt=None)

slide(title="Live: send feedback", t="11:47–11:55", m=8, clicks=2, live=True,
 do=[D("Open the pull request preview (Visit Preview in the Vercel comment on the PR) and go to /feedback.", "Abra a preview do pull request (Visit Preview no comentário da Vercel no PR) e vá em /feedback.",
       fail=("If the preview does not load, say 'This is live, so things can be slow.' If it is down, show the verified reference app (if reachable) and explain the block.", "Se a preview não carregar, diga 'This is live, so things can be slow.' Se estiver fora do ar, mostre a aplicação de referência verificada (se acessível) e explique o bloqueio.")),
     D("Click once to reveal the illustrated form (an example). In the real form, submit talk 'Packt Live 20 Nov', author 'Workshop Demo', rating 5 and a blank comment. Click submit only once. Click again to reveal the sample chart, then open /results on the preview.", "Clique uma vez para revelar o formulário ilustrado (exemplo). No formulário real, envie talk 'Packt Live 20 Nov', author 'Workshop Demo', nota 5 e comentário vazio. Clique em enviar uma vez só. Clique de novo para revelar o gráfico de exemplo e depois abra /results na preview.",
       ok=("'Packt Live 20 Nov' shows its count one higher than before (5.0 and 1 on the first submission ever). Other talks also appear: the preview uses the shared demo database.", "'Packt Live 20 Nov' mostra a contagem um a mais do que antes (5.0 e 1 no primeiro envio). Outras talks também aparecem: a preview usa o banco de demonstração compartilhado.")),
     D("Reload the page once. The data must still be there.", "Recarregue a página uma vez. O dado precisa continuar lá.",
       fail=("If the data or expected result disappears after reload, do not hide it. Say: 'QA will mark this as FAIL.' and show the cause only if you know it.", "Se o dado ou resultado esperado sumir após o recarregamento, não esconda. Diga: 'QA will mark this as FAIL.' e mostre a causa só se você souber.")),
     D("If there is time, ask the chat for a rating and submit one more. If the preview is down, open the reference app (https://grok-bot-workshop-mvp.vercel.app/results) and say it is the prepared reference, not proof of our PR.", "Se der tempo, peça uma nota no chat e envie mais um. Se a preview estiver fora do ar, abra a aplicação de referência (https://grok-bot-workshop-mvp.vercel.app/results) e diga que é a referência preparada, não a prova do nosso PR.")],
 say=[S("Now I try the real form on the pull request preview. This preview uses our shared demo database, so you will see other talks too. I submit one entry: the talk Packt Live 20 Nov, a rating of five, and no comment. Then I open the results and read the average and the count. Finally, I reload the page. The data must still be there.", "Agora eu testo o formulário real na preview do pull request. Essa preview usa o nosso banco de demonstração compartilhado, então vocês vão ver outras talks também. Envio uma resposta: a talk Packt Live 20 Nov, nota cinco e nenhum comentário. Depois abro os resultados e leio a média e a contagem. Por fim, recarrego a página. O dado precisa continuar lá.")],
 cut=("Submit only one feedback entry. Do not ask the audience.", "Envie só um feedback. Não peça à plateia."),
 qa=[Q("Is the average rounded?", "Yes, to one decimal. For example, 4.25 becomes 4.3.", "A média é arredondada?", "Sim, para uma casa decimal. Por exemplo, 4.25 vira 4.3."),
     Q("Are Talk A and talk a the same talk?", "Yes. The app groups them together.", "Talk A e talk a são a mesma palestra?", "Sim. O app agrupa os dois juntos.")],
 nxt=None)

slide(title="Block 5: Approval", t="11:55–11:58", m=3, clicks=2,
 do=[D("Click twice: first the green card (work within the approved scope), then the red card (a human decides). The line 'Only I can merge.' sits in the red card.", "Clique duas vezes: primeiro o cartão verde (trabalho dentro do escopo aprovado), depois o cartão vermelho (uma pessoa decide). A frase 'Only I can merge.' fica no cartão vermelho.")],
 say=[S("We now have evidence to review, but the bots do not make the merge decision. They act within the scope we approved. Being easy to undo does not make an action authorized. Human approval is not distrust of the agent. It is the most expensive layer, so it comes last, after the other layers have filtered what they could. I am responsible for checking the result and deciding whether we can proceed. In this workshop, only I can merge, and I can also decide that the safest next step is to wait.", "Agora temos evidências para revisar, mas os bots não tomam a decisão de merge. Eles agem dentro do escopo aprovado. Ser fácil de desfazer não torna uma ação autorizada. A aprovação humana não é desconfiança do agente. É a camada mais cara, então vem por último, depois que as outras camadas filtraram o que puderam. Eu sou responsável por conferir o resultado e decidir se podemos avançar. Neste workshop, só eu posso fazer o merge, e também posso decidir que o próximo passo mais seguro é esperar.")],
 cut=("Read only the two card titles.", "Leia só os títulos dos dois cartões."),
 qa=[Q("Why not let the bot merge when all tests pass?", "A merge changes the real world. Passing tests are evidence, but a person owns the decision.", "Por que o bot não faz o merge quando todos os testes passam?", "O merge muda o mundo real. Testes passando são evidência, mas a decisão é de uma pessoa.")],
 nxt=None)

slide(title="Live: read three things, then decide", t="11:58–12:10", m=12, clicks=3, live=True,
 do=[D("Open the pull request on GitHub. First confirm the target: the approved exercise repo and branch. Never the reference main and never the frozen checkpoint.", "Abra o pull request no GitHub. Primeiro confirme o destino: o repositório e a branch do exercício aprovados. Nunca a main de referência e nunca o checkpoint congelado.",
       fail=("If the target is unclear, stop. Do not merge. Say: 'I will confirm the target first.'", "Se o destino não estiver claro, pare. Não faça o merge. Diga: 'I will confirm the target first.'")),
     D("Click on the slide: 1 what changed, 2 QA report, 3 CI status. Read each one on the PR in that order. The line 'Only I can merge.' is already on screen.", "Clique no slide: 1 o que mudou, 2 relatório do QA, 3 status do CI. Leia cada um no PR nessa ordem. A frase 'Only I can merge.' já está na tela."),
     D("All required criteria PASS and WARN reviewed? Decide and merge it yourself on the exercise target. Any FAIL or BLOCKED: do not call the MVP accepted.", "Todos os critérios obrigatórios em PASS e os WARN avaliados? Decida e faça o merge você mesma no destino do exercício. Com FAIL ou BLOCKED: não apresente o MVP como aceito.",
       ok=("GitHub shows the PR as merged on the exercise target.", "O GitHub mostra o PR como merged no destino do exercício.")),
     D("If QA says FAIL, paste the fix prompt to the FDE (replace <N> and the evidence). If you are late, show the FAIL as an example and say the fix comes later.", "Se o QA disser FAIL, cole o prompt de correção para o FDE (troque <N> e a evidência). Se estiver atrasada, mostre o FAIL como exemplo e diga que a correção fica para depois.", prompt=8,
       fail=("If QA says BLOCKED, explain that access or infrastructure is missing and that this is an honest answer.", "Se o QA disser BLOCKED, explique que falta acesso ou infraestrutura e que isso é uma resposta honesta."))],
 say=[S("I review three things for the same commit: the change, the independent QA report, and the CI and preview checks. I also confirm the exercise target. If the required checks and criteria pass, I can decide whether to merge. If something fails, I request a focused fix. If evidence is missing, the result stays blocked. Either way, I explain the decision before we move on.", "Reviso três coisas para o mesmo commit: a alteração, o relatório independente do QA e as verificações do CI e da preview. Também confirmo o destino do exercício. Se as verificações e os critérios obrigatórios passarem, posso decidir se farei o merge. Se algo falhar, peço uma correção pontual. Se faltar evidência, o resultado continua bloqueado. Em qualquer caso, explico a decisão antes de seguir.")],
 cut=("If you get FAIL, do not fix it live. Show it as an example and move on.", "Se vier FAIL, não corrija ao vivo. Mostre como exemplo e siga."),
 qa=[Q("What if the FDE keeps failing?", "Then I stop and rewrite the task or the design. Bots do not decide to try again forever.", "E se o FDE continuar falhando?", "Então eu paro e reescrevo a tarefa ou o design. Bots não decidem tentar para sempre."),
     Q("Is green CI enough to merge?", "No. Green CI means the configured checks passed. Acceptance needs evidence for the agreed criteria.", "CI verde basta para fazer merge?", "Não. CI verde significa que os checks configurados passaram. O aceite precisa de evidências para os critérios combinados.")],
 nxt=None)

slide(title="Block 6: Recovery first", t="12:10–12:22", m=12, clicks=1, live=True,
 do=[D("Check core implementation, independent tests, and human review of the form and dashboard. Use this time to finish them, or declare BLOCKED and name the missing evidence.", "Confira implementação do núcleo, testes independentes e revisão humana do formulário e dashboard. Use este tempo para concluí-los, ou declare BLOCKED e diga qual evidência falta.",
       ok=("The core, tests, and human review are complete, with evidence.", "Núcleo, testes e revisão humana estão concluídos, com evidência."),
       fail=("Any missing evidence remains BLOCKED and is named aloud before Q&A.", "Toda evidência ausente continua BLOCKED e é dita em voz alta antes do Q&A.")),
     D("OPTIONAL: only after core work, tests and human review are complete, and before 12:22 BRT, show the disabled text draft from tutorial step 24. Do not create or enable a schedule. Verify any interface in rehearsal; do not assume a control exists.", "OPCIONAL: somente após concluir núcleo, testes e revisão humana, e antes das 12:22 BRT, mostre o rascunho de texto desativado do passo 24 do tutorial. Não crie nem ative agendamento. Confira a interface no ensaio; não presuma que um controle exista.",
       ok=("The draft shows Enabled: No.", "O rascunho mostra Enabled: No.")),
     D("OPTIONAL — only if everything is complete and time remains: run the offline preview prompt below on the three local sample files.", "OPCIONAL — somente se tudo estiver concluído e sobrar tempo: execute o prompt da preview offline abaixo nos três arquivos de exemplo locais.", prompt=9,
       ok=("The bot proposes one label per sample (bug, feature or unclear) and applies nothing.", "O bot propõe um label por exemplo (bug, feature ou unclear) e não aplica nada."),
       fail=("If it tries to touch real issues, stop it and say: 'This is preview only.'", "Se tentar mexer em issues reais, pare e diga: 'This is preview only.'"))],
 say=[S("This time is for finishing the core work first. If implementation, tests, or human review are still incomplete, we use it to recover or explain the blocker. We skip the routine unless everything is complete and there is time left. Even then, we show only a disabled text draft. At 12:22, we stop recovery and recap what happened. Questions begin at 12:26.", "Este tempo é para concluir primeiro o trabalho principal. Se implementação, testes ou revisão humana ainda estiverem incompletos, vamos usá-lo para recuperar o trabalho ou explicar o bloqueio. Pulamos a rotina, a menos que tudo esteja concluído e sobre tempo. Mesmo assim, mostramos apenas um rascunho de texto desativado. Às 12:22, encerramos a recuperação e recapitulamos o que aconteceu. As perguntas começam às 12:26.")],
 cut=("The routine is already omitted. Use the time to recover the core, but never past 12:22 BRT. As recap starts, say the blockers aloud. We take questions at 12:26 BRT.", "A rotina já está omitida. Use o tempo para recuperar o núcleo, mas nunca passe de 12:22 BRT. Ao entrar no recap, diga os bloqueios em voz alta. As perguntas abrem às 12:26 BRT."),
 qa=[Q("What if the core is still incomplete at 12:22 BRT?", "Stop recovery, start recap, and state what remains BLOCKED and which evidence is missing. Start taking questions at 12:26 BRT.", "E se o núcleo ainda estiver incompleto às 12:22 BRT?", "Encerre a recuperação, comece o recap e diga o que continua BLOCKED e qual evidência falta. Abra as perguntas às 12:26 BRT."),
     Q("Can I shorten the routine to fit?", "No. Skip it completely unless the core, tests, and human review are complete and time remains.", "Posso encurtar a rotina para caber?", "Não. Pule-a por completo, a menos que núcleo, testes e revisão humana estejam concluídos e sobre tempo.")],
 nxt=None)

slide(title="Recap", t="12:22–12:23", m=1, clicks=3,
 do=[D("Click three times. Read each card, one at a time, with a pause.", "Clique três vezes. Leia cada cartão, um por vez, com uma pausa.")],
 say=[S("Let us bring this together. Each bot had one clear role, so we knew who was responsible for each part. We asked for evidence, so we could check the claims instead of trusting a success message. And a human kept control of the important decisions. Those three habits apply even when the work ends with a blocker rather than a merge. If your inner loop produces slop, automating it just produces more slop. That line is from Lauren Tan's talk, All Code Is Slop (Except Mine).", "Vamos juntar as ideias. Cada bot tinha um papel claro, então sabíamos quem era responsável por cada parte. Pedimos evidências para conferir as afirmações, em vez de confiar em uma mensagem de sucesso. E uma pessoa manteve o controle das decisões importantes. Esses três hábitos se aplicam mesmo quando o trabalho termina com um bloqueio, em vez de um merge. Se o ciclo interno produz slop, automatizá-lo só produz mais slop. Essa frase é da palestra de Lauren Tan, All Code Is Slop (Except Mine).")],
 cut=("Never cut the recap. It takes one minute.", "Nunca corte o recap. Leva um minuto."),
 qa=[], nxt=None)

slide(title="Bonus: reduce usage", t="12:23–12:24", m=1, clicks=3,
 do=[D("Click three times. Say only one sentence, then move on.", "Clique três vezes. Diga só uma frase e siga.")],
 say=[S("One practical tip before we close: keep each task focused. Start a new chat for a new task and send one complete prompt with the context and expected result. The stable role belongs in the bot’s instructions. For supported GitHub tasks, use connectors first and the browser when needed. This keeps the workflow easier to follow and avoids unnecessary context.", "Uma dica prática antes de encerrar: mantenha cada tarefa focada. Abra um chat novo para uma tarefa nova e envie um prompt completo com o contexto e o resultado esperado. O papel estável pertence às instruções do bot. Nas tarefas do GitHub compatíveis, use conectores primeiro e o navegador quando necessário. Assim, o fluxo fica mais fácil de acompanhar e evitamos contexto desnecessário.")],
 cut=("Skip this slide. Finish exactly at 12:30.", "Pule este slide. Termine exatamente às 12:30."),
 qa=[], nxt=None)

slide(title="Optional: pstack", t="12:24–12:26", m=2, clicks=3, optional=True,
 do=[D("OPTIONAL slide. Use it only if you are on time. Skip it if you are more than 2 minutes late.", "Slide OPCIONAL. Use só se estiver no horário. Pule se estiver mais de 2 minutos atrasada."),
     D("Click three times: the credit, /poteto-mode, /poteto-help. Do NOT run /setup-pstack live: it writes a Cursor rules file. Show the three links as text only.", "Clique três vezes: o crédito, /poteto-mode, /poteto-help. NÃO rode /setup-pstack ao vivo: ele grava um arquivo de regras do Cursor. Mostre os três links só como texto.",
       fail=("If someone asks to see it live, say: 'I will share the link, and you can try it after the session.'", "Se alguém pedir para ver ao vivo, diga: 'I will share the link, and you can try it after the session.'"))],
 say=[S("If we have time, here is the source of the pstack skills used in this workflow. The project was created by Lauren Tan. You can use slash poteto-mode to ask for more rigor, or slash poteto-help when you are not sure which skill fits a task. The links are on the slide. We will leave installation and setup for after the session, so we can keep time for your questions.", "Se tivermos tempo, aqui está a origem das skills do pstack usadas neste fluxo. O projeto foi criado por Lauren Tan. Vocês podem usar barra poteto-mode para pedir mais rigor ou barra poteto-help quando não souberem qual skill combina com uma tarefa. Os links estão no slide. Vamos deixar a instalação e a configuração para depois da sessão, para preservar o tempo das perguntas.")],
 cut=("Skip this slide. Go straight to Questions.", "Pule este slide. Vá direto para as perguntas."),
 qa=[Q("Do I need pstack to follow the workshop?", "No. The repo includes the skills we used. pstack is where they come from.", "Preciso do pstack para acompanhar o workshop?", "Não. O repositório inclui as skills que usamos. O pstack é de onde elas vêm.")],
 nxt=None)

slide(title="Questions?", t="12:26–12:30", m=4, clicks=0,
 do=[D("Open for questions. Read each question from the chat out loud before you answer.", "Abra para perguntas. Leia cada pergunta do chat em voz alta antes de responder."),
     D("At 12:29 say: “Thank you so much! See you next time.” End by 12:30, even if questions remain.", "Às 12:29, diga: “Thank you so much! See you next time.” Encerre até 12:30, mesmo que ainda haja perguntas.",
       ok=("The clock bar is full. The session ends at 12:30.", "A barra de tempo está cheia. A sessão termina às 12:30.")),
     D("Remember: the repo is private. The slides and the guide are public. Code access is granted separately by the instructor.", "Lembre: o repositório é privado. Os slides e o guia são públicos. O acesso ao código é dado separadamente pela instrutora.")],
 say=[S("Now we have time for your questions. Please write them in the chat, and I will read each one before I answer. If I need to check a detail, I will say so. The slides and guide are public; access to the private code is handled separately by the instructor.", "Agora temos tempo para as perguntas de vocês. Escrevam no chat, e vou ler cada uma antes de responder. Se eu precisar conferir algum detalhe, vou avisar. Os slides e o guia são públicos; o acesso ao código privado é tratado separadamente pela instrutora.")],
 cut=("Close at 12:29 with the final sentence, even if there are questions.", "Encerre às 12:29 com a frase final, mesmo que haja perguntas."),
 qa=[Q("Can I get the slides and the guide?", "Yes. The slides and the guide are public. For the code, ask the instructor for access.", "Posso ter os slides e o guia?", "Sim. Os slides e o guia são públicos. Para o código, peça acesso à instrutora.")],
 nxt=None)

# ---------- per-slide timing sanity ----------
assert len(SL) == 23

EMERGENCY = [
 S("Let's give it a few seconds.", "Vamos dar alguns segundos.", "seconds → SÉ-kons"),
 S("While the bot works, let me explain.", "Enquanto o bot trabalha, deixa eu explicar.", "explain → ex-PLÊIN"),
 S("Great question. Let's come back to it during Q&A.", "Ótima pergunta. Vamos retomá-la durante as perguntas e respostas.", "great → GRÊIT"),
 S("This is live, so things can be slow.", "É ao vivo, então pode demorar.", "live → LÁIV; slow → SLÓU"),
 S("If the preview is blocked, we keep that result and explain what is missing.", "Se a preview estiver bloqueada, mantemos esse resultado e explicamos o que falta.", "blocked → BLÓCT; verified → VÉ-ri-faid"),
 S("I'll read the question in the chat.", "Vou ler a pergunta no chat.", "read → RÍID"),
 S("Can you repeat that, please?", "Pode repetir, por favor?", "repeat → ri-PÍIT"),
 S("Let's move on.", "Vamos seguir.", "move → MÚUV"),
]

# ---------- rendering: deck notes ----------
E = html.escape
# Slides where the presenter leaves the deck for a live demo: (English, Portuguese) cue shown on the slide notes and in the guide.
DEMO = {
    8: ("Alt+Tab to Grok Bot: create the FDE, then QA and DevOps.", "Alt+Tab para o Grok Bot: criar o FDE, depois QA e DevOps."),
    9: ("Alt+Tab to Grok Bot: new FDE chat, paste the design prompt.", "Alt+Tab para o Grok Bot: chat novo com o FDE, colar o prompt de design."),
    10: ("Alt+Tab to Grok Bot: FDE chat, approve the design, then paste the proof prompt.", "Alt+Tab para o Grok Bot: chat do FDE, aprovar o design e depois colar o prompt de prova."),
    14: ("Alt+Tab to Grok Bot: QA chat, paste the QA prompt.", "Alt+Tab para o Grok Bot: chat do QA, colar o prompt do QA."),
    15: ("Alt+Tab to Grok Bot: DevOps chat, then open the PR on GitHub.", "Alt+Tab para o Grok Bot: chat do DevOps, depois abrir o PR no GitHub."),
    16: ("Alt+Tab to the browser: PR preview, feedback demo only if the gate passed.", "Alt+Tab para o navegador: preview do PR, demo do feedback só se o gate passou."),
    18: ("Alt+Tab to GitHub: confirm the target, read the PR, then decide.", "Alt+Tab para o GitHub: confirmar o destino, ler o PR e decidir."),
}
DEMO_BACK = ("Back to the deck when done: Alt+Tab (Cmd+Tab on Mac).", "Volte ao deck no fim: Alt+Tab (Cmd+Tab no Mac).")

ST = dict(
 head="margin:0 0 10px;font-size:1.05em;font-weight:700;color:#111",
 sec="margin:14px 0 4px;font-size:.78em;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#444",
 en="margin:6px 0 0;font-size:1em;line-height:1.35;color:#111;font-weight:600",
 pt="margin:2px 0 8px;font-size:.88em;line-height:1.3;color:#555;font-style:italic",
 ph="margin:0 0 8px;font-size:.85em;color:#8a4b00",
 box="margin:6px 0;padding:8px 12px;border-left:5px solid %s;background:%s",
 pre="white-space:pre-wrap;font-size:.8em;background:#f3f3f3;color:#111;padding:8px;border-radius:6px;margin:6px 0",
)
def notes_html(i):
    s = SL[i]; n = i + 1
    blk = next(b for b in BLOCKS if b["slides"][0] <= n <= b["slides"][1])
    bi = BLOCKS.index(blk)
    o = []
    o.append(f'<p style="{ST["head"]}">⏱ {s["t"]} BRT · {s["m"]} min · slide {n}/{len(SL)} · block {bi} · {E(blk["name"])}' + (' · OPTIONAL SLIDE' if s.get('optional') else '')
             + (f' · {s["clicks"]} click{"s" if s["clicks"]!=1 else ""} on the slide' if s["clicks"] else ' · no clicks on the slide') + '</p>')
    if n in DEMO:
        o.append('<div style="' + ST["box"] % ("#dc2626", "#fff0f0") + '">'
                 f'<p style="{ST["en"]};color:#b91c1c;font-weight:800">🎬 LIVE DEMO NOW · DEMO AO VIVO AGORA</p>'
                 f'<p style="{ST["en"]}">{E(DEMO[n][0])}</p><p style="{ST["pt"]}">{E(DEMO[n][1])}</p>'
                 f'<p style="{ST["pt"]}">{E(DEMO_BACK[0])} · {E(DEMO_BACK[1])}</p></div>')
    o.append(f'<p style="{ST["sec"]}">🖱 Hands-on · Passo a passo</p><ol style="margin:0 0 0 1.2em;padding:0">')
    for d in s["do"]:
        o.append(f'<li style="margin-bottom:8px"><span style="{ST["en"]}">{E(d["en"])}</span><br><span style="{ST["pt"]}">{E(d["pt"])}</span>')
        if d["ok"]: o.append(f'<br><span style="color:#0a6b2d;font-size:.9em">✅ {E(d["ok"][0])}</span><br><span style="color:#0a6b2d;font-size:.85em;font-style:italic">{E(d["ok"][1])}</span>')
        if d["fail"]: o.append(f'<br><span style="color:#a11;font-size:.9em">⚠️ {E(d["fail"][0])}</span><br><span style="color:#a11;font-size:.85em;font-style:italic">{E(d["fail"][1])}</span>')
        if d["prompt"] is not None: o.append(f'<pre>{E(PROMPTS[d["prompt"]])}</pre>')
        o.append('</li>')
    o.append('</ol>')
    o.append(f'<p style="{ST["sec"]}">🗣 Say it · Fale (leia em voz alta)</p>')
    for l in s["say"]:
        o.append('<div style="' + ST["box"] % ("#3b82f6", "#eef5ff") + '">'
                 f'<p style="{ST["en"]}">“{E(l["en"])}”</p><p style="{ST["pt"]}">{E(l["pt"])}</p>'
                 + (f'<p style="{ST["ph"]}">🔊 {E(l["ph"])}</p>' if l["ph"] else '') + '</div>')
    o.append(f'<p style="{ST["sec"]}">✂️ If you are late · Se atrasar</p><div style="{ST["box"] % ("#f59e0b", "#fff8e8")}">'
             f'<p style="{ST["en"]}">{E(s["cut"][0])}</p><p style="{ST["pt"]}">{E(s["cut"][1])}</p></div>')
    if s["qa"]:
        o.append(f'<p style="{ST["sec"]}">❓ Likely questions · Perguntas prováveis</p>')
        for q in s["qa"]:
            o.append('<div style="' + ST["box"] % ("#a855f7", "#f6efff") + '">'
                     f'<p style="{ST["en"]}">Q: {E(q["qen"])}</p><p style="{ST["en"]};font-weight:500">A: “{E(q["aen"])}”</p>'
                     f'<p style="{ST["pt"]}">P: {E(q["qpt"])} — R: {E(q["apt"])}</p></div>')
    if s["nxt"]:
        o.append(f'<p style="{ST["sec"]}">➡️ Transition · Transição</p><div style="{ST["box"] % ("#14b8a6", "#ecfbf8")}">'
                 f'<p style="{ST["en"]}">“{E(s["nxt"][0])}”</p><p style="{ST["pt"]}">{E(s["nxt"][1])}</p></div>')
    if n == blk["slides"][1]:
        o.append(f'<p style="{ST["sec"]}">✅ Checkpoint · Como saber que funcionou</p><div style="{ST["box"] % ("#22c55e", "#effbf2")}">'
                 f'<p style="{ST["en"]}">{E(blk["check"][0])}</p><p style="{ST["pt"]}">{E(blk["check"][1])}</p></div>')
    return "\n".join(o)

def patch_deck(text):
    parts = re.split(r'(<aside class="notes">.*?</aside>)', text, flags=re.S)
    idx = 0
    out = []
    for p in parts:
        if p.startswith('<aside class="notes">'):
            out.append('<aside class="notes">\n' + notes_html(idx) + '\n  </aside>'); idx += 1
        else:
            out.append(p)
    assert idx == len(SL), idx
    return "".join(out)

# ---------- rendering: guide ----------
def slug(h):
    from markdown.extensions.toc import slugify
    return slugify(h, "-")
def block_heading(bi):
    b = BLOCKS[bi]; return f'{bi} · {b["name"]} · {b["t"]}'

def guide_blocks():
    o = []
    for bi, b in enumerate(BLOCKS):
        a, z = b["slides"]
        o.append(f'## {block_heading(bi)}\n')
        o.append(f'### 🎯 Objetivo e janela\n')
        o.append(f'**Janela:** {b["t"]} (Brasília) = {b["et"]} ET · slides {a}{"" if a==z else "–"+str(z)} · **Meta:** {b["goal"][0]}\n')
        o.append(f'✂️ **Se atrasar, corte isto:** {b["cut"]}\n')
        o.append('### 🖱 HANDS-ON · passo a passo\n')
        k = 1
        for n in range(a, z + 1):
            s = SL[n - 1]
            o.append(f'**Slide {n} · {s["title"]} · {s["t"]}**' + (f' · {s["clicks"]} clique(s) no slide' if s["clicks"] else '') + '\n')
            if n in DEMO: o.append(f'🎬 **DEMO AO VIVO AGORA →** {DEMO[n][1]} {DEMO_BACK[1]}\n')
            for d in s["do"]:
                o.append(f'{k}. {d["pt"]}')
                if d["ok"]: o.append(f'   - ✅ **Esperado:** {d["ok"][1]}')
                if d["fail"]: o.append(f'   - ⚠️ **Se falhar:** {d["fail"][1]}')
                if d["prompt"] is not None:
                    o.append('')
                    o.append(f'   **Prompt para colar:**\n')
                    o.append('```\n' + PROMPTS[d["prompt"]] + '\n```')
                    o.append('')
                k += 1
            o.append('')
        o.append('### 🗣 SAY IT · fale em inglês\n')
        for n in range(a, z + 1):
            s = SL[n - 1]
            o.append(f'*Slide {n} · {s["title"]}*\n')
            for l in s["say"]:
                lines = [f'> "{l["en"]}"', f'> *{l["pt"]}*']
                if l["ph"]: lines.append(f'> 🔊 {l["ph"]}')
                o.append("  \n".join(lines) + '\n')
            if s["qa"]:
                o.append('**Perguntas prováveis**\n')
                for q in s["qa"]:
                    o.append(f'- **Q:** {q["qen"]} *({q["qpt"]})*  \n  **A:** {q["aen"]} *({q["apt"]})*')
                o.append('')
            o.append(f'✂️ **Se atrasar:** {s["cut"][0]} *({s["cut"][1]})*\n')
        last = SL[z - 1]
        # Transitions already flow within the spoken paragraphs. A missing
        # separate transition must not announce an early end to the workshop.
        if last["nxt"]:
            o.append('### ➡️ Transição\n')
            o.append(f'> "{last["nxt"][0]}"  \n> *{last["nxt"][1]}*\n')
        elif bi == len(BLOCKS) - 1:
            o.append('### ➡️ Encerramento\n')
            o.append('Fim da sessão.\n')
        o.append('### ✅ Checkpoint\n')
        o.append(f'{b["check"][1]}\n')
        o.append('---\n')
    return "\n".join(o)

def run_sheet():
    rows = ["| Brasília | ET | Slide | O que acontece (cliques e telas) | Tela compartilhada | Se atrasar |", "|---|---|---|---|---|---|"]
    rows.append("| 10:45 | 8:45 | 1 | Abrir deck (F), notas (S), abas prontas: GitHub, Grok Bot, instruções QA/DevOps, preview | Slide 1 | — |")
    shared = {3:"GitHub", 8:"Grok Bot", 9:"Grok Bot", 10:"Grok Bot → Deck", 14:"Grok Bot", 15:"Grok Bot / GitHub", 16:"Preview", 18:"GitHub", 19:"Formulário / dashboard / evidências; Grok Bot só se opcional"}
    acts = {1:"Boas-vindas", 2:"Agenda em 8 passos (1 clique)", 3:"Tour do repo: README → `mvp/` → `docs/inception.md` (3 cliques)", 4:"Arquitetura do MVP (5 cliques)",
        5:f"A regra: quem constrói não julga, nenhum bot faz merge ({SL[4]['clicks']} {'clique' if SL[4]['clicks'] == 1 else 'cliques'})", 6:"Fluxo do time (6 cliques)", 7:"Charter: owns · good output · stops (3 cliques)",
        8:"**Ao vivo:** criar FDE TypeScript, depois QA e DevOps, skills, grupo", 9:"**Ao vivo:** prompt de design para o FDE", 10:"Aprovar design (prompt FDE) e **prova do FDE**; \"Green CI is not acceptance\"",
        11:"Loop PR → verify → approve (5 cliques)", 12:"Regra de todo bot: **prove it works** (3 cliques)", 13:"Pirâmide de confiança: camadas baratas primeiro, revisão humana por último",
        14:"**Ao vivo:** prompt do QA, **prova do QA**, PASS/FAIL/WARN/BLOCKED", 15:"**Ao vivo:** prompt do DevOps e **prova do DevOps**, status do CI e preview",
        16:"**Ao vivo:** enviar feedback, ver a barra no dashboard", 17:"Quem decide sou eu: desfaz em 1 min × humano decide", 18:"**Ao vivo:** ler o PR (mudou, QA, CI) e fazer o merge",
        19:"**Recuperação:** concluir núcleo, testes e revisão humana ou declarar BLOCKED; rotina só se tudo estiver concluído", 20:"Recap: três frases (3 cliques)", 21:"Economizar uso", 22:"**OPCIONAL:** pstack (`/poteto-mode`, `/poteto-help`)", 23:"Perguntas e frase de encerramento (12:29)"}
    for n, s in enumerate(SL, 1):
        st = s["t"].split("–")[0]; h, m = map(int, st.split(":"))
        rows.append(f'| {st} | {h-2}:{m:02d} | {n} | {acts[n]} | {shared.get(n, "Deck")} | {s["cut"][1]} |')
    rows.append("| 12:30 | 10:30 | — | Fim | — | — |")
    return "\n".join(rows)

def toc():
    o = ["**Início rápido:** [Run sheet de uma página](#run-sheet-de-uma-pagina) · [Cola de pronúncia](#cola-de-pronuncia)\n", "**Blocos do workshop (cada um com objetivo, hands-on, fala, transição e checkpoint):**\n"]
    for bi, b in enumerate(BLOCKS):
        h = block_heading(bi)
        o.append(f'{bi+1}. [{h}](#{slug(h)}) · {"slide %d" % b["slides"][0] if b["slides"][0]==b["slides"][1] else "slides %d–%d" % b["slides"]}')
    o.append("\n**Antes do evento:** [Trilha e estado](#trilha-e-estado-da-preparacao) · [Como usar o deck](#como-usar-o-deck) · [Frases de emergência](#frases-de-emergencia) · [Checklist](#checklist-antes-do-evento) · [Charter de todo bot](#charter-de-todo-bot)\n")
    return "\n".join(o)

PRON_CHEAT = [("context","CÓN-tékst"),("deployment","di-PLÓI-ment"),("preview","PRÍ-viu"),("acceptance","ek-SÉP-tans"),("routine","ru-TIIN"),("schema","SKÍ-ma"),("merge","MÉRDJ"),
 ("Neon","NÍ-on"),("Drizzle","DRÍ-zol"),("Zod","ZÓD"),("Playwright","PLÊI-rait"),("Vercel","vêr-SÉL"),("Postgres","PÓST-gres"),("shadcn","CHÁD-si-ên"),("Next.js","NÉKST dê-êi-ES"),
 ("GitHub","GUÍT-hâb"),("evidence","É-vi-dens"),("approve","a-PRUUV"),("secret","SI-cret"),("redacted","ri-DÉC-tid"),("blocked","BLÓCT"),("coverage","CÂ-ve-ridj"),
 ("criteria","crai-TÍ-ri-a"),("branch","BRÉNTCH"),("pull request","PUL ri-QUÉST"),("triage","TRI-ajh"),("Linear","LÍ-ni-er"),("thank you","THÉNK iú")]
def pron_section():
    o = ["## Cola de pronúncia\n", "Apoio de ensaio, separado da fala contínua. Não leia esta tabela durante a apresentação. Aproximação em português para praticar em voz alta. A sílaba em MAIÚSCULAS é a mais forte. O som \"th\" é a língua entre os dentes.\n", "| Palavra | Como falar |", "|---|---|"]
    o += [f"| {w} | {p} |" for w, p in PRON_CHEAT]
    return "\n".join(o) + "\n"
def emergency_section():
    o = ["## Frases de emergência\n"]
    for l in EMERGENCY:
        o.append(f'> "{l["en"]}"  \n> *{l["pt"]}*  \n> 🔊 {l["ph"]}\n')
    return "\n".join(o)

def patch_guide(text):
    def rep(name, new):
        nonlocal text
        pat = re.compile(r'(<!-- BEGIN GENERATED:%s -->\n).*?(\n<!-- END GENERATED:%s -->)' % (name, name), re.S)
        assert pat.search(text), name
        text = pat.sub(lambda m: m.group(1) + new + m.group(2), text)
    rep("toc", toc()); rep("runsheet", run_sheet()); rep("emergency", emergency_section()); rep("blocks", guide_blocks()); rep("pron", pron_section())
    return text

def main():
    check = "--check" in sys.argv
    pairs = [(DECK, patch_deck), (GUIDE, patch_guide)]
    bad = False
    for path, fn in pairs:
        old = path.read_text(encoding="utf-8"); new = fn(old)
        if check:
            if old != new: print("OUT OF DATE:", path.relative_to(ROOT)); bad = True
        else:
            path.write_text(new, encoding="utf-8")
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()

