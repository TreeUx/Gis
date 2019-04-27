var map;    //创建地图
var marker; //覆盖物
var flag_type; //绘制与线路规划标记
var bdMap = '<div id="bx_bdmap"></div>'
var gdMap = '<div id="bx_gdmap"></div>'
var ggMap = '<div id="bx_ggmap"></div>'
var mapType; //地图类型
var parentid = -1; //景点父类id
var cpLock = true;
var enterAndExitArr = new Array() //当前搜索的景点的出入口坐标数组
var radius = 150  //水纹圆半径(150米)

/*坐标转换需要的常量 Start*/
var x_PI = 3.14159265358979324 * 3000.0 / 180.0;
var PI = 3.1415926535897932384626;
var a = 6378245.0;
var ee = 0.00669342162296594323;
var requesturl = "https://www.ai-peer.com/" //前缀(prod)
// var requesturl = "http://118.89.49.148/" //前缀(test)
var fea; // 特色资源
/*坐标转换需要的常量 End*/
var addLineClick; //鼠标点击事件
var timeValid = true; // 鉴定时间有效性
var groundOverlay; // 全局透明图层
var CanvasDemo;
var clickOnLineBl = false; // 判断点击是否在折线上
var splitLineBl = false; // 拆分线路保存时，在保存线路时越过判断结束点不是出入口的校验时使用
var pointList = new Array(); //线路采集标注点数组
var different_text; //区别路线规划和线路采集使用
var click_line_poi = {} // 采集线路时，点击折线处的坐标点数据
var line_poi_arrs = new Array() // 存放拆分的全部线路的点数组
var operate_line_id; // 操作的线路的全局id
var tempBl = true // 点击折线时的控制开关
var pointsTemp1 = new Array() //超过十个点的存放集合
var clickPolyline; // 点击的折线覆盖物对象
var flag_index = 0; // 保存分割路线开关变量
$(function () {
    // 整个页面所有的右击事件
    document.oncontextmenu = function () {
        return false;
    }
    /*测试百度坐标系转换为国测局（原始坐标系）坐标系 Start*/
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
        var content = '<div class="amap-controlbar" style="right: 10px; top: 690px;position: fixed">' +
            '<div class="amap-luopan">' +
            '<div class="amap-luopan-bg">' +
            '</div>' +
            '<div class="amap-compass" style="transform: rotateX(-0deg) rotateZ(-0deg);">' +
            '<div class="amap-pointers">' +
            '</div>' +
            '</div>' +
            '<div class="amap-pitchUp amap-controlbar-disable" type="up" onmousedown="holdDown(this)" onmouseup="holdUp()">' +
            '</div>' +
            '<div class="amap-pitchDown amap-controlbar-disable" type="down" onmousedown="holdDown(this)" onmouseup="holdUp()">' +
            '</div>' +
            '<div class="amap-rotateLeft" type="left" onmousedown="holdDown(this)" onmouseup="holdUp()">' +
            '</div>' +
            '<div class="amap-rotateRight" type="right" onmousedown="holdDown(this)" onmouseup="holdUp()">' +
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
            $("#scenery_box").fadeOut("3000");
            $("#bx_bdmap").css("margin-top", "45px") //设置地图离页面顶部的距离
        } else {
            // $("#scenery_box").css('display','block');
            $("#scenery_box").fadeTo("3000", 0.9)
            $("#bx_bdmap").css("margin-top", "220px") //设置地图离页面顶部的距离
            $(this).text("折叠");
        }
    });
    //导览图复位
    $("#reset").click(function () {
        var lng = $("#navigation_poi").attr("poi_lng") // 记忆经度
        var lat = $("#navigation_poi").attr("poi_lat") // 记忆纬度
        var zoom = $("#navigation_poi").attr("poi_zoom") // 记忆地图级别
        if (lng != "") {
            map.centerAndZoom(new BMap.Point(lng, lat), zoom); //初始化地图，设置地图级别
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

    //选择特色星级
    $(".save-cstc").on("click", function () {
        fea = {
            "ornamental": $(".watching .axis").val() || 0,     //int   舒适性-对应等级
            "culture": $(".culture .axis").val() || 0,        //int   人文性-对应等级
            "nostalgic": $(".nos .axis").val() || 0,      //int   历史性-对应等级
            "singularity": $(".special .axis").val() || 0,    //int   新奇性-对应等级
            "romantic": $(".romantic .axis").val() || 0,       //int   浪漫性-对应等级
            "epidemic": $(".fashion .axis").val() || 0,       //int   时尚性-对应等级
            "excitement": $(".excit .axis").val() || 0,     //int   刺激性-对应等级
            "recreational": $(".relex .axis").val() || 0,   //int   休闲性-对应等级
            "iconic": $(".symbol .axis").val() || 0,          //int   独特性:对应等级,
            "parent_child": $(".parentage .axis").val() || 0,   //int   亲子性-对应等级
            "naturalness": $(".natural .axis").val() || 0,    //int   天然性-对应等级
            "participatory": $(".participate .axis").val() || 0  //int   参与性-对应等级
        }
        $("#character_type").val(JSON.stringify(fea)) //资源特色
        $("#modal-cstc").modal("hide") //隐藏特色星级模态框
    })

});
/*主函数*/

/*校验时间 Start*/
function checkStartTime() {
    var title = "有效性提示"
    var start_time = $("#com_begining").val()
    var end_time = $("#com_moment").val()
    if (!test_7($("#com_begining").val())) {
        msg = "请输入有效时间"
        showWarning(title, msg)
    } else {
        $("#com_moment").val(addMin(start_time, 0))
    }
}

function checkEndTime() {
    var title = "有效性提示"
    var start_time = $("#com_begining").val()
    var end_time = $("#com_moment").val()
    var ck_res = validateTimePeriod(start_time, end_time);
    if (!test_7($("#com_moment").val())) {
        msg = "请输入有效时间"
        showWarning(title, msg)
    } else if (!ck_res) {
        var start_t = addMin(end_time, 1)
        $("#com_begining").val(start_t)
    }
}

/*校验时间 End*/

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
var min_lng; //距离最近的经度值
var min_lat; //距离最近的纬度值
var circles1; //探测出入口的水波圆
var bl_drag = false; //拖拽地图控制开关
function listenMouseClick(map, pointList, pointListY, different_text) {
    /*监听鼠标事件 Start*/
    var bl_flag; //判断是否长按鼠标获取坐标点
    var m = document.getElementById('bx_bdmap'); //获取地图元素
    map.addEventListener("mousemove", function (e) {//设置鼠标移动过程中监听事件（获取坐标使用）
        var start_poi = false //判断起点是否选择出入口的开关
        //参数：每一层播放的间隔时间、每一层扩散至最大所花费的总时间。
        //半径、层数、中心点、{填充颜色、初始透明度}
        //鼠标按下
        m.onmousedown = function () {//down向下
            bl_flag = false //判断是否长按鼠标获取坐标点
            //参数：每一层播放的间隔时间、每一层扩散至最大所花费的总时间。
            //半径、层数、中心点、{填充颜色、初始透明度}
            if (event.button == 0) { //判断点击鼠标左键(event.button==0是点击了左键，event.button==2是点击了右键)
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
            }
        }
        //鼠标抬起
        m.onmouseup = function () {//up向上
            console.log('鼠标抬起来啦');
            // circles1.stop() //停止水波
            if (event.button == 0) { //判断点击鼠标左键
                if (bl_flag || "line_plan" == different_text) {
                    console.log("进入长按采点 Start")
                    var min_distance = -1; //存放在雷达扫描圈中心区域中景点单元最近点
                    var lng = e.point.lng;
                    var lat = e.point.lat;
                    var loca = lng + "," + lat
                    for (let i = 0; i < enterAndExitArr.length; i++) {
                        let lng_tp = enterAndExitArr[i].lng //出入口/景点单元出入口经度
                        let lat_tp = enterAndExitArr[i].lat //出入口/景点单元出入口纬度
                        var distance = (map.getDistance(new BMap.Point(lng_tp, lat_tp), new BMap.Point(lng, lat))).toFixed(2) //算出距离
                        if (radius >= distance) {
                            if (min_distance == -1) {
                                min_lng = lng_tp //将选择的出入口的坐标经度赋值给起点的经度
                                min_lat = lat_tp //将选择的出入口的坐标纬度赋值给起点的纬度
                                min_distance = distance // 判断最近点的距离
                                // console.log("radius >= distance,探测范围内点的距离为：" + distance + ",坐标为：" + lng_tp + "," + lat_tp)
                            }

                            if (parseInt(min_distance) > parseInt(distance)) { //把经纬度赋值为离得最近的出入口的经纬度坐标值
                                min_lng = lng_tp //将选择的出入口的坐标经度赋值给起点的经度
                                min_lat = lat_tp //将选择的出入口的坐标纬度赋值给起点的纬度
                                min_distance = distance // 判断最近点的距离
                                // console.log("min_distance > distance,探测范围内点的距离为：" + distance + ",坐标为：" + lng_tp + "," + lat_tp)
                            }
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
                    if (start_poi || clickOnLineBl) { //判断起点选择出入口后进行起点的标点(或者起点在已知存在的线路之间的点)
                        if ($.inArray(loca, pointS) == -1) {//过滤鼠标多次点击时重复数据
                            var marker = new BMap.Marker(new BMap.Point(lng, lat));//设置标注点
                            // marker.enableDragging();//设置标注可以拖拽
                            marker.enableMassClear();//允许覆盖物在map.clearOverlays方法中被清除
                            map.addOverlay(marker);//添加标注点
                            marker.setAnimation(BMAP_ANIMATION_DROP)  //设置标注点动态效果
                            marker.addEventListener("dragend", function (e) {//监听标注拖拽事件
                                // console.log("当前位置：" + e.point.lng + "," + e.point.lat);//输出拖拽后的标注坐标点
                            })

                            pointS.push(loca)
                            /*采线标点 Start*/
                            pointList.push(new BMap.Point(lng, lat));//连线标注点
                            if ("routing" == flag_type) { //如果是规划路线，则只标出两个点
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
                            if ("start" == flag_type) {
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
                                        strokeWeight: '4',//折线的宽度，以像素为单位
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

function transToGps(sectionPointList, splitLineBl) { //pointList转换前的坐标点数组
    /*百度转GPS坐标修正 Start*/
    var transedPointStrs = "" //transedPointStrs转换坐标后的字符串
    var pointArr = new Array()
    var index = 0
    var convertor = new BMap.Convertor();
    for (var i = 0; i < sectionPointList.length; i++) {
        // var tempPoint = {}
        var x1 = sectionPointList[i].lng
        var y1 = sectionPointList[i].lat
        pointArr.push(sectionPointList[i]);
        index++
    }

    var len = pointArr.length
    if (len <= 10) {
        convertor.translate(pointArr, 5, 3, function (data) {
            // console.log(data)
            if (data.status === 0) {
                for (var k = 0; k < pointArr.length; k++) {
                    var x2 = data.points[k].lng
                    var y2 = data.points[k].lat
                    var tempPoint = gcj02towgs84(x2, y2)
                    var x = tempPoint.lng
                    var y = tempPoint.lat
                    transedPointStrs = transedPointStrs + (x.toFixed(10) + "," + y.toFixed(10) + " ")  //拼接转换后的坐标
                }
                setTimeout(function () {
                    if (index == sectionPointList.length) { //保存线路点信息
                        var end_pointbl = false //判断最后的坐标点是否是出入口坐标使用
                        for (let i = 0; i < enterAndExitArr.length; i++) {
                            let end_point = sectionPointList[sectionPointList.length - 1] //采集线路的最后一个点坐标
                            if (end_point.equals(enterAndExitArr[i])) {
                                end_pointbl = true
                            }
                        }
                        if (!end_pointbl) { // splitLineBl：判断是否是保存拆分的线路
                            if (splitLineBl) { // 若是保存拆分线路的前半部分，则允许保存
                                //保存采集后的线路数据
                                addPointlineInfos(transedPointStrs, sectionPointList)
                            } else {
                                alert("终点必须是出入口坐标!")
                            }
                        } else {
                            //保存采集后的线路数据
                            addPointlineInfos(transedPointStrs, sectionPointList)
                            // transedPointStrs = "" //重置
                        }
                    }
                }, 50)
            }
        })
    } else {
        var index1 = 0
        addExchangeLinePoi(index1, pointArr, transedPointStrs, sectionPointList, convertor)
    }
}

// 当采集的点数超过10个时，分批进行转换拼接保存
function addExchangeLinePoi(index1, pointArr, transedPointStrs, sectionPointList, convertor) {
    convertor.translate(pointArr.slice(index1 * 10 == 0 ? index1 * 10 : index1 * 10 - 1, index1 * 10 + 9), 5, 3, function (res) {
        if (res.status === 0) {
            var points = res.points
            for (let j = 0; j < points.length; j++) { // 将转换后的百度坐标保存小数点后6位
                var x2 = points[j].lng //百度经度
                var y2 = points[j].lat //百度纬度
                var tempPoint = gcj02towgs84(x2, y2) //百度坐标系转换大地坐标系
                var x = tempPoint.lng //大地坐标系经度
                var y = tempPoint.lat //大地坐标系纬度
                transedPointStrs = transedPointStrs + (x.toFixed(10) + "," + y.toFixed(10) + " ")  //拼接转换后的大地(Gps)坐标
            }
            index1++
            if (parseInt(pointArr.length / 10) + 1 > index1) {
                addExchangeLinePoi(index1, pointArr, transedPointStrs, sectionPointList, convertor)
            } else {
                var end_pointbl = false //判断最后的坐标点是否是出入口坐标
                for (let i = 0; i < enterAndExitArr.length; i++) {
                    let end_point = sectionPointList[sectionPointList.length - 1] //采集线路的最后一个点坐标
                    if (end_point.equals(enterAndExitArr[i])) {
                        end_pointbl = true
                    }
                }
                if (!end_pointbl) { // splitLineBl：判断是否是保存拆分的线路
                    if (splitLineBl) { // 若是保存拆分线路的前半部分，则允许保存
                        //保存采集后的线路数据
                        addPointlineInfos(transedPointStrs, sectionPointList)
                        setTimeout(function () {
                            clickPolyline.enableMassClear() // 设置被拆分的折线叠加层允许被清除
                            map.clearOverlays() // 清除折线叠加层
                        }, 1000)
                    } else {
                        alert("终点必须是出入口坐标!")
                    }
                } else {
                    addPointlineInfos(transedPointStrs, sectionPointList) //保存采集后的线路数据
                    // transedPointStrs = "" //重置
                    index1 = 0
                }
            }
        }
    })
}


/*百度转GPS坐标修正 End*/

/*定位当前位置 start*/
function bdFixedPosition() {
    var map = new BMap.Map("bx_bdmap");

    function myFun(result) {
        var cityName = result.name;
        map.setCenter(cityName);
        var lng = result.center.lng
        var lat = result.center.lat
        // map.setMapStyle({style: 'light'});//设置地图样式 JavaScriptAPI V2.0 用法
        map.centerAndZoom(cityName, 16);//初始化地图，设置地图级别

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
    // 隐藏导览图
    $("#idContainer").css("overflow", "hidden")
    mapType = $("#map_type_sel").val()
    var scenery_name = $("#input_name").val();
    if (scenery_name != "") {
        switch (mapType) {
            case "bd-map":
                showSceneryInfoMap(scenery_name);//展示查询出的地图(百度)
                map.removeEventListener("click", addLineClick) //重新查询后，移除鼠标单击事件
                var m = document.getElementById('bx_bdmap'); //获取地图元素
                if (m.onmousedown != null || m.onmousedown != undefined) {
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
                            select: function (e, ui) { //Autocomplete的结果列表任意一项选中时，ui.item为选中的项
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

    // 创建自定义控件实例（指南针）
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
                    if ("routing" == flag_type) {
                        map.clearOverlays()
                        pointList.length = 0
                        pointS.length = 0
                    }
                    pointList.length = 0 //重置采集线路的点数组
                    flag_type = "start"
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
                            var temp_index = 1; // 定义的临时判断点是否已经存在与已知线路上的点的变量
                            var sub_index = new Array(); // 存放需要截取的两个线路点的数组
                            sub_index.push(0) // 放入首个点，允许为各景点单元的出入口，或者已知路线中间的点
                            for (let i = 1; i < pointList.length; i++) { // 此处进行线路分段保存
                                let eve_poi = pointList[i] // 每个采集的线路的坐标点
                                for (let j = 0; j < enterAndExitArr.length; j++) {
                                    if (!pointList[0].equals(enterAndExitArr[j])) { // 判断起始点是否为一条线路中间的点

                                    }
                                    if (eve_poi.equals(enterAndExitArr[j])) {
                                        sub_index.push(i);
                                        temp_index++;
                                        if (2 == temp_index) { // 此处判断有两个闭合的景点单元时，即进行保存
                                            console.log(sub_index)
                                            console.log(pointList.slice(sub_index[0], sub_index[1] + 1))
                                            //slice() 方法可从已有的数组中返回选定的元素。 该方法并不会修改数组，而是返回一个子数组
                                            endDraw(map, pointList.slice(sub_index[0], sub_index[1] + 1)) //画线保存坐标
                                            sub_index = sub_index.splice(1, 2) // 截取两个景点单元中的后一个点，为下一个坐标点保存做准备
                                            temp_index = 1; // 重置临时变量值
                                        }
                                        break
                                    }
                                }
                            }
                            // endDraw(map, pointList) //画线保存坐标
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
                    clickOnLineBl = false // 关闭判断是否点击在折线上开关
                    cancelDraw(map, pointList)
                    line_poi_arrs.length = 0 // 重置拆分的线路坐标数据信息
                    // pointListTemp = pointList.concat() //方式一实现数组的深拷贝
                }
            },
            /*{
                text: '采集出入口',
                callback: function () {
                    console.log('采集出入口');
                    $(".BMap_contextMenu").remove() //删除菜单项
                    addClick() //添加采集出入口坐标事件

                }
            },*/
            {
                text: '记忆导览图校验位置',
                callback: function () {
                    $("#navigation_poi").attr("poi_lng", map.getCenter().lng) // 中心点经度
                    $("#navigation_poi").attr("poi_lat", map.getCenter().lat) // 中心点纬度
                    $("#navigation_poi").attr("poi_zoom", map.getZoom()) // 地图的级别
                    $(".BMap_contextMenu").remove() //删除菜单项
                }
            },
            {
                text: '线路规划',
                callback: function () {
                    console.log('线路规划');
                    if ("start" == flag_type) {
                        map.clearOverlays()
                        pointList.length = 0
                        pointS.length = 0
                    }
                    flag_type = "routing"
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
                    if (data != "" && data != null) {
                        data = data[0]
                        var entrance = data.entrance
                        var exit = data.exit
                        var duplex = data.duplex
                        var locaArray = new Array()
                        locaArray.push(entrance)
                        locaArray.push(exit)
                        locaArray.push(duplex)
                        parentid = data.parentid //景点id
                        showEntranceMarkImg(map, locaArray, parentid) //展示景点出入口标记及景点内所有单元标记
                        querySceneryTrackInfos(map, parentid, scenery_name) //查询景点内所有路线信息
                    } else {
                        parentid = -1 //景点id
                        enterAndExitArr = new Array() //初始化景点出入口数组
                        map.centerAndZoom(scenery_name, 16);//初始化地图，设置地图级别
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
            // 创建点坐标
            if (i == locaArray.length) {
                map.centerAndZoom(point, 16);//map.getZoom()返回当前地图的缩放级别
            }
            var myIcon = new BMap.Icon("/bx-gis/images/tacked.png"
                , new BMap.Size(45, 30) //设置可视面积//150 80
                , {
                    imageOffset: new BMap.Size(0, 0), //图片相对于可视区域的偏移值
                    imageSize: new BMap.Size(45, 30) //图标所用的图片的大小
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
                            if ("routing" == flag_type) {
                                map.clearOverlays()
                                pointList.length = 0
                                pointS.length = 0
                            }
                            flag_type = "start"
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
                                    var temp_index = 1; // 定义的临时判断点是否已经存在与已知线路上的点的变量
                                    var sub_index = new Array(); // 存放需要截取的两个线路点的数组
                                    sub_index.push(0) // 放入首个点，允许为各景点单元的出入口，或者已知路线中间的点
                                    for (let i = 1; i < pointList.length; i++) { // 此处进行线路分段保存
                                        let eve_poi = pointList[i] // 每个采集的线路的坐标点
                                        for (let j = 0; j < enterAndExitArr.length; j++) {
                                            if (eve_poi.equals(enterAndExitArr[j])) {
                                                sub_index.push(i);
                                                temp_index++;
                                                if (2 == temp_index) { // 此处判断有两个闭合的景点单元时，即进行保存
                                                    console.log(sub_index)
                                                    //slice() 方法可从已有的数组中返回选定的元素。 该方法并不会修改数组，而是返回一个子数组
                                                    endDraw(map, pointList.slice(sub_index[0], sub_index[1] + 1))
                                                    sub_index = sub_index.splice(1, 2) // 截取两个景点单元中的后一个点，为下一个坐标点保存做准备
                                                    temp_index = 1; // 重置临时变量值
                                                }
                                                break
                                            }
                                        }
                                    }
                                    // endDraw(map, pointList)
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
                            clickOnLineBl = false // 关闭判断是否点击在折线上开关
                            cancelDraw(map, pointList)
                            line_poi_arrs.length = 0 // 重置拆分的线路坐标数据信息
                            // pointListTemp = pointList.concat() //方式一实现数组的深拷贝
                        }
                    },
                    /*{
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
                    }*/,
                    {
                        text: '线路规划',
                        callback: function () {
                            console.log('线路规划');
                            if ("start" == flag_type) {
                                map.clearOverlays()
                                pointList.length = 0
                                pointS.length = 0
                            }
                            flag_type = "routing"
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
        data: {
            "parentid": parentid,
            "collect_line_id": User.id
        },
        datatype: "json",
        success: function (data) {
            if (data.status == "success") {
                var indexs = 0
                // 该采线员账号下的所有景点单元数据信息
                data = $.parseJSON(JSON.stringify(data)).data
                console.log(data)
                var centerArr = new Array() //中心点坐标数组
                var codeArr = new Array() //商品编码数组
                var nameArr = new Array() //商品名称数组
                var pointArr1 = new Array()
                for (var i = 0; i < data.length; i++) {
                    var com_central = data[i].com_central == 1 ? data[i].com_centrals : data[i].com_central //中心点坐标
                    var com_code = data[i].com_code //编码
                    var com_name = data[i].com_name //名称
                    centerArr.push(com_central)
                    codeArr.push(com_code)
                    nameArr.push(com_name)
                }
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
                        if (data.status === 0) {
                            var point = data.points //转换为百度坐标后的景点单元出入口坐标
                            for (var k = 0; k < point.length; k++) {  //遍历景区内单元的坐标数据
                                var point2 = point[k] //景区内单个单元的坐标
                                let lng = point2.lng.toFixed(6) //单元经度保留六位小数
                                let lat = point2.lat.toFixed(6) //单元纬度保留六位小数
                                let temp_point = {} //定义一个json
                                temp_point.lng = lng //保留6位小数后得经度
                                temp_point.lat = lat //保留6位小数后的经度
                                enterAndExitArr.push(temp_point) //将转换后的出入口坐标放入出入口坐标集合中，供采点起点和终点校验时使用
                                var myIcon = new BMap.Icon("/bx-gis/images/map1.png"
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

                                if (1 != marker2.K.title) {
                                    map.addOverlay(marker2);
                                    markArr.push(marker2)
                                }

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
                        var id = data[i].id // 单个线路id
                        var pointsTemp = new Array()
                        var pointsTemp1 = new Array()
                        pointsTemp = data[i].com_track_bd.split(" ")
                        for (let j = 0; j < pointsTemp.length - 1; j++) {
                            pointsTemp1.push(new BMap.Point(pointsTemp[j].substring(0, pointsTemp[j].indexOf(","))
                                , pointsTemp[j].substring(pointsTemp[j].indexOf(",") + 1, pointsTemp[j].length)))
                        }
                        var polyline = new BMap.Polyline(
                            pointsTemp1       //标注点坐标集合
                            , {
                                strokeColor: "#22F719",
                                strokeOpacity: 1,
                                strokeWeight: '6',//折线的宽度，以像素为单位
                                strokeStyle: "solid", //设置是为实线或虚线，solid或dashed
                                enableEditing: false  //是否启用线编辑，默认为false
                            });//创建折线
                        polyline.disableMassClear()//设置不允许覆盖物在map.clearOverlays方法中被清除
                        polyline.addEventListener("mouseover", mouseoverLine); // 为折线添加移入事件
                        polyline.addEventListener("mouseout", mouseoutLine); // 为折线添加移出事件
                        polyline.addEventListener("click", clickLine); // 为折线添加点击事件
                        map.addOverlay(polyline);//添加标注连线
                    }
                } else {
                    map.centerAndZoom(scenery_name, 16);//初始化地图，设置地图级别
                }
            },
            error: function (e) {
                showSuccessOrErrorModal("网络异常！", "error");
            }
        })
    }
}

/**
 * 将线路的gps坐标及展示后转换的百度坐标保存到bx_commodity_poi表中
 */
function addPoiInfo(new_line_id, parentid, bdPoiStrs, transedPointStrs) {
    $.ajax({
        url: "addPoiInfo",
        data: {
            "id": new_line_id,
            "com_track_bd": bdPoiStrs,
            "com_track_gps": transedPointStrs,
            "commodity_id": parentid
        },
        type: "get",
        dataType: "json",
        success: function (data) {
            if (data.status == 200) {
                console.log("添加原始坐标及对应百度坐标信息成功")
            }
        },
        error: function (e) {
            showSuccessOrErrorModal("网络异常！", "error");
        }
    })
}

/**
 * @Author Breach
 * @Description 添加新景点函数（弹出框）
 * @Date 2018/12/25
 * @Param null
 * @return
 */
function addNewSceneryInfos(map, lng, lat, title, data, marker) {
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
    var province = "" //省
    var city = "" //城市
    // var com_address = "" //详细地址
    var com_begining = "08:00" // 服务开始时间
    var com_moment = "20:00" //服务结束时间
    var com_best = "" //最佳游玩时间
    var com_level = "" //伴行级别
    var com_img = "" //解说词
    var com_introduce = "" //商品介绍
    var com_code = "" //商品code
    var scenery_character = "" //资源特色
    var com_type = "" //类型
    var com_duplex = "" //双向出入口
    var com_exit = "" //出口
    var com_entrance = "" //入口
    var com_central = "" //中心点
    /*资源特色*/
    var ornamental = 0 //舒适性
    var culture = 0 //人文性
    var nostalgic = 0 //历史性
    var singularity = 0 //新奇性
    var romantic = 0 //浪漫性
    var epidemic = 0 //时尚性
    var excitement = 0 //刺激性
    var recreational = 0 //休闲性
    var iconic = 0 //独特性
    var parent_child = 0 //亲子性
    var naturalness = 0 //天然性
    var participatory = 0 //参与性
    var id = "" // 商品id
    var imgUrl = "" // 图片地址
    if (data != undefined && data != null && data != "") {
        id = data.id  // 商品id
        com_name = data.com_name
        state = data.state
        province = data.province
        city = data.city
        // com_address = data.com_address
        com_begining = data.com_begining
        com_moment = data.com_moment
        com_best = data.com_best
        com_level = data.com_level
        com_img = data.com_img
        com_introduce = data.com_introduce
        com_code = data.com_code
        com_central = data.com_central //出入口坐标
        com_entrance = data.com_entrance //入口
        com_exit = data.com_exit //出口
        com_duplex = data.com_duplex //双向出入口
        com_central = (com_central == "" || com_central == null) ? com_duplex : com_central
        lng = com_central.substring(0, com_central.indexOf(","))
        lat = com_central.substring(com_central.indexOf(",") + 1, com_central.length)
        imgUrl = data.imgUrl //图片地址
        /*资源特色*/
        ornamental = data.ornamental //舒适性
        culture = data.culture //人文性
        nostalgic = data.nostalgic //历史性
        singularity = data.singularity //新奇性
        romantic = data.romantic //浪漫性
        epidemic = data.epidemic //时尚性
        excitement = data.excitement //刺激性
        recreational = data.recreational //休闲性
        iconic = data.iconic //独特性
        parent_child = data.parent_child //亲子性
        naturalness = data.naturalness //天然性
        participatory = data.participatory //参与性
        checkStarNum(ornamental, 0)
        checkStarNum(culture, 1)
        checkStarNum(nostalgic, 2)
        checkStarNum(singularity, 3)
        checkStarNum(romantic, 4)
        checkStarNum(epidemic, 5)
        checkStarNum(excitement, 6)
        checkStarNum(recreational, 7)
        checkStarNum(iconic, 8)
        checkStarNum(parent_child, 9)
        checkStarNum(naturalness, 10)
        checkStarNum(participatory, 11)
    }
    //右键菜单
    var content = '<div id="myModal" tabindex="-1" role="dialog" aria-labelledby="addModalLabel" aria-hidden="true" >' +
        '<div class="modal-dialog">' +
        '<div class="modal-content" style="width: 435px;height: 680px;">' +
        // '<div class="modal-header">' +
        //     '<h4 class="modal-title" id="addModalLabel" style="border-bottom: 1px solid #878787;padding-bottom: 15px;">新增景点</h4>' +
        // '</div>' +
        '<div class="modal-body">' +
        '<form id="addSceneryModalForm" action="" class="form-horizontal">' +
        '<div class="row">' +
        '<div class="row" style="padding: 10px;margin-top:-5px;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;margin-left: 25px;">' +
        '<label for="com_name" class="control-label"><span  style="color: red;"> * </span>名称：</label>' +
        '</div>' +
        '<div class="">' +
        '<input id="tra_id" name="tra_id" value="" type="hidden">' +
        /*商品id*/
        '<input id="id" name="id" value="' + id + '" type="hidden">' +
        /*采线员Id*/
        '<input id="collect_line_id" name="collect_line_id" type="hidden" value="' + User.id + '"/>' +
        '<input id="bx_op_deptid" name="bx_op_deptid" value="" type="hidden">' +
        '<input id="parentid" name="parentid" type="hidden" value="' + parentid + '"/>' +
        '<input id="com_central" name="com_central" type="hidden" value="' + com_central + '"/>' +
        '<input id="com_code" name="com_code" type="hidden" value="' + com_code + '"/>' +
        '<input id="com_name" name="com_name" type="text" style="margin-left: -5px;padding: 3px;" value="' + com_name + '" placeholder="请输入景点名称"/>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 5px;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;margin-left: 30px;">' +
        '<label for="continents" class="control-label"><span  style="color: red;"> * </span>地区：</label>' +
        '</div>' +
        '<div class="col-sm-3"  style="float: left;width: 95px;margin-left: -20px;">' +
        '<select id="continents" name="continents" class="selectpicker" style="width: 80px;">' +
        '</select>' +
        '</div>' +
        '<div class="col-sm-3"  style="float: left;width: 95px;">' +
        '<select id="state" name="state" class="selectpicker" style="width: 80px;">' +
        '</select>' +
        '</div>' +
        '<div class="col-sm-3">' +
        '<select id="city" name="city" style="width: 80px;" class="selectpicker" >' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        /*'<div class="row" style="padding: 5px;display: none;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="scenery_address" class="control-label"><span style="color: red;"> * </span>详细地址：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<input id="scenery_address" name="scenery_address" type="text" value="' + com_address + '" style="margin-left: 10px;padding: 3px;" placeholder="请输入景区详细地址"/>' +
        '</div>' +
        '</div>' +
        '</div>' +*/
        '<div class="row" style="padding: 5px;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="character_type" class="control-label"><span  style="color: red;"> * </span>资源特色：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<input id="character_type" name="character_type" type="hidden" value=""/>' +
        '<a href="javascript:;" onclick="showStarModal();" data-toggle="modal" ' +
        'style="color: blue!important;font-size: 14px;margin-left: 10px;" data-target="#modal-cstc">点击选择</a>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 5px;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;margin-left: 30px;">' +
        '<label for="com_type" class="control-label"><span  style="color: red;"> * </span>类型：</label>' +
        '</div>' +
        '<div class="">' +
        '<select id="com_type" name="com_type" class="selectpicker"  style="margin-left: -5px;width: 80px;">' +
        '<option value="1" selected="selected">1. 吃</option>' +
        '<option value="2">2. 住</option>' +
        '<option value="3">3. 行</option>' +
        '<option value="4">4. 游</option>' +
        '<option value="5">5. 娱</option>' +
        '<option value="6">6. 购</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 5px;display: none">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="" class="control-label">地图经纬度：</label>' +
        '</div>' +
        '<div class="col-sm-9"><label id="location" style="margin-left: 10px;">' + ("新增景点" == title ? lng : updateLng) + "," + ("新增景点" == title ? lat : updateLat) + '</label></div>' +
        '</div>' +
        '</div>' +
        '<div id="addPoints" class="row" type="hidden" style="padding-top: 3px;max-height: 75px;overflow-y:auto;">' +
        '</div>' +
        /*出入口坐标 Start*/
        '<div class="row" id="poi_div" style="padding: 5px;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="poi_type" class="control-label"><span style="color: red;"> * </span>' +
        '<select id="poi_type" name="poi_type" class="selectpicker" onchange= "changePoiType()" style=";width: 70px;">' +
        '<option value="1" selected="selected">出入口</option>' +
        '<option value="2">出口</option>' +
        '<option value="3">入口</option>' +
        '</select>' +
        '</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        /*出口*/
        '<input type="hidden" id="com_entrance" name="com_entrance" value="">' +
        /*入口*/
        '<input type="hidden" id="com_exit" name="com_exit" value="">' +
        /*双向出入口*/
        '<input type="hidden" id="com_duplex" name="com_duplex" value="">' +
        '<input id="enterance_exit_poi" name="enterance_exit_poi" type="text" value="' + (com_duplex == "" ? (lng + "," + lat) : com_duplex) + '" ' +
        'style="margin-top: -6px;padding: 3px;width: 180px;margin-left: 10px;margin-right: 5px;" placeholder="点击采点按钮进行出入口坐标采集"/>' +
        '<button type="button" class="btn webuploader-container" style="margin-top: -6px;background: #81e6f1;" onclick="addClick();">采点</button>' +
        '<button type="button" class="btn webuploader-container" style="margin-top: -6px;background: #81e6f1;" onclick="clearPoi();">清除</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        /*出入口坐标 End*/
        '<div class="row" style="padding: 5px;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="com_begining com_moment" class="control-label"><span  style="color: red;"> * </span>开放时段：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<input id="com_begining" name="com_begining" onblur="checkStartTime()" type="time" value="' + com_begining + '" style="width: 70px;margin-left: 10px;"/> ~ &nbsp;&nbsp;&nbsp; ' +
        '<input id="com_moment" onblur="checkEndTime()" name="com_moment" type="time" value="' + com_moment + '" style="width: 70px;" />' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 5px;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;">' +
        '<label for="com_best" class="control-label"><span  style="color: red;"> * </span>游玩时间：</label>' +
        '</div>' +
        '<div class="col-sm-9">' +
        '<input id="com_best" name="com_best" type="text" style="margin-left: 10px;padding: 3px;" value="' + com_best + '" maxlength="8" placeholder="请输入游玩时间(分钟)"/>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 5px;">' +
        '<div class="form-group" style="width: 456px;">' +
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
        '<div class="row" style="padding: 5px;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;margin-left: 25px;">' +
        '<label for="" class="control-label">解说词：</label>' +
        '</div>' +
        '<div class="">' +
        '<textarea id="com_img" name="com_img" rows="2" cols="20" style="margin-left: -15px;">' + com_img + '</textarea>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 5px;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;margin-left: 25px;">' +
        '<label for="" class="control-label">商品介绍：</label>' +
        '</div>' +
        '<div class="">' +
        '<textarea id="com_introduce" name="com_introduce" rows="2" cols="20" style="margin-left: -15px;">' + com_introduce + '</textarea>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="row" style="padding: 5px;">' +
        '<div class="form-group" style="width: 456px;">' +
        '<div class="col-sm-3" style="float: left;margin-left: 10px;">' +
        // '<label class="control-label"></span>上传图片：</label>' +
        '<div class="layui-form-item">' +
        '                <label class="layui-form-label"><i class="red" style="color:red">*</i>景区图片 :</label>' +
        '                <div class="layui-input-block">' +
        '                    <div class="layui-upload">' +
        '                        <button type="button" class="layui-btn test2">上传图片</button>' +
        '                        <div class="layui-upload-list">' +
        '                            <img class="layui-upload-img demo2" style="width: 200px;height: 125px;border: 1px solid white;" />' +
        '                            <p class="demoText"></p >' +
        '                        </div>' +
        '                    </div>' +
        '                </div>' +
        '            </div>' +
        '</div>' +
        /*图片上传开始部分*/
        /* '<div id="uploader-image">' +
         '<div id="filePicker1">选择图片</div>' +
         '<div id="fileList1" class="uploader-list" style="padding: 5px;"></div>' +
         '</div>' +*/
        /*图片上传结束部分*/
        '</div>' +
        '</div>' +
        '</div>' +
        '</form>' +
        '<div class="scenery-box-bt">' +
        '<input type="button" class="btn btn-default" value="取消" onclick="closeSceneryInfoModel()"; style="margin-right: 40px;padding: 6px 12px;">' +
        '<input id="submitSceneryCollectInfo" type="submit" class="webuploader-container" marker="' + marker + '" ' +
        'clicked="0" value="保存" point="' + lng + "," + lat + '" onclick="submitSceneryInfo(this);">' +
        '</div>' +
        '<div style="clear: both;"></div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    var infoWindow = new BMap.InfoWindow(content, {
        offset: new BMap.Size(0, 0), //设置弹窗偏移量
        width: 430, //设置弹窗宽度
        height: 690, //取值范围：0, 220 - 730。如果您指定宽度为0，则信息窗口的宽度将按照其内容自动调整
        enableAutoPan: true, //是否开启信息窗口打开时地图自动移动（默认开启）
        enableCloseOnClick: false //是否开启点击地图关闭信息窗口（默认开启）
        // title: "新增景点"
    }); //创建信息窗口对象
    infoWindow.setTitle(title)
    var point = new BMap.Point("新增景点" == title ? lng : updateLng, "新增景点" == title ? lat : updateLat);
    map.openInfoWindow(infoWindow, point);
    // console.log(infoWindow.getTitle())  //返回弹出窗标题
    // console.log(infoWindow.isOpen())

    //监听添加窗口的关闭事件
    infoWindow.addEventListener('close', function (e) {
        // 重置资源特色星级选择信息
        $(".inpt_box").prop("checked", false);
        $(".options").find("img").attr("src", "/bx-gis/images/shoucang1.png");
        $(".options").find(".starbox .axis").removeClass('axis')
    });

    setTimeout(function () { //监听右键菜单框打开事件
        if (infoWindow.isOpen()) {   //添加景点窗口打开后，添加照片事件
            layui.use('upload', function () {
                var $ = layui.jquery
                    , upload = layui.upload;

                //图片上传
                upload.render({
                    elem: '.test2'
                    , url: requesturl + "travels/api/img_uploading/"
                    , data: {
                        //   	"id":pro_id,
                        // "com_code":pro_code
                    }
                    , done: function (res) {
                        var item = this.item;
                        //上传完毕
                        console.log(res);
                        //layer.msg("上传成功！");
                        layer.msg(res.message);
                        cur_img = res.data.path;

                        $(item).siblings(".layui-upload-list").find('.demo2').attr('src', requesturl + res.data.path);
                        $(item).siblings(".layui-upload-list").find('.demo2').attr('imgUrl', res.data.path)
                    }
                });
            })
            /*添加添加模态框拖拽功能 Start*/
            // map.addEventListener("dragend", function () { // 设置添加模态框可拖拽
            //     var com_entrance = $("#com_entrance").val() // 拖拽前的入口
            //     var com_exit = $("#com_exit").val() // 拖拽前的出口
            //     var com_duplex = $("#com_duplex").val() // 拖拽前的双向出入口
            //     console.log(map.getCenter())
            //     map.openInfoWindow(infoWindow, map.getCenter()) //测试拖拽添加模态框
            //     if(infoWindow.isOpen()) {
            //         $("#com_entrance").val(com_entrance)
            //         $("#com_exit").val(com_exit)
            //         $("#com_duplex").val(com_duplex)
            //     }
            //     transedBdPoiToGpsPoi($("#enterance_exit_poi").val(), $("#poi_type").val())
            // })
            /*添加添加模态框拖拽功能 End*/
            // infoWindow.setContent(content)
            $("#com_duplex").val(com_duplex); //初始化双向出入口坐标
            $("#com_exit").val(com_exit); //初始化出口坐标
            $("#com_entrance").val(com_entrance); //初始化入口坐标
            $(".demo2").attr("src", imgUrl == "" ? " " : requesturl + imgUrl) // 设置图片地址
            $(".demo2").attr("imgurl", imgUrl) // 设置imgurl图片属性
            if ("修改景点" == title) {
                $("#poi_div").css("display", "none") //隐藏出入口div
                fea = {
                    "ornamental": ornamental,     //int   舒适性-对应等级
                    "culture": culture,        //int   人文性-对应等级
                    "nostalgic": nostalgic,      //int   历史性-对应等级
                    "singularity": singularity,    //int   新奇性-对应等级
                    "romantic": romantic,       //int   浪漫性-对应等级
                    "epidemic": epidemic,       //int   时尚性-对应等级
                    "excitement": excitement,     //int   刺激性-对应等级
                    "recreational": recreational,   //int   休闲性-对应等级
                    "iconic": iconic,          //int   独特性:对应等级,
                    "parent_child": parent_child,   //int   亲子性-对应等级
                    "naturalness": naturalness,    //int   天然性-对应等级
                    "participatory": participatory  //int   参与性-对应等级
                }
                console.log(JSON.stringify(fea))
                $("#character_type").val(JSON.stringify(fea)) //资源特色
            }
            transedBdPoiToGpsPoi($("#enterance_exit_poi").val(), $("#poi_type").val())
            // $("#scenery_character").val(0); //初始化资源特色下拉选
            $("#tra_id").val(User.tra_id) //设置旅行社Id
            $("#bx_op_deptid").val(User.op_deptid) //设置运营部Id
            $("#com_type").val(1); //初始化类型下拉选
            listenTitleShow();

            // $('#myModal').draggable(); //设置模态框可以拖拽

            /*转换百度坐标为原始坐标点 Start*/
            var everPoint = $("#location").text()
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
                        // $("#com_central").val(x + "," + y)
                        $("#com_central").val($("#com_duplex").val()); //中心点坐标
                    }
                })
            }
            /*转换百度坐标为原始坐标点 End*/

            //初始化下拉选
            for (var i = 0; i < GlobalCity.length; i++) { //国家
                $("#continents").append(
                    '<option value="' + GlobalCity[i].id + '">' + GlobalCity[i].value + '</option>'
                )
            }
            for (var i = 1; i < GlobalCity[0].child.length; i++) { //省
                $("#state").append(
                    '<option value="' + GlobalCity[0].child[i].id + '">' + GlobalCity[0].child[i].value + '</option>'
                );
            }
            for (var i = 1; i < GlobalCity[0].child[1].child.length; i++) { //市
                $("#city").append(
                    '<option value="' + GlobalCity[0].child[1].child[i].id + '">' + GlobalCity[0].child[1].child[i].value + '</option>'
                );
            }
            if (state != "") {
                $("#continents").val(state); //初始化国家下拉选
                queryProvinceInfo()
            }
            if (province != "") {
                $("#state").val(province); //初始化省份下拉选
                queryCityInfo()
            }
            if (city != "") {
                $("#city").val(city); //初始化城市下拉选
            }

            $("#continents").change(queryProvinceInfo)
            $("#state").change(queryCityInfo)
            $("#city").change(function () {
                var city = $("#city").find("option:selected").text();
            })

        }
    }, 50);
}

//展示特色星级选择模态框
function showStarModal() {
    $("#modal-cstc").modal("show")
    $('#modal-cstc').draggable(); //设置模态框可以拖拽
}

//监听添加模态框中出入口下拉选改变事件
function changePoiType() {
    $("#enterance_exit_poi").val("") //重置采集的坐标点信息
}

/*添加、移除事件 Start*/
//采集出入口事件
var flag = true;

/*function showInfo(e) {
    console.log(e.point.lng + ", " + e.point.lat);
    var lng = e.point.lng
    var lat = e.point.lat
    $("#addPoints").removeAttr("type"); //展示出入口坐标div
    var content =
        '<div class="row" style="padding: 5px;">' +
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
}*/

//添加转换后的坐标信息
function showInfo(e) {
    console.log(e.point.lng + ", " + e.point.lat);
    var lng = e.point.lng
    var lat = e.point.lat
    var poi_type = $("#poi_type").val()
    if (flag) { //添加开关防止鼠标多次事件
        switch (poi_type) { // 双向出入口支持单个坐标，出口和入口则支持多个坐标
            case "1": // 双向出入口
                $("#enterance_exit_poi").val(lng + "," + lat)
                break
            case "2": // 出口
                $("#enterance_exit_poi").val($("#enterance_exit_poi").val() == "" ? (lng + "," + lat) : $("#enterance_exit_poi").val() + " " + lng + "," + lat)
                break
            case "3": // 入口
                $("#enterance_exit_poi").val($("#enterance_exit_poi").val() == "" ? (lng + "," + lat) : $("#enterance_exit_poi").val() + " " + lng + "," + lat)
                break
            default:
                $("#enterance_exit_poi").val(lng + "," + lat)
                break
        }
        flag = false
        transedBdPoiToGpsPoi($("#enterance_exit_poi").val(), poi_type) //赋值出入口坐标信息
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

//清空采集错误的出入口坐标
function clearPoi() {
    var poi_type = $("#poi_type").val()
    $("#enterance_exit_poi").val("") //清空显示的采集的出入口坐标信息
    switch (poi_type) {
        case "1":
            $("#com_duplex").val("") //清空双向出入口坐标点信息
            break
        case "2":
            $("#com_exit").val("") //清空出口坐标点信息
            break
        case "3":
            $("#com_entrance").val("") //清空入口坐标点信息
            break
    }
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
        var fileName = new Date().getTime() + ".jpg"; //自定义上传图片的名称
        var $li = $(
            '<div id="' + file.id + '" class="file-item thumbnail" style="float:left;padding-left:10px;width:105px;">' +
            '<img>' +
            // '<div class="info">' + file.name + '</div>' +
            '<div class="info">' + fileName + '</div>' +
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
    var continents = $("#continents").val() == null ? "" : $("#continents").val()
    var state = $("#state").val() == null ? "" : $("#state").val()
    var city = $("#city").val() == null ? "" : $("#continents").val()
    var duplex_poi = $("#com_duplex").val() //双向出入口坐标
    var exit_poi = $("#com_exit").val() //出口坐标
    var enterance_poi = $("#com_entrance").val() //入口坐标
    var start_time = $("#com_begining").val()
    var start_time = $("#com_begining").val()

    //表单验证
    if ($("#com_name").val() == "") {//景点名称
        msg = "请输入景点名称"
        showWarning(title, msg)
    } else if (continents == "" && $("#continents").find("option").length != 0) {//国家
        msg = "请选择地区"
        showWarning(title, msg)
    } else if ($("#state").val() == "" && $("#state").find("option").length != 0) {//省份
        msg = "请选择国家"
        showWarning(title, msg)
    } else if ($("#city").val() == "" && $("#city").find("option").length != 0) {//城市
        msg = "请选择城市"
        showWarning(title, msg)
    } else if ($("#character_type").val() == "" || $(".options .inpt_box:checked").length == 0) {//景点特色
        msg = "请选择资源特色"
        showWarning(title, msg)
    } else if ($("#com_type").val() == "") {//类型
        msg = "请选择类型"
        showWarning(title, msg)
    } else if (duplex_poi == "" && exit_poi == "" && enterance_poi == "") {//出入口坐标
        msg = "请采集出入口坐标"
        showWarning(title, msg)
    } else if ($("#com_begining").val() == "") {//开放时间
        msg = "请输入开放时间"
        showWarning(title, msg)
    } else if (!test_7($("#com_begining").val()) || !test_7($("#com_moment").val())) {
        msg = "请输入有效时间"
        showWarning(title, msg)
    } else if ($("#com_moment").val() == "") {//开放时间
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
    var bxcommodity = {
        "bx_op_deptid": $("#bx_op_deptid").val(),
        "tra_id": $("#tra_id").val(), // 旅行社id
        "id": $("#id").val(), // 商品id
        "mer_id": "",
        "parent_id": parentid, // 父类Id
        "com_type": $("#com_type").val(),
        //"com_type": mer_req.mer_type,
        "charge_type": 3, // 收费类型
        "refer_price": 10, // 参考价格
        "com_name": $("#com_name").val(),
        "com_location": "",
        "com_entrance": $("#com_entrance").val(),
        "com_com_exit": $("#com_name").val(),
        "com_duplex": $("#com_duplex").val(),
        "com_img": $("#com_img").val(),
        "com_introduce": $("#com_introduce").val(),
        "com_begining": $("#com_begining").val(),
        "com_moment": $("#com_moment").val(),
        //"com_best": mer_req.mer_best,
        "com_best": $("#com_best").val(),
        "com_shortest": parseInt($("#com_best").val()) - parseInt($("#com_best").val()) * 0.2,
        "com_longest": parseInt($("#com_best").val()) + parseInt($("#com_best").val()) * 0.2,
        "com_central": $("#com_central").val(),
        "com_address": $("#com_address").val(),
        "com_level": $("#bx_level").val(),
        "state": $("#continents").val(),
        "province": $("#state").val(),
        "city": $("#city").val(),
        "district": $("#city").val(),
        "collect_line_id": $("#collect_line_id").val()
    }
    img = {
        "id": $(".demo2").attr("imgId") ? $(".demo2").attr("imgId") : "",
        "imgurl": $(".demo2").attr("imgurl")
    }
    pro_req = {
        "img": img,
        "bxcommodity": bxcommodity,
        "cfeature": fea
    }
    if (parentid != -1) {
        // console.log(JSON.stringify(pro_req))
        $.ajax({
            // url: "addNewSceneryInfo",
            url: requesturl + "travels/api/commdity_group/",
            type: "POST",
            dataType: "json",
            data: JSON.stringify(pro_req),
            contentType: "application/json;utf-8",
            success: function (data) {
                if (data.result == 200) {
                    console.log(data)
                    console.log(data.data.com_code)
                    map.closeInfoWindow()
                    showSuccessOrErrorModal(data.message, "success");//保存成功后，需要添加一个标记点
                    var comCode = data.data.com_code;//获取保存的景点的商品编码
                    var lng = $("#com_central").val().substring(0, $("#com_central").val().indexOf(",")) //转换后的坐标
                    var lat = $("#com_central").val().substring($("#com_central").val().indexOf(",") + 1, $("#com_central").val().indexOf(",").length)//转换后的坐标

                    addMarkImg(map, lng, lat, comCode, e);//添加标记
                    removeClick() // 移除鼠标点击事件
                } else {
                    showSuccessOrErrorModal(data.message, "error");
                }
            },
            error: function (e) {
                showSuccessOrErrorModal("网络异常！", "error");
            }
        });
    } else {
        alert("尚未添加该景区信息，请先添加该景区信息后，再进行景区内部数据采集。" +
            "（友情提示：已添加的景区，在搜索时，会自动弹出提示下拉选项，通过选择下拉选即可定位到已添加的景区，然后可以进行该景区内部数据录入。）")
    }
}

/**
 * 自动将form表单封装成json对象
 */
$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

var flag = true

// 采集景点信息之后，添加标记
function addMarkImg(map, lng, lat, comCode, e) {
    if (flag) {
        var point = e.attributes.point.value //添加景点时，为转换前的坐标值
        var lng = point.substring(0, point.indexOf(","))
        var lat = point.substring(point.indexOf(",") + 1, point.length)
        var fixedPoint = point //添加景点时，为转换前的坐标值（弹出修改窗时使用）

        var point = new BMap.Point(lng, lat);
        // 添加标记后，将标记点坐标放入需要探测出入口的数组中
        enterAndExitArr.push(point)
        // 创建点坐标
        map.centerAndZoom(point, map.getZoom());//map.getZoom()返回当前地图的缩放级别
        var myIcon = new BMap.Icon("/bx-gis/images/map1.png"
            , new BMap.Size(40, 45) //设置可视面积
            , {
                imageOffset: new BMap.Size(0, 0), //图片相对于可视区域的偏移值
                imageSize: new BMap.Size(30, 35) //图标所用的图片的大小
            }); //创建自定义标注物
        // 初始化地图， 设置中心点坐标和地图级别
        var marker1 = new BMap.Marker(point, {icon: myIcon, title: "查看详情"});
        marker1.disableMassClear();//禁止覆盖物在map.clearOverlays方法中被清除
        marker1.customData = {myProperty: comCode}; //为覆盖物添加自定义属性
        marker1.customData1 = {myPoint: fixedPoint}; //为覆盖物添加自定义属性
        if (e.attributes.marker.value == ""
            || e.attributes.marker.value == undefined
            || e.attributes.marker.value == "undefined") {
            map.addOverlay(marker1);
            flag = false
        }
        marker1.addEventListener("rightclick", function (e) {
            var p = e.point;  //获取marker的位置
            var lng = p.lng;
            var lat = p.lat;
            addMarkerContextMenu(map, marker1, lng, lat)
        });//为添加的标记添加点击事件

        //为marker添加右键菜单
        function addMarkerContextMenu(map, marker, lng, lat) {
            // console.log("为marker添加右键菜单")
            var menu = new BMap.ContextMenu(); //右键菜单
            var txtMenuItem = [//右键菜单项目
                {
                    text: '修改景点',
                    callback: function () { //返回函数中进行相应逻辑操作
                        // console.log('修改景点');
                        $(".BMap_contextMenu").remove() //删除菜单项
                        // map.clearOverlays() //清空覆盖物
                        var title = "修改景点";
                        updateSceneryInfo(map, lng, lat, title, marker);
                    }
                },
                {
                    text: '删除景点',
                    callback: function () {
                        // console.log('删除景点');
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

//修改景点单元信息
function updateSceneryInfo(map, lng, lat, title, marker) {
    console.log(marker)
    var comCode = marker.customData.myProperty
    $.ajax({
        url: "querySceneryInfoByCode",
        // url: requesturl + "travels/api/commdity_details/",
        type: "get",
        data: {"comCode": comCode},
        dataType: "json",
        success: function (data) {
            if (data.status == 200) {
                data = data.sceneryInfoList[0];
                // data = data.data.bxcommodity;
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

//删除景点单元
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
                        showSuccessOrErrorModal(data.msg, "success");
                        marker2.enableMassClear(); //设置允许覆盖物在map.clearOverlays方法中被清除
                        map.clearOverlays(); //删除当前覆盖物
                        // map.redraw()
                        // marker2.redraw()
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
    if (enterAndExitArr.length != 0) {
        listenMouseClick(map, pointList, pointListY, different_text) //设置采点水纹特效（探测出入口）
    }
    addLineClick = function (e) {//设置鼠标左键点击事件
        var lng = e.point.lng;
        var lat = e.point.lat;
        var loca = lng + "," + lat
        console.log("鼠标点击处的坐标为:" + lng + "," + lat)
        if ($.inArray(loca, pointS) == -1) {//过滤鼠标多次点击时重复数据
            if (pointList.length == 0 && enterAndExitArr.length != 0 && !clickOnLineBl) { //此处如果存在出入口，则起点必须是出入口
                console.log("clickOnLineBl = " + clickOnLineBl)
                alert("通过长按鼠标左键进行线路起点的探测选择")
            } else {
                var marker = new BMap.Marker(new BMap.Point(lng, lat));//设置标注点
                // marker.enableDragging();//设置标注可以拖拽
                marker.enableMassClear();//允许覆盖物在map.clearOverlays方法中被清除
                map.addOverlay(marker);//添加标注点
                marker.setAnimation(BMAP_ANIMATION_DROP)  //设置标注点动态效果
                marker.addEventListener("dragend", function (e) {//监听标注拖拽事件
                    // console.log("当前位置：" + e.point.lng + "," + e.point.lat);//输出拖拽后的标注坐标点
                })

                pointS.push(loca)
                /*采线标点 Start*/
                pointList.push(new BMap.Point(lng, lat));//连线标注点
                if ("routing" == flag_type) { //如果是规划路线，则只标出两个点
                    if (pointList.length == 3) {
                        map.clearOverlays()
                        pointList.splice(1, 1)  //从数组第一个下表开始删除，删除一个元素
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
                if ("start" == flag_type) {
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
function endDraw(map, sectionPointList) {//map当前的图层
    map.clearOverlays() //清除所有覆盖物
    printPointline(map, sectionPointList) //绘制线
    flag_index = 0;
    console.log("完成绘制函数")
}

//绘制线
function printPointline(map, sectionPointList) {
    transToGps(sectionPointList)
    /*转换坐标 End*/
}

/*为折线添加的事件 Start*/

// 鼠标移入折线函数
function mouseoverLine(e) {
    // console.log("鼠标移到了折线上")
    var p = e.target;
    p.setStrokeColor("red") // 设置折线颜色
    p.setStrokeWeight(7) // 设置折线宽度
    p.setStrokeOpacity(0.9) // 设置折线透明度
}

// 鼠标移出折线函数
function mouseoutLine(e) {
    // console.log("鼠标移出了折线")
    var p = e.target;
    p.setStrokeColor("#22F719") // 设置折线颜色
    p.setStrokeWeight(6) // 设置折线宽度
    p.setStrokeOpacity(0.8) // 设置折线透明度
}

// 点击折线函数
function clickLine(e) {
    clickOnLineBl = true // 设置开关判断是否点击在折线上
    var lng = e.point.lng;
    var lat = e.point.lat;
    var p = e.target;
    clickPolyline = p; // 获取点击的线路的对象
    var line_track = "" // 线路Gps坐标轨迹

    if (pointList[0] == undefined) { // 判断第一次点击折线上的点
        line_poi_arrs = new Array()
        click_line_poi.lng = lng // 全局点击折线时记录坐标值
        click_line_poi.lat = lat // 全局点击折线时记录坐标值
        // console.log(click_line_poi.lng + "," + click_line_poi.lat)
        var distance_arr = new Array() // 存放单条线路每两个点中间的距离的数据
        var min_index = 0;// 获取最近距离出的点的下标
        for (let i = 0; i < p.getPath().length; i++) { // 求出每两个临近点的距离，并存放到一个数组中
            line_track += (p.getPath()[i].lng.toFixed(6) + "," + p.getPath()[i].lat.toFixed(6)) + " "
            if (i != p.getPath().length - 1) {
                distance_arr.push((map.getDistance(new BMap.Point(p.getPath()[i].lng, p.getPath()[i].lat)
                    , new BMap.Point(p.getPath()[i + 1].lng, p.getPath()[i + 1].lat))).toFixed(0))
            }
        }
        for (let i = 0; i < distance_arr.length; i++) { // 判断点击折线处的点到该折线上每个点的距离之后与每两个临近点之间的距离进行比较
            var distance = (map.getDistance(new BMap.Point(click_line_poi.lng, click_line_poi.lat)
                , new BMap.Point(p.getPath()[i].lng, p.getPath()[i].lat))).toFixed(0) //算出距离
            var distance1 = (map.getDistance(new BMap.Point(click_line_poi.lng, click_line_poi.lat)
                , new BMap.Point(p.getPath()[i + 1].lng, p.getPath()[i + 1].lat))).toFixed(0) //算出下一个点距离

            if (parseInt(distance_arr[i]) == (parseInt(distance) + parseInt(distance1))// 判断点击折线处的点到该折线上每个点的距离之后与每两个临近点之间的距离进行比较
                || parseInt(distance_arr[i]) == (parseInt(distance) + parseInt(distance1) + 1)
                || (distance_arr[i] + 1) == (parseInt(distance) + parseInt(distance1))) {
                // console.log("点击处位于第" + (i + 1) + "个点和第" + (i + 2) + "个点之间")
                var line_poi_arr0 = new Array() // 存放拆分的单个线路第一部分坐标点数据
                var line_poi_arr1 = new Array() // 存放拆分的单个线路第二部分坐标点数据
                for (let j = 0; j < p.getPath().length; j++) {
                    if (j <= i) {
                        line_poi_arr0.push(p.getPath()[j])
                        if (j == i) { // 存放拆分后的线路的前半部分
                            // 存放点击折线处的坐标点到第一个数组的结尾
                            line_poi_arr0.push(new BMap.Point(click_line_poi.lng, click_line_poi.lat))
                            // console.log(line_poi_arr0)
                            line_poi_arrs.push(line_poi_arr0)
                            // 存放点击折线处的坐标点到第二个数组的开头
                            line_poi_arr1.push(new BMap.Point(click_line_poi.lng, click_line_poi.lat))
                        }
                    } else { // 存放拆分后的线路的后半部分
                        line_poi_arr1.push(p.getPath()[j])
                        if (j == (p.getPath().length - 1)) {
                            line_poi_arrs.push(line_poi_arr1)
                        }
                    }
                }
                break
            }
        }
        console.log(line_track)
        // 查询操作的该条线路轨迹的id
        findLineId(line_track)
    } else {
        // console.log("点击的折线不是作为起始点")
        return
    }
    // console.log(p.getPath()) // 获取折线上点的所有点坐标集合
    // console.log("鼠标点击了折线")
}

// 根据线路gps轨迹查询操作的线路的id
function findLineId(com_track_bd) {
    $.ajax({
        url: "findLineId",
        type: "post",
        data: {
            "com_track_bd": com_track_bd //线路Gps轨迹
        },
        dataType: "json",
        success: function (data) {
            if (data.status == 200) {
                // 操作的线路的id
                operate_line_id = data.id
                // console.log(operate_line_id)
            } else {
                // showSuccessOrErrorModal(data.msg, "error");
                // console.log(com_track_bd)
            }
        },
        error: function (e) {
            showSuccessOrErrorModal("网络异常！", "error");
        }
    });
}

// 根据线路id删除拆分的线路信息
function delLineTrackInfo() {
    $.ajax({
        url: "delLineTrackInfo",
        type: "get",
        data: {
            "id": operate_line_id //线路轨迹id
        },
        dataType: "json",
        success: function (data) {
            if (data.status == 200) {
                pointList.length = 0  //清空以保存的线路点坐标数组
                transedPointStrs = "" //重置转换后的点数组
                bdPoiStrs = "" // 重置转换后的百度坐标数据
                // console.log("删除拆分的线路")
            } else {
                // showSuccessOrErrorModal(data.msg, "error");
                // console.log("未删除拆分的线路")
            }
        },
        error: function (e) {
            showSuccessOrErrorModal("网络异常！", "error");
        }
    });
}

/*为折线添加的事件 End*/

//添加采集的线路中的坐标点的信息
function addPointlineInfos(transedPointStrs, sectionPointList) {
    $.ajax({
        url: "addPointlineInfos",
        type: "post",
        data: {
            "transedPointStrs": transedPointStrs, //拼接后的Gps坐标轨迹
            "parentid": parentid, //父类id
            "traId": User.tra_id, //旅行社id
            "bxOpDeptid": User.op_deptid, //运营部id
            "collectLineId": User.id, //采线员id
            "comName": $("#input_name").val() //景点名称
        },
        dataType: "json",
        success: function (data) {
            if (data.status == "success") {
                // 新保存的采集线路的Id
                var new_line_id = data.id
                /*采用此种标点无误差*/
                var convertor = new BMap.Convertor();
                var locas1 = transedPointStrs.split(" ")
                var pointArr = new Array();
                for (var j = 0; j < locas1.length; j++) {
                    var location = locas1[j]
                    if (location != "" && location != null) {
                        var lng = location.substring(0, location.indexOf(","))
                        var lat = location.substring(location.indexOf(",") + 1, location.length)
                        var point = new BMap.Point(lng, lat)
                        pointArr.push(point);
                    }
                }
                /*原始坐标转换为百度坐标 Start*/
                if (pointArr.length <= 10) {
                    // 要保存的拼接的百度坐标字符串
                    var bdPoiStrs = ""
                    convertor.translate(pointArr, 1, 5, function (res) {
                        var pointsTemp = new Array()
                        if (res.status === 0) {
                            var points = res.points
                            // console.log(points)
                            for (let j = 0; j < points.length; j++) { // 将转换后的百度坐标保存小数点后6位
                                pointsTemp.push(new BMap.Point(points[j].lng.toFixed(6), points[j].lat.toFixed(6)))
                                bdPoiStrs += (points[j].lng.toFixed(6) + "," + points[j].lat.toFixed(6) + " ")
                            }
                            var polyline = new BMap.Polyline(
                                pointsTemp       //标注点坐标集合(百度坐标)
                                , {
                                    strokeColor: "#22F719",
                                    strokeOpacity: 1,
                                    strokeWeight: '6',//折线的宽度，以像素为单位
                                    strokeStyle: "solid", //设置是为实线或虚线，solid或dashed
                                    enableEditing: false  //是否启用线编辑，默认为false
                                });//创建折线
                            polyline.disableMassClear()//设置允许覆盖物在map.clearOverlays方法中被清除
                            polyline.addEventListener("mouseover", mouseoverLine); // 为折线添加移入事件
                            polyline.addEventListener("mouseout", mouseoutLine); // 为折线添加移出事件
                            polyline.addEventListener("click", clickLine); // 为折线添加点击事件
                            map.addOverlay(polyline);//添加标注连线
                            // 添加线路id、百度坐标及Gps坐标到扩展表中(new_line_id:新增线路Id,parentid:景区Id, pointsTemp：转换为的百度坐标, transedPointStrs: Gps坐标)
                            addPoiInfo(new_line_id, parentid, bdPoiStrs, transedPointStrs);
                        }
                    })
                } else { //当一条线路中的点大于10时，需要进行点切分进行坐标系转换（convertor.translate()一次只能转换10个坐标点）
                    pointsTemp1 = new Array()
                    // 要保存的拼接的百度坐标字符串
                    var bdPoiStrs = ""
                    var index = 0
                    // 展示原始坐标转换为百度坐标后的线路
                    showLineInfo(new_line_id, parentid, transedPointStrs, bdPoiStrs, index, pointArr, convertor)

                }
                // 判断起始点是否为已知线路的中间任意一点
                if (pointList.length != 0) {
                    if (pointList[0].equals(new BMap.Point(click_line_poi.lng, click_line_poi.lat)) && flag_index < line_poi_arrs.length) {
                        // console.log("保存拆分后的线路，并进行线绘制")
                        for (flag_index; flag_index < line_poi_arrs.length; flag_index++) {
                            splitLineBl = true
                            transToGps(line_poi_arrs[flag_index], splitLineBl) //绘制线
                        }
                        // 清除已删除的线路线段
                        map.clearOverlays()
                        // 删除操作的被拆分的原线路信息
                        if (flag_index == line_poi_arrs.length) {
                            delLineTrackInfo()
                        }
                    }
                }
                /*原始坐标转换为百度坐标 End*/

                clickOnLineBl = false // 关闭判断是否点击在折线上开关

                if (pointList[pointList.length - 1] == sectionPointList[sectionPointList.length - 1]) {
                    if (!pointList[0].equals(new BMap.Point(click_line_poi.lng, click_line_poi.lat))) {
                        pointList.length = 0  //清空以保存的线路点坐标数组
                        transedPointStrs = "" //重置转换后的点数组
                        bdPoiStrs = "" // 重置转换后的百度坐标数据
                    }
                }
                line_poi_arrs.length = 0 // 重置拆分的线路坐标数据信息
            } else {
                showSuccessOrErrorModal(data.msg, "error");
            }
        },
        error: function (e) {
            showSuccessOrErrorModal("网络异常！", "error");
        }
    });
}

// 当采集的点数超过10个时，分批进行转换展示
function showLineInfo(new_line_id, parentid, transedPointStrs, bdPoiStrs, index, pointArr, convertor) {
    convertor.translate(pointArr.slice(index * 10 == 0 ? index * 10 : index * 10 - 1, index * 10 + 9), 1, 5, function (res) {
        if (res.status === 0) {
            var points = res.points
            for (let j = 0; j < points.length; j++) { // 将转换为的百度坐标保存小数点后6位
                pointsTemp1.push(new BMap.Point(points[j].lng.toFixed(6), points[j].lat.toFixed(6)))
                bdPoiStrs += (points[j].lng.toFixed(6) + "," + points[j].lat.toFixed(6) + " ")
            }
            index++
            if (parseInt(pointArr.length / 10) + 1 > index) {
                showLineInfo(new_line_id, parentid, transedPointStrs, bdPoiStrs, index, pointArr, convertor)
            } else {
                var polyline = new BMap.Polyline(
                    pointsTemp1       //标注点坐标集合
                    , {
                        strokeColor: "#22F719",
                        strokeOpacity: 1,
                        strokeWeight: '6',//折线的宽度，以像素为单位
                        strokeStyle: "solid", //设置是为实线或虚线，solid或dashed
                        enableEditing: false  //是否启用线编辑，默认为false
                    });//创建折线
                polyline.disableMassClear()//设置不允许覆盖物在map.clearOverlays方法中被清除
                polyline.addEventListener("mouseover", mouseoverLine); // 为折线添加移入事件
                polyline.addEventListener("mouseout", mouseoutLine); // 为折线添加移出事件
                polyline.addEventListener("click", clickLine); // 为折线添加点击事件
                map.addOverlay(polyline);//添加标注连线
                // 添加线路id、百度坐标及Gps坐标到扩展表中(new_line_id:新增线路Id,parentid:景区Id, bdPoiStrs：转换为的百度坐标拼接后的字符串, transedPointStrs: Gps坐标)
                addPoiInfo(new_line_id, parentid, bdPoiStrs, transedPointStrs);
            }
        }
    })
}

//绘制景区线路线
// function printSceneryPointline(map, pointList) {
//     var polyline = new BMap.Polyline(
//         pointList       //标注点坐标集合
//         , {
//             strokeColor: "#22F719",
//             strokeOpacity: 1,
//             strokeWeight: '6',//折线的宽度，以像素为单位
//             strokeStyle: "solid", //设置是为实线或虚线，solid或dashed
//             enableEditing: false  //是否启用线编辑，默认为false
//         });//创建折线
//     polyline.disableMassClear()//设置不允许覆盖物在map.clearOverlays方法中被清除
//     polyline.addEventListener("mouseover", mouseoverLine); // 为折线添加移入事件
//     polyline.addEventListener("mouseout", mouseoutLine); // 为折线添加移出事件
//     polyline.addEventListener("click", clickLine); // 为折线添加点击事件
//     map.addOverlay(polyline);//添加标注连线
// }

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
            // console.log("ctrl+x已捕获")
        }
        if (event.keyCode == 8 || event.keyCode == 46) {//监听BackSpace和Delete键盘按钮事件
            // console.log("BackSpace或Delete已捕获")
            if (pointList.length > 0) {
                // pointList.pop();//删除最后一个元素
                var location = pointList.pop()
                pointListY.push(location);
                map.clearOverlays();
                createOverlayAndLine(map, pointList) //创建标注点和连线
            }
        }
        if (event.ctrlKey == true && event.keyCode == 90) {//Ctrl+Z
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
                strokeOpacity: 0.3,
                icons: [icons],
                strokeWeight: '8',//折线的宽度，以像素为单位
                strokeStyle: "dashed"
            });//创建折线
        polyline.enableMassClear()//设置允许覆盖物在map.clearOverlays方法中被清除
        map.addOverlay(polyline);//添加标注连线
    }
}

/*添加自定义图层 Start*/
function addCustomOverlay(map) {
    // console.log(map.getBounds().Ce + "," + map.getBounds().Pd) // 东北角
    // console.log(map.getBounds().He + "," + map.getBounds().Rd) // 西南角
    // 西南角和东北角
    var SW = new BMap.Point(map.getBounds().He, map.getBounds().Rd);
    var NE = new BMap.Point(map.getBounds().Ce, map.getBounds().Pd);
    groundOverlayOptions = {
        // imageURL: $(".demo1").attr("src"), // 图层的图片地址
        opacity: 0.3, //设置透明度
        displayOnMinLevel: 10, // 最小缩放级别
        displayOnMaxLevel: 22 // 最大缩放级别
    }
    // 初始化GroundOverlay
    groundOverlay = new BMap.GroundOverlay(new BMap.Bounds(SW, NE), groundOverlayOptions);
    // 设置GroundOverlay的图片地址
    groundOverlay.setImageURL($(".demo1").attr("src"));
    // 单击事件
    groundOverlay.addEventListener('click', function (clickEvent) { // 为自定义的景区导览图图层添加鼠标左键点击事件
        // console.log('导览图区域被单击');
        // console.log(this)
        // console.log(this.V.children)
        // console.log(this.V.children[0]) // 获取自定义的当前图层
        // console.log($(this.V.children[0]).attr("id", "tour_guide_img")) // 对图片的img标签进行属性添加
        $(this.V.children[0]).attr("id", "tour_guide_img") // 对图片的img标签进行属性添加
    });

    // 双击事件dblclick
    // 右击事件
    groundOverlay.addEventListener('rightclick', function (dblclickEvent) { // 为自定义的景区导览图图层添加鼠标右键点击事件
        // console.log('导览图区域被双击');
        addClickFun(map) // 添加右键菜单
    });
    groundOverlay.disableMassClear() // 设置调用map.clearOverlays不清除此图层覆盖物
    map.addOverlay(groundOverlay); // 添加透明图层
    // console.log(groundOverlay)
    // console.log("添加透明图层")
}

var ground_bl = true

function showMapOverlay(e) { // 控制展示/隐藏透明导览图
    var flag = $("#navigation_poi").val() // 判断是否上传导览图
    if ("0" == flag) {
        alert("请先上传导览图")
    } else {
        if (ground_bl) {
            // addCustomOverlay(map)
            ground_bl = false
            /*可缩放拖拽图片操作 Start*/
            $("#bx_bdmap").css('z-index', '-1'); // 设置导览图图层置顶
            $("#idContainer").css('z-index', '10000'); // 设置导览图图层置顶
            $("#idContainer").css("overflow", "") // 设置显示图片
            // $("#idContainer").css("z-index", "1") // 设置显示图片
            $("#bx_bdmap").css("opacity", "1") // 设置显示图片
            $("#idContainer").css("opacity", "0.3") // 设置显示图片
            /*可缩放拖拽图片 End*/
        } else {
            $("#idContainer").css("z-index", "-1") // 设置底层
            $("#bx_bdmap").css('z-index', '9999'); // 设置地图图层置顶
            $("#idContainer").css("opacity", "0") // 设置显示图片透明度为0
            // console.log(groundOverlay)
            // console.log("删除透明图层")
            map.removeOverlay(groundOverlay) // 移除透明图层
            ground_bl = true
        }
    }
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
                // console.log("keyCode " + evtObj.keyCode + " 和 (" + evtObj.which + ") 不匹配");
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

//根据选择的国家查询省份下拉选信息
function queryProvinceInfo() {
    var state = $("#continents").val()
    for (var i = 0; i < GlobalCity.length; i++) {
        if (state == GlobalCity[i].id) {
            $("#state").html("")
            if (GlobalCity[i].child != undefined) {
                for (var j = 1; j < GlobalCity[i].child.length; j++) {
                    $("#state").append(
                        '<option value="' + GlobalCity[i].child[j].id + '">' + GlobalCity[i].child[j].value + '</option>'
                    );
                }
                queryCityInfo()
                break
            } else {
                $("#city").html("")
            }
        }
    }
}

//根据选择的省份信息查询城市下拉选信息
function queryCityInfo() {
    var state = $("#continents").val()
    var province = $("#state").val()
    for (var i = 0; i < GlobalCity.length; i++) {
        if (state == GlobalCity[i].id) {
            for (var j = 0; j < GlobalCity[i].child.length; j++) {
                if (province == GlobalCity[i].child[j].id) {
                    $("#city").html("")
                    if (GlobalCity[i].child[j].child != undefined) {
                        for (var k = 1; k < GlobalCity[i].child[j].child.length; k++) {
                            $("#city").append(
                                '<option value="' + GlobalCity[i].child[j].child[k].id + '">' + GlobalCity[i].child[j].child[k].value + '</option>'
                            );
                        }
                    }
                    var city = $("#city").find("option:selected").text();
                    var province = $("#state").find("option:selected").text();
                    var state = $("#continents").find("option:selected").text();
                    // console.log(city == "")
                    city = city == "" ? (province == "" ? state : province) : city
                    break
                }
            }
        }
    }
}

/*百度坐标系转换为原始坐标系 Start*/
function transedBdPoiToGpsPoi(bd_poi, poi_type) { // bd_poi要转换的百度坐标,poi_type为出入口类型
    // var bd_poi = $("#enterance_exit_poi").val()
    var convertor = new BMap.Convertor()
    var pointArr = new Array()
    if ("1" == poi_type) { // 双向出入口
        var x = bd_poi.substring(0, bd_poi.indexOf(",")) //百度坐标系经度
        var y = bd_poi.substring(bd_poi.indexOf(",") + 1, bd_poi.length) //百度坐标系纬度
        var ggpoint = new BMap.Point(x, y)
        pointArr.push(ggpoint)
    } else { //出口、入口
        var locaArr = bd_poi.split(" ") // 切割多个坐标点
        for (var i = 0; i < locaArr.length; i++) {
            var x = locaArr[i].substring(0, locaArr[i].indexOf(",")) //百度坐标系经度
            var y = locaArr[i].substring(locaArr[i].indexOf(",") + 1, locaArr[i].length) //百度坐标系纬度
            var ggpoint = new BMap.Point(x, y)
            pointArr.push(ggpoint)
        }
    }

    convertor.translate(pointArr, 5, 3, function (data) { //百度坐标系转换为国测局坐标系
        // console.log(data)

        switch (poi_type) {
            case "1": // 双向出入口
                var x1 = data.points[0].lng
                var y1 = data.points[0].lat
                var wgsPoint = gcj02towgs84(x1, y1)
                // console.log("百度坐标系转换为国测局（原始坐标系）坐标系 Start")
                // console.log(wgsPoint)
                // console.log(wgsPoint.lng.toFixed(10) + "," + wgsPoint.lat.toFixed(10))
                // console.log("百度坐标系转换为国测局（原始坐标系）坐标系 End")
                $("#com_duplex").val(wgsPoint.lng.toFixed(10) + "," + wgsPoint.lat.toFixed(10))
                break
            case "2": // 出口
                var finalExitPoi = ""
                for (var i = 0; i < data.points.length; i++) {
                    let x1 = data.points[i].lng
                    let y1 = data.points[i].lat
                    let wgsPoint = (gcj02towgs84(x1, y1))
                    finalExitPoi += (wgsPoint.lng.toFixed(10) + "," + wgsPoint.lat.toFixed(10) + " ")
                }
                $("#com_exit").val(finalExitPoi) //多个转换后的出口坐标
                break
            case "3": // 入口
                var finalEntrancePoi = ""
                for (var i = 0; i < data.points.length; i++) {
                    let x1 = data.points[i].lng
                    let y1 = data.points[i].lat
                    let wgsPoint = gcj02towgs84(x1, y1)
                    finalEntrancePoi += (wgsPoint.lng.toFixed(10) + "," + wgsPoint.lat.toFixed(10) + " ")
                }
                $("#com_entrance").val(finalEntrancePoi) //多个转换后的入口坐标
                break
        }
    })
}

/*百度坐标系转换为原始坐标系 End*/

//编辑模态框中的资源特色的星级显示
function checkStarNum(star, index) { //star: 星数 ， index： 类型下标
    if (star != 0) {
        $(".options input[value=" + index + "]").prop("checked", true);
        $(".options input[value=" + index + "]").parent().parent().parent().find(".starbox li").eq(star - 1).addClass("axis");
        if (star == 5) {
            $(".options input[value=" + index + "]").parent().parent().parent().find(".starbox li").find("img").attr("src", "/bx-gis/images/shoucang.png");
        } else {
            $(".options input[value=" + index + "]").parent().parent().parent().find(".starbox li").eq(star).prevAll().find("img").attr("src", "/bx-gis/images/shoucang.png");
        }
    }
}

//校验时间格式有效性
function test_7(time) {
    var timeRegex_2 = new RegExp("([0-1]?[0-9]|2[0-3]):([0-5][0-9])$");
    var b_3 = timeRegex_2.test(time);
    // console.log(b_3)
    return b_3;
}

// 查询校验,校验起始时间是否小于截至时间
function validateTimePeriod(begin, end) { //begin：开始时间, end：结束时间
    var b_len = begin.length
    var b_index = begin.indexOf(":")
    var b_t_h = begin.substring(0, b_index) // 时
    var b_t_m = begin.substring(b_index + 1, b_len) // 分
    var e_len = end.length
    var e_index = end.indexOf(":")
    var e_t_h = end.substring(0, e_index) // 时
    var e_t_m = end.substring(e_index + 1, e_len) // 分
    if (begin == end) {
        return false;
    } else if (parseInt(b_t_h) > parseInt(e_t_h) || (parseInt(b_t_h) == parseInt(e_t_h) && parseInt(b_t_m) > parseInt(e_t_m))) {
        if ("00:00" == end) {
            return true;
        } else {
            return false;
        }
    }
    return true;
}

// 操作结束时间大于开始时间
function addMin(time_str, type) {
    var len = time_str.length
    var index = time_str.indexOf(":")
    var t_h = time_str.substring(0, index) // 时
    var t_h_f = time_str.substring(0, 1)
    var t_h_e = time_str.substring(1, index)
    var t_m = time_str.substring(index + 1, len) // 分
    var t_m_f = time_str.substring(index + 1, index + 2)
    var t_m_e = time_str.substring(index + 2, len)
    if (type == 0) {
        if (time_str == "23:59") {
            time_str = "00:00"
        } else if (t_m == "59") {
            time_str = (parseInt(t_h) + 1) + ":00"
        } else if (t_m_e == "9") {
            time_str = t_h + ":" + (parseInt(t_m_f) + 1) + "0"
        } else {
            time_str = t_h + ":" + t_m_f + (parseInt(t_m_e) + 1)
        }
    } else {
        if (time_str == "00:00") {
            time_str = "23:59"
        } else if (t_m == "00") {
            // console.log(parseInt(t_h) - 1)
            // console.log(parseInt(t_h) - 1 < 10)
            // console.log("0" + (parseInt(t_h) - 1))
            // console.log(parseInt(t_h) - 1 < 10 ? ("0" + (parseInt(t_h) - 1)) : parseInt(t_h) - 1)
            time_str = (parseInt(t_h) - 1 < 10 ? ("0" + (parseInt(t_h) - 1)) : parseInt(t_h) - 1) + ":59"
        } else if (t_m_e == "0") {
            time_str = t_h + ":" + (parseInt(t_m_f) - 1) + "9"
        } else {
            time_str = t_h + ":" + t_m_f + (parseInt(t_m_e) - 1)
        }
    }
    return time_str
}

//地图透明化
var map_bl = true;

function showCrystalMap() {
    if (map_bl) {
        $("#bx_bdmap").css("opacity", "0.6")
        $("#idContainer").css("opacity", "1")
        map_bl = false
    } else {
        $("#bx_bdmap").css("opacity", "1")
        map_bl = true
    }
}

function minuxOpacity() {
    var num = $("#bx_bdmap").css("opacity")
    if (num != 0) {
        $("#bx_bdmap").css("opacity", num - 0.1)
    }
}

function addOpacity() {
    var num = $("#bx_bdmap").css("opacity")
    num = parseFloat(num)
    if (num != 1) {
        $("#bx_bdmap").css("opacity", num + 0.1)
    }
}

/* 监听鼠标长按事件 Start*/
var timeStart, timeEnd, time;//申明全局变量
function getTimeNow() {//获取此刻时间
    var now = new Date();
    return now.getTime();
}

function holdDown(e) {//鼠标按下时触发
    var type = $(e).attr("type")
    timeStart = getTimeNow();//获取鼠标按下时的时间
    time = setInterval(function () {//setInterval会每100毫秒执行一次
        timeEnd = getTimeNow();//也就是每100毫秒获取一次时间
        if (timeEnd - timeStart > 600) {//如果此时检测到的时间与第一次获取的时间差有600毫秒
            // clearInterval(time);//便不再继续重复此函数 （clearInterval取消周期性执行）
            switch (type) {
                case "up":
                    // console.log("长按up");//并弹出代码
                    break
                case "down":
                    // console.log("长按down");//并弹出代码
                    break
                case "left":
                    // console.log("长按left");//并弹出代码
                    var canvas = document.querySelector('bx_bdmap');
                    var ctx = canvas.getContext('2d');
                    //3.把旋转的矩形平移进画布
                    ctx.translate(300, 300)
                    //1.定义一个旋转的方法,确定每次时间间隔中要旋转多少弧度
                    ctx.rotate(0.01 * Math.PI);
                    break
                case "right":
                    // console.log("长按right");//并弹出代码
                    var canvas = document.getElementById('bx_bdmap');
                    var ctx = canvas.getContext('2d');
                    //3.把旋转的矩形平移进画布
                    ctx.translate(300, 300)
                    //1.定义一个旋转的方法,确定每次时间间隔中要旋转多少弧度
                    ctx.rotate(0.01 * Math.PI);
                    break
            }
        }
    }, 100);
}

function holdUp() {
    clearInterval(time);//如果按下时间不到1000毫秒便弹起，
}

/* 监听鼠标长按事件 End*/
