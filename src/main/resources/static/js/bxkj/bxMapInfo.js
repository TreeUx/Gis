var map;    //创建地图
var marker; //覆盖物
var flag; //绘制与线路规划标记
var bdMap = '<div id="bx_bdmap"></div>'
var gdMap = '<div id="bx_gdmap"></div>'
var ggMap = '<div id="bx_ggmap"></div>'
var mapType; //地图类型
var parentid; //景点父类id
var cpLock = true;
var enterAndExitArr = new Array() //当前搜索的景点的出入口坐标数组
var radius = 150  //水纹圆半径(150米)
var different_text; //区别路线规划和线路采集使用
/*坐标转换需要的常量 Start*/
var x_PI = 3.14159265358979324 * 3000.0 / 180.0;
var PI = 3.1415926535897932384626;
var a = 6378245.0;
var ee = 0.00669342162296594323;
/*坐标转换需要的常量 End*/
var addLineClick; //鼠标点击事件

$(function () {
    /*测试百度坐标转换 Start*/
    /* var convertor = new BMap.Convertor()
     var x = 115.264244
     var y = 23.043452
     var ggpoint = new BMap.Point(x, y)
     var pointArr = new Array()
     pointArr.push(ggpoint)
     convertor.translate(pointArr, 5, 3, function (data) { //百度坐标系转换为国测局坐标系
         console.log(data)
         var x1 = data.points[0].lng
         var y1 = data.points[0].lat
         var wgsPoint = gcj02towgs84(x1, y1)
         console.log(wgsPoint)
         console.log(wgsPoint.lng)
         console.log(wgsPoint.lat)
     })*/
    /*测试百度坐标转换 End*/

    /*自定义控件start*/
    // 通过JavaScript的prototype属性继承于BMap.Control
    ZoomControl.prototype = new BMap.Control();

    // 自定义控件必须实现initialize方法，并且将控件的DOM元素返回
    // 在本方法中创建个div元素作为控件的容器，并将其添加到地图容器中
    ZoomControl.prototype.initialize = function (map) {
        // 创建一个DOM元素
        var div = document.createElement("div");
        // 添加自定义指南针
        var content = '<div class="amap-controlbar" style="right: 10px; top: 620px;">' +
            '<div class="amap-luopan">' +
            '<div class="amap-luopan-bg">' +
            '</div>' +
            '<div class="amap-compass" style="transform: rotateX(-6.66667deg) rotateZ(-15deg);">' +
            '<div class="amap-pointers">' +
            '</div>' +
            '</div>' +
            '<div class="amap-pitchUp amap-controlbar-disable">' +
            '</div>' +
            '<div class="amap-pitchDown amap-controlbar-disable">' +
            '</div>' +
            '<div class="amap-rotateLeft">' +
            '</div>' +
            '<div class="amap-rotateRight">' +
            '</div></div><div class="amap-controlbar-zoom" style="display: none;">' +
            '<div></div><div class="amap-controlbar-zoom-add"></div>' +
            '<div class="amap-controlbar-zoom-sub">' +
            '</div></div></div>';
        $("#bx_bdmap").append(content)
        // 设置样式
        div.style.cursor = "openhand";
        div.style.border = "1px solid gray";
        div.style.backgroundColor = "white";
        // 绑定事件，点击一次放大两级
        $(".amap-rotateRight").on("click", function () {
            // map.zoomTo(map.getZoom() + 2);
            $(".amap-rotateRight").addClass("amap-rotateRight-active")
        })

        // 添加DOM元素到地图中
        map.getContainer().appendChild(div);
        // 将DOM元素返回
        return div;
    }
    /*自定义控件end*/

    //展开、隐藏
    $("#tog").click(function () {
        var t = $(this).text();
        if (t == "折叠") {
            $(this).text("展开");
            // $("#scenery_box").css('display','none');
            $("#scenery_box").fadeOut("5000");
        } else {
            // $("#scenery_box").css('display','block');
            $("#scenery_box").fadeTo("5000", 0.9)
            $(this).text("折叠");
        }
    });

    //搜索提示 start
    $('#input_name').off().bind({
        //中文输入开始
        compositionstart: function () {
            cpLock = false;
        },
        //中文输入结束
        compositionend: function () {
            cpLock = true;
        },
        //input框中的值发生变化
        input: function () {
            setTimeout(function () {
                if (cpLock) {
                    //这里处理中文输入结束的操作
                    var scenery_name = $("#input_name").val()
                    querySceneryInfo(scenery_name)

                    $("#input_name").bind("keyup", function () {//为搜索框添加回车事件
                        // console.log(event.keyCode)
                        if (event.keyCode == 13) {
                            queryMapInfo();//调用查询
                            console.log("触发回车")
                            return false;
                        }
                    })
                }

            }, 10)
        }
    })
    //搜索提示 end

    /*点击标题添加样式 Start*/
    $("#bx_title_ul li").click(function () {
        //先移除兄弟的背景
        $("#bx_title_ul").find('li').removeClass("bx_li_click")
        $(this).addClass('bx_li_click');
        // console.log($(this).attr("index"))
        var index = $(this).attr("index")
        switch (index) {
            case "1":
                $("#bx_user_manage").addClass("hide_and_show")
                $("#bx_content").removeClass("hide_and_show")
                break
            case "2":
                $("#bx_content").addClass("hide_and_show")
                $("#bx_user_manage").removeClass("hide_and_show")
                break
            default :
                $("#bx_user_manage").addClass("hide_and_show")
                $("#bx_content").removeClass("hide_and_show")
                break
        }
    });
    /*点击标题添加样式 End*/

});

var timeStart, timeEnd, time;//申明全局变量
function getTimeNow() {//获取此刻时间
    var now = new Date();
    return now.getTime();
}

/*function holdDown() { //鼠标按下时触发
    timeStart = getTimeNow();//获取鼠标按下时的时间
    time = setInterval(function () { //setInterval会每100毫秒执行一次
        timeEnd = getTimeNow();//也就是每100毫秒获取一次时间
        if (timeEnd - timeStart > 1000) { //如果此时检测到的时间与第一次获取的时间差有1000毫秒
            clearInterval(time);//便不再继续重复此函数 （clearInterval取消周期性执行）
            // alert("长按");//并弹出代码
        }
    }, 100);
}

function holdUp() {
    clearInterval(time);//如果按下时间不到1000毫秒便弹起，
}*/

//监听鼠标事件（设置点击获取坐标及水纹展示）
var min_distance; //存放在雷达扫描圈中的出入口坐标的数组
var min_lng; //距离最近的经度值
var min_lat; //距离最近的纬度值
var circles1; //探测出入口的水波圆
var bl_drag = false; //拖拽地图控制开关
function listenMouseClick(map, pointList, pointListY, different_text) {
    /*监听鼠标事件 Start*/
    var bl_flag; //判断是否长按鼠标获取坐标点
    var m = document.getElementById('bx_bdmap'); //获取地图元素
    map.addEventListener("mousemove", function (e) {//设置鼠标移动过程中监听事件（获取坐标使用）
        console.log(e.point.lng + "," + e.point.lat); //鼠标所在位置的经纬度坐标
        var start_poi = false //判断起点是否选择出入口的开关
        //参数：每一层播放的间隔时间、每一层扩散至最大所花费的总时间。
        //半径、层数、中心点、{填充颜色、初始透明度}
        //鼠标按下
        m.onmousedown = function () {//down向下
            bl_flag = false //判断是否长按鼠标获取坐标点
            //参数：每一层播放的间隔时间、每一层扩散至最大所花费的总时间。
            //半径、层数、中心点、{填充颜色、初始透明度}
            console.log(event.button) //监听是鼠标左键还是右键点击(event.button==0是点击了左键，event.button==2是点击了右键)
            if (event.button == 0) { //判断点击鼠标左键
                timeStart = getTimeNow();//获取鼠标按下时的时间
                circles1 = new CircleShow(radius, 4, new BMap.Point(e.point.lng, e.point.lat), {
                    fillColor: 'red',
                    fillOpacity: 0.8
                });
                //参数：每一层播放的间隔时间、每一层扩散至最大所花费的总时间。
                time = setInterval(function () { //setInterval会每100毫秒执行一次
                    timeEnd = getTimeNow();//也就是每100毫秒获取一次时间
                    if (timeEnd - timeStart > 250) { //如果此时检测到的时间与第一次获取的时间差有1000毫秒
                        clearInterval(time);//便不再继续重复此函数 （clearInterval取消周期性执行）
                        console.log("长按触发")
                        map.addEventListener("dragstart", function () { //监听地图开始拖拽事件
                            bl_drag = true
                            console.log("地图被拖拽")
                        })
                        map.addEventListener("dragend", function () { //监听地图结束拖拽事件
                            bl_drag = false
                            console.log("地图拖拽结束")
                        })
                        if (!bl_drag) { //此处代码在拖拽结束的监听事件之前被执行
                            console.log("展示水波圆")
                            circles1.start(500, 1500); //水波圆开始
                        }

                        bl_flag = true //判断是否长按鼠标获取坐标点
                    }
                }, 260);
                console.log('鼠标按下啦');
                console.log(e.point.lng + "," + e.point.lat)
            }
        }
        //鼠标抬起
        m.onmouseup = function () {//up向上
            console.log('鼠标抬起来啦');
            // circles1.stop() //停止水波
            if (event.button == 0) { //判断点击鼠标左键
                if (bl_flag || "line_plan" == different_text) {
                    console.log(enterAndExitArr)
                    console.log("进入长按采点 Start")
                    var lng = e.point.lng;
                    var lat = e.point.lat;
                    var loca = lng + "," + lat
                    console.log(lng + "," + lat)
                    for (let i = 0; i < enterAndExitArr.length; i++) {
                        let lng_tp = enterAndExitArr[i].lng //出入口/景点单元出入口经度
                        let lat_tp = enterAndExitArr[i].lat //出入口/景点单元出入口纬度
                        var distance = (map.getDistance(new BMap.Point(lng_tp, lat_tp), new BMap.Point(lng, lat))).toFixed(2) //算出距离
                        if (radius >= distance) {
                            min_lng = lng_tp //将选择的出入口的坐标经度赋值给起点的经度
                            min_lat = lat_tp //将选择的出入口的坐标纬度赋值给起点的纬度
                            if (min_distance > distance) { //把经纬度赋值为离得最近的出入口的经纬度坐标值
                                min_lng = lng_tp //将选择的出入口的坐标经度赋值给起点的经度
                                min_lat = lat_tp //将选择的出入口的坐标纬度赋值给起点的纬度
                            }
                            min_distance = distance
                            start_poi = true
                        } else {
                            continue
                        }
                    }
                    if (min_lng != null && min_lng != undefined) {
                        lng = min_lng
                        lat = min_lat
                    }
                    if ("line_plan" == different_text) {
                        start_poi = true
                    }
                    if (start_poi) { //判断起点选择出入口后进行起点的标点
                        if ($.inArray(loca, pointS) == -1) {//过滤鼠标多次点击时重复数据
                            var marker = new BMap.Marker(new BMap.Point(lng, lat));//设置标注点
                            // marker.enableDragging();//设置标注可以拖拽
                            marker.enableMassClear();//允许覆盖物在map.clearOverlays方法中被清除
                            map.addOverlay(marker);//添加标注点
                            marker.setAnimation(BMAP_ANIMATION_DROP)  //设置标注点动态效果
                            marker.addEventListener("dragend", function (e) {//监听标注拖拽事件
                                console.log("当前位置：" + e.point.lng + "," + e.point.lat);//输出拖拽后的标注坐标点
                            })

                            pointS.push(loca)
                            /*采线标点 Start*/
                            pointList.push(new BMap.Point(lng, lat));//连线标注点
                            console.log("**********")
                            console.log(pointList) //线路绘制的点坐标集合
                            console.log("**********")
                            if ("routing" == flag) { //如果是规划路线，则只标出两个点
                                if (pointList.length == 3) {
                                    map.clearOverlays()
                                    pointList.splice(1, 1)  //丛数组第一个下表开始删除，删除一个元素
                                    for (var i = 0; i < pointList.length; i++) {
                                        lng = pointList[i].lng
                                        lat = pointList[i].lat
                                        var marker = new BMap.Marker(new BMap.Point(lng, lat));//设置标注点
                                        // marker.enableDragging();//设置标注可以拖拽
                                        marker.enableMassClear();//允许覆盖物在map.clearOverlays方法中被清除
                                        map.addOverlay(marker);//添加标注点
                                        if (i == 1) {
                                            marker.setAnimation(BMAP_ANIMATION_DROP) //设置特效
                                        }
                                    }
                                }
                                if (pointList.length == 2) {
                                    typing = new BMap.WalkingRoute(map, {//步行
                                        renderOptions: {
                                            map: map,
                                            autoViewport: true
                                        }
                                    });
                                    for (var i = 0; i < pointList.length; i++) {
                                        let lng = pointList[i].lng //使用路线规划功能时采集的经度
                                        let lat = pointList[i].lat //路线规划的纬度
                                        if (i == 0) {
                                            start = new BMap.Point(lng, lat);
                                        } else {
                                            end = new BMap.Point(lng, lat);
                                        }
                                    }
                                    typing.search(start, end);
                                }
                            }
                            if ("start" == flag) {
                                polyline = new BMap.Polyline(
                                    pointList       //标注点坐标集合
                                    , {
                                        strokeColor: "red",
                                        enableClicking: true,//是否响应点击事件，默认为true
                                        strokeOpacity: 0.8,
                                        strokeWeight: '6',//折线的宽度，以像素为单位
                                        strokeStyle: "dashed",
                                        enableEditing: false  //是否启用线编辑，默认为false
                                    });//创建折线
                            } else {
                                polyline = new BMap.Polyline(
                                    pointList       //标注点坐标集合
                                    , {
                                        strokeColor: "red",
                                        enableClicking: true,//是否响应点击事件，默认为true
                                        strokeOpacity: 0.8,
                                        // icons:[icons], //创建标注覆盖物所使用的图标
                                        strokeWeight: '2',//折线的宽度，以像素为单位
                                        strokeStyle: "dashed",
                                        enableEditing: false  //是否启用线编辑，默认为false
                                    });//创建折线
                            }
                            polyline.enableMassClear()//设置允许覆盖物在map.clearOverlays方法中被清除
                            map.addOverlay(polyline);//添加标注连线
                            listenKey(map, pointList, pointListY);//监听键盘
                            /*采线标点 End*/
                            console.log("进入长按采点 End")
                        }
                    } else {
                        if (!bl_drag && enterAndExitArr.length != 0) { //此处代码在拖拽结束的监听事件之前被执行(并且是已录入了出入口的景区)
                            if (pointList.length == 0) {
                                alert("未探测到任何可作为线路起点的出入口!")
                            } else {
                                alert("未探测到任何可作为线路终点的出入口!")
                            }
                        }
                    }
                }
                circles1.remove() //移除
            }
        }
    })
    /*监听鼠标事件 End*/
}

