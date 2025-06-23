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

  # Informations système (collectées une fois au démarrage)
  system_info:
    enabled: true
    interval: 24h  # Collecté une fois par jour pour les mises à jour

  # Activité réseau
  network:
    enabled: true
    interval: 30s

  # Nombre de processus
  processes:
    enabled: true
    interval: 60s

  # Uptime du système
  uptime:
    enabled: true
    interval: 5m

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

# 4. Corriger le service systemd
echo "🔧 Configuration du service..."
if [ -f /etc/systemd/system/monitorly-probe.service ]; then
    sudo sed -i "s|ExecStart=/usr/local/bin/monitorly-probe|ExecStart=/usr/local/bin/monitorly-probe -config \$HOME/.monitorly/config.yaml|" /etc/systemd/system/monitorly-probe.service
fi

# 5. Recharger et démarrer
echo "🔄 Démarrage du service..."
sudo systemctl daemon-reload
sudo systemctl enable monitorly-probe
sudo systemctl restart monitorly-probe

# 6. Vérifier le statut
sleep 3
if sudo systemctl is-active --quiet monitorly-probe; then
    echo "✅ Installation réussie !"
    echo "📊 Probe active et en cours d'envoi des métriques"
    echo "🌐 Tableau de bord: {$baseUrl}/projects/{$project->id}/servers"
    echo ""
    echo "📊 Métriques collectées:"
    echo "  • CPU, RAM, Disk (métriques de base)"
    echo "  • Informations système (OS, CPU, mémoire totale)"
    echo "  • Activité réseau (I/O)"
    echo "  • Nombre de processus actifs"
    echo "  • Uptime du système"
    echo "  • Activité utilisateur"
    echo "  • Surveillance des connexions"
    echo "  • Ports ouverts"
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
