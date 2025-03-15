// 图片放大镜功能封装
function createImageMagnifier({imageId, containerId, zoomedId, zoomLevel = 2}) {
    const container = document.getElementById(containerId);
    const zoomBox = container.querySelector('.zoom-box');
    const zoomedContainer = document.getElementById(zoomedId);
    const zoomedImg = zoomedContainer.querySelector('img');
    const img = document.getElementById(imageId);
    let isReady = false;

    // 图片加载完成后初始化
    img.onload = function() {
        zoomedImg.src = img.src; // 同步图片源
        zoomedImg.style.width = `${this.naturalWidth * zoomLevel}px`;
        zoomedImg.style.height = `${this.naturalHeight * zoomLevel}px`;
        isReady = true;
    };

    // 鼠标移动处理
    container.addEventListener('mousemove', (e) => {
        if (!isReady) return;
        
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 计算放大框位置
        let boxX = mouseX - zoomBox.offsetWidth / 2;
        let boxY = mouseY - zoomBox.offsetHeight / 2;
        boxX = Math.max(0, Math.min(boxX, rect.width - zoomBox.offsetWidth));
        boxY = Math.max(0, Math.min(boxY, rect.height - zoomBox.offsetHeight));

        // 更新放大框位置
        zoomBox.style.display = 'block';
        zoomBox.style.left = `${boxX}px`;
        zoomBox.style.top = `${boxY}px`;

        // 计算放大图片位置
        const percentX = boxX / (rect.width - zoomBox.offsetWidth);
        const percentY = boxY / (rect.height - zoomBox.offsetHeight);
        const maxLeft = zoomedImg.offsetWidth - zoomedContainer.offsetWidth;
        const maxTop = zoomedImg.offsetHeight - zoomedContainer.offsetHeight;

        zoomedImg.style.left = `-${percentX * maxLeft}px`;
        zoomedImg.style.top = `-${percentY * maxTop}px`;
    });

    // 鼠标离开处理
    container.addEventListener('mouseleave', () => {
        zoomBox.style.display = 'none';
        zoomedImg.style.left = '0';
        zoomedImg.style.top = '0';
    });
}

// 创建标记点功能封装
function createDotHandler({containerId, imageId, colors = ['red', 'blue']}) {
    const container = document.getElementById(containerId);
    const img = document.getElementById(imageId);
    let clickState = 0;

    container.addEventListener('click', (e) => {
        if (!img.complete) return;

        // 获取坐标转换数据
        const [scale, offsetX, offsetY] = getImageTransformData(img, container);
        const rect = container.getBoundingClientRect();

        // 计算实际坐标
        const displayX = (e.clientX - rect.left - offsetX) / scale;
        const displayY = (e.clientY - rect.top - offsetY) / scale;
        const containerX = displayX * scale + offsetX;
        const containerY = displayY * scale + offsetY;

        // 状态管理
        if (clickState >= colors.length) {
            clearDots(container);
            clickState = 0;
            return;
        }

        // 创建标记点
        createDot(container, containerX, containerY, colors[clickState]);
        clickState++;
    });
}

// 公共工具函数
function getImageTransformData(img, container) {
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = containerWidth / containerHeight;

    let scale, offsetX = 0, offsetY = 0;

    if (imgRatio > containerRatio) {
        scale = containerHeight / img.naturalHeight;
        offsetX = (containerWidth - img.naturalWidth * scale) / 2;
    } else {
        scale = containerWidth / img.naturalWidth;
        offsetY = (containerHeight - img.naturalHeight * scale) / 2;
    }

    return [scale, offsetX, offsetY];
}

function createDot(container, x, y, color) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        background-color: ${color};
    `;
    container.appendChild(dot);
}

function clearDots(container) {
    container.querySelectorAll('.dot').forEach(dot => dot.remove());
}
/*
示例
// 初始化放大镜功能
createImageMagnifier({
    imageId: 'mainImage',
    containerId: 'originalContainer',
    zoomedId: 'zoomedContainer',
    zoomLevel: 3
});

// 初始化标记点功能
createDotHandler({
    containerId: 'originalContainer',
    imageId: 'mainImage',
    colors: ['#ff0000', '#0000ff'] // 支持自定义颜色
});
 */