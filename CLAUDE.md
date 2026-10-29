# Project: DevOps portfolio pipeline (interview demo today)

## Goal
Show a complete GitOps pipeline: push code to Git -> GitHub Actions builds an image ->
ArgoCD deploys it to Kubernetes -> Prometheus + Grafana show it's healthy.

## Environment
- Mac, Apple Silicon (arm64), 16 GB RAM (Docker Desktop gets 10 GB) -> still keep things lightweight
- Local Minikube, 3 nodes, profile name "dev-cluster" (3000 MB memory, 2 CPUs per node):
  `minikube start --driver=docker --nodes=3 --memory=3000 --cpus=2 -p dev-cluster`
  Node names: dev-cluster (control plane), dev-cluster-m02, dev-cluster-m03
- Docker images are built for linux/arm64 ONLY

## Stack
- App: Next.js (App Router, TypeScript) as frontend AND backend (Route Handlers), PostgreSQL via `pg`
- Infra: Terraform (kubernetes + helm providers) installs ArgoCD and kube-prometheus-stack
- Manifests: plain YAML + kustomization.yaml in k8s-manifests/
- CI: GitHub Actions on runner ubuntu-24.04-arm
- CD: ArgoCD watching k8s-manifests/ (GitOps)
- Observability: kube-prometheus-stack (Prometheus + Grafana), app exposes /api/metrics via prom-client

## Folder structure
app/                  Next.js app + Dockerfile
terraform/            provider.tf, main.tf
k8s-manifests/        db, app, servicemonitor, kustomization.yaml
argocd/               argocd-app.yaml (applied once, NOT inside k8s-manifests/)
.github/workflows/    ci.yml

## Rules
- Never deploy with the :latest tag. Images are tagged with the short git commit SHA;
  CI updates the tag in k8s-manifests/kustomization.yaml and commits it back to Git.
- Keep resource requests/limits small (each node has only 3000 MB).
- Postgres must be pinned to node "dev-cluster" with a nodeSelector
  (kubernetes.io/hostname: dev-cluster), because minikube's hostpath storage is node-local:
  if the pod moved to another node, it would lose its data.
- I am learning DevOps: after each step, explain briefly in plain words what you did and why,
  so I can explain it in an interview.
- Only do the step I ask for. Don't jump ahead.
- Never add Co-Authored-By: Claude, 'Generated with Claude Code', claude.ai links, or any AI
  attribution to commit messages, PR descriptions, or code comments. All commits are authored by me only.
