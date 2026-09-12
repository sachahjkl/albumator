variable "image" {
  type        = string
  description = "Immutable GHCR image reference"

  validation {
    condition     = strlen(var.image) == 99 && substr(var.image, 0, 35) == "ghcr.io/sachahjkl/albumator@sha256:"
    error_message = "The image must use the Albumator GHCR repository and an exact SHA-256 digest."
  }
}

job "albumator" {
  namespace   = "staging"
  datacenters = ["homelab"]
  type        = "service"

  meta {
    image = var.image
  }

  group "web" {
    count = 1

    update {
      max_parallel      = 1
      health_check      = "checks"
      min_healthy_time  = "10s"
      healthy_deadline  = "2m"
      progress_deadline = "5m"
      auto_revert       = true
    }

    restart {
      attempts = 3
      interval = "10m"
      delay    = "15s"
      mode     = "fail"
    }

    reschedule {
      attempts       = 3
      interval       = "1h"
      delay          = "30s"
      delay_function = "exponential"
      max_delay      = "5m"
      unlimited      = false
    }

    network {
      mode = "host"

      port "http" {
        static       = 9091
        to           = 3000
        host_network = "loopback"
      }
    }

    volume "data" {
      type            = "host"
      source          = "albumator-staging-data"
      attachment_mode = "file-system"
      access_mode     = "single-node-writer"
      sticky          = true
    }

    task "web" {
      driver = "docker"

      config {
        image        = var.image
        network_mode = "services"
        ports        = ["http"]
      }

      env {
        ADDRESS_HEADER   = "x-forwarded-for"
        DATABASE_URL     = "file:/data/local.db"
        ENABLE_DEMO_USER = "true"
        HOST             = "0.0.0.0"
        IMAGE_CACHE_DIR  = "/data/image-cache"
        PORT             = "3000"
        XFF_DEPTH        = "1"
      }

      volume_mount {
        volume      = "data"
        destination = "/data"
      }

      service {
        name     = "albumator-staging"
        provider = "nomad"
        port     = "http"
        tags = [
          "traefik.enable=true",
          "traefik.http.routers.albumator-staging.entrypoints=nomad",
          "traefik.http.routers.albumator-staging.middlewares=albumator-staging-noindex",
          "traefik.http.routers.albumator-staging.rule=Host(`staging.albumator.sacha.house`)",
          "traefik.http.routers.albumator-staging.tls.domains[0].main=staging.albumator.sacha.house",
          "traefik.http.middlewares.albumator-staging-noindex.headers.customresponseheaders.X-Robots-Tag=noindex, nofollow",
        ]

        check {
          name     = "HTTP health"
          type     = "http"
          path     = "/api/health"
          interval = "10s"
          timeout  = "2s"

          check_restart {
            limit           = 3
            grace           = "30s"
            ignore_warnings = false
          }
        }
      }

      resources {
        cpu    = 500
        memory = 512
      }

      logs {
        max_files     = 5
        max_file_size = 10
      }

      kill_timeout = "30s"
    }
  }
}
