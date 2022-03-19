#ln -s /zim ./dump
for f in /zim/*.zim ; do 
  dir="${f%.zim}" 
  echo "Extracting $dir with zimdump"
  zimdump dump "$f" --dir "$dir"; 
  npm run createIndex "$dir"
  echo "Creating Frontend"
  cd zimbee-frontend
  mkdir -p "$dir/frontend"
  ./node_modules/.bin/vite build --outDir "$dir/frontend" --emptyOutDir
  cd ..
done