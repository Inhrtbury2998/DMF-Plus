//提示框配置，链接：https://blog.csdn.net/u012131025/article/details/118085164
// Qmsg.config({

// })
$(document).ready(function () {
    // 侧边栏切换逻辑
    $('.sidebar-item').click(function () {
        $('.sidebar-item').removeClass('active');
        $(this).addClass('active');
        var section = $(this).data('section');
        $('.section').hide();
        $('[data-section="' + section + '"]').show();
    });

    // 设置界面逻辑
    // 读取设置（本地存储）
    let autoCopy = localStorage.getItem('autoCopy') === 'true';
    $('#autoCopySwitch').prop('checked', autoCopy);

    $('#applySettings').click(function () {
        autoCopy = $('#autoCopySwitch').prop('checked');
        localStorage.setItem('autoCopy', autoCopy);
        Qmsg.success('设置已保存');
    });
    $('#resetSettings').click(function () {
        $('#autoCopySwitch').prop('checked', false);
        localStorage.setItem('autoCopy', false);
        Qmsg.info('设置已重置');
    });

    // 绑定点击事件到按钮
    $('#calculateButton').click(function () {
        // 获取输入的坐标
        let y1 = parseFloat($.trim($('#y1').val()));
        let x1 = parseFloat($.trim($('#x1').val()));
        let x2 = parseFloat($.trim($('#x2').val()));
        let y2 = parseFloat($.trim($('#y2').val()));
        //经纬度转换为直角坐标系下坐标，地图原点为原点
        if (y1 && y2 && x1 && x2) {
            Qmsg.error('请输入正确的数据');
        }
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
    }).catch(error => Qmsg.error('地图图片加载失败: ' + error));
});