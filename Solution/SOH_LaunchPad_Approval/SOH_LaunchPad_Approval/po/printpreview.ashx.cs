using System;
using System.IO;
using System.Collections.Generic;
using System.Web;
using System.Threading.Tasks;
using Newtonsoft.Json;
using SOH_LaunchPad_Approval.common;
using SOH_LaunchPad_Approval.po.src;

namespace SOH_LaunchPad_Approval.po
{
    /// <summary>
    /// Summary description for printpreview
    /// </summary>
    public class printpreview : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            if (HttpContext.Current.Request.HttpMethod == "POST")
            {
                string input;
                using (StreamReader reader = new StreamReader(context.Request.InputStream))
                {
                    input = reader.ReadToEnd();
                }
                var token = HttpUtility.ParseQueryString(input).Get("Token");
                var sysfuncid = HttpUtility.ParseQueryString(input).Get("FuncID");
                var pono = HttpUtility.ParseQueryString(input).Get("PONo");
                var guid = HttpUtility.ParseQueryString(input).Get("Guid");

                try
                {
                    DAO dao = new DAO();
                    dao.PrintPreview(pono, guid);

                    RequestResult ret = RequestResult.Create(RequestResult.ResultStatus.Success, "", "");

                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(ret));
                }
                catch (Exception ex)
                {
                    RequestResult result = RequestResult.Error(ex.Message);
                    context.Response.ContentType = "application/json";
                    context.Response.Write(JsonConvert.SerializeObject(result));
                }

                context.Response.StatusCode = 200;
                context.Response.StatusDescription = "OK";
            }
            else
            {
                context.Response.StatusCode = 405;
                context.Response.StatusDescription = "Sorry, only POST method allowed";
            }
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