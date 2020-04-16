using crystal.util;
using crystal.dao;
using crystal.model;
using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using crystal_po_api.util;

namespace crystal_po_api.util
{
    public class LoginUtil
    {
        public delegate bool Accessible(User u);

        public static Result doLogin(String name, String password, String domain, String deviceId, String appId, 
            Boolean debug = false)
        {
            if (name == null)
            {
                return Result.Error("name is missing");
            }
            if (password == null)
            {
                return Result.Error("password is missing");
            }
            if (domain == null)
            {
                return Result.Error("domain is missing");
            }
            if (deviceId == null)
            {
                return Result.Error("deviceId is missing");
            }
            if (appId == null)
            {
                return Result.Error("appId is missing");
            }

            //using (AuthenticationServiceSoap.AuthenticationServiceSoapClient authenClient = new AuthenticationServiceSoap.AuthenticationServiceSoapClient("AuthenticationServiceSoap"))
            //{
            //    AuthenticationServiceSoap.LoginResponse authenResponse = authenClient.common_login(name, password, domain, appId, deviceId, debug);
            //    if (authenResponse.hasException)
            //    {
            //        return Result.Access(authenResponse.msg);
            //    }
            //    /*else
            //    {
            //        using (TokenService.TokenServiceSoapClient tokenClient = new TokenService.TokenServiceSoapClient("TokenServiceSoap"))
            //        {

            //            TokenService.TokenResponse tokenResponse = tokenClient.request(name, deviceId, appId, debug);
            //            if (!tokenResponse.hasException)
            //            {
            //                authenResponse.user.token = tokenResponse.token;
            //                return Result.Ok(authenResponse.user);
            //            }
            //            else
            //            {
            //                return Result.Error(tokenResponse.msg);
            //            }
            //        }
            //    }*/
            //    return Result.Ok(authenResponse.user);
            //}

            return Result.Ok(null);
        }

        public static Result doLogin(Accessible acc, String name, String password, String domain, String deviceId, String appId)
        {
            if (name == null)
            {
                return Result.Error("name is missing");
            }
            if (password == null)
            {
                return Result.Error("password is missing");
            }
            if (domain == null)
            {
                return Result.Error("domain is missing");
            }
            if (deviceId == null)
            {
                return Result.Error("deviceId is missing");
            }
            if (appId == null)
            {
                return Result.Error("appId is missing");
            }
            domain = domain.ToUpper();
            User u = new User();
            
            //RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.getConfigParameter());
            //RfcDestination dest = ConfigUtil.getDestination();
            RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.SAP_DEST_NAME);
            UserDao dao = new UserDao(dest);
            String ldapUrl = ConfigurationManager.AppSettings["LDAP_" + domain];
            if(!ldapUrl.StartsWith("LDAP://"))
            {
                ldapUrl = "LDAP://"+ldapUrl;
            }

            User adminUser = ConfigUtil.adminUser();
            u = dao.getUser(deviceId, name, password, ConfigurationManager.AppSettings["ACTUAL_" + domain + "_NAME"], ldapUrl, adminUser.name, adminUser.password, ConfigurationManager.AppSettings["ConnStr"], ConfigurationManager.AppSettings["UAC_DB_CONNECTION"]);

            //if (dao.validateAndSetUserInfo(u, ConfigurationManager.AppSettings["LDAP_" + domain], ConfigUtil.adminUser(domain), ConfigurationManager.AppSettings["UAC_DB_CONNECTION"]))
            if(u != null && u.token != null)
            {
                if (acc(u))
                {
                    /*String token = TokenUtil.Manager[appId].create(u).token;
                    Dictionary<String, String> d = new Dictionary<String, String>();
                    d.Add("token", token);
                    return Result.Ok(d);*/
                    return Result.Ok(u);
                }
                else
                {
                    return Result.Access("no access right");
                }
            }
            else
            {
                return Result.Error("invalid user info");
            }
        }
    }
}