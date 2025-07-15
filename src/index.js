//提示框配置，链接：https://blog.csdn.net/u012131025/article/details/118085164
// Qmsg.config({

// })
$(document).ready(function () {
    // 导入预设位置信息
    import('../src/data.js')
        .then(module => {
            const EASYINPUT = module.EASYINPUT;
            // 初始化下拉菜单
            initDropdowns(EASYINPUT);
        })
        .catch(error => {
            console.error('加载位置数据失败:', error);
            Qmsg.error('加载位置数据失败，请刷新页面重试');
        });

    // 侧边栏切换逻辑（添加动画）
    $('.sidebar-item').click(function () {
        $('.sidebar-item').removeClass('active');
        $(this).addClass('active');
        var section = $(this).data('section');

        // 添加淡出动画
        $('.section:visible').addClass('fade-out');

        setTimeout(() => {
            $('.section').hide().removeClass('fade-out');
            const $targetSection = $('[data-section="' + section + '"]');
            $targetSection.show().addClass('fade-in');

            setTimeout(() => {
                $targetSection.removeClass('fade-in');
            }, 200);
        }, 200);
    });

    // 初始化下拉菜单
    function initDropdowns(locations) {
        // 生成下拉选项
        const $startOptions = $('#startLocationOptions');
        const $endOptions = $('#endLocationOptions');

        // 清空现有选项
        $startOptions.empty();
        $endOptions.empty();

        // 添加选项
        for (const key in locations) {
            if (locations.hasOwnProperty(key)) {
                const location = locations[key];

                // 为起点下拉框添加选项
                const $startItem = $('<div class="dropdown-item" data-id="' + location.id + '">' + location.name + '</div>');
                $startItem.on('click', function () {
                    // 设置起点坐标
                    $('#y1').val(location.lie[0]);
                    $('#x1').val(location.lie[1]);
                    // 关闭下拉框
                    $('#startLocationOptions').removeClass('show');
                    // 更新按钮文本
                    $('#startLocationDropdown .dropdown-button').text(location.name);
                });
                $startOptions.append($startItem);

                // 为终点下拉框添加选项
                const $endItem = $('<div class="dropdown-item" data-id="' + location.id + '">' + location.name + '</div>');
                $endItem.on('click', function () {
                    // 设置终点坐标
                    $('#y2').val(location.lie[0]);
                    $('#x2').val(location.lie[1]);
                    // 关闭下拉框
                    $('#endLocationOptions').removeClass('show');
                    // 更新按钮文本
                    $('#endLocationDropdown .dropdown-button').text(location.name);
                });
                $endOptions.append($endItem);
            }
        }

        // 下拉框切换逻辑
        $('.dropdown-button').on('click', function (e) {
            e.stopPropagation();
            const $content = $(this).siblings('.dropdown-content');

            // 关闭所有其他下拉框
            $('.dropdown-content').not($content).removeClass('show');

            // 切换当前下拉框
            $content.toggleClass('show');

            // 如果打开，只旋转箭头(三角形)而不是整个按钮
            if ($content.hasClass('show')) {
                $(this).find('::after').css('transform', 'rotate(180deg)');
                // 使用CSS类控制三角形旋转
                $(this).addClass('dropdown-open');
            } else {
                $(this).find('::after').css('transform', '');
                // 移除CSS类
                $(this).removeClass('dropdown-open');
            }
        });

        // 点击页面其他位置关闭下拉框
        $(document).on('click', function () {
            $('.dropdown-content').removeClass('show');
            $('.dropdown-button').removeClass('dropdown-open');
        });
    }

    // 设置界面逻辑
    // 读取设置（本地存储）
    let autoCopy = localStorage.getItem('autoCopy') === 'true';
    $('#autoCopySwitch').prop('checked', autoCopy);

    // 简繁转换设置
    let zhConvert = localStorage.getItem('zhConvert') === 'true';
    $('#zhConvertSwitch').prop('checked', zhConvert);

    $('#applySettings').click(function () {
        autoCopy = $('#autoCopySwitch').prop('checked');
        localStorage.setItem('autoCopy', autoCopy);
        zhConvert = $('#zhConvertSwitch').prop('checked');
        localStorage.setItem('zhConvert', zhConvert);
        Qmsg.success('设置已保存');
        if (zhConvert) {
            convertPageToTraditional();
        } else {
            convertPageToSimplified();
        }
    });
    $('#resetSettings').click(function () {
        $('#autoCopySwitch').prop('checked', false);
        localStorage.setItem('autoCopy', false);
        $('#zhConvertSwitch').prop('checked', false);
        localStorage.setItem('zhConvert', false);
        Qmsg.info('设置已重置');
        convertPageToSimplified();
    });

    // 页面加载时根据设置自动转换
    if (zhConvert) {
        convertPageToTraditional();
    }

    // 绑定点击事件到按钮
    $('#calculateButton').click(function () {
        // 获取输入的坐标
        let y1 = $('#y1').val();
        let x1 = $('#x1').val();
        let x2 = $('#x2').val();
        let y2 = $('#y2').val();
        // 检查输入是否有效
        if (!(isValidCoordinateString(y1) && isValidCoordinateString(y2)
            && isValidCoordinateString(x1) && isValidCoordinateString(x2))) {
            Qmsg.error('请输入正确的数据');
            return;
        }
        //经纬度转换为直角坐标系下坐标，地图原点为原点
        let transformLie = convertCoordinates([[y1, x1], [y2, x2]]);
        // 计算两点之间的距离
        let distance = Math.sqrt(Math.pow(transformLie[0][1] - transformLie[1][1], 2) + Math.pow(transformLie[0][0] - transformLie[1][0], 2));
        let degrees = Math.atan2(transformLie[1][0] - transformLie[0][0], transformLie[1][1] - transformLie[0][1]) * (180 / Math.PI);
        //角度转为N偏W多少度类似形式
        degrees = degreesReadability(degrees);
        // 显示结果
        let result = '距离：' + distance.toFixed(2) + '\n方向：' + degrees + "°";
        $('#result').text(result);
        // 判断设置是否自动复制
        if (localStorage.getItem('autoCopy') === 'true') {
            copyToClipboard(result);
            Qmsg.info('结果已复制至粘贴板');
        }
    });

    // 修正图片裁剪异常
    const mapBigSrc = '../src/assets/images/map-big.png';
    cropImage(mapBigSrc).then(canvas => {
        if (!canvas) {
            Qmsg.error('地图图片加载失败，请检查路径或刷新页面');
            return;
        }
        $('.imageCalculate').children().css({
            "width": canvas.width / 8 + "px",
            "height": canvas.height / 8 + "px"
        })
        $(".imgSmallSpan").append(canvas);
        $(".imgBigSpan").append(copyCanvas(canvas));
        $(".imgSmallSpan > canvas").css({
            "width": "100%",
            "height": "100%"
        });

        const bigCanvasWidth = parseFloat($('.imgBigSpan > canvas').css('width'));
        const zoomLevel = bigCanvasWidth / parseFloat($('.imgBigSpan').css('width'));
        $('.imgSmallSpan').mousemove((event) => {
            const { offsetX: x, offsetY: y } = event;
            const bigWidth = $('.imgBigSpan').width();
            const bigHeight = $('.imgBigSpan').height();

            $('.imgBigSpan > canvas').css({
                'transform': `translate(
            ${-x * zoomLevel + bigWidth / 2}px,
            ${-y * zoomLevel + bigHeight / 2}px
        )`
            });
        });

        // 地图点击获取坐标并标记
        let clickState = 0; // 0:未选，1:已选起点，2:已选终点
        let startMarker = null, endMarker = null;
        let startCoord = null, endCoord = null;

        $('.imgSmallSpan').off('click').on('click', function (e) {
            // 获取点击坐标相对于图像容器的位置
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 获取canvas实际显示尺寸和原始像素尺寸的缩放比例
            const canvas = $(this).find('canvas')[0];
            if (!canvas) return;

            const mapWidth = canvas.width;  // 原始宽度
            const mapHeight = canvas.height; // 原始高度
            const displayWidth = $(canvas).width();  // 显示宽度
            const displayHeight = $(canvas).height(); // 显示高度

            // 计算实际坐标（考虑缩放）
            const scaleX = mapWidth / displayWidth;
            const scaleY = mapHeight / displayHeight;
            const px = x * scaleX;
            const py = y * scaleY;

            // 转换为逻辑坐标
            const coord = pixelToLogic(px, py, mapWidth, mapHeight);

            // 根据当前状态更新UI
            // 点击地图时的起点和终点小圆
            if (clickState === 0) {
                // 设置起点
                startCoord = coord;
                $('#y1').val(coord.y);
                $('#x1').val(coord.x);
                if (startMarker) startMarker.remove();
                startMarker = $('<div class="map-marker start-marker"></div>');
                startMarker.css({
                    left: x - 7 + 'px',
                    top: y - 7 + 'px'
                });
                $(this).append(startMarker);
                clickState = 1;
            } else if (clickState === 1) {
                // 设置终点
                endCoord = coord;
                $('#y2').val(coord.y);
                $('#x2').val(coord.x);
                if (endMarker) endMarker.remove();
                endMarker = $('<div class="map-marker end-marker"></div>');
                endMarker.css({
                    left: x - 7 + 'px',
                    top: y - 7 + 'px'
                });
                $(this).append(endMarker);
                clickState = 2;
            } else {
                // 重置
                if (startMarker) startMarker.remove();
                if (endMarker) endMarker.remove();
                startMarker = null;
                endMarker = null;
                startCoord = null;
                endCoord = null;
                clickState = 0;
                $('#y1').val('');
                $('#x1').val('');
                $('#y2').val('');
                $('#x2').val('');
            }
        });
    }).catch(error => Qmsg.error('地图图片加载失败: ' + error));
    
    $("#calculate-btn").on('click', function () {// 初始化父亲和母亲的属性数组
        let fatherAttributes = [];
        let motherAttributes = [];
        // 获取父亲属性
        if ($.trim($('#father-quick-input').val()) === '') {
            $('.parent-card:first .stat-input').each(function () {
                fatherAttributes.push($(this).val());
            });
        }else {
            fatherAttributes = $('#father-quick-input').val().split(' ');
        }
        // 获取母亲属性
        if ($.trim($('#mother-quick-input').val()) === '') {
            $('.parent-card:last .stat-input').each(function () {
                motherAttributes.push($(this).val());
            });
        }else {
            motherAttributes = $('#mother-quick-input').val().split(' ');
        }
        if (fatherAttributes.length !== 19 || motherAttributes.length !== 19 || fatherAttributes.some(str => str.trim() === '') || motherAttributes.some(str => str.trim() === '')) {
            Qmsg.error('父亲或母亲属性输入有误，请检查');
            return;
        }
        console.log(fatherAttributes, motherAttributes);
    });
});