{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" ] (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        lib = pkgs.lib;
        packageJson = builtins.fromJSON (builtins.readFile ./package.json);
        pname = packageJson.name;
        version = packageJson.version;
        nodejs = pkgs.nodejs_22;
        pnpm = pkgs.pnpm.override { nodejs-slim = nodejs; };
        src = lib.cleanSource ./.;
        pnpmDeps = pkgs.fetchPnpmDeps {
          inherit pname version src;
          inherit pnpm;
          fetcherVersion = 4;
          hash = "sha256-XdDfau9XrdHE6qsj/XXiMrfcMxxLQu811owQ0F70J1c=";
        };

        albumator = pkgs.stdenv.mkDerivation {
          inherit
            pname
            version
            src
            pnpmDeps
            ;
          CI = "true";

          nativeBuildInputs = [
            nodejs
            pkgs.pnpmConfigHook
            pnpm
            pkgs.makeWrapper
          ];

          pnpmInstallFlags = [ "--frozen-lockfile" ];

          buildPhase = ''
            runHook preBuild
            export PUBLIC_COMMIT_HASH="${self.shortRev or version}"
            pnpm run build
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            pnpm prune --prod
            mkdir -p $out/bin $out/libexec/${pname}/src/lib/server/db
            cp -r build node_modules package.json scripts $out/libexec/${pname}/
            cp -r src/lib/server/db/migrations $out/libexec/${pname}/src/lib/server/db/
            makeWrapper ${nodejs}/bin/node $out/bin/${pname} \
              --set-default HOST 0.0.0.0 \
              --set-default PORT 3000 \
              --set-default NODE_ENV production \
              --add-flags $out/libexec/${pname}/scripts/migrate.mjs \
              --add-flags "--start"
            runHook postInstall
          '';
        };

        dockerImage = pkgs.dockerTools.buildLayeredImage {
          name = pname;
          tag = version;
          contents = [
            albumator
            pkgs.cacert
          ];
          config = {
            Cmd = [ "${albumator}/bin/${pname}" ];
            Env = [
              "HOST=0.0.0.0"
              "PORT=3000"
              "NODE_ENV=production"
              "DATABASE_URL=file:/var/lib/${pname}/local.db"
              "BODY_SIZE_LIMIT=100M"
              "IMAGE_CACHE_DIR=/var/lib/${pname}/image-cache"
              "IMAGE_CACHE_MAX_BYTES=1073741824"
              "IMAGE_CACHE_MAX_AGE_SECONDS=2592000"
              "IMAGE_CACHE_CLEANUP_INTERVAL_SECONDS=3600"
              "PUBLIC_GIT_REPO_ID=sachahjkl/albumator"
              "PUBLIC_COMMIT_HASH=${self.shortRev or version}"
              "SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
            ];
            ExposedPorts = {
              "3000/tcp" = { };
            };
            Volumes = {
              "/var/lib/${pname}" = { };
            };
            WorkingDir = "/var/lib/${pname}";
          };
        };

        actionlint =
          pkgs.runCommand "${pname}-actionlint"
            {
              nativeBuildInputs = [ pkgs.actionlint ];
            }
            ''
              actionlint -config-file ${src}/.github/actionlint.yaml ${src}/.github/workflows/*.yml
              touch $out
            '';

        mkCheck =
          name: script:
          pkgs.stdenv.mkDerivation {
            inherit
              pname
              version
              src
              pnpmDeps
              ;
            name = "${pname}-${name}";
            CI = "true";

            nativeBuildInputs = [
              nodejs
              pkgs.pnpmConfigHook
              pnpm
            ];

            pnpmInstallFlags = [ "--frozen-lockfile" ];

            buildPhase = ''
              runHook preBuild
              pnpm run ${script}
              runHook postBuild
            '';

            installPhase = ''
              mkdir -p $out
            '';
          };
      in
      {
        packages = {
          default = albumator;
          inherit dockerImage;
        };

        apps.default = {
          type = "app";
          program = "${albumator}/bin/${pname}";
        };

        checks = {
          inherit actionlint dockerImage;
          build = albumator;
          check = mkCheck "check" "check";
          format = mkCheck "format" "format:check";
          lint = mkCheck "lint" "lint";
          test = mkCheck "test" "test";
        };

        devShells.default = pkgs.mkShell {
          packages = [
            nodejs
            pnpm
            pkgs.nixfmt
            pkgs.sqlite
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';
        };

        formatter = pkgs.nixfmt;
      }
    )
    // {
      nixosModules.default =
        {
          config,
          lib,
          pkgs,
          ...
        }:
        let
          cfg = config.services.albumator;
        in
        {
          options.services.albumator = {
            enable = lib.mkEnableOption "albumator";
            package = lib.mkOption {
              type = lib.types.package;
              default = self.packages.${pkgs.system}.default;
            };
            host = lib.mkOption {
              type = lib.types.str;
              default = "0.0.0.0";
            };
            port = lib.mkOption {
              type = lib.types.port;
              default = 3000;
            };
            dataDir = lib.mkOption {
              type = lib.types.str;
              default = "/var/lib/albumator";
            };
            databaseUrl = lib.mkOption {
              type = lib.types.str;
              default = "file:/var/lib/albumator/local.db";
            };
            publicGitRepoId = lib.mkOption {
              type = lib.types.str;
              default = "sachahjkl/albumator";
            };
            enableDemoUser = lib.mkOption {
              type = lib.types.bool;
              default = false;
              description = "Whether to enable the built-in quota-limited demo account.";
            };
            bodySizeLimit = lib.mkOption {
              type = lib.types.str;
              default = "100M";
              description = "Maximum request body size accepted by the Node adapter.";
            };
            imageCacheMaxBytes = lib.mkOption {
              type = lib.types.ints.unsigned;
              default = 1073741824;
              description = "Maximum image variant cache size in bytes; zero disables the limit.";
            };
            imageCacheMaxAgeSeconds = lib.mkOption {
              type = lib.types.ints.unsigned;
              default = 2592000;
              description = "Maximum generated variant age in seconds; zero disables age eviction.";
            };
            imageCacheCleanupIntervalSeconds = lib.mkOption {
              type = lib.types.ints.unsigned;
              default = 3600;
              description = "Image cache cleanup interval in seconds; zero disables periodic cleanup.";
            };
            addressHeader = lib.mkOption {
              type = lib.types.nullOr lib.types.str;
              default = null;
              description = "Trusted proxy header used by adapter-node for client addresses.";
            };
            xffDepth = lib.mkOption {
              type = lib.types.ints.positive;
              default = 1;
              description = "Number of trusted proxy hops in the forwarded address header.";
            };
            environmentFile = lib.mkOption {
              type = lib.types.nullOr lib.types.path;
              default = null;
            };
          };

          config = lib.mkIf cfg.enable {
            users.groups.albumator = { };
            users.users.albumator = {
              isSystemUser = true;
              group = "albumator";
              home = cfg.dataDir;
              createHome = false;
            };

            systemd.tmpfiles.rules = [
              "d ${cfg.dataDir} 0750 albumator albumator -"
              "d ${cfg.dataDir}/image-cache 0750 albumator albumator -"
            ];

            systemd.services.albumator = {
              description = "albumator";
              after = [ "network-online.target" ];
              wants = [ "network-online.target" ];
              wantedBy = [ "multi-user.target" ];
              environment = {
                HOST = cfg.host;
                PORT = toString cfg.port;
                DATABASE_URL = cfg.databaseUrl;
                BODY_SIZE_LIMIT = cfg.bodySizeLimit;
                IMAGE_CACHE_DIR = "${cfg.dataDir}/image-cache";
                IMAGE_CACHE_MAX_BYTES = toString cfg.imageCacheMaxBytes;
                IMAGE_CACHE_MAX_AGE_SECONDS = toString cfg.imageCacheMaxAgeSeconds;
                IMAGE_CACHE_CLEANUP_INTERVAL_SECONDS = toString cfg.imageCacheCleanupIntervalSeconds;
                PUBLIC_GIT_REPO_ID = cfg.publicGitRepoId;
                PUBLIC_COMMIT_HASH = lib.getVersion cfg.package;
                ENABLE_DEMO_USER = if cfg.enableDemoUser then "true" else "false";
              }
              // lib.optionalAttrs (cfg.addressHeader != null) {
                ADDRESS_HEADER = cfg.addressHeader;
                XFF_DEPTH = toString cfg.xffDepth;
              };
              serviceConfig = {
                ExecStart = "${cfg.package}/bin/albumator";
                WorkingDirectory = cfg.dataDir;
                User = "albumator";
                Group = "albumator";
                Restart = "on-failure";
                UMask = "0027";
                NoNewPrivileges = true;
                PrivateTmp = true;
              }
              // lib.optionalAttrs (cfg.environmentFile != null) {
                EnvironmentFile = cfg.environmentFile;
              };
            };
          };
        };
    };
}
