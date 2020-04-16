using crystal.dao;
using crystal_po_api.util;
using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using SOH_LaunchPad_Approval.common;

namespace crystal_po_api.po.approval
{
    public partial class release : BasePOApprovalPage
    {
        public override RequestResult doRequest(object sender, EventArgs e)
        {
            string input;
            using (StreamReader reader = new StreamReader(Request.InputStream))
            {
                input = reader.ReadToEnd();
            }

            string releaseCodesStr = HttpUtility.ParseQueryString(input).Get("releaseCode");
            string poNumbersStr = HttpUtility.ParseQueryString(input).Get("poNumber");
            string userid = HttpUtility.ParseQueryString(input).Get("name");

            string[] releaseCodes = releaseCodesStr == null ? null : releaseCodesStr.Split(new char[] { ',' });
            string[] poNumbers = poNumbersStr == null ? null : poNumbersStr.Split(new char[] { ',' });

            RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.SAP_DEST_NAME);
            PODao dao = new PODao();

            dao.release(dest, poNumbers, releaseCodes, userid);
            return RequestResult.Ok();
        }
    }
}