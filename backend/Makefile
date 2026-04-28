COMPOSE := docker compose
APP_SERVICE := web

.PHONY: up down migrate test lint shell admin

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

migrate:
	$(COMPOSE) up -d db
	$(COMPOSE) run --rm $(APP_SERVICE) python manage.py migrate

test:
	$(COMPOSE) up -d db
	$(COMPOSE) run --rm $(APP_SERVICE) python -m pytest

lint:
	$(COMPOSE) run --rm $(APP_SERVICE) ruff check .

shell:
	$(COMPOSE) up -d db
	$(COMPOSE) run --rm $(APP_SERVICE) python manage.py shell

admin:
	$(COMPOSE) up -d db
	$(COMPOSE) run --rm $(APP_SERVICE) python manage.py createsuperuser