/*百度转GPS坐标修正 Start*/
var transedPointStrs = "" //transedPointStrs转换坐标后的字符串
function transToGps(pointList) { //pointList转换前的坐标点数组
    console.log(pointList)
    var pointArr = new Array()
    var index = 0
    for (var i = 0; i < pointList.length; i++) {
        // var tempPoint = {}
        var convertor = new BMap.Convertor()
        var x1 = pointList[i].lng
        var y1 = pointList[i].lat
        pointArr.push(pointList[i]);
        index++
    }

    var len = pointArr.length
    if (len <= 10) {
        convertor.translate(pointArr, 5, 3, function (data) {
            console.log(data)
            if (data.status === 0) {
                for (var k = 0; k < pointArr.length; k++) {
                    var x2 = data.points[k].lng
                    var y2 = data.points[k].lat
                    var tempPoint = gcj02towgs84(x2, y2)
                    var x = tempPoint.lng
                    var y = tempPoint.lat
                    console.log(x + "," + y)
                    transedPointStrs = transedPointStrs + (x.toFixed(10) + "," + y.toFixed(10) + " ")  //拼接转换后的坐标
                }
                setTimeout(function () {
                    if (index == pointList.length) { //保存线路点信息
                        debugger
                        console.log(transedPointStrs)
                        console.log(index)
                        console.log("调用保存")
                        var end_pointbl = false //判断最后的坐标点是否是出入口坐标使用
                        for (let i = 0; i < enterAndExitArr.length; i++) {
                            let end_point = pointList[pointList.length - 1] //采集线路的最后一个点坐标
                            if (end_point.equals(enterAndExitArr[i])) {
                                end_pointbl = true
                            }
                        }
                        if (!end_pointbl) {
                            alert("终点必须是出入口坐标!")
                        } else {
                            addPointlineInfos(transedPointStrs, pointList)
                            transedPointStrs = "" //重置
                        }
                    }
                }, 50)
            }
        })
    } else {
        var math = parseInt(len / 10)
        var index1 = 0
        var index2 = 0
        var pointLists = new Array()
        for (var m = 0; m < math + 1; m++) {
            // setTimeout(function () { //定时器
            translateCallback = function (data) { //百度坐标系转换为原始坐标系（回调函数）
                debugger
                console.log("标记2")
                console.log(pointLists)
                console.log(data)
                if (data.status === 0) {
                    for (var t = 0; t < data.points.length; t++) {
                        var x2 = data.points[t].lng //百度经度
                        var y2 = data.points[t].lat //百度纬度
                        var tempPoint = gcj02towgs84(x2, y2) //百度坐标系转换大地坐标系
                        var x = tempPoint.lng //大地坐标系经度
                        var y = tempPoint.lat //大地坐标系纬度
                        transedPointStrs = transedPointStrs + (x.toFixed(10) + "," + y.toFixed(10) + " ")  //拼接转换后的大地坐标
                    }
                    index2++
                    if (index2 == (math + 1)) { //保存线路点信息
                        debugger
                        console.log(transedPointStrs)
                        var end_pointbl = false //判断最后的坐标点是否是出入口坐标
                        for (let i = 0; i < enterAndExitArr.length; i++) {
                            let end_point = pointList[pointList.length - 1] //采集线路的最后一个点坐标
                            if (end_point.equals(enterAndExitArr[i])) {
                                end_pointbl = true
                            }
                        }
                        if (!end_pointbl) {
                            alert("终点必须是出入口坐标!")
                        } else {
                            addPointlineInfos(transedPointStrs, pointList) //保存采集后的线路数据
                            transedPointStrs = "" //重置
                            index2 = 0
                        }
                    }
                }
            }
            // },1)

            console.log("标记1")
            pointLists = pointArr.slice(index1 * 10, index1 * 10 + 10) //存放一组10个坐标
            index1++
            console.log(pointLists)
            convertor.translate(pointLists, 5, 3, translateCallback) //百度坐标系转换为原始坐标系

        }
    }

}

/*百度转GPS坐标修正 End*/

/*定位当前位置 start*/
function bdFixedPosition() {
    var map = new BMap.Map("bx_bdmap");

    function myFun(result) {
        var cityName = result.name;
        map.setCenter(cityName);
        console.log("当前定位城市:" + cityName + ",坐标为：" + result.center.lng + "," + result.center.lat);
        var lng = result.center.lng
        var lat = result.center.lat
        // map.setMapStyle({style: 'light'});//设置地图样式 JavaScriptAPI V2.0 用法
        map.centerAndZoom(cityName, 17);//初始化地图，设置地图级别

        // 创建自定义控件实例
        var myZoomCtrl = new ZoomControl();
        // 添加到地图当中
        map.addControl(myZoomCtrl);
    }

    var myCity = new BMap.LocalCity();
    myCity.get(myFun);
}

/*定位当前位置 end*/

/**
 * @Author Breach
 * @Description 输入名称进行搜索（根据输入内容查询相应地图信息）
 * @Date 2018/12/20
 */
function queryMapInfo() {
    mapType = $("#map_type_sel").val()
    var scenery_name = $("#input_name").val();
    if (scenery_name != "") {
        switch (mapType) {
            case "bd-map":
                showSceneryInfoMap(scenery_name);//展示查询出的地图(百度)
                map.removeEventListener("click", addLineClick) //重新查询后，移除鼠标单击事件
                var m = document.getElementById('bx_bdmap'); //获取地图元素
                console.log(m)
                if(m.onmousedown != null || m.onmousedown != undefined) {
                    m.onmousedown = null //去除鼠标点击事件
                }
                break
            case "gd-map":
                searchMapInfo(scenery_name)
                break
            case "gg-map":
                alert("建设中...")
                break
            default:
                break
        }
    }
}

//获取景区信息（搜索提示）
function querySceneryInfo(scenery_name) {
    if (scenery_name != "" && scenery_name != null) {
        $.ajax({
            url: "querySceneryInfo",
            type: "post",
            data: {
                "scenery_name": scenery_name
            },
            dataType: "json",
            success: function (data) {
                if (data.status == "success") {
                    // console.log($.parseJSON(JSON.stringify(data)).data)
                    data = $.parseJSON(JSON.stringify(data)).data
                    if (data != "" && data != undefined) {
                        $("#input_name").autocomplete({//输入框提示
                            matchSubset: true, //是否启用缓存
                            delay: 50, //指定在按键发生后多少毫秒后才触发执行自动完成
                            source: data,
                            select: function(e, ui) { //Autocomplete的结果列表任意一项选中时，ui.item为选中的项
                                queryMapInfo() //选值后自动搜索景点地图数据
                            }
                        });
                    }
                    fireKeyEvent(document.getElementById("input_name"), 'keydown', 49); //模拟操作键盘方向键

                    //此事件会在用户选中某一项后触发，参数为：event: 事件对象, data: 选中的数据行,formatted:formatResult函数返回的值;
                    // $("#input_name").result(function(event, data, formatted){alert("测试");})
                } else {
                    showSuccessOrErrorModal(data.msg, "error");
                }
            },
            error: function (e) {
                showSuccessOrErrorModal("网络异常！", "error");
            }
        });
    }
}

// 定义一个控件类，即function
function ZoomControl() {
    // 设置默认停靠位置和偏移量
    this.defaultAnchor = BMAP_ANCHOR_BOTTOM_RIGHT;
    this.defaultOffset = new BMap.Size(10, 50);
}

