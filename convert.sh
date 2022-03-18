ln -s /zim /zimbee/dump
for f in /zim/*.zim ; do 
dir="${f%.zim}" 
# zimdump dump "$f" --dir "$dir"; 
cd /zimbee
npm run createIndex "$dir"
cd /zimbee/zimbee-frontend
pwd
mkdir -p "$dir/frontend"
./node_modules/.bin/vite build --outDir "$dir/X" --emptyOutDir
done
