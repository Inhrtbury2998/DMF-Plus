
/*
1.Qmsg来自message.js库
2.一些在主要代码中需要用到的方法或变量
*/
const DEBUG = true;
const PATH = "DMF-Plus-main/";

/**
 * 转换坐标点数组
 * 该函数接收一个包含经纬度字符串的数组，将每个坐标点的经纬度字符串转换为数字，
 * 并根据坐标点的符号（南纬/北纬，西经/东经）调整数值的正负。
 * @param {string[][]} pointArray - 包含经纬度字符串的数组
 * @returns {number[][]} 转换后的经纬度数组
 */
function convertCoordinates(pointArray) {
    return pointArray.map((point) => {
        // 解构赋值提取纬度和经度的字符串
        let [latStr, lonStr] = point;

        // 尝试将纬度和经度直接转换为数字
        let latNum = parseFloat(latStr);
        let lonNum = parseFloat(lonStr);

        // 检查转换是否成功，如果成功，则直接使用这些数字
        if (!isNaN(latNum) && !isNaN(lonNum)) {
            return [latNum, lonNum];
        }

        // 如果转换失败，尝试使用正则表达式匹配数字部分，包括小数点
        let latMatch = latStr.match(/[-+]?\d+(\.\d+)?/);
        let lonMatch = lonStr.match(/[-+]?\d+(\.\d+)?/);

        // 如果正则表达式匹配失败，则抛出错误
        if (!latMatch || !lonMatch) {
            Qmsg.error('请输入正确的数据');
            throw new Error('Invalid coordinate format');
        }

        // 将匹配到的字符串转换为浮点数
        latNum = parseFloat(latMatch[0]);
        lonNum = parseFloat(lonMatch[0]);

        // 根据纬度和经度的符号调整数值的正负
        let latSign = latStr.includes('S') || latStr.includes('s') ? -1 : 1;
        let lonSign = lonStr.includes('W') || lonStr.includes('w') ? -1 : 1;

        // 返回转换后的纬度和经度数组
        return [latNum * latSign, lonNum * lonSign];
    });
}


/**
 * 将文本复制到剪贴板
 * 该函数尝试使用现代浏览器的 navigator.clipboard API 来复制文本，
 * 如果浏览器不支持，则会回退到使用旧版浏览器的 document.execCommand 方法。
 * @param {string} text - 需要复制到剪贴板的文本
 */
function copyToClipboard(text) {
    // 检查浏览器是否支持 navigator.clipboard API
    if (navigator.clipboard) {
        // 使用 async 函数和 then() 方法确保操作完成后再继续
        navigator.clipboard.writeText(text).then(function () {
            // 复制成功的回调函数，这里注释掉了日志输出
            // console.log('Async: Copying to clipboard was successful!');
        }, function (err) {
            // 复制失败的错误处理函数，打印错误信息并显示错误消息
            console.error('Async: Could not copy text: ', err);
            Qmsg.error('Async: Could not copy text: ', err);
        });
    } else {
        // 如果浏览器不支持 navigator.clipboard API，则使用旧版方法
        // 创建一个临时的 textarea 元素用于复制文本
        var textArea = document.createElement("textarea");
        textArea.value = text;
        // 将 textarea 元素添加到文档的 body 中
        document.body.appendChild(textArea);
        // 让 textarea 元素获得焦点并选中其内容
        textArea.focus();
        textArea.select();
        try {
            // 尝试执行复制命令
            var successful = document.execCommand('copy');
            // 如果处于调试模式，则打印复制操作的结果
            if (DEBUG) {
                var msg = successful ? 'successful' : 'unsuccessful';
                console.log('Fallback: Copying text command was ' + msg);
            }
        } catch (err) {
            // 如果复制操作失败，则打印错误信息
            if (DEBUG)
                console.error('Fallback: Oops, unable to copy', err);
        }
        // 从文档的 body 中移除临时创建的 textarea 元素
        document.body.removeChild(textArea);
    }
}

/**
 * 将角度转为N偏W多少度类似形式的函数
 * 该函数接收一个角度值，根据其正负和大小，转换为“北偏东”或“南偏西”等格式的字符串。
 * @param {number} degrees - 需要转换的角度值
 * @returns {string} 转换后的易读格式角度字符串
 */
