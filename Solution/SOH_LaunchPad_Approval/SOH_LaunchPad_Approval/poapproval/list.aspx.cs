using crystal.dao;
using crystal.dto;
using crystal.util;
using crystal_po_api.util;
using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using SOH_LaunchPad_Approval.common;

/*
 * -------------------------------------------------

 */
namespace crystal_po_api.po.approval
{
    public partial class list : BasePOApprovalPage
    {
        //private static DateTime DEFAULT_FROM_DATE = DateTime.Now.AddDays(-14);
        private static DateTime DEFAULT_FROM_DATE = new DateTime(2015, 1, 1);

        public override RequestResult doRequest(object sender, EventArgs e)
        {
            string input;
            using (StreamReader reader = new StreamReader(Request.InputStream))
            {
                input = reader.ReadToEnd();
            }

            string[] docTypes = null;

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

            string[] releaseCodes = releaseCodesStr == null? null : releaseCodesStr.Split(new char[] { ',' });
            string[] releaseGroups = releaseGroupsStr == null || releaseGroupsStr.Length < 1? null : releaseGroupsStr.Split(new char[] { ',' });

            Boolean? released = null;
            if (releaseCodes == null || releaseCodes.Length == 0) 
            {
                return RequestResult.Error("missing releaseCode");
            }
            if(poType == null)
            {
                return RequestResult.Error("missing poType");
            }
            if (releasedStr != null)
            {
                released = releasedStr.Equals("true");
            }
            //else
            //{
            //    return Result.Error("missing released");
            //}

            Dictionary<string, string> docType_Dic = ConfigUtil.getPO_DocType(poType);

            DateTime? fromDocDate = null;
            if (fromDocDateStr != null)
            {
                fromDocDate = DateTime.ParseExact(fromDocDateStr, "ddMMyyyy", null);
            }
            if (released.HasValue && released.Value)
            {
                if (fromDocDate == null)
                {
                    fromDocDate = DEFAULT_FROM_DATE;
                }
            }
            DateTime? toDocDate = null;
            if (toDocDateStr != null)
            {
                toDocDate = DateTime.ParseExact(toDocDateStr, "ddMMyyyy", null);
            }

            RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.SAP_DEST_NAME);
            PODao dao = new PODao();

            var u = new crystal.model.User { id = userid };

            List<PO> d = dao.list1(dest, releaseGroups, releaseCodes, fromVendorCode, toVendorCode, vendorName,
                fromPONumber, toPONumber, fromDocDate, toDocDate, docType_Dic, released, u);

            return RequestResult.Ok(d);
        }
    }
}