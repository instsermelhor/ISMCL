# MÓDULO DE RELATÓRIOS E IMPACTO SOCIAL
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Foco:** Data Analytics, Prestação de Contas (Transparência) e Business Intelligence

---

## 1. VISÃO GERAL
Para sustentar o Instituto Ser Melhor financeiramente (via editais, captação corporativa e emendas), a plataforma precisa quantificar o impacto social gerado, provando a eficácia do trabalho voluntário, **sem nunca expor dados identificáveis dos beneficiários**.

Este módulo atua de forma analítica (OLAP) isolado das transações diárias (OLTP) para não degradar a performance do prontuário e cadastro.

---

## 2. ESTRATÉGIA DE DADOS E ANONIMIZAÇÃO

*   **ETL (Extract, Transform, Load):** Periodicamente (D+1), um job de ETL extrai os dados brutos da base principal.
*   **Mascaramento (Data Masking):** Nomes são convertidos em hashes irreversíveis ou categorias de gênero/idade. CPFs, Endereços precisos e IDs Pessoais são dropados.
*   **Agregação:** A base analítica foca em *quantidades, tendências e demografia regional* (ex: Bairro, Zona).

---

## 3. PRINCIPAIS DASHBOARDS E INDICADORES (KPIs)

### 3.1. Visão de Saúde Mental (Clínica)
Destinado à coordenação técnica (Psicólogos chefes e Psiquiatras). Ajuda a balizar filas de espera.
*   **Volumetria:** Número total de sessões realizadas no mês vs Absenteísmo (Faltas).
*   **Epidemiologia Básica:** Prevalência de queixas principais (Ex: Ansiedade 40%, Luto 20%, Ideação Suicida 15%).
*   **Tempo Médio de Alta:** Quantas semanas um beneficiário passa no fluxo até receber alta clínica.

### 3.2. Visão Social (Vulnerabilidade)
Destinado ao Serviço Social e Jurídico.
*   **Mapa de Calor (Georreferenciamento):** Mapa (Google Maps / Mapbox) mostrando manchas de calor de onde vêm a maioria dos pedidos de ajuda, permitindo campanhas preventivas locais.
*   **Segurança Alimentar e Renda:** Distribuição do perfil de renda familiar dos atendidos (Ex: 80% das famílias atendidas vivem com menos de 1 salário mínimo).
*   **Recortes Minoritários:** Atendimentos com marcadores de Violência Doméstica, Mães Solo, ou População LGBTQIAPN+.

### 3.3. Painel de Transparência Institucional (Investidores Sociais)
Dashboard externalizável (pode ser embarcado em site público ou relatórios para patrocinadores).
*   **Horas Doadas (Impacto Financeiro Estimado):** (Horas de sessões realizadas X Valor de Mercado da consulta). Isso tangibiliza o valor do serviço entregue.
*   **Capacidade Instalada vs Utilizada:** Mostra quantos voluntários estão na plataforma e qual o percentual de ociosidade das agendas.

---

## 4. ARQUITETURA DE RELATÓRIOS (STACK SUGERIDA)

*   **Banco Analítico:** PostgreSQL com Materialized Views (para consultas rápidas pré-calculadas). Se o volume crescer muito (milhões de registros no longo prazo), migrar para AWS Redshift.
*   **Visualização Embutida:** No painel Administrativo do Next.js, utilizar bibliotecas como **Recharts** ou **Nivo** para gerar gráficos elegantes e interativos (Bar charts, Pie charts, Line graphs) consumindo os endpoints agregados.
*   **Relatórios Estáticos:** Geração de relatórios PDF mensais automatizados rodando em background (Puppeteer ou PDFKit) e salvos no S3, disponíveis para download na aba "Relatórios Oficiais".
