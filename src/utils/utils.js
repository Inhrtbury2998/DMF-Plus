
/*
1.Qmsg来自message.js库
2.一些在主要代码中需要用到的方法或变量
*/
const DEBUG = true;

/**
 * 简繁转换工具（仅常用字，支持页面整体转换）
 * 依赖简繁映射表，可根据需要扩展
 */
const zh_s2t_map = {
    "龙": "龍", "辅助": "輔助", "设置": "設置", "帮助": "幫助", "教程": "教程", "地图": "地圖", "宽度": "寬度", "高度": "高度", "起点": "起點", "终点": "終點", "坐标": "座標", "计算": "計算", "距离": "距離", "方向": "方向", "重置": "重置", "保存": "保存", "刷新": "刷新", "图片": "圖片", "裁剪": "裁剪", "异常": "異常", "粘贴板": "剪貼板", "更多": "更多", "功能": "功能", "快速": "快速", "新增": "新增", "开关": "開關", "主界面": "主界面", "自动": "自動", "复制": "複製", "结果": "結果", "失败": "失敗", "成功": "成功", "显示": "顯示", "输入": "輸入", "数据": "數據", "刷新": "刷新", "点": "點", "南": "南", "北": "北", "西": "西", "东": "東"
    // 可继续补充常用字
};
// 遗传属性计算的映射表
const letterToNumberMap = {
    "f": 0, "e": 1, "d-": 2, "d": 3, "d+": 4,
    "c-": 5, "c": 6, "c+": 7,
    "b-": 8, "b": 9, "b+": 10,
    "a-": 11, "a": 12
};

function zh_s2t(str) {
    return str.replace(/[\u4e00-\u9fa5]/g, function (char) {
        return zh_s2t_map[char] || char;
    });
}

function zh_t2s(str) {
    // 反向映射
    const t2s_map = Object.fromEntries(Object.entries(zh_s2t_map).map(([k, v]) => [v, k]));
    return str.replace(/[\u4e00-\u9fa5]/g, function (char) {
        return t2s_map[char] || char;
    });
}

/**
 * 页面整体简繁转换（简转繁）
 */
function convertPageToTraditional() {
    traverseAndConvert(document.body, zh_s2t);
}

/**
 * 页面整体简繁转换（繁转简）
 */
function convertPageToSimplified() {
    traverseAndConvert(document.body, zh_t2s);
}

function traverseAndConvert(node, convertFunc) {
    if (node.nodeType === 3) { // 文本节点
        node.nodeValue = convertFunc(node.nodeValue);
    } else if (node.nodeType === 1 && node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            traverseAndConvert(node.childNodes[i], convertFunc);
        }
    }
}

/**
 * 转换坐标点数组
 * 该函数接收一个包含经纬度字符串的数组，将每个坐标点的经纬度字符串转换为数字，
 * 并根据坐标点的符号（南纬/北纬，西经/东经）调整数值的正负。
 * @param {string[][]} pointArray - 包含经纬度字符串的数组
 * @returns {number[][]} 转换后的经纬度数组
 */
function convertCoordinates(pointArray) {
    return pointArray.map(function (point) {
        return point.map(function (coord) {
            // 如果已经是数字，直接返回
            if (typeof coord === 'number') {
                return coord;
            }

            // 转为字符串处理
            const str = String(coord).trim();
            const lastChar = str.slice(-1).toLowerCase();

            // 检查最后一个字符是否是方向标识
            if (/[nsew]/.test(lastChar)) {
                const numPart = parseFloat(str.slice(0, -1));
                switch (lastChar) {
                    case 's': // 南纬为负
                    case 'w': // 西经为负
                        return -numPart;
                    case 'n': // 北纬为正
                    case 'e': // 东经为正
                        return numPart;
                }
            }

            // 没有方向标识，直接转为数字
            return parseFloat(str);
        });
    });
}