/**
 * @Author Breach
 * @Description 根据搜索的名称展示相应的地图
 * @Date 2018/12/20
 * @Param null
 * @return
 */
var pointList = new Array(); //标注点数组
function showSceneryInfoMap(scenery_name) {
    var pointListY = new Array();
    // 百度地图API功能
    map = new BMap.Map("bx_bdmap", {enableMapClick: false}); //enableMapClick:false关闭地图可点功能
    // if ($("#input_name").val() != "") { //根据搜索的景区信息展示相应的出入口标记及线路
    //     querySceneryEntranceInfos(map, $("#input_name").val()) //展示景区出入口标记
    // }
    map.enableScrollWheelZoom(true);//滚动缩放
    map.addControl(new BMap.GeolocationControl());  // 定位控件
    // map.setMapStyle({style: 'light'});//设置地图样式 JavaScriptAPI V2.0 用法

    setTimeout(function () {
        if ($("#input_name").val() != "") { //根据搜索的景区信息展示相应的出入口标记及线路
            querySceneryEntranceInfos(map, $("#input_name").val()) //展示景区出入口标记
        }
    }, 10)

    // 添加带有定位的导航控件
    var navigationControl = new BMap.NavigationControl({
        // 靠左上角位置
        anchor: BMAP_ANCHOR_TOP_LEFT,
        // LARGE类型
        type: BMAP_NAVIGATION_CONTROL_LARGE,
        showZoomInfo: true, //显示级别提示信息
        // 启用显示定位
        enableGeolocation: true // 会多出一个点
    });
    var mapTypeControl = new BMap.MapTypeControl({//添加地图类型控件
        mapTypes: [
            BMAP_NORMAL_MAP, //此地图类型展示普通街道视图
            BMAP_PERSPECTIVE_MAP, //此地图类型展示透视图像视图
            BMAP_SATELLITE_MAP,	//此地图类型展示卫星视图
            BMAP_HYBRID_MAP //此地图类型展示卫星和路网的混合视图
        ]
    });
    map.addControl(navigationControl);
    map.addControl(mapTypeControl);

    // 创建自定义控件实例
    var myZoomCtrl = new ZoomControl();
    // 添加到地图当中
    map.addControl(myZoomCtrl);

    // 添加定位控件
    var geolocationControl = new BMap.GeolocationControl({
        // 靠左下角位置
        anchor: BMAP_ANCHOR_BOTTOM_LEFT,
        // 是否显示定位信息面板。默认显示定位信息面板
        showAddressBar: true,
        enableAutoLocation: true //添加控件时是否进行定位。默认添加控件时不进行定位
    });
    map.addControl(geolocationControl);
    geolocationControl.addEventListener("locationSuccess", function (e) {//定位
        // 定位成功事件
        var address = '';
        address += e.addressComponent.province;
        address += e.addressComponent.city;
        address += e.addressComponent.district;
        address += e.addressComponent.street;
        address += e.addressComponent.streetNumber;
        alert("当前定位地址为：" + address);
    });
    geolocationControl.addEventListener("locationError", function (e) {
        // 定位失败事件
        alert("当前信号较弱,请前往开阔地带重新进行定位");
    });
    addClickFun(map) //添加右键菜单
}

//为搜索展示的地图添加右键菜单功能
function addClickFun(map) {
    map.addEventListener("rightclick", function (e) {//设置鼠标右键点击事件
        flag = true
        console.log(e.point.lng + "," + e.point.lat);
        var lng = e.point.lng;
        var lat = e.point.lat;
        var menu = new BMap.ContextMenu(); //右键菜单
        var txtMenuItem = [//右键菜单项目
            {
                text: '添加景点单元',
                callback: function () { //返回函数中进行相应逻辑操作
                    console.log('添加景点单元');
                    map.clearOverlays() //清空覆盖物
                    $(".BMap_contextMenu").remove() //删除菜单项
                    var title = "新增景点";

                    addNewSceneryInfos(map, lng, lat, title) //新增景点单元窗口
                }
            },
            {
                text: '开始景区路线采集',
                callback: function () {
                    if ("routing" == flag) {
                        map.clearOverlays()
                        pointList.length = 0
                        pointS.length = 0
                    }
                    pointList.length = 0 //重置采集线路的点数组
                    flag = "start"
                    $(".BMap_contextMenu").remove() //删除菜单项
                    map.clearOverlays() //清空覆盖物
                    different_text = "line_collect" //线路采集
                    startToDraw(map, pointList, different_text)
                    console.log("开始景区路线采集")
                }
            }/*,
            {
                text: '暂停路线采集',
                callback: function () {
                    $(".BMap_contextMenu").remove() //删除菜单项
                    map.removeEventListener("click"); //移除点击事件
                }
            }*/,
            {
                text: '景区路线采集完毕',
                callback: function () {
                    console.log('景区路线采集完毕');
                    $(".BMap_contextMenu").remove() //删除菜单项
                    var end_pointbl = false //判断最后的坐标点是否是出入口坐标
                    if (pointList.length > 1) {
                        for (let i = 0; i < enterAndExitArr.length; i++) {
                            let end_point = pointList[pointList.length - 1] //采集线路的最后一个点坐标
                            if (end_point.equals(enterAndExitArr[i])) {
                                end_pointbl = true
                            }
                        }
                        if (!end_pointbl) {
                            alert("终点必须是出入口坐标!")
                        } else {
                            endDraw(map, pointList) //画线保存坐标
                            // pointList = new Array()
                            // pointListY = new Array()
                            // different_text = "line_collect"
                            // listenMouseClick(map, pointList, pointListY, different_text)  //监听鼠标事件（设置点击获取坐标及水纹展示）
                        }
                    }
                }
            },
            {
                text: '取消该条路线',
                callback: function () {
                    // removeClick(map)
                    console.log('取消该条路线');
                    $(".BMap_contextMenu").remove() //删除菜单项
                    cancelDraw(map, pointList)
                    // pointListTemp = pointList.concat() //方式一实现数组的深拷贝
                }
            },
            {
                text: '采集出入口',
                callback: function () {
                    console.log('采集出入口');
                    $(".BMap_contextMenu").remove() //删除菜单项
                    addClick() //添加采集出入口坐标事件

                }
            },
            {
                text: '结束出入口采集',
                callback: function () {
                    console.log('结束出入口采集');
                    $(".BMap_contextMenu").remove() //删除菜单项
                    removeClick() //移除事件
                }
            },
            {
                text: '线路规划',
                callback: function () {
                    console.log('线路规划');
                    if ("start" == flag) {
                        map.clearOverlays()
                        pointList.length = 0
                        pointS.length = 0
                    }
                    flag = "routing"
                    $(".BMap_contextMenu").remove() //删除菜单项
                    if (pointList.length > 0 && pointList.length < 2) {
                        title = "友情提示"
                        msg = "请先使用鼠标左键标出两点,再进行路线规划"
                        showWarning(title, msg)
                    }
                    different_text = "line_plan" //线路规划
                    startToDraw(map, pointList, different_text)
                    console.log("开始规划")
                }
            }];//右键菜单
        for (var i = 0; i < txtMenuItem.length; i++) {
            menu.addItem(new BMap.MenuItem(txtMenuItem[i].text, txtMenuItem[i].callback, {
                width: 130 //设置右键菜单宽度
            })); //菜单添加项目
        }
        map.addContextMenu(menu)
        // menu.enableMassClear();//允许覆盖物在map.clearOverlays方法中被清除
        // setInfoWindow(map, lng, lat);
    });
}

//根据搜索条件查询景点出入口信息
function querySceneryEntranceInfos(map, scenery_name) {
    if (scenery_name != "" && scenery_name != null) {
        $.ajax({
            url: "querySceneryEntranceInfos",
            type: "post",
            data: {
                "scenery_name": scenery_name
            },
            dataType: "json",
            success: function (data) {
                if (data.status == "success") {
                    data = $.parseJSON(JSON.stringify(data)).data
                    console.log(data)
                    if (data != "" && data != null) {
                        data = data[0]
                        var entrance = data.entrance
                        var exit = data.exit
                        var duplex = data.duplex
                        var locaArray = new Array()
                        locaArray.push(entrance)
                        locaArray.push(exit)
                        locaArray.push(duplex)
                        // map.addEventListener('tilesloaded', querySceneryTrackInfos) //当地图所有图块完成加载时触发此事件
                        parentid = data.parentid //景点id
                        showEntranceMarkImg(map, locaArray, parentid) //展示景点出入口标记及景点内所有单元标记
                        querySceneryTrackInfos(map, parentid, scenery_name) //查询景点内所有路线信息
                    } else {
                        enterAndExitArr = new Array() //初始化景点出入口数组
                        map.centerAndZoom(scenery_name, 17);//初始化地图，设置地图级别
                    }
                } else {
                    showSuccessOrErrorModal(data.msg, "error");
                }
            },
            error: function (e) {
                showSuccessOrErrorModal("网络异常！", "error");
            }
        });
    }
}

