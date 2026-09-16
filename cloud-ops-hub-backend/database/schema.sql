-- =============================================================================
--                 CLOUDOPS HUB - SCHEMA DO BANCO DE DADOS (MySQL 8.0)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `cloudops_hub` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `cloudops_hub`;

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `two_factor_secret` VARCHAR(100) DEFAULT NULL,
  `two_factor_enabled` BOOLEAN DEFAULT FALSE,
  `role` ENUM('admin', 'operator', 'viewer') DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TABELA DE SERVIDORES
CREATE TABLE IF NOT EXISTS `servers` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `provider` ENUM('oracle', 'aws', 'gcp', 'vps_custom') DEFAULT 'oracle',
  `region` VARCHAR(50) DEFAULT 'sa-saopaulo-1',
  `ip_address` VARCHAR(45) NOT NULL,
  `ssh_port` INT DEFAULT 22,
  `ssh_user` VARCHAR(50) DEFAULT 'ubuntu',
  `ssh_private_key_encrypted` TEXT NOT NULL,
  `ssh_key_iv` VARCHAR(64) NOT NULL,
  `ssh_key_tag` VARCHAR(64) NOT NULL,
  `status` ENUM('Healthy', 'Warning', 'Down', 'Connecting') DEFAULT 'Connecting',
  `cpu_cores` INT DEFAULT 2,
  `ram_total_mb` INT DEFAULT 1024,
  `disk_total_gb` INT DEFAULT 45,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_servers_user` (`user_id`),
  CONSTRAINT `fk_servers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TABELA DE CREDENCIAIS OCI / TERRAFORM
CREATE TABLE IF NOT EXISTS `oci_credentials` (
  `id` VARCHAR(36) NOT NULL,
  `server_id` VARCHAR(36) NOT NULL,
  `tenancy_ocid` VARCHAR(255) NOT NULL,
  `user_ocid` VARCHAR(255) NOT NULL,
  `fingerprint` VARCHAR(64) NOT NULL,
  `region` VARCHAR(50) DEFAULT 'sa-saopaulo-1',
  `private_key_encrypted` TEXT NOT NULL,
  `private_key_iv` VARCHAR(64) NOT NULL,
  `private_key_tag` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_oci_server` (`server_id`),
  CONSTRAINT `fk_oci_server` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TABELA DE TELEMETRIA & MÉTRICAS
CREATE TABLE IF NOT EXISTS `server_metrics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `server_id` VARCHAR(36) NOT NULL,
  `cpu_usage_percent` DECIMAL(5,2) NOT NULL,
  `ram_used_mb` INT NOT NULL,
  `ram_free_mb` INT NOT NULL,
  `swap_used_mb` INT DEFAULT 0,
  `disk_used_gb` DECIMAL(6,2) NOT NULL,
  `network_rx_kbps` DECIMAL(8,2) DEFAULT 0.00,
  `network_tx_kbps` DECIMAL(8,2) DEFAULT 0.00,
  `recorded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_metrics_server_time` (`server_id`, `recorded_at`),
  CONSTRAINT `fk_metrics_server` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABELA DE CONTAINERS DOCKER
CREATE TABLE IF NOT EXISTS `docker_containers` (
  `id` VARCHAR(36) NOT NULL,
  `server_id` VARCHAR(36) NOT NULL,
  `container_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `image` VARCHAR(150) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'running',
  `ports` VARCHAR(255) DEFAULT NULL,
  `cpu_percent` DECIMAL(5,2) DEFAULT 0.00,
  `memory_mb` DECIMAL(8,2) DEFAULT 0.00,
  `last_sync` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_server_container` (`server_id`, `container_id`),
  CONSTRAINT `fk_containers_server` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TABELA DE PROXY HOSTS (NGINX)
CREATE TABLE IF NOT EXISTS `proxy_hosts` (
  `id` VARCHAR(36) NOT NULL,
  `server_id` VARCHAR(36) NOT NULL,
  `domain_name` VARCHAR(255) NOT NULL,
  `forward_host` VARCHAR(100) DEFAULT '127.0.0.1',
  `forward_port` INT NOT NULL,
  `ssl_enabled` BOOLEAN DEFAULT TRUE,
  `ssl_auto_renew` BOOLEAN DEFAULT TRUE,
  `status` ENUM('Active', 'Pending', 'Error') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_proxy_domain` (`server_id`, `domain_name`),
  CONSTRAINT `fk_proxy_server` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TABELA DE BUCKETS (OBJECT STORAGE)
CREATE TABLE IF NOT EXISTS `cloud_buckets` (
  `id` VARCHAR(36) NOT NULL,
  `server_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `namespace` VARCHAR(100) NOT NULL,
  `visibility` ENUM('Public', 'Private') DEFAULT 'Public',
  `storage_tier` VARCHAR(50) DEFAULT 'Standard',
  `url_base` TEXT DEFAULT NULL,
  `approx_size_mb` DECIMAL(10,2) DEFAULT 0.00,
  `approx_objects` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bucket_name` (`server_id`, `name`),
  CONSTRAINT `fk_bucket_server` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TABELA DE AUDITORIA
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(36) NOT NULL,
  `server_id` VARCHAR(36) DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
