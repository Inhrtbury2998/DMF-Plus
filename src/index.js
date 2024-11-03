//提示框配置，链接：https://blog.csdn.net/u012131025/article/details/118085164
// Qmsg.config({

// })
$(document).ready(function () {
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
        copyToClipboard(result);
        Qmsg.info('结果已复制至粘贴板');
    });


    //利用绝对路径和index.html与utils.js的路径关系得到map-big.png与utils.js的路径关系
    let mapBigSrc = getLastPartOfString(window.location.href, "DMF/") + 'src/assets/images/map-big.png';
    let croppedCanvas = cropImage(mapBigSrc);
    if(!croppedCanvas)
        console.error("croppedCanvas should not be null or undefined");
    console.log(croppedCanvas);
        // 将裁剪后的canvas添加到DOM中显示
        // $('.imageCalculate').children().append(croppedCanvas).css({
        //     "width": $(croppedCanvas).width() / 8 + "px",
        //     "height": $(croppedCanvas).height() / 8 + "px"
        // });
        // $(".imgSmallSpan > canvas").css({
        //     "width": "100%",
        //     "height": "100%"
        // })
});

