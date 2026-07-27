# ── Aura Platform — Makefile ──────────────────────────────────────────────────
# Foundation Platform — Prompt 131 (AFPI)
# Referências: P101 (AEBSP), P131 (AFPI)
#
# Uso:
#   make dev        → Desenvolvimento completo (infra + backend + frontend)
#   make stop       → Para todos os serviços
#   make test       → Roda todos os testes
#   make help       → Lista todos os targets

.PHONY: help dev stop restart logs migrate seed test lint build clean studio deploy-staging

# ── Cores para output ─────────────────────────────────────────────────────────
BOLD   := \033[1m
GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
RED    := \033[0;31m
RESET  := \033[0m

# ── Configurações ─────────────────────────────────────────────────────────────
COMPOSE_FILE := infra/docker-compose.yml
BACKEND_DIR  := backend
FRONTEND_DIR := .

## help: Lista todos os targets disponíveis
help:
	@echo ""
	@echo "$(BOLD)🌟 Aura Platform — Comandos Disponíveis$(RESET)"
	@echo "$(BLUE)════════════════════════════════════════════$(RESET)"
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //' | awk -F: '{printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

## dev: Inicia o ambiente de desenvolvimento completo
dev:
	@echo "$(BLUE)🚀 Iniciando Aura Platform (desenvolvimento)...$(RESET)"
	@make infra-up
	@sleep 3
	@echo "$(BLUE)📦 Iniciando backend NestJS...$(RESET)"
	@cd $(BACKEND_DIR) && npm run start:dev &
	@echo "$(BLUE)⚡ Iniciando frontend Vite...$(RESET)"
	@npm run dev &
	@echo ""
	@echo "$(GREEN)✅ Aura Platform iniciada!$(RESET)"
	@echo "  Backend:  http://localhost:3001"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Swagger:  http://localhost:3001/api/docs"
	@echo "  MailHog:  http://localhost:8025"

## infra-up: Sobe apenas a infraestrutura Docker (PostgreSQL, Redis, MailHog)
infra-up:
	@echo "$(BLUE)🐳 Subindo infraestrutura Docker...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)✅ Infraestrutura pronta!$(RESET)"

## stop: Para todos os serviços (infra + processos Node)
stop:
	@echo "$(YELLOW)⏹️  Parando todos os serviços...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down
	@pkill -f "nest start" 2>/dev/null || true
	@pkill -f "vite" 2>/dev/null || true
	@echo "$(GREEN)✅ Todos os serviços parados.$(RESET)"

## restart: Reinicia a infraestrutura Docker
restart:
	@make stop
	@sleep 2
	@make dev

## logs: Exibe logs dos containers Docker em tempo real
logs:
	@docker compose -f $(COMPOSE_FILE) logs -f

## logs-backend: Exibe apenas logs do PostgreSQL
logs-postgres:
	@docker compose -f $(COMPOSE_FILE) logs -f postgres

## migrate: Executa as migrações do Prisma
migrate:
	@echo "$(BLUE)🔄 Executando migrações Prisma...$(RESET)"
	@cd $(BACKEND_DIR) && npx prisma migrate dev
	@echo "$(GREEN)✅ Migrações concluídas!$(RESET)"

## migrate-prod: Aplica migrações em produção (sem resetar)
migrate-prod:
	@echo "$(BLUE)🔄 Aplicando migrações (produção)...$(RESET)"
	@cd $(BACKEND_DIR) && npx prisma migrate deploy

## seed: Executa os seeds do banco de dados
seed:
	@echo "$(BLUE)🌱 Executando seeds...$(RESET)"
	@cd $(BACKEND_DIR) && npm run seed
	@echo "$(GREEN)✅ Seeds concluídos!$(RESET)"

## studio: Abre o Prisma Studio (visualizador de banco)
studio:
	@echo "$(BLUE)🔭 Abrindo Prisma Studio...$(RESET)"
	@cd $(BACKEND_DIR) && npx prisma studio

## generate: Regenera o Prisma Client
generate:
	@cd $(BACKEND_DIR) && npx prisma generate

## test: Roda todos os testes (backend + frontend)
test:
	@echo "$(BLUE)🧪 Executando testes...$(RESET)"
	@make test-backend
	@echo "$(GREEN)✅ Todos os testes passaram!$(RESET)"

## test-backend: Roda testes do backend com coverage
test-backend:
	@echo "$(BLUE)🧪 Testes do Backend (Jest)...$(RESET)"
	@cd $(BACKEND_DIR) && npm run test:cov

## test-watch: Roda testes do backend em modo watch
test-watch:
	@cd $(BACKEND_DIR) && npm run test:watch

## lint: Roda ESLint e TypeScript em todo o projeto
lint:
	@echo "$(BLUE)🔍 Executando lint...$(RESET)"
	@npm run lint
	@cd $(BACKEND_DIR) && npm run lint
	@echo "$(GREEN)✅ Lint concluído!$(RESET)"

## build: Build de produção (frontend + backend)
build:
	@echo "$(BLUE)🏗️  Build de produção...$(RESET)"
	@npm run build
	@cd $(BACKEND_DIR) && npm run build
	@echo "$(GREEN)✅ Build concluído!$(RESET)"

## clean: Remove dist, node_modules e arquivos temporários
clean:
	@echo "$(YELLOW)🧹 Limpando arquivos de build...$(RESET)"
	@rm -rf dist backend/dist
	@echo "$(GREEN)✅ Limpeza concluída.$(RESET)"

## clean-all: Remove também node_modules (reinstalação completa)
clean-all:
	@make clean
	@echo "$(YELLOW)🧹 Removendo node_modules...$(RESET)"
	@rm -rf node_modules backend/node_modules
	@echo "$(GREEN)✅ Clean completo. Execute 'make install' para reinstalar.$(RESET)"

## install: Instala todas as dependências
install:
	@echo "$(BLUE)📦 Instalando dependências...$(RESET)"
	@npm install
	@cd $(BACKEND_DIR) && npm install
	@echo "$(GREEN)✅ Dependências instaladas!$(RESET)"

## db-reset: Reseta o banco de dados (apenas desenvolvimento!)
db-reset:
	@echo "$(RED)⚠️  ATENÇÃO: Isso irá RESETAR o banco de dados!$(RESET)"
	@read -p "Confirma? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		cd $(BACKEND_DIR) && npx prisma migrate reset; \
		echo "$(GREEN)✅ Banco resetado.$(RESET)"; \
	else \
		echo "$(YELLOW)Operação cancelada.$(RESET)"; \
	fi

## check: Verifica saúde do ambiente de desenvolvimento
check:
	@echo "$(BLUE)🏥 Verificando ambiente...$(RESET)"
	@node --version
	@npm --version
	@docker --version
	@docker compose version
	@echo ""
	@docker compose -f $(COMPOSE_FILE) ps
