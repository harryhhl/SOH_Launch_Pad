using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.SessionState;
using Newtonsoft.Json;

namespace SOH_LaunchPad_Web.Approval.PO
{
    /// <summary>
    /// Summary description for GetPOPrintPreview
    /// </summary>
    public class GetPOPrintPreview : IHttpHandler, IRequiresSessionState
    {
        public void ProcessRequest(HttpContext context)
        {
            string sid = context.Request["sid"] == null ? "" : context.Request["sid"].ToString();

            if (sid.Length > 0)
            {
                string detailJson = HttpContext.Current.Session["POApprovalDetail_" + sid] as string;
                if (!string.IsNullOrEmpty(detailJson))
                {
                    List<ReportFileData> list = JsonConvert.DeserializeObject<List<ReportFileData>>(detailJson);
                    if (list.Count > 0)
                    {
                        ReportFileData d = list[0];
                        context.Response.ContentType = "application/pdf";
                        context.Response.AppendHeader("Content-Disposition", $"inline; filename=\"{d.FileName}\"");
                        context.Response.Cache.SetExpires(DateTime.Now.AddHours(1));
                        context.Response.Cache.SetCacheability(HttpCacheability.Public);

                        context.Response.BinaryWrite(Convert.FromBase64String(d.FileDataBase64));
                        return;
                    }
                }
            }

            context.Response.ContentType = "text/plain";
            context.Response.Write("");
        }

        public class ReportFileData
        {
            public string FileName;
            public string FileDataBase64;
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}