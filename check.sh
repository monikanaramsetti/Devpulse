echo "Enter the file name:"
read file
vowels=$(grep -o "[aeiouAEIOU]" "$file" | wc -l)
spaces=$(grep -o " " "$file" | wc -l)
characters=$(wc -m < "$file")
lines=$(wc -l < "$file")

letters_digits_spaces=$(grep -o "[a-zA-Z0-9 ]" "$file" | wc -l)
symbols=$((characters - letters_digits_spaces))
echo $file
echo "Number of vowels: $vowels"
echo "Number of blank spaces: $spaces"
echo "Number of characters: $characters"
echo "Number of symbols: $symbols"
echo "Number of lines: $lines"