//搜索景区展示景区出入口标记
function showEntranceMarkImg(map, locaArray, parentid) {
    var convertor = new BMap.Convertor();
    var pointArr = new Array();
    for (var i = 0; i < locaArray.length; i++) {
        var location = locaArray[i]
        if (location != "" && location != null) {
            lng = location.substring(0, location.indexOf(","))
            lat = location.substring(location.indexOf(",") + 1, location.length)
            var point = new BMap.Point(lng, lat);
            pointArr.push(point);
        } else {
            continue
        }
    }
    /*原始坐标转换为百度坐标 Start*/
    convertor.translate(pointArr, 1, 5, function (data) { //转换出入口坐标，并标记出来
        if (data.status === 0) {
            point = data.points[0] //转换成百度坐标的出入口坐标
            console.log(point)
            // 创建点坐标
            if (i == locaArray.length) {
                map.centerAndZoom(point, 17);//map.getZoom()返回当前地图的缩放级别
            }
            var myIcon = new BMap.Icon("https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1546917665768&di=843f4c70495ad74df101a7c0f7a25034&imgtype=0&src=http%3A%2F%2Fhbimg.b0.upaiyun.com%2F0344e8a7305525093bf7a472dd9dd95079e3fa8910538-NzRbh3_fw658"
                , new BMap.Size(90, 50) //设置可视面积//150 80
                , {
                    imageOffset: new BMap.Size(0, 0), //图片相对于可视区域的偏移值
                    imageSize: new BMap.Size(90, 50) //图标所用的图片的大小
                }); //创建自定义标注物
            // 初始化地图， 设置中心点坐标和地图级别
            var marker1 = new BMap.Marker(point, {icon: myIcon, title: "出入口"});
            marker1.disableMassClear();//禁止覆盖物在map.clearOverlays方法中被清除

            var lng = point.lng.toFixed(6) //出入口经度
            var lat = point.lat.toFixed(6) //出入口纬度
            let temp_point = {} //定义一个json
            temp_point.lng = lng //保留6位小数后得经度
            temp_point.lat = lat //保留6位小数后的经度
            enterAndExitArr.push(temp_point) //将转换后的出入口坐标放入出入口坐标集合中，供采点起点和终点校验时使用


            var center_point = map.getBounds().getCenter() //获取中心点坐标
            var lng1 = center_point.lng //中心点经度
            var lat1 = center_point.lat //中心点纬度
            var distance = (map.getDistance(new BMap.Point(lng, lat), new BMap.Point(lng1, lat1))).toFixed(2) //中心点与出入口的距离（算出圆半径）

            /*水波特效 Start*/
            //参数：每一层播放的间隔时间、每一层扩散至最大所花费的总时间。
            //半径、层数、中心点、{填充颜色、初始透明度}
            /*  var circles = new CircleShow(1000, 4, new BMap.Point(lng1, lat1), {fillColor:'blue',fillOpacity:0.2});
              //参数：每一层播放的间隔时间、每一层扩散至最大所花费的总时间。
              circles.start(1500,5000);*/
            /*水波特效 End*/

            /*监听鼠标事件 Start*/
            // listenMouseClick(map) //设置水纹特效
            /*监听鼠标事件 End*/

            //增加圆(电子屏障)
            var circle = new BMap.Circle(new BMap.Point(lng1, lat1), 1000, { //创建圆(1000代表圆的半径为1公里)
                strokeColor: "red", //边线颜色
                fillColor: "", //圆形填充颜色。当参数为空时，圆形将没有填充效果
                strokeWeight: 1, //边线宽度
                strokeOpacity: 0.4,  //边线透明度，取值范围0 - 1。
                // fillOpacity: 0.1,  //填充的透明度，取值范围0 - 1。
            });
            circle.disableMassClear(); //设置电子屏障不被清除

            // marker1.customData = {myProperty: comCode}; //为覆盖物添加自定义属性
            map.addOverlay(marker1);
            map.addOverlay(circle);  //增加圆
            addClickFun(map) //添加右键菜单
            // circle.addEventListener("click",overlay_style); //添加鼠标左键点击事件
            // addClickFun(circle) //为电子围栏区域添加右键菜单功能
            //为电子围栏区域添加右键菜单功能
            circle.addEventListener("rightclick", function (e) {//设置鼠标右键点击事件
                flag = true
                console.log(e.point.lng + "," + e.point.lat);
                var lng = e.point.lng;
                var lat = e.point.lat;
                var menu = new BMap.ContextMenu(); //右键菜单
                var txtMenuItem = [//右键菜单项目
                    {
                        text: '添加景点单元',
                        callback: function () { //返回函数中进行相应逻辑操作
                            console.log('添加景点单元');
                            map.clearOverlays() //清空覆盖物
                            $(".BMap_contextMenu").remove() //删除菜单项
                            var title = "新增景点";

                            addNewSceneryInfos(map, lng, lat, title) //新增景点单元窗口
                        }
                    },
                    {
                        text: '开始景区路线采集',
                        callback: function () {
                            if ("routing" == flag) {
                                map.clearOverlays()
                                pointList.length = 0
                                pointS.length = 0
                            }
                            flag = "start"
                            $(".BMap_contextMenu").remove() //删除菜单项
                            different_text = "line_collect" //线路采集
                            startToDraw(map, pointList, different_text)
                            console.log("开始景区路线采集")
                        }
                    }/*,
                    {
                        text: '暂停路线采集',
                        callback: function () {
                            $(".BMap_contextMenu").remove() //删除菜单项
                            map.removeEventListener("click"); //移除点击事件
                        }
                    }*/,
                    {
                        text: '景区路线采集完毕',
                        callback: function () {
                            console.log('景区路线采集完毕');
                            $(".BMap_contextMenu").remove() //删除菜单项
                            var end_pointbl = false //判断最后的坐标点是否是出入口坐标
                            if (pointList.length > 1) {
                                for (let i = 0; i < enterAndExitArr.length; i++) {
                                    let end_point = pointList[pointList.length - 1] //采集线路的最后一个点坐标
                                    if (end_point.equals(enterAndExitArr[i])) {
                                        end_pointbl = true
                                    }
                                }
                                if (!end_pointbl) {
                                    alert("终点必须是出入口坐标!")
                                } else {
                                    endDraw(map, pointList)
                                    // pointList = new Array()
                                    // pointListY = new Array()
                                    // different_text = "line_collect"
                                    // listenMouseClick(map, pointList, pointListY, different_text)  //监听鼠标事件（设置点击获取坐标及水纹展示）
                                }
                            }
                        }
                    },
                    {
                        text: '取消该条路线',
                        callback: function () {
                            // removeClick(map)
                            console.log('取消该条路线');
                            $(".BMap_contextMenu").remove() //删除菜单项
                            cancelDraw(map, pointList)
                            // pointListTemp = pointList.concat() //方式一实现数组的深拷贝
                        }
                    },
                    {
                        text: '采集出入口',
                        callback: function () {
                            console.log('采集出入口');
                            $(".BMap_contextMenu").remove() //删除菜单项
                            addClick() //添加采集出入口坐标事件

                        }
                    },
                    {
                        text: '结束出入口采集',
                        callback: function () {
                            console.log('结束出入口采集');
                            $(".BMap_contextMenu").remove() //删除菜单项
                            removeClick() //移除事件
                        }
                    },
                    {
                        text: '线路规划',
                        callback: function () {
                            console.log('线路规划');
                            if ("start" == flag) {
                                map.clearOverlays()
                                pointList.length = 0
                                pointS.length = 0
                            }
                            flag = "routing"
                            $(".BMap_contextMenu").remove() //删除菜单项
                            if (pointList.length > 0 && pointList.length < 2) {
                                title = "友情提示"
                                msg = "请先使用鼠标左键标出两点,再进行路线规划"
                                showWarning(title, msg)
                            }
                            different_text = "line_plan"
                            startToDraw(map, pointList, different_text)
                            console.log("开始规划")
                        }
                    }];//右键菜单
                for (var i = 0; i < txtMenuItem.length; i++) {
                    menu.addItem(new BMap.MenuItem(txtMenuItem[i].text, txtMenuItem[i].callback, {
                        width: 130 //设置右键菜单宽度
                    })); //菜单添加项目
                }
                circle.addContextMenu(menu)
                // menu.enableMassClear();//允许覆盖物在map.clearOverlays方法中被清除
                // setInfoWindow(map, lng, lat);
            });

            //获取marker的属性
            function overlay_style(e) {
                var p = e.target;
                if (p instanceof BMap.Circle) {
                    alert("该覆盖物是圆，圆的半径是：" + p.getRadius() + "，圆的中心点坐标是：" + p.getCenter().lng + "," + p.getCenter().lat);
                } else {
                    alert("无法获知该覆盖物类型");
                }
            }
        }
    })


    /*原始坐标转换为百度坐标 End*/

    // map.addEventListener('tilesloaded', function () { //当地图所有图块完成加载时触发此事件
    $.ajax({
        url: "queryNewSceneryPartInfo", //查询景点内所有新增单元坐标信息(展示标记)
        type: "post",
        data: {"parentid": parentid},
        datatype: "json",
        success: function (data) {
            if (data.status == "success") {
                var indexs = 0
                data = $.parseJSON(JSON.stringify(data)).data
                var centerArr = new Array() //中心点坐标数组
                var codeArr = new Array() //商品编码数组
                var nameArr = new Array() //商品名称数组
                var pointArr1 = new Array()
                for (var i = 0; i < data.length; i++) {
                    var com_central = data[i].com_central //中心点坐标
                    var com_code = data[i].com_code //编码
                    var com_name = data[i].com_name //名称
                    centerArr.push(com_central)
                    codeArr.push(com_code)
                    nameArr.push(com_name)
                }
                console.log(codeArr)
                console.log(nameArr)
                for (var i = 0; i < centerArr.length; i++) {
                    var location = centerArr[i]
                    if (location != "" && location != null) {
                        lng = location.substring(0, location.indexOf(","))
                        lat = location.substring(location.indexOf(",") + 1, location.length)
                        var point2 = new BMap.Point(lng, lat);
                        pointArr1.push(point2);
                    } else {
                        continue
                    }
                }
                /*原始坐标转换为百度坐标 Start*/
                var math = parseInt(pointArr1.length / 10)
                var partPointLists = new Array()
                var markArr = new Array()
                if (pointArr1.length % 10 != 0) {
                    math = math + 1
                }
                for (var m = 0; m < math; m++) {
                    if (m < parseInt(pointArr1.length / 10)) {
                        partPointLists = pointArr1.slice(m * 10, m * 10 + 10)
                    } else {
                        partPointLists = pointArr1.slice(m * 10, pointArr1.length)
                    }
                    convertor.translate(partPointLists, 1, 5, function (data) {
                        console.log(partPointLists)
                        if (data.status === 0) {
                            var point = data.points //转换为百度坐标后的景点单元出入口坐标
                            for (var k = 0; k < point.length; k++) {  //遍历景区内单元的坐标数据
                                console.log(point)
                                var point2 = point[k] //景区内单个单元的坐标
                                let lng = point2.lng.toFixed(6) //单元经度保留六位小数
                                let lat = point2.lat.toFixed(6) //单元纬度保留六位小数
                                let temp_point = {} //定义一个json
                                temp_point.lng = lng //保留6位小数后得经度
                                temp_point.lat = lat //保留6位小数后的经度
                                enterAndExitArr.push(temp_point) //将转换后的出入口坐标放入出入口坐标集合中，供采点起点和终点校验时使用
                                var myIcon = new BMap.Icon("http://lbsyun.baidu.com/jsdemo/img/Mario.png"
                                    , new BMap.Size(40, 35) //设置可视面积//40 35
                                    , {
                                        imageOffset: new BMap.Size(0, 0), //图片相对于可视区域的偏移值
                                        imageSize: new BMap.Size(25, 30) //图标所用的图片的大小
                                    }); //创建自定义标注物
                                // 初始化地图， 设置中心点坐标和地图级别
                                var marker2 = new BMap.Marker(point2, {icon: myIcon, title: nameArr[indexs]});
                                marker2.disableMassClear();//禁止覆盖物在map.clearOverlays方法中被清除
                                marker2.customData = {myProperty: codeArr[indexs]}; //为覆盖物添加自定义属性
                                marker2.customData1 = {myPoint: (point2.lng + "," + point2.lat)}; //为覆盖物添加自定义属性
                                map.addOverlay(marker2);
                                console.log(marker2)
                                markArr.push(marker2)
                                indexs++
                            }
                            for (var n = 0; n < markArr.length; n++) {
                                /*为每个marker添加菜单 Start*/
                                var marker = markArr[n]
                                //为marker添加右键菜单
                                var menu = new BMap.ContextMenu(); //右键菜单
                                var txtMenuItem = [//右键菜单项目
                                    {
                                        text: '修改景点',
                                        callback: function () { //返回函数中进行相应逻辑操作
                                            console.log('修改景点');
                                            $(".BMap_contextMenu").remove() //删除菜单项
                                            // map.clearOverlays() //清空覆盖物
                                            var title = "修改景点";
                                            updateSceneryInfo(map, lng, lat, title, marker);
                                        }
                                    },
                                    {
                                        text: '删除景点',
                                        callback: function () {
                                            console.log('删除景点');
                                            $(".BMap_contextMenu").remove() //删除菜单项
                                            // map.clearOverlays() //清空覆盖物
                                            deleteSceneryInfo(map, marker);
                                        }
                                    }];//右键菜单
                                for (var i = 0; i < txtMenuItem.length; i++) {
                                    menu.addItem(new BMap.MenuItem(txtMenuItem[i].text, txtMenuItem[i].callback
                                        , {
                                            id: codeArr[n], //菜单项dom的id
                                            width: 80 //设置右键菜单宽度
                                        })); //菜单添加项目
                                }
                                marker.addContextMenu(menu)   //为marker添加右键菜单
                                /*为每个marker添加菜单 End*/

                                /*右键点击marker时，调用相应的菜单 Start*/
                                marker.addEventListener("rightclick", function (e) {
                                    console.log(e)
                                    console.log(e.target)
                                    var p = e.point;  //获取marker的位置(百度坐标)
                                    var lng = p.lng;
                                    var lat = p.lat;
                                    marker = e.target //此处获取点击的对应的marker
                                    //为marker添加右键菜单
                                    var menu = new BMap.ContextMenu(); //右键菜单
                                    var txtMenuItem = [//右键菜单项目
                                        {
                                            text: '修改景点',
                                            callback: function () { //返回函数中进行相应逻辑操作
                                                console.log('修改景点');
                                                $(".BMap_contextMenu").remove() //删除菜单项
                                                // map.clearOverlays() //清空覆盖物
                                                var title = "修改景点";
                                                updateSceneryInfo(map, lng, lat, title, marker);
                                            }
                                        },
                                        {
                                            text: '删除景点',
                                            callback: function () {
                                                console.log('删除景点');
                                                $(".BMap_contextMenu").remove() //删除菜单项
                                                // map.clearOverlays() //清空覆盖物
                                                deleteSceneryInfo(map, marker);
                                            }
                                        }];//右键菜单
                                    for (var i = 0; i < txtMenuItem.length; i++) {
                                        menu.addItem(new BMap.MenuItem(txtMenuItem[i].text, txtMenuItem[i].callback
                                            , {
                                                id: codeArr[n], //菜单项dom的id
                                                width: 80
                                            })); //菜单添加项目
                                    }
                                    marker.addContextMenu(menu)
                                    console.log("添加菜单")
                                });//为添加的标记添加点击事件
                                /*右键点击marker时，调用相应的菜单 End*/
                            }
                        }
                    })
                }
                /*原始坐标转换为百度坐标 End*/
                console.log(data)
            } else {
                showSuccessOrErrorModal(data.msg, "error");
            }
        },
        error: function (e) {
            showSuccessOrErrorModal(data.msg, "网络异常");
        }
    })
    // }) //当地图所有图块完成加载时触发此事件
}

