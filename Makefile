.PHONY: up down build logs ps clean

# Override if your system uses the legacy docker-compose binary:
#   make up DC=docker-compose
DC ?= docker compose

up:
	$(DC) up --build

down:
	$(DC) down

build:
	$(DC) build

logs:
	$(DC) logs -f --tail=200

ps:
	$(DC) ps

clean:
	$(DC) down -v --remove-orphans
