iwr -useb get.scoop.sh | iex
scoop bucket add scoop-clojure https://github.com/littleli/scoop-clojure
scoop bucket add extras
scoop install babashka --independent
echo "$HOME\scoop\shims" | Out-File -FilePath $env:GITHUB_PATH -Encoding utf8 -Append
