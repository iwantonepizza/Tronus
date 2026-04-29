#!/bin/sh
set -eu

python manage.py migrate
python manage.py collectstatic --noinput

exec "$@"
