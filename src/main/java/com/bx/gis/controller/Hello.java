package com.bx.gis.controller;

import com.bx.gis.entity.BxCommodityCommon;
import com.bx.gis.service.TestHelloService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @Description 测试返回页面
 * @Author Breach
 * @Date 2018/12/19
 * @Version V1.0
 **/
@Controller
@RequestMapping("/bx")
public class Hello {
    private static final Logger log = LoggerFactory.getLogger(Hello.class);

    @Autowired
    TestHelloService testHelloService;

    /*@RequestMapping("/index")
    public String hello(Model model) {
        model.addAttribute("name", "单击获取经纬度");
        return "bxlyMap";
    }*/

    /**
      * @Author Breach
      * @Description 保存采集的景区单元信息
      * @Date 2018/12/20
      * @Param
      * @return java.util.Map<java.lang.String,java.lang.Object>
      */
    @SuppressWarnings("AlibabaLowerCamelCaseVariableNaming")
    @RequestMapping("/addScenery")
    @ResponseBody
    public Map<String, Object> addSceneryInfo(HttpServletRequest request) {
        String sceneryName = request.getParameter("scenery_name");
        String comDuplex = request.getParameter("com_duplex");
        Map<String, Object> result = new HashMap<>(16);
        BxCommodityCommon bc = new BxCommodityCommon();
        bc.setComName(sceneryName);
        bc.setComDuplex(comDuplex);
        try {
            int num = testHelloService.addSceneryInfo(bc);
            result.put("status", "success");
            result.put("msg", "保存成功");
        } catch (Exception e) {
            result.put("status", "error");
            result.put("msg", "操作失败");
            log.error(e.getMessage());
        }

        return result;
    }

    /**
     * @Author Breach
     * @Description 测试连接数据库查询（有效）
     * @Date 2018/12/19
     * @Param
     * @return void
     */
    @RequestMapping("/query")
    public void testQuery() {
        List<Map<String, Object>> list = testHelloService.queryDemo();
        System.out.println(list);
    }


    public static void main(String[] args) {
        for (int i = 1; i < 10; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print("i * j =" + i * j + "\t");
                if(i == j) {
                    System.out.println();
                }
            }

        }

    }
}
