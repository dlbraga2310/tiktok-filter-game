# Vídeo: Kiro x Claude (80 s, PT-BR)

Arquivo final: `kiro-vs-claude.mp4` (1080x1920, 24 fps, H.264 + AAC, cerca de 4 MB, 80 s). Formato **vertical 1080x1920** escolhido para TikTok/Reels (o padrão do lemo-opuscar é 1920x1080).

## Estilo e por quê
**Swiss Motion Graphics** (`styles/swiss-motion` do lemo-opuscar): tipografia, grade e uma única cor de sinal. Serve bem a uma comparação com fatos: dá para mostrar "Kiro em cima, Claude Code embaixo" com marcadores simples. Cor laranja = o que a documentação do Kiro apresenta como diferencial; preto = os dois têm; meio preenchido = parcial.

## Enquadramento justo
O Kiro oferece modelos Claude, então não é "contra o modelo". O Claude Code também tem hooks, MCP, CLAUDE.md e modo de plano. A conclusão do vídeo é: o Kiro **não faz o que o Claude não consegue**; ele traz **integrado** um fluxo guiado por specs.

## Afirmações e fontes
Consultadas em 7/11/2026 (as páginas mostravam atualização em out/2026).

| Afirmação no vídeo | Status | Fonte |
|---|---|---|
| Kiro tem specs: requisitos, design e plano de tarefas; Quick Spec gera os três; requisitos em notação EARS | Verificado | https://kiro.dev/docs/specs/ e /docs/specs/feature-specs/ |
| Kiro: hooks rodam comandos ou prompts em eventos da sessão; criados descrevendo em linguagem natural | Verificado | https://kiro.dev/docs/hooks/ |
| Kiro: steering gera product.md, tech.md, structure.md em .kiro/steering | Verificado | https://kiro.dev/docs/steering/ |
| Kiro suporta MCP, com diretório de servidores | Verificado | https://kiro.dev/docs/mcp/ |
| Kiro lista vários modelos (Claude e de outras empresas) e tem modo Auto | Verificado | https://kiro.dev/docs/models/available-models/ |
| Kiro: IDE, CLI, web (e mais); "agentes" | Verificado | https://kiro.dev |
| Claude Code: terminal, IDE, app desktop e web | Verificado | https://code.claude.com/docs/en/overview |
| Claude Code tem hooks (menu /hooks) | Verificado | https://code.claude.com/docs/en/hooks |
| Claude Code tem CLAUDE.md e .claude/rules | Verificado | https://code.claude.com/docs/en/memory |
| Claude Code suporta MCP | Verificado (existe página dedicada de MCP) | https://code.claude.com/docs/en/mcp |
| Claude Code tem modo de plano (revisar antes de editar) | Verificado | https://code.claude.com/docs/en/common-workflows |
| Claude Code não tem fluxo de specs pronto | **Não comprovado**: apenas "não encontrei" nas páginas lidas (ausência de evidência). Dito assim no vídeo | páginas acima |
| Claude Code usa modelos Claude "por aliases" | Parcial: página de configuração de modelos mostra aliases e provedores terceiros; não afirmei que não aceita outros | https://code.claude.com/docs/en/model-config |
| "Kiro é da AWS" | Dito na descrição da tarefa; a página inicial lida não repetia o texto | contexto da tarefa |

Não li todas as páginas por completo (recortei trechos); confira nas fontes antes de publicar.

## O que foi testado
- Renderização completa (1922 quadros), mixagem e muxagem OK; loudness -14 LUFS.
- `readcheck` do lemo-opuscar: todos os textos ficam tempo suficiente.
- Inspeção visual de quadros amostrados.
- **Não testado:** a conferência de fala por Whisper (`asr_check.py`) não foi instalada/rodada; não ouvi o áudio (só medi). A voz depende do serviço online do edge-tts (Microsoft; veja os termos antes de uso comercial). A música/efeitos são sintetizados por código.

## Como refazer
No Linux/macOS/Git Bash: instale Node 20+, ffmpeg 7+, Python 3.11; clone `https://github.com/lemomo-ai/lemo-opuscar` ao lado desta pasta do repositório (`../../../lemo-opuscar`), rode o setup de dependências e depois `sh build.sh`. Precisa de internet para a voz.

## Créditos
- Feito com **lemo-opuscar** ([lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar)), código MIT e conteúdo (estilos) CC BY 4.0. Estilo: Swiss Motion Graphics.
- Fonte Inter (SIL OFL 1.1), em `fonts/`.