//查询景区道路轨迹信息
function querySceneryTrackInfos(map, parentid, scenery_name) {
    if (parentid != 0) {
        $.ajax({
            url: "querySceneryTrackInfos",
            type: "post",
            data: {"parentid": parentid},
            datatype: "json",
            success: function (data) {
                if (data.status == "success") {
                    data = $.parseJSON(JSON.stringify(data)).data
                    var convertor = new BMap.Convertor();
                    for (var i = 0; i < data.length; i++) {
                        var locas = ""
                        if (data[i].com_track != "" && data[i].com_track != undefined) {
                            locas = data[i].com_track.split(" ")
                        }
                        if (locas != "" && locas != null) {
                            var pointList = new Array()
                            var pointArr = new Array();
                            for (var j = 0; j < locas.length; j++) {
                                var location = locas[j]
                                if (location != "" && location != null) {
                                    var lng = location.substring(0, location.indexOf(","))
                                    var lat = location.substring(location.indexOf(",") + 1, location.length)
                                    var point = new BMap.Point(lng, lat)
                                    pointArr.push(point);
                                }
                            }
                            console.log(pointArr)
                            /*原始坐标转换为百度坐标 Start*/
                            if (pointArr.length <= 10) {
                                convertor.translate(pointArr, 1, 5, function (res) {
                                    if (res.status === 0) {
                                        var points = res.points
                                        var polyline = new BMap.Polyline(
                                            points       //标注点坐标集合
                                            , {
                                                strokeColor: "#22F719",
                                                strokeOpacity: 1,
                                                strokeWeight: '6',//折线的宽度，以像素为单位
                                                strokeStyle: "solid", //设置是为实线或虚线，solid或dashed
                                                enableEditing: false  //是否启用线编辑，默认为false
                                            });//创建折线
                                        polyline.disableMassClear()//设置不允许覆盖物在map.clearOverlays方法中被清除
                                        map.addOverlay(polyline);//添加标注连线
                                    }
                                })
                            } else { //当一条线路中的点大于10时，需要进行点切分进行坐标系转换（convertor.translate()一次只能转换10个坐标点）
                                var math = parseInt(pointArr.length / 10)
                                /*if (pointArr.length % 10 != 0) {
                                    math = math + 1
                                }*/
                                var pointLists = new Array()
                                var pointList1 = new Array()
                                console.log("线路信息:" + pointArr)
                                for (var m = 0; m < math + 1; m++) { //循环切分为10个点进行坐标转换
                                    pointLists = pointArr.slice(m * 10, m * 10 + 10)
                                    pointList1 = pointArr.slice(m * 10 - 1, m * 10 + 9) //此处为了设置线路闭合使用
                                    convertor.translate(pointLists, 1, 5, function (res) {
                                        var points = res.points
                                        var polyline = new BMap.Polyline(
                                            points       //标注点坐标集合
                                            , {
                                                strokeColor: "#22F719",
                                                strokeOpacity: 1,
                                                strokeWeight: '6',//折线的宽度，以像素为单位
                                                strokeStyle: "solid", //设置是为实线或虚线，solid或dashed
                                                enableEditing: false  //是否启用线编辑，默认为false
                                            });//创建折线
                                        polyline.disableMassClear()//设置不允许覆盖物在map.clearOverlays方法中被清除
                                        map.addOverlay(polyline);//添加标注连线
                                    })
                                    convertor.translate(pointList1, 1, 5, function (res) {
                                        var points = res.points
                                        var polyline = new BMap.Polyline(
                                            points       //标注点坐标集合
                                            , {
                                                strokeColor: "#22F719",
                                                strokeOpacity: 1,
                                                strokeWeight: '6',//折线的宽度，以像素为单位
                                                strokeStyle: "solid", //设置是为实线或虚线，solid或dashed
                                                enableEditing: false  //是否启用线编辑，默认为false
                                            });//创建折线
                                        polyline.disableMassClear()//设置不允许覆盖物在map.clearOverlays方法中被清除
                                        map.addOverlay(polyline);//添加标注连线
                                    })
                                }
                            }
                            /*原始坐标转换为百度坐标 End*/
                        } else {
                            continue
                        }
                    }
                } else {
                    map.centerAndZoom(scenery_name, 17);//初始化地图，设置地图级别
                }
            },
            error: function (e) {
                showSuccessOrErrorModal("网络异常！", "error");
            }
        })
    }
}

/**
 * @Author Breach
 * @Description 添加新景点函数（弹出框）
 * @Date 2018/12/25
 * @Param null
 * @return
 */