function degreesReadability(degrees) {
    // 如果处于调试模式，打印初始角度值
    DEBUG ? console.log("degrees at degreesReadability begin:" + degrees) : 0;

    // 根据角度值的正负和大小，进行不同的转换处理
    if (degrees > 0) {
        // 如果角度大于90度，转换为“N偏W”格式
        if (degrees > 90) {
            degrees = "N偏W" + (degrees - 90).toFixed(1);
        } else {
            // 如果角度在0到90度之间，转换为“N偏E”格式
            degrees = "N偏E" + degrees.toFixed(1);
        }
    } else {
        // 如果角度小于-90度，转换为“S偏W”格式
        if (degrees < -90) {
            degrees = "S偏W" + Math.abs(degrees + 90).toFixed(1);
        } else {
            // 如果角度在-90到0度之间，转换为“S偏E”格式
            degrees = "S偏E" + Math.abs(degrees).toFixed(1);
        }
    }

    // 如果处于调试模式，打印最终角度值
    DEBUG ? console.log("degrees at degreesReadability end:" + degrees) : 0;

    // 返回转换后的易读格式角度字符串
    return degrees;
}


/**
 * 裁剪画布图像
 * 该函数接收一个图像源（imageSrc），加载图像，然后根据图像的尺寸进行裁剪，
 * 以确保裁剪后的图像宽度和高度都是8的倍数。
 * @param {string} imageSrc - 图像的源路径或URL
 * @returns {Promise<HTMLCanvasElement|null>} 裁剪后的画布元素，如果发生错误则返回null
 */
async function cropImage(imageSrc) {
    try {
        const img = await loadImage(imageSrc);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const start_width = Math.floor((img.width % 8) / 2);
        const start_height = Math.floor((img.height % 8) / 2);
        const width = img.width - img.width % 8;
        const height = img.height - img.height % 8;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(
            img,
            start_width, start_height,
            width, height,
            0, 0, width, height
        );
        return canvas;
    } catch (error) {
        console.error('图像加载失败:', error);
        return null;
    }
}

/**
 * cropImage()的辅助函数
 * @param {string} src - 图像的源路径或URL
 * @returns {Promise<HTMLImageElement>} 加载完成的图像
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;

        img.onload = () => resolve(img);
        img.onerror = (error) => reject(error);
    });
}

/**
 * 获取字符串中最后一个指定字符之前的部分
 * 该函数接收一个字符串和一个字符，然后返回从字符串开头到该字符最后一次出现位置(含指定字符)的子字符串。
 * 如果字符串中不存在该字符，则返回null。
 * @param {string} str - 需要处理的原始字符串
 * @param {string} char - 需要查找的字符
 * @returns {string|null} 从字符串开头到指定字符最后一次出现位置的子字符串，如果未找到则返回null
 */
function getLastPartOfString(str, char) {
    // 找到最后一个指定字符的位置
    let lastIndex = str.lastIndexOf(char) + char.length;

    // 如果找到了指定字符，则截取从该位置到字符串末尾的部分
    if (lastIndex !== -1) {
        return str.slice(0, lastIndex);
    } else {
        // 如果没有找到指定字符，则返回null
        return null;
    }
}
/**
 * 复制给定的源 canvas 元素并返回一个新的 canvas 元素。
 *
 * @param {HTMLCanvasElement} sourceCanvas - 要复制的源 canvas 元素。
 * @returns {HTMLCanvasElement} 复制后的目标 canvas 元素，具有与源 canvas 相同的宽度和高度。
 */
function copyCanvas(sourceCanvas) {
    let targetCanvas = document.createElement('canvas');
    targetCanvas.width = sourceCanvas.width;
    targetCanvas.height = sourceCanvas.height;

    const targetCtx = targetCanvas.getContext('2d');
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.drawImage(sourceCanvas, 0, 0);
    return targetCanvas;
}

async function fetchData() {
    const urls = [//It's not work, but it would be strange if this ran though
        'https://gitee.com/inhrtbury2998/dmf/src/utils/data.json',
        'https://github.com/Inhrtbury2998/DMF-Plus/raw/refs/heads/main/src/untils/data.json',
        'http://huashi.sparkminds.io:7888/usr/uploads/DMF/data.json'
    ];

    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Failed to fetch data from ${url}: ${error.message}`);
        }
    }

    throw new Error('Failed to fetch data from all sources');
}

function compareVersionObjects(obj1, obj2) {
    // 提取版本号并分割成数组
    const version1 = obj1.version.split('.').map(Number);
    const version2 = obj2.version.split('.').map(Number);

    // 比较主版本号
    if (version1[0] > version2[0]) return obj1;
    if (version1[0] < version2[0]) return obj2;

    // 比较次版本号
    if (version1[1] > version2[1]) return obj1;
    if (version1[1] < version2[1]) return obj2;

    // 比较修订号
    if (version1[2] > version2[2]) return obj1;
    if (version1[2] < version2[2]) return obj2;

    // 如果版本号相同，则返回任意一个对象
    return obj1;
}
