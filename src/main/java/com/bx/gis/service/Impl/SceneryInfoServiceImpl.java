package com.bx.gis.service.Impl;

import com.bx.gis.entity.BxCommodityCommon;
import com.bx.gis.entity.BxSubjectivity;
import com.bx.gis.mapper.SceneryInfoMapper;
import com.bx.gis.service.SceneryInfoService;
import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.List;
import java.util.Map;

/**
 * @Description TODO
 * @Author Breach
 * @Date 2018/12/27
 * @Version V1.0
 **/
@Service
public class SceneryInfoServiceImpl implements SceneryInfoService {

    @Autowired
    SceneryInfoMapper sceneryInfoMapper;

    @Override
    public List<String> querySceneyInfo(String scenery_name) {
        return sceneryInfoMapper.querySceneyInfo(scenery_name);
    }

    /**
     * @return int
     * @Author Breach
     * @Description 新增采集的景区单元信息
     * @Date 2019/1/3
     * @Param bmc
     */
    @Override
    public int addNewSceneryInfo(BxCommodityCommon bcc) {
        return sceneryInfoMapper.addNewSceneryInfo(bcc);
    }

    /**
      * @Author Breach
      * @Description 查询添加的景点信息是否存在
      * @Date 2019/1/3
      * @Param scenery_name
      * @return int
      */
    @Override
    public int querySceneryIfExist(String scenery_name) {
        return sceneryInfoMapper.querySceneryIfExist(scenery_name);
    }

    /**
      * @Author Breach
      * @Description 新增景点信息
      * @Date 2019/1/4
      * @Param bcc
      * @return int
      */
    @Override
    public int addSceneryType(BxSubjectivity bs) {
        return sceneryInfoMapper.addSceneryType(bs);
    }

    /**
      * @Author Breach
      * @Description 删除景区商品表及资源特色表中数据
      * @Date 2019/1/4
      * @Param comCode
      * @return int
      */
    @Override
    public int deleteNewSceneryInfo(String comCode) {
        return sceneryInfoMapper.deleteNewSceneryInfo(comCode);
    }

    /**
      * @Author Breach
      * @Description 根据商品code查询商品信息
      * @Date 2019/1/4
      * @Param comCode
      * @return java.util.List<java.util.Map<java.lang.String,java.lang.Object>>
      */
    @Override
    public List<Map<String, Object>> querySceneryInfoByCode(String comCode) {
        return sceneryInfoMapper.querySceneryInfoByCode(comCode);
    }

    /**
      * @Author Breach
      * @Description 查询修改时景点修改的名称是否已经存在
      * @Date 2019/1/4
      * @Param scenery_name
      * @param com_code
      * @return int
      */
    @Override
    public int querySceneryCount(String scenery_name, String com_code) {
        return sceneryInfoMapper.querySceneryCount(scenery_name, com_code);
    }

    /**
      * @Author Breach
      * @Description 修改景点数据
      * @Date 2019/1/4
      * @Param bcc
      * @return int
      */
    @Override
    public boolean updateNewSceneryInfo(BxCommodityCommon bcc) {
        return sceneryInfoMapper.updateNewSceneryInfo(bcc);
    }

    /**
      * @Author Breach
      * @Description 查询景区出入口信息
      * @Date 2019/1/7
      * @Param scenery_name
      * @return java.util.List<java.util.Map<java.lang.String,java.lang.Object>>
      */
    @Override
    public List<Map<String, Object>> querySceneryEntranceInfos(String scenery_name) {
        return sceneryInfoMapper.querySceneryEntranceInfos(scenery_name);
    }

    /**
      * @Author Breach
      * @Description 查询景点下的所有线路轨迹路线信息
      * @Date 2019/1/7
      * @Param parentid
      * @return java.util.List<java.util.Map<java.lang.String,java.lang.Object>>
      */
    @Override
    public List<Map<String, Object>> querySceneryTrackInfos(String parentid) {
        return sceneryInfoMapper.querySceneryTrackInfos(parentid);
    }

    @Override
    public int addPointlineInfos(Map<String, Object> params) {
        return sceneryInfoMapper.addPointlineInfos(params);
    }

