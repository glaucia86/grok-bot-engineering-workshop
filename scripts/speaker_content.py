"""Single source for the speaker talk track: deck notes (index.html) and guide blocks (guia-glaucia.md).

Usage:  python scripts/speaker_content.py          # rewrite generated parts
        python scripts/speaker_content.py --check  # fail if committed files are out of date
Say lines, cut lines, questions and transitions are shared, so deck and guide use identical wording.
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
        "Create the FDE from scratch, then QA and DevOps, (QA has four: playwright-best-practices, playwright-cli, create-verification-skill and interrogate), and put all three in one group with you. Every bot ends with principle-prove-it-works (final done-step, outside the limit)."),
  cut="não crie o DevOps ao vivo. Mostre só as instruções dele.",
  check=("Three bots exist and sit in one group chat with you. FDE and DevOps have three skills at most; QA has four (including interrogate). Every bot finishes with principle-prove-it-works.",
         "Os três bots existem e estão num grupo com você. FDE e DevOps têm no máximo três skills; o QA tem quatro (com a interrogate). Todo bot termina com a principle-prove-it-works.")),
 dict(name="Design", t="11:12–11:20", et="9:12–9:20", slides=(9, 9),
  goal=("Pedir um design ao FDE antes de qualquer código e decidir as dúvidas em aberto.",
        "Ask the FDE for a design before any code, and settle any open questions."),
  cut="não leia o design inteiro. Mostre só a lista de arquivos e de testes.",
  check=("The FDE answered with decisions, files to change, and tests. No code was written yet.",
         "O FDE respondeu com decisões, arquivos e testes. Nenhum código foi escrito ainda.")),
 dict(name="Verify", t="11:20–11:40", et="9:20–9:40", slides=(10, 13),
  goal=("Aprovar o design, deixar o FDE construir e fazer o QA julgar o PR pelos critérios do inception, não pelo texto do autor.",
        "Approve the design, let the FDE build, and let QA judge the PR by the inception criteria, not by the author's text."),
  cut="não espere o QA terminar todos os critérios. Mostre 2 ou 3 resultados e siga.",
  check=("Each bot ended its delivery with proof. QA named the tested commit and gave PASS, FAIL, WARN or BLOCKED per criterion, each with evidence.",
         "Cada bot terminou a entrega com prova. O QA citou o commit testado e deu PASS, FAIL, WARN ou BLOCKED por critério, cada um com evidência.")),
 dict(name="Background PR", t="11:40–11:55", et="9:40–9:55", slides=(14, 15),
  goal=("Mostrar que o trabalho roda na nuvem e provar o resultado: status do CI, preview e o gráfico mudando com um feedback real.",
        "Show that the work runs in the cloud and prove the result: CI status, preview, and the chart moving with real feedback."),
  cut="pule o pedido de status ao DevOps e abra a preview direto pelo PR.",
  check=("The preview opened. One feedback you sent shows up as a bar in the dashboard.",
         "A preview abriu. Um feedback que você enviou aparece como barra no dashboard.")),
 dict(name="Approval", t="11:55–12:10", et="9:55–10:10", slides=(16, 17),
  goal=("Ler as três evidências (o que mudou, relatório do QA, CI) e decidir o merge você mesma, no destino de exercício.",
        "Read the three pieces of evidence (what changed, QA report, CI) and make the merge decision yourself, on the exercise target."),
  cut="se vier FAIL, não corrija ao vivo. Mostre o FAIL como exemplo e diga que a correção fica para depois.",
  check=("You said the decision out loud. With all required criteria PASS and WARN reviewed, you merged on the exercise target. With FAIL or BLOCKED, you did not call the MVP accepted.",
         "Você disse a decisão em voz alta. Com todos os critérios obrigatórios em PASS e os WARN avaliados, você fez o merge no destino do exercício. Com FAIL ou BLOCKED, você não apresentou o MVP como aceito.")),
 dict(name="Routine", t="12:10–12:22", et="10:10–10:22", slides=(18, 18),
  goal=("Mostrar um bot com rotina: um rascunho desativado e uma preview offline. Nada é ativado ou agendado.",
        "Show a bot with a routine: a disabled draft and an offline preview. Nothing is enabled or scheduled."),
  cut="mostre apenas o rascunho desativado e a preview offline. Não ative a rotina.",
  check=("The draft is saved as disabled (or kept in the document) and the offline preview ran. Nothing was scheduled.",
         "O rascunho está desativado (ou mantido no documento) e a preview offline rodou. Nada foi agendado.")),
 dict(name="Q&A", t="12:22–12:30", et="10:22–10:30", slides=(19, 22),
  goal=("Recapitular em três frases, abrir perguntas e encerrar às 12:30.",
        "Recap in three sentences, open questions, and finish at 12:30."),
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
 say=[S("Welcome, everyone! I am Glaucia.", "Bem-vindos, pessoal! Eu sou a Glaucia.", "welcome → UÉL-cam; everyone → É-vri-uân"),
      S("Today we build a real app with a team of bots.", "Hoje vamos construir um app de verdade com um time de bots.", "build → BÍLD; real → RÍ-ol; team → TIIM; bots → BÓTS"),
      S("The database and the API are ready. You will see the rest live.", "O banco e a API já estão prontos. O resto vocês vão ver ao vivo.", "database → DÊI-ta-bêis; API → êi-pi-ÁI; live → LÁIV (rima com five)")],
 cut=("Do not introduce yourself for long. Your name is on the slide.", "Não se apresente por muito tempo. Seu nome está no slide."),
 qa=[], nxt=("Here is the plan for the next 90 minutes.", "Aqui está o plano dos próximos 90 minutos."))

slide(title="The plan", t="11:01–11:02", m=1, clicks=1,
 do=[D("Press the right arrow once. The four bot faces move to the top corner.", "Aperte a seta para a direita uma vez. As quatro carinhas dos bots sobem para o canto.",
       ok=("The agenda shows 8 tiles in two rows.", "A agenda mostra 8 blocos em duas linhas.")),
     D("Move your finger along the tiles, left to right. Do not read each tile.", "Passe o dedo pelos blocos, da esquerda para a direita. Não leia cada bloco."),
     D("Click once: the last line appears (you only build the form and the dashboard).", "Clique uma vez: a última linha aparece (vocês só constroem o formulário e o dashboard).")],
 say=[S("We have eight steps in 90 minutes.", "Temos oito passos em 90 minutos.", "eight → ÊIT; minutes → MÍ-nits"),
      S("We start with an empty chat. We end with a merged pull request.", "Começamos com um chat vazio. Terminamos com um pull request com merge feito.", "empty → ÉMP-ti; pull request → PUL ri-QUÉST; merged → MÉRDJD"),
      S("You build only two things: the form and the dashboard.", "Vocês constroem só duas coisas: o formulário e o dashboard.", "form → FÓRM; dashboard → DÉSH-bord"),
      S("Questions are welcome at the end.", "Perguntas são bem-vindas no final.", "questions → QUÉS-tchons")],
 cut=("Skip this slide. Press the right arrow.", "Pule este slide. Aperte a seta para a direita."),
 qa=[Q("Will the recording be available?", "I do not have the details yet. Please ask the Packt team in the chat.",
       "A gravação vai ficar disponível?", "Ainda não tenho os detalhes. Pergunte ao time da Packt no chat.")],
 nxt=("First, let me show you the repo.", "Primeiro, vou mostrar o repositório."))

slide(title="The repo", t="11:02–11:03", m=1, clicks=3,
 do=[D("Click three times: README card, mvp card, inception card. Say one short sentence for each click.", "Clique três vezes: cartão README, cartão mvp, cartão inception. Diga uma frase curta a cada clique."),
     D("Alt+Tab to GitHub. Show in this order: README.md, then the mvp/ folder on the frozen branch checkpoint/mvp-base, then docs/inception.md (scroll to section 5). Go back to the deck.",
       "Alt+Tab para o GitHub. Mostre nesta ordem: README.md, depois a pasta mvp/ na branch congelada checkpoint/mvp-base, depois docs/inception.md (role até a seção 5). Volte ao deck.",
       ok=("You can see API, schema, migration and tests in mvp/. Say what exists; do not say the infrastructure is ready until the issue #16 evidence is checked.", "Você vê API, schema, migration e testes em mvp/. Diga o que existe; só diga que a infraestrutura está pronta depois de conferir a evidência da issue #16."),
       fail=("If GitHub is slow or the branch is missing, stay on the deck and say: 'The repo link is in the guide.' Do not use main as a replacement for the checkpoint.", "Se o GitHub estiver lento ou a branch sumir, fique no deck e diga: 'O link do repositório está no guia.' Não use a main no lugar do checkpoint."))],
 say=[S("This repo has two tracks: a complete reference and an exercise.", "Este repositório tem duas trilhas: uma referência completa e um exercício.", "repo → RÍ-pou; track → TRÉK; reference → RÉ-fe-rens; exercise → ÉK-ser-saiz"),
      S("The README is the map. The mvp folder is the app. The inception file has the goal and the acceptance criteria.", "O README é o mapa. A pasta mvp é o app. O arquivo inception tem o objetivo e os critérios de aceite.", "map → MÉP; goal → GÓUL; acceptance → ek-SÉP-tans; criteria → crai-TÍ-ri-a"),
      S("In this session, we build the form and the dashboard.", "Nesta sessão, construímos o formulário e o dashboard.")],
 cut=("Skip the README. Show only the mvp folder.", "Pule o README. Mostre só a pasta mvp."),
 qa=[Q("Can I get the repo?", "Access is given by the instructor. Please ask in the chat.", "Posso ter acesso ao repositório?", "O acesso é dado pela instrutora. Pergunte no chat."),
     Q("Why two tracks?", "The reference stays clean. The exercise has gaps on purpose, so we can build them live.", "Por que duas trilhas?", "A referência fica limpa. O exercício tem lacunas de propósito, para construirmos ao vivo.")],
 nxt=("Now let us see how the pieces fit together.", "Agora vamos ver como as peças se encaixam."))

slide(title="MVP architecture", t="11:03–11:04", m=1, clicks=5,
 do=[D("Click 1: browser and Next.js UI. Click 2: API route. Click 3: Drizzle and the Neon database (plus the lock note). Click 4: GitHub PR to GitHub Actions. Click 5: Vercel preview.",
       "Clique 1: navegador e interface Next.js. Clique 2: rota da API. Clique 3: Drizzle e o banco Neon (mais a nota do cadeado). Clique 4: PR do GitHub para o GitHub Actions. Clique 5: preview da Vercel.",
       ok=("All 8 boxes and arrows are on screen after 5 clicks.", "Todas as 8 caixas e setas estão na tela após 5 cliques.")),
     D("Do not explain each tool. One short sentence per click, about 10 seconds each.", "Não explique cada ferramenta. Uma frase curta por clique, cerca de 10 segundos cada.")],
 say=[S("This is one repo and one deploy, with real data.", "É um repositório, um deploy, com dados reais.", "deploy → di-PLÓI"),
      S("The browser talks to Next.js. Next.js has an API route.", "O navegador fala com o Next.js. O Next.js tem uma rota de API.", "Next.js → NÉKST dê-êi-ES; route → RÁUT"),
      S("The API uses Drizzle to save data in a Neon Postgres database.", "A API usa o Drizzle para salvar dados num banco Neon Postgres.", "Drizzle → DRÍ-zol; Neon → NI-on; Postgres → PÓST-gres"),
      S("The database secret lives only in Vercel and GitHub settings.", "O segredo do banco fica só nas configurações da Vercel e do GitHub.", "secret → SI-cret; Vercel → vêr-SÉL; GitHub → GUÍT-hâb"),
      S("Every pull request gets a preview link.", "Cada pull request ganha um link de preview.", "preview → PRÍ-viu; link → LÍNK")],
 cut=("Show only the top row. Fifteen seconds.", "Mostre só a linha de cima. Quinze segundos."),
 qa=[Q("Why Neon and not another database?", "It is serverless Postgres and it is fast to set up. Any Postgres would work.", "Por que Neon e não outro banco?", "É Postgres serverless e rápido de configurar. Qualquer Postgres serviria."),
     Q("Where is the secret stored?", "Only in Vercel and in GitHub secrets. Never in a file or in the chat.", "Onde fica o segredo?", "Só na Vercel e nos secrets do GitHub. Nunca em arquivo nem no chat.")],
 nxt=("Now, the one rule you should remember.", "Agora, a regra que vocês devem lembrar."))

slide(title="The one rule", t="11:04–11:05", m=1, clicks=1,
 do=[D("Stop. Speak slowly. Click once to show the second line (No bot merges. I do.).", "Pare. Fale devagar. Clique uma vez para mostrar a segunda linha (Nenhum bot faz merge. Eu faço).",
       ok=("Both lines are on screen. Wait three seconds in silence.", "As duas linhas estão na tela. Espere três segundos em silêncio."))],
 say=[S("One rule. The bot that builds does not judge.", "Uma regra. O bot que constrói não julga.", "rule → RÚUL; builds → BÍLDS; judge → DJÂDJ"),
      S("And no bot merges. I do.", "E nenhum bot faz merge. Quem faz sou eu.", "merges → MÉR-djis")],
 cut=("This slide is never cut. It is the one people remember.", "Este slide nunca é cortado. É o que as pessoas vão lembrar."),
 qa=[Q("Can a bot merge if I allow it?", "You can, but in this workshop we do not. A merge changes the real world, so a person decides.",
       "Um bot pode fazer merge se eu permitir?", "Pode, mas neste workshop não fazemos. O merge muda o mundo real, então uma pessoa decide.")],
 check_block=True, nxt=("Now, let us create our first bot.", "Agora, vamos criar nosso primeiro bot."))

slide(title="The team flow", t="11:05–11:06", m=1, clicks=6,
 do=[D("Click 6 times. 1: you and the group chat. 2: FDE TypeScript (blue square). 3: QA bot (pink drop). 4: DevOps (orange cloud). 5: PR with evidence. 6: the red line, I approve and merge.",
       "Clique 6 vezes. 1: você e o chat do grupo. 2: FDE TypeScript (quadrado azul). 3: QA bot (gota rosa). 4: DevOps (nuvem laranja). 5: PR com evidências. 6: a linha vermelha, eu aprovo e faço o merge.",
       ok=("The full diagram shows with the red loop back to you.", "O diagrama completo aparece com a linha vermelha voltando para você."))],
 say=[S("I am the tech lead. The bots are my team.", "Eu sou a tech lead. Os bots são o meu time.", "lead → LÍID; team → TIIM"),
      S("I ask in one group chat. Each bot takes its part.", "Eu peço num chat de grupo. Cada bot pega a sua parte.", "group → GRUUP; part → PÁRT"),
      S("The FDE builds. QA verifies. DevOps handles CI and the preview.", "O FDE constrói. O QA verifica. O DevOps cuida do CI e da preview.", "builds → BÍLDS; verifies → VÉ-ri-fais; CI → SI-ÁI"),
      S("Everything comes back as evidence in the pull request. Then I approve.", "Tudo volta como evidência no pull request. Depois eu aprovo.", "evidence → É-vi-dens; approve → a-PRUUV")],
 cut=("Twenty seconds. Click quickly and say only the first and last sentence.", "Vinte segundos. Clique rápido e diga só a primeira e a última frase."),
 qa=[Q("Do the bots talk to each other?", "They share one group chat, so they can read each other's work. I stay in control.", "Os bots conversam entre si?", "Eles compartilham um chat de grupo, então leem o trabalho um do outro. Eu continuo no controle.")],
 nxt=("Every bot has a short charter. Let us see it.", "Todo bot tem um charter curto. Vamos ver."))

slide(title="Every bot has a charter", t="11:06–11:07", m=1, clicks=3,
 do=[D("Click 3 times: FDE card, QA card, DevOps card. For each: read only Owns, Good output, Stops.", "Clique 3 vezes: cartão do FDE, do QA, do DevOps. Em cada um, leia só Owns, Good output, Stops."),
     D("Point to the colors: each bot has its own color and shape.", "Aponte para as cores: cada bot tem sua própria cor e formato.")],
 say=[S("A bot needs three things: what it owns, what good output looks like, and where it stops.", "Um bot precisa de três coisas: do que é dono, como é uma boa entrega e onde ele para.", "owns → ÓUNS; output → ÁUT-put; stops → STÓPS"),
      S("The FDE owns the code and the pull request. It never merges.", "O FDE é dono do código e do pull request. Ele nunca faz merge.", "owns → ÓUNS"),
      S("QA judges the pull request. DevOps owns CI and the preview. Neither merges.", "O QA julga o pull request. O DevOps cuida do CI e da preview. Nenhum faz merge.")],
 cut=("Read only the yellow idea: owns, good output, stops.", "Leia só a ideia principal: owns, good output, stops."),
 qa=[Q("Why three parts?", "It is short, and each part can be checked. If it is too long, the bot gets confused.", "Por que três partes?", "É curto e cada parte pode ser conferida. Se for longo demais, o bot se confunde.")],
 nxt=("Now let us create the first bot, live.", "Agora vamos criar o primeiro bot, ao vivo."))

slide(title="Live: create the FDE", t="11:07–11:12", m=5, clicks=2, live=True,
 do=[D("Alt+Tab to Grok Bot. Click the button to create a bot (exact path: confirm in rehearsal). Name: FDE TypeScript.", "Alt+Tab para o Grok Bot. Clique no botão de criar bot (caminho exato: conferir no ensaio). Nome: FDE TypeScript.",
       ok=("A new empty bot page opens.", "Abre uma página de bot novo e vazia."),
       fail=("If you cannot find the button, show this slide and say: 'I prepared this bot before.' Then paste the same text.", "Se não achar o botão, mostre este slide e diga: 'Eu preparei este bot antes.' Depois cole o mesmo texto.")),
     D("Paste the FDE prompt (below). Then add the 3 skills: shadcn, vercel-react-best-practices, neon-drizzle. Where skills live in the app: confirm in rehearsal.",
       "Cole o prompt do FDE (abaixo). Depois adicione as 3 skills: shadcn, vercel-react-best-practices, neon-drizzle. Onde ficam as skills no app: conferir no ensaio.", prompt=0,
       ok=("The bot shows its instructions and exactly 3 skills.", "O bot mostra as instruções e exatamente 3 skills.")),
     D("Create QA bot and DevOps by pasting the instructions from section 4 of docs/inception.md (open in a tab). Check against this guide: WARN only for coverage. QA: playwright-best-practices, playwright-cli, create-verification-skill, plus pstack interrogate (four skills in total; QA is the one exception to the three-skill limit, because interrogate is part of pstack). principle-prove-it-works is the final done-step for every bot and is not counted. DevOps: deploy-to-vercel, ci-cd-and-automation.",
       "Crie o QA bot e o DevOps colando as instruções da seção 4 do docs/inception.md (aberto numa aba). Confira com este guia: WARN só para cobertura. QA: playwright-best-practices, playwright-cli, create-verification-skill, mais a interrogate do pstack (quatro no total; o QA é a única exceção ao limite de três skills, porque a interrogate faz parte do pstack). A principle-prove-it-works é o passo final de todo bot e não conta no limite. DevOps: deploy-to-vercel, ci-cd-and-automation.",
       fail=("QA has four skills on purpose: interrogate stays. The FDE and DevOps have three at most. principle-prove-it-works is the final step for all, not counted.", "O QA tem quatro skills de propósito: a interrogate fica. O FDE e o DevOps têm no máximo três. A principle-prove-it-works é o passo final de todos e não conta.")),
     D("Create the group 'Workshop - Packt Grok Bot' with you and the three bots (how to create a group: confirm in rehearsal). Go back to the deck around 11:11.",
       "Crie o grupo 'Workshop - Packt Grok Bot' com você e os três bots (como criar grupo: conferir no ensaio). Volte ao deck por volta das 11:11.",
       ok=("The group shows 4 members: you plus 3 bots.", "O grupo mostra 4 membros: você e 3 bots."))],
 say=[S("I create the FDE from scratch. I paste the role and add three skills.", "Eu crio o FDE do zero. Colo o papel e adiciono três skills.", "scratch → SCRÉTCH; paste → PÊIST; skills → SCÍLS"),
      S("For QA and DevOps, I just paste the instructions.", "Para o QA e o DevOps, eu só colo as instruções.", "instructions → in-STRÂK-shons"),
      S("Three skills max. Less context, better bot.", "No máximo três skills. Menos contexto, bot melhor.", "max → MÉKS; context → CÓN-tékst; better → BÉ-ter"),
      S("QA has four skills, including interrogate from pstack. Every bot also ends with principle-prove-it-works.", "O QA tem quatro skills, incluindo a interrogate do pstack. Todo bot também termina com a principle-prove-it-works.", "interrogate → in-TÉ-ro-gueit; pstack → PÍ-stak"),
      S("While the bot works, let me explain.", "Enquanto o bot trabalha, deixa eu explicar.", "explain → ex-PLÊIN")],
 cut=("Do not create DevOps live. Show only its instructions.", "Não crie o DevOps ao vivo. Mostre só as instruções dele."),
 qa=[Q("What is a skill?", "A skill is a small pack of know-how a bot can load. We keep it to three so the context stays small.", "O que é uma skill?", "Uma skill é um pacote pequeno de conhecimento que o bot pode carregar. Limitamos a três para o contexto ficar pequeno."),
     Q("Why does QA have four skills?", "It is the one exception. interrogate is part of pstack, and it helps QA challenge a result from many angles. principle-prove-it-works is separate: the final done-step for every bot.", "Por que o QA tem quatro skills?", "É a única exceção. A interrogate faz parte do pstack e ajuda o QA a questionar um resultado de vários ângulos. A principle-prove-it-works é à parte: o passo final de todo bot."),
     Q("Can one bot do all roles?", "It can, but it is worse. One role per bot keeps the work clear and checkable.", "Um bot só não faz todos os papéis?", "Faz, mas fica pior. Um papel por bot deixa o trabalho claro e fácil de conferir.")],
 nxt=("Our team is ready. Let us ask for a design.", "Nosso time está pronto. Vamos pedir um design."))

slide(title="Block 2: Design", t="11:12–11:20", m=8, clicks=1, live=True,
 do=[D("Open a NEW chat with FDE TypeScript (one chat per task). Paste the design prompt (below). Click once on the slide to show the checklist.", "Abra um chat NOVO com o FDE TypeScript (um chat por tarefa). Cole o prompt de design (abaixo). Clique uma vez no slide para mostrar a lista.", prompt=1,
       ok=("The bot starts working. While it works, read the checklist on the slide.", "O bot começa a trabalhar. Enquanto trabalha, leia a lista no slide."),
       fail=("If it takes more than 2 minutes, say 'Let's give it a few seconds.' and keep explaining the checklist.", "Se demorar mais de 2 minutos, diga 'Let's give it a few seconds.' e continue explicando a lista.")),
     D("When the answer arrives, show three parts: decisions, files, tests.", "Quando a resposta chegar, mostre três partes: decisões, arquivos, testes.",
       ok=("You can point to: decisions, a file list, a test list, and a separate list of assumptions.", "Você consegue apontar: decisões, lista de arquivos, lista de testes e uma lista separada de suposições.")),
     D("If something is open, decide it yourself and write the decision in the chat, in one sentence.", "Se algo ficou em aberto, decida você e escreva a decisão no chat, em uma frase.")],
 say=[S("No code yet. First, a design.", "Ainda sem código. Primeiro, um design.", "code → CÓUD; design → di-ZÁIN"),
      S("A mistake in the design is cheap to fix. In the code, it is expensive.", "Um erro no design é barato de corrigir. No código, é caro.", "mistake → mis-TÊIK; cheap → TCHÍIP; expensive → ex-PÉN-siv"),
      S("It lists files and tests. So we can check it.", "Ele lista arquivos e testes. Assim conseguimos conferir.", "files → FÁILS; tests → TÉSTS; check → TCHÉK"),
      S("I decide the open questions. The bot waits for me.", "Eu decido as dúvidas em aberto. O bot espera por mim.", "decide → di-SÁID; waits → UÊITS")],
 cut=("Do not read the whole design. Show only the file list and the test list.", "Não leia o design inteiro. Mostre só a lista de arquivos e a lista de testes."),
 qa=[Q("Why not let the bot just code?", "The design becomes the ruler for QA. If we skip it, nobody can say what correct means.", "Por que não deixar o bot só programar?", "O design vira a régua do QA. Sem ele, ninguém sabe dizer o que é correto.")],
 nxt=("The design looks good. Let us build and verify.", "O design está bom. Vamos construir e verificar."))

slide(title="Block 3: Verify", t="11:20–11:23", m=3, clicks=1, live=True,
 do=[D("Alt+Tab to the FDE chat. Paste the design approval prompt (below). Go back to the deck while it works.", "Alt+Tab para o chat do FDE. Cole o prompt de aprovação do design (abaixo). Volte ao deck enquanto ele trabalha.", prompt=2,
       ok=("The FDE confirms it will use a new branch and will not merge.", "O FDE confirma que vai usar uma branch nova e que não fará merge."),
       fail=("If the FDE asks which repo or branch to target, stop and answer with the instructor-approved exercise target. Never the reference main.", "Se o FDE perguntar qual repositório ou branch usar, pare e responda com o destino do exercício aprovado pela instrutora. Nunca a main de referência.")),
     D("When the FDE says it is done, paste the prove-it-works prompt (below). Rule for every bot: no bot says done without proof from the real artifact.", "Quando o FDE disser que terminou, cole o prompt de prova (abaixo). Regra para todo bot: nenhum bot diz 'pronto' sem prova do artefato real.", prompt=3,
       ok=("The FDE runs the real feature, reads the saved value back, and pastes a command and its output.", "O FDE roda a funcionalidade real, lê o valor salvo de volta e cola um comando e a saída."),
       fail=("If the FDE only says 'it compiles' or 'tests pass' without output, ask again: 'Show me the real value.'", "Se o FDE só disser 'compila' ou 'testes passam' sem saída, peça de novo: 'Show me the real value.'")),
     D("Click once on the slide to show the line about QA. The four status pills (PASS, FAIL, WARN, BLOCKED) are already visible. Press the right arrow again to go on: the pills move to the top.", "Clique uma vez no slide para mostrar a linha sobre o QA. As quatro etiquetas (PASS, FAIL, WARN, BLOCKED) já estão visíveis. Aperte a seta de novo para seguir: as etiquetas sobem para o topo.")],
 say=[S("Green CI is not acceptance.", "CI verde não é aceite.", "green → GRIIN; CI → SI-ÁI; acceptance → ek-SÉP-tans"),
      S("QA checks the rules we wrote before the code.", "O QA confere as regras que escrevemos antes do código.", "rules → RÚULS; wrote → RÓUT"),
      S("It gives PASS, FAIL, WARN, or BLOCKED. WARN is only for coverage gaps.", "Ele dá PASS, FAIL, WARN ou BLOCKED. WARN é só para lacunas de cobertura.", "pass → PÉSS; fail → FÊIL; warn → UÓRN; blocked → BLÓCT; coverage → CÂ-ve-ridj")],
 cut=("Paste the prompt and go straight to the next slide.", "Cole o prompt e vá direto para o próximo slide."),
 qa=[Q("Why a separate QA bot?", "The one who did the work tends to think it is right. A separate bot reads only the spec.", "Por que um bot de QA separado?", "Quem fez o trabalho tende a achar que está certo. Um bot separado lê só a especificação.")],
 nxt=("Let us look at the loop we will repeat.", "Vamos ver o ciclo que vamos repetir."))

slide(title="The loop", t="11:23–11:25", m=2, clicks=5,
 do=[D("Click 5 times. 1: FDE builds. 2: pull request, CI and preview. 3: QA tests the commit. 4: all PASS? yes, I approve and merge. 5: FAIL goes back to the FDE, and BLOCKED is not a pass.",
       "Clique 5 vezes. 1: o FDE constrói. 2: pull request, CI e preview. 3: o QA testa o commit. 4: tudo PASS? sim, eu aprovo e faço o merge. 5: FAIL volta para o FDE, e BLOCKED não é aprovação.",
       ok=("The loop is complete. The red arrow goes back to the FDE.", "O ciclo está completo. A seta vermelha volta para o FDE."))],
 say=[S("This loop repeats in all bot work.", "Este ciclo se repete em todo trabalho com bots.", "loop → LUUP; repeats → ri-PÍITS"),
      S("The FDE opens the pull request. CI and the preview run. QA judges.", "O FDE abre o pull request. O CI e a preview rodam. O QA julga.", "opens → ÓU-pens; judges → DJÂ-djis"),
      S("If it fails, we fix only that. If QA cannot check it, it says BLOCKED.", "Se falhar, corrigimos só aquilo. Se o QA não consegue conferir, ele diz BLOCKED.", "fix → FÍKS; only → ÓUN-li; blocked → BLÓCT")],
 cut=("Thirty seconds. Click fast and say only the last sentence.", "Trinta segundos. Clique rápido e diga só a última frase."),
 qa=[Q("What does BLOCKED mean?", "It means QA is missing access or evidence. It is an honest answer, not a pass.", "O que significa BLOCKED?", "Significa que falta acesso ou evidência ao QA. É uma resposta honesta, não uma aprovação.")],
 nxt=("Now let us watch QA work, live.", "Agora vamos ver o QA trabalhar, ao vivo."))

slide(title="Prove it works", t="11:25–11:27", m=2, clicks=3,
 do=[D("Click three times: check the real artifact, not a proxy, script it. Then say the rule out loud.", "Clique três vezes: conferir o artefato real, não um proxy, e transformar em script. Depois diga a regra em voz alta.",
       ok=("The three cards are on screen with the bot faces and the pstack credit.", "Os três cartões estão na tela, com as carinhas dos bots e o crédito ao pstack.")),
     D("Point to the examples: 'it compiles', a self-report, a cached screenshot are proxies. A value you read from the running app is the real thing.", "Aponte os exemplos: 'compila', um auto-relato e um print antigo são proxies. Um valor que você lê do app rodando é a coisa real.")],
 say=[S("One more rule for every bot: no bot says done without proof.", "Mais uma regra para todo bot: nenhum bot diz 'pronto' sem prova.", "proof → PRÚUF; done → DÂN"),
      S("Check the real artifact. Run the feature. Read the real value.", "Confira o artefato real. Rode a funcionalidade. Leia o valor real.", "artifact → Á-ti-fékt; value → VÉ-liu"),
      S("Not a proxy: not 'it compiles', not a self-report, not an old screenshot.", "Não um proxy: nem 'compila', nem um auto-relato, nem um print antigo.", "proxy → PRÓK-si; compiles → com-PÁILS"),
      S("Script the check, so anyone can run it again. And keep the output visible.", "Faça um script da verificação, para qualquer pessoa rodar de novo. E deixe a saída visível.", "script → SCRÍPT; anyone → É-ni-uân; visible → VÍ-zi-bol")],
 cut=("Say only the rule and the last sentence. Thirty seconds.", "Diga só a regra e a última frase. Trinta segundos."),
 qa=[Q("Is this a skill or a rule?", "It is a pstack principle, a short skill. Each bot applies it at the end of its work.", "Isto é uma skill ou uma regra?", "É um princípio do pstack, uma skill curta. Cada bot aplica no fim do trabalho."),
     Q("Why not trust the bot when it says it works?", "A bot can be sure and wrong. Reading the real value costs little. A wrong guess costs much more.", "Por que não confiar quando o bot diz que funciona?", "Um bot pode estar convicto e errado. Ler o valor real custa pouco. Um palpite errado custa muito mais.")],
 nxt=("Now let us watch QA prove it, live.", "Agora vamos ver o QA provar, ao vivo."))

slide(title="Live: QA judges", t="11:27–11:40", m=13, clicks=3, live=True,
 do=[D("Alt+Tab to the QA bot chat (or the group). Paste the QA prompt (below).", "Alt+Tab para o chat do QA bot (ou o grupo). Cole o prompt do QA (abaixo).", prompt=4,
       ok=("QA lists the section 5 criteria from the inception (1–10 today) and generates a project-local verification skill that drives the preview and captures evidence. It does not use the PR text.", "O QA lista os critérios da seção 5 do inception (1–10 hoje) e gera uma skill de verificação local do projeto, que dirige a preview e captura evidência. Ele não usa o texto do PR."),
       fail=("If QA says BLOCKED, read why. Missing access, isolation or evidence is a valid answer: explain it. Do not hide it.", "Se o QA disser BLOCKED, leia o motivo. Falta de acesso, isolamento ou evidência é uma resposta válida: explique. Não esconda.")),
     D("When QA has its verdict, paste the QA prove-it-works prompt (below). QA must re-check every PASS on the real preview and quote what it observes now.", "Quando o QA tiver o veredito, cole o prompt de prova do QA (abaixo). O QA deve conferir de novo cada PASS na preview real e citar o que observa agora.", prompt=5,
       fail=("If QA cannot show a result, it must say BLOCKED. Do not accept 'it should pass'.", "Se o QA não conseguir mostrar um resultado, ele deve dizer BLOCKED. Não aceite 'deve passar'.")),
     D("Click three times on this slide (it is an illustrative mock, not real results): PASS line, FAIL line, BLOCKED line.", "Clique três vezes neste slide (é um mock ilustrativo, não resultados reais): linha PASS, linha FAIL, linha BLOCKED."),
     D("When the PR is ready, show the tested commit and PASS, FAIL, WARN or BLOCKED for each criterion. Say these are real results from your Grok Bot.", "Quando o PR estiver pronto, mostre o commit testado e PASS, FAIL, WARN ou BLOCKED de cada critério. Diga que estes são os resultados reais do seu Grok Bot.",
       ok=("QA names a commit and gives evidence (command, URL, output) per criterion.", "O QA cita um commit e dá evidência (comando, URL, saída) por critério.")),
     D("Backup plan if the live demo breaks: show the verified reference app if it is reachable. If it is not, explain the block and show only retained evidence. A recording is optional and must be labeled as pre-recorded.",
       "Plano B se a demo ao vivo quebrar: mostre a aplicação de referência verificada, se estiver acessível. Se não estiver, explique o bloqueio e mostre só evidência retida. Gravação é opcional e deve ser identificada como pré-gravada.")],
 say=[S("QA uses the merged rules, not the author's description.", "O QA usa as regras já aprovadas, não a descrição do autor.", "author's → Ó-thors"),
      S("QA builds a small verification skill. It drives the real app like a user and takes evidence.", "O QA monta uma pequena skill de verificação. Ela usa o app real como um usuário e coleta evidência.", "verification → vé-ri-fi-KÊI-shon; drives → DRÁIVS"),
      S("It says which commit it tested and shows its evidence.", "Ele diz qual commit testou e mostra a evidência.", "commit → co-MÍT; tested → TÉS-tid"),
      S("If QA can't check it, it says BLOCKED.", "Se o QA não consegue conferir, ele diz BLOCKED.", "blocked → BLÓCT"),
      S("Let's give it a few seconds. This is live, so things can be slow.", "Vamos dar alguns segundos. É ao vivo, então pode demorar.", "seconds → SÉ-kons; slow → SLÓU"),
      S("This exercise is blocked. Let me show the verified reference app.", "Este exercício está bloqueado. Vou mostrar a aplicação de referência verificada.", "verified → VÉ-ri-faid")],
 cut=("Do not wait for all criteria. Show two or three results and move on.", "Não espere todos os critérios. Mostre 2 ou 3 resultados e siga."),
 qa=[Q("How do you know QA is right?", "It must show evidence for each result: a command, a URL, an output. If it cannot, it says BLOCKED.", "Como saber que o QA está certo?", "Ele precisa mostrar evidência em cada resultado: comando, URL, saída. Se não puder, diz BLOCKED."),
     Q("Is this chat real?", "The slide is a mock, marked on screen. The chat in Grok Bot is real.", "Este chat é real?", "O slide é um mock, marcado na tela. O chat no Grok Bot é real.")],
 nxt=("The work runs in the background. Let us see the PR.", "O trabalho roda em segundo plano. Vamos ver o PR."))

slide(title="Background PR", t="11:40–11:47", m=7, clicks=1, live=True,
 do=[D("Say that the work runs in the cloud. Click once to show the DevOps card (mock).", "Diga que o trabalho roda na nuvem. Clique uma vez para mostrar o cartão do DevOps (mock)."),
     D("Paste the DevOps prompt (below) in the DevOps chat.", "Cole o prompt do DevOps (abaixo) no chat do DevOps.", prompt=6,
       ok=("DevOps gives the CI link, the preview URL, and says the secrets are present (redacted).", "O DevOps dá o link do CI, a preview URL e diz que os segredos estão presentes (redacted)."),
       fail=("If a secret value appears on screen: stop sharing the screen and pause the demo. Never read it out loud. An authorized operator must revoke or rotate it now, before you resume.", "Se algum valor de segredo aparecer na tela: pare de compartilhar a tela e pause a demonstração. Nunca leia em voz alta. Um operador autorizado deve revogar ou rotacionar a credencial agora, antes de retomar.")),
     D("Paste the DevOps prove-it-works prompt (below): it must open the real run and the real preview and report what it sees now.", "Cole o prompt de prova do DevOps (abaixo): ele deve abrir a execução real e a preview real e informar o que vê agora.", prompt=7,
       ok=("DevOps pastes one command (for example a curl status check) and its output. No secret value appears.", "O DevOps cola um comando (por exemplo um curl de status) e a saída. Nenhum valor de segredo aparece.")),
     D("Open the PR page: show the Actions check and the Vercel preview link. Put your real rehearsal screenshot in the dashed box before the event.", "Abra a página do PR: mostre o check do Actions e o link da preview da Vercel. Coloque seu print real do ensaio na caixa tracejada antes do evento.")],
 say=[S("This runs in the cloud, not on my laptop.", "Isso roda na nuvem, não no meu notebook.", "cloud → CLÁUD; laptop → LÉP-tóp"),
      S("The pull request is the meeting point: code, tests, CI, and preview.", "O pull request é o ponto de encontro: código, testes, CI e preview.", "meeting → MÍI-tin; point → PÓINT"),
      S("Every PR gets a preview link.", "Cada PR ganha um link de preview.", "preview → PRÍ-viu"),
      S("Before DevOps says ready, it must prove it. It opens the real preview.", "Antes de dizer que está pronto, o DevOps precisa provar. Ele abre a preview real.", "prove → PRÚUV; ready → RÉ-di"),
      S("DevOps checks secrets by presence only. It never shows them.", "O DevOps confere os segredos só pela presença. Nunca os mostra.", "presence → PRÉ-zens; secrets → SI-crets")],
 cut=("Skip the status request to DevOps and open the preview from the PR.", "Pule o pedido de status ao DevOps e abra a preview pelo PR."),
 qa=[Q("What if a secret or credential appears on screen?", "I stop sharing the screen and pause the demo. An authorized operator revokes or rotates the credential immediately, in the provider's secure settings, before we resume. Switching windows does not invalidate an exposed credential, and waiting until the session ends leaves it usable.", "E se um segredo ou credencial aparecer na tela?", "Paro de compartilhar a tela e pauso a demonstração. Um operador autorizado revoga ou rotaciona a credencial imediatamente, nas configurações seguras do provedor, antes de retomarmos. Trocar de janela não invalida uma credencial exposta, e esperar o fim da sessão a deixa utilizável.")],
 nxt=("Now let us use the app: send feedback and watch the chart.", "Agora vamos usar o app: enviar feedback e ver o gráfico."))

slide(title="Live: send feedback", t="11:47–11:55", m=8, clicks=2, live=True,
 do=[D("Open the preview URL of the tested commit (from the PR or from DevOps). Show the dashboard first: the empty state only if you use the isolated test dataset. Never clear a shared database for this.", "Abra a preview URL do commit testado (pelo PR ou pelo DevOps). Mostre o dashboard primeiro: o estado vazio só se você usar o dataset de teste isolado. Nunca limpe um banco compartilhado para isso.",
       fail=("If the preview does not load, say 'This is live, so things can be slow.' If it is down, show the verified reference app (if reachable) and explain the block.", "Se a preview não carregar, diga 'This is live, so things can be slow.' Se estiver fora do ar, mostre a aplicação de referência verificada (se acessível) e explique o bloqueio.")),
     D("Click on the slide once (form box), send feedback in the real form (talk 'keynote', your name, a short comment, rating 5). Click again (chart box) and go back to the dashboard.", "Clique no slide uma vez (caixa do formulário), envie um feedback no formulário real (talk 'keynote', seu nome, um comentário curto, nota 5). Clique de novo (caixa do gráfico) e volte ao dashboard.",
       ok=("A bar for 'keynote' appears with one decimal for the mean (example: 5.0) and the feedback count.", "Aparece uma barra para 'keynote' com a média em uma casa decimal (exemplo: 5.0) e a contagem de feedbacks.")),
     D("Reload the page once. The data must still be there.", "Recarregue a página uma vez. O dado precisa continuar lá.",
       fail=("If the bar disappears after reload, do not hide it. Say: 'QA will mark this as FAIL.' and show the cause only if you know it.", "Se a barra sumir após o recarregamento, não esconda. Diga: 'QA will mark this as FAIL.' e mostre a causa só se você souber.")),
     D("If there is time, ask someone in the chat for a rating and send one more, so the bar changes.", "Se der tempo, peça uma nota para alguém no chat e envie mais um, para a barra mudar.")],
 say=[S("Let's send feedback and watch the chart.", "Vamos enviar um feedback e ver o gráfico.", "feedback → FÍID-béc; chart → TCHÁRT"),
      S("The form saves to a real database. The chart reads from it.", "O formulário salva num banco de dados de verdade. O gráfico lê dele.", "saves → SÊIVS; reads → RÍIDS"),
      S("Now I reload the page. The data is still here.", "Agora recarrego a página. O dado continua aqui.", "reload → ri-LÓUD; data → DÊI-ta"),
      S("Give me a rating in the chat, from one to five.", "Me deem uma nota no chat, de um a cinco.", "rating → RÊI-tin; five → FÁIV")],
 cut=("Send only one feedback. Do not ask the audience.", "Envie só um feedback. Não peça à plateia."),
 qa=[Q("Is the average rounded?", "Yes, to one decimal. For example, 4.25 becomes 4.3.", "A média é arredondada?", "Sim, para uma casa decimal. Por exemplo, 4.25 vira 4.3."),
     Q("Are Talk A and talk a the same talk?", "Yes. The app groups them together.", "Talk A e talk a são a mesma palestra?", "Sim. O app agrupa os dois juntos.")],
 nxt=("The bots are done. Now it is my decision.", "Os bots terminaram. Agora a decisão é minha."))

slide(title="Block 5: Approval", t="11:55–11:58", m=3, clicks=2,
 do=[D("Click twice: first the green card (the bot can do it alone), then the red card (a human decides). The line 'I always merge.' sits in the red card.", "Clique duas vezes: primeiro o cartão verde (o bot pode fazer sozinho), depois o cartão vermelho (um humano decide). A frase 'I always merge.' fica no cartão vermelho.")],
 say=[S("The bots brought the evidence. I decide.", "Os bots trouxeram a evidência. Quem decide sou eu.", "brought → BRÓT; decide → di-SÁID"),
      S("Can I undo it in a minute? The bot can do it alone.", "Consigo desfazer em um minuto? O bot pode fazer sozinho.", "undo → an-DÚ; minute → MÍ-nit"),
      S("Send, spend, publish, delete, or merge? A human decides.", "Enviar, gastar, publicar, apagar ou fazer merge? Quem decide é um humano.", "spend → SPÉND; publish → PÂ-blish; delete → di-LÍIT; human → RÍU-man"),
      S("I always merge.", "Quem faz o merge sou sempre eu.", "always → ÓL-uêis")],
 cut=("Read only the two card titles.", "Leia só os títulos dos dois cartões."),
 qa=[Q("Why not let the bot merge when all tests pass?", "A merge changes the real world. Passing tests are evidence, but a person owns the decision.", "Por que o bot não faz o merge quando todos os testes passam?", "O merge muda o mundo real. Testes passando são evidência, mas a decisão é de uma pessoa.")],
 nxt=("Now let us read the evidence and decide.", "Agora vamos ler a evidência e decidir."))

slide(title="Live: read three things, then merge", t="11:58–12:10", m=12, clicks=3, live=True,
 do=[D("Open the pull request on GitHub. First confirm the target: the approved exercise repo and branch. Never the reference main and never the frozen checkpoint.", "Abra o pull request no GitHub. Primeiro confirme o destino: o repositório e a branch do exercício aprovados. Nunca a main de referência e nunca o checkpoint congelado.",
       fail=("If the target is unclear, stop. Do not merge. Say: 'I will confirm the target first.'", "Se o destino não estiver claro, pare. Não faça o merge. Diga: 'I will confirm the target first.'")),
     D("Click on the slide: 1 what changed, 2 QA report, 3 CI status. Read each one on the PR in that order. The line 'I always merge.' is already on screen.", "Clique no slide: 1 o que mudou, 2 relatório do QA, 3 status do CI. Leia cada um no PR nessa ordem. A frase 'I always merge.' já está na tela."),
     D("All required criteria PASS and WARN reviewed? Decide and merge it yourself on the exercise target. Any FAIL or BLOCKED: do not call the MVP accepted.", "Todos os critérios obrigatórios em PASS e os WARN avaliados? Decida e faça o merge você mesma no destino do exercício. Com FAIL ou BLOCKED: não apresente o MVP como aceito.",
       ok=("GitHub shows the PR as merged on the exercise target.", "O GitHub mostra o PR como merged no destino do exercício.")),
     D("If QA says FAIL, paste the fix prompt to the FDE (replace <N> and the evidence). If you are late, show the FAIL as an example and say the fix comes later.", "Se o QA disser FAIL, cole o prompt de correção para o FDE (troque <N> e a evidência). Se estiver atrasada, mostre o FAIL como exemplo e diga que a correção fica para depois.", prompt=8,
       fail=("If QA says BLOCKED, explain that access or infrastructure is missing and that this is an honest answer.", "Se o QA disser BLOCKED, explique que falta acesso ou infraestrutura e que isso é uma resposta honesta."))],
 say=[S("I read three things: what changed, the QA report, and the CI status.", "Eu leio três coisas: o que mudou, o relatório do QA e o status do CI.", "report → ri-PÓRT; status → STÊI-tus"),
      S("All required checks passed. So I decide to merge.", "Todas as verificações obrigatórias passaram. Então eu decido fazer o merge.", "required → ri-QUÁI-erd; passed → PÉST"),
      S("QA found a FAIL. So I do not merge. The FDE fixes only that.", "O QA achou um FAIL. Então eu não faço o merge. O FDE corrige só aquilo.", "found → FÁUND"),
      S("This one is BLOCKED. That is an honest answer: access is missing.", "Este está BLOCKED. É uma resposta honesta: falta acesso.", "honest → Ó-nest; access → ÉK-sés"),
      S("I always merge.", "Quem faz o merge sou sempre eu.")],
 cut=("If you get FAIL, do not fix it live. Show it as an example and move on.", "Se vier FAIL, não corrija ao vivo. Mostre como exemplo e siga."),
 qa=[Q("What if the FDE keeps failing?", "Then I stop and rewrite the task or the design. Bots do not decide to try again forever.", "E se o FDE continuar falhando?", "Então eu paro e reescrevo a tarefa ou o design. Bots não decidem tentar para sempre."),
     Q("Is CI green enough to merge?", "No. CI green means tests ran. Acceptance means the agreed rules passed, with evidence.", "CI verde basta para fazer merge?", "Não. CI verde significa que os testes rodaram. Aceite significa que as regras combinadas passaram, com evidência.")],
 nxt=("Last step: let the bot work without me asking.", "Último passo: deixar o bot trabalhar sem eu pedir."))

slide(title="Block 6: Routine", t="12:10–12:22", m=12, clicks=1, live=True,
 do=[D("Open the native routines feature in Grok Bot (not any third-party tool; exact screen: confirm in rehearsal). Click once to show the daily triage card (mock).", "Abra o recurso de rotinas nativo do Grok Bot (nenhuma ferramenta de terceiros; tela exata: conferir no ensaio). Clique uma vez para mostrar o cartão de triagem diária (mock).",
       fail=("If routines cannot be saved as disabled, keep the draft in the document and show only the offline preview.", "Se não for possível salvar a rotina desativada, mantenha o rascunho no documento e mostre só a preview offline.")),
     D("Draft only: Monday to Friday, 09:00, time zone America/Sao_Paulo, Enabled: No. Read-only GitHub access, private delivery. Use the full prompt from docs/routines/daily-triage.md. Do NOT enable or schedule anything.", "Só rascunho: segunda a sexta, 09:00, fuso America/Sao_Paulo, Enabled: No. Acesso GitHub somente leitura, entrega privada. Use o prompt completo de docs/routines/daily-triage.md. NÃO ative nem agende nada.",
       ok=("The draft shows Enabled: No.", "O rascunho mostra Enabled: No.")),
     D("Run only the offline preview prompt (below) on the three local sample files.", "Execute só o prompt da preview offline (abaixo) nos três arquivos de exemplo locais.", prompt=9,
       ok=("The bot proposes one label per sample (bug, feature or unclear) and applies nothing.", "O bot propõe um label por exemplo (bug, feature ou unclear) e não aplica nada."),
       fail=("If it tries to touch real issues, stop it and say: 'This is preview only.'", "Se tentar mexer em issues reais, pare e diga: 'This is preview only.'"))],
 say=[S("A bot with a routine is a teammate.", "Um bot com rotina é um colega de time.", "routine → ru-TIIN; teammate → TIIM-mêit"),
      S("Once a day. If nothing is new, one line.", "Uma vez por dia. Se não houver nada novo, uma linha.", "once → UÂNS; nothing → NÂ-thin"),
      S("This is a draft, and it is disabled. I do not schedule anything today.", "Este é um rascunho e está desativado. Hoje eu não agendo nada.", "draft → DRÉFT; disabled → dis-ÊI-bold; schedule → SKÉ-djul"),
      S("Routines can also start from a Linear issue.", "As rotinas também podem começar a partir de uma issue do Linear.", "Linear → LÍ-ni-er; issue → Í-shu")],
 cut=("Show only the disabled draft and the offline preview. Do not enable the routine.", "Mostre só o rascunho desativado e a preview offline. Não ative a rotina."),
 qa=[Q("Will it run now?", "No. It is a disabled draft. Enabling it needs an explicit decision later.", "Vai rodar agora?", "Não. É um rascunho desativado. Ativar exige uma decisão explícita depois."),
     Q("What does it cost?", "Run it rarely and stay quiet when nothing is new. That keeps the cost low. I do not quote prices.", "Quanto custa?", "Rode poucas vezes e fique quieto quando não houver nada novo. Isso mantém o custo baixo. Eu não cito preços.")],
 nxt=("Let us recap, then your questions.", "Vamos recapitular e depois ouvir as perguntas de vocês."))

slide(title="Recap", t="12:22–12:23", m=1, clicks=3,
 do=[D("Click three times. Read each card, one at a time, with a pause.", "Clique três vezes. Leia cada cartão, um por vez, com uma pausa.")],
 say=[S("One bot per role.", "Um bot por papel.", "per → PÊR; role → RÓUL"),
      S("Evidence for every claim.", "Evidência para cada afirmação.", "evidence → É-vi-dens; claim → CLÊIM"),
      S("A human on every big step.", "Um humano em cada passo importante.", "human → RÍU-man; step → STÉP")],
 cut=("Never cut the recap. It takes one minute.", "Nunca corte o recap. Leva um minuto."),
 qa=[], nxt=("One bonus tip to save usage.", "Uma dica bônus para economizar uso."))

slide(title="Bonus: save usage", t="12:23–12:24", m=1, clicks=3,
 do=[D("Click three times. Say only one sentence, then move on.", "Clique três vezes. Diga só uma frase e siga.")],
 say=[S("To save usage: new chat per task, one full prompt.", "Para economizar uso: um chat novo por tarefa e um prompt completo.", "save → SÊIV; usage → IÚ-sidj; prompt → PRÓMPT"),
      S("And use connectors first. The browser is the most expensive way to read GitHub.", "E use conectores primeiro. O navegador é a forma mais cara de ler o GitHub.", "connectors → co-NÉC-tors; expensive → ex-PÉN-siv")],
 cut=("Skip this slide. Finish exactly at 12:30.", "Pule este slide. Termine exatamente às 12:30."),
 qa=[], nxt=("One optional tip about pstack, if we have time.", "Uma dica opcional sobre o pstack, se tivermos tempo."))

slide(title="Optional: pstack", t="12:24–12:26", m=2, clicks=3, optional=True,
 do=[D("OPTIONAL slide. Use it only if you are on time. Skip it if you are more than 2 minutes late.", "Slide OPCIONAL. Use só se estiver no horário. Pule se estiver mais de 2 minutos atrasada."),
     D("Click three times: the credit, /poteto-mode, /poteto-help. Do NOT run /setup-pstack live: it writes a Cursor rules file. Show the three links as text only.", "Clique três vezes: o crédito, /poteto-mode, /poteto-help. NÃO rode /setup-pstack ao vivo: ele grava um arquivo de regras do Cursor. Mostre os três links só como texto.",
       fail=("If someone asks to see it live, say: 'I will share the link, and you can try it after the session.'", "Se alguém pedir para ver ao vivo, diga: 'I will share the link, and you can try it after the session.'"))],
 say=[S("This is optional. Our verification skills come from pstack, made by Lauren Tan.", "Isto é opcional. Nossas skills de verificação vêm do pstack, feito por Lauren Tan.", "optional → ÓP-sho-nal; Lauren Tan → LÓ-ren TÉN"),
      S("Start a message with slash poteto-mode for more rigor: short answers, simple code, verified work.", "Comece uma mensagem com barra poteto-mode para mais rigor: respostas curtas, código simples, trabalho verificado.", "poteto → po-TÊI-tou; mode → MÓUD; rigor → RÍ-gor"),
      S("When you are not sure which skill to use, ask slash poteto-help.", "Quando não souber qual skill usar, pergunte com barra poteto-help.", "help → HÉLP; sure → SHÚR"),
      S("The links are on the slide. Try it after the session.", "Os links estão no slide. Experimentem depois da sessão.", "links → LÍNKS")],
 cut=("Skip this slide. Go straight to Questions.", "Pule este slide. Vá direto para as perguntas."),
 qa=[Q("Do I need pstack to follow the workshop?", "No. The repo includes the skills we used. pstack is where they come from.", "Preciso do pstack para acompanhar o workshop?", "Não. O repositório inclui as skills que usamos. O pstack é de onde elas vêm.")],
 nxt=("Now, your questions.", "Agora, as perguntas de vocês."))

slide(title="Questions?", t="12:26–12:30", m=4, clicks=0,
 do=[D("Open for questions. Read each question from the chat out loud before you answer.", "Abra para perguntas. Leia cada pergunta do chat em voz alta antes de responder."),
     D("At 12:29 read the closing line, even if there are still questions.", "Às 12:29, leia a frase de encerramento, mesmo que ainda haja perguntas.",
       ok=("The clock bar is full. The session ends at 12:30.", "A barra de tempo está cheia. A sessão termina às 12:30.")),
     D("Remember: the repo is private. The slides and the guide are public. Code access is granted separately by the instructor.", "Lembre: o repositório é privado. Os slides e o guia são públicos. O acesso ao código é dado separadamente pela instrutora.")],
 say=[S("Questions? Please write them in the chat.", "Perguntas? Por favor, escrevam no chat.", "questions → QUÉS-tchons; write → RÁIT"),
      S("I'll read the question in the chat.", "Vou ler a pergunta no chat.", "read → RÍID (verbo, agora); question → QUÉS-tchon"),
      S("Can you repeat that, please?", "Pode repetir, por favor?", "repeat → ri-PÍIT; please → PLÍIZ"),
      S("Great question. Let's take it at Q&A.", "Ótima pergunta. Vamos responder no Q&A.", "great → GRÊIT"),
      S("Let's move on.", "Vamos seguir.", "move → MÚUV"),
      S("Thank you so much! See you next time.", "Muito obrigada! Até a próxima.", "thank → THÉNK (língua entre os dentes); you → IÚ; next → NÉKST; time → TÁIM")],
 cut=("Close at 12:29 with the final sentence, even if there are questions.", "Encerre às 12:29 com a frase final, mesmo que haja perguntas."),
 qa=[Q("Can I get the slides and the guide?", "Yes. The slides and the guide are public. For the code, ask the instructor for access.", "Posso ter os slides e o guia?", "Sim. Os slides e o guia são públicos. Para o código, peça acesso à instrutora.")],
 nxt=None)

# ---------- per-slide timing sanity ----------
assert len(SL) == 22

EMERGENCY = [
 S("Let's give it a few seconds.", "Vamos dar alguns segundos.", "seconds → SÉ-kons"),
 S("While the bot works, let me explain.", "Enquanto o bot trabalha, deixa eu explicar.", "explain → ex-PLÊIN"),
 S("Great question. Let's take it at Q&A.", "Ótima pergunta. Vamos responder no Q&A.", "great → GRÊIT"),
 S("This is live, so things can be slow.", "É ao vivo, então pode demorar.", "live → LÁIV; slow → SLÓU"),
 S("This exercise is blocked. Let me show the verified reference app.", "Este exercício está bloqueado. Vou mostrar a aplicação de referência verificada.", "blocked → BLÓCT; verified → VÉ-ri-faid"),
 S("I'll read the question in the chat.", "Vou ler a pergunta no chat.", "read → RÍID"),
 S("Can you repeat that, please?", "Pode repetir, por favor?", "repeat → ri-PÍIT"),
 S("Let's move on.", "Vamos seguir.", "move → MÚUV"),
]

# ---------- rendering: deck notes ----------
E = html.escape
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
    o.append(f'<p style="{ST["head"]}">⏱ {s["t"]} BRT · {s["m"]} min · slide {n}/22 · block {bi} · {E(blk["name"])}' + (' · OPTIONAL SLIDE' if s.get('optional') else '')
             + (f' · {s["clicks"]} click{"s" if s["clicks"]!=1 else ""} on the slide' if s["clicks"] else ' · no clicks on the slide') + '</p>')
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
    assert idx == 22, idx
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
        o.append('### ➡️ Transição\n')
        o.append(f'> "{last["nxt"][0]}"  \n> *{last["nxt"][1]}*\n' if last["nxt"] else 'Fim da sessão.\n')
        o.append('### ✅ Checkpoint\n')
        o.append(f'{b["check"][1]}\n')
        o.append('---\n')
    return "\n".join(o)

def run_sheet():
    rows = ["| Brasília | ET | Slide | O que acontece (cliques e telas) | Tela compartilhada | Se atrasar |", "|---|---|---|---|---|---|"]
    rows.append("| 10:45 | 8:45 | 1 | Abrir deck (F), notas (S), abas prontas: GitHub, Grok Bot, instruções QA/DevOps, preview | Slide 1 | — |")
    shared = {3:"GitHub", 8:"Grok Bot", 9:"Grok Bot", 10:"Grok Bot → Deck", 13:"Grok Bot", 14:"Grok Bot / GitHub", 15:"Preview", 17:"GitHub", 18:"Grok Bot"}
    acts = {1:"Boas-vindas", 2:"Agenda em 8 passos (1 clique)", 3:"Tour do repo: README → `mvp/` → `docs/inception.md` (3 cliques)", 4:"Arquitetura do MVP (5 cliques)",
        5:f"A regra: quem constrói não julga, nenhum bot faz merge ({SL[4]['clicks']} {'clique' if SL[4]['clicks'] == 1 else 'cliques'})", 6:"Fluxo do time (6 cliques)", 7:"Charter: owns · good output · stops (3 cliques)",
        8:"**Ao vivo:** criar FDE TypeScript, depois QA e DevOps, skills, grupo", 9:"**Ao vivo:** prompt de design para o FDE", 10:"Aprovar design (prompt FDE) e **prova do FDE**; \"Green CI is not acceptance\"",
        11:"Loop PR → verify → approve (5 cliques)", 12:"Regra de todo bot: **prove it works** (3 cliques)", 13:"**Ao vivo:** prompt do QA, **prova do QA**, PASS/FAIL/WARN/BLOCKED", 14:"**Ao vivo:** prompt do DevOps e **prova do DevOps**, status do CI e preview",
        15:"**Ao vivo:** enviar feedback, ver a barra no dashboard", 16:"Quem decide sou eu: desfaz em 1 min × humano decide", 17:"**Ao vivo:** ler o PR (mudou, QA, CI) e fazer o merge",
        18:"**Ao vivo:** preview da triagem diária, rascunho desativado", 19:"Recap: três frases (3 cliques)", 20:"Economizar uso", 21:"**OPCIONAL:** pstack (`/poteto-mode`, `/poteto-help`)", 22:"Perguntas e frase de encerramento (12:29)"}
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

PRON_CHEAT = [("context","CÓN-tékst"),("deploy","di-PLÓI"),("preview","PRÍ-viu"),("acceptance","ek-SÉP-tans"),("routine","ru-TIIN"),("schema","SKÍ-ma"),("merge","MÉRDJ"),
 ("Neon","NÍ-on"),("Drizzle","DRÍ-zol"),("Zod","ZÓD"),("Playwright","PLÊI-rait"),("Vercel","vêr-SÉL"),("Postgres","PÓST-gres"),("shadcn","CHÁD-si-ên"),("Next.js","NÉKST dê-êi-ES"),
 ("GitHub","GUÍT-hâb"),("evidence","É-vi-dens"),("approve","a-PRUUV"),("secret","SI-cret"),("redacted","ri-DÉC-tid"),("blocked","BLÓCT"),("coverage","CÂ-ve-ridj"),
 ("criteria","crai-TÍ-ri-a"),("branch","BRÉNTCH"),("pull request","PUL ri-QUÉST"),("triage","TRI-ajh"),("Linear","LÍ-ni-er"),("thank you","THÉNK iú")]
def pron_section():
    o = ["## Cola de pronúncia\n", "Aproximação em português para ler em voz alta. A sílaba em MAIÚSCULAS é a mais forte. O som \"th\" é a língua entre os dentes.\n", "| Palavra | Como falar |", "|---|---|"]
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
