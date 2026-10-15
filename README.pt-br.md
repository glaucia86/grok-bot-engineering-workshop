<a id="top"></a>
<div align="center">

<img src="assets/banner.webp" alt="Build Your First Engineering Bot with Grok Bot — banner do workshop da Packt" width="100%" />

# Crie seu primeiro time de engenharia com o Grok Bot

**Um workshop prático da Packt · 17 de novembro de 2026 · 9h–10h30 ET (11h–12h30 Brasília) · 90 minutos**

<p>
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img alt="Node.js 24 LTS" src="https://img.shields.io/badge/Node.js-24%20LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
<img alt="Fastify" src="https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white" />
<img alt="Vitest" src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" />
<img alt="Hands-on" src="https://img.shields.io/badge/Format-Hands--on-F97316?style=for-the-badge" />
<img alt="MIT" src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

[English](README.md) · Português (Brasil)

</div>

## Trilha principal: Talk Feedback MVP em Next.js

Prepare uma **aplicação de referência completa na main** antes do evento, com PRs revisados e merges humanos. No **workshop de 90 minutos**, a turma implementa os exercícios de formulário/dashboard a partir da base API/banco separada e congelada `checkpoint/mvp-base`, em `mvp/`. O aplicativo Fastify da raiz é **prática extra opcional**, não a trilha principal.

Comece por [spec.md](spec.md), [inception](docs/inception.md), [setup do MVP](mvp/README.md) e [índice de exercícios e issues GitHub](docs/issues/README.md). A spec define o contrato técnico; as issues GitHub acompanham a execução, sem repetir o plano em outra spec ou arquivo de slices.

### Estado antes do workshop

A API base, o schema, a migration, os testes locais e os componentes visuais estão integrados. A página inicial ainda é a página padrão; formulário/dashboard e aceite na preview real continuam pendentes. O destino é uma referência completa na main; este snapshot ainda não chegou lá. A spec integrada registra requisitos aprovados, não uma aplicação aceita.

