package com.bx.gis.service.Impl;

import com.bx.gis.entity.BxCommodityCommon;
import com.bx.gis.mapper.TestHelloMapper;
import com.bx.gis.service.TestHelloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * @Description TODO
 * @Author Breach
 * @Date 2018/12/19
 * @Version V1.0
 **/
@Service
public class TestHelloServiceImpl implements TestHelloService {
    @Autowired
    TestHelloMapper testHelloMapper;
    @Override
    public List<Map<String, Object>> queryDemo() {
        return testHelloMapper.queryDemo();
    }

    /**
      * @Author Breach
      * @Description 添加采集点信息
      * @Date 2018/12/20
      * @Param bc
      * @return int
      */
    @Override
    public int addSceneryInfo(BxCommodityCommon bc) {
        return testHelloMapper.addSceneryInfo(bc);
    }
}
