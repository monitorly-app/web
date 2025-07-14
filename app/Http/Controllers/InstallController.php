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
  public function generateScript(string $serverToken): Response
  {
    // Vérifier d'abord si c'est un token de serveur existant
    $server = Server::where('token', $serverToken)->first();

    if ($server) {
      return $this->generateServerScript($server->organization, $server->name, $this->getAllMetrics(), $server->token, $server->id);
    }

    // Nouveau serveur - récupérer depuis la session
    $pendingServer = session('pending_server');

    if (!$pendingServer || $pendingServer['token'] !== $serverToken) {
      abort(404, 'Server configuration not found or expired');
    }

    $organization = \App\Models\Organization::findOrFail($pendingServer['organization_id']);
    $serverName = $pendingServer['name'];
    $selectedMetrics = $pendingServer['metrics'];

    // Pour les nouveaux serveurs, nous devons créer l'enregistrement pour obtenir l'UUID
    $server = Server::create([
      'name' => $serverName,
      'token' => $serverToken,
      'organization_id' => $organization->id,
      'status' => 'pending',
      'monitoring_config' => json_encode($selectedMetrics)
    ]);
    
    // Nettoyer la session
    session()->forget('pending_server');
    
    return $this->generateServerScript($organization, $serverName, $selectedMetrics, $serverToken, $server->id);
  }

  /**
   * Retourner toutes les métriques disponibles pour les serveurs existants
   */
  private function getAllMetrics(): array
  {
    return ['cpu', 'ram', 'disk', 'network', 'user_activity', 'login_failures', 'port_monitoring'];
  }

  /**
   * Générer le script d'installation unifié
   */
  private function generateServerScript($organization, $serverName, $selectedMetrics, $serverToken = null, $serverId = null): Response
  {
    $baseUrl = config('app.url');
    $apiUrl = "{$baseUrl}/api/{$organization->id}/servers/{$serverToken}/metrics";
    $metricsConfig = $this->generateMetricsConfig($selectedMetrics);

    $script = <<<BASH
#!/bin/bash

# Script d'installation Monitorly - {$serverName}
# Organisation: {$organization->name}

set -e

echo "🚀 Installation Monitorly Probe pour: {$serverName}"
echo "📡 Serveur: {$baseUrl}"

# 1. Installer la probe depuis GitHub
echo "📦 Installation de la probe..."
if ! curl -sSL https://raw.githubusercontent.com/monitorly-app/probe/master/scripts/install.sh | bash; then
    echo "❌ Erreur lors de l'installation de la probe"
    exit 1
fi

# 2. Configurer la probe
echo "⚙️  Configuration..."
sudo tee /etc/monitorly/config.yaml > /dev/null <<'EOF'
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
  server_id: "{$serverId}"
  application_token: "{$organization->api_key}"
  encryption_key: "{$organization->encryption_key}"

logging:
  file_path: "/var/log/monitorly/monitorly.log"
EOF

# 3. Démarrer le service
echo "🔄 Démarrage du service..."
sudo systemctl enable monitorly-probe
sudo systemctl restart monitorly-probe

# 4. Vérifier le statut
sleep 3
if sudo systemctl is-active --quiet monitorly-probe; then
    echo "✅ Installation réussie !"
    echo "📊 Probe active et en cours d'envoi des métriques"
    echo "🌐 Tableau de bord: {$baseUrl}/organizations/{$organization->id}/servers"
    echo ""
    echo "📊 Métriques configurées:"
{$this->generateMetricsDescription($selectedMetrics)}
    echo ""
    echo "📋 Commandes utiles:"
    echo "  • Status: sudo systemctl status monitorly-probe"
    echo "  • Logs: sudo journalctl -u monitorly-probe -f"
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