Em 15 de outubro, [PR #9](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/9) (critérios) e [PR #10](https://github.com/glaucia86/grok-bot-engineering-workshop/pull/10) (agrupamento sem distinção de maiúsculas) ainda aguardam merge humano. Confira o estado e o SHA testado antes do evento. O aceite permanece BLOCKED até os critérios entrarem e serem verificados.

## Agenda e resultados esperados

| Minutos | Atividade | Resultado observável |
|---|---|---|
| 0–5 | Inspecionar a base MVP preparada | Repositório, app, commit e checks corretos |
| 5–12 | Criar FDE, QA e DevOps | Três papéis limitados; somente humano faz merge |
| 12–20 | Revisar design da funcionalidade ao vivo | Arquivos, contratos públicos e testes acordados |
| 20–40 | Construir e verificar | Formulário/dashboard e evidência por critério |
| 40–55 | Inspecionar PR e preview | Enviar feedback e conferir dashboard |
| 55–70 | Revisão e decisão humana | Aprovar/mergear pessoalmente ou pedir ajustes |
| 70–82 | Rascunhar triagem nativa | Definição desativada e exemplo privado |
| 82–90 | Perguntas | Revisar aprendizados e prática extra |

O [guia da apresentadora](docs/speaker/guia-glaucia.md) traz o roteiro correspondente de 11h às 12h30 Brasília. A infraestrutura é preparada **antes** do evento, fora desses 90 minutos.

## Antes do evento

1. Prepare acesso GitHub e um repositório/fork autorizado. Confira visibilidade e acesso antes de compartilhar um repositório privado. Ao criar o fork, **desmarque “Copy the DEFAULT branch only”** para incluir todas as branches, inclusive `checkpoint/mvp-base` ([instruções do GitHub](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo?tool=webui)).
2. Use Node.js 24 e npm para os checks locais. Siga o [setup e migrations](mvp/README.md); execute os comandos MVP em `mvp/`, não na raiz.
3. Prepare banco, migration, root Vercel `mvp`, acesso seguro à preview, isolamento dos dados e harness. Secret configurada ou deployment Ready não comprovam o fluxo.
4. Use a aplicação completa revisada da main como referência e congele uma revisão verificada de `checkpoint/mvp-base` para os exercícios. Não mova esse checkpoint para o app completo nem presuma que contém ajustes posteriores. As branches numeradas `checkpoint/01`–`05` pertencem ao exercício extra Fastify.
5. Ensaie com dataset dedicado. Cada execução usa nome de palestra único; isso não isola um banco Neon compartilhado. Nunca esvazie dados compartilhados para demonstrar dashboard vazio. Limpe apenas dados/processos criados pela execução autorizada. Sem acesso ou isolamento, registre BLOCKED.
6. Mantenha credenciais nas configurações seguras; nunca cole valores em chat, código, logs ou evidência. Este guia não autoriza configuração de contas ou segredos.

### Verifique o checkpoint do exercício

No clone do fork autorizado para os exercícios, confirme que `origin` aponta para esse fork (não para o repositório upstream de referência); antes de começar, execute esta verificação somente de leitura:

```sh
git ls-remote --exit-code --heads origin refs/heads/checkpoint/mvp-base
```

Espere exatamente uma linha: o SHA congelado aprovado pela instrutora seguido de `refs/heads/checkpoint/mvp-base`. Registre e compare esse SHA com a base aprovada na issue #21. Ref ausente, falha de acesso ou SHA diferente significa **BLOCKED**; não substitua por `main` nem por um checkpoint Fastify numerado.

Já criou o fork só com a branch padrão? Com permissão para criar a branch ausente nesse fork, use **Branches → New branch** no GitHub, escolha o repositório upstream autorizado e sua `checkpoint/mvp-base` como origem e crie somente `checkpoint/mvp-base`. Confira primeiro o SHA de origem contra a base congelada aprovada; se a branch já existir ou divergir, pare e consulte a instrutora. Não sobrescreva branches, não faça force-push, não altere `main` nem copie credenciais. Repita a verificação remota acima antes de criar uma branch de exercício a partir desse SHA verificado. Se o acesso ao fork privado ou a criação da branch não estiver disponível, peça à instrutora para preparar o repositório autorizado de exercícios.

Checks locais da base, sem credenciais de banco:

```sh
cd mvp
npm ci
npm test
npm run lint
npm run build
npm run typecheck
npm run verify:http
```

Esses checks comprovam apenas seu escopo local. `verify:http` rejeita entrada inválida em seu próprio servidor localhost; não acessa a preview Vercel nem comprova escrita remota válida. `npm run verify` na raiz verifica o Fastify separado.

## Time e prompts do workshop

No máximo três skills por bot (o QA é a única exceção, veja abaixo). Todo bot também aplica o princípio `principle-prove-it-works` do pstack como definição de pronto: nenhum bot declara uma tarefa pronta sem prova do artefato real.

Skills:

- FDE: `shadcn`, `vercel-react-best-practices`, `neon-drizzle`
- QA: `playwright-best-practices`, `playwright-cli`, `create-verification-skill`, `interrogate` (pstack; a única exceção ao limite de três skills)
- DevOps: `deploy-to-vercel`, `ci-cd-and-automation`

FDE constrói; QA julga independentemente pelos critérios; DevOps informa checks e preview. Nenhum bot aprova ou faz merge. Uma tarefa por prompt, com evidência vinculada ao commit. Os prompts em inglês abaixo são idênticos aos da versão inglesa.

### 1. Inspecionar e desenhar (0–20 min)

```text
Read spec.md, docs/inception.md, mvp/README.md and the selected GitHub issue.
Identify the exact base commit and distinguish the Next.js MVP from the root Fastify exercise.
Use the complete reference app on main for comparison and the frozen checkpoint/mvp-base for exercises.
Design the assigned form/dashboard exercise using the existing schema, API and UI primitives.
Show files to change and observable tests. Keep comment required (trimmed 1–1000), rating integer 1–5,
and one-decimal averages (4.25 → 4.3). Group Talk A/talk a together under the approved contract.
List unresolved prerequisites separately. Do not change code until I approve the design. Never merge.
```

### 2. Implementar após aprovação do design (20–40 min)

```text
Implement the approved exercise design on a new branch from the frozen reviewed checkpoint commit.
Before opening the exercise PR, identify its instructor-approved exercise repository and target branch.
Do not target the canonical reference main or move checkpoint/mvp-base; stop if that destination is unspecified.
Keep the complete reference main separate; do not overwrite it with an exercise checkpoint.
Use the existing shared validation and API. Keep successful confirmation/reset and rejected-input retention.
Show every talk's average and count, one bar per talk, a readable value label/tooltip, and the empty state.
Run the applicable MVP tests, lint, build, typecheck and HTTP checks. Open one PR with evidence.
Do not claim preview acceptance from local checks. Do not merge or change production settings.
```

### 3. QA independente e preview (20–55 min)

```text
Use spec.md and the merged acceptance criteria, not the author's report, to assess this PR.
First identify the tested SHA and actual preview URL. Check the real form → API → dashboard/GET journey.
Compare exact API/form error messages. Verify creation through public results, reload persistence,
and separately persistence after a fresh application instance against the same isolated test database.
Use unique test talk names; do not reset shared Neon data. Empty-state checks require isolated data.
Report PASS, FAIL, WARN only for AC9 coverage gaps, or BLOCKED per criterion, with commands and artifacts.
Failing tests or CI remain failures. Missing criteria merge, preview access or isolation stays BLOCKED.
Clean up only authorized run-owned data/processes, keeping evidence. Never merge.
```

### 4. Decisão humana (55–70 min)

Leia a alteração, a evidência independente e os checks do mesmo commit. CI verde não é aceite. Somente o humano aprova e faz merge. Registre avisos de cobertura sem transformar falhas ou ausência de evidência em aprovação.

### 5. Rascunho de rotina nativa (70–82 min)

```text
Read docs/routines/daily-triage.md. Draft a native Grok Bot routine for weekdays at 9 AM America/Sao_Paulo.
Use its private delivery and read-only rules. Propose labels; do not apply them.
Show a disabled definition and sample summary. Do not create or enable a scheduled task in this exercise.
```

## Prática extra opcional: Fastify legado

A API original em memória e seus exercícios continuam disponíveis. Eles **não** definem o contrato Next.js nem são pré-requisitos da funcionalidade visual ao vivo.

- [Avaliação de palestra](docs/issues/01-add-talk-rating.md): nota opcional no exercício antigo; [design histórico](docs/design/talk-rating.md). A nota já está implementada na main atual; use o checkpoint anterior do exercício para praticar implementação.
- [Excluir feedback](docs/issues/02-delete-feedback.md) e [resumo por palestra](docs/issues/03-feedback-summary.md): extensões opcionais Fastify, não requisitos MVP nem mecanismos de limpeza dos testes remotos.
- Comandos na raiz: `npm ci`, `npm test`, `npm run typecheck`, `npm run verify`.
- As branches históricas `checkpoint/01-setup`, `02-design`, `03-verification`, `04-backup-pr` e `05-routine` registram etapas desse exercício extra. Não faça merge integral delas na main nem as use como base MVP.
- Fastify usa `/feedback`, nota opcional e memória; MVP usa `/api/feedback`, nota/comentário obrigatórios e Postgres. A evidência de um verificador não substitui a do outro.

<a id="credits"></a>
## Créditos e leituras complementares

- **pstack**, da Lauren Tan ([@poteto](https://x.com/poteto)): as skills em [`.agents/skills`](.agents/skills) foram copiadas de [cursor/plugins/pstack](https://github.com/cursor/plugins/tree/1e5c90a4b6f249917bd21fe361b3a2a7deb741b8/pstack) sob a licença MIT. Veja o [NOTICE](.agents/skills/NOTICE.md) e a [LICENSE](.agents/skills/LICENSE). A ideia de *construir a alavanca* é dela.
- **Leitura complementar:** o [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), do Matt Pocock, outra coleção de skills para agentes. Seu fluxo `to-spec` orientou a [spec.md](spec.md); ele não substitui as três skills do QA.

## Licença

Código e texto originais do workshop: [MIT](LICENSE), © 2026 Glaucia Lemos. As skills de terceiros mantêm a própria licença (veja acima).

---

<a id="creator"></a>
## Sobre a apresentadora

<div align="center">
<a href="https://github.com/glaucia86"><img src="https://avatars.githubusercontent.com/u/1631477?v=4" width="170" height="170" alt="Glaucia Lemos" /></a>

<h3>Glaucia Lemos</h3>
<p><strong>Principal Software Engineer · Autora</strong></p>
<p>Trabalho com IA e engenharia de software, criando aplicações e explorando<br>agentes de código com IA usando JavaScript e TypeScript. Compartilho conhecimento prático<br>por meio de projetos open source, palestras e conteúdo técnico.</p>

<p>
<a href="https://www.youtube.com/user/l32759"><img alt="YouTube" src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" /></a>
<a href="https://www.linkedin.com/in/glaucialemos/"><img alt="LinkedIn" src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge" /></a>
<a href="https://x.com/glaucia_lemos86"><img alt="X" src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white" /></a>
</p>
<p>
<a href="https://github.com/glaucia86"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
<a href="https://www.twitch.tv/glaucia_lemos86"><img alt="Twitch" src="https://img.shields.io/badge/Twitch-9146FF?style=for-the-badge&logo=twitch&logoColor=white" /></a>
<a href="https://dev.to/glaucia86"><img alt="DEV Community" src="https://img.shields.io/badge/DEV_Community-0A0A0A?style=for-the-badge&logo=devdotto&logoColor=white" /></a>
</p>
<p><a href="https://linktr.ee/glaucia_lemos86">Linktree</a> · <a href="#top">↑ Voltar ao topo</a></p>
<p><strong>O bot propõe. O humano aprova.</strong></p>
</div>