/**
 * 检测字符串是否为有效的经纬度格式（数字 + 可选方向标识 N/S/E/W）
 * @param {string} str - 待检测的字符串
 * @returns {boolean} - 是否符合格式要求
 * @example
 * isValidCoordinateString("200.3w") // true
 * isValidCoordinateString("34.1E")  // true
 * isValidCoordinateString("40")     // true
 * isValidCoordinateString("40X")   // false
 * isValidCoordinateString("N40")   // false
 */
function isValidCoordinateString(str) {
    // 检查是否为数字（可能带正负号）或数字后跟 N/S/E/W（不区分大小写）
    return /^[-+]?\d*\.?\d+[nsew]?$/i.test(str);
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
            degrees = "N偏E" + (90 - degrees).toFixed(1);
        }
    } else {
        // 如果角度小于-90度，转换为“S偏W”格式
        if (degrees < -90) {
            degrees = "S偏W" + Math.abs(degrees + 90).toFixed(1);
        } else {
            // 如果角度在-90到0度之间，转换为“S偏E”格式
            degrees = "S偏E" + Math.abs(degrees + 90).toFixed(1);
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

const mapLogicWidth = 1500; // 地图逻辑坐标宽度（根据地图实际标注调整）
const mapLogicHeight = 1500; // 地图逻辑坐标高度（根据地图实际标注调整）

/**
 * 将像素坐标转换为逻辑坐标。
 * 
 * @param {number} x - 像素坐标的 x 值。
 * @param {number} y - 像素坐标的 y 值。
 * @param {number} mapWidth - 地图的像素宽度。
 * @param {number} mapHeight - 地图的像素高度。
 * @returns {Object} 包含逻辑坐标的对象，格式为 { x: 'xValxDir', y: 'yValyDir' }，
 *                   其中 xVal 和 yVal 是逻辑坐标的绝对值（保留一位小数），
 *                   xDir 和 yDir 是方向后缀（'w' 代表西，'e' 代表东，'n' 代表北，'s' 代表南）。
 */
function pixelToLogic(x, y, mapWidth, mapHeight) {
    // 像素坐标转逻辑坐标，左上为(0,0)
    // 逻辑坐标x:东西，y:南北
    let logicX = (x / mapWidth) * mapLogicWidth;
    let logicY = (y / mapHeight) * mapLogicHeight;
    // 方向后缀，地图上北下南左西右东
    let xDir = logicX < mapLogicWidth / 2 ? 'w' : 'e';
    let yDir = logicY < mapLogicHeight / 2 ? 'n' : 's';
    let xVal = Math.abs(logicX - mapLogicWidth / 2).toFixed(1);
    let yVal = Math.abs(logicY - mapLogicHeight / 2).toFixed(1);
    return { x: xVal + xDir, y: yVal + yDir };
}

/**
 * 将单个字母转换为对应的数字。
 * 
 * @param {string} letter - 需要转换的字母。
 * @returns {number} 返回与输入字母对应的数字。
 * @throws {Error} 如果输入的字母不在映射表中，则抛出错误。
 */
function letterToNumber(letter) {
    // 判断映射表中是否存在该字母
    if (letterToNumberMap.hasOwnProperty(letter)) {
        // 如果存在，返回对应的数字
        return letterToNumberMap[letter];
    } else {
        // 如果不存在，抛出错误
        throw new Error("Invalid input: " + letter);
    }
}

/**
 * 将属性数组中的每个子属性转换为对应的数字。
 * 
 * @param {string[]} attributeArray - 包含子属性的字符串数组。
 * @returns {number[][]} 返回一个新的二维数组，其中每个子属性都被转换为对应的数字。
 */
function attributesToNumber(attributeArray) {
    // 使用map方法遍历属性数组
    return attributeArray.map(element => {
        // 将字符串拆分为数组，并将每个子属性转换为数字
        return element.split('/').map(subAttr => letterToNumber(subAttr));
    });
}