function addNewSceneryInfos(map, lng, lat, title, data, marker) {
    console.log(marker)
    var fixedPoint = ""
    var updateLng = lng
    var updateLat = lat
    if ("新增景点" != title) {
        fixedPoint = marker.customData1.myPoint
        updateLng = fixedPoint.substring(0, fixedPoint.indexOf(",")) //修改菜单框中的经度
        updateLat = fixedPoint.substring(fixedPoint.indexOf(",") + 1, fixedPoint.length)//修改菜单框中的纬度
        updateLng = (updateLng * 1.0).toFixed(6)
        updateLat = (updateLat * 1.0).toFixed(6)
    }
    var com_name = "" //景点名称
    var state = "" //国家
    var city = "" //城市
    var com_address = "" //详细地址
    var com_begining = "" // 服务开始时间
    var com_moment = "" //服务结束时间
    var com_best = "" //最佳游玩时间
    var com_level = "" //伴行级别
    var com_introduce = "" //备注
    var com_code = "" //商品code
    var scenery_character = "" //资源特色
    var scenery_type = "" //类型
    if (data != undefined && data != null && data != "") {
        com_name = data.com_name
        state = data.state
        city = data.city
        com_address = data.com_address
        com_begining = data.com_begining
        com_moment = data.com_moment
        com_best = data.com_best
        com_level = data.com_level
        com_introduce = data.com_introduce
        com_code = data.com_code
        com_central = data.com_central
        lng = com_central.substring(0, com_central.indexOf(","))
        lat = com_central.substring(com_central.indexOf(",") + 1, com_central.length)
    }
    //右键菜单
    var content = '<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="addModalLabel" aria-hidden="true" >' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +
        // '<div class="modal-header">' +
        //     '<h4 class="modal-title" id="addModalLabel" style="border-bottom: 1px solid #878787;padding-bottom: 15px;">新增景点</h4>' +
        // '</div>' +
        '<div class="modal-body">' +
        '<form id="addSceneryModalForm" action="" class="form-horizontal">' +
        '<div class="row">' +
        '<div class="row" style="padding: 10px;margin-top:10px;border-top: 1px solid grey;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;margin-left: 30px;">' +
        '<label for="scenery_name" class="control-label"><span  style="color: red;"> * </span>名称：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<input id="scenery_name" name="scenery_name" type="text" style="margin-left: 10px;" value="' + com_name + '" placeholder="请输入景点名称"/>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;margin-left: 30px;">' +
        '<label for="continents" class="control-label"><span  style="color: red;"> * </span>地区：</label>' +
        '</div>' +
        '<div class="col-sm-3"  style="float: left;margin-left:10px;">' +
        '<select id="continents" name="continents" class="selectpicker" >' +
        '<option value="1">欧洲</option>' +
        '<option value="0" selected>亚洲</option>' +
        '<option value="2">非洲</option>' +
        '</select>' +
        '</div>' +
        '<div class="col-sm-3"  style="float: left;margin-left:10px;">' +
        '<select id="state" name="state" class="selectpicker" >' +
        '<option value="0" selected>中国</option>' +
        '</select>' +
        '</div>' +
        '<div class="col-sm-3">' +
        '<select id="city" name="city" style="margin-left:10px;" class="selectpicker" >' +
        '<option value="" selected>请选择城市</option>' +
        '<option value="0">广东</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="scenery_address" class="control-label"><span style="color: red;"> * </span>详细地址：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<input id="scenery_address" name="scenery_address" type="text" value="' + com_address + '" style="margin-left: 10px;" placeholder="请输入景区详细地址"/>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="scenery_type" class="control-label"><span  style="color: red;"> * </span>资源特色：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<select id="scenery_character" name="scenery_character" class="selectpicker"  style="margin-left: 10px;">' +
        '<option value="" selected> 请选择特色</option>' +
        '<option value="0">人文景观</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;margin-left: 35px;">' +
        '<label for="scenery_type" class="control-label"><span  style="color: red;"> * </span>类型：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<select id="scenery_type" name="scenery_type" class="selectpicker"  style="margin-left: 10px;">' +
        '<option value="" selected> 请选择类型</option>' +
        '<option value="0">山水风景</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="" class="control-label">地图经纬度：</label>' +
        '</div>' +
        '<input id="parentid" name="parentid" type="hidden" value="' + parentid + '"/>' +
        '<input id="scenery_location" name="scenery_location" type="hidden" value="' + lng + "," + lat + '"/>' +
        '<input id="com_code" name="com_code" type="hidden" value="' + com_code + '"/>' +
        '<div class="col-sm-9"><label id="location" style="margin-left: 10px;">' + ("新增景点" == title ? lng : updateLng) + "," + ("新增景点" == title ? lat : updateLat) + '</label></div>' +
        '</div>' +
        '</div>' +
        '<div id="addPoints" class="row" type="hidden" style="padding-top: 3px;max-height: 75px;overflow-y:auto;">' +
        '</div>' +
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="scenery_start_time scenery_end_time" class="control-label"><span  style="color: red;"> * </span>开放时段：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<input id="scenery_start_time" name="scenery_start_time" type="time" value="' + com_begining + '" style="width: 70px;margin-left: 10px;"/> ~ &nbsp;&nbsp;&nbsp; ' +
        '<input id="scenery_end_time" name="scenery_end_time" type="time" value="' + com_moment + '" style="width: 70px;" />' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="com_best" class="control-label"><span  style="color: red;"> * </span>游玩时间：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<input id="com_best" name="com_best" type="text" style="margin-left: 10px;" value="' + com_best + '" maxlength="8" placeholder="请输入游玩时间"/>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="" class="control-label"><span  style="color: red;"> * </span>伴行级别：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<select id="bx_level" name="bx_level" class="selectpicker" style="margin-left: 10px;">' +
        '<option value="6" selected>6</option>' +
        '<option value="5">5</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;margin-left: 45px;">' +
        '<label for="" class="control-label">备注：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<textarea id="scenery_remark" name="scenery_remark" rows="3" cols="20" style="margin-left: 10px;">' + com_introduce + '</textarea>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label class="control-label"></span>上传图片：</label>' +
        '</div>' +
        /*图片上传开始部分*/
        '<div id="uploader-image">' +
        '<div id="filePicker1">选择图片</div>' +
        '<div id="fileList1" class="uploader-list" style="padding: 5px;"></div>' +
        '</div>' +
        /*图片上传结束部分*/
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '<div class="scenery-box-bt">' +
        '<input type="button" class="btn btn-default" value="取消" onclick="closeSceneryInfoModel()"; style="margin-right: 40px;padding: 6px 12px;">' +
        '<input id="submitSceneryCollectInfo" type="submit" class="webuploader-container" marker="' + marker + '" clicked="0" value="保存" point="' + lng + "," + lat + '" onclick="submitSceneryInfo(this);">' +
        '</div>' +
        '<div style="clear: both;"></div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    var infoWindow = new BMap.InfoWindow(content, {
        offset: new BMap.Size(0, 0), //设置弹窗偏移量
        width: 430, //设置弹窗宽度
        height: 720, //取值范围：0, 220 - 730。如果您指定宽度为0，则信息窗口的宽度将按照其内容自动调整
        enableAutoPan: false, //是否开启信息窗口打开时地图自动移动（默认开启）
        enableCloseOnClick: false //是否开启点击地图关闭信息窗口（默认开启）
        // title: "新增景点"
    }); //创建信息窗口对象
    infoWindow.setTitle(title)
    var point = new BMap.Point("新增景点" == title ? lng : updateLng, "新增景点" == title ? lat : updateLat);
    map.openInfoWindow(infoWindow, point);
    // console.log(infoWindow.getTitle())  //返回弹出窗标题
    // console.log(infoWindow.isOpen())

    setTimeout(function () { //监听右键菜单框打开事件
        if (infoWindow.isOpen()) {   //添加景点窗口打开后，添加照片事件
            // infoWindow.setContent(content)
            $("#city").val(city); //初始化城市下拉选
            $("#scenery_character").val(0); //初始化城市下拉选
            $("#scenery_character").val(0); //初始化资源特色下拉选
            $("#scenery_type").val(0); //初始化类型下拉选
            listenTitleShow();

            /*转换坐标点 Start*/
            var everPoint = $("#location").text()
            console.log("采集点的坐标：" + everPoint)
            var x1 = everPoint.substring(0, everPoint.indexOf(","))
            var y1 = everPoint.substring(everPoint.indexOf(",") + 1, everPoint.length)
            var tempPoint = {}
            var pointArr = new Array()
            tempPoint.lng = x1
            tempPoint.lat = y1
            pointArr.push(tempPoint);
            var convertor = new BMap.Convertor();
            if (title == "新增景点") {
                convertor.translate(pointArr, 1, 5, function (data) { //此处录入景点单元信息时，把百度坐标系转换为原始坐标系
                    if (data.status === 0) {
                        point = data.points[0]
                        var x2 = point.lng
                        var y2 = point.lat
                        var x = 2 * x1 - x2
                        var y = 2 * y1 - y2
                        x = x.toFixed(10)
                        y = y.toFixed(10)
                        $("#scenery_location").val(x + "," + y)
                    }
                })
            }
            /*转换坐标点 End*/
        }
    }, 50);
}

/*添加、移除事件 Start*/
//采集出入口事件
var flag = true;

function showInfo(e) {
    console.log(e.point.lng + ", " + e.point.lat);
    var lng = e.point.lng
    var lat = e.point.lat
    $("#addPoints").removeAttr("type"); //展示出入口坐标div
    var content =
        '<div class="row" style="padding: 7px;">' +
        '<div class="form-group">' +
        '<div class="col-sm-3" style="float: left;margin-left: -4px;">' +
        '<label for="com_duplex" class="control-label">出入口坐标：</label>' +
        '</div>' +
        '<div class="col-sm-9"><input id="com_duplex" name="com_duplex" value="' + lng + "," + lat + '" style="margin-left: 10px;">'
    '</div>'
    if (flag) { //添加开关防止鼠标多次事件
        $("#addPoints").append(content)
        flag = false
        setTimeout(function () {
            flag = true
        }, 50)
    }
}

//添加鼠标点击事件
function addClick() {
    map.addEventListener("click", showInfo);
}

//移除鼠标点击事件
function removeClick() {
    map.removeEventListener("click", showInfo);
}

/*添加、移除事件 End*/

//监听新增景点弹窗，展示后为照片按钮添加功能
function listenTitleShow() {
    //上传图片
    var $ = jQuery,
        $list = $('#fileList1'),
        ratio = window.devicePixelRatio || 1,
        // 设置预览图的宽高
        thumbnailWidth = 90 * ratio,
        thumbnailHeight = 90 * ratio,
        // Web Uploader实例
        uploader;
    // 创建Web Uploader实例
    uploader = WebUploader.create({
        auto: true, // 选完文件后，是否自动上传。
        // swf文件路径
        swf: '@{/js/swf/Uploader.swf}',  //swf路径采用thymeleaf模板引擎的路径方式 (@{})
        // 文件接收服务端。（请求地址）
        server: 'uploadImages',
        // 选择文件的按钮。可选。
        // 内部根据当前运行是创建，可能是input元素，也可能是flash.
        pick: {
            id: '#filePicker1',
            multiple: true //上传多张照片
        },
        thumb: {
            width: 140,
            height: 100,
            quality: 100, // 图片质量，只有type为`image/jpeg`的时候才有效。
            allowMagnify: false,// 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
            crop: true,// 是否允许裁剪。
            type: "image/jpeg"
        },
        // 只允许选择图片文件。
        accept: {
            title: 'Images',
            extensions: 'jpg,jpeg,bmp,png',
            mimeTypes: 'image/*'
        }
    });

    // 当有文件添加进来的时候
    uploader.on('fileQueued', function (file) {
        var $li = $(
            '<div id="' + file.id + '" class="file-item thumbnail" style="float:left;padding-left:10px;">' +
            '<img>' +
            '<div class="info">' + file.name + '</div>' +
            '</div>'
            ),
            $img = $li.find('img');
        // $list为容器jQuery实例
        // $list.html("")  //限制只上传一张图片时加上这个
        $list.append($li);
        // 创建缩略图
        // 如果为非图片文件，可以不用调用此方法。
        // thumbnailWidth x thumbnailHeight 为 100 x 100
        uploader.makeThumb(file, function (error, src) {
            if (error) {
                $img.replaceWith('<span>不能预览</span>');
                return;
            }
            $img.attr('src', src);
        }, thumbnailWidth, thumbnailHeight);
    });
    // 文件上传过程中创建进度条实时显示。
    uploader.on('uploadProgress', function (file, percentage) {
        var $li = $('#' + file.id),
            $percent = $li.find('.progress span');
        // 避免重复创建
        if (!$percent.length) {
            $percent = $('<p class="progress"><span></span></p>')
                .appendTo($li)
                .find('span');
        }
        $percent.css('width', percentage * 100 + '%');
    });

    // 文件上传成功，给item添加成功class, 用样式标记上传成功。
    uploader.on('uploadSuccess', function (file) {
        $('#' + file.id).addClass('upload-state-done');
    });

    // 文件上传失败，显示上传出错。
    uploader.on('uploadError', function (file) {
        var $li = $('#' + file.id),
            $error = $li.find('div.error');
        // 避免重复创建
        if (!$error.length) {
            $error = $('<div class="error"></div>').appendTo($li);
        }
        $error.text('上传失败');
    });
    // 完成上传完了，成功或者失败，先删除进度条。
    uploader.on('uploadComplete', function (file) {
        $('#' + file.id).find('.progress').remove();
    });
}

//取消
function closeSceneryInfoModel() {
    map.clearOverlays() //清除所有覆盖物
}

//提交
function submitSceneryInfo(e) {//lng, lat为当前点击的点的经纬度坐标
    var objReg = /^[0-9]+$/;  //正则判断最佳游玩时间是否为正整数
    title = "必填项提示"
    //表单验证
    if ($("#scenery_name").val() == "") {//景点名称
        msg = "请输入景点名称"
        showWarning(title, msg)
    } else if ($("#continents").val() == "") {//地区
        msg = "请选择地区"
        showWarning(title, msg)
    } else if ($("#nation").val() == "") {//国家
        msg = "请选择国家"
        showWarning(title, msg)
    } else if ($("#city").val() == "") {//城市
        msg = "请选择城市"
        showWarning(title, msg)
    } else if ($("#scenery_address").val() == "") {//详细地址
        msg = "请输入详细地址"
        showWarning(title, msg)
    } else if ($("#scenery_character").val() == "") {//景点特色
        msg = "请选择景点特色"
        showWarning(title, msg)
    } else if ($("#scenery_type").val() == "") {//类型
        msg = "请选择类型"
        showWarning(title, msg)
    } else if ($("#scenery_start_time").val() == "") {//开放时间
        msg = "请输入开放时间"
        showWarning(title, msg)
    } else if ($("#scenery_end_time").val() == "") {//开放时间
        msg = "请输入开放时间"
        showWarning(title, msg)
    } else if ($("#com_best").val() == "") {//最佳游玩时间
        msg = "请输入游玩时间"
        showWarning(title, msg)
    } else if (!objReg.test($("#com_best").val())) {//最佳游玩时间
        msg = "请输入有效游玩时间"
        showWarning(title, msg)
    } else { //提交表单
        console.log("提交表单")
        saveNewSceneryInfo(e)// 调用新增函数
    }
}

