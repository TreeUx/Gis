package com.bx.gis.config;


import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author: kevin
 * @date: 2018/10/25 11:17
 */
@Component
@WebFilter(urlPatterns = "/*", filterName = "crossFilter")//这里的“/*” 表示的是需要拦截的请求路径
@Log4j2
public class CrossConfig implements Filter {
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        System.out.println("初始化过滤器成功！");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse rep = (HttpServletResponse) response;

        //设置允许跨域的配置
        // 这里填写你允许进行跨域的主机ip（正式上线时可以动态配置具体允许的域名和IP）
        rep.setHeader("Access-Control-Allow-Origin", "*");
        // 允许的访问方法
        rep.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS, DELETE, PATCH");
        // Access-Control-Max-Age 用于 CORS 相关配置的缓存
        rep.setHeader("Access-Control-Max-Age", "3600");
        rep.setHeader("Access-Control-Allow-Headers", "token,Origin, X-Requested-With, Content-Type, Accept");


        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json; charset=utf-8");
//        String token = req.getHeader("token");//header方式
        boolean isFilter = false;

        String method = ((HttpServletRequest) request).getMethod();
        if (method.equals("OPTIONS")) {
            rep.setStatus(HttpServletResponse.SC_OK);
        } else {
            isFilter = true;
        }
        if (isFilter) {
//            log.info("token filter过滤ok!");
            chain.doFilter(request, response);
        }
    }

    @Override
    public void destroy() {

    }
}
