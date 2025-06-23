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
        // Trouver le serveur par son token
        $server = Server::where('token', $serverToken)->first();

        if (!$server) {
            abort(404, 'Server token not found');
        }

        $project = $server->project;
        $baseUrl = config('app.url');
        $apiUrl = "{$baseUrl}/api/projects";

        $script = <<<BASH
#!/bin/bash

# Script d'installation automatique Monitorly
# Serveur: {$server->name}
# Projet: {$project->name}

set -e

echo "🚀 Installation Monitorly Probe pour: {$server->name}"
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
# Configuration Monitorly - {$server->name}
machine_name: "{$server->name}"

collection:
  # Métriques système de base
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

  # Activité utilisateur (sessions SSH, etc.)
  user_activity:
    enabled: true
    interval: 2m

  # Tentatives de connexion échouées
  login_failures:
    enabled: true
    interval: 5m

  # Surveillance des ports ouverts
  port:
    enabled: true
    interval: 10m

sender:
  target: "api"
  send_interval: 2m

api:
  url: "{$apiUrl}"
  project_id: "{$project->id}"
  application_token: "{$project->api_key}"
  encryption_key: "{$project->encryption_key}"

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
  "machine_name": "{$server->name}",
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
      "{$apiUrl}/{$project->id}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer {$project->api_key}" \
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
    echo "🌐 Tableau de bord: {$baseUrl}/projects/{$project->id}/servers"
    echo ""
    echo "📊 Métriques collectées:"
    echo "  • CPU, RAM, Disk (métriques temps réel)"
    echo "  • Informations système (OS, CPU, mémoire totale)"
    echo "  • Activité utilisateur et sécurité"
    echo "  • Surveillance des connexions et ports"
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
echo "🎉 Installation terminée pour: {$server->name}"
echo "Les métriques apparaîtront dans votre tableau de bord dans 1-2 minutes."
BASH;

        return response($script, 200, [
            'Content-Type' => 'text/plain',
            'Content-Disposition' => 'inline; filename="install-' . $server->name . '.sh"'
        ]);
    }
}
