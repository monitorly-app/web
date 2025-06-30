<?php

namespace App\Http\Controllers;

use App\Models\Server;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class InstallController extends Controller
{
  /**
   * Générer le script d'installation pour un serveur spécifique
   */
  public function generateScript(Request $request, string $serverToken): Response
  {
    // Vérifier d'abord si c'est un token de serveur existant
    $server = Server::where('token', $serverToken)->first();

    if ($server) {
      // Serveur existant - utiliser l'ancien système
      return $this->generateExistingServerScript($server);
    }

    // Nouveau système - récupérer depuis la session
    $pendingServer = session('pending_server');

    if (!$pendingServer || $pendingServer['token'] !== $serverToken) {
      abort(404, 'Server configuration not found or expired');
    }

    $organization = \App\Models\Organization::findOrFail($pendingServer['organization_id']);
    $serverName = $pendingServer['name'];
    $selectedMetrics = $pendingServer['metrics'];

    return $this->generateDynamicScript($organization, $serverName, $serverToken, $selectedMetrics);
  }

  /**
   * Générer le script pour un serveur existant (ancien système)
   */
  private function generateExistingServerScript(Server $server): Response
  {
    $organization = $server->organization;
    $baseUrl = config('app.url');
    $apiUrl = "{$baseUrl}/api/organizations";

    $script = <<<BASH
#!/bin/bash

# Script d'installation automatique Monitorly
# Serveur: {$server->name}
# Organisation: {$organization->name}

set -e

echo "🚀 Installation Monitorly Probe pour: {$server->name}"
echo "📡 Serveur: {$baseUrl}"

# 1. Installer la probe Monitorly
echo "📦 Installation de la probe..."
if ! curl -sSL https://raw.githubusercontent.com/monitorly-app/probe/master/install.sh | bash; then
    echo "❌ Erreur lors de l'installation de la probe"
    exit 1
fi

# Configuration par défaut (toutes les métriques)
cat > \$HOME/.monitorly/config.yaml << 'EOF'
machine_name: "{$server->name}"

collection:
  cpu:
    enabled: true
    interval: 30s
  ram:
    enabled: true
    interval: 30s
  disk:
    enabled: true
    interval: 60s
    mount_points:
      - path: "/"
        label: "root"
        collect_usage: true
        collect_percent: true
  user_activity:
    enabled: true
    interval: 2m
  login_failures:
    enabled: true
    interval: 5m
  port:
    enabled: true
    interval: 10m

sender:
  target: "api"
  send_interval: 2m

api:
  url: "{$apiUrl}"
  organization_id: "{$organization->id}"
  application_token: "{$organization->api_key}"
  encryption_key: "{$organization->encryption_key}"

log_file:
  path: "\$HOME/.monitorly/metrics.log"

logging:
  file_path: "\$HOME/.monitorly/monitorly.log"
EOF

echo "✅ Configuration par défaut appliquée"
echo "🎉 Installation terminée pour: {$server->name}"
BASH;

    return response($script, 200, [
      'Content-Type' => 'text/plain',
      'Content-Disposition' => 'inline; filename="install-' . $server->name . '.sh"'
    ]);
  }

  /**
   * Générer le script dynamique basé sur les métriques sélectionnées
   */
  private function generateDynamicScript($organization, $serverName, $serverToken, $selectedMetrics): Response
  {
    $baseUrl = config('app.url');
    $apiUrl = "{$baseUrl}/api/organizations";

    // Générer la configuration des métriques
    $metricsConfig = $this->generateMetricsConfig($selectedMetrics);

    $script = <<<BASH
#!/bin/bash

# Script d'installation automatique Monitorly
# Serveur: {$serverName}
# Organisation: {$organization->name}

set -e

echo "🚀 Installation Monitorly Probe pour: {$serverName}"
echo "📡 Serveur: {$baseUrl}"

# 1. Installer la probe Monitorly
echo "📦 Installation de la probe..."
if ! curl -sSL https://raw.githubusercontent.com/monitorly-app/probe/master/install.sh | bash; then
    echo "❌ Erreur lors de l'installation de la probe"
    exit 1
fi

# 2. Attendre que l'installation soit terminée
sleep 2

# 3. Configurer automatiquement
echo "⚙️  Configuration automatique..."
mkdir -p \$HOME/.monitorly

cat > \$HOME/.monitorly/config.yaml << 'EOF'
# Configuration Monitorly - {$serverName}
machine_name: "{$serverName}"

collection:
{$metricsConfig}

sender:
  target: "api"
  send_interval: 2m

api:
  url: "{$apiUrl}"
  organization_id: "{$organization->id}"
  application_token: "{$organization->api_key}"
  encryption_key: "{$organization->encryption_key}"

log_file:
  path: "\$HOME/.monitorly/metrics.log"

logging:
  file_path: "\$HOME/.monitorly/monitorly.log"
EOF

# 4. Fonction pour envoyer les informations système
send_system_info() {
    echo "📋 Collecte des informations système..."
    
    # Collecter les informations système
    if [ -f /etc/os-release ]; then
        OS_INFO=\$(grep PRETTY_NAME /etc/os-release | cut -d'"' -f2)
    elif [ -f /etc/debian_version ]; then
        OS_INFO="Debian \$(cat /etc/debian_version)"
    else
        OS_INFO="Linux Unknown"
    fi
    
    KERNEL=\$(uname -r)
    
    # CPU Info spécial pour Raspberry Pi
    if [ -f /proc/cpuinfo ]; then
        CPU_MODEL=\$(grep -E "^(model name|Processor)" /proc/cpuinfo | head -1 | cut -d':' -f2 | sed 's/^ *//' | sed 's/ *\$//')
        if [ -z "\$CPU_MODEL" ] || [ "\$CPU_MODEL" = "" ]; then
            CPU_MODEL=\$(grep "^Hardware" /proc/cpuinfo | cut -d':' -f2 | sed 's/^ *//')
        fi
        if [ -z "\$CPU_MODEL" ] || [ "\$CPU_MODEL" = "" ]; then
            CPU_MODEL="ARM Processor"
        fi
    else
        CPU_MODEL="Unknown"
    fi
    
    CPU_CORES=\$(nproc)
    TOTAL_MEMORY=\$(awk '/MemTotal/ {print \$2 * 1024}' /proc/meminfo)
    TOTAL_DISK=\$(df / | tail -1 | awk '{print \$2 * 1024}')
    HOSTNAME=\$(hostname)
    
    echo "  • OS: \$OS_INFO"
    echo "  • CPU: \$CPU_MODEL (\$CPU_CORES cores)"
    echo "  • Memory: \$(echo \$TOTAL_MEMORY | awk '{printf "%.1f GB", \$1/1024/1024/1024}')"
    echo "  • Disk: \$(echo \$TOTAL_DISK | awk '{printf "%.1f GB", \$1/1024/1024/1024}')"
    
    # Créer le payload JSON pour les informations système
    SYSTEM_PAYLOAD=\$(cat <<EOFPAYLOAD
{
  "machine_name": "{$serverName}",
  "metrics": [
    {
      "timestamp": "\$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
      "category": "system",
      "name": "system_info",
      "value": {
        "os": "\$OS_INFO",
        "kernel": "\$KERNEL",
        "cpu_model": "\$CPU_MODEL",
        "cpu_cores": \$CPU_CORES,
        "total_memory": \$TOTAL_MEMORY,
        "total_disk": \$TOTAL_DISK,
        "hostname": "\$HOSTNAME"
      }
    }
  ]
}
EOFPAYLOAD
)
    
    # Envoyer les informations système
    echo "📡 Envoi des informations système..."
    RESPONSE=\$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
      "{$apiUrl}/{$organization->id}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer {$organization->api_key}" \
      -H "User-Agent: Monitorly-Probe/v0.1.0" \
      -d "\$SYSTEM_PAYLOAD")
    
    HTTP_STATUS=\$(echo \$RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ "\$HTTP_STATUS" -eq 200 ] || [ "\$HTTP_STATUS" -eq 201 ]; then
        echo "✅ Informations système envoyées avec succès !"
    else
        echo "⚠️  Impossible d'envoyer les informations système (HTTP \$HTTP_STATUS)"
        echo "📝 Les informations seront collectées automatiquement par la probe"
    fi
}

# 5. Corriger le service systemd
echo "🔧 Configuration du service..."
if [ -f /etc/systemd/system/monitorly-probe.service ]; then
    sudo sed -i "s|ExecStart=/usr/local/bin/monitorly-probe|ExecStart=/usr/local/bin/monitorly-probe -config \$HOME/.monitorly/config.yaml|" /etc/systemd/system/monitorly-probe.service
fi

# 6. Envoyer les informations système AVANT de démarrer la probe
send_system_info

# 7. Recharger et démarrer
echo "🔄 Démarrage du service..."
sudo systemctl daemon-reload
sudo systemctl enable monitorly-probe
sudo systemctl restart monitorly-probe

# 8. Vérifier le statut
sleep 3
if sudo systemctl is-active --quiet monitorly-probe; then
    echo "✅ Installation réussie !"
    echo "📊 Probe active et en cours d'envoi des métriques"
    echo "🌐 Tableau de bord: {$baseUrl}/organizations/{$organization->id}/servers"
    echo ""
    echo "📊 Métriques configurées:"
{$this->generateMetricsDescription($selectedMetrics)}
    echo ""
    echo "📋 Statut du service:"
    sudo systemctl status monitorly-probe --no-pager -l
else
    echo "❌ Erreur lors du démarrage du service"
    echo "🔍 Logs d'erreur:"
    sudo journalctl -u monitorly-probe --no-pager -n 10
    exit 1
fi

echo ""
echo "🎉 Installation terminée pour: {$serverName}"
echo "Les métriques apparaîtront dans votre tableau de bord dans 1-2 minutes."
BASH;

    return response($script, 200, [
      'Content-Type' => 'text/plain',
      'Content-Disposition' => 'inline; filename="install-' . $serverName . '.sh"'
    ]);
  }

  /**
   * Générer la configuration YAML pour les métriques sélectionnées
   */
  private function generateMetricsConfig(array $selectedMetrics): string
  {
    $config = [];

    if (in_array('cpu', $selectedMetrics)) {
      $config[] = "  # Métriques CPU";
      $config[] = "  cpu:";
      $config[] = "    enabled: true";
      $config[] = "    interval: 30s";
      $config[] = "";
    }

    if (in_array('ram', $selectedMetrics)) {
      $config[] = "  # Métriques mémoire";
      $config[] = "  ram:";
      $config[] = "    enabled: true";
      $config[] = "    interval: 30s";
      $config[] = "";
    }

    if (in_array('disk', $selectedMetrics)) {
      $config[] = "  # Métriques disque";
      $config[] = "  disk:";
      $config[] = "    enabled: true";
      $config[] = "    interval: 60s";
      $config[] = "    mount_points:";
      $config[] = "      - path: \"/\"";
      $config[] = "        label: \"root\"";
      $config[] = "        collect_usage: true";
      $config[] = "        collect_percent: true";
      $config[] = "";
    }

    if (in_array('network', $selectedMetrics)) {
      $config[] = "  # Métriques réseau";
      $config[] = "  network:";
      $config[] = "    enabled: true";
      $config[] = "    interval: 60s";
      $config[] = "";
    }

    if (in_array('user_activity', $selectedMetrics)) {
      $config[] = "  # Activité utilisateur";
      $config[] = "  user_activity:";
      $config[] = "    enabled: true";
      $config[] = "    interval: 2m";
      $config[] = "";
    }

    if (in_array('login_failures', $selectedMetrics)) {
      $config[] = "  # Tentatives de connexion échouées";
      $config[] = "  login_failures:";
      $config[] = "    enabled: true";
      $config[] = "    interval: 5m";
      $config[] = "";
    }

    if (in_array('port_monitoring', $selectedMetrics)) {
      $config[] = "  # Surveillance des ports";
      $config[] = "  port:";
      $config[] = "    enabled: true";
      $config[] = "    interval: 10m";
      $config[] = "";
    }

    return implode("\n", $config);
  }

  /**
   * Générer la description des métriques pour l'affichage final
   */
  private function generateMetricsDescription(array $selectedMetrics): string
  {
    $descriptions = [];

    if (in_array('cpu', $selectedMetrics)) {
      $descriptions[] = "    echo \"  • CPU Usage (temps réel)\"";
    }
    if (in_array('ram', $selectedMetrics)) {
      $descriptions[] = "    echo \"  • Memory Usage (temps réel)\"";
    }
    if (in_array('disk', $selectedMetrics)) {
      $descriptions[] = "    echo \"  • Disk Usage (espace disque)\"";
    }
    if (in_array('network', $selectedMetrics)) {
      $descriptions[] = "    echo \"  • Network Traffic (bande passante)\"";
    }
    if (in_array('user_activity', $selectedMetrics)) {
      $descriptions[] = "    echo \"  • User Activity (sessions SSH)\"";
    }
    if (in_array('login_failures', $selectedMetrics)) {
      $descriptions[] = "    echo \"  • Login Failures (tentatives échouées)\"";
    }
    if (in_array('port_monitoring', $selectedMetrics)) {
      $descriptions[] = "    echo \"  • Port Monitoring (services)\"";
    }

    return implode("\n", $descriptions);
  }
}
