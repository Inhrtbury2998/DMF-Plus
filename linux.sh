#!/bin/bash

# Set character encoding to UTF-8
export LANG=en_US.UTF-8

# Check if the system is macOS or Unix-like
if [[ "$(uname)" == "Darwin" ]]; then
    open_command="open"
else
    open_command="xdg-open"
fi

# Check internet connection
ping -c 1 cn.bing.com -W 1000 >/dev/null 2>&1
if [ $? -ne 0 ]; then
    ping -c 1 www.bing.com -W 1000 >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "No internet connection, using local data"
        open_index
    fi
fi

# Read the url array from sourceUrl.json
urls=$(cat ./src/utils/sourceUrl.json | grep -oP '"url":\["\K[^"]*')
urls=$(echo $urls | tr -d ',')

# Loop to fetch data.json files
for u in $urls; do
    curl -o temp_data.json "$u/data.json" && compare_version
done

echo "Data update failed, using local data"
open_index

compare_version() {
    new_version=$(grep -oP '"version": \K[^,]*' temp_data.json)
    local_version=$(grep -oP '"version": \K[^,]*' ./src/data.json)

    # Compare version numbers, if the new version is greater than the local version, overwrite
    if [ "$(echo -e "$new_version\n$local_version" | sort -V | head -n1)" = "$new_version" ]; then
        echo "New data found, updating..."
        cp temp_data.json ./src/data.json
    else
        echo "Data is up to date"
    fi
}

open_index() {
    # Launch index.html
    $open_command ./public/index.html
    echo "Main program has started, press any key or wait for 5 seconds before exiting"
    read -t 5 -n 1
}