/**
 * @Author Breach
 * @Description 新增采集的景区单元信息
 * @Date 2018/12/19
 */
function saveNewSceneryInfo(e) {
    $.ajax({
        url: "addNewSceneryInfo",
        type: "post",
        data: $("#addSceneryModalForm").serialize(),
        dataType: "json",
        success: function (data) {
            if (data.status == "success") {
                console.log(data)
                map.closeInfoWindow()
                showSuccessOrErrorModal(data.msg, "success");//保存成功后，需要添加一个标记点
                var comCode = data.comCode;//获取保存的景点的商品编码
                var lng = data.lng //转换后的坐标
                var lat = data.lat//转换后的坐标
                addMarkImg(map, lng, lat, comCode, e);//添加标记
            } else {
                showSuccessOrErrorModal(data.msg, "error");
            }
        },
        error: function (e) {
            showSuccessOrErrorModal("网络异常！", "error");
        }
    });
}

var flag = true

// 采集景点信息之后，添加标记
function addMarkImg(map, lng, lat, comCode, e) {
    if (flag) {
        console.log(e)
        console.log(e.attributes.point.value)
        var point = e.attributes.point.value //添加景点时，为转换前的坐标值
        var lng = point.substring(0, point.indexOf(","))
        var lat = point.substring(point.indexOf(",") + 1, point.length)
        var fixedPoint = point //添加景点时，为转换前的坐标值（弹出修改窗时使用）

        var point = new BMap.Point(lng, lat);
        // 创建点坐标
        map.centerAndZoom(point, map.getZoom());//map.getZoom()返回当前地图的缩放级别
        var myIcon = new BMap.Icon("http://lbsyun.baidu.com/jsdemo/img/Mario.png"
            , new BMap.Size(35, 45) //设置可视面积
            , {
                imageOffset: new BMap.Size(0, 0), //图片相对于可视区域的偏移值
                imageSize: new BMap.Size(25, 30) //图标所用的图片的大小
            }); //创建自定义标注物
        // 初始化地图， 设置中心点坐标和地图级别
        var marker1 = new BMap.Marker(point, {icon: myIcon, title: "查看详情"});
        marker1.disableMassClear();//禁止覆盖物在map.clearOverlays方法中被清除
        marker1.customData = {myProperty: comCode}; //为覆盖物添加自定义属性
        marker1.customData1 = {myPoint: fixedPoint}; //为覆盖物添加自定义属性
        console.log(marker1)
        if (e.attributes.marker.value == ""
            || e.attributes.marker.value == undefined
            || e.attributes.marker.value == "undefined") {
            map.addOverlay(marker1);
            flag = false
        }
        marker1.addEventListener("rightclick", function (e) {
            console.log(e)
            var p = e.point;  //获取marker的位置
            var lng = p.lng;
            var lat = p.lat;
            addMarkerContextMenu(map, marker1, lng, lat)
        });//为添加的标记添加点击事件

        //为marker添加右键菜单
        function addMarkerContextMenu(map, marker, lng, lat) {
            console.log(marker)
            console.log("为marker添加右键菜单")
            var menu = new BMap.ContextMenu(); //右键菜单
            var txtMenuItem = [//右键菜单项目
                {
                    text: '修改景点',
                    callback: function () { //返回函数中进行相应逻辑操作
                        console.log('修改景点');
                        $(".BMap_contextMenu").remove() //删除菜单项
                        // map.clearOverlays() //清空覆盖物
                        var title = "修改景点";
                        updateSceneryInfo(map, lng, lat, title, marker);
                    }
                },
                {
                    text: '删除景点',
                    callback: function () {
                        console.log('删除景点');
                        $(".BMap_contextMenu").remove() //删除菜单项
                        // map.clearOverlays() //清空覆盖物
                        deleteSceneryInfo(map, marker);
                    }
                }];//右键菜单
            for (var i = 0; i < txtMenuItem.length; i++) {
                menu.addItem(new BMap.MenuItem(txtMenuItem[i].text, txtMenuItem[i].callback
                    , {
                        id: comCode, //菜单项dom的id
                        width: 80
                    })); //菜单添加项目
            }
            marker.addContextMenu(menu)
        }
    }

    // }
    // })
}

//修改景点信息
function updateSceneryInfo(map, lng, lat, title, marker) {
    console.log(marker)
    var comCode = marker.customData.myProperty
    $.ajax({
        url: "querySceneryInfoByCode",
        type: "post",
        data: {"comCode": comCode},
        dataType: "json",
        success: function (data) {
            if (data.status == "success") {
                data = data.sceneryInfoList[0];
                console.log(data)
                addNewSceneryInfos(map, lng, lat, title, data, marker); //弹出修改菜单框
            } else {
                showSuccessOrErrorModal(data.msg, "error");
            }
        },
        error: function (e) {
            showSuccessOrErrorModal("网络异常！", "error");
        }
    });
}

//删除景点
function deleteSceneryInfo(map, marker2) {
    console.log(marker2)
    console.log(marker2.customData.myProperty)
    var comCode = marker2.customData.myProperty
    $.confirm({
        title: '友情提示',
        content: '是否确认删除该景点信息？',
        useBootstrap: true,
        theme: 'supervan',
        confirmButton: '确认',
        cancelButton: '取消',
        animation: 'zoom', // 弹出的效果
        closeAnimation: 'scale', //关闭的效果
        confirm: function () {
            $.ajax({
                url: "deleteNewSceneryInfo",
                type: "post",
                data: {"comCode": comCode},
                dataType: "json",
                success: function (data) {
                    if (data.status == "success") {
                        console.log(data)
                        showSuccessOrErrorModal(data.msg, "success");
                        marker2.enableMassClear(); //设置允许覆盖物在map.clearOverlays方法中被清除
                        map.redraw()
                        marker2.redraw()
                        map.clearOverlays(); //删除当前覆盖物
                    } else {
                        showSuccessOrErrorModal(data.msg, "error");
                    }
                },
                error: function (e) {
                    showSuccessOrErrorModal("网络异常！", "error");
                }
            });
        },
        cancel: function () {
            return
        }
    });
}

//开始绘制
// var addClickFun;
var pointS = new Array();
var sy; //添加矢量图标
var icons;
var polyline;

function startToDraw(map, pointList, different_text) {//map当前的图层
    var pointListY = new Array()
    // pointList.length = 0 //清空点数组
    if(enterAndExitArr.length != 0) {
        listenMouseClick(map, pointList, pointListY, different_text) //设置采点水纹特效（探测出入口）
    }
    addLineClick = function (e) {//设置鼠标左键点击事件
        var lng = e.point.lng;
        var lat = e.point.lat;
        var loca = lng + "," + lat
        console.log(lng + "," + lat)

        if ($.inArray(loca, pointS) == -1) {//过滤鼠标多次点击时重复数据
            if (pointList.length == 0 && enterAndExitArr.length != 0) { //此处如果存在出入口，则起点必须是出入口
                alert("通过长按鼠标左键进行线路起点的探测选择")
            } else {
                var marker = new BMap.Marker(new BMap.Point(lng, lat));//设置标注点
                // marker.enableDragging();//设置标注可以拖拽
                marker.enableMassClear();//允许覆盖物在map.clearOverlays方法中被清除
                map.addOverlay(marker);//添加标注点
                marker.setAnimation(BMAP_ANIMATION_DROP)  //设置标注点动态效果
                marker.addEventListener("dragend", function (e) {//监听标注拖拽事件
                    console.log("当前位置：" + e.point.lng + "," + e.point.lat);//输出拖拽后的标注坐标点
                })

                pointS.push(loca)
                /*采线标点 Start*/
                pointList.push(new BMap.Point(lng, lat));//连线标注点
                console.log("**********")
                console.log(pointList) //线路绘制的点坐标集合
                console.log("**********")
                if ("routing" == flag) { //如果是规划路线，则只标出两个点
                    if (pointList.length == 3) {
                        map.clearOverlays()
                        pointList.splice(1, 1)  //丛数组第一个下表开始删除，删除一个元素
                        for (var i = 0; i < pointList.length; i++) {
                            lng = pointList[i].lng
                            lat = pointList[i].lat
                            var marker = new BMap.Marker(new BMap.Point(lng, lat));//设置标注点
                            // marker.enableDragging();//设置标注可以拖拽
                            marker.enableMassClear();//允许覆盖物在map.clearOverlays方法中被清除
                            map.addOverlay(marker);//添加标注点
                            if (i == 1) {
                                marker.setAnimation(BMAP_ANIMATION_DROP) //设置特效
                            }
                        }
                    }
                    if (pointList.length == 2) {
                        typing = new BMap.WalkingRoute(map, {//步行
                            renderOptions: {
                                map: map,
                                autoViewport: true
                            }
                        });
                        for (var i = 0; i < pointList.length; i++) {
                            var lng = pointList[i].lng
                            var lat = pointList[i].lat
                            if (i == 0) {
                                start = new BMap.Point(lng, lat);
                            } else {
                                end = new BMap.Point(lng, lat);
                            }
                        }
                        typing.search(start, end);
                    }
                }
                if ("start" == flag) {
                    polyline = new BMap.Polyline(
                        pointList       //标注点坐标集合
                        , {
                            strokeColor: "red",
                            enableClicking: true,//是否响应点击事件，默认为true
                            strokeOpacity: 0.8,
                            strokeWeight: '6',//折线的宽度，以像素为单位
                            strokeStyle: "dashed",
                            enableEditing: false  //是否启用线编辑，默认为false
                        });//创建折线
                } else {
                    polyline = new BMap.Polyline(
                        pointList       //标注点坐标集合
                        , {
                            strokeColor: "red",
                            enableClicking: true,//是否响应点击事件，默认为true
                            strokeOpacity: 0.8,
                            // icons:[icons], //创建标注覆盖物所使用的图标
                            strokeWeight: '2',//折线的宽度，以像素为单位
                            strokeStyle: "dashed",
                            enableEditing: false  //是否启用线编辑，默认为false
                        });//创建折线
                }
                polyline.enableMassClear()//设置允许覆盖物在map.clearOverlays方法中被清除
                map.addOverlay(polyline);//添加标注连线
                listenKey(map, pointList, pointListY);//监听键盘
                /*采线标点 End*/

                /*线路标记的起点(判断选择的起点是否在出入口上) Start*/
                // listenMouseClick(map, pointList, pointListY, different_text) //设置水纹特效
                /*线路标记的起点(判断选择的起点是否在出入口上) End*/
            }

            // marker.addEventListener("dragstart", function (e) {//监听开始拖拽标注时事件
            //     var pointListG = new Array();//拖拽的标注点的数组
            //     var lng = e.point.lng
            //     var lat = e.point.lat
            //     // console.log("拖拽点开始时位置坐标：" + lng + "," + lat);//输出拖拽时的标注坐标点
            //     pointListG.push(new BMap.Point(lng, lat))
            //     marker.addEventListener("dragend", function (e) {//监听拖拽标注时事件
            //         var lng = e.point.lng
            //         var lat = e.point.lat
            //         // console.log("拖拽点结束时位置坐标：" + lng + "," + lat);//输出拖拽时的标注坐标点
            //         var marker = new BMap.Marker(new BMap.Point(lng, lat));//设置标注点
            //         // map.addOverlay(marker);//添加标注点
            //         // marker.enableDragging();//设置标注可以拖拽
            //         pointListG.push(new BMap.Point(lng, lat))
            //         console.log(pointListG)
            //         var polyline = new BMap.Polyline( //创建折线(strokeStyle设置实线（solid）或虚线（dashed）)
            //             pointListG       //标注点坐标集合
            //             , {
            //                 strokeColor: "red",
            //                 strokeWeight: 2,
            //                 strokeOpacity: 0.8,
            //                 // icons:[icons], //创建标注覆盖物所使用的图标
            //                 strokeWeight: '2',//折线的宽度，以像素为单位
            //                 strokeStyle: "dashed",
            //                 enableEditing: false  //是否启用线编辑，默认为false
            //             });
            //         map.addOverlay(polyline)//添加连线
            //         console.log(polyline.getMap()) //获取覆盖物所在的Map
            //         console.log("执行完毕")
            //     });
            // })  //拖拽监听
        }
    }
    map.addEventListener("click", addLineClick);

}

