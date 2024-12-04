@echo off
setlocal enabledelayedexpansion
chcp 65001

:: 检查网络连接
ping bing.com -n 1 -w 1000 >nul 2>&1
if %errorlevel% neq 0 (
    echo 无互联网连接，将使用本地数据
    goto open_index
)

:: 读取sourceUrl.json中的url数组
for /f "tokens=*" %%a in ('type .\src\utils\sourceUrl.json ^| findstr /R /C:"\"url\":\["') do (
    set "urls=%%a"
    set "urls=!urls:~8!"
    for /f "tokens=1* delims=," %%b in ("urls") do (
        set urls=%%c
    )
)

:: 循环获取data.json文件
for %%u in (!urls!) do (
    curl -o temp_data.json "%%u/data.json" && goto compare_version
)

echo 数据更新失败，将使用本地数据
goto open_index

:compare_version
:: 比较版本号
for /f "tokens=*" %%i in ('type temp_data.json ^| findstr /R /C:"\"version\":"') do (
    set "new_version=%%i"
    set "new_version=!new_version:~11,-2!"
)

for /f "tokens=*" %%j in ('type .\src\data.json ^| findstr /R /C:"\"version\":"') do (
    set "local_version=%%j"
    set "local_version=!local_version:~11,-2!"
)

:: 比较版本号，如果新版本号大于本地版本号，则覆盖
if "!new_version!" gtr "!local_version!" (
    echo 发现更新数据，更新中...
    copy temp_data.json .\src\data.json
) else (
    echo 数据已是最新版本
)

:open_index
:: 启动index.html
start "" .\public\index.html
echo 已启动主程序，按下任意键或等待3秒后退出
endlocal