using crystal.model;
using crystal.util;
using crystal_po_api.util;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace crystal_po_api.po.approval
{
    public partial class login : BasePage
    {
        public override Result doRequest(object sender, EventArgs e)
        {
            //2015-09-07 Arvin Add
            String poType = Request.Params["poType"];//PoType=AppID

            //Result r =  LoginUtil.doLogin(Request.Params["name"], Request.Params["password"],
            //    Request.Params["domain"], Request.Params["deviceId"], Util.PO_APPROVAL, debug());

            //2015-09-07 Arvin Update
            Result r =  LoginUtil.doLogin(Request.Params["name"], Request.Params["password"],
                Request.Params["domain"], Request.Params["deviceId"], poType, debug());
            return r;
        }

        public override User getUser()
        {
            throw new Exception("not login");

        }
    }
}