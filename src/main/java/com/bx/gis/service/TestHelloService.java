package com.bx.gis.service;

import com.bx.gis.entity.BxCommodityCommon;

import java.util.List;
import java.util.Map;

/**
 * @Description TODO
 * @Author Breach
 * @Date 2018/12/19
 * @Version V1.0
 **/
public interface TestHelloService {

    List<Map<String, Object>> queryDemo();

    int addSceneryInfo(BxCommodityCommon bc);
}