/*鼠标按下/松开监听 Start*/
function mousedown(event) {
    var e = window.event;
    var obj = e.srcElement;
    alert("按下")
}

function mouseup(event) {
    var e = window.event;
    var obj = e.srcElement;
    alert("松开")
}

/*鼠标按下/松开监听 End*/

//完成绘制
function endDraw(map, pointList) {//map当前的图层
    map.clearOverlays() //清除所有覆盖物
    printPointline(map, pointList) //绘制线
    console.log("完成绘制函数")
}

/**
 * 计算一个点是否在多边形里
 * @param {Object} pt 标注点
 * @param {Object} poly 多边形数组
 */
function isInsidePolygon(pt, poly) {
    for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].lat <= pt.lat && pt.lat < poly[j].lat) || (poly[j].lat <= pt.lat && pt.lat < poly[i].lat)) &&
        (pt.lng < (poly[j].lng - poly[i].lng) * (pt.lat - poly[i].lat) / (poly[j].lat - poly[i].lat) + poly[i].lng) &&
        (c = !c);
    return c;
}

//绘制线
function printPointline(map, pointList) {
    var polyline = new BMap.Polyline(
        pointList       //标注点坐标集合
        , {
            strokeColor: "#01f700",
            enableClicking: true,//是否响应点击事件，默认为true
            strokeOpacity: 1,
            strokeWeight: '6',//折线的宽度，以像素为单位
            strokeStyle: "solid", //设置是为实线或虚线，solid或dashed
            enableEditing: false  //是否启用线编辑，默认为false
        });//创建折线
    polyline.disableMassClear()//设置不允许覆盖物在map.clearOverlays方法中被清除
    map.addOverlay(polyline);//添加标注连线
    /*转换坐标 Start*/
    transToGps(pointList)
    /*转换坐标 End*/
    // setTimeout(function () {
    //     pointList.length = 0 //清空坐标点集合
    //     pointS.length = 0
    // }, 100)
    console.log(pointList)
}

//添加采集的线路中的坐标点的信息
function addPointlineInfos(transedPointStrs, pointList) {
    $.ajax({
        url: "addPointlineInfos",
        type: "post",
        data: {
            "transedPointStrs": transedPointStrs, //轨迹
            "parentid": parentid, //父类id
            "comName": $("#input_name").val() //景点名称
        },
        dataType: "json",
        success: function (data) {
            if (data.status == "success") {
                pointList.length = 0  //清空以保存的线路点坐标数组
                pointList = new Array() //清空以保存的线路坐标数组
                transedPointStrs = "" //重置转换后的点数组
                console.log("(bxMapInfo.js:1668h)线路信息保存成功!!!")
                // showSuccessOrErrorModal(data.msg, "success");
            } else {
                showSuccessOrErrorModal(data.msg, "error");
            }
        },
        error: function (e) {
            showSuccessOrErrorModal("网络异常！", "error");
        }
    });
}

//绘制景区线路线
function printSceneryPointline(map, pointList) {
    var polyline = new BMap.Polyline(
        pointList       //标注点坐标集合
        , {
            strokeColor: "#22F719",
            strokeOpacity: 1,
            strokeWeight: '6',//折线的宽度，以像素为单位
            strokeStyle: "solid", //设置是为实线或虚线，solid或dashed
            enableEditing: false  //是否启用线编辑，默认为false
        });//创建折线
    polyline.disableMassClear()//设置不允许覆盖物在map.clearOverlays方法中被清除
    map.addOverlay(polyline);//添加标注连线
}

//取消绘制
function cancelDraw(map, pointList) {
    if (pointList.length != 0) {
        $.confirm({
            title: '友情提示',
            content: '是否确认取消绘制？',
            useBootstrap: true,
            theme: 'supervan',
            confirmButton: '确认',
            cancelButton: '取消',
            animation: 'zoom', // 弹出的效果
            closeAnimation: 'scale', //关闭的效果
            confirm: function () {
                map.clearOverlays() //清除所有覆盖物
                pointList.length = 0
                pointS.length = 0
                return
            },
            cancel: function () {
                return
            }
        });
    }
}

//必填项提示框信息
function showWarning(title, msg) {
    $.alert({
        title: title,
        useBootstrap: true,
        // theme: 'supervan',
        content: msg
    });
}

/**
 * @Author Breach
 * @Description 监听ctrl+z、ctrl+y、ctrl+x键盘按键事件
 * @Date 2018/12/21
 * @Param null
 * @return
 */
function listenKey(map, pointList, pointListY) {
    var allOverlays = map.getOverlays(); //获取多有添加的标注点
    document.onkeyup = function (event) {//设置监听键盘事件
        event = event || window.event;
        if (event.ctrlKey == true && event.keyCode == 88) {//Ctrl+x
            console.log("ctrl+x已捕获")
        }
        if (event.keyCode == 8 || event.keyCode == 46) {//监听BackSpace和Delete键盘按钮事件
            console.log("BackSpace或Delete已捕获")
            if (pointList.length > 0) {
                // pointList.pop();//删除最后一个元素
                var location = pointList.pop()
                pointListY.push(location);
                map.clearOverlays();
                createOverlayAndLine(map, pointList) //创建标注点和连线
            }
        }
        if (event.ctrlKey == true && event.keyCode == 90) {//Ctrl+Z
            console.log("ctrl+z已捕获")
            if (pointListY.length > 0) {
                // pointListY.shift() //删除第一个元素
                var location = pointListY.pop() //删除最后一个元素
                pointList.push(location)
                map.clearOverlays();
                createOverlayAndLine(map, pointList) //创建标注点和连线
            }
        }
    }
}

/**
 * @Author Breach
 * @Description 根据当前地图图层和标注点的数组创建标注点及连线
 * @Date 2018/12/25
 * @Param null
 * @return
 */
function createOverlayAndLine(map, pointList) {
    for (i = 0; i < pointList.length; i++) {
        // var index = pointList[i].indexOf(",")
        // var len = pointList[i].length
        var marker = new BMap.Marker(new BMap.Point(pointList[i].lng, pointList[i].lat));//设置标注点
        // marker.enableDragging();//设置标注可以拖拽
        marker.enableMassClear()//设置允许覆盖物在map.clearOverlays方法中被清除
        map.addOverlay(marker);//添加标注点
        var sy = new BMap.Symbol(BMap_Symbol_SHAPE_BACKWARD_OPEN_ARROW, { //添加矢量图标
            scale: 0.6,//图标缩放大小
            strokeColor: '#fff',//设置矢量图标的线填充颜色
            strokeWeight: '2',//设置线宽
        });
        var icons = new BMap.IconSequence(sy, '10', '30'); //创建标注覆盖物所使用的图标 第三个参数代表间距
        var polyline = new BMap.Polyline(
            pointList       //标注点坐标集合
            , {
                strokeColor: "red",
                strokeWeight: 2,
                strokeOpacity: 0.5,
                icons: [icons],
                strokeWeight: '8',//折线的宽度，以像素为单位
                strokeStyle: "dashed"
            });//创建折线
        polyline.enableMassClear()//设置允许覆盖物在map.clearOverlays方法中被清除
        map.addOverlay(polyline);//添加标注连线
    }
}

function showMapOverlay(e) {
    var attr = $(e).attr("showAndHide")
    if ("show" == attr) {
        $(e).attr("showAndHide", "hide")
    } else {
        $(e).attr("showAndHide", "show")
    }
}

/*添加自定义图层 Start*/
function addCustomOverlay(map) {
    var pt = new BMap.Point(114.066112, 22.548515);
    var myIcon = new BMap.Icon("/_upload/5c8a714786ea4b7a923c70446c174f0e.jpg", new BMap.Size(900, 480));
    var marker = new BMap.Marker(pt, {icon: myIcon});
    map.addOverlay(marker);
}

/*添加自定义图层 End*/

/*GCJ02转WGS84坐标系 Start*/
function gcj02towgs84(lng, lat) {
    var transedpoint = {}
    if (out_of_china(lng, lat)) {
        return [lng, lat]
    }
    else {
        var dlat = transformlat(lng - 105.0, lat - 35.0);
        var dlng = transformlng(lng - 105.0, lat - 35.0);
        var radlat = lat / 180.0 * PI;
        var magic = Math.sin(radlat);
        magic = 1 - ee * magic * magic;
        var sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
        dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
        mglat = lat + dlat;
        mglng = lng + dlng;
        transedpoint.lng = lng * 2 - mglng
        transedpoint.lat = lat * 2 - mglat
        return transedpoint
    }
}

function transformlat(lng, lat) {
    var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
    return ret
}

function transformlng(lng, lat) {
    var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
    return ret
}

//判断是否在国内，不在国内则不做偏移
function out_of_china(lng, lat) {
    return (lng < 72.004 || lng > 137.8347) || ((lat < 0.8293 || lat > 55.8271) || false);
}

/*GCJ02转WGS84坐标系 End*/

/*JS模拟键盘鼠标操作 Start*/
function fireKeyEvent(el, evtType, keyCode) {
    var doc = el.ownerDocument,
        win = doc.defaultView || doc.parentWindow,
        evtObj;
    if (doc.createEvent) {
        if (win.KeyEvent) {
            evtObj = doc.createEvent('KeyEvents');
            evtObj.initKeyEvent(evtType, true, true, win, false, false, false, false, keyCode, 0);
        }
        else {
            evtObj = doc.createEvent('UIEvents');
            Object.defineProperty(evtObj, 'keyCode', {
                get: function () {
                    return this.keyCodeVal;
                }
            });
            Object.defineProperty(evtObj, 'which', {
                get: function () {
                    return this.keyCodeVal;
                }
            });
            evtObj.initUIEvent(evtType, true, true, win, 1);
            evtObj.keyCodeVal = keyCode;
            if (evtObj.keyCode !== keyCode) {
                console.log("keyCode " + evtObj.keyCode + " 和 (" + evtObj.which + ") 不匹配");
            }
        }
        el.dispatchEvent(evtObj);
    }
    else if (doc.createEventObject) {
        evtObj = doc.createEventObject();
        evtObj.keyCode = keyCode;
        el.fireEvent('on' + evtType, evtObj);
    }
}

/*JS 模拟键盘鼠标点击 End*/