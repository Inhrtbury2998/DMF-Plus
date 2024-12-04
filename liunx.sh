#!/bin/bash

# 检查网络连接
if ! ping -c 1 google.com &> /dev/null; then
    echo "No network connection."
    xdg-open ./public/index.html
    exit 0
fi

# 读取sourceUrl.json中的url数组
urls=$(cat ./src/utils/sourceUrl.json | tr -d '\n' | sed -e 's/^.*"url":\[\(.*\)\].*$/\1/')

# 循环获取data.json文件
temp_data_json="temp_data.json"
for url in $urls; do
    if curl -s -o "$temp_data_json" "$url/data.json"; then
        break
    fi
done

# 检查是否有成功下载的data.json
if [ -f "$temp_data_json" ]; then
    # 比较版本号
    new_version=$(grep 'version' "$temp_data_json" | cut -d'"' -f4)
    local_version=$(grep 'version' ./src/data.json | cut -d'"' -f4)

    # 比较版本号，如果新版本号大于本地版本号，则覆盖
    if [ "$new_version" != "" ] && [ "$local_version" != "" ] && [[ "$new_version" > "$local_version" ]]; then
        echo "New version found, updating..."
        cp "$temp_data_json" ./src/data.json
    else
        echo "No new version found."
    fi
    rm "$temp_data_json"
else
    echo "Failed to download data.json."
fi

# 启动index.html
xdg-open ./public/index.html