/**
 * 裁剪画布图像
 * 该函数接收一个图像源（imageSrc），加载图像，然后根据图像的尺寸进行裁剪，
 * 以确保裁剪后的图像宽度和高度都是8的倍数。
 * @param {string} imageSrc - 图像的源路径或URL
 * @returns {Promise<HTMLCanvasElement|null>} 裁剪后的画布元素的Promise，如果发生错误则返回null
 */
function cropImageToCanvas(imageSrc) {
    return new Promise((resolve, reject) => {
        // 创建一个新的canvas元素
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        // 创建一个新的Image对象
        var img = new Image();
        img.crossOrigin = 'Anonymous'; // 处理跨域问题
        img.onload = function() {
            // 计算裁剪后的尺寸
            var width = img.width - (img.width % 8) || 8;
            var height = img.height - (img.height % 8) || 8;

            // 设置canvas尺寸
            canvas.width = width;
            canvas.height = height;

            // 将图像绘制到canvas上
            ctx.drawImage(img, 0, 0, width, height);

            // 解析图像数据
            if (ctx.getImageData(0, 0, width, height)) {
                resolve(canvas);
            } else {
                reject(new Error('Failed to get image data'));
            }
        };
        img.onerror = function() {
            reject(new Error('Image load error'));
        };

        // 设置图像源并加载图像
        img.src = imageSrc;
    });
}

// 使用jQuery简化DOM操作
$(document).ready(function() {
    // 假设有一个按钮用于触发图像裁剪
    $('#cropImageButton').click(function() {
        var imageSrc = $('#imageSrc').val(); // 假设有一个输入框用于输入图像源
        cropImageToCanvas(imageSrc)
            .then(croppedCanvas => {
                // 将裁剪后的canvas添加到DOM中显示
                $('body').append(croppedCanvas);
            })
            .catch(error => {
                alert('Failed to crop image: ' + error.message);
            });
    });
});