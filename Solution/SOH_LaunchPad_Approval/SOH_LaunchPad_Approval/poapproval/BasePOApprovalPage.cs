using crystal.dao;
using crystal.model;
using crystal.util;
using crystal_po_api.util;
using SAP.Middleware.Connector;
using System;
using System.Diagnostics;
using Newtonsoft.Json;
using SOH_LaunchPad_Approval.common;

namespace crystal_po_api.po.approval
{
    public abstract class BasePOApprovalPage : System.Web.UI.Page
    {
        String poType="";

        protected void Page_Load(object sender, EventArgs e)
        {
            Response.CacheControl = "no-cache";
            Response.AddHeader("Pragma", "no-cache");
            Response.Expires = -1;
            Response.AddHeader("Content-Type", "application/json");
            try
            {
                if (accessible())
                {
                    RequestResult r = doRequest(sender, e);

                    Response.Write(JsonConvert.SerializeObject(r));
                }
                else
                {
                    //Response.Write(getJsonizer().Serialize(Result.Access("Session Timeout. Please try again!")));
                    throw new TokenException();
                }
            }
            catch (Exception ex)
            {
                Response.Write(JsonConvert.SerializeObject(RequestResult.Error(ex.Message)));
            }
        }

        public bool debug()
        {
            Boolean debug = false;
            String debugStr = Request.Params["debug"];
            if (debugStr != null)
            {
                debug = debugStr.Equals("true");
            }
            return debug;
        }

        protected virtual bool accessible()
        {
            //2015-09-07 Arvin Add
            poType = Request.Params["poType"];//PoType=AppID
            //2015-09-07 Arvin Update
            //return Util.validateToken(Request, poType, false, debug());
            return true;
        }

        public abstract RequestResult doRequest(Object sender, EventArgs e);

        public crystal.model.User getUser()
        {
            //2015-09-07 Arvin Update
            crystal.model.User u = Util.getUserWithoutAccessibleAppsFromToken(Request, poType, debug());
            RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.SAP_DEST_NAME);
            UserDao dao = new UserDao(dest);

            //using (TokenServiceSoap.TokenServiceSoapClient client = new TokenServiceSoap.TokenServiceSoapClient("TokenServiceSoap"))
            //{
            //    //2015-09-07 Arvin Update
            //    TokenServiceSoap.SapIdResponse resp = client.getSapId(u.name, u.deviceId, u.token, poType, debug());
            //    if (resp.hasException)
            //    {
            //        throw new Exception(resp.msg);
            //    }
            //    u.id = resp.id;
            //}
            return u;
        }
    }
}