# Monitorly Probe Technical Specification

## Overview

The Monitorly Probe is a Go-based monitoring agent that collects system metrics and operational data from servers and sends them to the Monitorly API or logs them to files. This document provides a comprehensive technical specification for implementing the API endpoints that interact with the probe.

## Table of Contents

1. [Probe Architecture](#probe-architecture)
2. [Configuration](#configuration)
3. [Metrics Collection](#metrics-collection)
4. [Data Structures](#data-structures)
5. [API Endpoints](#api-endpoints)
6. [Authentication](#authentication)
7. [Encryption](#encryption)
8. [Error Handling](#error-handling)
9. [Installation](#installation)
10. [Update System](#update-system)

## Probe Architecture

### Core Components

- **Main Application**: Command-line interface with config management and signal handling
- **Collectors**: Modular system for gathering different types of metrics
- **Senders**: Configurable output targets (API or file logging)
- **Config Watcher**: Monitors configuration changes for hot-reloading
- **Update System**: Automatic self-updating mechanism
- **Encryption**: Optional request body encryption for premium features

### Command Line Flags

```bash
monitorly-probe [options]

Options:
  -config string          Path to configuration file (default: "config.yaml")
  -version               Show version information and exit
  -check-update          Check for updates and exit
  -skip-update-check     Skip automatic update check at startup
  -update                Force update if available
```

## Configuration

### Configuration File Structure (YAML)

```yaml
# Optional: Machine name to differentiate metrics from different servers
machine_name: "web-server-01"

# Collection configuration
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
      - path: "/var"
        label: "var"
        collect_usage: true
        collect_percent: true

  service:
    enabled: true
    interval: 60s
    services:
      - name: "nginx"
        label: "Nginx Web Server"
      - name: "postgresql"
        label: "PostgreSQL Database"

  user_activity:
    enabled: true
    interval: 60s

  login_failures:
    enabled: true
    interval: 60s

  port:
    enabled: true
    interval: 60s

# Sender configuration
sender:
  target: "api"  # "api" or "log_file"
  send_interval: 5m

# API configuration (required if sender.target is "api")
api:
  url: "https://api.monitorly.app"
  organization_id: "your_organization_id"
  server_id: "your_server_id"
  application_token: "your_application_token_here"
  encryption_key: "your_encryption_key" 

# Log file configuration (required if sender.target is "log_file")
log_file:
  path: "logs/metrics.log"

# Application logging
logging:
  file_path: "logs/monitorly.log"

# Update configuration
updates:
  enabled: true
  check_time: "03:00"  # HH:MM format
  retry_delay: 1h

### Automatic Configuration Updates

Monitorly Probe supports automatic configuration updates from the API:

- After every API request (metrics or system info), the probe checks the `X-Configuration-Last-Update` response header.
- If the timestamp in this header is newer than the local configuration file's last modification time, the probe will:
  1. Fetch the latest configuration from `GET /api/{organization_id}/servers/{server_id}/config`.
  2. Overwrite the local configuration file with the new content.
  3. Automatically restart itself to apply the new configuration.
- This ensures the probe always runs with the latest configuration provided by the server, with no manual intervention required.

### Manual Configuration Change Validation

When the probe detects a manual change to the local configuration file (through file system monitoring), it automatically validates the new configuration with the API before applying it:

1. **Change Detection**: The probe monitors the configuration file for modifications using file system watchers.
2. **API Validation**: When a change is detected, the probe sends the new configuration to the API for validation via `POST /api/{organization_id}/servers/{server_id}/config`.
3. **Response Handling**: Based on the API response, the probe takes different actions:
   - **200 OK**: Configuration is valid → Restart to apply changes
   - **205 Reset Content**: Configuration is valid but the API has made adjustments → Log warning, update local config with API response, then restart
   - **422 Unprocessable Entity**: Configuration is invalid → Log fatal error and stop execution
   - **Other errors**: Handle according to standard error handling procedures

This ensures that all configuration changes are validated against the organization's plan limits and business rules before being applied.
```

### Configuration Search Paths

The probe searches for configuration files in the following order:

1. Path specified by `-config` flag
2. `~/.monitorly/config.yaml`
3. `./config.yaml` (current directory)
4. `./configs/config.yaml`
5. `/etc/monitorly/config.yaml`

## Metrics Collection

### Available Collectors

#### 1. CPU Metrics
- **Name**: `cpu`
- **Data**: CPU usage percentage per core and overall
- **Interval**: Configurable (default: 30s)

#### 2. RAM Metrics
- **Name**: `ram`
- **Data**: Memory usage, available memory, swap usage
- **Interval**: Configurable (default: 30s)

#### 3. Disk Metrics
- **Name**: `disk`
- **Data**: Disk usage per mount point, available space, usage percentage
- **Interval**: Configurable (default: 60s)
- **Configuration**: Configurable mount points with labels

#### 4. Service Monitoring
- **Name**: `service`
- **Data**: Service status (active/inactive) for specified services
- **Interval**: Configurable (default: 60s)
- **Configuration**: List of services to monitor

#### 5. User Activity
- **Name**: `user_activity`
- **Data**: Currently logged-in users, login sessions
- **Interval**: Configurable (default: 60s)

#### 6. Login Failures
- **Name**: `login_failures`
- **Data**: Failed login attempts from system logs
- **Interval**: Configurable (default: 60s)

#### 7. Port Monitoring
- **Name**: `port`
- **Data**: Open ports and listening services
- **Interval**: Configurable (default: 60s)

#### 8. System Information
- **Name**: `system_info`
- **Data**: Static system information sent once at startup
- **Frequency**: Once at startup and on restarts

## Data Structures

### Base Metric Structure

```go
type Metrics struct {
    Timestamp time.Time      `json:"timestamp"`
    Category  MetricCategory `json:"category"`
    Name      MetricName     `json:"name"`
    Metadata  MetricMetadata `json:"metadata,omitempty"`
    Value     MetricValue    `json:"value"`
}

type MetricCategory string
type MetricName string
type MetricMetadata map[string]string
type MetricValue interface{}
```

### Metric Categories and Names

```go
const (
    CategorySystem MetricCategory = "system"

    NameCPU           MetricName = "cpu"
    NameRAM           MetricName = "ram"
    NameDisk          MetricName = "disk"
    NameService       MetricName = "service"
    NameUserActivity  MetricName = "user_activity"
    NameLoginFailures MetricName = "login_failures"
    NamePort          MetricName = "port"
    NameSystemInfo    MetricName = "system_info"
)
```

### System Information Structure

```go
type SystemInfo struct {
    Hostname      string     `json:"hostname"`
    PublicIP      string     `json:"public_ip"`
    OS            string     `json:"os"`
    OSVersion     string     `json:"os_version"`
    KernelVersion string     `json:"kernel_version"`
    CPU           CPUInfo    `json:"cpu"`
    RAM           RAMInfo    `json:"ram"`
    Disks         []DiskInfo `json:"disks"`
    Services      []string   `json:"services"`
    LastBootTime  int64      `json:"last_boot_time"`
}

type CPUInfo struct {
    Name      string  `json:"name"`
    Cores     int32   `json:"cores"`
    Frequency float64 `json:"frequency_mhz"`
}

type RAMInfo struct {
    Total uint64 `json:"total_bytes"`
}

type DiskInfo struct {
    Mountpoint string `json:"mountpoint"`
    Label      string `json:"label"`
    Total      uint64 `json:"total_bytes"`
}
```

### Example Metric Data

#### CPU Metric
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "category": "system",
  "name": "cpu",
  "value": {
    "usage_percent": 23.45,
    "cores": [
      {"core": 0, "usage_percent": 25.2},
      {"core": 1, "usage_percent": 21.7}
    ]
  }
}
```

#### RAM Metric
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "category": "system",
  "name": "ram",
  "value": {
    "total_bytes": 16777216000,
    "available_bytes": 8388608000,
    "usage_percent": 50.0,
    "swap_total_bytes": 4294967296,
    "swap_used_bytes": 0
  }
}
```

#### Disk Metric
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "category": "system",
  "name": "disk",
  "metadata": {
    "mountpoint": "/",
    "label": "root"
  },
  "value": {
    "total_bytes": 107374182400,
    "available_bytes": 53687091200,
    "usage_percent": 50.0
  }
}
```

#### Service Metric
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "category": "system",
  "name": "service",
  "metadata": {
    "service_name": "nginx",
    "label": "Nginx Web Server"
  },
  "value": {
    "status": "active",
    "running": true
  }
}
```

## API Endpoints

### 1. System Information Endpoint

**Endpoint**: `POST /api/{organization_id}/servers/{server_id}/info`

**Purpose**: Receives initial system information when the probe starts

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {application_token}
Content-Encoding: gzip (always present)
```

**Request Body**:
```json
{
  "machine_name": "web-server-01",
  "metrics": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "category": "system",
      "name": "system_info",
      "value": {
        "hostname": "web-server-01",
        "public_ip": "203.0.113.1",
        "os": "linux",
        "os_version": "Ubuntu 22.04.3 LTS",
        "kernel_version": "5.15.0-91-generic",
        "cpu": {
          "name": "Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz",
          "cores": 4,
          "frequency_mhz": 2400.0
        },
        "ram": {
          "total_bytes": 16777216000
        },
        "disks": [
          {
            "mountpoint": "/",
            "label": "/dev/sda1",
            "total_bytes": 107374182400
          }
        ],
        "services": ["nginx", "postgresql", "ssh"],
        "last_boot_time": 1705312200
      }
    }
  ]
}
```

### 2. Metrics Endpoint

**Endpoint**: `POST /api/{organization_id}/servers/{server_id}/metrics`

**Purpose**: Receives regular metric data from the probe

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {application_token}
Content-Encoding: gzip (always present)
```

**Request Body**:
```json
{
  "machine_name": "web-server-01",
  "metrics": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "category": "system",
      "name": "cpu",
      "value": {
        "usage_percent": 23.45
      }
    },
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "category": "system",
      "name": "ram",
      "value": {
        "total_bytes": 16777216000,
        "available_bytes": 8388608000,
        "usage_percent": 50.0
      }
    }
  ]
}
```

### 3. Configuration Validation Endpoint

**Endpoint**: `POST /api/{organization_id}/servers/{server_id}/config`

**Purpose**: Validates configuration changes when the probe detects manual modifications to the local config file

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {application_token}
```

**Request Body**:
```json
{
  "machine_name": "web-server-01",
  "sender": {
    "target": "api",
    "send_interval": "5m"
  },
  "api": {
    "url": "https://api.monitorly.io",
    "organization_id": "550e8400-e29b-41d4-a716-446655440000",
    "server_id": "550e8400-e29b-41d4-a716-446655440001",
    "application_token": "your_application_token_here",
    "encryption_key": ""
  },
  "collection": {
    "cpu": {
      "enabled": true,
      "interval": "30s"
    },
    "ram": {
      "enabled": true,
      "interval": "30s"
    }
  },
  "logging": {
    "file_path": "logs/monitorly.log"
  },
  "updates": {
    "enabled": true,
    "check_time": "03:00",
    "retry_delay": "1h"
  }
}
```

**Response Codes**:

- **200 OK**: Configuration is valid and accepted as-is
- **205 Reset Content**: Configuration is valid but has been adjusted by the API (returns updated config)
- **422 Unprocessable Entity**: Configuration is invalid (returns validation errors)
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: Invalid authentication token
- **404 Not Found**: Organization or server not found

**Success Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Configuration is valid"
}
```

**Adjusted Configuration Response (205 Reset Content)**:
```json
{
  "status": "success",
  "message": "Configuration adjusted for plan limits",
  "config": {
    "machine_name": "web-server-01",
    "sender": {
      "target": "api",
      "send_interval": "10m"
    },
    "api": {
      "url": "https://api.monitorly.io",
      "organization_id": "550e8400-e29b-41d4-a716-446655440000",
      "server_id": "550e8400-e29b-41d4-a716-446655440001",
      "application_token": "your_application_token_here",
      "encryption_key": ""
    },
    "collection": {
      "cpu": {
        "enabled": true,
        "interval": "60s"
      },
      "ram": {
        "enabled": true,
        "interval": "60s"
      }
    }
  },
  "adjustments": [
    "Send interval increased to 10m due to Free plan limits",
    "Collection intervals increased to minimum 60s for Free plan"
  ]
}
```

**Validation Error Response (422 Unprocessable Entity)**:
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_CONFIGURATION",
    "message": "Configuration validation failed",
    "details": [
      "sender.target is required",
      "api.url must be a valid URL",
      "collection.cpu.interval must be at least 30s"
    ]
  }
}
```

### 4. Configuration Retrieval Endpoint

**Endpoint**: `GET /api/{organization_id}/servers/{server_id}/config`

**Purpose**: Retrieves the current server configuration (used for automatic config updates)

**Headers**:
```
Authorization: Bearer {application_token}
```

**Response**: Returns the complete configuration as YAML content

### Response Format

**Success Response**: `200 OK`
```json
{
  "status": "success",
  "message": "Metrics received successfully"
}
```

**Error Responses**:

- `400 Bad Request`: Invalid request format or missing required fields
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: Organization or server not found
- `412 Precondition Failed`: Encryption not available (premium feature required)
- `413 Request Entity Too Large`: Too many metrics for the current plan
- `422 Unprocessable Entity`: Configuration validation failed (for config validation endpoint)
- `429 Too Many Requests`: Rate limit exceeded (may include `X-Rate-Limit` header with recommended interval in seconds)
- `500 Internal Server Error`: Server processing error
- `503 Service Unavailable`: Server is undergoing maintenance

**Success Responses**:

- `200 OK`: Standard success response
- `205 Reset Content`: Configuration valid but adjusted (for config validation endpoint)

## Authentication

### Application Token

The probe uses Bearer token authentication:

```
Authorization: Bearer {application_token}
```

The application token should be:
- Generated by the API when a server is added to an organization
- Unique per server
- Long-lived (does not expire)
- Stored securely in the probe configuration

### Token Validation

The API should validate:
1. Token format and integrity
2. Token belongs to the specified organization and server
3. Organization and server are active and valid

## Encryption

### Premium Feature

Encryption is a premium feature that encrypts the request body before transmission.

### Encryption Process

1. **Key Validation**: Must be exactly 32 bytes
2. **Data Preparation**: Serialize metrics to JSON
3. **Encryption**: Use AES-256-GCM encryption with the provided key
4. **Request Format**: Send encrypted data in special format

### Encrypted Request Body

```json
{
  "machine_name": "web-server-01",
  "encrypted": true,
  "data": "base64_encoded_encrypted_data"
}
```

### Fallback Mechanism

If encryption fails with `412 Precondition Failed`:
1. Log warning about encryption not being available
2. Retry request without encryption
3. Continue with unencrypted transmission

### Implementation Example

```go
// Encrypt request body
func encryptRequestBody(data []byte, key string) ([]byte, error) {
    // Validate key length (32 bytes)
    if len(key) != 32 {
        return nil, fmt.Errorf("encryption key must be exactly 32 bytes")
    }

    // Perform AES-256-GCM encryption
    encryptedData, err := encryption.Encrypt(data, key)
    if err != nil {
        return nil, err
    }

    // Wrap in encrypted request format
    encryptedBody := map[string]interface{}{
        "machine_name": machineName,
        "encrypted":    true,
        "data":         encryptedData,
    }

    return json.Marshal(encryptedBody)
}
```

## Error Handling

### Probe Error Handling

1. **Network Errors**: Retry with exponential backoff
2. **Fatal Errors (401, 404, 422)**: Log error and immediately exit with failure status
3. **Warning Errors (413, 429, 503)**: Log error, buffer metrics, and continue operation
4. **Configuration Validation (205)**: Log warning about adjustments, update local config file with API response, then restart
5. **Rate Limiting (429)**: If `X-Rate-Limit` header is present, update send interval in config and restart
6. **Authentication Errors**: Log and continue (don't retry immediately)
7. **Configuration Errors**: Log and exit or use defaults
8. **Collection Errors**: Log and skip the metric

### API Error Handling

1. **Validation Errors**: Return `400` with descriptive message
2. **Authentication Errors**: Return `401` with error details (causes probe to exit)
3. **Resource Not Found**: Return `404` for invalid organization/server (causes probe to exit)
4. **Encryption Issues**: Return `412` for premium feature restrictions
5. **Plan Limits**: Return `413` when too many metrics are sent for the current plan
6. **Configuration Adjusted**: Return `205` when config is valid but adjusted for plan limits (causes probe to update config and restart)
7. **Configuration Invalid**: Return `422` for invalid configuration during validation (causes probe to exit with fatal error)
8. **Rate Limiting**: Return `429` with optional `X-Rate-Limit` header specifying recommended interval
9. **Maintenance**: Return `503` during server maintenance periods
10. **Processing Errors**: Return `500` with generic error message

### Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: metrics",
    "details": {
      "field": "metrics",
      "reason": "required"
    }
  }
}
```

### Rate Limiting Behavior

When the API returns a `429 Too Many Requests` response:

1. **Without X-Rate-Limit Header**: Probe logs the error and continues with metric buffering
2. **With X-Rate-Limit Header**: Probe automatically updates the `send_interval` in the configuration file and restarts itself

**X-Rate-Limit Header Format**: The header value should be a number representing the recommended interval in seconds.

**Example Response Headers**:
```
HTTP/1.1 429 Too Many Requests
X-Rate-Limit: 300
Content-Type: application/json
```

This tells the probe to update its send interval to 300 seconds (5 minutes).

## Installation

### Download and Installation

The probe supports multiple installation methods:

1. **Direct Download**: Binary releases for different platforms
2. **Package Managers**: DEB/RPM packages for Linux distributions
3. **Docker**: Container images for containerized deployments

### Installation Script Example

```bash
#!/bin/bash
# Download and install Monitorly Probe

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Map architecture names
case $ARCH in
    x86_64) ARCH="amd64" ;;
    aarch64) ARCH="arm64" ;;
    armv7l) ARCH="arm" ;;
esac

# Download URL
URL="https://github.com/monitorly/probe/releases/latest/download/monitorly-probe-${OS}-${ARCH}"

# Download and install
wget -O /usr/local/bin/monitorly-probe "$URL"
chmod +x /usr/local/bin/monitorly-probe

# Create directories
mkdir -p /etc/monitorly
mkdir -p /var/log/monitorly

# Copy example configuration
cp config.yaml.example /etc/monitorly/config.yaml

echo "Monitorly Probe installed successfully!"
echo "Edit /etc/monitorly/config.yaml to configure the probe"
```

### Configuration Generation

The API should provide a configuration generation endpoint:

**Endpoint**: `GET /api/{organization_id}/servers/{server_id}/config`

**Response**: Generated configuration file with pre-filled values

## Update System

### Automatic Updates

The probe includes an automatic update system with the following features:

1. **Version Checking**: Compares current version with latest release
2. **Self-Update**: Downloads and replaces the binary
3. **Scheduled Checks**: Configurable time for update checks
4. **Graceful Restart**: Exits with success code for service manager restart

### Update Configuration

```yaml
updates:
  enabled: true
  check_time: "03:00"  # Daily at 3 AM
  retry_delay: 1h      # Retry after 1 hour if update fails
```

### Update Process

1. **Check for Updates**: Query GitHub releases API
2. **Download Binary**: Download new version if available
3. **Verify Integrity**: Validate downloaded binary
4. **Replace Binary**: Atomic replacement of current binary
5. **Restart**: Exit for service manager to restart

### Manual Update Commands

```bash
# Check for updates
monitorly-probe -check-update

# Force update
monitorly-probe -update
```

### Configuration Auto-Update Process

1. **Header Check**: After each API request, the probe inspects the `X-Configuration-Last-Update` response header.
2. **Timestamp Comparison**: If the server's timestamp is newer than the local config file's last modification time, the probe fetches the latest config.
3. **Config Fetch**: The probe sends a `GET` request to `/api/{organization_id}/servers/{server_id}/config`.
4. **Config Save & Restart**: The new config is saved, and the probe restarts itself to apply the changes.

This mechanism ensures configuration drift is minimized and all probes stay in sync with the central configuration managed via the Monitorly API.