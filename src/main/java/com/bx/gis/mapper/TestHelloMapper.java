package com.bx.gis.mapper;

import com.bx.gis.entity.BxCommodityCommon;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface TestHelloMapper {
    List<Map<String, Object>> queryDemo();

    int addSceneryInfo(BxCommodityCommon bc);
}
