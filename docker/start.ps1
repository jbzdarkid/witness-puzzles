$repo_root = $(git rev-parse --show-toplevel).Trim()
pushd $repo_root

docker build -t witness-puzzles-img -f docker/Dockerfile .
docker run -dit --name tmp -p 8080:80 witness-puzzles-img

$old_id = $(docker ps -aqf "name=witness-puzzles")
$new_id = $(docker ps -aqf "name=tmp")
if ($old_id -ne $null) {
  docker rm -f $old_id.Trim()
}
docker rename tmp witness-puzzles
docker exec -it $new_id /bin/bash