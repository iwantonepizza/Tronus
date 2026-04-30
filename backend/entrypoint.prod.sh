#!/bin/sh
set -eu

python manage.py migrate
python manage.py collectstatic --noinput
python manage.py backfill_player_group

exec "$@"