    @Override
    public List<Map<String, Object>> queryNewSceneryPartInfo(String parentid, List<Integer> collectUserList) {
        return sceneryInfoMapper.queryNewSceneryPartInfo(parentid, collectUserList);
    }

    /**
      * @Author Breach
      * @Description 校验用户名和密码
      * @Date 2019/2/16
      * @Param para
      * @return int
      */
    @Override
    public int checkPsw(Map<String, Object> para) {
        return sceneryInfoMapper.checkPsw(para);
    }

    /**
      * @Author Barton
      * @Description 根据父类id查询单品的介绍说明
      * @Date 2019/4/2
      * @Param parentid
      * @return java.lang.String
      */
    @Override
    public List<Map<String, Object>> queryIntroduceInfo(int parentid) {
        return sceneryInfoMapper.queryIntroduceInfo(parentid);
    }

    /**
      * @Author Barton
      * @Description 查询当前登录账号下的子采线员id
      * @Date 2019/4/20
      * @Param collect_line_id
      * @return java.util.List<java.util.Map<java.lang.String,java.lang.Object>>
      */
    @Override
    public List<Integer> queryCollectUserInfo(int collect_line_id) {
        return sceneryInfoMapper.queryCollectUserInfo(collect_line_id);
    }

    /**
      * @Author Barton
      * @Description 查询所有线路起点坐标信息
      * @Date 2019/4/23
      * @Param parentid
      * @param collectUserList
      * @return java.util.List<java.util.Map<java.lang.String,java.lang.Object>>
      */
    @Override
    public List<Map<String, Object>> queryNewSceneryTrackInfo(String parentid, List<Integer> collectUserList) {
        return sceneryInfoMapper.queryNewSceneryTrackInfo(parentid, collectUserList);
    }

    /**
      * @Author Barton
      * @Description 查询线路id是否存在
      * @Date 2019/4/23
      * @Param id
      * @return int
      */
    @Override
    public int findIdNum(String id) {
        return sceneryInfoMapper.findIdNum(id);
    }

    /**
      * @Author Barton
      * @Description 查询该条线路的坐标信息是否完整
      * @Date 2019/4/23
      * @Param params
      * @return int
      */
    @Override
    public int findInfoCount(Map<String, Object> params) {
        return sceneryInfoMapper.findInfoCount(params);
    }

    /**
      * @Author Barton
      * @Description 新增线路百度坐标及Gps坐标
      * @Date 2019/4/23
      * @Param params
      * @return int
      */
    @Override
    public int addPoiInfo(Map<String, Object> params) {
        return sceneryInfoMapper.addPoiInfo(params);
    }

    /**
      * @Author Barton
      * @Description 修改线路百度坐标及Gps坐标
      * @Date 2019/4/23
      * @Param params
      * @return int
      */
    @Override
    public int updatePoiInfo(Map<String, Object> params) {
        return sceneryInfoMapper.updatePoiInfo(params);
    }

    /**
      * @Author Barton
      * @Description 查询线路百度及Gps坐标扩展表信息
      * @Date 2019/4/24
      * @Param
      * @return java.util.List<java.util.Map<java.lang.String,java.lang.Object>>
      */
    @Override
    public List<Map<String, Object>> queryGpsPoiTrackInfo() {
        return sceneryInfoMapper.queryGpsPoiTrackInfo();
    }

    /**
      * @Author Barton
      * @Description 保存百度坐标信息到bx_commodity_poi
      * @Date 2019/4/24
      * @Param params
      * @return int
      */
    @Override
    public int addBdTrackPoi(Map<String, Object> params) {
        return sceneryInfoMapper.addBdTrackPoi(params);
    }

    /**
      * @Author Barton
      * @Description 根据线路gps轨迹查询操作的线路的id
      * @Date 2019/4/24
      * @Param com_track_bd
      * @return int
      */
    @Override
    public int findLineId(String com_track_bd) {
        return sceneryInfoMapper.findLineId(com_track_bd);
    }

    /**
      * @Author Barton
      * @Description 根据线路id删除拆分的线路信息
      * @Date 2019/4/24
      * @Param id
      * @return int
      */
    @Override
    public int delLineTrackInfo(int id) {
        return sceneryInfoMapper.delLineTrackInfo(id);
    }
}
