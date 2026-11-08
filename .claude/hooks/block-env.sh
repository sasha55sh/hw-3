input=$(cat)

file_path=$(echo "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//;s/"$//')
command=$(echo "$input" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"command"[[:space:]]*:[[:space:]]*"//;s/"$//')

if [[ "$file_path" == *".env"* ]] || [[ "$command" == *".env"* ]]; then
  echo "Доступ до .env заблоковано хуком безпеки." >&2
  exit 2  
fi

exit 0