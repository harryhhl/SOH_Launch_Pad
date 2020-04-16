using crystal.dao;
using crystal.util;
using crystal_po_api.util;
using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using SOH_LaunchPad_Approval.common;

namespace crystal_po_api.po.approval
{
    /// <summary> 
    /// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    /// Purpose     : 直接返回数量
    /// Date        : 07 Sep 2016
    /// Author      : Max
    /// Note        : this page is copy from list.aspx
    /// -------------------------------------------------
    /// 07 Sep 2016     Max         the first version
    /// 05 Apr 2017     Max         把当前用户传递给list_count函数
    /// 
    ///    the last update: 2017-04-05 11:33
    /// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    /// </summary>
    public partial class list_count : BasePOApprovalPage
    {
        private static DateTime DEFAULT_FROM_DATE = new DateTime(DateTime.Now.Year, 1, 1);

        protected override bool accessible()
        {
            bool accessible = base.accessible();
            return accessible;
        }

        public override RequestResult doRequest(object sender, EventArgs e)
        {
            string input;
            using (StreamReader reader = new StreamReader(Request.InputStream))
            {
                input = reader.ReadToEnd();
            }

            string releaseCodesStr = HttpUtility.ParseQueryString(input).Get("releaseCode");
            string releaseGroupsStr = HttpUtility.ParseQueryString(input).Get("releaseGroup");
            string fromPONumber = HttpUtility.ParseQueryString(input).Get("fromPONumber");
            string toPONumber = HttpUtility.ParseQueryString(input).Get("toPONumber");
            string fromDocDateStr = HttpUtility.ParseQueryString(input).Get("fromDocDate");
            string toDocDateStr = HttpUtility.ParseQueryString(input).Get("toDOcDate");
            string releasedStr = HttpUtility.ParseQueryString(input).Get("released");
            string fromVendorCode = HttpUtility.ParseQueryString(input).Get("fromVendorCode");
            string toVendorCode = HttpUtility.ParseQueryString(input).Get("toVendorCode");
            string vendorName = HttpUtility.ParseQueryString(input).Get("vendorName");
            string poType = HttpUtility.ParseQueryString(input).Get("poType");
            string userid = HttpUtility.ParseQueryString(input).Get("name");

            string[] releaseCodes = releaseCodesStr == null ? null : releaseCodesStr.Split(new char[] { ',' });
            string[] releaseGroups = releaseGroupsStr == null || releaseGroupsStr.Length < 1 ? null : releaseGroupsStr.Split(new char[] { ',' });


            Dictionary<string, string> docType_Dic = ConfigUtil.getPO_DocType(poType);

            Boolean? released = null;
            if (releaseCodes == null || releaseCodes.Length == 0)
            {
                //return RequestResult.Error("missing releaseCode");
                return RequestResult.Ok(0);
            }
            if (releasedStr != null)
            {
                released = releasedStr.Equals("true");
            }
            else
            {
                released = false;
            }

            DateTime? fromDocDate = null;
            if (fromDocDateStr != null)
            {
                fromDocDate = DateTime.ParseExact(fromDocDateStr, "ddMMyyyy", null);
            }
            if (fromDocDate == null)
            {
                fromDocDate = DEFAULT_FROM_DATE;
            }
            DateTime? toDocDate = null;
            if (toDocDateStr != null)
            {
                toDocDate = DateTime.ParseExact(toDocDateStr, "ddMMyyyy", null);
            }

            RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.SAP_DEST_NAME);
            PODao dao = new PODao();

            var u = new crystal.model.User { id = userid };
            
            int count = dao.list_count(dest, releaseGroups, releaseCodes, fromVendorCode, toVendorCode, vendorName,
                fromPONumber, toPONumber, fromDocDate, toDocDate, docType_Dic, released, u);

            return RequestResult.Ok(count);


        }
    }
}