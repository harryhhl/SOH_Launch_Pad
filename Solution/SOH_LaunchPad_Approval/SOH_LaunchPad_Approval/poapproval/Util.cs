using crystal.dao;
using crystal.model;
using crystal.util;
using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;

namespace crystal_po_api.util
{
    public class Util
    {
        public const String STARTER = "Approval";

        public const String PO = "ServicePO";//ServicePO

        public const String PO_APPROVAL = "ServicePOApproval";
        //07/09/2015 Arvin Add
        public const String RawPO_APPROVAL = "RawMatPOApproval";//RawMatPOApproval
        public const String SubPO_APPROVAL = "SubMatPOApproval";//SubMatPOApproval

        public static bool accessible(crystal.model.User u, String appId)
        {
            if (u == null)
            {
                return false;
            }
            return u.apps.Contains(appId);
        }

        public static bool accessibleStarter(crystal.model.User u)
        {
            return accessible(u, STARTER);
        }

        public static bool accessiblePO(crystal.model.User u)
        {
            return accessible(u, PO);
        }
        //07/09/2015 Arvin Add
        public static bool accessiblePOApproval(crystal.model.User u)
        {
            return accessible(u, PO_APPROVAL);
        }
        //07/09/2015 Arvin Add
        public static bool accessibleRawPOApproval(crystal.model.User u)
        {
            return accessible(u, RawPO_APPROVAL);
        }

        public static bool accessibleSubPOApproval(crystal.model.User u)
        {
            return accessible(u, SubPO_APPROVAL);
        }
        public static crystal.model.User getUserWithoutAccessibleAppsFromToken(HttpRequest request, String appId, Boolean debug = false)
        {
            String name = request.Params["name"];
            if (name == null)
            {
                throw new Exception("name parameter is missing");
            }
            String token = request.Params["token"];
            if (token == null)
            {
                throw new Exception("token parameter is missing");
            }
            String deviceId = request.Params["deviceId"];
            if (deviceId == null)
            {
                throw new Exception("deviceId parameter is missing");
            }
            //using (TokenServiceSoap.TokenServiceSoapClient client = new TokenServiceSoap.TokenServiceSoapClient("TokenServiceSoap"))
            //{
            //    TokenServiceSoap.ValidationResponse resp = client.validate(name, deviceId, token, appId, debug);
            //    if (resp.hasException)
            //    {
            //        throw new Exception(resp.msg);
            //    }
            //    if (!resp.valid)
            //    {
            //        throw new TokenException();
            //    }
            //    crystal.model.User u = new crystal.model.User();
            //    u.name = name;
            //    u.deviceId = deviceId;
            //    u.token = token;
            //    return u;
            //}

            return null;

            /*RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.SAP_DEST_NAME);
            UserDao dao = new UserDao(dest);
            return dao.getUser(deviceId, name, token, domain, ConfigurationManager.AppSettings["ConnStr"]);*/
        }

        public static bool validateToken(HttpRequest request, String appId, Boolean needSapSet, Boolean debug)
        {
            String name = request.Params["name"];
            if (name == null)
            {
                throw new Exception("name parameter is missing");
            }
            String token = request.Params["token"];
            if (token == null)
            {
                throw new Exception("token parameter is missing");
            }
            String deviceId = request.Params["deviceId"];
            if (deviceId == null)
            {
                throw new Exception("deviceId parameter is missing");
            }
            /*RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.SAP_DEST_NAME);
            UserDao dao = new UserDao(dest);
            return dao.validateToken(token, name, deviceId, ConfigurationManager.AppSettings["ConnStr"]);*/

            //using (TokenServiceSoap.TokenServiceSoapClient client = new TokenServiceSoap.TokenServiceSoapClient("TokenServiceSoap"))
            //{
            //    TokenServiceSoap.ValidationResponse resp = client.validate(name, deviceId, token, appId, debug);
            //    if (resp.hasException)
            //    {
            //        throw new Exception(resp.msg);
            //    }
            //    if (resp.valid && needSapSet)
            //    {
            //        TokenServiceSoap.SapIdResponse idResp = client.getSapId(name, deviceId, token, appId, debug);
            //        if (idResp.hasException)
            //        {
            //            throw new Exception(idResp.msg);
            //        }
            //        if (idResp.id == null || idResp.id.Trim().Length == 0)
            //        {
            //            return false;
            //        }
            //    }
            //    return resp.valid;
            //}

            return true;
            
        }


    }
}