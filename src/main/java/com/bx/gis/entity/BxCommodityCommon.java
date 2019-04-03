package com.bx.gis.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * @Description TODO
 * @Author Breach
 * @Date 2018/12/20
 * @Version V1.0
 **/
@Data
public class BxCommodityCommon {
    /*商品编码*/
    private String comCode;
    /*商家编码*/
    private String merCode;
    /*代理编码*/
    private String merAgency;
    /*国家编码*/
    private String comPassport;
    /*旅行社机构id*/
    private int traId;
    /*收费类型：1-系统收费;2-自费;3-免费;*/
    private int chargeType;
    /*参考价*/
    private BigDecimal referPrice;
    /*商品名称*/
    private String comName;
    /*商品类型*/
    private int comType;
    /*商品数量*/
    private String comQuantity;
    /*商品双向出入口坐标*/
    private String comDuplex;
    /*商品出口坐标*/
    private String comExit;
    /*商品入口坐标*/
    private String comEntrance;
    /*详细地址*/
    private String comAddress;
    /*服务起始时间*/
    private Date comBegining;
    /*服务结束时间*/
    private Date comMoment;
    /*最佳游玩时长*/
    private int comBest;
    /*最短时长*/
    private int comShortest;
    /*最长时长*/
    private int comLongest;
    /*单品介绍说明*/
    private String comIntroduce;
    /*单品解说词*/
    private String comImg;
    /*商品层级*/
    private String comLevel;
    /*国家*/
    private String state;
    /*省份*/
    private String province;
    /*城市*/
    private String city;
    /*父指针*/
    private int parentid;
    /*中心点坐标*/
    private String comCentral;
    /*轨迹*/
    private String comTrack;
    /*轨迹方向*/
    private int comDirection;
    /*轨迹宽度*/
    private int lineWidth;
    /*定制游运营部id*/
    private int bxOpDeptid;
    /*运营部名称*/
    private String opDeptName;
    /*父id*/
    private int parent;
}
