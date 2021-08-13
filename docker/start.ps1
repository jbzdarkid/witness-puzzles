$repo_root = $(git rev-parse --show-toplevel).Trim()
pushd $repo_root

$old_id = $(docker ps -aqf "name=witness-puzzles")
if ($old_id -ne $null) {
  docker rm -f $old_id.Trim()
}
docker build -t witness-puzzles -f docker/Dockerfile .
docker run -dit --name witness-puzzles -p 8080:80 witness-puzzles
