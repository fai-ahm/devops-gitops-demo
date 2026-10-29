# ---------------------------------------------------------------------------
# Namespaces
# ---------------------------------------------------------------------------
resource "kubernetes_namespace" "argocd" {
  metadata {
    name = "argocd"
  }
}

resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

# The app namespace is created here but its contents are owned by ArgoCD (GitOps).
resource "kubernetes_namespace" "app" {
  metadata {
    name = "app"
  }
}

# ---------------------------------------------------------------------------
# Monitoring: Prometheus + Grafana (kube-prometheus-stack), trimmed for a laptop
# ---------------------------------------------------------------------------
resource "helm_release" "kube_prometheus_stack" {
  name       = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  version    = "92.14.1"

  timeout = 900
  wait    = true

  values = [yamlencode({
    alertmanager = { enabled = false }

    # Control-plane components on minikube listen on localhost only, so Prometheus
    # can't scrape them; leaving them on just produces permanently "down" targets.
    kubeEtcd              = { enabled = false }
    kubeScheduler         = { enabled = false }
    kubeControllerManager = { enabled = false }
    kubeProxy             = { enabled = false }

    prometheus = {
      prometheusSpec = {
        retention = "1d"
        # By default Prometheus only picks up ServiceMonitors carrying this Helm
        # release's label. false = pick up ANY ServiceMonitor/PodMonitor in the cluster.
        serviceMonitorSelectorNilUsesHelmValues = false
        podMonitorSelectorNilUsesHelmValues     = false
        resources = {
          requests = { cpu = "100m", memory = "256Mi" }
          limits   = { memory = "768Mi" }
        }
      }
    }

    prometheusOperator = {
      resources = {
        requests = { cpu = "50m", memory = "64Mi" }
        limits   = { memory = "128Mi" }
      }
    }

    kube-state-metrics = {
      resources = {
        requests = { cpu = "10m", memory = "32Mi" }
        limits   = { memory = "96Mi" }
      }
    }

    prometheus-node-exporter = {
      resources = {
        requests = { cpu = "10m", memory = "16Mi" }
        limits   = { memory = "48Mi" }
      }
    }

    grafana = {
      adminPassword = "prom-operator"
      # Grafana 12 needs ~300Mi just to start; at 256Mi it thrashes and never becomes ready
      resources = {
        requests = { cpu = "50m", memory = "256Mi" }
        limits   = { memory = "512Mi" }
      }
      sidecar = {
        dashboards = {
          # Load dashboard ConfigMaps from every namespace (e.g. the app's own dashboard)
          searchNamespace = "ALL"
        }
      }
    }
  })]
}

# ---------------------------------------------------------------------------
# GitOps: ArgoCD
# ---------------------------------------------------------------------------
resource "helm_release" "argocd" {
  name       = "argocd"
  namespace  = kubernetes_namespace.argocd.metadata[0].name
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "10.11.6"

  timeout = 900
  wait    = true

  values = [yamlencode({
    dex           = { enabled = false } # no SSO needed; we log in as the built-in admin
    notifications = { enabled = false }

    configs = {
      params = {
        # Serve the UI over plain HTTP so `kubectl port-forward` works without TLS errors
        "server.insecure" = true
      }
    }

    controller = {
      resources = {
        requests = { cpu = "100m", memory = "256Mi" }
        limits   = { memory = "512Mi" }
      }
    }
    repoServer = {
      resources = {
        requests = { cpu = "50m", memory = "64Mi" }
        limits   = { memory = "256Mi" }
      }
    }
    server = {
      resources = {
        requests = { cpu = "50m", memory = "64Mi" }
        limits   = { memory = "128Mi" }
      }
    }
    applicationSet = {
      resources = {
        requests = { cpu = "10m", memory = "32Mi" }
        limits   = { memory = "128Mi" }
      }
    }
    redis = {
      resources = {
        requests = { cpu = "10m", memory = "32Mi" }
        limits   = { memory = "64Mi" }
      }
    }
  })]
}
