$ErrorActionPreference="Stop" # set -e

$repo_root = $(git rev-parse --show-toplevel).Trim()
pushd $repo_root

docker build -t witness-puzzles-img -f docker/Dockerfile .
if ($lastExitCode -ne 0) { Write-Error 'Docker build failed!' }
Write-Host "Build succeeded, replacing old server and connecting to docker container"
docker stop witness-puzzles | Out-Null
docker run -dit --name tmp -p 8080:80 witness-puzzles-img | Out-Null
if ($(docker ps -a -f 'name=tmp' -f 'status=running') -eq $null) {
  docker logs tmp
  Write-Error 'Docker run failed!'
}

docker rm witness-puzzles | Out-Null
docker rename tmp witness-puzzles | Out-Null
docker exec -it witness-puzzles /bin/bash
