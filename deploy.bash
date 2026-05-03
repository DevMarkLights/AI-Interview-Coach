#!/bin/bash
cd /mnt/nvme/AI-Interview-Coach

git pull

cd frontend
npm run build

cd ../backend
.venv/bin/pip install -r requirements.txt --quiet

rm -rf dist

cd ../frontend
cp -r dist ../backend

sudo systemctl restart aiInterviewCoach.service
