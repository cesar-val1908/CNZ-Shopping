#!/usr/bin/env bash

if [ ! -d "venv" ]; then
    echo -e "Please create a virtual environment first.\nRun 'python -m venv venv'."
    exit 1
fi

if [ -z $VIRTUAL_ENV ]; then
    echo -e "Please activate the virtual environment first.\nRun 'source venv/bin/activate'."
    exit 1
fi

python -m pip install -r requirements.txt

# Source environment variables from .env file
if [ -f .env ]; then
    set -o allexport
    source .env
    set +o allexport
fi

waitress-serve --listen=0.0.0.0:$PORT main:app
